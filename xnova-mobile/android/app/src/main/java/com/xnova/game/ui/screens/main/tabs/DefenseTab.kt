package com.xnova.game.ui.screens.main.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.xnova.game.data.model.DefenseInfo
import com.xnova.game.ui.screens.main.MainViewModel
import com.xnova.game.ui.theme.*
import java.text.NumberFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DefenseTab(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadDefense()
    }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(OGameBlack)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // 현재 건조 중
        uiState.defenseProgress?.let { progress ->
            item {
                OGameProgressPanel(
                    title = "방어시설 건조 중",
                    icon = "🛡️",
                    name = "${progress.name} x${progress.quantity ?: 1}",
                    remainingSeconds = uiState.defenseRemainingSeconds,
                    color = OGameGreen
                )
            }
        }
        
        // 방어시설 목록
        items(uiState.defense) { defense ->
            OGameDefenseCard(
                defense = defense,
                isBuilding = uiState.defenseProgress != null,
                onBuild = { quantity ->
                    viewModel.buildDefense(defense.type, quantity)
                }
            )
        }
        
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun OGameDefenseCard(
    defense: DefenseInfo,
    isBuilding: Boolean,
    onBuild: (Int) -> Unit
) {
    val numberFormat = NumberFormat.getNumberInstance(Locale.KOREA)
    var showBuildDialog by remember { mutableStateOf(false) }
    var quantity by remember { mutableStateOf("1") }
    val icon = getDefenseIcon(defense.type)
    
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
                            text = defense.name,
                            color = TextPrimary,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }
                    Text(
                        text = "보유: ${numberFormat.format(defense.count)}",
                        color = OGameGreen,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
            
            // 본문
            Column(modifier = Modifier.padding(12.dp)) {
                // 스탯
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    OGameStatItem("⚔️", "공격", "${defense.stats.attack}")
                    OGameStatItem("🛡️", "방어", "${defense.stats.shield}")
                    OGameStatItem("❤️", "내구", "${defense.stats.hull}")
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // 비용
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(OGameDarkBlue, RoundedCornerShape(4.dp))
                        .padding(8.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    if (defense.cost.metal > 0) {
                        OGameCostItem("🪨", defense.cost.metal, MetalColor)
                    }
                    if (defense.cost.crystal > 0) {
                        OGameCostItem("💎", defense.cost.crystal, CrystalColor)
                    }
                    if (defense.cost.deuterium > 0) {
                        OGameCostItem("💧", defense.cost.deuterium, DeuteriumColor)
                    }
                }
                
                // 요구사항 미충족
                if (!defense.requirementsMet && defense.missingRequirements.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "❌ 필요: ${defense.missingRequirements.joinToString(", ")}",
                        color = ErrorRed,
                        fontSize = 11.sp
                    )
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // 건조 버튼
                Button(
                    onClick = { showBuildDialog = true },
                    enabled = !isBuilding && defense.requirementsMet,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ButtonPrimary,
                        disabledContainerColor = ButtonDisabled
                    ),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = "건조",
                        color = if (!isBuilding && defense.requirementsMet) TextPrimary else TextMuted,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
    
    // 건조 다이얼로그
    if (showBuildDialog) {
        AlertDialog(
            onDismissRequest = { showBuildDialog = false },
            title = { Text("${defense.name} 건조", color = TextPrimary) },
            text = {
                Column {
                    Text("건조할 수량을 입력하세요", color = TextSecondary)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = quantity,
                        onValueChange = { quantity = it.filter { c -> c.isDigit() } },
                        label = { Text("수량") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = OGameGreen,
                            unfocusedBorderColor = TextMuted
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val qty = quantity.toIntOrNull() ?: 1
                        if (qty > 0) {
                            onBuild(qty)
                            showBuildDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ButtonSuccess)
                ) {
                    Text("건조", color = TextPrimary)
                }
            },
            dismissButton = {
                TextButton(onClick = { showBuildDialog = false }) {
                    Text("취소", color = TextMuted)
                }
            },
            containerColor = PanelBackground
        )
    }
}

@Composable
private fun OGameProgressPanel(
    title: String,
    icon: String,
    name: String,
    remainingSeconds: Long,
    color: Color
) {
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
                LinearProgressIndicator(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp)),
                    color = color,
                    trackColor = color.copy(alpha = 0.2f)
                )
            }
        }
    }
}

@Composable
private fun OGameStatItem(icon: String, label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(icon, fontSize = 14.sp)
        Text(
            text = value,
            color = TextPrimary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = label,
            color = TextMuted,
            fontSize = 10.sp
        )
    }
}

@Composable
private fun OGameCostItem(icon: String, amount: Long, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(icon, fontSize = 12.sp)
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = formatNumber(amount),
            color = color,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

private fun getDefenseIcon(type: String): String {
    return when (type) {
        "rocketLauncher" -> "🚀"
        "lightLaser" -> "💡"
        "heavyLaser" -> "⚡"
        "gaussCannon" -> "🔫"
        "ionCannon" -> "⚛️"
        "plasmaTurret" -> "🔥"
        "smallShield" -> "🛡️"
        "largeShield" -> "🛡️"
        else -> "🛡️"
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

