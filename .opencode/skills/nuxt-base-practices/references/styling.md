# Nuxt Styling

## Local Stylesheets

Tempat: `app/assets/`

### Import di Components
```vue
<script>
import '~/assets/css/first.css'
</script>

<style>
@import url("~/assets/css/second.css");
</style>
```

### css Property di nuxt.config
```ts
export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],
})
```

### Fonts
```css
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/MyFont.woff') format('woff');
}
```

### Stylesheets dari npm
```ts
export default defineNuxtConfig({
  css: ['animate.css'],
})
```

## External Stylesheets

```ts
export default defineNuxtConfig({
  app: {
    head: {
      link: [{ rel: 'stylesheet', href: 'https://example.com/style.css' }],
    },
  },
})
```

Atau dynamic:
```ts
useHead({
  link: [{ rel: 'stylesheet', href: 'https://example.com/style.css' }],
})
```

## Preprocessors

### Install
```bash
npm install -D sass    # SCSS/Sass
npm install -D less    # Less
npm install -D stylus  # Stylus
```

### Gunakan di SFC
```vue
<style lang="scss">
@use "~/assets/scss/main.scss";
</style>
```

### Inject Variables
```ts
export default defineNuxtConfig({
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/_colors.scss" as *;',
        },
      },
    },
  },
})
```

## SFC Styling

### Scoped Styles
```vue
<style scoped>
.example { color: red; }
</style>
```

### CSS Modules
```vue
<template>
  <p :class="$style.red">Red text</p>
</template>

<style module>
.red { color: red; }
</style>
```

### Dynamic Styles dengan v-bind
```vue
<script setup lang="ts">
const color = ref('red')
</script>

<style>
.text { color: v-bind(color); }
</style>
```

## PostCSS

Default plugins:
- postcss-import
- postcss-url
- autoprefixer
- cssnano

```ts
export default defineNuxtConfig({
  postcss: {
    plugins: {
      'postcss-nested': {},
    },
  },
})
```

## Third-Party Libraries

- **UnoCSS**: atomic CSS engine
- **Tailwind CSS**: utility-first CSS
- **Nuxt UI**: component library
- **Panda CSS**: CSS-in-JS

## Best Practices

- Gunakan `app/assets/` untuk local styles
- Gunakan CSS preprocessors untuk maintainability
- Pertimbangkan CLS optimization dengan Fontaine
- Gunakan CDN untuk external CSS
- Compress assets (Brotli)
- Gunakan HTTP2/HTTP3
