package net.matixmedia.og_meals.presentation.meals

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.text.input.TextObfuscationMode
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.carousel.HorizontalCenteredHeroCarousel
import androidx.compose.material3.carousel.HorizontalMultiBrowseCarousel
import androidx.compose.material3.carousel.rememberCarouselState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import coil3.compose.AsyncImagePainter
import coil3.compose.SubcomposeAsyncImage
import coil3.compose.SubcomposeAsyncImageContent
import coil3.request.ImageRequest
import com.valentinilk.shimmer.shimmer
import net.matixmedia.og_meals.data.remote.MealsApi
import net.matixmedia.og_meals.domain.model.Canteen
import net.matixmedia.og_meals.domain.model.Meal
import net.matixmedia.og_meals.utils.rememberCurrencyFormatter
import org.jetbrains.compose.resources.painterResource
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MealCard(meal: Meal, canteen: Canteen, mealsApi: MealsApi = koinInject()) {
    Column(
        modifier = Modifier.padding(12.dp)
    ) {
        if (meal.mealImages.count() > 1) {
            HorizontalCenteredHeroCarousel(
                state = rememberCarouselState { meal.mealImages.count() },
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f),
                itemSpacing = 8.dp
            ) { i ->
                val mealImage = meal.mealImages[i]

                MealImage(
                    mealImage,
                    contentDescription = "Image for ${meal.title}",
                    Modifier
                        .fillMaxWidth()
                        .maskClip(MaterialTheme.shapes.extraLarge)
                )
            }
        } else if (meal.mealImages.count() == 1) {
            val mealImage = meal.mealImages[0]

            MealImage(
                mealImage = mealImage,
                contentDescription = "Image for ${meal.title}",
                Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
                    .clip(MaterialTheme.shapes.extraLarge)
            )
        } else {
            EmptyMealImage(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
                    .clip(MaterialTheme.shapes.extraLarge),
                "Image for ${meal.title}"
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp)
        ) {
            Text(
                text = meal.title
                    .trim()
                    .lines()
                    .map { it.trim() }
                    .filter { it.isNotBlank() }
                    .joinToString(", "),
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier
                    .weight(1f),
                softWrap = true,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(Modifier.width(24.dp))

            val currencyFormatter = rememberCurrencyFormatter(currencyCode = "EUR")

            Text(
                text = "${currencyFormatter(meal.price)} €",
                softWrap = false,
                style = MaterialTheme.typography.labelLarge.copy(
                    textDecoration = meal.studentPrice?.let { TextDecoration.LineThrough },
                    fontWeight = meal.studentPrice?.let { FontWeight.Normal } ?: FontWeight.Medium,
                ),
                color = meal.studentPrice?.let {
                    MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                } ?: MaterialTheme.colorScheme.onSurface
            )

            meal.studentPrice?.let {
                Spacer(Modifier.width(8.dp))

                Text(
                    text = "${currencyFormatter(meal.studentPrice)} €",
                    softWrap = false,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }

        Row(
            modifier = Modifier
                .padding(top = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                canteen.name,
                modifier = Modifier
                    .weight(1f),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSecondaryContainer
            )

            Spacer(Modifier.width(16.dp))

            meal.features.filter { it.showInFilter ?: false }.forEach {
                Spacer(Modifier.width(8.dp))

                MealIcon(
                    feature = it,
                    modifier = Modifier
                        .height(16.dp)
                )
            }
        }
    }
}