import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { BlacklistedToken, BlacklistedTokenDocument } from '../schemas/blacklisted-token.schema';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  userAgent: string;
  ipAddress: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(BlacklistedToken.name) private blacklistedTokenModel: Model<BlacklistedTokenDocument>,
  ) {
    const secret = configService.get<string>('jwt.secret');
    
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true, // Request 객체를 콜백에 전달
    });
  }

  private hashString(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  async validate(req: Request, payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // 토큰 블랙리스트 체크
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token) {
      const isBlacklisted = await this.blacklistedTokenModel.findOne({
        token: this.hashString(token),
      });
      
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // User-Agent 검증
    const currentUserAgent = req.headers['user-agent'] || 'unknown';
    const hashedCurrentUserAgent = this.hashString(currentUserAgent);
    
    if (payload.userAgent && payload.userAgent !== hashedCurrentUserAgent) {
      // User-Agent가 다르면 토큰 탈취 의심
      throw new UnauthorizedException('Token validation failed: device mismatch');
    }

    return { 
      userId: payload.sub, 
      email: payload.email,
    };
  }
}
