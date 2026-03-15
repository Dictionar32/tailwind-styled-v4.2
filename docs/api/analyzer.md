# Analyzer API

## `analyzeWorkspace(root, options?)`
Menganalisis workspace dengan memanfaatkan scanner dan mengembalikan ringkasan:
- total file,
- jumlah class unik,
- total kemunculan class,
- top classes,
- duplicate class candidates.

## `analyzeScan(scan, root, topN?)`
Menganalisis hasil scan yang sudah tersedia tanpa menjalankan scan ulang.

## Tipe output
```ts
interface AnalyzerReport {
  root: string
  totalFiles: number
  uniqueClassCount: number
  totalClassOccurrences: number
  topClasses: Array<{ name: string; count: number }>
  duplicateClassCandidates: Array<{ name: string; count: number }>
}
```
