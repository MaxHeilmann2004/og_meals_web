package net.matixmedia.og_meals.di

import com.arkivanov.decompose.ComponentContext
import net.matixmedia.og_meals.data.remote.MealsApi
import net.matixmedia.og_meals.data.remote.MealsApiImpl
import net.matixmedia.og_meals.data.remote.createKtorClient
import net.matixmedia.og_meals.data.repository.MealsRepository
import net.matixmedia.og_meals.data.repository.MealsRepositoryImpl
import net.matixmedia.og_meals.presentation.meals.DefaultMealScreenComponent
import net.matixmedia.og_meals.presentation.meals.MealScreenComponent
import org.koin.dsl.module

// Dieses Modul deklariert alle deine Abhängigkeiten
val appModule = module {
    // Ktor Client (Singleton)
    // Wir definieren createKtorClient in data/remote/KtorClient.kt
    single { createKtorClient() }

    // API-Service (Singleton, bekommt den Ktor-Client injiziert)
    single<MealsApi> { MealsApiImpl(get()) }

    // Repository (Singleton, bekommt den API-Service injiziert)
    single<MealsRepository> { MealsRepositoryImpl(get()) }

    // Screen Component (Factory, bekommt das Repository injiziert)
    // Da ComponentContext zur Laufzeit bereitgestellt wird, übergeben wir ihn als Parameter.
    factory<MealScreenComponent> { (componentContext: ComponentContext) ->
        DefaultMealScreenComponent(
            componentContext = componentContext,
            mealsRepository = get()
        )
    }
}