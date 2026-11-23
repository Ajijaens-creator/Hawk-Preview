/* HAWK HRD F3 · uji browser (Playwright, klik nyata) mengikuti urutan review NB F3.
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/hrd-f3.e2e.js */
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
  const status = () => p.locator('#view .status').innerText();
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); };
  const setRole = async (r) => { await p.selectOption('#role', r); await p.waitForTimeout(150); };
  const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('hawk-integrated-demo-v1')).hr.f3);
  await go('hrd-home'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(200);

  /* Jalur 1: NV01 → NV02 → NV08 → NV06 → NV07 */
  await go('hrd-tasks'); await shot('F3-NV01-workplace');
  ok('NV01 Workplace HRD Operations dengan ringkasan', (await p.locator('.nv-tag').innerText()) === 'F3-NV01' && /Tanpa PIC/.test(await text()));
  await p.click('.kpis a:has-text("Tanpa PIC")'); await p.waitForTimeout(150);
  ok('Klik ringkasan Tanpa PIC → List terfilter', p.url().includes('hrd-list') && p.url().includes('only=nopic') && (await p.locator('.tbl tbody tr').count()) >= 1);
  await go('hrd-tasks');
  await p.click('button:has-text("Tandai sebagai Issue")'); await p.waitForTimeout(200);
  const id = new URL(p.url()).hash.match(/id=(TSK-\d+)/)[1];
  ok('Gap utility Spa Ubud ditandai Issue → Detail Kartu', /Utility Spa Ubud 106%/.test(await text()) && /Issue/.test(await text()), id);
  await go('hrd-tasks');
  ok('Workplace menaut ke kartu yang sama (tidak membuat ganda)', (await p.locator(`a[href*="${id}"]`).count()) >= 1 && (await p.locator('button:has-text("Tandai sebagai Issue")').count()) === 0);
  await go('hrd-board');
  const issueCol = p.locator('.hr-col[data-stage="Issue"]');
  ok('NV02 Board 7 kolom, kartu baru di Issue', (await p.locator('.hr-col').count()) === 7 && (await issueCol.locator(`[data-task="${id}"]`).count()) === 1);
  await p.locator(`[data-task="${id}"]`).dragTo(p.locator('.hr-col[data-stage="Workplan"]'), { targetPosition: { x: 40, y: 12 } }); await p.waitForTimeout(200);
  ok('Drag ke Workplan tanpa PIC ditolak dengan validasi yang sama', /PIC dan tenggat/.test(await status()), await status());
  await go(`hrd-task?id=${id}`);
  await p.locator('form[data-submit="hr:task-assign"]').first().locator('select').selectOption('EMP-0143'); await p.locator('form[data-submit="hr:task-assign"]').first().locator('button').click(); await p.waitForTimeout(150);
  await p.locator('form[data-submit="hr:task-edit"] [name=due]').fill('2026-11-20'); await p.locator('form[data-submit="hr:task-edit"] button').click(); await p.waitForTimeout(150);
  await shot('F3-NV08-detail');
  await go('hrd-board'); await shot('F3-NV02-board');
  await p.locator(`[data-task="${id}"]`).dragTo(p.locator('.hr-col[data-stage="Workplan"]'), { targetPosition: { x: 40, y: 12 } }); await p.waitForTimeout(200);
  ok('NV02 drag-and-drop ke Workplan berhasil', (await p.locator(`.hr-col[data-stage="Workplan"] [data-task="${id}"]`).count()) === 1, await status());
  await p.locator(`[data-task="${id}"] select[name=to]`).selectOption('Priority'); await p.locator(`[data-task="${id}"] .hr-move button`).click(); await p.waitForTimeout(200);
  ok('Menu "Pindahkan ke" (keyboard/ponsel) ke Priority', (await p.locator(`.hr-col[data-stage="Priority"] [data-task="${id}"]`).count()) === 1);
  await go(`hrd-task?id=${id}&tab=history`); await shot('F3-NV08-histori');
  const hist = await text();
  ok('NV08 histori: aktor, asal → tujuan, via drag & menu, ganti PIC', /Made Gunarsa \(Manager HRD\)/.test(hist) && /Issue\s+Workplan\s+via drag/.test(hist) && /Workplan\s+Priority\s+via menu/.test(hist) && /Ganti PIC/.test(hist));
  await setRole('hrd-ops'); await go('hrd-mytasks'); await shot('F3-NV06-mytasks');
  ok('NV06 My Tasks Staf HRD memuat kartu baru', (await p.locator(`a[href*="id=${id}"]`).count()) >= 1);
  await p.locator(`tr:has(a[href*="id=${id}"]) button[data-action="hr:focus-toggle"]`).click(); await p.waitForTimeout(150);
  await go('hrd-myday'); await shot('F3-NV07-myday');
  ok('NV07 My Day memuat kartu yang sama', (await p.locator(`a[href*="id=${id}"]`).count()) >= 1);
  const f = (await S()).tasks.find(t => t.id === id);
  ok('Fokus tidak mengubah tenggat/PIC/status', f.due === '2026-11-20' && f.pic === 'EMP-0143' && f.stage === 'Priority');

  /* Jalur 2: NV05 → NV04 → NV03 */
  await setRole('hrd'); await go('hrd-library'); await shot('F3-NV05-library');
  await p.click('a[href*="hrd-library?id=TPL-ONB"]'); await p.waitForTimeout(150);
  ok('NV05 pratinjau langkah, PIC berbasis peran, tenggat relatif', /Staf HRD/.test(await text()) && /H-3/.test(await text()) && /H\+10/.test(await text()));
  await p.locator('form[data-submit="hr:template-apply"] [name=start]').fill('2026-11-24');
  await p.locator('form[data-submit="hr:template-apply"] button').click(); await p.waitForTimeout(250);
  const parent = new URL(p.url()).hash.match(/id=(TSK-\d+)/)[1];
  await go(`hrd-task?id=${parent}&tab=checklist`);
  ok('Template → kartu induk + 6 subtugas tertaut', (await p.locator('.hr-check li').count()) === 6 && (await p.locator('.hr-check a[href*="hrd-task"]').count()) === 6);
  await go(`hrd-list?q=${encodeURIComponent('·')}`);
  await go('hrd-list'); await p.fill('#filters [name=q]', 'Onboarding'); await p.press('#filters [name=q]', 'Enter'); await p.waitForTimeout(200);
  await shot('F3-NV04-list');
  const rows = await p.locator('.tbl tbody tr').count();
  ok('NV04 List menemukan induk + subtugas onboarding', rows >= 1, String(rows));
  await go('hrd-calendar'); await shot('F3-NV03-calendar');
  ok('NV03 Calendar: sesi orientasi & tenggat subtugas tampil', /Orientasi SOP/.test(await text()) && (await p.locator('.hr-ag.sesi').count()) >= 1 && (await p.locator('.hr-ag.due').count()) >= 1);
  const sub = (await S()).tasks.find(t => t.parent === parent && /Orientasi/.test(t.title));
  await go(`hrd-task?id=${sub.id}`);
  await p.locator('form[data-submit="hr:task-edit"] [name=sessionAt]').fill('2026-11-25 09:00'); await p.locator('form[data-submit="hr:task-edit"] button').click(); await p.waitForTimeout(150);
  await go('hrd-calendar');
  ok('Ubah jadwal pada kartu → kalender mencerminkan acara yang sama', /2026-11-25\s+09:00\s+Sesi\s+TSK/.test(await text()));
  await setRole('hg-lead'); await go('hrd-mytasks');
  ok('Subtugas HG muncul di My Tasks Human Growth Lead', /Orientasi SOP/.test(await text()));
  await setRole('outlet-spv'); await go('hrd-mytasks');
  ok('Subtugas Supervisor muncul di My Tasks Supervisor Ubud', /Pendampingan treatment|Verifikasi praktik/.test(await text()));

  /* Jalur 3: NV08 → NV02 — diskusi, bukti, checklist, review */
  await setRole('hrd-ops'); await go('hrd-task?id=TSK-0003&tab=discussion');
  await p.fill('form[data-submit="hr:task-comment"] textarea', 'Draf kontrak sudah dikirim ke legal (sintetis)'); await p.click('form[data-submit="hr:task-comment"] button'); await p.waitForTimeout(150);
  ok('Diskusi tersimpan dengan penulis & waktu', /Draf kontrak sudah dikirim/.test(await text()) && /Ayu/.test(await text()));
  await go('hrd-task?id=TSK-0003&tab=files');
  await p.fill('form[data-submit="hr:task-asset"] input[name=name]', 'kontrak-draf.pdf'); await p.click('form[data-submit="hr:task-asset"] button'); await p.waitForTimeout(150);
  ok('Bukti ditambahkan', /kontrak-draf\.pdf \(sintetis\)/.test(await text()));
  await go('hrd-task?id=TSK-0003');
  await p.locator('form[data-submit="hr:task-move"] select').selectOption('Selesai'); await p.locator('form[data-submit="hr:task-move"] button').click(); await p.waitForTimeout(150);
  ok('Penutupan sebelum checklist lengkap ditolak', /checklist belum lengkap/.test(await status()));
  await go('hrd-task?id=TSK-0003&tab=checklist');
  for (const b of await p.locator('.hr-check button[aria-pressed="false"]').all()) { await p.locator('.hr-check button[aria-pressed="false"]').first().click(); await p.waitForTimeout(120); }
  await go('hrd-task?id=TSK-0003');
  await p.locator('form[data-submit="hr:task-move"] select').selectOption('Selesai'); await p.locator('form[data-submit="hr:task-move"] button').click(); await p.waitForTimeout(150);
  ok('Kartu wajib review tidak bisa langsung Selesai', /wajib direview/.test(await status()));
  await p.locator('form[data-submit="hr:task-move"] select').selectOption('Review'); await p.locator('form[data-submit="hr:task-move"] button').click(); await p.waitForTimeout(150);
  await setRole('hrd'); await go('hrd-task?id=TSK-0003');
  await p.fill('form[data-submit="hr:task-review"] input[name=note]', 'Tambahkan tanggal efektif'); await p.click('form[data-submit="hr:task-review"] button'); await p.waitForTimeout(150);
  ok('Reviewer meminta revisi → Dikerjakan dengan catatan', /Dikerjakan/.test(await text()));
  await setRole('hrd-ops'); await go('hrd-task?id=TSK-0003');
  await p.locator('form[data-submit="hr:task-move"] select').selectOption('Review'); await p.locator('form[data-submit="hr:task-move"] button').click(); await p.waitForTimeout(150);
  await setRole('hrd'); await go('hrd-task?id=TSK-0003'); await shot('F3-NV08-review');
  await p.click('button[data-action="hr:task-review"][data-decision="accept"]'); await p.waitForTimeout(150);
  await go('hrd-board');
  ok('NV02 Board: TSK-0003 di kolom Selesai setelah review', (await p.locator('.hr-col[data-stage="Selesai"] [data-task="TSK-0003"]').count()) === 1);
  await go('hrd-list?stage=Selesai');
  ok('Board dan List menampilkan hasil yang sama', /TSK-0003/.test(await text()));

  /* Jalur 4: konflik, filter kosong, akses lintas workplace, sumber */
  await go('hrd-task?id=TSK-0005');
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('hawk-integrated-demo-v1')); s.hr.f3.tasks.find(t => t.id === 'TSK-0005').version += 1; localStorage.setItem('hawk-integrated-demo-v1', JSON.stringify(s)); });
  await p.evaluate(() => { HL.state; });
  await p.reload(); await p.waitForTimeout(150);
  const vForm = await p.locator('form[data-submit="hr:task-move"] [name=version]').inputValue();
  await p.evaluate((v) => HL.apply('hr:task-move', { id: 'TSK-0005', to: 'Review', version: String(Number(v) - 1) }), vForm); await p.waitForTimeout(150);
  ok('Konflik dua perubahan: pesan konflik & status terbaru dimuat', /Konflik/.test(await status()));
  await go('hrd-board?pic=EMP-0145&prio=Rendah');
  ok('Filter kosong → keadaan kosong dengan reset', (await p.locator('.hr-empty [data-action=filter-reset]').count()) === 1);
  await go('hrd-task?id=TSK-0001');
  await p.click('a:has-text("Jam treatment POS Spa Ubud")'); await p.waitForTimeout(150);
  ok('Klik sumber kartu membuka layar asal', p.url().includes('hrd-home') && p.url().includes('OUT-UBD'));
  await setRole('hrd-ops'); await go('hrd-task?id=TSK-0103');
  ok('Staf HRD → kartu workplace HG = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await go('hrd-task?id=TSK-0007');
  ok('Staf HRD → kartu bersumber payroll = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await go('hrd-tasks');
  ok('Staf HRD hanya punya tab HRD Operations', (await p.locator('.tabs .tab').allInnerTexts()).join() === 'HRD Operations');
  await setRole('finance-manager'); await go('hrd-board');
  ok('Finance Manager → Board = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await setRole('hrd');

  /* Mobile 390 px */
  await p.setViewportSize({ width: 390, height: 844 });
  for (const r of ['hrd-tasks', 'hrd-board', 'hrd-myday', 'hrd-task?id=TSK-0001', 'hrd-calendar']) {
    await go(r); const w = await p.evaluate(() => document.documentElement.scrollWidth);
    ok(`Mobile 390 px tanpa scroll horizontal halaman: ${r}`, w <= 392, String(w)); await shot('F3-mobile-' + r.split(/[?&=]/).join('-'));
  }
  await go('hrd-board');
  await p.locator('[data-task="TSK-0002"] select[name=to]').selectOption('Issue'); await p.locator('[data-task="TSK-0002"] .hr-move button').click(); await p.waitForTimeout(200);
  ok('Mobile: pindah kartu lewat menu', (await p.locator('.hr-col[data-stage="Issue"] [data-task="TSK-0002"]').count()) === 1);
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-f3-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
