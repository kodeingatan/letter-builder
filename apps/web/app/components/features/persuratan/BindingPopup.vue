<script setup lang="ts">
import { ref, computed } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, NSpace, NAlert } from 'naive-ui'
import { usePersuratanStore } from '~/stores/persuratan'
import type { BindingView } from '~/shared/types/persuratan'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', binding: { name: string; target: string; view: BindingView; component?: string }): void
}>()

const store = usePersuratanStore()
const form = ref({ name: '', target: '', view: 'text' as BindingView, component: '' })
const formError = ref<string | null>(null)

const viewOptions = [
  { label: 'Teks ({{target}})', value: 'text' },
  { label: 'Gambar (src={{target}})', value: 'image' },
  { label: 'Component (ref)', value: 'component' },
]

const componentOptions = computed(() =>
  store.components.map((c) => ({ label: `${c.name}${c.is_looping ? ' (loop)' : ''}`, value: c.name })),
)

function confirm() {
  formError.value = null
  if (!form.value.name.trim() || !form.value.target.trim()) {
    if (form.value.view !== 'component' || !form.value.name.trim()) {
      formError.value = 'Nama dan target wajib diisi'
      return
    }
  }
  if (form.value.view === 'component' && !form.value.component) {
    formError.value = 'Pilih component untuk view component'
    return
  }
  emit('confirm', {
    name: form.value.name.trim(),
    target: form.value.target.trim(),
    view: form.value.view,
    ...(form.value.view === 'component' ? { component: form.value.component } : {}),
  })
  emit('update:visible', false)
  form.value = { name: '', target: '', view: 'text', component: '' }
}
</script>

<template>
  <NModal :show="visible" preset="card" title="Sisipkan Binding" class="max-w-md modal-card" :bordered="false" @update:show="(v: boolean) => emit('update:visible', v)">
    <NAlert v-if="formError" type="error" class="mb-3">{{ formError }}</NAlert>
    <NForm @submit.prevent="confirm">
      <NFormItem label="Nama data" :show-require-mark="true">
        <NInput v-model:value="form.name" placeholder="nama" />
      </NFormItem>
      <NFormItem label="View" :show-require-mark="true">
        <NSelect v-model:value="form.view" :options="viewOptions" />
      </NFormItem>
      <NFormItem v-if="form.view !== 'component'" label="Target binding" :show-require-mark="true">
        <NInput v-model:value="form.target" placeholder="item.name / pegawai.nama / letter.number" />
      </NFormItem>
      <NFormItem v-else label="Component" :show-require-mark="true">
        <NSelect v-model:value="form.component" :options="componentOptions" placeholder="Pilih component" />
      </NFormItem>
      <NSpace justify="end">
        <NButton @click="emit('update:visible', false)">Batal</NButton>
        <NButton type="primary" attr-type="submit">Sisipkan</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>
