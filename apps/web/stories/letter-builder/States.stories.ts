import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NAlert, NEmpty, NSpin, NButton, NCard, NTag } from 'naive-ui'
import { withProviders } from './withProviders'

const meta: Meta = {
  title: 'LetterBuilder/States',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Semua States Letter Builder — loading (NSpin/NSkeleton), empty (NEmpty+CTA pill #0075de), error (NAlert+Coba lagi), success (useMessage), validation (NFormItem), 403 single data-testid=access-denied, 409 conflict ReferenceList, draft banner, invalid binding. Token Notion, a11y.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  render: () => withProviders(h(NSpin, { show: true, description: 'Memuat data...' }, { default: () => h('div', { style: 'height:120px;border:1px dashed #e6e6e6;border-radius:12px' }) })),
}

export const Empty: Story = {
  render: () =>
    withProviders(
      h('div', { style: 'padding:32px;text-align:center;background:#f6f5f4;border-radius:16px' }, [
        h(NEmpty, { description: 'Belum ada data Pegawai' } as never),
        h('div', { class: 'mt-4' }, [h(NButton, { type: 'primary', round: true }, { default: () => '+ Tambah Data Pertama' })]),
      ]),
    ),
}

export const Error: Story = {
  render: () =>
    withProviders(
      h('div', { class: 'space-y-3 max-w-xl' }, [
        h(NAlert, { type: 'error', title: 'Gagal memuat data', closable: true }, { default: () => h('div', null, ['Terjadi kesalahan — ', h(NButton, { size: 'small', type: 'error', text: true }, { default: () => 'Coba lagi' })]) }),
      ]),
    ),
}

export const Success: Story = {
  render: () => withProviders(h(NAlert, { type: 'success', title: 'Berhasil' }, { default: () => 'Tabel "Pegawai" dibuat (mst_pegawai) — toast useMessage Berhasil' })),
}

export const Validation: Story = {
  render: () =>
    withProviders(
      h('div', { class: 'space-y-3 max-w-xl' }, [
        h(NCard, { size: 'small', title: 'NFormItem validation' }, {
          default: () =>
            h('div', { class: 'space-y-2 text-sm' }, [
              h('div', { style: 'color:#EF4444' }, 'Nama internal — Format [a-z][a-z0-9_], blacklist users/mst_*'),
              h('div', { style: 'color:#EF4444' }, 'Kolom is_looping — wajib item.* (BR-003)'),
              h('div', { style: 'color:#D97706' }, 'Operasi div-by-zero → null + warning'),
            ]),
        }),
        h(NAlert, { type: 'error' }, { default: () => '3 field belum valid — fokus ke first error' }),
      ]),
    ),
}

export const PermissionDenied: Story = {
  parameters: { docs: { description: { story: '403 — AccessDeniedAlert single Teleport top16 right16 max448 data-testid=access-denied (BR-003, 1 event→1 feedback).' } } },
  render: () =>
    withProviders(
      h('div', { 'data-testid': 'access-denied', style: 'max-width:448px;margin-left:auto;border:1px solid #FECACA;background:#FEF2F2;border-radius:8px;padding:12px' }, [
        h('div', { class: 'flex gap-2' }, [
          h('span', null, '🔒'),
          h('div', null, [h('div', { class: 'font-semibold', style: 'color:#DC2626' }, 'Akses Ditolak'), h('div', { class: 'text-sm' }, 'Anda tidak memiliki izin untuk melakukan aksi ini')]),
        ]),
      ]),
    ),
}

export const Conflict409: Story = {
  render: () =>
    withProviders(
      h('div', { class: 'space-y-3 max-w-xl' }, [
        h(NAlert, { type: 'warning', title: 'Tidak dapat menghapus — masih dipakai (409)' }, { default: () => 'Master "Pegawai" dipakai relation/template' }),
        h(NCard, { size: 'small' }, {
          default: () =>
            h('ul', { class: 'text-sm list-disc pl-5 space-y-1' }, [
              h('li', null, ['Template SK Pengangkatan — ', h(NTag, { size: 'small' }, { default: () => 'Lihat' })]),
              h('li', null, ['Administrasi SK step 1 — ', h(NTag, { size: 'small' }, { default: () => 'Lihat' })]),
            ]),
        }),
      ]),
    ),
}

export const DraftBanner: Story = {
  render: () => withProviders(h(NAlert, { type: 'info', title: 'Draft tersimpan otomatis' }, { default: () => 'Lanjutkan? (localStorage:letter-builder:draft:sk-pengangkatan)' })),
}

export const InvalidBinding: Story = {
  render: () =>
    withProviders(
      h('div', { class: 'space-y-3 max-w-xl' }, [
        h('div', { class: 'p-3 rounded border', style: 'border-color:#EF4444;background:#FEF2F2' }, [
          h('span', { class: 'inline-flex px-2 py-1 rounded-full text-xs', style: 'background:#FEE2E2;color:#DC2626;border:1px solid #FECACA' }, 'Invalid: pegawai.nama (kolom terhapus)'),
          h('span', { class: 'ml-2 text-xs', style: 'color:#DC2626' }, 'Pilih ulang'),
        ]),
        h(NAlert, { type: 'error' }, { default: () => 'Badge merah di canvas + Properties NAlert — pilih ulang mapping (EC-04).' }),
      ]),
    ),
}
