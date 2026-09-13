<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { NModal, NInput, NButton, NSpace, NDataTable, NAlert, type DataTableColumns } from 'naive-ui'
import { useMasterDataStore } from '~/stores/master-data'
import { useAuthStore } from '~/stores/auth'
import { getErrorMessage } from '~/utils/error'
import type { MasterTableSchema } from '~/shared/types/master-data'

const props = defineProps<{
  visible: boolean
  targetSlug: string
  multiple: boolean
  selected: number[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', ids: number[]): void
}>()

const store = useMasterDataStore()
const search = ref('')
const checked = ref<number[]>([...props.selected])
const schema = ref<MasterTableSchema | null>(null)
const rows = ref<Array<Record<string, unknown>>>([])
const loading = ref(false)
const loadError = ref<string | null>(null)
let debounce: ReturnType<typeof setTimeout> | null = null

const displayColumn = computed(() => {
  const cols = schema.value?.columns ?? []
  return cols.find((c) => c.is_searchable)?.name ?? cols[0]?.name ?? 'id'
})

const columns = computed<DataTableColumns<Record<string, unknown>>>(() => [
  { type: 'selection', disabled: (row: Record<string, unknown>) => !props.multiple && checked.value.length > 0 && !checked.value.includes(Number(row.id)) },
  { key: 'id', title: 'ID', width: 70, sorter: true },
  ...(schema.value?.columns.slice(0, 4).map((col) => ({
    key: col.name, title: col.display_name,
    render: (row: Record<string, unknown>) => String(row[col.name] ?? '—'),
  })) ?? []),
])

async function load() {
  if (!props.targetSlug) return
  loading.value = true
  loadError.value = null
  try {
    schema.value = await store.fetchSchema(props.targetSlug)
    const res = await $fetch<{ data: Array<Record<string, unknown>> }>(`/api/master-data/${props.targetSlug}/rows`, {
      params: { page: 1, limit: 20, ...(search.value ? { search: search.value } : {}) },
      headers: { Authorization: `Bearer ${useAuthStore().token}` },
    })
    rows.value = res.data
  } catch (e) {
    loadError.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (v) => {
  if (v) {
    checked.value = [...props.selected]
    search.value = ''
    load()
  }
})

function onSearch(v: string) {
  search.value = v
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(load, 300)
}

function handleCheck(keys: Array<string | number>) {
  const ids = keys.map(Number)
  checked.value = props.multiple ? ids : ids.slice(-1)
}

function confirm() {
  emit('confirm', checked.value)
  emit('update:visible', false)
}
</script>

<template>
  <NModal :show="visible" preset="card" title="Pilih Data Relasi" class="max-w-2xl modal-card" :bordered="false" @update:show="(v: boolean) => emit('update:visible', v)">
    <NAlert v-if="loadError" type="error" class="mb-3">{{ loadError }}</NAlert>
    <NInput :value="search" placeholder="Cari..." clearable class="mb-3" @update:value="onSearch" />
    <NDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :row-key="(row: Record<string, unknown>) => Number(row.id)"
      :checked-row-keys="checked"
      @update:checked-row-keys="handleCheck"
    />
    <p class="mt-2 text-sm opacity-70">Kolom label: {{ displayColumn }} — {{ multiple ? 'boleh banyak' : 'pilih satu' }}</p>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('update:visible', false)">Batal</NButton>
        <NButton type="primary" @click="confirm">Pilih ({{ checked.length }})</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
