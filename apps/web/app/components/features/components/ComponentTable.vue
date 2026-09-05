<script setup lang="ts">
import { h, onMounted, computed } from 'vue'
import { NText, NButton, NSpace, NPopconfirm, NIcon, NTag, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit, View } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { useComponentsStore } from '~/stores/components'
import { getErrorMessage } from '~/utils/error'
import type { ComponentListItem } from '~/shared/types/component'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', component: ComponentListItem): void
  (e: 'detail', component: ComponentListItem): void
}>()

const store = useComponentsStore()
const message = import.meta.client ? useMessage() : null

const columns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    searchable: true,
    render(row: ComponentListItem) {
      return h(NText, { strong: true }, () => row.name)
    },
  },
  {
    key: 'looping',
    title: 'Mode',
    width: 130,
    render(row: ComponentListItem) {
      return h(NTag, { type: row.looping ? 'warning' : 'info', size: 'small', bordered: false }, () =>
        row.looping ? 'Collection' : 'Single',
      )
    },
  },
  {
    key: 'requirementCount',
    title: 'Requirements',
    width: 120,
    render(row: ComponentListItem) {
      return h(NText, { code: true }, () => String(row.requirementCount ?? 0))
    },
  },
  {
    key: 'version',
    title: 'Version',
    sortable: true,
    width: 90,
    render(row: ComponentListItem) {
      return h(NTag, { size: 'small', bordered: false }, () => `v${row.version}`)
    },
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    width: 110,
    render(row: ComponentListItem) {
      return h(
        NTag,
        { type: row.status === 'published' ? 'success' : 'default', size: 'small', bordered: false },
        () => row.status,
      )
    },
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 160,
    render(row: ComponentListItem) {
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
            default: () => `Delete component "${row.name}"? Blocked when bound by a template.`,
          },
        ),
      ])
    },
  },
])

const searchableFields = [
  { label: 'All Fields', value: '' },
  { label: 'Name', value: 'name' },
  { label: 'Status', value: 'status' },
]

async function handleDelete(id: number) {
  try {
    await store.remove(id)
    message?.success('Component deleted')
  } catch (e: any) {
    const usedBy = e.data?.data?.usedBy as Array<{ name: string }> | undefined
    const detail = usedBy?.length ? `: bound by ${usedBy.map((t) => t.name).join(', ')}` : ''
    message?.error(getErrorMessage(e, 'Failed to delete component') + detail)
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
      :data="store.components"
      :loading="store.loading"
      :page="store.page"
      :limit="store.limit"
      :total="store.total"
      :sort-by="store.sortBy"
      :sort-order="store.sortOrder"
      search-placeholder="Search components..."
      :searchable-fields="searchableFields"
      storage-key="datatable-components-hidden-columns"
      empty-description="No components — create Kop Surat first"
      @search="handleSearch"
      @search-field-change="handleSearchField"
      @update:page="handlePageChange"
      @update:limit="handleLimitChange"
      @sort-change="handleSortChange"
    >
      <template #toolbar>
        <NButton type="primary" @click="emit('create')">
          <template #icon><NIcon><Add /></NIcon></template>
          Add Component
        </NButton>
      </template>
    </DataTable>
  </div>
</template>
