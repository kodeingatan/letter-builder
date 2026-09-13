import { h } from 'vue'
import { createPinia } from 'pinia'
import { NMessageProvider } from 'naive-ui'
import { setup } from '@storybook/vue3-vite'

/** Shared providers for template-admin stories (Task 07). */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
setup((app: any) => {
  app.use(createPinia())
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withMessageProvider = (node: any) => h(NMessageProvider, null, { default: () => node })

export const DEMO_BLOCKS = [
  { type: 'heading', props: { content: 'SURAT KEPUTUSAN {{letter.number}}', level: 1 } },
  { type: 'repeater', props: { source: 'employees', item: 'item' }, children: [{ type: 'text', props: { content: '{{item.nama}}' } }] },
  { type: 'condition', props: { field: '{{letter.type}}', operator: 'eq', value: 'internal' }, children: [{ type: 'text', props: { content: 'Internal' } }], elseChildren: [] },
  { type: 'component-ref', props: { componentId: 'Kop Surat', propsOverride: {} } },
  { type: 'signature', props: { name: '{{signer.name}}', title: 'Kepala Dinas', city: 'Banda Aceh' } },
]
