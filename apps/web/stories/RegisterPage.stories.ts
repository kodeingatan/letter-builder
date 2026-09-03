import type { Meta, StoryObj } from '@storybook/vue3-vite'
import RegisterPage from '~/pages/register.vue'

const meta: Meta<typeof RegisterPage> = {
  title: 'Pages/RegisterPage',
  component: RegisterPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Registration page with first name, last name, username, email, password, and confirm password fields.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
