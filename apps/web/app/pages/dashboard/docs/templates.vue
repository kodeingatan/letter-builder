<script setup lang="ts">
import { ref, computed } from 'vue'
import { NAlert } from 'naive-ui'
import { TemplateTable, TemplateFormModal, TemplateDetailDrawer } from '~/components/features/templates'
import { useAuthorization } from '~/composables/useAuthorization'
import type { TemplateListItem } from '~/shared/types/template'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const { hasAnyRole, hasPermission } = useAuthorization()

const canManage = computed(
  () => hasAnyRole(['Admin', 'Super Admin']) || hasPermission('Template Management'),
)

const showForm = ref(false)
const showDetail = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedTemplate = ref<TemplateListItem | null>(null)

function handleCreate() {
  formMode.value = 'create'
  selectedTemplate.value = null
  showForm.value = true
}

function handleEdit(template: TemplateListItem) {
  formMode.value = 'edit'
  selectedTemplate.value = template
  showDetail.value = false
  showForm.value = true
}

function handleDetail(template: TemplateListItem) {
  selectedTemplate.value = template
  showDetail.value = true
}

function handleOpen(template: TemplateListItem) {
  navigateTo(`/dashboard/docs/templates/${template.id}`)
}

function handleFormSuccess() {
  showForm.value = false
  selectedTemplate.value = null
}

function handleDeleted() {
  selectedTemplate.value = null
}
</script>

<template>
  <PageShell
    title="Templat"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Dokumen' }, { label: 'Templat' }]"
    description="Kelola blueprint dokumen — komposisi, versi, binding data."
  >
    <NAlert
      v-if="!canManage"
      type="error"
      title="Akses Ditolak"
      style="margin-bottom: 16px;"
    >
      Anda tidak memiliki izin untuk mengelola Templat.
    </NAlert>
    <template v-else>
      <TemplateTable
        @create="handleCreate"
        @edit="handleEdit"
        @detail="handleDetail"
        @open="handleOpen"
      />
      <TemplateFormModal
        v-model:visible="showForm"
        :mode="formMode"
        :template-id="selectedTemplate?.id ?? null"
        @success="handleFormSuccess"
      />
      <TemplateDetailDrawer
        v-model:visible="showDetail"
        :template-id="selectedTemplate?.id ?? null"
        @edit="handleEdit"
        @open="handleOpen"
        @deleted="handleDeleted"
        @published="handleDeleted"
      />
    </template>
  </PageShell>
</template>
