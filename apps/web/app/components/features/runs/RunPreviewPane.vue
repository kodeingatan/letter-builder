<script setup lang="ts">
import { computed, ref } from 'vue'
import { NCard, NTabs, NTabPane, NCode, NSpin, NAlert, NText } from 'naive-ui'
import type { RunStep, RunStepData } from '~/shared/types/run'

const props = defineProps<{
  step: RunStep | null
  data: RunStepData | undefined
  loading?: boolean
  previewError?: string | null
}>()

const tab = ref('rendered')

/**
 * Live preview (REQ-004):
 * renders a data summary of the current step context. The `Rendered` tab
 * Preview via POST /api/render/preview.
 */
const summary = computed(() => {
  const fields = props.data?.fields ?? {}
  const rows = props.data?.rowSelections ?? {}
  const manuals = props.data?.manualInputs ?? {}
  const lines: string[] = []
  lines.push(`Step: ${props.step?.name ?? '(none)'}${props.step?.templateName ? ` · Template: ${props.step.templateName}` : ''}`)
  lines.push('')
  lines.push('Fields:')
  const fieldEntries = Object.entries(fields)
  lines.push(...(fieldEntries.length > 0 ? fieldEntries.map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`) : ['  (none)']))
  lines.push('')
  lines.push('Row selections:')
  const rowEntries = Object.entries(rows)
  lines.push(...(rowEntries.length > 0 ? rowEntries.map(([k, v]) => `  ${k}: [${(v as number[]).join(', ')}]`) : ['  (none)']))
  lines.push('')
  lines.push('Manual inputs:')
  const manualEntries = Object.entries(manuals)
  lines.push(...(manualEntries.length > 0 ? manualEntries.map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`) : ['  (none)']))
  return lines.join('\n')
})

const dataJson = computed(() => JSON.stringify(
  { stepId: props.step?.id ?? null, fields: props.data?.fields ?? {}, rowSelections: props.data?.rowSelections ?? {}, manualInputs: props.data?.manualInputs ?? {} },
  null,
  2,
))
</script>

<template>
  <NCard title="Live preview" size="small">
    <NSpin :show="!!loading">
      <NAlert v-if="previewError" type="warning" title="Preview unavailable — showing data summary" style="margin-bottom: 8px;">
        {{ previewError }}
      </NAlert>
      <NTabs v-model:value="tab" size="small">
        <NTabPane name="rendered" tab="Rendered">
          <NCode :code="summary" language="text" style="white-space: pre-wrap;" />
        </NTabPane>
        <NTabPane name="data" tab="Data JSON">
          <NCode :code="dataJson" language="json" style="white-space: pre-wrap;" />
        </NTabPane>
      </NTabs>
      <NText depth="3" style="font-size: 12px;">
        Pratinjau dokumen dirender via rendering engine.
      </NText>
    </NSpin>
  </NCard>
</template>
