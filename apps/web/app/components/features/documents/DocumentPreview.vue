<script setup lang="ts">
import { computed } from 'vue'
import { NAlert, NButton, NCollapse, NCollapseItem, NSkeleton, NSpace, NTag } from 'naive-ui'
import type { RenderWarning } from '~/shared/types/render'

const props = withDefaults(defineProps<{
  html?: string | null
  warnings?: RenderWarning[]
  loading?: boolean
  error?: string | null
  /** Shown when there is no data context to render with. */
  emptyNotice?: string | null
}>(), {
  html: null,
  warnings: () => [],
  loading: false,
  error: null,
  emptyNotice: null,
})

const emit = defineEmits<{
  (e: 'retry'): void
}>()

const showEmpty = computed(() => !props.loading && !props.error && !props.html && !!props.emptyNotice)
const showRendered = computed(() => !props.loading && !props.error && !!props.html)

function warningType(code: RenderWarning['code']): 'warning' | 'error' {
  return code === 'EXPR_ERROR' || code === 'TIMEOUT' ? 'error' : 'warning'
}
</script>

<template>
  <div class="document-preview">
    <!-- Rendering state: skeleton -->
    <div v-if="loading">
      <NSkeleton text :repeat="6" />
      <NSkeleton text style="width: 60%;" />
    </div>

    <!-- Error state: red alert + retry -->
    <NAlert
      v-else-if="error"
      type="error"
      title="Preview failed"
      :show-icon="true"
    >
      <NSpace vertical size="small">
        <span>{{ error }}</span>
        <NButton size="small" secondary type="error" class="preview-retry" @click="emit('retry')">
          Retry
        </NButton>
      </NSpace>
    </NAlert>

    <!-- Empty context notice -->
    <NAlert
      v-else-if="showEmpty"
      type="info"
      title="No data to preview"
      :show-icon="true"
    >
      {{ emptyNotice }}
    </NAlert>

    <template v-else>
      <!-- Warnings: collapsible amber alert listing codes -->
      <NAlert
        v-if="warnings.length > 0"
        type="warning"
        title="Render warnings"
        :show-icon="true"
        style="margin-bottom: 8px;"
      >
        <NCollapse :default-expanded-names="['warnings']">
          <NCollapseItem :title="`${warnings.length} warning(s)`" name="warnings">
            <ul class="preview-warnings">
              <li v-for="(warning, index) in warnings" :key="index">
                <NTag :type="warningType(warning.code)" size="small" :bordered="false" style="margin-right: 6px;">
                  {{ warning.code }}
                </NTag>
                <span>{{ warning.message }}</span>
                <span v-if="warning.nodeId" class="preview-node-id">({{ warning.nodeId }})</span>
              </li>
            </ul>
          </NCollapseItem>
        </NCollapse>
      </NAlert>

      <!-- Rendered state: sandboxed iframe (self-contained HTML) -->
      <iframe
        v-if="showRendered"
        sandbox=""
        title="Document preview"
        class="preview-frame"
        :srcdoc="html ?? ''"
      />
      <NAlert v-else type="info" title="Nothing to render" :show-icon="true">
        The template produced no output for the current context.
      </NAlert>
    </template>
  </div>
</template>

<style scoped>
.document-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.preview-frame {
  width: 100%;
  min-height: 480px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
}
.preview-warnings {
  margin: 4px 0 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.preview-node-id {
  color: #9ca3af;
  font-size: 12px;
}
.preview-retry {
  font-weight: 600;
}
@media (prefers-reduced-motion: reduce) {
  .document-preview * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
