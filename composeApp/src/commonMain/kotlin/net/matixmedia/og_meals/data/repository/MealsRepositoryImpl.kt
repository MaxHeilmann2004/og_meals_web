package net.matixmedia.og_meals.data.repository

import kotlinx.datetime.LocalDate
import net.matixmedia.og_meals.data.remote.MealsApi
import net.matixmedia.og_meals.data.remote.dto.toDomain
import net.matixmedia.og_meals.domain.model.Canteen

class MealsRepositoryImpl(
    private val mealsApi: MealsApi
) : MealsRepository {

    override suspend fun getMeals(start: LocalDate, end: LocalDate): List<Canteen> {
        return try {
             mealsApi.getMeals(start, end).toDomain()
        } catch (e: Exception) {
            // A simple error handling. In a real app, you might
            // throw a custom exception or return a sealed Result type.
            println("Error fetching meals: ${e.message}")
            emptyList()
        }
    }
}