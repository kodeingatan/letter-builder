import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useBuilderStore } from '../../app/stores/builder'
import TemplateCanvas from '../../app/components/features/persuratan/TemplateCanvas.vue'
import PropertyPanel from '../../app/components/features/persuratan/PropertyPanel.vue'
import { withMessageProvider, DEMO_BLOCKS } from './withProviders'

const meta: Meta = {
  title: 'TemplateAdmin/Builder',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Template builder 3-pane — kanvas blok (drag-drop + reorder) + panel properti live.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

function loadDemo() {
  const builder = useBuilderStore()
  builder.load(JSON.parse(JSON.stringify(DEMO_BLOCKS)))
  const first = builder.blocks[1]
  if (first) builder.select(first.id)
}

export const Canvas: Story = {
  render: () => {
    loadDemo()
    return withMessageProvider(h('div', { style: 'max-width:520px' }, [h(TemplateCanvas)]))
  },
}

export const CanvasWithProperties: Story = {
  render: () => {
    loadDemo()
    return withMessageProvider(h('div', { style: 'display:grid;grid-template-columns:1fr 320px;gap:16px' }, [
      h(TemplateCanvas),
      h(PropertyPanel),
    ]))
  },
}
