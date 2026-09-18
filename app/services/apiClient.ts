export const apiRequest = <T>(path: string, options?: Parameters<typeof $fetch<T>>[1]) => {
  const config = useRuntimeConfig()
  return $fetch<T>(`${config.public.apiBaseUrl}${path}`, options)
}

export const apiUrl = (path: string) => {
  const config = useRuntimeConfig()
  return `${config.public.apiBaseUrl}${path}`
}
