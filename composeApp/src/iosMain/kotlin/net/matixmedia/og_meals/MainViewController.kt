package net.matixmedia.og_meals

import androidx.compose.ui.window.ComposeUIViewController
import net.matixmedia.og_meals.di.initKoin
import platform.UIKit.UIViewController

fun MainViewController(): UIViewController {
    initKoin()
    return ComposeUIViewController { App() }
}