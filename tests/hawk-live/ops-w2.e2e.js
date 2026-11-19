/* HAWK Operational · acceptance Gelombang 2 (F-OP04 Daily Operations, F-OP05 tugas & review Head,
   F-OP06 Therapist / readiness ruang / receiving, F-OP07 issue & komunikasi). Frontend + fixture lokal saja.
   python3 -m http.server 8811 dari root repo, lalu: node tests/hawk-live/ops-w2.e2e.js  (SHOTS=dir untuk screenshot) */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
/* helper di halaman: ganti akun demo, jalankan aksi/form prototype persis seperti klik tombol */
const HELPERS = () => {
  window.T = {
    as(id) { OPX.actions['account-select']({ dataset: { id } }); },
    outlet(o) { OPX.state.outletId = o; OPX.save(); },
    act(n, d, extra) { return OPX.actions[n](Object.assign({ dataset: d }, extra || {})); },
    form(n, o) { const fd = new FormData(); Object.entries(o).forEach(([k, v]) => fd.append(k, v)); return OPX.forms[n](fd); },
    d() { return OPX.state.data; },
    modal() { return (document.querySelector('#modal-root')?.innerText || '').trim(); },
  };
};
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const p = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(HELPERS);
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n, full = false) => { if (SHOTS) { await p.waitForTimeout(250); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(SHOTS, n + '.png'), fullPage: full }); } };
  const go = async (r) => { await p.goto(BASE + 'operational.html#' + r); await p.waitForTimeout(350); };
  const ev = (fn, arg) => p.evaluate(fn, arg);

  await p.goto(BASE + 'operational.html'); await ev(() => localStorage.clear()); await p.reload(); await go('op-dashboard');
  const stock0 = await ev(() => JSON.stringify(T.d().stock));

  /* ---------------- F-OP04 Daily Operations ---------------- */
  await ev(() => { T.as('attendant-CTR'); T.act('daily-check', { outlet: 'CTR', kind: 'opening', id: 'pantry' }, { checked: true }); });
  ok('F-OP04 Attendant mencentang item departemennya sendiri', await ev(() => { const i = T.d().checklists.CTR.opening.find(x => x.id === 'pantry'); return i.done && i.checkedRole === 'attendant'; }));
  ok('F-OP04 Attendant tidak dapat mencentang item departemen lain', await ev(() => { const i = T.d().checklists.CTR.closing.find(x => x.dept !== 'attendant' && !x.done); if (!i) return true; T.act('daily-check', { outlet: 'CTR', kind: 'closing', id: i.id }, { checked: true }); return !T.d().checklists.CTR.closing.find(x => x.id === i.id).done; }));
  await ev(() => { T.as('spv-CTR'); T.act('daily-signoff', { outlet: 'CTR', kind: 'opening' }); });
  ok('F-OP04 Supervisor belum dapat sign-off sebelum review Head', await ev(() => !T.d().checklists.CTR.openingSigned && !/Sahkan opening/.test(T.modal())));
  await ev(() => T.form('daily-signoff', { outlet: 'CTR', kind: 'opening', note: 'Coba lewati Head', ack: 'on' }));
  ok('F-OP04 form sign-off langsung tetap ditolak tanpa review Head', await ev(() => !T.d().checklists.CTR.openingSigned));
  await ev(() => { T.as('head-attendant-CTR'); T.act('daily-head-review', { outlet: 'CTR', kind: 'opening' }); });
  ok('F-OP04 Head Attendant mereview checklist departemen', await ev(() => T.d().checklists.CTR.opening.filter(x => x.dept === 'attendant').every(x => x.reviewedBy)));
  ok('F-OP04 Head tidak dapat sign-off outlet', await ev(() => { T.act('daily-signoff', { outlet: 'CTR', kind: 'opening' }); return !T.d().checklists.CTR.openingSigned && !/Sahkan opening/.test(T.modal()); }));
  const issues0 = await ev(() => T.d().issues.filter(i => i.outlet === 'CTR' && i.status === 'open').map(i => i.id).join());
  await ev(() => { T.as('spv-CTR'); T.act('daily-signoff', { outlet: 'CTR', kind: 'opening' }); });
  ok('F-OP04 modal sign-off Supervisor terbuka setelah review Head', /Sahkan opening/.test(await ev(() => T.modal())));
  await go('op-daily'); await shot('G2-V01-opening-signoff-modal');
  await ev(() => T.form('daily-signoff', { outlet: 'CTR', kind: 'opening', note: 'Opening Ubud diperiksa, issue AC dibawa', ack: 'on' }));
  ok('F-OP04 opening disahkan Supervisor (Attendant → Head → Supervisor)', await ev(() => T.d().checklists.CTR.openingSigned === true && T.d().checklists.CTR.openingSignedBy === 'Mila'));
  ok('F-OP04 issue terbuka tidak hilang setelah sign-off', (await ev(() => T.d().issues.filter(i => i.outlet === 'CTR' && i.status === 'open').map(i => i.id).join())) === issues0 && issues0.length > 0, issues0);
  ok('F-OP04 sign-off opening tidak melepas ruang maintenance', await ev(() => T.d().rooms.find(r => r.id === 'CTR-R05').status === 'maintenance'));
  await go('op-daily'); await shot('G2-V02-opening-disahkan');
  /* closing */
  await ev(() => { T.d().checklists.CTR.closing.forEach(i => { i.done = true; }); OPX.save(); T.form('daily-signoff', { outlet: 'CTR', kind: 'closing', note: 'Closing saat layanan aktif', ack: 'on' }); });
  ok('F-OP04 closing ditolak selama masih ada layanan aktif', await ev(() => !T.d().checklists.CTR.closingSigned));
  await ev(() => { T.d().bookings.filter(b => b.outlet === 'CTR' && ['checked_in', 'in_progress'].includes(b.status)).forEach(b => { b.status = 'completed'; }); OPX.save(); T.form('daily-signoff', { outlet: 'CTR', kind: 'closing', note: 'Closing Ubud lengkap', ack: 'on' }); });
  ok('F-OP04 closing disahkan setelah layanan selesai', await ev(() => T.d().checklists.CTR.closingSigned === true));
  const keys0 = await ev(() => Object.keys(T.d()).sort().join());
  await ev(() => { T.outlet('CTR'); T.form('daily-eod', { outlet: 'CTR', note: 'EOD Ubud, issue AC carryover' }); });
  const eod = await ev(() => T.d().closings.find(c => c.outlet === 'CTR'));
  ok('F-OP04 EOD membawa issue sebagai carryover', !!eod && eod.carryoverIssueIds.includes('ISS-CTR-01'));
  ok('F-OP04 closing/EOD tidak mem-posting kas atau jurnal', (await ev(() => Object.keys(T.d()).sort().join())) === keys0 && !(await ev(() => T.d().audit.some(a => /JOURNAL|CASH|POSTING/i.test(a.action || a.type || '')))) && (await ev(() => JSON.stringify(T.d().stock))) === stock0);
  await go('op-daily'); await ev(() => { OPX.ui.dailyTab = 'eod'; OPX.render(); }); await shot('G2-V03-eod-carryover', true);

  /* ---------------- F-OP05 tugas & review ---------------- */
  await p.goto(BASE + 'operational.html'); await ev(() => localStorage.clear()); await p.reload(); await go('op-dashboard');
  const tk = await ev(() => { const t = T.d().tasks.find(x => x.outlet === 'CTR' && x.critical && x.status === 'todo'); return t && { id: t.id, assignee: t.assignee, dept: t.dept }; });
  ok('F-OP05 fixture memiliki tugas kritis Ubud', !!tk, tk && tk.id);
  if (tk) {
    await ev(t => { T.as(t.assignee); T.act('task-start', { id: t.id }); T.form('taskEvidence', { taskId: t.id, evidence: 'Foto demo: area sudah dibersihkan dan dicek', complete: 'on' }); }, tk);
    ok('F-OP05 tugas kritis tidak selesai hanya karena PIC submit', await ev(id => T.d().tasks.find(x => x.id === id).status, tk.id) === 'head_review');
    await ev(t => { T.as('spv-CTR'); T.act('task-final-verify', { id: t.id }); }, tk);
    ok('F-OP05 Supervisor tidak melompati review Head', await ev(id => T.d().tasks.find(x => x.id === id).status, tk.id) === 'head_review');
    await ev(t => { T.as('head-' + t.dept + '-CTR'); T.act('task-head-approve', { id: t.id }); }, tk);
    ok('F-OP05 review Head → menunggu Supervisor (kritis)', await ev(id => T.d().tasks.find(x => x.id === id).status, tk.id) === 'supervisor_review');
    await go('op-tasks'); await shot('G2-V04-tugas-review');
    await ev(t => { T.as('spv-CTR'); T.act('task-final-verify', { id: t.id }); }, tk);
    ok('F-OP05 verifikasi akhir Supervisor menutup tugas kritis', await ev(id => { const t = T.d().tasks.find(x => x.id === id); return t.status === 'done' && t.verifiedBy === 'spv-CTR' && t.completionMode === 'supervisor_verified'; }, tk.id));
  }
  await ev(() => { T.as('therapist-CTR'); T.act('focus-finish', { id: 'BK-CTR-003' }); });
  ok('F-OP05 finish treatment memerlukan konfirmasi', await ev(() => T.d().bookings.find(b => b.id === 'BK-CTR-003').status === 'in_progress' && /Konfirmasi selesai treatment/.test(T.modal())));
  await go('op-therapist'); await ev(() => T.act('focus-finish', { id: 'BK-CTR-003' })); await shot('G2-V05-finish-treatment-konfirmasi');
  await ev(() => { T.act('focus-confirm', { id: 'BK-CTR-003' }); T.act('focus-confirm', { id: 'BK-CTR-003' }); });
  ok('F-OP05 konfirmasi menghasilkan tepat satu turnover task', await ev(() => T.d().tasks.filter(t => t.bookingId === 'BK-CTR-003').length === 1 && T.d().tasks.some(t => t.id === 'TSK-TURN-BK-CTR-003' && t.dept === 'attendant')));
  ok('F-OP05 booking Completed memakai Booking ID yang sama', await ev(() => T.d().bookings.find(b => b.id === 'BK-CTR-003').status === 'completed'));

  /* ---------------- F-OP06 readiness, receiving, request ---------------- */
  ok('F-OP06 selesai treatment tidak langsung Ready (ruang Cleaning)', await ev(() => T.d().rooms.find(r => r.id === 'CTR-R02').status === 'cleaning'));
  await ev(() => { T.as('attendant-CTR'); T.form('room-state', { id: 'CTR-R02', status: 'ready', note: 'Ok' }); });
  ok('F-OP06 Ready butuh hasil pemeriksaan (checked + catatan)', await ev(() => T.d().rooms.find(r => r.id === 'CTR-R02').status === 'cleaning'));
  await ev(() => T.form('room-state', { id: 'CTR-R05', status: 'ready', checked: 'on', note: 'AC sudah dingin' }));
  ok('F-OP06 maintenance tidak dapat dilepas Attendant', await ev(() => T.d().rooms.find(r => r.id === 'CTR-R05').status === 'maintenance'));
  await ev(() => T.form('room-state', { id: 'CTR-R02', status: 'ready', checked: 'on', note: 'Linen diganti, ruang dicek' }));
  const r02 = await ev(() => T.d().rooms.find(r => r.id === 'CTR-R02').status);
  await ev(() => T.as('spv-CTR'));
  if (r02 !== 'ready') await ev(() => T.form('room-state', { id: 'CTR-R02', status: 'ready', checked: 'on', note: 'Linen diganti, ruang dicek' }));
  ok('F-OP06 Ready setelah pemeriksaan tercatat', await ev(() => T.d().rooms.find(r => r.id === 'CTR-R02').status === 'ready'), r02 === 'ready' ? 'oleh Attendant' : 'oleh Supervisor');
  await go('op-rooms'); await shot('G2-V06-readiness-ruang');
  await ev(() => { T.as('reception-CTR'); T.form('receipt-physical', { id: 'RCV-CTR-02', received: '5', note: 'Diterima lengkap, kemasan baik' }); });
  ok('F-OP06 Receptionist (user outlet mana pun) mencatat penerimaan fisik', await ev(() => T.d().receipts.find(r => r.id === 'RCV-CTR-02').status === 'physical_recorded'));
  ok('F-OP06 penerimaan tercatat atas nama akun yang login', await ev(() => T.d().receipts.find(r => r.id === 'RCV-CTR-02').checkedBy === 'reception-CTR'));
  for (const who of ['therapist-CTR', 'security-CTR']) {
    const okRcv = await ev(w => { const r = T.d().receipts.find(x => x.id === 'RCV-CTR-02'); const snap = JSON.stringify(r); r.status = 'awaiting_check'; T.as(w); T.form('receipt-physical', { id: r.id, received: '5', note: 'Dicek ' + w }); const res = r.status === 'physical_recorded' && r.checkedBy === w; Object.assign(r, JSON.parse(snap)); OPX.save(); return res; }, who);
    ok(`F-OP06 ${who} juga dapat menerima barang outlet sendiri`, okRcv);
  }
  ok('F-OP06 user outlet tidak dapat menerima barang outlet lain', await ev(() => { T.as('therapist-CTR'); T.form('receipt-physical', { id: 'RCV-SHT-02', received: '5', note: 'Bukan outlet saya' }); return T.d().receipts.find(r => r.id === 'RCV-SHT-02').status === 'awaiting_check'; }));
  await ev(() => { T.as('reception-CTR'); T.act('receipt-verify', { id: 'RCV-CTR-02' }); });
  ok('F-OP06 verifikasi tetap Supervisor ke atas (Receptionist ditolak)', await ev(() => T.d().receipts.find(r => r.id === 'RCV-CTR-02').status === 'physical_recorded'));
  await ev(() => { T.as('spv-CTR'); T.act('receipt-verify', { id: 'RCV-CTR-02' }); });
  ok('F-OP06 receiving verified oleh Supervisor', await ev(() => T.d().receipts.find(r => r.id === 'RCV-CTR-02').status === 'verified'));
  ok('F-OP06 receiving verified tidak menaikkan stok fixture', (await ev(() => JSON.stringify(T.d().stock))) === stock0);
  const mrf0 = await ev(() => (T.d().materialRequests || []).length);
  await ev(() => T.form('material-save', { outlet: 'CTR', item: 'Minyak pijat 1 L', qty: '2', reason: 'Stok di bawah minimum demo' }));
  ok('F-OP06 request material menjadi draf MRF-DEMO', await ev(n => T.d().materialRequests.length === n + 1 && /^MRF-DEMO-/.test(T.d().materialRequests.at(-1).id) && T.d().materialRequests.at(-1).status === 'draft', mrf0));
  ok('F-OP06 request tidak membuat ledger kedua', (await ev(() => JSON.stringify(T.d().stock))) === stock0 && !(await ev(() => 'ledger' in T.d() || 'inventoryLedger' in T.d())));
  await go('op-inventory'); await shot('G2-V07-receiving-request');

  /* ---------------- F-OP07 issue & komunikasi ---------------- */
  await ev(() => { T.as('spv-CTR'); T.act('issue-task', { id: 'ISS-CTR-01' }); OPX.closeModal(); T.act('issue-task', { id: 'ISS-CTR-01' }); });
  ok('F-OP07 satu issue tertaut ke satu tugas yang sama', await ev(() => { const i = T.d().issues.find(x => x.id === 'ISS-CTR-01'); return !!i.taskId && T.d().tasks.filter(t => t.issueId === 'ISS-CTR-01').length === 1; }));
  await go('op-tasks'); await ev(() => T.act('issue-open', { id: 'ISS-CTR-01' })); await shot('G2-V08-issue-tugas');
  const before = await ev(() => JSON.stringify(T.d().tasks.map(t => [t.id, t.status, t.verifiedAt])));
  await go('op-communication');
  const ch = await p.$eval('#opx-root select[name="channel"], #opx-root [name="channel"]', el => el.value).catch(() => null);
  await ev(c => T.form('commMessage', { channel: c, text: 'Mohon cek AC ruang 5 sebelum jam 2', taskId: '' }), ch);
  ok('F-OP07 pesan demo tersimpan lokal', await ev(() => T.d().messages.some(m => /AC ruang 5/.test(m.text))), ch || 'channel?');
  ok('F-OP07 pesan tidak mengubah approval tugas', (await ev(() => JSON.stringify(T.d().tasks.map(t => [t.id, t.status, t.verifiedAt])))) === before);
  await go('op-communication'); await shot('G2-V09-komunikasi');
  await ev(() => { OPX.closeModal(); T.form('issueResolve', { issueId: 'ISS-CTR-01', resolution: 'AC sudah diservis dan diuji 30 menit' }); });
  ok('F-OP07 issue resolved', await ev(() => T.d().issues.find(x => x.id === 'ISS-CTR-01').status === 'resolved'));
  ok('F-OP07 penyelesaian issue tidak otomatis melepas maintenance', await ev(() => T.d().rooms.find(r => r.id === 'CTR-R05').status === 'maintenance'));

  /* ---------------- render & responsif ---------------- */
  for (const r of ['op-daily', 'op-tasks', 'op-therapist', 'op-rooms', 'op-inventory', 'op-communication']) {
    await go(r);
    ok(`Render ${r} tanpa halaman buntu`, await ev(() => (document.getElementById('opx-root')?.innerText.length || 0) > 300));
  }
  for (const [w, h, n] of [[834, 1112, 'tablet'], [390, 844, 'mobile']]) {
    await p.setViewportSize({ width: w, height: h });
    for (const r of ['op-daily', 'op-tasks', 'op-therapist', 'op-rooms', 'op-inventory', 'op-communication']) {
      await go(r);
      const over = await ev(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(`Responsif ${n} ${w}px ${r} tanpa scroll horizontal`, over <= 1, `+${over}px`);
      if (n === 'mobile' && ['op-daily', 'op-tasks', 'op-therapist', 'op-rooms'].includes(r)) await shot(`G2-mobile-${r.slice(3)}`);
    }
  }
  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
