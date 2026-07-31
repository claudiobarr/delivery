import { Controller, Post, Body, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto, AppleLoginDto } from './dto/social-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
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

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = this.authService.register(dto);
    return result.then((r) => this.setTokenCookie(res, r));
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = this.authService.login(dto);
    return result.then((r) => this.setTokenCookie(res, r));
  }

  @Post('google')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  googleLogin(@Body() dto: GoogleLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = this.authService.googleLogin(dto);
    return result.then((r) => this.setTokenCookie(res, r));
  }

  @Post('apple')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  appleLogin(@Body() dto: AppleLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = this.authService.appleLogin(dto);
    return result.then((r) => this.setTokenCookie(res, r));
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = this.authService.googleLogin(req.user);
    return result.then((r) => this.setTokenCookie(res, r));
  }

  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  appleCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = this.authService.appleLogin(req.user);
    return result.then((r) => this.setTokenCookie(res, r));
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
