import { h, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NAlert, NButton } from 'naive-ui'
import RelationPickerModal from '../../app/components/features/master-data/RelationPickerModal.vue'
import { withProviders } from './withProviders'

const meta: Meta = {
  title: 'LetterBuilder/RelationPicker',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Relation Picker Modal — NModal 800px + NDataTable relasi + search debounce 300ms + sort ArrowUp/Down 14px primary + checkbox single (radio) vs multiple N + pagination Menampilkan. Covers Step 6, FR-005, AC-D03/D07.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  render: () =>
    withProviders(
      h(RelationPickerModal, {
        visible: true,
        targetSlug: 'jabatan',
        multiple: false,
        selected: [],
        'onUpdate:visible': () => {},
      }),
    ),
}

export const Multiple: Story = {
  parameters: { docs: { description: { story: 'Multiple: checkbox N + header pilih semua (indeterminate).' } } },
  render: () =>
    withProviders(
      h(RelationPickerModal, {
        visible: true,
        targetSlug: 'jabatan',
        multiple: true,
        selected: [1, 2],
        'onUpdate:visible': () => {},
      }),
    ),
}

export const Empty: Story = {
  parameters: { docs: { description: { story: 'Empty di modal: NEmpty + Atur ulang tanpa tutup modal (ALT-04).' } } },
  render: () => {
    const visible = ref(true)
    return withProviders(
      h('div', null, [
        h(RelationPickerModal, {
          visible: visible.value,
          targetSlug: 'jabatan',
          multiple: false,
          selected: [],
          'onUpdate:visible': (v: boolean) => (visible.value = v),
        }),
        h('div', { class: 'p-4 text-xs', style: 'color:#615d59' }, 'ALT-04: 0 baris relasi → NEmpty + CTA Atur ulang (emit refresh)'),
      ]),
    )
  },
}

export const Conflict409: Story = {
  parameters: { docs: { description: { story: '409: tabel dipakai relation/template → ReferenceList modal (ERR-05) — lihat domain-api-ui States.' } } },
  render: () =>
    withProviders(
      h('div', { class: 'p-6 space-y-3 max-w-xl' }, [
        h(NAlert, { type: 'warning', title: 'Tidak dapat menghapus — masih dipakai' }, { default: () => 'Master "Pegawai" dipakai oleh Template SK (409)' }),
        h('ul', { class: 'text-sm list-disc pl-5' }, [
          h('li', null, 'Template SK Pengangkatan → Pegawai (Lihat)'),
          h('li', null, 'Administrasi SK step 1 → Pegawai (Lihat)'),
        ]),
        h(NButton, { type: 'warning' }, { default: () => 'Lihat Referensi' }),
      ]),
    ),
}
