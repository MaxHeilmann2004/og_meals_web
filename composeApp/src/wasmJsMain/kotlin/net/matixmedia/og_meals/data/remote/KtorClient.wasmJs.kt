package net.matixmedia.og_meals.data.remote

import io.ktor.client.engine.HttpClientEngineFactory
import io.ktor.client.engine.js.Js // Importiere die Ktor 3 'Js'-Engine

// 'actual' Implementierung, die die Js-Engine für Wasm bereitstellt
actual fun createHttpClientEngine(): HttpClientEngineFactory<*> = Js