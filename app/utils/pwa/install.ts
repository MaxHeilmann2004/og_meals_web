export const PWA_BANNER_DISMISSED_KEY = 'og-meals:pwa-banner-dismissed-at'
export const PWA_BANNER_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000

interface StandaloneNavigator extends Navigator {
  standalone?: boolean
}

export const isStandaloneDisplay = (win: Window = window) => {
  const nav = win.navigator as StandaloneNavigator
  return (
    win.matchMedia?.('(display-mode: standalone)').matches === true ||
    win.matchMedia?.('(display-mode: fullscreen)').matches === true ||
    nav.standalone === true
  )
}

// iPadOS reports itself as a Mac, so touch support is used to tell them apart.
export const isIosDevice = (userAgent: string, maxTouchPoints = 0) =>
  /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)

export const isAndroidDevice = (userAgent: string) => /Android/.test(userAgent)

export const isBannerSnoozed = (storage: Pick<Storage, 'getItem'>, now = Date.now()) => {
  try {
    const dismissedAt = Number(storage.getItem(PWA_BANNER_DISMISSED_KEY))
    return Number.isFinite(dismissedAt) && dismissedAt > 0 && now - dismissedAt < PWA_BANNER_SNOOZE_MS
  } catch {
    return false
  }
}

export const snoozeBanner = (storage: Pick<Storage, 'setItem'>, now = Date.now()) => {
  try {
    storage.setItem(PWA_BANNER_DISMISSED_KEY, String(now))
  } catch {
    // Storage can be unavailable (private mode); the banner then simply reappears next visit.
  }
}
