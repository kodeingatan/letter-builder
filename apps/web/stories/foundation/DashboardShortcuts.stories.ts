import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref, h } from 'vue'
import { NCard, NButton, NIcon, NGrid, NGi, NSpace, NEmpty } from 'naive-ui'
import { DataTable as DataTableIcon, Document, Activity, Report, Settings, Grid } from '@vicons/carbon'

const Demo = {
  props: {
    role: { type: String, default: 'designer' },
  },
  setup(props: any) {
    return () => {
      const role = props.role as string
      const isDesigner = role === 'designer'
      const isOperator = role === 'operator'
      const isEmpty = role === 'empty'
      return h('div', { style: 'display:grid; gap:12px' }, [
        h('div', { style: 'border:1px solid #E5E7EB; border-radius:8px; background:#F9FAFB; padding:14px; text-align:center' }, [
          h('div', { style: 'font-weight:700; font-size:16px' }, 'Selamat Datang Kembali'),
          h('div', { style: 'font-size:12px; color:#6B7280' }, `Halo, ${isDesigner ? 'Super Admin' : isOperator ? 'Operator' : 'Tamu'}! Berikut ringkasan akun Anda.`),
        ]),
        isEmpty
          ? h('div', { style: 'border:1px dashed #E5E7EB; border-radius:8px; padding:24px; text-align:center; color:#6B7280' }, [
              h('div', { style: 'font-size:22px' }, '○'),
              h('div', { style: 'font-weight:600; color:#374151' }, 'Belum ada akses modul'),
              h('div', { style: 'font-size:12px' }, 'Hubungi administrator untuk meminta akses ke Data atau Persuratan.'),
              h('a', { href: 'mailto:admin@admin.com', style: 'display:inline-block; margin-top:10px; font-size:12px; color:#3B82F6; font-weight:600' }, 'Minta Akses'),
            ])
          : h('div', { style: 'display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:10px' }, [
              !isEmpty &&
                h(
                  NCard,
                  { title: '📂 Data', size: 'small' },
                  {
                    default: () =>
                      isDesigner
                        ? h('div', { style: 'display:flex; gap:6px; flex-wrap:wrap' }, [
                            h('span', { style: 'padding:4px 8px; border-radius:9999px; background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; font-size:11px; font-weight:600' }, '▦ Pegawai'),
                            h('span', { style: 'padding:4px 8px; border-radius:9999px; background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; font-size:11px; font-weight:600' }, '▦ Jabatan'),
                            h('span', { style: 'padding:4px 8px; border-radius:9999px; background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; font-size:11px; font-weight:600' }, '▦ Unit'),
                          ])
                        : h('div', {}, [
                            h('span', { style: 'padding:4px 8px; border-radius:9999px; background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; font-size:11px; font-weight:600' }, '▦ Pegawai'),
                            h('span', { style: 'font-size:11px; color:#9CA3AF; margin-left:6px' }, '(baca)'),
                          ]),
                  },
                ),
              h(
                NCard,
                { title: '✉ Persuratan', size: 'small' },
                {
                  default: () =>
                    isDesigner
                      ? h('div', { style: 'display:flex; gap:6px; flex-wrap:wrap' }, [
                          h('span', { style: 'padding:4px 8px; border-radius:9999px; background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; font-size:11px; font-weight:600' }, '📃 Surat Tugas'),
                          h('span', { style: 'padding:4px 8px; border-radius:9999px; background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; font-size:11px; font-weight:600' }, '📃 SK'),
                        ])
                      : h('span', { style: 'padding:6px 10px; border-radius:9999px; background:#3B82F6; color:#fff; font-size:11px; font-weight:600' }, '▶ Jalankan Surat Tugas'),
                },
              ),
              isDesigner
                ? h(
                    NCard,
                    { title: '📊 Dokumen', size: 'small' },
                    {
                      default: () =>
                        h('div', { style: 'display:flex; gap:6px; flex-wrap:wrap' }, [
                          h('span', { style: 'padding:4px 8px; border-radius:9999px; background:#F3F4F6; border:1px solid #E5E7EB; font-size:11px; font-weight:600' }, '⊞ Components'),
                          h('span', { style: 'padding:4px 8px; border-radius:9999px; background:#F3F4F6; border:1px solid #E5E7EB; font-size:11px; font-weight:600' }, '📄 Templates'),
                          h('span', { style: 'padding:4px 8px; border-radius:9999px; background:#F3F4F6; border:1px solid #E5E7EB; font-size:11px; font-weight:600' }, '☰ Administrations'),
                        ]),
                    },
                  )
                : isOperator
                  ? h(NCard, { title: '📊 Dokumen', size: 'small' }, { default: () => h('div', { style: 'font-size:12px; color:#9CA3AF' }, 'Tidak ada akses') })
                  : null,
            ]),
        h('div', { style: 'display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:4px' }, [
          h('div', { style: 'border:1px solid #E5E7EB; border-radius:8px; padding:12px; text-align:center; background:#fff' }, [h('div', { style: 'font-size:20px; font-weight:700' }, '24'), h('div', { style: 'font-size:10px; letter-spacing:.05em; text-transform:uppercase; color:#9CA3AF; font-weight:600' }, 'Total Users')]),
          h('div', { style: 'border:1px solid #E5E7EB; border-radius:8px; padding:12px; text-align:center; background:#fff' }, [h('div', { style: 'font-size:20px; font-weight:700' }, '6'), h('div', { style: 'font-size:10px; letter-spacing:.05em; text-transform:uppercase; color:#9CA3AF; font-weight:600' }, 'Roles')]),
          h('div', { style: 'border:1px solid #E5E7EB; border-radius:8px; padding:12px; text-align:center; background:#fff' }, [h('div', { style: 'font-size:20px; font-weight:700' }, '18'), h('div', { style: 'font-size:10px; letter-spacing:.05em; text-transform:uppercase; color:#9CA3AF; font-weight:600' }, 'Permissions')]),
        ]),
      ])
    }
  },
}

const meta: Meta<typeof Demo> = {
  title: 'Foundation/DashboardShortcuts',
  component: Demo as any,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Dashboard shortcuts dinamis per peran — sumber GET /api/navigation (dataEntries/persuratanEntries). 3 varian: Designer (semua), Operator (terbatas), Empty (EC-01). Responsive NGrid. Referensi AC-D04, Step 6.',
      },
    },
  },
  argTypes: {
    role: { control: 'select', options: ['designer', 'operator', 'empty'] },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Designer: Story = {
  args: { role: 'designer' },
  render: (args) => ({
    setup() { return { args } },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:420px">
        <div style="max-width:1000px; margin:0 auto">
          <Demo :role="args.role" />
          <div style="font-size:11px; color:#6B7280; margin-top:10px; border-left:2px solid #3B82F6; padding-left:8px">Sumber: <code>navigationStore.dataEntries</code> + <code>persuratanEntries</code> + statis Dokumen (jika isAdmin). Cache 30s.</div>
        </div>
      </div>
    `,
  }),
}

export const Operator: Story = {
  args: { role: 'operator' },
  render: (args) => ({
    setup() { return { args } },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:420px">
        <div style="max-width:1000px; margin:0 auto">
          <Demo :role="args.role" />
          <div style="font-size:11px; color:#6B7280; margin-top:10px; border-left:2px solid #3B82F6; padding-left:8px">Operator hanya melihat yang diizinkan via permission — Data 1 + Persuratan 1, Dokumen hidden.</div>
        </div>
      </div>
    `,
  }),
}

export const Empty: Story = {
  args: { role: 'empty' },
  render: (args) => ({
    setup() { return { args } },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:360px">
        <div style="max-width:700px; margin:0 auto">
          <Demo :role="args.role" />
          <div style="font-size:11px; color:#6B7280; margin-top:10px; border-left:2px solid #3B82F6; padding-left:8px">EC-01 — tidak dead-end; panduan minta akses.</div>
        </div>
      </div>
    `,
  }),
}

export const Responsive: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  args: { role: 'designer' },
  render: (args) => ({
    setup() { return { args } },
    template: `
      <div style="padding:16px; background:#F9FAFB; min-height:420px">
        <Demo :role="args.role" />
        <div style="font-size:11px; color:#6B7280; margin-top:8px">Mobile: shortcuts wrap, cards stack 1 col, padding 16px.</div>
      </div>
    `,
  }),
}
