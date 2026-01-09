import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수입니다.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(100, { message: '비밀번호는 최대 100자까지 가능합니다.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: '비밀번호는 대문자, 소문자, 숫자, 특수문자(@$!%*?&)를 각각 1개 이상 포함해야 합니다.' }
  )
  password: string;

  @IsString()
  @IsNotEmpty({ message: '플레이어 이름은 필수입니다.' })
  @MinLength(2, { message: '플레이어 이름은 최소 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '플레이어 이름은 최대 20자까지 가능합니다.' })
  playerName: string;
}

export class LoginDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수입니다.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  password: string;
}

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty({ message: 'Google ID 토큰은 필수입니다.' })
  idToken: string;
}

export class GoogleCompleteDto {
  @IsString()
  @IsNotEmpty({ message: 'Google ID 토큰은 필수입니다.' })
  idToken: string;

  @IsString()
  @IsNotEmpty({ message: '플레이어 이름은 필수입니다.' })
  @MinLength(2, { message: '플레이어 이름은 최소 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '플레이어 이름은 최대 20자까지 가능합니다.' })
  playerName: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh Token은 필수입니다.' })
  refreshToken: string;
}

export class LogoutDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh Token은 필수입니다.' })
  refreshToken: string;
}

// 카카오톡 연동용 DTO
export class KakaoLinkVerifyDto {
  @IsString()
  @IsNotEmpty({ message: '인증코드는 필수입니다.' })
  @MinLength(6, { message: '인증코드는 6자리입니다.' })
  @MaxLength(6, { message: '인증코드는 6자리입니다.' })
  code: string;
}

