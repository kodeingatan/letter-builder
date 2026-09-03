import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { within, expect, userEvent } from 'storybook/test'
import RegisterPage from '~/pages/register.vue'

const meta: Meta<typeof RegisterPage> = {
  title: 'Pages/RegisterPage/Tests',
  component: RegisterPage,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const RendersRegisterForm: Story = {
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Create Account')).toBeInTheDocument()
    await expect(canvas.getByLabelText(/first name/i)).toBeInTheDocument()
    await expect(canvas.getByLabelText(/last name/i)).toBeInTheDocument()
    await expect(canvas.getByLabelText(/username/i)).toBeInTheDocument()
    await expect(canvas.getByLabelText(/email/i)).toBeInTheDocument()
    await expect(canvas.getByLabelText(/password/i)).toBeInTheDocument()
    await expect(canvas.getByLabelText(/confirm password/i)).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  },
}

export const HasLoginLink: Story = {
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Sign in')).toBeInTheDocument()
  },
}

export const PasswordMismatchError: Story = {
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    const firstName = canvas.getByLabelText(/first name/i)
    const lastName = canvas.getByLabelText(/last name/i)
    const username = canvas.getByLabelText(/username/i)
    const email = canvas.getByLabelText(/email/i)
    const password = canvas.getByLabelText(/^password/i)
    const confirmPassword = canvas.getByLabelText(/confirm password/i)
    const submitButton = canvas.getByRole('button', { name: /create account/i })

    await userEvent.type(firstName, 'John')
    await userEvent.type(lastName, 'Doe')
    await userEvent.type(username, 'johndoe')
    await userEvent.type(email, 'john@example.com')
    await userEvent.type(password, 'password123')
    await userEvent.type(confirmPassword, 'differentpassword')
    await userEvent.click(submitButton)

    await expect(canvas.getByText('Passwords do not match')).toBeInTheDocument()
  },
}
