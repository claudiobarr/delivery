import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, PartnerStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const isPartner = dto.isPartner && dto.storeName;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone,
        role: isPartner ? UserRole.PARTNER : UserRole.CUSTOMER,
        storeName: isPartner ? dto.storeName : undefined,
        storeDescription: isPartner ? dto.storeDescription : undefined,
        cnpj: isPartner ? dto.cnpj : undefined,
        partnerStatus: isPartner ? PartnerStatus.PENDING : undefined,
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.password) throw new UnauthorizedException('Use social login');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

  async googleLogin(dto: { token: string; name?: string; avatarUrl?: string }) {
    let profile: any;

    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${dto.token}`);
      if (!response.ok) throw new Error('Invalid token');
      profile = await response.json();
    } catch {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${dto.token}`);
      if (!response.ok) throw new UnauthorizedException('Invalid Google token');
      profile = await response.json();
    }

    const googleId = profile.sub || profile.id;
    const email = profile.email;
    const name = dto.name || profile.name;
    const avatarUrl = dto.avatarUrl || profile.picture;

    if (!email) throw new UnauthorizedException('Google account has no email');

    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl },
        });
      } else {
        user = await this.prisma.user.create({
          data: { email, name, googleId, avatarUrl },
        });
      }
    }

    return this.generateTokens(user);
  }

  async appleLogin(profile: any) {
    let user = await this.prisma.user.findUnique({
      where: { appleId: profile.appleId },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { appleId: profile.appleId },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            appleId: profile.appleId,
          },
        });
      }
    }

    return this.generateTokens(user);
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

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        avatarUrl: true,
        storeName: true,
        storeDescription: true,
        storeLogo: true,
        cnpj: true,
        partnerStatus: true,
      },
    });
  }
}
