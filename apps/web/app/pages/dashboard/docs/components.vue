<script setup lang="ts">
import { ref, computed } from 'vue'
import { NAlert } from 'naive-ui'
import { ComponentTable, ComponentFormModal, ComponentDetailDrawer } from '~/components/features/components'
import { useAuthorization } from '~/composables/useAuthorization'
import type { ComponentListItem } from '~/shared/types/component'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const { hasAnyRole, hasPermission } = useAuthorization()

const canManage = computed(
  () => hasAnyRole(['Admin', 'Super Admin']) || hasPermission('Component Management'),
)

const showForm = ref(false)
const showDetail = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedComponent = ref<ComponentListItem | null>(null)

function handleCreate() {
  formMode.value = 'create'
  selectedComponent.value = null
  showForm.value = true
}

function handleEdit(component: ComponentListItem) {
  formMode.value = 'edit'
  selectedComponent.value = component
  showDetail.value = false
  showForm.value = true
}

function handleDetail(component: ComponentListItem) {
  selectedComponent.value = component
  showDetail.value = true
}

function handleFormSuccess() {
  showForm.value = false
  selectedComponent.value = null
}

function handleDeleted() {
  selectedComponent.value = null
}
</script>

<template>
  <PageShell
    title="Komponen"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Dokumen' }, { label: 'Komponen' }]"
    description="Kelola blok dokumen reusable — header, footer, tanda tangan."
  >
    <NAlert
      v-if="!canManage"
      type="error"
      title="Akses Ditolak"
      style="margin-bottom: 16px;"
    >
      Anda tidak memiliki izin untuk mengelola Komponen.
    </NAlert>
    <template v-else>
      <ComponentTable @create="handleCreate" @edit="handleEdit" @detail="handleDetail" />
      <ComponentFormModal
        v-model:visible="showForm"
        :mode="formMode"
        :component-id="selectedComponent?.id ?? null"
        @success="handleFormSuccess"
      />
      <ComponentDetailDrawer
        v-model:visible="showDetail"
        :component-id="selectedComponent?.id ?? null"
        @edit="handleEdit"
        @deleted="handleDeleted"
        @published="handleDeleted"
      />
    </template>
  </PageShell>
</template>
