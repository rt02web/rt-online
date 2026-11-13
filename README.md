# RT ONLINE — RT02/RW29 Gading Elok 1

Frontend statis (HTML/CSS/JS murni) Sistem Informasi & Administrasi Warga RT02/RW29 Perumahan Gading Elok 1, Karawang Wetan. Backend: Google Apps Script sebagai REST API (data di Google Sheets, berkas di Google Drive, notifikasi WhatsApp via Fonnte).

## Struktur
```
index.html        Kerangka aplikasi (SPA, rute berbasis #hash)
css/style.css     Sistem desain "Civic Horizon" (navy #033A65, hijau #84C534)
js/config.js      ← ISI GAS_URL (URL Web App /exec) sebelum deploy
js/api.js         Pemanggilan backend (POST text/plain, token sesi)
js/ui.js          Komponen: ikon, modal, toast, form, grafik, Excel
js/app.js         Router, tata letak publik & panel, menu per peran
js/publik.js      Beranda, pengumuman & notulen, agenda, galeri, profil, login
js/panel.js       Dashboard per peran, akun
js/warga.js       Tagihan & bayar, riwayat, surat, pengaduan, data keluarga
js/keuangan.js    Penerbitan, verifikasi, tunai, buku kas, jimpitan, bansos, laporan
js/layanan.js     Kotak surat Ketua RT, pengaduan, konten Sekretaris
js/admin.js       Data warga, impor Excel, akun, pengaturan, WA, log
assets/           (opsional) logo.png & gerbang.jpg cadangan
```

## Peran
Publik · Warga · Ketua RT · Sekretaris · Bendahara Kas Umum / Pembangunan / Jimpitan / Sosial · Administrator.

Lihat **PANDUAN-INSTALASI.md** untuk langkah lengkap.
