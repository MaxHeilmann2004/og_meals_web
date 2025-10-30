package net.matixmedia.og_meals.utils

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import java.text.NumberFormat
import java.util.Currency

@Composable
actual fun rememberCurrencyFormatter(
    currencyCode: String,
    maxFractionDigits: Int
): (amount: Double) -> String {
    val locale = LocalConfiguration.current.locales[0]

    val formatter = remember(locale, currencyCode, maxFractionDigits) {
        NumberFormat.getCurrencyInstance(locale).apply {
            this.currency = Currency.getInstance(currencyCode)
            this.maximumFractionDigits = maxFractionDigits
        }
    }

    // Rette die Lambda-Funktion
    return { amount ->
        formatter.format(amount)
    }
}