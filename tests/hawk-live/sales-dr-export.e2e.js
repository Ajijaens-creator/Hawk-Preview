/* HAWK Sales · NP-HAWK-SALES-DR-001 Export Excel & PDF di F5-01 Driver & Referral (Playwright, klik nyata)
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/sales-dr-export.e2e.js
   DATA DEMO / SIMULASI */
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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drx-'));
const witaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 950 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::ERR_/.test(m.text())) errors.push(m.text()); });
  await p.addInitScript(() => { window.__prints = 0; window.print = () => { window.__prints++; window.__printHtml = document.getElementById('hl-print')?.innerHTML || ''; window.__printClass = document.body.classList.contains('hl-printing'); }; });
  const go = async (r) => { await p.goto(BASE + 'sales.html#' + r); await p.waitForTimeout(150); };
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); };
  const status = () => p.locator('#view .status').first().innerText().catch(() => '');
  const refCard = () => p.locator('#view section.card', { hasText: 'Booking referral' });
  const screenTable = () => refCard().locator('.tbl tbody tr').evaluateAll(trs => trs.filter(t => !t.querySelector('.empty-cell')).map(t => [...t.children].map(td => td.innerText.trim())));
  const xlsx = async () => {
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }), p.click('[data-dr-export=xlsx]')]);
    const f = path.join(tmp, dl.suggestedFilename()); await dl.saveAs(f); await p.waitForTimeout(100);
    const z = unzip(fs.readFileSync(f)); return { name: dl.suggestedFilename(), file: f, rows: sheet(z['xl/worksheets/sheet1.xml']), info: sheet(z['xl/worksheets/sheet2.xml']), z };
  };
  const pdf = async () => { await p.evaluate(() => { window.__prints = 0; }); await p.click('[data-dr-export=pdf]'); await p.waitForTimeout(800); return p.evaluate(() => ({ n: window.__prints, html: window.__printHtml, cls: window.__printClass, after: document.body.classList.contains('hl-printing') })); };
  const snap = () => p.evaluate(() => JSON.stringify(HL.state));
  const reset = async () => { await go('screens'); p.once('dialog', d => d.accept()); await p.click('[data-action=reset]'); await p.waitForTimeout(150); };
  await reset();

  /* TC-01 / TC-10 posisi tombol & empty state */
  await go('driver'); await shot('dr-empty');
  const head = p.locator('#view header.page-head');
  ok('TC-01 Tombol Export Excel & PDF ada di header halaman (kanan atas, sejajar judul)', (await head.locator('[data-dr-export=xlsx]').count()) === 1 && (await head.locator('[data-dr-export=pdf]').count()) === 1);
  const geo = await p.evaluate(() => { const h = document.querySelector('#view .page-head h1').getBoundingClientRect(), b = document.querySelector('[data-dr-export=pdf]').getBoundingClientRect(), head = document.querySelector('#view .page-head').getBoundingClientRect(); return { right: Math.round(head.right - b.right), top: Math.round(b.top - h.top), left: b.left > h.right }; });
  ok('TC-01 Desktop: tombol rata kanan header, sebaris judul', geo.right <= 2 && Math.abs(geo.top) < 30 && geo.left, JSON.stringify(geo));
  ok('TC-01 Label tombol tepat', (await p.locator('[data-dr-export=xlsx]').innerText()) === 'Export Excel' && (await p.locator('[data-dr-export=pdf]').innerText()) === 'Export PDF');
  ok('TC-10 Tabel kosong: kedua tombol disabled', (await p.locator('[data-dr-export=xlsx]').isDisabled()) && (await p.locator('[data-dr-export=pdf]').isDisabled()));
  for (const r of ['sales', 'reservation', 'commission', 'pos']) { await go(r); ok(`Tombol export hanya di F5-01 (tidak ada di #${r})`, (await p.locator('[data-dr-export]').count()) === 0); }

  /* alur existing: perjanjian → aktivasi → booking referral via form (TC-19/20/21) */
  await go('driver');
  ok('TC-19 Kartu driver tampil (Perjanjian belum disetujui)', /Perjanjian belum disetujui/.test(await p.locator('#view').innerText()));
  await p.click('[data-action=agreement]'); await p.waitForTimeout(150);
  await p.click('[data-action=activate]'); await p.waitForTimeout(150);
  ok('TC-19 Status driver Aktif setelah aktivasi', /Aktif · komisi 10%/.test(await p.locator('#view').innerText()));
  const slotOpts = await p.locator('#view select[name=slot] option').allInnerTexts();
  ok('TC-20 Dropdown Slot HAWK berisi slot kosong', JSON.stringify(slotOpts) === JSON.stringify(['11.00', '13.00', '15.00']), slotOpts.join(','));
  await p.selectOption('#view select[name=slot]', '13.00'); await p.click('#view form[data-submit=book] button'); await p.waitForTimeout(200);
  await p.click('#view form[data-submit=book] button'); await p.waitForTimeout(200);
  const bk = await p.evaluate(() => HL.state.bookings.filter(b => b.partner).map(b => [b.id, b.slot, b.status]));
  ok('TC-21 Konfirmasi booking membuat 2 booking referral', bk.length === 2 && bk[0][1] === '13.00' && bk.every(b => b[2] === 'confirmed'), JSON.stringify(bk));
  ok('TC-10 Ada data: tombol aktif', !(await p.locator('[data-dr-export=xlsx]').isDisabled()) && !(await p.locator('[data-dr-export=pdf]').isDisabled()));
  /* satu booking sampai paid lewat POS, agar status beragam */
  await go('pos');
  await p.click(`[data-action=checkin][data-id=${bk[0][0]}]`); await p.waitForTimeout(120);
  await p.click(`[data-action=complete][data-id=${bk[0][0]}]`); await p.waitForTimeout(120);
  await p.click(`[data-action=pay][data-id=${bk[0][0]}]`); await p.waitForTimeout(120);
  /* booking non-referral tidak boleh ikut */
  await go('client'); await p.click('#view form[data-submit=book] button'); await p.waitForTimeout(150);

  /* TC-02/04/06/13/15 Excel */
  await go('driver'); await shot('dr-data');
  const scr = await screenTable();
  const before = await snap();
  let x = await xlsx();
  ok('TC-02 File .xlsx terunduh dengan nama Driver_Referral_YYYY-MM-DD.xlsx (tanggal WITA)', x.name === `Driver_Referral_${witaToday()}.xlsx`, x.name);
  let py = '';
  try { py = execFileSync('python3', ['-I', '-c', 'import sys,openpyxl;wb=openpyxl.load_workbook(sys.argv[1]);ws=wb.worksheets[0];print(wb.sheetnames, ws.max_row, ws.max_column)', x.file]).toString().trim(); } catch (e) { py = 'ERR ' + e.message; }
  ok('TC-02 File .xlsx valid (dibuka openpyxl), sheet Booking referral + Info', /'Booking referral', 'Info'/.test(py) && / 3 5$/.test(py), py);
  ok('TC-04 Kolom & urutan = tabel existing', JSON.stringify(x.rows[0]) === JSON.stringify(['Booking', 'Lead', 'Slot', 'Nilai', 'Status']), x.rows[0].join('|'));
  ok('TC-15 Jumlah baris = tabel layar (2)', x.rows.length - 1 === scr.length && scr.length === 2, `${x.rows.length - 1} vs ${scr.length}`);
  ok('TC-06 Semua booking referral ikut, booking non-referral tidak', JSON.stringify(x.rows.slice(1).map(r => r[0])) === JSON.stringify(bk.map(b => b[0])));
  const same = x.rows.slice(1).every((r, i) => r[0] === scr[i][0] && (r[1] || '—') === scr[i][1] && r[2] === scr[i][2] && 'Rp ' + r[3].toLocaleString('id-ID') === scr[i][3] && r[4] === scr[i][4]);
  ok('TC-04 Isi sel sama dengan layar', same, JSON.stringify(x.rows.slice(1)));
  const amt = await p.evaluate(() => HL.state.catalog.price);
  ok('TC-13 Nilai tersimpan sebagai angka = nilai sumber', x.rows.slice(1).every(r => typeof r[3] === 'number' && r[3] === amt), String(x.rows[1][3]));
  ok('TC-04 Slot tetap teks (13.00, bukan 13)', x.rows[1][2] === '13.00');
  ok('TC-04 Status mentah seperti layar (paid, confirmed)', x.rows[1][4] === 'paid' && x.rows[2][4] === 'confirmed');
  ok('Sheet Info: judul modul, DATA DEMO, WITA, jumlah baris', JSON.stringify(x.info).includes('F5-01 Driver & Referral') && JSON.stringify(x.info).includes('DATA DEMO') && JSON.stringify(x.info).includes('WITA') && JSON.stringify(x.info).includes('"Jumlah baris","2"'));
  ok('TC-17 Tidak ada field internal (komisi, payout, sumber, kanal)', !/commission|payout|Referral"|Website|0\.1/.test(x.z['xl/worksheets/sheet1.xml']));
  ok('Pesan sukses tampil', /Excel dibuat: 2 baris/.test(await status()), await status());
  ok('TC-08 Satu tabel → satu sheet data (+ Info)', !x.z['xl/worksheets/sheet3.xml']);

  /* TC-03/09 PDF */
  let r = await pdf();
  const prow = (r.html.match(/<tr>/g) || []).length - 1;
  ok('TC-03 PDF: dialog cetak dibuka (Simpan sebagai PDF), tabel 2 baris', r.n === 1 && r.cls && prow === 2, `rows ${prow}`);
  ok('TC-09 PDF: judul modul + nama tabel, header kolom', /F5-01 Driver &amp; Referral · Booking referral/.test(r.html) && /<thead><tr><th scope="col">Booking<\/th><th scope="col">Lead<\/th><th scope="col">Slot<\/th><th scope="col">Nilai<\/th><th scope="col">Status<\/th>/.test(r.html));
  ok('TC-03 PDF: nilai berformat rupiah seperti layar', r.html.includes(scr[0][3]));
  ok('TC-03 Mode cetak dilepas setelah cetak', !r.after);
  ok('Pesan PDF tampil', /Laporan PDF disiapkan: 2 baris/.test(await status()), await status());
  ok('TC-23/24/25 Export Excel + PDF tidak mengubah state (booking, status, komisi, payout)', (await snap()) === before);

  /* TC-11 loading & klik ganda */
  await go('driver');
  await p.evaluate(() => { window.__dl = 0; const o = URL.createObjectURL; URL.createObjectURL = (b) => { window.__dl++; return o(b); }; });
  await p.evaluate(() => { const b = document.querySelector('[data-dr-export=xlsx]'); b.click(); window.__busyTxt = b.textContent; window.__busyDis = [...document.querySelectorAll('[data-dr-export]')].every(x => x.disabled && x.getAttribute('aria-busy') === 'true'); b.click(); document.querySelector('[data-dr-export=pdf]').click(); });
  await p.waitForTimeout(400);
  const busy = await p.evaluate(() => ({ txt: window.__busyTxt, dis: window.__busyDis, dl: window.__dl, prints: window.__prints }));
  ok('TC-11 Loading: teks "Menyiapkan…" & semua tombol disabled + aria-busy', busy.txt === 'Menyiapkan…' && busy.dis, JSON.stringify(busy));
  ok('TC-11 Klik ganda tidak membuat file kedua', busy.dl === 1, JSON.stringify(busy));
  ok('TC-11 Tombol aktif kembali setelah selesai', !(await p.locator('[data-dr-export=xlsx]').isDisabled()));

  /* TC-12 error state */
  await p.evaluate(() => { window.__HLXbak = window.HLX; window.HLX = { ...window.HLX, xlsx: () => { throw new Error('simulasi'); } }; window.__dl = 0; });
  await p.click('[data-dr-export=xlsx]'); await p.waitForTimeout(250);
  ok('TC-12 Error: pesan jelas (role=alert), tidak ada file', /Ekspor gagal: simulasi\. File tidak dibuat\./.test(await status()) && (await p.locator('#view .status.error[role=alert]').count()) === 1 && (await p.evaluate(() => window.__dl)) === 0, await status());
  await p.evaluate(() => { window.HLX = window.__HLXbak; });

  /* TC-14/18 banyak baris & keamanan */
  await p.evaluate(() => { const s = HL.state; for (let i = 0; i < 45; i++) s.bookings.push({ id: 'BK-T' + String(i).padStart(2, '0'), lead: i === 0 ? '=HYPERLINK("http://x")<b>tebal</b>&"' : i === 1 ? '+62 @tag' : '', source: 'Referral', channel: 'Website', campaign: '', partner: 'DRV-001', slot: '15.00', amount: 750000, status: 'confirmed', commissionRate: 0.1, payout: false }); });
  await go('driver'); x = await xlsx();
  ok('TC-14 47 baris diekspor (tanpa pagination)', x.rows.length - 1 === 47 && (await screenTable()).length === 47);
  const inj = x.rows.find(r => r[0] === 'BK-T00'), plus = x.rows.find(r => r[0] === 'BK-T01');
  ok('TC-18 Excel: teks diawali = diberi awalan \' (anti formula)', inj[1].startsWith("'=HYPERLINK"), inj[1].slice(0, 16));
  ok('TC-18 Excel: teks diawali + diberi awalan \'', plus[1].startsWith("'+62"));
  ok('TC-18 Excel: tidak ada elemen formula <f>', !/<f>/.test(x.z['xl/worksheets/sheet1.xml']));
  r = await pdf();
  ok('TC-14 PDF 47 baris, header tabel berulang tiap halaman (thead)', (r.html.match(/<tr>/g) || []).length - 1 === 47 && /<thead>/.test(r.html));
  ok('TC-18 PDF: HTML di-escape (tidak ada <b> mentah)', !/<b>tebal/i.test(r.html) && /&lt;b&gt;tebal/.test(r.html));
  const css = await p.evaluate(() => [...document.styleSheets].flatMap(s => { try { return [...s.cssRules].map(q => q.cssText); } catch (e) { return []; } }).join(' '));
  ok('TC-14 CSS cetak: header tabel berulang & baris tidak terpotong', /table-header-group/.test(css) && /break-inside: avoid/.test(css));
  await reset();

  /* TC-22/24/26/27 regresi alur driver → komisi */
  await go('driver'); await p.click('[data-action=agreement]'); await p.waitForTimeout(120); await p.click('[data-action=activate]'); await p.waitForTimeout(120);
  await p.click('#view form[data-submit=book] button'); await p.waitForTimeout(150);
  const id = await p.evaluate(() => HL.state.bookings.filter(b => b.partner)[0].id);
  await p.click('[data-dr-export=xlsx]').catch(() => {}); await p.waitForTimeout(150);
  await go('pos'); for (const a of ['checkin', 'complete', 'pay']) { await p.click(`[data-action=${a}][data-id=${id}]`); await p.waitForTimeout(120); }
  await go('commission');
  const com = await p.locator('#view').innerText();
  ok('TC-24/27 Commission Review: komisi 10% booking referral = Rp 75.000', com.includes(id) && com.includes('Rp 75.000'), '');
  await p.click(`[data-action=payout][data-id=${id}]`); await p.waitForTimeout(120);
  ok('TC-25 Pembayaran komisi tetap lewat Finance (bukan dari export)', await p.evaluate((i) => HL.state.bookings.find(b => b.id === i).payout === true, id));
  await go('driver');
  ok('TC-22 Tabel Booking referral tetap tampil status paid', (await screenTable()).some(rw => rw[0] === id && rw[4] === 'paid'));
  await go('sales-home');
  ok('TC-26 Navigasi portal Sales: menu Driver & Referral ada', (await p.locator('#nav a[href="#driver"]').count()) >= 1);
  await reset();

  /* TC-29 mobile */
  await p.setViewportSize({ width: 390, height: 844 });
  await go('driver'); await p.evaluate(() => { HL.state.partner.agreement = true; HL.state.partner.active = true; }); await p.click('#view form[data-submit=book] button').catch(() => {}); await p.waitForTimeout(150);
  await go('driver'); await shot('dr-mobile');
  const mob = await p.evaluate(() => { const h = document.querySelector('#view .page-head h1').getBoundingClientRect(), b = document.querySelector('[data-dr-export=xlsx]').getBoundingClientRect(); return { ow: document.documentElement.scrollWidth > window.innerWidth + 1, below: b.top >= h.bottom - 1, inside: b.right <= window.innerWidth }; });
  ok('TC-29 Mobile 390px: tombol terlihat di bawah judul, tanpa overlap & tanpa scroll horizontal', (await p.locator('[data-dr-export=xlsx]').isVisible()) && !mob.ow && mob.below && mob.inside, JSON.stringify(mob));
  await reset();

  ok('Tidak ada error konsol/JS', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'sales-dr-export-results.json'), JSON.stringify({ at: new Date().toISOString(), pass: out.length - fail, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
