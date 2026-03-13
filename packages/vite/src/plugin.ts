/**
 * tailwind-styled-v4 — Vite Plugin
 *
 * Usage in vite.config.ts:
 *   import { tailwindStyledPlugin } from "tailwind-styled-v4/vite"
 *   export default defineConfig({
 *     plugins: [react(), tailwindStyledPlugin()]
 *   })
 */

import path from "node:path"
import type { TransformOptions } from "@tailwind-styled/compiler"
import { generateSafelist, shouldProcess, transformSource } from "@tailwind-styled/compiler"

export interface VitePluginOptions extends TransformOptions {
  include?: RegExp
  exclude?: RegExp
  scanDirs?: string[]
  safelistOutput?: string
  generateSafelist?: boolean
}

export function tailwindStyledPlugin(opts: VitePluginOptions = {}): any {
  const {
    include = /\.(tsx|ts|jsx|js)$/,
    exclude = /node_modules/,
    scanDirs = ["src"],
    safelistOutput = ".tailwind-styled-safelist.json",
    generateSafelist: doSafelist = true,
    ...transformOpts
  } = opts

  let root = process.cwd()
  let isDev = true

  return {
    name: "tailwind-styled-v4",
    enforce: "pre" as const,

    configResolved(config: any) {
      root = config.root
      isDev = config.command === "serve"
    },

    transform(source: string, id: string) {
      const filepath = id.split("?")[0]
      if (!include.test(filepath)) return null
      if (exclude.test(filepath)) return null
      if (!shouldProcess(filepath)) return null

      const result = transformSource(source, {
        ...transformOpts,
        mode: transformOpts.mode ?? (isDev ? "runtime" : "zero-runtime"),
        addDataAttr: transformOpts.addDataAttr ?? isDev,
        filename: filepath,
      })

      if (!result.changed) return null
      return { code: result.code, map: null }
    },

    buildEnd() {
      if (!doSafelist || isDev) return

      try {
        generateSafelist(
          scanDirs.map((d) => path.resolve(root, d)),
          path.resolve(root, safelistOutput),
          root
        )
      } catch (e) {
        console.warn("[tailwind-styled-v4] Safelist generation failed:", e)
      }
    },

    handleHotUpdate({ file, server }: any) {
      if (include.test(file) && shouldProcess(file)) {
        server.ws.send({ type: "full-reload" })
      }
    },
  }
}

export default tailwindStyledPlugin
