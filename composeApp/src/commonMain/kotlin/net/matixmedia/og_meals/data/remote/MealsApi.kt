package net.matixmedia.og_meals.data.remote

import kotlinx.datetime.LocalDate
import net.matixmedia.og_meals.data.remote.dto.MealsApiResponseDto


interface MealsApi {

    /**
     * Ruft das gesamte Antwort-Objekt (Kantinen und Speisen) ab.
     */
    suspend fun getMeals(start: LocalDate, end: LocalDate): MealsApiResponseDto // Geänderter Rückgabetyp

    /**
     * Erstellt eine vollständige Bild-URL basierend auf dem angegebenen Pfad.
     */
    fun buildImageUrl(path: String): String
}