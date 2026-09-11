<script setup lang="ts">
import { NBreadcrumb, NBreadcrumbItem, NCard, NSpace } from 'naive-ui'

withDefaults(defineProps<{
  title?: string
  breadcrumbs?: { label: string; href?: string }[]
  loading?: boolean
}>(), {
  title: 'Global Tables',
  breadcrumbs: () => [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Data', href: '/dashboard/data' },
    { label: 'Global Tables' },
  ],
  loading: false,
})
</script>

<template>
  <div class="page-shell">
    <div class="page-shell-head">
      <div>
        <NBreadcrumb>
          <NBreadcrumbItem v-for="(b, i) in breadcrumbs" :key="i">
            <a v-if="b.href" :href="b.href" style="color:inherit; text-decoration:none">{{ b.label }}</a>
            <span v-else>{{ b.label }}</span>
          </NBreadcrumbItem>
        </NBreadcrumb>
        <h2 class="page-title">{{ title }}</h2>
        <p class="page-subtitle">Kelola struktur data dinamis — membuat, mengubah, menghapus skema tabel.</p>
      </div>
      <NSpace class="page-actions">
        <slot name="actions">
          <span style="font-size:12px; color:#94a3b8">[actions slot]</span>
        </slot>
      </NSpace>
    </div>
    <div class="page-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.page-shell {
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}
.page-shell-head {
  padding: 16px 20px;
  border-bottom: 1px solid #F3F4F6;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
  margin-top: 4px;
  color: #1F2937;
}
.page-subtitle {
  font-size: 12px;
  color: #6B7280;
  margin-top: 2px;
}
.page-body {
  padding: 20px;
}
@media (max-width: 768px) {
  .page-shell-head {
    flex-direction: column;
  }
}
</style>
