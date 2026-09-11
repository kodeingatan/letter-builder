<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NSelect, NButton,
  NSpace, useMessage, type FormInst, type FormRules,
} from 'naive-ui'
import { useUsersStore } from '~/stores/users'
import { getErrorMessage } from '~/utils/error'
import { useRolesStore } from '~/stores/roles'
import type { User, CreateUser, UpdateUser } from '~/shared/types/user'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  user?: User | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const message = import.meta.client ? useMessage() : null
const usersStore = useUsersStore()
const rolesStore = useRolesStore()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)

const form = ref({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  roleIds: [] as number[],
})

const rules = computed<FormRules>(() => ({
  firstName: { required: true, message: 'First name is required', trigger: 'blur' },
  lastName: { required: true, message: 'Last name is required', trigger: 'blur' },
  username: { required: true, message: 'Username is required', trigger: 'blur' },
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Invalid email format', trigger: 'blur' },
  ],
  ...(props.mode === 'create' ? { password: { required: true, message: 'Password is required', trigger: 'blur' } } : {}),
  ...(form.value.password ? { confirmPassword: { required: true, message: 'Please confirm password', trigger: 'blur' } } : {}),
}))

const roleOptions = computed(() =>
  rolesStore.roles.map((r) => ({ label: r.roleName, value: r.id }))
)

const title = computed(() => props.mode === 'create' ? 'Create User' : 'Edit User')

watch(() => props.visible, (val) => {
  if (val) {
    rolesStore.fetchAll({ limit: 100 })
    if (props.mode === 'edit' && props.user) {
      form.value = {
        firstName: props.user.firstName,
        lastName: props.user.lastName,
        username: props.user.username,
        email: props.user.email,
        password: '',
        confirmPassword: '',
        roleIds: props.user.roles?.map((r) => r.id) || [],
      }
    } else {
      form.value = { firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '', roleIds: [] }
    }
  }
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    if (props.mode === 'create') {
      await usersStore.create(form.value as CreateUser)
      message.success('User created')
    } else if (props.user) {
      const payload: UpdateUser = {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        username: form.value.username,
        email: form.value.email,
        roleIds: form.value.roleIds,
      }
      if (form.value.password) {
        payload.password = form.value.password
      }
      await usersStore.update(props.user.id, payload)
      message.success('User updated')
    }
    emit('update:visible', false)
    emit('success')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Gagal menyimpan user'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <NModal
    :show="visible"
    @update:show="(v) => emit('update:visible', v)"
    preset="card"
    :title="title"
    class="max-w-lg"
    :bordered="false"
  >
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <div class="grid grid-cols-2 gap-4">
        <NFormItem label="First Name" path="firstName">
          <NInput v-model:value="form.firstName" placeholder="First name" />
        </NFormItem>
        <NFormItem label="Last Name" path="lastName">
          <NInput v-model:value="form.lastName" placeholder="Last name" />
        </NFormItem>
      </div>
      <NFormItem label="Username" path="username">
        <NInput v-model:value="form.username" placeholder="Username" />
      </NFormItem>
      <NFormItem label="Email" path="email">
        <NInput v-model:value="form.email" placeholder="Email" type="text" />
      </NFormItem>
      <NFormItem label="Password" path="password">
        <NInput v-model:value="form.password" type="password" show-password-on="click" placeholder="Password" />
      </NFormItem>
      <NFormItem label="Confirm Password" path="confirmPassword">
        <NInput v-model:value="form.confirmPassword" type="password" show-password-on="click" placeholder="Confirm password" />
      </NFormItem>
      <NFormItem label="Roles" path="roleIds">
        <NSelect
          v-model:value="form.roleIds"
          :options="roleOptions"
          multiple
          filterable
          placeholder="Select roles"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('update:visible', false)">Cancel</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">
          {{ mode === 'create' ? 'Create' : 'Save' }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
