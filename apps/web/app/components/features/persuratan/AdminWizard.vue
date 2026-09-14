<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NSteps, NStep, NForm, NFormItem, NInput, NButton, NSpace, NAlert,
  NDynamicInput, NSelect, NCard, useMessage,
} from 'naive-ui'
import { usePersuratanStore } from '~/stores/persuratan'
import { getErrorMessage, isConflictError } from '~/utils/error'
import DocumentPreviewDrawer from './DocumentPreviewDrawer.vue'
import type { Administration, MappingEntry } from '~/shared/types/persuratan'

const props = defineProps<{
  administration: Administration | null
}>()

const store = usePersuratanStore()
const message = import.meta.client ? useMessage() : null
const currentStep = ref(1)
const dataFields = ref<Array<{ key: string; value: string }>>([{ key: 'step1.nomor', value: '' }])
const extraSteps = ref<Array<{ template_id: number | null; mappingText: string }>>([])
const documentNumber = ref('')
const running = ref(false)
const runError = ref<string | null>(null)
const runResult = ref<{ document: { id: number }; html: string; warnings: string[]; pdfError: string | null } | null>(null)
const showPreview = ref(false)

const templateOptions = computed(() =>
  store.templates.map((t) => ({ label: `${t.name} (v${t.version})`, value: t.id })),
)

const adminSteps = computed(() => (props.administration as unknown as {
  steps?: Array<{ template_id: number; step_order: number; mapping: Record<string, MappingEntry> }>
} | null)?.steps ?? [])

function parseMapping(text: string): Record<string, MappingEntry> {
  if (!text.trim()) return {}
  try {
    return JSON.parse(text) as Record<string, MappingEntry>
  } catch {
    throw new Error('Mapping extra step bukan JSON valid')
  }
}

async function handleRun(asDraft: boolean) {
  runError.value = null
  running.value = true
  try {
    syncDataFields()
    const extras = extraSteps.value
      .filter((s) => s.template_id !== null)
      .map((s) => ({ template_id: s.template_id as number, mapping: parseMapping(s.mappingText) }))
    const result = await store.executeRun(Number(props.administration?.id), {
      data: dataRecord.value,
      extra_steps: extras,
      ...(documentNumber.value ? { document_number: documentNumber.value } : {}),
      ...(asDraft ? { as_draft: true } : {}),
    })
    runResult.value = result as unknown as typeof runResult.value
    message?.success(asDraft ? 'Draft tersimpan' : 'Dokumen gabungan tersimpan')
    await store.fetchRuns(Number(props.administration?.id))
    showPreview.value = true
  } catch (e) {
    if (isConflictError(e)) {
      runError.value = `${getErrorMessage(e)} — nomor dokumen sudah ada (409), coba nomor lain.`
    } else {
      runError.value = getErrorMessage(e)
    }
  } finally {
    running.value = false
  }
}

const dataRecord = computed<Record<string, unknown>>(() => {
  const out: Record<string, unknown> = {}
  for (const field of dataFields.value) {
    if (field.key.trim()) out[field.key.trim()] = field.value
  }
  return out
})

function syncDataFields() {
  // dataRecord is computed — nothing to flush; kept for step symmetry.
}

function addDataField() {
  dataFields.value.push({ key: '', value: '' })
}
</script>

<template>
  <div class="admin-wizard">
    <NAlert v-if="!administration" type="warning">Pilih administrasi dahulu.</NAlert>
    <template v-else>
      <NSteps :current="currentStep" class="mb-4">
        <NStep title="Data" description="step.field dinamis" />
        <NStep title="Step Tambahan" description="append step ke-N" />
        <NStep title="Render" description="gabungan + PDF" />
      </NSteps>

      <div v-if="currentStep === 1">
        <NFormItem label="Nomor dokumen (unik, opsional)" :validation-status="runError && runError.includes('409') ? 'error' : undefined" :feedback="runError && runError.includes('409') ? runError : undefined">
          <NInput v-model:value="documentNumber" placeholder="800/001/2026" />
        </NFormItem>
        <h4 class="font-semibold mb-2">Data surat (step.field)</h4>
        <NDynamicInput v-model:value="dataFields" :on-create="() => ({ key: '', value: '' })" #="{ value }">
          <div class="flex gap-2 w-full">
            <NInput v-model:value="value.key" placeholder="step1.nomor" class="flex-1" />
            <NInput v-model:value="value.value" placeholder="nilai" class="flex-1" />
          </div>
        </NDynamicInput>
        <NButton size="small" class="mt-2" @click="addDataField">+ Tambah field</NButton>
        <NAlert type="info" class="mt-2">Field tersimpan saat render — gunakan format <code>step.field</code> agar bisa dipetakan (uji via tombol Render).</NAlert>
      </div>

      <div v-else-if="currentStep === 2">
        <p class="text-sm mb-2 opacity-70">Step bawaan: {{ adminSteps.length }} — tambah step ke-N (ALT-03), mapping independen per step.</p>
        <NDynamicInput v-model:value="extraSteps" :on-create="() => ({ template_id: null, mappingText: '{}' })" #="{ value }">
          <NCard size="small" class="w-full">
            <NFormItem label="Template">
              <NSelect v-model:value="value.template_id" :options="templateOptions" placeholder="Pilih template" />
            </NFormItem>
            <NFormItem label="Mapping JSON (requirement → {kind, ref})">
              <NInput v-model:value="value.mappingText" type="textarea" placeholder='{"signer.name":{"kind":"value","ref":"H. Kadis"}}' />
            </NFormItem>
          </NCard>
        </NDynamicInput>
      </div>

      <div v-else>
        <NAlert v-if="runError" :type="runError.includes('409') ? 'warning' : 'error'" class="mb-2" closable @close="runError = null">
          {{ runError }}
          <NButton v-if="!runError.includes('409')" size="small" class="ml-2" @click="handleRun(false)">Coba lagi</NButton>
        </NAlert>
        <NSpace>
          <NButton type="primary" :loading="running" @click="handleRun(false)">Render Gabungan + PDF</NButton>
          <NButton :loading="running" @click="handleRun(true)">Simpan Draft</NButton>
          <NButton v-if="runResult" @click="showPreview = true">Lihat Hasil</NButton>
        </NSpace>
        <NAlert v-if="runResult?.pdfError" type="error" class="mt-2" closable>
          Gagal generate PDF: {{ runResult.pdfError }} — draft tersimpan (DRAFT), data tidak reset.
          <NButton size="small" class="ml-2" @click="handleRun(false)">Coba lagi</NButton>
        </NAlert>
      </div>

      <NSpace justify="space-between" class="mt-4">
        <NButton :disabled="currentStep <= 1" @click="currentStep -= 1">Kembali</NButton>
        <NButton :disabled="currentStep >= 3" type="primary" @click="() => { syncDataFields(); currentStep += 1 }">Lanjut</NButton>
      </NSpace>
      <DocumentPreviewDrawer v-model:visible="showPreview" :html="runResult?.html ?? ''" :document-id="runResult?.document.id ?? null" />
    </template>
  </div>
</template>
