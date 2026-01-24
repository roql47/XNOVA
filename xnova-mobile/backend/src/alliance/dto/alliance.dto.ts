import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// 연합 생성 DTO
export class CreateAllianceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: '연합 태그는 최소 3자 이상이어야 합니다.' })
  @MaxLength(8, { message: '연합 태그는 최대 8자까지 가능합니다.' })
  tag: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(35, { message: '연합 이름은 최대 35자까지 가능합니다.' })
  name: string;
}

// 연합 검색 DTO
export class SearchAllianceDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}

// 가입 신청 DTO
export class ApplyAllianceDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '가입 신청 메시지는 최대 500자까지 가능합니다.' })
  message?: string;
}

// 가입 신청 거절 DTO
export class RejectApplicationDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}

// 연합 설정 수정 DTO
export class UpdateAllianceSettingsDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  externalText?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  internalText?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  logo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  website?: string;

  @IsBoolean()
  @IsOptional()
  isOpen?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  ownerTitle?: string;
}

// 연합 이름/태그 변경 DTO
export class UpdateAllianceNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(35)
  name: string;
}

export class UpdateAllianceTagDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(8)
  tag: string;
}

// 계급 생성 DTO
export class CreateRankDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @IsBoolean()
  @IsOptional()
  delete?: boolean;

  @IsBoolean()
  @IsOptional()
  kick?: boolean;

  @IsBoolean()
  @IsOptional()
  applications?: boolean;

  @IsBoolean()
  @IsOptional()
  memberlist?: boolean;

  @IsBoolean()
  @IsOptional()
  manageApplications?: boolean;

  @IsBoolean()
  @IsOptional()
  administrate?: boolean;

  @IsBoolean()
  @IsOptional()
  onlineStatus?: boolean;

  @IsBoolean()
  @IsOptional()
  mails?: boolean;

  @IsBoolean()
  @IsOptional()
  rightHand?: boolean;
}

// 계급 수정 DTO
export class UpdateRankDto {
  @IsString()
  @IsOptional()
  @MaxLength(30)
  newName?: string;

  @IsBoolean()
  @IsOptional()
  delete?: boolean;

  @IsBoolean()
  @IsOptional()
  kick?: boolean;

  @IsBoolean()
  @IsOptional()
  applications?: boolean;

  @IsBoolean()
  @IsOptional()
  memberlist?: boolean;

  @IsBoolean()
  @IsOptional()
  manageApplications?: boolean;

  @IsBoolean()
  @IsOptional()
  administrate?: boolean;

  @IsBoolean()
  @IsOptional()
  onlineStatus?: boolean;

  @IsBoolean()
  @IsOptional()
  mails?: boolean;

  @IsBoolean()
  @IsOptional()
  rightHand?: boolean;
}

// 멤버 계급 변경 DTO
export class UpdateMemberRankDto {
  @IsString()
  @IsOptional()
  rankName: string | null; // null이면 계급 제거
}

// 연합 양도 DTO
export class TransferAllianceDto {
  @IsString()
  @IsNotEmpty()
  newOwnerId: string;
}

// 회람 메시지 DTO
export class CircularMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
