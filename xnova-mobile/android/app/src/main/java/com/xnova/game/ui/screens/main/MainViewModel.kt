package com.xnova.game.ui.screens.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.xnova.game.data.local.TokenManager
import com.xnova.game.data.model.*
import com.xnova.game.data.repository.GameRepository
import com.xnova.game.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.format.DateTimeFormatter
import javax.inject.Inject

data class MainUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val playerName: String? = null,
    val coordinate: String? = null,
    
    // 자원
    val resources: Resources? = null,
    val production: Production? = null,
    val energyRatio: Int = 100,
    
    // 건물
    val buildings: List<BuildingInfo> = emptyList(),
    val constructionProgress: ProgressInfo? = null,
    val constructionRemainingSeconds: Long = 0,
    
    // 연구
    val research: List<ResearchInfo> = emptyList(),
    val researchProgress: ProgressInfo? = null,
    val researchRemainingSeconds: Long = 0,
    val labLevel: Int = 0,
    
    // 함대
    val fleet: List<FleetInfo> = emptyList(),
    val fleetProgress: ProgressInfo? = null,
    val fleetRemainingSeconds: Long = 0,
    
    // 방어
    val defense: List<DefenseInfo> = emptyList(),
    val defenseProgress: ProgressInfo? = null,
    val defenseRemainingSeconds: Long = 0,
    
    // 은하
    val galaxyPlanets: List<PlanetInfo> = emptyList(),
    val currentGalaxy: Int = 1,
    val currentSystem: Int = 1,
    
    // 전투
    val battleStatus: BattleStatus? = null
)

@HiltViewModel
class MainViewModel @Inject constructor(
    private val gameRepository: GameRepository,
    private val tokenManager: TokenManager
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()
    
    private var timerJob: Job? = null
    private var isCompletingConstruction = false
    private var isCompletingResearch = false
    private var isCompletingFleet = false
    private var isCompletingDefense = false
    
    init {
        loadUserInfo()
        startTimerLoop()
    }
    
    private fun startTimerLoop() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (true) {
                updateRemainingTimes()
                delay(1000L)
            }
        }
    }
    
    private fun updateRemainingTimes() {
        val currentState = _uiState.value
        val now = System.currentTimeMillis()
        
        // 건설 남은 시간
        val constructionRemaining = currentState.constructionProgress?.let {
            calculateRemainingSeconds(it.finishTime, now)
        } ?: 0
        
        // 연구 남은 시간
        val researchRemaining = currentState.researchProgress?.let {
            calculateRemainingSeconds(it.finishTime, now)
        } ?: 0
        
        // 함대 남은 시간
        val fleetRemaining = currentState.fleetProgress?.let {
            calculateRemainingSeconds(it.finishTime, now)
        } ?: 0
        
        // 방어 남은 시간
        val defenseRemaining = currentState.defenseProgress?.let {
            calculateRemainingSeconds(it.finishTime, now)
        } ?: 0
        
        _uiState.value = currentState.copy(
            constructionRemainingSeconds = constructionRemaining,
            researchRemainingSeconds = researchRemaining,
            fleetRemainingSeconds = fleetRemaining,
            defenseRemainingSeconds = defenseRemaining
        )
        
        // 자동 완료 체크 (중복 호출 방지)
        if (constructionRemaining <= 0 && currentState.constructionProgress != null && !isCompletingConstruction) {
            completeBuilding()
        }
        if (researchRemaining <= 0 && currentState.researchProgress != null && !isCompletingResearch) {
            completeResearch()
        }
        if (fleetRemaining <= 0 && currentState.fleetProgress != null && !isCompletingFleet) {
            completeFleet()
        }
        if (defenseRemaining <= 0 && currentState.defenseProgress != null && !isCompletingDefense) {
            completeDefense()
        }
    }
    
    private fun calculateRemainingSeconds(finishTimeStr: String, nowMillis: Long): Long {
        return try {
            val finishTime = Instant.parse(finishTimeStr).toEpochMilli()
            val remaining = (finishTime - nowMillis) / 1000
            if (remaining < 0) 0 else remaining
        } catch (e: Exception) {
            0
        }
    }
    
    private fun loadUserInfo() {
        viewModelScope.launch {
            val playerName = tokenManager.getPlayerName().first()
            val coordinate = tokenManager.getCoordinate().first()
            _uiState.value = _uiState.value.copy(
                playerName = playerName,
                coordinate = coordinate
            )
            
            // 좌표에서 현재 은하/시스템 파싱
            coordinate?.let {
                val parts = it.split(":")
                if (parts.size == 3) {
                    _uiState.value = _uiState.value.copy(
                        currentGalaxy = parts[0].toIntOrNull() ?: 1,
                        currentSystem = parts[1].toIntOrNull() ?: 1
                    )
                }
            }
        }
    }
    
    fun loadData() {
        loadResources()
        loadBuildings()
        loadResearch()
        loadFleet()
        loadDefense()
        loadBattleStatus()
    }
    
    fun loadResources() {
        viewModelScope.launch {
            when (val result = gameRepository.getResources()) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        resources = result.data.resources,
                        production = result.data.production,
                        energyRatio = result.data.energyRatio
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
        }
    }
    
    fun loadBuildings() {
        viewModelScope.launch {
            when (val result = gameRepository.getBuildings()) {
                is Result.Success -> {
                    val progress = result.data.constructionProgress
                    val remainingSeconds = progress?.let {
                        calculateRemainingSeconds(it.finishTime, System.currentTimeMillis())
                    } ?: 0L
                    
                    _uiState.value = _uiState.value.copy(
                        buildings = result.data.buildings,
                        constructionProgress = progress,
                        constructionRemainingSeconds = remainingSeconds
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
        }
    }
    
    fun loadResearch() {
        viewModelScope.launch {
            when (val result = gameRepository.getResearch()) {
                is Result.Success -> {
                    val progress = result.data.researchProgress
                    val remainingSeconds = progress?.let {
                        calculateRemainingSeconds(it.finishTime, System.currentTimeMillis())
                    } ?: 0L
                    
                    _uiState.value = _uiState.value.copy(
                        research = result.data.research,
                        researchProgress = progress,
                        researchRemainingSeconds = remainingSeconds,
                        labLevel = result.data.labLevel
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
        }
    }
    
    fun loadFleet() {
        viewModelScope.launch {
            when (val result = gameRepository.getFleet()) {
                is Result.Success -> {
                    val progress = result.data.fleetProgress
                    val remainingSeconds = progress?.let {
                        calculateRemainingSeconds(it.finishTime, System.currentTimeMillis())
                    } ?: 0L
                    
                    _uiState.value = _uiState.value.copy(
                        fleet = result.data.fleet,
                        fleetProgress = progress,
                        fleetRemainingSeconds = remainingSeconds
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
        }
    }
    
    fun loadDefense() {
        viewModelScope.launch {
            when (val result = gameRepository.getDefense()) {
                is Result.Success -> {
                    val progress = result.data.defenseProgress
                    val remainingSeconds = progress?.let {
                        calculateRemainingSeconds(it.finishTime, System.currentTimeMillis())
                    } ?: 0L
                    
                    _uiState.value = _uiState.value.copy(
                        defense = result.data.defense,
                        defenseProgress = progress,
                        defenseRemainingSeconds = remainingSeconds
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
        }
    }
    
    fun loadBattleStatus() {
        viewModelScope.launch {
            when (val result = gameRepository.getBattleStatus()) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(battleStatus = result.data)
                }
                is Result.Error -> {}
                else -> {}
            }
        }
    }
    
    fun loadGalaxy(galaxy: Int, system: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                currentGalaxy = galaxy,
                currentSystem = system
            )
            when (val result = gameRepository.getGalaxyMap(galaxy, system)) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        galaxyPlanets = result.data.planets
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
        }
    }
    
    fun upgradeBuilding(buildingType: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = gameRepository.upgradeBuilding(buildingType)) {
                is Result.Success -> {
                    loadBuildings()
                    loadResources()
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }
    
    fun completeBuilding() {
        if (isCompletingConstruction) return
        isCompletingConstruction = true
        viewModelScope.launch {
            when (val result = gameRepository.completeBuilding()) {
                is Result.Success -> {
                    loadBuildings()
                    loadResources()
                }
                is Result.Error -> {}
                else -> {}
            }
            isCompletingConstruction = false
        }
    }
    
    fun cancelBuilding() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = gameRepository.cancelBuilding()) {
                is Result.Success -> {
                    loadBuildings()
                    loadResources()
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }
    
    fun completeResearch() {
        if (isCompletingResearch) return
        isCompletingResearch = true
        viewModelScope.launch {
            when (val result = gameRepository.completeResearch()) {
                is Result.Success -> {
                    loadResearch()
                    loadResources()
                }
                is Result.Error -> {}
                else -> {}
            }
            isCompletingResearch = false
        }
    }
    
    fun cancelResearch() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = gameRepository.cancelResearch()) {
                is Result.Success -> {
                    loadResearch()
                    loadResources()
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }
    
    fun completeFleet() {
        if (isCompletingFleet) return
        isCompletingFleet = true
        viewModelScope.launch {
            when (val result = gameRepository.completeFleet()) {
                is Result.Success -> {
                    loadFleet()
                    loadResources()
                }
                is Result.Error -> {}
                else -> {}
            }
            isCompletingFleet = false
        }
    }
    
    fun completeDefense() {
        if (isCompletingDefense) return
        isCompletingDefense = true
        viewModelScope.launch {
            when (val result = gameRepository.completeDefense()) {
                is Result.Success -> {
                    loadDefense()
                    loadResources()
                }
                is Result.Error -> {}
                else -> {}
            }
            isCompletingDefense = false
        }
    }
    
    fun startResearch(researchType: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = gameRepository.startResearch(researchType)) {
                is Result.Success -> {
                    loadResearch()
                    loadResources()
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }
    
    fun buildFleet(fleetType: String, quantity: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = gameRepository.buildFleet(fleetType, quantity)) {
                is Result.Success -> {
                    loadFleet()
                    loadResources()
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }
    
    fun buildDefense(defenseType: String, quantity: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = gameRepository.buildDefense(defenseType, quantity)) {
                is Result.Success -> {
                    loadDefense()
                    loadResources()
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }
    
    fun attack(targetCoord: String, fleet: Map<String, Int>) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = gameRepository.attack(targetCoord, fleet)) {
                is Result.Success -> {
                    loadFleet()
                    loadResources()
                    loadBattleStatus()
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(error = result.message)
                }
                else -> {}
            }
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

