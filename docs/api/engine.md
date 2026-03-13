# Engine API

## `createEngine(config)`
Inisialisasi engine untuk orkestrasi scanner + compiler.

## `engine.build()`
Menjalankan build satu kali dan mengembalikan hasil kompilasi.

## `engine.watch()`
Menjalankan watch mode (chokidar) dan mengirim event:
- `initial`
- `change`
- `unlink`
