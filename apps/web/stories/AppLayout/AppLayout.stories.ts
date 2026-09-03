import type { Meta, StoryObj } from '@storybook/vue3-vite'

const mockUser = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  email: 'john@example.com',
}

const meta: Meta = {
  title: 'Components/AppLayout',
  tags: ['autodocs'],
  args: {
    user: mockUser,
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    setup: () => ({ args }),
    template: `
      <div class="flex h-screen bg-gray-100">
        <aside class="w-64 bg-white border-r p-4">
          <h2 class="text-lg font-bold mb-4">Menu</h2>
          <nav class="space-y-2">
            <a href="#" class="block px-3 py-2 rounded hover:bg-gray-100">Dashboard</a>
            <a href="#" class="block px-3 py-2 rounded hover:bg-gray-100">Users</a>
            <a href="#" class="block px-3 py-2 rounded hover:bg-gray-100">Settings</a>
          </nav>
        </aside>
        <main class="flex-1 p-6">
          <div class="p-6">
            <h1 class="text-2xl font-bold">Dashboard Content</h1>
            <p class="mt-2 text-gray-600">This is the main content area.</p>
          </div>
        </main>
      </div>
    `,
  }),
}
