import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MasterRowForm from '../../app/components/features/master-data/MasterRowForm.vue'
import MasterTableForm from '../../app/components/features/master-data/MasterTableForm.vue'
import { withMessageProvider } from './withProviders'

const meta: Meta = {
  title: 'MasterData/Form',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Master Data — form dinamis 13 tipe (IDR realtime, preview operasi, relation picker, upload gambar).',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const DEMO_SCHEMA = {
  slug: 'pegawai',
  display_name: 'Pegawai',
  columns: [
    { name: 'nama', display_name: 'Nama', type: 'text', config: null, is_required: true, is_orderable: true, is_searchable: true },
    { name: 'lahir', display_name: 'Tanggal Lahir', type: 'date', config: { format: 'm-d-Y' }, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'gaji', display_name: 'Gaji', type: 'number', config: { currency: true }, is_required: false, is_orderable: true, is_searchable: false },
    { name: 'status_kepegawaian', display_name: 'Status', type: 'select', config: { options: ['PNS', 'PPPK'] }, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'jabatan_id', display_name: 'Jabatan', type: 'relation_single', config: { target_slug: 'jabatan', display_column: 'nama' }, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'total_info', display_name: 'Info Total', type: 'readonly_operation_text', config: { expression: '"Total: "++gaji' }, is_required: false, is_orderable: false, is_searchable: false },
  ],
} as never

export const RowFormCreate: Story = {
  render: () => withMessageProvider(h(MasterRowForm, {
    visible: true, mode: 'create', slug: 'pegawai', schema: DEMO_SCHEMA, row: null,
    'onUpdate:visible': () => {},
  })),
}

export const RowFormValidation: Story = {
  render: () => withMessageProvider(h(MasterRowForm, {
    visible: true, mode: 'create', slug: 'pegawai', schema: DEMO_SCHEMA, row: null,
    'onUpdate:visible': () => {},
  })),
}

export const TableBuilder: Story = {
  render: () => withMessageProvider(h(MasterTableForm, { mode: 'create' })),
}
