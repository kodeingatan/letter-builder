<script setup lang="ts">
import { h, onMounted, computed } from 'vue'
import { NTag, NSpace, NText, NButton, NPopconfirm, NIcon, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit, View } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { usePermissionsStore } from '~/stores/permissions'
import type { Permission } from '~/shared/types/permission'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', permission: Permission): void
  (e: 'detail', permission: Permission): void
}>()

const store = usePermissionsStore()
const message = import.meta.client ? useMessage() : null

const columns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  { key: 'permissionName', title: 'Permission Name', sortable: true, searchable: true },
  { key: 'description', title: 'Description', searchable: true, ellipsis: { tooltip: true } },
  {
    key: 'methods',
    title: 'Methods',
    render(row: Permission) {
      if (!row.methods?.length) return h(NText, { depth: 3 }, () => '-')
      return h(NSpace, { size: 4 }, () =>
        row.methods.map((m) =>
          h(NTag, { key: m.id, size: 'small', type: 'success', bordered: false }, () => m.method)
        )
      )
    },
  },
  {
    key: 'urls',
    title: 'URLs',
    render(row: Permission) {
      if (!row.urls?.length) return h(NText, { depth: 3 }, () => '-')
      return h(NSpace, { size: 4 }, () =>
        row.urls.slice(0, 3).map((u) =>
          h(NTag, { key: u.id, size: 'small', type: 'info', bordered: false }, () => u.url)
        )
      )
    },
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 160,
    render(row: Permission) {
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
            default: () => `Delete permission "${row.permissionName}"?`,
          }
        ),
      ])
    },
  },
])

const searchableFields = [
  { label: 'All Fields', value: '' },
  { label: 'Permission Name', value: 'permissionName' },
  { label: 'Description', value: 'description' },
]

async function handleDelete(id: number) {
  try {
    await store.remove(id)
    message?.success('Permission deleted')
  } catch {
    message?.error('Failed to delete permission')
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
      :data="store.permissions"
      :loading="store.loading"
      :page="store.page"
      :limit="store.limit"
      :total="store.total"
      :sort-by="store.sortBy"
      :sort-order="store.sortOrder"
      search-placeholder="Search permissions..."
      :searchable-fields="searchableFields"
      empty-description="Belum ada permission"
      empty-cta-label="+ Buat Permission"
      @search="handleSearch"
      @search-field-change="handleSearchField"
      @empty-cta="emit('create')"
      @update:page="handlePageChange"
      @update:limit="handleLimitChange"
      @sort-change="handleSortChange"
    >
      <template #toolbar>
        <NButton type="primary" @click="emit('create')">
          <template #icon><NIcon><Add /></NIcon></template>
          Add Permission
        </NButton>
      </template>
    </DataTable>
  </div>
</template>
