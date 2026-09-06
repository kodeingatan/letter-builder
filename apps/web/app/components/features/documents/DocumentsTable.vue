<script setup lang="ts">
import { h, computed, onMounted } from 'vue'
import { NText, NButton, NSpace, NIcon, useMessage } from 'naive-ui'
import { Document as DocumentIcon } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import DocumentDriftBadge from './DocumentDriftBadge.vue'
import { useDocumentsStore } from '~/stores/documents'
import { useAuthStore } from '~/stores/auth'
import { getErrorMessage } from '~/utils/error'
import type { DocumentListItem } from '~/shared/types/document'

const emit = defineEmits<{
  (e: 'view', doc: DocumentListItem): void
}>()

const props = withDefaults(defineProps<{ administrationId?: number | null }>(), {
  administrationId: null,
})

const store = useDocumentsStore()
const authStore = useAuthStore()
const message = import.meta.client ? useMessage() : null

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function formatDate(value: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

/** Downloads go through fetch (Bearer header) — window.open would drop auth. */
async function downloadBlob(url: string, filename: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${authStore.token}` } })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || `Download failed (${res.status})`)
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000)
}

async function downloadPdf(doc: DocumentListItem) {
  if (!doc.outputFilePath) {
    message?.warning('PDF not rendered yet — HTML preview is available')
    return
  }
  try {
    await downloadBlob(store.pdfUrl(doc.id), `document-${doc.id}.pdf`)
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to download PDF'))
  }
}

async function downloadHtml(doc: DocumentListItem) {
  if (!doc.outputHtml) {
    message?.warning('Rendered HTML is still pending for this document')
    return
  }
  try {
    await downloadBlob(store.htmlUrl(doc.id), `document-${doc.id}.html`)
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to download HTML'))
  }
}

const columns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  {
    key: 'title',
    title: 'Title',
    searchable: true,
    render(row: DocumentListItem) {
      return h(NSpace, { size: 4, align: 'center' }, () => [
        renderIcon(DocumentIcon)(),
        h(NText, { strong: true }, () => row.title),
      ])
    },
  },
  {
    key: 'driftBadge',
    title: 'Versions',
    width: 220,
    render(row: DocumentListItem) {
      return h(DocumentDriftBadge, { badge: row.driftBadge, drifted: row.drifted })
    },
  },
  {
    key: 'createdByName',
    title: 'Created By',
    width: 160,
    render(row: DocumentListItem) {
      return h(NText, null, () => row.createdByName ?? `#${row.createdBy ?? '—'}`)
    },
  },
  {
    key: 'createdAt',
    title: 'Date',
    sortable: true,
    width: 180,
    render(row: DocumentListItem) {
      return h(NText, null, () => formatDate(row.createdAt))
    },
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 220,
    render(row: DocumentListItem) {
      return h(NSpace, { size: 4 }, () => [
        h(NButton, {
          size: 'small', quaternary: true, type: 'primary',
          onClick: () => emit('view', row),
        }, { default: () => 'View' }),
        h(NButton, {
          size: 'small', quaternary: true,
          disabled: !row.outputFilePath,
          onClick: () => downloadPdf(row),
        }, { default: () => 'PDF' }),
        h(NButton, {
          size: 'small', quaternary: true,
          disabled: !row.outputHtml,
          onClick: () => downloadHtml(row),
        }, { default: () => 'HTML' }),
      ])
    },
  },
])

const searchableFields = [
  { label: 'All Fields', value: '' },
  { label: 'Content (HTML)', value: 'outputHtml' },
]

function handleSearch(value: string) {
  store.setSearch(value)
  void store.fetchAll({ administrationId: props.administrationId ?? undefined })
}

function handleSearchField(field: string) {
  store.setSearchField(field)
  void store.fetchAll({ administrationId: props.administrationId ?? undefined })
}

function handlePageChange(p: number) {
  store.setPage(p)
  void store.fetchAll({ administrationId: props.administrationId ?? undefined })
}

function handleLimitChange(l: number) {
  store.setLimit(l)
  void store.fetchAll({ administrationId: props.administrationId ?? undefined })
}

function handleSortChange(sorter: { columnKey: string; order: 'ascend' | 'descend' | false }) {
  if (!sorter.order) store.setSort('id')
  else store.setSort(sorter.columnKey)
  void store.fetchAll({ administrationId: props.administrationId ?? undefined })
}

onMounted(() => {
  if (props.administrationId != null) store.setAdministrationId(props.administrationId)
  void store.fetchAll({ administrationId: props.administrationId ?? undefined }).catch((e: any) => {
    message?.error(getErrorMessage(e, 'Failed to load documents'))
  })
})
</script>

<template>
  <DataTable
    :columns="columns"
    :data="store.documents"
    :loading="store.loading"
    :page="store.page"
    :limit="store.limit"
    :total="store.total"
    :sort-by="store.sortBy"
    :sort-order="store.sortOrder"
    search-placeholder="Search documents..."
    :searchable-fields="searchableFields"
    storage-key="datatable-documents-hidden-columns"
    empty-description="No documents yet — complete a run."
    @search="handleSearch"
    @search-field-change="handleSearchField"
    @update:page="handlePageChange"
    @update:limit="handleLimitChange"
    @sort-change="handleSortChange"
  />
</template>
