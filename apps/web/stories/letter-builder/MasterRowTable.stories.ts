import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NAlert, NEmpty, NSpin } from 'naive-ui'
import MasterRowTable from '../../app/components/features/master-data/MasterRowTable.vue'
import { withProviders, DEMO_SCHEMA } from './withProviders'

const meta: Meta = {
  title: 'LetterBuilder/MasterRowTable',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Browse Hasil per tabel `mst_pegawai` — PageShell + DataTable kanonis 320/160 + Restart + Settings visibility per slug (localStorage), search searchable-only, sort orderable-only, pagination Menampilkan {from}-{to} dari {total}. Covers Step 4-5, AC-D03, BR-006.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () =>
    withProviders(
      h('div', { style: 'padding:24px;background:#f6f5f4;min-height:520px' }, [h(MasterRowTable, { slug: 'pegawai', schema: DEMO_SCHEMA } as never)]),
    ),
}

export const Loading: Story = {
  parameters: { docs: { description: { story: 'Loading: NSpin overlay + NSkeleton 3 baris (States loading).' } } },
  render: () =>
    withProviders(
      h('div', { style: 'padding:24px;background:#f6f5f4' }, [
        h(NSpin, { show: true, description: 'Memuat data...' }, { default: () => h('div', { style: 'height:200px;border:1px dashed #e6e6e6;border-radius:12px' }) }),
      ]),
    ),
}

export const Empty: Story = {
  parameters: { docs: { description: { story: 'Empty: NEmpty Belum ada data Pegawai + CTA + Buat Data Pertama (ALT-02, BR no dead-end).' } } },
  render: () =>
    withProviders(
      h('div', { style: 'padding:48px;text-align:center;background:#f6f5f4' }, [
        h(NEmpty, { description: 'Belum ada data Pegawai' } as never),
        h('div', { class: 'mt-3 text-sm', style: 'color:#615d59' }, 'BR no dead-end — empty selalu punya CTA pill #0075de'),
      ]),
    ),
}

export const ErrorWithRetry: Story = {
  parameters: { docs: { description: { story: 'Error: NAlert full-width Gagal memuat data + Coba lagi emit retry tanpa reset search/sort/page.' } } },
  render: () =>
    withProviders(
      h('div', { style: 'padding:24px;background:#f6f5f4' }, [
        h(NAlert, { type: 'error', title: 'Gagal memuat data', closable: true }, { default: () => 'Terjadi kesalahan jaringan — Coba lagi' }),
        h('div', { style: 'height:16px' }),
        h(MasterRowTable, { slug: 'pegawai', schema: DEMO_SCHEMA } as never),
      ]),
    ),
}

export const Tablet: Story = {
  parameters: { viewport: { defaultViewport: 'tablet' } },
  render: () =>
    withProviders(
      h('div', { style: 'padding:16px;background:#f6f5f4' }, [h(MasterRowTable, { slug: 'pegawai', schema: DEMO_SCHEMA } as never)]),
    ),
}
