/* HAWK HRD F8 · uji model (node tests/hawk-live/hrd-f8-model.test.js) — kriteria NB F8 */
'use strict';
global.HR = require('../../hawk-live/hrd-model.js');
global.HR2 = require('../../hawk-live/hrd-f2-model.js');
global.HR3 = require('../../hawk-live/hrd-f3-model.js');
global.HR4 = require('../../hawk-live/hrd-f4-model.js');
global.HR5 = require('../../hawk-live/hrd-f5-model.js');
global.HR6 = require('../../hawk-live/hrd-f6-model.js');
global.HR7 = require('../../hawk-live/hrd-f7-model.js');
const HR8 = require('../../hawk-live/hrd-f8-model.js');
let pass = 0, fail = 0;
const ok = (n, c, i = '') => { c ? pass++ : fail++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message) || (console.log('   ↳', e.message), false); } };
const st = {}; HR.ensure(st); HR.EXT.ensure(st.hr); const hr = () => st.hr;
const U = (role, a, i) => HR.update(st, a, { by: role, role, ...i });
const tasks = () => hr().f3.tasks;

/* Jalur 1: Race Vegen → Beacon, bobot 99/100/101, versi */
const ar = HR8.activeRace(hr());
ok('Race awal: 6 indikator, bobot 20/10/20/20/20/10 = 100%', ar.ver.indicators.map(i => i.weight).join('/') === '20/10/20/20/20/10' && ar.ver.indicators.reduce((s, i) => s + i.weight, 0) === 100);
const rsH = HR8.raceScore(hr(), ar.ver, 'hrd'), rsO = HR8.raceScore(hr(), ar.ver, 'owner');
ok('Skor Race terukur 0–100, gap tidak dihitung nol', rsH.score > 0 && rsH.score <= 100 && rsH.pillars.find(p => p.id === 'IND-3').s.gaps === 1);
ok('Utility Race = F5 total jam ÷ kapasitas (rasio total, bukan rata-rata)', (() => { const m = HR8.metric(hr(), 'Therapist Utility'); const os = HR.OUTLETS.map(o => HR5.outletUtil(hr(), o.id, '2610')); return m.actual === Math.round(os.reduce((s, x) => s + x.done, 0) / os.reduce((s, x) => s + x.cap, 0) * 1000) / 10; })());
ok('Rasio biaya terbatas: Owner tidak melihat nilainya', rsO.pillars[0].s.restricted && !rsO.pillars[0].s.visible.some(m => m.key === 'Rasio biaya tenaga kerja') && rsH.pillars[0].s.visible.some(m => m.key === 'Rasio biaya tenaga kerja'));
ok('Beacon 15/25/25/20/15 = 100%, setiap Beacon menaut indikator induk & Task ID', HR8.ensure(hr()).beacon.items.map(b => b.weight).join('/') === '15/25/25/20/15' && HR8.ensure(hr()).beacon.items.every(b => HR8.PILLARS.some(p => p.id === b.parent) && tasks().some(t => t.id === b.task)));
ok('Therapist tidak bisa membuat draf Race', throws(() => U('therapist', 'race-draft', {}), /Akses ditolak/));
const dv = U('hrd', 'race-draft', {});
ok('Draf versi baru v2', dv === 'RACE-HG-2611-v2');
U('hrd', 'race-edit', { id: 'IND-1', weight: 19 });
ok('Bobot 99% ditolak, tetap draf', throws(() => U('hrd', 'race-activate', {}), /Total bobot 99%/) && HR8.activeRace(hr()).ver.v === 1);
U('hrd', 'race-edit', { id: 'IND-1', weight: 21 });
ok('Bobot 101% ditolak, tetap draf', throws(() => U('hrd', 'race-activate', {}), /Total bobot 101%/));
U('hrd', 'race-edit', { add: '1', name: 'Employer Branding', weight: 0, keys: 'Share Loker' });
U('hrd', 'race-edit', { id: 'IND-1', weight: 20 });
ok('Tambah indikator ke draf (bobot 0) → total 100%', HR8.activeRace(hr()).draft.indicators.length === 7);
ok('Indikator nama < 3 karakter ditolak', throws(() => U('hrd', 'race-edit', { add: '1', name: 'x' }), /minimal 3/));
U('hrd', 'race-activate', {});
const r2 = HR8.ensure(hr()).races[0];
ok('Aktivasi 100%: v2 aktif, v1 diarsip dan definisinya utuh', HR8.activeRace(hr()).ver.v === 2 && r2.versions[0].status === 'Arsip' && r2.versions[0].indicators.length === 6);
ok('Beacon review wajib semua kriteria & alasan', throws(() => U('hrd', 'beacon-review', { id: 'BCN-02', r0: 3, reason: 'cukup panjang sekali' }), /Success Factors/) && throws(() => U('hrd', 'beacon-review', { id: 'BCN-02', r0: 3, r1: 3, r2: 3, r3: 3, r4: 3, r5: 3, reason: 'x' }), /Alasan/));
const rv = U('hg-lead', 'beacon-review', { id: 'BCN-02', r0: 3, r1: 3, r2: 4, r3: 2, r4: 3, r5: 3, reason: 'Formasi Ubud berjalan sesuai rencana', evidence: 'TSK-0004' });
const rvo = HR8.ensure(hr()).beacon.items.find(b => b.id === 'BCN-02').reviews[0];
ok('Review mencatat bukti, penilai, alasan, waktu & rubric version', rv === 'RVW-BCN-02-1' && rvo.evidence === 'TSK-0004' && rvo.by === 'hg-lead' && rvo.at && rvo.rubric === 'RF v1' && rvo.avg === 3);

/* Jalur 2: Daily → Weekly → Monthly memakai Task ID yang sama */
const d = HR8.daily(hr(), 'EMP-0142');
ok('Daily: komitmen = My Day F3 (kartu yang sama)', d.focus.map(t => t.id).join() === HR3.focusOf(hr(), 'EMP-0142').map(t => t.id).join() && d.focus.length > 0);
U('hrd', 'task-blocker', { id: d.focus[0].id, reason: 'Data POS Ubud belum lengkap' });
ok('Blocker dari Daily terlihat di kartu Planner', !!tasks().find(t => t.id === d.focus[0].id).blocker && HR8.daily(hr(), 'EMP-0142').blocked.some(t => t.id === d.focus[0].id));
const s1 = U('hrd', 'race-session', { kind: 'Daily', commits: d.focus.map(t => t.id).join(',') });
ok('Sesi Daily menyimpan status saat review', HR8.ensure(hr()).sessions.find(s => s.id === s1).status[d.focus[0].id] === d.focus[0].stage);
const old = tasks().find(t => t.id === 'TSK-0001'); const due0 = old.due;
U('hrd', 'task-edit', { id: 'TSK-0001', due: '2026-11-05' });
const w = HR8.weekly(hr(), 'HRD');
const carried = w.carried.find(c => c.t.id === 'TSK-0001');
ok('Weekly: pekerjaan terbawa mempertahankan Task ID & tenggat asal dari histori', !!carried && carried.originalDue === due0 && carried.t.due === '2026-11-05');
ok('Tindakan mingguan wajib PIC & tenggat', throws(() => U('hrd', 'weekly-action', { title: 'Jadwalkan praktik kandidat' }), /PIC dan tenggat/));
const wa = U('hrd', 'weekly-action', { title: 'Jadwalkan praktik kandidat Ubud', pic: 'EMP-0145', due: '2026-11-20', sourceId: 'TSK-0004' });
const wat = tasks().find(t => t.id === wa);
ok('Tindakan mingguan = Workplan F3 bertaut sumber, PIC, tenggat', wat.stage === 'Workplan' && wat.source.id === 'TSK-0004' && wat.pic === 'EMP-0145' && wat.due === '2026-11-20');
ok('Retry tindakan yang sama tidak menggandakan kartu', U('hrd', 'weekly-action', { title: 'Jadwalkan praktik kandidat Ubud', pic: 'EMP-0145', due: '2026-11-20', sourceId: 'TSK-0004' }) === wa);

/* Jalur 3: F5 Ubud > 100% → Reflection Issue → STRACON → Workplan → evaluasi */
const rows = HR8.reflection(hr(), '2611', 'hrd'), ubd = rows.find(r => r.key === 'UTIL-OUT-UBD');
ok('Reflection Ubud = F5 Minggu 46 (> 100%)', ubd.actual === Math.round(HR5.outletUtil(hr(), 'OUT-UBD', 'W46').u * 1000) / 10 && ubd.actual > 100 && HR8.gapOf(ubd) === 'Di atas kapasitas');
const oct = HR8.reflection(hr(), '2610', 'hrd');
ok('Reflection Oktober = F5 Oktober (sama dengan Beranda F1)', oct.find(r => r.key === 'UTIL-OUT-SHT').actual === Math.round(HR5.outletUtil(hr(), 'OUT-SHT', '2610').u * 1000) / 10);
ok('Biaya Reflection = batch F7 periode sama', (() => { const r = rows.find(x => x.key === 'THP'); return r.actual === HR7.totals(HR7.batchLines(hr(), '2611')).thp; })());
ok('Biaya tersembunyi untuk Owner & Staf HRD', HR8.reflection(hr(), '2611', 'owner').filter(r => r.sec === 'Biaya').every(r => r.hidden) && throws(() => U('hrd-ops', 'rfl-mark', { key: 'SALR', period: '2611' }), /khusus Manager HRD/));
const iss = U('hrd', 'rfl-mark', { key: 'UTIL-OUT-UBD', period: '2611', stage: 'Issue' });
const ist = tasks().find(t => t.id === iss);
ok('Temuan Ubud → Issue F3 dengan Finding ID & sumber', ist.stage === 'Issue' && ist.finding === 'FND-UTIL-UBD-2611' && ist.source.id === 'UTIL-OUT-UBD-2611' && ist.source.type === 'Monthly Reflection');
ok('Penandaan ulang membuka kartu yang sama', U('hrd', 'rfl-mark', { key: 'UTIL-OUT-UBD', period: '2611', stage: 'Workplan' }) === iss);
ok('Shanti < 70%: penandaan dedupe dengan temuan F5 (TSK-0002)', U('hrd', 'rfl-mark', { key: 'UTIL-OUT-SHT', period: '2611' }) === 'TSK-0002');
const n = U('hrd-ops', 'rfl-note', { period: '2611', sec: 'Kapasitas', text: 'Lembur Ubud karena 2 formasi kosong', evidence: 'UTIL-OUT-UBD-2611' });
ok('Catatan penyebab selisih tersimpan dengan bukti', HR8.ensure(hr()).notes.find(x => x.id === n).evidence === 'UTIL-OUT-UBD-2611');
ok('Keputusan wajib alasan, pemilik, tenggat', throws(() => U('hrd', 'dec-create', { title: 'Tambah 2 therapist', reason: 'pendek' }), /Alasan/) && throws(() => U('hrd', 'dec-create', { title: 'Tambah 2 therapist', reason: 'Utility di atas 100%' }), /pemilik/));
const dec = U('hrd', 'dec-create', { title: 'Tambah 2 therapist Spa Ubud', finding: 'FND-UTIL-UBD-2611', task: iss, alternatives: 'Lembur terjadwal|Bantuan Shanti|Rekrut 2 therapist', chosen: 'Rekrut 2 therapist', reason: 'Utility di atas 100% dan lembur berulang', owner: 'EMP-0142', due: '2026-11-30', ckey: 'UTIL-OUT-UBD', cop: '<=', cvalue: 100, cperiod: '2611' });
const D = () => HR8.ensure(hr()).decisions.find(x => x.id === dec);
ok('Decision ID menaut temuan, kartu, alternatif, kriteria', D().finding === 'FND-UTIL-UBD-2611' && D().task === iss && D().alternatives.length === 3 && D().criteria.key === 'UTIL-OUT-UBD');
const wp = U('hrd', 'dec-workplan', { id: dec });
const wpt = tasks().find(t => t.id === wp);
ok('Workplan dari keputusan: PIC, tenggat, sumber Decision ID', wpt.stage === 'Workplan' && wpt.pic === 'EMP-0142' && wpt.due === '2026-11-30' && wpt.source.id === dec && wpt.finding === 'FND-UTIL-UBD-2611');
ok('Workplan ulang tidak menggandakan kartu', U('hrd', 'dec-workplan', { id: dec }) === wp && tasks().filter(t => t.source?.id === dec).length === 1);
U('hrd', 'dec-evaluate', { id: dec });
ok('Evaluasi membandingkan hasil dengan kriteria saat keputusan (belum tercapai)', D().evaluation.met === false && D().evaluation.actual === ubd.actual && D().status === 'Dievaluasi');
const seedDec = HR8.ensure(hr()).decisions.find(x => x.id === 'DEC-2610-001');
const ev2 = HR8.evaluate(hr(), seedDec);
ok('Keputusan Oktober (Shanti shift split) dievaluasi di November: 66,2% < 70%', ev2.met === false && ev2.actual < 70);
ok('Staf HRD tidak bisa membuat keputusan STRACON', throws(() => U('hrd-ops', 'dec-create', { title: 'x x x x x', reason: 'alasan cukup panjang', owner: 'EMP-0142', due: '2026-11-30' }), /Akses ditolak/));

/* Jalur 4: e-Deck 8 halaman, snapshot, koreksi berversi, laporan */
ok('e-Deck 8 halaman, semua periode sama', HR8.PAGES.length === 8 && HR8.PAGES.every((_, k) => Array.isArray(HR8.deckPage(hr(), k, '2611', 'all', 'hrd'))));
ok('Halaman utility e-Deck = Reflection (periode & scope sama)', HR8.deckPage(hr(), 1, '2611', 'all', 'hrd').find(v => v.label === 'Utility Spa Ubud').value === ubd.actual);
ok('Biaya e-Deck tersembunyi untuk Owner', HR8.deckPage(hr(), 0, '2611', 'all', 'owner').find(v => v.restricted).hidden && !HR8.deckPage(hr(), 0, '2611', 'all', 'hrd').find(v => v.restricted).hidden);
ok('Scope outlet hanya memuat outlet itu', HR8.deckPage(hr(), 1, '2611', 'OUT-SHT', 'hrd').length === 1);
const sn = U('hrd', 'deck-snapshot', { period: '2611', scope: 'all', note: 'Review November' });
const S1 = HR8.ensure(hr()).snapshots.find(s => s.id === sn);
ok('Snapshot menyimpan versi metrik, scope, periode, kelengkapan, sensitif', S1.versions['MET-UTIL'] === 'v1' && S1.versions.RACE === 'v2' && S1.scope === 'all' && S1.completeness && S1.sensitive === true);
ok('Koreksi wajib alasan', throws(() => U('hrd', 'deck-snapshot', { prev: sn, page: 1, field: 'Utility Spa Ubud', value: 107, reason: 'x' }), /Alasan koreksi/));
const sn2 = U('hrd', 'deck-snapshot', { prev: sn, page: 1, field: 'Utility Spa Ubud', value: 107, reason: 'Koreksi data POS terlambat masuk' });
const S2 = HR8.ensure(hr()).snapshots.find(s => s.id === sn2);
const v2 = S2.pages[1].values.find(v => v.label === 'Utility Spa Ubud');
ok('Koreksi → versi berikutnya merujuk versi terdahulu, v1 tidak berubah', sn2 === sn.replace(/-v1$/, '-v2') && S2.prev === sn && v2.value === 107 && v2.before === ubd.actual && S1.pages[1].values.find(v => v.label === 'Utility Spa Ubud').value === ubd.actual);
const cat = HR8.catalog(hr(), 'hrd'), catO = HR8.catalog(hr(), 'owner');
ok('Pusat laporan: status Bukti kosong, Kedaluwarsa, Dikoreksi tersedia', ['Bukti kosong', 'Kedaluwarsa', 'Dikoreksi'].every(s => cat.some(r => r.status === s)));
ok('Laporan payroll: Akses ditolak untuk Owner, terbuka untuk Manager HRD', catO.find(r => r.id === 'RPT-PAY-2610').denied && !cat.find(r => r.id === 'RPT-PAY-2610').denied);
ok('Laporan utility Ubud menelusur ke kartu tindak lanjut', cat.find(r => r.id === 'RPT-UTIL-OUT-UBD').follow === 1);
const nT = tasks().length, nC = cat.length;
U('hrd-ops', 'report-refresh', { id: 'RPT-UTIL-OUT-UBD' }); U('hrd-ops', 'report-refresh', { id: 'RPT-UTIL-OUT-UBD', fail: '1' }); U('hrd-ops', 'report-refresh', { id: 'RPT-UTIL-OUT-UBD' });
ok('Retry refresh laporan tidak menggandakan data atau kartu', tasks().length === nT && HR8.catalog(hr(), 'hrd').length === nC && HR8.ensure(hr()).refresh['RPT-UTIL-OUT-UBD'].count === 3 && HR8.ensure(hr()).refresh['RPT-UTIL-OUT-UBD'].status === 'Diperbarui');

/* Jalur 6: akses & hapus dataset demo */
ok('Akses F8: therapist & Finance ditolak, Supervisor diizinkan (cakupan outlet)', !HR8.canSee('therapist') && !HR8.canSee('finance-manager') && HR8.canSee('outlet-spv'));
U('hrd', 'dummy-delete', { confirm: 'HAPUS DUMMY' });
HR.EXT.ensure(hr());
ok('Hapus dataset demo: snapshot, catatan, keputusan & tindak lanjut demo terhapus', HR8.ensure(hr()).snapshots.length === 0 && HR8.ensure(hr()).notes.length === 0 && !HR8.ensure(hr()).decisions.some(x => x.id === dec) && !tasks().some(t => t.id === wp));

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
