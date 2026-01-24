"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllianceService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const alliance_schema_1 = require("./schemas/alliance.schema");
const user_schema_1 = require("../user/schemas/user.schema");
const message_schema_1 = require("../message/schemas/message.schema");
let AllianceService = class AllianceService {
    allianceModel;
    userModel;
    messageModel;
    constructor(allianceModel, userModel, messageModel) {
        this.allianceModel = allianceModel;
        this.userModel = userModel;
        this.messageModel = messageModel;
    }
    async createAlliance(userId, dto) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
        }
        if (user.allianceId) {
            throw new common_1.BadRequestException('이미 연합에 가입되어 있습니다.');
        }
        const existingTag = await this.allianceModel.findOne({ tag: dto.tag.toUpperCase() });
        if (existingTag) {
            throw new common_1.BadRequestException('이미 사용 중인 연합 태그입니다.');
        }
        const existingName = await this.allianceModel.findOne({ name: dto.name });
        if (existingName) {
            throw new common_1.BadRequestException('이미 사용 중인 연합 이름입니다.');
        }
        const defaultRanks = [
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
        const alliance = new this.allianceModel({
            tag: dto.tag.toUpperCase(),
            name: dto.name,
            ownerId: new mongoose_2.Types.ObjectId(userId),
            members: [{
                    userId: new mongoose_2.Types.ObjectId(userId),
                    playerName: user.playerName,
                    coordinate: user.coordinate,
                    rankName: null,
                    joinedAt: new Date(),
                }],
            ranks: defaultRanks,
        });
        await alliance.save();
        user.allianceId = alliance._id;
        await user.save();
        return {
            success: true,
            message: '연합이 생성되었습니다.',
            alliance: this.formatAllianceResponse(alliance, user),
        };
    }
    async searchAlliances(query, limit = 30) {
        const regex = new RegExp(query, 'i');
        const alliances = await this.allianceModel.find({
            $or: [
                { tag: regex },
                { name: regex },
            ],
        }).limit(limit).select('tag name members isOpen externalText logo');
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
    async getAlliancePublic(allianceId) {
        const alliance = await this.allianceModel.findById(allianceId);
        if (!alliance) {
            throw new common_1.NotFoundException('연합을 찾을 수 없습니다.');
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
            createdAt: alliance.createdAt,
        };
    }
    async getMyAlliance(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
        }
        if (!user.allianceId) {
            const pendingApplication = await this.allianceModel.findOne({
                'applications.userId': new mongoose_2.Types.ObjectId(userId),
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
            user.allianceId = null;
            await user.save();
            return { status: 'none' };
        }
        return {
            status: 'member',
            alliance: this.formatAllianceResponse(alliance, user),
        };
    }
    async applyToAlliance(userId, allianceId, dto) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
        }
        if (user.allianceId) {
            throw new common_1.BadRequestException('이미 연합에 가입되어 있습니다.');
        }
        const existingApplication = await this.allianceModel.findOne({
            'applications.userId': new mongoose_2.Types.ObjectId(userId),
        });
        if (existingApplication) {
            throw new common_1.BadRequestException('이미 다른 연합에 가입 신청 중입니다.');
        }
        const alliance = await this.allianceModel.findById(allianceId);
        if (!alliance) {
            throw new common_1.NotFoundException('연합을 찾을 수 없습니다.');
        }
        if (!alliance.isOpen) {
            throw new common_1.BadRequestException('이 연합은 현재 가입 신청을 받지 않습니다.');
        }
        alliance.applications.push({
            userId: new mongoose_2.Types.ObjectId(userId),
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
    async cancelApplication(userId) {
        const alliance = await this.allianceModel.findOne({
            'applications.userId': new mongoose_2.Types.ObjectId(userId),
        });
        if (!alliance) {
            throw new common_1.BadRequestException('가입 신청 내역이 없습니다.');
        }
        alliance.applications = alliance.applications.filter(app => app.userId.toString() !== userId);
        await alliance.save();
        return {
            success: true,
            message: '가입 신청이 취소되었습니다.',
        };
    }
    async leaveAlliance(userId) {
        const user = await this.userModel.findById(userId);
        if (!user || !user.allianceId) {
            throw new common_1.BadRequestException('연합에 가입되어 있지 않습니다.');
        }
        const alliance = await this.allianceModel.findById(user.allianceId);
        if (!alliance) {
            user.allianceId = null;
            await user.save();
            return { success: true, message: '연합에서 탈퇴했습니다.' };
        }
        if (alliance.ownerId.toString() === userId) {
            throw new common_1.BadRequestException('연합 리더는 탈퇴할 수 없습니다. 먼저 리더를 양도하세요.');
        }
        alliance.members = alliance.members.filter(m => m.userId.toString() !== userId);
        await alliance.save();
        user.allianceId = null;
        await user.save();
        return { success: true, message: '연합에서 탈퇴했습니다.' };
    }
    async getMembers(userId) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!rank || !rank.memberlist)) {
            throw new common_1.ForbiddenException('멤버 목록을 볼 권한이 없습니다.');
        }
        const canSeeOnline = isOwner || (rank && rank.onlineStatus);
        const memberDetails = await Promise.all(alliance.members.map(async (m) => {
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
        }));
        return { members: memberDetails };
    }
    async updateMemberRank(userId, memberId, dto) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!rank || !rank.kick)) {
            throw new common_1.ForbiddenException('멤버 계급을 변경할 권한이 없습니다.');
        }
        const targetMember = alliance.members.find(m => m.userId.toString() === memberId);
        if (!targetMember) {
            throw new common_1.NotFoundException('해당 멤버를 찾을 수 없습니다.');
        }
        if (alliance.ownerId.toString() === memberId) {
            throw new common_1.BadRequestException('리더의 계급은 변경할 수 없습니다.');
        }
        if (dto.rankName && !alliance.ranks.find(r => r.name === dto.rankName)) {
            throw new common_1.BadRequestException('존재하지 않는 계급입니다.');
        }
        targetMember.rankName = dto.rankName;
        await alliance.save();
        return { success: true, message: '멤버 계급이 변경되었습니다.' };
    }
    async kickMember(userId, memberId) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!rank || !rank.kick)) {
            throw new common_1.ForbiddenException('멤버를 추방할 권한이 없습니다.');
        }
        if (userId === memberId) {
            throw new common_1.BadRequestException('자기 자신을 추방할 수 없습니다.');
        }
        if (alliance.ownerId.toString() === memberId) {
            throw new common_1.BadRequestException('리더를 추방할 수 없습니다.');
        }
        alliance.members = alliance.members.filter(m => m.userId.toString() !== memberId);
        await alliance.save();
        await this.userModel.findByIdAndUpdate(memberId, { allianceId: null });
        await this.messageModel.create({
            receiverId: new mongoose_2.Types.ObjectId(memberId),
            senderName: `[${alliance.tag}] 연합`,
            title: '연합에서 추방되었습니다',
            content: `${alliance.name} 연합에서 추방되었습니다.`,
            type: 'system',
        });
        return { success: true, message: '멤버가 추방되었습니다.' };
    }
    async getApplications(userId) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!rank || !rank.applications)) {
            throw new common_1.ForbiddenException('가입 신청을 볼 권한이 없습니다.');
        }
        return { applications: alliance.applications };
    }
    async acceptApplication(userId, applicantId) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!rank || !rank.manageApplications)) {
            throw new common_1.ForbiddenException('가입 신청을 처리할 권한이 없습니다.');
        }
        const application = alliance.applications.find(app => app.userId.toString() === applicantId);
        if (!application) {
            throw new common_1.NotFoundException('해당 가입 신청을 찾을 수 없습니다.');
        }
        const applicantUser = await this.userModel.findById(applicantId);
        if (!applicantUser) {
            alliance.applications = alliance.applications.filter(app => app.userId.toString() !== applicantId);
            await alliance.save();
            throw new common_1.BadRequestException('존재하지 않는 사용자입니다.');
        }
        if (applicantUser.allianceId) {
            alliance.applications = alliance.applications.filter(app => app.userId.toString() !== applicantId);
            await alliance.save();
            throw new common_1.BadRequestException('신청자가 이미 다른 연합에 가입했습니다.');
        }
        alliance.members.push({
            userId: new mongoose_2.Types.ObjectId(applicantId),
            playerName: applicantUser.playerName,
            coordinate: applicantUser.coordinate,
            rankName: null,
            joinedAt: new Date(),
        });
        alliance.applications = alliance.applications.filter(app => app.userId.toString() !== applicantId);
        await alliance.save();
        applicantUser.allianceId = alliance._id;
        await applicantUser.save();
        await this.messageModel.create({
            receiverId: new mongoose_2.Types.ObjectId(applicantId),
            senderName: `[${alliance.tag}] 연합`,
            title: '연합 가입이 승인되었습니다',
            content: `${alliance.name} 연합에 가입되었습니다. 환영합니다!`,
            type: 'system',
        });
        return { success: true, message: '가입 신청을 승인했습니다.' };
    }
    async rejectApplication(userId, applicantId, dto) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!rank || !rank.manageApplications)) {
            throw new common_1.ForbiddenException('가입 신청을 처리할 권한이 없습니다.');
        }
        const application = alliance.applications.find(app => app.userId.toString() === applicantId);
        if (!application) {
            throw new common_1.NotFoundException('해당 가입 신청을 찾을 수 없습니다.');
        }
        alliance.applications = alliance.applications.filter(app => app.userId.toString() !== applicantId);
        await alliance.save();
        await this.messageModel.create({
            receiverId: new mongoose_2.Types.ObjectId(applicantId),
            senderName: `[${alliance.tag}] 연합`,
            title: '연합 가입 신청이 거절되었습니다',
            content: `${alliance.name} 연합 가입 신청이 거절되었습니다.${dto.reason ? `\n\n사유: ${dto.reason}` : ''}`,
            type: 'system',
        });
        return { success: true, message: '가입 신청을 거절했습니다.' };
    }
    async updateSettings(userId, dto) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!rank || !rank.administrate)) {
            throw new common_1.ForbiddenException('연합 설정을 수정할 권한이 없습니다.');
        }
        if (dto.externalText !== undefined)
            alliance.externalText = dto.externalText;
        if (dto.internalText !== undefined)
            alliance.internalText = dto.internalText;
        if (dto.logo !== undefined)
            alliance.logo = dto.logo;
        if (dto.website !== undefined)
            alliance.website = dto.website;
        if (dto.isOpen !== undefined)
            alliance.isOpen = dto.isOpen;
        if (dto.ownerTitle !== undefined && isOwner)
            alliance.ownerTitle = dto.ownerTitle;
        await alliance.save();
        return { success: true, message: '연합 설정이 수정되었습니다.' };
    }
    async updateName(userId, name) {
        const { alliance } = await this.validateMemberAccess(userId);
        if (alliance.ownerId.toString() !== userId) {
            throw new common_1.ForbiddenException('리더만 연합 이름을 변경할 수 있습니다.');
        }
        const existing = await this.allianceModel.findOne({ name, _id: { $ne: alliance._id } });
        if (existing) {
            throw new common_1.BadRequestException('이미 사용 중인 연합 이름입니다.');
        }
        alliance.name = name;
        await alliance.save();
        return { success: true, message: '연합 이름이 변경되었습니다.' };
    }
    async updateTag(userId, tag) {
        const { alliance } = await this.validateMemberAccess(userId);
        if (alliance.ownerId.toString() !== userId) {
            throw new common_1.ForbiddenException('리더만 연합 태그를 변경할 수 있습니다.');
        }
        const upperTag = tag.toUpperCase();
        const existing = await this.allianceModel.findOne({ tag: upperTag, _id: { $ne: alliance._id } });
        if (existing) {
            throw new common_1.BadRequestException('이미 사용 중인 연합 태그입니다.');
        }
        alliance.tag = upperTag;
        await alliance.save();
        return { success: true, message: '연합 태그가 변경되었습니다.' };
    }
    async createRank(userId, dto) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!rank || !rank.rightHand)) {
            throw new common_1.ForbiddenException('계급을 생성할 권한이 없습니다.');
        }
        if (alliance.ranks.find(r => r.name === dto.name)) {
            throw new common_1.BadRequestException('이미 존재하는 계급 이름입니다.');
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
    async updateRank(userId, rankName, dto) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const userRank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!userRank || !userRank.rightHand)) {
            throw new common_1.ForbiddenException('계급을 수정할 권한이 없습니다.');
        }
        const targetRank = alliance.ranks.find(r => r.name === rankName);
        if (!targetRank) {
            throw new common_1.NotFoundException('해당 계급을 찾을 수 없습니다.');
        }
        if (dto.newName && dto.newName !== rankName) {
            if (alliance.ranks.find(r => r.name === dto.newName)) {
                throw new common_1.BadRequestException('이미 존재하는 계급 이름입니다.');
            }
            alliance.members.forEach(m => {
                if (m.rankName === rankName)
                    m.rankName = dto.newName;
            });
            targetRank.name = dto.newName;
        }
        if (dto.delete !== undefined)
            targetRank.delete = dto.delete;
        if (dto.kick !== undefined)
            targetRank.kick = dto.kick;
        if (dto.applications !== undefined)
            targetRank.applications = dto.applications;
        if (dto.memberlist !== undefined)
            targetRank.memberlist = dto.memberlist;
        if (dto.manageApplications !== undefined)
            targetRank.manageApplications = dto.manageApplications;
        if (dto.administrate !== undefined)
            targetRank.administrate = dto.administrate;
        if (dto.onlineStatus !== undefined)
            targetRank.onlineStatus = dto.onlineStatus;
        if (dto.mails !== undefined)
            targetRank.mails = dto.mails;
        if (dto.rightHand !== undefined)
            targetRank.rightHand = dto.rightHand;
        await alliance.save();
        return { success: true, message: '계급이 수정되었습니다.' };
    }
    async deleteRank(userId, rankName) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const userRank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!userRank || !userRank.rightHand)) {
            throw new common_1.ForbiddenException('계급을 삭제할 권한이 없습니다.');
        }
        const targetRank = alliance.ranks.find(r => r.name === rankName);
        if (!targetRank) {
            throw new common_1.NotFoundException('해당 계급을 찾을 수 없습니다.');
        }
        alliance.members.forEach(m => {
            if (m.rankName === rankName)
                m.rankName = null;
        });
        alliance.ranks = alliance.ranks.filter(r => r.name !== rankName);
        await alliance.save();
        return { success: true, message: '계급이 삭제되었습니다.' };
    }
    async transferAlliance(userId, newOwnerId) {
        const { alliance } = await this.validateMemberAccess(userId);
        if (alliance.ownerId.toString() !== userId) {
            throw new common_1.ForbiddenException('리더만 연합을 양도할 수 있습니다.');
        }
        if (userId === newOwnerId) {
            throw new common_1.BadRequestException('자기 자신에게 양도할 수 없습니다.');
        }
        const newOwnerMember = alliance.members.find(m => m.userId.toString() === newOwnerId);
        if (!newOwnerMember) {
            throw new common_1.BadRequestException('연합 멤버만 리더가 될 수 있습니다.');
        }
        alliance.ownerId = new mongoose_2.Types.ObjectId(newOwnerId);
        await alliance.save();
        await this.messageModel.create({
            receiverId: new mongoose_2.Types.ObjectId(newOwnerId),
            senderName: `[${alliance.tag}] 연합`,
            title: '연합 리더가 되었습니다',
            content: `${alliance.name} 연합의 새로운 리더가 되었습니다.`,
            type: 'system',
        });
        return { success: true, message: '연합이 양도되었습니다.' };
    }
    async dissolveAlliance(userId) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!rank || !rank.delete)) {
            throw new common_1.ForbiddenException('연합을 해산할 권한이 없습니다.');
        }
        const memberIds = alliance.members.map(m => m.userId);
        await this.userModel.updateMany({ _id: { $in: memberIds } }, { allianceId: null });
        await this.messageModel.insertMany(memberIds.map(memberId => ({
            receiverId: memberId,
            senderName: '[시스템]',
            title: '연합이 해산되었습니다',
            content: `${alliance.name} 연합이 해산되었습니다.`,
            type: 'system',
        })));
        await this.allianceModel.findByIdAndDelete(alliance._id);
        return { success: true, message: '연합이 해산되었습니다.' };
    }
    async sendCircularMessage(userId, dto) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!rank || !rank.mails)) {
            throw new common_1.ForbiddenException('회람 메시지를 발송할 권한이 없습니다.');
        }
        const messages = alliance.members.map(m => ({
            receiverId: m.userId,
            senderName: `[${alliance.tag}] ${member.playerName}`,
            title: dto.title,
            content: dto.content,
            type: 'system',
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
    async getRanks(userId) {
        const { alliance, member } = await this.validateMemberAccess(userId);
        const isOwner = alliance.ownerId.toString() === userId;
        const rank = member.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
        if (!isOwner && (!rank || !rank.rightHand)) {
            throw new common_1.ForbiddenException('계급 목록을 볼 권한이 없습니다.');
        }
        return { ranks: alliance.ranks };
    }
    async validateMemberAccess(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
        }
        if (!user.allianceId) {
            throw new common_1.BadRequestException('연합에 가입되어 있지 않습니다.');
        }
        const alliance = await this.allianceModel.findById(user.allianceId);
        if (!alliance) {
            user.allianceId = null;
            await user.save();
            throw new common_1.BadRequestException('연합이 존재하지 않습니다.');
        }
        const member = alliance.members.find(m => m.userId.toString() === userId);
        if (!member) {
            user.allianceId = null;
            await user.save();
            throw new common_1.BadRequestException('연합 멤버가 아닙니다.');
        }
        return { alliance, member, user };
    }
    formatAllianceResponse(alliance, user) {
        const isOwner = alliance.ownerId.toString() === user._id.toString();
        const member = alliance.members.find(m => m.userId.toString() === user._id.toString());
        const rank = member?.rankName ? alliance.ranks.find(r => r.name === member.rankName) : null;
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
            createdAt: alliance.createdAt,
        };
    }
};
exports.AllianceService = AllianceService;
exports.AllianceService = AllianceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(alliance_schema_1.Alliance.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AllianceService);
//# sourceMappingURL=alliance.service.js.map