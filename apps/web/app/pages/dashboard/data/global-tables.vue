<script setup lang="ts">
import { ref, computed } from 'vue'
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
</script>

<template>
  <PageShell
    title="Tabel Global"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Data' }, { label: 'Tabel Global' }]"
    description="Kelola struktur data dinamis — membuat, mengubah, menghapus skema tabel."
  >
    <template #actions>
      <NAlert v-if="!canManage" type="warning" style="padding: 4px 12px">Mode baca saja</NAlert>
    </template>

    <NAlert
      v-if="!canManage"
      type="error"
      title="Akses Ditolak"
      style="margin-bottom: 16px;"
    >
      Anda tidak memiliki izin untuk mengelola Tabel Global.
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
  </PageShell>
</template>
