package net.matixmedia.og_meals

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform