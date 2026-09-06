<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NButton, NIcon, NAlert, NSpin, NEmpty, NSpace, useMessage } from 'naive-ui'
import { Add } from '@vicons/carbon'
import AdministrationStepCard from './AdministrationStepCard.vue'
import { useAdministrationsStore } from '~/stores/administrations'
import { useTemplatesStore } from '~/stores/templates'
import { getErrorMessage } from '~/utils/error'
import { emptyStep, moveStep, validateClientSteps } from '~/composables/useAdministrationsData'
import type { AdministrationDetail, StepInput } from '~/shared/types/administration'

const props = defineProps<{
  administrationId: number
  readonly: boolean
}>()

const emit = defineEmits<{
  (e: 'saved', detail: AdministrationDetail): void
}>()

const store = useAdministrationsStore()
const templatesStore = useTemplatesStore()
const message = import.meta.client ? useMessage() : null

const loading = ref(false)
const saving = ref(false)
const steps = ref<StepInput[]>([])
const dirty = ref(false)
const serverError = ref<string | null>(null)

const templateOptions = computed(() =>
  (templatesStore.templates as Array<{ id: number; name: string; status: string }>).map((t) => ({
    label: `${t.name}${t.status === 'published' ? '' : ' (draft — publish first)'}`,
    value: t.id,
  })),
)

async function load() {
  loading.value = true
  serverError.value = null
  try {
    const detail = await store.fetchOne(props.administrationId)
    steps.value = (detail.steps ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      templateId: s.templateId,
      templateVersion: s.templateVersion,
      fields: [...(s.fields ?? [])],
    }))
    dirty.value = false
  } catch (e: any) {
    serverError.value = getErrorMessage(e, 'Failed to load steps')
  } finally {
    loading.value = false
  }
}

watch(() => props.administrationId, load, { immediate: true })

// Template picker source: published templates first, drafts flagged.
async function loadTemplates() {
  try {
    await templatesStore.fetchAll({ limit: 100, sortBy: 'name', sortOrder: 'ASC' })
  } catch {
    // Picker stays empty; server re-validates pins on save.
  }
}
loadTemplates()

const clientIssues = computed(() => validateClientSteps(steps.value))

function addStep() {
  steps.value = [...steps.value, emptyStep()]
  dirty.value = true
}

function updateStep(index: number, step: StepInput) {
  const copy = [...steps.value]
  copy[index] = step
  steps.value = copy
  dirty.value = true
}

function removeStep(index: number) {
  steps.value = steps.value.filter((_, i) => i !== index)
  dirty.value = true
}

function move(index: number, delta: -1 | 1) {
  steps.value = moveStep(steps.value, index, index + delta)
  dirty.value = true
}

async function handleSave() {
  serverError.value = null
  if (clientIssues.value.length > 0) {
    message?.warning('Fix invalid steps before saving')
    return
  }
  saving.value = true
  try {
    const detail = await store.saveSteps(props.administrationId, steps.value)
    steps.value = (detail.steps ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      templateId: s.templateId,
      templateVersion: s.templateVersion,
      fields: [...(s.fields ?? [])],
    }))
    dirty.value = false
    message?.success('Steps saved — order persisted 1..N')
    emit('saved', detail)
  } catch (e: any) {
    serverError.value = getErrorMessage(e, 'Failed to save steps')
    message?.error(getErrorMessage(e, 'Failed to save steps'))
  } finally {
    saving.value = false
  }
}

defineExpose({ reload: load, hasChanges: computed(() => dirty.value) })
</script>

<template>
  <div>
    <NSpin :show="loading">
      <NAlert v-if="serverError" type="error" closable class="mb-3" @close="serverError = null">
        {{ serverError }}
      </NAlert>
      <NAlert v-if="!readonly && clientIssues.length > 0 && steps.length > 0" type="warning" class="mb-3">
        <span class="font-medium">Publish blocked:</span>
        <ul class="list-disc pl-4 m-0">
          <li v-for="(issue, i) in clientIssues" :key="i">{{ issue }}</li>
        </ul>
      </NAlert>

      <NEmpty v-if="!loading && steps.length === 0" description="No steps yet — add the first step" class="mb-3">
        <template #extra>
          <NButton v-if="!readonly" type="primary" @click="addStep">
            <template #icon><NIcon><Add /></NIcon></template>
            Add the first step
          </NButton>
        </template>
      </NEmpty>

      <AdministrationStepCard
        v-for="(step, i) in steps"
        :key="step.id ?? `new-${i}`"
        :step="step"
        :index="i"
        :readonly="readonly"
        :template-options="templateOptions"
        :is-first="i === 0"
        :is-last="i === steps.length - 1"
        @update:step="(s) => updateStep(i, s)"
        @remove="removeStep(i)"
        @move-up="move(i, -1)"
        @move-down="move(i, 1)"
      />

      <NSpace v-if="!readonly && steps.length > 0" class="mt-2">
        <NButton dashed @click="addStep">
          <template #icon><NIcon><Add /></NIcon></template>
          Add step
        </NButton>
        <NButton type="primary" :loading="saving" :disabled="!dirty" @click="handleSave">
          Save steps
        </NButton>
      </NSpace>
    </NSpin>
  </div>
</template>
