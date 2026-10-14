import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// The standalone test TypeScript project does not process Vue SFCs; Vitest does via the Vue Vite plugin.
// @ts-expect-error Vue SFC import
import MealReviewForm from '~/components/reviews/MealReviewForm.vue'

const { submitReviewMock } = vi.hoisted(() => ({
  submitReviewMock: vi.fn(),
}))

vi.mock('~/services/reviewsApi', () => ({
  reviewsApi: {
    submit: submitReviewMock,
  },
}))

const ReviewInputStub = defineComponent({
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('textarea', {
      class: 'comment-field',
      value: props.modelValue,
      onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
    })
  },
})

const VarButtonStub = defineComponent({
  inheritAttrs: false,
  props: { disabled: Boolean },
  emits: ['click'],
  setup(props, { attrs, emit, slots }) {
    return () => h('button', {
      ...attrs,
      disabled: props.disabled,
      onClick: () => emit('click'),
    }, slots.default?.())
  },
})

describe('MealReviewForm', () => {
  let turnstileCallback: ((token: string) => void) | null
  const turnstileRender = vi.fn((_container: string, options: { callback: (token: string) => void }) => {
    turnstileCallback = options.callback
    return 'test-widget'
  })

  const mountForm = (textReviewsEnabled: boolean | null) => mount(MealReviewForm, {
    props: {
      mealId: 101,
      canteen: 'Kantine Elbe',
      weekday: 'Montag',
      show: true,
      isMobile: false,
      textReviewsEnabled,
      isSettingsLoading: false,
    },
    global: {
      stubs: {
        'var-input': ReviewInputStub,
        'var-button': VarButtonStub,
        LoadingSpinner: true,
      },
    },
    attachTo: document.body,
  })

  const chooseFiveStarsAndCompleteCaptcha = async (wrapper: ReturnType<typeof mountForm>) => {
    await wrapper.findAll('.star-btn')[4]!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 75))
    expect(turnstileRender).toHaveBeenCalledOnce()
    turnstileCallback?.('captcha-token')
    await flushPromises()
  }

  beforeEach(() => {
    turnstileCallback = null
    submitReviewMock.mockResolvedValue({ success: true })
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { turnstileSiteKey: 'test-site-key' } }))
    vi.stubGlobal('useTrackEvent', vi.fn())
    Object.defineProperty(window, 'turnstile', {
      configurable: true,
      value: {
        render: turnstileRender,
        remove: vi.fn(),
        reset: vi.fn(),
      },
    })
  })

  afterEach(() => {
    delete (window as Window & { turnstile?: unknown }).turnstile
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    turnstileRender.mockClear()
  })

  it('submits a star-only review without requiring or sending a comment', async () => {
    const wrapper = mountForm(false)
    await chooseFiveStarsAndCompleteCaptcha(wrapper)

    expect(wrapper.find('.comment-field').exists()).toBe(false)
    await wrapper.find('.submit-review-btn').trigger('click')

    expect(submitReviewMock).toHaveBeenCalledWith(101, {
      star: 5,
      turnstileToken: 'captcha-token',
    })
    wrapper.unmount()
  })

  it('requires and submits a comment when text reviews are enabled', async () => {
    const wrapper = mountForm(true)
    await chooseFiveStarsAndCompleteCaptcha(wrapper)

    const submitButton = wrapper.find('.submit-review-btn')
    expect(wrapper.find('.comment-field').exists()).toBe(true)
    expect((submitButton.element as HTMLButtonElement).disabled).toBe(true)

    await wrapper.find('.comment-field').setValue('Sehr lecker!')
    expect((submitButton.element as HTMLButtonElement).disabled).toBe(false)
    await submitButton.trigger('click')

    expect(submitReviewMock).toHaveBeenCalledWith(101, {
      star: 5,
      comment: 'Sehr lecker!',
      turnstileToken: 'captcha-token',
    })
    wrapper.unmount()
  })

  it('hides an entered comment and switches to star-only submission when the mode changes', async () => {
    const wrapper = mountForm(true)
    await chooseFiveStarsAndCompleteCaptcha(wrapper)
    await wrapper.find('.comment-field').setValue('Draft comment')

    await wrapper.setProps({ textReviewsEnabled: false })
    await flushPromises()

    expect(wrapper.find('.comment-field').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Draft comment')
    await wrapper.find('.submit-review-btn').trigger('click')

    expect(submitReviewMock).toHaveBeenCalledWith(101, {
      star: 5,
      turnstileToken: 'captcha-token',
    })
    wrapper.unmount()
  })
})
