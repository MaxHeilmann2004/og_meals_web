import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
// The standalone test TypeScript project does not process Vue SFCs; Vitest does via the Vue Vite plugin.
// @ts-expect-error Vue SFC import
import VerificationQrScanner from '~/components/shared/VerificationQrScanner.vue'

const { decodeFromVideoDevice, stopControls } = vi.hoisted(() => ({
  decodeFromVideoDevice: vi.fn(),
  stopControls: vi.fn(),
}))

vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: class {
    decodeFromVideoDevice = decodeFromVideoDevice
  },
}))

const mountScanner = () => mount(VerificationQrScanner, {
  global: {
    stubs: {
      'var-button': { template: '<button type="button"><slot /></button>' },
    },
  },
})

describe('VerificationQrScanner', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('emits the decoded QR text unchanged and stops the camera', async () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } })
    decodeFromVideoDevice.mockResolvedValue({ stop: stopControls })
    const wrapper = mountScanner()
    await flushPromises()

    const onDecode = decodeFromVideoDevice.mock.calls[0]?.[2] as (
      result: { getText: () => string } | undefined,
      error?: Error,
    ) => void
    onDecode({ getText: () => '1234567890123' })

    expect(wrapper.emitted('decoded')).toEqual([['1234567890123']])
    expect(stopControls).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('reports denied camera permission and leaves manual entry available to the parent', async () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } })
    decodeFromVideoDevice.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'))
    const wrapper = mountScanner()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Der Kamerazugriff wurde verweigert.')
    expect(wrapper.emitted('decoded')).toBeUndefined()
  })

  it('reports when browser camera access is unsupported', async () => {
    vi.stubGlobal('navigator', {})
    const wrapper = mountScanner()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('wird von diesem Browser oder dieser Verbindung nicht unterstützt')
    expect(wrapper.emitted('decoded')).toBeUndefined()
  })

  it('rejects an empty QR value instead of emitting it', async () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } })
    decodeFromVideoDevice.mockResolvedValue({ stop: stopControls })
    const wrapper = mountScanner()
    await flushPromises()

    const onDecode = decodeFromVideoDevice.mock.calls[0]?.[2] as (
      result: { getText: () => string } | undefined,
      error?: Error,
    ) => void
    onDecode({ getText: () => '' })
    await nextTick()

    expect(wrapper.get('[role="alert"]').text()).toContain('Der QR-Code ist leer.')
    expect(wrapper.emitted('decoded')).toBeUndefined()
    expect(stopControls).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('stops the camera when closed or unmounted', async () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } })
    decodeFromVideoDevice.mockResolvedValue({ stop: stopControls })
    const wrapper = mountScanner()
    await flushPromises()

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(stopControls).toHaveBeenCalledOnce()

    wrapper.unmount()
    expect(stopControls).toHaveBeenCalledOnce()
  })
})
