/* HAWK ERP · Portal HRD · model F7 Payroll & People Budgeting — DATA DEMO / SIMULASI.
   Komponen diturunkan dari take-home pay dummy F1 (Oktober = kalibrasi: THP Oktober = THP roster).
   Komisi dari baris layanan POS F5 (Service Line ID), aturan berversi dengan periode efektif, batch payroll draf → review → kunci (snapshot),
   slip & status bayar (Siap Bayar ≠ Sudah Bayar), kasbon/reimburse dengan ledger, laporan 19 entri, handoff jurnal Finance (Batch ID stabil),
   anggaran tahunan, simulasi rekrutmen & kurva S. Tarif pajak/BPJS: versi aturan simulasi. Memperluas HR.EXT. Tanpa jaringan. */
const HR7 = (() => {
  const H = (typeof HR !== 'undefined') ? HR : require('./hrd-model.js');
  const P5 = () => (typeof HR5 !== 'undefined' ? HR5 : null);
  const P6 = () => (typeof HR6 !== 'undefined' ? HR6 : null);
  const TODAY = H.TODAY;
  const now = () => `${TODAY} ${new Date().toTimeString().slice(0, 5)}`;
  const R = (x) => Math.round(x);
  const PERIODS = { 2610: { label: 'Oktober 2026', from: '2026-10-01', to: '2026-10-31', days: 31 }, 2611: { label: 'November 2026', from: '2026-11-01', to: '2026-11-30', days: 30 } };
  const OUT_U = { 'OUT-UBD': 5512 / 5200, 'OUT-SHT': 0.66, 'OUT-TRL': 0.84, 'OUT-BSM': 0.78 };

  /* ---------- aturan payroll berversi ---------- */
  const RULES0 = [
    ['RUL-GAPOK', 'Gaji pokok', 'Pendapatan', 'Sesuai kontrak (kalibrasi dari THP roster)', null, '6101 Beban Gaji'],
    ['RUL-TUNJ', 'Tunjangan transport & makan', 'Pendapatan', 'Staf Rp700.000 · Supervisor/Manager Rp1.200.000 per bulan', 700000, '6102 Beban Tunjangan'],
    ['RUL-KOM', 'Komisi layanan therapist', 'Pendapatan', 'Rp per jam layanan selesai (dibayar), dibagi sesuai alokasi durasi Four Hands', 5000, '6103 Beban Komisi'],
    ['RUL-LBR', 'Lembur', 'Pendapatan', 'Jam lembur disetujui × (gaji pokok ÷ 173) × 1,5', 1.5, '6104 Beban Lembur'],
    ['RUL-THR', 'THR', 'Pendapatan', 'Prorata masa kerja ÷ 12 × (gaji pokok + tunjangan tetap); dibayar Maret', null, '6102 Beban Tunjangan'],
    ['RUL-PRO', 'Prorata', 'Pengali', 'Hari kalender aktif ÷ hari kalender periode', null, '—'],
    ['RUL-BPJS', 'BPJS karyawan & perusahaan', 'Potongan', 'Karyawan: Kes 1%, JHT 2%, JP 1% · Perusahaan: Kes 4%, JKK 0,24%, JKM 0,3%, JHT 3,7%, JP 2%', null, '2103 Utang BPJS / 6105 Beban BPJS'],
    ['RUL-PPH', 'PPh 21 (TER simulasi)', 'Potongan', 'Bruto ≤ Rp5,4 jt 0% · ≤ Rp6,2 jt 0,5% · ≤ Rp7,5 jt 1,5% · ≤ Rp9 jt 2,5% · di atas 3,5% (SIMULASI, bukan tarif resmi)', null, '2102 Utang PPh 21'],
    ['RUL-KSB', 'Cicilan kasbon', 'Potongan', 'Sesuai jadwal cicilan pada ledger kasbon', null, '1104 Piutang Karyawan'],
    ['RUL-RMB', 'Reimburse via payroll', 'Pendapatan', 'Reimburse disetujui yang belum diselesaikan di kanal lain', null, '6106 Beban Reimburse']
  ].map(([id, name, kind, formula, value, coa]) => ({ id, name, kind, coa, versions: [{ v: 1, from: '2610', formula, value, by: 'Manager HRD', at: '2026-01-05', note: 'Versi awal (simulasi)' }] }));
  const ruleAt = (f7, id, period) => { const r = f7.rules.find(x => x.id === id); const vs = r.versions.filter(v => v.from <= String(period)); return vs[vs.length - 1] || r.versions[0]; };
  const pphRate = (gross) => gross <= 5.4e6 ? 0 : gross <= 6.2e6 ? 0.005 : gross <= 7.5e6 ? 0.015 : gross <= 9e6 ? 0.025 : 0.035;

  /* ---------- aktivitas therapist per periode ---------- */
  function thrIdx(hr, emp) { const pl = H.placementOn(hr, emp, '2026-10-31') || H.placementOn(hr, emp); if (!pl || pl.position !== 'POS-THR') return -1; return hr.placements.filter(p => p.location === pl.location && p.position === 'POS-THR' && !p.to).map(p => p.emp).indexOf(emp); }
  /* baris komisi: Oktober = ringkasan bulan (fixture), November = baris POS F5 Minggu 46 */
  function commissionLines(hr, period) {
    const f7 = ensure(hr), rule = ruleAt(f7, 'RUL-KOM', period);
    if (String(period) === '2610') return [];
    const p5 = P5(); if (!p5) return [];
    return p5.lines(hr).map(l => {
      const eligible = l.status === 'Selesai' && l.pay !== 'Refund';
      return { id: `KOM-${l.line}`, line: l.line, tx: l.tx, emp: l.emp, outlet: l.outlet, home: l.home, date: l.date, dur: l.dur, svc: l.svc, four: !!l.alloc, rule: `RUL-KOM v${rule.v}`, rate: rule.value, amount: eligible ? R(l.dur / 60 * rule.value) : 0, status: l.status === 'Batal' ? 'Batal · tidak berkomisi' : l.pay === 'Refund' ? `Refund ${l.refund} · dibalik` : l.corrected ? `Dikoreksi ${l.corrected}` : 'Memenuhi syarat', refund: l.refund || null, corrected: l.corrected || null };
    });
  }
  function activity(hr, emp, period) {
    const pl = H.placementOn(hr, emp, PERIODS[period].to) || H.placementOn(hr, emp);
    if (!pl || pl.position !== 'POS-THR') return { hours: 0, comm: 0, ot: 0, src: null };
    const f7 = ensure(hr), rule = ruleAt(f7, 'RUL-KOM', period);
    if (String(period) === '2610') { const i = Math.max(0, thrIdx(hr, emp)), u = OUT_U[pl.location] + ((i % 5) - 2) * 0.03; const hours = Math.round(u * 208); return { hours, comm: R(hours * rule.value), ot: pl.location === 'OUT-UBD' && i % 5 === 0 ? 4 : 0, src: `Ringkasan POS Oktober (ditutup) · ${hours} jam`, lines: null }; }
    const ls = commissionLines(hr, period).filter(c => c.emp === emp);
    const otH = (P5()?.lines(hr) || []).filter(l => l.emp === emp && l.ot && l.status === 'Selesai').reduce((s, l) => s + l.dur / 60, 0);
    return { hours: ls.filter(c => c.amount > 0).reduce((s, c) => s + c.dur / 60, 0), comm: ls.reduce((s, c) => s + c.amount, 0), ot: otH, src: `POS F5 Minggu 46 (provisional) · ${ls.length} baris`, lines: ls.length };
  }
  /* kalibrasi gaji pokok dari THP Oktober */
  const baseCache = new Map();
  function baseOf(hr, emp) {
    const p = hr.people.find(x => x.id === emp); if (!p) return 0;
    const key = `${emp}:${p.thp}`; if (baseCache.has(key)) return baseCache.get(key);
    const allow = ['manager', 'supervisor'].includes(p.level) ? 1200000 : 700000;
    const f7 = ensure(hr), act = activity(hr, emp, '2610');
    let base = p.thp * 0.8;
    for (let k = 0; k < 8; k++) { const ot = act.ot * base / 173 * 1.5, gross = base + allow + act.comm + ot, ded = base * 0.03 + Math.min(base + allow, 12e6) * 0.01, pph = gross * pphRate(gross); base = p.thp - allow - act.comm - ot + ded + pph; }
    base = Math.round(base / 1000) * 1000; baseCache.set(key, base); return base;
  }

  /* ---------- perhitungan slip ---------- */
  function slip(hr, emp, period) {
    period = String(period); const f7 = ensure(hr), P = PERIODS[period]; const p = hr.people.find(x => x.id === emp); if (!p) return null;
    const pl = H.placementOn(hr, emp, P.to) || (H.placementOn(hr, emp, P.from)); if (!pl) { const up = H.upcomingOf(hr, emp, P.to); return up ? { emp, period, excluded: `Mulai ${up.from} (di luar periode)` } : null; }
    const start = pl.from > P.from && !hr.placements.some(x => x.emp === emp && x.from < pl.from) ? pl.from : P.from;
    const days = (new Date(P.to) - new Date(start)) / 864e5 + 1, pro = Math.min(1, days / P.days);
    const allowV = ruleAt(f7, 'RUL-TUNJ', period).value, allow = R((['manager', 'supervisor'].includes(p.level) ? allowV + 500000 : allowV) * pro);
    const base = R(baseOf(hr, emp) * pro), act = activity(hr, emp, period), otMult = ruleAt(f7, 'RUL-LBR', period).value;
    const ot = R(act.ot * baseOf(hr, emp) / 173 * otMult);
    const rmb = f7.reimburse.filter(r => r.emp === emp && r.status === 'Disetujui' && r.period === period && !r.settledOther).reduce((s, r) => s + r.amount, 0);
    const adjIn = adjustments(hr).filter(a => a.emp === emp && a.toPeriod === period).reduce((s, a) => s + a.amount, 0);
    const earnings = [['Gaji pokok', base, 'RUL-GAPOK', pro < 1 ? `prorata ${days}/${P.days} hari` : 'kontrak F2'], ['Tunjangan', allow, 'RUL-TUNJ', ''], ['Komisi', act.comm, 'RUL-KOM', act.src || ''], ['Lembur', ot, 'RUL-LBR', act.ot ? `${Math.round(act.ot * 10) / 10} jam disetujui` : ''], ['Reimburse', rmb, 'RUL-RMB', rmb ? f7.reimburse.filter(r => r.emp === emp && r.period === period && r.status === 'Disetujui' && !r.settledOther).map(r => r.id).join(', ') : ''], ['Penyesuaian periode lalu', adjIn, 'ADJ', adjIn ? adjustments(hr).filter(a => a.emp === emp && a.toPeriod === period).map(a => a.id).join(', ') : '']].filter(e => e[1] !== 0 || ['Gaji pokok', 'Tunjangan'].includes(e[0]));
    const gross = earnings.reduce((s, e) => s + e[1], 0);
    const bpjsK = R(base * 0.03 + Math.min(base + allow, 12e6) * 0.01), pph = R(gross * pphRate(gross));
    const inst = f7.advances.flatMap(a => a.schedule.filter(s => s.period === period && a.emp === emp && a.status === 'Dicairkan').map(s => [s.id, s.amount]));
    const ded = [['BPJS karyawan (Kes 1%, JHT 2%, JP 1%)', bpjsK, 'RUL-BPJS', ''], ['PPh 21 (TER simulasi)', pph, 'RUL-PPH', `${(pphRate(gross) * 100).toFixed(1)}% × bruto`], ...inst.map(([id, a]) => [`Cicilan kasbon ${id}`, a, 'RUL-KSB', id])].filter(d => d[1] !== 0 || d[2] === 'RUL-BPJS');
    const dedT = ded.reduce((s, d) => s + d[1], 0);
    let thp = gross - dedT, round = 0;
    if (period === '2610' && pro === 1) { round = p.thp - thp; if (Math.abs(round) <= 2000 && round !== 0) { earnings.push(['Pembulatan', round, 'RUL-GAPOK', 'kalibrasi THP roster']); thp += round; } else round = 0; }
    const employer = R(base * (0.04 + 0.0024 + 0.003 + 0.037 + 0.02));
    return { emp, period, name: p.name, loc: pl.location, pos: pl.position, division: pl.division, entity: pl.entity, earnings, ded, gross: gross + round, dedT, thp, employer, cost: gross + round + employer, pro, versions: Object.fromEntries(f7.rules.map(r => [r.id, ruleAt(f7, r.id, period).v])) };
  }
  /* ---------- batch ---------- */
  const batchId = (period) => `PAY-${period}-01`;
  function batchOf(hr, period) { return ensure(hr).batches.find(b => b.period === String(period)); }
  function batchLines(hr, period) { const b = batchOf(hr, period); if (b && b.snapshot) return b.snapshot.lines; return hr.people.map(p => slip(hr, p.id, period)).filter(s => s && !s.excluded); }
  function excluded(hr, period) { return hr.people.map(p => slip(hr, p.id, period)).filter(s => s && s.excluded); }
  function totals(lines) { const t = { n: lines.length, gross: 0, ded: 0, thp: 0, employer: 0, cost: 0, comm: 0, base: 0, allow: 0, ot: 0, bpjs: 0, pph: 0, ksb: 0, rmb: 0, adj: 0 }; for (const l of lines) { t.gross += l.gross; t.ded += l.dedT; t.thp += l.thp; t.employer += l.employer; t.cost += l.cost; for (const [n, v, r] of l.earnings) { if (r === 'RUL-KOM') t.comm += v; if (r === 'RUL-GAPOK' && n === 'Gaji pokok') t.base += v; if (r === 'RUL-TUNJ') t.allow += v; if (r === 'RUL-LBR') t.ot += v; if (r === 'RUL-RMB') t.rmb += v; if (r === 'ADJ') t.adj += v; } for (const [, v, r] of l.ded) { if (r === 'RUL-BPJS') t.bpjs += v; if (r === 'RUL-PPH') t.pph += v; if (r === 'RUL-KSB') t.ksb += v; } } return t; }
  function anomalies(hr, period) {
    const ls = batchLines(hr, period), out = [];
    for (const l of ls) { const p = hr.people.find(x => x.id === l.emp); if (String(period) !== '2610' && p && Math.abs(l.thp - p.thp) / p.thp > 0.2) out.push({ emp: l.emp, kind: 'THP berubah > 20% vs Oktober', detail: `${H.locName(l.loc)} · ${Math.round((l.thp - p.thp) / p.thp * 100)}%` }); if (l.pro < 1) out.push({ emp: l.emp, kind: 'Prorata karyawan baru', detail: `${Math.round(l.pro * 100)}% periode` }); }
    const refunds = commissionLines(hr, period).filter(c => c.refund); for (const c of refunds) out.push({ emp: c.emp, kind: 'Komisi dibalik karena refund', detail: `${c.line} · ${c.refund}` });
    return out;
  }
  const sources = (hr, period) => String(period) === '2610' ? [['POS Oktober', 'Lengkap', 'ready'], ['Presensi & lembur F2', 'Disetujui', 'ready'], ['Kontrak & penempatan F2', 'Lengkap', 'ready'], ['Kasbon/Reimburse', 'Lengkap', 'ready']] : [['POS November', 'Sebagian · 7–13 Nov (provisional)', 'sandbox'], ['Presensi & lembur F2', 'Sampai 13 Nov', 'sandbox'], ['Kontrak & penempatan F2', 'Lengkap', 'ready'], ['Kasbon/Reimburse', `${ensure(hr).reimburse.filter(r => r.status === 'Diajukan').length} menunggu keputusan`, ensure(hr).reimburse.some(r => r.status === 'Diajukan') ? 'sandbox' : 'ready']];
  /* koreksi terlambat: refund/koreksi POS setelah kunci → adjustment ke periode berikut, merujuk baris asal */
  function adjustments(hr) {
    const f7 = ensure(hr), out = [], p5 = P5(); if (!p5 || !hr.f5) return out;
    for (const b of f7.batches.filter(x => x.snapshot && x.period === '2611')) {
      const rate = ruleAt(f7, 'RUL-KOM', b.period).value;
      for (const r of hr.f5.refunds.filter(x => !(b.snapshot.refunds || []).includes(x.id))) { const l = p5.lines(hr).find(x => x.line === r.line); if (l) out.push({ id: `ADJ-${r.id}`, emp: l.emp, fromPeriod: b.period, toPeriod: '2612', amount: -R(l.dur / 60 * rate), ref: l.line, tx: l.tx, reason: `Refund ${r.id} setelah ${b.id} dikunci`, rule: `RUL-KOM v${ruleAt(f7, 'RUL-KOM', b.period).v}` }); }
    }
    return out;
  }
  /* ---------- kasbon & reimburse ---------- */
  function seedAdv() { return [{ id: 'KSB-2611-001', emp: 'EMP-0003', amount: 1500000, reason: 'Biaya sekolah anak', status: 'Dicairkan', approvedBy: 'Manager HRD', disbursed: '2026-11-02', schedule: [['2611', 500000], ['2612', 500000], ['2701', 500000]].map(([p, a], k) => ({ id: `KSB-2611-001-C${k + 1}`, period: p, amount: a })), demo: true }]; }
  function seedRmb() { return [{ id: 'RMB-2611-001', emp: 'EMP-0005', amount: 250000, kind: 'Transport pelatihan Hot Stone', period: '2611', status: 'Disetujui', settledOther: false, proof: 'struk-transport.pdf', demo: true }, { id: 'RMB-2611-002', emp: 'EMP-0026', amount: 180000, kind: 'Bahan praktik', period: '2611', status: 'Disetujui', settledOther: 'Kas kecil outlet KK-UBD-1107', proof: 'nota-bahan.jpg', demo: true }, { id: 'RMB-2611-003', emp: 'EMP-0031', amount: 120000, kind: 'Parkir kunjungan klien', period: '2611', status: 'Diajukan', settledOther: false, proof: 'parkir.jpg', demo: true }]; }
  function ledger(hr, emp) { const f7 = ensure(hr); const rows = []; for (const a of f7.advances.filter(x => !emp || x.emp === emp)) { if (a.status === 'Dicairkan') rows.push({ ref: a.id, emp: a.emp, date: a.disbursed, kind: 'Pencairan kasbon', debit: a.amount, credit: 0 }); for (const s of a.schedule) { const b = batchOf(hr, s.period); const used = b && b.snapshot && b.snapshot.lines.some(l => l.emp === a.emp && l.ded.some(d => d[3] === s.id)); if (used) rows.push({ ref: s.id, emp: a.emp, date: b.snapshot.at.slice(0, 10), kind: `Cicilan via ${b.id}`, debit: 0, credit: s.amount }); } } let bal = 0; return rows.map(r => ({ ...r, balance: (bal += r.debit - r.credit) })); }

  /* ---------- anggaran & people budgeting ---------- */
  const SEASON = [0.85, 0.8, 0.9, 0.95, 1, 1.1, 1.2, 1.25, 1.05, 1, 0.95, 1.15];
  const REV_OCT = { 'OUT-UBD': 850e6, 'OUT-SHT': 480e6, 'OUT-TRL': 650e6, 'OUT-BSM': 570e6 };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function costMonth(hr, m, scope) {
    /* biaya Oktober dari batch; bulan lain mengikuti komisi musiman (komisi ~ revenue), gaji tetap */
    const ls = batchLines(hr, '2610').filter(l => !scope || scope === 'all' || l.loc === scope || l.division === scope);
    const t = totals(ls), fixed = t.cost - t.comm - t.ot, varc = t.comm + t.ot;
    return fixed + varc * SEASON[m] / SEASON[9];
  }
  function budgetYear(hr, scope = 'all', year = 2026) {
    const f7 = ensure(hr), ratio = f7.budget.ratio;
    const outs = scope === 'all' ? Object.keys(REV_OCT) : REV_OCT[scope] ? [scope] : [];
    const yf = year === 2025 ? 0.92 : 1;
    const revPlan = (m) => outs.reduce((s, o) => s + REV_OCT[o] / SEASON[9] * SEASON[m], 0) * (year === 2025 ? 0.88 : 1);
    const revAct = (m) => m <= 9 || year === 2025 ? revPlan(m) * (1 + (((m * 7) % 5) - 2) * 0.02) : null;
    const share = scope === 'all' ? 1 : REV_OCT[scope] ? REV_OCT[scope] / Object.values(REV_OCT).reduce((a, b) => a + b, 0) : 0;
    const office = (m) => { const ls = batchLines(hr, '2610').filter(l => l.loc === H.HQ.id); return totals(ls).cost * share; };
    const direct = (m) => { const ls = batchLines(hr, '2610').filter(l => outs.includes(l.loc)); const t = totals(ls); return (t.cost - t.comm - t.ot + (t.comm + t.ot) * SEASON[m] / SEASON[9]) * yf; };
    const nov = batchOf(hr, '2611');
    const extra = (m) => f7.scenarios.filter(s => s.status === 'Disetujui' && (scope === 'all' || s.outlet === scope)).reduce((s, sc) => s + (sc.monthly[m] || 0), 0);
    return MONTHS.map((name, m) => {
      const plan = revPlan(m), act = revAct(m), cost = direct(m) + office(m) * yf;
      const closed = year === 2025 || m <= 9, prov = year === 2026 && m === 10;
      return { m, name, revPlan: plan, rev: closed ? act : prov ? plan * 0.97 : null, revForecast: closed ? act : plan, budget: plan * ratio, cost: closed ? cost : null, costProv: prov ? cost + extra(m) : null, forecast: closed ? cost : cost + extra(m), office: office(m) * yf, status: closed ? 'Aktual (ditutup)' : prov ? `Provisional · data sampai ${TODAY}` : 'Forecast' };
    });
  }
  function ratios(rows, hc) { const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0); const rev = sum('revForecast'), cost = sum('forecast'); return { rev, cost, ratio: rev ? cost / rev : null, budget: sum('budget'), room: sum('budget') - cost, perEmp: hc ? cost / hc / rows.length : null, revPerEmp: hc ? rev / hc / rows.length : null }; }

  function seed(hr) {
    return { seeded: true, rules: JSON.parse(JSON.stringify(RULES0)), batches: [{ id: batchId('2610'), period: '2610', version: 3, status: 'Dikunci', reviewer: 'Manager HRD', approvedAt: '2026-10-29 15:00', snapshot: null, payments: {}, handoff: { id: 'JRN-PAY-2610-01', status: 'Diterima Finance', sent: '2026-10-30 09:00', ack: '2026-10-30 14:10', attempts: 1, variance: 0 }, history: [['2026-10-25 10:00', 'Draf dibuat'], ['2026-10-27 16:00', 'Regenerasi v2: lembur disetujui'], ['2026-10-28 11:00', 'Regenerasi v3: kasbon'], ['2026-10-29 15:00', 'Disetujui & dikunci Manager HRD']], demo: true }], advances: seedAdv(), reimburse: seedRmb(), budget: { id: 'BUD-2026-v1', ratio: 0.25, upper: 0.30, by: 'Manager HRD', at: '2026-01-10' }, scenarios: [], seq: { sim: 0, ksb: 1, rmb: 3, pay: 0 } };
  }
  let building = false;
  function ensure(hr) {
    if (hr.f2 && hr.f2.f7) { hr.f7 = hr.f2.f7; delete hr.f2.f7; }
    if (!hr.f7 || !hr.f7.seeded) { const k = hr.f7; hr.f7 = seed(hr); if (k) hr.f7.scenarios.push(...(k.scenarios || [])); }
    const b10 = hr.f7.batches.find(b => b.period === '2610');
    if (b10 && !b10.snapshot && hr.people.length && !building) { building = true; const lines = hr.people.map(p => slip(hr, p.id, '2610')).filter(s => s && !s.excluded); b10.snapshot = { at: '2026-10-29 15:00', by: 'Manager HRD', lines, versions: lines[0]?.versions || {} }; const pays = {}; lines.forEach((l, k) => { pays[l.emp] = k === 17 ? { status: 'Gagal', ref: 'BANK-2610-RTN-01', note: 'Rekening tidak valid' } : k === 40 ? { status: 'Sebagian', ref: 'BANK-2610-0002', note: 'Transfer kedua menunggu' } : { status: 'Sudah Bayar', ref: 'BANK-2610-0001' }; }); b10.payments = pays; building = false; }
    return hr.f7;
  }

  function update(state, hr, action, input, ctx) {
    const f7 = ensure(hr), { audit, by, role } = ctx;
    const mgr = () => { if (role !== 'hrd') throw new Error(`Akses ditolak: ${H.roleDef(role).label} tidak membuka payroll. Khusus Manager HRD.`); };
    switch (action) {
      case 'rule-version': {
        mgr(); const r = f7.rules.find(x => x.id === input.id); if (!r) throw new Error('Aturan tidak dikenal.');
        const from = String(input.from || '2611'); const locked = f7.batches.find(b => b.period === from && b.status === 'Dikunci'); if (locked) throw new Error(`Periode ${from} sudah dikunci; pilih periode efektif berikutnya.`);
        const note = String(input.note || '').trim(); if (note.length < 5) throw new Error('Alasan perubahan minimal 5 karakter.');
        const v = r.versions[r.versions.length - 1].v + 1; r.versions.push({ v, from, formula: input.formula || r.versions[r.versions.length - 1].formula, value: input.value === '' || input.value === undefined ? r.versions[r.versions.length - 1].value : Number(input.value), by, at: now(), note });
        audit(hr, by, 'Versi aturan payroll', `${r.id} v${v} efektif ${from} · ${note}`, { object: 'Payroll', ref: r.id, before: `v${v - 1}`, after: `v${v}` });
        return `${r.id}-v${v}`;
      }
      case 'pay-generate': {
        mgr(); const period = String(input.period || '2611'); let b = batchOf(hr, period);
        if (b && b.status === 'Dikunci') throw new Error(`${b.id} sudah dikunci. Koreksi dicatat sebagai penyesuaian.`);
        if (b && input.version && Number(input.version) !== b.version) throw new Error(`Versi batch berubah (v${b.version}). Muat ulang sebelum regenerasi.`);
        const t = totals(batchLines(hr, period));
        if (!b) { b = { id: batchId(period), period, version: 1, status: 'Draf', reviewer: null, snapshot: null, payments: {}, handoff: null, history: [], demo: true }; f7.batches.push(b); }
        else { b.version++; b.status = 'Draf'; }
        b.preview = { n: t.n, gross: t.gross, thp: t.thp, at: now() };
        b.history.push([now(), `${b.version === 1 ? 'Draf dibuat' : `Regenerasi v${b.version}`} · ${t.n} orang · THP ${t.thp}`]);
        audit(hr, by, 'Generate draf payroll', `${b.id} v${b.version} · ${t.n} orang`, { object: 'Payroll', ref: b.id });
        return b.id;
      }
      case 'pay-review': case 'pay-lock': {
        mgr(); const b = batchOf(hr, input.period || '2611'); if (!b) throw new Error('Generate draf dulu.');
        if (b.status === 'Dikunci') return b.id;
        if (input.version && Number(input.version) !== b.version) throw new Error(`Versi batch berubah (v${b.version}). Tinjau ulang sebelum mengunci.`);
        if (action === 'pay-review') { b.status = 'Direview'; b.reviewer = by; b.history.push([now(), `Direview ${by} · ${anomalies(hr, b.period).length} anomali dicatat`]); return b.id; }
        if (b.status !== 'Direview') throw new Error('Review batch sebelum mengunci.');
        const lines = hr.people.map(p => slip(hr, p.id, b.period)).filter(s => s && !s.excluded);
        b.status = 'Dikunci'; b.approvedAt = now(); b.snapshot = { at: now(), by, lines, versions: lines[0]?.versions || {}, sources: sources(hr, b.period).map(s => s.slice(0, 2)), refunds: (hr.f5?.refunds || []).map(r => r.id) };
        b.history.push([now(), `Disetujui & dikunci ${by} · snapshot ${lines.length} slip`]);
        audit(hr, by, 'Kunci payroll', `${b.id} · ${lines.length} slip · THP ${totals(lines).thp}`, { object: 'Payroll', ref: b.id });
        return b.id;
      }
      case 'pay-reset': {
        mgr(); const b = batchOf(hr, input.period || '2611'); if (!b) return null; if (b.status === 'Dikunci') throw new Error('Batch terkunci tidak bisa direset.');
        b.status = 'Draf'; b.version++; b.history.push([now(), `Reset draf v${b.version}`]); audit(hr, by, 'Reset draf payroll', b.id, { object: 'Payroll', ref: b.id }); return b.id;
      }
      case 'pay-mark': {
        mgr(); const b = batchOf(hr, input.period || '2611'); if (!b || b.status !== 'Dikunci') throw new Error('Status pembayaran hanya untuk batch terkunci (Siap Bayar).');
        const st = { paid: 'Sudah Bayar', failed: 'Gagal', partial: 'Sebagian' }[input.status] || 'Sudah Bayar';
        const ref = String(input.ref || '').trim(); if (!/^BANK-/.test(ref)) throw new Error('Status pembayaran memerlukan referensi bukti bank (BANK-…).');
        const emps = input.emp ? [input.emp] : b.snapshot.lines.map(l => l.emp).filter(e => !b.payments[e] || b.payments[e].status !== 'Sudah Bayar');
        for (const e of emps) b.payments[e] = { status: st, ref, note: input.note || '', at: now(), by };
        audit(hr, by, 'Status pembayaran', `${b.id} · ${emps.length} slip → ${st} · ${ref}`, { object: 'Payroll', ref: b.id });
        return `${emps.length}`;
      }
      case 'adv-request': {
        if (!['hrd', 'hrd-ops'].includes(role)) throw new Error('Akses ditolak.');
        const amount = Number(input.amount); if (!(amount >= 100000 && amount <= 5000000)) throw new Error('Kasbon Rp100.000–Rp5.000.000.');
        const n = Math.max(1, Math.min(6, Number(input.months || 3)));
        const id = `KSB-2611-${String(++f7.seq.ksb).padStart(3, '0')}`; const per = R(amount / n); const ps = ['2611', '2612', '2701', '2702', '2703', '2704'].slice(input.start === '2612' ? 1 : 0);
        f7.advances.push({ id, emp: input.emp, amount, reason: input.reason || 'Kebutuhan pribadi', status: 'Diajukan', schedule: ps.slice(0, n).map((p, k) => ({ id: `${id}-C${k + 1}`, period: p, amount: k === n - 1 ? amount - per * (n - 1) : per })), demo: true });
        return id;
      }
      case 'adv-approve': case 'adv-disburse': {
        mgr(); const a = f7.advances.find(x => x.id === input.id); if (!a) throw new Error('Kasbon tidak ditemukan.');
        if (action === 'adv-approve') { if (a.status === 'Diajukan') { a.status = 'Disetujui'; a.approvedBy = by; } return a.id; }
        if (a.status === 'Dicairkan') return a.id; if (a.status !== 'Disetujui') throw new Error('Setujui kasbon sebelum pencairan.');
        const locked = a.schedule.find(s => batchOf(hr, s.period)?.status === 'Dikunci'); if (locked) throw new Error(`Cicilan ${locked.id} jatuh pada periode terkunci.`);
        a.status = 'Dicairkan'; a.disbursed = TODAY; audit(hr, by, 'Cairkan kasbon', `${a.id} · ${a.schedule.length} cicilan`, { object: 'Payroll', ref: a.id }); return a.id;
      }
      case 'rmb-request': {
        if (!['hrd', 'hrd-ops'].includes(role)) throw new Error('Akses ditolak.');
        const amount = Number(input.amount); if (!(amount > 0 && amount <= 10000000)) throw new Error('Nominal reimburse tidak valid.');
        if (!/\.(pdf|jpe?g|png)$/i.test(String(input.proof || ''))) throw new Error('Bukti PDF/JPG/PNG wajib.');
        const id = `RMB-2611-${String(++f7.seq.rmb).padStart(3, '0')}`; f7.reimburse.push({ id, emp: input.emp, amount, kind: input.kind || 'Operasional', period: '2611', status: 'Diajukan', settledOther: false, proof: input.proof, demo: true }); return id;
      }
      case 'rmb-decide': {
        mgr(); const r = f7.reimburse.find(x => x.id === input.id); if (!r) throw new Error('Reimburse tidak ditemukan.');
        if (input.decision === 'other') { r.settledOther = input.ref || 'Kas kecil'; if (r.status === 'Diajukan') r.status = 'Disetujui'; return r.id; }
        if (r.status !== 'Diajukan') return r.id; r.status = input.decision === 'reject' ? 'Ditolak' : 'Disetujui'; r.by = by;
        if (batchOf(hr, r.period)?.status === 'Dikunci') r.period = '2612';
        return r.id;
      }
      case 'fin-handoff': {
        mgr(); const b = batchOf(hr, input.period || '2611'); if (!b || b.status !== 'Dikunci') throw new Error('Handoff Finance hanya untuk batch terkunci.');
        const key = `JRN-${b.id}`;
        if (b.handoff && ['Terkirim', 'Diterima Finance'].includes(b.handoff.status)) { b.handoff.attempts++; return key; }
        b.handoff = { id: key, status: input.fail === '1' ? 'Gagal kirim' : 'Terkirim', sent: now(), attempts: (b.handoff?.attempts || 0) + 1, ack: null, variance: null, error: input.fail === '1' ? 'Timeout endpoint Finance (simulasi)' : null };
        audit(hr, by, 'Handoff Finance', `${key} · ${b.handoff.status} · percobaan ${b.handoff.attempts}`, { object: 'Payroll', ref: key });
        return key;
      }
      case 'fin-ack': {
        if (!['finance-manager', 'owner'].includes(role)) throw new Error('Penerimaan jurnal oleh Finance Manager.');
        const b = batchOf(hr, input.period || '2611'); if (!b?.handoff || b.handoff.status !== 'Terkirim') throw new Error('Belum ada jurnal terkirim.');
        b.handoff.status = 'Diterima Finance'; b.handoff.ack = now(); b.handoff.variance = Number(input.variance || 0); b.handoff.note = input.note || '';
        audit(hr, by, 'Finance menerima jurnal', `${b.handoff.id} · selisih ${b.handoff.variance}`, { object: 'Payroll', ref: b.handoff.id });
        return b.handoff.id;
      }
      case 'bud-sim': {
        mgr(); const outlet = input.outlet || 'OUT-UBD', n = Math.max(1, Number(input.count || 2)), start = input.start || '2026-12-01', kind = input.kind || 'tambah';
        const sm = Number(start.slice(5, 7)) - 1;
        const thr = batchLines(hr, '2610').filter(l => l.pos === 'POS-THR'), avg = thr.length ? totals(thr).cost / thr.length : 4.2e6;
        const monthly = Array(12).fill(0).map((_, m) => m < sm ? 0 : m === sm ? n * (avg * 0.8 + 750000) : n * avg * (m === sm + 1 ? 0.9 : 1));
        const fullYear = n * avg * 12;
        const id = `SIMB-2611-${String(++f7.seq.sim).padStart(3, '0')}`;
        f7.scenarios.push({ id, outlet, n, start, kind, req: input.req || null, avg, monthly: kind === 'bantuan' ? monthly.map(v => v * 0.25) : monthly, ytd: monthly.reduce((a, b) => a + b, 0) * (kind === 'bantuan' ? 0.25 : 1), fullYear: kind === 'bantuan' ? fullYear * 0.25 : fullYear, assume: kind === 'bantuan' ? ['Bantuan antaroutlet: 25% biaya (transport + insentif) tanpa headcount baru'] : [`Mulai ${start}`, 'Bulan pertama: 80% gaji + Rp750.000 onboarding (seragam, pelatihan)', 'Bulan kedua: ramp-up komisi 90%', `Biaya rata-rata therapist Oktober ${R(avg)}`], status: 'Draf', by, at: now(), demo: true });
        return id;
      }
      case 'bud-sim-approve': {
        mgr(); const s = f7.scenarios.find(x => x.id === input.id); if (!s) throw new Error('Skenario tidak ditemukan.'); if (s.status !== 'Draf') return s.id;
        if (s.kind === 'tambah' && !s.req) throw new Error('Kebutuhan tambah orang perlu Requisition ID F4 sebelum disetujui.');
        s.status = 'Disetujui'; s.approvedBy = by; audit(hr, by, 'Setujui skenario anggaran', `${s.id}${s.req ? ' · ' + s.req : ''}`, { object: 'People Budget', ref: s.id }); return s.id;
      }
      default: return undefined;
    }
  }
  const prev = { ...H.EXT };
  H.EXT.update = (state, hr, action, input, ctx) => { const r = update(state, hr, action, input, ctx); return r !== undefined ? r : prev.update(state, hr, action, input, ctx); };
  H.EXT.purge = (hr) => { prev.purge?.(hr); delete hr.f7; baseCache.clear(); };
  H.EXT.keep = (hr) => { const k = prev.keep?.(hr) || {}; if (hr.f7) k.f7 = { seeded: false, scenarios: hr.f7.scenarios.filter(s => !s.demo) }; return k; };
  H.EXT.ensure = (hr) => { if (hr.f2 && hr.f2.f7) { hr.f7 = hr.f2.f7; delete hr.f2.f7; } prev.ensure?.(hr); ensure(hr); };
  H.EXT.people = (hr, period = '2610') => totals(batchLines(hr, period));
  const REPORTS = { 'Payroll': ['Ringkasan Gaji', 'Ringkasan Gaji per Organisasi', 'Ringkasan Gaji per Komponen', 'Ringkasan Gaji per Karyawan', 'Pembayaran Gaji', 'Payroll Tahun Berjalan (YTD)'], 'PPH 21/26': ['Referensi Data Pajak Pegawai Tetap', 'Bukti Potong Pajak Pegawai Tetap Tahunan', 'Bukti Potong Pajak Pegawai Lepas Tahunan', 'Pajak Bulanan Pegawai Tetap', 'Rekap Bukti Potong Bulanan', 'Rekap Bukti Potong Tahunan'], 'BPJS': ['BPJS Ketenagakerjaan', 'BPJS Kesehatan'], 'Coretax': ['Bukti Pemotongan Bulanan Pegawai Tetap (BPMP)', 'Bukti Pemotongan Final dan Tidak Final Selain Pegawai Tetap (BP21)', 'Bukti Pemotongan PPh Pasal 26 (BP26)', 'Bukti Pemotongan A1 (BPA1)', 'Bukti Pemotongan A2 (BPA2)'] };
  const COA = [['6101', 'Beban Gaji', 'D'], ['6102', 'Beban Tunjangan', 'D'], ['6103', 'Beban Komisi', 'D'], ['6104', 'Beban Lembur', 'D'], ['6105', 'Beban BPJS Perusahaan', 'D'], ['6106', 'Beban Reimburse', 'D'], ['2101', 'Utang Gaji', 'K'], ['2102', 'Utang PPh 21', 'K'], ['2103', 'Utang BPJS', 'K'], ['1104', 'Piutang Karyawan (kasbon)', 'K']];
  function journal(hr, period) {
    const ls = batchLines(hr, period), by = {};
    for (const l of ls) { const cc = l.loc === H.HQ.id ? `HQ-${l.division}` : l.loc; const t = totals([l]); by[cc] = by[cc] || { cc, '6101': 0, '6102': 0, '6103': 0, '6104': 0, '6105': 0, '6106': 0, adj: 0 }; by[cc]['6101'] += t.base + t.adj; by[cc]['6102'] += t.allow; by[cc]['6103'] += t.comm; by[cc]['6104'] += t.ot; by[cc]['6105'] += t.employer; by[cc]['6106'] += t.rmb; by[cc].round = (by[cc].round || 0) + (t.gross - t.base - t.adj - t.allow - t.comm - t.ot - t.rmb); }
    const t = totals(ls); const debit = t.gross + t.employer, credit = t.thp + t.pph + t.bpjs + t.employer + t.ksb;
    return { id: `JRN-${batchId(period)}`, centers: Object.values(by), debit, credit, lines: [['2101', 'Utang Gaji (THP)', t.thp], ['2102', 'Utang PPh 21', t.pph], ['2103', 'Utang BPJS (karyawan + perusahaan)', t.bpjs + t.employer], ['1104', 'Piutang Karyawan (cicilan kasbon)', t.ksb]], balanced: Math.abs(debit - credit) < 1 };
  }
  return { PERIODS, MONTHS, SEASON, REPORTS, COA, ensure, ruleAt, pphRate, slip, batchOf, batchLines, excluded, totals, anomalies, sources, adjustments, commissionLines, activity, baseOf, ledger, budgetYear, ratios, journal, batchId };
})();
if (typeof module !== 'undefined') module.exports = HR7;
