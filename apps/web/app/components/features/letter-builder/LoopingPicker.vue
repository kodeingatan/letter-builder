<script setup lang="ts">
import { ref, computed } from 'vue'
import { NAlert, NButton, NCard, NCheckbox, NIcon, NSelect, NSpace } from 'naive-ui'
import { Checkmark } from '@vicons/carbon'

interface ColumnOption { label: string; value: string }

const props = defineProps<{
  tables: Array<{ label: string; value: string }>
  columns: ColumnOption[]
  modelValue?: { table: string | null; selected: string[] }
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: { table: string | null; selected: string[] }): void }>()

const table = ref(props.modelValue?.table ?? null)
const selected = ref<string[]>(props.modelValue?.selected ?? [])

const allChecked = computed(() => selected.value.length === props.columns.length && props.columns.length > 0)
const indeterminate = computed(() => selected.value.length > 0 && selected.value.length < props.columns.length)

function toggleAll(checked: boolean) {
  selected.value = checked ? props.columns.map((c) => c.value) : []
  emitUpdate()
}
function emitUpdate() {
  emit('update:modelValue', { table: table.value, selected: [...selected.value] })
}
</script>

<template>
  <NCard size="small" title="Looping — pilih sumber" class="border border-[#e6e6e6] rounded-[12px]">
    <NAlert type="info" class="mb-3" :show-icon="false">
      Pilih tabel <code>mst_*</code> → checklist kolom → repeater <code>source=item</code>. Header “Pilih semua” indeterminate.
    </NAlert>
    <div class="grid gap-3">
      <NSelect v-model:value="table" :options="tables" placeholder="Pilih tabel (mis. pegawai)" clearable @update:value="emitUpdate" />
      <div class="flex items-center gap-2">
        <NCheckbox :checked="allChecked" :indeterminate="indeterminate" @update:checked="toggleAll">
          Pilih semua ({{ selected.length }}/{{ columns.length }})
        </NCheckbox>
        <NSpace class="ml-auto">
          <NButton size="small" secondary :disabled="!table" @click="emitUpdate">
            <template #icon><NIcon><Checkmark /></NIcon></template>
            Terapkan
          </NButton>
        </NSpace>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <NCheckbox
          v-for="col in columns"
          :key="col.value"
          :checked="selected.includes(col.value)"
          @update:checked="(c: boolean) => { if (c) selected.push(col.value); else selected.splice(selected.indexOf(col.value), 1); emitUpdate() }"
        >
          {{ col.label }}
        </NCheckbox>
      </div>
      <div class="text-xs" style="color:#615d59">
        Auto-form akan ter-generate dari semua requirement (source ikut dihitung) — BR-002 Task07.
      </div>
    </div>
  </NCard>
</template>
