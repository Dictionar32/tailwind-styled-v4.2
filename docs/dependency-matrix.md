# Dependency Matrix (Aktual)

Dokumen ini merangkum dependency **aktual** berdasarkan `package.json` di repo saat ini.

## Root Monorepo
Sumber: `package.json`

- `@biomejs/biome` `^2.4.6`
- `@types/node` `^20`
- `@types/react` `^19`
- `oxlint` `^1.55.0`
- `tsup` `^8`
- `typescript` `^5`

## packages/core (`tailwind-styled-v4`)
Sumber: `packages/core/package.json`

### dependencies
- `postcss` `^8`
- `tailwind-merge` `^3`

### peerDependencies
- `react` `>=18`
- `react-dom` `>=18`

### peerDependenciesOptional
- `@tailwindcss/postcss` `^4`
- `tailwindcss` `^4`

### devDependencies
- `@tailwind-styled/animate` `*`
- `@types/node` `^20`
- `@types/react` `^19`
- `tsup` `^8`
- `typescript` `^5`

## packages/cli (`create-tailwind-styled`)
Sumber: `packages/cli/package.json`

### dependencies
- `@tailwind-styled/scanner` `*`

### devDependencies
- `@types/node` `^20`
- `tsup` `^8`
- `typescript` `^5`

## packages/vite (`@tailwind-styled/vite`)
Sumber: `packages/vite/package.json`

### dependencies
- `@tailwind-styled/compiler` `2.0.0`
- `@tailwind-styled/engine` `*`
- `@tailwind-styled/scanner` `*`

### peerDependencies
- `vite` `>=5`

### devDependencies
- `@types/node` `^20`
- `tsup` `^8`
- `typescript` `^5`
- `vite` `^5`

## packages/engine (`@tailwind-styled/engine`)
Sumber: `packages/engine/package.json`

### dependencies
- `@tailwind-styled/compiler` `*`
- `@tailwind-styled/scanner` `*`

### devDependencies
- `tsup` `^8`
- `typescript` `^5`

## packages/scanner (`@tailwind-styled/scanner`)
Sumber: `packages/scanner/package.json`

### dependencies
- `@tailwind-styled/compiler` `*`

### devDependencies
- `tsup` `^8`
- `typescript` `^5`

---

## Catatan penting
- Paket seperti `clsx`, `commander`, `@inquirer/prompts`, `fast-glob`, `@rspack/core`, `@napi-rs/cli`, `@swc/core`, `autoprefixer`, dan `vitest` **tidak tercantum** pada file `package.json` paket yang diringkas di atas pada state saat ini.
- Untuk validasi readiness rilis, gunakan:
  - `npm run validate:final`
  - `npm run health:summary`

## Status Implementasi (Diverifikasi dari Source)

### CLI (`packages/cli`)
- **Sudah implementasi**, bukan skeleton: command router untuk `init`, `scan`, `migrate`, `analyze`, `stats`, `extract` aktif di `src/index.ts`.
- `scan` sudah memanggil scanner dan bisa output JSON/top classes.
- `migrate` + `--wizard` sudah berjalan via `readline/promises` (tanpa dependency eksternal `commander`/`inquirer`).

### Scanner (`packages/scanner`)
- **Sudah implementasi** traversal workspace rekursif, filter extension, ignore dirs, scan file, dan agregasi unique class.
- Implementasi memakai Node `fs/path` + `extractAllClasses` dari compiler, **bukan** `fast-glob`.

### Engine (`packages/engine`)
- **Sudah implementasi** `createEngine()`, `scan()`, dan `build()` untuk alur scan → merge class → optional compile CSS.
- Integrasi dilakukan lewat `@tailwind-styled/compiler` + `@tailwind-styled/scanner`, sehingga tidak perlu dependency `postcss/tailwindcss` langsung di package engine.

### Catatan
- Ketidakhadiran package seperti `commander`, `@inquirer/prompts`, `picocolors`, `fast-glob` adalah keputusan implementasi saat ini, bukan bukti fitur belum ada.

