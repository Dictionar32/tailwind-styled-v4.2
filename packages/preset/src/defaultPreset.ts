/**
 * tailwind-styled-v4 — Default Preset
 *
 * Tailwind config built-in yang dipakai ketika developer tidak punya
 * tailwind.config.ts / tailwind.config.js di project mereka.
 *
 * Developer tidak perlu setup apapun:
 *   npm install tailwind-styled-v4
 *   → langsung bisa tw.div`p-4 bg-blue-500`
 *
 * Preset ini juga menyediakan design tokens yang consistent
 * untuk semua project yang pakai tailwind-styled-v4.
 *
 * Override per-project:
 *   // tailwind.config.ts
 *   import { defaultPreset } from "tailwind-styled-v4/preset"
 *   export default { presets: [defaultPreset], theme: { extend: {...} } }
 */

// ─────────────────────────────────────────────────────────────────────────────
// Content paths — auto-detect berdasarkan project structure
// ─────────────────────────────────────────────────────────────────────────────

const STANDARD_CONTENT_PATHS = [
  // Next.js App Router
  "./src/**/*.{tsx,ts,jsx,js,mdx}",
  "./app/**/*.{tsx,ts,jsx,js,mdx}",
  "./pages/**/*.{tsx,ts,jsx,js,mdx}",
  "./components/**/*.{tsx,ts,jsx,js,mdx}",
  // Vite / React
  "./src/**/*.{tsx,ts,jsx,js}",
  "./index.html",
  // Monorepo
  "../../packages/**/src/**/*.{tsx,ts,jsx,js}",
]

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — consistent across all tailwind-styled-v4 projects
// ─────────────────────────────────────────────────────────────────────────────

export const designTokens = {
  colors: {
    // Brand
    primary: { DEFAULT: "#3b82f6", hover: "#2563eb", active: "#1d4ed8", foreground: "#ffffff" },
    secondary: { DEFAULT: "#6366f1", hover: "#4f46e5", active: "#4338ca", foreground: "#ffffff" },
    accent: { DEFAULT: "#f59e0b", hover: "#d97706", active: "#b45309", foreground: "#000000" },
    // Semantic
    success: { DEFAULT: "#10b981", foreground: "#ffffff" },
    warning: { DEFAULT: "#f59e0b", foreground: "#000000" },
    danger: { DEFAULT: "#ef4444", foreground: "#ffffff" },
    info: { DEFAULT: "#3b82f6", foreground: "#ffffff" },
    // Neutral
    surface: "#18181b",
    border: "#27272a",
    muted: "#71717a",
    subtle: "#3f3f46",
  },

  fontFamily: {
    sans: ["InterVariable", "Inter", "system-ui", "sans-serif"],
    mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
  },

  borderRadius: {
    sm: "0.25rem",
    DEFAULT: "0.5rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem",
    full: "9999px",
  },

  animation: {
    "fade-in": "fadeIn 0.2s ease-out",
    "fade-out": "fadeOut 0.2s ease-in",
    "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    "slide-down": "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    "scale-in": "scaleIn 0.2s ease-out",
  },

  keyframes: {
    fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
    fadeOut: { from: { opacity: "1" }, to: { opacity: "0" } },
    slideUp: {
      from: { transform: "translateY(8px)", opacity: "0" },
      to: { transform: "translateY(0)", opacity: "1" },
    },
    slideDown: {
      from: { transform: "translateY(-8px)", opacity: "0" },
      to: { transform: "translateY(0)", opacity: "1" },
    },
    scaleIn: {
      from: { transform: "scale(0.95)", opacity: "0" },
      to: { transform: "scale(1)", opacity: "1" },
    },
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Default Tailwind Config — dipakai sebagai fallback + preset
// ─────────────────────────────────────────────────────────────────────────────

export const defaultPreset = {
  content: STANDARD_CONTENT_PATHS,

  darkMode: "class" as const,

  theme: {
    extend: {
      colors: designTokens.colors,
      fontFamily: designTokens.fontFamily,
      borderRadius: designTokens.borderRadius,
      animation: designTokens.animation,
      keyframes: designTokens.keyframes,
    },
  },

  plugins: [],
}

// ─────────────────────────────────────────────────────────────────────────────
// Zero-config tailwind.config.ts generator
// Dipakai oleh CLI dan withTailwindStyled saat tidak ada user config
// ─────────────────────────────────────────────────────────────────────────────

export function generateTailwindConfig(
  safelistPath = ".tailwind-styled-safelist.json",
  contentPaths = STANDARD_CONTENT_PATHS
): string {
  return `import type { Config } from "tailwindcss"
import { defaultPreset } from "tailwind-styled-v4/preset"

// Auto-generated safelist dari tailwind-styled-v4 compiler
const safelist = (() => {
  try { return require(${JSON.stringify(safelistPath)}) as string[] }
  catch { return [] }
})()

export default {
  presets: [defaultPreset],
  content: ${JSON.stringify(contentPaths, null, 2)},
  safelist,
} satisfies Config
`
}

// ─────────────────────────────────────────────────────────────────────────────
// Zero-config globals.css — tidak perlu @tailwind base dll
// ─────────────────────────────────────────────────────────────────────────────

export const defaultGlobalCss = `@import "tailwindcss";

/* tailwind-styled-v4 — zero-config base styles */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  margin: 0;
  font-family: var(--font-sans, system-ui, sans-serif);
  background: var(--color-background, #09090b);
  color: var(--color-foreground, #fafafa);
}
`
