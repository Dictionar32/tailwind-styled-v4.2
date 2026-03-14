# Scanner API

<<<<<<< ours
## `scanSource(source)`
Ekstrak class dari string source code. Menggabungkan extractor compiler + AST JSX/TSX.

## `scanFile(filePath)`
Baca file lalu kembalikan `{ file, classes }`.

## `scanWorkspace(rootDir, options)`
Scan direktori rekursif dengan opsi:
- `includeExtensions`
- `ignoreDirectories`
- `useCache`
- `cacheDir`

Hasil:
=======
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
>>>>>>> theirs
- `files`
- `totalFiles`
- `uniqueClasses`
