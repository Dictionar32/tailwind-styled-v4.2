# FAQ

## Apakah semua fitur roadmap sudah selesai?
Belum, roadmap dibagi fase bertahap. Fokus saat ini di core parser/theme/merge/styled + scanner/engine + CLI dasar.

## Kenapa ada lockfile berubah?
Karena ada perubahan dependency workspace agar package baru (scanner/engine/vite integration/cli) bisa di-resolve konsisten.

## Apakah wajib pakai Rust parser?
Tidak. Itu fase optimasi lanjutan (opsional). Default tetap JS path dengan fallback aman.
