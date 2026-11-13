/* HAWK HRD F4 · uji browser (Playwright) mengikuti urutan review NB F4, termasuk halaman publik karier.html.
   python3 -m http.server 8811   lalu   BASE=http://localhost:8811/hawk-live/ node tests/hawk-live/hrd-f4.e2e.js */
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
  const status = () => p.locator('#view .status, #status').first().innerText();
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: true }); };
  const setRole = async (r) => { await p.selectOption('#role', r); await p.waitForTimeout(150); };
  const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('hawk-integrated-demo-v1')).hr);
  const act = async (sel) => { await p.click(sel); await p.waitForTimeout(180); };
  await go('hrd-home'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(200);

  /* Jalur 1: NV04 → NV02 → NV03 → NV05 → NV06 */
  await go('hrd-rec-manage'); await shot('F4-NV04-permintaan');
  const rf = p.locator('form[data-submit="hr:req-create"]');
  await rf.locator('[name=position]').selectOption('POS-THR'); await rf.locator('[name=outlet]').selectOption('OUT-UBD'); await rf.locator('[name=count]').fill('2'); await rf.locator('[name=skills]').fill('Balinese, hot stone'); await rf.locator('[name=source]').fill('Utility Spa Ubud 106%');
  await rf.locator('button').click(); await p.waitForTimeout(200);
  const req = (await S()).f4.reqs.slice(-1)[0].id;
  ok('NV04 permintaan Therapist Spa Ubud dibuat, menunggu persetujuan', /Menunggu Persetujuan/.test(await p.locator(`tr:has-text("${req}")`).innerText()), req);
  await act(`tr:has-text("${req}") [data-action="hr:req-approve"]`);
  ok('Manager HRD tidak bisa melewati tahap Operational Manager', /Tahap aktif: Operational Manager/.test(await status()));
  await setRole('ops-manager'); await go('hrd-rec-manage'); await act(`tr:has-text("${req}") [data-action="hr:req-approve"]`);
  await setRole('hrd'); await go('hrd-rec-manage'); await act(`tr:has-text("${req}") [data-action="hr:req-approve"]`);
  ok('Dua tahap persetujuan → Disetujui', /Disetujui/.test(await p.locator(`tr:has-text("${req}")`).innerText()));
  await go('hrd-rec-manage');
  await act(`tr:has-text("${req}") [data-action="hr:vac-publish"]:not([data-mode])`);
  const vac = (await S()).f4.reqs.find(r => r.id === req).vacancy;
  ok('Lowongan dipublikasikan dari formasi & outlet yang disetujui', p.url().includes('tab=vac') && /Dipublikasikan/.test(await p.locator(`tr:has-text("${vac}")`).innerText()) && /Spa Ubud/.test(await p.locator(`tr:has-text("${vac}")`).innerText()), vac);
  await shot('F4-NV04-lowongan');
  /* halaman publik */
  await p.goto(BASE + 'karier.html'); await p.waitForTimeout(250); await shot('F4-NV01-landing-publik');
  ok('NV01 publik: lowongan Therapist Spa Ubud terlihat tanpa login', (await p.locator(`a[href*="${vac}"]`).count()) === 1);
  ok('Draf & internal tidak muncul di landing publik', !(await p.locator('#view').innerText()).includes('Content Creator'));
  await p.selectOption('#filters [name=outlet]', 'OUT-BSM'); await p.waitForTimeout(150);
  ok('Filter outlet Bhisma hanya menampilkan Receptionist', (await p.locator('.hr-vac').count()) === 1 && /Receptionist/.test(await p.locator('.hr-vac').innerText()));
  await p.goto(BASE + `karier.html#job=${vac}&ch=IG`); await p.waitForTimeout(200); await shot('F4-NV02-detail-publik');
  ok('NV02 tautan kanal IG membuka lowongan yang sama + kode kanal', /Therapist · Spa Ubud/.test(await p.locator('#view').innerText()) && /kanal IG/.test(await p.locator('#view').innerText()));
  await p.goto(BASE + 'karier.html#job=VAC-2610-009'); await p.waitForTimeout(150);
  ok('Lowongan ditutup dari tautan lama: tidak menerima lamaran', /Tidak menerima lamaran/.test(await p.locator('#view').innerText()) && (await p.locator('a:has-text("Lamar sekarang")').count()) === 0);
  await p.goto(BASE + `karier.html#apply=${vac}&ch=IG`); await p.waitForTimeout(200);
  const F = p.locator('form.hr-apply');
  ok('NV03 formulir Therapist berisi pertanyaan teknik treatment', /Teknik treatment/.test(await F.innerText()) && !/front desk/i.test(await F.innerText()));
  await F.locator('[name=name]').fill('Ni Komang Uji Lamaran'); await F.locator('[name=email]').fill('uji.lamaran@example.invalid'); await F.locator('[name=phone]').fill('0812-9999-0001');
  await F.locator('[name=techniques]').fill('Balinese massage, hot stone'); await F.locator('[name=years]').fill('2'); await F.locator('[name=cert]').fill(''); await F.locator('[name=sessions]').fill('5'); await F.locator('[name=lang]').fill('Indonesia, Inggris');
  await F.locator('[name=situational]').fill('Saya tanya kenyamanan tamu dan kurangi tekanan.'); await F.locator('[name=docs]').fill('cv.pdf, foto.exe');
  ok('Tombol kirim muncul hanya setelah tinjau', !(await F.locator('[data-career-send]').isVisible()));
  await F.locator('[data-career-review]').click(); await p.waitForTimeout(100);
  ok('Tinjau sebelum kirim menampilkan ringkasan jawaban', /Ni Komang Uji Lamaran/.test(await F.locator('.hr-review-box').innerText()) && (await F.locator('[data-career-send]').isVisible()));
  await F.locator('[name=consent]').check(); await F.locator('[data-career-send]').click(); await p.waitForTimeout(200);
  ok('Lampiran tidak valid ditolak', /foto\.exe.*ditolak/.test(await p.locator('#status').innerText()));
  await p.goto(BASE + `karier.html#apply=${vac}&ch=IG`); await p.waitForTimeout(200);
  const key = await F.locator('[name=submitKey]').inputValue();
  await F.locator('[name=name]').fill('Ni Komang Uji Lamaran'); await F.locator('[name=email]').fill('uji.lamaran@example.invalid'); await F.locator('[name=phone]').fill('0812-9999-0001');
  await F.locator('[name=techniques]').fill('Balinese massage, hot stone'); await F.locator('[name=years]').fill('2'); await F.locator('[name=sessions]').fill('5'); await F.locator('[name=lang]').fill('Indonesia, Inggris'); await F.locator('[name=situational]').fill('Saya tanya kenyamanan tamu dan kurangi tekanan.');
  await F.locator('[name=consent]').check(); await F.locator('[data-career-review]').click(); await F.locator('[data-career-send]').click(); await p.waitForTimeout(250);
  await shot('F4-NV03-konfirmasi');
  const conf = await p.locator('#view').innerText(); const app = (conf.match(/APP-2611-\d+/) || [])[0];
  ok('NV03 konfirmasi dengan nomor lamaran & kanal IG', !!app && /Kanal: IG/.test(conf), app);
  const n0 = (await S()).f4.apps.length;
  await p.evaluate(([v, k]) => { const s = JSON.parse(localStorage.getItem('hawk-integrated-demo-v1')); const id = HR.update(s, 'app-submit', { role: 'public', vac: v, submitKey: k, name: 'X', email: 'x@example.invalid', consent: '1' }); localStorage.setItem('hawk-integrated-demo-v1', JSON.stringify(s)); return id; }, [vac, key]);
  ok('Retry dengan kunci yang sama tidak membuat lamaran tambahan', (await S()).f4.apps.length === n0);
  /* internal */
  await go('hrd-rec-candidates'); await shot('F4-NV05-pipeline');
  ok('NV05 lamaran publik masuk pipeline', (await p.locator(`a[href*="${app}"]`).count()) === 1);
  ok('Kandidat dua posisi: satu profil, dua Application ID', /2 lamaran/.test(await p.locator('tr:has-text("APP-2611-0003")').innerText()));
  await p.click(`a[href*="id=${app}"]`); await p.waitForTimeout(150);
  await act('button[data-action="hr:screen-run"][data-fail="1"]');
  ok('Screening gagal ditampilkan & bisa dicoba lagi', /gagal/i.test(await text()) && (await p.locator('button:has-text("Coba lagi")').count()) === 1);
  await act('button:has-text("Coba lagi")'); await shot('F4-NV06-screening');
  ok('NV06 bukti per kriteria; sertifikat kosong → Perlu Klarifikasi', /Sertifikasi terapis\s+Perlu Klarifikasi/.test(await text()) && /Dikecualikan dari penilaian AI: Foto, KTP/.test(await text()));
  await act('button[data-action="hr:app-clarify"]');
  const card1 = new URL(p.url()).hash; const tsk = ((await S()).f4.apps.find(a => a.id === app).clarify || [])[0];
  await go(`hrd-rec-candidates?id=${app}`); await act('button[data-action="hr:app-clarify"]');
  ok('Satu kartu klarifikasi F3 (klik ulang tidak menggandakan)', (await S()).f4.apps.find(a => a.id === app).clarify.length === 1 && (await S()).f3.tasks.filter(t => t.source?.id === app).length === 1, tsk);
  await go(`hrd-task?id=${tsk}`);
  ok('Kartu klarifikasi menaut ke lamaran sumber', (await p.locator(`a[href*="hrd-rec-candidates?id=${app}"]`).count()) === 1);
  await go(`hrd-rec-candidates?id=${app}`);
  await p.locator('form[data-submit="hr:app-answer"] [name=field]').selectOption('cert'); await p.fill('form[data-submit="hr:app-answer"] [name=value]', 'LSP Spa Therapist 2024'); await p.click('form[data-submit="hr:app-answer"] button'); await p.waitForTimeout(150);
  await act('button[data-action="hr:app-stage"][data-to="Shortlist"]');
  ok('Reviewer shortlist setelah klarifikasi', (await S()).f4.apps.find(a => a.id === app).stage === 'Shortlist');

  /* Jalur 2: NV07 → NV08 → NV09 */
  await go(`hrd-rec-schedule?id=${app}`);
  const sf = p.locator('form[data-submit="hr:iv-schedule"]');
  await sf.locator('[name=slot]').fill('2026-11-16 10:00'); await sf.locator('[name=iv2]').selectOption('EMP-0153'); await sf.locator('button').click(); await p.waitForTimeout(150);
  ok('Slot bentrok dengan interview lain ditolak', /Bentrok/.test(await status()));
  await sf.locator('[name=slot]').fill('2026-11-18 14:00'); await sf.locator('[name=fail]').check(); await sf.locator('button').click(); await p.waitForTimeout(150);
  const ev1 = (await S()).f4.apps.find(a => a.id === app).interview.eventId;
  ok('Gagal sinkron kalender ditampilkan', /Gagal sinkron/.test(await text()));
  await act('button[data-action="hr:iv-sync-retry"]');
  await sf.locator('[name=slot]').fill('2026-11-19 10:00'); await sf.locator('button').click(); await p.waitForTimeout(150); await shot('F4-NV07-jadwal');
  const iv = (await S()).f4.apps.find(a => a.id === app).interview;
  ok('Jadwal ulang & retry memakai Event ID yang sama, tanpa undangan ganda', iv.eventId === ev1 && iv.invites === 1 && iv.history.length === 3 && iv.sync === 'OK', `${ev1} · undangan ${iv.invites}`);
  await go(`hrd-rec-interview?id=${app}`);
  ok('NV08 rubric Therapist: demonstrasi treatment & kebersihan', /Demonstrasi teknik/.test(await text()) && /Kebersihan/.test(await text()));
  for (let i = 0; i < 4; i++) await p.selectOption(`form[data-submit="hr:iv-score"] [name=s${i}]`, String([4, 5, 4, 4][i]));
  await p.fill('form[data-submit="hr:iv-score"] [name=note]', 'Teknik rapi, komunikasi baik'); await p.click('form[data-submit="hr:iv-score"] button'); await p.waitForTimeout(150); await shot('F4-NV08-rubric');
  ok('Rubric tersimpan, rata-rata 4.3', /Rata-rata 4\.3/.test(await text()));
  await go(`hrd-rec-offer?id=${app}`);
  await p.selectOption('form[data-submit="hr:rec-decide"] [name=value]', 'Ditolak'); await p.fill('form[data-submit="hr:rec-decide"] [name=reason]', 'Uji perubahan keputusan'); await p.click('form[data-submit="hr:rec-decide"] button'); await p.waitForTimeout(150);
  ok('Keputusan Ditolak punya status akhir sendiri', (await S()).f4.apps.find(a => a.id === app).stage === 'Ditolak');
  /* buka kembali via model untuk menguji perubahan keputusan tercatat */
  await p.evaluate((id) => { const s = JSON.parse(localStorage.getItem('hawk-integrated-demo-v1')); const a = s.hr.f4.apps.find(x => x.id === id); a.stage = 'Keputusan'; localStorage.setItem('hawk-integrated-demo-v1', JSON.stringify(s)); }, app);
  await go(`hrd-rec-offer?id=${app}`); await p.reload(); await p.waitForTimeout(150);
  await p.selectOption('form[data-submit="hr:rec-decide"] [name=value]', 'Diterima'); await p.fill('form[data-submit="hr:rec-decide"] [name=reason]', 'Rubric 4.3, sertifikat terverifikasi'); await p.click('form[data-submit="hr:rec-decide"] button'); await p.waitForTimeout(150);
  ok('Perubahan keputusan tercatat (riwayat dicoret)', (await p.locator('s:has-text("Ditolak")').count()) === 1);
  await p.fill('form[data-submit="hr:offer-send"] [name=start]', '2026-11-13'); await p.click('form[data-submit="hr:offer-send"] button'); await p.waitForTimeout(150);
  await shot('F4-NV09-penawaran');
  await act('button[data-action="hr:offer-respond"][data-answer="accept"]');
  ok('Penawaran diterima membuka tahap kontrak', p.url().includes('hrd-rec-contract') && /CTR-2611/.test(await text()));

  /* Jalur 3: NV10 → NV11 → NV12 */
  await act('button[data-action="hr:contract-sign"]');
  ok('Tanda tangan sebelum verifikasi KTP/foto ditolak', /Verifikasi KTP/.test(await status()));
  await act('button[data-action="hr:doc-verify"][data-kind="KTP"]'); await act('button[data-action="hr:doc-verify"][data-kind="Foto"]'); await act('button[data-action="hr:contract-sign"]');
  await shot('F4-NV10-kontrak');
  const emp = (await S()).f4.apps.find(a => a.id === app).emp;
  ok('NV10 kontrak ditandatangani & terhubung ke Employee ID', /Ditandatangani/.test(await text()) && !!emp && (await p.locator(`a[href*="emp=${emp}"]`).count()) >= 1, emp);
  await setRole('hg-lead'); await go(`hrd-rec-contract?id=${app}`);
  ok('HG Lead → Kontrak & dokumen = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await setRole('hrd'); await go(`hrd-rec-onboard?id=${app}`);
  await act('button[data-action="hr:onboard-create"]'); await go(`hrd-rec-onboard?id=${app}`); await shot('F4-NV11-onboarding');
  const ob = (await S()).f4.apps.find(a => a.id === app).onboarding;
  ok('NV11 paket onboarding: subtugas HRD, HG & Supervisor di Planner', /HRD/.test(await text()) && /HG/.test(await text()) && /Mila/.test(await text()), ob);
  await p.evaluate((id) => HL.apply('hr:onboard-create', { id }), app); await p.waitForTimeout(150);
  ok('Mengulang paket onboarding membuka tugas yang sama', (await S()).f3.tasks.filter(t => t.parent === ob).length === 6 && (await S()).f4.apps.find(a => a.id === app).onboarding === ob);
  await go(`hrd-rec-place?id=${app}`); await p.click('form[data-submit="hr:place-approve"] button'); await p.waitForTimeout(150); await shot('F4-NV12-penempatan');
  ok('NV12 penempatan & akun disetujui, status Aktif', /Aktif/.test(await text()) && /Karyawan \(ESS\)/.test(await text()));
  await go('hrd-roster?outlet=OUT-UBD');
  ok('Satu profil baru di roster Spa Ubud (31 = 30 + 1 rekrutan)', (await p.locator('.active-filters').innerText()).startsWith('31 orang'));
  await go(`hrd-roster?emp=${emp}`);
  ok('Profil karyawan baru: Therapist Spa Ubud, atasan Mila, PKWT', /Therapist/.test(await text()) && /Atasan\s+Mila/.test(await text()) && /PKWT/.test(await text()));
  await go(`hrd-audit?q=${emp}`);
  ok('Konversi & penempatan dapat diaudit', /Konversi kandidat|Penempatan & akun/.test(await text()));

  /* Jalur 4: Receptionist, akses, mobile */
  await go('hrd-career-apply?id=VAC-2611-002');
  ok('Formulir Receptionist berbeda (slot ganda, booking/POS)', /dua tamu memesan slot yang sama/i.test(await text()) && /booking\/POS/i.test(await text()) && !/Teknik treatment/.test(await text()));
  await go('hrd-rec-interview?id=APP-2611-0004');
  ok('Rubric Receptionist: simulasi reservasi & transaksi', /Simulasi reservasi/.test(await text()) || /reservasi/.test(await text()));
  await setRole('finance-manager'); await go('hrd-rec-candidates');
  ok('Finance Manager → Rekrutmen = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await setRole('therapist'); await go('hrd-rec-candidates?id=APP-2611-0001');
  ok('Therapist ESS → detail kandidat = Akses ditolak', (await p.locator('.hr-denied').count()) === 1);
  await setRole('hrd'); await go('hrd-rec-candidates?ch=REF');
  ok('Filter tanpa hasil → keadaan kosong', (await p.locator('.hr-empty').count()) === 1);
  await p.setViewportSize({ width: 390, height: 844 });
  for (const r of ['hrd-rec-candidates', `hrd-rec-candidates?id=${app}`, 'hrd-rec-manage']) { await go(r); const w = await p.evaluate(() => document.documentElement.scrollWidth); ok(`Mobile 390 px: ${r}`, w <= 392, String(w)); await shot('F4-mobile-' + r.split(/[?&=]/).join('-')); }
  for (const r of ['', `#apply=VAC-2611-002`]) { await p.goto(BASE + 'karier.html' + r); await p.waitForTimeout(200); const w = await p.evaluate(() => document.documentElement.scrollWidth); ok(`Mobile 390 px publik: karier.html${r}`, w <= 392, String(w)); await shot('F4-mobile-karier' + (r ? '-apply' : '')); }
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-f4-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
