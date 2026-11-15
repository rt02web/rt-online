/**
 * ui.js — Helper tampilan: ikon, format, toast, modal, form, berkas, grafik.
 */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

function esc(s) {
  return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }

// ---------------- Ikon (garis, gaya Lucide) ----------------
const IKON = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  megaphone: '<path d="m3 11 15-6v14L3 13z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  receipt: '<path d="M4 2v20l3-2 2 2 3-2 3 2 2-2 3 2V2l-3 2-2-2-3 2-3-2-2 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  tick: '<path d="M20 6 9 17l-5-5"/>',
  xcircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  settings: '<path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.6a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.6a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a13 13 0 0 1-1.7 2.7M6.6 6.6A13 13 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  wa: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  bank: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l9 5H3z"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.3 18M7 6h1v4M16.7 13.9l.7.7-2.8 2.8"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  hammer: '<path d="m15 12-8.5 8.5a2.1 2.1 0 0 1-3-3L12 9"/><path d="M17.6 15 22 10.6M20.9 11.7l-1.3-1.3c-.6-.6-.9-1.3-.9-2.1V7.1l-2.3-2.3a5.9 5.9 0 0 0-4.2-1.7H9l.9.8a6.3 6.3 0 0 1 2.1 4.6v1.6l2 2h1.2c.8 0 1.6.3 2.1.9l1.3 1.2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.7 9.7 0 0 0-6.7 2.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  swap: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.3 13 4 4 0 0 0 6 19z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
};
function ikon(n, cls = '') { return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IKON[n] || IKON.info}</svg>`; }

// ---------------- Format ----------------
const BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
function rp(n) { const v = Math.round(Number(n) || 0); return (v < 0 ? '-Rp' : 'Rp') + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function parseTgl(s) { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/); return m ? { y: +m[1], m: +m[2], d: +m[3], H: m[4], M: m[5] } : null; }
function tgl(s, pendek) { const p = parseTgl(s); if (!p) return s || '-'; return p.d + ' ' + (pendek ? BLN[p.m - 1].substr(0, 3) : BLN[p.m - 1]) + ' ' + p.y; }
function tglJam(s) { const p = parseTgl(s); if (!p) return s || '-'; return tgl(s, true) + (p.H ? ', ' + p.H + ':' + p.M + ' WIB' : ''); }
function hariDari(s) { const p = parseTgl(s); return p ? HARI[new Date(p.y, p.m - 1, p.d).getDay()] : ''; }
function periodeLabel(p) { const m = String(p || '').match(/^(\d{4})-(\d{2})$/); return m ? BLN[+m[2] - 1] + ' ' + m[1] : p; }
function hariIni() { const d = new Date(Date.now() + (7 * 60 + new Date().getTimezoneOffset()) * 60000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function periodeIni() { return hariIni().substr(0, 7); }
function tambahBulan(p, n) { const [y, m] = p.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
/** Umur dari YYYY-MM-DD → angka tahun (null bila kosong) */
function umurTahun(s) { const p = parseTgl(s), t = parseTgl(hariIni()); if (!p || !t) return null; let u = t.y - p.y; if (t.m < p.m || (t.m === p.m && t.d < p.d)) u--; return u < 0 || u > 130 ? null : u; }
/** Teks umur ramah: "34 th", bayi "7 bln" */
function umurTeks(s) { const u = umurTahun(s); if (u === null) return '—'; if (u >= 1) return u + ' th'; const p = parseTgl(s), t = parseTgl(hariIni()); const b = (t.y - p.y) * 12 + t.m - p.m - (t.d < p.d ? 1 : 0); return Math.max(0, b) + ' bln'; }
function inisial(n) { return String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase(); }
function selisihHari(s) { const p = parseTgl(s); if (!p) return null; const a = new Date(p.y, p.m - 1, p.d), t = parseTgl(hariIni()), b = new Date(t.y, t.m - 1, t.d); return Math.round((a - b) / 864e5); }

const STATUS_BADGE = {
  'Lunas': 'lunas', 'Terverifikasi': 'lunas', 'Selesai Diterbitkan': 'lunas', 'Disetujui': 'lunas', 'Selesai': 'lunas', 'terkirim': 'lunas', 'dikonfirmasi': 'lunas', 'AKTIF': 'lunas', 'Aktif': 'lunas', 'Dihuni': 'lunas', 'Terbit': 'lunas',
  'Sebagian': 'proses', 'Menunggu': 'proses', 'Perlu Perbaikan': 'proses', 'Diproses': 'proses', 'antre': 'proses', 'diusulkan': 'proses', 'BARU': 'proses', 'tertunda': 'proses', 'Draf': 'proses', 'Dikontrak': 'info',
  'Belum Bayar': 'danger', 'Ditolak': 'danger', 'gagal': 'danger', 'dibatalkan': 'danger', 'Dibatalkan': 'danger', 'NONAKTIF': 'danger',
  'Diajukan': 'diajukan', 'Diterima': 'diajukan', 'Penting': 'penting', 'Informasi Umum': 'info', 'Kosong': '', 'Arsip': ''
};
function badge(status, label) { return `<span class="badge ${STATUS_BADGE[status] || ''}">${esc(label || status || '-')}</span>`; }

// ---------------- Toast ----------------
function toast(msg, type = 'ok', ms = 4500) {
  let box = $('#toast');
  if (!box) { box = document.createElement('div'); box.id = 'toast'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = ikon(type === 'err' ? 'alert' : type === 'ok' ? 'check' : 'info') + `<div>${esc(msg)}</div>`;
  box.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, ms);
}
function gagal(e) { console.error(e); toast(e && e.message ? e.message : String(e), 'err', 6000); }

// ---------------- Modal ----------------
function modal({ judul, isi, kaki, besar, ikonJudul }) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${besar ? 'lg' : ''}" role="dialog" aria-modal="true" aria-label="${esc(judul)}">
    <div class="modal-h">${ikonJudul ? ikon(ikonJudul, 'lg') : ''}<h3>${esc(judul)}</h3><button class="x" aria-label="Tutup">${ikon('x')}</button></div>
    <div class="modal-b">${isi || ''}</div>${kaki ? `<div class="modal-f">${kaki}</div>` : ''}</div>`;
  document.body.appendChild(bg);
  document.body.style.overflow = 'hidden';
  const tutup = () => { bg.remove(); if (!$('.modal-bg')) document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') tutup(); };
  document.addEventListener('keydown', onKey);
  $('.x', bg).onclick = tutup;
  bg.addEventListener('mousedown', e => { if (e.target === bg) tutup(); });
  setTimeout(() => { const f = $('input:not([type=hidden]),select,textarea', bg); if (f && window.innerWidth > 768) f.focus(); }, 50);
  return { el: bg, body: $('.modal-b', bg), tutup };
}

function konfirmasi(pesan, { judul = 'Konfirmasi', ya = 'Ya, lanjutkan', bahaya = false } = {}) {
  return new Promise(res => {
    const m = modal({ judul, isi: `<p style="font-size:17px">${pesan}</p>`, kaki: `<button class="btn btn-outline" data-a="0">Batal</button><button class="btn ${bahaya ? 'btn-danger' : 'btn-primary'}" data-a="1">${esc(ya)}</button>` });
    $$('[data-a]', m.el).forEach(b => b.onclick = () => { m.tutup(); res(b.dataset.a === '1'); });
    $('.x', m.el).addEventListener('click', () => res(false));
  });
}

function mintaTeks(judul, label, { wajib = true, placeholder = '', nilai = '', ya = 'Simpan', bahaya = false } = {}) {
  return new Promise(res => {
    const m = modal({ judul, isi: `<div class="field"><label for="mt">${esc(label)}</label><textarea id="mt" class="input" placeholder="${esc(placeholder)}">${esc(nilai)}</textarea><div class="err hidden" id="mte">Wajib diisi.</div></div>`, kaki: `<button class="btn btn-outline" data-a="0">Batal</button><button class="btn ${bahaya ? 'btn-danger' : 'btn-primary'}" data-a="1">${esc(ya)}</button>` });
    $$('[data-a]', m.el).forEach(b => b.onclick = () => {
      const v = $('#mt', m.el).value.trim();
      if (b.dataset.a === '1' && wajib && !v) { $('#mte', m.el).classList.remove('hidden'); return; }
      m.tutup(); res(b.dataset.a === '1' ? v : null);
    });
    $('.x', m.el).addEventListener('click', () => res(null));
  });
}

/** Tampilkan password/kredensial sekali (dengan tombol salin & unduh) */
function tampilKredensial(judul, baris, catatan) {
  const isi = `<div class="alert warn mb-2">${ikon('alert')}<div>${catatan || 'Password ini hanya ditampilkan <b>sekali</b>. Catat atau unduh sekarang, lalu bagikan secara pribadi kepada pemiliknya.'}</div></div>
    <div class="table-wrap"><table class="tbl"><thead><tr>${Object.keys(baris[0] || {}).map(k => `<th>${esc(k)}</th>`).join('')}</tr></thead>
    <tbody>${baris.map(r => `<tr>${Object.values(r).map(v => `<td class="mono">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const m = modal({ judul, isi, besar: baris.length > 3, kaki: `<button class="btn btn-outline" id="kr-salin">${ikon('copy')} Salin</button><button class="btn btn-outline" id="kr-xls">${ikon('download')} Unduh Excel</button><button class="btn btn-primary" id="kr-ok">Sudah saya catat</button>` });
  $('#kr-salin', m.el).onclick = () => { navigator.clipboard.writeText(baris.map(r => Object.values(r).join('\t')).join('\n')).then(() => toast('Disalin ke clipboard.')); };
  $('#kr-xls', m.el).onclick = () => eksporExcel(baris, 'Kredensial_RT_ONLINE_' + hariIni() + '.xlsx', 'Akun');
  $('#kr-ok', m.el).onclick = m.tutup;
}

// ---------------- Loading ----------------
function loader(teks = 'Memuat data…') { return `<div class="loader"><div class="spin"></div><span>${esc(teks)}</span></div>`; }
function kosong(teks, ik = 'info') { return `<div class="empty">${ikon(ik)}<div>${esc(teks)}</div></div>`; }
async function sibuk(btn, fn) {
  if (!btn) return fn();
  const asli = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spin"></span> Memproses…`;
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = asli; }
}

// ---------------- Form ----------------
/**
 * Bangun field form. f: {n, l, t(text|number|date|month|select|textarea|password|file|check|tel), o:[[v,l]], v, req, hint, full, ph, attr}
 */
function field(f) {
  const id = 'f_' + f.n + '_' + Math.random().toString(36).substr(2, 4);
  const req = f.req ? 'required' : '';
  const v = f.v === undefined || f.v === null ? '' : f.v;
  let inp;
  if (f.t === 'select') inp = `<select id="${id}" name="${f.n}" class="input" ${req} ${f.attr || ''}>${(f.o || []).map(o => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(ov)}" ${String(ov) === String(v) ? 'selected' : ''}>${esc(ol)}</option>`; }).join('')}</select>`;
  else if (f.t === 'textarea') inp = `<textarea id="${id}" name="${f.n}" class="input" ${req} placeholder="${esc(f.ph || '')}" ${f.attr || ''}>${esc(v)}</textarea>`;
  else if (f.t === 'password') inp = `<div class="pw-wrap"><input id="${id}" name="${f.n}" type="password" class="input" ${req} autocomplete="${f.ac || 'current-password'}" ${f.attr || ''}><button type="button" class="pw-toggle" aria-label="Tampilkan password" onclick="togglePw(this)">${ikon('eye')}</button></div>`;
  else if (f.t === 'file') inp = `<label class="file-drop" for="${id}">${ikon('upload', 'lg')}<div class="mt-1"><b>Pilih berkas</b> <span class="small">${esc(f.ph || 'JPG, PNG, atau PDF · maks 5 MB')}</span></div><div class="small fname mt-1"></div><input id="${id}" name="${f.n}" type="file" ${f.multi ? 'multiple' : ''} accept="${f.accept || 'image/*,application/pdf'}" ${req} onchange="this.closest('.file-drop').querySelector('.fname').textContent=[...this.files].map(x=>x.name).join(', ')"></label>`;
  else if (f.t === 'check') return `<label class="check ${f.full ? 'full' : ''}"><input type="checkbox" name="${f.n}" ${v ? 'checked' : ''} ${f.attr || ''}> <span>${f.l}</span></label>`;
  else inp = `<input id="${id}" name="${f.n}" type="${f.t || 'text'}" class="input" value="${esc(v)}" ${req} placeholder="${esc(f.ph || '')}" ${f.t === 'number' ? 'inputmode="numeric" min="0" step="1"' : ''} ${f.attr || ''}>`;
  return `<div class="field ${f.full ? 'full' : ''}"><label for="${id}">${esc(f.l)}${f.req ? ' <span style="color:var(--danger)">*</span>' : ''}</label>${inp}${f.hint ? `<div class="hint">${f.hint}</div>` : ''}</div>`;
}
function formHTML(fields, cls = 'two') { return `<div class="form-grid ${cls}">${fields.map(field).join('')}</div>`; }
function togglePw(b) { const i = b.previousElementSibling; const show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.innerHTML = ikon(show ? 'eyeoff' : 'eye'); b.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password'); }

/** Baca nilai form (file → objek base64 terkompresi) */
async function bacaForm(root) {
  const o = {};
  for (const el of $$('input,select,textarea', root)) {
    if (!el.name) continue;
    if (el.type === 'checkbox') o[el.name] = el.checked;
    else if (el.type === 'file') {
      if (el.multiple) { o[el.name] = []; for (const f of el.files) o[el.name].push(await fileB64(f)); }
      else o[el.name] = el.files[0] ? await fileB64(el.files[0]) : null;
    } else o[el.name] = el.value.trim();
  }
  return o;
}
function validasiForm(root) {
  for (const el of $$('[required]', root)) {
    const kosong = el.type === 'file' ? !el.files.length : el.type === 'checkbox' ? !el.checked : !String(el.value).trim();
    if (kosong) { const l = el.closest('.field') ? $('label', el.closest('.field')).textContent.replace('*', '').trim() : el.name; toast('Mohon isi: ' + l, 'err'); el.focus(); return false; }
  }
  return true;
}

// ---------------- Berkas ----------------
/** Berkas → {base64, nama, mime}. Gambar besar dikompres (maks 1600px, JPEG 0.82) agar hemat kuota. */
function fileB64(file, maxDim = 1600) {
  return new Promise((res, rej) => {
    if (file.size > 10 * 1024 * 1024) return rej(new Error('Berkas ' + file.name + ' terlalu besar (maks 10 MB sebelum kompresi).'));
    const rd = new FileReader();
    rd.onerror = () => rej(new Error('Gagal membaca berkas.'));
    if (/^image\/(jpeg|png|webp)$/.test(file.type)) {
      rd.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, maxDim / Math.max(img.width, img.height));
          if (s === 1 && file.size < 900 * 1024) return res({ base64: rd.result.split(',')[1], nama: file.name, mime: file.type });
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          const cx = c.getContext('2d');
          if (file.type !== 'image/png') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); }
          cx.drawImage(img, 0, 0, c.width, c.height);
          const png = file.type === 'image/png' && file.size < 1.5 * 1024 * 1024;
          const url = c.toDataURL(png ? 'image/png' : 'image/jpeg', .82);
          res({ base64: url.split(',')[1], nama: file.name.replace(/\.\w+$/, png ? '.png' : '.jpg'), mime: png ? 'image/png' : 'image/jpeg' });
        };
        img.onerror = () => rej(new Error('Gambar tidak dapat dibaca.'));
        img.src = rd.result;
      };
    } else {
      rd.onload = () => res({ base64: rd.result.split(',')[1], nama: file.name, mime: file.type || 'application/octet-stream' });
    }
    rd.readAsDataURL(file);
  });
}
function b64Blob(b64, mime) { const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: mime }); }
function unduhBlob(blob, nama) { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); }
/** Ambil berkas privat dari backend lalu tampilkan / unduh */
async function bukaBerkas(id, unduh) {
  if (!id) return;
  const t = toastLoading('Mengambil berkas…');
  try {
    const f = await api('unduhFile', { id });
    const blob = b64Blob(f.base64, f.mime);
    if (unduh) return unduhBlob(blob, f.nama);
    if (/^image\//.test(f.mime)) {
      const u = URL.createObjectURL(blob);
      modal({ judul: f.nama, besar: true, isi: `<img src="${u}" alt="${esc(f.nama)}" style="margin:0 auto;max-height:70vh;border-radius:8px">`, kaki: `<button class="btn btn-outline" onclick="bukaBerkas('${esc(id)}',true)">${ikon('download')} Unduh</button>` });
    } else {
      const u = URL.createObjectURL(blob);
      const w = window.open(u, '_blank');
      if (!w) unduhBlob(blob, f.nama);
    }
  } catch (e) { gagal(e); } finally { t(); }
}
function toastLoading(msg) {
  let box = $('#toast');
  if (!box) { box = document.createElement('div'); box.id = 'toast'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<span class="spin" style="width:18px;height:18px;border:2px solid #fff;border-right-color:transparent;border-radius:50%;animation:putar .7s linear infinite"></span><div>${esc(msg)}</div>`;
  box.appendChild(t); return () => t.remove();
}

// ---------------- Excel (SheetJS dimuat saat perlu) ----------------
let _xlsx = null;
function muatXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (_xlsx) return _xlsx;
  _xlsx = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = RT_CONFIG.SHEETJS_URL;
    s.onload = () => res(window.XLSX); s.onerror = () => { _xlsx = null; rej(new Error('Gagal memuat pustaka Excel. Periksa koneksi internet.')); };
    document.head.appendChild(s);
  });
  return _xlsx;
}
async function eksporExcel(rows, nama, sheet = 'Data', judulBaris) {
  try {
    const X = await muatXLSX();
    const ws = judulBaris ? X.utils.aoa_to_sheet(judulBaris) : X.utils.json_to_sheet(rows);
    if (judulBaris) X.utils.sheet_add_json(ws, rows, { origin: -1 });
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, sheet.substr(0, 31));
    X.writeFile(wb, nama);
  } catch (e) { gagal(e); }
}

// ---------------- Gambar dengan cadangan ----------------
function logoImg(cls = '') {
  return `<img class="${cls}" src="${esc(Identitas.logo)}" alt="Logo RT02 RW29" onerror="this.onerror=null;this.replaceWith(logoSvg())">`;
}
function logoSvg() {
  const d = document.createElement('div');
  d.innerHTML = '<svg viewBox="0 0 64 64" width="100%" height="100%" role="img" aria-label="RT02"><rect width="64" height="64" rx="12" fill="#033A65"/><path d="M14 32 32 18l18 14v16H14z" fill="#fff"/><rect x="28" y="36" width="8" height="12" fill="#84C534"/><text x="32" y="60" font-size="9" font-weight="700" fill="#84C534" text-anchor="middle" font-family="Inter,Arial">RT02</text></svg>';
  return d.firstChild;
}
/** Foto latar perumahan berlapis: bila unggahan Drive gagal dimuat, otomatis memakai assets/gerbang.png / .jpg */
function bgGerbang() {
  const u = Identitas.latar.map(x => `url('${esc(x)}')`).join(', ');
  return `<div class="bgimg" style="background-image:${u}"></div>`;
}

// ---------------- Grafik sederhana (SVG, dengan tooltip) ----------------
function tipGrafik(root) {
  let tip = $('.chart-tip');
  $$('[data-tip]', root).forEach(el => {
    el.addEventListener('mouseenter', () => { tip = tip || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'chart-tip' })); tip.innerHTML = el.dataset.tip; tip.style.display = 'block'; });
    el.addEventListener('mousemove', e => { tip.style.left = (e.clientX + 12) + 'px'; tip.style.top = (e.clientY - 36) + 'px'; });
    el.addEventListener('mouseleave', () => { if (tip) tip.style.display = 'none'; });
  });
}
/** Grafik batang berkelompok: data [{label, a, b}], nama seri [na, nb] */
function grafikBatang(data, na, nb) {
  const W = 560, H = 230, pl = 48, pb = 28, pt = 10;
  const maks = Math.max(1, ...data.map(d => Math.max(d.a, d.b)));
  const step = Math.pow(10, Math.floor(Math.log10(maks)));
  const top = Math.ceil(maks / step) * step;
  const gw = (W - pl - 8) / data.length, bw = Math.min(22, gw / 3);
  const y = v => pt + (H - pt - pb) * (1 - v / top);
  const fmt = v => v >= 1e6 ? (v / 1e6).toFixed(v % 1e6 ? 1 : 0) + ' jt' : v >= 1e3 ? Math.round(v / 1e3) + ' rb' : v;
  let g = '';
  for (let i = 0; i <= 4; i++) { const v = top * i / 4; g += `<line class="gridl" x1="${pl}" x2="${W - 4}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; }
  data.forEach((d, i) => {
    const cx = pl + gw * i + gw / 2;
    const bar = (v, x, c, n) => { const h = Math.max(0, y(0) - y(v)); const r = Math.min(4, h); return `<path data-tip="<b>${esc(d.label)}</b><br>${n}: ${rp(v)}" fill="${c}" d="M${x},${y(0)} v${-(h - r)} q0,${-r} ${r},${-r} h${bw - 2 * r} q${r},0 ${r},${r} v${h - r} z"/>`; };
    g += bar(d.a, cx - bw - 1, 'var(--chart-a)', na) + bar(d.b, cx + 1, 'var(--chart-b)', nb);
    g += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>`;
  });
  return `<div class="legend mb-1"><span><i style="background:var(--chart-a)"></i>${esc(na)}</span><span><i style="background:var(--chart-b)"></i>${esc(nb)}</span></div><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik ${esc(na)} dan ${esc(nb)}">${g}</svg>`;
}
/** Donat status: items [{label, n, warna}] */
function grafikDonat(items, tengah, sub) {
  const total = items.reduce((s, x) => s + x.n, 0) || 1;
  const R = 70, r = 50, C = 90;
  let a0 = -Math.PI / 2, g = '';
  items.forEach(x => {
    if (!x.n) return;
    const a1 = a0 + 2 * Math.PI * x.n / total - (items.filter(i => i.n).length > 1 ? .03 : 0);
    const big = a1 - a0 > Math.PI ? 1 : 0;
    const p = (rad, ang) => [C + rad * Math.cos(ang), C + rad * Math.sin(ang)];
    const [x1, y1] = p(R, a0), [x2, y2] = p(R, a1), [x3, y3] = p(r, a1), [x4, y4] = p(r, a0);
    g += x.n === total ? `<circle cx="${C}" cy="${C}" r="${(R + r) / 2}" fill="none" stroke="${x.warna}" stroke-width="${R - r}" data-tip="${esc(x.label)}: ${x.n}"/>`
      : `<path data-tip="${esc(x.label)}: ${x.n}" fill="${x.warna}" d="M${x1},${y1} A${R},${R} 0 ${big} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${big} 0 ${x4},${y4} z"/>`;
    a0 = a1 + .03;
  });
  return `<svg class="chart" viewBox="0 0 180 180" style="max-width:200px;margin:0 auto" role="img" aria-label="${esc(sub)}">${g || `<circle cx="${C}" cy="${C}" r="60" fill="none" stroke="#E2E8F0" stroke-width="20"/>`}<text x="90" y="88" text-anchor="middle" style="font-size:24px;font-weight:700;fill:#1A1A2E">${esc(tengah)}</text><text x="90" y="108" text-anchor="middle" style="font-size:10px;letter-spacing:.06em">${esc(sub)}</text></svg>`;
}
