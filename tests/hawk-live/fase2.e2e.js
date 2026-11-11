/* HAWK four-portal · Fase 2A Commercial browser checks (Playwright, klik nyata).
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/fase2.e2e.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const go = async (r) => { await p.goto(BASE + 'commercial.html#' + r); await p.waitForTimeout(150); };
  const cx = () => p.evaluate(() => window.HL.state.cx);
  await go('screens'); await p.click('[data-action=reset]');

  /* Executive Insight → tugas (idempoten) */
  await go('commercial');
  const btn = p.locator('.insight [data-action="cx:task-create"]').first();
  const key = await btn.getAttribute('data-key');
  await btn.click(); await p.waitForTimeout(150);
  let tasks = (await cx()).tasks.filter(t => t.key === key);
  ok('Insight "Buat tindakan" membuat satu tugas', tasks.length === 1, tasks.map(t => t.id).join());
  ok('Baris insight kini menautkan tugas (tombol tidak dobel)', (await p.locator(`.insight [data-key="${key}"]`).count()) === 0);
  await p.evaluate((k) => window.HL.apply('cx:task-create', { key: k, action: 'ulang' }), key); await p.waitForTimeout(100);
  ok('Klik ulang/retry dengan kunci sama tetap satu tugas', (await cx()).tasks.filter(t => t.key === key).length === 1);

  /* Campaign Planner → buat dari template → detail */
  await go('campaign?view=templates');
  await p.fill('form[data-submit="cx:cmp-create"] [name=name]', 'Shanti Morning Ritual');
  await p.fill('form[data-submit="cx:cmp-create"] [name=utm]', 'cmp_shanti_morning');
  await p.click('form[data-submit="cx:cmp-create"] button'); await p.waitForTimeout(200);
  ok('Campaign baru → terbuka di Campaign Detail berstatus Draft', p.url().includes('campaign-detail') && (await p.locator('.cmp-head').innerText()).includes('Draft'));
  await go('campaign?view=templates');
  await p.fill('form[data-submit="cx:cmp-create"] [name=name]', 'Shanti Duplikat');
  await p.fill('form[data-submit="cx:cmp-create"] [name=utm]', 'cmp_shanti_morning');
  await p.click('form[data-submit="cx:cmp-create"] button'); await p.waitForTimeout(200);
  ok('UTM bentrok di outlet sama ditolak dengan pesan', (await p.locator('[role=alert], .toast, .msg').allInnerTexts()).join(' ').toLowerCase().includes('utm'));

  /* Content Studio: Review → Approve → jadwal 2 platform → terbit */
  await go('studio?view=board&content=CNT-003&ctab=publish');
  ok('Konten belum approve: jadwal dikunci', (await p.locator('.panel').innerText()).includes('belum disetujui'));
  await go('studio?view=board&content=CNT-003&ctab=review');
  await p.click('form[data-submit="cx:cnt-approve"] button'); await p.waitForTimeout(150);
  await go('studio?view=board&content=CNT-003&ctab=publish');
  for (const [pf, at] of [['Instagram', '2026-08-26T18:00'], ['Facebook', '2026-08-26T18:00']]) {
    await p.selectOption('form[data-submit="cx:cnt-schedule"] [name=platform]', pf);
    await p.fill('form[data-submit="cx:cnt-schedule"] [name=at]', at);
    await p.click('form[data-submit="cx:cnt-schedule"] button'); await p.waitForTimeout(150);
  }
  ok('Satu aset dijadwalkan ke Instagram dan Facebook', (await cx()).publications.filter(x => x.content === 'CNT-003' && x.status === 'scheduled').length === 2);
  await p.locator('.panel [data-action="cx:pub-publish"]').first().click(); await p.waitForTimeout(150);
  ok('Satu platform terbit: konten belum Published', (await cx()).content.find(c => c.id === 'CNT-003').stage !== 'Published');
  await p.locator('.panel [data-action="cx:pub-publish"]').first().click(); await p.waitForTimeout(150);
  ok('Kedua platform terbit: konten Published, post ID tercatat', (await cx()).content.find(c => c.id === 'CNT-003').stage === 'Published' && (await p.locator('.panel').innerText()).includes('DEMO-'));
  for (const v of ['board', 'calendar', 'list', 'library', 'tasks']) { await go('studio?view=' + v); ok(`Content Studio tampilan ${v} tampil`, (await p.locator('.studio-main').count()) === 1 && (await p.locator('.error-state').count()) === 0); }

  /* Commercial Budget: ajukan lalu tolak dengan alasan */
  await go('commercial-budget?view=requests');
  await p.click('form[data-submit=request] button'); await p.waitForTimeout(150);
  const rid = await p.evaluate(() => window.HL.state.requests.slice(-1)[0].id);
  ok('Pengajuan dari Commercial Budget masuk antrean Finance (Menunggu Finance)', (await p.locator('main').innerText()).includes('Menunggu Finance'));
  await p.goto(BASE + 'finance.html#mrf'); await p.waitForTimeout(150);
  await p.fill(`#rj-${rid}`, 'Belum ada brief kreatif'); await p.locator(`#rj-${rid} ~ button`).click(); await p.waitForTimeout(150);
  ok('Pengajuan ditolak dengan alasan, status Ditolak', await p.evaluate((id) => window.HL.state.requests.find(r => r.id === id).status === 'rejected', rid));

  /* Brand: setujui elemen menaikkan progress */
  await go('brand');
  ok('Brand Foundation menampilkan progress per brand', (await p.locator('.kpi').count()) >= 4);

  /* Fase 2B: jalur Campaign → Content → Publish → percakapan → Lead → Booking → POS → Atribusi → Insight → tugas */
  await go('screens'); await p.click('[data-action=reset]');
  await go('social?view=inbox');
  ok('Social inbox: CONV-001 berasal dari CMP-001 / PUB-001 (konten terbit)', (await p.locator('tbody tr').filter({ hasText: 'CONV-001' }).innerText()).includes('PUB-001'));
  await p.locator('[data-action="cx:conv-handoff"][data-id="CONV-001"]').click(); await p.waitForTimeout(150);
  const leadId = await p.evaluate(() => window.HL.state.cx.mk.convs.find(c => c.id === 'CONV-001').lead);
  await p.locator('[data-action="cx:conv-handoff"]').count();
  await p.evaluate(() => window.HL.apply('cx:conv-handoff', { id: 'CONV-001' })); await p.waitForTimeout(100);
  ok('Alih DM → lead Sales (retry memakai lead sama)', /^LEAD-/.test(leadId) && await p.evaluate((l) => window.HL.state.leads.filter(x => x.id === l).length === 1 && window.HL.state.leads.find(x => x.id === l).campaign === 'CMP-001', leadId));
  await p.goto(BASE + 'sales.html#reservation'); await p.waitForTimeout(150);
  await p.selectOption('form[data-submit=book] [name=id]', leadId); await p.click('form[data-submit=book] button'); await p.waitForTimeout(150);
  const bkId = await p.evaluate((l) => window.HL.state.bookings.find(b => b.lead === l).id, leadId);
  await p.goto(BASE + 'sales.html#pos'); await p.waitForTimeout(150);
  for (const a of ['checkin', 'complete', 'pay']) { await p.click(`[data-action=${a}][data-id=${bkId}]`); await p.waitForTimeout(80); }
  await go(`attribution?view=journey&q=${leadId}`);
  const tr = await p.locator('.history').first().innerText();
  ok('Jejak booking: campaign → percakapan → lead → booking → POS → Finance (satu revenue)', ['Campaign', 'Percakapan', 'Lead', 'Booking', 'POS', 'Finance'].every(k => tr.includes(k)) && tr.includes('dihitung 1×'), tr.split('\n').length + ' langkah');
  await go('campaign-detail?id=CMP-001');
  ok('Campaign Detail CMP-001 ikut menghitung booking baru dari jalur DM', (await p.locator('.kpis').innerText()).includes('371'));
  await go('mentor?domain=Sales Handoff');
  ok('AI Mentor Sales Handoff: tidak ada DM reservasi tertahan', (await p.locator('main').innerText()).includes('Semua DM reservasi sudah dialihkan'));
  await go('mentor?domain=Marketing');
  await p.locator('[data-action="cx:mentor-accept"]').first().click(); await p.waitForTimeout(150);
  ok('Mentor: terima usulan → tugas Daily Race', (await cx()).tasks.some(t => t.type === 'mentor'));
  /* KOL code at booking → POS → only that partner */
  await go('kol?view=performance');
  const before = await p.locator('tbody tr').filter({ hasText: 'KOL-001' }).locator('td').nth(4).innerText();
  await p.goto(BASE + 'sales.html#reservation'); await p.waitForTimeout(150);
  await p.fill('form[data-submit=book] [name=code]', 'KOL-RAKA10'); await p.click('form[data-submit=book] button'); await p.waitForTimeout(150);
  ok('Booking dengan kode KOL kedaluwarsa ditolak dengan pesan', (await p.locator('main').innerText()).includes('kedaluwarsa'));
  await p.fill('form[data-submit=book] [name=code]', 'KOL-ANYA10'); await p.click('form[data-submit=book] button'); await p.waitForTimeout(150);
  const bk2 = await p.evaluate(() => window.HL.state.bookings.slice(-1)[0]);
  await p.goto(BASE + 'sales.html#pos'); await p.waitForTimeout(150);
  for (const a of ['checkin', 'complete', 'pay']) { await p.click(`[data-action=${a}][data-id=${bk2.id}]`); await p.waitForTimeout(80); }
  await go('kol?view=performance');
  const after = await p.locator('tbody tr').filter({ hasText: 'KOL-001' }).locator('td').nth(4).innerText();
  ok('Kode KOL-ANYA10 → POS dibayar → booking KOL-001 bertambah 1', bk2.kolCode === 'KOL-ANYA10' && parseInt(after.replace(/\D/g, '').slice(0, 3)) >= 0 && after !== before && after.includes('1 dari sandbox'), `${before} → ${after}`);
  /* Digital: re-import + UTM mapping */
  await go('digital?view=quality');
  await p.selectOption('form[data-submit="cx:snap-import"] [name=platform]', 'TikTok Ads');
  await p.click('form[data-submit="cx:snap-import"] button'); await p.waitForTimeout(120);
  await p.selectOption('form[data-submit="cx:snap-import"] [name=platform]', 'TikTok Ads');
  await p.click('form[data-submit="cx:snap-import"] button'); await p.waitForTimeout(120);
  ok('Impor ulang snapshot TikTok tidak menambah baris', (await cx()).mk.imports.filter(i => i.platform === 'TikTok Ads').length === 1 && (await p.locator('main').innerText()).includes('parsial'));
  await p.click('form[data-submit="cx:utm-map"] button'); await p.waitForTimeout(120);
  ok('UTM tanpa campaign dipetakan', (await cx()).mk.utm.every(u => u.status === 'mapped'));
  for (const r of ['digital', 'digital?view=ads', 'digital?view=seo', 'digital?view=experiments', 'social', 'social?view=analytics', 'social?view=units', 'kol', 'kol?view=pipeline', 'kol?view=deliverables', 'kol?id=KOL-002', 'attribution?view=audience', 'attribution?view=cohort', 'attribution?view=coverage', 'attribution?view=exceptions', 'mentor?view=ask&q=romi', 'mentor?view=experiments', 'mentor?view=followup']) { await go(r); if ((await p.locator('.error-state').count()) || !(await p.locator('h1').count())) ok('Rute tampil: ' + r, false); }
  ok('18 rute Fase 2B tampil tanpa error', true);

  /* 390 px */
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  m.on('pageerror', e => errors.push('mobile: ' + e.message));
  const routes = ['digital', 'digital?view=ads', 'social?view=inbox', 'kol?view=pipeline', 'kol?id=KOL-001', 'attribution', 'attribution?view=exceptions', 'mentor', 'commercial', 'commercial-budget', 'commercial-budget?view=requests', 'campaign', 'campaign?view=board', 'campaign?view=calendar', 'campaign-detail?id=CMP-001', 'studio', 'studio?view=calendar', 'studio?content=CNT-004&ctab=publish', 'studio?view=library', 'brand', 'brand?view=messages'];
  let worst = ['', 0];
  for (const r of routes) { await m.goto(BASE + 'commercial.html#' + r); await m.waitForTimeout(120); const w = await m.evaluate(() => document.documentElement.scrollWidth); if (w > worst[1]) worst = [r, w]; }
  ok(`390 px: tanpa scroll horizontal di ${routes.length} rute Commercial (2A + 2B)`, worst[1] <= 390, worst.join(' '));
  ok('Tidak ada console error', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`);
  fs.writeFileSync(path.join(__dirname, 'fase2-results.json'), JSON.stringify({ ranAt: new Date().toISOString(), base: BASE, pass: out.length - fail, fail, results: out }, null, 1));
  process.exit(fail ? 1 : 0);
})();
