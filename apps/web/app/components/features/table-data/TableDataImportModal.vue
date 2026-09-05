<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NModal, NCard, NUpload, NButton, NSpace, NAlert, NDataTable, NSpin,
  useMessage, type UploadFileInfo,
} from 'naive-ui'
import { useTableDataStore } from '~/stores/tableData'
import { getErrorMessage } from '~/utils/error'
import type { ImportSummary } from '~/shared/types/table-data'

const props = defineProps<{
  visible: boolean
  tableName: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'imported', summary: ImportSummary): void
}>()

const store = useTableDataStore()
const message = import.meta.client ? useMessage() : null
const file = ref<File | null>(null)
const previewRows = ref<string[][]>([])
const running = ref(false)
const summary = ref<ImportSummary | null>(null)

const errorColumns = computed(() => [
  { title: 'CSV Row', key: 'row', width: 90 },
  { title: 'Reason', key: 'reason', ellipsis: { tooltip: true } },
])

function parsePreview(text: string): string[][] {
  return text.split('\n').slice(0, 6).map((line) => line.split(',').map((c) => c.trim()))
}

async function handleFileChange(options: { file: UploadFileInfo }) {
  const f = options.file.file
  if (!f) return
  if (!f.name.toLowerCase().endsWith('.csv')) {
    message?.error('Only .csv files are accepted')
    return
  }
  if (f.size > 5 * 1024 * 1024) {
    message?.error('File must be ≤5MB')
    return
  }
  file.value = f
  summary.value = null
  previewRows.value = parsePreview(await f.text())
}

async function handleImport() {
  if (!file.value) return
  running.value = true
  try {
    const result = await store.importCsv(props.tableName, file.value)
    summary.value = result
    emit('imported', result)
    if (result.failed === 0) message?.success(`${result.imported} rows imported`)
    else message?.warning(`${result.imported} imported, ${result.failed} failed`)
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Import failed'))
  } finally {
    running.value = false
  }
}

function handleClose() {
  file.value = null
  previewRows.value = []
  summary.value = null
  emit('update:visible', false)
}
</script>

<template>
  <NModal :show="visible" preset="dialog" title="Import CSV" style="width: 640px;" @update:show="(v) => !v && handleClose()">
    <NSpin :show="running">
      <NSpace vertical size="medium" class="w-full">
        <NUpload :show-file-list="false" accept=".csv" :custom-request="() => {}" @change="handleFileChange">
          <NButton>Select CSV file (max 5MB)</NButton>
        </NUpload>
        <div v-if="file" class="text-sm text-gray-500">{{ file.name }} — first 5 rows preview:</div>
        <NDataTable
          v-if="previewRows.length"
          :columns="previewRows[0].map((h, i) => ({ title: h || `Column ${i + 1}`, key: String(i) }))"
          :data="previewRows.slice(1).map((r, i) => Object.fromEntries(r.map((c, j) => [String(j), c])))"
          :bordered="false"
          size="small"
        />
        <NAlert v-if="summary && summary.failed > 0" type="warning" :title="`Partial success: ${summary.imported} imported, ${summary.failed} failed`">
          See error table below for row numbers and reasons.
        </NAlert>
        <NAlert v-else-if="summary" type="success" :title="`${summary.imported} rows imported`" />
        <NDataTable
          v-if="summary && summary.errors.length"
          :columns="errorColumns"
          :data="summary.errors"
          size="small"
          :max-height="240"
        />
        <NSpace justify="end">
          <NButton @click="handleClose">Close</NButton>
          <NButton type="primary" :disabled="!file" :loading="running" @click="handleImport">Import</NButton>
        </NSpace>
      </NSpace>
    </NSpin>
  </NModal>
</template>
