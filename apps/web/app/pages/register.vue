<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NInput, NButton, NAlert, NIcon, NForm, NFormItem,
  type FormInst, type FormRules,
} from 'naive-ui'
import { UserAvatar } from '@vicons/carbon'
import { getErrorMessage } from '~/utils/error'

definePageMeta({
  layout: 'auth',
  middleware: 'auth',
  guest: true,
  layoutTitle: 'Buat Akun',
  layoutSubtitle: 'Mulai dengan akun gratis Anda',
  layoutImagePosition: 'right',
})

const authStore = useAuthStore()
const formRef = ref<FormInst | null>(null)

const form = ref({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const rules = computed<FormRules>(() => ({
  firstName: { required: true, message: 'Nama depan wajib diisi', trigger: 'blur' },
  lastName: { required: true, message: 'Nama belakang wajib diisi', trigger: 'blur' },
  username: [
    { required: true, message: 'Username wajib diisi', trigger: 'blur' },
    { min: 3, message: 'Username minimal 3 karakter', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username hanya boleh huruf, angka, dan underscore', trigger: 'blur' },
  ],
  email: [
    { required: true, message: 'Email wajib diisi', trigger: 'blur' },
    { type: 'email', message: 'Format email tidak valid', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Password wajib diisi', trigger: 'blur' },
    { min: 8, message: 'Password minimal 8 karakter', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Password harus mengandung huruf besar, huruf kecil, dan angka', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'Konfirmasi password wajib diisi', trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        if (value !== form.value.password) {
          return new Error('Konfirmasi password tidak cocok')
        }
        return true
      },
      trigger: 'blur',
    },
  ],
}))

const error = ref('')

async function handleRegister() {
  error.value = ''
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  try {
    await authStore.register(form.value)
    navigateTo('/dashboard')
  } catch (e: any) {
    error.value = getErrorMessage(e, 'Registrasi gagal')
  }
}
</script>

<template>
  <Transition name="fade" appear>
    <div class="auth-form-content">
      <NAlert v-if="error" type="error" class="mb-4 alert-animate">
        {{ error }}
      </NAlert>

      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top" @submit.prevent="handleRegister">
        <div class="grid grid-cols-2 gap-4">
          <NFormItem label="Nama Depan" path="firstName">
            <NInput v-model:value="form.firstName" placeholder="Nama depan" autocomplete="given-name" />
          </NFormItem>
          <NFormItem label="Nama Belakang" path="lastName">
            <NInput v-model:value="form.lastName" placeholder="Nama belakang" autocomplete="family-name" />
          </NFormItem>
        </div>

        <NFormItem label="Username" path="username">
          <NInput v-model:value="form.username" placeholder="Pilih username" autocomplete="username" />
        </NFormItem>

        <NFormItem label="Email" path="email">
          <NInput v-model:value="form.email" placeholder="Masukkan email Anda" autocomplete="email" />
        </NFormItem>

        <NFormItem label="Password" path="password">
          <NInput
            v-model:value="form.password"
            type="password"
            show-password-on="click"
            placeholder="Minimal 8 karakter"
            autocomplete="new-password"
          />
        </NFormItem>

        <NFormItem label="Konfirmasi Password" path="confirmPassword">
          <NInput
            v-model:value="form.confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="Konfirmasi password Anda"
            autocomplete="new-password"
          />
        </NFormItem>

        <NButton
          type="primary"
          block
          :loading="authStore.loading"
          attr-type="submit"
          class="mt-2"
        >
          <template #icon>
            <NIcon aria-hidden="true"><UserAvatar /></NIcon>
          </template>
          Buat Akun
        </NButton>
      </NForm>

      <p class="mt-4 text-center text-sm text-gray-600">
        Sudah punya akun?
        <RouterLink to="/login" class="text-[#3B82F6] hover:text-[#2563EB] font-medium">
          Masuk
        </RouterLink>
      </p>
    </div>
  </Transition>
</template>

<style scoped>
.auth-form-content {
  animation: authFormEnter 250ms ease;
}

@keyframes authFormEnter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-form-content {
    animation-duration: 0.01ms !important;
  }
}
</style>
