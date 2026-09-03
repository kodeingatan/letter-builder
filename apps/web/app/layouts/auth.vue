<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const settingsStore = useSettingsStore()

const title = computed(() => (route.meta?.layoutTitle as string) || settingsStore.appName)
const subtitle = computed(() => (route.meta?.layoutSubtitle as string) || '')
const imagePosition = computed(() => (route.meta?.layoutImagePosition as string) || 'right')

const isReversed = computed(() => imagePosition.value === 'left')

const imageStyle = computed(() => {
  if (settingsStore.loginBgImage) {
    return {
      backgroundImage: `url(${settingsStore.loginBgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  const colors = settingsStore.getGradientColors()
  return { background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)` }
})
</script>

<template>
  <div class="auth-layout" :class="{ 'auth-layout--reversed': isReversed }">
    <!-- Image Panel -->
    <div class="auth-image" :style="imageStyle">
      <div class="auth-image__overlay">
        <div class="auth-image__content">
          <svg class="auth-image__icon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="58" stroke="currentColor" stroke-width="2" opacity="0.3"/>
            <circle cx="60" cy="60" r="40" stroke="currentColor" stroke-width="2" opacity="0.5"/>
            <circle cx="60" cy="60" r="20" fill="currentColor" opacity="0.8"/>
          </svg>
          <h2 class="auth-image__title">{{ settingsStore.appName }}</h2>
          <p class="auth-image__subtitle">{{ settingsStore.appDescription }}</p>
        </div>
      </div>
      <div class="auth-image__pattern"></div>
    </div>

    <!-- Form Panel -->
    <div class="auth-form">
      <div class="auth-form__inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
}

.auth-layout--reversed {
  flex-direction: row-reverse;
}

/* Image Panel */
.auth-image {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.auth-image__overlay {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
  padding: 2rem;
}

.auth-image__icon {
  width: 120px;
  height: 120px;
  margin-bottom: 1.5rem;
  animation: authIconFloat 3s ease-in-out infinite;
}

@keyframes authIconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.auth-image__title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.auth-image__subtitle {
  font-size: 1rem;
  opacity: 0.9;
}

.auth-image__pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.15) 1px, transparent 0);
  background-size: 32px 32px;
}

/* Form Panel */
.auth-form {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #fafafa;
}

.auth-form__inner {
  width: 100%;
  max-width: 400px;
}

/* Responsive */
@media (max-width: 768px) {
  .auth-layout {
    flex-direction: column;
  }

  .auth-layout--reversed {
    flex-direction: column;
  }

  .auth-image {
    min-height: 200px;
    flex: none;
  }

  .auth-form {
    flex: 1;
  }
}
</style>
