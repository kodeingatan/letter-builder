import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AuthForm from '~/components/common/AuthForm/AuthForm.vue'

const meta: Meta<typeof AuthForm> = {
  title: 'Components/AuthForm',
  component: AuthForm,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
  },
  args: {
    title: 'Welcome Back',
    subtitle: 'Sign in to your account',
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { AuthForm },
    setup: () => ({ args }),
    template: `
      <AuthForm v-bind="args">
        <p>Form content goes here</p>
      </AuthForm>
    `,
  }),
}

export const WithoutSubtitle: Story = {
  args: {
    title: 'Sign Up',
    subtitle: undefined,
  },
  render: (args) => ({
    components: { AuthForm },
    setup: () => ({ args }),
    template: `
      <AuthForm v-bind="args">
        <p>Form content goes here</p>
      </AuthForm>
    `,
  }),
}
