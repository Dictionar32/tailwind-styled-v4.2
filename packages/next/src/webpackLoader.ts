/**
 * tailwind-styled-v4 — Webpack Loader
 *
 * UPGRADE #2: Route class registration for routeCss bundling
 * UPGRADE #3: Incremental CSS engine — skip unchanged files
 *  - Idempotency check (FIX #08)
 *  - Proper async error handling
 */

import type { TransformOptions } from "../../compiler/src/astTransform"
import { transformSource } from "../../compiler/src/astTransform"
import { registerFileClasses } from "../../compiler/src/routeCssCollector"
import { isAlreadyTransformed } from "../../compiler/src/twDetector"

interface WebpackLoaderOptions extends TransformOptions {
  routeCss?: boolean
  incremental?: boolean
  verbose?: boolean
}

interface WebpackContext {
  resourcePath: string
  getOptions(): WebpackLoaderOptions
  async(): (err: Error | null, result?: string) => void
}

export default function webpackLoader(this: WebpackContext, source: string): void {
  const callback = this.async()
  const filepath = this.resourcePath

  if (filepath.includes("node_modules") || filepath.includes(".next")) {
    callback(null, source)
    return
  }

  // FIX #08: Idempotency — skip already-transformed files
  if (isAlreadyTransformed(source)) {
    callback(null, source)
    return
  }

  try {
    const options = this.getOptions()

    // UPGRADE #3: Feed ke incremental engine.
    // processFile() melakukan hash-check internal dan return changed=false jika file sama.
    // Jika tidak berubah, skip transform mahal — return source as-is.
    if (options.incremental !== false) {
      const { getIncrementalEngine, parseClassesToNodes } =
        require("../../compiler/src/incrementalEngine") as typeof import("../../compiler/src/incrementalEngine")
      const engine = getIncrementalEngine({ verbose: options.verbose })

      // Quick pre-check: processFile dengan nodes kosong untuk hash check saja
      const quickResult = engine.processFile(filepath, source, [])
      if (!quickResult.changed) {
        // File tidak berubah — skip transform sepenuhnya
        callback(null, source)
        return
      }

      // File berubah — lanjut transform, lalu update engine dengan nodes aktual
      const result = transformSource(source, { ...options, filename: filepath })

      if (options.routeCss && result.changed && result.classes.length > 0) {
        registerFileClasses(filepath, result.classes)
      }

      const nodes = parseClassesToNodes(result.classes)
      const diff = engine.processFile(filepath, source, nodes)
      const { getBucketEngine } =
        require("../../compiler/src/styleBucketSystem") as typeof import("../../compiler/src/styleBucketSystem")
      getBucketEngine().applyDiff(diff.diff)

      callback(null, result.code)
      return
    }

    // incremental disabled — transform biasa
    const result = transformSource(source, { ...options, filename: filepath })
    if (options.routeCss && result.changed && result.classes.length > 0) {
      registerFileClasses(filepath, result.classes)
    }
    callback(null, result.code)
  } catch (err) {
    // Fail gracefully — don't break the build
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[tailwind-styled-v4] Webpack transform failed for ${filepath}:`, err)
    }
    callback(null, source)
  }
}
