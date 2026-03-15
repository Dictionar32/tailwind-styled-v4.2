# 🎯 [Track A] Upgrade `tw transform` ke Buildable

## Gate Checklist
- [x] Build matrix hijau
- [x] Smoke test: `tw transform input.ts output.js` ✅
- [x] Fallback path: tanpa `oxc-transform` ✅
- [ ] Dokumentasi: `docs/cli/transform.md` - **PERLU DIISI**

## Tugas Agent
1. Buat file `docs/cli/transform.md`
2. Isi dengan format:

```markdown
# `tw transform`

## Deskripsi
Transform TypeScript/JSX ke JavaScript dengan Oxc.

## Usage
```bash
tw transform <input> [output]
```

## Known Limitations
- Hanya support JSX dan TSX.
- Target output selalu ES2015+.
- Native fallback ke Babel jika Oxc tidak tersedia.
```

3. Commit

## Verifikasi
- [ ] File docs sudah ada
- [ ] Isi sesuai template
