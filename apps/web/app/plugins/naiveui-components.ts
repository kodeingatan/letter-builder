import { NMessageProvider } from 'naive-ui'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('NMessageProvider', NMessageProvider)
})
