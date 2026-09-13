<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}
defineProps<Props>()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#f6f5f4] px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">{{ title }}</h1>
        <p v-if="subtitle" class="mt-2 text-gray-600">{{ subtitle }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-[#e6e6e6] shadow-[0_4px_18px_rgba(0,0,0,0.04)] p-8">
        <slot />
      </div>
    </div>
  </div>
</template>
