<script setup lang="ts">
import { watch, ref } from 'vue'
import {
  NDrawer, NDrawerContent, NButton, NSpace, NSpin, NText, NEmpty,
  NPopconfirm, NTag, NTimeline, NTimelineItem, NCard, useMessage,
} from 'naive-ui'
import { Edit } from '@vicons/carbon'
import { useAuthStore } from '~/stores/auth'
import { useTemplatesStore } from '~/stores/templates'
import { getErrorMessage } from '~/utils/error'
import type { TemplateDetail, TemplateListItem, TemplateVersion } from '~/shared/types/template'

const props = defineProps<{
  visible: boolean
  templateId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'edit', template: TemplateListItem): void
  (e: 'open', template: TemplateListItem): void
  (e: 'deleted'): void
  (e: 'published'): void
}>()

const detail = ref<TemplateDetail | null>(null)
const loading = ref(false)
const publishing = ref(false)
const snapshot = ref<TemplateVersion | null>(null)
const loadingSnapshot = ref(false)
const message = import.meta.client ? useMessage() : null
const authStore = useAuthStore()
const store = useTemplatesStore()

async function load() {
  if (!props.templateId) return
  loading.value = true
  try {
    detail.value = await $fetch<TemplateDetail>(`/api/templates/${props.templateId}`, {
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

async function handleRollback(version: number) {
  if (!detail.value) return
  try {
    detail.value = await store.rollback(detail.value.id, version)
    message?.success(`Draft restored from v${version} — publish to create a new version`)
    snapshot.value = null
    emit('published')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to roll back template'))
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
    message?.error(getErrorMessage(e, 'Failed to publish template'))
  } finally {
    publishing.value = false
  }
}

async function handleDelete() {
  if (!detail.value) return
  try {
    await store.remove(detail.value.id)
    message?.success('Template deleted')
    emit('update:visible', false)
    emit('deleted')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to delete template'))
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
    <NDrawerContent title="Template Detail">
      <NSpin :show="loading">
        <div v-if="detail" class="detail-view">
          <div class="detail-field">
            <span class="detail-label">Name</span>
            <span class="detail-value">{{ detail.name }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Description</span>
            <span class="detail-value detail-value--text">{{ detail.description || '—' }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Version / Status / Nodes</span>
            <NSpace :size="6">
              <NTag size="small" :bordered="false">v{{ detail.version }}</NTag>
              <NTag :type="detail.status === 'published' ? 'success' : 'default'" size="small" :bordered="false">
                {{ detail.status }}
              </NTag>
              <NTag size="small" :bordered="false" type="info">{{ detail.nodeCount ?? 0 }} nodes</NTag>
            </NSpace>
          </div>
          <div class="detail-field">
            <span class="detail-label">Usage (steps / documents)</span>
            <NEmpty
              v-if="!(detail.usedBy?.stepCount || detail.usedBy?.documentCount)"
              size="small"
              description="Not referenced by any step or document"
            />
            <div v-else class="detail-value--text">
              <div v-if="detail.usedBy.steps.length">
                Steps: {{ detail.usedBy.steps.map((s) => s.name).join(', ') }}
              </div>
              <div v-if="detail.usedBy.documents.length">
                Documents: {{ detail.usedBy.documents.map((d) => d.name).join(', ') }}
              </div>
            </div>
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
                <NSpace :size="6">
                  <NButton text size="small" type="info" @click="handleViewSnapshot(v.version)">
                    View snapshot
                  </NButton>
                  <NButton text size="small" type="warning" @click="handleRollback(v.version)">
                    Roll back to draft
                  </NButton>
                </NSpace>
              </NTimelineItem>
            </NTimeline>
            <NCard v-if="snapshot" size="small" title="Snapshot (read-only, immutable)" style="margin-top: 8px;">
              <NSpin :show="loadingSnapshot">
                <NText code class="detail-value--mono">{{ snapshot.content || '(empty)' }}</NText>
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
          <NButton type="primary" :disabled="!detail" @click="detail && emit('open', detail)">
            Open Editor
          </NButton>
          <NButton type="warning" :disabled="!detail" @click="detail && emit('edit', detail)">
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
              <NButton type="error" :disabled="!detail">
                Delete
              </NButton>
            </template>
            Delete template "{{ detail?.name }}"? Blocked when referenced by a step or document.
          </NPopconfirm>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
