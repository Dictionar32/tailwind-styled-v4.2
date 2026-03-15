#!/usr/bin/env node
const input = process.argv.slice(2).join(' ').trim()
if (!input) {
  console.error('Usage: node scripts/v45/ai.mjs "describe component"')
  process.exit(1)
}

const safeName = input
  .replace(/[^a-zA-Z0-9 ]/g, ' ')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
  .join('') || 'Generated'

const componentName = `${safeName}Component`

const out = `import { tw } from "tailwind-styled-v4"

const ${componentName} = tw.button({
  base: "px-4 py-2 rounded-lg font-medium transition-colors",
  variants: {
    intent: {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      ghost: "bg-transparent border border-zinc-300 hover:bg-zinc-100",
    },
  },
  defaultVariants: { intent: "primary" },
})

export default ${componentName}
`

console.log(out)
