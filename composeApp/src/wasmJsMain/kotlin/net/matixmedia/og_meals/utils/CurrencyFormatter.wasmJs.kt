package net.matixmedia.og_meals.utils

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember

@OptIn(ExperimentalWasmJsInterop::class)
@Composable
actual fun rememberCurrencyFormatter(
    currencyCode: String,
    maxFractionDigits: Int
): (amount: Double) -> String {

    val options = remember(currencyCode, maxFractionDigits) {
        FormattingOptions(
            style = "currency",
            currency = currencyCode,
            maximumFractionDigits = maxFractionDigits
        ).toJsReference()
    }

    // "undefined" (als String) ist der JS-Weg, um
    // "nutze die Standard-Locale" (des Browsers) zu sagen.
    val locale = "undefined"

    return { amount ->
        jsFormatLocaleString(amount, jsLanguage(), options)
    }
}

@OptIn(ExperimentalWasmJsInterop::class)
@JsFun("(target, locale, options) => target.toLocaleString(locale, options)")
private external fun jsFormatLocaleString(
    target: Double,
    locale: String,
    options: JsReference<FormattingOptions> // Das 'jso'-Objekt ist vom Typ JsAny
): String

@OptIn(ExperimentalWasmJsInterop::class)
@JsFun("() => navigator.language || navigator.browserLanguage || ( navigator.languages || [ \"en\" ] ) [ 0 ]")
private external fun jsLanguage(): String

private data class FormattingOptions(
    val style: String,
    val currency: String,
    val maximumFractionDigits: Int
)