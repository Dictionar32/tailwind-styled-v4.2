import path from "node:path"

import {
  type ScanWorkspaceOptions,
  type ScanWorkspaceResult,
  scanFile,
  isScannableFile,
} from "@tailwind-styled/scanner"

const DEFAULT_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]

export function applyIncrementalChange(
  previous: ScanWorkspaceResult,
  filePath: string,
  type: "change" | "unlink",
  scanner?: ScanWorkspaceOptions
): ScanWorkspaceResult {
  const includeExtensions = scanner?.includeExtensions ?? DEFAULT_EXTENSIONS
  if (!isScannableFile(filePath, includeExtensions)) return previous

  const byFile = new Map(previous.files.map((f) => [path.resolve(f.file), f]))
  const normalizedPath = path.resolve(filePath)

  if (type === "unlink") {
    byFile.delete(normalizedPath)
  } else {
    byFile.set(normalizedPath, scanFile(normalizedPath))
  }

  const files = Array.from(byFile.values())
  const unique = new Set<string>()
  for (const file of files) for (const cls of file.classes) unique.add(cls)

  return {
    files,
    totalFiles: files.length,
    uniqueClasses: Array.from(unique).sort(),
  }
}
