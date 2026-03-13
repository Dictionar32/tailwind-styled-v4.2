/**
 * tailwind-styled-v4 — Rspack Plugin
 *
 * Rspack plugin yang menambahkan loader secara otomatis ke config.
 * Mirip withTailwindStyled() untuk Next.js, tapi untuk Rspack/Webpack.
 *
 * Usage:
 *   import { tailwindStyledRspackPlugin } from "@tailwind-styled/rspack"
 *
 *   export default defineConfig({
 *     plugins: [tailwindStyledRspackPlugin()],
 *   })
 *
 * Atau manual:
 *   import loaderPath from "@tailwind-styled/rspack/loader"
 *   // loader: loaderPath
 */

import path from "node:path"

export interface RspackPluginOptions {
  /** File patterns to transform (default: /\.[jt]sx?$/) */
  include?: RegExp
  /** File patterns to exclude (default: /node_modules/) */
  exclude?: RegExp
  /** Collect per-route CSS (default: false) */
  routeCss?: boolean
  /** Skip unchanged files via hash (default: true) */
  incremental?: boolean
  /** Log per-file transform info (default: false) */
  verbose?: boolean
  /** Atomic CSS mode (default: false) */
  atomic?: boolean
  /** Auto-hoist tw() outside render (default: true) */
  hoist?: boolean
  /** Add data-tw debug attributes in dev (default: NODE_ENV !== production) */
  addDataAttr?: boolean
}

const LOADER_PATH = path.resolve(__dirname, "loader.js")

/**
 * Rspack plugin — auto-registers the tailwind-styled loader.
 *
 * @example
 * // rspack.config.ts
 * import { tailwindStyledRspackPlugin } from "@tailwind-styled/rspack"
 *
 * export default {
 *   plugins: [tailwindStyledRspackPlugin()],
 * }
 */
export class TailwindStyledRspackPlugin {
  private opts: RspackPluginOptions

  constructor(opts: RspackPluginOptions = {}) {
    this.opts = opts
  }

  apply(compiler: any): void {
    const isDev = compiler.options.mode !== "production"

    const loaderOpts = {
      addDataAttr: this.opts.addDataAttr ?? isDev,
      routeCss: this.opts.routeCss ?? false,
      incremental: this.opts.incremental ?? true,
      verbose: this.opts.verbose ?? false,
      atomic: this.opts.atomic ?? false,
      hoist: this.opts.hoist ?? true,
    }

    const include = this.opts.include ?? /\.[jt]sx?$/
    const exclude = this.opts.exclude ?? /node_modules/

    // Check idempotency — don't register twice
    const existing = compiler.options.module?.rules ?? []
    const alreadyRegistered = existing.some((r: any) => r._tailwindStyledRspackMarker === true)
    if (alreadyRegistered) return

    const rule = {
      _tailwindStyledRspackMarker: true,
      test: include,
      exclude: exclude,
      use: [
        {
          loader: LOADER_PATH,
          options: loaderOpts,
        },
      ],
    }

    compiler.options.module.rules = [rule, ...existing]
  }
}

/**
 * Functional factory — same as `new TailwindStyledRspackPlugin(opts).apply(...)` but
 * works wherever Rspack/webpack expects a plugin object.
 */
export function tailwindStyledRspackPlugin(
  opts: RspackPluginOptions = {}
): TailwindStyledRspackPlugin {
  return new TailwindStyledRspackPlugin(opts)
}

export default tailwindStyledRspackPlugin
