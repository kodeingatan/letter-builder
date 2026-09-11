<script setup lang="ts">
import { computed } from 'vue'
import { NAlert, NSelect, NSpace, NText } from 'naive-ui'
import { RunsTable } from '~/components/features/runs'
import { useAuthorization } from '~/composables/useAuthorization'
import { useRunsStore } from '~/stores/runs'
import type { AdministrationRunListItem } from '~/shared/types/run'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const { hasAnyRole, hasPermission } = useAuthorization()
const store = useRunsStore()

const canRun = computed(
  () =>
    hasAnyRole(['Admin', 'Super Admin']) ||
    hasPermission('Administration Run') ||
    hasPermission('Administration Management'),
)

const canSeeAll = computed(
  () => hasAnyRole(['Admin', 'Super Admin']) || hasPermission('Administration Management'),
)

const statusOptions = [
  { label: 'Semua status', value: '' },
  { label: 'Berjalan', value: 'in_progress' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Dibatalkan', value: 'cancelled' },
]

function handleResume(run: AdministrationRunListItem) {
  navigateTo(`/dashboard/docs/runs/${run.id}`)
}

function handleStatusFilter(value: string) {
  store.setStatus(value)
  void store.fetchMine()
}

function handleScopeFilter(value: 'mine' | 'all') {
  store.setScope(value)
  void store.fetchMine()
}
</script>

<template>
  <PageShell
    title="Proses Saya"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Dokumen' }, { label: 'Proses Saya' }]"
    description="Mulai proses dari Administrasi yang terbit, lalu lanjutkan di sini."
  >
    <NAlert
      v-if="!canRun"
      type="error"
      title="Akses Ditolak"
      style="margin-bottom: 16px;"
    >
      Anda tidak memiliki izin untuk menjalankan Administrasi.
    </NAlert>
    <template v-else>
      <NSpace align="center" style="margin-bottom: 12px;">
        <NText depth="3">Mulai proses dari Administrasi terbit, lalu lanjutkan di sini.</NText>
        <NSelect
          :value="store.status"
          :options="statusOptions"
          style="width: 180px;"
          @update:value="handleStatusFilter"
        />
        <NSelect
          v-if="canSeeAll"
          :value="store.scope"
          :options="[
            { label: 'Proses saya', value: 'mine' },
            { label: 'Semua proses', value: 'all' },
          ]"
          style="width: 140px;"
          @update:value="handleScopeFilter"
        />
      </NSpace>
      <RunsTable @resume="handleResume" />
    </template>
  </PageShell>
</template>
