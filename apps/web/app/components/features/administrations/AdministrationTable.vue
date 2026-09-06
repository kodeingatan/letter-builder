<script setup lang="ts">
import { h, onMounted, computed } from 'vue'
import { NText, NButton, NSpace, NPopconfirm, NIcon, NTag, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit, View } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { useAdministrationsStore } from '~/stores/administrations'
import { getErrorMessage } from '~/utils/error'
import type { AdministrationListItem } from '~/shared/types/administration'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', administration: AdministrationListItem): void
  (e: 'detail', administration: AdministrationListItem): void
  (e: 'open', administration: AdministrationListItem): void
}>()

const store = useAdministrationsStore()
const message = import.meta.client ? useMessage() : null

function statusType(status: string) {
  if (status === 'published') return 'success'
  if (status === 'archived') return 'warning'
  return 'default'
}

const columns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    searchable: true,
    render(row: AdministrationListItem) {
      return h(NText, { strong: true }, () => row.name)
    },
  },
  {
    key: 'version',
    title: 'Version',
    sortable: true,
    width: 90,
    render(row: AdministrationListItem) {
      return h(NTag, { size: 'small', bordered: false }, () => `v${row.version}`)
    },
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    width: 120,
    render(row: AdministrationListItem) {
      return h(NTag, { type: statusType(row.status), size: 'small', bordered: false }, () => row.status)
    },
  },
  {
    key: 'stepCount',
    title: 'Steps',
    width: 80,
    render(row: AdministrationListItem) {
      return h(NText, { code: true }, () => `${row.stepCount ?? 0}`)
    },
  },
  {
    key: 'docsCount',
    title: 'Docs',
    width: 80,
    render(row: AdministrationListItem) {
      return h(NText, { code: true }, () => `${row.docsCount ?? row.documentCount ?? 0}`)
    },
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 200,
    render(row: AdministrationListItem) {
      return h(NSpace, { size: 4 }, () => [
        h(NButton, {
          size: 'small', quaternary: true, type: 'info',
          onClick: () => emit('detail', row),
        }, { default: () => h(NIcon, null, { default: () => h(View) }) }),
        h(NButton, {
          size: 'small', quaternary: true, type: 'primary',
          onClick: () => emit('open', row),
        }, { default: () => 'Open' }),
        h(NButton, {
          size: 'small', quaternary: true, type: 'warning',
          onClick: () => emit('edit', row),
        }, { default: () => h(NIcon, null, { default: () => h(Edit) }) }),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDelete(row.id) },
          {
            trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' }, { default: () => h(NIcon, null, { default: () => h(TrashCan) }) }),
            default: () => `Delete administration "${row.name}"? Blocked when it has documents (archive instead).`,
          },
        ),
      ])
    },
  },
])

const searchableFields = [
  { label: 'All Fields', value: '' },
  { label: 'Name', value: 'name' },
  { label: 'Description', value: 'description' },
  { label: 'Status', value: 'status' },
]

async function handleDelete(id: number) {
  try {
    await store.remove(id)
    message?.success('Administration deleted')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to delete administration'))
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
      :data="store.administrations"
      :loading="store.loading"
      :page="store.page"
      :limit="store.limit"
      :total="store.total"
      :sort-by="store.sortBy"
      :sort-order="store.sortOrder"
      search-placeholder="Search administrations..."
      :searchable-fields="searchableFields"
      storage-key="datatable-administrations-hidden-columns"
      empty-description="No administrations yet — create Surat Perjalanan Dinas first"
      @search="handleSearch"
      @search-field-change="handleSearchField"
      @update:page="handlePageChange"
      @update:limit="handleLimitChange"
      @sort-change="handleSortChange"
    >
      <template #toolbar>
        <NButton type="primary" @click="emit('create')">
          <template #icon><NIcon><Add /></NIcon></template>
          Add Administration
        </NButton>
      </template>
    </DataTable>
  </div>
</template>
