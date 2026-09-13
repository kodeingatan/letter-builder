import { h } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AdminWizard from '../../app/components/features/persuratan/AdminWizard.vue'
import DocumentPreviewDrawer from '../../app/components/features/persuratan/DocumentPreviewDrawer.vue'
import { withMessageProvider } from './withProviders'

const meta: Meta = {
  title: 'TemplateAdmin/Wizard',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Administration wizard — data step.field + tambah step-N + render gabungan + drawer preview 600px.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const DEMO_ADMIN = {
  id: 1,
  name: 'SK Pengangkatan Demo',
  slug: 'sk-pengangkatan-demo',
  description: 'Demo wizard',
  steps: [],
  createdAt: '',
  updatedAt: '',
} as never

export const WizardEmpty: Story = {
  render: () => withMessageProvider(h(AdminWizard, { administration: DEMO_ADMIN })),
}

export const WizardNoAdmin: Story = {
  render: () => withMessageProvider(h(AdminWizard, { administration: null })),
}

export const PreviewDrawer: Story = {
  render: () => withMessageProvider(h(DocumentPreviewDrawer, {
    visible: true,
    html: '<div class="doc-page"><h1>SK 800/001</h1><p>Afdal (199xxx)</p></div>',
    documentId: 1,
    'onUpdate:visible': () => {},
  })),
}
