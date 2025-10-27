package net.matixmedia.og_meals.data.remote.dto

import kotlinx.serialization.Serializable
import net.matixmedia.og_meals.domain.model.Canteen
import net.matixmedia.og_meals.domain.model.LocationInfo
import net.matixmedia.og_meals.domain.model.Meal

@Serializable
data class CanteenDto(
    val id: Long,
    val name: String,
    val hash: String,
    val displayName: String,
    val outletId: Int,
    val locationInfo: LocationInfoDto
)

fun CanteenDto.toDomain() = Canteen(
    id = id,
    name = name,
    hash = hash,
    displayName = displayName,
    outletId = outletId,
    locationInfo = locationInfo.toDomain(),
    meals = emptyList()
)

@Serializable
data class LocationInfoDto(
    val id: Long,
    val name: String
)

fun LocationInfoDto.toDomain() = LocationInfo(
    id = id,
    name = name
)