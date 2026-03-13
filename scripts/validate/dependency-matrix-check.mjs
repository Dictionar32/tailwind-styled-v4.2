import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const targets = {
  "package.json": {
    devDependencies: {
      "@biomejs/biome": "^2.4.6",
      "@types/node": "^20",
      "@types/react": "^19",
      oxlint: "^1.55.0",
      tsup: "^8",
      typescript: "^5",
    },
  },
  "packages/core/package.json": {
    dependencies: {
      postcss: "^8",
      "tailwind-merge": "^3",
    },
    peerDependencies: {
      react: ">=18",
      "react-dom": ">=18",
    },
    peerDependenciesOptional: {
      "@tailwindcss/postcss": "^4",
      tailwindcss: "^4",
    },
  },
  "packages/cli/package.json": {
    dependencies: {
      "@tailwind-styled/scanner": "*",
    },
  },
  "packages/vite/package.json": {
    dependencies: {
      "@tailwind-styled/compiler": "2.0.0",
      "@tailwind-styled/engine": "*",
      "@tailwind-styled/scanner": "*",
    },
    peerDependencies: {
      vite: ">=5",
    },
  },
  "packages/engine/package.json": {
    dependencies: {
      "@tailwind-styled/compiler": "*",
      "@tailwind-styled/scanner": "*",
    },
  },
  "packages/scanner/package.json": {
    dependencies: {
      "@tailwind-styled/compiler": "*",
    },
  },
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"))
}

const errors = []

for (const [manifestPath, expectations] of Object.entries(targets)) {
  const data = readJson(manifestPath)

  for (const [field, expected] of Object.entries(expectations)) {
    const actual = data[field] ?? {}

    for (const [name, version] of Object.entries(expected)) {
      if (actual[name] !== version) {
        errors.push(`${manifestPath} -> ${field}.${name}: expected \`${version}\`, got \`${actual[name] ?? "<missing>"}\``)
      }
    }
  }
}

if (errors.length > 0) {
  console.error("Dependency matrix check failed:\n")
  for (const err of errors) console.error(`- ${err}`)
  process.exit(1)
}

console.log("Dependency matrix check passed.")
