/**
 * warga.js — Halaman khusus warga: tagihan & pembayaran, riwayat, surat, pengaduan, data keluarga.
 */

/** Kuitansi digital (dipakai warga & bendahara) */
function tampilKuitansi(k) {
  const isi = `<div class="kuitansi print-area" id="kwt">
    <div class="center"><div style="width:56px;height:56px;margin:0 auto 6px">${logoImg()}</div><b>${esc(k.namaRT || Identitas.data.namaRT)}</b><div class="xs muted">${esc(k.alamatRT || '')}</div></div>
    <hr style="border:0;border-top:2px solid var(--navy);margin:12px 0">
    <h3 class="center" style="font-size:17px">BUKTI PEMBAYARAN</h3><div class="center mono muted">${esc(k.id)}</div>
    <dl class="kv mt-2"><dt>Rumah</dt><dd>${esc(k.rumahLabel)}${k.kepala ? ' — ' + esc(k.kepala) : ''}</dd><dt>Pembayar</dt><dd>${esc(k.pembayar || '-')}</dd><dt>Metode</dt><dd>${esc(k.metode)}</dd><dt>Tanggal</dt><dd>${esc(tglJam(k.tanggal))}</dd><dt>Kas</dt><dd>${esc(k.kasLabel)}</dd><dt>Status</dt><dd>${badge(k.status)}</dd></dl>
    <table class="tbl mt-2"><thead><tr><th>Rincian</th><th class="right">Nominal</th></tr></thead><tbody>
      ${(k.alokasi || []).map(a => `<tr><td>${esc(a.label)}</td><td class="money">${rp(a.nominal)}</td></tr>`).join('')}
      ${k.saldoMuka ? `<tr><td>Saldo di muka</td><td class="money">${rp(k.saldoMuka)}</td></tr>` : ''}
      <tr><td><b>Total diterima</b></td><td class="money"><b>${rp(k.nominal)}</b></td></tr></tbody></table>
    <p class="xs muted mt-2 mb-0">Diverifikasi ${esc(k.petugas || '')} · ${esc(tglJam(k.diverifikasiPada))}. Bukti digital ini sah tanpa tanda tangan.</p></div>`;
  const m = modal({ judul: 'Kuitansi Digital', ikonJudul: 'receipt', isi, kaki: `<button class="btn btn-outline" id="kw-p">${ikon('printer')} Cetak / simpan PDF</button><button class="btn btn-primary" id="kw-x">Tutup</button>` });
  $('#kw-x', m.el).onclick = m.tutup;
  $('#kw-p', m.el).onclick = () => cetakHTML($('#kwt', m.el).outerHTML, 'Kuitansi ' + k.id);
}
/** Cetak potongan HTML di jendela baru dengan gaya aplikasi */
function cetakHTML(html, judul) {
  const w = window.open('', '_blank');
  if (!w) return toast('Izinkan pop-up untuk mencetak.', 'err');
  const css = [...document.querySelectorAll('link[rel=stylesheet]')].map(l => `<link rel="stylesheet" href="${l.href}">`).join('');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(judul)}</title>${css}<style>body{background:#fff;padding:24px}</style></head><body>${html}<script>setTimeout(()=>{print()},600)<\/script></body></html>`);
  w.document.close();
}

// ============================================================
// TAGIHAN & BAYAR
// ============================================================
daftarHalaman('tagihan-saya', {
  judul: 'Tagihan & Pembayaran', ikon: 'receipt', menu: 'Tagihan & Bayar', pendek: 'Tagihan',
  render: async el => {
    const [semua, rk, set] = await Promise.all([api('listTagihan'), api('ringkasanRumah'), api('getPengaturan')]);
    const rek = set.nilai.REKENING_RT;
    const terbuka = semua.filter(t => t.sisa > 0);
    const pilih = new Set();
    el.innerHTML = kepala('Tagihan & Pembayaran', 'Pilih tagihan yang ingin dibayar, transfer ke rekening RT, lalu unggah bukti. Pembayaran berlaku setelah diverifikasi bendahara.') + `
    <div class="grid g-3">${kpiCard('receipt', 'Sisa tagihan', rp(rk.tunggakan), terbuka.length + ' tagihan', rk.tunggakan ? 'r' : 'g')}${kpiCard('wallet', 'Saldo di muka', rp(rk.saldoMuka), rk.saldoMukaPerKas.map(s => esc(s.label) + ' ' + rp(s.sisa)).join(' · ') || 'Tidak ada', 'g')}${kpiCard('clock', 'Menunggu verifikasi', rp(rk.menungguVerifikasi), 'Belum mengurangi tagihan', 'y')}</div>
    ${rek ? `<div class="alert info mt-3">${ikon('bank')}<div>Rekening RT untuk transfer: <b class="mono">${esc(rek)}</b> <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText('${esc(rek)}').then(()=>toast('Disalin'))">${ikon('copy', 'sm')} Salin</button></div></div>` : ''}
    <div class="card flush mt-3"><div class="card-h"><h3>${ikon('list')} Tagihan belum lunas</h3><span class="small muted">Satu pembayaran hanya untuk tagihan dari kas yang sama</span></div>
      ${terbuka.length ? `<div class="table-wrap"><table class="tbl responsive"><thead><tr><th style="width:40px"></th><th>Tagihan</th><th>Kas</th><th>Jatuh tempo</th><th class="right">Nominal</th><th class="right">Sisa</th><th>Status</th></tr></thead><tbody>
      ${terbuka.map(t => `<tr><td data-l=""><input type="checkbox" class="pt" data-id="${t.id}" data-kas="${t.kas}" data-sisa="${t.sisa}" style="width:22px;height:22px;accent-color:var(--navy)" aria-label="Pilih ${esc(t.label)}"></td><td data-l="Tagihan"><b>${esc(t.label)}</b></td><td data-l="Kas">${esc(t.kasLabel)}</td><td data-l="Jatuh tempo">${esc(tgl(t.jatuhTempo, true))}${selisihHari(t.jatuhTempo) < 0 ? ' <span class="badge danger">Lewat</span>' : ''}</td><td data-l="Nominal" class="money">${rp(t.nominal)}</td><td data-l="Sisa" class="money"><b>${rp(t.sisa)}</b></td><td data-l="Status">${badge(t.status)}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="row between" style="padding:16px 20px;border-top:1px solid var(--border)"><div>Dipilih: <b id="tg-n">0</b> tagihan · <b class="mono" id="tg-tot">Rp0</b></div>
        <div class="row"><button class="btn btn-outline" id="tg-saldo" disabled>${ikon('wallet')} Pakai saldo di muka</button><button class="btn btn-primary" id="tg-bayar" disabled>${ikon('upload')} Unggah bukti transfer</button></div></div>`
        : `<div style="padding:0 20px 20px"><div class="alert ok">${ikon('check')}<div>Tidak ada tagihan terbuka. Anda tetap dapat menyetor di muka.</div></div></div>`}</div>
    <div class="row mt-2"><button class="btn btn-ghost" id="tg-muka">${ikon('plus')} Setor di muka tanpa memilih tagihan</button></div>
    <div class="card flush mt-3"><div class="card-h"><h3>${ikon('history')} Semua tagihan</h3></div><div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Tagihan</th><th>Kas</th><th class="right">Nominal</th><th class="right">Terbayar</th><th>Status</th></tr></thead><tbody>
      ${semua.map(t => `<tr><td data-l="Tagihan">${esc(t.label)}</td><td data-l="Kas">${esc(t.kasLabel)}</td><td data-l="Nominal" class="money">${rp(t.nominal)}</td><td data-l="Terbayar" class="money">${rp(t.terbayar)}</td><td data-l="Status">${badge(t.status)}</td></tr>`).join('') || `<tr><td colspan="5">${kosong('Belum ada tagihan.')}</td></tr>`}</tbody></table></div></div>`;

    const upd = () => {
      const sel = $$('.pt:checked', el);
      const kasSet = [...new Set(sel.map(c => c.dataset.kas))];
      $$('.pt', el).forEach(c => { c.disabled = kasSet.length === 1 && c.dataset.kas !== kasSet[0]; });
      pilih.clear(); sel.forEach(c => pilih.add(c.dataset.id));
      const tot = sel.reduce((s, c) => s + Number(c.dataset.sisa), 0);
      $('#tg-n').textContent = sel.length; $('#tg-tot').textContent = rp(tot);
      $('#tg-bayar').disabled = !sel.length;
      const sm = kasSet.length === 1 ? (rk.saldoMukaPerKas.find(s => s.kas === kasSet[0]) || {}).sisa || 0 : 0;
      $('#tg-saldo').disabled = !sm;
      return { tot, kas: kasSet[0] };
    };
    $$('.pt', el).forEach(c => c.onchange = upd);
    if ($('#tg-bayar')) $('#tg-bayar').onclick = () => { const s = upd(); formBayar([...pilih], s.tot, rek, s.kas); };
    $('#tg-muka').onclick = () => formBayar([], 0, rek, 'umum');
    if ($('#tg-saldo')) $('#tg-saldo').onclick = async () => {
      if (!await konfirmasi('Gunakan saldo di muka untuk melunasi tagihan yang dipilih? Ini adalah persetujuan Anda atas alokasi manual.', { ya: 'Gunakan saldo' })) return;
      try { const r = await api('pakaiSaldoMuka', { tagihan: [...pilih] }); toast(r.pesan); router(); } catch (e) { gagal(e); }
    };
  }
});

function formBayar(ids, total, rek, kas) {
  const m = modal({ judul: 'Unggah Bukti Transfer', ikonJudul: 'upload', isi: `
    ${ids.length ? `<div class="alert info mb-2">${ikon('info')}<div>${ids.length} tagihan dipilih, total <b>${rp(total)}</b>. Bila Anda transfer lebih, kelebihannya menjadi saldo di muka. Bila kurang, tagihan tercatat dibayar sebagian.</div></div>` : `<div class="alert info mb-2">${ikon('info')}<div>Setoran tanpa tagihan akan menjadi <b>saldo di muka</b> dan otomatis dipakai untuk tagihan berikutnya.</div></div>`}
    ${rek ? `<p>Transfer ke: <b class="mono">${esc(rek)}</b></p>` : ''}
    <form id="by-f" class="stack" novalidate>${formHTML([
      { n: 'nominal', l: 'Nominal yang ditransfer (Rp)', t: 'number', v: total || '', req: true },
      { n: 'tanggal', l: 'Tanggal transfer', t: 'date', v: hariIni(), req: true },
      ...(ids.length ? [] : [{ n: 'kas', l: 'Untuk kas', t: 'select', o: [['umum', 'Kas Umum'], ['pembangunan', 'Kas Pembangunan'], ['sosial', 'Kas Sosial']], v: kas }]),
      { n: 'pembayar', l: 'Nama pemilik rekening pengirim', ph: 'Sesuai bukti transfer' },
      { n: 'catatan', l: 'Catatan (opsional)', t: 'textarea', full: true },
      { n: 'file', l: 'Foto/screenshot bukti transfer', t: 'file', req: true, full: true }
    ])}</form>`, kaki: `<button class="btn btn-outline" data-x>Batal</button><button class="btn btn-primary" id="by-ok">${ikon('send')} Kirim untuk verifikasi</button>` });
  $('[data-x]', m.el).onclick = m.tutup;
  $('#by-ok', m.el).onclick = async () => {
    const f = $('#by-f', m.el);
    if (!validasiForm(f)) return;
    await sibuk($('#by-ok', m.el), async () => {
      try {
        const d = await bacaForm(f);
        const r = await api('ajukanPembayaran', { tagihan: ids, nominal: Number(d.nominal), tanggal: d.tanggal, pembayar: d.pembayar, catatan: d.catatan, file: d.file, kas: d.kas });
        m.tutup(); toast(r.pesan); router();
      } catch (e) { gagal(e); }
    });
  };
}

// ============================================================
// RIWAYAT PEMBAYARAN
// ============================================================
daftarHalaman('riwayat-bayar', {
  judul: 'Riwayat Pembayaran', ikon: 'history', menu: 'Riwayat Pembayaran',
  render: async el => {
    const rows = await api('listPembayaran');
    window._byr = rows;
    el.innerHTML = kepala('Riwayat Pembayaran', 'Semua pembayaran rumah Anda beserta status verifikasi.') + `<div class="card flush">${rows.length ? `<div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Tanggal</th><th>Rincian</th><th>Metode</th><th class="right">Nominal</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.map((p, i) => `<tr><td data-l="Tanggal" class="nowrap">${esc(tglJam(p.tanggal))}<div class="sub mono">${esc(p.id)}</div></td>
        <td data-l="Rincian">${p.alokasi.length ? p.alokasi.map(a => esc(a.label) + ' ' + rp(a.nominal)).join('<br>') : p.tagihan.map(t => esc(t.label)).join(', ') || 'Saldo di muka'}${p.status === 'Ditolak' ? `<div class="err small mt-1">Ditolak: ${esc(p.alasanTolak)}</div>` : ''}</td>
        <td data-l="Metode">${esc(p.metode)}<div class="sub">${esc(p.kasLabel)}</div></td><td data-l="Nominal" class="money">${rp(p.nominal)}</td><td data-l="Status">${badge(p.status)}</td>
        <td data-l="">${p.status === 'Terverifikasi' ? `<button class="btn btn-outline btn-sm" onclick="tampilKuitansi(Object.assign({namaRT:Identitas.data.namaRT, alamatRT:Identitas.data.alamat}, _byr[${i}]))">${ikon('receipt', 'sm')} Kuitansi</button>` : p.buktiId ? `<button class="btn btn-ghost btn-sm" onclick="bukaBerkas('${p.buktiId}')">${ikon('eye', 'sm')} Bukti</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : kosong('Belum ada pembayaran.', 'receipt')}</div>`;
  }
});

// ============================================================
// SURAT SAYA
// ============================================================
daftarHalaman('surat-saya', {
  judul: 'Surat Saya', ikon: 'file', menu: 'Pengajuan Surat', pendek: 'Surat',
  render: async el => {
    const [rows, jenis, det] = await Promise.all([api('listSurat'), api('listJenisSurat'), api('detailRumah')]);
    const anggota = det.anggota.filter(a => a.aktif);
    el.innerHTML = kepala('Pengajuan Surat', 'Ajukan surat pengantar atau keterangan. Pengajuan langsung masuk ke Ketua RT.', `<button class="btn btn-primary" id="sr-baru">${ikon('plus')} Ajukan surat</button>`) +
      (rows.length ? rows.map(s => `<div class="card mb-2"><div class="row between top"><div class="grow"><div class="row gap-sm">${badge(s.status)}<span class="mono muted">${esc(s.id)}</span></div><h3 class="mt-1" style="font-size:18px">${esc(s.jenis)}</h3><div class="small muted">Pemohon: ${esc(s.pemohon)} · Diajukan ${esc(tglJam(s.tanggal))}</div><p class="mt-1 mb-0">${esc(s.keperluan)}</p>
        ${s.alasan && (s.status === 'Perlu Perbaikan' || s.status === 'Ditolak') ? `<div class="alert ${s.status === 'Ditolak' ? 'err' : 'warn'} mt-2">${ikon('alert')}<div><b>Catatan Ketua RT:</b> ${esc(s.alasan)}</div></div>` : ''}
        ${s.nomor ? `<div class="mt-1">Nomor: <span class="mono">${esc(s.nomor)}</span></div>` : ''}</div>
        <div class="row">${s.pdfId ? `<button class="btn btn-accent" onclick="bukaBerkas('${s.pdfId}',true)">${ikon('download')} Unduh PDF</button>` : ''}${s.status === 'Perlu Perbaikan' ? `<button class="btn btn-primary" onclick="perbaikiSurat('${s.id}', ${JSON.stringify(s.keperluan).replace(/"/g, '&quot;')})">${ikon('edit')} Kirim perbaikan</button>` : ''}</div></div>
        <details class="mt-2"><summary style="cursor:pointer;color:var(--navy);font-weight:600" class="small">Riwayat status</summary><div class="timeline mt-2">${s.riwayat.map(r => `<div class="t"><b>${esc(r.status)}</b> <span class="small muted">${esc(tglJam(r.t))} · ${esc(r.oleh)}</span>${r.catatan ? `<div class="small">${esc(r.catatan)}</div>` : ''}</div>`).join('')}</div></details></div>`).join('')
        : `<div class="card">${kosong('Belum ada pengajuan surat.', 'file')}</div>`);
    $('#sr-baru').onclick = () => {
      const m = modal({ judul: 'Ajukan Surat', ikonJudul: 'file', isi: `<form id="sr-f" class="stack" novalidate>${formHTML([
        { n: 'ID_Jenis', l: 'Jenis surat', t: 'select', req: true, o: [['', 'Pilih jenis surat…']].concat(jenis.map(j => [j.id, j.nama])) },
        { n: 'ID_Anggota', l: 'Nama pemohon', t: 'select', req: true, o: [['', 'Pilih anggota keluarga…']].concat(anggota.map(a => [a.id, a.nama + ' (' + a.hubungan + ')'])), hint: anggota.length ? '' : 'Data keluarga kosong. Ajukan penambahan anggota di menu Data Keluarga.' },
        { n: 'Keperluan', l: 'Keperluan', t: 'textarea', req: true, full: true, ph: 'Contoh: Persyaratan pembuatan SKCK untuk melamar kerja' },
        { n: 'lampiran', l: 'Lampiran (KTP/KK, maks 3 berkas)', t: 'file', multi: true, full: true }
      ])}</form>`, kaki: `<button class="btn btn-outline" data-x>Batal</button><button class="btn btn-primary" id="sr-ok">${ikon('send')} Kirim ke Ketua RT</button>` });
      $('[data-x]', m.el).onclick = m.tutup;
      $('#sr-ok', m.el).onclick = async () => {
        const f = $('#sr-f', m.el); if (!validasiForm(f)) return;
        await sibuk($('#sr-ok', m.el), async () => { try { const d = await bacaForm(f); const r = await api('ajukanSurat', d); m.tutup(); toast(r.pesan); router(); } catch (e) { gagal(e); } });
      };
    };
  }
});
function perbaikiSurat(id, keperluan) {
  const m = modal({ judul: 'Kirim Perbaikan Surat', isi: `<form id="pf" class="stack">${formHTML([{ n: 'Keperluan', l: 'Keperluan', t: 'textarea', v: keperluan, full: true }, { n: 'lampiran', l: 'Tambah lampiran', t: 'file', multi: true, full: true }], '')}</form>`, kaki: `<button class="btn btn-primary" id="pf-ok">${ikon('send')} Kirim</button>` });
  $('#pf-ok', m.el).onclick = () => sibuk($('#pf-ok', m.el), async () => { try { const d = await bacaForm($('#pf', m.el)); const r = await api('perbaikiSurat', Object.assign({ id }, d)); m.tutup(); toast(r.pesan); router(); } catch (e) { gagal(e); } });
}

// ============================================================
// PENGADUAN SAYA
// ============================================================
daftarHalaman('pengaduan-saya', {
  judul: 'Pengaduan', ikon: 'message', menu: 'Pengaduan',
  render: async el => {
    const rows = await api('listPengaduan');
    el.innerHTML = kepala('Pengaduan Warga', 'Sampaikan keluhan atau masukan. Pantau status dan tanggapan pengurus di sini.', `<button class="btn btn-primary" id="ad-baru">${ikon('plus')} Pengaduan baru</button>`) +
      (rows.length ? rows.map(p => `<div class="card mb-2"><div class="row between"><div class="row gap-sm">${badge(p.status)}<span class="small muted">${esc(tglJam(p.tanggal))}</span></div>${p.fotoId ? `<button class="btn btn-ghost btn-sm" onclick="bukaBerkas('${p.fotoId}')">${ikon('image', 'sm')} Foto</button>` : ''}</div>
        <h3 class="mt-1" style="font-size:18px">${esc(p.judul)}</h3><p class="mb-0">${nl2br(p.isi)}</p>
        ${p.tanggapan ? `<div class="alert info mt-2">${ikon('message')}<div><b>Tanggapan ${esc(p.oleh)}:</b><br>${nl2br(p.tanggapan)}</div></div>` : ''}</div>`).join('') : `<div class="card">${kosong('Belum ada pengaduan.', 'message')}</div>`);
    $('#ad-baru').onclick = () => {
      const m = modal({ judul: 'Pengaduan Baru', ikonJudul: 'message', isi: `<form id="ad-f" class="stack">${formHTML([{ n: 'Judul', l: 'Judul', req: true, ph: 'Contoh: Lampu jalan K24 padam' }, { n: 'Isi', l: 'Uraian', t: 'textarea', req: true }, { n: 'file', l: 'Foto (opsional)', t: 'file', accept: 'image/*' }], '')}</form>`, kaki: `<button class="btn btn-primary" id="ad-ok">${ikon('send')} Kirim</button>` });
      $('#ad-ok', m.el).onclick = () => { const f = $('#ad-f', m.el); if (!validasiForm(f)) return; sibuk($('#ad-ok', m.el), async () => { try { const r = await api('kirimPengaduan', await bacaForm(f)); m.tutup(); toast(r.pesan); router(); } catch (e) { gagal(e); } }); };
    };
  }
});

// ============================================================
// DATA KELUARGA (perubahan via persetujuan Administrator)
// ============================================================
const OPSI_HUBUNGAN = ['Kepala Keluarga', 'Istri', 'Suami', 'Anak', 'Orang Tua', 'Saudara', 'Lainnya'];
function fieldsAnggota(a = {}) {
  return [
    { n: 'Nama', l: 'Nama lengkap', v: a.nama, req: true },
    { n: 'Hubungan', l: 'Hubungan keluarga', t: 'select', o: OPSI_HUBUNGAN, v: a.hubungan || 'Anak' },
    { n: 'Jenis_Kelamin', l: 'Jenis kelamin', t: 'select', o: [['', '-'], ['L', 'Laki-laki'], ['P', 'Perempuan']], v: a.jk },
    { n: 'Tgl_Lahir', l: 'Tanggal lahir', t: 'date', v: a.tglLahir },
    { n: 'No_HP', l: 'No. HP', t: 'tel', v: a.hp, ph: '08xxxxxxxxxx' },
    { n: 'No_WA', l: 'No. WhatsApp', t: 'tel', v: a.wa, ph: 'Kosongkan bila sama dengan HP' }
  ];
}
daftarHalaman('keluarga', {
  judul: 'Data Keluarga', ikon: 'users', menu: 'Data Keluarga',
  render: async el => {
    const [det, prb] = await Promise.all([api('detailRumah'), api('listPerubahan')]);
    const r = det.rumah;
    window._agg = det.anggota; window._rumahSaya = r;
    el.innerHTML = kepala('Data Keluarga', 'Perubahan data berlaku setelah disetujui Administrator. Riwayat pembayaran rumah tidak terpengaruh.', `<button class="btn btn-primary" id="kl-tambah">${ikon('plus')} Ajukan tambah anggota</button>`) + `
    <div class="split"><div class="card flush"><div class="card-h"><h3>${ikon('users')} Anggota keluarga</h3><span class="badge">${det.anggota.filter(a => a.aktif).length} aktif</span></div>
      <div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Nama</th><th>Hubungan</th><th>Tgl lahir</th><th>No. HP</th><th></th></tr></thead><tbody>
      ${det.anggota.filter(a => a.aktif).map((a, i) => `<tr><td data-l="Nama"><b>${esc(a.nama)}</b> <span class="sub">${a.jk || ''}</span></td><td data-l="Hubungan">${esc(a.hubungan)}</td><td data-l="Tgl lahir">${esc(tgl(a.tglLahir, true))}</td><td data-l="No. HP" class="mono">${esc(a.hp || '-')}</td>
        <td data-l=""><button class="btn btn-ghost btn-sm" onclick="ajukanUbahAnggota(${det.anggota.indexOf(a)})">${ikon('edit', 'sm')} Ubah</button><button class="btn btn-ghost btn-sm" onclick="ajukanNonaktif('${a.id}','${esc(a.nama)}')">${ikon('trash', 'sm')}</button></td></tr>`).join('') || `<tr><td colspan="5">${kosong('Belum ada data anggota keluarga.', 'users')}</td></tr>`}</tbody></table></div></div>
      <div class="stack"><div class="card"><div class="card-h"><h3>${ikon('home')} Rumah</h3></div><dl class="kv"><dt>Alamat</dt><dd>Blok ${esc(r.blok)} No. ${esc(r.no)}</dd><dt>Kepala keluarga</dt><dd>${esc(r.kepala || '-')}</dd>
          <dt>Status hunian</dt><dd>${badgeHunian(r.statusRumah)}</dd>${r.statusRumah === 'Dikontrak' ? `<dt>Pemilik rumah</dt><dd>${esc(r.pemilik || '— belum diisi —')}</dd>${r.waPemilik ? `<dt>WA pemilik</dt><dd class="mono">${esc(r.waPemilik)}</dd>` : ''}` : ''}
          <dt>WA penerima notifikasi</dt><dd class="mono">${esc(r.wa || '-')}</dd></dl>
        <div class="grid g-2 mt-2" style="gap:.5rem"><button class="btn btn-outline" id="kl-hunian">${ikon('key')} Ubah status hunian</button><button class="btn btn-outline" id="kl-wa">${ikon('wa')} Ganti nomor WA</button></div></div>
        <div class="card"><div class="card-h"><h3>${ikon('history')} Status pengajuan</h3></div>${prb.length ? prb.slice(0, 8).map(p => `<div class="list-item"><div class="grow"><div class="ttl">${esc({ tambah: 'Tambah anggota', ubah: 'Ubah data', nonaktif: 'Nonaktifkan', kontak: 'Ganti nomor WA', hunian: 'Ubah status hunian' }[p.jenis])}</div><div class="small muted">${esc(p.data.Nama || p.anggota || p.data.WA_Penerima || (p.data.Status_Rumah ? (LABEL_HUNIAN[p.data.Status_Rumah] || p.data.Status_Rumah) + (p.data.Pemilik_Rumah ? ' · ' + p.data.Pemilik_Rumah : '') : ''))} · ${esc(tgl(p.tanggal, true))}</div>${p.alasan ? `<div class="small err">${esc(p.alasan)}</div>` : ''}</div>${badge(p.status)}</div>`).join('') : kosong('Belum ada pengajuan.')}</div></div></div>`;
    $('#kl-tambah').onclick = () => formPerubahan('tambah', null, {});
    $('#kl-hunian').onclick = () => formHunian(r);
    $('#kl-wa').onclick = async () => { const v = await mintaTeks('Ganti Nomor WhatsApp', 'Nomor WA baru penerima notifikasi rumah', { placeholder: '08xxxxxxxxxx', ya: 'Ajukan' }); if (v) try { const r = await api('ajukanPerubahan', { jenis: 'kontak', data: { WA_Penerima: v } }); toast(r.pesan); router(); } catch (e) { gagal(e); } };
  }
});
function ajukanUbahAnggota(i) { const a = window._agg[i]; formPerubahan('ubah', a.id, a); }
async function ajukanNonaktif(id, nama) {
  const alasan = await mintaTeks('Nonaktifkan ' + nama, 'Alasan (misal: pindah domisili, meninggal dunia)', { ya: 'Ajukan' });
  if (alasan === null) return;
  try { const r = await api('ajukanPerubahan', { jenis: 'nonaktif', ID_Anggota: id, data: { alasan } }); toast(r.pesan); router(); } catch (e) { gagal(e); }
}
function fieldsHunian(r = {}) {
  return [
    { n: 'Status_Rumah', l: 'Status hunian keluarga', t: 'select', o: OPSI_HUNIAN.filter(o => o[0] !== 'Kosong'), v: r.statusRumah === 'Dikontrak' ? 'Dikontrak' : 'Dihuni', full: true },
    { n: 'Pemilik_Rumah', l: 'Nama pemilik rumah (bila kontrak)', v: r.pemilik },
    { n: 'WA_Pemilik', l: 'WA pemilik rumah (opsional)', t: 'tel', v: r.waPemilik, ph: '08xxxxxxxxxx' }
  ];
}
function aturHunian(f) {
  const atur = () => { const k = $('[name=Status_Rumah]', f).value === 'Dikontrak'; ['Pemilik_Rumah', 'WA_Pemilik'].forEach(n => $('[name=' + n + ']', f).closest('.field').classList.toggle('hidden', !k)); };
  $('[name=Status_Rumah]', f).onchange = atur; atur();
}
function formHunian(r) {
  const m = modal({ judul: 'Ajukan Ubah Status Hunian', ikonJudul: 'home', isi: `<p class="muted small">Pilih apakah keluarga Anda <b>pemilik rumah</b> atau <b>mengontrak/menyewa</b>. Perubahan berlaku setelah disetujui Administrator.</p><form id="hn-f">${formHTML(fieldsHunian(r))}</form>`, kaki: `<button class="btn btn-outline" data-x>Batal</button><button class="btn btn-primary" id="hn-ok">${ikon('send')} Ajukan</button>` });
  const f = $('#hn-f', m.el); aturHunian(f);
  $('[data-x]', m.el).onclick = m.tutup;
  $('#hn-ok', m.el).onclick = () => sibuk($('#hn-ok', m.el), async () => {
    try { const d = await bacaForm(f); if (d.Status_Rumah === 'Dikontrak' && !d.Pemilik_Rumah) throw new Error('Isi nama pemilik rumah.'); const x = await api('ajukanPerubahan', { jenis: 'hunian', data: d }); m.tutup(); toast(x.pesan); router(); } catch (e) { gagal(e); }
  });
}
function formPerubahan(jenis, idAnggota, a) {
  const rs = window._rumahSaya || {};
  const tambahan = jenis === 'tambah' ? `<h4 class="mt-3 mb-1">Status hunian keluarga</h4><div class="small muted mb-1">Saat ini: <b>${esc(LABEL_HUNIAN[rs.statusRumah] || '-')}</b>. Ubah bila tidak sesuai.</div>${formHTML(fieldsHunian(rs))}` : '';
  const m = modal({ judul: jenis === 'tambah' ? 'Ajukan Tambah Anggota' : 'Ajukan Ubah Data ' + a.nama, ikonJudul: 'users', isi: `<form id="pa-f">${formHTML(fieldsAnggota(a))}${tambahan}</form>`, kaki: `<button class="btn btn-outline" data-x>Batal</button><button class="btn btn-primary" id="pa-ok">${ikon('send')} Ajukan</button>` });
  const f = $('#pa-f', m.el);
  if (jenis === 'tambah') aturHunian(f);
  $('[data-x]', m.el).onclick = m.tutup;
  $('#pa-ok', m.el).onclick = () => { if (!validasiForm(f)) return; sibuk($('#pa-ok', m.el), async () => {
    try {
      const d = await bacaForm(f);
      const hunian = { Status_Rumah: d.Status_Rumah, Pemilik_Rumah: d.Pemilik_Rumah, WA_Pemilik: d.WA_Pemilik };
      delete d.Status_Rumah; delete d.Pemilik_Rumah; delete d.WA_Pemilik;
      const berubah = jenis === 'tambah' && hunian.Status_Rumah && (hunian.Status_Rumah !== (rs.statusRumah === 'Dikontrak' ? 'Dikontrak' : 'Dihuni') || (hunian.Status_Rumah === 'Dikontrak' && hunian.Pemilik_Rumah !== (rs.pemilik || '')));
      if (berubah && hunian.Status_Rumah === 'Dikontrak' && !hunian.Pemilik_Rumah) throw new Error('Isi nama pemilik rumah untuk rumah kontrak.');
      const r = await api('ajukanPerubahan', { jenis, ID_Anggota: idAnggota, data: d });
      if (berubah) await api('ajukanPerubahan', { jenis: 'hunian', data: hunian });
      m.tutup(); toast(r.pesan + (berubah ? ' Perubahan status hunian juga diajukan.' : '')); router();
    } catch (e) { gagal(e); }
  }); };
}
