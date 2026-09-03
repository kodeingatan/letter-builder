import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { within, expect } from 'storybook/test'
import LoginPage from '~/pages/login.vue'

const meta: Meta<typeof LoginPage> = {
  title: 'Pages/LoginPage/Tests',
  component: LoginPage,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const RendersLoginForm: Story = {
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Welcome Back')).toBeInTheDocument()
    await expect(canvas.getByLabelText(/email/i)).toBeInTheDocument()
    await expect(canvas.getByLabelText(/password/i)).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  },
}

export const HasRegisterLink: Story = {
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Register')).toBeInTheDocument()
  },
}
