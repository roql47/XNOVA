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
import com.xnova.game.ui.screens.main.MainViewModel
import com.xnova.game.ui.theme.*
import java.text.NumberFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FleetMovementTab(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var targetCoord by remember { mutableStateOf("") }
    var selectedFleet by remember { mutableStateOf<Map<String, Int>>(emptyMap()) }
    
    LaunchedEffect(Unit) {
        viewModel.loadFleet()
        viewModel.loadBattleStatus()
    }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(OGameBlack)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // 현재 함대 활동
        item {
            OGameFleetActivityPanel(
                battleStatus = uiState.battleStatus,
                myCoordinate = uiState.coordinate
            )
        }
        
        // 공격 대상 입력
        item {
            OGamePanel(title = "함대 출격", icon = "🚀") {
                Column(modifier = Modifier.padding(12.dp)) {
                    // 목표 좌표 입력
                    OutlinedTextField(
                        value = targetCoord,
                        onValueChange = { targetCoord = it },
                        label = { Text("목표 좌표 (예: 1:50:5)") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = OGameBlue,
                            unfocusedBorderColor = PanelBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        singleLine = true
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // 함대 선택
                    Text(
                        text = "함대 선택",
                        color = TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // 전투 함대만 표시
                    val combatFleet = uiState.fleet.filter { it.count > 0 }
                    
                    if (combatFleet.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(OGameDarkBlue, RoundedCornerShape(4.dp))
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "보유한 함선이 없습니다",
                                color = TextMuted
                            )
                        }
                    } else {
                        combatFleet.forEach { fleet ->
                            FleetSelectItem(
                                name = fleet.name,
                                icon = getFleetIcon(fleet.type),
                                available = fleet.count,
                                selected = selectedFleet[fleet.type] ?: 0,
                                onQuantityChange = { qty ->
                                    selectedFleet = selectedFleet.toMutableMap().apply {
                                        if (qty > 0) put(fleet.type, qty)
                                        else remove(fleet.type)
                                    }
                                }
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // 공격 버튼
                    val canAttack = targetCoord.isNotBlank() && selectedFleet.isNotEmpty()
                    
                    Button(
                        onClick = {
                            if (canAttack) {
                                viewModel.attack(targetCoord, selectedFleet)
                                targetCoord = ""
                                selectedFleet = emptyMap()
                            }
                        },
                        enabled = canAttack && uiState.battleStatus?.pendingAttack == null,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = OGameRed,
                            disabledContainerColor = ButtonDisabled
                        ),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "⚔️ 공격",
                            color = if (canAttack) TextPrimary else TextMuted,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
        
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun OGameFleetActivityPanel(
    battleStatus: com.xnova.game.data.model.BattleStatus?,
    myCoordinate: String?
) {
    OGamePanel(title = "함대 활동", icon = "⚔️") {
        Column(modifier = Modifier.padding(12.dp)) {
            if (battleStatus?.pendingAttack == null && 
                battleStatus?.pendingReturn == null && 
                battleStatus?.incomingAttack == null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(OGameDarkBlue, RoundedCornerShape(4.dp))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "활동 중인 함대가 없습니다",
                        color = TextMuted
                    )
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    // 공격 중
                    battleStatus?.pendingAttack?.let { attack ->
                        FleetActivityRow(
                            icon = "🎯",
                            from = myCoordinate ?: "?",
                            to = attack.targetCoord,
                            mission = "공격",
                            remainingTime = attack.remainingTime.toInt(),
                            color = OGameRed
                        )
                    }
                    
                    // 귀환 중
                    battleStatus?.pendingReturn?.let { ret ->
                        FleetActivityRow(
                            icon = "🔙",
                            from = "전장",
                            to = myCoordinate ?: "?",
                            mission = "귀환",
                            remainingTime = ret.remainingTime.toInt(),
                            color = OGameGreen
                        )
                    }
                    
                    // 적 공격
                    battleStatus?.incomingAttack?.let { incoming ->
                        Surface(
                            color = OGameRed.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(4.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, OGameRed, RoundedCornerShape(4.dp))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("⚠️", fontSize = 18.sp)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text(
                                            text = "적 함대 접근!",
                                            color = OGameRed,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp
                                        )
                                        Text(
                                            text = "${incoming.attackerCoord} → ${myCoordinate ?: "?"}",
                                            color = TextSecondary,
                                            fontSize = 12.sp
                                        )
                                    }
                                }
                                Text(
                                    text = formatTime(incoming.remainingTime.toInt()),
                                    color = OGameRed,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                            }
                        }
                    }
                }
            }
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
            // 헤더
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
private fun FleetActivityRow(
    icon: String,
    from: String,
    to: String,
    mission: String,
    remainingTime: Int,
    color: Color
) {
    Surface(
        color = color.copy(alpha = 0.1f),
        shape = RoundedCornerShape(4.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(icon, fontSize = 16.sp)
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = mission,
                        color = color,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                    Text(
                        text = "$from → $to",
                        color = TextSecondary,
                        fontSize = 11.sp
                    )
                }
            }
            Text(
                text = formatTime(remainingTime),
                color = color,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FleetSelectItem(
    name: String,
    icon: String,
    available: Int,
    selected: Int,
    onQuantityChange: (Int) -> Unit
) {
    var inputValue by remember(selected) { mutableStateOf(if (selected > 0) selected.toString() else "") }
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(OGameDarkBlue, RoundedCornerShape(4.dp))
            .padding(8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            Text(icon, fontSize = 18.sp)
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = name,
                    color = TextPrimary,
                    fontSize = 13.sp
                )
                Text(
                    text = "보유: $available",
                    color = TextMuted,
                    fontSize = 11.sp
                )
            }
        }
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            // 최대 버튼
            TextButton(
                onClick = { 
                    inputValue = available.toString()
                    onQuantityChange(available) 
                },
                contentPadding = PaddingValues(horizontal = 8.dp)
            ) {
                Text("최대", color = OGameBlue, fontSize = 12.sp)
            }
            
            Spacer(modifier = Modifier.width(8.dp))
            
            // 수량 입력
            OutlinedTextField(
                value = inputValue,
                onValueChange = { value ->
                    val filtered = value.filter { it.isDigit() }
                    inputValue = filtered
                    val qty = filtered.toIntOrNull() ?: 0
                    onQuantityChange(minOf(qty, available))
                },
                modifier = Modifier.width(80.dp),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = OGameBlue,
                    unfocusedBorderColor = PanelBorder,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary
                ),
                textStyle = LocalTextStyle.current.copy(fontSize = 13.sp),
                singleLine = true
            )
        }
    }
    
    Spacer(modifier = Modifier.height(4.dp))
}

private fun getFleetIcon(type: String): String {
    return when (type) {
        "smallCargo" -> "📦"
        "largeCargo" -> "🚚"
        "lightFighter" -> "✈️"
        "heavyFighter" -> "🛩️"
        "cruiser" -> "🚢"
        "battleship" -> "⚔️"
        "battlecruiser" -> "🗡️"
        "bomber" -> "💣"
        "destroyer" -> "💀"
        "deathstar" -> "☠️"
        "recycler" -> "♻️"
        "espionageProbe" -> "🔍"
        "solarSatellite" -> "🛰️"
        else -> "🚀"
    }
}

private fun formatTime(seconds: Int): String {
    if (seconds <= 0) return "도착!"
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    val secs = seconds % 60
    return String.format("%02d:%02d:%02d", hours, minutes, secs)
}

