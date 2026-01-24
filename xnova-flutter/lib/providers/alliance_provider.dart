import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/services/api_service.dart';
import '../data/models/alliance_models.dart';
import 'providers.dart';

// ===== 연합 상태 =====
class AllianceState {
  final Alliance? myAlliance;  // 내가 가입한 연합 정보
  final List<AllianceSearchResult> searchResults;  // 검색 결과
  final List<AllianceMember> members;  // 연합 멤버 목록
  final List<AllianceJoinRequest> joinRequests;  // 가입 신청 목록
  final bool isLoading;
  final String? error;
  final String? successMessage;

  AllianceState({
    this.myAlliance,
    this.searchResults = const [],
    this.members = const [],
    this.joinRequests = const [],
    this.isLoading = false,
    this.error,
    this.successMessage,
  });

  AllianceState copyWith({
    Alliance? myAlliance,
    bool clearMyAlliance = false,
    List<AllianceSearchResult>? searchResults,
    List<AllianceMember>? members,
    List<AllianceJoinRequest>? joinRequests,
    bool? isLoading,
    String? error,
    String? successMessage,
    bool clearMessages = false,
  }) {
    return AllianceState(
      myAlliance: clearMyAlliance ? null : (myAlliance ?? this.myAlliance),
      searchResults: searchResults ?? this.searchResults,
      members: members ?? this.members,
      joinRequests: joinRequests ?? this.joinRequests,
      isLoading: isLoading ?? this.isLoading,
      error: clearMessages ? null : error,
      successMessage: clearMessages ? null : successMessage,
    );
  }

  bool get hasAlliance => myAlliance != null;
  bool get isLeader => myAlliance?.isOwner == true;
}

class AllianceNotifier extends StateNotifier<AllianceState> {
  final ApiService _apiService;

  AllianceNotifier(this._apiService) : super(AllianceState());

  // 내 연합 정보 로드
  Future<void> loadMyAlliance() async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.getMyAlliance();
      state = state.copyWith(
        myAlliance: alliance,
        clearMyAlliance: alliance == null,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, clearMyAlliance: true);
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

  // 연합 검색
  Future<void> searchAlliances(String query) async {
    if (query.trim().isEmpty) {
      state = state.copyWith(searchResults: []);
      return;
    }
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final results = await _apiService.searchAlliances(query);
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
  Future<bool> cancelApplication(String allianceId) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.cancelApplication(allianceId);
      state = state.copyWith(
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
        clearMyAlliance: true,
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
      final members = await _apiService.getAllianceMembers(state.myAlliance!.id);
      state = state.copyWith(members: members);
    } catch (e) {
      // ignore
    }
  }

  // 가입 신청 목록 로드
  Future<void> loadJoinRequests() async {
    if (state.myAlliance == null) return;
    try {
      final requests = await _apiService.getJoinRequests(state.myAlliance!.id);
      state = state.copyWith(joinRequests: requests);
    } catch (e) {
      // ignore
    }
  }

  // 가입 신청 처리 (승인/거절)
  Future<bool> processApplication(String requestId, bool approve, {String? rejectionReason}) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      await _apiService.processApplication(
        state.myAlliance!.id,
        ProcessApplicationRequest(
          requestId: requestId,
          approve: approve,
          rejectionReason: rejectionReason,
        ),
      );
      await loadJoinRequests();
      await loadMyAlliance();  // 멤버 수 갱신
      state = state.copyWith(
        isLoading: false,
        successMessage: approve ? '가입 신청을 승인했습니다.' : '가입 신청을 거절했습니다.',
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
      await _apiService.kickMember(
        state.myAlliance!.id,
        KickMemberRequest(memberId: memberId),
      );
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
  Future<bool> updateAllianceInfo({
    String? descriptionExternal,
    String? descriptionInternal,
    String? website,
    String? logoImageUrl,
    bool? openToApplications,
  }) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.updateAllianceInfo(
        state.myAlliance!.id,
        UpdateAllianceInfoRequest(
          descriptionExternal: descriptionExternal,
          descriptionInternal: descriptionInternal,
          website: website,
          logoImageUrl: logoImageUrl,
          openToApplications: openToApplications,
        ),
      );
      state = state.copyWith(
        myAlliance: alliance,
        isLoading: false,
        successMessage: '연합 정보가 수정되었습니다.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: '정보 수정에 실패했습니다.');
      return false;
    }
  }

  // 연합 이름/태그 변경
  Future<bool> changeAllianceNameTag({String? tag, String? name}) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.changeAllianceNameTag(
        state.myAlliance!.id,
        ChangeAllianceNameTagRequest(tag: tag, name: name),
      );
      state = state.copyWith(
        myAlliance: alliance,
        isLoading: false,
        successMessage: '연합 정보가 변경되었습니다.',
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
  Future<bool> transferAlliance(String newLeaderId) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.transferAlliance(
        state.myAlliance!.id,
        TransferAllianceRequest(newLeaderId: newLeaderId),
      );
      state = state.copyWith(
        myAlliance: alliance,
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
      await _apiService.disbandAlliance(state.myAlliance!.id);
      state = state.copyWith(
        clearMyAlliance: true,
        members: [],
        joinRequests: [],
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
      final alliance = await _apiService.createRank(
        state.myAlliance!.id,
        CreateRankRequest(name: name, permissions: permissions),
      );
      state = state.copyWith(
        myAlliance: alliance,
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
  Future<bool> deleteRank(String rankId) async {
    if (state.myAlliance == null) return false;
    state = state.copyWith(isLoading: true, clearMessages: true);
    try {
      final alliance = await _apiService.deleteRank(state.myAlliance!.id, rankId);
      state = state.copyWith(
        myAlliance: alliance,
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

  // 메시지 초기화
  void clearMessages() {
    state = state.copyWith(clearMessages: true);
  }
}

final allianceProvider = StateNotifierProvider<AllianceNotifier, AllianceState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AllianceNotifier(apiService);
});
