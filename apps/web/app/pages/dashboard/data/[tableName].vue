<script setup lang="ts">
import { h, ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NAlert, NButton, NEmpty, NIcon, NPopconfirm, NResult, NSpace, NText, useMessage,
} from 'naive-ui'
import { Add, Download, Upload, Edit, View, TrashCan } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import {
  TableRowFormModal, TableRowDetailDrawer, TableDataImportModal,
} from '~/components/features/table-data'
import { useTableDataStore } from '~/stores/tableData'
import { useAuthorization } from '~/composables/useAuthorization'
import { getErrorMessage } from '~/utils/error'
import { formatCellValue } from '~/utils/table-data-format'
import type { TableRow } from '~/shared/types/table-data'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const route = useRoute()
const tableName = computed(() => String(route.params.tableName ?? ''))
const store = useTableDataStore()
const { hasAnyRole, hasPermission } = useAuthorization()
const message = import.meta.client ? useMessage() : null

// AC-006: browse for Read users; Create/Edit/Delete/Import gated on Write.
const canWrite = computed(() =>
  hasAnyRole(['Admin', 'Super Admin'])
  || hasPermission(`Data:${tableName.value}:Write`)
  || hasPermission('Global Table Management'),
)

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedRow = ref<TableRow | null>(null)
const showDetail = ref(false)
const detailRowId = ref<number | null>(null)
const showImport = ref(false)
const loadError = ref('')
const forbidden = ref(false)
// Task 21 REQ-005: bookmarked deleted-table URLs land here, not a blank crash.
const notFound = ref(false)

const tableColumns = computed(() =>
  store.columns.map((col) => ({
    key: col.name,
    title: col.displayName,
    sortable: col.orderable,
    searchable: col.searchable,
    ellipsis: { tooltip: true },
    render: (row: TableRow) => h(NText, null, () => formatCellValue(col, row[col.name], row._display?.[col.name])),
  })),
)

const gridColumns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 70 },
  ...tableColumns.value,
  {
    key: 'actions',
    title: 'Actions',
    width: 150,
    render: (row: TableRow) =>
      h(NSpace, { size: 4 }, () => [
        h(NButton, { size: 'small', quaternary: true, type: 'info', onClick: () => openDetail(row) },
          { default: () => h(NIcon, null, { default: () => h(View) }) }),
        canWrite.value
          ? h(NButton, { size: 'small', quaternary: true, type: 'warning', onClick: () => openEdit(row) },
            { default: () => h(NIcon, null, { default: () => h(Edit) }) })
          : null,
        canWrite.value
          ? h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
            trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' },
              { default: () => h(NIcon, null, { default: () => h(TrashCan) }) }),
            default: () => `Delete row #${row.id}?`,
          })
          : null,
      ]),
  },
])

const searchableFields = computed(() => [
  { label: 'All Fields', value: '' },
  ...store.columns.filter((c) => c.searchable).map((c) => ({ label: c.displayName, value: c.name })),
])

async function load() {
  if (!tableName.value) return
  loadError.value = ''
  forbidden.value = false
  notFound.value = false
  store.resetFilters()
  try {
    await store.fetchAll(tableName.value)
  } catch (e: any) {
    const status = e.statusCode ?? e.response?.status
    if (status === 403) forbidden.value = true
    else if (status === 404) notFound.value = true
    else loadError.value = getErrorMessage(e, 'Failed to load rows')
  }
}

function openCreate() {
  formMode.value = 'create'
  selectedRow.value = null
  showForm.value = true
}

function openEdit(row: TableRow) {
  formMode.value = 'edit'
  selectedRow.value = row
  showDetail.value = false
  showForm.value = true
}

function openDetail(row: TableRow) {
  detailRowId.value = row.id
  showDetail.value = true
}

async function handleDelete(id: number) {
  try {
    await store.remove(tableName.value, id)
    message?.success('Row deleted')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to delete row'))
  }
}

async function handleExport() {
  try {
    const blob = await store.exportCsv(tableName.value)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tableName.value}-export.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Export failed'))
  }
}

watch(tableName, () => load())
onMounted(() => load())
</script>

<template>
  <div>
    <NAlert v-if="forbidden" type="error" title="Access Denied" style="margin-bottom: 16px;">
      You do not have permission to view this table.
    </NAlert>
    <NResult
      v-else-if="notFound"
      status="404"
      :title="`“${tableName}” no longer exists`"
      description="The table was deleted or you bookmarked a dead link. Pick another table from the Data menu."
      style="margin: 48px 0;"
    >
      <template #footer>
        <NSpace justify="center">
          <NButton @click="navigateTo('/dashboard')">Back to Dashboard</NButton>
          <NButton
            v-if="hasAnyRole(['Admin', 'Super Admin'])"
            type="primary"
            @click="navigateTo('/dashboard/data/global-tables')"
          >
            Manage Global Tables
          </NButton>
        </NSpace>
      </template>
    </NResult>
    <NAlert v-else-if="loadError" type="error" :title="loadError" style="margin-bottom: 16px;" />
    <template v-else>
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-semibold">{{ store.tableMeta?.displayName || tableName }}</h1>
      </div>
      <NEmpty
        v-if="!store.loading && store.emptySchema"
        :description="`Define columns for “${tableName}” first`"
        style="margin: 48px 0;"
      />
      <DataTable
        v-else
        :columns="gridColumns"
        :data="store.rows"
        :loading="store.loading"
        :page="store.page"
        :limit="store.limit"
        :total="store.total"
        :sort-by="store.sortBy"
        :sort-order="store.sortOrder"
        :search-placeholder="`Search ${store.tableMeta?.displayName || tableName}...`"
        :searchable-fields="searchableFields"
        :storage-key="`datatable-hidden-${tableName}`"
        :empty-description="'No rows yet'"
        @search="(v) => { store.setSearch(v); store.fetchAll(tableName).catch(() => {}) }"
        @search-field-change="(f) => { store.setSearchField(f); store.fetchAll(tableName).catch(() => {}) }"
        @update:page="(p) => { store.setPage(p); store.fetchAll(tableName).catch(() => {}) }"
        @update:limit="(l) => { store.setLimit(l); store.fetchAll(tableName).catch(() => {}) }"
        @sort-change="(s) => { if (s.order) store.setSort(s.columnKey); store.fetchAll(tableName).catch(() => {}) }"
      >
        <template #toolbar>
          <NSpace>
            <NButton v-if="canWrite" type="primary" @click="openCreate">
              <template #icon><NIcon><Add /></NIcon></template>
              Add Row
            </NButton>
            <NButton v-if="canWrite" @click="showImport = true">
              <template #icon><NIcon><Upload /></NIcon></template>
              Import
            </NButton>
            <NButton @click="handleExport">
              <template #icon><NIcon><Download /></NIcon></template>
              Export
            </NButton>
          </NSpace>
        </template>
      </DataTable>
      <TableRowFormModal
        v-model:visible="showForm"
        :table-name="tableName"
        :mode="formMode"
        :row="selectedRow"
        @success="showForm = false"
      />
      <TableRowDetailDrawer
        v-model:visible="showDetail"
        :table-name="tableName"
        :row-id="detailRowId"
        :can-write="canWrite"
        @edit="openEdit"
      />
      <TableDataImportModal v-model:visible="showImport" :table-name="tableName" />
    </template>
  </div>
</template>
