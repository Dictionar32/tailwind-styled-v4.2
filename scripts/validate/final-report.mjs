import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

function run(cmd, options = {}) {
  try {
    const out = execSync(cmd, { stdio: "pipe", encoding: "utf8", ...options })
    return { ok: true, output: out.trim() }
  } catch (error) {
    return {
      ok: false,
      output: (error.stdout || "").toString().trim(),
      error: (error.stderr || error.message || "").toString().trim(),
    }
  }
}

const root = process.cwd()
const reportDir = path.join(root, "artifacts")
const reportPath = path.join(reportDir, "validation-report.json")

const checks = {
  coreTest: run("npm run test -w packages/core"),
  buildCompiler: run("npm run build -w packages/compiler"),
  buildScanner: run("npm run build -w packages/scanner"),
  buildEngine: run("npm run build -w packages/engine"),
  buildVite: run("npm run build -w packages/vite"),
  buildCli: run("npm run build -w packages/cli"),
  benchNative: run("npm run bench:native"),
  cliScan: run("node packages/cli/dist/index.js scan packages/core/src --json"),
  cliMigrateDryRun: run("node packages/cli/dist/index.js migrate packages/core/src --dry-run --json"),
}

let bench = null
if (checks.benchNative.ok) {
  const lines = checks.benchNative.output.split("\n")
  const jsonBlock = lines.slice(lines.findIndex((l) => l.trim().startsWith("{"))).join("\n")
  try {
    bench = JSON.parse(jsonBlock)
  } catch {
    bench = null
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  checks: Object.fromEntries(
    Object.entries(checks).map(([k, v]) => [k, { ok: v.ok, outputPreview: v.output.slice(0, 600) }])
  ),
  benchmark: bench,
  summary: {
    passed: Object.values(checks).filter((c) => c.ok).length,
    failed: Object.values(checks).filter((c) => !c.ok).length,
  },
}

fs.mkdirSync(reportDir, { recursive: true })
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n")

console.log(`Validation report written: ${path.relative(root, reportPath)}`)
if (report.summary.failed > 0) {
  console.error(`Validation finished with failures: ${report.summary.failed}`)
  process.exitCode = 1
}
