package com.xnova.game.ui.screens.main

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.xnova.game.ui.components.ResourceBar
import com.xnova.game.ui.screens.main.tabs.*
import com.xnova.game.ui.theme.*
import kotlinx.coroutines.launch

enum class MainTab(
    val icon: ImageVector,
    val selectedIcon: ImageVector,
    val label: String,
    val emoji: String
) {
    OVERVIEW(Icons.Outlined.Home, Icons.Filled.Home, "개요", "🏠"),
    BUILDINGS(Icons.Outlined.Business, Icons.Filled.Business, "건물", "🏗️"),
    RESEARCH(Icons.Outlined.Science, Icons.Filled.Science, "연구", "🔬"),
    SHIPYARD(Icons.Outlined.Rocket, Icons.Filled.Rocket, "조선소", "🚀"),
    DEFENSE(Icons.Outlined.Shield, Icons.Filled.Shield, "방어", "🛡️"),
    FLEET(Icons.Outlined.RocketLaunch, Icons.Filled.RocketLaunch, "함대", "⚔️"),
    GALAXY(Icons.Outlined.Public, Icons.Filled.Public, "은하계", "🌌")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onLogout: () -> Unit,
    viewModel: MainViewModel = hiltViewModel()
) {
    var selectedTab by remember { mutableStateOf(MainTab.OVERVIEW) }
    val uiState by viewModel.uiState.collectAsState()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    
    LaunchedEffect(Unit) {
        viewModel.loadData()
    }
    
    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            OGameDrawerContent(
                selectedTab = selectedTab,
                playerName = uiState.playerName,
                coordinate = uiState.coordinate,
                onTabSelected = { tab ->
                    selectedTab = tab
                    scope.launch { drawerState.close() }
                },
                onLogout = {
                    scope.launch { drawerState.close() }
                    onLogout()
                }
            )
        },
        gesturesEnabled = true
    ) {
        Scaffold(
            topBar = {
                Column {
                    // 상단 바
                    OGameTopBar(
                        playerName = uiState.playerName,
                        coordinate = uiState.coordinate,
                        onMenuClick = { scope.launch { drawerState.open() } },
                        onRefresh = { viewModel.loadData() }
                    )
                    // 자원 바
                    ResourceBar(
                        resources = uiState.resources,
                        production = uiState.production,
                        energyRatio = uiState.energyRatio
                    )
                }
            },
            containerColor = OGameBlack
        ) { paddingValues ->
            Box(modifier = Modifier.padding(paddingValues)) {
                when (selectedTab) {
                    MainTab.OVERVIEW -> OverviewTab(viewModel)
                    MainTab.BUILDINGS -> BuildingsTab(viewModel)
                    MainTab.RESEARCH -> ResearchTab(viewModel)
                    MainTab.SHIPYARD -> FleetTab(viewModel) // 조선소 = 함대 건조
                    MainTab.DEFENSE -> DefenseTab(viewModel)
                    MainTab.FLEET -> FleetMovementTab(viewModel) // 함대 이동
                    MainTab.GALAXY -> GalaxyTab(viewModel)
                }
            }
        }
    }
}

@Composable
private fun OGameTopBar(
    playerName: String?,
    coordinate: String?,
    onMenuClick: () -> Unit,
    onRefresh: () -> Unit
) {
    Surface(
        color = OGameDarkBlue,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 메뉴 버튼
            IconButton(
                onClick = onMenuClick,
                modifier = Modifier.size(40.dp)
            ) {
                Icon(
                    Icons.Default.Menu,
                    contentDescription = "메뉴",
                    tint = TextPrimary
                )
            }
            
            // 타이틀 & 좌표
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "XNOVA",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = OGameGreen
                )
                coordinate?.let {
                    Text(
                        text = "[$it]",
                        fontSize = 11.sp,
                        color = TextSecondary
                    )
                }
            }
            
            // 새로고침 버튼
            IconButton(
                onClick = onRefresh,
                modifier = Modifier.size(40.dp)
            ) {
                Icon(
                    Icons.Default.Refresh,
                    contentDescription = "새로고침",
                    tint = TextSecondary
                )
            }
        }
    }
}

@Composable
private fun OGameDrawerContent(
    selectedTab: MainTab,
    playerName: String?,
    coordinate: String?,
    onTabSelected: (MainTab) -> Unit,
    onLogout: () -> Unit
) {
    ModalDrawerSheet(
        drawerContainerColor = DrawerBackground,
        modifier = Modifier.width(280.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .padding(vertical = 16.dp)
        ) {
            // 플레이어 정보 헤더
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PanelHeader)
                    .padding(16.dp)
            ) {
                Text(
                    text = "🚀 XNOVA",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = OGameGreen
                )
                Spacer(modifier = Modifier.height(8.dp))
                playerName?.let {
                    Text(
                        text = it,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                }
                coordinate?.let {
                    Text(
                        text = "좌표: $it",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // 구분선
            Divider(
                color = PanelBorder,
                thickness = 1.dp,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // 메뉴 아이템들
            MainTab.values().forEach { tab ->
                DrawerMenuItem(
                    tab = tab,
                    isSelected = selectedTab == tab,
                    onClick = { onTabSelected(tab) }
                )
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            // 구분선
            Divider(
                color = PanelBorder,
                thickness = 1.dp,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // 로그아웃 버튼
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onLogout() }
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Logout,
                    contentDescription = "로그아웃",
                    tint = ErrorRed,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(16.dp))
                Text(
                    text = "로그아웃",
                    color = ErrorRed,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
private fun DrawerMenuItem(
    tab: MainTab,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val backgroundColor = if (isSelected) DrawerItemSelected else Color.Transparent
    val textColor = if (isSelected) OGameGreen else TextSecondary
    val borderColor = if (isSelected) OGameGreen else Color.Transparent
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 2.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(backgroundColor)
            .border(
                width = if (isSelected) 1.dp else 0.dp,
                color = borderColor,
                shape = RoundedCornerShape(4.dp)
            )
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = tab.emoji,
            fontSize = 18.sp
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = tab.label,
            color = textColor,
            fontSize = 14.sp,
            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
        )
        
        if (isSelected) {
            Spacer(modifier = Modifier.weight(1f))
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(OGameGreen, shape = RoundedCornerShape(3.dp))
            )
        }
    }
}
