package com.xnova.game.data.repository

import com.xnova.game.data.local.TokenManager
import com.xnova.game.data.model.AuthResponse
import com.xnova.game.data.model.LoginRequest
import com.xnova.game.data.model.RegisterRequest
import com.xnova.game.data.model.UserProfile
import com.xnova.game.data.remote.ApiService
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) {
    
    fun isLoggedIn(): Flow<Boolean> = tokenManager.isLoggedIn()
    
    fun getPlayerName(): Flow<String?> = tokenManager.getPlayerName()
    
    fun getCoordinate(): Flow<String?> = tokenManager.getCoordinate()
    
    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                tokenManager.saveToken(authResponse.accessToken)
                tokenManager.saveUserInfo(
                    authResponse.user.id,
                    authResponse.user.playerName,
                    authResponse.user.coordinate
                )
                Result.Success(authResponse)
            } else {
                Result.Error(response.message() ?: "로그인에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류가 발생했습니다.")
        }
    }
    
    suspend fun register(email: String, password: String, playerName: String): Result<AuthResponse> {
        return try {
            val response = apiService.register(RegisterRequest(email, password, playerName))
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                tokenManager.saveToken(authResponse.accessToken)
                tokenManager.saveUserInfo(
                    authResponse.user.id,
                    authResponse.user.playerName,
                    authResponse.user.coordinate
                )
                Result.Success(authResponse)
            } else {
                Result.Error(response.message() ?: "회원가입에 실패했습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류가 발생했습니다.")
        }
    }
    
    suspend fun getProfile(): Result<UserProfile> {
        return try {
            val response = apiService.getProfile()
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("프로필을 불러올 수 없습니다.")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "네트워크 오류가 발생했습니다.")
        }
    }
    
    suspend fun logout() {
        tokenManager.clearAll()
    }
}

