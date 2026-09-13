<script setup lang="ts">
import { NButton } from 'naive-ui'

export interface HeroStat {
  label: string
  value: string | number
}

withDefaults(defineProps<{
  eyebrow?: string
  title: string
  subtitle?: string
  stats?: HeroStat[]
  primaryLabel?: string
  secondaryLabel?: string
}>(), {
  eyebrow: undefined,
  subtitle: undefined,
  stats: () => [],
  primaryLabel: undefined,
  secondaryLabel: undefined,
})

const emit = defineEmits<{
  (e: 'primary'): void
  (e: 'secondary'): void
}>()
</script>

<template>
  <div class="dashboard-hero">
    <svg
      class="dashboard-hero-stickers"
      viewBox="0 0 200 120"
      aria-hidden="true"
    >
      <circle cx="170" cy="24" r="14" fill="#62aef0" opacity="0.8" />
      <rect x="140" y="60" width="28" height="28" rx="8" fill="#d6b6f6" opacity="0.8" transform="rotate(12 154 74)" />
      <circle cx="30" cy="96" r="10" fill="#ff64c8" opacity="0.7" />
      <rect x="52" y="18" width="20" height="20" rx="10" fill="#2a9d99" opacity="0.7" />
      <circle cx="110" cy="100" r="6" fill="#1aae39" opacity="0.7" />
      <rect x="86" y="40" width="12" height="12" rx="4" fill="#dd5b00" opacity="0.7" transform="rotate(-12 92 46)" />
    </svg>
    <div class="dashboard-hero-body">
      <p v-if="eyebrow" class="dashboard-hero-eyebrow">{{ eyebrow }}</p>
      <h1 class="dashboard-hero-title">{{ title }}</h1>
      <p v-if="subtitle" class="dashboard-hero-subtitle">{{ subtitle }}</p>
      <div v-if="primaryLabel || secondaryLabel" class="dashboard-hero-ctas">
        <NButton
          v-if="primaryLabel"
          type="primary"
          round
          size="large"
          @click="emit('primary')"
        >
          {{ primaryLabel }}
        </NButton>
        <NButton
          v-if="secondaryLabel"
          round
          size="large"
          color="#ffffff"
          text-color="#213183"
          @click="emit('secondary')"
        >
          {{ secondaryLabel }}
        </NButton>
      </div>
      <dl v-if="stats.length" class="dashboard-hero-stats">
        <div v-for="s in stats" :key="s.label" class="dashboard-hero-stat">
          <dt>{{ s.label }}</dt>
          <dd>{{ s.value }}</dd>
        </div>
      </dl>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dashboard-hero {
  position: relative;
  overflow: hidden;
  background: #213183;
  color: #ffffff;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
}
.dashboard-hero-stickers {
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 120px;
  pointer-events: none;
}
.dashboard-hero-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.125px;
  text-transform: uppercase;
  opacity: 0.75;
  margin-bottom: 8px;
}
.dashboard-hero-title {
  font-size: 40px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -1px;
  margin: 0 0 8px;
}
.dashboard-hero-subtitle {
  font-size: 16px;
  line-height: 1.5;
  opacity: 0.85;
  margin: 0 0 16px;
}
.dashboard-hero-ctas {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.dashboard-hero-stats {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  margin: 0;
}
.dashboard-hero-stat dt {
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 2px;
}
.dashboard-hero-stat dd {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.625px;
  margin: 0;
}
@media (max-width: 768px) {
  .dashboard-hero {
    padding: 24px;
  }
  .dashboard-hero-title {
    font-size: 26px;
    letter-spacing: -0.625px;
  }
}
</style>
