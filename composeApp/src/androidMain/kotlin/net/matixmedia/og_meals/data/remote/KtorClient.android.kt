package net.matixmedia.og_meals.data.remote

import io.ktor.client.engine.HttpClientEngineFactory
import io.ktor.client.engine.okhttp.OkHttp

// 'actual' Implementierung für Android
actual fun createHttpClientEngine(): HttpClientEngineFactory<*> = OkHttp