<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { NAlert } from 'naive-ui'
import { MasterRowTable, MasterRowForm } from '~/components/features/master-data'
import { useMasterDataStore } from '~/stores/master-data'
import type { MasterRow } from '~/shared/types/master-data'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const store = useMasterDataStore()
const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedRow = ref<MasterRow | null>(null)
const tableRef = ref<InstanceType<typeof MasterRowTable> | null>(null)

function handleCreate() {
  formMode.value = 'create'
  selectedRow.value = null
  showForm.value = true
}

function handleEdit(row: MasterRow) {
  formMode.value = 'edit'
  selectedRow.value = row
  showForm.value = true
}

function handleSuccess() {
  tableRef.value?.reload()
}

onMounted(() => {
  store.fetchTable(slug.value).catch(() => {})
  store.fetchSchema(slug.value).catch(() => {})
})

// Same page instance is reused across slugs — refetch on param change.
watch(slug, (next) => {
  store.fetchTable(next).catch(() => {})
  store.fetchSchema(next).catch(() => {})
})
</script>

<template>
  <PageShell
    :title="store.currentTable?.display_name ?? slug"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Master Data', href: '/dashboard/master-data' }, { label: store.currentTable?.display_name ?? slug }]"
    :description="`Browse & kelola baris mst_${slug}`"
  >
    <NAlert v-if="store.error" type="error" class="mb-3" closable>
      {{ store.error }}
      <span v-if="store.error.includes('not found') || store.error.includes('404')"> — <NuxtLink to="/dashboard/master-data" class="underline">Kembali ke Master Data</NuxtLink></span>
    </NAlert>
    <MasterRowTable ref="tableRef" :slug="slug" @create="handleCreate" @edit="handleEdit" />
    <MasterRowForm
      v-model:visible="showForm"
      :mode="formMode"
      :slug="slug"
      :schema="store.currentSchema"
      :row="selectedRow"
      @success="handleSuccess"
    />
  </PageShell>
</template>
