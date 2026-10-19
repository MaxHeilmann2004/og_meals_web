import { describe, expect, it } from 'vitest'
import {
  PWA_BANNER_DISMISSED_KEY,
  PWA_BANNER_SNOOZE_MS,
  isBannerSnoozed,
  isAndroidDevice,
  isIosDevice,
  isStandaloneDisplay,
  snoozeBanner,
} from '~/utils/pwa/install'

const iphoneSafari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const iphoneChrome = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1'
const ipadSafari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

describe('platform detection', () => {
  it('detects iOS devices in any browser, including iPadOS, but not desktop Macs', () => {
    expect(isIosDevice(iphoneSafari)).toBe(true)
    expect(isIosDevice(iphoneChrome)).toBe(true)
    expect(isIosDevice(ipadSafari, 5)).toBe(true)
    expect(isIosDevice(ipadSafari, 0)).toBe(false)
  })

  it('detects Android', () => {
    expect(isAndroidDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36')).toBe(true)
    expect(isAndroidDevice(iphoneSafari)).toBe(false)
  })
})

describe('isStandaloneDisplay', () => {
  const win = (matches: boolean, standalone?: boolean) =>
    ({ matchMedia: () => ({ matches }), navigator: { standalone } }) as unknown as Window

  it('detects standalone display modes and iOS standalone', () => {
    expect(isStandaloneDisplay(win(true))).toBe(true)
    expect(isStandaloneDisplay(win(false, true))).toBe(true)
    expect(isStandaloneDisplay(win(false))).toBe(false)
  })
})

describe('banner snooze', () => {
  const memoryStorage = () => {
    const data = new Map<string, string>()
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
    }
  }

  it('snoozes until the snooze window passed', () => {
    const storage = memoryStorage()
    expect(isBannerSnoozed(storage, 1000)).toBe(false)

    snoozeBanner(storage, 1000)
    expect(storage.getItem(PWA_BANNER_DISMISSED_KEY)).toBe('1000')
    expect(isBannerSnoozed(storage, 1000 + PWA_BANNER_SNOOZE_MS - 1)).toBe(true)
    expect(isBannerSnoozed(storage, 1000 + PWA_BANNER_SNOOZE_MS)).toBe(false)
  })

  it('does not throw when storage is unavailable', () => {
    const broken = {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
    }
    expect(isBannerSnoozed(broken)).toBe(false)
    expect(() => snoozeBanner(broken)).not.toThrow()
  })
})
