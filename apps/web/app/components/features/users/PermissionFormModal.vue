<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NSelect, NButton,
  NSpace, NDynamicInput, useMessage, type FormInst, type FormRules,
} from 'naive-ui'
import { usePermissionsStore } from '~/stores/permissions'
import { getErrorMessage } from '~/utils/error'
import type { Permission, CreatePermission, UpdatePermission } from '~/shared/types/permission'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  permission?: Permission | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const message = import.meta.client ? useMessage() : null
const permissionsStore = usePermissionsStore()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'OPTIONS', value: 'OPTIONS' },
  { label: '* (All)', value: '*' },
]

const form = ref({
  permissionName: '',
  description: '',
  methods: [] as string[],
  urls: [] as string[],
})

const rules: FormRules = {
  permissionName: { required: true, message: 'Permission name is required', trigger: 'blur' },
}

const title = computed(() => props.mode === 'create' ? 'Create Permission' : 'Edit Permission')

watch(() => props.visible, (val) => {
  if (val) {
    if (props.mode === 'edit' && props.permission) {
      form.value = {
        permissionName: props.permission.permissionName,
        description: props.permission.description || '',
        methods: props.permission.methods?.map((m) => m.method) || [],
        urls: props.permission.urls?.map((u) => u.url) || [],
      }
    } else {
      form.value = { permissionName: '', description: '', methods: [], urls: [] }
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
      await permissionsStore.create(form.value as CreatePermission)
      message.success('Permission created')
    } else if (props.permission) {
      await permissionsStore.update(props.permission.id, form.value as UpdatePermission)
      message.success('Permission updated')
    }
    emit('update:visible', false)
    emit('success')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Gagal menyimpan permission'))
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
    class="max-w-lg modal-card"
    :bordered="false"
  >
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <NFormItem label="Permission Name" path="permissionName">
        <NInput v-model:value="form.permissionName" placeholder="Permission name" />
      </NFormItem>
      <NFormItem label="Description" path="description">
        <NInput v-model:value="form.description" type="textarea" placeholder="Description" />
      </NFormItem>
      <NFormItem label="Methods" path="methods">
        <NSelect
          v-model:value="form.methods"
          :options="methodOptions"
          multiple
          filterable
          placeholder="Select HTTP methods"
        />
      </NFormItem>
      <NFormItem label="URLs">
        <NDynamicInput v-model:value="form.urls" placeholder="/api/*" />
      </NFormItem>
      <p class="text-xs text-gray-500">Use * for wildcard pattern (e.g., /api/users/*)</p>
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
