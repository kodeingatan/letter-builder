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
  { label: 'All statuses', value: '' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
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
  <div>
    <NAlert
      v-if="!canRun"
      type="error"
      title="Access Denied"
      style="margin-bottom: 16px;"
    >
      You do not have permission to run Administrations.
    </NAlert>
    <template v-else>
      <NSpace align="center" style="margin-bottom: 12px;">
        <NText depth="3">Start a run from a published Administration, then resume it here.</NText>
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
            { label: 'My runs', value: 'mine' },
            { label: 'All runs', value: 'all' },
          ]"
          style="width: 140px;"
          @update:value="handleScopeFilter"
        />
      </NSpace>
      <RunsTable @resume="handleResume" />
    </template>
  </div>
</template>
