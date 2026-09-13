<script setup lang="ts">
import { NEmpty, NButton } from 'naive-ui'

withDefaults(defineProps<{
  title?: string
  description?: string
  ctaLabel?: string
}>(), {
  title: 'Belum ada data',
  description: undefined,
  ctaLabel: undefined,
})

const emit = defineEmits<{
  (e: 'cta'): void
}>()
</script>

<template>
  <div class="empty-state-card">
    <svg
      class="empty-state-art"
      viewBox="0 0 120 80"
      role="img"
      aria-hidden="true"
    >
      <rect x="8" y="10" width="104" height="60" rx="12" fill="#ffffff" stroke="#e6e6e6" />
      <rect x="8" y="10" width="104" height="16" rx="8" fill="#62aef0" opacity="0.35" />
      <circle cx="28" cy="46" r="8" fill="#d6b6f6" />
      <rect x="44" y="40" width="48" height="6" rx="3" fill="#e6e6e6" />
      <rect x="44" y="50" width="32" height="6" rx="3" fill="#e6e6e6" />
      <circle cx="98" cy="58" r="6" fill="#2a9d99" opacity="0.7" />
    </svg>
    <NEmpty :description="title" :show-icon="false">
      <template #extra>
        <p v-if="description" class="empty-state-desc">{{ description }}</p>
        <NButton
          v-if="ctaLabel"
          type="primary"
          round
          size="medium"
          class="empty-state-cta"
          @click="emit('cta')"
        >
          {{ ctaLabel }}
        </NButton>
      </template>
    </NEmpty>
  </div>
</template>

<style scoped>
.empty-state-card {
  background: #f6f5f4;
  border: 1px solid #e6e6e6;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
}
.empty-state-art {
  width: 120px;
  height: 80px;
  margin: 0 auto 8px;
}
.empty-state-desc {
  font-size: 14px;
  color: #615d59;
  margin: 4px 0 12px;
}
.empty-state-cta {
  border-radius: 9999px;
}
</style>
