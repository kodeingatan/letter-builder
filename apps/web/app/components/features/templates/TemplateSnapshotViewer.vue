<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NSpin, NAlert, NText, NTag, NSpace } from 'naive-ui'
import { parseContentTree, summarizeNode } from '~/composables/useTemplatesData'
import type { TemplateVersion } from '~/shared/types/template'

const props = defineProps<{
  snapshot: TemplateVersion | null
  loading?: boolean
}>()

const nodes = computed(() => parseContentTree(props.snapshot?.content ?? null)?.nodes ?? [])
</script>

<template>
  <NCard size="small" title="Snapshot (read-only, immutable)">
    <template #header-extra>
      <NTag v-if="snapshot" size="small" :bordered="false">v{{ snapshot.version }}</NTag>
    </template>
    <NSpin :show="loading">
      <NAlert type="info" title="Immutability notice" :bordered="false" style="margin-bottom: 8px;">
        Published versions are frozen. Use “Roll back to draft” to copy this snapshot into the draft working copy,
        then publish again to create a new version.
      </NAlert>
      <div v-if="!snapshot">
        <NText depth="3">Select a version to view its frozen content.</NText>
      </div>
      <ol v-else style="margin: 0; padding-left: 18px;">
        <li v-for="(node, i) in nodes" :key="i" style="font-size: 13px; margin-bottom: 4px;">
          <NText code>{{ summarizeNode(node) }}</NText>
        </li>
      </ol>
      <NSpace vertical :size="4" style="margin-top: 8px;">
        <NText depth="3" style="font-size: 12px;">Raw JSON:</NText>
        <NText v-if="snapshot" code style="font-size: 12px; white-space: pre-wrap; word-break: break-word;">
          {{ snapshot.content }}
        </NText>
      </NSpace>
    </NSpin>
  </NCard>
</template>
