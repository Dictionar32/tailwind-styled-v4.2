# Engine API

## `createEngine(config)`
Inisialisasi engine untuk orkestrasi scanner + compiler.

## `engine.build()`
<<<<<<< ours
Menjalankan build satu kali dan mengembalikan hasil kompilasi.

## `engine.watch()`
Menjalankan watch mode (chokidar) dan mengirim event:
- `initial`
- `change`
- `unlink`
=======
Menjalankan build sekali dan mengembalikan hasil kompilasi.

## `engine.watch()`
Menjalankan watcher (chokidar) dengan event:
- `initial`
- `change`
- `unlink`

Method ini mengembalikan handler yang memiliki `close()` untuk cleanup watcher.
>>>>>>> theirs
