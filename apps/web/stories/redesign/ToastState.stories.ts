import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NButton, NAlert, NSpace, NMessageProvider, useMessage } from 'naive-ui'

const meta: Meta = {
  title: 'Redesign/ToastState',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Toast sukses via useMessage (Berhasil) + NAlert error full-width dengan retry. Step 8, ERR-03.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const ToastDemo = {
  components: { NButton, NAlert, NSpace },
  setup() {
    const message = useMessage()
    return {
      notify: () => message.success('Berhasil'),
    }
  },
  template: `
    <NSpace vertical :size="16">
      <NButton type="primary" round @click="notify">Tampilkan Toast Berhasil</NButton>
      <NAlert type="error" closable>
        <template #header>Gagal memuat data</template>
        Terjadi kesalahan saat mengambil data.
        <NButton size="small" style="margin-left: 8px;">Coba lagi</NButton>
      </NAlert>
    </NSpace>
  `,
}

export const SuksesDanError: Story = {
  render: () => ({
    components: { NMessageProvider, ToastDemo },
    template: `
      <n-message-provider>
        <ToastDemo />
      </n-message-provider>
    `,
  }),
}
