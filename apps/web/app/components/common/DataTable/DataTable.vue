<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, watch, onMounted } from 'vue'
import {
  NDataTable, NInput, NButton, NSpace, NSpin, NEmpty, NPopover,
  NCheckbox, NSelect, NIcon, NAlert,
  type DataTableColumns, type PaginationProps, type DataTableSortState,
} from 'naive-ui'
import { Search, Reset, Settings, Restart } from '@vicons/carbon'

interface ColumnDef {
  key: string
  title: string
  sortable?: boolean
  searchable?: boolean
  visible?: boolean
  render?: (row: T) => any
  ellipsis?: { tooltip: boolean }
  width?: number
  fixed?: 'left' | 'right'
}

const props = withDefaults(defineProps<{
  columns: ColumnDef[]
  data: T[]
  loading?: boolean
  page?: number
  limit?: number
  total?: number
  searchPlaceholder?: string
  searchableFields?: { label: string; value: string }[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  storageKey?: string
  emptyDescription?: string
  error?: string | null
}>(), {
  loading: false,
  page: 1,
  limit: 20,
  total: 0,
  searchPlaceholder: 'Cari...',
  sortBy: 'id',
  sortOrder: 'DESC',
  storageKey: 'datatable-hidden-columns',
  emptyDescription: 'Belum ada data',
  error: null,
})

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:limit', limit: number): void
  (e: 'search', value: string): void
  (e: 'search-field-change', field: string): void
  (e: 'sort-change', sorter: { columnKey: string; order: 'ascend' | 'descend' | false }): void
  (e: 'refresh'): void
  (e: 'retry'): void
}>()

const searchText = ref('')
const searchField = ref<string | undefined>(undefined)

const STORAGE_KEY = computed(() => props.storageKey)
const hiddenColumns = ref<Set<string>>(new Set())

onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY.value)
    if (stored) {
      hiddenColumns.value = new Set(JSON.parse(stored))
    }
  } catch {
    // ignore
  }
})

watch(hiddenColumns, (val) => {
  localStorage.setItem(STORAGE_KEY.value, JSON.stringify([...val]))
}, { deep: true })

const visibleColumnDefs = computed(() =>
  props.columns.filter((c) => !hiddenColumns.value.has(c.key))
)

const uiColumns = computed<DataTableColumns<T>>(() =>
  visibleColumnDefs.value.map((col) => ({
    title: col.title,
    key: col.key,
    width: col.width,
    fixed: col.fixed,
    sorter: col.sortable,
    ellipsis: col.ellipsis,
    render: col.render,
  }))
)

const columnOptions = computed(() =>
  props.columns
    .filter((c) => c.key !== 'actions')
    .map((c) => ({ label: c.title, key: c.key }))
)

const pagination = computed<PaginationProps>(() => ({
  page: props.page,
  pageSize: props.limit,
  pageCount: Math.ceil(props.total / props.limit),
  itemCount: props.total,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
}))

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function handleSearch(value: string) {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchText.value = value
    emit('search', value)
  }, 300)
}

function handleSearchFieldChange(field: string | null) {
  searchField.value = field || undefined
  emit('search-field-change', field || '')
}

function handleSorterChange(sorter: DataTableSortState) {
  emit('sort-change', sorter as { columnKey: string; order: 'ascend' | 'descend' | false })
}

function toggleColumn(key: string) {
  const newSet = new Set(hiddenColumns.value)
  if (newSet.has(key)) {
    newSet.delete(key)
  } else {
    newSet.add(key)
  }
  hiddenColumns.value = newSet
}

function resetFilters() {
  searchText.value = ''
  searchField.value = undefined
  hiddenColumns.value = new Set()
  localStorage.removeItem(STORAGE_KEY.value)
  emit('search', '')
  emit('search-field-change', '')
}
</script>

<template>
  <div class="flex flex-col gap-4 datatable-notion">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3 flex-1 min-w-[320px]">
        <NInput
          :value="searchText"
          :placeholder="searchPlaceholder"
          clearable
          @update:value="handleSearch"
          style="min-width: 320px; flex: 1"
        >
          <template #prefix>
            <NIcon><Search /></NIcon>
          </template>
        </NInput>

        <NSelect
          v-if="searchableFields?.length"
          :value="searchField"
          :options="searchableFields"
          placeholder="Semua Kolom"
          clearable
          @update:value="handleSearchFieldChange"
          style="width: 160px"
        />

        <NButton
          quaternary
          circle
          aria-label="Segarkan data"
          title="Segarkan data"
          @click="emit('refresh')"
        >
          <template #icon><NIcon><Restart /></NIcon></template>
        </NButton>

        <NButton
          quaternary
          circle
          aria-label="Atur ulang filter"
          title="Atur ulang filter"
          @click="resetFilters"
        >
          <template #icon><NIcon><Reset /></NIcon></template>
        </NButton>
      </div>

      <NSpace align="center">
        <slot name="toolbar" />

        <NPopover trigger="click" placement="bottom-end" :width="220">
          <template #trigger>
            <NButton quaternary circle aria-label="Pengaturan kolom" title="Pengaturan kolom">
              <template #icon><NIcon><Settings /></NIcon></template>
            </NButton>
          </template>
          <div class="space-y-2">
            <div class="text-sm font-medium text-gray-500">Kolom</div>
            <div
              v-for="col in columnOptions"
              :key="col.key"
              class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
              @click="toggleColumn(col.key)"
            >
              <NCheckbox :checked="!hiddenColumns.has(col.key)" />
              <span class="text-sm">{{ col.label }}</span>
            </div>
          </div>
        </NPopover>
      </NSpace>
    </div>

    <NAlert
      v-if="error"
      type="error"
      closable
      style="margin-bottom: 12px;"
      @close="emit('retry')"
    >
      <template #header>Gagal memuat data</template>
      {{ error }}
      <NButton size="small" style="margin-left: 8px;" @click="emit('retry')">Coba lagi</NButton>
    </NAlert>

    <NSpin :show="loading">
      <NDataTable
        :columns="uiColumns"
        :data="data ?? []"
        :pagination="pagination"
        :row-key="(row: T) => row.id"
        :single-line="false"
        remote
        @update:page="(p) => emit('update:page', p)"
        @update:page-size="(s) => emit('update:limit', s)"
        @update:sorter="handleSorterChange"
      >
        <template #empty>
          <NEmpty v-if="!loading && !error" :description="emptyDescription" />
        </template>
      </NDataTable>
    </NSpin>

    <div v-if="total > 0" class="text-sm text-gray-500">
      Menampilkan {{ (page - 1) * limit + 1 }}-{{ Math.min(page * limit, total) }} dari {{ total }}
    </div>
  </div>
</template>

<style scoped>
.datatable-notion :deep(.n-data-table-th) {
  background-color: #f6f5f4;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.125px;
  text-transform: uppercase;
}
.datatable-notion :deep(.n-data-table-td) {
  padding: 12px 16px;
  border-bottom: 1px solid #e6e6e6;
}
</style>
