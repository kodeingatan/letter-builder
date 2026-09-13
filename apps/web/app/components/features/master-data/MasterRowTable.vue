<script setup lang="ts">
import { h, onMounted, computed, ref, watch } from 'vue'
import { NSpace, NButton, NPopconfirm, NIcon, NText, useMessage } from 'naive-ui'
import { Add, TrashCan, Edit } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { useMasterDataStore } from '~/stores/master-data'
import { formatDateDisplay } from '~/utils/master-operation'
import { getErrorMessage } from '~/utils/error'
import type { MasterRow, MasterTableSchema } from '~/shared/types/master-data'

const props = defineProps<{ slug: string }>()

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', row: MasterRow): void
}>()

const store = useMasterDataStore()
const message = import.meta.client ? useMessage() : null
const search = ref('')
const searchField = ref('')
const sortBy = ref('id')
const sortOrder = ref<'ASC' | 'DESC'>('DESC')
const schema = ref<MasterTableSchema | null>(null)

const searchableFields = computed(() => [
  { label: 'Semua (searchable)', value: '' },
  ...(schema.value?.columns.filter((c) => c.is_searchable).map((c) => ({ label: c.display_name, value: c.name })) ?? []),
])

const columns = computed(() => {
  const cols = (schema.value?.columns ?? []).map((col) => ({
    key: col.name,
    title: col.display_name,
    sortable: col.is_orderable,
    render: (row: MasterRow) => renderCell(col.type, col.name, row[col.name], col.config as Record<string, unknown> | null),
  }))
  return [
    ...cols,
    {
      key: 'actions', title: 'Aksi', width: 120,
      render(row: MasterRow) {
        return h(NSpace, { size: 4 }, () => [
          h(NButton, { size: 'small', quaternary: true, type: 'warning', onClick: () => emit('edit', row) },
            { default: () => h(NIcon, null, { default: () => h(Edit) }) }),
          h(NPopconfirm, { onPositiveClick: () => handleDelete(Number(row.id)) }, {
            trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' },
              { default: () => h(NIcon, null, { default: () => h(TrashCan) }) }),
            default: () => `Hapus baris #${row.id}?`,
          }),
        ])
      },
    },
  ]
})

function renderCell(type: string, _name: string, value: unknown, config: Record<string, unknown> | null) {
  if (value === null || value === undefined || value === '') return h(NText, { depth: 3 }, () => '—')
  if (type === 'date' || type === 'datetime' || type === 'time') {
    return formatDateDisplay(value, type, (config?.format as string | undefined) ?? undefined)
  }
  if (type === 'number' && (config?.currency as boolean | undefined)) {
    const num = Number(value)
    return Number.isFinite(num) ? `Rp ${num.toLocaleString('id-ID')}` : String(value)
  }
  if (type === 'select_multiple' || type === 'relation_multiple') {
    return Array.isArray(value) ? value.join(', ') : String(value)
  }
  if (type === 'image') return h('a', { href: String(value), target: '_blank', class: 'text-blue-500' }, () => 'Lihat gambar')
  const text = String(value)
  return text.length > 80 ? text.slice(0, 80) + '…' : text
}

async function handleDelete(id: number) {
  try {
    await store.removeRow(props.slug, id)
    message?.success('Baris dihapus')
  } catch (e) {
    message?.error(getErrorMessage(e))
  }
}

function reload() {
  store.fetchRows(props.slug, {
    page: 1, search: search.value || undefined,
    searchField: searchField.value || undefined,
    sortBy: sortBy.value, sortOrder: sortOrder.value,
  }).catch(() => {})
}

watch(() => props.slug, async () => {
  search.value = ''
  searchField.value = ''
  sortBy.value = 'id'
  schema.value = await store.fetchSchema(props.slug).catch(() => null)
  reload()
}, { immediate: false })

onMounted(async () => {
  schema.value = await store.fetchSchema(props.slug).catch(() => null)
  reload()
})

defineExpose({ reload })
</script>

<template>
  <div>
    <DataTable
      :columns="columns"
      :data="store.rows"
      :loading="store.loading"
      :page="store.rowsPage"
      :limit="store.rowsLimit"
      :total="store.rowsTotal"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :storage-key="`datatable-master-rows-${slug}`"
      search-placeholder="Cari data..."
      :searchable-fields="searchableFields"
      :empty-description="`Belum ada data ${schema?.display_name ?? ''}`"
      empty-cta-label="+ Tambah Data Pertama"
      :error="store.error"
      @search="(v: string) => { search = v; reload() }"
      @search-field-change="(f: string) => { searchField = f; reload() }"
      @empty-cta="emit('create')"
      @update:page="(p: number) => store.fetchRows(slug, { page: p, search: search || undefined, searchField: searchField || undefined, sortBy, sortOrder })"
      @update:limit="(l: number) => store.fetchRows(slug, { page: 1, limit: l, search: search || undefined, searchField: searchField || undefined, sortBy, sortOrder })"
      @sort-change="(s: { columnKey: string; order: 'ascend' | 'descend' | false }) => { sortBy = s.columnKey; sortOrder = s.order === 'ascend' ? 'ASC' : 'DESC'; reload() }"
      @retry="reload"
    >
      <template #toolbar>
        <NButton type="primary" @click="emit('create')">
          <template #icon><NIcon><Add /></NIcon></template>
          Tambah Data
        </NButton>
      </template>
    </DataTable>
  </div>
</template>
