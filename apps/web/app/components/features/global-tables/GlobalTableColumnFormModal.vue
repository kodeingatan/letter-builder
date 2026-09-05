<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NSelect, NButton, NCheckbox,
  NSpace, NTag, NRadio, useMessage, type FormInst, type FormRules,
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

const message = useMessage()
const store = useGlobalTableColumnsStore()
const auth = useAuthStore()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)
const globalTables = ref<Array<{ id: number; name: string; displayName: string }>>([])
const targetColumns = ref<Array<{ name: string; displayName: string; type: string }>>([])

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

const relationConfig = computed({
  get: () => form.value.relationConfig,
  set: (val: { displayColumns: string[]; separator: string; onTargetDelete: string } | null) => {
    form.value.relationConfig = val
  },
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

const rules = computed<FormRules>(() => ({
  name: [
    { required: true, message: 'Name is required', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string) => {
        if (!value) return Promise.resolve()
        if (form.value.type !== 'select' && form.value.type !== 'number' && form.value.type !== 'currency') {
          if (!/^[a-z][a-z0-9_]*$/.test(value)) {
            return Promise.reject(new Error('Use snake_case: start with a letter, lowercase letters, numbers, underscores (max 64)'))
          }
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
  'relationConfig.displayColumns': [
    {
      validator: (_rule: unknown, value: string[]) => {
        if (isRelationalType(form.value.type) && (!value || value.length === 0)) {
          return Promise.reject(new Error('At least one display column is required'))
        }
        return Promise.resolve()
      },
      trigger: 'blur',
    }
  ],
}))

const title = computed(() => props.mode === 'create' ? 'Add Column' : 'Edit Column')

function isRelationalType(type: string): boolean {
  return type === 'select-table-relation' || type === 'select-table-relation-multiple'
}

async function loadGlobalTables() {
  try {
    const response = await $fetch<Array<{ id: number; name: string; displayName: string }>>(
      '/api/global-tables',
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    )
    globalTables.value = response
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
    const response = await $fetch<Array<{ name: string; displayName: string; type: string }>>(
      `/api/global-tables/${tableId}/columns`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    )
    targetColumns.value = response.filter(
      c => c.type !== 'hidden-computed' && c.type !== 'readonly-computed'
    )
  } catch (e) {
    console.error('Failed to load target columns', e)
  }
}

function getRelationDisplayColumns(tableId: number): string[] {
  return targetColumns.value.map(c => c.name)
}

function getGlobalTablesMap(): Array<{ label: string; value: number }> {
  return globalTables.value.map(t => ({ label: t.displayName || t.name, value: t.id }))
}

watch(() => props.visible, async (val) => {
  if (val) {
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
    store.fetchAll(props.tableId)
  }
})

watch(() => form.value.type, (newType) => {
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
    if (props.mode === 'create') {
      await store.create(props.tableId, form.value as CreateGlobalTableColumn)
      message.success('Column created')
    } else if (props.column) {
      await store.update(props.column.id, form.value as UpdateGlobalTableColumn)
      message.success('Column updated')
    }
    emit('update:visible', false)
    emit('success')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to save column'))
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
    class="max-w-md"
    :bordered="false"
  >
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <NFormItem label="Name" path="name">
        <NInput
          v-model:value="form.name"
          placeholder="e.g. pegawai_role"
          :disabled="props.mode === 'edit'"
          style="font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;"
        />
        <template #feedback>
          <span style="font-size: 12px; color: #666">snake_case, start with letter</span>
        </template>
      </NFormItem>
      <NFormItem label="Display Name" path="displayName">
        <NInput v-model:value="form.displayName" placeholder="Column display name" />
      </NFormItem>
      <NFormItem label="Type" path="type">
        <NSelect
          v-model:value="form.type"
          :options="columnTypes.map(type => ({ label: type, value: type }))"
          filterable
          style="width: 100%"
          @change="optionRules.value = {}"
        />
      </NFormItem>
      <NFormItem
        v-show="isRelationalType(form.type)"
        label="Relation Table"
        path="relationTableId"
      >
        <NSelect
          v-model:value="form.relationTableId"
          :options="getGlobalTablesMap()"
          filterable
          style="width: 100%"
          placeholder="Select target table"
        />
        <template #placeholder>
          <span>Select target table</span>
        </template>
      </NFormItem>
      <NFormItem
        v-show="isRelationalType(form.type)"
        label="Display Columns"
        path="relationConfig.displayColumns"
      >
        <NSpace vertical size="2" style="width: 100%">
          <NCheckbox
            v-for="(col, index) in getRelationDisplayColumns(form.relationTableId ?? 0)"
            :key="index"
            :value="relationDisplayColumns.includes(col)"
            @input="(val) => relationDisplayColumns = val ? [...relationDisplayColumns, col] : relationDisplayColumns.filter(c => c !== col)"
          >
            {{ col }}
          </NCheckbox>
        </NSpace>
      </NFormItem>
      <NFormItem
        v-show="isRelationalType(form.type)"
        label="Separator"
        path="relationConfig.separator"
      >
        <NInput v-model:value="relationSeparator" placeholder=" - " />
      </NFormItem>
      <NFormItem
        v-show="isRelationalType(form.type)"
        label="On Target Delete"
        path="relationConfig.onTargetDelete"
      >
        <NRadio
          v-model:value="relationOnTargetDelete"
          :options="[{ label: 'Restrict', value: 'restrict' }, { label: 'Detach', value: 'detach' }]"
        />
      </NFormItem>
      <NFormItem
        v-show="form.type === 'hidden-computed' || form.type === 'readonly-computed'"
        label="Expression"
        path="expression"
      >
        <NInput
          v-model:value="form.expression"
          placeholder="e.g. {{harga}} * {{jumlah}}"
          style="font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;"
        />
        <template #feedback>
          <div class="text-xs text-gray-500 mt-1">
            Use {{field}} syntax. References must be sibling columns.
          </div>
        </template>
      </NFormItem>
      <NFormItem
        label="Options (JSON)"
        :rules="optionRules"
        v-show="form.type === 'select'"
      >
        <NInput
          v-model:value="form.options"
          placeholder='[{"label": "Option 1", "value": "opt1"}, {"label": "Option 2", "value": "opt2"}]'
        />
      </NFormItem>
      <NFormItem
        label="Format"
        v-show="form.type === 'date'"
      >
        <NInput v-model:value="form.format" placeholder="m-d-Y" />
      </NFormItem>
      <NFormItem
        label="Default Value"
        :rules="form.required ? { required: true, message: 'Default value is required' } : undefined"
      >
        <NInput v-model:value="form.defaultValue" placeholder="Default value" />
      </NFormItem>
      <NFormItem label="Required" path="required">
        <NCheckbox v-model:value="form.required" />
      </NFormItem>
      <NFormItem label="Searchable" path="searchable">
        <NCheckbox v-model:value="form.searchable" />
      </NFormItem>
      <NFormItem label="Orderable" path="orderable">
        <NCheckbox v-model:value="form.orderable" />
      </NFormItem>
      <NFormItem label="Position" path="position">
        <NInput type="number" v-model:value="form.position" min="0" />
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