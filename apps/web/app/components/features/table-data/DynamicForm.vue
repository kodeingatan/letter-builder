<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NForm, NFormItem, NInput, NInputNumber, NSelect, NDatePicker,
  NUpload, NImage, NSpin, useMessage,
  type FormRules, type UploadFileInfo,
} from 'naive-ui'
import RelationSelector from '~/components/features/global-tables/RelationSelector.vue'
import { useAuthStore } from '~/stores/auth'
import type { TableDataColumn } from '~/shared/types/table-data'

const props = defineProps<{
  columns: TableDataColumn[]
  modelValue: Record<string, any>
  serverErrors?: Record<string, string>
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

const message = import.meta.client ? useMessage() : null
const authStore = useAuthStore()
const formRef = ref<InstanceType<typeof NForm> | null>(null)
const uploading = ref<Record<string, boolean>>({})

const editableColumns = computed(() =>
  props.columns.filter((c) => c.type !== 'hidden-computed'),
)

const formValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function setField(name: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [name]: value })
}

function selectOptions(column: TableDataColumn) {
  try {
    const parsed = JSON.parse(column.options ?? '[]')
    return Array.isArray(parsed) ? parsed.map((o: any) => ({ label: String(o.label ?? o.value), value: o.value })) : []
  } catch {
    return []
  }
}

function parseRelationConfig(column: TableDataColumn) {
  try {
    return typeof column.relationConfig === 'string' ? JSON.parse(column.relationConfig) : column.relationConfig
  } catch {
    return null
  }
}

// Client-side naive rules for instant feedback (server is authoritative)
const rules = computed<FormRules>(() => {
  const r: FormRules = {}
  for (const col of editableColumns.value) {
    const colRules: Array<{ required?: boolean; message?: string; type?: string; trigger?: string }> = []
    if (col.required) {
      colRules.push({ required: true, message: `${col.displayName} is required`, trigger: ['blur', 'input', 'change'] })
    }
    if (col.type === 'number' || col.type === 'currency') {
      colRules.push({ type: 'number', message: `${col.displayName} must be a number`, trigger: ['blur', 'change'] })
    }
    if (props.serverErrors?.[col.name]) {
      colRules.push({ message: props.serverErrors[col.name], trigger: [] })
    }
    if (colRules.length) r[col.name] = colRules as any
  }
  return r
})

function datePickerValue(column: TableDataColumn): number | null {
  const v = props.modelValue[column.name]
  if (v === null || v === undefined || v === '') return null
  const t = new Date(String(v)).getTime()
  return Number.isNaN(t) ? null : t
}

function handleDateChange(column: TableDataColumn, ts: number | null) {
  setField(column.name, ts === null ? null : new Date(ts).toISOString())
}

async function handleImageUpload(column: TableDataColumn, options: { file: UploadFileInfo }) {
  const file = options.file.file
  if (!file) return
  uploading.value = { ...uploading.value, [column.name]: true }
  try {
    const form = new FormData()
    form.append('file', file)
    form.append('subfolder', 'general')
    const url = await $fetch<string>('/api/settings/upload', {
      method: 'POST',
      body: form,
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    setField(column.name, url)
    message?.success('Image uploaded')
  } catch {
    message?.error('Image upload failed')
  } finally {
    uploading.value = { ...uploading.value, [column.name]: false }
  }
}

function validate() {
  return formRef.value?.validate()
}

defineExpose({ validate })

watch(() => props.modelValue, () => {}, { deep: true })
</script>

<template>
  <NForm ref="formRef" :model="formValue" :rules="rules" label-placement="top" require-mark-placement="right">
    <template v-for="col in editableColumns" :key="col.name">
      <!-- text -->
      <NFormItem v-if="col.type === 'text'" :label="col.displayName" :path="col.name">
        <NInput :value="formValue[col.name] ?? ''" :disabled="disabled" :placeholder="col.displayName" @update:value="(v) => setField(col.name, v)" />
      </NFormItem>
      <!-- richtext -->
      <NFormItem v-else-if="col.type === 'richtext'" :label="col.displayName" :path="col.name">
        <NInput :value="formValue[col.name] ?? ''" type="textarea" :rows="4" :disabled="disabled" :placeholder="col.displayName" @update:value="(v) => setField(col.name, v)" />
      </NFormItem>
      <!-- date -->
      <NFormItem v-else-if="col.type === 'date'" :label="col.displayName" :path="col.name">
        <div class="w-full">
          <NDatePicker :value="datePickerValue(col)" :disabled="disabled" type="datetime" clearable class="w-full" @update:value="(v) => handleDateChange(col, v)" />
          <div v-if="col.format" class="text-xs text-gray-400 mt-1">Format: {{ col.format }}</div>
        </div>
      </NFormItem>
      <!-- select -->
      <NFormItem v-else-if="col.type === 'select'" :label="col.displayName" :path="col.name">
        <NSelect :value="formValue[col.name] ?? null" :options="selectOptions(col)" :disabled="disabled" clearable :placeholder="`Select ${col.displayName}`" class="w-full" @update:value="(v) => setField(col.name, v)" />
      </NFormItem>
      <!-- number / currency -->
      <NFormItem v-else-if="col.type === 'number' || col.type === 'currency'" :label="col.displayName" :path="col.name">
        <NInputNumber :value="formValue[col.name] ?? null" :disabled="disabled" clearable class="w-full" :prefix="col.type === 'currency' ? (col.format || 'Rp') : undefined" @update:value="(v) => setField(col.name, v)" />
      </NFormItem>
      <!-- relation -->
      <NFormItem v-else-if="col.type === 'select-table-relation' || col.type === 'select-table-relation-multiple'" :label="col.displayName" :path="col.name">
        <RelationSelector
          :model-value="formValue[col.name] ?? null"
          :column-id="col.id"
          :target-table-id="col.relationTableId ?? 0"
          :multiple="col.type === 'select-table-relation-multiple'"
          :disabled="disabled"
          :clearable="!col.required"
          :placeholder="`Select ${col.displayName}`"
          @update:model-value="(v) => setField(col.name, v)"
        />
      </NFormItem>
      <!-- image -->
      <NFormItem v-else-if="col.type === 'image'" :label="col.displayName" :path="col.name">
        <div class="w-full flex flex-col gap-2">
          <NInput :value="formValue[col.name] ?? ''" :disabled="disabled" placeholder="Image URL" @update:value="(v) => setField(col.name, v)" />
          <div class="flex items-center gap-2">
            <NUpload :show-file-list="false" accept="image/*" :disabled="disabled" :custom-request="(o: any) => handleImageUpload(col, o)">
              <NSpin v-if="uploading[col.name]" size="small" />
              <span v-else class="text-sm text-blue-500 cursor-pointer">Upload image</span>
            </NUpload>
            <NImage v-if="formValue[col.name]" :src="String(formValue[col.name])" width="64" object-fit="cover" />
          </div>
        </div>
      </NFormItem>
      <!-- readonly computed -->
      <NFormItem v-else-if="col.type === 'readonly-computed'" :label="`${col.displayName} (computed)`" :path="col.name">
        <NInput :value="formValue[col.name] == null ? '' : String(formValue[col.name])" disabled placeholder="Computed on save" />
      </NFormItem>
    </template>
  </NForm>
</template>
