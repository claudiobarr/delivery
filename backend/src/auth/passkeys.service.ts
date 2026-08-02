import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoUint8Array, isoBase64URL } from '@simplewebauthn/server/helpers';
import { AuthenticatorTransportFuture } from '@simplewebauthn/typescript-types';
import { UserRole } from '@prisma/client';

interface PendingChallenge {
  challenge: string;
  userId: string;
  expiresAt: number;
}

@Injectable()
export class PasskeysService {
  private challenges = new Map<string, PendingChallenge>();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  private get rpId() {
    return this.configService.get('WEBAUTHN_RP_ID') || 'localhost';
  }

  private get rpName() {
    return this.configService.get('WEBAUTHN_RP_NAME') || 'Delivery App';
  }

  private get origin() {
    return this.configService.get('WEBAUTHN_ORIGIN') || 'http://localhost:3000';
  }

  private storeChallenge(key: string, userId: string, challenge: string) {
    this.challenges.set(key, {
      challenge,
      userId,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
  }

  private takeChallenge(key: string): PendingChallenge {
    const entry = this.challenges.get(key);
    if (!entry) throw new BadRequestException('Challenge not found. Start a new request.');
    this.challenges.delete(key);
    if (Date.now() > entry.expiresAt) throw new BadRequestException('Challenge expired. Try again.');
    return entry;
  }

  private isWebAuthnSupported() {
    if (typeof globalThis.crypto?.subtle === 'undefined') {
      throw new Error('WebCrypto not available on this runtime');
    }
  }

  async generateRegistrationOptions(user: any) {
    this.isWebAuthnSupported();

    const existing = await this.prisma.passkey.findMany({
      where: { userId: user.id },
      select: { credentialId: true, transports: true },
    });

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userID: isoUint8Array.fromUTF8String(user.id),
      userName: user.email,
      userDisplayName: user.name || user.email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
      excludeCredentials: existing.map((p) => ({
        id: p.credentialId,
        transports: p.transports as AuthenticatorTransportFuture[],
      })),
    });

    this.storeChallenge(`register:${user.id}`, user.id, options.challenge);
    return options;
  }

  async verifyRegistration(user: any, response: any, deviceName?: string) {
    this.isWebAuthnSupported();
    const expected = this.takeChallenge(`register:${user.id}`);

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: expected.challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpId,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Registration verification failed');
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    const existing = await this.prisma.passkey.findUnique({
      where: { credentialId: credential.id },
    });
    if (existing) throw new BadRequestException('Credential already registered');

    await this.prisma.passkey.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: (response.response.transports || []) as string[],
        deviceName: deviceName || 'Meu dispositivo',
      },
    });

    return { verified: true, credentialDeviceType, credentialBackedUp };
  }

  async generateLoginOptions(userId?: string) {
    this.isWebAuthnSupported();

    const user = userId
      ? await this.prisma.user.findUnique({ where: { id: userId } })
      : undefined;

    const allowCredentials = user
      ? (await this.prisma.passkey.findMany({
          where: { userId: user.id },
          select: { credentialId: true, transports: true },
        })).map((p) => ({
          id: p.credentialId,
          transports: p.transports as AuthenticatorTransportFuture[],
        }))
      : undefined;

    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      allowCredentials,
      userVerification: 'preferred',
    });

    const key = `login:${options.challenge}`;
    this.storeChallenge(key, userId || '', options.challenge);
    return options;
  }

  async verifyLogin(response: any) {
    this.isWebAuthnSupported();
    const expected = this.takeChallenge(`login:${response.challenge || ''}`);
    if (!expected) throw new BadRequestException('Challenge not found');

    const passkey = await this.prisma.passkey.findUnique({
      where: { credentialId: response.id },
      include: { user: true },
    });
    if (!passkey) throw new UnauthorizedException('Passkey not registered');

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: expected.challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpId,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports as AuthenticatorTransportFuture[],
      },
      requireUserVerification: false,
    });

    if (!verification.verified) throw new UnauthorizedException('Authentication failed');

    await this.prisma.passkey.update({
      where: { id: passkey.id },
      data: { counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() },
    });

    return this.generateTokens(passkey.user);
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        storeName: user.storeName,
        storeDescription: user.storeDescription,
        storeLogo: user.storeLogo,
        cnpj: user.cnpj,
        partnerStatus: user.partnerStatus,
      },
    };
  }

  async list(userId: string) {
    return this.prisma.passkey.findMany({
      where: { userId },
      select: {
        id: true,
        deviceName: true,
        createdAt: true,
        lastUsedAt: true,
        transports: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, passkeyId: string) {
    const passkey = await this.prisma.passkey.findFirst({
      where: { id: passkeyId, userId },
    });
    if (!passkey) throw new NotFoundException('Passkey not found');

    await this.prisma.passkey.delete({ where: { id: passkeyId } });
    return { message: 'Passkey removed' };
  }
}
