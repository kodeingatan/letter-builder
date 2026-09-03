<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, watch, onMounted } from 'vue'
import {
  NDataTable, NInput, NButton, NSpace, NSpin, NEmpty, NPopover,
  NCheckbox, NSelect,
  type DataTableColumns, type PaginationProps, type DataTableSortState,
} from 'naive-ui'
import { Search, Reset, Settings } from '@vicons/carbon'

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
}>(), {
  loading: false,
  page: 1,
  limit: 20,
  total: 0,
  searchPlaceholder: 'Search...',
  sortBy: 'id',
  sortOrder: 'DESC',
})

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:limit', limit: number): void
  (e: 'search', value: string): void
  (e: 'search-field-change', field: string): void
  (e: 'sort-change', sorter: { columnKey: string; order: 'ascend' | 'descend' | false }): void
}>()

const searchText = ref('')
const searchField = ref<string | undefined>(undefined)

const STORAGE_KEY = 'datatable-hidden-columns'
const hiddenColumns = ref<Set<string>>(new Set())

onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      hiddenColumns.value = new Set(JSON.parse(stored))
    }
  } catch {
    // ignore
  }
})

watch(hiddenColumns, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...val]))
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
  localStorage.removeItem(STORAGE_KEY)
  emit('search', '')
  emit('search-field-change', '')
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 flex-1">
        <NInput
          :value="searchText"
          :placeholder="searchPlaceholder"
          clearable
          @update:value="handleSearch"
          style="min-width: 280px; flex: 1"
        >
          <template #prefix>
            <Search />
          </template>
        </NInput>

        <NSelect
          v-if="searchableFields?.length"
          :value="searchField"
          :options="searchableFields"
          placeholder="All fields"
          clearable
          @update:value="handleSearchFieldChange"
          style="width: 140px"
        />

        <NButton
          quaternary
          circle
          @click="resetFilters"
          title="Reset filters"
        >
          <template #icon><Reset /></template>
        </NButton>
      </div>

      <NSpace align="center">
        <slot name="toolbar" />

        <NPopover trigger="click" placement="bottom-end" :width="220">
          <template #trigger>
            <NButton quaternary circle title="Column visibility">
              <template #icon><Settings /></template>
            </NButton>
          </template>
          <div class="space-y-2">
            <div class="text-sm font-medium text-gray-500">Columns</div>
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

    <NSpin :show="loading">
      <NDataTable
        :columns="uiColumns"
        :data="data"
        :pagination="pagination"
        :row-key="(row: T) => row.id"
        :single-line="false"
        remote
        @update:page="(p) => emit('update:page', p)"
        @update:page-size="(s) => emit('update:limit', s)"
        @update:sorter="handleSorterChange"
      />
    </NSpin>

    <NEmpty v-if="!loading && data.length === 0" description="No data found" />

    <div v-if="total > 0" class="text-sm text-gray-500">
      Showing {{ (page - 1) * limit + 1 }}-{{ Math.min(page * limit, total) }} of {{ total }}
    </div>
  </div>
</template>
