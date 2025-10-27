package net.matixmedia.og_meals.di

import org.koin.core.KoinApplication
import org.koin.dsl.KoinAppDeclaration

expect fun initKoin(appDeclaration: KoinAppDeclaration = {}): KoinApplication

// Diese Funktion wird von den Plattform-Modulen aufgerufen
fun initKoin() = initKoin {}