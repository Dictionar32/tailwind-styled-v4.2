import path from "node:path"

import { scanWorkspace } from "@tailwind-styled/scanner"

export interface ScanCliResult {
  root: string
  totalFiles: number
  uniqueClassCount: number
  topClasses: Array<{ name: string; count: number }>
}

function buildTopClasses(files: Array<{ classes: string[] }>): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>()
  for (const file of files) {
    for (const cls of file.classes) counts.set(cls, (counts.get(cls) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }))
}

export function runScanCli(rawArgs: string[]): void {
  const target = rawArgs.find((a) => !a.startsWith("-")) ?? "."
  const asJson = rawArgs.includes("--json")

  const root = path.resolve(process.cwd(), target)
  const scanned = scanWorkspace(root)

  const result: ScanCliResult = {
    root,
    totalFiles: scanned.totalFiles,
    uniqueClassCount: scanned.uniqueClasses.length,
    topClasses: buildTopClasses(scanned.files),
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  console.log(`\n📦 Scan root       : ${result.root}`)
  console.log(`📄 Total files     : ${result.totalFiles}`)
  console.log(`🎨 Unique classes  : ${result.uniqueClassCount}`)
  console.log("\nTop classes:")
  for (const item of result.topClasses.slice(0, 10)) {
    console.log(`  - ${item.name}: ${item.count}`)
  }
}
