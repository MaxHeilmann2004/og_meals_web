import { computed } from 'vue'

export const useAdminAccess = () => {
  const route = useRoute()

  const adminToken = computed(() => {
    const rawToken = route.query.adminToken
    const token = Array.isArray(rawToken) ? rawToken[0] : rawToken
    return typeof token === 'string' ? token.trim() : ''
  })

  const isAdmin = computed(() => adminToken.value.length > 0)

  return { adminToken, isAdmin }
}
