<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { NAlert } from 'naive-ui'
import { GlobalTableTable, GlobalTableFormModal, GlobalTableDetailDrawer } from '~/components/features/global-tables'
import { useAuthorization } from '~/composables/useAuthorization'
import type { GlobalTable } from '~/shared/types/global-table'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const { hasAnyRole, hasPermission } = useAuthorization()

const canManage = computed(
  () => hasAnyRole(['Admin', 'Super Admin']) || hasPermission('Global Table Management'),
)

const showForm = ref(false)
const showDetail = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedTable = ref<GlobalTable | null>(null)

function handleCreate() {
  formMode.value = 'create'
  selectedTable.value = null
  showForm.value = true
}

function handleEdit(table: GlobalTable) {
  formMode.value = 'edit'
  selectedTable.value = table
  showDetail.value = false
  showForm.value = true
}

function handleDetail(table: GlobalTable) {
  selectedTable.value = table
  showDetail.value = true
}

function handleFormSuccess() {
  showForm.value = false
  selectedTable.value = null
}

function handleDeleted() {
  selectedTable.value = null
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
      You do not have permission to manage Global Tables.
    </NAlert>
    <template v-else>
      <GlobalTableTable @create="handleCreate" @edit="handleEdit" @detail="handleDetail" />
      <GlobalTableFormModal
        v-model:visible="showForm"
        :mode="formMode"
        :table="selectedTable"
        @success="handleFormSuccess"
      />
      <GlobalTableDetailDrawer
        v-model:visible="showDetail"
        :table-id="selectedTable?.id ?? null"
        @edit="handleEdit"
        @deleted="handleDeleted"
      />
    </template>
  </div>
</template>
