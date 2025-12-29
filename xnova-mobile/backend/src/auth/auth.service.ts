import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && await this.userService.validatePassword(user, password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto) {
    try {
      const user = await this.userService.create(
        registerDto.email,
        registerDto.password,
        registerDto.playerName,
      );

      const payload = { email: user.email, sub: user._id };
      
      return {
        message: '회원가입이 완료되었습니다.',
        user: {
          id: user._id,
          email: user.email,
          playerName: user.playerName,
          coordinate: user.coordinate,
        },
        accessToken: this.jwtService.sign(payload),
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('회원가입 중 오류가 발생했습니다.');
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };
    
    return {
      message: '로그인 성공',
      user: {
        id: user._id,
        email: user.email,
        playerName: user.playerName,
        coordinate: user.coordinate,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    
    const { password, ...result } = user.toObject();
    return result;
  }
}

