# 🎯 [Track A] Upgrade `tw parse` ke Buildable

## Gate Checklist
- [x] Build matrix hijau (CI sudah jalan)
- [x] Smoke test: `tw parse src/test.tsx` ✅
- [x] Fallback path: tanpa `oxc-parser` ✅
- [ ] Dokumentasi: `docs/cli/parse.md` - **PERLU DIISI**

## Tugas Agent
1. Buat file `docs/cli/parse.md`
2. Isi dengan format:

```markdown
# `tw parse`

## Deskripsi
Parse file dengan Oxc engine (fallback JS).

## Usage
```bash
tw parse <file>
```

## Known Limitations
- Hanya mendukung file `.tsx`, `.jsx`, `.ts`, `.js`.
- File > 1MB mungkin lambat.
- Native Oxc hanya tersedia di platform tertentu (fallback otomatis ke JS).
```

3. Commit dengan pesan: `docs(parse): add known limitations for tw parse`

## Verifikasi
- [ ] File `docs/cli/parse.md` sudah ada
- [ ] Isi sesuai template
- [ ] Build matrix masih hijau setelah commit
