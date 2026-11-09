/* HAWK × JAENS — Flow Intelligence & Management Control Tower engine (MP-HAWK-08, NV-61 / NV-62).
   Process Event Tracking Adapter + SLA engine + issue/escalation center + PFHI, built ON TOP of the existing
   records (MRF = HAWK PR, transfers, PO, GRN, bills, payments). It does not keep a second inventory or
   financial ledger: every event is DERIVED from the history the existing engines already write. The only new
   persisted objects are SLA policies, issue records, revised ETAs (with history) and the config of PFHI weights.

   Time: the demo clock (U.now) plus a DEMO time-jump (`demo.advanceClock`) so overdue situations can be shown.
   Elapsed CALENDAR hours and accountable WORKING hours are both recorded. Original due dates are never overwritten. */
(function (root) {
  'use strict';
  const HAWK = root.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const H = HAWK.handlers;
  const { log, hist, need, get } = HAWK.engine;
  const F = (HAWK.flow = {});

  /* ---------------- time ---------------- */
  const T = (iso) => (!iso ? NaN : Date.parse(iso.length === 10 ? iso + 'T17:00:00Z' : iso.replace(/Z$/, '') + 'Z'));
  const ISO = (ms) => new Date(ms).toISOString().slice(0, 19);
  F.T = T;
  F.ISO = ISO;
  F.now = (s) => ISO(Date.parse(U.DEMO_TODAY + 'T08:00:00Z') + ((s.meta.clock || 0) * 7 + (s.meta.offsetMin || 0)) * 60000);
  const HR = 3600000;
  const isWorkDay = (cal, d) => cal.days.includes(d.getUTCDay()) && !cal.holidays.includes(d.toISOString().slice(0, 10));
  /* working milliseconds between a and b (calendar: start..end hour on working days, holidays excluded) */
  F.workMs = (cal, a, b) => {
    if (!(b > a)) return 0;
    let t = 0;
    const d = new Date(a);
    d.setUTCHours(0, 0, 0, 0);
    for (let day = d.getTime(); day < b; day += 24 * HR) {
      if (!isWorkDay(cal, new Date(day))) continue;
      const s0 = Math.max(a, day + cal.start * HR);
      const e0 = Math.min(b, day + cal.end * HR);
      if (e0 > s0) t += e0 - s0;
    }
    return t;
  };
  F.addWork = (cal, a, hours) => {
    let left = hours * HR;
    const d = new Date(a);
    d.setUTCHours(0, 0, 0, 0);
    for (let day = d.getTime(); day < a + 400 * 24 * HR; day += 24 * HR) {
      if (!isWorkDay(cal, new Date(day))) continue;
      const s0 = Math.max(a, day + cal.start * HR);
      const e0 = day + cal.end * HR;
      if (e0 <= s0) continue;
      if (e0 - s0 >= left) return s0 + left;
      left -= e0 - s0;
    }
    return a + hours * HR;
  };
  const hrs = (ms) => Math.round((ms / HR) * 10) / 10;

  /* ---------------- master config (seeded, configurable) ---------------- */
  F.STAGE_LABEL = {
    SUBMIT: 'MRF diajukan', BUDGET: 'Validasi budget', APPROVAL: 'Persetujuan', ALLOCATION: 'Alokasi pemenuhan', LOCAL: 'Stok lokal', TRANSFER: 'Transfer antar-cabang', PURCHASING: 'Proses Purchasing',
    PO_APPROVAL: 'Approval PO & konfirmasi vendor', SUPPLIER: 'Persiapan & pengiriman supplier', ARRIVAL: 'Barang tiba', RECEIPT: 'Penerimaan barang', PUTAWAY: 'Put-away', ISSUE: 'Serah ke pemohon', DONE: 'Pemenuhan selesai', FINANCE: 'Verifikasi & persetujuan tagihan', PAYMENT: 'Pembayaran',
  };
  F.TIMELINE = ['SUBMIT', 'BUDGET', 'APPROVAL', 'ALLOCATION', 'SOURCING', 'PO_APPROVAL', 'SUPPLIER', 'ARRIVAL', 'RECEIPT', 'PUTAWAY', 'ISSUE', 'DONE'];
  F.TIMELINE_LABEL = ['MRF diajukan', 'Validasi budget', 'Persetujuan', 'Alokasi', 'Stok lokal / transfer / beli', 'Approval PO & vendor', 'Supplier kirim', 'Barang tiba', 'Penerimaan', 'Put-away', 'Serah ke pemohon', 'Selesai'];
  F.REASONS = [['SUPPLIER_SHORT', 'Supplier kekurangan stok / kirim sebagian'], ['SUPPLIER_LATE', 'Pengiriman supplier terlambat'], ['APPROVAL_WAIT', 'Menunggu persetujuan'], ['PAYMENT_HOLD', 'Menunggu pembayaran / uang muka'], ['PRICE', 'Negosiasi / perubahan harga'], ['TRANSPORT', 'Kendala transportasi / logistik'], ['DATA', 'Data / dokumen tidak lengkap'], ['CAPACITY', 'Kapasitas tim (beban kerja)'], ['OTHER', 'Lainnya (jelaskan)']];
  F.seedConfig = (s) => {
    s.workCalendar = { name: 'Kalender kerja JAENS (DEMO)', start: 8, end: 17, days: [1, 2, 3, 4, 5, 6], holidays: ['2026-11-25', '2026-12-25', '2027-01-01'], note: 'Senin–Sabtu 08:00–17:00. Hari libur DEMO — TO VERIFY dengan kalender HR JAENS.' };
    const p = (id, stage, name, basis, hours, owner, escalate, note) => ({ id, stage, name, basis, hours, warn: 0.8, owner, escalate, version: 1, active: true, note: note || '', changes: [] });
    s.slaPolicies = [
      p('SLA-APR', 'APPROVAL', 'Persetujuan MRF', 'WORK', 8, 'SUPERVISOR', ['HEAD_DIV', 'BU_MANAGER']),
      p('SLA-PUR', 'PURCHASING', 'Purchasing: kebutuhan disetujui → PO terkirim', 'WORK', 16, 'PURCHASING', ['BU_MANAGER']),
      p('SLA-POA', 'PO_APPROVAL', 'Approval PO & kirim ke vendor', 'WORK', 4, 'PURCHASING', ['BU_MANAGER']),
      p('SLA-VND', 'SUPPLIER', 'Lead time vendor (tanggal janji PO)', 'PROMISED', null, 'PURCHASING', ['BU_MANAGER', 'OWNER'], 'Jatuh tempo = tanggal janji PO (Promised Date) pukul 17:00. Revisi ETA dicatat terpisah, jatuh tempo asli tidak diubah.'),
      p('SLA-TRF', 'TRANSFER', 'Transfer antar-cabang', 'CAL', 24, 'WAREHOUSE', ['BU_MANAGER']),
      p('SLA-RCV', 'RECEIPT', 'Penerimaan: barang tiba → posting', 'WORK', 4, 'WAREHOUSE', ['BU_MANAGER']),
      p('SLA-PUT', 'PUTAWAY', 'Put-away ke rak', 'WORK', 4, 'WAREHOUSE', ['BU_MANAGER']),
      p('SLA-ISS', 'ISSUE', 'Serah ke pemohon setelah barang siap', 'WORK', 8, 'WAREHOUSE', ['SUPERVISOR']),
      p('SLA-FUL', 'DONE', 'Pemenuhan total MRF rutin (end-to-end)', 'CAL', 96, 'PURCHASING', ['BU_MANAGER', 'OWNER']),
      p('SLA-FIN', 'FINANCE', 'Tagihan: dibuat → disetujui', 'WORK', 16, 'FINANCE', ['BU_MANAGER']),
    ];
    s.flowConfig = { weights: { onTime: 0.4, activeSla: 0.25, p90: 0.2, data: 0.15 }, version: 1, changes: [], note: 'Bobot sementara (usulan MP-HAWK-08). Belum disetujui sebagai ukuran kinerja resmi.' };
    s.flowIssues = [];
    s.meta.offsetMin = 0;
  };
  /* Synthetic completed-order history (DEMO) — used ONLY for trends, stage averages and supplier scorecards.
     It never touches stock, budget or journals. Clearly labelled "Riwayat DEMO (sintetis)". */
  F.seedHistory = (s) => {
    const br = ['BR-UBD', 'BR-SHN', 'BR-TRK', 'BR-BSM', 'BU-ESS'];
    const items = ['BHP-001', 'BHP-002', 'BHP-003', 'BHP-004', 'BHP-005', 'BHP-006', 'BHP-007', 'BHP-008', 'ESS-RM-01'];
    const out = [];
    const months = [['2026-08', 0.71], ['2026-09', 0.74], ['2026-10', 0.78]];
    let k = 0;
    months.forEach(([mo, rate]) => {
      for (let i = 0; i < 12; i++, k++) {
        const it = S.item(s, items[k % items.length]);
        const sup = it.supplier;
        const purchase = k % 3 !== 0;
        const late = i / 12 >= rate;
        const supLate = purchase && late && k % 2 === 0;
        const st = { APPROVAL: 2 + (k % 5), PURCHASING: purchase ? 6 + (k % 9) : 0, SUPPLIER: purchase ? 30 + (k % 4) * 8 + (supLate ? 36 : 0) : 0, TRANSFER: !purchase ? 10 + (k % 6) * 3 : 0, RECEIPT: 1 + (k % 3), PUTAWAY: 1 + (k % 2), ISSUE: 2 + (k % 4) + (late && !supLate ? 30 : 0) };
        const cycle = Object.values(st).reduce((a, b) => a + b, 0) + (late ? 12 : 0);
        out.push({ id: `HX-${mo.replace('-', '')}-${String(i + 1).padStart(2, '0')}`, month: mo, branch: br[k % br.length], item: it.id, cat: it.cat, supplier: purchase ? sup : null, cycleH: cycle, onTime: cycle <= 96, stages: st, promisedMet: purchase ? !supLate : null, leadDays: purchase ? Math.round((st.SUPPLIER / 24) * 10) / 10 : null, reason: late ? (supLate ? 'SUPPLIER_LATE' : k % 2 ? 'APPROVAL_WAIT' : 'CAPACITY') : null });
      }
    });
    s.flowHistory = out;
  };

  const baseSeed = HAWK.seed;
  HAWK.seed = function () {
    const s = baseSeed();
    s.meta.schema = 11;
    F.seedConfig(s);
    F.seedHistory(s);
    F.sync(s, { user: { id: 'SYS-RULE', role: 'SYSTEM' }, now: F.now(s) });
    return s;
  };

  /* ---------------- SLA evaluation ---------------- */
  F.policy = (s, stage) => (s.slaPolicies || []).find((p) => p.stage === stage && p.active);
  F.evalSla = (s, stage, start, end, promised) => {
    const pol = F.policy(s, stage);
    const cal = s.workCalendar;
    const now = T(F.now(s));
    const a = T(start);
    if (!pol || isNaN(a)) return { stage, policy: pol ? pol.id : null, start, end: end || null, state: end ? 'DONE' : 'ACTIVE', sla: 'NA' };
    const e = end ? T(end) : now;
    const due = pol.basis === 'PROMISED' ? T(promised) : pol.basis === 'WORK' ? F.addWork(cal, a, pol.hours) : a + pol.hours * HR;
    const span = Math.max(1, due - a);
    const ratio = (e - a) / span;
    let sla;
    if (end) sla = e > due ? 'LATE' : 'ONTIME';
    else sla = e > due ? 'BREACH' : ratio >= pol.warn ? 'RISK' : 'OK';
    return {
      stage, policy: pol.id, policyVersion: pol.version, basis: pol.basis, owner: pol.owner, escalate: pol.escalate, start, end: end || null, state: end ? 'DONE' : 'ACTIVE',
      due: isNaN(due) ? null : ISO(due), calH: hrs(e - a), workH: hrs(F.workMs(cal, a, e)), breachH: e > due ? hrs(e - due) : 0, ratio: Math.round(ratio * 100) / 100, sla,
    };
  };

  /* ---------------- Process Event Tracking Adapter (derived) ---------------- */
  const hx = (rec, ...acts) => (rec.history || []).filter((h) => acts.includes(h.action));
  const firstTs = (rec, ...acts) => (hx(rec, ...acts)[0] || {}).ts;
  const lastTs = (rec, ...acts) => (hx(rec, ...acts).slice(-1)[0] || {}).ts;
  const SRC = { MRF: 'HAWK Purchase Request (MRF)', TR: 'HAWK Inventory Transfer', PO: 'HAWK Purchase Order', GR: 'HAWK Receiving / Inventory', BL: 'HAWK Finance AP', PY: 'HAWK Finance Payment', DC: 'Capture dokumen (AI SIMULATION)', FLOW: 'Flow Intelligence (prototipe)' };
  F.related = (s, m) => {
    const trs = s.transfers.filter((t) => t.mrf === m.id);
    const poIds = U.uniq(m.lines.flatMap((l) => (l.alloc || []).filter((a) => a.path === 'PURCHASE' && a.ref).map((a) => a.ref)));
    const pos = poIds.map((id) => s.pos.find((p) => p.id === id)).filter(Boolean);
    const grns = s.grns.filter((g) => pos.some((p) => p.id === g.po));
    const bills = s.bills.filter((b) => pos.some((p) => p.id === b.po));
    const pays = s.payments.filter((p) => (p.po && pos.some((x) => x.id === p.po)) || bills.some((b) => b.id === p.bill));
    const docs = s.docs.filter((d) => bills.some((b) => b.doc === d.id) || pos.some((p) => d.matchedPo === p.id || (d.fields && d.fields.poText === p.id)));
    const journals = s.journals.filter((j) => [m.id, ...grns.map((g) => g.id), ...bills.map((b) => b.id), ...pos.map((p) => p.id)].includes(j.source));
    return { trs, pos, grns, bills, pays, docs, journals };
  };

  F.journey = (s, m) => {
    const R = F.related(s, m);
    const ev = [];
    let n = 0;
    const add = (o) => ev.push({ id: `EV-${m.id}-${String(++n).padStart(3, '0')}`, txn: m.id, org: m.branch, related: [], line: null, pic: null, before: null, after: null, policy: null, due: null, reason: null, evidence: null, ...o });
    const submitTs = firstTs(m, 'SUBMIT', 'DRAFT') || m.date;
    const apprTs = m.status === 'SUBMITTED' || m.status === 'ESCALATED' || m.status === 'REVISION' || m.status === 'DRAFT' ? null : lastTs(m, 'APPROVE', 'AUTO_APPROVE') || (m.approvals && m.approvals.length ? m.approvals.slice(-1)[0].ts : null);
    const allocTs = lastTs(m, 'PLAN_FULFILLMENT') || apprTs;
    add({ type: 'MRF_SUBMITTED', stage: 'SUBMIT', ts: submitTs, actor: m.requester, after: 'SUBMITTED', source: SRC.MRF, evidence: m.id });
    add({ type: 'BUDGET_VALIDATED', stage: 'BUDGET', ts: submitTs, actor: 'SYS-RULE', after: m.budgetSnapshot || 'OK', source: SRC.MRF, note: 'Status budget saat diajukan: ' + (m.budgetSnapshot || 'OK (data seed)') });
    hx(m, 'APPROVE', 'AUTO_APPROVE', 'REJECT', 'REVISION', 'ESCALATE', 'AUTO_CHECK').forEach((h) => add({ type: 'APPROVAL_' + h.action, stage: 'APPROVAL', ts: h.ts, actor: h.by, after: h.action, note: h.note, source: SRC.MRF }));
    if (allocTs) add({ type: 'FULFILLMENT_ALLOCATED', stage: 'ALLOCATION', ts: allocTs, actor: lastTs(m, 'PLAN_FULFILLMENT') ? (hx(m, 'PLAN_FULFILLMENT').slice(-1)[0] || {}).by : 'SYS-RULE', note: m.lines.map((l) => (l.alloc || []).map((a) => `${a.path} ${a.qty}`).join(' + ')).join(' | '), source: SRC.MRF });
    R.trs.forEach((t) => {
      (t.history || []).forEach((h) => add({ type: 'TRANSFER_' + h.action, stage: 'TRANSFER', ts: h.ts, actor: h.by, related: [t.id], note: h.note, source: SRC.TR, evidence: t.id }));
    });
    R.pos.forEach((p) => {
      (p.history || []).forEach((h) => add({ type: 'PO_' + h.action, stage: ['SEND', 'APPROVE', 'AUTO_APPROVE', 'SUBMIT', 'CREATE', 'REJECT'].includes(h.action) ? 'PO_APPROVAL' : h.action === 'ETA_REVISED' ? 'SUPPLIER' : 'RECEIPT', ts: h.ts, actor: h.by, related: [p.id], note: h.note, source: SRC.PO, evidence: p.id }));
    });
    R.grns.forEach((g) => (g.history || []).forEach((h) => add({ type: 'GRN_' + h.action, stage: h.action === 'PUTAWAY' ? 'PUTAWAY' : h.action === 'PHYSICAL_RECEIPT' ? 'ARRIVAL' : 'RECEIPT', ts: h.ts, actor: h.by, related: [g.id, g.po], note: h.note, source: SRC.GR, evidence: g.id })));
    hx(m, 'ISSUE', 'RECEIVED_BY_REQUESTER').forEach((h) => add({ type: 'ISSUED', stage: 'ISSUE', ts: h.ts, actor: h.by, note: h.note, source: SRC.MRF }));
    const doneTs = m.status === 'FULFILLED' ? lastTs(m, 'ISSUE') || lastTs(m, 'RECEIVED_BY_REQUESTER') : null;
    if (doneTs) add({ type: 'FULFILLMENT_COMPLETED', stage: 'DONE', ts: doneTs, actor: 'SYS-RULE', after: 'FULFILLED', source: SRC.MRF });
    // financial journey (separate but linked)
    const fin = [];
    R.docs.forEach((d) => (d.history || []).forEach((h) => fin.push({ stage: 'INVOICE', type: 'DOC_' + h.action, ts: h.ts, actor: h.by, ref: d.id, note: h.note, source: SRC.DC })));
    R.bills.forEach((b) => (b.history || []).forEach((h) => fin.push({ stage: h.action === 'PAY' ? 'PAYMENT' : 'FINANCE', type: 'BILL_' + h.action, ts: h.ts, actor: h.by, ref: b.id, note: h.note, source: SRC.BL })));
    R.pays.forEach((p) => fin.push({ stage: 'PAYMENT', type: p.kind === 'ADVANCE' ? 'ADVANCE_PAYMENT' : 'PAYMENT', ts: (p.date || '') + (p.date && p.date.length === 10 ? 'T12:00:00' : ''), actor: p.by, ref: p.id, note: U.rp(p.amount) + ' — ' + p.method, source: SRC.PY }));
    R.pos.forEach((p) => hx(p, 'PAID_CONFIRMED').forEach((h) => fin.push({ stage: 'PAYMENT', type: 'PAID_CONFIRMED', ts: h.ts, actor: h.by, ref: p.id, note: h.note, source: SRC.PO })));
    fin.sort((a, b) => T(a.ts) - T(b.ts));
    ev.sort((a, b) => T(a.ts) - T(b.ts) || 0);

    /* ---- stage tracks with SLA ---- */
    const tracks = [];
    const lineOf = (item) => m.lines.find((l) => l.item === item);
    if (submitTs) tracks.push({ kind: 'MRF', ref: m.id, label: 'Persetujuan', stages: [F.evalSla(s, 'APPROVAL', submitTs, apprTs || null)] });
    m.lines.forEach((l) =>
      (l.alloc || []).forEach((a) => {
        if (a.path === 'LOCAL') tracks.push({ kind: 'LOCAL', ref: null, item: l.item, qty: a.qty, ready: a.readyQty, issued: a.issuedQty, label: 'Stok lokal ' + S.whName(s, a.fromWh), stages: [] });
        if (a.path === 'TRANSFER') {
          const t = R.trs.find((x) => x.id === a.ref);
          const recvTs = t && lastTs(t, 'RECEIVE');
          tracks.push({ kind: 'TRANSFER', ref: a.ref, item: l.item, qty: a.qty, ready: a.readyQty, issued: a.issuedQty, label: `Transfer dari ${S.whName(s, a.fromWh)}`, stages: [F.evalSla(s, 'TRANSFER', (t && t.date) || allocTs, recvTs || null)] });
        }
        if (a.path === 'PURCHASE') {
          const p = a.ref && R.pos.find((x) => x.id === a.ref);
          const sentTs = p && lastTs(p, 'SEND');
          const st = [F.evalSla(s, 'PURCHASING', allocTs, sentTs || null)];
          if (p) {
            const pl = p.lines.find((x) => x.item === l.item);
            st.push(F.evalSla(s, 'PO_APPROVAL', p.date, sentTs || null));
            if (sentTs) {
              const full = pl && pl.received >= pl.qty;
              const lastArr = U.uniq(R.grns.filter((g) => g.po === p.id).map((g) => g.date)).slice(0, 1)[0];
              const sup = F.evalSla(s, 'SUPPLIER', sentTs, full ? lastArr : null, p.promised);
              sup.etaCurrent = p.eta || p.promised;
              sup.etaOriginal = p.promised;
              sup.outstanding = pl ? pl.qty - pl.received : 0;
              sup.received = pl ? pl.received : 0;
              st.push(sup);
            }
            R.grns.filter((g) => g.po === p.id).forEach((g) => {
              const postTs = firstTs(g, 'POST_INVENTORY');
              const putTs = firstTs(g, 'PUTAWAY');
              const r = F.evalSla(s, 'RECEIPT', g.date, postTs || null);
              r.ref = g.id;
              st.push(r);
              if (postTs) {
                const pa = F.evalSla(s, 'PUTAWAY', postTs, putTs || null);
                pa.ref = g.id;
                st.push(pa);
              }
            });
          }
          tracks.push({ kind: 'PURCHASE', ref: a.ref || null, item: l.item, qty: a.qty, ready: a.readyQty, issued: a.issuedQty, supplier: p ? p.supplier : S.item(s, l.item).supplier, label: p ? `PO ${p.id} · ${S.supplierName(s, p.supplier)}` : 'Menunggu PO', stages: st });
        }
      })
    );
    const f = S.mrfFulfillment(s, m);
    // final issue SLA: from the moment qty became ready and is not yet issued
    if (f.ready > f.issued && m.status === 'IN_FULFILLMENT') {
      const readyTs = [lastTs(m, 'PURCHASE_READY'), lastTs(m, 'TRANSFER_RECEIVED'), allocTs].filter(Boolean).sort((a, b) => T(b) - T(a))[0];
      tracks.push({ kind: 'ISSUE', ref: m.id, label: 'Serah ke pemohon', stages: [F.evalSla(s, 'ISSUE', readyTs, null)] });
    }
    const overall = submitTs && !['REJECTED', 'CANCELLED', 'DRAFT'].includes(m.status) ? F.evalSla(s, 'DONE', submitTs, doneTs || null) : null;
    const finStages = R.bills.map((b) => {
      const c = firstTs(b, 'AP_DRAFT', 'AUTO_BILL');
      const ap = firstTs(b, 'APPROVE', 'AUTO_BILL');
      const e = F.evalSla(s, 'FINANCE', c, ap || null);
      e.ref = b.id;
      return e;
    });
    const active = [];
    tracks.forEach((t) => t.stages.forEach((st) => st.state === 'ACTIVE' && st.sla !== 'NA' && active.push({ ...st, track: t })));
    const order = { BREACH: 3, RISK: 2, OK: 1 };
    active.sort((a, b) => (order[b.sla] || 0) - (order[a.sla] || 0) || b.ratio - a.ratio);
    const worst = active[0] || null;
    const timeline = F.timeline(s, m, ev, tracks, overall, doneTs);
    const facts = ev.length;
    const complete = ev.filter((e) => e.ts && e.actor).length;
    return { mrf: m, events: ev, fin, tracks, overall, finStages, active, worst, related: R, fulfil: f, timeline, completeness: facts ? complete / facts : 1, cycleH: overall ? overall.calH : null, sla: overall ? overall.sla : 'NA' };
  };

  /* 12-step summary for the clickable timeline */
  F.timeline = (s, m, ev, tracks, overall, doneTs) => {
    const has = (stage) => ev.filter((e) => e.stage === stage);
    const buy = tracks.filter((t) => t.kind === 'PURCHASE');
    const trf = tracks.filter((t) => t.kind === 'TRANSFER');
    const stOf = (key) => tracks.flatMap((t) => t.stages.filter((x) => x.stage === key));
    const status = (arr) => (!arr.length ? 'SKIP' : arr.some((x) => x.sla === 'BREACH') ? 'BREACH' : arr.some((x) => x.state === 'ACTIVE') ? (arr.some((x) => x.sla === 'RISK') ? 'RISK' : 'ACTIVE') : arr.some((x) => x.sla === 'LATE') ? 'LATE' : 'DONE');
    const approved = !['SUBMITTED', 'ESCALATED', 'REVISION', 'DRAFT'].includes(m.status);
    const appr = stOf('APPROVAL');
    const f = S.mrfFulfillment(s, m);
    const steps = [
      { key: 'SUBMIT', status: 'DONE', ts: m.date },
      { key: 'BUDGET', status: 'DONE', ts: m.date, note: m.budgetSnapshot || 'OK' },
      { key: 'APPROVAL', status: ['REJECTED', 'CANCELLED'].includes(m.status) ? 'STOP' : status(appr) },
      { key: 'ALLOCATION', status: approved && !['REJECTED', 'CANCELLED'].includes(m.status) ? 'DONE' : 'PENDING' },
      { key: 'SOURCING', status: !approved ? 'PENDING' : status([...stOf('TRANSFER'), ...stOf('PURCHASING')].length ? [...stOf('TRANSFER'), ...stOf('PURCHASING')] : [{ state: 'DONE', sla: 'ONTIME' }]) },
      { key: 'PO_APPROVAL', status: !buy.length ? 'SKIP' : status(stOf('PO_APPROVAL')) === 'SKIP' ? 'PENDING' : status(stOf('PO_APPROVAL')) },
      { key: 'SUPPLIER', status: !buy.length ? 'SKIP' : status(stOf('SUPPLIER')) === 'SKIP' ? 'PENDING' : status(stOf('SUPPLIER')) },
      { key: 'ARRIVAL', status: !buy.length && !trf.length ? 'SKIP' : has('ARRIVAL').length || trf.some((t) => t.stages[0] && t.stages[0].state === 'DONE') ? (buy.some((t) => (t.stages.find((x) => x.stage === 'SUPPLIER') || {}).state === 'ACTIVE') ? 'PARTIAL' : 'DONE') : 'PENDING' },
      { key: 'RECEIPT', status: !buy.length ? 'SKIP' : status(stOf('RECEIPT')) === 'SKIP' ? 'PENDING' : status(stOf('RECEIPT')) },
      { key: 'PUTAWAY', status: !buy.length ? 'SKIP' : status(stOf('PUTAWAY')) === 'SKIP' ? 'PENDING' : status(stOf('PUTAWAY')) },
      { key: 'ISSUE', status: f.issued >= f.requested && f.requested ? 'DONE' : f.issued > 0 ? 'PARTIAL' : approved ? 'PENDING' : 'PENDING' },
      { key: 'DONE', status: doneTs ? (overall && overall.sla === 'LATE' ? 'LATE' : 'DONE') : overall && overall.sla === 'BREACH' ? 'BREACH' : 'PENDING', ts: doneTs },
    ];
    steps.forEach((x, i) => {
      x.label = F.TIMELINE_LABEL[i];
      x.n = i + 1;
      if (!x.ts) {
        const e = ev.filter((e) => e.stage === x.key || (x.key === 'SOURCING' && ['TRANSFER', 'ALLOCATION'].includes(e.stage)) || (x.key === 'SUPPLIER' && e.type === 'PO_SEND')).slice(-1)[0];
        x.ts = e ? e.ts : null;
      }
    });
    return steps;
  };

  /* ---------------- rows for the Control Tower (one per MRF) ---------------- */
  F.rows = (s) =>
    s.mrfs
      .filter((m) => !['DRAFT'].includes(m.status))
      .map((m) => {
        const j = F.journey(s, m);
        const iss = (s.flowIssues || []).filter((i) => i.mrf === m.id && i.status !== 'RESOLVED');
        const pri = iss.map((i) => i.priority).sort()[0] || null;
        const w = j.worst;
        const pos = j.related.pos;
        const items = m.lines.map((l) => S.item(s, l.item));
        return {
          id: m.id, m, j, branch: m.branch, bu: S.buOf(s, m.branch), division: (S.org(s, m.branch) || {}).type === 'DIVISION' ? m.branch : null, status: m.status,
          suppliers: U.uniq([...pos.map((p) => p.supplier), ...items.map((i) => i.supplier)].filter(Boolean)), cats: U.uniq(items.map((i) => i.cat)),
          pic: w ? w.owner : m.status === 'IN_FULFILLMENT' ? 'WAREHOUSE' : null, stage: w ? w.stage : null, sla: w ? w.sla : j.sla, overall: j.overall, priority: pri, issues: iss,
          open: ['SUBMITTED', 'ESCALATED', 'REVISION', 'APPROVED', 'IN_FULFILLMENT'].includes(m.status), done: m.status === 'FULFILLED', ageH: j.overall ? j.overall.calH : 0,
          value: S.mrfValue(s, m), date: m.date,
        };
      });
  F.filter = (s, rows, f = {}) =>
    rows.filter(
      (r) =>
        (!f.bu || f.bu === 'ALL' || r.bu === f.bu) &&
        (!f.branch || f.branch === 'ALL' || r.branch === f.branch) &&
        (!f.supplier || f.supplier === 'ALL' || r.suppliers.includes(f.supplier)) &&
        (!f.cat || f.cat === 'ALL' || r.cats.includes(f.cat)) &&
        (!f.pic || f.pic === 'ALL' || r.pic === f.pic || r.issues.some((i) => i.pic === f.pic)) &&
        (!f.priority || f.priority === 'ALL' || r.priority === f.priority) &&
        (!f.status || f.status === 'ALL' || (f.status === 'OPEN' ? r.open : f.status === 'DONE' ? r.done : f.status === 'LATE' ? ['BREACH', 'LATE'].includes(r.sla) || (r.overall && ['BREACH', 'LATE'].includes(r.overall.sla)) : r.status === f.status)) &&
        (!f.period || f.period === 'ALL' || (T(F.now(s)) - T(r.date)) / (24 * HR) <= +f.period)
    );
  F.histFilter = (s, f = {}) =>
    (s.flowHistory || []).filter(
      (h) => (!f.bu || f.bu === 'ALL' || S.buOf(s, h.branch) === f.bu) && (!f.branch || f.branch === 'ALL' || h.branch === f.branch) && (!f.supplier || f.supplier === 'ALL' || h.supplier === f.supplier) && (!f.cat || f.cat === 'ALL' || h.cat === f.cat) && !(f.status && ['OPEN'].includes(f.status))
    );
  const pct = (arr, p) => {
    if (!arr.length) return null;
    const a = arr.slice().sort((x, y) => x - y);
    return a[Math.min(a.length - 1, Math.ceil(p * a.length) - 1)];
  };
  F.pct = pct;

  /* ---------------- KPIs + PFHI ---------------- */
  F.kpis = (s, f = {}, opts = {}) => {
    const rows = F.filter(s, F.rows(s), f);
    const hist = opts.live ? [] : F.histFilter(s, f);
    const live = rows.filter((r) => r.overall);
    const doneLive = live.filter((r) => r.done);
    const openLive = live.filter((r) => r.open);
    const doneAll = [...doneLive.map((r) => ({ onTime: r.overall.sla === 'ONTIME', cycleH: r.overall.calH })), ...hist.map((h) => ({ onTime: h.onTime, cycleH: h.cycleH }))];
    const target = (F.policy(s, 'DONE') || { hours: 96 }).hours;
    const onTime = doneAll.length ? doneAll.filter((x) => x.onTime).length / doneAll.length : null;
    const activeOk = openLive.length ? openLive.filter((r) => !r.j.active.some((a) => a.sla === 'BREACH') && r.overall.sla !== 'BREACH').length / openLive.length : null;
    const p90 = pct(doneAll.map((x) => x.cycleH), 0.9);
    const p90Score = p90 === null ? null : Math.min(1, target / p90);
    const data = live.length ? live.reduce((t, r) => t + r.j.completeness, 0) / live.length : null;
    const w = s.flowConfig.weights;
    const comp = [
      { key: 'onTime', label: 'Selesai tepat waktu', weight: w.onTime, score: onTime, detail: doneAll.length ? `${doneAll.filter((x) => x.onTime).length}/${doneAll.length} pesanan selesai ≤ ${target} jam` : 'Belum ada data' },
      { key: 'activeSla', label: 'Pesanan aktif dalam SLA', weight: w.activeSla, score: activeOk, detail: openLive.length ? `${openLive.filter((r) => !r.j.active.some((a) => a.sla === 'BREACH') && r.overall.sla !== 'BREACH').length}/${openLive.length} pesanan aktif` : 'Tidak ada pesanan aktif' },
      { key: 'p90', label: 'Kinerja waktu siklus P90', weight: w.p90, score: p90Score, detail: p90 === null ? 'Belum ada data' : `P90 ${Math.round(p90)} jam vs target ${target} jam (skor = target ÷ P90, maks 100)` },
      { key: 'data', label: 'Kelengkapan data event', weight: w.data, score: data, detail: live.length ? `${Math.round((data || 0) * 100)}% event punya waktu & pelaku` : '—' },
    ];
    const usable = comp.filter((c) => c.score !== null);
    const wsum = usable.reduce((t, c) => t + c.weight, 0);
    const pfhi = wsum ? Math.round((usable.reduce((t, c) => t + c.weight * c.score, 0) / wsum) * 100) : null;
    const overdue = openLive.filter((r) => r.overall.sla === 'BREACH' || r.j.active.some((a) => a.sla === 'BREACH'));
    const risk = openLive.filter((r) => !overdue.includes(r) && (r.overall.sla === 'RISK' || r.j.active.some((a) => a.sla === 'RISK')));
    const issues = (s.flowIssues || []).filter((i) => i.status !== 'RESOLVED' && rows.some((r) => r.id === i.mrf || (!i.mrf && opts.includeStandalone !== false)));
    return { rows, hist, pfhi, comp, onTime, p90, target, overdue, risk, critical: issues.filter((i) => i.priority === 'P0'), urgent: issues.filter((i) => i.priority === 'P1'), issues, openLive, doneLive, doneAll, activeOk };
  };
  /* average waiting time per stage (live completed + active elapsed, plus DEMO history) */
  F.stageStats = (s, rows, hist) => {
    const keys = ['APPROVAL', 'PURCHASING', 'PO_APPROVAL', 'SUPPLIER', 'TRANSFER', 'RECEIPT', 'PUTAWAY', 'ISSUE'];
    return keys.map((k) => {
      const vals = [];
      rows.forEach((r) => r.j.tracks.forEach((t) => t.stages.filter((x) => x.stage === k && x.calH !== undefined).forEach((x) => vals.push(x.calH))));
      hist.forEach((h) => h.stages[k] && vals.push(h.stages[k]));
      const act = rows.flatMap((r) => r.j.active.filter((a) => a.stage === k));
      return { key: k, label: F.STAGE_LABEL[k], avg: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0, n: vals.length, active: act.length, breach: act.filter((a) => a.sla === 'BREACH').length, risk: act.filter((a) => a.sla === 'RISK').length };
    });
  };
  F.supplierStats = (s, f = {}) =>
    s.suppliers
      .filter((x) => !f.supplier || f.supplier === 'ALL' || x.id === f.supplier)
      .map((sup) => {
        const hist = (s.flowHistory || []).filter((h) => h.supplier === sup.id);
        const pos = s.pos.filter((p) => p.supplier === sup.id && ['SENT', 'PARTIAL', 'RECEIVED'].includes(p.status));
        const now = T(F.now(s));
        const live = pos.map((p) => {
          const g = s.grns.filter((x) => x.po === p.id);
          const full = p.status === 'RECEIVED';
          const last = g.map((x) => T(x.date)).sort((a, b) => b - a)[0];
          const sent = T(lastTs(p, 'SEND') || p.date);
          return { met: full ? last <= T(p.promised) : now <= T(p.promised) ? null : false, lead: full ? (last - sent) / (24 * HR) : null, outstanding: p.lines.reduce((t, l) => t + l.qty - l.received, 0), partial: p.status === 'PARTIAL' || (g.length && !full) };
        });
        const metArr = [...hist.map((h) => h.promisedMet), ...live.map((l) => l.met)].filter((x) => x !== null);
        const leads = [...hist.map((h) => h.leadDays), ...live.map((l) => l.lead)].filter((x) => x !== null);
        const otd = metArr.length ? metArr.filter(Boolean).length / metArr.length : null;
        const lead = leads.length ? leads.reduce((a, b) => a + b, 0) / leads.length : null;
        const partialRate = live.length ? live.filter((l) => l.partial).length / live.length : 0;
        const score = otd === null ? null : Math.round(otd * 70 + Math.max(0, 1 - Math.max(0, (lead || 0) - sup.leadDays) / 5) * 20 + (1 - partialRate) * 10);
        return { id: sup.id, name: sup.name, otd, lead, promisedLead: sup.leadDays, outstanding: live.reduce((t, l) => t + l.outstanding, 0), openPos: pos.filter((p) => p.status !== 'RECEIVED').length, n: metArr.length, score, partialRate };
      })
      .filter((x) => x.n || x.openPos)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  F.agingBuckets = [['<1 hari', 0, 24], ['1–2 hari', 24, 48], ['2–3 hari', 48, 72], ['>3 hari', 72, 1e9]];
  F.heatmap = (s, rows) => {
    const keys = ['APPROVAL', 'PURCHASING', 'PO_APPROVAL', 'SUPPLIER', 'TRANSFER', 'RECEIPT', 'PUTAWAY', 'ISSUE'];
    return keys.map((k) => ({
      key: k,
      label: F.STAGE_LABEL[k],
      cells: F.agingBuckets.map(([lab, a, b]) => {
        const hit = rows.flatMap((r) => r.j.active.filter((x) => x.stage === k && x.calH >= a && x.calH < b).map((x) => ({ id: r.id, sla: x.sla })));
        return { label: lab, n: hit.length, ids: U.uniq(hit.map((h) => h.id)), worst: hit.some((h) => h.sla === 'BREACH') ? 'BREACH' : hit.some((h) => h.sla === 'RISK') ? 'RISK' : hit.length ? 'OK' : '' };
      }),
    }));
  };
  F.trend = (s, f = {}) => {
    const hist = F.histFilter(s, f);
    const months = U.uniq(hist.map((h) => h.month)).sort();
    const out = months.map((mo) => {
      const a = hist.filter((h) => h.month === mo);
      return { month: mo, rate: a.length ? a.filter((h) => h.onTime).length / a.length : null, n: a.length, source: 'DEMO' };
    });
    const live = F.filter(s, F.rows(s), f).filter((r) => r.done && r.overall);
    const cur = s.meta.period;
    const lv = live.filter((r) => r.m.date.slice(0, 7) === cur);
    const pastNov = hist.filter((h) => h.month === cur);
    out.push({ month: cur, rate: lv.length + pastNov.length ? (lv.filter((r) => r.overall.sla === 'ONTIME').length + pastNov.filter((h) => h.onTime).length) / (lv.length + pastNov.length) : null, n: lv.length, source: 'LIVE' });
    return out;
  };
  F.reasons = (s, rows, hist) => {
    const c = {};
    (s.flowIssues || []).filter((i) => i.reasonCode && (!rows || rows.some((r) => r.id === i.mrf))).forEach((i) => (c[i.reasonCode] = (c[i.reasonCode] || 0) + 1));
    (hist || []).forEach((h) => h.reason && (c[h.reason] = (c[h.reason] || 0) + 1));
    return Object.entries(c).map(([k, v]) => ({ key: k, label: (F.REASONS.find((r) => r[0] === k) || [k, k])[1], n: v })).sort((a, b) => b.n - a.n);
  };

  /* ---------------- AI SIMULATION: delay intelligence (deterministic; facts separated from hypotheses) ---------------- */
  F.ai = (s, j) => {
    const m = j.mrf;
    const facts = [];
    const hyp = [];
    const recs = [];
    const w = j.worst;
    const f = j.fulfil;
    facts.push(`${f.issued}/${f.requested} unit sudah diserahkan; ${f.ready - f.issued} siap; ${f.requested - f.ready} belum tersedia.`);
    if (w) facts.push(`Tahap aktif terburuk: ${F.STAGE_LABEL[w.stage]} — ${w.calH} jam kalender / ${w.workH} jam kerja; jatuh tempo ${U.datetime(w.due)}${w.breachH ? `; lewat ${w.breachH} jam` : ''} (${w.policy} v${w.policyVersion}).`);
    j.tracks.filter((t) => t.kind === 'PURCHASE' && t.ref).forEach((t) => {
      const sup = t.stages.find((x) => x.stage === 'SUPPLIER');
      if (sup && sup.received && sup.outstanding) facts.push(`${t.ref}: supplier mengirim ${sup.received} dari ${sup.received + sup.outstanding} (${sup.outstanding} backorder).`);
      if (sup && sup.etaCurrent !== sup.etaOriginal) facts.push(`${t.ref}: ETA direvisi ${U.date(sup.etaOriginal)} → ${U.date(sup.etaCurrent)}; jatuh tempo SLA asli tetap ${U.date(sup.etaOriginal)}.`);
      if (sup && (sup.sla === 'BREACH' || sup.sla === 'RISK')) {
        const st = F.supplierStats(s, { supplier: t.supplier })[0];
        if (st && st.otd !== null) hyp.push({ text: `Pola pemasok: ${st.name} tepat waktu ${Math.round(st.otd * 100)}% (${st.n} pengiriman), rata-rata lead time ${st.lead ? st.lead.toFixed(1) : '—'} hari vs janji ${st.promisedLead} hari. Kemungkinan kekurangan stok di pemasok.`, conf: st.otd < 0.8 ? 'Sedang' : 'Rendah' });
        const late = st && st.lead ? Math.max(0, st.lead - st.promisedLead) : 1;
        hyp.push({ text: `Perkiraan ETA (AI): ${U.date(ISO(T(sup.etaCurrent) + Math.max(1, Math.round(late)) * 24 * HR))} berdasarkan rata-rata keterlambatan pemasok.`, conf: 'Rendah' });
        const donors = s.stock.filter((x) => x.item === t.item && x.wh !== m.wh && x.onHand - x.reserved - x.min > 0).map((x) => ({ wh: x.wh, q: x.onHand - x.reserved - x.min }));
        recs.push(`Purchasing: konfirmasi ulang ETA & sisa ${sup.outstanding} unit ke ${S.supplierName(s, t.supplier)}, lalu catat ETA revisi + alasan.`);
        if (donors.length) recs.push(`Alternatif: transfer ${Math.min(sup.outstanding, donors[0].q)} unit dari ${S.whName(s, donors[0].wh)} (surplus ${donors[0].q}) bila ETA > 1 hari.`);
      }
    });
    if (w && w.stage === 'APPROVAL') {
      hyp.push({ text: 'Antrean persetujuan menumpuk di jam sibuk outlet (pola riwayat DEMO: persetujuan sore lebih lambat).', conf: 'Rendah' });
      recs.push(`Ingatkan ${HAWK.ROLE_LABEL[w.owner]}; bila lewat SLA, eskalasi ke ${w.escalate.map((r) => HAWK.ROLE_LABEL[r]).join(' → ')}.`);
    }
    if (w && w.stage === 'PURCHASING') recs.push('Purchasing: buat/konsolidasikan PO untuk kebutuhan ini (NV-32) atau gunakan Order Sederhana bila memenuhi AR-13.');
    if (w && ['RECEIPT', 'PUTAWAY', 'ISSUE'].includes(w.stage)) recs.push('Gudang: selesaikan posting/put-away/serah terima hari ini — barang sudah ada fisik.');
    const stockRow = S.stock(s, m.wh, m.lines[0].item);
    const risk = stockRow && stockRow.onHand - stockRow.reserved < stockRow.min && f.requested > f.issued;
    if (risk) hyp.push({ text: `Risiko stockout di ${S.whName(s, m.wh)}: stok tersedia di bawah minimum (${stockRow.onHand - stockRow.reserved}/${stockRow.min}).`, conf: 'Sedang' });
    return { facts, hyp, recs, label: 'AI SIMULATION — deterministik; hipotesis bukan fakta. AI tidak menyetujui, membayar, membuat PO, atau menyalahkan karyawan.' };
  };

  /* ---------------- issue engine (one issue per underlying problem) ---------------- */
  const priorityOf = (st, overall) => (st.sla === 'BREACH' && ((overall && overall.sla === 'BREACH') || st.breachH >= 24) ? 'P0' : st.sla === 'BREACH' ? 'P1' : 'P2');
  const autoReason = (s, j, st) => {
    if (st.stage === 'SUPPLIER' && st.received > 0 && st.outstanding > 0) return ['SUPPLIER_SHORT', `Supplier mengirim sebagian (${st.received}/${st.received + st.outstanding})`];
    if (st.stage === 'APPROVAL') return ['APPROVAL_WAIT', 'Menunggu persetujuan ' + HAWK.ROLE_LABEL[st.owner]];
    return null;
  };
  const impactOf = (s, j, st) => {
    const m = j.mrf;
    const t = st.track;
    const out = t && t.qty ? t.qty - (t.ready || 0) : j.fulfil.requested - j.fulfil.ready;
    const it = S.item(s, (t && t.item) || m.lines[0].item);
    return `${out} ${it.unit} ${it.name} untuk ${S.orgName(s, m.branch)} belum tersedia (${j.fulfil.issued}/${j.fulfil.requested} terpenuhi).`;
  };
  const recOf = (s, j, st) => {
    const a = F.ai(s, j);
    return a.recs[0] || 'Tinjau tahap ini dan catat alasan keterlambatan.';
  };
  F.sync = (s, ctx) => {
    s.flowIssues = s.flowIssues || [];
    const seen = new Set();
    s.mrfs.forEach((m) => {
      if (['DRAFT', 'REJECTED', 'CANCELLED'].includes(m.status)) return;
      const j = F.journey(s, m);
      j.active.filter((x) => x.sla === 'BREACH' || x.sla === 'RISK').forEach((st) => {
        const ref = (st.track && st.track.ref) || m.id;
        const key = `${m.id}|${ref}|${st.stage}`;
        seen.add(key);
        let is = s.flowIssues.find((i) => i.key === key && i.status !== 'RESOLVED');
        const pri = priorityOf(st, j.overall);
        if (!is) {
          const ar = autoReason(s, j, st);
          is = {
            id: 'IS-' + String(s.flowIssues.length + 1).padStart(4, '0'), key, mrf: m.id, ref, stage: st.stage, branch: m.branch, priority: pri, sla: st.sla, pic: st.owner, picUser: null, due: st.due, dueOriginal: st.due, breachH: st.breachH,
            status: 'OPEN', impact: impactOf(s, j, st), recommendation: recOf(s, j, st), reasonCode: ar ? ar[0] : null, reason: ar ? ar[1] : null, reasonAuto: !!ar, reasonRequired: !ar, evidence: [ref, m.id], escalation: 0, createdAt: ctx.now, history: [],
          };
          is.history.push({ ts: ctx.now, by: 'SYS-RULE', action: 'CREATE', note: `${st.sla === 'BREACH' ? 'SLA terlewati' : 'Mendekati SLA'} — ${F.STAGE_LABEL[st.stage]} (${st.policy})` });
          s.flowIssues.unshift(is);
        } else {
          is.sla = st.sla;
          is.breachH = st.breachH;
          is.impact = impactOf(s, j, st);
          if (is.status !== 'MONITORING' && is.priority !== pri && pri < is.priority) {
            is.history.push({ ts: ctx.now, by: 'SYS-RULE', action: 'PRIORITY', note: `${is.priority} → ${pri}` });
            is.priority = pri;
          }
          if (!is.reasonCode) {
            const ar = autoReason(s, j, st);
            if (ar) Object.assign(is, { reasonCode: ar[0], reason: ar[1], reasonAuto: true, reasonRequired: false });
          }
        }
      });
    });
    // close issues whose stage is no longer at risk (stage completed) — history kept, never deleted
    s.flowIssues.filter((i) => i.status !== 'RESOLVED' && !seen.has(i.key)).forEach((i) => {
      const m = s.mrfs.find((x) => x.id === i.mrf);
      if (!m) return;
      const j = F.journey(s, m);
      const still = j.active.find((x) => `${m.id}|${(x.track && x.track.ref) || m.id}|${x.stage}` === i.key);
      if (still) return; // still active but back within SLA after a time change — keep open
      i.status = 'RESOLVED';
      i.resolvedAt = ctx.now;
      i.resolvedBy = 'SYS-RULE';
      i.resolution = 'Tahap selesai — ditutup otomatis';
      i.resolutionH = hrs(T(ctx.now) - T(i.createdAt));
      i.history.push({ ts: ctx.now, by: 'SYS-RULE', action: 'AUTO_RESOLVE', note: i.resolution });
    });
  };

  /* hook: every successful engine operation re-evaluates SLAs (same transaction, rolled back on error) */
  HAWK.afterExec = HAWK.afterExec || [];
  HAWK.afterExec.push((s, op, ctx) => {
    if (op === 'flow.sync') return;
    F.sync(s, { user: { id: 'SYS-RULE', role: 'SYSTEM' }, now: F.now(s) });
  });

  /* ---------------- operations ---------------- */
  const MGR = ['OWNER', 'BU_MANAGER', 'HEAD_DIV'];
  const issueOf = (s, id) => get(s.flowIssues || [], id, 'Isu');
  const canWork = (ctx, is) => MGR.includes(ctx.user.role) || ctx.user.role === is.pic || (is.picUser && is.picUser === ctx.user.id);
  const touch = (s, ctx, is, action, note) => {
    is.history.push({ ts: ctx.now, by: ctx.user.id, action, note });
    if (is.status === 'OPEN') is.status = 'IN_PROGRESS';
    log(s, ctx, 'flow.' + action.toLowerCase(), is.id, `${is.mrf || is.ref} · ${note || action}`);
  };
  H['flow.sync'] = (s, p, ctx) => {
    F.sync(s, ctx);
    return s.flowIssues;
  };
  H['flow.review'] = (s, p, ctx) => {
    const is = issueOf(s, p.id);
    is.reviewed = (is.reviewed || []).concat({ by: ctx.user.id, ts: ctx.now });
    is.history.push({ ts: ctx.now, by: ctx.user.id, action: 'REVIEW', note: p.note || 'Ditinjau' });
    log(s, ctx, 'flow.review', is.id, 'Ditinjau');
    return is;
  };
  H['flow.assign'] = (s, p, ctx) => {
    const is = issueOf(s, p.id);
    need(MGR.includes(ctx.user.role) || ctx.user.role === is.pic, 'FORBIDDEN', 'Hanya manajer atau PIC tahap yang dapat menugaskan');
    const u = S.user(s, p.user);
    need(u, 'VALIDATION', 'Pilih pengguna');
    is.picUser = u.id;
    is.pic = u.role;
    touch(s, ctx, is, 'ASSIGN', `Ditugaskan ke ${u.name} (${HAWK.ROLE_LABEL[u.role]})`);
    return is;
  };
  H['flow.requestUpdate'] = (s, p, ctx) => {
    const is = issueOf(s, p.id);
    need(MGR.includes(ctx.user.role) || ['SUPERVISOR', 'PURCHASING', 'WAREHOUSE', 'FINANCE'].includes(ctx.user.role), 'FORBIDDEN', 'Role ini tidak dapat meminta update');
    need(p.note && p.note.trim().length >= 3, 'VALIDATION', 'Isi pesan permintaan update');
    is.updateRequests = (is.updateRequests || 0) + 1;
    touch(s, ctx, is, 'REQUEST_UPDATE', p.note.trim());
    return is;
  };
  H['flow.escalate'] = (s, p, ctx) => {
    const is = issueOf(s, p.id);
    need(MGR.includes(ctx.user.role) || ['SUPERVISOR', 'PURCHASING', 'WAREHOUSE', 'FINANCE'].includes(ctx.user.role), 'FORBIDDEN', 'Role ini tidak dapat mengeskalasi');
    need(p.note && p.note.trim().length >= 5, 'VALIDATION', 'Alasan eskalasi wajib');
    const pol = F.policy(s, is.stage) || { escalate: ['BU_MANAGER'] };
    need(is.escalation < pol.escalate.length, 'STATE', 'Sudah di tingkat eskalasi tertinggi');
    const to = pol.escalate[is.escalation];
    is.escalation += 1;
    is.escalatedTo = to;
    is.status = 'ESCALATED';
    if (is.priority > 'P1') is.priority = 'P1';
    is.history.push({ ts: ctx.now, by: ctx.user.id, action: 'ESCALATE', note: `→ ${HAWK.ROLE_LABEL[to]}: ${p.note.trim()}` });
    log(s, ctx, 'flow.escalate', is.id, `Eskalasi ke ${to}`);
    return is;
  };
  H['flow.recordReason'] = (s, p, ctx) => {
    const is = issueOf(s, p.id);
    need(canWork(ctx, is), 'FORBIDDEN', `Hanya PIC (${HAWK.ROLE_LABEL[is.pic]}) atau manajer`);
    need(F.REASONS.some((r) => r[0] === p.code), 'VALIDATION', 'Pilih kategori alasan');
    need(p.note && p.note.trim().length >= 5, 'VALIDATION', 'Penjelasan alasan minimal 5 karakter');
    Object.assign(is, { reasonCode: p.code, reason: p.note.trim(), reasonAuto: false, reasonRequired: false, reasonBy: ctx.user.id, evidence: U.uniq([...(is.evidence || []), ...(p.evidence ? [p.evidence] : [])]) });
    touch(s, ctx, is, 'RECORD_REASON', `${(F.REASONS.find((r) => r[0] === p.code) || [])[1]}: ${p.note.trim()}`);
    return is;
  };
  H['flow.changeEta'] = (s, p, ctx) => {
    const po = get(s.pos, p.po, 'PO');
    need(['PURCHASING', ...MGR].includes(ctx.user.role), 'FORBIDDEN', 'Hanya Purchasing atau manajer');
    need(['SENT', 'PARTIAL'].includes(po.status), 'STATE', 'PO tidak sedang menunggu pengiriman');
    need(/^\d{4}-\d{2}-\d{2}$/.test(p.eta || ''), 'VALIDATION', 'Tanggal ETA tidak valid');
    need(p.eta >= F.now(s).slice(0, 10), 'VALIDATION', 'ETA baru tidak boleh di masa lalu');
    need(p.reason && p.reason.trim().length >= 5, 'VALIDATION', 'Alasan perubahan ETA wajib (min. 5 karakter)');
    po.etaHistory = po.etaHistory || [];
    const before = po.eta || po.promised;
    need(before !== p.eta, 'VALIDATION', 'ETA sama dengan sebelumnya');
    po.etaHistory.push({ ts: ctx.now, by: ctx.user.id, from: before, to: p.eta, reason: p.reason.trim() });
    po.eta = p.eta; // po.promised (original due date) is NEVER changed
    hist(po, ctx, 'ETA_REVISED', `${before} → ${p.eta}: ${p.reason.trim()}`);
    (s.flowIssues || []).filter((i) => i.ref === po.id && i.status !== 'RESOLVED').forEach((i) => {
      i.etaRevised = p.eta;
      if (!i.reasonCode || i.reasonAuto) Object.assign(i, { reasonCode: p.code || i.reasonCode || 'SUPPLIER_LATE', reason: p.reason.trim(), reasonRequired: false, reasonBy: ctx.user.id });
      i.status = 'MONITORING';
      i.history.push({ ts: ctx.now, by: ctx.user.id, action: 'CHANGE_ETA', note: `ETA ${before} → ${p.eta} (jatuh tempo SLA asli ${i.dueOriginal} tetap)` });
    });
    log(s, ctx, 'flow.changeEta', po.id, `ETA ${before} → ${p.eta}`);
    return po;
  };
  H['flow.resolve'] = (s, p, ctx) => {
    const is = issueOf(s, p.id);
    need(canWork(ctx, is), 'FORBIDDEN', `Hanya PIC (${HAWK.ROLE_LABEL[is.pic]}) atau manajer`);
    need(is.status !== 'RESOLVED', 'STATE', 'Isu sudah selesai');
    need(!is.reasonRequired, 'VALIDATION', 'Catat alasan keterlambatan dulu — penyebab tidak dapat ditentukan otomatis');
    need(p.note && p.note.trim().length >= 5, 'VALIDATION', 'Catatan penyelesaian wajib');
    is.status = 'RESOLVED';
    is.resolvedAt = ctx.now;
    is.resolvedBy = ctx.user.id;
    is.resolution = p.note.trim();
    is.resolutionH = hrs(T(ctx.now) - T(is.createdAt));
    is.history.push({ ts: ctx.now, by: ctx.user.id, action: 'RESOLVE', note: p.note.trim() });
    log(s, ctx, 'flow.resolve', is.id, p.note.trim());
    return is;
  };
  H['flow.updateSla'] = (s, p, ctx) => {
    need(['OWNER', 'ADMIN', 'BU_MANAGER'].includes(ctx.user.role), 'FORBIDDEN', 'Hanya Owner, BU Manager, atau Admin');
    const pol = get(s.slaPolicies, p.id, 'Kebijakan SLA');
    need(p.note && p.note.trim().length >= 5, 'VALIDATION', 'Alasan perubahan wajib');
    const before = { hours: pol.hours, warn: pol.warn, active: pol.active };
    const after = { hours: p.hours === undefined ? pol.hours : +p.hours, warn: p.warn === undefined ? pol.warn : +p.warn, active: p.active === undefined ? pol.active : !!p.active };
    if (pol.basis !== 'PROMISED') need(after.hours > 0 && after.hours <= 720, 'VALIDATION', 'Jam SLA 1–720');
    need(after.warn > 0 && after.warn < 1, 'VALIDATION', 'Ambang peringatan 0–1 (mis. 0,8)');
    need(JSON.stringify(before) !== JSON.stringify(after), 'VALIDATION', 'Tidak ada perubahan');
    Object.assign(pol, after);
    pol.version += 1;
    pol.changes.unshift({ ts: ctx.now, by: ctx.user.id, before, after, note: p.note.trim() });
    log(s, ctx, 'flow.updateSla', pol.id, `v${pol.version}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
    return pol;
  };
  H['flow.setWeights'] = (s, p, ctx) => {
    need(['OWNER', 'ADMIN'].includes(ctx.user.role), 'FORBIDDEN', 'Hanya Owner atau Admin');
    const w = p.weights || {};
    const keys = ['onTime', 'activeSla', 'p90', 'data'];
    need(keys.every((k) => w[k] >= 0 && w[k] <= 1), 'VALIDATION', 'Bobot 0–1');
    need(Math.abs(keys.reduce((t, k) => t + +w[k], 0) - 1) < 0.001, 'VALIDATION', 'Total bobot harus 100%');
    need(p.note && p.note.trim().length >= 5, 'VALIDATION', 'Alasan perubahan wajib');
    const before = { ...s.flowConfig.weights };
    s.flowConfig.weights = Object.fromEntries(keys.map((k) => [k, +w[k]]));
    s.flowConfig.version += 1;
    s.flowConfig.changes.unshift({ ts: ctx.now, by: ctx.user.id, before, after: s.flowConfig.weights, note: p.note.trim() });
    log(s, ctx, 'flow.setWeights', 'PFHI', `v${s.flowConfig.version}`);
    return s.flowConfig;
  };
  H['demo.advanceClock'] = (s, p, ctx) => {
    const h = +p.hours;
    need(h > 0 && h <= 240, 'VALIDATION', 'Lompatan 1–240 jam');
    s.meta.offsetMin = (s.meta.offsetMin || 0) + h * 60;
    log(s, ctx, 'demo.advanceClock', 'DEMO', `Simulasi waktu +${h} jam → ${F.now(s)}`);
    return { now: F.now(s) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
