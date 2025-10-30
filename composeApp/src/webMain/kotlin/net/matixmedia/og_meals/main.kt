package net.matixmedia.og_meals

import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.window.ComposeViewport
import com.arkivanov.decompose.DefaultComponentContext
import com.arkivanov.essenty.lifecycle.LifecycleRegistry
import net.matixmedia.og_meals.di.initKoin
import net.matixmedia.og_meals.presentation.root.DefaultRootComponent

@OptIn(ExperimentalComposeUiApi::class)
fun main() {
    initKoin()
    
    val lifecycle = LifecycleRegistry()
    
    val root = DefaultRootComponent(
        componentContext = DefaultComponentContext(lifecycle = lifecycle)
    )
    
    ComposeViewport {
        App(root = root)
    }
}