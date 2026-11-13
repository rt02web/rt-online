/**
 * api.js — Komunikasi dengan backend Google Apps Script (REST JSON)
 * POST memakai Content-Type text/plain agar tidak memicu CORS preflight.
 */
const Sesi = {
  KEY: 'rt_online_sesi',
  _c: null,
  get() {
    if (this._c) return this._c;
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
  },
  perbaruiUser(user) { const s = this.get(); if (s) this.simpan(s.token, user); },
  hapus() { this._c = null; localStorage.removeItem(this.KEY); }
};

class ApiError extends Error { constructor(msg, kode) { super(msg); this.kode = kode; } }

function cekKonfigurasi() {
  const u = (window.RT_CONFIG || {}).GAS_URL || '';
  return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(u) && u.indexOf('GANTI_DENGAN') < 0;
}

/**
 * Panggil aksi backend.
 * @param {string} action nama aksi
 * @param {object} data payload
 */
async function api(action, data = {}) {
  if (!cekKonfigurasi()) throw new ApiError('URL backend belum diatur. Isi GAS_URL di js/config.js.', 'KONFIG');
  let res;
  try {
    res = await fetch(RT_CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data, token: Sesi.token }),
      redirect: 'follow'
    });
  } catch (e) {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', 'JARINGAN');
  }
  let json;
  try { json = await res.json(); } catch (e) { throw new ApiError('Respons server tidak valid. Pastikan Web App di-deploy dengan akses "Anyone".', 'RESPON'); }
  if (!json.success) {
    const m = String(json.message || 'Terjadi kesalahan.');
    const kode = (m.match(/^([A-Z_]+):\s*/) || [])[1] || '';
    const pesan = m.replace(/^[A-Z_]+:\s*/, '');
    if (kode === 'SESI_HABIS') {
      Sesi.hapus();
      toast(pesan, 'err');
      location.hash = '#/login';
    } else if (kode === 'GANTI_PASSWORD') {
      location.hash = '#/panel/akun';
    }
    throw new ApiError(pesan, kode);
  }
  return json.data;
}

/** Data publik dengan cache memori singkat */
const _cachePublik = {};
async function apiPublik(action, maxAgeMs = 60000) {
  const c = _cachePublik[action];
  if (c && Date.now() - c.t < maxAgeMs) return c.d;
  const d = await api(action, {});
  if (!(Array.isArray(d) && !d.length)) _cachePublik[action] = { t: Date.now(), d };
  if (d && d.identitas) Identitas.set(d.identitas);
  return d;
}

/** Identitas RT (logo, foto gerbang, nama) — disimpan agar halaman berikutnya instan */
const Identitas = {
  KEY: 'rt_online_identitas',
  data: (() => { try { return JSON.parse(localStorage.getItem('rt_online_identitas') || 'null'); } catch (e) { return null; } })() || {
    namaRT: 'RT02 RW29 Gading Elok 1', slogan: 'Rukun • Aman • Sejahtera', alamat: 'Perumahan Gading Elok 1, RT02 RW29, Kelurahan Karawang Wetan, Kecamatan Karawang Timur, Kabupaten Karawang, Jawa Barat 41314',
    loginJudul: 'RT ONLINE', loginSambutan: 'Sistem informasi dan administrasi warga RT02/RW29 Gading Elok 1.'
  },
  set(d) { this.data = Object.assign({}, this.data, d); try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { } },
  get logo() { return this.data.logoUrl || RT_CONFIG.LOGO_LOKAL; },
  get gerbang() { return this.data.gerbangUrl || RT_CONFIG.GERBANG_LOKAL; }
};
