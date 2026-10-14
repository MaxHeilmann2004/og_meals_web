import { reviewsApi } from '~/services/reviewsApi'
import { getApiErrorMessage } from '~/utils/apiError'

export const useReviewSettings = () => {
  const textReviewsEnabled = useState<boolean | null>('review-settings-text-enabled', () => null)
  const settingsLoaded = useState('review-settings-loaded', () => false)
  const isSettingsLoading = useState('review-settings-loading', () => false)
  const settingsError = useState<string | null>('review-settings-error', () => null)

  const loadSettings = async (forceRefresh = false) => {
    if (settingsLoaded.value && !forceRefresh) return true
    if (isSettingsLoading.value) return false

    isSettingsLoading.value = true
    settingsLoaded.value = false
    textReviewsEnabled.value = null
    settingsError.value = null

    try {
      const response = await reviewsApi.getSettings()
      if (!response.success || typeof response.data?.textReviewsEnabled !== 'boolean') {
        throw new Error('The review settings response was invalid.')
      }

      textReviewsEnabled.value = response.data.textReviewsEnabled
      settingsLoaded.value = true
      return true
    } catch (error: unknown) {
      console.error('Failed to load review settings:', error)
      settingsError.value = getApiErrorMessage(error) || 'Fehler beim Laden der Bewertungseinstellungen.'
      return false
    } finally {
      isSettingsLoading.value = false
    }
  }

  return {
    textReviewsEnabled,
    settingsLoaded,
    isSettingsLoading,
    settingsError,
    loadSettings,
  }
}
