import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { h } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { Add } from '@vicons/carbon'
import PageShellDemo from './PageShellDemo.vue'

const meta: Meta<typeof PageShellDemo> = {
  title: 'Foundation/PageShell',
  component: PageShellDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Kanonis shell — header + breadcrumb + actions slot. Referensi: wireframes/list-shell, mockups/list-shell, AC-D01 (tanpa dead-end). Token: radius 8, Inter, primary #0075de.',
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { title: 'Global Tables' },
  render: (args) => ({
    components: { PageShellDemo, NButton, NIcon },
    setup() { return { args } },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:400px">
        <PageShellDemo v-bind="args">
          <template #actions>
            <NButton type="primary">
              <template #icon><NIcon><Add /></NIcon></template>
              Buat Global Table
            </NButton>
          </template>
          <div style="border:1px dashed #E5E7EB; border-radius:8px; padding:24px; text-align:center; color:#6B7280; font-size:13px">
            Konten halaman (mis. DataTable) di sini — PageShell hanya shell.
          </div>
        </PageShellDemo>
      </div>
    `,
  }),
}

export const WithLongTitle: Story = {
  name: 'Long title + subtitle',
  args: { title: 'Administrations — Workflow Editor dengan Langkah yang Sangat Panjang' },
  render: (args) => ({
    components: { PageShellDemo, NButton },
    setup() { return { args } },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:400px">
        <PageShellDemo v-bind="args" :breadcrumbs="[{label:'Dashboard', href:'/dashboard'}, {label:'Dokumen'}, {label:'Administrations', href:'/dashboard/docs/administrations'}, {label:'Workflow Editor'}]">
          <template #actions>
            <NButton>Simpan</NButton>
            <NButton type="primary">Publikasikan</NButton>
          </template>
          <div style="border:1px solid #E5E7EB; border-radius:8px; padding:16px; font-size:13px">Konten editor workflow — header + breadcrumb tetap.</div>
        </PageShellDemo>
      </div>
    `,
  }),
}

export const NoActions: Story = {
  name: 'Tanpa actions (read-only)',
  args: { title: 'Documents — Detail #123' },
  render: (args) => ({
    components: { PageShellDemo },
    setup() { return { args } },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:300px">
        <PageShellDemo v-bind="args" :breadcrumbs="[{label:'Dashboard', href:'/dashboard'}, {label:'Documents', href:'/dashboard/docs/documents'}, {label:'#123'}]">
          <div style="border:1px solid #E5E7EB; border-radius:8px; padding:16px; font-size:13px">Detail view — .detail-view pattern.</div>
        </PageShellDemo>
      </div>
    `,
  }),
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  args: { title: 'Global Tables' },
  render: (args) => ({
    components: { PageShellDemo, NButton, NIcon },
    setup() { return { args, Add } },
    template: `
      <div style="padding:16px; background:#F9FAFB; min-height:400px">
        <PageShellDemo v-bind="args">
          <template #actions>
            <NButton type="primary" size="small">+ Buat</NButton>
          </template>
          <div style="border:1px dashed #E5E7EB; border-radius:8px; padding:16px; text-align:center; font-size:12px; color:#6B7280">Mobile: header stack, actions di bawah breadcrumb (flex-wrap)</div>
        </PageShellDemo>
      </div>
    `,
  }),
}
