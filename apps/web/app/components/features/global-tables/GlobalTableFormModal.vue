<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NButton,
  NSpace, NText, useMessage, type FormInst, type FormRules,
} from 'naive-ui'
import { useGlobalTablesStore } from '~/stores/globalTables'
import { getErrorMessage } from '~/utils/error'
import { isValidGlobalTableName, isReservedGlobalTableName } from '~/composables/useGlobalTablesData'
import type { GlobalTable, CreateGlobalTable, UpdateGlobalTable } from '~/shared/types/global-table'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  table?: GlobalTable | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const message = import.meta.client ? useMessage() : null
const store = useGlobalTablesStore()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)

const form = ref({
  name: '',
  displayName: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: 'Name is required', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string) => {
        if (!value) return Promise.resolve()
        if (!isValidGlobalTableName(value)) {
          return Promise.reject(new Error('Use snake_case: start with a letter, lowercase letters, numbers, underscores (max 64)'))
        }
        if (isReservedGlobalTableName(value)) {
          return Promise.reject(new Error(`"${value}" is a reserved name`))
        }
        return Promise.resolve()
      },
      trigger: 'blur',
    },
  ],
  displayName: { required: true, message: 'Display name is required', trigger: 'blur' },
}

const title = computed(() => props.mode === 'create' ? 'Create Global Table' : 'Edit Global Table')

const nameHint = computed(() => {
  if (!form.value.name) return 'Lowercase snake_case, e.g. pegawai'
  return isValidGlobalTableName(form.value.name) ? 'Valid table name' : 'Must start with a letter; only a–z, 0–9, _'
})

watch(() => props.visible, (val) => {
  if (val) {
    if (props.mode === 'edit' && props.table) {
      form.value = { name: props.table.name, displayName: props.table.displayName || '' }
    } else {
      form.value = { name: '', displayName: '' }
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
      await store.create(form.value as CreateGlobalTable)
      message.success('Global table created')
    } else if (props.table) {
      await store.update(props.table.id, { displayName: form.value.displayName } as UpdateGlobalTable)
      message.success('Global table updated')
    }
    emit('update:visible', false)
    emit('success')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to save global table'))
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
      <NFormItem label="Name" path="name">
        <NInput
          v-model:value="form.name"
          placeholder="e.g. pegawai"
          :disabled="mode === 'edit'"
          style="font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;"
        />
        <template #feedback>
          <NText depth="3" style="font-size: 12px">{{ nameHint }}</NText>
        </template>
      </NFormItem>
      <NFormItem label="Display Name" path="displayName">
        <NInput v-model:value="form.displayName" placeholder="e.g. Pegawai" />
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
