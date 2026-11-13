/**
 * layanan.js — Kotak surat (Ketua RT memutuskan, Sekretaris melihat), pengaduan,
 * serta pengelolaan pengumuman, agenda, galeri, dan notulen (Sekretaris).
 */

// ============================================================
// KOTAK SURAT MASUK
// ============================================================
daftarHalaman('surat-masuk', {
  judul: 'Kotak Surat Masuk', ikon: 'mail', menu: 'Kotak Surat Masuk', pendek: 'Surat', cntMerah: true,
  render: async (el, param) => {
    if (param) return detailSurat(el, param);
    const rows = await api('listSurat');
    const ketua = Sesi.user.peran === 'ketua';
    let st = ketua ? 'Diajukan' : '', q = '';
    const hit = s => rows.filter(r => !s || r.status === s).length;
    const gambar = () => {
      const list = rows.filter(r => (!st || r.status === st) && (!q || (r.id + r.pemohon + r.jenis + r.rumahLabel).toLowerCase().includes(q)));
      $('#sm-tbl').innerHTML = list.length ? `<div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Diajukan</th><th>ID</th><th>Pemohon</th><th>Jenis surat</th><th>Keperluan</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map(s => `<tr class="clickable" onclick="location.hash='#/panel/surat-masuk/${s.id}'"><td data-l="Diajukan" class="nowrap">${esc(tgl(s.tanggal, true))}<div class="sub">${esc((s.tanggal || '').substr(11, 5))} WIB</div></td><td data-l="ID"><span class="mono badge diajukan">${esc(s.id)}</span></td><td data-l="Pemohon"><b>${esc(s.pemohon)}</b><div class="sub">${esc(s.rumahLabel)}</div></td><td data-l="Jenis">${esc(s.jenis)}</td><td data-l="Keperluan"><div class="small" style="max-width:260px">${esc(s.keperluan)}</div></td><td data-l="Status">${badge(s.status)}</td><td data-l="">${ikon('right')}</td></tr>`).join('')}</tbody></table></div>` : kosong('Tidak ada surat pada status ini.', 'mail');
    };
    el.innerHTML = kepala('Kotak Pengajuan Surat Warga', ketua ? 'Periksa, minta perbaikan, setujui atau tolak, lalu terbitkan surat dalam PDF.' : 'Pemantauan daftar dan status pengajuan surat (baca saja).',
      ketua ? `<span class="badge penting">${ikon('shield', 'sm')} Mode keputusan: Ketua RT</span>` : '<span class="badge">Baca saja</span>') + `
    ${!ketua ? `<div class="alert info mb-2">${ikon('info')}<div>Keputusan persetujuan dan penerbitan surat merupakan wewenang Ketua RT.</div></div>` : ''}
    <div class="tabs mb-2">${['', 'Diajukan', 'Perlu Perbaikan', 'Disetujui', 'Selesai Diterbitkan', 'Ditolak'].map(s => `<button class="tab ${s === st ? 'on' : ''}" data-s="${s}">${s || 'Semua'} <span class="n">${hit(s)}</span></button>`).join('')}</div>
    <div class="card flush"><div style="padding:16px 20px"><input class="input" id="sm-q" placeholder="Cari nomor berkas, nama pemohon, blok…"></div><div id="sm-tbl"></div></div>`;
    $$('[data-s]', el).forEach(b => b.onclick = () => { st = b.dataset.s; $$('[data-s]', el).forEach(x => x.classList.toggle('on', x === b)); gambar(); });
    $('#sm-q').oninput = e => { q = e.target.value.toLowerCase(); gambar(); };
    gambar();
  }
});

async function detailSurat(el, id) {
  const ketua = Sesi.user.peran === 'ketua';
  const rows = await api('listSurat');
  const s = rows.find(r => r.id === id);
  if (!s) { el.innerHTML = errorBox(new Error('Surat tidak ditemukan.')); return; }
  const pv = ketua ? await api('pratinjauSurat', { id }) : null;
  const I = pv ? pv.isi : null;
  const bisaPutus = ketua && ['Diajukan', 'Disetujui'].includes(s.status);
  el.innerHTML = `<div class="crumb"><a href="#/panel/surat-masuk">Kotak surat</a> ${ikon('right', 'sm')} <b class="mono">${esc(s.id)}</b></div>` +
    kepala('Verifikasi & Penerbitan Surat', esc(s.jenis) + ' · diajukan ' + esc(tglJam(s.tanggal)), `<a class="btn btn-outline" href="#/panel/surat-masuk">${ikon('left')} Kembali</a>`) + `
  <div class="mb-2">${badge(s.status)}${s.nomor ? ` <span class="mono badge">${esc(s.nomor)}</span>` : ''}</div>
  <div class="split half"><div class="stack">
    <div class="card"><div class="card-h"><h3>${ikon('user')} Data pemohon</h3></div><dl class="kv"><dt>Nama</dt><dd>${esc(s.pemohon)}</dd>${I ? `<dt>Jenis kelamin</dt><dd>${esc(I.JENIS_KELAMIN)}</dd><dt>Tanggal lahir</dt><dd>${esc(I.TGL_LAHIR)}</dd><dt>Hubungan</dt><dd>${esc(I.HUBUNGAN)}</dd>` : ''}<dt>Rumah</dt><dd>${esc(s.rumahLabel)}</dd>${pv ? `<dt>WhatsApp</dt><dd class="mono">${esc(pv.pemohonWA || '-')}</dd>` : ''}</dl>
      ${pv ? `<div class="alert ${pv.tunggakan ? 'warn' : 'ok'} mt-2">${ikon(pv.tunggakan ? 'alert' : 'check')}<div>Status iuran rumah: ${pv.tunggakan ? 'tunggakan ' + rp(pv.tunggakan) : 'tidak ada tunggakan'}<div class="xs">Informasi saja; bukan syarat penerbitan.</div></div></div>` : ''}</div>
    <div class="card"><div class="card-h"><h3>${ikon('file')} Rincian permohonan</h3></div><div class="lbl-f">Jenis surat</div><p><span class="badge penting">${esc(s.jenis)}</span></p><div class="lbl-f">Keperluan</div><p class="card" style="background:var(--hover);box-shadow:none">“${esc(s.keperluan)}”</p>
      <div class="lbl-f mb-1">Lampiran (${s.lampiran.length})</div>${s.lampiran.map(l => `<div class="list-item">${ikon(/pdf/.test(l.mime) ? 'file' : 'image')}<span class="grow">${esc(l.nama)}</span><button class="btn btn-ghost btn-sm" onclick="bukaBerkas('${l.id}')">${ikon('eye', 'sm')} Pratinjau</button></div>`).join('') || '<p class="muted small">Tidak ada lampiran.</p>'}</div>
    <div class="card"><div class="card-h"><h3>${ikon('history')} Riwayat status</h3></div><div class="timeline">${s.riwayat.map(r => `<div class="t"><b>${esc(r.status)}</b> <span class="small muted">${esc(tglJam(r.t))} · ${esc(r.oleh)}</span>${r.catatan ? `<div class="small">${esc(r.catatan)}</div>` : ''}</div>`).join('')}</div></div>
  </div><div class="stack">
    ${I ? `<div class="card"><div class="card-h"><h3>${ikon('printer')} Pratinjau kertas A4</h3><span class="small muted">${s.nomor ? 'Nomor final' : 'Nomor perkiraan'}</span></div>
      <div class="paper"><div class="kop">${pv.logoUrl ? `<img src="${esc(pv.logoUrl)}" alt="">` : ''}<h4>${esc(I.KOP_NAMA)}</h4><p>${esc(I.ALAMAT_RT)}</p></div>
        <div class="judul"><b>${esc(s.jenis.toUpperCase())}</b>Nomor: <span class="mono">${esc(I.NOMOR_SURAT)}</span></div>
        <p>Yang bertanda tangan di bawah ini, Ketua ${esc(I.NAMA_RT)}, dengan ini menerangkan bahwa:</p>
        <table><tr><td>Nama Lengkap</td><td>:</td><td><b>${esc(I.NAMA_PEMOHON)}</b></td></tr><tr><td>Jenis Kelamin</td><td>:</td><td>${esc(I.JENIS_KELAMIN)}</td></tr><tr><td>Tanggal Lahir</td><td>:</td><td>${esc(I.TGL_LAHIR)}</td></tr><tr><td>Alamat</td><td>:</td><td>${esc(I.ALAMAT_PEMOHON)}</td></tr></table>
        <p class="mt-1">Adalah benar warga yang berdomisili di lingkungan ${esc(I.NAMA_RT)}. Surat ini diberikan untuk keperluan: <b>${esc(I.KEPERLUAN)}</b>.</p><p>Demikian surat ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
        <div class="ttd">${esc(I.KOTA)}, ${esc(I.TANGGAL_SURAT)}<br>Ketua ${esc(I.NAMA_RT)},<div class="space">Ruang tanda tangan manual</div><b style="text-decoration:underline">${esc(I.NAMA_KETUA)}</b></div></div>
      <p class="xs muted mt-1 mb-0">Isi akhir mengikuti template Google Docs jenis surat ini (dapat disunting Administrator).</p></div>` : ''}
    ${bisaPutus ? `<div class="card"><label class="check mb-2"><input type="checkbox" id="ds-wa" checked> <span>Kirim notifikasi WhatsApp ke pemohon (${esc(pv.pemohonWA || 'nomor belum ada')})</span></label>
      <div class="grid g-3" style="gap:.5rem"><button class="btn btn-primary" id="ds-terbit">${ikon('check')} Terbitkan PDF</button><button class="btn btn-outline" id="ds-perbaiki">${ikon('edit')} Minta perbaikan</button><button class="btn btn-danger" id="ds-tolak">${ikon('xcircle')} Tolak</button></div>
      ${s.status === 'Diajukan' ? `<button class="btn btn-ghost btn-block mt-1" id="ds-setuju">${ikon('tick')} Setujui dulu (terbitkan nanti)</button>` : ''}</div>` : ''}
    ${s.pdfId ? `<div class="card"><div class="alert ok">${ikon('check')}<div>Surat diterbitkan dengan nomor <b class="mono">${esc(s.nomor)}</b>.</div></div><button class="btn btn-accent btn-block mt-2" onclick="bukaBerkas('${s.pdfId}',true)">${ikon('download')} Unduh PDF untuk dicetak</button></div>` : ''}
  </div></div>`;
  if (!bisaPutus) return;
  const putus = async (keputusan, alasan) => { try { const r = await api('putuskanSurat', { id, keputusan, alasan }); toast(r.pesan); perbaruiHitung(); router(); } catch (e) { gagal(e); } };
  $('#ds-terbit').onclick = async () => {
    if (!await konfirmasi(`Terbitkan <b>${esc(s.jenis)}</b> untuk <b>${esc(s.pemohon)}</b>? Nomor surat dibuat otomatis dan tidak dapat diubah.`, { ya: 'Terbitkan PDF' })) return;
    await sibuk($('#ds-terbit'), async () => { try { const r = await api('terbitkanSurat', { id, kirimWA: $('#ds-wa').checked }); toast(r.pesan); perbaruiHitung(); router(); } catch (e) { gagal(e); } });
  };
  $('#ds-perbaiki').onclick = async () => { const a = await mintaTeks('Minta Perbaikan', 'Apa yang perlu diperbaiki pemohon?', { ya: 'Kirim permintaan' }); if (a) putus('perbaikan', a); };
  $('#ds-tolak').onclick = async () => { const a = await mintaTeks('Tolak Pengajuan', 'Alasan penolakan (dikirim ke pemohon)', { ya: 'Tolak', bahaya: true }); if (a) putus('tolak', a); };
  if ($('#ds-setuju')) $('#ds-setuju').onclick = () => putus('setujui', '');
}

// ============================================================
// PENGADUAN (pengurus)
// ============================================================
daftarHalaman('pengaduan', {
  judul: 'Pengaduan Warga', ikon: 'message', menu: 'Pengaduan Warga',
  render: async el => {
    const rows = await api('listPengaduan');
    window._adu = rows;
    let st = '';
    const gambar = () => {
      const list = rows.filter(r => !st || r.status === st);
      $('#ad-list').innerHTML = list.length ? list.map(p => `<div class="card mb-2"><div class="row between top"><div class="grow"><div class="row gap-sm">${badge(p.status)}<span class="small muted">${esc(tglJam(p.tanggal))} · ${esc(p.rumahLabel)} — ${esc(p.kepala || '')}</span></div><h3 class="mt-1" style="font-size:18px">${esc(p.judul)}</h3><p class="mb-0">${nl2br(p.isi)}</p>
        ${p.tanggapan ? `<div class="alert info mt-2">${ikon('message')}<div><b>Tanggapan ${esc(p.oleh)}:</b> ${nl2br(p.tanggapan)}</div></div>` : ''}</div>
        <div class="row">${p.fotoId ? `<button class="btn btn-ghost btn-sm" onclick="bukaBerkas('${p.fotoId}')">${ikon('image', 'sm')} Foto</button>` : ''}<button class="btn btn-primary btn-sm" onclick="tanggapi(${rows.indexOf(p)})">${ikon('message', 'sm')} Tanggapi</button></div></div></div>`).join('') : `<div class="card">${kosong('Tidak ada pengaduan.', 'message')}</div>`;
    };
    el.innerHTML = kepala('Pengaduan Warga', 'Tanggapi pengaduan dan perbarui statusnya. Pelapor melihat tanggapan dari akunnya.') +
      `<div class="tabs mb-2">${['', 'Diterima', 'Diproses', 'Selesai'].map(s => `<button class="tab ${s === st ? 'on' : ''}" data-s="${s}">${s || 'Semua'} <span class="n">${rows.filter(r => !s || r.status === s).length}</span></button>`).join('')}</div><div id="ad-list"></div>`;
    $$('[data-s]', el).forEach(b => b.onclick = () => { st = b.dataset.s; $$('[data-s]', el).forEach(x => x.classList.toggle('on', x === b)); gambar(); });
    gambar();
  }
});
function tanggapi(i) {
  const p = window._adu[i];
  const m = modal({ judul: 'Tanggapi: ' + p.judul, ikonJudul: 'message', isi: `<form id="tg-f">${formHTML([{ n: 'Status', l: 'Status penanganan', t: 'select', o: ['Diterima', 'Diproses', 'Selesai'], v: p.status === 'Diterima' ? 'Diproses' : p.status }, { n: 'Tanggapan', l: 'Tanggapan untuk pelapor', t: 'textarea', v: p.tanggapan, full: true }])}</form>`, kaki: `<button class="btn btn-primary" id="tg-ok">${ikon('send')} Simpan</button>` });
  $('#tg-ok', m.el).onclick = () => sibuk($('#tg-ok', m.el), async () => { try { const d = await bacaForm($('#tg-f', m.el)); d.id = p.id; const r = await api('tanggapiPengaduan', d); m.tutup(); toast(r.pesan); perbaruiHitung(); router(); } catch (e) { gagal(e); } });
}

// ============================================================
// KELOLA PENGUMUMAN
// ============================================================
daftarHalaman('kelola-pengumuman', {
  judul: 'Kelola Pengumuman', ikon: 'megaphone', menu: 'Pengumuman', pendek: 'Pengumuman',
  render: async el => {
    const rows = await api('listPengumuman');
    window._png = rows;
    el.innerHTML = kepala('Kelola Pengumuman', 'Atur audiens (Publik / Khusus Warga) dan prioritas (Penting / Informasi Umum). Pengumuman Penting dapat disiarkan via WhatsApp oleh Administrator.', `<button class="btn btn-primary" onclick="formPengumuman()">${ikon('plus')} Pengumuman baru</button>`) + `
    <div class="card flush"><div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Tanggal</th><th>Judul</th><th>Audiens</th><th>Prioritas</th><th>Status</th><th></th></tr></thead><tbody>
    ${rows.map((p, i) => `<tr><td data-l="Tanggal" class="nowrap">${esc(tglJam(p.tanggal))}</td><td data-l="Judul"><b>${esc(p.judul)}</b><div class="sub">${esc(String(p.isi).substr(0, 90))}…</div></td><td data-l="Audiens">${p.audiens === 'Publik' ? '<span class="badge info">Publik</span>' : '<span class="badge">' + ikon('lock', 'sm') + ' Khusus Warga</span>'}</td><td data-l="Prioritas">${badge(p.prioritas)}</td><td data-l="Status">${badge(p.status)}</td>
      <td data-l="" class="nowrap"><button class="btn btn-ghost btn-sm" onclick="formPengumuman(_png[${i}])">${ikon('edit', 'sm')}</button>${p.status !== 'Arsip' ? `<button class="btn btn-ghost btn-sm" title="Arsipkan" onclick="hapusKonten('pengumuman','${p.id}')">${ikon('trash', 'sm')}</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="6">${kosong('Belum ada pengumuman.', 'megaphone')}</td></tr>`}</tbody></table></div></div>`;
  }
});
function formPengumuman(p = {}) {
  const m = modal({ judul: p.id ? 'Ubah Pengumuman' : 'Pengumuman Baru', ikonJudul: 'megaphone', besar: true, isi: `<form id="pg-f">${formHTML([
    { n: 'Judul', l: 'Judul', v: p.judul, req: true, full: true }, { n: 'Isi', l: 'Isi pengumuman', t: 'textarea', v: p.isi, req: true, full: true, attr: 'rows="8"' },
    { n: 'Audiens', l: 'Audiens', t: 'select', o: [['Publik', 'Publik — tampil tanpa login'], ['Khusus Warga', 'Khusus Warga — setelah login']], v: p.audiens },
    { n: 'Prioritas', l: 'Prioritas', t: 'select', o: [['Informasi Umum', 'Informasi Umum'], ['Penting', 'Penting — tampil paling atas']], v: p.prioritas },
    { n: 'Tanggal', l: 'Tanggal tayang', t: 'date', v: (p.tanggal || hariIni()).substr(0, 10) }, { n: 'Status_Publikasi', l: 'Status', t: 'select', o: ['Terbit', 'Draf', 'Arsip'], v: p.status },
    { n: 'file', l: 'Lampiran (opsional)', t: 'file', full: true, hint: p.lampiranId ? 'Sudah ada lampiran; unggah baru untuk mengganti.' : '' }
  ])}</form>`, kaki: `<button class="btn btn-outline" data-x>Batal</button><button class="btn btn-primary" id="pg-ok">${ikon('check')} Simpan</button>` });
  $('[data-x]', m.el).onclick = m.tutup;
  $('#pg-ok', m.el).onclick = () => { const f = $('#pg-f', m.el); if (!validasiForm(f)) return; sibuk($('#pg-ok', m.el), async () => { try { const d = await bacaForm(f); if (p.id) d.ID_Pengumuman = p.id; const r = await api('simpanPengumuman', d); m.tutup(); toast(r.pesan || 'Tersimpan.'); router(); } catch (e) { gagal(e); } }); };
}
async function hapusKonten(jenis, id) {
  if (!await konfirmasi(jenis === 'pengumuman' ? 'Arsipkan pengumuman ini? Tidak lagi tampil untuk warga.' : 'Hapus data ini? Nilai lama tetap tercatat di log aktivitas.', { bahaya: true, ya: jenis === 'pengumuman' ? 'Arsipkan' : 'Hapus' })) return;
  try { const r = await api('hapusKonten', { jenis, id }); toast(r.pesan); router(); } catch (e) { gagal(e); }
}

// ============================================================
// KELOLA AGENDA
// ============================================================
daftarHalaman('kelola-agenda', {
  judul: 'Kelola Agenda', ikon: 'calendar', menu: 'Agenda', pendek: 'Agenda',
  render: async el => {
    const rows = await api('listAgenda');
    window._agd = rows;
    const t = hariIni();
    el.innerHTML = kepala('Kelola Agenda', 'Agenda tampil di portal publik dan dashboard warga.', `<button class="btn btn-primary" onclick="formAgenda()">${ikon('plus')} Agenda baru</button>`) +
      `<div class="card">${rows.length ? rows.slice().sort((a, b) => (a.tanggal < t) - (b.tanggal < t) || (a.tanggal < t ? b.tanggal.localeCompare(a.tanggal) : a.tanggal.localeCompare(b.tanggal))).map(a => `<div class="row top" style="border-bottom:1px solid var(--border)"><div class="grow" style="${a.tanggal < t ? 'opacity:.6' : ''}">${itemAgenda(a, false)}</div><div class="row" style="padding-top:14px"><button class="btn btn-ghost btn-sm" onclick="formAgenda(_agd[${rows.indexOf(a)}])">${ikon('edit', 'sm')}</button><button class="btn btn-ghost btn-sm" onclick="hapusKonten('agenda','${a.id}')">${ikon('trash', 'sm')}</button></div></div>`).join('') : kosong('Belum ada agenda.', 'calendar')}</div>`;
  }
});
function formAgenda(a = {}) {
  const m = modal({ judul: a.id ? 'Ubah Agenda' : 'Agenda Baru', ikonJudul: 'calendar', isi: `<form id="ag-f">${formHTML([
    { n: 'Nama', l: 'Nama kegiatan', v: a.nama, req: true, full: true }, { n: 'Kategori', l: 'Kategori', t: 'select', o: ['Gotong Royong', 'Sosial & Kesehatan', 'Musyawarah RT', 'Keagamaan', 'Olahraga', 'Lainnya'], v: a.kategori },
    { n: 'Tanggal', l: 'Tanggal', t: 'date', v: a.tanggal, req: true }, { n: 'Waktu', l: 'Waktu', v: a.waktu, ph: '07.00 – 10.00 WIB' }, { n: 'Lokasi', l: 'Lokasi', v: a.lokasi },
    { n: 'Penanggung_Jawab', l: 'Penanggung jawab', v: a.pj, full: true }, { n: 'Keterangan', l: 'Keterangan', t: 'textarea', v: a.keterangan, full: true }
  ])}</form>`, kaki: `<button class="btn btn-primary" id="ag-ok">${ikon('check')} Simpan</button>` });
  $('#ag-ok', m.el).onclick = () => { const f = $('#ag-f', m.el); if (!validasiForm(f)) return; sibuk($('#ag-ok', m.el), async () => { try { const d = await bacaForm(f); if (a.id) d.ID_Agenda = a.id; await api('simpanAgenda', d); m.tutup(); toast('Agenda tersimpan.'); router(); } catch (e) { gagal(e); } }); };
}

// ============================================================
// KELOLA GALERI
// ============================================================
daftarHalaman('kelola-galeri', {
  judul: 'Kelola Galeri', ikon: 'image', menu: 'Galeri',
  render: async el => {
    const g = await api('listGaleri');
    el.innerHTML = kepala('Kelola Galeri', 'Foto disimpan di Google Drive per kegiatan. Hanya foto bertanda publik yang tampil di portal.', `<button class="btn btn-primary" id="gl-baru">${ikon('upload')} Unggah foto kegiatan</button>`) +
      (g.length ? g.map(k => `<div class="card mb-2"><div class="card-h"><div><h3>${esc(k.judul)}</h3><div class="sub">${esc(tgl(k.tanggal))} · ${k.foto.length} foto</div></div><button class="btn btn-outline btn-sm" onclick="unggahGaleri('${esc(k.id)}','${esc(k.judul)}','${esc(k.tanggal)}')">${ikon('plus', 'sm')} Tambah foto</button></div>
        <div class="grid g-4">${k.foto.map(f => `<div><div class="photo" data-drive="${f.publik ? '' : f.driveId}">${f.url ? `<img loading="lazy" src="${esc(f.url)}" alt="${esc(f.judul)}">` : `<div class="center muted small" style="padding-top:30%">${ikon('lock')}<br>Privat</div>`}<span class="tag">${f.publik ? '<span class="badge lunas">Publik</span>' : '<span class="badge">Pengurus</span>'}</span></div>
          <div class="row between mt-1"><span class="small grow">${esc(f.judul)}</span><button class="btn btn-ghost btn-sm" title="Ubah visibilitas" onclick="toggleFoto('${f.id}',${!f.publik})">${ikon(f.publik ? 'eyeoff' : 'eye', 'sm')}</button><button class="btn btn-ghost btn-sm" onclick="hapusKonten('galeri','${f.id}')">${ikon('trash', 'sm')}</button></div></div>`).join('')}</div></div>`).join('') : `<div class="card">${kosong('Belum ada foto.', 'image')}</div>`);
    $('#gl-baru').onclick = () => unggahGaleri();
    $$('[data-drive]', el).forEach(d => { if (d.dataset.drive) api('unduhFile', { id: d.dataset.drive }).then(f => { d.innerHTML = `<img src="data:${f.mime};base64,${f.base64}" alt="">` + d.querySelector('.tag').outerHTML; }).catch(() => { }); });
  }
});
function unggahGaleri(idK, judul, tanggal) {
  const m = modal({ judul: 'Unggah Foto Kegiatan', ikonJudul: 'camera', isi: `<form id="gl-f">${formHTML([
    { n: 'Judul_Kegiatan', l: 'Nama kegiatan', v: judul, req: true, full: true, attr: idK ? 'readonly' : '' }, { n: 'Tanggal', l: 'Tanggal kegiatan', t: 'date', v: tanggal || hariIni(), req: true },
    { n: 'Publik', l: 'Tampilkan di portal publik', t: 'check', v: true }, { n: 'files', l: 'Foto (maks 6, otomatis dikompres)', t: 'file', multi: true, accept: 'image/*', req: true, full: true }
  ])}</form>`, kaki: `<button class="btn btn-primary" id="gl-ok">${ikon('upload')} Unggah</button>` });
  $('#gl-ok', m.el).onclick = () => { const f = $('#gl-f', m.el); if (!validasiForm(f)) return; sibuk($('#gl-ok', m.el), async () => { try { const d = await bacaForm(f); if (idK) d.ID_Kegiatan = idK; const r = await api('unggahGaleri', d); m.tutup(); toast(r.jumlah + ' foto diunggah.'); router(); } catch (e) { gagal(e); } }); };
}
async function toggleFoto(id, publik) { try { await api('ubahGaleri', { id, Publik: publik }); toast(publik ? 'Foto kini publik.' : 'Foto kini hanya untuk pengurus.'); router(); } catch (e) { gagal(e); } }

// ============================================================
// KELOLA NOTULEN
// ============================================================
daftarHalaman('kelola-notulen', {
  judul: 'Notulen Musyawarah', ikon: 'file', menu: 'Notulen',
  render: async el => {
    const rows = await api('listNotulen');
    window._ntl = rows;
    el.innerHTML = kepala('Notulen Musyawarah', 'Setiap notulen dapat dipublikasikan atau hanya untuk pengurus.', `<button class="btn btn-primary" onclick="formNotulen()">${ikon('plus')} Notulen baru</button>`) + `
    <div class="card flush"><div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Tanggal</th><th>Judul</th><th>Keputusan</th><th>Akses</th><th></th></tr></thead><tbody>
    ${rows.map((n, i) => `<tr><td data-l="Tanggal" class="nowrap">${esc(tgl(n.tanggal, true))}</td><td data-l="Judul"><b>${esc(n.judul)}</b><div class="sub">${esc(n.tempat || '')}</div></td><td data-l="Keputusan"><div class="small" style="max-width:340px">${esc(String(n.keputusan || '').substr(0, 140))}</div></td><td data-l="Akses">${n.publik ? '<span class="badge lunas">Publik</span>' : '<span class="badge">Pengurus</span>'}</td>
      <td data-l="" class="nowrap"><button class="btn btn-ghost btn-sm" onclick="formNotulen(_ntl[${i}])">${ikon('edit', 'sm')}</button><button class="btn btn-ghost btn-sm" onclick="hapusKonten('notulen','${n.id}')">${ikon('trash', 'sm')}</button></td></tr>`).join('') || `<tr><td colspan="5">${kosong('Belum ada notulen.', 'file')}</td></tr>`}</tbody></table></div></div>`;
  }
});
function formNotulen(n = {}) {
  const m = modal({ judul: n.id ? 'Ubah Notulen' : 'Notulen Baru', ikonJudul: 'file', besar: true, isi: `<form id="nt-f">${formHTML([
    { n: 'Judul', l: 'Judul rapat', v: n.judul, req: true, full: true }, { n: 'Tanggal', l: 'Tanggal', t: 'date', v: n.tanggal, req: true }, { n: 'Tempat', l: 'Tempat', v: n.tempat },
    { n: 'Peserta', l: 'Peserta / kehadiran', t: 'textarea', v: n.peserta, full: true }, { n: 'Pembahasan', l: 'Pembahasan', t: 'textarea', v: n.pembahasan, full: true },
    { n: 'Keputusan', l: 'Keputusan', t: 'textarea', v: n.keputusan, full: true }, { n: 'Tindak_Lanjut', l: 'Tindak lanjut', t: 'textarea', v: n.tindakLanjut, full: true },
    { n: 'Publik', l: 'Publikasikan untuk warga & portal publik', t: 'check', v: n.publik }, { n: 'file', l: 'Lampiran (opsional)', t: 'file' }
  ])}</form>`, kaki: `<button class="btn btn-primary" id="nt-ok">${ikon('check')} Simpan</button>` });
  $('#nt-ok', m.el).onclick = () => { const f = $('#nt-f', m.el); if (!validasiForm(f)) return; sibuk($('#nt-ok', m.el), async () => { try { const d = await bacaForm(f); if (n.id) d.ID_Notulen = n.id; await api('simpanNotulen', d); m.tutup(); toast('Notulen tersimpan.'); router(); } catch (e) { gagal(e); } }); };
}
