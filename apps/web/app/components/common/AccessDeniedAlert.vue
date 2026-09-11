<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NAlert, NIcon } from 'naive-ui'
import { Locked } from '@vicons/carbon'

const visible = ref(false)
const message = ref('')

function handleDenied(event: Event) {
  const detail = (event as CustomEvent).detail
  message.value = detail?.message || 'Anda tidak memiliki izin untuk melakukan aksi ini'
  visible.value = true
  setTimeout(() => {
    visible.value = false
  }, 4000)
}

onMounted(() => {
  if (import.meta.client) window.addEventListener('rbac-denied', handleDenied)
})
onUnmounted(() => {
  if (import.meta.client) window.removeEventListener('rbac-denied', handleDenied)
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="access-denied">
        <div
          v-show="visible"
          class="alert-container"
          data-testid="access-denied"
        >
          <NAlert
            type="error"
            :bordered="false"
            class="shadow-lg"
            closable
            @close="visible = false"
          >
            <template #icon>
              <NIcon aria-hidden="true"><Locked /></NIcon>
            </template>
            <template #header>Akses Ditolak</template>
            {{ message }}
          </NAlert>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
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

.access-denied-enter-active {
  animation: accessDeniedSlideIn 300ms ease-out;
}
.access-denied-leave-active {
  animation: accessDeniedSlideOut 200ms ease-in;
}

@keyframes accessDeniedSlideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes accessDeniedSlideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .access-denied-enter-active,
  .access-denied-leave-active {
    animation-duration: 0.01ms !important;
  }
}
</style>
