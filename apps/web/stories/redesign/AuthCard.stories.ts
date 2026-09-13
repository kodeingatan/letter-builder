import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NForm, NFormItem, NInput, NButton } from 'naive-ui'
import AuthForm from '~/components/common/AuthForm/AuthForm.vue'

const meta: Meta<typeof AuthForm> = {
  title: 'Redesign/AuthCard',
  component: AuthForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Auth Card Notion-calm — canvas #f6f5f4, kartu putih xl16 hairline + Level-1 shadow, field tight 4px, CTA pill primer. AC-D02.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const demoForm = {
  components: { NForm, NFormItem, NInput, NButton },
  template: `
    <NForm label-placement="top">
      <NFormItem label="Email" :show-feedback="false">
        <NInput placeholder="Masukkan email Anda" />
      </NFormItem>
      <NFormItem label="Password" :show-feedback="false">
        <NInput type="password" placeholder="Masukkan password Anda" />
      </NFormItem>
      <NButton type="primary" block round attr-type="submit" class="mt-2">Masuk</NButton>
    </NForm>
  `,
}

export const Default: Story = {
  args: { title: 'Selamat Datang', subtitle: 'Masuk ke akun Anda' },
  render: (args) => ({
    components: { AuthForm, demoForm },
    setup() { return { args } },
    template: `<AuthForm v-bind="args"><demoForm /></AuthForm>`,
  }),
}

export const Validation: Story = {
  args: { title: 'Selamat Datang', subtitle: 'Masuk ke akun Anda' },
  render: (args) => ({
    components: { AuthForm, NForm, NFormItem, NInput, NButton },
    setup() { return { args } },
    template: `
      <AuthForm v-bind="args">
        <NForm label-placement="top" :model="{ email: 'bukan-email' }">
          <NFormItem label="Email" path="email" :feedback="'Format email tidak valid'" :validation-status="'error'">
            <NInput value="bukan-email" placeholder="Masukkan email Anda" />
          </NFormItem>
          <NButton type="primary" block round attr-type="submit" class="mt-2">Masuk</NButton>
        </NForm>
      </AuthForm>
    `,
  }),
}
