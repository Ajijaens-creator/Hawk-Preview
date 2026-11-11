/* HAWK four-portal sandbox · acceptance tests from HAWK-CLOUD-HANDOFF.md + SER reconciliation (F1-02 spec).
   Run: node tests/hawk-live/model.test.js */
'use strict';
const path = require('path');
global.HAWK = require(path.join(__dirname, '../../hawk-live/model.js'));
const SER = require(path.join(__dirname, '../../hawk-live/ser-data.js'));
let pass = 0, fail = 0; const results = [];
const ok = (name, cond, info = '') => { (cond ? pass++ : fail++); results.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const throws = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
const JT = 1e6;

/* 1 Budget awal */
let s = HAWK.fresh(), t = HAWK.totals(s);
ok('Budget awal: pagu 25.000.000, aktual 3.500.000, komitmen 0, sisa 21.500.000', s.budget === 25e6 && t.actual === 3.5e6 && t.committed === 0 && t.remaining === 21.5e6);
/* 2 Pengajuan ke aktual */
HAWK.update(s, 'request', { amount: '2000000' }); HAWK.update(s, 'approve', { id: 'MRF-002' }); t = HAWK.totals(s);
ok('Setelah setuju: komitmen 2.000.000, sisa 19.500.000', t.committed === 2e6 && t.remaining === 19.5e6);
HAWK.update(s, 'post', { id: 'MRF-002' }); t = HAWK.totals(s);
ok('Setelah posting: komitmen 0, aktual 5.500.000, sisa 19.500.000', t.committed === 0 && t.actual === 5.5e6 && t.remaining === 19.5e6);
/* 3 Pagu tidak cukup */
s = HAWK.fresh(); HAWK.update(s, 'request', { amount: '25000000' }); const before = JSON.stringify(HAWK.totals(s));
ok('Pagu tidak cukup: approval Rp25.000.000 ditolak', /tidak mencukupi/.test(throws(() => HAWK.update(s, 'approve', { id: 'MRF-002' })) || ''));
ok('Pagu tidak cukup: komitmen, aktual, sisa tidak berubah', JSON.stringify(HAWK.totals(s)) === before);
/* 4 Campaign ke revenue */
s = HAWK.fresh(); HAWK.update(s, 'request', { amount: '2000000' }); HAWK.update(s, 'approve', { id: 'MRF-002' }); HAWK.update(s, 'post', { id: 'MRF-002' });
ok('Revenue awal Rp750.000', HAWK.totals(s).revenue === 750000);
HAWK.update(s, 'book', { id: 'LEAD-001', slot: '11.00' }); ['checkin', 'complete', 'pay'].forEach(a => HAWK.update(s, a, { id: 'BK-002' })); t = HAWK.totals(s);
ok('Campaign → revenue: total 1.500.000, campaign 750.000', t.revenue === 1.5e6 && t.attributed === 750000);
ok('ROAS ≈ 0,14× setelah Rp2.000.000 direalisasi', Math.abs(t.roas - 0.136) < 0.005, t.roas.toFixed(3));
/* 5 Bentrok / aksi ulang */
const rev = t.revenue, n = s.bookings.length;
ok('Slot sama ditolak', /Slot/.test(throws(() => HAWK.update(s, 'book', { slot: '11.00' })) || '') && s.bookings.length === n);
ok('Bayar ulang ditolak tanpa revenue tambahan', !!throws(() => HAWK.update(s, 'pay', { id: 'BK-002' })) && HAWK.totals(s).revenue === rev);
/* 6 Referral */
s = HAWK.fresh();
ok('Driver belum aktif tidak bisa booking referral', /belum aktif/.test(throws(() => HAWK.update(s, 'book', { slot: '11.00', referral: 'yes' })) || ''));
ok('Aktivasi tanpa perjanjian ditolak', !!throws(() => HAWK.update(s, 'activate')));
HAWK.update(s, 'agreement'); HAWK.update(s, 'activate'); HAWK.update(s, 'book', { slot: '13.00', referral: 'yes' }); ['checkin', 'complete', 'pay'].forEach(a => HAWK.update(s, a, { id: 'BK-002' }));
ok('Komisi Rp75.000 untuk booking Rp750.000 × 10%', HAWK.totals(s).commission === 75000);
HAWK.update(s, 'payout', { id: 'BK-002' });
ok('Pembayaran komisi kedua ditolak', !!throws(() => HAWK.update(s, 'payout', { id: 'BK-002' })));
/* 7 Refund */
ok('Refund booking yang komisinya sudah dibayar perlu penyesuaian Finance', /penyesuaian Finance/.test(throws(() => HAWK.update(s, 'refund', { id: 'BK-002' })) || ''));
s = HAWK.fresh(); HAWK.update(s, 'agreement'); HAWK.update(s, 'activate'); HAWK.update(s, 'book', { slot: '13.00', referral: 'yes' }); ['checkin', 'complete', 'pay'].forEach(a => HAWK.update(s, a, { id: 'BK-002' }));
HAWK.update(s, 'refund', { id: 'BK-002' }); t = HAWK.totals(s);
ok('Refund (komisi belum dibayar): booking keluar dari revenue dan komisi', t.revenue === 750000 && t.commission === 0);
/* 8 Kinerja tim */
s = HAWK.fresh(); HAWK.update(s, 'task', { id: 'TASK-02' });
ok('Verifikasi tugas Sales menambah jumlah selesai', s.tasks.filter(x => x.team === 'Sales' && x.status === 'done').length === 1);

/* SER reconciliation (visual/F1-02-spec.md) */
s = HAWK.fresh();
let a = SER.summary(s, '2026-08', 'all').cur;
ok('SER Agu semua outlet: revenue Rp2.820 jt', a.revenue === 2820 * JT, String(a.revenue));
ok('SER Agu semua outlet: target Rp3.190 jt', a.target === 3190 * JT);
ok('SER Agu semua outlet: 3.195 pelanggan unik, 3.260 order', a.customers === 3195 && a.orders === 3260);
let u = SER.summary(s, '2026-08', 'ubud').cur;
ok('SER Agu Ubud: revenue Rp1.680 jt, 1.880 pelanggan', u.revenue === 1680 * JT && u.customers === 1880);
ok('SER Agu Ubud: pagu Rp120 jt, realisasi Rp63 jt', u.pagu === 120 * JT && u.actual === 63 * JT);
ok('Effective Target Rate = revenue ÷ target', Math.abs(a.etr - 2820 / 3190) < 1e-12);
ok('AOV = revenue ÷ order (bukan pelanggan)', a.aov === a.revenue / a.orders);
ok('Refund dikecualikan dari revenue dan order', a.refunded.length > 0 && a.paid.every(x => x.status === 'paid'));
const jul = SER.summary(s, '2026-07', 'all').cur;
ok('Filter Juli: angka berbeda dan merekonsiliasi ke histori (Rp2.590 jt)', jul.revenue === 2590 * JT);
const b = SER.summary(s, '2026-08', 'bisma').cur;
ok('Fallback outlet tanpa data: hasData=false, rasio = null ("—")', !b.hasData && b.etr === null && b.aov === null && b.romi === null);
const S = SER.summary(s, '2026-08', 'all');
ok('Channel group: jumlah grup = total revenue', S.groups.reduce((x, g) => x + g.revenue, 0) === a.revenue);
ok('Country: jumlah negara = total pelanggan unik', S.countries.reduce((x, c) => x + c.customers, 0) === a.customers);
ok('Annual chart Agu 2026 = KPI revenue', S.annual[7].y2026 === a.revenue);
ok('Semua outlet = Ubud + Shanti (+ Bisma 0)', a.revenue === u.revenue + SER.summary(s, '2026-08', 'shanti').cur.revenue);
ok('ID transaksi POS unik', new Set(S.ds.tx.map(x => x.id)).size === S.ds.tx.length);
/* Sandbox connection */
HAWK.update(s, 'request', { amount: '2000000' }); HAWK.update(s, 'approve', { id: 'MRF-002' });
u = SER.summary(s, '2026-08', 'ubud').cur;
ok('Sandbox → SER: komitmen CMP-001 Rp2 jt muncul di Budget Ubud, sisa turun', u.committed === 2 * JT && u.remaining === (120 - 63 - 2) * JT);
HAWK.update(s, 'post', { id: 'MRF-002' }); u = SER.summary(s, '2026-08', 'ubud').cur;
ok('Sandbox → SER: posting memindah ke realisasi Rp65 jt', u.committed === 0 && u.actual === 65 * JT);
HAWK.update(s, 'book', { id: 'LEAD-001', slot: '11.00' }); ['checkin', 'complete', 'pay'].forEach(x => HAWK.update(s, x, { id: 'BK-002' }));
a = SER.summary(s, '2026-08', 'all').cur;
ok('Sandbox → SER: booking LEAD-001 dibayar menambah Rp750.000 sekali', a.revenue === 2820 * JT + 750000 && a.paid.filter(x => x.booking === 'BK-002').length === 1);
HAWK.update(s, 'refund', { id: 'BK-002' }); a = SER.summary(s, '2026-08', 'all').cur;
ok('Sandbox → SER: refund mengeluarkan transaksi dari revenue', a.revenue === 2820 * JT && a.refunded.some(x => x.booking === 'BK-002'));
HAWK.update(s, 'refund', { id: 'BK-001' }); a = SER.summary(s, '2026-08', 'all').cur;
ok('Sandbox → SER: refund BK-001 (bagian fixture Agustus) ikut keluar dari revenue', a.revenue === 2820 * JT - 750000);

console.log(`\n${pass} lulus, ${fail} gagal`);
require('fs').writeFileSync(path.join(__dirname, 'model-results.json'), JSON.stringify({ ranAt: new Date().toISOString(), pass, fail, results }, null, 1));
process.exit(fail ? 1 : 0);
