<script setup lang="ts">
import { NButton, NIcon, NTooltip, NSpace } from 'naive-ui'
import { Launch, Copy, Document } from '@vicons/carbon'

const props = defineProps<{
  path?: string
  line?: number
}>()

function openInVSCode() {
  if (!props.path) return
  const uri = props.line ? `vscode://file/${props.path}:${props.line}` : `vscode://file/${props.path}`
  window.open(uri, '_blank')
}

function copyPath() {
  if (props.path) navigator.clipboard.writeText(props.path)
}

function copyLine() {
  if (props.line) navigator.clipboard.writeText(String(props.line))
}
</script>

<template>
  <NSpace :size="4" v-if="path">
    <NTooltip>
      <template #trigger>
        <NButton size="tiny" quaternary @click="openInVSCode">
          <template #icon><NIcon><Launch /></NIcon></template>
        </NButton>
      </template>
      Open in VS Code
    </NTooltip>
    <NTooltip>
      <template #trigger>
        <NButton size="tiny" quaternary @click="copyPath">
          <template #icon><NIcon><Copy /></NIcon></template>
        </NButton>
      </template>
      Copy Path
    </NTooltip>
    <NTooltip v-if="line">
      <template #trigger>
        <NButton size="tiny" quaternary @click="copyLine">
          <template #icon><NIcon><Document /></NIcon></template>
        </NButton>
      </template>
      Copy Line {{ line }}
    </NTooltip>
  </NSpace>
</template>
