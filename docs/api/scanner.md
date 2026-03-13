# Scanner API

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
- `files`
- `totalFiles`
- `uniqueClasses`
