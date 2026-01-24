import { Model } from 'mongoose';
import { AllianceDocument, AllianceRank } from './schemas/alliance.schema';
import { UserDocument } from '../user/schemas/user.schema';
import { MessageDocument } from '../message/schemas/message.schema';
import { CreateAllianceDto, ApplyAllianceDto, UpdateAllianceSettingsDto, CreateRankDto, UpdateRankDto, UpdateMemberRankDto, RejectApplicationDto, CircularMessageDto } from './dto/alliance.dto';
export declare class AllianceService {
    private allianceModel;
    private userModel;
    private messageModel;
    constructor(allianceModel: Model<AllianceDocument>, userModel: Model<UserDocument>, messageModel: Model<MessageDocument>);
    createAlliance(userId: string, dto: CreateAllianceDto): Promise<{
        success: boolean;
        message: string;
        alliance: {
            id: string;
            tag: string;
            name: string;
            ownerId: string;
            ownerTitle: string;
            externalText: string;
            internalText: string;
            logo: string;
            website: string;
            isOpen: boolean;
            memberCount: number;
            applicationCount: number;
            myRank: string | null;
            isOwner: boolean;
            permissions: {
                delete: boolean;
                kick: boolean;
                applications: boolean;
                memberlist: boolean;
                manageApplications: boolean;
                administrate: boolean;
                onlineStatus: boolean;
                mails: boolean;
                rightHand: boolean;
            };
            ranks: AllianceRank[];
            createdAt: any;
        };
    }>;
    searchAlliances(query: string, limit?: number): Promise<{
        id: string;
        tag: string;
        name: string;
        memberCount: number;
        isOpen: boolean;
        externalText: string;
        logo: string;
    }[]>;
    getAlliancePublic(allianceId: string): Promise<{
        id: string;
        tag: string;
        name: string;
        memberCount: number;
        isOpen: boolean;
        externalText: string;
        logo: string;
        website: string;
        createdAt: any;
    }>;
    getMyAlliance(userId: string): Promise<{
        status: string;
        pendingAlliance: {
            id: string;
            tag: string;
            name: string;
        };
        alliance?: undefined;
    } | {
        status: string;
        pendingAlliance?: undefined;
        alliance?: undefined;
    } | {
        status: string;
        alliance: {
            id: string;
            tag: string;
            name: string;
            ownerId: string;
            ownerTitle: string;
            externalText: string;
            internalText: string;
            logo: string;
            website: string;
            isOpen: boolean;
            memberCount: number;
            applicationCount: number;
            myRank: string | null;
            isOwner: boolean;
            permissions: {
                delete: boolean;
                kick: boolean;
                applications: boolean;
                memberlist: boolean;
                manageApplications: boolean;
                administrate: boolean;
                onlineStatus: boolean;
                mails: boolean;
                rightHand: boolean;
            };
            ranks: AllianceRank[];
            createdAt: any;
        };
        pendingAlliance?: undefined;
    }>;
    applyToAlliance(userId: string, allianceId: string, dto: ApplyAllianceDto): Promise<{
        success: boolean;
        message: string;
    }>;
    cancelApplication(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    leaveAlliance(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getMembers(userId: string): Promise<{
        members: {
            id: string;
            playerName: string;
            coordinate: string;
            rankName: string | null;
            joinedAt: Date;
            isOwner: boolean;
            lastActivity: Date | undefined;
        }[];
    }>;
    updateMemberRank(userId: string, memberId: string, dto: UpdateMemberRankDto): Promise<{
        success: boolean;
        message: string;
    }>;
    kickMember(userId: string, memberId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getApplications(userId: string): Promise<{
        applications: import("./schemas/alliance.schema").AllianceApplication[];
    }>;
    acceptApplication(userId: string, applicantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectApplication(userId: string, applicantId: string, dto: RejectApplicationDto): Promise<{
        success: boolean;
        message: string;
    }>;
    updateSettings(userId: string, dto: UpdateAllianceSettingsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    updateName(userId: string, name: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateTag(userId: string, tag: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createRank(userId: string, dto: CreateRankDto): Promise<{
        success: boolean;
        message: string;
    }>;
    updateRank(userId: string, rankName: string, dto: UpdateRankDto): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteRank(userId: string, rankName: string): Promise<{
        success: boolean;
        message: string;
    }>;
    transferAlliance(userId: string, newOwnerId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    dissolveAlliance(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendCircularMessage(userId: string, dto: CircularMessageDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getRanks(userId: string): Promise<{
        ranks: AllianceRank[];
    }>;
    private validateMemberAccess;
    private formatAllianceResponse;
}
