/* App shell: router, sidebar, topbar (org/branch selector, role switcher, search, notifications, inbox),
   record drawer (drill-down for every transaction ID), developer contract panel, guided Owner walkthrough. */
(function (root) {
  'use strict';
  const HAWK = root.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const esc = U.esc;
  const $ = (q) => document.querySelector(q);

  HAWK.views = HAWK.views || {};
  ui.local = {};
  const SEED_MRF = ['PR20261100001', 'PR20261100002', 'PR20261100003', 'PR20261100004', 'PR20261100005'];

  const store = HAWK.createStore();
  const api = HAWK.createApi(store);
  HAWK.store = store;
  HAWK.api = api;

  const prefs = (() => {
    try {
      return JSON.parse(localStorage.getItem('hawk-ui-prefs') || '{}');
    } catch (e) {
      return {};
    }
  })();
  const savePrefs = () => {
    if (HAWK.EMBED) return; // frames never overwrite the main window's preferences
    try {
      localStorage.setItem('hawk-ui-prefs', JSON.stringify(prefs));
    } catch (e) {}
  };
  /* Embedded mode (Demo Experience Center frames): ?embed=1&as=U-XXX — the frame's DEMO user lives in memory only,
     never in shared prefs, so five frames can show five roles at once. This is a demo role switch, NOT a login. */
  const qs = new URLSearchParams(location.search);
  const EMBED = qs.get('embed') === '1';
  HAWK.EMBED = EMBED;
  prefs.user = prefs.user || 'U-OWN';
  prefs.bu = prefs.bu || 'ALL';
  prefs.branch = prefs.branch || 'ALL';
  prefs.dev = prefs.dev !== undefined ? prefs.dev : true;
  prefs.tour = prefs.tour !== undefined ? prefs.tour : true;
  prefs.visited = prefs.visited || {};
  if (EMBED) {
    const embedPrefs = { user: /^U-[A-Z0-9]+$/.test(qs.get('as') || '') ? qs.get('as') : prefs.user, bu: 'ALL', branch: 'ALL', dev: false, tour: false, visited: {} };
    Object.keys(prefs).forEach((k) => delete prefs[k]);
    Object.assign(prefs, embedPrefs);
    document.documentElement.classList.add('embed');
  }

  const user = () => store.state.users.find((u) => u.id === prefs.user) || store.state.users[0];
  HAWK.currentUser = () => user();
  /* switch demo user programmatically (used by the role switcher and automated tests) */
  HAWK.setUser = (id, opts = {}) => {
    prefs.user = id;
    if (opts.tour !== undefined) prefs.tour = opts.tour;
    savePrefs();
  };

  /* ---------- routing ---------- */
  function parseHash() {
    const m = location.hash.match(/^#\/nv\/(\d+)(?:\?(.*))?$/);
    if (!m) return { nv: HAWK.ROLE_HOME[user().role] || 1, q: {} };
    const q = {};
    (m[2] || '').split('&').filter(Boolean).forEach((kv) => {
      const [k, v] = kv.split('=');
      q[k] = decodeURIComponent(v || '');
    });
    return { nv: +m[1], q };
  }
  HAWK.go = (nv, q) => {
    const qs = q ? '?' + Object.entries(q).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&') : '';
    const h = `#/nv/${nv}${qs}`;
    if (location.hash === h) render();
    else location.hash = h;
    window.scrollTo(0, 0);
  };

  /* ---------- scope (BU / branch selector) ---------- */
  function scopeInfo(u) {
    const s = store.state;
    const fixedBranch = ['STAFF', 'SUPERVISOR'].includes(u.role) ? u.scope.find((x) => (S.org(s, x) || {}).type === 'BRANCH') : null;
    const bu = fixedBranch ? S.buOf(s, fixedBranch) : prefs.bu;
    const branch = fixedBranch || prefs.branch;
    return { bu, branch, fixed: !!fixedBranch };
  }
  function inScope(orgId, sc) {
    if (!orgId) return true;
    const s = store.state;
    if (sc.branch && sc.branch !== 'ALL') return orgId === sc.branch || S.org(s, orgId)?.parent === sc.branch;
    if (sc.bu && sc.bu !== 'ALL') return S.buOf(s, orgId) === sc.bu || orgId === sc.bu;
    return true;
  }

  /* ---------- tasks (NV-02) — what this user must act on ---------- */
  HAWK.tasks = function (s, u) {
    const t = [];
    const add = (o) => t.push(o);
    const ancestors = (org) => { const out = []; let o = S.org(s, org); while (o) { out.push(o.id); o = S.org(s, o.parent); } return out; };
    const owns = (org) => { const up = ancestors(org); return u.scope.some((x) => up.includes(x) || S.buOf(s, org) === x); };
    const role = u.role;
    s.mrfs.forEach((m) => {
      const step = S.mrfNextApprover(s, m);
      if (step && S.canApproveStep(s, u, step, m))
        add({ type: 'MRF', ref: m.id, unit: S.orgName(s, m.branch), title: m.lines.map((l) => `${S.itemName(s, l.item)} × ${l.qty}`).join(', '), value: S.mrfValue(s, m), status: m.status, nv: 29, kind: 'approval', budget: S.mrfBudgetCheck(s, m).status });
      if (m.status === 'IN_FULFILLMENT' && ['WAREHOUSE'].includes(role)) {
        const f = S.mrfFulfillment(s, m);
        if (f.ready > f.issued) add({ type: 'MRF', ref: m.id, unit: S.orgName(s, m.branch), title: `Serahkan ${f.ready - f.issued} unit ke pemohon`, value: null, status: 'READY', nv: 45, kind: 'issue' });
      }
      if (m.status === 'REVISION' && m.requester === u.id) add({ type: 'MRF', ref: m.id, unit: S.orgName(s, m.branch), title: 'Perbaiki & kirim ulang', status: m.status, nv: 27, kind: 'revision' });
    });
    // Order Sederhana: only two human tasks exist — "Barang diterima" (requester/unit) and "Sudah dibayar" (Finance)
    s.mrfs.filter((m) => m.simple && m.status === 'IN_FULFILLMENT' && (m.requester === u.id || (role === 'STAFF' && u.scope.includes(m.branch))) && S.simpleStage(s, m).key === 'ARRIVE').forEach((m) => add({ type: 'PESANAN', ref: m.id, unit: S.orgName(s, m.branch), title: 'Konfirmasi barang sudah diterima', value: S.mrfValue(s, m), status: 'ARRIVE', nv: 24, kind: 'receive' }));
    if (role === 'FINANCE' && HAWK.payQueue) HAWK.payQueue(s).forEach((po) => add({ type: 'BAYAR', ref: po.id, unit: S.supplierName(s, po.supplier), title: 'Konfirmasi sudah dibayar (order otomatis)', value: S.poPayState(s, po).rest, status: po.status, nv: 50, kind: 'paid' }));
    if (role === 'PURCHASING') {
      const p = S.pendingPurchase(s);
      if (p.length) add({ type: 'PEMBELIAN', ref: p.map((x) => x.mrf).filter((v, i, a) => a.indexOf(v) === i).join(', '), unit: 'Purchasing HQ', title: `${p.length} kebutuhan disetujui belum ber-PO`, status: 'AWAITING_PO', nv: 32, kind: 'consolidate' });
      s.pos.filter((x) => x.status === 'DRAFT').forEach((po) => add({ type: 'PO', ref: po.id, unit: S.supplierName(s, po.supplier), title: 'Lengkapi & ajukan draft PO', value: S.poTotals(s, po).total, status: po.status, nv: 35, kind: 'draft' }));
      s.pos.filter((x) => x.status === 'APPROVED').forEach((po) => add({ type: 'PO', ref: po.id, unit: S.supplierName(s, po.supplier), title: 'Kirim PO ke vendor', value: S.poTotals(s, po).total, status: po.status, nv: 36, kind: 'send' }));
    }
    s.pos.forEach((po) => {
      if (S.poNextApprover(s, po) === role) add({ type: 'PO', ref: po.id, unit: S.supplierName(s, po.supplier), title: `Approval PO ${po.lines.length} baris`, value: S.poTotals(s, po).total, status: po.status, nv: 36, kind: 'approval' });
      if (po.emergency && po.postApproval === 'PENDING' && role === 'BU_MANAGER') add({ type: 'PO DARURAT', ref: po.id, unit: S.whName(s, po.deliverTo), title: 'Approval susulan pembelian darurat', value: S.poTotals(s, po).total, status: 'PENDING', nv: 37, kind: 'approval' });
    });
    if (role === 'WAREHOUSE') {
      s.transfers.filter((x) => x.status === 'REQUESTED').forEach((x) => add({ type: 'TRANSFER', ref: x.id, unit: `${S.whName(s, x.from)} → ${S.whName(s, x.to)}`, title: 'Kirim transfer', status: x.status, nv: 44, kind: 'dispatch' }));
      s.transfers.filter((x) => x.status === 'IN_TRANSIT').forEach((x) => add({ type: 'TRANSFER', ref: x.id, unit: S.whName(s, x.to), title: 'Terima transfer masuk', status: x.status, nv: 41, kind: 'receive' }));
      s.pos.filter((x) => ['SENT', 'PARTIAL'].includes(x.status)).forEach((x) => add({ type: 'PO', ref: x.id, unit: S.whName(s, x.deliverTo), title: 'Terima barang (checklist)', status: x.status, nv: 42, kind: 'receive' }));
      s.grns.filter((g) => g.status === 'RECEIVED').forEach((g) => add({ type: 'GRN', ref: g.id, unit: S.whName(s, g.wh), title: 'Posting penerimaan ke inventory', status: g.status, nv: 42, kind: 'post' }));
      s.grns.filter((g) => g.status === 'POSTED').forEach((g) => add({ type: 'GRN', ref: g.id, unit: S.whName(s, g.wh), title: 'Put-away ke rak (scan QR)', status: g.status, nv: 43, kind: 'putaway' }));
    }
    if (role === 'FINANCE') {
      s.docs.filter((d) => ['EXTRACTED', 'MATCHED', 'MISMATCH'].includes(d.status)).forEach((d) => add({ type: 'DOKUMEN', ref: d.id, unit: d.fields.supplierText, title: 'Verifikasi hasil ekstraksi AI', value: d.fields.total, status: d.status, nv: 49, kind: 'verify' }));
      s.bills.filter((b) => b.status === 'APPROVED').forEach((b) => add({ type: 'TAGIHAN', ref: b.id, unit: S.supplierName(s, b.supplier), title: 'Jadwalkan / bayar', value: b.total, status: b.status, nv: 50, kind: 'pay' }));
      s.journals.filter((j) => j.status === 'PENDING_REVIEW').slice(0, 6).forEach((j) => add({ type: 'JURNAL', ref: j.id, unit: j.kind, title: 'Review & posting jurnal', value: U.sum(j.lines, (l) => l.dr), status: j.status, nv: 51, kind: 'post' }));
      (s.opnames || []).filter((o) => o.status === 'SUBMITTED').forEach((o) => add({ type: 'OPNAME', ref: o.id, unit: S.whName(s, o.wh), title: 'Setujui penyesuaian opname', status: o.status, nv: 46, kind: 'approval' }));
    }
    if (['FINANCE', 'BU_MANAGER'].includes(role))
      s.bills.filter((b) => b.status === 'DRAFT' && b.verifiedBy !== u.id).forEach((b) => add({ type: 'TAGIHAN', ref: b.id, unit: S.supplierName(s, b.supplier), title: 'Setujui tagihan (AP)', value: b.total, status: b.status, nv: 50, kind: 'approval' }));
    s.budgets.forEach((b) => {
      if (b.status !== 'SUBMITTED') return;
      const chain = s.approvalRules.find((r) => r.doc === 'BUDGET').chain;
      const step = chain[(b.approvals || []).length];
      if ((step === role || (step === 'HEAD_DIV' && role === 'BU_MANAGER')) && owns(b.bu)) add({ type: 'BUDGET', ref: b.id, unit: S.orgName(s, b.bu), title: `${S.budgetStage(s, b)} budget FY${b.fy}`, status: b.status, nv: 21, kind: 'approval' });
    });
    if (['OWNER', 'BU_MANAGER', 'HEAD_DIV', 'FINANCE'].includes(role))
      s.nonRoutine.filter((r) => r.status === 'SUBMITTED' && r.by !== u.id && owns(r.unit)).forEach((r) => add({ type: 'NON-RUTIN', ref: r.id, unit: S.orgName(s, r.unit), title: r.name, value: r.amount, status: r.status, nv: 18, kind: 'approval' }));
    if (role === 'OWNER') {
      s.budgetRevisions.filter((r) => r.status === 'SUBMITTED').forEach((r) => add({ type: 'REVISI', ref: r.id, unit: r.budget, title: r.reason, status: r.status, nv: 22, kind: 'approval' }));
      s.projects.filter((p) => p.status === 'PROPOSED').forEach((p) => add({ type: 'INVESTASI', ref: p.id, unit: S.orgName(s, p.bu), title: p.name, value: p.capex, status: p.status, nv: 14, kind: 'approval' }));
      s.targets.filter((x) => x.status === 'SUBMITTED').forEach((x) => add({ type: 'TARGET', ref: x.id, unit: S.orgName(s, x.bu), title: 'Approval target FY' + x.fy, value: x.revenue, status: x.status, nv: 10, kind: 'approval' }));
    }
    if (['SUPERVISOR', 'ASSET'].includes(role))
      s.maintenance.filter((m) => m.status === 'SUBMITTED' && (role === 'ASSET' || u.scope.includes(m.branch))).forEach((m) => add({ type: 'MAINTENANCE', ref: m.id, unit: S.orgName(s, m.branch), title: m.issue, status: m.status, nv: 55, kind: 'approval' }));
    if (role === 'ASSET') {
      s.maintenance.filter((m) => m.status === 'APPROVED').forEach((m) => add({ type: 'MAINTENANCE', ref: m.id, unit: S.orgName(s, m.branch), title: 'Buat work order', status: m.status, nv: 55, kind: 'wo' }));
      s.workOrders.filter((w) => ['OPEN', 'WAITING_PARTS'].includes(w.status)).forEach((w) => add({ type: 'WO', ref: w.id, unit: S.asset(s, w.asset).name, title: 'Selesaikan work order', status: w.status, nv: 55, kind: 'wo' }));
    }
    (s.spends || []).forEach((sp) => {
      const st = S.canActSpend && S.canActSpend(s, sp, u);
      if (st) add({ type: 'SMART SPEND', ref: sp.id, unit: S.orgName(s, sp.branch), title: st.label + ' · ' + (sp.fields.supplier || ''), value: sp.fields.total, status: sp.status, nv: 48, q: { tab: 'history', sel: sp.id }, kind: st.key === 'GOODS' ? 'receive' : st.key === 'SETTLE' ? 'pay' : st.key === 'VERIFY' ? 'verify' : 'approval' });
      if (sp.createdBy === u.id && sp.status === 'RETURNED') add({ type: 'SMART SPEND', ref: sp.id, unit: S.orgName(s, sp.branch), title: 'Dikembalikan — perbaiki & ajukan ulang', status: sp.status, nv: 48, q: { tab: 'review', cur: sp.id }, kind: 'revision' });
    });
    if (role === 'STAFF')
      s.mrfs.filter((m) => m.requester === u.id && m.status === 'IN_FULFILLMENT').forEach((m) => {
        const f = S.mrfFulfillment(s, m);
        add({ type: 'MRF', ref: m.id, unit: S.orgName(s, m.branch), title: `Dalam pemenuhan ${f.issued}/${f.requested}`, status: m.status, nv: 28, kind: 'info' });
      });
    return t;
  };

  /* ---------- notifications (NV-03) ---------- */
  HAWK.notifications = function (s, u) {
    const out = [];
    HAWK.tasks(s, u).forEach((t) => out.push({ id: 'T:' + t.ref + t.kind, cat: t.kind === 'approval' ? 'approval' : 'transaksi', title: `${t.type} ${t.ref}`, text: t.title, ref: t.ref.split(',')[0], ts: s.meta.demoDate }));
    HAWK.AI.insights(s).filter((i) => i.severity === 'HIGH' && (u.role === 'OWNER' || i.owner === u.role)).forEach((i) => out.push({ id: 'AI:' + i.id, cat: 'ai', title: 'AI Insight', text: i.title, ins: i.id, ts: i.asOf }));
    s.audit.filter((a) => a.user !== u.id).slice(0, 6).forEach((a) => out.push({ id: 'A:' + a.id, cat: 'sistem', title: `${S.userName(s, a.user)} — ${a.op}`, text: a.detail || '', ref: a.ref, ts: a.ts }));
    return out;
  };

  /* ---------- context passed to views ---------- */
  function makeCtx(nv, q) {
    const u = user();
    const sc = scopeInfo(u);
    ui.local[nv] = ui.local[nv] || {};
    const ctx = {
      nv, q, s: store.state, S, U, ui, user: u, role: u.role, scope: sc, L: ui.local[nv],
      inScope: (org) => inScope(org, sc),
      can: (op) => api.can(op, u.role),
      act(op, payload, okMsg, after) {
        const r = api.call(op, payload, u);
        if (r.ok) {
          if (okMsg) ui.toast(typeof okMsg === 'function' ? okMsg(r.data) : okMsg, 'ok', `${op} · ${r.status} · mode ${api.mode}`);
          if (after) after(r.data);
          render();
        } else ui.toast(r.error.message, 'bad', `${op} · ${r.error.code}`);
        return r;
      },
      go: HAWK.go,
      rerender: () => render(),
      val: (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
      },
    };
    return ctx;
  }

  /* ---------- sidebar ---------- */
  function renderSidebar(nv, u) {
    const mods = Object.entries(HAWK.MODULES)
      .map(([k, m]) => {
        const items = HAWK.SCREENS.filter((s) => s.mod === k && HAWK.canSee(u.role, s.nv) && !(s.navHide || []).includes(u.role));
        if (!items.length) return '';
        const cur = HAWK.screen(nv);
        const active = cur && cur.mod === k;
        const open = active || ui.local._open === k;
        return `<div class="nav-mod ${active ? 'active' : ''} ${open ? 'open' : ''}"><button data-mod="${k}" aria-expanded="${open}"><span class="mod-letter">${k}</span>${esc(m.short)}<span class="chev">${ui.icon('chev', 14)}</span></button>
        <div class="nav-items">${items.map((s) => `<a href="#/nv/${s.nv}" class="${s.nv === nv ? 'cur' : ''}"><span class="nvc">${s.code}</span><span>${esc(s.name)}</span></a>`).join('')}</div></div>`;
      })
      .join('');
    const dx = EMBED ? '' : `<a class="nav-dx ${isDx() ? 'cur' : ''}" href="#/dx">${ui.icon('play', 16)}<span><b>Demo Experience Center</b><small>Test Lab · 5 layar · 6 skenario</small></span></a>`;
    $('#nav').innerHTML = dx + mods;
  }

  /* ---------- topbar ---------- */
  function renderTopbar(u) {
    const s = store.state;
    const sc = scopeInfo(u);
    const bus = S.bus(s);
    const buSel = `<select class="tb-select org" id="sel-bu" aria-label="Unit bisnis" ${sc.fixed ? 'disabled' : ''}><option value="ALL">JAENS Spa–Essence–Office</option>${bus.map((b) => `<option value="${b.id}" ${sc.bu === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>`;
    const brs = s.org.filter((o) => ['BRANCH', 'DIVISION'].includes(o.type) && o.status === 'ACTIVE' && (sc.bu === 'ALL' || S.buOf(s, o.id) === sc.bu));
    const brSel = `<select class="tb-select" id="sel-branch" aria-label="Cabang / divisi" ${sc.fixed ? 'disabled' : ''}><option value="ALL">Semua cabang/divisi</option>${brs.map((b) => `<option value="${b.id}" ${sc.branch === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>`;
    const tasks = HAWK.tasks(s, u).length;
    const notifs = HAWK.notifications(s, u).filter((n) => !s.notificationsRead[n.id + u.id]).length;
    $('#topbar').innerHTML = `
      <button class="icon-btn burger" id="burger" aria-label="Menu">${ui.icon('menu')}</button>
      ${buSel}${brSel}
      <div class="tb-search">${ui.icon('search', 16)}<input id="gsearch" placeholder="Cari MRF, PO, item, supplier, aset… (Enter)" aria-label="Pencarian global"></div>
      <div class="tb-spacer"></div>
      <button class="icon-btn" data-nav="2" title="Tugas & Approval" aria-label="Tugas">${ui.icon('inbox')}${tasks ? `<span class="dot">${tasks}</span>` : ''}</button>
      <button class="icon-btn" id="btn-notif" title="Notifikasi" aria-label="Notifikasi">${ui.icon('bell')}${notifs ? `<span class="dot">${notifs}</span>` : ''}</button>
      <button class="icon-btn" id="btn-tour" title="Panduan walkthrough Owner" aria-label="Panduan">${ui.icon('play')}</button>
      <button class="role-chip" id="btn-role" aria-label="Ganti role demo"><span class="av">${u.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span><span><b>${esc(u.name)}</b><small>${esc(HAWK.ROLE_LABEL[u.role])}</small></span></button>`;
  }

  /* ---------- dev contract panel ---------- */
  function devPanel(scr) {
    const ops = scr.ops.map((o) => HAWK.contract(o)).filter(Boolean);
    const acts = scr.actions
      .map(([l, a]) => {
        const c = HAWK.contract(a);
        return `<tr><td>${esc(l)}</td><td class="mono">${esc(a)}</td><td>${c ? ui.intBadge(c.status) : a.startsWith('nav:') ? '<span class="int ce">NAVIGASI</span>' : '<span class="int sim">UI LOKAL</span>'}</td></tr>`;
      })
      .join('');
    return `<details class="devbox" ${ui.local._devOpen ? 'open' : ''} id="devbox"><summary>${ui.icon('code')} Kontrak Developer — ${scr.code} ${esc(scr.name)} <span class="tiny muted" style="margin-left:auto">Modul ${scr.mod} · klik untuk ${ui.local._devOpen ? 'tutup' : 'buka'}</span></summary>
    <div class="dv">
      <div><h4>Informasi layar</h4><dl><dt>NV</dt><dd>${scr.code}</dd><dt>Modul</dt><dd>${scr.mod} — ${esc(HAWK.MODULES[scr.mod].name)}</dd><dt>Role</dt><dd>${scr.roles.map((r) => HAWK.ROLE_LABEL[r]).join(', ')}</dd><dt>Tujuan</dt><dd>${esc(scr.purpose)}</dd></dl>
      <h4>UI contract</h4><dl><dt>Komponen</dt><dd>${esc(scr.components)}</dd><dt>Field</dt><dd>${esc(scr.fields)}</dd><dt>Filter</dt><dd>${esc(scr.filters)}</dd><dt>Drawer/modal</dt><dd>${esc(scr.drawers)}</dd><dt>Responsif</dt><dd>${esc(scr.responsive)}</dd></dl></div>
      <div><h4>Business contract</h4><dl><dt>Input</dt><dd>${esc(scr.inputs)}</dd><dt>Validasi</dt><dd>${esc(scr.validation)}</dd><dt>Status</dt><dd>${esc(scr.status)}</dd><dt>Approval</dt><dd>${esc(scr.approval)}</dd><dt>Eksepsi</dt><dd>${esc(scr.exceptions)}</dd><dt>Terkait</dt><dd>${esc(scr.related)}</dd><dt>ID transaksi</dt><dd>${esc(scr.ids)}</dd></dl>
      <h4>Tombol → aksi</h4><table><tr><th>Tombol</th><th>Operasi</th><th>Status</th></tr>${acts}</table></div>
      <div><h4>Integration contract</h4>${ops.length ? ops.map((c) => `<div style="border-top:1px solid #262626;padding:8px 0"><div class="row"><span class="mono" style="color:#fff">${c.id}</span>${ui.intBadge(c.status)}</div><dl style="margin-top:6px"><dt>HAWK engine</dt><dd>${esc(c.hawk)}</dd><dt>Input</dt><dd class="mono">${esc(c.input)}</dd><dt>Output</dt><dd class="mono">${esc(c.output)}</dd><dt>Transisi</dt><dd>${esc(c.transition)}</dd><dt>Validasi</dt><dd>${esc(c.validation)}</dd><dt>Izin</dt><dd>${c.roles.length === 10 ? 'Semua role (dibatasi scope)' : c.roles.map((r) => HAWK.ROLE_LABEL[r]).join(', ')}</dd><dt>Audit</dt><dd>${esc(c.audit)}</dd></dl></div>`).join('') : '<p class="muted">Layar read-only — memakai selector state bersama.</p>'}</div>
    </div></details>`;
  }

  /* ---------- record drawer: drill-down for every ID ---------- */
  function traceHtml(id) {
    const s = store.state;
    const tr = S.trace(s, id);
    if (tr.length <= 1) return '';
    return `<div class="card" style="margin-top:12px"><h3>${ui.icon('link', 16)} Jejak transaksi terkait</h3><div class="row">${tr.map((x, i) => `${i ? '<span class="muted">→</span>' : ''}${x === id ? `<b class="mono">${esc(x)}</b>` : ui.id(x)}`).join(' ')}</div><p class="tiny muted" style="margin:8px 0 0">Setiap dokumen menyimpan ID sumber, status & waktu (aturan audit #7).</p></div>`;
  }
  function histHtml(h) {
    if (!h || !h.length) return '';
    const s = store.state;
    return `<div class="card" style="margin-top:12px"><h3>Riwayat & audit</h3><ul class="tl">${h
      .slice()
      .reverse()
      .map((x) => `<li><b>${esc(x.action || x.event)}</b> ${x.note ? '— ' + esc(x.note) : ''}<div class="t">${U.datetime(x.ts)} · ${esc(S.userName(s, x.by))}</div></li>`)
      .join('')}</ul></div>`;
  }
  HAWK.openRecord = function (id) {
    const s = store.state;
    const f = S.findRecord(s, id);
    if (!f) {
      const ins = HAWK.AI.insights(s).find((i) => i.id === id);
      if (ins) return HAWK.openInsight(ins.id);
      return ui.toast('Referensi ' + id + ' tidak ditemukan', 'bad');
    }
    const r = f.rec;
    if (f.type === 'EVIDENCE' && HAWK.openEvidence) return HAWK.openEvidence(r.id);
    if (f.type === 'SPEND' && HAWK.spendDrawer) return HAWK.spendDrawer(r);
    let body = '';
    let title = '';
    let foot = '';
    const kv = (pairs) => `<dl class="kv">${pairs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
    const open = (nv, q, l) => `<button class="btn sm" data-nav="${nv}" ${q ? `data-q='${esc(JSON.stringify(q))}'` : ''}>${l || 'Buka layar NV-' + nv}</button>`;
    switch (f.type) {
      case 'MRF': {
        const fu = S.mrfFulfillment(s, r);
        const bc = S.mrfBudgetCheck(s, r);
        title = 'Material Request ' + r.id;
        body = `<div class="card">${kv([['Status', ui.status(r.status)], ['Pemohon', esc(S.userName(s, r.requester))], ['Unit', esc(S.orgName(s, r.branch))], ['Gudang', esc(S.whName(s, r.wh))], ['Cost center', esc(r.cc)], ['Jenis', r.type === 'ROUTINE' ? 'Rutin (BHP)' : 'Non-rutin'], ['Tanggal', U.datetime(r.date)], ['Memo', esc(r.memo)], ['Budget', ui.status(bc.status)], ['Approval', (r.chain || S.mrfChain(s, r).chain).map((c, i) => `${(r.approvals || [])[i] ? '✓ ' : ''}${HAWK.ROLE_LABEL[c]}`).join(' → ')], ['Terpenuhi', `${fu.issued} / ${fu.requested}`]])}</div>
        <div class="card" style="margin-top:12px"><h3>Item & alokasi</h3>${ui.table([{ h: 'Item', f: (l) => esc(S.itemName(s, l.item)) }, { h: 'Qty', num: true, f: (l) => l.qty }, { h: 'Alokasi', f: (l) => (l.alloc || []).map((a) => `${a.path}:${a.qty}${a.ref ? ' ' + ui.id(a.ref) : ''} <span class="tiny muted">(siap ${a.readyQty}, diserahkan ${a.issuedQty})</span>`).join('<br>') || '—' }], r.lines)}</div>`;
        foot = open(62, { mrf: r.id }, 'Lacak perjalanan (NV-62)') + ' ' + open(28, { id: r.id }, 'Buka detail & fulfillment (NV-28)');
        break;
      }
      case 'PO': {
        const t = S.poTotals(s, r);
        title = 'Purchase Order ' + r.id;
        body = `<div class="card">${kv([['Status', ui.status(r.status) + (r.emergency ? ' <span class="badge bad">DARURAT</span>' : '')], ['Supplier', esc(S.supplierName(s, r.supplier))], ['Trading term', esc(r.term)], ['Deliver to', esc(S.whName(s, r.deliverTo))], ['Tanggal', U.datetime(r.date)], ['Promised date', U.date(r.promised)], ['Memo', esc(r.memo)], ['Approval', (r.chain || S.poChain(s, r)).map((c, i) => `${(r.approvals || [])[i] ? '✓ ' : ''}${HAWK.ROLE_LABEL[c]}`).join(' → ')], ['Subtotal', U.rp(t.subtotal)], ['PPN 11%', U.rp(t.tax)], ['Freight', U.rp(t.freight)], ['Total', '<b>' + U.rp(t.total) + '</b>']])}</div>
        <div class="card" style="margin-top:12px"><h3>Baris PO</h3>${ui.table([{ h: 'Item', f: (l) => esc(S.itemName(s, l.item)) }, { h: 'Order', num: true, f: (l) => l.qty }, { h: 'Received', num: true, f: (l) => l.received }, { h: 'Backorder', num: true, f: (l) => l.qty - l.received }, { h: 'Harga', num: true, f: (l) => U.rp(l.price) }, { h: 'MRF', f: (l) => (l.mrfRefs || []).map((m) => ui.id(m.mrf)).join(' ') || '—' }], r.lines)}</div>
        <div class="alert info" style="margin-top:12px">${ui.icon('alert', 16)} PO adalah <b>komitmen pembelian</b> — bukan beban dan bukan tagihan. Beban BHP diakui saat barang dipakai; utang diakui saat faktur diverifikasi.</div>`;
        foot = open(36, { id: r.id }, 'Buka di PO Register (NV-36)');
        break;
      }
      case 'TRANSFER':
        title = 'Transfer ' + r.id;
        body = `<div class="card">${kv([['Status', ui.status(r.status)], ['Dari', esc(S.whName(s, r.from))], ['Ke', esc(S.whName(s, r.to))], ['MRF asal', r.mrf ? ui.id(r.mrf) : 'Manual'], ['Tanggal', U.datetime(r.date)]])}</div><div class="card" style="margin-top:12px">${ui.table([{ h: 'Item', f: (l) => esc(S.itemName(s, l.item)) }, { h: 'Qty', num: true, f: (l) => l.qty }], r.lines)}</div>`;
        foot = open(44, null, 'Buka Transfer (NV-44)');
        break;
      case 'GRN':
        title = 'Goods Receipt ' + r.id;
        body = `<div class="card">${kv([['Status', ui.status(r.status)], ['PO', ui.id(r.po)], ['Gudang', esc(S.whName(s, r.wh))], ['Penerima', esc(S.userName(s, r.receiver))], ['Dokumen', esc((r.docs || []).join(', '))], ['Jurnal', r.journal ? ui.id(r.journal) : '—']])}</div><div class="card" style="margin-top:12px">${ui.table([{ h: 'Item', f: (l) => esc(S.itemName(s, l.item)) }, { h: 'Expected', num: true, f: (l) => l.expected }, { h: 'Diterima', num: true, f: (l) => l.received }, { h: 'Rusak', num: true, f: (l) => l.damaged }, { h: 'Bin', f: (l) => esc(l.bin || '—') }], r.lines)}</div>
        <div class="alert info" style="margin-top:12px">Tahap terpisah: <b>Penerimaan fisik</b> (RECEIVED) → <b>Posting inventory</b> (POSTED, Dr Persediaan / Cr GRNI) → <b>Put-away</b> (STORED).</div>`;
        foot = open(r.status === 'POSTED' ? 43 : 42, null, r.status === 'POSTED' ? 'Put-away (NV-43)' : 'Receiving (NV-42)');
        break;
      case 'DOC':
        title = 'Dokumen tangkapan ' + r.id;
        body = `<div class="card">${kv([['Status', ui.status(r.status)], ['File', esc(r.file)], ['Sumber', '<span class="int sim">SIMULASI EKSTRAKSI AI</span>'], ['Supplier (teks)', esc(r.fields.supplierText)], ['No faktur', esc(r.fields.invoiceNo)], ['PO (teks)', esc(r.fields.poText)], ['Total', U.rp(r.fields.total)], ['Tagihan', r.bill ? ui.id(r.bill) : '—']])}</div>`;
        foot = open(49, { id: r.id }, 'Buka Matching (NV-49)');
        break;
      case 'BILL':
        title = 'Tagihan AP ' + r.id;
        body = `<div class="card">${kv([['Status', ui.status(r.status)], ['Supplier', esc(S.supplierName(s, r.supplier))], ['No faktur', esc(r.invoiceNo)], ['PO', ui.id(r.po)], ['GRN', ui.id(r.grn)], ['Dokumen', r.doc ? ui.id(r.doc) : '—'], ['Match', ui.status(r.matchStatus)], ['Catatan eksepsi', esc(r.exceptionNote || '—')], ['Diverifikasi', esc(S.userName(s, r.verifiedBy))], ['Disetujui', esc(S.userName(s, r.approvedBy))], ['Subtotal', U.rp(r.subtotal)], ['PPN', U.rp(r.tax)], ['Total', '<b>' + U.rp(r.total) + '</b>'], ['Jatuh tempo', U.date(r.due)]])}</div>`;
        foot = open(50, null, 'Buka AP (NV-50)');
        break;
      case 'JOURNAL':
        title = 'Jurnal ' + r.id;
        body = `<div class="card">${kv([['Status', ui.status(r.status)], ['Jenis', esc(r.kind)], ['Sumber', ui.id(r.source)], ['Waktu', U.datetime(r.ts)], ['Memo', esc(r.memo || '')]])}</div><div class="card" style="margin-top:12px">${ui.table([{ h: 'Akun', f: (l) => esc(l.acc) }, { h: 'CC', f: (l) => esc(l.cc) }, { h: 'Debit', num: true, f: (l) => (l.dr ? U.rp(l.dr) : '') }, { h: 'Kredit', num: true, f: (l) => (l.cr ? U.rp(l.cr) : '') }], r.lines)}</div><div class="alert warn" style="margin-top:12px">Jurnal usulan — diposting oleh engine Finance HAWK, bukan buku besar kedua.</div>`;
        foot = open(51, null, 'Buka GL Review (NV-51)');
        break;
      case 'ASSET': {
        const d = S.depreciation(s, r);
        title = 'Aset ' + r.id;
        body = `<div class="card">${kv([['Nama', esc(r.name)], ['Status', ui.status(r.status)], ['Lokasi', esc(r.location)], ['Kategori', esc(r.cat)], ['Perolehan', U.date(r.acquired) + ' · ' + U.rp(r.cost)], ['Akum. depresiasi', U.rp(d.accumulated)], ['Nilai buku', U.rp(d.book)], ['Kondisi', esc(r.condition)], ['Servis terakhir', U.date(r.lastService)]])}</div>${histHtml((r.history || []).map((h) => ({ ts: h.ts, by: h.by, action: h.event })))}`;
        foot = open(54, { id: r.id }, 'Buka detail aset (NV-54)');
        break;
      }
      case 'MAINT':
        title = 'Maintenance ' + r.id;
        body = `<div class="card">${kv([['Status', ui.status(r.status)], ['Aset', ui.id(r.asset)], ['Masalah', esc(r.issue)], ['Prioritas', esc(r.priority)], ['Pelapor', esc(S.userName(s, r.reporter))], ['WO', r.wo ? ui.id(r.wo) : '—']])}</div>`;
        foot = open(55, null, 'Buka Maintenance (NV-55)');
        break;
      case 'WO':
        title = 'Work Order ' + r.id;
        body = `<div class="card">${kv([['Status', ui.status(r.status)], ['Aset', ui.id(r.asset)], ['Request', ui.id(r.mt)], ['Pelaksana', esc(r.assignee)], ['Suku cadang', (r.parts || []).map((p) => `${esc(S.itemName(s, p.item))} × ${p.qty} ${ui.id(p.mrf)}`).join('<br>') || '—'], ['Biaya', U.rp(r.cost)], ['Catatan', esc(r.notes || '—')]])}</div>`;
        foot = open(55, null, 'Buka Maintenance (NV-55)');
        break;
      case 'ITEM': {
        title = 'Item ' + r.id;
        const rows = s.stock.filter((x) => x.item === r.id);
        body = `<div class="card">${kv([['Nama', esc(r.name)], ['Barcode', esc(r.barcode)], ['Satuan', esc(r.unit)], ['Kategori', esc(r.cat)], ['7P', ui.p7(r.p)], ['Jenis', r.routine ? 'Rutin (BHP)' : 'Non-rutin'], ['Harga std', U.rp(r.price)], ['Supplier utama', esc(S.supplierName(s, r.supplier))]])}</div><div class="card" style="margin-top:12px"><h3>Saldo per gudang</h3>${ui.table([{ h: 'Gudang', f: (x) => esc(S.whName(s, x.wh)) }, { h: 'Fisik', num: true, f: (x) => x.onHand }, { h: 'Reservasi', num: true, f: (x) => x.reserved }, { h: 'Tersedia', num: true, f: (x) => x.onHand - x.reserved }, { h: 'Bin', f: (x) => esc(x.bin || '—') }], rows)}</div>`;
        foot = open(40, { q: r.id }, 'Buka Stock Ledger (NV-40)');
        break;
      }
      case 'SUPPLIER':
        title = 'Supplier ' + r.id;
        body = `<div class="card">${kv([['Nama', esc(r.name)], ['Kategori', esc(r.cat)], ['Kota', esc(r.city)], ['Term', esc(r.term)], ['Lead time', r.leadDays + ' hari'], ['Rating', r.rating + ' / 5'], ['On-time', U.pct(r.onTime)]])}</div><div class="card" style="margin-top:12px"><h3>PO terkait</h3>${ui.table([{ h: 'PO', f: (p) => ui.id(p.id) }, { h: 'Status', f: (p) => ui.status(p.status) }, { h: 'Total', num: true, f: (p) => U.rp(S.poTotals(s, p).total) }], s.pos.filter((p) => p.supplier === r.id))}</div>`;
        foot = open(33, null, 'Buka Supplier Master (NV-33)');
        break;
      case 'PROJECT':
        title = 'Proyek ' + r.id;
        body = `<div class="card">${kv([['Nama', esc(r.name)], ['BU', esc(S.orgName(s, r.bu))], ['Tipe', r.type === 'INNOVATION' ? 'Inovasi' : 'Operasional'], ['Status', ui.status(r.status)], ['Capex', U.rp(r.capex) + ' ' + ui.demo('DEMO')], ['Opex', U.rp(r.opex)], ['Payback', (r.payback || '—') + ' bulan'], ['IRR', r.irr ? U.pct(r.irr) : '—']])}</div>`;
        foot = open(14, { id: r.id }, 'Buka Investasi (NV-14)');
        break;
      default:
        title = f.type + ' ' + id;
        body = `<div class="card"><pre class="mono" style="white-space:pre-wrap">${esc(JSON.stringify(r, null, 1))}</pre></div>`;
    }
    ui.openDrawer(title, body + histHtml(r.history) + traceHtml(id), foot, f.type);
  };

  HAWK.openInsight = function (iid) {
    const s = store.state;
    const i = HAWK.AI.insights(s).find((x) => x.id === iid);
    if (!i) return;
    const st = i.state;
    const body = `<div class="alert violet">${ui.icon('ai', 16)}<div><b>AI SIMULASI — deterministik dari data DEMO.</b> Tidak ada model AI, OCR, atau koneksi data produksi yang aktif. Rekomendasi tidak dieksekusi otomatis.</div></div>
      <div class="card" style="margin-top:12px"><div class="row"><span class="sev ${i.severity}"></span><b>${esc(i.title)}</b></div>
      <div class="tiny muted" style="margin-top:4px">${esc(i.area)} ${i.p ? ui.p7(i.p) : ''} · sumber: ${esc(i.source)} · per ${U.date(i.asOf)}</div>
      <ol class="ichain">
        <li><span class="ic-h">1 · Temuan</span><div>${esc(i.finding)}</div>${i.statements.filter((x) => ['FACT', 'METRIC'].includes(x.kind)).map((x) => `<div class="stmt"><span class="kind ${HAWK.AI.KIND[x.kind].cls}">${HAWK.AI.KIND[x.kind].label}</span><span class="small">${esc(x.text)}</span></div>`).join('')}</li>
        <li><span class="ic-h">2 · Bukti</span>${ui.table([{ h: 'Bukti', f: (e) => esc(e.label) }, { h: 'Nilai / referensi', f: (e) => (e.ref ? ui.id(e.ref) : e.nav ? `<button class="link" data-nav="${e.nav.nv}" ${e.nav.q ? `data-q='${esc(JSON.stringify({ q: e.nav.q }))}'` : ''}>${esc(e.value)}</button>` : esc(e.value)) }], i.evidence)}</li>
        <li><span class="ic-h">3 · Dampak bisnis</span><div>${esc(i.impact)} <span class="badge warn">estimasi</span></div>${i.statements.filter((x) => ['FORECAST', 'HYPOTHESIS'].includes(x.kind)).map((x) => `<div class="stmt"><span class="kind ${HAWK.AI.KIND[x.kind].cls}">${HAWK.AI.KIND[x.kind].label}</span><span class="small">${esc(x.text)}</span></div>`).join('')}</li>
        <li><span class="ic-h">4 · Rekomendasi</span>${i.statements.filter((x) => x.kind === 'RECOMMENDATION').map((x) => `<div class="stmt"><span class="kind ${HAWK.AI.KIND[x.kind].cls}">${HAWK.AI.KIND[x.kind].label}</span><span class="small">${esc(x.text)}</span></div>`).join('') || '<div class="small muted">—</div>'}</li>
        <li><span class="ic-h">5 · Peran penanggung jawab</span><div><b>${esc(HAWK.ROLE_LABEL[i.owner] || i.owner)}</b> <span class="tiny muted">· alur: ${esc(i.workflow)}</span></div></li>
        <li><span class="ic-h">6 · Keputusan manusia</span><div>${ui.status(st.status)} ${st.by ? `<span class="tiny muted">${esc(S.userName(s, st.by))} · ${U.datetime(st.ts)}${st.note ? ' · ' + esc(st.note) : ''}</span>` : '<span class="tiny muted">belum ada keputusan — AI tidak mengeksekusi apa pun</span>'}</div></li>
      </ol></div>`;
    const canAct = api.can('insight.act', user().role);
    const foot = canAct
      ? `<button class="btn ghost sm" data-ins-act="DISMISS" data-ins="${i.id}">Abaikan…</button><button class="btn ghost sm" data-ins-act="ACKNOWLEDGE" data-ins="${i.id}">Akui</button><button class="btn ghost sm" data-ins-act="ASSIGN" data-ins="${i.id}">Tugaskan ke ${HAWK.ROLE_LABEL[i.owner]}</button><button class="btn sm" data-ins-act="DONE" data-ins="${i.id}">Tandai selesai</button>`
      : '<span class="small muted">Role ini hanya dapat melihat insight.</span>';
    ui.openDrawer('AI Insight', body, foot, i.area);
  };

  /* ---------- Owner walkthrough (MP-HAWK-02 §14) ---------- */
  const tourMrf = (s) => s.mrfs.find((m) => m.requester === 'U-STF' && !SEED_MRF.includes(m.id) && m.branch === 'BR-SHN' && m.lines.some((l) => l.item === 'BHP-001'));
  const tourPo = (s, m) => {
    const a = m && m.lines[0].alloc.find((x) => x.path === 'PURCHASE');
    return a && a.ref ? s.pos.find((p) => p.id === a.ref) : null;
  };
  const TOUR = [
    { t: 'Masuk sebagai Staff', d: 'Ganti role ke Therapist Spa Shanti (Nyoman Dewi). Menu menyusut ke layar MRF sederhana.', user: 'U-STF', nv: 24, done: (s) => prefs.visited['U-STF'] },
    { t: 'Buat MRF di Spa Shanti', d: 'Buat MRF: Minyak Pijat Lavender 1L × 10. Unit, gudang & cost center terisi otomatis.', user: 'U-STF', nv: 26, done: (s) => !!tourMrf(s) },
    { t: 'Tinjau budget BHP bulanan', d: 'Lihat dampak budget item November: budget 40, aktual 26, MRF ini 10 → 90% (peringatan).', user: 'U-SPV', nv: 30, q: (s) => (tourMrf(s) ? { id: tourMrf(s).id } : null), done: (s) => prefs.visited['nv30'] },
    { t: 'Supervisor menyetujui', d: 'Sebagai Supervisor Shanti, setujui MRF di antrean approval.', user: 'U-SPV', nv: 29, done: (s) => tourMrf(s) && ['IN_FULFILLMENT', 'FULFILLED'].includes(tourMrf(s).status) },
    { t: 'Lihat jalur fulfillment', d: 'Sistem membagi otomatis: 4 stok lokal, 3 transfer dari Spa Ubud, 3 pembelian. Gudang menyerahkan stok lokal & memproses transfer.', user: 'U-WHS', nv: 28, q: (s) => (tourMrf(s) ? { id: tourMrf(s).id } : null), done: (s) => tourMrf(s) && S.mrfFulfillment(s, tourMrf(s)).TRANSFER.issued === 3 && S.mrfFulfillment(s, tourMrf(s)).LOCAL.issued === 4 },
    { t: 'Buat & telusuri PO', d: 'Purchasing mengonsolidasi kebutuhan → buat PO → ajukan → setujui → kirim ke vendor.', user: 'U-PUR', nv: 32, done: (s) => { const p = tourPo(s, tourMrf(s)); return p && ['SENT', 'PARTIAL', 'RECEIVED'].includes(p.status); } },
    { t: 'Terima barang via checklist', d: 'Gudang membuka PO, mencocokkan qty aktual, lalu posting penerimaan (fisik ≠ posting).', user: 'U-WHS', nv: 42, done: (s) => { const p = tourPo(s, tourMrf(s)); return p && s.grns.some((g) => g.po === p.id && g.status !== 'RECEIVED'); } },
    { t: 'Konfirmasi simpan di rak', d: 'Scan QR bin (mis. SHN-A-01) untuk put-away; stok dilepas ke MRF.', user: 'U-WHS', nv: 43, done: (s) => { const p = tourPo(s, tourMrf(s)); return p && s.grns.some((g) => g.po === p.id && g.status === 'STORED'); } },
    { t: 'Lihat stok terbaru & serahkan', d: 'Serahkan 3 unit hasil pembelian → MRF 10/10. Cek saldo & ledger Shanti.', user: 'U-WHS', nv: 45, done: (s) => tourMrf(s) && tourMrf(s).status === 'FULFILLED' },
    { t: 'Simulasikan ekstraksi faktur AI', d: 'Finance memilih faktur contoh PT Aroma Bali Lestari — ekstraksi AI simulasi.', user: 'U-FIN', nv: 48, done: (s) => { const p = tourPo(s, tourMrf(s)); return p && s.docs.some((d) => d.fields.poText === p.id); } },
    { t: 'Matching & status hutang', d: 'Jalankan three-way match, verifikasi manusia → AP draft. Setujui tagihan sebagai BU Manager (pemisahan tugas).', user: 'U-FIN', nv: 49, done: (s) => { const p = tourPo(s, tourMrf(s)); return p && s.bills.some((b) => b.po === p.id && ['APPROVED', 'PAID'].includes(b.status)); } },
    { t: 'Buka MRF asal dari Finance', d: 'Di AP / tagihan, klik jejak transaksi sampai ke MRF asal.', user: 'U-FIN', nv: 50, done: (s) => prefs.visited['trace'] },
    { t: 'Lihat Budget 7P & produktivitas', d: 'Budget vs Actual vs Commitment vs Forecast — Product JAENS Spa bertambah sesuai pemakaian.', user: 'U-OWN', nv: 23, done: (s) => prefs.visited['nv23o'] },
    { t: 'Buka AI Insight + bukti', d: 'Buka insight Massage Oil Spa Shanti beserta bukti (MRF, PO, GRN, tagihan) dan rekomendasi.', user: 'U-OWN', nv: 57, done: (s) => prefs.visited['insight'] },
  ];
  HAWK.TOUR = TOUR;
  function renderTour() {
    const s = store.state;
    const doneIdx = TOUR.map((t) => !!t.done(s));
    let cur = doneIdx.indexOf(false);
    if (cur === -1) cur = TOUR.length - 1;
    const st = TOUR[cur];
    const all = doneIdx.every(Boolean);
    $('#tour').classList.toggle('on', prefs.tour);
    $('#tour-mini').classList.toggle('on', !prefs.tour);
    $('#tour').innerHTML = `<div class="tour-head">${ui.icon('play', 16)} Walkthrough Owner (14 langkah) <span class="badge dark" style="margin-left:auto">${doneIdx.filter(Boolean).length}/14</span><button class="icon-btn" style="width:28px;height:28px" id="tour-hide" aria-label="Sembunyikan">${ui.icon('x', 14)}</button></div>
      <div class="tour-body">${all ? `<div class="stepno">SELESAI</div><p>Seluruh perjalanan MRF → Budget 7P → Approval → Purchasing → Receiving → Gudang → Finance → AI Insight konsisten. Gunakan <b>Reset Demo</b> untuk mengulang.</p>` : `<div class="stepno">LANGKAH ${cur + 1} · ${esc(HAWK.ROLE_LABEL[s.users.find((u) => u.id === st.user).role])}</div><b>${esc(st.t)}</b><p>${esc(st.d)}</p>`}
      <div class="row">${all ? '' : `<button class="btn sm" id="tour-go" data-step="${cur}">${prefs.user === st.user && parseHash().nv === st.nv ? 'Saya di sini ✓' : 'Ke langkah ini'}</button>`}<button class="btn ghost sm" id="tour-list">Daftar langkah</button></div>
      <div class="tour-prog">${doneIdx.map((d, i) => `<i class="${d ? 'd' : ''}" title="${i + 1}. ${esc(TOUR[i].t)}"></i>`).join('')}</div></div>`;
  }

  /* ---------- main render ---------- */
  /* Loading / error states (simulated through the sidebar "Kondisi" selector) */
  let loadedNv = null;
  let loadTimer = null;
  const loadingState = () => `<div class="stack" aria-busy="true" aria-live="polite"><div class="tiny muted">${ui.icon('clock', 14)} Memuat data dari adapter…</div><div class="grid g4">${'<div class="card skel" style="height:86px"></div>'.repeat(4)}</div><div class="card skel" style="height:220px"></div></div>`;
  const errorState = (scr) => `<div class="card state-err" role="alert" style="max-width:680px"><h3>${ui.icon('alert', 16)} Data ${scr.code} tidak dapat dimuat</h3><p class="small">Adapter mengembalikan <span class="mono">NETWORK_ERROR</span> (simulasi). Tidak ada data yang berubah; transaksi yang sedang diisi tidak dikirim. Backend HAWK sebenarnya harus mengembalikan kode error terstruktur + <i>retryable</i>, dan operasi tulis wajib idempoten agar aman diulang.</p><div class="row" style="gap:8px"><button class="btn sm" data-retry>Coba lagi</button><button class="btn sm ghost" data-net-reset>Kembalikan ke Normal</button></div></div>`;
  const isDx = () => !EMBED && /^#\/dx/.test(location.hash);
  function render() {
    document.documentElement.classList.toggle('dx-page', isDx());
    if (isDx() && HAWK.dxCenter) {
      const u = user();
      renderSidebar(0, u);
      renderTopbar(u);
      if (!$('#view').querySelector('[data-dx-root]')) {
        $('#view').innerHTML = HAWK.dxCenter.render(makeCtx(0, {}));
        $('#view').dataset.nv = 'dx';
        HAWK.dxCenter.mount(makeCtx(0, {}));
      } else HAWK.dxCenter.refresh();
      document.title = 'Demo Experience Center — HAWK × JAENS (DEMO)';
      $('#mode-label').textContent = api.mode === 'MOCK' ? 'Mock Adapter' : 'HAWK API (tidak terhubung)';
      renderTour();
      $('#sidebar').classList.remove('on');
      return;
    }
    const { nv, q } = parseHash();
    const u = user();
    const scr = HAWK.screen(nv) || HAWK.screen(1);
    renderSidebar(scr.nv, u);
    renderTopbar(u);
    const ctx = makeCtx(scr.nv, q);
    const view = HAWK.views[scr.nv];
    let html = '';
    const crumbs = `<div class="crumbs"><a href="#/nv/${HAWK.ROLE_HOME[u.role]}">Beranda</a> › <span>Modul ${scr.mod} · ${esc(HAWK.MODULES[scr.mod].name)}</span> › <b>${scr.code}</b></div>`;
    if (!HAWK.canSee(u.role, scr.nv)) {
      html = `${crumbs}<div class="card" style="max-width:640px"><h3>${ui.icon('shield')} Akses dibatasi untuk role ${esc(HAWK.ROLE_LABEL[u.role])}</h3><p class="small">${scr.code} ${esc(scr.name)} hanya untuk: ${scr.roles.map((r) => HAWK.ROLE_LABEL[r]).join(', ')}.</p><p class="tiny muted">Ini simulasi tampilan berbasis role — bukan keamanan. Backend HAWK wajib menegakkan otorisasi secara independen.</p><button class="btn" data-nav="${HAWK.ROLE_HOME[u.role]}">Ke beranda role</button></div>`;
    } else {
      let content;
      const net = (api.adapters.MOCK || {}).net || 'OK';
      const loading = net === 'SLOW' && loadedNv !== scr.nv + JSON.stringify(q);
      try {
        if (net === 'FAIL' && api.mode === 'MOCK') content = errorState(scr);
        else if (loading) content = loadingState();
        else content = view ? view.render(ctx) : `<div class="card">Layar belum dirender.</div>`;
      } catch (e) {
        console.error(e);
        content = `<div class="card state-err"><h3>${ui.icon('alert', 16)} Gagal menampilkan ${scr.code}</h3><p class="small">${esc(e.message)}</p><button class="btn sm" data-retry>Coba lagi</button></div>`;
      }
      if (loading) {
        clearTimeout(loadTimer);
        loadTimer = setTimeout(() => { loadedNv = scr.nv + JSON.stringify(q); render(); }, 700);
      } else if (net !== 'FAIL') loadedNv = scr.nv + JSON.stringify(q);
      const head = view && view.head ? view.head(ctx) : '';
      html = `${crumbs}<div class="page-head"><span class="nv-tag">${scr.code}</span><div><h1>${esc(scr.name)}</h1><p>${esc(scr.purpose)}</p></div><div class="actions">${head}</div></div>${content}${prefs.dev ? devPanel(scr) : ''}`;
    }
    $('#view').innerHTML = html;
    $('#view').dataset.nv = scr.nv;
    document.title = `${scr.code} ${scr.name} — HAWK × JAENS (DEMO)`;
    $('#mode-label').textContent = api.mode === 'MOCK' ? 'Mock Adapter' : 'HAWK API (tidak terhubung)';
    $('#devtoggle').checked = prefs.dev;
    if (view && view.mount) view.mount(ctx);
    // visit tracking for walkthrough
    prefs.visited[u.id] = true;
    if (scr.nv === 30 && u.role === 'SUPERVISOR') prefs.visited.nv30 = true;
    if (scr.nv === 23 && u.role === 'OWNER') prefs.visited.nv23o = true;
    savePrefs();
    renderTour();
    $('#sidebar').classList.remove('on');
  }
  HAWK.render = render;

  /* ---------- popovers ---------- */
  function showPop(anchor, html) {
    const p = $('#pop');
    p.innerHTML = html;
    p.classList.add('on');
    const r = anchor.getBoundingClientRect();
    const w = Math.min(360, window.innerWidth - 20);
    p.style.width = w + 'px';
    p.style.top = r.bottom + 8 + 'px';
    p.style.left = Math.max(10, Math.min(window.innerWidth - w - 10, r.right - w)) + 'px';
  }
  const hidePop = () => $('#pop').classList.remove('on');
  function rolePop(anchor) {
    const s = store.state;
    showPop(anchor, `<div class="pop-head">${ui.icon('users', 16)} Ganti role DEMO <span class="badge demo" style="margin-left:auto">bukan login</span></div>${s.users
      .map((u) => `<div class="pop-item ${u.id === prefs.user ? 'cur' : ''}" data-user="${u.id}" role="button" tabindex="0"><span class="av">${u.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span><span><b>${esc(u.name)}</b><br><span class="tiny muted">${esc(HAWK.ROLE_LABEL[u.role])} · ${esc(u.title)}</span></span></div>`)
      .join('')}<div class="pop-item tiny muted" style="cursor:default">Tidak ada password/kredensial. Role switcher hanya untuk demo.</div>`);
  }
  function notifPop(anchor) {
    const s = store.state;
    const u = user();
    const ns = HAWK.notifications(s, u).slice(0, 12);
    showPop(anchor, `<div class="pop-head">${ui.icon('bell', 16)} Notifikasi <button class="link tiny" style="margin-left:auto" data-nav="3">Lihat semua</button></div>${ns.length ? ns.map((n) => `<div class="pop-item" ${n.ins ? `data-ins-open="${n.ins}"` : n.ref ? `data-id="${esc(n.ref)}"` : ''}><span class="av" style="background:${n.cat === 'ai' ? '#5b34c9' : n.cat === 'approval' ? '#a67c1f' : '#333'};color:#fff">${n.cat === 'ai' ? 'AI' : n.cat === 'approval' ? '✓' : '•'}</span><span><b>${esc(n.title)}</b><br><span class="tiny muted">${esc(n.text)}</span></span></div>`).join('') : '<div class="empty">Tidak ada notifikasi</div>'}`);
    ns.forEach((n) => (s.notificationsRead[n.id + u.id] = true));
    store.save();
  }
  function tourListPop(anchor) {
    const s = store.state;
    showPop(anchor, `<div class="pop-head">Walkthrough Owner — 14 langkah</div>${TOUR.map((t, i) => `<div class="pop-item" data-tour-step="${i}"><span class="av" style="background:${t.done(s) ? '#1f9d55' : '#333'};color:#fff">${t.done(s) ? '✓' : i + 1}</span><span><b>${esc(t.t)}</b><br><span class="tiny muted">${esc(HAWK.ROLE_LABEL[s.users.find((u) => u.id === t.user).role])} · NV-${String(t.nv).padStart(2, '0')}</span></span></div>`).join('')}`);
  }
  function gotoStep(i) {
    const s = store.state;
    const st = TOUR[i];
    prefs.user = st.user;
    savePrefs();
    const q = st.q ? st.q(s) : null;
    HAWK.go(st.nv, q || undefined);
    render();
  }

  /* ---------- global search (NV-04 inline) ---------- */
  HAWK.search = function (q) {
    const s = store.state;
    q = (q || '').trim().toLowerCase();
    if (q.length < 2) return [];
    const hits = [];
    const add = (type, id, title, status, nv) => hits.push({ type, id, title, status, nv });
    s.mrfs.forEach((m) => (m.id.toLowerCase().includes(q) || m.memo.toLowerCase().includes(q) || m.lines.some((l) => S.itemName(s, l.item).toLowerCase().includes(q))) && add('MRF', m.id, `${S.orgName(s, m.branch)} · ${m.lines.map((l) => S.itemName(s, l.item)).join(', ')}`, m.status));
    s.pos.forEach((p) => (p.id.toLowerCase().includes(q) || S.supplierName(s, p.supplier).toLowerCase().includes(q)) && add('PO', p.id, S.supplierName(s, p.supplier), p.status));
    s.items.forEach((i) => (i.id.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || i.barcode.includes(q)) && add('Item', i.id, `${i.name} · stok total ${S.totalStock(s, i.id)} ${i.unit}`, 'ACTIVE'));
    s.suppliers.forEach((x) => x.name.toLowerCase().includes(q) && add('Supplier', x.id, x.name, x.status));
    s.assets.forEach((a) => (a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)) && add('Aset', a.id, a.name, a.status));
    [...s.transfers, ...s.grns, ...s.bills, ...s.docs, ...s.journals, ...s.workOrders, ...s.maintenance].forEach((r) => r.id.toLowerCase().includes(q) && add('Dokumen', r.id, r.memo || r.invoiceNo || r.kind || r.issue || '', r.status));
    return hits.slice(0, 40);
  };

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target;
    const g = (sel) => t.closest(sel);
    if (!g('#pop') && !g('#btn-role') && !g('#btn-notif') && !g('#tour-list')) hidePop();
    let el;
    if ((el = g('[data-user]'))) {
      prefs.user = el.dataset.user;
      savePrefs();
      hidePop();
      delete ui.local[48]; // Smart Spend phone state belongs to the previous demo user

      const u = user();
      ui.toast('Role demo: ' + HAWK.ROLE_LABEL[u.role], '', u.name + ' — menu & aksi menyesuaikan role');
      const { nv } = parseHash();
      if (!HAWK.canSee(u.role, nv)) HAWK.go(HAWK.ROLE_HOME[u.role]);
      else render();
      return;
    }
    if ((el = g('[data-tour-step]'))) return hidePop(), gotoStep(+el.dataset.tourStep);
    if ((el = g('#tour-go'))) return gotoStep(+el.dataset.step);
    if (g('#tour-hide')) return (prefs.tour = false), savePrefs(), renderTour();
    if (g('#tour-mini') || g('#btn-tour')) return (prefs.tour = true), savePrefs(), renderTour();
    if ((el = g('#tour-list'))) return tourListPop(el);
    if ((el = g('#btn-role'))) return rolePop(el);
    if ((el = g('#btn-notif'))) return notifPop(el);
    if (g('#burger')) return $('#sidebar').classList.toggle('on');
    if ((el = g('[data-mod]'))) {
      ui.local._open = ui.local._open === el.dataset.mod ? null : el.dataset.mod;
      const m = el.parentElement;
      m.classList.toggle('open');
      return;
    }
    if ((el = g('[data-retry]'))) {
      loadedNv = null;
      return render();
    }
    if ((el = g('[data-net-reset]'))) {
      api.adapters.MOCK.net = 'OK';
      $('#netSel').value = 'OK';
      return render();
    }
    if ((el = g('[data-ins-open]'))) {
      hidePop();
      prefs.visited.insight = true;
      savePrefs();
      return HAWK.openInsight(el.dataset.insOpen);
    }
    if ((el = g('[data-ins-act]'))) {
      const id = el.dataset.ins;
      const a = el.dataset.insAct;
      const run = (note) => {
        const ins = HAWK.AI.insights(store.state).find((x) => x.id === id);
        const r = api.call('insight.act', { id, action: a, note, owner: ins && ins.owner }, user());
        if (r.ok) ui.toast('Insight: ' + ui.statusLabel(a), 'ok', 'Tercatat di audit — AI tidak mengeksekusi aksi');
        else ui.toast(r.error.message, 'bad');
        render();
        HAWK.openInsight(id);
      };
      if (a === 'DISMISS') ui.ask('Abaikan insight', 'Alasan (wajib)', run, { danger: true, ok: 'Abaikan' });
      else run('');
      return;
    }
    if ((el = g('[data-ev]')) && !g('[data-a]')) {
      e.preventDefault();
      hidePop();
      return HAWK.openEvidence && HAWK.openEvidence(el.dataset.ev);
    }
    if ((el = g('[data-id]')) && !g('[data-a]')) {
      e.preventDefault();
      if (g('#drawer') && /^(BL|PY|DC)/.test(($('#drawer-title').textContent.match(/\b[A-Z]{2}\d+/) || [''])[0]) && /^PR/.test(el.dataset.id)) {
        prefs.visited.trace = true;
        savePrefs();
      }
      if (/^PR/.test(el.dataset.id) && ['FINANCE', 'OWNER', 'BU_MANAGER'].includes(user().role) && (g('#drawer') || [47, 49, 50, 51].includes(+$('#view').dataset.nv))) {
        prefs.visited.trace = true;
        savePrefs();
      }
      hidePop();
      HAWK.openRecord(el.dataset.id);
      renderTour();
      return;
    }
    if ((el = g('[data-nav]')) && !g('[data-a]')) {
      e.preventDefault();
      hidePop();
      ui.closeDrawer();
      ui.closeModal();
      let q;
      if (el.dataset.q) q = JSON.parse(el.dataset.q);
      return HAWK.go(+el.dataset.nav, q);
    }
    if (g('[data-close-modal]')) return ui.closeModal();
    if (g('[data-close-drawer]') || t.id === 'scrim') {
      ui.closeModal();
      return ui.closeDrawer();
    }
    if ((el = g('[data-tab]'))) {
      const nv = +$('#view').dataset.nv;
      ui.local[nv] = ui.local[nv] || {};
      ui.local[nv][el.dataset.tab] = el.dataset.v;
      return render();
    }
    if ((el = g('[data-a]'))) {
      const nv = +$('#view').dataset.nv;
      const view = HAWK.views[nv];
      const fn = view && view.actions && view.actions[el.dataset.a];
      if (fn) {
        e.preventDefault();
        fn(el, makeCtx(nv, parseHash().q), e);
      }
      return;
    }
    if (t.closest('#devbox summary')) {
      ui.local._devOpen = !$('#devbox').open;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ui.closeModal();
      ui.closeDrawer();
      hidePop();
    }
    if (e.key === 'Enter' && e.target.id === 'gsearch') HAWK.go(4, { q: e.target.value });
    if (e.key === 'Enter' && e.target.matches('[data-id],[data-user],[data-tour-step]')) e.target.click();
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'sel-bu') {
      prefs.bu = e.target.value;
      prefs.branch = 'ALL';
      savePrefs();
      render();
    }
    if (e.target.id === 'sel-branch') {
      prefs.branch = e.target.value;
      savePrefs();
      render();
    }
    if (e.target.id === 'devtoggle') {
      prefs.dev = e.target.checked;
      savePrefs();
      render();
    }
    if (e.target.id === 'netSel') {
      api.adapters.MOCK.net = e.target.value;
      loadedNv = null;
      ui.toast('Kondisi simulasi: ' + e.target.options[e.target.selectedIndex].text.replace('Kondisi: ', ''), e.target.value === 'OK' ? 'ok' : 'warn', 'Hanya untuk mendemokan state loading/error — tidak memengaruhi data');
      render();
    }
    if (e.target.id === 'modeSel') {
      api.setMode(e.target.value);
      ui.toast(e.target.value === 'MOCK' ? 'Mock Adapter aktif' : 'HAWK API Adapter: belum terhubung — semua aksi akan menampilkan NOT_CONNECTED', e.target.value === 'MOCK' ? 'ok' : 'bad');
      render();
    }
    const nv = +$('#view').dataset.nv;
    const view = HAWK.views[nv];
    if (e.target.dataset.ch && view && view.actions && view.actions[e.target.dataset.ch]) view.actions[e.target.dataset.ch](e.target, makeCtx(nv, parseHash().q), e);
  });
  document.addEventListener('input', (e) => {
    const nv = +$('#view').dataset.nv;
    const view = HAWK.views[nv];
    if (e.target.dataset.in && view && view.actions && view.actions[e.target.dataset.in]) view.actions[e.target.dataset.in](e.target, makeCtx(nv, parseHash().q), e);
  });
  window.addEventListener('hashchange', render);
  /* one sandbox shared by every window of this origin (Demo Experience Center frames) */
  window.addEventListener('storage', (e) => {
    if (e.key !== HAWK.STATE_KEY) return;
    if (!store.sync()) return;
    if (isDx() && HAWK.dxCenter) {
      HAWK.dxCenter.onSync();
      renderTopbar(user());
    } else if (!document.querySelector('#modal.on')) render();
    else renderTopbar(user());
  });
  /* tutor highlight inside THIS window: stamps the stable target ID on the real control */
  HAWK.dxFocus = function (sel, label, tid) {
    HAWK.dxClear();
    let el = null;
    try {
      el = document.querySelector('#view ' + sel) || document.querySelector(sel);
    } catch (e) {
      el = null;
    }
    if (!el) return false;
    el.classList.add('dx-hl');
    el.setAttribute('data-dx-target', tid || '1');
    const tip = document.createElement('div');
    tip.className = 'dx-tip';
    tip.textContent = label || 'Tekan di sini';
    document.body.appendChild(tip);
    // scroll THIS window only (scrollIntoView would also scroll the Demo Center page that hosts the frame)
    const r0 = el.getBoundingClientRect();
    window.scrollTo(0, Math.max(0, r0.top + window.scrollY - window.innerHeight / 2));
    const r = el.getBoundingClientRect();
    tip.style.top = Math.max(6, r.top + window.scrollY - 34) + 'px';
    tip.style.left = Math.max(6, Math.min(window.innerWidth - 260, r.left + window.scrollX)) + 'px';
    return true;
  };
  HAWK.dxClear = function () {
    document.querySelectorAll('.dx-hl').forEach((x) => {
      x.classList.remove('dx-hl');
      x.removeAttribute('data-dx-target');
    });
    document.querySelectorAll('.dx-tip').forEach((x) => x.remove());
  };

  HAWK.resetDemo = function () {
    ui.openModal('Reset data demo?', '<p>Semua transaksi yang dibuat selama demo akan dihapus dan data kembali ke kondisi awal (DEMO). Preferensi tampilan tetap.</p>', '<button class="btn ghost" data-close-modal>Batal</button><button class="btn bad" id="reset-ok">Reset data demo</button>');
    $('#reset-ok').onclick = () => {
      store.reset();
      Object.keys(ui.local).forEach((k) => delete ui.local[k]);
      prefs.visited = {};
      savePrefs();
      ui.closeModal();
      ui.toast('Data demo direset', 'ok');
      render();
    };
  };
  document.getElementById('btn-reset').addEventListener('click', HAWK.resetDemo);

  HAWK.boot = function () {
    if (!location.hash) location.hash = `#/nv/${HAWK.ROLE_HOME[user().role]}`;
    render();
  };
})(window);
