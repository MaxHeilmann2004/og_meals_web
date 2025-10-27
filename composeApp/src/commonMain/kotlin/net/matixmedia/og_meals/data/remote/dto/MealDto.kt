package net.matixmedia.og_meals.data.remote.dto

import kotlinx.serialization.Serializable
import net.matixmedia.og_meals.domain.model.Additive
import net.matixmedia.og_meals.domain.model.Allergen
import net.matixmedia.og_meals.domain.model.Category
import net.matixmedia.og_meals.domain.model.Feature
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
    date = kotlinx.datetime.LocalDate.parse(date),
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

fun AllergenDto.toDomain() = Allergen(
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

fun AdditiveDto.toDomain() = Additive(
    id = id,
    name = name,
    shortName = shortName
)

@Serializable
data class FeatureDto(
    val id: Long,
    val name: String,
    val shortName: String,
    val showInOverview: Boolean
)

fun FeatureDto.toDomain() = Feature(
    id = id,
    name = name,
    shortName = shortName,
    showInOverview = showInOverview
)

@Serializable
data class CategoryDto(
    val id: Long,
    val name: String? // Kann null sein
)

fun CategoryDto.toDomain() = Category(
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