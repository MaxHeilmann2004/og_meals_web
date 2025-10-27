package net.matixmedia.og_meals.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class MealsApiResponseDto (
    val canteens: List<CanteenDto>,
    val meals: List<MealDto>
)

fun MealsApiResponseDto.toDomain() = canteens.map { canteenDto ->
    val mealsForCanteen = meals.filter { it.canteenId == canteenDto.id }.map { it.toDomain() }
    canteenDto.toDomain().copy(meals = mealsForCanteen)
}