<script setup lang="ts">
import { ref, watch, h } from 'vue'
import {
  NDrawer, NDrawerContent, NButton, NSpace, NSpin, NEmpty, NImage, NAlert, NPopconfirm, NIcon, useMessage,
} from 'naive-ui'
import { Edit, TrashCan } from '@vicons/carbon'
import { useTableDataStore } from '~/stores/tableData'
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
const message = import.meta.client ? useMessage() : null
const row = ref<TableRow | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function fetchRow() {
  if (props.rowId === null) return
  loading.value = true
  error.value = null
  try {
    row.value = await store.fetchOne(props.tableName, props.rowId)
  } catch (e: any) {
    error.value = getErrorMessage(e, 'Gagal memuat baris')
    row.value = null
  } finally {
    loading.value = false
  }
}

watch(() => [props.visible, props.rowId] as const, async ([visible, rowId]) => {
  if (visible && rowId !== null) {
    await fetchRow()
  } else if (!visible) {
    // reset when closed
    error.value = null
  }
})

async function handleDelete() {
  if (!row.value) return
  try {
    await store.remove(props.tableName, row.value.id)
    message?.success('Baris berhasil dihapus')
    emit('update:visible', false)
    emit('deleted')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Gagal menghapus baris'))
  }
}

function handleRetry() {
  fetchRow()
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
  <NDrawer :show="visible" :width="480" placement="right" @update:show="(v) => emit('update:visible', v)">
    <NDrawerContent :title="row ? `Baris #${row.id}` : 'Detail Baris'" closable>
      <NSpin v-if="loading" style="display:flex;justify-content:center;padding:24px" />
      <NAlert
        v-else-if="error"
        type="error"
        closable
        style="margin-bottom:16px"
        @close="error = null"
      >
        <template #header>Gagal memuat baris</template>
        {{ error }}
        <div style="margin-top:8px">
          <NButton size="small" @click="handleRetry">Coba lagi</NButton>
        </div>
      </NAlert>
      <NEmpty v-else-if="!row" description="Baris tidak ditemukan">
        <template #extra>
          <NButton size="small" style="margin-top:8px" @click="handleRetry">Coba lagi</NButton>
        </template>
      </NEmpty>
      <div v-else class="detail-view">
        <div v-for="col in store.columns" :key="col.name" class="detail-field">
          <span class="detail-label">{{ col.displayName }}</span>
          <NImage
            v-if="col.type === 'image' && row[col.name]"
            :src="String(row[col.name])"
            width="120"
            object-fit="cover"
            style="border-radius:6px"
          />
          <span v-else class="detail-value">{{ formatCellValue(col, row[col.name], (row as any)._display?.[col.name]) }}</span>
        </div>
      </div>
      <template #footer>
        <NSpace>
          <NButton v-if="canWrite && row" type="warning" ghost @click="row && emit('edit', row)">
            <template #icon><NIcon><Edit /></NIcon></template>
            Ubah
          </NButton>
          <NPopconfirm
            v-if="canWrite && row"
            positive-text="Hapus"
            negative-text="Batal"
            @positive-click="handleDelete"
          >
            <template #trigger>
              <NButton type="error" ghost>
                <template #icon><NIcon><TrashCan /></NIcon></template>
                Hapus
              </NButton>
            </template>
            Hapus baris #{{ row.id }}? Tindakan tidak dapat dibatalkan.
          </NPopconfirm>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
