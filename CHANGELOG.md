# Changelog

## Unreleased

### Added

- v4.1 backlog tracker di `docs/roadmap/v4.1-backlog.md`.
- Draft announcement v4.1 di `docs/blog/introducing-tailwind-styled-v4.1-draft.md`.
- Gunakan example Next.js existing di `examples/standar-config-next-js-app` sebagai baseline frontend untuk backlog v4.1 (tanpa folder example baru).

### Changed

- README menambahkan section Public Benchmark + referensi backlog v4.1.
- CONTRIBUTING diperluas dengan workflow kontribusi dan validasi benchmark terkait skala.
- Hardening existing Next.js frontend example (tanpa folder baru) dengan live token switching, cart state, dan container query demo.
- Scanner menambahkan jalur native-first (Rust binding) dengan fallback aman ke parser JS + debug flag `TWS_DEBUG_SCANNER=1`.
- Benchmark massive script diperbaiki agar reproducible di workspace (build order + import dist lokal untuk analyzer/engine/scanner).
- Menambahkan runbook demo v4.1 (`docs/ops/v4.1-demo-runbook.md`) dan script transcript CLI (`npm run demo:v41:cli`/`demo:v41:cli:fresh`) dengan output health summary + gap check + benchmark snapshot.

---

## v2.1.0-alpha.1 — Tailwind v4 Upgrade Path

### Added

- New workspace packages: `@tailwind-styled/scanner` and `@tailwind-styled/engine`.
- Core Tailwind v4 helpers: parser, CSS-first theme reader, merge layer, styled resolver.
- CLI phase upgrades: `init`, `scan`, `migrate`, and interactive `migrate --wizard`.
- Vite plugin build-end integration with scanner reports and optional engine build call.
- Native parser scaffold (`native/`) plus benchmark script (`benchmarks/native-parser-bench.mjs`).
- Release workflow/docs scaffold: `.github/workflows/publish-alpha.yml`, `RELEASE.md`, `ANNOUNCEMENT.md`.

### Notes

- Native parser remains optional and uses fallback strategy until binding is shipped in CI artifacts.

---

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
