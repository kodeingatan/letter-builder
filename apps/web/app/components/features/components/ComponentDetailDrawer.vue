<script setup lang="ts">
import { watch, ref } from 'vue'
import {
  NDrawer, NDrawerContent, NButton, NSpace, NSpin, NText, NEmpty,
  NPopconfirm, NTag, NTable, NTimeline, NTimelineItem, NCard, useMessage,
} from 'naive-ui'
import { Edit, TrashCan } from '@vicons/carbon'
import { useAuthStore } from '~/stores/auth'
import { useComponentsStore } from '~/stores/components'
import { getErrorMessage } from '~/utils/error'
import type { ComponentDetail, ComponentListItem, ComponentVersion } from '~/shared/types/component'

const props = defineProps<{
  visible: boolean
  componentId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'edit', component: ComponentListItem): void
  (e: 'deleted'): void
  (e: 'published'): void
}>()

const detail = ref<ComponentDetail | null>(null)
const loading = ref(false)
const publishing = ref(false)
const snapshot = ref<ComponentVersion | null>(null)
const loadingSnapshot = ref(false)
const message = import.meta.client ? useMessage() : null
const authStore = useAuthStore()
const store = useComponentsStore()

async function load() {
  if (!props.componentId) return
  loading.value = true
  try {
    detail.value = await $fetch<ComponentDetail>(`/api/components/${props.componentId}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    snapshot.value = null
    load()
  }
})

async function handleViewSnapshot(version: number) {
  if (!detail.value) return
  loadingSnapshot.value = true
  try {
    snapshot.value = await store.fetchVersion(detail.value.id, version)
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to load snapshot'))
  } finally {
    loadingSnapshot.value = false
  }
}

async function handlePublish() {
  if (!detail.value) return
  publishing.value = true
  try {
    detail.value = await store.publish(detail.value.id)
    message?.success(`Published as v${detail.value.version}`)
    emit('published')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to publish component'))
  } finally {
    publishing.value = false
  }
}

async function handleDelete() {
  if (!detail.value) return
  try {
    await store.remove(detail.value.id)
    message?.success('Component deleted')
    emit('update:visible', false)
    emit('deleted')
  } catch (e: any) {
    const usedBy = e.data?.data?.usedBy as Array<{ name: string }> | undefined
    const extra = usedBy?.length ? `: bound by ${usedBy.map((t) => t.name).join(', ')}` : ''
    message?.error(getErrorMessage(e, 'Failed to delete component') + extra)
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
  <NDrawer :show="visible" :width="440" @update:show="(v) => emit('update:visible', v)">
    <NDrawerContent title="Component Detail">
      <NSpin :show="loading">
        <div v-if="detail" class="detail-view">
          <div class="detail-field">
            <span class="detail-label">Name</span>
            <span class="detail-value">{{ detail.name }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Mode / Version / Status</span>
            <NSpace :size="6">
              <NTag :type="detail.looping ? 'warning' : 'info'" size="small" :bordered="false">
                {{ detail.looping ? 'Collection' : 'Single' }}
              </NTag>
              <NTag size="small" :bordered="false">v{{ detail.version }}</NTag>
              <NTag :type="detail.status === 'published' ? 'success' : 'default'" size="small" :bordered="false">
                {{ detail.status }}
              </NTag>
            </NSpace>
          </div>
          <div class="detail-field">
            <span class="detail-label">Content</span>
            <NText code class="detail-value--mono">{{ detail.content || '(empty)' }}</NText>
          </div>
          <div class="detail-field">
            <span class="detail-label">Requirements ({{ detail.requirements?.length ?? 0 }})</span>
            <NEmpty v-if="!detail.requirements?.length" size="small" description="No requirements declared" />
            <NTable v-else size="small" :bordered="false">
              <thead>
                <tr><th>Name</th><th>Type</th></tr>
              </thead>
              <tbody>
                <tr v-for="r in detail.requirements" :key="r.name">
                  <td><NText code>{{ r.name }}</NText></td>
                  <td><NTag size="small" :bordered="false">{{ r.type }}</NTag></td>
                </tr>
              </tbody>
            </NTable>
          </div>
          <div class="detail-field">
            <span class="detail-label">Used By Templates ({{ detail.usageCount ?? 0 }})</span>
            <NEmpty v-if="!detail.usedBy?.length" size="small" description="Not bound by any template" />
            <ul v-else class="detail-value--text" style="margin: 0; padding-left: 18px;">
              <li v-for="t in detail.usedBy" :key="t.id">{{ t.name }}</li>
            </ul>
          </div>
          <div class="detail-field">
            <span class="detail-label">Version History</span>
            <NEmpty v-if="!detail.versions?.length" size="small" description="Not published yet — no snapshots" />
            <NTimeline v-else>
              <NTimelineItem
                v-for="v in detail.versions"
                :key="v.version"
                type="success"
                :title="`v${v.version} — ${new Date(v.createdAt).toLocaleString()}`"
              >
                <NButton text size="small" type="info" @click="handleViewSnapshot(v.version)">
                  View snapshot
                </NButton>
              </NTimelineItem>
            </NTimeline>
            <NCard v-if="snapshot" size="small" title="Snapshot (read-only)" style="margin-top: 8px;">
              <NSpin :show="loadingSnapshot">
                <NText code class="detail-value--mono">{{ snapshot.content || '(empty)' }}</NText>
                <div style="margin-top: 8px;">
                  <NTag v-for="r in snapshot.requirements" :key="r.name" size="small" :bordered="false" style="margin-right: 4px;">
                    {{ r.name }}:{{ r.type }}
                  </NTag>
                </div>
              </NSpin>
            </NCard>
          </div>
          <div class="detail-field">
            <span class="detail-label">Created At</span>
            <span class="detail-value detail-value--mono">{{ new Date(detail.createdAt).toLocaleString() }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Updated At</span>
            <span class="detail-value detail-value--mono">{{ new Date(detail.updatedAt).toLocaleString() }}</span>
          </div>
        </div>
      </NSpin>
      <template #footer>
        <NSpace>
          <NButton type="primary" :disabled="!detail" @click="detail && emit('edit', detail)">
            <template #icon><Edit /></template>
            Edit
          </NButton>
          <NPopconfirm @positive-click="handlePublish">
            <template #trigger>
              <NButton type="success" :loading="publishing" :disabled="!detail">
                Publish
              </NButton>
            </template>
            Publish "{{ detail?.name }}"? Freezes an immutable version snapshot.
          </NPopconfirm>
          <NPopconfirm @positive-click="handleDelete">
            <template #trigger>
              <NButton type="error">
                <template #icon><TrashCan /></template>
                Delete
              </NButton>
            </template>
            Delete component "{{ detail?.name }}"? Blocked when bound by a template.
          </NPopconfirm>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
