import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { RegisterDto, GoogleAuthDto, GoogleCompleteDto } from './dto/auth.dto';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import { BlacklistedToken, BlacklistedTokenDocument } from './schemas/blacklisted-token.schema';

interface TokenPayload {
  email: string;
  sub: string;
  userAgent: string;
  ipAddress: string;
}

interface ClientInfo {
  userAgent: string;
  ipAddress: string;
}

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;
  private readonly ACCESS_TOKEN_EXPIRY_DAYS = 7; // 7일로 변경

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(BlacklistedToken.name) private blacklistedTokenModel: Model<BlacklistedTokenDocument>,
  ) {
    this.googleClient = new OAuth2Client();
  }

  // ===== 토큰 생성 =====
  
  private generateAccessToken(user: any, clientInfo: ClientInfo): string {
    const payload: TokenPayload = {
      email: user.email,
      sub: user._id.toString(),
      userAgent: this.hashString(clientInfo.userAgent),
      ipAddress: this.hashString(clientInfo.ipAddress),
    };
    return this.jwtService.sign(payload);
  }

  private async generateRefreshToken(userId: string, clientInfo: ClientInfo): Promise<string> {
    // 랜덤 토큰 생성
    const token = crypto.randomBytes(64).toString('hex');
    
    // 만료 시간 계산
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    // 기존 같은 기기의 토큰 무효화
    await this.refreshTokenModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        userAgent: clientInfo.userAgent,
        isRevoked: false,
      },
      { isRevoked: true }
    );

    // 새 토큰 저장
    await this.refreshTokenModel.create({
      userId: new Types.ObjectId(userId),
      token: this.hashString(token),
      userAgent: clientInfo.userAgent,
      ipAddress: clientInfo.ipAddress,
      expiresAt,
      isRevoked: false,
    });

    return token;
  }

  private hashString(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  // ===== 토큰 검증 =====

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.blacklistedTokenModel.findOne({
      token: this.hashString(token),
    });
    return !!blacklisted;
  }

  async validateRefreshToken(refreshToken: string, clientInfo: ClientInfo): Promise<RefreshTokenDocument | null> {
    const hashedToken = this.hashString(refreshToken);
    
    const storedToken = await this.refreshTokenModel.findOne({
      token: hashedToken,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      return null;
    }

    // User-Agent 검증 (IP는 변경될 수 있으므로 경고만)
    if (storedToken.userAgent !== clientInfo.userAgent) {
      // 의심스러운 활동 - 토큰 무효화
      await this.revokeRefreshToken(refreshToken);
      return null;
    }

    return storedToken;
  }

  // ===== 토큰 갱신 =====

  async refreshTokens(refreshToken: string, clientInfo: ClientInfo) {
    const storedToken = await this.validateRefreshToken(refreshToken, clientInfo);
    
    if (!storedToken) {
      throw new UnauthorizedException('유효하지 않거나 만료된 Refresh Token입니다.');
    }

    const user = await this.userService.findById(storedToken.userId.toString());
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // 기존 refresh token 무효화
    await this.revokeRefreshToken(refreshToken);

    // 새 토큰 발급
    const newAccessToken = this.generateAccessToken(user, clientInfo);
    const newRefreshToken = await this.generateRefreshToken(user._id.toString(), clientInfo);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY_DAYS * 24 * 60 * 60, // 초 단위
    };
  }

  // ===== 토큰 무효화 =====

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const hashedToken = this.hashString(refreshToken);
    await this.refreshTokenModel.updateOne(
      { token: hashedToken },
      { isRevoked: true }
    );
  }

  async blacklistAccessToken(accessToken: string, reason: string = 'logout'): Promise<void> {
    try {
      // 토큰 디코딩하여 만료 시간 가져오기
      const decoded = this.jwtService.decode(accessToken) as any;
      if (!decoded || !decoded.exp) {
        return;
      }

      const expiresAt = new Date(decoded.exp * 1000);
      
      // 이미 만료된 토큰은 블랙리스트에 추가하지 않음
      if (expiresAt < new Date()) {
        return;
      }

      await this.blacklistedTokenModel.create({
        token: this.hashString(accessToken),
        expiresAt,
        reason,
      });
    } catch {
      // 토큰이 이미 무효하면 무시
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { userId: new Types.ObjectId(userId), isRevoked: false },
      { isRevoked: true }
    );
  }

  // ===== 로그아웃 =====

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    // Access Token 블랙리스트에 추가
    await this.blacklistAccessToken(accessToken, 'logout');
    
    // Refresh Token 무효화
    await this.revokeRefreshToken(refreshToken);
  }

  async logoutAllDevices(userId: string, currentAccessToken: string): Promise<void> {
    // 현재 Access Token 블랙리스트에 추가
    await this.blacklistAccessToken(currentAccessToken, 'logout_all');
    
    // 모든 Refresh Token 무효화
    await this.revokeAllUserTokens(userId);
  }

  // ===== Google 인증 =====

  async verifyGoogleToken(idToken: string): Promise<{ email: string; googleId: string; name?: string }> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('google.clientId'),
      });
      const payload = ticket.getPayload();
      
      if (!payload || !payload.email || !payload.sub) {
        throw new BadRequestException('유효하지 않은 Google 토큰입니다.');
      }

      return {
        email: payload.email,
        googleId: payload.sub,
        name: payload.name,
      };
    } catch {
      throw new BadRequestException('Google 토큰 검증에 실패했습니다.');
    }
  }

  async googleAuth(googleAuthDto: GoogleAuthDto, clientInfo: ClientInfo) {
    const googleUser = await this.verifyGoogleToken(googleAuthDto.idToken);
    
    // 1. googleId로 기존 사용자 찾기
    let user = await this.userService.findByGoogleId(googleUser.googleId);
    
    if (user) {
      // 기존 구글 사용자 - 바로 로그인
      return this.login(user, clientInfo);
    }

    // 2. 이메일로 기존 사용자 찾기 (이메일/비밀번호로 가입한 사용자)
    user = await this.userService.findByEmail(googleUser.email);
    
    if (user) {
      // 기존 이메일 사용자에게 구글 계정 연동
      await this.userService.linkGoogleAccount(user._id.toString(), googleUser.googleId);
      return this.login(user, clientInfo);
    }

    // 3. 신규 사용자 - 닉네임 설정 필요
    return {
      needsNickname: true,
      email: googleUser.email,
      suggestedName: googleUser.name || '',
    };
  }

  async completeGoogleSignup(googleCompleteDto: GoogleCompleteDto, clientInfo: ClientInfo) {
    const googleUser = await this.verifyGoogleToken(googleCompleteDto.idToken);
    
    // 이미 가입된 사용자인지 확인
    const existingUser = await this.userService.findByGoogleId(googleUser.googleId);
    if (existingUser) {
      return this.login(existingUser, clientInfo);
    }

    // 이메일 중복 확인
    const existingEmailUser = await this.userService.findByEmail(googleUser.email);
    if (existingEmailUser) {
      // 기존 사용자에게 구글 계정 연동
      await this.userService.linkGoogleAccount(existingEmailUser._id.toString(), googleUser.googleId);
      return this.login(existingEmailUser, clientInfo);
    }

    try {
      const user = await this.userService.createGoogleUser(
        googleUser.email,
        googleUser.googleId,
        googleCompleteDto.playerName,
      );

      const accessToken = this.generateAccessToken(user, clientInfo);
      const refreshToken = await this.generateRefreshToken(user._id.toString(), clientInfo);
      
      return {
        message: '회원가입이 완료되었습니다.',
        user: {
          id: user._id,
          email: user.email,
          playerName: user.playerName,
          coordinate: user.coordinate,
        },
        accessToken,
        refreshToken,
        expiresIn: this.ACCESS_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('회원가입 중 오류가 발생했습니다.');
    }
  }

  // ===== 일반 인증 =====

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && await this.userService.validatePassword(user, password)) {
      const { password: _, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto, clientInfo: ClientInfo) {
    try {
      const user = await this.userService.create(
        registerDto.email,
        registerDto.password,
        registerDto.playerName,
      );

      const accessToken = this.generateAccessToken(user, clientInfo);
      const refreshToken = await this.generateRefreshToken(user._id.toString(), clientInfo);
      
      return {
        message: '회원가입이 완료되었습니다.',
        user: {
          id: user._id,
          email: user.email,
          playerName: user.playerName,
          coordinate: user.coordinate,
        },
        accessToken,
        refreshToken,
        expiresIn: this.ACCESS_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('회원가입 중 오류가 발생했습니다.');
    }
  }

  async login(user: any, clientInfo: ClientInfo) {
    const accessToken = this.generateAccessToken(user, clientInfo);
    const refreshToken = await this.generateRefreshToken(user._id.toString(), clientInfo);
    
    return {
      message: '로그인 성공',
      user: {
        id: user._id,
        email: user.email,
        playerName: user.playerName,
        coordinate: user.coordinate,
      },
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    
    const { password: _, ...result } = user.toObject();
    return result;
  }
}
