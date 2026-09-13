import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NAlert } from 'naive-ui'
import AdminWizard from '../../app/components/features/persuratan/AdminWizard.vue'
import { withProviders } from './withProviders'

const meta: Meta<typeof AdminWizard> = {
  title: 'LetterBuilder/AdminWizard',
  component: AdminWizard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Administrasi Wizard — NSteps vertical guided (Data → Step Tambahan → Render), per-step NForm + validation, + Tambah Step N append mapping independen, review gabungan concatenation + pagebreak + PDF gabungan. Mobile NSteps condensed 44px hit. Covers Step 13-15, FR-012/013, BR-004/005, AC-D03.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockAdmin = {
  id: 1,
  name: 'SK Pengangkatan',
  slug: 'sk-pengangkatan',
  steps: [
    { template_id: 1, step_order: 1, mapping: { 'pegawai.nama': { kind: 'master_data', ref: 'pegawai.nama' } } },
  ],
} as never

export const Default: Story = {
  args: { administration: mockAdmin },
  render: (args) => withProviders(h(AdminWizard, { administration: (args as never).administration } as never)),
}

export const EmptyAdministration: Story = {
  parameters: { docs: { description: { story: 'ALT: Pilih administrasi dahulu → NAlert warning.' } } },
  args: { administration: null },
  render: (args) => withProviders(h(AdminWizard, { administration: (args as never).administration } as never)),
}

export const PdfError: Story = {
  parameters: { docs: { description: { story: 'ERR-09/ERR-03: PDF gagal (Chrome absen/timeout 30s) → NAlert warning “PDF gagal” + Coba lagi tanpa hapus draft (draft DRAFT tetap).' } } },
  render: () =>
    withProviders(
      h('div', { class: 'space-y-3 max-w-2xl' }, [
        h(AdminWizard, { administration: mockAdmin } as never),
        h(NAlert, { type: 'warning', title: 'PDF gagal (mock)' }, { default: () => 'PDF gagal: Failed to generate PDF — draft tersimpan, ulangi render untuk retry (ERR-03).' }),
      ]),
    ),
}

export const Validation: Story = {
  parameters: { docs: { description: { story: 'Validation per-step: required kosong → NFormItem feedback + Lanjut disabled (BR-002).' } } },
  render: () =>
    withProviders(
      h('div', { class: 'space-y-3 max-w-2xl' }, [
        h(AdminWizard, { administration: mockAdmin } as never),
        h(NAlert, { type: 'error' }, { default: () => 'Requirement belum terisi — Publish/Render diblokir, sorot field (ERR-01).' }),
      ]),
    ),
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  args: { administration: mockAdmin },
  render: (args) => withProviders(h(AdminWizard, { administration: (args as never).administration } as never)),
}
