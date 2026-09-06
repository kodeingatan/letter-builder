<script setup lang="ts">
import { NTag } from 'naive-ui'

defineProps<{
  badge: string
  drifted: boolean
}>()
</script>

<template>
  <NTag :type="drifted ? 'warning' : 'success'" size="small" bordered round>
    {{ badge }}
  </NTag>
</template>
