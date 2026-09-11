<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NForm, NFormItem, NInput, NInputNumber, NSelect, NDatePicker,
  NUpload, NImage, NSpin, NButton, NIcon, NTag, NAlert, useMessage,
  type FormRules, type UploadFileInfo,
} from 'naive-ui'
import { Upload } from '@vicons/carbon'
import RelationSelector from '~/components/features/global-tables/RelationSelector.vue'
import { useAuthStore } from '~/stores/auth'
import { getErrorMessage } from '~/utils/error'
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
const computedLive = ref<Record<string, string>>({})
const computedErrors = ref<Record<string, string>>({})
const testing = ref<Record<string, boolean>>({})
let debounceTimer: ReturnType<typeof setTimeout> | null = null

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

function parseDeps(expr: string): string[] {
  return [...expr.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]).filter((v, i, a) => a.indexOf(v) === i)
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
    const resp = await $fetch<any>('/api/settings/upload', {
      method: 'POST',
      body: form,
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    const url = typeof resp === 'string' ? resp : (resp?.url ?? resp?.data?.url ?? '')
    setField(column.name, url)
    message?.success('Image uploaded')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Image upload failed'))
  } finally {
    uploading.value = { ...uploading.value, [column.name]: false }
  }
}

async function handleTestExpression(col: TableDataColumn) {
  if (!col.expression) return
  testing.value = { ...testing.value, [col.name]: true }
  try {
    const res = await $fetch<any>('/api/expressions/validate', {
      method: 'POST',
      body: { expression: col.expression, sampleContext: props.modelValue },
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (res?.valid === false) {
      computedErrors.value = { ...computedErrors.value, [col.name]: res?.error || 'Ekspresi tidak valid' }
      message?.error(res?.error || 'Ekspresi tidak valid')
    } else {
      computedErrors.value = { ...computedErrors.value, [col.name]: '' }
      message?.success('Ekspresi valid')
    }
  } catch (e: any) {
    const msg = getErrorMessage(e, 'Ekspresi tidak valid')
    computedErrors.value = { ...computedErrors.value, [col.name]: msg }
    message?.error(msg)
  } finally {
    testing.value = { ...testing.value, [col.name]: false }
  }
}

function validate() {
  return formRef.value?.validate()
}

defineExpose({ validate })

// Live recompute for readonly-computed — debounce 200ms, server authoritative but preview client
watch(() => props.modelValue, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    const computedCols = props.columns.filter(c => c.type === 'readonly-computed' && c.expression)
    if (!computedCols.length) return
    for (const col of computedCols) {
      try {
        const res = await $fetch<any>('/api/expressions/evaluate', {
          method: 'POST',
          body: { expression: col.expression, context: val },
          headers: { Authorization: `Bearer ${authStore.token}` },
        })
        const display = res?.data?.value ?? res?.value ?? res?.result ?? ''
        computedLive.value = { ...computedLive.value, [col.name]: String(display ?? '') }
        if (computedErrors.value[col.name]) {
          computedErrors.value = { ...computedErrors.value, [col.name]: '' }
        }
      } catch (e: any) {
        // Keep error but don't block; server is authoritative
        computedErrors.value = { ...computedErrors.value, [col.name]: getErrorMessage(e, 'Gagal evaluasi') }
      }
    }
  }, 200)
}, { deep: true, immediate: true })

// Also watch columns to trigger immediate evaluate when first loaded
watch(() => props.columns, () => {
  // trigger recompute
  if (props.columns.some(c => c.type === 'readonly-computed')) {
    // slight delay to allow modelValue watch to pick up
    setTimeout(() => {
      const val = props.modelValue
      for (const col of props.columns.filter(c => c.type === 'readonly-computed' && c.expression)) {
        $fetch<any>('/api/expressions/evaluate', {
          method: 'POST',
          body: { expression: col.expression, context: val },
          headers: { Authorization: `Bearer ${authStore.token}` },
        }).then((res: any) => {
          const display = res?.data?.value ?? res?.value ?? res?.result ?? ''
          computedLive.value = { ...computedLive.value, [col.name]: String(display ?? '') }
        }).catch(() => {})
      }
    }, 100)
  }
}, { immediate: true })
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
        <template #feedback>
          <span style="font-size:11px;color:#94a3b8">Editor penuh Task 35 — placeholder konsisten</span>
        </template>
      </NFormItem>
      <!-- date -->
      <NFormItem v-else-if="col.type === 'date'" :label="col.displayName" :path="col.name">
        <div class="w-full">
          <NDatePicker :value="datePickerValue(col)" :disabled="disabled" type="datetime" clearable class="w-full" @update:value="(v) => handleDateChange(col, v)" />
          <div v-if="col.format" class="text-xs mt-1" style="color:#94a3b8">Format: {{ col.format }}</div>
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
      <!-- image — FIX GAP-GT-16 span → NButton -->
      <NFormItem v-else-if="col.type === 'image'" :label="col.displayName" :path="col.name">
        <div class="w-full flex flex-col gap-2">
          <NInput :value="formValue[col.name] ?? ''" :disabled="disabled" placeholder="Image URL" @update:value="(v) => setField(col.name, v)" />
          <div class="flex items-center gap-3">
            <NUpload :show-file-list="false" accept="image/*" :disabled="disabled" :custom-request="(o: any) => handleImageUpload(col, o)">
              <NButton type="primary" ghost :disabled="disabled" :loading="!!uploading[col.name]">
                <template #icon><NIcon><Upload /></NIcon></template>
                Upload image
              </NButton>
            </NUpload>
            <div style="width:64px;height:64px;border:1px solid #E5E7EB;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#fff;overflow:hidden">
              <NSpin v-if="uploading[col.name]" size="small" />
              <NImage v-else-if="formValue[col.name]" :src="String(formValue[col.name])" width="64" height="64" object-fit="cover" style="border-radius:6px" />
              <span v-else style="font-size:11px;color:#9CA3AF">🖼 64</span>
            </div>
          </div>
        </div>
      </NFormItem>
      <!-- readonly computed — FIX GAP-GT-17 placeholder kosong → live -->
      <NFormItem v-else-if="col.type === 'readonly-computed'" :label="`${col.displayName} (computed)`" :path="col.name">
        <NInput :value="computedLive[col.name] ?? (formValue[col.name] == null ? '' : String(formValue[col.name]))" disabled placeholder="Computed live" style="background:#F9FAFB" />
        <template #feedback>
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <NTag v-for="dep in parseDeps(col.expression || '')" :key="dep" type="info" size="small">{{ dep }}</NTag>
            <NButton size="small" secondary :loading="!!testing[col.name]" style="margin-left:auto" @click="handleTestExpression(col)">▶ Uji ekspresi</NButton>
          </div>
          <div style="font-size:11px;color:#6B7280;margin-top:4px">Watch dependency → 200ms debounce → POST /api/expressions/evaluate — server authoritative</div>
          <NAlert v-if="computedErrors[col.name]" type="error" style="margin-top:6px" closable @close="computedErrors[col.name]=''">{{ computedErrors[col.name] }}</NAlert>
        </template>
      </NFormItem>
    </template>
  </NForm>
</template>
