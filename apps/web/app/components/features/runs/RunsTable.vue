<script setup lang="ts">
import { h, computed, onMounted } from 'vue'
import { NText, NButton, NSpace, NTag, NIcon, useMessage } from 'naive-ui'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { useRunsStore } from '~/stores/runs'
import { getErrorMessage } from '~/utils/error'
import type { AdministrationRunListItem } from '~/shared/types/run'

const emit = defineEmits<{
  (e: 'resume', run: AdministrationRunListItem): void
}>()

const store = useRunsStore()
const message = import.meta.client ? useMessage() : null

function statusType(status: string) {
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'warning'
  return 'info'
}

function formatDate(value: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

const columns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  {
    key: 'administrationName',
    title: 'Administration',
    searchable: true,
    render(row: AdministrationRunListItem) {
      return h(NText, { strong: true }, () => row.administrationName ?? `#${row.administrationId}`)
    },
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    width: 130,
    render(row: AdministrationRunListItem) {
      return h(NTag, { type: statusType(row.status), size: 'small', bordered: false }, () => row.status)
    },
  },
  {
    key: 'startedAt',
    title: 'Started',
    sortable: true,
    width: 180,
    render(row: AdministrationRunListItem) {
      return h(NText, null, () => formatDate(row.startedAt))
    },
  },
  {
    key: 'completedAt',
    title: 'Completed',
    sortable: true,
    width: 180,
    render(row: AdministrationRunListItem) {
      return h(NText, null, () => formatDate(row.completedAt))
    },
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 160,
    render(row: AdministrationRunListItem) {
      return h(NSpace, { size: 4 }, () => [
        h(NButton, {
          size: 'small', quaternary: true, type: 'primary',
          onClick: () => emit('resume', row),
        }, { default: () => (row.status === 'in_progress' ? 'Resume' : 'View') }),
      ])
    },
  },
])

const searchableFields = [
  { label: 'All Fields', value: '' },
  { label: 'Administration', value: 'name' },
  { label: 'Status', value: 'status' },
]

function handleSearch(value: string) {
  store.setSearch(value)
  void store.fetchMine()
}

function handleSearchField(field: string) {
  store.setSearchField(field)
  void store.fetchMine()
}

function handlePageChange(p: number) {
  store.setPage(p)
  void store.fetchMine()
}

function handleLimitChange(l: number) {
  store.setLimit(l)
  void store.fetchMine()
}

function handleSortChange(sorter: { columnKey: string; order: 'ascend' | 'descend' | false }) {
  if (!sorter.order) store.setSort('id')
  else store.setSort(sorter.columnKey)
  void store.fetchMine()
}

onMounted(() => {
  void store.fetchMine()
})
</script>

<template>
  <DataTable
    :columns="columns"
    :data="store.runs"
    :loading="store.loading"
    :page="store.page"
    :limit="store.limit"
    :total="store.total"
    :sort-by="store.sortBy"
    :sort-order="store.sortOrder"
    search-placeholder="Search runs..."
    :searchable-fields="searchableFields"
    storage-key="datatable-runs-hidden-columns"
    empty-description="No runs yet — start one from an Administration."
    @search="handleSearch"
    @search-field-change="handleSearchField"
    @update:page="handlePageChange"
    @update:limit="handleLimitChange"
    @sort-change="handleSortChange"
  />
</template>
