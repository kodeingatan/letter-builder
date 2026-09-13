<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NSelect, NButton,
  NSpace, useMessage, type FormInst, type FormRules,
} from 'naive-ui'
import { useRolesStore } from '~/stores/roles'
import { getErrorMessage } from '~/utils/error'
import { useGuardsStore } from '~/stores/guards'
import { usePermissionsStore } from '~/stores/permissions'
import type { Role, CreateRole, UpdateRole } from '~/shared/types/role'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  role?: Role | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const message = import.meta.client ? useMessage() : null
const rolesStore = useRolesStore()
const guardsStore = useGuardsStore()
const permissionsStore = usePermissionsStore()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)

const form = ref({
  roleName: '',
  description: '',
  guardIds: [] as number[],
  permissionIds: [] as number[],
})

const rules: FormRules = {
  roleName: { required: true, message: 'Role name is required', trigger: 'blur' },
}

const guardOptions = computed(() =>
  guardsStore.guards.map((g) => ({ label: g.guardName, value: g.id }))
)

const permissionOptions = computed(() =>
  permissionsStore.permissions.map((p) => ({ label: p.permissionName, value: p.id }))
)

const title = computed(() => props.mode === 'create' ? 'Create Role' : 'Edit Role')

watch(() => props.visible, (val) => {
  if (val) {
    guardsStore.fetchAll({ limit: 100 })
    permissionsStore.fetchAll({ limit: 100 })
    if (props.mode === 'edit' && props.role) {
      form.value = {
        roleName: props.role.roleName,
        description: props.role.description || '',
        guardIds: props.role.guards?.map((g) => g.id) || [],
        permissionIds: props.role.permissions?.map((p) => p.id) || [],
      }
    } else {
      form.value = { roleName: '', description: '', guardIds: [], permissionIds: [] }
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
      await rolesStore.create(form.value as CreateRole)
      message.success('Role created')
    } else if (props.role) {
      await rolesStore.update(props.role.id, form.value as UpdateRole)
      message.success('Role updated')
    }
    emit('update:visible', false)
    emit('success')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Gagal menyimpan role'))
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
      <NFormItem label="Role Name" path="roleName">
        <NInput v-model:value="form.roleName" placeholder="Role name" />
      </NFormItem>
      <NFormItem label="Description" path="description">
        <NInput v-model:value="form.description" type="textarea" placeholder="Description" />
      </NFormItem>
      <NFormItem label="Guards" path="guardIds">
        <NSelect
          v-model:value="form.guardIds"
          :options="guardOptions"
          multiple
          filterable
          placeholder="Select guards"
        />
      </NFormItem>
      <NFormItem label="Permissions" path="permissionIds">
        <NSelect
          v-model:value="form.permissionIds"
          :options="permissionOptions"
          multiple
          filterable
          placeholder="Select permissions"
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
