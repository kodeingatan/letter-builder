import type { Meta, StoryObj } from '@storybook/vue3-vite'
import EmptyStateCard from '~/components/common/EmptyStateCard/EmptyStateCard.vue'

const meta: Meta<typeof EmptyStateCard> = {
  title: 'Redesign/EmptyStateCard',
  component: EmptyStateCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Empty-State Card — frame #f6f5f4 xl16, ilustrasi sticker inline SVG, caption + CTA (no dead-end). ALT-01.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { title: 'Belum ada data' },
}

export const DenganCTA: Story = {
  args: {
    title: 'Belum ada user',
    description: 'Tambahkan user pertama untuk mulai mengelola akses.',
    ctaLabel: '+ Buat User',
  },
}
