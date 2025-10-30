package net.matixmedia.og_meals.data.remote

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import kotlinx.datetime.LocalDate
import net.matixmedia.og_meals.data.remote.dto.MealsApiResponseDto

private const val BASE_URL = "https://3b-meals.mh-home.net"
//private const val BASE_URL = "http://localhost:3000"

class MealsApiImpl(
    private val httpClient: HttpClient
) : MealsApi {

    override suspend fun getMeals(start: LocalDate, end: LocalDate): MealsApiResponseDto { // Geänderter Rückgabetyp
        // Error-Handling ist hier wichtig, aber der Einfachheit halber weggelassen
        return httpClient.get("$BASE_URL/meals") {
            parameter("start", start.toString())
            parameter("end", end.toString())
        }.body<MealsApiResponseDto>() // Ktor deserialisiert das gesamte Objekt
    }

    override fun buildImageUrl(path: String): String {
        return "$BASE_URL$path"
    }
}