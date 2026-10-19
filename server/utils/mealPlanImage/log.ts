import { randomUUID } from 'node:crypto'

export const mealPlanImageRequestIdHeader = 'x-meal-plan-image-request-id'

const prefix = '[meal-plan-image]'

export const newRequestId = () => randomUUID().slice(0, 8)

export const logMealPlanImage = (requestId: string, message: string) => {
  console.info(`${prefix} ${requestId} ${message}`)
}

export const warnMealPlanImage = (requestId: string, message: string) => {
  console.warn(`${prefix} ${requestId} ${message}`)
}

export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} kB`

export type StepTimings = Record<string, number>

/** Measures named steps of one request, logs each one and keeps the durations for the Server-Timing header. */
export const createStepTimer = (requestId: string) => {
  const startedAt = performance.now()
  const timings: StepTimings = {}

  const record = (name: string, durationMs: number, detail?: string) => {
    timings[name] = Math.round(durationMs)
    logMealPlanImage(requestId, `${name} took ${Math.round(durationMs)}ms${detail ? ` (${detail})` : ''}`)
  }

  return {
    timings,
    totalMs: () => Math.round(performance.now() - startedAt),
    record,
    async step<T>(name: string, run: () => Promise<T> | T, detail?: (result: T) => string | undefined): Promise<T> {
      const stepStartedAt = performance.now()
      try {
        const result = await run()
        record(name, performance.now() - stepStartedAt, detail?.(result))
        return result
      } catch (error) {
        record(`${name} (failed)`, performance.now() - stepStartedAt, error instanceof Error ? error.message : String(error))
        throw error
      }
    },
  }
}

export const toServerTiming = (timings: StepTimings) =>
  Object.entries(timings)
    .map(([name, duration]) => `${name.replace(/[^a-zA-Z0-9_-]+/g, '-')};dur=${duration}`)
    .join(', ')
