import { onUnmounted, watch, type Ref } from 'vue'

export const useDialogHistory = (
  isOpen: Readonly<Ref<boolean>>,
  hasContent: Readonly<Ref<boolean>>,
  historyKey: string,
  close: () => void,
) => {
  const handlePopState = () => close()

  const removeHistoryEntry = () => {
    window.removeEventListener('popstate', handlePopState)
    if (window.history.state?.[historyKey]) window.history.back()
  }

  watch([isOpen, hasContent], ([open, content]) => {
    if (typeof window === 'undefined') return

    if (open && content) {
      window.addEventListener('popstate', handlePopState)
      window.history.pushState({ [historyKey]: true }, '')
    } else {
      removeHistoryEntry()
    }
  }, { immediate: true })

  onUnmounted(() => {
    if (typeof window !== 'undefined') removeHistoryEntry()
  })
}
