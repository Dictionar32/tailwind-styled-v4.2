/**
 * tailwind-styled-v4 — Vite Plugin
 *
 * Usage in vite.config.ts:
 *   import { tailwindStyledPlugin } from "tailwind-styled-v4/vite"
 *   export default defineConfig({
 *     plugins: [react(), tailwindStyledPlugin()]
 *   })
 */

import fs from "node:fs"
import path from "node:path"

import type { TransformOptions } from "@tailwind-styled/compiler"
import { generateSafelist, shouldProcess, transformSource } from "@tailwind-styled/compiler"
import { createEngine } from "@tailwind-styled/engine"
import { scanWorkspace } from "@tailwind-styled/scanner"

export interface VitePluginOptions extends TransformOptions {
  include?: RegExp
  exclude?: RegExp
  scanDirs?: string[]
  safelistOutput?: string
  generateSafelist?: boolean
  /** Emit scanner summary JSON in build mode. */
  scanReportOutput?: string
  /** Run unified engine.build() at build end (compileCss disabled by default). */
  useEngineBuild?: boolean
}

export function tailwindStyledPlugin(opts: VitePluginOptions = {}): any {
  const {
    include = /\.(tsx|ts|jsx|js)$/,
    exclude = /node_modules/,
    scanDirs = ["src"],
    safelistOutput = ".tailwind-styled-safelist.json",
    scanReportOutput = ".tailwind-styled-scan-report.json",
    generateSafelist: doSafelist = true,
    useEngineBuild = true,
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

    async buildEnd() {
      if (isDev) return

      if (doSafelist) {
        try {
          generateSafelist(
            scanDirs.map((d) => path.resolve(root, d)),
            path.resolve(root, safelistOutput),
            root
          )
        } catch (e) {
          console.warn("[tailwind-styled-v4] Safelist generation failed:", e)
        }
      }

      try {
        const report = scanWorkspace(root)
        const reportPath = path.resolve(root, scanReportOutput)
        fs.writeFileSync(
          reportPath,
          JSON.stringify(
            {
              root,
              totalFiles: report.totalFiles,
              uniqueClassCount: report.uniqueClasses.length,
            },
            null,
            2
          ) + "\n"
        )
      } catch (e) {
        console.warn("[tailwind-styled-v4] Scan report generation failed:", e)
      }

      if (useEngineBuild) {
        try {
          const engine = await createEngine({ root, compileCss: false })
          await engine.build()
        } catch (e) {
          console.warn("[tailwind-styled-v4] Engine build step failed:", e)
        }
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
