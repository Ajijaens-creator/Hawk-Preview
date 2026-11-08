/* Module D — 7P Budget Management (NV-15..23).
   Follows Aji's "HAWK Module D Developer Handoff" (2026-11-08): FY2027 line-level planning (unit × 7P × item, qty × price),
   separate dimensions 7P / stream / fund type, monthly weights = 100 %, Draft → Head → Finance → Owner → Locked,
   revisions never overwrite Original, Profit (P7) is a target/outcome — never spend.
   FY2026 budgets stay LOCKED and are wired to live transactions (MRF commitment, stock issue actual) for BvA. */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const esc = U.esc;
  const V = HAWK.views;
  const q = (o) => esc(JSON.stringify(o));
  const P6 = () => HAWK.SEVEN_P.filter((p) => !p.outcome);
  const pName = (k) => (HAWK.SEVEN_P.find((p) => p.key === k) || {}).name || k;
  const KIND = { OPEX: ['OPEX', ''], INVENTORY: ['Inventory', 'info'], CAPEX: ['CAPEX', 'gold'], WORKING_CAPITAL: ['Working capital', 'violet'], DEPOSIT: ['Deposit', 'violet'], FIN_INVESTMENT: ['Investasi keuangan', 'violet'], PERFORMANCE: ['PERFORMANCE', 'ok'] };
  const kindB = (k) => `<span class="badge ${(KIND[k] || ['', ''])[1]}">${(KIND[k] || [k])[0]}</span>`;
  const streamB = (x) => (x === 'INNOVATION' ? '<span class="badge violet">Innovation</span>' : '<span class="badge info">Operational</span>');
  const STAGES = ['Draft', 'Head Review', 'Finance Review', 'Owner Review', 'Locked'];
  const short = (v) => U.rp(v, { short: true });

  /* shared helpers */
  // Branch/division-scoped users (e.g. Supervisor Shanti) see their parent BU's budget (read per permission)
  const budgetsFor = (ctx) => ctx.s.budgets.filter((b) => ctx.role === 'OWNER' || ['FINANCE', 'ADMIN'].includes(ctx.role) || ctx.user.scope.some((x) => x === b.bu || S.buOf(ctx.s, x) === b.bu));
  const noBudget = () => `<div class="card">${ui.empty('<b>Belum ada budget dalam lingkup akses Anda</b><div class="tiny" style="margin-top:6px">Budget dibuat BU Manager / Finance di NV-15. Hubungi BU Manager bila Anda seharusnya melihat budget unit ini.</div>')}</div>`;
  const pickBudget = (ctx, pref) => {
    const list = budgetsFor(ctx);
    return list.find((b) => b.id === (ctx.L.b || ctx.q.b)) || list.find((b) => b.id === pref) || list.find((b) => b.bu === pref) || list[0];
  };
  const budgetSel = (ctx, b, filter) =>
    `<select class="inp" style="max-width:300px" data-ch="selB" aria-label="Budget">${budgetsFor(ctx).filter(filter || (() => true)).map((x) => `<option value="${x.id}" ${x.id === b.id ? 'selected' : ''}>FY${x.fy} · ${esc(S.orgName(ctx.s, x.bu))} · ${esc(S.budgetStage(ctx.s, x))}</option>`).join('')}</select>`;
  const stageB = (s, b) => {
    const st = S.budgetStage(s, b);
    return `<span class="badge ${st === 'Locked' ? 'dark' : st === 'Draft' ? '' : 'warn'}">${esc(st)}</span>`;
  };
  const units = (s, b) => U.uniq((b.plan || []).map((l) => l.unit));
  const canEdit = (ctx, b) => b.status === 'DRAFT' && ctx.can('budget.upsertPlanLine');
  const selB = (el, ctx) => {
    ctx.L.b = el.value;
    ctx.L.unit = '';
    ctx.L.line = '';
    ctx.rerender();
  };
  const spendPlan = (b, unit) => (b.plan || []).filter((l) => l.p !== 'PROFIT' && (!unit || l.unit === unit));
  const head = (ctx, b, extra = '') => `<div class="card"><div class="row">${budgetSel(ctx, b)}${stageB(ctx.s, b)}<span class="small muted">v${b.version} · ${b.plan ? b.plan.length + ' baris perencanaan' : 'agregat 7P (FY berjalan, terhubung transaksi)'}</span>${extra}<span class="r" style="margin-left:auto">${ui.demo()}</span></div></div>`;
  const unitSel = (ctx, b, cur) => (b.plan ? `<select class="inp" style="max-width:220px" data-ch="unit" aria-label="Unit"><option value="">Semua unit (konsolidasi)</option>${units(ctx.s, b).map((u) => `<option value="${u}" ${u === cur ? 'selected' : ''}>${esc(S.orgName(ctx.s, u))}</option>`).join('')}</select>` : '');
  const setUnit = (el, ctx) => {
    ctx.L.unit = el.value;
    ctx.rerender();
  };

  /* line editor modal (NV-15 / NV-17) */
  function lineModal(ctx, b, line) {
    const s = ctx.s;
    const l = line || { unit: ctx.L.unit || units(s, b)[0] || b.bu, p: 'PRODUCT', name: '', qty: 12, price: 75000, kind: 'INVENTORY', stream: 'OPERATIONAL', routine: true, kpi: '' };
    const orgs = s.org.filter((o) => o.status === 'ACTIVE' && (o.id === b.bu || S.buOf(s, o.id) === b.bu));
    const ro = !canEdit(ctx, b);
    const body = `${ro ? `<div class="alert warn">${ui.icon('alert', 16)}<span>Budget ${esc(S.budgetStage(s, b))} — hanya-baca. Perubahan budget terkunci lewat <b>Revisi (NV-22)</b>.</span></div>` : ''}
      <div class="grid g2"><div class="field"><label>Unit pemilik budget *</label><select class="inp" id="bl-unit" ${line || ro ? 'disabled' : ''}>${orgs.map((o) => `<option value="${o.id}" ${o.id === l.unit ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Kategori 7P *</label><select class="inp" id="bl-p" ${line || ro ? 'disabled' : ''}>${HAWK.SEVEN_P.map((p) => `<option value="${p.key}" ${p.key === l.p ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}</select></div>
      <div class="field span2"><label>Nama budget item *</label><input class="inp" id="bl-name" maxlength="100" value="${esc(l.name)}" ${ro ? 'readonly' : ''}></div>
      <div class="field"><label>Item SKU (opsional, untuk BHP rutin)</label><select class="inp" id="bl-item" ${ro ? 'disabled' : ''}><option value="">—</option>${s.items.map((i) => `<option value="${i.id}" ${i.id === l.item ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Qty / tahun *</label><input class="inp" type="number" id="bl-qty" min="0.01" step="0.01" value="${l.qty}" ${ro ? 'readonly' : ''}></div>
      <div class="field"><label>Harga standar / unit (Rp) *</label><input class="inp" type="number" id="bl-price" min="0" value="${l.price}" ${ro ? 'readonly' : ''}></div>
      <div class="field"><label>Management stream</label><select class="inp" id="bl-stream" ${ro ? 'disabled' : ''}><option value="OPERATIONAL" ${l.stream !== 'INNOVATION' ? 'selected' : ''}>Operational</option><option value="INNOVATION" ${l.stream === 'INNOVATION' ? 'selected' : ''}>Innovation</option></select></div>
      <div class="field"><label>Jenis dana (accounting / funding)</label><select class="inp" id="bl-kind" ${ro ? 'disabled' : ''}>${Object.keys(KIND).map((k) => `<option value="${k}" ${k === l.kind ? 'selected' : ''}>${KIND[k][0]}</option>`).join('')}</select></div>
      <div class="field"><label>KPI utama</label><input class="inp" id="bl-kpi" value="${esc(l.kpi)}" ${ro ? 'readonly' : ''}></div>
      <label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="bl-routine" ${l.routine ? 'checked' : ''} ${ro ? 'disabled' : ''}> Item rutin (baseline bulanan BHP)</label></div>
      ${line ? `<div class="grid g3" style="margin-top:12px"><div class="p7" style="--pc:#2f6fde"><div class="nm">Original</div><div class="v">${short(line.original)}</div></div><div class="p7" style="--pc:#c99a2e"><div class="nm">Revised</div><div class="v">${short(line.revised)}</div></div><div class="p7" style="--pc:#22a355"><div class="nm">Nilai baru (qty × harga)</div><div class="v">${short(l.qty * l.price)}</div></div></div><p class="tiny muted">${line.id}${line.project ? ' · proyek ' + line.project : ''} · Profit (P7) wajib PERFORMANCE; PERFORMANCE hanya untuk Profit. Unit & 7P baris existing dikunci untuk audit — buat baris baru bila berbeda.</p>` : '<p class="tiny muted">Baris baru masuk ke Draft. Original = nilai saat Draft disetujui; tidak pernah ditimpa revisi.</p>'}`;
    const foot = ro ? '<button class="btn ghost" data-close-modal>Tutup</button>' : `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" data-a="saveLine" data-l="${line ? line.id : ''}" data-b="${b.id}">${line ? 'Simpan perubahan' : 'Tambah ke Draft'}</button>`;
    ui.openModal(line ? `Budget line ${esc(line.id)}` : 'Tambah 7P budget line', body, foot);
  }
  function saveLine(el, ctx) {
    const b = ctx.s.budgets.find((x) => x.id === el.dataset.b);
    const line = el.dataset.l && b.plan.find((x) => x.id === el.dataset.l);
    const r = ctx.act('budget.upsertPlanLine', {
      id: b.id, line: line ? line.id : undefined, unit: line ? line.unit : ctx.val('bl-unit'), p: line ? line.p : ctx.val('bl-p'), name: ctx.val('bl-name'), item: ctx.val('bl-item') || null,
      qty: +ctx.val('bl-qty'), price: +ctx.val('bl-price'), stream: ctx.val('bl-stream'), kind: ctx.val('bl-kind'), routine: document.getElementById('bl-routine').checked, kpi: ctx.val('bl-kpi'),
    }, (l) => `${l.id} ${line ? 'diperbarui' : 'ditambahkan'} — total 7P dihitung ulang`);
    if (r.ok) ui.closeModal();
  }
  const planTable = (ctx, b, rows, opts = {}) =>
    ui.table(
      [
        { h: 'Budget line / item', f: (l) => `<button class="link" data-a="openLine" data-l="${l.id}" data-b="${b.id}"><b>${esc(l.name)}</b></button><div class="tiny muted">${l.id} · ${esc(S.orgName(ctx.s, l.unit))}${l.item ? ' · ' + l.item : ''}${l.project ? ' · ' + l.project : ''}</div>` },
        { h: '7P', f: (l) => ui.p7(l.p) },
        { h: 'Stream', f: (l) => streamB(l.stream) },
        { h: 'Jenis dana', f: (l) => kindB(l.kind) },
        { h: 'Qty × harga', num: true, f: (l) => `${U.num(l.qty)} × ${U.rp(l.price)}` },
        { h: 'Original', num: true, f: (l) => short(l.original) },
        { h: 'Revised', num: true, f: (l) => `<b>${short(l.revised)}</b>` },
        ...(opts.noAct ? [] : [{ h: '', f: (l) => `<button class="btn sm ghost" data-a="openLine" data-l="${l.id}" data-b="${b.id}">${canEdit(ctx, b) ? 'Ubah' : 'Detail'}</button>` }]),
      ],
      rows,
      { empty: 'Belum ada baris budget untuk filter ini.', maxH: opts.maxH }
    );
  const lineActions = {
    selB,
    unit: setUnit,
    openLine(el, ctx) {
      const b = ctx.s.budgets.find((x) => x.id === el.dataset.b);
      lineModal(ctx, b, b.plan.find((x) => x.id === el.dataset.l));
    },
    newLine(el, ctx) {
      lineModal(ctx, ctx.s.budgets.find((x) => x.id === el.dataset.b));
    },
    saveLine,
  };

  /* ---------- NV-15 Annual Budget Creation ---------- */
  V[15] = {
    render(ctx) {
      const { s, L } = ctx;
      const b = pickBudget(ctx, 'BGT-2027-SPA');
      if (!b) return noBudget(ctx);
      const v = S.budgetView(s, b.id);
      const tgt = s.targets.find((t) => t.fy === b.fy && t.bu === b.bu);
      const unit = L.unit || '';
      const p = L.p || '';
      const sr = (L.q || '').toLowerCase();
      const rows = (b.plan || []).filter((l) => (!unit || l.unit === unit) && (!p || l.p === p) && (!sr || `${l.name} ${l.id} ${l.item || ''}`.toLowerCase().includes(sr)));
      const sp = spendPlan(b, unit);
      const spend = b.plan ? U.sum(sp, (l) => l.revised) : v.totals.revised;
      const orig = b.plan ? U.sum(sp, (l) => l.original) : v.totals.original;
      const profit = b.plan ? U.sum(b.plan.filter((l) => l.p === 'PROFIT' && (!unit || l.unit === unit)), (l) => l.revised) : v.profit.revised;
      const hero = `<div class="hero"><div class="tiny" style="color:var(--champagne);letter-spacing:.12em;font-weight:700">OWNER / BU / DIVISION ANNUAL BUDGET</div><h2>7P Strategic Budget · FY${b.fy}</h2><p>Budget dimulai dari target tahunan (NV-10), diturunkan ke 7P, unit organisasi, kuartal, dan bulan. Profit (P7) terpisah dari biaya yang bisa dibelanjakan.</p>
        <div class="row" style="margin-top:12px"><span class="badge dark">${esc(unit ? S.orgName(s, unit) : S.orgName(s, b.bu))}</span>${stageB(s, b)}</div></div>`;
      const kpis = `<div class="grid g4 keep2">${ui.kpi('Total revised spending (P1–P6)', short(spend), 'OPEX + CAPEX + Inventory + lainnya', 'g-teal', 'budget')}${ui.kpi('Original annual budget', short(orig), 'Baseline disimpan', 'g-blue', 'doc')}${ui.kpi('Target P7 Profit', short(profit), 'KPI hasil — bukan pengeluaran', '', 'finance')}${ui.kpi('Baris perencanaan', b.plan ? sp.length : v.lines.length, b.plan ? 'baris belanja (non-profit)' : 'baris 7P agregat', 'g-violet', 'mrf')}</div>`;
      const master = b.plan
        ? `<div class="card"><div class="card-head"><h3>Budget line master</h3><span class="r">${canEdit(ctx, b) ? `<button class="btn" data-a="newLine" data-b="${b.id}">${ui.icon('plus', 16)} Tambah budget line</button>` : ''}</span></div>
          <div class="row" style="margin-bottom:10px"><input class="inp" style="max-width:280px" placeholder="Cari item, ID, SKU…" value="${esc(L.q || '')}" data-in="srch" aria-label="Cari">${unitSel(ctx, b, unit)}<select class="inp" style="max-width:170px" data-ch="fp" aria-label="7P"><option value="">Semua 7P</option>${HAWK.SEVEN_P.map((x) => `<option value="${x.key}" ${x.key === p ? 'selected' : ''}>${x.name}</option>`).join('')}</select></div>
          <div id="plan-tbl">${planTable(ctx, b, rows, { maxH: 560 })}</div></div>`
        : `<div class="card"><h3>Baris 7P (agregat) ${ui.status(b.status)}</h3>${ui.table([{ h: '7P', f: (l) => ui.p7(l.p) }, { h: 'Kelas', f: (l) => kindB(l.cls === 'OUTCOME' ? 'PERFORMANCE' : l.cls) }, { h: 'Original', num: true, f: (l) => U.rp(l.original) }, { h: 'Revised', num: true, f: (l) => U.rp(l.revised) }], v.lines)}<p class="tiny muted">Budget FY berjalan terkunci; perubahan hanya lewat revisi (NV-22). Disusun sebelum perencanaan per baris Modul D tersedia.</p></div>`;
      const rules = `<div class="card" style="align-self:start"><div class="card-head"><h3>Annual planning rules</h3><span class="r">${stageB(s, b)}</span></div>
        <dl class="kv"><dt>Revenue target</dt><dd>${tgt ? `${short(tgt.revenue)} ${ui.status(tgt.status)} <button class="link" data-nav="10">NV-10</button>` : '—'}</dd><dt>Profit target (P7)</dt><dd><b>${short(profit)}</b></dd><dt>Spending (P1–P6)</dt><dd><b>${short(spend)}</b>${tgt ? ` · ${U.pct(spend / tgt.revenue)} dari target revenue` : ''}</dd><dt>Periode</dt><dd>Jan–Des ${b.fy}</dd><dt>Stream</dt><dd><span class="badge info">Operational</span> <span class="badge violet">Innovation</span></dd></dl>
        <div class="alert gold" style="margin-top:12px;background:#fbf2d9;color:#6b5112">${ui.icon('alert', 16)}<span>Nominal Profit (P7) tidak masuk total belanja. Inventory/CAPEX tidak otomatis menjadi beban P&L saat dibeli — BHP dibebankan saat dipakai, CAPEX lewat penyusutan. Verifikasi akuntansi dilakukan engine HAWK.</span></div>
        <div class="row" style="margin-top:12px"><button class="btn" data-nav="16" data-q='${q({ b: b.id })}'>Lihat 7P allocation ${ui.icon('arrow', 14)}</button><button class="btn ghost" data-nav="21" data-q='${q({ b: b.id })}'>Alur approval</button></div></div>`;
      return `<div class="stack">${head(ctx, b)}${hero}${kpis}<div class="grid g-2-1">${master}${rules}</div></div>`;
    },
    actions: {
      ...lineActions,
      fp(el, ctx) {
        ctx.L.p = el.value;
        ctx.rerender();
      },
      srch(el, ctx) {
        ctx.L.q = el.value;
        const b = pickBudget(ctx, 'BGT-2027-SPA');
        const sr = el.value.toLowerCase();
        const rows = (b.plan || []).filter((l) => (!ctx.L.unit || l.unit === ctx.L.unit) && (!ctx.L.p || l.p === ctx.L.p) && (!sr || `${l.name} ${l.id} ${l.item || ''}`.toLowerCase().includes(sr)));
        const t = document.getElementById('plan-tbl');
        if (t) t.innerHTML = planTable(ctx, b, rows, { maxH: 560 });
      },
    },
  };

  /* ---------- NV-16 7P Budget Allocation Overview ---------- */
  V[16] = {
    render(ctx) {
      const { s, L } = ctx;
      const b = pickBudget(ctx, 'BGT-2026-SPA');
      if (!b) return noBudget(ctx);
      const v = S.budgetView(s, b.id);
      const unit = L.unit || '';
      const sp = b.plan ? spendPlan(b, unit) : null;
      const byP = (k) => (sp ? U.sum(sp.filter((l) => l.p === k), (l) => l.revised) : U.sum(v.lines.filter((l) => l.p === k && l.cls !== 'OUTCOME'), (l) => l.revised));
      const tot = U.sum(P6(), (p) => byP(p.key));
      const profit = b.plan ? U.sum(b.plan.filter((l) => l.p === 'PROFIT' && (!unit || l.unit === unit)), (l) => l.revised) : v.profit.revised;
      const inno = sp ? U.sum(sp.filter((l) => l.stream === 'INNOVATION'), (l) => l.revised) : 0;
      const unitRows = b.plan
        ? units(s, b).map((u) => ({ u, v: U.sum(spendPlan(b, u), (l) => l.revised) }))
        : b.bu === 'BU-SPA'
          ? Object.entries(s.branchShare).map(([u, sh]) => ({ u, v: v.totals.revised * sh }))
          : [{ u: b.bu, v: v.totals.revised }];
      return `<div class="stack">${head(ctx, b, unitSel(ctx, b, unit))}
        <div class="grid g4 keep2">${ui.kpi('7P spending P1–P6', short(tot), 'tidak termasuk Profit', 'g-teal', 'budget')}${ui.kpi('Operational', short(tot - inno), 'run the business', 'g-blue', 'box')}${ui.kpi('Innovation', short(inno), sp ? 'build the future' : 'tidak dipisah di FY berjalan', 'g-violet', 'ai')}${ui.kpi('Profit KPI target', short(profit), 'P7 target — bukan alokasi biaya', '', 'finance')}</div>
        <div class="grid g7p">${HAWK.SEVEN_P.map((p) => `<button class="p7" style="--pc:${p.color};text-align:left;cursor:pointer" data-nav="23" data-q='${q({ b: b.id, p: p.key })}'><div class="nm"><i class="p-dot" style="background:${p.color}"></i>${esc(p.name)}</div><div class="v">${short(p.outcome ? profit : byP(p.key))}</div><div class="tiny muted">${p.outcome ? 'Target hasil (outcome)' : U.pct(byP(p.key) / (tot || 1)) + ' dari belanja'}</div></button>`).join('')}</div>
        <div class="grid g2"><div class="card"><h3>Alokasi 7P (belanja P1–P6)</h3>${ui.donut({ items: P6().map((p) => ({ label: p.name, color: p.color, value: byP(p.key) })), center: short(tot).replace('Rp ', ''), sub: 'P1–P6', size: 160 })}<div class="alert info" style="margin-top:10px">${ui.icon('alert', 16)}<span>Profit (P7) dilaporkan sebagai target & hasil keuangan tersendiri, bukan potongan alokasi belanja.</span></div></div>
        <div class="card"><h3>Alokasi per unit</h3>${unitRows.map((r) => `<div class="row" style="padding:6px 0;flex-wrap:nowrap"><span class="small" style="width:170px">${esc(S.orgName(s, r.u))}</span><div style="flex:1">${ui.bar(r.v / (Math.max(...unitRows.map((x) => x.v)) || 1), 'ok')}</div><span class="small num" style="width:90px">${short(r.v)}</span></div>`).join('')}
          <p class="tiny muted">${b.plan ? 'Dijumlah dari baris perencanaan per unit.' : 'FY berjalan: porsi cabang dari aturan alokasi (branchShare, DEMO).'} Kategori 7P ≠ kelas OPEX/CAPEX ≠ stream Operational/Innovation — disimpan terpisah di setiap baris.</p><button class="btn ghost sm" data-nav="19" data-q='${q({ b: b.id })}'>Klasifikasi dana (NV-19)</button></div></div></div>`;
    },
    actions: { selB, unit: setUnit },
  };

  /* ---------- NV-17 Routine Item / BHP Budget ---------- */
  V[17] = {
    render(ctx) {
      const { s, L } = ctx;
      const cur = L.t || 'live';
      const branches = S.branches(s).filter((b) => ctx.inScope(b.id));
      const br = L.br || (ctx.scope.branch && ctx.scope.branch !== 'ALL' ? ctx.scope.branch : branches[0] && branches[0].id);
      let body;
      if (cur === 'live') {
        const rows = s.itemBudgets.filter((x) => x.branch === br && x.period === s.meta.period).map((x) => S.itemBudget(s, x.branch, x.item));
        body = `<div class="card"><div class="row" style="margin-bottom:10px"><select class="inp" style="max-width:240px" data-ch="br" aria-label="Cabang">${branches.map((b) => `<option value="${b.id}" ${b.id === br ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select><span class="badge info">Item budget → MRF → Stock issue → Actual</span><span class="small muted">${U.BULAN[10]} 2026 · bergerak dengan transaksi</span></div>${ui.table(
          [
            { h: 'Item', f: (v) => `<b>${esc(S.itemName(s, v.item))}</b><div class="tiny muted">${v.item} · ${ui.p7(S.item(s, v.item).p)}</div>` },
            { h: 'Budget', num: true, f: (v) => `${v.qty} <span class="tiny muted">${esc(S.item(s, v.item).unit)}</span><div class="tiny muted">${short(v.value)}</div>` },
            { h: 'Aktual', num: true, f: (v) => v.actualQty },
            { h: 'Komitmen', num: true, f: (v) => v.commitQty },
            { h: 'Menunggu approval', num: true, f: (v) => v.pendingQty || '—' },
            { h: 'Sisa', num: true, f: (v) => `<b class="${v.availableQty < 0 ? 'bad-t' : ''}">${v.availableQty}</b>` },
            { h: 'Utilisasi', f: (v) => { const r = (v.actualQty + v.commitQty) / v.qty; return `<div style="min-width:120px">${ui.bar(r, r > 1 ? 'bad' : r >= 0.9 ? 'warn' : 'ok')}<span class="tiny">${U.pct(r)}</span></div>`; } },
            { h: '', f: (v) => `<button class="btn sm ghost" data-nav="27" data-q='${q({ q: v.item })}'>MRF</button>` },
          ],
          rows,
          { empty: 'Belum ada item budget untuk cabang ini.' }
        )}<p class="tiny muted" style="margin:8px 0 0">Aktual = pemakaian (stock issue) terverifikasi; komitmen = qty MRF disetujui yang belum diserahkan. PO yang tertaut MRF <b>tidak</b> dihitung lagi (tanpa double count). ≥90% kuning, &gt;100% merah → rantai pengecualian AR-05.</p></div>`;
      } else {
        const b = pickBudget(ctx, 'BGT-2027-SPA');
        const mi = L.m !== undefined ? +L.m : 0;
        const rows = (b.plan || []).filter((l) => l.routine && l.p !== 'PROFIT' && (!L.unit || l.unit === L.unit));
        body = `<div class="card"><div class="row" style="margin-bottom:10px">${budgetSel(ctx, b, (x) => !!x.plan)}${unitSel(ctx, b, L.unit || '')}<select class="inp" style="max-width:140px" data-ch="m" aria-label="Bulan">${U.BULAN.map((m, i) => `<option value="${i}" ${i === mi ? 'selected' : ''}>${m} ${b.fy}</option>`).join('')}</select>${canEdit(ctx, b) ? `<button class="btn sm" data-a="newLine" data-b="${b.id}">${ui.icon('plus', 14)} SKU rutin</button>` : ''}</div>${ui.table(
          [
            { h: 'SKU / item', f: (l) => `<button class="link" data-a="openLine" data-l="${l.id}" data-b="${b.id}"><b>${esc(l.name)}</b></button><div class="tiny muted">${l.id}${l.item ? ' · ' + l.item : ''}</div>` },
            { h: 'Unit', f: (l) => esc(S.orgName(s, l.unit)) },
            { h: '7P', f: (l) => ui.p7(l.p) },
            { h: 'Qty / tahun', num: true, f: (l) => U.num(l.qty) },
            { h: 'Harga standar', num: true, f: (l) => U.rp(l.price) },
            { h: 'Budget ' + U.BULAN[mi], num: true, f: (l) => `<b>${short((l.revised * l.weights[mi]) / 100)}</b><div class="tiny muted">${l.item ? '≈ ' + U.num((l.qty * l.weights[mi]) / 100) + ' unit' : ''}</div>` },
            { h: 'Revised / tahun', num: true, f: (l) => short(l.revised) },
          ],
          rows,
          { empty: 'Tidak ada baris rutin untuk filter ini.' }
        )}<div class="alert info" style="margin-top:10px">${ui.icon('alert', 16)}<span>Saat FY${b.fy} terkunci, baris rutin ber-SKU menjadi item budget bulanan (qty × bobot bulan) yang memvalidasi MRF — seperti tab November 2026. Contoh: 1 botol = 1.000 ml memerlukan master konversi satuan saat dihubungkan ke inventory HAWK ${ui.intBadge('TO VERIFY')}.</span></div></div>`;
      }
      return `<div class="stack">${ui.tabs('t', [['live', 'Bulan berjalan (Nov 2026)'], ['plan', 'Rencana FY2027 (per SKU)']], cur)}${body}</div>`;
    },
    actions: {
      ...lineActions,
      br(el, ctx) {
        ctx.L.br = el.value;
        ctx.rerender();
      },
      m(el, ctx) {
        ctx.L.m = el.value;
        ctx.rerender();
      },
    },
  };

  /* ---------- NV-18 Non-Routine & Exceptional ---------- */
  V[18] = {
    render(ctx) {
      const { s, L } = ctx;
      const list = s.nonRoutine.filter((r) => ctx.inScope(r.unit || r.bu));
      const orgs = s.org.filter((o) => o.status === 'ACTIVE' && o.scope === 'IN' && o.type !== 'GROUP' && ctx.inScope(o.id));
      const cur = L.t || 'ALL';
      const rows = list.filter((r) => cur === 'ALL' || r.status === cur);
      const mrfNR = s.mrfs.filter((m) => m.type === 'NON_ROUTINE' && ctx.inScope(m.branch));
      return `<div class="stack"><div class="grid g4 keep2">${ui.kpi('Permintaan non-rutin', list.length, 'tidak masuk baseline BHP', 'g-gold', 'alert')}${ui.kpi('Nilai disetujui', short(U.sum(list.filter((r) => r.status === 'APPROVED'), (r) => r.amount)), 'terpakai ' + short(U.sum(list, (r) => r.used)), '', 'finance')}${ui.kpi('Butuh review', list.filter((r) => r.status === 'SUBMITTED').length, 'pengaju ≠ pemutus', '', 'inbox')}${ui.kpi('MRF non-rutin', mrfNR.length, 'rantai pengecualian AR-05', '', 'mrf')}</div>
        <div class="grid g-2-1"><div><div style="margin-bottom:10px">${ui.tabs('t', [['ALL', 'Semua', list.length], ['SUBMITTED', 'Butuh review'], ['APPROVED', 'Disetujui'], ['REJECTED', 'Ditolak']], cur)}</div><div class="card">${ui.table(
          [
            { h: 'ID / permintaan', f: (r) => `<b>${esc(r.name)}</b><div class="tiny muted">${r.id} · ${esc(r.reason || '')}</div>` },
            { h: 'Unit', f: (r) => esc(S.orgName(s, r.unit || r.bu)) },
            { h: '7P', f: (r) => ui.p7(r.p) },
            { h: 'Jenis dana', f: (r) => kindB(r.kind || 'OPEX') },
            { h: 'Nilai', num: true, f: (r) => U.rp(r.amount) + (r.used ? `<div style="min-width:90px">${ui.bar(r.used / r.amount, 'ok')}</div>` : '') },
            { h: 'Pengaju', f: (r) => esc(S.userName(s, r.by)) },
            { h: 'Status', f: (r) => ui.status(r.status) },
            { h: '', f: (r) => (r.status === 'SUBMITTED' && ctx.can('nonroutine.decide') && r.by !== ctx.user.id ? `<button class="btn sm bad" data-a="no" data-p="${r.id}">Tolak</button> <button class="btn sm ok" data-a="yes" data-p="${r.id}">Setujui</button>` : r.status === 'SUBMITTED' && r.by === ctx.user.id ? '<span class="tiny muted">menunggu pemutus lain</span>' : '') },
          ],
          rows,
          { empty: 'Tidak ada permintaan.' }
        )}</div></div>
        <div class="stack"><div class="card"><h3>${ui.icon('plus', 16)} Permintaan khusus</h3>${ctx.can('nonroutine.create') ? `<div class="stack"><div class="field"><label>Unit</label><select class="inp" id="nr-unit">${orgs.map((o) => `<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select></div>
          <div class="grid g2"><div class="field"><label>7P</label><select class="inp" id="nr-p">${P6().map((p) => `<option value="${p.key}">${p.name}</option>`).join('')}</select></div><div class="field"><label>Jenis dana</label><select class="inp" id="nr-kind"><option>OPEX</option><option value="CAPEX">CAPEX</option><option value="INVENTORY">Inventory</option></select></div></div>
          <div class="field"><label>Nama kebutuhan *</label><input class="inp" id="nr-name" placeholder="Contoh: perbaikan water heater"></div><div class="field"><label>Estimasi nilai (Rp) *</label><input class="inp" type="number" id="nr-amt" min="1"></div><div class="field"><label>Alasan / urgensi *</label><textarea class="inp" id="nr-reason" rows="2"></textarea></div>
          <button class="btn block" data-a="create">Ajukan review</button></div>` : '<p class="small muted">Role ini tidak dapat mengajukan.</p>'}</div>
          <div class="card"><h3>Aturan</h3><dl class="kv"><dt>Wajib cost center + 7P</dt><dd><span class="badge ok">Ya</span></dd><dt>Mengurangi baseline BHP rutin</dt><dd><span class="badge bad">Tidak</span></dd><dt>Alasan & approval</dt><dd><span class="badge gold">Wajib</span></dd><dt>OPEX / CAPEX</dt><dd>Menurut substansi</dd><dt>Terkait proyek Innovation</dt><dd>Boleh (NV-13)</dd></dl></div></div></div></div>`;
    },
    actions: {
      create(el, ctx) {
        const r = ctx.act('nonroutine.create', { unit: ctx.val('nr-unit'), p: ctx.val('nr-p'), kind: ctx.val('nr-kind'), name: ctx.val('nr-name'), amount: +ctx.val('nr-amt'), reason: ctx.val('nr-reason') }, (x) => `${x.id} masuk antrean review`);
        return r;
      },
      yes(el, ctx) {
        ctx.act('nonroutine.decide', { id: el.dataset.p, decision: 'APPROVE' }, 'Permintaan non-rutin disetujui');
      },
      no(el, ctx) {
        ui.ask('Tolak ' + el.dataset.p, 'Alasan penolakan', (note) => ctx.act('nonroutine.decide', { id: el.dataset.p, decision: 'REJECT', note }, 'Ditolak'), { danger: true, ok: 'Tolak' });
      },
    },
  };

  /* ---------- NV-19 OPEX, CAPEX & Other Classification ---------- */
  V[19] = {
    render(ctx) {
      const { s } = ctx;
      const b = pickBudget(ctx, 'BGT-2027-SPA');
      if (!b) return noBudget(ctx);
      const v = S.budgetView(s, b.id);
      const sp = b.plan ? spendPlan(b) : null;
      const kinds = ['OPEX', 'INVENTORY', 'CAPEX', 'WORKING_CAPITAL', 'DEPOSIT', 'FIN_INVESTMENT'];
      const byK = (k) => (sp ? U.sum(sp.filter((l) => l.kind === k), (l) => l.revised) : k === 'OPEX' || k === 'CAPEX' ? U.sum(v.lines.filter((l) => l.cls === k), (l) => l.revised) : 0);
      const tot = U.sum(kinds, byK);
      const colors = ['#2f6fde', '#06b6d4', '#c99a2e', '#8b5cf6', '#f08a24', '#0f9d8a'];
      const rules = [
        ['OPEX', 'Beban periode', 'Gaji, sewa, promosi, pemeliharaan, WO selesai', 'Akun beban 7P (6100–6210) saat terjadi'],
        ['Inventory', 'Persediaan → beban saat dipakai', 'BHP, bahan baku Essence', 'Dr Persediaan / Cr GRNI saat terima; Dr Beban BHP / Cr Persediaan saat issue'],
        ['CAPEX', 'Aset tetap', 'Renovasi, mesin, AC', 'Kapitalisasi (NV-56) lalu penyusutan garis lurus'],
        ['Working capital / Deposit', 'Neraca', 'Deposit sewa, uang muka', 'Aset lancar — bukan beban'],
        ['Investasi keuangan', 'Neraca', 'Penempatan dana', 'Di luar belanja operasional'],
        ['PERFORMANCE (P7)', 'Target hasil', 'Target laba', 'Tidak pernah dijumlah ke belanja'],
        ['Purchase Order', 'Komitmen', 'PO ke supplier', 'Bukan beban & bukan tagihan; tanpa jurnal'],
      ];
      return `<div class="stack">${head(ctx, b)}
        <div class="grid g4 keep2">${ui.kpi('OPEX plan', short(byK('OPEX')), 'beban periode', 'g-blue', 'finance')}${ui.kpi('Inventory plan', short(byK('INVENTORY')), 'persediaan — beban saat dipakai', 'g-teal', 'box')}${ui.kpi('CAPEX plan', short(byK('CAPEX')), 'aset bila memenuhi kapitalisasi', 'g-gold', 'asset')}${ui.kpi('Innovation funding', short(sp ? U.sum(sp.filter((l) => l.stream === 'INNOVATION'), (l) => l.revised) : 0), 'tidak selalu CAPEX', 'g-violet', 'ai')}</div>
        <div class="grid g2"><div class="card"><div class="card-head"><h3>Matriks klasifikasi penggunaan dana</h3><span class="r"><span class="badge ok">Profit dikecualikan</span></span></div>${kinds.map((k, i) => `<div class="row" style="padding:6px 0;flex-wrap:nowrap"><span class="small" style="width:150px">${KIND[k][0]}</span><div style="flex:1"><div class="bar"><i style="width:${(byK(k) / (tot || 1)) * 100}%;background:${colors[i]}"></i></div></div><span class="small num" style="width:90px">${short(byK(k))}</span></div>`).join('')}
          ${!sp ? '<p class="tiny muted">FY berjalan hanya memisahkan OPEX/CAPEX (agregat). Dimensi lengkap tersedia pada budget per baris FY2027.</p>' : ''}</div>
        <div class="card"><h3>Operational vs Innovation (ambidextrous)</h3>${['OPERATIONAL', 'INNOVATION'].map((st) => { const val = sp ? U.sum(sp.filter((l) => l.stream === st), (l) => l.revised) : st === 'OPERATIONAL' ? v.totals.revised : 0; return `<div class="p7" style="--pc:${st === 'OPERATIONAL' ? '#2f6fde' : '#8b5cf6'};margin-bottom:10px"><div class="nm">${st === 'OPERATIONAL' ? 'Operational management' : 'Innovation management'}</div><div class="v">${short(val)}</div><div class="tiny muted">${st === 'OPERATIONAL' ? 'Meningkatkan kinerja saat ini' : 'Menciptakan & memvalidasi kapabilitas baru — terhubung ke proyek NV-12/13'}</div></div>`; }).join('')}</div></div>
        <div class="card"><h3>Aturan perlakuan akuntansi (referensi)</h3>${ui.table([{ h: 'Kelas', f: (r) => `<b>${r[0]}</b>` }, { h: 'Perlakuan', f: (r) => r[1] }, { h: 'Contoh', f: (r) => r[2] }, { h: 'Jurnal / dampak', f: (r) => `<span class="small">${r[3]}</span>` }], rules)}<p class="tiny muted" style="margin:8px 0 0">Label klasifikasi di UI untuk penggunaan dana. Realisasi akuntansi ditentukan COA, entitas legal, metode persediaan, dan kebijakan kapitalisasi di engine HAWK — bukan otomatis dari label ${ui.intBadge('TO VERIFY')}.</p></div>
        ${sp ? `<div class="card"><h3>Pemetaan per baris</h3>${planTable(ctx, b, sp, { maxH: 380, noAct: true })}</div>` : ''}</div>`;
    },
    actions: { ...lineActions },
  };

  /* ---------- NV-20 Quarterly & Monthly Distribution ---------- */
  V[20] = {
    render(ctx) {
      const { s, L } = ctx;
      const b = pickBudget(ctx, 'BGT-2027-SPA');
      if (!b) return noBudget(ctx);
      const v = S.budgetView(s, b.id);
      const M = U.BULAN.map((m) => m.slice(0, 3));
      const monthlyP = (k, i) => (b.plan ? U.sum(spendPlan(b, L.unit).filter((l) => l.p === k), (l) => (l.revised * l.weights[i]) / 100) : U.sum(v.lines.filter((l) => l.p === k && l.cls !== 'OUTCOME'), (l) => l.revised) * s.season[i]);
      const grid = P6().map((p) => ({ p, m: M.map((_, i) => monthlyP(p.key, i)) }));
      const max = Math.max(...grid.flatMap((r) => r.m)) || 1;
      const colTot = M.map((_, i) => U.sum(grid, (r) => r.m[i]));
      const heat = `<div class="tbl-wrap"><table class="tbl heat"><thead><tr><th>7P</th>${M.map((m) => `<th class="num">${m}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>${grid.map((r) => `<tr><td style="text-align:left">${ui.p7(r.p.key)}</td>${r.m.map((x) => `<td style="background:rgba(201,154,46,${(0.08 + (x / max) * 0.6).toFixed(2)})">${U.num(x / 1e6)}</td>`).join('')}<td><b>${U.num(U.sum(r.m) / 1e6)}</b></td></tr>`).join('')}</tbody><tfoot><tr><td style="text-align:left"><b>Total (Rp jt)</b></td>${colTot.map((x) => `<td><b>${U.num(x / 1e6)}</b></td>`).join('')}<td><b>${U.num(U.sum(colTot) / 1e6)}</b></td></tr></tfoot></table></div>`;
      const qs = [0, 1, 2, 3].map((k) => U.sum(colTot.slice(k * 3, k * 3 + 3)));
      let editor = '';
      if (b.plan) {
        const sp = spendPlan(b, L.unit);
        const line = sp.find((l) => l.id === L.line) || sp[0];
        if (line) {
          const w = L.w && L.wl === line.id ? L.w : line.weights.slice();
          const sumw = U.sum(w.map(Number));
          const ed = canEdit(ctx, b) && ctx.can('budget.setWeights');
          editor = `<div class="grid g2"><div class="card"><h3>Distribusi bulanan satu baris</h3><select class="inp" data-ch="line" style="margin-bottom:10px" aria-label="Baris">${sp.map((l) => `<option value="${l.id}" ${l.id === line.id ? 'selected' : ''}>${l.id} · ${esc(l.name)} · ${esc(S.orgName(s, l.unit))}</option>`).join('')}</select>
            ${ui.bars({ labels: M, series: [{ name: line.name, color: ui.pColor(line.p), values: line.weights.map((x) => Math.round((line.revised * x) / 100 / 1e5) / 10) }], h: 160 })}
            <div class="grid g4 keep2" style="margin-top:8px">${[0, 1, 2, 3].map((k) => `<div class="p7" style="--pc:${ui.pColor(line.p)}"><div class="nm">Q${k + 1}</div><div class="v" style="font-size:14px">${short(U.sum(line.weights.slice(k * 3, k * 3 + 3), (x) => (line.revised * x) / 100))}</div></div>`).join('')}</div></div>
            <div class="card"><div class="card-head"><h3>Editor alokasi 12 bulan</h3><span class="r"><span class="badge ${Math.abs(sumw - 100) <= 0.11 ? 'ok' : 'bad'}">Σ ${U.num(sumw, 1)}%</span></span></div>
            <div class="grid g3">${M.map((m, i) => `<div class="field"><label>${m} (%)</label><input class="inp" type="number" min="0" max="100" step="0.1" id="w-${i}" value="${w[i]}" data-in="w" data-k="${i}" data-l="${line.id}" ${ed ? '' : 'readonly'}></div>`).join('')}</div>
            <div class="row" style="justify-content:space-between;margin-top:10px">${ed ? `<button class="btn ghost sm" data-a="even" data-l="${line.id}">Ratakan 12 bulan</button><button class="btn" data-a="saveW" data-l="${line.id}" data-b="${b.id}">Simpan distribusi</button>` : `<span class="small muted">${b.status === 'DRAFT' ? 'Role ini hanya dapat melihat.' : 'Budget bukan Draft — distribusi terkunci.'}</span>`}</div>
            <p class="tiny muted">Jumlah wajib tepat 100%. Distribusi bulanan berbeda dari reforecast kuartalan & revisi tahunan (NV-22).</p></div></div>`;
        }
      }
      return `<div class="stack">${head(ctx, b, unitSel(ctx, b, L.unit || ''))}
        <div class="grid g4 keep2">${qs.map((x, i) => ui.kpi('Q' + (i + 1) + ' ' + b.fy, short(x), ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Okt–Des'][i], i === 2 ? 'g-gold' : '', 'budget')).join('')}</div>
        ${editor}<div class="card"><h3>Heatmap 7P × bulan (Rp jt) ${b.plan ? '' : '— pola musiman DEMO'}</h3>${heat}<p class="tiny muted" style="margin:8px 0 0">${b.plan ? 'Σ baris × bobot bulanan masing-masing.' : 'FY berjalan memakai bobot musiman (Juli–Agustus & Desember tinggi).'} Profit tidak termasuk.</p></div></div>`;
    },
    actions: {
      selB,
      unit: setUnit,
      line(el, ctx) {
        ctx.L.line = el.value;
        ctx.L.w = null;
        ctx.rerender();
      },
      w(el, ctx) {
        const b = pickBudget(ctx, 'BGT-2027-SPA');
        if (!b) return;
        const l = b.plan.find((x) => x.id === el.dataset.l);
        if (!ctx.L.w || ctx.L.wl !== l.id) {
          ctx.L.w = l.weights.slice();
          ctx.L.wl = l.id;
        }
        ctx.L.w[+el.dataset.k] = el.value;
        const sumw = U.sum(ctx.L.w.map(Number));
        const badge = el.closest('.card').querySelector('.card-head .badge');
        if (badge) {
          badge.textContent = 'Σ ' + U.num(sumw, 1) + '%';
          badge.className = 'badge ' + (Math.abs(sumw - 100) <= 0.11 ? 'ok' : 'bad');
        }
      },
      even(el, ctx) {
        ctx.L.w = [8.3, 8.3, 8.3, 8.3, 8.4, 8.4, 8.3, 8.3, 8.3, 8.3, 8.4, 8.4];
        ctx.L.wl = el.dataset.l;
        ctx.rerender();
      },
      saveW(el, ctx) {
        const weights = U.BULAN.map((_, i) => +ctx.val('w-' + i));
        const r = ctx.act('budget.setWeights', { id: el.dataset.b, line: el.dataset.l, weights }, 'Distribusi bulanan tersimpan');
        if (r.ok) ctx.L.w = null;
      },
    },
  };

  /* ---------- NV-21 Budget Submission & Approval ---------- */
  V[21] = {
    render(ctx) {
      const { s } = ctx;
      const list = budgetsFor(ctx);
      const b = pickBudget(ctx, list.find((x) => x.status === 'SUBMITTED') ? list.find((x) => x.status === 'SUBMITTED').id : 'BGT-2027-SPA');
      if (!b) return noBudget(ctx);
      const chain = s.approvalRules.find((r) => r.doc === 'BUDGET').chain;
      const st = S.budgetStage(s, b);
      const idx = STAGES.indexOf(st);
      const step = b.status === 'SUBMITTED' ? chain[(b.approvals || []).length] : null;
      const mine = step && (step === ctx.role || (step === 'HEAD_DIV' && ctx.role === 'BU_MANAGER'));
      const v = S.budgetView(s, b.id);
      const tgt = s.targets.find((t) => t.fy === b.fy && t.bu === b.bu);
      const hist = (b.history || []).slice().reverse();
      return `<div class="stack"><div class="hero"><div class="tiny" style="color:var(--champagne);letter-spacing:.12em;font-weight:700">HUMAN APPROVAL & AUDIT</div><h2>Budget submission, approval & lock</h2><p>Draft → Head Review (Head of Division / BU Manager) → Finance Review → Owner Review → Locked. Rantai dapat diubah di NV-09 (AR-09). Hak akses di UI hanya simulasi — backend HAWK wajib menegakkan otorisasi.</p></div>
        <div class="card">${ui.table(
          [
            { h: 'Budget', f: (x) => `<b>${x.id}</b>` },
            { h: 'BU', f: (x) => esc(S.orgName(s, x.bu)) },
            { h: 'Belanja P1–P6', num: true, f: (x) => short(S.budgetView(s, x.id).totals.revised) },
            { h: 'Tahap', f: (x) => stageB(s, x) },
            { h: '', f: (x) => `<button class="btn sm ghost" data-a="selB2" data-p="${x.id}">Buka</button>` },
          ],
          list,
          { rowCls: (x) => (x.id === b.id ? 'sel' : '') }
        )}</div>
        <div class="grid g2"><div class="card"><div class="card-head"><h3>${esc(b.id)} · ${esc(S.orgName(s, b.bu))}</h3><span class="r">${stageB(s, b)}</span></div>
          ${ui.stepper(STAGES, idx)}
          <dl class="kv" style="margin-top:12px"><dt>Belanja FY${b.fy}</dt><dd><b>${U.rp(v.totals.revised)}</b></dd><dt>Target revenue</dt><dd>${tgt ? U.rp(tgt.revenue) + ' ' + ui.status(tgt.status) : '—'}</dd><dt>Profit (P7)</dt><dd>${U.rp(v.profit ? v.profit.revised : 0)}</dd><dt>Menunggu</dt><dd>${step ? `<span class="badge warn">${esc(HAWK.ROLE_LABEL[step])}${step === 'HEAD_DIV' ? ' / BU Manager' : ''}</span>` : '—'}</dd><dt>Role demo</dt><dd><span class="badge info">${esc(HAWK.ROLE_LABEL[ctx.role])}</span></dd></dl>
          <div class="field" style="margin-top:12px"><label>Catatan approval</label><input class="inp" id="ap-note" placeholder="Wajib bila dikembalikan"></div>
          <div class="row" style="margin-top:10px">${b.status === 'DRAFT' && ctx.can('budget.submit') ? `<button class="btn" data-a="submit" data-p="${b.id}">Ajukan budget →</button>` : ''}
          ${mine ? `<button class="btn bad" data-a="ret" data-p="${b.id}">Kembalikan ke Draft</button><button class="btn ok" data-a="ok" data-p="${b.id}">${ui.icon('check')} Setujui tahap ${esc(st)}</button>` : ''}
          ${b.status === 'LOCKED' ? `<span class="badge dark">Terkunci</span><button class="btn ghost sm" data-nav="22" data-q='${q({ b: b.id })}'>Ajukan revisi (NV-22)</button>` : ''}
          ${step && !mine ? `<span class="small muted">Tahap ini menunggu ${esc(HAWK.ROLE_LABEL[step])} — ganti role untuk mensimulasikan.</span>` : ''}</div>
          <p class="tiny muted" style="margin-top:10px">Validasi saat diajukan: belanja &lt; target revenue FY. Setelah Locked, baris tidak dapat diedit; Original menjadi baseline permanen.</p></div>
        <div class="card"><h3>Aktivitas approval & audit trail</h3>${hist.length ? `<ul class="tl">${hist.map((h) => `<li><b>${esc(h.action.replace('APPROVE_', 'Setujui '))}</b> · ${esc(S.userName(s, h.by))}<div class="t">${U.datetime(h.ts)}${h.note ? ' · ' + esc(h.note) : ''}</div></li>`).join('')}</ul>` : ui.empty('Belum ada aktivitas dalam sesi demo ini.')}
          <div class="hr"></div><h3>Kontrak integrasi</h3><dl class="kv"><dt>Approval record / identitas</dt><dd>${ui.intBadge('NEW INTEGRATION REQUIRED')}</dd><dt>Versi budget terkunci</dt><dd>${ui.intBadge('NEW INTEGRATION REQUIRED')}</dd><dt>Actor & timestamp audit</dt><dd>${ui.intBadge('NEW INTEGRATION REQUIRED')}</dd></dl></div></div></div>`;
    },
    actions: {
      selB,
      selB2(el, ctx) {
        ctx.L.b = el.dataset.p;
        ctx.rerender();
      },
      submit(el, ctx) {
        ctx.act('budget.submit', { id: el.dataset.p, note: ctx.val('ap-note') }, (b) => `${b.id} diajukan → Head Review`);
      },
      ok(el, ctx) {
        ctx.act('budget.approve', { id: el.dataset.p, decision: 'APPROVE', note: ctx.val('ap-note') }, (b) => `${b.id}: ${S.budgetStage(ctx.s, b)}`);
      },
      ret(el, ctx) {
        const note = ctx.val('ap-note');
        if (note && note.length >= 5) return ctx.act('budget.approve', { id: el.dataset.p, decision: 'REJECT', note }, 'Budget dikembalikan ke Draft');
        ui.ask('Kembalikan ' + el.dataset.p, 'Alasan pengembalian (min. 5 karakter)', (n) => ctx.act('budget.approve', { id: el.dataset.p, decision: 'REJECT', note: n }, 'Budget dikembalikan ke Draft'), { danger: true, ok: 'Kembalikan' });
      },
    },
  };

  /* ---------- NV-22 Budget Revision & Quarterly Reforecast ---------- */
  V[22] = {
    render(ctx) {
      const { s, L } = ctx;
      const locked = budgetsFor(ctx).filter((b) => b.status === 'LOCKED');
      const b = locked.find((x) => x.id === (L.b || ctx.q.b)) || locked[0];
      if (!b) return ui.empty('Belum ada budget terkunci.');
      const v = S.budgetView(s, b.id);
      const revs = s.budgetRevisions.filter((r) => r.budget === b.id);
      const sp = b.plan ? spendPlan(b) : null;
      const canReq = ctx.can('budget.requestRevision');
      const form = !canReq
        ? '<p class="small muted">Role ini tidak dapat mengajukan revisi.</p>'
        : sp
          ? `<div class="stack"><div class="field"><label>Baris budget</label><select class="inp" id="rv-line">${sp.map((l) => `<option value="${l.id}">${l.id} · ${esc(l.name)} · ${esc(S.orgName(s, l.unit))} · ${short(l.revised)}</option>`).join('')}</select></div><div class="field"><label>Usulan revised tahunan (Rp)</label><input class="inp" type="number" id="rv-amt" min="1"></div><div class="field"><label>Alasan revisi *</label><textarea class="inp" id="rv-reason" rows="2" placeholder="Apa yang berubah & dampaknya"></textarea></div><button class="btn block" data-a="reqLine" data-b="${b.id}">Ajukan revisi</button></div>`
          : `<div class="stack"><div class="grid g2"><div class="field"><label>Dari 7P</label><select class="inp" id="rv-from">${P6().map((p) => `<option value="${p.key}" ${p.key === 'PROMOTION' ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div><div class="field"><label>Ke 7P</label><select class="inp" id="rv-to">${P6().map((p) => `<option value="${p.key}" ${p.key === 'PRODUCT' ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div></div><div class="field"><label>Nilai realokasi (Rp)</label><input class="inp" type="number" id="rv-amt" value="20000000" min="1"></div><div class="field"><label>Kuartal</label><select class="inp" id="rv-q"><option>Q4</option><option>Q3</option></select></div><div class="field"><label>Alasan revisi *</label><textarea class="inp" id="rv-reason" rows="2">Kenaikan harga minyak pijat (lihat insight AI)</textarea></div><button class="btn block" data-a="reqP" data-b="${b.id}">Ajukan realokasi</button><p class="tiny muted">Realokasi antar-7P net nol — total budget tidak berubah.</p></div>`;
      const max = Math.max(v.totals.original, v.totals.revised, v.totals.forecast, v.totals.actual + v.totals.commitment) || 1;
      const bars = [['Original', v.totals.original, '#2f6fde'], ['Revised', v.totals.revised, '#c99a2e'], ['Actual', v.totals.actual, '#06b6d4'], ['Commitment', v.totals.commitment, '#8b5cf6'], ['Forecast', v.totals.forecast, '#22a355']];
      return `<div class="stack"><div class="card"><div class="row"><select class="inp" style="max-width:300px" data-ch="selB" aria-label="Budget">${locked.map((x) => `<option value="${x.id}" ${x.id === b.id ? 'selected' : ''}>FY${x.fy} · ${esc(S.orgName(s, x.bu))} · v${x.version}</option>`).join('')}</select>${stageB(s, b)}<span class="r" style="margin-left:auto">${ui.demo()}</span></div></div>
        <div class="grid g4 keep2">${ui.kpi('Original baseline', short(v.totals.original), 'tidak pernah ditimpa', 'g-blue', 'doc')}${ui.kpi('Approved revised', short(v.totals.revised), 'versi v' + b.version, 'g-gold', 'budget')}${ui.kpi('Forecast EAC', short(v.totals.forecast), b.fy === 2026 ? 'aktual + max(komitmen, run-rate)' : '= revised (belum berjalan)', 'g-teal', 'ai')}${ui.kpi('Usulan revisi', revs.filter((r) => r.status === 'SUBMITTED').length, 'menunggu Owner', '', 'inbox')}</div>
        <div class="grid g-2-1"><div class="card"><h3>Revision & reforecast workbench</h3>${ui.table(
          [
            { h: 'Revisi', f: (r) => `<b>${r.id}</b><div class="tiny muted">${esc(r.quarter || '')} · ${esc(S.userName(s, r.by))}</div>` },
            { h: 'Perubahan', f: (r) => r.changes.map((c) => (c.line ? `${c.line}: ${short(c.old)} → <b>${short(c.newAmount)}</b>` : `${pName(c.p)} ${c.delta > 0 ? '+' : ''}${short(c.delta)}`)).join('<br>') },
            { h: 'Alasan', f: (r) => `<span class="small">${esc(r.reason)}</span>` },
            { h: 'Status', f: (r) => ui.status(r.status) },
            { h: '', f: (r) => (r.status === 'SUBMITTED' && ctx.can('budget.decideRevision') ? `<button class="btn sm bad" data-a="rvNo" data-p="${r.id}">Tolak</button> <button class="btn sm ok" data-a="rvOk" data-p="${r.id}">Setujui</button>` : r.status === 'SUBMITTED' ? '<span class="badge warn">Menunggu Owner</span>' : '') },
          ],
          revs,
          { empty: 'Belum ada revisi untuk budget ini.' }
        )}<div class="alert info" style="margin-top:10px">${ui.icon('alert', 16)}<span>Revisi yang belum disetujui tidak mengubah Revised. Forecast boleh berubah tanpa mengesahkan revisi. AI hanya memberi rekomendasi realokasi — hanya persetujuan manusia (Owner) yang mengubah budget terkunci.</span></div></div>
        <div class="card" style="align-self:start"><h3>${ui.icon('plus', 16)} ${sp ? 'Usulan revisi baris' : 'Realokasi antar-7P'}</h3>${form}</div></div>
        <div class="grid g2"><div class="card"><h3>Original · Revised · Actual · Commitment · Forecast</h3>${bars.map((x) => `<div class="row" style="padding:6px 0;flex-wrap:nowrap"><span class="small" style="width:110px">${x[0]}</span><div style="flex:1"><div class="bar"><i style="width:${(x[1] / max) * 100}%;background:${x[2]}"></i></div></div><span class="small num" style="width:90px">${short(x[1])}</span></div>`).join('')}</div>
        <div class="card"><h3>Reforecast kuartalan per 7P</h3>${ui.table([{ h: '7P', f: (l) => ui.p7(l.p) + (l.cls === 'CAPEX' ? ' <span class="tiny muted">CAPEX</span>' : '') }, { h: 'Revised', num: true, f: (l) => short(l.revised) }, { h: 'Forecast', num: true, f: (l) => short(l.forecast) }, { h: 'Selisih', num: true, f: (l) => `<b class="${l.forecast > l.revised ? 'bad-t' : 'ok-t'}">${l.forecast > l.revised ? '+' : ''}${short(l.forecast - l.revised)}</b>` }], v.lines.filter((l) => l.cls !== 'OUTCOME'))}</div></div></div>`;
    },
    actions: {
      selB,
      reqLine(el, ctx) {
        ctx.act('budget.requestRevision', { id: el.dataset.b, quarter: 'Q1', reason: ctx.val('rv-reason'), changes: [{ line: ctx.val('rv-line'), newAmount: +ctx.val('rv-amt') }] }, (r) => `${r.id} diajukan — Revised belum berubah`);
      },
      reqP(el, ctx) {
        const amt = +ctx.val('rv-amt');
        if (ctx.val('rv-from') === ctx.val('rv-to')) return ui.toast('7P asal & tujuan harus berbeda', 'bad');
        ctx.act('budget.requestRevision', { id: el.dataset.b, quarter: ctx.val('rv-q'), reason: ctx.val('rv-reason'), changes: [{ p: ctx.val('rv-from'), delta: -amt }, { p: ctx.val('rv-to'), delta: amt }] }, (r) => `${r.id} diajukan ke Owner`);
      },
      rvOk(el, ctx) {
        ctx.act('budget.decideRevision', { id: el.dataset.p, decision: 'APPROVE' }, 'Revisi disetujui — Revised diperbarui, Original tetap');
      },
      rvNo(el, ctx) {
        ctx.act('budget.decideRevision', { id: el.dataset.p, decision: 'REJECT' }, 'Revisi ditolak');
      },
    },
  };

  /* ---------- NV-23 Budget vs Actual vs Commitment vs Forecast ---------- */
  function evidence(ctx, b, pk) {
    const s = ctx.s;
    const ccs = s.costCenters.filter((c) => S.buOf(s, c.org) === b.bu).map((c) => c.id);
    const iss = s.ledger.filter((l) => l.type === 'ISSUE' && l.note !== 'Seed history' && ccs.includes(l.cc) && (S.item(s, l.item) || {}).p === pk);
    const com = [];
    s.mrfs.forEach((m) => {
      if (!['APPROVED', 'IN_FULFILLMENT'].includes(m.status) || S.buOf(s, m.branch) !== b.bu) return;
      m.lines.forEach((l) => {
        const it = S.item(s, l.item);
        const open = l.qty - U.sum(l.alloc || [], (a) => a.issuedQty);
        if (it.p === pk && open > 0) com.push({ m, l, open, v: open * it.price });
      });
    });
    const wos = pk === 'FACILITY' ? s.workOrders.filter((w) => w.status === 'COMPLETED' && w.completedAt >= '2026-11-08' && S.buOf(s, (S.asset(s, w.asset) || {}).org) === b.bu) : [];
    const line = b.lines.find((l) => l.p === pk && l.cls === 'OPEX') || {};
    const body = `<div class="alert info">${ui.icon('alert', 16)}<span>Aktual = saldo awal YTD (DEMO) + transaksi sesi ini yang sumbernya dapat ditelusuri. PO yang belum diterima/dipakai <b>tidak</b> dihitung sebagai aktual.</span></div>
      <div class="card" style="margin-top:10px"><h3>Aktual — pemakaian (stock issue)</h3><dl class="kv"><dt>Saldo awal YTD</dt><dd>${U.rp(line.baseActual || 0)} <span class="badge demo">DEMO</span></dd></dl>${ui.table([{ h: 'Ledger', f: (l) => `<span class="mono tiny">${l.id}</span>` }, { h: 'Item', f: (l) => esc(S.itemName(s, l.item)) }, { h: 'Qty', num: true, f: (l) => -l.qty }, { h: 'Nilai', num: true, f: (l) => U.rp(-l.qty * S.item(s, l.item).price) }, { h: 'Sumber', f: (l) => ui.id(l.ref) }], iss, { empty: 'Belum ada pemakaian baru dalam sesi ini.' })}
      ${wos.length ? ui.table([{ h: 'Work order', f: (w) => ui.id(w.id) }, { h: 'Biaya', num: true, f: (w) => U.rp(w.cost) }], wos) : ''}</div>
      <div class="card" style="margin-top:10px"><h3>Komitmen — MRF disetujui belum diserahkan</h3><dl class="kv"><dt>Saldo awal komitmen</dt><dd>${U.rp(line.baseCommit || 0)} <span class="badge demo">DEMO</span></dd></dl>${ui.table([{ h: 'MRF', f: (x) => ui.id(x.m.id) }, { h: 'Item', f: (x) => esc(S.itemName(s, x.l.item)) }, { h: 'Qty terbuka', num: true, f: (x) => x.open }, { h: 'Nilai', num: true, f: (x) => U.rp(x.v) }, { h: 'Status', f: (x) => ui.status(x.m.status) }], com, { empty: 'Tidak ada komitmen terbuka.' })}</div>`;
    ui.openDrawer(`Bukti ${pName(pk)} — ${b.id}`, body, '', 'Evidence drill-down');
  }
  V[23] = {
    render(ctx) {
      const { s, L } = ctx;
      const b = pickBudget(ctx, ctx.scope.bu && ctx.scope.bu !== 'ALL' ? ctx.scope.bu : 'BGT-2026-SPA');
      if (!b) return noBudget(ctx);
      const v = S.budgetView(s, b.id);
      const pf = L.p !== undefined ? L.p : ctx.q.p || '';
      const rows = v.lines.filter((l) => l.cls !== 'OUTCOME' && (!pf || l.p === pf));
      const t = v.totals;
      const avail = t.revised - t.actual - t.commitment;
      const over = rows.filter((l) => l.forecast > l.revised).sort((a, c) => c.forecast - c.revised - (a.forecast - a.revised));
      const dyn = rows.filter((l) => l.dynActual || l.dynCommit);
      return `<div class="stack"><div class="card"><div class="row">${budgetSel(ctx, b)}<select class="inp" style="max-width:180px" data-ch="fp" aria-label="7P"><option value="">Semua 7P</option>${P6().map((p) => `<option value="${p.key}" ${p.key === pf ? 'selected' : ''}>${p.name}</option>`).join('')}</select><span class="small muted">per ${U.date(s.meta.demoDate)}</span><span class="r" style="margin-left:auto">${ui.demo()}</span></div></div>
        <div class="grid g5 keep2">${ui.kpi('Original', short(t.original), 'baseline disetujui', '', 'doc')}${ui.kpi('Revised', short(t.revised), 'setelah revisi v' + b.version, 'g-gold', 'budget')}${ui.kpi('Actual', short(t.actual), 'pemakaian & beban terverifikasi', 'g-teal', 'finance')}${ui.kpi('Commitment', short(t.commitment), 'MRF disetujui belum dipakai', 'g-violet', 'mrf')}${ui.kpi('Forecast EAC', short(t.forecast), 'estimasi akhir tahun', 'g-blue', 'ai')}</div>
        <div class="grid g-2-1"><div class="card"><h3>Budget vs Actual vs Commitment per 7P</h3>${ui.bars({ labels: rows.map((l) => pName(l.p) + (l.cls === 'CAPEX' ? ' (CAPEX)' : '')), series: [{ name: 'Revised', color: '#d6d0c2', values: rows.map((l) => Math.round(l.revised / 1e6)) }, { name: 'Actual', color: '#06b6d4', values: rows.map((l) => Math.round(l.actual / 1e6)) }, { name: 'Commitment', color: '#8b5cf6', values: rows.map((l) => Math.round(l.commitment / 1e6)) }, { name: 'Forecast', color: '#22a355', values: rows.map((l) => Math.round(l.forecast / 1e6)) }], h: 220, fmt: (x) => U.num(x) + ' jt' })}</div>
        <div class="card"><h3>${ui.icon('ai', 16)} AI variance insight <span class="badge violet">rule-based DEMO</span></h3>
          <div class="stmt"><span class="kind k-metric">Metrik terhitung</span><span>Sisa tersedia ${U.rp(avail)} (${U.pct(avail / (t.revised || 1))} dari revised).</span></div>
          ${over.length ? `<div class="stmt"><span class="kind k-forecast">Estimasi / forecast</span><span>${esc(pName(over[0].p))} diproyeksikan melewati budget sebesar ${short(over[0].forecast - over[0].revised)} bila laju berlanjut.</span></div><div class="stmt"><span class="kind k-hypo">Hipotesis AI</span><span>Dapat dipicu volume treatment, harga supplier, atau selisih stok — perlu verifikasi pemilik budget.</span></div><div class="stmt"><span class="kind k-rec">Rekomendasi — perlu persetujuan manusia</span><span>Telusuri bukti, lalu bila perlu ajukan realokasi di NV-22 (Owner memutuskan).</span></div>` : '<div class="stmt"><span class="kind k-fact">Fakta terverifikasi</span><span>Tidak ada 7P yang diproyeksikan melewati budget.</span></div>'}
          ${dyn.length ? `<div class="alert ok" style="margin-top:8px">${ui.icon('check', 16)}<span>Transaksi sesi ini sudah tercermin: ${dyn.map((l) => `${pName(l.p)} aktual +${short(l.dynActual)}${l.dynCommit ? ', komitmen ' + short(l.dynCommit) : ''}`).join('; ')}.</span></div>` : ''}
          <dl class="kv" style="margin-top:8px"><dt>Pengakuan aktual</dt><dd>Konsumsi / beban terverifikasi</dd><dt>PO belum diterima</dt><dd>≠ aktual <span class="badge gold">aturan</span></dd><dt>Profit (P7)</dt><dd>${v.profit ? short(v.profit.actual) + ' / ' + short(v.profit.revised) : '—'} (hasil)</dd></dl></div></div>
        <div class="card"><h3>Register varians 7P</h3>${ui.table(
          [
            { h: '7P', f: (l) => ui.p7(l.p) + (l.cls !== 'OPEX' ? ` <span class="tiny muted">${l.cls}</span>` : '') },
            { h: 'Original', num: true, f: (l) => U.rp(l.original) },
            { h: 'Revised', num: true, f: (l) => U.rp(l.revised) },
            { h: 'Actual', num: true, f: (l) => U.rp(l.actual) + (l.dynActual ? `<div class="tiny ok-t">+${short(l.dynActual)} sesi ini</div>` : '') },
            { h: 'Commitment', num: true, f: (l) => U.rp(l.commitment) },
            { h: 'Sisa', num: true, f: (l) => `<b class="${l.remaining < 0 ? 'bad-t' : 'ok-t'}">${U.rp(l.remaining)}</b>` },
            { h: 'Forecast', num: true, f: (l) => U.rp(l.forecast) },
            { h: 'Utilisasi', f: (l) => `<div style="min-width:90px">${ui.bar(l.utilization, l.utilization > 1 ? 'bad' : l.utilization >= 0.9 ? 'warn' : 'ok')}<span class="tiny">${U.pct(l.utilization)}</span></div>` },
            { h: '', f: (l) => (l.cls === 'OPEX' ? `<button class="btn sm ghost" data-a="ev" data-p="${l.p}">Bukti</button>` : '') },
          ],
          rows,
          { foot: `<td><b>Total P1–P6</b></td><td class="num"><b>${U.rp(U.sum(rows, (l) => l.original))}</b></td><td class="num"><b>${U.rp(U.sum(rows, (l) => l.revised))}</b></td><td class="num"><b>${U.rp(U.sum(rows, (l) => l.actual))}</b></td><td class="num"><b>${U.rp(U.sum(rows, (l) => l.commitment))}</b></td><td class="num"><b>${U.rp(U.sum(rows, (l) => l.remaining))}</b></td><td class="num"><b>${U.rp(U.sum(rows, (l) => l.forecast))}</b></td><td></td><td></td>` }
        )}<p class="tiny muted" style="margin:8px 0 0"><b>Original</b> baseline disetujui · <b>Revised</b> setelah revisi Owner · <b>Actual</b> pemakaian/beban terverifikasi · <b>Commitment</b> MRF disetujui yang belum diserahkan (PO tertaut MRF tidak dihitung lagi) · <b>Forecast</b> = aktual + maks(komitmen, run-rate sisa bulan) — estimasi.</p></div></div>`;
    },
    actions: {
      selB,
      fp(el, ctx) {
        ctx.L.p = el.value;
        ctx.rerender();
      },
      ev(el, ctx) {
        evidence(ctx, pickBudget(ctx, 'BGT-2026-SPA'), el.dataset.p);
      },
    },
  };
})();
