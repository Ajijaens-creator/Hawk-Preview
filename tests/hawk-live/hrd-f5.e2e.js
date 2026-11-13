/* HAWK HRD F5 · uji browser (Playwright) mengikuti urutan review NB F5.
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/hrd-f5.e2e.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const go = async (r) => { await p.goto(BASE + 'hrd.html#' + r); await p.waitForTimeout(150); };
  const text = () => p.locator('#view').innerText();
  const status = () => p.locator('#view .status, #status').first().innerText();
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); };
  const setRole = async (r) => { await p.selectOption('#role', r); await p.waitForTimeout(150); };
  const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('hawk-integrated-demo-v1')).hr);
  const act = async (sel) => { await p.click(sel); await p.waitForTimeout(180); };
  await go('hrd-home'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(200);

  /* Jalur 1: NV01 → NV02 → NV03 → NV06 · Spa Ubud 216/200 = 108% */
  await go('hrd-manpower'); await shot('F5-NV01-dashboard');
  const t1 = await text();
  ok('NV01: 4 outlet masing-masing 25 Therapist + 5 Receptionist', ['Spa Ubud', 'Spa Santi', 'Spa Triloka', 'Spa Bhisma'].every(o => new RegExp(`${o}\\s+25\\s+5`).test(t1)));
  ok('NV01: Office per divisi, PC & Commercial "headcount belum ditetapkan"', /Finance & Accounting\s+12/.test(t1) && (t1.match(/headcount belum ditetapkan/g) || []).length === 2);
  ok('NV01: peringatan Ubud di atas kapasitas & Santi di bawah 70%', /Spa Ubud 106\.2%/.test(t1) && /Spa Santi 66\.2%/.test(t1));
  ok('NV01: label DATA DEMO & sumber simulator', /DATA DEMO/.test(t1) && /UI-ONLY SIMULATION/.test(t1));
  await act('#view a[href="#hrd-mp-capacity?outlet=OUT-UBD&p=W46"]');
  ok('Klik outlet → NV02 Kapasitas Spa Ubud', p.url().includes('hrd-mp-capacity') && /Kapasitas Spa Ubud/.test(await text()));
  await act('#view a[href*="shift=Pagi"]');
  const t2 = await text(); await shot('F5-NV02-kapasitas-ubud-pagi');
  ok('NV02 shift Pagi: 200 jam reguler, 216 jam selesai, 108%', /Pagi\s+200 jam\s+216 jam\s+108%/.test(t2));
  ok('NV02 klik shift → anggota termasuk Bantuan dari Spa Santi', /Anggota shift Pagi/.test(t2) && /Bantuan\s+Spa Santi/.test(t2));
  await go('hrd-mp-utility?outlet=OUT-UBD'); await shot('F5-NV03-utility-ubud');
  const t3 = await text();
  ok('NV03: jejak 216 ÷ 200 = 108%, kelebihan 16 jam = lembur 10 + bantuan 6', /216 jam selesai ÷ 200 jam reguler = 108%/.test(t3) && /kelebihan 16 jam = lembur 10 jam \+ bantuan 6 jam/.test(t3));
  ok('NV03: total = pembilang ÷ penyebut (414 / 390)', /414 jam/.test(t3) && /390 jam/.test(t3) && /106\.2%/.test(t3));
  ok('NV03: refund, batal & Four Hands dijelaskan', /Refund tidak mengurangi/.test(t3) && /Four Hands/.test(t3));
  await act('#view a.kpi:has-text("Pembilang")');
  ok('Klik pembilang → NV06 baris POS Spa Ubud', p.url().includes('hrd-mp-pos') && /Baris layanan/.test(await text()));
  await go('hrd-mp-pos?outlet=OUT-UBD&shift=Pagi&q=TRX-UBD'); await shot('F5-NV06-pos');
  const firstLine = await p.locator('#view tbody tr').first().locator('a').first().innerText();
  await act(`#view a:has-text("${firstLine}")`);
  ok('NV06 detail baris: Transaction ID & Service Line ID', /Transaction ID/.test(await text()) && /Service Line ID/.test(await text()), firstLine);
  await p.locator('form[data-submit="hr:pos-refund"] button').click(); await p.waitForTimeout(200);
  ok('Refund tercatat, layanan tetap selesai', /Selesai · Refund \(RFD-2611-001\)/.test(await text()));
  await go('hrd-mp-utility?outlet=OUT-UBD');
  ok('Utility tidak berubah oleh refund (106.2%)', /106\.2%/.test(await text()));
  await go(`hrd-mp-pos?line=${firstLine}`);
  const cf = p.locator('form[data-submit="hr:pos-correct"]');
  await cf.locator('[name=dur]').fill('60'); await cf.locator('[name=reason]').fill('Salah input durasi'); await cf.locator('button').click(); await p.waitForTimeout(200);
  ok('Koreksi durasi tersimpan di baris', /60 menit · dikoreksi COR-2611-001/.test(await text()));
  await go('hrd-mp-pos'); await act('#view tr:has-text("POS-BATCH-20261107") [data-action="hr:pos-ingest"]');
  ok('Replay batch: 0 baris baru, duplikat diabaikan', /0 baris baru/.test(await status()));
  await go('hrd-audit?q=TRX-UBD');
  ok('Refund & koreksi masuk Audit', /Refund POS/.test(await text()) && /Koreksi POS/.test(await text()));

  /* Jalur 2: Simulasi → temuan → persetujuan → handoff (retry tanpa duplikat) → F4 */
  await go('hrd-mp-sim?outlet=OUT-UBD'); await shot('F5-NV07-simulasi');
  ok('NV07 bandingkan 3 opsi dengan utility sebelum/sesudah', await (async () => { const t = await text(); return ['Bantuan antaroutlet', 'Geser shift', 'Tambah formasi'].every(x => t.includes(x)) && /Utility sebelum/.test(t); })());
  const sf = p.locator('form[data-submit="hr:sim-save"]');
  await sf.locator('[name=option]').selectOption('formasi'); await sf.locator('[name=count]').fill('2'); await sf.locator('button').click(); await p.waitForTimeout(200);
  ok('Skenario tersimpan → detail sebelum/sesudah, asumsi & bukti', p.url().includes('id=SIM-2611-001') && /Asumsi/.test(await text()) && /Booking gagal karena kapasitas: 23/.test(await text()));
  await act('#view [data-action="hr:sim-mark"][data-stage="Issue"]');
  const task = (await S()).f5.scenarios[0].task;
  ok('Tandai Issue → kartu Planner F3', !!task && /Kartu:/.test(await text()), task);
  await go('hrd-mp-utility?outlet=OUT-UBD');
  ok('NV03 menampilkan kartu yang sama (satu temuan, satu kartu)', (await text()).includes(task) && (await p.locator('#view [data-action="hr:task-create"]').count()) === 0);
  await go('hrd-tasks');
  ok('Planner F3 menampilkan kartu utility yang sama', (await text()).includes(task) || (await go('hrd-list'), (await text()).includes(task)));
  await setRole('hrd-ops'); await go('hrd-mp-sim?id=SIM-2611-001');
  ok('Staf HRD tidak melihat tombol Setujui', (await p.locator('[data-action="hr:sim-approve"]').count()) === 0);
  await setRole('hrd'); await go('hrd-mp-sim?id=SIM-2611-001');
  await act('#view [data-action="hr:sim-approve"]:not([data-decision])');
  ok('Manager HRD menyetujui skenario', /Disetujui/.test(await text()));
  await go('hrd-mp-handoff?id=SIM-2611-001'); await shot('F5-NV08-handoff');
  await p.locator('form[data-submit="hr:mp-handoff"] button').click(); await p.waitForTimeout(200);
  const hr1 = await S(); const sc = hr1.f5.scenarios[0], nReq = hr1.f4.reqs.length;
  ok('Handoff → permintaan tenaga F4', /^REQ-HR-/.test(sc.req || ''), sc.req);
  await p.evaluate((id) => { const s = JSON.parse(localStorage.getItem('hawk-integrated-demo-v1')); HR.update(s, 'mp-handoff', { by: 'x', role: 'hrd', id }); localStorage.setItem('hawk-integrated-demo-v1', JSON.stringify(s)); }, sc.id); await p.reload();
  ok('Retry handoff tidak membuat permintaan ganda', (await S()).f4.reqs.length === nReq);
  await go('hrd-mp-handoff');
  ok('NV08 progres: posisi terbuka 2', new RegExp(`${sc.req}[\\s\\S]*?Menunggu Persetujuan[\\s\\S]*?\\s0\\s+2`).test(await text()));
  await go('hrd-rec-manage');
  ok('F4 Permintaan memuat sumber Manpower & Task ID', new RegExp(`${sc.req}[\\s\\S]*?Manpower SIM-2611-001`).test(await text()) && (await text()).includes(task));

  /* Jalur 3: Santi < 70% → Issue investigasi */
  await go('hrd-mp-utility?outlet=OUT-SHT'); await shot('F5-NV03-utility-santi');
  ok('Santi 66.2% Di bawah 70% → temuan yang sudah ada (TSK-0002), tanpa kartu ganda', /66\.2%/.test(await text()) && /Di bawah 70%/.test(await text()) && /Temuan sudah tercatat: TSK-0002/.test(await text()) && (await p.locator('[data-action="hr:task-create"]').count()) === 0);
  await act('#view a[href="#hrd-task?id=TSK-0002"]');
  ok('Kartu Santi terbuka dengan sumber utility', p.url().includes('hrd-task') && /Utility Spa Santi/.test(await text()));
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('hawk-integrated-demo-v1')); HR.update(s, 'task-move', { by: 'x', role: 'hrd', id: 'TSK-0002', to: 'Issue', via: 'menu' }); localStorage.setItem('hawk-integrated-demo-v1', JSON.stringify(s)); });
  await p.reload(); await go('hrd-mp-utility?outlet=OUT-SHT');
  ok('Naik ke Issue di Planner → status sama tampil di Utility', /TSK-0002 · Issue/.test(await text()));

  /* Jalur 4: Reception & divisi */
  await go('hrd-mp-reception'); await shot('F5-NV04-reception');
  const t4 = await text();
  ok('NV04: Ubud & Bhisma Sore 17–21 kurang coverage', /Spa Ubud\s+Sore\s+17–21\s+1\s+30[\s\S]*?Kurang coverage/.test(t4) && /Spa Bhisma\s+Sore\s+17–21\s+1\s+34[\s\S]*?Kurang coverage/.test(t4));
  ok('NV04: tiap outlet 5 receptionist', (t4.match(/Spa \w+\s+5\s+\d+/g) || []).length === 4);
  await go('hrd-mp-division'); await shot('F5-NV05-divisi');
  const t5 = await text();
  ok('NV05: Production data belum lengkap, PC/Commercial belum ditetapkan', /Production[\s\S]*?Data belum lengkap/.test(t5) && (t5.match(/Headcount belum ditetapkan/g) || []).length === 2);
  await go('hrd-manpower');
  ok('Dashboard memuat peringatan Reception 17–21', /Reception Spa Ubud Sore 17–21/.test(await text()));

  /* Periode Oktober = Beranda F1 */
  await go('hrd-mp-utility?outlet=OUT-UBD&p=2610');
  ok('Oktober: 5512 ÷ 5200 = 106% (sama dengan Beranda F1)', /5512 jam ÷ \(25 therapist × 8 jam × 26 hari = 5200 jam\) = 106%/.test(await text()));

  /* Akses */
  await setRole('outlet-spv'); await go('hrd-manpower');
  ok('Supervisor Ubud hanya melihat Spa Ubud', /Spa Ubud/.test(await text()) && !/Spa Santi\s+25/.test(await text()));
  await go('hrd-mp-pos');
  ok('Supervisor tidak melihat batch/refund', (await p.locator('[data-action="hr:pos-ingest"]').count()) === 0);
  await setRole('finance-manager'); await go('hrd-manpower');
  ok('Finance Manager → Manpower = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await setRole('therapist'); await go('hrd-mp-pos');
  ok('Therapist ESS → POS = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await setRole('hrd');

  await p.setViewportSize({ width: 390, height: 844 });
  for (const r of ['hrd-manpower', 'hrd-mp-utility?outlet=OUT-UBD', 'hrd-mp-pos', 'hrd-mp-sim?id=SIM-2611-001']) { await go(r); const w = await p.evaluate(() => document.documentElement.scrollWidth); ok(`Mobile 390 px: ${r}`, w <= 392, String(w)); await shot('F5-mobile-' + r.split(/[?&=]/).join('-')); }
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-f5-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
