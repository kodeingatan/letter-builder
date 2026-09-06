import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DocumentPreview from '~/components/features/documents/DocumentPreview.vue'

describe('DocumentPreview', () => {
  it('shows a skeleton while rendering', async () => {
    const wrapper = await mountSuspended(DocumentPreview, {
      props: { loading: true },
    })
    expect(wrapper.find('.n-skeleton').exists()).toBe(true)
  })

  it('renders html in a sandboxed iframe', async () => {
    const wrapper = await mountSuspended(DocumentPreview, {
      props: { html: '<p>Hello</p>', warnings: [] },
    })
    const frame = wrapper.find('iframe')
    expect(frame.exists()).toBe(true)
    expect(frame.attributes('sandbox')).toBeDefined()
    expect(frame.attributes('srcdoc')).toContain('Hello')
  })

  it('lists warning codes in a collapsible alert', async () => {
    const wrapper = await mountSuspended(DocumentPreview, {
      props: {
        html: '<p>Hi</p>',
        warnings: [{ code: 'MISSING_DATA', nodeId: 'c1', message: 'Missing value for "nama"' }],
      },
    })
    expect(wrapper.text()).toContain('1 warning(s)')
    await wrapper.find('.n-collapse-item__header').trigger('click')
    expect(wrapper.text()).toContain('MISSING_DATA')
  })

  it('shows an error alert with retry', async () => {
    const wrapper = await mountSuspended(DocumentPreview, {
      props: { error: 'Render timed out' },
    })
    expect(wrapper.text()).toContain('Render timed out')
    await wrapper.find('.preview-retry').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  it('shows the empty notice when there is no output', async () => {
    const wrapper = await mountSuspended(DocumentPreview, {
      props: { emptyNotice: 'Fill the form to preview' },
    })
    expect(wrapper.text()).toContain('Fill the form to preview')
  })
})
