import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import BindingPopup from '../../app/components/features/persuratan/BindingPopup.vue'
import RepeaterEditor from '../../app/components/features/persuratan/RepeaterEditor.vue'
import ConditionEditor from '../../app/components/features/persuratan/ConditionEditor.vue'
import { withMessageProvider, DEMO_BLOCKS } from './withProviders'

const meta: Meta = {
  title: 'TemplateAdmin/Component',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Component editor parts — BindingPopup (right-click 3 views) + Repeater/Condition editors. Tiptap canvas hanya di browser (ClientOnly).',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const BindingPopupDemo: Story = {
  render: () => withMessageProvider(h(BindingPopup, {
    visible: true,
    'onUpdate:visible': () => {},
    onConfirm: () => {},
  })),
}

export const RepeaterEditorDemo: Story = {
  render: () => withMessageProvider(h(RepeaterEditor, {
    node: DEMO_BLOCKS[1],
    onPatch: () => {},
  })),
}

export const ConditionEditorDemo: Story = {
  render: () => withMessageProvider(h(ConditionEditor, {
    node: DEMO_BLOCKS[2],
    onPatch: () => {},
  })),
}
