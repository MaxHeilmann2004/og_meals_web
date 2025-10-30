package net.matixmedia.og_meals.presentation.meals

import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImagePainter
import coil3.compose.SubcomposeAsyncImage
import coil3.compose.SubcomposeAsyncImageContent
import com.valentinilk.shimmer.shimmer
import net.matixmedia.og_meals.data.remote.MealsApi
import net.matixmedia.og_meals.domain.model.MealImage
import org.koin.compose.koinInject

@Composable
fun MealImage(mealImage: MealImage, contentDescription: String, modifier: Modifier = Modifier, mealsApi: MealsApi = koinInject()) {
    SubcomposeAsyncImage(
        model = mealsApi.buildImageUrl(mealImage.url),
        contentDescription = contentDescription,
    ) {
        val state by painter.state.collectAsState()
        AnimatedContent(
            targetState = state,
            label = "Meal Image Loading Animation"
        ) { state ->
            if (state is AsyncImagePainter.State.Success) {
                SubcomposeAsyncImageContent(
                    contentScale = ContentScale.Crop,
                    modifier = modifier
                )
            } else if (state is AsyncImagePainter.State.Error) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    ),
                    modifier = modifier
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Fehler beim Laden des Bildes",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onTertiaryContainer,
                            modifier = Modifier
                                .wrapContentWidth()
                        )
                    }
                }
            } else {
                Box(
                    modifier = modifier
                        .shimmer()
                        .background(MaterialTheme.colorScheme.surfaceContainerHighest)
                )
            }
        }
    }
}