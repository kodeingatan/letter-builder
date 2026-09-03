import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FormField from '~/components/common/FormField/FormField.vue'

describe('FormField', () => {
  it('renders label text', async () => {
    const wrapper = await mountSuspended(FormField, {
      props: { label: 'Email', path: 'email' },
    })
    expect(wrapper.text()).toContain('Email')
  })

  it('shows required asterisk when required prop is true', async () => {
    const wrapper = await mountSuspended(FormField, {
      props: { label: 'Password', path: 'password', required: true },
    })
    expect(wrapper.text()).toContain('*')
  })

  it('does not show required asterisk by default', async () => {
    const wrapper = await mountSuspended(FormField, {
      props: { label: 'Name', path: 'name' },
    })
    expect(wrapper.text()).not.toContain('*')
  })

  it('renders slot content', async () => {
    const wrapper = await mountSuspended(FormField, {
      props: { label: 'Email', path: 'email' },
      slots: { default: '<input type="email" />' },
    })
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('shows error message when error prop is provided', async () => {
    const wrapper = await mountSuspended(FormField, {
      props: { label: 'Email', path: 'email', error: 'Email is required' },
    })
    expect(wrapper.text()).toContain('Email is required')
  })

  it('does not show error message by default', async () => {
    const wrapper = await mountSuspended(FormField, {
      props: { label: 'Email', path: 'email' },
    })
    expect(wrapper.find('p').exists()).toBe(false)
  })
})
