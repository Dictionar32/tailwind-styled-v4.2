import { defineConfig } from "tsup"

export default defineConfig({
  entry: { plugin: "src/plugin.ts" },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: [
    "vite",
    "path",
    "@tailwind-styled/compiler",
  ],
  tsconfig: "tsconfig.json",
  // Fix: suppress named+default exports warning — vite plugins are always named imports
  rollupOptions: {
    output: { exports: "named" },
  },
})
