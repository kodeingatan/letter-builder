<script setup lang="ts">
import { NCard, NEmpty, NSpin, NTag } from 'naive-ui'

defineProps<{
  html: string
  loading?: boolean
  blockCount?: number
  looping?: boolean
}>()
</script>

<template>
  <NCard title="Live Preview" size="small" :bordered="true">
    <template #header-extra>
      <NTag v-if="looping" type="warning" size="small" :bordered="false">
        Collection · {{ blockCount ?? 1 }} block(s)
      </NTag>
      <NTag v-else type="info" size="small" :bordered="false">Single</NTag>
    </template>
    <NSpin :show="!!loading">
      <NEmpty v-if="!html" size="small" description="Write content with {{placeholders}} to see a preview" />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-else class="component-preview-body" v-html="html" />
    </NSpin>
  </NCard>
</template>

<style scoped>
.component-preview-body {
  font-size: 14px;
  line-height: 1.6;
  color: #1e293b;
  word-break: break-word;
}
</style>
