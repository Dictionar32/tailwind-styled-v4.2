# Plugins

## Vite Plugin

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { tailwindStyledPlugin } from "@tailwind-styled/vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindStyledPlugin({
      generateSafelist: true,
      useEngineBuild: true,
      scanReportOutput: ".tailwind-styled-scan-report.json",
    }),
  ],
})
```

## Rspack Plugin

```ts
import { tailwindStyledRspackPlugin } from "@tailwind-styled/rspack"

export default {
  plugins: [tailwindStyledRspackPlugin()],
}
```
