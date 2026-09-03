<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NButton,
  NSpace, NDynamicInput, useMessage, type FormInst, type FormRules,
} from 'naive-ui'
import { useGuardsStore } from '~/stores/guards'
import { getErrorMessage } from '~/utils/error'
import type { Guard, CreateGuard, UpdateGuard } from '~/shared/types/guard'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  guard?: Guard | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const message = useMessage()
const guardsStore = useGuardsStore()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)

const form = ref({
  guardName: '',
  description: '',
  allowUrls: [] as string[],
  denyUrls: [] as string[],
})

const rules: FormRules = {
  guardName: { required: true, message: 'Guard name is required', trigger: 'blur' },
}

const title = computed(() => props.mode === 'create' ? 'Create Guard' : 'Edit Guard')

watch(() => props.visible, (val) => {
  if (val) {
    if (props.mode === 'edit' && props.guard) {
      form.value = {
        guardName: props.guard.guardName,
        description: props.guard.description || '',
        allowUrls: props.guard.urls?.filter((u) => u.type === 'allow').map((u) => u.url) || [],
        denyUrls: props.guard.urls?.filter((u) => u.type === 'deny').map((u) => u.url) || [],
      }
    } else {
      form.value = { guardName: '', description: '', allowUrls: [], denyUrls: [] }
    }
  }
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    if (props.mode === 'create') {
      await guardsStore.create(form.value as CreateGuard)
      message.success('Guard created')
    } else if (props.guard) {
      await guardsStore.update(props.guard.id, form.value as UpdateGuard)
      message.success('Guard updated')
    }
    emit('update:visible', false)
    emit('success')
  } catch (e: any) {
    message.error(getErrorMessage(e, 'Gagal menyimpan guard'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <NModal
    :show="visible"
    @update:show="(v) => emit('update:visible', v)"
    preset="card"
    :title="title"
    class="max-w-lg"
    :bordered="false"
  >
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <NFormItem label="Guard Name" path="guardName">
        <NInput v-model:value="form.guardName" placeholder="Guard name" />
      </NFormItem>
      <NFormItem label="Description" path="description">
        <NInput v-model:value="form.description" type="textarea" placeholder="Description" />
      </NFormItem>
      <NFormItem label="Allow URLs">
        <NDynamicInput v-model:value="form.allowUrls" placeholder="/api/*" />
      </NFormItem>
      <NFormItem label="Deny URLs">
        <NDynamicInput v-model:value="form.denyUrls" placeholder="/api/admin/*" />
      </NFormItem>
      <p class="text-xs text-gray-500">Use * for wildcard pattern (e.g., /api/users/*)</p>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('update:visible', false)">Cancel</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">
          {{ mode === 'create' ? 'Create' : 'Save' }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
