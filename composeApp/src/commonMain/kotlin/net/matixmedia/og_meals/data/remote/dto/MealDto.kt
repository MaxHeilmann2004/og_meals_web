package net.matixmedia.og_meals.data.remote.dto

import kotlinx.serialization.Serializable
import net.matixmedia.og_meals.domain.model.MealAdditive
import net.matixmedia.og_meals.domain.model.MealAllergen
import net.matixmedia.og_meals.domain.model.MealCategory
import net.matixmedia.og_meals.domain.model.MealFeature
import net.matixmedia.og_meals.domain.model.MealImage
import net.matixmedia.og_meals.domain.model.Meal
import net.matixmedia.og_meals.domain.model.NutritionalInfo

@Serializable
data class MealDto(
    val id: Long,
    val title: String,
    val alternativeTitle: String?, // Kann null sein
    val price: Double,
    val studentPrice: Double?, // Kann null sein
    val guestPrice: Double?, // Kann null sein
    val date: String, // Behalten wir als String, das Repository wandelt es um
    val sustainabilityCo2: Int?, // Kann null sein
    val canteenId: Long,
    val nutritionalInfo: NutritionalInfoDto?, // Kann fehlen
    val allergens: List<AllergenDto>,
    val additives: List<AdditiveDto>,
    val features: List<FeatureDto>,
    val category: CategoryDto?, // Kann fehlen
    val images: List<ImageDto>
)

fun MealDto.toDomain() = Meal(
    id = id,
    title = title,
    alternativeTitle = alternativeTitle,
    price = price,
    studentPrice = studentPrice,
    guestPrice = guestPrice,
    date = kotlinx.datetime.LocalDate.parse(date.split("T")[0]),
    sustainabilityCo2 = sustainabilityCo2,
    canteenId = canteenId,
    nutritionalInfo = nutritionalInfo?.toDomain(),
    allergens = allergens.map { it.toDomain() },
    additives = additives.map { it.toDomain() },
    features = features.map { it.toDomain() },
    category = category?.toDomain(),
    mealImages = images.map { it.toDomain() }
)

@Serializable
data class NutritionalInfoDto(
    val kj: Int,
    val kcal: Int,
    val fat: Double,
    val saturatedFat: Double,
    val carbohydrates: Double,
    val sugar: Double,
    val protein: Double,
    val salt: Double
)

fun NutritionalInfoDto.toDomain() = NutritionalInfo(
    kj = kj,
    kcal = kcal,
    fat = fat,
    saturatedFat = saturatedFat,
    carbohydrates = carbohydrates,
    sugar = sugar,
    protein = protein,
    salt = salt
)

@Serializable
data class AllergenDto(
    val id: Long,
    val name: String,
    val shortName: String
)

fun AllergenDto.toDomain() = MealAllergen(
    id = id,
    name = name,
    shortName = shortName
)

@Serializable
data class AdditiveDto(
    val id: Long,
    val name: String?, // Kann null sein
    val shortName: String? // Kann null sein
)

fun AdditiveDto.toDomain() = MealAdditive(
    id = id,
    name = name,
    shortName = shortName
)

@Serializable
data class FeatureDto(
    val id: Long,
    val name: String?,
    val shortName: String?,
    val showInOverview: Boolean?,
    val showInFilter: Boolean?
)

fun FeatureDto.toDomain() = MealFeature(
    id = id,
    name = name,
    shortName = shortName,
    showInOverview = showInOverview,
    showInFilter = showInFilter
)

@Serializable
data class CategoryDto(
    val id: Long,
    val name: String? // Kann null sein
)

fun CategoryDto.toDomain() = MealCategory(
    id = id,
    name = name
)

@Serializable
data class ImageDto(
    val aiSuggested: Boolean,
    val url: String
)

fun ImageDto.toDomain() = MealImage(
    aiSuggested = aiSuggested,
    url = url
)