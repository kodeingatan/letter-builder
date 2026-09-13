<script setup lang="ts">
import { onMounted } from 'vue'
import { NCard, NSpin, NEmpty, NButton, NIcon } from 'naive-ui'
import { Document } from '@vicons/carbon'
import { usePersuratanStore } from '~/stores/persuratan'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const store = usePersuratanStore()

onMounted(() => {
  store.fetchAdministrations().catch(() => {})
})
</script>

<template>
  <PageShell
    title="Dokumen"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Persuratan' }, { label: 'Dokumen' }]"
    description="Menu per surat — pilih administrasi untuk menjalankan wizard."
  >
    <NSpin v-if="store.loading && store.administrations.length === 0" />
    <NEmpty v-else-if="store.administrations.length === 0" description="Belum ada administrasi — buat dahulu di menu Administrasi">
      <template #extra>
        <NButton type="primary" @click="navigateTo('/dashboard/administrations')">Ke Administrasi</NButton>
      </template>
    </NEmpty>
    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <NCard
        v-for="admin in store.administrations"
        :key="admin.id"
        :title="admin.name"
        hoverable
        class="cursor-pointer"
        @click="navigateTo(`/dashboard/documents/${admin.slug}`)"
      >
        <template #header-extra><NIcon><Document /></NIcon></template>
        <p class="text-sm opacity-70">{{ admin.description || 'Tanpa keterangan' }}</p>
        <p class="text-xs mt-1 font-mono opacity-50">/{{ admin.slug }}</p>
      </NCard>
    </div>
  </PageShell>
</template>
