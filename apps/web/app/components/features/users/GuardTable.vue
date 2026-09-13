<script setup lang="ts">
import { h, onMounted, computed } from 'vue'
import { NTag, NSpace, NText, NButton, NPopconfirm, NIcon, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit, View } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { useGuardsStore } from '~/stores/guards'
import type { Guard } from '~/shared/types/guard'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', guard: Guard): void
  (e: 'detail', guard: Guard): void
}>()

const store = useGuardsStore()
const message = import.meta.client ? useMessage() : null

const columns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  { key: 'guardName', title: 'Guard Name', sortable: true, searchable: true },
  { key: 'description', title: 'Description', searchable: true, ellipsis: { tooltip: true } },
  {
    key: 'allowUrls',
    title: 'Allow URLs',
    render(row: Guard) {
      const allowUrls = row.urls?.filter((u) => u.type === 'allow') || []
      if (!allowUrls.length) return h(NText, { depth: 3 }, () => '-')
      return h(NSpace, { size: 4 }, () =>
        allowUrls.slice(0, 3).map((u) =>
          h(NTag, { key: u.id, size: 'small', type: 'success', bordered: false }, () => u.url)
        )
      )
    },
  },
  {
    key: 'denyUrls',
    title: 'Deny URLs',
    render(row: Guard) {
      const denyUrls = row.urls?.filter((u) => u.type === 'deny') || []
      if (!denyUrls.length) return h(NText, { depth: 3 }, () => '-')
      return h(NSpace, { size: 4 }, () =>
        denyUrls.slice(0, 3).map((u) =>
          h(NTag, { key: u.id, size: 'small', type: 'error', bordered: false }, () => u.url)
        )
      )
    },
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 160,
    render(row: Guard) {
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
            default: () => `Delete guard "${row.guardName}"?`,
          }
        ),
      ])
    },
  },
])

const searchableFields = [
  { label: 'All Fields', value: '' },
  { label: 'Guard Name', value: 'guardName' },
  { label: 'Description', value: 'description' },
]

async function handleDelete(id: number) {
  try {
    await store.remove(id)
    message?.success('Guard deleted')
  } catch {
    message?.error('Failed to delete guard')
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
      :data="store.guards"
      :loading="store.loading"
      :page="store.page"
      :limit="store.limit"
      :total="store.total"
      :sort-by="store.sortBy"
      :sort-order="store.sortOrder"
      search-placeholder="Search guards..."
      :searchable-fields="searchableFields"
      empty-description="Belum ada guard"
      empty-cta-label="+ Buat Guard"
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
          Add Guard
        </NButton>
      </template>
    </DataTable>
  </div>
</template>
