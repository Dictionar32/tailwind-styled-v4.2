# Scanner API

## `scanSource(source: string)`
Ekstrak class dari source code string dengan gabungan extractor compiler + AST JSX/TSX.

## `scanFile(filePath: string)`
Baca file dari disk lalu kembalikan:

```ts
{ file: string; classes: string[] }
```

## `scanWorkspace(rootDir, options)`
Scan direktori rekursif.

### Opsi penting
- `includeExtensions`
- `ignoreDirectories`
- `useCache` (default `true`)
- `cacheDir`

### Output
- `files`
- `totalFiles`
- `uniqueClasses`
