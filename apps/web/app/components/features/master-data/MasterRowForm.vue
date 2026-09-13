<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NSelect, NCheckbox, NInputNumber,
  NDatePicker, NTimePicker, NButton, NSpace, NAlert, NUpload, useMessage,
} from 'naive-ui'
import { useMasterDataStore } from '~/stores/master-data'
import { useAuthStore } from '~/stores/auth'
import { previewOperation, formatIDR, parseIDRInput } from '~/utils/master-operation'
import { getErrorMessage } from '~/utils/error'
import RelationPickerModal from './RelationPickerModal.vue'
import type { MasterRow, MasterTableSchema } from '~/shared/types/master-data'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  slug: string
  schema: MasterTableSchema | null
  row?: MasterRow | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const store = useMasterDataStore()
const authStore = useAuthStore()
const message = import.meta.client ? useMessage() : null
const submitting = ref(false)
const formError = ref<string | null>(null)
const values = ref<Record<string, unknown>>({})
const picker = ref({ visible: false, targetSlug: '', multiple: false, column: '' })
const uploading = ref<Record<string, boolean>>({})

const editableColumns = computed(() =>
  (props.schema?.columns ?? []).filter((c) => c.type !== 'hidden_operation_text'),
)

const operationPreviews = computed(() => {
  const out: Record<string, { value: string; error: string | null }> = {}
  for (const col of props.schema?.columns ?? []) {
    if (col.type !== 'hidden_operation_text' && col.type !== 'readonly_operation_text') continue
    const expr = String((col.config as Record<string, unknown> | null)?.expression ?? '')
    out[col.name] = previewOperation(expr, values.value)
  }
  return out
})

function resetValues() {
  const next: Record<string, unknown> = {}
  for (const col of props.schema?.columns ?? []) {
    if (props.mode === 'edit' && props.row && props.row[col.name] !== undefined) {
      next[col.name] = props.row[col.name]
    } else if (col.type === 'select_multiple' || col.type === 'relation_multiple') {
      next[col.name] = []
    } else {
      next[col.name] = null
    }
  }
  values.value = next
  formError.value = null
}

watch(() => [props.visible, props.schema, props.row], () => {
  if (props.visible) resetValues()
}, { immediate: true })

function openPicker(columnName: string, targetSlug: string, multiple: boolean) {
  picker.value = { visible: true, targetSlug, multiple, column: columnName }
}

function onPickerConfirm(ids: number[]) {
  const col = picker.value.column
  values.value[col] = picker.value.multiple ? ids : (ids[0] ?? null)
}

function pickerLabel(columnName: string): string {
  const v = values.value[columnName]
  if (v === null || v === undefined) return 'Belum dipilih'
  return Array.isArray(v) ? (v.length > 0 ? v.join(', ') : 'Belum dipilih') : String(v)
}

async function handleImageChange(columnName: string, fileList: Array<{ file?: File | null; url?: string }>) {
  const file = fileList[fileList.length - 1]?.file
  if (!file) return
  uploading.value[columnName] = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('subfolder', 'general')
    const url = await $fetch<string>('/api/settings/upload', {
      method: 'POST', body: fd,
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    values.value[columnName] = url
    message?.success('Gambar diunggah')
  } catch (e) {
    message?.error(getErrorMessage(e, 'Upload gagal (maks 5MB)'))
  } finally {
    uploading.value[columnName] = false
  }
}

function idrDisplay(columnName: string): string {
  return formatIDR(values.value[columnName] as number | string | null)
}

function onIdrInput(columnName: string, text: string) {
  values.value[columnName] = parseIDRInput(text)
}

async function handleSubmit() {
  submitting.value = true
  formError.value = null
  try {
    // Operation columns are server-computed — never send them (DR-003).
    const payload: Record<string, unknown> = {}
    for (const col of props.schema?.columns ?? []) {
      if (col.type === 'hidden_operation_text' || col.type === 'readonly_operation_text') continue
      payload[col.name] = values.value[col.name]
    }
    if (props.mode === 'create') {
      await store.createRow(props.slug, payload)
      message?.success('Data tersimpan')
    } else if (props.row) {
      await store.updateRow(props.slug, Number(props.row.id), payload)
      message?.success('Data diperbarui')
    }
    emit('update:visible', false)
    emit('success')
  } catch (e) {
    formError.value = getErrorMessage(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <NModal :show="visible" preset="card" :title="mode === 'create' ? 'Tambah Data' : 'Ubah Data'" class="max-w-2xl modal-card" :bordered="false" @update:show="(v: boolean) => emit('update:visible', v)">
    <NAlert v-if="formError" type="error" class="mb-3">{{ formError }}</NAlert>
    <NAlert v-if="!schema" type="warning">Skema tabel belum dimuat.</NAlert>
    <NForm v-else @submit.prevent="handleSubmit">
      <template v-for="col in editableColumns" :key="col.name">
        <NFormItem :label="col.display_name" :show-require-mark="col.is_required">
          <!-- text -->
          <NInput v-if="col.type === 'text'" v-model:value="values[col.name]" placeholder="..." />
          <!-- richtext (textarea until Task 07 Tiptap) -->
          <NInput v-else-if="col.type === 'richtext'" v-model:value="values[col.name]" type="textarea" placeholder="Teks kaya (HTML sederhana)" />
          <!-- date / datetime / time -->
          <NDatePicker v-else-if="col.type === 'date'" :value="values[col.name] ? new Date(String(values[col.name])).getTime() : null" type="date" clearable class="w-full" @update:value="(v: number | null) => values[col.name] = v ? new Date(v).toISOString().slice(0, 10) : null" />
          <NDatePicker v-else-if="col.type === 'datetime'" :value="values[col.name] ? new Date(String(values[col.name])).getTime() : null" type="datetime" clearable class="w-full" @update:value="(v: number | null) => values[col.name] = v ? new Date(v).toISOString() : null" />
          <NTimePicker v-else-if="col.type === 'time'" :value="values[col.name] ? (() => { const [hh, mm, ss] = String(values[col.name]).split(':'); const d = new Date(); d.setHours(Number(hh) || 0, Number(mm) || 0, Number(ss) || 0); return d.getTime() })() : null" class="w-full" @update:value="(v: number | null) => values[col.name] = v ? new Date(v).toTimeString().slice(0, 8) : null" />
          <!-- image -->
          <div v-else-if="col.type === 'image'" class="w-full">
            <NUpload :show-file-list="false" accept="image/*" :loading="uploading[col.name]" @change="(opts: { fileList: Array<{ file?: File | null }> }) => handleImageChange(col.name, opts.fileList)">
              <NButton :loading="uploading[col.name]">Unggah Gambar</NButton>
            </NUpload>
            <p v-if="values[col.name]" class="mt-1 text-sm"><a :href="String(values[col.name])" target="_blank" class="text-blue-500">{{ values[col.name] }}</a></p>
          </div>
          <!-- select -->
          <NSelect v-else-if="col.type === 'select'" v-model:value="values[col.name]" :options="((col.config as { options?: string[] } | null)?.options ?? []).map((o) => ({ label: o, value: o }))" clearable />
          <!-- select_multiple -->
          <NSelect v-else-if="col.type === 'select_multiple'" v-model:value="values[col.name]" multiple :options="((col.config as { options?: string[] } | null)?.options ?? []).map((o) => ({ label: o, value: o }))" clearable />
          <!-- relation -->
          <div v-else-if="col.type === 'relation_single' || col.type === 'relation_multiple'" class="w-full">
            <NSpace align="center">
              <span class="text-sm">{{ pickerLabel(col.name) }}</span>
              <NButton size="small" @click="openPicker(col.name, String((col.config as Record<string, unknown> | null)?.target_slug ?? ''), col.type === 'relation_multiple')">Pilih</NButton>
              <NButton v-if="values[col.name] !== null" size="small" quaternary @click="values[col.name] = col.type === 'relation_multiple' ? [] : null">Hapus</NButton>
            </NSpace>
          </div>
          <!-- number (+IDR realtime) -->
          <div v-else-if="col.type === 'number'" class="w-full">
            <NInput v-if="(col.config as { currency?: boolean } | null)?.currency" :value="idrDisplay(col.name)" placeholder="Rp 0" @update:value="(t: string) => onIdrInput(col.name, t)" />
            <NInputNumber v-else v-model:value="values[col.name]" class="w-full" />
          </div>
          <!-- readonly operation: disabled preview -->
          <div v-else-if="col.type === 'readonly_operation_text'" class="w-full">
            <NInput :value="operationPreviews[col.name]?.value ?? ''" disabled placeholder="Terkomputasi otomatis" />
            <p v-if="operationPreviews[col.name]?.error" class="text-sm text-red-500">{{ operationPreviews[col.name]?.error }}</p>
          </div>
        </NFormItem>
      </template>
      <NSpace justify="end" class="mt-2">
        <NButton @click="emit('update:visible', false)">Batal</NButton>
        <NButton type="primary" attr-type="submit" :loading="submitting">Simpan</NButton>
      </NSpace>
    </NForm>
    <RelationPickerModal
      v-model:visible="picker.visible"
      :target-slug="picker.targetSlug"
      :multiple="picker.multiple"
      :selected="Array.isArray(values[picker.column]) ? (values[picker.column] as number[]) : (values[picker.column] != null ? [Number(values[picker.column])] : [])"
      @confirm="onPickerConfirm"
    />
  </NModal>
</template>
