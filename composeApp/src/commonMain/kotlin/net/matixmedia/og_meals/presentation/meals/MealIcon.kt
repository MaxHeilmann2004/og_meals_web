package net.matixmedia.og_meals.presentation.meals

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import net.matixmedia.og_meals.domain.model.MealFeature
import og_meals.composeapp.generated.resources.Res
import og_meals.composeapp.generated.resources.ic_mf_beef
import og_meals.composeapp.generated.resources.ic_mf_chicken
import og_meals.composeapp.generated.resources.ic_mf_environment_friendly
import og_meals.composeapp.generated.resources.ic_mf_garlic
import og_meals.composeapp.generated.resources.ic_mf_gluten_free
import og_meals.composeapp.generated.resources.ic_mf_lactose_free
import og_meals.composeapp.generated.resources.ic_mf_lamb
import og_meals.composeapp.generated.resources.ic_mf_pork
import og_meals.composeapp.generated.resources.ic_mf_vegan
import og_meals.composeapp.generated.resources.ic_mf_vegetarian
import og_meals.composeapp.generated.resources.ic_mf_venison
import org.jetbrains.compose.resources.DrawableResource
import org.jetbrains.compose.resources.painterResource

@Composable
fun MealIcon(
    feature: MealFeature,
    modifier: Modifier = Modifier,
    backgroundColor: Color = MaterialTheme.colorScheme.secondaryContainer,
    foregroundColor: Color = MaterialTheme.colorScheme.onSecondaryContainer,
    iconColor: Color = MaterialTheme.colorScheme.secondary
) {
    val res = when (feature.id) {
        11L -> Res.drawable.ic_mf_vegan
        12L -> Res.drawable.ic_mf_gluten_free
        14L -> Res.drawable.ic_mf_garlic
        15L -> Res.drawable.ic_mf_beef
        16L -> Res.drawable.ic_mf_pork
        17L -> Res.drawable.ic_mf_chicken
        19L -> Res.drawable.ic_mf_lamb
        25L -> Res.drawable.ic_mf_vegetarian
        44L -> Res.drawable.ic_mf_lactose_free
        45L -> Res.drawable.ic_mf_venison
        48L -> Res.drawable.ic_mf_environment_friendly
        else -> null
    }

    MealIcon(res, feature.name ?: feature.shortName ?: "Unknown", modifier)
}

@Composable
private fun MealIcon(
    drawableResource: DrawableResource?, contentDescription: String, modifier: Modifier = Modifier,
    backgroundColor: Color = MaterialTheme.colorScheme.secondaryContainer,
    foregroundColor: Color = MaterialTheme.colorScheme.onSecondaryContainer,
    iconColor: Color = MaterialTheme.colorScheme.secondary
) {
    if (drawableResource != null) {
        Icon(
            painter = painterResource(drawableResource),
            contentDescription = contentDescription,
            modifier = modifier,
            tint = iconColor
        )
    } else {
        Box(
            modifier = Modifier
                .clip(MaterialTheme.shapes.small)
                .background(backgroundColor)
                .padding(vertical = 4.dp, horizontal = 8.dp)
                .then(modifier)
        ) {
            Text(
                contentDescription,
                style = MaterialTheme.typography.bodySmall,
                color = foregroundColor
            )
        }
    }
}