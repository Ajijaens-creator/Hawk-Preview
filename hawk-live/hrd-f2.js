/* JAENS ERP · Portal HRD · F2 Operasi HRD & Direktori — DATA DEMO / SIMULASI.
   F2-NV01 Direktori (hrd-roster) · NV02 Detail Karyawan (hrd-roster?emp=) · NV03 Jadwal Kerja · NV04 Presensi ·
   NV05 Approval Presensi · NV06 Izin & Cuti · NV07 Approval · NV08 Kunjungan Klien · NV09 Pelacakan Lokasi ·
   NV10 Klien · NV11 Timeline · NV12 Impor Karyawan. Model: hrd-f2-model.js (HR2). */
(() => {
const H = window.HL;
const { esc, num, rp, table, card, metrics, qs, link } = H;
const hr = () => { const h = HR.ensure(H.state); HR2.ensure(h); return h; };
const f2 = () => hr().f2;
const role = () => H.prefs.role;
const def = () => HR.roleDef(role());
const can = (p) => HR.can(role(), p);
const chip = (t, tone = '') => `<span class="status-chip ${tone}">${esc(t)}</span>`;
const person = (id) => hr().people.find(p => p.id === id);
const empName = (id) => person(id)?.name || id;
const empLink = (id) => HR.inScope(hr(), role(), id) ? `<a href="#hrd-roster${qs({ emp: id })}">${esc(empName(id))}</a>` : esc(empName(id));
const tabs = (route, cur, list, params = {}, key = 'tab') => `<nav class="tabs" aria-label="Bagian">${list.map(([k, l]) => `<a class="tab${k === cur ? ' on' : ''}" href="#${route}${qs({ ...params, [key]: k })}" ${k === cur ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
const STATUS_TONE = { Hadir: 'ready', Terlambat: 'sandbox', Cuti: 'planned', Izin: 'planned', Sakit: 'planned', Libur: '', 'Belum Ada Status': 'bad', 'Menunggu Persetujuan': 'sandbox', Disetujui: 'ready', Ditolak: 'bad' };
const st = (s) => chip(s, STATUS_TONE[s] || '');
const inScopeList = () => HR.people(hr(), role());
const denied = (perm) => `<section class="card hr-denied" role="alert"><h2>Akses ditolak</h2><p>Role demo <b>${esc(def().label)}</b> tidak punya izin <b>${esc(HR.PERM_LABEL[perm] || perm)}</b>. Tidak ada data yang dimuat.</p><div class="actions"><button type="button" class="btn" data-hr-role="hrd">Ganti ke Manager HRD</button><button type="button" class="btn ghost" data-hr-role="hrd-ops">Ganti ke Staf HRD</button></div></section>`;
const guard = (perm, fn) => (p) => [].concat(perm).some(x => can(x)) ? fn(p) : denied([].concat(perm)[0]);
const ESS = ['people', 'ess'];
const register = (id, fn, title) => { H.REGISTRY[id] = fn; fn.title = title; };
const empty = (title, body, reset = true) => `<section class="card hr-empty"><h2>${title}</h2><p>${body}</p>${reset ? '<button type="button" class="btn" data-action="filter-reset">Reset filter</button>' : ''}</section>`;
const outletOpts = (cur, all = 'Semua lokasi') => `<option value="">${all}</option>${[...HR.OUTLETS, HR.HQ].filter(o => inScopeList().some(p => p.placement.location === o.id)).map(o => `<option value="${o.id}" ${o.id === cur ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}`;
const empOpts = (cur, filter = () => true) => inScopeList().filter(filter).map(p => `<option value="${p.id}" ${p.id === cur ? 'selected' : ''}>${p.id} · ${esc(p.name)}</option>`).join('');
H.HOOKS.shiftOf = (emp) => HR2.scheduleOn(hr(), emp, HR.TODAY)?.shift || person(emp)?.shift;

/* ---------- sidebar: F2 menjadi tersedia ---------- */
const items = H.PORTALS.HRD.items;
const set = (route, code, title) => { const it = items.find(i => i[0] === route); if (it) { it[2] = code; it[3] = 'ready'; it[4] = ''; if (title) it[1] = title; } };
set('hrd-roster', 'F2-NV01'); set('hrd-attendance', 'F2-NV04'); set('hrd-att-approval', 'F2-NV05'); set('hrd-schedule', 'F2-NV03'); set('hrd-presence', 'F2-NV04'); set('hrd-leave', 'F2-NV06');
set('hrd-visit', 'F2-NV08'); set('hrd-tracking', 'F2-NV09'); set('hrd-approval', 'F2-NV07'); set('hrd-timeline', 'F2-NV11'); set('hrd-clients', 'F2-NV10');
const ix = items.findIndex(i => i[0] === 'hrd-roster');
items.splice(ix + 1, 0, ['hrd-import', 'Impor Karyawan', 'F2-NV12', 'ready', '', 'sub'], ['hrd-employee-new', 'Tambah Karyawan', 'F2-NV01', 'hidden']);
Object.assign(H.PURPOSE, {
  'hrd-roster': 'Direktori karyawan: cari nama/ID, filter outlet, divisi, posisi, shift dan status. Tab Informasi Pribadi, Kontak, Kepegawaian dan Login ESS.',
  'hrd-schedule': 'Jadwal tetap dan shift per orang/outlet, tanggal efektif, penugasan tambahan dengan cek konflik, dan riwayat.',
  'hrd-presence': 'Presensi Harian dan Ringkasan: masuk/keluar, istirahat, lembur, keterlambatan dan bukti. Koreksi melalui approval.',
  'hrd-attendance': 'Presensi Harian dan Ringkasan: masuk/keluar, istirahat, lembur, keterlambatan dan bukti. Koreksi melalui approval.',
  'hrd-att-approval': 'Antrean koreksi presensi: bukti, nilai sebelum/sesudah, PIC, keputusan dan histori.',
  'hrd-leave': 'Saldo, kategori, pengajuan, kalender dan riwayat Izin & Cuti. Pengajuan masuk ke Approval dengan Request ID yang sama.',
  'hrd-approval': 'Antrean persetujuan lintas jenis pengajuan dengan PIC, tahapan, keputusan dan alasan.',
  'hrd-visit': 'Daftar dan detail kunjungan klien: petugas, lokasi, waktu masuk/keluar dan bukti.',
  'hrd-tracking': 'Riwayat titik lokasi yang ditautkan ke presensi atau kunjungan, sesuai izin. Koordinat sintetis.',
  'hrd-clients': 'Direktori klien dummy, wilayah, status, kontak sesuai izin dan histori kunjungan.',
  'hrd-timeline': 'Pengumuman, agenda dan aktivitas HRD yang boleh dilihat, dengan tautan ke objek asal.',
  'hrd-import': 'Pilih file dummy, petakan kolom, pratinjau validasi, konfirmasi dan hasil per baris.',
  'hrd-employee-new': 'Tambah satu karyawan dengan penempatan dan tanggal mulai.'
});
H.SCREENS.push(...[['F2-NV01', 'Direktori Karyawan', 'hrd-roster'], ['F2-NV02', 'Detail Karyawan', 'hrd-roster?emp=EMP-0001'], ['F2-NV03', 'Jadwal Kerja', 'hrd-schedule'], ['F2-NV04', 'Presensi', 'hrd-presence'], ['F2-NV05', 'Approval Presensi', 'hrd-att-approval'], ['F2-NV06', 'Izin & Cuti', 'hrd-leave'], ['F2-NV07', 'Approval', 'hrd-approval'], ['F2-NV08', 'Kunjungan Klien', 'hrd-visit'], ['F2-NV09', 'Pelacakan Lokasi', 'hrd-tracking'], ['F2-NV10', 'Klien', 'hrd-clients'], ['F2-NV11', 'Timeline', 'hrd-timeline'], ['F2-NV12', 'Impor Karyawan', 'hrd-import']].map(([c, t, r]) => [c, 'HRD · ' + t, 'HRD 2', r, 'ready', 'Staf HRD, Manager HRD, Supervisor']));

/* ---------- NV02 Detail Karyawan: tab di bawah profil F1 ---------- */
const baseRoster = H.REGISTRY['hrd-roster'];
function detailTabs(params) {
  const h = hr(), e = person(params.emp); if (!e || !HR.inScope(h, role(), e.id)) return '';
  const tab = ['pribadi', 'kontak', 'kepegawaian', 'dokumen', 'jadwal', 'ess'].includes(params.dtab) ? params.dtab : 'kepegawaian';
  const keep = { ...params }; delete keep.dtab;
  const pl = HR.placementOn(h, e.id) || HR.upcomingOf(h, e.id), write = ['hrd', 'hrd-ops'].includes(role());
  let body = '';
  if (tab === 'pribadi') body = table(['Field', 'Nilai'], [['Nama', esc(e.name)], ['Jenis kelamin', e.gender === 'L' ? 'Laki-laki' : 'Perempuan'], ['Tahun lahir', e.birth || '—'], ['Agama', esc(e.religion)], ['Pendidikan', esc(e.education)], ['Status perkawinan', esc(e.marital)]]);
  else if (tab === 'kontak') body = table(['Field', 'Nilai'], [['Telepon', esc(e.phone || '—')], ['Email kerja', `${e.id.toLowerCase()}@example.invalid`], ['Alamat', 'Gianyar, Bali (sintetis)'], ['Kontak darurat', can('settings.view') ? 'Keluarga · 08xx (sintetis)' : '<i>Sesuai izin</i>']]);
  else if (tab === 'kepegawaian') {
    const hist = h.placements.filter(x => x.emp === e.id).sort((a, b) => b.from.localeCompare(a.from));
    body = table(['Assignment ID', 'Lokasi', 'Posisi', 'Mulai efektif', 'Akhir', 'Alasan'], hist.map(x => [x.id, esc(HR.locName(x.location)), esc(HR.pos(x.position).name), x.from, x.to || (x.from > HR.TODAY ? 'terjadwal' : 'aktif'), esc(x.reason || '—')])) +
      table(['Kontrak', 'Mulai', 'Status'], [[esc(e.contract), e.joined, e.contract === 'PKWTT' ? chip('Tetap', 'ready') : chip('Berjalan', 'sandbox')]]) +
      (write ? `<h3>Ubah penempatan (tanggal efektif)</h3><form class="workflow-form" data-submit="hr:placement-change"><input type="hidden" name="emp" value="${e.id}"><label>Lokasi baru<select name="location">${[...HR.OUTLETS, HR.HQ].map(o => `<option value="${o.id}" ${o.id === pl.location ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label><label>Posisi<select name="position">${HR.POSITIONS.map(p => `<option value="${p.id}" ${p.id === pl.position ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label><label>Efektif mulai<input type="date" name="from" value="${HR2.addDays(HR.TODAY, 1)}" required></label><label>Alasan<input name="reason" placeholder="mis. Mutasi outlet"></label><button class="btn">Simpan penempatan</button></form><p class="muted small">Penempatan lama tetap berlaku sampai sehari sebelum tanggal efektif. Perubahan tercatat di Audit Aktivitas.</p>` : '') +
      (def().payroll === 'detail' ? `<p class="small">Payroll: take-home pay contoh ${rp(e.thp)} · detail komponen di HRD F7.</p>` : '<p class="muted small">Informasi payroll khusus Manager HRD (HRD F7).</p>');
  } else if (tab === 'dokumen') body = table(['Dokumen', 'Versi', 'Status', 'Akses'], [['KTP (sintetis)', 'v1', chip('Terverifikasi', 'ready'), can('settings.view') ? 'HRD' : '<i>Dibatasi</i>'], [`Kontrak ${e.contract} (sintetis)`, 'v1', chip('Ditandatangani', 'ready'), 'HRD, karyawan'], ['Sertifikat keahlian (sintetis)', 'v1', chip('Menunggu verifikasi', 'sandbox'), 'HRD, HG']]) + '<p class="muted small">Dokumen dummy. Penyimpanan dokumen & tanda tangan: NEW INTEGRATION REQUIRED.</p>';
  else if (tab === 'jadwal') {
    const sch = h.f2.schedules.filter(s => s.emp === e.id).sort((a, b) => b.from.localeCompare(a.from));
    const sum = HR2.summary(h, [e.id])[0];
    body = table(['Shift ID', 'Jenis', 'Shift', 'Mulai', 'Akhir'], sch.map(s => [s.id, s.kind, `${s.shift} ${HR2.SHIFTS[s.shift].join('–')}`, s.from, s.to || '—'])) + `<p class="small">Presensi 7–13 Nov: hadir ${sum.hadir}, terlambat ${sum.terlambat}, jam kerja ${num(sum.hours, 1)}, lembur ${sum.otMin} menit. ${link('hrd-presence' + qs({ tab: 'summary', q: e.id }), 'Buka Ringkasan')}</p>`;
  } else body = table(['Field', 'Nilai'], [['User ID', e.id], ['Role', esc(h.accounts.find(a => a.emp === e.id)?.role === 'ess' ? 'Karyawan (ESS)' : HR.roleDef(h.accounts.find(a => a.emp === e.id)?.role).label)], ['Status ESS', chip('Aktif', 'ready')], ['Login terakhir', '2026-11-13 08:52 WITA (simulasi)'], ['Kredensial', '<i>Tidak pernah ditampilkan</i>']]);
  return `<section class="card hr-dtabs"><h2>Detail Karyawan · F2-NV02</h2>${tabs('hrd-roster', tab, [['pribadi', 'Informasi Pribadi'], ['kontak', 'Kontak'], ['kepegawaian', 'Kepegawaian & Kontrak'], ['dokumen', 'Dokumen'], ['jadwal', 'Jadwal & Presensi'], ['ess', 'Akun ESS']], keep, 'dtab')}${body}</section>`;
}
const rosterF2 = (params) => { const base = baseRoster(params); return params.emp ? base + detailTabs(params) : base; };
register('hrd-roster', rosterF2, (pr) => pr.emp ? 'Detail Karyawan' : 'Direktori Karyawan');
rosterF2.code = (pr) => pr.emp ? 'F2-NV02' : 'F2-NV01';
rosterF2.purpose = (pr) => pr.emp ? 'Profil, penempatan efektif dan histori, kontrak, dokumen, jadwal & presensi, serta akun ESS satu karyawan.' : null;
register('hrd-employee-new', guard('people', () => ['hrd', 'hrd-ops'].includes(role()) ? card('Tambah karyawan', `<form class="workflow-form" data-submit="hr:employee-add" data-after="hrd-roster?emp={id}"><label>Nama<input name="name" required minlength="3"></label><label>Posisi<select name="position">${HR.POSITIONS.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label><label>Lokasi<select name="location">${[...HR.OUTLETS, HR.HQ].map(o => `<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select></label><label>Shift<select name="shift"><option>Pagi</option><option>Sore</option><option>Kantor</option></select></label><label>Mulai<input type="date" name="from" value="${HR2.addDays(HR.TODAY, 1)}"></label><label>Telepon<input name="phone"></label><button class="btn">Simpan</button><a class="btn ghost" href="#hrd-roster">Batal</a></form><p class="muted small">Nama yang sudah ada ditolak sebagai duplikat. Untuk banyak baris gunakan ${link('hrd-import', 'Impor Karyawan')}.</p>`) : denied('people')), () => 'Tambah Karyawan');

/* ---------- NV03 Jadwal Kerja ---------- */
function schedule(params) {
  const h = hr(), date = params.date || HR2.addDays(HR.TODAY, 1), out = params.outlet || '';
  const list = inScopeList().filter(p => !out || p.placement.location === out);
  const rows = list.slice(0, 60).map(p => {
    const s = HR2.scheduleOn(h, p.id, date), ex = HR2.extrasOn(h, p.id, date), next = h.f2.schedules.find(x => x.emp === p.id && x.kind === 'tetap' && x.from > date);
    return [p.id, empLink(p.id), esc(HR.locName(p.placement.location)), s ? (HR2.dow(date) === s.off ? chip('Libur') : `${s.shift} ${HR2.SHIFTS[s.shift].join('–')}`) : '—', s ? `${s.from}` : '—', ex.map(x => `${x.shift} · ${esc(HR.locName(x.outlet))}`).join('<br>') || '—', next ? `${next.shift} mulai ${next.from}` : '—'];
  });
  const write = can('people') && ['hrd', 'hrd-ops', 'outlet-spv', 'ops-manager'].includes(role());
  return `<form id="filters" class="filters" aria-label="Filter jadwal"><label>Tanggal<input type="date" name="date" value="${date}"></label><label>Outlet / lokasi<select name="outlet">${outletOpts(out)}</select></label><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    (write ? `<div class="grid g2">${card('Ubah shift tetap (tanggal efektif)', `<form class="workflow-form" data-submit="hr:shift-change"><label>Karyawan<select name="emp">${empOpts(params.emp)}</select></label><label>Shift baru<select name="shift"><option>Pagi</option><option>Sore</option><option>Kantor</option></select></label><label>Efektif mulai<input type="date" name="from" value="${HR2.addDays(HR.TODAY, 1)}" required></label><button class="btn">Simpan</button></form><p class="muted small">Jadwal sebelum tanggal efektif dipertahankan.</p>`)}${card('Penugasan tambahan', `<form class="workflow-form" data-submit="hr:shift-assign"><label>Karyawan<select name="emp">${empOpts(params.emp)}</select></label><label>Tanggal<input type="date" name="date" value="${HR2.addDays(HR.TODAY, 1)}" required></label><label>Shift<select name="shift"><option>Malam</option><option>Pagi</option><option>Sore</option></select></label><label>Outlet<select name="outlet">${HR.OUTLETS.map(o => `<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select></label><button class="btn">Cek konflik & simpan</button></form><p class="muted small">Pratinjau konflik: penugasan yang tumpang tindih dengan shift terjadwal ditolak dengan alasan.</p>`)}</div>` : '') +
    (rows.length ? card(`Jadwal ${date} (${HR2.DOW[HR2.dow(date)]}) · ${list.length} orang${list.length > 60 ? ', 60 pertama' : ''}`, table(['Employee ID', 'Nama', 'Lokasi', 'Shift tetap', 'Berlaku sejak', 'Penugasan tambahan', 'Perubahan berikutnya'], rows)) : empty('Tidak ada jadwal', 'Tidak ada orang di filter ini.'));
}

/* ---------- NV04 Presensi ---------- */
function presence(params) {
  const h = hr(), tab = params.tab === 'summary' ? 'summary' : 'daily';
  const date = params.date || HR.TODAY, out = params.outlet || '', shift = params.shift || '', q = (params.q || '').toLowerCase();
  const list = inScopeList().filter(p => (!out || p.placement.location === out) && (!q || `${p.id} ${p.name}`.toLowerCase().includes(q)));
  const dates = [...HR2.DAYS, ...[1, 2, 3].map(k => HR2.addDays(HR.TODAY, k))];
  const fil = `<form id="filters" class="filters" aria-label="Filter presensi">${tab === 'daily' ? `<label>Tanggal<select name="date">${dates.map(d => `<option ${d === date ? 'selected' : ''}>${d}</option>`).join('')}</select></label>` : ''}<label>Outlet<select name="outlet">${outletOpts(out)}</select></label>${tab === 'daily' ? `<label>Shift<select name="shift"><option value="">Semua shift</option>${['Pagi', 'Sore', 'Kantor'].map(s => `<option ${s === shift ? 'selected' : ''}>${s}</option>`).join('')}</select></label>` : ''}<input type="hidden" name="tab" value="${tab}">${params.q ? `<input type="hidden" name="q" value="${esc(params.q)}">` : ''}<button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>`;
  const head = tabs('hrd-presence', tab, [['daily', 'Harian'], ['summary', 'Ringkasan 7–13 Nov']], { outlet: out || undefined, q: params.q });
  if (tab === 'summary') {
    const rows = HR2.summary(h, list.map(p => p.id));
    return head + fil + (rows.length ? card(`Ringkasan · ${rows.length} orang`, table(['Employee ID', 'Nama', 'Hadir', 'Terlambat', 'Menit telat', 'Cuti', 'Sakit', 'Libur', 'Belum ada status', 'Jam kerja', 'Lembur (menit)', 'Terkoreksi'], rows.slice(0, 80).map(r => [r.emp, empLink(r.emp), r.hadir, r.terlambat, r.lateMin, r.cuti, r.sakit, r.libur, r.belum, num(r.hours, 1), r.otMin, r.corrected ? chip(r.corrected + ' disetujui', 'ready') : '—'])) + '<p class="muted small">Ringkasan memakai hasil persetujuan yang sama dengan Harian. Koreksi menunggu review belum mengubah nilai.</p>') : empty('Tidak ada data', 'Filter tidak menemukan orang.'));
  }
  const recs = list.map(p => HR2.attendance(h, p.id, date)).filter(r => !shift || r.shift === shift);
  const corr = params.correct && recs.find(r => r.id === params.correct);
  const cnt = (s) => recs.filter(r => r.status === s).length;
  return head + fil + metrics([['Hadir', cnt('Hadir')], ['Terlambat', cnt('Terlambat')], ['Cuti / sakit / libur', cnt('Cuti') + cnt('Sakit') + cnt('Libur')], ['Belum Ada Status', cnt('Belum Ada Status'), date > HR.TODAY ? 'Tanggal mendatang: jadwal saja' : '']]) +
    (corr ? card(`Ajukan koreksi · ${corr.id}`, `<form class="workflow-form" data-submit="hr:att-correct" data-after="hrd-att-approval?id={id}"><input type="hidden" name="emp" value="${corr.emp}"><input type="hidden" name="date" value="${corr.date}"><p>${esc(empName(corr.emp))} · nilai saat ini masuk <b>${corr.in || '—'}</b>, keluar <b>${corr.out || '—'}</b></p><label>Jam masuk benar<input name="in" placeholder="09:00" required pattern="\\d{2}:\\d{2}"></label><label>Jam keluar benar (opsional)<input name="out" placeholder="17:00"></label><label>Alasan<input name="reason" required minlength="5"></label><button class="btn">Kirim ke Approval</button><a class="btn ghost" href="#hrd-presence${qs({ date })}">Batal</a></form>`) : '') +
    (recs.length ? card(`Harian ${date} · ${recs.length} orang`, table(['Attendance ID', 'Nama', 'Shift', 'Status', 'Masuk', 'Keluar', 'Istirahat', 'Lembur', 'Terlambat', 'Bukti', 'Aksi'], recs.slice(0, 80).map(r => [r.id, empLink(r.emp), r.shift, st(r.status) + (r.provisional ? ' ' + chip('Koreksi menunggu review', 'sandbox') : '') + (r.corrected ? ' ' + chip('Terkoreksi ' + r.corrected.req, 'ready') : ''), r.in || '—', r.out || '—', r.breakMin ? r.breakMin + ' mnt' : '—', r.otMin ? r.otMin + ' mnt' : '—', r.late ? r.late + ' mnt' : '—', esc(r.evidence || '—'), date <= HR.TODAY && !r.provisional && r.status !== 'Libur' ? `<a class="btn ghost sm" href="#hrd-presence${qs({ date, outlet: out || undefined, correct: r.id })}">Ajukan koreksi</a>` : '—'])) + (recs.length > 80 ? '<p class="muted small">80 baris pertama. Persempit dengan filter outlet/shift.</p>' : '')) : empty('Tidak ada data', 'Filter tidak menemukan orang.'));
}

/* ---------- NV05 / NV07 Approval ---------- */
function requestDetail(q) {
  const h = hr(), mine = HR2.canDecide(h, role(), q);
  const pl = q.payload || {};
  const body = q.type === 'Koreksi presensi' ? table(['', 'Masuk', 'Keluar'], [['Sebelum', pl.before?.in || '—', pl.before?.out || '—'], ['Sesudah (diajukan)', pl.after?.in || '—', pl.after?.out || '—']]) + `<p class="small">Attendance ID ${esc(pl.att)} · bukti: ${esc(pl.evidence || '—')} · ${link('hrd-presence' + qs({ date: pl.date || q.date }), 'buka Presensi')}</p>`
    : pl.cat ? `<p>${esc(q.type)} · ${pl.from} s/d ${pl.to} (${pl.days} hari) · ${link('hrd-leave' + qs({ emp: q.emp }), 'saldo karyawan')}</p>` : `<p>${esc(q.note || '')}</p>`;
  return card(`${q.id} · ${esc(q.type)} · ${st(q.status)}`, `<p>Karyawan ${empLink(q.emp)} · dibuat ${esc(q.created)} · kebijakan ${esc(q.policy)}</p>${body}
    <h3>Tahapan</h3>${table(['#', 'Tahap / PIC', 'Keputusan', 'Oleh', 'Waktu (WITA)', 'Alasan'], q.stages.map((s, i) => [i + 1, esc(s.label) + (i === q.stage && q.status === 'Menunggu Persetujuan' ? ' ' + chip('Tahap aktif', 'sandbox') : ''), s.decision ? st(s.decision) : '—', esc(s.by || '—'), esc(s.at || '—'), esc(s.reason || '—')]))}
    ${q.status === 'Menunggu Persetujuan' ? (mine ? `<div class="actions"><button type="button" class="btn" data-action="hr:decide" data-id="${q.id}" data-decision="approve">Setujui tahap ini</button><form class="inline-form" data-submit="hr:decide"><input type="hidden" name="id" value="${q.id}"><input type="hidden" name="decision" value="reject"><label class="sr" for="rj-${q.id}">Alasan tolak</label><input id="rj-${q.id}" name="reason" placeholder="Alasan penolakan" required minlength="5"><button class="btn ghost sm">Tolak</button></form></div>` : `<p class="muted small">Tahap aktif "${esc(q.stages[q.stage].label)}" bukan wewenang ${esc(def().label)}.</p>`) : ''}
    <p class="muted small">${link('hrd-audit' + qs({ q: q.id }), 'Jejak audit ' + q.id)}</p>`);
}
function inbox(params, onlyType) {
  const h = hr(), ids = new Set(inScopeList().map(p => p.id));
  if (params.id) { const q = h.queue.find(x => x.id === params.id); return q && ids.has(q.emp) ? requestDetail(q) + link(onlyType ? 'hrd-att-approval' : 'hrd-approval', '‹ Kembali ke antrean') : denied('people'); }
  const status = params.status || 'Menunggu Persetujuan', type = onlyType || params.type || '';
  const types = [...new Set(h.queue.map(q => q.type))];
  const list = h.queue.filter(q => ids.has(q.emp) && (!type || q.type === type) && (status === 'all' || q.status === status));
  const route = onlyType ? 'hrd-att-approval' : 'hrd-approval';
  return `<form id="filters" class="filters" aria-label="Filter approval"><label>Status<select name="status">${[['Menunggu Persetujuan', 'Menunggu Persetujuan'], ['Disetujui', 'Disetujui'], ['Ditolak', 'Ditolak'], ['all', 'Semua']].map(([v, l]) => `<option value="${v}" ${v === status ? 'selected' : ''}>${l}</option>`).join('')}</select></label>${onlyType ? '' : `<label>Jenis<select name="type"><option value="">Semua jenis</option>${types.map(t => `<option ${t === type ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`}<button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    (list.length ? card(`${onlyType ? 'Koreksi presensi' : 'Pengajuan'} · ${list.length}`, table(['Request ID', 'Karyawan', 'Jenis', 'Keterangan', 'Tahap aktif / PIC', 'Progres', 'Status', 'Bisa diputuskan'], list.map(q => [`<a href="#${route}${qs({ id: q.id })}">${q.id}</a>`, empLink(q.emp), esc(q.type), esc(q.note || ''), q.status === 'Menunggu Persetujuan' ? esc(q.stages[q.stage].label) : '—', `${q.stages.filter(s => s.decision === 'Disetujui').length}/${q.stages.length}`, st(q.status), HR2.canDecide(h, role(), q) ? chip('Ya', 'ready') : '—']))) : empty('Antrean kosong', 'Tidak ada pengajuan untuk filter ini.'));
}

/* ---------- NV06 Izin & Cuti ---------- */
function leave(params) {
  const h = hr(), tab = ['balance', 'request', 'calendar', 'history', 'policy'].includes(params.tab) ? params.tab : 'balance';
  const emp = params.emp && HR.inScope(h, role(), params.emp) ? params.emp : (h.roleEmp[role()] && HR.inScope(h, role(), h.roleEmp[role()]) ? h.roleEmp[role()] : inScopeList()[0]?.id);
  const head = tabs('hrd-leave', tab, [['balance', 'Saldo'], ['request', 'Ajukan'], ['calendar', 'Kalender'], ['history', 'Riwayat'], ['policy', 'Kebijakan']], { emp });
  const pick = `<form id="filters" class="filters"><label>Karyawan<select name="emp">${empOpts(emp)}</select></label><input type="hidden" name="tab" value="${tab}"></form>`;
  const leaves = h.queue.filter(q => q.payload?.cat && HR.inScope(h, role(), q.emp));
  let body = '';
  if (tab === 'balance') body = card(`Saldo 2026 · ${esc(empName(emp))}`, table(['Kategori', 'Kuota', 'Terpakai (disetujui)', 'Menunggu', 'Sisa'], HR2.balance(h, emp).map(b => [esc(b.name), b.quota ?? 'Tanpa kuota', b.used, b.pending, b.left ?? '—'])) + '<p class="muted small">Saldo dihitung dari ledger: hanya pengajuan yang disetujui mengurangi saldo. Penolakan tidak mengubah saldo.</p>');
  else if (tab === 'request') body = card('Ajukan izin / cuti', `<form class="workflow-form" data-submit="hr:leave-request" data-after="hrd-approval?id={id}"><label>Karyawan<select name="emp">${empOpts(emp)}</select></label><label>Kategori<select name="cat">${HR2.LEAVE.filter(c => !c.auto).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></label><label>Dari<input type="date" name="from" value="${HR2.addDays(HR.TODAY, 7)}" required></label><label>Sampai<input type="date" name="to" value="${HR2.addDays(HR.TODAY, 7)}" required></label><label>Alasan<input name="reason"></label><button class="btn">Kirim ke Approval</button></form><p class="muted small">Pengajuan yang bertabrakan dengan cuti menunggu/disetujui ditolak. Cuti Libur Nasional berasal dari kalender perusahaan.</p>`);
  else if (tab === 'calendar') {
    const days = []; for (let d = '2026-11-01'; d <= '2026-11-30'; d = HR2.addDays(d, 1)) days.push(d);
    const hol = h.settings.calendar;
    body = card('Kalender November 2026', `<div class="hr-cal">${days.map(d => { const ls = leaves.filter(q => q.payload.from <= d && q.payload.to >= d && q.status !== 'Ditolak'); const hl = hol.find(c => c.date === d); return `<div class="hr-cal-d${d === HR.TODAY ? ' today' : ''}"><b>${+d.slice(8)}</b>${hl ? `<small>${esc(hl.name)}</small>` : ''}${ls.map(q => `<a href="#hrd-approval${qs({ id: q.id })}" class="small">${esc(empName(q.emp).split(' ')[0])} · ${q.status === 'Disetujui' ? '✓' : '…'}</a>`).join('')}</div>`; }).join('')}</div>`);
  } else if (tab === 'history') body = card('Riwayat pengajuan', leaves.length ? table(['Request ID', 'Karyawan', 'Kategori', 'Periode', 'Hari', 'Status'], leaves.map(q => [link('hrd-approval' + qs({ id: q.id }), q.id), empLink(q.emp), esc(q.type), `${q.payload.from} s/d ${q.payload.to}`, q.payload.days, st(q.status)])) : '<p>Belum ada pengajuan cuti di cakupan ini.</p>');
  else body = card('Kebijakan Izin & Cuti', table(['Kategori', 'Kuota/tahun', 'Butuh dokumen', 'Approval'], HR2.LEAVE.map(c => [c.name, c.quota ?? '—', c.doc ? 'Ya' : 'Tidak', c.auto ? 'Kalender perusahaan' : esc(h.settings.approval.find(a => a.id === 'APR-LEAVE').chain.join(' → '))])));
  return head + (['balance'].includes(tab) ? pick : '') + body;
}

/* ---------- NV08 Kunjungan · NV09 Pelacakan · NV10 Klien ---------- */
const client = (id) => f2().clients.find(c => c.id === id);
const visitsVisible = () => f2().visits.filter(v => HR.inScope(hr(), role(), v.emp));
function visitDetail(v) {
  const t = f2().tracks.find(x => x.id === v.track);
  return card(`${v.id} · ${esc(client(v.client)?.name)}`, table(['Field', 'Nilai'], [['Visit ID', v.id], ['Petugas', empLink(v.emp)], ['Klien', link('hrd-clients' + qs({ id: v.client }), esc(client(v.client)?.name))], ['Tanggal', v.date], ['Masuk / keluar (WITA)', `${v.in} – ${v.out}`], ['Bukti', esc(v.evidence)], ['Catatan', esc(v.note)], ['Titik lokasi', t ? link('hrd-tracking' + qs({ id: t.id }), `${t.id} · ${t.validation}`) : '—']]));
}
function visits(params) {
  if (params.id) { const v = visitsVisible().find(x => x.id === params.id); return v ? visitDetail(v) + link('hrd-visit', '‹ Daftar kunjungan') : denied('people'); }
  const list = visitsVisible().filter(v => (!params.client || v.client === params.client) && (!params.date || v.date === params.date));
  return `<form id="filters" class="filters"><label>Tanggal<input type="date" name="date" value="${esc(params.date || '')}"></label><label>Klien<select name="client"><option value="">Semua klien</option>${f2().clients.map(c => `<option value="${c.id}" ${c.id === params.client ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    metrics([['Kunjungan', list.length], ['Klien dikunjungi', new Set(list.map(v => v.client)).size], ['Petugas', new Set(list.map(v => v.emp)).size], ['Lokasi perlu cek', list.filter(v => f2().tracks.find(t => t.id === v.track)?.validation !== 'Valid').length]]) +
    (list.length ? card('Daftar kunjungan', table(['Visit ID', 'Tanggal', 'Petugas', 'Klien', 'Masuk–keluar', 'Bukti'], list.map(v => [link('hrd-visit' + qs({ id: v.id }), v.id), v.date, empLink(v.emp), esc(client(v.client)?.name), `${v.in}–${v.out}`, esc(v.evidence)]))) : empty('Tidak ada kunjungan', 'Filter tidak menemukan kunjungan di cakupan Anda.'));
}
function tracking(params) {
  const h = hr(), all = f2().tracks;
  if (params.id) {
    const t = all.find(x => x.id === params.id);
    if (!t) return card('Titik tidak ditemukan', link('hrd-tracking', '‹ Kembali'));
    if (!HR.inScope(h, role(), t.emp)) return `<section class="card hr-denied" role="alert"><h2>Akses ditolak</h2><p>Titik ${esc(t.id)} milik karyawan di luar cakupan ${esc(def().label)}.</p>${link('hrd-tracking', '‹ Kembali')}</section>`;
    const src = t.context.type === 'Kunjungan' ? link('hrd-visit' + qs({ id: t.context.ref }), t.context.ref) : link('hrd-presence' + qs({ date: HR.TODAY, q: t.emp }), t.context.ref);
    return card(`${t.id} · ${esc(t.context.type)}`, table(['Field', 'Nilai'], [['Karyawan', empLink(t.emp)], ['Waktu (WITA)', t.at], ['Koordinat (sintetis)', t.lat === null ? chip('GPS tidak tersedia', 'bad') : `${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}`], ['Validasi', chip(t.validation, t.validation === 'Valid' ? 'ready' : 'sandbox')], ['Sumber', src]])) + link('hrd-tracking', '‹ Riwayat lokasi');
  }
  const list = all.filter(t => HR.inScope(h, role(), t.emp));
  const pts = list.filter(t => t.lat !== null), lat = pts.map(t => t.lat), lng = pts.map(t => t.lng);
  const [a1, a2, b1, b2] = [Math.min(...lat), Math.max(...lat), Math.min(...lng), Math.max(...lng)];
  const X = (v) => 20 + (v - b1) / ((b2 - b1) || 1) * 560, Y = (v) => 180 - (v - a1) / ((a2 - a1) || 1) * 160;
  const map = pts.length ? `<svg class="hr-map" viewBox="0 0 600 200" role="img" aria-label="Peta titik lokasi sintetis"><rect x="0" y="0" width="600" height="200" rx="10" class="hr-map-bg"/>${pts.map(t => `<a href="#hrd-tracking?id=${t.id}"><circle cx="${X(t.lng).toFixed(1)}" cy="${Y(t.lat).toFixed(1)}" r="7" class="${t.validation === 'Valid' ? 'ok' : 'warn'}"><title>${t.id} · ${esc(empName(t.emp))} · ${t.validation}</title></circle></a>`).join('')}</svg>` : '';
  return (list.length ? card(`Peta titik (sintetis) · ${pts.length} titik`, map + '<p class="muted small">Tanpa layanan peta eksternal. Klik titik untuk sumbernya.</p>') + card('Riwayat lokasi', table(['Track ID', 'Waktu (WITA)', 'Karyawan', 'Konteks', 'Validasi'], list.map(t => [link('hrd-tracking' + qs({ id: t.id }), t.id), t.at, empLink(t.emp), `${esc(t.context.type)} · ${esc(t.context.ref)}`, chip(t.validation, t.validation === 'Valid' ? 'ready' : t.lat === null ? 'bad' : 'sandbox')]))) : empty('Belum ada titik lokasi', 'Tidak ada riwayat lokasi di cakupan Anda.', false));
}
function clients(params) {
  if (params.id) {
    const c = client(params.id); if (!c) return card('Klien tidak ditemukan', link('hrd-clients', '‹ Kembali'));
    const vs = visitsVisible().filter(v => v.client === c.id);
    return card(`${c.id} · ${esc(c.name)}`, table(['Field', 'Nilai'], [['Wilayah', esc(c.area)], ['Status', chip(c.status, c.status === 'Aktif' ? 'ready' : 'sandbox')], ['Kontak', can('settings.view') ? esc(c.contact) + ' · ' + esc(c.phone) : '<i>Sesuai izin</i>']])) +
      (vs.length ? card('Riwayat kunjungan', table(['Visit ID', 'Tanggal', 'Petugas', 'Waktu'], vs.map(v => [link('hrd-visit' + qs({ id: v.id }), v.id), v.date, empLink(v.emp), `${v.in}–${v.out}`]))) : empty('Belum ada kunjungan', 'Klien ini belum pernah dikunjungi.', false)) + link('hrd-clients', '‹ Direktori klien');
  }
  return card(`Direktori klien · ${f2().clients.length}`, table(['Client ID', 'Nama', 'Wilayah', 'Status', 'Kunjungan'], f2().clients.map(c => [link('hrd-clients' + qs({ id: c.id }), c.id), esc(c.name), esc(c.area), chip(c.status, c.status === 'Aktif' ? 'ready' : 'sandbox'), visitsVisible().filter(v => v.client === c.id).length])));
}

/* ---------- NV11 Timeline ---------- */
function timeline() {
  const h = hr(), ids = new Set(inScopeList().map(p => p.id)), payOk = def().payroll === 'detail';
  const myLoc = HR.roleDef(role()).scope.startsWith('outlet:') ? HR.roleDef(role()).scope.slice(7) : null;
  const posts = f2().posts.filter(p => p.scope === 'all' || !myLoc || p.scope === myLoc).map(p => ({ at: p.at, kind: p.kind, title: esc(p.title), link: p.ref ? `<a href="${p.ref}">Buka sumber</a>` : '—' }));
  const reqs = h.queue.filter(q => ids.has(q.emp)).map(q => ({ at: q.created, kind: 'Aktivitas · Pengajuan', title: `${esc(q.type)} · ${esc(empName(q.emp))} · ${esc(q.status)}`, link: link('hrd-approval' + qs({ id: q.id }), q.id) }));
  const aud = can('audit.view') ? h.audit.filter(a => !(a.ref && /^EMP-/.test(a.ref)) || ids.has(a.ref)).map(a => ({ at: a.at, kind: 'Aktivitas · ' + a.object, title: a.sensitive && !payOk ? 'Perubahan payroll (rincian khusus Manager HRD)' : esc(a.detail), link: link('hrd-audit' + qs({ id: a.id }), a.id) })) : [];
  const rows = [...posts, ...reqs, ...aud].sort((a, b) => b.at.localeCompare(a.at));
  return card(`Timeline · ${rows.length}`, table(['Waktu (WITA)', 'Jenis', 'Judul', 'Sumber'], rows.slice(0, 60).map(r => [esc(r.at), esc(r.kind), r.title, r.link])) + '<p class="muted small">Isi mengikuti cakupan objek asal: pengajuan di luar tim dan rincian payroll tidak ditampilkan.</p>');
}

/* ---------- NV12 Impor ---------- */
function importer(params) {
  if (!['hrd', 'hrd-ops'].includes(role())) return denied('people');
  const step = params.step || 'file', file = params.file;
  const steps = `<ol class="hr-steps">${[['file', '1 · Pilih file'], ['map', '2 · Petakan kolom'], ['preview', '3 · Pratinjau & validasi'], ['result', '4 · Hasil']].map(([k, l]) => `<li class="${k === step ? 'on' : ''}">${l}</li>`).join('')}</ol>`;
  if (step === 'file' || !file) return steps + card('Pilih file dummy', `<div class="actions">${Object.keys(HR2.SAMPLE_FILES).map(f => `<a class="btn ghost" href="#hrd-import${qs({ step: 'map', file: f })}">${f}</a>`).join('')}</div><p class="muted small">R&D memakai file sintetis. Pada cloud, validasi jenis dan ukuran file sebelum diproses.</p>`);
  const pf = HR2.parseFile(file); if (!pf) return steps + empty('File tidak dikenal', 'Pilih ulang file dummy.', false);
  const guess = (field) => { const i = pf.head.findIndex(c => c.toLowerCase().includes(field) || ({ nama: /nama/, posisi: /posisi|jabatan/, outlet: /outlet|lokasi/, shift: /shift/, mulai: /mulai/, telepon: /telepon|hp/ })[field].test(c.toLowerCase())); return i; };
  const map = Object.fromEntries(HR2.FIELDS.map(([k]) => [k, params['m_' + k] !== undefined ? Number(params['m_' + k]) : guess(k)]));
  const rows = pf.rows.map((r, i) => ({ baris: i + 2, ...Object.fromEntries(HR2.FIELDS.map(([k]) => [k, map[k] >= 0 ? (r[map[k]] || '').trim() : ''])) }));
  if (step === 'map') return steps + card(`Petakan kolom · ${esc(file)}`, `<form class="workflow-form" data-search-import="1">${HR2.FIELDS.map(([k, l]) => `<label>${l}<select name="m_${k}"><option value="-1">— tidak dipakai —</option>${pf.head.map((c, i) => `<option value="${i}" ${i === map[k] ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>`).join('')}<a class="btn" data-import-next="preview" href="#hrd-import${qs({ step: 'preview', file, ...Object.fromEntries(Object.entries(map).map(([k, v]) => ['m_' + k, v])) })}">Lanjut ke pratinjau</a></form>`);
  const batch = 'IMP-2611-' + file.replace(/\W+/g, '-').replace(/-csv$/, '').toUpperCase();
  if (step === 'preview') {
    const h = hr(); const checked = rows.map(r => ({ ...r, errs: HR2.validateRow(h, r, rows) }));
    const done = f2().imports.some(b => b.id === batch);
    return steps + card(`Pratinjau · ${rows.length} baris · batch ${batch}`, table(['Baris', 'Nama', 'Posisi', 'Outlet', 'Shift', 'Mulai', 'Validasi'], checked.map(r => [r.baris, esc(r.nama), esc(r.posisi), esc(r.outlet), esc(r.shift), esc(r.mulai), r.errs.length ? chip(r.errs.join('; '), r.errs[0].startsWith('Duplikat') ? 'sandbox' : 'bad') : chip('Siap diimpor', 'ready')])) +
      `${done ? '<p class="phase-banner"><b>Batch ini sudah pernah diimpor.</b> Mengonfirmasi lagi tidak menggandakan profil: semua baris dilewati.</p>' : ''}<form class="workflow-form" data-submit="hr:import-commit" data-after="hrd-import${qs({ step: 'result', file })}"><input type="hidden" name="batch" value="${batch}"><input type="hidden" name="rows" value="${esc(JSON.stringify(rows))}"><p>Akan diimpor: <b>${checked.filter(r => !r.errs.length).length}</b> · dilewati/gagal: <b>${checked.filter(r => r.errs.length).length}</b></p><div class="actions"><button class="btn">Konfirmasi impor</button><a class="btn ghost" href="#hrd-import">Batal</a></div></form>`);
  }
  const res = f2().lastImport;
  if (!res) return steps + empty('Belum ada hasil', 'Jalankan impor terlebih dahulu.', false);
  const c = (k) => res.rows.filter(r => r.result === k).length;
  return steps + metrics([['Berhasil', c('Berhasil')], ['Dilewati', c('Dilewati')], ['Gagal', c('Gagal')], ['Batch', res.batch]]) + card('Hasil per baris', table(['Baris', 'Nama', 'Hasil', 'Keterangan'], res.rows.map(r => [r.baris, esc(r.nama), chip(r.result, r.result === 'Berhasil' ? 'ready' : r.result === 'Dilewati' ? 'sandbox' : 'bad'), /^EMP-/.test(r.reason) ? link('hrd-roster' + qs({ emp: r.reason }), r.reason) : esc(r.reason)]))) + `<div class="actions">${link('hrd-roster', 'Buka Direktori')} ${link('hrd-import' + qs({ step: 'preview', file }), 'Impor ulang batch yang sama')}</div>`;
}

register('hrd-schedule', guard(ESS, schedule), () => 'Jadwal Kerja');
register('hrd-presence', guard(ESS, presence), () => 'Presensi');
register('hrd-attendance', guard(ESS, presence), () => 'Kehadiran · Presensi');
register('hrd-att-approval', guard('people', (p) => inbox(p, 'Koreksi presensi')), () => 'Approval Presensi');
register('hrd-approval', guard(ESS, (p) => inbox(p)), () => 'Approval');
register('hrd-leave', guard(ESS, leave), () => 'Izin & Cuti');
register('hrd-visit', guard('people', visits), () => 'Kunjungan Klien');
register('hrd-tracking', guard('people', tracking), () => 'Pelacakan Lokasi');
register('hrd-clients', guard('people', clients), () => 'Klien');
register('hrd-timeline', guard(['dashboard', 'ess'], timeline), () => 'Timeline');
register('hrd-import', guard('people', importer), () => 'Impor Karyawan');

/* mapping kolom impor: pilihan langsung memperbarui tautan lanjut */
document.addEventListener('change', (e) => {
  const f = e.target.closest('form[data-search-import]'); if (!f) return;
  const { params } = H.parseHash(); const data = Object.fromEntries(new FormData(f));
  H.go('hrd-import', { ...params, ...data }, true);
});
/* ekspor CSV cakupan aktif (tanpa kolom payroll kecuali Manager HRD) */
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-hr-export]')) return;
  const list = H.HOOKS.lastRoster || [], pay = def().payroll === 'detail';
  const rows = [['employee_id', 'nama', 'jabatan', 'divisi', 'lokasi', 'shift', 'status_kerja', ...(pay ? ['thp_contoh'] : [])], ...list.map(p => [p.id, p.name, HR.pos(p.placement.position).name, HR.DIVISIONS.find(d => d.id === p.placement.division).name, HR.locName(p.placement.location), H.HOOKS.shiftOf(p.id), p.contract, ...(pay ? [p.thp] : [])])];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `hrd-direktori-${role()}.csv`; a.click(); } catch (err) { /* unduhan diblokir */ }
  window.__hrLastExport = { rows: list.length, pay };
  H.render(`Ekspor ${list.length} baris sesuai cakupan ${def().label}${pay ? '' : ' (tanpa kolom payroll)'}.`);
});
})();
