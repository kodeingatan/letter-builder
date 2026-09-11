<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NAlert, NButton, NCard, NSpin, NSpace, NTag, NText,
  NPopconfirm, useMessage,
} from 'naive-ui'
import { DocumentDriftBadge } from '~/components/features/documents'
import { useAuthorization } from '~/composables/useAuthorization'
import { useDocumentsStore } from '~/stores/documents'
import { useAuthStore } from '~/stores/auth'
import { getErrorMessage } from '~/utils/error'
import type { DocumentDetail } from '~/shared/types/document'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const route = useRoute()
const message = import.meta.client ? useMessage() : null
const store = useDocumentsStore()
const authStore = useAuthStore()
const { hasAnyRole, hasPermission } = useAuthorization()

const canRead = computed(
  () =>
    hasAnyRole(['Admin', 'Super Admin']) ||
    hasPermission('Document Management') ||
    hasPermission('Administration Run') ||
    hasPermission('Read Only'),
)

const canReissue = computed(
  () => hasAnyRole(['Admin', 'Super Admin']) || hasPermission('Document Management'),
)

const id = computed(() => Number(route.params.id))
const detail = ref<DocumentDetail | null>(null)
const loading = ref(false)
const acting = ref(false)
const previewHtml = ref<string | null>(null)

function formatDate(value: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

async function load() {
  loading.value = true
  try {
    detail.value = await store.fetchOne(id.value)
    previewHtml.value = detail.value.outputHtml
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load document'))
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function downloadBlob(url: string, filename: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${authStore.token}` } })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || `Download failed (${res.status})`)
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000)
}

async function handleDownloadPdf() {
  try {
    await downloadBlob(store.pdfUrl(id.value), `document-${id.value}.pdf`)
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to download PDF'))
  }
}

async function handleDownloadHtml() {
  try {
    await downloadBlob(store.htmlUrl(id.value), `document-${id.value}.html`)
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to download HTML'))
  }
}

async function handleReissue() {
  acting.value = true
  try {
    const created = await store.reissue(id.value)
    message.success(`Re-issued as document #${created.id} — the original is untouched`)
    navigateTo(`/dashboard/docs/documents/${created.id}`)
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to re-issue'))
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <div>
    <NAlert
      v-if="!canRead"
      type="error"
      title="Access Denied"
      style="margin-bottom: 16px;"
    >
      You do not have permission to view Documents.
    </NAlert>
    <NSpin v-else :show="loading">
      <div v-if="detail">
        <NCard :title="detail.title" size="small" style="margin-bottom: 16px;">
          <template #header-extra>
            <DocumentDriftBadge :badge="detail.driftBadge" :drifted="detail.drifted" />
          </template>
          <NAlert
            v-if="detail.drifted"
            type="warning"
            title="Version drift"
            style="margin-bottom: 12px;"
          >
            This document renders its pinned versions exactly as issued. The live template has moved on — the content below is byte-stable at {{ detail.driftBadge }}.
          </NAlert>
          <NAlert
            v-if="!detail.outputFilePath"
            type="info"
            title="HTML only"
            style="margin-bottom: 12px;"
          >
            PDF belum dirender untuk dokumen ini. Pratinjau HTML di bawah adalah konten yang diterbitkan. The HTML preview below is the issued content.
          </NAlert>
          <div class="detail-view">
            <div>
              <NText depth="3" class="detail-label">Run</NText>
              <NText>#{{ detail.runId }}</NText>
            </div>
            <div>
              <NText depth="3" class="detail-label">Administration</NText>
              <NText>{{ detail.administrationName ?? `#${detail.administrationId}` }} (v{{ detail.snapshotSummary.administrationVersion ?? '—' }})</NText>
            </div>
            <div>
              <NText depth="3" class="detail-label">Template</NText>
              <NText>{{ detail.templateName ?? '—' }} · v{{ detail.templateVersion }}</NText>
            </div>
            <div>
              <NText depth="3" class="detail-label">Components pinned</NText>
              <NText>{{ detail.snapshotSummary.componentCount }} · Bindings {{ detail.snapshotSummary.bindingCount }}</NText>
            </div>
            <div>
              <NText depth="3" class="detail-label">Issuer</NText>
              <NText>{{ detail.createdByName ?? '—' }}</NText>
            </div>
            <div>
              <NText depth="3" class="detail-label">Issued</NText>
              <NText>{{ formatDate(detail.createdAt) }}</NText>
            </div>
            <div v-if="detail.replacesId">
              <NText depth="3" class="detail-label">Re-issues</NText>
              <NText>Re-issue of <a href="#" @click.prevent="navigateTo(`/dashboard/docs/documents/${detail.replacesId}`)">document #{{ detail.replacesId }}</a></NText>
            </div>
          </div>
          <template #footer>
            <NSpace>
              <NButton type="primary" :disabled="!detail.outputFilePath" @click="handleDownloadPdf">Download PDF</NButton>
              <NButton :disabled="!detail.outputHtml" @click="handleDownloadHtml">Download HTML</NButton>
              <NPopconfirm v-if="canReissue" @positive-click="handleReissue">
                <template #trigger>
                  <NButton ghost :loading="acting">Re-issue</NButton>
                </template>
                Re-issue creates a NEW document row from the same snapshot — the original stays untouched. Continue?
              </NPopconfirm>
              <NButton ghost @click="navigateTo('/dashboard/docs/documents')">Back to list</NButton>
            </NSpace>
          </template>
        </NCard>

        <NCard title="HTML preview (sandboxed)" size="small">
          <NAlert v-if="!previewHtml" type="warning" title="Render pending">
            Rendered HTML is still pending for this document — try again later.
          </NAlert>
          <iframe
            v-else
            sandbox=""
            :srcdoc="previewHtml"
            class="doc-preview"
            title="Document HTML preview"
          />
        </NCard>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.detail-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-view > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.doc-preview {
  width: 100%;
  min-height: 480px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}
@media (max-width: 640px) {
  .doc-preview {
    min-height: 320px;
  }
}
</style>
