import { themeOverrides } from '~/utils/naiveui-theme'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      naiveui: {
        theme: themeOverrides,
      },
    },
  }
})
