<script setup lang="ts">
defineProps<{
  name?: 'fade' | 'slide-up' | 'slide-left' | 'scale'
  mode?: 'out-in' | 'in-out'
}>()
</script>

<template>
  <Transition :name="name || 'fade'" :mode="mode">
    <slot />
  </Transition>
</template>
