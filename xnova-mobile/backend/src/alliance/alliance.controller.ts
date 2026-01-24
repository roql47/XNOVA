import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AllianceService } from './alliance.service';
import {
  CreateAllianceDto,
  ApplyAllianceDto,
  UpdateAllianceSettingsDto,
  CreateRankDto,
  UpdateRankDto,
  UpdateMemberRankDto,
  UpdateAllianceNameDto,
  UpdateAllianceTagDto,
  TransferAllianceDto,
  RejectApplicationDto,
  CircularMessageDto,
} from './dto/alliance.dto';

@Controller('alliance')
@UseGuards(JwtAuthGuard)
export class AllianceController {
  constructor(private readonly allianceService: AllianceService) {}

  // ===== 연합 미가입 상태 API =====

  // 연합 생성
  @Post('create')
  async createAlliance(@Request() req, @Body() dto: CreateAllianceDto) {
    return this.allianceService.createAlliance(req.user.userId, dto);
  }

  // 연합 검색 (빈 쿼리 시 전체 연합 반환)
  @Get('search')
  async searchAlliances(@Query('query') query?: string) {
    return this.allianceService.searchAlliances(query?.trim() || '');
  }

  // 특정 연합 정보 조회 (공개)
  @Get('info/:id')
  async getAlliancePublic(@Param('id') id: string) {
    return this.allianceService.getAlliancePublic(id);
  }

  // 가입 신청
  @Post(':id/apply')
  async applyToAlliance(
    @Request() req,
    @Param('id') allianceId: string,
    @Body() dto: ApplyAllianceDto,
  ) {
    return this.allianceService.applyToAlliance(req.user.userId, allianceId, dto);
  }

  // 가입 신청 취소
  @Delete('application')
  async cancelApplication(@Request() req) {
    return this.allianceService.cancelApplication(req.user.userId);
  }

  // ===== 연합 가입 후 API =====

  // 내 연합 정보 조회
  @Get()
  async getMyAlliance(@Request() req) {
    return this.allianceService.getMyAlliance(req.user.userId);
  }

  // 연합 탈퇴
  @Post('leave')
  async leaveAlliance(@Request() req) {
    return this.allianceService.leaveAlliance(req.user.userId);
  }

  // ===== 멤버 관리 API =====

  // 멤버 목록 조회
  @Get('members')
  async getMembers(@Request() req) {
    return this.allianceService.getMembers(req.user.userId);
  }

  // 멤버 계급 변경
  @Put('member/:id/rank')
  async updateMemberRank(
    @Request() req,
    @Param('id') memberId: string,
    @Body() dto: UpdateMemberRankDto,
  ) {
    return this.allianceService.updateMemberRank(req.user.userId, memberId, dto);
  }

  // 멤버 추방
  @Delete('member/:id')
  async kickMember(@Request() req, @Param('id') memberId: string) {
    return this.allianceService.kickMember(req.user.userId, memberId);
  }

  // ===== 가입 신청 관리 API =====

  // 가입 신청 목록 조회
  @Get('applications')
  async getApplications(@Request() req) {
    return this.allianceService.getApplications(req.user.userId);
  }

  // 가입 신청 승인
  @Post('application/:id/accept')
  async acceptApplication(@Request() req, @Param('id') applicantId: string) {
    return this.allianceService.acceptApplication(req.user.userId, applicantId);
  }

  // 가입 신청 거절
  @Post('application/:id/reject')
  async rejectApplication(
    @Request() req,
    @Param('id') applicantId: string,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.allianceService.rejectApplication(req.user.userId, applicantId, dto);
  }

  // ===== 연합 설정 API =====

  // 연합 설정 수정
  @Put('settings')
  async updateSettings(@Request() req, @Body() dto: UpdateAllianceSettingsDto) {
    return this.allianceService.updateSettings(req.user.userId, dto);
  }

  // 연합 이름 변경
  @Put('name')
  async updateName(@Request() req, @Body() dto: UpdateAllianceNameDto) {
    return this.allianceService.updateName(req.user.userId, dto.name);
  }

  // 연합 태그 변경
  @Put('tag')
  async updateTag(@Request() req, @Body() dto: UpdateAllianceTagDto) {
    return this.allianceService.updateTag(req.user.userId, dto.tag);
  }

  // ===== 계급 관리 API =====

  // 계급 목록 조회
  @Get('ranks')
  async getRanks(@Request() req) {
    return this.allianceService.getRanks(req.user.userId);
  }

  // 계급 생성
  @Post('ranks')
  async createRank(@Request() req, @Body() dto: CreateRankDto) {
    return this.allianceService.createRank(req.user.userId, dto);
  }

  // 계급 수정
  @Put('ranks/:name')
  async updateRank(
    @Request() req,
    @Param('name') rankName: string,
    @Body() dto: UpdateRankDto,
  ) {
    return this.allianceService.updateRank(req.user.userId, rankName, dto);
  }

  // 계급 삭제
  @Delete('ranks/:name')
  async deleteRank(@Request() req, @Param('name') rankName: string) {
    return this.allianceService.deleteRank(req.user.userId, rankName);
  }

  // ===== 연합 관리 API =====

  // 연합 양도
  @Post('transfer')
  async transferAlliance(@Request() req, @Body() dto: TransferAllianceDto) {
    return this.allianceService.transferAlliance(req.user.userId, dto.newOwnerId);
  }

  // 연합 해산
  @Delete()
  async dissolveAlliance(@Request() req) {
    return this.allianceService.dissolveAlliance(req.user.userId);
  }

  // 회람 메시지 발송
  @Post('circular')
  async sendCircularMessage(@Request() req, @Body() dto: CircularMessageDto) {
    return this.allianceService.sendCircularMessage(req.user.userId, dto);
  }
}
