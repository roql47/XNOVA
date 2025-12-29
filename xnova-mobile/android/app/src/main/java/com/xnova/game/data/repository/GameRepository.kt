package com.xnova.game.data.repository

import com.xnova.game.data.model.*
import com.xnova.game.data.remote.ApiService
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GameRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    // ===== 자원 =====
    suspend fun getResources(): Result<ResourcesResponse> {
        return try {
            val response = apiService.getResources()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("자원 정보를 불러올 수 없습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    // ===== 건물 =====
    suspend fun getBuildings(): Result<BuildingsResponse> {
        return try {
            val response = apiService.getBuildings()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("건물 정보를 불러올 수 없습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun upgradeBuilding(buildingType: String): Result<UpgradeResponse> {
        return try {
            val response = apiService.upgradeBuilding(UpgradeRequest(buildingType))
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("업그레이드에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun completeBuilding(): Result<Map<String, Any>> {
        return try {
            val response = apiService.completeBuilding()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("완료 처리에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun cancelBuilding(): Result<Map<String, Any>> {
        return try {
            val response = apiService.cancelBuilding()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("건설 취소에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    // ===== 연구 =====
    suspend fun getResearch(): Result<ResearchResponse> {
        return try {
            val response = apiService.getResearch()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("연구 정보를 불러올 수 없습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun startResearch(researchType: String): Result<Map<String, Any>> {
        return try {
            val response = apiService.startResearch(ResearchRequest(researchType))
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("연구 시작에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun completeResearch(): Result<Map<String, Any>> {
        return try {
            val response = apiService.completeResearch()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("완료 처리에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun cancelResearch(): Result<Map<String, Any>> {
        return try {
            val response = apiService.cancelResearch()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("연구 취소에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    // ===== 함대 =====
    suspend fun getFleet(): Result<FleetResponse> {
        return try {
            val response = apiService.getFleet()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("함대 정보를 불러올 수 없습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun buildFleet(fleetType: String, quantity: Int): Result<Map<String, Any>> {
        return try {
            val response = apiService.buildFleet(BuildFleetRequest(fleetType, quantity))
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("함대 건조에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun completeFleet(): Result<Map<String, Any>> {
        return try {
            val response = apiService.completeFleet()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("완료 처리에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    // ===== 방어시설 =====
    suspend fun getDefense(): Result<DefenseResponse> {
        return try {
            val response = apiService.getDefense()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("방어시설 정보를 불러올 수 없습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun buildDefense(defenseType: String, quantity: Int): Result<Map<String, Any>> {
        return try {
            val response = apiService.buildDefense(BuildDefenseRequest(defenseType, quantity))
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("방어시설 건조에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun completeDefense(): Result<Map<String, Any>> {
        return try {
            val response = apiService.completeDefense()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("완료 처리에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    // ===== 은하 =====
    suspend fun getGalaxyMap(galaxy: Int, system: Int): Result<GalaxyResponse> {
        return try {
            val response = apiService.getGalaxyMap(galaxy, system)
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("은하 정보를 불러올 수 없습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    // ===== 전투 =====
    suspend fun attack(targetCoord: String, fleet: Map<String, Int>): Result<AttackResponse> {
        return try {
            val response = apiService.attack(AttackRequest(targetCoord, fleet))
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("공격에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun getBattleStatus(): Result<BattleStatus> {
        return try {
            val response = apiService.getBattleStatus()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("전투 상태를 불러올 수 없습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    // ===== 랭킹 =====
    suspend fun getRanking(type: String = "total", limit: Int = 100): Result<RankingResponse> {
        return try {
            val response = apiService.getRanking(type, limit)
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("랭킹을 불러올 수 없습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
    
    suspend fun getMyRank(): Result<MyRankResponse> {
        return try {
            val response = apiService.getMyRank()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("내 랭킹을 불러올 수 없습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류")
        }
    }
}

