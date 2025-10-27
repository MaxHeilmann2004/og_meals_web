package net.matixmedia.og_meals.di

import org.koin.core.KoinApplication
import org.koin.core.context.startKoin
import org.koin.dsl.KoinAppDeclaration

actual fun initKoin(appDeclaration: KoinAppDeclaration): KoinApplication {
    return startKoin {
        appDeclaration()
        modules(
            appModule
        )
    }
}