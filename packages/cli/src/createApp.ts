#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

type TemplateHandler = (projectDir: string, name: string) => void

const TEMPLATES: Record<string, TemplateHandler> = {
  "next-app": createNextApp,
  "vite-react": createViteReactApp,
  "vite-vue": createViteVueApp,
  "vite-svelte": createViteSvelteApp,
  simple: createSimpleApp,
}

function prompt(q: string): string {
  process.stdout.write(q)
  const buf = Buffer.alloc(256)
  const n = fs.readSync(0, buf, 0, buf.length, null)
  return buf.slice(0, n).toString().trim()
}

function parseArgs(argv: string[]) {
  const positional = argv.filter((arg) => !arg.startsWith("-"))
  const name = positional[0]
  const templateArg = argv.find((arg) => arg.startsWith("--template="))
  const template = templateArg?.split("=")[1]
  return { name, template }
}

async function main() {
  const rawArgs = process.argv.slice(2)
  const parsed = parseArgs(rawArgs)

  console.log("\n┌─────────────────────────────────────────────┐")
  console.log("│     tailwind-styled-v4 — Project Generator  │")
  console.log("│     Zero-config. Zero-runtime. RSC-Aware.   │")
  console.log("└─────────────────────────────────────────────┘\n")

  const name = (parsed.name ?? prompt("Project name (my-app): ")) || "my-app"
  const template =
    (parsed.template ??
      prompt("Template [next-app/vite-react/vite-vue/vite-svelte/simple] (next-app): ")) ||
    "next-app"

  const handler = TEMPLATES[template]
  if (!handler) {
    console.error(`Unknown template: ${template}`)
    process.exit(1)
  }

  const projectDir = path.resolve(process.cwd(), name)
  if (fs.existsSync(projectDir)) {
    console.error(`Directory ${name} already exists.`)
    process.exit(1)
  }

  console.log(`\nCreating ${template} in ./${name}...\n`)
  handler(projectDir, name)

  console.log(`
✅ Done! Get started:

  cd ${name}
  npm install
  npm run dev
`)
}

function createNextApp(dir: string, name: string) {
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(path.join(dir, "src/app"), { recursive: true })

  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        scripts: { dev: "next dev --turbopack", build: "next build", start: "next start" },
        dependencies: {
          next: "^15",
          react: "^19",
          "react-dom": "^19",
          "tailwind-styled-v4": "^2",
        },
        devDependencies: {
          tailwindcss: "^4",
          typescript: "^5",
          "@types/react": "^19",
          "@types/node": "^20",
        },
      },
      null,
      2
    )
  )

  fs.writeFileSync(
    path.join(dir, "next.config.ts"),
    `import type { NextConfig } from "next"
import { withTailwindStyled } from "tailwind-styled-v4/next"

const nextConfig: NextConfig = {}
export default withTailwindStyled()(nextConfig)
`
  )

  fs.writeFileSync(path.join(dir, "src/app/globals.css"), `@import "tailwindcss";\n`)
  fs.writeFileSync(
    path.join(dir, "src/app/layout.tsx"),
    `import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
`
  )

  fs.writeFileSync(
    path.join(dir, "src/app/page.tsx"),
    `import { tw } from "tailwind-styled-v4"

const Page = tw.main\`min-h-screen grid place-items-center bg-zinc-950 text-white\`

export default function HomePage() {
  return <Page>${name}</Page>
}
`
  )
}

function createViteReactApp(dir: string, name: string) {
  fs.mkdirSync(path.join(dir, "src"), { recursive: true })
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(
      {
        name,
        private: true,
        type: "module",
        scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        dependencies: { react: "^19", "react-dom": "^19", "tailwind-styled-v4": "^2" },
        devDependencies: {
          vite: "^6",
          "@vitejs/plugin-react": "^4",
          tailwindcss: "^4",
          typescript: "^5",
        },
      },
      null,
      2
    )
  )

  fs.writeFileSync(
    path.join(dir, "vite.config.ts"),
    `import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { tailwindStyledPlugin } from "tailwind-styled-v4/vite"

export default defineConfig({ plugins: [react(), tailwindStyledPlugin()] })
`
  )

  fs.writeFileSync(path.join(dir, "src/main.tsx"), `console.log("${name} - vite react template")\n`)
}

function createViteVueApp(dir: string, name: string) {
  fs.mkdirSync(path.join(dir, "src"), { recursive: true })
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name, private: true, type: "module", scripts: { dev: "vite" } }, null, 2)
  )
  fs.writeFileSync(
    path.join(dir, "src/main.ts"),
    `console.log("${name} - vite vue template placeholder")\n`
  )
}

function createViteSvelteApp(dir: string, name: string) {
  fs.mkdirSync(path.join(dir, "src"), { recursive: true })
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name, private: true, type: "module", scripts: { dev: "vite" } }, null, 2)
  )
  fs.writeFileSync(
    path.join(dir, "src/main.ts"),
    `console.log("${name} - vite svelte template placeholder")\n`
  )
}

function createSimpleApp(dir: string, name: string) {
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name, private: true, scripts: { dev: "node index.js" } }, null, 2)
  )
  fs.writeFileSync(path.join(dir, "index.js"), "console.log('tailwind-styled simple template ready')\n")
}

main().catch(console.error)

export { main }
