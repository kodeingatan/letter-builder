<script setup lang="ts">
import { h, onMounted, computed } from 'vue'
import { NText, NButton, NSpace, NPopconfirm, NIcon, NTag, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit, View } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { useTemplatesStore } from '~/stores/templates'
import { getErrorMessage } from '~/utils/error'
import type { TemplateListItem } from '~/shared/types/template'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', template: TemplateListItem): void
  (e: 'detail', template: TemplateListItem): void
  (e: 'open', template: TemplateListItem): void
}>()

const store = useTemplatesStore()
const message = import.meta.client ? useMessage() : null

const columns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    searchable: true,
    render(row: TemplateListItem) {
      return h(NText, { strong: true }, () => row.name)
    },
  },
  {
    key: 'version',
    title: 'Version',
    sortable: true,
    width: 90,
    render(row: TemplateListItem) {
      return h(NTag, { size: 'small', bordered: false }, () => `v${row.version}`)
    },
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    width: 110,
    render(row: TemplateListItem) {
      return h(
        NTag,
        { type: row.status === 'published' ? 'success' : 'default', size: 'small', bordered: false },
        () => row.status,
      )
    },
  },
  {
    key: 'usageCount',
    title: 'Used In',
    width: 110,
    render(row: TemplateListItem) {
      return h(NText, { code: true }, () => `${row.stepCount ?? 0}s / ${row.documentCount ?? 0}d`)
    },
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 200,
    render(row: TemplateListItem) {
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
            default: () => `Delete template "${row.name}"? Blocked when referenced by a step or document.`,
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
    message?.success('Template deleted')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to delete template'))
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
      :data="store.templates"
      :loading="store.loading"
      :page="store.page"
      :limit="store.limit"
      :total="store.total"
      :sort-by="store.sortBy"
      :sort-order="store.sortOrder"
      search-placeholder="Search templates..."
      :searchable-fields="searchableFields"
      storage-key="datatable-templates-hidden-columns"
      empty-description="No templates yet — create Surat Keputusan first"
      @search="handleSearch"
      @search-field-change="handleSearchField"
      @update:page="handlePageChange"
      @update:limit="handleLimitChange"
      @sort-change="handleSortChange"
    >
      <template #toolbar>
        <NButton type="primary" @click="emit('create')">
          <template #icon><NIcon><Add /></NIcon></template>
          Add Template
        </NButton>
      </template>
    </DataTable>
  </div>
</template>
