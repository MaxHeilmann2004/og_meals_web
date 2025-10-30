package net.matixmedia.og_meals.presentation.meals

import com.arkivanov.decompose.ComponentContext
import com.arkivanov.essenty.lifecycle.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
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

    fun onDaySelected(dayIndex: Int)
}

// 2. Der UI-Zustand
data class MealScreenState @OptIn(ExperimentalTime::class) constructor(
    val isLoading: Boolean = false,
    val canteens: List<Canteen> = emptyList(),
    val error: String? = null,
    val selectedDayIndex: Int = run {
        // Bestimme den Index des aktuellen Wochentags (0 = Montag, 6 = Sonntag)
        val today = getWorkDayScopedToday()
        var dayOfWeek = today.dayOfWeek.isoDayNumber // 1 (Montag) bis 7 (Sonntag)
        if (dayOfWeek > 5) dayOfWeek = 1
        dayOfWeek - 1 // Umwandlung in 0-basierten Index
    },
    val selectedDayDate: LocalDate = getDateBasedOnDayIndex(selectedDayIndex)
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
    private val dayIndexTriggerFlow = _uiState.map { it.selectedDayIndex }.distinctUntilChanged()
    private val dayIndexTriggerScope = coroutineScope()

    init {
        loadMeals()

        dayIndexTriggerFlow.onEach { newDayIndex ->
            _uiState.update { it.copy(selectedDayDate = getDateBasedOnDayIndex(newDayIndex)) }
        }.launchIn(dayIndexTriggerScope)
    }

    override fun refreshData() {
        loadMeals()
    }

    @OptIn(ExperimentalTime::class)
    private fun loadMeals() {
        scope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                val today = getWorkDayScopedToday()

                // 5 Werktage (Mo-Fr)
                val startOfWeek = today.minus(today.dayOfWeek.isoDayNumber - 1, DateTimeUnit.DAY)
                val endOfWeek = startOfWeek.plus(4, DateTimeUnit.DAY)

                // Rufe das Repository auf (das jetzt die Gruppierung macht)
                val canteensWithMeals = mealsRepository.getMeals(startOfWeek, endOfWeek).filter { it.id in arrayOf(6L, 7L, 8L) }

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

    @OptIn(ExperimentalTime::class)
    override fun onDaySelected(dayIndex: Int) {
        _uiState.update { it.copy(selectedDayIndex = dayIndex) }
    }
}


@OptIn(ExperimentalTime::class)
private fun getWorkDayScopedToday(): LocalDate {
    // Hole das heutige Datum
    var today = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).date

    // Wenn today am Wochenende ist, setze es auf den nächsten Montag
    today = when (today.dayOfWeek) {
        DayOfWeek.SATURDAY -> today.plus(2, DateTimeUnit.DAY)
        DayOfWeek.SUNDAY -> today.plus(1, DateTimeUnit.DAY)
        else -> today
    }
    return today
}

private fun getDateBasedOnDayIndex(dayIndex: Int): LocalDate {
    val today = getWorkDayScopedToday()
    val startOfWeek = today.minus(today.dayOfWeek.isoDayNumber - 1, DateTimeUnit.DAY)
    return startOfWeek.plus(dayIndex, DateTimeUnit.DAY)
}