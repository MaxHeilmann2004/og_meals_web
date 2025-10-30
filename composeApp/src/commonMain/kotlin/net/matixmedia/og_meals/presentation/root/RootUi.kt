package net.matixmedia.og_meals.presentation.root

import androidx.compose.runtime.Composable
import com.arkivanov.decompose.extensions.compose.stack.Children
import com.arkivanov.decompose.extensions.compose.stack.animation.slide
import com.arkivanov.decompose.extensions.compose.stack.animation.stackAnimation
import net.matixmedia.og_meals.presentation.meals.MealScreenUi

@Composable
fun RootUi(component: RootComponent) {
    Children(
        stack = component.childStack,
        animation = stackAnimation(slide())
    ) { child ->
        when (val instance = child.instance) {
            is RootComponent.Child.MealScreen -> MealScreenUi(instance.component)
        }
    }
}