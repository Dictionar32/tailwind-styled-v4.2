# Vite Plugin API

## `tailwindStyledVitePlugin(options)`
Plugin Vite untuk menjalankan integrasi scanner/engine saat dev dan build.

### Opsi utama
- `root`
- `include`
- `exclude`
- `cacheDir`

### Contoh
```ts
import { defineConfig } from "vite"
import { tailwindStyledVitePlugin } from "@tailwind-styled/vite"

export default defineConfig({
  plugins: [tailwindStyledVitePlugin()],
})
```
