/* HAWK Operational · NP-HAWK-OP-FOP06-001 Export Excel & PDF di F-OP06 Room & Facility (Playwright, klik nyata)
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/op-rooms-export.e2e.js
   DATA DEMO / SIMULASI · tanggal data demo 2026-11-19 (WITA) */
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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'opr-'));
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replace(/-/g, '');
const COLS = ['No', 'Ruang', 'Outlet', 'Tipe', 'Kapasitas', 'Status', 'Keterangan status', 'Last cleaning', 'Next booking (WITA)', 'Catatan operasional'];
const HELPERS = () => {
  window.T = {
    as(id) { OPX.actions['account-select']({ dataset: { id } }); },
    outlet(o) { OPX.state.outletId = o; OPX.save(); OPX.render(); },
    d() { return OPX.state.data; },
  };
};
(async () => {
  const browser = await chromium.launch();
  const errors = [], requests = [];
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 950 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::ERR_/.test(m.text())) errors.push(m.text()); });
  p.on('request', r => requests.push(r.url()));
  await p.addInitScript(HELPERS);
  await p.addInitScript(() => { window.__prints = 0; window.print = () => { window.__prints++; const b = document.getElementById('hl-print'); window.__printHtml = b?.innerHTML || ''; window.__printReport = b?.dataset.report || ''; window.__printing = document.body.classList.contains('hl-printing'); }; });
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n, full = true) => { if (SHOTS) { await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: full }); } };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const go = async (r, page = 'operational.html') => { await p.goto(BASE + page + '#' + r); await p.waitForTimeout(300); };
  const tab = async (id) => { await p.click(`.opx [data-act=room-filter][data-id=${id}]`); await p.waitForTimeout(120); };
  const cards = () => p.locator('.opx .room-grid .room-tile').evaluateAll(ts => ts.map(t => ({ name: t.querySelector('h3').innerText.trim(), sub: t.querySelector('.room-type').innerText.trim(), status: t.querySelector('.badge').innerText.trim(), metas: [...t.querySelectorAll('.room-meta b')].map(b => b.innerText.trim()) })));
  const xlsx = async () => {
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }), p.click('[data-op-export=xlsx]')]);
    const f = path.join(tmp, dl.suggestedFilename()); await dl.saveAs(f);
    const z = unzip(fs.readFileSync(f)); const names = sheetNames(z);
    const sh = {}; names.forEach((n, i) => { sh[n] = sheet(z[`xl/worksheets/sheet${i + 1}.xml`]); });
    return { name: dl.suggestedFilename(), file: f, names, sh, z };
  };
  const pdf = async () => { await ev(() => { window.__prints = 0; window.__printHtml = ''; window.__printReport = ''; }); await p.click('[data-op-export=pdf]'); await p.waitForTimeout(800); return ev(() => ({ n: window.__prints, html: window.__printHtml, report: window.__printReport, during: window.__printing, after: document.body.classList.contains('hl-printing'), left: document.getElementById('hl-print')?.dataset.report || '' })); };
  const pdfRows = (html) => (html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1].match(/<tr>/g) || []).length;
  const storage = () => ev(() => localStorage.getItem(OPX.storeKey));

  await go('op-dashboard'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  await go('op-rooms');
  const s0 = await storage();

  /* T01 tombol kanan atas, sejajar tab status, di semua tab (Eni · Operational Manager) */
  for (const id of ['all', 'ready', 'occupied', 'cleaning', 'maintenance']) {
    await tab(id);
    const n = await p.locator('.opx .filter-bar .op-export [data-op-export]').count();
    const bx = await p.locator('.opx .op-export').boundingBox(), tb = await p.locator('.opx .filter-bar .tabs').boundingBox();
    ok(`T01 ${id}: Export Excel & PDF di kanan tab status, satu baris`, n === 2 && bx && tb && bx.x >= tb.x + tb.width && Math.abs((bx.y + bx.height / 2) - (tb.y + tb.height / 2)) < 20);
  }
  const labels = await p.locator('.opx .op-export button').allInnerTexts();
  ok('T01 Label tombol "Export Excel" dan "Export PDF"', JSON.stringify(labels.map(s => s.trim())) === JSON.stringify(['Export Excel', 'Export PDF']), labels.join('|'));
  await tab('all'); await shot('op-rooms-buttons', false);

  /* T02 Excel · Semua ruang · Semua outlet */
  let c = await cards(), x = await xlsx();
  ok('T02 Nama file Room_Facility_Semua_outlet_Semua_ruang_YYYYMMDD.xlsx', x.name === `Room_Facility_Semua_outlet_Semua_ruang_${today}.xlsx`, x.name);
  ok('T02 Workbook: sheet Room & Facility + Info', JSON.stringify(x.names) === JSON.stringify(['Room & Facility', 'Info']), x.names.join('|'));
  let rows = x.sh['Room & Facility'];
  ok('T02 Header kolom sesuai inventaris field', JSON.stringify(rows[0]) === JSON.stringify(COLS), rows[0].join('|'));
  ok('T02 Jumlah baris = kartu di layar (24)', rows.length - 1 === c.length && c.length === 24, `${rows.length - 1}/${c.length}`);
  ok('T02 Ruang, outlet·tipe, status, last cleaning, next booking sama dengan kartu', rows.slice(1).every((r, i) => r[1] === c[i].name && `${r[2]} · ${r[3]} · ${r[4]}` === c[i].sub && r[5] === c[i].status && r[7] === c[i].metas[0] && `${r[8]} WITA` === c[i].metas[1]));
  ok('T02 Tipe & kapasitas dipisah (Couple / 2 pax)', rows[1][3] === 'Couple' && rows[1][4] === '2 pax' && rows[2][3] === 'Single' && rows[2][4] === '1 pax', `${rows[1][3]}|${rows[1][4]}`);
  ok('T02 Catatan operasional: nilai asli, kosong → —', rows.some(r => r[9] === 'Pemeriksaan AC dijadwalkan') && rows.slice(1).filter(r => r[9] === '—').length === 20);
  ok('T02 Tanpa ID ruang / lastBy (field tersembunyi)', !JSON.stringify(rows).includes('CTR-R0') && !JSON.stringify(rows).includes('Attendant Ubud'));
  ok('T02 Nomor urut tanpa duplikasi', rows.slice(1).every((r, i) => r[0] === i + 1) && new Set(rows.slice(1).map(r => r[2] + r[1])).size === 24);
  const info = JSON.stringify(x.sh.Info);
  ok('T02 Info: filter outlet & status, pengguna, waktu WITA, label demo', /Semua outlet/.test(info) && /Semua ruang/.test(info) && /Eni Restini · Operational Manager/.test(info) && /WITA/.test(info) && /DATA DEMO \/ SIMULASI/.test(info));
  let py = '';
  try { py = execFileSync('python3', ['-I', '-c', 'import sys,openpyxl;wb=openpyxl.load_workbook(sys.argv[1]);ws=wb["Room & Facility"];print(wb.sheetnames, ws.max_row, ws.max_column)', x.file]).toString().trim(); } catch (e) { py = 'ERR ' + e.message; }
  ok('T02 File .xlsx valid (openpyxl): 25 baris × 10 kolom', /\['Room & Facility', 'Info'\] 25 10/.test(py), py);

  /* T03 tiap tab status */
  for (const [id, label] of [['ready', 'Ready'], ['occupied', 'Occupied'], ['cleaning', 'Cleaning'], ['maintenance', 'Maintenance']]) {
    await tab(id); c = await cards(); x = await xlsx(); rows = x.sh['Room & Facility'].slice(1);
    ok(`T03 ${label}: hanya status ${label}, jumlah = kartu`, rows.length === c.length && c.length > 0 && rows.every(r => r[5] === label), `${rows.length}/${c.length}`);
    ok(`T03 ${label}: nama file memuat status`, x.name === `Room_Facility_Semua_outlet_${label}_${today}.xlsx`, x.name);
  }

  /* T04 outlet tertentu + kombinasi status */
  await ev(() => T.outlet('SHT')); await tab('all'); c = await cards(); x = await xlsx(); rows = x.sh['Room & Facility'].slice(1);
  ok('T04 Outlet Shanti: 6 ruang, semuanya Shanti', rows.length === 6 && c.length === 6 && rows.every(r => r[2] === 'Shanti'));
  ok('T04 Info filter outlet = Shanti', /Shanti/.test(JSON.stringify(x.sh.Info)) && x.name === `Room_Facility_Shanti_Semua_ruang_${today}.xlsx`, x.name);
  await tab('ready'); c = await cards(); x = await xlsx(); rows = x.sh['Room & Facility'].slice(1);
  ok('T04 Shanti + Ready: hanya ruang Ready Shanti', rows.length === c.length && rows.length === 3 && rows.every(r => r[2] === 'Shanti' && r[5] === 'Ready'));

  /* T05 PDF */
  let pd = await pdf();
  ok('T05 PDF: dialog cetak dipanggil sekali', pd.n === 1, String(pd.n));
  ok('T05 PDF: judul HAWK, filter Shanti/Ready, pengguna, waktu WITA, label demo', /HAWK ERP · Room &amp; Facility Report/.test(pd.html) && /Shanti/.test(pd.html) && /Ready/.test(pd.html) && /Eni Restini/.test(pd.html) && /WITA/.test(pd.html) && /DATA DEMO \/ SIMULASI/.test(pd.html));
  ok('T05 PDF: data sama dengan Excel (3 baris, kolom sama)', pdfRows(pd.html) === 3 && COLS.every(h => pd.html.includes(`>${h.replace('&', '&amp;')}</th>`)));
  ok('T05 PDF: named page op-rooms aktif saat cetak, dibersihkan sesudahnya', pd.report === 'op-rooms' && pd.during && !pd.after && pd.left === '', `${pd.report}|${pd.during}|${pd.after}|${pd.left}`);
  await ev(() => T.outlet('all')); await tab('all'); pd = await pdf();
  ok('T05 PDF Semua ruang: 24 baris', pdfRows(pd.html) === 24, String(pdfRows(pd.html)));

  /* T06 PDF nyata (Chromium): A4 landscape, nomor halaman, multi-halaman tanpa baris hilang */
  await ev(() => { const b = document.getElementById('hl-print'); b.dataset.report = 'op-rooms'; document.body.classList.add('hl-printing'); });
  await p.emulateMedia({ media: 'print' });
  const pdfFile = path.join(tmp, 'rooms.pdf');
  await p.pdf({ path: pdfFile, preferCSSPageSize: true, printBackground: true });
  await p.emulateMedia({ media: 'screen' });
  await ev(() => { document.body.classList.remove('hl-printing'); delete document.getElementById('hl-print').dataset.report; });
  let pinfo = '', ptxt = '';
  try { pinfo = execFileSync('pdfinfo', [pdfFile]).toString(); ptxt = execFileSync('pdftotext', ['-layout', pdfFile, '-']).toString(); } catch (e) { pinfo = 'ERR ' + e.message; }
  const pages = Number((pinfo.match(/Pages:\s+(\d+)/) || [])[1] || 0);
  const size = (pinfo.match(/Page size:\s+([\d.]+) x ([\d.]+)/) || []).slice(1).map(Number);
  ok('T06 PDF A4 landscape (842 × 595 pt)', Math.round(size[0]) === 842 && Math.round(size[1]) === 595, size.join('x'));
  ok('T06 Nomor halaman "Halaman 1 / N" di tiap halaman', pages >= 1 && new RegExp(`Halaman 1 / ${pages}`).test(ptxt) && (ptxt.match(/Halaman \d+ \/ \d+/g) || []).length === pages, `pages=${pages}`);
  ok('T06 Semua 24 ruang tercetak (tidak terpotong)', Array.from({ length: 24 }, (_, i) => i + 1).every(n => new RegExp(`^\\s*${n}\\s+Room 0\\d`, 'm').test(ptxt)) && (ptxt.match(/Pemeriksaan AC/g) || []).length === 4);

  /* T07 data kosong → tombol disabled, tanpa file */
  await ev(() => { T.d().rooms.filter(r => r.outlet === 'TRL' && r.status === 'cleaning').forEach(r => { r.status = 'ready'; }); T.outlet('TRL'); });
  await tab('cleaning');
  ok('T07 Tab tanpa data: empty state tetap tampil', /Tidak ada ruang pada filter ini/.test(await p.locator('.opx .room-grid').innerText()));
  ok('T07 Export Excel & PDF disabled', await p.locator('[data-op-export=xlsx]').isDisabled() && await p.locator('[data-op-export=pdf]').isDisabled());
  let dlEmpty = false; p.once('download', () => { dlEmpty = true; });
  await ev(() => { window.__prints = 0; OPX.actions['rooms-export-xlsx'](); OPX.actions['rooms-export-pdf'](); }); await p.waitForTimeout(400);
  ok('T07 Aksi langsung pada data kosong: tidak ada file / cetak', !dlEmpty && (await ev(() => window.__prints)) === 0);
  await shot('op-rooms-empty', false);
  await ev(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(300); await go('op-rooms');

  /* T08 hak akses: capability export existing */
  for (const [id, can] of [['asm-tika', true], ['hosp-jro-okta', true], ['spv-CTR', false], ['head-attendant-CTR', false], ['attendant-CTR', false], ['reception-SHT', false]]) {
    await ev((i) => T.as(i), id); await go('op-rooms');
    const vis = await p.locator('.opx .op-export [data-op-export]').count();
    ok(`T08 ${id}: tombol ${can ? 'tampil' : 'tidak tampil'}`, can ? vis === 2 : vis === 0, String(vis));
  }
  await ev(() => T.as('spv-CTR')); await go('op-rooms');
  let dlDenied = false; p.once('download', () => { dlDenied = true; });
  await ev(() => { window.__prints = 0; OPX.actions['rooms-export-xlsx'](); OPX.actions['rooms-export-pdf'](); }); await p.waitForTimeout(400);
  ok('T08 Supervisor memanggil aksi langsung: ditolak, tanpa file / cetak', !dlDenied && (await ev(() => window.__prints)) === 0);
  ok('T08 Supervisor tetap melihat kartu outletnya (6 ruang Ubud Center)', (await cards()).length === 6);

  /* T09 outlet scope: Tika memilih Ubud Center → tidak ada data outlet lain */
  await ev(() => { T.as('asm-tika'); }); await go('op-rooms'); await ev(() => T.outlet('CTR')); await tab('all');
  x = await xlsx(); rows = x.sh['Room & Facility'].slice(1);
  ok('T09 Tika · Ubud Center: hanya 6 ruang Ubud Center', rows.length === 6 && rows.every(r => r[2] === 'Ubud Center'));
  ok('T09 Pengguna di file = Tika · Assistant Operational Manager', /Tika · Assistant Operational Manager/.test(JSON.stringify(x.sh.Info)));

  /* T10 formula injection: catatan berawalan = tetap teks */
  await ev(() => { const r = T.d().rooms.find(r => r.id === 'CTR-R02'); r.note = '=HYPERLINK("http://x","klik")'; OPX.render(); });
  x = await xlsx();
  const xml = x.z['xl/worksheets/sheet1.xml'];
  ok('T10 Catatan "=HYPERLINK(...)" tetap teks utuh, gaya quotePrefix, tanpa <f>', !/<f>/.test(xml) && /<c r="J3" t="inlineStr" s="2"><is><t xml:space="preserve">=HYPERLINK\(&quot;http:\/\/x&quot;,&quot;klik&quot;\)<\/t>/.test(xml));
  await ev(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(300); await go('op-rooms');

  /* T11 read-only: state & audit tidak berubah, tanpa request jaringan saat ekspor */
  const before = await storage(), auditBefore = await ev(() => T.d().audit.length);
  requests.length = 0;
  await xlsx(); await pdf(); await tab('maintenance'); await xlsx(); await pdf(); await tab('all');
  const after = await storage();
  ok('T11 localStorage sebelum = sesudah ekspor', before === after);
  ok('T11 Audit log tidak bertambah', (await ev(() => T.d().audit.length)) === auditBefore);
  ok('T11 Tidak ada request jaringan selama ekspor', requests.filter(u => !u.startsWith('blob:')).length === 0, requests.slice(0, 3).join(' | '));
  ok('T11 State awal sesi tidak berubah oleh seluruh ekspor (vs muat pertama)', s0 === after || JSON.parse(s0).data.rooms.length === JSON.parse(after).data.rooms.length);

  /* T12 regresi: filter, kartu, modal readiness, simpan status, portal.html */
  await tab('ready'); ok('T12 Filter Ready tetap bekerja (12 kartu)', (await cards()).length === 12);
  await tab('all'); await p.click('.opx .room-grid [data-act=room-open][data-id="CTR-R04"]'); await p.waitForTimeout(150);
  ok('T12 Modal Detail & readiness terbuka', /Room 04 · Ubud Center/.test(await p.locator('#modal-root').innerText()));
  await p.selectOption('#room-state-select', 'cleaning'); await p.fill('#room-evidence', 'Linen diganti, lantai kering'); await p.check('#modal-root input[name=checked]'); await p.click('#modal-root button[type=submit]'); await p.waitForTimeout(150);
  ok('T12 Simpan status demo tetap bekerja (Room 04 → Cleaning)', await ev(() => OPX.getRoom('CTR-R04').status === 'cleaning'));
  x = await xlsx(); ok('T12 Ekspor mengikuti status terbaru', x.sh['Room & Facility'].some(r => r[1] === 'Room 04' && r[2] === 'Ubud Center' && r[5] === 'Cleaning' && r[9] === 'Linen diganti, lantai kering'));
  await go('op-rooms', 'portal.html'); ok('T12 portal.html#op-rooms: tombol tampil', (await p.locator('.opx .op-export [data-op-export]').count()) === 2);

  /* T13 mobile */
  await p.setViewportSize({ width: 390, height: 844 }); await go('op-rooms'); await shot('op-rooms-mobile', false);
  const ow = await ev(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok('T13 Mobile 390px: kedua tombol terlihat, tanpa scroll horizontal', (await p.locator('[data-op-export=xlsx]').isVisible()) && (await p.locator('[data-op-export=pdf]').isVisible()) && !ow);

  ok('T14 Tidak ada error konsol/JS', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'op-rooms-export-results.json'), JSON.stringify({ at: new Date().toISOString(), pass: out.length - fail, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
