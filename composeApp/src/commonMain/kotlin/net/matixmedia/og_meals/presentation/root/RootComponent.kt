package net.matixmedia.og_meals.presentation.root

import com.arkivanov.decompose.ComponentContext
import com.arkivanov.decompose.router.stack.ChildStack
import com.arkivanov.decompose.router.stack.StackNavigation
import com.arkivanov.decompose.router.stack.childStack
import com.arkivanov.decompose.value.Value
import kotlinx.serialization.Serializable
import net.matixmedia.og_meals.presentation.meals.MealScreenComponent
import org.koin.core.component.KoinComponent
import org.koin.core.component.get
import org.koin.core.parameter.parametersOf

interface RootComponent {
    val childStack: Value<ChildStack<*, Child>>

    // Definiert die möglichen "Kinder" (Screens), die im Stack leben können
    sealed interface Child {
        data class MealScreen(val component: MealScreenComponent) : Child
        // data class FilterScreen(val component: FilterComponent) : Child
    }
}

class DefaultRootComponent(
    componentContext: ComponentContext
): RootComponent, KoinComponent, ComponentContext by componentContext {
    @Serializable
    private sealed interface Config {
        @Serializable
        data object MealScreen : Config
    }

    private val navigation = StackNavigation<Config>()

    override val childStack: Value<ChildStack<*, RootComponent.Child>> =
        childStack(
            source = navigation,
            serializer = Config.serializer(),
            initialConfiguration = Config.MealScreen,
            handleBackButton = true,
            childFactory = ::createChild
        )

    private fun createChild(
        config: Config,
        context: ComponentContext
    ): RootComponent.Child {
        return when (config) {
            is Config.MealScreen -> {
                RootComponent.Child.MealScreen(
                    get<MealScreenComponent> { parametersOf(context) }
                )
            }
        }
    }
}