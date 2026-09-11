<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NDrawer, NDrawerContent, NButton, NSpace, NTag, NText, NTimeline,
  NTimelineItem, NPopconfirm, NSpin, useMessage,
} from 'naive-ui'
import { useAdministrationsStore } from '~/stores/administrations'
import { getErrorMessage } from '~/utils/error'
import type { AdministrationDetail } from '~/shared/types/administration'

const props = defineProps<{
  visible: boolean
  administrationId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'edit', id: number): void
  (e: 'open', id: number): void
  (e: 'changed'): void
}>()

const store = useAdministrationsStore()
const message = import.meta.client ? useMessage() : null

const detail = ref<AdministrationDetail | null>(null)
const loading = ref(false)
const acting = ref(false)

async function load() {
  if (props.administrationId == null) return
  loading.value = true
  try {
    detail.value = await store.fetchOne(props.administrationId)
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Gagal memuat administrasi'))
  } finally {
    loading.value = false
  }
}

watch(() => [props.visible, props.administrationId], ([visible]) => {
  if (visible) load()
}, { immediate: true })

function close() {
  emit('update:visible', false)
}

function statusType(status: string) {
  if (status === 'published') return 'success'
  if (status === 'archived') return 'warning'
  return 'default'
}

async function handlePublish() {
  if (detail.value == null) return
  acting.value = true
  try {
    detail.value = await store.publish(detail.value.id)
    message?.success(`Published as v${detail.value.version}`)
    emit('changed')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to publish'))
  } finally {
    acting.value = false
  }
}

async function handleArchive() {
  if (detail.value == null) return
  acting.value = true
  try {
    detail.value = await store.archive(detail.value.id)
    message?.success('Administration archived — new runs blocked')
    emit('changed')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to archive'))
  } finally {
    acting.value = false
  }
}

async function handleDelete() {
  if (detail.value == null) return
  acting.value = true
  try {
    await store.remove(detail.value.id)
    message?.success('Administration deleted')
    emit('changed')
    close()
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to delete'))
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <NDrawer :show="visible" width="560" placement="right" @update:show="(v: boolean) => emit('update:visible', v)">
    <NDrawerContent :title="detail?.name ?? 'Administration detail'" closable>
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
            <span class="detail-label">Status / Version</span>
            <div class="detail-value">
              <NSpace :size="6">
                <NTag :type="statusType(detail.status)" size="small" bordered round>{{ detail.status }}</NTag>
                <NTag size="small" bordered round>v{{ detail.version }}</NTag>
              </NSpace>
            </div>
          </div>
          <div class="detail-field">
            <span class="detail-label">Documents</span>
            <span class="detail-value detail-value--mono">{{ detail.docsCount ?? detail.documentCount ?? 0 }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Steps timeline ({{ detail.stepCount }})</span>
            <NTimeline v-if="(detail.steps ?? []).length > 0" class="mt-1">
              <NTimelineItem v-for="step in detail.steps" :key="step.id" :title="`#${step.order} ${step.name}`">
                <template #default>
                  <NText depth="3" class="text-xs">
                    <template v-if="step.templateMissing">
                      Template #{{ step.templateId }} (deleted)
                    </template>
                    <template v-else-if="step.templateId != null">
                      {{ step.templateName }} · {{ step.templateVersion === 'latest' ? `latest (now v${step.resolvedTemplateVersion})` : `v${step.templateVersion}` }}
                    </template>
                    <template v-else>pure data step</template>
                    · {{ step.fieldCount }} field(s)
                  </NText>
                </template>
              </NTimelineItem>
            </NTimeline>
            <NText v-else depth="3">No steps yet</NText>
          </div>
        </div>
      </NSpin>
      <template #footer>
        <NSpace>
          <NButton :disabled="detail == null" @click="detail && emit('edit', detail.id)">Edit</NButton>
          <NButton :disabled="detail == null" type="primary" ghost @click="detail && emit('open', detail.id)">Open workflow</NButton>
          <NButton :disabled="detail == null || detail.status !== 'draft'" type="primary" :loading="acting" @click="handlePublish">Publish</NButton>
          <NButton :disabled="detail == null || detail.status === 'archived'" :loading="acting" @click="handleArchive">Archive</NButton>
          <NPopconfirm @positive-click="handleDelete">
            <template #trigger>
              <NButton type="error" ghost :disabled="detail == null" :loading="acting">Delete</NButton>
            </template>
            Delete this administration? Blocked when it has documents (archive instead).
          </NPopconfirm>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
