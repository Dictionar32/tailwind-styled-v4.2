/**
 * tailwind-styled-v4 — Rspack Loader
 *
 * Rspack is 100% webpack-loader-compatible. This loader follows the same
 * contract as webpackLoader.ts — async callback, getOptions(), resourcePath.
 *
 * Usage in rspack.config.js / rspack.config.ts:
 *
 *   import { defineConfig } from "@rspack/cli"
 *   import { rspackLoader }  from "@tailwind-styled/rspack/loader"
 *
 *   export default defineConfig({
 *     module: {
 *       rules: [
 *         {
 *           test: /\.[jt]sx?$/,
 *           exclude: /node_modules/,
 *           use: [
 *             {
 *               loader: "@tailwind-styled/rspack/loader",
 *               options: {
 *                 routeCss:    false,
 *                 incremental: true,
 *                 verbose:     false,
 *               },
 *             },
 *           ],
 *         },
 *       ],
 *     },
 *   })
 *
 * Options:
 *   routeCss    — collect per-route CSS (default: false in dev)
 *   incremental — skip unchanged files via hash (default: true)
 *   verbose     — log transform info per file (default: false)
 *   atomic      — use atomic CSS mode (default: false)
 *   hoist       — auto-hoist tw() outside render (default: true)
 *   addDataAttr — add data-tw debug attrs in dev (default: true in dev)
 */

import type { TransformOptions } from "@tailwind-styled/compiler"
import { transformSource } from "@tailwind-styled/compiler"

interface RspackLoaderOptions extends TransformOptions {
  routeCss?: boolean
  incremental?: boolean
  verbose?: boolean
}

interface RspackLoaderContext {
  resourcePath: string
  getOptions(): RspackLoaderOptions
  async(): (err: Error | null, result?: string) => void
}

/**
 * Rspack webpack-compatible loader.
 * Export as default for `loader: require.resolve(...)` usage.
 */
export default function rspackLoader(this: RspackLoaderContext, source: string): void {
  const callback = this.async()
  const filepath = this.resourcePath

  // Skip non-source files
  if (
    filepath.includes("node_modules") ||
    filepath.includes(".rspack-dist") ||
    !/\.[jt]sx?$/.test(filepath)
  ) {
    callback(null, source)
    return
  }

  try {
    const options = this.getOptions()

    // Incremental mode — skip unchanged files via compiler's hash
    if (options.incremental !== false) {
      try {
        const { getIncrementalEngine, parseClassesToNodes } =
          require("@tailwind-styled/compiler") as typeof import("@tailwind-styled/compiler")

        if (typeof getIncrementalEngine === "function") {
          const engine = getIncrementalEngine({ verbose: options.verbose })
          const quickResult = engine.processFile(filepath, source, [])

          if (!quickResult.changed) {
            callback(null, source)
            return
          }

          const result = transformSource(source, { ...options, filename: filepath })

          if (options.routeCss && result.changed && result.classes.length > 0) {
            const { registerFileClasses } =
              require("@tailwind-styled/compiler") as typeof import("@tailwind-styled/compiler")
            if (typeof registerFileClasses === "function") {
              registerFileClasses(filepath, result.classes)
            }
          }

          const nodes = parseClassesToNodes(result.classes)
          engine.processFile(filepath, source, nodes)

          if (options.verbose && result.changed) {
            const env = result.rsc?.isServer ? "server" : "client"
            console.log(
              `[tailwind-styled/rspack] ${filepath.split(/[\\/]/).pop()} ` +
                `→ ${result.classes.length} classes, ${env} component`
            )
          }

          callback(null, result.code)
          return
        }
      } catch {
        // incremental engine not available — fall through to plain transform
      }
    }

    // Plain transform (incremental disabled or engine unavailable)
    const result = transformSource(source, { ...options, filename: filepath })

    if (options.routeCss && result.changed && result.classes.length > 0) {
      try {
        const { registerFileClasses } =
          require("@tailwind-styled/compiler") as typeof import("@tailwind-styled/compiler")
        if (typeof registerFileClasses === "function") {
          registerFileClasses(filepath, result.classes)
        }
      } catch {
        /* non-critical */
      }
    }

    callback(null, result.code)
  } catch (err) {
    // Fail gracefully — never break the build
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[tailwind-styled/rspack] Transform failed for ${filepath}:`, err)
    }
    callback(null, source)
  }
}
