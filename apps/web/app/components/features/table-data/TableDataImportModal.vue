<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NModal, NUpload, NButton, NSpace, NAlert, NDataTable, NSpin,
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
  // Quote-aware parser — state machine inQuotes + "" escape, mirror server parseCsv
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else inQuotes = false
      } else cell += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(cell.trim()); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (ch === '\r') { /* skip */ }
    else cell += ch
  }
  row.push(cell)
  rows.push(row)
  // filter empty rows + limit 6 (header + 5 preview)
  const filtered = rows.filter(r => r.some(c => c !== ''))
  return filtered.slice(0, 6).map(r => r.map(c => c.trim()))
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
  try {
    const text = await f.text()
    previewRows.value = parsePreview(text)
    if (previewRows.value.length > 1 && previewRows.value[0].length === 0) {
      message?.warning('CSV header kosong — periksa file')
    }
  } catch {
    message?.error('Gagal membaca file')
    previewRows.value = []
  }
}

async function handleImport() {
  if (!file.value) return
  running.value = true
  try {
    const result = await store.importCsv(props.tableName, file.value)
    summary.value = result
    emit('imported', result)
    if (result.failed === 0) message?.success(`${result.imported} baris berhasil diimpor`)
    else message?.warning(`${result.imported} berhasil, ${result.failed} gagal — lihat tabel error`)
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
  <NModal :show="visible" preset="card" title="Import CSV" style="width: min(640px, 90vw)" @update:show="(v) => !v && handleClose()">
    <NSpin :show="running">
      <NSpace vertical size="medium" class="w-full">
        <NUpload :show-file-list="false" accept=".csv" @change="handleFileChange">
          <NButton type="primary" ghost>Pilih file CSV (max 5MB)</NButton>
        </NUpload>
        <div v-if="file" class="text-sm" style="color:#6B7280">{{ file.name }} — preview 5 baris (quote-aware):</div>
        <div v-if="previewRows.length" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden">
          <NDataTable
            :columns="previewRows[0].map((h, i) => ({ title: h || `Kolom ${i + 1}`, key: String(i) }))"
            :data="previewRows.slice(1).map((r) => Object.fromEntries(r.map((c, j) => [String(j), c])))"
            :bordered="false"
            size="small"
          />
          <div style="font-size:11px;color:#6B7280;padding:6px 10px;border-top:1px solid #F3F4F6">Parser quote-aware: "a, b" tetap 1 kolom, "" → " — fix naive split(',')</div>
        </div>
        <NAlert v-if="summary && summary.failed > 0" type="warning" :title="`Partial success: ${summary.imported} berhasil, ${summary.failed} gagal`">
          Lihat tabel error di bawah untuk nomor baris dan alasan.
        </NAlert>
        <NAlert v-else-if="summary" type="success" :title="`${summary.imported} baris berhasil diimpor`" />
        <NDataTable
          v-if="summary && summary.errors.length"
          :columns="errorColumns"
          :data="summary.errors"
          size="small"
          :max-height="240"
        />
        <div v-if="summary && summary.errors.length" style="font-size:11px;color:#6B7280">Error per baris max 20 ditampilkan — file >5000 baris ditolak 422</div>
        <NSpace justify="end">
          <NButton @click="handleClose">Tutup</NButton>
          <NButton type="primary" :disabled="!file" :loading="running" @click="handleImport">Import</NButton>
        </NSpace>
      </NSpace>
    </NSpin>
  </NModal>
</template>
