# RuangIDB

**Cari Ruang. Atur Kegiatan. Semua Lebih Mudah.**

RuangIDB adalah prototipe platform reservasi ruangan kampus untuk Institut Desain dan Bisnis Bali (IDB Bali). Mahasiswa dapat mencari ruang, melihat ketersediaan, mengajukan reservasi, dan memantau status. Admin kampus dapat meninjau permohonan, memeriksa konflik jadwal, mengambil keputusan, serta mengelola data ruang.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Buka `http://127.0.0.1:5173/`.

Build produksi:

```bash
npm run build
npm run preview
```

> Di Windows dengan npm 11, gunakan `npm.cmd` bila perlu. Jika instalasi memblokir postinstall esbuild, jalankan `npm.cmd install-scripts approve esbuild` lalu `npm.cmd rebuild esbuild`.

## Akun demo

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Mahasiswa | `dhea@idb.ac.id` | `ruangidb` |
| Admin kampus | `admin@idb.ac.id` | `ruangidb` |

Tombol akun demo di halaman masuk dapat mengisi formulir secara otomatis.

## Alur utama

- **Mahasiswa:** Beranda → Daftar Ruang → Detail Ruang → Form Reservasi → Reservasi Saya → Detail & Status → Profil.
- **Admin:** Dashboard → Kelola Permohonan → Detail Pengajuan → Setujui/Tolak → Kelola Ruang → Log Aktivitas.

Sistem memeriksa konflik jadwal dua kali: saat mahasiswa mengajukan dan saat admin menyetujui. Dua permohonan yang menunggu boleh bertumpuk, tetapi permohonan kedua akan diblokir jika permohonan pertama sudah disetujui pada slot yang sama. Sistem tidak menyetujui permohonan secara otomatis.

## Identitas visual

- Header dan footer institusional dipakai di seluruh halaman mahasiswa dan admin melalui `AppShell`.
- Logo resmi IDB Bali memakai `public/brand/idb-bali-logo.png`.
- Foto gedung kampus memakai `public/campus/gedung-idb-bali.jpg`.
- Palet dan tipografi mengacu pada tampilan situs resmi IDB Bali: warna utama `#024D71`, aksen `#F17711`, serta Montserrat untuk judul dan Inter untuk teks UI. Nilai ini dipakai sebagai referensi visual, bukan klaim spesifikasi merek resmi.
- Kartu ruangan tetap memakai denah placeholder yang jujur sampai foto ruangan resmi tersedia.

## Kategori ruangan

Sepuluh kategori yang tersedia di formulir admin dan filter mahasiswa:

1. Lab Komputer
2. Lab iMac
3. Lab Fashion Design
4. Ruang Kelas
5. Ruang Kelas S2
6. Studio Foto
7. Aula
8. Gedung Serba Guna
9. Ruang Asistensi
10. Studio Pola

Kategori disimpan pada properti `category` di data ruangan. Data lama yang belum memiliki kategori akan diinferensi saat dimuat agar penyimpanan demo tetap kompatibel. Data seed saat ini berisi 21 ruangan resmi: 8 Ruang Kelas, Aula, Ruang Asistensi, 5 Lab Komputer, Gedung Serba Guna, Studio Foto, Lab iMac B.1.1, Lab Fashion Design B.1.2, Ruang Kelas S2, dan Studio Pola.

Setiap kategori memiliki foto fasilitas di `public/rooms/`, diambil dari halaman resmi Fasilitas Kampus IDB Bali. Ruangan yang belum memiliki foto asli memakai foto fasilitas kategori yang sama, dengan badge **Foto fasilitas IDB** dan kredit sumber. Foto ini bukan klaim foto spesifik setiap ruangan.

## Fitur dashboard

- **Mahasiswa:** hero “Selamat Datang di RuangIDB”, pencarian nama/kode ruang, tanggal, jam mulai/selesai, dan jenis ruangan; kartu ruang dengan status ketersediaan; ringkasan serta pengajuan terbaru.
- **Admin:** ringkasan reservasi, filter status/tanggal/ruang/pencarian, aksi setujui dan tolak langsung dari tabel, konfirmasi keputusan, alasan penolakan wajib minimal 10 karakter, dan akses pengelolaan ruang.
- **Ketersediaan:** daftar ruangan diurutkan dengan ruangan tersedia lebih dulu. Reservasi yang disetujui membuat slot tidak tersedia; pengajuan yang menunggu ditandai sebagai potensi bentrok, bukan reservasi final.
- Pencarian mahasiswa memakai tanggal hari ini secara default dan slot dua jam terdekat. Jika waktu hari ini sudah lewat, pilih tanggal lain.

## Surat peminjaman PDF

Setelah pengajuan disetujui, mahasiswa dapat membuka **Buka Surat PDF** dari detail pengajuan atau **Surat PDF** dari Reservasi Saya. Halaman surat memuat nomor pengajuan, data pemohon, ruang, lokasi, jadwal, peserta, kegiatan, status persetujuan, dan area tanda tangan.

Gunakan tombol **Cetak / Simpan PDF** pada halaman surat. Dialog cetak browser dapat menyimpan halaman sebagai PDF A4. Salinan fisik surat kemudian diserahkan ke Bagian Akademik. Sistem belum melacak status penyerahan fisik tersebut.

## Data dan penyimpanan

- Data awal bersifat **sintetis** dan disimpan di `localStorage` dengan kunci `ruangidb.v1`.
- Tanggal seed dibuat relatif terhadap hari ini agar demo tetap relevan.
- Data ruangan versi lama dimigrasikan ke 21 ruang resmi. Riwayat Ruang Seminar dipetakan ke Ruang Kelas A.1.2; riwayat Ruang Rapat Bisnis dan Ruang Diskusi 3 dipetakan ke Ruang Asistensi. Log migrasi dicatat di Aktivitas.
- Tidak ada backend terpisah pada prototipe ini. Validasi konflik jadwal dijalankan di store sebelum pengajuan disimpan dan diperiksa ulang saat admin menyetujui.
- Reset data demo melalui **Profil → Reset data demo**, atau hapus `localStorage` di browser.
- Autentikasi, data pengguna, dan data ruangan ini hanya untuk prototipe, bukan untuk produksi.

## Aset

- Logo resmi IDB Bali: `public/brand/idb-bali-logo.png`.
- Foto kampus terverifikasi: `public/campus/gedung-idb-bali.jpg`.
- Font self-hosted: `public/fonts/Montserrat.woff2` dan `public/fonts/Inter.woff2`.
- Foto fasilitas resmi IDB Bali: `public/rooms/`. Setiap kategori memiliki satu foto fasilitas; ruangan tanpa foto asli otomatis memakai foto kategorinya melalui `RoomThumb`.
- Badge **Foto fasilitas IDB** dan keterangan sumber ditampilkan agar foto fasilitas tidak diklaim sebagai foto spesifik setiap ruangan. Kredit lengkap ada di `public/rooms/CREDITS.md`.
- Untuk memakai foto asli per ruangan, tambahkan berkas ke `public/rooms/` dan isi kolom **URL foto** pada form ruang admin (contoh: `/rooms/ruang-kelas-a-1-2.jpg`). Setelah itu badge dan keterangan sumber tidak ditampilkan untuk ruangan tersebut.

## Teknologi

- Vite + React 19 + TypeScript
- React Router 7
- CSS buatan sendiri (tanpa framework UI)
- Montserrat untuk display dan Inter untuk UI
- Lapisan gaya khusus dashboard dan shell institusional di `src/styles/campus.css`, dimuat setelah gaya lama agar alur reservasi tetap stabil

## Catatan aksesibilitas

- Navigasi utama memakai skip link, landmark, dan label yang jelas.
- Modal memiliki focus trap, focus restore, Escape untuk menutup, serta `aria-labelledby`/`aria-describedby`.
- Drawer mobile menangani focus trap, Escape, pengembalian fokus, dan tidak dirender saat tertutup.
- Filter kategori memakai tombol dengan `aria-pressed`; hasil pencarian diumumkan melalui `aria-live`.
- Audit axe-core pada dashboard mahasiswa dan admin tidak menemukan pelanggaran otomatis. Teks di atas foto kampus tetap memerlukan tinjauan kontras manual.

## Struktur singkat

```
src/
  components/   AppShell, UI, ikon, thumbnail ruangan
  lib/          seed, store, availability, kategori, format, types
  pages/        Login, halaman mahasiswa, halaman admin
  styles/       token, base, komponen, halaman, campus
public/
  brand/        logo resmi
  campus/       foto gedung kampus
  fonts/        font self-hosted
  rooms/        foto fasilitas resmi + kredit
```
