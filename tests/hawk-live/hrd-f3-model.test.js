/* HAWK HRD F3 · uji model (node tests/hawk-live/hrd-f3-model.test.js) — kriteria NB F3 */
'use strict';
global.HR = require('../../hawk-live/hrd-model.js');
global.HR2 = require('../../hawk-live/hrd-f2-model.js');
const HR3 = require('../../hawk-live/hrd-f3-model.js');
let pass = 0, fail = 0;
const ok = (n, c, i = '') => { c ? pass++ : fail++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message) || (console.log('   ↳', e.message), false); } };
const st = {}; HR.ensure(st); HR2.ensure(st.hr); HR3.ensure(st.hr); const hr = () => st.hr;
const U = (role, a, i) => HR.update(st, a, { by: role, role, ...i });
const T = (id) => hr().f3.tasks.find(t => t.id === id);
ok('Seed: 13 kartu, 7 tahap', hr().f3.tasks.length === 13 && HR3.STAGES.length === 7);
/* temuan → kartu */
const src = { ws: 'HRD', stage: 'Issue', title: 'Utility Spa Ubud 106%: kapasitas kurang', scope: 'OUT-UBD', sourceId: 'UTIL-OUT-UBD-2611', sourceType: 'Utility', finding: 'FND-UTIL-UBD-2611' };
const id = U('hrd', 'task-create', src);
ok('Tandai temuan Ubud sebagai Issue', T(id).stage === 'Issue' && T(id).source.id === 'UTIL-OUT-UBD-2611');
ok('Penandaan ulang membuka kartu yang sama', U('hrd', 'task-create', src) === id && hr().f3.tasks.length === 14);
ok('Workplan tanpa PIC/tenggat ditolak', throws(() => U('hrd', 'task-move', { id, to: 'Workplan' }), /PIC dan tenggat/));
U('hrd', 'task-assign', { id, field: 'pic', emp: 'EMP-0143' }); U('hrd', 'task-edit', { id, due: '2026-11-20' });
U('hrd', 'task-move', { id, to: 'Workplan', via: 'drag' });
const evs = hr().f3.events.filter(e => e.task === id);
ok('Perpindahan mencatat aktor, asal, tujuan, via', evs.some(e => e.kind === 'Pindah tahap' && e.before === 'Issue' && e.after === 'Workplan' && e.by === 'hrd' && e.reason === 'via drag'));
ok('Ganti PIC tercatat sebagai event terpisah', evs.some(e => e.kind === 'Ganti PIC' && e.after === 'EMP-0143'));
/* konflik versi */
const v = T(id).version; U('hrd-ops', 'task-comment', { id, text: 'Saya cek data POS' });
ok('Konflik versi terdeteksi', throws(() => U('hrd', 'task-move', { id, to: 'Priority', version: v }), /Konflik/));
/* My Day */
const before = JSON.stringify([T(id).due, T(id).pic, T(id).stage]);
U('hrd-ops', 'focus-toggle', { id });
ok('My Day: fokus ditambah tanpa mengubah tenggat/PIC/status', HR3.focusOf(hr(), 'EMP-0143').some(t => t.id === id) && JSON.stringify([T(id).due, T(id).pic, T(id).stage]) === before);
U('hrd', 'task-assign', { id, field: 'pic', emp: 'EMP-0145' });
ok('Penugasan ulang memperbarui My Tasks kedua PIC', !HR3.myTasks(hr(), 'hrd-ops').some(t => t.id === id) && HR.update && HR3.visible(hr(), 'hrd').filter(t => t.pic === 'EMP-0145').some(t => t.id === id));
ok('Fokus PIC lama dilepas saat penugasan ulang', !HR3.focusOf(hr(), 'EMP-0143').some(t => t.id === id));
/* template */
const p = U('hrd', 'template-apply', { template: 'TPL-ONB', emp: 'EMP-0001', start: '2026-11-24' });
const subs = hr().f3.tasks.filter(t => t.parent === p);
ok('Template onboarding: 1 induk + 6 subtugas tertaut', subs.length === 6 && T(p).checklist.length === 6 && T(p).checklist.every(c => subs.some(s => s.id === c.sub)));
ok('Subtugas HRD dan HG dengan PIC berbasis peran', subs.some(s => s.ws === 'HRD' && s.pic === 'EMP-0143') && subs.some(s => s.ws === 'HG' && s.pic === 'EMP-0144') && subs.some(s => s.pic === 'EMP-0153'));
ok('Tenggat relatif (H-3 dan H+10)', subs[0].due === '2026-11-21' && T(p).due === '2026-12-04');
ok('Subtugas Supervisor muncul di My Tasks Supervisor', HR3.myTasks(hr(), 'outlet-spv').some(t => subs.some(s => s.id === t.id)));
ok('Agenda kalender memuat sesi orientasi', HR3.agenda(hr(), 'hrd').some(a => a.kind === 'Sesi' && subs.some(s => s.id === a.task)));
ok('Menerapkan ulang template yang sama membuka kartu yang sama', U('hrd', 'template-apply', { template: 'TPL-ONB', emp: 'EMP-0001', start: '2026-11-24' }) === p);
U('hrd', 'template-version', { template: 'TPL-ONB', note: 'Tambah foto seragam', step: 'Foto seragam & ID card', picRole: 'Staf HRD', rel: '0' });
const p2 = U('hrd', 'template-apply', { template: 'TPL-ONB', emp: 'EMP-0002', start: '2026-11-24' });
ok('Versi template baru berlaku pada penggunaan berikutnya', T(p2).checklist.length === 7 && T(p).checklist.length === 6 && T(p2).source.templateVersion === 3 && T(p).source.templateVersion === 2);
/* review & checklist */
ok('Selesai ditolak saat checklist belum lengkap', throws(() => U('hrd', 'task-move', { id: 'TSK-0003', to: 'Selesai' }), /checklist/));
ok('Kartu wajib review tidak bisa langsung Selesai', throws(() => { const t = T('TSK-0006'); U('hrd-ops', 'task-move', { id: 'TSK-0006', to: 'Selesai' }); }, /wajib direview/));
U('hrd', 'task-review', { id: 'TSK-0006', decision: 'return', note: 'Lampirkan bukti unggah' });
ok('Review mengembalikan kartu dengan catatan', T('TSK-0006').stage === 'Dikerjakan' && T('TSK-0006').discussion.some(m => /Revisi/.test(m.text)));
U('hrd-ops', 'task-move', { id: 'TSK-0006', to: 'Review' });
ok('Hanya reviewer yang memutuskan', throws(() => U('hrd-ops', 'task-review', { id: 'TSK-0006', decision: 'accept' }), /reviewer/));
U('hrd', 'task-review', { id: 'TSK-0006', decision: 'accept' });
ok('Review diterima → Selesai', T('TSK-0006').stage === 'Selesai');
/* blocker */
U('hg-lead', 'task-blocker', { id: 'TSK-0101', reason: 'Ruang training dipakai tamu', waiting: 'EMP-0155', next: 'Pindah ke Senin' });
ok('Blocker dengan alasan dan pihak yang ditunggu', T('TSK-0101').blocker.waiting === 'EMP-0155');
/* akses */
ok('Staf HRD tidak melihat workplace HG (kecuali tertaut)', !HR3.visible(hr(), 'hrd-ops').some(t => t.id === 'TSK-0103'));
ok('HG Lead tidak bisa mengubah kartu HRD di luar cakupan', throws(() => U('hg-lead', 'task-move', { id: 'TSK-0008', to: 'Priority' }), /Akses ditolak/));
ok('Kartu bersumber payroll tersembunyi dari non-Manager', !HR3.visible(hr(), 'hrd-ops').some(t => t.id === 'TSK-0007') && HR3.visible(hr(), 'hrd').some(t => t.id === 'TSK-0007'));
ok('Finance Manager: tanpa kartu', HR3.visible(hr(), 'finance-manager').length === 0);
ok('Supervisor Ubud melihat kartu Ubud', HR3.visible(hr(), 'outlet-spv').some(t => t.id === id));
/* hapus dummy */
U('hrd', 'dummy-delete', { confirm: 'HAPUS DUMMY' });
ok('Hapus dummy menghapus kartu & event demo', hr().f3.tasks.length === 0 && hr().f3.events.length === 0);
U('hrd', 'dummy-load', {});
ok('Mulai kembali: 13 kartu seed', hr().f3.tasks.length === 13 && HR.people(hr(), 'hrd').length === 158);
console.log(`\n${pass} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
