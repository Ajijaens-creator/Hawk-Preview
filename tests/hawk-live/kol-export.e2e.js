/* HAWK Commercial · NP-COM-KOL-001 Export Excel & PDF di F2-07 Media Partner & KOL (Playwright, klik nyata)
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/kol-export.e2e.js
   DATA DEMO / SIMULASI · tanggal acuan demo 2026-08-22 */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
/* unzip (stored) + baca sheet → array baris */
function unzip(buf) {
  const files = {}; let i = 0;
  while (buf.readUInt32LE(i) === 0x04034b50) {
    const method = buf.readUInt16LE(i + 8), size = buf.readUInt32LE(i + 18), nl = buf.readUInt16LE(i + 26), xl = buf.readUInt16LE(i + 28);
    const name = buf.slice(i + 30, i + 30 + nl).toString('utf8'), start = i + 30 + nl + xl;
    if (method !== 0) throw new Error('compressed entry');
    files[name] = buf.slice(start, start + size).toString('utf8'); i = start + size;
  }
  return files;
}
const unx = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const col = (ref) => ref.replace(/\d+/g, '').split('').reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
function sheet(xml) {
  return [...xml.matchAll(/<row r="\d+">(.*?)<\/row>/g)].map(m => { const r = []; for (const c of m[1].matchAll(/<c r="([A-Z]+\d+)"[^>]*?(?: t="inlineStr")?[^>]*>(?:<v>([^<]*)<\/v>|<is><t xml:space="preserve">([\s\S]*?)<\/t><\/is>)<\/c>/g)) r[col(c[1])] = c[2] !== undefined ? Number(c[2]) : unx(c[3]); for (let k = 0; k < r.length; k++) if (r[k] === undefined) r[k] = ''; return r; });
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kolx-'));
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 950 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::ERR_/.test(m.text())) errors.push(m.text()); });
  await p.addInitScript(() => { window.__prints = 0; window.print = () => { window.__prints++; window.__printHtml = document.getElementById('hl-print')?.innerHTML || ''; window.__printClass = document.body.classList.contains('hl-printing'); }; });
  const go = async (r) => { await p.goto(BASE + 'commercial.html#' + r); await p.waitForTimeout(150); };
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); };
  const status = () => p.locator('#view .status').first().innerText().catch(() => '');
  const screenRows = () => p.locator('#view .tbl tbody tr').evaluateAll(trs => trs.filter(t => !t.querySelector('.empty-cell')).length);
  const xlsx = async () => {
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }), p.click('[data-kol-export=xlsx]')]);
    const f = path.join(tmp, dl.suggestedFilename()); await dl.saveAs(f);
    const z = unzip(fs.readFileSync(f)); return { name: dl.suggestedFilename(), file: f, rows: sheet(z['xl/worksheets/sheet1.xml']), info: sheet(z['xl/worksheets/sheet2.xml']), z };
  };
  const pdf = async () => { await p.evaluate(() => { window.__prints = 0; }); await p.click('[data-kol-export=pdf]'); await p.waitForTimeout(750); return p.evaluate(() => ({ n: window.__prints, html: window.__printHtml, cls: window.__printClass, after: document.body.classList.contains('hl-printing') })); };
  const snap = () => p.evaluate(() => JSON.stringify(HL.state.cx?.mk || CX.ensure(HL.state).mk));
  await go('screens'); p.once('dialog', d => d.accept()); await p.click('[data-action=reset]'); await p.waitForTimeout(150);

  /* T01 tombol di 4 tab, tidak di profil */
  for (const v of ['directory', 'pipeline', 'deliverables', 'performance']) {
    await go('kol?view=' + v);
    ok(`T01 Tab ${v}: tombol Export Excel & PDF`, (await p.locator(`[data-kol-export=xlsx][data-view=${v}]`).count()) === 1 && (await p.locator(`[data-kol-export=pdf][data-view=${v}]`).count()) === 1);
  }
  await go('kol?id=KOL-001');
  ok('T01 Profil partner: tanpa tombol ekspor', (await p.locator('[data-kol-export]').count()) === 0);

  /* T02 Direktori Excel tanpa filter */
  const before = await snap();
  await go('kol?view=directory'); await shot('kol-directory');
  let x = await xlsx();
  ok('T02 Direktori: nama file', x.name === 'HAWK_F2-07_directory_2026-08-22.xlsx', x.name);
  ok('T02 Direktori: header kolom', JSON.stringify(x.rows[0]) === JSON.stringify(['ID', 'Nama partner', 'Kanal', 'Channel', 'Unit', 'Audiens', 'Followers', 'Tahap', 'Fee (Rp)', 'Kode tracking', 'Status kode', 'Kode berlaku s.d.', 'PIC']), x.rows[0].join('|'));
  ok('T02 Direktori: jumlah baris = layar (4)', x.rows.length - 1 === await screenRows() && x.rows.length - 1 === 4);
  const k1 = x.rows.find(r => r[0] === 'KOL-001');
  ok('T02 Fee & followers tersimpan sebagai angka', k1[8] === 6500000 && k1[6] === 84000, `${k1[8]} ${k1[6]}`);
  ok('T02 Status kode KOL-002 kedaluwarsa (berlaku s.d. 2026-08-15 < 22 Agu)', x.rows.find(r => r[0] === 'KOL-002')[10] === 'Kedaluwarsa');
  ok('T02 PIC berupa nama (Bayu)', k1[12] === 'Bayu');
  ok('T02 Sheet Info: DATA DEMO, filter Semua, WITA', JSON.stringify(x.info).includes('DATA DEMO') && JSON.stringify(x.info).includes('Kanal: Semua · Status: Semua · PIC: Semua') && JSON.stringify(x.info).includes('WITA'));
  let py = '';
  try { py = execFileSync('python3', ['-I', '-c', 'import sys,openpyxl;wb=openpyxl.load_workbook(sys.argv[1]);ws=wb.worksheets[0];print(wb.sheetnames, ws.max_row, ws.max_column)', x.file]).toString().trim(); } catch (e) { py = 'ERR ' + e.message; }
  ok('T02 File .xlsx valid (dibuka openpyxl)', /Direktori Partner/.test(py) && / 5 13$/.test(py), py);

  /* T03 filter diterapkan */
  await go('kol?view=directory&type=KOL'); x = await xlsx();
  ok('T03 Filter Kanal=KOL → 3 baris, tanpa MED-001', x.rows.length - 1 === 3 && !x.rows.some(r => r[0] === 'MED-001') && x.rows.length - 1 === await screenRows());
  ok('T03 Info memuat filter aktif', JSON.stringify(x.info).includes('Kanal: KOL'));
  await go('kol?view=directory&pic=MBR-C01'); x = await xlsx();
  ok('T03 Filter PIC=Rani → MED-001 saja', x.rows.length === 2 && x.rows[1][0] === 'MED-001' && JSON.stringify(x.info).includes('PIC: Rani'));

  /* T04 Pipeline */
  await go('kol?view=pipeline'); x = await xlsx();
  ok('T04 Pipeline: 4 baris, urut tahap', x.rows.length === 5 && x.rows.slice(1).map(r => r[1]).every((v, i, a) => !i || a[i - 1] <= v), x.rows.slice(1).map(r => r[0]).join(','));
  ok('T04 Pipeline: tanggal masuk tahap dari histori (KOL-002 Review 2026-08-18)', x.rows.find(r => r[2] === 'KOL-002')[7] === '2026-08-18');
  await go('kol?view=pipeline&stage=Shortlist'); x = await xlsx();
  ok('T04 Pipeline filter Status=Shortlist → KOL-003', x.rows.length === 2 && x.rows[1][2] === 'KOL-003');

  /* T05 Kalender Deliverables tabel */
  await go('kol?view=deliverables'); await shot('kol-deliverables'); x = await xlsx();
  ok('T05 Deliverables: 5 baris = layar, urut tenggat', x.rows.length - 1 === 5 && x.rows.length - 1 === await screenRows() && x.rows.slice(1).map(r => r[0]).join() === '2026-08-05,2026-08-07,2026-08-12,2026-08-25,2026-09-05');
  ok('T05 Flag terlambat sesuai layar (tidak ada yang lewat tenggat & belum terbit)', x.rows.slice(1).every(r => r[1] === 'Tidak'));
  ok('T05 Deliverables: tanpa kolom Aksi', !x.rows[0].includes('Aksi'));
  ok('T05 Impressions DLV-003 = 88000 (angka)', x.rows.find(r => r[2] === 'DLV-003')[8] === 88000);
  await go('kol?view=deliverables&type=Media%20partner'); x = await xlsx();
  ok('T05 Filter Kanal=Media partner → DLV-005 saja', x.rows.length === 2 && x.rows[1][2] === 'DLV-005');
  await go('kol?view=deliverables&pic=MBR-C03');
  const mkBefore = await snap();
  await p.click('[data-kol-export=xlsx]'); await p.waitForTimeout(200);
  ok('T05 Hasil kosong: tidak ada file, pesan jelas', (await p.evaluate(() => window.__kolLastExport)).file === null && /Tidak ada data untuk filter ini/.test(await status()), await status());
  const pe = await pdf();
  ok('T05 Hasil kosong PDF: dialog cetak tidak dibuka', pe.n === 0);
  ok('T05 Hasil kosong tidak mengubah data', (await snap()) === mkBefore);

  /* T06 Performance = layar, filter tidak berlaku */
  await go('kol?view=performance&type=Media%20partner'); await shot('kol-performance');
  const scr = await p.locator('#view .tbl tbody tr').evaluateAll(trs => trs.map(t => [...t.children].map(td => td.innerText.trim())));
  x = await xlsx();
  ok('T06 Performance: jumlah baris sama dengan layar (filter tidak berlaku)', x.rows.length - 1 === scr.length && scr.length === 2, `${x.rows.length - 1} vs ${scr.length}`);
  const perfOk = x.rows.slice(1).every(r => { const s = scr.find(c => c[0].startsWith(r[0])); return s && s[2] === r[4].toLocaleString('id-ID') && s[3] === r[5].toLocaleString('id-ID') && s[4].startsWith(r[6].toLocaleString('id-ID')); });
  ok('T06 Impr., klik, booking sama dengan tabel layar', perfOk, JSON.stringify(x.rows.slice(1).map(r => r.slice(4, 7))));
  const model = await p.evaluate(() => CX.ensure(HL.state).mk.partners.filter(q => q.campaign).map(q => q.id));
  ok('T06 Partner = partner ber-campaign (KOL-001, KOL-002)', JSON.stringify(x.rows.slice(1).map(r => r[0])) === JSON.stringify(model));
  ok('T06 Revenue ÷ fee = revenue / fee', x.rows.slice(1).every(r => r[10] === '' || Math.abs(r[10] - Math.round(r[8] / r[9] * 100) / 100) < 0.011));
  ok('T06 Info: filter tidak berlaku, periode Agustus 2026', JSON.stringify(x.info).includes('Tidak berlaku di tab ini'));

  /* T07 PDF 4 tab */
  for (const [v, n] of [['directory', 4], ['pipeline', 4], ['deliverables', 5], ['performance', 2]]) {
    await go('kol?view=' + v); const r = await pdf();
    const rows = (r.html.match(/<tr>/g) || []).length - 1;
    ok(`T07 PDF ${v}: dialog cetak dibuka, ${n} baris, header tabel, judul & filter`, r.n === 1 && r.cls && rows === n && /<thead>/.test(r.html) && /F2-07 Media Partner &amp; KOL/.test(r.html) && /Filter aktif/.test(r.html) && /Diekspor/.test(r.html), `rows ${rows}`);
    ok(`T07 PDF ${v}: mode cetak dilepas setelah cetak`, !r.after);
  }
  await go('kol?view=directory&type=KOL'); const rk = await pdf();
  ok('T07 PDF mengikuti filter (3 baris, Kanal: KOL)', (rk.html.match(/<tr>/g) || []).length - 1 === 3 && /Kanal: KOL/.test(rk.html));
  const css = await p.evaluate(() => [...document.styleSheets].flatMap(s => { try { return [...s.cssRules].map(r => r.cssText); } catch (e) { return []; } }).join(' '));
  ok('T07 CSS cetak: landscape & header berulang', /landscape/.test(css) && /table-header-group/.test(css));

  /* T08 karakter khusus & keamanan */
  await p.evaluate(() => { const m = CX.ensure(HL.state).mk; m.partners[0].name = '=HYPERLINK("http://x")<img src=x onerror=alert(1)>&"\''; m.partners[0].audience = '+62 @tag ' + 'panjang '.repeat(40); });
  await go('kol?view=directory'); x = await xlsx();
  const r0 = x.rows.find(r => r[0] === 'KOL-001');
  ok('T08 Excel: teks diawali = diberi awalan \' (anti formula)', r0[1].startsWith("'=HYPERLINK"), r0[1].slice(0, 20));
  ok('T08 Excel: teks diawali + diberi awalan \'', r0[5].startsWith("'+62"));
  ok('T08 Excel: tidak ada elemen formula <f>', !/<f>/.test(x.z['xl/worksheets/sheet1.xml']));
  const rs = await pdf();
  ok('T08 PDF: HTML di-escape (tidak ada <img>)', !/<img/i.test(rs.html) && /&lt;img/.test(rs.html));
  ok('T08 PDF: teks panjang tetap utuh', rs.html.includes('panjang '.repeat(40).trim()));
  await go('screens'); p.once('dialog', d => d.accept()); await p.click('[data-action=reset]'); await p.waitForTimeout(150);

  /* T09 tidak mengubah data & regresi */
  const s0 = await snap();
  for (const v of ['directory', 'pipeline', 'deliverables', 'performance']) { await go('kol?view=' + v); await xlsx(); await pdf(); }
  ok('T09 Ekspor 8× tidak mengubah data partner/deliverable', (await snap()) === s0);
  ok('T09 Data awal sama dengan sebelum seluruh uji', s0 === before);
  await go('kol?view=directory'); await p.selectOption('#filters [name=type]', 'Media partner'); await p.waitForTimeout(250);
  ok('T09 Filter masih bekerja (1 baris)', (await screenRows()) === 1 && /type=Media/.test(decodeURIComponent(await p.evaluate(() => location.hash))));
  await go('kol?view=pipeline'); await p.click('[data-action="cx:kol-advance"][data-id=KOL-003]'); await p.waitForTimeout(200);
  ok('T09 Alur tahap masih bekerja (KOL-003 → Brief)', (await p.evaluate(() => CX.ensure(HL.state).mk.partners.find(q => q.id === 'KOL-003').stage)) === 'Brief');
  await go('kol?view=deliverables'); await p.click('[data-action="cx:dlv-approve"][data-id=DLV-002]'); await p.waitForTimeout(200);
  ok('T09 Approve deliverable masih bekerja', (await p.evaluate(() => CX.ensure(HL.state).mk.deliverables.find(d => d.id === 'DLV-002').status)) === 'Disetujui');
  await go('kol?view=pipeline'); x = await xlsx();
  ok('T09 Ekspor mengikuti perubahan alur (KOL-003 di Brief)', x.rows.find(r => r[2] === 'KOL-003')[0] === 'Brief');
  await go('screens'); p.once('dialog', d => d.accept()); await p.click('[data-action=reset]'); await p.waitForTimeout(150);

  /* T10 mobile */
  await p.setViewportSize({ width: 390, height: 844 }); await go('kol?view=deliverables'); await shot('kol-mobile');
  const ow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok('T10 Mobile 390px: tombol terlihat, tanpa scroll horizontal', (await p.locator('[data-kol-export=xlsx]').isVisible()) && !ow);

  ok('T11 Tidak ada error konsol/JS', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'kol-export-results.json'), JSON.stringify({ at: new Date().toISOString(), pass: out.length - fail, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
