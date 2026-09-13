import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NAlert, NButton, NCard, NTag } from 'naive-ui'
import DocumentPreviewDrawer from '../../app/components/features/persuratan/DocumentPreviewDrawer.vue'
import { withProviders } from './withProviders'

const meta: Meta = {
  title: 'LetterBuilder/DocumentPreview',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Document Preview Drawer — NDrawer 600px + NTabs HTML|PDF + NScrollbar + NCode + NAlert warning (empty repeater/div-by-zero) + Unduh PDF pill CTA. Covers Step 11,15, FR-011/013, ERR-03/09.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const SAMPLE_HTML = `<div class="doc-page"><h1>SURAT KEPUTUSAN {{letter.number}}</h1><p>Nama: {{pegawai.nama}}</p><div data-repeater="pegawai"><p>{{item.nama}} — {{item.nip}}</p></div></div>`

export const Default: Story = {
  render: () =>
    withProviders(
      h('div', { class: 'p-4' }, [
        h(NCard, { title: 'Preview HTML (mock)', size: 'small' }, {
          default: () => h('div', { class: 'text-sm', innerHTML: SAMPLE_HTML }),
        }),
        h(DocumentPreviewDrawer, { visible: false, html: SAMPLE_HTML, documentId: null, 'onUpdate:visible': () => {} } as never),
        h('div', { class: 'mt-3 text-xs', style: 'color:#615d59' }, 'Drawer closed state — click “Lihat Hasil” in wizard to open 600px (NScrollbar + NTabs).'),
      ]),
    ),
}

export const WithWarning: Story = {
  parameters: { docs: { description: { story: 'Warning header: empty repeater + div-by-zero null + jumlah dipotong 500/level (BR-008, ALT-02, EC-02).' } } },
  render: () =>
    withProviders(
      h('div', { class: 'p-4 space-y-3 max-w-xl' }, [
        h(NAlert, { type: 'warning', title: 'Peringatan render' }, { default: () => 'Repeater “pegawai” kosong — <!-- empty repeater --> + div-by-zero → null (tidak Infinity) + cap 500/level dipotong.' }),
        h(NCard, { size: 'small' }, { default: () => h('div', { innerHTML: SAMPLE_HTML }) }),
      ]),
    ),
}

export const PdfError: Story = {
  parameters: { docs: { description: { story: 'ERR-09: Puppeteer gagal → NAlert error + Coba lagi retry tanpa reset data. Draft tetap DRAFT.' } } },
  render: () =>
    withProviders(
      h('div', { class: 'p-4 space-y-3 max-w-xl' }, [
        h(NAlert, { type: 'error', title: 'Gagal generate PDF' }, { default: () => 'Failed to generate PDF — Coba lagi (retry tanpa reset search/sort/page).' }),
        h(NButton, { type: 'error' }, { default: () => 'Coba lagi' }),
        h(NCard, { size: 'small' }, { default: () => h('div', { innerHTML: SAMPLE_HTML }) }),
      ]),
    ),
}

export const WithTags: Story = {
  render: () =>
    withProviders(
      h('div', { class: 'p-4 flex gap-2' }, [
        h(NTag, { type: 'success', size: 'small' }, { default: () => 'A4 portrait' }),
        h(NTag, { size: 'small' }, { default: () => 'F4 landscape' }),
        h(NTag, { size: 'small' }, { default: () => 'Letter' }),
        h(NTag, { type: 'info', size: 'small' }, { default: () => 'printBackground true' }),
      ]),
    ),
}
