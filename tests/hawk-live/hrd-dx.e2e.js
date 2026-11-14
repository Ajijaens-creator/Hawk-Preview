/* HAWK HRD · uji Demo Experience Center (#hrd-dx) di atas template dx-lab.js (model Demo Center Finance):
   login role tim HRD saja, Desktop/iPad/Mobile, Smart Tutor menjalankan 5 skenario, langkah divisi lain otomatis,
   frame asli berbagi satu sandbox, Simulator 4 layar, tab persona & kinerja tim, mobile.
   python3 -m http.server 8811 lalu node tests/hawk-live/hrd-dx.e2e.js */
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
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: false }); };
  const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('hawk-integrated-demo-v1') || '{}'));
  const frameOf = async (sel) => (await p.locator(sel).elementHandle()).contentFrame();
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  await p.goto(BASE + 'hrd.html#hrd-home'); await p.evaluate(() => localStorage.clear());
  await p.goto(BASE + 'hrd.html#hrd-dx'); await p.reload(); await p.waitForTimeout(1200);
  await shot('DX-01-test-lab');

  const pills = await p.locator('#dxl-labhead [data-dxl="as"]').allInnerTexts();
  ok('Login role hanya tim HRD: Made Gunarsa, Harja, Ayu, Putu Dewi D', pills.length === 4 && ['Made Gunarsa', 'Harja', 'Ayu', 'Putu Dewi D'].every(n => pills.some(x => x.includes(n))), pills.join(' | '));
  ok('Divisi lain tidak punya tombol login (Eni, Mila, Asri)', !pills.some(x => /Eni|Mila|Asri/.test(x)));
  ok('Pilihan perangkat Desktop, iPad, Mobile', (await p.locator('#dxl-labhead [data-dxl="dev"]').allInnerTexts()).join() === 'Desktop,iPad,Mobile');
  ok('Smart Tutor & 5 skenario', (await p.locator('#dxl-sc option').count()) === 5 && /HAWK SMART TUTOR/.test(await p.locator('#dxl-tutor').innerText()));

  await p.click('#dxl-labhead [data-dxl="as"]:has-text("Harja")'); await p.waitForTimeout(900);
  const lf = await frameOf('.dx-cell[data-cell="lab"] iframe');
  ok('Login sebagai Harja → frame asli role Staf HRD', /role=hrd-ops/.test(lf.url()) && /persona=harja/.test(lf.url()));
  ok('Frame menampilkan nama persona (Harja)', /Harja/.test(await lf.locator('#role-name').innerText()));
  await p.click('#dxl-labhead [data-dxl="dev"][data-d="mobile"]'); await p.waitForTimeout(300);
  ok('Mobile: frame 390 px', (await p.locator('.dx-cell[data-cell="lab"]').getAttribute('data-device')) === 'mobile' && (await p.locator('.dx-cell[data-cell="lab"] iframe').evaluate(f => f.style.width)) === '390px');
  await shot('DX-02-mobile');
  await p.click('#dxl-labhead [data-dxl="dev"][data-d="ipad"]'); await p.waitForTimeout(300);
  ok('iPad: frame 834 px', (await p.locator('.dx-cell[data-cell="lab"] iframe').evaluate(f => f.style.width)) === '834px');
  await p.click('#dxl-labhead [data-dxl="dev"][data-d="desktop"]');

  const runAll = async (sc, n) => {
    await p.selectOption('#dxl-sc', sc); await p.waitForTimeout(400);
    for (let k = 0; k < n + 2; k++) {
      const b = p.locator('[data-dxl="run"]');
      if (!(await b.count())) break;
      await b.click(); await p.waitForTimeout(250);
      const m = await p.locator('.dx-msg').innerText().catch(() => '');
      if (/gagal|terlebih dahulu/i.test(m)) return m;
    }
    return null;
  };
  for (const [sc, n] of [['rekrut', 13], ['reception', 5], ['kinerja', 5], ['payroll', 6], ['reflection', 5]]) {
    const err = await runAll(sc, n);
    const r = (await S()).dxlab?.HRD?.runs?.[sc];
    ok(`Skenario ${sc}: semua ${n} langkah selesai lewat Smart Tutor`, !err && r && r.done.length === n, err || (r ? `${r.done.length}/${n}` : 'tanpa run'));
    await shot(`DX-${sc}`);
  }
  const st = await S(), h = st.hr, c = st.dxlab.HRD.runs.rekrut.ctx;
  ok('Rekrutmen: karyawan baru, penempatan Spa Ubud terjadwal', h.placements.some(pl => pl.emp === c.emp && pl.location === 'OUT-UBD'));
  ok('Audit atas nama persona (Harja, Ayu, Made)', ['Harja (Koordinator Rekrutmen)', 'Ayu (Admin HRD)', 'Made Gunarsa (Manager HRD)'].every(n => h.audit.some(a => a.by === n)));
  ok('Langkah divisi lain berjalan otomatis (Mila, Eni Restini, Asri)', ['Mila (Supervisor Spa Ubud)', 'Eni Restini (Operational Manager)'].every(n => h.audit.some(a => a.by === n)) && st.dxlab.HRD.runs.payroll.log.some(l => /Asri/.test(l.by)));
  ok('Payroll: Finance Manager menerima jurnal November', h.f7.batches.find(b => b.period === '2611').handoff.status === 'Diterima Finance');
  ok('Reflection: keputusan STRACON + Workplan', !!st.dxlab.HRD.runs.reflection.ctx.dec && !!st.dxlab.HRD.runs.reflection.ctx.wp);
  const lf2 = await frameOf('.dx-cell[data-cell="lab"] iframe');
  ok('Frame berbagi sandbox yang sama (lowongan baru terlihat di frame)', await lf2.evaluate((v) => JSON.stringify(HL.state).includes(v), c.vac));
  const before = await p.locator('.dx-cell[data-cell="lab"] iframe').elementHandle();
  await p.evaluate(() => { document.querySelector('.dx-cell[data-cell="lab"] iframe').dataset.mark = 'x'; HL.render(); }); await p.waitForTimeout(200);
  ok('Render ulang halaman tidak memuat ulang frame', (await p.locator('.dx-cell[data-cell="lab"] iframe').getAttribute('data-mark')) === 'x' && !!before);

  await p.click('[data-dxl="tab"][data-tab="sim"]'); await p.waitForTimeout(1500); await shot('DX-03-simulator');
  const simSrc = await p.locator('.dx-sim iframe').evaluateAll(fs => fs.map(f => f.src));
  ok('Simulator 4 layar: Made, Harja, Ayu, Lead HG', simSrc.length === 4 && ['made', 'harja', 'ayu', 'hg'].every(x => simSrc.some(s => s.includes('persona=' + x))));
  ok('Simulator: perangkat berbeda (Desktop, iPad, Mobile)', (await p.locator('.dx-sim .dx-cell').evaluateAll(cs => cs.map(c => c.dataset.device))).join() === 'desktop,desktop,ipad,mobile');
  await p.click('[data-dxl="tab"][data-tab="extra"]'); await p.waitForTimeout(300); await shot('DX-04-tim');
  const ex = await p.locator('#dxl-extra').innerText();
  ok('Kinerja tim HRD: Made Gunarsa, Harja, Ayu, Putu Dewi D', /Kinerja tim HRD/.test(ex) && ['Made Gunarsa', 'Harja', 'Ayu', 'Putu Dewi D'].every(n => ex.includes(n)));
  ok('Fokus portal HRD: tanpa panel divisi lain', !/Production · JAENS Essence|Kinerja tim per divisi/.test(ex));

  await p.click('[data-dxl="tab"][data-tab="lab"]'); await p.selectOption('#dxl-sc', 'payroll'); await p.waitForTimeout(200);
  await p.click('[data-dxl="restart"]'); await p.waitForTimeout(400);
  const rs = await S();
  ok('Mulai ulang: data demo kembali ke awal, progres 0', (rs.dxlab.HRD.runs.payroll.done.length === 0) && !(rs.hr?.f7?.batches || []).some(b => b.period === '2611' && b.handoff));

  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(BASE + 'hrd.html#hrd-dx'); await p.waitForTimeout(900);
  const w = await p.evaluate(() => document.documentElement.scrollWidth);
  ok('Halaman Demo Center di layar 390 px', w <= 392, String(w)); await shot('DX-05-mobile-page');
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-dx-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
