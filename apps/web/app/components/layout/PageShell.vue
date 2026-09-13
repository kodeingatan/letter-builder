<script setup lang="ts">
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui'

withDefaults(defineProps<{
  title: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  description?: string
}>(), {
  breadcrumbs: () => [],
  description: undefined,
})

function handleBreadcrumbClick(e: MouseEvent, href?: string) {
  if (!href) return
  e.preventDefault()
  navigateTo(href)
}
</script>

<template>
  <div class="page-shell">
    <div class="page-shell-head">
      <div class="page-shell-head-left">
        <NBreadcrumb v-if="breadcrumbs.length">
          <NBreadcrumbItem v-for="(b, i) in breadcrumbs" :key="i">
            <a
              v-if="b.href"
              :href="b.href"
              style="color: inherit; text-decoration: none"
              @click="handleBreadcrumbClick($event, b.href)"
            >{{ b.label }}</a>
            <span v-else aria-current="page">{{ b.label }}</span>
          </NBreadcrumbItem>
        </NBreadcrumb>
        <h2 class="page-title">{{ title }}</h2>
        <p v-if="description" class="page-subtitle">{{ description }}</p>
      </div>
      <div class="page-actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="page-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.page-shell {
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}
.page-shell-head {
  padding: 16px 20px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.page-shell-head-left {
  flex: 1;
  min-width: 200px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.125px;
  line-height: 28px;
  margin-top: 4px;
  color: #000000;
}
.page-subtitle {
  font-size: 12px;
  color: #615d59;
  margin-top: 2px;
  line-height: 16px;
}
.page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.page-body {
  padding: 24px;
}
@media (max-width: 768px) {
  .page-shell-head {
    flex-direction: column;
  }
}
</style>
