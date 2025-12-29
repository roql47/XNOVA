package com.xnova.game.ui.screens.main.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.xnova.game.data.model.PlanetInfo
import com.xnova.game.ui.screens.main.MainViewModel
import com.xnova.game.ui.theme.*

@Composable
fun GalaxyTab(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedPlanet by remember { mutableStateOf<PlanetInfo?>(null) }
    
    LaunchedEffect(uiState.currentGalaxy, uiState.currentSystem) {
        viewModel.loadGalaxy(uiState.currentGalaxy, uiState.currentSystem)
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(OGameBlack)
            .padding(12.dp)
    ) {
        // 네비게이션 패널
        OGameNavPanel(
            currentGalaxy = uiState.currentGalaxy,
            currentSystem = uiState.currentSystem,
            onPrevSystem = {
                val newSystem = if (uiState.currentSystem > 1) uiState.currentSystem - 1 else 499
                viewModel.loadGalaxy(uiState.currentGalaxy, newSystem)
            },
            onNextSystem = {
                val newSystem = if (uiState.currentSystem < 499) uiState.currentSystem + 1 else 1
                viewModel.loadGalaxy(uiState.currentGalaxy, newSystem)
            },
            onPrevGalaxy = {
                val newGalaxy = if (uiState.currentGalaxy > 1) uiState.currentGalaxy - 1 else 9
                viewModel.loadGalaxy(newGalaxy, uiState.currentSystem)
            },
            onNextGalaxy = {
                val newGalaxy = if (uiState.currentGalaxy < 9) uiState.currentGalaxy + 1 else 1
                viewModel.loadGalaxy(newGalaxy, uiState.currentSystem)
            }
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // 행성 목록
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            items(uiState.galaxyPlanets) { planet ->
                OGamePlanetRow(
                    planet = planet,
                    onClick = { selectedPlanet = planet }
                )
            }
        }
    }
    
    // 행성 상세 다이얼로그
    selectedPlanet?.let { planet ->
        AlertDialog(
            onDismissRequest = { selectedPlanet = null },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(getPlanetIcon(planet), fontSize = 24.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(planet.coordinate, color = OGameCyan, fontSize = 16.sp)
                        if (planet.playerName != null) {
                            Text(
                                planet.playerName,
                                color = TextSecondary,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            },
            text = {
                Column {
                    if (planet.playerName != null) {
                        if (planet.isOwnPlanet) {
                            Surface(
                                color = OGameGreen.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("🏠", fontSize = 18.sp)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("내 행성", color = OGameGreen, fontWeight = FontWeight.Bold)
                                }
                            }
                        } else {
                            Text(
                                "이 행성을 공격하시겠습니까?",
                                color = TextSecondary,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "⚠️ 함대 탭에서 함선을 선택하여 공격할 수 있습니다.",
                                color = TextMuted,
                                fontSize = 12.sp
                            )
                        }
                    } else {
                        Text("빈 행성입니다.", color = TextMuted)
                    }
                    
                    // 추가 정보
                    if (planet.hasMoon || planet.hasDebris) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            if (planet.hasMoon) {
                                Surface(
                                    color = OGameYellow.copy(alpha = 0.2f),
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text("🌙", fontSize = 14.sp)
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("달", color = OGameYellow, fontSize = 12.sp)
                                    }
                                }
                            }
                            if (planet.hasDebris) {
                                Surface(
                                    color = MetalColor.copy(alpha = 0.2f),
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text("💫", fontSize = 14.sp)
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("잔해", color = MetalColor, fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                if (planet.playerName != null && !planet.isOwnPlanet) {
                    Button(
                        onClick = {
                            // TODO: 함대 탭으로 이동하여 공격 준비
                            selectedPlanet = null
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = OGameRed)
                    ) {
                        Text("⚔️ 공격", color = TextPrimary)
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedPlanet = null }) {
                    Text("닫기", color = TextMuted)
                }
            },
            containerColor = PanelBackground
        )
    }
}

@Composable
private fun OGameNavPanel(
    currentGalaxy: Int,
    currentSystem: Int,
    onPrevGalaxy: () -> Unit,
    onNextGalaxy: () -> Unit,
    onPrevSystem: () -> Unit,
    onNextSystem: () -> Unit
) {
    Surface(
        color = PanelBackground,
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, PanelBorder, RoundedCornerShape(4.dp))
    ) {
        Column {
            // 헤더
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PanelHeader)
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🌌", fontSize = 16.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "은하계 지도",
                        color = TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                }
            }
            
            // 네비게이션
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 은하 이동
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onPrevGalaxy,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.KeyboardDoubleArrowLeft, "이전 은하", tint = OGameBlue)
                    }
                    Text(
                        text = "G$currentGalaxy",
                        color = OGameBlue,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    IconButton(
                        onClick = onNextGalaxy,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.KeyboardDoubleArrowRight, "다음 은하", tint = OGameBlue)
                    }
                }
                
                // 현재 좌표
                Surface(
                    color = OGameCyan.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = "[$currentGalaxy:$currentSystem:?]",
                        color = OGameCyan,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
                
                // 시스템 이동
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onPrevSystem,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.ChevronLeft, "이전 시스템", tint = OGameGreen)
                    }
                    Text(
                        text = "S$currentSystem",
                        color = OGameGreen,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    IconButton(
                        onClick = onNextSystem,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.ChevronRight, "다음 시스템", tint = OGameGreen)
                    }
                }
            }
        }
    }
}

@Composable
private fun OGamePlanetRow(
    planet: PlanetInfo,
    onClick: () -> Unit
) {
    val backgroundColor = when {
        planet.isOwnPlanet -> OGameGreen.copy(alpha = 0.15f)
        planet.playerName != null -> PanelBackground
        else -> OGameDarkGray.copy(alpha = 0.5f)
    }
    
    val borderColor = when {
        planet.isOwnPlanet -> OGameGreen.copy(alpha = 0.5f)
        planet.playerName != null -> PanelBorder
        else -> Color.Transparent
    }
    
    Surface(
        color = backgroundColor,
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (borderColor != Color.Transparent) 
                    Modifier.border(1.dp, borderColor, RoundedCornerShape(4.dp))
                else Modifier
            )
            .clickable(enabled = planet.playerName != null, onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // 위치 번호
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(
                            when {
                                planet.isOwnPlanet -> OGameGreen
                                planet.playerName != null -> OGameBlue
                                else -> TextMuted.copy(alpha = 0.5f)
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "${planet.position}",
                        color = if (planet.playerName != null) OGameBlack else TextMuted,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
                
                Spacer(modifier = Modifier.width(10.dp))
                
                // 행성 아이콘
                Text(getPlanetIcon(planet), fontSize = 20.sp)
                
                Spacer(modifier = Modifier.width(10.dp))
                
                // 정보
                Column {
                    Text(
                        text = planet.coordinate,
                        color = TextPrimary,
                        fontSize = 13.sp
                    )
                    Text(
                        text = planet.playerName ?: "빈 행성",
                        color = if (planet.playerName != null) TextSecondary else TextMuted,
                        fontSize = 11.sp
                    )
                }
            }
            
            // 상태 아이콘
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                if (planet.hasDebris) {
                    Text("💫", fontSize = 14.sp)
                }
                if (planet.hasMoon) {
                    Text("🌙", fontSize = 14.sp)
                }
                if (planet.isOwnPlanet) {
                    Text("🏠", fontSize = 14.sp)
                }
            }
        }
    }
}

private fun getPlanetIcon(planet: PlanetInfo): String {
    return when {
        planet.isOwnPlanet -> "🌍"
        planet.playerName != null -> "🪐"
        else -> "⚫"
    }
}
