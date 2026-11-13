/* HAWK HRD F7 · uji browser (Playwright) mengikuti urutan review NB F7.
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/hrd-f7.e2e.js */
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
  const submit = async (sel) => { await p.locator(sel + ' button').first().click(); await p.waitForTimeout(220); };
  await go('hrd-home'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(200);

  /* Jalur 1: NV03 → NV04 → NV05 → NV08 */
  await go('hrd-pay-commission'); await shot('F7-NV03-komisi');
  const t3 = await text();
  ok('NV03: komisi Spa Ubud per therapist, termasuk bantuan dari Santi', /Per therapist · Spa Ubud/.test(t3) && /Bantuan\s+Spa Santi/.test(t3));
  await act('#view a.kpi:has-text("Four Hands")');
  ok('Four Hands: jumlah semua bagian = total transaksi', /Pembagian Four Hands/.test(await text()) && /Total \d+ transaksi = Rp/.test(await text()));
  await go('hrd-pay-commission?outlet=OUT-UBD&emp=EMP-0002');
  const before = await p.locator('#view tr:has-text("EMP-0002")').first().innerText();
  await go('hrd-mp-pos'); await act('#view tr:has-text("POS-BATCH-20261107") [data-action="hr:pos-ingest"]');
  await go('hrd-pay-commission?outlet=OUT-UBD&emp=EMP-0002');
  ok('Replay transaksi tidak menambah komisi', (await p.locator('#view tr:has-text("EMP-0002")').first().innerText()) === before);
  await go('hrd-pay-process'); await shot('F7-NV04-proses');
  await submit('form[data-submit="hr:pay-generate"]');
  ok('NV04: draf dibuat PAY-2611-01, sumber November provisional terlihat', /PAY-2611-01/.test(await text()) && /Sebagian · 7–13 Nov/.test(await text()));
  await submit('form[data-submit="hr:pay-generate"]');
  ok('Regenerasi memperbarui batch yang sama (v2)', /Draf · v2/.test(await text()) && (await S()).f7.batches.filter(b => b.period === '2611').length === 1);
  await submit('form[data-submit="hr:pay-review"]'); await submit('form[data-submit="hr:pay-lock"]');
  ok('Review → setujui & kunci → snapshot', /Dikunci/.test(await text()) && /Periode terkunci/.test(await text()));
  await go('hrd-pay-slip?emp=EMP-0002&period=2611'); await shot('F7-NV05-slip');
  const t5 = await text();
  ok('NV05: pendapatan − potongan = take-home pay (rekonsiliasi ✓)', /Rekonsiliasi ✓/.test(t5) && /Siap Bayar/.test(t5));
  ok('Komisi di slip tertaut ke baris POS', (await p.locator('#view a[href*="hrd-pay-commission"]').count()) >= 1);
  const pf = p.locator('form[data-submit="hr:pay-mark"]');
  await pf.locator('[name=ref]').fill(''); await pf.locator('button').click(); await p.waitForTimeout(200);
  ok('Status bayar tanpa referensi bukti ditolak', /referensi bukti/.test(await status()));
  await pf.locator('[name=status]').selectOption('failed'); await pf.locator('[name=ref]').fill('BANK-2611-RTN-01'); await pf.locator('[name=note]').fill('Rekening tidak valid'); await pf.locator('button').click(); await p.waitForTimeout(200);
  ok('Pembayaran gagal tercatat dengan referensi', /Gagal/.test(await text()) && /BANK-2611-RTN-01/.test(await text()));
  /* refund setelah kunci */
  const line = (await p.evaluate(() => HR5.lines(HR.ensure(JSON.parse(localStorage.getItem('hawk-integrated-demo-v1')))).find(l => l.emp === 'EMP-0002' && l.status === 'Selesai').line));
  await go(`hrd-mp-pos?line=${line}`); await submit('form[data-submit="hr:pos-refund"]');
  await go('hrd-pay-commission?view=adj');
  ok('Refund setelah kunci → penyesuaian ke Desember merujuk baris asal', new RegExp(`ADJ-RFD-2611-001[\\s\\S]*${line}[\\s\\S]*2611 → 2612`).test(await text()));
  await go('hrd-pay-handoff'); await shot('F7-NV08-handoff');
  ok('NV08: jurnal seimbang = snapshot HRD', /Seimbang/.test(await text()) && /Rekonsiliasi ✓/.test(await text()));
  await act('#view [data-action="hr:fin-handoff"][data-fail="1"]');
  ok('Handoff gagal tercatat', /Gagal kirim/.test(await text()) && /Timeout/.test(await text()));
  await act('#view [data-action="hr:fin-handoff"]:not([data-fail])');
  ok('Retry memakai Journal Batch ID sama (percobaan 2)', /JRN-PAY-2611-01/.test(await text()) && /Terkirim/.test(await text()) && (await S()).f7.batches.find(b => b.period === '2611').handoff.attempts === 2);
  await setRole('finance-manager'); await go('hrd-pay-handoff');
  ok('Finance melihat agregat per cost center, bukan slip', /Cost center/.test(await text()) && !/EMP-0002/.test(await text()));
  await submit('form[data-submit="hr:fin-ack"]');
  ok('Finance menerima jurnal', /Diterima Finance/.test(await text()));
  await go('hrd-pay-slip?emp=EMP-0002');
  ok('Finance → slip individu = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await go('hrd-payroll?period=2611');
  ok('Finance dashboard: agregat batch terkunci', /Total take-home pay/.test(await text()) && (await p.locator('#view a[href*="hrd-pay-slip"]').count()) === 0);

  /* Jalur 2: NV02 → NV06 → NV04 → NV07 (periode Desember belum ada, uji di Oktober-terkunci & November-terkunci) */
  await setRole('hrd'); await go('hrd-pay-rules?id=RUL-KOM'); await shot('F7-NV02-aturan');
  const rf = p.locator('form[data-submit="hr:rule-version"]');
  await rf.locator('[name=value]').fill('6000'); await rf.locator('[name=from]').selectOption('2611'); await rf.locator('[name=note]').fill('Kenaikan komisi'); await rf.locator('button').click(); await p.waitForTimeout(200);
  ok('Aturan baru di periode terkunci ditolak', /sudah dikunci/.test(await status()));
  await rf.locator('[name=from]').selectOption('2612'); await rf.locator('[name=note]').fill('Kenaikan komisi Desember'); await rf.locator('button').click(); await p.waitForTimeout(200);
  ok('Versi v2 efektif Desember; Oktober tetap v1', /v2/.test(await text()) && /Oktober \(dikunci\) merujuk v1/.test(await text()));
  await go('hrd-finance'); await shot('F7-NV06-kasbon');
  ok('NV06: cicilan KSB-2611-001-C1 dipakai di PAY-2611-01 tepat sekali', /KSB-2611-001-C1 · 2611 · Rp\s?500\.000 · PAY-2611-01/.test(await text()));
  await go('hrd-finance?tab=ledger');
  ok('Ledger saldo kasbon Rp1.000.000 setelah cicilan pertama', /Rp\s?1\.000\.000/.test(await text()));
  await go('hrd-finance?tab=rmb');
  ok('Reimburse kas kecil tidak masuk payroll', /Kanal lain: Kas kecil outlet KK-UBD-1107 \(tidak masuk payroll\)/.test(await text()));
  await go('hrd-reports'); await shot('F7-NV07-laporan');
  ok('NV07: 19 entri katalog', /19 entri katalog/.test(await text()) && (await p.locator('#view tbody tr').count()) === 19);
  await act('#view a:has-text("Ringkasan Gaji")');
  ok('Ringkasan Gaji merekonsiliasi batch', /Rekonsiliasi batch ✓/.test(await text()));
  await go('hrd-reports?group=PPH%2021%2F26&item=Pajak%20Bulanan%20Pegawai%20Tetap&period=2611');
  ok('Laporan PPh menampilkan versi aturan simulasi', /TER simulasi/.test(await text()));

  /* Jalur 3: NV09 → NV10 → NV11 → NV12 */
  await go('hrd-budget'); await shot('F7-NV09-budget');
  ok('NV09: Salary Ratio, Total People Cost Ratio, Revenue/Salary per Employee, ruang anggaran', await (async () => { const t = await text(); return ['Salary Ratio', 'Total People Cost Ratio', 'Revenue per Employee', 'Salary per Employee', 'Ruang anggaran'].every(k => t.includes(k)); })());
  ok('Definisi pembilang/penyebut/cakupan', /Pembilang/.test(await text()) && /Penyebut/.test(await text()));
  await p.selectOption('#filters [name=scope]', 'OUT-UBD'); await p.waitForTimeout(150);
  await act('#view a.kpi:has-text("Ruang anggaran")');
  ok('Klik kartu → Rencana Anggaran dengan filter terbawa', p.url().includes('hrd-bud-plan') && p.url().includes('scope=OUT-UBD') && /Spa Ubud/.test(await text()));
  ok('NV10: 12 bulan = total tahun, alokasi Office 100%', /Jumlah 12 bulan = total tahun/.test(await text()) && /Total porsi 100%/.test(await text()));
  await shot('F7-NV10-rencana');
  await go('hrd-bud-sim');
  const sf = p.locator('form[data-submit="hr:bud-sim"]');
  await sf.locator('[name=count]').fill('2'); await sf.locator('[name=start]').fill('2026-12-01'); await sf.locator('button').click(); await p.waitForTimeout(220);
  ok('NV11: tahun berjalan vs setahun penuh terpisah', /Biaya tahun berjalan \(2026\)/.test(await text()) && /Biaya setahun penuh/.test(await text()));
  await act('#view [data-action="hr:bud-sim-approve"]');
  ok('Tanpa Requisition ID F4 → tidak bisa disetujui', /Requisition ID F4/.test(await status()));
  await shot('F7-NV11-simulasi');
  await go('hrd-bud-trend'); await shot('F7-NV12-tren');
  ok('NV12: grafik dengan legenda + tabel; kurva S berakhir = total tahun', (await p.locator('.hr-legend').count()) === 2 && /Rekonsiliasi ✓/.test(await text()) && /Provisional/.test(await text()));
  await go('hrd-bud-trend?year=2025');
  ok('Pembanding tahun lalu tersedia', /2025/.test(await text()));

  /* Jalur 4: akses & keadaan */
  await setRole('hrd-ops'); await go('hrd-payroll');
  ok('Staf HRD → Payroll = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await go('hrd-pay-slip?emp=EMP-0001');
  ok('Staf HRD → slip lewat URL langsung = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await setRole('owner'); await go('hrd-payroll?period=2610');
  ok('Owner: agregat, tanpa tautan slip', /Total take-home pay/.test(await text()) && (await p.locator('#view a[href*="hrd-pay-slip"]').count()) === 0);
  await setRole('therapist'); await go('hrd-pay-slip');
  ok('Therapist → slip = Akses ditolak (nominal khusus Manager HRD)', (await p.locator('.hr-denied').count()) === 1);
  await setRole('hrd'); await go('hrd-pay-slip?period=2610&pay=Gagal');
  ok('Filter status Gagal (Oktober)', (await p.locator('#view tbody tr').count()) === 1);
  await go('hrd-pay-slip?period=2610&scope=OUT-UBD&pay=Belum%20siap');
  ok('Filter tanpa hasil → keadaan kosong', (await p.locator('.hr-empty').count()) === 1);
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
  ok('Keyboard: fokus berpindah', await p.evaluate(() => document.activeElement !== document.body));
  await p.setViewportSize({ width: 390, height: 844 });
  for (const r of ['hrd-payroll', 'hrd-pay-slip?emp=EMP-0002&period=2611', 'hrd-pay-handoff', 'hrd-budget', 'hrd-bud-trend']) { await go(r); const w = await p.evaluate(() => document.documentElement.scrollWidth); ok(`Mobile 390 px: ${r}`, w <= 392, String(w)); await shot('F7-mobile-' + r.split(/[?&=]/).join('-')); }
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-f7-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
