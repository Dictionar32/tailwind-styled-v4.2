/**
 * tailwind-styled-v4 — Official Plugins
 *
 * 3 plugin resmi sebagai reference implementasi ecosystem.
 * Bisa dipakai langsung atau dijadikan template buat community plugins.
 *
 * Usage:
 *   import { pluginAnimation, pluginTokens, pluginTypography } from "tailwind-styled-v4/plugins"
 *
 *   withTailwindStyled({
 *     plugins: [
 *       pluginAnimation(),
 *       pluginTokens({ primary: "#3b82f6", secondary: "#6366f1" }),
 *       pluginTypography(),
 *     ]
 *   })(nextConfig)
 *
 * Atau standalone:
 *   import { use } from "tailwind-styled-v4/plugin"
 *   use(pluginAnimation())
 */

import type { TwPlugin } from "./index"

// ─────────────────────────────────────────────────────────────────────────────
// PLUGIN 1: tw-plugin-animation
//
// Menambahkan:
//   - Preset animation variants (enter, exit, slide-*, fade-*, scale-*)
//   - tw.animate() DSL support via compiler transform hook
//   - CSS @keyframes injection
// ─────────────────────────────────────────────────────────────────────────────

export interface AnimationPluginOptions {
  /** Prefix untuk generated animation classes. Default: "tw-anim" */
  prefix?: string
  /** Tambahkan reduced-motion safe variants. Default: true */
  reducedMotion?: boolean
}

/**
 * Official animation plugin.
 *
 * Adds:
 *   - `enter` variant → apply on mount animation
 *   - `exit` variant → apply on unmount animation
 *   - `motion-safe:` → only animate if prefers-reduced-motion: no-preference
 *   - Preset utility classes: `animate-fade-in`, `animate-slide-up`, etc.
 *
 * @example
 * use(pluginAnimation())
 *
 * const Card = tw.div`p-4 animate-fade-in`
 * const Modal = tw.div`animate-scale-in fixed inset-0`
 */
export function pluginAnimation(opts: AnimationPluginOptions = {}): TwPlugin {
  const { prefix = "tw-anim", reducedMotion = true } = opts

  return {
    name: "tw-plugin-animation",

    setup(ctx: import("./index").TwContext) {
      // Variant: motion-safe — only animate if user hasn't requested reduced motion
      if (reducedMotion) {
        ctx.addVariant(
          "motion-safe",
          (sel: string) => `@media (prefers-reduced-motion: no-preference) { ${sel} }`
        )
        ctx.addVariant(
          "motion-reduce",
          (sel: string) => `@media (prefers-reduced-motion: reduce) { ${sel} }`
        )
      }

      // ── Preset @keyframes injected via CSS hook ─────────────────────────
      ctx.onGenerateCSS((css: string) => {
        const keyframes = `
/* tw-plugin-animation: preset keyframes */
@keyframes ${prefix}-fade-in    { from{opacity:0}                              to{opacity:1} }
@keyframes ${prefix}-fade-out   { from{opacity:1}                              to{opacity:0} }
@keyframes ${prefix}-slide-up   { from{opacity:0;transform:translateY(0.5rem)} to{opacity:1;transform:translateY(0)} }
@keyframes ${prefix}-slide-down { from{opacity:0;transform:translateY(-0.5rem)}to{opacity:1;transform:translateY(0)} }
@keyframes ${prefix}-slide-left { from{opacity:0;transform:translateX(0.5rem)} to{opacity:1;transform:translateX(0)} }
@keyframes ${prefix}-scale-in   { from{opacity:0;transform:scale(0.95)}        to{opacity:1;transform:scale(1)} }
@keyframes ${prefix}-scale-out  { from{opacity:1;transform:scale(1)}           to{opacity:0;transform:scale(0.95)} }
@keyframes ${prefix}-spin       { from{transform:rotate(0deg)}                 to{transform:rotate(360deg)} }
@keyframes ${prefix}-ping       { 0%,100%{opacity:1;transform:scale(1)}        75%{opacity:0;transform:scale(2)} }
@keyframes ${prefix}-pulse      { 0%,100%{opacity:1}                           50%{opacity:0.5} }
@keyframes ${prefix}-bounce     { 0%,100%{transform:translateY(-25%);animation-timing-function:cubic-bezier(.8,0,1,1)} 50%{transform:translateY(0);animation-timing-function:cubic-bezier(0,0,.2,1)} }
`
        return keyframes + css
      })

      // ── Preset animation utility classes ─────────────────────────────────
      const dur = "300ms"
      const ease = "cubic-bezier(0.16,1,0.3,1)"

      ctx.addUtility(`animate-fade-in`, { animation: `${prefix}-fade-in    ${dur} ${ease} both` })
      ctx.addUtility(`animate-fade-out`, { animation: `${prefix}-fade-out   ${dur} ${ease} both` })
      ctx.addUtility(`animate-slide-up`, { animation: `${prefix}-slide-up   ${dur} ${ease} both` })
      ctx.addUtility(`animate-slide-down`, {
        animation: `${prefix}-slide-down ${dur} ${ease} both`,
      })
      ctx.addUtility(`animate-slide-left`, {
        animation: `${prefix}-slide-left ${dur} ${ease} both`,
      })
      ctx.addUtility(`animate-scale-in`, { animation: `${prefix}-scale-in   200ms ease-out both` })
      ctx.addUtility(`animate-scale-out`, { animation: `${prefix}-scale-out  150ms ease-in  both` })
      ctx.addUtility(`animate-spin`, { animation: `${prefix}-spin 1s linear infinite` })
      ctx.addUtility(`animate-ping`, {
        animation: `${prefix}-ping 1s cubic-bezier(0,0,.2,1) infinite`,
      })
      ctx.addUtility(`animate-pulse`, {
        animation: `${prefix}-pulse 2s cubic-bezier(.4,0,.6,1) infinite`,
      })
      ctx.addUtility(`animate-bounce`, { animation: `${prefix}-bounce 1s infinite` })
      ctx.addUtility(`animate-none`, { animation: "none" })

      // ── Compiler transform for tw.div.animate({}) syntax ─────────────────
      ctx.addTransform((node: any, _ctx: any) => {
        // Hook for AST compiler to pick up tw.element.animate({...}) calls
        // The actual transform is in astTransform.ts — this registers intent
        if (node?.type === "TwAnimateCall") {
          return { ...node, pluginHandled: "tw-plugin-animation" }
        }
        return node
      })
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLUGIN 2: tw-plugin-tokens
//
// Menambahkan:
//   - Design tokens sebagai CSS custom properties
//   - Token-aware utility classes (bg-primary, text-primary, etc.)
//   - Tailwind v4 @theme compatible output
// ─────────────────────────────────────────────────────────────────────────────

export interface TokensPluginOptions {
  /** Color tokens */
  colors?: Record<string, string>
  /** Spacing tokens (mapped to --spacing-*) */
  spacing?: Record<string, string>
  /** Typography tokens */
  fonts?: Record<string, string>
  /** Border radius tokens */
  radii?: Record<string, string>
  /** Shadow tokens */
  shadows?: Record<string, string>
  /** Custom tokens (any group) */
  custom?: Record<string, Record<string, string>>
  /** Generate utility classes. Default: true */
  generateUtilities?: boolean
}

/**
 * Official design token plugin.
 *
 * Generates CSS variables from your token map + optional utility classes.
 *
 * @example
 * use(pluginTokens({
 *   colors: {
 *     primary:   "#3b82f6",
 *     secondary: "#6366f1",
 *     danger:    "#ef4444",
 *   },
 *   fonts: {
 *     sans: "InterVariable, system-ui, sans-serif",
 *   },
 * }))
 *
 * // Then use in components:
 * const Button = tw.button`bg-primary text-white hover:bg-primary-hover`
 * // → bg-[var(--color-primary)] etc.
 */
export function pluginTokens(opts: TokensPluginOptions = {}): TwPlugin {
  const { generateUtilities = true } = opts

  return {
    name: "tw-plugin-tokens",

    setup(ctx: import("./index").TwContext) {
      // ── Register color tokens ────────────────────────────────────────────
      for (const [name, value] of Object.entries(opts.colors ?? {})) {
        ctx.addToken(`color-${name}`, value)

        // Derive hover/active tones automatically
        if (!value.startsWith("var(")) {
          const hoverValue = darken(value, 0.1)
          const activeValue = darken(value, 0.2)
          ctx.addToken(`color-${name}-hover`, hoverValue)
          ctx.addToken(`color-${name}-active`, activeValue)
        }

        // Generate bg-{name}, text-{name}, border-{name} utilities
        if (generateUtilities) {
          ctx.addUtility(`bg-${name}`, { "background-color": `var(--color-${name})` })
          ctx.addUtility(`text-${name}`, { color: `var(--color-${name})` })
          ctx.addUtility(`border-${name}`, { "border-color": `var(--color-${name})` })
          ctx.addUtility(`ring-${name}`, { "--tw-ring-color": `var(--color-${name})` })
          ctx.addUtility(`hover-bg-${name}:hover`, {
            "background-color": `var(--color-${name}-hover)`,
          })
        }
      }

      // ── Spacing tokens ───────────────────────────────────────────────────
      for (const [name, value] of Object.entries(opts.spacing ?? {})) {
        ctx.addToken(`spacing-${name}`, value)
      }

      // ── Font tokens ──────────────────────────────────────────────────────
      for (const [name, value] of Object.entries(opts.fonts ?? {})) {
        ctx.addToken(`font-${name}`, value)
        if (generateUtilities) {
          ctx.addUtility(`font-${name}`, { "font-family": `var(--font-${name})` })
        }
      }

      // ── Radii tokens ─────────────────────────────────────────────────────
      for (const [name, value] of Object.entries(opts.radii ?? {})) {
        ctx.addToken(`radius-${name}`, value)
        if (generateUtilities) {
          ctx.addUtility(`rounded-${name}`, { "border-radius": `var(--radius-${name})` })
        }
      }

      // ── Shadow tokens ────────────────────────────────────────────────────
      for (const [name, value] of Object.entries(opts.shadows ?? {})) {
        ctx.addToken(`shadow-${name}`, value)
        if (generateUtilities) {
          ctx.addUtility(`shadow-${name}`, { "box-shadow": `var(--shadow-${name})` })
        }
      }

      // ── Custom token groups ──────────────────────────────────────────────
      for (const [group, tokens] of Object.entries(opts.custom ?? {})) {
        for (const [name, value] of Object.entries(tokens)) {
          ctx.addToken(`${group}-${name}`, value)
        }
      }
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLUGIN 3: tw-plugin-typography
//
// Menambahkan:
//   - Prose utility class (rich text styling)
//   - Typography scale utilities
//   - Font feature utilities (ligatures, kerning, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export interface TypographyPluginOptions {
  /** Default prose text color. Default: "inherit" */
  color?: string
  /** Default prose font family. Default: "inherit" */
  fontFamily?: string
  /** Max width for prose container. Default: "65ch" */
  maxWidth?: string
}

/**
 * Official typography plugin.
 *
 * Adds `prose` utility class for rich text content (like @tailwindcss/typography).
 * Zero external dependency.
 *
 * @example
 * use(pluginTypography())
 *
 * const Article = tw.article`prose prose-invert max-w-3xl mx-auto`
 */
export function pluginTypography(opts: TypographyPluginOptions = {}): TwPlugin {
  const { color = "inherit", fontFamily = "inherit", maxWidth = "65ch" } = opts

  return {
    name: "tw-plugin-typography",

    setup(ctx: import("./index").TwContext) {
      // ── Base prose ───────────────────────────────────────────────────────
      ctx.addUtility("prose", {
        color: color,
        "font-family": fontFamily,
        "max-width": maxWidth,
        "line-height": "1.75",
        "font-size": "1rem",
      })

      // ── Font feature utilities ────────────────────────────────────────────
      ctx.addUtility("font-ligatures", { "font-variant-ligatures": "common-ligatures" })
      ctx.addUtility("font-no-ligatures", { "font-variant-ligatures": "none" })
      ctx.addUtility("font-numeric", { "font-variant-numeric": "tabular-nums" })
      ctx.addUtility("font-oldstyle-nums", { "font-variant-numeric": "oldstyle-nums" })
      ctx.addUtility("font-kerning", { "font-kerning": "auto" })
      ctx.addUtility("font-optical-sizing", { "font-optical-sizing": "auto" })
      ctx.addUtility("text-balance", { "text-wrap": "balance" })
      ctx.addUtility("text-pretty", { "text-wrap": "pretty" })
      ctx.addUtility("text-stable", { "text-wrap": "stable" })

      // ── Heading scale ─────────────────────────────────────────────────────
      ctx.addUtility("prose-h1", {
        "font-size": "2.25rem",
        "font-weight": "800",
        "line-height": "1.25",
        "margin-bottom": "0.5em",
      })
      ctx.addUtility("prose-h2", {
        "font-size": "1.5rem",
        "font-weight": "700",
        "line-height": "1.33",
        "margin-bottom": "0.5em",
      })
      ctx.addUtility("prose-h3", {
        "font-size": "1.25rem",
        "font-weight": "600",
        "line-height": "1.4",
        "margin-bottom": "0.5em",
      })
      ctx.addUtility("prose-h4", {
        "font-size": "1.125rem",
        "font-weight": "600",
        "line-height": "1.5",
        "margin-bottom": "0.5em",
      })

      // ── Dark mode prose ───────────────────────────────────────────────────
      ctx.addVariant("prose-invert", (sel: string) => `.dark ${sel}, [data-theme="dark"] ${sel}`)

      // ── CSS hooks ─────────────────────────────────────────────────────────
      ctx.onGenerateCSS((css: string) => {
        const proseCss = `
/* tw-plugin-typography: prose content styles */
.prose > * + * { margin-top: 1.25em }
.prose p  { line-height: 1.75 }
.prose h1,.prose h2,.prose h3,.prose h4 { font-weight: 700; line-height: 1.3 }
.prose a  { color: var(--color-primary, #3b82f6); text-decoration: underline; text-underline-offset: 2px }
.prose a:hover { opacity: 0.8 }
.prose strong,.prose b { font-weight: 700 }
.prose em,.prose i { font-style: italic }
.prose code { background: rgba(127,127,127,.15); padding: 0.15em 0.35em; border-radius: 3px; font-size: 0.875em }
.prose pre  { background: #09090b; padding: 1.25em; border-radius: 8px; overflow-x: auto }
.prose pre code { background: none; padding: 0; font-size: 0.875em }
.prose ul   { list-style: disc; padding-left: 1.5em }
.prose ol   { list-style: decimal; padding-left: 1.5em }
.prose li   { margin-top: 0.25em; margin-bottom: 0.25em }
.prose blockquote { border-left: 4px solid var(--color-primary, #3b82f6); padding-left: 1em; font-style: italic; opacity: 0.8 }
.prose hr   { border-color: rgba(127,127,127,.2); margin: 2em 0 }
.prose img  { border-radius: 8px; max-width: 100% }
.prose table { width: 100%; border-collapse: collapse }
.prose th,.prose td { padding: 0.5em 1em; border: 1px solid rgba(127,127,127,.2); text-align: left }
.prose th  { font-weight: 600; background: rgba(127,127,127,.05) }
`
        return proseCss + css
      })
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: darken hex color by percentage
// ─────────────────────────────────────────────────────────────────────────────

function darken(hex: string, amount: number): string {
  try {
    const n = parseInt(hex.replace("#", ""), 16)
    const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount)) | 0
    const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount)) | 0
    const b = Math.max(0, (n & 0xff) * (1 - amount)) | 0
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
  } catch {
    return hex
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export plugin primitives for community plugin development
// ─────────────────────────────────────────────────────────────────────────────

export type { PluginRegistry, TwContext, TwPlugin } from "./index"
export { createTw, presetScrollbar, presetTokens, presetVariants, use } from "./index"
