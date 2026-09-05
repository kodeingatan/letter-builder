<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
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
      You do not have permission to manage Components.
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
  </div>
</template>
