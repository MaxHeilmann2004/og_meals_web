package net.matixmedia.og_meals.domain.model


data class Canteen(
    val id: Long,
    val name: String,
    val hash: String,
    val displayName: String,
    val outletId: Int,
    val locationInfo: LocationInfo,
    val meals: List<Meal>
)

data class LocationInfo(
    val id: Long,
    val name: String
)