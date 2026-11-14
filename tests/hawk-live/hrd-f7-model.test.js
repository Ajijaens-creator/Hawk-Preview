/* HAWK HRD F7 · uji model (node tests/hawk-live/hrd-f7-model.test.js) — kriteria NB F7 */
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
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message) || (console.log('   ↳', e.message), false); } };
const st = {}; HR.ensure(st); HR.EXT.ensure(st.hr); const hr = () => st.hr;
const U = (role, a, i) => HR.update(st, a, { by: role, role, ...i });

/* dasar: kalibrasi & rekonsiliasi */
const oct = HR7.batchLines(hr(), '2610'), t10 = HR7.totals(oct);
ok('Oktober: 158 slip, THP setiap slip = THP roster F1', oct.length === 158 && oct.every(l => l.thp === hr().people.find(p => p.id === l.emp).thp));
ok('Total THP Oktober = total THP roster (Rp557,75 jt)', t10.thp === hr().people.reduce((s, p) => s + p.thp, 0), String(t10.thp));
ok('Setiap slip: pendapatan − potongan = take-home pay', oct.every(l => l.gross - l.dedT === l.thp));
ok('Biaya perusahaan ≠ THP (BPJS perusahaan ditambahkan)', t10.cost > t10.gross && t10.gross > t10.thp);
ok('Batch Oktober terkunci dengan snapshot & status bayar (Gagal + Sebagian ada)', HR7.batchOf(hr(), '2610').status === 'Dikunci' && Object.values(HR7.batchOf(hr(), '2610').payments).some(p => p.status === 'Gagal') && Object.values(HR7.batchOf(hr(), '2610').payments).some(p => p.status === 'Sebagian'));

/* Jalur 1: POS → komisi → draf → slip → jurnal */
const kl = HR7.commissionLines(hr(), '2611');
const L5 = HR5.lines(hr()).filter(l => l.status === 'Selesai');
ok('Satu baris komisi per Service Line ID F5', kl.length === HR5.lines(hr()).length && new Set(kl.map(k => k.id)).size === kl.length);
const four = kl.filter(k => k.four && k.outlet === 'OUT-UBD');
ok('Four Hands: dua bagian, jumlah = total transaksi', four.length >= 2 && four.filter(k => k.tx === four[0].tx).reduce((s, k) => s + k.amount, 0) === 2 * Math.round(90 / 60 * 5000));
ok('Pembatalan tidak berkomisi', kl.filter(k => /Batal/.test(k.status)).every(k => k.amount === 0));
const helper = kl.find(k => k.home === 'OUT-SHT' && k.outlet === 'OUT-UBD');
ok('Bantuan antaroutlet: komisi di outlet aktual (Ubud) untuk therapist Shanti', !!helper && helper.amount > 0);
const sum0 = kl.reduce((s, k) => s + k.amount, 0);
U('hrd-ops', 'pos-ingest', { id: hr().f5.batches[0].id });
ok('Replay batch POS tidak menambah komisi', HR7.commissionLines(hr(), '2611').reduce((s, k) => s + k.amount, 0) === sum0);
ok('Staf HRD tidak bisa generate payroll', throws(() => U('hrd-ops', 'pay-generate', { period: '2611' }), /Khusus Manager HRD/));
const b = U('hrd', 'pay-generate', { period: '2611' });
const emp = 'EMP-0002', sl = HR7.slip(hr(), emp, '2611');
const myComm = HR7.commissionLines(hr(), '2611').filter(k => k.emp === emp).reduce((s, k) => s + k.amount, 0);
ok('Draf November: komisi slip = jumlah baris komisi therapist', sl.earnings.find(e => e[0] === 'Komisi')[1] === myComm && myComm > 0, `${b} · ${myComm}`);
ok('Regenerasi draf → batch sama, versi naik', U('hrd', 'pay-generate', { period: '2611' }) === b && HR7.batchOf(hr(), '2611').version === 2);
ok('Regenerasi dengan versi usang ditolak (pemeriksaan versi)', throws(() => U('hrd', 'pay-generate', { period: '2611', version: '1' }), /Versi batch/));
ok('Kunci sebelum review ditolak', throws(() => U('hrd', 'pay-lock', { period: '2611' }), /Review/));

/* Jalur 2: aturan efektif, kasbon, reimburse (sebelum kunci November) */
ok('Aturan tidak bisa berlaku di periode terkunci (Oktober)', throws(() => U('hrd', 'rule-version', { id: 'RUL-KOM', value: '6000', from: '2610', note: 'uji periode terkunci' }), /dikunci/));
U('hrd', 'rule-version', { id: 'RUL-KOM', value: '6000', from: '2611', note: 'Kenaikan komisi November' });
ok('Aturan baru berlaku di November (v2 Rp6.000/jam)', HR7.ruleAt(hr().f7, 'RUL-KOM', '2611').v === 2 && HR7.commissionLines(hr(), '2611')[0].rule === 'RUL-KOM v2');
ok('Slip Oktober terkunci tetap merujuk v1 (nilai tidak berubah)', HR7.batchOf(hr(), '2610').snapshot.versions['RUL-KOM'] === 1 && HR7.totals(HR7.batchLines(hr(), '2610')).thp === t10.thp);
const k1 = HR7.slip(hr(), 'EMP-0003', '2611');
ok('Cicilan kasbon KSB-2611-001-C1 dipotong sekali di November', k1.ded.filter(d => d[3] === 'KSB-2611-001-C1').length === 1 && k1.ded.find(d => d[3] === 'KSB-2611-001-C1')[1] === 500000);
ok('Cicilan C2 tidak dipotong di November', !k1.ded.some(d => d[3] === 'KSB-2611-001-C2'));
ok('Reimburse disetujui masuk payroll; yang selesai di kas kecil tidak', HR7.slip(hr(), 'EMP-0005', '2611').earnings.some(e => e[2] === 'RUL-RMB' && e[1] === 250000) && !HR7.slip(hr(), 'EMP-0026', '2611').earnings.some(e => e[2] === 'RUL-RMB'));
U('hrd', 'rmb-decide', { id: 'RMB-2611-003', decision: 'other', ref: 'Kas kecil HQ' });
ok('Reimburse diselesaikan di kanal lain tidak dibayar kedua kali', !HR7.slip(hr(), 'EMP-0031', '2611').earnings.some(e => e[2] === 'RUL-RMB'));
const adv = U('hrd-ops', 'adv-request', { emp: 'EMP-0010', amount: '900000', months: '3' });
ok('Kasbon baru tidak dipotong sebelum dicairkan', !HR7.slip(hr(), 'EMP-0010', '2611').ded.some(d => d[2] === 'RUL-KSB'));
ok('Pencairan sebelum persetujuan ditolak', throws(() => U('hrd', 'adv-disburse', { id: adv }), /Setujui/));
U('hrd', 'adv-approve', { id: adv }); U('hrd', 'adv-disburse', { id: adv });
ok('Setelah dicairkan: cicilan pertama Rp300.000 masuk November', HR7.slip(hr(), 'EMP-0010', '2611').ded.some(d => d[3] === `${adv}-C1` && d[1] === 300000));
U('hrd', 'pay-generate', { period: '2611' }); U('hrd', 'pay-review', { period: '2611' }); const bid = U('hrd', 'pay-lock', { period: '2611' });
const B = HR7.batchOf(hr(), '2611');
ok('Kunci November: snapshot slip, versi aturan & sumber', B.status === 'Dikunci' && B.snapshot.lines.length === 158 && B.snapshot.versions['RUL-KOM'] === 2 && B.snapshot.sources.length === 4);
ok('Batch terkunci tidak bisa diregenerasi/reset', throws(() => U('hrd', 'pay-generate', { period: '2611' }), /dikunci/) && throws(() => U('hrd', 'pay-reset', { period: '2611' }), /terkunci/));
const lg = HR7.ledger(hr(), 'EMP-0003');
ok('Ledger kasbon: pencairan 1,5 jt, cicilan via PAY-2611-01, saldo 1 jt', lg.length === 2 && lg[1].ref === 'KSB-2611-001-C1' && lg[1].balance === 1000000);
ok('Kasbon dengan cicilan di periode terkunci tidak bisa dicairkan', (() => { const a = U('hrd-ops', 'adv-request', { emp: 'EMP-0011', amount: '600000', months: '2' }); U('hrd', 'adv-approve', { id: a }); return throws(() => U('hrd', 'adv-disburse', { id: a }), /terkunci/); })());

/* slip & status bayar */
ok('Status bayar tanpa referensi bank ditolak', throws(() => U('hrd', 'pay-mark', { period: '2611', emp: 'EMP-0001', status: 'paid', ref: '' }), /referensi bukti/));
ok('Siap Bayar tidak otomatis Sudah Bayar', !B.payments['EMP-0001']);
U('hrd', 'pay-mark', { period: '2611', emp: 'EMP-0001', status: 'partial', ref: 'BANK-2611-0001', note: 'transfer 1 dari 2' });
U('hrd', 'pay-mark', { period: '2611', status: 'paid', ref: 'BANK-2611-0002' });
ok('Pembayaran sebagian lalu massal: yang belum lunas jadi Sudah Bayar dengan referensi', B.payments['EMP-0001'].status === 'Sudah Bayar' && B.payments['EMP-0002'].ref === 'BANK-2611-0002');

/* refund setelah kunci → adjustment; jurnal & handoff */
const line = HR5.lines(hr()).find(l => l.emp === emp && l.status === 'Selesai' && l.pay !== 'Refund').line;
U('hrd', 'pos-refund', { line, reason: 'Keluhan tamu setelah closing' });
const adj = HR7.adjustments(hr());
ok('Refund setelah kunci → penyesuaian ke Desember merujuk baris asal', adj.length === 1 && adj[0].ref === line && adj[0].toPeriod === '2612' && adj[0].amount < 0 && adj[0].rule === 'RUL-KOM v2');
ok('Snapshot November tidak berubah oleh refund', HR7.totals(HR7.batchLines(hr(), '2611')).thp === HR7.totals(B.snapshot.lines).thp);
const j = HR7.journal(hr(), '2611');
ok('Jurnal seimbang dan = biaya snapshot HRD', j.balanced && Math.abs(j.debit - HR7.totals(B.snapshot.lines).cost) < 1);
ok('Handoff gagal tercatat', U('hrd', 'fin-handoff', { period: '2611', fail: '1' }) === 'JRN-PAY-2611-01' && B.handoff.status === 'Gagal kirim');
U('hrd', 'fin-handoff', { period: '2611' });
ok('Retry memakai kunci sama, percobaan ke-2, status Terkirim', B.handoff.id === 'JRN-PAY-2611-01' && B.handoff.attempts === 2 && B.handoff.status === 'Terkirim');
U('hrd', 'fin-handoff', { period: '2611' });
ok('Retry setelah terkirim tidak membuat jurnal kedua', B.handoff.attempts === 3 && B.handoff.status === 'Terkirim');
ok('Manager HRD tidak bisa menandai diterima Finance', throws(() => U('hrd', 'fin-ack', { period: '2611' }), /Finance Manager/));
U('finance-manager', 'fin-ack', { period: '2611', variance: '0' });
ok('Finance menerima jurnal, selisih 0', B.handoff.status === 'Diterima Finance' && B.handoff.variance === 0);

/* laporan */
ok('Katalog laporan 19 entri (6 Payroll, 6 PPh, 2 BPJS, 5 Coretax)', Object.values(HR7.REPORTS).flat().length === 19 && HR7.REPORTS['Payroll'].length === 6 && HR7.REPORTS['Coretax'].length === 5);
ok('PPh 21 laporan = total potongan PPh batch', HR7.totals(B.snapshot.lines).pph === B.snapshot.lines.reduce((s, l) => s + (l.ded.find(d => d[2] === 'RUL-PPH')?.[1] || 0), 0));

/* Jalur 3: people budgeting */
const rows = HR7.budgetYear(hr());
const r = HR7.ratios(rows, 158);
ok('12 bulan = total tahun (biaya & pagu)', Math.abs(rows.reduce((s, x) => s + x.forecast, 0) - r.cost) < 1 && Math.abs(rows.reduce((s, x) => s + x.budget, 0) - r.budget) < 1);
ok('Aktual berhenti di Oktober, November provisional, Desember forecast', rows[9].cost !== null && rows[10].cost === null && /Provisional/.test(rows[10].status) && rows[11].status === 'Forecast');
ok('Pagu = 25% revenue rencana (koridor demo)', Math.abs(rows[0].budget - rows[0].revPlan * 0.25) < 1);
ok('Tahun lalu (2025) tersedia sebagai pembanding', HR7.budgetYear(hr(), 'all', 2025)[0].cost > 0);
ok('Simulasi tambah orang tanpa Requisition ID tidak bisa disetujui', (() => { const s = U('hrd', 'bud-sim', { outlet: 'OUT-UBD', count: '2', start: '2026-12-01' }); return throws(() => U('hrd', 'bud-sim-approve', { id: s }), /Requisition/); })());
const req = U('ops-manager', 'req-create', { position: 'POS-THR', outlet: 'OUT-UBD', count: '2' });
const s2 = U('hrd', 'bud-sim', { outlet: 'OUT-UBD', count: '2', start: '2026-12-01', req });
const S2 = hr().f7.scenarios.find(x => x.id === s2);
ok('Skenario: tahun berjalan (1 bulan) vs setahun penuh terbaca terpisah', S2.ytd > 0 && S2.fullYear > S2.ytd * 10 && S2.monthly[10] === 0 && S2.monthly[11] > 0);
const before = HR7.ratios(HR7.budgetYear(hr()), 158).cost;
U('hrd', 'bud-sim-approve', { id: s2 });
ok('Skenario disetujui masuk forecast Desember (tertaut Requisition F4)', Math.abs(HR7.ratios(HR7.budgetYear(hr()), 158).cost - before - S2.monthly[11]) < 1 && S2.req === req);
const sAll = HR7.budgetYear(hr(), 'all'), sOut = HR.OUTLETS.map(o => HR7.budgetYear(hr(), o.id));
ok('Alokasi Office ke 4 outlet = 100% (konsolidasi menghitung sekali)', Math.abs(sOut.reduce((s, x) => s + x[0].office, 0) - sAll[0].office) < 1);
ok('Finance/Owner tidak bisa generate payroll', throws(() => U('finance-manager', 'pay-generate', { period: '2611' }), /Khusus Manager HRD/) && throws(() => U('owner', 'pay-generate', { period: '2611' }), /Khusus Manager HRD/));

HR.update(st, 'dummy-delete', { by: 'hrd', role: 'hrd', confirm: 'HAPUS DUMMY' });
HR.update(st, 'dummy-load', { by: 'hrd', role: 'hrd' });
ok('Hapus & muat ulang dummy: batch November/kasbon/skenario demo bersih, Oktober dikalibrasi ulang', !HR7.batchOf(hr(), '2611') && hr().f7.scenarios.length === 0 && hr().f7.advances.length === 1 && HR7.totals(HR7.batchLines(hr(), '2610')).thp === t10.thp);
console.log(`\n${pass} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
