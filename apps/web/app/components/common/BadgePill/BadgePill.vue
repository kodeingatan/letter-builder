<script setup lang="ts">
import { computed } from 'vue'
import { NTag } from 'naive-ui'

const props = withDefaults(defineProps<{
  label: string
  type?: 'primary' | 'success' | 'warning' | 'error' | 'default'
  dot?: string
}>(), {
  type: 'default',
  dot: undefined,
})

const tagType = computed(() => (props.type === 'primary' ? 'info' : props.type))

const tagStyle = computed(() => {
  if (props.type !== 'primary') return undefined
  return {
    backgroundColor: '#fff',
    color: '#0075de',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.125px',
    borderRadius: '9999px',
    padding: '4px 8px',
  }
})
</script>

<template>
  <NTag
    :type="tagType === 'default' ? undefined : tagType"
    :bordered="false"
    round
    size="small"
    :style="tagStyle"
    class="badge-pill"
  >
    <span
      v-if="dot"
      aria-hidden="true"
      class="badge-pill-dot"
      :style="{ backgroundColor: dot }"
    />
    {{ label }}
  </NTag>
</template>

<style scoped>
.badge-pill {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.125px;
  border-radius: 9999px;
  padding: 4px 8px;
}
.badge-pill-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  margin-right: 6px;
  vertical-align: baseline;
}
</style>
