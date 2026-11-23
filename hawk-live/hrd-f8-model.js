/* JAENS ERP · Portal HRD · model F8 AmbideX, Reporting & Reflection — DATA DEMO / SIMULASI.
   Race Vegen (6 indikator, kontrak berversi), Race Beacon (5 kelompok, kontrak sendiri) & Success Factors, Daily/Weekly Race dari Planner F3,
   Monthly Reflection (rekonsiliasi F5–F7, temuan → F3), STRACON (keputusan → Workplan → evaluasi), e-Deck 8 halaman dengan snapshot berversi,
   Pusat Laporan & Jejak Bukti. Memperluas HR.EXT. Tanpa jaringan. */
const HR8 = (() => {
  const H = (typeof HR !== 'undefined') ? HR : require('./hrd-model.js');
  /* const di skrip klasik tidak menjadi properti globalThis, jadi rujuk langsung dengan typeof */
  const X = (n) => { try { switch (n) { case 'HR4': return typeof HR4 !== 'undefined' ? HR4 : null; case 'HR5': return typeof HR5 !== 'undefined' ? HR5 : null; case 'HR6': return typeof HR6 !== 'undefined' ? HR6 : null; case 'HR7': return typeof HR7 !== 'undefined' ? HR7 : null; default: return null; } } catch (e) { return null; } };
  const TODAY = H.TODAY;
  const now = () => `${TODAY} ${new Date().toTimeString().slice(0, 5)}`;
  const WEEK = ['2026-11-07', '2026-11-13'];
  const PERIODS = { 2610: 'Oktober 2026 (ditutup)', 2611: 'November 2026 (provisional)' };

  /* ---------- metrik Race: sumber hidup F4–F7 bila ada, selain itu fixture workbook ---------- */
  const FIX = {
    'Revenue per Employee': ['Rp', 23000000, 21000000, 'Finance + HG (simulasi)'], 'Development JAENS': ['%', 100, 75, 'Milestone JAENS'], 'Strategic Partnership HWC × Jaens Wellness': ['%', 100, 90, 'Milestone kemitraan'],
    'Turnover': ['%', 2, 1.2, 'Direktori F2 (pergerakan karyawan)', 'max'], 'Absenteeism': ['%', 85, null, 'Definisi denominator perlu dikonfirmasi'], 'Exit Interview': ['%', 100, 90, 'Log exit interview'], 'BPJS Compliance': ['Dok', 1, 1, 'Laporan BPJS F7'],
    'Uniform Request & Fulfillment': ['Hari', 7, 6, 'Permintaan seragam', 'max'], 'Recruitment Care Estate': ['%', 100, 70, 'Permintaan SDM Care Estate'], 'Recruitment HWC': ['%', 100, 60, 'Permintaan SDM HWC'], 'Share Loker': ['Dok', 6, 5, 'Kanal lowongan F4'],
    'Staff Database Update': ['Dok', 1, 1, 'Audit direktori F2'], 'Employee Loyalty': ['Dok', 1, 1, 'Survei'], 'Training & Learning Program': ['Dok', 1, 1, 'Program pelatihan F6'], 'Pelatihan therapist reguler': ['Jam', 138, 145, 'Log pelatihan F6'], 'Pelatihan therapist baru': ['Jam', 240, 190, 'Onboarding F4/F6'],
    'Onboarding': ['Dok', 1, 1, 'Checklist onboarding F3/F4'], 'Bisnis Proses': ['Dok', 3, 2, 'SOP Library F3'], 'Looker Studio': ['Dok', 1, 1, 'e-Deck F8'], 'XRace': ['Dok', 1, 1, 'Review XRace F8'], 'HR Activity Calendar': ['Dok', 1, 1, 'Kalender F3']
  };
  function metric(hr, key) {
    const h5 = X('HR5'), h6 = X('HR6'), h7 = X('HR7');
    if (key === 'Rasio biaya tenaga kerja' && h7) { const b = h7.budgetYear(hr); const o = b[9]; const t = h7.totals(h7.batchLines(hr, '2610')); return { unit: '%', target: 25, actual: Math.round(t.cost / o.rev * 1000) / 10, source: 'Payroll F7 PAY-2610-01 ÷ revenue Okt', dir: 'max', restricted: true, ev: 'PAY-2610-01', metric: 'MET-SALR v1' }; }
    if (key === 'Therapist Utility' && h5) { const os = H.OUTLETS.map(o => h5.outletUtil(hr, o.id, '2610')); const u = os.reduce((s, x) => s + x.done, 0) / os.reduce((s, x) => s + x.cap, 0); return { unit: '%', target: 85, actual: Math.round(u * 1000) / 10, source: 'F5 total jam treatment ÷ total kapasitas (4 outlet)', ev: 'UTIL-2610', metric: 'MET-UTIL v1', route: 'hrd-mp-utility?p=2610' }; }
    if (key === 'Recruitment Jaens Spa' && h5 && hr.f4) { const rs = hr.f4.reqs.filter(r => r.status === 'Disetujui').map(r => h5.reqProgress(hr, r.id)).filter(Boolean); const need = rs.reduce((s, x) => s + x.req.count, 0), placed = rs.reduce((s, x) => s + x.placed, 0); return { unit: '%', target: 100, actual: need ? Math.round(placed / need * 100) : null, source: `F4: ${placed} ditempatkan ÷ ${need} formasi disetujui`, ev: 'REQ-HR-*', metric: 'MET-FILL v1', route: 'hrd-mp-handoff' }; }
    if (key === 'Talent Readiness' && h6) { const r = h6.readiness(hr); return { unit: '%', target: 85, actual: Math.round(r.rate * 100), source: `F6: ${r.ready}/${r.roles} peran kunci punya suksesor siap`, ev: 'PIPE-2611', metric: 'MET-READY v1', route: 'hrd-training?tab=pipe' }; }
    if (key === 'Progress Training' && h6) { const e = h6.trainingEff(hr); return { unit: '%', target: 100, actual: e.rate === null ? null : Math.round(e.rate * 100), source: `F6: ${e.passed} lulus ÷ ${e.verified} terverifikasi`, ev: 'PRG-*', metric: 'MET-TRAIN v1', route: 'hrd-training?tab=eff' }; }
    const f = FIX[key]; if (!f) return { unit: '—', target: null, actual: null, source: 'Belum dipetakan' };
    return { unit: f[0], target: f[1], actual: f[2], source: f[3], dir: f[4] || 'min', ev: `EVD-WB-${key.replace(/\W+/g, '').slice(0, 8).toUpperCase()}`, metric: 'Workbook SER/Race (fixture)' };
  }
  const achOf = (m) => m.actual === null || m.actual === undefined || !m.target ? null : Math.min(1, m.dir === 'max' ? (m.actual === 0 ? 1 : m.target / m.actual) : m.actual / m.target);
  function pillarScore(hr, p, role) {
    const ms = p.keys.map(k => ({ key: k, ...metric(hr, k) })), vis = ms.filter(m => !m.restricted || role === 'hrd');
    const measured = vis.map(achOf).filter(a => a !== null);
    return { metrics: ms, visible: vis, restricted: ms.some(m => m.restricted) && role !== 'hrd', ach: measured.length ? measured.reduce((a, b) => a + b, 0) / measured.length : null, gaps: vis.filter(m => achOf(m) === null).length };
  }
  function raceScore(hr, race, role) {
    const ps = race.indicators.map(p => ({ ...p, s: pillarScore(hr, p, role) }));
    const m = ps.filter(p => p.s.ach !== null), w = m.reduce((s, p) => s + p.weight, 0);
    return { pillars: ps, score: w ? m.reduce((s, p) => s + p.weight * p.s.ach, 0) / w * 100 : null, coverage: w, total: ps.reduce((s, p) => s + Number(p.weight), 0) };
  }
  const PILLARS = [
    ['IND-1', 'Financial Efficiency & Value Creation', 20, 'Executive Financial Performance', ['Rasio biaya tenaga kerja', 'Revenue per Employee', 'Therapist Utility']],
    ['IND-2', 'Collaboration Group', 10, 'Collaboration Group', ['Development JAENS', 'Strategic Partnership HWC × Jaens Wellness']],
    ['IND-3', 'Stability & Risk Governance', 20, 'Risk Control & Compliance Assurance', ['Turnover', 'Absenteeism', 'Exit Interview', 'BPJS Compliance', 'Uniform Request & Fulfillment']],
    ['IND-4', 'Talent Flow, Talent Engine, Pipeline', 20, 'Talent Management & Workforce Readiness', ['Recruitment Jaens Spa', 'Recruitment Care Estate', 'Recruitment HWC', 'Share Loker', 'Talent Readiness', 'Staff Database Update', 'Employee Loyalty']],
    ['IND-5', 'Growth, Learning and Capability', 20, 'Learning & Capability Development', ['Training & Learning Program', 'Pelatihan therapist reguler', 'Pelatihan therapist baru', 'Progress Training', 'Onboarding']],
    ['IND-6', 'Implementasi Ambidex', 10, 'Implementasi Ambidex', ['Bisnis Proses', 'Looker Studio', 'XRace', 'HR Activity Calendar']]
  ].map(([id, name, weight, goal, keys]) => ({ id, name, weight, goal, objective: goal, keys }));
  const BEACON = [
    ['BCN-01', 'Sasaran & keselarasan unit', 15, 'IND-6', 'Kalender aktivitas HR & ritme Daily/Weekly', 'Berjalan', 'EMP-0142', '2026-11-30', 'TSK-0001'],
    ['BCN-02', 'Akuisisi talenta', 25, 'IND-4', 'Isi 2 formasi therapist Ubud sebelum Desember', 'Berjalan', 'EMP-0145', '2026-12-01', 'TSK-0004'],
    ['BCN-03', 'Kapabilitas & pembelajaran', 25, 'IND-5', 'Hot stone level Mahir untuk 10 therapist', 'Berjalan', 'EMP-0144', '2026-11-30', 'TSK-0101'],
    ['BCN-04', 'Retensi & keterlibatan', 20, 'IND-3', 'Exit interview 100% & buddy system', 'Rencana', 'EMP-0144', '2026-12-15', 'TSK-0103'],
    ['BCN-05', 'Tata kelola & kepatuhan', 15, 'IND-3', 'Laporan BPJS & dokumen SOP tepat waktu', 'Review', 'EMP-0143', '2026-11-15', 'TSK-0006']
  ].map(([id, name, weight, parent, initiative, stage, pic, due, task]) => ({ id, name, weight, parent, initiative, stage, pic, due, task, evidence: [], reviews: [] }));
  const RUBRIC = ['Kualitas objective', 'Keselarasan bisnis', 'Efektivitas tim & individu', 'Proses', 'Output', 'Stakeholder'];

  /* ---------- Daily / Weekly dari Planner F3 ---------- */
  const tasks = (hr) => hr.f3?.tasks || [];
  const evOf = (hr, id) => (hr.f3?.events || []).filter(e => e.task === id);
  function daily(hr, emp, date = TODAY) {
    const ts = tasks(hr).filter(t => t.pic === emp || (hr.f3?.focus || []).some(f => f.emp === emp && f.task === t.id));
    const focus = (hr.f3?.focus || []).filter(f => f.emp === emp && f.date === date).map(f => f.task);
    const doneToday = ts.filter(t => evOf(hr, t.id).some(e => e.after === 'Selesai' && e.at.startsWith(date)));
    return { focus: ts.filter(t => focus.includes(t.id)), done: doneToday, verified: doneToday.filter(t => !t.requireReview || evOf(hr, t.id).some(e => /Review diterima|review-accept|Diterima/.test(e.kind + ' ' + (e.after || '')))), late: ts.filter(t => t.due && t.due < date && t.stage !== 'Selesai'), blocked: ts.filter(t => t.blocker && t.stage !== 'Selesai'), extra: ts.filter(t => !focus.includes(t.id) && evOf(hr, t.id).some(e => e.kind === 'Dibuat' && e.at.startsWith(date))) };
  }
  function weekly(hr, ws) {
    const ts = tasks(hr).filter(t => !ws || t.ws === ws);
    return { commit: ts.filter(t => t.due && t.due >= WEEK[0] && t.due <= WEEK[1]), carried: ts.filter(t => t.due && t.due < WEEK[0] && t.stage !== 'Selesai').map(t => ({ t, originalDue: evOf(hr, t.id).find(e => e.kind === 'Ubah Tenggat')?.before || t.due })), done: ts.filter(t => t.stage === 'Selesai' && evOf(hr, t.id).some(e => e.after === 'Selesai' && e.at.slice(0, 10) >= WEEK[0])), blocked: ts.filter(t => t.blocker && t.stage !== 'Selesai'), cap: [...new Set(ts.filter(t => t.pic && t.stage !== 'Selesai').map(t => t.pic))].map(e => ({ emp: e, open: ts.filter(t => t.pic === e && t.stage !== 'Selesai').length })) };
  }

  /* ---------- Monthly Reflection ---------- */
  function reflection(hr, period, role) {
    const h5 = X('HR5'), h6 = X('HR6'), h7 = X('HR7');
    const rows = [];
    const add = (sec, key, label, target, actual, unit, source, route, restricted) => rows.push({ sec, key, label, target, actual, unit, source, route, restricted: !!restricted, hidden: !!restricted && role !== 'hrd' });
    if (h5) for (const o of H.OUTLETS) { const u = h5.outletUtil(hr, o.id, period === '2610' ? '2610' : 'W46'); add('Kapasitas', `UTIL-${o.id}`, `Utility ${o.name}`, 85, Math.round(u.u * 1000) / 10, '%', period === '2610' ? 'F5 Oktober (= Beranda F1)' : 'F5 Minggu 46', `hrd-mp-utility?outlet=${o.id}${period === '2610' ? '&p=2610' : ''}`); }
    if (h6) { const a = h6.avgX(hr, h6.therapists(hr), period); add('KPI', 'XSCORE', 'Rata-rata XScore therapist', 85, a.avg === null ? null : Math.round(a.avg * 10) / 10, 'poin', `F6 · ${a.full}/${a.of} bukti lengkap`, `hrd-xscore?p=${period}`); const e = h6.trainingEff(hr); add('Talenta', 'TRAIN', 'Efektivitas pelatihan', 85, e.rate === null ? null : Math.round(e.rate * 100), '%', 'F6 pelatihan', 'hrd-training?tab=eff'); const r = h6.readiness(hr); add('Talenta', 'READY', 'Talent readiness', 85, Math.round(r.rate * 100), '%', 'F6 pipeline', 'hrd-training?tab=pipe'); for (const s of h6.SER.filter(x => ['EXP-03', 'EXP-07', 'EXP-12'].includes(x.id))) add('SER', s.id, s.name, s.target, s.actual, s.unit, `SER F6 · ${s.source}`, `hrd-ser?id=${s.id}`); }
    if (h5 && hr.f4) { const open = hr.f4.reqs.filter(x => x.status !== 'Ditolak').map(x => h5.reqProgress(hr, x.id)).reduce((s, x) => s + (x?.open || 0), 0); add('Talenta', 'OPEN', 'Posisi terbuka', 0, open, 'orang', 'F4/F5 permintaan tenaga', 'hrd-mp-handoff'); }
    if (h7) { const b = h7.batchOf(hr, period); const t = h7.totals(h7.batchLines(hr, period)); const rev = h7.budgetYear(hr)[period === '2610' ? 9 : 10]; add('Biaya', 'SALR', 'Total People Cost Ratio', 25, Math.round(t.cost / (rev.rev || rev.revPlan) * 1000) / 10, '%', `F7 ${b ? b.id + ' · ' + b.status : 'draf'} ÷ revenue`, 'hrd-budget', true); add('Biaya', 'THP', 'Total take-home pay', null, t.thp, 'Rp', `F7 ${b?.id || 'draf'}`, `hrd-payroll?period=${period}`, true); }
    return rows;
  }
  const gapOf = (r) => r.actual === null || r.actual === undefined ? 'Belum tersedia' : r.target === null ? '—' : r.key.startsWith('UTIL') ? (r.actual > 100 ? 'Di atas kapasitas' : r.actual < 70 ? 'Di bawah 70%' : 'Dalam rentang') : r.key === 'SALR' ? (r.actual > 30 ? 'Di atas batas' : r.actual < 25 ? 'Di bawah rencana' : 'Dalam koridor') : r.key === 'OPEN' ? (r.actual > 0 ? `${r.actual} terbuka` : 'Terpenuhi') : r.actual >= r.target ? 'Tercapai' : 'Di bawah target';

  /* ---------- e-Deck ---------- */
  const PAGES = ['Dashboard HR Performance', 'Therapist Utility', 'Therapist Productivity', 'Manpower', 'Recruitment', 'Absen', 'Therapist Training', 'Tata Kelola'];
  function deckPage(hr, k, period, scope, role) {
    const h4 = X('HR4'), h5 = X('HR5'), h6 = X('HR6'), h7 = X('HR7');
    const outs = scope && scope !== 'all' ? [scope] : H.OUTLETS.map(o => o.id), P5 = period === '2610' ? '2610' : 'W46';
    const v = [];
    const put = (label, value, unit, src, route, ev, restricted) => v.push({ label, value, unit, src, route, ev, restricted: !!restricted, hidden: !!restricted && role !== 'hrd' });
    if (k === 0) { const n = outs.reduce((s, o) => s + H.people(hr, 'hrd', { outlet: o }).length, 0) + (scope && scope !== 'all' ? 0 : H.people(hr, 'hrd', { outlet: H.HQ.id }).length); put('Headcount aktif', n, 'orang', 'Roster F2', 'hrd-roster', 'ROSTER'); if (h6) { const s = h6.SER.filter(x => x.actual !== null && !x.restricted); put('Ekspektasi SER tercapai', `${s.filter(x => h6.ach(x.actual, x.target, x.dir === 'max' ? 'max' : 'min') >= 1).length}/${h6.SER.length}`, '', 'SER F6', 'hrd-ser', 'SER-2610'); } if (h7) { const t = h7.totals(h7.batchLines(hr, period).filter(l => !scope || scope === 'all' || l.loc === scope)); put('Biaya tenaga kerja (agregat)', Math.round(t.cost), 'Rp', `F7 ${h7.batchOf(hr, period)?.id || 'draf'}`, 'hrd-budget', h7.batchOf(hr, period)?.id, true); } }
    if (k === 1 && h5) for (const o of outs) { const u = h5.outletUtil(hr, o, P5); put(`Utility ${H.locName(o)}`, Math.round(u.u * 1000) / 10, '%', `F5 ${Math.round(u.done)} ÷ ${Math.round(u.cap)} jam${u.ot ? ` · lembur ${u.ot} jam` : ''}`, `hrd-mp-utility?outlet=${o}${period === '2610' ? '&p=2610' : ''}`, `UTIL-${o}-${period}`); }
    if (k === 2 && h6) for (const o of outs) { const ls = h6.therapists(hr, o); const xs = ls.map(p => h6.xscore(hr, p.id, period)).filter(Boolean); const pr = xs.map(x => x.comps[1].actual).filter(a => a !== null); put(`Produktivitas ${H.locName(o)}`, pr.length ? Math.round(pr.reduce((a, b) => a + b, 0) / pr.length * 1000) / 10 : null, '%', 'F6 tamu aktual ÷ target (MET-PROD v1)', `hrd-xscore?outlet=${o}&p=${period}`, `EVD-GST-${period}`); }
    if (k === 3 && h5) { for (const o of outs) { const u = h5.outletUtil(hr, o, P5); put(`Bantuan antaroutlet ${H.locName(o)}`, u.help ?? 0, 'jam', 'F5 POS', `hrd-mp-capacity?outlet=${o}`, `UTIL-${o}`); } const open = (hr.f4?.reqs || []).filter(r => r.status !== 'Ditolak' && outs.includes(r.outlet)).map(r => h5.reqProgress(hr, r.id)).reduce((s, x) => s + (x?.open || 0), 0); put('Formasi sedang dipenuhi', open, 'posisi', 'F4/F5', 'hrd-mp-handoff', 'REQ-HR-*'); }
    if (k === 4 && h4) { const apps = hr.f4.apps.filter(a => outs.includes(h4.vacOf(hr, a.vac)?.location)); put('Lamaran', apps.length, '', 'F4 pipeline', 'hrd-rec-candidates', 'APP-*'); put('Shortlist ke atas', apps.filter(a => !['Lamaran Masuk', 'Klarifikasi', ...h4.ENDS].includes(a.stage)).length, '', 'F4', 'hrd-rec-candidates', 'APP-*'); put('Penempatan aktif', apps.filter(a => a.stage === 'Penempatan Aktif').length, '', 'F4', 'hrd-rec-place', 'APP-*'); put('Sumber kanal', [...new Set(apps.map(a => a.channel))].join(', '), '', 'F4', 'hrd-rec-candidates', 'CH'); }
    if (k === 5) { put('Presensi terverifikasi', period === '2610' ? 97.8 : 96.4, '%', 'F2 approval presensi', 'hrd-att-approval', `ATT-${period}`); put('Absenteeism', null, '%', 'Definisi denominator perlu dikonfirmasi', 'hrd-ser?id=EXP-12', null); }
    if (k === 6 && h6) { const e = h6.trainingEff(hr); put('Peserta hadir', e.attended, '', 'F6', 'hrd-training', 'PRG-*'); put('Praktik terverifikasi', `${e.verified} (${Math.round((e.coverage || 0) * 100)}%)`, '', 'F6', 'hrd-training', 'PRG-*'); put('Lulus praktik', e.passed, '', 'F6', 'hrd-training?tab=eff', 'PRG-*'); }
    if (k === 7) { put('Kartu Review menunggu', tasks(hr).filter(t => t.stage === 'Review').length, '', 'Planner F3', 'hrd-list?stage=Review', 'TSK-*'); put('Approval tertunda', (hr.f2?.ledger || []).length ? 'lihat F2' : 0, '', 'Approval F2', 'hrd-approval', 'APR-*'); put('Peristiwa audit periode', hr.audit.length, '', 'Audit F1', 'hrd-audit', 'AUD-*'); put('Dokumen SOP aktif', (hr.f3?.templates || []).filter(t => t.active).length, '', 'Library F3', 'hrd-library', 'TPL-*'); }
    return v;
  }


  /* ---------- Pusat Laporan & Jejak Bukti ---------- */
  function catalog(hr, role) {
    const f8 = ensure(hr), h5 = X('HR5'), h6 = X('HR6'), h7 = X('HR7'), mgr = role === 'hrd';
    const ar = activeRace(hr), rs = raceScore(hr, ar.ver, role);
    const rf = (id) => f8.refresh[id] || null;
    const L = [];
    const put = (o) => { const r = rf(o.id); L.push({ ...o, refreshed: r?.at || o.updated, refreshCount: r?.count || 0, refreshStatus: r?.status || null, denied: !!o.restricted && !mgr }); };
    put({ id: 'RPT-RACE-HG', name: 'Skor Race Vegen Human Growth', unit: 'Human Growth', outlet: 'all', div: 'HRD', period: '2611', version: `RACE v${ar.ver.v}`, formula: 'Σ bobot × capaian indikator terukur ÷ bobot terukur', result: rs.score === null ? null : Math.round(rs.score * 10) / 10, evidence: 'EVD-WB-* · UTIL-2610 · PRG-* · PIPE-2611', updated: '2026-11-13 08:00', status: rs.pillars.some(p => p.s.gaps) ? 'Provisional' : 'Lengkap', route: 'hrd-race', follow: f8.decisions.length });
    if (h5) for (const o of H.OUTLETS) { const u = h5.outletUtil(hr, o.id, 'W46'); put({ id: `RPT-UTIL-${o.id}`, name: `Therapist Utility ${o.name}`, unit: 'Operational', outlet: o.id, div: 'Spa', period: '2611', version: 'MET-UTIL v1', formula: 'jam treatment selesai ÷ kapasitas reguler', result: Math.round(u.u * 1000) / 10, evidence: `UTIL-${o.id}-2611 · POS W46`, updated: '2026-11-13 07:00', status: 'Provisional', route: `hrd-mp-utility?outlet=${o.id}`, follow: tasks(hr).filter(t => t.source?.id === `UTIL-${o.id}-2611`).length }); }
    if (h6) { const a = h6.avgX(hr, h6.therapists(hr), '2611'); put({ id: 'RPT-XSCORE-2611', name: 'XScore therapist November', unit: 'Human Growth', outlet: 'all', div: 'Spa', period: '2611', version: 'MET-UTIL/PROD/LEARN v1 · bobot 50/30/20', formula: 'Σ bobot × capaian ÷ bobot terukur', result: a.avg === null ? null : Math.round(a.avg * 10) / 10, evidence: 'EVD-POS-2611-* · EVD-GST-2611-* · EVD-LRN-2611-*', updated: '2026-11-13 07:00', status: a.full < a.of ? 'Provisional' : 'Lengkap', route: 'hrd-xscore?p=2611', follow: 0 });
      const ab = h6.SER.find(x => x.id === 'EXP-12'); put({ id: 'RPT-ABSEN-2611', name: 'Absenteeism', unit: 'HRD Operations', outlet: 'all', div: 'HRD', period: '2611', version: 'Definisi belum dikunci', formula: 'Denominator perlu konfirmasi', result: ab?.actual ?? null, evidence: '', updated: null, status: 'Bukti kosong', route: 'hrd-ser?id=EXP-12', follow: 0 });
      const ex = h6.SER.find(x => x.id === 'EXP-07'); put({ id: 'RPT-EXIT-2610', name: ex ? ex.name : 'Exit Interview', unit: 'Human Growth', outlet: 'all', div: 'HRD', period: '2610', version: 'Workbook v1', formula: 'exit interview selesai ÷ karyawan keluar', result: ex?.actual ?? null, evidence: 'EVD-WB-EXIT (2026-09-30)', updated: '2026-09-30 17:00', status: 'Kedaluwarsa', route: 'hrd-ser?id=EXP-07', follow: 0 }); }
    if (h7) { const b = h7.batchOf(hr, '2610'); const t = h7.totals(h7.batchLines(hr, '2610')); put({ id: 'RPT-PAY-2610', name: 'Ringkasan Gaji & biaya Oktober', unit: 'HRD Operations', outlet: 'all', div: 'HRD', period: '2610', version: 'RUL-* v1 · snapshot batch', formula: 'Σ slip batch terkunci', result: t.thp, resultUnit: 'Rp', evidence: b?.id || 'PAY-2610-01', updated: b?.lockedAt || '2026-10-31 18:00', status: 'Lengkap', route: 'hrd-reports?period=2610', restricted: true, follow: 0 }); }
    for (const sn of f8.snapshots) put({ id: sn.id, name: `Snapshot e-Deck ${PERIODS[sn.period] || sn.period}`, unit: 'HRD', outlet: sn.scope, div: 'HRD', period: sn.period, version: Object.entries(sn.versions).map(([k, v]) => `${k} ${v}`).join(' · '), formula: '8 halaman, nilai beku saat review', result: `v${sn.v}`, evidence: sn.prev ? `koreksi dari ${sn.prev}` : 'snapshot awal', updated: sn.at, status: sn.prev ? 'Dikoreksi' : 'Snapshot', route: `hrd-race-deck?snap=${sn.id}`, restricted: sn.sensitive && false, sensitive: sn.sensitive, follow: 0 });
    return L;
  }

  function seed() {
    return {
      seeded: true,
      races: [{ id: 'RACE-HG-2611', name: 'Race Vegen Human Growth', scope: 'Human Growth · Grup Spa', period: '2611', objective: 'Perkuat stabilitas, kepatuhan, efisiensi, dan kesiapan talenta.', versions: [{ v: 1, status: 'Aktif', indicators: PILLARS.map(p => ({ ...p, keys: [...p.keys] })), at: '2026-11-01 09:00', by: 'Manager HRD' }], demo: true }],
      beacon: { id: 'BCN-CTR-2611', version: 1, items: BEACON.map(b => ({ ...b })), demo: true },
      sessions: [{ id: 'SES-W45-HRD', kind: 'Weekly', at: '2026-11-06 16:00', scope: 'HRD', commits: ['TSK-0001', 'TSK-0008'], status: { 'TSK-0001': 'Workplan', 'TSK-0008': 'Workplan' }, notes: 'Komitmen W45: validasi POS Ubud, update kontak darurat', demo: true }],
      notes: [], decisions: [{ id: 'DEC-2610-001', title: 'Uji jadwal shift split di Spa Shanti', finding: 'FND-UTIL-SHT-2610', alternatives: ['Kurangi formasi Shanti', 'Shift split 2 minggu', 'Promosi paket sore'], chosen: 'Shift split 2 minggu', reason: 'Pembatalan sore tinggi; hindari pengurangan orang sebelum data permintaan lengkap', owner: 'EMP-0142', due: '2026-11-15', criteria: { key: 'UTIL-OUT-SHT', op: '>=', value: 70, period: '2611' }, task: 'TSK-0002', status: 'Dievaluasi', evaluation: null, at: '2026-10-31 15:00', demo: true }],
      snapshots: [], refresh: {}, seq: { ses: 1, dec: 1, snp: 0, note: 0 }
    };
  }
  function ensure(hr) {
    if (hr.f2 && hr.f2.f8) { hr.f8 = hr.f2.f8; delete hr.f2.f8; }
    if (!hr.f8 || !hr.f8.seeded) { const k = hr.f8; hr.f8 = seed(); if (k) { hr.f8.decisions.push(...(k.decisions || [])); hr.f8.snapshots.push(...(k.snapshots || [])); } }
    return hr.f8;
  }
  const activeRace = (hr) => { const r = ensure(hr).races[0]; return { race: r, ver: [...r.versions].reverse().find(v => v.status === 'Aktif'), draft: r.versions.find(v => v.status === 'Draf') }; };
  const canSee = (role) => ['owner', 'hrd', 'hrd-ops', 'hg-lead', 'ops-manager', 'outlet-spv'].includes(role);
  const evaluate = (hr, d) => { const c = d.criteria; if (!c) return null; if (!['2610', '2611'].includes(String(c.period))) return { actual: null, met: null, pending: `Data ${c.period} belum tersedia` }; const row = reflection(hr, c.period, 'hrd').find(r => r.key === c.key); if (!row || row.actual === null) return { actual: null, met: null }; const met = c.op === '>=' ? row.actual >= c.value : row.actual <= c.value; return { actual: row.actual, met, label: row.label }; };

  function update(state, hr, action, input, ctx) {
    const f8 = ensure(hr), { audit, by, role } = ctx;
    const lead = () => { if (!['hrd', 'hg-lead', 'owner'].includes(role)) throw new Error(`Akses ditolak: ${H.roleDef(role).label} tidak mengelola Race.`); };
    const team = () => { if (!['hrd', 'hrd-ops', 'hg-lead', 'outlet-spv', 'owner'].includes(role)) throw new Error(`Akses ditolak: ${H.roleDef(role).label}.`); };
    switch (action) {
      case 'race-draft': {
        lead(); const { race, ver, draft } = activeRace(hr); if (draft) return `${race.id}-v${draft.v}`;
        const v = race.versions.length + 1; race.versions.push({ v, status: 'Draf', indicators: JSON.parse(JSON.stringify(ver.indicators)), at: now(), by }); return `${race.id}-v${v}`;
      }
      case 'race-edit': {
        lead(); const { race, draft } = activeRace(hr); if (!draft) throw new Error('Buat draf versi baru sebelum mengedit.');
        if (input.add === '1') { const name = String(input.name || '').trim(); if (name.length < 3) throw new Error('Nama indikator minimal 3 karakter.'); draft.indicators.push({ id: `IND-${draft.indicators.length + 1}`, name, weight: Number(input.weight || 0), goal: input.goal || name, objective: input.goal || name, keys: String(input.keys || '').split('|').map(s => s.trim()).filter(Boolean) }); return race.id; }
        const it = draft.indicators.find(i => i.id === input.id); if (!it) throw new Error('Indikator tidak ditemukan.');
        const w = Number(input.weight); if (!(w >= 0 && w <= 100)) throw new Error('Bobot 0–100.'); it.weight = w; if (input.goal) it.goal = input.goal; return race.id;
      }
      case 'race-activate': {
        if (!['hrd', 'owner'].includes(role)) throw new Error('Aktivasi versi Race oleh Manager HRD.');
        const { race, ver, draft } = activeRace(hr); if (!draft) throw new Error('Tidak ada draf.');
        const sum = draft.indicators.reduce((s, i) => s + Number(i.weight), 0); if (Math.abs(sum - 100) > 1e-9) throw new Error(`Total bobot ${sum}%. Versi tetap draf sampai tepat 100%.`);
        ver.status = 'Arsip'; draft.status = 'Aktif'; draft.activatedAt = now(); draft.by = by;
        audit(hr, by, 'Aktivasi Race Vegen', `${race.id} v${draft.v} · ${draft.indicators.length} indikator`, { object: 'Race', ref: race.id, before: `v${ver.v}`, after: `v${draft.v}` });
        return `${race.id}-v${draft.v}`;
      }
      case 'beacon-review': {
        lead(); const b = f8.beacon.items.find(x => x.id === input.id); if (!b) throw new Error('Beacon tidak ditemukan.');
        const scores = RUBRIC.map((_, i) => Number(input['r' + i])); if (scores.some(s => !(s >= 1 && s <= 4))) throw new Error('Isi semua kriteria Success Factors (1–4).');
        const reason = String(input.reason || '').trim(); if (reason.length < 10) throw new Error('Alasan review minimal 10 karakter.');
        const evd = String(input.evidence || b.task || '').trim(); if (!evd) throw new Error('Bukti review wajib.');
        b.reviews.push({ id: `RVW-${b.id}-${b.reviews.length + 1}`, scores, avg: Math.round(scores.reduce((a, c) => a + c, 0) / scores.length * 10) / 10, reason, evidence: evd, by, at: now(), rubric: 'RF v1' });
        audit(hr, by, 'Review Success Factors', `${b.id} · rata-rata ${b.reviews[b.reviews.length - 1].avg}`, { object: 'Race', ref: b.id });
        return b.reviews[b.reviews.length - 1].id;
      }
      case 'race-session': {
        team(); const kind = ['Daily', 'Weekly', 'Monthly'].includes(input.kind) ? input.kind : 'Daily';
        const commits = String(input.commits || '').split(',').map(s => s.trim()).filter(Boolean);
        const id = `SES-${kind[0]}${String(++f8.seq.ses).padStart(3, '0')}`;
        f8.sessions.push({ id, kind, at: now(), scope: input.scope || 'HRD', commits, status: Object.fromEntries(commits.map(c => [c, tasks(hr).find(t => t.id === c)?.stage || '—'])), notes: input.notes || '', by, demo: true });
        return id;
      }
      case 'weekly-action': {
        team(); const title = String(input.title || '').trim(); if (title.length < 5) throw new Error('Judul tindakan minimal 5 karakter.'); if (!input.pic || !input.due) throw new Error('Tindakan berikutnya wajib PIC dan tenggat.');
        return H.EXT.update(state, hr, 'task-create', { ws: input.ws || 'HRD', stage: 'Workplan', title, pic: input.pic, due: input.due, sourceId: input.sourceId || `WEEK-W46-${title.slice(0, 12)}`, sourceType: 'Weekly Race', sourceLabel: 'Weekly Race W46', sourceRoute: 'hrd-race-weekly', finding: input.finding || null, scope: input.scope || 'ENT-SPA' }, { ...ctx, role: ['hrd', 'hrd-ops', 'hg-lead'].includes(role) ? role : 'hrd-ops' });
      }
      case 'rfl-note': {
        team(); const sec = input.sec || 'Umum'; const text = String(input.text || '').trim(); if (text.length < 5) throw new Error('Catatan minimal 5 karakter.');
        const id = `RFN-${input.period || '2611'}-${String(++f8.seq.note).padStart(3, '0')}`; f8.notes.push({ id, period: String(input.period || '2611'), sec, kind: input.kind || 'Penyebab selisih', text, evidence: input.evidence || '', by, at: now(), demo: true }); return id;
      }
      case 'rfl-mark': {
        team(); const period = String(input.period || '2611'); const row = reflection(hr, period, role).find(r => r.key === input.key); if (!row) throw new Error('Metrik tidak ditemukan.');
        if (row.hidden) throw new Error('Akses ditolak: metrik biaya khusus Manager HRD.');
        const stage = ['Ide', 'Issue', 'Workplan'].includes(input.stage) ? input.stage : 'Issue';
        const util = row.key.startsWith('UTIL-'), o = util ? row.key.slice(5) : null;
        const sid = util ? `UTIL-${o}-2611` : `RFL-${period}-${row.key}`, finding = util ? `FND-UTIL-${o.slice(4)}-2611` : `FND-RFL-${period}-${row.key}`;
        const t = H.EXT.update(state, hr, 'task-create', { ws: ['TRAIN', 'READY', 'XSCORE'].includes(row.key) ? 'HG' : 'HRD', stage, title: row.restricted ? `Tinjau metrik biaya Reflection ${period}` : `${row.label} ${row.actual}${row.unit === '%' ? '%' : ' ' + row.unit}: ${gapOf(row).toLowerCase()}`, scope: o || 'ENT-SPA', sourceId: sid, sourceType: 'Monthly Reflection', sourceLabel: `Reflection ${period} · ${row.restricted ? 'metrik terbatas' : row.label}`, sourceRoute: row.restricted ? `hrd-race-reflection?period=${period}` : row.route, finding, pic: stage === 'Workplan' ? (input.pic || 'EMP-0142') : undefined, due: stage === 'Workplan' ? (input.due || '2026-11-27') : undefined }, { ...ctx, role: ['hrd', 'hrd-ops', 'hg-lead'].includes(role) ? role : 'hrd-ops' });
        return t;
      }
      case 'dec-create': {
        lead(); const title = String(input.title || '').trim(); if (title.length < 5) throw new Error('Judul keputusan minimal 5 karakter.');
        const reason = String(input.reason || '').trim(); if (reason.length < 10) throw new Error('Alasan keputusan minimal 10 karakter.');
        if (!input.owner || !input.due) throw new Error('Keputusan wajib pemilik dan tenggat.');
        const id = `DEC-2611-${String(++f8.seq.dec).padStart(3, '0')}`;
        f8.decisions.push({ id, title, finding: input.finding || null, task: input.task || null, alternatives: String(input.alternatives || '').split('|').map(s => s.trim()).filter(Boolean), chosen: input.chosen || '', reason, owner: input.owner, due: input.due, criteria: input.ckey ? { key: input.ckey, op: input.cop || '<=', value: Number(input.cvalue), period: input.cperiod || '2612' } : null, status: 'Diputuskan', evaluation: null, workplan: null, at: now(), by, demo: true });
        audit(hr, by, 'Keputusan STRACON', `${id} · ${title}`, { object: 'STRACON', ref: id });
        return id;
      }
      case 'dec-workplan': {
        lead(); const d = f8.decisions.find(x => x.id === input.id); if (!d) throw new Error('Keputusan tidak ditemukan.'); if (d.workplan) return d.workplan;
        d.workplan = H.EXT.update(state, hr, 'task-create', { ws: 'HRD', stage: 'Workplan', title: `Jalankan keputusan: ${d.title}`, pic: d.owner, due: d.due, sourceId: d.id, sourceType: 'STRACON', sourceLabel: `${d.id} · ${d.chosen || d.title}`, sourceRoute: `hrd-race-stracon?id=${d.id}`, finding: d.finding, scope: 'ENT-SPA' }, { ...ctx, role: role === 'owner' ? 'hrd' : role });
        return d.workplan;
      }
      case 'dec-evaluate': {
        lead(); const d = f8.decisions.find(x => x.id === input.id); if (!d) throw new Error('Keputusan tidak ditemukan.');
        const e = evaluate(hr, d); d.evaluation = { ...e, note: input.note || '', by, at: now() }; d.status = 'Dievaluasi';
        audit(hr, by, 'Evaluasi keputusan', `${d.id} · ${e?.met === null ? 'data belum tersedia' : e?.met ? 'kriteria tercapai' : 'kriteria belum tercapai'}`, { object: 'STRACON', ref: d.id });
        return d.id;
      }
      case 'deck-snapshot': {
        team(); const period = String(input.period || '2611'), scope = input.scope || 'all';
        const pages = PAGES.map((name, k) => ({ name, values: deckPage(hr, k, period, scope, 'hrd') }));
        const prev = input.prev && f8.snapshots.find(s => s.id === input.prev);
        const base = prev ? prev.base : `SNP-${period}-${String(++f8.seq.snp).padStart(3, '0')}`;
        const v = prev ? f8.snapshots.filter(s => s.base === base).length + 1 : 1;
        if (prev && input.page !== undefined) { const pg = pages[Number(input.page)]; const val = pg?.values.find(x => x.label === input.field); if (!val) throw new Error('Field koreksi tidak ditemukan.'); if (String(input.reason || '').trim().length < 10) throw new Error('Alasan koreksi minimal 10 karakter.'); val.before = val.value; val.value = isNaN(Number(input.value)) ? input.value : Number(input.value); val.corrected = input.reason; }
        const id = `${base}-v${v}`;
        f8.snapshots.push({ id, base, v, prev: prev?.id || null, period, scope, pages, versions: { 'MET-UTIL': 'v1', 'MET-PROD': 'v1', 'MET-TRAIN': 'v1', 'RACE': `v${activeRace(hr).ver.v}` }, completeness: 'Absenteeism belum terdefinisi · November provisional', note: input.note || '', sensitive: pages.some(p => p.values.some(x => x.restricted)), by, at: now(), demo: true });
        audit(hr, by, prev ? 'Koreksi snapshot e-Deck' : 'Snapshot e-Deck', `${id}${prev ? ' ← ' + prev.id : ''}`, { object: 'Laporan', ref: id });
        return id;
      }
      case 'report-refresh': {
        team(); const k = input.id; const r = f8.refresh[k] || { count: 0, at: null }; r.count++; r.at = now(); r.status = input.fail === '1' ? 'Gagal (sumber tidak merespons, simulasi)' : 'Diperbarui'; f8.refresh[k] = r; return k;
      }
      default: return undefined;
    }
  }
  const prevExt = { ...H.EXT };
  H.EXT.update = (state, hr, action, input, ctx) => { const r = update(state, hr, action, input, ctx); return r !== undefined ? r : prevExt.update(state, hr, action, input, ctx); };
  H.EXT.purge = (hr) => { prevExt.purge?.(hr); delete hr.f8; };
  H.EXT.keep = (hr) => { const k = prevExt.keep?.(hr) || {}; if (hr.f8) k.f8 = { seeded: false, decisions: hr.f8.decisions.filter(d => !d.demo), snapshots: hr.f8.snapshots.filter(s => !s.demo) }; return k; };
  H.EXT.ensure = (hr) => { if (hr.f2 && hr.f2.f8) { hr.f8 = hr.f2.f8; delete hr.f2.f8; } prevExt.ensure?.(hr); ensure(hr); };
  return { PERIODS, PAGES, RUBRIC, PILLARS, WEEK, ensure, metric, achOf, pillarScore, raceScore, activeRace, daily, weekly, reflection, gapOf, deckPage, evaluate, canSee, catalog };
})();
if (typeof module !== 'undefined') module.exports = HR8;
