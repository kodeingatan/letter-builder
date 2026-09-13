<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NFormItem, NInput, NSelect, NCheckbox, NSpace } from 'naive-ui'
import { useMasterDataStore } from '~/stores/master-data'
import { getErrorMessage } from '~/utils/error'
import type { DocNode } from '~/shared/types/document'

const props = defineProps<{ node: DocNode }>()
const emit = defineEmits<{ (e: 'patch', props: Record<string, unknown>): void }>()

const masterStore = useMasterDataStore()
const tableOptions = ref<Array<{ label: string; value: string }>>([])
const columnOptions = ref<Array<{ label: string; value: string }>>([])
const useMaster = ref(false)
const selectAll = ref(false)
const loadError = ref<string | null>(null)

function current(key: string): string {
  return String(props.node.props?.[key] ?? '')
}

onMounted(async () => {
  try {
    const res = await masterStore.fetchTables({ page: 1, limit: 100 })
    tableOptions.value = res.data.map((t) => ({ label: t.display_name, value: t.slug }))
  } catch (e) {
    loadError.value = getErrorMessage(e)
  }
})

async function onTableChange(slug: string) {
  emit('patch', { source: slug, item: current('item') || 'item' })
  columnOptions.value = []
  if (!slug) return
  try {
    const schema = await masterStore.fetchSchema(slug)
    columnOptions.value = schema.columns.map((c) => ({ label: c.display_name, value: c.name }))
  } catch (e) {
    loadError.value = getErrorMessage(e)
  }
}

function onSelectAll(on: boolean) {
  // "Pilih semua kolom" — loop memakai seluruh baris; kolom dipilih di template body via item.*.
  emit('patch', { source: current('source'), item: current('item') || 'item', selectAll: on })
}
</script>

<template>
  <div class="repeater-editor">
    <NFormItem label="Source (array data)">
      <NInput :value="current('source')" placeholder="employees / pegawai" @update:value="(v: string) => emit('patch', { source: v })" />
    </NFormItem>
    <NFormItem label="Item var">
      <NInput :value="current('item')" placeholder="item" @update:value="(v: string) => emit('patch', { item: v })" />
    </NFormItem>
    <NFormItem label="Sumber Master Data (looping picker)">
      <NSpace vertical class="w-full">
        <NSelect :value="null" :options="tableOptions" placeholder="Pilih tabel mst_*..." clearable @update:value="onTableChange" />
        <NCheckbox :checked="selectAll" @update:checked="(v: boolean) => { selectAll = v; onSelectAll(v) }">
          Pilih semua (seluruh baris + kolom via item.*)
        </NCheckbox>
        <span v-if="loadError" class="text-xs text-red-500">{{ loadError }}</span>
      </NSpace>
    </NFormItem>
  </div>
</template>
