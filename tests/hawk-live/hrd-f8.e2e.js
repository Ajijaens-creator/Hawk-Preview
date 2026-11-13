/* HAWK HRD F8 · uji browser (Playwright) mengikuti urutan review NB F8.
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/hrd-f8.e2e.js */
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
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); };
  const setRole = async (r) => { await p.selectOption('#role', r); await p.waitForTimeout(150); };
  const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('hawk-integrated-demo-v1') || '{}').hr || {});
  const act = async (sel) => { await p.locator(sel).first().click(); await p.waitForTimeout(220); };
  await go('hrd-home'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(200);
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

  /* Jalur 1: NV01 → NV02 */
  await go('hrd-race'); await shot('F8-NV01-race-vegen');
  let t = await text();
  ok('NV01: 6 indikator Vegen, total bobot 100%, skor terukur', /IND-6/.test(t) && /total bobot 100%/.test(t) && /Skor Race/.test(t));
  await act('#view a:has-text("IND-1")');
  t = await text();
  ok('Drill indikator → key metrics dengan target, aktual, bukti, metric version', /Therapist Utility/.test(t) && /MET-UTIL v1/.test(t) && /UTIL-2610/.test(t));
  await go('hrd-race?ind=IND-3');
  ok('Bukti/data kosong ditandai gap (Absenteeism)', /Absenteeism[\s\S]*Belum tersedia/.test(await text()) && /Gap data/.test(await text()));
  await go('hrd-race?ind=IND-4'); await act('#view a:has-text("BCN-02")');
  ok('Goal → Beacon: BCN-02 menaut induk IND-4 dan Task ID', p.url().includes('hrd-race-beacon?id=BCN-02') && /Induk IND-4/.test(await text()) && /TSK-0004/.test(await text()));
  await go('hrd-race?tab=ver'); await act('[data-action="hr:race-draft"]');
  const wf = p.locator('form[data-submit="hr:race-edit"]:has(input[name=id][value="IND-1"])');
  await wf.locator('[name=weight]').fill('19'); await wf.locator('button').click(); await p.waitForTimeout(200);
  ok('Bobot 99%: tampil "tetap draf"', /99% · tetap draf/.test(await text()));
  await act('[data-action="hr:race-activate"]');
  ok('Aktivasi 99% ditolak', (await S()).f8.races[0].versions.find(v => v.status === 'Aktif').v === 1);
  await wf.locator('[name=weight]').fill('21'); await wf.locator('button').click(); await p.waitForTimeout(200);
  ok('Bobot 101%: tetap draf', /101% · tetap draf/.test(await text()));
  const af = p.locator('form[data-submit="hr:race-edit"]:has(input[name=add])');
  await af.locator('[name=name]').fill('Employer Branding'); await af.locator('[name=weight]').fill('0'); await af.locator('[name=keys]').fill('Share Loker'); await af.locator('button').click(); await p.waitForTimeout(200);
  await wf.locator('[name=weight]').fill('20'); await wf.locator('button').click(); await p.waitForTimeout(200);
  ok('Tambah indikator + bobot 100% → siap diaktifkan', /Tepat 100%/.test(await text()) && /Employer Branding/.test(await text()));
  await shot('F8-NV01-versi-draf');
  await act('[data-action="hr:race-activate"]');
  ok('Aktivasi 100%: v2 aktif, v1 arsip', /v2[\s\S]*Aktif/.test(await text()) && /Arsip/.test(await text()));
  await go('hrd-race-beacon?id=BCN-02'); await shot('F8-NV02-beacon');
  const bf = p.locator('form[data-submit="hr:beacon-review"]');
  for (let i = 0; i < 6; i++) await bf.locator(`[name=r${i}]`).selectOption(String([3, 3, 4, 2, 3, 3][i]));
  await bf.locator('[name=reason]').fill('Formasi Ubud berjalan sesuai rencana'); await bf.locator('button').click(); await p.waitForTimeout(200);
  ok('Review Success Factors tersimpan dengan bukti & penilai', /RVW-BCN-02-1/.test(await text()) && /TSK-0004/.test(await text()));
  await go('hrd-race-beacon?tab=sf'); await shot('F8-NV02-success-factors');
  ok('Tab Success Factors: rubric + riwayat review', /Kualitas objective/.test(await text()) && /RVW-BCN-02-1/.test(await text()));

  /* Jalur 2: NV03 → NV04 → NV05, Task ID sama */
  await go('hrd-race-daily'); await shot('F8-NV03-daily');
  t = await text();
  ok('NV03: komitmen My Day (TSK-0001) tampil di Daily Race', /Komitmen \(My Day\) · 1/.test(t) && /TSK-0001/.test(t));
  const blf = p.locator('form[data-submit="hr:task-blocker"]');
  await blf.locator('[name=reason]').fill('Data POS Ubud belum lengkap'); await blf.locator('button').click(); await p.waitForTimeout(200);
  ok('Blocker dicatat dari Daily → terlihat di Daily', /Blocker: Data POS Ubud belum lengkap/.test(await text()));
  await go('hrd-myday');
  ok('Kartu yang sama di My Day F3', /TSK-0001/.test(await text()));
  await go('hrd-task?id=TSK-0001');
  ok('Kartu Planner memuat blocker yang sama', /Data POS Ubud belum lengkap/.test(await text()));
  await go('hrd-race-daily'); await act('[data-action="hr:race-session"]');
  ok('Sesi Daily tersimpan dengan status saat review', /SES-D\d+/.test(await text()));
  await go('hrd-race-weekly'); await shot('F8-NV04-weekly');
  t = await text();
  ok('NV04: komitmen, terbawa, hambatan, kapasitas', /Komitmen mingguan/.test(t) && /Pekerjaan terbawa/.test(t) && /Kapasitas PIC/.test(t) && /TSK-0001/.test(t));
  const waf = p.locator('form[data-submit="hr:weekly-action"]');
  await waf.locator('[name=title]').fill('Jadwalkan praktik kandidat Ubud'); await waf.locator('[name=pic]').selectOption('EMP-0145'); await waf.locator('[name=due]').fill('2026-11-20'); await waf.locator('[name=sourceId]').fill('TSK-0004'); await waf.locator('button').click(); await p.waitForTimeout(250);
  ok('Tindakan berikutnya → kartu Workplan F3 (PIC, tenggat, sumber)', /hrd-task\?id=TSK-1\d{3}/.test(p.url()) && /Workplan/.test(await text()) && /TSK-0004/.test(await text()));

  /* Jalur 3: F5 → NV05 → F3 → NV06 */
  await go('hrd-mp-utility?outlet=OUT-UBD');
  const f5 = (await text()).match(/(\d{3}\.\d)%/);
  await go('hrd-race-reflection'); await shot('F8-NV05-reflection');
  t = await text();
  ok('NV05: utility Ubud sama dengan F5 dan "Di atas kapasitas"', !!f5 && t.includes(f5[1] + '%') && /Di atas kapasitas/.test(t), f5 && f5[1]);
  ok('Santi < 70% sudah bertaut ke temuan F5 (TSK-0002)', /Utility Spa Santi[\s\S]*?TSK-0002/.test(t));
  await act('#view tr:has-text("Utility Spa Ubud") [data-stage="Issue"]');
  const issue = (p.url().match(/TSK-\d+/) || [])[0];
  ok('Ubud → Issue F3 dengan Finding ID', !!issue && /FND-UTIL-UBD-2611/.test(await text()), issue);
  await go('hrd-race-reflection');
  ok('Reflection menampilkan kartu yang sama (penandaan ulang tidak menggandakan)', (await p.locator('#view tr:has-text("Utility Spa Ubud")').innerText()).includes(issue) && (await p.locator('#view tr:has-text("Utility Spa Ubud") [data-stage]').count()) === 0);
  await act('#view tr:has-text("Utility Spa Ubud") a:has-text("Catat keputusan")');
  const df = p.locator('form[data-submit="hr:dec-create"]');
  ok('Form keputusan terisi kartu & temuan dari Reflection', (await df.locator('[name=task]').inputValue()) === issue && (await df.locator('[name=finding]').inputValue()) === 'FND-UTIL-UBD-2611');
  await df.locator('[name=title]').fill('Tambah 2 therapist Spa Ubud'); await df.locator('[name=alternatives]').fill('Lembur terjadwal|Bantuan Santi|Rekrut 2 therapist'); await df.locator('[name=chosen]').fill('Rekrut 2 therapist');
  await df.locator('[name=reason]').fill('Utility di atas 100% dan lembur berulang'); await df.locator('[name=due]').fill('2026-11-30'); await df.locator('[name=cvalue]').fill('100'); await df.locator('[name=cperiod]').selectOption('2611'); await df.locator('button').click(); await p.waitForTimeout(250);
  const dec = (p.url().match(/DEC-2611-\d+/) || [])[0];
  ok('Decision ID tercatat dengan kriteria evaluasi', !!dec && /UTIL-OUT-UBD <= 100/.test(await text()), dec);
  await shot('F8-NV06-stracon');
  await act('[data-action="hr:dec-workplan"]');
  const wp = (p.url().match(/TSK-\d+/) || [])[0];
  ok('Workplan dari keputusan (sumber Decision ID)', !!wp && (await text()).includes(dec) && /Workplan/.test(await text()), wp);
  await go('hrd-race-stracon?id=' + dec); await act('[data-action="hr:dec-evaluate"]');
  ok('Evaluasi: hasil dibandingkan kriteria saat keputusan', /belum tercapai/.test(await text()));
  await go('hrd-race-stracon?id=DEC-2610-001');
  ok('Keputusan Oktober (Santi) terbuka dengan kriteria & hasil November', /UTIL-OUT-SHT >= 70/.test(await text()) && /Belum tercapai/.test(await text()));

  /* Jalur 4: NV07 → NV08 */
  for (let i = 0; i < 8; i++) { await go(`hrd-race-deck?period=2611&page=${i}`); if (i < 2 || i === 7) await shot(`F8-NV07-deck-${i + 1}`); }
  await go('hrd-race-deck?period=2611&page=1');
  ok('NV07: halaman utility = nilai Reflection', (await text()).includes(f5[1] + '%'));
  await act('#view a:has-text("UTIL-OUT-UBD-2611")');
  ok('Klik bukti → Pusat Laporan (jejak RPT-UTIL-OUT-UBD)', /RPT-UTIL-OUT-UBD/.test(await text()) && /MET-UTIL v1/.test(await text()) && (await text()).includes(issue));
  await go('hrd-race-deck?period=2611&page=1'); await act('[data-action="hr:deck-snapshot"]');
  const snap = (p.url().match(/SNP-2611-\d+-v1/) || [])[0];
  ok('Snapshot sesi tersimpan (versi metrik & Race)', !!snap && /RACE v2/.test(await text()), snap);
  const cf = p.locator('form[data-submit="hr:deck-snapshot"]');
  await cf.locator('[name=field]').selectOption('Utility Spa Ubud'); await cf.locator('[name=value]').fill('107'); await cf.locator('[name=reason]').fill('Koreksi data POS terlambat masuk'); await cf.locator('button').click(); await p.waitForTimeout(250);
  ok('Koreksi → v2 merujuk v1 dan menandai nilai sebelumnya', p.url().includes(snap.replace('-v1', '-v2')) && /dikoreksi dari/.test(await text()) && (await text()).includes(snap));
  await shot('F8-NV07-snapshot-koreksi');
  await go('hrd-race-deck?snap=' + snap + '&page=1');
  ok('Snapshot v1 tetap nilai asli', (await text()).includes(f5[1] + '%'));
  await go('hrd-report-center'); await shot('F8-NV08-pusat-laporan');
  t = await text();
  ok('NV08: status Bukti kosong, Kedaluwarsa, Dikoreksi tampil', /Bukti kosong/.test(t) && /Kedaluwarsa/.test(t) && /Dikoreksi/.test(t));
  await go('hrd-report-center?id=RPT-UTIL-OUT-UBD');
  const nT = (await S()).f3.tasks.length;
  await act('[data-action="hr:report-refresh"]:not([data-fail])'); await act('[data-fail="1"]'); await act('[data-action="hr:report-refresh"]:not([data-fail])');
  ok('Retry refresh: tidak menggandakan kartu, jumlah refresh tercatat', (await S()).f3.tasks.length === nT && /refresh 3×/.test(await text()));
  await go('hrd-report-center?period=2610&outlet=OUT-SHT');
  ok('Filter tanpa hasil → keadaan kosong + reset', /Tidak ada laporan untuk filter ini/.test(await text()));

  /* Jalur 6: akses */
  await setRole('owner'); await go('hrd-race-reflection');
  ok('Owner: biaya Reflection terbatas', /Terbatas · Manager HRD/.test(await text()));
  await go('hrd-report-center?id=RPT-PAY-2610');
  ok('Owner: laporan payroll = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await go('hrd-race-deck?snap=' + snap + '&page=0&export=1');
  ok('Owner: ekspor snapshot sensitif ditolak (hak diperiksa ulang)', (await p.locator('.hr-denied').count()) === 1);
  await go('hrd-race-deck?snap=' + snap + '&page=0');
  ok('Owner membuka snapshot: biaya tetap disembunyikan', /Terbatas · Manager HRD/.test(await text()));
  await setRole('outlet-spv'); await go('hrd-race-reflection');
  t = await text();
  ok('Supervisor Ubud: hanya utility outletnya', /Utility Spa Ubud/.test(t) && !/Utility Spa Santi/.test(t));
  await setRole('therapist'); await go('hrd-race');
  ok('Therapist → Race = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await go('hrd-race-deck');
  ok('Therapist → e-Deck lewat URL langsung = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await setRole('hrd'); await go('hrd-race-deck?snap=' + snap + '&page=0&export=1');
  ok('Manager HRD: ekspor snapshot disiapkan', /disiapkan \(simulasi/.test(await text()));
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
  ok('Keyboard: fokus berpindah', await p.evaluate(() => document.activeElement !== document.body));
  await p.setViewportSize({ width: 390, height: 844 });
  for (const r of ['hrd-race', 'hrd-race-beacon', 'hrd-race-daily', 'hrd-race-weekly', 'hrd-race-reflection', 'hrd-race-stracon', 'hrd-race-deck', 'hrd-report-center']) { await go(r); const w = await p.evaluate(() => document.documentElement.scrollWidth); ok(`Mobile 390 px: ${r}`, w <= 392, String(w)); await shot('F8-mobile-' + r); }
  await p.setViewportSize({ width: 1440, height: 950 });
  await go('hrd-demo?confirm=1'); const dd = p.locator('form[data-submit="hr:dummy-delete"]');
  if (await dd.count()) { await dd.locator('[name=confirm]').fill('HAPUS DUMMY'); await dd.locator('button').click(); await p.waitForTimeout(300); }
  const after = await S();
  ok('Hapus dataset demo: snapshot & keputusan demo ikut terhapus', !after.f8 || (after.f8.snapshots.length === 0 && !after.f8.decisions.some(d => d.id === dec)));
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-f8-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
