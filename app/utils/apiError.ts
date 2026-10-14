type ErrorRecord = Record<string, unknown>

const isErrorRecord = (value: unknown): value is ErrorRecord =>
  typeof value === 'object' && value !== null

export const getApiErrorMessage = (error: unknown): string | undefined => {
  if (!isErrorRecord(error)) return

  const data = isErrorRecord(error.data) ? error.data : undefined
  const apiError = data && isErrorRecord(data.error) ? data.error : undefined

  if (typeof apiError?.message === 'string' && apiError.message) return apiError.message
  if (typeof data?.message === 'string' && data.message) return data.message
  if (typeof error.message === 'string' && error.message) return error.message
}
