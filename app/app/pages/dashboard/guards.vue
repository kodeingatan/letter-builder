<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { GuardTable, GuardFormModal, GuardDetailDrawer } from '~/components/features/users'
import type { Guard } from '~/types/guard'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const showForm = ref(false)
const showDetail = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedGuard = ref<Guard | null>(null)

function handleCreate() {
  formMode.value = 'create'
  selectedGuard.value = null
  showForm.value = true
}

function handleEdit(guard: Guard) {
  formMode.value = 'edit'
  selectedGuard.value = guard
  showForm.value = true
}

function handleDetail(guard: Guard) {
  selectedGuard.value = guard
  showDetail.value = true
}

function handleFormSuccess() {
  showForm.value = false
  selectedGuard.value = null
}
</script>

<template>
  <div>
    <GuardTable @create="handleCreate" @edit="handleEdit" @detail="handleDetail" />
    <GuardFormModal
      v-model:visible="showForm"
      :mode="formMode"
      :guard="selectedGuard"
      @success="handleFormSuccess"
    />
    <GuardDetailDrawer
      v-model:visible="showDetail"
      :guard-id="selectedGuard?.id ?? null"
      @edit="handleEdit"
    />
  </div>
</template>
