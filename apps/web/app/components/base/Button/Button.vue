<script setup lang="ts">
interface Props {
    variant?: "primary" | "secondary"
    disabled?: boolean
}

withDefaults(defineProps<Props>(), {
    variant: "primary",
    disabled: false
})
</script>

<template>
    <button class="btn" :class="variant" :disabled="disabled">
        <slot />
    </button>
</template>

<style scoped>
.btn {
    padding: .75rem 1rem;
    border-radius: 8px;
    cursor: pointer;
}

.primary {
    background: #2563eb;
    color: white;
}

.secondary {
    background: #e5e7eb;
}
</style>
