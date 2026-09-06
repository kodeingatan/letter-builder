<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NAlert, NButton, NCard, NSpin, NSpace, NTag, NText,
  NPopconfirm, NTimeline, NTimelineItem, useMessage,
} from 'naive-ui'
import { AdministrationWorkflowEditor } from '~/components/features/administrations'
import { DocumentsTable } from '~/components/features/documents'
import { useAuthorization } from '~/composables/useAuthorization'
import { useAdministrationsStore } from '~/stores/administrations'
import { getErrorMessage } from '~/utils/error'
import type { AdministrationDetail } from '~/shared/types/administration'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const route = useRoute()
const message = useMessage()
const store = useAdministrationsStore()
const { hasAnyRole, hasPermission } = useAuthorization()

const canManage = computed(
  () => hasAnyRole(['Admin', 'Super Admin']) || hasPermission('Administration Management'),
)

const id = computed(() => Number(route.params.id))
const detail = ref<AdministrationDetail | null>(null)
const loading = ref(false)
const acting = ref(false)
const editorRef = ref<{ reload: () => void } | null>(null)

const readonly = computed(() => detail.value?.status !== 'draft')

function statusType(status: string | undefined) {
  if (status === 'published') return 'success'
  if (status === 'archived') return 'warning'
  return 'default'
}

async function load() {
  loading.value = true
  try {
    detail.value = await store.fetchOne(id.value)
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load administration'))
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function handlePublish() {
  acting.value = true
  try {
    detail.value = await store.publish(id.value)
    message.success(`Published as v${detail.value.version}`)
    editorRef.value?.reload()
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to publish'))
  } finally {
    acting.value = false
  }
}

async function handleArchive() {
  acting.value = true
  try {
    detail.value = await store.archive(id.value)
    message.success('Administration archived — new runs blocked')
    editorRef.value?.reload()
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to archive'))
  } finally {
    acting.value = false
  }
}

async function handleNewVersion() {
  acting.value = true
  try {
    detail.value = await store.newVersion(id.value)
    message.success('New draft version opened — steps are editable again')
    editorRef.value?.reload()
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to open a new version'))
  } finally {
    acting.value = false
  }
}

async function handleDelete() {
  acting.value = true
  try {
    await store.remove(id.value)
    message.success('Administration deleted')
    navigateTo('/dashboard/docs/administrations')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to delete'))
  } finally {
    acting.value = false
  }
}

function handleOpenDocument(doc: { id: number }) {
  navigateTo(`/dashboard/docs/documents/${doc.id}`)
}
</script>

<template>
  <div>
    <NAlert
      v-if="!canManage"
      type="error"
      title="Access Denied"
      style="margin-bottom: 16px;"
    >
      You do not have permission to manage Administrations.
    </NAlert>
    <NSpin v-else :show="loading">
      <div v-if="detail">
        <NCard :title="detail.name" size="small" style="margin-bottom: 16px;">
          <template #header-extra>
            <NSpace :size="6" align="center">
              <NTag :type="statusType(detail.status)" size="small" bordered round>{{ detail.status }}</NTag>
              <NTag size="small" bordered round>v{{ detail.version }}</NTag>
            </NSpace>
          </template>
          <NText depth="3">{{ detail.description || 'No description' }}</NText>
          <div class="mt-2">
            <NText depth="3" class="text-xs">
              {{ detail.stepCount }} step(s) · {{ detail.templatesUsedCount }} template(s) used · {{ detail.docsCount ?? detail.documentCount ?? 0 }} document(s)
            </NText>
          </div>
          <template #footer>
            <NSpace>
              <NButton type="primary" :disabled="readonly" :loading="acting" @click="handlePublish">Publish</NButton>
              <NButton :disabled="detail.status !== 'published'" @click="navigateTo(`/dashboard/docs/run/${detail.id}`)">Start run</NButton>
              <NButton :disabled="detail.status !== 'published'" :loading="acting" @click="handleNewVersion">New version</NButton>
              <NButton :disabled="detail.status === 'archived'" :loading="acting" @click="handleArchive">Archive</NButton>
              <NPopconfirm @positive-click="handleDelete">
                <template #trigger>
                  <NButton type="error" ghost :loading="acting">Delete</NButton>
                </template>
                Delete this administration? Blocked when it has documents (archive instead).
              </NPopconfirm>
              <NButton ghost @click="navigateTo('/dashboard/docs/administrations')">Back to list</NButton>
            </NSpace>
          </template>
        </NCard>

        <NAlert v-if="detail.status === 'archived'" type="warning" title="Archived — read-only" style="margin-bottom: 16px;">
          This workflow is archived. History is kept, but steps cannot be edited and new runs are blocked.
        </NAlert>
        <NAlert v-else-if="detail.status === 'published'" type="info" title="Published — runnable" style="margin-bottom: 16px;">
          This workflow is published and runnable. Structural edits need a new version first.
        </NAlert>

        <NCard title="Steps manager" size="small" style="margin-bottom: 16px;">
          <AdministrationWorkflowEditor
            ref="editorRef"
            :administration-id="id"
            :readonly="readonly"
            @saved="(d) => (detail = d)"
          />
        </NCard>

        <NCard title="Version history" size="small" style="margin-bottom: 16px;">
          <NTimeline v-if="(detail.versions ?? []).length > 0">
            <NTimelineItem v-for="v in detail.versions" :key="v.id" :title="`v${v.version}`" :time="String(v.createdAt)">
              <NText depth="3" class="text-xs">Frozen workflow snapshot</NText>
            </NTimelineItem>
          </NTimeline>
          <NText v-else depth="3">Not published yet — no versions</NText>
        </NCard>

        <NCard title="Documents" size="small">
          <DocumentsTable :administration-id="id" @view="handleOpenDocument" />
        </NCard>
      </div>
    </NSpin>
  </div>
</template>
