import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NAlert, NButton, NTag } from 'naive-ui'
import TemplateCanvas from '../../app/components/features/persuratan/TemplateCanvas.vue'
import PropertyPanel from '../../app/components/features/persuratan/PropertyPanel.vue'
import { withProviders } from './withProviders'
import { DEMO_BLOCKS } from '../template-admin/withProviders'
import { useBuilderStore } from '../../app/stores/builder'

const meta: Meta = {
  title: 'LetterBuilder/TemplateBuilder',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Template Builder 3-pane — Library NTree 260px | Canvas flex-1 warm #f6f5f4 (drag-drop HTML5 + keyboard Up/Down reorder + EmptyStateCard) | Properties 320px NForm live (useBuilderStore). Looping picker pilih semua, Repeater/Condition editors, auto-form. Covers Step 10-11, FR-008..011, AC-D03/D06.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

function loadDemo() {
  if (typeof window === 'undefined') return
  try {
    const builder = useBuilderStore()
    builder.load(JSON.parse(JSON.stringify(DEMO_BLOCKS)))
    const first = (builder.blocks as unknown as Array<{ id: string }>)[1]
    if (first) builder.select(first.id)
  } catch {
    // ignore in SSR
  }
}

export const Default: Story = {
  render: () => {
    loadDemo()
    return withProviders(h(TemplateCanvas))
  },
}

export const WithProperties: Story = {
  parameters: { docs: { description: { story: 'Canvas + PropertyPanel live (NForm label eyebrow 11px #94a3b8). Selection ring #0075de + bg #e8f2fd.' } } },
  render: () => {
    loadDemo()
    return withProviders(
      h('div', { style: 'display:grid;grid-template-columns:1fr 320px;gap:16px;padding:16px;background:#f6f5f4;min-height:520px' }, [
        h(TemplateCanvas),
        h(PropertyPanel),
      ]),
    )
  },
}

export const DragHint: Story = {
  parameters: { docs: { description: { story: 'Drag-drop HTML5 ghost 0.5 + ring primary, keyboard Up/Down reorder aria-grabbed (Interaction).' } } },
  render: () =>
    withProviders(
      h('div', { style: 'padding:16px;background:#f6f5f4' }, [
        h('div', { class: 'flex gap-2 mb-3' }, [
          h(NTag, { type: 'info', size: 'small' }, { default: () => 'draggable ghost 0.5' }),
          h(NTag, { size: 'small' }, { default: () => 'ArrowUp/Down reorder' }),
          h(NTag, { size: 'small' }, { default: () => 'Enter edit, Delete hapus' }),
        ]),
        h(TemplateCanvas),
      ]),
    ),
}

export const LoopingPilihSemua: Story = {
  parameters: { docs: { description: { story: 'Looping picker: pilih tabel mst_pegawai + header pilih semua checkbox indeterminate → repeater node source=item (FR-010). Auto-form ter-generate dari requirement (source ikut).' } } },
  render: () =>
    withProviders(
      h('div', { style: 'padding:16px;background:#f6f5f4' }, [
        h(NAlert, { type: 'info', title: 'Looping — pilih semua' }, { default: () => 'Pilih tabel mst_pegawai → header “Pilih semua” (indeterminate) → 4 kolom dipilih → repeater source=pegawai, item=item + auto-form mencakup pegawai.* + tanggal + kop' }),
        h('div', { style: 'height:12px' }),
        h(TemplateCanvas),
      ]),
    ),
}

export const TabletDrawer: Story = {
  parameters: { viewport: { defaultViewport: 'tablet' }, docs: { description: { story: 'Tablet: library → drawer 260, properties → drawer 320, canvas full-width (Responsive).' } } },
  render: () => {
    loadDemo()
    return withProviders(
      h('div', { style: 'padding:16px;background:#f6f5f4' }, [
        h('div', { class: 'mb-2 flex gap-2' }, [
          h(NButton, { size: 'small' }, { default: () => '☰ Library' }),
          h(NButton, { size: 'small' }, { default: () => '⚙ Properties' }),
        ]),
        h(TemplateCanvas),
      ]),
    )
  },
}
