<script setup lang="ts">
import { h, ref, computed, onMounted, watch } from 'vue'
import { NButton, NIcon, NTag, NText, NPopconfirm, NSpace, useMessage } from 'naive-ui'
import { Add, View, Edit, TrashCan, ChevronUp, ChevronDown } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import GlobalTableColumnFormModal from './GlobalTableColumnFormModal.vue'
import { useGlobalTableColumnsStore } from '~/stores/global-table-columns'
import { getErrorMessage } from '~/utils/error'
import type { GlobalTableColumn } from '~/shared/types/global-table-column'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', column: GlobalTableColumn): void
  (e: 'detail', column: GlobalTableColumn): void
}>()

const store = useGlobalTableColumnsStore()
const message = import.meta.client ? useMessage() : null

const props = defineProps({
  tableId: { type: Number, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})

const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const selectedColumn = ref<GlobalTableColumn | null>(null)
const liveMessage = ref('')

const typeColorMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error' | 'primary'> = {
  text: 'default',
  richtext: 'info',
  date: 'success',
  select: 'warning',
  number: 'primary',
  currency: 'warning',
  image: 'warning',
  'select-table-relation': 'success',
  'select-table-relation-multiple': 'success',
  'hidden-computed': 'info',
  'readonly-computed': 'info',
}

function handleCreate() {
  modalMode.value = 'create'
  selectedColumn.value = null
  showModal.value = true
}

function handleEdit(column: GlobalTableColumn) {
  modalMode.value = 'edit'
  selectedColumn.value = column
  showModal.value = true
}

function handleFormSuccess() {
  showModal.value = false
  selectedColumn.value = null
  if (props.tableId) store.fetchAll(props.tableId).catch(() => {})
}

async function handleDelete(id: number) {
  try {
    await store.remove(props.tableId, id)
    message?.success('Kolom berhasil dihapus')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Gagal menghapus kolom'))
  }
}

async function handleMove(column: GlobalTableColumn, delta: number) {
  const cols = store.columns
  const from = cols.findIndex(c => c.id === column.id)
  const to = from + delta
  if (to < 0 || to >= cols.length) return
  const ordered = [...cols]
  const [moved] = ordered.splice(from, 1)
  ordered.splice(to, 0, moved)
  const orderedIds = ordered.map(c => c.id)
  liveMessage.value = `Dipindahkan ke posisi ${to + 1}`
  try {
    await store.reorder(props.tableId, orderedIds)
    message?.success('Urutan kolom diperbarui')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Gagal memperbarui urutan'))
    // revert by refetch
    store.fetchAll(props.tableId).catch(() => {})
  }
}

const columns = computed(() => [
  {
    key: 'reorder',
    title: 'Reorder',
    width: 90,
    render(row: GlobalTableColumn) {
      const idx = store.columns.findIndex(c => c.id === row.id)
      return h(NSpace, { size: 2, align: 'center', vertical: true, justify: 'center', style: 'width:70px' }, () => [
        h(NButton, {
          size: 'tiny', quaternary: true,
          disabled: idx === 0,
          'aria-label': 'Pindahkan ke atas',
          title: 'Pindahkan ke atas',
          onClick: () => handleMove(row, -1),
        }, { default: () => h(NIcon, null, { default: () => h(ChevronUp) }) }),
        h(NButton, {
          size: 'tiny', quaternary: true,
          disabled: idx === store.columns.length - 1,
          'aria-label': 'Pindahkan ke bawah',
          title: 'Pindahkan ke bawah',
          onClick: () => handleMove(row, 1),
        }, { default: () => h(NIcon, null, { default: () => h(ChevronDown) }) }),
      ])
    },
  },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    searchable: true,
    render(row: GlobalTableColumn) {
      return h('div', { style: 'display:flex;flex-direction:column;gap:2px' }, [
        h(NText, { code: true }, () => row.name),
        h('span', { style: 'font-size:11px;color:#94a3b8' }, row.displayName),
      ])
    },
  },
  {
    key: 'type',
    title: 'Type',
    sortable: true,
    width: 180,
    render(row: GlobalTableColumn) {
      return h(NTag, { type: (typeColorMap[row.type] || 'default') as any, size: 'small' }, { default: () => row.type })
    },
  },
  {
    key: 'required',
    title: 'Required',
    width: 100,
    render(row: GlobalTableColumn) {
      return h(NTag, { type: row.required ? 'error' : 'success', size: 'small' }, { default: () => row.required ? 'Ya' : 'Tidak' })
    },
  },
  {
    key: 'searchable',
    title: 'Searchable',
    width: 110,
    render(row: GlobalTableColumn) {
      return h(NTag, { type: row.searchable ? 'warning' : 'default', size: 'small' }, { default: () => row.searchable ? 'Ya' : 'Tidak' })
    },
  },
  {
    key: 'orderable',
    title: 'Orderable',
    width: 110,
    render(row: GlobalTableColumn) {
      return h(NTag, { type: row.orderable ? 'info' : 'default', size: 'small' }, { default: () => row.orderable ? 'Ya' : 'Tidak' })
    },
  },
  {
    key: 'actions',
    title: 'Aksi',
    width: 150,
    render(row: GlobalTableColumn) {
      return h(NSpace, { size: 4, wrap: false }, () => [
        h(NButton, {
          size: 'small', quaternary: true, type: 'info',
          'aria-label': `Lihat ${row.name}`,
          onClick: () => emit('detail', row),
        }, { default: () => h(NIcon, null, { default: () => h(View) }) }),
        h(NButton, {
          size: 'small', quaternary: true, type: 'warning',
          'aria-label': `Ubah ${row.name}`,
          onClick: () => handleEdit(row),
        }, { default: () => h(NIcon, null, { default: () => h(Edit) }) }),
        h(NPopconfirm, {
          positiveText: 'Hapus',
          negativeText: 'Batal',
          onPositiveClick: () => handleDelete(row.id),
        }, {
          trigger: () => h(NButton, {
            size: 'small', quaternary: true, type: 'error',
            'aria-label': `Hapus ${row.name}`,
          }, { default: () => h(NIcon, null, { default: () => h(TrashCan) }) }),
          default: () => `Hapus kolom "${row.name}"? Tindakan tidak dapat dibatalkan.`,
        }),
      ])
    },
  },
])

const searchableFields = [
  { label: 'Semua Kolom', value: '' },
  { label: 'Name', value: 'name' },
  { label: 'Display Name', value: 'displayName' },
  { label: 'Type', value: 'type' },
]

function handleSearch(value: string) {
  store.setSearch(value)
  store.fetchAll(props.tableId).catch(() => {})
}

function handleSearchField(field: string) {
  // DataTable already emits, store handles via field param
  // store doesn't have setSearchField, use direct
  ;(store as any).searchField = field
  store.fetchAll(props.tableId).catch(() => {})
}

function handlePageChange(p: number) {
  store.setPage(p)
  store.fetchAll(props.tableId).catch(() => {})
}

function handleLimitChange(l: number) {
  store.setLimit(l)
  store.fetchAll(props.tableId).catch(() => {})
}

function handleSortChange(sorter: { columnKey: string; order: 'ascend' | 'descend' | false }) {
  if (!sorter.order) {
    store.setSort('position')
  } else {
    store.setSort(sorter.columnKey)
  }
  store.fetchAll(props.tableId).catch(() => {})
}

function handleRefresh() {
  store.fetchAll(props.tableId).catch(() => {})
  message?.success('Data dimuat ulang')
}

function handleRetry() {
  store.error = null
  store.fetchAll(props.tableId).catch(() => {})
}

onMounted(() => {
  if (props.tableId) {
    store.fetchAll(props.tableId).catch(() => {})
  }
})

watch(() => props.tableId, (newId) => {
  if (newId) {
    store.fetchAll(newId).catch(() => {})
  }
})
</script>

<template>
  <div>
    <div class="mb-4">
      <NSpace justify="space-between" align="center">
        <div>
          <h3 class="text-lg font-semibold">Columns</h3>
          <p class="text-sm text-gray-500 mt-1">Kelola kolom untuk tabel ini ({{ store.total || store.columns.length }})</p>
        </div>
        <NButton type="primary" size="small" @click="handleCreate">
          <template #icon><NIcon><Add /></NIcon></template>
          Tambah Kolom
        </NButton>
      </NSpace>
    </div>

    <!-- live region for reorder a11y -->
    <div aria-live="polite" aria-atomic="true" class="sr-only" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">{{ liveMessage }}</div>

    <DataTable
      :columns="columns"
      :data="store.columns"
      :loading="store.loading"
      :page="store.page"
      :limit="store.limit"
      :total="store.total"
      :sort-by="store.sortBy"
      :sort-order="store.sortOrder"
      search-placeholder="Cari kolom..."
      :searchable-fields="searchableFields"
      :storage-key="`datatable-hidden-columns-global-${props.tableId}`"
      empty-description="Belum ada kolom"
      :error="store.error"
      @search="handleSearch"
      @search-field-change="handleSearchField"
      @update:page="handlePageChange"
      @update:limit="handleLimitChange"
      @sort-change="handleSortChange"
      @refresh="handleRefresh"
      @retry="handleRetry"
    >
      <template #toolbar>
        <NButton type="primary" size="small" @click="handleCreate">
          <template #icon><NIcon><Add /></NIcon></template>
          Tambah Kolom
        </NButton>
      </template>
    </DataTable>

    <!-- Override empty slot with CTA when DataTable empty -->
    <div v-if="!store.loading && store.columns.length === 0 && !store.error" class="text-center" style="margin-top:-12px">
      <!-- DataTable already shows NEmpty; we add CTA below via slot? DataTable's NEmpty has no CTA. Add extra CTA -->
      <NButton type="primary" size="small" style="margin-top:12px" @click="handleCreate">
        <template #icon><NIcon><Add /></NIcon></template>
        + Buat Kolom Pertama
      </NButton>
      <div style="font-size:11px;color:#6B7280;margin-top:6px">ALT-01 — tidak dead-end; CTA mengarah ke form kolom</div>
    </div>

    <GlobalTableColumnFormModal
      v-model:visible="showModal"
      :mode="modalMode"
      :table-id="props.tableId"
      :column="selectedColumn"
      @success="handleFormSuccess"
    />
  </div>
</template>
