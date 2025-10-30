package net.matixmedia.og_meals.data.remote

import io.ktor.client.*
import io.ktor.client.engine.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

// 1. Definiere die 'expect' Engine-Factory
expect fun createHttpClientEngine(): HttpClientEngineFactory<*>

// 2. Erstelle den gemeinsamen Client
fun createKtorClient(): HttpClient {
    return HttpClient(createHttpClientEngine()) { // Nutzt die plattformspezifische Engine
        expectSuccess = true

        // JSON-Serialisierung mit kotlinx.serialization
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true // Wichtig für API-Änderungen
            })
        }

        // Logging für einfaches Debugging
        install(Logging) {
            level = LogLevel.ALL
        }

        // Hier könntest du auch die Basis-URL setzen,
        // aber für eine einzelne URL ist es oft einfacher, sie im Api-Service zu hardcoden.
    }
}