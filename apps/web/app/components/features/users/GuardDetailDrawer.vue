<script setup lang="ts">
import { watch, ref } from 'vue'
import {
  NDrawer, NDrawerContent,
  NTag, NButton, NSpace, NSpin,
} from 'naive-ui'
import { Edit } from '@vicons/carbon'
import type { Guard } from '~/shared/types/guard'

const props = defineProps<{
  visible: boolean
  guardId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'edit', guard: Guard): void
}>()

const guard = ref<Guard | null>(null)
const loading = ref(false)

watch(() => props.visible, async (val) => {
  if (val && props.guardId) {
    loading.value = true
    try {
      const data = await $fetch<Guard>(`/api/guards/${props.guardId}`, {
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      guard.value = data
    } catch {
      guard.value = null
    } finally {
      loading.value = false
    }
  }
})
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
    <NDrawerContent title="Guard Detail">
      <NSpin :show="loading">
        <div v-if="guard" class="detail-view">
          <div class="detail-field">
            <span class="detail-label">ID</span>
            <span class="detail-value">{{ guard.id }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Guard Name</span>
            <span class="detail-value">{{ guard.guardName }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Description</span>
            <span class="detail-value detail-value--text">{{ guard.description || '-' }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Allow URLs</span>
            <div class="detail-value">
              <NSpace :size="4">
                <NTag v-for="u in guard.urls?.filter((u) => u.type === 'allow')" :key="u.id" size="small" type="success" round>
                  {{ u.url }}
                </NTag>
              </NSpace>
            </div>
          </div>
          <div class="detail-field">
            <span class="detail-label">Deny URLs</span>
            <div class="detail-value">
              <NSpace :size="4">
                <NTag v-for="u in guard.urls?.filter((u) => u.type === 'deny')" :key="u.id" size="small" type="error" round>
                  {{ u.url }}
                </NTag>
              </NSpace>
            </div>
          </div>
          <div class="detail-field">
            <span class="detail-label">Created At</span>
            <span class="detail-value detail-value--mono">{{ new Date(guard.createdAt).toLocaleString() }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Updated At</span>
            <span class="detail-value detail-value--mono">{{ new Date(guard.updatedAt).toLocaleString() }}</span>
          </div>
        </div>
      </NSpin>
      <template #footer>
        <NSpace>
          <NButton type="primary" @click="guard && emit('edit', guard)">
            <template #icon><Edit /></template>
            Edit
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
