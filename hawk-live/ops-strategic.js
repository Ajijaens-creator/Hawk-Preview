/* HAWK Operational · Dashboard Strategis di Dashboard Library (paket A03 Bab 07, enam opsi prioritas). DATA DEMO / SIMULASI.
   Permintaan Owner 23 Nov 2026: dashboard tambahan bergabung di Dashboard Library sidebar.
   Setiap tampilan adalah KOMPOSISI dari sumber yang sudah ada (14 Dashboard Kinerja, case, tugas, checklist, booking, ruang,
   tim). Tidak ada engine skor kedua, rumus baru atau angka resmi:
   - nilai hanya tampil bila sumbernya ada di prototipe; selebihnya ditandai "Kontrak/sumber belum ditetapkan";
   - X-score, bobot, HPP treatment dan skor kesehatan keuangan menunggu kontrak STRACON / kebijakan Finance;
   - aturan "perlu perhatian" adalah ambang demo, bukan target perusahaan.
   Tombol membuka workspace tindakan yang sama (case, tugas, RACE, budget, dashboard sumber). Tidak ada API, WA/email atau posting. */
(function () {
'use strict';
const H = window.OPX, HL = window.HL;
if (!H || !HL || !H.analytics) return;
const A = H.analytics, e = H.escape;
const PREFIX = 'op-strategic-';
const ALL = ['manager', 'assistant'];
const VIEWS = [
  { id: 'owner', nav: 'Ringkasan Strategis', title: 'Ringkasan Strategis Owner', q: 'Outlet mana perlu perhatian dan keputusan apa yang tertunda?', roles: [...ALL, 'hospitality', 'supervisor'], status: 'data' },
  { id: 'xscore', nav: 'X-score Performa Tim', title: 'X-score Performa Tim', q: 'Cabang, departemen dan orang mana membutuhkan dukungan?', roles: [...ALL, 'hospitality', 'supervisor', 'head'], status: 'contract' },
  { id: 'capacity', nav: 'Kapasitas & Terapis', title: 'Kapasitas & Perencanaan Terapis', q: 'Perlu tambahan terapis, skill, perubahan shift atau ruang?', roles: [...ALL, 'supervisor'], status: 'partial' },
  { id: 'customer', nav: 'Customer Focus', title: 'Customer Focus & Hospitality', q: 'Tamu dan masalah mana harus ditindaklanjuti sekarang?', roles: [...ALL, 'hospitality', 'supervisor'], status: 'data' },
  { id: 'hpp', nav: 'HPP & Profitabilitas', title: 'HPP & Profitabilitas Treatment', q: 'Treatment mana menghasilkan kontribusi dan biaya mana menyimpang?', roles: ALL, status: 'design' },
  { id: 'finance', nav: 'Kesehatan Keuangan', title: 'Kesehatan Keuangan & Budget Outlet', q: 'Outlet sehat secara ekonomi dan masih punya ruang belanja berapa?', roles: ALL, status: 'partial' },
];
const STATUS = { data: ['Aktif · data demo', 'green'], partial: ['Sebagian · sumber belum lengkap', 'gold'], contract: ['Menunggu kontrak STRACON', 'gray'], design: ['Desain · menunggu sumber Finance', 'gray'] };
const role = () => H.user().role;
const canView = (id) => { const v = VIEWS.find(x => x.id === id); return !!v && H.has('strategic') && v.roles.includes(role()); };
const visibleViews = () => VIEWS.filter(v => canView(v.id));

/* akses menu: grup "Dashboard Strategis" untuk peran yang memiliki minimal satu tampilan */
const ROLES = [...new Set(VIEWS.flatMap(v => v.roles))];
H.defaultPermissions && ROLES.forEach(r => { const g = H.defaultPermissions[r]; if (g && !g.includes('strategic')) g.push('strategic'); });

/* ---------- helper ---------- */
const NA = (why) => `<span class="st-na" title="${e(why)}">— <small>${e(why)}</small></span>`;
const pct = (v, d = 1) => v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v).toLocaleString('id-ID', { maximumFractionDigits: d }) + '%';
const num = (v, d = 0) => v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v).toLocaleString('id-ID', { maximumFractionDigits: d });
const show = (v, why) => v === null || v === undefined ? NA(why) : e(v);
const outlets = () => { const o = H.state.outletId; return o === 'all' && H.isManager() ? H.outlets : H.outlets.filter(x => x.id === (o === 'all' ? H.user().outlet : o)); };
/* model dashboard per outlet: memakai A.model yang sama dengan Dashboard Kinerja (lingkup outlet diganti sementara) */
const per = (oid, fn) => { const keep = H.state.outletId; H.state.outletId = oid; try { return fn(); } finally { H.state.outletId = keep; } };
const card = (m, key) => { const c = (m && m.cards || []).find(x => x.key === key); return c && c.value !== null && c.value !== undefined ? c.value : null; };
const model = (id) => { try { const m = A.model(id); return m && !m.accessDenied ? m : null; } catch (er) { return null; } };
const dashLink = (id, label) => A.canViewDashboard && A.canViewDashboard(id) ? `<a class="btn btn-sm" href="#op-analytics-${e(id)}">${e(label)} ↗</a>` : '';
const pageLink = (p, label) => H.has(p) ? `<a class="btn btn-sm" href="#op-${e(p)}">${e(label)}</a>` : '';
const period = () => `${H.ui.analyticsFrom || '2026-10-01'} s/d ${H.ui.analyticsTo || '2026-10-31'}`;
const head = (v) => `<div class="st-head"><div><span class="st-eyebrow">DASHBOARD STRATEGIS · ${String(VIEWS.indexOf(v) + 1).padStart(2, '0')} DARI ${VIEWS.length}</span></div><div class="row wrap">${H.badge(STATUS[v.status][0], STATUS[v.status][1])}${H.badge('Data sintetis', 'gold')}</div></div>
  <p class="small muted st-meta">Periode ${e(period())} (mengikuti filter Dashboard Kinerja) · Lingkup ${e(H.state.outletId === 'all' && H.isManager() ? 'seluruh outlet' : H.outletName(outlets()[0]?.id))}. Komposisi dari sumber yang sama; tidak ada rumus atau skor resmi baru.</p>`;
const table = (cols, rows, empty = 'Belum ada data pada lingkup ini.') => `<div class="table-wrap"><table class="st-table"><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}"><div class="empty">${e(empty)}</div></td></tr>`}</tbody></table></div>`;
const section = (title, sub, body, actions = '') => `<section class="card st-card"><div class="card-head"><div><h2 class="card-title">${title}</h2>${sub ? `<p class="small muted">${sub}</p>` : ''}</div>${actions ? `<div class="row wrap">${actions}</div>` : ''}</div>${body}</section>`;
const kpis = (list) => `<div class="st-kpis">${list.map(([l, v, s, tone]) => `<div class="st-kpi ${tone || ''}"><small>${e(l)}</small><strong>${v}</strong>${s ? `<span>${s}</span>` : ''}</div>`).join('')}</div>`;

/* ---------- data operasional per outlet ---------- */
const openCases = (oid) => (H.cases ? H.cases.open() : []).filter(c => c.kind === 'guest' && c.outlet === oid);
const pendingRecords = (oid) => (A.ensure().records || []).filter(r => r.outlet === oid && r.status === 'submitted').length;
const lateTasks = (oid) => H.state.data.tasks.filter(t => t.outlet === oid && t.status !== 'done' && t.status !== 'verified' && (t.dueDate ? t.dueDate < H.demoDate : t.critical)).length;
const openTasks = (oid) => H.state.data.tasks.filter(t => t.outlet === oid && !['done', 'verified'].includes(t.status)).length;
const readiness = (oid) => { const c = H.state.data.checklists?.[oid]; if (!c) return null; const items = Object.values(c).filter(Array.isArray).flat(); if (!items.length) return null; return Math.round(items.filter(i => i.done).length / items.length * 100); };
const FLAG = { sat: 95, acc: 90, mt: 2 }; /* ambang demo, bukan target perusahaan */

/* ---------- 1. Ringkasan Strategis Owner ---------- */
function owner(v) {
  const rows = outlets().map(o => per(o.id, () => {
    const rev = model('revenue'), pnl = model('pnl'), sat = model('satisfaction'), w = model('waste'), mt = model('maintenance');
    const revenue = card(rev, 'total'), profit = card(pnl, 'profit'), revP = card(pnl, 'revenue');
    const margin = revP ? profit / revP * 100 : null, s = card(sat, 'satisfaction'), acc = card(w, 'accuracy'), mo = card(mt, 'open');
    const cases = openCases(o.id).length, late = lateTasks(o.id), pend = pendingRecords(o.id), ready = readiness(o.id);
    const why = [];
    if (s !== null && s < FLAG.sat) why.push(['Kepuasan di bawah ' + FLAG.sat + '%', 'op-analytics-satisfaction']);
    if (acc !== null && acc < FLAG.acc) why.push(['Akurasi stok di bawah ' + FLAG.acc + '%', 'op-analytics-waste']);
    if (mo !== null && mo > FLAG.mt) why.push([mo + ' maintenance terbuka', A.isNavHidden && A.isNavHidden('maintenance') ? null : 'op-analytics-maintenance']); /* NP-HAWK-OP-DASHBOARD-002: tanpa link bila D10 disembunyikan */
    if (cases) why.push([cases + ' case tamu terbuka', 'op-cases']);
    if (late) why.push([late + ' tugas lewat tenggat', 'op-tasks']);
    if (pend) why.push([pend + ' data menunggu verifikasi', 'op-analytics-' + ((A.navDefinitions || A.visibleDefinitions)()[0]?.id || 'revenue')]);
    return { o, revenue, margin, s, acc, mo, cases, late, pend, ready, why };
  }));
  const attention = rows.filter(r => r.why.length);
  return head(v) + kpis([
    ['Outlet perlu perhatian', `${attention.length} / ${rows.length}`, 'aturan demo, bukan target', attention.length ? 'warn' : 'good'],
    ['Case tamu terbuka', String(rows.reduce((a, r) => a + r.cases, 0)), 'dari Hospitality Case'],
    ['Tugas lewat tenggat', String(rows.reduce((a, r) => a + r.late, 0)), 'dari Team & Tasks'],
    ['Data menunggu verifikasi', String(rows.reduce((a, r) => a + r.pend, 0)), 'belum masuk laporan'],
  ]) + section('Perlu perhatian dan keputusan', 'Setiap alasan membuka workspace atau dashboard sumbernya. Ambang: kepuasan &lt; 95%, akurasi stok &lt; 90%, maintenance terbuka &gt; 2 (demo).',
    attention.length ? `<div class="st-attn">${attention.map(r => `<div class="st-attn-row"><b>${e(r.o.name)}</b><div class="row wrap">${r.why.map(([t, h]) => h ? `<a class="st-chip" href="#${e(h)}">${e(t)}</a>` : `<span class="st-chip">${e(t)}</span>`).join('')}</div></div>`).join('')}</div>` : '<div class="empty">Tidak ada outlet yang melewati ambang demo pada periode ini.</div>')
  + section('Ringkasan per outlet', 'Angka dari dashboard sumber yang sama. Margin = net profit ÷ revenue pada dashboard Profit &amp; Loss (belum direkonsiliasi Finance).',
    table(['Outlet', 'Revenue', 'Margin P&amp;L', 'Kepuasan', 'Akurasi stok', 'Maint. terbuka', 'Readiness hari ini', 'Case', 'Tugas telat'],
      rows.map(r => [`<b>${e(r.o.name)}</b>`, show(r.revenue !== null ? H.compact(r.revenue) : null, 'tanpa data'), show(pct(r.margin), 'belum ada P&L'), show(pct(r.s), 'tanpa feedback'), show(pct(r.acc), 'tanpa opname'), show(num(r.mo), 'tanpa data'), show(r.ready === null ? null : r.ready + '%', 'checklist belum ada'), String(r.cases), String(r.late)])),
    dashLink('revenue', 'Revenue') + dashLink('pnl', 'P&L') + pageLink('race', 'Buka RACE'))
  + `<p class="small muted st-foot">Status data: angka hanya dari catatan terverifikasi pada filter aktif. Tidak ada skor gabungan; prioritas tetap diputuskan Owner/Manager di RACE.</p>`;
}

/* ---------- 2. X-score Performa Tim ---------- */
const DEPTS = [['reception', 'Receptionist'], ['therapist', 'Therapist'], ['attendant', 'Attendant'], ['security', 'Security']];
function xscore(v) {
  const recs = (A.ensure().records || []).filter(r => r.status === 'verified' && ['competency', 'grooming'].includes(r.group));
  const scope = outlets(), mine = role() === 'head' ? DEPTS.filter(d => d[0] === H.user().dept) : DEPTS;
  const rows = [];
  scope.forEach(o => mine.forEach(([d, label]) => {
    const team = H.state.data.team.filter(t => t.outlet === o.id && t.dept === d).length;
    const ev = recs.filter(r => r.outlet === o.id && (r.values?.department === d || String(r.values?.department || '').toLowerCase().includes(label.toLowerCase().slice(0, 5))));
    const comp = ev.filter(r => r.group === 'competency').length, groom = ev.filter(r => r.group === 'grooming').length;
    rows.push([`<b>${e(o.name)}</b>`, e(label), String(team), `${comp} kompetensi · ${groom} grooming`, H.badge('Belum ditetapkan', 'gray'), NA('kontrak STRACON belum disahkan'), H.badge(comp || groom ? 'Bukti sebagian' : 'Belum ada bukti', comp || groom ? 'gold' : 'gray')]);
  }));
  return head(v) + `<div class="notice st-notice"><div><strong>Skor belum ditampilkan.</strong><p>X-score hanya sah bila kontrak STRACON (indikator, arah target, bobot, sumber) telah disahkan. Tampilan ini menyiapkan jalur klik dan coverage bukti tanpa menghitung rata-rata nilai individu. Indikator di luar tugas seseorang menjadi N/A, bukan nol.</p></div></div>`
  + section('Jalur penelusuran', '', `<div class="st-path">${['Seluruh outlet', 'Outlet', 'Departemen / tim', 'Individu', 'Indikator kontrak', 'Record pekerjaan & verifikasi'].map((s, i) => `<span>${i + 1}. ${e(s)}</span>`).join('<b>→</b>')}</div>`)
  + section('Coverage bukti per outlet dan departemen', 'Bukti = catatan kompetensi dan grooming terverifikasi pada periode filter. Supervisor tetap satu outlet; Head hanya departemennya.',
    table(['Outlet', 'Departemen', 'Tim aktif', 'Bukti tersedia', 'Kontrak', 'X-score', 'Status'], rows), dashLink('competency', 'Team Competency') + dashLink('grooming', 'Grooming') + pageLink('race', 'Buka RACE / STRACON'))
  + section('Contoh struktur kontrak (bahan diskusi)', 'Belum berisi bobot atau target. Diisi setelah Owner mengesahkan kontrak per outlet/departemen/individu.',
    table(['Komponen', 'Contoh indikator', 'Sumber', 'Bobot / target'], [
      ['Outcome', 'Revenue service per terapis', 'POS (engine)', NA('menunggu kontrak')],
      ['Mutu layanan', 'Feedback terverifikasi per kunjungan', 'Feedback / case', NA('menunggu kontrak')],
      ['Penjaga mutu', 'Grooming & SOP compliance', 'Grooming / checklist', NA('menunggu kontrak')],
      ['Kompetensi', 'Penilaian instrumen per peran', 'Team Competency', NA('menunggu kontrak')],
    ]));
}

/* ---------- 3. Kapasitas & Perencanaan Terapis ---------- */
const REASONS = ['Terapis berskill tidak tersedia', 'Ruang / bed penuh', 'Di luar jam operasional', 'Durasi tidak muat slot', 'Lainnya'];
const OUTCOMES = ['Terlayani di jam lain', 'Terlayani di outlet lain', 'Tidak terlayani'];
const ensureDemand = () => {
  const d = H.state.data; if (Array.isArray(d.unmetDemand)) return d.unmetDemand;
  d.unmetDemand = [
    { id: 'REQ-DEMO-001', outlets: ['CTR', 'SHT'], date: '2026-10-18', slot: '15:00', duration: 90, treatment: 'Balinese Massage (demo)', pax: 2, skill: 'Couple · 2 terapis', reason: REASONS[0], alternative: 'Ditawarkan 17:00 dan Shanti', outcome: OUTCOMES[1], by: 'reception-CTR', demo: true },
    { id: 'REQ-DEMO-002', outlets: ['CTR'], date: '2026-10-21', slot: '16:30', duration: 120, treatment: 'Signature Ritual (demo)', pax: 1, skill: 'Signature', reason: REASONS[3], alternative: 'Ditawarkan 60 menit', outcome: OUTCOMES[2], by: 'reception-CTR', demo: true },
    { id: 'REQ-DEMO-003', outlets: ['TRL'], date: '2026-10-25', slot: '14:00', duration: 60, treatment: 'Foot Reflexology (demo)', pax: 3, skill: 'Reflexology', reason: REASONS[1], alternative: 'Ditawarkan 15:30', outcome: OUTCOMES[0], by: 'reception-TRL', demo: true },
  ];
  return d.unmetDemand;
};
function capacity(v) {
  const list = ensureDemand(), scope = outlets().map(o => o.id);
  const shown = list.filter(r => r.outlets.some(o => scope.includes(o)));
  const rows = outlets().map(o => per(o.id, () => {
    const m = model('capacity');
    const rooms = H.state.data.rooms.filter(r => r.outlet === o.id).length, ther = H.state.data.team.filter(t => t.outlet === o.id && t.dept === 'therapist');
    const onShift = ther.filter(t => !/absen|off|izin|sakit/i.test(t.status || '')).length, book = H.state.data.bookings.filter(b => b.outlet === o.id).length;
    const req = list.filter(r => r.outlets.includes(o.id)), lost = req.filter(r => r.outcome === OUTCOMES[2] && r.outlets[r.outlets.length - 1] === o.id).length;
    return [`<b>${e(o.name)}</b>`, String(rooms), `${onShift} / ${ther.length}`, String(book), show(num(card(m, 'daily-utility'), 1) && num(card(m, 'daily-utility'), 1) + ' jam', 'tanpa data'), show(num(card(m, 'treatments-per-therapist'), 2), 'tanpa data'), `${req.length} · ${lost} tidak terlayani`];
  }));
  const byReason = REASONS.map(r => [r, shown.filter(x => x.reason === r).length]).filter(x => x[1]);
  const canLog = ['manager', 'assistant', 'supervisor'].includes(role());
  return head(v) + `<div class="notice st-notice"><div><strong>Belum ada rekomendasi jumlah rekrutmen.</strong><p>Utility bulanan tanpa pembilang/penyebut waktu tidak cukup. Rekomendasi butuh permintaan tidak terpenuhi yang tercatat per slot dan skill. Kapasitas ruang dan kapasitas terapis adalah batas yang berbeda.</p></div></div>`
  + section('Kapasitas per outlet', 'Ruang, terapis bertugas hari ini dan booking dari data operasional; utility dari dashboard Capacity &amp; Productivity (satuan jam).',
    table(['Outlet', 'Ruang', 'Terapis bertugas', 'Booking hari ini', 'Utility / hari', 'Treatment / terapis / hari', 'Permintaan tak terpenuhi'], rows), dashLink('capacity', 'Capacity & Productivity') + pageLink('rooms', 'Room & Facility') + pageLink('therapist', 'Therapist Workspace'))
  + section('Permintaan tidak terpenuhi', 'Satu permintaan yang dicoba di beberapa outlet tetap satu request. Terlayani di outlet lain bukan kehilangan jaringan. Pada produksi dicatat di Reservation/POS.',
    `${byReason.length ? `<div class="row wrap st-reasons">${byReason.map(([r, n]) => `<span class="st-chip">${e(r)} · ${n}</span>`).join('')}</div>` : ''}` +
    table(['Request', 'Outlet dicoba', 'Slot / durasi / pax', 'Treatment / skill', 'Alasan', 'Alternatif', 'Hasil'], shown.map(r => [`<b>${e(r.id)}</b><small>${e(r.date)}</small>`, e(r.outlets.map(H.outletName).join(' → ')), `${e(r.slot)} · ${e(r.duration)} mnt · ${e(r.pax)} pax`, `${e(r.treatment)}<small>${e(r.skill)}</small>`, e(r.reason), e(r.alternative || '—'), H.badge(r.outcome, r.outcome === OUTCOMES[2] ? 'red' : r.outcome === OUTCOMES[1] ? 'blue' : 'green')])),
    canLog ? `<button class="btn btn-sm btn-primary" data-act="strategic-demand">+ Catat permintaan (demo)</button>` : '')
  + section('Skenario tindakan (dibandingkan, bukan otomatis)', 'Tambahan pegawai tidak membantu bila kendalanya ruang atau permintaan.',
    table(['Pilihan', 'Mengatasi kendala', 'Bukti yang dibutuhkan'], [
      ['Geser shift', 'Terapis kurang pada jam ramai', 'Permintaan per slot + roster'], ['Latih skill tertentu', 'Skill tidak tersedia', 'Request per skill'],
      ['Penugasan lintas outlet berizin', 'Kekurangan sementara', 'Roster lintas outlet + izin HRD'], ['Buka slot / jam', 'Di luar jam operasional', 'Request di luar jam'],
      ['Perbaiki readiness ruang', 'Ruang tidak siap', 'Room & Facility + maintenance'], ['Tambah terapis', 'Kekurangan berulang setelah opsi lain', 'Semua bukti di atas + biaya HRD/Finance'],
    ].map(r => r.map(x => e(x)))));
}
H.actions['strategic-demand'] = () => {
  if (!['manager', 'assistant', 'supervisor'].includes(role())) return H.toast('Pencatatan permintaan oleh Reception/Supervisor sesuai lingkup.');
  const os = outlets();
  H.modal('Catat permintaan tidak terpenuhi (demo)', `<form data-form="strategicDemand" class="stack"><p class="notice">Simulasi lokal. Di produksi dicatat sekali pada Reservation/POS. Tanpa nama tamu.</p>
  <div class="grid-2"><label class="field">Outlet<select name="outlet" required>${os.map(o => `<option value="${o.id}">${e(o.name)}</option>`).join('')}</select></label><label class="field">Tanggal<input type="date" name="date" required value="${e(H.ui.analyticsTo || '2026-10-31')}"></label></div>
  <div class="grid-2"><label class="field">Slot<input type="time" name="slot" required value="15:00"></label><label class="field">Durasi (menit)<input type="number" name="duration" min="15" step="15" required value="60"></label></div>
  <div class="grid-2"><label class="field">Treatment<input name="treatment" required minlength="3" maxlength="80"></label><label class="field">Pax<input type="number" name="pax" min="1" max="20" required value="1"></label></div>
  <label class="field">Skill yang dibutuhkan<input name="skill" required minlength="3" maxlength="60"></label>
  <label class="field">Alasan<select name="reason">${REASONS.map(r => `<option>${e(r)}</option>`).join('')}</select></label>
  <label class="field">Alternatif yang ditawarkan<input name="alternative" maxlength="120"></label>
  <label class="field">Hasil<select name="outcome">${OUTCOMES.map(r => `<option>${e(r)}</option>`).join('')}</select></label>
  <button class="btn btn-primary" type="submit">Simpan</button></form>`);
};
H.forms.strategicDemand = (fd) => {
  try {
    const o = String(fd.get('outlet'));
    if (!outlets().some(x => x.id === o)) throw new Error('Outlet di luar lingkup akun.');
    const r = { id: 'REQ-' + Date.now().toString(36).toUpperCase(), outlets: [o], date: String(fd.get('date')), slot: String(fd.get('slot')), duration: Number(fd.get('duration')), treatment: String(fd.get('treatment') || '').trim(), pax: Number(fd.get('pax')), skill: String(fd.get('skill') || '').trim(), reason: String(fd.get('reason')), alternative: String(fd.get('alternative') || '').trim(), outcome: String(fd.get('outcome')), by: H.user().id, demo: true };
    if (r.treatment.length < 3 || r.skill.length < 3 || !(r.duration > 0) || !(r.pax > 0) || !REASONS.includes(r.reason) || !OUTCOMES.includes(r.outcome)) throw new Error('Lengkapi treatment, skill, durasi dan pax.');
    ensureDemand().push(r); H.log('UNMET_DEMAND_DEMO', r.id, r.reason, o); H.save(); H.closeModal(); H.render(); H.toast(r.id + ' tercatat (demo).');
  } catch (er) { H.toast(er.message); }
};

/* ---------- 4. Customer Focus & Hospitality ---------- */
function customer(v) {
  const scope = outlets().map(o => o.id);
  const cases = (H.cases ? H.cases.guest() : []).filter(c => scope.includes(c.outlet));
  const open = cases.filter(c => !['selesai', 'diverifikasi'].includes(c.caseState));
  const pr = (c) => (c.priority === 'Kritis' ? 0 : 1) + (H.cases.sla(c)?.fin === 'overdue' ? -0.5 : 0);
  const waitVerify = cases.filter(c => c.caseState === 'selesai').length;
  const ret = per(H.state.outletId, () => model('retention'));
  const total = card(ret, 'total'), rep = card(ret, 'repeat');
  const upcoming = H.state.data.bookings.filter(b => scope.includes(b.outlet) && !/selesai|done|paid|cancel/i.test(b.status || '')).length;
  return head(v) + kpis([
    ['Case tamu terbuka', String(open.length), 'termasuk dibuka ulang', open.length ? 'warn' : 'good'],
    ['Lewat SLA selesai', String(open.filter(c => H.cases.sla(c)?.fin === 'overdue').length), `SLA ${H.cases.SLA.resolveH} jam (draft)`],
    ['Recovery menunggu verifikasi', String(waitVerify), 'verifier ≠ PIC'],
    ['Booking mendatang', String(upcoming), 'konteks layanan hari ini'],
  ]) + section('Antrean tindakan Hospitality', 'Urutan: prioritas kritis, lalu SLA yang terlewat. Satu kejadian = satu case; respons lain ditautkan ke case yang sama.',
    table(['Case', 'Outlet', 'Kategori 7P', 'Status', 'SLA respons / selesai', 'PIC'], open.sort((a, b) => pr(a) - pr(b)).map(c => { const s = H.cases.sla(c) || {}; const L = { met: 'Tepat', late: 'Lewat', overdue: 'Lewat · berjalan', running: 'Berjalan' }; return [`<button class="st-link" data-act="case-open" data-id="${e(c.id)}">${e(c.id)}</button><small>${e(c.title)}</small>`, e(H.outletName(c.outlet)), e(c.category7P || '—'), H.badge((H.cases.STATES[c.caseState] || [c.caseState])[0], (H.cases.STATES[c.caseState] || [0, 'gray'])[1]), `${e(L[s.resp] || '—')} / ${e(L[s.fin] || '—')}`, e(c.pic ? H.accountName(c.pic) : 'Belum ditetapkan')]; }), 'Tidak ada case tamu terbuka pada lingkup ini.'),
    pageLink('cases', 'Buka Hospitality Case') + dashLink('satisfaction', 'Customer Satisfaction'))
  + section('Retensi: tiga metrik terpisah', 'Returning share dihitung dari dashboard Rebooking. Rebooking conversion dan cohort retention membutuhkan identitas kunjungan dari POS/CRM, tidak direkayasa dari total harian.',
    table(['Metrik', 'Nilai', 'Sumber'], [
      ['Returning share', show(total ? pct(rep / total * 100) : null, 'tanpa data tamu'), 'Rebooking Customer (repeat ÷ total tamu)'],
      ['Rebooking conversion', NA('butuh booking berikutnya per kunjungan (POS)'), 'POS / Reservation'],
      ['Cohort retention', NA('butuh identitas tamu & window evaluasi (CRM)'), 'Sales / CRM'],
    ]), dashLink('retention', 'Rebooking Customer'))
  + `<p class="small muted st-foot">Sales tetap pemilik Reservation Center dan CRM. Refund, price override dan pengecualian memerlukan izin khusus. Tidak ada WA/email yang dikirim dari sini.</p>`;
}

/* ---------- 5. HPP & Profitabilitas Treatment ---------- */
function hpp(v) {
  const scope = outlets().map(o => o.id), map = {};
  H.state.data.bookings.filter(b => scope.includes(b.outlet)).forEach(b => { const k = b.treatment || '—'; map[k] = map[k] || { n: 0, rev: 0, min: 0 }; map[k].n++; map[k].rev += Number(b.value) || 0; map[k].min += Number(b.duration) || 0; });
  const rows = Object.entries(map).sort((a, b) => b[1].rev - a[1].rev).map(([t, x]) => [`<b>${e(t)}</b>`, String(x.n), H.compact(x.rev), num(x.min / x.n) + ' mnt', NA('recipe belum ada'), NA('movement per treatment belum ada'), NA('basis alokasi Finance')]);
  return head(v) + `<div class="notice st-notice"><div><strong>Belum ada angka HPP resmi.</strong><p>Recipe standar, pemakaian per treatment, valuasi stok dan basis biaya tenaga kerja belum tersedia di sumber yang diaudit. Tampilan ini menyiapkan alur dan lapisan biaya; angka diisi setelah Finance menetapkan kebijakan costing (HPP-001).</p></div></div>`
  + section('Lapisan biaya yang dibedakan', 'Satu biaya tidak ditempatkan di HPP sekaligus OPEX tanpa rekonsiliasi. Pemakaian per shift tidak diberi label aktual per treatment.',
    table(['Lapisan', 'Maksud', 'Contoh sumber', 'Status'], [
      ['HPP standar', 'Biaya menurut recipe/SOP yang disahkan', 'Qty standar BHP × unit cost, durasi & labor basis', H.badge('Recipe belum ada', 'gray')],
      ['Biaya aktual tertelusur', 'Biaya yang benar-benar terhubung ke treatment', 'Movement Inventory, interval treatment, komisi', H.badge('Belum per treatment', 'gray')],
      ['Alokasi outlet', 'Biaya bersama outlet dengan basis disahkan', 'Linen/laundry, utilities, ruang, depresiasi', H.badge('Basis belum disahkan', 'gray')],
      ['Alokasi pusat', 'Beban bersama perusahaan', 'Office/HRD/marketing sesuai cost pool', H.badge('Basis belum disahkan', 'gray')],
    ].map(r => [`<b>${e(r[0])}</b>`, e(r[1]), e(r[2]), r[3]])))
  + section('Treatment pada lingkup ini', 'Volume, revenue dan durasi dari booking demo. Kolom biaya tetap kosong sampai sumber sah tersedia.',
    table(['Treatment', 'Volume', 'Revenue booking', 'Durasi rata-rata', 'HPP standar', 'Biaya aktual', 'Alokasi'], rows), pageLink('budget', 'Budget 7P') + pageLink('inventory', 'Inventory'))
  + section('Alur drilldown yang direncanakan', '', `<div class="st-path">${['Pilih treatment / durasi / outlet / periode', 'Revenue & volume', 'Komponen biaya', 'Standar vs aktual / alokasi', 'Penyebab variance', 'Stock movement, time evidence, jurnal'].map((s, i) => `<span>${i + 1}. ${e(s)}</span>`).join('<b>→</b>')}</div>`)
  + `<p class="small muted st-foot">Akses costing hanya Manager/Assistant dan Finance. Cost per treatment dan kelompok kecil dijaga agar tidak membuka gaji individu lewat hitung balik.</p>`;
}

/* ---------- 6. Kesehatan Keuangan & Budget Outlet ---------- */
function finance(v) {
  const rows = outlets().map(o => per(o.id, () => {
    const p = model('pnl'), w = model('waste');
    const rev = card(p, 'revenue'), ex = card(p, 'expense'), pr = card(p, 'profit'), va = card(p, 'variance'), ws = card(w, 'total-waste');
    return [`<b>${e(o.name)}</b>`, show(rev !== null ? H.compact(rev) : null, 'tanpa P&L'), show(ex !== null ? H.compact(ex) : null, 'tanpa P&L'), show(pr !== null ? H.compact(pr) : null, 'tanpa P&L'), show(rev ? pct(pr / rev * 100) : null, 'tanpa revenue'), show(rev && ex !== null ? pct(ex / rev * 100) : null, 'tanpa revenue'), show(rev && ws !== null ? pct(ws / rev * 100, 2) : null, 'tanpa waste'), show(va !== null ? H.compact(va) : null, 'tanpa target')];
  }));
  return head(v) + `<div class="notice st-notice"><div><strong>Indikator tanpa skor tunggal.</strong><p>Label "sehat" dan bobot skor menunggu pengesahan Owner/Finance. Cash flow, current ratio, quick ratio dan rasio kewajiban hanya tampil di konsolidasi perusahaan bila neraca tersedia; angka perusahaan tidak dibagi ke outlet.</p></div></div>`
  + section('Indikator per outlet', 'Dari dashboard Profit &amp; Loss dan Waste &amp; Accuracy pada filter aktif. Margin belum direkonsiliasi Finance.',
    table(['Outlet', 'Revenue', 'Expense', 'Net profit', 'Margin', 'Biaya ÷ revenue', 'Waste ÷ revenue', 'Selisih ke target'], rows), dashLink('pnl', 'Profit & Loss') + dashLink('waste', 'Waste & Accuracy'))
  + section('Budget dan likuiditas', 'Approved budget, commitment, actual dan forecast mempunyai arti berbeda dan dikelola di Budget 7P / Finance.',
    table(['Indikator', 'Status', 'Pemilik'], [
      ['Approved budget · commitment · actual', 'Lihat Budget 7P (sumber yang sama)', 'Finance'],
      ['Forecast & pacing ke target', NA('forecast belum disahkan'), 'Finance'],
      ['Gap BEP', NA('basis biaya tetap belum ditetapkan'), 'Finance'],
      ['Cash flow · current / quick ratio', NA('konsolidasi perusahaan saja'), 'Finance'],
    ].map(r => [`<b>${e(r[0])}</b>`, r[1].startsWith('<') ? r[1] : e(r[1]), e(r[2])])), pageLink('budget', 'Buka Budget 7P'))
  + `<p class="small muted st-foot">Catatan audit: selisih antara income − total expenses dan kolom net profit referensi belum memiliki bridge. Profit resmi tidak diganti dengan pengurangan kasar; Finance perlu menguraikan alokasi/adjustment.</p>`;
}

const RENDER = { owner, xscore, capacity, customer, hpp, finance };

/* ---------- ikhtisar ---------- */
function overview() {
  const vs = visibleViews();
  return `<div class="st-head"><div><span class="st-eyebrow">DASHBOARD LIBRARY · DASHBOARD STRATEGIS</span><p class="st-q">Sudut pandang keputusan dari sumber yang sama dengan 14 Dashboard Kinerja.</p></div>${H.badge('Bahan desain A03 Bab 07', 'gray')}</div>
  <div class="st-grid">${vs.map(v => `<a class="st-tile" href="#${PREFIX}${v.id}"><span class="st-eyebrow">${String(VIEWS.indexOf(v) + 1).padStart(2, '0')}</span><b>${e(v.title)}</b><p>${e(v.q)}</p>${H.badge(STATUS[v.status][0], STATUS[v.status][1])}</a>`).join('')}</div>
  <p class="small muted st-foot">Jumlah dan penamaan tampilan masih bahan diskusi Owner; bukan enam modul baru. Workspace Ambidex &amp; RACE tetap tempat kerja, STRACON menetapkan kontrak KPI.</p>`;
}

H.pages.strategic = {
  title: 'Dashboard Strategis',
  phase: 'F-OP02 / F-OP10',
  subtitle: () => 'Ringkasan keputusan dari sumber Dashboard Kinerja, case, tugas dan budget. Data sintetis.',
  contract: 'Opsi A03 Bab 07: komposisi dari sumber dan komponen yang sama. Tidak ada engine skor kedua, rumus HPP, bobot X-score atau skor kesehatan keuangan resmi. Ambang "perlu perhatian" adalah demo. Integrasi POS/CRM/Finance/HRD dan kontrak STRACON tetap harus divalidasi.',
  render() {
    const id = H.ui.strategicId;
    if (!id) return overview();
    const v = VIEWS.find(x => x.id === id);
    if (!v || !canView(id)) { const u = H.user(); return `<section class="card opx-denied" role="alert"><div class="card-head"><div><h2 class="card-title">Tidak berwenang</h2><p class="muted small">${e(u.name)} · ${e(u.title)} tidak memiliki akses ke "${e(v ? v.title : id)}" pada matriks akses demo.</p></div>${H.badge('Ditolak', 'red')}</div></section>`; }
    A.ensure(); H.casesEnsure && H.casesEnsure();
    return `<div class="st-page">${RENDER[id](v)}</div>`;
  },
};
H.strategic = { PREFIX, VIEWS, canView, visibleViews, STATUS };
})();
