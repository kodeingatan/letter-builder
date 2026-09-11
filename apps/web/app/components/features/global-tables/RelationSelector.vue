<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { NSelect, NSpin, NEmpty, NTag, NButton, useMessage } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { useGlobalTablesData } from '~/composables/useGlobalTablesData'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

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

const message = import.meta.client ? useMessage() : null
const api = useApi()
const auth = useAuthStore()

const loading = ref(false)
const options = ref<SelectOption[]>([])
const search = ref('')
const offset = ref(0)
const limit = 20
const total = ref(0)

const hasMore = computed(() => offset.value + options.value.length < total.value)

async function fetchOptions(searchQuery = '', page = 1) {
  loading.value = true
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

    if (page === 1) {
      options.value = response.data.map(item => ({
        label: item.label,
        value: item.id,
        raw: item.raw,
      }))
    } else {
      options.value = [...options.value, ...response.data.map(item => ({
        label: item.label,
        value: item.id,
        raw: item.raw,
      }))]
    }
    total.value = response.total
  } catch (e: any) {
    message.error('Failed to load options')
  } finally {
    loading.value = false
  }
}

function handleSearch(query: string) {
  search.value = query
  offset.value = 0
  fetchOptions(query, 1)
}

function handleScroll(params: { option: SelectOption; index: number }) {
  if (loading.value || !hasMore.value) return
  if (params.index >= options.value.length - 5) {
    offset.value = options.value.length
    fetchOptions(search.value, Math.floor(options.value.length / limit) + 1)
  }
}

const selectedValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

watch(() => props.targetTableId, () => {
  if (props.targetTableId) {
    fetchOptions('', 1)
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
  <NSelect
    v-model:value="selectedValue"
    :options="options"
    :loading="loading"
    :multiple="multiple"
    :clearable="clearable"
    :disabled="disabled"
    :placeholder="placeholder || 'Select...'"
    filterable
    remote
    :render-label="renderLabel"
    :render-tag="multiple ? renderTag : undefined"
    @search="handleSearch"
    @scroll="handleScroll"
  />
</template>
