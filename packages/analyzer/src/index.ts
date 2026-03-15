import type { ScanWorkspaceOptions, ScanWorkspaceResult } from "@tailwind-styled/scanner"
import { scanWorkspace } from "@tailwind-styled/scanner"

export interface TopClass {
  name: string
  count: number
}

export interface AnalyzerReport {
  root: string
  totalFiles: number
  uniqueClassCount: number
  totalClassOccurrences: number
  topClasses: TopClass[]
  duplicateClassCandidates: Array<{ name: string; count: number }>
}

export interface AnalyzerOptions {
  scanner?: ScanWorkspaceOptions
  topN?: number
}

function collectClassCounts(scan: ScanWorkspaceResult): Map<string, number> {
  const counts = new Map<string, number>()
  for (const file of scan.files) {
    for (const cls of file.classes) {
      counts.set(cls, (counts.get(cls) ?? 0) + 1)
    }
  }
  return counts
}

function topFromCounts(counts: Map<string, number>, limit: number): TopClass[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

export function analyzeScan(scan: ScanWorkspaceResult, root: string, topN = 10): AnalyzerReport {
  const counts = collectClassCounts(scan)
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])

  return {
    root,
    totalFiles: scan.totalFiles,
    uniqueClassCount: scan.uniqueClasses.length,
    totalClassOccurrences: scan.files.reduce((acc, file) => acc + file.classes.length, 0),
    topClasses: topFromCounts(counts, topN),
    duplicateClassCandidates: sorted
      .filter(([, count]) => count > 1)
      .slice(0, topN)
      .map(([name, count]) => ({ name, count })),
  }
}

export function analyzeWorkspace(root: string, options: AnalyzerOptions = {}): AnalyzerReport {
  const scan = scanWorkspace(root, options.scanner)
  return analyzeScan(scan, root, options.topN ?? 10)
}
