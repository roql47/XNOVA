package com.xnova.game.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.xnova.game.data.repository.AuthRepository
import com.xnova.game.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()
    
    val isLoggedIn = authRepository.isLoggedIn()
    
    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = AuthUiState(error = "이메일과 비밀번호를 입력해주세요.")
            return
        }
        
        viewModelScope.launch {
            _uiState.value = AuthUiState(isLoading = true)
            
            when (val result = authRepository.login(email, password)) {
                is Result.Success -> {
                    _uiState.value = AuthUiState(isSuccess = true)
                }
                is Result.Error -> {
                    _uiState.value = AuthUiState(error = result.message)
                }
                is Result.Loading -> {
                    _uiState.value = AuthUiState(isLoading = true)
                }
            }
        }
    }
    
    fun register(email: String, password: String, playerName: String) {
        if (email.isBlank() || password.isBlank() || playerName.isBlank()) {
            _uiState.value = AuthUiState(error = "모든 필드를 입력해주세요.")
            return
        }
        
        if (password.length < 6) {
            _uiState.value = AuthUiState(error = "비밀번호는 6자 이상이어야 합니다.")
            return
        }
        
        viewModelScope.launch {
            _uiState.value = AuthUiState(isLoading = true)
            
            when (val result = authRepository.register(email, password, playerName)) {
                is Result.Success -> {
                    _uiState.value = AuthUiState(isSuccess = true)
                }
                is Result.Error -> {
                    _uiState.value = AuthUiState(error = result.message)
                }
                is Result.Loading -> {
                    _uiState.value = AuthUiState(isLoading = true)
                }
            }
        }
    }
    
    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
    
    fun resetState() {
        _uiState.value = AuthUiState()
    }
}

