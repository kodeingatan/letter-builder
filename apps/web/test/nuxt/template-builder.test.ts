import { describe, it, expect, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia, getActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { NMessageProvider } from 'naive-ui'
import { useBuilderStore } from '~/stores/builder'
import TemplateCanvas from '~/components/features/persuratan/TemplateCanvas.vue'
import PropertyPanel from '~/components/features/persuratan/PropertyPanel.vue'
import RepeaterEditor from '~/components/features/persuratan/RepeaterEditor.vue'
import ConditionEditor from '~/components/features/persuratan/ConditionEditor.vue'

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

/**
 * Bind the test to the mounted app's Pinia (@pinia/nuxt instance), otherwise
 * `useBuilderStore()` in the test and in the component use different stores.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useAppStore(wrapper: any) {
  const pinia = wrapper.vm.$.appContext.config.globalProperties.$pinia ?? getActivePinia()
  setActivePinia(pinia)
  return useBuilderStore()
}

afterEach(() => {
  document.body.innerHTML = ''
})

const DEMO_NODES = [
  { type: 'heading', props: { content: 'SK {{letter.number}}', level: 1 } },
  {
    type: 'repeater', props: { source: 'employees', item: 'item' },
    children: [{ type: 'text', props: { content: '{{item.nama}}' } }],
  },
  {
    type: 'condition', props: { field: '{{letter.type}}', operator: 'eq', value: 'internal' },
    children: [{ type: 'text', props: { content: 'Internal' } }],
    elseChildren: [],
  },
]

describe('builder store — blocks/selection/mutations (NT-01)', () => {
  it('loads, adds, moves, updates, removes blocks', async () => {
    setActivePinia(createPinia())
    const builder = useBuilderStore()
    builder.load(JSON.parse(JSON.stringify(DEMO_NODES)))
    expect(builder.blocks.length).toBe(3)
    const id = builder.add({ type: 'divider' })
    expect(builder.blocks.length).toBe(4)
    builder.move(id, -1)
    expect(builder.blocks[2].id).toBe(id)
    builder.update(id, { type: 'pagebreak' })
    expect(builder.blocks[2].node.type).toBe('pagebreak')
    builder.remove(id)
    expect(builder.blocks.length).toBe(3)
    expect(builder.toNodes().length).toBe(3)
  })
})

describe('TemplateCanvas — block list + a11y reorder (NT-01, Step 3)', () => {
  it('renders blocks with type labels and controls', async () => {
    const wrapper = await mountWithProvider(TemplateCanvas as never)
    useAppStore(wrapper).load(JSON.parse(JSON.stringify(DEMO_NODES)))
    await wrapper.vm.$nextTick()
    const text = wrapper.text()
    expect(text).toContain('heading')
    expect(text).toContain('repeater')
    expect(text).toContain('condition')
    expect(text).toContain('SK {{letter.number}}')
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(9) // 3 blocks × 3 controls
  })

  it('shows empty state when no blocks (ALT canvas kosong)', async () => {
    const wrapper = await mountWithProvider(TemplateCanvas as never)
    useAppStore(wrapper).reset()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Kanvas kosong')
  })
})

describe('PropertyPanel — live editing (NT-01)', () => {
  it('shows empty hint without selection', async () => {
    const wrapper = await mountWithProvider(PropertyPanel as never)
    useAppStore(wrapper).reset()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Pilih blok')
  })

  it('edits repeater props via RepeaterEditor', async () => {
    const wrapper = await mountWithProvider(PropertyPanel as never)
    const builder = useAppStore(wrapper)
    builder.load(JSON.parse(JSON.stringify(DEMO_NODES)))
    builder.select(builder.blocks[1].id)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Source')
    expect(wrapper.text()).toContain('Item var')
  })

  it('edits condition operator', async () => {
    const wrapper = await mountWithProvider(ConditionEditor as never, {
      node: DEMO_NODES[2],
    })
    expect(wrapper.text()).toContain('Operator')
    expect(wrapper.text()).toContain('Field')
  })

  it('repeater editor shows master picker', async () => {
    const wrapper = await mountWithProvider(RepeaterEditor as never, {
      node: DEMO_NODES[1],
    })
    expect(wrapper.text()).toContain('Sumber Master Data')
    expect(wrapper.text()).toContain('Pilih semua')
  })
})
