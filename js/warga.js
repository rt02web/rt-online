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
// TAGIHAN & BAYAR — alur 3 langkah: pilih tagihan → transfer → kirim bukti
// ============================================================
daftarHalaman('tagihan-saya', {
  judul: 'Tagihan & Pembayaran', ikon: 'receipt', menu: 'Tagihan & Bayar', pendek: 'Tagihan',
  render: async el => {
    const [semua, rk, set] = await Promise.all([api('listTagihan'), api('ringkasanRumah'), api('getPengaturan')]);
    const rek = set.nilai.REKENING_RT;
    const terbuka = semua.filter(t => t.sisa > 0).sort((a, b) => String(a.periode).localeCompare(String(b.periode)));
    const perKas = {};
    terbuka.forEach(t => (perKas[t.kas] = perKas[t.kas] || []).push(t));
    const urutKas = Object.keys(perKas).sort((a, b) => (a === 'umum' ? -1 : b === 'umum' ? 1 : a.localeCompare(b)));
    let kasAktif = urutKas[0] || '';
    const pilih = new Set((perKas[kasAktif] || []).map(t => t.id)); // default: semua tagihan kas pertama terpilih
    const telat = terbuka.filter(t => selisihHari(t.jatuhTempo) < 0).length;

    el.innerHTML = kepala('Tagihan & Pembayaran', 'Bayar iuran dari HP dalam 3 langkah. Tagihan dianggap lunas setelah bukti dicek Bendahara.') + `
    <div class="bayar-hero"><div>
        <div class="lbl">Total belum dibayar</div><div class="big">${rp(rk.tunggakan)}</div>
        <div class="chips"><span class="chip">${terbuka.length} tagihan</span>${telat ? `<span class="chip merah">${telat} lewat jatuh tempo</span>` : ''}${rk.menungguVerifikasi ? `<span class="chip">${ikon('clock', 'sm')} ${rp(rk.menungguVerifikasi)} sedang dicek bendahara</span>` : ''}${rk.saldoMuka ? `<span class="chip">${ikon('wallet', 'sm')} Saldo di muka ${rp(rk.saldoMuka)}</span>` : ''}</div></div>
      ${terbuka.length ? `<a class="btn btn-accent" href="#tg-daftar" onclick="event.preventDefault();document.getElementById('tg-daftar').scrollIntoView({behavior:'smooth'})">${ikon('wallet')} Bayar sekarang</a>` : ''}</div>
    <div class="langkah"><div class="on"><b class="n">1</b><span>Pilih tagihan</span></div><div><b class="n">2</b><span>Transfer ke rekening RT</span></div><div><b class="n">3</b><span>Kirim foto bukti</span></div></div>
    <div id="tg-daftar">${terbuka.length ? urutKas.map(k => `<div class="card mb-2" data-kas="${k}"><div class="card-h"><div><h3>${ikon(k === 'umum' ? 'home' : k === 'pembangunan' ? 'hammer' : 'heart')} ${esc(LABEL_KAS[k])}</h3><div class="sub">${perKas[k].length} tagihan · ${rp(perKas[k].reduce((x, t) => x + t.sisa, 0))}</div></div><button class="btn btn-ghost btn-sm tg-semua" data-kas="${k}">Pilih semua</button></div>
        ${perKas[k].map(t => { const h = selisihHari(t.jatuhTempo); return `<label class="tg-item" data-id="${t.id}"><input type="checkbox" class="pt" data-id="${t.id}" data-kas="${t.kas}" data-sisa="${t.sisa}">
          <div class="grow"><div class="nm">${esc(t.label)}</div><div class="small muted">${t.jatuhTempo ? 'Jatuh tempo ' + esc(tgl(t.jatuhTempo, true)) : ''}${h !== null && h < 0 ? ' <span class="badge danger">Terlambat</span>' : h !== null && h <= 5 ? ' <span class="badge proses">Segera</span>' : ''}${t.status === 'Sebagian' ? ' · sudah dibayar ' + rp(t.terbayar) : ''}</div></div>
          <div class="amt">${rp(t.sisa)}</div></label>`; }).join('')}</div>`).join('')
        : `<div class="card"><div class="wiz-sukses"><div class="ok-ico">${ikon('check')}</div><h3>Semua tagihan sudah lunas</h3><p class="muted">Terima kasih sudah tertib membayar iuran.</p></div></div>`}</div>
    ${terbuka.length ? `<div class="bayar-bar"><div><div class="small muted" id="tg-n">Belum ada tagihan dipilih</div><div class="tot" id="tg-tot">Rp0</div></div>
      <div class="row"><button class="btn btn-outline hidden" id="tg-saldo">${ikon('wallet')} Pakai saldo di muka</button><button class="btn btn-primary" id="tg-bayar" disabled>Lanjut bayar ${ikon('right')}</button></div></div>` : ''}
    <div class="grid g-2 mt-3">
      <div class="card"><h3 style="font-size:16px" class="mb-1">${ikon('coins')} Bayar tunai?</h3><p class="small muted mb-0">Serahkan uang langsung ke Bendahara. Bendahara akan mencatatnya dan Anda menerima kuitansi digital.</p></div>
      <div class="card"><h3 style="font-size:16px" class="mb-1">${ikon('plus')} Setor di muka</h3><p class="small muted">Titip uang untuk tagihan bulan berikutnya. Otomatis dipakai saat tagihan terbit.</p><button class="btn btn-outline btn-sm" id="tg-muka">${ikon('upload', 'sm')} Setor di muka</button></div></div>
    <details class="card mt-3"><summary style="cursor:pointer;font-weight:600;color:var(--navy)">${ikon('history', 'sm')} Lihat semua tagihan (${semua.length})</summary><div class="table-wrap mt-2"><table class="tbl responsive"><thead><tr><th>Tagihan</th><th>Kas</th><th class="right">Nominal</th><th class="right">Terbayar</th><th>Status</th></tr></thead><tbody>
      ${semua.map(t => `<tr><td data-l="Tagihan">${esc(t.label)}</td><td data-l="Kas">${esc(t.kasLabel)}</td><td data-l="Nominal" class="money">${rp(t.nominal)}</td><td data-l="Terbayar" class="money">${rp(t.terbayar)}</td><td data-l="Status">${badge(t.status)}</td></tr>`).join('') || `<tr><td colspan="5">${kosong('Belum ada tagihan.')}</td></tr>`}</tbody></table></div></details>`;

    const upd = () => {
      $$('.pt', el).forEach(c => { c.checked = pilih.has(c.dataset.id); c.closest('.tg-item').classList.toggle('on', c.checked); });
      const sel = terbuka.filter(t => pilih.has(t.id));
      const tot = sel.reduce((x, t) => x + t.sisa, 0);
      if (!$('#tg-n')) return { tot };
      $('#tg-n').textContent = sel.length ? `${sel.length} tagihan dipilih · ${LABEL_KAS[kasAktif]}` : 'Belum ada tagihan dipilih';
      $('#tg-tot').textContent = rp(tot);
      $('#tg-bayar').disabled = !sel.length;
      const sm = sel.length ? ((rk.saldoMukaPerKas.find(x => x.kas === kasAktif) || {}).sisa || 0) : 0;
      $('#tg-saldo').classList.toggle('hidden', !sm);
      if (sm) $('#tg-saldo').innerHTML = `${ikon('wallet')} Pakai saldo di muka (${rp(sm)})`;
      return { tot };
    };
    $$('.pt', el).forEach(c => c.onchange = () => {
      if (c.dataset.kas !== kasAktif) {
        if (pilih.size) toast('Satu kali bayar hanya untuk satu kas. Pilihan ' + LABEL_KAS[kasAktif] + ' dibatalkan.', 'ok', 3500);
        pilih.clear(); kasAktif = c.dataset.kas;
      }
      c.checked ? pilih.add(c.dataset.id) : pilih.delete(c.dataset.id);
      upd();
    });
    $$('.tg-semua', el).forEach(b => b.onclick = () => {
      const k = b.dataset.kas;
      const semuaDipilih = k === kasAktif && perKas[k].every(t => pilih.has(t.id));
      pilih.clear(); kasAktif = k;
      if (!semuaDipilih) perKas[k].forEach(t => pilih.add(t.id));
      upd();
    });
    if ($('#tg-bayar')) $('#tg-bayar').onclick = () => { const s = upd(); wizardBayar([...pilih], s.tot, rek, kasAktif, terbuka.filter(t => pilih.has(t.id))); };
    $('#tg-muka').onclick = () => wizardBayar([], 0, rek, 'umum', []);
    if ($('#tg-saldo')) $('#tg-saldo').onclick = async () => {
      if (!await konfirmasi('Gunakan saldo di muka untuk melunasi tagihan yang dipilih?', { ya: 'Gunakan saldo' })) return;
      try { const r = await api('pakaiSaldoMuka', { tagihan: [...pilih] }); toast(r.pesan); router(); } catch (e) { gagal(e); }
    };
    upd();
  }
});

/** Wizard pembayaran transfer: 1) instruksi transfer + salin, 2) kirim bukti, 3) selesai */
function wizardBayar(ids, total, rek, kas, tagihan) {
  const m = modal({ judul: ids.length ? 'Bayar Tagihan' : 'Setor di Muka', ikonJudul: 'wallet', isi: '' });
  const salin = (teks, label) => navigator.clipboard.writeText(teks).then(() => toast(label + ' disalin')).catch(() => toast('Salin manual: ' + teks));
  const langkah = n => `<div class="langkah" style="margin-top:0">${['Pilih tagihan', 'Transfer', 'Kirim bukti'].map((l, i) => `<div class="${i < n ? 'on' : ''}"><b class="n">${i < n - 1 ? '✓' : i + 1}</b><span>${l}</span></div>`).join('')}</div>`;
  const step2 = () => {
    m.body.innerHTML = langkah(2) + `
      ${ids.length ? `<div class="small muted mb-1">Tagihan yang dibayar</div>${tagihan.map(t => `<div class="row between small" style="padding:4px 0"><span>${esc(t.label)}</span><b class="mono">${rp(t.sisa)}</b></div>`).join('')}<hr style="border:0;border-top:1px solid var(--border);margin:8px 0 14px">` : `<div class="alert info mb-2">${ikon('info')}<div>Setoran ini menjadi <b>saldo di muka</b> dan otomatis dipakai untuk tagihan berikutnya.</div></div>`}
      ${ids.length ? `<div class="small muted">Jumlah yang ditransfer</div><div class="salin-box"><span class="v">${rp(total)}</span><button class="btn btn-outline btn-sm" id="wz-c1">${ikon('copy', 'sm')} Salin</button></div>` : ''}
      <div class="small muted">Transfer ke rekening RT</div>
      ${rek ? `<div class="salin-box"><span class="v" style="font-size:16px">${esc(rek)}</span><button class="btn btn-outline btn-sm" id="wz-c2">${ikon('copy', 'sm')} Salin</button></div>` : `<div class="alert warn">${ikon('alert')}<div>Rekening RT belum diatur. Tanyakan ke Bendahara atau bayar tunai.</div></div>`}
      <ol class="small" style="padding-left:20px;margin:12px 0 0;line-height:1.7"><li>Buka m-banking / e-wallet / ATM.</li><li>Transfer ${ids.length ? '<b>' + rp(total) + '</b>' : 'sesuai jumlah yang ingin disetor'} ke rekening di atas.</li><li>Simpan bukti transfer (screenshot / foto struk).</li></ol>
      <div class="modal-f" style="margin:18px -20px -20px"><button class="btn btn-outline" id="wz-x">Nanti saja</button><button class="btn btn-primary" id="wz-next">Saya sudah transfer ${ikon('right')}</button></div>`;
    if ($('#wz-c1', m.el)) $('#wz-c1', m.el).onclick = () => salin(String(total), 'Jumlah');
    if ($('#wz-c2', m.el)) $('#wz-c2', m.el).onclick = () => salin((rek.match(/\d[\d\s.-]{5,}\d/) || [rek])[0].replace(/[\s.-]/g, ''), 'Nomor rekening');
    $('#wz-x', m.el).onclick = m.tutup;
    $('#wz-next', m.el).onclick = step3;
  };
  const step3 = () => {
    m.body.innerHTML = langkah(3) + `<form id="by-f" class="stack" novalidate>
      ${field({ n: 'file', l: 'Foto / screenshot bukti transfer', t: 'file', req: true, full: true, ph: 'Ketuk untuk memilih foto · JPG/PNG/PDF' })}
      ${formHTML([
        { n: 'nominal', l: 'Jumlah yang ditransfer (Rp)', t: 'number', v: total || '', req: true, hint: ids.length ? 'Kalau transfer lebih, sisanya jadi saldo di muka. Kalau kurang, tagihan tercatat dibayar sebagian.' : '' },
        { n: 'tanggal', l: 'Tanggal transfer', t: 'date', v: hariIni(), req: true },
        ...(ids.length ? [] : [{ n: 'kas', l: 'Untuk kas', t: 'select', o: [['umum', 'Kas Umum'], ['pembangunan', 'Kas Pembangunan'], ['sosial', 'Kas Sosial']], v: kas }]),
        { n: 'pembayar', l: 'Nama pengirim di bukti (opsional)', ph: 'Bila berbeda dengan nama Anda' },
        { n: 'catatan', l: 'Catatan (opsional)', t: 'textarea', full: true }
      ])}</form>
      <div class="modal-f" style="margin:18px -20px -20px"><button class="btn btn-outline" id="wz-back">${ikon('left')} Kembali</button><button class="btn btn-primary" id="wz-kirim">${ikon('send')} Kirim bukti</button></div>`;
    $('#wz-back', m.el).onclick = step2;
    $('#wz-kirim', m.el).onclick = async () => {
      const f = $('#by-f', m.el);
      if (!validasiForm(f)) return;
      await sibuk($('#wz-kirim', m.el), async () => {
        try {
          const d = await bacaForm(f);
          const r = await api('ajukanPembayaran', { tagihan: ids, nominal: Number(d.nominal), tanggal: d.tanggal, pembayar: d.pembayar, catatan: d.catatan, file: d.file, kas: d.kas });
          m.body.innerHTML = `<div class="wiz-sukses"><div class="ok-ico">${ikon('check')}</div><h3>Bukti terkirim!</h3><p class="muted">${esc(r.pesan)}<br>Anda akan menerima pemberitahuan WhatsApp setelah dicek. Status bisa dilihat di <b>Riwayat Pembayaran</b>.</p>
            <div class="row" style="justify-content:center"><a class="btn btn-outline" href="#/panel/riwayat-bayar" id="wz-rw">${ikon('history')} Riwayat pembayaran</a><button class="btn btn-primary" id="wz-ok">Selesai</button></div></div>`;
          $('#wz-ok', m.el).onclick = () => { m.tutup(); router(); };
          $('#wz-rw', m.el).onclick = () => m.tutup();
        } catch (e) { gagal(e); }
      });
    };
  };
  step2();
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
      <div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Nama</th><th>Hubungan</th><th>Umur</th><th>No. HP</th><th></th></tr></thead><tbody>
      ${det.anggota.filter(a => a.aktif).map((a, i) => `<tr><td data-l="Nama"><b>${esc(a.nama)}</b> <span class="sub">${a.jk || ''}</span>${a.terimaWA ? ` <span class="badge lunas">${ikon('wa', 'sm')} WA</span>` : ''}</td><td data-l="Hubungan">${esc(a.hubungan)}</td><td data-l="Umur"><b>${a.tglLahir ? esc(umurTeks(a.tglLahir)) : '—'}</b>${a.tglLahir ? `<div class="sub">${esc(tgl(a.tglLahir, true))}</div>` : ''}</td><td data-l="No. HP" class="mono">${esc(a.hp || '-')}</td>
        <td data-l=""><button class="btn btn-ghost btn-sm" onclick="ajukanUbahAnggota(${det.anggota.indexOf(a)})">${ikon('edit', 'sm')} Ubah</button><button class="btn btn-ghost btn-sm" onclick="ajukanNonaktif('${a.id}','${esc(a.nama)}')">${ikon('trash', 'sm')}</button></td></tr>`).join('') || `<tr><td colspan="5">${kosong('Belum ada data anggota keluarga.', 'users')}</td></tr>`}</tbody></table></div></div>
      <div class="stack"><div class="card"><div class="card-h"><h3>${ikon('home')} Rumah</h3></div><dl class="kv"><dt>Alamat</dt><dd>Blok ${esc(r.blok)} No. ${esc(r.no)}</dd><dt>Kepala keluarga</dt><dd>${esc(r.kepala || '-')}</dd>
          <dt>Status hunian</dt><dd>${badgeHunian(r.statusRumah)}</dd>${r.statusRumah === 'Dikontrak' ? `<dt>Pemilik rumah</dt><dd>${esc(r.pemilik || '— belum diisi —')}</dd>${r.waPemilik ? `<dt>WA pemilik</dt><dd class="mono">${esc(r.waPemilik)}</dd>` : ''}` : ''}
          <dt>Penerima notifikasi WA</dt><dd>${(det.penerimaWA || []).length ? det.penerimaWA.map(p => `<div>${esc(p.nama || '-')} · <span class="mono">${esc(p.nomor)}</span></div>`).join('') : '-'}</dd></dl>
        <p class="xs muted mt-1 mb-0">Ingin istri/anak juga menerima notifikasi? Hubungi Administrator RT.</p>
        <div class="grid g-2 mt-2" style="gap:.5rem"><button class="btn btn-outline" id="kl-hunian">${ikon('key')} Ubah status hunian</button><button class="btn btn-outline" id="kl-wa">${ikon('wa')} Ganti nomor WA utama</button></div></div>
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
