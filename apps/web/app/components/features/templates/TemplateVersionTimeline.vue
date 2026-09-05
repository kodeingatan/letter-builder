<script setup lang="ts">
import { computed } from 'vue'
import { NTimeline, NTimelineItem, NButton, NEmpty, NSpace, NTag } from 'naive-ui'
import type { TemplateVersion } from '~/shared/types/template'

const props = defineProps<{
  versions: TemplateVersion[]
  activeVersion?: number | null
}>()

const emit = defineEmits<{
  (e: 'view', version: number): void
  (e: 'rollback', version: number): void
}>()

const sorted = computed(() => [...(props.versions ?? [])].sort((a, b) => b.version - a.version))
</script>

<template>
  <div>
    <NEmpty v-if="!sorted.length" size="small" description="Not published yet — no snapshots" />
    <NTimeline v-else>
      <NTimelineItem
        v-for="v in sorted"
        :key="v.version"
        :type="activeVersion === v.version ? 'info' : 'success'"
        :title="`v${v.version} — ${new Date(v.createdAt).toLocaleString()}`"
      >
        <NSpace :size="6" align="center">
          <NTag size="small" :bordered="false" type="info">{{ v.nodeCount ?? 0 }} nodes</NTag>
          <NButton text size="small" type="info" @click="emit('view', v.version)">
            View
          </NButton>
          <NButton text size="small" type="warning" @click="emit('rollback', v.version)">
            Roll back to draft
          </NButton>
        </NSpace>
      </NTimelineItem>
    </NTimeline>
  </div>
</template>
