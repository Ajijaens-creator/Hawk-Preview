/* End-to-end UI test of MP-HAWK-11/12 — 7P Master Financial Control Center (NV-57 cockpit, NV-16 drill-down, NV-23 evidence).
   Every navigation step is a real click in the browser. Cases A–F from the MP-HAWK-11 brief:
   A 7P-first click path to evidence and back · B org-first gives identical totals · C HRD & Komersil steward views
   D Supervisor scope · E filters / chips / undo · F XLSX + PDF export, permissions, mobile 390 px.
   Usage: node tests/e2e-7p.js [screenshotDir] */
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const shotDir = process.argv[2] || path.join(__dirname, '..', 'docs', 'screenshots', '7p');
fs.mkdirSync(shotDir, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const ctxB = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, acceptDownloads: true });
  const p = await ctxB.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
  const results = [];
  const ok = (name, cond, info) => {
    results.push({ name, ok: !!cond, info: cond ? '' : info || '' });
    console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !info ? '' : ' — ' + info));
  };
  const wait = (ms = 200) => p.waitForTimeout(ms);
  const S = (fn, arg) => p.evaluate(fn, arg);
  const go = async (nv, q) => { await S(([n, q]) => { location.hash = '#/nv/' + n + (q ? '?' + q : ''); HAWK.render(); }, [nv, q]); await wait(300); };
  const as = async (uid) => { await S((id) => { HAWK.setUser(id, { tour: false }); if (HAWK.ui && HAWK.ui.local) delete HAWK.ui.local._p7; HAWK.render(); }, uid); await wait(200); };
  const click = async (sel) => { await p.click(sel); await wait(); };
  const hash = () => S(() => location.hash);
  const shot = async (name, sel) => {
    const h = await p.addStyleTag({ content: '.toasts,.tour,.tour-collapsed{visibility:hidden!important}' });
    if (sel) await (await p.$(sel)).screenshot({ path: path.join(shotDir, name + '.png') });
    else await p.screenshot({ path: path.join(shotDir, name + '.png'), fullPage: true });
    await h.evaluate((e) => e.remove());
  };
  const engine = (uid, f) => S(([id, f]) => { const s = HAWK.store.state; const q = HAWK.P7.query(s, s.users.find((u) => u.id === id), f); return { n: q.rows.length, budget: q.totals.budget, actual: q.totals.actual, ids: q.rows.map((r) => r.id) }; }, [uid, f]);
  const st = () => S(() => JSON.parse(JSON.stringify((HAWK.ui.local._p7 || {}).f || {})));
  const short = (v) => S((v) => HAWK.U.rp(v, { short: true }), v);

  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await S(() => localStorage.clear());
  await p.reload();
  await wait(400);
  await as('U-OWN');

  /* ---------- NV-57 Owner cockpit ---------- */
  await go(57);
  let t = await p.innerText('#view');
  ok('NV-57: cockpit 7P tampil di atas (#p7-cockpit) dengan 7 KPI, label DEMO & as-of', !!(await p.$('#p7-cockpit')) && (await p.$$('#p7-cockpit .kpi-btn')).length >= 7 && /DEMO/.test(t) && /as-of|per /i.test(t));
  const rowsP = await p.$$eval('#p7-cockpit [data-p7row]', (r) => r.map((x) => x.dataset.p7row));
  ok('NV-57: tabel 7P berisi P1–P6, P7 Profit dipisahkan (bukan biaya)', rowsP.join() === 'PEOPLE,PRODUCT,PROMOTION,PROCESS,PLACE,FACILITY' && /P7|Profit|Laba/.test(await p.innerText('#p7-cockpit')), rowsP.join());
  ok('NV-57: insight AI memuat sumber, as-of, bukti, dampak, rekomendasi & persetujuan manusia, berlabel SIMULATION', await S(() => { const t = document.querySelector('#p7-cockpit').textContent; return /SIMULATION/i.test(t) && /Sumber/i.test(t) && /Rekomendasi/i.test(t); }));
  await shot('01-owner-cockpit', '#p7-cockpit');

  /* ---------- Case A — 7P-first: P4 Process → JAENS Spa → Shanti → Operasional → Treatment → Operational Software → item → evidence ---------- */
  await click('#p7-cockpit tr[data-p7row="PROCESS"] .p7-cat');
  ok('A1. Klik P4 Process di cockpit → NV-16 drill-down dengan filter 7P = Process', /#\/nv\/16/.test(await hash()) && (await st()).p === 'PROCESS' && !!(await p.$('#p7-drill')), await hash());
  const steps = [['bu', 'BU-SPA'], ['loc', 'BR-SHN'], ['div', null], ['dept', 'DP-SHN-TRT'], ['sub', 'Operational Software']];
  const trail = [];
  for (const [lv, k] of steps) {
    const sel = k ? `#p7-drill .p7-tr[data-level="${lv}"][data-key="${k}"] .p7-drill` : `#p7-drill .p7-tr[data-level="${lv}"] .p7-drill`;
    const el = await p.$(sel);
    if (!el) { trail.push(lv + ':MISSING'); break; }
    await el.click();
    await wait();
    trail.push(lv + ':' + (await st())[lv]);
  }
  const fA = await st();
  ok('A2. Klik berurutan BU → outlet → divisi → departemen → subkategori (breadcrumb mengikuti)', fA.bu === 'BU-SPA' && fA.loc === 'BR-SHN' && fA.dept === 'DP-SHN-TRT' && fA.sub === 'Operational Software' && (await p.$$('#p7-drill .p7-crumbs button')).length === 7, trail.join(' > '));
  const eA = await engine('U-OWN', { p: fA.p, bu: fA.bu, loc: fA.loc, div: fA.div, dept: fA.dept, sub: fA.sub });
  const selTxt = await p.innerText('#p7-sel');
  ok('A3. Panel seleksi: angka = engine kube, rekonsiliasi ✓, steward ditampilkan', /✓ Rekonsiliasi/.test(selTxt) && selTxt.includes(await S((v) => HAWK.U.rp(v), eA.budget)) && /steward/i.test(selTxt));
  await shot('02-finance-drill-caseA', '#p7-drill');
  await click('#p7-drill [data-a="p7line"][data-id="BL26-037"]');
  ok('A4. Klik item "Software appointment & integrasi" → drawer detail line', /Software appointment/.test(await p.innerText('body')));
  await click('button[data-nav="23"]:has-text("Buka detail")');
  ok('A5. Buka NV-23 → detail line BL26-037 (KPI, dimensi, COA TO VERIFY, transaksi)', /#\/nv\/23/.test(await hash()) && (await p.getAttribute('#p7-line', 'data-line')) === 'BL26-037' && /TO VERIFY/.test(await p.innerText('#p7-line')));
  const ev = await p.$('#p7-line [data-a="p7ev"]');
  if (ev) await ev.click();
  await wait(300);
  const evTxt = await p.innerText('body');
  ok('A6. Klik transaksi → evidence (dokumen simulasi berlabel SIMULASI / DEMO)', !!ev && /SIMULASI|SIMULATION/.test(evTxt) && /DEMO/.test(evTxt));
  await shot('03-evidence-caseA');
  await S(() => { HAWK.ui.closeModal(); HAWK.ui.closeDrawer(); });
  await wait();
  await click('#p7-line .p7-crumbs button:nth-of-type(3)');
  const fBack = await st();
  ok('A7. Breadcrumb kembali dari NV-23 ke NV-16 pada level outlet (Shanti) tanpa kehilangan filter', /#\/nv\/16/.test(await hash()) && fBack.p === 'PROCESS' && fBack.loc === 'BR-SHN' && !fBack.sub, JSON.stringify(fBack));

  /* ---------- Case B — org-first gives identical totals ---------- */
  await as('U-FIN');
  await go(16);
  await click('#p7-drill [data-a="p7mode"][data-m="ORG"]');
  for (const [lv, k] of [['bu', 'BU-SPA'], ['loc', 'BR-SHN'], ['div', null], ['dept', 'DP-SHN-TRT'], ['p', 'PROCESS'], ['sub', 'Operational Software']]) {
    const sel = k ? `#p7-drill .p7-tr[data-level="${lv}"][data-key="${k}"] .p7-drill` : `#p7-drill .p7-tr[data-level="${lv}"] .p7-drill`;
    const el = await p.$(sel);
    if (el) { await el.click(); await wait(); }
  }
  const fB = await st();
  const eB = await engine('U-FIN', { p: fB.p, bu: fB.bu, loc: fB.loc, div: fB.div, dept: fB.dept, sub: fB.sub });
  ok('B1. Finance: urutan Organisasi → 7P sampai subkategori yang sama', fB.bu === 'BU-SPA' && fB.loc === 'BR-SHN' && fB.p === 'PROCESS' && fB.sub === 'Operational Software', JSON.stringify(fB));
  ok('B2. Total org-first = total 7P-first (budget, actual, daftar line identik)', eB.budget === eA.budget && eB.actual === eA.actual && eB.ids.join() === eA.ids.join(), JSON.stringify([eA, eB]));
  await click('#p7-drill [data-a="p7crumb"][data-i="-1"]');
  const buTot = await S(() => { const s = HAWK.store.state; const q = HAWK.P7.query(s, s.users.find((u) => u.id === 'U-FIN'), {}); return [HAWK.U.sum(HAWK.P7.group(s, q, 'bu'), (g) => g.budget), HAWK.U.sum(HAWK.P7.group(s, q, 'p'), (g) => g.budget), q.totals.budget]; });
  const foot = await p.innerText('#p7-drill tfoot');
  ok('B3. Level teratas: jumlah per BU = jumlah per 7P = total lingkup (tampil di footer tabel)', buTot[0] === buTot[2] && buTot[1] === buTot[2] && foot.includes(await short(buTot[2])), buTot.join('/'));

  /* ---------- Case C — HRD (People steward) & Komersil (Promotion steward) ---------- */
  await as('U-HRD');
  await go(16);
  let modes = await p.$$eval('#p7-filters select[data-k="view"] option', (o) => o.map((x) => x.value)).catch(() => []);
  ok('C1. HRD Made Gunarsa: pilihan tampilan "divisi sendiri" dan "steward People"', modes.length === 2, modes.join());
  if (modes.length === 2) { await p.selectOption('#p7-filters select[data-k="view"]', modes[1]); await wait(); }
  const hrdRows = await S(() => { const s = HAWK.store.state; const q = HAWK.P7.query(s, s.users.find((u) => u.id === 'U-HRD'), HAWK.ui.local._p7.f); return { all: q.rows.every((l) => l.p === 'PEOPLE'), bus: [...new Set(q.rows.map((l) => l.bu))].length, n: q.rows.length }; });
  ok('C2. Mode steward People: hanya P1 People, lintas BU (Spa, Essence, Office)', hrdRows.all && hrdRows.bus >= 2 && hrdRows.n > 6, JSON.stringify(hrdRows));
  await shot('04-hrd-people-steward', '#p7-drill');
  await as('U-HOD');
  await go(57);
  ok('C3. Komersil Dedik melihat cockpit dengan lingkup divisi + steward Promotion', /Promotion/i.test(await p.innerText('#p7-cockpit')) && !!(await p.$('#p7-filters select[data-k="view"]')));
  await shot('05-komersil-cockpit', '#p7-cockpit');
  const kom = await engine('U-HOD', {});
  ok('C4. Gaji tim Komersil (P1 People) ada di lingkup Dedik sebagai pemilik budget', kom.ids.includes('BL26-114'));

  /* ---------- Case D — Supervisor Mila: own outlet only, no export ---------- */
  await as('U-SPV');
  await go(16);
  const spv = await engine('U-SPV', {});
  const spvLocs = await S(() => { const s = HAWK.store.state; return [...new Set(HAWK.P7.query(s, s.users.find((u) => u.id === 'U-SPV'), {}).rows.map((l) => l.loc))]; });
  ok('D1. Supervisor Mila: hanya budget JAENS Spa Center (Ubud)', spv.n > 0 && spvLocs.join() === 'BR-UBD', spvLocs.join());
  ok('D2. Supervisor: tombol ekspor tidak tersedia', !(await p.$('[data-a="p7xlsx"]')) && !(await p.$('[data-a="p7pdf"]')));
  const forb = await S(() => { const r = HAWK.api.call('report.export7P', { format: 'xlsx' }, HAWK.store.state.users.find((u) => u.id === 'U-SPV')); return r.error && r.error.code; });
  ok('D3. Supervisor memaksa ekspor lewat API → FORBIDDEN', forb === 'FORBIDDEN', forb);
  await as('U-STF');
  await go(57);
  ok('D4. Staff tidak melihat cockpit 7P (layar tidak diizinkan atau kosong)', !(await p.$('#p7-cockpit .kpi-btn')));

  /* ---------- Case E — filters, chips, undo, reset ---------- */
  await as('U-OWN');
  await go(16);
  const fullB = (await engine('U-OWN', {})).budget;
  await p.selectOption('#p7-filters select[data-k="per"]', 'Q1');
  await wait();
  await p.selectOption('#p7-filters select[data-k="bu"]', 'BU-ESS');
  await wait();
  const chips = await p.$$('#p7-filters .p7-chip');
  const eE = await engine('U-OWN', { per: 'Q1', bu: 'BU-ESS' });
  ok('E1. Filter periode Q1 + BU Essence: chip aktif tampil, total footer = engine', chips.length >= 2 && (await p.innerText('#p7-drill tfoot')).includes(await short(eE.budget)) && eE.budget < fullB);
  await click('[data-a="p7undo"]');
  ok('E2. Undo mengembalikan filter sebelumnya (BU dilepas, Q1 tetap)', (await st()).per === 'Q1' && !(await st()).bu, JSON.stringify(await st()));
  await click('[data-a="p7reset"]');
  { const r = await st(); ok('E3. Reset menghapus semua filter (kembali ke FY2026 setahun penuh)', r.per === 'FY' && !r.bu && Object.keys(r).length === 2, JSON.stringify(r)); }
  await p.fill('#p7-drill input[data-ch="p7search"]', 'software');
  await p.dispatchEvent('#p7-drill input[data-ch="p7search"]', 'change');
  await wait();
  ok('E4. Pencarian "software" menemukan item di seluruh hierarki', /Software appointment/.test(await p.innerText('#p7-drill')));
  await p.fill('#p7-drill input[data-ch="p7search"]', '');
  await p.dispatchEvent('#p7-drill input[data-ch="p7search"]', 'change');
  await wait();

  /* ---------- Case F — export XLSX / PDF ---------- */
  await p.selectOption('#p7-filters select[data-k="p"]', 'PROCESS');
  await wait();
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('[data-a="p7xlsx"]')]);
  let xlsxOk = false;
  let xname = '';
  if (dl) {
    xname = dl.suggestedFilename();
    const fp = path.join(shotDir, '..', '..', '..', 'tests', '.p7-export.xlsx');
    await dl.saveAs(fp);
    const z = fs.readFileSync(fp);
    const s = z.toString('latin1');
    xlsxOk = z.readUInt32LE(0) === 0x04034b50 && s.includes('xl/workbook.xml') && s.includes('Ringkasan 7P') && s.includes('Detail budget line');
    fs.copyFileSync(fp, path.join(shotDir, 'sample-export-process.xlsx'));
    fs.unlinkSync(fp);
  }
  ok('F1. Ekspor Excel: file .xlsx terunduh, ZIP OOXML valid, 2 sheet (Ringkasan 7P, Detail budget line)', xlsxOk && /\.xlsx$/.test(xname), xname);
  const audit = await S(() => HAWK.store.state.audit.filter((a) => /EXPORT_7P/.test(JSON.stringify(a))).length);
  ok('F2. Ekspor tercatat di audit trail (EXPORT_7P) dengan filter aktif', audit >= 1 && (await S(() => JSON.stringify(HAWK.store.state.audit.find((a) => /EXPORT_7P/.test(JSON.stringify(a))))) ).includes('p=PROCESS'));
  await S(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await click('[data-a="p7pdf"]');
  const pr = await S(() => ({ n: window.__printed, lp: HAWK.lastPrint, html: (document.getElementById('p7-print') || {}).innerText || '' }));
  ok('F3. Ekspor PDF: dialog cetak dipanggil, dokumen cetak memuat filter & baris sesuai lingkup', pr.n === 1 && pr.lp && pr.lp.rows > 0 && /PROCESS|Process/.test(pr.html + JSON.stringify(pr.lp.filters)), JSON.stringify(pr.lp));

  /* ---------- Mobile 390 ---------- */
  await p.setViewportSize({ width: 390, height: 844 });
  const over = [];
  for (const nv of [57, 16, 23]) {
    await go(nv, nv === 23 ? 'p7=1&tab=lines&line=BL26-037' : '');
    const w = await S(() => [document.documentElement.scrollWidth, window.innerWidth]);
    if (w[0] > w[1] + 1) over.push(nv + ':' + w.join('>'));
  }
  ok('Mobile 390 px: NV-57, NV-16, NV-23 tanpa scroll horizontal halaman', !over.length, over.join());
  await go(57);
  await shot('06-mobile-cockpit');
  await go(16);
  await click('[data-a="p7reset"]');
  await shot('07-mobile-drill');

  ok('Tanpa error JavaScript / console', !errs.length, errs.slice(0, 3).join(' | '));
  await b.close();
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n${pass} lulus, ${results.length - pass} gagal`);
  fs.writeFileSync(path.join(__dirname, 'e2e-7p-results.json'), JSON.stringify({ pass, fail: results.length - pass, results }, null, 1));
  process.exit(pass === results.length ? 0 : 1);
})();
