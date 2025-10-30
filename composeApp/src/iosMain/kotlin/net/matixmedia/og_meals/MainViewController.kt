package net.matixmedia.og_meals

import androidx.compose.ui.window.ComposeUIViewController
import com.arkivanov.decompose.DefaultComponentContext
import com.arkivanov.essenty.lifecycle.LifecycleRegistry
import net.matixmedia.og_meals.di.initKoin
import net.matixmedia.og_meals.presentation.root.DefaultRootComponent
import platform.UIKit.UIViewController

fun MainViewController(): UIViewController {
    initKoin()

    val lifecycle = LifecycleRegistry()

    val root = DefaultRootComponent(
        componentContext = DefaultComponentContext(lifecycle = lifecycle)
    )

    return ComposeUIViewController {
        App(root = root)
    }
}