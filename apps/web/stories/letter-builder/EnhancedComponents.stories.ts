import { h, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NAlert } from 'naive-ui'
import ReferenceList from '../../app/components/features/letter-builder/ReferenceList.vue'
import LoopingPicker from '../../app/components/features/letter-builder/LoopingPicker.vue'
import IDRInput from '../../app/components/features/letter-builder/IDRInput.vue'
import { withProviders } from './withProviders'

const meta: Meta = {
  title: 'LetterBuilder/EnhancedComponents',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Enhanced library components — ReferenceList 409, LoopingPicker pilih semua, IDRInput number+IDR realtime. Library relevan: Naive UI NTag/NCheckbox/NSelect + Tailwind + @vicons/carbon. Covers FR-005/006, BR-003, ERR-03/05.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const ReferenceConflict: Story = {
  render: () =>
    withProviders(
      h(ReferenceList, {
        references: [
          { type: 'template', name: 'Template SK Pengangkatan', slug: 'sk', href: '/dashboard/templates/1' },
          { type: 'administration', name: 'Administrasi SK', slug: 'sk-admin', href: '/dashboard/administrations/1' },
        ],
      } as never),
    ),
}

export const Looping: Story = {
  render: () => {
    const model = ref({ table: 'pegawai', selected: ['nama', 'nip'] })
    return withProviders(
      h(LoopingPicker, {
        tables: [
          { label: 'Pegawai (mst_pegawai)', value: 'pegawai' },
          { label: 'Jabatan (mst_jabatan)', value: 'jabatan' },
        ],
        columns: [
          { label: 'Nama', value: 'nama' },
          { label: 'NIP', value: 'nip' },
          { label: 'Gaji', value: 'gaji' },
          { label: 'Jabatan', value: 'jabatan_id' },
        ],
        modelValue: model.value,
        'onUpdate:modelValue': (v: unknown) => (model.value = v as typeof model.value),
      } as never),
    )
  },
}

export const IDR: Story = {
  render: () => {
    const val = ref<number | null>(2500000)
    return withProviders(
      h('div', { class: 'max-w-sm space-y-3' }, [
        h(IDRInput, { modelValue: val.value, 'onUpdate:modelValue': (v: number | null) => (val.value = v) } as never),
        h(NAlert, { type: 'info', title: 'IDR realtime' }, { default: () => `Value: ${val.value ?? 'null'} — format IDR via Intl.NumberFormat id-ID` }),
      ]),
    )
  },
}

export const Combined: Story = {
  render: () => withProviders(h('div', { class: 'space-y-4' }, [h(ReferenceList, { references: [{ type: 'template', name: 'Kop Surat', slug: 'kop', href: '#kop' }] } as never), h(NAlert, { type: 'success' }, { default: () => 'Library relevan: Tiptap v2 + Naive UI NSteps/NTree/NDynamicInput/NUpload + Tailwind v4 — semua direct import, token Notion.' })])),
}
