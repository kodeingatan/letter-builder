<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NForm, NFormItem, NInput, NSelect, NCheckbox, NButton, NSpace,
  NDynamicInput, NCard, NAlert, useMessage,
} from 'naive-ui'
import { useMasterDataStore } from '~/stores/master-data'
import { getErrorMessage } from '~/utils/error'
import type { MasterColumnType, MasterTable } from '~/shared/types/master-data'

const props = defineProps<{
  mode: 'create' | 'edit'
  table?: MasterTable | null
}>()

const emit = defineEmits<{ (e: 'success', slug: string): void }>()

const store = useMasterDataStore()
const message = import.meta.client ? useMessage() : null
const submitting = ref(false)
const formError = ref<string | null>(null)

interface ColumnDraft {
  name: string
  display_name: string
  type: MasterColumnType
  configText: string
  default_value: string
  is_required: boolean
  is_orderable: boolean
  is_searchable: boolean
}

const COLUMN_TYPES: Array<{ label: string; value: MasterColumnType }> = [
  { label: 'Teks', value: 'text' },
  { label: 'Richtext', value: 'richtext' },
  { label: 'Tanggal (m-d-Y)', value: 'date' },
  { label: 'Datetime (m-d-Y H:i:s)', value: 'datetime' },
  { label: 'Jam (H:i:s)', value: 'time' },
  { label: 'Gambar', value: 'image' },
  { label: 'Pilihan (select)', value: 'select' },
  { label: 'Multi-pilihan', value: 'select_multiple' },
  { label: 'Relasi (1)', value: 'relation_single' },
  { label: 'Relasi (N)', value: 'relation_multiple' },
  { label: 'Angka (+IDR)', value: 'number' },
  { label: 'Operasi tersembunyi', value: 'hidden_operation_text' },
  { label: 'Operasi readonly', value: 'readonly_operation_text' },
]

const CONFIG_HINT: Partial<Record<MasterColumnType, string>> = {
  select: 'JSON: {"options":["A","B"]}',
  select_multiple: 'JSON: {"options":["A","B"]}',
  relation_single: 'JSON: {"target_slug":"jabatan","display_column":"nama"}',
  relation_multiple: 'JSON: {"target_slug":"jabatan"}',
  number: 'JSON: {"currency":true} (opsional)',
  date: 'JSON: {"format":"m-d-Y"} (opsional)',
  hidden_operation_text: 'JSON: {"expression":"\\"Total: \\"++gaji+bonus"}',
  readonly_operation_text: 'JSON: {"expression":"\\"Total: \\"++gaji+bonus"}',
}

function toDraft(): ColumnDraft[] {
  return (props.table?.columns ?? []).map((c) => ({
    name: c.name,
    display_name: c.display_name,
    type: c.type,
    configText: c.config_json ?? '',
    default_value: c.default_value ?? '',
    is_required: c.is_required,
    is_orderable: c.is_orderable,
    is_searchable: c.is_searchable,
  }))
}

const form = ref({
  name: props.table?.name ?? '',
  display_name: props.table?.display_name ?? '',
  description: props.table?.description ?? '',
})
const columns = ref<ColumnDraft[]>(toDraft().length > 0 ? toDraft() : [emptyColumn()])

function emptyColumn(): ColumnDraft {
  return {
    name: '', display_name: '', type: 'text', configText: '',
    default_value: '', is_required: false, is_orderable: false, is_searchable: false,
  }
}

const nameRule = { required: true, pattern: /^[a-z][a-z0-9_]{1,60}$/, message: 'Format [a-z][a-z0-9_], min 2 karakter', trigger: 'blur' }

function parseConfig(col: ColumnDraft): Record<string, unknown> | undefined {
  if (!col.configText.trim()) return undefined
  try {
    return JSON.parse(col.configText) as Record<string, unknown>
  } catch {
    throw new Error(`Konfigurasi kolom "${col.display_name || col.name}" bukan JSON valid`)
  }
}

async function handleSubmit() {
  submitting.value = true
  formError.value = null
  try {
    const payload = {
      name: form.value.name.trim().toLowerCase(),
      display_name: form.value.display_name.trim(),
      description: form.value.description.trim() || undefined,
      columns: columns.value.map((col, i) => ({
        name: col.name.trim().toLowerCase(),
        display_name: col.display_name.trim(),
        type: col.type,
        ...(parseConfig(col) !== undefined ? { config: parseConfig(col) } : {}),
        ...(col.default_value ? { default_value: col.default_value } : {}),
        is_required: col.is_required,
        is_orderable: col.is_orderable,
        is_searchable: col.is_searchable,
        sort_order: i,
      })),
    }
    let slug = ''
    if (props.mode === 'create') {
      const created = await store.createTable(payload)
      slug = created.slug
      message?.success(`Tabel "${created.display_name}" dibuat (mst_${slug})`)
    } else if (props.table) {
      const updated = await store.updateTable(props.table.slug, { ...payload, columns: payload.columns })
      slug = updated.slug
      message?.success(`Tabel "${updated.display_name}" diperbarui`)
    }
    emit('success', slug)
  } catch (e) {
    formError.value = getErrorMessage(e)
  } finally {
    submitting.value = false
  }
}

const canSubmit = computed(() => form.value.name.trim() !== '' && form.value.display_name.trim() !== '' && columns.value.length > 0)
</script>

<template>
  <NForm @submit.prevent="handleSubmit">
    <NAlert v-if="formError" type="error" class="mb-4">{{ formError }}</NAlert>
    <div class="grid gap-4 md:grid-cols-2">
      <NFormItem label="Nama internal" :rule="nameRule" :show-require-mark="true">
        <NInput v-model:value="form.name" placeholder="pegawai" :disabled="mode === 'edit'" />
      </NFormItem>
      <NFormItem label="Nama tampilan" :show-require-mark="true">
        <NInput v-model:value="form.display_name" placeholder="Pegawai" />
      </NFormItem>
    </div>
    <NFormItem label="Keterangan">
      <NInput v-model:value="form.description" type="textarea" placeholder="Keterangan tabel (opsional)" />
    </NFormItem>

    <h3 class="mt-2 mb-2 font-semibold">Kolom ({{ columns.length }})</h3>
    <NDynamicInput v-model:value="columns" :on-create="emptyColumn" #="{ value: col, index }">
      <NCard size="small" class="w-full" :title="`Kolom ${index + 1}`">
        <div class="grid gap-3 md:grid-cols-3">
          <NFormItem label="Nama kolom" :show-require-mark="true">
            <NInput v-model:value="col.name" placeholder="nama" />
          </NFormItem>
          <NFormItem label="Label" :show-require-mark="true">
            <NInput v-model:value="col.display_name" placeholder="Nama" />
          </NFormItem>
          <NFormItem label="Tipe">
            <NSelect v-model:value="col.type" :options="COLUMN_TYPES" />
          </NFormItem>
        </div>
        <NFormItem :label="`Konfigurasi ${CONFIG_HINT[col.type] ? '— ' + CONFIG_HINT[col.type] : '(opsional)'}`">
          <NInput v-model:value="col.configText" type="textarea" :autosize="{ minRows: 1 }" placeholder='JSON config atau kosong' />
        </NFormItem>
        <div class="grid gap-3 md:grid-cols-4">
          <NFormItem label="Default"><NInput v-model:value="col.default_value" /></NFormItem>
          <NSpace align="center" class="pt-6">
            <NCheckbox v-model:checked="col.is_required">Wajib</NCheckbox>
            <NCheckbox v-model:checked="col.is_searchable">Cari</NCheckbox>
            <NCheckbox v-model:checked="col.is_orderable">Urut</NCheckbox>
          </NSpace>
        </div>
      </NCard>
    </NDynamicInput>

    <NSpace justify="end" class="mt-4">
      <NButton :loading="submitting" :disabled="!canSubmit" type="primary" attr-type="submit">
        {{ mode === 'create' ? 'Buat Tabel + DDL' : 'Simpan Perubahan' }}
      </NButton>
    </NSpace>
  </NForm>
</template>
