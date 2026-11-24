/* HAWK Commercial · NP-HAWK-COM-SM-002 Export Excel & PDF di F2-06 Social Media (Playwright, klik nyata)
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/social-export.e2e.js
   DATA DEMO / SIMULASI · tanggal acuan demo 2026-08-22 (WITA) */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
function unzip(buf) {
  const files = {}; let i = 0;
  while (buf.readUInt32LE(i) === 0x04034b50) {
    const size = buf.readUInt32LE(i + 18), nl = buf.readUInt16LE(i + 26), xl = buf.readUInt16LE(i + 28);
    const name = buf.slice(i + 30, i + 30 + nl).toString('utf8'), start = i + 30 + nl + xl;
    files[name] = buf.slice(start, start + size).toString('utf8'); i = start + size;
  }
  return files;
}
const unx = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const col = (ref) => ref.replace(/\d+/g, '').split('').reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
const sheet = (xml) => [...xml.matchAll(/<row r="\d+">(.*?)<\/row>/g)].map(m => { const r = []; for (const c of m[1].matchAll(/<c r="([A-Z]+\d+)"[^>]*>(?:<v>([^<]*)<\/v>|<is><t xml:space="preserve">([\s\S]*?)<\/t><\/is>)<\/c>/g)) r[col(c[1])] = c[2] !== undefined ? Number(c[2]) : unx(c[3]); for (let k = 0; k < r.length; k++) if (r[k] === undefined) r[k] = ''; return r; });
const sheetNames = (z) => [...z['xl/workbook.xml'].matchAll(/<sheet name="([^"]+)"/g)].map(m => unx(m[1]));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'smx-'));
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replace(/-/g, '');
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 950 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::ERR_/.test(m.text())) errors.push(m.text()); });
  await p.addInitScript(() => { window.__prints = 0; window.print = () => { window.__prints++; window.__printHtml = document.getElementById('hl-print')?.innerHTML || ''; }; });
  const go = async (r) => { await p.goto(BASE + 'commercial.html#' + r); await p.waitForTimeout(200); };
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); };
  const status = () => p.locator('#view .status').first().innerText().catch(() => '');
  const xlsx = async () => {
    await p.waitForTimeout(850);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }), p.click('[data-sm-export=xlsx]')]);
    const f = path.join(tmp, dl.suggestedFilename()); await dl.saveAs(f);
    const z = unzip(fs.readFileSync(f)); const names = sheetNames(z);
    const sh = {}; names.forEach((n, i) => { sh[n] = sheet(z[`xl/worksheets/sheet${i + 1}.xml`]); });
    return { name: dl.suggestedFilename(), file: f, names, sh, z };
  };
  const pdf = async () => { await p.waitForTimeout(850); await p.evaluate(() => { window.__prints = 0; window.__printHtml = ''; }); await p.click('[data-sm-export=pdf]'); await p.waitForTimeout(750); return p.evaluate(() => ({ n: window.__prints, html: window.__printHtml, after: document.body.classList.contains('hl-printing') })); };
  const snap = () => p.evaluate(() => JSON.stringify([CX.ensure(HL.state).mk, CX.ensure(HL.state).publications, CX.ensure(HL.state).content]));
  const tableRows = (sel = '#view .tbl') => p.locator(sel).first().locator('tbody tr').evaluateAll(trs => trs.filter(t => !t.querySelector('.empty-cell')).map(t => [...t.children].map(td => td.innerText.trim())));
  await go('screens'); p.once('dialog', d => d.accept()); await p.click('[data-action=reset]'); await p.waitForTimeout(150);
  const s0 = await snap();

  /* T01 tombol di kanan atas header, semua tab */
  for (const v of ['calendar', 'inbox', 'analytics', 'units']) {
    await go('social?view=' + v);
    const inHead = await p.locator('.page-head .actions [data-sm-export]').count();
    const box = await p.locator('.page-head .actions').boundingBox(), h1 = await p.locator('.page-head h1').boundingBox();
    ok(`T01 ${v}: Export Excel & PDF di header, sejajar & kanan judul`, inHead === 2 && box && h1 && box.x > h1.x + h1.width && Math.abs(box.y - h1.y) < 30);
  }
  await shot('sm-header');
  await go('kol'); ok('T01 Layar lain tidak mendapat tombol header (KOL)', (await p.locator('.page-head .actions').count()) === 0);

  /* T02 Publishing Calendar default (Bulan Ini) */
  await go('social');
  let x = await xlsx();
  ok('T02 Calendar: nama file Social_Media_Publishing_Calendar_YYYYMMDD', x.name === `Social_Media_Publishing_Calendar_${today}.xlsx`, x.name);
  ok('T02 Calendar: satu workbook, sheet Ringkasan + Jadwal + Info', JSON.stringify(x.names) === JSON.stringify(['Ringkasan status', 'Jadwal publikasi', 'Info']), x.names.join('|'));
  const chips = await p.locator('.chips .status-chip').allInnerTexts();
  const sum = x.sh['Ringkasan status'].slice(1).map(r => `${r[0]} · ${r[1]}`);
  ok('T02 Ringkasan status = chip layar', JSON.stringify(sum) === JSON.stringify(chips), sum.join(' | '));
  const scr = await tableRows();
  const jad = x.sh['Jadwal publikasi'].slice(1).filter(r => /^\d{4}/.test(r[0]));
  ok('T02 Jadwal: jumlah baris = layar', jad.length === scr.length && scr.length === 3, `${jad.length}/${scr.length}`);
  ok('T02 Jadwal: waktu, akun, platform, status, post ID sama dengan layar', jad.every((r, i) => r[0] === scr[i][0] && r[1] === scr[i][1] && r[2] === scr[i][2] && r[5] === scr[i][4] && (r[6] || '—') === scr[i][5]));
  ok('T02 Header kolom Waktu (WITA)…Post ID', JSON.stringify(x.sh['Jadwal publikasi'][0]) === JSON.stringify(['Waktu (WITA)', 'Akun', 'Platform', 'ID konten', 'Konten', 'Status', 'Post ID']));
  ok('T02 Info: periode aktif, platform, grafik tidak tersedia, WITA', /Bulan Ini · 1 Agu 2026 – 22 Agu 2026/.test(JSON.stringify(x.sh.Info)) && /Semua platform/.test(JSON.stringify(x.sh.Info)) && /Tidak tersedia/.test(JSON.stringify(x.sh.Info)) && /WITA/.test(JSON.stringify(x.sh.Info)));
  let py = '';
  try { py = execFileSync('python3', ['-I', '-c', 'import sys,openpyxl;wb=openpyxl.load_workbook(sys.argv[1]);print(wb.sheetnames)', x.file]).toString().trim(); } catch (e) { py = 'ERR ' + e.message; }
  ok('T02 File .xlsx valid (openpyxl)', /Jadwal publikasi/.test(py), py);

  /* T03 Scheduled / Upcoming di luar rentang tetap ikut; Published mengikuti periode */
  await go('social?range=today'); x = await xlsx();
  const t3 = x.sh['Jadwal publikasi'].slice(1).filter(r => /^\d{4}/.test(r[0]));
  ok('T03 Hari Ini: 2 Scheduled tetap ada, Published 0', t3.length === 2 && t3.every(r => r[5] === 'Scheduled / Upcoming') && x.sh['Ringkasan status'][1][1] === 0);
  await go('social?range=today&platform=TikTok'); x = await xlsx();
  ok('T03 Filter platform TikTok → 1 jadwal (PUB-003)', x.sh['Jadwal publikasi'].slice(1).filter(r => /^\d{4}/.test(r[0])).length === 1 && /TikTok/.test(JSON.stringify(x.sh.Info)));

  /* T04 applied filter vs pilihan belum diterapkan */
  await go('social');
  await p.selectOption('#social-range [name=platform]', 'TikTok'); await p.selectOption('#social-range [name=range]', 'today'); await p.waitForTimeout(150);
  x = await xlsx();
  ok('T04 Pilihan belum diterapkan tidak memengaruhi export (masih Bulan Ini, semua platform, 3 baris)', x.sh['Jadwal publikasi'].slice(1).filter(r => /^\d{4}/.test(r[0])).length === 3 && /Bulan Ini/.test(JSON.stringify(x.sh.Info)) && /Semua platform/.test(JSON.stringify(x.sh.Info)));

  /* T05 Inbox */
  await go('social?view=inbox'); x = await xlsx();
  const ib = x.sh['Percakapan'].slice(1).filter(r => /^\d{4}/.test(r[0])), ibs = await tableRows();
  ok('T05 Inbox: nama file & sheet', x.name === `Social_Media_Inbox_Moderation_${today}.xlsx` && x.names[0] === 'Percakapan');
  ok('T05 Inbox: jumlah percakapan = layar (5)', ib.length === ibs.length && ib.length === 5);
  ok('T05 Inbox: Masuk, Dari, Pesan sama dengan layar', ib.every((r, i) => r[0] === ibs[i][0] && r[3] === ibs[i][2] && r[4] === ibs[i][3]));
  ok('T05 Inbox: status CONV-005 Disembunyikan', ib.find(r => r[4].startsWith('Promo follower'))[8] === 'Disembunyikan');
  const ixml = x.z['xl/worksheets/sheet1.xml'];
  ok('T05 Inbox: tidak ada field tersembunyi (ID CONV-, ACC-, utm)', !/CONV-0|ACC-0|utm/.test(ixml));
  await go('social?view=inbox&range=today&platform=Facebook');
  ok('T05 Inbox kosong → kedua tombol disabled', (await p.locator('[data-sm-export=xlsx]').isDisabled()) && (await p.locator('[data-sm-export=pdf]').isDisabled()));

  /* T06 Analytics */
  await go('social?view=analytics'); await shot('sm-analytics'); x = await xlsx();
  ok('T06 Analytics: sheet KPI platform, Top content, Publish vs aset, Info', JSON.stringify(x.names) === JSON.stringify(['KPI platform', 'Top content', 'Publish vs aset', 'Info']));
  const cards = await p.locator('.grid.g3 > section.card').evaluateAll(cs => cs.map(c => ({ h: c.querySelector('h2').childNodes[0].textContent.trim(), dd: [...c.querySelectorAll('dd')].map(d => d.innerText.trim()) })));
  const kp = x.sh['KPI platform'].slice(1).filter(r => ['Instagram', 'TikTok', 'Facebook'].includes(r[0]));
  const loc = (n) => n.toLocaleString('id-ID');
  ok('T06 KPI per platform = kartu layar (reach, interactions, followers, kunjungan, akun)', kp.length === cards.length && kp.every((r, i) => r[0] === cards[i].h && loc(r[2]) === cards[i].dd[0] && loc(r[3]) === cards[i].dd[1] && cards[i].dd[3].startsWith(loc(r[5])) && loc(r[7]) === cards[i].dd[4] && String(r[8]) === cards[i].dd[5]), JSON.stringify(kp.map(r => r.slice(0, 4))));
  ok('T06 ER (%) = interactions ÷ reach', kp.every(r => Math.abs(r[4] - Math.round(r[3] / r[2] * 10000) / 100) < 0.006));
  const tops = await tableRows('#view .grid.g2 .tbl');
  ok('T06 Top content = tabel layar', x.sh['Top content'].slice(1).filter(r => /^CNT/.test(r[0])).length === tops.length && tops.length > 0);
  const pdfA = await pdf();
  ok('T06 PDF Analytics: 3 bagian (KPI, Top content, Publish vs aset)', pdfA.n === 1 && (pdfA.html.match(/<section class="hl-print-sec">/g) || []).length === 3 && /Grafik/.test(pdfA.html) && /Tidak tersedia di tab ini/.test(pdfA.html));
  await go('social?view=analytics&range=custom&start=2026-07-20&end=2026-08-10');
  ok('T06 Analytics lintas bulan: tombol tetap aktif (Top content)', !(await p.locator('[data-sm-export=xlsx]').isDisabled()));
  x = await xlsx();
  ok('T06 Lintas bulan: tidak ada sheet KPI platform, catatan dijelaskan', !x.names.includes('KPI platform') && /melewati lebih dari satu bulan/.test(JSON.stringify(x.sh['Top content'])));

  /* T07 Unit Business Growth */
  await go('social?view=units'); x = await xlsx();
  const ur = x.sh['Pertumbuhan unit'].slice(1).filter(r => /^Jaens/.test(r[0])), us = await tableRows();
  ok('T07 Units: baris = layar, angka sama', ur.length === us.length && ur.length === 2 && ur.every((r, i) => r[0] === us[i][0] && String(r[1]) === us[i][1] && loc(r[2]) === us[i][2] && loc(r[4]) === us[i][4]), JSON.stringify(ur.map(r => r.slice(0, 5))));
  ok('T07 Units: nama file', x.name === `Social_Media_Unit_Business_Growth_${today}.xlsx`);
  await go('social?view=units&range=custom&start=2026-07-20&end=2026-08-10');
  ok('T07 Units lintas bulan → disabled', await p.locator('[data-sm-export=pdf]').isDisabled());
  await go('social?view=units&range=custom&start=2026-06-01&end=2026-06-30');
  ok('T07 Units tanpa data (Juni) → disabled', await p.locator('[data-sm-export=xlsx]').isDisabled());

  /* T08 PDF 4 tab */
  for (const [v, secs] of [['calendar', 2], ['inbox', 1], ['analytics', 3], ['units', 1]]) {
    await go('social?view=' + v); const r = await pdf();
    ok(`T08 PDF ${v}: dialog cetak, ${secs} bagian, judul, periode, thead`, r.n === 1 && (r.html.match(/<section class="hl-print-sec">/g) || []).length === secs && /Social Media/.test(r.html) && /Periode aktif/.test(r.html) && (v === 'calendar' || /<thead>/.test(r.html)) && !r.after);
  }
  await go('social'); const pc = await pdf();
  ok('T08 PDF Calendar: KPI ringkasan status + tabel jadwal', /hl-print-kpis/.test(pc.html) && /Scheduled \/ Upcoming/.test(pc.html) && (pc.html.match(/<tr>/g) || []).length === 4);

  /* T09 keamanan: formula & HTML */
  await p.evaluate(() => { const c = CX.ensure(HL.state).mk.convs[0]; c.from = '=HYPERLINK("http://x")'; c.text = '<img src=x onerror=alert(1)>@cmd'; });
  await go('social?view=inbox'); x = await xlsx();
  const r9 = x.sh['Percakapan'].find(r => String(r[3]).includes('HYPERLINK'));
  ok('T09 Excel: teks diawali = disimpan utuh sebagai teks bergaya quotePrefix', r9 && r9[3] === '=HYPERLINK("http://x")' && /quotePrefix="1"/.test(x.z['xl/styles.xml']) && /<c r="D\d+" t="inlineStr" s="2"><is><t xml:space="preserve">=HYPERLINK/.test(x.z['xl/worksheets/sheet1.xml']));
  ok('T09 Excel: handle @akun utuh tanpa apostrof', x.sh['Percakapan'].slice(1).some(r => r[2] === '@jaensspa'));
  ok('T09 Excel: tidak ada elemen formula', !/<f>/.test(x.z['xl/worksheets/sheet1.xml']));
  const r9p = await pdf();
  ok('T09 PDF: HTML di-escape', !/<img/i.test(r9p.html) && /&lt;img/.test(r9p.html));
  await go('screens'); p.once('dialog', d => d.accept()); await p.click('[data-action=reset]'); await p.waitForTimeout(150);

  /* T10 klik ganda → satu file */
  await go('social'); await p.waitForTimeout(850);
  let n = 0; const h = () => n++; p.on('download', h);
  await p.dblclick('[data-sm-export=xlsx]'); await p.waitForTimeout(1200); p.off('download', h);
  ok('T10 Klik ganda hanya menghasilkan 1 file', n === 1, String(n));

  /* T11 data tidak berubah & regresi */
  for (const v of ['calendar', 'inbox', 'analytics', 'units']) { await go('social?view=' + v); await xlsx(); await pdf(); }
  ok('T11 Ekspor tidak mengubah data demo', (await snap()) === s0);
  await go('social'); await p.selectOption('#social-range [name=range]', '7d'); await p.click('#social-range button[type=submit]'); await p.waitForTimeout(250);
  ok('T11 Terapkan masih bekerja', /range=7d/.test(decodeURIComponent(await p.evaluate(() => location.hash))));
  await p.click('#social-range [data-action=filter-reset]'); await p.waitForTimeout(250);
  ok('T11 Reset filter masih bekerja', !/range=7d/.test(decodeURIComponent(await p.evaluate(() => location.hash))));
  await go('social?view=inbox'); await p.click('[data-action="cx:conv-handoff"]'); await p.waitForTimeout(250);
  ok('T11 Alihkan ke Sales masih bekerja', /LEAD|Dialihkan/.test(await p.locator('#view').innerText()));
  x = await xlsx();
  ok('T11 Export mengikuti status terbaru (Dialihkan ke Sales + lead)', x.sh['Percakapan'].some(r => r[8] === 'Dialihkan ke Sales' && r[9]));
  await go('screens'); p.once('dialog', d => d.accept()); await p.click('[data-action=reset]'); await p.waitForTimeout(150);

  /* T12 mobile */
  await p.setViewportSize({ width: 390, height: 844 }); await go('social?view=analytics'); await shot('sm-mobile');
  const ow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok('T12 Mobile 390px: tombol terlihat, tanpa scroll horizontal', (await p.locator('[data-sm-export=xlsx]').isVisible()) && !ow);

  ok('T13 Tidak ada error konsol/JS', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'social-export-results.json'), JSON.stringify({ at: new Date().toISOString(), pass: out.length - fail, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
