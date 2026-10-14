export const apiRequest = <T>(path: string, options?: Parameters<typeof $fetch<T>>[1]) => {
  const requestFetch = useRequestFetch()
  return requestFetch<T>(`/api/backend${path}`, options)
}

export const apiUrl = (path: string) => {
  const config = useRuntimeConfig()
  const apiBaseUrl = new URL(config.public.apiBaseUrl)
  const targetUrl = new URL(path, apiBaseUrl)

  if (targetUrl.origin !== apiBaseUrl.origin) return path

  return `/api/backend${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
}
