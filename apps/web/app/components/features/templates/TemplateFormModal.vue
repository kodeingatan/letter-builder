<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NButton, NSpin,
  NSpace, useMessage, type FormInst, type FormRules,
} from 'naive-ui'
import { useTemplatesStore } from '~/stores/templates'
import { getErrorMessage } from '~/utils/error'
import type { TemplateDetail } from '~/shared/types/template'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  templateId?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const message = import.meta.client ? useMessage() : null
const store = useTemplatesStore()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)
const loadingDetail = ref(false)

const form = ref({
  name: '',
  description: '',
})

const rules: FormRules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
}

async function loadDetail(id: number) {
  loadingDetail.value = true
  try {
    const detail: TemplateDetail = await store.fetchOne(id)
    form.value = { name: detail.name, description: detail.description ?? '' }
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to load template'))
  } finally {
    loadingDetail.value = false
  }
}

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    if (props.mode === 'edit' && props.templateId) {
      loadDetail(props.templateId)
    } else {
      form.value = { name: '', description: '' }
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
  submitting.value = true
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description || null,
    }
    if (props.mode === 'create') {
      await store.create(payload)
      message.success('Template created as draft v0')
    } else if (props.templateId) {
      await store.update(props.templateId, payload)
      message.success('Template metadata saved')
    }
    emit('update:visible', false)
    emit('success')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Failed to save template'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <NModal
    :show="visible"
    preset="card"
    :title="mode === 'create' ? 'Create Template' : 'Edit Template'"
    style="width: 560px; max-width: 94vw;"
    :bordered="false"
    @update:show="(v) => emit('update:visible', v)"
  >
    <NSpin :show="loadingDetail">
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
        <NFormItem label="Name" path="name">
          <NInput v-model:value="form.name" placeholder="e.g. Surat Keputusan" maxlength="100" show-count />
        </NFormItem>
        <NFormItem label="Description" path="description">
          <NInput
            v-model:value="form.description"
            type="textarea"
            :rows="3"
            placeholder="Purpose notes for this document blueprint"
          />
        </NFormItem>
      </NForm>
    </NSpin>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('update:visible', false)">Cancel</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">
          {{ mode === 'create' ? 'Create Draft' : 'Save' }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
