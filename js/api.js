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
 * 6. Setiap penulisan data mengosongkan cache agar tampilan selalu benar.
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
  hapus() { this._c = null; localStorage.removeItem(this.KEY); ApiCache.kosongkan(); }
};

class ApiError extends Error { constructor(msg, kode) { super(msg); this.kode = kode; } }

function cekKonfigurasi() {
  const u = (window.RT_CONFIG || {}).GAS_URL || '';
  return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(u) && u.indexOf('GANTI_DENGAN') < 0;
}

// ---------------- Klasifikasi aksi ----------------
const AKSI_BACA = /^(list|get|detail|ringkasan|dashboard|riwayat|daftar|publik|laporanKas$|statusFonnte$|pratinjau|ping$)/;
const AKSI_SEGAR = ['statusFonnte', 'pratinjauTagihan', 'pratinjauNotif', 'pratinjauSurat', 'ping', 'unduhFile'];
const AKSI_GET = ['publikBeranda', 'publikPengumuman', 'publikAgenda', 'publikGaleri', 'publikProfil', 'daftarBlok', 'ping'];
const isBaca = a => AKSI_BACA.test(a) || a === 'unduhFile';
const bolehCache = a => isBaca(a) && AKSI_SEGAR.indexOf(a) < 0;

// ---------------- Cache browser ----------------
const ApiCache = {
  SEGAR_MS: 30 * 1000,       // < 30 dtk: pakai langsung tanpa ke server
  BASI_MS: 15 * 60 * 1000,   // < 15 mnt: tampilkan dulu, perbarui di latar belakang
  m: new Map(),
  kunci: (a, d) => { const u = Sesi.user; return (u ? u.id : 'publik') + '|' + a + '|' + JSON.stringify(d || {}); },
  ambil(k) { return this.m.get(k); },
  simpan(k, d) { this.m.set(k, { t: Date.now(), d, s: JSON.stringify(d) }); if (this.m.size > 120) this.m.delete(this.m.keys().next().value); },
  kosongkan() { this.m.clear(); }
};
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
    // Aksi tulis: kirim langsung (tanpa percobaan ulang agar tidak tercatat ganda), lalu kosongkan cache
    try {
      const json = await http({ action, data, token: Sesi.token }, { ulang: 0 });
      if (!json.success) throw olahGagal(json.message);
      return json.data;
    } finally { ApiCache.kosongkan(); }
  }
  const k = ApiCache.kunci(action, data);
  if (bolehCache(action) && !opsi.segar) {
    const c = ApiCache.ambil(k);
    const umur = c ? Date.now() - c.t : Infinity;
    if (c && umur < ApiCache.SEGAR_MS) return salin(c.d);
    if (c && umur < ApiCache.BASI_MS) { segarkanLatar(k, action, data); return salin(c.d); }
  }
  const d = await kirimBaca(action, data);
  if (bolehCache(action)) ApiCache.simpan(k, d);
  return salin(d);
}

/** Perbarui data di latar belakang; bila berubah, gambar ulang halaman secara halus */
function segarkanLatar(k, action, data) {
  if (_latar.has(k)) return;
  _latar.add(k);
  const hashAwal = location.hash;
  kirimBaca(action, data).then(d => {
    const lama = ApiCache.ambil(k);
    ApiCache.simpan(k, d);
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
    if (c && Date.now() - c.t < ApiCache.BASI_MS) return;
    kirimBaca(a, d || {}).then(x => ApiCache.simpan(k, x)).catch(() => { });
  });
}

/** Data publik (GET, ber-cache) */
async function apiPublik(action, maxAgeMs = 60000) {
  const d = await api(action, {});
  if (d && d.identitas) Identitas.set(d.identitas);
  return d;
}

/** Jaga server GAS tetap "hangat" selama aplikasi terbuka (mengurangi jeda cold start) */
setInterval(() => {
  if (document.visibilityState === 'visible' && cekKonfigurasi()) {
    fetch(RT_CONFIG.GAS_URL + '?action=ping', { redirect: 'follow' }).catch(() => { });
  }
}, 4 * 60 * 1000);

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
