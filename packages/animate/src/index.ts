/**
 * tailwind-styled-v4 — Animation DSL
 *
 * Compile-time animation system. Define animations dengan Tailwind class,
 * compiler generate @keyframes — nol runtime, nol JS overhead.
 *
 * Usage:
 *
 *   // Cara 1: .animate() chaining pada tw component
 *   const FadeIn = tw.div.animate({
 *     from: "opacity-0 translate-y-2",
 *     to:   "opacity-100 translate-y-0",
 *     duration: 300,
 *     easing: "ease-out"
 *   })
 *
 *   // Cara 2: standalone animate() utility
 *   const fadeIn = animate({
 *     from: "opacity-0 scale-95",
 *     to:   "opacity-100 scale-100",
 *     duration: 200,
 *   })
 *   const Box = tw.div`${fadeIn}`
 *
 *   // Cara 3: preset animations
 *   const Card = tw.div`${animations.fadeIn} ${animations.slideUp}`
 *
 *   // Cara 4: tw.keyframes() custom
 *   const spin = tw.keyframes("spin", {
 *     "0%":   "rotate-0",
 *     "100%": "rotate-180",
 *   })
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AnimateOptions {
  /** Tailwind classes for animation start state */
  from: string
  /** Tailwind classes for animation end state */
  to: string
  /** Duration in ms. Default: 300 */
  duration?: number
  /** CSS easing. Default: "ease-out" */
  easing?: string
  /** Delay in ms. Default: 0 */
  delay?: number
  /** Fill mode. Default: "both" */
  fill?: "none" | "forwards" | "backwards" | "both"
  /** Iteration count. Default: 1 */
  iterations?: number | "infinite"
  /** Direction. Default: "normal" */
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse"
  /** Animation name override (auto-generated from from+to if not set) */
  name?: string
}

export interface KeyframesDefinition {
  [stop: string]: string // "0%": "opacity-0 translate-y-2"
}

export interface CompiledAnimation {
  /** CSS animation class name to apply */
  className: string
  /** @keyframes CSS to inject */
  keyframesCss: string
  /** animation CSS shorthand */
  animationCss: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Tailwind class → CSS property mapping
// (for compile-time keyframe generation)
// ─────────────────────────────────────────────────────────────────────────────

const TW_TO_CSS: Record<string, string> = {
  // Opacity
  "opacity-0": "opacity: 0",
  "opacity-5": "opacity: 0.05",
  "opacity-10": "opacity: 0.1",
  "opacity-20": "opacity: 0.2",
  "opacity-25": "opacity: 0.25",
  "opacity-30": "opacity: 0.3",
  "opacity-40": "opacity: 0.4",
  "opacity-50": "opacity: 0.5",
  "opacity-60": "opacity: 0.6",
  "opacity-70": "opacity: 0.7",
  "opacity-75": "opacity: 0.75",
  "opacity-80": "opacity: 0.8",
  "opacity-90": "opacity: 0.9",
  "opacity-95": "opacity: 0.95",
  "opacity-100": "opacity: 1",

  // Translate Y
  "translate-y-0": "transform: translateY(0px)",
  "translate-y-0.5": "transform: translateY(0.125rem)",
  "translate-y-1": "transform: translateY(0.25rem)",
  "translate-y-2": "transform: translateY(0.5rem)",
  "translate-y-3": "transform: translateY(0.75rem)",
  "translate-y-4": "transform: translateY(1rem)",
  "translate-y-6": "transform: translateY(1.5rem)",
  "translate-y-8": "transform: translateY(2rem)",
  "-translate-y-1": "transform: translateY(-0.25rem)",
  "-translate-y-2": "transform: translateY(-0.5rem)",
  "-translate-y-4": "transform: translateY(-1rem)",
  "-translate-y-8": "transform: translateY(-2rem)",

  // Translate X
  "translate-x-0": "transform: translateX(0px)",
  "translate-x-1": "transform: translateX(0.25rem)",
  "translate-x-2": "transform: translateX(0.5rem)",
  "translate-x-4": "transform: translateX(1rem)",
  "-translate-x-1": "transform: translateX(-0.25rem)",
  "-translate-x-2": "transform: translateX(-0.5rem)",
  "-translate-x-4": "transform: translateX(-1rem)",

  // Scale
  "scale-0": "transform: scale(0)",
  "scale-50": "transform: scale(0.5)",
  "scale-75": "transform: scale(0.75)",
  "scale-90": "transform: scale(0.9)",
  "scale-95": "transform: scale(0.95)",
  "scale-100": "transform: scale(1)",
  "scale-105": "transform: scale(1.05)",
  "scale-110": "transform: scale(1.1)",
  "scale-125": "transform: scale(1.25)",
  "scale-150": "transform: scale(1.5)",

  // Rotate
  "rotate-0": "transform: rotate(0deg)",
  "rotate-1": "transform: rotate(1deg)",
  "rotate-2": "transform: rotate(2deg)",
  "rotate-3": "transform: rotate(3deg)",
  "rotate-6": "transform: rotate(6deg)",
  "rotate-12": "transform: rotate(12deg)",
  "rotate-45": "transform: rotate(45deg)",
  "rotate-90": "transform: rotate(90deg)",
  "rotate-180": "transform: rotate(180deg)",
  "-rotate-1": "transform: rotate(-1deg)",
  "-rotate-2": "transform: rotate(-2deg)",
  "-rotate-6": "transform: rotate(-6deg)",
  "-rotate-12": "transform: rotate(-12deg)",
  "-rotate-45": "transform: rotate(-45deg)",
  "-rotate-90": "transform: rotate(-90deg)",

  // Blur
  "blur-none": "filter: blur(0)",
  "blur-sm": "filter: blur(4px)",
  blur: "filter: blur(8px)",
  "blur-md": "filter: blur(12px)",
  "blur-lg": "filter: blur(16px)",
  "blur-xl": "filter: blur(24px)",
  "blur-2xl": "filter: blur(40px)",
  "blur-3xl": "filter: blur(64px)",
}

// Multi-transform classes need merging
function classesToCss(classes: string): string {
  const parts = classes.split(/\s+/).filter(Boolean)
  const transforms: string[] = []
  const others: string[] = []

  for (const cls of parts) {
    const css = TW_TO_CSS[cls]
    if (!css) continue

    if (css.startsWith("transform:")) {
      transforms.push(css.replace("transform: ", ""))
    } else {
      others.push(css)
    }
  }

  const result = [...others]
  if (transforms.length > 0) {
    result.push(`transform: ${transforms.join(" ")}`)
  }

  return result.join("; ")
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation ID generator
// ─────────────────────────────────────────────────────────────────────────────

let _animCounter = 0
function genAnimId(name?: string): string {
  if (name) return `tw-${name.replace(/[^a-zA-Z0-9]/g, "-")}`
  return `tw-anim-${++_animCounter}`
}

// Global registry of generated animations (for CSS extraction)
const _animRegistry = new Map<string, CompiledAnimation>()

export function getAnimationRegistry(): Map<string, CompiledAnimation> {
  return _animRegistry
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: compile animation options → CSS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compile AnimateOptions into CSS animation + @keyframes.
 *
 * Called at build time by the compiler, or at runtime in dev mode.
 */
export function compileAnimation(opts: AnimateOptions): CompiledAnimation {
  const {
    from,
    to,
    duration = 300,
    easing = "ease-out",
    delay = 0,
    fill = "both",
    iterations = 1,
    direction = "normal",
    name,
  } = opts

  const animId = genAnimId(
    name ?? `${from.replace(/\s+/g, "-")}-${to.replace(/\s+/g, "-")}`.slice(0, 30)
  )

  // Already compiled — return cached
  if (_animRegistry.has(animId)) {
    return _animRegistry.get(animId)!
  }

  const fromCss = classesToCss(from)
  const toCss = classesToCss(to)

  const keyframesCss = [
    `@keyframes ${animId} {`,
    fromCss ? `  from { ${fromCss} }` : `  from {}`,
    toCss ? `  to   { ${toCss} }` : `  to {}`,
    `}`,
  ].join("\n")

  const iterStr = iterations === "infinite" ? "infinite" : String(iterations)
  const animationCss = [
    `animation-name: ${animId}`,
    `animation-duration: ${duration}ms`,
    `animation-timing-function: ${easing}`,
    `animation-delay: ${delay}ms`,
    `animation-fill-mode: ${fill}`,
    `animation-iteration-count: ${iterStr}`,
    `animation-direction: ${direction}`,
  ].join("; ")

  const className = animId

  const compiled: CompiledAnimation = { className, keyframesCss, animationCss }
  _animRegistry.set(animId, compiled)

  return compiled
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API: animate()
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate an animation class string to use in tw template literals.
 *
 * @example
 * const fadeIn = animate({ from: "opacity-0", to: "opacity-100", duration: 200 })
 * const Box = tw.div`${fadeIn} p-4 bg-white`
 */
export function animate(opts: AnimateOptions): string {
  const compiled = compileAnimation(opts)

  // In browser: inject keyframes into <style> if not already present
  if (typeof document !== "undefined") {
    const styleId = `__tw_anim_${compiled.className}`
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style")
      style.id = styleId
      style.textContent = `${compiled.keyframesCss}\n.${compiled.className}{${compiled.animationCss}}`
      document.head.appendChild(style)
    }
  }

  return compiled.className
}

// ─────────────────────────────────────────────────────────────────────────────
// tw.keyframes() — custom multi-stop keyframes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Define a custom keyframe animation with multiple stops.
 *
 * @example
 * const pulse = tw.keyframes("pulse", {
 *   "0%, 100%": "opacity-100 scale-100",
 *   "50%":      "opacity-50 scale-95",
 * })
 * const Dot = tw.div`${pulse} w-4 h-4 rounded-full bg-blue-500`
 */
export function keyframes(name: string, stops: KeyframesDefinition): string {
  const animId = genAnimId(name)

  if (_animRegistry.has(animId)) {
    return animId
  }

  const stopLines = Object.entries(stops)
    .map(([stop, classes]) => {
      const css = classesToCss(classes)
      return `  ${stop} { ${css} }`
    })
    .join("\n")

  const keyframesCss = `@keyframes ${animId} {\n${stopLines}\n}`

  // Inject in browser
  if (typeof document !== "undefined") {
    const styleId = `__tw_kf_${animId}`
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style")
      style.id = styleId
      style.textContent = keyframesCss
      document.head.appendChild(style)
    }
  }

  _animRegistry.set(animId, {
    className: animId,
    keyframesCss,
    animationCss: `animation-name: ${animId}`,
  })

  return animId
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset animations — ready to use
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Collection of ready-to-use animation class strings.
 *
 * @example
 * const Card = tw.div`${animations.fadeIn} p-4 bg-white`
 * const Modal = tw.div`${animations.scaleIn} fixed inset-0`
 */
export const animations = {
  fadeIn: animate({ from: "opacity-0", to: "opacity-100", duration: 200 }),
  fadeOut: animate({ from: "opacity-100", to: "opacity-0", duration: 200 }),
  slideUp: animate({
    from: "opacity-0 translate-y-4",
    to: "opacity-100 translate-y-0",
    duration: 300,
  }),
  slideDown: animate({
    from: "opacity-0 -translate-y-4",
    to: "opacity-100 translate-y-0",
    duration: 300,
  }),
  slideLeft: animate({
    from: "opacity-0 translate-x-4",
    to: "opacity-100 translate-x-0",
    duration: 300,
  }),
  slideRight: animate({
    from: "opacity-0 -translate-x-4",
    to: "opacity-100 translate-x-0",
    duration: 300,
  }),
  scaleIn: animate({
    from: "opacity-0 scale-95",
    to: "opacity-100 scale-100",
    duration: 200,
    easing: "cubic-bezier(0.16,1,0.3,1)",
  }),
  scaleOut: animate({ from: "opacity-100 scale-100", to: "opacity-0 scale-95", duration: 150 }),
  blurIn: animate({ from: "opacity-0 blur-sm", to: "opacity-100 blur-none", duration: 300 }),
  bounceIn: animate({
    from: "opacity-0 scale-50",
    to: "opacity-100 scale-100",
    duration: 400,
    easing: "cubic-bezier(0.34,1.56,0.64,1)",
  }),
  spinIn: animate({
    from: "opacity-0 rotate-180 scale-50",
    to: "opacity-100 rotate-0 scale-100",
    duration: 400,
    easing: "cubic-bezier(0.16,1,0.3,1)",
  }),
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Extract all animation CSS (for build-time injection)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all compiled animation CSS to inject into a stylesheet.
 * Called by the CSS extraction engine at build time.
 */
export function extractAnimationCss(): string {
  const lines: string[] = []
  for (const [, compiled] of _animRegistry) {
    lines.push(compiled.keyframesCss)
    lines.push(`.${compiled.className} { ${compiled.animationCss} }`)
  }
  return lines.join("\n\n")
}
