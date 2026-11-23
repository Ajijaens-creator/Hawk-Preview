/* JAENS Mobile · uji penerimaan M1 (NB Addendum 14 Nov 2026 §10) pada preview HTML + simulasi R&D.
   Lima menu, presensi (wajah/lokasi/jam simulasi) → catatan F2 yang sama, tombol ganda/ulang = satu kejadian, offline + sinkronisasi,
   pengecualian & koreksi lewat approval Supervisor, tugas F3 dari mobile, chat & cakupan, POS spa, payroll khusus Manager HRD, reset.
   python3 -m http.server 8811 lalu node tests/hawk-live/hrd-mobile.e2e.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
const out = []; let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; out.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  await ctx.route(/basemaps\.cartocdn\.com|arcgisonline\.com/, r => r.abort());
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/net::/.test(m.text())) errors.push(m.text()); });
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png') }); };
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const U = (acc, action, input = {}) => p.evaluate(([acc, action, input]) => { const a = HRM.acc(acc); try { return { r: HR.update(HL.state, action, { role: a.role, account: a.id, by: a.id, ...input }) }; } catch (e) { return { e: e.message }; } }, [acc, action, input]);
  const J = (fn, arg) => p.evaluate(fn, arg);
  const go = async (h) => { await p.evaluate((x) => { location.hash = x; }, h); await p.waitForTimeout(250); };
  const scr = () => p.locator('.mob-screen').innerText();

  await p.goto(BASE + 'hrd.html#hrd-home'); await p.evaluate(() => localStorage.clear());
  await p.goto(BASE + 'hrd.html#hrd-mobile?as=ayu-indra'); await p.reload(); await p.waitForTimeout(900);
  await shot('MOB-01-beranda');
  const nav = await p.locator('.mob-nav a').allInnerTexts();
  ok('Lima menu: Beranda, Pekerjaan, Presensi, Inbox, Saya', nav.map(s => s.trim()).join('|') === 'Beranda|Pekerjaan|Presensi|Inbox|Saya', nav.join('|'));
  const s0 = await scr();
  ok('Beranda: nama, peran, outlet, shift hari ini, status Belum masuk, aksi Check-in kerja', /Ayu\./.test(s0) && /Spa Therapist/.test(s0) && /Spa Ubud/.test(s0) && /Pagi · 09:00–17:00/.test(s0) && /Belum masuk/.test(s0) && /Check-in kerja/.test(s0));

  /* 1. check-in lewat UI → F2 + Supervisor */
  await p.click('.mob-att [data-m="flow"][data-kind="in"]');
  ok('Pemberitahuan kamera & lokasi sebelum presensi pertama', /Sebelum presensi pertama/.test(await p.locator('.mob-sheet').innerText()));
  await p.click('[data-m="consent"]'); await p.click('[data-m="flow-step"]'); await shot('MOB-02-kamera');
  await p.click('[data-m="punch"]'); await p.waitForTimeout(200);
  const res = await p.locator('.mob-sheet').innerText(); await shot('MOB-03-hasil');
  ok('Bukti hasil: jenis, jam WITA, outlet, shift, status Terverifikasi, ID presensi', /Check-in kerja/.test(res) && /08:52 WITA/.test(res) && /Jaens Spa Center Ubud/.test(res) && /Pagi/.test(res) && /Terverifikasi/.test(res) && /PRS-20261113-0008-01/.test(res));
  await p.click('[data-m="flow-close"]');
  const f2 = await J(() => HR2.attendance(HL.state.hr, 'EMP-0008', HR.TODAY));
  ok('Catatan F2 yang sama: Hadir 08:52, bukti JAENS Mobile', f2.status === 'Hadir' && f2.in === '08:52' && /JAENS Mobile/.test(f2.evidence) && !f2.provisional, JSON.stringify([f2.status, f2.in]));
  ok('Status karyawan: Bekerja', /Bekerja/.test(await scr()));
  await go('hrd-mobile?as=mila&tab=work');
  ok('Supervisor Mila melihat Ayu Indra hadir 08:52 di Kontrol shift', /Ayu Indra[\s\S]{0,60}masuk 08:52[\s\S]{0,20}Hadir/.test(await scr()));

  /* 2. istirahat & check-out menyambung shift yang sama */
  const clock = (t) => U('made', 'm-clock', { time: t });
  await clock('12:00'); let r = await U('ayu-indra', 'm-punch', { kind: 'break', req: 'T-BRK' });
  await clock('12:45'); await U('ayu-indra', 'm-punch', { kind: 'resume', req: 'T-RES' });
  ok('Istirahat 45 menit tercatat', (await J(() => HR2.attendance(HL.state.hr, 'EMP-0008', HR.TODAY))).breakMin === 45);
  const bad = await U('ayu-indra', 'm-punch', { kind: 'in', req: 'T-IN2' });
  ok('Check-in kedua ditolak saat Bekerja', /tidak tersedia/.test(bad.e || ''));

  /* 3. tombol ganda / ulang setelah putus = satu kejadian */
  await clock('17:05');
  const o1 = await U('ayu-indra', 'm-punch', { kind: 'out', req: 'T-OUT' }), o2 = await U('ayu-indra', 'm-punch', { kind: 'out', req: 'T-OUT' });
  const outs = await J(() => HL.state.hr.mob.punches.filter(x => x.emp === 'EMP-0008' && x.kind === 'out').length);
  ok('Check-out ditekan dua kali (ID sesi sama) → satu kejadian resmi', o1.r === o2.r && outs === 1, `${o1.r} ${outs}`);
  const fo = await J(() => HR2.attendance(HL.state.hr, 'EMP-0008', HR.TODAY));
  ok('Check-out menyambung shift yang sama (08:52–17:05)', fo.in === '08:52' && fo.out === '17:05');
  const auditN = await J(() => HL.state.hr.audit.filter(a => /PRS-20261113-0008/.test(a.detail || '')).length);
  ok('Audit tidak berlipat (4 aksi = 4 audit)', auditN === 4, String(auditN));

  /* 4–5. wajah & lokasi tidak lolos → Perlu pemeriksaan, tidak ada keberhasilan otomatis */
  await clock('08:58');
  const cases = [['face', 'mismatch', /tidak cocok/i], ['face', 'photo', /Liveness gagal/], ['face', 'old', /sesi presensi ini/], ['clock', 'skew', /Jam HP berbeda/], ['loc', 'outside', /luar radius/], ['loc', 'stale', /berumur 9 menit/], ['loc', 'approx', /Akurasi lokasi/], ['loc', 'denied', /Izin lokasi ditolak/]];
  const who = ['EMP-0008'];
  let allOk = true; const det = [];
  for (const [k, v, re] of cases) {
    await U('made', 'm-reset', { any: true }); await U('ayu-astiti', 'm-consent');
    const x = await U('ayu-astiti', 'm-punch', { kind: 'in', req: 'C-' + v, [k]: v });
    const pp = await J((id) => { const q = HL.state.hr.mob.punches.find(z => z.id === id); return { st: HRM.pStatus(HL.state.hr, q), reasons: q.reasons, req: q.reqId, att: HR2.attendance(HL.state.hr, 'EMP-0028', HR.TODAY).status }; }, x.r);
    const good = pp.st === 'Perlu pemeriksaan' && pp.reasons.some(s => re.test(s)) && !!pp.req && pp.att === 'Perlu Pemeriksaan';
    if (!good) { allOk = false; det.push(v + ':' + JSON.stringify(pp)); }
  }
  ok('Wajah tidak cocok, foto/layar, sesi lama, jam HP berubah, di luar radius, lokasi lama, approximate, izin ditolak → Perlu pemeriksaan + alasan + antrean Supervisor', allOk, det.join(' | '));

  /* 6. offline: menunggu sinkronisasi, bukan hadir; sinkron tetap perlu pemeriksaan; retry tidak ganda */
  await U('made', 'm-reset', { any: true }); await U('ayu-indra', 'm-consent');
  const off = await U('ayu-indra', 'm-punch', { kind: 'in', req: 'OFF-1', net: 'offline' });
  const offAtt = await J(() => ({ a: HR2.attendance(HL.state.hr, 'EMP-0008', HR.TODAY), st: HRM.pStatus(HL.state.hr, HL.state.hr.mob.punches[0]) }));
  ok('Offline: "Menunggu sinkronisasi", tidak ditandai hadir terverifikasi', offAtt.st === 'Menunggu sinkronisasi' && offAtt.a.status !== 'Hadir' && offAtt.a.provisional);
  const syncOff = await U('ayu-indra', 'm-sync', { net: 'offline' });
  ok('Sinkron saat masih offline ditolak, antrean tetap', /Masih offline/.test(syncOff.e || ''));
  await clock('09:40'); await U('ayu-indra', 'm-sync', {}); await U('ayu-indra', 'm-sync', {}); await U('ayu-indra', 'm-punch', { kind: 'in', req: 'OFF-1', net: 'offline' });
  const syn = await J(() => { const h = HL.state.hr, ps = h.mob.punches.filter(x => x.emp === 'EMP-0008'); return { n: ps.length, st: HRM.pStatus(h, ps[0]), recv: ps[0].receivedAt, reqs: h.queue.filter(q => q.payload && q.payload.punch === ps[0].id).length, att: HR2.attendance(h, 'EMP-0008', HR.TODAY) }; });
  ok('Setelah tersambung: satu kejadian, waktu unggah ≠ waktu datang, perlu pemeriksaan, satu pengajuan', syn.n === 1 && syn.st === 'Perlu pemeriksaan' && syn.recv === '09:40' && syn.att.in === '08:52' && syn.reqs === 1, JSON.stringify([syn.n, syn.st, syn.recv, syn.att.in, syn.reqs]));

  /* 7. Supervisor memutuskan dari Inbox Approval (UI) → satu kali; penolakan mempertahankan nilai */
  await go('hrd-mobile?as=mila&tab=inbox&sub=approval'); await shot('MOB-04-approval');
  ok('Inbox Approval Supervisor: pemeriksaan presensi Ayu Indra', /Pemeriksaan presensi · Ayu Indra/.test(await scr()));
  await p.locator('.mob-screen form[data-mform="decide"] button[value="approve"]').first().click(); await p.waitForTimeout(250);
  const ap = await J(() => { const h = HL.state.hr; return { st: HRM.pStatus(h, h.mob.punches.find(x => x.emp === 'EMP-0008')), a: HR2.attendance(h, 'EMP-0008', HR.TODAY) }; });
  ok('Disetujui → Terverifikasi, F2 Hadir 08:52 (tanpa ganda)', ap.st === 'Terverifikasi' && ap.a.status === 'Hadir' && ap.a.in === '08:52' && !ap.a.provisional, JSON.stringify([ap.st, ap.a.status]));
  const again = await U('mila', 'm-decide', { id: await J(() => HL.state.hr.queue.find(q => q.via === 'JAENS Mobile').id), decision: 'approve' });
  ok('Keputusan tidak diulang', /sudah final/.test(again.e || ''));
  await U('made', 'm-reset', { any: true }); await U('ayu-astiti', 'm-consent');
  const rj = await U('ayu-astiti', 'm-punch', { kind: 'in', req: 'RJ', loc: 'outside' });
  const rq = await J((id) => HL.state.hr.mob.punches.find(x => x.id === id).reqId, rj.r);
  const rjNoReason = await U('mila', 'm-decide', { id: rq, decision: 'reject' });
  await U('mila', 'm-decide', { id: rq, decision: 'reject', reason: 'Tidak ada izin tugas luar' });
  const rjv = await J(() => ({ a: HR2.attendance(HL.state.hr, 'EMP-0028', HR.TODAY), mine: HL.state.hr.queue.find(q => q.emp === 'EMP-0028' && q.via) }));
  ok('Tolak tanpa alasan ditolak; ditolak → nilai sebelumnya (belum masuk), alasan terlihat pemohon', /Alasan penolakan/.test(rjNoReason.e || '') && rjv.a.status === 'Belum Ada Status' && rjv.mine.status === 'Ditolak' && /izin tugas luar/.test(rjv.mine.stages[0].reason));

  /* pengecualian manual + check-out tanpa check-in */
  const nocin = await U('ayu-indra', 'm-punch', { kind: 'out', req: 'NOIN' });
  ok('Check-out tanpa check-in diarahkan ke koreksi', /tanpa check-in/.test(nocin.e || ''));
  await go('hrd-mobile?as=ayu-indra&tab=att');
  await p.click('.mob-att [data-m="flow"][data-manual="1"]'); await p.fill('.mob-sheet input[name="reason"]', 'kamera HP retak'); await p.click('.mob-sheet button.primary'); await p.waitForTimeout(250);
  const mres = await p.locator('.mob-sheet').innerText();
  ok('Ajukan presensi dengan pemeriksaan → Perlu pemeriksaan + REQ ke Supervisor', /Perlu pemeriksaan/.test(mres) && /REQ-M\d+ → Supervisor/.test(mres));
  await p.click('[data-m="flow-close"]');

  /* koreksi hari lalu lewat F2 */
  const cr = await U('ayu-indra', 'm-correct', { date: '2026-11-12', in: '08:55', out: '17:00', reason: 'Lupa check-out, HP mati' });
  ok('Koreksi presensi kemarin masuk antrean F2 (Koreksi presensi)', /^REQ-2611-/.test(cr.r || '') , cr.r || cr.e);

  /* 8. tugas dari mobile → F3 */
  await go('hrd-mobile?as=gede-ari&tab=work&task=TSK-0201');
  await p.selectOption('.mob-screen select[name="to"]', 'Review'); await p.click('.mob-screen form[data-mform="move"] button'); await p.waitForTimeout(250);
  const tk = await J(() => { const f3 = HL.state.hr.f3; return { st: f3.tasks.find(t => t.id === 'TSK-0201').stage, ev: f3.events.filter(e => e.task === 'TSK-0201').slice(-1)[0] }; });
  ok('Attendant pindahkan TSK-0201 ke Review dari mobile → F3 (Task ID sama, pelaku tercatat)', tk.st === 'Review' && /gede-ari|Gede Ari/.test(tk.ev.by) && /JAENS Mobile/.test(tk.ev.reason || ''), JSON.stringify(tk.ev));
  const foreign = await U('ayu-indra', 'm-task-move', { id: 'TSK-0201', to: 'Selesai' });
  ok('Therapist tidak bisa memindahkan kartu orang lain', !!foreign.e);

  /* chat & cakupan */
  await go('hrd-mobile?as=ayu-indra&tab=inbox');
  const chats = await scr();
  ok('Chat therapist: Pengumuman, Tim Spa Ubud, pribadi dengan Mila; tanpa Tim HRD', /Pengumuman JAENS/.test(chats) && /Tim Spa Ubud/.test(chats) && /Mila/.test(chats) && !/Tim HRD/.test(chats));
  const leak = await U('ayu-indra', 'm-chat-send', { conv: 'GRP-HRD', text: 'halo' });
  ok('Kirim ke grup di luar keanggotaan ditolak', /tidak tersedia/.test(leak.e || ''));
  const q1 = await U('ayu-indra', 'm-chat-send', { conv: 'GRP-UBD', text: 'Saya di Ruang 3', net: 'offline' });
  ok('Pesan offline berstatus Mengantre lalu Terkirim', (await J((id) => HL.state.hr.mob.msgs.find(m => m.id === id).status, q1.r)) === 'Mengantre' && (await U('ayu-indra', 'm-chat-flush')).r && (await J((id) => HL.state.hr.mob.msgs.find(m => m.id === id).status, q1.r)) === 'Terkirim');
  const t1 = await U('mila', 'm-chat-task', { msg: 'MSG-003' }), t2 = await U('mila', 'm-chat-task', { msg: 'MSG-003' });
  ok('Supervisor "Jadikan tugas" dari chat → satu Task ID (tanpa duplikasi)', t1.r && t1.r === t2.r, `${t1.r} ${t2.r}`);
  ok('Therapist tidak bisa menjadikan tugas', !!(await U('ayu-indra', 'm-chat-task', { msg: 'MSG-002' })).e);

  /* 10. alur spa: Reception → Therapist → POS; status terpisah */
  await U('made', 'm-reset', { any: true }); await clock('09:30'); await U('ayu-indra', 'm-consent');
  const early = await U('ayu-indra', 'm-ops', { op: 'svc-start', ref: 'BK-1113-014' });
  ok('Mulai treatment ditolak sebelum check-in kerja (hadir ≠ treatment)', /Bekerja/.test(early.e || ''));
  await U('ayu-indra', 'm-punch', { kind: 'in', req: 'SPA-IN' });
  await U('ayu-astiti', 'm-ops', { op: 'guest-in', ref: 'BK-1113-014' });
  const payEarly = await U('ayu-astiti', 'm-ops', { op: 'pos-close', ref: 'BK-1113-014' });
  await clock('10:00'); await U('ayu-indra', 'm-ops', { op: 'svc-start', ref: 'BK-1113-014' }); await clock('11:30'); await U('ayu-indra', 'm-ops', { op: 'svc-done', ref: 'BK-1113-014' });
  const pos = await U('ayu-astiti', 'm-ops', { op: 'pos-close', ref: 'BK-1113-014' });
  const notRec = await U('ayu-indra', 'm-ops', { op: 'pos-close', ref: 'BK-1113-014' });
  const ops = await J(() => HL.state.hr.mob.ops);
  ok('Check-in tamu → mulai/selesai treatment → POS ditutup reception; therapist tidak bisa POS', !!payEarly.e && /POS/.test(pos.r || '') && !!notRec.e && ops.svc['BK-1113-014'].start === '10:00' && ops.svc['BK-1113-014'].done === '11:30' && /POS simulasi/.test(ops.guests['BK-1113-014'].paid));

  /* 9. payroll khusus Manager HRD */
  await go('hrd-mobile?as=ayu-indra&tab=me'); const meT = await scr(); await shot('MOB-05-saya');
  ok('Saya (therapist): tanpa gaji/slip, "khusus Manager HRD"', /khusus Manager HRD/.test(meT) && !/Rp\s?\d/.test(meT));
  await go('hrd-mobile?as=made&tab=me');
  ok('Saya (Manager HRD): tautan Payroll desktop', /Buka Payroll \(desktop\)/.test(await scr()));
  await go('hrd-mobile?as=ayu&tab=me');
  ok('Saya (Admin HRD Ayu): tanpa akses gaji', /khusus Manager HRD/.test(await scr()) && !/Buka Payroll/.test(await scr()));
  const spoof = await p.evaluate(() => { try { HR.update(HL.state, 'm-punch', { role: 'hrd', account: 'ayu-indra', kind: 'in', req: 'X' }); return 'lolos'; } catch (e) { return e.message; } });
  ok('Role/sesi tidak cocok dengan akun → ditolak', /tidak cocok/.test(spoof));

  /* pekerjaan per peran */
  const roles = {};
  for (const a of ['ayu-indra', 'ayu-astiti', 'gede-ari', 'mila']) { await go(`hrd-mobile?as=${a}&tab=work`); roles[a] = await scr(); }
  ok('Pekerjaan sesuai peran: Treatment saya / Reservasi hari ini / Kesiapan ruangan / Kontrol shift', /Treatment saya/.test(roles['ayu-indra']) && /Reservasi hari ini/.test(roles['ayu-astiti']) && /Kesiapan ruangan/.test(roles['gede-ari']) && /Skenario peran berlabel/.test(roles['gede-ari']) && /Kontrol shift/.test(roles['mila']));

  /* 12. reset demo mobile tanpa menyentuh data lain */
  const before = await J(() => ({ n: HL.state.hr.people.length, f3: HL.state.hr.f3.tasks.filter(t => !/^TSK-02/.test(t.id) && !(t.source && /^MSG-/.test(t.source.id))).length }));
  await U('made', 'm-reset', { any: true });
  const after = await J(() => ({ n: HL.state.hr.people.length, f3: HL.state.hr.f3.tasks.filter(t => !/^TSK-02/.test(t.id) && !(t.source && /^MSG-/.test(t.source.id))).length, p: HL.state.hr.mob.punches.length, q: HL.state.hr.queue.filter(q => q.via === 'JAENS Mobile').length }));
  ok('Reset data JAENS Mobile: kejadian & pengajuan mobile hilang, 158 orang dan kartu F3 lain utuh', after.p === 0 && after.q === 0 && after.n === before.n && after.n === 158 && after.f3 === before.f3, JSON.stringify([before, after]));

  /* mobile 390 px */
  await p.setViewportSize({ width: 390, height: 844 }); await go('hrd-mobile?as=ayu-indra'); await p.waitForTimeout(300);
  const w = await p.evaluate(() => document.documentElement.scrollWidth);
  ok('Layar 390 px tanpa geser horizontal', w <= 392, String(w)); await shot('MOB-06-hp');
  ok('Tanpa error console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'hrd-mobile-results.json'), JSON.stringify({ pass: out.filter(o => o.ok).length, fail, out }, null, 1));
  console.log(`\n${out.length - fail} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
