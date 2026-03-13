# Changelog

## v2.0.0 — Major Upgrade (Compiler-Driven)

### Breaking Changes

- **Removed `styled-components` dependency** — peer dep dihapus. Tidak perlu lagi install atau setup `StyledRegistry`.
- **`styledFactory`, `shouldForwardProp`, `blockProp`, `allowProp`** — dihapus (tidak relevan tanpa styled-components).
- **`propEngine`, `responsiveEngine`** — dipindahkan ke compiler. Tidak di-export dari runtime.
- **`ThemeContext`** — dihapus (styled-components theme system).

### New Features

- **Zero-runtime output** — `tw.div\`...\`` dikompilasi ke pure `React.forwardRef`. Tidak ada runtime class resolver.
- **Compiler-driven variants** — Variant config dikompilasi ke static lookup table. Runtime hanya `object["key"]`.
- **RSC-aware** — Auto detect server vs client components. Interactive classes auto-inject `"use client"` directive.
- **`withTailwindStyled()` plugin** — Next.js plugin dengan Turbopack + Webpack support.
- **`tailwindStyledPlugin()` Vite plugin** — Same compiler pipeline untuk Vite 5+.
- **Auto safelist** — Compiler scan semua source dan generate `.tailwind-styled-safelist.json`.
- **CLI generator** — `npx create-tailwind-styled` membuat project Next.js / Vite siap pakai.

### Preserved API (tidak berubah)

- `tw.div\`...\`` — template literal
- `tw.button({ base, variants, compoundVariants, defaultVariants })` — object config
- `Component.extend\`...\`` — extend component
- `tw(Component)\`...\`` — wrap any component
- `cv({ base, variants })` — standalone class variant function
- `cx()` / `cxm()` — class utilities
- `InferVariantProps<C>` — TypeScript type helper

### Performance

| Metric                  | v1      | v2       |
|-------------------------|---------|----------|
| Runtime bundle          | ~8–10kb | ~1.5kb   |
| Variant resolution      | Runtime | Compile  |
| Class merge             | Runtime | Compile  |
| styled-components dep   | Yes     | **No**   |
| RSC compatible          | No      | **Yes**  |

---

## v1.1.1

- Fix tw undefined in Next.js / Vite (Proxy → Object.assign)
- Fix TypeScript generic on template literals
- Add `.extend()` chaining
- Add `.withVariants()` for merging variant configs
- Add `cv()` standalone function
- Add zero-runtime AST transform (styled-components based)
- Add turbopack-loader and webpack-loader
- Add safelist generation via `swcPlugin`
