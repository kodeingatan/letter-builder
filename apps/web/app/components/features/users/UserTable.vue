<script setup lang="ts">
import { h, onMounted, computed } from 'vue'
import { NTag, NSpace, NText, NButton, NPopconfirm, NIcon, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit, View } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { useUsersStore } from '~/stores/users'
import type { User } from '~/shared/types/user'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', user: User): void
  (e: 'detail', user: User): void
}>()

const store = useUsersStore()
const message = import.meta.client ? useMessage() : null

const columns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  { key: 'firstName', title: 'First Name', sortable: true, searchable: true },
  { key: 'lastName', title: 'Last Name', sortable: true, searchable: true },
  { key: 'username', title: 'Username', sortable: true, searchable: true },
  { key: 'email', title: 'Email', sortable: true, searchable: true },
  {
    key: 'roles',
    title: 'Roles',
    render(row: User) {
      if (!row.roles?.length) return h(NText, { depth: 3 }, () => '-')
      return h(NSpace, { size: 4 }, () =>
        row.roles.map((role) =>
          h(NTag, { key: role.id, size: 'small', type: 'info', bordered: false }, () => role.roleName)
        )
      )
    },
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 160,
    render(row: User) {
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
            default: () => `Delete user "${row.firstName} ${row.lastName}"?`,
          }
        ),
      ])
    },
  },
])

const searchableFields = [
  { label: 'All Fields', value: '' },
  { label: 'First Name', value: 'firstName' },
  { label: 'Last Name', value: 'lastName' },
  { label: 'Username', value: 'username' },
  { label: 'Email', value: 'email' },
]

async function handleDelete(id: number) {
  try {
    await store.remove(id)
    message.success('User deleted')
  } catch {
    message.error('Failed to delete user')
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
      :data="store.users"
      :loading="store.loading"
      :page="store.page"
      :limit="store.limit"
      :total="store.total"
      :sort-by="store.sortBy"
      :sort-order="store.sortOrder"
      search-placeholder="Search users..."
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
          Add User
        </NButton>
      </template>
    </DataTable>
  </div>
</template>
