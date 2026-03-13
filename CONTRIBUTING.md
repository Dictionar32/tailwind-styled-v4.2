# Contributing

Terima kasih sudah ingin berkontribusi ke tailwind-styled-v4.

## Development setup

```bash
npm install
npm run build:packages
```

## Validation minimum sebelum PR

```bash
npm run test -w packages/core
npm run build -w packages/compiler
npm run build -w packages/scanner
npm run build -w packages/engine
npm run build -w packages/vite
npm run build -w packages/cli
```

## Style guidelines

- Gunakan TypeScript strict mode.
- Tambahkan tests untuk perubahan behavior.
- Pertahankan backward compatibility bila memungkinkan.

## Commit/PR

- Gunakan commit message jelas (`feat:`, `fix:`, `docs:`).
- Jelaskan motivasi, perubahan, dan validasi di PR.
