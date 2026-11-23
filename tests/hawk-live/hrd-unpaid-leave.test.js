/* HAWK HRD · NP-HRD-F2-001 ESS Unpaid Leave & Payroll Integration
   node tests/hawk-live/hrd-unpaid-leave.test.js — DATA DEMO / SIMULASI */
'use strict';
global.HR = require('../../hawk-live/hrd-model.js');
global.HR2 = require('../../hawk-live/hrd-f2-model.js');
global.HR3 = require('../../hawk-live/hrd-f3-model.js');
global.HR4 = require('../../hawk-live/hrd-f4-model.js');
global.HR5 = require('../../hawk-live/hrd-f5-model.js');
global.HR6 = require('../../hawk-live/hrd-f6-model.js');
const HR7 = require('../../hawk-live/hrd-f7-model.js');
let pass = 0, fail = 0;
const ok = (n, c, i = '') => { c ? pass++ : fail++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message) || re.test(e.code || '') || (console.log('   ↳', e.message), false); } };
const st = {}; HR.ensure(st); HR.EXT.ensure(st.hr); const hr = () => st.hr;
const U = (role, a, i) => HR.update(st, a, { by: role, role, ...i });
const approve = (id) => { U('ops-manager', 'decide', { id, decision: 'approve' }); return U('hrd', 'decide', { id, decision: 'approve' }); };
const req = (id) => hr().queue.find(q => q.id === id);
const ann = (emp) => HR2.balance(hr(), emp).find(b => b.id === 'LV-ANN');
const unpEarn = (s) => (s.earnings.find(e => e[2] === 'RUL-UNP') || [0, 0])[1];
const E = 'EMP-0001'; /* libur jadwal: Senin */

/* --- hari kerja terjadwal --- */
ok('Libur jadwal tidak dihitung (Sen 23 – Rab 25 Nov = 2 hari kerja)', HR2.workdays(hr(), E, '2026-11-23', '2026-11-25').length === 2);
ok('Libur perusahaan tidak dihitung (24–25 Des)', !HR2.isWorkday(hr(), E, '2026-12-24') && !HR2.isWorkday(hr(), E, '2026-12-25'));
ok('Pengajuan hanya pada hari libur ditolak dengan alasan jelas', throws(() => U('therapist', 'leave-request', { emp: E, cat: 'LV-UNP', from: '2026-11-23', to: '2026-11-23' }), /hari kerja terjadwal/));

/* --- normal: saldo cukup --- */
const b0 = ann(E).left;
const n1 = U('therapist', 'leave-request', { emp: E, cat: 'LV-ANN', from: '2026-11-17', to: '2026-11-18' });
ok('Normal: saldo cukup → tanpa hari unpaid', req(n1).payload.paidDays === 2 && req(n1).payload.unpaidDays === 0);
approve(n1);
ok('Normal: saldo berkurang 2, tanpa potongan gaji', ann(E).left === b0 - 2 && unpEarn(HR7.slip(hr(), E, '2611')) === 0);

/* --- saldo tidak cukup --- */
const left = ann(E).left; /* sisa saat ini */
ok('Saldo tidak cukup TIDAK auto-reject: sistem menawarkan konversi (butuh persetujuan karyawan)', throws(() => U('therapist', 'leave-request', { emp: E, cat: 'LV-ANN', from: '2026-11-03', to: '2026-11-14' }), /NEED_UNPAID_CONSENT|Cuti Tidak Dibayar/));
ok('Tanpa persetujuan konversi, tidak ada pengajuan dibuat', !hr().queue.some(q => q.payload?.from === '2026-11-03'));
const sp = U('therapist', 'leave-request', { emp: E, cat: 'LV-ANN', from: '2026-11-03', to: '2026-11-14', convert: '1' });
const pl = req(sp).payload;
ok('Split otomatis: saldo dibayar, kekurangan jadi unpaid', pl.paidDays === left && pl.unpaidDays === pl.days - left && pl.consent?.by === E, `${pl.paidDays} dibayar + ${pl.unpaidDays} unpaid dari ${pl.days} hari kerja`);
ok('Tetap lewat APR-LEAVE: Supervisor → Manager HRD', req(sp).policy === 'APR-LEAVE' && req(sp).stages.map(s => s.label).join(' → ') === 'Supervisor Outlet / atasan langsung → Manager HRD');
ok('Therapist tidak bisa memutuskan', throws(() => U('therapist', 'decide', { id: sp, decision: 'approve' }), /Akses ditolak/));
ok('Belum final: belum ada potongan', unpEarn(HR7.slip(hr(), E, '2611')) === 0);
approve(sp);
ok('Final: saldo berbayar habis tepat 0, unpaid tidak mengurangi saldo berbayar', ann(E).left === 0 && HR2.balance(hr(), E).find(b => b.id === 'LV-UNP').used === pl.unpaidDays);
const s1 = HR7.slip(hr(), E, '2611'), u1 = HR7.unpaidOf(hr(), E, '2611');
const expect = Math.round(HR7.baseOf(hr(), E) * pl.unpaidDays / u1.wd);
ok('Potongan = ROUND(gaji pokok ÷ hari kerja periode × hari unpaid)', -unpEarn(s1) === expect && u1.days === pl.unpaidDays, `${HR7.baseOf(hr(), E)} ÷ ${u1.wd} × ${u1.days} = ${expect}`);
ok('Potongan rupiah bulat (dibulatkan sekali)', Number.isInteger(unpEarn(s1)));
ok('Presensi hari unpaid ditandai unpaid', HR2.attendance(hr(), E, pl.unpaidDates[0]).unpaid === true || pl.unpaidDates[0] > HR.TODAY);

/* --- ditolak --- */
const E2 = 'EMP-0002';
const rj = U('hrd', 'leave-request', { emp: E2, cat: 'LV-UNP', from: '2026-11-19', to: '2026-11-21' });
U('ops-manager', 'decide', { id: rj, decision: 'approve' });
U('hrd', 'decide', { id: rj, decision: 'reject', reason: 'Kebutuhan operasional outlet' });
ok('Ditolak di tahap Manager HRD: alasan tersimpan, tanpa ledger & potongan', req(rj).status === 'Ditolak' && req(rj).stages[1].reason && !hr().f2.ledger.some(l => l.ref === rj) && unpEarn(HR7.slip(hr(), E2, '2611')) === 0);

/* --- jenis Cuti Tidak Dibayar langsung --- */
const a2 = ann(E2).left;
const ud = U('hrd', 'leave-request', { emp: E2, cat: 'LV-UNP', from: '2026-11-26', to: '2026-11-27' });
approve(ud);
ok('Kategori Cuti Tidak Dibayar: saldo tahunan tetap, potongan sesuai hari kerja', ann(E2).left === a2 && HR7.unpaidOf(hr(), E2, '2611').days === req(ud).payload.days);

/* --- regenerasi draf tidak memotong ganda --- */
U('hrd', 'pay-generate', { period: '2611' }); U('hrd', 'pay-generate', { period: '2611' });
ok('Regenerasi draf 2× → potongan tetap sekali', unpEarn(HR7.slip(hr(), E, '2611')) === unpEarn(s1));

/* --- lintas periode: Oktober sudah dikunci --- */
const E3 = 'EMP-0003';
const oct10 = HR7.batchLines(hr(), '2610').find(l => l.emp === E3).thp;
const lx = U('hrd', 'leave-request', { emp: E3, cat: 'LV-UNP', from: '2026-10-29', to: '2026-11-04' });
approve(lx);
const adjOct = HR7.adjustments(hr()).filter(a => a.ref === lx);
const octDays = req(lx).payload.unpaidDates.filter(d => d <= '2026-10-31').length, novDays = req(lx).payload.unpaidDates.filter(d => d >= '2026-11-01').length;
ok('Lintas periode: snapshot Oktober (terkunci) tidak berubah', HR7.batchLines(hr(), '2610').find(l => l.emp === E3).thp === oct10);
ok('Lintas periode: bagian Oktober → penyesuaian ke November', adjOct.length === 1 && adjOct[0].fromPeriod === '2610' && adjOct[0].toPeriod === '2611' && adjOct[0].amount === -Math.round(HR7.baseOf(hr(), E3) * octDays / HR7.unpaidOf(hr(), E3, '2610').wd), `${octDays} hari Okt · ${novDays} hari Nov`);
const s3 = HR7.slip(hr(), E3, '2611');
ok('Lintas periode: bagian November dipotong di November', HR7.unpaidOf(hr(), E3, '2611').days === novDays && unpEarn(s3) < 0 && s3.earnings.some(e => e[2] === 'ADJ' && e[3].includes(adjOct[0].id)));

/* --- perubahan jadwal: penugasan tambahan pada hari libur jadwal dihitung hari kerja --- */
const E5 = 'EMP-0005', off5 = HR2.scheduleOn(hr(), E5, '2026-11-24').off;
let offDay = '2026-11-24'; while (HR2.dow(offDay) !== off5) offDay = HR2.addDays(offDay, 1);
const wdBefore = HR2.workdays(hr(), E5, '2026-11-24', '2026-11-30').length;
U('hrd', 'shift-assign', { emp: E5, date: offDay, shift: 'Pagi', outlet: 'OUT-UBD' });
ok('Perubahan jadwal: penugasan tambahan di hari libur jadwal ikut dihitung hari kerja', HR2.isWorkday(hr(), E5, offDay) && HR2.workdays(hr(), E5, '2026-11-24', '2026-11-30').length === wdBefore + 1, `${offDay}: ${wdBefore} → ${wdBefore + 1}`);

/* --- payroll terkunci: approve setelah kunci → adjustment periode berikut --- */
U('hrd', 'pay-generate', { period: '2611' }); U('hrd', 'pay-review', { period: '2611' }); U('hrd', 'pay-lock', { period: '2611' });
const E4 = 'EMP-0004', lock4 = HR7.batchLines(hr(), '2611').find(l => l.emp === E4).thp;
const lk = U('hrd', 'leave-request', { emp: E4, cat: 'LV-UNP', from: '2026-11-26', to: '2026-11-27' });
approve(lk);
const adjN = HR7.adjustments(hr()).filter(a => a.ref === lk);
ok('Payroll terkunci: snapshot November tidak berubah', HR7.batchLines(hr(), '2611').find(l => l.emp === E4).thp === lock4);
ok('Payroll terkunci: koreksi masuk penyesuaian Desember (2612) dengan Request ID', adjN.length === 1 && adjN[0].toPeriod === '2612' && adjN[0].amount < 0);
ok('Potongan yang sudah ada di snapshot tidak dibuat penyesuaian lagi (anti-ganda)', !HR7.adjustments(hr()).some(a => a.ref === sp));
ok('Periode berikut Desember → Januari', HR7.nextPeriod('2612') === '2701' && HR7.nextPeriod('2611') === '2612');

/* --- jurnal Finance --- */
const j = HR7.journal(hr(), '2611');
ok('Jurnal November seimbang dan 6101 sudah dikurangi potongan', j.balanced && HR7.totals(HR7.batchLines(hr(), '2611')).unp < 0);

/* --- role --- */
ok('Finance tidak bisa generate payroll', throws(() => U('finance-manager', 'pay-generate', { period: '2611' }), /Akses ditolak/));
ok('Aturan RUL-UNP tercatat berversi', HR7.ruleAt(hr().f7, 'RUL-UNP', '2611').v === 1);

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
