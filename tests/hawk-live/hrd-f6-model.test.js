/* HAWK HRD F6 · uji model (node tests/hawk-live/hrd-f6-model.test.js) — kriteria NB F6 */
'use strict';
global.HR = require('../../hawk-live/hrd-model.js');
global.HR2 = require('../../hawk-live/hrd-f2-model.js');
global.HR3 = require('../../hawk-live/hrd-f3-model.js');
global.HR4 = require('../../hawk-live/hrd-f4-model.js');
global.HR5 = require('../../hawk-live/hrd-f5-model.js');
const HR6 = require('../../hawk-live/hrd-f6-model.js');
let pass = 0, fail = 0;
const ok = (n, c, i = '') => { c ? pass++ : fail++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message) || (console.log('   ↳', e.message), false); } };
const st = {}; HR.ensure(st); HR.EXT.ensure(st.hr); const hr = () => st.hr;
const U = (role, a, i) => HR.update(st, a, { by: role, role, ...i });
const near = (a, b) => Math.abs(a - b) < 1e-6;

ok('SER: 15 ekspektasi dalam 3 kelompok (3 + 3 + 9)', HR6.SER.length === 15 && HR6.SER.filter(s => s.group === 'Executive Summary').length === 3 && HR6.SER.filter(s => s.group === 'Collaboration Group').length === 3);
ok('SER: rasio salary ditandai terbatas, Absenteeism perlu konfirmasi', HR6.SER.find(s => s.id === 'EXP-01').restricted && HR6.SER.find(s => s.id === 'EXP-12').dir === 'tbc' && HR6.SER.find(s => s.id === 'EXP-12').actual === null);
const x1 = HR6.xscore(hr(), 'EMP-0001');
const exp1 = 50 * Math.min(1, x1.comps[0].actual / 0.85) + 30 * Math.min(1, x1.comps[1].actual) + 20 * Math.min(1, x1.comps[2].actual / 10);
ok('XScore EMP-0001 = 50% Utility + 30% Produktivitas + 20% Learning (capaian dibatasi 100%)', near(x1.score, exp1) && x1.coverage === 100 && x1.status === 'Final', x1.score.toFixed(1));
ok('Setiap komponen punya Evidence ID', x1.comps.every(c => /^EVD-/.test(c.ev)));
const x4 = HR6.xscore(hr(), 'EMP-0004');
ok('Learning kosong → belum terverifikasi, cakupan 80%, provisional', x4.comps[2].status === 'Belum terverifikasi' && x4.coverage === 80 && /Provisional/.test(x4.status));
const x41 = HR6.xscore(hr(), 'EMP-0041');
ok('Nol terverifikasi dibedakan dari kosong (dihitung, cakupan 100%)', x41.comps[2].status === 'Nol terverifikasi' && x41.comps[2].ach === 0 && x41.coverage === 100);
const ub = HR6.therapists(hr(), 'OUT-UBD'), team = HR6.teamScore(hr(), 'OUT-UBD'), avg = HR6.avgX(hr(), ub);
ok('Skor tim (utility outlet ÷ target) terpisah dari rata-rata XScore personal', near(team.actual, 5512 / 5200) && team.ach === 1 && avg.avg !== null && !near(avg.avg, team.ach * 100));
ok('November provisional memakai jam POS F5 Minggu 46', HR6.xscore(hr(), 'EMP-0001', '2611').comps[0].actual > 0 && HR6.xscore(hr(), 'EMP-0001', '2611').status !== 'Final');
ok('Profil kompetensi EMP-0007 (mutasi Ubud → Shanti) menyimpan histori outlet lama', HR6.competencies(hr(), 'EMP-0007')[0].history.some(h => h.outlet === 'OUT-UBD') && HR.placementOn(hr(), 'EMP-0007').location === 'OUT-SHT');
ok('9-Box: bukti XScore belum lengkap → Belum Dinilai', HR6.nineOf(hr(), 'EMP-0004').label === 'Belum Dinilai' && /Bukti/.test(HR6.nineOf(hr(), 'EMP-0004').why));
const all = HR6.therapists(hr()).map(p => HR6.nineOf(hr(), p.id));
ok('9-Box memuat Stars dan Belum Dinilai', all.some(n => n.label === 'Stars') && all.some(n => n.label === 'Belum Dinilai'));

/* Jalur 1: skor → bukti → 9-Box → Workplan coaching */
const emp = 'EMP-0001', b0 = HR6.nineOf(hr(), emp);
ok('Pindah kotak tanpa alasan ditolak', throws(() => U('hg-lead', 'nine-move', { emp, box: 'M-H', reason: '' }), /Alasan/));
U('hg-lead', 'nine-move', { emp, box: 'M-H', reason: 'Asesmen potensi Nov: siap mentor hot stone' });
const b1 = HR6.nineOf(hr(), emp);
ok('Perpindahan 9-Box mencatat alasan, periode, reviewer dan kotak asal', b1.label === 'Calon Bintang' && b1.moves[0].from === b0.box && b1.moves[0].period === '2610' && b1.moves[0].by === 'hg-lead');
ok('Belum final sebelum validasi Supervisor & HG', !b1.final);
U('outlet-spv', 'nine-validate', { emp }); U('hg-lead', 'nine-validate', { emp });
ok('Final setelah Supervisor dan HG memvalidasi', HR6.nineOf(hr(), emp).final);
ok('Supervisor Ubud tidak bisa memvalidasi therapist Shanti', throws(() => U('outlet-spv', 'nine-validate', { emp: HR6.therapists(hr(), 'OUT-SHT').find(p => HR6.nineOf(hr(), p.id).box).id }), /cakupan/));
ok('Belum Dinilai tidak bisa divalidasi', throws(() => U('hg-lead', 'nine-validate', { emp: 'EMP-0004' }), /Belum Dinilai/));
const plan = U('hg-lead', 'plan-create', { emp, comp: 'COMP-HYG', from: 'ninebox' });
const P = hr().f6.plans.find(p => p.id === plan);
ok('Rencana pengembangan membuat Workplan F3 dengan PIC mentor & tenggat', /^TSK-/.test(P.task) && hr().f3.tasks.find(t => t.id === P.task).stage === 'Workplan' && hr().f3.tasks.find(t => t.id === P.task).pic === P.mentor);
ok('Menandai ulang kebutuhan yang sama → rencana & kartu yang sama', U('outlet-spv', 'plan-create', { emp, comp: 'COMP-HYG' }) === plan && hr().f3.tasks.filter(t => t.source?.id === `DEV-${emp}-COMP-HYG`).length === 1);
const ev = U('outlet-spv', 'plan-evidence', { id: plan, note: 'Praktik SOP hygiene 30 menit, lulus checklist' });
ok('Bukti coaching tersimpan pada rencana', /^EVD-COA-/.test(ev) && P.evidence.length === 1);

/* Jalur 2: verifikasi praktik → kompetensi + KPI Learning (bukti sama) */
const prg = HR6.programs(hr()).find(p => p.id === 'PRG-HOT-2611');
const pt = prg.participants.find(x => x.practice === 'Menunggu verifikasi' && x.attend === 'Hadir');
const lvl0 = HR6.competencies(hr(), pt.emp).find(c => c.id === 'COMP-HOT').level, learn0 = HR6.raw(hr(), pt.emp, '2611').learn || 0;
ok('Kehadiran dan praktik dibaca terpisah (hadir tapi belum diverifikasi)', pt.attend === 'Hadir' && pt.practice === 'Menunggu verifikasi');
const e2 = U('outlet-spv', 'train-verify', { id: 'PRG-HOT-2611', emp: pt.emp });
const comp = HR6.competencies(hr(), pt.emp).find(c => c.id === 'COMP-HOT');
ok('Lulus praktik → kompetensi naik ke target dengan bukti praktik', comp.level === Math.max(lvl0, 3) && (lvl0 >= 3 || comp.history.slice(-1)[0].ev === e2));
ok('KPI Learning November bertambah 4 jam dengan bukti yang sama', HR6.raw(hr(), pt.emp, '2611').learn === learn0 + 4 && hr().f6.learnLog.slice(-1)[0].ev === e2);
ok('Verifikasi ulang → bukti sama (tidak ganda)', U('outlet-spv', 'train-verify', { id: 'PRG-HOT-2611', emp: pt.emp }) === e2 && hr().f6.learnLog.filter(l => l.ev === e2).length === 1);
const absent = prg.participants.find(x => x.attend === 'Tidak hadir');
ok('Peserta tidak hadir tidak bisa diluluskan', throws(() => U('hg-lead', 'train-verify', { id: 'PRG-HOT-2611', emp: absent.emp }), /hadir/));
const te = HR6.trainingEff(hr());
ok('Efektivitas pelatihan = lulus ÷ terverifikasi, dengan cakupan verifikasi', near(te.rate, te.passed / te.verified) && te.coverage < 1);
const q = HR6.qoh(hr());
ok('Quality of Hire memakai cohort dinilai, review tertunda terlihat', q.pending === 2 && near(q.rate, q.good / q.reviewed));

/* Jalur 3: SER → versi metrik → kontrak → tutup → koreksi */
const v = U('hrd', 'kpi-version', { id: 'MET-UTIL', formula: 'Jam treatment selesai ÷ jam bookable terjadwal', note: 'Penyebut memakai jam bookable F5' });
ok('Perubahan definisi membuat versi baru', v === 'MET-UTIL-v2' && HR6.metricOf(hr(), 'MET-UTIL').versions.length === 2);
ok('Kontrak aktif & snapshot lama tetap merujuk v1', hr().f6.contracts.find(c => c.id === 'CTR-2611-THR').items.find(i => i.metric === 'MET-UTIL').version === 1 && hr().f6.contracts.find(c => c.id === 'CTR-2610-THR').snapshot.versions['MET-UTIL'] === 1);
ok('Staf HRD tidak bisa mengubah definisi KPI', throws(() => U('hrd-ops', 'kpi-version', { id: 'MET-UTIL', formula: 'abcdefghij', note: 'uji akses' }), /Akses ditolak/));
ok('Kontrak Receptionist bobot 90% tidak bisa diajukan', throws(() => U('hrd', 'ctr-submit', { id: 'CTR-2612-RCP' }), /tepat 100%/));
U('hrd', 'ctr-weight', { id: 'CTR-2612-RCP', metric: 'MET-RRESP', weight: '30' });
U('hg-lead', 'ctr-submit', { id: 'CTR-2612-RCP' });
ok('HG Lead tidak bisa mengaktifkan', throws(() => U('hg-lead', 'ctr-activate', { id: 'CTR-2612-RCP' }), /Manager HRD/));
U('hrd', 'ctr-activate', { id: 'CTR-2612-RCP' });
ok('Bobot 100% → diajukan → diaktifkan Manager HRD', hr().f6.contracts.find(c => c.id === 'CTR-2612-RCP').status === 'Aktif');
ok('Bobot tidak bisa diubah setelah aktif', throws(() => U('hrd', 'ctr-weight', { id: 'CTR-2612-RCP', metric: 'MET-RRESP', weight: '10' }), /draf/));
ok('Tutup periode dengan bukti belum lengkap butuh konfirmasi', throws(() => U('hrd', 'ctr-close', { id: 'CTR-2611-THR' }), /bukti belum lengkap/));
U('hrd', 'ctr-close', { id: 'CTR-2611-THR', ack: '1' });
const c11 = hr().f6.contracts.find(c => c.id === 'CTR-2611-THR');
ok('Penutupan menyimpan versi, nilai, cakupan dan bukti', c11.status === 'Ditutup' && c11.snapshot.versions['MET-UTIL'] === 1 && Object.keys(c11.snapshot.values).length === 100 && /belum lengkap/.test(c11.snapshot.coverageNote));
const k = U('therapist', 'ctr-correct', { id: 'CTR-2610-THR', emp: hr().roleEmp.therapist, metric: 'MET-LEARN', value: '10', reason: 'Jam pelatihan 12 Okt belum tercatat' });
ok('Therapist mengajukan koreksi bukti setelah penutupan (tercatat, menunggu review)', /^KOR-2610-/.test(k) && hr().f6.corrections.find(x => x.id === k).status === 'Menunggu Review');
ok('Therapist tidak bisa mengoreksi scorecard orang lain', throws(() => U('therapist', 'ctr-correct', { id: 'CTR-2610-THR', emp: 'EMP-0002', metric: 'MET-LEARN', value: '9', reason: 'uji akses orang lain' }), /Akses ditolak/));
U('hg-lead', 'ctr-correct-review', { id: k });
ok('Koreksi diterima memperbarui XScore dengan jejak koreksi', HR6.xscore(hr(), hr().roleEmp.therapist).comps[2].actual === 10 && HR6.xscore(hr(), hr().roleEmp.therapist).corrections[0].status === 'Diterima');
ok('Audit memuat versi KPI, aktivasi, penutupan & koreksi', ['Versi KPI baru', 'Aktivasi kontrak KPI', 'Tutup periode KPI', 'Review koreksi KPI', 'Pindah 9-Box', 'Verifikasi praktik'].every(a => hr().audit.some(x => x.action === a)));
ok('Owner tidak diberi skor personal; Finance tidak punya akses HG', !HR6.personalOk('owner') && !HR6.canSee(hr(), 'finance-manager', 'EMP-0001'));

HR.update(st, 'dummy-delete', { by: 'hrd', role: 'hrd', confirm: 'HAPUS DUMMY' });
HR.update(st, 'dummy-load', { by: 'hrd', role: 'hrd' });
ok('Hapus & muat ulang dummy: rencana/9-Box/koreksi demo bersih, MET-UTIL kembali v1', hr().f6.plans.length === 0 && hr().f6.nine.length === 0 && hr().f6.corrections.length === 0 && HR6.metricOf(hr(), 'MET-UTIL').versions.length === 1);
console.log(`\n${pass} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
