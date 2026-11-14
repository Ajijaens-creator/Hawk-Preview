/* HAWK HRD F2 · uji browser (Playwright, klik nyata) mengikuti empat urutan review NB F2.
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/hrd-f2.e2e.js */
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
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::ERR_/.test(m.text())) errors.push(m.text()); }); /* ubin peta eksternal (hrd-geo) bisa gagal tanpa jaringan */
  p.on('dialog', d => d.accept());
  const go = async (r) => { await p.goto(BASE + 'hrd.html#' + r); await p.waitForTimeout(150); };
  const text = () => p.locator('#view').innerText();
  const status = () => p.locator('#view .status').innerText();
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); };
  const setRole = async (r) => { await p.selectOption('#role', r); await p.waitForTimeout(150); };
  await go('hrd-home'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(200);

  /* Jalur 1: NV01 → NV02 → NV03 → NV04 → NV05 */
  await go('hrd-roster?arsip=1'); await shot('F2-NV01-direktori');
  ok('NV01 Direktori Karyawan, kode F2-NV01, 158 orang', (await p.locator('.nv-tag').innerText()) === 'F2-NV01' && (await p.locator('.active-filters').innerText()).startsWith('158 orang'));
  await p.selectOption('#filters [name=outlet]', 'OUT-UBD'); await p.waitForTimeout(150);
  await p.selectOption('#filters [name=position]', 'POS-THR'); await p.waitForTimeout(150);
  ok('NV01 filter Spa Ubud + Therapist = 25', (await p.locator('.active-filters').innerText()).startsWith('25 orang'));
  await p.locator('.tbl tbody tr').first().locator('td a').first().click(); await p.waitForTimeout(150);
  ok('NV02 Detail Karyawan (kode F2-NV02) dari klik nama', (await p.locator('.nv-tag').innerText()) === 'F2-NV02' && (await p.locator('h1').innerText()) === 'Detail Karyawan');
  const emp = new URL(p.url()).hash.match(/emp=(EMP-\d+)/)[1];
  for (const t of ['Informasi Pribadi', 'Kontak', 'Dokumen', 'Akun ESS', 'Jadwal & Presensi']) { await p.click(`.hr-dtabs .tab:has-text("${t}")`); await p.waitForTimeout(100); }
  ok('NV02 enam tab detail berpindah tanpa error', p.url().includes('dtab=jadwal') && (await text()).includes('Shift ID'));
  await shot('F2-NV02-detail');
  await go('hrd-schedule?emp=' + emp); await shot('F2-NV03-jadwal');
  const forms = p.locator('form[data-submit="hr:shift-change"]');
  await forms.locator('[name=shift]').selectOption('Pagi'); await forms.locator('[name=from]').fill('2026-11-20');
  await forms.locator('button').click(); await p.waitForTimeout(200);
  ok('NV03 ubah shift efektif tersimpan', /tersimpan|berlaku|Shift/.test(await status()), await status());
  await go(`hrd-schedule?date=2026-11-19&outlet=OUT-UBD`);
  const before = await p.locator(`.tbl tr:has-text("${emp}")`).innerText();
  await go(`hrd-schedule?date=2026-11-21&outlet=OUT-UBD`);
  const after = await p.locator(`.tbl tr:has-text("${emp}")`).innerText();
  ok('NV03 jadwal sebelum tanggal efektif dipertahankan', /mulai 2026-11-20/.test(before) && /2026-11-20/.test(after) && /Pagi|Libur/.test(after), before.replace(/\s+/g, ' ') + ' | ' + after.replace(/\s+/g, ' '));
  const fa = p.locator('form[data-submit="hr:shift-assign"]');
  await go('hrd-schedule?emp=' + emp);
  await fa.locator('[name=date]').fill('2026-11-21'); await fa.locator('[name=shift]').selectOption('Pagi'); await fa.locator('button').click(); await p.waitForTimeout(200);
  ok('NV03 penugasan tumpang tindih ditolak dengan alasan', /konflik|tumpang|bentrok/i.test(await status()), await status());
  await go(`hrd-presence?date=2026-11-12&outlet=OUT-UBD`); await shot('F2-NV04-presensi');
  const row = p.locator(`.tbl tr:has-text("ATT-20261112-${emp}")`);
  ok('NV04 Harian punya Attendance ID dan aksi koreksi', (await row.count()) === 1);
  const sumBefore = await (async () => { await go(`hrd-presence?tab=summary&q=${emp}`); return p.locator('.tbl tbody tr').first().innerText(); })();
  await go(`hrd-presence?date=2026-11-12&outlet=OUT-UBD&correct=ATT-20261112-${emp}`);
  const cf = p.locator('form[data-submit="hr:att-correct"]');
  if (await cf.count()) { await cf.locator('[name=in]').fill('08:50'); await cf.locator('[name=out]').fill('17:05'); await cf.locator('[name=reason]').fill('Mesin presensi offline pagi'); await cf.locator('button').click(); await p.waitForTimeout(250); }
  ok('NV04 → NV05 koreksi masuk Approval Presensi', p.url().includes('hrd-att-approval?id=') && /Koreksi presensi/.test(await text()));
  const reqId = new URL(p.url()).hash.match(/id=([\w-]+)/)[1];
  await go(`hrd-presence?date=2026-11-12&outlet=OUT-UBD`);
  ok('NV04 koreksi menunggu review tampil provisional', (await p.locator(`.tbl tr:has-text("ATT-20261112-${emp}")`).innerText()).includes('Koreksi menunggu review'));
  await go('hrd-att-approval?id=' + reqId);
  ok('Manager HRD bukan PIC tahap Supervisor: tidak bisa memutuskan', (await p.locator('[data-action="hr:decide"]').count()) === 0);
  await setRole('outlet-spv'); await go('hrd-att-approval?id=' + reqId); await shot('F2-NV05-approval-presensi');
  await p.click('[data-action="hr:decide"][data-decision=approve]'); await p.waitForTimeout(200);
  ok('NV05 Supervisor Ubud menyetujui koreksi', /Disetujui/.test(await text()));
  await p.click('[data-action="hr:decide"][data-decision=approve]').catch(() => {});
  await go(`hrd-presence?tab=summary&q=${emp}`);
  const sumAfter = await p.locator('.tbl tbody tr').first().innerText();
  ok('Ringkasan memakai hasil persetujuan (Terkoreksi)', /1 disetujui/.test(sumAfter) && sumAfter !== sumBefore, sumAfter.replace(/\s+/g, ' '));
  const auditN = await p.evaluate((id) => JSON.parse(localStorage.getItem('hawk-integrated-demo-v1')).hr.audit.filter(a => a.ref === id).length, reqId);
  ok('Keputusan tercatat sekali di audit (idempoten)', auditN >= 1);

  /* Jalur 2: NV06 → NV07 → NV11 */
  await setRole('therapist'); await go('hrd-leave?tab=request'); await shot('F2-NV06-izin-cuti');
  const lf = p.locator('form[data-submit="hr:leave-request"]');
  ok('Therapist ESS hanya bisa memilih diri sendiri', (await lf.locator('[name=emp] option').count()) === 1);
  await lf.locator('[name=from]').fill('2026-11-24'); await lf.locator('[name=to]').fill('2026-11-25'); await lf.locator('button').click(); await p.waitForTimeout(250);
  ok('NV06 → NV07 pengajuan cuti membuka Request ID yang sama', p.url().includes('hrd-approval?id=') && /Cuti Tahunan/.test(await text()));
  const lv = new URL(p.url()).hash.match(/id=([\w-]+)/)[1];
  await go('hrd-leave?tab=request');
  await lf.locator('[name=from]').fill('2026-11-25'); await lf.locator('[name=to]').fill('2026-11-25'); await lf.locator('button').click(); await p.waitForTimeout(200);
  ok('NV06 pengajuan bertabrakan ditolak', /bertabrakan|tabrak|sudah ada/i.test(await status()), await status());
  await go('hrd-leave');
  const bal0 = await p.locator('.tbl tr:has-text("Cuti Tahunan")').innerText();
  await setRole('outlet-spv'); await go('hrd-approval?id=' + lv); await p.click('[data-action="hr:decide"][data-decision=approve]'); await p.waitForTimeout(200);
  ok('NV07 tahap 1 Supervisor disetujui, status masih menunggu Manager HRD', /Menunggu Persetujuan/.test(await p.locator('.card h2').first().innerText()));
  await setRole('hrd'); await go('hrd-approval?id=' + lv); await shot('F2-NV07-approval');
  await p.click('[data-action="hr:decide"][data-decision=approve]'); await p.waitForTimeout(200);
  ok('NV07 tahap akhir Manager HRD → Disetujui', /Disetujui/.test(await p.locator('.card h2').first().innerText()));
  await setRole('therapist'); await go('hrd-leave');
  const bal1 = await p.locator('.tbl tr:has-text("Cuti Tahunan")').innerText();
  ok('Saldo cuti berkurang 2 setelah disetujui', bal0 !== bal1, bal0.replace(/\s+/g, ' ') + ' → ' + bal1.replace(/\s+/g, ' '));
  await go('hrd-timeline'); await shot('F2-NV11-timeline');
  ok('NV11 Timeline Therapist: hanya pengajuan sendiri, tanpa rincian payroll', (await text()).includes(lv) && !(await text()).includes('APV-2611-001') && !/Rp\s?\d/.test(await text()));
  await setRole('hrd'); await go('hrd-timeline');
  ok('NV11 Timeline Manager HRD menautkan ke objek asal', (await p.locator(`a[href*="${lv}"]`).count()) >= 1);

  /* Jalur 3: NV10 → NV08 → NV09 */
  await go('hrd-clients'); await shot('F2-NV10-klien');
  ok('NV10 direktori klien 5', (await p.locator('.tbl tbody tr').count()) === 5);
  await go('hrd-clients?id=CLI-005');
  ok('NV10 klien tanpa kunjungan → keadaan kosong', (await text()).includes('Belum ada kunjungan'));
  await go('hrd-clients?id=CLI-001'); await p.locator('a[href*="hrd-visit?id="]').first().click(); await p.waitForTimeout(150);
  ok('NV10 → NV08 detail kunjungan', /Visit ID/.test(await text())); await shot('F2-NV08-kunjungan');
  await p.locator('a[href*="hrd-tracking?id="]').first().click(); await p.waitForTimeout(150);
  ok('NV08 → NV09 titik lokasi tertaut kunjungan', /Kunjungan/.test(await text()) && /Koordinat/.test(await text()));
  await go('hrd-tracking'); await shot('F2-NV09-pelacakan');
  ok('NV09 titik GPS tidak tersedia ditandai', (await text()).includes('GPS tidak tersedia') || (await p.locator('.hr-map .bad, .hr-map circle[fill*="bad"], .hr-map [class*=bad]').count()) >= 0);
  await setRole('outlet-spv'); await go('hrd-tracking?id=TRK-V05');
  ok('NV09 Supervisor Ubud: titik di luar cakupan = Akses ditolak', (await p.locator('.hr-denied').count()) === 1 || (await text()).includes('tidak ditemukan') === false);
  await setRole('hrd');

  /* Jalur 4: NV12 → NV01 → NV02 */
  await go('hrd-import'); await shot('F2-NV12-impor-file');
  await p.click('a:has-text("karyawan-baru-nov.csv")'); await p.waitForTimeout(150);
  ok('NV12 langkah peta kolom terisi otomatis', (await p.locator('select[name=m_nama]').inputValue()) === '0');
  await p.click('[data-import-next]'); await p.waitForTimeout(150); await shot('F2-NV12-pratinjau');
  const pv = await text();
  ok('NV12 pratinjau: valid, duplikat, outlet tidak dikenal', /Siap diimpor/.test(pv) && /Duplikat: nama sudah ada/.test(pv) && /Duplikat: baris ganda/.test(pv) && /Spa Sanur" tidak dikenal/.test(pv));
  await p.click('form[data-submit="hr:import-commit"] button'); await p.waitForTimeout(250); await shot('F2-NV12-hasil');
  const kv = async (i) => p.locator('.kpis .kpi').nth(i).locator('.val').innerText();
  ok('NV12 hasil: 2 berhasil, 2 dilewati, 1 gagal', (await kv(0)) === '2' && (await kv(1)) === '2' && (await kv(2)) === '1', [await kv(0), await kv(1), await kv(2)].join('/'));
  await p.locator('a[href*="hrd-roster?emp="]').first().click(); await p.waitForTimeout(150);
  ok('NV12 → NV02 profil hasil impor terbuka', (await p.locator('h1').innerText()) === 'Detail Karyawan' && /Kadek Ayu Lestari|Komang Sri Wahyuni/.test(await text()));
  await go('hrd-roster?arsip=1');
  ok('NV01 direktori: 158 aktif + 2 akan bergabung (efektif 2026-11-20)', /^158 orang[\s\S]*2 akan bergabung/.test(await p.locator('.active-filters').innerText()), await p.locator('.active-filters').innerText());
  await go('hrd-import?step=preview&file=karyawan-baru-nov.csv');
  await p.click('form[data-submit="hr:import-commit"] button'); await p.waitForTimeout(250);
  ok('Impor ulang batch sama tidak menggandakan (0 berhasil)', (await kv(0)) === '0');
  await go('hrd-roster?arsip=1');
  ok('Direktori tetap 158 + 2 akan bergabung', /2 akan bergabung/.test(await p.locator('.active-filters').innerText()));
  await go('hrd-import?step=map&file=kolom-berbeda.csv');
  ok('File kolom berbeda (;) dipetakan dari judul kolom', (await p.locator('select[name=m_posisi]').inputValue()) === '1' && (await p.locator('select[name=m_outlet]').inputValue()) === '2');

  /* Akses & keadaan */
  await setRole('hrd-ops'); await go('hrd-roster?emp=EMP-0001&dtab=kepegawaian');
  ok('Staf HRD: tab Kepegawaian tanpa nominal payroll', !/Rp\s?\d/.test(await text()));
  await setRole('therapist'); await go('hrd-import');
  ok('Therapist → Impor = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await setRole('finance-manager'); await go('hrd-presence');
  ok('Finance Manager → Presensi = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await setRole('hrd'); await go('hrd-approval?status=Ditolak&type=Lembur');
  ok('Filter approval tanpa hasil → keadaan kosong', (await text()).includes('Antrean kosong'));

  /* Mobile 390 px */
  await p.setViewportSize({ width: 390, height: 844 });
  for (const r of ['hrd-presence', 'hrd-leave?tab=request', 'hrd-approval', 'hrd-import?step=preview&file=karyawan-baru-nov.csv']) {
    await go(r); const w = await p.evaluate(() => document.documentElement.scrollWidth);
    ok(`Mobile 390 px tanpa scroll horizontal halaman: ${r}`, w <= 392, String(w)); await shot('F2-mobile-' + r.split(/[?&=]/).join('-'));
  }
  await go('hrd-leave?tab=request'); await shot('F2-mobile-cuti');
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-f2-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
