/* HAWK ERP · four-portal preview shell (Finance → Operational → Commercial → Sales)
   Phase 1: F1-01 portal picker, F1-02 Commercial Executive Summary (SER), F1-03 drill-down,
   F1-04 Sales home, F7-01 screen map. Other routes are the original sandbox screens, labelled with
   the phase that completes them. DATA DEMO / SIMULASI · no network, no accounts, no deployment calls. */
(() => {
const ERP = 'https://preview.hawk.jaens.id/';
/* [route, title, screen code, status] · status: ready | sandbox | planned | hidden */
const PORTALS = {
  Finance: { desc: 'Budget 7P, Purchasing, approval dan rekonsiliasi', items: [['budget', 'Budget 7P', '', 'sandbox'], ['mrf', 'Purchasing & MRF', '', 'sandbox'], ['commission', 'Komisi & Rekonsiliasi', 'F5-02', 'sandbox']] },
  Operational: { desc: 'Operasional outlet, terapis, ruangan dan POS', items: [['pos', 'Operational & POS', 'F4-07', 'sandbox'], ['inventory', 'Inventory', '', 'sandbox']] },
  Commercial: { desc: 'Brand, Marketing & Communications', items: [['commercial', 'Executive Summary', 'F1-02', 'ready'], ['commercial-drill', 'Drill-down Executive Summary', 'F1-03', 'hidden'], ['campaign', 'Campaign Planner', 'F2-02', 'sandbox'], ['studio', 'Content Studio', 'F2-04', 'sandbox'], ['brand', 'Brand & Communications', 'F2-01', 'sandbox'], ['digital', 'Digital Marketing', 'F2-05', 'sandbox'], ['social', 'Social Media', 'F2-06', 'sandbox'], ['kol', 'Media Partner & KOL', 'F2-07', 'sandbox'], ['attribution', 'Audience & Attribution', 'F2-08', 'sandbox'], ['commercial-budget', 'Commercial Budget', 'F2-09', 'sandbox'], ['mentor', 'AI Marketing Mentor', 'F2-10', 'sandbox'], ['-', 'Kinerja Tim'], ['commercial-team', 'Ambidex & XRace', 'F6-01', 'sandbox'], ['commercial-kpi', 'Kinerja & KPI', 'F6-04', 'planned'], ['commercial-status', 'Status Tim', 'F6-07', 'planned']] },
  Sales: { desc: 'Sales, reservasi dan kemitraan', items: [['sales-home', 'Beranda Sales', 'F1-04', 'ready'], ['sales', 'Sales Manager', 'F3-02', 'sandbox'], ['owner', 'Owner Eagle Eye', 'F3-01', 'sandbox'], ['reservation', 'Sales B2C & Reservasi', 'F4-02', 'sandbox'], ['b2b', 'Sales B2B', 'F3-05', 'sandbox'], ['driver', 'Driver & Referral', 'F5-01', 'sandbox'], ['client', 'Client Portal', 'F4-04', 'sandbox'], ['-', 'Kinerja Tim'], ['sales-team', 'Ambidex & XRace', 'F6-01', 'sandbox'], ['sales-kpi', 'Kinerja & KPI', 'F6-04', 'planned'], ['sales-status', 'Status Tim', 'F6-07', 'planned']] }
};
const HOME = { Finance: 'budget', Operational: 'pos', Commercial: 'commercial', Sales: 'sales-home' };
const SCREENS = [
  ['F1-01', 'Pemilih Portal', 1, 'picker', 'ready', 'Semua role'], ['F1-02', 'Commercial Executive Summary', 1, 'commercial', 'ready', 'Commercial Manager, Owner'], ['F1-03', 'Drill-down Executive Summary', 1, 'commercial-drill?metric=revenue', 'ready', 'Commercial Manager, Owner'], ['F1-04', 'Beranda Sales', 1, 'sales-home', 'ready', 'Sales Manager, Owner, staf'],
  ['F2-01', 'Brand & Communications', 2, 'brand', 'sandbox'], ['F2-02', 'Campaign Planner', 2, 'campaign', 'sandbox'], ['F2-03', 'Campaign Detail', 2, 'campaign', 'sandbox'], ['F2-04', 'Content Studio', 2, 'studio', 'sandbox'], ['F2-05', 'Digital Marketing', 2, 'digital', 'sandbox'], ['F2-06', 'Social Media', 2, 'social', 'sandbox'], ['F2-07', 'Media & KOL', 2, 'kol', 'sandbox'], ['F2-08', 'Audience & Attribution', 2, 'attribution', 'sandbox'], ['F2-09', 'Commercial Budget', 2, 'commercial-budget', 'sandbox'], ['F2-10', 'AI Mentor', 2, 'mentor', 'sandbox'],
  ['F3-01', 'Owner Eagle Eye', 3, 'owner', 'sandbox'], ['F3-02', 'Sales Manager Command Center', 3, 'sales', 'sandbox'], ['F3-03', 'Channel & Method Effectiveness', 3, '', 'planned'], ['F3-04', 'My Workspace', 3, '', 'planned'], ['F3-05', 'B2B Pipeline & Accounts', 3, 'b2b', 'sandbox'], ['F3-06', 'Partner & Opportunity Detail', 3, 'b2b', 'sandbox'],
  ['F4-01', 'Reservation Supervisor', 4, '', 'planned'], ['F4-02', 'Omnichannel Inbox', 4, 'reservation', 'sandbox'], ['F4-03', 'Booking Desk', 4, 'reservation', 'sandbox'], ['F4-04', 'Client Booking (mobile)', 4, 'client', 'sandbox'], ['F4-05', 'My Bookings & My Visits (mobile)', 4, 'client', 'sandbox'], ['F4-06', 'My Membership & Profile (mobile)', 4, '', 'planned'], ['F4-07', 'Operational & POS Mock', 4, 'pos', 'sandbox'],
  ['F5-01', 'Driver & Referral Manager', 5, 'driver', 'sandbox'], ['F5-02', 'Commission Review', 5, 'commission', 'sandbox'], ['F5-03', 'Onboarding Driver (mobile)', 5, 'driver', 'sandbox'], ['F5-04', 'Katalog & Reservasi Driver (mobile)', 5, 'driver', 'sandbox'], ['F5-05', 'Komisi & Pesan Driver (mobile)', 5, '', 'planned'],
  ['F6-01', 'Daily Race', 6, 'sales-team', 'sandbox'], ['F6-02', 'Weekly Race', 6, '', 'planned'], ['F6-03', 'Monthly Reflection & STRACON', 6, '', 'planned'], ['F6-04', 'Kinerja & KPI Overview', 6, 'sales-kpi', 'planned'], ['F6-05', 'XScore & People Performance', 6, '', 'planned'], ['F6-06', 'KPI Library & Kontrak', 6, '', 'planned'], ['F6-07', 'Status Tim', 6, 'sales-status', 'planned'],
  ['F7-01', 'Peta Preview', 7, 'screens', 'ready', 'Semua role'], ['F7-02', 'Jejak Booking', 7, 'attribution', 'sandbox']
];
const STATUS_LABEL = { ready: 'Tersedia · Fase 1', sandbox: 'Versi sandbox', planned: 'Belum dibuat', hidden: 'Tersedia' };
const ROLES = [['owner', 'Owner'], ['commercial-manager', 'Commercial Manager'], ['sales-manager', 'Sales Manager'], ['reservation-staff', 'Staf Reservasi B2C'], ['b2b-staff', 'Sales B2B']];
const PURPOSE = {
  commercial: 'Commercial Performance Overview, mengikuti susunan SER Monthly Report Komersial: revenue, target, pelanggan, budget marketing, ROMI, kanal, negara, dan pembatalan per periode dan outlet.',
  'commercial-drill': 'Definisi metrik, pembanding, rincian outlet, dan transaksi POS pendukung.',
  'sales-home': 'Revenue B2C, B2B, dan referral dari dataset yang sama, plus pintu masuk tiap ruang kerja Sales.',
  screens: 'Semua 41 kode layar, status, fase, role, dan link langsung.',
  bridge: 'Satu alur demo dari MRF sampai booking dan POS, lintas empat portal.'
};
const ROLE_SUMMARY = {
  owner: 'Owner membaca hasil lintas outlet: revenue terhadap target, efektivitas marketing, dan pembatalan. Skor personal tidak ditampilkan.',
  'commercial-manager': 'Commercial Manager menilai revenue, target, budget marketing, dan ROMI untuk menentukan campaign berikutnya.',
  'sales-manager': 'Sales Manager membaca hasil booking dan revenue per metode jual untuk mengatur tim B2C, B2B, dan referral.',
  'reservation-staff': 'Staf reservasi melihat ringkasan baca-saja. Tindakan harian ada di Inbox reservasi dan Booking Desk.',
  'b2b-staff': 'Sales B2B melihat kontribusi partner hotel/villa dan status akun. Tindakan ada di Sales B2B.'
};
const KEY = 'hawk-integrated-demo-v1', PREF = 'hawk-live-prefs-v1';
let state = HAWK.fresh();
try { const saved = localStorage.getItem(KEY); if (saved) state = JSON.parse(saved); } catch (e) { /* storage blocked: in-memory only */ }
let prefs = { role: 'commercial-manager', portal: 'Commercial' };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF) || '{}')); } catch (e) { /* ignore */ }
const savePrefs = () => { try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch (e) { /* ignore */ } };

const $ = (s, el = document) => el.querySelector(s);
const view = $('#view'), picker = $('#picker'), nav = $('#nav'), shell = document.body;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v, d = 0) => v === null || v === undefined || Number.isNaN(v) ? '—' : v.toLocaleString('id-ID', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const rp = (n) => n === null || n === undefined ? '—' : 'Rp ' + Math.round(n).toLocaleString('id-ID');
const jt = (n, d = 2) => n === null || n === undefined ? '—' : 'Rp ' + num(n / 1e6, d) + ' jt';
const pct = (v, d = 1) => v === null ? '—' : num(v * 100, d) + '%';
const dec = (n) => n === null ? '—' : n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
const link = (id, title) => `<a href="#${id}">${title}</a>`;
const button = (action, title, id = '') => `<button type="button" class="btn" data-action="${action}" data-id="${id}">${title}</button>`;
const table = (headers, rows, cls = '') => `<div class="tbl-wrap" tabindex="0" role="region" aria-label="Tabel data, dapat digulir"><table class="tbl ${cls}"><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}" class="empty-cell">Tidak ada data untuk filter ini.</td></tr>`}</tbody></table></div>`;
const card = (title, body, cls = '') => `<section class="card ${cls}"><h2>${title}</h2>${body}</section>`;
const SCENE = '<svg class="scene" viewBox="0 0 300 160" preserveAspectRatio="xMaxYMax meet" aria-hidden="true"><g fill="none" stroke="#e5c66a" stroke-width="1.4" opacity=".9"><path d="M210 150V80l20-14 20 14v70M200 80h60M205 66h50M215 55h30M225 44h10M230 30v14"/><path d="M40 150c30-40 70-60 110-55s60 20 90 55"/><circle cx="70" cy="40" r="14"/></g></svg>';
const hero = (title, text, actions = []) => `<section class="hero"><h2>${title}</h2><p>${text}</p>${actions.length ? `<div class="row hero-actions">${actions.map(([h, l]) => `<a class="btn sm" href="${h}">${l}</a>`).join('')}</div>` : ''}${SCENE}</section>`;
const KPI_COLORS = ['g-teal', 'g-violet', 'g-blue', 'g-gold'];
const metrics = (entries) => `<section class="grid g4 keep2 kpis">${entries.map(([label, value, sub], i) => `<div class="kpi ${KPI_COLORS[i % 4]}"><div class="lbl">${label}</div><div class="val">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`).join('')}</section>`;
const bar = (label, value, ratio) => `<div class="metric-row"><span>${label}</span><b>${value}</b></div><div class="meter" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, (ratio || 0) * 100))}%"></span></div>`;

/* ---------- routing ---------- */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '') || 'bridge';
  const [id, q = ''] = raw.split('?');
  return { id, params: Object.fromEntries(new URLSearchParams(q)) };
}
const qs = (params) => { const p = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')); const s = p.toString(); return s ? '?' + s : ''; };
const portalOf = (id) => Object.entries(PORTALS).find(([, p]) => p.items.some(([r]) => r === id))?.[0];
const itemOf = (id) => Object.values(PORTALS).flatMap(p => p.items).find(([r]) => r === id);
const filtersOf = (params) => ({ period: SER.PERIODS.some(p => p.id === params.period) ? params.period : '2026-08', outlet: ['all', ...SER.OUTLETS.map(o => o.key)].includes(params.outlet) ? params.outlet : 'all' });

/* ---------- original sandbox screens (kept routes and interactions) ---------- */
const requests = () => table(['ID', 'Campaign', 'Nominal', 'Status', 'Aksi'], state.requests.map(r => [r.id, r.campaign, rp(r.amount), r.status, r.status === 'submitted' ? button('approve', 'Setujui', r.id) : r.status === 'approved' ? button('post', 'Catat realisasi', r.id) : '—']));
const bookingRows = (rows, actions = false) => table(['Booking', 'Lead', 'Slot', 'Nilai', 'Status', ...(actions ? ['Aksi'] : [])], rows.map(b => [b.id, b.lead || '—', b.slot, rp(b.amount), b.status, ...(actions ? [
  ({ confirmed: () => button('checkin', 'Check-in', b.id) + ' ' + button('cancel', 'Batalkan', b.id), 'checked-in': () => button('complete', 'Selesaikan', b.id), completed: () => button('pay', 'Bayar', b.id), paid: () => b.payout ? 'Perlu penyesuaian Finance' : button('refund', 'Refund', b.id) })[b.status]?.() || '—'
] : [])]));
const budget = () => { const t = HAWK.totals(state); return metrics([['Pagu 7P', rp(state.budget)], ['Komitmen', rp(t.committed)], ['Realisasi', rp(t.actual)], ['Sisa', rp(t.remaining)]]) + card('Realisasi dan komitmen', bar('Realisasi', rp(t.actual), t.actual / state.budget) + bar('Komitmen', rp(t.committed), t.committed / state.budget) + `<p class="muted">Sisa = pagu − komitmen − realisasi. CMP-001 juga tampil sebagai baris budget Giant Spa Ubud Agustus 2026 di ${link('commercial-drill?metric=budget&outlet=ubud', 'Executive Summary')}.</p>`); };
const requestForm = () => `<form class="workflow-form" data-submit="request"><label>Nominal pengajuan (Rp)<input name="amount" type="number" min="1" step="1" required value="2000000"></label><button class="btn">Ajukan MRF</button></form>`;
const bookingForm = (mode = 'client') => {
  const slots = state.slots.filter(slot => !state.bookings.some(b => b.slot === slot && b.status !== 'cancelled'));
  if (!slots.length) return '<p>Semua slot demo terisi.</p>';
  const leadOptions = state.leads.filter(l => l.status !== 'booked').map(l => `<option value="${l.id}">${l.id} · ${l.channel}</option>`).join('');
  return `<form class="workflow-form" data-submit="book">
  ${mode === 'reservation' ? `<label>Lead<select name="id"><option value="">Booking langsung</option>${leadOptions}</select></label>` : ''}
  ${mode === 'driver' ? '<input type="hidden" name="referral" value="yes">' : ''}
  <label>Slot HAWK<select name="slot">${slots.map(s => `<option>${s}</option>`).join('')}</select></label>
  <button class="btn">Konfirmasi booking</button></form>`;
};
const pipeline = () => card('Ubud Hotel Demo', `<p>Tahap saat ini <b>${state.b2b.stage}</b></p><p>Guest Referral · On-site Treatment · Spa Partnership</p>${state.b2b.stage === 'Booking pertama' ? '' : button('pipeline', 'Lanjutkan tahap')}`);
const teams = scope => {
  const tasks = state.tasks.filter(t => t.team === scope);
  return metrics([['Pekerjaan', tasks.length], ['Terverifikasi selesai', tasks.filter(t => t.status === 'done').length]]) +
    card('Ambidex & XRace · Daily Race', table(['Tim', 'Grup', 'PIC', 'Pekerjaan', 'Status', 'Aksi'], tasks.map(t => [t.team, t.group, t.person, t.label, t.status, t.status === 'planned' ? button('task', 'Verifikasi selesai', t.id) : '—']))) +
    '<div class="grid">' + card('Kinerja & KPI', `<p>Completion demo <b>${dec(100 * tasks.filter(t => t.status === 'done').length / tasks.length)}%</b></p><p>XScore dan kontrak KPI masuk tahap pengembangan lanjutan.</p>`) + card('Status Tim', '<p>Status sesi demo · Tidak diketahui</p><p>Jadwal demo · Dalam shift</p>') + '</div>';
};
function bridge() {
  return '<div class="flow">' + Object.entries(PORTALS).map(([group, p]) => `<a class="card" href="#${HOME[group]}"><h2>${group}</h2><small>${p.items.filter(i => i[0] !== '-' && i[3] !== 'hidden').length} ruang demo</small></a>`).join('') + '</div>' +
    card('Skenario uji lintas portal', '<ol><li>Ajukan MRF di Commercial Budget. Setujui dan catat realisasi di Finance.</li><li>Buka lead Instagram/WhatsApp di Sales. Alihkan ke staf atau langsung booking.</li><li>Check-in, selesaikan, lalu bayar di Operational & POS. Cek revenue dan atribusi di Executive Summary (Giant Spa Ubud · Agustus 2026).</li><li>Aktifkan driver setelah perjanjian. Buat booking driver, selesaikan di POS, lalu catat komisi di Finance.</li></ol><div class="actions">' + link('screens', 'Buka peta semua layar') + button('reset', 'Reset demo') + '</div>');
}
function sandboxScreen(id) {
  const t = HAWK.totals(state);
  switch (id) {
    case 'budget': return budget() + card('Daftar pengajuan', requests()) + erpLinks([[23, 'NV-23 Budget vs Actual vs Commitment'], [16, 'NV-16 7P Budget Allocation']]);
    case 'commercial-budget': return budget() + card('Pengajuan campaign Wellness Escape', requestForm() + link('mrf', 'Lihat status di Finance'));
    case 'mrf': return card('Pengajuan, approval dan realisasi', requests()) + erpLinks([[29, 'NV-29 Supervisor Approval Queue'], [31, 'NV-31 Purchasing Workbench']]);
    case 'inventory': return card('Stok demo', table(['Item', 'Tersedia', 'Rujukan'], [['Minyak massage', state.stock + ' botol', link('mrf', 'Purchasing / MRF')]])) + erpLinks([[38, 'NV-38 Inventory Control Dashboard']]);
    case 'pos': return card('Booking → treatment → transaksi', bookingRows(state.bookings, true));
    case 'commission': return metrics([['Revenue dibayar', rp(t.revenue)], ['Komisi valid', rp(t.commission)]]) + card('Komisi per booking', table(['Booking', 'Partner', 'Komisi', 'Status'], state.bookings.filter(b => b.partner).map(b => [b.id, b.partner, b.status === 'paid' ? rp(Math.round(b.amount * b.commissionRate)) : '—', b.payout ? 'Dibayar (demo)' : b.status === 'paid' ? button('payout', 'Catat pembayaran', b.id) : 'Menunggu transaksi valid']))) + erpLinks([[50, 'NV-50 Accounts Payable & Payment Control']]);
    case 'campaign': return card('CMP-001 · Wellness Escape', '<p>Instagram → WhatsApp → reservasi Giant Spa</p><div class="actions">' + link('studio', 'Content Studio') + link('attribution', 'Lihat atribusi') + link('commercial-budget', 'Ajukan biaya') + '</div>');
    case 'studio': return teams('Commercial');
    case 'brand': return card('Brand & Communications', '<p>Pesan demo · Wellness Escape di Giant Spa</p>' + link('campaign', 'Lihat brief campaign'));
    case 'digital': return metrics([['Biaya campaign', rp(t.actual)], ['Revenue teratribusi', rp(t.attributed)], ['ROAS demo', t.roas === null ? '—' : dec(t.roas) + '×']]) + card('Channel campaign', link('attribution', 'Buka jejak channel'));
    case 'social': return card('Instagram → WhatsApp', link('reservation', 'Buka inbox Sales B2C'));
    case 'kol': return card('Media Partner & KOL', '<p>Deliverable demo · Reels Wellness Escape</p>' + link('campaign', 'Buka campaign terkait'));
    case 'mentor': return card('AI Marketing Mentor · Simulasi', `<p>${t.attributed ? 'Bandingkan biaya campaign dengan revenue booking yang telah dibayar.' : 'Uji CTA WhatsApp dan tinjau apakah lead berubah menjadi booking dibayar.'}</p>` + link('attribution', 'Lihat angka pendukung'));
    case 'attribution': return card('Jejak booking', table(['Booking', 'Lead', 'Sumber', 'Kanal', 'Campaign', 'Revenue'], state.bookings.map(b => [b.id, b.lead || '—', b.source, b.channel, b.campaign || '—', b.status === 'paid' ? rp(b.amount) : '—'])));
    case 'sales': case 'owner': return metrics([['Revenue dibayar', rp(t.revenue)], ['Lead terbuka', state.leads.filter(l => l.status !== 'booked').length], ['Komisi valid', rp(t.commission)]]) + card('Jejak hasil Sales', bookingRows(state.bookings)) + pipeline();
    case 'reservation': return card('Inbox reservasi', `<form class="workflow-form" data-submit="lead"><label>Kanal<select name="channel"><option>WhatsApp</option><option>Telepon</option><option>Website</option><option>Sosial media</option><option>Email</option></select></label><button class="btn">Tambah lead demo</button></form>` + table(['Lead', 'Sumber', 'Kanal', 'Status', 'Aksi'], state.leads.map(l => [l.id, l.source, l.channel, l.status, l.status === 'new' ? button('handoff', 'Alihkan ke staf', l.id) : '—']))) + card('Booking Desk', bookingForm('reservation'));
    case 'b2b': return pipeline();
    case 'client': return card('Katalog & booking', `<p>${state.catalog.name} · ${state.catalog.duration} menit · ${rp(state.catalog.price)}</p>` + bookingForm()) + card('Riwayat demo', bookingRows(state.bookings.filter(b => !b.lead && !b.partner)));
    case 'driver': return card('Driver Demo · DRV-001', `<p>${state.partner.active ? 'Aktif' : state.partner.agreement ? 'Menunggu aktivasi' : 'Perjanjian belum disetujui'} · komisi 10%</p>` + (state.partner.active ? bookingForm('driver') : state.partner.agreement ? button('activate', 'Aktifkan partner') : button('agreement', 'Setujui perjanjian demo'))) + card('Booking referral', bookingRows(state.bookings.filter(b => b.partner)));
    case 'commercial-team': return teams('Commercial');
    case 'sales-team': return teams('Sales');
    default: return null;
  }
}
const erpLinks = (items) => `<p class="erp-links">Modul resmi di HAWK ERP preview (rute terverifikasi): ${items.map(([nv, label]) => `<a href="${ERP}#/nv/${nv}" target="_blank" rel="noopener">${label} ↗</a>`).join(' · ')}</p>`;
const phaseBanner = (code, status) => {
  const s = SCREENS.find(x => x[0] === code);
  if (!s || status === 'ready' || status === 'hidden') return '';
  return `<div class="phase-banner"><b>${code} · ${status === 'planned' ? 'Belum dibuat' : 'Versi sandbox'}</b> Layar lengkap dijadwalkan pada Fase ${s[2]}. ${status === 'planned' ? 'Belum ada interaksi di layar ini.' : 'Interaksi sandbox di bawah sudah tersambung ke model lintas portal.'}</div>`;
};
const planned = (code) => card('Belum dibuat', `<p>Layar ${code} termasuk kontrak Fase ${SCREENS.find(x => x[0] === code)?.[2]}. Lihat ${link('screens', 'Peta Preview')} untuk status semua layar.</p>`);

/* ---------- F1-02 Commercial Executive Summary ---------- */
const drillHref = (metric, f, extra = {}) => '#commercial-drill' + qs({ metric, period: f.period, outlet: f.outlet, ...extra });
function delta(cur, prev, label = 'vs bulan lalu', ratioPoints = false) {
  if (cur === null || prev === null || !prev) return `<span class="muted">— ${label}</span>`;
  const change = ratioPoints ? (cur - prev) * 100 : (cur / prev - 1) * 100;
  const down = change < 0;
  return `<span class="${down ? 'down' : 'up'}">${down ? '↓' : '↑'} ${num(Math.abs(change), 1)}${ratioPoints ? ' poin' : '%'} ${label}</span>`;
}
function filterBar(f, params, extra = '') {
  return `<form id="filters" class="filters" aria-label="Filter laporan">
    <label>Periode <select name="period">${SER.PERIODS.map(p => `<option value="${p.id}" ${p.id === f.period ? 'selected' : ''}>${p.label}</option>`).join('')}</select></label>
    <label>Outlet <select name="outlet"><option value="all">Semua outlet</option>${SER.OUTLETS.map(o => `<option value="${o.key}" ${o.key === f.outlet ? 'selected' : ''}>${o.name}${o.note ? ' (belum ada data)' : ''}</option>`).join('')}</select></label>
    ${extra}
    <button type="button" class="btn ghost" data-action="filter-reset">Reset filter</button></form>`;
}
const activeFilters = (f) => `<p class="active-filters" role="status"><b>Filter aktif:</b> ${SER.PERIODS.find(p => p.id === f.period).label} · ${f.outlet === 'all' ? 'Semua outlet' : SER.OUTLETS.find(o => o.key === f.outlet).name} · dibandingkan ${SER.MONTH_NAMES[Number(SER.prevPeriod(f.period).slice(5)) - 1]} 2026</p>`;
function gauge(v) {
  const p = v === null ? 0 : Math.min(v * 100, 100);
  return `<svg class="gauge" viewBox="0 0 104 58" aria-hidden="true"><path d="M5 52 A47 47 0 0 1 99 52" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="9"/><path d="M5 52 A47 47 0 0 1 99 52" pathLength="100" stroke-dasharray="${p} 100" fill="none" stroke="${v !== null && v < 0.9 ? '#e5c66a' : '#9ff0c4'}" stroke-width="9"/><text x="5" y="57" font-size="7">0%</text><text x="99" y="57" font-size="7" text-anchor="end">100%</text></svg>`;
}
function trendChart(rows, f) {
  const vals = rows.flatMap(r => [r.y2026, r.y2025]).filter(v => v !== null);
  const max = Math.max(1, ...vals);
  const x = i => 44 + i * 29, y = v => 124 - v / max * 100;
  const pts = (key) => rows.filter(r => r[key] !== null).map((r, i) => `${x(i)},${y(r[key])}`).join(' ');
  return `<a class="chart-link" href="${drillHref('annual', f)}" aria-label="Buka rincian revenue bulanan"><svg class="chart" viewBox="0 0 390 156" role="img" aria-label="Revenue bulanan 2026 dibanding 2025, Rp juta. Nilai lengkap ada di tabel di bawah grafik.">
  ${[0, max / 2, max].map(v => `<path d="M44 ${y(v)}H370" stroke="#e3e0d7"/><text x="0" y="${y(v) + 3}">${num(v / 1e6)}</text>`).join('')}
  <polyline points="${pts('y2025')}" fill="none" stroke="#625d52" stroke-width="2" stroke-dasharray="5 4"/>
  <polyline points="${pts('y2026')}" fill="none" stroke="#AD7D36" stroke-width="3"/>
  ${rows.filter(r => r.y2026 !== null).map((r, i) => `<circle cx="${x(i)}" cy="${y(r.y2026)}" r="3" fill="#AD7D36"/>`).join('')}
  ${rows.map((r, i) => `<text x="${x(i)}" y="146" text-anchor="middle">${r.label}</text>`).join('')}</svg></a>
  <div class="legend"><span><i class="swatch solid"></i>2026 s.d. periode terpilih</span><span><i class="swatch dashed"></i>2025</span><span>Rp juta</span></div>
  <details><summary>Lihat tabel revenue bulanan</summary>${table(['Bulan', '2026', '2025', 'Sumber 2026'], rows.map(r => [r.label, r.y2026 === null ? '—' : jt(r.y2026, 0), jt(r.y2025, 0), r.source2026]))}</details>`;
}
const barLink = (href, label, value, ratio, color = '') => `<a class="bar-link" href="${href}"><span class="metric-row"><span>${label}</span><b>${value}</b></span><span class="meter" aria-hidden="true"><span class="${color}" style="width:${Math.max(0, Math.min(100, (ratio || 0) * 100))}%"></span></span></a>`;
function insight(S, f) {
  const c = S.cur, p = S.prev;
  if (!c.hasData || !p.hasData) return `<p>Data tidak cukup untuk membuat insight pada filter ini. Pilih periode atau outlet yang sudah punya transaksi POS.</p>`;
  const revCh = c.revenue / p.revenue - 1, ordCh = c.orders / p.orders - 1, aovCh = c.aov / p.aov - 1;
  const driver = Math.abs(ordCh) >= Math.abs(aovCh) ? `volume order (${ordCh >= 0 ? '+' : ''}${num(ordCh * 100, 1)}%)` : `nilai per order (${aovCh >= 0 ? '+' : ''}${num(aovCh * 100, 1)}%)`;
  const worst = S.cancel.filter(x => x.Jadwal + x.Tamu).sort((a, b) => (b.Jadwal + b.Tamu) - (a.Jadwal + a.Tamu))[0];
  const unknown = S.groups.find(g => g.key === 'Tidak diketahui');
  const gap = c.target - c.revenue;
  const acts = [];
  if (c.etr !== null && c.etr < 1) acts.push(`Kejar selisih target ${jt(gap)}: setara ±${num(Math.ceil(gap / c.aov))} order pada AOV saat ini.`);
  if (worst) acts.push(`Tinjau ${worst.Jadwal + worst.Tamu} pembatalan di ${worst.name} (${worst.Jadwal} karena jadwal). Uji pengingat H-1 dan opsi reschedule di Booking Desk.`);
  if (unknown && unknown.revenue) acts.push(`${jt(unknown.revenue)} revenue belum punya sumber akuisisi. Wajibkan isian sumber saat booking agar atribusi lengkap.`);
  return `<p>Revenue ${revCh >= 0 ? 'naik' : 'turun'} <b>${num(Math.abs(revCh) * 100, 1)}%</b> dibanding bulan lalu, terutama dari ${driver}. Pencapaian target <b>${pct(c.etr)}</b>; ROMI <b>${dec(c.romi)}×</b>.</p>
  <h3>Tindakan yang disarankan</h3><ol>${acts.map(a => `<li>${a}</li>`).join('')}</ol>
  <p class="muted">Aturan deterministik (simulasi), bukan model AI. Angka pendukung dapat dibuka dari setiap kartu.</p>`;
}
function summaryScreen(params) {
  const f = filtersOf(params);
  const cond = params.state || 'normal';
  const condSel = `<label>Kondisi data <select name="state"><option value="normal">Normal</option><option value="loading" ${cond === 'loading' ? 'selected' : ''}>Loading (simulasi)</option><option value="error" ${cond === 'error' ? 'selected' : ''}>Error (simulasi)</option></select></label>`;
  const role = prefs.role;
  const head = hero(`Ringkasan ${ROLES.find(r => r[0] === role)[1]}`, ROLE_SUMMARY[role], [[`${drillHref('revenue', f)}`, 'Rincian revenue'], [`${drillHref('budget', f)}`, 'Budget vs realisasi'], ['#screens', 'Peta layar']]);
  const top = `<div class="heading-row">${filterBar(f, params, condSel)}</div>${activeFilters(f)}`;
  if (cond === 'loading') { setTimeout(() => { if (parseHash().params.state === 'loading') go('commercial', { ...f, state: '' }, true); }, 1200); return top + head + `<div class="loading" role="status" aria-live="polite"><span class="spinner" aria-hidden="true"></span> Memuat data POS dan budget (simulasi)…</div><div class="skeleton-grid" aria-hidden="true">${'<div class="card skeleton"></div>'.repeat(10)}</div>`; }
  if (cond === 'error') return top + head + `<div class="card error-state" role="alert"><h2>Data belum dapat dimuat (simulasi)</h2><p>Sumber POS demo tidak merespons. Tidak ada angka yang ditampilkan agar tidak menyesatkan.</p><button type="button" class="btn" data-action="retry">Coba lagi</button></div>`;
  const S = SER.summary(state, f.period, f.outlet), c = S.cur, p = S.prev;
  if (!c.hasData) return top + head + `<div class="card empty-state" role="status"><h2>Belum ada transaksi POS</h2><p>${esc(SER.OUTLETS.find(o => o.key === f.outlet)?.note || 'Tidak ada data untuk filter ini.')}</p><p>Semua KPI ditampilkan “—”. Pilih outlet lain atau ${'<button type="button" class="btn ghost" data-action="filter-reset">reset filter</button>'}.</p></div>` + kpiRow(c, p, f, S);
  const maxG = Math.max(1, ...S.groups.map(g => g.revenue));
  const maxC = Math.max(1, ...S.countries.map(x => x.customers));
  const sb = HAWK.totals(state);
  return top + head + kpiRow(c, p, f, S) + `
  <div class="grid g-mid">
    <section class="card"><div class="card-head"><h2>Annual Revenue Comparison</h2><a href="${drillHref('annual', f)}">Rincian ›</a></div>${trendChart(S.annual, f)}</section>
    <section class="card"><div class="card-head"><h2>Budget Realization</h2><a href="${drillHref('budget', f)}">Rincian ›</a></div><div class="budget"><div class="ring" style="--value:${Math.min(100, (c.realization || 0) * 100)}%" role="img" aria-label="Realisasi ${pct(c.realization)} dari pagu"><b>${pct(c.realization)}</b></div><dl><dt>Pagu</dt><dd>${jt(c.pagu)}</dd><dt>Komitmen</dt><dd>${jt(c.committed)}</dd><dt>Realisasi</dt><dd>${jt(c.actual)}</dd><dt>Sisa</dt><dd>${jt(c.remaining)}</dd></dl></div><p class="muted small">Sisa = pagu − komitmen − realisasi. ${c.ids.includes('OUT-UBD') && f.period === '2026-08' ? `Termasuk CMP-001 dari sandbox: komitmen ${rp(sb.committed)}, realisasi ${rp(sb.actual)}.` : ''}</p></section>
    <section class="card"><div class="card-head"><h2>Return on Marketing Investment</h2><a href="${drillHref('romi', f)}">Rincian ›</a></div><strong class="number">${dec(c.romi)}×</strong><div>${delta(c.romi, p.romi)}</div><p class="muted small">(Kontribusi teratribusi sebelum biaya marketing − biaya marketing) ÷ biaya marketing. Kontribusi ${jt(c.contribution)} · biaya ${jt(c.actual)}.</p><p class="muted small">ROAS iklan ${dec(c.roas)}× · CAC ${rp(c.cac)} per pelanggan baru (${num(c.newCustomers)})</p></section>
  </div>
  <div class="grid g3 g-bottom">
    <section class="card"><div class="card-head"><h2>Tracking by Channel Group</h2><a href="${drillHref('channel', f)}">Rincian ›</a></div><p class="muted small">Revenue POS dibayar per grup sumber akuisisi</p>${S.groups.map((g, i) => barLink(drillHref('channel', f, { group: g.key }), `${g.key} · ${pct(SER.div(g.revenue, c.revenue))}`, jt(g.revenue), g.revenue / maxG, 'c' + i)).join('')}</section>
    <section class="card"><div class="card-head"><h2>Tracking by Country</h2><a href="${drillHref('country', f)}">Rincian ›</a></div><p class="muted small">Pelanggan unik per negara</p>${S.countries.slice(0, 6).map(x => barLink(drillHref('country', f, { country: x.key }), x.key, num(x.customers), x.customers / maxC)).join('')}${S.countries.length > 6 ? `<p class="muted small">+${S.countries.length - 6} negara lain di rincian</p>` : ''}</section>
    <section class="card"><div class="card-head"><h2>Cancellation Reason by Branch</h2><a href="${drillHref('cancel', f)}">Rincian ›</a></div>${table(['Outlet', 'Jadwal', 'Tamu', 'Total'], S.cancel.map(x => [`<a href="${drillHref('cancel', f, { branch: x.outlet })}">${esc(x.name)}</a>`, x.Jadwal, x.Tamu, `<b>${x.Jadwal + x.Tamu}</b>`]))}</section>
  </div>
  <section class="card insight"><div class="card-head"><h2>Executive Insight <span class="badge">SIMULASI</span></h2></div>${insight(S, f)}</section>`;
}
function kpiRow(c, p, f, S) {
  const k = (metric, title, value, sub, cls) => `<a class="kpi-btn" href="${drillHref(metric, f)}"><div class="kpi ${cls}"><div class="lbl">${title}</div><div class="val">${value}</div><div class="sub">${sub}</div><span class="more">Rincian ›</span></div></a>`;
  return `<div class="grid g4 keep2 kpis kpi-row">
    ${k('revenue', 'Total Revenue', jt(c.hasData ? c.revenue : null), `${delta(c.hasData ? c.revenue : null, p.revenue)}<br><span class="muted">${S && S.sameMonthLastYear ? delta(c.revenue, S.sameMonthLastYear, 'vs Agu/Jul 2025').replace('Agu/Jul', SER.MONTHS[Number(f.period.slice(5)) - 1]) : ''}</span>`, 'g-teal')}
    ${k('customers', 'Total Customers', c.hasData ? num(c.customers) : '—', delta(c.hasData ? c.customers : null, p.customers) + `<br><span class="muted">${c.hasData ? num(c.newCustomers) + ' pelanggan baru' : ''}</span>`, 'g-violet')}
    ${k('etr', 'Effective Target Rate', pct(c.etr), `${gauge(c.etr)}<span class="muted">Target ${jt(c.hasData ? c.target : null)} · ${delta(c.etr, p.etr, 'vs bulan lalu', true)}</span>`, 'g-blue')}
    ${k('aov', 'Average Order Value', rp(c.aov), delta(c.aov, p.aov) + `<br><span class="muted">${c.hasData ? num(c.orders) + ' order dibayar' : ''}</span>`, 'g-gold')}
  </div>`;
}

/* ---------- F1-03 drill-down ---------- */
const PAGE = 25;
function drillScreen(params) {
  const f = filtersOf(params), metric = SER.DEFINITIONS[params.metric] ? params.metric : 'revenue';
  const D = SER.DEFINITIONS[metric];
  const S = SER.summary(state, f.period, f.outlet), c = S.cur, p = S.prev;
  const extra = `<input type="hidden" name="metric" value="${metric}">${params.group ? `<input type="hidden" name="group" value="${esc(params.group)}">` : ''}${params.country ? `<input type="hidden" name="country" value="${esc(params.country)}">` : ''}${params.branch ? `<input type="hidden" name="branch" value="${esc(params.branch)}">` : ''}`;
  const back = `<a class="back" href="#commercial${qs({ period: f.period, outlet: f.outlet })}">‹ Kembali ke Executive Summary</a>`;
  const tabs = `<nav class="tabs" aria-label="Metrik">${Object.entries(SER.DEFINITIONS).map(([k, d]) => `<a class="tab${k === metric ? ' on' : ''}" href="${drillHref(k, f)}" ${k === metric ? 'aria-current="page"' : ''}>${d.title}</a>`).join('')}</nav>`;
  const sub = params.group ? ` · grup <b>${esc(params.group)}</b>` : params.country ? ` · negara <b>${esc(params.country)}</b>` : params.branch ? ` · outlet <b>${esc(SER.OUTLETS.find(o => o.id === params.branch)?.name || params.branch)}</b>` : '';
  const cmp = comparison(metric, S, f);
  const def = card('Definisi dan denominator', `<dl class="def"><dt>Rumus</dt><dd>${D.formula}</dd><dt>Pembilang</dt><dd>${D.numerator}</dd><dt>Penyebut</dt><dd>${D.denominator}</dd><dt>Catatan</dt><dd>${D.note} Denominator nol ditampilkan “—”.</dd></dl>`);
  const rows = drillRows(metric, S, params);
  const q = (params.q || '').trim().toUpperCase();
  const filtered = q ? rows.data.filter(r => r.key.toUpperCase().includes(q)) : rows.data;
  const pageN = Math.max(1, Math.min(Math.ceil(filtered.length / PAGE) || 1, Number(params.page) || 1));
  const shown = filtered.slice((pageN - 1) * PAGE, pageN * PAGE);
  const base = { metric, period: f.period, outlet: f.outlet, group: params.group, country: params.country, branch: params.branch, q: params.q };
  const pager = filtered.length > PAGE ? `<nav class="pager" aria-label="Halaman tabel">${pageN > 1 ? `<a href="#commercial-drill${qs({ ...base, page: pageN - 1 })}">‹ Sebelumnya</a>` : ''}<span>Halaman ${pageN} dari ${Math.ceil(filtered.length / PAGE)} · ${num(filtered.length)} baris</span>${pageN * PAGE < filtered.length ? `<a href="#commercial-drill${qs({ ...base, page: pageN + 1 })}">Berikutnya ›</a>` : ''}</nav>` : `<p class="muted small">${num(filtered.length)} baris</p>`;
  const search = rows.searchable ? `<form class="workflow-form" data-search="1" role="search"><label>Cari ID ${rows.searchLabel}<input name="q" value="${esc(params.q || '')}" placeholder="mis. POS-BK-001"></label><button class="btn">Cari</button>${params.q ? `<a href="#commercial-drill${qs({ ...base, q: '' })}">Hapus pencarian</a>` : ''}</form>` : '';
  return `${back}<div class="heading-row"><p class="subtitle">F1-03 · ${D.title}${sub}</p>${filterBar(f, params, extra)}</div>${activeFilters(f)}${tabs}
  <div class="grid">${cmp}${def}</div>
  ${rows.breakdown || ''}
  ${card(rows.title, search + table(rows.headers, shown.map(r => r.cells)) + pager + (rows.foot || ''))}`;
}
function comparison(metric, S, f) {
  const c = S.cur, p = S.prev;
  const fmt = { revenue: v => jt(v), customers: v => num(v), etr: v => pct(v), aov: v => rp(v), annual: v => jt(v), budget: v => pct(v), romi: v => dec(v) + '×', channel: v => jt(v), country: v => num(v), cancel: v => num(v) }[metric];
  const pick = { revenue: s => s.hasData ? s.revenue : null, customers: s => s.hasData ? s.customers : null, etr: s => s.etr, aov: s => s.aov, annual: s => s.hasData ? s.revenue : null, budget: s => s.realization, romi: s => s.romi, channel: s => s.hasData ? s.revenue : null, country: s => s.hasData ? s.customers : null, cancel: () => null }[metric];
  const prevLabel = SER.MONTH_NAMES[Number(SER.prevPeriod(f.period).slice(5)) - 1] + ' 2026';
  const curLabel = SER.PERIODS.find(x => x.id === f.period).label;
  if (metric === 'cancel') { const tot = S.cancel.reduce((s, x) => s + x.Jadwal + x.Tamu, 0); return card('Periode pembanding', `<dl class="def"><dt>${curLabel}</dt><dd>${num(tot)} booking batal</dd><dt>Basis</dt><dd>Booking batal tidak punya transaksi POS dan tidak mengurangi revenue.</dd></dl>`); }
  const ly = metric === 'revenue' || metric === 'annual' ? `<dt>${SER.MONTHS[Number(f.period.slice(5)) - 1]} 2025</dt><dd>${jt(S.sameMonthLastYear)} ${delta(c.revenue, S.sameMonthLastYear, 'YoY')}</dd>` : '';
  const parts = metric === 'etr' ? `<dt>Rincian</dt><dd>${jt(c.revenue)} ÷ ${jt(c.target)}</dd>` : metric === 'aov' ? `<dt>Rincian</dt><dd>${jt(c.revenue)} ÷ ${num(c.orders)} order</dd>` : metric === 'romi' ? `<dt>Rincian</dt><dd>(${jt(c.contribution)} − ${jt(c.actual)}) ÷ ${jt(c.actual)}</dd>` : metric === 'budget' ? `<dt>Rincian</dt><dd>${jt(c.actual)} ÷ ${jt(c.pagu)} · sisa ${jt(c.remaining)}</dd>` : '';
  return card('Periode pembanding', `<dl class="def"><dt>${curLabel}</dt><dd><b>${fmt(pick(c))}</b></dd><dt>${prevLabel}</dt><dd>${fmt(pick(p))} ${delta(pick(c), pick(p), 'vs bulan lalu', metric === 'etr' || metric === 'budget')}</dd>${ly}${parts}<dt>Refund dikecualikan</dt><dd>${num(c.refunded.length)} transaksi · ${jt(c.refundAmount)}</dd></dl>`);
}
const outletName = (id) => SER.OUTLETS.find(o => o.id === id)?.name || id;
const campaignName = (id) => id ? `${id} · ${SER.CAMPAIGNS.find(x => x.id === id)?.name || ''}` : '—';
function txCells(x) {
  return [`<details><summary>${x.id}${x.sandbox ? ' <span class="badge">SANDBOX</span>' : ''}</summary><dl class="def compact"><dt>Booking</dt><dd>${x.booking}</dd><dt>Lead</dt><dd>${x.lead || '—'}</dd><dt>Pelanggan</dt><dd>${x.customer}</dd><dt>Treatment</dt><dd>${esc(x.treatmentName)} · ${x.guests} tamu · harga daftar ${rp(x.listPrice)}${x.adjustment ? ` · penyesuaian ${rp(x.adjustment)}` : ''}</dd><dt>Kanal kontak</dt><dd>${x.contact}</dd><dt>Jalur konfirmasi</dt><dd>${x.confirm}</dd><dt>Metode jual</dt><dd>${x.method}</dd><dt>Partner / kode</dt><dd>${x.partner || '—'} ${x.referralCode ? '· ' + x.referralCode : ''}</dd><dt>Biaya langsung · komisi</dt><dd>${rp(x.directCost)} · ${rp(x.commission)}</dd></dl></details>`,
    x.date, esc(outletName(x.outlet)), x.source || 'Tidak diketahui', x.group, campaignName(x.campaign), x.status === 'paid' ? 'Dibayar' : `Refund${x.refundReason ? ' · ' + x.refundReason : ''}`, `<span class="num">${rp(x.amount)}</span>`];
}
const TX_HEAD = ['Transaksi POS', 'Tanggal', 'Outlet', 'Sumber akuisisi', 'Grup', 'Campaign', 'Status', 'Nilai'];
function drillRows(metric, S, params) {
  const c = S.cur, ds = S.ds;
  const sortTx = rows => rows.slice().sort((a, b) => (b.sandbox - a.sandbox) || b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const txRows = (rows) => sortTx(rows).map(x => ({ key: x.id + ' ' + x.booking + ' ' + x.customer, cells: txCells(x) }));
  const byOutlet = (title, cols, fn) => card(title, table(cols, c.ids.map(id => fn(id, SER.slice(ds, c.period, SER.OUTLETS.find(o => o.id === id).key)))));
  switch (metric) {
    case 'customers': case 'country': {
      const per = new Map();
      c.paid.forEach(x => { const r = per.get(x.customer) || { orders: 0, revenue: 0, outlet: x.outlet }; r.orders++; r.revenue += x.amount; per.set(x.customer, r); });
      let list = [...per.entries()].map(([id, r]) => ({ id, ...r, ...ds.customers.get(id) }));
      if (params.country) list = list.filter(x => x.country === params.country);
      return { title: `Pelanggan unik (${num(list.length)})`, searchable: true, searchLabel: 'pelanggan', headers: ['Pelanggan (anonim)', 'Outlet', 'Negara', 'Baru / repeat', 'Order', 'Revenue'], data: list.sort((a, b) => b.revenue - a.revenue).map(x => ({ key: x.id, cells: [x.id, esc(outletName(x.outlet)), x.country, x.firstPeriod === c.period ? 'Baru' : 'Repeat', num(x.orders), rp(x.revenue)] })),
        breakdown: metric === 'country' ? card('Distribusi negara', table(['Negara', 'Pelanggan', 'Pangsa'], S.countries.map(x => [`<a href="${drillHref('country', filtersOf(params), { country: x.key })}">${x.key}</a>`, num(x.customers), pct(SER.div(x.customers, c.customers))]))) : byOutlet('Per outlet', ['Outlet', 'Pelanggan unik', 'Pelanggan baru', 'Order'], (id, s) => [esc(outletName(id)), num(s.customers), num(s.newCustomers), num(s.orders)]) };
    }
    case 'etr': return { title: 'Transaksi POS pembentuk revenue', searchable: true, searchLabel: 'transaksi', headers: TX_HEAD, data: txRows(c.paid), breakdown: byOutlet('Target vs aktual per outlet', ['Outlet', 'Target', 'Revenue aktual', 'Effective Target Rate', 'Selisih'], (id, s) => [esc(outletName(id)), jt(s.hasData ? s.target : null), jt(s.hasData ? s.revenue : null), pct(s.etr), jt(s.hasData ? s.revenue - s.target : null)]) };
    case 'aov': return { title: 'Order POS dibayar', searchable: true, searchLabel: 'transaksi', headers: TX_HEAD, data: txRows(c.paid), breakdown: byOutlet('AOV per outlet', ['Outlet', 'Revenue', 'Order', 'AOV'], (id, s) => [esc(outletName(id)), jt(s.hasData ? s.revenue : null), num(s.orders), rp(s.aov)]) };
    case 'annual': return { title: 'Revenue bulanan', searchable: false, headers: ['Bulan', '2026', '2025', 'Perubahan', 'Sumber 2026'], data: S.annual.map(r => ({ key: r.label, cells: [r.label, r.y2026 === null ? '—' : jt(r.y2026, 0), jt(r.y2025, 0), r.y2026 === null || !r.y2025 ? '—' : delta(r.y2026, r.y2025, 'YoY'), r.source2026] })) };
    case 'budget': return { title: 'Baris budget marketing (Budget 7P · Promotion)', searchable: false, headers: ['Baris budget', 'Outlet', 'Tipe', 'Campaign', 'Pagu', 'Komitmen', 'Realisasi', 'Sisa', 'Referensi MRF'], data: c.lines.map(b => ({ key: b.id, cells: [`${b.id}<br><small>${esc(b.name)}</small>`, esc(outletName(b.outlet)), b.type, campaignName(b.campaign), rp(b.pagu), rp(b.committed), rp(b.actual), rp(b.pagu - b.committed - b.actual), b.campaign === 'CMP-001' && b.outlet === 'OUT-UBD' && c.period === '2026-08' ? `${b.mrf} · ${link('commercial-budget', 'sandbox')}` : b.mrf] })), foot: `<p class="muted small">Total pagu ${rp(c.pagu)} · komitmen ${rp(c.committed)} · realisasi ${rp(c.actual)} · sisa ${rp(c.remaining)}. Approval dan posting dilakukan di ${link('mrf', 'Finance › Purchasing & MRF')}.</p>` };
    case 'romi': return { title: 'Transaksi teratribusi campaign', searchable: true, searchLabel: 'transaksi', headers: TX_HEAD, data: txRows(c.paid.filter(x => x.campaign)), breakdown: card('Kontribusi per campaign', table(['Campaign', 'Transaksi', 'Revenue', 'Biaya langsung', 'Komisi', 'Kontribusi'], SER.CAMPAIGNS.map(cp => { const r = c.paid.filter(x => x.campaign === cp.id); return [campaignName(cp.id), num(r.length), rp(r.reduce((s, x) => s + x.amount, 0)), rp(r.reduce((s, x) => s + x.directCost, 0)), rp(r.reduce((s, x) => s + x.commission, 0)), rp(r.reduce((s, x) => s + x.amount - x.directCost - x.commission, 0))]; }).filter(r => r[1] !== '0'))) };
    case 'channel': return { title: `Transaksi POS${params.group ? ' · ' + esc(params.group) : ''}`, searchable: true, searchLabel: 'transaksi', headers: TX_HEAD, data: txRows(c.paid.filter(x => !params.group || x.group === params.group)), breakdown: card('Per grup dan sumber', table(['Grup', 'Sumber akuisisi', 'Order', 'Revenue', 'Pangsa'], SER.GROUPS.flatMap(g => [...new Set(c.paid.filter(x => x.group === g).map(x => x.source))].map(src => { const r = c.paid.filter(x => x.group === g && x.source === src); return [`<a href="${drillHref('channel', filtersOf(params), { group: g })}">${g}</a>`, src || 'Tidak diketahui', num(r.length), rp(r.reduce((s, x) => s + x.amount, 0)), pct(SER.div(r.reduce((s, x) => s + x.amount, 0), c.revenue))]; })))) };
    case 'cancel': { const rows = S.cancel.flatMap(x => x.rows).filter(x => !params.branch || x.outlet === params.branch); return { title: `Booking batal (${rows.length})`, searchable: true, searchLabel: 'booking', headers: ['Booking', 'Tanggal', 'Outlet', 'Alasan', 'Treatment'], data: rows.sort((a, b) => b.date.localeCompare(a.date)).map(x => ({ key: x.id, cells: [x.id, x.date, esc(outletName(x.outlet)), x.reasonLabel, x.treatment] })) }; }
    default: return { title: 'Transaksi POS dibayar', searchable: true, searchLabel: 'transaksi', headers: TX_HEAD, data: txRows(c.paid), breakdown: byOutlet('Per outlet', ['Outlet', 'Revenue', 'Order', 'Refund dikecualikan'], (id, s) => [esc(outletName(id)), jt(s.hasData ? s.revenue : null), num(s.orders), `${num(s.refunded.length)} · ${rp(s.refundAmount)}`]), foot: c.refunded.length ? `<details><summary>Lihat ${c.refunded.length} transaksi refund yang dikecualikan</summary>${table(TX_HEAD, c.refunded.map(txCells))}</details>` : '' };
  }
}

/* ---------- F1-04 Sales home ---------- */
function salesHome() {
  const S = SER.summary(state, '2026-08', 'all'), c = S.cur;
  const m = (k) => c.paid.filter(x => x.method === k);
  const sumA = r => r.reduce((s, x) => s + x.amount, 0);
  const t = HAWK.totals(state);
  const role = prefs.role;
  const tiles = [['Revenue B2C', jt(sumA(m('B2C'))), num(m('B2C').length) + ' order'], ['Revenue B2B (partner)', jt(sumA(m('B2B'))), num(m('B2B').length) + ' order'], ['Revenue Referral', jt(sumA(m('Referral'))), num(m('Referral').length) + ' order'], ['Lead sandbox terbuka', num(state.leads.filter(l => l.status !== 'booked').length), 'dari Inbox reservasi']];
  const items = PORTALS.Sales.items.filter(i => i[0] !== '-' && i[0] !== 'sales-home');
  return hero(`Beranda Sales · ${ROLES.find(r => r[0] === role)[1]}`, `${role === 'owner' ? 'Owner membuka Eagle Eye untuk target, kontribusi, dan bauran B2C/B2B/referral.' : role === 'reservation-staff' ? 'Mulai dari Inbox reservasi dan Booking Desk. My Workspace dibuat pada Fase 3.' : role === 'b2b-staff' ? 'Mulai dari Sales B2B untuk pipeline hotel/villa dan aktivasi partner.' : 'Sales Manager memantau pipeline, booking, dan performa tim.'}`, [role === 'owner' ? ['#owner', 'Buka Owner Eagle Eye'] : role === 'reservation-staff' ? ['#reservation', 'Buka Inbox reservasi'] : role === 'b2b-staff' ? ['#b2b', 'Buka Sales B2B'] : ['#sales', 'Buka Sales Manager'], ['#screens', 'Peta layar']]) + `
  <p class="active-filters"><b>Periode:</b> Agustus 2026 · Semua outlet · revenue dari transaksi POS dibayar (dataset yang sama dengan Commercial Executive Summary)</p>
  ${metrics(tiles)}
  ${card('Ruang Sales dan status pengerjaan', table(['Kode', 'Layar', 'Status', 'Buka'], items.map(([r, title, code, st]) => [code, title, `<span class="status-chip ${st}">${STATUS_LABEL[st]}${st !== 'ready' ? ' · lengkap Fase ' + (SCREENS.find(s => s[0] === code)?.[2] || '') : ''}</span>`, link(r, 'Buka ›')])) + `<p class="muted small">Revenue sandbox saat ini ${rp(t.revenue)} · komisi valid ${rp(t.commission)}. Nilai pipeline B2B tidak dihitung sebagai revenue.</p>`)}`;
}

/* ---------- F7-01 Screen map ---------- */
function screensMap() {
  const counts = { ready: 0, sandbox: 0, planned: 0 }; SCREENS.forEach(s => counts[s[4]]++);
  return metrics([['Layar dalam katalog', SCREENS.length], ['Tersedia (Fase 1)', counts.ready], ['Versi sandbox', counts.sandbox], ['Belum dibuat', counts.planned]]) +
    card('Peta Preview · 41 layar', table(['Kode', 'Layar', 'Fase', 'Status', 'Role', 'Link langsung'], SCREENS.map(([code, title, ph, route, st, role]) => [`<b>${code}</b>`, title, ph, `<span class="status-chip ${st}">${STATUS_LABEL[st]}</span>`, role || '—', route ? link(route, '#' + route.split('?')[0]) : '—']), 'roadmap')) +
    card('Reset dan skenario demo', `<ol><li>Tekan <b>Reset demo</b>: pagu Rp25.000.000, aktual Rp3.500.000, komitmen nol, sisa Rp21.500.000. Executive Summary Agustus 2026: revenue Rp2.820 jt, 3.195 pelanggan, 3.260 order.</li><li>Commercial Budget → ajukan Rp2.000.000 → Finance setujui → catat realisasi. Cek Budget Realization Giant Spa Ubud.</li><li>Sales B2C → booking LEAD-001 → POS check-in, selesai, bayar. Revenue Ubud Agustus naik Rp750.000 dan transaksi POS-BK-002 muncul paling atas di drill-down.</li></ol><div class="actions">${button('reset', 'Reset demo')}${link('bridge', 'Peta alur HAWK')}</div>`);
}

/* ---------- render ---------- */
function screen(id, params) {
  switch (id) {
    case 'bridge': case 'picker': return bridge();
    case 'screens': return screensMap();
    case 'commercial': return summaryScreen(params);
    case 'commercial-drill': return drillScreen(params);
    case 'sales-home': return salesHome();
    default: {
      const it = itemOf(id);
      if (it && it[3] === 'planned') return planned(it[2]);
      return sandboxScreen(id) ?? bridge();
    }
  }
}
function titleOf(id) {
  if (id === 'commercial') return 'Executive Performance Summary';
  if (id === 'commercial-drill') return 'Rincian Executive Summary';
  if (id === 'screens') return 'Peta Preview';
  if (id === 'bridge' || id === 'picker') return 'Alur lintas portal';
  return itemOf(id)?.[1] || 'Alur lintas portal';
}
const LETTER = { Finance: 'F', Operational: 'O', Commercial: 'C', Sales: 'S' };
const navOpen = new Set();
function renderNav(id, portal) {
  if (portal) navOpen.add(portal);
  const cur = (route) => route === id || (id === 'commercial-drill' && route === 'commercial');
  const navLink = ([route, name, code, st]) => route === '-' ? `<p class="nav-sub">${name}</p>` : `<a href="#${route}" ${cur(route) ? 'class="cur" aria-current="page"' : ''}><span class="nvc">${code || '—'}</span><span>${name}${st === 'planned' ? ` <small class="soon">Fase ${SCREENS.find(x => x[0] === code)?.[2] || ''}</small>` : ''}</span></a>`;
  nav.innerHTML = Object.entries(PORTALS).map(([name, p]) => {
    const open = navOpen.has(name);
    return `<div class="nav-mod${name === portal ? ' active' : ''}${open ? ' open' : ''}"><button type="button" data-mod="${name}" aria-expanded="${open}"><span class="mod-letter">${LETTER[name]}</span><span>${name}</span><span class="chev" aria-hidden="true">›</span></button><div class="nav-items">${p.items.filter(i => i[3] !== 'hidden').map(navLink).join('')}</div></div>`;
  }).join('') + `<div class="nav-mod open${portal ? '' : ' active'}"><button type="button" data-mod="Preview" aria-expanded="true"><span class="mod-letter">P</span><span>Preview</span><span class="chev" aria-hidden="true">›</span></button><div class="nav-items"><a href="#bridge" ${id === 'bridge' ? 'class="cur" aria-current="page"' : ''}><span class="nvc">—</span><span>Peta alur HAWK</span></a><a href="#screens" ${id === 'screens' ? 'class="cur" aria-current="page"' : ''}><span class="nvc">F7-01</span><span>Peta layar</span></a></div></div>`;
}
nav.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-mod]');
  if (!b) return;
  const mod = b.parentElement, open = !mod.classList.contains('open');
  mod.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
  if (open) navOpen.add(b.dataset.mod); else navOpen.delete(b.dataset.mod);
});
const initials = (label) => label.split(/\s+/).filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join('') || label.slice(0, 2).toUpperCase();
function renderRole() {
  const label = ROLES.find(r => r[0] === prefs.role)[1];
  $('#role-name').textContent = label; $('#role-av').textContent = initials(label);
}
const setNav = (open) => { $('#sidebar').classList.toggle('on', open); $('.scrim').classList.toggle('on', open); shell.classList.toggle('nav-open', open); $('#menu').setAttribute('aria-expanded', String(open)); };
let lastFocus = null;
function render(message = '', error = false) {
  const { id, params } = parseHash();
  const portal = portalOf(id);
  if (portal && portal !== prefs.portal) { prefs.portal = portal; savePrefs(); }
  renderNav(id, portal);
  document.querySelectorAll('[data-portal-label]').forEach(el => { el.textContent = portal || 'Demo integrasi'; });
  const it = itemOf(id);
  document.title = `HAWK ERP · ${titleOf(id)}`;
  view.innerHTML = `<nav class="crumbs" aria-label="Breadcrumb"><a href="#bridge">HAWK ERP</a><span>›</span><span>${portal || 'Demo integrasi'}</span>${it && it[2] ? `<span>›</span><span>${it[2]}</span>` : ''}</nav><header class="page-head">${it && it[2] ? `<span class="nv-tag">${it[2]}</span>` : ''}<div><h1 tabindex="-1">${titleOf(id)}</h1>${PURPOSE[id] ? `<p>${PURPOSE[id]}</p>` : ''}</div></header>${it ? phaseBanner(it[2], it[3]) : ''}<p class="status" role="${error ? 'alert' : 'status'}"></p>` + screen(id, params);
  view.querySelector('.status').textContent = message;
  if (error) view.querySelector('.status').classList.add('error');
  setNav(false); renderRole();
  if (id === 'picker' && !picker.open) openPicker();
}
function go(route, params = {}, replace = false) {
  const h = '#' + route + qs(params);
  if (replace) { history.replaceState(null, '', h); render(); } else location.hash = h;
}
function apply(action, input) {
  try {
    if (action === 'reset') { if (!confirm('Kembalikan semua data demo ke kondisi awal?')) return; state = HAWK.fresh(); }
    else HAWK.update(state, action, input);
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { render('Perubahan berlaku selama halaman ini terbuka. Penyimpanan browser tidak tersedia.'); return; }
    render(action === 'reset' ? 'Data demo dikembalikan ke kondisi awal.' : 'Perubahan demo tersimpan.');
  } catch (error) { render(error.message, true); }
}

/* ---------- F1-01 portal picker ---------- */
function openPicker(trigger) {
  lastFocus = trigger || document.activeElement;
  const active = portalOf(parseHash().id) || null;
  $('#options').innerHTML = Object.entries(PORTALS).map(([name, p]) => `<button type="button" class="option" data-portal="${name}" ${name === active ? 'aria-current="true"' : ''}><span class="label">${name}</span><small>${p.desc}</small><span class="state">${name === active ? 'Portal aktif' : ''}</span></button>`).join('');
  picker.showModal();
}
picker.addEventListener('close', () => { if (parseHash().id === 'picker') history.replaceState(null, '', '#bridge'); (lastFocus && document.contains(lastFocus) ? lastFocus : $('#portal')).focus(); });
picker.addEventListener('click', (e) => {
  if (e.target === picker) { picker.close(); return; }
  const opt = e.target.closest('.option[data-portal]');
  if (opt) { prefs.portal = opt.dataset.portal; savePrefs(); picker.close(); location.hash = HOME[opt.dataset.portal]; }
});
document.querySelectorAll('[data-open-picker]').forEach(b => b.addEventListener('click', () => openPicker(b)));
$('#menu').addEventListener('click', () => { const open = !shell.classList.contains('nav-open'); setNav(open); if (open) (nav.querySelector('a.cur') || nav.querySelector('button'))?.focus(); });
document.querySelector('[data-close-nav]').addEventListener('click', () => setNav(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && shell.classList.contains('nav-open')) { setNav(false); $('#menu').focus(); } });
document.querySelector('[data-global-reset]').addEventListener('click', () => apply('reset'));
const roleSel = $('#role');
roleSel.innerHTML = ROLES.map(([k, l]) => `<option value="${k}" ${k === prefs.role ? 'selected' : ''}>${l}</option>`).join('');
roleSel.addEventListener('change', () => { prefs.role = roleSel.value; savePrefs(); render(`Role demo: ${ROLES.find(r => r[0] === prefs.role)[1]}`); });

view.addEventListener('change', (e) => {
  const form = e.target.closest('#filters');
  if (!form) return;
  const { id } = parseHash();
  const data = Object.fromEntries(new FormData(form));
  go(id, { ...data, state: data.state === 'normal' ? '' : data.state }, id === 'commercial');
  requestAnimationFrame(() => $(`#filters [name="${e.target.name}"]`)?.focus());
});
view.addEventListener('submit', (e) => {
  const form = e.target;
  if (form.dataset.search) { e.preventDefault(); const { id, params } = parseHash(); go(id, { ...params, q: new FormData(form).get('q'), page: '' }); return; }
  if (!form.dataset.submit) return;
  e.preventDefault();
  apply(form.dataset.submit, Object.fromEntries(new FormData(form)));
});
view.addEventListener('click', (e) => {
  const control = e.target.closest('[data-action]');
  if (!control) return;
  const { id, params } = parseHash();
  if (control.dataset.action === 'filter-reset') { go(id, id === 'commercial-drill' ? { metric: params.metric } : {}); return; }
  if (control.dataset.action === 'retry') { go('commercial', { period: params.period, outlet: params.outlet }); return; }
  apply(control.dataset.action, { id: control.dataset.id });
});
window.addEventListener('hashchange', () => { render(); view.querySelector('h1').focus(); });
window.addEventListener('storage', (e) => { if (e.key === KEY) { try { state = JSON.parse(e.newValue) || HAWK.fresh(); } catch (er) { state = HAWK.fresh(); } render(); } });
if (!location.hash && document.body.dataset.portal) history.replaceState(null, '', '#' + HOME[document.body.dataset.portal]);
render();
})();
