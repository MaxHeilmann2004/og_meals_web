package net.matixmedia.og_meals.domain.model

import kotlinx.datetime.LocalDate


data class Meal(
    val id: Long,
    val title: String,
    val alternativeTitle: String?,
    val price: Double,
    val studentPrice: Double?,
    val guestPrice: Double?,
    val date: LocalDate,
    val sustainabilityCo2: Int?,
    val canteenId: Long,
    val nutritionalInfo: NutritionalInfo?,
    val allergens: List<MealAllergen>,
    val additives: List<MealAdditive>,
    val features: List<MealFeature>,
    val category: MealCategory?,
    val mealImages: List<MealImage>
)

data class NutritionalInfo(
    val kj: Int,
    val kcal: Int,
    val fat: Double,
    val saturatedFat: Double,
    val carbohydrates: Double,
    val sugar: Double,
    val protein: Double,
    val salt: Double
)

data class MealAllergen(
    val id: Long,
    val name: String?,
    val shortName: String?
)

data class MealAdditive(
    val id: Long,
    val name: String?,
    val shortName: String?
)

data class MealFeature(
    val id: Long,
    val name: String?,
    val shortName: String?,
    val showInOverview: Boolean?,
    val showInFilter: Boolean?
)

data class MealCategory(
    val id: Long,
    val name: String?
)

data class MealImage(
    val aiSuggested: Boolean,
    val url: String
)