package com.xnova.game.ui.screens.main.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.xnova.game.R
import com.xnova.game.data.model.BuildingInfo
import com.xnova.game.ui.screens.main.MainViewModel
import com.xnova.game.ui.theme.*
import java.text.NumberFormat
import java.util.*

@Composable
fun BuildingsTab(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    
    val mines = uiState.buildings.filter { it.category == "mines" }
    val facilities = uiState.buildings.filter { it.category == "facilities" }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(OGameBlack)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // 현재 건설 중
        uiState.constructionProgress?.let { progress ->
            item {
                OGameProgressPanel(
                    title = "건설 중",
                    icon = "🏗️",
                    name = progress.name,
                    remainingSeconds = uiState.constructionRemainingSeconds,
                    color = OGameOrange,
                    onComplete = { viewModel.completeBuilding() },
                    onCancel = { viewModel.cancelBuilding() }
                )
            }
        }
        
        // 광산 섹션
        item {
            OGameSectionHeader(title = "자원 생산", icon = "⛏️")
        }
        
        items(mines) { building ->
            OGameBuildingCard(
                building = building,
                isConstructing = uiState.constructionProgress != null,
                onUpgrade = { viewModel.upgradeBuilding(building.type) }
            )
        }
        
        // 시설 섹션
        item {
            Spacer(modifier = Modifier.height(8.dp))
            OGameSectionHeader(title = "시설", icon = "🏭")
        }
        
        items(facilities) { building ->
            OGameBuildingCard(
                building = building,
                isConstructing = uiState.constructionProgress != null,
                onUpgrade = { viewModel.upgradeBuilding(building.type) }
            )
        }
        
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun OGameSectionHeader(title: String, icon: String) {
    Surface(
        color = PanelHeader,
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, PanelBorder, RoundedCornerShape(4.dp))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(icon, fontSize = 16.sp)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = title,
                color = TextPrimary,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp
            )
        }
    }
}

@Composable
private fun OGameProgressPanel(
    title: String,
    icon: String,
    name: String,
    remainingSeconds: Long,
    color: Color,
    onComplete: () -> Unit,
    onCancel: () -> Unit
) {
    var showCancelDialog by remember { mutableStateOf(false) }
    
    // 취소 확인 다이얼로그
    if (showCancelDialog) {
        AlertDialog(
            onDismissRequest = { showCancelDialog = false },
            containerColor = PanelBackground,
            titleContentColor = TextPrimary,
            textContentColor = TextSecondary,
            title = {
                Text("건설 취소", fontWeight = FontWeight.Bold)
            },
            text = {
                Text("정말 '$name' 건설을 취소하시겠습니까?\n\n사용된 자원의 50%만 반환됩니다.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        onCancel()
                        showCancelDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = OGameRed)
                ) {
                    Text("취소하기", color = TextPrimary)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { showCancelDialog = false },
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary)
                ) {
                    Text("닫기")
                }
            }
        )
    }
    
    Surface(
        color = PanelBackground,
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, color.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
    ) {
        Column {
            // 헤더
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(color.copy(alpha = 0.2f))
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(icon, fontSize = 16.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = title,
                            color = color,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                    Text(
                        text = formatRemainingTime(remainingSeconds),
                        color = color,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
            
            // 본문
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = name,
                    color = TextPrimary,
                    fontSize = 14.sp
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                if (remainingSeconds > 0) {
                    LinearProgressIndicator(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .clip(RoundedCornerShape(2.dp)),
                        color = color,
                        trackColor = color.copy(alpha = 0.2f)
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // 취소 버튼
                    OutlinedButton(
                        onClick = { showCancelDialog = true },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = OGameRed
                        ),
                        border = ButtonDefaults.outlinedButtonBorder.copy(
                            brush = SolidColor(OGameRed.copy(alpha = 0.5f))
                        ),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text("❌ 건설 취소", color = OGameRed, fontSize = 13.sp)
                    }
                } else {
                    Button(
                        onClick = onComplete,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = ButtonSuccess),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text("완료하기", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun OGameBuildingCard(
    building: BuildingInfo,
    isConstructing: Boolean,
    onUpgrade: () -> Unit
) {
    val numberFormat = NumberFormat.getNumberInstance(Locale.KOREA)
    val icon = getBuildingIcon(building.type)
    val context = LocalContext.current
    
    Surface(
        color = PanelBackground,
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, PanelBorder, RoundedCornerShape(4.dp))
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 왼쪽 이미지 컨테이너
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .background(Color.Black.copy(alpha = 0.2f))
                    .padding(4.dp),
                contentAlignment = Alignment.Center
            ) {
                if (building.type == "metalMine") {
                    AsyncImage(
                        model = ImageRequest.Builder(context)
                            .data(R.drawable.metalmine)
                            .crossfade(true)
                            .build(),
                        contentDescription = building.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(2.dp))
                    )
                } else {
                    // 이미지가 없는 경우 기본 아이콘 표시
                    Text(icon, fontSize = 40.sp)
                }
            }
            
            // 오른쪽 정보 컨테이너
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(8.dp)
            ) {
                // 상단: 이름과 레벨
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = building.name,
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Surface(
                        color = OGameBlue.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "Lv ${building.level}",
                            color = OGameBlue,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // 중간: 자원 비용
                building.upgradeCost?.let { cost ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(OGameDarkBlue, RoundedCornerShape(2.dp))
                            .padding(6.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OGameCostItem("M:", cost.metal, MetalColor)
                        OGameCostItem("C:", cost.crystal, CrystalColor)
                        if ((cost.deuterium ?: 0L) > 0) {
                            OGameCostItem("D:", cost.deuterium ?: 0L, DeuteriumColor)
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // 하단: 시간 및 버튼
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("⏱️", fontSize = 10.sp)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = formatBuildTime(building.upgradeTime.toInt()),
                            color = TextMuted,
                            fontSize = 11.sp
                        )
                    }
                    
                    Button(
                        onClick = onUpgrade,
                        enabled = !isConstructing && building.upgradeCost != null,
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        modifier = Modifier.height(30.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ButtonPrimary,
                            disabledContainerColor = ButtonDisabled
                        ),
                        shape = RoundedCornerShape(2.dp)
                    ) {
                        Text(
                            text = "업그레이드",
                            color = if (!isConstructing && building.upgradeCost != null) TextPrimary else TextMuted,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun OGameCostItem(label: String, amount: Long, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = TextMuted, fontSize = 10.sp)
        Spacer(modifier = Modifier.width(2.dp))
        Text(
            text = formatNumber(amount),
            color = color,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

private fun getBuildingIcon(type: String): String {
    return when (type) {
        "metalMine" -> "🪨"
        "crystalMine" -> "💎"
        "deuteriumMine" -> "💧"
        "solarPlant" -> "☀️"
        "fusionReactor" -> "⚛️"
        "robotFactory" -> "🤖"
        "shipyard" -> "🚢"
        "researchLab" -> "🔬"
        "nanoFactory" -> "🔩"
        else -> "🏗️"
    }
}

private fun formatNumber(num: Long): String {
    return when {
        num >= 1_000_000 -> String.format("%.1fM", num / 1_000_000.0)
        num >= 1_000 -> String.format("%.1fK", num / 1_000.0)
        else -> num.toString()
    }
}

private fun formatBuildTime(seconds: Int): String {
    if (seconds < 60) return "${seconds}초"
    if (seconds < 3600) return "${seconds / 60}분"
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    return if (minutes > 0) "${hours}h ${minutes}m" else "${hours}h"
}

private fun formatRemainingTime(seconds: Long): String {
    if (seconds <= 0) return "완료!"
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    val secs = seconds % 60
    return String.format("%02d:%02d:%02d", hours, minutes, secs)
}
