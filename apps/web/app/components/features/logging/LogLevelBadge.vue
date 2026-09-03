<script setup lang="ts">
import { computed } from 'vue'
import { NTag } from 'naive-ui'
import type { LogLevel } from '~/shared/types/system-log'

const props = defineProps<{
  level: LogLevel | string
  size?: 'small' | 'medium' | 'large'
}>()

const tagType = computed(() => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    TRACE: 'default',
    DEBUG: 'default',
    INFO: 'info',
    NOTICE: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'error',
    FATAL: 'error',
    EMERGENCY: 'error',
  }
  return map[props.level] || 'default'
})
</script>

<template>
  <NTag :type="tagType" :size="size || 'small'" :bordered="false">
    {{ level }}
  </NTag>
</template>
