import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LoginPage from '~/pages/login.vue'

const meta: Meta<typeof LoginPage> = {
  title: 'Pages/LoginPage',
  component: LoginPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Login page with email and password form. Uses Naive UI components.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
