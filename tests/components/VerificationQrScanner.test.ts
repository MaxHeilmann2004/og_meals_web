import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// The standalone test TypeScript project does not process Vue SFCs; Vitest does via the Vue Vite plugin.
// @ts-expect-error Vue SFC import
import VerificationQrScanner from '~/components/shared/VerificationQrScanner.vue'

const { decodeFrame, getUserMedia, stopTrack } = vi.hoisted(() => ({
  decodeFrame: vi.fn(),
  getUserMedia: vi.fn(),
  stopTrack: vi.fn(),
}))

vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: class {
    decode = decodeFrame
  },
}))

const mockCamera = () => {
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
  const stream = new MediaStream()
  Object.defineProperty(stream, 'getTracks', {
    configurable: true,
    value: () => [{ stop: stopTrack }],
  })
  getUserMedia.mockResolvedValue(stream)
}

const mountScanner = (getVideoWidth: () => number = () => 640) => {
  const wrapper = mount(VerificationQrScanner, {
    global: {
      stubs: {
        'var-button': { template: '<button type="button"><slot /></button>' },
      },
    },
  })
  const video = wrapper.get('video').element as HTMLVideoElement
  Object.defineProperties(video, {
    videoWidth: { configurable: true, get: getVideoWidth },
    videoHeight: { configurable: true, get: () => 480 },
    play: { configurable: true, value: vi.fn().mockResolvedValue(undefined) },
  })
  return wrapper
}

describe('VerificationQrScanner', () => {
  beforeEach(() => {
    decodeFrame.mockImplementation(() => {
      throw Object.assign(new Error('No QR code in frame'), { name: 'NotFoundException' })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('emits the decoded QR text unchanged and stops the camera', async () => {
    mockCamera()
    decodeFrame.mockReturnValue({ getText: () => ' 1234567890123 ' })
    const wrapper = mountScanner()
    await flushPromises()

    expect(wrapper.emitted('decoded')).toEqual([[' 1234567890123 ']])
    expect(stopTrack).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('requests the rear-facing camera when available', async () => {
    mockCamera()
    const wrapper = mountScanner()
    await flushPromises()

    expect(getUserMedia).toHaveBeenCalledWith({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    })
    wrapper.unmount()
  })

  it('continues scanning when a frame contains no decodable QR code', async () => {
    mockCamera()
    let videoWidth = 0
    const wrapper = mountScanner(() => videoWidth)
    await flushPromises()

    expect(decodeFrame).not.toHaveBeenCalled()
    videoWidth = 640
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(decodeFrame.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('.verification-scanner-instructions').exists()).toBe(true)
    expect(stopTrack).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(stopTrack).toHaveBeenCalledOnce()
  })

  it('reports unexpected decoder errors and releases the camera', async () => {
    mockCamera()
    decodeFrame.mockImplementation(() => {
      throw new Error('Canvas unavailable')
    })
    const wrapper = mountScanner()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Der QR-Code konnte nicht gelesen werden.')
    expect(stopTrack).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('reports denied camera permission and leaves manual entry available to the parent', async () => {
    mockCamera()
    getUserMedia.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'))
    const wrapper = mountScanner()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Der Kamerazugriff wurde verweigert.')
    expect(wrapper.emitted('decoded')).toBeUndefined()
    wrapper.unmount()
  })

  it('reports when browser camera access is unsupported', async () => {
    vi.stubGlobal('navigator', {})
    const wrapper = mountScanner()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('wird von diesem Browser oder dieser Verbindung nicht unterstützt')
    expect(wrapper.emitted('decoded')).toBeUndefined()
    wrapper.unmount()
  })

  it('rejects an empty QR value instead of emitting it', async () => {
    mockCamera()
    decodeFrame.mockReturnValue({ getText: () => '' })
    const wrapper = mountScanner()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Der QR-Code ist leer.')
    expect(wrapper.emitted('decoded')).toBeUndefined()
    expect(stopTrack).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('stops the camera when closed or unmounted', async () => {
    mockCamera()
    const wrapper = mountScanner()
    await flushPromises()

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(stopTrack).toHaveBeenCalledOnce()

    wrapper.unmount()
    expect(stopTrack).toHaveBeenCalledOnce()
  })
})
