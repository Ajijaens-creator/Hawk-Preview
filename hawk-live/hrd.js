/* HAWK ERP · Portal kelima: HRD & Human Growth · F1 Fondasi dan Beranda — DATA DEMO / SIMULASI.
   F1-NV01 Beranda HRD · NV02 Struktur Organisasi · NV03 Roster & Penempatan · NV04 Akun, Role & Akses ·
   NV05 Pengaturan Perusahaan · NV06 Pengaturan Sistem · NV07 Audit Aktivitas · NV08 Kelola Data Demo R&D.
   Sidebar mengikuti inventaris GajiHub (reference-hrd/hrd-rnd/REFERENSI.md + menu.js), lalu modul HAWK tambahan.
   Tujuan F2–F8 menampilkan status fase dan akses. Model: hrd-model.js (HR). Desain: assets/css/hawk.css. */
(() => {
const H = window.HL;
const { esc, num, rp, pct, table, card, metrics, hero, bar, qs, link } = H;
const hr = () => HR.ensure(H.state);
const role = () => H.prefs.role;
const def = () => HR.roleDef(role());
const can = (p) => HR.can(role(), p);
const chip = (text, tone = '') => `<span class="status-chip ${tone}">${esc(text)}</span>`;
const INTEG_TONE = { 'CONFIRMED EXISTING': 'ready', 'TO VERIFY': 'sandbox', 'NEW INTEGRATION REQUIRED': 'bad', 'UI-ONLY SIMULATION': 'planned' };
const integ = (s) => chip(s, INTEG_TONE[s]);
const btn = (action, label, data = {}, cls = '') => `<button type="button" class="btn ${cls}" data-action="hr:${action}" ${Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${label}</button>`;
const person = (id) => hr().people.find(p => p.id === id);
const empName = (id) => person(id)?.name || '—';
const posName = (id) => HR.pos(id)?.name || id;
const divName = (id) => HR.DIVISIONS.find(d => d.id === id)?.name || id;
const roleLabel = (r) => r === 'ess' ? 'Karyawan (ESS)' : HR.roleDef(r).label;
const tabs = (route, cur, list, params = {}) => `<nav class="tabs" aria-label="Bagian">${list.map(([k, l]) => `<a class="tab${k === cur ? ' on' : ''}" href="#${route}${qs({ ...params, tab: k })}" ${k === cur ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
const register = (id, fn, title) => { H.REGISTRY[id] = fn; if (title) fn.title = title; };

/* ---------- portal kelima & sidebar (urutan GajiHub, lalu tambahan HAWK) ---------- */
/* [route, nama sidebar, kode, status, label fase, 'sub'] */
const P = (n) => `HRD F${n}`; /* label fase; sidebar menampilkan kode F<n> */
const ITEMS = [
  ['hrd-home', 'Beranda', 'F1-NV01', 'ready'],
  ['hrd-roster', 'Karyawan', 'F1-NV03', 'ready'],
  ['hrd-attendance', 'Kehadiran', 'F2', 'planned', P(2)],
  ['hrd-att-approval', 'Approval Presensi', 'F2', 'planned', P(2), 'sub'], ['hrd-schedule', 'Jadwal Kerja', 'F2', 'planned', P(2), 'sub'], ['hrd-presence', 'Presensi', 'F2', 'planned', P(2), 'sub'], ['hrd-leave', 'Izin & Cuti', 'F2', 'planned', P(2), 'sub'], ['hrd-visit', 'Kunjungan Klien', 'F2', 'planned', P(2), 'sub'],
  ['hrd-tracking', 'Pelacakan Lokasi', 'F2', 'planned', P(2)],
  ['hrd-recruit', 'Rekrutmen', 'F4', 'planned', P(4)],
  ['hrd-rec-profile', 'Profil', 'F4', 'planned', P(4), 'sub'], ['hrd-rec-manage', 'Manajemen Rekrutmen', 'F4', 'planned', P(4), 'sub'], ['hrd-rec-jobs', 'Lowongan Pekerjaan', 'F4', 'planned', P(4), 'sub'], ['hrd-rec-candidates', 'Kandidat', 'F4', 'planned', P(4), 'sub'],
  ['hrd-payroll', 'Payroll', 'F7', 'planned', P(7)],
  ['hrd-finance', 'Keuangan', 'F7', 'planned', P(7)],
  ['hrd-cash', 'Kasbon', 'F7', 'planned', P(7), 'sub'], ['hrd-reimburse', 'Reimburse', 'F7', 'planned', P(7), 'sub'],
  ['hrd-approval', 'Approval', 'F2', 'planned', P(2)],
  ['hrd-timeline', 'Timeline', 'F2', 'planned', P(2)],
  ['hrd-clients', 'Klien', 'F2', 'planned', P(2)],
  ['hrd-reports', 'Laporan', 'F7', 'planned', P(7)],
  ['hrd-tasks', 'Tugas', 'F3', 'planned', P(3)],
  ['hrd-settings', 'Pengaturan', 'F1', 'ready'],
  ['hrd-org', 'Struktur Organisasi', 'F1-NV02', 'ready', '', 'sub'], ['hrd-access', 'Akun, Role & Akses', 'F1-NV04', 'ready', '', 'sub'], ['hrd-company', 'Pengaturan Perusahaan', 'F1-NV05', 'ready', '', 'sub'],
  ['hrd-system', 'Pengaturan Sistem', 'F1-NV06', 'ready', '', 'sub'], ['hrd-audit', 'Audit Aktivitas', 'F1-NV07', 'ready', '', 'sub'], ['hrd-demo', 'Kelola Data Demo R&D', 'F1-NV08', 'ready', '', 'sub'],
  ['hrd-faq', 'FAQ', 'F1-NV06', 'ready'],
  ['hrd-kpi', 'Kinerja & KPI', 'F6', 'planned', P(6)],
  ['hrd-race', 'AmbideX & Race', 'F8', 'planned', P(8)],
  ['hrd-manpower', 'Manpower Planning', 'F5', 'planned', P(5)],
  ['hrd-ninebox', '9-Box Talent', 'F6', 'planned', P(6)],
  ['hrd-budget', 'People Budgeting', 'F7', 'planned', P(7)]
];
const TITLES = { 'hrd-home': 'Beranda HRD', 'hrd-roster': 'Roster & Penempatan', 'hrd-settings': 'Pengaturan', 'hrd-faq': 'Pengaturan Sistem · FAQ' };
H.PORTALS.HRD = { desc: 'HRD Operations, Human Growth, payroll dan kinerja orang', items: ITEMS };
H.HOME.HRD = 'hrd-home';
const r0 = H.ROLES.find(r => r[0] === 'hrd'); if (r0) r0[1] = 'Manager HRD';
[['hrd-ops', 'Staf HRD'], ['hg-lead', 'Human Growth Lead'], ['ops-manager', 'Operational Manager'], ['outlet-spv', 'Supervisor Spa Ubud'], ['therapist', 'Therapist · ESS']].forEach(r => { if (!H.ROLES.some(x => x[0] === r[0])) H.ROLES.push(r); });
const enter = () => { if (!HR.can(H.prefs.role, 'dashboard') && H.prefs.role !== 'therapist') { H.prefs.role = 'hrd'; H.savePrefs(); } };
H.HOOKS.portalEnter = { ...(H.HOOKS.portalEnter || {}), HRD: enter };
H.HOOKS.boot = [...(H.HOOKS.boot || []), () => { if (document.body.dataset.portal === 'HRD') enter(); }];
H.HOOKS.actor = () => { const e = hr().roleEmp[role()]; return e ? `${empName(e)} (${def().label})` : def().label; };
Object.assign(H.PURPOSE, {
  'hrd-home': 'Ringkasan roster, outlet, kehadiran dan antrean sesuai cakupan organisasi dan peran.',
  'hrd-org': 'Perusahaan → unit bisnis → outlet atau divisi → posisi. Setiap node menampilkan jumlah orang dan tautan roster.',
  'hrd-roster': 'Roster dengan pencarian nama/ID dan filter outlet, divisi, posisi, shift. Klik nama untuk penempatan efektif.',
  'hrd-access': 'Akun demo, role, cakupan, status dan matriks izin. Penolakan berlaku juga untuk tautan langsung.',
  'hrd-company': 'Identitas, kalender, kebijakan approval, penomoran dan template, dengan status dan riwayat penyimpanan.',
  'hrd-system': 'Notifikasi, integrasi, aturan Tugas dan FAQ. Status koneksi tampil tanpa menjalankan koneksi produksi.',
  'hrd-faq': 'Panduan singkat untuk pengguna HRD.',
  'hrd-audit': 'Aktivitas dengan filter waktu, pelaku, jenis aksi dan objek. Waktu pencatatan dalam WITA.',
  'hrd-demo': 'Ringkasan dataset demo, konfirmasi hapus, state kosong dan mulai kembali dari fixture.',
  'hrd-settings': 'Kategori pengaturan GajiHub dan layar F1 yang menanganinya.'
});
H.SCREENS.push(...ITEMS.filter(i => i[2] && i[2].includes('NV')).filter((i, k, a) => a.findIndex(x => x[2] === i[2]) === k).sort((a, b) => a[2].localeCompare(b[2])).map(([route, title, code]) => [code, 'HRD · ' + (TITLES[route] || title), 'HRD 1', route, 'ready', 'Staf HRD, Manager HRD']));

/* ---------- akses ditolak ---------- */
function denied(perm) {
  const who = Object.entries(HR.ROLE_DEFS).filter(([, d]) => d.perms.includes(perm)).map(([k]) => k);
  const ess = role() === 'therapist';
  return `<section class="card hr-denied" role="alert"><h2>Akses ditolak</h2>
    <p>Role demo <b>${esc(def().label)}</b> tidak punya izin <b>${esc(HR.PERM_LABEL[perm])}</b>. Tidak ada data yang dimuat. Pada implementasi cloud, aturan yang sama berlaku untuk navigasi langsung, payload daftar, ekspor dan API.</p>
    ${ess ? '<p>Karyawan membuka data sendiri lewat Self Service (ESS) di aplikasi mobile staf (HRD F2).</p>' : ''}
    <p class="muted small">Role yang punya izin ini: ${who.map(k => esc(HR.roleDef(k).label)).join(', ') || '—'}.</p>
    <div class="actions">${who.filter(k => ['hrd', 'hrd-ops'].includes(k)).concat(who.filter(k => !['hrd', 'hrd-ops'].includes(k))).slice(0, 2).map((k, i) => `<button type="button" class="btn ${i ? 'ghost' : ''}" data-hr-role="${k}">Ganti ke ${esc(HR.roleDef(k).label)}</button>`).join('')}${link('hrd-access', 'Lihat matriks akses')}</div></section>`;
}
const guard = (perm, fn) => (params) => can(perm) ? fn(params) : denied(perm);
const emptyData = () => !hr().people.length;
const noDemo = () => !hr().people.some(p => p.demo);
const emptyCard = () => `<section class="card hr-empty"><h2>Dataset dummy dikosongkan</h2><p>Tidak ada profil demo, penempatan demo atau antrean.${hr().people.length ? ` Record non-demo yang tetap utuh: ${hr().people.map(p => esc(p.id)).join(', ')}.` : ''} Mulai kembali dari fixture di ${link('hrd-demo', 'Kelola Data Demo R&D')}. Pemuatan data asli adalah pekerjaan terpisah.</p></section>`;

/* ---------- pemilih cakupan organisasi ---------- */
const LOCS = () => [...HR.OUTLETS, HR.HQ];
function scopeOf(params) {
  const f = { entity: params.entity || 'all', division: params.division || 'all', outlet: params.outlet || 'all' };
  if (!HR.ENTITIES.some(e => e.id === f.entity)) f.entity = 'all';
  if (!HR.DIVISIONS.some(e => e.id === f.division)) f.division = 'all';
  if (!LOCS().some(e => e.id === f.outlet)) f.outlet = 'all';
  return f;
}
function scopeBar(params) {
  const f = scopeOf(params), [kind, sid] = def().scope.split(':');
  const visible = HR.people(hr(), role());
  const ents = HR.ENTITIES.filter(e => visible.some(p => p.placement.entity === e.id));
  const divs = HR.DIVISIONS.filter(d => visible.some(p => p.placement.division === d.id));
  const locs = LOCS().filter(o => visible.some(p => p.placement.location === o.id));
  const opt = (list, cur, all) => `${all ? `<option value="all">${all}</option>` : ''}${list.map(x => `<option value="${x.id}" ${x.id === cur ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}`;
  const lock = kind === 'outlet' ? `dikunci ke tim ${esc(HR.locName(sid))}` : kind === 'division' ? esc(divName(sid)) : 'semua unit';
  return `<form id="filters" class="filters hr-scope" aria-label="Cakupan organisasi">
    <label>Unit bisnis <select name="entity">${opt(ents, f.entity, ents.length > 1 ? 'Semua · ' + HR.COMPANY.name : '')}</select></label>
    <label>Divisi <select name="division">${opt(divs, f.division, divs.length > 1 ? 'Semua divisi' : '')}</select></label>
    <label>Outlet / lokasi <select name="outlet">${opt(locs, f.outlet, locs.length > 1 ? 'Semua lokasi' : '')}</select></label>
    <button type="button" class="btn ghost" data-action="filter-reset">Reset cakupan</button></form>
    <p class="active-filters" role="status"><b>Cakupan akun:</b> ${lock} · data per ${HR.TODAY} mengikuti penempatan efektif.</p>`;
}

/* ---------- F1-NV01 Beranda HRD ---------- */
const HERO_TEXT = {
  owner: 'Owner membaca orang dan kapasitas dalam agregat. Detail payroll tetap di Manager HRD.',
  hrd: 'Pantau tim, presensi, pengajuan, rekrutmen dan kapasitas dari satu tempat, termasuk ringkasan payroll.',
  'hrd-ops': 'Pantau tim, presensi dan pengajuan dari satu tempat. Payroll dan laporan pajak khusus Manager HRD.',
  'hg-lead': 'Human Growth membaca kesiapan peran dan kebutuhan pengembangan sesuai izin.',
  'ops-manager': 'Operational Manager melihat orang dan kapasitas di Divisi Operational: empat outlet dan tim Operations.',
  'outlet-spv': 'Supervisor melihat tim outletnya sendiri: presensi hari ini dan antrean pengajuan.'
};
const age = (b) => 2026 - b;
const groupCount = (list, fn) => { const m = new Map(); list.forEach(p => { const k = fn(p); m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
const statTable = (rows, total) => table(['Kategori', 'Orang', '%'], rows.map(([k, v]) => [esc(k), num(v), pct(v / (total || 1), 0)]));
function home(params) {
  if (noDemo()) return hero('Ruang kerja Human Resources', 'JUMAT, 13 NOVEMBER 2026 · WITA · Dataset dummy kosong.', [['#hrd-demo', 'Mulai kembali dari fixture']]) + emptyCard();
  const f = scopeOf(params), h = hr(), s = HR.summary(h, role(), f), d = def();
  const rosterQ = { outlet: f.outlet === 'all' ? '' : f.outlet, division: f.division === 'all' ? '' : f.division, entity: f.entity === 'all' ? '' : f.entity };
  const queue = h.queue.filter(q => s.ids.has(q.emp) && q.status === 'Menunggu Persetujuan');
  const present = s.att.hadir + s.att.terlambat;
  const outletCards = HR.OUTLETS.map(o => {
    const ppl = s.list.filter(p => p.placement.location === o.id);
    if (!ppl.length) return '';
    const c = (pid) => ppl.filter(p => p.position === pid).length;
    const u = s.outlets.find(x => x.id === o.id);
    return `<a class="card hr-outlet" href="#hrd-roster${qs({ outlet: o.id })}"><h2>${esc(o.name)}</h2><p class="hr-big">${num(ppl.length)} <small>orang</small></p><p class="muted small">${c('POS-THR')} Therapist · ${c('POS-RCP')} Receptionist · Supervisor ${esc(empName(h.placements.find(x => x.leads === o.id && !x.to)?.emp))}</p>${u ? `<p class="small">Utility Okt ${pct(u.utility, 0)} ${u.utility > 1 ? chip('> 100%', 'bad') : u.utility < 0.7 ? chip('< 70%', 'sandbox') : ''}</p>` : ''}<span class="small">Buka roster ›</span></a>`;
  }).join('');
  const stats = [
    ['Usia', groupCount(s.list, p => { const a = age(p.birth); return a < 25 ? '< 25 tahun' : a < 35 ? '25–34 tahun' : a < 45 ? '35–44 tahun' : '≥ 45 tahun'; })],
    ['Jenis kelamin', groupCount(s.list, p => p.gender === 'L' ? 'Laki-laki' : 'Perempuan')],
    ['Agama', groupCount(s.list, p => p.religion)], ['Pendidikan', groupCount(s.list, p => p.education)],
    ['Status perkawinan', groupCount(s.list, p => p.marital)],
    ['Lama kerja', groupCount(s.list, p => { const y = 2026 - Number(p.joined.slice(0, 4)); return y < 1 ? '< 1 tahun' : y < 3 ? '1–2 tahun' : y < 5 ? '3–4 tahun' : '≥ 5 tahun'; })],
    ['Status kerja', groupCount(s.list, p => p.contract)]
  ];
  const statsOpen = params.stat && stats.find(x => x[0] === params.stat);
  return hero('Ruang kerja Human Resources', `JUMAT, 13 NOVEMBER 2026 · WITA · ${esc(d.label)} · ${HERO_TEXT[role()] || ''}`, [['#hrd-org', 'Struktur organisasi'], ['#hrd-tasks', 'Tugas'], ['#hrd-manpower', 'Manpower Planning']]) + scopeBar(params) +
    `<section class="grid g4 keep2 kpis">
      <a class="kpi g-teal" href="#hrd-roster${qs(rosterQ)}"><div class="lbl">Karyawan</div><div class="val">${num(s.count)}</div><div class="sub">Buka roster pada cakupan ini ›</div></a>
      <a class="kpi g-violet" href="#hrd-presence"><div class="lbl">Hadir hari ini</div><div class="val">${num(present)}</div><div class="sub">${num(s.att.terlambat)} terlambat · ${num(s.att.belum)} belum absen</div></a>
      <a class="kpi g-blue" href="#hrd-approval"><div class="lbl">Menunggu persetujuan</div><div class="val">${num(queue.length)}</div><div class="sub">Antrean dummy ›</div></a>
      <a class="kpi g-gold" href="#hrd-rec-jobs"><div class="lbl">Lowongan</div><div class="val">${num(s.vac.length)}</div><div class="sub">${s.vac.map(v => esc(v.title)).join(' · ') || 'Tidak ada'}</div></a>
    </section>` +
    (outletCards ? `<section class="grid g4 keep2 hr-outlets" aria-label="Outlet Spa">${outletCards}</section>` : '') +
    `<div class="grid g2">` +
    card('Pengajuan perlu ditinjau', queue.length ? table(['ID', 'Karyawan', 'Jenis', 'Tanggal', 'Keterangan'], queue.map(q => [q.id, `<a href="#hrd-roster${qs({ emp: q.emp })}">${esc(empName(q.emp))}</a>`, esc(q.type), q.date, esc(q.note)])) + `<p class="muted small">Keputusan approval dibangun di ${link('hrd-approval', 'Approval (HRD F2)')}.</p>` : '<p>Tidak ada pengajuan di cakupan ini.</p>') +
    card('Kehadiran hari ini', `${bar('Hadir tepat waktu', num(s.att.hadir), s.att.hadir / (s.count || 1))}${bar('Terlambat', num(s.att.terlambat), s.att.terlambat / (s.count || 1))}${bar('Cuti / izin', num(s.att.cuti), s.att.cuti / (s.count || 1))}${bar('Sakit', num(s.att.sakit), s.att.sakit / (s.count || 1))}${bar('Libur shift', num(s.att.libur), s.att.libur / (s.count || 1))}${bar('Belum absen', num(s.att.belum), s.att.belum / (s.count || 1))}<p class="muted small">Simulasi ${integ('UI-ONLY SIMULATION')} · presensi lengkap di ${link('hrd-presence', 'Presensi (HRD F2)')}.</p>`) +
    `</div>` +
    card('Statistik karyawan', `<div class="tabs" role="group" aria-label="Pilih statistik">${stats.map(([k]) => `<a class="tab${statsOpen && statsOpen[0] === k ? ' on' : ''}" href="#hrd-home${qs({ ...params, stat: k })}">${esc(k)}</a>`).join('')}</div>${statsOpen ? statTable(statsOpen[1], s.count) : '<p class="muted">Pilih statistik untuk melihat rincian pada cakupan aktif.</p>'}`) +
    card('Ringkasan payroll', d.payroll === 'none' ? `<p>Khusus Manager HRD. ${esc(d.label)} tidak melihat nominal gaji.</p>` : `<div class="metric-row"><span>Total take-home pay contoh · ${num(s.count)} orang</span><b>${rp(s.list.reduce((a, p) => a + p.thp, 0))}</b></div><div class="metric-row"><span>Rata-rata take-home pay</span><b>${rp(s.list.reduce((a, p) => a + p.thp, 0) / (s.count || 1))}</b></div><p class="muted small">${d.payroll === 'detail' ? 'Detail per orang dan per komponen di Payroll (HRD F7).' : 'Agregat saja.'} Take-home pay berbeda dari biaya tenaga kerja.</p>`);
}

/* ---------- F1-NV02 Struktur Organisasi ---------- */
function org(params) {
  if (emptyData()) return emptyCard();
  const h = hr(), all = HR.people(h, role());
  const node = params.node || HR.COMPANY.id;
  const count = (fn) => all.filter(fn).length;
  const rosterLink = (q, label = 'Buka roster ›') => `<a href="#hrd-roster${qs(q)}">${label}</a>`;
  const crumbs = [[HR.COMPANY.id, HR.COMPANY.name]];
  const ent = HR.ENTITIES.find(e => e.id === node), out = HR.OUTLETS.find(o => o.id === node), div = HR.DIVISIONS.find(d => d.id === node);
  if (ent) crumbs.push([ent.id, ent.name]);
  if (out) crumbs.push(['ENT-SPA', 'JAENS Spa'], [out.id, out.name]);
  if (div) crumbs.push(['ENT-HQ', 'Office / HQ'], [div.id, div.name]);
  const trail = `<nav class="hr-trail" aria-label="Jalur organisasi">${crumbs.map(([id, n], i) => i === crumbs.length - 1 ? `<b aria-current="true">${esc(n)}</b>` : `<a href="#hrd-org${qs({ node: id })}">${esc(n)}</a>`).join(' › ')}</nav>`;
  const tile = (id, title, n, sub, q, extra = '') => `<section class="card hr-node"><h2><a href="#hrd-org${qs({ node: id })}">${esc(title)} ›</a></h2><p class="hr-big">${n === null ? '<small>Headcount belum ditetapkan</small>' : num(n) + ' <small>orang</small>'}</p><p class="muted small">${sub}</p>${extra}${n ? rosterLink(q) : ''}</section>`;
  let body = '';
  if (node === HR.COMPANY.id) {
    body = `<div class="grid g2">${HR.ENTITIES.map(e => tile(e.id, e.name, count(p => p.placement.entity === e.id), esc(e.kind), { entity: e.id })).join('')}</div><p class="muted small">Total ${num(all.length)} orang dihitung dari roster, sama dengan Beranda dan daftar karyawan.</p>`;
  } else if (node === 'ENT-SPA') {
    body = `<div class="grid g2">${HR.OUTLETS.map(o => {
      const c = (pid) => count(p => p.placement.location === o.id && p.position === pid);
      const ok = c('POS-THR') === 25 && c('POS-RCP') === 5;
      return tile(o.id, o.name, count(p => p.placement.location === o.id), `${c('POS-THR')} Therapist · ${c('POS-RCP')} Receptionist · Nama SER ${esc(o.ser)}`, { outlet: o.id }, `<p>${ok ? chip('Cocok roster 25 + 5', 'ready') : chip('Selisih roster', 'bad')}</p>`);
    }).join('')}</div><p class="muted small">Semua outlet Spa berada di Divisi Operational: Operational Manager → Assistant Operational Manager → Supervisor Outlet (headcount Office · Operations).</p>`;
  } else if (node === 'ENT-HQ') {
    body = `<div class="grid g2">${HR.DIVISIONS.map(dv => {
      const n = count(p => p.placement.location === HR.HQ.id && p.placement.division === dv.id);
      const unset = HR.EXPECTED.office[dv.id] === 0;
      return tile(dv.id, dv.name, unset ? null : n, esc(dv.note || ''), { outlet: HR.HQ.id, division: dv.id });
    }).join('')}</div><p class="muted small">PC dan Commercial belum punya alokasi headcount dan tidak menambah total 158.</p>`;
  } else if (out || div) {
    const inNode = (p) => out ? p.placement.location === out.id : p.placement.location === HR.HQ.id && p.placement.division === div.id;
    const rows = HR.POSITIONS.map(ps => [ps, count(p => inNode(p) && p.placement.position === ps.id)]).filter(([, n]) => n);
    const head = out ? h.placements.find(x => x.leads === out.id && !x.to)?.emp : null;
    body = (out ? `<p>Dipimpin <b>${esc(empName(head))}</b> (Supervisor Outlet) · atasan ${esc(empName(HR.supervisorOf(h, head)))}</p>` : '') +
      (rows.length ? card('Posisi', table(['Posisi', 'Level', 'Orang', 'Roster'], rows.map(([ps, n]) => [esc(ps.name), ps.level, num(n), rosterLink(out ? { outlet: out.id, position: ps.id } : { outlet: HR.HQ.id, division: div.id, position: ps.id })]))) : card('Posisi', HR.EXPECTED.office[div?.id] === 0 ? '<p>Headcount belum ditetapkan. Cakupan menunggu keputusan F1/F7.</p>' : '<p>Tidak ada orang di cakupan Anda untuk node ini.</p>'));
  } else body = '<p>Node organisasi tidak ditemukan.</p>';
  return trail + body;
}

/* ---------- F1-NV03 Roster & Penempatan ---------- */
function roster(params) {
  if (emptyData()) return emptyCard();
  const h = hr(), d = def();
  const all = HR.people(h, role());
  if (params.emp) {
    const e = person(params.emp);
    if (!e || !HR.inScope(h, role(), e.id)) return `<section class="card hr-denied" role="alert"><h2>Akses ditolak</h2><p>Profil ${esc(params.emp)} di luar cakupan role ${esc(d.label)}, atau tidak ditemukan.</p>${link('hrd-roster', '‹ Kembali ke roster')}</section>`;
    const pl = HR.placementOn(h, e.id), sup = HR.supervisorOf(h, e.id), hist = h.placements.filter(x => x.emp === e.id).sort((a, b) => b.from.localeCompare(a.from));
    const acc = h.accounts.find(a => a.emp === e.id);
    const back = { ...params }; delete back.emp;
    return `<section class="card hr-profile" aria-labelledby="pf-t"><h2 id="pf-t">${esc(e.name)} · ${e.id}</h2>
      <div class="grid g2"><div>${table(['Field', 'Nilai'], [
        ['Employee ID', e.id], ['Status kerja', `${esc(e.status)} · ${esc(e.contract)}`], ['Jabatan', esc(posName(pl.position))], ['Divisi', esc(divName(pl.division))],
        ['Outlet induk / lokasi', esc(HR.locName(pl.location)) + (pl.leads ? ` · memimpin ${esc(HR.locName(pl.leads))}` : '')], ['Atasan', sup ? `<a href="#hrd-roster${qs({ emp: sup })}">${esc(empName(sup))}</a> · ${esc(posName(HR.placementOn(h, sup).position))}` : 'Owner'],
        ['Shift ringkas', esc(e.shift)], ['Penempatan efektif', `${pl.from} → ${pl.to || 'sekarang'}`], ['Akun', `${esc(roleLabel(acc?.role || 'ess'))} · aktif`], ['Dataset', e.demo ? '<span class="badge demo">DEMO</span>' : 'Non-demo'],
        ...(d.payroll === 'detail' ? [['Take-home pay contoh', rp(e.thp)]] : [['Data payroll', 'Khusus Manager HRD']])
      ])}</div><div><h3>Histori penempatan</h3>${table(['ID', 'Lokasi', 'Posisi', 'Mulai', 'Akhir'], hist.map(x => [x.id, esc(HR.locName(x.location)), esc(posName(x.position)), x.from, x.to || '—']))}${hist.length > 1 ? `<p class="muted small">${esc(hist[0].reason || '')}. Jam, POS dan KPI sebelum ${hist[0].from} tetap di outlet lama.</p>` : ''}</div></div>
      <div class="actions"><a class="btn ghost" href="#hrd-roster${qs(back)}">‹ Kembali ke roster</a>${link('hrd-audit' + qs({ q: e.id }), 'Jejak audit ' + e.id)}</div></section>`;
  }
  const f = { outlet: params.outlet || '', division: params.division || '', position: params.position || '', shift: params.shift || '', entity: params.entity || '' };
  const q = (params.q || '').trim().toLowerCase();
  const list = all.filter(p => (!f.outlet || p.placement.location === f.outlet) && (!f.division || p.placement.division === f.division) && (!f.position || p.placement.position === f.position) && (!f.shift || p.shift === f.shift) && (!f.entity || p.placement.entity === f.entity) && (!q || `${p.id} ${p.name}`.toLowerCase().includes(q)));
  const opts = (list2, cur, all2) => `<option value="">${all2}</option>${list2.map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}`;
  const locs = LOCS().filter(o => all.some(p => p.placement.location === o.id)).map(o => [o.id, o.name]);
  const divs = HR.DIVISIONS.filter(x => all.some(p => p.placement.division === x.id)).map(x => [x.id, x.name]);
  const poss = HR.POSITIONS.filter(x => all.some(p => p.placement.position === x.id)).map(x => [x.id, x.name]);
  const per = 25, pages = Math.max(1, Math.ceil(list.length / per)), page = Math.min(pages, Math.max(1, Number(params.page) || 1));
  const keep = { ...f, q: params.q };
  const showPay = d.payroll === 'detail';
  return `<form id="filters" class="filters" aria-label="Filter roster">
      <label>Cari nama / ID<input name="q" value="${esc(params.q || '')}" placeholder="mis. EMP-0037" form="hr-search"></label>
      <label>Outlet / lokasi <select name="outlet">${opts(locs, f.outlet, 'Semua lokasi')}</select></label>
      <label>Divisi <select name="division">${opts(divs, f.division, 'Semua divisi')}</select></label>
      <label>Posisi <select name="position">${opts(poss, f.position, 'Semua posisi')}</select></label>
      <label>Shift <select name="shift">${opts([['Pagi', 'Pagi'], ['Sore', 'Sore'], ['Kantor', 'Kantor']], f.shift, 'Semua shift')}</select></label>
      ${f.entity ? `<input type="hidden" name="entity" value="${esc(f.entity)}">` : ''}
      <button type="button" class="btn ghost" data-action="filter-reset">Reset filter</button></form>
    <form id="hr-search" data-search="1" role="search" class="sr-only-form"><button class="btn sm">Cari</button></form>
    <p class="active-filters" role="status"><b>${num(list.length)} orang</b> dari ${num(all.length)} di cakupan ${esc(d.label)}.</p>` +
    (list.length ? card(`Roster · halaman ${page} dari ${pages}`, table(['Employee ID', 'Nama', 'Jabatan', 'Divisi', 'Outlet / lokasi', 'Shift', 'Berlaku sejak', ...(showPay ? ['THP contoh'] : [])], list.slice((page - 1) * per, page * per).map(p => [p.id, `<a href="#hrd-roster${qs({ ...keep, emp: p.id })}">${esc(p.name)}</a>`, esc(posName(p.placement.position)), esc(divName(p.placement.division)), esc(HR.locName(p.placement.location)), esc(p.shift), p.placement.from, ...(showPay ? [rp(p.thp)] : [])])) +
      `<div class="row hr-pager">${page > 1 ? `<a class="btn ghost sm" href="#hrd-roster${qs({ ...keep, page: page - 1 })}">‹ Sebelumnya</a>` : ''}${page < pages ? `<a class="btn ghost sm" href="#hrd-roster${qs({ ...keep, page: page + 1 })}">Berikutnya ›</a>` : ''}</div>${showPay ? '<p class="muted small">Kolom THP hanya untuk Manager HRD.</p>' : ''}`)
      : `<section class="card hr-empty"><h2>Tidak ada hasil</h2><p>Kombinasi filter ini tidak menemukan orang.</p><button type="button" class="btn" data-action="filter-reset">Reset filter</button></section>`);
}

/* ---------- F1-NV04 Akun, Role & Akses ---------- */
const SCOPE_LABEL = (sc) => sc === 'all' ? 'Semua unit' : sc === 'self' ? 'Data sendiri' : sc === 'none' ? 'Tanpa akses HRD' : sc.startsWith('division:') ? divName(sc.slice(9)) : 'Tim ' + HR.locName(sc.slice(7));
const PAY_LABEL = { detail: 'Detail', aggregate: 'Agregat', none: 'Tidak' };
const NEED = { 'hrd-home': 'dashboard', 'hrd-roster': 'people', 'hrd-org': 'org', 'hrd-access': 'access.view', 'hrd-company': 'settings.view', 'hrd-system': 'settings.view', 'hrd-audit': 'audit.view', 'hrd-demo': 'dummy.view', 'hrd-payroll': 'payroll.view', 'hrd-reports': 'report.view' };
function matrixCard() {
  const perms = Object.keys(HR.PERM_LABEL);
  return card('Matriks izin', table(['Role', 'Cakupan', 'Payroll', ...perms.map(p => HR.PERM_LABEL[p])], Object.entries(HR.ROLE_DEFS).map(([k, dd]) => [`<b>${esc(dd.label)}</b>${k === role() ? ' ' + chip('Role aktif', 'ready') : ''}`, esc(SCOPE_LABEL(dd.scope)), PAY_LABEL[dd.payroll], ...perms.map(p => dd.perms.includes(p) ? '✓' : '—')]), 'hr-matrix'));
}
function access(params) {
  const h = hr(), editable = can('access.edit');
  const demoAcc = Object.entries(h.roleEmp).map(([r, e]) => [r, e]);
  const others = h.accounts.filter(a => !Object.values(h.roleEmp).includes(a.emp));
  const fr = params.role || '';
  const list = others.filter(a => !fr || a.role === fr);
  const per = 20, pages = Math.max(1, Math.ceil(list.length / per)), page = Math.min(pages, Math.max(1, Number(params.page) || 1));
  return `<p class="phase-banner"><b>Pemilih peran demo</b> di sidebar adalah simulasi. Cloud mengambil identitas dan scope dari autentikasi server.</p>` +
    card('Akun role demo', table(['Role', 'Akun', 'Employee ID', 'Penempatan efektif', 'Cakupan', 'Status', 'Uji'], [['owner', null], ...demoAcc].map(([r, e]) => {
      const pl = e && HR.placementOn(h, e);
      return [esc(HR.roleDef(r).label), e ? esc(empName(e)) : 'Owner (akun pemilik)', e || '—', pl ? `${esc(posName(pl.position))} · ${esc(HR.locName(pl.leads || pl.location))} · sejak ${pl.from}` : '—', esc(SCOPE_LABEL(HR.roleDef(r).scope)), chip('Aktif', 'ready'), r === role() ? chip('Role aktif', 'ready') : `<button type="button" class="btn ghost sm" data-hr-role="${r}">Pakai</button>`];
    }))) +
    matrixCard() +
    card('Uji akses langsung', `<p>Buka tautan dengan role berbeda (mis. Staf HRD → Payroll). Layar tanpa izin menampilkan <b>Akses ditolak</b> tanpa memuat data.</p>` + table(['Layar', 'Izin', `Hasil untuk ${esc(def().label)}`], Object.entries(NEED).map(([r, pm]) => [link(r, esc(ITEMS.find(i => i[0] === r)?.[1] || r)), esc(HR.PERM_LABEL[pm]), can(pm) ? chip('Diizinkan', 'ready') : chip('Ditolak', 'bad')]))) +
    (can('people') ? card(`Akun karyawan · ${num(list.length)}`, `<form id="filters" class="filters"><label>Role <select name="role"><option value="">Semua role</option>${['ess', 'hrd-ops', 'hg-lead'].map(r => `<option value="${r}" ${r === fr ? 'selected' : ''}>${esc(roleLabel(r))}</option>`).join('')}</select></label></form>` +
      table(['User / Employee ID', 'Nama', 'Role', 'Cakupan', 'Status', ...(editable ? ['Ubah role'] : [])], list.slice((page - 1) * per, page * per).map(a => [a.emp, esc(empName(a.emp)), esc(roleLabel(a.role)), a.role === 'ess' ? 'Data sendiri' : 'Semua unit', chip('Aktif', 'ready'), ...(editable ? [`<form class="inline-form" data-submit="hr:account-role"><input type="hidden" name="emp" value="${a.emp}"><label class="sr" for="ar-${a.emp}">Role baru ${a.emp}</label><select id="ar-${a.emp}" name="newrole">${['ess', 'hrd-ops', 'hg-lead'].map(r => `<option value="${r}" ${r === a.role ? 'selected' : ''}>${esc(roleLabel(r))}</option>`).join('')}</select><button class="btn ghost sm">Simpan</button></form>`] : [])])) +
      `<div class="row hr-pager">${page > 1 ? `<a class="btn ghost sm" href="#hrd-access${qs({ role: fr, page: page - 1 })}">‹</a>` : ''}<span class="muted small">Halaman ${page}/${pages}</span>${page < pages ? `<a class="btn ghost sm" href="#hrd-access${qs({ role: fr, page: page + 1 })}">›</a>` : ''}</div>${editable ? '' : '<p class="muted small">Perubahan role hanya oleh Manager HRD dan tercatat di Audit Aktivitas.</p>'}`) : '');
}

/* ---------- F1-NV05 Pengaturan Perusahaan ---------- */
const history = (refPrefix) => { const rows = hr().audit.filter(a => a.ref && String(a.ref).startsWith(refPrefix)); return rows.length ? `<p class="muted small">Riwayat penyimpanan: ${rows.slice(0, 3).map(a => `<a href="#hrd-audit${qs({ id: a.id })}">${a.id} · ${a.at}</a>`).join(' · ')}</p>` : '<p class="muted small">Riwayat penyimpanan: belum ada perubahan sejak fixture.</p>'; };
const roBanner = () => can('settings.edit') ? '' : `<p class="phase-banner"><b>Baca saja.</b> ${esc(def().label)} dapat melihat konfigurasi. Perubahan oleh Manager HRD dan tercatat di Audit Aktivitas.</p>`;
const COMPANY_FIELDS = [['legalName', 'Nama legal'], ['npwp', 'NPWP'], ['address', 'Alamat'], ['workweek', 'Pola kerja'], ['fiscalStart', 'Awal tahun fiskal'], ['timezone', 'Zona waktu']];
function company(params) {
  const tab = ['identity', 'calendar', 'approval', 'numbering', 'templates', 'catalog'].includes(params.tab) ? params.tab : 'identity';
  const s = hr().settings, edit = can('settings.edit');
  let body = '';
  if (tab === 'identity') {
    const ed = edit && COMPANY_FIELDS.find(f => f[0] === params.edit);
    body = card('Identitas perusahaan', table(['Field', 'Nilai', 'Status', ...(edit ? ['Aksi'] : [])], COMPANY_FIELDS.map(([k, l]) => [l, ed && ed[0] === k ? `<form class="inline-form" data-submit="hr:company-set" data-after="hrd-company?tab=identity"><input type="hidden" name="field" value="${k}"><label class="sr" for="cf-${k}">${l}</label><input id="cf-${k}" name="value" value="${esc(s.company[k])}" required minlength="2"><button class="btn sm">Simpan</button><a class="btn ghost sm" href="#hrd-company?tab=identity">Batal</a></form>` : esc(s.company[k]), /Menunggu/.test(s.company[k]) ? chip('Menunggu data resmi', 'sandbox') : chip('Tersimpan', 'ready'), ...(edit ? [ed && ed[0] === k ? '' : `<a class="btn ghost sm" href="#hrd-company${qs({ tab, edit: k })}">Ubah</a>`] : [])])) + history('company.'));
  } else if (tab === 'calendar') {
    body = card('Kalender libur', table(['Tanggal', 'Nama', 'Jenis'], s.calendar.map(c => [c.date, esc(c.name), c.type])) + history('20')) + (edit ? card('Tambah libur', `<form class="workflow-form" data-submit="hr:holiday-add"><label>Tanggal<input type="date" name="date" required></label><label>Nama<input name="name" required minlength="3"></label><label>Jenis<select name="type"><option>Libur nasional</option><option>Cuti bersama</option><option>Libur perusahaan</option></select></label><button class="btn">Simpan</button></form>`) : '');
  } else if (tab === 'approval') {
    body = s.approval.map(a => card(`${a.name} · SLA ${a.sla} hari`, `<ol class="hr-chain">${a.chain.map((c, i) => `<li>${esc(c)}${edit && a.chain.length > 1 ? ` ${btn('approval-remove-level', 'Hapus', { id: a.id, index: i }, 'ghost sm')}` : ''}</li>`).join('')}</ol>${edit ? `<form class="inline-form" data-submit="hr:approval-add-level"><input type="hidden" name="id" value="${a.id}"><label class="sr" for="lv-${a.id}">Level baru ${esc(a.name)}</label><input id="lv-${a.id}" name="level" placeholder="Level approval baru" required minlength="3"><button class="btn ghost sm">Tambah level</button></form>` : ''}${history(a.id)}`)).join('');
  } else if (tab === 'numbering') {
    const sample = (pat, n) => pat.replace('{YY}', '26').replace('{MM}', '11').replace('{OUT}', 'UBD').replace(/\{(0+)\}/, (m, z) => String(n).padStart(z.length, '0'));
    body = card('Penomoran otomatis', table(['Dokumen', 'Pola', 'Contoh nomor berikutnya', ...(edit ? ['Ubah pola'] : [])], s.numbering.map(nm => [esc(nm.name), `<code>${esc(nm.pattern)}</code>`, `<b>${esc(sample(nm.pattern, nm.next))}</b>`, ...(edit ? [`<form class="inline-form" data-submit="hr:numbering-set"><input type="hidden" name="id" value="${nm.id}"><label class="sr" for="nm-${nm.id}">Pola ${esc(nm.name)}</label><input id="nm-${nm.id}" name="pattern" value="${esc(nm.pattern)}" required><button class="btn ghost sm">Simpan</button></form>`] : [])])) + '<p class="muted small">Token: {YY} tahun, {MM} bulan, {OUT} kode outlet, {000} nomor urut.</p>' + history('NUM-'));
  } else if (tab === 'templates') {
    const pay = can('settings.payroll');
    body = card('Template', table(['Kode', 'Template', 'Dipakai di', 'Status'], [...s.templates.map(([c, n, ph]) => [c, esc(n), 'HRD ' + ph, chip('Contoh', 'sandbox')]), ['TPL-NOTIF', 'Template Notifikasi', 'HRD F1', chip('Contoh', 'sandbox')], ['TPL-LEAVE', 'Template Keterangan Cuti', 'HRD F2', chip('Contoh', 'sandbox')], ...(pay ? [['TPL-EXPORT', 'Template Export', 'HRD F7', chip('Khusus Manager HRD', 'ready')], ['TPL-LAYOUT', 'Pengaturan Layout slip', 'HRD F7', chip('Khusus Manager HRD', 'ready')]] : [])]) + (pay ? '' : '<p class="muted small">Template Export dan Layout slip disembunyikan: khusus Manager HRD.</p>'));
  } else {
    const CAT = { 'Perusahaan': ['Perusahaan', 'Billing', 'Alur Bisnis', 'Approval', 'Penomoran Otomatis', 'Audit', 'Kalender'], 'Payroll': ['Payroll', 'Pemetaan Akun COA', 'Kasbon', 'Reimburse'], 'Kehadiran': ['Jadwal Kerja', 'Lembur', 'Validasi Aplikasi Presensi', 'Lokasi Kantor', 'Pelacakan Lokasi'], 'Cuti': ['Cuti Tahunan', 'Cuti Khusus', 'Sakit'], 'Akun & Pengguna': ['Pengguna', 'Peran', 'Grup Akses Data', 'Hak Akses Time Tracker', 'Profilku', 'Notifikasi'], 'Layout & Template': ['Template Notifikasi', 'Pengaturan Layout', 'Template Keterangan Cuti', 'Template Export'], 'Integrasi': ['Integrasi ERP'], 'Tugas': ['Pengaturan Task'] };
    body = card('Katalog pengaturan GajiHub', table(['Kategori', 'Item', 'Ditangani di'], Object.entries(CAT).filter(([k]) => k !== 'Payroll' || can('settings.payroll')).map(([k, v]) => [`<b>${k}</b>`, v.filter(i => can('settings.payroll') || !['Pengaturan Layout', 'Template Export'].includes(i)).join(', '), { 'Perusahaan': link('hrd-company', 'F1-NV05') + ' · ' + link('hrd-audit', 'NV07'), 'Payroll': 'HRD F7', 'Kehadiran': 'HRD F2', 'Cuti': 'HRD F2', 'Akun & Pengguna': link('hrd-access', 'F1-NV04') + ' · ' + link('hrd-system?tab=notifications', 'NV06'), 'Layout & Template': link('hrd-company?tab=templates', 'F1-NV05'), 'Integrasi': link('hrd-system?tab=integrations', 'F1-NV06'), 'Tugas': link('hrd-system?tab=tasks', 'F1-NV06') }[k]])) + (can('settings.payroll') ? '' : '<p class="muted small">Kategori Payroll, Layout dan Template Export khusus Manager HRD.</p>'));
  }
  return roBanner() + tabs('hrd-company', tab, [['identity', 'Identitas'], ['calendar', 'Kalender'], ['approval', 'Kebijakan approval'], ['numbering', 'Penomoran'], ['templates', 'Template'], ['catalog', 'Katalog GajiHub']]) + body;
}

/* ---------- F1-NV06 Pengaturan Sistem ---------- */
function system(params) {
  const tab = ['notifications', 'integrations', 'tasks', 'faq'].includes(params.tab) ? params.tab : 'notifications';
  const s = hr().settings, edit = can('settings.edit');
  let body = '';
  if (tab === 'notifications') body = card('Notifikasi', table(['Pemicu', 'Status', ...(edit ? ['Aksi'] : [])], s.notifications.map(n => [esc(n.name), chip(n.on ? 'Aktif' : 'Nonaktif', n.on ? 'ready' : ''), ...(edit ? [btn('notif-toggle', n.on ? 'Nonaktifkan' : 'Aktifkan', { id: n.id }, 'ghost sm')] : [])])) + `<p class="muted small">Pengiriman ${integ('UI-ONLY SIMULATION')}: tidak ada pesan yang dikirim.</p>` + history('NTF-'));
  else if (tab === 'integrations') body = `<div class="grid g2">${s.integrations.map(([n, st, note]) => { const last = s.lastTest?.[n]; return `<section class="card hr-integ"><h2>${esc(n)}</h2><p>${integ(st)} ${last ? chip(last, /Gagal/.test(last) ? 'bad' : /Belum/.test(last) ? 'sandbox' : 'ready') : chip('Belum diuji')}</p><p class="small">${esc(note)}</p><p class="muted small">Sumber di R&D: fixture lokal · tidak ada koneksi produksi.</p>${btn('integration-test', 'Uji koneksi (simulasi)', { id: n }, 'ghost sm')}</section>`; }).join('')}</div>`;
  else if (tab === 'tasks') body = card('Aturan Tugas', table(['Aturan', 'Isi'], s.taskRules.map(([a, b]) => [esc(a), esc(b)])) + `<p class="muted small">Board, My Day dan kartu lintas modul di ${link('hrd-tasks', 'Tugas (HRD F3)')}.</p>`);
  else body = s.faq.map(([q, a]) => card(esc(q), `<p>${esc(a)}</p>`)).join('') + card('Bagaimana mencoba pembatasan akses?', `<p>Ganti role demo di sidebar ke Staf HRD, lalu buka ${link('hrd-payroll', 'Payroll')} atau ${link('hrd-reports', 'Laporan')}. Layar menampilkan Akses ditolak.</p>`);
  return (tab === 'faq' ? '' : roBanner()) + tabs('hrd-system', tab, [['notifications', 'Notifikasi'], ['integrations', 'Integrasi'], ['tasks', 'Aturan Tugas'], ['faq', 'FAQ']]) + body;
}

/* ---------- F1-NV07 Audit Aktivitas ---------- */
function auditView(params) {
  const h = hr(), payOk = def().payroll === 'detail';
  const hide = (a) => a.sensitive && !payOk;
  if (params.id) {
    const a = h.audit.find(x => x.id === params.id);
    if (!a) return card('Aktivitas tidak ditemukan', link('hrd-audit', '‹ Kembali'));
    return card(`${a.id} · ${esc(a.action)}`, table(['Field', 'Nilai'], [['Objek', `${esc(a.object)} · ${esc(a.ref || '—')}`], ['Pelaku', esc(a.by)], ['Waktu pencatatan', `${esc(a.at)} WITA`], ['Tanggal efektif', esc(a.effective || a.at.slice(0, 10))], ['Ringkasan', esc(a.detail)], ['Sebelum', hide(a) ? '<i>Disembunyikan sesuai izin objek</i>' : esc(a.before ?? '—')], ['Sesudah', hide(a) ? '<i>Disembunyikan sesuai izin objek</i>' : esc(a.after ?? '—')]]) + `<div class="actions">${link('hrd-audit', '‹ Kembali ke audit')}${/^EMP-/.test(a.ref || '') && can('people') ? link('hrd-roster' + qs({ emp: a.ref }), 'Buka penempatan ' + a.ref) : ''}</div>`);
  }
  const actors = [...new Set(h.audit.map(a => a.by))], objects = [...new Set(h.audit.map(a => a.object))], actions = [...new Set(h.audit.map(a => a.action))];
  const q = (params.q || '').toLowerCase();
  const list = h.audit.filter(a => (!params.by || a.by === params.by) && (!params.object || a.object === params.object) && (!params.act || a.action === params.act) && (!params.from || a.at.slice(0, 10) >= params.from) && (!q || `${a.ref} ${a.detail}`.toLowerCase().includes(q)));
  const o = (arr, cur, all) => `<option value="">${all}</option>${arr.map(v => `<option ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join('')}`;
  return `<form id="filters" class="filters" aria-label="Filter audit"><label>Sejak tanggal<input type="date" name="from" value="${esc(params.from || '')}"></label><label>Pelaku <select name="by">${o(actors, params.by, 'Semua pelaku')}</select></label><label>Jenis aksi <select name="act">${o(actions, params.act, 'Semua aksi')}</select></label><label>Objek <select name="object">${o(objects, params.object, 'Semua objek')}</select></label>${params.q ? `<input type="hidden" name="q" value="${esc(params.q)}">` : ''}<button type="button" class="btn ghost" data-action="filter-reset">Reset filter</button></form>` +
    card(`Aktivitas · ${num(list.length)}`, list.length ? table(['Event ID', 'Waktu (WITA)', 'Pelaku', 'Aksi', 'Objek', 'Ringkasan'], list.map(a => [`<a href="#hrd-audit${qs({ id: a.id })}">${a.id}</a>`, a.at, esc(a.by), esc(a.action), `${esc(a.object)} · ${esc(a.ref || '—')}`, hide(a) ? '<i>Rincian khusus Manager HRD</i>' : esc(a.detail)])) : '<p>Tidak ada aktivitas untuk filter ini.</p><button type="button" class="btn" data-action="filter-reset">Reset filter</button>');
}

/* ---------- F1-NV08 Kelola Data Demo R&D ---------- */
function demo(params) {
  const h = hr(), checks = HR.reconcile(h), del = can('dummy.delete');
  const demoCount = h.people.filter(p => p.demo).length, real = h.people.filter(p => !p.demo);
  const confirmBox = params.confirm === '1' && del && demoCount ? `<section class="card hr-confirm" role="alertdialog" aria-labelledby="cf-t" aria-describedby="cf-d"><h2 id="cf-t">Konfirmasi hapus dataset dummy</h2>
    <p id="cf-d">Dataset <b>DS-HRD-DEMO-F1</b>: ${num(demoCount)} profil, ${num(h.placements.filter(p => p.demo).length)} penempatan, ${num(h.accounts.filter(a => a.demo).length)} akun, ${num(h.queue.filter(q => q.demo).length)} antrean dan ${num(h.vacancies.filter(v => v.demo).length)} lowongan berlabel <span class="badge demo">DEMO</span>. Record non-demo (${num(real.length)}) dan audit log tetap utuh. Cakupan dataset diverifikasi sebelum perubahan.</p>
    <form class="workflow-form" data-submit="hr:dummy-delete" data-after="hrd-demo"><label>Ketik <b>HAPUS DUMMY</b> untuk melanjutkan<input name="confirm" required autocomplete="off" autofocus></label><div class="actions"><button class="btn">Hapus dataset dummy</button><a class="btn ghost" href="#hrd-demo">Batal</a></div></form></section>` : '';
  return metrics([['Profil demo', num(demoCount), 'Dataset DS-HRD-DEMO-F1'], ['Record non-demo', num(real.length), real.length ? real.map(r => r.id).join(', ') : 'Data asli dimuat terpisah'], ['Rekonsiliasi', demoCount ? `${checks.filter(c => c.ok).length}/${checks.length}` : '—', demoCount ? 'cek roster brief' : 'dataset kosong'], ['Status dataset', demoCount ? 'Aktif' : 'Dikosongkan']]) +
    confirmBox +
    (demoCount ? card('Rekonsiliasi 158 profil', table(['Pemeriksaan', 'Roster brief', 'Dataset', 'Hasil'], checks.map(c => [esc(c.label), num(c.want), num(c.got), c.ok ? chip('Cocok', 'ready') : chip('Selisih', 'bad')])) + '<p class="muted small">Nama samaran unik dan profil sintetis. Akun role demo memakai nama tim HAWK yang sudah ada (Made Gunarsa, Eni Restini, Tika, Mila, Tina, Dewik, Wahyudi, Asri).</p>') : emptyCard()) +
    card('Kelola dataset', del ? `<div class="actions">${demoCount ? `<a class="btn" href="#hrd-demo?confirm=1">Hapus dataset dummy…</a>` : btn('dummy-load', 'Mulai kembali dari fixture')}${real.some(r => r.id === 'EMP-REAL-001') ? '' : btn('test-add-real', 'Tambah 1 record non-demo (uji)', {}, 'ghost')}</div><p class="muted small">Skenario uji: tambah record non-demo, hapus dataset dummy, lalu pastikan record non-demo masih ada di ${link('hrd-roster', 'roster')}. Pada implementasi cloud, penghapusan wajib dibatasi ke dataset berlabel demo.</p>` : `<p>Hanya Manager HRD yang dapat menghapus atau memuat ulang dataset dummy.</p>`);
}

/* ---------- Pengaturan (hub) ---------- */
function settingsHub() {
  const rows = ITEMS.filter(i => i[5] === 'sub' && i[2].includes('NV')).map(([r, t, c]) => [c, link(r, esc(t)), esc(H.PURPOSE[r] || ''), can(NEED[r]) ? chip('Diizinkan', 'ready') : chip('Ditolak', 'bad')]);
  return card('Pengaturan HRD · F1', table(['NV', 'Layar', 'Isi', `Akses ${esc(def().label)}`], rows)) + `<p class="muted small">Kategori GajiHub lengkap: ${link('hrd-company?tab=catalog', 'Katalog pengaturan')}.</p>`;
}

/* ---------- tujuan F2–F8: status fase & akses ---------- */
const SCOPE = {
  2: 'Direktori, profil pribadi/kontak/kepegawaian/ESS, jadwal dan shift, approval presensi, Harian/Ringkasan, saldo dan pengajuan Izin & Cuti, Kunjungan Klien, Pelacakan Lokasi, Approval, Timeline dan Klien.',
  3: 'Board, Calendar, List, Library, My Tasks dan My Day untuk HRD Operations dan Human Growth, dengan kartu lintas modul.',
  4: 'Landing Karier, lowongan, share link dan QR, formulir Therapist/Receptionist, pipeline kandidat, screening, interview, kontrak, onboarding dan penempatan.',
  5: 'Matriks outlet/divisi, utility therapist (>100% / <70%), simulasi formasi, sumber POS/jadwal dan handoff ke Rekrutmen.',
  6: 'Executive Summary SER, KPI Library, kontrak KPI, XScore, People Performance, 9-Box dan rencana pengembangan.',
  7: 'Payroll periode/slip, komisi POS, Finance handoff, Kasbon/Reimburse, laporan Payroll/PPH/BPJS/Coretax, rasio dan kurva S.',
  8: 'Race Vegen, Daily/Weekly Race, Monthly Reflection, STRACON dan e-Deck delapan halaman.'
};
const PERM_OF = { 'hrd-payroll': 'payroll.view', 'hrd-reports': 'report.view', 'hrd-budget': 'payroll.view' };
ITEMS.filter(i => i[3] === 'planned').forEach(([route, title, , , ph]) => {
  const n = Number(ph.slice(-1));
  const fn = guard(PERM_OF[route] || 'dashboard', () => `<section class="card hr-phase"><h2>${esc(title)} · ${esc(ph)} · Belum dibuat</h2><p>${esc(SCOPE[n])}</p><p>Akses ${esc(def().label)}: ${chip('Diizinkan', 'ready')}${PERM_OF[route] ? ' · khusus Manager HRD' + (def().payroll === 'aggregate' ? ' (Anda: agregat)' : '') : ''}</p><p class="muted small">Dibangun setelah F${n} disetujui. Submenu Keuangan masih sementara.</p><div class="actions">${link('hrd-home', '‹ Beranda HRD')}</div></section>`);
  register(route, fn, () => title);
});

register('hrd-home', guard('dashboard', home), () => TITLES['hrd-home']);
register('hrd-roster', guard('people', roster), (p) => p.emp ? 'Detail Penempatan' : TITLES['hrd-roster']);
register('hrd-org', guard('org', org), () => 'Struktur Organisasi');
register('hrd-access', guard('access.view', access), () => 'Akun, Role & Akses');
register('hrd-company', guard('settings.view', company), () => 'Pengaturan Perusahaan');
register('hrd-system', guard('settings.view', system), () => 'Pengaturan Sistem');
register('hrd-faq', guard('dashboard', () => system({ tab: 'faq' })), () => TITLES['hrd-faq']);
register('hrd-audit', guard('audit.view', auditView), () => 'Audit Aktivitas');
register('hrd-demo', guard('dummy.view', demo), () => 'Kelola Data Demo R&D');
register('hrd-settings', guard('settings.view', settingsHub), () => 'Pengaturan');

/* "Ganti ke role …" / "Pakai" */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-hr-role]');
  if (!b) return;
  H.prefs.role = b.dataset.hrRole; H.savePrefs();
  const sel = document.getElementById('role'); if (sel) sel.value = H.prefs.role;
  H.render(`Role demo: ${HR.roleDef(H.prefs.role).label}`);
});
})();
