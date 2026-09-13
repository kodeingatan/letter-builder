<script setup lang="ts">
import { h, onMounted, computed, ref } from 'vue'
import { NSpace, NButton, NPopconfirm, NIcon, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit, View } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import BadgePill from '~/components/common/BadgePill/BadgePill.vue'
import { useMasterDataStore } from '~/stores/master-data'
import { getErrorMessage } from '~/utils/error'
import type { MasterTable } from '~/shared/types/master-data'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'browse', table: MasterTable): void
}>()

const store = useMasterDataStore()
const message = import.meta.client ? useMessage() : null
const search = ref('')

const columns = computed(() => [
  { key: 'display_name', title: 'Nama Tabel', sortable: true },
  { key: 'slug', title: 'Slug', sortable: true },
  {
    key: 'status', title: 'Status', sortable: true,
    render: (row: MasterTable) => h(BadgePill, {
      label: row.status,
      type: row.status === 'ACTIVE' ? 'success' : row.status === 'ARCHIVED' ? 'default' : 'warning',
    }),
  },
  {
    key: 'columns', title: 'Kolom',
    render: (row: MasterTable) => String(row.columns?.length ?? (row as unknown as { _count?: number })._count ?? '—'),
  },
  {
    key: 'actions', title: 'Aksi', width: 160,
    render(row: MasterTable) {
      return h(NSpace, { size: 4 }, () => [
        h(NButton, { size: 'small', quaternary: true, type: 'info', onClick: () => emit('browse', row) },
          { default: () => h(NIcon, null, { default: () => h(View) }) }),
        h(NButton, { size: 'small', quaternary: true, type: 'warning', onClick: () => navigateTo(`/dashboard/master-data/${row.slug}/edit`) },
          { default: () => h(NIcon, null, { default: () => h(Edit) }) }),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row) }, {
          trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' },
            { default: () => h(NIcon, null, { default: () => h(TrashCan) }) }),
          default: () => `Hapus tabel "${row.display_name}"? Fisik mst_${row.slug} ikut terhapus (backup otomatis).`,
        }),
      ])
    },
  },
])

async function handleDelete(row: MasterTable) {
  try {
    await store.removeTable(row.slug)
    message?.success(`Tabel "${row.display_name}" dihapus`)
  } catch (e) {
    message?.error(getErrorMessage(e, 'Gagal menghapus tabel (mungkin masih direferensi)'))
  }
}

function reload() {
  store.fetchTables({ page: 1, search: search.value || undefined }).catch(() => {})
}

onMounted(reload)
</script>

<template>
  <div>
    <DataTable
      :columns="columns"
      :data="store.tables"
      :loading="store.loading"
      :page="store.tablesPage"
      :limit="store.tablesLimit"
      :total="store.tablesTotal"
      storage-key="datatable-master-tables"
      search-placeholder="Cari tabel..."
      empty-description="Belum ada Master Data"
      empty-cta-label="+ Buat Tabel Pertama"
      :error="store.error"
      @search="(v: string) => { search = v; reload() }"
      @empty-cta="emit('create')"
      @update:page="(p: number) => store.fetchTables({ page: p, search: search || undefined })"
      @update:limit="(l: number) => store.fetchTables({ page: 1, limit: l, search: search || undefined })"
      @retry="reload"
    >
      <template #toolbar>
        <NButton type="primary" @click="emit('create')">
          <template #icon><NIcon><Add /></NIcon></template>
          Buat Tabel
        </NButton>
      </template>
    </DataTable>
  </div>
</template>
