// ===== 연합(Alliance) 관련 모델 =====

// 연합 계급 권한
class AllianceRank {
  final String name;
  final bool delete;
  final bool kick;
  final bool applications;
  final bool memberlist;
  final bool manageApplications;
  final bool administrate;
  final bool onlineStatus;
  final bool mails;
  final bool rightHand;

  AllianceRank({
    required this.name,
    this.delete = false,
    this.kick = false,
    this.applications = false,
    this.memberlist = false,
    this.manageApplications = false,
    this.administrate = false,
    this.onlineStatus = false,
    this.mails = false,
    this.rightHand = false,
  });

  factory AllianceRank.fromJson(Map<String, dynamic> json) => AllianceRank(
    name: json['name'] ?? '',
    delete: json['delete'] ?? false,
    kick: json['kick'] ?? false,
    applications: json['applications'] ?? false,
    memberlist: json['memberlist'] ?? false,
    manageApplications: json['manageApplications'] ?? false,
    administrate: json['administrate'] ?? false,
    onlineStatus: json['onlineStatus'] ?? false,
    mails: json['mails'] ?? false,
    rightHand: json['rightHand'] ?? false,
  );

  Map<String, dynamic> toJson() => {
    'name': name,
    'delete': delete,
    'kick': kick,
    'applications': applications,
    'memberlist': memberlist,
    'manageApplications': manageApplications,
    'administrate': administrate,
    'onlineStatus': onlineStatus,
    'mails': mails,
    'rightHand': rightHand,
  };
}

// 연합 멤버
class AllianceMember {
  final String id;
  final String playerName;
  final String coordinate;
  final String? rankName;
  final DateTime joinedAt;
  final bool isOwner;
  final DateTime? lastActivity;

  AllianceMember({
    required this.id,
    required this.playerName,
    required this.coordinate,
    this.rankName,
    required this.joinedAt,
    this.isOwner = false,
    this.lastActivity,
  });

  factory AllianceMember.fromJson(Map<String, dynamic> json) => AllianceMember(
    id: json['id'] ?? json['userId'] ?? '',
    playerName: json['playerName'] ?? '',
    coordinate: json['coordinate'] ?? '',
    rankName: json['rankName'],
    joinedAt: json['joinedAt'] != null 
        ? DateTime.parse(json['joinedAt']) 
        : DateTime.now(),
    isOwner: json['isOwner'] ?? false,
    lastActivity: json['lastActivity'] != null 
        ? DateTime.tryParse(json['lastActivity']) 
        : null,
  );
}

// 연합 가입 신청
class AllianceApplication {
  final String id;
  final String playerName;
  final String coordinate;
  final String message;
  final DateTime appliedAt;

  AllianceApplication({
    required this.id,
    required this.playerName,
    required this.coordinate,
    this.message = '',
    required this.appliedAt,
  });

  factory AllianceApplication.fromJson(Map<String, dynamic> json) => AllianceApplication(
    id: json['userId']?.toString() ?? json['id'] ?? '',
    playerName: json['playerName'] ?? '',
    coordinate: json['coordinate'] ?? '',
    message: json['message'] ?? '',
    appliedAt: json['appliedAt'] != null 
        ? DateTime.parse(json['appliedAt']) 
        : DateTime.now(),
  );
}

// 연합 권한
class AlliancePermissions {
  final bool delete;
  final bool kick;
  final bool applications;
  final bool memberlist;
  final bool manageApplications;
  final bool administrate;
  final bool onlineStatus;
  final bool mails;
  final bool rightHand;

  AlliancePermissions({
    this.delete = false,
    this.kick = false,
    this.applications = false,
    this.memberlist = false,
    this.manageApplications = false,
    this.administrate = false,
    this.onlineStatus = false,
    this.mails = false,
    this.rightHand = false,
  });

  factory AlliancePermissions.fromJson(Map<String, dynamic> json) => AlliancePermissions(
    delete: json['delete'] ?? false,
    kick: json['kick'] ?? false,
    applications: json['applications'] ?? false,
    memberlist: json['memberlist'] ?? false,
    manageApplications: json['manageApplications'] ?? false,
    administrate: json['administrate'] ?? false,
    onlineStatus: json['onlineStatus'] ?? false,
    mails: json['mails'] ?? false,
    rightHand: json['rightHand'] ?? false,
  );
}

// 연합 정보 (전체)
class Alliance {
  final String id;
  final String tag;
  final String name;
  final String ownerId;
  final String ownerTitle;
  final String externalText;
  final String internalText;
  final String logo;
  final String website;
  final bool isOpen;
  final int memberCount;
  final int applicationCount;
  final String? myRank;
  final bool isOwner;
  final AlliancePermissions permissions;
  final List<AllianceRank> ranks;
  final DateTime? createdAt;

  Alliance({
    required this.id,
    required this.tag,
    required this.name,
    required this.ownerId,
    this.ownerTitle = '창립자',
    this.externalText = '',
    this.internalText = '',
    this.logo = '',
    this.website = '',
    this.isOpen = true,
    this.memberCount = 1,
    this.applicationCount = 0,
    this.myRank,
    this.isOwner = false,
    AlliancePermissions? permissions,
    this.ranks = const [],
    this.createdAt,
  }) : permissions = permissions ?? AlliancePermissions();

  factory Alliance.fromJson(Map<String, dynamic> json) => Alliance(
    id: json['id'] ?? '',
    tag: json['tag'] ?? '',
    name: json['name'] ?? '',
    ownerId: json['ownerId'] ?? '',
    ownerTitle: json['ownerTitle'] ?? '창립자',
    externalText: json['externalText'] ?? '',
    internalText: json['internalText'] ?? '',
    logo: json['logo'] ?? '',
    website: json['website'] ?? '',
    isOpen: json['isOpen'] ?? true,
    memberCount: json['memberCount'] ?? 1,
    applicationCount: json['applicationCount'] ?? 0,
    myRank: json['myRank'],
    isOwner: json['isOwner'] ?? false,
    permissions: json['permissions'] != null 
        ? AlliancePermissions.fromJson(json['permissions']) 
        : AlliancePermissions(),
    ranks: (json['ranks'] as List<dynamic>?)
        ?.map((e) => AllianceRank.fromJson(e))
        .toList() ?? [],
    createdAt: json['createdAt'] != null 
        ? DateTime.tryParse(json['createdAt']) 
        : null,
  );
}

// 연합 검색 결과
class AllianceSearchResult {
  final String id;
  final String tag;
  final String name;
  final int memberCount;
  final bool isOpen;
  final String externalText;
  final String logo;

  AllianceSearchResult({
    required this.id,
    required this.tag,
    required this.name,
    this.memberCount = 0,
    this.isOpen = true,
    this.externalText = '',
    this.logo = '',
  });

  factory AllianceSearchResult.fromJson(Map<String, dynamic> json) => AllianceSearchResult(
    id: json['id'] ?? '',
    tag: json['tag'] ?? '',
    name: json['name'] ?? '',
    memberCount: json['memberCount'] ?? 0,
    isOpen: json['isOpen'] ?? true,
    externalText: json['externalText'] ?? '',
    logo: json['logo'] ?? '',
  );
}

// 내 연합 상태 응답
class MyAllianceResponse {
  final String status; // 'none', 'pending', 'member'
  final Alliance? alliance;
  final AllianceSearchResult? pendingAlliance;

  MyAllianceResponse({
    required this.status,
    this.alliance,
    this.pendingAlliance,
  });

  factory MyAllianceResponse.fromJson(Map<String, dynamic> json) {
    final status = json['status'] ?? 'none';
    return MyAllianceResponse(
      status: status,
      alliance: status == 'member' && json['alliance'] != null 
          ? Alliance.fromJson(json['alliance']) 
          : null,
      pendingAlliance: status == 'pending' && json['pendingAlliance'] != null 
          ? AllianceSearchResult.fromJson(json['pendingAlliance']) 
          : null,
    );
  }
}

// 연합 가입 신청 (서버에서 받아오는 데이터)
class AllianceJoinRequest {
  final String id;
  final String userId;
  final String playerName;
  final String applicationText;
  final DateTime requestedAt;

  AllianceJoinRequest({
    required this.id,
    required this.userId,
    required this.playerName,
    required this.applicationText,
    required this.requestedAt,
  });

  factory AllianceJoinRequest.fromJson(Map<String, dynamic> json) => AllianceJoinRequest(
    id: json['_id'] ?? json['id'] ?? '',
    userId: json['userId'] ?? '',
    playerName: json['playerName'] ?? '',
    applicationText: json['applicationText'] ?? '',
    requestedAt: json['requestedAt'] != null
        ? DateTime.parse(json['requestedAt'])
        : DateTime.now(),
  );
}

// ===== API 요청 DTO =====

// 연합 생성 요청
class CreateAllianceRequest {
  final String tag;
  final String name;

  CreateAllianceRequest({required this.tag, required this.name});

  Map<String, dynamic> toJson() => {
    'tag': tag,
    'name': name,
  };
}

// 연합 가입 신청 요청
class ApplyForAllianceRequest {
  final String allianceId;
  final String applicationText;

  ApplyForAllianceRequest({
    required this.allianceId,
    required this.applicationText,
  });

  Map<String, dynamic> toJson() => {
    'allianceId': allianceId,
    'applicationText': applicationText,
  };
}

// 계급 생성 요청
class CreateRankRequest {
  final String name;
  final RankPermissions permissions;

  CreateRankRequest({required this.name, required this.permissions});

  Map<String, dynamic> toJson() => {
    'name': name,
    'permissions': permissions.toJson(),
  };
}

// 계급 권한 DTO
class RankPermissions {
  final int mails;
  final int delete;
  final int kick;
  final int bewerbungen;
  final int administrieren;
  final int bewerbungenbearbeiten;
  final int memberlist;
  final int onlinestatus;
  final int rechtehand;

  RankPermissions({
    this.mails = 0,
    this.delete = 0,
    this.kick = 0,
    this.bewerbungen = 0,
    this.administrieren = 0,
    this.bewerbungenbearbeiten = 0,
    this.memberlist = 0,
    this.onlinestatus = 0,
    this.rechtehand = 0,
  });

  Map<String, dynamic> toJson() => {
    'mails': mails,
    'delete': delete,
    'kick': kick,
    'bewerbungen': bewerbungen,
    'administrieren': administrieren,
    'bewerbungenbearbeiten': bewerbungenbearbeiten,
    'memberlist': memberlist,
    'onlinestatus': onlinestatus,
    'rechtehand': rechtehand,
  };
}

// 계급 수정 요청
class UpdateRankRequest {
  final String rankId;
  final String name;
  final RankPermissions permissions;

  UpdateRankRequest({
    required this.rankId,
    required this.name,
    required this.permissions,
  });

  Map<String, dynamic> toJson() => {
    'rankId': rankId,
    'name': name,
    'permissions': permissions.toJson(),
  };
}

// 멤버 계급 변경 요청
class ChangeMemberRankRequest {
  final String memberId;
  final String newRankId;

  ChangeMemberRankRequest({required this.memberId, required this.newRankId});

  Map<String, dynamic> toJson() => {
    'memberId': memberId,
    'newRankId': newRankId,
  };
}

// 멤버 추방 요청
class KickMemberRequest {
  final String memberId;

  KickMemberRequest({required this.memberId});

  Map<String, dynamic> toJson() => {
    'memberId': memberId,
  };
}

// 가입 신청 처리 요청
class ProcessApplicationRequest {
  final String requestId;
  final bool approve;
  final String? rejectionReason;

  ProcessApplicationRequest({
    required this.requestId,
    required this.approve,
    this.rejectionReason,
  });

  Map<String, dynamic> toJson() => {
    'requestId': requestId,
    'approve': approve,
    if (rejectionReason != null) 'rejectionReason': rejectionReason,
  };
}

// 연합 정보 수정 요청
class UpdateAllianceInfoRequest {
  final String? descriptionExternal;
  final String? descriptionInternal;
  final String? website;
  final String? logoImageUrl;
  final bool? openToApplications;

  UpdateAllianceInfoRequest({
    this.descriptionExternal,
    this.descriptionInternal,
    this.website,
    this.logoImageUrl,
    this.openToApplications,
  });

  Map<String, dynamic> toJson() => {
    if (descriptionExternal != null) 'descriptionExternal': descriptionExternal,
    if (descriptionInternal != null) 'descriptionInternal': descriptionInternal,
    if (website != null) 'website': website,
    if (logoImageUrl != null) 'logoImageUrl': logoImageUrl,
    if (openToApplications != null) 'openToApplications': openToApplications,
  };
}

// 연합 이름/태그 변경 요청
class ChangeAllianceNameTagRequest {
  final String? tag;
  final String? name;

  ChangeAllianceNameTagRequest({this.tag, this.name});

  Map<String, dynamic> toJson() => {
    if (tag != null) 'tag': tag,
    if (name != null) 'name': name,
  };
}

// 연합 양도 요청
class TransferAllianceRequest {
  final String newLeaderId;

  TransferAllianceRequest({required this.newLeaderId});

  Map<String, dynamic> toJson() => {
    'newLeaderId': newLeaderId,
  };
}
