/* HAWK HRD F1 · uji model (node tests/hawk-live/hrd-model.test.js) — kriteria NB F1 */
'use strict';
const HR = require('../../hawk-live/hrd-model.js');
let pass = 0, fail = 0;
const ok = (name, cond, info = '') => { cond ? pass++ : fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message); } };

const st = {}; const hr = HR.ensure(st);
ok('Rekonsiliasi roster brief: semua cek cocok', HR.reconcile(hr).every(c => c.ok), HR.reconcile(hr).filter(c => !c.ok).map(c => c.label).join());
ok('Total 158 pada cakupan perusahaan', HR.people(hr, 'hrd').length === 158);
ok('Filter Spa Ubud = 30 orang', HR.people(hr, 'hrd', { outlet: 'OUT-UBD' }).length === 30);
ok('Setiap outlet 25 Therapist + 5 Receptionist', HR.OUTLETS.every(o => { const l = HR.people(hr, 'hrd', { outlet: o.id }); return l.filter(p => p.position === 'POS-THR').length === 25 && l.filter(p => p.position === 'POS-RCP').length === 5; }));
ok('Spa Bhisma + Receptionist = 5', HR.people(hr, 'hrd', { outlet: 'OUT-BSM' }).filter(p => p.position === 'POS-RCP').length === 5);
ok('PC dan Commercial tidak menambah total', HR.people(hr, 'hrd', { division: 'DIV-PC' }).length === 0 && HR.people(hr, 'hrd', { division: 'DIV-COM' }).length === 0);
ok('Nama samaran unik', new Set(hr.people.map(p => p.name)).size === hr.people.length);
ok('Employee ID stabil antar fixture', JSON.stringify(HR.fresh().people.map(p => p.id + p.name)) === JSON.stringify(hr.people.map(p => p.id + p.name)));
/* penempatan efektif */
ok('EMP-0007 di Spa Santi sejak 2026-10-01', HR.placementOn(hr, 'EMP-0007').location === 'OUT-SHT' && HR.placementOn(hr, 'EMP-0007').from === '2026-10-01');
ok('EMP-0007 di Spa Ubud pada 2026-09-15 (histori)', HR.placementOn(hr, 'EMP-0007', '2026-09-15').location === 'OUT-UBD');
ok('Atasan therapist Ubud = Supervisor Mila', HR.people(hr, 'hrd').find(p => p.id === HR.supervisorOf(hr, 'EMP-0001')).name === 'Mila');
/* cakupan peran */
ok('Staf HRD melihat 158, tanpa payroll', HR.people(hr, 'hrd-ops').length === 158 && HR.roleDef('hrd-ops').payroll === 'none' && !HR.can('hrd-ops', 'payroll.view'));
ok('Manager HRD: payroll detail', HR.roleDef('hrd').payroll === 'detail' && HR.can('hrd', 'payroll.view'));
ok('Supervisor Ubud: 30 tim + diri sendiri', HR.people(hr, 'outlet-spv').length === 31);
ok('Operational Manager: Divisi Operational (120 + 8)', HR.people(hr, 'ops-manager').length === 128);
ok('Therapist ESS: hanya data sendiri', HR.people(hr, 'therapist').length === 1);
ok('Finance Manager: tanpa akses HRD', HR.people(hr, 'finance-manager').length === 0 && !HR.can('finance-manager', 'dashboard'));
/* pengaturan + audit */
const n0 = hr.audit.length;
HR.update(st, 'numbering-set', { role: 'hrd', by: 'Uji', id: 'NUM-VAC', pattern: 'LWG-{YY}-{000}' });
ok('Simpan penomoran → audit sebelum/sesudah', hr.audit.length === n0 + 1 && hr.audit[0].before === 'VAC-{YY}{MM}-{000}' && hr.audit[0].after === 'LWG-{YY}-{000}' && hr.audit[0].ref === 'NUM-VAC');
ok('Staf HRD tidak bisa ubah pengaturan', throws(() => HR.update(st, 'numbering-set', { role: 'hrd-ops', id: 'NUM-VAC', pattern: 'X-{000}' }), /Akses ditolak/));
ok('Pola tanpa nomor urut ditolak', throws(() => HR.update(st, 'numbering-set', { role: 'hrd', id: 'NUM-VAC', pattern: 'X' }), /nomor urut/));
HR.update(st, 'account-role', { role: 'hrd', by: 'Uji', emp: 'EMP-0100', newrole: 'hrd-ops' });
ok('Perubahan akses tercatat dengan aktor dan ID objek', hr.audit[0].object === 'Akses' && hr.audit[0].ref === 'EMP-0100' && hr.audit[0].by === 'Uji');
ok('Staf HRD tidak bisa ubah role akun', throws(() => HR.update(st, 'account-role', { role: 'hrd-ops', emp: 'EMP-0101', newrole: 'hrd-ops' }), /Akses ditolak/));
ok('Uji koneksi tanpa produksi: POS = Gagal (simulasi)', /Gagal/.test(HR.update(st, 'integration-test', { role: 'hrd', id: 'HAWK POS / transaksi outlet' })));
/* dataset demo */
ok('Hapus dummy butuh konfirmasi teks', throws(() => HR.update(st, 'dummy-delete', { role: 'hrd', confirm: 'ya' }), /HAPUS DUMMY/));
ok('Staf HRD tidak bisa hapus dummy', throws(() => HR.update(st, 'dummy-delete', { role: 'hrd-ops', confirm: 'HAPUS DUMMY' }), /Akses ditolak/));
HR.update(st, 'test-add-real', { role: 'hrd', by: 'Uji' });
const removed = HR.update(st, 'dummy-delete', { role: 'hrd', by: 'Uji', confirm: 'HAPUS DUMMY' });
const h2 = st.hr;
ok('Hapus dummy: 158 profil demo terhapus', removed === 158);
ok('Record non-demo tetap utuh (profil + penempatan + akun)', h2.people.length === 1 && h2.people[0].id === 'EMP-REAL-001' && h2.placements.some(p => p.emp === 'EMP-REAL-001') && HR.placementOn(h2, 'EMP-REAL-001'));
ok('Audit log tetap ada setelah hapus', h2.audit.some(a => a.action === 'Hapus dataset dummy'));
HR.update(st, 'dummy-load', { role: 'hrd', by: 'Uji' });
ok('Mulai kembali dari fixture: 158 demo + 1 non-demo', st.hr.people.filter(p => p.demo).length === 158 && st.hr.people.some(p => p.id === 'EMP-REAL-001'));
ok('Mulai kembali tidak menggandakan non-demo', st.hr.people.filter(p => p.id === 'EMP-REAL-001').length === 1);

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
