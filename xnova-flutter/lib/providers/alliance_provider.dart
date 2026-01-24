import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/services/api_service.dart';
import '../data/models/alliance_models.dart';
import 'providers.dart';

// ===== 연합 상태 =====
class AllianceState {
  final String status;  // 'none', 'pending', 'member'
  final Alliance? myAlliance;  // 내가 가입한 연합 정보
  final AllianceSearchResult? pendingAlliance;  // 대기 중인 가입 신청 연합
  final List<AllianceSearchResult> searchResults;  // 검색 결과
  final List<AllianceMember> members;  // 연합 멤버 목록
  final List<AllianceApplication> applications;  // 가입 신청 목록
  final bool isLoading;
  final String? error;
  final String? successMessage;

  AllianceState({
    this.status = 'none',
    this.myAlliance,
    this.pendingAlliance,
    this.searchResults = const [],
    this.members = const [],
    this.applications = const [],
    this.isLoading = false,
    this.error,
    this.successMessage,
  });

  AllianceState copyWith({
    String? status,
    Alliance? myAlliance,
    bool clearMyAlliance = false,
    AllianceSearchResult? pendingAlliance,
    bool clearPendingAlliance = false,
    List<AllianceSearchResult>? searchResults,
    List<AllianceMember>? members,
    List<AllianceApplication>? applications,
    bool? isLoading,
    String? error,
    String? successMessage,
    bool clearMessages = false,
  }) {
    return AllianceState(
      status: status ?? this.status,
      myAlliance: clearMyAlliance ? null : (myAlliance ?? this.myAlliance),
      pendingAlliance: clearPendingAlliance ? null : (pendingAlliance ?? this.pendingAlliance),
      searchResults: searchResults ?? this.searchResults,
      members: members ?? this.members,
      applications: applications ?? this.applications,
      isLoading: isLoading ?? this.isLoading,
      error: clearMessages ? null : error,
      successMessage: clearMessages ? null : successMessage,
    );
  }

  bool get hasAlliance => status == 'member' && myAlliance != null;
  bool get isPending => status == 'pending';
  bool get isLeader => myAlliance?.isOwner == true;
}

class AllianceNotifier extends StateNotifier<AllianceState> {
  final ApiService _apiService;

  AllianceNotifier(this._apiService) : super(AllianceState());

  // 내 연합 정보 로드
  Future<void> loadMyAlliance() async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final response = await _apiService.getMyAlliance();
      state = state.copyWith(
        status: response.status,
        myAlliance: response.alliance,
        clearMyAlliance: response.alliance == null,
        pendingAlliance: response.pendingAlliance,
        clearPendingAlliance: response.pendingAlliance == null,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        status: 'none',
        isLoading: false,
        clearMyAlliance: true,
        clearPendingAlliance: true,
      );
    }
  }

  // 연합 생성
  Future<bool> createAlliance(String tag, String name) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.createAlliance(
        CreateAllianceRequest(tag: tag, name: name),
      );
      state = state.copyWith(
        status: 'member',
        myAlliance: alliance,
        isLoading: false,
        successMessage: '연합 [$tag] $name이 생성되었습니다!',
      );
      return true;
    } catch (e) {
      String errorMsg = '연합 생성에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  // 연합 검색 (빈 쿼리 시 전체 연합 반환)
  Future<void> searchAlliances([String? query]) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final results = await _apiService.searchAlliances(query: query);
      state = state.copyWith(searchResults: results, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '검색에 실패했습니다.');
    }
  }

  // 연합 가입 신청
  Future<bool> applyForAlliance(String allianceId, String applicationText) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.applyForAlliance(
        ApplyForAllianceRequest(
          allianceId: allianceId,
          applicationText: applicationText,
        ),
      );
      state = state.copyWith(
        isLoading: false,
        successMessage: '가입 신청이 완료되었습니다.',
      );
      return true;
    } catch (e) {
      String errorMsg = '가입 신청에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  // 가입 신청 취소
  Future<bool> cancelApplication() async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.cancelApplication();
      state = state.copyWith(
        status: 'none',
        clearPendingAlliance: true,
        isLoading: false,
        successMessage: '가입 신청이 취소되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '신청 취소에 실패했습니다.');
      return false;
    }
  }

  // 연합 탈퇴
  Future<bool> exitAlliance() async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.exitAlliance();
      state = state.copyWith(
        status: 'none',
        clearMyAlliance: true,
        clearPendingAlliance: true,
        isLoading: false,
        successMessage: '연합에서 탈퇴했습니다.',
      );
      return true;
    } catch (e) {
      String errorMsg = '연합 탈퇴에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  // 멤버 목록 로드
  Future<void> loadMembers() async {
    if (state.myAlliance == null) return;
    try {
      final members = await _apiService.getAllianceMembers();
      state = state.copyWith(members: members);
    } catch (e) {
      // ignore
    }
  }

  // 가입 신청 목록 로드
  Future<void> loadApplications() async {
    if (state.myAlliance == null) return;
    try {
      final applications = await _apiService.getJoinRequests();
      state = state.copyWith(applications: applications);
    } catch (e) {
      // ignore
    }
  }

  // 가입 신청 승인
  Future<bool> acceptApplication(String applicantId) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.acceptApplication(applicantId);
      await loadApplications();
      await loadMyAlliance();  // 멤버 수 갱신
      state = state.copyWith(
        isLoading: false,
        successMessage: '가입 신청을 승인했습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '신청 처리에 실패했습니다.');
      return false;
    }
  }

  // 가입 신청 거절
  Future<bool> rejectApplication(String applicantId, {String? reason}) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.rejectApplication(applicantId, reason);
      await loadApplications();
      state = state.copyWith(
        isLoading: false,
        successMessage: '가입 신청을 거절했습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '신청 처리에 실패했습니다.');
      return false;
    }
  }

  // 멤버 추방
  Future<bool> kickMember(String memberId) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.kickMember(memberId);
      await loadMembers();
      await loadMyAlliance();  // 멤버 수 갱신
      state = state.copyWith(
        isLoading: false,
        successMessage: '멤버를 추방했습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '멤버 추방에 실패했습니다.');
      return false;
    }
  }

  // 연합 정보 수정
  Future<bool> updateAllianceSettings({
    String? externalText,
    String? internalText,
    String? website,
    String? logo,
    bool? isOpen,
    String? ownerTitle,
  }) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.updateAllianceSettings(
        externalText: externalText,
        internalText: internalText,
        website: website,
        logo: logo,
        isOpen: isOpen,
        ownerTitle: ownerTitle,
      );
      await loadMyAlliance();  // 정보 갱신
      state = state.copyWith(
        isLoading: false,
        successMessage: '연합 정보가 수정되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '정보 수정에 실패했습니다.');
      return false;
    }
  }

  // 연합 이름 변경
  Future<bool> changeAllianceName(String name) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.changeAllianceName(name);
      await loadMyAlliance();
      state = state.copyWith(
        isLoading: false,
        successMessage: '연합 이름이 변경되었습니다.',
      );
      return true;
    } catch (e) {
      String errorMsg = '변경에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  // 연합 태그 변경
  Future<bool> changeAllianceTag(String tag) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.changeAllianceTag(tag);
      await loadMyAlliance();
      state = state.copyWith(
        isLoading: false,
        successMessage: '연합 태그가 변경되었습니다.',
      );
      return true;
    } catch (e) {
      String errorMsg = '변경에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  // 연합 양도
  Future<bool> transferAlliance(String newOwnerId) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.transferAlliance(newOwnerId);
      await loadMyAlliance();
      state = state.copyWith(
        isLoading: false,
        successMessage: '연합 리더가 변경되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '연합 양도에 실패했습니다.');
      return false;
    }
  }

  // 연합 해산
  Future<bool> disbandAlliance() async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.disbandAlliance();
      state = state.copyWith(
        status: 'none',
        clearMyAlliance: true,
        clearPendingAlliance: true,
        members: [],
        applications: [],
        isLoading: false,
        successMessage: '연합이 해산되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '연합 해산에 실패했습니다.');
      return false;
    }
  }

  // 계급 생성
  Future<bool> createRank(String name, RankPermissions permissions) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.createRank(
        CreateRankRequest(name: name, permissions: permissions),
      );
      await loadMyAlliance();  // 계급 목록 갱신
      state = state.copyWith(
        isLoading: false,
        successMessage: '계급이 생성되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '계급 생성에 실패했습니다.');
      return false;
    }
  }

  // 계급 삭제
  Future<bool> deleteRank(String rankName) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.deleteRank(rankName);
      await loadMyAlliance();  // 계급 목록 갱신
      state = state.copyWith(
        isLoading: false,
        successMessage: '계급이 삭제되었습니다.',
      );
      return true;
    } catch (e) {
      String errorMsg = '계급 삭제에 실패했습니다.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          errorMsg = data['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    }
  }

  // 멤버 계급 변경
  Future<bool> changeMemberRank(String memberId, String? rankName) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.changeMemberRank(memberId, rankName);
      await loadMembers();
      state = state.copyWith(
        isLoading: false,
        successMessage: '멤버 계급이 변경되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '계급 변경에 실패했습니다.');
      return false;
    }
  }

  // 메시지 초기화
  void clearMessages() {
    state = state.copyWith(clearMessages: true);
  }
}

final allianceProvider = StateNotifierProvider<AllianceNotifier, AllianceState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AllianceNotifier(apiService);
});
