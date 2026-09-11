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

// browse for Read users; Create/Edit/Delete/Import gated on Write.
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
const notFound = ref(false)

const displayName = computed(() => store.tableMeta?.displayName || tableName.value)

const breadcrumbs = computed(() => [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Data' },
  { label: 'Tabel Global', href: '/dashboard/data/global-tables' },
  { label: displayName.value },
])

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
    title: 'Aksi',
    width: 150,
    render: (row: TableRow) =>
      h(NSpace, { size: 4 }, () => [
        h(NButton, { size: 'small', quaternary: true, type: 'info', onClick: () => openDetail(row), 'aria-label': 'Lihat' },
          { default: () => h(NIcon, null, { default: () => h(View) }) }),
        canWrite.value
          ? h(NButton, { size: 'small', quaternary: true, type: 'warning', onClick: () => openEdit(row), 'aria-label': 'Ubah' },
            { default: () => h(NIcon, null, { default: () => h(Edit) }) })
          : null,
        canWrite.value
          ? h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
            trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error', 'aria-label': 'Hapus' },
              { default: () => h(NIcon, null, { default: () => h(TrashCan) }) }),
            default: () => `Hapus baris #${row.id}?`,
          })
          : null,
      ]),
  },
])

const searchableFields = computed(() => [
  { label: 'Semua Kolom', value: '' },
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
    else loadError.value = getErrorMessage(e, 'Gagal memuat data')
  }
}

function handleRetry() {
  loadError.value = ''
  void store.fetchAll(tableName.value).catch((e: any) => {
    loadError.value = getErrorMessage(e, 'Gagal memuat data')
  })
}

function handleRefresh() {
  void store.fetchAll(tableName.value).catch(() => {})
  message?.success('Data dimuat ulang')
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
    message?.success('Baris berhasil dihapus')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Gagal menghapus baris'))
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
    message?.error(getErrorMessage(e, 'Gagal ekspor'))
  }
}

watch(tableName, () => load())
onMounted(() => load())
</script>

<template>
  <PageShell :title="displayName" :breadcrumbs="breadcrumbs" :description="`Data tabel ${displayName}`">
    <template #actions>
      <NButton v-if="canWrite" type="primary" size="small" @click="openCreate">
        <template #icon><NIcon><Add /></NIcon></template>
        Tambah Baris
      </NButton>
      <NButton v-if="canWrite" size="small" @click="showImport = true">
        <template #icon><NIcon><Upload /></NIcon></template>
        Impor
      </NButton>
      <NButton size="small" @click="handleExport">
        <template #icon><NIcon><Download /></NIcon></template>
        Ekspor
      </NButton>
    </template>

    <NAlert v-if="forbidden" type="error" title="Akses Ditolak" style="margin-bottom: 16px;">
      Anda tidak memiliki izin untuk melihat tabel ini.
    </NAlert>
    <NResult
      v-else-if="notFound"
      status="404"
      :title="`“${tableName}” tidak ditemukan`"
      description="Tabel telah dihapus atau Anda menandai tautan mati. Pilih tabel lain dari menu Data."
      style="margin: 48px 0;"
    >
      <template #footer>
        <NSpace justify="center">
          <NButton @click="navigateTo('/dashboard')">Kembali ke Dashboard</NButton>
          <NButton
            v-if="hasAnyRole(['Admin', 'Super Admin'])"
            type="primary"
            @click="navigateTo('/dashboard/data/global-tables')"
          >
            Kelola Tabel Global
          </NButton>
        </NSpace>
      </template>
    </NResult>
    <template v-else>
      <NEmpty
        v-if="!store.loading && store.emptySchema"
        :description="`Tentukan kolom untuk “${tableName}” terlebih dahulu`"
        style="margin: 48px 0;"
      >
        <template #extra>
          <NButton type="primary" @click="navigateTo('/dashboard/data/global-tables')">Kelola Kolom</NButton>
        </template>
      </NEmpty>
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
        :search-placeholder="`Cari ${displayName}...`"
        :searchable-fields="searchableFields"
        :storage-key="`datatable-hidden-${tableName}`"
        :empty-description="'Belum ada baris'"
        :error="loadError || null"
        @search="(v) => { store.setSearch(v); store.fetchAll(tableName).catch((e: any) => { loadError = getErrorMessage(e, 'Gagal memuat data') }) }"
        @search-field-change="(f) => { store.setSearchField(f); store.fetchAll(tableName).catch((e: any) => { loadError = getErrorMessage(e, 'Gagal memuat data') }) }"
        @update:page="(p) => { store.setPage(p); store.fetchAll(tableName).catch((e: any) => { loadError = getErrorMessage(e, 'Gagal memuat data') }) }"
        @update:limit="(l) => { store.setLimit(l); store.fetchAll(tableName).catch((e: any) => { loadError = getErrorMessage(e, 'Gagal memuat data') }) }"
        @sort-change="(s) => { if (s.order) store.setSort(s.columnKey); store.fetchAll(tableName).catch((e: any) => { loadError = getErrorMessage(e, 'Gagal memuat data') }) }"
        @refresh="handleRefresh"
        @retry="handleRetry"
      >
        <template #toolbar>
          <span class="text-xs" style="color: #6B7280">{{ store.total }} baris</span>
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
  </PageShell>
</template>
