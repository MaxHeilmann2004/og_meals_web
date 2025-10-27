package net.matixmedia.og_meals.data.repository

import kotlinx.datetime.LocalDate
import net.matixmedia.og_meals.domain.model.Canteen
import net.matixmedia.og_meals.domain.model.Meal

interface MealsRepository {

    /**
     * Fetches meals within a specific time range from the data source.
     *
     * @param start The start time as an Instant.
     * @param end The end time as an Instant.
     * @return A list of clean [Canteen] domain models that contain the [Meal]s.
     */
    suspend fun getMeals(start: LocalDate, end: LocalDate): List<Canteen>

    // Later, you might add functions like:
    // suspend fun getCanteens(): List<Canteen>
}