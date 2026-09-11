<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NAlert, NDatePicker, NSelect, NSpace, NText } from 'naive-ui'
import { DocumentsTable } from '~/components/features/documents'
import { useAuthorization } from '~/composables/useAuthorization'
import { useDocumentsStore } from '~/stores/documents'
import { useAdministrationsStore } from '~/stores/administrations'
import type { DocumentListItem } from '~/shared/types/document'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const { hasAnyRole, hasPermission } = useAuthorization()
const store = useDocumentsStore()
const administrationsStore = useAdministrationsStore()

const canRead = computed(
  () =>
    hasAnyRole(['Admin', 'Super Admin']) ||
    hasPermission('Document Management') ||
    hasPermission('Administration Run') ||
    hasPermission('Read Only'),
)

const adminOptions = computed(() => [
  { label: 'Semua administrasi', value: null },
  ...(administrationsStore.administrations ?? []).map((a: any) => ({ label: a.name, value: a.id })),
])

const dateRange = ref<[number, number] | null>(null)

function handleView(doc: DocumentListItem) {
  navigateTo(`/dashboard/docs/documents/${doc.id}`)
}

function handleAdminFilter(value: number | null) {
  store.setAdministrationId(value)
  void store.fetchAll()
}

function handleDateFilter(value: [number, number] | null) {
  dateRange.value = value
  void store.fetchAll({
    startDate: value ? new Date(value[0]).toISOString() : undefined,
    endDate: value ? new Date(value[1]).toISOString() : undefined,
  })
}

onMounted(() => {
  void administrationsStore.fetchAll({ limit: 100 }).catch(() => {})
})
</script>

<template>
  <PageShell
    title="Dokumen"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Dokumen' }, { label: 'Dokumen' }]"
    description="Setiap proses yang selesai disimpan sebagai dokumen immutable."
  >
    <NAlert
      v-if="!canRead"
      type="error"
      title="Akses Ditolak"
      style="margin-bottom: 16px;"
    >
      Anda tidak memiliki izin untuk melihat Dokumen.
    </NAlert>
    <template v-else>
      <NSpace align="center" style="margin-bottom: 12px;" wrap>
        <NText depth="3">Setiap proses selesai tersimpan sebagai dokumen immutable.</NText>
        <NSelect
          :value="store.administrationId"
          :options="adminOptions"
          placeholder="Filter administrasi"
          clearable
          style="width: 240px;"
          @update:value="handleAdminFilter"
        />
        <NDatePicker
          :value="dateRange"
          type="daterange"
          clearable
          style="width: 260px;"
          @update:value="handleDateFilter"
        />
      </NSpace>
      <DocumentsTable @view="handleView" />
    </template>
  </PageShell>
</template>
