<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NAlert, NButton, NCard, NForm, NFormItem, NInput, NSpin, NSpace,
  NTag, NText, NPopconfirm, useMessage,
} from 'naive-ui'
import { TemplateVersionTimeline, TemplateSnapshotViewer } from '~/components/features/templates'
import { useAuthorization } from '~/composables/useAuthorization'
import { useAuthStore } from '~/stores/auth'
import { useTemplatesStore } from '~/stores/templates'
import { getErrorMessage } from '~/utils/error'
import {
  emptySkeleton,
  isNonEmptyContent,
  sampleSkeleton,
  summarizeNode,
  parseContentTree,
  validateContentTree,
} from '~/composables/useTemplatesData'
import type { TemplateDetail, TemplateVersion } from '~/shared/types/template'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()
const store = useTemplatesStore()
const { hasAnyRole, hasPermission } = useAuthorization()

const canManage = computed(
  () => hasAnyRole(['Admin', 'Super Admin']) || hasPermission('Template Management'),
)

const id = computed(() => Number(route.params.id))
const detail = ref<TemplateDetail | null>(null)
const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const rollingBack = ref(false)

const metaForm = ref({ name: '', description: '' })
const contentText = ref('')
const snapshot = ref<TemplateVersion | null>(null)
const loadingSnapshot = ref(false)

const validation = computed(() => validateContentTree(contentText.value || null))
const publishable = computed(() => isNonEmptyContent(contentText.value || null))
const draftNodes = computed(() => parseContentTree(contentText.value || null)?.nodes ?? [])

async function load() {
  if (!id.value || isNaN(id.value)) return
  loading.value = true
  try {
    detail.value = await $fetch<TemplateDetail>(`/api/templates/${id.value}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    metaForm.value = { name: detail.value.name, description: detail.value.description ?? '' }
    contentText.value = detail.value.content ?? emptySkeleton()
    snapshot.value = null
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load template'))
    detail.value = null
  } finally {
    loading.value = false
  }
}

async function handleSaveDraft() {
  if (!detail.value) return
  if (metaForm.value.name.length < 1 || metaForm.value.name.length > 100) {
    message.error('Name must be 1–100 characters')
    return
  }
  if ((contentText.value || '').trim() && !validation.value.valid) {
    message.error(validation.value.error ?? 'Invalid content JSON')
    return
  }
  saving.value = true
  try {
    detail.value = await store.update(detail.value.id, {
      name: metaForm.value.name,
      description: metaForm.value.description || null,
      content: (contentText.value || '').trim() ? contentText.value : null,
    })
    message.success('Draft saved (publish to bump version)')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to save draft'))
  } finally {
    saving.value = false
  }
}

async function handlePublish() {
  if (!detail.value) return
  publishing.value = true
  try {
    // Persist latest editor state first so Publish reflects what the
    // Designer sees (still a single frozen snapshot, AC-002).
    if ((contentText.value || '').trim()) {
      try {
        await store.update(detail.value.id, { content: contentText.value })
      } catch (e: any) {
        message.error(getErrorMessage(e, 'Failed to save draft before publish'))
        return
      }
    }
    detail.value = await store.publish(detail.value.id)
    contentText.value = detail.value.content ?? emptySkeleton()
    message.success(`Published as v${detail.value.version}`)
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to publish template'))
  } finally {
    publishing.value = false
  }
}

async function handleView(version: number) {
  if (!detail.value) return
  loadingSnapshot.value = true
  try {
    snapshot.value = await store.fetchVersion(detail.value.id, version)
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load snapshot'))
  } finally {
    loadingSnapshot.value = false
  }
}

async function handleRollback(version: number) {
  if (!detail.value) return
  rollingBack.value = true
  try {
    detail.value = await store.rollback(detail.value.id, version)
    contentText.value = detail.value.content ?? emptySkeleton()
    snapshot.value = null
    message.success(`Draft restored from v${version} — publish to create v${detail.value.version + 1}`)
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to roll back template'))
  } finally {
    rollingBack.value = false
  }
}

function insertSample() {
  contentText.value = sampleSkeleton()
}

onMounted(() => {
  load()
})
</script>

<template>
  <div>
    <NAlert
      v-if="!canManage"
      type="error"
      title="Access Denied"
      style="margin-bottom: 16px;"
    >
      You do not have permission to manage Templates.
    </NAlert>
    <NSpin v-else :show="loading">
      <div v-if="detail">
        <NSpace align="center" justify="space-between" style="margin-bottom: 12px;">
          <NSpace align="center" :size="8">
            <NButton text @click="navigateTo('/dashboard/docs/templates')">← Templates</NButton>
            <NText strong style="font-size: 16px;">{{ detail.name }}</NText>
            <NTag size="small" :bordered="false">v{{ detail.version }}</NTag>
            <NTag :type="detail.status === 'published' ? 'success' : 'default'" size="small" :bordered="false">
              {{ detail.status }}
            </NTag>
          </NSpace>
          <NSpace :size="8">
            <NButton :loading="saving" @click="handleSaveDraft">Save Draft</NButton>
            <NPopconfirm @positive-click="handlePublish">
              <template #trigger>
                <NButton type="success" :loading="publishing" :disabled="!publishable">
                  Publish
                </NButton>
              </template>
              Publish "{{ detail.name }}"? Freezes an immutable version snapshot.
            </NPopconfirm>
          </NSpace>
        </NSpace>

        <NAlert
          v-if="!publishable"
          type="warning"
          title="Empty draft — publish blocked"
          style="margin-bottom: 12px;"
        >
          Content must contain at least one text node or component placement ({ nodes: [...] }). Full visual canvas
          arrives in Task 15; this editor ships a validated JSON skeleton so the lifecycle works end-to-end.
        </NAlert>

        <div class="grid gap-4 lg:grid-cols-2">
          <!-- Editor column -->
          <NCard size="small" title="Draft working copy (mutable)">
            <NForm label-placement="top">
              <NFormItem label="Name">
                <NInput v-model:value="metaForm.name" maxlength="100" show-count placeholder="e.g. Surat Keputusan" />
              </NFormItem>
              <NFormItem label="Description">
                <NInput
                  v-model:value="metaForm.description"
                  type="textarea"
                  :rows="2"
                  placeholder="Purpose notes for this document blueprint"
                />
              </NFormItem>
              <NFormItem label="Content skeleton JSON — { nodes: [...] }">
                <NInput
                  v-model:value="contentText"
                  type="textarea"
                  :rows="14"
                  placeholder='{"nodes": [{"type": "heading", "text": "Surat Keputusan"}]}'
                  style="font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;"
                />
              </NFormItem>
            </NForm>
            <NAlert v-if="(contentText || '').trim() && !validation.valid" type="error" title="Invalid JSON" style="margin-bottom: 8px;">
              {{ validation.error }}
            </NAlert>
            <NSpace :size="8">
              <NButton size="small" @click="insertSample">Insert sample skeleton</NButton>
              <NText depth="3" style="font-size: 12px;">
                {{ validation.valid ? `${validation.nodeCount} node(s)` : 'unparseable' }} ·
                read-only stub preview below (canvas in Task 15)
              </NText>
            </NSpace>
            <ol style="margin: 8px 0 0; padding-left: 18px;">
              <li v-for="(node, i) in draftNodes" :key="i" style="font-size: 13px; margin-bottom: 4px;">
                <NText code>{{ summarizeNode(node) }}</NText>
              </li>
            </ol>
            <NText v-if="!draftNodes.length" depth="3" style="font-size: 12px;">No nodes yet.</NText>
          </NCard>

          <!-- Timeline column -->
          <div class="flex flex-col gap-4">
            <NCard size="small" title="Version timeline">
              <TemplateVersionTimeline
                :versions="detail.versions ?? []"
                :active-version="snapshot?.version ?? null"
                @view="handleView"
                @rollback="handleRollback"
              />
              <NSpin :show="rollingBack" />
            </NCard>
            <TemplateSnapshotViewer :snapshot="snapshot" :loading="loadingSnapshot" />
          </div>
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
@media (max-width: 1023px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
