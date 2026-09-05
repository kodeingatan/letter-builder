<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NButton, NAlert,
  NSpace, NText, NSelect, NTag, useMessage, type FormInst, type FormRules,
} from 'naive-ui'
import { useComponentsStore } from '~/stores/components'
import { getErrorMessage } from '~/utils/error'
import {
  checkPlaceholderMismatch,
  isValidRequirementName,
  placeholderSnippet,
  renderLocalPreview,
} from '~/composables/useComponentsData'
import ComponentRequirementManager from './ComponentRequirementManager.vue'
import ComponentPreview from './ComponentPreview.vue'
import type { ComponentDetail, ComponentRequirement } from '~/shared/types/component'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  componentId?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const message = useMessage()
const store = useComponentsStore()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)
const loadingDetail = ref(false)

const form = ref({
  name: '',
  content: '',
  looping: false,
  requirements: [] as ComponentRequirement[],
  samples: {} as Record<string, string>,
})

const rules: FormRules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
}

const title = computed(() => (props.mode === 'create' ? 'Create Component' : 'Edit Component'))

const mismatch = computed(() => checkPlaceholderMismatch(form.value.content, form.value.requirements))

const livePreview = computed(() =>
  renderLocalPreview(form.value.content, form.value.requirements, form.value.looping, form.value.samples),
)

const unknownDisplay = computed(() => mismatch.value.unknown.map((u) => `{{${u}}}`).join(', '))

const placeholderOptions = computed(() =>
  form.value.requirements
    .filter((r) => r.name)
    .map((r) => ({ label: `{{${r.name}}} (${r.type})`, value: r.name })),
)

function insertPlaceholder(name: string) {
  form.value.content = `${form.value.content || ''}${placeholderSnippet(name)}`
}

async function loadDetail(id: number) {
  loadingDetail.value = true
  try {
    const detail: ComponentDetail = await store.fetchOne(id)
    form.value = {
      name: detail.name,
      content: detail.content ?? '',
      looping: detail.looping,
      requirements: (detail.requirements ?? []).map((r) => ({ name: r.name, type: r.type })),
      samples: {},
    }
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load component'))
  } finally {
    loadingDetail.value = false
  }
}

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    if (props.mode === 'edit' && props.componentId) {
      loadDetail(props.componentId)
    } else {
      form.value = { name: '', content: '', looping: false, requirements: [], samples: {} }
    }
  },
)

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  if (form.value.name.length > 100) {
    message.error('Name must be 1–100 characters')
    return
  }
  const bad = form.value.requirements.filter((r) => !isValidRequirementName(r.name))
  if (bad.length) {
    message.error('Fix requirement names: unique snake_case required')
    return
  }
  const names = form.value.requirements.map((r) => r.name.toLowerCase())
  if (new Set(names).size !== names.length) {
    message.error('Requirement names must be unique per component')
    return
  }
  if (mismatch.value.unknown.length) {
    message.error(`Unknown placeholder(s): ${mismatch.value.unknown.map((u) => `{{${u}}}`).join(', ')}`)
    return
  }

  submitting.value = true
  try {
    const payload = {
      name: form.value.name,
      content: form.value.content || null,
      looping: form.value.looping,
      requirements: form.value.requirements.map((r) => ({ name: r.name, type: r.type })),
    }
    if (props.mode === 'create') {
      await store.create(payload)
      message.success('Component created as draft v1')
    } else if (props.componentId) {
      await store.update(props.componentId, payload)
      message.success('Draft saved (publish to bump version)')
    }
    emit('update:visible', false)
    emit('success')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to save component'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <NModal
    :show="visible"
    preset="card"
    :title="title"
    style="width: 1100px; max-width: 96vw;"
    :bordered="false"
    @update:show="(v) => emit('update:visible', v)"
  >
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Left: content editor -->
        <div>
          <NFormItem label="Name" path="name">
            <NInput v-model:value="form.name" placeholder="e.g. Identitas Pegawai" maxlength="100" show-count />
          </NFormItem>
          <NFormItem label="Content (HTML with {{placeholders}})" path="content">
            <NInput
              v-model:value="form.content"
              type="textarea"
              :rows="10"
              placeholder="<p>{{nama}} — {{nip}} ({{jabatan}})</p>"
              style="font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;"
            />
          </NFormItem>
          <NSpace vertical :size="8">
            <NText depth="3" style="font-size: 12px;">Insert placeholder:</NText>
            <NSelect
              placeholder="Choose a requirement to insert"
              :options="placeholderOptions"
              :disabled="!placeholderOptions.length"
              @update:value="insertPlaceholder"
            />
            <NSpace :size="4">
              <NTag size="small" :bordered="false" :type="form.looping ? 'warning' : 'info'">
                {{ form.looping ? 'Collection mode' : 'Single mode' }}
              </NTag>
              <NButton size="small" quaternary @click="form.looping = !form.looping">
                Switch to {{ form.looping ? 'Single' : 'Collection' }}
              </NButton>
            </NSpace>
          </NSpace>
          <NAlert
            v-if="mismatch.unknown.length"
            type="error"
            title="Unknown placeholders (save blocked)"
            style="margin-top: 12px;"
          >
            {{ unknownDisplay }} — declare them as requirements first.
          </NAlert>
          <NAlert
            v-else-if="mismatch.unused.length"
            type="warning"
            title="Unused requirements (warning only)"
            style="margin-top: 12px;"
          >
            {{ mismatch.unused.join(', ') }} — not referenced in content.
          </NAlert>
        </div>
        <!-- Right: requirements + samples + preview -->
        <div>
          <NText strong style="display: block; margin-bottom: 8px;">Data Requirements (contract)</NText>
          <ComponentRequirementManager
            :requirements="form.requirements"
            :samples="form.samples"
            :show-samples="true"
            @update:requirements="(v) => (form.requirements = v)"
            @update:samples="(v) => (form.samples = v)"
          />
          <div style="margin-top: 12px;">
            <ComponentPreview
              :html="livePreview.html"
              :loading="loadingDetail"
              :block-count="livePreview.blockCount"
              :looping="form.looping"
            />
          </div>
        </div>
      </div>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('update:visible', false)">Cancel</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">
          {{ mode === 'create' ? 'Create Draft' : 'Save Draft' }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
