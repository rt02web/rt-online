/**
 * panel.js — Dashboard per peran, akun (ganti password), dan pusat informasi warga.
 */

function bannerPanel(judul, teks) {
  return `<div class="banner">${bgGerbang()}<div class="in"><span class="pill-tag"><span class="dot"></span>${esc(Identitas.data.namaRT || 'RT02 RW29 Gading Elok 1')}</span><h2>${esc(judul)}</h2><p>${esc(teks || Identitas.data.banner || '')}</p></div></div>`;
}
function kpiCard(ik, lbl, val, note, cls = '', extra = '') {
  return `<div class="card kpi ${extra}"><div class="ico ${cls}">${ikon(ik)}</div><div class="lbl">${esc(lbl)}</div><div class="val">${val}</div>${note ? `<div class="note">${note}</div>` : ''}</div>`;
}
function tabelTrx(rows, opsi = {}) {
  if (!rows.length) return kosong('Belum ada transaksi.', 'receipt');
  return `<div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Tanggal</th><th>Uraian</th>${opsi.kas ? '<th>Kas</th>' : ''}<th class="right">Nominal</th><th>Status</th>${opsi.aksi ? '<th></th>' : ''}</tr></thead><tbody>
    ${rows.map(t => {
      const kas = Sesi.user.kas;
      const plus = t.jenis === 'masuk' || t.jenis === 'saldo_awal' || ((t.jenis === 'serah_terima' || t.jenis === 'alokasi') && kas && t.tujuan === kas);
      const st = t.jenis === 'serah_terima' || t.jenis === 'alokasi';
      return `<tr><td data-l="Tanggal" class="nowrap">${esc(tgl(t.tanggal, true))}<div class="sub mono">${esc(t.id)}</div></td>
      <td data-l="Uraian">${esc(t.uraian)}<div class="sub">${esc(t.kategori)}${st ? ' · ' + esc(LABEL_KAS[t.sumber] || t.sumber) + ' → ' + esc(LABEL_KAS[t.tujuan] || t.tujuan) : ''}</div></td>
      ${opsi.kas ? `<td data-l="Kas"><span class="badge info">${esc(t.kasLabel)}</span></td>` : ''}
      <td data-l="Nominal" class="money ${st && !kas ? '' : plus ? 'plus' : 'minus'}">${st && !kas ? '' : plus ? '+' : '−'}${rp(t.nominal)}</td>
      <td data-l="Status">${badge(t.status)}</td>
      ${opsi.aksi ? `<td data-l="">${opsi.aksi(t)}</td>` : ''}</tr>`;
    }).join('')}</tbody></table></div>`;
}

// ============================================================
// DASHBOARD
// ============================================================
daftarHalaman('dashboard', {
  judul: 'Dashboard', ikon: 'grid', pendek: 'Beranda',
  render: async el => {
    const u = Sesi.user;
    const d = await api('dashboard');
    window._dashCache = d;
    if (u.peran === 'warga') return dashWarga(el, d);
    if (u.peran === 'admin') return dashAdmin(el, d);
    return dashPengurus(el, d);
  }
});

function dashWarga(el, d) {
  const k = d.keuangan;
  el.innerHTML = bannerPanel('Halo, ' + (d.rumah.kepala || Sesi.user.nama), d.rumah.label + ' · ' + (d.banner || '')) + `
  <div class="grid g-4">
    ${kpiCard('receipt', 'Sisa tagihan', rp(k.tunggakan), k.tagihanTerbuka.length + ' tagihan belum lunas', k.tunggakan ? 'r' : 'g')}
    ${kpiCard('wallet', 'Saldo di muka', rp(k.saldoMuka), 'Otomatis dipakai untuk tagihan berikutnya', 'g')}
    ${kpiCard('clock', 'Menunggu verifikasi', rp(k.menungguVerifikasi), 'Belum mengurangi tagihan', 'y')}
    ${kpiCard('file', 'Pengajuan surat', d.surat.length, d.surat[0] ? esc(d.surat[0].jenis) + ': ' + esc(d.surat[0].status) : 'Belum ada pengajuan')}
  </div>
  <div class="split mt-3">
    <div class="stack">
      <div class="card"><div class="card-h"><h3>${ikon('receipt')} Tagihan belum lunas</h3><a class="btn btn-primary btn-sm" href="#/panel/tagihan-saya">${ikon('upload', 'sm')} Bayar / unggah bukti</a></div>
        ${k.tagihanTerbuka.length ? k.tagihanTerbuka.slice(0, 5).map(t => `<div class="list-item"><div class="grow"><div class="ttl">${esc(t.label)}</div><div class="small muted">${esc(t.kasLabel)}${t.jatuhTempo ? ' · jatuh tempo ' + esc(tgl(t.jatuhTempo, true)) : ''}</div></div><div class="right"><div class="mono">${rp(t.sisa)}</div>${badge(t.status)}</div></div>`).join('') : `<div class="alert ok">${ikon('check')}<div>Semua tagihan sudah lunas. Terima kasih!</div></div>`}</div>
      ${d.kasUmum ? kartuKasUmumWarga(d.kasUmum) : ''}
      <div class="card"><div class="card-h"><h3>${ikon('megaphone')} Pengumuman terbaru</h3><a href="#/panel/info">Semua ${ikon('right', 'sm')}</a></div>
        ${d.pengumuman.length ? d.pengumuman.map(p => `<div class="list-item" style="cursor:pointer" onclick='bacaPengumuman(${JSON.stringify(p).replace(/'/g, "&#39;")})'><div class="grow"><div class="row gap-sm">${badge(p.prioritas)}${p.audiens === 'Khusus Warga' ? '<span class="badge">Khusus Warga</span>' : ''}</div><div class="ttl mt-1">${esc(p.judul)}</div><div class="small muted">${esc(tglJam(p.tanggal))}</div></div>${ikon('right')}</div>`).join('') : kosong('Belum ada pengumuman.', 'megaphone')}</div>
    </div>
    <div class="stack">
      <div class="card"><div class="card-h"><h3>${ikon('history')} Pembayaran terakhir</h3></div>
        ${d.pembayaranTerakhir.length ? d.pembayaranTerakhir.map(p => `<div class="list-item"><div class="grow"><div class="ttl mono">${rp(p.nominal)}</div><div class="small muted">${esc(p.metode)} · ${esc(tglJam(p.tanggal))}</div></div>${badge(p.status)}</div>`).join('') : kosong('Belum ada pembayaran.')}
        <a class="btn btn-outline btn-block mt-1" href="#/panel/riwayat-bayar">Riwayat lengkap</a></div>
      <div class="card"><div class="card-h"><h3>${ikon('calendar')} Agenda terdekat</h3></div>${d.agenda.length ? d.agenda.map(a => itemAgenda(a)).join('') : kosong('Belum ada agenda.', 'calendar')}</div>
      <div class="card"><h3 class="mb-1" style="font-size:17px">Layanan cepat</h3><div class="grid g-2" style="gap:.5rem">
        <a class="btn btn-outline" href="#/panel/surat-saya">${ikon('file')} Ajukan surat</a><a class="btn btn-outline" href="#/panel/pengaduan-saya">${ikon('message')} Pengaduan</a>
        <a class="btn btn-outline" href="#/panel/keluarga">${ikon('users')} Data keluarga</a><a class="btn btn-outline" href="#/panel/akun">${ikon('key')} Ganti password</a></div></div>
    </div>
  </div>`;
  tipGrafik(el);
}

/** Transparansi Kas Umum untuk warga: saldo awal, pemasukan, pengeluaran, saldo akhir + grafik 6 bulan */
function kartuKasUmumWarga(k) {
  const kpi = (l, v, cls) => `<div class="card" style="box-shadow:none;padding:14px"><div class="xs muted" style="font-weight:600;text-transform:uppercase;letter-spacing:.04em">${l}</div><div class="mono mt-1" style="font-size:19px;font-weight:600;${cls || ''}">${v}</div></div>`;
  return `<div class="card"><div class="card-h"><div><h3>${ikon('bank')} Kas Umum RT</h3><div class="sub">Periode ${esc(periodeLabel(k.periode))} · transaksi terkonfirmasi</div></div><span class="badge info">Transparansi</span></div>
    <div class="grid kas-mini" style="gap:.6rem">${kpi('Saldo awal', rp(k.saldoAwal))}${kpi('Pemasukan', '+' + rp(k.pemasukan), 'color:var(--green-deep)')}${kpi('Pengeluaran', '−' + rp(k.pengeluaran), 'color:var(--danger)')}${kpi('Saldo akhir', rp(k.saldoAkhir), 'color:var(--navy)')}</div>
    <div class="mt-2">${k.tren.some(b => b.masuk || b.keluar) ? grafikBatang(k.tren.map(b => ({ label: b.label, a: b.masuk, b: b.keluar })), 'Pemasukan', 'Pengeluaran') : kosong('Belum ada transaksi Kas Umum dalam 6 bulan terakhir.', 'chart')}</div>
    <details class="mt-1 small"><summary style="cursor:pointer">Tampilkan tabel 6 bulan</summary><div class="table-wrap"><table class="tbl mt-1"><thead><tr><th>Bulan</th><th class="right">Saldo awal</th><th class="right">Masuk</th><th class="right">Keluar</th><th class="right">Saldo akhir</th></tr></thead><tbody>
      ${k.tren.map(b => `<tr><td>${esc(periodeLabel(b.periode))}</td><td class="money">${rp(b.saldoAwal)}</td><td class="money plus">${rp(b.masuk)}</td><td class="money minus">${rp(b.keluar)}</td><td class="money">${rp(b.saldoAkhir)}</td></tr>`).join('')}</tbody></table></div></details></div>`;
}

function dashAdmin(el, d) {
  const s = d.statistik;
  el.innerHTML = kepala('Dashboard Administrator', 'Ringkasan data warga, akun, kapasitas sistem, dan integrasi WhatsApp.', `<a class="btn btn-outline" href="#/panel/impor">${ikon('upload')} Impor Excel</a><a class="btn btn-primary" href="#/panel/akun-kelola">${ikon('users')} Kelola akun</a>`) + `
  <div id="ver-alert"></div>
  ${s.migrasiError ? `<div class="alert err mb-2">${ikon('alert')}<div><b>Pembaruan struktur data tertunda.</b> ${esc(s.migrasiError)}<br><span class="small">Data Anda aman dan tidak diubah. Kembalikan urutan kolom pada tab tersebut seperti semula, lalu muat ulang halaman.</span></div></div>` : ''}
  ${!s.tokenFonnte ? `<div class="alert warn mb-2">${ikon('alert')}<div><b>Token Fonnte belum diatur.</b> Notifikasi WhatsApp akan tertahan di antrean. <a href="#/panel/fonnte">Atur sekarang</a></div></div>` : ''}
  ${s.rumahTanpaAkun ? `<div class="alert info mb-2">${ikon('info')}<div>${s.rumahTanpaAkun} rumah belum memiliki akun warga. <a href="#/panel/akun-kelola">Buat akun warga</a></div></div>` : ''}
  <div class="grid g-4">
    ${kpiCard('home', 'Total rumah', s.rumah, `${s.dihuni} dihuni · ${s.dikontrak} kontrak · ${s.kosong} kosong`)}
    ${kpiCard('users', 'Total jiwa', s.jiwa, `${s.laki} L · ${s.perempuan} P`, 'g')}
    ${kpiCard('key', 'Akun aktif', s.akunAktif, `${s.akunBaru} belum ganti password · ${s.akunTerkunci} terkunci`, 'y')}
    ${kpiCard('edit', 'Perubahan data', s.perubahanMenunggu, 'Menunggu persetujuan', s.perubahanMenunggu ? 'r' : '')}
  </div>
  <div class="row between mt-3 mb-1"><h3 style="font-size:17px">${ikon('database')} Kapasitas sistem</h3><button class="btn btn-ghost btn-sm" id="sys-segar">${ikon('refresh', 'sm')} Perbarui</button></div>
  <div class="grid g-3" id="sys-cards">${[1, 2, 3].map(() => '<div class="card"><div class="skel" style="height:110px"></div></div>').join('')}</div>
  <div class="split mt-3">
    <div class="card flush"><div class="card-h"><h3>${ikon('history')} Aktivitas terbaru</h3><a href="#/panel/log">Log lengkap ${ikon('right', 'sm')}</a></div>
      <div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Waktu</th><th>Pelaku</th><th>Aksi</th><th>Data</th></tr></thead><tbody>
      ${d.log.map(l => `<tr><td data-l="Waktu" class="mono nowrap">${esc(l.waktu)}</td><td data-l="Pelaku">${esc(l.nama)}<div class="sub">${esc(l.peranLabel)}</div></td><td data-l="Aksi"><span class="badge info">${esc(l.aksi)}</span><div class="sub">${esc(l.modul)}</div></td><td data-l="Data" class="mono small">${esc(l.idData)}</td></tr>`).join('') || `<tr><td colspan="4">${kosong('Belum ada aktivitas.')}</td></tr>`}
      </tbody></table></div></div>
    <div class="stack">
      <div class="card"><div class="card-h"><h3>${ikon('wa')} WhatsApp</h3>${badge(s.tokenFonnte ? 'Aktif' : 'NONAKTIF', s.tokenFonnte ? 'Token tersimpan' : 'Belum ada token')}</div>
        <dl class="kv"><dt>Antrean</dt><dd>${s.antreanWA} pesan</dd><dt>Gagal</dt><dd>${s.waGagal} pesan</dd></dl><a class="btn btn-outline btn-block mt-2" href="#/panel/fonnte">Buka integrasi Fonnte</a></div>
      <div class="card"><h3 class="mb-1" style="font-size:17px">Pintasan</h3><div class="stack" style="--g:.5rem">
        <a class="btn btn-outline btn-block" href="#/panel/identitas">${ikon('image')} Ganti logo & foto latar perumahan</a>
        <a class="btn btn-outline btn-block" href="#/panel/identitas">${ikon('building')} Identitas & pengurus</a>
        <a class="btn btn-outline btn-block" href="#/panel/pengaturan">${ikon('sliders')} Nominal & pengaturan</a>
        <a class="btn btn-outline btn-block" href="#/panel/perubahan">${ikon('edit')} Perubahan data warga</a>
        <a class="btn btn-outline btn-block" href="#/panel/penerima-wa">${ikon('wa')} Penerima WA per keluarga</a>
        <a class="btn btn-outline btn-block" href="#/panel/statistik-warga">${ikon('chart')} Statistik warga (balita, lansia, dll.)</a></div></div>
    </div>
  </div>`;
  cekVersiBackend();
  muatKapasitas(false);
  $('#sys-segar').onclick = () => muatKapasitas(true);
}

const VERSI_FRONTEND = '1.3.0';
/** Peringatan bila kode Apps Script yang aktif masih versi lama */
async function cekVersiBackend() {
  try {
    const p = await api('ping');
    const v = String((p && p.versi) || '1.0.0');
    const angka = x => x.split('.').map(Number).reduce((a, n) => a * 1000 + (n || 0), 0);
    if (angka(v) < angka(VERSI_FRONTEND) && $('#ver-alert')) {
      $('#ver-alert').innerHTML = `<div class="alert err mb-2">${ikon('alert')}<div><b>Server (Apps Script) masih versi ${esc(v)}, tampilan sudah versi ${VERSI_FRONTEND}.</b> Beberapa menu baru (Statistik Warga, Penerima WA, kapasitas sistem) belum bisa dipakai.<br><span class="small">Buka Apps Script → pastikan isi berkas sudah diganti → <b>Terapkan → Kelola deployment → ikon pensil → Versi: Versi baru → Terapkan</b>. Jangan pilih "Deployment baru".</span></div></div>`;
    }
  } catch (e) { }
}

const ukuranBerkas = b => { b = Number(b) || 0; const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; } return (i ? b.toFixed(b < 10 ? 2 : 1) : b) + ' ' + u[i]; };
const angkaID = n => Number(n || 0).toLocaleString('id-ID');
function batang(persen) {
  const p = Math.max(0, Math.min(100, Number(persen) || 0));
  const w = p >= 90 ? 'var(--danger)' : p >= 75 ? '#D97706' : 'var(--chart-b)';
  return `<div class="bar mt-1" style="height:10px"><span style="width:${Math.max(p, 1)}%;background:${w}"></span></div>`;
}

/** Kartu kapasitas: database (Google Sheets), Google Drive, kuota WhatsApp (Fonnte) */
async function muatKapasitas(segar) {
  const box = $('#sys-cards'); if (!box) return;
  if (segar) box.style.opacity = .5;
  try {
    const r = await api('ringkasanSistem', segar ? { segar: true } : {}, { segar });
    if (!$('#sys-cards')) return;
    const db = r.database || {}, dr = r.drive || {}, wa = r.wa || {};
    const kartu = (ik, warna, judul, isi) => `<div class="card"><div class="row between"><div class="lbl-f" style="font-weight:700;color:var(--ink-2,#475569);text-transform:uppercase;font-size:12px;letter-spacing:.05em">${judul}</div><div class="ico ${warna}" style="width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:var(--navy-50)">${ikon(ik)}</div></div>${isi}</div>`;
    const gagalTxt = e => `<div class="small" style="color:var(--danger)">Tidak dapat dibaca: ${esc(e)}</div>`;
    box.innerHTML =
      kartu('database', '', 'Database (Google Sheets)', db.error ? gagalTxt(db.error) : `
        <div class="mono" style="font-size:24px;font-weight:700;margin-top:6px">${db.persen}%</div>${batang(db.persen)}
        <div class="small muted mt-1">${angkaID(db.sel)} dari ${angkaID(db.batasSel)} sel terpakai · ${angkaID(db.baris)} baris data di ${db.jumlahTab} tab</div>
        <div class="xs muted mt-1">Terbesar: ${(db.tabTerbesar || []).slice(0, 3).map(t => esc(t.nama) + ' (' + angkaID(t.baris) + ')').join(', ')}</div>`) +
      kartu('cloud', '', 'Penyimpanan Google Drive', dr.error ? gagalTxt(dr.error) : `
        <div class="mono" style="font-size:24px;font-weight:700;margin-top:6px">${dr.batas ? dr.persen + '%' : ukuranBerkas(dr.terpakai)}</div>${dr.batas ? batang(dr.persen) : ''}
        <div class="small muted mt-1">${ukuranBerkas(dr.terpakai)} dari ${dr.batas ? ukuranBerkas(dr.batas) : 'tak terbatas'} terpakai (seluruh akun Google)</div>
        <div class="xs muted mt-1">Dipakai aplikasi: ${ukuranBerkas(dr.aplikasi)} · ${angkaID(dr.jumlahFile)}${dr.terpotong ? '+' : ''} berkas (bukti bayar, foto, surat)</div>`) +
      kartu('wa', 'g', 'Kuota WhatsApp (Fonnte)', wa.error ? gagalTxt(wa.error) : !wa.adaToken ? `<div class="small mt-2">Token Fonnte belum diatur. <a href="#/panel/fonnte">Atur sekarang</a></div>` : `
        <div class="mono" style="font-size:24px;font-weight:700;margin-top:6px">${wa.kuota === null || wa.kuota === undefined ? '—' : typeof wa.kuota === 'number' ? angkaID(wa.kuota) + ' <span class="small muted" style="font-family:var(--font)">pesan tersisa</span>' : esc(wa.kuota)}</div>
        <div class="small muted mt-1">${wa.paket ? 'Paket ' + esc(wa.paket) : ''}${wa.berakhir ? ' · berlaku s.d. ' + esc(wa.berakhir) : ''}${wa.status ? ' · ' + esc(wa.status) : ''}</div>
        <div class="xs muted mt-1">Terkirim hari ini ${angkaID(wa.terkirimHariIni)} / batas ${angkaID(wa.limitHari)} · bulan ini ${angkaID(wa.terkirimBulanIni)} · antre ${angkaID(wa.antrean)}${wa.gagalBulanIni ? ' · gagal ' + angkaID(wa.gagalBulanIni) : ''}</div>
        ${typeof wa.kuota === 'number' && wa.kuota < 100 ? `<div class="alert warn mt-2" style="padding:8px 10px">${ikon('alert', 'sm')}<div class="small">Kuota hampir habis. Isi ulang di dashboard Fonnte.</div></div>` : ''}`);
    const info = document.getElementById('sys-info');
    if (info) info.remove();
    box.insertAdjacentHTML('afterend', `<div class="xs muted mt-1" id="sys-info">Diperbarui ${esc(r.diperbarui)}. Data dicek ulang otomatis tiap 30 menit.</div>`);
  } catch (e) {
    if ($('#sys-cards')) $('#sys-cards').innerHTML = `<div class="card" style="grid-column:1/-1"><div class="small" style="color:var(--danger)">${ikon('alert', 'sm')} Kapasitas sistem belum dapat dimuat: ${esc(e.message)}</div></div>`;
  } finally { if ($('#sys-cards')) $('#sys-cards').style.opacity = 1; }
}

function dashPengurus(el, d) {
  const u = Sesi.user;
  const kasIkon = { umum: 'bank', pembangunan: 'hammer', jimpitan: 'coins', sosial: 'heart' };
  let html = kepala(u.peran === 'ketua' ? 'Dashboard Ketua RT' : u.peran === 'sekretaris' ? 'Dashboard Sekretaris' : 'Dashboard ' + LABEL_KAS[u.kas],
    'Ringkasan data aktual ' + esc(Identitas.data.namaRT || '') + ' per ' + esc(tgl(hariIni())) + '.',
    BENDAHARA.includes(u.peran) ? `<a class="btn btn-outline" href="#/panel/catat-tunai">${ikon('plus')} Catat tunai</a>${u.peran === 'bend_umum' ? `<a class="btn btn-primary" href="#/panel/penerbitan">${ikon('receipt')} Terbitkan IPL ${esc(periodeLabel(periodeIni()).split(' ')[0])}</a>` : ''}` : u.peran === 'ketua' ? `<a class="btn btn-primary" href="#/panel/surat-masuk">${ikon('mail')} Kotak surat</a>` : `<a class="btn btn-primary" href="#/panel/kelola-pengumuman">${ikon('plus')} Pengumuman baru</a>`);

  html += `<div class="row between mb-1"><h3 style="font-size:18px">${ikon('bank')} Saldo kas</h3>${u.peran === 'sekretaris' ? '<span class="badge">Baca saja</span>' : ''}</div>
  <div class="grid ${d.kas.length > 1 ? 'g-4' : 'g-3'}">${d.kas.map(k => `<div class="card kpi"><div class="ico">${ikon(kasIkon[k.kas])}</div><div class="lbl">${esc(k.label)}</div><div class="val mono" style="font-size:24px">${rp(k.saldo)}</div>
    <div class="note">Bulan ini <span class="mono" style="color:var(--green-deep)">+${rp(k.masukBulanIni)}</span> / <span class="mono" style="color:var(--danger)">−${rp(k.keluarBulanIni)}</span></div>
    ${k.titipan ? `<div class="note">${ikon('clock', 'sm')} Titipan menunggu konfirmasi: ${rp(k.titipan)}</div>` : ''}${k.menungguVerifikasi ? `<div class="mt-1"><span class="badge proses">${k.menungguVerifikasi} bukti menunggu verifikasi</span></div>` : ''}</div>`).join('')}
    ${d.kas.length === 1 ? kpiCard('clock', 'Menunggu verifikasi', d.kas[0].menungguVerifikasi, '<a href="#/panel/verifikasi">Buka antrean</a>', 'y') + kpiCard('swap', 'Serah terima masuk', (d.serahTerimaMasuk || []).length, 'Perlu konfirmasi Anda', 'g') : ''}</div>`;
  if (BENDAHARA.includes(u.peran) && d.kas.length === 1 && !d.kas[0].saldoAwal) {
    html += `<div class="alert info mt-2">${ikon('info')}<div><b>Saldo awal ${esc(LABEL_KAS[u.kas])} belum diisi.</b> Masukkan uang kas yang sudah ada sebelum aplikasi dipakai agar saldo sesuai. <a href="#/panel/transaksi">Isi saldo awal</a></div></div>`;
  }

  if (d.serahTerimaMasuk && d.serahTerimaMasuk.length) {
    html += `<div class="card mt-3"><div class="card-h"><h3>${ikon('swap')} Serah terima menunggu konfirmasi</h3></div>${d.serahTerimaMasuk.map(t => `<div class="list-item"><div class="grow"><div class="ttl">${esc(t.uraian)}</div><div class="small muted">Dari ${esc(LABEL_KAS[t.sumber])} · ${esc(tgl(t.tanggal))}</div></div><b class="mono">${rp(t.nominal)}</b>
      <button class="btn btn-accent btn-sm" onclick="konfSerah('${t.id}',true,this)">${ikon('tick', 'sm')} Terima</button><button class="btn btn-danger btn-sm" onclick="konfSerah('${t.id}',false,this)">Tolak</button></div>`).join('')}</div>`;
  }

  if (d.ipl) {
    const i = d.ipl;
    const pct = i.total ? Math.round(i.lunas / i.total * 1000) / 10 : 0;
    html += `<div class="grid g-4 mt-3">
      ${kpiCard('check', 'Rumah lunas IPL', `${i.lunas}<small>/ ${i.total}</small>`, esc(periodeLabel(i.periode)) + ` · ${pct}%`, 'g')}
      ${kpiCard('alert', 'Rumah menunggak', i.rumahMenunggak, 'Tunggakan IPL ' + rp(i.tunggakanTotal), 'r')}
      ${kpiCard('chart', 'Realisasi bulan ini', rp(i.realisasi), 'dari target ' + rp(i.target))}
      ${kpiCard('clock', 'Bayar sebagian', i.sebagian, i.belum + ' rumah belum bayar', 'y')}</div>
    <div class="split mt-3">
      <div class="card"><div class="card-h"><div><h3>Target vs realisasi IPL</h3><div class="sub">6 bulan terakhir · tagihan yang diterbitkan vs terbayar</div></div></div>${grafikBatang(d.trenIpl.map(t => ({ label: t.label, a: t.target, b: t.realisasi })), 'Target', 'Realisasi')}
        <details class="mt-1 small"><summary style="cursor:pointer">Tampilkan tabel</summary><table class="tbl mt-1"><thead><tr><th>Bulan</th><th class="right">Target</th><th class="right">Realisasi</th></tr></thead><tbody>${d.trenIpl.map(t => `<tr><td>${esc(periodeLabel(t.periode))}</td><td class="money">${rp(t.target)}</td><td class="money">${rp(t.realisasi)}</td></tr>`).join('')}</tbody></table></details></div>
      <div class="card"><div class="card-h"><h3>Status IPL ${esc(periodeLabel(i.periode))}</h3><span class="badge">${i.total} total</span></div>
        ${grafikDonat([{ label: 'Lunas', n: i.lunas, warna: '#5F9A1F' }, { label: 'Sebagian', n: i.sebagian, warna: '#D69E2E' }, { label: 'Belum bayar', n: i.belum, warna: '#C53030' }], pct + '%', 'LUNAS')}
        ${[['Lunas', i.lunas, '#5F9A1F', 'check'], ['Sebagian', i.sebagian, '#D69E2E', 'clock'], ['Belum bayar', i.belum, '#C53030', 'alert']].map(([l, n, c, ic]) => `<div class="list-item"><span style="color:${c}">${ikon(ic, 'sm')}</span><span class="grow">${l}</span><b>${n} rumah</b></div>`).join('')}</div>
    </div>`;
  }

  if (d.surat) {
    const s = d.surat;
    html += `<div class="grid g-4 mt-3">${kpiCard('mail', 'Surat diajukan', s.Diajukan || 0, '<a href="#/panel/surat-masuk">Buka kotak surat</a>', 'y')}${kpiCard('edit', 'Perlu perbaikan', s['Perlu Perbaikan'] || 0, 'Menunggu warga')}${kpiCard('check', 'Selesai diterbitkan', s['Selesai Diterbitkan'] || 0, 'Total arsip', 'g')}${kpiCard('message', 'Pengaduan terbuka', d.pengaduanTerbuka || 0, '<a href="#/panel/pengaduan">Tanggapi</a>', d.pengaduanTerbuka ? 'r' : '')}</div>`;
  }
  if (d.konten) {
    html += `<div class="grid g-4 mt-3">${kpiCard('megaphone', 'Pengumuman', d.konten.pengumuman, '')}${kpiCard('calendar', 'Agenda mendatang', d.konten.agendaMendatang, '', 'g')}${kpiCard('image', 'Foto galeri', d.konten.galeri, '')}${kpiCard('file', 'Notulen', d.konten.notulen, '', 'y')}</div>`;
  }
  html += `<div class="split mt-3">
    ${d.transaksi ? `<div class="card flush"><div class="card-h"><div><h3>${ikon('receipt')} Mutasi terakhir</h3><div class="sub">Transaksi kas terbaru</div></div><a href="#/panel/${u.peran === 'ketua' ? 'transaksi' : 'transaksi'}">Buku kas ${ikon('right', 'sm')}</a></div>${tabelTrx(d.transaksi, { kas: u.peran === 'ketua' })}</div>` : '<div></div>'}
    <div class="card"><div class="card-h"><h3>${ikon('calendar')} Agenda RT</h3></div>${d.agenda.length ? d.agenda.map(a => itemAgenda(a)).join('') : kosong('Belum ada agenda.', 'calendar')}</div></div>`;
  if (d.iuranAktif && d.iuranAktif.length) {
    html += `<div class="card mt-3"><div class="card-h"><h3>${ikon('coins')} Iuran khusus aktif</h3><a href="#/panel/penerbitan">Kelola</a></div>${d.iuranAktif.map(i => `<div class="list-item"><div class="grow"><div class="ttl">${esc(i.nama)}</div><div class="bar g mt-1"><span style="width:${i.target ? Math.min(100, i.terkumpul / i.target * 100) : 0}%"></span></div></div><div class="right small"><b class="mono">${rp(i.terkumpul)}</b><div class="muted">dari ${rp(i.target)}</div></div></div>`).join('')}</div>`;
  }
  el.innerHTML = html;
  tipGrafik(el);
}

async function konfSerah(id, setuju, btn) {
  if (!setuju && !await konfirmasi('Tolak serah terima ini? Dana tetap di kas sumber.', { bahaya: true, ya: 'Tolak' })) return;
  await sibuk(btn, async () => {
    try { const r = await api('konfirmasiSerahTerima', { id, setuju }); toast(r.pesan); router(); } catch (e) { gagal(e); }
  });
}

// ============================================================
// AKUN SAYA
// ============================================================
daftarHalaman('akun', {
  judul: 'Akun Saya', ikon: 'key', menu: 'Akun & Password', pendek: 'Akun',
  render: async el => {
    const u = Sesi.user;
    const wajib = u.harusGantiPassword;
    el.innerHTML = kepala('Akun Saya', wajib ? 'Demi keamanan, ganti password awal sebelum menggunakan aplikasi.' : 'Kelola password akun Anda.') + `
    <div class="split"><div class="card">
      ${wajib ? `<div class="alert warn mb-2">${ikon('lock')}<div><b>Wajib ganti password.</b> Password awal dari Administrator hanya untuk login pertama.</div></div>` : ''}
      <form id="pw-form" class="stack" novalidate>
        ${field({ n: 'lama', l: wajib ? 'Password awal' : 'Password lama', t: 'password', req: true })}
        ${field({ n: 'baru', l: 'Password baru', t: 'password', req: true, ac: 'new-password', hint: 'Minimal 8 karakter, kombinasi huruf dan angka.' })}
        ${field({ n: 'ulang', l: 'Ulangi password baru', t: 'password', req: true, ac: 'new-password' })}
        ${u.perluPersetujuan ? `<div class="card" style="background:var(--hover);box-shadow:none"><b>Persetujuan penggunaan data pribadi</b><p class="small muted mt-1">Data keluarga Anda (nama, tanggal lahir, nomor HP) dipakai hanya untuk administrasi RT02/RW29: pendataan warga, tagihan iuran, penerbitan surat, dan pemberitahuan WhatsApp. Data tidak dibagikan kepada pihak lain dan hanya dapat diakses pengurus yang berwenang, mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. Anda dapat meminta perbaikan data melalui menu Data Keluarga.</p>
          ${field({ n: 'setujuPrivasi', l: 'Saya memahami dan menyetujui penggunaan data pribadi keluarga saya untuk keperluan administrasi RT.', t: 'check' })}</div>` : ''}
        <button class="btn btn-primary" type="submit">${ikon('key')} Simpan password baru</button>
      </form></div>
      <div class="card"><div class="card-h"><h3>${ikon('user')} Profil</h3></div><dl class="kv">
        <dt>Nama</dt><dd>${esc(u.nama)}</dd><dt>Peran</dt><dd>${esc(u.peranLabel)}</dd>
        ${u.rumah ? `<dt>Rumah</dt><dd>Blok ${esc(u.rumah.blok)} No. ${esc(u.rumah.no)}</dd>` : `<dt>Username</dt><dd class="mono">${esc(u.username)}</dd>`}
        ${u.kas ? `<dt>Kas</dt><dd>${esc(LABEL_KAS[u.kas])}</dd>` : ''}</dl>
        <p class="small muted mt-2">Lupa password? Administrator dapat mereset dan memberi password awal baru.</p>
        <button class="btn btn-danger btn-block mt-1" onclick="keluar()">${ikon('logout')} Keluar</button></div></div>`;
    $('#pw-form').onsubmit = async e => {
      e.preventDefault();
      if (!validasiForm(e.target)) return;
      const f = await bacaForm(e.target);
      if (f.baru !== f.ulang) return toast('Ulangan password tidak sama.', 'err');
      if (u.perluPersetujuan && !f.setujuPrivasi) return toast('Mohon setujui penggunaan data pribadi.', 'err');
      await sibuk($('button[type=submit]', e.target), async () => {
        try {
          const r = await api('gantiPassword', { lama: f.lama, baru: f.baru, setujuPrivasi: f.setujuPrivasi });
          Sesi.simpan(r.token, r.user);
          toast('Password berhasil diganti.');
          _layout = null; location.hash = '#/panel/dashboard';
        } catch (ex) { gagal(ex); }
      });
    };
  }
});

// ============================================================
// PUSAT INFORMASI (warga & ketua)
// ============================================================
daftarHalaman('info', {
  judul: 'Pengumuman & Agenda', ikon: 'megaphone', menu: 'Pengumuman & Agenda', pendek: 'Info',
  render: async el => {
    const [p, a, n] = await Promise.all([api('listPengumuman'), api('listAgenda'), api('listNotulen')]);
    let tab = 'p';
    const gambar = () => {
      $('#inf').innerHTML = tab === 'p' ? (p.length ? `<div class="grid g-2">${p.map(x => kartuPengumuman(x, true)).join('')}</div>` : kosong('Belum ada pengumuman.', 'megaphone'))
        : tab === 'a' ? `<div class="card">${a.filter(x => x.tanggal >= hariIni()).map(x => itemAgenda(x, true)).join('') || kosong('Belum ada agenda mendatang.', 'calendar')}</div>`
          : (n.length ? n.map(x => `<div class="card mb-2"><h3 style="font-size:18px">${esc(x.judul)}</h3><div class="meta"><span>${ikon('calendar', 'sm')} ${esc(tgl(x.tanggal))}</span>${x.tempat ? `<span>${ikon('pin', 'sm')} ${esc(x.tempat)}</span>` : ''}</div>${x.keputusan ? `<p class="mt-2"><b>Keputusan:</b> ${nl2br(x.keputusan)}</p>` : ''}<details><summary style="cursor:pointer;color:var(--navy)">Pembahasan</summary><p>${nl2br(x.pembahasan)}</p></details>${x.lampiranId ? `<button class="btn btn-outline btn-sm" onclick="bukaBerkas('${esc(x.lampiranId)}')">${ikon('download', 'sm')} Lampiran</button>` : ''}</div>`).join('') : kosong('Belum ada notulen.', 'file'));
    };
    el.innerHTML = kepala('Pengumuman & Agenda', 'Informasi resmi pengurus, termasuk pengumuman khusus warga.') +
      `<div class="tabs mb-2"><button class="tab on" data-t="p">${ikon('megaphone', 'sm')} Pengumuman <span class="n">${p.length}</span></button><button class="tab" data-t="a">${ikon('calendar', 'sm')} Agenda</button><button class="tab" data-t="n">${ikon('file', 'sm')} Notulen</button></div><div id="inf"></div>`;
    $$('[data-t]', el).forEach(b => b.onclick = () => { tab = b.dataset.t; $$('[data-t]', el).forEach(x => x.classList.toggle('on', x === b)); gambar(); });
    gambar();
  }
});
