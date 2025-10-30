package net.matixmedia.og_meals.utils

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import platform.Foundation.NSDecimalNumber
import platform.Foundation.NSLocale
import platform.Foundation.NSNumberFormatter
import platform.Foundation.NSNumberFormatterCurrencyStyle
import platform.Foundation.currentLocale

@Composable
actual fun rememberCurrencyFormatter(
    currencyCode: String,
    maxFractionDigits: Int
): (amount: Double) -> String {

    val formatter = remember(currencyCode, maxFractionDigits) {
        NSNumberFormatter().apply {
            setLocale(NSLocale.currentLocale) // Nutzt die iOS-Geräteeinstellung
            setNumberStyle(NSNumberFormatterCurrencyStyle)
            setCurrencyCode(currencyCode)
            setMaximumFractionDigits(maxFractionDigits.toULong())
        }
    }

    return { amount ->
        formatter.stringFromNumber(NSDecimalNumber(amount)) ?: amount.toString() // Fallback
    }
}