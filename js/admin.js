/**
 * admin.js — Data warga & rumah, impor Excel, akun, perubahan data, identitas & pengurus,
 * pengaturan nominal, iuran khusus, jenis surat, template WA, siaran WA, Fonnte, log.
 */

// ============================================================
// DATA WARGA & RUMAH
// ============================================================
daftarHalaman('data-warga', {
  judul: 'Data Warga & Rumah', ikon: 'users', menu: 'Data Warga & Rumah', pendek: 'Warga',
  render: async el => {
    const admin = Sesi.user.peran === 'admin';
    const rows = await daftarRumah(true);
    const blok = [...new Set(rows.map(r => r.blok))];
    let q = '', fb = '', fs = '', fi = '', sel = null;
    const jiwa = rows.reduce((s, r) => s + r.jiwa, 0);
    el.innerHTML = kepala('Data Warga & Rumah', `Master data ${rows.length} rumah dalam ${blok.length} blok (${blok.join(', ')}).`, admin ? `<button class="btn btn-outline" onclick="formRumah()">${ikon('plus')} Tambah rumah</button><a class="btn btn-outline" href="#/panel/impor">${ikon('upload')} Impor Excel</a><button class="btn btn-primary" id="dw-xls">${ikon('download')} Ekspor</button>` : `<button class="btn btn-outline" id="dw-xls">${ikon('download')} Ekspor</button>`) + `
    <div class="grid g-5">${kpiCard('home', 'Total rumah', rows.length, '')}${kpiCard('users', 'Dihuni pemilik', rows.filter(r => r.statusRumah === 'Dihuni').length, '', 'g')}${kpiCard('key', 'Dikontrak / sewa', rows.filter(r => r.statusRumah === 'Dikontrak').length, '')}${kpiCard('building', 'Kosong', rows.filter(r => r.statusRumah === 'Kosong').length, '', 'y')}${kpiCard('users', 'Total jiwa', jiwa, rows.reduce((s, r) => s + r.laki, 0) + ' L · ' + rows.reduce((s, r) => s + r.perempuan, 0) + ' P')}</div>
    <div class="card mt-3"><div class="row"><input class="input grow" id="dw-q" placeholder="Cari nomor rumah, nama kepala keluarga, nomor WA…" style="min-width:200px">
      <select class="input" id="dw-b" style="width:auto"><option value="">Semua blok</option>${blok.map(b => `<option>${esc(b)}</option>`).join('')}</select>
      <select class="input" id="dw-s" style="width:auto"><option value="">Semua status hunian</option>${OPSI_HUNIAN.map(([v, l]) => `<option value="${v}">${esc(LABEL_HUNIAN[v])}</option>`).join('')}</select>
      ${!admin ? `<select class="input" id="dw-i" style="width:auto"><option value="">Semua status IPL</option><option>Lunas</option><option>Sebagian</option><option>Belum Bayar</option><option value="-">Belum terbit</option></select>` : ''}</div></div>
    <div class="split mt-3"><div class="card flush"><div class="card-h"><h3>Daftar rumah</h3><span class="badge diajukan" id="dw-n"></span></div><div id="dw-tbl"></div></div><div id="dw-det"><div class="card">${kosong('Pilih rumah untuk melihat detail.', 'home')}</div></div></div>`;
    const filt = () => rows.filter(r => (!q || (r.blok + ' ' + r.no + ' ' + r.kepala + ' ' + r.wa + ' ' + (r.pemilik || '')).toLowerCase().includes(q)) && (!fb || r.blok === fb) && (!fs || r.statusRumah === fs) && (!fi || (fi === '-' ? !r.iplBulanIni : r.iplBulanIni === fi)));
    const gambar = () => {
      const list = filt();
      $('#dw-n').textContent = `Menampilkan ${list.length} dari ${rows.length}`;
      $('#dw-tbl').innerHTML = list.length ? `<div class="table-wrap" style="max-height:70vh;overflow:auto"><table class="tbl responsive"><thead><tr><th>Rumah</th><th>Kepala keluarga</th><th>Anggota</th><th>Status</th>${admin ? '<th>Akun</th>' : '<th>IPL bulan ini</th>'}<th>WhatsApp</th></tr></thead><tbody>
        ${list.map(r => `<tr class="clickable ${sel === r.id ? 'sel' : ''}" data-id="${r.id}"><td data-l="Rumah"><b>Blok ${esc(r.blok)} No. ${esc(r.no)}</b><div class="sub mono">${esc(r.id)}</div></td><td data-l="Kepala keluarga">${esc(r.kepala || '—')}</td><td data-l="Anggota">${r.jiwa} jiwa</td><td data-l="Status">${badgeHunian(r.statusRumah)}${r.statusRumah === 'Dikontrak' && r.pemilik ? `<div class="sub">Pemilik: ${esc(r.pemilik)}</div>` : ''}</td>
          ${admin ? `<td data-l="Akun">${r.akun ? badge(r.akun) : '<span class="badge">Belum ada</span>'}</td>` : `<td data-l="IPL">${r.iplBulanIni ? badge(r.iplBulanIni) : '<span class="muted small">—</span>'}${r.tunggakan ? `<div class="sub">Tunggakan ${rp(r.tunggakan)}</div>` : ''}</td>`}
          <td data-l="WhatsApp" class="mono small">${esc(r.wa || '—')}</td></tr>`).join('')}</tbody></table></div>` : kosong('Tidak ada rumah yang cocok.', 'home');
      $$('#dw-tbl tr[data-id]').forEach(tr => tr.onclick = () => { sel = tr.dataset.id; $$('#dw-tbl tr').forEach(x => x.classList.toggle('sel', x === tr)); detailRumahPanel(sel); if (window.innerWidth < 1024) $('#dw-det').scrollIntoView({ behavior: 'smooth' }); });
    };
    $('#dw-q').oninput = e => { q = e.target.value.toLowerCase(); gambar(); };
    $('#dw-b').onchange = e => { fb = e.target.value; gambar(); };
    $('#dw-s').onchange = e => { fs = e.target.value; gambar(); };
    if ($('#dw-i')) $('#dw-i').onchange = e => { fi = e.target.value; gambar(); };
    $('#dw-xls').onclick = () => eksporExcel(filt().map(r => ({ Blok: r.blok, 'No Rumah': r.no, 'ID Rumah': r.id, 'Kepala Keluarga': r.kepala, 'Status Rumah': LABEL_HUNIAN[r.statusRumah] || r.statusRumah, 'Pemilik Rumah': r.pemilik || '', 'WA Pemilik': r.waPemilik || '', 'Jumlah Jiwa': r.jiwa, 'WA Penerima': r.wa, Keterangan: r.keterangan })), 'Data_Rumah_RT02_' + hariIni() + '.xlsx', 'Rumah');
    gambar();
  }
});

async function detailRumahPanel(id) {
  const admin = Sesi.user.peran === 'admin';
  const box = $('#dw-det');
  box.innerHTML = `<div class="card">${loader()}</div>`;
  try {
    const d = await api('detailRumah', { id });
    window._det = d;
    const r = d.rumah;
    box.innerHTML = `<div class="card flush" style="position:sticky;top:80px"><div style="background:var(--navy);color:#fff;padding:20px"><div class="row between"><span class="eyebrow" style="color:#C9D8EA">Detail rumah</span>${badgeHunian(r.statusRumah)}</div><h2 style="color:#fff;font-size:22px" class="mt-1">Blok ${esc(r.blok)} No. ${esc(r.no)}</h2><div class="mono xs" style="color:#C9D8EA">${esc(r.id)}</div></div>
      <div style="padding:20px"><div class="card-h" style="margin-bottom:.5rem"><h3 style="font-size:16px">Anggota keluarga (${d.anggota.filter(a => a.aktif).length})</h3>${admin ? `<button class="btn btn-ghost btn-sm" onclick="formAnggota('${r.id}')">${ikon('plus', 'sm')} Tambah</button>` : ''}</div>
      ${d.anggota.filter(a => a.aktif).map(a => `<div class="list-item"><span class="avatar" style="background:var(--navy-50);color:var(--navy)">${esc(inisial(a.nama))}</span><div class="grow"><b>${esc(a.nama)}</b> <span class="badge ${a.hubungan === 'Kepala Keluarga' ? 'penting' : ''}">${esc(a.hubungan)}</span><div class="small muted">${a.jk ? (a.jk === 'L' ? 'Laki-laki' : 'Perempuan') : ''}${a.tglLahir ? ' · ' + esc(tgl(a.tglLahir, true)) : ''}${a.hp ? ' · <span class="mono">' + esc(a.hp) + '</span>' : ''}</div></div>${admin ? `<button class="btn btn-ghost btn-sm" onclick="formAnggota('${r.id}', _det.anggota[${d.anggota.indexOf(a)}])">${ikon('edit', 'sm')}</button>` : ''}</div>`).join('') || kosong('Belum ada data anggota.')}
      <div class="alert ${r.wa ? 'ok' : 'warn'} mt-2">${ikon('wa')}<div><b>WhatsApp penerima notifikasi</b><br><span class="mono">${esc(r.wa || 'Belum diisi')}</span>${r.wa ? ` <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/62${r.wa.replace(/^0/, '')}">Chat</a>` : ''}</div></div>
      <dl class="kv mt-2"><dt>Status hunian</dt><dd>${esc(LABEL_HUNIAN[r.statusRumah] || r.statusRumah)}</dd>${r.statusRumah === 'Dikontrak' ? `<dt>Pemilik rumah</dt><dd>${esc(r.pemilik || '— belum diisi —')}</dd>${r.waPemilik ? `<dt>WA pemilik</dt><dd class="mono">${esc(r.waPemilik)}</dd>` : ''}` : ''}</dl>
      ${!admin && d.keuangan ? `<dl class="kv mt-2"><dt>Tunggakan</dt><dd class="mono">${rp(d.keuangan.tunggakan)}</dd><dt>Saldo di muka</dt><dd class="mono">${rp(d.keuangan.saldoMuka)}</dd></dl>` : ''}
      ${r.keterangan ? `<div class="mt-2"><div class="lbl-f">Catatan pengurus</div><p class="small">${esc(r.keterangan)}</p></div>` : ''}
      ${d.riwayat.length ? `<details class="mt-2"><summary style="cursor:pointer;font-weight:600;color:var(--navy)">Riwayat penghuni (${d.riwayat.length})</summary>${d.riwayat.map(h => `<div class="list-item small"><div><b>${esc(h.kepala || '-')}</b> · ${esc(h.mulai || '?')} s.d. ${esc(h.selesai)}<div class="muted">${esc(h.anggota)}</div>${h.ket ? `<div>${esc(h.ket)}</div>` : ''}</div></div>`).join('')}</details>` : ''}
      ${admin ? `<div class="grid g-2 mt-2" style="gap:.5rem"><button class="btn btn-primary" onclick="formRumah(_det.rumah)">${ikon('edit')} Edit rumah</button><button class="btn btn-outline" onclick="gantiPenghuni('${r.id}')">${ikon('swap')} Penghuni pindah</button></div>` : ''}</div></div>`;
  } catch (e) { box.innerHTML = errorBox(e); }
}
function formRumah(r = {}) {
  const m = modal({ judul: r.id ? 'Edit Rumah' : 'Tambah Rumah', ikonJudul: 'home', isi: `<form id="rm-f">${formHTML([
    { n: 'Blok', l: 'Blok', v: r.blok, req: true, attr: r.id ? 'readonly' : '', ph: 'K24' }, { n: 'No_Rumah', l: 'Nomor rumah', v: r.no, req: true, attr: r.id ? 'readonly' : '', ph: '12 atau 12A' },
    { n: 'Status_Rumah', l: 'Status hunian', t: 'select', o: OPSI_HUNIAN, v: r.statusRumah }, { n: 'Status_Keluarga', l: 'Status data', t: 'select', o: ['Aktif', 'Nonaktif'], v: r.statusKeluarga },
    { n: 'Pemilik_Rumah', l: 'Nama pemilik rumah', v: r.pemilik, hint: 'Wajib diisi bila rumah dikontrak / disewa.' }, { n: 'WA_Pemilik', l: 'WA pemilik rumah', t: 'tel', v: r.waPemilik, ph: '08xxxxxxxxxx' },
    { n: 'Kepala_Keluarga', l: 'Kepala keluarga', v: r.kepala, hint: 'Otomatis mengikuti anggota berhubungan “Kepala Keluarga”.' }, { n: 'WA_Penerima', l: 'WA penerima notifikasi', t: 'tel', v: r.wa, ph: '08xxxxxxxxxx' },
    { n: 'Keterangan', l: 'Catatan pengurus', t: 'textarea', v: r.keterangan, full: true }
  ])}</form>`, kaki: `<button class="btn btn-primary" id="rm-ok">${ikon('check')} Simpan</button>` });
  const fr = $('#rm-f', m.el);
  const atur = () => { const k = $('[name=Status_Rumah]', fr).value === 'Dikontrak'; ['Pemilik_Rumah', 'WA_Pemilik'].forEach(n => { $('[name=' + n + ']', fr).closest('.field').style.opacity = k ? 1 : .55; }); };
  $('[name=Status_Rumah]', fr).onchange = atur; atur();
  $('#rm-ok', m.el).onclick = () => { const f = $('#rm-f', m.el); if (!validasiForm(f)) return; sibuk($('#rm-ok', m.el), async () => { try { const d = await bacaForm(f); if (d.Status_Rumah === 'Dikontrak' && !d.Pemilik_Rumah) throw new Error('Isi nama pemilik rumah untuk rumah kontrak.'); if (r.id) d.ID_Rumah = r.id; await api('simpanRumah', d); m.tutup(); toast('Data rumah disimpan.'); _rumahCache = null; router(); } catch (e) { gagal(e); } }); };
}
function formAnggota(idRumah, a = {}) {
  const fl = fieldsAnggota(a).concat(a.id ? [{ n: 'Aktif', l: 'Masih aktif tinggal di rumah ini', t: 'check', v: a.aktif }] : []);
  const m = modal({ judul: a.id ? 'Edit Anggota' : 'Tambah Anggota', ikonJudul: 'user', isi: `<form id="an-f">${formHTML(fl)}</form>`, kaki: `<button class="btn btn-primary" id="an-ok">${ikon('check')} Simpan</button>` });
  $('#an-ok', m.el).onclick = () => { const f = $('#an-f', m.el); if (!validasiForm(f)) return; sibuk($('#an-ok', m.el), async () => { try { const d = await bacaForm(f); d.ID_Rumah = idRumah; if (a.id) d.ID_Anggota = a.id; await api('simpanAnggota', d); m.tutup(); toast('Anggota disimpan.'); detailRumahPanel(idRumah); } catch (e) { gagal(e); } }); };
}
async function gantiPenghuni(id) {
  const ket = await mintaTeks('Penghuni Pindah', 'Keterangan (misal: pindah ke luar kota, rumah dijual). Penghuni lama diarsipkan; tagihan & pembayaran tetap tercatat pada rumah.', { ya: 'Arsipkan penghuni', bahaya: true });
  if (ket === null) return;
  try { const r = await api('gantiPenghuni', { ID_Rumah: id, keterangan: ket }); toast(r.pesan); if (r.passwordBaru) tampilKredensial('Password baru akun rumah', [{ Rumah: id, 'Password awal': r.passwordBaru }], 'Akun rumah direset untuk penghuni baru. Password hanya tampil <b>sekali</b>.'); _rumahCache = null; detailRumahPanel(id); } catch (e) { gagal(e); }
}

// ============================================================
// IMPOR EXCEL
// ============================================================
const ANGGOTA_KOLOM = ['Kepala Keluarga', 'Istri', 'Anak 1', 'Anak 2', 'Anak 3', 'Anak 4', 'Orang Tua'];
daftarHalaman('impor', {
  judul: 'Impor Data Warga', ikon: 'upload', menu: 'Impor Data Warga (Excel)',
  render: async el => {
    el.innerHTML = kepala('Impor Data Warga dari Excel', 'Unggah <b>Data_Warga_RT02.xlsx</b>. Impor dapat diulang tanpa menggandakan data karena memakai kunci Blok + No. Rumah.', `<button class="btn btn-outline" id="im-tpl">${ikon('download')} Unduh template</button>`) + `
    <div class="steps" id="im-steps"><span class="on">1. Unggah</span><span>2. Pratinjau & validasi</span><span>3. Konfirmasi</span><span>4. Selesai</span></div>
    <div class="card" id="im-box"><label class="file-drop" for="im-file" style="padding:36px">${ikon('upload', 'lg')}<div class="mt-1"><b>Pilih file Excel (.xlsx)</b></div><div class="small mt-1">Kolom yang dikenali: Blok, No Rumah, Status Rumah (Pemilik/Kontrak/Kosong, opsional), Nama &amp; WA Pemilik (bila kontrak), lalu Nama / Tanggal Lahir / Jenis Kelamin / No HP untuk ${ANGGOTA_KOLOM.join(', ')}.</div><input id="im-file" type="file" accept=".xlsx,.xls,.csv"></label></div>`;
    $('#im-tpl').onclick = unduhTemplateImpor;
    $('#im-file').onchange = async e => { const f = e.target.files[0]; if (f) prosesFileImpor(f); };
  }
});
async function unduhTemplateImpor() {
  const X = await muatXLSX();
  const h1 = ['No', 'Blok', 'No Rumah', 'Status Rumah', 'Nama Pemilik Rumah', 'WA Pemilik'], h2 = ['', '', '', '(Pemilik/Kontrak/Kosong)', '(bila kontrak)', '(bila kontrak)'];
  ANGGOTA_KOLOM.forEach(g => { h1.push(g, '', '', ''); h2.push('Nama', 'Tanggal Lahir', 'Jenis Kelamin', 'No HP'); });
  const ws = X.utils.aoa_to_sheet([h1, h2, [1, 'J6', '1', 'Pemilik', '', '', 'Contoh Nama', '1984-08-14', 'L', '081234567890'], [2, 'J6', '2', 'Kontrak', 'Ibu Pemilik', '081200000000', 'Penyewa', '', 'L', '']]);
  ws['!merges'] = ANGGOTA_KOLOM.map((g, i) => ({ s: { r: 0, c: 6 + i * 4 }, e: { r: 0, c: 9 + i * 4 } }));
  const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Data Warga'); X.writeFile(wb, 'Template_Data_Warga_RT02.xlsx');
}
function tglExcel(v) {
  if (v instanceof Date) { const d = new Date(v.getTime() - v.getTimezoneOffset() * 60000); return d.toISOString().substr(0, 10); }
  if (typeof v === 'number' && v > 1000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 864e5)); return d.toISOString().substr(0, 10); }
  const s = String(v || '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return s;
}
function hpValid(s) { let x = String(s || '').replace(/[^\d+]/g, ''); if (x.startsWith('+')) x = x.substr(1); if (x.startsWith('62')) x = '0' + x.substr(2); else if (x.startsWith('8')) x = '0' + x; return /^08\d{7,12}$/.test(x); }
/** Membaca lembar Excel dengan header 1 atau 2 baris (grup anggota + sub-kolom) */
function parseLembar(aoa) {
  const iHead = aoa.findIndex(r => r.some(c => /^blok$/i.test(String(c).trim())));
  if (iHead < 0) throw new Error('Kolom "Blok" tidak ditemukan pada file.');
  const h1 = aoa[iHead].map(c => String(c || '').trim());
  const next = aoa[iHead + 1] || [];
  const duaBaris = next.some(c => /nama|tanggal|lahir|kelamin|hp/i.test(String(c))) && !next.some(c => /^[A-Z]\d+$/i.test(String(c).trim()));
  let grup = '';
  const label = h1.map((c, j) => { if (c) grup = c; const sub = duaBaris ? String(next[j] || '').trim() : ''; return ((duaBaris && !c && sub ? grup : c) + ' ' + sub).trim().toLowerCase(); });
  const kolom = label.map(l => {
    if (/^blok/.test(l)) return { k: 'Blok' };
    if (/^(no\.?\s*rumah|nomor\s*rumah|no\s*rmh)/.test(l) || l === 'no. rumah') return { k: 'No_Rumah' };
    if (/status\s*rumah|status\s*hunian|kepemilikan/.test(l)) return { k: 'Status_Rumah' };
    if (/(wa|hp|telp).*pemilik|pemilik.*(wa|hp|telp)/.test(l)) return { k: 'WA_Pemilik' };
    if (/pemilik/.test(l)) return { k: 'Pemilik_Rumah' };
    let ang = null, hub = null;
    if (/kepala/.test(l)) { ang = 'KK'; hub = 'Kepala Keluarga'; } else if (/istri/.test(l)) { ang = 'IS'; hub = 'Istri'; } else if (/suami/.test(l)) { ang = 'SU'; hub = 'Suami'; }
    else if (/anak\s*(\d)/.test(l)) { ang = 'A' + l.match(/anak\s*(\d)/)[1]; hub = 'Anak'; } else if (/orang\s*tua|ortu/.test(l)) { ang = 'OT'; hub = 'Orang Tua'; }
    if (!ang) return null;
    const f = /nama/.test(l) ? 'Nama' : /tgl|tanggal|lahir/.test(l) ? 'Tgl_Lahir' : /kelamin|\bjk\b|l\/p/.test(l) ? 'Jenis_Kelamin' : /hp|telp|wa|ponsel|telepon/.test(l) ? 'No_HP' : (duaBaris ? null : 'Nama');
    return f ? { ang, hub, f } : null;
  });
  if (!kolom.some(k => k && k.k === 'No_Rumah')) { const j = label.findIndex(l => /^no\b/.test(l) && !/hp/.test(l) && label.indexOf(l) !== 0); if (j >= 0) kolom[j] = { k: 'No_Rumah' }; }
  if (!kolom.some(k => k && k.k === 'No_Rumah')) throw new Error('Kolom "No Rumah" tidak ditemukan.');
  const rows = [];
  let blokTerakhir = '';
  for (let i = iHead + (duaBaris ? 2 : 1); i < aoa.length; i++) {
    const r = aoa[i]; if (!r || r.every(c => c === '' || c === null || c === undefined)) continue;
    const o = { _baris: i + 1, anggota: {} };
    kolom.forEach((k, j) => {
      if (!k) return; const v = r[j];
      if (k.k) o[k.k] = String(v === undefined || v === null ? '' : v).trim();
      else { const a = o.anggota[k.ang] = o.anggota[k.ang] || { Hubungan: k.hub }; a[k.f] = k.f === 'Tgl_Lahir' ? tglExcel(v) : String(v === undefined || v === null ? '' : v).trim(); }
    });
    if (o.Blok) blokTerakhir = o.Blok.toUpperCase(); else o.Blok = blokTerakhir; // sel blok digabung
    if (/^blok$/i.test(o.Blok) || !o.No_Rumah) continue;
    o.anggota = Object.values(o.anggota).filter(a => a.Nama).map(a => {
      const jk = String(a.Jenis_Kelamin || '').toUpperCase();
      a.Jenis_Kelamin = /^L|LAKI/.test(jk) ? 'L' : /^P|PEREMPUAN|WANITA/.test(jk) ? 'P' : (a.Hubungan === 'Istri' ? 'P' : a.Hubungan === 'Suami' ? 'L' : '');
      return a;
    });
    rows.push(o);
  }
  return rows;
}
async function prosesFileImpor(file) {
  const box = $('#im-box');
  box.innerHTML = loader('Membaca file…');
  try {
    const X = await muatXLSX();
    const wb = X.read(await file.arrayBuffer(), { cellDates: true });
    const aoa = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: true });
    const rows = parseLembar(aoa);
    const kunci = {}, masalah = [];
    rows.forEach(r => {
      const k = (r.Blok + '/' + r.No_Rumah).toUpperCase();
      if (kunci[k]) masalah.push({ b: r._baris, t: 'err', m: `Rumah ${k} ganda (juga di baris ${kunci[k]}).` }); else kunci[k] = r._baris;
      r.anggota.forEach(a => {
        if (a.No_HP && !hpValid(a.No_HP)) masalah.push({ b: r._baris, t: 'warn', m: `No HP ${a.Nama} tidak valid: "${a.No_HP}" (akan dikosongkan).` });
        if (a.Tgl_Lahir && !/^\d{4}-\d{2}-\d{2}$/.test(a.Tgl_Lahir)) masalah.push({ b: r._baris, t: 'warn', m: `Tanggal lahir ${a.Nama} tidak dikenali: "${a.Tgl_Lahir}".` });
      });
    });
    const ganda = masalah.filter(x => x.t === 'err').length;
    const perBlok = {}; rows.forEach(r => perBlok[r.Blok] = (perBlok[r.Blok] || 0) + 1);
    $$('#im-steps span').forEach((s, i) => s.className = i === 0 ? 'done' : i === 1 ? 'on' : '');
    box.innerHTML = `<div class="grid g-4 mb-2">${kpiCard('home', 'Rumah terbaca', rows.length, Object.entries(perBlok).map(([b, n]) => b + ' (' + n + ')').join(', '))}${kpiCard('users', 'Anggota terbaca', rows.reduce((s, r) => s + r.anggota.length, 0), rows.filter(r => !r.anggota.length).length + ' rumah tanpa penghuni', 'g')}${kpiCard('alert', 'Peringatan', masalah.filter(x => x.t === 'warn').length, 'dibersihkan otomatis', 'y')}${kpiCard('xcircle', 'Rumah ganda', ganda, ganda ? 'perbaiki file dulu' : 'aman', ganda ? 'r' : 'g')}</div>
      ${masalah.length ? `<details class="mb-2" ${ganda ? 'open' : ''}><summary style="cursor:pointer;font-weight:600">Daftar masalah (${masalah.length})</summary><div style="max-height:200px;overflow:auto" class="mt-1">${masalah.map(x => `<div class="small ${x.t === 'err' ? 'err' : ''}">Baris ${x.b}: ${esc(x.m)}</div>`).join('')}</div></details>` : `<div class="alert ok mb-2">${ikon('check')}<div>Tidak ditemukan masalah format.</div></div>`}
      <div class="table-wrap" style="max-height:360px;overflow:auto"><table class="tbl"><thead><tr><th>Baris</th><th>Blok</th><th>No</th><th>Kepala keluarga</th><th>Anggota</th><th>No HP KK</th></tr></thead><tbody>
      ${rows.slice(0, 200).map(r => { const kk = r.anggota.find(a => a.Hubungan === 'Kepala Keluarga') || {}; return `<tr><td class="mono">${r._baris}</td><td>${esc(r.Blok)}</td><td>${esc(r.No_Rumah)}</td><td>${esc(kk.Nama || '—')}</td><td>${r.anggota.length}</td><td class="mono">${esc(kk.No_HP || '')}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="row mt-2" style="justify-content:flex-end"><button class="btn btn-outline" onclick="router()">${ikon('left')} Pilih file lain</button><button class="btn btn-primary" id="im-go" ${ganda || !rows.length ? 'disabled' : ''}>${ikon('check')} Konfirmasi impor ${rows.length} rumah</button></div>`;
    if ($('#im-go')) $('#im-go').onclick = () => jalankanImpor(rows);
  } catch (e) { box.innerHTML = errorBox(e, 'router()'); }
}
async function jalankanImpor(rows) {
  const box = $('#im-box');
  $$('#im-steps span').forEach((s, i) => s.className = i < 2 ? 'done' : i === 2 ? 'on' : '');
  const tot = { rumahBaru: 0, rumahDiperbarui: 0, anggotaBaru: 0, anggotaDiperbarui: 0, peringatan: [] };
  for (let i = 0; i < rows.length; i += 50) {
    box.innerHTML = `<div class="center" style="padding:24px"><h3>Mengimpor… ${Math.min(i + 50, rows.length)} / ${rows.length}</h3><div class="bar mt-2"><span style="width:${Math.round(i / rows.length * 100)}%"></span></div><p class="muted small mt-2">Jangan tutup halaman ini. Diproses per 50 baris.</p></div>`;
    try {
      const r = await api('imporRumah', { rows: rows.slice(i, i + 50) });
      ['rumahBaru', 'rumahDiperbarui', 'anggotaBaru', 'anggotaDiperbarui'].forEach(k => tot[k] += r[k]); tot.peringatan.push(...r.peringatan);
    } catch (e) { box.innerHTML = errorBox(e) + `<p class="small muted">Baris sebelum ${i + 1} sudah tersimpan. Impor ulang aman (tidak menggandakan).</p>`; return; }
  }
  _rumahCache = null;
  $$('#im-steps span').forEach(s => s.className = 'done');
  box.innerHTML = `<div class="alert ok mb-2">${ikon('check')}<div><b>Impor selesai.</b></div></div><div class="grid g-4">${kpiCard('home', 'Rumah baru', tot.rumahBaru, '')}${kpiCard('refresh', 'Rumah diperbarui', tot.rumahDiperbarui, '')}${kpiCard('users', 'Anggota baru', tot.anggotaBaru, '', 'g')}${kpiCard('edit', 'Anggota diperbarui', tot.anggotaDiperbarui, '')}</div>
    ${tot.peringatan.length ? `<details class="mt-2"><summary>Peringatan server (${tot.peringatan.length})</summary>${tot.peringatan.map(p => `<div class="small">${esc(p)}</div>`).join('')}</details>` : ''}
    <div class="row mt-3"><button class="btn btn-accent" onclick="buatAkunMassal()">${ikon('key')} Buat akun warga untuk rumah baru</button><a class="btn btn-outline" href="#/panel/data-warga">Lihat data warga</a></div>`;
}

// ============================================================
// MANAJEMEN AKUN
// ============================================================
const OPSI_PERAN = [['ketua', 'Ketua RT'], ['sekretaris', 'Sekretaris'], ['bend_umum', 'Bendahara Kas Umum'], ['bend_pembangunan', 'Bendahara Kas Pembangunan'], ['bend_jimpitan', 'Bendahara Kas Jimpitan'], ['bend_sosial', 'Bendahara Kas Sosial'], ['admin', 'Administrator']];
daftarHalaman('akun-kelola', {
  judul: 'Manajemen Akun', ikon: 'key', menu: 'Manajemen Akun', pendek: 'Akun',
  render: async el => {
    const rows = await api('listAkun');
    let tab = 'pengurus', q = '';
    const gambar = () => {
      const list = rows.filter(a => (tab === 'warga' ? a.peran === 'warga' : a.peran !== 'warga') && (!q || (a.username + a.nama + a.rumahLabel).toLowerCase().includes(q)));
      $('#ak-tbl').innerHTML = list.length ? `<div class="table-wrap"><table class="tbl responsive"><thead><tr><th>${tab === 'warga' ? 'Rumah' : 'Username'}</th><th>Nama</th><th>Peran</th><th>Status</th><th>Login terakhir</th><th></th></tr></thead><tbody>
        ${list.map(a => `<tr><td data-l="${tab === 'warga' ? 'Rumah' : 'Username'}" class="mono">${esc(tab === 'warga' ? a.rumahLabel : a.username)}</td><td data-l="Nama">${esc(a.nama || '-')}</td><td data-l="Peran">${esc(a.peranLabel)}</td><td data-l="Status">${badge(a.status, a.status === 'BARU' ? 'Belum ganti password' : a.status === 'AKTIF' ? 'Aktif' : 'Nonaktif')}${a.terkunci ? ' <span class="badge danger">Terkunci</span>' : ''}</td><td data-l="Login terakhir" class="small">${esc(a.loginTerakhir ? tglJam(a.loginTerakhir) : '—')}</td>
          <td data-l="" class="nowrap"><button class="btn btn-ghost btn-sm" onclick="resetPw('${a.id}','${esc(a.username)}')">${ikon('key', 'sm')} Reset</button>${a.id !== Sesi.user.id ? `<button class="btn btn-ghost btn-sm" onclick="statusAkun('${a.id}','${a.status === 'NONAKTIF' ? 'AKTIF' : 'NONAKTIF'}')">${a.status === 'NONAKTIF' ? 'Aktifkan' : 'Nonaktifkan'}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : kosong('Tidak ada akun.', 'key');
    };
    const tanpa = rows.filter(a => a.peran === 'warga').length;
    el.innerHTML = kepala('Manajemen Akun', 'Semua akun dibuat dan diaktifkan Administrator. Password awal tampil sekali dan wajib diganti saat login pertama.', `<button class="btn btn-outline" onclick="buatAkunMassal()">${ikon('home')} Buat akun warga</button><button class="btn btn-primary" id="ak-baru">${ikon('plus')} Akun pengurus</button>`) + `
    <div class="tabs mb-2"><button class="tab on" data-t="pengurus">Pengurus & admin <span class="n">${rows.length - tanpa}</span></button><button class="tab" data-t="warga">Warga <span class="n">${tanpa}</span></button></div>
    <div class="card flush"><div style="padding:16px 20px"><input class="input" id="ak-q" placeholder="Cari…"></div><div id="ak-tbl"></div></div>`;
    $$('[data-t]', el).forEach(b => b.onclick = () => { tab = b.dataset.t; $$('[data-t]', el).forEach(x => x.classList.toggle('on', x === b)); gambar(); });
    $('#ak-q').oninput = e => { q = e.target.value.toLowerCase(); gambar(); };
    $('#ak-baru').onclick = () => {
      const m = modal({ judul: 'Buat Akun Pengurus', ikonJudul: 'user', isi: `<form id="ab-f">${formHTML([{ n: 'nama', l: 'Nama lengkap', req: true }, { n: 'username', l: 'Username', req: true, hint: 'Huruf kecil, angka, titik. Contoh: bendahara.umum' }, { n: 'peran', l: 'Peran', t: 'select', o: OPSI_PERAN, full: true }])}</form><p class="small muted mt-2">Ingat juga mengisi nama pejabat di menu <a href="#/panel/identitas">Identitas & Pengurus</a> agar tampil di surat dan laporan.</p>`, kaki: `<button class="btn btn-primary" id="ab-ok">${ikon('check')} Buat akun</button>` });
      $('#ab-ok', m.el).onclick = () => { const f = $('#ab-f', m.el); if (!validasiForm(f)) return; sibuk($('#ab-ok', m.el), async () => { try { const d = await bacaForm(f); const r = await api('buatAkun', d); m.tutup(); tampilKredensial('Akun dibuat', [{ Username: r.username, 'Password awal': r.passwordAwal }]); router(); } catch (e) { gagal(e); } }); };
    };
    gambar();
  }
});
async function buatAkunMassal() {
  if (!await konfirmasi('Buat akun warga untuk setiap rumah yang belum memiliki akun? Password awal unik per rumah akan ditampilkan sekali.', { ya: 'Buat akun' })) return;
  try {
    const r = await api('buatAkunWargaMassal');
    if (!r.jumlah) return toast('Semua rumah sudah memiliki akun.', 'info');
    tampilKredensial(r.jumlah + ' akun warga dibuat', r.daftar.map(x => ({ Blok: x.blok, 'No Rumah': x.no, 'Kepala Keluarga': x.kepala || '', 'Password awal': x.passwordAwal })), `Login warga memakai <b>Blok + No. Rumah + password</b>. Unduh daftar ini sekarang (hanya tampil sekali) lalu bagikan secara pribadi ke setiap rumah.`);
    if (location.hash.includes('akun-kelola')) router();
  } catch (e) { gagal(e); }
}
async function resetPw(id, nama) {
  if (!await konfirmasi(`Reset password akun <b>${esc(nama)}</b>? Pengguna wajib mengganti password saat login berikutnya.`, { ya: 'Reset password', bahaya: true })) return;
  try { const r = await api('resetPassword', { id }); tampilKredensial('Password direset', [{ Akun: r.username, 'Password awal': r.passwordAwal }]); router(); } catch (e) { gagal(e); }
}
async function statusAkun(id, status) { try { const r = await api('ubahStatusAkun', { id, status }); toast(r.pesan); router(); } catch (e) { gagal(e); } }

// ============================================================
// PERUBAHAN DATA WARGA
// ============================================================
daftarHalaman('perubahan', {
  judul: 'Perubahan Data Warga', ikon: 'edit', menu: 'Perubahan Data Warga', cntMerah: true,
  render: async el => {
    const rows = await api('listPerubahan');
    const label = { tambah: 'Tambah anggota', ubah: 'Ubah data anggota', nonaktif: 'Nonaktifkan anggota', kontak: 'Ganti nomor WA', hunian: 'Ubah status hunian' };
    const nama = { Nama: 'Nama', Hubungan: 'Hubungan', Jenis_Kelamin: 'JK', Tgl_Lahir: 'Tgl lahir', No_HP: 'HP', No_WA: 'WA', WA_Penerima: 'WA penerima', alasan: 'Alasan', Status_Rumah: 'Status hunian', Pemilik_Rumah: 'Pemilik rumah', WA_Pemilik: 'WA pemilik' };
    el.innerHTML = kepala('Pengajuan Perubahan Data', 'Perubahan dari warga berlaku setelah Anda setujui.') +
      (rows.length ? rows.map(p => `<div class="card mb-2"><div class="row between top"><div class="grow"><div class="row gap-sm">${badge(p.status)}<b>${esc(label[p.jenis])}</b><span class="small muted">${esc(p.rumahLabel)} · ${esc(tglJam(p.tanggal))}</span></div>
        ${p.anggota ? `<div class="small mt-1">Anggota: <b>${esc(p.anggota)}</b></div>` : ''}<dl class="kv mt-1 small">${Object.entries(p.data).filter(([, v]) => v).map(([k, v]) => `<dt>${esc(nama[k] || k)}</dt><dd>${esc(k === 'Status_Rumah' ? (LABEL_HUNIAN[v] || v) : v)}</dd>`).join('')}</dl>${p.alasan ? `<div class="small err">Alasan tolak: ${esc(p.alasan)}</div>` : ''}</div>
        ${p.status === 'Diajukan' ? `<div class="row"><button class="btn btn-accent btn-sm" onclick="putusPerubahan('${p.id}',true)">${ikon('tick', 'sm')} Setujui</button><button class="btn btn-danger btn-sm" onclick="putusPerubahan('${p.id}',false)">Tolak</button></div>` : ''}</div></div>`).join('') : `<div class="card">${kosong('Tidak ada pengajuan.', 'edit')}</div>`);
  }
});
async function putusPerubahan(id, setuju) {
  let alasan = '';
  if (!setuju) { alasan = await mintaTeks('Tolak Pengajuan', 'Alasan penolakan', { ya: 'Tolak', bahaya: true }); if (!alasan) return; }
  try { const r = await api('putuskanPerubahan', { id, setuju, alasan }); toast(r.pesan); perbaruiHitung(); router(); } catch (e) { gagal(e); }
}

// ============================================================
// IDENTITAS & PENGURUS
// ============================================================
daftarHalaman('identitas', {
  judul: 'Identitas, Foto Latar & Pengurus', ikon: 'building', menu: 'Identitas, Foto Latar & Pengurus',
  render: async el => {
    const [set, pgr] = await Promise.all([api('getPengaturan'), api('listPengurus')]);
    const v = set.nilai;
    window._pgr = pgr;
    const img = id => id ? `https://drive.google.com/thumbnail?id=${id}&sz=w600` : '';
    el.innerHTML = kepala('Identitas, Foto Latar & Pengurus', 'Ganti logo dan foto latar (background) perumahan, teks identitas RT, serta nama pengurus yang otomatis terhubung ke surat dan laporan.') + `
    <div class="split half"><div class="card" id="kartu-latar"><div class="card-h"><h3>${ikon('image')} Logo & foto latar perumahan</h3></div>
      <div class="alert info mb-2">${ikon('info')}<div><b>Foto latar perumahan</b> (background) tampil di halaman login, beranda portal, dan banner dashboard. Gunakan foto mendatar (landscape) minimal 1600 px.</div></div>
      <div class="grid g-2"><div><div class="lbl-f mb-1">Logo RT02 (PNG transparan)</div><div class="photo" style="aspect-ratio:1;background:#fff;border:1px solid var(--border)">${v.LOGO_ID ? `<img src="${img(v.LOGO_ID)}" style="object-fit:contain" alt="Logo">` : `<div class="center muted small" style="padding-top:40%">Belum diunggah</div>`}</div><label class="btn btn-outline btn-block btn-sm mt-1">${ikon('upload', 'sm')} Ganti logo<input type="file" accept="image/png,image/*" hidden onchange="unggahId('logo',this)"></label></div>
        <div><div class="lbl-f mb-1">Foto latar perumahan</div><div class="photo" style="aspect-ratio:1">${bgGerbang().replace('class="bgimg"', 'class="bgimg" style="position:absolute;inset:0;background-size:cover;background-position:center"').replace('" style="background-image', ';background-image')}</div><label class="btn btn-primary btn-block btn-sm mt-1">${ikon('upload', 'sm')} Ganti foto latar<input type="file" accept="image/*" hidden onchange="unggahId('gerbang',this)"></label></div></div>
      <p class="small muted mt-2 mb-0">${v.GERBANG_ID ? 'Foto latar diambil dari unggahan terakhir.' : 'Belum ada unggahan: sementara memakai berkas <span class="mono">assets/gerbang.png</span> di GitHub (bila ada).'} Logo dipakai tanpa perubahan bentuk/warna pada kop surat dan antarmuka.</p></div>
      <div class="card"><div class="card-h"><h3>${ikon('info')} Identitas & teks</h3></div><form id="id-f" class="stack">${formHTML([
        { n: 'NAMA_RT', l: 'Nama RT', v: v.NAMA_RT }, { n: 'NAMA_RT_PANJANG', l: 'Nama pada kop surat', v: v.NAMA_RT_PANJANG }, { n: 'ALAMAT_RT', l: 'Alamat lengkap', t: 'textarea', v: v.ALAMAT_RT, full: true },
        { n: 'KOTA_SURAT', l: 'Kota pada penutup surat', v: v.KOTA_SURAT }, { n: 'SLOGAN', l: 'Slogan login', v: v.SLOGAN }, { n: 'LOGIN_JUDUL', l: 'Judul halaman login', v: v.LOGIN_JUDUL }, { n: 'WA_KONTAK_PUBLIK', l: 'WA pengurus (portal)', t: 'tel', v: v.WA_KONTAK_PUBLIK },
        { n: 'LOGIN_SAMBUTAN', l: 'Kalimat sambutan login', t: 'textarea', v: v.LOGIN_SAMBUTAN, full: true }, { n: 'BANNER_SAMBUTAN', l: 'Teks banner dashboard & beranda', t: 'textarea', v: v.BANNER_SAMBUTAN, full: true },
        { n: 'JAM_LAYANAN', l: 'Jam layanan', v: v.JAM_LAYANAN }, { n: 'ALAMAT_SEKRETARIAT', l: 'Alamat sekretariat', v: v.ALAMAT_SEKRETARIAT },
        { n: 'VISI', l: 'Visi', t: 'textarea', v: v.VISI, full: true }, { n: 'MISI', l: 'Misi (satu baris per poin)', t: 'textarea', v: v.MISI, full: true }
      ])}<button class="btn btn-primary" type="submit">${ikon('check')} Simpan identitas</button></form></div></div>
    <div class="card flush mt-3"><div class="card-h"><h3>${ikon('users')} Susunan pengurus</h3><button class="btn btn-outline btn-sm" onclick="formPengurus()">${ikon('plus', 'sm')} Jabatan</button></div><div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Jabatan</th><th>Nama</th><th>Masa jabatan</th><th>WA</th><th>Status</th><th></th></tr></thead><tbody>
      ${pgr.map((p, i) => `<tr><td data-l="Jabatan"><b>${esc(p.jabatan)}</b></td><td data-l="Nama">${p.nama ? esc(p.nama) : '<span class="badge proses">Belum diisi</span>'}</td><td data-l="Masa">${esc(p.mulai ? tgl(p.mulai, true) + ' – ' + tgl(p.selesai, true) : '-')}</td><td data-l="WA" class="mono">${esc(p.wa || '-')}</td><td data-l="Status">${badge(p.aktif ? 'Aktif' : 'NONAKTIF', p.aktif ? 'Aktif' : 'Nonaktif')}</td><td data-l=""><button class="btn btn-ghost btn-sm" onclick="formPengurus(_pgr[${i}])">${ikon('edit', 'sm')}</button></td></tr>`).join('')}</tbody></table></div></div>`;
    $('#id-f').onsubmit = async e => { e.preventDefault(); const d = await bacaForm(e.target); const items = Object.entries(d).filter(([k, x]) => x !== (v[k] || '')).map(([Kunci, Nilai]) => ({ Kunci, Nilai })); if (!items.length) return toast('Tidak ada perubahan.', 'info'); await sibuk($('button[type=submit]', e.target), async () => { try { const r = await api('simpanPengaturan', { items }); toast(r.pesan); Identitas.set({}); router(); } catch (ex) { gagal(ex); } }); };
  }
});
async function unggahId(jenis, input) {
  const f = input.files[0]; if (!f) return;
  const t = toastLoading('Mengunggah…');
  try { const file = await fileB64(f, jenis === 'logo' ? 800 : 1920); const r = await api('unggahIdentitas', { jenis, file }); Identitas.set(jenis === 'logo' ? { logoUrl: r.url.replace(/sz=w\d+/, 'sz=w400') } : { gerbangUrl: r.url.replace(/sz=w\d+/, 'sz=w1920') }); toast('Berhasil diunggah.'); _layout = null; router(); } catch (e) { gagal(e); } finally { t(); }
}
function formPengurus(p = {}) {
  const m = modal({ judul: p.id ? 'Ubah ' + p.jabatan : 'Tambah Jabatan', ikonJudul: 'users', isi: `<form id="pr-f">${formHTML([
    { n: 'Jabatan', l: 'Jabatan', v: p.jabatan, req: true, attr: /^(Ketua RT|Sekretaris|Bendahara Kas)/.test(p.jabatan || '') ? 'readonly' : '' }, { n: 'Nama', l: 'Nama pejabat', v: p.nama },
    { n: 'Masa_Mulai', l: 'Masa jabatan mulai', t: 'date', v: p.mulai }, { n: 'Masa_Selesai', l: 'Masa jabatan selesai', t: 'date', v: p.selesai },
    { n: 'No_WA', l: 'No. WA', t: 'tel', v: p.wa }, { n: 'Urutan', l: 'Urutan tampil', t: 'number', v: p.urutan || 99 }, { n: 'Aktif', l: 'Aktif', t: 'check', v: p.id ? p.aktif : true }
  ])}</form>`, kaki: `<button class="btn btn-primary" id="pr-ok">${ikon('check')} Simpan</button>` });
  $('#pr-ok', m.el).onclick = () => { const f = $('#pr-f', m.el); if (!validasiForm(f)) return; sibuk($('#pr-ok', m.el), async () => { try { const d = await bacaForm(f); if (p.id) d.ID_Pengurus = p.id; await api('simpanPengurus', d); m.tutup(); toast('Pengurus disimpan.'); router(); } catch (e) { gagal(e); } }); };
}

// ============================================================
// NOMINAL & PENGATURAN
// ============================================================
const GRUP_SETELAN = [
  ['Iuran & kas', 'coins', [['IPL_NOMINAL', 'Nominal IPL standar / bulan (Rp)', 'number', true], ['IPL_JATUH_TEMPO_HARI', 'Tanggal jatuh tempo IPL', 'number'], ['JIMPITAN_MINGGUAN', 'Jimpitan mingguan satu RT (Rp)', 'number', true], ['ALOKASI_PEMBANGUNAN', 'Alokasi Kas Umum → Pembangunan per periode (Rp)', 'number', true], ['ALOKASI_SOSIAL', 'Alokasi Kas Umum → Sosial per periode (Rp)', 'number', true], ['REKENING_RT', 'Rekening tujuan transfer', 'text']]],
  ['Surat', 'file', [['FORMAT_NOMOR_SURAT', 'Format nomor surat', 'text']]],
  ['Pengingat & WhatsApp', 'wa', [['PENGINGAT_AKTIF', 'Pengingat tunggakan otomatis', 'yt'], ['PENGINGAT_TANGGAL', 'Tanggal kirim tiap bulan (pisahkan koma)', 'text'], ['PENGINGAT_JAM', 'Jam kirim (WIB, 0–23)', 'number'], ['WA_BATCH', 'Pesan per menit', 'batch'], ['WA_JEDA_MIN', 'Jeda minimum (detik)', 'number'], ['WA_JEDA_MAKS', 'Jeda maksimum (detik)', 'number'], ['WA_LIMIT_HARI', 'Batas pesan per hari', 'number'], ['PORTAL_URL', 'URL portal (tautan di pesan WA)', 'text']]],
  ['Portal', 'home', [['TAMPILKAN_SALDO_PUBLIK', 'Tampilkan ringkasan saldo 4 kas di beranda publik', 'yt']]]
];
daftarHalaman('pengaturan', {
  judul: 'Nominal & Pengaturan', ikon: 'sliders', menu: 'Nominal & Pengaturan',
  render: async el => {
    const set = await api('getPengaturan');
    const v = set.nilai, rw = set.riwayat || {};
    el.innerHTML = kepala('Nominal & Pengaturan', 'Semua nilai dapat diubah tanpa mengubah kode. Setiap perubahan memiliki tanggal mulai berlaku dan tercatat di log. Tagihan lama tidak berubah otomatis.') + `<form id="st-f">` +
      GRUP_SETELAN.map(([g, ik, items]) => `<div class="card mb-2"><div class="card-h"><h3>${ikon(ik)} ${esc(g)}</h3></div><div class="form-grid two">${items.map(([k, l, t, berlaku]) => {
        const ri = (rw[k] || []).filter(x => x.mulai > hariIni());
        const inp = t === 'yt' ? `<select name="${k}" class="input"><option value="TIDAK" ${v[k] !== 'YA' ? 'selected' : ''}>Tidak</option><option value="YA" ${v[k] === 'YA' ? 'selected' : ''}>Ya</option></select>`
          : t === 'batch' ? `<select name="${k}" class="input">${[10, 20, 50].map(n => `<option ${String(n) === v[k] ? 'selected' : ''}>${n}</option>`).join('')}</select>`
            : `<input name="${k}" type="${t}" class="input" value="${esc(v[k] || '')}" ${t === 'number' ? 'min="0" inputmode="numeric"' : ''}>`;
        return `<div class="field"><label>${esc(l)}</label>${inp}${berlaku ? `<div class="row gap-sm"><span class="hint">Berlaku mulai</span><input type="date" class="input" name="__mulai_${k}" value="${hariIni()}" style="min-height:40px;width:auto"></div>` : ''}
          ${t === 'number' && berlaku ? `<div class="hint">Saat ini: ${rp(v[k])}${ri.length ? ' · Terjadwal: ' + ri.map(x => rp(x.nilai) + ' mulai ' + tgl(x.mulai, true)).join(', ') : ''}</div>` : ''}${k === 'FORMAT_NOMOR_SURAT' ? `<div class="hint">Variabel: {nomor} {bulan} {tahun}. Contoh: ${esc(String(v[k] || '').replace('{nomor}', '001').replace('{bulan}', 'XI').replace('{tahun}', '2026'))}</div>` : ''}</div>`;
      }).join('')}</div></div>`).join('') + `<div class="row" style="justify-content:flex-end;position:sticky;bottom:80px"><button class="btn btn-primary" type="submit">${ikon('check')} Simpan perubahan</button></div></form>`;
    $('#st-f').onsubmit = async e => {
      e.preventDefault();
      const d = await bacaForm(e.target);
      const items = Object.keys(d).filter(k => !k.startsWith('__') && d[k] !== (v[k] || '')).map(k => ({ Kunci: k, Nilai: d[k], Berlaku_Mulai: d['__mulai_' + k] || hariIni() }));
      if (!items.length) return toast('Tidak ada perubahan.', 'info');
      if (!await konfirmasi('Simpan ' + items.length + ' perubahan pengaturan?<br><span class="small muted">' + items.map(i => esc(i.Kunci) + ' → ' + esc(i.Nilai) + ' (mulai ' + esc(tgl(i.Berlaku_Mulai, true)) + ')').join('<br>') + '</span>')) return;
      await sibuk($('button[type=submit]', e.target), async () => { try { const r = await api('simpanPengaturan', { items }); toast(r.pesan); router(); } catch (ex) { gagal(ex); } });
    };
  }
});

// ============================================================
// IURAN KHUSUS
// ============================================================
daftarHalaman('iuran-khusus', {
  judul: 'Iuran Khusus', ikon: 'coins', menu: 'Iuran Khusus',
  render: async el => {
    const [rows, rumah] = await Promise.all([api('listIuranKhusus'), daftarRumah()]);
    window._iur = rows; window._rmhAll = rumah;
    el.innerHTML = kepala('Iuran Khusus', 'Iuran di luar IPL (THR, Agustusan, Pembangunan, dll.). Tagihan diterbitkan oleh bendahara kas tujuan. Iuran khusus tidak mengikuti keringanan IPL.', `<button class="btn btn-primary" onclick="formIuran()">${ikon('plus')} Iuran baru</button>`) + `
    <div class="card flush"><div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Nama</th><th class="right">Nominal</th><th>Kas tujuan</th><th>Sasaran</th><th>Jatuh tempo</th><th>Terkumpul</th><th>Status</th><th></th></tr></thead><tbody>
    ${rows.map((i, n) => `<tr><td data-l="Nama"><b>${esc(i.nama)}</b></td><td data-l="Nominal" class="money">${rp(i.nominal)}</td><td data-l="Kas">${esc(i.kasLabel)}</td><td data-l="Sasaran">${i.sasaran === 'SEMUA' ? 'Semua rumah aktif' : i.sasaran.split(',').length + ' rumah'}</td><td data-l="Jatuh tempo">${esc(tgl(i.jatuhTempo, true))}</td><td data-l="Terkumpul"><span class="mono small">${rp(i.terkumpul)} / ${rp(i.target)}</span><div class="bar g mt-1"><span style="width:${i.target ? Math.min(100, i.terkumpul / i.target * 100) : 0}%"></span></div></td><td data-l="Status">${badge(i.status)}</td><td data-l=""><button class="btn btn-ghost btn-sm" onclick="formIuran(_iur[${n}])">${ikon('edit', 'sm')}</button></td></tr>`).join('') || `<tr><td colspan="8">${kosong('Belum ada iuran khusus.', 'coins')}</td></tr>`}</tbody></table></div></div>`;
  }
});
function formIuran(i = {}) {
  const sas = i.sasaran && i.sasaran !== 'SEMUA' ? i.sasaran.split(',') : [];
  const m = modal({ judul: i.id ? 'Ubah Iuran Khusus' : 'Iuran Khusus Baru', ikonJudul: 'coins', besar: true, isi: `<form id="iu-f">${formHTML([
    { n: 'Nama', l: 'Nama iuran', v: i.nama, req: true, ph: 'THR Petugas, Agustusan, Paving Gang 3' }, { n: 'Nominal', l: 'Nominal per rumah (Rp)', t: 'number', v: i.nominal, req: true, attr: i.terbit ? 'readonly' : '' },
    { n: 'Kas_Tujuan', l: 'Kas tujuan', t: 'select', o: [['umum', 'Kas Umum'], ['pembangunan', 'Kas Pembangunan'], ['sosial', 'Kas Sosial'], ['jimpitan', 'Kas Jimpitan']], v: i.kas, attr: i.terbit ? 'disabled' : '' },
    { n: 'Jatuh_Tempo', l: 'Jatuh tempo', t: 'date', v: i.jatuhTempo }, { n: 'Status', l: 'Status', t: 'select', o: ['Aktif', 'Selesai', 'Nonaktif'], v: i.status }
  ])}
    <div class="field mt-2"><label>Sasaran</label><div class="seg"><button type="button" data-s="SEMUA" class="${!sas.length ? 'on' : ''}">Semua rumah aktif</button><button type="button" data-s="PILIH" class="${sas.length ? 'on' : ''}">Rumah tertentu</button></div>
    <div id="iu-pilih" class="${sas.length ? '' : 'hidden'} mt-1" style="max-height:220px;overflow:auto;border:1px solid var(--border);border-radius:8px;padding:8px">${window._rmhAll.map(r => `<label class="check" style="padding:4px"><input type="checkbox" class="iu-r" value="${r.id}" ${sas.includes(r.id) ? 'checked' : ''}> Blok ${esc(r.blok)} No. ${esc(r.no)} ${r.kepala ? '— ' + esc(r.kepala) : ''}</label>`).join('')}</div></div></form>`,
    kaki: `<button class="btn btn-primary" id="iu-ok">${ikon('check')} Simpan</button>` });
  let mode = sas.length ? 'PILIH' : 'SEMUA';
  $$('[data-s]', m.el).forEach(b => b.onclick = () => { mode = b.dataset.s; $$('[data-s]', m.el).forEach(x => x.classList.toggle('on', x === b)); $('#iu-pilih', m.el).classList.toggle('hidden', mode === 'SEMUA'); });
  $('#iu-ok', m.el).onclick = () => { const f = $('#iu-f', m.el); if (!validasiForm(f)) return; sibuk($('#iu-ok', m.el), async () => { try { const d = await bacaForm(f); if (i.id) { d.ID_Iuran = i.id; if (i.terbit) d.Kas_Tujuan = i.kas; } d.Nominal = Number(d.Nominal); d.Sasaran = mode === 'SEMUA' ? 'SEMUA' : $$('.iu-r:checked', m.el).map(c => c.value); if (mode === 'PILIH' && !d.Sasaran.length) throw new Error('Pilih minimal satu rumah.'); await api('simpanIuranKhusus', d); m.tutup(); toast('Iuran khusus disimpan.'); router(); } catch (e) { gagal(e); } }); };
}

// ============================================================
// JENIS SURAT & TEMPLATE
// ============================================================
daftarHalaman('jenis-surat', {
  judul: 'Jenis Surat & Template', ikon: 'file', menu: 'Jenis Surat & Template',
  render: async el => {
    const rows = await api('listJenisSurat');
    window._js = rows;
    el.innerHTML = kepala('Jenis Surat & Template', 'Setiap jenis surat memakai template Google Docs sendiri (kop: logo tengah, nama RT, alamat, garis ganda). Sunting template langsung di Google Docs.', `<button class="btn btn-primary" onclick="formJenis()">${ikon('plus')} Jenis surat</button>`) + `
    <div class="alert info mb-2">${ikon('info')}<div>Placeholder yang diisi otomatis: <span class="mono small">{{NOMOR_SURAT}} {{NAMA_PEMOHON}} {{JENIS_KELAMIN}} {{TGL_LAHIR}} {{HUBUNGAN}} {{ALAMAT_PEMOHON}} {{KEPERLUAN}} {{KOTA}} {{TANGGAL_SURAT}} {{NAMA_KETUA}} {{NAMA_RT}} {{KOP_NAMA}} {{ALAMAT_RT}} {{LOGO}}</span></div></div>
    <div class="card flush"><div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Jenis surat</th><th>Format nomor</th><th>Template</th><th>Status</th><th></th></tr></thead><tbody>
    ${rows.map((j, i) => `<tr><td data-l="Jenis"><b>${esc(j.nama)}</b></td><td data-l="Format" class="mono small">${esc(j.formatNomor || '(ikut pengaturan umum)')}</td><td data-l="Template">${j.templateUrl ? `<a class="btn btn-outline btn-sm" href="${esc(j.templateUrl)}" target="_blank" rel="noopener">${ikon('external', 'sm')} Buka di Google Docs</a>` : '<span class="badge danger">Belum ada</span>'}</td><td data-l="Status">${badge(j.aktif ? 'Aktif' : 'NONAKTIF', j.aktif ? 'Aktif' : 'Nonaktif')}</td><td data-l=""><button class="btn btn-ghost btn-sm" onclick="formJenis(_js[${i}])">${ikon('edit', 'sm')}</button></td></tr>`).join('')}</tbody></table></div></div>`;
  }
});
function formJenis(j = {}) {
  const m = modal({ judul: j.id ? 'Ubah Jenis Surat' : 'Jenis Surat Baru', ikonJudul: 'file', isi: `<form id="js-f">${formHTML([
    { n: 'Nama', l: 'Nama jenis surat', v: j.nama, req: true, full: true }, { n: 'Format_Nomor', l: 'Format nomor khusus (opsional)', v: j.formatNomor, ph: '{nomor}/RT02-RW29/{bulan}/{tahun}' },
    { n: 'Template_Doc_ID', l: 'ID / tautan template Google Docs', v: j.template, hint: j.id ? 'Biarkan untuk tetap memakai template sekarang.' : 'Kosongkan untuk dibuatkan template baru otomatis.' }, { n: 'Aktif', l: 'Aktif (dapat dipilih warga)', t: 'check', v: j.id ? j.aktif : true }
  ])}</form>`, kaki: `<button class="btn btn-primary" id="js-ok">${ikon('check')} Simpan</button>` });
  $('#js-ok', m.el).onclick = () => { const f = $('#js-f', m.el); if (!validasiForm(f)) return; sibuk($('#js-ok', m.el), async () => { try { const d = await bacaForm(f); if (j.id) d.ID_Jenis = j.id; await api('simpanJenisSurat', d); m.tutup(); toast('Jenis surat disimpan.'); router(); } catch (e) { gagal(e); } }); };
}

// ============================================================
// TEMPLATE WA
// ============================================================
daftarHalaman('template-wa', {
  judul: 'Template & Jadwal WA', ikon: 'message', menu: 'Template & Jadwal WA',
  render: async (el, param) => {
    const [rows, set] = await Promise.all([api('listTemplateWA'), api('getPengaturan')]);
    let aktif = rows.find(r => r.kode === param) || rows[0];
    const contoh = { nama_warga: 'Budi Santoso', blok_rumah: 'Blok K24 No. 12', nama_tagihan: 'IPL November 2026', periode_tagihan: 'November 2026', nominal_tagihan: 'Rp70.000', jatuh_tempo: '10 November 2026', rekening_rt: set.nilai.REKENING_RT || 'BCA 0000000000 a.n. Kas RT 02', tautan_portal: set.nilai.PORTAL_URL || location.origin + location.pathname, total_tunggakan: 'Rp140.000', rincian: '• IPL Oktober 2026: Rp70.000\n• IPL November 2026: Rp70.000', nominal_bayar: 'Rp140.000', saldo_muka: 'Rp0', kode_bayar: 'BYR-20261114-AB12C', alasan: 'Nominal pada bukti tidak terbaca', jenis_surat: 'Surat Pengantar SKCK', status_surat: 'Selesai Diterbitkan', keterangan: 'Surat dapat diunduh di portal', nomor_surat: '001/RT02-RW29/XI/2026', judul: 'Kerja Bakti Serentak', ringkasan: 'Seluruh warga diimbau hadir Minggu pukul 07.00 WIB.', nama_agenda: 'Posyandu Balita', tanggal: '20 November 2026', waktu: '09.00 WIB', lokasi: 'Balai Warga' };
    const render = s => esc(s).replace(/\{\{(\w+)\}\}/g, (m0, k) => `<b style="background:#FFF7CC">${esc(contoh[k] || '-')}</b>`).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/_([^_\n]+)_/g, '<i>$1</i>');
    const gambar = () => {
      el.innerHTML = kepala('Template & Penjadwalan Pesan WhatsApp', 'Template pesan otomatis per kejadian. Format WhatsApp: *tebal*, _miring_.', `<span class="badge ${set.nilai.PENGINGAT_AKTIF === 'YA' ? 'lunas' : ''}">${ikon('clock', 'sm')} Pengingat otomatis: ${set.nilai.PENGINGAT_AKTIF === 'YA' ? 'aktif' : 'nonaktif'}</span>`) + `
      <div class="split"><div class="card"><div class="card-h"><h3>${ikon('edit')} ${esc(aktif.nama)}</h3><span class="mono badge info">${esc(aktif.kode)}</span></div>
        <div class="lbl-f mb-1">Variabel (klik untuk menyisipkan)</div><div class="chips mb-2">${aktif.variabel.map(v => `<span class="chip" data-v="${v}">{{${v}}}</span>`).join('')}</div>
        <textarea class="input mono" id="tw-isi" rows="14" style="font-size:14px;min-height:300px">${esc(aktif.isi)}</textarea><div class="row between mt-1 small muted"><span id="tw-n"></span><label class="check"><input type="checkbox" id="tw-aktif" ${aktif.aktif ? 'checked' : ''}> Template aktif</label></div>
        <div class="row mt-2"><button class="btn btn-primary" id="tw-simpan">${ikon('check')} Simpan</button></div>
        <h4 class="mt-3 mb-1">Pratinjau</h4><div class="wa-head">${ikon('wa')}<b>${esc(Identitas.data.namaRT || 'RT02')}</b></div><div class="wa-preview" style="border-radius:0 0 12px 12px"><div class="wa-bubble" id="tw-prev"></div></div></div>
      <div class="stack"><div class="card"><div class="card-h"><h3>Katalog template</h3><span class="badge">${rows.filter(r => r.aktif).length}/${rows.length} aktif</span></div>${rows.map(r => `<a class="list-item" href="#/panel/template-wa/${r.kode}" style="text-decoration:none;color:inherit;${r.kode === aktif.kode ? 'background:var(--navy-50);margin:0 -12px;padding-left:12px;padding-right:12px;border-radius:8px' : ''}"><div class="grow"><div class="ttl">${esc(r.nama)}</div><div class="mono xs muted">${esc(r.kode)}</div></div>${badge(r.aktif ? 'Aktif' : 'NONAKTIF', r.aktif ? 'Aktif' : 'Nonaktif')}</a>`).join('')}</div>
        <div class="card"><div class="card-h"><h3>${ikon('clock')} Jadwal pengingat</h3></div><dl class="kv"><dt>Status</dt><dd>${set.nilai.PENGINGAT_AKTIF === 'YA' ? 'Aktif' : 'Nonaktif'}</dd><dt>Tanggal</dt><dd>${esc(set.nilai.PENGINGAT_TANGGAL)} tiap bulan</dd><dt>Jam</dt><dd>${esc(set.nilai.PENGINGAT_JAM)}.00 WIB</dd><dt>Sasaran</dt><dd>Rumah dengan sisa tagihan lewat jatuh tempo</dd></dl>
          <p class="small muted mt-1">Sebelum mengaktifkan, cek daftar penerima di menu <a href="#/panel/siaran">Kirim / Siaran WA</a>.</p><a class="btn btn-outline btn-block" href="#/panel/pengaturan">${ikon('sliders')} Ubah jadwal</a></div></div></div>`;
      const ta = $('#tw-isi');
      const up = () => { $('#tw-prev').innerHTML = render(ta.value); $('#tw-n').textContent = ta.value.length + ' / 1500 karakter'; };
      ta.oninput = up; up();
      $$('[data-v]', el).forEach(c => c.onclick = () => { const s = ta.selectionStart; ta.value = ta.value.slice(0, s) + '{{' + c.dataset.v + '}}' + ta.value.slice(ta.selectionEnd); ta.focus(); up(); });
      $('#tw-simpan').onclick = () => sibuk($('#tw-simpan'), async () => { try { const r = await api('simpanTemplateWA', { Kode: aktif.kode, Isi: ta.value, Aktif: $('#tw-aktif').checked }); toast(r.pesan); aktif.isi = ta.value; aktif.aktif = $('#tw-aktif').checked; } catch (e) { gagal(e); } });
    };
    gambar();
  }
});

// ============================================================
// SIARAN / KIRIM MASSAL (wajib pratinjau + konfirmasi)
// ============================================================
daftarHalaman('siaran', {
  judul: 'Kirim Notifikasi WA', ikon: 'send', menu: 'Kirim Pengingat / Siaran WA',
  render: async el => {
    const admin = Sesi.user.peran === 'admin';
    const [png, agd] = admin ? await Promise.all([api('listPengumuman'), api('listAgenda')]) : [[], []];
    const penting = png.filter(p => p.prioritas === 'Penting' && p.status === 'Terbit');
    el.innerHTML = kepala('Kirim Notifikasi WhatsApp', 'Pengiriman massal wajib melalui pratinjau dan konfirmasi. Pesan hanya dikirim ke nomor WA rumah (tidak ke grup); pengiriman ganda dicegah.') + `
    <div class="card"><form id="sr-f" class="stack">
      ${field({ n: 'kode', l: 'Jenis notifikasi', t: 'select', o: [['PENGINGAT_TUNGGAKAN', 'Pengingat tunggakan' + (admin ? '' : ' — ' + LABEL_KAS[Sesi.user.kas])]].concat(admin ? [['PENGUMUMAN_PENTING', 'Pengumuman penting'], ['AGENDA_BARU', 'Agenda kegiatan']] : []) })}
      <div id="sr-ref"></div>
      <label class="check" id="sr-jt"><input type="checkbox" name="termasukBelumJatuhTempo"> <span>Sertakan tagihan yang belum jatuh tempo</span></label>
      <button class="btn btn-primary" type="submit">${ikon('eye')} Pratinjau penerima</button></form></div><div id="sr-prev" class="mt-3"></div>`;
    const kodeSel = $('[name=kode]', el);
    const isiRef = () => {
      const k = kodeSel.value;
      $('#sr-jt').classList.toggle('hidden', k !== 'PENGINGAT_TUNGGAKAN');
      $('#sr-ref').innerHTML = k === 'PENGUMUMAN_PENTING' ? field({ n: 'ref', l: 'Pengumuman (prioritas Penting, sudah terbit)', t: 'select', o: [['', penting.length ? 'Pilih…' : 'Belum ada pengumuman penting']].concat(penting.map(p => [p.id, p.judul])), req: true })
        : k === 'AGENDA_BARU' ? field({ n: 'ref', l: 'Agenda', t: 'select', o: [['', 'Pilih…']].concat(agd.filter(a => a.tanggal >= hariIni()).map(a => [a.id, tgl(a.tanggal, true) + ' — ' + a.nama])), req: true }) : '';
    };
    kodeSel.onchange = isiRef; isiRef();
    $('#sr-f').onsubmit = async e => {
      e.preventDefault(); if (!validasiForm(e.target)) return;
      const d = await bacaForm(e.target);
      const box = $('#sr-prev'); box.innerHTML = loader('Menyiapkan pratinjau…');
      try {
        const p = await api('pratinjauNotif', d);
        box.innerHTML = `<div class="card"><div class="card-h"><h3>${ikon('eye')} Pratinjau: ${esc(p.judul)}</h3></div>
          <div class="grid g-3 mb-2">${kpiCard('users', 'Penerima', p.jumlah, 'nomor WA valid')}${kpiCard('check', 'Sudah dikirimi', p.sudahDikirim, 'dilewati (cegah ganda)', 'g')}${kpiCard('alert', 'Tanpa nomor valid', p.tanpaWA, 'tidak dikirim', p.tanpaWA ? 'y' : '')}</div>
          ${p.contoh ? `<div class="wa-preview mb-2"><div class="wa-bubble">${esc(p.contoh)}</div></div>` : ''}
          <details><summary style="cursor:pointer">Daftar penerima (${p.daftar.length})</summary><div class="table-wrap mt-1" style="max-height:240px;overflow:auto"><table class="tbl"><tbody>${p.daftar.map(x => `<tr><td>${esc(x.label)}</td><td>${esc(x.nama || '-')}</td><td class="mono">${esc(x.wa || '—')}</td><td>${x.valid ? '' : '<span class="badge danger">Tidak valid</span>'}</td></tr>`).join('')}</tbody></table></div></details>
          <div class="alert info mt-2">${ikon('shield')}<div>Dikirim bertahap ${p.batch} pesan/menit dengan jeda acak ${esc(p.jeda)} untuk mencegah pemblokiran nomor.</div></div>
          ${p.jumlah ? `<button class="btn btn-accent btn-block mt-2" id="sr-kirim">${ikon('send')} Konfirmasi & kirim sekarang (${p.jumlah} pesan)</button>` : ''}</div>`;
        if ($('#sr-kirim')) $('#sr-kirim').onclick = () => sibuk($('#sr-kirim'), async () => { try { const r = await api('kirimNotif', Object.assign({}, d, { konfirmasi: true, jumlahDikonfirmasi: p.jumlah })); toast(r.pesan); box.innerHTML = `<div class="alert ok">${ikon('check')}<div>${esc(r.pesan)} Pantau di <a href="#/panel/${admin ? 'fonnte' : 'riwayat-wa'}">riwayat pengiriman</a>.</div></div>`; } catch (ex) { gagal(ex); } });
      } catch (ex) { box.innerHTML = errorBox(ex); }
    };
  }
});

// ============================================================
// INTEGRASI FONNTE
// ============================================================
daftarHalaman('fonnte', {
  judul: 'Integrasi Fonnte', ikon: 'zap', menu: 'Integrasi Fonnte', cntMerah: true,
  render: async el => {
    let st = '';
    const [s, r, kontak] = await Promise.all([api('statusFonnte', { cekPerangkat: true }), api('riwayatNotif', { batas: 150 }), api('listKontak')]);
    const pr = s.perangkat;
    const muatRiwayat = async () => { const rr = await api('riwayatNotif', { status: st, batas: 150 }); $('#fn-riw').innerHTML = tabelWA(rr.data, n => n.status === 'gagal' ? `<button class="btn btn-ghost btn-sm" onclick="kirimUlang('${n.id}', true)">${ikon('refresh', 'sm')}</button>` : ''); };
    el.innerHTML = kepala('Integrasi WhatsApp Gateway (Fonnte)', 'Status gateway, antrean pesan, dan uji kirim. Token tersimpan aman di Script Properties dan hanya tampil tersamar.', `<button class="btn btn-outline" onclick="router()">${ikon('refresh')} Cek status</button><button class="btn btn-primary" id="fn-uji">${ikon('send')} Uji kirim</button>`) + `
    <div class="grid g-4">${kpiCard('zap', 'Status perangkat', pr ? esc(pr.status) : (s.adaToken ? '—' : 'Belum ada token'), pr && pr.nomor ? 'Nomor ' + esc(pr.nomor) : (pr && pr.pesan ? esc(pr.pesan) : ''), s.adaToken ? 'g' : 'r')}
      ${kpiCard('chart', 'Kuota Fonnte', pr && pr.kuota !== '' ? esc(pr.kuota) : '—', pr && pr.berakhir ? 'Aktif s.d. ' + esc(pr.berakhir) : '')}
      ${kpiCard('message', 'Antrean', s.antrean + (s.tertunda ? ` <small>+${s.tertunda} tertunda</small>` : ''), 'Trigger antrean: ' + (s.triggerAntrean ? 'berjalan' : 'berhenti (antrean kosong)'), 'y')}
      ${kpiCard('send', 'Terkirim hari ini', `${s.terkirimHariIni}<small>/ ${s.limitHari}</small>`, `${s.batch} pesan/menit · jeda ${esc(s.jeda)} dtk`)}</div>
    <div class="card mt-3"><div class="card-h"><h3>${ikon('key')} Token API Fonnte</h3><span class="badge info mono">Script Properties</span></div>
      <div class="row"><input class="input grow mono" readonly value="${esc(s.tokenTersamar || 'Belum diatur')}"><button class="btn btn-outline" id="fn-token">${ikon('edit')} Ubah token</button></div>
      <p class="small muted mt-1 mb-0">Dapatkan token di dashboard Fonnte → Device → Token. Token tidak pernah dikirim ke tampilan dalam bentuk utuh.</p>
      <div class="row mt-2"><button class="btn btn-ghost btn-sm" id="fn-trig">${ikon('refresh', 'sm')} Pasang ulang trigger</button><span class="small muted">Trigger pengingat harian: ${s.triggerPengingat ? 'terpasang' : 'tidak ada'}${s.terakhirDiproses ? ' · terakhir memproses ' + esc(tglJam(s.terakhirDiproses)) : ''}</span></div></div>
    <div class="card flush mt-3"><div class="card-h"><h3>${ikon('history')} Riwayat pengiriman</h3><div class="row">${s.gagal ? `<button class="btn btn-primary btn-sm" onclick="kirimUlang('', false)">${ikon('refresh', 'sm')} Kirim ulang semua gagal (${s.gagal})</button>` : ''}</div></div>
      <div class="tabs" style="padding:0 20px 12px">${[['', 'Semua'], ['terkirim', 'Terkirim'], ['antre', 'Antre'], ['tertunda', 'Tertunda'], ['gagal', 'Gagal']].map(([k, l]) => `<button class="tab ${k === st ? 'on' : ''}" data-s="${k}">${l}${k ? ` <span class="n">${r.hitung[k] || 0}</span>` : ''}</button>`).join('')}</div><div id="fn-riw"></div></div>
    <div class="card flush mt-3"><div class="card-h"><div><h3>${ikon('users')} Kontak & opt-out</h3><div class="sub">Kontak opt-out tidak menerima siaran (pengumuman/agenda). Tagihan tetap dikirim ke pemilik tagihan.</div></div></div>
      <div class="table-wrap" style="max-height:360px;overflow:auto"><table class="tbl responsive"><thead><tr><th>Rumah</th><th>Nama</th><th>Nomor</th><th>Siaran</th></tr></thead><tbody>${kontak.map(k => `<tr><td data-l="Rumah">${esc(k.rumahLabel)}</td><td data-l="Nama">${esc(k.nama || '-')}</td><td data-l="Nomor" class="mono">${esc(k.nomor)} ${k.valid ? '' : '<span class="badge danger">Tidak valid</span>'}</td><td data-l="Siaran"><label class="check"><input type="checkbox" ${k.optOut ? '' : 'checked'} onchange="optOut('${k.nomor}','${esc(k.nama || '')}','${k.rumah}',!this.checked)"> Terima</label></td></tr>`).join('') || `<tr><td colspan="4">${kosong('Belum ada nomor WA rumah.')}</td></tr>`}</tbody></table></div></div>`;
    $$('[data-s]', el).forEach(b => b.onclick = () => { st = b.dataset.s; $$('[data-s]', el).forEach(x => x.classList.toggle('on', x === b)); $('#fn-riw').innerHTML = loader(); muatRiwayat(); });
    $('#fn-riw').innerHTML = tabelWA(r.data, n => n.status === 'gagal' ? `<button class="btn btn-ghost btn-sm" onclick="kirimUlang('${n.id}', true)">${ikon('refresh', 'sm')}</button>` : '');
    $('#fn-token').onclick = async () => { const t = await mintaTeks('Ubah Token Fonnte', 'Token API Fonnte', { ya: 'Simpan token' }); if (t) try { const x = await api('simpanTokenFonnte', { token: t }); toast(x.pesan); router(); } catch (e) { gagal(e); } };
    $('#fn-trig').onclick = async () => { try { const x = await api('pasangTrigger'); toast(x.pesan); router(); } catch (e) { gagal(e); } };
    $('#fn-uji').onclick = () => {
      const m = modal({ judul: 'Uji Kirim Pesan', ikonJudul: 'send', isi: `<form id="uj-f">${formHTML([{ n: 'nomor', l: 'Nomor tujuan', t: 'tel', req: true, ph: '08xxxxxxxxxx' }, { n: 'pesan', l: 'Pesan (opsional)', t: 'textarea' }], '')}</form>`, kaki: `<button class="btn btn-primary" id="uj-ok">${ikon('send')} Kirim</button>` });
      $('#uj-ok', m.el).onclick = () => { const f = $('#uj-f', m.el); if (!validasiForm(f)) return; sibuk($('#uj-ok', m.el), async () => { try { const x = await api('ujiKirimWA', await bacaForm(f)); m.tutup(); toast(x.pesan); } catch (e) { gagal(e); } }); };
    };
  }
});
async function kirimUlang(id, satu) {
  let nomorBaru = '';
  if (satu) { nomorBaru = await mintaTeks('Kirim Ulang', 'Nomor baru (kosongkan untuk memakai nomor yang sama)', { wajib: false, ya: 'Kirim ulang' }); if (nomorBaru === null) return; }
  try { const r = await api('kirimUlangNotif', satu ? { ids: [id], nomorBaru } : { semuaGagal: true }); toast(r.pesan); router(); } catch (e) { gagal(e); }
}
async function optOut(nomor, nama, rumah, v) { try { await api('ubahOptOut', { nomor, nama, rumah, optOut: v }); toast(v ? 'Kontak tidak menerima siaran.' : 'Kontak menerima siaran.'); } catch (e) { gagal(e); } }

// ============================================================
// LOG AKTIVITAS
// ============================================================
daftarHalaman('log', {
  judul: 'Log Aktivitas', ikon: 'list', menu: 'Log Aktivitas',
  render: async el => {
    const f = { halaman: 1, batas: 25, q: '', modul: '', dari: '', sampai: '' };
    el.innerHTML = kepala('Log Aktivitas & Audit Trail', 'Catatan hanya-tambah atas login, akun, data warga, nomor WA, pengaturan, tagihan, transaksi, WhatsApp, dan status surat. Log tidak dapat dihapus.', `<button class="btn btn-outline" id="lg-xls">${ikon('download')} Unduh Excel</button>`) + `
    <div class="card mb-2"><div class="row"><input class="input grow" id="lg-q" placeholder="Cari aksi, ID data…"><select class="input" id="lg-m" style="width:auto"><option value="">Semua modul</option></select><input type="date" class="input" id="lg-d" style="width:auto"><input type="date" class="input" id="lg-s" style="width:auto"><button class="btn btn-primary" id="lg-go">${ikon('search')}</button></div></div>
    <div class="card flush" id="lg-tbl"></div>`;
    const fmt = s => { try { return JSON.stringify(JSON.parse(s), null, 2); } catch (e) { return s || '—'; } };
    const muat = async () => {
      $('#lg-tbl').innerHTML = loader();
      const r = await api('listLog', f);
      if ($('#lg-m').options.length === 1) $('#lg-m').innerHTML += r.modul.map(m => `<option>${esc(m)}</option>`).join('');
      window._log = r.data;
      const hal = Math.ceil(r.total / r.perHalaman) || 1;
      $('#lg-tbl').innerHTML = `<div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Waktu</th><th>Pelaku</th><th>Modul & aksi</th><th>Data</th><th></th></tr></thead><tbody>
        ${r.data.map((l, i) => `<tr><td data-l="Waktu" class="mono nowrap">${esc(l.waktu)}</td><td data-l="Pelaku"><b>${esc(l.nama)}</b><div class="sub">${esc(l.username)} · ${esc(l.peranLabel)}</div></td><td data-l="Aksi"><div class="xs muted">${esc(l.modul)}</div><span class="badge info">${esc(l.aksi)}</span></td><td data-l="Data" class="mono small">${esc(l.idData)}</td>
          <td data-l="">${l.lama || l.baru ? `<button class="btn btn-ghost btn-sm" onclick="this.closest('tr').nextElementSibling.classList.toggle('hidden')">Diff</button>` : ''}</td></tr>
          ${l.lama || l.baru ? `<tr class="hidden"><td colspan="5"><div class="diff"><pre class="old">${esc(fmt(l.lama))}</pre><pre class="new">${esc(fmt(l.baru))}</pre></div></td></tr>` : ''}`).join('') || `<tr><td colspan="5">${kosong('Tidak ada log.')}</td></tr>`}</tbody></table></div>
        <div class="row between" style="padding:14px 20px"><span class="small muted">${r.total} entri log</span><div class="row"><button class="btn btn-outline btn-sm" ${f.halaman <= 1 ? 'disabled' : ''} id="lg-prev">${ikon('left', 'sm')}</button><span class="small">Hal ${f.halaman} / ${hal}</span><button class="btn btn-outline btn-sm" ${f.halaman >= hal ? 'disabled' : ''} id="lg-next">${ikon('right', 'sm')}</button></div></div>`;
      $('#lg-prev').onclick = () => { f.halaman--; muat(); };
      $('#lg-next').onclick = () => { f.halaman++; muat(); };
    };
    $('#lg-go').onclick = () => { f.q = $('#lg-q').value; f.modul = $('#lg-m').value; f.dari = $('#lg-d').value; f.sampai = $('#lg-s').value; f.halaman = 1; muat(); };
    $('#lg-xls').onclick = async () => { try { const r = await api('listLog', Object.assign({}, f, { halaman: 1, batas: 5000 })); eksporExcel(r.data.map(l => ({ Waktu: l.waktu, Pelaku: l.nama, Username: l.username, Peran: l.peranLabel, Modul: l.modul, Aksi: l.aksi, 'ID Data': l.idData, 'Nilai Lama': l.lama, 'Nilai Baru': l.baru })), 'Log_Aktivitas_' + hariIni() + '.xlsx', 'Log'); } catch (e) { gagal(e); } };
    muat();
  }
});
