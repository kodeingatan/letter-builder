<script setup lang="ts">
import { ref } from 'vue'
import { RoleTable, RoleFormModal, RoleDetailDrawer } from '~/components/features/users'
import type { Role } from '~/types/role'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const showForm = ref(false)
const showDetail = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedRole = ref<Role | null>(null)

function handleCreate() {
  formMode.value = 'create'
  selectedRole.value = null
  showForm.value = true
}

function handleEdit(role: Role) {
  formMode.value = 'edit'
  selectedRole.value = role
  showForm.value = true
}

function handleDetail(role: Role) {
  selectedRole.value = role
  showDetail.value = true
}

function handleFormSuccess() {
  showForm.value = false
  selectedRole.value = null
}
</script>

<template>
  <div>
    <RoleTable @create="handleCreate" @edit="handleEdit" @detail="handleDetail" />
    <RoleFormModal
      v-model:visible="showForm"
      :mode="formMode"
      :role="selectedRole"
      @success="handleFormSuccess"
    />
    <RoleDetailDrawer
      v-model:visible="showDetail"
      :role-id="selectedRole?.id ?? null"
      @edit="handleEdit"
    />
  </div>
</template>
