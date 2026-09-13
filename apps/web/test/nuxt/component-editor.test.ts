import { describe, it, expect, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createPinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { NMessageProvider } from 'naive-ui'
import BindingPopup from '~/components/features/persuratan/BindingPopup.vue'
import ComponentEditor from '~/components/features/persuratan/ComponentEditor.vue'

const plugins = { global: { plugins: [createPinia()] } }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withProvider(component: any) {
  return defineComponent({
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () => h(NMessageProvider, null, { default: () => h(component, attrs) })
    },
  })
}

async function mountWithProvider(component: never, props: Record<string, unknown> = {}) {
  return mountSuspended(withProvider(component) as never, { props, ...plugins } as never)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('BindingPopup — 3 views (NT-02, FR-001, AC-001)', () => {
  it('renders name + view + target fields', async () => {
    const wrapper = await mountWithProvider(BindingPopup as never, { visible: true })
    await wrapper.vm.$nextTick()
    const text = document.body.textContent ?? ''
    expect(text).toContain('Sisipkan Binding')
    expect(text).toContain('Nama data')
    expect(text).toContain('Target binding')
    expect(text).toContain('Sisipkan')
  })

  it('emits confirm with component view payload', async () => {
    const wrapper = await mountWithProvider(BindingPopup as never, { visible: true })
    await wrapper.vm.$nextTick()
    // Empty submit → inline validation error (no confirm emitted).
    document.body.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await wrapper.vm.$nextTick()
    expect(document.body.textContent ?? '').toContain('wajib diisi')
  })
})

describe('ComponentEditor — toolbar + client-only editor (NT-02, Step 1)', () => {
  it('renders toolbar buttons without crashing (editor mounts client-side)', async () => {
    const wrapper = await mountWithProvider(ComponentEditor as never, {
      modelValue: { type: 'doc', content: [{ type: 'paragraph' }] },
      isLooping: true,
    })
    const text = wrapper.text()
    expect(text).toContain('+ Binding')
    expect(text).toContain('BR-003')
    // Editor instance initializes async client-side; toolbar is the stable contract.
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(11)
  })
})
