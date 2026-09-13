<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { NSpin, NAlert, NButton, NSpace, NPopconfirm, NIcon, useMessage } from 'naive-ui'
import { TrashCan } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import BadgePill from '~/components/common/BadgePill/BadgePill.vue'
import { AdminWizard } from '~/components/features/persuratan'
import { usePersuratanStore } from '~/stores/persuratan'
import { useAuthStore } from '~/stores/auth'
import { getErrorMessage } from '~/utils/error'
import type { Administration, Document } from '~/shared/types/persuratan'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const store = usePersuratanStore()
const authStore = useAuthStore()
const message = import.meta.client ? useMessage() : null
const administration = ref<Administration | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)

const runColumns = computed(() => [
  { key: 'id', title: 'ID', sortable: true, width: 60 },
  { key: 'document_number', title: 'Nomor', sortable: true },
  {
    key: 'status', title: 'Status', sortable: true,
    render: (row: Document) => h(BadgePill, {
      label: row.status,
      type: row.status === 'FINAL' ? 'success' : row.status === 'CANCELLED' ? 'error' : 'warning',
    }),
  },
  { key: 'template_version', title: 'Terkunci v', width: 100 },
  {
    key: 'actions', title: 'Aksi', width: 160,
    render(row: Document) {
      return h(NSpace, { size: 4 }, () => [
        h(NButton, { size: 'small', quaternary: true, type: 'info', disabled: !row.pdf_path, onClick: () => downloadRunPdf(row.id) },
          { default: () => 'PDF' }),
        h(NPopconfirm, { onPositiveClick: () => handleCancel(row) }, {
          trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'error' },
            { default: () => h(NIcon, null, { default: () => h(TrashCan) }) }),
          default: () => `Batalkan run #${row.id}? (riwayat tetap tersimpan)`,
        }),
      ])
    },
  },
])

async function downloadRunPdf(id: number) {
  try {
    const response = await fetch(`/api/documents/${id}/pdf`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (!response.ok) throw new Error('PDF belum tersedia')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dokumen-${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    message?.error(getErrorMessage(e))
  }
}

async function handleCancel(row: Document) {
  try {
    await store.cancelRun(row.id)
    message?.success(`Run #${row.id} dibatalkan`)
    if (administration.value) await store.fetchRuns(administration.value.id)
  } catch (e) {
    message?.error(getErrorMessage(e))
  }
}

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const admin = await $fetch<Administration>(`/api/administrations/slug/${slug.value}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    administration.value = admin
    await store.fetchRuns(admin.id)
    if (store.templates.length === 0) await store.fetchTemplates().catch(() => {})
  } catch (e) {
    loadError.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageShell
    :title="administration?.name ?? slug"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Dokumen', href: '/dashboard/documents' }, { label: administration?.name ?? slug }]"
    :description="administration?.description ?? ''"
  >
    <NSpin v-if="loading" />
    <NAlert v-else-if="loadError" type="error">{{ loadError }}</NAlert>
    <template v-else>
      <h3 class="font-semibold mb-2">Wizard — lengkapi data lalu render</h3>
      <AdminWizard :administration="administration" />
      <h3 class="font-semibold mt-6 mb-2">Riwayat Run (snapshot terkunci)</h3>
      <DataTable
        :columns="runColumns"
        :data="store.runs"
        :loading="store.loading"
        :total="store.runs.length"
        :storage-key="`datatable-runs-${slug}`"
        :searchable-fields="[]"
        search-placeholder="Cari nomor..."
        empty-description="Belum ada run"
      />
    </template>
  </PageShell>
</template>
