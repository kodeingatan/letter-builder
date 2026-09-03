<script setup lang="ts">
import { ref } from 'vue'
import { UserTable, UserFormModal, UserDetailDrawer } from '~/components/features/users'
import type { User } from '~/shared/types/user'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const showForm = ref(false)
const showDetail = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedUser = ref<User | null>(null)

function handleCreate() {
  formMode.value = 'create'
  selectedUser.value = null
  showForm.value = true
}

function handleEdit(user: User) {
  formMode.value = 'edit'
  selectedUser.value = user
  showForm.value = true
}

function handleDetail(user: User) {
  selectedUser.value = user
  showDetail.value = true
}

function handleFormSuccess() {
  showForm.value = false
  selectedUser.value = null
}
</script>

<template>
  <div>
    <UserTable @create="handleCreate" @edit="handleEdit" @detail="handleDetail" />
    <UserFormModal
      v-model:visible="showForm"
      :mode="formMode"
      :user="selectedUser"
      @success="handleFormSuccess"
    />
    <UserDetailDrawer
      v-model:visible="showDetail"
      :user-id="selectedUser?.id ?? null"
      @edit="handleEdit"
    />
  </div>
</template>
