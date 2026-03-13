/**
 * tailwind-styled-v4 — Plugin System
 *
 * Fondasi ecosystem library. Plugin bisa extend compiler pipeline
 * di berbagai tahap: variant, utility, token, transform, CSS.
 *
 * Usage:
 *   import { createTw } from "tailwind-styled-v4/plugin"
 *   const tw = createTw({
 *     plugins: [
 *       presetAnimation(),
 *       presetTokens({ primary: "#3b82f6" }),
 *     ]
 *   })
 *
 * Buat plugin sendiri:
 *   const myPlugin: TwPlugin = {
 *     name: "my-plugin",
 *     setup(ctx) {
 *       ctx.addVariant("print", sel => `@media print { ${sel} }`)
 *       ctx.addUtility("glow", { "box-shadow": "0 0 20px currentColor" })
 *       ctx.addToken("brand", "#ff4d6d")
 *     }
 *   }
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type VariantResolver = (selector: string) => string

export interface UtilityDefinition {
  [property: string]: string
}

export type TransformFn = (node: any, ctx: TwContext) => any

export type CssHook = (css: string) => string

export interface TwContext {
  /** Add a new variant (e.g. "group-hover", "print", "rtl") */
  addVariant(name: string, resolver: VariantResolver): void
  /** Add a new utility class */
  addUtility(name: string, styles: UtilityDefinition): void
  /** Add a design token (becomes CSS custom property) */
  addToken(name: string, value: string): void
  /** Add a compiler AST transform hook */
  addTransform(fn: TransformFn): void
  /** Hook into CSS generation phase */
  onGenerateCSS(hook: CssHook): void
  /** Hook into build end */
  onBuildEnd(hook: () => void | Promise<void>): void
  /** Read current plugin config */
  readonly config: Record<string, any>
}

export interface TwPlugin {
  name: string
  setup(ctx: TwContext): void
}

// ─────────────────────────────────────────────────────────────────────────────
// Plugin Registry — singleton per engine instance
// ─────────────────────────────────────────────────────────────────────────────

export interface PluginRegistry {
  variants: Map<string, VariantResolver>
  utilities: Map<string, UtilityDefinition>
  tokens: Map<string, string>
  transforms: TransformFn[]
  cssHooks: CssHook[]
  buildHooks: Array<() => void | Promise<void>>
  plugins: Set<string>
}

function createRegistry(): PluginRegistry {
  return {
    variants: new Map(),
    utilities: new Map(),
    tokens: new Map(),
    transforms: [],
    cssHooks: [],
    buildHooks: [],
    plugins: new Set(),
  }
}

// Global registry — dipakai bila createTw() tidak digunakan
let _globalRegistry: PluginRegistry = createRegistry()

export function getGlobalRegistry(): PluginRegistry {
  return _globalRegistry
}

export function resetGlobalRegistry(): void {
  _globalRegistry = createRegistry()
}

// ─────────────────────────────────────────────────────────────────────────────
// Context factory
// ─────────────────────────────────────────────────────────────────────────────

function createContext(registry: PluginRegistry, config: Record<string, any> = {}): TwContext {
  return {
    config,

    addVariant(name, resolver) {
      if (registry.variants.has(name)) {
        console.warn(
          `[tailwind-styled-v4] Plugin variant "${name}" already registered — overwriting.`
        )
      }
      registry.variants.set(name, resolver)
    },

    addUtility(name, styles) {
      registry.utilities.set(name, styles)
    },

    addToken(name, value) {
      // Normalize to CSS variable friendly name
      const normalized = name.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase()
      registry.tokens.set(normalized, value)
    },

    addTransform(fn) {
      registry.transforms.push(fn)
    },

    onGenerateCSS(hook) {
      registry.cssHooks.push(hook)
    },

    onBuildEnd(hook) {
      registry.buildHooks.push(hook)
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// use() — register plugin to global registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register a plugin globally.
 *
 * @example
 * import { use } from "tailwind-styled-v4/plugin"
 * import { presetAnimation } from "tw-plugin-animation"
 *
 * use(presetAnimation())
 */
export function use(plugin: TwPlugin, config: Record<string, any> = {}): void {
  if (_globalRegistry.plugins.has(plugin.name)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[tailwind-styled-v4] Plugin "${plugin.name}" already registered — skipping.`)
    }
    return
  }

  const ctx = createContext(_globalRegistry, config)
  plugin.setup(ctx)
  _globalRegistry.plugins.add(plugin.name)

  if (process.env.NODE_ENV !== "production") {
    console.log(`[tailwind-styled-v4] Plugin "${plugin.name}" registered.`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// createTw() — scoped engine instance with own registry
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateTwOptions {
  plugins?: TwPlugin[]
  config?: Record<string, any>
}

/**
 * Create a scoped tw instance with its own plugin registry.
 * Useful for libraries or sub-applications that need isolation.
 *
 * @example
 * const { tw, registry } = createTw({
 *   plugins: [presetAnimation(), presetTokens()]
 * })
 */
export function createTw(opts: CreateTwOptions = {}): {
  registry: PluginRegistry
  use: (plugin: TwPlugin) => void
} {
  const registry = createRegistry()

  for (const plugin of opts.plugins ?? []) {
    if (registry.plugins.has(plugin.name)) continue
    const ctx = createContext(registry, opts.config ?? {})
    plugin.setup(ctx)
    registry.plugins.add(plugin.name)
  }

  return {
    registry,
    use(plugin: TwPlugin) {
      if (registry.plugins.has(plugin.name)) return
      const ctx = createContext(registry, opts.config ?? {})
      plugin.setup(ctx)
      registry.plugins.add(plugin.name)
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS generation helpers — used by compiler to apply plugin tokens/utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate :root CSS variables from registered tokens.
 */
export function generateTokenCss(registry: PluginRegistry): string {
  if (registry.tokens.size === 0) return ""

  const vars = Array.from(registry.tokens.entries())
    .map(([name, value]) => `  --${name}: ${value};`)
    .join("\n")

  return `:root {\n${vars}\n}`
}

/**
 * Generate CSS for registered utilities.
 */
export function generateUtilityCss(registry: PluginRegistry): string {
  const lines: string[] = []

  for (const [name, styles] of registry.utilities.entries()) {
    const props = Object.entries(styles)
      .map(([p, v]) => `  ${p}: ${v};`)
      .join("\n")
    lines.push(`.${name} {\n${props}\n}`)
  }

  return lines.join("\n\n")
}

/**
 * Apply all CSS hooks to a CSS string.
 */
export function applyCssHooks(css: string, registry: PluginRegistry): string {
  return registry.cssHooks.reduce((acc, hook) => hook(acc), css)
}

/**
 * Run all build end hooks.
 */
export async function runBuildHooks(registry: PluginRegistry): Promise<void> {
  for (const hook of registry.buildHooks) {
    await hook()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in official plugins
// ─────────────────────────────────────────────────────────────────────────────

/**
 * preset: common group variants
 *
 * Adds: group-hover, group-focus, peer-checked, rtl, ltr, print
 */
export function presetVariants(): TwPlugin {
  return {
    name: "preset-variants",
    setup(ctx) {
      ctx.addVariant("group-hover", (sel) => `.group:hover ${sel}`)
      ctx.addVariant("group-focus", (sel) => `.group:focus-within ${sel}`)
      ctx.addVariant("peer-checked", (sel) => `.peer:checked ~ ${sel}`)
      ctx.addVariant("peer-disabled", (sel) => `.peer:disabled ~ ${sel}`)
      ctx.addVariant("rtl", (sel) => `[dir="rtl"] ${sel}`)
      ctx.addVariant("ltr", (sel) => `[dir="ltr"] ${sel}`)
      ctx.addVariant("print", (sel) => `@media print { ${sel} }`)
      ctx.addVariant(
        "motion-safe",
        (sel) => `@media (prefers-reduced-motion: no-preference) { ${sel} }`
      )
      ctx.addVariant("motion-reduce", (sel) => `@media (prefers-reduced-motion: reduce) { ${sel} }`)
    },
  }
}

/**
 * preset: scrollbar utilities
 */
export function presetScrollbar(): TwPlugin {
  return {
    name: "preset-scrollbar",
    setup(ctx) {
      ctx.addUtility("scrollbar-none", {
        "scrollbar-width": "none",
        "-ms-overflow-style": "none",
      })
      ctx.addUtility("scrollbar-thin", {
        "scrollbar-width": "thin",
      })
      ctx.addUtility("scrollbar-auto", {
        "scrollbar-width": "auto",
      })
    },
  }
}

/**
 * preset: design tokens from a color palette
 *
 * @example
 * use(presetTokens({
 *   primary: "#3b82f6",
 *   secondary: "#6366f1",
 *   accent: "#f59e0b",
 * }))
 */
export function presetTokens(tokens: Record<string, string>): TwPlugin {
  return {
    name: "preset-tokens",
    setup(ctx) {
      for (const [name, value] of Object.entries(tokens)) {
        ctx.addToken(`color-${name}`, value)
      }
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export plugin functions dari plugins.ts
// Ini yang di-import user via "tailwind-styled-v4/plugins"
// ─────────────────────────────────────────────────────────────────────────────

export type {
  AnimationPluginOptions,
  TokensPluginOptions,
  TypographyPluginOptions,
} from "./plugins"
export {
  pluginAnimation,
  pluginTokens,
  pluginTypography,
} from "./plugins"
