/* HAWK ERP · Portal HRD · Demo Experience Center HRD (#hrd-dx) — DATA DEMO / SIMULASI.
   Memakai template hawk-live/dx-lab.js (model Demo Center Finance): Test Lab dengan login role tim HRD (Made Gunarsa, Harja, Ayu,
   Lead Human Growth), Desktop/iPad/Mobile, Smart Tutor, dan Simulator 4 layar. Langkah divisi lain (Operational, Supervisor,
   Finance, Owner, kandidat) hanya muncul bila memang bagian alur HRD dan berjalan otomatis sebagai konteks. */
(() => {
const H = window.HL;
const { esc, table, card, link } = H;
const hr = () => { const h = HR.ensure(H.state); HR.EXT.ensure?.(h); return h; };
const chip = (t, tone = '') => `<span class="status-chip ${tone}">${esc(t)}</span>`;
const empName = (id) => id ? (hr().people.find(p => p.id === id)?.name || id) : '—';

/* ---------- persona ---------- */
const PERSONAS = [
  { id: 'made', emp: 'EMP-0142', role: 'hrd', title: 'Manager HRD', home: 'hrd-home', does: 'Menyetujui permintaan tenaga, keputusan & penawaran, penempatan, payroll, Race dan STRACON.' },
  { id: 'harja', emp: 'EMP-0145', role: 'hrd-ops', title: 'Koordinator Rekrutmen', home: 'hrd-rec-candidates', does: 'Publikasi lowongan, screening, shortlist dan jadwal interview.' },
  { id: 'ayu', emp: 'EMP-0143', role: 'hrd-ops', title: 'Admin HRD', home: 'hrd-roster', does: 'Direktori, presensi, verifikasi dokumen, kontrak dan onboarding.' },
  { id: 'hg', emp: 'EMP-0144', role: 'hg-lead', title: 'Lead Human Growth', home: 'hrd-training', does: 'Pelatihan, 9-Box, rencana pengembangan dan coaching.' },
  { id: 'asri', emp: 'EMP-0121', role: 'finance-manager', title: 'Finance Manager', home: 'hrd-pay-handoff?period=2610', does: 'Menerima jurnal payroll agregat dan memantau biaya tenaga kerja.' },
  { id: 'eni', emp: 'EMP-0151', role: 'ops-manager', title: 'Operational Manager', home: 'hrd-manpower', does: 'Memantau kapasitas 4 outlet, menyetujui kebutuhan tenaga dari Supervisor.' },
  { id: 'mila', emp: 'EMP-0153', role: 'outlet-spv', title: 'Supervisor Spa Ubud', home: 'hrd-mp-utility?outlet=OUT-UBD', does: 'Mengajukan kebutuhan therapist/receptionist, menilai praktik, verifikasi pelatihan.' },
  { id: 'ari', emp: 'EMP-0001', role: 'therapist', title: 'Therapist Spa Ubud (ESS)', home: 'hrd-myday', does: 'Melihat tugas, jadwal dan XScore miliknya sendiri.' },
  { id: 'owner', emp: null, name: 'Owner', role: 'owner', title: 'Owner', home: 'hrd-race', does: 'Melihat agregat, Race Vegen dan e-Deck tanpa nominal personal.' },
  { id: 'cand', emp: null, name: 'Kandidat (publik)', role: 'public', title: 'Pelamar via halaman karier', home: null, does: 'Melamar dan merespons penawaran lewat karier publik.' }
];
const P = (id) => PERSONAS.find(p => p.id === id);
const pName = (p) => p.name || empName(p.emp);
const actorOf = (p) => `${pName(p)} (${p.title})`;
const curPersona = () => { const p = P(H.prefs.persona); return p && p.role === H.prefs.role ? p : null; };
const prevActor = H.HOOKS.actor;
H.HOOKS.actor = () => { const p = curPersona(); return p ? actorOf(p) : (prevActor ? prevActor() : 'Demo'); };

/* ---------- skenario ---------- */
const CAND = (n) => ({ name: `Ni Komang Demo ${n}`, email: `demo${n}@example.invalid`, phone: '0812-0' + n, consent: '1', docs: 'cv.pdf', techniques: 'Balinese, hot stone', years: '3', cert: 'LSP 2023', sessions: '6', lang: 'Inggris', shiftReady: 'Pagi', situational: 'tanya kenyamanan tamu', submitKey: `DX-${n}` });
const view = (msg = 'dilihat') => () => msg;
const SC = [
  { id: 'rekrut', name: 'Kebutuhan → penempatan therapist Spa Ubud', why: 'Utility Ubud di atas 100%: Supervisor mengajukan kebutuhan, OM & HRD menyetujui, rekrutmen berjalan sampai penempatan dan coaching.', steps: [
    { who: 'eni', title: 'Lihat utility Spa Ubud di atas kapasitas', route: () => 'hrd-mp-utility?outlet=OUT-UBD', run: view() },
    { who: 'mila', title: 'Ajukan kebutuhan 2 therapist Spa Ubud', route: (c) => 'hrd-recruit', run: (U, c) => { c.req = U('req-create', { position: 'POS-THR', outlet: 'OUT-UBD', count: '2', shift: 'Pagi/Sore', skills: 'Balinese, hot stone' }); return c.req; } },
    { who: 'eni', title: 'Setujui permintaan sebagai Operational Manager', route: () => 'hrd-recruit', run: (U, c) => U('req-approve', { id: c.req }) },
    { who: 'made', title: 'Setujui permintaan sebagai Manager HRD', route: () => 'hrd-recruit', run: (U, c) => U('req-approve', { id: c.req }) },
    { who: 'harja', title: 'Publikasikan lowongan dari formasi disetujui', route: (c) => 'hrd-rec-jobs', run: (U, c) => { c.vac = U('vac-publish', { req: c.req }); return c.vac; } },
    { who: 'cand', title: 'Kandidat melamar lewat halaman karier', route: (c) => c.vac ? `hrd-career-job?id=${c.vac}` : 'hrd-rec-jobs', run: (U, c) => { c.n = c.n || (Date.now() % 100000); c.app = U('app-submit', { vac: c.vac, ...CAND(c.n) }); return c.app; } },
    { who: 'harja', title: 'Screening, shortlist & jadwalkan interview praktik', route: (c) => `hrd-rec-candidates?id=${c.app}`, run: (U, c) => { U('screen-run', { id: c.app }); U('app-stage', { id: c.app, to: 'Shortlist' }); return U('iv-schedule', { id: c.app, slot: '2026-11-14 10:00', iv2: 'EMP-0153' }); } },
    { who: 'mila', title: 'Nilai praktik kandidat (rubric)', route: (c) => `hrd-rec-interview?id=${c.app}`, run: (U, c) => U('iv-score', { id: c.app, s0: 4, s1: 4, s2: 5, s3: 4, note: 'Praktik hot stone rapi' }) },
    { who: 'made', title: 'Putuskan Diterima & kirim penawaran (mulai 16 Nov)', route: (c) => `hrd-rec-offer?id=${c.app}`, run: (U, c) => { U('rec-decide', { id: c.app, value: 'Diterima', reason: 'Rubric praktik baik' }); return U('offer-send', { id: c.app, start: '2026-11-16' }); } },
    { who: 'cand', title: 'Kandidat menerima penawaran', route: (c) => `hrd-rec-offer?id=${c.app}`, run: (U, c) => U('offer-respond', { id: c.app, answer: 'accept' }) },
    { who: 'ayu', title: 'Verifikasi dokumen, tanda tangan kontrak & onboarding', route: (c) => `hrd-rec-onboard`, run: (U, c) => { U('doc-verify', { id: c.app, kind: 'KTP' }); U('doc-verify', { id: c.app, kind: 'Foto' }); c.emp = U('contract-sign', { id: c.app }); c.onb = U('onboard-create', { id: c.app }); return `${c.emp} · ${c.onb}`; } },
    { who: 'made', title: 'Setujui penempatan Spa Ubud & akun ESS', route: () => 'hrd-rec-place', run: (U, c) => U('place-approve', { id: c.app, accRole: 'ess' }) },
    { who: 'hg', title: 'Buat coaching 30 hari untuk therapist baru', route: (c) => c.coach ? `hrd-task?id=${c.coach}` : 'hrd-tasks', run: (U, c) => { c.coach = U('weekly-action', { ws: 'HG', title: `Coaching 30 hari ${empName(c.emp)}`, pic: 'EMP-0144', due: '2026-12-16', sourceId: `ONB-${c.emp}` }); return c.coach; } }
  ] },
  { id: 'reception', name: 'Receptionist Spa Bisma shift Sore', why: 'Celah antrean check-in sore di Bisma: OM mengajukan 1 receptionist, HRD menyetujui dan lowongan dibuka.', steps: [
    { who: 'eni', title: 'Lihat celah reception Bisma 17–21', route: () => 'hrd-mp-reception?outlet=OUT-BSM', run: view() },
    { who: 'eni', title: 'Ajukan 1 receptionist shift Sore Bisma', route: () => 'hrd-recruit', run: (U, c) => { c.req = U('req-create', { position: 'POS-RCP', outlet: 'OUT-BSM', count: '1', shift: 'Sore', skills: 'Check-in, bahasa Inggris' }); return c.req; } },
    { who: 'eni', title: 'Setujui sebagai Operational Manager', route: () => 'hrd-recruit', run: (U, c) => U('req-approve', { id: c.req }) },
    { who: 'made', title: 'Setujui sebagai Manager HRD', route: () => 'hrd-recruit', run: (U, c) => U('req-approve', { id: c.req }) },
    { who: 'harja', title: 'Publikasikan lowongan Receptionist', route: () => 'hrd-rec-jobs', run: (U, c) => { c.vac = U('vac-publish', { req: c.req }); return c.vac; } }
  ] },
  { id: 'kinerja', name: 'Kinerja & pengembangan therapist', why: 'Supervisor memverifikasi praktik pelatihan, HG memindahkan 9-Box dengan alasan, keduanya memvalidasi, lalu rencana coaching dibuat.', steps: [
    { who: 'mila', title: 'Verifikasi praktik Hot Stone peserta Ubud', route: () => 'hrd-training', run: (U, c, h) => { const prg = HR6.programs(h).find(p => p.id === 'PRG-HOT-2611'); const pt = prg && prg.participants.find(x => x.practice === 'Menunggu verifikasi' && x.attend === 'Hadir' && h.placements.some(pl => pl.emp === x.emp && pl.location === 'OUT-UBD' && !pl.to)); if (!pt) return 'Tidak ada peserta Ubud yang menunggu verifikasi'; c.trainee = pt.emp; return U('train-verify', { id: 'PRG-HOT-2611', emp: pt.emp }); } },
    { who: 'ari', title: 'Therapist melihat XScore miliknya', route: () => 'hrd-kpi', run: view() },
    { who: 'hg', title: 'Pindahkan Putu Ari ke Calon Bintang (alasan wajib)', route: () => 'hrd-ninebox', run: (U) => U('nine-move', { emp: 'EMP-0001', box: 'M-H', reason: 'Asesmen potensi Nov: siap mentor hot stone' }) },
    { who: 'mila', title: 'Validasi 9-Box sebagai Supervisor', route: () => 'hrd-ninebox', run: (U) => U('nine-validate', { emp: 'EMP-0001' }) },
    { who: 'hg', title: 'Validasi HG & buat rencana pengembangan', route: (c) => c.plan ? `hrd-dev?id=${c.plan}` : 'hrd-dev', run: (U, c) => { U('nine-validate', { emp: 'EMP-0001' }); c.plan = U('plan-create', { emp: 'EMP-0001', comp: 'COMP-HYG', from: 'ninebox' }); return c.plan; } }
  ] },
  { id: 'payroll', name: 'Payroll November → Finance', why: 'Komisi POS masuk payroll, Manager HRD mengunci batch, jurnal agregat diserahkan dan diterima Finance Manager.', steps: [
    { who: 'made', title: 'Cek komisi POS per Service Line', route: () => 'hrd-pay-commission?outlet=OUT-UBD', run: view() },
    { who: 'made', title: 'Generate draf payroll November', route: () => 'hrd-pay-process?period=2611', run: (U) => U('pay-generate', { period: '2611' }) },
    { who: 'made', title: 'Review & kunci batch (snapshot)', route: () => 'hrd-pay-process?period=2611', run: (U) => { U('pay-review', { period: '2611' }); return U('pay-lock', { period: '2611' }); } },
    { who: 'made', title: 'Kirim jurnal agregat ke Finance', route: () => 'hrd-pay-handoff?period=2611', run: (U) => U('fin-handoff', { period: '2611' }) },
    { who: 'asri', title: 'Finance Manager menerima jurnal (selisih 0)', route: () => 'hrd-pay-handoff?period=2611', run: (U) => U('fin-ack', { period: '2611', variance: '0' }) },
    { who: 'owner', title: 'Owner melihat rasio biaya tenaga kerja (agregat)', route: () => 'hrd-budget', run: view() }
  ] },
  { id: 'reflection', name: 'Monthly Reflection → STRACON', why: 'Temuan kapasitas Ubud dibahas di Reflection, diputuskan di STRACON, dijalankan sebagai Workplan dan dipresentasikan di e-Deck.', steps: [
    { who: 'eni', title: 'Baca Monthly Reflection November', route: () => 'hrd-race-reflection', run: view() },
    { who: 'made', title: 'Tandai utility Ubud sebagai Issue', route: (c) => c.task ? `hrd-task?id=${c.task}` : 'hrd-race-reflection', run: (U, c) => { c.task = U('rfl-mark', { key: 'UTIL-OUT-UBD', period: '2611', stage: 'Issue' }); return c.task; } },
    { who: 'made', title: 'Catat keputusan kapasitas di STRACON', route: (c) => c.dec ? `hrd-race-stracon?id=${c.dec}` : 'hrd-race-stracon', run: (U, c) => { c.dec = U('dec-create', { title: 'Tambah 2 therapist Spa Ubud', finding: 'FND-UTIL-UBD-2611', task: c.task, alternatives: 'Lembur terjadwal|Bantuan Shanti|Rekrut 2 therapist', chosen: 'Rekrut 2 therapist', reason: 'Utility di atas 100% dan lembur berulang', owner: 'EMP-0142', due: '2026-11-30', ckey: 'UTIL-OUT-UBD', cop: '<=', cvalue: '100', cperiod: '2612' }); return c.dec; } },
    { who: 'made', title: 'Jadikan keputusan Workplan', route: (c) => c.wp ? `hrd-task?id=${c.wp}` : 'hrd-race-stracon', run: (U, c) => { c.wp = U('dec-workplan', { id: c.dec }); return c.wp; } },
    { who: 'owner', title: 'Owner membuka e-Deck halaman Utility', route: () => 'hrd-race-deck?page=1', run: view() }
  ] }
];
const prevExt = { ...HR.EXT };
HR.EXT.purge = (h) => { prevExt.purge?.(h); if (H.state.dxlab) delete H.state.dxlab.HRD; };

/* ---------- kinerja tim HRD (fokus portal HRD) ---------- */
function teamRows() {
  const h = hr(), ts = (h.f3?.tasks || []).filter(t => t.ws === 'HRD' || t.ws === 'HG');
  const team = PERSONAS.filter(p => TEAM.includes(p.id));
  return team.map(p => {
    const mine = ts.filter(t => t.pic === p.emp), done = mine.filter(t => t.stage === 'Selesai').length;
    const late = mine.filter(t => t.due && t.due < HR.TODAY && t.stage !== 'Selesai').length, blocked = mine.filter(t => t.blocker && t.stage !== 'Selesai').length;
    const acts = h.audit.filter(a => a.by === actorOf(p)).length;
    return [esc(pName(p)), esc(p.title), `${done}/${mine.length}`, late ? chip(`${late} terlambat`, 'bad') : chip('Tepat waktu', 'ready'), blocked ? chip(`${blocked} blocker`, 'bad') : '—', acts, link(`hrd-race-daily?emp=${p.emp}`, 'Daily Race')];
  });
}
function extra() {
  const cur = curPersona();
  return card('Persona demo', `<section class="grid g4 keep2">${PERSONAS.map(p => `<article class="card dx-persona${cur && cur.id === p.id ? ' on' : ''}"><div class="lbl">${esc(p.title)}${TEAM.includes(p.id) ? '' : ' · konteks alur'}</div><h3>${esc(pName(p))}</h3><p class="muted small">${esc(p.does)}</p></article>`).join('')}</section><p class="muted small">Login role di Test Lab hanya untuk tim HRD. Persona divisi lain menjalankan langkahnya otomatis bila memang bagian alur HRD. Supervisor Tina (Shanti), Dewik (Triloka) dan Wahyudi (Bisma) tercatat di struktur; role demo Supervisor saat ini berlingkup Spa Ubud.</p>`) +
    card('Kinerja tim HRD', table(['Anggota', 'Peran', 'Kartu selesai', 'Tenggat', 'Hambatan', 'Aksi tercatat (audit)', ''], teamRows()) + '<p class="muted small">Dibaca dari Planner F3 dan audit portal HRD. Kinerja divisi lain ada di Demo Center portalnya masing-masing.</p>');
}

const TEAM = ['made', 'harja', 'ayu', 'hg'];
H.DXLAB.define({
  portal: 'HRD', route: 'hrd-dx', page: 'hrd.html', publicRole: 'hrd',
  title: 'Demo Experience Center HRD', eyebrow: 'HAWK × JAENS · DX-HRD · GUIDED DEMO',
  intro: 'Belajar alur kerja HRD dengan menekan tombol asli aplikasi HAWK. Login sebagai Made Gunarsa, Harja, Ayu atau Lead Human Growth, pilih Desktop, iPad atau Mobile. Satu data sandbox bersama, tidak terhubung ke HAWK produksi.',
  purpose: 'Persona tim HRD menjalankan skenario portal HRD; divisi lain hanya pada langkah yang bersinggungan langsung dengan alur HRD (berjalan otomatis).',
  personas: PERSONAS, team: TEAM, scenarios: SC, nameOf: pName,
  sim: [{ who: 'made', device: 'desktop' }, { who: 'harja', device: 'desktop' }, { who: 'ayu', device: 'ipad' }, { who: 'hg', device: 'mobile' }],
  update: (state, a, input) => HR.update(state, a, input), stateOf: () => hr(),
  extra: { label: 'Persona & kinerja tim', html: extra }
});

const items = H.PORTALS.HRD.items;
const ih = items.findIndex(i => i[0] === 'hrd-home');
items.splice(ih + 1, 0, ['hrd-dx', 'Demo Experience Center', 'DX-HRD', 'ready', '', 'sub']);
H.PURPOSE['hrd-dx'] = 'Persona tim HRD menjalankan skenario portal HRD; divisi lain hanya pada langkah yang bersinggungan langsung dengan alur HRD.';
H.SCREENS.push(['DX-HRD', 'HRD · Demo Experience Center', 'HRD DX', 'hrd-dx', 'ready', 'Semua persona demo']);
})();
