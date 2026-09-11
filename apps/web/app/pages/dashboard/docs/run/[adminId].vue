<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NAlert, NButton, NCard, NResult, NSpin, NSpace, NText, NTag, useMessage,
} from 'naive-ui'
import { useAuthorization } from '~/composables/useAuthorization'
import { useAdministrationsStore } from '~/stores/administrations'
import { useRunsStore } from '~/stores/runs'
import { getErrorMessage } from '~/utils/error'
import type { AdministrationDetail } from '~/shared/types/administration'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const route = useRoute()
const message = import.meta.client ? useMessage() : null
const adminStore = useAdministrationsStore()
const runsStore = useRunsStore()
const { hasAnyRole, hasPermission } = useAuthorization()

const canRun = computed(
  () =>
    hasAnyRole(['Admin', 'Super Admin']) ||
    hasPermission('Administration Run') ||
    hasPermission('Administration Management'),
)

const adminId = computed(() => Number(route.params.adminId))
const detail = ref<AdministrationDetail | null>(null)
const loading = ref(false)
const starting = ref(false)
// Task 21 REQ-005: bookmarked deleted-administration URLs land here.
const notFound = ref(false)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    detail.value = await adminStore.fetchOne(adminId.value)
  } catch (e: any) {
    const status = e.statusCode ?? e.response?.status ?? e.data?.statusCode
    if (status === 404) {
      notFound.value = true
    } else {
      message.error(getErrorMessage(e, 'Failed to load administration'))
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function handleStart() {
  starting.value = true
  try {
    const run = await runsStore.start(adminId.value)
    message.success('Run started')
    await navigateTo(`/dashboard/docs/runs/${run.id}`)
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to start run'))
  } finally {
    starting.value = false
  }
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
    <NResult
      v-else-if="notFound"
      status="404"
      :title="`Administration #${adminId} no longer exists`"
      description="It was deleted or you bookmarked a dead link. Pick another entry from the Persuratan menu."
      style="margin: 48px 0;"
    >
      <template #footer>
        <NSpace justify="center">
          <NButton @click="navigateTo('/dashboard/docs/runs')">My Runs</NButton>
          <NButton type="primary" @click="navigateTo('/dashboard/docs/administrations')">
            Administrations
          </NButton>
        </NSpace>
      </template>
    </NResult>
    <NSpin v-else :show="loading">
      <template v-if="detail">
        <NSpace align="center" style="margin-bottom: 12px;">
          <NButton quaternary @click="navigateTo('/dashboard/docs/administrations')">← Administrations</NButton>
          <NText strong style="font-size: 16px;">{{ detail.name }}</NText>
          <NTag :type="detail.status === 'published' ? 'success' : 'default'" size="small" bordered="false">
            {{ detail.status }}
          </NTag>
        </NSpace>
        <NAlert
          v-if="detail.status !== 'published'"
          type="warning"
          :title="detail.status === 'archived' ? 'Archived — cannot run' : 'Draft — cannot run yet'"
          style="margin-bottom: 12px;"
        >
          {{
            detail.status === 'archived'
              ? 'This administration is archived and can no longer be run.'
              : 'This administration is still a draft: publish it before running.'
          }}
        </NAlert>
        <NCard title="Workflow steps" size="small" style="margin-bottom: 12px;">
          <div v-for="step in detail.steps" :key="step.id" class="detail-view" style="margin-bottom: 8px;">
            <NText strong>{{ step.order }}. {{ step.name }}</NText>
            <NText depth="3">
              {{ step.templateName ? `Template: ${step.templateName} (${step.resolvedTemplateVersion ?? step.templateVersion})` : `${step.fieldCount} field(s)` }}
            </NText>
          </div>
          <NText v-if="detail.steps.length === 0" depth="3">No steps defined.</NText>
        </NCard>
        <NButton
          type="primary"
          :loading="starting"
          :disabled="detail.status !== 'published'"
          @click="handleStart"
        >
          Start run
        </NButton>
      </template>
    </NSpin>
  </div>
</template>

<style scoped>
.detail-view {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
