import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// The standalone test TypeScript project does not process Vue SFCs; Vitest does via the Vue Vite plugin.
// @ts-expect-error Vue SFC import
import VerificationQrScanner from '~/components/shared/VerificationQrScanner.vue'

const originalGetContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext')

describe('VerificationQrScanner with ZXing', () => {
  let contextCalls = 0
  let stopTrack: ReturnType<typeof vi.fn>

  beforeEach(() => {
    contextCalls = 0
    stopTrack = vi.fn()
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: function () {
        contextCalls += 1
        if (contextCalls === 1) throw new Error('Transient canvas context error')

        return {
          drawImage: vi.fn(),
          getImageData: (_x: number, _y: number, width: number, height: number) => {
            const data = new Uint8ClampedArray(width * height * 4)
            data.fill(255)
            return { data }
          },
        }
      },
    })
  })

  afterEach(() => {
    if (originalGetContext) {
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', originalGetContext)
    } else {
      Reflect.deleteProperty(HTMLCanvasElement.prototype, 'getContext')
    }
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('retries a transient ZXing canvas error and continues decoding live frames', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {})
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const stream = new MediaStream()
    Object.defineProperty(stream, 'getTracks', {
      configurable: true,
      value: () => [{ stop: stopTrack }],
    })
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    })

    const wrapper = mount(VerificationQrScanner, {
      global: {
        stubs: {
          'var-button': { template: '<button type="button"><slot /></button>' },
        },
      },
    })
    const video = wrapper.get('video').element as HTMLVideoElement
    Object.defineProperties(video, {
      videoWidth: { configurable: true, value: 640 },
      videoHeight: { configurable: true, value: 480 },
      play: { configurable: true, value: vi.fn().mockResolvedValue(undefined) },
    })
    await flushPromises()

    await vi.waitFor(() => expect(contextCalls).toBe(1))
    await vi.waitFor(() => expect(contextCalls).toBeGreaterThan(1))

    expect(contextCalls).toBeGreaterThan(1)
    expect(consoleInfo).toHaveBeenCalledWith(
      '[VerificationQrScanner] First frame contained no decodable QR code; continuing to scan.',
      expect.objectContaining({ name: 'NotFoundException' }),
    )
    expect(consoleWarn).toHaveBeenCalledOnce()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(video.srcObject).toBe(stream)
    expect(stopTrack).not.toHaveBeenCalled()

    wrapper.unmount()
    expect(stopTrack).toHaveBeenCalledOnce()
  })
})
