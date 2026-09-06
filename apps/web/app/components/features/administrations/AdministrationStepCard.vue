<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NCard, NInput, NSelect, NButton, NSpace, NIcon, NTag, NCheckbox,
  NText, NAlert,
} from 'naive-ui'
import { TrashCan, ArrowUp, ArrowDown } from '@vicons/carbon'
import { useTemplatesStore } from '~/stores/templates'
import { validateClientStepFields, emptyField, STEP_FIELD_TYPES } from '~/composables/useAdministrationsData'
import type { StepField, StepInput } from '~/shared/types/administration'

const props = defineProps<{
  step: StepInput
  index: number
  readonly: boolean
  templateOptions: Array<{ label: string; value: number }>
  isFirst: boolean
  isLast: boolean
}>()

const emit = defineEmits<{
  (e: 'update:step', step: StepInput): void
  (e: 'remove'): void
  (e: 'move-up'): void
  (e: 'move-down'): void
}>()

const templatesStore = useTemplatesStore()

const versionOptions = ref<Array<{ label: string; value: string }>>([{ label: 'latest (auto)', value: 'latest' }])
const loadingVersions = ref(false)

const fieldTypeOptions = STEP_FIELD_TYPES.map((t) => ({ label: t, value: t }))

async function loadVersions(templateId: number | null | undefined) {
  versionOptions.value = [{ label: 'latest (auto)', value: 'latest' }]
  if (templateId == null) return
  loadingVersions.value = true
  try {
    const detail = await templatesStore.fetchOne(templateId)
    const versions = (detail.versions ?? []).map((v) => ({ label: `v${v.version} (pinned snapshot)`, value: String(v.version) }))
    versionOptions.value = [{ label: 'latest (auto)', value: 'latest' }, ...versions]
  } catch {
    // Template may have been deleted — keep latest-only; server re-validates on save.
  } finally {
    loadingVersions.value = false
  }
}

watch(
  () => props.step.templateId,
  (id) => loadVersions(id ?? null),
  { immediate: true },
)

function patch(patch: Partial<StepInput>) {
  emit('update:step', { ...props.step, ...patch })
}

function patchField(idx: number, patch: Partial<StepField>) {
  const fields = [...(props.step.fields ?? [])]
  fields[idx] = { ...fields[idx], ...patch }
  // Switching away from select clears stale options.
  if (patch.type && patch.type !== 'select') delete (fields[idx] as Partial<StepField>).options
  patch({ fields })
}

function addField() {
  patch({ fields: [...(props.step.fields ?? []), emptyField()] })
}

function removeField(idx: number) {
  patch({ fields: (props.step.fields ?? []).filter((_, i) => i !== idx) })
}

function setOptionsText(idx: number, text: string) {
  const options = text.split(',').map((o) => o.trim()).filter((o) => o.length > 0)
  patchField(idx, { options })
}

const fieldIssues = computed(() => validateClientStepFields(props.step.fields))

const stepIssues = computed(() => {
  const issues: string[] = []
  if (!props.step.name?.trim()) issues.push('Step requires a name')
  const hasTemplate = props.step.templateId !== undefined && props.step.templateId !== null
  if (hasTemplate && !props.step.templateVersion) issues.push('Pinned template needs a version (choose a version or "latest")')
  if (!hasTemplate && (!props.step.fields || props.step.fields.length === 0)) {
    issues.push('Step has neither a template nor fields')
  }
  return [...issues, ...fieldIssues.value]
})

const hasDataPath = computed(() => {
  if (props.step.templateId !== undefined && props.step.templateId !== null) return true
  return (props.step.fields?.length ?? 0) > 0
})

function fieldRowStatus(field: StepField): 'error' | undefined {
  if (!field.name?.trim() || !field.label?.trim()) return 'error'
  if (field.type === 'select' && (!field.options || field.options.filter((o) => o.trim()).length === 0)) return 'error'
  return undefined
}
</script>

<template>
  <NCard :title="`Step ${index + 1}`" size="small" class="step-card">
    <template #header-extra>
      <NSpace :size="4" align="center">
        <NTag v-if="stepIssues.length > 0" type="error" size="small" bordered round>invalid</NTag>
        <NTag v-else-if="hasDataPath" type="success" size="small" bordered round>valid</NTag>
        <NTag v-else size="small" bordered round>empty</NTag>
        <template v-if="!readonly">
          <NButton size="small" quaternary :disabled="isFirst" @click="emit('move-up')">
            <template #icon><NIcon><ArrowUp /></NIcon></template>
          </NButton>
          <NButton size="small" quaternary :disabled="isLast" @click="emit('move-down')">
            <template #icon><NIcon><ArrowDown /></NIcon></template>
          </NButton>
          <NButton size="small" quaternary type="error" @click="emit('remove')">
            <template #icon><NIcon><TrashCan /></NIcon></template>
          </NButton>
        </template>
      </NSpace>
    </template>

    <div class="flex flex-col gap-3">
      <NInput
        :value="step.name"
        :disabled="readonly"
        placeholder="e.g. Data Pegawai"
        maxlength="100"
        @update:value="(v: string) => patch({ name: v })"
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NSelect
          :value="step.templateId ?? null"
          :disabled="readonly"
          :options="templateOptions"
          placeholder="Pin a template (optional)"
          clearable
          filterable
          @update:value="(v: number | null) => patch({ templateId: v, templateVersion: v == null ? null : (step.templateVersion ?? 'latest') })"
        />
        <NSelect
          :value="step.templateVersion ?? null"
          :disabled="readonly || step.templateId == null"
          :options="versionOptions"
          :loading="loadingVersions"
          placeholder="Version"
          @update:value="(v: string | null) => patch({ templateVersion: v })"
        />
      </div>
      <NText v-if="step.templateId != null && step.templateVersion !== 'latest'" depth="3" class="text-xs">
        Pinned version snapshots are frozen into produced documents; runs never float mid-flight.
      </NText>

      <div>
        <div class="flex items-center justify-between mb-2">
          <NText strong class="text-sm">Step fields ({{ (step.fields ?? []).length }})</NText>
          <NButton v-if="!readonly" size="small" dashed @click="addField">Add field</NButton>
        </div>
        <div v-if="(step.fields ?? []).length === 0" class="text-xs text-gray-400 mb-1">
          No local fields — pure data-gathering steps need at least one field unless a template is pinned.
        </div>
        <div class="flex flex-col gap-2">
          <NCard v-for="(field, fi) in (step.fields ?? [])" :key="fi" size="small" embedded :status="fieldRowStatus(field)">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <NInput
                :value="field.name"
                :disabled="readonly"
                placeholder="field_name (snake_case)"
                maxlength="64"
                @update:value="(v: string) => patchField(fi, { name: v })"
              />
              <NInput
                :value="field.label"
                :disabled="readonly"
                placeholder="Label"
                maxlength="100"
                @update:value="(v: string) => patchField(fi, { label: v })"
              />
              <NSelect
                :value="field.type"
                :disabled="readonly"
                :options="fieldTypeOptions"
                placeholder="Type"
                @update:value="(v: StepField['type']) => patchField(fi, { type: v })"
              />
              <div class="flex items-center gap-2">
                <NCheckbox
                  :checked="field.required ?? false"
                  :disabled="readonly"
                  @update:checked="(v: boolean) => patchField(fi, { required: v })"
                >
                  Required
                </NCheckbox>
                <NButton v-if="!readonly" size="small" quaternary type="error" @click="removeField(fi)">
                  <template #icon><NIcon><TrashCan /></NIcon></template>
                </NButton>
              </div>
            </div>
            <NInput
              v-if="field.type === 'select'"
              :value="(field.options ?? []).join(', ')"
              :disabled="readonly"
              placeholder="Options (comma separated)"
              class="mt-2"
              @update:value="(v: string) => setOptionsText(fi, v)"
            />
          </NCard>
        </div>
      </div>

      <NAlert v-if="stepIssues.length > 0" type="error" :show-icon="false" class="text-xs">
        <ul class="list-disc pl-4 m-0">
          <li v-for="(issue, i) in stepIssues" :key="i">{{ issue }}</li>
        </ul>
      </NAlert>
    </div>
  </NCard>
</template>

<style scoped>
.step-card {
  margin-bottom: 12px;
}
</style>
