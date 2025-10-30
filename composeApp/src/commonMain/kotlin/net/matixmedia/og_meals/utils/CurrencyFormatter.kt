package net.matixmedia.og_meals.utils

import androidx.compose.runtime.Composable

/**
 * Ein Composable, das eine plattformspezifische Funktion zum
 * Formatieren von Währungen "erinnert".
 *
 * @param currencyCode Der ISO 4217-Code (z.B. "EUR", "USD").
 * @param maxFractionDigits Die maximalen Nachkommastellen.
 * @return Eine Lambda-Funktion, die (BigDecimal) -> String ist.
 */
@Composable
expect fun rememberCurrencyFormatter(
    currencyCode: String,
    maxFractionDigits: Int = 2
): (amount: Double) -> String