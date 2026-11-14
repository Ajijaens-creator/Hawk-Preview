/* HAWK · uji Demo Experience Center Operational (#ops-dx), Commercial (#commercial-dx), Sales (#sales-dx) di atas
   template dx-lab.js (model Demo Center Finance): login role tim portal saja, Desktop/iPad/Mobile, Smart Tutor menjalankan
   semua skenario, langkah divisi lain otomatis, Simulator, menu portal. python3 -m http.server 8811 lalu node tests/hawk-live/portal-dx.e2e.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const LABS = [
  { portal: 'Operational', page: 'operational.html', route: 'ops-dx', pills: ['Eni Restini', 'Mila', 'Putu Ari'], not: /Dewa/, sc: [['day', 5], ['refund', 7]], sim: 3 },
  { portal: 'Commercial', page: 'commercial.html', route: 'commercial-dx', pills: ['Commercial Manager', 'Rani', 'Bayu', 'Wulan'], not: /Asri|Dewa|Mila/, sc: [['campaign', 7], ['content', 8], ['brand', 5], ['lead', 5]], sim: 4 },
  { portal: 'Sales', page: 'sales.html', route: 'sales-dx', pills: ['Sales Manager', 'Dewa', 'Sales B2B'], not: /Mila|Asri|Driver/, sc: [['b2c', 4], ['handoff', 5], ['b2b', 7], ['driver', 6]], sim: 3 }
];
const by = (st, id) => st.bookings.find(b => b.id === id);
const CHECK = {
  'Operational:day': (st, c) => ['Operational: booking dari Sales dibayar di POS', by(st, c.bk)?.status === 'paid'],
  'Operational:refund': (st, c) => ['Operational: pembatalan membebaskan slot, refund tercatat', by(st, c.bk1)?.status === 'cancelled' && by(st, c.bk2)?.status === 'refunded'],
  'Commercial:campaign': (st, c) => { const cp = st.cx.campaigns.find(x => x.id === c.cmp); return ['Commercial: campaign Running, MRF diposting Finance, histori atas nama Bayu', cp?.status === 'Running' && st.requests.find(r => r.id === c.mrf)?.status === 'posted' && cp.history[0].by === 'MBR-C02']; },
  'Commercial:content': (st, c) => { const ct = st.cx.content.find(x => x.id === c.cnt); return ['Commercial: konten Analysed, review oleh Rani (MBR-C01)', ct?.stage === 'Analysed' && ct.reviews.some(r => r.by === 'MBR-C01')]; },
  'Commercial:brand': (st) => ['Commercial: tone Jaens Spa approved, banner Bisma terdistribusi', st.cx.brands[0].els.tone[0] === 'approved' && st.cx.comms.find(m => m.id === 'COM-004').status === 'Terdistribusi'],
  'Commercial:lead': (st, c) => ['Commercial: booking dari lead WhatsApp dibayar dengan campaign CMP-001', by(st, c.bk)?.status === 'paid' && by(st, c.bk).campaign === 'CMP-001'],
  'Sales:b2c': (st, c) => ['Sales: lead → booking → dibayar', by(st, c.bk)?.status === 'paid' && st.leads.find(l => l.id === c.lead).status === 'booked'],
  'Sales:handoff': (st, c) => ['Sales: batal → lead kembali ke staf', by(st, c.bk)?.status === 'cancelled' && st.leads.find(l => l.id === c.lead).status === 'staff'],
  'Sales:b2b': (st) => ['Sales: pipeline B2B sampai Booking pertama', st.b2b.stage === 'Booking pertama'],
  'Sales:driver': (st, c) => ['Sales: booking referral dibayar, komisi dibayar Finance', by(st, c.bk)?.partner === 'DRV-001' && by(st, c.bk).payout === true]
};
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png') }); };
  const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('hawk-integrated-demo-v1') || '{}'));
  for (const L of LABS) {
    await p.goto(BASE + L.page + '#bridge'); await p.evaluate(() => localStorage.clear());
    await p.goto(BASE + L.page + '#' + L.route); await p.reload(); await p.waitForTimeout(1200);
    await shot(`${L.route}-01-lab`);
    const nav = await p.locator('#nav').innerText();
    ok(`${L.portal}: sidebar tanpa nama/menu divisi`, !['Finance', 'Operational', 'Commercial', 'Sales', 'HRD'].some(n => new RegExp('^' + n + '$', 'm').test(nav)) && !(await p.locator('#nav button[data-mod]').count()));
    ok(`${L.portal}: kartu besar Demo Experience Center paling atas`, await p.evaluate((r) => { const f = document.querySelector('#nav').firstElementChild; return f && f.classList.contains('nav-dx') && f.getAttribute('href') === '#' + r; }, L.route));
    ok(`${L.portal}: menu portal punya Demo Experience Center`, (await p.locator(`#nav a[href="#${L.route}"]`).count()) === 1);
    const pills = await p.locator('#dxl-labhead [data-dxl="as"]').allInnerTexts();
    ok(`${L.portal}: login role hanya tim (${L.pills.join(', ')})`, pills.length === L.pills.length && L.pills.every(n => pills.some(x => x.includes(n))), pills.join(' | '));
    ok(`${L.portal}: divisi lain tanpa tombol login`, !pills.some(x => L.not.test(x)));
    ok(`${L.portal}: Desktop, iPad, Mobile`, (await p.locator('#dxl-labhead [data-dxl="dev"]').allInnerTexts()).join() === 'Desktop,iPad,Mobile');
    await p.click(`#dxl-labhead [data-dxl="as"]:has-text("${L.pills[1]}")`); await p.waitForTimeout(900);
    const lf = await (await p.locator('.dx-cell[data-cell="lab"] iframe').elementHandle()).contentFrame();
    ok(`${L.portal}: frame asli menampilkan persona ${L.pills[1]}`, /embed=1/.test(lf.url()) && (await lf.locator('#role-name').innerText()).includes(L.pills[1]));
    ok(`${L.portal}: frame tetap di portal ${L.portal}`, (await lf.locator('#nav').innerText()).includes(L.portal));
    await p.click('#dxl-labhead [data-dxl="dev"][data-d="mobile"]'); await p.waitForTimeout(300);
    ok(`${L.portal}: Mobile 390 px`, (await p.locator('.dx-cell[data-cell="lab"] iframe').evaluate(f => f.style.width)) === '390px');
    await shot(`${L.route}-02-mobile`);
    await p.click('#dxl-labhead [data-dxl="dev"][data-d="desktop"]');
    ok(`${L.portal}: ${L.sc.length} skenario`, (await p.locator('#dxl-sc option').count()) === L.sc.length);
    for (const [sc, n] of L.sc) {
      await p.click('[data-dxl="restart"]'); await p.waitForTimeout(300);
      await p.selectOption('#dxl-sc', sc); await p.waitForTimeout(400);
      let err = null;
      for (let k = 0; k < n + 2; k++) {
        const b = p.locator('[data-dxl="run"]'); if (!(await b.count())) break;
        await b.click(); await p.waitForTimeout(220);
        const m = await p.locator('.dx-msg').innerText().catch(() => '');
        if (/gagal|terlebih dahulu/i.test(m)) { err = m; break; }
      }
      const r = (await S()).dxlab?.[L.portal]?.runs?.[sc];
      ok(`${L.portal} · ${sc}: ${n} langkah selesai`, !err && r && r.done.length === n, err || (r ? `${r.done.length}/${n}` : 'tanpa run'));
      await shot(`${L.route}-sc-${sc}`);
      const chk = CHECK[`${L.portal}:${sc}`]; if (chk) { const st = await S(); const [name, cond] = chk(st, r.ctx); ok(name, cond); }
    }
    await p.click('[data-dxl="tab"][data-tab="sim"]'); await p.waitForTimeout(1500); await shot(`${L.route}-03-sim`);
    ok(`${L.portal}: Simulator ${L.sim} layar`, (await p.locator('.dx-sim iframe').count()) === L.sim);
    await p.click('[data-dxl="tab"][data-tab="lab"]');
  }
  await p.goto(BASE + 'finance.html#bridge'); await p.waitForTimeout(500);
  ok('Finance tidak berubah: menu Finance tetap ke modul lengkap NV-47', await p.evaluate(() => HL.PORTALS.Finance.items[0][0] === '/?as=U-FIN#/nv/47' && !HL.PORTALS.Finance.items.some(i => /-dx$/.test(i[0]))));
  await p.goto(BASE + 'hrd.html#hrd-dx'); await p.waitForTimeout(1000);
  ok('HRD Demo Center tetap jalan (4 role tim HRD)', (await p.locator('#dxl-labhead [data-dxl="as"]').count()) === 4);
  await p.setViewportSize({ width: 390, height: 844 }); await p.goto(BASE + 'sales.html#sales-dx'); await p.waitForTimeout(1000); await shot('sales-dx-04-phone');
  ok('Layar ponsel: tanpa scroll horizontal', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok('Tanpa error konsol', !errors.length, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(`${fail ? 'GAGAL' : 'LULUS'} · ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})();
