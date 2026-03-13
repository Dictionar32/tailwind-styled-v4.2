# CLI Commands

## init

```bash
npx tailwind-styled init [dir]
```

Membuat file CSS-first:
- `src/tailwind.css`
- `tailwind-styled.config.json`

## scan

```bash
npx tailwind-styled scan [dir] --json
```

Menampilkan total file, jumlah class unik, dan top classes.

## migrate

```bash
npx tailwind-styled migrate [dir] --dry-run
npx tailwind-styled migrate [dir] --wizard
```

Menjalankan transform migrasi dasar untuk v4.
