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
    val allergens: List<Allergen>,
    val additives: List<Additive>,
    val features: List<Feature>,
    val category: Category?,
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

data class Allergen(
    val id: Long,
    val name: String?,
    val shortName: String?
)

data class Additive(
    val id: Long,
    val name: String?,
    val shortName: String?
)

data class Feature(
    val id: Long,
    val name: String?,
    val shortName: String?,
    val showInOverview: Boolean?
)

data class Category(
    val id: Long,
    val name: String?
)

data class MealImage(
    val aiSuggested: Boolean,
    val url: String
)