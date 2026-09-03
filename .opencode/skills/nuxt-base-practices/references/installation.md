# Nuxt Installation

## Prerequisites

- **Node.js**: v22.x atau newer (recommended: active LTS release)
- **Text editor**: VS Code dengan Vue extension (Volar) atau WebStorm
- **Terminal**: untuk menjalankan perintah Nuxt

## Create New Project

```bash
# npm
npm create nuxt@latest <project-name>

# yarn
yarn create nuxt <project-name>

# pnpm
pnpm create nuxt@latest <project-name>

# bun
bun create nuxt@latest <project-name>

# deno
deno -A npm:create-nuxt@latest <project-name>
```

## Development Server

```bash
# npm
npm run dev -- -o

# yarn
yarn dev --open

# pnpm
pnpm dev -o

# bun
bun run dev -o

# deno
deno run dev -o
```

Default URL: `http://localhost:3000`

## Tips

- Gunakan Node.js versi genap (22, 24, dll)
- Di Windows, gunakan `127.0.0.1` bukan `localhost` untuk loading lebih cepat
- Di Windows dengan Docker, gunakan WSL untuk performa HMR yang lebih baik
