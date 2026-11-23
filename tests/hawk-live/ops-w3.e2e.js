/* HAWK Operational · acceptance Gelombang 3 (F-OP08 RACE/KPI/X-Score pending, F-OP09 Budget 7P, F-OP10 Reports).
   Frontend + fixture lokal saja. python3 -m http.server 8811 dari root repo, lalu: node tests/hawk-live/ops-w3.e2e.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
const SHOTS = process.env.SHOTS;
let fail = 0;
const ok = (name, cond, info = '') => { if (!cond) fail++; console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const HELPERS = () => {
  window.T = {
    as(id) { OPX.actions['account-select']({ dataset: { id } }); },
    act(n, d, extra) { return OPX.actions[n](Object.assign({ dataset: d }, extra || {})); },
    form(n, o) { const fd = new FormData(); Object.entries(o).forEach(([k, v]) => fd.append(k, v)); return OPX.forms[n](fd); },
    d() { return OPX.state.data; },
    text() { return document.getElementById('opx-root')?.innerText || ''; },
    downloads: [],
  };
  const hook = () => { if (window.OPX && !OPX.__dl) { OPX.__dl = true; OPX.download = (name, data) => T.downloads.push({ name, data: JSON.stringify(data) }); } else if (!window.OPX) setTimeout(hook, 20); };
  document.addEventListener('DOMContentLoaded', hook);
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

  /* ---------------- F-OP08 RACE / KPI / X-Score ---------------- */
  await ev(() => T.as('spv-CTR')); await go('op-race');
  const stat = () => ev(() => { OPX.ui.raceTab = 'daily'; OPX.render(); return Number([...document.querySelectorAll('#opx-root .stat')].find(s => /Menunggu review/.test(s.textContent))?.querySelector('.stat-value')?.textContent.trim()); });
  const s0 = await stat();
  const tk = await ev(() => { const t = T.d().tasks.find(x => x.outlet === 'CTR' && x.status === 'todo'); t.status = 'head_review'; t.evidence = 'Foto demo'; OPX.save(); return t.id; });
  await go('op-race'); const s1 = await stat();
  ok('F-OP08 perubahan tugas terlihat di RACE Daily tanpa input ulang', s1 === s0 + 1, `${tk}: ${s0} → ${s1}`);
  await shot('G3-V01-race-daily', true);
  await ev(() => { OPX.ui.raceTab = 'score'; OPX.render(); });
  const race = await ev(() => T.text());
  ok('F-OP08 kontrak KPI / X-Score resmi tetap pending', /pending|belum diverifikasi|menunggu/i.test(race) && /X-Score/i.test(race));
  ok('F-OP08 X-Score tidak tampil sebagai angka resmi', !/X-Score[^\n]{0,20}\b\d{1,3}(\.\d+)?\s*(\/\s*100|poin|%)/i.test(race));
  await shot('G3-V02-xscore-pending', true);
  const n0 = await ev(() => T.d().raceSessions.length);
  await ev(() => T.form('perf-session', { outlet: 'CTR', type: 'weekly', title: 'R2Re minggu 3 Ubud', summary: 'Turnover lebih cepat setelah checklist Head', blocker: 'AC ruang 5', commitment: 'Servis AC Jumat' }));
  const sess = await ev(() => T.d().raceSessions.at(-1));
  ok('F-OP08 sesi RACE tersimpan sebagai draf dengan field kontrak', sess && sess.status === 'draft' && sess.type === 'weekly' && sess.outlet === 'CTR' && Array.isArray(sess.sourceTaskIds) && 'blocker' in sess && 'commitment' in sess && (await ev(() => T.d().raceSessions.length)) === n0 + 1);
  await ev(() => T.form('perf-session', { outlet: 'SHT', type: 'daily', title: 'Di luar scope', summary: 'Tidak boleh tersimpan' }));
  ok('F-OP08 Supervisor tidak menyimpan RACE outlet lain', (await ev(() => T.d().raceSessions.length)) === n0 + 1);
  await go('op-race'); await ev(() => T.act('perf-race-tab', { id: 'weekly' })); await shot('G3-V03-race-weekly');

  /* ---------------- F-OP09 Budget 7P ---------------- */
  await ev(() => T.as('mgr-eni')); await go('op-budget');
  const b0 = await ev(() => T.text());
  ok('F-OP09 periode tahunan/triwulan/bulanan/mingguan tersedia', ['Tahunan', 'Triwulan', 'Bulanan', 'Mingguan'].every(x => b0.includes(x)));
  ok('F-OP09 People hanya persentase (tanpa nominal Rp)', !/People[^\n]{0,80}Rp\s?\d/.test(b0) && /People[^\n]{0,40}persentase|People[^\n]{0,120}%/.test(b0));
  ok('F-OP09 P7 Profit tampil sebagai hasil, bukan belanja', !/P7[^\n]{0,30}(Disetujui|Komitmen)/.test(b0));
  const avail0 = await ev(() => [...document.querySelectorAll('#opx-root table')[0].querySelectorAll('tbody tr')].map(r => r.cells[4]?.innerText).join('|'));
  const keys0 = await ev(() => Object.keys(T.d()).sort().join());
  await ev(() => T.form('perf-budget-request', { outlet: 'CTR', p: 'P2', amount: '3500000', title: 'Amenities paket honeymoon', reason: 'Musim ramai Desember' }));
  const req = await ev(() => T.d().budgetRequests.at(-1));
  ok('F-OP09 usulan tersimpan draf committed=false', req && req.status === 'draft' && req.committed === false && req.p === 'P2');
  await go('op-budget');
  ok('F-OP09 usulan tidak mengurangi saldo tersedia', (await ev(() => [...document.querySelectorAll('#opx-root table')[0].querySelectorAll('tbody tr')].map(r => r.cells[4]?.innerText).join('|'))) === avail0, avail0.split('|').slice(0, 2).join(' · '));
  ok('F-OP09 usulan tidak membuat PO / jurnal', (await ev(() => Object.keys(T.d()).sort().join())) === keys0 && !(await ev(() => T.d().audit.some(a => /\bPO_|JOURNAL/i.test(a.action || a.type || '')))));
  ok('F-OP09 subtotal kategori dinyatakan', /total|subtotal|jumlah/i.test(await ev(() => T.text())));
  await shot('G3-V04-budget-7p', true);
  await ev(() => T.as('spv-SHT')); await go('op-budget');
  ok('F-OP09 Supervisor hanya melihat budget outlet sendiri', /Shanti/i.test(await ev(() => T.text())) && !(await ev(() => /BPR-DEMO/.test(T.text()))));
  await ev(() => T.as('therapist-CTR')); await go('op-budget');
  ok('F-OP09 Therapist tidak melihat nilai anggaran', /Tidak berwenang|dibatasi/i.test(await ev(() => T.text())) && !/Rp\s?\d/.test(await ev(() => T.text())));

  /* ---------------- F-OP10 Reports ---------------- */
  await ev(() => T.as('mgr-eni')); await go('op-dashboard');
  const pendDash = await ev(() => [...document.querySelectorAll('#opx-root .stat')].find(s => /Menunggu verifikasi/.test(s.textContent))?.querySelector('.stat-value')?.textContent.trim());
  const pendData = await ev(() => OPX.scope(T.d().tasks).filter(t => ['head_review', 'supervisor_review'].includes(t.status)).length);
  ok('F-OP10 dashboard dan fixture tugas konsisten', Number(pendDash) === pendData, `${pendDash} = ${pendData}`);
  await go('op-reports');
  const rep = await ev(() => T.text());
  ok('F-OP10 laporan menampilkan ID sumber (TSK-/BK-)', /TSK-/.test(rep) || /BK-/.test(rep));
  ok('F-OP10 label demo / sumber pending jujur', /demo|simulasi|pending|belum/i.test(rep));
  await shot('G3-V05-reports-manager', true);
  await ev(() => T.act('gov-export', {}));
  const exM = await ev(() => T.downloads.at(-1));
  ok('F-OP10 export Manager tersedia', !!exM && /Report/.test(exM.name));
  ok('F-OP10 export tanpa nominal People / payroll', !!exM && !/payroll"\s*:|salary|gaji|"people"\s*:\s*\d/i.test(exM.data));
  const exTasks = exM ? JSON.parse(exM.data).tasks.length : -1;
  ok('F-OP10 export konsisten dengan tugas dalam scope', exTasks === await ev(() => OPX.scope(T.d().tasks).length), String(exTasks));
  await ev(() => { OPX.state.outletId = 'SHT'; OPX.save(); }); await go('op-reports'); await ev(() => T.act('gov-export', {}));
  const exS = await ev(() => T.downloads.at(-1));
  ok('F-OP10 export Manager dengan filter outlet Shanti hanya berisi Shanti', !!exS && JSON.parse(exS.data).tasks.length > 0 && JSON.parse(exS.data).tasks.every(t => t.outlet === 'SHT') && !/"outlet":"(CTR|TRL|BSM)"/.test(exS.data));
  await ev(() => { OPX.state.outletId = 'all'; OPX.save(); });
  await ev(() => T.as('spv-SHT')); await go('op-reports');
  const nS = await ev(() => T.downloads.length); await ev(() => T.act('gov-export', {}));
  ok('F-OP10 Supervisor melihat laporan outlet sendiri, ekspor khusus Manager/Assistant', (await ev(() => T.downloads.length)) === nS && /Shanti/i.test(await ev(() => T.text())));
  await shot('G3-V06-reports-supervisor');
  await ev(() => T.as('attendant-CTR')); const nDl = await ev(() => T.downloads.length); await ev(() => T.act('gov-export', {}));
  ok('F-OP10 export ditolak untuk role tanpa izin', (await ev(() => T.downloads.length)) === nDl);

  /* ---------------- responsif ---------------- */
  await ev(() => T.as('mgr-eni'));
  for (const [w, h, n] of [[834, 1112, 'tablet'], [390, 844, 'mobile']]) {
    await p.setViewportSize({ width: w, height: h });
    for (const r of ['op-race', 'op-budget', 'op-reports']) {
      await go(r);
      const over = await ev(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(`Responsif ${n} ${w}px ${r} tanpa scroll horizontal`, over <= 1, `+${over}px`);
      if (n === 'mobile') await shot(`G3-mobile-${r.slice(3)}`);
    }
  }
  ok('Tanpa error konsol', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? `GAGAL · ${fail} gagal` : 'LULUS · 0 gagal');
  process.exit(fail ? 1 : 0);
})();
