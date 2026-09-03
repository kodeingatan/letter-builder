<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NAlert, NIcon } from 'naive-ui'
import { Locked } from '@vicons/carbon'

const visible = ref(false)
const message = ref('')

function handleDenied(event: Event) {
  const detail = (event as CustomEvent).detail
  message.value = detail?.message || 'Access denied'
  visible.value = true
  setTimeout(() => {
    visible.value = false
  }, 5000)
}

onMounted(() => window.addEventListener('rbac-denied', handleDenied))
onUnmounted(() => window.removeEventListener('rbac-denied', handleDenied))
</script>

<template>
  <Teleport to="body">
    <Transition name="alert-slide">
      <div
        v-show="visible"
        class="alert-container"
      >
        <NAlert
          type="error"
          :bordered="false"
          class="shadow-lg"
          closable
          @close="visible = false"
        >
          <template #icon>
            <NIcon><Locked /></NIcon>
          </template>
          <template #header>Access Denied</template>
          {{ message }}
        </NAlert>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.alert-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  max-width: 448px;
  pointer-events: auto;
}

.alert-slide-enter-active,
.alert-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.alert-slide-enter-from,
.alert-slide-leave-to {
  transform: translateX(120%);
  opacity: 0;
}

.alert-slide-enter-to,
.alert-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>
