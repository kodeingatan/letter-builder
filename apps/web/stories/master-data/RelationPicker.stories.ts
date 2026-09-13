import { h, ref } from 'vue'
import { NButton } from 'naive-ui'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import RelationPickerModal from '../../app/components/features/master-data/RelationPickerModal.vue'
import { withMessageProvider } from './withProviders'

const meta: Meta = {
  title: 'MasterData/RelationPicker',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Relation picker — modal tabel relasi + search + sort + checkbox (1/N). Pilih lalu konfirmasi.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

function pickerDemo(multiple: boolean) {
  return {
    setup() {
      const visible = ref(true)
      const selected = ref<number[]>([])
      return () => withMessageProvider([
        h(NButton, { onClick: () => { visible.value = true } }, () => 'Buka Picker'),
        h(RelationPickerModal, {
          visible: visible.value,
          targetSlug: 'jabatan',
          multiple,
          selected: selected.value,
          'onUpdate:visible': (v: boolean) => { visible.value = v },
          onConfirm: (ids: number[]) => { selected.value = ids },
        }),
        h('p', { style: 'margin-top:8px' }, `Terpilih: ${selected.value.join(', ') || '—'}`),
      ])
    },
  }
}

export const Single: Story = {
  render: () => pickerDemo(false),
}

export const Multiple: Story = {
  render: () => pickerDemo(true),
}
