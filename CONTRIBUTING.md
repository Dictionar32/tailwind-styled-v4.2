# Contributing

Terima kasih sudah ingin berkontribusi ke **tailwind-styled-v4**.

## 1) Development setup

```bash
npm install
npm run build:packages
```

Opsional untuk validasi penuh monorepo:

```bash
npm run validate:final
```

## 2) Struktur project (ringkas)

- `packages/core` — API utama `tw`, `cv`, `cx`.
- `packages/compiler` — transform/compile pipeline.
- `packages/scanner` — scanning class source + cache.
- `packages/engine` — incremental/watch engine.
- `packages/analyzer` — analisis project dan report.
- `packages/vite` — integrasi Vite.
- `packages/cli` — command line tools.
- `native/` — scaffold native parser (N-API / Rust).
- `examples/` — contoh implementasi.

## 3) Workflow kontribusi

1. Buat branch dari branch aktif tim.
2. Implement perubahan kecil dan fokus.
3. Tambahkan/ubah test bila behavior berubah.
4. Jalankan validasi yang relevan.
5. Commit dengan pesan jelas, lalu buka PR.

## 4) Validasi minimum sebelum PR

```bash
npm run test -w packages/core
npm run build -w packages/compiler
npm run build -w packages/scanner
npm run build -w packages/engine
npm run build -w packages/vite
npm run build -w packages/cli
```

Jika menyentuh benchmark/ops docs, jalankan juga:

```bash
npm run bench:massive -- --root=test/fixtures/large-project --out=artifacts/scale/massive-local.json
```

## 5) Style guidelines

- Gunakan TypeScript strict mode.
- Hindari perubahan API publik tanpa catatan kompatibilitas.
- Dokumentasikan command baru di docs operasional.
- Pertahankan backward compatibility bila memungkinkan.

## 6) Commit & PR guidelines

- Gunakan commit message deskriptif (`feat:`, `fix:`, `docs:`, `chore:`).
- Jelaskan motivasi, perubahan, dan langkah validasi di PR.
- Jika perubahan menyentuh DX, sertakan contoh penggunaan.

## 7) Area kontribusi prioritas (v4.1)

- Rust parser default + fallback JS.
- Benchmark publik lintas OS/Node.
- Hardening example Next.js existing (`examples/standar-config-next-js-app`).
- Dokumentasi release/announcement.

## 8) Release process

### Prasyarat

- Memiliki akses publish package.
- `npm` sudah login (`npm whoami`).
- CI green pada branch release candidate.

### Checklist rilis

1. Sinkronkan versi di package yang relevan.
2. Pastikan changelog/release note diperbarui.
3. Jalankan validasi:

```bash
npm run validate:final
npm run validate:deps
npm run validate:pr5:gaps
```

4. Jalankan benchmark/regression yang diperlukan:

```bash
node scripts/regression/rust-parser.js
npm run bench:massive -- --root=test/fixtures/large-project --out=artifacts/scale/massive-release.json
```

5. Buat release PR dan minta review minimal 1 maintainer.
6. Setelah merge, tag release dan publish:

```bash
git tag v4.1.0
git push origin v4.1.0
npm publish --workspaces --access public
```
