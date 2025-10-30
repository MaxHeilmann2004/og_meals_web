package net.matixmedia.og_meals

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.safeContentPadding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import net.matixmedia.og_meals.presentation.root.RootComponent
import net.matixmedia.og_meals.presentation.root.RootUi
import net.matixmedia.og_meals.ui.theme.AppTheme
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.ui.tooling.preview.Preview

import og_meals.composeapp.generated.resources.Res
import og_meals.composeapp.generated.resources.compose_multiplatform
@Composable
@Preview
fun App(root: RootComponent) {
    AppTheme {
        RootUi(component = root)
    }
}