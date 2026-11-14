/* HAWK HRD · uji perjalanan lintas fase F1–F8 (node tests/hawk-live/hrd-journey.test.js)
   Kebutuhan therapist Spa Ubud → Workplan → lowongan → lamaran → screening → interview → onboarding → penempatan →
   POS → komisi/KPI → Monthly Reflection → tindak lanjut, plus peringatan utility rendah Spa Shanti. */
'use strict';
global.HR = require('../../hawk-live/hrd-model.js');
for (const n of [2, 3, 4, 5, 6, 7, 8]) global['HR' + n] = require(`../../hawk-live/hrd-f${n}-model.js`);
const { run } = require('./hrd-journey-steps.js');
let pass = 0, fail = 0;
const ok = (n, c, i = '') => { c ? pass++ : fail++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
const st = {}; HR.ensure(st); HR.EXT.ensure(st.hr); const hr = () => st.hr;
const U = (role, a, i) => HR.update(st, a, { by: role, role, ...i });
const T = (id) => hr().f3.tasks.find(t => t.id === id);

const ubd0 = HR5.outletUtil(hr(), 'OUT-UBD', 'W46');
const open0 = HR8.reflection(hr(), '2611', 'hrd').find(r => r.key === 'OPEN').actual;
const n0 = HR.people(hr(), 'hrd').length;
ok('Awal: utility Ubud > 100% (kebutuhan therapist), Shanti < 70%', ubd0.u > 1 && HR5.outletUtil(hr(), 'OUT-SHT', 'W46').u < 0.7);
const ids = run(U, hr);

/* F5 → F3 → F4 */
const sim = hr().f5.scenarios.find(s => s.id === ids.sim);
ok('F5: skenario tambah formasi Ubud disetujui manusia, temuan FND-UTIL-UBD-2611', sim.status === 'Disetujui' && sim.finding === 'FND-UTIL-UBD-2611' && sim.req === ids.req);
ok('F3: Workplan kebutuhan Ubud (PIC + tenggat, sumber UTIL-OUT-UBD-2611)', T(ids.workplan).stage === 'Workplan' && T(ids.workplan).pic && T(ids.workplan).due && T(ids.workplan).source.id === 'UTIL-OUT-UBD-2611');
const req = hr().f4.reqs.find(r => r.id === ids.req);
ok('F4: permintaan tenaga menaut skenario & kartu Workplan', req.scenario === ids.sim && req.task === ids.workplan && req.status === 'Disetujui' && req.count === 2);
ok('F4: lowongan dipublikasikan dari formasi disetujui (Spa Ubud)', HR4.vacOf(hr(), ids.vac).location === 'OUT-UBD' && HR4.vacOf(hr(), ids.vac).status === 'Dipublikasikan');
const app = () => hr().f4.apps.find(a => a.id === ids.app);
ok('Lamaran: retry dengan kunci sama = lamaran sama', ids.appRetry === ids.app && hr().f4.apps.filter(a => a.vac === ids.vac).length === 1);
ok('Screening selesai tanpa klarifikasi (sertifikat ada)', app().screening.status === 'Selesai');
ok('Interview: Event ID kalender (simulasi) + rubric Supervisor', ids.event.startsWith('GCAL-EVT') && app().rubric.avg >= 4);
ok('Kontrak: Employee ID baru, tanda tangan ulang tidak menggandakan profil', /^EMP-/.test(ids.emp) && ids.empRetry === ids.emp && hr().people.filter(p => p.name === 'Ni Kadek Perjalanan').length === 1);
ok('Onboarding = kartu F3 dari template TPL-ONB untuk karyawan baru, tertaut ke lamaran', T(ids.onboard) && app().onboarding === ids.onboard && T(ids.onboard).source.id.includes(ids.emp));
ok('Penempatan Spa Ubud terjadwal efektif 16 Nov (akun ESS)', app().placement.status === 'Terjadwal' && app().placement.effective === '2026-11-16' && hr().placements.some(p => p.emp === ids.emp && p.location === 'OUT-UBD' && p.from === '2026-11-16'));
ok('F2/F1: profil baru tercatat dengan sumber lamaran; headcount aktif tetap 158 sampai tanggal mulai', hr().people.find(p => p.id === ids.emp).source === ids.app && HR.people(hr(), 'hrd').length === n0);
ok('F5: progres permintaan — 1 lamaran, 0 aktif (mulai 16 Nov), 2 formasi terbuka', (() => { const r = HR5.reqProgress(hr(), ids.req); return r.apps === 1 && r.placed === 0 && r.open === 2; })());

/* POS → komisi/KPI: hire baru belum punya baris POS W46; rantai diverifikasi pada therapist Ubud aktif */
ok('POS W46 tidak memberi baris ke karyawan sebelum tanggal mulai', !HR5.lines(hr()).some(l => l.emp === ids.emp));
ok('Utility Ubud W46 tidak berubah oleh penempatan terjadwal', Math.abs(HR5.outletUtil(hr(), 'OUT-UBD', 'W46').u - ubd0.u) < 1e-9);
const emp2 = 'EMP-0002', L2 = HR5.lines(hr()).filter(l => l.emp === emp2 && l.status === 'Selesai');
const K2 = HR7.commissionLines(hr(), '2611').filter(k => k.emp === emp2);
ok('POS → komisi: setiap baris layanan therapist Ubud punya baris komisi (Service Line ID)', L2.length > 0 && L2.every(l => K2.some(k => k.line === l.line || k.id.includes(l.line))), `${L2.length} baris`);
U('hrd', 'pay-generate', { period: '2611' });
const s2 = HR7.slip(hr(), emp2, '2611');
ok('Komisi → slip November = jumlah baris komisi', s2.earnings.find(e => e[0] === 'Komisi')[1] === K2.reduce((s, k) => s + k.amount, 0));
const sNew = HR7.slip(hr(), ids.emp, '2611');
ok('F7: hire baru masuk draf payroll November secara prorata (tanpa komisi)', !!sNew && sNew.gross > 0 && !sNew.earnings.some(e => e[0] === 'Komisi' && e[1] > 0) && HR7.batchLines(hr(), '2611').some(l => l.emp === ids.emp));
const x2 = HR6.xscore(hr(), emp2, '2611');
ok('POS → KPI: XScore November therapist Ubud memakai utility POS F5', x2 && x2.comps[0].actual !== null && x2.comps[0].src === 'POS F5');
ok('KPI hire baru: belum ada data (bukan nol)', HR6.xscore(hr(), ids.emp, '2611') === null || HR6.xscore(hr(), ids.emp, '2611').score === null);

/* F8 Reflection → tindak lanjut */
const rows = HR8.reflection(hr(), '2611', 'hrd');
ok('Reflection: posisi terbuka bertambah 2 (formasi baru, belum aktif)', rows.find(r => r.key === 'OPEN').actual === open0 + 2);
ok('Reflection Ubud → kartu F3 yang sama dengan temuan F5 (tanpa duplikat)', ids.issue === ids.workplan && hr().f3.tasks.filter(t => t.source?.id === 'UTIL-OUT-UBD-2611').length === 1);
ok('Tindak lanjut: coaching 30 hari hire baru (HG, PIC, tenggat)', T(ids.follow).ws === 'HG' && T(ids.follow).pic === 'EMP-0144' && T(ids.follow).source.id === `ONB-${ids.emp}`);
ok('Biaya Reflection = draf payroll F7 termasuk hire baru', rows.find(r => r.key === 'THP').actual === HR7.totals(HR7.batchLines(hr(), '2611')).thp);

/* Peringatan Shanti */
const sht = rows.find(r => r.key === 'UTIL-OUT-SHT');
ok('Shanti < 70%: peringatan "Di bawah 70%" di Reflection', HR8.gapOf(sht) === 'Di bawah 70%' && sht.actual < 70);
ok('Shanti: Reflection membuka temuan F5 yang sama (TSK-0002)', ids.santi === 'TSK-0002');
ok('Shanti: keputusan STRACON Oktober dievaluasi belum tercapai', HR8.evaluate(hr(), HR8.ensure(hr()).decisions.find(d => d.id === 'DEC-2610-001')).met === false);

/* Perubahan penempatan & retry */
const before = JSON.stringify(hr().placements.filter(p => p.emp === ids.emp));
U('hrd', 'place-approve', { id: ids.app, accRole: 'ess' });
ok('Retry persetujuan penempatan tidak menambah placement', JSON.stringify(hr().placements.filter(p => p.emp === ids.emp)) === before);
ok('Retry penandaan Reflection & Workplan tidak menambah kartu', (() => { const n = hr().f3.tasks.length; U('hrd', 'rfl-mark', { key: 'UTIL-OUT-UBD', period: '2611' }); run2(); return hr().f3.tasks.length === n; function run2() { U('hrd', 'sim-mark', { id: ids.sim, stage: 'Workplan' }); } })());

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
