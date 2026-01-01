import { Controller, Post, Body, UseGuards, Request, Get, Headers, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, GoogleAuthDto, GoogleCompleteDto, RefreshTokenDto, LogoutDto } from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private getClientInfo(req: any, userAgent: string, ip: string) {
    return {
      userAgent: userAgent || req.headers['user-agent'] || 'unknown',
      ipAddress: ip || req.ip || req.connection?.remoteAddress || 'unknown',
    };
  }

  // 회원가입 - Rate Limit 강화 (1분에 3회)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    const clientInfo = this.getClientInfo(req, userAgent, ip);
    return this.authService.register(registerDto, clientInfo);
  }

  // 로그인 - Rate Limit 강화 (1분에 5회)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() req,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    const clientInfo = this.getClientInfo(req, userAgent, ip);
    return this.authService.login(req.user, clientInfo);
  }

  // Google 인증
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('google')
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto,
    @Request() req,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    const clientInfo = this.getClientInfo(req, userAgent, ip);
    return this.authService.googleAuth(googleAuthDto, clientInfo);
  }

  // Google 회원가입 완료
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('google/complete')
  async completeGoogleSignup(
    @Body() googleCompleteDto: GoogleCompleteDto,
    @Request() req,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    const clientInfo = this.getClientInfo(req, userAgent, ip);
    return this.authService.completeGoogleSignup(googleCompleteDto, clientInfo);
  }

  // 토큰 갱신 - Rate Limit 완화
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    const clientInfo = this.getClientInfo(req, userAgent, ip);
    return this.authService.refreshTokens(refreshTokenDto.refreshToken, clientInfo);
  }

  // 로그아웃
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Request() req,
    @Body() logoutDto: LogoutDto,
    @Headers('authorization') authHeader: string,
  ) {
    const accessToken = authHeader?.replace('Bearer ', '') || '';
    await this.authService.logout(accessToken, logoutDto.refreshToken);
    return { message: '로그아웃 되었습니다.' };
  }

  // 모든 기기에서 로그아웃
  @UseGuards(JwtAuthGuard)
  @Post('logout/all')
  async logoutAllDevices(
    @Request() req,
    @Headers('authorization') authHeader: string,
  ) {
    const accessToken = authHeader?.replace('Bearer ', '') || '';
    await this.authService.logoutAllDevices(req.user.userId, accessToken);
    return { message: '모든 기기에서 로그아웃 되었습니다.' };
  }

  // 프로필 조회
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }
}
