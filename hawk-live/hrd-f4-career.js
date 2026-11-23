/* JAENS ERP · Portal HRD · F4 halaman karier publik (NV01 Landing, NV02 Detail Lowongan, NV03 Formulir Lamaran).
   Satu renderer dipakai dua tempat: karier.html (publik, tanpa login internal) dan pratinjau di dalam portal HRD.
   DATA DEMO / SIMULASI. Membaca hanya lowongan berstatus Dipublikasikan. */
const HRCAREER = (() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const qs = (o) => { const e = Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''); return e.length ? '?' + e.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') : ''; };
  const divName = (id) => HR.DIVISIONS.find(d => d.id === id)?.name || id;
  /* R = { land, job, apply } nama rute; hrefFor(route, params) */
  function landing(hr, p, R) {
    const all = HR4.publicVacancies(hr);
    const list = all.filter(v => (!p.division || HR.pos(v.position).division === p.division) && (!p.position || v.position === p.position) && (!p.outlet || v.location === p.outlet));
    const sel = (name, opts, cur, label) => `<label>${label}<select name="${name}"><option value="">Semua</option>${opts.map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
    return `<section class="card hr-career-hero"><p class="eyebrow">JAENS Spa · Karier</p><h2>Tumbuh bersama JAENS</h2><p>Lowongan aktif di Spa Ubud, Shanti, Triloka, Bisma dan Office Ubud. Lamar langsung tanpa akun. <span class="badge demo">DATA DEMO</span></p></section>
      <form id="filters" class="filters" aria-label="Filter lowongan" data-career-filter="1">${sel('division', [...new Set(all.map(v => HR.pos(v.position).division))].map(d => [d, divName(d)]), p.division, 'Divisi')}${sel('position', [...new Set(all.map(v => v.position))].map(x => [x, HR.pos(x).name]), p.position, 'Posisi')}${sel('outlet', [...new Set(all.map(v => v.location))].map(o => [o, HR.locName(o)]), p.outlet, 'Outlet / lokasi')}<button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>
      ${list.length ? `<div class="grid g3 hr-vacs">${list.map(v => `<a class="card hr-vac" href="${R.href(R.job, { id: v.id, ch: p.ch })}"><span class="status-chip planned">${esc(HR.locName(v.location))}</span><h3>${esc(v.title)}</h3><p class="small">${esc(divName(HR.pos(v.position).division))} · Shift ${esc(v.shift || '—')} · ${v.count} posisi</p><p class="small muted">Dibuka ${esc(v.published || '—')} · ${esc(v.id)}</p><span class="btn sm">Lihat & lamar ›</span></a>`).join('')}</div>`
        : `<section class="card hr-empty"><h2>Belum ada lowongan yang cocok</h2><p>Coba ubah filter atau kembali lagi nanti.</p><button type="button" class="btn" data-action="filter-reset">Reset filter</button></section>`}`;
  }
  function job(hr, p, R) {
    const v = hr.vacancies.find(x => x.id === p.id);
    if (!v || v.status === 'Draf' || v.status === 'Internal') return `<section class="card hr-empty"><h2>Lowongan tidak ditemukan</h2><p>Tautan tidak berlaku atau lowongan belum dipublikasikan.</p><a class="btn" href="${R.href(R.land, {})}">Lihat lowongan aktif</a></section>`;
    const closed = v.status === 'Ditutup', f = HR4.formOf(v.position), ch = HR4.CHANNELS[p.ch] ? p.ch : '';
    const url = `karier.html#job=${v.id}`;
    return `<p><a href="${R.href(R.land, { ch })}">‹ Semua lowongan</a></p>
      <section class="card"><span class="status-chip ${closed ? 'bad' : 'ready'}">${closed ? 'Tidak menerima lamaran' : 'Dibuka'}</span><h2>${esc(v.title)} · ${esc(HR.locName(v.location))}</h2>
      <p class="small">${esc(v.id)} · ${esc(divName(HR.pos(v.position).division))} · Shift ${esc(v.shift || '—')} · ${v.count} posisi${ch ? ` · kanal <b>${esc(ch)}</b> (${esc(HR4.CHANNELS[ch])})` : ''}</p>
      <h3>Tanggung jawab</h3><p>${esc(v.resp || '—')}</p>
      <h3>Kualifikasi</h3><ul>${f.criteria.map(c => `<li>${esc(c[1])}</li>`).join('')}</ul>
      ${closed ? `<p class="phase-banner">Lowongan ini ditutup ${esc(v.closed || '')}. Lamaran baru tidak diterima. Lihat lowongan lain yang masih dibuka.</p><a class="btn" href="${R.href(R.land, { ch })}">Lowongan aktif</a>` : `<a class="btn" href="${R.href(R.apply, { id: v.id, ch })}">Lamar sekarang</a>`}</section>
      <section class="card"><h3>Bagikan</h3><div class="hr-share"><div class="hr-qr" role="img" aria-label="QR simulasi untuk ${esc(v.id)}">${qrGrid(v.id)}</div><div><p class="small">Tautan: <code>${esc(url)}</code></p><p class="small">Website <code>&amp;ch=WEB</code> · Instagram <code>&amp;ch=IG</code> · QR outlet <code>&amp;ch=QR</code></p><p class="muted small">QR publik membutuhkan URL deployment yang dapat diakses kandidat (simulasi).</p></div></div></section>`;
  }
  /* pola kotak deterministik, bukan QR yang bisa dipindai */
  function qrGrid(id) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; let s = ''; for (let i = 0; i < 81; i++) { h = (h * 1103515245 + 12345) >>> 0; const r = Math.floor(i / 9), c = i % 9; const corner = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3); s += `<i class="${corner || (h >> 16) & 1 ? 'on' : ''}"></i>`; } return s; }
  function apply(hr, p, R, opts = {}) {
    if (p.done) { const a = HR4.appOf(hr, p.done); if (!a) return '<section class="card hr-empty"><h2>Lamaran tidak ditemukan</h2></section>'; const v = HR4.vacOf(hr, a.vac); return `<section class="card hr-done" role="status"><h2>Lamaran terkirim</h2><p>Terima kasih, <b>${esc(HR4.candOf(hr, a.cand).name)}</b>. Nomor lamaran <b>${esc(a.id)}</b> untuk ${esc(v.title)} · ${esc(HR.locName(v.location))}.</p><p class="small">Kanal: ${esc(a.channel)} · sumber yang Anda pilih: ${esc(a.sourceAnswer || '—')} · dikirim ${esc(a.submittedAt)} WITA.</p><p class="muted small">Konfirmasi email/WhatsApp: UI-ONLY SIMULATION. Kirim ulang formulir yang sama tidak membuat lamaran baru.</p><a class="btn" href="${R.href(R.land, {})}">Lowongan lain</a></section>`; }
    const v = hr.vacancies.find(x => x.id === p.id);
    if (!v || v.status !== 'Dipublikasikan') return `<section class="card hr-empty"><h2>Lowongan tidak menerima lamaran</h2><p>${v ? `${esc(v.id)} berstatus ${esc(v.status)}.` : 'Tautan tidak berlaku.'}</p><a class="btn" href="${R.href(R.land, {})}">Lihat lowongan aktif</a></section>`;
    const f = HR4.formOf(v.position), key = `K-${v.id}-${Date.now().toString(36)}`;
    const field = ([k, l, t]) => t === 'textarea' ? `<label class="wide">${esc(l)}<textarea name="${k}" rows="3"></textarea><small class="muted">Bisa diketik; jika menulis tangan, unggah fotonya di lampiran (tidak dinilai AI).</small></label>` : `<label>${esc(l)}<input name="${k}" ${t === 'number' ? 'type="number" min="0" step="1"' : ''}></label>`;
    const ivSlots = ['2026-11-17 10:00', '2026-11-17 14:00', '2026-11-18 10:00', '2026-11-18 14:00'];
    return `<p><a href="${R.href(R.job, { id: v.id, ch: p.ch })}">‹ Detail lowongan</a></p>
      <form class="card workflow-form hr-apply" data-submit="hr:app-submit" data-after="${opts.after || R.apply + '?done={id}'}" aria-label="Formulir lamaran ${esc(f.name)}">
      <h2>Lamar · ${esc(v.title)} · ${esc(HR.locName(v.location))}</h2><p class="small muted">Formulir ${esc(f.name)} · ${esc(v.id)} · semua waktu WITA</p>
      <input type="hidden" name="vac" value="${v.id}"><input type="hidden" name="ch" value="${esc(HR4.CHANNELS[p.ch] ? p.ch : 'WEB')}"><input type="hidden" name="submitKey" value="${key}">
      <fieldset><legend>Data diri</legend><label>Nama lengkap<input name="name" required minlength="3" autocomplete="name"></label><label>Email<input name="email" type="email" required autocomplete="email"></label><label>WhatsApp<input name="phone" autocomplete="tel"></label><label>Dari mana Anda tahu lowongan ini?<select name="sourceAnswer"><option>Instagram JAENS</option><option>Website</option><option>Poster di outlet</option><option>Teman / karyawan JAENS</option><option>Lainnya</option></select></label><label class="wide">Motivasi bergabung<textarea name="motivation" rows="2"></textarea></label></fieldset>
      <fieldset><legend>Pengalaman & situasi kerja</legend>${f.q.map(field).join('')}</fieldset>
      <fieldset><legend>Kesiapan</legend><label>Kesiapan shift<select name="shiftReady"><option>Pagi/Sore</option><option>Pagi</option><option>Sore</option><option>Tidak</option></select></label><label>Domisili<input name="location" placeholder="mis. Ubud"></label><label>Ekspektasi gaji (Rp)<input name="salary" type="number" min="0" step="50000"></label><label>Siap mulai<input name="startReady" type="date"></label><label>Pilihan jadwal interview (WITA)<select name="ivPref">${ivSlots.map(s => `<option>${s}</option>`).join('')}</select></label></fieldset>
      <fieldset><legend>Lampiran (sintetis)</legend><label class="wide">Nama file, pisahkan koma<input name="docs" value="cv.pdf" required></label><p class="muted small">CV wajib. PDF/JPG/PNG maks 5 MB. Foto, KTP, ciri tulisan tangan dan asesmen kepribadian tidak dipakai dalam penilaian AI.</p><label class="check"><input type="checkbox" name="consent" value="1"> Saya setuju data diproses untuk rekrutmen JAENS.</label></fieldset>
      <div class="hr-review-box" hidden><h3>Tinjau sebelum kirim</h3><dl></dl></div>
      <div class="actions"><button type="button" class="btn ghost" data-career-review="1">Tinjau jawaban</button><button class="btn" data-career-send hidden>Kirim lamaran</button></div></form>`;
  }
  /* tinjau sebelum kirim: tombol kirim muncul setelah ringkasan ditampilkan */
  if (typeof document !== 'undefined') document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-career-review]'); if (!b) return;
    const form = b.closest('form'), box = form.querySelector('.hr-review-box'), dl = box.querySelector('dl');
    const skip = ['vac', 'ch', 'submitKey'];
    dl.innerHTML = [...new FormData(form)].filter(([k]) => !skip.includes(k)).map(([k, v]) => `<dt>${esc(form.querySelector(`[name="${k}"]`)?.closest('label')?.childNodes[0]?.textContent?.trim() || k)}</dt><dd>${esc(v || '—')}</dd>`).join('');
    box.hidden = false; form.querySelector('[data-career-send]').hidden = false; box.scrollIntoView?.({ block: 'nearest' });
  });
  return { landing, job, apply, esc, qs };
})();
if (typeof module !== 'undefined') module.exports = HRCAREER;
