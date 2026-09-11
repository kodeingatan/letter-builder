<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NCard,
  NInput,
  NButton,
  NIcon,
  NAlert,
  NSpace,
  NForm,
  NFormItem,
  useMessage,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import { Save, UserAvatar } from '@vicons/carbon'
import { getErrorMessage } from '~/utils/error'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const authStore = useAuthStore()
const message = import.meta.client ? useMessage() : null

const profileFormRef = ref<FormInst | null>(null)
const passwordFormRef = ref<FormInst | null>(null)

const profileForm = ref({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileError = ref('')
const passwordError = ref('')
const savingProfile = ref(false)
const savingPassword = ref(false)

const profileRules: FormRules = {
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
}

const passwordRules: FormRules = {
  currentPassword: { required: true, message: 'Password saat ini wajib diisi', trigger: 'blur' },
  newPassword: [
    { required: true, message: 'Password baru wajib diisi', trigger: 'blur' },
    { min: 8, message: 'Password minimal 8 karakter', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Password harus mengandung huruf besar, huruf kecil, dan angka', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'Konfirmasi password wajib diisi', trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        if (value !== passwordForm.value.newPassword) {
          return new Error('Konfirmasi password tidak cocok')
        }
        return true
      },
      trigger: 'blur',
    },
  ],
}

onMounted(async () => {
  if (authStore.user) {
    profileForm.value.firstName = authStore.user.firstName
    profileForm.value.lastName = authStore.user.lastName
    profileForm.value.username = authStore.user.username
    profileForm.value.email = authStore.user.email
  }
})

async function handleSaveProfile() {
  profileError.value = ''
  try {
    await profileFormRef.value?.validate()
  } catch {
    return
  }

  savingProfile.value = true
  try {
    await authStore.updateProfile(profileForm.value)
    message?.success('Profil berhasil diperbarui')
  } catch (e: any) {
    profileError.value = getErrorMessage(e, 'Gagal memperbarui profil')
  } finally {
    savingProfile.value = false
  }
}

async function handleChangePassword() {
  passwordError.value = ''
  try {
    await passwordFormRef.value?.validate()
  } catch {
    return
  }

  savingPassword.value = true
  try {
    await authStore.changePassword(passwordForm.value)
    message?.success('Password berhasil diubah')
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (e: any) {
    passwordError.value = getErrorMessage(e, 'Gagal mengubah password')
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <PageShell title="Profil" :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profil' }]" description="Kelola informasi profil dan password Anda.">
    <div class="max-w-2xl">
    <NCard title="Informasi Profil" class="mb-4">
      <NAlert v-if="profileError" type="error" class="mb-4">
        {{ profileError }}
      </NAlert>

      <NForm ref="profileFormRef" :model="profileForm" :rules="profileRules" label-placement="top">
        <div class="grid grid-cols-2 gap-4">
          <NFormItem label="Nama Depan" path="firstName">
            <NInput v-model:value="profileForm.firstName" placeholder="Nama depan" />
          </NFormItem>
          <NFormItem label="Nama Belakang" path="lastName">
            <NInput v-model:value="profileForm.lastName" placeholder="Nama belakang" />
          </NFormItem>
        </div>

        <NFormItem label="Username" path="username">
          <NInput v-model:value="profileForm.username" placeholder="Username" />
        </NFormItem>

        <NFormItem label="Email" path="email">
          <NInput v-model:value="profileForm.email" placeholder="Email" />
        </NFormItem>

        <NSpace justify="end" class="mt-4">
          <NButton
            type="primary"
            :loading="savingProfile"
            @click="handleSaveProfile"
          >
            <template #icon>
              <NIcon><Save /></NIcon>
            </template>
            Simpan Perubahan
          </NButton>
        </NSpace>
      </NForm>
    </NCard>

    <NCard title="Ubah Password">
      <NAlert v-if="passwordError" type="error" class="mb-4">
        {{ passwordError }}
      </NAlert>

      <NForm ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-placement="top">
        <NFormItem label="Password Saat Ini" path="currentPassword">
          <NInput
            v-model:value="passwordForm.currentPassword"
            type="password"
            show-password-on="click"
            placeholder="Masukkan password saat ini"
          />
        </NFormItem>

        <NFormItem label="Password Baru" path="newPassword">
          <NInput
            v-model:value="passwordForm.newPassword"
            type="password"
            show-password-on="click"
            placeholder="Minimal 8 karakter"
          />
        </NFormItem>

        <NFormItem label="Konfirmasi Password Baru" path="confirmPassword">
          <NInput
            v-model:value="passwordForm.confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="Konfirmasi password baru"
          />
        </NFormItem>

        <NSpace justify="end" class="mt-4">
          <NButton
            type="warning"
            :loading="savingPassword"
            @click="handleChangePassword"
          >
            <template #icon>
              <NIcon><UserAvatar /></NIcon>
            </template>
            Ubah Password
          </NButton>
        </NSpace>
      </NForm>
      </NCard>
    </div>
  </PageShell>
</template>
