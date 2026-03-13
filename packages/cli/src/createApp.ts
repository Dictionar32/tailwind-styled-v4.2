#!/usr/bin/env node

/**
 * tailwind-styled-v4 — CLI Generator
 *
 * npx create-tailwind-styled
 *
 * Membuat project baru dengan:
 * - Next.js (App Router)
 * - React 19
 * - Tailwind CSS v4
 * - tailwind-styled-v4 v2
 * - TypeScript
 */

import fs from "node:fs"
import path from "node:path"

const TEMPLATES = {
  "next-app": createNextApp,
  "vite-app": createViteApp,
}

function prompt(q: string): string {
  process.stdout.write(q)
  const buf = Buffer.alloc(256)
  const n = fs.readSync(0, buf, 0, buf.length, null)
  return buf.slice(0, n).toString().trim()
}

async function main() {
  console.log("\n┌─────────────────────────────────────────────┐")
  console.log("│     tailwind-styled-v4 — Project Generator  │")
  console.log("│     Zero-config. Zero-runtime. RSC-Aware.   │")
  console.log("└─────────────────────────────────────────────┘\n")

  const name = prompt("Project name (my-app): ") || "my-app"
  const template = prompt("Template [next-app/vite-app] (next-app): ") || "next-app"

  if (!TEMPLATES[template as keyof typeof TEMPLATES]) {
    console.error(`Unknown template: ${template}`)
    process.exit(1)
  }

  const projectDir = path.resolve(process.cwd(), name)

  if (fs.existsSync(projectDir)) {
    console.error(`Directory ${name} already exists.`)
    process.exit(1)
  }

  console.log(`\nCreating ${template} in ./${name}...\n`)

  TEMPLATES[template as keyof typeof TEMPLATES](projectDir, name)

  console.log(`
✅ Done! Get started:

  cd ${name}
  npm install
  npm run dev

Zero-config features enabled:
  ✓ tailwind.config.ts  — auto-generated with built-in preset
  ✓ globals.css         — auto-generated with zero setup
  ✓ Safelist            — auto-generated on build
  ✓ RSC-Aware           — auto "use client" only when needed
  ✓ Variant compile     — O(1) lookup table, no runtime engine

Docs: https://github.com/dictionar32/tailwind-styled-v4
`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Next.js template
// ─────────────────────────────────────────────────────────────────────────────

function createNextApp(dir: string, name: string) {
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(path.join(dir, "src/app"), { recursive: true })
  fs.mkdirSync(path.join(dir, "src/components"), { recursive: true })
  fs.mkdirSync(path.join(dir, "public"), { recursive: true })

  // package.json
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev --turbopack",
          build: "next build",
          start: "next start",
        },
        dependencies: {
          next: "^15",
          react: "^19",
          "react-dom": "^19",
          "tailwind-styled-v4": "^2",
        },
        devDependencies: {
          "@types/node": "^20",
          "@types/react": "^19",
          tailwindcss: "^4",
          typescript: "^5",
        },
      },
      null,
      2
    )
  )

  // next.config.ts
  fs.writeFileSync(
    path.join(dir, "next.config.ts"),
    `import type { NextConfig } from "next"
import { withTailwindStyled } from "tailwind-styled-v4/next"

const nextConfig: NextConfig = {
  // your next config here
}

export default withTailwindStyled()(nextConfig)
`
  )

  // tailwind.config.ts
  fs.writeFileSync(
    path.join(dir, "tailwind.config.ts"),
    `import type { Config } from "tailwindcss"

const safelist = (() => {
  try { return require("./.tailwind-styled-safelist.json") } catch { return [] }
})()

export default {
  content: ["./src/**/*.{tsx,ts,jsx,js}"],
  safelist,
  theme: { extend: {} },
  plugins: [],
} satisfies Config
`
  )

  // tsconfig.json
  fs.writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2017",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./src/*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2
    )
  )

  // src/app/layout.tsx
  fs.writeFileSync(
    path.join(dir, "src/app/layout.tsx"),
    `import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "${name}",
  description: "Built with tailwind-styled-v4",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`
  )

  // src/app/globals.css
  fs.writeFileSync(
    path.join(dir, "src/app/globals.css"),
    `@import "tailwindcss";
`
  )

  // src/app/page.tsx
  fs.writeFileSync(
    path.join(dir, "src/app/page.tsx"),
    `import { tw } from "tailwind-styled-v4"

const Hero = tw.section\`
  min-h-screen flex flex-col items-center justify-center
  bg-zinc-950 text-white
\`

const Title = tw.h1\`
  text-5xl font-bold tracking-tight mb-4
\`

const Subtitle = tw.p\`
  text-zinc-400 text-lg
\`

export default function HomePage() {
  return (
    <Hero>
      <Title>${name}</Title>
      <Subtitle>Built with tailwind-styled-v4</Subtitle>
    </Hero>
  )
}
`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Vite template
// ─────────────────────────────────────────────────────────────────────────────

function createViteApp(dir: string, name: string) {
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(path.join(dir, "src"), { recursive: true })

  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        dependencies: {
          react: "^19",
          "react-dom": "^19",
          "tailwind-styled-v4": "^2",
        },
        devDependencies: {
          "@types/react": "^19",
          "@vitejs/plugin-react": "^4",
          tailwindcss: "^4",
          typescript: "^5",
          vite: "^6",
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

export default defineConfig({
  plugins: [react(), tailwindStyledPlugin()],
})
`
  )

  fs.writeFileSync(
    path.join(dir, "src/App.tsx"),
    `import { tw } from "tailwind-styled-v4"

const Container = tw.div\`min-h-screen bg-zinc-950 text-white flex items-center justify-center\`
const Title = tw.h1\`text-4xl font-bold\`

export default function App() {
  return <Container><Title>${name}</Title></Container>
}
`
  )
}

main().catch(console.error)

export { main }
