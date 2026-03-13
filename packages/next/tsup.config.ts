import { defineConfig } from "tsup"

export default defineConfig({
  // Bundle index + loaders sebagai entry points terpisah
  // sehingga require.resolve("./turbopackLoader") resolve ke file di dist
  entry: {
    index:           "src/index.ts",
    turbopackLoader: "src/turbopackLoader.ts",
    webpackLoader:   "src/webpackLoader.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: [
    "next",
    "fs",
    "path",
    "crypto",
    "@tailwind-styled/compiler",
    "@tailwind-styled/plugin",
    "./turbopackLoader",
    "./webpackLoader",
  ],
  tsconfig: "tsconfig.json",
})
