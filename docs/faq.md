# FAQ

## Apakah semua fitur roadmap sudah selesai?
Belum. Roadmap dibagi fase bertahap. Fokus saat ini di core parser/theme/merge/styled + scanner/engine + CLI dasar.

## Kenapa ada lockfile berubah?
Karena ada perubahan dependency workspace agar package baru (scanner/engine/vite integration/cli) bisa di-resolve konsisten.

## Apakah wajib pakai Rust parser?
Tidak. Itu fase optimasi lanjutan (opsional). Default tetap JS path dengan fallback aman.

## Apa yang harus ditingkatkan agar bisa digunakan semua orang?
Agar adopsi lebih luas (pemula sampai tim enterprise), prioritas peningkatan yang paling berdampak adalah:

1. **Onboarding 5 menit (copy-paste ready)**
   - Sediakan 1 jalur cepat per ekosistem: Next.js, Vite, Rspack.
   - Setiap jalur wajib punya langkah install, config minimum, dan contoh komponen pertama.

2. **Reliability lintas environment**
   - Uji resmi di Node 18/20/22 pada Linux/macOS/Windows.
   - Tambahkan preflight check di CLI untuk mendeteksi dependency belum terpasang (mis. plugin bundler), lalu tampilkan saran perbaikan yang jelas.

3. **Error message yang manusiawi**
   - Semua error umum harus punya:
     - penyebab,
     - dampak,
     - langkah perbaikan 1–2 baris,
     - tautan ke halaman docs terkait.

4. **Dokumentasi berbahasa ganda (ID + EN)**
   - Minimal untuk halaman: getting started, migrasi, troubleshooting, dan CLI.
   - Ini penting agar bisa dipakai tim global, komunitas lokal, dan pembelajar baru.

5. **Aksesibilitas default komponen contoh**
   - Semua snippet contoh menyertakan praktik a11y dasar (`aria-*`, focus state, semantic HTML).
   - Tambahkan checklist a11y di docs supaya developer tidak perlu menebak.

6. **Stabilitas migrasi dari versi lama**
   - Perluas aturan `migrate --dry-run` dan berikan ringkasan perubahan yang mudah dipahami.
   - Sediakan “known limitations” secara eksplisit agar ekspektasi tim realistis sebelum migrasi.

7. **Template starter resmi**
   - Publish starter repo per stack (next/vite/rspack) dengan CI hijau.
   - Pengguna bisa langsung `degit`/`create` lalu jalan tanpa setup manual panjang.

Jika tujuh area ini konsisten ditingkatkan, paket akan lebih mudah dipakai oleh pemula, tim produk kecil, maupun organisasi besar.

## Apakah status "missing: 0" berarti semua roadmap selesai 100%?
Tidak.

`missing: 0` pada `validate:pr5:gaps` hanya berarti daftar checklist audit PR5 saat ini sudah terpenuhi. Itu **bukan** indikator bahwa seluruh roadmap multi-fase sudah selesai.

Contoh item yang masih bisa berada di backlog roadmap meskipun gap-check sudah hijau:
- hardening watch mode untuk edge-case skala besar,
- strategi invalidasi + observability metric,
- pengayaan ekosistem plugin/analyzer,
- inisiatif milestone lanjutan (mis. tooling/editor integration).

Jadi, baca status dengan urutan berikut:
1. Gate kualitas saat ini (`validate:final`, `health:summary`, `validate:pr5:gaps`).
2. Status milestone roadmap jangka menengah/panjang.
