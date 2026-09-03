<script setup lang="ts">
import { h, onMounted, computed } from 'vue'
import { NTag, NSpace, NText, NButton, NPopconfirm, NIcon, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit, View } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { useRolesStore } from '~/stores/roles'
import type { Role } from '~/shared/types/role'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', role: Role): void
  (e: 'detail', role: Role): void
}>()

const store = useRolesStore()
const message = import.meta.client ? useMessage() : null

const columns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  { key: 'roleName', title: 'Role Name', sortable: true, searchable: true },
  { key: 'description', title: 'Description', searchable: true, ellipsis: { tooltip: true } },
  {
    key: 'guards',
    title: 'Guards',
    render(row: Role) {
      if (!row.guards?.length) return h(NText, { depth: 3 }, () => '-')
      return h(NSpace, { size: 4 }, () =>
        row.guards.map((g) =>
          h(NTag, { key: g.id, size: 'small', type: 'warning', bordered: false }, () => g.guardName)
        )
      )
    },
  },
  {
    key: 'permissions',
    title: 'Permissions',
    render(row: Role) {
      if (!row.permissions?.length) return h(NText, { depth: 3 }, () => '-')
      return h(NSpace, { size: 4 }, () =>
        row.permissions.map((p) =>
          h(NTag, { key: p.id, size: 'small', type: 'info', bordered: false }, () => p.permissionName)
        )
      )
    },
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 160,
    render(row: Role) {
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
            default: () => `Delete role "${row.roleName}"?`,
          }
        ),
      ])
    },
  },
])

const searchableFields = [
  { label: 'All Fields', value: '' },
  { label: 'Role Name', value: 'roleName' },
  { label: 'Description', value: 'description' },
]

async function handleDelete(id: number) {
  try {
    await store.remove(id)
    message?.success('Role deleted')
  } catch {
    message?.error('Failed to delete role')
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
      :data="store.roles"
      :loading="store.loading"
      :page="store.page"
      :limit="store.limit"
      :total="store.total"
      :sort-by="store.sortBy"
      :sort-order="store.sortOrder"
      search-placeholder="Search roles..."
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
          Add Role
        </NButton>
      </template>
    </DataTable>
  </div>
</template>
