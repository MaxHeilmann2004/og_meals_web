package net.matixmedia.og_meals.data.remote

import io.ktor.client.engine.HttpClientEngineFactory
import io.ktor.client.engine.darwin.Darwin

// 'actual' Implementierung, die die Darwin-Engine (NSURLSession) bereitstellt
actual fun createHttpClientEngine(): HttpClientEngineFactory<*> = Darwin