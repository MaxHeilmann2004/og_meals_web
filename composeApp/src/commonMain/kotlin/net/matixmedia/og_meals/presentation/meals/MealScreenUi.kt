package net.matixmedia.og_meals.presentation.meals

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.calculateStartPadding
import androidx.compose.foundation.layout.calculateEndPadding
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.dp
import og_meals.composeapp.generated.resources.Res
import og_meals.composeapp.generated.resources.ic_instant_mix
import og_meals.composeapp.generated.resources.logo
import org.jetbrains.compose.resources.painterResource


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MealScreenUi(component: MealScreenComponent) {
    val uiState by component.uiState.collectAsState()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Image(painterResource(Res.drawable.logo), "OG Meals")
                },
                actions = {
                    IconButton({}) {
                        Icon(painterResource(Res.drawable.ic_instant_mix), "Filter")
                    }
                }
            )
        }
    ) { paddingValues ->
        val layoutDirection = LocalLayoutDirection.current

        Box(
            // Use per-side padding so we can set bottom = 0.dp
            modifier = Modifier
                .fillMaxSize()
                .padding(
                    start = paddingValues.calculateStartPadding(layoutDirection),
                    top = paddingValues.calculateTopPadding(),
                    end = paddingValues.calculateEndPadding(layoutDirection),
                    bottom = 0.dp
                ),
            contentAlignment = Alignment.Center
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator()
            }

            uiState.error?.let {
                Text("Fehler: $it", color = MaterialTheme.colorScheme.error)
            }

            val gridState = rememberLazyGridState()
            val headerStuckMap = remember { mutableStateMapOf<Long, Boolean>() }
            val density = LocalDensity.current
            val topInsetPx = with(density) { paddingValues.calculateTopPadding().toPx() }
            BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                // Calculate amount of columns of each column based on minColumnWidth in regard to the available maxWidth
                val minColumnWidth = 400.dp
                val maxGridWidth = 1300.dp
                val availableWidth = if (maxWidth < maxGridWidth) maxWidth else maxGridWidth
                val columnCount = (availableWidth / minColumnWidth).toInt().coerceAtLeast(1)
                // If maxSize larger than maxGridWidth, center the grid
                val horizontalPadding = if (maxWidth < maxGridWidth) 0.dp else (maxWidth - maxGridWidth) / 2


                LazyVerticalGrid(
                    modifier = Modifier.fillMaxSize(),
                    columns = GridCells.Adaptive(minColumnWidth),
                    contentPadding = PaddingValues(horizontal = horizontalPadding),
                    state = gridState
                ) {
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        val listState = rememberLazyListState()

                        LaunchedEffect(Unit) {
                            listState.scrollToItem(uiState.selectedDayIndex)
                        }

                        LazyRow(
                            state = listState
                        ) {
                            item {
                                Spacer(Modifier.width(8.dp))
                            }

                            items(5) { dayIndex ->
                                val dayName = when (dayIndex) {
                                    0 -> "Montag"
                                    1 -> "Dienstag"
                                    2 -> "Mittwoch"
                                    3 -> "Donnerstag"
                                    4 -> "Freitag"
                                    else -> "Unbekannt"
                                }

                                FilterChip(
                                    selected = dayIndex == uiState.selectedDayIndex,
                                    onClick = { component.onDaySelected(dayIndex) },
                                    label = { Text(dayName) },
                                    modifier = Modifier.padding(4.dp)
                                )
                            }

                            item {
                                Spacer(Modifier.width(8.dp))
                            }
                        }
                    }

                    uiState.canteens.forEach { canteen ->
                        item(span = { GridItemSpan(maxLineSpan) }) {
                            Text(
                                canteen.name,
                                style = MaterialTheme.typography.headlineMedium,
                                modifier = Modifier
                                    .padding(start = 12.dp, end = 12.dp, top = 12.dp, bottom = 16.dp)
                            )
                        }

                        items(canteen.meals.filter { it.date == uiState.selectedDayDate }) { meal ->
                            Column {
                                MealCard(meal = meal, canteen = canteen)

                                if (columnCount == 1)
                                    HorizontalDivider(
                                        modifier = Modifier
                                            .padding(start = 12.dp, end = 12.dp, top = 6.dp, bottom = 8.dp)
                                    )
                            }
                        }
                    }
                }
            }
        }
    }
}