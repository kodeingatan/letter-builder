import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { within, expect } from 'storybook/test'
import FormField from '~/components/common/FormField/FormField.vue'

const meta: Meta<typeof FormField> = {
  title: 'Components/FormField/Tests',
  component: FormField,
}

export default meta
type Story = StoryObj<typeof meta>

export const RendersLabel: Story = {
  args: { label: 'Email' },
  render: (args) => ({
    components: { FormField },
    setup: () => ({ args }),
    template: `<FormField v-bind="args"><input /></FormField>`,
  }),
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Email')).toBeInTheDocument()
  },
}

export const ShowsRequiredIndicator: Story = {
  args: { label: 'Password', required: true },
  render: (args) => ({
    components: { FormField },
    setup: () => ({ args }),
    template: `<FormField v-bind="args"><input /></FormField>`,
  }),
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('*')).toBeInTheDocument()
  },
}

export const ShowsError: Story = {
  args: { label: 'Email', error: 'Email is required' },
  render: (args) => ({
    components: { FormField },
    setup: () => ({ args }),
    template: `<FormField v-bind="args"><input /></FormField>`,
  }),
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Email is required')).toBeInTheDocument()
  },
}
