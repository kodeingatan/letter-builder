<script setup lang="ts">
import { ref } from 'vue'
import {
  NInput, NButton, NAlert, NIcon, NForm, NFormItem,
  type FormInst, type FormRules,
} from 'naive-ui'
import { Login } from '@vicons/carbon'
import { getErrorMessage } from '~/utils/error'

definePageMeta({
  layout: 'auth',
  middleware: 'auth',
  guest: true,
  layoutTitle: 'Selamat Datang',
  layoutSubtitle: 'Masuk ke akun Anda',
  layoutImagePosition: 'left',
})

const authStore = useAuthStore()
const formRef = ref<FormInst | null>(null)

const form = ref({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: 'Email wajib diisi', trigger: 'blur' },
    { type: 'email', message: 'Format email tidak valid', trigger: 'blur' },
  ],
  password: { required: true, message: 'Password wajib diisi', trigger: 'blur' },
}

const error = ref('')

async function handleLogin() {
  error.value = ''
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  try {
    await authStore.login({ email: form.value.email, password: form.value.password })
    navigateTo('/dashboard')
  } catch (e: any) {
    error.value = getErrorMessage(e, 'Login gagal')
  }
}
</script>

<template>
  <Transition name="fade" appear>
    <div class="auth-form-content">
      <NAlert v-if="error" type="error" class="mb-4 alert-animate">
        {{ error }}
      </NAlert>

      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top" @submit.prevent="handleLogin">
        <NFormItem label="Email" path="email">
          <NInput v-model:value="form.email" placeholder="Masukkan email Anda" />
        </NFormItem>

        <NFormItem label="Password" path="password">
          <NInput
            v-model:value="form.password"
            type="password"
            show-password-on="click"
            placeholder="Masukkan password Anda"
          />
        </NFormItem>

        <NButton type="primary" block :loading="authStore.loading" attr-type="submit" class="mt-2">
          <template #icon>
            <NIcon><Login /></NIcon>
          </template>
          Masuk
        </NButton>
      </NForm>

      <p class="mt-4 text-center text-sm text-gray-600">
        Belum punya akun?
        <RouterLink to="/register" class="text-indigo-600 hover:text-indigo-500 font-medium">
          Daftar
        </RouterLink>
      </p>
    </div>
  </Transition>
</template>

<style scoped>
.auth-form-content {
  animation: authFormEnter 0.4s ease-out;
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
</style>
