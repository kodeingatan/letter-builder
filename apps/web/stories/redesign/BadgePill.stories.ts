import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NSpace } from 'naive-ui'
import BadgePill from '~/components/common/BadgePill/BadgePill.vue'

const meta: Meta<typeof BadgePill> = {
  title: 'Redesign/BadgePill',
  component: BadgePill,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Badge Pill eyebrow 12/600 full — kategori primer, semantic status, category dot sticker. AC-D02.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const SemuaVarian: Story = {
  render: () => ({
    components: { BadgePill, NSpace },
    template: `
      <NSpace>
        <BadgePill label="Super Admin" type="primary" />
        <BadgePill label="INFO" type="success" />
        <BadgePill label="WARNING" type="warning" />
        <BadgePill label="ERROR" type="error" />
        <BadgePill label="Arsip" type="default" />
        <BadgePill label="Persuratan" type="default" dot="#ff64c8" />
        <BadgePill label="Kepegawaian" type="default" dot="#2a9d99" />
      </NSpace>
    `,
  }),
}

export const KategoriPrimer: Story = {
  args: { label: 'Super Admin', type: 'primary' },
}
