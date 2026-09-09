<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NCard, NButton, NSpace, NAlert, useMessage } from 'naive-ui'
import DynamicForm from '~/components/features/table-data/DynamicForm.vue'
import { useTableDataStore } from '~/stores/tableData'
import { getErrorMessage } from '~/utils/error'
import type { TableRow } from '~/shared/types/table-data'

const props = defineProps<{
  visible: boolean
  tableName: string
  mode: 'create' | 'edit'
  row?: TableRow | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const store = useTableDataStore()
const message = import.meta.client ? useMessage() : null
const form = ref<Record<string, any>>({})
const formRef = ref<InstanceType<typeof DynamicForm> | null>(null)
const serverErrors = ref<Record<string, string>>({})
const saving = ref(false)

watch(() => [props.visible, props.row] as const, ([visible]) => {
  if (!visible) return
  serverErrors.value = {}
  if (props.mode === 'edit' && props.row) {
    const { id, createdAt, updatedAt, _display, ...values } = props.row
    form.value = { ...values }
  } else {
    const defaults: Record<string, any> = {}
    for (const col of store.columns) {
      if (col.type === 'select-table-relation-multiple') defaults[col.name] = []
      // defaultValue is stored as string; coerce for numeric inputs so
      // NInputNumber receives a number (server coerces again on write).
      else if ((col.type === 'number' || col.type === 'currency') && col.defaultValue !== null && col.defaultValue !== undefined && col.defaultValue !== '') {
        const n = Number(col.defaultValue)
        defaults[col.name] = Number.isFinite(n) ? n : null
      }
      else defaults[col.name] = col.defaultValue ?? null
    }
    form.value = defaults
  }
}, { immediate: true })

async function handleSave() {
  serverErrors.value = {}
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    if (props.mode === 'create') {
      await store.create(props.tableName, form.value)
      message?.success('Row created')
    } else if (props.row) {
      await store.update(props.tableName, props.row.id, form.value)
      message?.success('Row updated')
    }
    emit('update:visible', false)
    emit('success')
  } catch (e: any) {
    const errors = e.data?.errors ?? e.response?.data?.errors
    if (errors) serverErrors.value = errors
    message?.error(getErrorMessage(e, 'Failed to save row'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <NModal :show="visible" preset="dialog" :title="mode === 'create' ? 'Create row' : `Edit row #${row?.id}`" style="width: 560px;" @update:show="(v) => emit('update:visible', v)">
    <NSpace vertical size="medium" class="w-full">
      <NAlert v-if="Object.keys(serverErrors).length" type="error" title="Validation failed">
        <ul class="list-disc pl-4">
          <li v-for="(msg, field) in serverErrors" :key="field">{{ field }}: {{ msg }}</li>
        </ul>
      </NAlert>
      <DynamicForm ref="formRef" :columns="store.columns" v-model="form" :server-errors="serverErrors" />
      <NSpace justify="end">
        <NButton @click="emit('update:visible', false)">Cancel</NButton>
        <NButton type="primary" :loading="saving" @click="handleSave">Save</NButton>
      </NSpace>
    </NSpace>
  </NModal>
</template>
