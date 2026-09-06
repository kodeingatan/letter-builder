<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NModal, NCard, NForm, NFormItem, NInput, NButton, NSpace, useMessage } from 'naive-ui'
import { useAdministrationsStore } from '~/stores/administrations'
import { getErrorMessage } from '~/utils/error'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  administrationId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const store = useAdministrationsStore()
const message = import.meta.client ? useMessage() : null

const form = ref({ name: '', description: '' as string | null })
const saving = ref(false)
const loading = ref(false)

const title = computed(() => (props.mode === 'create' ? 'Add Administration' : 'Edit Administration'))

async function loadDetail() {
  if (props.mode !== 'edit' || props.administrationId == null) return
  loading.value = true
  try {
    const detail = await store.fetchOne(props.administrationId)
    form.value = { name: detail.name, description: detail.description }
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to load administration'))
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.mode, props.administrationId],
  ([visible]) => {
    if (visible) {
      form.value = { name: '', description: null }
      loadDetail()
    }
  },
  { immediate: true },
)

function close() {
  emit('update:visible', false)
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    message?.warning('Name is required')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description?.trim() ? form.value.description.trim() : null,
    }
    if (props.mode === 'create') {
      await store.create(payload)
      message?.success('Administration created')
    } else if (props.administrationId != null) {
      await store.update(props.administrationId, payload)
      message?.success('Administration updated')
    }
    emit('success')
  } catch (e: any) {
    message?.error(getErrorMessage(e, 'Failed to save administration'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <NModal :show="visible" preset="card" :title="title" style="width: 520px; max-width: 92vw;" @update:show="(v: boolean) => emit('update:visible', v)">
    <NForm :disabled="loading || saving" label-placement="top">
      <NFormItem label="Name" required>
        <NInput v-model:value="form.name" placeholder="e.g. Surat Perjalanan Dinas" maxlength="100" show-count clearable />
      </NFormItem>
      <NFormItem label="Description">
        <NInput
          v-model:value="form.description"
          type="textarea"
          placeholder="Purpose of this workflow"
          :autosize="{ minRows: 2, maxRows: 5 }"
          clearable
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="close">Cancel</NButton>
        <NButton type="primary" :loading="saving || loading" @click="handleSubmit">Save</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
