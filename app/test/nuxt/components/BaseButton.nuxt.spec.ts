import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseButton from '~/components/base/Button/Button.vue'

describe('BaseButton', () => {
  it('renders slot content', async () => {
    const wrapper = await mountSuspended(BaseButton, {
      slots: { default: 'Click me' },
    })
    expect(wrapper.text()).toContain('Click me')
  })

  it('applies primary variant by default', async () => {
    const wrapper = await mountSuspended(BaseButton, {
      slots: { default: 'Submit' },
    })
    expect(wrapper.find('.primary').exists()).toBe(true)
  })

  it('applies secondary variant when specified', async () => {
    const wrapper = await mountSuspended(BaseButton, {
      props: { variant: 'secondary' },
      slots: { default: 'Cancel' },
    })
    expect(wrapper.find('.secondary').exists()).toBe(true)
  })

  it('disables button when disabled prop is true', async () => {
    const wrapper = await mountSuspended(BaseButton, {
      props: { disabled: true },
      slots: { default: 'Disabled' },
    })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })
})
