# tailwind-styled-v4

**Zero-config. Zero-runtime. RSC-Aware Tailwind styling for Next.js.**

> 🦀 **Rust-powered internals** — AST parsing via [oxc-parser](https://oxc.rs), linting via [oxlint](https://oxc.rs/docs/guide/usage/linter), formatting via [Biome](https://biomejs.dev). Fully compatible with Next.js, Vite, and Rspack.

[![npm](https://img.shields.io/npm/v/tailwind-styled-v4)](https://npmjs.com/package/tailwind-styled-v4)
[![bundle](https://img.shields.io/badge/runtime-~1.5kb-green)](https://bundlephobia.com/package/tailwind-styled-v4)
[![license](https://img.shields.io/npm/l/tailwind-styled-v4)](LICENSE)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Core API](#core-api)
  - [tw — Template Literal](#tw--template-literal)
  - [tw — Object Config (Variants)](#tw--object-config-variants)
  - [tw — Reactive State Engine](#tw--reactive-state-engine)
  - [tw — Container Query Engine](#tw--container-query-engine)
  - [tw.server — Server-Only Components](#twserver--server-only-components)
  - [tw() — Wrapping Custom Components](#tw--wrapping-custom-components)
  - [.extend() — Component Inheritance](#extend--component-inheritance)
  - [.animate() — Animation DSL](#animate--animation-dsl)
- [Utilities](#utilities)
  - [cv() — Class Variants (headless)](#cv--class-variants-headless)
  - [cx() — Conflict-Aware Merge](#cx--conflict-aware-merge)
  - [cn() — Simple Join](#cn--simple-join)
- [Live Token Engine](#live-token-engine)
- [Multi-Theme Engine](#multi-theme-engine)
- [Design System Factory](#design-system-factory)
- [Plugin System](#plugin-system)
- [Next.js Integration](#nextjs-integration)
- [Vite Integration](#vite-integration)
- [Rspack Integration](#rspack-integration)
- [CLI Tools](#cli-tools)
- [DevTools Overlay](#devtools-overlay)
- [Tailwind v4 Setup](#tailwind-v4-setup)
- [How the Compiler Works](#how-the-compiler-works)
- [Monorepo Package Overview](#monorepo-package-overview)
- [Migration from v1](#migration-from-v1)
- [Changelog](#changelog)

---

## Quick Start

```bash
npm install tailwind-styled-v4
```

```ts
// next.config.ts
import type { NextConfig } from "next"
import { withTailwindStyled } from "tailwind-styled-v4/next"

const nextConfig: NextConfig = {
  reactCompiler: true,
}

export default withTailwindStyled()(nextConfig)
```

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "./__tw-safelist.css"; /* Auto-generated — commit to repo */
```

```tsx
// src/app/page.tsx — Server Component by default
import { tw } from "tailwind-styled-v4"

const Hero = tw.section`
  min-h-screen flex flex-col items-center justify-center
  bg-zinc-950 text-white
`

const Button = tw.button({
  base: "px-4 py-2 rounded-lg font-medium transition-colors",
  variants: {
    variant: {
      primary: "bg-blue-500 text-white hover:bg-blue-600",
      ghost:   "border border-zinc-700 hover:bg-zinc-800",
      danger:  "bg-red-500 text-white hover:bg-red-600",
    },
    size: {
      sm: "h-8 text-sm px-3",
      md: "h-10 text-base px-4",
      lg: "h-12 text-lg px-6",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
})

export default function Page() {
  return (
    <Hero>
      <h1 className="text-4xl font-bold mb-8">Hello</h1>
      <Button variant="primary" size="lg">Get Started</Button>
      <Button variant="ghost" size="md">Learn More</Button>
    </Hero>
  )
}
```

That's it. No `tailwind.config.ts`. No extra PostCSS plugins. No class resolver at runtime.

---

## Installation

```bash
npm install tailwind-styled-v4
```

### Peer dependencies

```bash
npm install tailwindcss @tailwindcss/postcss react react-dom
```

### Minimum versions

| Package       | Version |
|---------------|---------|
| Node.js       | ≥ 18    |
| React         | ≥ 18    |
| Next.js       | ≥ 14    |
| Tailwind CSS  | ≥ 4.0   |
| TypeScript    | ≥ 5.0   |

---

## Core API

### tw — Template Literal

The simplest usage — tag a Tailwind class string directly onto an HTML element.

```tsx
import { tw } from "tailwind-styled-v4"

const Card = tw.div`
  bg-white dark:bg-zinc-900
  rounded-xl border border-zinc-200 dark:border-zinc-800
  p-6 shadow-sm
`

const Title = tw.h2`text-xl font-semibold text-zinc-900 dark:text-zinc-100`
const Body  = tw.p`text-zinc-600 dark:text-zinc-400 leading-relaxed`

export function ArticleCard() {
  return (
    <Card>
      <Title>Article title</Title>
      <Body>Article body content goes here.</Body>
    </Card>
  )
}
```

All HTML elements are available as properties on `tw`:

```ts
tw.div     tw.section  tw.article  tw.aside   tw.header  tw.footer
tw.main    tw.nav      tw.h1-h6    tw.p       tw.span    tw.a
tw.button  tw.input    tw.form     tw.select  tw.label   tw.img
tw.ul      tw.ol       tw.li       tw.table   tw.svg     // ...and more
```

#### Passing extra className

All `tw` components accept a `className` prop — it is merged conflict-free via `tailwind-merge`:

```tsx
const Box = tw.div`p-4 bg-zinc-100`

// className is merged — conflict resolved: p-8 wins over p-4
<Box className="p-8 text-red-500" />
// → "p-8 bg-zinc-100 text-red-500"
```

#### Forwarding refs

All components are `forwardRef`-compatible out of the box:

```tsx
const Input = tw.input`
  w-full h-10 px-3 rounded-lg border border-zinc-300
  focus:outline-none focus:ring-2 focus:ring-blue-500
`

const inputRef = useRef<HTMLInputElement>(null)
<Input ref={inputRef} placeholder="Type here..." />
```

---

### tw — Object Config (Variants)

For components with multiple visual states, use the object config form with `variants`:

```tsx
const Button = tw.button({
  base: "inline-flex items-center justify-center font-medium transition-all rounded-lg",

  variants: {
    variant: {
      primary:   "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700",
      secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
      ghost:     "text-zinc-700 hover:bg-zinc-100",
      danger:    "bg-red-500 text-white hover:bg-red-600",
      outline:   "border border-zinc-300 text-zinc-700 hover:border-zinc-500",
    },
    size: {
      xs: "h-7 px-2 text-xs",
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-base",
      lg: "h-12 px-6 text-lg",
      xl: "h-14 px-8 text-xl",
    },
    fullWidth: {
      true: "w-full",
    },
    loading: {
      true: "opacity-70 cursor-not-allowed",
    },
  },

  compoundVariants: [
    // When variant=danger AND size=lg, add extra letter-spacing
    { variant: "danger", size: "lg", class: "tracking-wide" },
  ],

  defaultVariants: {
    variant: "primary",
    size: "md",
  },
})
```

TypeScript variant types are fully inferred — passing an invalid variant value is a compile error:

```tsx
<Button variant="primary" size="lg" />      // ✅
<Button variant="ghost" fullWidth={true} />  // ✅
<Button variant="invalid" />                // ❌ TypeScript error
<Button size="xxl" />                       // ❌ TypeScript error
```

#### compoundVariants

Apply extra classes only when a specific combination of variants is active:

```tsx
const Badge = tw.span({
  base: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
  variants: {
    color: {
      blue:  "bg-blue-100 text-blue-800",
      green: "bg-green-100 text-green-800",
      red:   "bg-red-100 text-red-800",
    },
    outline: {
      true: "bg-transparent border",
    },
  },
  compoundVariants: [
    { color: "blue",  outline: true, class: "border-blue-400 text-blue-700" },
    { color: "green", outline: true, class: "border-green-400 text-green-700" },
    { color: "red",   outline: true, class: "border-red-400 text-red-700" },
  ],
})
```

---

### tw — Reactive State Engine

Apply styles based on data attributes — with **zero JavaScript re-renders**. The state engine generates CSS selectors that respond to `data-*` attributes directly in the DOM.

```tsx
const StateButton = tw.button({
  base: "px-4 py-2 rounded-lg font-medium transition-all border",
  state: {
    active:   "bg-blue-500 text-white border-blue-500",
    loading:  "opacity-60 cursor-wait",
    disabled: "opacity-40 cursor-not-allowed pointer-events-none",
    error:    "border-red-500 text-red-600 bg-red-50",
    success:  "border-green-500 text-green-600 bg-green-50",
  },
})
```

The compiler generates CSS like this at build time — zero runtime overhead:

```css
.tw-s-abc123[data-active="true"]   { background-color: rgb(59 130 246); color: white; border-color: rgb(59 130 246); }
.tw-s-abc123[data-loading="true"]  { opacity: 0.6; cursor: wait; }
.tw-s-abc123[data-disabled="true"] { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
```

**Usage in JSX:**

```tsx
"use client"
import { useState } from "react"

export function ToggleButton() {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <StateButton
      data-active={active ? "true" : undefined}
      data-loading={loading ? "true" : undefined}
      onClick={() => setActive(!active)}
    >
      {active ? "Active" : "Inactive"}
    </StateButton>
  )
}
```

> **Why this matters:** Toggling `data-active` does not trigger a React re-render. CSS handles the style switch — no `useState` for styles, no `clsx`, no conditional `className` logic needed.

#### Combining state + variants

```tsx
const Input = tw.input({
  base: "w-full h-10 px-3 rounded-lg border transition-colors",
  variants: {
    size: {
      sm: "h-8 text-sm",
      lg: "h-12 text-lg",
    },
  },
  state: {
    focused: "border-blue-500 ring-2 ring-blue-200",
    error:   "border-red-500 ring-2 ring-red-200",
    valid:   "border-green-500",
  },
  defaultVariants: { size: "sm" },
})

// Usage
<Input
  size="lg"
  data-error={hasError ? "true" : undefined}
  data-valid={isValid ? "true" : undefined}
/>
```

---

### tw — Container Query Engine

Apply styles based on the component's own container width — not the viewport. Built on the CSS `@container` spec.

```tsx
const Card = tw.div({
  base: "p-4 bg-white rounded-xl transition-all",
  container: {
    // These breakpoints map to @container (min-width: ...)
    sm: "flex-col text-sm",          // ≥ 320px
    md: "flex-row gap-4 text-base",  // ≥ 640px
    lg: "grid-cols-2 gap-6",         // ≥ 1024px
  },
  containerName: "card",
})

// Wrap with @container context:
const CardWrapper = tw.div`@container border rounded-xl overflow-hidden`

// Resize CardWrapper width to see breakpoints activate:
<CardWrapper style={{ width: "400px" }}>
  <Card>
    <div>Content A</div>
    <div>Content B</div>
  </Card>
</CardWrapper>
```

Available container breakpoints:

| Key   | min-width |
|-------|-----------|
| `xs`  | 240px     |
| `sm`  | 320px     |
| `md`  | 640px     |
| `lg`  | 1024px    |
| `xl`  | 1280px    |
| `2xl` | 1536px    |

#### Custom breakpoints

Pass an object instead of a string for full control:

```tsx
const Sidebar = tw.div({
  base: "p-4",
  container: {
    narrow: { minWidth: "200px", maxWidth: "400px", classes: "flex-col text-xs" },
    wide:   { minWidth: "401px", classes: "flex-row text-sm" },
  },
  containerName: "sidebar",
})
```

---

### tw.server — Server-Only Components

Components under `tw.server` are guaranteed to be Server Components. The compiler enforces this at build time — any server component rendered inside a client boundary triggers a dev warning.

```tsx
// These components will never appear in the client JS bundle
const HeroSection = tw.server.section`
  min-h-[60vh] flex flex-col items-center justify-center
  bg-gradient-to-b from-zinc-950 to-zinc-900
`

const ServerCard = tw.server.article`
  bg-white rounded-2xl shadow-md p-8 border border-zinc-100
`
```

All standard HTML tags are available under `tw.server.*`.

---

### tw() — Wrapping Custom Components

Wrap any React component — including Next.js `Link`, `Image`, Radix primitives, or your own components:

```tsx
import Link from "next/link"
import Image from "next/image"
import * as Dialog from "@radix-ui/react-dialog"

const NavLink = tw(Link)`
  text-sm font-medium text-zinc-500 hover:text-zinc-900
  transition-colors underline-offset-4 hover:underline
`

const CoverImage = tw(Image)`
  object-cover rounded-xl w-full aspect-video
`

const DialogOverlay = tw(Dialog.Overlay)`
  fixed inset-0 bg-black/60 backdrop-blur-sm
  data-[state=open]:animate-in data-[state=closed]:animate-out
`
```

Object config with variants also works on wrapped components:

```tsx
const PrimaryAction = tw(Link)({
  base: "inline-flex items-center gap-2 font-semibold rounded-xl",
  variants: {
    color: {
      blue: "text-blue-600 hover:text-blue-700",
      zinc: "text-zinc-800 hover:text-zinc-900",
    },
    underline: {
      always: "underline",
      hover:  "hover:underline",
      none:   "no-underline",
    },
  },
  defaultVariants: { color: "blue", underline: "hover" },
})
```

---

### .extend() — Component Inheritance

Add classes on top of an existing component without redefining it:

```tsx
const Card = tw.div`
  bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 p-6
`

// HeroCard inherits all Card styles + adds its own
const HeroCard = Card.extend`
  shadow-2xl ring-1 ring-zinc-900/10
  bg-gradient-to-br from-white to-zinc-50
`

// FeatureCard inherits Card but overrides background (tailwind-merge resolves conflicts)
const FeatureCard = Card.extend`
  bg-blue-50 dark:bg-blue-950 border-blue-200
`
```

#### Extending with additional variants

```tsx
const Button = tw.button({
  base: "px-4 py-2 rounded-lg font-medium",
  variants: {
    variant: { primary: "bg-blue-500 text-white" },
  },
})

// Add icon position support on top of Button
const IconButton = Button.withVariants({
  variants: {
    iconPosition: {
      left:  "flex-row-reverse",
      right: "flex-row",
    },
  },
})
```

---

### .animate() — Animation DSL

Define enter/exit animations directly on any component. The compiler generates `@keyframes` at build time — zero JS runtime, zero animation libraries needed.

```tsx
import { tw } from "tailwind-styled-v4"

const FadeIn = tw.div({
  base: "p-4 bg-white rounded-xl",
}).animate({
  from: "opacity-0 translate-y-2",
  to:   "opacity-100 translate-y-0",
  duration: 300,
  easing:   "ease-out",
})

const SlideIn = tw.section`min-h-screen p-8`.animate({
  from:      "opacity-0 translate-x-8",
  to:        "opacity-100 translate-x-0",
  duration:  400,
  delay:     100,
  easing:    "cubic-bezier(0.16, 1, 0.3, 1)",
})
```

#### AnimateOptions

| Option       | Type                                          | Default      | Description                         |
|--------------|-----------------------------------------------|--------------|-------------------------------------|
| `from`       | `string`                                      | required     | Tailwind classes for start state    |
| `to`         | `string`                                      | required     | Tailwind classes for end state      |
| `duration`   | `number`                                      | `300`        | Duration in milliseconds            |
| `easing`     | `string`                                      | `"ease-out"` | CSS easing function                 |
| `delay`      | `number`                                      | `0`          | Delay in milliseconds               |
| `fill`       | `"none" \| "forwards" \| "backwards" \| "both"` | `"both"` | CSS animation-fill-mode             |
| `iterations` | `number \| "infinite"`                        | `1`          | Animation repeat count              |
| `direction`  | `"normal" \| "reverse" \| "alternate" \| ...` | `"normal"`   | CSS animation-direction             |
| `name`       | `string`                                      | auto         | Override generated @keyframes name  |

#### Standalone animate()

```tsx
import { animate, animations } from "@tailwind-styled/animate"

// Custom animation as a class string
const fadeIn = animate({ from: "opacity-0 scale-95", to: "opacity-100 scale-100" })

const Box = tw.div`p-4 ${fadeIn}`

// Preset animations (no configuration needed)
const Card = tw.div`p-4 ${animations.fadeIn} ${animations.slideUp}`
```

#### tw.keyframes()

```tsx
const spin = tw.keyframes("spin", {
  "0%":   "rotate-0",
  "100%": "rotate-360",
})

const Spinner = tw.div`
  w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent ${spin}
`
```

---

## Utilities

### cv() — Class Variants (headless)

`cv()` returns a plain function — no React, no component. Works with shadcn/ui, Radix, or any headless library.

```tsx
import { cv } from "tailwind-styled-v4"

const buttonCv = cv({
  base: "inline-flex items-center justify-center font-medium rounded-lg transition-colors",
  variants: {
    variant: {
      default:     "bg-zinc-900 text-white hover:bg-zinc-800",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      outline:     "border border-zinc-200 bg-white hover:bg-zinc-100",
      secondary:   "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
      ghost:       "hover:bg-zinc-100 hover:text-zinc-900",
      link:        "text-zinc-900 underline-offset-4 hover:underline",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm:      "h-9 rounded-md px-3",
      lg:      "h-11 rounded-md px-8",
      icon:    "h-10 w-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

// Usage with any element
function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={buttonCv({ variant, size, className })} {...props} />
}
```

`cv()` types are fully inferred — invalid variant values are TypeScript errors:

```ts
buttonCv({ variant: "outline", size: "lg" })  // ✅ → string
buttonCv({ variant: "invalid" })              // ❌ TypeScript error
```

---

### cx() — Conflict-Aware Merge

`cx()` merges Tailwind classes using [tailwind-merge](https://github.com/dcastil/tailwind-merge). Conflicting utilities are resolved — last one wins.

```tsx
import { cx } from "tailwind-styled-v4"

// Conflict resolution
cx("p-4 p-8")                     // → "p-8"
cx("bg-red-500", "bg-blue-500")   // → "bg-blue-500"
cx("text-sm font-bold", "text-lg") // → "text-lg font-bold"

// Falsy values are ignored
cx("base-class", isActive && "active-class", undefined, null, false)

// Dynamic component pattern
function Card({ className, ...props }) {
  return <div className={cx("bg-white rounded-xl p-6", className)} {...props} />
}
```

---

### cn() — Simple Join

`cn()` concatenates class strings without conflict resolution. Use when you know there are no conflicting Tailwind utilities.

```tsx
import { cn } from "tailwind-styled-v4"

cn("flex items-center", "gap-4 p-4")   // → "flex items-center gap-4 p-4"
cn("font-bold", isLarge && "text-xl")  // → "font-bold text-xl" (or "font-bold")
cn(undefined, null, false, "valid")    // → "valid"
```

> **Rule of thumb:** Use `cx()` by default. Use `cn()` only when you're certain there are no class conflicts and want to avoid the tailwind-merge overhead.

---

## Live Token Engine

Runtime design token management via CSS custom properties. Token updates propagate **instantly** — no rebuild, no re-render, pure CSSOM.

```tsx
import { liveToken, setToken, setTokens, subscribeTokens, tokenVar } from "tailwind-styled-v4"
```

### Defining tokens

```tsx
// tokens.ts
export const theme = liveToken({
  primary:      "#3b82f6",
  secondary:    "#6366f1",
  accent:       "#f59e0b",
  surface:      "#18181b",
  border:       "#27272a",
  "text-base":  "#e4e4e7",
  "text-muted": "#71717a",
})
```

Tokens are injected as CSS custom properties on first call:

```css
:root {
  --tw-token-primary: #3b82f6;
  --tw-token-secondary: #6366f1;
  --tw-token-accent: #f59e0b;
  --tw-token-surface: #18181b;
  --tw-token-border: #27272a;
  --tw-token-text-base: #e4e4e7;
  --tw-token-text-muted: #71717a;
}
```

### Using tokens in components

Reference tokens with Tailwind's arbitrary value syntax:

```tsx
const Button = tw.button`
  bg-(--tw-token-primary)
  text-(--tw-token-text-base)
  hover:opacity-90
  px-4 py-2 rounded-lg font-medium
`

const Card = tw.div`
  bg-(--tw-token-surface)
  border border-(--tw-token-border)
  rounded-xl p-6
`
```

### Updating tokens at runtime

```tsx
"use client"
import { setToken, setTokens } from "tailwind-styled-v4"

// Single token — instant update via CSSOM (no re-render)
setToken("primary", "#ef4444")

// Multiple tokens — batched into one CSSOM write
setTokens({
  primary:   "#ef4444",
  secondary: "#ec4899",
  accent:    "#f97316",
})
```

**Theme picker example:**

```tsx
"use client"
import { setTokens } from "tailwind-styled-v4"

const themes = {
  ocean:  { primary: "#0ea5e9", secondary: "#6366f1", accent: "#14b8a6" },
  forest: { primary: "#22c55e", secondary: "#84cc16", accent: "#f59e0b" },
  fire:   { primary: "#ef4444", secondary: "#f97316", accent: "#eab308" },
}

export function ThemePicker() {
  return (
    <div className="flex gap-2">
      {Object.entries(themes).map(([name, tokens]) => (
        <button
          key={name}
          className="px-3 py-1 rounded capitalize"
          onClick={() => setTokens(tokens)}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
```

### Subscribing to token changes

```tsx
import { subscribeTokens } from "tailwind-styled-v4"

const unsub = subscribeTokens((tokens) => {
  console.log("Theme changed:", tokens)
  localStorage.setItem("user-theme", JSON.stringify(tokens))
})

// Later — cleanup
unsub()
```

### Token reference API

| Function          | Returns                     | Description                              |
|-------------------|-----------------------------|------------------------------------------|
| `tokenVar(name)`  | `"var(--tw-token-{name})"`  | CSS variable reference string            |
| `getToken(name)`  | `string \| undefined`       | Current value of a single token          |
| `getTokens()`     | `Record<string, string>`    | Snapshot of all current token values     |
| `applyTokenSet(t)`| `void`                      | Replace all tokens at once               |

### useTokens hook (React)

```tsx
import { createUseTokens } from "tailwind-styled-v4"

const useTokens = createUseTokens()

function ThemedText() {
  const tokens = useTokens()
  return <p style={{ color: tokens.primary }}>Dynamic color from token</p>
}
```

### LiveTokenSet interface

The object returned by `liveToken()`:

```ts
interface LiveTokenSet {
  vars:      Record<string, string>   // token name → CSS var name
  get(name): string | undefined       // get current value
  set(name, value): void              // update single token
  setAll(tokens): void                // update multiple tokens
  snapshot(): Record<string, string>  // current values snapshot
}
```

---

## Multi-Theme Engine

Enterprise-grade typed theming via `@tailwind-styled/theme`. Supports multiple named themes, TypeScript contract enforcement, and CSS variable output. Zero runtime overhead — themes are resolved via CSS data attributes.

```tsx
import {
  defineThemeContract,
  createTheme,
} from "@tailwind-styled/theme"
```

### 1. Define a theme contract

The contract is the single source of truth for all theme tokens. All themes must satisfy it — missing tokens are TypeScript errors.

```tsx
// theme/contract.ts
import { defineThemeContract } from "@tailwind-styled/theme"

export const contract = defineThemeContract({
  colors: {
    bg:       "",
    bgSubtle: "",
    fg:       "",
    fgMuted:  "",
    primary:  "",
    muted:    "",
    border:   "",
  },
  font: {
    sans: "",
    mono: "",
  },
  radius: {
    sm:   "",
    md:   "",
    lg:   "",
    full: "",
  },
})

// contract._vars gives you typed CSS variable references:
// contract._vars.colors.primary → "var(--colors-primary)"
// contract._vars.font.sans      → "var(--font-sans)"
```

### 2. Create themes

```tsx
// theme/themes.ts
import { createTheme } from "@tailwind-styled/theme"
import { contract } from "./contract"

export const lightTheme = createTheme(contract, "light", {
  colors: {
    bg:       "#ffffff",
    bgSubtle: "#f9fafb",
    fg:       "#09090b",
    fgMuted:  "#71717a",
    primary:  "#3b82f6",
    muted:    "#e4e7ec",
    border:   "#e5e7eb",
  },
  font: {
    sans: "InterVariable, sans-serif",
    mono: "JetBrains Mono, monospace",
  },
  radius: {
    sm:   "0.375rem",
    md:   "0.5rem",
    lg:   "0.75rem",
    full: "9999px",
  },
})

export const darkTheme = createTheme(contract, "dark", {
  colors: {
    bg:       "#09090b",
    bgSubtle: "#18181b",
    fg:       "#fafafa",
    fgMuted:  "#a1a1aa",
    primary:  "#60a5fa",
    muted:    "#27272a",
    border:   "#3f3f46",
  },
  font: {
    sans: "InterVariable, sans-serif",
    mono: "JetBrains Mono, monospace",
  },
  radius: {
    sm:   "0.375rem",
    md:   "0.5rem",
    lg:   "0.75rem",
    full: "9999px",
  },
})
```

### 3. Use theme tokens in components

```tsx
import { contract } from "./theme/contract"

const { _vars: v } = contract

const Card = tw.div`
  bg-[${v.colors.bg}]
  border border-[${v.colors.border}]
  text-[${v.colors.fg}]
  rounded-[${v.radius.lg}]
  p-6
`

const Button = tw.button`
  bg-[${v.colors.primary}]
  text-white font-medium
  rounded-[${v.radius.md}]
  px-4 py-2
`
```

### 4. Apply themes in layout

```tsx
// src/app/layout.tsx
import { lightTheme, darkTheme } from "./theme/themes"

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: lightTheme.css + "\n" + darkTheme.css,
          }}
        />
      </head>
      <body data-theme="light">{children}</body>
    </html>
  )
}
```

```tsx
// Client-side theme switcher
document.documentElement.setAttribute("data-theme", "dark")
```

The generated CSS looks like:

```css
:root, [data-theme="light"] { --colors-bg: #ffffff; --colors-primary: #3b82f6; ... }
[data-theme="dark"]          { --colors-bg: #09090b; --colors-primary: #60a5fa; ... }
```

---

## Design System Factory

`createStyledSystem()` builds a full design system with typed components and shared tokens — ideal for design system packages or shared component libraries used across multiple apps.

```tsx
import { createStyledSystem } from "tailwind-styled-v4"

const ui = createStyledSystem({
  tokens: {
    colors: {
      primary:   "#6366f1",
      secondary: "#f59e0b",
      success:   "#22c55e",
      danger:    "#ef4444",
      muted:     "#71717a",
    },
    radius: {
      sm:   "0.25rem",
      md:   "0.5rem",
      lg:   "0.75rem",
      full: "9999px",
    },
    shadow: {
      sm: "0 1px 2px rgba(0,0,0,0.05)",
      md: "0 4px 6px rgba(0,0,0,0.07)",
      lg: "0 10px 15px rgba(0,0,0,0.10)",
    },
  },
  components: {
    button: {
      base: "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none",
      variants: {
        variant: {
          primary:   "bg-[var(--sys-colors-primary)] text-white hover:opacity-90",
          secondary: "bg-[var(--sys-colors-secondary)] text-white hover:opacity-90",
          ghost:     "bg-transparent hover:bg-zinc-100",
          danger:    "bg-[var(--sys-colors-danger)] text-white hover:opacity-90",
        },
        size: {
          sm: "h-8 px-3 text-sm rounded-[var(--sys-radius-sm)]",
          md: "h-10 px-4 text-base rounded-[var(--sys-radius-md)]",
          lg: "h-12 px-6 text-lg rounded-[var(--sys-radius-lg)]",
        },
      },
      defaultVariants: { variant: "primary", size: "md" },
    },
    card: {
      base: "bg-white rounded-[var(--sys-radius-lg)] shadow-[var(--sys-shadow-md)] p-6",
    },
    input: {
      base: "w-full border border-zinc-300 rounded-[var(--sys-radius-md)] px-3 h-10 focus:outline-none focus:ring-2",
    },
    badge: {
      base: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      variants: {
        color: {
          default: "bg-zinc-100 text-zinc-800",
          primary: "bg-[var(--sys-colors-primary)]/10 text-[var(--sys-colors-primary)]",
          success: "bg-[var(--sys-colors-success)]/10 text-[var(--sys-colors-success)]",
          danger:  "bg-[var(--sys-colors-danger)]/10 text-[var(--sys-colors-danger)]",
        },
      },
      defaultVariants: { color: "default" },
    },
  },
})

// Export components from your design system
export const Button = ui.button()
export const Card   = ui.card()
export const Input  = ui.input()
export const Badge  = ui.badge()

// Token access
ui.token("colors.primary")   // → "var(--sys-colors-primary)"
ui.cssVar("colors.primary")  // → "#6366f1"
```

---

## Plugin System

The plugin system extends `tailwind-styled-v4` with additional CSS, variants, tokens, and build hooks.

### Built-in plugins

```tsx
import {
  pluginAnimation,
  pluginTokens,
  pluginTypography,
} from "tailwind-styled-v4/plugins"

// next.config.ts
export default withTailwindStyled({
  plugins: [
    pluginAnimation(),
    pluginTokens({
      colors: {
        primary:   "#3b82f6",
        secondary: "#6366f1",
        accent:    "#f59e0b",
      },
      fonts: {
        sans: "var(--font-geist-sans)",
        mono: "var(--font-geist-mono)",
      },
    }),
    pluginTypography(),
  ],
})(nextConfig)
```

#### pluginAnimation

Adds preset animation variants and `@keyframes`:

```tsx
pluginAnimation({
  prefix:        "tw-anim", // Class prefix. Default: "tw-anim"
  reducedMotion: true,       // Add motion-safe: / motion-reduce: variants. Default: true
})
```

Available preset utility classes after installing the plugin:

```
animate-fade-in     animate-fade-out
animate-slide-up    animate-slide-down
animate-scale-in    animate-scale-out
animate-spin
```

Variants added: `motion-safe:`, `motion-reduce:`.

#### pluginTokens

Injects design tokens as CSS variables and generates Tailwind utility classes:

```tsx
pluginTokens({
  colors: {
    primary:   "#3b82f6",
    secondary: "#6366f1",
  },
  fonts: {
    sans: "InterVariable, sans-serif",
  },
})
// CSS output:
//   :root { --tw-color-primary: #3b82f6; --tw-color-secondary: #6366f1; --tw-font-sans: ...; }
// Tailwind utilities:
//   .text-primary, .bg-primary, .border-primary, .text-secondary, ...
```

#### pluginTypography

Adds opinionated prose typography classes for long-form content:

```tsx
pluginTypography()

// Usage
const Article = tw.article`prose prose-zinc dark:prose-invert max-w-none`
```

### Writing a custom plugin

```tsx
import type { TwPlugin, TwContext } from "tailwind-styled-v4/plugin"

const myPlugin: TwPlugin = {
  name: "my-plugin",

  setup(ctx: TwContext) {
    // Register a CSS variant
    ctx.addVariant("hocus", (selector) =>
      `${selector}:hover, ${selector}:focus-visible`
    )

    // Inject global base CSS
    ctx.addBase(`
      *, *::before, *::after { box-sizing: border-box; }
      body { -webkit-font-smoothing: antialiased; }
    `)

    // Register a utility
    ctx.addUtility("scrollbar-hide", `
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
    `)

    // Mutate or append generated CSS
    ctx.onGenerateCSS((css) => css + "\n/* my-plugin additions */")

    // Run async logic at production build time
    ctx.onBuild(async () => {
      await generateIconSprite()
    })
  },
}

export default withTailwindStyled({
  plugins: [myPlugin],
})(nextConfig)
```

#### TwContext API

| Method              | Signature                             | Description                               |
|---------------------|---------------------------------------|-------------------------------------------|
| `ctx.addVariant`    | `(name, fn) => void`                  | Register a new CSS variant selector       |
| `ctx.addBase`       | `(css: string) => void`               | Inject CSS into document base             |
| `ctx.addUtility`    | `(name, css: string) => void`         | Register a reusable CSS utility           |
| `ctx.onGenerateCSS` | `(hook: (css) => string) => void`     | Transform or append to generated CSS      |
| `ctx.onBuild`       | `(hook: () => void \| Promise) => void` | Run async logic at production build time |

---

## Next.js Integration

### Required files

**`next.config.ts`**

```ts
import type { NextConfig } from "next"
import { withTailwindStyled } from "tailwind-styled-v4/next"
import { pluginAnimation, pluginTokens, pluginTypography } from "tailwind-styled-v4/plugins"

const nextConfig: NextConfig = {
  reactCompiler: true,
}

export default withTailwindStyled({
  plugins: [
    pluginAnimation(),
    pluginTokens({ colors: { primary: "#3b82f6" } }),
    pluginTypography(),
  ],
})(nextConfig)
```

**`postcss.config.mjs`**

```mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
export default config
```

**`src/app/globals.css`**

```css
@import "tailwindcss";
@import "./__tw-safelist.css";
```

### Full configuration reference

```ts
withTailwindStyled({
  // ── Core ─────────────────────────────────────────────────────────────
  mode:        "zero-runtime",  // "zero-runtime" | "runtime". Default: "zero-runtime" in prod
  scanDirs:    ["src"],         // Dirs to scan for tw() usage. Default: ["src"]

  // ── Safelist ──────────────────────────────────────────────────────────
  safelistOutput: "src/app/__tw-safelist.css",  // Tailwind v4 @source inline CSS output

  // ── RSC / Client Boundary ─────────────────────────────────────────────
  addDataAttr:         true,    // data-tw debug attributes. Default: true in dev
  autoClientBoundary:  true,    // Auto-inject "use client" where needed. Default: true
  hoist:               true,    // Hoist tw() to module scope. Default: true
                                // (auto-disabled when reactCompiler: true)

  // ── CSS features ──────────────────────────────────────────────────────
  atomic:               false,  // Atomic CSS mode. Default: false
  routeCss:             true,   // Per-route CSS bundling. Default: true in prod
  routeCssDir:          ".next/static/css/tw",

  // ── Build optimizations ───────────────────────────────────────────────
  staticVariants:       true,   // Pre-compile all variant combos. Default: true in prod
  deadStyleElimination: true,   // Remove unused CSS at build. Default: true in prod

  // ── v4: Incremental engine ────────────────────────────────────────────
  incremental:        true,     // Only recompile changed files. Default: true
  styleBuckets:       true,     // Deterministic CSS ordering. Default: true
  incrementalVerbose: false,    // Per-file transform logging. Default: false

  // ── Plugins ───────────────────────────────────────────────────────────
  plugins: [pluginAnimation(), pluginTokens({ colors: { primary: "#3b82f6" } })],

  // ── DevTools ──────────────────────────────────────────────────────────
  devtools: true,  // DevTools overlay. Default: true in dev
})(nextConfig)
```

### withTailwindStyled options

| Option               | Type       | Default                     | Description                                     |
|----------------------|------------|-----------------------------|-------------------------------------------------|
| `mode`               | `string`   | `"zero-runtime"` in prod    | Compilation mode                                |
| `scanDirs`           | `string[]` | `["src"]`                   | Source directories to scan for tw() usage       |
| `safelistOutput`     | `string`   | `"src/app/__tw-safelist.css"` | Output path for safelist CSS                  |
| `addDataAttr`        | `boolean`  | `true` in dev               | Add `data-tw` debug attributes                  |
| `autoClientBoundary` | `boolean`  | `true`                      | Auto-inject `"use client"` when JS needed       |
| `hoist`              | `boolean`  | `true`                      | Hoist `tw()` to module scope                    |
| `atomic`             | `boolean`  | `false`                     | Atomic CSS mode                                 |
| `routeCss`           | `boolean`  | `true` in prod              | Per-route CSS bundling                          |
| `routeCssDir`        | `string`   | `".next/static/css/tw"`     | Directory for route CSS output                  |
| `zeroConfig`         | `boolean`  | `true`                      | Auto-bootstrap missing config files             |
| `plugins`            | `TwPlugin[]`| `[]`                       | Plugins array                                   |
| `devtools`           | `boolean`  | `true` in dev               | DevTools overlay                                |
| `staticVariants`     | `boolean`  | `true` in prod              | Pre-compile all variant combos                  |
| `deadStyleElimination`| `boolean` | `true` in prod              | Remove unused CSS                               |
| `incremental`        | `boolean`  | `true`                      | Only recompile changed files                    |
| `styleBuckets`       | `boolean`  | `true`                      | Deterministic CSS ordering                      |
| `incrementalVerbose` | `boolean`  | `false`                     | Per-file transform logging                      |

### Turbopack

`withTailwindStyled` is fully Turbopack-compatible. The loader rules are automatically scoped to your `scanDirs` — not `node_modules` — to avoid the "Missing module type" error.

---

## Vite Integration

```bash
npm install tailwind-styled-v4
npm install --save-dev @vitejs/plugin-react
```

```ts
// vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { tailwindStyledPlugin } from "tailwind-styled-v4/vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindStyledPlugin({
      scanDirs:         ["src"],
      generateSafelist: true,
      safelistOutput:   "src/__tw-safelist.css",
      mode:             "zero-runtime",
      addDataAttr:      true,
      hoist:            true,
    }),
  ],
})
```

### VitePluginOptions

| Option             | Type       | Default                    | Description                                |
|--------------------|------------|----------------------------|--------------------------------------------|
| `include`          | `RegExp`   | `/\.(tsx\|ts\|jsx\|js)$/`  | File pattern to transform                  |
| `exclude`          | `RegExp`   | `/node_modules/`           | File pattern to skip                       |
| `scanDirs`         | `string[]` | `["src"]`                  | Dirs to scan for safelist generation       |
| `safelistOutput`   | `string`   | `"src/__tw-safelist.css"`  | Safelist CSS output path                   |
| `generateSafelist` | `boolean`  | `true`                     | Auto-generate safelist on build            |
| `mode`             | `string`   | `"zero-runtime"`           | Compilation mode                           |
| `addDataAttr`      | `boolean`  | `true` in dev              | Add `data-tw` debug attributes             |
| `hoist`            | `boolean`  | `true`                     | Hoist `tw()` to module scope               |
| `atomic`           | `boolean`  | `false`                    | Atomic CSS mode                            |

---

## Rspack Integration

```ts
// rspack.config.ts
import { tailwindStyledRspackPlugin } from "@tailwind-styled/rspack"

export default defineConfig({
  plugins: [tailwindStyledRspackPlugin()],
})
```

### RspackPluginOptions

| Option        | Type      | Default                      | Description                            |
|---------------|-----------|------------------------------|----------------------------------------|
| `include`     | `RegExp`  | `/\.[jt]sx?$/`               | File pattern to transform              |
| `exclude`     | `RegExp`  | `/node_modules/`             | File pattern to skip                   |
| `routeCss`    | `boolean` | `false`                      | Collect per-route CSS                  |
| `incremental` | `boolean` | `true`                       | Skip unchanged files via hash          |
| `verbose`     | `boolean` | `false`                      | Log per-file transform info            |
| `atomic`      | `boolean` | `false`                      | Atomic CSS mode                        |
| `hoist`       | `boolean` | `true`                       | Auto-hoist `tw()` outside render       |
| `addDataAttr` | `boolean` | `NODE_ENV !== "production"`  | Add `data-tw` debug attributes         |

---

## CLI Tools

```bash
npx tailwind-styled [command] [dir] [options]
```

### analyze — CSS usage report

Scan your project for `tw()` definitions and report duplicate patterns, unused variants, class frequency, and component statistics.

```bash
npx tailwind-styled analyze ./src
npx tailwind-styled analyze ./src --output report.json
npx tailwind-styled analyze ./src --threshold 3   # report patterns used ≥ 3 times
```

Example output:

```
📊 Analysis: 47 components, 318 unique classes

🔁 Duplicate patterns (3 matches):
  "flex items-center gap-2 text-sm"
    → NavItem (src/nav.tsx)
    → MenuItem (src/menu.tsx)
    → BreadcrumbItem (src/breadcrumb.tsx)

⚠️  Unused variants (2 found):
  Button.variant.link  — defined but never used in JSX
  Badge.size.xl        — defined but never used in JSX

🏆 Most-used classes:
  flex (41×)  items-center (38×)  gap-2 (29×)  text-sm (27×)  font-medium (24×)
```

### stats — Bundle size breakdown

Report component count, variant depth, and estimated compiled sizes.

```bash
npx tailwind-styled stats ./src
npx tailwind-styled stats ./src --json
```

Example output:

```
📦 Bundle stats: 47 components

By type:
  Template literal  28 components  ~14kb
  Object config     19 components  ~22kb

By variant depth:
  0 variants    31 components
  1–3 variants  12 components
  4+ variants    4 components

Largest components:
  Button (variants: 5 × 4)  ~3.2kb
  Input  (variants: 3 × 5)  ~2.1kb
```

### extract — Pattern extraction

Detect repeated class patterns and optionally extract them to shared components:

```bash
# Preview only
npx tailwind-styled extract ./src

# Write extracted components to a file
npx tailwind-styled extract ./src --write --output src/ui/extracted.tsx

# Set minimum occurrence threshold
npx tailwind-styled extract ./src --min-count 3
```

### create — Scaffold a new project

```bash
npx create-tailwind-styled my-app
npx create-tailwind-styled my-app --template vite
npx create-tailwind-styled my-app --template next
```

---

## DevTools Overlay

Press **`Ctrl+Shift+D`** in the browser to open the DevTools overlay. Available in development mode only — zero impact on production bundle.

### Enabling

```ts
// next.config.ts
withTailwindStyled({
  devtools: process.env.NODE_ENV !== "production",
})(nextConfig)
```

### Panels

#### Inspector
Hover any `tw()` component to inspect:
- Component name and source file location
- Applied Tailwind classes (base + resolved variants)
- Active data-attribute states
- Container query context

#### State
Live view of all `state:`-enabled components:
- Which `data-*` states are currently active
- Generated CSS class name (e.g. `tw-s-abc123`)
- All possible states and their classes

#### Container
Live view of container query contexts:
- Current container width
- Active breakpoint
- Generated `@container` CSS

#### Tokens
Live token editor:
- View all `liveToken()` values in real-time
- Edit token values inline — changes propagate instantly
- Export current theme as JSON
- Copy CSS variables to clipboard

#### Analyzer
Performance stats for the current page:
- Number of `tw()` components rendered
- Unique Tailwind class count
- CSS injection time (ms)
- Incremental engine cache hit rate

---

## Tailwind v4 Setup

`tailwind-styled-v4` requires **Tailwind CSS v4** — the CSS-first configuration model. If you're coming from v3, here's what changes.

### No tailwind.config.ts

Tailwind v4 does not use a JavaScript config file. All configuration is done in CSS:

```css
/* globals.css */
@import "tailwindcss";

/* Custom tokens via @theme */
@theme {
  --color-brand: #3b82f6;
  --color-brand-muted: #93c5fd;
  --font-display: "CalSans", sans-serif;
  --radius-card: 1rem;
  --shadow-card: 0 4px 24px rgba(0,0,0,0.08);
}

/* Source scanning (not needed in most Next.js setups — handled by the plugin) */
@source "./src/**/*.{tsx,ts,jsx,js}";
```

> **Important:** Do not create a `tailwind.config.ts` with Tailwind v4. If one exists from a v3 migration, delete it — the `UserConfig` type no longer has `safelist` or `content` keys.

### __tw-safelist.css

`tailwind-styled-v4` auto-generates `src/app/__tw-safelist.css` at build time. This file uses Tailwind v4's `@source inline()` directive to ensure all classes used by `tw()` components are included in the CSS output — even if they don't appear in static HTML.

```css
/* src/app/__tw-safelist.css — AUTO-GENERATED BY tailwind-styled-v4. DO NOT EDIT. */
@source inline("bg-blue-500 bg-red-500 font-medium opacity-60 px-4 py-2 rounded-lg text-white ...");
```

**This file is created automatically:**
- On first `npm run build` or `npm run dev`
- Regenerated on every production build
- Commit this file to your repository

```css
/* globals.css */
@import "tailwindcss";
@import "./__tw-safelist.css";  /* ← required */
```

### v3 → v4 config equivalent

| v3 `tailwind.config.ts`            | v4 CSS directive                              |
|------------------------------------|-----------------------------------------------|
| `content: ["./src/**/*.tsx"]`      | `@source "./src/**/*.tsx";`                   |
| `safelist: ["bg-blue-500", ...]`   | `@source inline("bg-blue-500 ...");`          |
| `theme.extend.colors.primary: ...` | `@theme { --color-primary: ...; }`            |
| `theme.extend.fontSize.display`    | `@theme { --text-display: ...; }`             |
| `plugins: [require("@tailwind...")]`| `@plugin "@tailwindcss/...";`                |

---

## How the Compiler Works

At build time, the compiler transforms `tw()` calls into static React components. No runtime class resolution runs on the client.

### Before compilation

```tsx
const Button = tw.button({
  base: "px-4 py-2 rounded-lg font-medium",
  variants: {
    variant: {
      primary: "bg-blue-500 text-white",
      ghost:   "border border-zinc-300",
    },
  },
  defaultVariants: { variant: "primary" },
})
```

### After compilation (zero-runtime mode)

```tsx
// Compiled output — no tw() dependency in client bundle
const Button = React.forwardRef(function Button(
  { variant = "primary", className, ...props },
  ref
) {
  const variantClass =
    variant === "primary" ? "bg-blue-500 text-white" :
    variant === "ghost"   ? "border border-zinc-300" : ""

  return React.createElement("button", {
    ...props,
    ref,
    className: ["px-4 py-2 rounded-lg font-medium", variantClass, className]
      .filter(Boolean).join(" "),
  })
})
```

### Compiler pipeline

```
Source (.tsx / .ts)
    │
    ▼
[oxc-parser] ─── Rust AST parser (10× faster than Babel)
    │
    ▼
[astTransform] ── walk AST, find tw() and cv() calls
    │
    ├── [componentHoister] ─── move tw() outside render functions
    ├── [variantCompiler]  ─── compile variants to O(1) lookup table
    ├── [rscAnalyzer]      ─── detect server vs client context
    ├── [stateEngine]      ─── generate data-attr CSS rules
    ├── [containerQuery]   ─── generate @container CSS rules
    └── [atomicCss]        ─── split into atomic utility classes (optional)
    │
    ▼
[incrementalEngine] ── skip unchanged files via content hash
    │
    ▼
[styleBucketSystem] ── deterministic CSS ordering across all files
    │
    ▼
Output: transformed .js + injected CSS
```

### Why oxc? (Rust AST parser)

| Operation          | Babel (JS)  | oxc (Rust)  | Speedup |
|--------------------|-------------|-------------|---------|
| Parse 100 files    | ~1200ms     | ~120ms      | ~10×    |
| Linting (oxlint)   | ~800ms      | ~10ms       | ~80×    |
| Formatting (Biome) | ~500ms      | ~15ms       | ~35×    |

oxc-parser is loaded as an optional dependency — if unavailable on the current platform, the compiler falls back to the built-in bracket-counting tokenizer automatically.

### Incremental compilation

The incremental engine skips files that haven't changed since the last build. In a large codebase with 500+ components, only the files you touched are recompiled.

Hot reload time in development:
- First build: ~200ms (full scan)
- Subsequent saves: ~5–20ms (incremental)

### Style bucket system

The style bucket system ensures deterministic CSS output ordering across all files, regardless of build parallelism. CSS rules are assigned to buckets by specificity and then emitted in a fixed order — this prevents the "class order race condition" that can occur with concurrent Webpack/Turbopack loaders.

---

## Monorepo Package Overview

| Package                        | Description                                     | Import path                        |
|--------------------------------|-------------------------------------------------|------------------------------------|
| `tailwind-styled-v4`           | Main package — re-exports all public APIs       | `tailwind-styled-v4`               |
| `@tailwind-styled/compiler`    | Build-time AST transformer + CSS generator      | (build tool only, not client)      |
| `@tailwind-styled/next`        | Next.js `withTailwindStyled()` + loaders        | `tailwind-styled-v4/next`          |
| `@tailwind-styled/vite`        | Vite plugin                                     | `tailwind-styled-v4/vite`          |
| `@tailwind-styled/rspack`      | Rspack/Webpack plugin + loader                  | `@tailwind-styled/rspack`          |
| `@tailwind-styled/plugin`      | Plugin system + `TwPlugin` interface            | `tailwind-styled-v4/plugin`        |
| `@tailwind-styled/preset`      | Default design tokens + zero-config preset      | (internal)                         |
| `@tailwind-styled/animate`     | Animation DSL + preset keyframes                | (via `.animate()` on any tw comp.) |
| `@tailwind-styled/theme`       | Multi-theme engine with TypeScript contracts    | `@tailwind-styled/theme`           |
| `@tailwind-styled/devtools`    | DevTools overlay React component                | (auto-injected in dev)             |
| `@tailwind-styled/runtime-css` | CSS injection utilities (batched CSSOM writes)  | (internal)                         |
| `create-tailwind-styled`       | CLI scaffolding tool                            | `npx create-tailwind-styled`       |

---

## Migration from v1

### Breaking changes

#### 1. styled-components removed

v1 was built on `styled-components`. v4 is a compiler — no runtime dependency on styled-components.

```bash
# Remove
npm uninstall styled-components @types/styled-components

# All tw() usage stays the same — only the internals changed
```

#### 2. No runtime class interpolations

v1 supported dynamic class interpolations inside template literals. v4 resolves everything at compile time — use the `state:` config or conditional `className` for dynamic styles instead.

```tsx
// ❌ v1 pattern — not supported in v4
const Box = tw.div`${isLarge ? "p-8" : "p-4"}`

// ✅ v4 pattern A — state engine (zero re-render)
const Box = tw.div({
  base: "p-4",
  state: { large: "p-8" },
})
<Box data-large={isLarge ? "true" : undefined} />

// ✅ v4 pattern B — conditional className (normal React)
const Box = tw.div`p-4`
<Box className={isLarge ? "p-8" : undefined} />

// ✅ v4 pattern C — variants
const Box = tw.div({
  base: "p-4",
  variants: { size: { sm: "p-4", lg: "p-8" } },
})
<Box size={isLarge ? "lg" : "sm"} />
```

#### 3. cx() is now conflict-aware

```tsx
// v1 — cx() was simple join
cx("p-4 p-8")   // → "p-4 p-8" (no conflict resolution)

// v4 — cx() uses tailwind-merge
cx("p-4 p-8")   // → "p-8" (conflict resolved)
cn("p-4", "p-8") // → "p-4 p-8" (simple join — old behavior, now renamed cn)
```

#### 4. No tailwind.config.ts (Tailwind v4)

Tailwind v4 uses CSS directives instead of a JS config file. Delete any existing `tailwind.config.ts` or `tailwind.config.js` — they are not used and will cause TypeScript errors if they contain `safelist` or `content`.

#### 5. Safelist is now a CSS file

The safelist output changed from `.tailwind-styled-safelist.json` to `src/app/__tw-safelist.css`. The JSON file is no longer generated or used.

**Remove from globals.css / tailwind.config.ts:**

```ts
// ❌ Old (v3 JSON safelist pattern — delete this file)
const safelist = require("./.tailwind-styled-safelist.json")
export default { safelist, ... } satisfies Config
```

**Add to globals.css:**

```css
/* ✅ New (Tailwind v4 @source inline) */
@import "tailwindcss";
@import "./__tw-safelist.css";
```

### Step-by-step migration

1. `npm uninstall styled-components @types/styled-components`
2. `npm install tailwind-styled-v4 tailwindcss@^4 @tailwindcss/postcss`
3. Delete `tailwind.config.ts` (if it uses v3 `Config` API)
4. Update `postcss.config.*` — replace `tailwindcss` with `"@tailwindcss/postcss": {}`
5. Update `globals.css`:
   - Replace `@tailwind base/components/utilities` with `@import "tailwindcss"`
   - Add `@import "./__tw-safelist.css"`
6. Wrap `next.config.ts` with `withTailwindStyled()`
7. Replace any dynamic class interpolations with `state:`, `variants:`, or conditional `className`
8. Rename `cx()` calls that relied on simple-join behavior to `cn()`

---

## Changelog

### v4.0.0 (current) — Rust-powered toolchain

**New features:**
- **oxc-parser** — Rust AST parser via napi-rs, replaces Babel in the compiler (~10× parse speedup). Falls back to built-in tokenizer if unavailable.
- **oxlint** — Rust linter replaces ESLint. `npm run lint` now runs in ~10ms vs ~800ms.
- **Biome** — Rust formatter + linter replaces Prettier + ESLint. `npm run format` and `npm run check` unified.
- **Tailwind v4 safelist** — `@source inline()` CSS output replaces `.json` safelist
- **`generateSafelistCss()`** — new compiler export for v4-native safelist generation

**Bug fixes:**
- `InferVariantProps` fallback changed from `Record<string, never>` to `Record<never, never>` — the previous value broke props inference on components using `state:` or `container:` without `variants:` (e.g. `StateButton` could not accept `children`, `onClick`, `data-*`)
- `bootstrapZeroConfig` no longer generates `tailwind.config.ts` — Tailwind v4 is CSS-first, this file causes TS errors
- `withTailwindStyled` now creates an empty `__tw-safelist.css` on startup if missing — prevents `@import` errors on first `npm run dev`
- `withTailwindStyled` default `safelistOutput` updated to `"src/app/__tw-safelist.css"`
- Duplicate `Interpolation` type removed from `twProxy.ts` (was defined in both `twProxy.ts` and `types.ts`)
- Unused `position` and `pinned` params in `devtools/InspectorPanel` prefixed with `_` to fix biome warnings
- Turbopack loader rules scoped to project directories only — prevents "Missing module type" error from `node_modules/next/dist`

### v3.0.0 — Reactive engines

- **Reactive State Engine** — `state:` config generates `data-*` CSS selectors
- **Container Query Engine** — `container:` config generates `@container` CSS rules
- **Live Token Engine** — `liveToken()`, `setToken()`, `setTokens()`, `subscribeTokens()`
- **Plugin System** — `TwPlugin` interface, `pluginAnimation`, `pluginTokens`, `pluginTypography`
- **DevTools overlay** — 5 panels: Inspector, State, Container, Tokens, Analyzer
- **Static variant compilation** — pre-compile all variant combos in production
- **Dead style elimination** — remove unused CSS at production build time
- **Route CSS bundling** — per-page CSS chunks for minimal payload
- **Multi-Theme Engine** — `@tailwind-styled/theme` with TypeScript contracts
- **Design System Factory** — `createStyledSystem()` for design system packages

### v2.0.0 — Zero runtime

- **Zero runtime** — ~1.5kb client bundle (was ~8–10kb with styled-components)
- **styled-components removed** — replaced by compiler output
- **RSC-aware** — auto-detect server vs client context, `tw.server.*`
- **Auto `"use client"`** — injected only where JS is actually needed
- **Component hoisting** — `tw()` auto-hoisted to module scope to prevent re-creation
- **`cv()` variant inference** — exact variant value types from config (was loose `string`)
- **`cx()` / `cn()` rename** — clearer semantics; `cx()` is now conflict-aware by default
- **Incremental CSS engine** — skip unchanged files (~5–20ms hot reload in large projects)
- **Style bucket system** — deterministic CSS ordering across concurrent builds

---

## License

MIT © Dictionar32
