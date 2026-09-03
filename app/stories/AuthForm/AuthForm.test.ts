import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { within, expect } from 'storybook/test'
import AuthForm from '~/components/common/AuthForm/AuthForm.vue'

const meta: Meta<typeof AuthForm> = {
  title: 'Components/AuthForm/Tests',
  component: AuthForm,
  args: {
    title: 'Test Title',
    subtitle: 'Test Subtitle',
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const RendersTitle: Story = {
  render: (args) => ({
    components: { AuthForm },
    setup: () => ({ args }),
    template: `
      <AuthForm v-bind="args">
        <p>Content</p>
      </AuthForm>
    `,
  }),
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Test Title')).toBeInTheDocument()
  },
}

export const RendersSubtitle: Story = {
  render: (args) => ({
    components: { AuthForm },
    setup: () => ({ args }),
    template: `
      <AuthForm v-bind="args">
        <p>Content</p>
      </AuthForm>
    `,
  }),
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Test Subtitle')).toBeInTheDocument()
  },
}

export const RendersChildren: Story = {
  render: (args) => ({
    components: { AuthForm },
    setup: () => ({ args }),
    template: `
      <AuthForm v-bind="args">
        <form><input type="text" /></form>
      </AuthForm>
    `,
  }),
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox')).toBeInTheDocument()
  },
}
