package com.xnova.game.ui.screens.main.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.xnova.game.R
import com.xnova.game.ui.screens.main.MainViewModel
import com.xnova.game.ui.theme.*

@Composable
fun OverviewTab(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(OGameBlack)
            .padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // 행성 정보
        item {
            Surface(
                color = PanelBackground,
                shape = RoundedCornerShape(4.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // 행성 이미지
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(R.drawable.dschjungelplanet06)
                            .crossfade(true)
                            .build(),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(64.dp)
                            .clip(RoundedCornerShape(4.dp))
                    )
                    
                    Spacer(modifier = Modifier.width(12.dp))
                    
                    Column {
                        Text(
                            text = uiState.playerName ?: "행성",
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "좌표 ${uiState.coordinate ?: "?:?:?"}",
                            color = TextMuted,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
        
        // 진행 중인 작업
        val hasProgress = uiState.constructionProgress != null || 
                         uiState.researchProgress != null || 
                         uiState.fleetProgress != null ||
                         uiState.defenseProgress != null
        
        if (hasProgress) {
            item {
                Surface(
                    color = PanelBackground,
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "진행 중",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        uiState.constructionProgress?.let {
                            ProgressItem(
                                label = "건설",
                                name = it.name,
                                time = formatTime(uiState.constructionRemainingSeconds),
                                color = OGameOrange
                            )
                        }
                        
                        uiState.researchProgress?.let {
                            ProgressItem(
                                label = "연구",
                                name = it.name,
                                time = formatTime(uiState.researchRemainingSeconds),
                                color = NeonPurple
                            )
                        }
                        
                        uiState.fleetProgress?.let {
                            ProgressItem(
                                label = "조선",
                                name = "${it.name} x${it.quantity ?: 1}",
                                time = formatTime(uiState.fleetRemainingSeconds),
                                color = OGameCyan
                            )
                        }
                        
                        uiState.defenseProgress?.let {
                            ProgressItem(
                                label = "방어",
                                name = "${it.name} x${it.quantity ?: 1}",
                                time = formatTime(uiState.defenseRemainingSeconds),
                                color = OGameGreen
                            )
                        }
                    }
                }
            }
        }
        
        // 함대 활동
        uiState.battleStatus?.let { status ->
            val hasActivity = status.pendingAttack != null || 
                            status.pendingReturn != null || 
                            status.incomingAttack != null
            
            if (hasActivity) {
                item {
                    Surface(
                        color = PanelBackground,
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "함대 이동",
                                color = TextSecondary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            status.pendingAttack?.let {
                                FleetItem(
                                    label = "공격",
                                    target = it.targetCoord,
                                    time = formatTime(it.remainingTime.toLong()),
                                    color = OGameRed
                                )
                            }
                            
                            status.pendingReturn?.let {
                                FleetItem(
                                    label = "귀환",
                                    target = null,
                                    time = formatTime(it.remainingTime.toLong()),
                                    color = OGameGreen
                                )
                            }
                            
                            status.incomingAttack?.let {
                                Spacer(modifier = Modifier.height(4.dp))
                                Surface(
                                    color = OGameRed.copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(2.dp)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(8.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = "적 공격 [${it.attackerCoord}]",
                                            color = OGameRed,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = formatTime(it.remainingTime.toLong()),
                                            color = OGameRed,
                                            fontSize = 12.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // 함대 & 방어 요약
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // 함대
                Surface(
                    color = PanelBackground,
                    shape = RoundedCornerShape(4.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "함대",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        val totalShips = uiState.fleet.sumOf { it.count }
                        val combatShips = uiState.fleet
                            .filter { it.type in listOf("lightFighter", "heavyFighter", "cruiser", "battleship", "battlecruiser", "bomber", "destroyer", "deathstar") }
                            .sumOf { it.count }
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            StatItem(label = "전체", value = totalShips)
                            StatItem(label = "전투", value = combatShips, color = OGameRed)
                        }
                    }
                }
                
                // 방어
                Surface(
                    color = PanelBackground,
                    shape = RoundedCornerShape(4.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "방어",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        val totalDefense = uiState.defense.sumOf { it.count }
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            StatItem(label = "전체", value = totalDefense)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProgressItem(
    label: String,
    name: String,
    time: String,
    color: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(color, RoundedCornerShape(1.dp))
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = label,
                color = TextMuted,
                fontSize = 11.sp
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = name,
                color = TextPrimary,
                fontSize = 12.sp
            )
        }
        Text(
            text = time,
            color = color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun FleetItem(
    label: String,
    target: String?,
    time: String,
    color: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(color, RoundedCornerShape(1.dp))
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (target != null) "$label [$target]" else label,
                color = TextPrimary,
                fontSize = 12.sp
            )
        }
        Text(
            text = time,
            color = TextSecondary,
            fontSize = 12.sp
        )
    }
}

@Composable
private fun StatItem(
    label: String,
    value: Int,
    color: Color = TextPrimary
) {
    Column {
        Text(
            text = value.toString(),
            color = color,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = label,
            color = TextMuted,
            fontSize = 10.sp
        )
    }
}

private fun formatTime(seconds: Long): String {
    if (seconds <= 0) return "완료"
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    val secs = seconds % 60
    return String.format("%02d:%02d:%02d", hours, minutes, secs)
}
