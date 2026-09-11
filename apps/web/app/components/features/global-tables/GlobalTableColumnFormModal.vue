<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NButton, NCheckbox,
  NCheckboxGroup, NRadioGroup, NRadio, NSpace, NTag, NAlert, useMessage, type FormInst, type FormRules,
} from 'naive-ui'
import { useGlobalTableColumnsStore } from '~/stores/global-table-columns'
import { useAuthStore } from '~/stores/auth'
import { getErrorMessage } from '~/utils/error'
import type { CreateGlobalTableColumn, UpdateGlobalTableColumn } from '~/shared/types/global-table-column'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  tableId: number
  column?: import('~/shared/types/global-table-column').GlobalTableColumn | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const message = import.meta.client ? useMessage() : null
const store = useGlobalTableColumnsStore()
const auth = useAuthStore()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)
const globalTables = ref<Array<{ id: number; name: string; displayName: string }>>([])
const targetColumns = ref<Array<{ name: string; displayName: string; type: string }>>([])
const testResult = ref<{ ok: boolean; msg: string } | null>(null)

const columnTypes = ['text', 'richtext', 'date', 'select', 'number', 'currency', 'image', 'hidden-computed', 'readonly-computed', 'select-table-relation', 'select-table-relation-multiple']

const form = ref({
  name: '',
  displayName: '',
  type: 'text' as typeof columnTypes[number],
  defaultValue: '',
  required: false,
  searchable: false,
  orderable: false,
  position: 0,
  options: '',
  format: '',
  expression: '',
  relationTableId: null as number | null,
  relationConfig: null as { displayColumns: string[]; separator: string; onTargetDelete: string } | null,
})

const relationDisplayColumns = computed<string[]>({
  get: () => form.value.relationConfig?.displayColumns ?? [],
  set: (val: string[]) => {
    if (form.value.relationConfig) {
      form.value.relationConfig.displayColumns = val
    }
  },
})

const relationSeparator = computed<string>({
  get: () => form.value.relationConfig?.separator ?? ' - ',
  set: (val: string) => {
    if (form.value.relationConfig) {
      form.value.relationConfig.separator = val
    }
  },
})

const relationOnTargetDelete = computed<string>({
  get: () => form.value.relationConfig?.onTargetDelete ?? 'restrict',
  set: (val: string) => {
    if (form.value.relationConfig) {
      form.value.relationConfig.onTargetDelete = val
    }
  },
})

const optionRules = computed(() => {
  if (form.value.type !== 'select') return []
  return [
    {
      validator: (_rule: unknown, value: string) => {
        const v = value ?? form.value.options
        if (!v || String(v).trim() === '') {
          return Promise.reject(new Error('Options wajib untuk type select — JSON [{label,value}]'))
        }
        try {
          const parsed = JSON.parse(String(v))
          if (!Array.isArray(parsed) || parsed.length === 0) {
            return Promise.reject(new Error('Options harus array JSON dengan minimal 1 opsi'))
          }
          const vals = parsed.map((o: any) => o?.value)
          if (vals.some((x: any) => x === undefined || x === null || String(x).trim() === '')) {
            return Promise.reject(new Error('Setiap opsi harus punya value'))
          }
          if (new Set(vals.map((x: any) => String(x))).size !== vals.length) {
            return Promise.reject(new Error('value opsi harus unik'))
          }
          return Promise.resolve()
        } catch (e: any) {
          if (e?.message?.includes('value opsi') || e?.message?.includes('Options')) return Promise.reject(e)
          return Promise.reject(new Error('Format options tidak valid — JSON [{label,value}]'))
        }
      },
      trigger: ['blur', 'input', 'change'],
    },
  ] as any
})

const expressionDeps = computed(() => {
  const expr = form.value.expression || ''
  const m = [...expr.matchAll(/\{\{\s*(\w+)\s*\}\}/g)]
  return m.map(x => x[1]).filter((v, i, a) => a.indexOf(v) === i)
})

const rules = computed<FormRules>(() => ({
  name: [
    { required: true, message: 'Name is required', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string) => {
        if (!value) return Promise.resolve()
        if (!/^[a-z][a-z0-9_]*$/.test(value)) {
          return Promise.reject(new Error('Use snake_case: start with a letter, lowercase letters, numbers, underscores (max 64)'))
        }
        return Promise.resolve()
      },
      trigger: 'blur',
    },
  ],
  displayName: { required: true, message: 'Display name is required', trigger: 'blur' },
  type: { required: true, message: 'Type is required', trigger: 'change' },
  expression: {
    validator: (_rule: unknown, value: string) => {
      if (['hidden-computed', 'readonly-computed'].includes(form.value.type)) {
        if (!value || value.trim() === '') {
          return Promise.reject(new Error('Expression is required for computed columns'))
        }
      }
      return Promise.resolve()
    },
    trigger: 'blur',
  },
}))

const title = computed(() => props.mode === 'create' ? 'Tambah Kolom' : 'Ubah Kolom')

function isRelationalType(type: string): boolean {
  return type === 'select-table-relation' || type === 'select-table-relation-multiple'
}

async function loadGlobalTables() {
  try {
    const response = await $fetch<any>(
      '/api/global-tables',
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    )
    const list = Array.isArray(response) ? response : (response?.data ?? [])
    globalTables.value = list
  } catch (e) {
    console.error('Failed to load global tables', e)
  }
}

async function loadTargetColumns(tableId: number) {
  if (!tableId) {
    targetColumns.value = []
    return
  }
  try {
    const response = await $fetch<any>(
      `/api/global-tables/${tableId}/columns`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    )
    const list = Array.isArray(response) ? response : (response?.data ?? [])
    targetColumns.value = (list as any[]).filter(
      c => c.type !== 'hidden-computed' && c.type !== 'readonly-computed'
    )
  } catch (e) {
    console.error('Failed to load target columns', e)
  }
}

function getGlobalTablesMap(): Array<{ label: string; value: number }> {
  return globalTables.value.map(t => ({ label: t.displayName || t.name, value: t.id }))
}

async function handleTestExpression() {
  testResult.value = null
  const expr = form.value.expression?.trim()
  if (!expr) {
    testResult.value = { ok: false, msg: 'Expression kosong' }
    return
  }
  try {
    const res = await $fetch<any>('/api/expressions/validate', {
      method: 'POST',
      body: { expression: expr, sampleContext: {} },
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    if (res?.valid === false) {
      testResult.value = { ok: false, msg: res?.error || 'Ekspresi tidak valid' }
    } else {
      testResult.value = { ok: true, msg: res?.error ? `Valid — ${res.error}` : 'Ekspresi valid' }
    }
  } catch (e: any) {
    testResult.value = { ok: false, msg: getErrorMessage(e, 'Ekspresi tidak valid') }
  }
}

watch(() => props.visible, async (val) => {
  if (val) {
    testResult.value = null
    await loadGlobalTables()
    if (props.mode === 'edit' && props.column) {
      form.value = {
        name: props.column.name,
        displayName: props.column.displayName,
        type: props.column.type,
        defaultValue: props.column.defaultValue ?? '',
        required: props.column.required,
        searchable: props.column.searchable,
        orderable: props.column.orderable,
        position: props.column.position,
        options: props.column.options ?? '',
        format: props.column.format ?? '',
        expression: props.column.expression ?? '',
        relationTableId: props.column.relationTableId ?? null,
        relationConfig: props.column.relationConfig
          ? {
              displayColumns: props.column.relationConfig.displayColumns,
              separator: props.column.relationConfig.separator || ' - ',
              onTargetDelete: props.column.relationConfig.onTargetDelete || 'restrict',
            }
          : null,
      }
      if (props.column.relationTableId) {
        await loadTargetColumns(props.column.relationTableId)
      }
    } else {
      form.value = {
        name: '',
        displayName: '',
        type: 'text',
        defaultValue: '',
        required: false,
        searchable: false,
        orderable: false,
        position: 0,
        options: '',
        format: '',
        expression: '',
        relationTableId: null,
        relationConfig: null,
      }
    }
  }
})

watch(() => form.value.type, (newType) => {
  testResult.value = null
  if (!isRelationalType(newType)) {
    form.value.relationTableId = null
    form.value.relationConfig = null
  } else {
    if (!form.value.relationConfig) {
      form.value.relationConfig = { displayColumns: [], separator: ' - ', onTargetDelete: 'restrict' }
    }
  }
})

watch(() => form.value.relationTableId, async (newId) => {
  if (newId) {
    await loadTargetColumns(newId)
    if (form.value.relationConfig && form.value.relationConfig.displayColumns.length === 0) {
      const available = targetColumns.value.map(c => c.name)
      if (available.length > 0) {
        form.value.relationConfig.displayColumns = available.slice(0, Math.min(3, available.length))
      }
    }
  } else {
    targetColumns.value = []
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
    const payload: any = { ...form.value }
    // Ensure relationConfig sent as expected by service (object or JSON string both accepted; keep object)
    if (props.mode === 'create') {
      await store.create(props.tableId, payload as CreateGlobalTableColumn)
      message?.success('Kolom berhasil dibuat')
    } else if (props.column) {
      await store.update(props.column.id, { ...payload, globalTableId: props.tableId } as any)
      message?.success('Kolom berhasil diperbarui')
    }
    emit('update:visible', false)
    emit('success')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Gagal menyimpan kolom'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <NModal
    :show="visible"
    preset="card"
    :title="title"
    style="width: min(640px, 90vw)"
    class="max-w-2xl"
    :bordered="false"
    @update:show="(v) => emit('update:visible', v)"
  >
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top" require-mark-placement="right-hanging">
      <NFormItem label="Name" path="name">
        <NInput
          v-model:value="form.name"
          placeholder="e.g. pegawai_role"
          :disabled="props.mode === 'edit'"
          style="font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;"
        />
        <template #feedback>
          <span style="font-size: 12px; color: #94a3b8">snake_case, start with letter</span>
        </template>
      </NFormItem>
      <NFormItem label="Display Name" path="displayName">
        <NInput v-model:value="form.displayName" placeholder="Nama tampilan kolom" />
      </NFormItem>
      <NFormItem label="Type" path="type">
        <NSelect
          v-model:value="form.type"
          :options="columnTypes.map(type => ({ label: type, value: type }))"
          filterable
          style="width: 100%"
        />
      </NFormItem>

      <!-- Relation sections — v-if mount bersyarat -->
      <template v-if="isRelationalType(form.type)">
        <NFormItem label="Relation Table" path="relationTableId">
          <NSelect
            v-model:value="form.relationTableId"
            :options="getGlobalTablesMap()"
            filterable
            style="width: 100%"
            placeholder="Pilih tabel target"
          />
        </NFormItem>
        <NFormItem label="Display Columns" path="relationConfig.displayColumns">
          <NCheckboxGroup v-model:value="relationDisplayColumns">
            <NSpace vertical size="small" style="width: 100%">
              <NCheckbox
                v-for="col in targetColumns"
                :key="col.name"
                :value="col.name"
                :label="col.name"
              />
              <span v-if="targetColumns.length===0" style="font-size:12px;color:#94a3b8">Pilih tabel target dulu — tidak ada kolom</span>
            </NSpace>
          </NCheckboxGroup>
          <template #feedback>
            <span style="font-size:12px;color:#94a3b8">Minimal 1 kolom untuk label relation</span>
          </template>
        </NFormItem>
        <NFormItem label="Separator" path="relationConfig.separator">
          <NInput v-model:value="relationSeparator" placeholder=" - " />
        </NFormItem>
        <NFormItem label="On Target Delete" path="relationConfig.onTargetDelete">
          <NRadioGroup v-model:value="relationOnTargetDelete">
            <NSpace>
              <NRadio value="restrict">Restrict</NRadio>
              <NRadio value="detach">Detach</NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItem>
      </template>

      <!-- Computed sections -->
      <template v-if="form.type === 'hidden-computed' || form.type === 'readonly-computed'">
        <NFormItem label="Expression" path="expression">
          <NInput
            v-model:value="form.expression"
            placeholder="e.g. {{harga}} * {{jumlah}}"
            style="font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
          <template #feedback>
            <div class="text-xs mt-1" style="color:#94a3b8">
              Gunakan syntax {{field}}. Referensi harus kolom sibling.
            </div>
          </template>
        </NFormItem>
        <div v-if="expressionDeps.length" class="mb-3 flex flex-wrap items-center gap-2">
          <NTag v-for="dep in expressionDeps" :key="dep" type="info" size="small">{{ dep }}</NTag>
          <NButton size="small" secondary @click="handleTestExpression">▶ Uji ekspresi</NButton>
        </div>
        <div v-else-if="form.expression" class="mb-3">
          <NButton size="small" secondary @click="handleTestExpression">▶ Uji ekspresi</NButton>
        </div>
        <NAlert v-if="testResult" :type="testResult.ok ? 'success' : 'error'" style="margin-bottom:12px" closable @close="testResult=null">
          {{ testResult.msg }}
        </NAlert>
      </template>

      <!-- Select options — v-if -->
      <NFormItem
        v-if="form.type === 'select'"
        label="Options (JSON)"
        path="options"
        :rule="optionRules"
      >
        <NInput
          v-model:value="form.options"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder='[{"label": "Option 1", "value": "opt1"}, {"label": "Option 2", "value": "opt2"}]'
          style="font-family: 'SF Mono', monospace"
        />
        <template #feedback>
          <span style="font-size:12px;color:#94a3b8">JSON array [{label,value}] — value harus unik</span>
        </template>
      </NFormItem>

      <!-- Date format — v-if -->
      <NFormItem
        v-if="form.type === 'date'"
        label="Format"
      >
        <NInput v-model:value="form.format" placeholder="m-d-Y atau gunakan Date type" />
      </NFormItem>

      <!-- Common -->
      <NFormItem label="Default Value">
        <NInput v-model:value="form.defaultValue" placeholder="Nilai default (opsional)" />
      </NFormItem>
      <NFormItem label="Required" path="required">
        <NCheckbox v-model:checked="form.required">Required</NCheckbox>
      </NFormItem>
      <NFormItem label="Searchable" path="searchable">
        <NCheckbox v-model:checked="form.searchable">Searchable</NCheckbox>
      </NFormItem>
      <NFormItem label="Orderable" path="orderable">
        <NCheckbox v-model:checked="form.orderable">Orderable</NCheckbox>
      </NFormItem>
      <NFormItem label="Position" path="position">
        <NInputNumber v-model:value="form.position" :min="0" clearable placeholder="Urutan" style="width:100%" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('update:visible', false)">Batal</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">
          {{ mode === 'create' ? 'Buat' : 'Simpan' }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
