package com.xnova.game.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.xnova.game.R
import com.xnova.game.data.model.Production
import com.xnova.game.data.model.Resources
import com.xnova.game.ui.theme.*
import java.text.NumberFormat
import java.util.*

@Composable
fun ResourceBar(
    resources: Resources?,
    production: Production?,
    energyRatio: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(PanelBackground)
            .statusBarsPadding()
            .padding(horizontal = 12.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        ResourceItem(
            imageRes = R.drawable.metall,
            amount = resources?.metal ?: 0L,
            color = MetalColor
        )
        
        ResourceItem(
            imageRes = R.drawable.kristall,
            amount = resources?.crystal ?: 0L,
            color = CrystalColor
        )
        
        ResourceItem(
            imageRes = R.drawable.deuterium,
            amount = resources?.deuterium ?: 0L,
            color = DeuteriumColor
        )
        
        EnergyItem(
            imageRes = R.drawable.energie,
            used = production?.energyConsumption ?: 0,
            total = production?.energyProduction ?: 0
        )
    }
}

@Composable
private fun ResourceItem(
    imageRes: Int,
    amount: Long,
    color: Color
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(imageRes)
                .build(),
            contentDescription = null,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = formatAmount(amount),
            color = color,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun EnergyItem(
    imageRes: Int,
    used: Int,
    total: Int
) {
    val balance = total - used
    val color = when {
        balance >= 0 -> SuccessGreen
        balance > -100 -> WarningYellow
        else -> ErrorRed
    }
    
    Row(verticalAlignment = Alignment.CenterVertically) {
        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(imageRes)
                .build(),
            contentDescription = null,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = "$used/$total",
            color = color,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

private fun formatAmount(amount: Long): String {
    return when {
        amount >= 1_000_000_000 -> String.format("%.1fG", amount / 1_000_000_000.0)
        amount >= 1_000_000 -> String.format("%.1fM", amount / 1_000_000.0)
        amount >= 1_000 -> String.format("%.0fK", amount / 1_000.0)
        else -> amount.toString()
    }
}
