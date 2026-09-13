import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, NSpace } from 'naive-ui'

const meta: Meta = {
  title: 'Redesign/ModalCard',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modal Card — NModal preset card + .modal-card (xl16, Level-2, hairline), field 4px, pill CTA. Step 7.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

function demoModal(validation: boolean) {
  return {
    components: { NModal, NForm, NFormItem, NInput, NButton, NSpace },
    setup() {
      const show = ref(true)
      return { show, validation }
    },
    template: `
      <div>
        <NButton @click="show = true">Buka Modal</NButton>
        <NModal v-model:show="show" preset="card" title="Buat User" class="max-w-lg modal-card" :bordered="false">
          <NForm label-placement="top">
            <NFormItem label="Username" path="username" v-bind="validation ? { feedback: 'Username wajib diisi', validationStatus: 'error' } : {}">
              <NInput placeholder="Username" />
            </NFormItem>
            <NFormItem label="Email" path="email">
              <NInput placeholder="Email" />
            </NFormItem>
          </NForm>
          <template #footer>
            <NSpace justify="end">
              <NButton @click="show = false">Batal</NButton>
              <NButton type="primary" round>Simpan</NButton>
            </NSpace>
          </template>
        </NModal>
      </div>
    `,
  }
}

export const Default: Story = { render: () => demoModal(false) }
export const Validation: Story = { render: () => demoModal(true) }
