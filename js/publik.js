/**
 * publik.js — Halaman tanpa login: beranda, pengumuman & notulen, agenda, galeri, profil, login.
 */

function kartuPengumuman(p, ringkas) {
  return `<article class="card ann ${p.prioritas === 'Penting' ? 'penting' : ''}">
    <div class="row between"><span class="row gap-sm">${badge(p.prioritas)}${p.audiens === 'Khusus Warga' ? '<span class="badge">' + ikon('lock', 'sm') + ' Khusus Warga</span>' : ''}</span><span class="mono muted">${esc(tglJam(p.tanggal))}</span></div>
    <h3>${esc(p.judul)}</h3>
    <div class="isi" ${ringkas ? '' : 'style="-webkit-line-clamp:unset"'}>${ringkas ? esc(p.isi) : nl2br(p.isi)}</div>
    <div class="foot">${p.lampiranId ? `<button class="btn btn-ghost btn-sm" onclick="bukaLampiranPublik('${esc(p.lampiranId)}')">${ikon('download', 'sm')} Lampiran</button>` : '<span></span>'}
    ${ringkas ? `<button class="btn btn-ghost btn-sm" onclick='bacaPengumuman(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Baca selengkapnya ${ikon('right', 'sm')}</button>` : ''}</div>
  </article>`;
}
function bacaPengumuman(p) {
  modal({ judul: p.judul, ikonJudul: 'megaphone', isi: `<div class="row mb-2">${badge(p.prioritas)}<span class="mono muted">${esc(tglJam(p.tanggal))}</span></div><div style="font-size:17px">${nl2br(p.isi)}</div>${p.lampiranId ? `<button class="btn btn-outline mt-2" onclick="bukaLampiranPublik('${esc(p.lampiranId)}')">${ikon('download')} Buka lampiran</button>` : ''}` });
}
function bukaLampiranPublik(id) {
  if (Sesi.user) return bukaBerkas(id);
  window.open('https://drive.google.com/file/d/' + id + '/view', '_blank');
}
function itemAgenda(a, besar) {
  const p = parseTgl(a.tanggal) || {};
  const sisa = selisihHari(a.tanggal);
  return `<div class="ag-item">
    <div class="date-box ${besar ? '' : 'light'}"><div class="m">${BLN[(p.m || 1) - 1].substr(0, 3)} ${besar ? p.y : ''}</div><div class="d">${p.d || '-'}</div><div class="w">${esc(hariDari(a.tanggal))}</div></div>
    <div class="grow"><div class="row gap-sm">${a.kategori ? `<span class="badge info">${esc(a.kategori)}</span>` : ''}${sisa !== null && sisa >= 0 && sisa <= 14 ? `<span class="badge accent">${sisa === 0 ? 'Hari ini' : sisa + ' hari lagi'}</span>` : ''}</div>
      <h4 class="mt-1" style="${besar ? 'font-size:18px' : ''}">${esc(a.nama)}</h4>
      ${besar && a.keterangan ? `<p class="muted small mt-1 mb-1">${esc(a.keterangan)}</p>` : ''}
      <div class="meta">${a.waktu ? `<span>${ikon('clock', 'sm')} ${esc(a.waktu)}</span>` : ''}${a.lokasi ? `<span>${ikon('pin', 'sm')} ${esc(a.lokasi)}</span>` : ''}${besar && a.pj ? `<span>${ikon('user', 'sm')} PJ: ${esc(a.pj)}</span>` : ''}</div>
      ${besar ? `<div class="row mt-2"><a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="${linkKalender(a)}">${ikon('calendar', 'sm')} Tambah ke Google Calendar</a><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('🗓️ ' + a.nama + '\n' + tgl(a.tanggal) + (a.waktu ? ', ' + a.waktu : '') + (a.lokasi ? '\n📍 ' + a.lokasi : '') + '\n\n' + (Identitas.data.namaRT || ''))}">${ikon('wa', 'sm')} Bagikan</a></div>` : ''}
    </div></div>`;
}
function linkKalender(a) {
  const d = String(a.tanggal).replace(/-/g, '');
  const m = String(a.waktu || '').match(/(\d{1,2})[.:](\d{2})/);
  let dates = d + '/' + d;
  if (m) { const s = d + 'T' + m[1].padStart(2, '0') + m[2] + '00'; const e = d + 'T' + String(Math.min(23, +m[1] + 2)).padStart(2, '0') + m[2] + '00'; dates = s + '/' + e; }
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(a.nama) + '&dates=' + dates + '&ctz=Asia/Jakarta&details=' + encodeURIComponent(a.keterangan || '') + '&location=' + encodeURIComponent(a.lokasi || '');
}
function fotoKartu(f, judul, tanggal) {
  return `<figure class="photo" style="margin:0"><img loading="lazy" src="${esc(f.url)}" alt="${esc(f.judul || judul)}" onerror="this.style.display='none'"><figcaption class="cap"><b>${esc(judul || f.judul)}</b><small>${esc(tgl(tanggal || f.tanggal))}</small></figcaption></figure>`;
}

// ---------------- BERANDA ----------------
HalamanPublik.beranda = async el => {
  const d = await apiPublik('publikBeranda');
  const I = d.identitas, S = d.statistik;
  layoutPublik('beranda');
  el = $('#pub-main');
  el.style.maxWidth = 'none'; el.style.padding = '0';
  const kpi = (ik, lbl, val, sub, cls = '') => `<div class="card kpi"><div class="ico ${cls}">${ikon(ik)}</div><div class="lbl">${lbl}</div><div class="val">${val}</div><div class="note">${sub}</div></div>`;
  el.innerHTML = `
  <section class="hero">${bgGerbang()}<div class="in">
    <span class="pill-tag"><span class="dot"></span>Portal resmi lingkungan · Terbuka & terintegrasi</span>
    <h1>${esc(I.namaRT)}</h1><div class="slogan">${esc(I.slogan)}</div>
    <p>${esc(I.banner || 'Pusat layanan administrasi digital, transparansi keuangan kas lingkungan, jadwal kegiatan, dan saluran informasi warga.')}</p>
    <div class="row mt-3"><a class="btn btn-outline" href="#/pengumuman">${ikon('megaphone')} Lihat Pengumuman</a><a class="btn btn-accent" href="#/login">${ikon('file')} Layanan Surat & Iuran (Login)</a></div>
  </div></section>
  <div class="pub-main" style="padding-top:0">
    <div class="grid g-4 hero-stats">
      ${kpi('home', 'Rumah terdaftar', S.rumah + '<small>rumah</small>', esc(S.blok + ' blok · ' + (S.blokLabel || '')))}
      ${kpi('wallet', 'Kas lingkungan', '4<small>kas</small>', 'Umum · Pembangunan · Jimpitan · Sosial', 'g')}
      ${kpi('mail', 'Layanan surat', 'Daring', 'Pengantar, domisili, dan lainnya')}
      ${kpi('users', 'Warga tercatat', S.jiwa + '<small>jiwa</small>', S.kk + ' kepala keluarga', 'y')}
    </div>
    <div class="card mt-3"><div class="row between"><div class="row"><span class="avatar" style="background:var(--navy);width:48px;height:48px">${ikon('grid')}</span><div><b>Layanan Administrasi Mandiri Warga</b><div class="small muted">Cek tagihan iuran, ajukan surat pengantar, atau sampaikan pengaduan kepada pengurus.</div></div></div>
      <div class="row"><a class="btn btn-outline btn-sm" href="#/login">${ikon('receipt', 'sm')} Cek Status Iuran</a><a class="btn btn-outline btn-sm" href="#/login">${ikon('file', 'sm')} Buat Surat Pengantar</a><a class="btn btn-outline btn-sm" href="#/login">${ikon('message', 'sm')} Lapor Masalah</a></div></div></div>

    <section class="section"><div class="section-h"><div><div class="eyebrow">${ikon('megaphone', 'sm')} Warta & pengumuman</div><h2>Pemberitahuan Resmi Lingkungan</h2></div><a href="#/pengumuman">Lihat semua ${ikon('right', 'sm')}</a></div>
      ${d.pengumuman.length || d.khususWarga ? `<div class="grid g-3">${d.pengumuman.map(p => kartuPengumuman(p, true)).join('')}
        ${d.khususWarga ? `<article class="card ann locked"><span class="badge">${ikon('lock', 'sm')} Khusus Warga</span><h3>${d.khususWarga} pengumuman khusus warga</h3><div class="isi">Informasi internal seperti laporan keuangan dan notulen hanya dapat dibaca setelah login warga.</div><div class="foot"><span class="muted small">Akses terkunci</span><a class="btn btn-primary btn-sm" href="#/login">${ikon('login', 'sm')} Masuk untuk membaca</a></div></article>` : ''}</div>` : `<div class="card">${kosong('Belum ada pengumuman yang diterbitkan.', 'megaphone')}</div>`}
    </section>

    <div class="split section">
      <section><div class="section-h"><div><div class="eyebrow">Kalender warga</div><h2>Agenda Mendatang</h2></div><a href="#/agenda">Kalender lengkap ${ikon('right', 'sm')}</a></div>
        <div class="card">${d.agenda.length ? d.agenda.map(a => itemAgenda(a)).join('') : kosong('Belum ada agenda mendatang.', 'calendar')}</div></section>
      <section><div class="section-h"><div><div class="eyebrow">Akuntabilitas warga</div><h2>Ringkasan Kas RT</h2></div></div>
        <div class="card">${d.kas ? `<div class="kpi"><div class="lbl">Total saldo terkonsolidasi</div><div class="val">${rp(d.kas.reduce((s, k) => s + k.saldo, 0))}</div></div>
          ${d.kas.map(k => `<div class="row between list-item"><span>${esc(k.label)}</span><b class="mono">${rp(k.saldo)}</b></div>`).join('')}` : `<p class="muted">Rincian kas dan mutasi tersedia bagi warga setelah login, sesuai prinsip keterbukaan internal RT.</p>`}
          <a class="btn btn-primary btn-block mt-2" href="#/login">${ikon('shield')} Login untuk laporan kas</a></div></section>
    </div>

    <section class="section"><div class="section-h"><div><div class="eyebrow">Dokumentasi lingkungan</div><h2>Kebersamaan Warga</h2></div><a href="#/galeri">Lihat semua foto ${ikon('right', 'sm')}</a></div>
      ${d.galeri.length ? `<div class="grid g-3">${d.galeri.map(g => fotoKartu(g.foto, g.judul, g.tanggal)).join('')}</div>` : `<div class="card">${kosong('Belum ada dokumentasi kegiatan.', 'image')}</div>`}</section>

    <section class="section"><div class="cta"><div><span class="pill-tag"><span class="dot"></span>Layanan warga</span><h3>Pusat Aspirasi & Pengaduan Warga</h3><p>Lampu jalan padam, fasilitas rusak, atau ada masukan? Sampaikan lewat menu Pengaduan setelah login, atau hubungi pengurus.</p></div>
      <div class="row">${I.wa ? `<a class="btn btn-accent" target="_blank" rel="noopener" href="https://wa.me/62${String(I.wa).replace(/^0/, '')}">${ikon('wa')} WhatsApp Pengurus</a>` : ''}<a class="btn btn-outline" href="#/profil">${ikon('users')} Susunan Pengurus</a></div></div></section>
  </div>`;
};

// ---------------- PENGUMUMAN & NOTULEN ----------------
HalamanPublik.pengumuman = async el => {
  const d = await apiPublik('publikPengumuman');
  let tab = 'pengumuman', filter = 'Semua', q = '';
  const gambar = () => {
    const list = d.pengumuman.filter(p => (filter === 'Semua' || p.prioritas === filter) && (!q || (p.judul + p.isi).toLowerCase().includes(q)));
    const not = d.notulen.filter(n => !q || (n.judul + n.keputusan + n.pembahasan).toLowerCase().includes(q));
    $('#pg-isi').innerHTML = tab === 'pengumuman' ? `
      <div class="tabs mb-2">${['Semua', 'Penting', 'Informasi Umum'].map(f => `<button class="tab ${f === filter ? 'on' : ''}" data-f="${f}">${f} <span class="n">${f === 'Semua' ? d.pengumuman.length : d.pengumuman.filter(p => p.prioritas === f).length}</span></button>`).join('')}</div>
      ${list.length ? `<div class="grid g-2">${list.map(p => kartuPengumuman(p, false)).join('')}</div>` : `<div class="card">${kosong('Tidak ada pengumuman.', 'megaphone')}</div>`}
      ${d.khususWarga ? `<div class="card locked mt-3 row between"><div class="row">${ikon('lock', 'lg')}<div><span class="badge proses">Khusus warga terdaftar</span><h3 class="mt-1">${d.khususWarga} pengumuman internal</h3><div class="small muted">Laporan keuangan rinci dan pengumuman internal dapat diakses setelah login warga.</div></div></div><a class="btn btn-accent" href="#/login">${ikon('login')} Masuk / Login Warga</a></div>` : ''}`
      : (not.length ? not.map(n => `<div class="card mb-2"><div class="row top"><div class="date-box light"><div class="m">${BLN[(parseTgl(n.tanggal) || { m: 1 }).m - 1].substr(0, 3)}</div><div class="d">${(parseTgl(n.tanggal) || {}).d || ''}</div><div class="w">${(parseTgl(n.tanggal) || {}).y || ''}</div></div>
          <div class="grow"><h3 style="font-size:18px">${esc(n.judul)}</h3><div class="meta">${n.tempat ? `<span>${ikon('pin', 'sm')} ${esc(n.tempat)}</span>` : ''}${n.peserta ? `<span>${ikon('users', 'sm')} ${esc(n.peserta.substr(0, 80))}</span>` : ''}</div>
          ${n.keputusan ? `<p class="mt-2"><b>Keputusan:</b> ${nl2br(n.keputusan)}</p>` : ''}${n.tindakLanjut ? `<p class="small muted"><b>Tindak lanjut:</b> ${nl2br(n.tindakLanjut)}</p>` : ''}
          <details class="small"><summary style="cursor:pointer;color:var(--navy);font-weight:600">Pembahasan lengkap</summary><p class="mt-1">${nl2br(n.pembahasan)}</p></details></div>
          ${n.lampiranId ? `<button class="btn btn-outline btn-sm" onclick="bukaLampiranPublik('${esc(n.lampiranId)}')">${ikon('download', 'sm')} Lampiran</button>` : ''}</div></div>`).join('') : `<div class="card">${kosong('Belum ada notulen yang dipublikasikan.', 'file')}</div>`);
    $$('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; gambar(); });
  };
  el.innerHTML = `${kepalaPublik('Pusat Informasi & Notulen Rapat', 'Kanal resmi publikasi pengumuman lingkungan dan arsip musyawarah warga yang transparan.')}
    <div class="card mb-2"><div class="row"><div class="grow" style="position:relative"><input class="input" id="pg-q" placeholder="Cari judul pengumuman atau topik musyawarah…" style="padding-left:44px"><span style="position:absolute;left:14px;top:14px;color:var(--text-2)">${ikon('search')}</span></div>
      <div class="seg"><button data-t="pengumuman" class="on">${ikon('megaphone', 'sm')} Pengumuman</button><button data-t="notulen">${ikon('file', 'sm')} Notulen</button></div></div></div>
    <div id="pg-isi"></div>`;
  $('#pg-q').oninput = e => { q = e.target.value.toLowerCase(); gambar(); };
  $$('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; $$('[data-t]').forEach(x => x.classList.toggle('on', x === b)); gambar(); });
  gambar();
};
function kepalaPublik(judul, desc, aksi = '') {
  return `<div class="crumb"><a href="#/">${ikon('home', 'sm')} Beranda</a> ${ikon('right', 'sm')} <b>${esc(judul)}</b></div>${kepala(judul, esc(desc), aksi)}`;
}

// ---------------- AGENDA ----------------
HalamanPublik.agenda = async el => {
  const d = await apiPublik('publikAgenda');
  const kat = [...new Set(d.agenda.map(a => a.kategori).filter(Boolean))];
  let f = 'Semua', lalu = false;
  const gambar = () => {
    const t = hariIni();
    const list = d.agenda.filter(a => (f === 'Semua' || a.kategori === f) && (lalu ? a.tanggal < t : a.tanggal >= t));
    if (lalu) list.reverse();
    const next = d.agenda.find(a => a.tanggal >= t);
    $('#ag-isi').innerHTML = `
      ${next && !lalu ? `<div class="cta mb-2"><div class="row"><div class="date-box" style="background:rgba(255,255,255,.12)"><div class="m">${BLN[parseTgl(next.tanggal).m - 1].substr(0, 3)}</div><div class="d">${parseTgl(next.tanggal).d}</div></div><div><span class="badge accent">Agenda terdekat</span> <span class="small" style="color:#C9D8EA">${selisihHari(next.tanggal) === 0 ? 'Hari ini' : selisihHari(next.tanggal) + ' hari lagi'}</span><h3 class="mt-1">${esc(next.nama)}</h3><p class="small">${esc([next.waktu, next.lokasi].filter(Boolean).join(' · '))}</p></div></div><a class="btn btn-outline" target="_blank" rel="noopener" href="${linkKalender(next)}">${ikon('calendar')} Simpan ke kalender</a></div>` : ''}
      <div class="row between mb-2"><div class="tabs">${['Semua'].concat(kat).map(k => `<button class="tab ${k === f ? 'on' : ''}" data-k="${esc(k)}">${esc(k === 'Semua' ? 'Semua kegiatan' : k)}</button>`).join('')}</div>
      <div class="seg"><button data-l="0" class="${!lalu ? 'on' : ''}">Mendatang</button><button data-l="1" class="${lalu ? 'on' : ''}">Selesai</button></div></div>
      <div class="card">${list.length ? list.map(a => itemAgenda(a, true)).join('') : kosong(lalu ? 'Belum ada agenda yang lalu.' : 'Belum ada agenda mendatang.', 'calendar')}</div>`;
    $$('[data-k]').forEach(b => b.onclick = () => { f = b.dataset.k; gambar(); });
    $$('[data-l]').forEach(b => b.onclick = () => { lalu = b.dataset.l === '1'; gambar(); });
  };
  el.innerHTML = kepalaPublik('Agenda Kegiatan Warga', 'Jadwal kerja bakti, posyandu, musyawarah, dan kegiatan sosial lingkungan.') + '<div id="ag-isi"></div>';
  gambar();
};

// ---------------- GALERI ----------------
HalamanPublik.galeri = async el => {
  const d = await apiPublik('publikGaleri');
  const total = d.galeri.reduce((s, g) => s + g.foto.length, 0);
  el.innerHTML = kepalaPublik('Dokumentasi & Galeri Warga', 'Kilas balik momen kebersamaan, gotong royong, dan kegiatan warga.', `<span class="badge info">${ikon('image', 'sm')} ${total} foto</span>`) +
    (d.galeri.length ? d.galeri.map(g => `<section class="card mb-2"><div class="card-h"><div><span class="badge proses">${esc(periodeLabel(String(g.tanggal).substr(0, 7)))}</span><h3 class="mt-1">${esc(g.judul)}</h3></div><span class="mono muted">${g.foto.length} foto</span></div>
      <div class="grid g-3">${g.foto.map(f => `<a href="${esc(f.url.replace(/sz=w\d+/, 'sz=w1920'))}" target="_blank" rel="noopener">${fotoKartu(f, f.judul, f.tanggal)}</a>`).join('')}</div></section>`).join('')
      : `<div class="card">${kosong('Belum ada dokumentasi kegiatan.', 'image')}</div>`) +
    `<div class="card mt-2"><div class="row top">${ikon('shield')}<div><b>Prinsip & privasi dokumentasi</b><p class="small muted mt-1 mb-0">Dokumentasi diambil pada acara publik lingkungan. Bila ada foto keluarga Anda yang ingin diturunkan, silakan hubungi Sekretaris RT.</p></div></div></div>`;
};

// ---------------- PROFIL ----------------
HalamanPublik.profil = async el => {
  const d = await apiPublik('publikProfil');
  const I = d.identitas;
  const misi = String(d.misi || '').split('\n').filter(Boolean);
  el.innerHTML = kepalaPublik('Profil RT', 'Profil lembaga, susunan pengurus, dan cakupan wilayah.') + `
    <div class="card"><div class="row top"><div style="width:96px;height:96px;flex:none;border-radius:16px;overflow:hidden;border:1px solid var(--border)">${logoImg()}</div>
      <div class="grow"><span class="badge penting">Profil resmi lembaga</span><h2 class="mt-1">${esc(I.namaRTPanjang || I.namaRT)}</h2><p class="muted mt-1">${esc(I.alamat)}</p><p style="color:var(--green-deep);font-weight:600">“${esc(I.slogan)}”</p></div>
      ${I.wa ? `<a class="btn btn-accent" target="_blank" rel="noopener" href="https://wa.me/62${String(I.wa).replace(/^0/, '')}">${ikon('wa')} Kontak Layanan WA</a>` : ''}</div>
      <div class="grid g-3 mt-2">${[['home', 'Rumah terdata', d.statistik.rumah], ['grid', 'Blok wilayah', d.blok.length], ['users', 'Jumlah jiwa', d.statistik.jiwa]].map(([i, l, v]) => `<div class="card kpi" style="box-shadow:none"><div class="ico">${ikon(i)}</div><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')}</div></div>
    ${d.visi || misi.length ? `<section class="section"><div class="section-h"><div><div class="eyebrow">Fondasi tata kelola</div><h2>Visi & Misi</h2></div></div><div class="split half">
      <div class="cta" style="display:block"><span class="pill-tag"><span class="dot"></span>Visi</span><h3>${esc(d.visi || '-')}</h3></div>
      <div class="grid g-2">${misi.map((m, i) => `<div class="card"><div class="mono muted">${String(i + 1).padStart(2, '0')}</div><p class="mt-1 mb-0">${esc(m)}</p></div>`).join('')}</div></div></section>` : ''}
    <section class="section"><div class="section-h"><div><div class="eyebrow">Dewan pengurus</div><h2>Susunan Pengurus</h2></div></div>
      ${d.pengurus.length ? `<div class="grid g-3">${d.pengurus.map(p => `<div class="card row"><span class="avatar" style="width:52px;height:52px;background:var(--navy)">${esc(inisial(p.nama))}</span><div><span class="badge ${/Ketua/.test(p.jabatan) ? 'penting' : 'info'}">${esc(p.jabatan)}</span><h3 class="mt-1" style="font-size:17px">${esc(p.nama)}</h3>${p.mulai ? `<div class="small muted">Masa bakti ${esc(String(p.mulai).substr(0, 4))}–${esc(String(p.selesai || '').substr(0, 4))}</div>` : ''}</div></div>`).join('')}</div>` : `<div class="card">${kosong('Susunan pengurus belum diisi.', 'users')}</div>`}</section>
    <section class="section"><div class="section-h"><div><div class="eyebrow">Zonasi lingkungan</div><h2>Cakupan Wilayah</h2></div></div>
      <div class="card"><div class="grid g-4">${d.blok.map(b => `<div class="card" style="box-shadow:none;text-align:center"><b style="font-size:20px">Blok ${esc(b.blok)}</b><div class="muted small">${b.jumlah} rumah</div></div>`).join('')}</div>
      <iframe title="Peta Gading Elok 1" loading="lazy" style="width:100%;height:280px;border:0;border-radius:12px;margin-top:16px" src="https://maps.google.com/maps?q=${encodeURIComponent('Perumahan Gading Elok 1 Karawang Wetan')}&z=15&output=embed"></iframe></div></section>`;
};

// ---------------- LOGIN ----------------
HalamanPublik.login = async el => {
  const I = Identitas.data;
  let mode = 'warga';
  el.innerHTML = `<div class="login-page">${bgGerbang()}<div class="login-box">
    <div class="login-brand"><div class="logo">${logoImg()}</div><h1 id="lg-judul">${esc(I.loginJudul || 'RT ONLINE')}</h1><div class="slogan">${esc(I.slogan || 'Rukun • Aman • Sejahtera')}</div><p>${esc(I.loginSambutan || '')}</p></div>
    <form class="login-card" id="lg-form" novalidate>
      <div class="seg mb-2" id="lg-seg"><button type="button" data-m="warga" class="on">${ikon('home', 'sm')} Warga</button><button type="button" data-m="pengurus">${ikon('users', 'sm')} Pengurus</button></div>
      <div id="lg-admin-tag" class="alert info mb-2 hidden">${ikon('shield')}<div><b>Login Administrator</b><br><span class="small">Khusus pengelola aplikasi.</span></div></div>
      <div id="lg-fields" class="stack"></div>
      <div class="field mt-2"><label for="lg-pw">Password</label><div class="pw-wrap"><input id="lg-pw" type="password" class="input" autocomplete="current-password" required><button type="button" class="pw-toggle" aria-label="Tampilkan password" onclick="togglePw(this)">${ikon('eye')}</button></div></div>
      <div id="lg-err" class="alert err mt-2 hidden"></div>
      <button class="btn btn-primary btn-block mt-2" id="lg-btn" type="submit">${ikon('login')} Masuk</button>
      <p class="small muted center mt-2 mb-0">Lupa password? Hubungi Administrator RT untuk reset.</p>
      <a href="#/" class="btn btn-ghost btn-block btn-sm mt-1">${ikon('left', 'sm')} Kembali ke portal</a>
    </form>
    <button class="login-admin" id="lg-adm">${ikon('shield', 'sm')} Masuk sebagai Administrator</button>
  </div></div>`;
  let blok = [];
  const isi = () => {
    $('#lg-admin-tag').classList.toggle('hidden', mode !== 'admin');
    $('#lg-seg').classList.toggle('hidden', mode === 'admin');
    $('#lg-adm').innerHTML = mode === 'admin' ? `${ikon('left', 'sm')} Kembali ke login warga/pengurus` : `${ikon('shield', 'sm')} Masuk sebagai Administrator`;
    if (mode === 'warga') {
      $('#lg-fields').innerHTML = `<div class="form-grid two"><div class="field"><label for="lg-blok">Blok</label><select id="lg-blok" class="input" required><option value="">Pilih blok…</option>${blok.map(b => `<option>${esc(b.blok)}</option>`).join('')}</select></div>
        <div class="field"><label for="lg-no">Nomor rumah</label><select id="lg-no" class="input" required><option value="">Pilih…</option></select></div></div>`;
      $('#lg-blok').onchange = e => { const b = blok.find(x => x.blok === e.target.value); $('#lg-no').innerHTML = '<option value="">Pilih…</option>' + (b ? b.nomor.map(n => `<option>${esc(n)}</option>`).join('') : ''); };
      const last = localStorage.getItem('rt_last_rumah');
      if (last) { const [b, n] = last.split('|'); $('#lg-blok').value = b; $('#lg-blok').onchange({ target: $('#lg-blok') }); $('#lg-no').value = n; }
    } else {
      $('#lg-fields').innerHTML = `<div class="field"><label for="lg-user">Username</label><input id="lg-user" class="input" autocomplete="username" autocapitalize="none" required></div>`;
    }
  };
  $$('#lg-seg button').forEach(b => b.onclick = () => { mode = b.dataset.m; $$('#lg-seg button').forEach(x => x.classList.toggle('on', x === b)); isi(); });
  $('#lg-adm').onclick = () => { mode = mode === 'admin' ? 'warga' : 'admin'; $$('#lg-seg button').forEach(x => x.classList.toggle('on', x.dataset.m === 'warga')); isi(); };
  isi();
  if (!cekKonfigurasi()) { $('#lg-err').innerHTML = ikon('alert') + '<div>URL backend belum diatur. Isi <b>GAS_URL</b> di <span class="mono">js/config.js</span>.</div>'; $('#lg-err').classList.remove('hidden'); }
  else apiPublik('daftarBlok', 60000).then(b => { blok = b; if (mode === 'warga') isi(); }).catch(() => { });
  apiPublik('publikBeranda').then(() => { }).catch(() => { });

  $('#lg-form').onsubmit = async e => {
    e.preventDefault();
    const err = $('#lg-err'); err.classList.add('hidden');
    const data = { mode, password: $('#lg-pw').value };
    if (mode === 'warga') { data.blok = $('#lg-blok').value; data.no = $('#lg-no').value; if (!data.blok || !data.no) { err.innerHTML = ikon('alert') + '<div>Pilih blok dan nomor rumah.</div>'; err.classList.remove('hidden'); return; } }
    else { data.username = $('#lg-user').value.trim(); if (!data.username) { err.innerHTML = ikon('alert') + '<div>Isi username.</div>'; err.classList.remove('hidden'); return; } }
    if (!data.password) { err.innerHTML = ikon('alert') + '<div>Isi password.</div>'; err.classList.remove('hidden'); return; }
    await sibuk($('#lg-btn'), async () => {
      try {
        const r = await api('login', data);
        Sesi.simpan(r.token, r.user);
        if (mode === 'warga') localStorage.setItem('rt_last_rumah', data.blok + '|' + data.no);
        _layout = null;
        location.hash = r.user.harusGantiPassword ? '#/panel/akun' : '#/panel/dashboard';
        toast('Selamat datang, ' + r.user.nama + '!');
      } catch (ex) { err.innerHTML = ikon('alert') + '<div>' + esc(ex.message) + '</div>'; err.classList.remove('hidden'); }
    });
  };
};
