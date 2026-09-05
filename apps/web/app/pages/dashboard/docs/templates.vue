<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
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

function handleDenied(event: Event) {
  const detail = (event as CustomEvent).detail
  deniedMessage.value = detail?.message || 'Access denied'
  showDenied.value = true
}

const showDenied = ref(false)
const deniedMessage = ref('')

if (import.meta.client) {
  window.addEventListener('rbac-denied', handleDenied)
}

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('rbac-denied', handleDenied)
  }
})
</script>

<template>
  <div>
    <NAlert
      v-if="showDenied"
      type="error"
      closable
      title="Access Denied"
      style="margin-bottom: 16px;"
      @close="showDenied = false"
    >
      {{ deniedMessage }}
    </NAlert>
    <NAlert
      v-if="!canManage"
      type="error"
      title="Access Denied"
      style="margin-bottom: 16px;"
    >
      You do not have permission to manage Templates.
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
  </div>
</template>
