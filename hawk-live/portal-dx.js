/* HAWK ERP · Demo Experience Center untuk portal Operational, Commercial dan Sales — DATA DEMO / SIMULASI.
   Memakai template hawk-live/dx-lab.js (model Demo Center Finance, sama dengan HRD #hrd-dx): Test Lab dengan login role tim
   portal itu saja, Desktop / iPad / Mobile, Smart Tutor dan Simulator. Satu portal = satu lab, fokus pada timnya sendiri
   (Aji 14 Nov 2026). Langkah divisi lain hanya muncul bila memang bagian alur dan berjalan otomatis sebagai konteks.
   Model: HAWK.update (booking, lead, MRF, partner, pipeline) dan CX.update (campaign, konten, brand). Tidak ada API live. */
(() => {
'use strict';
const H = window.HL;
if (!H || !H.DXLAB) return;
const { esc, card } = H;
const hrName = (emp, fb) => { try { return (window.HR && HR.ensure(H.state).people.find(p => p.id === emp)?.name) || fb; } catch (e) { return fb; } };
const view = (msg = 'dilihat') => () => msg;
/* booking butuh slot HAWK kosong (3 slot demo: 11.00, 13.00, 15.00) */
const freeSlot = (s) => { const f = s.slots.find(sl => !s.bookings.some(b => b.slot === sl && b.status !== 'cancelled')); if (!f) throw Error('Semua slot demo sudah terisi. Tekan Mulai ulang untuk mengembalikan data demo.'); return f; };
const lastId = (rows) => rows[rows.length - 1].id;

/* persona lintas divisi (hanya untuk langkah konteks yang memang bagian alur) */
const CTX = {
  dewa: { id: 'dewa', name: 'Dewa', role: 'reservation-staff', title: 'Staf Reservasi B2C', home: 'reservation', does: 'Menerima lead dan membuat booking (Sales).' },
  mila: { id: 'mila', emp: 'EMP-0153', name: 'Mila', role: 'outlet-spv', title: 'Supervisor Spa Ubud', home: 'pos', does: 'Check-in, treatment dan pembayaran di outlet (Operational).' },
  asri: { id: 'asri', name: 'Asri', role: 'finance-manager', title: 'Finance Manager', home: 'mrf', does: 'Menyetujui MRF, memposting realisasi dan membayar komisi (Finance).' },
  driver: { id: 'driver', name: 'Driver Demo', role: 'public', title: 'Partner referral DRV-001', home: 'driver', does: 'Partner luar: menyetujui perjanjian dan mengirim tamu.' }
};

function personaTab(lab, scope) {
  const cur = H.prefs.persona;
  return () => card('Persona demo', `<section class="grid g4 keep2">${lab.personas.map(p => `<article class="card dx-persona${cur === p.id ? ' on' : ''}"><div class="lbl">${esc(p.title)}${lab.team.includes(p.id) ? '' : ' · konteks alur'}</div><h3>${esc(lab.nameOf ? lab.nameOf(p) : p.name)}</h3><p class="muted small">${esc(p.does)}</p></article>`).join('')}</section><p class="muted small">Login role di Test Lab hanya untuk tim ${esc(scope)}. Persona divisi lain menjalankan langkahnya otomatis bila memang bagian alur ${esc(scope)}. Demo Center divisi lain ada di portalnya masing-masing.</p>`);
}

function register(cfg) {
  const lab = { ...cfg };
  const nm = (p) => (cfg.nameOf ? cfg.nameOf(p) : p.name) || p.id;
  /* aksi CX dicatat atas nama anggota tim (MBR-…) agar histori campaign/konten menampilkan nama yang benar */
  const memberOf = (by) => { const p = cfg.personas.find(x => by === `${nm(x)} (${x.title})`); return (p && p.member) || by; };
  H.DXLAB.define({
    ...cfg,
    extra: { label: 'Persona tim', html: personaTab(cfg, cfg.portal) },
    update: (state, a, input) => a.startsWith('cx:') ? CX.update(state, a.slice(3), { ...input, by: memberOf(input.by) }) : HAWK.update(state, a, input)
  });
  if (H.DXLAB.EMBED && H.prefs.portal === cfg.portal) { const p = cfg.personas.find(x => x.id === H.prefs.persona); if (p && p.member) H.prefs.member = p.member; }
  /* sidebar portal merender item berkode DX-… sebagai kartu besar Demo Experience Center paling atas (seperti app HAWK 60 NV) */
  const items = H.PORTALS[cfg.portal].items;
  if (!items.some(i => i[0] === cfg.route)) items.push([cfg.route, 'Demo Experience Center', cfg.code, 'ready']);
  H.PURPOSE[cfg.route] = cfg.purpose;
  H.SCREENS.push([cfg.code, `${cfg.portal} · Demo Experience Center`, `${cfg.portal} DX`, cfg.route, 'ready', 'Tim ' + cfg.portal]);
  return lab;
}

/* ================= Operational ================= */
const OPS = [
  { id: 'eni', emp: 'EMP-0151', name: 'Eni Restini', role: 'ops-manager', title: 'Operational Manager', home: 'pos', does: 'Memantau layanan 4 outlet, menyetujui refund dan pengecualian.' },
  { id: 'mila', emp: 'EMP-0153', name: 'Mila', role: 'outlet-spv', title: 'Supervisor Spa Ubud', home: 'pos', does: 'Memimpin outlet: check-in tamu, pembatalan dan pembayaran di POS.' },
  { id: 'ari', emp: 'EMP-0001', name: 'Putu Ari', role: 'therapist', title: 'Therapist Spa Ubud', home: 'pos', does: 'Menjalankan treatment dan menandai treatment selesai.' },
  CTX.dewa
];
register({
  portal: 'Operational', route: 'ops-dx', mobile: ['therapist', 'reception', 'supervisor'], page: 'operational.html', code: 'DX-OPS', after: 'pos', publicRole: 'ops-manager',
  title: 'Demo Experience Center Operational', eyebrow: 'HAWK × JAENS · DX-OPS · GUIDED DEMO',
  intro: 'Belajar alur kerja outlet dengan menekan tombol asli aplikasi HAWK. Login sebagai Operational Manager, Supervisor atau Therapist, pilih Desktop, iPad atau Mobile. Satu data sandbox bersama, tidak terhubung ke HAWK produksi.',
  purpose: 'Persona tim Operational menjalankan alur outlet (check-in, treatment, pembayaran, pembatalan, refund); booking dari Sales hanya muncul sebagai konteks otomatis.',
  personas: OPS, team: ['eni', 'mila', 'ari'], nameOf: (p) => p.emp ? hrName(p.emp, p.name) : p.name,
  sim: [{ who: 'eni', device: 'desktop' }, { who: 'mila', device: 'ipad' }, { who: 'ari', device: 'mobile' }],
  scenarios: [
    { id: 'day', name: 'Tamu datang → treatment → bayar', why: 'Booking dari Sales masuk ke outlet. Supervisor check-in, therapist menyelesaikan treatment, pembayaran tercatat di POS dan revenue masuk Executive Summary.', steps: [
      { who: 'dewa', title: 'Booking Wellness Massage masuk dari Sales', route: () => 'reservation', run: (U, c, s) => { U('book', { slot: freeSlot(s) }); c.bk = lastId(s.bookings); return c.bk; } },
      { who: 'mila', title: 'Check-in tamu di POS', route: () => 'pos', run: (U, c) => { U('checkin', { id: c.bk }); return c.bk + ' · checked-in'; } },
      { who: 'ari', title: 'Treatment selesai', route: () => 'pos', run: (U, c) => { U('complete', { id: c.bk }); return c.bk + ' · completed'; } },
      { who: 'mila', title: 'Catat pembayaran di POS', route: () => 'pos', run: (U, c) => { U('pay', { id: c.bk }); return c.bk + ' · paid'; } },
      { who: 'eni', title: 'Pantau transaksi outlet hari ini', route: () => 'pos', run: view() }
    ] },
    { id: 'refund', name: 'Pembatalan & refund', why: 'Tamu membatalkan sebelum datang (slot kembali tersedia). Tamu lain mengeluh setelah bayar: Operational Manager menyetujui refund.', steps: [
      { who: 'dewa', title: 'Booking masuk dari Sales', route: () => 'reservation', run: (U, c, s) => { U('book', { slot: freeSlot(s) }); c.bk1 = lastId(s.bookings); return c.bk1; } },
      { who: 'mila', title: 'Batalkan booking (tamu tidak jadi datang)', route: () => 'pos', run: (U, c) => { U('cancel', { id: c.bk1 }); return c.bk1 + ' · cancelled, slot kembali'; } },
      { who: 'dewa', title: 'Booking tamu berikutnya masuk dari Sales', route: () => 'reservation', run: (U, c, s) => { U('book', { slot: freeSlot(s) }); c.bk2 = lastId(s.bookings); return c.bk2; } },
      { who: 'mila', title: 'Check-in tamu', route: () => 'pos', run: (U, c) => { U('checkin', { id: c.bk2 }); return c.bk2; } },
      { who: 'ari', title: 'Treatment selesai', route: () => 'pos', run: (U, c) => { U('complete', { id: c.bk2 }); return c.bk2; } },
      { who: 'mila', title: 'Catat pembayaran', route: () => 'pos', run: (U, c) => { U('pay', { id: c.bk2 }); return c.bk2 + ' · paid'; } },
      { who: 'eni', title: 'Setujui refund keluhan tamu', route: () => 'pos', run: (U, c) => { U('refund', { id: c.bk2 }); return c.bk2 + ' · refunded'; } }
    ] }
  ]
});

/* ================= Commercial ================= */
const COM = [
  { id: 'cm', name: 'Commercial Manager', role: 'commercial-manager', title: 'Approval campaign & budget', home: 'commercial', does: 'Menyetujui campaign, membaca revenue, budget marketing dan ROMI.' },
  { id: 'rani', name: 'Rani', member: 'MBR-C01', role: 'commercial-manager', title: 'Content Lead · reviewer', home: 'studio?view=board', does: 'Mereview dan menyetujui konten, menjaga brand tone.' },
  { id: 'bayu', name: 'Bayu', member: 'MBR-C02', role: 'commercial-manager', title: 'Digital Marketing', home: 'campaign', does: 'Membuat campaign, mengajukan biaya, merencanakan konten, membaca atribusi.' },
  { id: 'wulan', name: 'Wulan', member: 'MBR-C05', role: 'commercial-manager', title: 'Social Media Admin', home: 'social', does: 'Menjadwalkan dan menerbitkan konten, distribusi komunikasi.' },
  CTX.asri, CTX.dewa, CTX.mila
];
register({
  portal: 'Commercial', route: 'commercial-dx', mobile: ['office'], page: 'commercial.html', code: 'DX-COM', after: 'commercial', publicRole: 'commercial-manager',
  title: 'Demo Experience Center Commercial', eyebrow: 'HAWK × JAENS · DX-COM · GUIDED DEMO',
  intro: 'Belajar alur kerja Brand, Marketing & Communications dengan menekan tombol asli aplikasi HAWK. Login sebagai Commercial Manager, Rani, Bayu atau Wulan, pilih Desktop, iPad atau Mobile. Satu data sandbox bersama, tidak terhubung ke HAWK produksi.',
  purpose: 'Persona tim Commercial menjalankan campaign, konten dan brand; Finance (MRF) dan Sales/Operational (lead → booking) hanya muncul sebagai konteks otomatis.',
  personas: COM, team: ['cm', 'rani', 'bayu', 'wulan'],
  sim: [{ who: 'cm', device: 'desktop' }, { who: 'bayu', device: 'desktop' }, { who: 'rani', device: 'ipad' }, { who: 'wulan', device: 'mobile' }],
  scenarios: [
    { id: 'campaign', name: 'Campaign baru Shanti → Running', why: 'Bayu membuat campaign dari template, Commercial Manager menyetujui, biaya diajukan lewat MRF (Finance menyetujui otomatis), lalu campaign dijadwalkan dan berjalan.', steps: [
      { who: 'bayu', title: 'Buat draft campaign dari template', route: () => 'campaign?view=templates', run: (U, c) => { c.cmp = U('cx:cmp-create', { template: 'TPL-01', name: 'Shanti Morning Ritual', outlet: 'OUT-SHT', utm: 'cmp_dx_shanti_' + (Date.now() % 100000), budget: '10000000', bookings: '30', pic: 'MBR-C02', start: '2026-09-01', end: '2026-09-30' }); return c.cmp; } },
      { who: 'cm', title: 'Setujui campaign', route: (c) => `campaign-detail?id=${c.cmp}`, run: (U, c) => U('cx:cmp-approve', { id: c.cmp }) },
      { who: 'bayu', title: 'Ajukan biaya iklan Rp2.000.000 (MRF)', route: () => 'commercial-budget?view=requests', run: (U, c, s) => { U('request', { amount: '2000000', campaign: c.cmp, pos: 'Promotion', note: 'Meta Ads Shanti Morning Ritual' }); c.mrf = lastId(s.requests); return c.mrf; } },
      { who: 'asri', title: 'Finance menyetujui dan memposting MRF', route: () => 'commercial-budget?view=requests', run: (U, c) => { U('approve', { id: c.mrf }); U('post', { id: c.mrf }); return c.mrf + ' · posted'; } },
      { who: 'bayu', title: 'Jadwalkan campaign', route: (c) => `campaign-detail?id=${c.cmp}`, run: (U, c) => U('cx:cmp-schedule', { id: c.cmp }) },
      { who: 'bayu', title: 'Jalankan campaign', route: (c) => `campaign-detail?id=${c.cmp}`, run: (U, c) => U('cx:cmp-run', { id: c.cmp }) },
      { who: 'cm', title: 'Cek realisasi Commercial Budget', route: () => 'commercial-budget', run: view() }
    ] },
    { id: 'content', name: 'Konten Reels → review → terbit', why: 'Konten direncanakan dari campaign, aset diajukan review, Rani menyetujui, Wulan menjadwalkan dan menerbitkan, lalu hasilnya dianalisis.', steps: [
      { who: 'bayu', title: 'Buat konten dari brief CMP-002', route: () => 'campaign-detail?id=CMP-002', run: (U, c) => { c.cnt = U('cx:cnt-create', { title: 'Reels Morning Ritual Shanti', campaign: 'CMP-002', pillar: 'Wellness ritual', format: 'Reels', channel: 'Instagram', pic: 'MBR-C02', due: '2026-08-30' }); return c.cnt; } },
      { who: 'bayu', title: 'Rencanakan & tetapkan creator/editor', route: (c) => `studio?view=board&content=${c.cnt}`, run: (U, c) => { U('cx:cnt-stage', { id: c.cnt, to: 'Planned' }); U('cx:cnt-assign', { id: c.cnt, role: 'creator', pic: 'MBR-C03' }); U('cx:cnt-assign', { id: c.cnt, role: 'editor', pic: 'MBR-C04' }); return 'Planned · creator Dita · editor Arya'; } },
      { who: 'bayu', title: 'Produksi: unggah aset v1', route: (c) => `studio?view=board&content=${c.cnt}&ctab=assets`, run: (U, c) => { U('cx:cnt-stage', { id: c.cnt, to: 'Production' }); U('cx:cnt-asset', { id: c.cnt }); return 'Production · aset v1'; } },
      { who: 'bayu', title: 'Ajukan review', route: (c) => `studio?view=board&content=${c.cnt}&ctab=review`, run: (U, c) => U('cx:cnt-submit', { id: c.cnt }) },
      { who: 'rani', title: 'Review & approve konten', route: (c) => `studio?view=board&content=${c.cnt}&ctab=review`, run: (U, c) => U('cx:cnt-approve', { id: c.cnt, note: 'Sesuai brand tone' }) },
      { who: 'wulan', title: 'Jadwalkan Instagram 30 Agu 18.00', route: (c) => `studio?view=board&content=${c.cnt}&ctab=publish`, run: (U, c) => { c.pub = U('cx:cnt-schedule', { id: c.cnt, platform: 'Instagram', at: '2026-08-30 18:00', account: '@jaensspa.shanti' }); return c.pub; } },
      { who: 'wulan', title: 'Terbitkan di Instagram', route: (c) => `studio?view=board&content=${c.cnt}&ctab=publish`, run: (U, c) => U('cx:pub-publish', { id: c.pub }) },
      { who: 'bayu', title: 'Catat analisis hasil', route: (c) => `studio?view=board&content=${c.cnt}&ctab=analytics`, run: (U, c) => U('cx:cnt-analyse', { id: c.cnt }) }
    ] },
    { id: 'brand', name: 'Brand & komunikasi', why: 'Rani menyetujui tone of voice Jaens Spa dan pesan Essence, Commercial Manager menyetujui banner Bisma, Wulan menandai terdistribusi.', steps: [
      { who: 'cm', title: 'Buka progres brand per unit', route: () => 'brand', run: view() },
      { who: 'rani', title: 'Setujui Tone of voice Jaens Spa', route: () => 'brand?view=foundation', run: (U) => U('cx:brand-approve', { id: 'BR-SPA', el: 'tone' }) },
      { who: 'rani', title: 'Setujui pesan “Bahan alami” (Essence)', route: () => 'brand?view=messages', run: (U) => U('cx:msg-version', { id: 'MSG-003' }) },
      { who: 'cm', title: 'Setujui standing banner Bisma', route: () => 'brand?view=calendar', run: (U) => U('cx:com-advance', { id: 'COM-004' }) },
      { who: 'wulan', title: 'Tandai banner terdistribusi', route: () => 'brand?view=calendar', run: (U) => U('cx:com-advance', { id: 'COM-004' }) }
    ] },
    { id: 'lead', name: 'Campaign → lead → booking → atribusi', why: 'Konten Instagram menghasilkan lead WhatsApp. Sales membuat booking dan outlet menyelesaikan pembayaran (otomatis), lalu Commercial membaca atribusi dan Executive Summary.', steps: [
      { who: 'wulan', title: 'Pantau Instagram → WhatsApp', route: () => 'social', run: view() },
      { who: 'dewa', title: 'Sales: lead WhatsApp → booking', route: () => 'reservation', run: (U, c, s) => { U('lead', { channel: 'WhatsApp' }); c.lead = lastId(s.leads); U('book', { id: c.lead, slot: freeSlot(s) }); c.bk = lastId(s.bookings); return `${c.lead} → ${c.bk}`; } },
      { who: 'mila', title: 'Outlet: check-in, treatment, bayar', route: () => 'pos', run: (U, c) => { U('checkin', { id: c.bk }); U('complete', { id: c.bk }); U('pay', { id: c.bk }); return c.bk + ' · paid'; } },
      { who: 'bayu', title: 'Baca jejak atribusi booking', route: () => 'attribution', run: view() },
      { who: 'cm', title: 'Cek Executive Summary', route: () => 'commercial', run: view() }
    ] }
  ]
});

/* ================= Sales ================= */
const SAL = [
  { id: 'sm', name: 'Sales Manager', role: 'sales-manager', title: 'Pipeline & tim Sales', home: 'sales', does: 'Memantau booking, revenue per metode jual dan pipeline B2B; menyetujui negosiasi.' },
  { id: 'dewa', name: 'Dewa', role: 'reservation-staff', title: 'Staf Reservasi B2C', home: 'reservation', does: 'Inbox lead, alih ke staf, Booking Desk dan pembatalan.' },
  { id: 'b2b', name: 'Sales B2B', role: 'b2b-staff', title: 'Partner hotel/villa & driver', home: 'b2b', does: 'Pipeline hotel/villa dan aktivasi partner referral.' },
  CTX.mila, CTX.asri, CTX.driver
];
register({
  portal: 'Sales', route: 'sales-dx', mobile: ['reception'], page: 'sales.html', code: 'DX-SLS', after: 'sales-home', publicRole: 'b2b-staff',
  title: 'Demo Experience Center Sales', eyebrow: 'HAWK × JAENS · DX-SLS · GUIDED DEMO',
  intro: 'Belajar alur kerja Sales, reservasi dan kemitraan dengan menekan tombol asli aplikasi HAWK. Login sebagai Sales Manager, Dewa (Reservasi B2C) atau Sales B2B, pilih Desktop, iPad atau Mobile. Satu data sandbox bersama, tidak terhubung ke HAWK produksi.',
  purpose: 'Persona tim Sales menjalankan lead, booking, pipeline B2B dan partner referral; outlet (POS) dan Finance (komisi) hanya muncul sebagai konteks otomatis.',
  personas: SAL, team: ['sm', 'dewa', 'b2b'],
  sim: [{ who: 'sm', device: 'desktop' }, { who: 'dewa', device: 'mobile' }, { who: 'b2b', device: 'ipad' }],
  scenarios: [
    { id: 'b2c', name: 'Lead WhatsApp → booking dibayar', why: 'Lead dari Instagram masuk lewat WhatsApp, Dewa membuat booking, outlet menyelesaikan pembayaran (otomatis), Sales Manager membaca hasilnya.', steps: [
      { who: 'dewa', title: 'Tambah lead WhatsApp di Inbox reservasi', route: () => 'reservation', run: (U, c, s) => { U('lead', { channel: 'WhatsApp' }); c.lead = lastId(s.leads); return c.lead; } },
      { who: 'dewa', title: 'Konfirmasi booking di Booking Desk', route: () => 'reservation', run: (U, c, s) => { U('book', { id: c.lead, slot: freeSlot(s) }); c.bk = lastId(s.bookings); return c.bk; } },
      { who: 'mila', title: 'Outlet: check-in, treatment, bayar', route: () => 'pos', run: (U, c) => { U('checkin', { id: c.bk }); U('complete', { id: c.bk }); U('pay', { id: c.bk }); return c.bk + ' · paid'; } },
      { who: 'sm', title: 'Cek revenue & jejak hasil Sales', route: () => 'sales', run: view() }
    ] },
    { id: 'handoff', name: 'Lead telepon → staf → batal', why: 'Lead telepon dialihkan ke staf, dibooking, lalu tamu membatalkan: slot kembali tersedia dan lead kembali ke staf untuk ditindaklanjuti.', steps: [
      { who: 'dewa', title: 'Tambah lead Telepon', route: () => 'reservation', run: (U, c, s) => { U('lead', { channel: 'Telepon' }); c.lead = lastId(s.leads); return c.lead; } },
      { who: 'dewa', title: 'Alihkan lead ke staf', route: () => 'reservation', run: (U, c) => { U('handoff', { id: c.lead }); return c.lead + ' · staff'; } },
      { who: 'dewa', title: 'Booking untuk lead', route: () => 'reservation', run: (U, c, s) => { U('book', { id: c.lead, slot: freeSlot(s) }); c.bk = lastId(s.bookings); return c.bk; } },
      { who: 'dewa', title: 'Tamu membatalkan: batalkan booking', route: () => 'pos', run: (U, c) => { U('cancel', { id: c.bk }); return c.bk + ' · cancelled, lead kembali ke staf'; } },
      { who: 'sm', title: 'Pantau lead terbuka', route: () => 'sales', run: view() }
    ] },
    { id: 'b2b', name: 'Pipeline hotel B2B → booking pertama', why: 'Sales B2B membawa Ubud Hotel Demo dari prospek sampai booking pertama; Sales Manager menyetujui tahap negosiasi.', steps: [
      { who: 'b2b', title: 'Kualifikasi Ubud Hotel Demo', route: () => 'b2b', run: (U, c, s) => { U('pipeline'); return s.b2b.stage; } },
      { who: 'b2b', title: 'Kirim proposal kemitraan', route: () => 'b2b', run: (U, c, s) => { U('pipeline'); return s.b2b.stage; } },
      { who: 'sm', title: 'Setujui masuk negosiasi', route: () => 'b2b', run: (U, c, s) => { U('pipeline'); return s.b2b.stage; } },
      { who: 'b2b', title: 'Kontrak menang', route: () => 'b2b', run: (U, c, s) => { U('pipeline'); return s.b2b.stage; } },
      { who: 'b2b', title: 'Aktifkan partner', route: () => 'b2b', run: (U, c, s) => { U('pipeline'); return s.b2b.stage; } },
      { who: 'b2b', title: 'Catat booking pertama', route: () => 'b2b', run: (U, c, s) => { U('pipeline'); return s.b2b.stage; } },
      { who: 'sm', title: 'Baca pipeline di Sales Manager', route: () => 'sales', run: view() }
    ] },
    { id: 'driver', name: 'Driver referral → komisi', why: 'Partner driver menyetujui perjanjian, Sales B2B mengaktifkan, driver mengirim tamu; outlet dan Finance menyelesaikan transaksi dan komisi (otomatis).', steps: [
      { who: 'driver', title: 'Driver menyetujui perjanjian demo', route: () => 'driver', run: (U) => { U('agreement'); return 'perjanjian disetujui'; } },
      { who: 'b2b', title: 'Aktifkan partner DRV-001', route: () => 'driver', run: (U) => { U('activate'); return 'DRV-001 aktif'; } },
      { who: 'driver', title: 'Driver mengirim tamu (booking referral)', route: () => 'driver', run: (U, c, s) => { U('book', { referral: 'yes', slot: freeSlot(s) }); c.bk = lastId(s.bookings); return c.bk; } },
      { who: 'mila', title: 'Outlet: check-in, treatment, bayar', route: () => 'pos', run: (U, c) => { U('checkin', { id: c.bk }); U('complete', { id: c.bk }); U('pay', { id: c.bk }); return c.bk + ' · paid'; } },
      { who: 'asri', title: 'Finance mencatat pembayaran komisi', route: () => 'commission', run: (U, c) => { U('payout', { id: c.bk }); return c.bk + ' · komisi dibayar'; } },
      { who: 'sm', title: 'Cek komisi valid & booking referral', route: () => 'sales', run: view() }
    ] }
  ]
});
})();
