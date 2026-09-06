<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  NCard, NForm, NFormItem, NInput, NInputNumber, NDatePicker, NSelect,
  NDivider, NText, NButton, NSpace, NSpin, NAlert,
} from 'naive-ui'
import { useGlobalTablesStore } from '~/stores/globalTables'
import { useTableDataStore } from '~/stores/tableData'
import { useAuthStore } from '~/stores/auth'
import type { RunStep, RunStepData } from '~/shared/types/run'

const props = defineProps<{
  step: RunStep
  modelValue: RunStepData
  readonly?: boolean
  serverIssues?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: RunStepData): void
}>()

const tablesStore = useGlobalTablesStore()
const authStore = useAuthStore()

const fields = computed(() => ({ ...(props.modelValue.fields ?? {}) }))
const rowSelections = computed(() => ({ ...(props.modelValue.rowSelections ?? {}) }))
const manualInputs = computed(() => ({ ...(props.modelValue.manualInputs ?? {}) }))

function patch(partial: Partial<RunStepData>) {
  emit('update:modelValue', {
    fields: { ...(props.modelValue.fields ?? {}) },
    rowSelections: { ...(props.modelValue.rowSelections ?? {}) },
    manualInputs: { ...(props.modelValue.manualInputs ?? {}) },
    ...partial,
  })
}

function setField(name: string, value: unknown) {
  patch({ fields: { ...(props.modelValue.fields ?? {}), [name]: value } })
}

function setManual(key: string, value: unknown) {
  patch({ manualInputs: { ...(props.modelValue.manualInputs ?? {}), [key]: value } })
}

const manualKeys = computed(() => Object.keys(props.modelValue.manualInputs ?? {}))
const selectionKeys = computed(() => Object.keys(props.modelValue.rowSelections ?? {}))

// --- Row pickers (template loop row selectors, REQ-003b) ---
interface TableOption { label: string; value: string }
const tableOptions = ref<TableOption[]>([])
const tablesLoading = ref(false)
const rowsByTable = ref<Record<string, Array<{ label: string; value: number }>>>({})
const rowsLoading = ref<Record<string, boolean>>({})
const addTable = ref<string | null>(null)

function rowLabel(row: any): string {
  const entries = Object.entries(row ?? {}).filter(([k]) => !['id', 'createdAt', 'updatedAt', '_display'].includes(k))
  const first = entries.find(([, v]) => typeof v === 'string' && v.trim() !== '')
  return `#${row.id}${first ? ` — ${String(first[1]).slice(0, 60)}` : ''}`
}

async function loadTables() {
  tablesLoading.value = true
  try {
    const response = await tablesStore.fetchAll({ limit: 100 })
    tableOptions.value = (response.data ?? []).map((t: any) => ({ label: t.displayName || t.name, value: t.name }))
  } catch {
    tableOptions.value = []
  } finally {
    tablesLoading.value = false
  }
}

async function loadRows(tableName: string) {
  rowsLoading.value = { ...rowsLoading.value, [tableName]: true }
  try {
    const response = await $fetch<any>(`/api/data/${tableName}`, {
      params: { page: 1, limit: 100 },
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    rowsByTable.value = {
      ...rowsByTable.value,
      [tableName]: (response.data ?? []).map((row: any) => ({ label: rowLabel(row), value: row.id })),
    }
  } catch {
    rowsByTable.value = { ...rowsByTable.value, [tableName]: [] }
  } finally {
    rowsLoading.value = { ...rowsLoading.value, [tableName]: false }
  }
}

function handleAddTable() {
  if (!addTable.value) return
  const key = addTable.value
  if (!(key in (props.modelValue.rowSelections ?? {}))) {
    patch({ rowSelections: { ...(props.modelValue.rowSelections ?? {}), [key]: [] } })
  }
  if (!rowsByTable.value[key]) void loadRows(key)
  addTable.value = null
}

function setSelection(key: string, value: number[]) {
  patch({ rowSelections: { ...(props.modelValue.rowSelections ?? {}), [key]: value } })
}

function removeSelection(key: string) {
  const next = { ...(props.modelValue.rowSelections ?? {}) }
  delete next[key]
  patch({ rowSelections: next })
}

watch(selectionKeys, (keys) => {
  for (const key of keys) {
    if (!rowsByTable.value[key]) void loadRows(key)
  }
}, { immediate: true })

onMounted(() => {
  if (props.step.templateId != null) void loadTables()
})

const showRowSection = computed(() => props.step.templateId != null)
const availableTables = computed(() =>
  tableOptions.value.filter((t) => !(t.value in (props.modelValue.rowSelections ?? {}))),
)
</script>

<template>
  <div>
    <NAlert
      v-if="serverIssues && serverIssues.length > 0"
      type="error"
      title="Step needs attention"
      style="margin-bottom: 12px;"
    >
      <div v-for="(issue, i) in serverIssues" :key="i">{{ issue }}</div>
    </NAlert>

    <!-- (a) step-local fields form (Task 17 schema) -->
    <NCard v-if="step.fields && step.fields.length > 0" title="Fields" size="small" style="margin-bottom: 12px;">
      <NForm label-placement="top">
        <NFormItem
          v-for="field in step.fields"
          :key="field.name"
          :label="`${field.label}${field.required ? ' *' : ''}`"
        >
          <NInput
            v-if="field.type === 'text' || field.type === 'richtext' || field.type === 'image'"
            :value="String(fields[field.name] ?? '')"
            :disabled="readonly"
            :placeholder="field.label"
            @update:value="(v) => setField(field.name, v)"
          />
          <NInputNumber
            v-else-if="field.type === 'number' || field.type === 'currency'"
            :value="typeof fields[field.name] === 'number' ? (fields[field.name] as number) : null"
            :disabled="readonly"
            :placeholder="field.label"
            style="width: 100%;"
            @update:value="(v) => setField(field.name, v)"
          />
          <NDatePicker
            v-else-if="field.type === 'date'"
            :value="typeof fields[field.name] === 'string' && fields[field.name] ? new Date(fields[field.name] as string).getTime() : null"
            :disabled="readonly"
            type="date"
            style="width: 100%;"
            @update:value="(v) => setField(field.name, v ? new Date(v).toISOString().slice(0, 10) : null)"
          />
          <NSelect
            v-else-if="field.type === 'select'"
            :value="fields[field.name] != null ? String(fields[field.name]) : null"
            :disabled="readonly"
            :options="(field.options ?? []).map((o) => ({ label: o, value: o }))"
            :placeholder="field.label"
            @update:value="(v) => setField(field.name, v)"
          />
        </NFormItem>
      </NForm>
    </NCard>
    <NAlert v-else type="info" style="margin-bottom: 12px;">
      This step has no local fields — only row selections and binding inputs below.
    </NAlert>

    <!-- (b) row selectors for template loop sources -->
    <NCard v-if="showRowSection" title="Row selections" size="small" style="margin-bottom: 12px;">
      <div v-if="selectionKeys.length === 0">
        <NText depth="3">No rows selected yet. Pick a table to add its rows to this step.</NText>
      </div>
      <div v-for="key in selectionKeys" :key="key" style="margin-bottom: 8px;">
        <NSpace vertical style="width: 100%;">
          <NSpace justify="space-between" align="center">
            <NText strong>{{ key }}</NText>
            <NButton v-if="!readonly" size="small" quaternary type="error" @click="removeSelection(key)">
              Remove
            </NButton>
          </NSpace>
          <NSpin :show="!!rowsLoading[key]">
            <NSelect
              :value="rowSelections[key] ?? []"
              :disabled="readonly"
              multiple
              filterable
              :options="rowsByTable[key] ?? []"
              placeholder="Select rows"
              @update:value="(v) => setSelection(key, v)"
            />
          </NSpin>
        </NSpace>
        <NDivider style="margin: 8px 0;" />
      </div>
      <NSpace v-if="!readonly">
        <NSpin :show="tablesLoading">
          <NSelect
            v-model:value="addTable"
            :options="availableTables"
            placeholder="Add table…"
            filterable
            style="min-width: 220px;"
          />
        </NSpin>
        <NButton size="small" :disabled="!addTable" @click="handleAddTable">Add</NButton>
      </NSpace>
    </NCard>

    <!-- (c) manual binding inputs (Task 16 `manual` slots) -->
    <NCard v-if="manualKeys.length > 0" title="Manual inputs" size="small">
      <NForm label-placement="top">
        <NFormItem v-for="key in manualKeys" :key="key" :label="key">
          <NInput
            :value="manualInputs[key] != null ? String(manualInputs[key]) : ''"
            :disabled="readonly"
            :placeholder="key"
            @update:value="(v) => setManual(key, v)"
          />
        </NFormItem>
      </NForm>
    </NCard>
  </div>
</template>
