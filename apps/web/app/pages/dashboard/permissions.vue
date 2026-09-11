<script setup lang="ts">
import { ref } from 'vue'
import { PermissionTable, PermissionFormModal, PermissionDetailDrawer } from '~/components/features/users'
import type { Permission } from '~/types/permission'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const showForm = ref(false)
const showDetail = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedPermission = ref<Permission | null>(null)

function handleCreate() {
  formMode.value = 'create'
  selectedPermission.value = null
  showForm.value = true
}

function handleEdit(permission: Permission) {
  formMode.value = 'edit'
  selectedPermission.value = permission
  showForm.value = true
}

function handleDetail(permission: Permission) {
  selectedPermission.value = permission
  showDetail.value = true
}

function handleFormSuccess() {
  showForm.value = false
  selectedPermission.value = null
}
</script>

<template>
  <PageShell
    title="Izin"
    :breadcrumbs="[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Manajemen Pengguna' }, { label: 'Izin' }]"
    description="Kelola izin — metode dan URL yang diizinkan."
  >
    <PermissionTable @create="handleCreate" @edit="handleEdit" @detail="handleDetail" />
    <PermissionFormModal
      v-model:visible="showForm"
      :mode="formMode"
      :permission="selectedPermission"
      @success="handleFormSuccess"
    />
    <PermissionDetailDrawer
      v-model:visible="showDetail"
      :permission-id="selectedPermission?.id ?? null"
      @edit="handleEdit"
    />
  </PageShell>
</template>
