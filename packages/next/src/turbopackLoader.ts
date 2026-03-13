/**
 * tailwind-styled-v4 — Turbopack Loader
 *
 * UPGRADE #2: Route class registration for routeCss bundling
 * UPGRADE #3: Incremental CSS engine — skip unchanged files
 *  - Skip files that already carry the transform marker (FIX #08)
 *  - Log transform summary in verbose dev mode
 */

import type { TransformOptions } from "../../compiler/src/astTransform"
import { transformSource } from "../../compiler/src/astTransform"
import { registerFileClasses } from "../../compiler/src/routeCssCollector"
import { isAlreadyTransformed } from "../../compiler/src/twDetector"

interface TurbopackLoaderOptions extends TransformOptions {
  routeCss?: boolean
  incremental?: boolean
  verbose?: boolean
}

interface TurbopackContext {
  resourcePath: string
}

// Turbopack loaders must return a plain string — NOT { code: string }.
// Returning an object causes: "Unable to deserializate response from webpack loaders
// transform operation — data did not match any variant of untagged enum Either"
export default function turbopackLoader(
  this: TurbopackContext,
  source: string,
  options: TurbopackLoaderOptions = {}
): string {
  const filepath = this.resourcePath

  // Skip node_modules and .next folder
  if (filepath.includes("node_modules") || filepath.includes(".next")) {
    return source
  }

  // Only process TypeScript/JSX files
  if (!/\.(tsx|ts|jsx|js)$/.test(filepath)) {
    return source
  }

  // FIX #08: Skip files already transformed — idempotency guard
  if (isAlreadyTransformed(source)) {
    return source
  }

  // UPGRADE #3: Incremental — skip unchanged files
  if (options.incremental !== false) {
    const { getIncrementalEngine, parseClassesToNodes } =
      require("../../compiler/src/incrementalEngine") as typeof import("../../compiler/src/incrementalEngine")

    const engine = getIncrementalEngine({ verbose: options.verbose })

    // Quick hash check — processFile dengan nodes kosong
    const quickResult = engine.processFile(filepath, source, [])
    if (!quickResult.changed) {
      return source
    }

    // File berubah — transform lalu update engine
    let result
    try {
      result = transformSource(source, { ...options, filename: filepath })
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[tailwind-styled-v4] Transform failed for ${filepath}:`, err)
      }
      return source
    }

    if (options.routeCss && result.changed && result.classes.length > 0) {
      registerFileClasses(filepath, result.classes)
    }

    const nodes = parseClassesToNodes(result.classes)
    const diff = engine.processFile(filepath, source, nodes)
    const { getBucketEngine } =
      require("../../compiler/src/styleBucketSystem") as typeof import("../../compiler/src/styleBucketSystem")
    getBucketEngine().applyDiff(diff.diff)

    if (options.verbose && result.changed && process.env.NODE_ENV !== "production") {
      const rsc = result.rsc
      const env = rsc?.isServer ? "server" : "client"
      console.log(
        `[tailwind-styled-v4] ${filepath.split("/").pop()} ` +
          `→ ${result.classes.length} classes, ${env} component` +
          (rsc?.needsClientDirective ? " (auto use-client)" : "")
      )
    }

    return result.code
  }

  // incremental disabled — transform biasa
  try {
    const result = transformSource(source, { ...options, filename: filepath })

    if (options.routeCss && result.changed && result.classes.length > 0) {
      registerFileClasses(filepath, result.classes)
    }

    if (options.verbose && result.changed && process.env.NODE_ENV !== "production") {
      const rsc = result.rsc
      const env = rsc?.isServer ? "server" : "client"
      console.log(
        `[tailwind-styled-v4] ${filepath.split("/").pop()} ` +
          `→ ${result.classes.length} classes, ${env} component` +
          (rsc?.needsClientDirective ? " (auto use-client)" : "")
      )
    }

    return result.code
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[tailwind-styled-v4] Transform failed for ${filepath}:`, err)
    }
    return source
  }
}
