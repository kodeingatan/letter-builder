<script setup lang="ts">
import { NDrawer, NDrawerContent, NButton, NSpace, NAlert, useMessage } from 'naive-ui'
import { usePersuratanStore } from '~/stores/persuratan'
import { useAuthStore } from '~/stores/auth'
import { getErrorMessage } from '~/utils/error'
import { ref } from 'vue'

const props = defineProps<{
  visible: boolean
  html: string
  documentId: number | null
}>()

const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const store = usePersuratanStore()
const authStore = useAuthStore()
const message = import.meta.client ? useMessage() : null
const downloading = ref(false)

async function downloadPdf() {
  if (!props.documentId) return
  downloading.value = true
  try {
    const response = await fetch(`/api/documents/${props.documentId}/pdf`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (!response.ok) throw new Error('PDF belum tersedia — render ulang untuk retry')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dokumen-${props.documentId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    message?.success('PDF diunduh')
  } catch (e) {
    message?.error(getErrorMessage(e))
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <NDrawer :show="visible" :width="600" placement="right" @update:show="(v: boolean) => emit('update:visible', v)">
    <NDrawerContent title="Preview Dokumen" closable>
      <NAlert v-if="!html" type="warning">Belum ada hasil render.</NAlert>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-else class="doc-preview border rounded p-4 bg-white" v-html="html" />
      <template #footer>
        <NSpace>
          <NButton type="primary" :disabled="!documentId" :loading="downloading" @click="downloadPdf">
            Unduh PDF
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
