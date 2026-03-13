import fs from "node:fs"
import path from "node:path"

import { extractAllClasses } from "@tailwind-styled/compiler"

export interface ScanWorkspaceOptions {
  includeExtensions?: string[]
  ignoreDirectories?: string[]
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

const DEFAULT_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]
const DEFAULT_IGNORES = ["node_modules", ".git", ".next", "dist", "out", ".turbo"]

export function scanSource(source: string): string[] {
  return extractAllClasses(source)
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
  const includeExtensions = new Set(options.includeExtensions ?? DEFAULT_EXTENSIONS)
  const ignoreDirectories = new Set(options.ignoreDirectories ?? DEFAULT_IGNORES)

  const files: ScanFileResult[] = []
  const unique = new Set<string>()

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (ignoreDirectories.has(entry.name)) continue
        walk(fullPath)
        continue
      }

      if (!includeExtensions.has(path.extname(entry.name))) continue
      const result = scanFile(fullPath)
      files.push(result)
      for (const cls of result.classes) unique.add(cls)
    }
  }

  walk(rootDir)

  return {
    files,
    totalFiles: files.length,
    uniqueClasses: Array.from(unique).sort(),
  }
}
