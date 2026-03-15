# 🎯 [Track A] Upgrade `tw lint` ke Buildable

## Gate Checklist
- [x] Build matrix hijau
- [x] Smoke test: `tw lint . 4` ✅
- [x] Fallback path: tanpa native ✅
- [ ] Dokumentasi: `docs/cli/lint.md` - **PERLU DIISI**

## Tugas Agent
1. Buat file `docs/cli/lint.md`
2. Isi dengan format:

```markdown
# `tw lint`

## Deskripsi
Lint file dengan paralel workers.

## Usage
```bash
tw lint [dir] [workers]
```

## Known Limitations
- Default workers = CPU cores.
- Native lint hanya untuk file `.ts`/`.tsx`.
- Fallback ke JS parser jika native tidak tersedia.
```

3. Commit

## Verifikasi
- [ ] File docs sudah ada
