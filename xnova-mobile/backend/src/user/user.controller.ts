import { Controller, Get, Put, Post, Delete, UseGuards, Request, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';

// DTO 정의
class UpdatePlanetNameDto {
  planetName: string;
}

class UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

class ConfirmPasswordDto {
  password: string;
}

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.userService.findById(req.user.userId);
    if (!user) {
      return { error: '사용자를 찾을 수 없습니다.' };
    }
    
    // 비밀번호 제외하고 반환
    const { password, ...result } = user.toObject();
    return result;
  }

  // 행성 이름 변경
  @UseGuards(JwtAuthGuard)
  @Put('planet-name')
  async updatePlanetName(@Request() req, @Body() dto: UpdatePlanetNameDto) {
    if (!dto.planetName || dto.planetName.trim().length < 2) {
      return { success: false, message: '행성 이름은 2자 이상이어야 합니다.' };
    }
    if (dto.planetName.trim().length > 20) {
      return { success: false, message: '행성 이름은 20자 이하여야 합니다.' };
    }

    const user = await this.userService.updatePlanetName(req.user.userId, dto.planetName.trim());
    if (!user) {
      return { success: false, message: '행성 이름 변경에 실패했습니다.' };
    }

    return { success: true, message: '행성 이름이 변경되었습니다.', planetName: dto.planetName.trim() };
  }

  // 비밀번호 변경
  @UseGuards(JwtAuthGuard)
  @Put('password')
  async updatePassword(@Request() req, @Body() dto: UpdatePasswordDto) {
    if (!dto.newPassword || dto.newPassword.length < 6) {
      return { success: false, message: '새 비밀번호는 6자 이상이어야 합니다.' };
    }

    return this.userService.updatePassword(req.user.userId, dto.currentPassword, dto.newPassword);
  }

  // 휴가 모드 상태 확인
  @UseGuards(JwtAuthGuard)
  @Get('vacation')
  async getVacationStatus(@Request() req) {
    const user = await this.userService.findById(req.user.userId);
    if (!user) {
      return { error: '사용자를 찾을 수 없습니다.' };
    }

    const canActivate = await this.userService.canActivateVacation(req.user.userId);

    return {
      isActive: user.vacationMode?.isActive || false,
      startTime: user.vacationMode?.startTime || null,
      minEndTime: user.vacationMode?.minEndTime || null,
      canActivate: canActivate.canActivate,
      canActivateReason: canActivate.reason,
    };
  }

  // 휴가 모드 활성화
  @UseGuards(JwtAuthGuard)
  @Post('vacation')
  async activateVacation(@Request() req) {
    return this.userService.activateVacation(req.user.userId);
  }

  // 휴가 모드 해제
  @UseGuards(JwtAuthGuard)
  @Delete('vacation')
  async deactivateVacation(@Request() req) {
    return this.userService.deactivateVacation(req.user.userId);
  }

  // 계정 초기화
  @UseGuards(JwtAuthGuard)
  @Post('reset')
  async resetAccount(@Request() req, @Body() dto: ConfirmPasswordDto) {
    return this.userService.resetAccount(req.user.userId, dto.password || '');
  }

  // 계정 탈퇴
  @UseGuards(JwtAuthGuard)
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Request() req, @Body() dto: ConfirmPasswordDto) {
    return this.userService.deleteAccount(req.user.userId, dto.password || '');
  }
}

