import fs from "node:fs"
import path from "node:path"
import { performance } from "node:perf_hooks"

import { analyzeScan } from "../../packages/analyzer/dist/index.js"
import { createEngine } from "../../packages/engine/dist/index.js"
import { scanWorkspace } from "../../packages/scanner/dist/index.js"

const args = new Map(
  process.argv.slice(2).map((entry) => {
    const [key, value] = entry.replace(/^--/, "").split("=")
    return [key, value ?? "true"]
  })
)

const root = path.resolve(args.get("root") ?? "test/fixtures/massive")
const topN = Number(args.get("topN") ?? 10)
const outFile = args.get("out")

const scanStart = performance.now()
const scan = scanWorkspace(root)
const scanTime = performance.now() - scanStart

const analyzeStart = performance.now()
const report = analyzeScan(scan, root, topN)
const analyzeTime = performance.now() - analyzeStart

const engine = await createEngine({
  root,
  compileCss: false,
})

const buildStart = performance.now()
await engine.build()
const buildTime = performance.now() - buildStart

const memory = process.memoryUsage()

const output = {
  root,
  files: scan.totalFiles,
  uniqueClasses: report.uniqueClassCount,
  timingsMs: {
    scan: Math.round(scanTime),
    analyze: Math.round(analyzeTime),
    engineBuildNoCss: Math.round(buildTime),
  },
  memoryMb: {
    rss: Math.round(memory.rss / 1024 / 1024),
    heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
  },
  generatedAt: new Date().toISOString(),
}

if (outFile) {
  const resolvedOut = path.resolve(outFile)
  fs.mkdirSync(path.dirname(resolvedOut), { recursive: true })
  fs.writeFileSync(resolvedOut, `${JSON.stringify(output, null, 2)}\n`)
}

console.log(JSON.stringify(output, null, 2))
