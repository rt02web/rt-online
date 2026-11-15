/**
 * app.js — Router hash, tata letak portal publik & panel, menu per peran.
 * Rute: #/ #/pengumuman #/agenda #/galeri #/profil #/login #/panel/<halaman>/<param>
 */
const Halaman = {};     // registry halaman panel: key → {judul, ikon, peran, render(el, param)}
const HalamanPublik = {}; // key → render(el)

function daftarHalaman(key, def) { Halaman[key] = def; }

const BENDAHARA = ['bend_umum', 'bend_pembangunan', 'bend_jimpitan', 'bend_sosial'];
const LABEL_KAS = { umum: 'Kas Umum', pembangunan: 'Kas Pembangunan', jimpitan: 'Kas Jimpitan', sosial: 'Kas Sosial' };
const LABEL_HUNIAN = { Dihuni: 'Dihuni pemilik', Dikontrak: 'Dikontrak / sewa', Kosong: 'Kosong' };
const OPSI_HUNIAN = [['Dihuni', 'Dihuni pemilik (milik sendiri)'], ['Dikontrak', 'Dikontrak / sewa'], ['Kosong', 'Kosong']];
const badgeHunian = s => badge(s, LABEL_HUNIAN[s] || s);

/** Struktur menu per peran: [grup, [kunci halaman]] */
function menuPeran(p) {
  if (p === 'warga') return [
    ['Beranda', ['dashboard', 'info']],
    ['Keuangan', ['tagihan-saya', 'riwayat-bayar']],
    ['Layanan', ['surat-saya', 'pengaduan-saya', 'keluarga']],
    ['Akun', ['akun']]
  ];
  if (p === 'admin') return [
    ['Akun & Data', ['dashboard', 'akun-kelola', 'data-warga', 'penerima-wa', 'statistik-warga', 'impor', 'perubahan']],
    ['Pengaturan RT', ['identitas', 'pengaturan', 'iuran-khusus', 'jenis-surat']],
    ['Integrasi & Audit', ['template-wa', 'siaran', 'fonnte', 'log']],
    ['Akun Saya', ['akun']]
  ];
  if (p === 'ketua') return [
    ['Dashboard & Warga', ['dashboard', 'data-warga', 'statistik-warga']],
    ['Keuangan & Kas', ['laporan', 'transaksi', 'keringanan', 'riwayat-wa']],
    ['Surat & Layanan', ['surat-masuk', 'pengaduan', 'info']],
    ['Akun', ['akun']]
  ];
  if (p === 'sekretaris') return [
    ['Dashboard & Warga', ['dashboard', 'data-warga', 'statistik-warga']],
    ['Informasi Warga', ['kelola-pengumuman', 'kelola-agenda', 'kelola-galeri', 'kelola-notulen']],
    ['Layanan', ['surat-masuk', 'pengaduan', 'laporan']],
    ['Akun', ['akun']]
  ];
  // Bendahara (tidak melihat data seluruh warga; hanya daftar rumah untuk transaksi)
  const khusus = { bend_umum: ['tunggakan-lama'], bend_pembangunan: ['tunggakan-lama'], bend_jimpitan: ['jimpitan'], bend_sosial: ['bansos'] }[p] || [];
  return [
    ['Dashboard', ['dashboard']],
    ['Keuangan & Kas', ['penerbitan', 'verifikasi', 'catat-tunai'].concat(khusus, ['transaksi', 'laporan'])],
    ['Notifikasi', ['siaran', 'riwayat-wa']],
    ['Akun', ['akun']]
  ];
}
function bnavPeran(p) {
  if (p === 'warga') return ['dashboard', 'tagihan-saya', 'surat-saya', 'info'];
  if (p === 'admin') return ['dashboard', 'data-warga', 'akun-kelola', 'fonnte'];
  if (p === 'ketua') return ['dashboard', 'surat-masuk', 'laporan', 'data-warga'];
  if (p === 'sekretaris') return ['dashboard', 'kelola-pengumuman', 'kelola-agenda', 'surat-masuk'];
  return ['dashboard', 'verifikasi', 'catat-tunai', 'transaksi'];
}

// ============================================================
// ROUTER
// ============================================================
let _layout = null;
let _urutRender = 0;
/**
 * @param {{diam?:boolean}} opsi diam=true → gambar ulang halaman yang sama tanpa loader & tanpa geser ke atas
 */
async function router(opsi) {
  const diam = !!(opsi && opsi.diam);
  const h = location.hash.replace(/^#\/?/, '');
  const [seg, sub, param] = h.split('/');
  if (!diam) window.scrollTo(0, 0);
  if (seg === 'panel') {
    if (!Sesi.user) { location.hash = '#/login'; return; }
    return bukaPanel(sub || 'dashboard', param ? decodeURIComponent(param) : '', diam);
  }
  if (seg === 'login') {
    if (Sesi.user) { location.hash = '#/panel/dashboard'; return; }
    _layout = 'login';
    return HalamanPublik.login($('#app'));
  }
  const key = seg || 'beranda';
  const fn = HalamanPublik[key] || HalamanPublik.beranda;
  const y = window.scrollY;
  layoutPublik(key);
  const el = $('#pub-main');
  if (!diam) el.innerHTML = loader();
  try { await fn(el); if (diam) window.scrollTo(0, y); } catch (e) { if (!diam) el.innerHTML = errorBox(e, 'router()'); }
}
function errorBox(e, ulang) {
  const konf = e && e.kode === 'KONFIG';
  return `<div class="card"><div class="alert ${konf ? 'warn' : 'err'}">${ikon('alert')}<div><b>${konf ? 'Aplikasi belum terhubung ke backend' : 'Gagal memuat data'}</b><br>${esc(e.message || e)}${!konf ? '<br><span class="small">Server Google kadang lambat saat pertama dibuka. Tekan “Coba lagi”.</span>' : ''}</div></div>${ulang ? `<button class="btn btn-outline mt-2" onclick="ApiCache.kosongkan();${ulang}">${ikon('refresh')} Coba lagi</button>` : ''}</div>`;
}

// ============================================================
// TATA LETAK PUBLIK
// ============================================================
const NAV_PUBLIK = [['beranda', 'Beranda'], ['pengumuman', 'Pengumuman & Notulen'], ['agenda', 'Agenda Kegiatan'], ['galeri', 'Galeri'], ['profil', 'Profil RT']];
function layoutPublik(aktif) {
  const I = Identitas.data;
  const nav = NAV_PUBLIK.map(([k, l]) => `<a href="#/${k === 'beranda' ? '' : k}" class="${k === aktif ? 'on' : ''}">${l}</a>`).join('');
  const login = Sesi.user ? `<a class="btn btn-accent btn-sm" href="#/panel/dashboard">${ikon('grid', 'sm')} Panel Saya</a>` : `<a class="btn btn-accent btn-sm" href="#/login">${ikon('login', 'sm')} Login Warga / Pengurus</a>`;
  if (_layout !== 'publik') {
    $('#app').innerHTML = `
    <header class="pub-head"><div class="in">
      <a class="brand" href="#/"><span class="logo">${logoImg()}</span><span><b>RT ONLINE</b><span>${esc(I.namaRT || 'RT02/RW29 Gading Elok 1')}</span></span></a>
      <nav class="pub-nav" id="pub-nav" aria-label="Navigasi utama"></nav>
      <button class="menu-btn" aria-label="Buka menu" onclick="$('#pub-drawer').classList.toggle('open')">${ikon('menu', 'lg')}</button>
    </div><div class="pub-drawer" id="pub-drawer"></div></header>
    <main class="pub-main" id="pub-main"></main>
    <footer class="pub-foot" id="pub-foot"></footer>`;
    _layout = 'publik';
  }
  $('#pub-nav').innerHTML = nav + login;
  $('#pub-drawer').innerHTML = nav + `<div class="mt-2">${login.replace('btn-sm', 'btn-block')}</div>`;
  $('#pub-drawer').classList.remove('open');
  $('#pub-main').className = 'pub-main' + (aktif === 'beranda' ? ' beranda' : '');
  $('#pub-main').removeAttribute('style');
  $('#pub-foot').innerHTML = footerHTML();
}
function footerHTML() {
  const I = Identitas.data;
  return `<div class="in">
    <div><a class="brand" href="#/"><span class="logo">${logoImg()}</span><span><b>RT ONLINE</b><span>${esc(I.namaRT || '')}</span></span></a>
      <p class="mt-2 small">Portal resmi tata kelola administrasi, transparansi iuran, dan pusat informasi warga ${esc(I.namaRT || 'RT02/RW29 Gading Elok 1')}.</p></div>
    <div><h4>Alamat Sekretariat</h4><p class="small">${esc(I.alamatSekretariat || I.alamat || '')}</p></div>
    <div><h4>Layanan & Kontak</h4>${I.wa ? `<a href="https://wa.me/${'62' + String(I.wa).replace(/^0/, '')}" target="_blank" rel="noopener">${ikon('wa', 'sm')} ${esc(I.wa)}</a>` : '<p class="small">Hubungi pengurus RT.</p>'}<p class="small mt-1">${esc(I.jamLayanan || '')}</p></div>
    <div><h4>Tautan</h4>${NAV_PUBLIK.map(([k, l]) => `<a href="#/${k === 'beranda' ? '' : k}">${l}</a>`).join('')}</div>
    <div class="bot"><span>© ${new Date().getFullYear()} ${esc(I.namaRT || 'RT02 RW29 Gading Elok 1')}, Karawang Wetan.</span><span class="mono">Sistem Informasi RT Digital</span></div>
  </div>`;
}

// ============================================================
// TATA LETAK PANEL
// ============================================================
let _hitung = {}; // badge jumlah di menu
async function bukaPanel(key, param, diam) {
  const u = Sesi.user;
  if (u.harusGantiPassword && key !== 'akun') { location.hash = '#/panel/akun'; return; }
  let def = Halaman[key];
  const bolehKey = menuPeran(u.peran).flatMap(g => g[1]);
  if (!def || (bolehKey.indexOf(key) < 0 && !(def.peran || []).includes(u.peran))) { location.hash = '#/panel/dashboard'; return; }
  if (_layout !== 'panel') {
    $('#app').innerHTML = `<div class="panel">
      <aside class="side" id="side" aria-label="Menu"></aside><div class="scrim" id="scrim" onclick="tutupSide()"></div>
      <div class="main"><header class="top" id="top"></header><div class="content" id="content"></div></div>
      <nav class="bnav" id="bnav" aria-label="Navigasi bawah"></nav></div>`;
    _layout = 'panel';
    perbaruiHitung();
  }
  gambarSide(key); gambarTop(def); gambarBnav(key);
  tutupSide();
  const el = $('#content');
  const urut = ++_urutRender;
  const y = window.scrollY;
  if (!diam) el.innerHTML = loader();
  document.title = def.judul + ' — RT ONLINE';
  try {
    await def.render(el, param);
    if (diam) window.scrollTo(0, y);
  } catch (e) {
    if (e.kode !== 'SESI_HABIS' && urut === _urutRender && !diam) el.innerHTML = errorBox(e, 'router()');
  }
  if (!_sudahPrefetch) { _sudahPrefetch = true; setTimeout(prefetchPeran, 1200); }
}
let _sudahPrefetch = false;
/** Data menu-menu utama dimuat di latar belakang dalam satu panggilan, agar perpindahan menu instan */
function prefetchPeran() {
  const p = Sesi.user && Sesi.user.peran;
  if (!p) return;
  const umum = [['dashboard'], ['listPengumuman'], ['listAgenda']];
  const per = {
    warga: [['listTagihan'], ['ringkasanRumah'], ['getPengaturan'], ['listPembayaran'], ['listSurat'], ['listJenisSurat'], ['detailRumah'], ['listPengaduan'], ['listPerubahan'], ['listNotulen']],
    ketua: [['listRumah'], ['listSurat'], ['ringkasanKas'], ['listTransaksi', { kas: '', batas: 300 }], ['listPengaduan'], ['listKeringanan']],
    sekretaris: [['listRumah'], ['listSurat'], ['listGaleri'], ['listNotulen'], ['listPengaduan']],
    admin: [['listRumah'], ['listAkun'], ['getPengaturan'], ['listPengurus'], ['listPerubahan'], ['listIuranKhusus'], ['listJenisSurat'], ['listTemplateWA']]
  }[p] || [['listRumah'], ['ringkasanKas'], ['listPembayaran', { status: 'Menunggu' }], ['listIuranKhusus'], ['listTagihan', {}], ['listTransaksi', { kas: Sesi.user.kas, batas: 300 }]];
  prefetch(umum.concat(per));
}
function gambarSide(aktif) {
  const u = Sesi.user;
  const grup = menuPeran(u.peran).map(([g, keys]) => `<div class="grp">${esc(g)}</div>` + keys.filter(k => Halaman[k]).map(k => {
    const d = Halaman[k]; const n = _hitung[k];
    return `<a href="#/panel/${k}" class="${k === aktif ? 'on' : ''}">${ikon(d.ikon)}<span>${esc(d.menu || d.judul)}</span>${n ? `<span class="cnt ${d.cntMerah ? 'r' : ''}">${n}</span>` : ''}</a>`;
  }).join('')).join('');
  $('#side').innerHTML = `<a class="brand" href="#/panel/dashboard"><span class="logo">${logoImg()}</span><span><b>RT ONLINE</b><span>Panel ${u.peran === 'warga' ? 'Warga' : u.peran === 'admin' ? 'Administrator' : 'Pengurus'}</span></span></a>
    <div class="me"><span class="avatar">${esc(inisial(u.nama))}</span><div class="grow"><b>${esc(u.nama)}</b><small>${esc(u.peran === 'warga' && u.rumah ? 'Blok ' + u.rumah.blok + ' No. ' + u.rumah.no : u.peranLabel)}</small></div></div>
    <nav>${grup}</nav>
    <div class="foot"><a href="#/">${ikon('external', 'sm')} Lihat Portal Publik</a><a href="javascript:void 0" class="out" onclick="keluar()">${ikon('logout', 'sm')} Keluar</a></div>`;
}
function gambarTop(def) {
  const u = Sesi.user;
  $('#top').innerHTML = `<button class="burger" aria-label="Buka menu" onclick="bukaSide()">${ikon('menu', 'lg')}</button>
    <div class="ttl">${esc(def.judul)}</div>
    <span class="role-chip"><span class="dot"></span>${esc(u.peranLabel)}${u.kas ? ' · ' + esc(LABEL_KAS[u.kas]) : ''}</span>
    <div class="user"><div class="nm"><b>${esc(u.nama)}</b><br><small>● Aktif</small></div><a href="#/panel/akun" class="avatar" title="Akun saya" style="text-decoration:none">${esc(inisial(u.nama))}</a></div>`;
}
function gambarBnav(aktif) {
  const keys = bnavPeran(Sesi.user.peran).filter(k => Halaman[k]);
  $('#bnav').innerHTML = keys.map(k => `<a href="#/panel/${k}" class="${k === aktif ? 'on' : ''}">${ikon(Halaman[k].ikon)}<span>${esc(Halaman[k].pendek || Halaman[k].menu || Halaman[k].judul)}</span>${_hitung[k] ? `<span class="cnt">${_hitung[k]}</span>` : ''}</a>`).join('')
    + `<button onclick="bukaSide()">${ikon('more')}<span>Lainnya</span></button>`;
}
function bukaSide() { $('#side').classList.add('open'); $('#scrim').classList.add('on'); }
function tutupSide() { const s = $('#side'); if (s) { s.classList.remove('open'); $('#scrim').classList.remove('on'); } }
async function keluar() {
  if (!await konfirmasi('Keluar dari RT ONLINE?', { ya: 'Keluar' })) return;
  try { await api('logout'); } catch (e) { }
  Sesi.hapus(); _layout = null; _sudahPrefetch = false; location.hash = '#/login'; toast('Anda telah keluar.');
}
/** Hitung badge menu (verifikasi menunggu, surat masuk, dll.) */
async function perbaruiHitung() {
  const p = Sesi.user && Sesi.user.peran;
  if (!p || p === 'warga') return;
  try {
    const d = await api('dashboard');
    _hitung = {};
    if (d.kas) { const k = d.kas.reduce((s, x) => s + (x.menungguVerifikasi || 0), 0); if (BENDAHARA.includes(p) && k) _hitung.verifikasi = k; }
    if (d.surat && d.surat.Diajukan && p === 'ketua') _hitung['surat-masuk'] = d.surat.Diajukan;
    if (d.statistik && d.statistik.perubahanMenunggu) _hitung.perubahan = d.statistik.perubahanMenunggu;
    if (d.statistik && d.statistik.waGagal) _hitung.fonnte = d.statistik.waGagal;
    if (d.pengaduanTerbuka) _hitung.pengaduan = d.pengaduanTerbuka;
    window._dashCache = d;
    if (_layout === 'panel') { const a = (location.hash.split('/')[2] || 'dashboard'); gambarSide(a); gambarBnav(a); }
  } catch (e) { }
}

/** Kerangka judul halaman panel */
function kepala(judul, desc, aksi = '', crumb = '') {
  return `<div class="page-head"><div class="grow">${crumb ? `<div class="crumb">${crumb}</div>` : ''}<h1>${esc(judul)}</h1>${desc ? `<p class="desc">${desc}</p>` : ''}</div>${aksi ? `<div class="row">${aksi}</div>` : ''}</div>`;
}

// ============================================================
// INISIALISASI
// ============================================================
window.addEventListener('hashchange', () => router());
document.addEventListener('DOMContentLoaded', () => {
  if (!cekKonfigurasi()) console.warn('RT ONLINE: GAS_URL belum diisi di js/config.js');
  router();
});
