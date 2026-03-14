import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const artifactPath = path.join(root, "artifacts", "pr5-gap-check.json")

<<<<<<< ours
function hasContent(filePath, needle) {
  if (!fs.existsSync(filePath)) return false
  const content = fs.readFileSync(filePath, "utf8")
  return content.includes(needle)
=======
function read(filePath) {
  return fs.readFileSync(filePath, "utf8")
}

function hasContent(filePath, needle) {
  if (!fs.existsSync(filePath)) return false
  return read(filePath).includes(needle)
}

function hasAll(filePath, needles) {
  if (!fs.existsSync(filePath)) return false
  const content = read(filePath)
  return needles.every((needle) => content.includes(needle))
>>>>>>> theirs
}

const checks = [
  {
    id: "scanner-ast-parser",
    priority: "high",
    label: "AST parser for JSX/TSX scanner",
    path: "packages/scanner/src/ast-parser.ts",
    quality: (p) => hasContent(p, "typescript") && hasContent(p, "createSourceFile"),
  },
  {
    id: "scanner-template-handler",
    priority: "high",
    label: "Template literal handler for scanner",
    path: "packages/scanner/src/template-handler.ts",
    quality: (p) => hasContent(p, "splitClassTokens"),
  },
  {
    id: "benchmark-script",
    priority: "high",
    label: "Incremental benchmark script",
    path: "scripts/benchmark/incremental.js",
    quality: (p) => hasContent(p, "BENCH_MAX_FULL_SCAN_MS") && hasContent(p, "OUTPUT_FILE"),
  },
  {
    id: "benchmark-ci",
    priority: "high",
    label: "Benchmark CI workflow",
    path: ".github/workflows/benchmark.yml",
    quality: (p) => hasContent(p, "upload-artifact") && hasContent(p, "BENCH_MAX_FULL_SCAN_MS"),
  },
  {
    id: "large-fixture",
    priority: "high",
    label: "Large project fixture folder",
    path: "test/fixtures/large-project/generated",
    quality: (p) => fs.existsSync(p) && fs.readdirSync(p).length > 0,
  },
  {
    id: "docs-api-core",
    priority: "medium",
    label: "API docs: core",
    path: "docs/api/core.md",
    quality: (p) => hasContent(p, "## `tw`") && hasContent(p, "## `styled`"),
  },
  {
    id: "docs-api-scanner",
    priority: "medium",
    label: "API docs: scanner",
    path: "docs/api/scanner.md",
<<<<<<< ours
    quality: (p) => hasContent(p, "scanWorkspace"),
=======
    quality: (p) => hasAll(p, ["scanSource", "scanFile", "scanWorkspace", "useCache"]),
>>>>>>> theirs
  },
  {
    id: "docs-api-engine",
    priority: "medium",
    label: "API docs: engine",
    path: "docs/api/engine.md",
    quality: (p) => hasAll(p, ["createEngine", "engine.build", "engine.watch", "close"]),
  },
  {
    id: "docs-api-cli",
    priority: "medium",
    label: "API docs: cli",
    path: "docs/api/cli.md",
<<<<<<< ours
    quality: (p) => hasContent(p, "tailwind-styled"),
=======
    quality: (p) => hasAll(p, ["tailwind-styled init", "tailwind-styled scan", "tailwind-styled watch", "tailwind-styled doctor"]),
>>>>>>> theirs
  },
  {
    id: "docs-api-vite",
    priority: "medium",
    label: "API docs: vite",
    path: "docs/api/vite.md",
<<<<<<< ours
    quality: (p) => hasContent(p, "tailwindStyledVitePlugin"),
=======
    quality: (p) => hasAll(p, ["tailwindStyledVitePlugin", "include", "exclude", "cacheDir"]),
>>>>>>> theirs
  },
  {
    id: "example-nextjs",
    priority: "high",
    label: "Example project: nextjs",
    path: "examples/nextjs/package.json",
<<<<<<< ours
    quality: (p) => hasContent(p, "next dev") && fs.existsSync(path.join(root, "examples/nextjs/app/page.tsx")),
=======
    quality: () =>
      hasContent(path.join(root, "examples/nextjs/package.json"), "next dev") &&
      hasContent(path.join(root, "examples/nextjs/app/page.tsx"), "<Card") &&
      hasContent(path.join(root, "examples/nextjs/components/card.tsx"), "styled"),
>>>>>>> theirs
  },
  {
    id: "example-vite",
    priority: "high",
    label: "Example project: vite",
    path: "examples/vite/package.json",
<<<<<<< ours
    quality: (p) => hasContent(p, "vite") && fs.existsSync(path.join(root, "examples/vite/index.html")),
=======
    quality: () =>
      hasContent(path.join(root, "examples/vite/package.json"), "@vitejs/plugin-react") &&
      hasContent(path.join(root, "examples/vite/src/App.tsx"), "styled") &&
      hasContent(path.join(root, "examples/vite/src/App.tsx"), "liveToken") &&
      hasContent(path.join(root, "examples/vite/src/main.tsx"), "createRoot"),
>>>>>>> theirs
  },
  {
    id: "example-rspack",
    priority: "high",
    label: "Example project: rspack",
    path: "examples/rspack/package.json",
<<<<<<< ours
    quality: (p) => hasContent(p, "rspack") && fs.existsSync(path.join(root, "examples/rspack/src/index.ts")),
=======
    quality: () =>
      hasContent(path.join(root, "examples/rspack/package.json"), "rspack") &&
      hasContent(path.join(root, "examples/rspack/rspack.config.mjs"), "defineConfig") &&
      hasContent(path.join(root, "examples/rspack/src/index.ts"), "styled"),
  },
  {
    id: "example-package-frontend",
    priority: "medium",
    label: "Example package: frontend",
    path: "examples/package-frontend/package.json",
    quality: () =>
      hasContent(path.join(root, "examples/package-frontend/package.json"), "example-package-frontend") &&
      hasContent(path.join(root, "examples/package-frontend/src/index.ts"), "export const") &&
      hasContent(path.join(root, "examples/package-frontend/src/index.ts"), "styled"),
>>>>>>> theirs
  },
  {
    id: "example-simple",
    priority: "medium",
    label: "Example project: simple",
    path: "examples/simple/package.json",
<<<<<<< ours
    quality: (p) => hasContent(p, "src/dev.js") && fs.existsSync(path.join(root, "examples/simple/src/dev.js")),
=======
    quality: () =>
      hasContent(path.join(root, "examples/simple/src/dev.js"), "styled") &&
      hasContent(path.join(root, "examples/simple/src/build.js"), "parseTailwindClasses"),
>>>>>>> theirs
  },
]

const results = checks.map((check) => {
  const fullPath = path.join(root, check.path)
  const exists = fs.existsSync(fullPath)
  const quality = exists ? check.quality(fullPath) : false

  return {
    id: check.id,
    priority: check.priority,
    path: check.path,
    status: !exists ? "missing" : quality ? "present" : "incomplete",
  }
})

const summary = {
  generatedAt: new Date().toISOString(),
  total: results.length,
  missing: results.filter((result) => result.status === "missing").length,
  incomplete: results.filter((result) => result.status === "incomplete").length,
  blocking: results.filter(
    (result) => (result.status === "missing" || result.status === "incomplete") && result.priority === "high",
  ).length,
}

fs.mkdirSync(path.dirname(artifactPath), { recursive: true })
fs.writeFileSync(artifactPath, JSON.stringify({ summary, results }, null, 2) + "\n")

console.log("PR5 gap check")
console.table(results)
console.log(`Missing: ${summary.missing}/${summary.total}`)
console.log(`Incomplete: ${summary.incomplete}/${summary.total}`)
console.log(`Artifact: ${path.relative(root, artifactPath)}`)

if (summary.blocking > 0) {
  process.exitCode = 1
}
