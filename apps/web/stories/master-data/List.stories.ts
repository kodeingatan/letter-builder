import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MasterTableDataTable from '../../app/components/features/master-data/MasterTableDataTable.vue'
import MasterTableForm from '../../app/components/features/master-data/MasterTableForm.vue'
import RelationPickerModal from '../../app/components/features/master-data/RelationPickerModal.vue'
import { withMessageProvider } from './withProviders'

const meta: Meta = {
  title: 'MasterData/List',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Master Data — daftar definisi tabel (DataTable + toolbar + empty CTA). Data demo via $fetch stub di withProviders.ts.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => withMessageProvider(h(MasterTableDataTable)),
}

export const BuilderForm: Story = {
  render: () => withMessageProvider(h(MasterTableForm, { mode: 'create' })),
}

export const RelationPicker: Story = {
  render: () => withMessageProvider(h(RelationPickerModal, {
    visible: true,
    targetSlug: 'jabatan',
    multiple: false,
    selected: [],
    'onUpdate:visible': () => {},
  })),
}
