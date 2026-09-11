<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  NAlert, NButton, NCard, NSteps, NStep, NSpin, NSpace, NText, NTag,
  NModal, NPopconfirm, useMessage,
} from 'naive-ui'
import { RunStepForm, RunPreviewPane } from '~/components/features/runs'
import { useAuthorization } from '~/composables/useAuthorization'
import { useRunsStore } from '~/stores/runs'
import { getErrorMessage } from '~/utils/error'
import {
  validateClientStepValues, clientStepStatus, clientCompletionBlockers, debounce,
} from '~/composables/useRunsData'
import type { AdministrationRunDetail, RunStepData, RunStepDataMap } from '~/shared/types/run'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const route = useRoute()
const message = import.meta.client ? useMessage() : null
const store = useRunsStore()
const { hasAnyRole, hasPermission } = useAuthorization()

const canRun = computed(
  () =>
    hasAnyRole(['Admin', 'Super Admin']) ||
    hasPermission('Administration Run') ||
    hasPermission('Administration Management'),
)

const runId = computed(() => Number(route.params.runId))
const detail = ref<AdministrationRunDetail | null>(null)
const loading = ref(false)
const saving = ref(false)
const completing = ref(false)
const current = ref(1)
const stepData = ref<RunStepDataMap>({})
const serverIssues = ref<Record<number, string[]>>({})
const warning = ref<string | null>(null)
const previewModal = ref(false)

const readonly = computed(() => detail.value?.status !== 'in_progress')
const steps = computed(() => detail.value?.steps ?? [])
const activeStep = computed(() => steps.value[current.value - 1] ?? null)
const activeData = computed<RunStepData>({
  get: () => {
    const id = activeStep.value?.id
    if (id == null) return { fields: {}, rowSelections: {}, manualInputs: {} }
    return stepData.value[String(id)] ?? { fields: {}, rowSelections: {}, manualInputs: {} }
  },
  set: (v: RunStepData) => {
    const id = activeStep.value?.id
    if (id == null) return
    stepData.value = { ...stepData.value, [String(id)]: v }
  },
})

const statuses = computed(() =>
  steps.value.map((s) => clientStepStatus(s, stepData.value[String(s.id)])),
)

const isReview = computed(() => current.value === steps.value.length + 1)
const blockers = computed(() =>
  detail.value ? clientCompletionBlockers(steps.value, stepData.value) : [],
)

async function load() {
  loading.value = true
  serverIssues.value = {}
  warning.value = null
  try {
    detail.value = await store.fetchOne(runId.value)
    const map: RunStepDataMap = {}
    for (const [k, v] of Object.entries(detail.value.stepData ?? {})) map[k] = { ...v }
    stepData.value = map
    current.value = 1
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load run'))
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function persistStep(stepId: number, silent = false) {
  const data = stepData.value[String(stepId)]
  if (!data) return
  saving.value = true
  try {
    const result = await store.saveStep(runId.value, stepId, data)
    const map = { ...stepData.value, ...result.stepData }
    stepData.value = map
    if (result.warning) {
      warning.value = result.warning
      if (!silent) message.warning(result.warning)
    } else {
      warning.value = null
    }
    serverIssues.value = { ...serverIssues.value, [stepId]: [] }
  } catch (e: any) {
    const issues = e.data?.data?.issues as string[] | undefined
    if (issues) serverIssues.value = { ...serverIssues.value, [stepId]: issues }
    if (!silent) message.error(getErrorMessage(e, 'Failed to save step'))
    throw e
  } finally {
    saving.value = false
  }
}

// Autosave draft per step (debounced, REQ-002).
const autosave = debounce((stepId: number) => {
  if (readonly.value) return
  persistStep(stepId, true).catch(() => {})
}, 800)

watch(stepData, () => {
  const id = activeStep.value?.id
  if (id != null && !readonly.value) autosave(id)
}, { deep: true })

async function handleNext() {
  if (!activeStep.value) return
  const issues = validateClientStepValues(activeStep.value, activeData.value.fields ?? {})
  if (issues.length > 0) {
    serverIssues.value = { ...serverIssues.value, [activeStep.value.id]: issues }
    message.error(issues[0])
    return
  }
  try {
    await persistStep(activeStep.value.id)
  } catch {
    return
  }
  if (current.value <= steps.value.length) current.value += 1
}

function handleBack() {
  if (current.value > 1) current.value -= 1
}

function goTo(index: number) {
  // Only completed (done) steps are clickable, per NSteps wizard pattern.
  const target = steps.value[index - 1]
  if (!target) {
    if (index === steps.value.length + 1) current.value = index
    return
  }
  if (statuses.value[index - 1] === 'done' || index < current.value) current.value = index
}

async function handleComplete() {
  if (blockers.value.length > 0) {
    message.error(`Step "${blockers.value[0].stepName}": ${blockers.value[0].issues[0]}`)
    current.value = steps.value.findIndex((s) => s.id === blockers.value[0].stepId) + 1
    return
  }
  completing.value = true
  try {
    const result = await store.complete(runId.value)
    message.success(
      result.documentIds.length > 0
        ? `Run completed — ${result.documentIds.length} document(s) created`
        : 'Run completed',
    )
    // Land on My Runs if document view unavailable.
    await navigateTo('/dashboard/docs/runs')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to complete run'))
  } finally {
    completing.value = false
  }
}

async function handleCancel() {
  try {
    await store.cancel(runId.value)
    message.success('Run cancelled — no documents were produced')
    await navigateTo('/dashboard/docs/runs')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to cancel run'))
  }
}

function statusType(status: string | undefined) {
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'warning'
  return 'info'
}
</script>

<template>
  <div>
    <NAlert
      v-if="!canRun"
      type="error"
      title="Access Denied"
      style="margin-bottom: 16px;"
    >
      You do not have permission to run Administrations.
    </NAlert>
    <NSpin v-else :show="loading">
      <template v-if="detail">
        <NSpace align="center" style="margin-bottom: 12px;" justify="space-between">
          <NSpace align="center">
            <NButton quaternary @click="navigateTo('/dashboard/docs/runs')">← My Runs</NButton>
            <NText strong style="font-size: 16px;">
              {{ detail.administrationName ?? `Administration #${detail.administrationId}` }}
            </NText>
            <NTag :type="statusType(detail.status)" size="small" bordered="false">{{ detail.status }}</NTag>
            <NTag size="small" bordered="false">workflow v{{ detail.administrationVersion }}</NTag>
          </NSpace>
          <NSpace>
            <NButton class="preview-toggle" quaternary @click="previewModal = true">Preview</NButton>
            <NPopconfirm
              v-if="!readonly"
              @positive-click="handleCancel"
            >
              <template #trigger><NButton quaternary type="error">Cancel run</NButton></template>
              Cancel this run? No documents will be produced.
            </NPopconfirm>
          </NSpace>
        </NSpace>

        <NAlert v-if="warning" type="warning" style="margin-bottom: 12px;" closable @close="warning = null">
          {{ warning }}
        </NAlert>
        <NAlert
          v-if="readonly"
          type="info"
          :title="detail.status === 'completed' ? 'Run completed' : 'Run cancelled'"
          style="margin-bottom: 12px;"
        >
          This run is read-only — its input is frozen and later definition edits never alter it.
        </NAlert>

        <NSteps :current="current" size="small" style="margin-bottom: 16px; overflow-x: auto;">
          <NStep
            v-for="(step, i) in steps"
            :key="step.id"
            :title="step.name"
            :status="statuses[i] === 'done' ? 'finish' : statuses[i] === 'invalid' ? 'error' : 'process'"
            @click="goTo(i + 1)"
          />
          <NStep title="Review" :status="isReview ? 'process' : 'wait'" @click="goTo(steps.length + 1)" />
        </NSteps>

        <div class="run-grid">
          <div>
            <template v-if="!isReview && activeStep">
              <RunStepForm
                v-model:model-value="activeData"
                :step="activeStep"
                :readonly="readonly"
                :server-issues="serverIssues[activeStep.id] ?? []"
              />
              <NCard size="small" style="margin-top: 12px; position: sticky; bottom: 0;">
                <NSpace justify="space-between">
                  <NButton :disabled="current <= 1" @click="handleBack">Back</NButton>
                  <NSpace align="center">
                    <NText v-if="saving" depth="3">Saving draft…</NText>
                    <NButton
                      v-if="!readonly"
                      :loading="saving"
                      @click="activeStep && persistStep(activeStep.id)"
                    >
                      Save draft
                    </NButton>
                    <NButton type="primary" @click="handleNext">Next</NButton>
                  </NSpace>
                </NSpace>
              </NCard>
            </template>
            <NCard v-else-if="isReview" title="Final review" size="small">
              <div v-for="step in steps" :key="step.id" class="detail-view" style="margin-bottom: 12px;">
                <NText strong>{{ step.name }}</NText>
                <NText depth="3">{{ JSON.stringify(stepData[String(step.id)] ?? {}) }}</NText>
              </div>
              <NAlert v-if="blockers.length > 0" type="error" title="Steps need attention" style="margin-bottom: 12px;">
                <div v-for="b in blockers" :key="b.stepId">Step "{{ b.stepName }}": {{ b.issues[0] }}</div>
              </NAlert>
              <NSpace justify="space-between">
                <NButton @click="handleBack">Back</NButton>
                <NButton v-if="!readonly" type="primary" :loading="completing" @click="handleComplete">
                  Complete run
                </NButton>
              </NSpace>
            </NCard>
          </div>
          <div class="run-preview">
            <RunPreviewPane :step="activeStep" :data="activeStep ? stepData[String(activeStep.id)] : undefined" />
          </div>
        </div>

        <NModal v-model:show="previewModal" preset="card" title="Preview" style="width: 90%; max-width: 640px;">
          <RunPreviewPane :step="activeStep" :data="activeStep ? stepData[String(activeStep.id)] : undefined" />
        </NModal>
      </template>
    </NSpin>
  </div>
</template>

<style scoped>
.run-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 12px;
  align-items: start;
}
@media (max-width: 1023px) {
  .run-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .run-preview {
    display: none;
  }
}
@media (min-width: 1024px) {
  .preview-toggle {
    display: none;
  }
}
.detail-view {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
