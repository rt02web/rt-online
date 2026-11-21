/**
 * api.js — Komunikasi dengan backend Google Apps Script (REST JSON)
 * ------------------------------------------------------------
 * Agar perpindahan halaman cepat & tidak gagal memuat:
 * 1. Cache di browser (stale-while-revalidate): halaman yang pernah dibuka tampil instan,
 *    data diperbarui diam-diam di latar belakang.
 * 2. Penggabungan otomatis: beberapa permintaan baca yang terjadi bersamaan
 *    dikirim dalam SATU panggilan ke GAS (aksi "multi").
 * 3. Percobaan ulang otomatis (maks 2x) bila jaringan putus / server GAS sibuk.
 * 4. Batas waktu 30 detik per permintaan.
 * 5. Data publik lewat GET (sesuai pola gas-pro-api), aksi lain lewat POST text/plain.
 * 6. Setiap penulisan data menandai cache "basi": halaman yang sedang dibuka langsung memuat data
 *    terbaru, halaman lain tetap tampil instan lalu diperbarui di latar belakang (v1.4).
 * 7. v1.4: cache disimpan di HP (localStorage, per akun) → membuka aplikasi lagi langsung tampil;
 *    permintaan kembar yang sedang berjalan digabung; ping penjaga server hanya saat tidak aktif.
 */
const Sesi = {
  KEY: 'rt_online_sesi',
  _c: null,
  get() {
    if (this._c && this._c.exp > Date.now()) return this._c;
    try {
      const s = JSON.parse(localStorage.getItem(this.KEY) || 'null');
      if (s && s.exp && s.exp > Date.now()) return (this._c = s);
    } catch (e) { }
    return null;
  },
  get token() { const s = this.get(); return s ? s.token : ''; },
  get user() { const s = this.get(); return s ? s.user : null; },
  simpan(token, user) {
    let exp = Date.now() + 6 * 3600e3;
    try { exp = JSON.parse(atob(token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'))).exp || exp; } catch (e) { }
    this._c = { token, user, exp };
    localStorage.setItem(this.KEY, JSON.stringify(this._c));
    ApiCache.kosongkan();
  },
  perbaruiUser(user) { const s = this.get(); if (s) this.simpan(s.token, user); },
  hapus() { ApiCache.kosongkan(); this._c = null; localStorage.removeItem(this.KEY); ApiCache.bersihkanLS(); }
};

class ApiError extends Error { constructor(msg, kode) { super(msg); this.kode = kode; } }

function cekKonfigurasi() {
  const u = (window.RT_CONFIG || {}).GAS_URL || '';
  return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(u) && u.indexOf('GANTI_DENGAN') < 0;
}

// ---------------- Klasifikasi aksi ----------------
const AKSI_BACA = /^(list|get|detail|ringkasan|dashboard|riwayat|daftar|publik|statistik|cekHapus|laporanKas$|laporanKasPdf$|statusFonnte$|pratinjau|ping$|saya$)/;
const AKSI_SEGAR = ['statusFonnte', 'pratinjauTagihan', 'pratinjauNotif', 'pratinjauSurat', 'ping', 'unduhFile', 'laporanKasPdf', 'cekHapusRumah', 'listRumahTerhapus', 'saya'];
const AKSI_GET = ['publikBeranda', 'publikPengumuman', 'publikAgenda', 'publikGaleri', 'publikProfil', 'daftarBlok', 'ping'];
const isBaca = a => AKSI_BACA.test(a) || a === 'unduhFile';
const bolehCache = a => isBaca(a) && AKSI_SEGAR.indexOf(a) < 0;

// ---------------- Cache browser ----------------
const ApiCache = {
  SEGAR_MS: 30 * 1000,          // < 30 dtk: pakai langsung tanpa ke server
  BASI_MS: 15 * 60 * 1000,      // < 15 mnt: tampilkan dulu, perbarui di latar belakang
  SIMPAN_MS: 12 * 3600 * 1000,  // data tersimpan di HP maks 12 jam (selalu diperbarui saat dibuka)
  m: new Map(),
  _tulis: 0,                    // waktu penulisan data terakhir dari perangkat ini
  kunci: (a, d) => { const u = Sesi.user; return (u ? u.id : 'publik') + '|' + a + '|' + JSON.stringify(d || {}); },
  ambil(k) { return this.m.get(k); },
  /** basi=true → hasil permintaan yang dimulai sebelum ada penulisan: disimpan tetapi tetap diperbarui */
  simpan(k, d, basi) {
    this.m.delete(k);
    this.m.set(k, { t: basi ? Date.now() - this.SEGAR_MS - 1 : Date.now(), d, s: JSON.stringify(d), w: basi ? 1 : 0 });
    if (this.m.size > 150) this.m.delete(this.m.keys().next().value);
    this.jadwalSimpan();
  },
  /** Setelah penulisan: semua data ditandai basi (tidak dibuang) */
  basikan() {
    this._tulis = Date.now();
    const lama = Date.now() - this.SEGAR_MS - 1;
    this.m.forEach(v => { v.t = Math.min(v.t, lama); v.w = 1; });
    this.jadwalSimpan();
  },
  kosongkan() { this.m.clear(); clearTimeout(this._ts); try { const k = this.kunciLS(); if (k) localStorage.removeItem(k); } catch (e) { } },
  kunciLS() { const u = Sesi.user; return u && u.id ? 'rt_online_cache_' + u.id : ''; },
  jadwalSimpan() { clearTimeout(this._ts); this._ts = setTimeout(() => this.simpanLS(), 1000); },
  simpanLS() {
    const kl = this.kunciLS(); if (!kl) return;
    try {
      const arr = []; let ukuran = 0;
      Array.from(this.m.entries()).reverse().forEach(([k, v]) => {
        if (ukuran > 1500000 || /\|(unduhFile|laporanKasPdf)\|/.test(k)) return;
        ukuran += v.s.length + k.length; arr.push([k, v.t, v.s]);
      });
      localStorage.setItem(kl, JSON.stringify({ v: 1, a: arr }));
    } catch (e) { /* memori HP penuh → cache tidak disimpan, aplikasi tetap jalan */ }
  },
  muatLS() {
    const kl = this.kunciLS(); if (!kl) return;
    try {
      const o = JSON.parse(localStorage.getItem(kl) || 'null');
      if (!o || o.v !== 1 || !Array.isArray(o.a)) return;
      const batas = Date.now() - this.SIMPAN_MS, lama = Date.now() - this.SEGAR_MS - 1;
      o.a.slice().reverse().forEach(([k, t, s]) => { if (t > batas && !this.m.has(k)) this.m.set(k, { t: Math.min(t, lama), d: JSON.parse(s), s, p: 1 }); });
    } catch (e) { }
  },
  /** Hapus cache tersimpan milik sesi lain/kedaluwarsa (privasi di perangkat bersama) */
  bersihkanLS() {
    try {
      const kini = this.kunciLS();
      Object.keys(localStorage).forEach(k => { if (k.indexOf('rt_online_cache_') === 0 && k !== kini) localStorage.removeItem(k); });
    } catch (e) { }
  }
};
let _epoch = 0;               // bertambah setiap penulisan → permintaan baca lama tidak dibagi lagi
const _jalan = new Map();     // permintaan baca yang sedang berjalan (digabung bila kembar)
let _terakhirKirim = Date.now();
const salin = d => (d === undefined || d === null) ? d : (typeof structuredClone === 'function' ? structuredClone(d) : JSON.parse(JSON.stringify(d)));

// ---------------- Indikator proses (garis tipis di atas layar) ----------------
let _proses = 0;
function indikator(delta) {
  _proses = Math.max(0, _proses + delta);
  let bar = document.getElementById('topbar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'topbar'; document.body.appendChild(bar); }
  bar.classList.toggle('on', _proses > 0);
}

// ---------------- Pengiriman dengan batas waktu & percobaan ulang ----------------
const PESAN_ULANG = /sibuk|too many|invoked too many|timed out|timeout|Exceeded|Internal error|try again|coba lagi|Service error|Lock|Address unavailable/i;
const tidur = ms => new Promise(r => setTimeout(r, ms));

async function http(body, { get, ulang = 0 } = {}) {
  _terakhirKirim = Date.now();
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 30000) : null;
  indikator(1);
  try {
    let res;
    try {
      res = get
        ? await fetch(RT_CONFIG.GAS_URL + '?action=' + encodeURIComponent(body.action), { method: 'GET', redirect: 'follow', signal: ctrl && ctrl.signal })
        : await fetch(RT_CONFIG.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow', signal: ctrl && ctrl.signal });
    } catch (e) {
      throw new ApiError(e && e.name === 'AbortError' ? 'Server terlalu lama merespons.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', 'JARINGAN');
    }
    let json;
    try { json = await res.json(); } catch (e) { throw new ApiError('Server sedang sibuk (respons tidak valid). Coba lagi.', 'RESPON'); }
    return json;
  } catch (e) {
    // Ulangi otomatis untuk gangguan sementara (maks 2x, jeda bertambah)
    if (ulang > 0 && (e.kode === 'JARINGAN' || e.kode === 'RESPON')) { await tidur(900 * (3 - ulang)); return http(body, { get, ulang: ulang - 1 }); }
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
    indikator(-1);
  }
}

/** Ubah hasil gagal dari server menjadi ApiError + tangani sesi habis */
function olahGagal(m) {
  m = String(m || 'Terjadi kesalahan.');
  const kode = (m.match(/^([A-Z_]+):\s*/) || [])[1] || '';
  const pesan = m.replace(/^[A-Z_]+:\s*/, '');
  if (kode === 'SESI_HABIS') {
    if (Sesi.user) { Sesi.hapus(); toast(pesan, 'err'); }
    location.hash = '#/login';
  } else if (kode === 'GANTI_PASSWORD') {
    location.hash = '#/panel/akun';
  }
  if (/^Aksi tidak dikenal/.test(pesan)) return new ApiError('Fitur ini belum aktif di server. Backend Apps Script belum diperbarui ke versi terbaru: Administrator perlu mengganti kode lalu memilih Terapkan → Kelola deployment → Edit → Versi baru. (' + pesan + ')', 'VERSI');
  return new ApiError(pesan, kode || (PESAN_ULANG.test(pesan) ? 'SIBUK' : ''));
}

// ---------------- Antrean penggabungan permintaan baca ----------------
let _antre = [];
let _tanpaMulti = false;
let _timerAntre = null;
function kirimBaca(action, data) {
  return new Promise((resolve, reject) => {
    _antre.push({ action, data, resolve, reject, coba: 0 });
    if (!_timerAntre) _timerAntre = setTimeout(flushAntre, 15);
  });
}
async function flushAntre() {
  const item = _antre.splice(0, 15);
  _timerAntre = _antre.length ? setTimeout(flushAntre, 15) : null;
  if (!item.length) return;
  const selesai = (it, r) => {
    if (r.success) return it.resolve(r.data);
    const err = olahGagal(r.message);
    if (err.kode === 'SIBUK' && it.coba < 2) { it.coba++; return setTimeout(() => { _antre.push(it); if (!_timerAntre) _timerAntre = setTimeout(flushAntre, 15); }, 1000 * it.coba); }
    it.reject(err);
  };
  try {
    if (item.length === 1 || _tanpaMulti) {
      if (item.length > 1) { // backend versi lama (belum punya aksi "multi"): kirim satu per satu
        return Promise.all(item.map(it => http({ action: it.action, data: it.data, token: Sesi.token }, { ulang: 2 }).then(j => selesai(it, j)).catch(e => it.reject(e))));
      }
      const it = item[0];
      const json = await http({ action: it.action, data: it.data, token: Sesi.token }, { get: AKSI_GET.includes(it.action) && !Sesi.token, ulang: 2 });
      return selesai(it, json);
    }
    const json = await http({ action: 'multi', data: { calls: item.map(i => ({ action: i.action, data: i.data })) }, token: Sesi.token }, { ulang: 2 });
    if (!json.success && /tidak dikenal: multi/i.test(json.message || '')) {
      _tanpaMulti = true;
      console.warn('RT ONLINE: backend belum diperbarui ke v1.1 (aksi multi tidak ada). Permintaan dikirim satu per satu.');
      item.forEach(it => _antre.unshift(it)); if (!_timerAntre) _timerAntre = setTimeout(flushAntre, 0); return;
    }
    if (!json.success) return item.forEach(it => selesai(it, json));
    item.forEach((it, i) => selesai(it, json.data[i] || { success: false, message: 'Tidak ada respons.' }));
  } catch (e) {
    item.forEach(it => it.reject(e));
  }
}

// ---------------- API utama ----------------
const _latar = new Set();
let _timerSegar = null;
/**
 * Panggil aksi backend.
 * @param {string} action nama aksi
 * @param {object} data payload
 * @param {{segar?:boolean}} opsi segar=true: abaikan cache
 */
async function api(action, data = {}, opsi = {}) {
  if (!cekKonfigurasi()) throw new ApiError('URL backend belum diatur. Isi GAS_URL di js/config.js.', 'KONFIG');
  const baca = isBaca(action);
  if (!baca) {
    // Aksi tulis: kirim langsung (tanpa percobaan ulang agar tidak tercatat ganda).
    // Sesudahnya cache ditandai basi (bukan dibuang) dan menu utama dimuat ulang di latar belakang.
    _epoch++;
    try {
      const json = await http({ action, data, token: Sesi.token }, { ulang: 0 });
      if (!json.success) throw olahGagal(json.message);
      return json.data;
    } finally { _epoch++; ApiCache.basikan(); jadwalMuatUlang(); }
  }
  const k = ApiCache.kunci(action, data);
  if (bolehCache(action) && !opsi.segar) {
    const c = ApiCache.ambil(k);
    if (c) {
      const umur = Date.now() - c.t;
      if (umur < ApiCache.SEGAR_MS) return salin(c.d);
      // Baru saja ada penyimpanan dari HP ini → tunggu data terbaru agar perubahan langsung terlihat
      const baruDisimpan = c.w && Date.now() - ApiCache._tulis < 8000;
      if (!baruDisimpan && (umur < ApiCache.BASI_MS || c.p)) { segarkanLatar(k, action, data); return salin(c.d); }
    }
  }
  return salin(await ambilServer(k, action, data));
}

/** Ambil dari server; permintaan kembar yang sedang berjalan cukup ditumpangi (tidak dikirim dua kali) */
function ambilServer(k, action, data) {
  const kj = _epoch + '|' + k;
  if (_jalan.has(kj)) return _jalan.get(kj);
  const e0 = _epoch;
  const p = kirimBaca(action, data).then(d => {
    if (bolehCache(action)) ApiCache.simpan(k, d, e0 !== _epoch);
    return d;
  });
  _jalan.set(kj, p);
  const hapus = () => { _jalan.delete(kj); };
  p.then(hapus, hapus);
  return p;
}

/** Setelah penyimpanan: data menu utama & angka di menu dimuat ulang di latar (digabung, 1 permintaan) */
let _timerMuatUlang = null;
function jadwalMuatUlang() {
  clearTimeout(_timerMuatUlang);
  _timerMuatUlang = setTimeout(() => {
    if (!Sesi.user) return;
    try { if (typeof prefetchPeran === 'function') prefetchPeran(); if (typeof perbaruiHitung === 'function') perbaruiHitung(); } catch (e) { }
  }, 1500);
}

/** Perbarui data di latar belakang; bila berubah, gambar ulang halaman secara halus */
function segarkanLatar(k, action, data) {
  if (_latar.has(k)) return;
  _latar.add(k);
  const hashAwal = location.hash;
  const lama = ApiCache.ambil(k);
  ambilServer(k, action, data).then(d => {
    if (lama && lama.s !== JSON.stringify(d) && location.hash === hashAwal) {
      clearTimeout(_timerSegar);
      _timerSegar = setTimeout(() => {
        const sibukForm = document.querySelector('.modal-bg') || ['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement || {}).tagName);
        if (!sibukForm && location.hash === hashAwal && typeof router === 'function') router({ diam: true });
      }, 250);
    }
  }).catch(() => { }).finally(() => _latar.delete(k));
}

/** Muat data beberapa halaman sekaligus di latar belakang (satu panggilan) agar menu berikutnya instan */
function prefetch(daftar) {
  daftar.forEach(([a, d]) => {
    const k = ApiCache.kunci(a, d || {});
    const c = ApiCache.ambil(k);
    if (c && !c.w && !c.p && Date.now() - c.t < ApiCache.BASI_MS) return;
    ambilServer(k, a, d || {}).catch(() => { });
  });
}

/** Data publik (GET, ber-cache) */
async function apiPublik(action, maxAgeMs = 60000) {
  const d = await api(action, {});
  if (d && d.identitas) Identitas.set(d.identitas);
  return d;
}

/** Jaga server GAS tetap "hangat" selama aplikasi terbuka; ping hanya bila ±3,5 menit tidak ada permintaan */
setInterval(() => {
  if (document.visibilityState === 'visible' && cekKonfigurasi() && Date.now() - _terakhirKirim > 210000) {
    _terakhirKirim = Date.now();
    fetch(RT_CONFIG.GAS_URL + '?action=ping', { redirect: 'follow' }).catch(() => { });
  }
}, 60 * 1000);

// Cache tersimpan: muat milik sesi aktif, bersihkan milik sesi lain/kedaluwarsa
ApiCache.bersihkanLS();
ApiCache.muatLS();

/** Identitas RT (logo, foto latar, nama) — disimpan agar halaman berikutnya instan */
const Identitas = {
  KEY: 'rt_online_identitas',
  data: (() => { try { return JSON.parse(localStorage.getItem('rt_online_identitas') || 'null'); } catch (e) { return null; } })() || {
    namaRT: 'RT02 RW29 Gading Elok 1', slogan: 'Rukun • Aman • Sejahtera', alamat: 'Perumahan Gading Elok 1, RT02 RW29, Kelurahan Karawang Wetan, Kecamatan Karawang Timur, Kabupaten Karawang, Jawa Barat 41314',
    loginJudul: 'RT ONLINE', loginSambutan: 'Sistem informasi dan administrasi warga RT02/RW29 Gading Elok 1.'
  },
  set(d) { this.data = Object.assign({}, this.data, d); try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { } },
  get logo() { return this.data.logoUrl || RT_CONFIG.LOGO_LOKAL; },
  /** Daftar sumber foto latar berurutan: unggahan Drive → assets/gerbang.png → assets/gerbang.jpg */
  get latar() {
    const lokal = [].concat(RT_CONFIG.GERBANG_LOKAL || [], ['assets/gerbang.png', 'assets/gerbang.jpg']);
    return [this.data.gerbangUrl].concat(lokal).filter((v, i, a) => v && a.indexOf(v) === i);
  }
};
