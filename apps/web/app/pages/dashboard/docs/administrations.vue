<script setup lang="ts">
import { ref, computed } from 'vue'
import { NAlert } from 'naive-ui'
import { AdministrationTable, AdministrationFormModal, AdministrationDetailDrawer } from '~/components/features/administrations'
import { useAuthorization } from '~/composables/useAuthorization'
import type { AdministrationListItem } from '~/shared/types/administration'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const { hasAnyRole, hasPermission } = useAuthorization()

const canManage = computed(
  () => hasAnyRole(['Admin', 'Super Admin']) || hasPermission('Administration Management'),
)

const showForm = ref(false)
const showDetail = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedAdministration = ref<AdministrationListItem | null>(null)

function handleCreate() {
  formMode.value = 'create'
  selectedAdministration.value = null
  showForm.value = true
}

function handleEdit(administration: AdministrationListItem) {
  formMode.value = 'edit'
  selectedAdministration.value = administration
  showDetail.value = false
  showForm.value = true
}

function handleDetail(administration: AdministrationListItem) {
  selectedAdministration.value = administration
  showDetail.value = true
}

function handleOpen(administration: AdministrationListItem) {
  navigateTo(`/dashboard/docs/administrations/${administration.id}`)
}

function handleFormSuccess() {
  showForm.value = false
  selectedAdministration.value = null
}

function handleChanged() {
  selectedAdministration.value = null
}
</script>

<template>
  <PageShell
    title="Administrasi"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Dokumen' }, { label: 'Administrasi' }]"
    description="Kelola workflow pengumpulan data — langkah, template, versi."
  >
    <NAlert
      v-if="!canManage"
      type="error"
      title="Akses Ditolak"
      style="margin-bottom: 16px;"
    >
      Anda tidak memiliki izin untuk mengelola Administrasi.
    </NAlert>
    <template v-else>
      <AdministrationTable
        @create="handleCreate"
        @edit="handleEdit"
        @detail="handleDetail"
        @open="handleOpen"
      />
      <AdministrationFormModal
        v-model:visible="showForm"
        :mode="formMode"
        :administration-id="selectedAdministration?.id ?? null"
        @success="handleFormSuccess"
      />
      <AdministrationDetailDrawer
        v-model:visible="showDetail"
        :administration-id="selectedAdministration?.id ?? null"
        @edit="(id) => handleEdit({ id } as AdministrationListItem)"
        @open="(id) => handleOpen({ id } as AdministrationListItem)"
        @changed="handleChanged"
      />
    </template>
  </PageShell>
</template>
