<script setup lang="ts">
import { MasterTableForm } from '~/components/features/master-data'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

function handleSuccess(slug: string) {
  navigateTo(`/dashboard/master-data/${slug}`)
}
</script>

<template>
  <PageShell
    title="Buat Tabel Master"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Master Data', href: '/dashboard/master-data' }, { label: 'Buat Tabel' }]"
    description="Definisikan kolom — tabel fisik mst_* dibuat otomatis via DDL aman."
  >
    <MasterTableForm mode="create" @success="handleSuccess" />
  </PageShell>
</template>
