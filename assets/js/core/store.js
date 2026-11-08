/* HAWK × JAENS Prototype — Central DEMO state engine.
   Single shared data model for every module. All mutations go through HAWK.api.call(op, payload)
   (see adapter.js) which dispatches to the handlers below in MOCK mode.
   This file is DOM-free so it can run in Node for automated workflow tests. */
(function (root) {
  'use strict';
  const HAWK = (root.HAWK = root.HAWK || {});
  const U = HAWK.U;

  class HawkError extends Error {
    constructor(code, message, detail) {
      super(message);
      this.code = code;
      this.detail = detail;
    }
  }
  HAWK.HawkError = HawkError;
  const fail = (code, msg, detail) => {
    throw new HawkError(code, msg, detail);
  };

  /* ======================= SELECTORS (pure reads) ======================= */
  const S = {};
  S.item = (s, id) => s.items.find((i) => i.id === id);
  S.itemName = (s, id) => (S.item(s, id) || {}).name || id;
  S.org = (s, id) => s.org.find((o) => o.id === id);
  S.orgName = (s, id) => (S.org(s, id) || {}).name || id;
  S.wh = (s, id) => s.warehouses.find((w) => w.id === id);
  S.whName = (s, id) => (S.wh(s, id) || {}).name || id;
  S.user = (s, id) => s.users.find((u) => u.id === id);
  S.userName = (s, id) => (id === 'SYS-RULE' ? 'Sistem (aturan AR-13)' : (S.user(s, id) || {}).name || id || '—');
  S.supplier = (s, id) => s.suppliers.find((x) => x.id === id);
  S.supplierName = (s, id) => (S.supplier(s, id) || {}).name || id;
  S.buOf = (s, orgId) => {
    let o = S.org(s, orgId);
    while (o && o.type !== 'BU' && o.type !== 'OFFICE') o = S.org(s, o.parent);
    return o ? o.id : null;
  };
  /* Where an account is assigned (from its org scope) — used to auto-fill who / outlet / division / BU on every order & receipt.
     Never taken from the form: the backend derives it from the logged-in account. */
  S.assignment = (s, u) => {
    u = typeof u === 'string' ? S.user(s, u) : u;
    if (!u) return null;
    const home = (u.scope || []).map((x) => S.org(s, x)).filter(Boolean);
    const unit = home.find((o) => o.type === 'BRANCH') || home.find((o) => o.type === 'DIVISION') || home[0] || null;
    const up = (type) => { let o = unit; while (o && o.type !== type) o = S.org(s, o.parent); return o; };
    const branch = unit && unit.type === 'BRANCH' ? unit : null;
    const div = up('DIVISION');
    let bu = unit;
    while (bu && bu.type !== 'BU' && bu.type !== 'OFFICE') bu = S.org(s, bu.parent);
    return {
      user: u.id, name: u.name, title: u.title || '', role: u.role,
      branch: branch ? branch.id : null, branchName: branch ? branch.name : home.length > 1 ? 'Multi-unit' : unit ? unit.name : '—',
      division: div ? div.name : '—',
      dept: u.dept || '—',
      reportsTo: u.reportsTo || null, reportsToName: u.reportsTo ? (S.user(s, u.reportsTo) || {}).name || u.reportsTo : null,
      bu: bu ? bu.id : null, buName: bu ? bu.name : home.length > 1 ? home.map((o) => o.name).join(', ') : '—',
      single: home.length === 1 && !!branch,
    };
  };
  S.assignmentText = (a) => (a ? [a.name, a.title, a.branchName, a.division && a.division !== '—' ? 'Divisi ' + a.division : '', a.dept && a.dept !== '—' ? 'Dept. ' + a.dept : '', a.buName].filter(Boolean).join(' · ') : '—');
  S.branches = (s, opts = {}) => s.org.filter((o) => o.type === 'BRANCH' && (opts.all || o.status === 'ACTIVE'));
  S.bus = (s) => s.org.filter((o) => (o.type === 'BU' || o.type === 'OFFICE') && o.scope === 'IN' && o.status === 'ACTIVE');
  S.whOfOrg = (s, orgId) => s.warehouses.find((w) => w.org === orgId);
  S.ccOfOrg = (s, orgId) => s.costCenters.find((c) => c.org === orgId);
  S.stock = (s, wh, item) => s.stock.find((x) => x.wh === wh && x.item === item);
  S.available = (s, wh, item) => {
    const r = S.stock(s, wh, item);
    return r ? Math.max(0, r.onHand - r.reserved) : 0;
  };
  S.totalStock = (s, item) => U.sum(s.stock.filter((x) => x.item === item), (x) => x.onHand);
  S.avgCost = (s, item) => (S.item(s, item) || {}).price || 0;

  S.lineValue = (s, line) => line.qty * S.avgCost(s, line.item);
  S.mrfValue = (s, m) => U.sum(m.lines, (l) => S.lineValue(s, l));

  /* Item budget (monthly BHP qty/value) — Workflow 03 */
  S.itemBudget = (s, branch, item, period = s.meta.period) => {
    const b = s.itemBudgets.find((x) => x.branch === branch && x.item === item && x.period === period);
    if (!b) return null;
    const cc = (S.ccOfOrg(s, branch) || {}).id;
    const issuedQty = -U.sum(
      s.ledger.filter((l) => l.type === 'ISSUE' && l.item === item && l.cc === cc && l.ts.slice(0, 7) === period && l.note !== 'Seed history'),
      (l) => l.qty
    );
    const actualQty = b.baseActualQty + issuedQty;
    // Commitment = approved MRF quantity not yet issued (demand-side). PO lines tied to MRFs are NOT added again (no double count).
    let commitQty = 0;
    let pendingQty = 0;
    s.mrfs
      .filter((m) => m.branch === branch && m.date.slice(0, 7) === period)
      .forEach((m) =>
        m.lines
          .filter((l) => l.item === item)
          .forEach((l) => {
            const issued = U.sum(l.alloc || [], (a) => a.issuedQty);
            if (['APPROVED', 'IN_FULFILLMENT'].includes(m.status)) commitQty += l.qty - issued;
            if (['SUBMITTED', 'ESCALATED'].includes(m.status)) pendingQty += l.qty;
          })
      );
    const price = S.avgCost(s, item);
    return { ...b, price, actualQty, commitQty, pendingQty, availableQty: b.qty - actualQty - commitQty, actualValue: actualQty * price, commitValue: commitQty * price };
  };

  S.mrfBudgetCheck = (s, m) => {
    const lines = m.lines.map((l) => {
      const it = S.item(s, l.item);
      if (!it.routine || m.type === 'NON_ROUTINE') return { item: l.item, kind: 'NON_ROUTINE', status: 'EXCEPTION_TRACK', qty: l.qty, value: l.qty * it.price };
      const b = S.itemBudget(s, m.branch, l.item);
      if (!b) return { item: l.item, kind: 'ROUTINE', status: 'NO_BUDGET', qty: l.qty, value: l.qty * it.price };
      // if this MRF is already approved its qty sits in commitQty; otherwise add it as projected
      const already = ['APPROVED', 'IN_FULFILLMENT', 'FULFILLED'].includes(m.status);
      const inPending = ['SUBMITTED', 'ESCALATED'].includes(m.status);
      const outstandingThis = already ? 0 : l.qty;
      const projectedQty = b.actualQty + b.commitQty + outstandingThis;
      const ratio = projectedQty / b.qty;
      const status = ratio > 1 ? 'OVER' : ratio >= 0.9 ? 'WARN' : 'OK';
      return { item: l.item, kind: 'ROUTINE', status, qty: l.qty, value: l.qty * it.price, budget: b, projectedQty, ratio, otherPendingQty: b.pendingQty - (inPending ? l.qty : 0) };
    });
    const worst = lines.some((x) => x.status === 'OVER' || x.status === 'NO_BUDGET') ? 'OVER' : lines.some((x) => x.status === 'EXCEPTION_TRACK') ? 'EXCEPTION' : lines.some((x) => x.status === 'WARN') ? 'WARN' : 'OK';
    return { lines, status: worst };
  };

  S.ancestors = (s, orgId) => { const out = []; let o = S.org(s, orgId); while (o) { out.push(o.id); o = S.org(s, o.parent); } return out; };
  /* Assistant Operational Manager covering this unit (Owner 8 Nov 2026: Spa MRF goes via the Assistant OM before the Operational Manager) */
  S.asstOmFor = (s, orgId) => { const up = S.ancestors(s, orgId); return s.users.find((u) => u.position === 'ASST_OM' && u.active !== false && (u.scope || []).some((x) => up.includes(x))) || null; };
  /* Can this user act on this approval step of this MRF? One rule for engine, inbox and buttons. */
  S.canApproveStep = (s, u, step, m) => {
    if (!u || !step) return false;
    if (step === 'ASST_OM') return u.position === 'ASST_OM' && (u.scope || []).some((x) => S.ancestors(s, m.branch).includes(x));
    if (step === 'HEAD_DIV' && u.position === 'ASST_OM') return false; // the assistant does not also sign as Operational Manager
    if (step !== u.role) return false;
    if (u.role === 'SUPERVISOR') return (u.scope || []).includes(m.branch);
    return true;
  };
  /* Approval chain from the configurable approval matrix (NV-09) */
  S.mrfChain = (s, m) => {
    const v = S.mrfValue(s, m);
    const tier = s.approvalRules.filter((r) => r.doc === 'MRF' && r.active).find((r) => v > r.min - (r.min === 0 ? 1 : 0) && (r.max === null || v <= r.max)) ||
      s.approvalRules.find((r) => r.id === 'AR-01');
    const chain = tier.chain.slice();
    const bc = S.mrfBudgetCheck(s, m);
    const exc = s.approvalRules.find((r) => r.doc === 'MRF_EXCEPTION' && r.active);
    if (exc && (bc.status === 'OVER' || bc.status === 'EXCEPTION')) exc.chain.forEach((r) => !chain.includes(r) && chain.push(r));
    const hd = chain.indexOf('HEAD_DIV');
    if (hd >= 0 && S.asstOmFor(s, m.branch)) chain.splice(hd, 0, 'ASST_OM');
    return { chain, rule: tier.id, exception: bc.status === 'OVER' || bc.status === 'EXCEPTION' };
  };
  S.mrfNextApprover = (s, m) => {
    if (!['SUBMITTED', 'ESCALATED'].includes(m.status)) return null;
    const chain = m.chain || S.mrfChain(s, m).chain;
    const done = (m.approvals || []).length;
    return chain[done] || null;
  };

  S.mrfFulfillment = (s, m) => {
    const req = U.sum(m.lines, (l) => l.qty);
    const all = m.lines.flatMap((l) => l.alloc || []);
    const byPath = (p) => all.filter((a) => a.path === p);
    const agg = (arr) => ({ qty: U.sum(arr, (a) => a.qty), ready: U.sum(arr, (a) => a.readyQty), issued: U.sum(arr, (a) => a.issuedQty) });
    return {
      requested: req,
      allocated: U.sum(all, (a) => a.qty),
      ready: U.sum(all, (a) => a.readyQty),
      issued: U.sum(all, (a) => a.issuedQty),
      LOCAL: agg(byPath('LOCAL')),
      TRANSFER: agg(byPath('TRANSFER')),
      PURCHASE: agg(byPath('PURCHASE')),
    };
  };

  S.poTotals = (s, po) => {
    const subtotal = U.sum(po.lines, (l) => l.qty * l.price * (1 - (l.disc || 0)));
    const tax = Math.round(subtotal * (po.taxRate || 0));
    return { subtotal, tax, freight: po.freight || 0, total: subtotal + tax + (po.freight || 0) };
  };
  S.poChain = (s, po) => {
    const t = S.poTotals(s, po).total;
    const rule = po.emergency
      ? s.approvalRules.find((r) => r.doc === 'EMERGENCY_PO')
      : s.approvalRules.filter((r) => r.doc === 'PO' && r.active).find((r) => t > r.min - (r.min === 0 ? 1 : 0) && (r.max === null || t <= r.max));
    return rule ? rule.chain.slice() : ['PURCHASING'];
  };
  /* NV-09 route simulator (pattern from Module B reference) — read-only, uses ACTIVE rules only */
  S.routeSim = (s, doc, amount, over) => {
    const v = +amount || 0;
    const rules = s.approvalRules.filter((r) => r.doc === doc && r.active);
    const tier = rules.find((r) => v > r.min - (r.min === 0 ? 1 : 0) && (r.max === null || v <= r.max));
    if (!tier) return { ok: false, chain: [], note: rules.length ? 'Nilai di luar semua rentang aturan aktif — tidak ada rute; perlu keputusan Owner' : 'Tidak ada aturan aktif untuk dokumen ini' };
    const chain = tier.chain.slice();
    const exc = doc === 'MRF' && over && s.approvalRules.find((r) => r.doc === 'MRF_EXCEPTION' && r.active);
    if (exc) exc.chain.forEach((r) => !chain.includes(r) && chain.push(r));
    return { ok: true, rule: tier, chain, exception: !!exc, post: tier.postApproval || null };
  };
  S.poNextApprover = (s, po) => (po.status === 'PENDING_APPROVAL' ? (po.chain || S.poChain(s, po))[(po.approvals || []).length] || null : null);

  /* 7P budget with dynamic actual/commitment/forecast — Workflow 01 / NV-23 */
  S.monthsElapsed = (s) => {
    const [, m, d] = s.meta.demoDate.split('-').map(Number);
    return m - 1 + d / 30;
  };
  S.dynamicActual = (s, bu, p) => {
    // consumption of inventory items (expense recognized at issue, not at PO or receipt)
    let v = 0;
    s.ledger.forEach((l) => {
      if (l.type !== 'ISSUE' || l.note === 'Seed history') return;
      const cc = s.costCenters.find((c) => c.id === l.cc);
      if (!cc || S.buOf(s, cc.org) !== bu) return;
      const it = S.item(s, l.item);
      if (it && it.p === p) v += -l.qty * it.price;
    });
    // maintenance work orders completed (direct OPEX Facility)
    if (p === 'FACILITY')
      s.workOrders.forEach((w) => {
        if (w.status === 'COMPLETED' && w.completedAt >= '2026-11-08' && S.buOf(s, (S.asset(s, w.asset) || {}).org) === bu) v += w.cost || 0;
      });
    return v;
  };
  S.dynamicCommit = (s, bu, p) => {
    let v = 0;
    s.mrfs.forEach((m) => {
      if (!['APPROVED', 'IN_FULFILLMENT'].includes(m.status) || S.buOf(s, m.branch) !== bu) return;
      m.lines.forEach((l) => {
        const it = S.item(s, l.item);
        if (it.p !== p) return;
        v += (l.qty - U.sum(l.alloc || [], (a) => a.issuedQty)) * it.price;
      });
    });
    return v;
  };
  S.budgetView = (s, id) => {
    const b = s.budgets.find((x) => x.id === id);
    if (!b) return null;
    const me = b.fy === 2026 ? S.monthsElapsed(s) : 0;
    const lines = b.lines.map((l) => {
      const dynA = b.fy === 2026 && l.cls === 'OPEX' ? S.dynamicActual(s, b.bu, l.p) : 0;
      const dynC = b.fy === 2026 && l.cls === 'OPEX' ? S.dynamicCommit(s, b.bu, l.p) : 0;
      const actual = l.baseActual + dynA;
      const commitment = l.baseCommit + dynC;
      const runRate = me ? l.baseActual / me : 0;
      const forecast = b.fy === 2026 ? Math.max(actual + commitment, actual + runRate * (12 - me)) : l.revised;
      return { ...l, actual, commitment, forecast, remaining: l.revised - actual - commitment, utilization: l.revised ? (actual + commitment) / l.revised : 0, dynActual: dynA, dynCommit: dynC };
    });
    const spend = lines.filter((l) => l.cls !== 'OUTCOME');
    const tot = (k) => U.sum(spend, (l) => l[k]);
    return { ...b, lines, totals: { original: tot('original'), revised: tot('revised'), actual: tot('actual'), commitment: tot('commitment'), forecast: tot('forecast') }, profit: lines.find((l) => l.cls === 'OUTCOME') };
  };

  S.asset = (s, id) => s.assets.find((a) => a.id === id);
  S.depreciation = (s, a, asOf = s.meta.demoDate) => {
    const months = Math.max(0, (Date.parse(asOf) - Date.parse(a.acquired)) / (30.4375 * 864e5));
    const monthly = a.cost / a.life;
    const acc = Math.min(a.cost, monthly * Math.floor(months));
    return { monthly, accumulated: acc, book: a.cost - acc, ageRatio: Math.min(1, months / a.life) };
  };

  /* Find any record by ID (drill-down engine) */
  S.findRecord = (s, id) => {
    if (!id) return null;
    const tables = [
      ['MRF', s.mrfs], ['PO', s.pos], ['TRANSFER', s.transfers], ['GRN', s.grns], ['DOC', s.docs], ['BILL', s.bills], ['JOURNAL', s.journals],
      ['ASSET', s.assets], ['MAINT', s.maintenance], ['WO', s.workOrders], ['ITEM', s.items], ['SUPPLIER', s.suppliers], ['PROJECT', s.projects],
      ['BUDGET', s.budgets], ['REVISION', s.budgetRevisions], ['OPNAME', s.opnames || []], ['PAYMENT', s.payments], ['TARGET', s.targets],
    ];
    for (const [type, arr] of tables) {
      const r = arr.find((x) => x.id === id);
      if (r) return { type, rec: r };
    }
    return null;
  };

  /* Trace graph — every document linked to an origin (audit requirement #7) */
  S.trace = (s, id) => {
    const seen = new Set();
    const out = [];
    const add = (x) => {
      if (!x || seen.has(x)) return;
      seen.add(x);
      out.push(x);
    };
    const visit = (x, depth) => {
      if (!x || depth > 6 || seen.has(x)) return;
      add(x);
      const f = S.findRecord(s, x);
      if (!f) return;
      const r = f.rec;
      const next = [];
      if (f.type === 'MRF') {
        r.lines.forEach((l) => (l.alloc || []).forEach((a) => a.ref && next.push(a.ref)));
        s.workOrders.forEach((w) => (w.parts || []).forEach((p) => p.mrf === r.id && next.push(w.id)));
      }
      if (f.type === 'PO') {
        r.lines.forEach((l) => (l.mrfRefs || []).forEach((m) => next.push(m.mrf)));
        s.grns.filter((g) => g.po === r.id).forEach((g) => next.push(g.id));
        s.bills.filter((b) => b.po === r.id).forEach((b) => next.push(b.id));
        s.docs.filter((d) => d.matchedPo === r.id).forEach((d) => next.push(d.id));
      }
      if (f.type === 'TRANSFER' && r.mrf) next.push(r.mrf);
      if (f.type === 'GRN') {
        next.push(r.po);
        s.journals.filter((j) => j.source === r.id).forEach((j) => next.push(j.id));
      }
      if (f.type === 'DOC') {
        if (r.matchedPo) next.push(r.matchedPo);
        if (r.bill) next.push(r.bill);
      }
      if (f.type === 'BILL') {
        if (r.po) next.push(r.po);
        if (r.grn) next.push(r.grn);
        if (r.doc) next.push(r.doc);
        s.journals.filter((j) => j.source === r.id).forEach((j) => next.push(j.id));
        s.payments.filter((p) => p.bill === r.id).forEach((p) => next.push(p.id));
      }
      if (f.type === 'JOURNAL') next.push(r.source);
      if (f.type === 'PAYMENT') next.push(r.bill);
      if (f.type === 'MAINT' && r.wo) next.push(r.wo);
      if (f.type === 'WO') {
        next.push(r.mt);
        next.push(r.asset);
        (r.parts || []).forEach((p) => p.mrf && next.push(p.mrf));
      }
      next.forEach((n) => visit(n, depth + 1));
    };
    visit(id, 0);
    return out;
  };

  /* ======================= DOMAIN HANDLERS (mock engine) ======================= */
  const H = {};
  const log = (s, ctx, op, ref, detail) => {
    s.audit.unshift({ id: 'AU-' + String(s.audit.length + 1).padStart(5, '0'), ts: ctx.now, user: ctx.user.id, role: ctx.user.role, op, ref, detail });
  };
  const hist = (rec, ctx, action, note) => (rec.history = rec.history || []).push({ ts: ctx.now, by: ctx.user.id, action, note });
  const need = (cond, code, msg) => {
    if (!cond) fail(code, msg);
  };
  const get = (arr, id, label) => {
    const r = arr.find((x) => x.id === id);
    if (!r) fail('NOT_FOUND', `${label} ${id} tidak ditemukan`);
    return r;
  };
  const stockRow = (s, wh, item) => {
    let r = S.stock(s, wh, item);
    if (!r) {
      r = { wh, item, onHand: 0, reserved: 0, min: 0, max: 0, bin: null };
      s.stock.push(r);
    }
    return r;
  };
  const ledger = (s, ctx, e) => {
    const id = 'LG-' + String(s.ledger.length + 1).padStart(4, '0');
    s.ledger.unshift({ id, ts: ctx.now, by: ctx.user.id, ...e });
    return id;
  };
  const journal = (s, ctx, source, kind, lines, memo) => {
    const id = U.nextId(s, 'JV');
    const dr = U.sum(lines, (l) => l.dr);
    const cr = U.sum(lines, (l) => l.cr);
    if (Math.round(dr) !== Math.round(cr)) fail('UNBALANCED', 'Jurnal tidak seimbang');
    s.journals.unshift({ id, ts: ctx.now, source, kind, status: 'PENDING_REVIEW', memo, lines });
    return id;
  };
  const P_ACC = { PRODUCT: '6100 Beban BHP — Product', FACILITY: '6110 Beban BHP — Facility', PLACE: '6120 Beban Kebersihan — Place', PROMOTION: '6130 Beban Promosi', PEOPLE: '6140 Beban SDM', PROCESS: '6150 Beban Proses & Sistem' };

  /* ---- Organization (Module B) ---- */
  H['org.upsertUnit'] = (s, p, ctx) => {
    need(p.name && p.type && p.parent, 'VALIDATION', 'Nama, tipe dan parent wajib diisi');
    if (p.id) {
      const o = get(s.org, p.id, 'Unit');
      if (p.code && p.code.toUpperCase() !== o.code) need(!s.org.some((x) => x.id !== o.id && x.code === p.code.toUpperCase()), 'DUPLICATE', 'Kode sudah dipakai unit lain — pilih kode unik');
      if (p.parent && p.parent !== o.parent) {
        // Module B reference rules: no circular hierarchy, parent must be ACTIVE
        let cur = p.parent;
        while (cur) { need(cur !== o.id, 'CIRCULAR', 'Hierarki melingkar tidak diizinkan'); const u = S.org(s, cur); cur = u && u.parent; }
        need((S.org(s, p.parent) || {}).status === 'ACTIVE', 'VALIDATION', 'Parent harus berstatus aktif');
        o.parent = p.parent;
      }
      Object.assign(o, { name: p.name, code: p.code ? p.code.toUpperCase() : o.code, location: p.location || o.location });
      log(s, ctx, 'org.upsertUnit', o.id, 'Ubah unit');
      return o;
    }
    const prefix = { BRANCH: 'BR', DIVISION: 'DV', BU: 'BU' }[p.type] || 'OR';
    const code = (p.code || p.name.replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase();
    const id = `${prefix}-${code}`;
    need(!S.org(s, id) && !s.org.some((x) => x.code === code), 'DUPLICATE', 'Kode unit sudah dipakai');
    need((S.org(s, p.parent) || {}).status === 'ACTIVE', 'VALIDATION', 'Parent harus berstatus aktif');
    const o = { id, type: p.type, code, name: p.name, parent: p.parent, status: 'ACTIVE', scope: 'IN', location: p.location };
    s.org.push(o);
    s.costCenters.push({ id: `CC-${code}-OPS`, name: 'Operasional ' + p.name, org: id });
    if (p.type === 'BRANCH' && p.createWarehouse !== false) {
      s.warehouses.push({ id: 'WH-' + code, name: 'Gudang ' + p.name, org: id, racks: ['A'], bins: [1, 2, 3].map((n) => `${code}-A-0${n}`) });
    }
    log(s, ctx, 'org.upsertUnit', id, 'Tambah unit ' + p.name);
    return o;
  };
  H['org.setStatus'] = (s, p, ctx) => {
    const o = get(s.org, p.id, 'Unit');
    need(o.type !== 'GROUP', 'FORBIDDEN', 'Grup tidak dapat diarsipkan');
    if (p.status === 'ARCHIVED') {
      const open = s.mrfs.some((m) => m.branch === o.id && ['SUBMITTED', 'APPROVED', 'IN_FULFILLMENT'].includes(m.status));
      need(!open, 'HAS_OPEN_TX', 'Unit masih memiliki MRF terbuka — selesaikan dulu sebelum diarsipkan');
      const whs = s.warehouses.filter((w) => w.org === o.id).map((w) => w.id);
      const openPo = s.pos.some((x) => whs.includes(x.deliverTo) && !['CLOSED', 'CANCELLED', 'RECEIVED'].includes(x.status));
      need(!openPo, 'HAS_OPEN_TX', 'Unit masih memiliki PO terbuka ke gudangnya');
      const kids = s.org.filter((x) => x.parent === o.id && x.status === 'ACTIVE');
      need(!kids.length, 'HAS_CHILDREN', 'Arsipkan dulu sub-unit aktif: ' + kids.map((x) => x.name).join(', '));
    } else if (p.status === 'ACTIVE' && o.parent) {
      need((S.org(s, o.parent) || {}).status === 'ACTIVE', 'VALIDATION', 'Aktifkan parent terlebih dahulu');
    }
    o.status = p.status;
    log(s, ctx, 'org.setStatus', o.id, p.status);
    return o;
  };
  H['cc.updateAllocation'] = (s, p, ctx) => {
    const a = s.sharedAllocations.find((x) => x.pool === p.pool);
    need(a, 'NOT_FOUND', 'Pool tidak ditemukan');
    need(!a.locked, 'LOCKED', 'Alokasi periode ini sudah dikunci Finance — buka kunci lewat prosedur koreksi (belum disimulasikan)');
    const total = U.sum(Object.values(p.splits));
    need(Math.abs(total - 1) < 0.0001, 'VALIDATION', 'Total persentase alokasi harus 100%');
    const before = JSON.stringify(a.splits);
    a.splits = p.splits;
    a.basis = p.basis || a.basis;
    a.reviews = {}; // a changed split must be reviewed again by every BU
    a.history = a.history || [];
    a.history.unshift({ ts: ctx.now, by: ctx.user.id, action: 'UPDATE', before, after: JSON.stringify(p.splits), note: p.note || '' });
    log(s, ctx, 'cc.updateAllocation', p.pool, JSON.stringify(p.splits));
    return a;
  };
  /* Shared office allocation workflow (MP-HAWK-09 scenario 6): Finance sets split → each BU reviews → Finance locks the period.
     No journal is posted here: the allocation basis feeds NV-52 reports only (posting rule TO VERIFY with HAWK Finance). */
  H['cc.reviewAllocation'] = (s, p, ctx) => {
    const a = s.sharedAllocations.find((x) => x.pool === p.pool);
    need(a, 'NOT_FOUND', 'Pool tidak ditemukan');
    need(!a.locked, 'LOCKED', 'Alokasi sudah dikunci');
    const bu = p.bu || ctx.user.scope.find((x) => a.splits[x] !== undefined);
    need(bu && a.splits[bu] !== undefined, 'VALIDATION', 'BU tidak termasuk dalam alokasi ini');
    if (ctx.user.role === 'BU_MANAGER') need(ctx.user.scope.includes(bu), 'FORBIDDEN', 'Hanya BU Manager unit terkait');
    need(['AGREE', 'DISPUTE'].includes(p.decision), 'VALIDATION', 'Pilih setuju atau keberatan');
    if (p.decision === 'DISPUTE') need(p.note && p.note.length >= 5, 'VALIDATION', 'Keberatan wajib disertai alasan');
    a.reviews = a.reviews || {};
    a.reviews[bu] = { by: ctx.user.id, at: ctx.now, decision: p.decision, note: p.note || '' };
    a.history = a.history || [];
    a.history.unshift({ ts: ctx.now, by: ctx.user.id, action: 'REVIEW_' + p.decision, note: `${bu}: ${p.note || ''}` });
    log(s, ctx, 'cc.reviewAllocation', p.pool, `${bu} ${p.decision}`);
    return a;
  };
  H['cc.lockAllocation'] = (s, p, ctx) => {
    const a = s.sharedAllocations.find((x) => x.pool === p.pool);
    need(a, 'NOT_FOUND', 'Pool tidak ditemukan');
    need(!a.locked, 'STATE', 'Sudah dikunci');
    const bus = Object.keys(a.splits).filter((k) => a.splits[k] > 0);
    const rv = a.reviews || {};
    const missing = bus.filter((b) => !rv[b]);
    need(!missing.length, 'VALIDATION', 'Menunggu review BU: ' + missing.join(', '));
    need(!bus.some((b) => rv[b].decision === 'DISPUTE'), 'VALIDATION', 'Ada keberatan BU — selesaikan dulu sebelum dikunci');
    a.locked = { by: ctx.user.id, at: ctx.now, period: p.period || s.meta.demoDate.slice(0, 7) };
    a.history = a.history || [];
    a.history.unshift({ ts: ctx.now, by: ctx.user.id, action: 'LOCK', note: 'Periode ' + a.locked.period });
    log(s, ctx, 'cc.lockAllocation', p.pool, 'Dikunci periode ' + a.locked.period);
    return a;
  };
  H['user.assignRole'] = (s, p, ctx) => {
    const u = get(s.users, p.id, 'Pengguna');
    need((HAWK.ROLES_ALL || []).includes(p.role), 'VALIDATION', 'Role tidak terdaftar');
    if (p.scope) need(Array.isArray(p.scope) && p.scope.length && p.scope.every((id) => S.org(s, id)), 'VALIDATION', 'Scope minimal 1 unit organisasi yang terdaftar');
    u.role = p.role;
    if (p.scope) u.scope = p.scope;
    log(s, ctx, 'user.assignRole', u.id, p.role);
    return u;
  };
  H['approval.updateRule'] = (s, p, ctx) => {
    const r = get(s.approvalRules, p.id, 'Aturan');
    if (p.min !== undefined) need(+p.min >= 0, 'VALIDATION', 'Batas minimum tidak boleh negatif');
    if (p.max !== undefined && p.max !== null) need(+p.max > +(p.min !== undefined ? p.min : r.min), 'VALIDATION', 'Batas maksimum harus lebih besar dari minimum');
    if (p.slaHours !== undefined) need(+p.slaHours > 0, 'VALIDATION', 'SLA harus > 0 jam');
    if (p.chain !== undefined) need(Array.isArray(p.chain) && p.chain.length, 'VALIDATION', 'Rantai minimal satu role');
    // Module B reference: an edit never changes the rule in force — it creates a DRAFT revision
    // that the Owner must publish (maker ≠ checker). The ACTIVE version keeps applying meanwhile.
    const changes = {};
    ['min', 'max', 'active', 'slaHours', 'chain'].forEach((k) => p[k] !== undefined && JSON.stringify(p[k]) !== JSON.stringify(r[k]) && (changes[k] = p[k]));
    need(Object.keys(changes).length, 'NO_CHANGE', 'Tidak ada perubahan');
    r.pending = { changes, by: ctx.user.id, ts: ctx.now, note: p.note || '' };
    log(s, ctx, 'approval.updateRule', r.id, 'Draft revisi aturan: ' + JSON.stringify(changes));
    return r;
  };
  H['approval.publishRule'] = (s, p, ctx) => {
    const r = get(s.approvalRules, p.id, 'Aturan');
    need(r.pending, 'STATE', 'Tidak ada draft revisi');
    need(r.pending.by !== ctx.user.id, 'SOD', 'Pembuat draft tidak boleh menerbitkan sendiri (maker-checker)');
    if (p.decision === 'APPROVE') {
      r.history = r.history || [];
      r.history.unshift({ ts: ctx.now, by: ctx.user.id, maker: r.pending.by, before: Object.fromEntries(Object.keys(r.pending.changes).map((k) => [k, r[k]])), after: r.pending.changes });
      Object.assign(r, r.pending.changes);
      r.version = (r.version || 1) + 1;
    }
    log(s, ctx, 'approval.publishRule', r.id, p.decision === 'APPROVE' ? 'Terbitkan v' + r.version : 'Tolak draft');
    r.pending = null;
    return r;
  };

  /* ---- Targets & Ambidex (Module C) ---- */
  H['target.save'] = (s, p, ctx) => {
    const t = get(s.targets, p.id, 'Target');
    need(['DRAFT', 'REVISION'].includes(t.status), 'LOCKED', 'Target yang sudah disetujui hanya dapat diubah lewat revisi');
    need(p.revenue > 0 && p.profit >= 0, 'VALIDATION', 'Revenue & profit harus valid');
    need(p.profit < p.revenue, 'VALIDATION', 'Target profit tidak boleh ≥ revenue');
    Object.assign(t, { revenue: +p.revenue, profit: +p.profit });
    log(s, ctx, 'target.save', t.id, 'Simpan target');
    return t;
  };
  H['target.submit'] = (s, p, ctx) => {
    const t = get(s.targets, p.id, 'Target');
    need(t.status === 'DRAFT', 'STATE', 'Hanya draft yang dapat diajukan');
    t.status = 'SUBMITTED';
    log(s, ctx, 'target.submit', t.id, 'Ajukan target');
    return t;
  };
  H['target.approve'] = (s, p, ctx) => {
    const t = get(s.targets, p.id, 'Target');
    need(t.status === 'SUBMITTED', 'STATE', 'Target belum diajukan');
    t.status = p.decision === 'REJECT' ? 'DRAFT' : 'APPROVED';
    log(s, ctx, 'target.approve', t.id, t.status);
    return t;
  };
  H['project.propose'] = (s, p, ctx) => {
    need(p.name && p.capex >= 0, 'VALIDATION', 'Nama & nilai investasi wajib');
    const n = s.projects.filter((x) => x.id.startsWith('PRJ-2027')).length + 1;
    const pr = { id: 'PRJ-2027-' + String(n).padStart(2, '0'), name: p.name, bu: p.bu, type: p.type, capex: +p.capex, opex: +p.opex || 0, status: 'PROPOSED', owner: ctx.user.id, payback: +p.payback || null, irr: p.irr ? +p.irr : null, milestones: [] };
    s.projects.push(pr);
    log(s, ctx, 'project.propose', pr.id, 'Ajukan proyek');
    return pr;
  };
  H['project.decide'] = (s, p, ctx) => {
    const pr = get(s.projects, p.id, 'Proyek');
    need(pr.status === 'PROPOSED', 'STATE', 'Proyek tidak dalam status usulan');
    pr.status = p.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    if (pr.status === 'APPROVED' && !pr.milestones.length)
      pr.milestones = [{ name: 'Business case final', due: '2027-01-15', progress: 0, status: 'NOT_STARTED' }, { name: 'Eksekusi', due: '2027-04-30', progress: 0, status: 'NOT_STARTED' }];
    log(s, ctx, 'project.decide', pr.id, pr.status);
    return pr;
  };
  H['project.milestone'] = (s, p, ctx) => {
    const pr = get(s.projects, p.id, 'Proyek');
    const m = pr.milestones[p.index];
    need(m, 'NOT_FOUND', 'Milestone tidak ditemukan');
    m.progress = Math.max(0, Math.min(1, p.progress));
    m.status = m.progress >= 1 ? 'DONE' : m.progress > 0 ? 'ON_TRACK' : 'NOT_STARTED';
    if (pr.milestones.every((x) => x.status === 'DONE')) pr.status = 'COMPLETED';
    else if (pr.status === 'APPROVED') pr.status = 'IN_PROGRESS';
    log(s, ctx, 'project.milestone', pr.id, `${m.name} ${Math.round(m.progress * 100)}%`);
    return pr;
  };

  /* ---- 7P Budget (Module D) ---- */
  const recalc = (b) => {
    if (b.plan) b.lines = HAWK.planToLines(b.plan);
  };
  S.budgetStage = (s, b) => {
    if (b.status === 'DRAFT') return 'Draft';
    if (b.status === 'LOCKED') return 'Locked';
    const chain = s.approvalRules.find((r) => r.doc === 'BUDGET').chain;
    const step = chain[(b.approvals || []).length];
    return { HEAD_DIV: 'Head Review', FINANCE: 'Finance Review', OWNER: 'Owner Review', BU_MANAGER: 'BU Manager Review' }[step] || step;
  };
  H['budget.upsertPlanLine'] = (s, p, ctx) => {
    const b = get(s.budgets, p.id, 'Budget');
    need(b.plan, 'STATE', 'Budget ini tidak memakai perencanaan per baris');
    need(b.status === 'DRAFT', 'LOCKED', 'Hanya budget Draft yang dapat diedit — budget terkunci direvisi lewat NV-22');
    const name = String(p.name || '').trim();
    need(name && +p.qty > 0 && +p.price >= 0, 'VALIDATION', 'Isi nama, kuantitas (> 0), dan harga dengan benar');
    need((p.p === 'PROFIT') === (p.kind === 'PERFORMANCE'), 'VALIDATION', 'Profit (P7) wajib memakai klasifikasi PERFORMANCE, dan PERFORMANCE hanya untuk Profit');
    need(HAWK.KIND_CLS[p.kind], 'VALIDATION', 'Jenis dana tidak dikenal');
    need(S.buOf(s, p.unit) === b.bu || p.unit === b.bu, 'VALIDATION', 'Unit harus milik BU budget ini');
    const amt = Math.round(+p.qty * +p.price);
    let l;
    if (p.line) {
      l = get(b.plan, p.line, 'Baris budget');
      need(l.unit === p.unit, 'VALIDATION', 'Unit baris tidak dapat dipindah — buat baris baru');
      need(l.p === p.p, 'VALIDATION', 'Kategori 7P baris existing dijaga untuk audit — buat baris baru');
      Object.assign(l, { name, qty: +p.qty, price: +p.price, kind: p.kind, stream: p.stream || l.stream, routine: !!p.routine, kpi: p.kpi || l.kpi, item: p.item || l.item, original: amt, revised: amt });
    } else {
      const n = Math.max(0, ...b.plan.map((x) => +x.id.slice(5) || 0)) + 1;
      l = { id: 'BL27-' + String(n).padStart(3, '0'), unit: p.unit, p: p.p, name, item: p.item || null, qty: +p.qty, price: +p.price, kind: p.kind, stream: p.stream || 'OPERATIONAL', routine: !!p.routine, kpi: p.kpi || '', original: amt, revised: amt, weights: s.season.map((x) => Math.round(x * 1000) / 10), project: null };
      b.plan.push(l);
    }
    recalc(b);
    log(s, ctx, 'budget.upsertPlanLine', b.id, `${p.line ? 'Ubah' : 'Tambah'} ${l.id} ${l.name} = ${amt}`);
    return l;
  };
  H['budget.setWeights'] = (s, p, ctx) => {
    const b = get(s.budgets, p.id, 'Budget');
    need(b.status === 'DRAFT', 'LOCKED', 'Distribusi bulanan hanya dapat diubah saat Draft');
    const l = get(b.plan || [], p.line, 'Baris budget');
    const w = (p.weights || []).map(Number);
    need(w.length === 12 && w.every((x) => Number.isFinite(x) && x >= 0), 'VALIDATION', 'Isi 12 persentase bulanan ≥ 0');
    const tot = U.sum(w);
    need(Math.abs(tot - 100) <= 0.11, 'VALIDATION', `Jumlah alokasi bulanan harus 100% (saat ini ${U.num(tot, 2)}%)`);
    l.weights = w;
    log(s, ctx, 'budget.setWeights', b.id, `${l.id} distribusi bulanan`);
    return l;
  };
  H['nonroutine.create'] = (s, p, ctx) => {
    const name = String(p.name || '').trim();
    need(name && +p.amount > 0 && p.reason && p.reason.length >= 5, 'VALIDATION', 'Nama, nilai (> 0), dan alasan (min. 5 karakter) wajib');
    need(p.p && p.p !== 'PROFIT', 'VALIDATION', 'Pilih kategori 7P belanja (bukan Profit)');
    const bu = S.buOf(s, p.unit) || p.unit;
    const n = s.nonRoutine.filter((x) => x.id.startsWith('NRB-2026')).length + 1;
    const r = { id: 'NRB-2026-' + String(n).padStart(2, '0'), name, bu, unit: p.unit, p: p.p, kind: p.kind || 'OPEX', amount: +p.amount, used: 0, status: 'SUBMITTED', reason: p.reason, by: ctx.user.id };
    s.nonRoutine.push(r);
    log(s, ctx, 'nonroutine.create', r.id, name);
    return r;
  };
  H['nonroutine.decide'] = (s, p, ctx) => {
    const r = get(s.nonRoutine, p.id, 'Permintaan non-rutin');
    need(r.status === 'SUBMITTED', 'STATE', 'Permintaan sudah diputuskan');
    need(r.by !== ctx.user.id, 'SOD', 'Pemisahan tugas: pengaju tidak boleh memutuskan permintaannya sendiri');
    if (p.decision === 'REJECT') need(p.note, 'VALIDATION', 'Alasan penolakan wajib');
    r.status = p.decision === 'REJECT' ? 'REJECTED' : 'APPROVED';
    r.decidedBy = ctx.user.id;
    r.note = p.note || '';
    log(s, ctx, 'nonroutine.decide', r.id, r.status);
    return r;
  };
  H['budget.updateLine'] = (s, p, ctx) => {
    const b = get(s.budgets, p.id, 'Budget');
    need(b.status === 'DRAFT', 'LOCKED', 'Budget terkunci — gunakan Revisi Budget (NV-22)');
    need(!b.plan, 'STATE', 'Budget ini disusun per baris — ubah lewat budget.upsertPlanLine');
    const l = b.lines[p.index];
    need(l, 'NOT_FOUND', 'Baris tidak ada');
    need(p.amount >= 0, 'VALIDATION', 'Nilai tidak boleh negatif');
    l.original = l.revised = +p.amount;
    log(s, ctx, 'budget.updateLine', b.id, `${l.p}/${l.cls} = ${p.amount}`);
    return b;
  };
  H['budget.submit'] = (s, p, ctx) => {
    const b = get(s.budgets, p.id, 'Budget');
    need(b.status === 'DRAFT', 'STATE', 'Hanya draft yang dapat diajukan');
    const tgt = s.targets.find((t) => t.fy === b.fy && t.bu === b.bu);
    const spend = U.sum(b.lines.filter((l) => l.cls !== 'OUTCOME'), (l) => l.revised);
    if (tgt) need(spend < tgt.revenue, 'VALIDATION', 'Total belanja melebihi target revenue');
    b.status = 'SUBMITTED';
    b.approvals = [];
    (b.history = b.history || []).push({ ts: ctx.now, by: ctx.user.id, action: 'SUBMIT', note: p.note || '' });
    log(s, ctx, 'budget.submit', b.id, 'Ajukan budget');
    return b;
  };
  H['budget.approve'] = (s, p, ctx) => {
    const b = get(s.budgets, p.id, 'Budget');
    need(b.status === 'SUBMITTED', 'STATE', 'Budget belum diajukan');
    const chain = s.approvalRules.find((r) => r.doc === 'BUDGET').chain;
    const step = chain[(b.approvals || []).length];
    const ok = (step === ctx.user.role && !(step === 'HEAD_DIV' && ctx.user.position === 'ASST_OM')) || (step === 'HEAD_DIV' && ctx.user.role === 'BU_MANAGER');
    need(ok, 'FORBIDDEN', `Menunggu approval ${step}`);
    need(p.decision !== 'REJECT' || (p.note && p.note.length >= 5), 'VALIDATION', 'Alasan pengembalian wajib (min. 5 karakter)');
    (b.history = b.history || []).push({ ts: ctx.now, by: ctx.user.id, action: p.decision === 'REJECT' ? 'RETURN' : 'APPROVE_' + step, note: p.note || '' });
    if (p.decision === 'REJECT') {
      b.status = 'DRAFT';
      b.approvals = [];
    } else {
      b.approvals.push({ by: ctx.user.id, role: ctx.user.role, ts: ctx.now });
      if (b.approvals.length === chain.length) {
        b.status = 'LOCKED';
        b.approvedBy = ctx.user.id;
      }
    }
    log(s, ctx, 'budget.approve', b.id, p.decision || 'APPROVE');
    return b;
  };
  H['budget.requestRevision'] = (s, p, ctx) => {
    const b = get(s.budgets, p.id, 'Budget');
    need(b.status === 'LOCKED', 'STATE', 'Revisi hanya untuk budget terkunci');
    need(p.reason && p.reason.length >= 5, 'VALIDATION', 'Alasan revisi wajib diisi');
    need(p.changes && p.changes.length, 'VALIDATION', 'Minimal satu perubahan');
    p.changes.forEach((c) => {
      if (c.line) {
        const l = get(b.plan || [], c.line, 'Baris budget');
        need(+c.newAmount > 0, 'VALIDATION', 'Nominal baru harus > 0');
        c.old = l.revised;
        c.p = l.p;
        c.delta = +c.newAmount - l.revised;
      }
    });
    if (!p.changes.some((c) => c.line)) need(Math.abs(U.sum(p.changes, (c) => +c.delta)) < 1 || p.allowNet, 'VALIDATION', 'Realokasi antar-7P harus net nol (total delta = 0)');
    const n = s.budgetRevisions.filter((r) => r.budget === b.id).length + 1;
    const r = { id: `REV-${b.fy}-${b.bu.slice(3)}-${String(n).padStart(2, '0')}`, budget: b.id, quarter: p.quarter || 'Q4', reason: p.reason, changes: p.changes, status: 'SUBMITTED', by: ctx.user.id, ts: ctx.now };
    s.budgetRevisions.push(r);
    log(s, ctx, 'budget.requestRevision', r.id, p.reason);
    return r;
  };
  H['budget.decideRevision'] = (s, p, ctx) => {
    const r = get(s.budgetRevisions, p.id, 'Revisi');
    need(r.status === 'SUBMITTED', 'STATE', 'Revisi sudah diputuskan');
    r.status = p.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    r.decidedBy = ctx.user.id;
    if (r.status === 'APPROVED') {
      const b = get(s.budgets, r.budget, 'Budget');
      r.changes.forEach((c) => {
        if (c.line) {
          const pl = b.plan.find((x) => x.id === c.line);
          pl.revised = +c.newAmount; // Original stays as approved baseline
          return;
        }
        const l = b.lines.find((x) => x.p === c.p && x.cls !== 'CAPEX' && x.cls !== 'OUTCOME') || b.lines.find((x) => x.p === c.p);
        l.revised += c.delta;
      });
      if (b.plan) {
        const prev = b.lines;
        b.lines = HAWK.planToLines(b.plan).map((nl) => {
          const o = prev.find((x) => x.p === nl.p && x.cls === nl.cls) || {};
          return { ...nl, baseActual: o.baseActual || 0, baseCommit: o.baseCommit || 0 };
        });
      }
      b.version += 1;
    }
    log(s, ctx, 'budget.decideRevision', r.id, r.status);
    return r;
  };

  /* ---- MRF (Module E) — maps to existing HAWK Purchase Request engine ---- */
  H['mrf.create'] = (s, p, ctx) => {
    const lines = (p.lines || []).filter((l) => l.item && l.qty > 0);
    need(lines.length, 'VALIDATION', 'Minimal satu item dengan qty > 0');
    const me = S.assignment(s, ctx.user);
    if (!p.branch && me && me.branch) p = Object.assign({}, p, { branch: me.branch }); // auto-filled from the account
    need(p.branch, 'VALIDATION', 'Unit / lokasi wajib');
    if (['STAFF', 'SUPERVISOR'].includes(ctx.user.role)) need((ctx.user.scope || []).includes(p.branch), 'FORBIDDEN', 'Akun outlet hanya bisa memesan untuk outlet tempat ia ditugaskan');
    lines.forEach((l) => need(Number.isInteger(+l.qty) && +l.qty <= 9999, 'VALIDATION', 'Qty harus bilangan bulat ≤ 9999'));
    const org = S.org(s, p.branch);
    need(org && org.status === 'ACTIVE', 'VALIDATION', 'Unit tidak aktif');
    const id = U.nextId(s, 'PR'); // HAWK PR numbering: MRF reuses the Purchase Request engine
    const wh = S.whOfOrg(s, p.branch) || s.warehouses.find((w) => w.id === 'WH-PST');
    const m = {
      id, date: ctx.now, requester: ctx.user.id, requestedBy: me, branch: p.branch, wh: wh.id, cc: (S.ccOfOrg(s, p.branch) || {}).id,
      type: p.type || 'ROUTINE', status: p.draft ? 'DRAFT' : 'SUBMITTED', memo: p.memo || '', purpose: p.purpose || 'Operasional harian',
      lines: lines.map((l) => ({ item: l.item, qty: +l.qty, reason: l.reason || '', alloc: [] })), approvals: [], history: [], links: p.links || {},
    };
    s.mrfs.unshift(m);
    const ch = S.mrfChain(s, m);
    m.chain = ch.chain;
    m.rule = ch.rule;
    m.budgetSnapshot = S.mrfBudgetCheck(s, m).status;
    hist(m, ctx, p.draft ? 'DRAFT' : 'SUBMIT');
    log(s, ctx, 'mrf.create', id, `${lines.length} item, ${p.draft ? 'draft' : 'diajukan'}`);
    return m;
  };
  H['mrf.submitDraft'] = (s, p, ctx) => {
    const m = get(s.mrfs, p.id, 'MRF');
    need(['DRAFT', 'REVISION'].includes(m.status), 'STATE', 'MRF bukan draft/revisi');
    if (p.lines) m.lines = p.lines.map((l) => ({ item: l.item, qty: +l.qty, reason: l.reason || '', alloc: [] }));
    m.status = 'SUBMITTED';
    m.approvals = [];
    m.chain = S.mrfChain(s, m).chain;
    hist(m, ctx, 'SUBMIT');
    log(s, ctx, 'mrf.submitDraft', m.id, 'Diajukan');
    return m;
  };
  H['mrf.decide'] = (s, p, ctx) => {
    const m = get(s.mrfs, p.id, 'MRF');
    m.approvals = m.approvals || [];
    if (!m.chain) {
      const ch = S.mrfChain(s, m);
      m.chain = ch.chain;
      m.rule = ch.rule;
    }
    const step = S.mrfNextApprover(s, m);
    need(step, 'STATE', 'MRF tidak menunggu approval');
    need(S.canApproveStep(s, ctx.user, step, m), 'FORBIDDEN', `Langkah approval saat ini: ${(HAWK.ROLE_LABEL || {})[step] || step}`);
    need(!(m.approvals || []).some((a) => a.by === ctx.user.id), 'FORBIDDEN', 'Satu orang tidak boleh menyetujui dua langkah pada MRF yang sama');
    const d = p.decision;
    need(['APPROVE', 'REJECT', 'REVISION', 'ESCALATE'].includes(d), 'VALIDATION', 'Keputusan tidak dikenal');
    if (d !== 'APPROVE') need(p.note && p.note.trim().length >= 3, 'VALIDATION', 'Catatan wajib untuk tolak / revisi / eskalasi');
    hist(m, ctx, d, p.note);
    if (d === 'REJECT') m.status = 'REJECTED';
    else if (d === 'REVISION') {
      m.status = 'REVISION';
      m.approvals = [];
    } else if (d === 'ESCALATE') {
      m.status = 'ESCALATED';
      let esc = (s.approvalRules.find((r) => r.id === m.rule) || {}).escalateTo || 'BU_MANAGER';
      if (esc === 'HEAD_DIV' && ctx.user.position !== 'ASST_OM' && S.asstOmFor(s, m.branch) && !m.chain.includes('ASST_OM')) esc = 'ASST_OM'; // outlet supervisor escalates to the Assistant OM first
      m.chain = m.chain.slice(0, m.approvals.length).concat([esc], m.chain.slice(m.approvals.length + 1).filter((r) => r !== esc));
    } else {
      m.approvals.push({ by: ctx.user.id, role: step, ts: ctx.now, note: p.note || '' });
      if (m.approvals.length >= m.chain.length) {
        m.status = 'APPROVED';
        H['mrf.planFulfillment'](s, { id: m.id }, ctx); // Workflow 04 — automatic fulfillment path
      }
    }
    log(s, ctx, 'mrf.decide', m.id, d + (p.note ? ' — ' + p.note : ''));
    return m;
  };
  /* Workflow 04: local stock → other warehouse → supplier purchase. Sum of allocations always == requested qty. */
  H['mrf.planFulfillment'] = (s, p, ctx) => {
    const m = get(s.mrfs, p.id, 'MRF');
    need(m.status === 'APPROVED', 'STATE', 'MRF belum disetujui');
    m.lines.forEach((l) => {
      need(!(l.alloc || []).length, 'STATE', 'Fulfillment sudah direncanakan');
      let rest = l.qty;
      l.alloc = [];
      const local = Math.min(rest, S.available(s, m.wh, l.item));
      if (local > 0) {
        stockRow(s, m.wh, l.item).reserved += local;
        l.alloc.push({ path: 'LOCAL', qty: local, fromWh: m.wh, ref: null, readyQty: local, issuedQty: 0 });
        rest -= local;
      }
      if (rest > 0) {
        const bu = S.buOf(s, m.branch);
        const donors = s.stock
          .filter((x) => x.item === l.item && x.wh !== m.wh)
          .filter((x) => {
            const w = S.wh(s, x.wh);
            return w && (S.buOf(s, w.org) === bu || w.id === 'WH-PST');
          })
          .map((x) => ({ x, surplus: x.onHand - x.reserved - x.min }))
          .filter((d) => d.surplus > 0)
          .sort((a, b) => b.surplus - a.surplus);
        for (const d of donors) {
          if (rest <= 0) break;
          const q = Math.min(rest, d.surplus);
          d.x.reserved += q;
          const tid = U.nextId(s, 'TR');
          s.transfers.unshift({ id: tid, date: ctx.now, from: d.x.wh, to: m.wh, status: 'REQUESTED', mrf: m.id, lines: [{ item: l.item, qty: q }], history: [{ ts: ctx.now, by: ctx.user.id, action: 'AUTO_CREATE', note: 'Dari rencana fulfillment ' + m.id }] });
          l.alloc.push({ path: 'TRANSFER', qty: q, fromWh: d.x.wh, ref: tid, readyQty: 0, issuedQty: 0 });
          rest -= q;
        }
      }
      if (rest > 0) l.alloc.push({ path: 'PURCHASE', qty: rest, fromWh: null, ref: null, readyQty: 0, issuedQty: 0 });
      const total = U.sum(l.alloc, (a) => a.qty);
      if (total !== l.qty) fail('INVARIANT', 'Alokasi fulfillment tidak sama dengan qty diminta');
    });
    m.status = 'IN_FULFILLMENT';
    hist(m, ctx, 'PLAN_FULFILLMENT', m.lines.map((l) => l.alloc.map((a) => `${a.path}:${a.qty}`).join(', ')).join(' | '));
    log(s, ctx, 'mrf.planFulfillment', m.id, 'Rencana fulfillment otomatis');
    return m;
  };
  /* Issue everything that is physically ready for this MRF to the requester (stock issue → consumption) */
  H['mrf.issue'] = (s, p, ctx) => {
    const m = get(s.mrfs, p.id, 'MRF');
    need(m.status === 'IN_FULFILLMENT', 'STATE', 'MRF tidak dalam proses fulfillment');
    let issuedTotal = 0;
    const jlines = [];
    m.lines.forEach((l) => {
      const it = S.item(s, l.item);
      l.alloc.forEach((a) => {
        const q = a.readyQty - a.issuedQty;
        if (q <= 0) return;
        const row = stockRow(s, m.wh, l.item);
        need(row.onHand >= q && row.reserved >= q, 'INVARIANT', 'Stok fisik/reservasi tidak cukup untuk issue');
        row.onHand -= q;
        row.reserved -= q;
        a.issuedQty += q;
        issuedTotal += q;
        ledger(s, ctx, { type: 'ISSUE', wh: m.wh, item: l.item, qty: -q, ref: m.id, cc: m.cc, note: `Issue ${a.path}` });
        jlines.push({ acc: P_ACC[it.p] || '6190 Beban Lain', cc: m.cc, dr: q * it.price, cr: 0 }, { acc: '1140 Persediaan BHP', cc: m.cc, dr: 0, cr: q * it.price });
      });
    });
    need(issuedTotal > 0, 'NOTHING_READY', 'Belum ada qty yang siap diserahkan');
    journal(s, ctx, m.id, 'CONSUMPTION', jlines, 'Pemakaian BHP ' + m.id);
    const f = S.mrfFulfillment(s, m);
    if (f.issued === f.requested) m.status = 'FULFILLED';
    hist(m, ctx, 'ISSUE', `${issuedTotal} diserahkan (${f.issued}/${f.requested})`);
    log(s, ctx, 'mrf.issue', m.id, `Issue ${issuedTotal}`);
    return m;
  };
  H['mrf.cancel'] = (s, p, ctx) => {
    const m = get(s.mrfs, p.id, 'MRF');
    need(['DRAFT', 'SUBMITTED', 'REVISION'].includes(m.status), 'STATE', 'MRF yang sudah disetujui tidak dapat dibatalkan pemohon');
    need(m.requester === ctx.user.id || ctx.user.role === 'ADMIN', 'FORBIDDEN', 'Hanya pemohon');
    m.status = 'CANCELLED';
    hist(m, ctx, 'CANCEL', p.note);
    log(s, ctx, 'mrf.cancel', m.id, 'Batal');
    return m;
  };

  /* ---- Transfers (Module G, NV-44) ---- */
  H['transfer.create'] = (s, p, ctx) => {
    need(p.from && p.to && p.from !== p.to, 'VALIDATION', 'Gudang asal & tujuan harus berbeda');
    const lines = (p.lines || []).filter((l) => l.qty > 0);
    need(lines.length, 'VALIDATION', 'Minimal satu item');
    lines.forEach((l) => need(S.available(s, p.from, l.item) >= l.qty, 'INSUFFICIENT', `Stok tersedia ${S.itemName(s, l.item)} tidak cukup`));
    lines.forEach((l) => (stockRow(s, p.from, l.item).reserved += +l.qty));
    const id = U.nextId(s, 'TR');
    const t = { id, date: ctx.now, from: p.from, to: p.to, status: 'REQUESTED', mrf: null, memo: p.memo, lines: lines.map((l) => ({ item: l.item, qty: +l.qty })), history: [] };
    hist(t, ctx, 'CREATE', p.memo);
    s.transfers.unshift(t);
    log(s, ctx, 'transfer.create', id, 'Transfer manual');
    return t;
  };
  H['transfer.dispatch'] = (s, p, ctx) => {
    const t = get(s.transfers, p.id, 'Transfer');
    need(t.status === 'REQUESTED', 'STATE', 'Transfer tidak menunggu pengiriman');
    t.lines.forEach((l) => {
      const r = stockRow(s, t.from, l.item);
      need(r.onHand >= l.qty, 'INSUFFICIENT', 'Stok fisik tidak cukup');
      r.onHand -= l.qty;
      r.reserved -= l.qty;
      ledger(s, ctx, { type: 'TRANSFER_OUT', wh: t.from, item: l.item, qty: -l.qty, ref: t.id, note: 'Ke ' + S.whName(s, t.to) });
    });
    t.status = 'IN_TRANSIT';
    hist(t, ctx, 'DISPATCH');
    log(s, ctx, 'transfer.dispatch', t.id, 'Dikirim');
    return t;
  };
  H['transfer.receive'] = (s, p, ctx) => {
    const t = get(s.transfers, p.id, 'Transfer');
    need(t.status === 'IN_TRANSIT', 'STATE', 'Transfer belum dikirim');
    if (['STAFF', 'SUPERVISOR'].includes(ctx.user.role)) need((ctx.user.scope || []).includes((S.wh(s, t.to) || {}).org), 'FORBIDDEN', 'Hanya akun di outlet tujuan yang bisa menerima transfer ini');
    t.receivedBy = S.assignment(s, ctx.user);
    t.lines.forEach((l) => {
      const r = stockRow(s, t.to, l.item);
      r.onHand += l.qty;
      ledger(s, ctx, { type: 'TRANSFER_IN', wh: t.to, item: l.item, qty: l.qty, ref: t.id, note: 'Dari ' + S.whName(s, t.from) });
      if (t.mrf) {
        r.reserved += l.qty; // stays reserved for the originating MRF
        const m = get(s.mrfs, t.mrf, 'MRF');
        m.lines.forEach((ml) => ml.alloc.forEach((a) => a.ref === t.id && ml.item === l.item && (a.readyQty = a.qty)));
        hist(m, ctx, 'TRANSFER_RECEIVED', `${t.id}: ${l.qty} ${S.item(s, l.item).unit} siap diserahkan`);
      }
    });
    t.status = 'RECEIVED';
    hist(t, ctx, 'RECEIVE');
    log(s, ctx, 'transfer.receive', t.id, 'Diterima');
    return t;
  };

  /* ---- Purchasing (Module F) — maps to existing HAWK Purchase Order engine ---- */
  S.pendingPurchase = (s) => {
    const out = [];
    s.mrfs.forEach((m) => {
      if (m.status !== 'IN_FULFILLMENT') return;
      m.lines.forEach((l, li) =>
        l.alloc.forEach((a, ai) => {
          if (a.path === 'PURCHASE' && !a.ref) out.push({ mrf: m.id, li, ai, item: l.item, qty: a.qty, wh: m.wh, branch: m.branch, date: m.date, supplier: S.item(s, l.item).supplier });
        })
      );
    });
    return out;
  };
  H['po.createFromMrf'] = (s, p, ctx) => {
    const picks = p.picks || []; // [{mrf, li, ai}]
    need(picks.length, 'VALIDATION', 'Pilih minimal satu kebutuhan');
    need(p.supplier, 'VALIDATION', 'Supplier wajib dipilih');
    const pend = S.pendingPurchase(s);
    const rows = picks.map((k) => {
      const r = pend.find((x) => x.mrf === k.mrf && x.li === k.li && x.ai === k.ai);
      need(r, 'STATE', 'Kebutuhan sudah dibuatkan PO');
      return r;
    });
    const wh = rows[0].wh;
    need(rows.every((r) => r.wh === wh), 'VALIDATION', 'Satu PO hanya untuk satu lokasi kirim (Deliver To)');
    const id = U.nextId(s, 'PO');
    const lines = [];
    rows.forEach((r) => {
      const q = s.quotations.find((x) => x.item === r.item && x.supplier === p.supplier);
      const price = (p.prices && p.prices[r.item]) || (q ? q.price : S.item(s, r.item).price);
      let line = lines.find((l) => l.item === r.item);
      if (!line) {
        line = { item: r.item, qty: 0, received: 0, price, disc: 0, mrfRefs: [] };
        lines.push(line);
      }
      line.qty += r.qty;
      line.mrfRefs.push({ mrf: r.mrf, li: r.li, ai: r.ai, qty: r.qty });
      const m = get(s.mrfs, r.mrf, 'MRF');
      m.lines[r.li].alloc[r.ai].ref = id;
      hist(m, ctx, 'PO_CREATED', `${id} untuk ${r.qty} ${S.item(s, r.item).unit}`);
    });
    const sup = S.supplier(s, p.supplier);
    const po = { id, date: ctx.now, supplier: p.supplier, deliverTo: wh, status: 'DRAFT', emergency: !!p.emergency, memo: p.memo || 'Konsolidasi MRF', promised: p.promised || '2026-11-11', term: sup.term, createdBy: ctx.user.id, approvedBy: null, freight: +p.freight || 0, taxRate: 0.11, lines, approvals: [], history: [] };
    hist(po, ctx, 'CREATE', 'Dari ' + U.uniq(rows.map((r) => r.mrf)).join(', '));
    s.pos.unshift(po);
    log(s, ctx, 'po.createFromMrf', id, `${lines.length} baris dari ${rows.length} kebutuhan MRF`);
    return po;
  };
  H['po.update'] = (s, p, ctx) => {
    const po = get(s.pos, p.id, 'PO');
    need(po.status === 'DRAFT', 'STATE', 'PO hanya dapat diubah saat draft');
    if (p.promised) po.promised = p.promised;
    if (p.memo !== undefined) po.memo = p.memo;
    if (p.freight !== undefined) po.freight = Math.max(0, +p.freight);
    (p.lines || []).forEach((pl, i) => {
      if (po.lines[i] && pl.price > 0) po.lines[i].price = +pl.price;
    });
    log(s, ctx, 'po.update', po.id, 'Ubah draft PO');
    return po;
  };
  H['po.submit'] = (s, p, ctx) => {
    const po = get(s.pos, p.id, 'PO');
    need(po.status === 'DRAFT', 'STATE', 'PO bukan draft');
    po.chain = S.poChain(s, po);
    po.approvals = [];
    po.status = 'PENDING_APPROVAL';
    hist(po, ctx, 'SUBMIT', 'Rantai: ' + po.chain.join(' → '));
    log(s, ctx, 'po.submit', po.id, 'Ajukan approval');
    return po;
  };
  H['po.decide'] = (s, p, ctx) => {
    const po = get(s.pos, p.id, 'PO');
    const step = S.poNextApprover(s, po);
    need(step, 'STATE', 'PO tidak menunggu approval');
    need(step === ctx.user.role, 'FORBIDDEN', 'Menunggu approval ' + step);
    if (p.decision === 'REJECT') {
      need(p.note, 'VALIDATION', 'Alasan penolakan wajib');
      po.status = 'DRAFT';
      po.approvals = [];
      hist(po, ctx, 'REJECT', p.note);
    } else {
      po.approvals.push({ by: ctx.user.id, role: ctx.user.role, ts: ctx.now });
      if (po.approvals.length >= po.chain.length) {
        po.status = 'APPROVED';
        po.approvedBy = ctx.user.id;
      }
      hist(po, ctx, 'APPROVE');
    }
    log(s, ctx, 'po.decide', po.id, p.decision || 'APPROVE');
    return po;
  };
  H['po.send'] = (s, p, ctx) => {
    const po = get(s.pos, p.id, 'PO');
    need(po.status === 'APPROVED', 'STATE', 'PO belum disetujui');
    po.status = 'SENT';
    hist(po, ctx, 'SEND', 'Dikirim ke vendor (simulasi — tidak ada email keluar)');
    log(s, ctx, 'po.send', po.id, 'Kirim ke vendor');
    return po;
  };
  H['po.emergency'] = (s, p, ctx) => {
    need(p.reason && p.reason.length >= 10, 'VALIDATION', 'Alasan darurat minimal 10 karakter');
    const it = S.item(s, p.item);
    need(it && p.qty > 0, 'VALIDATION', 'Item & qty wajib');
    const rule = s.approvalRules.find((r) => r.doc === 'EMERGENCY_PO');
    const total = p.qty * (p.price || it.price) * 1.11;
    need(total <= rule.max, 'LIMIT', `Melebihi batas pembelian darurat ${U.rp(rule.max)} — gunakan PO standar`);
    const id = U.nextId(s, 'PO');
    const po = { id, date: ctx.now, supplier: p.supplier, deliverTo: p.wh, status: 'SENT', emergency: true, emergencyReason: p.reason, postApproval: 'PENDING', memo: 'PEMBELIAN DARURAT', promised: s.meta.demoDate, term: 'COD', createdBy: ctx.user.id, approvedBy: ctx.user.id, freight: 0, taxRate: 0.11,
      lines: [{ item: p.item, qty: +p.qty, received: 0, price: +(p.price || it.price), disc: 0, mrfRefs: [] }], approvals: [{ by: ctx.user.id, role: ctx.user.role, ts: ctx.now }], chain: rule.chain, history: [] };
    hist(po, ctx, 'EMERGENCY', p.reason);
    s.pos.unshift(po);
    log(s, ctx, 'po.emergency', id, 'Pembelian darurat — approval susulan ' + rule.postApproval);
    return po;
  };
  H['po.postApprove'] = (s, p, ctx) => {
    const po = get(s.pos, p.id, 'PO');
    need(po.emergency && po.postApproval === 'PENDING', 'STATE', 'Tidak ada approval susulan');
    po.postApproval = p.decision === 'REJECT' ? 'REJECTED' : 'APPROVED';
    hist(po, ctx, 'POST_APPROVAL', po.postApproval + (p.note ? ' — ' + p.note : ''));
    log(s, ctx, 'po.postApprove', po.id, po.postApproval);
    return po;
  };

  /* ---- Receiving & put-away (Module G, NV-41..43) ---- */
  H['grn.receive'] = (s, p, ctx) => {
    const po = get(s.pos, p.po, 'PO');
    need(['SENT', 'PARTIAL'].includes(po.status), 'STATE', 'PO belum dikirim ke vendor / sudah diterima penuh');
    const lines = po.lines.map((l, i) => {
      const inp = (p.lines || [])[i] || {};
      const outstanding = l.qty - l.received;
      const received = inp.received !== undefined ? +inp.received : outstanding;
      const damaged = +inp.damaged || 0;
      need(received >= 0 && damaged >= 0 && damaged <= received, 'VALIDATION', 'Qty rusak tidak boleh melebihi qty diterima');
      need(received <= outstanding, 'VALIDATION', `Qty diterima ${S.itemName(s, l.item)} melebihi sisa PO (${outstanding})`);
      return { item: l.item, expected: outstanding, received, damaged, accepted: received - damaged, bin: null, note: inp.note || '' };
    });
    need(U.sum(lines, (l) => l.received) > 0, 'VALIDATION', 'Tidak ada barang yang diterima');
    const id = U.nextId(s, 'GR');
    const g = { id, po: po.id, wh: po.deliverTo, date: ctx.now, status: 'RECEIVED', lines, docs: p.docs || ['Surat Jalan (scan simulasi)'], receiver: ctx.user.id, receivedBy: S.assignment(s, ctx.user), history: [] };
    hist(g, ctx, 'PHYSICAL_RECEIPT', 'Penerimaan fisik — belum memengaruhi stok');
    s.grns.unshift(g);
    hist(po, ctx, 'GOODS_ARRIVED', id);
    log(s, ctx, 'grn.receive', id, 'Penerimaan fisik ' + po.id);
    return g;
  };
  H['grn.post'] = (s, p, ctx) => {
    const g = get(s.grns, p.id, 'GRN');
    need(g.status === 'RECEIVED', 'STATE', 'GRN sudah diposting');
    const po = get(s.pos, g.po, 'PO');
    const jl = [];
    g.lines.forEach((gl, i) => {
      const pl = po.lines.find((l) => l.item === gl.item);
      pl.received += gl.accepted;
      pl.rejected = (pl.rejected || 0) + gl.damaged;
      if (gl.accepted > 0) {
        stockRow(s, g.wh, gl.item).onHand += gl.accepted;
        ledger(s, ctx, { type: 'RECEIPT', wh: g.wh, item: gl.item, qty: gl.accepted, ref: g.id, note: 'Bin staging RCV — menunggu put-away' });
        const v = gl.accepted * pl.price;
        jl.push({ acc: '1140 Persediaan BHP', cc: 'CC-OFC-PUR', dr: v, cr: 0 }, { acc: '2120 Barang Diterima Belum Ditagih (GRNI)', cc: 'CC-OFC-PUR', dr: 0, cr: v });
      }
    });
    if (jl.length) g.journal = journal(s, ctx, g.id, 'GOODS_RECEIPT', jl, 'Penerimaan persediaan ' + po.id);
    const outstanding = U.sum(po.lines, (l) => l.qty - l.received);
    po.status = outstanding > 0 ? 'PARTIAL' : 'RECEIVED';
    g.status = 'POSTED';
    hist(g, ctx, 'POST_INVENTORY', 'Stok bertambah (bin staging)');
    hist(po, ctx, po.status === 'PARTIAL' ? 'PARTIAL_RECEIPT' : 'FULLY_RECEIVED', `Backorder: ${outstanding}`);
    log(s, ctx, 'grn.post', g.id, `Posting inventory; PO ${po.status}`);
    return g;
  };
  H['grn.putaway'] = (s, p, ctx) => {
    const g = get(s.grns, p.id, 'GRN');
    need(g.status === 'POSTED', 'STATE', 'GRN harus diposting sebelum put-away');
    const wh = S.wh(s, g.wh);
    const po = get(s.pos, g.po, 'PO');
    g.lines.forEach((gl, i) => {
      const bin = (p.bins || {})[i] || (p.bins || {})[gl.item];
      need(bin && wh.bins.includes(bin), 'VALIDATION', `Bin ${bin || '(kosong)'} tidak valid untuk ${wh.name}`);
      gl.bin = bin;
      const row = stockRow(s, g.wh, gl.item);
      row.bin = row.bin || bin;
      // release to MRFs waiting on this PO line (FIFO by MRF date)
      let qty = gl.accepted;
      const pl = po.lines.find((l) => l.item === gl.item);
      (pl.mrfRefs || []).forEach((ref) => {
        if (qty <= 0) return;
        const m = get(s.mrfs, ref.mrf, 'MRF');
        const a = m.lines[ref.li].alloc[ref.ai];
        const take = Math.min(qty, a.qty - a.readyQty);
        if (take > 0) {
          a.readyQty += take;
          row.reserved += take;
          qty -= take;
          hist(m, ctx, 'PURCHASE_READY', `${g.id}: ${take} ${S.item(s, gl.item).unit} tersimpan di ${bin}, siap diserahkan`);
        }
      });
    });
    g.status = 'STORED';
    hist(g, ctx, 'PUTAWAY', g.lines.map((l) => `${l.item}→${l.bin}`).join(', '));
    log(s, ctx, 'grn.putaway', g.id, 'Put-away dikonfirmasi');
    return g;
  };

  /* ---- Inventory ops (NV-45/46) ---- */
  H['stock.issueDirect'] = (s, p, ctx) => {
    const r = S.stock(s, p.wh, p.item);
    need(r && S.available(s, p.wh, p.item) >= p.qty && p.qty > 0, 'INSUFFICIENT', 'Stok tersedia tidak cukup');
    r.onHand -= +p.qty;
    const it = S.item(s, p.item);
    const cc = (S.ccOfOrg(s, S.wh(s, p.wh).org) || {}).id;
    ledger(s, ctx, { type: 'ISSUE', wh: p.wh, item: p.item, qty: -p.qty, ref: p.ref || 'ISSUE-DIRECT', cc, note: p.note || 'Pemakaian langsung' });
    journal(s, ctx, p.ref || 'ISSUE-DIRECT', 'CONSUMPTION', [{ acc: P_ACC[it.p], cc, dr: p.qty * it.price, cr: 0 }, { acc: '1140 Persediaan BHP', cc, dr: 0, cr: p.qty * it.price }], 'Pemakaian langsung');
    log(s, ctx, 'stock.issueDirect', p.item, `${p.qty} dari ${p.wh}`);
    return r;
  };
  H['stock.return'] = (s, p, ctx) => {
    need(p.qty > 0, 'VALIDATION', 'Qty retur > 0');
    const r = stockRow(s, p.wh, p.item);
    r.onHand += +p.qty;
    const it = S.item(s, p.item);
    const cc = (S.ccOfOrg(s, S.wh(s, p.wh).org) || {}).id;
    ledger(s, ctx, { type: 'RETURN', wh: p.wh, item: p.item, qty: +p.qty, ref: p.ref || 'RETURN', cc, note: p.note || 'Retur ke gudang' });
    journal(s, ctx, p.ref || 'RETURN', 'RETURN', [{ acc: '1140 Persediaan BHP', cc, dr: p.qty * it.price, cr: 0 }, { acc: P_ACC[it.p], cc, dr: 0, cr: p.qty * it.price }], 'Retur pemakaian');
    log(s, ctx, 'stock.return', p.item, `${p.qty} ke ${p.wh}`);
    return r;
  };
  H['opname.start'] = (s, p, ctx) => {
    s.opnames = s.opnames || [];
    const wh = S.wh(s, p.wh);
    need(wh, 'VALIDATION', 'Gudang wajib');
    need(!s.opnames.some((o) => o.wh === p.wh && o.status === 'COUNTING'), 'STATE', 'Opname gudang ini masih berjalan');
    const id = `OP-${p.wh.slice(3)}-${String(s.opnames.length + 1).padStart(3, '0')}`;
    const o = { id, wh: p.wh, date: ctx.now, status: 'COUNTING', lines: s.stock.filter((x) => x.wh === p.wh).map((x) => ({ item: x.item, system: x.onHand, counted: null })), history: [] };
    hist(o, ctx, 'START');
    s.opnames.unshift(o);
    log(s, ctx, 'opname.start', id, wh.name);
    return o;
  };
  H['opname.submit'] = (s, p, ctx) => {
    const o = get(s.opnames || [], p.id, 'Opname');
    need(o.status === 'COUNTING', 'STATE', 'Opname tidak dalam penghitungan');
    o.lines.forEach((l, i) => {
      const c = p.counts[i];
      need(c !== undefined && c !== null && c !== '' && +c >= 0, 'VALIDATION', 'Semua item wajib dihitung');
      l.counted = +c;
    });
    const diff = o.lines.filter((l) => l.counted !== l.system);
    if (diff.length) need(p.note && p.note.length >= 5, 'VALIDATION', 'Ada selisih — penjelasan wajib');
    o.note = p.note;
    o.status = 'SUBMITTED';
    hist(o, ctx, 'SUBMIT', `${diff.length} selisih`);
    log(s, ctx, 'opname.submit', o.id, `${diff.length} selisih`);
    return o;
  };
  H['opname.approve'] = (s, p, ctx) => {
    const o = get(s.opnames || [], p.id, 'Opname');
    need(o.status === 'SUBMITTED', 'STATE', 'Opname belum diajukan');
    const jl = [];
    o.lines.forEach((l) => {
      const d = l.counted - l.system;
      if (!d) return;
      const r = stockRow(s, o.wh, l.item);
      need(r.onHand + d >= r.reserved, 'INVARIANT', `Penyesuaian ${l.item} membuat stok < reservasi`);
      r.onHand += d;
      ledger(s, ctx, { type: 'ADJUST', wh: o.wh, item: l.item, qty: d, ref: o.id, note: 'Penyesuaian opname' });
      const v = Math.abs(d) * S.avgCost(s, l.item);
      if (d > 0) jl.push({ acc: '1140 Persediaan BHP', cc: 'CC-OFC-FIN', dr: v, cr: 0 }, { acc: '7110 Selisih Persediaan', cc: 'CC-OFC-FIN', dr: 0, cr: v });
      else jl.push({ acc: '7110 Selisih Persediaan', cc: 'CC-OFC-FIN', dr: v, cr: 0 }, { acc: '1140 Persediaan BHP', cc: 'CC-OFC-FIN', dr: 0, cr: v });
    });
    if (jl.length) journal(s, ctx, o.id, 'STOCK_ADJUSTMENT', jl, 'Penyesuaian opname');
    o.status = 'APPROVED';
    hist(o, ctx, 'APPROVE');
    log(s, ctx, 'opname.approve', o.id, 'Penyesuaian diposting');
    return o;
  };
  H['bin.add'] = (s, p, ctx) => {
    const wh = get(s.warehouses, p.wh, 'Gudang');
    need(/^[A-Z]{3}-[A-Z]-\d{2}$/.test(p.bin), 'VALIDATION', 'Format bin: KOD-R-NN (contoh SHN-C-01)');
    need(!wh.bins.includes(p.bin), 'DUPLICATE', 'Bin sudah ada');
    wh.bins.push(p.bin);
    const rack = p.bin.split('-')[1];
    if (!wh.racks.includes(rack)) wh.racks.push(rack);
    log(s, ctx, 'bin.add', wh.id, p.bin);
    return wh;
  };

  /* ---- Finance: AI capture → match → verify → AP → payment (Module H) ---- */
  S.sampleDocs = (s) => {
    // deterministic "documents" a user can pick to simulate upload/photo — NO real OCR
    const poSup1 = s.pos.find((p) => p.supplier === 'SUP-001' && ['RECEIVED', 'PARTIAL'].includes(p.status) && !s.bills.some((b) => b.po === p.id && b.status !== 'VOID'));
    const mkLines = (po, priceAdj = 0) => po.lines.map((l) => ({ desc: S.itemName(s, l.item), item: l.item, qty: l.received, price: l.price + priceAdj }));
    const docs = [];
    if (poSup1)
      docs.push({ key: 'A', title: 'Faktur PT Aroma Bali Lestari — sesuai PO', file: 'faktur_ABL_0457.jpg', supplierText: 'PT AROMA BALI LESTARI', invoiceNo: 'ABL/INV/2026/11/0457', date: '2026-11-08', poText: poSup1.id, lines: mkLines(poSup1), conf: 0.96 });
    if (poSup1)
      docs.push({ key: 'B', title: 'Faktur PT Aroma Bali Lestari — harga berbeda', file: 'faktur_ABL_0458.jpg', supplierText: 'PT AROMA BALI LESTARI', invoiceNo: 'ABL/INV/2026/11/0458', date: '2026-11-08', poText: poSup1.id, lines: mkLines(poSup1, 2500), conf: 0.91 });
    docs.push({ key: 'C', title: 'Faktur UD Sumber Bersih — nomor sudah pernah dibayar', file: 'faktur_USB_0981.pdf', supplierText: 'UD SUMBER BERSIH', invoiceNo: 'USB/2026/10/0981', date: '2026-10-28', poText: 'PO20261000014', lines: [{ desc: 'Sabun Cair Antiseptik 5L', item: 'BHP-004', qty: 6, price: 145000 }], conf: 0.93 });
    const poLinen = s.pos.find((p) => p.id === 'PO20261100001' && ['RECEIVED', 'PARTIAL'].includes(p.status));
    if (poLinen) docs.push({ key: 'D', title: 'Faktur CV Tirta Linen — qty melebihi penerimaan', file: 'faktur_TL_1120.jpg', supplierText: 'CV TIRTA LINEN', invoiceNo: 'TL/1120/XI/26', date: '2026-11-08', poText: poLinen.id, lines: poLinen.lines.map((l) => ({ desc: S.itemName(s, l.item), item: l.item, qty: l.qty, price: l.price })), conf: 0.89 });
    return docs;
  };
  H['doc.capture'] = (s, p, ctx) => {
    const sample = S.sampleDocs(s).find((d) => d.key === p.sample);
    need(sample, 'NOT_FOUND', 'Contoh dokumen tidak tersedia (pastikan barang PO sudah diterima)');
    const id = U.nextId(s, 'DC');
    const subtotal = U.sum(sample.lines, (l) => l.qty * l.price);
    const tax = Math.round(subtotal * 0.11);
    const d = {
      id, ts: ctx.now, file: sample.file, title: sample.title, status: 'EXTRACTED', source: 'SIMULATED_AI_EXTRACTION',
      fields: { supplierText: sample.supplierText, invoiceNo: sample.invoiceNo, invoiceDate: sample.date, poText: sample.poText, subtotal, tax, total: subtotal + tax },
      lines: sample.lines.map((l) => ({ ...l })), confidence: { supplierText: 0.98, invoiceNo: sample.conf, invoiceDate: 0.95, poText: 0.92, total: 0.97 }, history: [],
    };
    hist(d, ctx, 'AI_EXTRACT', 'Ekstraksi AI (simulasi deterministik — tidak ada OCR nyata)');
    s.docs.unshift(d);
    log(s, ctx, 'doc.capture', id, sample.file);
    return d;
  };
  H['doc.match'] = (s, p, ctx) => {
    const d = get(s.docs, p.id, 'Dokumen');
    need(['EXTRACTED', 'MISMATCH', 'MATCHED'].includes(d.status), 'STATE', 'Dokumen sudah diverifikasi');
    const f = d.fields;
    const sup = s.suppliers.find((x) => x.name.toUpperCase().startsWith(f.supplierText.slice(0, 12)));
    const po = s.pos.find((x) => x.id === f.poText);
    const grns = po ? s.grns.filter((g) => g.po === po.id && g.status !== 'RECEIVED') : [];
    const dup = s.bills.find((b) => b.invoiceNo === f.invoiceNo && b.status !== 'VOID');
    const checks = [];
    checks.push({ key: 'supplier', label: 'Supplier dikenali', ok: !!sup, detail: sup ? sup.name : 'Tidak ada di master supplier' });
    checks.push({ key: 'po', label: 'PO ditemukan & milik supplier', ok: !!po && sup && po.supplier === sup.id, detail: po ? po.id : f.poText + ' tidak ada' });
    checks.push({ key: 'grn', label: 'Ada penerimaan barang terposting', ok: grns.length > 0, detail: grns.map((g) => g.id).join(', ') || 'Belum ada GRN terposting' });
    checks.push({ key: 'dup', label: 'Bukan faktur duplikat', ok: !dup, detail: dup ? `Nomor sama dengan ${dup.id} (${dup.status})` : 'Nomor faktur unik' });
    const lineChecks = d.lines.map((l) => {
      const pl = po && po.lines.find((x) => x.item === l.item);
      const recv = pl ? pl.received : 0;
      return { item: l.item, desc: l.desc, invQty: l.qty, recvQty: recv, poQty: pl ? pl.qty : 0, invPrice: l.price, poPrice: pl ? pl.price : null, qtyOk: !!pl && l.qty <= recv, priceOk: !!pl && Math.abs(l.price - pl.price) < 1 };
    });
    checks.push({ key: 'qty', label: 'Qty faktur ≤ qty diterima', ok: lineChecks.every((x) => x.qtyOk), detail: lineChecks.filter((x) => !x.qtyOk).map((x) => `${x.desc}: faktur ${x.invQty} vs terima ${x.recvQty}`).join('; ') || 'Sesuai' });
    checks.push({ key: 'price', label: 'Harga faktur = harga PO', ok: lineChecks.every((x) => x.priceOk), detail: lineChecks.filter((x) => !x.priceOk).map((x) => `${x.desc}: ${U.rp(x.invPrice)} vs PO ${U.rp(x.poPrice)}`).join('; ') || 'Sesuai' });
    d.match = { checks, lines: lineChecks, supplier: sup && sup.id, po: po && po.id, grn: grns.length ? grns[0].id : null, ts: ctx.now };
    d.matchedPo = po && po.id;
    d.status = checks.every((c) => c.ok) ? 'MATCHED' : 'MISMATCH';
    hist(d, ctx, 'THREE_WAY_MATCH', d.status);
    log(s, ctx, 'doc.match', d.id, d.status);
    return d;
  };
  H['doc.verify'] = (s, p, ctx) => {
    const d = get(s.docs, p.id, 'Dokumen');
    need(['MATCHED', 'MISMATCH'].includes(d.status), 'STATE', 'Jalankan pencocokan dulu');
    if (p.decision === 'REJECT') {
      need(p.note, 'VALIDATION', 'Alasan penolakan wajib');
      d.status = 'REJECTED';
      hist(d, ctx, 'REJECT', p.note);
      log(s, ctx, 'doc.verify', d.id, 'Ditolak: ' + p.note);
      return d;
    }
    const dup = d.match.checks.find((c) => c.key === 'dup');
    need(dup.ok, 'DUPLICATE', 'Faktur duplikat tidak dapat dibuatkan tagihan');
    need(d.match.checks.find((c) => c.key === 'po').ok, 'VALIDATION', 'PO tidak valid');
    if (d.status === 'MISMATCH') need(p.note && p.note.length >= 10, 'VALIDATION', 'Ada selisih — penjelasan verifikator minimal 10 karakter');
    const id = U.nextId(s, 'BL');
    const sub = d.fields.subtotal;
    const bill = { id, supplier: d.match.supplier, invoiceNo: d.fields.invoiceNo, invoiceDate: d.fields.invoiceDate, po: d.match.po, grn: d.match.grn, doc: d.id, subtotal: sub, tax: d.fields.tax, total: d.fields.total,
      status: 'DRAFT', due: '2026-12-08', matchStatus: d.status, exceptionNote: d.status === 'MISMATCH' ? p.note : null, verifiedBy: ctx.user.id, history: [] };
    hist(bill, ctx, 'AP_DRAFT', 'Dibuat setelah verifikasi manusia atas ' + d.id);
    s.bills.unshift(bill);
    d.status = 'VERIFIED';
    d.bill = id;
    hist(d, ctx, 'HUMAN_VERIFY', p.note || 'Sesuai');
    log(s, ctx, 'doc.verify', d.id, 'AP draft ' + id);
    return bill;
  };
  H['bill.approve'] = (s, p, ctx) => {
    const b = get(s.bills, p.id, 'Tagihan');
    need(b.status === 'DRAFT', 'STATE', 'Tagihan bukan draft');
    need(b.verifiedBy !== ctx.user.id || p.selfOk, 'SOD', 'Pemisahan tugas: verifikator tidak boleh menyetujui sendiri');
    const po = get(s.pos, b.po, 'PO');
    const recvValue = U.sum(po.lines, (l) => l.received * l.price);
    const grni = Math.min(b.subtotal, recvValue);
    const lines = [
      { acc: '2120 Barang Diterima Belum Ditagih (GRNI)', cc: 'CC-OFC-FIN', dr: grni, cr: 0 },
      { acc: '1150 PPN Masukan', cc: 'CC-OFC-FIN', dr: b.tax, cr: 0 },
    ];
    if (b.subtotal > grni) lines.push({ acc: '5190 Selisih Harga Pembelian', cc: 'CC-OFC-FIN', dr: b.subtotal - grni, cr: 0 });
    lines.push({ acc: '2110 Utang Usaha', cc: 'CC-OFC-FIN', dr: 0, cr: b.total });
    b.journal = journal(s, ctx, b.id, 'INVOICE_RECOGNITION', lines, 'Pengakuan utang ' + b.invoiceNo);
    b.status = 'APPROVED';
    b.approvedBy = ctx.user.id;
    hist(b, ctx, 'APPROVE', 'Siap dijadwalkan bayar');
    log(s, ctx, 'bill.approve', b.id, 'AP disetujui');
    return b;
  };
  H['bill.pay'] = (s, p, ctx) => {
    const b = get(s.bills, p.id, 'Tagihan');
    need(b.status === 'APPROVED', 'STATE', 'Tagihan belum disetujui');
    need(p.confirm === true, 'CONFIRM', 'Pembayaran butuh konfirmasi eksplisit manusia');
    const pid = 'PY-2611-' + String(s.payments.length + 1).padStart(4, '0');
    const amt = b.total - (b.advanceApplied || 0); // part already covered by an advance never leaves the bank twice
    s.payments.unshift({ id: pid, bill: b.id, amount: amt, date: s.meta.demoDate, method: 'Transfer bank (SIMULASI — tidak ada dana keluar)', status: 'PAID', by: ctx.user.id });
    journal(s, ctx, b.id, 'PAYMENT', [{ acc: '2110 Utang Usaha', cc: 'CC-OFC-FIN', dr: amt, cr: 0 }, { acc: '1110 Bank (DEMO)', cc: 'CC-OFC-FIN', dr: 0, cr: amt }], 'Pembayaran ' + b.invoiceNo);
    b.status = 'PAID';
    b.paidAt = ctx.now;
    hist(b, ctx, 'PAY', pid);
    log(s, ctx, 'bill.pay', b.id, 'Dibayar (simulasi) ' + pid);
    return b;
  };
  H['gl.post'] = (s, p, ctx) => {
    const j = get(s.journals, p.id, 'Jurnal');
    need(j.status === 'PENDING_REVIEW', 'STATE', 'Jurnal sudah diposting');
    j.status = 'POSTED';
    j.postedBy = ctx.user.id;
    j.postedAt = ctx.now;
    log(s, ctx, 'gl.post', j.id, 'Diteruskan ke HAWK Finance (simulasi)');
    return j;
  };

  /* ---- Order Sederhana (Simple Order) — rule-based automation, NOT AI ----
     Humans act at exactly three points: (1) order, (2) "Barang diterima", (3) Finance "Sudah dibayar".
     Everything in between is executed by the configurable rule AR-13 (NV-09) under the actor SYS-RULE,
     using the SAME engine handlers as the manual flow. Any rule miss falls back to the manual approval chain. */
  const SYS = { id: 'SYS-RULE', role: 'SYSTEM', name: 'Sistem — aturan otomatis AR-13', scope: [] };
  const sys = (ctx) => ({ user: SYS, now: ctx.now, by: ctx.user });
  const AUTO_DEFAULT = { id: 'AR-13', doc: 'AUTO_ORDER', max: 5000000, active: true };
  S.autoRule = (s) => s.approvalRules.find((r) => r.doc === 'AUTO_ORDER') || AUTO_DEFAULT;
  /* Which conditions an order must meet for straight-through processing. Pure read; used by UI preview and engine. */
  S.autoOrderCheck = (s, m) => {
    const rule = S.autoRule(s);
    const why = [];
    const v = S.mrfValue(s, m);
    if (!rule.active) why.push('Aturan order otomatis (AR-13) sedang nonaktif');
    if (m.type !== 'ROUTINE') why.push('Permintaan non-rutin');
    m.lines.forEach((l) => {
      const it = S.item(s, l.item);
      if (!it) return why.push('Item tidak dikenal');
      if (!it.routine) why.push(`${it.name} bukan barang rutin`);
      if (!it.supplier || !S.supplier(s, it.supplier)) why.push(`${it.name} belum punya supplier default`);
    });
    const bc = S.mrfBudgetCheck(s, m);
    bc.lines.forEach((x) => {
      if (x.status === 'OVER') why.push(`${S.itemName(s, x.item)} melebihi budget bulan ini (${U.pct(x.ratio)})`);
      if (x.status === 'NO_BUDGET') why.push(`${S.itemName(s, x.item)} belum ada budget-nya`);
    });
    if (rule.max !== null && v > rule.max) why.push(`Nilai ${U.rp(v)} di atas batas otomatis ${U.rp(rule.max)}`);
    return { ok: why.length === 0, why: U.uniq(why), value: v, rule: rule.id, max: rule.max, budget: bc.status };
  };
  S.poPaid = (s, po) => U.sum(s.payments.filter((p) => p.po === po.id || s.bills.some((b) => b.id === p.bill && b.po === po.id)), (p) => p.amount);
  S.poPayState = (s, po) => {
    const total = S.poTotals(s, po).total;
    const paid = S.poPaid(s, po);
    return { total, paid, rest: Math.max(0, total - paid), status: paid <= 0 ? 'UNPAID' : paid + 1 >= total ? 'PAID' : 'PARTIAL' };
  };
  S.simplePOs = (s, m) => U.uniq(m.lines.flatMap((l) => (l.alloc || []).filter((a) => a.path === 'PURCHASE' && a.ref).map((a) => a.ref))).map((id) => s.pos.find((p) => p.id === id)).filter(Boolean);
  S.simpleStage = (s, m) => {
    if (['REJECTED', 'CANCELLED'].includes(m.status)) return { key: 'STOP', label: m.status === 'REJECTED' ? 'Ditolak' : 'Dibatalkan', step: -1 };
    if (['SUBMITTED', 'ESCALATED', 'REVISION', 'DRAFT'].includes(m.status)) return { key: 'WAIT', label: 'Menunggu persetujuan ' + (HAWK.ROLE_LABEL[S.mrfNextApprover(s, m)] || 'atasan'), step: 0 };
    if (m.status === 'FULFILLED') return { key: 'DONE', label: 'Selesai — barang sudah diterima', step: 3 };
    const f = S.mrfFulfillment(s, m);
    const waiting = s.transfers.some((t) => t.mrf === m.id && t.status === 'IN_TRANSIT') || S.simplePOs(s, m).some((p) => ['SENT', 'PARTIAL'].includes(p.status)) || f.ready > f.issued;
    return waiting ? { key: 'ARRIVE', label: f.issued ? 'Sebagian diterima — sisa sedang dikirim' : 'Sedang dikirim — tekan "Barang diterima" saat sampai', step: 2 } : { key: 'PROC', label: 'Diproses', step: 1 };
  };
  const autoBill = (s, ctx, g, po) => {
    // Bill = PO price × accepted qty of THIS receipt (invoice assumed equal to PO; the supplier's real invoice is still to be attached — TO VERIFY)
    const sub = U.sum(g.lines, (gl) => gl.accepted * po.lines.find((l) => l.item === gl.item).price);
    if (sub <= 0) return null;
    const tax = Math.round(sub * (po.taxRate || 0));
    const id = U.nextId(s, 'BL');
    const sc = sys(ctx);
    const bill = { id, supplier: po.supplier, invoiceNo: 'AUTO-' + g.id, invoiceDate: s.meta.demoDate, po: po.id, grn: g.id, doc: null, subtotal: sub, tax, total: sub + tax, status: 'APPROVED', due: '2026-12-08', matchStatus: 'MATCHED', auto: true,
      exceptionNote: null, verifiedBy: SYS.id, approvedBy: SYS.id, note: 'Tagihan otomatis = harga PO × qty diterima. Faktur asli supplier tetap dilampirkan (TO VERIFY).', history: [] };
    bill.journal = journal(s, sc, id, 'INVOICE_RECOGNITION', [
      { acc: '2120 Barang Diterima Belum Ditagih (GRNI)', cc: 'CC-OFC-FIN', dr: sub, cr: 0 },
      { acc: '1150 PPN Masukan', cc: 'CC-OFC-FIN', dr: tax, cr: 0 },
      { acc: '2110 Utang Usaha', cc: 'CC-OFC-FIN', dr: 0, cr: sub + tax },
    ], 'Pengakuan utang otomatis ' + po.id + ' / ' + g.id);
    hist(bill, sc, 'AUTO_BILL', 'PO = penerimaan (2-way match otomatis), aturan AR-13');
    s.bills.unshift(bill);
    // apply advance payment made before the goods arrived
    const adv = (po.prepaid || 0) - (po.prepaidApplied || 0);
    if (adv > 0) {
      const amt = Math.min(adv, bill.total);
      journal(s, sc, id, 'ADVANCE_APPLY', [{ acc: '2110 Utang Usaha', cc: 'CC-OFC-FIN', dr: amt, cr: 0 }, { acc: '1160 Uang Muka Pembelian (DEMO)', cc: 'CC-OFC-FIN', dr: 0, cr: amt }], 'Kompensasi uang muka ' + po.id);
      po.prepaidApplied = (po.prepaidApplied || 0) + amt;
      bill.advanceApplied = amt;
      if (amt + 1 >= bill.total) {
        bill.status = 'PAID';
        bill.paidAt = ctx.now;
      }
      hist(bill, sc, 'ADVANCE_APPLIED', U.rp(amt));
    }
    return bill;
  };
  /* AR-13 settings — editable by Finance, Super Admin (ADMIN) and Owner (Owner decision 8 Nov 2026). Applies to NEW orders only. */
  H['autoOrder.update'] = (s, p, ctx) => {
    need(['FINANCE', 'ADMIN', 'OWNER'].includes(ctx.user.role), 'FORBIDDEN', 'Hanya Finance, Super Admin, atau Owner');
    let r = s.approvalRules.find((x) => x.doc === 'AUTO_ORDER');
    if (!r) {
      r = { ...AUTO_DEFAULT, name: 'Order sederhana otomatis', condition: '', min: 0, chain: ['SYSTEM'], slaHours: 1 };
      s.approvalRules.push(r);
    }
    const max = p.max === undefined ? r.max : p.max === null ? null : Math.round(+p.max);
    need(max !== null && Number.isFinite(max) && max >= 0 && max <= 25000000, 'VALIDATION', 'Batas harus Rp0 – Rp25.000.000 (di atas itu wajib rantai BU Manager/Owner)');
    need(p.note && p.note.trim().length >= 5, 'VALIDATION', 'Alasan perubahan wajib (min. 5 karakter)');
    const before = { active: r.active, max: r.max };
    const after = { active: p.active === undefined ? r.active : !!p.active, max };
    need(before.active !== after.active || before.max !== after.max, 'VALIDATION', 'Tidak ada perubahan');
    Object.assign(r, after);
    r.version = (r.version || 1) + 1;
    r.changes = r.changes || [];
    r.changes.unshift({ ts: ctx.now, by: ctx.user.id, role: ctx.user.role, before, after, note: p.note.trim() });
    log(s, ctx, 'autoOrder.update', r.id, `v${r.version}: ${before.active ? 'aktif' : 'nonaktif'} ${U.rp(before.max)} → ${after.active ? 'aktif' : 'nonaktif'} ${U.rp(after.max)} — ${p.note.trim()}`);
    return r;
  };
  H['order.quick'] = (s, p, ctx) => {
    const m = H['mrf.create'](s, { branch: p.branch, type: 'ROUTINE', purpose: p.purpose || 'Operasional harian', memo: p.memo || 'Order sederhana', lines: p.lines }, ctx);
    m.simple = true;
    const chk = S.autoOrderCheck(s, m);
    m.autoCheck = { ok: chk.ok, why: chk.why, value: chk.value, rule: chk.rule, max: chk.max };
    const sc = sys(ctx);
    if (!chk.ok) {
      hist(m, sc, 'AUTO_CHECK', 'Tidak lolos aturan otomatis → approval manual: ' + chk.why.join('; '));
      log(s, sc, 'order.quick', m.id, 'Pengecualian → rantai manual ' + m.chain.join(' → '));
      return m;
    }
    m.chain = ['SYSTEM'];
    m.rule = chk.rule;
    m.approvals = [{ by: SYS.id, role: 'SYSTEM', ts: ctx.now, note: `Auto-approve ${chk.rule}: rutin, dalam budget 7P, ≤ ${U.rp(chk.max)}` }];
    m.status = 'APPROVED';
    hist(m, sc, 'AUTO_APPROVE', m.approvals[0].note);
    H['mrf.planFulfillment'](s, { id: m.id }, sc);
    s.transfers.filter((t) => t.mrf === m.id && t.status === 'REQUESTED').forEach((t) => {
      H['transfer.dispatch'](s, { id: t.id }, sc);
      t.auto = true;
    });
    const rows = S.pendingPurchase(s).filter((r) => r.mrf === m.id);
    const bySup = {};
    rows.forEach((r) => (bySup[r.supplier] = bySup[r.supplier] || []).push({ mrf: r.mrf, li: r.li, ai: r.ai }));
    Object.entries(bySup).forEach(([sup, picks]) => {
      const po = H['po.createFromMrf'](s, { picks, supplier: sup, memo: 'Order sederhana ' + m.id + ' (otomatis AR-13)' }, sc);
      po.auto = true;
      H['po.submit'](s, { id: po.id }, sc);
      po.approvals = po.chain.map(() => ({ by: SYS.id, role: 'SYSTEM', ts: ctx.now }));
      po.status = 'APPROVED';
      po.approvedBy = SYS.id;
      hist(po, sc, 'AUTO_APPROVE', `${chk.rule}: harga dari penawaran/master, total ${U.rp(S.poTotals(s, po).total)}`);
      H['po.send'](s, { id: po.id }, sc);
    });
    log(s, sc, 'order.quick', m.id, `Otomatis: ${rows.length} baris beli, ${s.transfers.filter((t) => t.mrf === m.id).length} transfer`);
    return m;
  };
  H['order.receive'] = (s, p, ctx) => {
    const m = get(s.mrfs, p.id, 'Pesanan');
    need(m.status === 'IN_FULFILLMENT', 'STATE', 'Pesanan belum disetujui atau sudah selesai');
    if (['STAFF', 'SUPERVISOR'].includes(ctx.user.role)) need(m.requester === ctx.user.id || ctx.user.scope.includes(m.branch), 'FORBIDDEN', 'Hanya pemesan / akun di outlet ini');
    const sc = sys(ctx);
    const got = {}; // item → qty physically received now (default: everything expected)
    (p.lines || []).forEach((l) => {
      need(Number.isInteger(+l.received) && +l.received >= 0 && (+l.damaged || 0) >= 0 && (+l.damaged || 0) <= +l.received, 'VALIDATION', 'Qty diterima/rusak tidak valid');
      got[l.item] = { received: +l.received, damaged: +l.damaged || 0 };
    });
    // stock already at the outlet (local reservation) or arriving by internal transfer counts first; the rest is the supplier delivery
    m.lines.forEach((l) => {
      if (!got[l.item]) return;
      const nonPo = U.sum(l.alloc.filter((a) => a.path !== 'PURCHASE'), (a) => a.qty - a.issuedQty);
      got[l.item].received = Math.max(0, got[l.item].received - nonPo);
    });
    s.transfers.filter((t) => t.mrf === m.id && t.status === 'IN_TRANSIT').forEach((t) => H['transfer.receive'](s, { id: t.id }, ctx));
    S.simplePOs(s, m).filter((po) => ['SENT', 'PARTIAL'].includes(po.status)).forEach((po) => {
      const lines = po.lines.map((l) => {
        const out = l.qty - l.received;
        const g = got[l.item];
        const rec = g ? Math.min(out, Math.max(0, g.received)) : out;
        if (g) g.received -= rec;
        return { received: rec, damaged: g ? Math.min(rec, g.damaged) : 0, note: p.note || '' };
      });
      if (!U.sum(lines, (l) => l.received)) return;
      const g = H['grn.receive'](s, { po: po.id, lines, docs: ['Konfirmasi "Barang diterima" oleh ' + ctx.user.name] }, ctx);
      H['grn.post'](s, { id: g.id }, sc);
      const wh = S.wh(s, g.wh);
      const bins = {};
      g.lines.forEach((gl, i) => (bins[i] = (S.stock(s, g.wh, gl.item) || {}).bin || wh.bins.find((b) => !/RCV/.test(b)) || wh.bins[0]));
      H['grn.putaway'](s, { id: g.id, bins }, sc);
      if (po.auto) autoBill(s, ctx, g, po);
    });
    const f = S.mrfFulfillment(s, m);
    need(f.ready > f.issued, 'NOTHING_READY', 'Belum ada barang yang bisa dikonfirmasi diterima');
    H['mrf.issue'](s, { id: m.id }, sc);
    const by = S.assignment(s, ctx.user);
    (m.receipts = m.receipts || []).push({ at: ctx.now, by, note: p.note || '' });
    hist(m, ctx, 'RECEIVED_BY_REQUESTER', `${p.note || 'Barang diterima'} — ${S.assignmentText(by)}`);
    log(s, ctx, 'order.receive', m.id, `Diterima ${ctx.user.name}; ${m.status}`);
    return m;
  };
  H['order.pay'] = (s, p, ctx) => {
    need(p.confirm === true, 'CONFIRM', 'Pembayaran butuh konfirmasi eksplisit manusia');
    const po = get(s.pos, p.po, 'PO');
    need(['SENT', 'PARTIAL', 'RECEIVED'].includes(po.status), 'STATE', 'PO belum dikirim ke supplier');
    const st = S.poPayState(s, po);
    need(st.rest > 0, 'DUPLICATE', 'PO ini sudah lunas — tidak bisa dibayar dua kali');
    let paid = 0;
    s.bills.filter((b) => b.po === po.id && b.status === 'APPROVED').forEach((b) => {
      H['bill.pay'](s, { id: b.id, confirm: true }, ctx);
      paid += s.payments.find((x) => x.bill === b.id).amount;
    });
    const rest = S.poPayState(s, po).rest;
    if (rest > 0) {
      const pid = 'PY-2611-' + String(s.payments.length + 1).padStart(4, '0');
      s.payments.unshift({ id: pid, po: po.id, bill: null, amount: rest, date: s.meta.demoDate, method: 'Transfer bank (SIMULASI — tidak ada dana keluar)', status: 'PAID', kind: 'ADVANCE', by: ctx.user.id });
      journal(s, ctx, po.id, 'ADVANCE_PAYMENT', [{ acc: '1160 Uang Muka Pembelian (DEMO)', cc: 'CC-OFC-FIN', dr: rest, cr: 0 }, { acc: '1110 Bank (DEMO)', cc: 'CC-OFC-FIN', dr: 0, cr: rest }], 'Uang muka ' + po.id + ' (barang belum/sebagian diterima)');
      po.prepaid = (po.prepaid || 0) + rest;
      paid += rest;
    }
    hist(po, ctx, 'PAID_CONFIRMED', `${U.rp(paid)} — konfirmasi "Sudah dibayar" oleh ${ctx.user.name}`);
    log(s, ctx, 'order.pay', po.id, 'Sudah dibayar ' + U.rp(paid));
    return po;
  };

  /* ---- Asset & facility (Module I) ---- */
  H['mt.create'] = (s, p, ctx) => {
    const a = get(s.assets, p.asset, 'Aset');
    need(p.issue && p.issue.length >= 5, 'VALIDATION', 'Uraian masalah wajib');
    const id = U.nextId(s, 'MT');
    const m = { id, date: ctx.now, asset: a.id, reporter: ctx.user.id, branch: a.org, issue: p.issue, priority: p.priority || 'MEDIUM', status: 'SUBMITTED', wo: null, history: [] };
    hist(m, ctx, 'SUBMIT');
    s.maintenance.unshift(m);
    log(s, ctx, 'mt.create', id, a.name);
    return m;
  };
  H['mt.review'] = (s, p, ctx) => {
    const m = get(s.maintenance, p.id, 'Request');
    need(m.status === 'SUBMITTED', 'STATE', 'Request sudah ditinjau');
    if (ctx.user.role === 'SUPERVISOR') need(ctx.user.scope.includes(m.branch), 'FORBIDDEN', 'Di luar unit supervisor');
    m.status = p.decision === 'REJECT' ? 'REJECTED' : 'APPROVED';
    hist(m, ctx, m.status, p.note);
    log(s, ctx, 'mt.review', m.id, m.status);
    return m;
  };
  H['wo.create'] = (s, p, ctx) => {
    const m = get(s.maintenance, p.mt, 'Request');
    need(m.status === 'APPROVED', 'STATE', 'Request belum disetujui supervisor');
    const id = U.nextId(s, 'WO');
    const w = { id, mt: m.id, asset: m.asset, assignee: p.assignee || 'Teknisi internal', status: 'OPEN', parts: [], cost: +p.labor || 0, notes: '', history: [] };
    hist(w, ctx, 'CREATE');
    s.workOrders.unshift(w);
    m.wo = id;
    m.status = 'IN_PROGRESS';
    hist(m, ctx, 'WO_CREATED', id);
    log(s, ctx, 'wo.create', id, 'Work order dibuat');
    return w;
  };
  H['wo.requestPart'] = (s, p, ctx) => {
    const w = get(s.workOrders, p.id, 'WO');
    need(['OPEN', 'WAITING_PARTS'].includes(w.status), 'STATE', 'WO tidak aktif');
    const a = S.asset(s, w.asset);
    const mrf = H['mrf.create'](s, { branch: a.org, type: 'NON_ROUTINE', memo: `Suku cadang untuk ${w.id} (${a.name})`, purpose: 'Maintenance', lines: [{ item: p.item, qty: p.qty, reason: 'Work order ' + w.id }], links: { wo: w.id } }, ctx);
    w.parts.push({ item: p.item, qty: +p.qty, mrf: mrf.id });
    w.status = 'WAITING_PARTS';
    hist(w, ctx, 'PART_REQUEST', mrf.id);
    log(s, ctx, 'wo.requestPart', w.id, mrf.id);
    return { wo: w, mrf };
  };
  H['wo.complete'] = (s, p, ctx) => {
    const w = get(s.workOrders, p.id, 'WO');
    need(['OPEN', 'WAITING_PARTS'].includes(w.status), 'STATE', 'WO tidak aktif');
    need(p.notes && p.notes.length >= 5, 'VALIDATION', 'Catatan penyelesaian wajib');
    w.status = 'COMPLETED';
    w.completedAt = ctx.now;
    w.notes = p.notes;
    w.cost = (w.cost || 0) + (+p.cost || 0);
    const a = get(s.assets, w.asset, 'Aset');
    a.lastService = ctx.now.slice(0, 10);
    a.condition = 'Baik';
    a.history.unshift({ ts: ctx.now, event: `Perbaikan selesai (${w.id}): ${p.notes}`, by: ctx.user.id, ref: w.id });
    const m = s.maintenance.find((x) => x.id === w.mt);
    if (m) {
      m.status = 'COMPLETED';
      hist(m, ctx, 'COMPLETE', w.id);
    }
    hist(w, ctx, 'COMPLETE', p.notes);
    if (w.cost) journal(s, ctx, w.id, 'MAINTENANCE_EXPENSE', [{ acc: '6210 Beban Pemeliharaan — Facility', cc: (S.ccOfOrg(s, a.org) || {}).id, dr: w.cost, cr: 0 }, { acc: '2130 Biaya Masih Harus Dibayar', cc: 'CC-OFC-FIN', dr: 0, cr: w.cost }], 'Biaya WO ' + w.id);
    log(s, ctx, 'wo.complete', w.id, 'Selesai; histori aset diperbarui');
    return w;
  };
  H['asset.capitalize'] = (s, p, ctx) => {
    need(p.name && p.cost > 0 && p.org && p.life > 0, 'VALIDATION', 'Nama, nilai, lokasi, umur wajib');
    const code = (S.org(s, p.org).code || 'OFC').slice(0, 3);
    const n = s.assets.filter((a) => a.id.startsWith('AST-' + code)).length + 1;
    const id = `AST-${code}-${String(n).padStart(4, '0')}`;
    const a = { id, name: p.name, cat: p.cat || 'Umum', org: p.org, location: S.orgName(s, p.org), acquired: s.meta.demoDate, cost: +p.cost, life: +p.life, method: 'Garis lurus', status: 'ACTIVE', condition: 'Baru', lastService: s.meta.demoDate, serviceIntervalDays: 180, source: p.source || null, history: [{ ts: ctx.now, event: 'Kapitalisasi' + (p.source ? ' dari ' + p.source : ''), by: ctx.user.id }] };
    s.assets.push(a);
    journal(s, ctx, id, 'CAPITALIZATION', [{ acc: '1510 Aset Tetap — Peralatan', cc: 'CC-OFC-FIN', dr: a.cost, cr: 0 }, { acc: '1590 Aset Dalam Penyelesaian / Utang', cc: 'CC-OFC-FIN', dr: 0, cr: a.cost }], 'Kapitalisasi ' + a.name);
    log(s, ctx, 'asset.capitalize', id, a.name);
    return a;
  };
  H['asset.dispose'] = (s, p, ctx) => {
    const a = get(s.assets, p.id, 'Aset');
    if (p.step === 'REQUEST') {
      need(a.status === 'ACTIVE', 'STATE', 'Aset tidak aktif');
      need(p.reason, 'VALIDATION', 'Alasan wajib');
      a.status = 'PENDING_DISPOSAL';
      a.disposalBy = ctx.user.id;
      a.history.unshift({ ts: ctx.now, event: 'Usulan disposal: ' + p.reason, by: ctx.user.id });
    } else {
      need(a.status === 'PENDING_DISPOSAL', 'STATE', 'Belum diusulkan');
      need(['FINANCE', 'OWNER'].includes(ctx.user.role), 'FORBIDDEN', 'Disposal disetujui oleh Finance / Owner (bukan pengusul)');
      need(a.disposalBy !== ctx.user.id, 'SOD', 'Pengusul disposal tidak boleh menyetujui sendiri');
      const d = S.depreciation(s, a);
      a.status = 'DISPOSED';
      a.history.unshift({ ts: ctx.now, event: `Disposal disetujui (nilai buku ${U.rp(d.book)})`, by: ctx.user.id });
      journal(s, ctx, a.id, 'DISPOSAL', [{ acc: '1519 Akumulasi Penyusutan', cc: 'CC-OFC-FIN', dr: d.accumulated, cr: 0 }, { acc: '7210 Rugi Pelepasan Aset', cc: 'CC-OFC-FIN', dr: d.book, cr: 0 }, { acc: '1510 Aset Tetap — Peralatan', cc: 'CC-OFC-FIN', dr: 0, cr: a.cost }], 'Disposal ' + a.name);
    }
    log(s, ctx, 'asset.dispose', a.id, p.step);
    return a;
  };

  /* ---- AI insight workflow (Module J) — humans act, AI never executes ---- */
  H['insight.act'] = (s, p, ctx) => {
    need(['ACKNOWLEDGE', 'ASSIGN', 'DISMISS', 'DONE'].includes(p.action), 'VALIDATION', 'Aksi tidak dikenal');
    if (p.action === 'DISMISS') need(p.note, 'VALIDATION', 'Alasan diabaikan wajib');
    s.insightState[p.id] = { status: p.action, by: ctx.user.id, ts: ctx.now, note: p.note || '', owner: p.owner || null };
    log(s, ctx, 'insight.act', p.id, p.action + (p.note ? ' — ' + p.note : ''));
    return s.insightState[p.id];
  };

  HAWK.selectors = S;
  HAWK.handlers = H;
  /* shared engine helpers for feature modules (spend.js) — same rules, same audit, same rollback */
  HAWK.engine = { log, hist, need, get, stockRow, ledger, journal, fail };

  /* ======================= STORE ======================= */
  const KEY = 'hawk-jaens-demo-state-v3';
  HAWK.STATE_KEY = KEY;
  HAWK.createStore = function (opts = {}) {
    let storage = null;
    try {
      storage = opts.storage !== undefined ? opts.storage : root.localStorage; // may throw in sandboxed frames
    } catch (e) {
      storage = null;
    }
    let state = null;
    try {
      const raw = storage && storage.getItem(KEY);
      if (raw) state = JSON.parse(raw);
      if (state && state.meta.schema !== HAWK.seed().meta.schema) state = null;
    } catch (e) {
      state = null;
    }
    if (!state) state = HAWK.seed();
    const subs = new Set();
    const store = {
      get state() {
        return state;
      },
      /* revision tag: lets several app windows (Demo Experience Center frames) share ONE sandbox state */
      get rev() {
        return (state.meta && state.meta.rev) || '';
      },
      /* reload when another window saved a newer state (same browser origin only — not multi-user sync) */
      sync() {
        try {
          const raw = storage && storage.getItem(KEY);
          if (!raw) return false;
          const next = JSON.parse(raw);
          if (!next || !next.meta || next.meta.schema !== state.meta.schema || next.meta.rev === state.meta.rev) return false;
          state = next;
          subs.forEach((f) => f('sync'));
          return true;
        } catch (e) {
          return false;
        }
      },
      save() {
        state.meta.rev = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        try {
          storage && storage.setItem(KEY, JSON.stringify(state));
        } catch (e) {
          /* storage full or blocked — demo continues in memory */
        }
      },
      reset() {
        state = HAWK.seed();
        store.save();
        subs.forEach((f) => f('reset'));
      },
      subscribe(f) {
        subs.add(f);
        return () => subs.delete(f);
      },
      /* run a domain handler transactionally: on error the state is rolled back */
      exec(op, payload, user) {
        const h = H[op];
        if (!h) throw new HawkError('NO_HANDLER', 'Operasi belum disimulasikan: ' + op);
        store.sync(); // never act on a stale copy when another window changed the shared sandbox
        const snapshot = JSON.stringify(state);
        try {
          const ctx = { user, now: U.now(state) };
          const res = h(state, payload || {}, ctx);
          (HAWK.afterExec || []).forEach((f) => f(state, op, ctx));
          store.save();
          subs.forEach((f) => f(op));
          return res;
        } catch (e) {
          state = JSON.parse(snapshot);
          throw e;
        }
      },
    };
    return store;
  };
})(typeof window !== 'undefined' ? window : globalThis);
