<script setup lang="ts">
import { watch, ref } from 'vue'
import {
  NDrawer, NDrawerContent,
  NButton, NSpace, NSpin, NText, NEmpty, NPopconfirm, useMessage,
} from 'naive-ui'
import { Edit, TrashCan } from '@vicons/carbon'
import { useAuthStore } from '~/stores/auth'
import { useGlobalTablesStore } from '~/stores/globalTables'
import { getErrorMessage } from '~/utils/error'
import type { GlobalTable, GlobalTableDetail } from '~/shared/types/global-table'

const props = defineProps<{
  visible: boolean
  tableId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'edit', table: GlobalTable): void
  (e: 'deleted'): void
}>()

const table = ref<GlobalTableDetail | null>(null)
const loading = ref(false)
const message = import.meta.client ? useMessage() : null
const authStore = useAuthStore()
const store = useGlobalTablesStore()

watch(() => props.visible, async (val) => {
  if (val && props.tableId) {
    loading.value = true
    try {
      table.value = await $fetch<GlobalTableDetail>(`/api/global-tables/${props.tableId}`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
    } catch {
      table.value = null
    } finally {
      loading.value = false
    }
  }
})

async function handleDelete() {
  if (!table.value) return
  try {
    await store.remove(table.value.id)
    message?.success('Global table deleted')
    emit('update:visible', false)
    emit('deleted')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to delete global table'))
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

.detail-value--text {
  font-weight: 400;
  color: #334155;
}

.detail-value--mono {
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
  font-size: 13px;
}
</style>

<template>
  <NDrawer :show="visible" @update:show="(v) => emit('update:visible', v)" :width="400">
    <NDrawerContent title="Global Table Detail">
      <NSpin :show="loading">
        <div v-if="table" class="detail-view">
          <div class="detail-field">
            <span class="detail-label">ID</span>
            <span class="detail-value">{{ table.id }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Name</span>
            <span class="detail-value detail-value--mono">{{ table.name }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Display Name</span>
            <span class="detail-value">{{ table.displayName }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Columns</span>
            <span class="detail-value">{{ table.columnCount ?? 0 }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Referenced By</span>
            <div class="detail-value">
              <NEmpty
                v-if="!table.referencedBy?.relations?.length && !table.referencedBy?.bindings?.length"
                size="small"
                description="Not referenced by any resource"
              />
              <ul v-else class="detail-value--text" style="margin: 0; padding-left: 18px;">
                <li v-for="(r, i) in table.referencedBy.relations" :key="`rel-${i}`">
                  Relation from <NText code>{{ r.tableName }}.{{ r.columnName }}</NText>
                </li>
                <li v-for="(b, i) in table.referencedBy.bindings" :key="`bind-${i}`">
                  Binding <NText code>{{ b.source }}: {{ b.ref }}</NText>
                </li>
              </ul>
            </div>
          </div>
          <div class="detail-field">
            <span class="detail-label">Created At</span>
            <span class="detail-value detail-value--mono">{{ new Date(table.createdAt).toLocaleString() }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Updated At</span>
            <span class="detail-value detail-value--mono">{{ new Date(table.updatedAt).toLocaleString() }}</span>
          </div>
        </div>
      </NSpin>
      <template #footer>
        <NSpace>
          <NButton type="primary" @click="table && emit('edit', table)">
            <template #icon><Edit /></template>
            Edit
          </NButton>
          <NPopconfirm @positive-click="handleDelete">
            <template #trigger>
              <NButton type="error">
                <template #icon><TrashCan /></template>
                Delete
              </NButton>
            </template>
            Delete global table "{{ table?.name }}"? Blocked if referenced.
          </NPopconfirm>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
