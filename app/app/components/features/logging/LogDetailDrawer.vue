<script setup lang="ts">
import {
  NDrawer, NDrawerContent, NCode, NButton, NIcon, NTag,
} from 'naive-ui'
import { Launch, Copy, Document } from '@vicons/carbon'
import type { LogEntry } from '~/shared/types/system-log'
import LogLevelBadge from './LogLevelBadge.vue'

const props = defineProps<{
  visible: boolean
  entry: LogEntry | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

function openInVSCode(path?: string, line?: number) {
  if (!path) return
  const uri = line ? `vscode://file/${path}:${line}` : `vscode://file/${path}`
  window.open(uri, '_blank')
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<template>
  <NDrawer :show="visible" @update:show="emit('update:visible', $event)" :width="520" placement="right">
    <NDrawerContent title="Log Detail">
      <template v-if="entry">
        <div class="detail-view">
          <div class="detail-field">
            <span class="detail-label">Level</span>
            <span class="detail-value">
              <LogLevelBadge :level="entry.level" size="medium" />
            </span>
          </div>

          <div class="detail-field">
            <span class="detail-label">Timestamp</span>
            <span class="detail-value detail-value--mono">{{ entry.timestamp }}</span>
          </div>

          <div class="detail-field">
            <span class="detail-label">Context</span>
            <span class="detail-value">
              <NTag size="small" type="info" round>{{ entry.context }}</NTag>
            </span>
          </div>

          <div class="detail-field">
            <span class="detail-label">Message</span>
            <span class="detail-value detail-value--text">{{ entry.message }}</span>
          </div>

          <div v-if="entry.stackTrace" class="detail-field">
            <span class="detail-label">Stack Trace</span>
            <div class="detail-value detail-value--code detail-value--dark">
              <NCode :code="entry.stackTrace" language="typescript" class="text-xs" />
            </div>
          </div>

          <div v-if="entry.rawLine" class="detail-field">
            <span class="detail-label">Raw Line</span>
            <div class="detail-value detail-value--code">
              <NCode :code="entry.rawLine" class="text-xs" />
            </div>
          </div>

          <div v-if="entry.codePath" class="detail-field">
            <span class="detail-label">Source Code</span>
            <span class="detail-value detail-value--mono detail-value--text">
              {{ entry.codePath }}<template v-if="entry.codeLine">:{{ entry.codeLine }}</template>
            </span>
            <div class="detail-actions">
              <NButton size="small" type="primary" secondary @click="openInVSCode(entry.codePath, entry.codeLine)">
                <template #icon><NIcon><Launch /></NIcon></template>
                Open in VS Code
              </NButton>
              <NButton size="small" @click="copyToClipboard(entry.codePath!)">
                <template #icon><NIcon><Copy /></NIcon></template>
                Copy Path
              </NButton>
              <NButton v-if="entry.codeLine" size="small" @click="copyToClipboard(String(entry.codeLine!))">
                <template #icon><NIcon><Document /></NIcon></template>
                Line {{ entry.codeLine }}
              </NButton>
            </div>
          </div>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.detail-view {
  display: flex;
  flex-direction: column;
}

.detail-field {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.detail-field:last-child {
  border-bottom: none;
}

.detail-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 4px;
}

.detail-value {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.5;
  word-break: break-word;
}

.detail-value--text {
  font-weight: 400;
  color: #334155;
}

.detail-value--mono {
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
  font-size: 13px;
}

.detail-value--code {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-top: 2px;
  overflow-x: auto;
}

.detail-value--code :deep(pre) {
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-value--dark {
  background: #1e293b;
  border-color: #334155;
}

.detail-value--dark :deep(pre) {
  color: #e2e8f0;
}

.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
