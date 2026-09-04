<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { NButton, NIcon, NTag, NSpace, NText, NDrawer, NDrawerContent } from 'naive-ui'
import { Add, Edit, TrashCan, DragHandle } from '@vicons/carbon'
import GlobalTableColumnFormModal from './GlobalTableColumnFormModal.vue'
import { useGlobalTableColumnsStore } from '~/stores/global-table-columns'
import { getErrorMessage } from '~/utils/error'
import type { GlobalTableColumn } from '~/shared/types/global-table-column'

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', column: GlobalTableColumn): void
  (e: 'detail', column: GlobalTableColumn): void
}>()

const store = useGlobalTableColumnsStore()

const props = defineProps({
  tableId: { type: Number, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})

const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const selectedColumn = ref<GlobalTableColumn | null>(null)

const typeColors = computed(() => {
  const map: Record<string, any> = {
    text: 'default',
    richtext: 'info',
    date: 'success',
    select: 'warning',
    number: 'primary',
    currency: 'purple',
    image: 'warning',
  }
  return map
})

function handleCreate() {
  modalMode.value = 'create'
  selectedColumn.value = null
  showModal.value = true
}

function handleEdit(column: GlobalTableColumn) {
  modalMode.value = 'edit'
  selectedColumn.value = column
  showModal.value = true
}

function handleFormSuccess() {
  showModal.value = false
  selectedColumn.value = null
}

async function handleDelete(id: number) {
  try {
    await store.remove(props.tableId, id)
  } catch (e: any) {
    // Error already handled in store
  }
}

onMounted(() => {
  if (props.tableId) {
    store.fetchAll(props.tableId)
  }
})

watch(() => props.tableId, (newId) => {
  if (newId) {
    store.fetchAll(newId)
  }
})
</script>

<template>
  <div>
    <div class="mb-4">
      <NSpace justify="space-between">
        <div>
          <h3 class="text-lg font-semibold">Columns</h3>
          <p class="text-sm text-gray-500 mt-1">Manage columns for this table ({{ store.columns.length }})</p>
        </div>
        <NButton type="primary" size="small" @click="handleCreate">
          <template #icon><NIcon><Add /></NIcon></template>
          Add Column
        </NButton>
      </NSpace>
    </div>

    <NAlert
      v-if="store.error"
      type="error"
      class="mb-4"
      closable
      @close="store.error = null"
    >
      {{ store.error }}
    </NAlert>

    <div v-if="store.loading" class="flex justify-center py-8">
      <NSpin size="small" />
    </div>

    <div v-else-if="store.columns.length === 0" class="text-center py-8">
      <NEmpty description="No columns yet — add the first column" />
    </div>

    <div v-else>
      <div class="border rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500">Type</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500">Required</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500">Searchable</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500">Orderable</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="(column, index) in store.columns"
              :key="column.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <NIcon size="14" :component="DragHandle" class="text-gray-400 cursor-move" />
                  <NText code>{{ column.name }}</NText>
                  <span class="text-xs text-gray-400">{{ column.displayName }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <NTag :type="typeColors[column.type] || 'default'" size="small">
                  {{ column.type }}
                </NTag>
              </td>
              <td class="px-4 py-3">
                <NTag :type="column.required ? 'error' : 'success'" size="small">
                  {{ column.required ? 'Yes' : 'No' }}
                </NTag>
              </td>
              <td class="px-4 py-3">
                <NTag :type="column.searchable ? 'warning' : 'default'" size="small">
                  {{ column.searchable ? 'Yes' : 'No' }}
                </NTag>
              </td>
              <td class="px-4 py-3">
                <NTag :type="column.orderable ? 'info' : 'default'" size="small">
                  {{ column.orderable ? 'Yes' : 'No' }}
                </NTag>
              </td>
              <td class="px-4 py-3">
                <NSpace size="4">
                  <NButton size="small" quaternary type="info" @click="emit('detail', column)">
                    <template #icon><NIcon><Edit /></NIcon></template>
                  </NButton>
                  <NButton size="small" quaternary type="warning" @click="handleEdit(column)">
                    <template #icon><NIcon><Edit /></NIcon></template>
                  </NButton>
                  <NButton size="small" quaternary type="error" @click="handleDelete(column.id)">
                    <template #icon><NIcon><TrashCan /></NIcon></template>
                  </NButton>
                </NSpace>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <GlobalTableColumnFormModal
      v-model:visible="showModal"
      :mode="modalMode"
      :table-id="props.tableId"
      :column="selectedColumn"
      @success="handleFormSuccess"
    />
  </div>
</template>
