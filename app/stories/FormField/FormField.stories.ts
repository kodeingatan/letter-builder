import type { Meta, StoryObj } from '@storybook/vue3-vite'
import FormField from '~/components/common/FormField/FormField.vue'

const meta: Meta<typeof FormField> = {
  title: 'Components/FormField',
  component: FormField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
  },
  args: {
    label: 'Email',
    error: '',
    required: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { FormField },
    setup: () => ({ args }),
    template: `
      <FormField v-bind="args">
        <input type="text" placeholder="Enter value" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      </FormField>
    `,
  }),
}

export const WithError: Story = {
  args: {
    label: 'Password',
    error: 'Password is required',
    required: true,
  },
  render: (args) => ({
    components: { FormField },
    setup: () => ({ args }),
    template: `
      <FormField v-bind="args">
        <input type="password" class="w-full px-3 py-2 border border-red-500 rounded-lg text-sm" />
      </FormField>
    `,
  }),
}

export const Required: Story = {
  args: {
    label: 'Username',
    required: true,
  },
  render: (args) => ({
    components: { FormField },
    setup: () => ({ args }),
    template: `
      <FormField v-bind="args">
        <input type="text" placeholder="Enter username" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      </FormField>
    `,
  }),
}
