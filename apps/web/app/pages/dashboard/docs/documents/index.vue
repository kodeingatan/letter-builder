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
  { label: 'All administrations', value: null },
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
  <div>
    <NAlert
      v-if="!canRead"
      type="error"
      title="Access Denied"
      style="margin-bottom: 16px;"
    >
      You do not have permission to view Documents.
    </NAlert>
    <template v-else>
      <NSpace align="center" style="margin-bottom: 12px;" wrap>
        <NText depth="3">Every completed run is persisted here as an immutable document.</NText>
        <NSelect
          :value="store.administrationId"
          :options="adminOptions"
          placeholder="Filter by administration"
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
  </div>
</template>
