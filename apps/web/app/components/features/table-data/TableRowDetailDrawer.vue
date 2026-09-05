<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NDrawer, NDrawerContent, NButton, NSpace, NSpin, NEmpty, NImage, useMessage,
} from 'naive-ui'
import { useTableDataStore } from '~/stores/tableData'
import { useAuthStore } from '~/stores/auth'
import { getErrorMessage } from '~/utils/error'
import { formatCellValue } from '~/utils/table-data-format'
import type { TableRow } from '~/shared/types/table-data'

const props = defineProps<{
  visible: boolean
  tableName: string
  rowId: number | null
  canWrite: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'edit', row: TableRow): void
  (e: 'deleted'): void
}>()

const store = useTableDataStore()
const authStore = useAuthStore()
const message = import.meta.client ? useMessage() : null
const row = ref<TableRow | null>(null)
const loading = ref(false)

watch(() => [props.visible, props.rowId] as const, async ([visible, rowId]) => {
  if (visible && rowId !== null) {
    loading.value = true
    try {
      row.value = await store.fetchOne(props.tableName, rowId)
    } catch {
      row.value = null
    } finally {
      loading.value = false
    }
  }
})

async function handleDelete() {
  if (!row.value) return
  try {
    await store.remove(props.tableName, row.value.id)
    message?.success('Row deleted')
    emit('update:visible', false)
    emit('deleted')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to delete row'))
  }
}
</script>

<style scoped>
.detail-view {
  display: flex;
  flex-direction: column;
}
.detail-field {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.detail-field:last-child {
  border-bottom: none;
}
.detail-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 4px;
}
.detail-value {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.5;
  word-break: break-word;
}
</style>

<template>
  <NDrawer :show="visible" width="480" placement="right" @update:show="(v) => emit('update:visible', v)">
    <NDrawerContent :title="row ? `Row #${row.id}` : 'Row detail'" closable>
      <NSpin v-if="loading" />
      <NEmpty v-else-if="!row" description="Row not found" />
      <div v-else class="detail-view">
        <div v-for="col in store.columns" :key="col.name" class="detail-field">
          <span class="detail-label">{{ col.displayName }}</span>
          <NImage
            v-if="col.type === 'image' && row[col.name]"
            :src="String(row[col.name])"
            width="120"
            object-fit="cover"
          />
          <span v-else class="detail-value">{{ formatCellValue(col, row[col.name], row._display?.[col.name]) }}</span>
        </div>
      </div>
      <template #footer>
        <NSpace>
          <NButton v-if="canWrite && row" type="warning" ghost @click="row && emit('edit', row)">Edit</NButton>
          <NButton v-if="canWrite && row" type="error" ghost @click="handleDelete">Delete</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
