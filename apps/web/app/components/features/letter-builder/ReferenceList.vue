<script setup lang="ts">
import { NAlert, NButton, NCard, NIcon, NList, NListItem, NTag } from 'naive-ui'
import { Warning } from '@vicons/carbon'

interface Reference {
  type: 'template' | 'administration' | 'master'
  name: string
  slug: string
  href: string
}

defineProps<{
  references: Reference[]
  title?: string
}>()

defineEmits<{ (e: 'view', href: string): void }>()
</script>

<template>
  <NCard size="small" class="border border-[#e6e6e6] rounded-[12px]">
    <template #header>
      <div class="flex items-center gap-2">
        <NIcon :size="16"><Warning /></NIcon>
        <span class="text-sm font-semibold">{{ title ?? 'Tidak dapat menghapus — masih dipakai (409)' }}</span>
      </div>
    </template>
    <NAlert type="warning" class="mb-3" :show-icon="false">
      Hapus diblokir 409 — berikut daftar pemakai. Lepaskan dependensi dahulu.
    </NAlert>
    <NList>
      <NListItem v-for="ref in references" :key="ref.slug">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <NIcon :size="14"><Warning /></NIcon>
            <span class="text-sm">{{ ref.name }}</span>
            <NTag size="small" :bordered="false" class="rounded-full" style="background:#f6f5f4">{{ ref.type }}</NTag>
          </div>
          <NButton size="small" secondary @click="$emit('view', ref.href)">Lihat</NButton>
        </div>
      </NListItem>
    </NList>
  </NCard>
</template>
