<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { NAlert, NSpin } from 'naive-ui'
import { MasterTableForm } from '~/components/features/master-data'
import { useMasterDataStore } from '~/stores/master-data'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const store = useMasterDataStore()
const ready = ref(false)

onMounted(async () => {
  ready.value = false
  try {
    await store.fetchTable(slug.value)
  } catch {
    // error surfaces via store.error
  } finally {
    ready.value = true
  }
})

watch(slug, async (next) => {
  ready.value = false
  try {
    await store.fetchTable(next)
  } catch {
    // error surfaces via store.error
  } finally {
    ready.value = true
  }
})

function handleSuccess(nextSlug: string) {
  navigateTo(`/dashboard/master-data/${nextSlug}`)
}
</script>

<template>
  <PageShell
    title="Ubah Tabel Master"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Master Data', href: '/dashboard/master-data' }, { label: slug }]"
    :description="`Alter aman mst_${slug} — tambah kolom langsung, hapus/ubah via rebuild + backup.`"
  >
    <NSpin v-if="!ready" />
    <NAlert v-else-if="store.error" type="error">{{ store.error }}</NAlert>
    <MasterTableForm v-else mode="edit" :table="store.currentTable" @success="handleSuccess" />
  </PageShell>
</template>
