/* HAWK Operational · A03 F-OP07/F-OP11: Hospitality Case Workbench, satu penghitung case/issue, DX-OP09..11.
   Frontend + fixture lokal saja (simulasi); bukan uji backend.
   python3 -m http.server 8811 dari root repo, lalu: node tests/hawk-live/ops-cases.e2e.js  (SHOTS=dir untuk screenshot) */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', x => errors.push(x.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n) => { if (SHOTS) { await p.waitForTimeout(250); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const as = (id) => ev((i) => OPX.actions['account-select']({ dataset: { id: i } }), id);
  const go = async (r) => { await p.goto(BASE + 'operational.html#' + r); await p.waitForTimeout(350); };
  const form = (n, o) => ev(([n, o]) => { const fd = new FormData(); Object.entries(o).forEach(([k, v]) => fd.append(k, v)); return OPX.forms[n](fd); }, [n, o]);
  const text = () => ev(() => document.getElementById('opx-root').innerText);
  const entry = (dash, group, outlet, values) => form('analyticsEntry', Object.assign({ dashboardId: dash, group, recordId: '', outlet, date: '2026-10-30', intent: 'submitted', evidence: 'Bukti demo e2e (simulasi)' }, Object.fromEntries(Object.entries(values).map(([k, v]) => ['v_' + k, v]))));
  const review = (id, decision, note = '') => form('analyticsReview', { recordId: id, decision, note, checked: 'on' });
  const counts = async () => { await go('op-dashboard'); const a = (await text()).match(/(\d+) issue perlu tindak lanjut/); await go('op-communication'); const b = (await text()).match(/Issue Center (\d+)/); return [a && +a[1], b && +b[1]]; };

  await p.goto(BASE + 'operational.html'); await ev(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);

  /* ---------- satu penghitung ---------- */
  for (const id of ['mgr-eni', 'hosp-jro-okta', 'spv-SHT', 'reception-TRL']) {
    await as(id); const [cc, hub] = await counts();
    ok(`Command Center = Communication Hub untuk ${id}`, cc !== null && cc === hub, `${cc} vs ${hub}`);
  }
  ok('Seed: case tamu di SHT/TRL/BSM, Ubud kosong untuk DX', await ev(() => { const g = OPX.state.data.issues.filter(i => i.kind === 'guest'); return g.length === 3 && !g.some(i => i.outlet === 'CTR'); }));

  /* ---------- Workbench & akses ---------- */
  await as('hosp-jro-okta'); await go('op-cases');
  const wb = await text();
  ok('Workbench tampil untuk Jro Okta dengan SLA draft dan aging', /Hospitality Case Workbench|Case tamu terbuka/.test(wb) && /draft v0/.test(wb) && /Aging tertua/.test(wb));
  ok('Menu Hospitality Case di sidebar setelah Communication Hub', await ev(() => { const h = [...document.querySelectorAll('#nav a')].map(a => a.getAttribute('href')); return h.indexOf('#op-cases') === h.indexOf('#op-communication') + 1; }));
  await shot('CASE-01-workbench');
  await as('therapist-CTR'); await go('op-cases');
  ok('Therapist tidak punya akses Workbench', /Tidak berwenang/.test(await text()));
  await as('spv-CTR'); await go('op-cases');
  ok('Supervisor Ubud hanya melihat case outlet sendiri', await ev(() => OPX.cases.guest().every(c => c.outlet === 'CTR')));

  /* ---------- DX-OP09: treatment → feedback → case → verifikasi ---------- */
  ok('Skenario baru DX-OP09..11 terdaftar (8 A02 + 3 A03)', await ev(() => ['guest-case', 'waste-opname', 'correction'].every(id => OPX.demo.getScenario(id)) && OPX.demo.scenarios.length === 12));
  await as('mgr-eni'); await ev(() => { OPX.state.outletId = 'CTR'; OPX.save(); });
  ok('DX-OP09 tersedia di Ubud', await ev(() => OPX.demo.availability('guest-case', 'CTR').ok), await ev(() => OPX.demo.availability('guest-case', 'CTR').reason));
  await ev(() => OPX.demo.start('guest-case', 'CTR')); await p.waitForTimeout(300);
  const step = () => ev(() => { const r = OPX.demo.sync(); return OPX.demo.getScenario('guest-case').steps.map((_, i) => OPX.demo.evaluateStep(r, i).complete); });
  await as('reception-CTR');
  await entry('reviews', 'feedback', 'CTR', { visitRef: 'VIS-E2E-CASE-1', channel: 'Offline', platform: 'Form outlet', rating: '2', satisfaction: 'Tidak puas', comment: 'Ruang terasa dingin (demo)' });
  ok('DX-OP09 langkah 1: feedback rendah tercatat', (await step())[0]);
  await as('hosp-jro-okta'); await ev(() => { OPX.state.outletId = 'CTR'; OPX.save(); }); await go('op-cases');
  ok('Feedback rendah muncul di antrean Workbench', /Feedback perlu tindak lanjut/.test(await text()));
  const fbId = await ev(() => OPX.analytics.ensure().records.find(r => r.values.visitRef === 'VIS-E2E-CASE-1').id);
  await ev((id) => OPX.actions['case-from-feedback']({ dataset: { id } }), fbId); await p.waitForTimeout(150);
  ok('Form case dari feedback terisi otomatis (visit, sumber)', await ev(() => /VIS-E2E-CASE-1/.test(document.querySelector('#modal-root').innerHTML) && /Feedback kunjungan/.test(document.querySelector('#modal-root [name=source]').value)));
  await form('caseCreate', { outlet: 'CTR', feedbackRef: fbId, title: 'Feedback rating 2: ruang dingin', source: 'Feedback kunjungan', category7P: 'Facility', visitRef: 'VIS-E2E-CASE-1', priority: 'Normal', note: 'Tamu mengeluh ruang dingin.' });
  const cid = await ev((fb) => OPX.state.data.issues.find(i => i.feedbackRef === fb)?.id, fbId);
  ok('DX-OP09 langkah 2: case tertaut feedback yang sama', !!cid && (await step())[1], cid);
  ok('Feedback tidak bisa dibuka dua kali sebagai case', await ev((fb) => { OPX.forms.caseCreate((() => { const f = new FormData(); Object.entries({ outlet: 'CTR', feedbackRef: fb, title: 'Duplikat case uji', source: 'Feedback kunjungan', category7P: 'Facility', note: 'duplikat' }).forEach(([k, v]) => f.append(k, v)); return f; })()); return OPX.state.data.issues.filter(i => i.feedbackRef === fb).length === 1; }, fbId));
  await shot('CASE-02-drawer-baru');
  await as('reception-CTR');
  await form('caseStep', { id: cid, what: 'triage', pic: 'spv-CTR', priority: 'Normal', note: 'Coba triase oleh Reception' });
  ok('Reception tidak bisa triase', await ev((id) => OPX.state.data.issues.find(i => i.id === id).caseState, cid) === 'baru');
  await as('hosp-jro-okta'); await ev(() => { OPX.state.outletId = 'CTR'; OPX.save(); });
  await form('caseStep', { id: cid, what: 'triage', pic: 'spv-CTR', priority: 'Normal', note: 'PIC Supervisor Ubud' });
  ok('DX-OP09 langkah 3: triase + PIC Supervisor', (await step())[2]);
  ok('Hospitality tidak boleh menyelesaikan case milik PIC', await ev((id) => { const f = new FormData(); [['id', id], ['what', 'resolve'], ['note', 'Coba selesaikan oleh Jro']].forEach(([k, v]) => f.append(k, v)); OPX.forms.caseStep(f); return OPX.state.data.issues.find(i => i.id === id).caseState === 'triase'; }, cid));
  await as('spv-CTR'); await go('op-cases');
  await form('caseStep', { id: cid, what: 'respond', note: 'Tamu ditelepon, minta maaf' });
  await form('caseStep', { id: cid, what: 'resolve', note: 'AC disetel, tamu diberi voucher demo; tamu puas.' });
  ok('DX-OP09 langkah 4: respons & recovery oleh Supervisor', (await step())[3]);
  ok('Supervisor (PIC) tidak bisa memverifikasi recovery sendiri', await ev((id) => { const f = new FormData(); [['id', id], ['what', 'verify'], ['note', 'verifikasi sendiri']].forEach(([k, v]) => f.append(k, v)); OPX.forms.caseStep(f); return OPX.state.data.issues.find(i => i.id === id).caseState === 'selesai'; }, cid));
  await as('hosp-jro-okta'); await ev(() => { OPX.state.outletId = 'CTR'; OPX.save(); }); await go('op-cases');
  await form('caseStep', { id: cid, what: 'verify', note: 'Hasil recovery dicek ke tamu' });
  ok('DX-OP09 langkah 5: diverifikasi Jro Okta', (await step())[4]);
  await ev((id) => OPX.actions['case-open']({ dataset: { id } }), cid); await p.waitForTimeout(150);
  const drawer = await ev(() => document.querySelector('#modal-root').innerText);
  ok('Drawer case: SLA respons & selesai terpisah, timeline, tautan feedback', /SLA respons/i.test(drawer) && /SLA selesai/i.test(drawer) && /RIWAYAT/i.test(drawer) && new RegExp(fbId).test(drawer));
  await shot('CASE-03-drawer-diverifikasi');
  await ev(() => OPX.closeModal());
  await form('caseStep', { id: cid, what: 'reopen', note: 'Tamu menghubungi lagi' });
  ok('Reopen membuka case lagi dan masuk penghitung issue', await ev((id) => { const c = OPX.state.data.issues.find(i => i.id === id); return c.caseState === 'reopen' && c.status === 'open' && OPX.visibleIssues().some(i => i.id === id); }, cid));
  await as('mgr-eni'); await ev(() => { OPX.state.outletId = 'CTR'; OPX.save(); });
  const [cc2, hub2] = await counts();
  ok('Setelah reopen: Command Center = Communication Hub (Ubud)', cc2 === hub2 && cc2 >= 2, `${cc2} vs ${hub2}`);
  await go('op-communication'); await ev(() => { OPX.ui.commTab = 'issues'; OPX.render(); });
  await ev((id) => OPX.actions['issue-open']({ dataset: { id } }), cid); await p.waitForTimeout(150);
  ok('Issue Center membuka case tamu dengan drawer case', /SLA respons/i.test(await ev(() => document.querySelector('#modal-root').innerText)));
  await ev(() => OPX.closeModal());

  /* ---------- DX-OP10 waste & opname ---------- */
  await as('mgr-eni'); await ev(() => { OPX.state.outletId = 'SHT'; OPX.save(); });
  const stock0 = await ev(() => JSON.stringify(OPX.warehouse.wh().stock.filter(s => s.outlet === 'SHT').map(s => s.qty)));
  ok('DX-OP10 tersedia', await ev(() => OPX.demo.availability('waste-opname', 'SHT').ok), await ev(() => OPX.demo.availability('waste-opname', 'SHT').reason));
  await ev(() => OPX.demo.start('waste-opname', 'SHT'));
  await as('attendant-SHT');
  await entry('waste', 'waste', 'SHT', { kind: 'Waste', category: 'BHP', item: 'Minyak Pijat Lavender 1L', quantity: '1', unitCost: '85000', systemQty: '0', countedQty: '0', unit: 'botol', reason: 'Botol tumpah saat persiapan (demo)' });
  await entry('waste', 'waste', 'SHT', { kind: 'Stock opname', category: 'BHP', item: 'Body Scrub Kopi Bali 500g', quantity: '0', unitCost: '62000', systemQty: '6', countedQty: '4', unit: 'pak', reason: 'Hitung fisik akhir bulan (demo)' });
  await as('spv-SHT');
  for (const id of await ev(() => OPX.analytics.ensure().records.filter(r => r.group === 'waste' && r.outlet === 'SHT' && r.authorId === 'attendant-SHT' && r.status === 'submitted').map(r => r.id))) await review(id, 'verified');
  const w = await ev(() => { const r = OPX.demo.sync(); return OPX.demo.getScenario('waste-opname').steps.map((s, i) => s.kind === 'manual' || OPX.demo.evaluateStep(r, i).complete); });
  ok('DX-OP10: waste + opname tercatat dan diverifikasi Supervisor', w.every(Boolean), JSON.stringify(w));
  ok('DX-OP10: stok Gudang tidak berubah oleh catatan', stock0 === await ev(() => JSON.stringify(OPX.warehouse.wh().stock.filter(s => s.outlet === 'SHT').map(s => s.qty))));

  /* ---------- DX-OP11 koreksi & data kosong ---------- */
  await as('mgr-eni'); await ev(() => { OPX.state.outletId = 'TRL'; OPX.save(); });
  await ev(() => OPX.demo.start('correction', 'TRL'));
  await as('attendant-TRL');
  await entry('waste', 'waste', 'TRL', { kind: 'Waste', category: 'BHP', item: 'Tisu Wajah 250 lembar', quantity: '50', unitCost: '21000', systemQty: '0', countedQty: '0', unit: 'kotak', reason: 'Salah ketik jumlah (demo)' });
  const rid = await ev(() => OPX.analytics.ensure().records.filter(r => r.group === 'waste' && r.outlet === 'TRL' && r.authorId === 'attendant-TRL').pop().id);
  await as('spv-TRL'); await review(rid, 'rejected', 'Jumlah tidak wajar, cek ulang');
  await as('attendant-TRL');
  await ev((id) => { const r = OPX.analytics.ensure().records.find(x => x.id === id); OPX.analytics.updateRecord(id, { date: r.date, values: { ...r.values, quantity: 2 }, evidence: r.evidence, status: 'submitted' }); }, rid);
  await as('spv-TRL'); await review(rid, 'verified');
  const c = await ev(() => { const r = OPX.demo.sync(); return OPX.demo.getScenario('correction').steps.map((s, i) => s.kind === 'manual' || OPX.demo.evaluateStep(r, i).complete); });
  ok('DX-OP11: kirim → dikembalikan → versi 2 → terverifikasi', c.every(Boolean), JSON.stringify(c));
  ok('DX-OP11: versi lama tersimpan di riwayat revisi', await ev((id) => { const r = OPX.analytics.ensure().records.find(x => x.id === id); return r.version === 2 && r.revisions.length === 1 && r.revisions[0].values.quantity === 50; }, rid));
  await as('mgr-eni'); await ev(() => { OPX.state.outletId = 'all'; OPX.ui = Object.assign(OPX.ui || {}, { analyticsId: 'waste', analyticsTab: 'dashboard', analyticsFrom: '2026-11-01', analyticsTo: '2026-11-30' }); OPX.state.page = 'analytics'; OPX.save(); });
  await go('op-analytics');
  const empty = await ev(() => OPX.analytics.model('waste').cards.map(x => x.value));
  ok('Periode tanpa data: kartu kosong (null), bukan 0', empty.length > 0 && empty.every(v => v === null || v === undefined), JSON.stringify(empty));
  await shot('CASE-04-periode-kosong');

  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
