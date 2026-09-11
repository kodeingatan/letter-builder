<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { NSelect, NSpin, NEmpty, NAlert, NButton, NTag } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { useApi } from '~/composables/useApi'
import { getErrorMessage } from '~/utils/error'

interface LookupItem {
  id: number
  label: string
  raw?: Record<string, any>
}

const props = defineProps<{
  modelValue: number | number[] | null
  columnId?: number
  targetTableId: number
  multiple?: boolean
  clearable?: boolean
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | number[] | null): void
}>()

const api = useApi()

const loading = ref(false)
const error = ref<string | null>(null)
const options = ref<SelectOption[]>([])
const search = ref('')
const total = ref(0)
const limit = 20

const hasMore = computed(() => options.value.length < total.value)

async function fetchOptions(searchQuery = '', page = 1) {
  if (!props.targetTableId) return
  loading.value = true
  if (page === 1) error.value = null
  try {
    const params: Record<string, any> = {
      limit,
      page,
      search: searchQuery || undefined,
    }
    if (props.columnId) {
      params.columnId = props.columnId
    }

    const response = await api.get<{ data: LookupItem[]; total: number }>(
      `/api/global-tables/${props.targetTableId}/rows/lookup`,
      { params }
    )

    const mapped = response.data.map(item => ({
      label: item.label,
      value: item.id,
      raw: item.raw,
    }))

    if (page === 1) {
      options.value = mapped
    } else {
      options.value = [...options.value, ...mapped]
    }
    total.value = response.total
    error.value = null
  } catch (e: any) {
    // keep selectedValue on error — do not clear options, show retry
    error.value = getErrorMessage(e, 'Gagal memuat opsi')
  } finally {
    loading.value = false
  }
}

function handleSearch(query: string) {
  search.value = query
  fetchOptions(query, 1)
}

function handleScroll(params: { option: SelectOption; index: number }) {
  if (loading.value || !hasMore.value) return
  if (params.index >= options.value.length - 5) {
    fetchOptions(search.value, Math.floor(options.value.length / limit) + 1)
  }
}

function handleRetry() {
  fetchOptions(search.value, 1)
}

const selectedValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

watch(() => props.targetTableId, () => {
  if (props.targetTableId) {
    search.value = ''
    fetchOptions('', 1)
  } else {
    options.value = []
    total.value = 0
  }
}, { immediate: true })

function renderLabel(option: SelectOption) {
  return h('span', {}, [option.label as string])
}

function renderTag(option: SelectOption) {
  return h(NTag, { size: 'small', type: 'info' }, { default: () => option.label as string })
}
</script>

<template>
  <div style="width:100%">
    <NSelect
      v-model:value="selectedValue"
      :options="options"
      :loading="loading"
      :multiple="multiple"
      :clearable="clearable"
      :disabled="disabled"
      :placeholder="placeholder || 'Cari...'"
      filterable
      remote
      :render-label="renderLabel"
      :render-tag="multiple ? renderTag : undefined"
      @search="handleSearch"
      @scroll="handleScroll"
    />
    <!-- Loading is handled by NSelect's loading prop; extra NS pin optional -->
    <!-- Empty state -->
    <NEmpty
      v-if="!loading && !error && options.length === 0"
      description="Tidak ada data. Buat dulu di tabel target."
      style="margin-top:12px; padding:12px; border:1px solid #F3F4F6; border-radius:8px; background:#fff"
    >
      <template #extra>
        <div style="font-size:11px;color:#6B7280;margin-top:6px">ALT-02 — panduan tidak dead-end</div>
      </template>
    </NEmpty>
    <!-- Error state with retry -->
    <NAlert
      v-if="error"
      type="error"
      style="margin-top:12px"
      closable
      @close="error = null"
    >
      <template #header>Gagal memuat opsi</template>
      {{ error }}
      <div style="margin-top:8px">
        <NButton size="small" @click="handleRetry">Coba lagi</NButton>
        <span style="font-size:11px;color:#6B7280;margin-left:8px">Pilihan lama dipertahankan</span>
      </div>
    </NAlert>
    <!-- hasMore hint for a11y / QA -->
    <div v-if="hasMore && options.length>0" style="font-size:11px;color:#6B7280;margin-top:6px" aria-live="polite">
      Menampilkan {{ options.length }} dari {{ total }} — scroll untuk memuat lagi
    </div>
  </div>
</template>
