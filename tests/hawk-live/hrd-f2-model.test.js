/* HAWK HRD F2 · uji model (node tests/hawk-live/hrd-f2-model.test.js) — kriteria NB F2 */
'use strict';
global.HR = require('../../hawk-live/hrd-model.js');
const HR2 = require('../../hawk-live/hrd-f2-model.js');
let pass = 0, fail = 0;
const ok = (n, c, i = '') => { c ? pass++ : fail++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message); } };
const st = {}; HR.ensure(st); const hr = () => st.hr;
const U = (a, i) => HR.update(st, a, { by: 'Uji', role: 'hrd', ...i });
ok('F2 dimuat: 158 orang tetap', HR.people(hr(), 'hrd').length === 158);
/* jadwal efektif */
ok('Shift efektif hari ini ditolak', throws(() => U('shift-change', { emp: 'EMP-0001', shift: 'Pagi', from: HR.TODAY }), /besok|setelah/i));
U('shift-change', { emp: 'EMP-0001', shift: 'Pagi', from: '2026-11-20' });
ok('Jadwal sebelum efektif dipertahankan', HR2.scheduleOn(hr(), 'EMP-0001', '2026-11-19').shift === 'Sore' && HR2.scheduleOn(hr(), 'EMP-0001', '2026-11-21').shift === 'Pagi');
ok('Penugasan tumpang tindih ditolak', throws(() => U('shift-assign', { emp: 'EMP-0001', date: '2026-11-21', shift: 'Pagi', outlet: 'OUT-UBD' }), /Konflik/));
/* koreksi presensi */
const a0 = HR2.attendance(hr(), 'EMP-0001', '2026-11-12');
const rq = U('att-correct', { emp: 'EMP-0001', date: '2026-11-12', in: '08:50', out: '17:05', reason: 'Mesin offline' });
ok('Koreksi menunggu = provisional, nilai belum berubah', HR2.attendance(hr(), 'EMP-0001', '2026-11-12').provisional && HR2.attendance(hr(), 'EMP-0001', '2026-11-12').in === a0.in);
ok('Manager HRD tidak bisa memutuskan tahap Supervisor', throws(() => U('decide', { id: rq, decision: 'approve' }), /Akses ditolak/));
HR.update(st, 'decide', { by: 'Mila', role: 'outlet-spv', id: rq, decision: 'approve' });
ok('Setelah disetujui, presensi memakai nilai koreksi', HR2.attendance(hr(), 'EMP-0001', '2026-11-12').in === '08:50');
ok('Keputusan ulang ditolak (idempoten)', throws(() => HR.update(st, 'decide', { by: 'Mila', role: 'outlet-spv', id: rq, decision: 'approve' }), /sudah final/));
/* cuti bertingkat + saldo */
const b0 = HR2.balance(hr(), 'EMP-0001').find(b => b.id === 'LV-ANN').left;
const lv = HR.update(st, 'leave-request', { by: 'Putu', role: 'therapist', emp: 'EMP-0001', cat: 'LV-ANN', from: '2026-11-24', to: '2026-11-25' });
ok('Therapist ESS bisa mengajukan cuti sendiri', /^(APV|REQ)-/.test(lv), lv);
ok('Therapist tidak bisa mengajukan untuk orang lain', throws(() => HR.update(st, 'leave-request', { role: 'therapist', emp: 'EMP-0002', cat: 'LV-ANN', from: '2026-11-26', to: '2026-11-26' }), /cakupan|Akses/i));
ok('Pengajuan bertabrakan ditolak', throws(() => HR.update(st, 'leave-request', { role: 'therapist', emp: 'EMP-0001', cat: 'LV-ANN', from: '2026-11-25', to: '2026-11-25' }), /Bertabrakan/));
HR.update(st, 'decide', { by: 'Mila', role: 'outlet-spv', id: lv, decision: 'approve' });
ok('Tahap 1 disetujui: masih menunggu Manager HRD', hr().queue.find(q => q.id === lv).status === 'Menunggu Persetujuan');
U('decide', { id: lv, decision: 'approve' });
ok('Saldo berkurang 2 setelah final', HR2.balance(hr(), 'EMP-0001').find(b => b.id === 'LV-ANN').left === b0 - 2);
ok('Penolakan butuh alasan', throws(() => U('decide', { id: 'APV-2611-002', decision: 'reject', reason: '' }), /Alasan|wewenang|Akses|final/));
/* penempatan efektif */
U('placement-change', { emp: 'EMP-0002', location: 'OUT-TRL', from: '2026-12-01', reason: 'Mutasi' });
ok('Penempatan baru efektif 2026-12-01, lama tetap sampai 30 Nov', HR.placementOn(hr(), 'EMP-0002', '2026-11-30').location === 'OUT-UBD' && HR.placementOn(hr(), 'EMP-0002', '2026-12-01').location === 'OUT-TRL');
ok('Ubud hari ini tetap 30', HR.people(hr(), 'hrd', { outlet: 'OUT-UBD' }).length === 30);
/* impor */
const pf = HR2.parseFile('karyawan-baru-nov.csv'); const rows = pf.rows.map((r, i) => ({ baris: i + 2, nama: r[0], posisi: r[1], outlet: r[2], shift: r[3], mulai: r[4], telepon: r[5] }));
U('import-commit', { batch: 'IMP-T', rows: JSON.stringify(rows) });
const res = hr().f2.lastImport.rows.map(r => r.result).join(',');
ok('Impor: valid, duplikat roster, outlet tak dikenal, duplikat file', res === 'Berhasil,Berhasil,Dilewati,Gagal,Dilewati', res);
const n1 = hr().people.length;
U('import-commit', { batch: 'IMP-T', rows: JSON.stringify(rows) });
ok('Impor ulang batch sama tidak menggandakan', hr().people.length === n1 && hr().f2.lastImport.rows.every(r => r.result === 'Dilewati'));
ok('Karyawan impor (mulai 2026-11-20) belum dihitung hari ini, terlihat sebagai akan bergabung', HR.people(hr(), 'hrd').length === 158 && HR.joiners(hr(), 'hrd').length === 2);
ok('Staf HRD bisa impor, Supervisor tidak', throws(() => HR.update(st, 'import-commit', { role: 'outlet-spv', batch: 'X', rows: '[]' }), /Akses ditolak/));
/* hapus dummy menjaga struktur F2 */
U('dummy-delete', { confirm: 'HAPUS DUMMY' });
ok('Hapus dummy: antrean, jadwal, kunjungan demo ikut terhapus', hr().people.length === 0 && !hr().queue.length && !hr().f2.schedules.length && !hr().f2.visits.length);
U('dummy-load', {});
ok('Mulai kembali: 158 dan F2 terisi lagi', HR.people(hr(), 'hrd').length === 158 && hr().f2.schedules.length > 0);
console.log(`\n${pass} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
