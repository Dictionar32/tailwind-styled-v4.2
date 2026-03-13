# PR #5 Review Response — Architecture Reality Check & Next Steps

Dokumen ini merespons feedback teknis reviewer untuk PR #5, dengan fokus pada:
- status implementasi **aktual**,
- keputusan desain yang disengaja,
- backlog prioritas untuk penguatan jangka menengah.

## 1) Status Aktual (Sudah Ada)

### Scanner
- Traversal workspace rekursif sudah ada.
- Filtering extension + ignore dirs sudah ada.
- Ekstraksi class sudah jalan via `@tailwind-styled/compiler` (`extractAllClasses`).
- Implementasi saat ini menggunakan Node `fs/path` (tanpa `fast-glob`).

### Engine
- `createEngine()` sudah tersedia.
- `scan()` sudah tersedia.
- `build()` sudah tersedia untuk alur scan → merge class → optional CSS compile.

### CLI
- Command aktif: `init`, `scan`, `migrate`, `migrate --wizard`, `analyze`, `stats`, `extract`.
- Wizard interaktif berjalan via `readline/promises` native Node.js.

### Validation & Gate
- Validasi final: `npm run validate:final`.
- Ringkasan health: `npm run health:summary`.
- Konsistensi dependency matrix: `npm run validate:deps`.

## 2) Keputusan Desain Saat Ini (Disengaja)

- **Tanpa `commander`/`@inquirer/prompts`/`picocolors`** pada CLI.
  - Tujuan: minim dependency tree dan startup overhead.
- **Tanpa `fast-glob`** pada scanner saat ini.
  - Tujuan: baseline sederhana dan deterministik sebelum optimasi lanjutan.
- **Engine bergantung ke package internal** (`compiler` + `scanner`) alih-alih dependency langsung `postcss/tailwindcss`.
  - Tujuan: pemisahan concern agar surface area engine tetap kecil.

## 3) Gap yang Diakui & Backlog Prioritas

### P1 — Scanner Hardening
1. Tambah mode scanning berbasis glob teroptimasi (opsional, benchmark-driven).
2. Tambah fixture untuk file besar dan edge-case template literal.
3. Tambah laporan performa scanner pada validasi CI.

### P2 — Incremental DX
1. Tambah watch mode pada engine (incremental rebuild flow).
2. Tambah cache metadata scan (`.cache/tailwind-styled`) dengan hash/mtime.
3. Tambah invalidation strategy per-file.

### P3 — Analyzer Layer (Project-Aware)
1. Tambah package `@tailwind-styled/analyzer` (proposal).
2. Surface awal: top classes, duplicate pattern candidates, output JSON.
3. Integrasi command CLI tambahan berbasis report (non-breaking).

## 4) Non-goals (Saat Ini)

Agar scope PR #5 tetap terkendali, item berikut **tidak** dianggap selesai dalam PR ini:
- static extraction penuh lintas framework,
- visualizer/studio,
- plugin API ecosystem lengkap,
- native scanner production-ready.

## 5) Exit Criteria untuk Melanjutkan ke Fase Berikutnya

Sebelum menambah fitur besar baru:
1. `validate:final` dan `health:summary` harus PASS konsisten.
2. `validate:deps` harus PASS.
3. Scanner benchmark baseline terdokumentasi.
4. Tidak ada mismatch antara dokumentasi dependency dan manifest aktual.

---

Dokumen ini dimaksudkan sebagai referensi reviewer/maintainer agar diskusi tidak bercampur antara:
- **status implementasi saat ini**, dan
- **proposal arsitektur masa depan**.
