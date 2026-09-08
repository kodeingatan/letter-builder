<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NCard, NInput, NButton, NIcon, NSpin, NUpload, NTag, NAlert,
  useMessage,
} from 'naive-ui'
import type { UploadCustomRequestOptions } from 'naive-ui'
import { Save, Upload, Close, Image, Document } from '@vicons/carbon'

definePageMeta({ layout: 'default', middleware: 'auth', requiresAuth: true })

const message = import.meta.client ? useMessage() : null
const settingsStore = useSettingsStore()

const appName = ref('')
const appFavicon = ref('')
const loginBgGradient = ref(['#1e40af', '#3b82f6', '#6366f1'])
const loginBgImage = ref('')
const appDescription = ref('')
const saving = ref(false)
const loaded = ref(false)
const uploadingFavicon = ref(false)
const uploadingBg = ref(false)

// Task 22: production checklist card (admin-only, public health probe).
const { hasAnyRole } = useAuthorization()
const isProdAdmin = computed(() => hasAnyRole(['Admin', 'Super Admin']))
const health = ref<{ status: string; db: string; storage: string; renderer: string; version: string } | null>(null)
const healthLoading = ref(false)

async function fetchHealth() {
  if (!isProdAdmin.value) return
  healthLoading.value = true
  try {
    health.value = await $fetch('/api/health')
  } catch {
    health.value = null
  } finally {
    healthLoading.value = false
  }
}

onMounted(async () => {
  const data = await settingsStore.fetchSettings()
  if (data) {
    appName.value = settingsStore.appName
    appFavicon.value = settingsStore.appFavicon
    loginBgGradient.value = settingsStore.getGradientColors()
    loginBgImage.value = settingsStore.loginBgImage
    appDescription.value = settingsStore.appDescription
  }
  loaded.value = true
  await fetchHealth()
})

async function handleUploadFavicon(options: UploadCustomRequestOptions) {
  const file = options.file.file
  if (!file) return
  uploadingFavicon.value = true
  try {
    const url = await settingsStore.uploadFile(file)
    if (url) {
      appFavicon.value = url
      settingsStore.appFavicon = url
      settingsStore.updateHtmlMeta()
      message?.success('Favicon berhasil diupload')
    } else {
      message?.error('Gagal upload favicon')
    }
  } finally {
    uploadingFavicon.value = false
  }
}

async function handleUploadBgImage(options: UploadCustomRequestOptions) {
  const file = options.file.file
  if (!file) return
  uploadingBg.value = true
  try {
    const url = await settingsStore.uploadFile(file)
    if (url) {
      loginBgImage.value = url
      settingsStore.loginBgImage = url
      message?.success('Background image berhasil diupload')
    } else {
      message?.error('Gagal upload background image')
    }
  } finally {
    uploadingBg.value = false
  }
}

function removeBgImage() {
  loginBgImage.value = ''
}

async function handleSave() {
  saving.value = true
  try {
    await settingsStore.updateSettings([
      { key: 'app_name', value: appName.value },
      { key: 'app_favicon', value: appFavicon.value },
      { key: 'login_bg_gradient', value: loginBgGradient.value.join(',') },
      { key: 'login_bg_image', value: loginBgImage.value },
      { key: 'app_description', value: appDescription.value },
    ])
    message?.success('Settings berhasil disimpan')
  } catch {
    message?.error('Gagal menyimpan settings')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <NSpin :show="!loaded || settingsStore.loading">
    <div class="settings-page" v-if="loaded">
      <div class="settings-header">
        <h1 class="settings-title">Settings</h1>
        <p class="settings-desc">Kelola pengaturan aplikasi Anda</p>
      </div>

      <div class="settings-grid">
        <!-- App Name -->
        <NCard class="settings-card">
          <template #header>
            <div class="card-header">
              <NIcon :size="20" class="text-indigo-500"><Save /></NIcon>
              <span>Nama Aplikasi</span>
            </div>
          </template>
          <NInput v-model:value="appName" placeholder="Masukkan nama aplikasi" size="large" />
          <p class="settings-hint">Nama yang tampil di sidebar, browser tab, dan login page</p>
        </NCard>

        <!-- App Description -->
        <NCard class="settings-card">
          <template #header>
            <div class="card-header">
              <NIcon :size="20" class="text-indigo-500"><Document /></NIcon>
              <span>Deskripsi Aplikasi</span>
            </div>
          </template>
          <NInput v-model:value="appDescription" type="textarea" placeholder="Masukkan deskripsi aplikasi" :rows="3" />
          <p class="settings-hint">Deskripsi yang tampil di halaman login & register</p>
        </NCard>

        <!-- Favicon -->
        <NCard class="settings-card">
          <template #header>
            <div class="card-header">
              <NIcon :size="20" class="text-indigo-500"><Image /></NIcon>
              <span>Favicon</span>
            </div>
          </template>
          <div class="favicon-section">
            <div class="favicon-preview-large">
              <img v-if="appFavicon" :src="appFavicon" alt="favicon" class="favicon-img-large" />
              <div v-else class="favicon-placeholder">?</div>
            </div>
            <div class="favicon-actions">
              <NUpload
                :max="1"
                accept="image/*"
                :show-file-list="false"
                :custom-request="handleUploadFavicon"
              >
                <NButton :loading="uploadingFavicon" secondary type="primary">
                  <template #icon><NIcon><Upload /></NIcon></template>
                  Upload File
                </NButton>
              </NUpload>
              <p class="settings-hint">SVG, PNG, atau ICO (max 2MB)</p>
            </div>
          </div>
        </NCard>

        <!-- Login Background -->
        <NCard class="settings-card settings-card--full">
          <template #header>
            <div class="card-header">
              <NIcon :size="20" class="text-indigo-500"><Image /></NIcon>
              <span>Background Login & Register</span>
            </div>
          </template>

          <div class="bg-section">
            <!-- Image Upload -->
            <div class="bg-upload-area">
              <p class="section-label">Background Image</p>
              <div class="bg-preview-container">
                <div class="bg-preview" :style="loginBgImage ? {
                  backgroundImage: `url(${loginBgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : {
                  background: `linear-gradient(135deg, ${loginBgGradient[0]} 0%, ${loginBgGradient[1]} 50%, ${loginBgGradient[2]} 100%)`
                }">
                  <div class="bg-preview-overlay">
                    <NUpload
                      :max="1"
                      accept="image/*"
                      :show-file-list="false"
                      :custom-request="handleUploadBgImage"
                    >
                      <NButton size="small" secondary>
                        <template #icon><NIcon><Upload /></NIcon></template>
                        Upload Image
                      </NButton>
                    </NUpload>
                    <NButton v-if="loginBgImage" size="small" type="error" secondary @click="removeBgImage">
                      <template #icon><NIcon><Close /></NIcon></template>
                      Remove
                    </NButton>
                  </div>
                </div>
              </div>
              <p class="settings-hint">Upload gambar untuk background login-register. Jika tidak ada gambar, gradient akan digunakan.</p>
            </div>

            <!-- Gradient Fallback -->
            <div class="bg-gradient-area">
              <p class="section-label">Gradient Fallback</p>
              <div class="color-row">
                <div v-for="(_color, idx) in loginBgGradient" :key="idx" class="color-input">
                  <input type="color" v-model="loginBgGradient[idx]" class="color-picker" />
                  <NInput v-model:value="loginBgGradient[idx]" :placeholder="`Color ${idx + 1}`" size="small" />
                </div>
              </div>
              <p class="settings-hint">Digunakan jika tidak ada gambar background</p>
            </div>
          </div>
        </NCard>
      </div>

      <!-- Production checklist (Task 22, admin-only) -->
      <NCard v-if="isProdAdmin" class="settings-card settings-card--full" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <NIcon :size="20" class="text-indigo-500"><Document /></NIcon>
            <span>Status Produksi</span>
          </div>
        </template>
        <div v-if="healthLoading">Memeriksa kesehatan sistem…</div>
        <div v-else-if="health">
          <NTag :type="health.status === 'healthy' ? 'success' : 'warning'" size="small" round>
            {{ health.status === 'healthy' ? 'HEALTHY' : 'DEGRADED' }}
          </NTag>
          <div class="detail-view" style="margin-top: 12px">
            <div class="detail-field">
              <span class="detail-label">Database</span>
              <span class="detail-value">{{ health.db }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">Storage</span>
              <span class="detail-value">{{ health.storage }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">Renderer</span>
              <span class="detail-value">{{ health.renderer }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">Versi</span>
              <span class="detail-value detail-value--mono">{{ health.version }}</span>
            </div>
          </div>
          <p class="settings-hint">Backup/restore: lihat runbook di <span class="detail-value--mono">docs/production-runbook.md</span>.</p>
        </div>
        <div v-else>
          <NAlert type="warning">Health endpoint tidak dapat dijangkau.</NAlert>
        </div>
      </NCard>

      <div class="settings-footer">
        <NButton type="primary" size="large" :loading="saving" @click="handleSave">
          <template #icon><NIcon><Save /></NIcon></template>
          Simpan Perubahan
        </NButton>
      </div>
    </div>
  </NSpin>
</template>

<style scoped>
.settings-page {
  max-width: 900px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 32px;
}

.settings-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.settings-desc {
  color: #6b7280;
  margin-top: 4px;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.settings-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.settings-card--full {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.settings-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}

.section-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  font-size: 14px;
}

/* Favicon */
.favicon-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.favicon-preview-large {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
  flex-shrink: 0;
}

.favicon-img-large {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.favicon-placeholder {
  font-size: 24px;
  color: #9ca3af;
}

.favicon-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Background */
.bg-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.bg-preview-container {
  margin-bottom: 8px;
}

.bg-preview {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.bg-preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s;
}

.bg-preview:hover .bg-preview-overlay {
  opacity: 1;
}

.color-row {
  display: flex;
  gap: 12px;
}

.color-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

/* Footer */
.settings-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

/* Responsive */
@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .bg-section {
    grid-template-columns: 1fr;
  }

  .favicon-section {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
