import { AllianceService } from './alliance.service';
import { CreateAllianceDto, ApplyAllianceDto, UpdateAllianceSettingsDto, CreateRankDto, UpdateRankDto, UpdateMemberRankDto, UpdateAllianceNameDto, UpdateAllianceTagDto, TransferAllianceDto, RejectApplicationDto, CircularMessageDto } from './dto/alliance.dto';
export declare class AllianceController {
    private readonly allianceService;
    constructor(allianceService: AllianceService);
    createAlliance(req: any, dto: CreateAllianceDto): Promise<{
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
            ranks: import("./schemas/alliance.schema").AllianceRank[];
            createdAt: any;
        };
    }>;
    searchAlliances(query?: string): Promise<{
        id: string;
        tag: string;
        name: string;
        memberCount: number;
        isOpen: boolean;
        externalText: string;
        logo: string;
    }[]>;
    getAlliancePublic(id: string): Promise<{
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
    applyToAlliance(req: any, allianceId: string, dto: ApplyAllianceDto): Promise<{
        success: boolean;
        message: string;
    }>;
    cancelApplication(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getMyAlliance(req: any): Promise<{
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
            ranks: import("./schemas/alliance.schema").AllianceRank[];
            createdAt: any;
        };
        pendingAlliance?: undefined;
    }>;
    leaveAlliance(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getMembers(req: any): Promise<{
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
    updateMemberRank(req: any, memberId: string, dto: UpdateMemberRankDto): Promise<{
        success: boolean;
        message: string;
    }>;
    kickMember(req: any, memberId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getApplications(req: any): Promise<{
        applications: import("./schemas/alliance.schema").AllianceApplication[];
    }>;
    acceptApplication(req: any, applicantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectApplication(req: any, applicantId: string, dto: RejectApplicationDto): Promise<{
        success: boolean;
        message: string;
    }>;
    updateSettings(req: any, dto: UpdateAllianceSettingsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    updateName(req: any, dto: UpdateAllianceNameDto): Promise<{
        success: boolean;
        message: string;
    }>;
    updateTag(req: any, dto: UpdateAllianceTagDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getRanks(req: any): Promise<{
        ranks: import("./schemas/alliance.schema").AllianceRank[];
    }>;
    createRank(req: any, dto: CreateRankDto): Promise<{
        success: boolean;
        message: string;
    }>;
    updateRank(req: any, rankName: string, dto: UpdateRankDto): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteRank(req: any, rankName: string): Promise<{
        success: boolean;
        message: string;
    }>;
    transferAlliance(req: any, dto: TransferAllianceDto): Promise<{
        success: boolean;
        message: string;
    }>;
    dissolveAlliance(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    sendCircularMessage(req: any, dto: CircularMessageDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
