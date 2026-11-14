/* JAENS HRD · Direktori karyawan asli ONLINE (wajib login) — alur layar dengan API tiruan di dalam uji.
   /api/hr dilayani oleh api/_lib/hr-core.js asli (penyimpanan memori, karyawan FIKTIF). Tidak ada data asli.
   python3 -m http.server 8811 lalu node tests/hawk-live/hrd-online.e2e.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { handle, hashPassword } = require('../../api/_lib/hr-core');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const mem = {}; const store = { async read(p) { return mem[p] || null; }, async write(p, t) { mem[p] = t; } };
const env = { HR_DATA_KEY: crypto.randomBytes(32).toString('base64'), HR_SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
  HR_BOOTSTRAP_USERS: JSON.stringify([{ email: 'owner@fiktif.test', name: 'Owner Fiktif', role: 'owner', hash: hashPassword('Awal-Fiktif-1') }]) };
const emp = (n) => { const id = String(n).padStart(3, '0'), job = n % 3 ? 'Therapist' : 'Receptionist';
  return { id, name: `Karyawan Fiktif ${id}`, job, fn: 'Spa Operations', tabs: { pribadi: [{ k: 'Nama lengkap', v: `Karyawan Fiktif ${id}`, s: false }, { k: 'NIK', v: '9999' + id.padStart(12, '0'), s: true }, { k: 'Golongan darah', v: '', s: false }], kontak: [{ k: 'Alamat domisili', v: 'Jl. Fiktif ' + id, s: true }], kepegawaian: [{ k: 'Jabatan', v: job, s: false }], ess: [{ k: 'Username', v: `${id}@fiktif.test`, s: false }] }, sources: { pribadi: { file: `${id}.pdf`, sha256: 'cd'.repeat(32), importedAt: '2026-11-14T10:00:00Z' } }, placement: null }; };
const exportFile = { format: 'jaens-hr-export', version: 1, exportedAt: '2026-11-14T15:00:00Z', source: { pdfCount: 120, employees: 30 }, employees: Array.from({ length: 30 }, (_, i) => emp(i + 1)) };
let cookie = '';
(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.route('**/api/hr*', async (route) => {
    const rq = route.request(), url = new URL(rq.url());
    let body = {}; try { body = JSON.parse(rq.postData() || '{}'); } catch (e) {}
    try {
      const r = await handle({ env, store, now: () => Date.now() }, { op: url.searchParams.get('op'), method: rq.method(), query: Object.fromEntries(url.searchParams), body, cookie, header: rq.headers()['x-jaens-hr'], origin: rq.headers().origin, host: url.host });
      if (r.setCookie !== undefined) cookie = r.setCookie;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r.body) });
    } catch (e) { await route.fulfill({ status: e.status || 500, contentType: 'application/json', body: JSON.stringify({ error: e.message }) }); }
  });
  const go = async (h) => { await p.evaluate((x) => { location.hash = x; }, h); await p.waitForTimeout(400); };
  await p.goto(BASE + 'hrd.html#hrd-roster'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('jaens-hr-api', '1'); }); await p.reload(); await p.waitForTimeout(900);
  ok('Tanpa login: hanya ringkasan angka + form login, tanpa daftar nama', await p.locator('form[data-hro=login]').isVisible() && await p.locator('[data-real-summary]').count() === 1 && !(await p.locator('[data-real-online]').count()));
  await p.fill('form[data-hro=login] input[name=email]', 'owner@fiktif.test'); await p.fill('form[data-hro=login] input[name=password]', 'salah-sekali');
  await p.click('form[data-hro=login] button[type=submit]'); await p.waitForTimeout(400);
  ok('Password salah: pesan umum', /Email atau password salah/.test(await p.locator('.hro-alert.bad').innerText()));
  await p.fill('form[data-hro=login] input[name=email]', 'owner@fiktif.test'); await p.fill('form[data-hro=login] input[name=password]', 'Awal-Fiktif-1');
  await p.click('form[data-hro=login] button[type=submit]'); await p.waitForTimeout(400);
  ok('Login pertama: wajib ganti password, data belum tampil', await p.locator('form[data-hro=password]').isVisible() && !(await p.locator('[data-real-online]').count()));
  await p.fill('input[name=current]', 'Awal-Fiktif-1'); await p.fill('input[name=next]', 'Baru-Fiktif-Kuat-1'); await p.fill('input[name=again]', 'Baru-Fiktif-Kuat-1');
  await p.click('form[data-hro=password] button[type=submit]'); await p.waitForTimeout(500);
  ok('Setelah ganti password: direktori online tampil (masih kosong)', await p.locator('[data-real-online]').isVisible() && /Password berhasil diganti/.test(await p.locator('.hro-alert.ok').innerText()));
  fs.mkdirSync(path.join(__dirname, '.tmp'), { recursive: true }); const f = path.join(__dirname, '.tmp', 'export-fiktif.json'); fs.writeFileSync(f, JSON.stringify(exportFile));
  await p.setInputFiles('form[data-hro=import] input[type=file]', f); await p.click('form[data-hro=import] button[type=submit]'); await p.waitForTimeout(600); fs.unlinkSync(f);
  ok('Impor file ekspor fiktif: 30 baru', /30 baru/.test(await p.locator('.hro-alert.ok').innerText()));
  const kpis = await p.locator('[data-real-online] .kpi .val').allInnerTexts();
  ok('Kartu dari server: 30 / Therapist 20 / Receptionist 10 / menunggu 30', JSON.stringify(kpis) === '["30","20","10","30"]', JSON.stringify(kpis));
  ok('Tabel 25 baris per halaman, ID berawalan nol', await p.locator('[data-real-online] tbody tr').count() === 25 && (await p.locator('[data-real-online] tbody tr:first-child td:nth-child(2)').innerText()).trim() === '001');
  if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, 'ONLINE-01-direktori-fiktif.png'), fullPage: true }); }
  await p.click('[data-hro-act=next]'); await p.waitForTimeout(300);
  ok('Halaman 2 berisi 5 baris', await p.locator('[data-real-online] tbody tr').count() === 5);
  await p.click('[data-hro-act=prev]'); await p.waitForTimeout(300);
  await p.fill('form[data-hro=filter] input[name=q]', 'Fiktif 003'); await p.click('form[data-hro=filter] button[type=submit]'); await p.waitForTimeout(300);
  ok('Cari nama: 1 hasil', await p.locator('[data-real-online] tbody tr').count() === 1);
  await p.fill('form[data-hro=filter] input[name=q]', ''); await p.click('form[data-hro=filter] button[type=submit]'); await p.waitForTimeout(300);
  await p.check('[data-hro-sel="001"]'); await p.waitForTimeout(200); await p.check('[data-hro-sel="002"]'); await p.waitForTimeout(200);
  await p.selectOption('form[data-hro=place] select[name=location]', 'Spa Shanti'); await p.fill('form[data-hro=place] input[name=division]', 'Operational'); await p.fill('form[data-hro=place] input[name=basis]', 'SK uji fiktif');
  await p.click('form[data-hro=place] button[type=submit]'); await p.waitForTimeout(500);
  ok('Penempatan massal 2 karyawan + riwayat batch', /2 karyawan ditetapkan/.test(await p.locator('.hro-alert.ok').innerText()) && (await p.locator('[data-real-online] .kpi .val').allInnerTexts())[3] === '28' && await p.locator('[data-hro-act=revert]').count() === 1);
  await p.click('[data-hro-act=revert]'); await p.waitForTimeout(500);
  ok('Batalkan batch: menunggu kembali 30', (await p.locator('[data-real-online] .kpi .val').allInnerTexts())[3] === '30');
  await p.click('a[href="#hrd-roster?real=001"]'); await p.waitForTimeout(600);
  const detail = await p.locator('[data-real-detail]').innerText();
  ok('Detail: NIK tersamar, nilai kosong = "Belum tersedia pada sumber", sumber file + SHA', /\*\*\*\*0001/.test(detail) && /tersamar/.test(detail) && /Belum tersedia pada sumber/.test(detail) && /001\.pdf · SHA-256 cdcdcdcdcdcd/.test(detail));
  await p.click('[data-hro-act=reveal]'); await p.waitForTimeout(500);
  ok('Owner membuka data sensitif (tercatat)', /9999000000000001/.test(await p.locator('[data-real-detail]').innerText()) && /tercatat di log audit/.test(await p.locator('[data-real-detail]').innerText()));
  await p.click('[data-hro-act=tab][data-tab=kontak]'); await p.waitForTimeout(300);
  ok('Tab Kontak', /Alamat domisili/.test(await p.locator('[data-real-detail]').innerText()));
  await go('hrd-roster'); await p.click('[data-hro-act=logout]'); await p.waitForTimeout(500);
  ok('Keluar: kembali ke ringkasan + login, daftar hilang', await p.locator('form[data-hro=login]').isVisible() && !(await p.locator('[data-real-online]').count()));
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-online-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
