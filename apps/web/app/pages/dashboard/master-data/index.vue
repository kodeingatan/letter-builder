<script setup lang="ts">
import { MasterTableDataTable } from '~/components/features/master-data'
import type { MasterTable } from '~/shared/types/master-data'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

function handleBrowse(table: MasterTable) {
  navigateTo(`/dashboard/master-data/${table.slug}`)
}
</script>

<template>
  <PageShell
    title="Master Data"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Master Data' }]"
    description="Definisi tabel dinamis (fisik mst_*) — sumber data surat Task 07."
  >
    <MasterTableDataTable @create="navigateTo('/dashboard/master-data/create')" @browse="handleBrowse" />
  </PageShell>
</template>
