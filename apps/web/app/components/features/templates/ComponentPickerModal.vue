<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal, NForm, NFormItem, NSelect, NButton, NSpace, NSpin,
  NTag, NText, NEmpty, useMessage,
} from 'naive-ui'
import { useComponentsStore } from '~/stores/components'
import { getErrorMessage } from '~/utils/error'
import type { ComponentDetail, ComponentListItem } from '~/shared/types/component'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', payload: { componentId: number; componentVersion: number }): void
}>()

const message = useMessage()
const componentsStore = useComponentsStore()

const componentId = ref<number | null>(null)
const componentVersion = ref<number | null>(null)
const detail = ref<ComponentDetail | null>(null)
const loadingDetail = ref(false)

const options = computed(() =>
  (componentsStore.components as ComponentListItem[]).map((c) => ({
    label: `${c.name} (v${c.version} · ${c.status})`,
    value: c.id,
  })),
)

const versionOptions = computed(() => {
  const versions = detail.value?.versions ?? []
  if (!versions.length && detail.value) {
    return [{ label: `v${detail.value.version} (working copy)`, value: detail.value.version }]
  }
  return versions.map((v) => ({ label: `v${v.version}`, value: v.version }))
})

// Latest-published at insert (BR-001): default to the highest version.
const latestPublished = computed(() => {
  const versions = (detail.value?.versions ?? []).map((v) => v.version)
  return versions.length ? Math.max(...versions) : (detail.value?.version ?? 1)
})

async function loadComponents() {
  try {
    await componentsStore.fetchAll({ page: 1, limit: 100 })
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load components'))
  }
}

async function loadDetail(id: number) {
  loadingDetail.value = true
  try {
    detail.value = await componentsStore.fetchOne(id)
    componentVersion.value = latestPublished.value
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load component'))
    detail.value = null
  } finally {
    loadingDetail.value = false
  }
}

watch(() => props.visible, (val) => {
  if (!val) return
  componentId.value = null
  componentVersion.value = null
  detail.value = null
  loadComponents()
})

watch(componentId, (id) => {
  if (id) loadDetail(id)
  else detail.value = null
})

function handleConfirm() {
  if (!componentId.value) {
    message.error('Pick a component first')
    return
  }
  emit('confirm', { componentId: componentId.value, componentVersion: componentVersion.value ?? latestPublished.value ?? 1 })
  emit('update:visible', false)
}
</script>

<template>
  <NModal
    :show="visible"
    preset="card"
    title="Insert Component"
    style="width: 560px; max-width: 94vw;"
    :bordered="false"
    @update:show="(v) => emit('update:visible', v)"
  >
    <NSpin :show="loadingDetail">
      <NForm label-placement="top">
        <NFormItem label="Component">
          <NSelect
            v-model:value="componentId"
            :options="options"
            filterable
            clearable
            placeholder="Pick a reusable block (e.g. Daftar Pegawai)"
          />
        </NFormItem>
        <NFormItem label="Pinned version (BR-001)">
          <NSelect
            v-model:value="componentVersion"
            :options="versionOptions"
            :disabled="!detail"
            placeholder="Latest published by default"
          />
        </NFormItem>
      </NForm>
      <NEmpty v-if="!detail" size="small" description="Requirement slots preview after picking a component" />
      <div v-else>
        <NText depth="3" style="font-size: 12px;">
          Placement is created with these requirement slots unbound (amber) — Task 16 fills values:
        </NText>
        <NSpace :size="6" style="margin-top: 8px;">
          <NTag
            v-for="req in detail.requirements ?? []"
            :key="req.name"
            type="warning"
            size="small"
            :bordered="false"
          >
            {{ req.name }} · {{ req.type }}
          </NTag>
          <NText v-if="!(detail.requirements ?? []).length" depth="3" style="font-size: 12px;">
            No requirements declared.
          </NText>
        </NSpace>
      </div>
    </NSpin>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('update:visible', false)">Cancel</NButton>
        <NButton type="primary" :disabled="!componentId" @click="handleConfirm">Insert placement</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
