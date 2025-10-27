package net.matixmedia.og_meals.presentation.meals

import com.arkivanov.decompose.ComponentContext
import com.arkivanov.essenty.lifecycle.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.TimeZone
import kotlinx.datetime.isoDayNumber
import kotlinx.datetime.minus
import kotlinx.datetime.plus
import kotlinx.datetime.toLocalDateTime
import net.matixmedia.og_meals.data.repository.MealsRepository
import net.matixmedia.og_meals.domain.model.Canteen
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

// 1. Das Interface (was die UI sieht)
interface MealScreenComponent {
    val uiState: StateFlow<MealScreenState>
    fun refreshData()
}

// 2. Der UI-Zustand
data class MealScreenState(
    val isLoading: Boolean = false,
    val canteens: List<Canteen> = emptyList(),
    val error: String? = null
)

// 3. Die Implementierung (die Logik)
class DefaultMealScreenComponent(
    componentContext: ComponentContext,
    private val mealsRepository: MealsRepository // Von Koin injiziert
) : MealScreenComponent, ComponentContext by componentContext {

    private val _uiState = MutableStateFlow(MealScreenState())
    override val uiState = _uiState.asStateFlow()

    // Decompose-eigener CoroutineScope
    private val scope = coroutineScope()

    init {
        loadMeals()
    }

    override fun refreshData() {
        loadMeals()
    }

    @OptIn(ExperimentalTime::class)
    private fun loadMeals() {
        scope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                // Hole das heutige Datum
                val today = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).date

                // Berechne Montag und Freitag der aktuellen Woche
                val monday = today.minus(today.dayOfWeek.isoDayNumber - DayOfWeek.MONDAY.isoDayNumber, DateTimeUnit.DAY)
                val friday = monday.plus(4, DateTimeUnit.DAY)

                // Rufe das Repository auf (das jetzt die Gruppierung macht)
                val canteensWithMeals = mealsRepository.getMeals(monday, friday)

                _uiState.update {
                    it.copy(isLoading = false, canteens = canteensWithMeals)
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message ?: "Unbekannter Fehler")
                }
            }
        }
    }
}