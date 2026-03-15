# VSCode Extension API

Dokumen ini menjelaskan fitur dasar paket `@tailwind-styled/vscode`.

## Command

### `tailwindStyled.analyzeWorkspace`

Menjalankan analyzer pada workspace aktif dan menampilkan ringkasan hasil ke notification serta detail JSON ke output channel **Tailwind Styled**.

Output ringkas mencakup:
- jumlah file yang dianalisis,
- jumlah class unik,
- total kemunculan class,
- tiga class paling sering muncul.

## Aktivasi

Extension aktif saat command `tailwindStyled.analyzeWorkspace` dipanggil.

## Error handling

- Jika workspace belum dibuka, extension menampilkan warning.
- Jika proses analisis gagal, extension menampilkan error message dengan detail singkat.

## Catatan implementasi

- Analyzer memakai API `analyzeWorkspace` dari `@tailwind-styled/analyzer`.
- Workspace root diambil dari folder pertama pada `vscode.workspace.workspaceFolders`.
- Output channel dipakai ulang antar-eksekusi command.
