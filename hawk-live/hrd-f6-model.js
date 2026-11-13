/* HAWK ERP · Portal HRD · model F6 Human Growth & Kinerja — DATA DEMO / SIMULASI.
   SER 15 ekspektasi (workbook 1.1. SER), KPI Library berversi, kontrak KPI (draf → persetujuan → aktif → ditutup → koreksi),
   XScore therapist (bobot demo Utility 50 / Produktivitas 30 / Learning 20 — formula resmi AJi Creator OS belum terverifikasi),
   kompetensi, 9-Box, rencana pengembangan (Workplan F3), pelatihan & verifikasi praktik, Quality of Hire, talent pipeline.
   Periode: 2610 (Oktober, ditutup) dan 2611 (November, provisional dari POS F5 Minggu 46). Memperluas HR.EXT. Tanpa jaringan. */
const HR6 = (() => {
  const H = (typeof HR !== 'undefined') ? HR : require('./hrd-model.js');
  const P5 = () => (typeof HR5 !== 'undefined' ? HR5 : null);
  const TODAY = H.TODAY;
  const now = () => `${TODAY} ${new Date().toTimeString().slice(0, 5)}`;
  const PERIODS = { 2610: 'Oktober 2026 (ditutup)', 2611: 'November 2026 (provisional)' };
  const OUT_U = { 'OUT-UBD': 5512 / 5200, 'OUT-SHT': 0.66, 'OUT-TRL': 0.84, 'OUT-BSM': 0.78 };

  /* ---------- SER: 15 ekspektasi ---------- */
  const SER = [
    ['EXP-01', 'Executive Summary', 'Ratio Salary Jaens Enterprises', '%', 25, 23.5, 'Finance · biaya tenaga kerja ÷ revenue', 'max', 'MET-SALR', true],
    ['EXP-02', 'Executive Summary', 'Ratio Revenue per Employee', 'Rp', 23000000, 21000000, 'Finance + HG · revenue ÷ headcount', 'min', 'MET-RPE'],
    ['EXP-03', 'Executive Summary', 'Ratio Turnover Jaens Enterprises', '%', 2, 1.2, 'HG · karyawan keluar ÷ rata-rata headcount', 'max', 'MET-TURN'],
    ['EXP-04', 'Collaboration Group', 'Development HAWK', '%', 100, 75, 'HG + tim HAWK · milestone', 'min', 'MET-MILE'],
    ['EXP-05', 'Collaboration Group', 'Development LMS', '%', 100, 60, 'HG + Learning · milestone', 'min', 'MET-MILE'],
    ['EXP-06', 'Collaboration Group', 'Opening Holywings', '%', 100, null, 'HG + Operations · kesiapan pembukaan', 'min', 'MET-MILE'],
    ['EXP-07', 'Human Growth Expectations', 'Recruitment & Selection', '%', 100, 80, 'HG · pemenuhan permintaan SDM (F4)', 'min', 'MET-FILL'],
    ['EXP-08', 'Human Growth Expectations', 'Therapist Productivity', '%', 100, 90, 'Spa Operations · tamu aktual ÷ target tamu', 'min', 'MET-PROD'],
    ['EXP-09', 'Human Growth Expectations', 'People Development & Talent Pipeline Program', '%', 100, 72, 'HG · program dan pipeline', 'min', 'MET-PIPE'],
    ['EXP-10', 'Human Growth Expectations', 'Talent Readiness', '%', 85, 79, 'HG + pimpinan divisi · asesmen', 'min', 'MET-READY'],
    ['EXP-11', 'Human Growth Expectations', 'Governance & Compliance SDM', 'Dok', 1, 1, 'HG · bukti tata kelola', 'min', 'MET-DOC'],
    ['EXP-12', 'Human Growth Expectations', 'Absenteeism', '%', 100, null, 'Presensi F2 · definisi denominator perlu dikonfirmasi', 'tbc', 'MET-ABS'],
    ['EXP-13', 'Human Growth Expectations', 'Training & Learning Program', '%', 100, 88, 'HG + Learning · pelatihan', 'min', 'MET-TRAIN'],
    ['EXP-14', 'Human Growth Expectations', 'Bisnis Proses', 'Dok', 3, 2, 'HG · dokumen SOP', 'min', 'MET-DOC'],
    ['EXP-15', 'Human Growth Expectations', 'Looker HG', 'Dok', 1, 1, 'HG · laporan reflection', 'min', 'MET-DOC']
  ].map(([id, group, name, unit, target, actual, source, dir, metric, restricted]) => ({ id, group, name, unit, target, actual, source, dir, metric, restricted: !!restricted, period: '2610' }));

  /* ---------- KPI Library (versi awal) ---------- */
  const METRICS = [
    ['MET-UTIL', 'Therapist Utility', 'Therapist', '%', 'min', 'Jam treatment selesai ÷ jam kapasitas reguler', 'Bulanan', 'POS F5 + jadwal F2', 85],
    ['MET-PROD', 'Therapist Productivity', 'Therapist', '%', 'min', 'Tamu aktual ÷ target tamu', 'Bulanan', 'POS (tamu) · Spa Operations', 100],
    ['MET-LEARN', 'Learning Hours', 'Therapist', 'Jam', 'min', 'Jam pelatihan dengan praktik terverifikasi', 'Bulanan', 'Pelatihan F6 · verifikasi Supervisor', 10],
    ['MET-RCONV', 'Konversi Reservasi', 'Receptionist', '%', 'min', 'Check-in ÷ reservasi', 'Bulanan', 'Reservasi/POS (simulasi)', 95],
    ['MET-RACC', 'Akurasi Transaksi', 'Receptionist', '%', 'min', 'Transaksi tanpa koreksi ÷ total transaksi', 'Bulanan', 'POS F5 koreksi', 98],
    ['MET-RRESP', 'Waktu Respons', 'Receptionist', 'Menit', 'max', 'Rata-rata tunggu check-in', 'Bulanan', 'Reservasi (simulasi)', 10],
    ['MET-TURN', 'Turnover', 'HRD/HG', '%', 'max', 'Karyawan keluar ÷ rata-rata headcount', 'Bulanan', 'Direktori F2', 2],
    ['MET-ABS', 'Absenteeism', 'HRD/HG', '%', 'tbc', 'Definisi, arah & denominator perlu konfirmasi (SER vs Race Vegen)', 'Bulanan', 'Presensi F2', null],
    ['MET-QOH', 'Quality of Hire', 'HRD/HG', '%', 'min', 'Review 90 hari "baik" ÷ cohort jatuh tempo yang sudah dinilai', 'Kuartalan', 'Rekrutmen F4 + review 90 hari', 80],
    ['MET-TRAIN', 'Efektivitas Pelatihan', 'HRD/HG', '%', 'min', 'Lulus praktik terverifikasi ÷ peserta hadir yang sudah diverifikasi', 'Bulanan', 'Pelatihan F6', 85],
    ['MET-READY', 'Talent Readiness', 'HRD/HG', '%', 'min', 'Peran kunci dengan suksesor siap ÷ peran kunci', 'Kuartalan', 'Talent pipeline F6', 85],
    ['MET-FILL', 'Pemenuhan Permintaan SDM', 'HRD/HG', '%', 'min', 'Posisi terisi ÷ formasi disetujui', 'Bulanan', 'Rekrutmen F4', 100],
    ['MET-PIPE', 'Program Pipeline', 'HRD/HG', '%', 'min', 'Program berjalan sesuai rencana ÷ program direncanakan', 'Bulanan', 'HG', 100],
    ['MET-RPE', 'Revenue per Employee', 'Executive', 'Rp', 'min', 'Revenue ÷ headcount rata-rata', 'Bulanan', 'Finance (TO VERIFY)', 23000000],
    ['MET-SALR', 'Rasio Biaya Tenaga Kerja', 'Executive', '%', 'max', 'Total people cost ÷ revenue', 'Bulanan', 'Finance + Payroll F7', 25],
    ['MET-MILE', 'Milestone Proyek', 'Collaboration', '%', 'min', 'Milestone selesai ÷ milestone rencana', 'Bulanan', 'Planner F3', 100],
    ['MET-DOC', 'Dokumen Tata Kelola', 'HRD/HG', 'Dok', 'min', 'Dokumen disetujui pada periode', 'Bulanan', 'HG', 1],
    ['MET-FACLOSE', 'Closing Tepat Waktu', 'Finance', 'Hari', 'max', 'Hari kerja sampai closing', 'Bulanan', 'Finance (TO VERIFY)', 5],
    ['MET-PRDOUT', 'Output Produksi Diterima', 'Production', '%', 'min', 'Batch diterima QC ÷ batch rencana', 'Mingguan', 'Produksi Essence (TO VERIFY)', 95]
  ].map(([id, name, fn, unit, dir, formula, freq, source, target]) => ({ id, name, fn, unit, dir, freq, source, versions: [{ v: 1, formula, target, at: '2026-01-05', by: 'Manager HRD', note: 'Versi awal' }] }));
  const COMPS = [['COMP-BAL', 'Balinese Massage'], ['COMP-HOT', 'Hot Stone'], ['COMP-REF', 'Reflexology'], ['COMP-HYG', 'Hygiene & SOP'], ['COMP-SVC', 'Service Excellence']];
  const LEVELS = ['—', 'Dasar', 'Mandiri', 'Mahir', 'Mentor'];
  const NINE = { 'H-H': 'Stars', 'M-H': 'Calon Bintang', 'L-H': 'Potensi Tersembunyi', 'H-M': 'Kinerja Tinggi', 'M-M': 'Kontributor Inti', 'L-M': 'Perlu Arahan', 'H-L': 'Profesional Andal', 'M-L': 'Kontributor Stabil', 'L-L': 'Perlu Perhatian' };
  const WEIGHTS = { 'MET-UTIL': 50, 'MET-PROD': 30, 'MET-LEARN': 20 };

  /* ---------- roster therapist & indeks deterministik ---------- */
  const thrIndex = (hr, emp) => { const pl = H.placementOn(hr, emp); if (!pl || pl.position !== 'POS-THR') return -1; return hr.placements.filter(p => p.location === pl.location && p.position === 'POS-THR' && p.from <= TODAY && (!p.to || p.to >= TODAY)).map(p => p.emp).indexOf(emp); };
  const therapists = (hr, outlet) => H.people(hr, 'hrd').filter(p => p.placement.position === 'POS-THR' && (!outlet || p.placement.location === outlet));

  /* nilai mentah per therapist per periode: null = belum terverifikasi, 0 = nol terverifikasi */
  function raw(hr, emp, period = '2610') {
    const f6 = ensure(hr), pl = H.placementOn(hr, emp); if (!pl || pl.position !== 'POS-THR') return null;
    const i = Math.max(0, thrIndex(hr, emp)), n = Number(emp.slice(4));
    let util, guests, learn;
    if (period === '2610') {
      if (pl.from > '2026-10-31') return { util: null, guests: null, target: 80, learn: null, newHire: true };
      util = OUT_U[pl.location] + ((i % 5) - 2) * 0.03;
      guests = 60 + (i * 7) % 30;
      learn = n % 9 === 4 ? null : n === 41 ? 0 : 6 + (i % 5);
    } else {
      const p5 = P5(); let hours = 0, cap = 0;
      if (p5) { for (const sh of ['Pagi', 'Sore']) { const ms = p5.shiftMembers(hr, pl.location, sh); const crew = ms.filter(m => m.home === pl.location); const m = ms.find(x => x.emp === emp); const c = p5.WEEKLY[pl.location][sh][0] / Math.max(1, crew.length); if (m) { hours += m.hours - m.ot; cap += c; } } }
      util = cap ? hours / cap : null; guests = util === null ? null : Math.round(16 + (i * 3) % 8); learn = null;
    }
    const extra = f6.learnLog.filter(l => l.emp === emp && l.period === period).reduce((s, l) => s + l.hours, 0);
    if (extra) learn = (learn || 0) + extra;
    return { util, guests, target: period === '2610' ? 80 : 20, learn };
  }
  const ach = (actual, target, dir) => actual === null || actual === undefined ? null : dir === 'max' ? (actual === 0 ? 1 : Math.min(1, target / actual)) : target ? Math.min(1, actual / target) : null;
  /* XScore: kontribusi per komponen terukur; cakupan = bobot terukur */
  function xscore(hr, emp, period = '2610') {
    const r = raw(hr, emp, period); if (!r) return null;
    const ctr = contractFor(hr, 'POS-THR', period);
    const W = ctr ? Object.fromEntries(ctr.items.map(it => [it.metric, it.weight])) : WEIGHTS;
    const comps = [
      { metric: 'MET-UTIL', label: 'Utility', actual: r.util, target: 0.85, shown: r.util === null ? null : `${(r.util * 100).toFixed(1)}%`, tgt: '85%', ev: `EVD-POS-${period}-${emp.slice(4)}`, src: 'POS F5' },
      { metric: 'MET-PROD', label: 'Produktivitas', actual: r.guests === null ? null : r.guests / r.target, target: 1, shown: r.guests === null ? null : `${r.guests} / ${r.target} tamu`, tgt: '100%', ev: `EVD-GST-${period}-${emp.slice(4)}`, src: 'POS (tamu)' },
      { metric: 'MET-LEARN', label: 'Learning', actual: r.learn, target: period === '2610' ? 10 : 4, shown: r.learn === null ? null : `${r.learn} jam`, tgt: period === '2610' ? '10 jam' : '4 jam', ev: `EVD-LRN-${period}-${emp.slice(4)}`, src: 'Pelatihan F6' }
    ].map(c => { const a = ach(c.actual, c.target, 'min'); return { ...c, weight: W[c.metric] || 0, ach: a, contrib: a === null ? null : a * (W[c.metric] || 0), status: c.actual === null ? 'Belum terverifikasi' : c.actual === 0 ? 'Nol terverifikasi' : 'Terverifikasi' }; });
    const measured = comps.filter(c => c.ach !== null), cov = measured.reduce((s, c) => s + c.weight, 0);
    const score = cov ? measured.reduce((s, c) => s + c.contrib, 0) / cov * 100 : null;
    const closed = ctr && ctr.status === 'Ditutup';
    const corr = ensure(hr).corrections.filter(c => c.emp === emp && c.period === period);
    return { emp, period, comps, coverage: cov, score, status: score === null ? 'Belum ada data' : closed && cov === 100 ? 'Final' : cov < 100 ? 'Provisional · bukti belum lengkap' : 'Provisional', contract: ctr?.id || null, corrections: corr, simulated: true };
  }
  /* skor tim terhadap target bersama (bukan rata-rata skor personal) */
  function teamScore(hr, outlet, period = '2610') {
    if (period === '2610') { const u = OUT_U[outlet]; return { metric: 'MET-UTIL', actual: u, target: 0.85, ach: Math.min(1, u / 0.85), source: 'Total jam treatment ÷ total kapasitas outlet (Beranda F1)' }; }
    const p5 = P5(); const x = p5 ? p5.outletUtil(hr, outlet) : null; return { metric: 'MET-UTIL', actual: x?.u ?? null, target: 0.85, ach: x ? Math.min(1, x.u / 0.85) : null, source: 'Minggu 46 POS F5' };
  }
  function avgX(hr, list, period = '2610') { const xs = list.map(p => xscore(hr, p.id, period)).filter(x => x && x.score !== null); return { n: xs.length, of: list.length, avg: xs.length ? xs.reduce((s, x) => s + x.score, 0) / xs.length : null, full: xs.filter(x => x.coverage === 100).length }; }

  /* ---------- kompetensi ---------- */
  function competencies(hr, emp) {
    const f6 = ensure(hr), n = Number(emp.slice(4)), pl = H.placementOn(hr, emp) || H.upcomingOf(hr, emp);
    if (!pl || !['POS-THR', 'POS-SPV', 'POS-RCP'].includes(pl.position)) return [];
    const newHire = pl.from > '2026-10-31' && !hr.placements.some(p => p.emp === emp && p.from < pl.from);
    const list = (pl.position === 'POS-RCP' ? [['COMP-SVC', 'Service Excellence'], ['COMP-HYG', 'Hygiene & SOP']] : COMPS).map(([id, name], k) => {
      const base = newHire ? 1 : 1 + ((n + k * 3) % 4); const hist = newHire ? [] : [{ period: '2610', level: base, outlet: hr.placements.find(p => p.emp === emp && p.from <= '2026-10-31' && (!p.to || p.to >= '2026-10-01'))?.location || pl.location, ev: `EVD-CMP-2610-${emp.slice(4)}-${k}`, by: 'Supervisor outlet', note: 'Asesmen periode' }];
      if (!newHire && hr.placements.some(p => p.emp === emp && p.to)) { const old = hr.placements.find(p => p.emp === emp && p.to); hist.unshift({ period: '2609', level: Math.max(1, base - (k % 2)), outlet: old.location, ev: `EVD-CMP-2609-${emp.slice(4)}-${k}`, by: 'Supervisor outlet', note: `Asesmen di ${H.locName(old.location)} sebelum mutasi` }); }
      for (const c of f6.compLog.filter(c => c.emp === emp && c.comp === id)) hist.push(c);
      const cur = hist.length ? hist[hist.length - 1].level : base;
      return { id, name, level: cur, history: hist };
    });
    return list;
  }
  /* ---------- 9-Box ---------- */
  const perfBand = (x) => x === null || x === undefined ? null : x >= 90 ? 'H' : x >= 75 ? 'M' : 'L';
  function potentialOf(hr, emp) { const f6 = ensure(hr); const o = f6.potential.find(p => p.emp === emp); if (o) return o.level; const n = Number(emp.slice(4)); return n % 7 === 3 ? null : ['L', 'M', 'M', 'H'][n % 4]; }
  function nineOf(hr, emp, period = '2610') {
    const f6 = ensure(hr), x = xscore(hr, emp, period), pot = potentialOf(hr, emp);
    const mv = f6.nine.filter(m => m.emp === emp && m.period === period);
    const last = mv[mv.length - 1];
    let perf = x && x.coverage === 100 ? perfBand(x.score) : null;
    let box = perf && pot ? `${perf}-${pot}` : null, why = !x || x.coverage < 100 ? 'Bukti XScore belum lengkap' : !pot ? 'Potensi belum diasesmen' : 'Dari XScore final × asesmen potensi';
    if (last) { box = last.box; why = last.reason; }
    const val = f6.nineVal.filter(v => v.emp === emp && v.period === period && v.box === box);
    return { emp, period, box, label: box ? NINE[box] : 'Belum Dinilai', why, score: x?.score ?? null, coverage: x?.coverage ?? 0, potential: pot, moves: mv, validated: { spv: val.some(v => v.role === 'outlet-spv'), hg: val.some(v => v.role === 'hg-lead') }, final: val.some(v => v.role === 'outlet-spv') && val.some(v => v.role === 'hg-lead') };
  }
  /* ---------- pelatihan & kesiapan ---------- */
  function seedPrograms(hr) {
    const ub = therapists(hr, 'OUT-UBD').map(p => p.id), sh = therapists(hr, 'OUT-SHT').map(p => p.id);
    return [
      { id: 'PRG-HOT-2611', name: 'Pelatihan Hot Stone reguler', kind: 'Rutin', comp: 'COMP-HOT', target: 3, hours: 4, date: '2026-11-10', trainer: 'Human Growth Lead', outlet: 'OUT-UBD', participants: [...ub.slice(0, 6), ...sh.slice(0, 4)].map((e, k) => ({ emp: e, attend: k === 3 ? 'Tidak hadir' : 'Hadir', practice: k < 4 ? (k === 3 ? '—' : 'Lulus') : k === 9 ? 'Belum lulus' : 'Menunggu verifikasi', verifiedBy: k < 3 ? 'Supervisor Spa Ubud' : null, ev: k < 3 || k === 9 ? `EVD-PRC-2611-${String(k + 1).padStart(3, '0')}` : null })), demo: true },
      { id: 'PRG-HYG-2610', name: 'SOP Hygiene v3', kind: 'Rutin', comp: 'COMP-HYG', target: 2, hours: 2, date: '2026-10-15', trainer: 'Staf HRD', outlet: 'OUT-UBD', participants: ub.slice(0, 12).map((e, k) => ({ emp: e, attend: 'Hadir', practice: k === 11 ? 'Belum lulus' : 'Lulus', verifiedBy: 'Supervisor Spa Ubud', ev: `EVD-PRC-2610-${String(k + 1).padStart(3, '0')}` })), demo: true },
      { id: 'PRG-ONB-2611', name: 'Onboarding keterampilan cohort Nov–Des 2026', kind: 'Onboarding', comp: 'COMP-BAL', target: 2, hours: 8, date: '2026-12-01', trainer: 'Human Growth Lead', outlet: 'OUT-UBD', participants: [], cohort: true, demo: true }
    ];
  }
  function programs(hr) { const f6 = ensure(hr); const onb = f6.programs.find(p => p.cohort); if (onb) { const joiners = (hr.f4?.apps || []).filter(a => a.emp).map(a => a.emp); for (const e of joiners) if (!onb.participants.some(x => x.emp === e)) onb.participants.push({ emp: e, attend: 'Terjadwal', practice: 'Menunggu verifikasi', verifiedBy: null, ev: null }); } return f6.programs; }
  function trainingEff(hr) { const ps = programs(hr).flatMap(p => p.participants.filter(x => x.attend === 'Hadir')); const verified = ps.filter(x => ['Lulus', 'Belum lulus'].includes(x.practice)); return { attended: ps.length, verified: verified.length, passed: verified.filter(x => x.practice === 'Lulus').length, rate: verified.length ? verified.filter(x => x.practice === 'Lulus').length / verified.length : null, coverage: ps.length ? verified.length / ps.length : null }; }
  const QOH = [['EMP-0039', 'Baik'], ['EMP-0095', 'Baik'], ['EMP-0151', 'Baik'], ['EMP-0011', 'Perlu pendampingan'], ['EMP-0067', 'Baik'], ['EMP-0123', 'Baik'], ['EMP-0130', null], ['EMP-0046', 'Baik'], ['EMP-0102', 'Baik'], ['EMP-0158', null], ['EMP-0018', 'Perlu pendampingan'], ['EMP-0074', 'Baik']];
  function qoh(hr) { const rows = QOH.map(([emp, r]) => ({ emp, result: r, joined: hr.people.find(p => p.id === emp)?.joined || null })); const rev = rows.filter(r => r.result); const newHires = (hr.f4?.apps || []).filter(a => a.emp).map(a => ({ emp: a.emp, due: a.offer?.start ? addDays(a.offer.start, 90) : null })); return { cohort: 'Rekrutmen Jul–Okt 2025', rows, reviewed: rev.length, pending: rows.length - rev.length, good: rev.filter(r => r.result === 'Baik').length, rate: rev.length ? rev.filter(r => r.result === 'Baik').length / rev.length : null, upcoming: newHires }; }
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  function pipeline(hr) {
    const sup = ['OUT-UBD', 'OUT-SHT', 'OUT-TRL', 'OUT-BSM'];
    return sup.map((o, k) => { const ts = therapists(hr, o); const cands = ts.filter(p => { const n = nineOf(hr, p.id); return n.box && ['H-H', 'M-H', 'H-M'].includes(n.box); }).slice(0, 3); return { role: `Supervisor ${H.locName(o)}`, outlet: o, incumbent: hr.placements.find(p => p.position === 'POS-SPV' && p.leads === o && !p.to)?.emp, candidates: cands.map((c, j) => ({ emp: c.id, ready: j === 0 && k !== 1 ? 'Siap sekarang' : j === 0 ? 'Siap 1–2 tahun' : 'Siap 1–2 tahun' })) }; });
  }
  const readiness = (hr) => { const pl = pipeline(hr); const ready = pl.filter(r => r.candidates.some(c => c.ready === 'Siap sekarang')).length; return { roles: pl.length, ready, rate: ready / pl.length }; };

  /* ---------- kontrak KPI ---------- */
  function seedContracts() {
    const items = (vs) => Object.entries(WEIGHTS).map(([metric, weight]) => ({ metric, weight, version: vs, target: metric === 'MET-UTIL' ? '85%' : metric === 'MET-PROD' ? '100%' : '10 jam' }));
    return [
      { id: 'CTR-2610-THR', name: 'Kontrak KPI Therapist · Oktober 2026', kind: 'Individu', scope: 'POS-THR', period: '2610', items: items(1), status: 'Ditutup', approvals: [{ by: 'Manager HRD', at: '2026-10-01 09:00' }], snapshot: { at: '2026-11-03 10:00', by: 'Manager HRD', versions: { 'MET-UTIL': 1, 'MET-PROD': 1, 'MET-LEARN': 1 }, coverageNote: 'Learning belum terverifikasi untuk sebagian therapist', evidence: 'EVD-POS/GST/LRN-2610-*' }, history: [['2026-09-25', 'Draf dibuat'], ['2026-10-01', 'Disetujui & aktif'], ['2026-11-03', 'Periode ditutup, snapshot disimpan']], demo: true },
      { id: 'CTR-2611-THR', name: 'Kontrak KPI Therapist · November 2026', kind: 'Individu', scope: 'POS-THR', period: '2611', items: items(1).map(i => i.metric === 'MET-LEARN' ? { ...i, target: '4 jam' } : i), status: 'Aktif', approvals: [{ by: 'Manager HRD', at: '2026-11-01 09:00' }], snapshot: null, history: [['2026-10-28', 'Draf dibuat'], ['2026-11-01', 'Disetujui & aktif']], demo: true },
      { id: 'CTR-2611-UBD', name: 'Kontrak tim Spa Ubud · November 2026', kind: 'Tim', scope: 'OUT-UBD', period: '2611', items: [{ metric: 'MET-UTIL', weight: 60, version: 1, target: '85%' }, { metric: 'MET-RCONV', weight: 40, version: 1, target: '95%' }], status: 'Aktif', approvals: [{ by: 'Manager HRD', at: '2026-11-01 09:10' }], snapshot: null, history: [['2026-11-01', 'Disetujui & aktif']], demo: true },
      { id: 'CTR-2612-RCP', name: 'Kontrak KPI Receptionist · Desember 2026', kind: 'Individu', scope: 'POS-RCP', period: '2612', items: [{ metric: 'MET-RCONV', weight: 40, version: 1, target: '95%' }, { metric: 'MET-RACC', weight: 30, version: 1, target: '98%' }, { metric: 'MET-RRESP', weight: 20, version: 1, target: '≤ 10 menit' }], status: 'Draf', approvals: [], snapshot: null, history: [['2026-11-12', 'Draf dibuat · bobot 90%']], demo: true }
    ];
  }
  function contractFor(hr, scope, period) { return ensure(hr).contracts.find(c => c.scope === scope && c.period === period && ['Aktif', 'Ditutup'].includes(c.status)); }
  const weightSum = (c) => c.items.reduce((s, i) => s + Number(i.weight || 0), 0);
  const metricOf = (hr, id) => ensure(hr).metrics.find(m => m.id === id);
  const curVersion = (m) => m.versions[m.versions.length - 1];

  function seed(hr) {
    return { seeded: true, metrics: JSON.parse(JSON.stringify(METRICS)), contracts: seedContracts(), corrections: [], nine: [], nineVal: [], potential: [], plans: [], compLog: [], learnLog: [], programs: seedPrograms(hr), seq: { plan: 0, cor: 0, ev: 0 } };
  }
  function ensure(hr) {
    if (hr.f2 && hr.f2.f6) { hr.f6 = hr.f2.f6; delete hr.f2.f6; }
    if (!hr.f6 || !hr.f6.seeded) { const k = hr.f6; hr.f6 = seed(hr); if (k) for (const key of ['plans', 'nine', 'nineVal', 'corrections']) hr.f6[key].push(...(k[key] || [])); }
    return hr.f6;
  }
  /* cakupan: HG/HRD/Owner semua · OM outlet Spa · Supervisor Ubud · Therapist diri sendiri · Finance tidak */
  function canSee(hr, role, emp) {
    if (['hrd', 'hrd-ops', 'hg-lead', 'owner'].includes(role)) return true;
    if (role === 'therapist') return hr.roleEmp.therapist === emp;
    return H.inScope(hr, role, emp);
  }
  const personalOk = (role) => role !== 'owner';

  function update(state, hr, action, input, ctx) {
    const f6 = ensure(hr), { audit, by, role } = ctx;
    const hg = () => { if (!['owner', 'hrd', 'hg-lead'].includes(role)) throw new Error(`Akses ditolak: ${H.roleDef(role).label} tidak mengelola Human Growth.`); };
    const ctrOf = (id) => { const c = f6.contracts.find(x => x.id === id); if (!c) throw new Error('Kontrak tidak ditemukan.'); return c; };
    switch (action) {
      case 'kpi-version': {
        if (!['hrd', 'hg-lead'].includes(role)) throw new Error('Akses ditolak: perubahan definisi KPI oleh Manager HRD atau HG Lead.');
        const m = metricOf(hr, input.id); if (!m) throw new Error('Metrik tidak dikenal.');
        const formula = String(input.formula || '').trim(); if (formula.length < 8) throw new Error('Rumus minimal 8 karakter.');
        const note = String(input.note || '').trim(); if (note.length < 5) throw new Error('Alasan perubahan minimal 5 karakter.');
        const v = curVersion(m).v + 1; m.versions.push({ v, formula, target: input.target !== undefined && input.target !== '' ? Number(input.target) : curVersion(m).target, at: now(), by, note });
        audit(hr, by, 'Versi KPI baru', `${m.id} v${v} · ${note}`, { object: 'KPI', ref: m.id, before: `v${v - 1}`, after: `v${v}` });
        return `${m.id}-v${v}`;
      }
      case 'ctr-weight': {
        hg(); const c = ctrOf(input.id); if (c.status !== 'Draf') throw new Error('Bobot hanya bisa diubah saat draf.');
        const it = c.items.find(i => i.metric === input.metric); if (!it) throw new Error('Item kontrak tidak ditemukan.');
        const w = Number(input.weight); if (!(w >= 0 && w <= 100)) throw new Error('Bobot 0–100.');
        c.history.push([now(), `Bobot ${it.metric}: ${it.weight}% → ${w}%`]); it.weight = w; return c.id;
      }
      case 'ctr-add': {
        hg(); const c = ctrOf(input.id); if (c.status !== 'Draf') throw new Error('Item hanya bisa ditambah saat draf.');
        const m = metricOf(hr, input.metric); if (!m) throw new Error('Metrik tidak dikenal.'); if (c.items.some(i => i.metric === m.id)) throw new Error('Metrik sudah ada di kontrak.');
        c.items.push({ metric: m.id, weight: Number(input.weight || 0), version: curVersion(m).v, target: String(input.target || curVersion(m).target || '—') }); c.history.push([now(), `Tambah ${m.id} v${curVersion(m).v}`]); return c.id;
      }
      case 'ctr-submit': case 'ctr-activate': {
        hg(); const c = ctrOf(input.id);
        if (weightSum(c) !== 100) throw new Error(`Total bobot ${weightSum(c)}%. Kontrak berbobot harus tepat 100% sebelum diajukan/diaktifkan.`);
        if (action === 'ctr-submit') { if (c.status !== 'Draf') return c.id; c.status = 'Menunggu Persetujuan'; c.history.push([now(), `Diajukan oleh ${by}`]); return c.id; }
        if (c.status === 'Aktif') return c.id;
        if (c.status !== 'Menunggu Persetujuan') throw new Error('Ajukan kontrak sebelum aktivasi.');
        if (!['hrd', 'owner'].includes(role)) throw new Error('Akses ditolak: aktivasi kontrak oleh Manager HRD.');
        c.status = 'Aktif'; c.approvals.push({ by, at: now() }); c.history.push([now(), `Disetujui & aktif oleh ${by}`]);
        audit(hr, by, 'Aktivasi kontrak KPI', `${c.id} · ${c.items.map(i => `${i.metric} v${i.version} ${i.weight}%`).join(', ')}`, { object: 'KPI', ref: c.id });
        return c.id;
      }
      case 'ctr-close': {
        if (!['hrd', 'owner'].includes(role)) throw new Error('Akses ditolak: penutupan periode oleh Manager HRD.');
        const c = ctrOf(input.id); if (c.status === 'Ditutup') return c.id; if (c.status !== 'Aktif') throw new Error('Hanya kontrak aktif yang bisa ditutup.');
        const list = c.scope === 'POS-THR' ? therapists(hr) : [];
        const xs = list.map(p => xscore(hr, p.id, c.period)).filter(Boolean);
        const pending = xs.filter(x => x.coverage < 100).length;
        if (pending && input.ack !== '1') throw new Error(`${pending} scorecard bukti belum lengkap. Tinjau dulu atau centang "tutup dengan catatan".`);
        c.status = 'Ditutup'; c.snapshot = { at: now(), by, versions: Object.fromEntries(c.items.map(i => [i.metric, i.version])), values: Object.fromEntries(xs.map(x => [x.emp, Math.round(x.score * 10) / 10])), coverageNote: pending ? `${pending} scorecard ditutup dengan bukti belum lengkap` : 'Semua bukti lengkap', evidence: `EVD-*-${c.period}-*` };
        c.history.push([now(), `Periode ditutup oleh ${by} · snapshot ${xs.length} scorecard`]);
        audit(hr, by, 'Tutup periode KPI', `${c.id} · ${xs.length} scorecard · ${c.snapshot.coverageNote}`, { object: 'KPI', ref: c.id });
        return c.id;
      }
      case 'ctr-correct': {
        const emp = input.emp; if (!canSee(hr, role, emp) || role === 'finance-manager') throw new Error('Akses ditolak.');
        const c = ctrOf(input.id); if (c.status !== 'Ditutup') throw new Error('Koreksi setelah penutupan; sebelum penutupan perbarui bukti langsung.');
        const reason = String(input.reason || '').trim(); if (reason.length < 10) throw new Error('Alasan koreksi minimal 10 karakter.');
        const dup = f6.corrections.find(x => x.emp === emp && x.contract === c.id && x.metric === input.metric && x.status === 'Menunggu Review'); if (dup) return dup.id;
        const id = `KOR-${c.period}-${String(++f6.seq.cor).padStart(3, '0')}`;
        f6.corrections.push({ id, emp, contract: c.id, period: c.period, metric: input.metric || 'MET-LEARN', value: input.value === '' || input.value === undefined ? null : Number(input.value), reason, by, at: now(), status: 'Menunggu Review', reviewer: null, demo: true });
        audit(hr, by, 'Ajukan koreksi KPI', `${id} · ${emp} · ${c.id}`, { object: 'KPI', ref: id });
        return id;
      }
      case 'ctr-correct-review': {
        if (!['hrd', 'hg-lead'].includes(role)) throw new Error('Akses ditolak: review koreksi oleh Manager HRD atau HG Lead.');
        const k = f6.corrections.find(x => x.id === input.id); if (!k) throw new Error('Koreksi tidak ditemukan.'); if (k.status !== 'Menunggu Review') return k.id;
        k.status = input.decision === 'reject' ? 'Ditolak' : 'Diterima'; k.reviewer = by; k.reviewedAt = now();
        if (k.status === 'Diterima' && k.metric === 'MET-LEARN' && k.value !== null) f6.learnLog.push({ emp: k.emp, period: k.period, hours: k.value - (raw(hr, k.emp, k.period)?.learn || 0), ev: k.id, src: 'Koreksi setelah penutupan' });
        audit(hr, by, 'Review koreksi KPI', `${k.id} · ${k.status}`, { object: 'KPI', ref: k.id, after: k.status });
        return k.id;
      }
      case 'nine-move': {
        if (!['hrd', 'hg-lead', 'outlet-spv'].includes(role)) throw new Error('Akses ditolak: penempatan 9-Box oleh HG atau Supervisor.');
        if (!canSee(hr, role, input.emp)) throw new Error('Akses ditolak: di luar cakupan.');
        if (!NINE[input.box]) throw new Error('Kotak 9-Box tidak dikenal.');
        const reason = String(input.reason || '').trim(); if (reason.length < 10) throw new Error('Alasan perpindahan minimal 10 karakter.');
        const before = nineOf(hr, input.emp, input.period || '2610');
        f6.nine.push({ emp: input.emp, period: input.period || '2610', box: input.box, from: before.box, reason, by, role, at: now() });
        audit(hr, by, 'Pindah 9-Box', `${input.emp}: ${before.label} → ${NINE[input.box]} · ${reason}`, { object: '9-Box', ref: input.emp, before: before.label, after: NINE[input.box] });
        return input.emp;
      }
      case 'nine-validate': {
        if (!['hg-lead', 'outlet-spv'].includes(role)) throw new Error('Validasi 9-Box oleh Supervisor dan Human Growth Lead.');
        if (!canSee(hr, role, input.emp)) throw new Error('Akses ditolak: di luar cakupan.');
        const n = nineOf(hr, input.emp, input.period || '2610'); if (!n.box) throw new Error('Belum Dinilai: lengkapi bukti sebelum validasi.');
        if (!f6.nineVal.some(v => v.emp === input.emp && v.period === n.period && v.box === n.box && v.role === role)) f6.nineVal.push({ emp: input.emp, period: n.period, box: n.box, role, by, at: now() });
        return input.emp;
      }
      case 'potential-set': {
        if (!['hg-lead', 'hrd'].includes(role)) throw new Error('Akses ditolak: asesmen potensi oleh HG.');
        if (!['L', 'M', 'H'].includes(input.level)) throw new Error('Level potensi L/M/H.');
        f6.potential = f6.potential.filter(p => p.emp !== input.emp); f6.potential.push({ emp: input.emp, level: input.level, by, at: now(), ev: `EVD-POT-${input.emp.slice(4)}` });
        return input.emp;
      }
      case 'plan-create': {
        if (!['hrd', 'hrd-ops', 'hg-lead', 'outlet-spv'].includes(role)) throw new Error('Akses ditolak: rencana pengembangan oleh HG, HRD atau Supervisor.');
        const emp = input.emp; if (!canSee(hr, role, emp)) throw new Error('Akses ditolak: di luar cakupan.');
        const comp = input.comp || 'COMP-HOT', cname = (COMPS.find(c => c[0] === comp) || [comp, comp])[1];
        const key = `DEV-${emp}-${comp}`;
        const dup = f6.plans.find(p => p.key === key && p.status !== 'Selesai'); if (dup) return dup.id;
        const id = `PLAN-${String(++f6.seq.plan).padStart(4, '0')}`;
        const cur = competencies(hr, emp).find(c => c.id === comp)?.level || 1, target = Number(input.target || Math.min(4, cur + 1));
        const mentor = input.mentor || 'EMP-0145', due = input.due || addDays(TODAY, 30);
        const task = H.EXT.update(state, hr, 'task-create', { ws: 'HG', stage: 'Workplan', title: `Coaching ${cname} · ${(hr.people.find(p => p.id === emp) || {}).name || emp}`, scope: H.placementOn(hr, emp)?.location || 'ENT-SPA', sourceId: key, sourceType: input.from === 'ninebox' ? '9-Box' : 'Profil Kompetensi', sourceLabel: `Gap ${cname}: level ${cur} → ${target}`, sourceRoute: `hrd-dev?id=${id}`, finding: key, pic: mentor, due }, { ...ctx, role: ['hrd', 'hg-lead', 'owner'].includes(role) ? role : 'hg-lead' });
        f6.plans.push({ id, key, emp, comp, from: cur, target, mentor, due, activity: input.activity || 'Pendampingan praktik 2× per minggu', task, evidence: [], status: 'Berjalan', source: input.from || 'profil', by, at: now(), demo: true });
        audit(hr, by, 'Rencana pengembangan', `${id} · ${emp} · ${cname} ${cur} → ${target} · ${task}`, { object: 'Human Growth', ref: id });
        return id;
      }
      case 'plan-evidence': {
        const p = f6.plans.find(x => x.id === input.id); if (!p) throw new Error('Rencana tidak ditemukan.');
        if (!['hrd', 'hg-lead', 'outlet-spv'].includes(role)) throw new Error('Akses ditolak.');
        const note = String(input.note || '').trim(); if (note.length < 5) throw new Error('Catatan coaching minimal 5 karakter.');
        const ev = `EVD-COA-${String(++f6.seq.ev).padStart(4, '0')}`; p.evidence.push({ id: ev, note, by, at: now(), sensitive: input.sensitive === '1' });
        return ev;
      }
      case 'train-verify': {
        if (!['outlet-spv', 'hg-lead', 'hrd'].includes(role)) throw new Error('Akses ditolak: verifikasi praktik oleh Supervisor atau HG.');
        const prg = programs(hr).find(x => x.id === input.id); if (!prg) throw new Error('Program tidak ditemukan.');
        const pt = prg.participants.find(x => x.emp === input.emp); if (!pt) throw new Error('Peserta tidak terdaftar.');
        if (!canSee(hr, role, pt.emp)) throw new Error('Akses ditolak: di luar cakupan.');
        if (pt.attend !== 'Hadir' && input.attend !== '1') throw new Error('Peserta belum tercatat hadir.');
        if (input.attend === '1') pt.attend = 'Hadir';
        if (['Lulus', 'Belum lulus'].includes(pt.practice) && pt.ev) return pt.ev;
        const result = input.result === 'fail' ? 'Belum lulus' : 'Lulus';
        const ev = `EVD-PRC-${prg.id.slice(4)}-${String(++f6.seq.ev).padStart(4, '0')}`;
        pt.practice = result; pt.verifiedBy = by; pt.ev = ev; pt.at = now();
        if (result === 'Lulus') {
          const cur = competencies(hr, pt.emp).find(c => c.id === prg.comp)?.level || 1;
          if (cur < prg.target) f6.compLog.push({ emp: pt.emp, comp: prg.comp, period: '2611', level: prg.target, outlet: H.placementOn(hr, pt.emp)?.location, ev, by, note: `Lulus praktik ${prg.name}` });
          f6.learnLog.push({ emp: pt.emp, period: '2611', hours: prg.hours, ev, src: prg.name });
        }
        audit(hr, by, 'Verifikasi praktik', `${prg.id} · ${pt.emp} · ${result} · ${ev}`, { object: 'Human Growth', ref: ev });
        return ev;
      }
      default: return undefined;
    }
  }
  const prev = { ...H.EXT };
  H.EXT.update = (state, hr, action, input, ctx) => { const r = update(state, hr, action, input, ctx); return r !== undefined ? r : prev.update(state, hr, action, input, ctx); };
  H.EXT.purge = (hr) => { prev.purge?.(hr); if (hr.f6) { delete hr.f6; } };
  H.EXT.keep = (hr) => { const k = prev.keep?.(hr) || {}; if (hr.f6) k.f6 = { seeded: false, plans: hr.f6.plans.filter(p => !p.demo), nine: [], nineVal: [], corrections: hr.f6.corrections.filter(c => !c.demo) }; return k; };
  H.EXT.ensure = (hr) => { if (hr.f2 && hr.f2.f6) { hr.f6 = hr.f2.f6; delete hr.f2.f6; } prev.ensure?.(hr); ensure(hr); };
  H.EXT.xscore = (hr, emp, period) => xscore(hr, emp, period);
  return { PERIODS, SER, COMPS, LEVELS, NINE, WEIGHTS, ensure, raw, xscore, teamScore, avgX, therapists, competencies, nineOf, potentialOf, programs, trainingEff, qoh, pipeline, readiness, contractFor, weightSum, metricOf, curVersion, canSee, personalOk, ach, addDays };
})();
if (typeof module !== 'undefined') module.exports = HR6;
