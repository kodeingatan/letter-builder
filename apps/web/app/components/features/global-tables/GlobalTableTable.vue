<script setup lang="ts">
import { h, onMounted, computed } from 'vue'
import { NText, NButton, NSpace, NPopconfirm, NIcon, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit, View } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { useGlobalTablesStore } from '~/stores/globalTables'
import { getErrorMessage } from '~/utils/error'
import type { GlobalTable } from '~/shared/types/global-table'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', table: GlobalTable): void
  (e: 'detail', table: GlobalTable): void
}>()

const store = useGlobalTablesStore()
const message = import.meta.client ? useMessage() : null

const columns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    searchable: true,
    render(row: GlobalTable) {
      return h(NText, { code: true }, () => row.name)
    },
  },
  { key: 'displayName', title: 'Display Name', sortable: true, searchable: true },
  {
    key: 'actions',
    title: 'Actions',
    width: 160,
    render(row: GlobalTable) {
      return h(NSpace, { size: 4 }, () => [
        h(NButton, {
          size: 'small', quaternary: true, type: 'info',
          onClick: () => emit('detail', row),
        }, { default: () => h(NIcon, null, { default: () => h(View) }) }),
        h(NButton, {
          size: 'small', quaternary: true, type: 'warning',
          onClick: () => emit('edit', row),
        }, { default: () => h(NIcon, null, { default: () => h(Edit) }) }),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDelete(row.id) },
          {
            trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' }, { default: () => h(NIcon, null, { default: () => h(TrashCan) }) }),
            default: () => `Delete global table "${row.name}"?`,
          }
        ),
      ])
    },
  },
])

const searchableFields = [
  { label: 'All Fields', value: '' },
  { label: 'Name', value: 'name' },
  { label: 'Display Name', value: 'displayName' },
]

async function handleDelete(id: number) {
  try {
    await store.remove(id)
    message?.success('Global table deleted')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to delete global table'))
  }
}

function handleSearch(value: string) {
  store.setSearch(value)
  store.fetchAll()
}

function handleSearchField(field: string) {
  store.setSearchField(field)
  store.fetchAll()
}

function handlePageChange(p: number) {
  store.setPage(p)
  store.fetchAll()
}

function handleLimitChange(l: number) {
  store.setLimit(l)
  store.fetchAll()
}

function handleSortChange(sorter: { columnKey: string; order: 'ascend' | 'descend' | false }) {
  if (!sorter.order) {
    store.setSort('id')
  } else {
    store.setSort(sorter.columnKey)
  }
  store.fetchAll()
}

onMounted(() => {
  store.fetchAll()
})
</script>

<template>
  <div>
    <DataTable
      :columns="columns"
      :data="store.globalTables"
      :loading="store.loading"
      :page="store.page"
      :limit="store.limit"
      :total="store.total"
      :sort-by="store.sortBy"
      :sort-order="store.sortOrder"
      search-placeholder="Search global tables..."
      :searchable-fields="searchableFields"
      @search="handleSearch"
      @search-field-change="handleSearchField"
      @update:page="handlePageChange"
      @update:limit="handleLimitChange"
      @sort-change="handleSortChange"
    >
      <template #toolbar>
        <NButton type="primary" @click="emit('create')">
          <template #icon><NIcon><Add /></NIcon></template>
          Add Global Table
        </NButton>
      </template>
    </DataTable>
  </div>
</template>
