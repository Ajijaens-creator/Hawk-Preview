/* Langkah perjalanan lintas fase F1–F8 (dipakai uji node dan uji browser).
   run(U, hr) menjalankan: kebutuhan Ubud (F5) → Workplan (F3) → permintaan & lowongan (F4) → lamaran → screening → interview →
   keputusan → kontrak → onboarding → penempatan → POS/komisi (F5/F7) → KPI (F6) → Reflection & tindak lanjut (F8). */
'use strict';
function run(U, hr) {
  const ids = {};
  ids.sim = U('hrd', 'sim-save', { outlet: 'OUT-UBD', option: 'formasi', count: '2', start: '2026-11-16' });
  ids.workplan = U('hrd', 'sim-mark', { id: ids.sim, stage: 'Workplan' });
  U('hrd', 'sim-approve', { id: ids.sim });
  ids.req = U('hrd', 'mp-handoff', { id: ids.sim });
  U('ops-manager', 'req-approve', { id: ids.req }); U('hrd', 'req-approve', { id: ids.req });
  ids.vac = U('hrd', 'vac-publish', { req: ids.req });
  const base = { vac: ids.vac, name: 'Ni Kadek Perjalanan', email: 'perjalanan@example.invalid', phone: '0812-9', consent: '1', docs: 'cv.pdf', techniques: 'Balinese, hot stone', years: '3', cert: 'LSP 2023', sessions: '6', lang: 'Inggris', shiftReady: 'Pagi', situational: 'tanya kenyamanan tamu', submitKey: 'JOURNEY-1' };
  ids.app = U('public', 'app-submit', base);
  ids.appRetry = U('public', 'app-submit', base);
  U('hrd', 'screen-run', { id: ids.app });
  U('hrd', 'app-stage', { id: ids.app, to: 'Shortlist' });
  ids.event = U('hrd', 'iv-schedule', { id: ids.app, slot: '2026-11-14 10:00', iv2: 'EMP-0153' });
  U('outlet-spv', 'iv-score', { id: ids.app, s0: 4, s1: 4, s2: 5, s3: 4, note: 'Praktik hot stone rapi' });
  U('hrd', 'rec-decide', { id: ids.app, value: 'Diterima', reason: 'Rubric praktik baik' });
  U('hrd', 'offer-send', { id: ids.app, start: '2026-11-16' });
  U('hrd', 'offer-respond', { id: ids.app, answer: 'accept' });
  U('hrd', 'doc-verify', { id: ids.app, kind: 'KTP' }); U('hrd', 'doc-verify', { id: ids.app, kind: 'Foto' });
  ids.emp = U('hrd', 'contract-sign', { id: ids.app });
  ids.empRetry = U('hrd', 'contract-sign', { id: ids.app });
  ids.onboard = U('hrd', 'onboard-create', { id: ids.app });
  U('hrd', 'place-approve', { id: ids.app, accRole: 'ess' });
  ids.issue = U('hrd', 'rfl-mark', { key: 'UTIL-OUT-UBD', period: '2611', stage: 'Issue' });
  ids.santi = U('hrd', 'rfl-mark', { key: 'UTIL-OUT-SHT', period: '2611', stage: 'Issue' });
  ids.follow = U('hrd', 'weekly-action', { title: `Coaching 30 hari ${base.name}`, pic: 'EMP-0144', due: '2026-12-09', sourceId: `ONB-${ids.emp}`, ws: 'HG' });
  return ids;
}
if (typeof module !== 'undefined') module.exports = { run };
