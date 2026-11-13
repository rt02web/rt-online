# Panduan Instalasi RT ONLINE
**Sistem Informasi & Administrasi Warga RT02/RW29 Gading Elok 1**

Aplikasi ini terdiri dari dua bagian:

| Bagian | Isi | Dipasang di |
|---|---|---|
| **Backend** | 7 berkas `.gs` + `appsscript.json` | Google Apps Script (akun Google pengurus) |
| **Frontend** | Folder `rt-online-frontend` (dari ZIP) | GitHub Pages |

Kerjakan **berurutan**: backend dulu (untuk mendapat URL), baru frontend.

---

## BAGIAN A — Backend (Google Apps Script)

> Gunakan akun Google milik RT (bukan akun pribadi yang bisa hilang). Semua data Sheets & Drive akan dibuat di akun ini.

### A1. Buat proyek
1. Buka **https://script.google.com** → **Proyek baru**.
2. Klik judul "Proyek tanpa judul" → ganti menjadi **RT ONLINE**.

### A2. Tampilkan & isi manifest `appsscript.json`
1. Klik ikon ⚙️ **Setelan Proyek** (kiri) → centang **"Tampilkan file manifes 'appsscript.json' di editor"**.
2. Kembali ke **Editor** (ikon `< >`), buka `appsscript.json`, hapus isinya, tempel isi berkas **appsscript.json**. Simpan (Ctrl+S).

### A3. Tempel 7 berkas kode
Klik **+** di samping "File" → **Skrip**, beri nama persis seperti di bawah (tanpa `.gs`), lalu tempel isinya:

| Nama file di editor | Tempel isi berkas |
|---|---|
| `Kode` (ganti nama `Code` bawaan) | `Kode.gs` |
| `Auth` | `Auth.gs` |
| `Warga` | `Warga.gs` |
| `Pengaturan` | `Pengaturan.gs` |
| `Keuangan` | `Keuangan.gs` |
| `Layanan` | `Layanan.gs` |
| `Notif` | `Notif.gs` |

Simpan semua (Ctrl+S).

### A4. Jalankan `setupAppEnvironment` — **HANYA SEKALI**
1. Buka file `Kode`. Di bilah atas, pilih fungsi **setupAppEnvironment** → klik **▶ Jalankan**.
2. Muncul "Otorisasi diperlukan" → **Tinjau izin** → pilih akun → **Lanjutan** → **Buka RT ONLINE (tidak aman)** → **Izinkan**.
   *(Peringatan "tidak aman" wajar untuk skrip buatan sendiri.)*
3. Tunggu ±1–2 menit. Buka **Log eksekusi** di bawah. Harus muncul:
   - `✅ SETUP SELESAI` beserta tautan Spreadsheet & Folder Drive
   - **`🔐 LOGIN ADMINISTRATOR`** → **Username: admin** dan **Password: ……**
4. **CATAT PASSWORD ADMIN SEKARANG.** Password ini hanya tampil sekali di log.

Yang otomatis dibuat:
- Folder Drive **RT ONLINE** berisi subfolder `Logo_Foto`, `Bukti_Transfer`, `Surat_PDF`, `Template_Dokumen`, `Galeri`, `Notulen`, `Pengaduan`, `Backup_Excel`, dll.
- Spreadsheet **Database — RT ONLINE** dengan semua tab (Rumah, Anggota, Pengguna, Tagihan, Pembayaran, Transaksi_Kas, Surat, Log_Aktivitas, AntrianNotif, dst.)
- 5 template surat Google Docs (Pengantar, Domisili, SKCK, SKTM, Usaha) dengan kop logo-tengah + garis ganda
- Salt password & secret sesi di **Script Properties** (tidak pernah dikirim ke frontend)
- Trigger: antrean WhatsApp (1 menit, berhenti sendiri saat kosong), pengingat harian, cadangan Excel mingguan (Minggu 02.00)

> ✅ **Bila setup berhenti karena error** (misalnya koneksi putus): perbaiki penyebabnya, lalu **jalankan lagi `setupAppEnvironment`**. Setup otomatis melanjutkan dari langkah yang belum selesai — tidak membuat folder atau spreadsheet ganda.
> Lupa password admin? Pilih fungsi **`resetPasswordAdmin`** → ▶ Jalankan → password baru tampil di log.

### A5. Deploy sebagai Web App
1. Klik **Terapkan** (Deploy) → **Deployment baru**.
2. Ikon ⚙️ di "Pilih jenis" → **Aplikasi web**.
3. Isi:
   - Deskripsi: `v1`
   - **Jalankan sebagai: Saya**
   - **Yang memiliki akses: Siapa saja** (Anyone)
4. **Terapkan** → salin **URL aplikasi web** (berakhiran `/exec`).

> Keamanan tidak bergantung pada "Siapa saja": setiap permintaan diperiksa token sesi bertanda tangan + peran di server.

### A6. Uji cepat
Buka `URL_EXEC?action=ping` di browser. Harus tampil `{"success":true,"data":{"waktu":"…"}}`.

---

## BAGIAN B — Frontend (GitHub Pages)

### B1. Ekstrak ZIP
Ekstrak **rt-online-frontend.zip**. Hasilnya folder **`rt-online-frontend`** berisi:

```
rt-online-frontend/        ← INI folder yang dipilih di GitHub Desktop / diseret ke Netlify
├── index.html             ← harus terlihat langsung di sini
├── README.md
├── PANDUAN-INSTALASI.md
├── assets/
├── css/style.css
└── js/ (config.js, api.js, ui.js, app.js, publik.js, panel.js, warga.js, keuangan.js, layanan.js, admin.js)
```

### B2. Isi URL backend — WAJIB sebelum upload
Buka `js/config.js` dengan Notepad (klik kanan → Buka dengan → Notepad), ganti:
```js
GAS_URL: 'https://script.google.com/macros/s/GANTI_DENGAN_ID_DEPLOYMENT/exec',
```
dengan URL `/exec` dari langkah A5. Simpan.

### B3. (Opsional) Logo & foto gerbang cadangan
Letakkan `logo.png` (versi transparan) dan `gerbang.jpg` di folder `assets/`. Ini hanya cadangan — sumber utama adalah unggahan di menu **Identitas & Pengurus** setelah login admin.

### B4. Online-kan tanpa terminal — pilih salah satu

Kedua cara di bawah **tidak memakai terminal/PowerShell sama sekali** dan **menjaga struktur folder `css/` dan `js/`** (jadi tampilan tidak rusak).

---

#### ⭐ Cara 1 — GitHub Desktop (hasil: GitHub Pages, sama persis dengan rencana awal)

**a. Pasang & login**
1. Unduh **GitHub Desktop**: https://desktop.github.com → pasang seperti aplikasi biasa.
2. Buka GitHub Desktop → **Sign in to GitHub.com** → browser terbuka → login akun GitHub → **Authorize** → kembali ke aplikasi.
   *(Tidak perlu token. Bila belum punya akun, daftar dulu di github.com — username akan menjadi bagian alamat situs.)*
3. Bila diminta "Configure Git", biarkan nama & email terisi → **Finish**.

**b. Jadikan folder sebagai repository**
1. Menu **File → Add local repository…**
2. Klik **Choose…** → pilih folder **`rt-online-frontend`** (folder yang di dalamnya langsung ada `index.html`) → **Select Folder**.
3. Muncul tulisan *"This directory does not appear to be a Git repository"* → klik tautan **create a repository**.
4. Name: `rt-online` → **jangan ubah Local path** → **Create repository**.

> ⚠️ Cek: di kolom kiri GitHub Desktop (tab *Changes* / *History*) harus terlihat `index.html`, `css/style.css`, `js/app.js`, dst. Kalau yang terlihat `rt-online-frontend/index.html`, berarti folder yang dipilih satu tingkat terlalu atas — hapus dari daftar (*Repository → Remove*) lalu ulangi memilih folder yang benar.

**c. Unggah ke GitHub**
1. Klik tombol biru **Publish repository** (kanan atas).
2. **Hilangkan centang "Keep this code private"** (GitHub Pages gratis hanya untuk repository publik — aman, berkas frontend tidak memuat password apa pun).
3. Klik **Publish repository**. Tunggu sampai selesai.

**d. Aktifkan GitHub Pages**
1. Di GitHub Desktop: **Repository → View on GitHub** (browser terbuka ke repo Anda).
2. Pastikan di halaman repo terlihat `index.html`, folder `css`, folder `js` di daftar teratas.
3. Klik tab **Settings** → menu kiri **Pages**.
4. Source: **Deploy from a branch** · Branch: **main** · folder **/ (root)** → **Save**.
5. Tunggu 1–2 menit lalu refresh halaman Pages. Muncul: **"Your site is live at https://USERNAME.github.io/rt-online/"**. Centang **Enforce HTTPS** bila tersedia.

**e. Cara memperbarui di kemudian hari**
1. Ubah berkas di folder `rt-online-frontend` (misalnya `js/config.js`).
2. Buka GitHub Desktop → perubahan otomatis tampil di tab **Changes**.
3. Isi kotak **Summary** (kiri bawah), mis. `Perbarui config` → klik **Commit to main**.
4. Klik **Push origin** (atas). Situs diperbarui dalam 1–2 menit → buka dengan **Ctrl+Shift+R**.

---

#### Cara 2 — Netlify Drop (paling cepat, cukup seret folder di browser)

Cocok bila tidak bisa memasang aplikasi apa pun di laptop. Hasilnya sama: situs online dengan HTTPS, hanya alamatnya berakhiran `.netlify.app` (bukan `github.io`).

1. Buka **https://app.netlify.com/signup** → daftar/masuk (bisa pakai akun GitHub atau email). *Login dulu agar situs tersimpan permanen.*
2. Buka **https://app.netlify.com/drop**.
3. Buka File Explorer, lalu **seret folder `rt-online-frontend` utuh** (foldernya, bukan isinya satu per satu) ke kotak *"Drag and drop your project folder here"*.
4. Tunggu beberapa detik → muncul alamat seperti `https://nama-acak-123.netlify.app`. Buka untuk mencoba.
5. Ganti nama alamat: **Site configuration → Change site name** → mis. `rt02-gadingelok` → menjadi `https://rt02-gadingelok.netlify.app`.

**Memperbarui:** buka situs Anda di dashboard Netlify → tab **Deploys** → seret ulang folder `rt-online-frontend` ke kotak *"Need to update your site? Drag and drop…"*.

---

### B5. Setelah situs online
Salin alamat situs (github.io atau netlify.app). Alamat ini nanti diisi di **Nominal & Pengaturan → URL portal** agar tautan di pesan WhatsApp mengarah ke situs Anda.

---

## BAGIAN C — Pengaturan awal (setelah situs aktif)

Login → **Masuk sebagai Administrator** → username `admin` + password dari log → wajib ganti password.

| No | Menu | Yang dilakukan |
|---|---|---|
| 1 | **Identitas & Pengurus** | Unggah logo transparan & foto gerbang. Isi **nama Ketua RT, Sekretaris, 4 Bendahara** + masa jabatan (otomatis masuk ke surat & laporan). |
| 2 | **Nominal & Pengaturan** | Cek IPL Rp70.000, isi **Rekening RT**, nominal jimpitan mingguan, alokasi kas, dan **URL portal** (alamat GitHub Pages, untuk tautan di pesan WA). |
| 3 | **Impor Data Warga (Excel)** | Unggah `Data_Warga_RT02.xlsx` → periksa pratinjau → konfirmasi. Bisa diulang tanpa data ganda. |
| 4 | **Manajemen Akun → Buat akun warga** | Password awal unik per rumah tampil sekali → **Unduh Excel** → bagikan pribadi ke tiap rumah. |
| 5 | **Manajemen Akun → Akun pengurus** | Buat 6 akun (ketua, sekretaris, 4 bendahara). Catat password awal masing-masing. |
| 6 | **Integrasi Fonnte** | Tempel token Fonnte → **Uji kirim** ke nomor sendiri. |
| 7 | **Template & Jadwal WA** | Sesuaikan kalimat pesan bila perlu. |
| 8 | **Jenis Surat & Template** | Buka template di Google Docs bila ingin menyunting redaksi surat. |

Cara login warga: **Blok + Nomor Rumah + password**. Pengurus: **username + password**.

---

## BAGIAN D — Memperbarui backend tanpa mengganti URL
Setelah mengubah kode `.gs`: **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan.** URL `/exec` tetap sama, frontend tidak perlu diubah.
(Jangan pilih "Deployment baru" — itu menghasilkan URL baru.)

---

## Pemecahan masalah

| Gejala | Penyebab & solusi |
|---|---|
| Halaman login: "URL backend belum diatur" | `GAS_URL` di `js/config.js` masih contoh. Isi lalu push ulang. |
| "Respons server tidak valid" | Web App belum di-deploy dengan akses **Siapa saja**, atau URL bukan yang `/exec`. |
| "Aplikasi belum di-setup" | `setupAppEnvironment` belum dijalankan / gagal. Cek log eksekusi. |
| Situs GitHub 404 | `index.html` tidak di root repo (folder yang dipilih di GitHub Desktop salah). Hapus repo dari GitHub Desktop, pilih ulang folder `rt-online-frontend`, publish lagi. |
| Tampil tanpa warna/gaya | Berkas diunggah satu per satu sehingga folder `css/` dan `js/` hilang. Gunakan GitHub Desktop atau seret **folder utuh** ke Netlify Drop. |
| Error `Cannot read properties of null (reading 'setAlignment')` saat setup | Sudah diperbaiki di `Pengaturan.gs` versi terbaru. Ganti isi `Pengaturan.gs` dan `Kode.gs`, simpan, lalu jalankan lagi `setupAppEnvironment`. |
| WhatsApp tidak terkirim | Token Fonnte belum diisi, perangkat Fonnte terputus, atau nomor rumah kosong/tidak valid. Lihat menu **Integrasi Fonnte → Gagal**. |
| Lupa password admin | Di editor Apps Script pilih fungsi **`resetPasswordAdmin`** → ▶ Jalankan → password baru tampil di Log eksekusi. |
| Akun terkunci | Tunggu 15 menit, atau admin **Reset** password akun tersebut. |

## Batasan teknis yang perlu diketahui
- Kuota Apps Script akun Google gratis: ±20.000 panggilan UrlFetch/hari (cukup untuk WA RT), eksekusi maks 6 menit per proses. Batas pesan WA per hari diatur di **Nominal & Pengaturan** (default 300).
- Status WA "terkirim" berarti pesan **diterima API Fonnte**, bukan berarti sudah dibaca warga.
- Cadangan Excel otomatis tiap Minggu di folder `Backup_Excel`.
