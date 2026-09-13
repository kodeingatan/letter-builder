import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NIcon } from 'naive-ui'
import { Grid, User, Security, Settings } from '@vicons/carbon'

const meta: Meta = {
  title: 'Redesign/AppShellRow',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'App-Shell Row — baris sm5, aktif = indikator bar #0075de + tint #e8f2fd. Step 5.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const rows = [
  { label: 'Dashboard', icon: Grid, active: false },
  { label: 'User', icon: User, active: true },
  { label: 'Guard', icon: Security, active: false },
  { label: 'Settings', icon: Settings, active: false },
]

export const Default: Story = {
  render: () => ({
    components: { NIcon },
    setup() {
      return { rows, Grid, User, Security, Settings }
    },
    template: `
      <div style="width: 220px; background: #ffffff; border: 1px solid #e6e6e6; border-radius: 12px; padding: 8px;">
        <div
          v-for="r in rows"
          :key="r.label"
          style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 5px; margin: 1px 0; font-size: 14px; cursor: pointer; position: relative;"
          :style="r.active ? 'background: #e8f2fd; color: #005bab; font-weight: 600;' : 'color: #000;'"
        >
          <span v-if="r.active" aria-hidden="true" style="position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 9999px; background: #0075de;"></span>
          <NIcon :size="16"><component :is="r.icon" /></NIcon>
          {{ r.label }}
        </div>
      </div>
    `,
  }),
}
