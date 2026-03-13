import fs from "node:fs"
import path from "node:path"

import { extractAllClasses } from "@tailwind-styled/compiler"

import { ScanCache } from "./cache"
import { parseJsxLikeClasses } from "./ast-parser"

export interface ScanWorkspaceOptions {
  includeExtensions?: string[]
  ignoreDirectories?: string[]
  useCache?: boolean
  cacheDir?: string
}

export interface ScanFileResult {
  file: string
  classes: string[]
}

export interface ScanWorkspaceResult {
  files: ScanFileResult[]
  totalFiles: number
  uniqueClasses: string[]
}

export const DEFAULT_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]
export const DEFAULT_IGNORES = ["node_modules", ".git", ".next", "dist", "out", ".turbo", ".cache"]

export function scanSource(source: string): string[] {
  const baseClasses = extractAllClasses(source)
  let jsxClasses: string[] = []
  try {
    jsxClasses = parseJsxLikeClasses(source)
  } catch {
    jsxClasses = []
  }

  return Array.from(new Set([...baseClasses, ...jsxClasses]))
}

export function isScannableFile(filePath: string, includeExtensions = DEFAULT_EXTENSIONS): boolean {
  return includeExtensions.includes(path.extname(filePath))
}

export function scanFile(filePath: string): ScanFileResult {
  const source = fs.readFileSync(filePath, "utf8")
  return {
    file: filePath,
    classes: scanSource(source),
  }
}

export function scanWorkspace(
  rootDir: string,
  options: ScanWorkspaceOptions = {}
): ScanWorkspaceResult {
  const includeExtensions = options.includeExtensions ?? DEFAULT_EXTENSIONS
  const ignoreDirectories = new Set(options.ignoreDirectories ?? DEFAULT_IGNORES)
  const useCache = options.useCache ?? true

  const files: ScanFileResult[] = []
  const unique = new Set<string>()
  const cache = useCache ? new ScanCache(rootDir, { cacheDir: options.cacheDir }) : null

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (ignoreDirectories.has(entry.name)) continue
        walk(fullPath)
        continue
      }

      if (!isScannableFile(fullPath, includeExtensions)) continue

      const stat = fs.statSync(fullPath)
      let result: ScanFileResult | null = null

      if (cache) {
        const cached = cache.get(fullPath)
        if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
          result = { file: fullPath, classes: cached.classes }
        }
      }

      if (!result) {
        result = scanFile(fullPath)
        if (cache) {
          cache.set(fullPath, {
            mtimeMs: stat.mtimeMs,
            size: stat.size,
            classes: result.classes,
          })
        }
      }

      files.push(result)
      for (const cls of result.classes) unique.add(cls)
    }
  }

  walk(rootDir)
  cache?.save()

  return {
    files,
    totalFiles: files.length,
    uniqueClasses: Array.from(unique).sort(),
  }
}
