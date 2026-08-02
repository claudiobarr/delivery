import { Controller, Post, Get, Delete, Body, Param, UseGuards, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PasskeysService } from './passkeys.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth/passkeys')
export class PasskeysController {
  constructor(
    private passkeysService: PasskeysService,
    private configService: ConfigService,
  ) {}

  private setTokenCookie(res: Response, result: { accessToken: string; user: any }) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { user: result.user };
  }

  @Post('register/options')
  @UseGuards(JwtAuthGuard)
  registerOptions(@CurrentUser() user: any) {
    return this.passkeysService.generateRegistrationOptions(user);
  }

  @Post('register/verify')
  @UseGuards(JwtAuthGuard)
  registerVerify(
    @CurrentUser() user: any,
    @Body() body: { response: any; deviceName?: string },
  ) {
    return this.passkeysService.verifyRegistration(user, body.response, body.deviceName);
  }

  @Post('login/options')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  loginOptions(@Body() body: { userId?: string }) {
    return this.passkeysService.generateLoginOptions(body?.userId);
  }

  @Post('login/verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async loginVerify(@Body() body: { response: any }, @Res({ passthrough: true }) res: Response) {
    const result = await this.passkeysService.verifyLogin(body.response);
    this.setTokenCookie(res, result);
    return { user: result.user };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: any) {
    return this.passkeysService.list(user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.passkeysService.remove(user.id, id);
  }
}
