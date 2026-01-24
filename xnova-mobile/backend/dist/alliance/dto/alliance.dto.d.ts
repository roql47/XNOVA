export declare class CreateAllianceDto {
    tag: string;
    name: string;
}
export declare class SearchAllianceDto {
    query: string;
}
export declare class ApplyAllianceDto {
    message?: string;
}
export declare class RejectApplicationDto {
    reason?: string;
}
export declare class UpdateAllianceSettingsDto {
    externalText?: string;
    internalText?: string;
    logo?: string;
    website?: string;
    isOpen?: boolean;
    ownerTitle?: string;
}
export declare class UpdateAllianceNameDto {
    name: string;
}
export declare class UpdateAllianceTagDto {
    tag: string;
}
export declare class CreateRankDto {
    name: string;
    delete?: boolean;
    kick?: boolean;
    applications?: boolean;
    memberlist?: boolean;
    manageApplications?: boolean;
    administrate?: boolean;
    onlineStatus?: boolean;
    mails?: boolean;
    rightHand?: boolean;
}
export declare class UpdateRankDto {
    newName?: string;
    delete?: boolean;
    kick?: boolean;
    applications?: boolean;
    memberlist?: boolean;
    manageApplications?: boolean;
    administrate?: boolean;
    onlineStatus?: boolean;
    mails?: boolean;
    rightHand?: boolean;
}
export declare class UpdateMemberRankDto {
    rankName: string | null;
}
export declare class TransferAllianceDto {
    newOwnerId: string;
}
export declare class CircularMessageDto {
    title: string;
    content: string;
}
