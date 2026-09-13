import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { h } from 'vue'
import { NTag } from 'naive-ui'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import BadgePill from '~/components/common/BadgePill/BadgePill.vue'

const meta: Meta<typeof DataTable> = {
  title: 'Redesign/DataTableNotion',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'DataTable Notion-calm — header eyebrow + bg #f6f5f4, cell 12/16, row hairline, role BadgePill. Step 6, ALT-01, ERR-03.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const sampleColumns = [
  { key: 'username', title: 'Username', sortable: true, searchable: true },
  {
    key: 'roles',
    title: 'Peran',
    render: (row: { roles: string }) => h(BadgePill, { label: row.roles, type: 'primary' }),
  },
  { key: 'email', title: 'Email', searchable: true },
]

const sampleData = [
  { id: 1, username: 'admin', roles: 'Super Admin', email: 'admin@admin.com' },
  { id: 2, username: 'editor', roles: 'Editor', email: 'editor@example.com' },
]

const baseArgs = {
  columns: sampleColumns as never,
  searchPlaceholder: 'Cari user...',
  searchableFields: [
    { label: 'Semua Kolom', value: '' },
    { label: 'Username', value: 'username' },
  ],
  sortBy: 'id',
  sortOrder: 'DESC' as const,
}

export const Default: Story = {
  args: { ...baseArgs, data: sampleData as never, total: 2, page: 1, limit: 20 },
}

export const Loading: Story = {
  args: { ...baseArgs, data: [] as never, total: 0, loading: true },
}

export const Empty: Story = {
  args: { ...baseArgs, data: [] as never, total: 0, emptyDescription: 'Belum ada user' },
}

export const Error: Story = {
  args: { ...baseArgs, data: [] as never, total: 0, error: 'Koneksi ke server terputus' },
}

export const LevelBadge: Story = {
  render: () => ({
    components: { NTag },
    template: `
      <div style="display: flex; gap: 8px; padding: 24px;">
        <NTag type="success" :bordered="false" round size="small">INFO</NTag>
        <NTag type="warning" :bordered="false" round size="small">WARNING</NTag>
        <NTag type="error" :bordered="false" round size="small">ERROR</NTag>
      </div>
    `,
  }),
}
