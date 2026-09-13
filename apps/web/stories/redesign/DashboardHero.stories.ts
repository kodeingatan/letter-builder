import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DashboardHero from '~/components/features/dashboard/DashboardHero.vue'

const meta: Meta<typeof DashboardHero> = {
  title: 'Redesign/DashboardHero',
  component: DashboardHero,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Hero band deep indigo #213183 — satu momen gelap, headline Display 40/700/−1px, sticker SVG dekoratif, CTA pair. AC-D01.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    eyebrow: 'Letter Builder System',
    title: 'Selamat Datang Kembali',
    subtitle: 'Kelola user, role, permission, dan guard dari satu tempat yang tenang.',
    primaryLabel: 'Kelola User',
    secondaryLabel: 'Lihat Logs',
    stats: [
      { label: 'Total Users', value: 128 },
      { label: 'Total Roles', value: 7 },
      { label: 'Permissions', value: 10 },
      { label: 'Guards', value: 8 },
    ],
  },
}

export const TanpaStatistik: Story = {
  args: {
    title: 'Halo, Admin!',
    subtitle: 'Berikut ringkasan akun Anda.',
  },
}
