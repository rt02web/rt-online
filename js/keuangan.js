/**
 * keuangan.js — Penerbitan tagihan, verifikasi, catat tunai, transaksi kas,
 * serah terima, jimpitan, bantuan sosial, laporan, keringanan, riwayat WA.
 */
let _rumahCache = null;
async function daftarRumah(paksa) { if (!_rumahCache || paksa) _rumahCache = await api('listRumah'); return _rumahCache; }
function opsiRumah(rumah, kosongLabel = 'Pilih rumah…') { return [['', kosongLabel]].concat(rumah.map(r => [r.id, `Blok ${r.blok} No. ${r.no}${r.kepala ? ' — ' + r.kepala : ''}`])); }
const isBend = () => BENDAHARA.includes(Sesi.user.peran);

// ============================================================
// PENERBITAN TAGIHAN
// ============================================================
daftarHalaman('penerbitan', {
  judul: 'Penerbitan Tagihan', ikon: 'receipt', menu: 'Penerbitan Tagihan',
  render: async (el) => {
    const u = Sesi.user;
    const [iuran, tagihan] = await Promise.all([api('listIuranKhusus'), api('listTagihan', {})]);
    const iuranSaya = iuran.filter(i => i.kas === u.kas && i.status === 'Aktif');
    let fPer = '', fStatus = '';
    const periodeAda = [...new Set(tagihan.map(t => t.kategori === 'KTG-IPL' ? t.periode : t.label))];
    el.innerHTML = kepala('Penerbitan Tagihan', 'Terbitkan tagihan setelah memeriksa pratinjau. Tagihan ganda dicegah otomatis. Saldo di muka warga langsung dipakai.') + `
    <div class="grid ${u.peran === 'bend_umum' ? 'g-2' : 'g-3'}">
      ${u.peran === 'bend_umum' ? `<div class="card"><div class="card-h"><h3>${ikon('home')} Tagihan IPL bulanan</h3></div>
        <div class="row"><div class="field grow"><label for="ipl-per">Periode</label><input id="ipl-per" type="month" class="input" value="${periodeIni()}"></div>
        <button class="btn btn-primary" id="ipl-prv" style="align-self:flex-end">${ikon('eye')} Pratinjau</button></div>
        <p class="small muted mt-1 mb-0">Nominal mengikuti pengaturan yang berlaku pada periode tersebut, termasuk keringanan dari Ketua RT. Rumah berstatus Kosong tidak ditagih.</p></div>` : ''}
      <div class="card"><div class="card-h"><h3>${ikon('coins')} Iuran khusus ${esc(LABEL_KAS[u.kas])}</h3></div>
        ${iuranSaya.length ? iuranSaya.map(i => `<div class="list-item"><div class="grow"><div class="ttl">${esc(i.nama)}</div><div class="small muted">${rp(i.nominal)} · ${i.sasaran === 'SEMUA' ? 'semua rumah' : i.sasaran.split(',').length + ' rumah'} · terbit ${i.terbit}</div><div class="bar g mt-1"><span style="width:${i.target ? Math.min(100, i.terkumpul / i.target * 100) : 0}%"></span></div></div><button class="btn btn-outline btn-sm" onclick="pratinjauTerbit({jenis:'khusus',ID_Iuran:'${i.id}'})">${ikon('eye', 'sm')} Pratinjau</button></div>`).join('')
        : kosong('Belum ada iuran khusus aktif untuk kas Anda. Iuran khusus dibuat oleh Administrator.', 'coins')}</div>
    </div>
    <div class="card flush mt-3"><div class="card-h"><h3>${ikon('list')} Daftar tagihan ${esc(LABEL_KAS[u.kas])}</h3>
      <div class="row"><select class="input" id="f-per" style="min-height:40px;width:auto"><option value="">Semua periode/iuran</option>${periodeAda.map(p => `<option value="${esc(p)}">${esc(/^\d{4}-\d{2}$/.test(p) ? 'IPL ' + periodeLabel(p) : p)}</option>`).join('')}</select>
      <select class="input" id="f-st" style="min-height:40px;width:auto"><option value="">Semua status</option><option>Belum Bayar</option><option>Sebagian</option><option>Lunas</option></select>
      <button class="btn btn-outline btn-sm" id="tg-xls">${ikon('download', 'sm')} Excel</button></div></div><div id="tg-tbl"></div></div>`;
    const gambar = () => {
      const rows = tagihan.filter(t => (!fPer || t.periode === fPer || t.label === fPer) && (!fStatus || t.status === fStatus));
      const tot = rows.reduce((a, t) => ({ n: a.n + t.nominal, b: a.b + t.terbayar }), { n: 0, b: 0 });
      $('#tg-tbl').innerHTML = rows.length ? `<div style="padding:0 20px 12px" class="small muted">${rows.length} tagihan · target ${rp(tot.n)} · terbayar ${rp(tot.b)} · sisa ${rp(tot.n - tot.b)}</div><div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Rumah</th><th>Tagihan</th><th class="right">Nominal</th><th class="right">Terbayar</th><th>Status</th><th></th></tr></thead><tbody>
        ${rows.slice(0, 400).map(t => `<tr><td data-l="Rumah"><b>${esc(t.rumahLabel)}</b><div class="sub">${esc(t.kepala || '-')}</div></td><td data-l="Tagihan">${esc(t.label)}<div class="sub">Jatuh tempo ${esc(tgl(t.jatuhTempo, true))}</div></td><td data-l="Nominal" class="money">${rp(t.nominal)}</td><td data-l="Terbayar" class="money">${rp(t.terbayar)}</td><td data-l="Status">${badge(t.status)}</td>
          <td data-l="">${t.terbayar === 0 ? `<button class="btn btn-ghost btn-sm" onclick="batalTagihan('${t.id}')" title="Batalkan">${ikon('xcircle', 'sm')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : kosong('Belum ada tagihan.', 'receipt');
    };
    $('#f-per').onchange = e => { fPer = e.target.value; gambar(); };
    $('#f-st').onchange = e => { fStatus = e.target.value; gambar(); };
    $('#tg-xls').onclick = () => eksporExcel(tagihan.filter(t => (!fPer || t.periode === fPer || t.label === fPer) && (!fStatus || t.status === fStatus)).map(t => ({ Rumah: t.rumahLabel, 'Kepala Keluarga': t.kepala, Tagihan: t.label, Nominal: t.nominal, Terbayar: t.terbayar, Sisa: t.sisa, Status: t.status, 'Jatuh Tempo': t.jatuhTempo })), 'Tagihan_' + (fPer || 'semua') + '.xlsx', 'Tagihan');
    if ($('#ipl-prv')) $('#ipl-prv').onclick = () => pratinjauTerbit({ jenis: 'ipl', periode: $('#ipl-per').value });
    gambar();
  }
});

async function pratinjauTerbit(param) {
  const t = toastLoading('Menyiapkan pratinjau…');
  let p;
  try { p = await api('pratinjauTagihan', param); } catch (e) { t(); return gagal(e); }
  t();
  const m = modal({ judul: 'Pratinjau: ' + p.keterangan, ikonJudul: 'eye', besar: true, isi: `
    <div class="grid g-4 mb-2">${kpiCard('home', 'Rumah ditagih', p.jumlah, '')}${kpiCard('wallet', 'Total', rp(p.total), esc(p.kas), 'g')}${kpiCard('check', 'Sudah ada', p.dilewati, 'dilewati (cegah ganda)')}${kpiCard('wa', 'Tanpa nomor WA', p.tanpaWA, 'tidak menerima WA', p.tanpaWA ? 'y' : '')}</div>
    ${p.dibebaskan ? `<div class="alert info mb-2">${ikon('info')}<div>${p.dibebaskan} rumah dibebaskan (keringanan Rp0).</div></div>` : ''}
    ${p.jumlah ? `<div class="table-wrap" style="max-height:260px;overflow:auto"><table class="tbl"><thead><tr><th>Rumah</th><th>Kepala keluarga</th><th>WA</th><th class="right">Nominal</th></tr></thead><tbody>${p.daftar.map(d => `<tr><td>${esc(d.label)}</td><td>${esc(d.kepala || '-')}</td><td class="mono">${esc(d.wa || '—')}</td><td class="money">${rp(d.nominal)}</td></tr>`).join('')}</tbody></table></div>
    <h4 class="mt-3 mb-1">Contoh pesan WhatsApp</h4><div class="wa-preview"><div class="wa-bubble">${esc(p.contohPesan)}</div></div>
    <label class="check mt-2"><input type="checkbox" id="pt-wa" checked> <span>Kirim notifikasi WhatsApp ke ${p.jumlah - p.tanpaWA} pemilik tagihan (antre bertahap, bukan ke grup)</span></label>` : `<div class="alert ok">${ikon('check')}<div>Semua rumah sasaran sudah memiliki tagihan ini.</div></div>`}`,
    kaki: `<button class="btn btn-outline" data-x>Batal</button>${p.jumlah ? `<button class="btn btn-accent" id="pt-ok">${ikon('check')} Konfirmasi & terbitkan ${p.jumlah} tagihan</button>` : ''}` });
  $('[data-x]', m.el).onclick = m.tutup;
  if ($('#pt-ok', m.el)) $('#pt-ok', m.el).onclick = () => sibuk($('#pt-ok', m.el), async () => {
    try { const r = await api('terbitkanTagihan', Object.assign({}, param, { jumlahDikonfirmasi: p.jumlah, kirimWA: $('#pt-wa', m.el).checked })); m.tutup(); toast(r.pesan + (r.terpakaiSaldo ? ' Saldo di muka terpakai ' + rp(r.terpakaiSaldo) + '.' : '')); router(); } catch (e) { gagal(e); }
  });
}
async function batalTagihan(id) {
  const a = await mintaTeks('Batalkan Tagihan', 'Alasan pembatalan', { ya: 'Batalkan tagihan', bahaya: true });
  if (a) try { const r = await api('batalkanTagihan', { id, alasan: a }); toast(r.pesan); router(); } catch (e) { gagal(e); }
}

// ============================================================
// VERIFIKASI PEMBAYARAN
// ============================================================
daftarHalaman('verifikasi', {
  judul: 'Verifikasi Pembayaran', ikon: 'check', menu: 'Verifikasi Bayar', pendek: 'Verifikasi',
  render: async (el, param) => {
    let tab = param === 'riwayat' ? 'riwayat' : 'antre';
    const rows = await api('listPembayaran', tab === 'antre' ? { status: 'Menunggu' } : { batas: 150 });
    let i = 0;
    const kepalaV = kepala('Verifikasi Pembayaran', 'Periksa bukti transfer warga ke ' + esc(LABEL_KAS[Sesi.user.kas]) + '. Pembayaran yang belum diverifikasi tidak mengurangi tunggakan.',
      `<div class="seg"><button class="${tab === 'antre' ? 'on' : ''}" onclick="location.hash='#/panel/verifikasi'">Antrean</button><button class="${tab === 'riwayat' ? 'on' : ''}" onclick="location.hash='#/panel/verifikasi/riwayat'">Riwayat</button></div>`);
    if (tab === 'riwayat') {
      window._byr = rows;
      el.innerHTML = kepalaV + `<div class="card flush"><div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Tanggal</th><th>Rumah</th><th>Metode</th><th class="right">Nominal</th><th>Status</th><th></th></tr></thead><tbody>
        ${rows.map((p, j) => `<tr><td data-l="Tanggal">${esc(tglJam(p.tanggal))}<div class="sub mono">${esc(p.id)}</div></td><td data-l="Rumah"><b>${esc(p.rumahLabel)}</b><div class="sub">${esc(p.kepala || p.pembayar)}</div></td><td data-l="Metode">${esc(p.metode)}</td><td data-l="Nominal" class="money">${rp(p.nominal)}</td><td data-l="Status">${badge(p.status)}${p.alasanTolak ? `<div class="sub err">${esc(p.alasanTolak)}</div>` : ''}</td>
          <td data-l="">${p.status === 'Terverifikasi' ? `<button class="btn btn-ghost btn-sm" onclick="tampilKuitansi(Object.assign({namaRT:Identitas.data.namaRT,alamatRT:Identitas.data.alamat},_byr[${j}]))">${ikon('receipt', 'sm')}</button>` : ''}${p.buktiId ? `<button class="btn btn-ghost btn-sm" onclick="bukaBerkas('${p.buktiId}')">${ikon('eye', 'sm')}</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="6">${kosong('Belum ada riwayat.')}</td></tr>`}</tbody></table></div></div>`;
      return;
    }
    if (!rows.length) { el.innerHTML = kepalaV + `<div class="card">${kosong('Tidak ada bukti transfer yang menunggu verifikasi. Semua beres!', 'check')}</div>`; return; }
    const gambar = () => {
      const p = rows[i];
      const totTag = p.tagihan.reduce((s, t) => s + t.sisa, 0);
      const cocok = p.nominal === totTag, lebih = p.nominal - totTag;
      el.innerHTML = kepalaV + `<div class="row between mb-2"><span class="badge diajukan">Antrean ${i + 1} dari ${rows.length}</span><div class="row"><button class="btn btn-outline btn-sm" id="v-prev" ${i === 0 ? 'disabled' : ''}>${ikon('left', 'sm')} Sebelumnya</button><button class="btn btn-primary btn-sm" id="v-next" ${i >= rows.length - 1 ? 'disabled' : ''}>Berikutnya ${ikon('right', 'sm')}</button></div></div>
      <div class="split"><div class="stack">
        <div class="card"><div class="card-h"><h3>${ikon('image')} Bukti transfer</h3><button class="btn btn-ghost btn-sm" onclick="bukaBerkas('${p.buktiId}')">${ikon('external', 'sm')} Perbesar</button></div><div id="v-img" style="background:#1A1A2E;border-radius:10px;min-height:280px;display:grid;place-items:center;color:#94A3B8">${loader('Memuat bukti…')}</div></div>
        <div class="card"><div class="card-h"><h3>${ikon('file')} Data pengiriman</h3><span class="mono muted">${esc(p.id)}</span></div><dl class="kv">
          <dt>Rumah</dt><dd>${esc(p.rumahLabel)} — ${esc(p.kepala || '-')}</dd><dt>Nama pengirim</dt><dd>${esc(p.pembayar || '-')}</dd><dt>Tanggal transfer</dt><dd>${esc(tglJam(p.tanggal))}</dd>
          <dt>Nominal</dt><dd class="mono" style="font-size:20px">${rp(p.nominal)} ${p.tagihan.length ? (cocok ? '<span class="badge lunas">Cocok tagihan</span>' : lebih > 0 ? '<span class="badge info">Lebih ' + rp(lebih) + '</span>' : '<span class="badge proses">Kurang ' + rp(-lebih) + '</span>') : '<span class="badge info">Setor di muka</span>'}</dd></dl>
          ${p.catatan ? `<div class="alert info mt-2">${ikon('message')}<div><b>Catatan warga:</b> “${esc(p.catatan)}”</div></div>` : ''}</div></div>
        <div class="card" style="align-self:start"><div class="card-h"><h3>Alokasi & pelunasan</h3>${badge('Menunggu')}</div>
          <p class="small muted">Tagihan pilihan warga (= persetujuan alokasi). Dana dialokasikan ke periode tertua terlebih dahulu.</p>
          ${p.tagihan.map(t => `<div class="list-item"><span style="color:var(--green-deep)">${ikon('check')}</span><div class="grow"><div class="ttl">${esc(t.label)}</div><div class="small muted">Sisa ${rp(t.sisa)}</div></div></div>`).join('') || '<p>Tidak ada tagihan dipilih.</p>'}
          <dl class="kv mt-2"><dt>Dana ditransfer</dt><dd class="mono right">${rp(p.nominal)}</dd><dt>Untuk tagihan</dt><dd class="mono right">−${rp(Math.min(p.nominal, totTag))}</dd><dt><b>Jadi saldo di muka</b></dt><dd class="mono right"><b>${rp(Math.max(0, lebih))}</b></dd></dl>
          <div class="alert info mt-2">${ikon('bank')}<div>Masuk ke <b>${esc(p.kasLabel)}</b></div></div>
          <button class="btn btn-primary btn-block mt-2" id="v-ok">${ikon('check')} Setujui & terbitkan kuitansi</button>
          <button class="btn btn-danger btn-block mt-1" id="v-no">${ikon('xcircle')} Tolak pembayaran</button>
          <p class="xs muted mt-1 mb-0">Warga menerima notifikasi WhatsApp hasil verifikasi.</p></div></div>`;
      $('#v-prev').onclick = () => { i--; gambar(); };
      $('#v-next').onclick = () => { i++; gambar(); };
      api('unduhFile', { id: p.buktiId }).then(f => {
        const box = $('#v-img'); if (!box) return;
        if (/^image\//.test(f.mime)) box.innerHTML = `<img src="data:${f.mime};base64,${f.base64}" alt="Bukti transfer" style="max-height:520px;width:auto;margin:0 auto;border-radius:6px">`;
        else box.innerHTML = `<button class="btn btn-accent" onclick="bukaBerkas('${p.buktiId}')">${ikon('file')} Buka PDF bukti</button>`;
      }).catch(e => { const b = $('#v-img'); if (b) b.innerHTML = esc(e.message); });
      $('#v-ok').onclick = () => sibuk($('#v-ok'), async () => {
        try { const r = await api('verifikasiBayar', { id: p.id, setuju: true }); toast(r.pesan); tampilKuitansi(r.kuitansi); rows.splice(i, 1); if (i >= rows.length) i = rows.length - 1; perbaruiHitung(); rows.length ? gambar() : router(); } catch (e) { gagal(e); }
      });
      $('#v-no').onclick = async () => {
        const a = await mintaTeks('Tolak Pembayaran', 'Alasan penolakan (dikirim ke warga)', { placeholder: 'Contoh: nominal pada bukti tidak sesuai', ya: 'Tolak', bahaya: true });
        if (!a) return;
        try { const r = await api('verifikasiBayar', { id: p.id, setuju: false, alasan: a }); toast(r.pesan); rows.splice(i, 1); if (i >= rows.length) i = rows.length - 1; perbaruiHitung(); rows.length ? gambar() : router(); } catch (e) { gagal(e); }
      };
    };
    gambar();
  }
});

// ============================================================
// CATAT BAYAR TUNAI
// ============================================================
daftarHalaman('catat-tunai', {
  judul: 'Catat Bayar Tunai', ikon: 'wallet', menu: 'Catat Bayar Tunai', pendek: 'Tunai',
  render: async el => {
    const rumah = await daftarRumah(true);
    el.innerHTML = kepala('Catat Pembayaran Tunai', 'Untuk uang tunai yang Anda terima langsung. Tercatat terverifikasi dan sistem membuat kuitansi digital.') + `
    <div class="split"><div class="card"><form id="ct-f" class="stack" novalidate>
      ${field({ n: 'ID_Rumah', l: 'Rumah', t: 'select', req: true, o: opsiRumah(rumah) })}
      <div id="ct-tag"><p class="muted small">Pilih rumah untuk melihat tagihan ${esc(LABEL_KAS[Sesi.user.kas])}.</p></div>
      ${formHTML([{ n: 'nominal', l: 'Nominal diterima (Rp)', t: 'number', req: true }, { n: 'pembayar', l: 'Nama penyetor', ph: 'Nama yang menyerahkan uang' }, { n: 'catatan', l: 'Catatan', t: 'textarea', full: true }])}
      <label class="check"><input type="checkbox" id="ct-setuju" required> <span>Warga hadir dan menyetujui alokasi ke tagihan yang dipilih. Kelebihan menjadi saldo di muka.</span></label>
      <button class="btn btn-primary" type="submit">${ikon('check')} Simpan & buat kuitansi</button></form></div>
      <div class="card" style="align-self:start"><h3 style="font-size:17px" class="mb-1">${ikon('info')} Ketentuan</h3><ul class="small muted" style="padding-left:18px;margin:0">
        <li>Uang langsung tercatat sebagai pemasukan ${esc(LABEL_KAS[Sesi.user.kas])}.</li><li>Pembayaran sebagian membuat tagihan berstatus <b>Sebagian</b>.</li><li>Kelebihan menjadi saldo di muka dan otomatis dipakai untuk tagihan berikutnya.</li><li>Warga menerima notifikasi WhatsApp pembayaran diterima.</li></ul></div></div>`;
    const sel = $('[name=ID_Rumah]', el);
    sel.onchange = async () => {
      const box = $('#ct-tag'); if (!sel.value) return;
      box.innerHTML = loader('Memuat tagihan…');
      try {
        const tg = (await api('listTagihan', { rumah: sel.value })).filter(t => t.sisa > 0);
        box.innerHTML = tg.length ? `<div class="lbl-f mb-1">Tagihan terbuka</div>${tg.map(t => `<label class="check list-item"><input type="checkbox" class="ct-t" value="${t.id}" data-sisa="${t.sisa}" checked> <span class="grow">${esc(t.label)}</span><b class="mono">${rp(t.sisa)}</b></label>`).join('')}` : `<div class="alert info">${ikon('info')}<div>Tidak ada tagihan terbuka. Setoran akan menjadi saldo di muka.</div></div>`;
        const hit = () => { $('[name=nominal]', el).value = $$('.ct-t:checked', el).reduce((s, c) => s + Number(c.dataset.sisa), 0) || ''; };
        $$('.ct-t', el).forEach(c => c.onchange = hit); hit();
      } catch (e) { box.innerHTML = esc(e.message); }
    };
    $('#ct-f').onsubmit = async e => {
      e.preventDefault(); if (!validasiForm(e.target)) return;
      const d = await bacaForm(e.target);
      await sibuk($('button[type=submit]', e.target), async () => {
        try { const r = await api('catatTunai', { ID_Rumah: d.ID_Rumah, nominal: Number(d.nominal), pembayar: d.pembayar, catatan: d.catatan, tagihan: $$('.ct-t:checked', el).map(c => c.value) }); toast(r.pesan); tampilKuitansi(r.kuitansi); router(); } catch (ex) { gagal(ex); }
      });
    };
  }
});

// ============================================================
// TUNGGAKAN LAMA (sebelum aplikasi dipakai) — Bendahara Kas Umum & Kas Pembangunan
// ============================================================
daftarHalaman('tunggakan-lama', {
  judul: 'Tunggakan Lama', ikon: 'history', menu: 'Input Tunggakan Lama',
  render: async el => {
    const u = Sesi.user;
    const [rumah, tagihan, set] = await Promise.all([daftarRumah(true), api('listTagihan', { kategori: 'KTG-TUNGGAKAN' }), api('getPengaturan')]);
    const defNom = u.kas === 'umum' ? Number(set.nilai.IPL_NOMINAL) || '' : '';
    const defKet = u.kas === 'umum' ? 'IPL' : 'Iuran Pembangunan';
    const lalu = tambahBulan(periodeIni(), -1);
    el.innerHTML = kepala('Input Tunggakan Lama', 'Catat tunggakan warga dari <b>sebelum aplikasi dipakai</b>. Tunggakan muncul di tagihan warga dan bisa dibayar seperti tagihan biasa.') + `
    <div class="split"><div class="card"><form id="tl-f" class="stack" novalidate>
      ${field({ n: 'ID_Rumah', l: 'Rumah', t: 'select', req: true, o: opsiRumah(rumah) })}
      <div class="form-grid two">
        ${field({ n: 'bulan', l: 'Berapa bulan menunggak?', t: 'number', req: true, v: 1, attr: 'min="1" max="60"' })}
        ${field({ n: 'sampaiPeriode', l: 'Bulan terakhir yang belum dibayar', t: 'month', req: true, v: lalu, attr: 'max="' + periodeIni() + '"' })}
      </div>
      <div class="field"><label>Cara mengisi jumlah</label><div class="seg" id="tl-mode"><button type="button" class="on" data-m="perBulan">Nominal per bulan</button><button type="button" data-m="total">Total tunggakan</button></div></div>
      ${field({ n: 'nominal', l: 'Nominal per bulan (Rp)', t: 'number', req: true, v: defNom })}
      ${field({ n: 'keterangan', l: 'Jenis iuran', v: defKet, hint: 'Tampil di tagihan warga, misal "IPL" atau "Iuran Pembangunan".' })}
      <label class="check"><input type="checkbox" name="satuTagihan"> <span>Gabung jadi <b>satu tagihan</b> (tidak dirinci per bulan)</span></label>
      <div id="tl-prev"></div>
      <button class="btn btn-primary" type="submit">${ikon('check')} Simpan tunggakan</button></form></div>
      <div class="card" style="align-self:start"><h3 style="font-size:17px" class="mb-1">${ikon('info')} Cara kerja</h3><ul class="small muted" style="padding-left:18px;margin:0">
        <li>Tunggakan dibuat sebagai tagihan ${esc(LABEL_KAS[u.kas])} per bulan (atau satu tagihan bila digabung).</li>
        <li>Bila Anda mengisi <b>total</b>, nominal dibagi rata ke setiap bulan.</li>
        <li>Bulan yang sudah punya tagihan/tunggakan otomatis ditolak agar tidak dobel.</li>
        <li>Saldo di muka warga di kas ini langsung dipakai untuk melunasi.</li>
        <li>Salah input? Batalkan tagihannya di tabel di bawah (selama belum dibayar).</li></ul></div></div>
    <div class="card flush mt-3"><div class="card-h"><h3>${ikon('list')} Tunggakan lama tercatat</h3><span class="small muted">${tagihan.length} tagihan · sisa ${rp(tagihan.reduce((x, t) => x + t.sisa, 0))}</span></div>
      ${tagihan.length ? `<div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Rumah</th><th>Tunggakan</th><th class="right">Nominal</th><th class="right">Sisa</th><th>Status</th><th></th></tr></thead><tbody>
      ${tagihan.map(t => `<tr><td data-l="Rumah"><b>${esc(t.rumahLabel)}</b><div class="sub">${esc(t.kepala || '-')}</div></td><td data-l="Tunggakan">${esc(t.label)}</td><td data-l="Nominal" class="money">${rp(t.nominal)}</td><td data-l="Sisa" class="money">${rp(t.sisa)}</td><td data-l="Status">${badge(t.status)}</td><td data-l="">${t.terbayar === 0 ? `<button class="btn btn-ghost btn-sm" onclick="batalTagihan('${t.id}')" title="Batalkan">${ikon('xcircle', 'sm')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : kosong('Belum ada tunggakan lama yang dicatat.', 'history')}</div>`;
    const f = $('#tl-f');
    let mode = 'perBulan';
    const prev = () => {
      const n = Math.max(0, Math.round(Number($('[name=bulan]', f).value) || 0));
      const nom = Math.round(Number($('[name=nominal]', f).value) || 0);
      const akhir = $('[name=sampaiPeriode]', f).value;
      const satu = $('[name=satuTagihan]', f).checked;
      if (!n || !nom || !akhir) { $('#tl-prev').innerHTML = ''; return; }
      const total = mode === 'total' ? nom : nom * n;
      const awal = tambahBulan(akhir, -(n - 1));
      const per = Math.floor(total / n);
      $('#tl-prev').innerHTML = `<div class="alert ok">${ikon('receipt')}<div><b>${satu ? '1 tagihan' : n + ' tagihan'}</b> · total <b class="mono">${rp(total)}</b><br><span class="small">${esc(periodeLabel(awal))}${n > 1 ? ' – ' + esc(periodeLabel(akhir)) : ''}${!satu && n > 1 ? ' · ' + rp(per) + ' per bulan' + (total - per * n ? ' (bulan terakhir ' + rp(per + total - per * n) + ')' : '') : ''}</span></div></div>`;
    };
    $$('#tl-mode button').forEach(b => b.onclick = () => {
      mode = b.dataset.m; $$('#tl-mode button').forEach(x => x.classList.toggle('on', x === b));
      $('[name=nominal]', f).closest('.field').querySelector('label').innerHTML = (mode === 'total' ? 'Total tunggakan (Rp)' : 'Nominal per bulan (Rp)') + ' <span style="color:var(--danger)">*</span>';
      prev();
    });
    $$('input', f).forEach(i => { i.addEventListener('input', prev); i.addEventListener('change', prev); });
    prev();
    f.onsubmit = async e => {
      e.preventDefault(); if (!validasiForm(f)) return;
      const d = await bacaForm(f);
      const lbl = (rumah.find(x => x.id === d.ID_Rumah) || {});
      if (!await konfirmasi(`Catat tunggakan ${esc(d.keterangan || defKet)} untuk Blok ${esc(lbl.blok)} No. ${esc(lbl.no)}?<br>${esc($('#tl-prev').textContent)}`, { ya: 'Ya, simpan' })) return;
      await sibuk($('button[type=submit]', f), async () => {
        try { const r = await api('catatTunggakanLama', { ID_Rumah: d.ID_Rumah, bulan: Number(d.bulan), sampaiPeriode: d.sampaiPeriode, nominal: Number(d.nominal), mode, keterangan: d.keterangan, satuTagihan: d.satuTagihan }); toast(r.pesan); router(); } catch (ex) { gagal(ex); }
      });
    };
  }
});

// ============================================================
// TRANSAKSI / BUKU KAS
// ============================================================
daftarHalaman('transaksi', {
  judul: 'Buku Kas', ikon: 'bank', menu: 'Buku Kas & Transaksi', pendek: 'Kas',
  render: async el => {
    const u = Sesi.user, bend = isBend();
    let kas = bend ? u.kas : '';
    const muat = async () => {
      const [ring, trx] = await Promise.all([api('ringkasanKas'), api('listTransaksi', { kas, batas: 300 })]);
      const r = kas ? ring.find(x => x.kas === kas) : null;
      el.innerHTML = kepala(bend ? LABEL_KAS[u.kas] : 'Buku Kas', bend ? 'Catat pemasukan lain, pengeluaran, dan serah terima kas. Koreksi dilakukan dengan pembatalan (tercatat di log).' : 'Pengawasan seluruh transaksi empat kas (baca saja).',
        bend ? `<button class="btn btn-outline" id="tx-sa">${ikon('database')} Saldo awal kas</button><button class="btn btn-outline" id="tx-in">${ikon('plus')} Pemasukan</button><button class="btn btn-primary" id="tx-out">${ikon('wallet')} Pengeluaran</button>${u.peran === 'bend_umum' ? `<button class="btn btn-accent" id="tx-st">${ikon('swap')} Serah terima</button>` : ''}` : '') + `
      ${!bend ? `<div class="tabs mb-2"><button class="tab ${!kas ? 'on' : ''}" data-k="">Semua kas</button>${Object.keys(LABEL_KAS).map(k => `<button class="tab ${kas === k ? 'on' : ''}" data-k="${k}">${LABEL_KAS[k]}</button>`).join('')}</div>` : ''}
      ${bend && r && !r.saldoAwal ? `<div class="alert warn mb-2">${ikon('alert')}<div><b>Saldo awal kas belum diisi.</b> Bila ${esc(LABEL_KAS[u.kas])} sudah memiliki uang sebelum aplikasi dipakai, isi lewat tombol <b>Saldo awal kas</b> agar saldo di aplikasi sama dengan uang sebenarnya.</div></div>` : ''}
      <div class="grid g-4 mb-2">${(kas ? [r] : ring).map(k => kpiCard('bank', k.label, `<span class="mono" style="font-size:22px">${rp(k.saldo)}</span>`, `Bulan ini +${rp(k.masukBulanIni)} / −${rp(k.keluarBulanIni)}${k.saldoAwal ? '<br>Saldo awal ' + rp(k.saldoAwal.nominal) + ' per ' + tgl(k.saldoAwal.tanggal, true) : ''}${k.titipan ? '<br>Titipan masuk: ' + rp(k.titipan) : ''}${k.dalamProses ? '<br>Usulan keluar: ' + rp(k.dalamProses) : ''}`)).join('')}</div>
      <div class="card flush"><div class="card-h"><h3>${ikon('receipt')} Mutasi</h3><button class="btn btn-outline btn-sm" id="tx-xls">${ikon('download', 'sm')} Excel</button></div>${tabelTrx(trx, {
        kas: !kas, aksi: t => bend && t.status !== 'dibatalkan' && t.jenis !== 'saldo_awal' && ((t.kas === u.kas && t.jenis !== 'serah_terima' && t.jenis !== 'alokasi' && !String(t.ref).startsWith('BYR')) || ((t.jenis === 'serah_terima' || t.jenis === 'alokasi') && t.status === 'diusulkan')) ?
          ((t.jenis === 'serah_terima' || t.jenis === 'alokasi') && t.tujuan === u.kas ? `<button class="btn btn-accent btn-sm" onclick="konfSerah('${t.id}',true,this)">Terima</button>` : `<button class="btn btn-ghost btn-sm" title="Batalkan / koreksi" onclick="batalTrx('${t.id}')">${ikon('xcircle', 'sm')}</button>`) : (t.buktiId ? `<button class="btn btn-ghost btn-sm" onclick="bukaBerkas('${t.buktiId}')">${ikon('eye', 'sm')}</button>` : '')
      })}</div>`;
      $$('[data-k]', el).forEach(b => b.onclick = () => { kas = b.dataset.k; el.innerHTML = loader(); muat(); });
      $('#tx-xls').onclick = () => eksporExcel(trx.map(t => ({ Tanggal: t.tanggal, ID: t.id, Kas: t.kasLabel, Jenis: t.jenis, Kategori: t.kategori, Uraian: t.uraian, Nominal: t.nominal, Status: t.status, Pencatat: t.dicatatOleh })), 'Buku_Kas_' + (kas || 'semua') + '_' + hariIni() + '.xlsx', 'Mutasi');
      if ($('#tx-sa')) $('#tx-sa').onclick = () => formSaldoAwal(r);
      if ($('#tx-in')) $('#tx-in').onclick = () => formTrx('masuk');
      if ($('#tx-out')) $('#tx-out').onclick = () => formTrx('keluar');
      if ($('#tx-st')) $('#tx-st').onclick = formSerahTerima;
    };
    await muat();
  }
});
function formTrx(jenis) {
  const kat = jenis === 'masuk' ? ['Sumbangan langsung', 'Donasi', 'Hibah', 'Lainnya'] : ['Operasional', 'Kebersihan', 'Keamanan', 'Perbaikan fasilitas', 'Kegiatan RT', 'Lainnya'];
  const m = modal({ judul: jenis === 'masuk' ? 'Catat Pemasukan' : 'Catat Pengeluaran', ikonJudul: 'wallet', isi: `<form id="tx-f">${formHTML([
    { n: 'Tanggal', l: 'Tanggal', t: 'date', v: hariIni(), req: true }, { n: 'Nominal', l: 'Nominal (Rp)', t: 'number', req: true },
    { n: 'Kategori', l: 'Kategori', t: 'select', o: kat }, { n: jenis === 'masuk' ? 'Sumber' : 'Tujuan', l: jenis === 'masuk' ? 'Sumber dana' : 'Dibayarkan kepada' },
    { n: 'Uraian', l: 'Uraian', t: 'textarea', req: true, full: true }, { n: 'file', l: 'Bukti / nota (opsional)', t: 'file', full: true }
  ])}</form>`, kaki: `<button class="btn btn-outline" data-x>Batal</button><button class="btn btn-primary" id="tx-ok">${ikon('check')} Simpan</button>` });
  $('[data-x]', m.el).onclick = m.tutup;
  $('#tx-ok', m.el).onclick = () => { const f = $('#tx-f', m.el); if (!validasiForm(f)) return; sibuk($('#tx-ok', m.el), async () => { try { const d = await bacaForm(f); d.Jenis = jenis; d.Nominal = Number(d.Nominal); const r = await api('catatTransaksi', d); m.tutup(); toast(r.pesan); router(); } catch (e) { gagal(e); } }); };
}
/** Saldo awal kas: uang yang sudah ada sebelum aplikasi dipakai (satu per kas, bisa diubah) */
function formSaldoAwal(r) {
  const sa = (r && r.saldoAwal) || null;
  const m = modal({ judul: 'Saldo Awal ' + LABEL_KAS[Sesi.user.kas], ikonJudul: 'database', isi: `
    <div class="alert info mb-2">${ikon('info')}<div>Isi jumlah uang kas yang <b>sudah ada sebelum aplikasi dipakai</b>. Saldo awal ikut dihitung di saldo kas, tetapi <b>tidak</b> dihitung sebagai pemasukan bulanan.${sa ? '<br>Saat ini: <b>' + rp(sa.nominal) + '</b> per ' + esc(tgl(sa.tanggal)) + '. Isi <b>0</b> untuk menghapus.' : ''}</div></div>
    <form id="sa-f">${formHTML([
      { n: 'Nominal', l: 'Saldo awal (Rp)', t: 'number', v: sa ? sa.nominal : '', req: true, ph: 'Contoh: 2500000' },
      { n: 'Tanggal', l: 'Per tanggal', t: 'date', v: sa ? sa.tanggal : hariIni(), req: true, hint: 'Tanggal saat uang kas dihitung, sebaiknya sebelum transaksi pertama di aplikasi.' },
      { n: 'Uraian', l: 'Catatan (opsional)', t: 'textarea', full: true, ph: 'Contoh: Serah terima dari bendahara periode lalu' }
    ])}</form><div class="small muted mt-1" id="sa-prev"></div>`,
    kaki: `<button class="btn btn-outline" data-x>Batal</button><button class="btn btn-primary" id="sa-ok">${ikon('check')} Simpan saldo awal</button>` });
  const f = $('#sa-f', m.el);
  const prev = () => { const v = Number($('[name=Nominal]', f).value || 0); $('#sa-prev', m.el).innerHTML = v ? 'Akan tercatat: <b class="mono">' + rp(v) + '</b>' : ''; };
  $('[name=Nominal]', f).oninput = prev; prev();
  $('[data-x]', m.el).onclick = m.tutup;
  $('#sa-ok', m.el).onclick = () => { if (!validasiForm(f)) return; sibuk($('#sa-ok', m.el), async () => { try { const d = await bacaForm(f); d.Nominal = Number(d.Nominal); const x = await api('simpanSaldoAwal', d); m.tutup(); toast(x.pesan); router(); } catch (e) { gagal(e); } }); };
}

async function formSerahTerima() {
  const set = (await api('getPengaturan')).nilai;
  const m = modal({ judul: 'Usulkan Serah Terima Kas', ikonJudul: 'swap', isi: `<div class="alert info mb-2">${ikon('info')}<div>Saldo kas tujuan baru bertambah setelah bendahara kas tujuan <b>mengonfirmasi</b>. Sebelum itu tercatat sebagai dana titipan.</div></div>
    <form id="st-f">${formHTML([{ n: 'Tujuan', l: 'Kas tujuan', t: 'select', o: [['pembangunan', 'Kas Pembangunan'], ['sosial', 'Kas Sosial'], ['jimpitan', 'Kas Jimpitan']] }, { n: 'Nominal', l: 'Nominal (Rp)', t: 'number', req: true, v: set.ALOKASI_PEMBANGUNAN !== '0' ? set.ALOKASI_PEMBANGUNAN : '' },
      { n: 'alokasi', l: 'Ini alokasi rutin periode sesuai pengaturan', t: 'check', full: true }, { n: 'Uraian', l: 'Uraian', t: 'textarea', full: true }])}</form>
    <p class="small muted mt-1">Pengaturan alokasi: Pembangunan ${rp(set.ALOKASI_PEMBANGUNAN)} · Sosial ${rp(set.ALOKASI_SOSIAL)} per periode.</p>`, kaki: `<button class="btn btn-primary" id="st-ok">${ikon('send')} Usulkan</button>` });
  const f = $('#st-f', m.el);
  $('[name=Tujuan]', f).onchange = e => { const v = e.target.value === 'pembangunan' ? set.ALOKASI_PEMBANGUNAN : e.target.value === 'sosial' ? set.ALOKASI_SOSIAL : ''; $('[name=Nominal]', f).value = v && v !== '0' ? v : ''; };
  $('#st-ok', m.el).onclick = () => { if (!validasiForm(f)) return; sibuk($('#st-ok', m.el), async () => { try { const d = await bacaForm(f); d.Nominal = Number(d.Nominal); d.periode = periodeIni(); const r = await api('usulSerahTerima', d); m.tutup(); toast(r.pesan); router(); } catch (e) { gagal(e); } }); };
}
async function batalTrx(id) {
  const a = await mintaTeks('Batalkan Transaksi', 'Alasan koreksi (tercatat di log aktivitas)', { ya: 'Batalkan', bahaya: true });
  if (a) try { const r = await api('batalkanTransaksi', { id, alasan: a }); toast(r.pesan); router(); } catch (e) { gagal(e); }
}

// ============================================================
// JIMPITAN
// ============================================================
daftarHalaman('jimpitan', {
  judul: 'Kas Jimpitan', ikon: 'coins', menu: 'Jimpitan Mingguan',
  render: async el => {
    const [rows, set] = await Promise.all([api('listJimpitan'), api('getPengaturan')]);
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Senin minggu ini
    const senin = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    el.innerHTML = kepala('Jimpitan Mingguan', 'Catat total pendapatan jimpitan satu RT per minggu (bukan per rumah).') + `
    <div class="split"><div class="card flush"><div class="card-h"><h3>${ikon('history')} Riwayat</h3><span class="mono">${rp(rows.filter(r => r.status !== 'dibatalkan').reduce((s, r) => s + r.total, 0))}</span></div>
      <div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Minggu</th><th class="right">Total</th><th>Keterangan</th><th>Status</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td data-l="Minggu">${esc(tgl(r.mulai, true))} – ${esc(tgl(r.selesai, true))}</td><td data-l="Total" class="money">${rp(r.total)}</td><td data-l="Keterangan">${esc(r.ket || '-')}</td><td data-l="Status">${badge(r.status)}</td></tr>`).join('') || `<tr><td colspan="4">${kosong('Belum ada catatan jimpitan.', 'coins')}</td></tr>`}</tbody></table></div></div>
      <div class="card" style="align-self:start"><div class="card-h"><h3>${ikon('plus')} Catat minggu ini</h3></div><form id="jm-f" class="stack">
        ${field({ n: 'Minggu_Mulai', l: 'Awal minggu', t: 'date', v: senin, req: true })}
        ${field({ n: 'Total', l: 'Total pendapatan RT (Rp)', t: 'number', v: set.nilai.JIMPITAN_MINGGUAN !== '0' ? set.nilai.JIMPITAN_MINGGUAN : '', req: true, hint: 'Default dari pengaturan: ' + rp(set.nilai.JIMPITAN_MINGGUAN) })}
        ${field({ n: 'Keterangan', l: 'Keterangan', t: 'textarea' })}
        <button class="btn btn-primary" type="submit">${ikon('check')} Simpan</button></form></div></div>`;
    $('#jm-f').onsubmit = async e => { e.preventDefault(); if (!validasiForm(e.target)) return; const d2 = await bacaForm(e.target); await sibuk($('button', e.target), async () => { try { const r = await api('catatJimpitan', d2); toast(r.pesan); router(); } catch (ex) { gagal(ex); } }); };
  }
});

// ============================================================
// BANTUAN SOSIAL
// ============================================================
daftarHalaman('bansos', {
  judul: 'Bantuan Sosial', ikon: 'heart', menu: 'Penyaluran Bantuan',
  render: async el => {
    const [rows, rumah] = await Promise.all([api('listBansos'), daftarRumah()]);
    el.innerHTML = kepala('Penyaluran Bantuan Sosial', 'Setiap penyaluran dicatat terpisah dengan data penerima dan bukti. Data ini hanya terlihat oleh Bendahara Kas Sosial dan Ketua RT.', `<button class="btn btn-primary" id="bs-baru">${ikon('plus')} Catat penyaluran</button>`) + `
    <div class="alert info mb-2">${ikon('lock')}<div>Data bantuan sosial bersifat terbatas. Jangan bagikan ke grup warga.</div></div>
    <div class="card flush"><div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Tanggal</th><th>Penerima</th><th>Jenis</th><th class="right">Nominal</th><th>Status</th><th></th></tr></thead><tbody>
    ${rows.map(b => `<tr><td data-l="Tanggal">${esc(tgl(b.tanggal, true))}</td><td data-l="Penerima"><b>${esc(b.penerima)}</b><div class="sub">${esc(b.rumahLabel)}</div></td><td data-l="Jenis">${esc(b.jenis)}<div class="sub">${esc(b.tujuan || '')}</div></td><td data-l="Nominal" class="money">${rp(b.nominal)}</td><td data-l="Status">${badge(b.status)}</td><td data-l="">${b.buktiId ? `<button class="btn btn-ghost btn-sm" onclick="bukaBerkas('${b.buktiId}')">${ikon('eye', 'sm')}</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="6">${kosong('Belum ada penyaluran.', 'heart')}</td></tr>`}</tbody></table></div></div>`;
    $('#bs-baru').onclick = () => {
      const m = modal({ judul: 'Catat Penyaluran Bantuan', ikonJudul: 'heart', isi: `<form id="bs-f">${formHTML([
        { n: 'Tanggal', l: 'Tanggal', t: 'date', v: hariIni(), req: true }, { n: 'ID_Rumah', l: 'Rumah penerima', t: 'select', o: opsiRumah(rumah), req: true },
        { n: 'Nama_Penerima', l: 'Nama penerima', req: true }, { n: 'Nominal', l: 'Nominal (Rp)', t: 'number', req: true },
        { n: 'Jenis_Bantuan', l: 'Jenis bantuan', t: 'select', o: ['Santunan sakit', 'Santunan duka', 'Bantuan sembako', 'Bantuan pendidikan', 'Lainnya'] }, { n: 'Tujuan', l: 'Tujuan / keterangan' },
        { n: 'file', l: 'Bukti penyaluran', t: 'file', full: true }
      ])}</form>`, kaki: `<button class="btn btn-primary" id="bs-ok">${ikon('check')} Simpan</button>` });
      const f = $('#bs-f', m.el);
      $('[name=ID_Rumah]', f).onchange = e => { const r = rumah.find(x => x.id === e.target.value); if (r && !$('[name=Nama_Penerima]', f).value) $('[name=Nama_Penerima]', f).value = r.kepala || ''; };
      $('#bs-ok', m.el).onclick = () => { if (!validasiForm(f)) return; sibuk($('#bs-ok', m.el), async () => { try { const d = await bacaForm(f); d.Nominal = Number(d.Nominal); const r = await api('catatBansos', d); m.tutup(); toast(r.pesan); router(); } catch (e) { gagal(e); } }); };
    };
  }
});

// ============================================================
// LAPORAN 4 KAS
// ============================================================
daftarHalaman('laporan', {
  judul: 'Laporan Kas', ikon: 'chart', menu: 'Laporan 4 Kas', pendek: 'Laporan',
  render: async el => {
    const u = Sesi.user, bend = isBend();
    let kas = bend ? u.kas : 'umum';
    const p = periodeIni();
    const preset = {
      bulan: [p + '-01', hariIni()],
      triwulan: (() => { const [y, m] = p.split('-').map(Number); const q = Math.floor((m - 1) / 3) * 3 + 1; return [y + '-' + String(q).padStart(2, '0') + '-01', hariIni()]; })(),
      tahun: [p.substr(0, 4) + '-01-01', hariIni()],
      lalu: (() => { const l = tambahBulan(p, -1); const [y, m] = l.split('-').map(Number); return [l + '-01', l + '-' + String(new Date(y, m, 0).getDate()).padStart(2, '0')]; })()
    };
    let [dari, sampai] = preset.bulan;
    const muat = async () => {
      $('#lp-isi').innerHTML = loader();
      try {
        const L = await api('laporanKas', { kas, dari, sampai });
        window._lap = L;
        $('#lp-isi').innerHTML = `<div class="grid g-4">${kpiCard('calendar', 'Saldo awal', `<span class="mono" style="font-size:22px">${rp(L.saldoAwal)}</span>`, 'per ' + tgl(L.dari, true))}${kpiCard('chart', 'Total pemasukan', `<span class="mono" style="font-size:22px;color:var(--green-deep)">${rp(L.pemasukan)}</span>`, '', 'g')}${kpiCard('wallet', 'Total pengeluaran', `<span class="mono" style="font-size:22px;color:var(--danger)">${rp(L.pengeluaran)}</span>`, '', 'r')}${kpiCard('bank', 'Saldo akhir', `<span class="mono" style="font-size:22px">${rp(L.saldoAkhir)}</span>`, 'per ' + tgl(L.sampai, true), '', 'dark')}</div>
        <div class="card flush mt-3"><div class="card-h"><div><h3>Buku ${esc(L.kasLabel)}: rincian transaksi</h3><div class="sub">${esc(tgl(L.dari))} – ${esc(tgl(L.sampai))} · hanya transaksi terkonfirmasi</div></div></div>
          <div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Tanggal</th><th>Uraian</th><th class="right">Pemasukan</th><th class="right">Pengeluaran</th><th class="right">Saldo</th></tr></thead><tbody>
          <tr><td data-l="Tanggal">${esc(tgl(L.dari, true))}</td><td data-l="Uraian"><i>Saldo awal</i></td><td data-l="Pemasukan" class="money">-</td><td data-l="Pengeluaran" class="money">-</td><td data-l="Saldo" class="money">${rp(L.saldoAwal)}</td></tr>
          ${L.transaksi.map(t => `<tr><td data-l="Tanggal" class="nowrap">${esc(tgl(t.tanggal, true))}<div class="sub mono">${esc(t.id)}</div></td><td data-l="Uraian">${esc(t.uraian)}<div class="sub">${esc(t.kategori)} · ${esc(t.oleh)}</div></td><td data-l="Pemasukan" class="money plus">${t.masuk ? '+' + rp(t.masuk) : '-'}</td><td data-l="Pengeluaran" class="money minus">${t.keluar ? '−' + rp(t.keluar) : '-'}</td><td data-l="Saldo" class="money">${rp(t.saldo)}</td></tr>`).join('')}
          <tr style="background:#F8FAFC"><td colspan="2" data-l=""><b>Total</b></td><td data-l="Pemasukan" class="money"><b>${rp(L.pemasukan)}</b></td><td data-l="Pengeluaran" class="money"><b>${rp(L.pengeluaran)}</b></td><td data-l="Saldo akhir" class="money"><b>${rp(L.saldoAkhir)}</b></td></tr></tbody></table></div></div>
        <div class="card mt-3"><div class="card-h"><h3>${ikon('shield')} Lembar pengesahan</h3></div><div class="grid g-2"><div class="center"><div class="small muted">Petugas pencatat (${esc(L.jabatanPetugas)})</div><div style="height:56px"></div><b style="text-decoration:underline">${esc(L.petugas || '(belum diatur)')}</b></div><div class="center"><div class="small muted">Mengesahkan, Ketua RT</div><div style="height:56px"></div><b style="text-decoration:underline">${esc(L.ketua || '(belum diatur)')}</b></div></div><p class="small muted center mt-2 mb-0">Tanda tangan dibubuhkan manual pada dokumen cetak.</p></div>`;
      } catch (e) { $('#lp-isi').innerHTML = errorBox(e); }
    };
    el.innerHTML = kepala('Laporan Keuangan', bend ? 'Laporan ' + esc(LABEL_KAS[u.kas]) + ' siap cetak dan unduh.' : 'Laporan empat kas lingkungan.' + (u.peran === 'sekretaris' ? ' (baca saja)' : ''),
      `<button class="btn btn-outline" id="lp-pdf">${ikon('printer')} Unduh PDF</button><button class="btn btn-accent" id="lp-xls">${ikon('download')} Unduh Excel</button>`) + `
    ${!bend ? `<div class="tabs mb-2">${Object.keys(LABEL_KAS).map(k => `<button class="tab ${k === kas ? 'on' : ''}" data-k="${k}">${LABEL_KAS[k]}</button>`).join('')}</div>` : ''}
    <div class="card mb-2"><div class="row"><div class="tabs">${[['bulan', 'Bulan ini'], ['lalu', 'Bulan lalu'], ['triwulan', 'Triwulan ini'], ['tahun', 'Tahun ini']].map(([k, l]) => `<button class="tab ${k === 'bulan' ? 'on' : ''}" data-p="${k}">${l}</button>`).join('')}</div>
      <div class="row grow rentang"><input type="date" class="input" id="lp-dari" value="${dari}" aria-label="Dari tanggal"><span>s.d.</span><input type="date" class="input" id="lp-sampai" value="${sampai}" aria-label="Sampai tanggal"><button class="btn btn-primary" id="lp-go">${ikon('search')} Terapkan</button></div></div></div>
    <div id="lp-isi"></div>`;
    $$('[data-k]', el).forEach(b => b.onclick = () => { kas = b.dataset.k; $$('[data-k]', el).forEach(x => x.classList.toggle('on', x === b)); muat(); });
    $$('[data-p]', el).forEach(b => b.onclick = () => { [dari, sampai] = preset[b.dataset.p]; $('#lp-dari').value = dari; $('#lp-sampai').value = sampai; $$('[data-p]', el).forEach(x => x.classList.toggle('on', x === b)); muat(); });
    $('#lp-go').onclick = () => { dari = $('#lp-dari').value; sampai = $('#lp-sampai').value; $$('[data-p]', el).forEach(x => x.classList.remove('on')); muat(); };
    $('#lp-pdf').onclick = () => sibuk($('#lp-pdf'), async () => { try { const f = await api('laporanKasPdf', { kas, dari, sampai }); unduhBlob(b64Blob(f.base64, f.mime), f.nama); } catch (e) { gagal(e); } });
    $('#lp-xls').onclick = () => {
      const L = window._lap; if (!L) return;
      eksporExcel(L.transaksi.map(t => ({ Tanggal: t.tanggal, 'No. Ref': t.id, Uraian: t.uraian, Kategori: t.kategori, Pemasukan: t.masuk, Pengeluaran: t.keluar, Saldo: t.saldo, Pencatat: t.oleh })), `Laporan_${L.kasLabel.replace(/ /g, '_')}_${L.dari}_${L.sampai}.xlsx`, L.kasLabel,
        [[L.namaRTPanjang || L.namaRT], [L.alamatRT], ['LAPORAN ' + L.kasLabel.toUpperCase()], ['Periode', L.dari + ' s.d. ' + L.sampai, 'Dicetak', L.dicetak], ['Saldo awal', L.saldoAwal, 'Pemasukan', L.pemasukan, 'Pengeluaran', L.pengeluaran, 'Saldo akhir', L.saldoAkhir], ['Petugas pencatat', L.petugas, 'Ketua RT', L.ketua], []]);
    };
    muat();
  }
});

// ============================================================
// KERINGANAN IPL (Ketua RT)
// ============================================================
daftarHalaman('keringanan', {
  judul: 'Keringanan IPL', ikon: 'heart', menu: 'Keringanan IPL',
  render: async el => {
    const [rows, rumah] = await Promise.all([api('listKeringanan'), daftarRumah()]);
    window._krg = rows;
    el.innerHTML = kepala('Keringanan IPL', 'Tetapkan nominal IPL khusus per rumah (tetap atau per rentang bulan). Tagihan yang sudah terbit tidak berubah. Iuran khusus tidak terpengaruh.', `<button class="btn btn-primary" id="kr-baru">${ikon('plus')} Tetapkan keringanan</button>`) + `
    <div class="card flush"><div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Rumah</th><th class="right">Nominal IPL</th><th>Berlaku</th><th>Alasan</th><th>Status</th><th></th></tr></thead><tbody>
    ${rows.map((k, i) => `<tr><td data-l="Rumah"><b>${esc(k.rumahLabel)}</b><div class="sub">${esc(k.kepala || '')}</div></td><td data-l="Nominal" class="money">${rp(k.nominal)}</td><td data-l="Berlaku">${esc(periodeLabel(k.mulai))} – ${k.sampai ? esc(periodeLabel(k.sampai)) : 'seterusnya'}</td><td data-l="Alasan">${esc(k.alasan || '-')}</td><td data-l="Status">${badge(k.aktif ? 'Aktif' : 'NONAKTIF', k.aktif ? 'Aktif' : 'Nonaktif')}</td><td data-l=""><button class="btn btn-ghost btn-sm" onclick="formKeringanan(_krg[${i}])">${ikon('edit', 'sm')}</button></td></tr>`).join('') || `<tr><td colspan="6">${kosong('Belum ada keringanan.', 'heart')}</td></tr>`}</tbody></table></div></div>`;
    window._rumahKr = rumah;
    $('#kr-baru').onclick = () => formKeringanan();
  }
});
function formKeringanan(k = {}) {
  const m = modal({ judul: k.id ? 'Ubah Keringanan' : 'Tetapkan Keringanan IPL', ikonJudul: 'heart', isi: `<form id="kr-f">${formHTML([
    { n: 'ID_Rumah', l: 'Rumah', t: 'select', o: opsiRumah(window._rumahKr), v: k.rumah, req: true }, { n: 'Nominal', l: 'Nominal IPL per bulan (Rp)', t: 'number', v: k.nominal, req: true, hint: 'Isi 0 untuk pembebasan penuh.' },
    { n: 'Mulai_Periode', l: 'Mulai bulan', t: 'month', v: k.mulai || periodeIni(), req: true }, { n: 'Sampai_Periode', l: 'Sampai bulan (opsional)', t: 'month', v: k.sampai },
    { n: 'Alasan', l: 'Alasan', t: 'textarea', v: k.alasan, full: true }, { n: 'Aktif', l: 'Aktif', t: 'check', v: k.id ? k.aktif : true }
  ])}</form>`, kaki: `<button class="btn btn-primary" id="kr-ok">${ikon('check')} Simpan</button>` });
  $('#kr-ok', m.el).onclick = () => { const f = $('#kr-f', m.el); if (!validasiForm(f)) return; sibuk($('#kr-ok', m.el), async () => { try { const d = await bacaForm(f); d.Nominal = Number(d.Nominal); if (k.id) d.ID_Keringanan = k.id; await api('simpanKeringanan', d); m.tutup(); toast('Keringanan disimpan.'); router(); } catch (e) { gagal(e); } }); };
}

// ============================================================
// RIWAYAT WHATSAPP (ketua & bendahara: lihat)
// ============================================================
daftarHalaman('riwayat-wa', {
  judul: 'Riwayat WhatsApp', ikon: 'wa', menu: 'Riwayat Notifikasi WA',
  render: async el => {
    let st = '';
    const muat = async () => {
      const r = await api('riwayatNotif', { status: st, batas: 200 });
      el.innerHTML = kepala('Riwayat Notifikasi WhatsApp', '“Terkirim” berarti pesan diterima API Fonnte, bukan berarti sudah dibaca warga.') + `
      <div class="tabs mb-2">${[['', 'Semua'], ['terkirim', 'Terkirim'], ['antre', 'Antre'], ['tertunda', 'Tertunda'], ['gagal', 'Gagal']].map(([k, l]) => `<button class="tab ${k === st ? 'on' : ''}" data-s="${k}">${l}${k ? ` <span class="n">${r.hitung[k] || 0}</span>` : ''}</button>`).join('')}</div>
      <div class="card flush">${tabelWA(r.data)}</div>`;
      $$('[data-s]', el).forEach(b => b.onclick = () => { st = b.dataset.s; el.innerHTML = loader(); muat(); });
    };
    await muat();
  }
});
function tabelWA(rows, aksi) {
  return rows.length ? `<div class="table-wrap"><table class="tbl responsive"><thead><tr><th>Waktu</th><th>Tujuan</th><th>Jenis</th><th>Pesan</th><th>Status</th>${aksi ? '<th></th>' : ''}</tr></thead><tbody>
    ${rows.map(n => `<tr><td data-l="Waktu" class="mono nowrap">${esc(n.diproses || n.dibuat)}</td><td data-l="Tujuan"><b>${esc(n.nama || '-')}</b><div class="sub mono">${esc(n.nomor || '—')} · ${esc(n.rumahLabel)}</div></td><td data-l="Jenis"><span class="badge info">${esc(n.kode)}</span></td>
      <td data-l="Pesan"><div class="small" style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(n.pesan)}">${esc(n.pesan)}</div>${n.status !== 'terkirim' && n.respon ? `<div class="sub err">${esc(n.respon)}</div>` : ''}</td><td data-l="Status">${badge(n.status)}</td>${aksi ? `<td data-l="">${aksi(n)}</td>` : ''}</tr>`).join('')}</tbody></table></div>` : kosong('Belum ada riwayat pengiriman.', 'wa');
}
