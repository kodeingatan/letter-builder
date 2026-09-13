import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NAlert, NCard } from 'naive-ui'
import MasterTableForm from '../../app/components/features/master-data/MasterTableForm.vue'
import { withProviders } from './withProviders'

const meta: Meta<typeof MasterTableForm> = {
  title: 'LetterBuilder/MasterDataDefinition',
  component: MasterTableForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Master Data — Definisi Tabel: NDynamicInput kolom 13 tipe (text/date/number+IDR/relation/image/operasi) + slug live sanitize + DDL validation. Token Notion #0075de pill, canvas #f6f5f4. Covers AC-D01, AC-D02, Flow Step 1-3.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => withProviders(h(MasterTableForm, { mode: 'create' })),
}

export const Validation: Story = {
  parameters: {
    docs: {
      description: { story: 'Validation: slug blacklist users/mst_, kolom duplikat, minimal 1 kolom → inline NFormItem feedback + NAlert summary (ERR-01).' },
    },
  },
  render: () =>
    withProviders(
      h('div', { class: 'space-y-4' }, [
        h(NAlert, { type: 'error', title: 'Gagal memuat definisi' }, { default: () => 'Format [a-z][a-z0-9_], min 2 karakter — blacklist users/mst_*' }),
        h(MasterTableForm, { mode: 'create' }),
      ]),
    ),
}

export const DestructiveConfirm: Story = {
  parameters: {
    docs: { description: { story: 'Alter destruktif: hapus/rename kolom → NDialog dua langkah + backup path storage/backups/ + checkbox required (ERR-04).' } },
  },
  render: () =>
    withProviders(
      h('div', { class: 'space-y-4' }, [
        h(NCard, { size: 'small', title: 'Konfirmasi Destruktif (mock)' }, {
          default: () =>
            h('div', { class: 'text-sm space-y-2' }, [
              h('div', null, 'Menghapus kolom "jabatan_id" — Data kolom lama hilang, backup tersedia di storage/backups/master-pegawai-2026.sqlite'),
              h(NAlert, { type: 'warning' }, { default: () => '☐ Saya mengerti (required)' }),
            ]),
        }),
        h(MasterTableForm, { mode: 'create' }),
      ]),
    ),
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => withProviders(h(MasterTableForm, { mode: 'create' })),
}
