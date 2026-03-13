# Migration Guide (v3 -> v4)

## Quick steps

1. Jalankan dry-run terlebih dulu:

```bash
npx tailwind-styled migrate ./src --dry-run
```

2. Jalankan migrasi nyata:

```bash
npx tailwind-styled migrate ./src
```

3. Untuk mode interaktif:

```bash
npx tailwind-styled migrate ./src --wizard
```

## Transform otomatis saat ini

- `tailwind-styled-components` -> `tailwind-styled-v4`
- `flex-grow` -> `grow`
- `flex-shrink` -> `shrink`
- Bootstrap `src/tailwind.css` (CSS-first) jika belum ada

## Catatan

Setelah migrasi, review manual tetap dibutuhkan untuk kelas/utility lain yang berubah di Tailwind v4.
