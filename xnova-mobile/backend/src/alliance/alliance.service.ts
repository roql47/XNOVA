import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alliance, AllianceDocument, AllianceRank, AllianceMember } from './schemas/alliance.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Message, MessageDocument } from '../message/schemas/message.schema';
import {
  CreateAllianceDto,
  ApplyAllianceDto,
  UpdateAllianceSettingsDto,
  CreateRankDto,
  UpdateRankDto,
  UpdateMemberRankDto,
  RejectApplicationDto,
  CircularMessageDto,
} from './dto/alliance.dto';

@Injectable()
export class AllianceService {
  constructor(
    @InjectModel(Alliance.name) private allianceModel: Model<AllianceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  // ID로 연합 조회
  async findById(allianceId: string): Promise<AllianceDocument | null> {
    return this.allianceModel.findById(allianceId);
  }

  // ===== 연합 생성 =====
  async createAlliance(userId: string, dto: CreateAllianceDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.allianceId) {
      throw new BadRequestException('이미 연합에 가입되어 있습니다.');
    }

    // 태그 중복 확인
    const existingTag = await this.allianceModel.findOne({ tag: dto.tag.toUpperCase() });
    if (existingTag) {
      throw new BadRequestException('이미 사용 중인 연합 태그입니다.');
    }

    // 이름 중복 확인
    const existingName = await this.allianceModel.findOne({ name: dto.name });
    if (existingName) {
      throw new BadRequestException('이미 사용 중인 연합 이름입니다.');
    }

    // 기본 계급 생성
    const defaultRanks: AllianceRank[] = [
      {
        name: '부리더',
        delete: false,
        kick: true,
        applications: true,
        memberlist: true,
        manageApplications: true,
        administrate: true,
        onlineStatus: true,
        mails: true,
        rightHand: true,
      },
      {
        name: '간부',
        delete: false,
        kick: false,
        applications: true,
        memberlist: true,
        manageApplications: true,
        administrate: false,
        onlineStatus: true,
        mails: true,
        rightHand: false,
      },
      {
        name: '일반',
        delete: false,
        kick: false,
        applications: false,
        memberlist: true,
        manageApplications: false,
        administrate: false,
        onlineStatus: false,
        mails: false,
        rightHand: false,
      },
    ];

    // 연합 생성
    const alliance = new this.allianceModel({
      tag: dto.tag.toUpperCase(),
      name: dto.name,
      ownerId: new Types.ObjectId(userId),
      members: [{
        userId: new Types.ObjectId(userId),
        playerName: user.playerName,
        coordinate: user.coordinate,
        rankName: null, // 리더는 rankName이 null이어도 모든 권한을 가짐
        joinedAt: new Date(),
      }],
      ranks: defaultRanks,
    });

    await alliance.save();

    // 사용자의 allianceId 업데이트
    user.allianceId = alliance._id as Types.ObjectId;
    await user.save();

    return {
      success: true,
      message: '연합이 생성되었습니다.',
      alliance: this.formatAllianceResponse(alliance, user),
    };
  }

  // ===== 연합 검색 =====
  async searchAlliances(query: string, limit = 30) {
    // 빈 쿼리 시 전체 연합 반환
    const filter = query
      ? {
          $or: [
            { tag: new RegExp(query, 'i') },
            { name: new RegExp(query, 'i') },
          ],
        }
      : {};
    
    const alliances = await this.allianceModel.find(filter)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select('tag name members isOpen externalText logo');

    return alliances.map(a => ({
      id: a._id.toString(),
      tag: a.tag,
      name: a.name,
      memberCount: a.members.length,
      isOpen: a.isOpen,
      externalText: a.externalText?.substring(0, 100) || '',
      logo: a.logo,
    }));
  }

  // ===== 연합 정보 조회 (공개) =====
  async getAlliancePublic(allianceId: string) {
    const alliance = await this.allianceModel.findById(allianceId);
    if (!alliance) {
      throw new NotFoundException('연합을 찾을 수 없습니다.');
    }

    return {
      id: alliance._id.toString(),
      tag: alliance.tag,
      name: alliance.name,
      memberCount: alliance.members.length,
      isOpen: alliance.isOpen,
      externalText: alliance.externalText,
      logo: alliance.logo,
      website: alliance.website,
      createdAt: (alliance as any).createdAt,
    };
  }

  // ===== 내 연합 정보 조회 =====
  async getMyAlliance(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!user.allianceId) {
      // 연합에 가입하지 않은 경우, 대기 중인 신청이 있는지 확인
      const pendingApplication = await this.allianceModel.findOne({
        'applications.userId': new Types.ObjectId(userId),
      });

      if (pendingApplication) {
        return {
          status: 'pending',
          pendingAlliance: {
            id: pendingApplication._id.toString(),
            tag: pendingApplication.tag,
            name: pendingApplication.name,
          },
        };
      }

      return { status: 'none' };
    }

    const alliance = await this.allianceModel.findById(user.allianceId);
    if (!alliance) {
      // 연합이 삭제된 경우 allianceId 초기화
      user.allianceId = null;
      await user.save();
      return { status: 'none' };
    }

    return {
      status: 'member',
      alliance: this.formatAllianceResponse(alliance, user),
    };
  }

  // ===== 가입 신청 =====
  async applyToAlliance(userId: string, allianceId: string, dto: ApplyAllianceDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.allianceId) {
      throw new BadRequestException('이미 연합에 가입되어 있습니다.');
    }

    // 이미 다른 연합에 신청 중인지 확인
    const existingApplication = await this.allianceModel.findOne({
      'applications.userId': new Types.ObjectId(userId),
    });
    if (existingApplication) {
      throw new BadRequestException('이미 다른 연합에 가입 신청 중입니다.');
    }

    const alliance = await this.allianceModel.findById(allianceId);
    if (!alliance) {
      throw new NotFoundException('연합을 찾을 수 없습니다.');
    }

    if (!alliance.isOpen) {
      throw new BadRequestException('이 연합은 현재 가입 신청을 받지 않습니다.');
    }

    // 신청 추가
    alliance.applications.push({
      userId: new Types.ObjectId(userId),
      playerName: user.playerName,
      coordinate: user.coordinate,
      message: dto.message || '',
      appliedAt: new Date(),
    });
    await alliance.save();

    return {
      success: true,
      message: '가입 신청이 완료되었습니다.',
    };
  }

  // ===== 가입 신청 취소 =====
  async cancelApplication(userId: string) {
    const alliance = await this.allianceModel.findOne({
      'applications.userId': new Types.ObjectId(userId),
    });

    if (!alliance) {
      throw new BadRequestException('가입 신청 내역이 없습니다.');
    }

    alliance.applications = alliance.applications.filter(
      app => app.userId.toString() !== userId,
    );
    await alliance.save();

    return {
      success: true,
      message: '가입 신청이 취소되었습니다.',
    };
  }

  // ===== 연합 탈퇴 =====
  async leaveAlliance(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.allianceId) {
      throw new BadRequestException('연합에 가입되어 있지 않습니다.');
    }

    const alliance = await this.allianceModel.findById(user.allianceId);
    if (!alliance) {
      user.allianceId = null;
      await user.save();
      return { success: true, message: '연합에서 탈퇴했습니다.' };
    }

    // 리더는 탈퇴 불가
    if (alliance.ownerId.toString() === userId) {
      throw new BadRequestException('연합 리더는 탈퇴할 수 없습니다. 먼저 리더를 양도하세요.');
    }

    // 멤버 목록에서 제거
    alliance.members = alliance.members.filter(m => m.userId.toString() !== userId);
    await alliance.save();

    // 사용자 allianceId 초기화
    user.allianceId = null;
    await user.save();

    return { success: true, message: '연합에서 탈퇴했습니다.' };
  }

  // ===== 멤버 목록 조회 =====
  async getMembers(userId: string) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    // 권한 확인 (리더 또는 memberlist 권한)
    const isOwner = alliance.ownerId.toString() === userId;
    const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!rank || !rank.memberlist)) {
      throw new ForbiddenException('멤버 목록을 볼 권한이 없습니다.');
    }

    // 온라인 상태 포함 여부
    const canSeeOnline = isOwner || (rank && rank.onlineStatus);

    const memberDetails = await Promise.all(
      alliance.members.map(async (m) => {
        const memberUser = await this.userModel.findById(m.userId).select('lastActivity coordinate playerName');
        return {
          id: m.userId.toString(),
          playerName: m.playerName,
          coordinate: memberUser?.coordinate || m.coordinate,
          rankName: m.rankName,
          joinedAt: m.joinedAt,
          isOwner: alliance.ownerId.toString() === m.userId.toString(),
          lastActivity: canSeeOnline ? memberUser?.lastActivity : undefined,
        };
      }),
    );

    return { members: memberDetails };
  }

  // ===== 멤버 계급 변경 =====
  async updateMemberRank(userId: string, memberId: string, dto: UpdateMemberRankDto) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    // 권한 확인 (리더 또는 kick 권한)
    const isOwner = alliance.ownerId.toString() === userId;
    const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!rank || !rank.kick)) {
      throw new ForbiddenException('멤버 계급을 변경할 권한이 없습니다.');
    }

    // 대상 멤버 찾기
    const targetMember = alliance.members.find(m => m.userId.toString() === memberId);
    if (!targetMember) {
      throw new NotFoundException('해당 멤버를 찾을 수 없습니다.');
    }

    // 리더는 계급 변경 불가
    if (alliance.ownerId.toString() === memberId) {
      throw new BadRequestException('리더의 계급은 변경할 수 없습니다.');
    }

    // 계급이 존재하는지 확인
    if (dto.rankName && !alliance.ranks.find(r => r.name === dto.rankName)) {
      throw new BadRequestException('존재하지 않는 계급입니다.');
    }

    targetMember.rankName = dto.rankName;
    await alliance.save();

    return { success: true, message: '멤버 계급이 변경되었습니다.' };
  }

  // ===== 멤버 추방 =====
  async kickMember(userId: string, memberId: string) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    // 권한 확인
    const isOwner = alliance.ownerId.toString() === userId;
    const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!rank || !rank.kick)) {
      throw new ForbiddenException('멤버를 추방할 권한이 없습니다.');
    }

    // 자기 자신 추방 불가
    if (userId === memberId) {
      throw new BadRequestException('자기 자신을 추방할 수 없습니다.');
    }

    // 리더 추방 불가
    if (alliance.ownerId.toString() === memberId) {
      throw new BadRequestException('리더를 추방할 수 없습니다.');
    }

    // 멤버 목록에서 제거
    alliance.members = alliance.members.filter(m => m.userId.toString() !== memberId);
    await alliance.save();

    // 사용자 allianceId 초기화
    await this.userModel.findByIdAndUpdate(memberId, { allianceId: null });

    // 추방 메시지 발송
    await this.messageModel.create({
      receiverId: new Types.ObjectId(memberId),
      senderName: `[${alliance.tag}] 연합`,
      title: '연합에서 추방되었습니다',
      content: `${alliance.name} 연합에서 추방되었습니다.`,
      type: 'system',
    });

    return { success: true, message: '멤버가 추방되었습니다.' };
  }

  // ===== 가입 신청 목록 조회 =====
  async getApplications(userId: string) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    const isOwner = alliance.ownerId.toString() === userId;
    const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!rank || !rank.applications)) {
      throw new ForbiddenException('가입 신청을 볼 권한이 없습니다.');
    }

    return { applications: alliance.applications };
  }

  // ===== 가입 신청 승인 =====
  async acceptApplication(userId: string, applicantId: string) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    const isOwner = alliance.ownerId.toString() === userId;
    const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!rank || !rank.manageApplications)) {
      throw new ForbiddenException('가입 신청을 처리할 권한이 없습니다.');
    }

    // 신청자 찾기
    const application = alliance.applications.find(
      app => app.userId.toString() === applicantId,
    );
    if (!application) {
      throw new NotFoundException('해당 가입 신청을 찾을 수 없습니다.');
    }

    // 신청자 사용자 정보
    const applicantUser = await this.userModel.findById(applicantId);
    if (!applicantUser) {
      // 사용자가 삭제된 경우 신청 제거
      alliance.applications = alliance.applications.filter(
        app => app.userId.toString() !== applicantId,
      );
      await alliance.save();
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }

    // 이미 다른 연합에 가입한 경우
    if (applicantUser.allianceId) {
      alliance.applications = alliance.applications.filter(
        app => app.userId.toString() !== applicantId,
      );
      await alliance.save();
      throw new BadRequestException('신청자가 이미 다른 연합에 가입했습니다.');
    }

    // 멤버로 추가
    alliance.members.push({
      userId: new Types.ObjectId(applicantId),
      playerName: applicantUser.playerName,
      coordinate: applicantUser.coordinate,
      rankName: null,
      joinedAt: new Date(),
    });

    // 신청 목록에서 제거
    alliance.applications = alliance.applications.filter(
      app => app.userId.toString() !== applicantId,
    );
    await alliance.save();

    // 사용자 allianceId 업데이트
    applicantUser.allianceId = alliance._id as Types.ObjectId;
    await applicantUser.save();

    // 환영 메시지 발송
    await this.messageModel.create({
      receiverId: new Types.ObjectId(applicantId),
      senderName: `[${alliance.tag}] 연합`,
      title: '연합 가입이 승인되었습니다',
      content: `${alliance.name} 연합에 가입되었습니다. 환영합니다!`,
      type: 'system',
    });

    return { success: true, message: '가입 신청을 승인했습니다.' };
  }

  // ===== 가입 신청 거절 =====
  async rejectApplication(userId: string, applicantId: string, dto: RejectApplicationDto) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    const isOwner = alliance.ownerId.toString() === userId;
    const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!rank || !rank.manageApplications)) {
      throw new ForbiddenException('가입 신청을 처리할 권한이 없습니다.');
    }

    const application = alliance.applications.find(
      app => app.userId.toString() === applicantId,
    );
    if (!application) {
      throw new NotFoundException('해당 가입 신청을 찾을 수 없습니다.');
    }

    // 신청 목록에서 제거
    alliance.applications = alliance.applications.filter(
      app => app.userId.toString() !== applicantId,
    );
    await alliance.save();

    // 거절 메시지 발송
    await this.messageModel.create({
      receiverId: new Types.ObjectId(applicantId),
      senderName: `[${alliance.tag}] 연합`,
      title: '연합 가입 신청이 거절되었습니다',
      content: `${alliance.name} 연합 가입 신청이 거절되었습니다.${dto.reason ? `\n\n사유: ${dto.reason}` : ''}`,
      type: 'system',
    });

    return { success: true, message: '가입 신청을 거절했습니다.' };
  }

  // ===== 연합 설정 수정 =====
  async updateSettings(userId: string, dto: UpdateAllianceSettingsDto) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    const isOwner = alliance.ownerId.toString() === userId;
    const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!rank || !rank.administrate)) {
      throw new ForbiddenException('연합 설정을 수정할 권한이 없습니다.');
    }

    if (dto.externalText !== undefined) alliance.externalText = dto.externalText;
    if (dto.internalText !== undefined) alliance.internalText = dto.internalText;
    if (dto.logo !== undefined) alliance.logo = dto.logo;
    if (dto.website !== undefined) alliance.website = dto.website;
    if (dto.isOpen !== undefined) alliance.isOpen = dto.isOpen;
    if (dto.ownerTitle !== undefined && isOwner) alliance.ownerTitle = dto.ownerTitle;

    await alliance.save();

    return { success: true, message: '연합 설정이 수정되었습니다.' };
  }

  // ===== 연합 이름 변경 =====
  async updateName(userId: string, name: string) {
    const { alliance } = await this.validateMemberAccess(userId);
    
    if (alliance.ownerId.toString() !== userId) {
      throw new ForbiddenException('리더만 연합 이름을 변경할 수 있습니다.');
    }

    // 중복 확인
    const existing = await this.allianceModel.findOne({ name, _id: { $ne: alliance._id } });
    if (existing) {
      throw new BadRequestException('이미 사용 중인 연합 이름입니다.');
    }

    alliance.name = name;
    await alliance.save();

    return { success: true, message: '연합 이름이 변경되었습니다.' };
  }

  // ===== 연합 태그 변경 =====
  async updateTag(userId: string, tag: string) {
    const { alliance } = await this.validateMemberAccess(userId);
    
    if (alliance.ownerId.toString() !== userId) {
      throw new ForbiddenException('리더만 연합 태그를 변경할 수 있습니다.');
    }

    const upperTag = tag.toUpperCase();
    
    // 중복 확인
    const existing = await this.allianceModel.findOne({ tag: upperTag, _id: { $ne: alliance._id } });
    if (existing) {
      throw new BadRequestException('이미 사용 중인 연합 태그입니다.');
    }

    alliance.tag = upperTag;
    await alliance.save();

    return { success: true, message: '연합 태그가 변경되었습니다.' };
  }

  // ===== 계급 생성 =====
  async createRank(userId: string, dto: CreateRankDto) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    const isOwner = alliance.ownerId.toString() === userId;
    const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!rank || !rank.rightHand)) {
      throw new ForbiddenException('계급을 생성할 권한이 없습니다.');
    }

    // 중복 확인
    if (alliance.ranks.find(r => r.name === dto.name)) {
      throw new BadRequestException('이미 존재하는 계급 이름입니다.');
    }

    alliance.ranks.push({
      name: dto.name,
      delete: dto.delete || false,
      kick: dto.kick || false,
      applications: dto.applications || false,
      memberlist: dto.memberlist || false,
      manageApplications: dto.manageApplications || false,
      administrate: dto.administrate || false,
      onlineStatus: dto.onlineStatus || false,
      mails: dto.mails || false,
      rightHand: dto.rightHand || false,
    });
    await alliance.save();

    return { success: true, message: '계급이 생성되었습니다.' };
  }

  // ===== 계급 수정 =====
  async updateRank(userId: string, rankName: string, dto: UpdateRankDto) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    const isOwner = alliance.ownerId.toString() === userId;
    const userRank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!userRank || !userRank.rightHand)) {
      throw new ForbiddenException('계급을 수정할 권한이 없습니다.');
    }

    const targetRank = alliance.ranks.find(r => r.name === rankName);
    if (!targetRank) {
      throw new NotFoundException('해당 계급을 찾을 수 없습니다.');
    }

    // 이름 변경 시 중복 확인
    if (dto.newName && dto.newName !== rankName) {
      if (alliance.ranks.find(r => r.name === dto.newName)) {
        throw new BadRequestException('이미 존재하는 계급 이름입니다.');
      }
      // 해당 계급을 가진 멤버들의 rankName도 업데이트
      alliance.members.forEach(m => {
        if (m.rankName === rankName) m.rankName = dto.newName!;
      });
      targetRank.name = dto.newName;
    }

    if (dto.delete !== undefined) targetRank.delete = dto.delete;
    if (dto.kick !== undefined) targetRank.kick = dto.kick;
    if (dto.applications !== undefined) targetRank.applications = dto.applications;
    if (dto.memberlist !== undefined) targetRank.memberlist = dto.memberlist;
    if (dto.manageApplications !== undefined) targetRank.manageApplications = dto.manageApplications;
    if (dto.administrate !== undefined) targetRank.administrate = dto.administrate;
    if (dto.onlineStatus !== undefined) targetRank.onlineStatus = dto.onlineStatus;
    if (dto.mails !== undefined) targetRank.mails = dto.mails;
    if (dto.rightHand !== undefined) targetRank.rightHand = dto.rightHand;

    await alliance.save();

    return { success: true, message: '계급이 수정되었습니다.' };
  }

  // ===== 계급 삭제 =====
  async deleteRank(userId: string, rankName: string) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    const isOwner = alliance.ownerId.toString() === userId;
    const userRank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!userRank || !userRank.rightHand)) {
      throw new ForbiddenException('계급을 삭제할 권한이 없습니다.');
    }

    const targetRank = alliance.ranks.find(r => r.name === rankName);
    if (!targetRank) {
      throw new NotFoundException('해당 계급을 찾을 수 없습니다.');
    }

    // 해당 계급을 가진 멤버들의 rankName 초기화
    alliance.members.forEach(m => {
      if (m.rankName === rankName) m.rankName = null;
    });

    // 계급 삭제
    alliance.ranks = alliance.ranks.filter(r => r.name !== rankName);
    await alliance.save();

    return { success: true, message: '계급이 삭제되었습니다.' };
  }

  // ===== 연합 양도 =====
  async transferAlliance(userId: string, newOwnerId: string) {
    const { alliance } = await this.validateMemberAccess(userId);
    
    if (alliance.ownerId.toString() !== userId) {
      throw new ForbiddenException('리더만 연합을 양도할 수 있습니다.');
    }

    if (userId === newOwnerId) {
      throw new BadRequestException('자기 자신에게 양도할 수 없습니다.');
    }

    // 새 리더가 멤버인지 확인
    const newOwnerMember = alliance.members.find(m => m.userId.toString() === newOwnerId);
    if (!newOwnerMember) {
      throw new BadRequestException('연합 멤버만 리더가 될 수 있습니다.');
    }

    // 리더 변경
    alliance.ownerId = new Types.ObjectId(newOwnerId);
    
    // 이전 리더의 계급은 그대로 유지 (선택사항)
    await alliance.save();

    // 양도 알림 메시지
    await this.messageModel.create({
      receiverId: new Types.ObjectId(newOwnerId),
      senderName: `[${alliance.tag}] 연합`,
      title: '연합 리더가 되었습니다',
      content: `${alliance.name} 연합의 새로운 리더가 되었습니다.`,
      type: 'system',
    });

    return { success: true, message: '연합이 양도되었습니다.' };
  }

  // ===== 연합 해산 =====
  async dissolveAlliance(userId: string) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    const isOwner = alliance.ownerId.toString() === userId;
    const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!rank || !rank.delete)) {
      throw new ForbiddenException('연합을 해산할 권한이 없습니다.');
    }

    // 모든 멤버의 allianceId 초기화
    const memberIds = alliance.members.map(m => m.userId);
    await this.userModel.updateMany(
      { _id: { $in: memberIds } },
      { allianceId: null },
    );

    // 해산 알림 메시지
    await this.messageModel.insertMany(
      memberIds.map(memberId => ({
        receiverId: memberId,
        senderName: '[시스템]',
        title: '연합이 해산되었습니다',
        content: `${alliance.name} 연합이 해산되었습니다.`,
        type: 'system',
      })),
    );

    // 연합 삭제
    await this.allianceModel.findByIdAndDelete(alliance._id);

    return { success: true, message: '연합이 해산되었습니다.' };
  }

  // ===== 회람 메시지 발송 =====
  async sendCircularMessage(userId: string, dto: CircularMessageDto) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    const isOwner = alliance.ownerId.toString() === userId;
    const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!rank || !rank.mails)) {
      throw new ForbiddenException('회람 메시지를 발송할 권한이 없습니다.');
    }

    // 모든 멤버에게 메시지 발송
    const messages = alliance.members.map(m => ({
      receiverId: m.userId,
      senderName: `[${alliance.tag}] ${member.playerName}`,
      title: dto.title,
      content: dto.content,
      type: 'system' as const,
      metadata: {
        isCircular: true,
        allianceId: alliance._id.toString(),
      },
    }));

    await this.messageModel.insertMany(messages);

    return { 
      success: true, 
      message: `${alliance.members.length}명에게 회람 메시지를 발송했습니다.`,
    };
  }

  // ===== 계급 목록 조회 =====
  async getRanks(userId: string) {
    const { alliance, member } = await this.validateMemberAccess(userId);
    
    const isOwner = alliance.ownerId.toString() === userId;
    const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
    
    if (!isOwner && (!rank || !rank.rightHand)) {
      throw new ForbiddenException('계급 목록을 볼 권한이 없습니다.');
    }

    return { ranks: alliance.ranks };
  }

  // ===== 헬퍼 함수들 =====
  private async validateMemberAccess(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!user.allianceId) {
      throw new BadRequestException('연합에 가입되어 있지 않습니다.');
    }

    const alliance = await this.allianceModel.findById(user.allianceId);
    if (!alliance) {
      user.allianceId = null;
      await user.save();
      throw new BadRequestException('연합이 존재하지 않습니다.');
    }

    const member = alliance.members.find(m => m.userId.toString() === userId);
    if (!member) {
      user.allianceId = null;
      await user.save();
      throw new BadRequestException('연합 멤버가 아닙니다.');
    }

    return { alliance, member, user };
  }

  private formatAllianceResponse(alliance: AllianceDocument, user: UserDocument) {
    const isOwner = alliance.ownerId.toString() === user._id.toString();
    const member = alliance.members.find(m => m.userId.toString() === user._id.toString());
    const rank = member?.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;

    // 권한 계산
    const permissions = {
      delete: isOwner || (rank?.delete ?? false),
      kick: isOwner || (rank?.kick ?? false),
      applications: isOwner || (rank?.applications ?? false),
      memberlist: isOwner || (rank?.memberlist ?? false),
      manageApplications: isOwner || (rank?.manageApplications ?? false),
      administrate: isOwner || (rank?.administrate ?? false),
      onlineStatus: isOwner || (rank?.onlineStatus ?? false),
      mails: isOwner || (rank?.mails ?? false),
      rightHand: isOwner || (rank?.rightHand ?? false),
    };

    return {
      id: alliance._id.toString(),
      tag: alliance.tag,
      name: alliance.name,
      ownerId: alliance.ownerId.toString(),
      ownerTitle: alliance.ownerTitle,
      externalText: alliance.externalText,
      internalText: alliance.internalText,
      logo: alliance.logo,
      website: alliance.website,
      isOpen: alliance.isOpen,
      memberCount: alliance.members.length,
      applicationCount: alliance.applications.length,
      myRank: member?.rankName || null,
      isOwner,
      permissions,
      ranks: alliance.ranks,
      createdAt: (alliance as any).createdAt,
    };
  }
}
