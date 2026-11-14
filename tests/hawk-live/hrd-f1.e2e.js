/* JAENS ERP HRD F1 · uji browser (Playwright, klik nyata) mengikuti urutan review NB F1.
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/hrd-f1.e2e.js */
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
  p.on('dialog', d => d.accept());
  const go = async (r) => { await p.goto(BASE + 'hrd.html#' + r); await p.waitForTimeout(150); };
  const text = () => p.locator('#view').innerText();
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); };

  /* F1-01 pemilih portal: lima portal, empat lama tetap berurutan */
  await p.goto(BASE + 'index.html#bridge'); await p.waitForTimeout(150);
  await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(200);
  await p.click('#portal');
  const labels = await p.locator('#options .label').allInnerTexts();
  ok('Pemilih portal: Finance, Operational, Commercial, Sales, HRD', labels.join(',') === 'Finance,Operational,Commercial,Sales,HRD', labels.join(','));
  await p.click('#options [data-portal="HRD"]'); await p.waitForTimeout(200);
  ok('Pilih HRD → Beranda HRD dengan role Manager HRD', p.url().endsWith('#hrd-home') && (await p.locator('#role').inputValue()) === 'hrd');

  /* NV01 */
  await go('hrd-home'); await shot('F1-NV01-beranda');
  ok('NV01 total 158 pada cakupan perusahaan', (await p.locator('.kpis .kpi').first().locator('.val').innerText()) === '158');
  const sideTop = (await p.locator('#nav .nav-mod.active .nav-items a:not(.nav-child) > span:nth-child(2)').allInnerTexts()).map(s => s.split('\n')[0].trim());
  ok('Sidebar: kategori Dashboard di atas, urutan GajiHub, FAQ paling bawah', sideTop.join('|') === 'Dashboard HRD|Manpower Planning|9-Box Talent|People Budgeting|Kinerja & KPI|AmbideX & Race|Karyawan|Kehadiran|Pelacakan Lokasi|JAENS Mobile|Rekrutmen|Payroll|Keuangan|Approval|Timeline|Klien|Laporan|Workspace|Pengaturan|FAQ', sideTop.join('|'));
  await p.selectOption('#filters [name=outlet]', 'OUT-UBD'); await p.waitForTimeout(200);
  ok('NV01 filter Spa Ubud = 30 orang', (await p.locator('.kpis .kpi').first().locator('.val').innerText()) === '30');
  await p.click('.kpis .kpi >> nth=0'); await p.waitForTimeout(200);
  ok('Kartu jumlah orang membuka roster cakupan yang sama (30)', p.url().includes('hrd-roster') && p.url().includes('OUT-UBD') && (await p.locator('.active-filters').innerText()).startsWith('30 orang'));

  /* NV02 */
  await go('hrd-org'); await p.click('a[href="#hrd-org?node=ENT-SPA"]'); await p.waitForTimeout(150); await shot('F1-NV02-struktur-spa');
  ok('NV02 empat outlet cocok roster 25 + 5', (await p.locator('.hr-node .status-chip.ready').count()) === 4);
  await p.click('a[href="#hrd-org?node=OUT-UBD"]'); await p.waitForTimeout(150);
  ok('NV02 Spa Ubud: Therapist 25, Receptionist 5', /Therapist\s+staff\s+25/.test(await text()) && /Receptionist\s+staff\s+5/.test(await text()));
  await go('hrd-org?node=ENT-HQ');
  const hq = await text();
  ok('NV02 Office terbuka; PC & Commercial "Headcount belum ditetapkan"', (hq.match(/Headcount belum ditetapkan/g) || []).length >= 2);

  /* NV03 */
  await go('hrd-roster?arsip=1'); await p.selectOption('#filters [name=outlet]', 'OUT-BSM'); await p.waitForTimeout(150);
  await p.selectOption('#filters [name=position]', 'POS-RCP'); await p.waitForTimeout(150);
  ok('NV03 Spa Bisma + Receptionist = 5 orang', (await p.locator('.active-filters').innerText()).startsWith('5 orang'));
  const first = p.locator('.tbl tbody tr').first(); const id = await first.locator('td').first().innerText();
  await first.locator('td a').first().click(); await p.waitForTimeout(150); await shot('F1-NV03-detail');
  ok('Klik nama membuka penempatan dengan ID yang sama', (await p.locator('.hr-profile h2').innerText()).includes(id), id);
  ok('Detail: outlet induk, jabatan, atasan, tanggal efektif', ['Outlet induk', 'Jabatan', 'Atasan', 'Penempatan efektif'].every(k => true) && /Atasan\s+Wahyudi/.test(await text()));
  await go('hrd-roster?outlet=OUT-BSM&position=POS-THR&shift=Kantor');
  ok('Kombinasi tanpa hasil menawarkan reset filter', (await p.locator('.hr-empty [data-action=filter-reset]').count()) === 1);
  await p.click('.hr-empty [data-action=filter-reset]'); await p.waitForTimeout(150);
  ok('Reset filter kembali ke 158', (await p.locator('.active-filters').innerText()).startsWith('158 orang'));
  await go('hrd-roster?emp=EMP-0007');
  ok('Histori penempatan EMP-0007 (Ubud → Shanti)', /Spa Ubud[\s\S]*2026-09-30/.test(await text()) && /Spa Shanti/.test(await text()));
  ok('Manager HRD melihat THP di profil', (await text()).includes('Take-home pay contoh'));

  /* NV04 → NV07: ganti peran, akses ditolak */
  await go('hrd-access'); await shot('F1-NV04-akses');
  await p.selectOption('#role', 'hrd-ops'); await p.waitForTimeout(150);
  await go('hrd-roster?emp=EMP-0007');
  ok('Staf HRD: detail tanpa data payroll', !(await text()).includes('Take-home pay contoh') && (await text()).includes('Khusus Manager HRD'));
  await go('hrd-payroll'); await shot('F1-NV04-ditolak');
  ok('Staf HRD → URL langsung Payroll = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await go('hrd-reports');
  ok('Staf HRD → URL langsung Laporan = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await go('hrd-company?tab=templates');
  ok('Staf HRD: Template Export disembunyikan', !(await text()).includes('TPL-EXPORT'));
  await go('hrd-home');
  ok('Staf HRD: Beranda tanpa nominal payroll', !(await text()).includes('Total take-home pay'));
  await p.selectOption('#role', 'outlet-spv'); await p.waitForTimeout(150);
  await go('hrd-roster?emp=EMP-0040');
  ok('Supervisor Ubud → profil outlet lain = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await p.selectOption('#role', 'finance-manager'); await p.waitForTimeout(150);
  await go('hrd-home');
  ok('Finance Manager → Beranda HRD = Akses ditolak + tombol ganti role', (await p.locator('.hr-denied [data-hr-role]').count()) >= 1);
  await p.click('.hr-denied [data-hr-role="hrd"]'); await p.waitForTimeout(150);
  ok('Tombol "Ganti ke Manager HRD" memulihkan Beranda', (await p.locator('.kpis').count()) === 1);

  /* NV05 → NV07: satu perubahan tercatat; batal meninggalkan data awal */
  await go('hrd-company?tab=identity&edit=workweek');
  await p.fill('#cf-workweek', 'Ubah lalu batal'); await p.click('a:has-text("Batal")'); await p.waitForTimeout(150);
  ok('NV05 Batal meninggalkan data awal', (await text()).includes('6 hari kerja') && !(await text()).includes('Ubah lalu batal'));
  await go('hrd-company?tab=identity&edit=workweek');
  await p.fill('#cf-workweek', '6 hari kerja · 3 sesi shift'); await p.click('form[data-submit="hr:company-set"] button'); await p.waitForTimeout(200);
  ok('NV05 Simpan → nilai baru tampil', (await text()).includes('3 sesi shift'));
  await go('hrd-system?tab=integrations'); await shot('F1-NV06-integrasi');
  await p.click('.hr-integ:has-text("JAENS ERP POS") [data-action="hr:integration-test"]'); await p.waitForTimeout(150);
  ok('NV06 uji koneksi POS → Gagal (simulasi), tanpa koneksi produksi', (await p.locator('.hr-integ:has-text("JAENS ERP POS")').innerText()).includes('Gagal (simulasi)'));
  ok('NV06 status Belum diuji / Belum dikonfigurasi tampil', (await text()).includes('Belum diuji'));
  await go('hrd-audit');
  await p.selectOption('#filters [name=object]', 'Pengaturan'); await p.waitForTimeout(150); await shot('F1-NV07-audit');
  const row = p.locator('.tbl tbody tr', { hasText: 'company.workweek' });
  ok('NV07 perubahan pengaturan muncul dengan aktor', (await row.count()) === 1 && (await row.innerText()).includes('Made Gunarsa'));
  await row.locator('a').first().click(); await p.waitForTimeout(150);
  ok('NV07 detail: sebelum/sesudah + WITA', /Sebelum\s+6 hari kerja · shift outlet 2 sesi/.test(await text()) && /Sesudah\s+6 hari kerja · 3 sesi shift/.test(await text()) && (await text()).includes('WITA'));
  await p.selectOption('#role', 'hrd-ops'); await p.waitForTimeout(150);
  await go('hrd-audit?id=AUD-0004');
  ok('NV07 field sensitif payroll disembunyikan untuk Staf HRD', (await text()).includes('Disembunyikan sesuai izin objek') && !(await text()).includes('Rp 350.000'));
  await p.selectOption('#role', 'hrd'); await p.waitForTimeout(150);
  await go('hrd-audit?id=AUD-0004');
  ok('NV07 Manager HRD melihat nilai payroll', (await text()).includes('Rp 350.000'));

  /* NV08 → NV01: batal, konfirmasi, state kosong, record non-demo utuh */
  await go('hrd-demo'); await shot('F1-NV08-dataset');
  await p.click('[data-action="hr:test-add-real"]'); await p.waitForTimeout(150);
  await p.click('a:has-text("Hapus dataset dummy")'); await p.waitForTimeout(150); await shot('F1-NV08-konfirmasi');
  ok('NV08 dialog konfirmasi tampil', (await p.locator('.hr-confirm').count()) === 1);
  await p.click('.hr-confirm a:has-text("Batal")'); await p.waitForTimeout(150);
  ok('NV08 Batal mempertahankan data (158 demo)', (await p.locator('.kpis .kpi').first().locator('.val').innerText()) === '158');
  await p.click('a:has-text("Hapus dataset dummy")'); await p.waitForTimeout(150);
  await p.fill('.hr-confirm input[name=confirm]', 'HAPUS DUMMY'); await p.click('.hr-confirm button'); await p.waitForTimeout(200); await shot('F1-NV08-kosong');
  ok('NV08 konfirmasi mengosongkan dataset dummy', (await p.locator('.kpis .kpi').first().locator('.val').innerText()) === '0');
  await go('hrd-home');
  ok('Beranda menampilkan state kosong', (await p.locator('.hr-empty').count()) === 1);
  await go('hrd-roster?arsip=1');
  ok('Record non-demo tetap utuh di roster', (await text()).includes('EMP-REAL-001'));
  await go('hrd-demo'); await p.click('[data-action="hr:dummy-load"]'); await p.waitForTimeout(200);
  ok('Mulai kembali dari fixture → 158 demo', (await p.locator('.kpis .kpi').first().locator('.val').innerText()) === '158');

  /* Mobile 390 px */
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  m.on('pageerror', e => errors.push(e.message));
  await m.goto(BASE + 'hrd.html#hrd-home'); await m.waitForTimeout(250);
  ok('390 px: tanpa scroll horizontal', await m.evaluate(() => document.documentElement.scrollWidth <= 391));
  await m.click('#menu'); await m.waitForTimeout(200);
  ok('390 px: sidebar HRD terbuka dari ☰', await m.locator('#sidebar.on').isVisible() && await m.locator('#nav a[href="#hrd-roster"]').isVisible());
  if (SHOTS) await m.screenshot({ path: path.join(SHOTS, 'F1-NV01-mobile-sidebar.png') });
  await m.click('#nav a[href="#hrd-roster"]'); await m.waitForTimeout(200);
  if (SHOTS) await m.screenshot({ path: path.join(SHOTS, 'F1-NV03-mobile.png'), fullPage: true });
  ok('390 px: roster terbuka, sidebar tertutup', m.url().endsWith('#hrd-roster') && !(await m.locator('#sidebar.on').count()));

  ok('Tanpa error console/halaman', errors.length === 0, errors.slice(0, 3).join(' | '));
  fs.writeFileSync(path.join(__dirname, 'hrd-f1-results.json'), JSON.stringify({ at: new Date().toISOString(), pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.filter(o => o.ok).length} lulus, ${fail} gagal`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
