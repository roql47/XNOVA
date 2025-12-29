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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.xnova.game.data.model.ResearchInfo
import com.xnova.game.ui.screens.main.MainViewModel
import com.xnova.game.ui.theme.*
import java.text.NumberFormat
import java.util.*

@Composable
fun ResearchTab(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(OGameBlack)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // 연구소 레벨
        item {
            OGamePanel(title = "연구소", icon = "🔬") {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "현재 연구소 레벨",
                        color = TextSecondary,
                        fontSize = 14.sp
                    )
                    Surface(
                        color = OGameBlue.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "Lv. ${uiState.labLevel}",
                            color = OGameBlue,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }
        
        // 현재 연구 중
        uiState.researchProgress?.let { progress ->
            item {
                OGameProgressPanel(
                    title = "연구 중",
                    icon = "🧪",
                    name = progress.name,
                    remainingSeconds = uiState.researchRemainingSeconds,
                    color = NeonPurple,
                    onComplete = { viewModel.completeResearch() },
                    onCancel = { viewModel.cancelResearch() }
                )
            }
        }
        
        // 연구 목록
        items(uiState.research) { research ->
            OGameResearchCard(
                research = research,
                isResearching = uiState.researchProgress != null,
                onStart = { viewModel.startResearch(research.type) }
            )
        }
        
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun OGamePanel(
    title: String,
    icon: String,
    content: @Composable () -> Unit
) {
    Surface(
        color = PanelBackground,
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, PanelBorder, RoundedCornerShape(4.dp))
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PanelHeader)
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
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
            content()
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
                Text("연구 취소", fontWeight = FontWeight.Bold)
            },
            text = {
                Text("정말 '$name' 연구를 취소하시겠습니까?\n\n사용된 자원의 50%만 반환됩니다.")
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
                        text = formatTime(remainingSeconds),
                        color = color,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
            
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
                        Text("❌ 연구 취소", color = OGameRed, fontSize = 13.sp)
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
private fun OGameResearchCard(
    research: ResearchInfo,
    isResearching: Boolean,
    onStart: () -> Unit
) {
    val icon = getResearchIcon(research.type)
    
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
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(icon, fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = research.name,
                            color = TextPrimary,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }
                    Surface(
                        color = NeonPurple.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "레벨 ${research.level}",
                            color = NeonPurple,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
            
            // 본문
            Column(modifier = Modifier.padding(12.dp)) {
                // 요구사항 미충족
                if (!research.requirementsMet && research.missingRequirements.isNotEmpty()) {
                    Text(
                        text = "❌ 필요: ${research.missingRequirements.joinToString(", ")}",
                        color = ErrorRed,
                        fontSize = 11.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
                
                // 비용 정보
                research.cost?.let { cost ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(OGameDarkBlue, RoundedCornerShape(4.dp))
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        if (cost.metal > 0) OGameCostItem("🪨", cost.metal, MetalColor)
                        if (cost.crystal > 0) OGameCostItem("💎", cost.crystal, CrystalColor)
                        if (cost.deuterium > 0) OGameCostItem("💧", cost.deuterium, DeuteriumColor)
                    }
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // 연구 버튼
                Button(
                    onClick = onStart,
                    enabled = !isResearching && research.requirementsMet && research.cost != null,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = NeonPurple,
                        disabledContainerColor = ButtonDisabled
                    ),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = "연구",
                        color = if (!isResearching && research.requirementsMet) TextPrimary else TextMuted,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

@Composable
private fun OGameCostItem(icon: String, amount: Long, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(icon, fontSize = 14.sp)
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = formatNumber(amount),
            color = color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

private fun getResearchIcon(type: String): String {
    return when (type) {
        "energyTech" -> "⚡"
        "laserTech" -> "🔴"
        "ionTech" -> "🔵"
        "hyperspaceTech" -> "🌀"
        "plasmaTech" -> "💜"
        "combustionDrive" -> "🔥"
        "impulseDrive" -> "💨"
        "hyperspaceDrive" -> "🚀"
        "espionageTech" -> "🕵️"
        "computerTech" -> "💻"
        "astrophysics" -> "🔭"
        "intergalacticResearch" -> "🌌"
        "gravitonTech" -> "⬇️"
        "weaponsTech" -> "⚔️"
        "shieldTech" -> "🛡️"
        "armorTech" -> "🦾"
        else -> "🧪"
    }
}

private fun formatNumber(num: Long): String {
    return when {
        num >= 1_000_000 -> String.format("%.1fM", num / 1_000_000.0)
        num >= 1_000 -> String.format("%.1fK", num / 1_000.0)
        else -> num.toString()
    }
}

private fun formatTime(seconds: Long): String {
    if (seconds <= 0) return "완료!"
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    val secs = seconds % 60
    return String.format("%02d:%02d:%02d", hours, minutes, secs)
}
