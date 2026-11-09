/* 7P Master Financial Control Center (MP-HAWK-11 / MP-HAWK-12) — enhances existing screens, no new NV numbers:
     NV-57  Owner 7P Executive Cockpit (above the existing AI insight board)
     NV-16  7P Master Budget Control & two-way drill-down (existing allocation overview kept as a tab)
     NV-23  Budget line detail, transactions & evidence (existing 7P register kept as a tab)
   All numbers come from HAWK.P7 (cube over the existing budgets + transactions). DEMO / SIMULASI. */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const P7 = HAWK.P7;
  const esc = U.esc;
  const V = HAWK.views;
  const q = (o) => esc(JSON.stringify(o));
  const short = (v) => (v === null || v === undefined ? 'N/A' : U.rp(v, { short: true }));
  const pct = (v, d = 1) => (v === null || v === undefined || !isFinite(v) ? 'N/A' : U.pct(v, d));
  const pc = (k) => ui.pColor(k);
  const pn = (k) => (HAWK.SEVEN_P.find((x) => x.key === k) || {}).name || k;
  const FKEYS = ['fy', 'per', 'bu', 'loc', 'div', 'dept', 'p', 'sub', 'line', 'cls', 'stream', 'view'];

  /* ---------- shared state: one filter set across NV-57 / NV-16 / NV-23 (context is preserved between screens) ---------- */
  const ST = () => (ui.local._p7 = ui.local._p7 || { f: { fy: 2026, per: 'FY' }, mode: 'P7', hist: [], exp: {}, sort: 'budget', dir: 'desc', lastQ: '' });
  function applyQ(ctx) {
    const st = ST();
    const qq = ctx.q || {};
    if (!qq.p7) return st;
    const key = JSON.stringify(qq);
    if (st.lastQ === key) return st;
    st.lastQ = key;
    const f = { fy: 2026, per: 'FY' };
    FKEYS.forEach((k) => qq[k] && (f[k] = k === 'fy' ? +qq[k] : qq[k]));
    st.f = f;
    if (qq.mode) st.mode = qq.mode;
    st.exp = {};
    st.search = '';
    return st;
  }
  const setF = (ctx, patch, opts = {}) => {
    const st = ST();
    if (!opts.noHist) st.hist.push({ f: { ...st.f }, mode: st.mode });
    if (st.hist.length > 30) st.hist.shift();
    st.f = { ...st.f, ...patch };
    Object.keys(st.f).forEach((k) => (st.f[k] === '' || st.f[k] === undefined) && delete st.f[k]);
    st.f.fy = st.f.fy || 2026;
    st.f.per = st.f.per || 'FY';
    ctx.rerender();
  };
  const navQ = (f, extra = {}) => {
    const o = { p7: 1 };
    FKEYS.forEach((k) => f[k] && (o[k] = f[k]));
    return { ...o, ...extra };
  };

  /* ---------- building blocks ---------- */
  function filterBar(ctx, Q) {
    const { s } = ctx;
    const st = ST();
    const f = st.f;
    const vis = Q.visible;
    const pool = (k) => vis.filter((l) => P7.match(l, { ...f, [k]: undefined, line: undefined }));
    const opts = (k, label) => {
      const keys = U.uniq(pool(k).map((l) => l[k])).filter(Boolean);
      if (f[k] && !keys.includes(f[k])) keys.push(f[k]);
      if (k === 'p') keys.sort((a, b) => P7.ORDER.indexOf(a) - P7.ORDER.indexOf(b));
      return `<div class="field"><label>${label}</label><select class="inp" data-ch="p7f" data-k="${k}" aria-label="${label}"><option value="">Semua</option>${keys.map((x) => `<option value="${esc(x)}" ${x === f[k] ? 'selected' : ''}>${esc(k === 'sub' ? x : P7.label(s, k, x))}</option>`).join('')}</select></div>`;
    };
    const mode = Q.acc.modes.length > 1 ? `<div class="field"><label>Sudut pandang</label><select class="inp" data-ch="p7f" data-k="view" aria-label="Sudut pandang">${Q.acc.modes.map((m, i) => `<option value="${m.key}${m.p ? '' : ''}" ${(f.view || Q.acc.modes[0].key) === m.key ? 'selected' : ''}>${esc(m.label)}</option>`).join('')}</select></div>` : '';
    return `<div class="card p7-filters" id="p7-filters"><div class="p7-fgrid">
      <div class="field"><label>Tahun fiskal</label><select class="inp" data-ch="p7f" data-k="fy" aria-label="Tahun"><option value="2026" ${+f.fy === 2026 ? 'selected' : ''}>FY2026 (berjalan, terkunci)</option><option value="2027" ${+f.fy === 2027 ? 'selected' : ''}>FY2027 (rencana — belum disetujui)</option></select></div>
      <div class="field"><label>Periode</label><select class="inp" data-ch="p7f" data-k="per" aria-label="Periode">${P7.PERIODS.map(([k, l]) => `<option value="${k}" ${k === (f.per || 'FY') ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      ${opts('bu', 'Business Unit')}${opts('loc', 'Outlet / Office')}${opts('div', 'Divisi')}${opts('dept', 'Departemen')}${opts('p', '7P')}${opts('sub', 'Subkategori')}
      <div class="field"><label>Jenis dana</label><select class="inp" data-ch="p7f" data-k="cls" aria-label="Jenis dana"><option value="">OPEX + CAPEX + Inventory</option>${['OPEX', 'INVENTORY', 'CAPEX'].map((k) => `<option value="${k}" ${f.cls === k ? 'selected' : ''}>${k === 'OPEX' ? 'OPEX (non-inventory)' : P7.CLASS_LABEL[k]}</option>`).join('')}</select></div>
      <div class="field"><label>Management stream</label><select class="inp" data-ch="p7f" data-k="stream" aria-label="Stream"><option value="">Operational + Innovation</option><option value="OPERATIONAL" ${f.stream === 'OPERATIONAL' ? 'selected' : ''}>Operational</option><option value="INNOVATION" ${f.stream === 'INNOVATION' ? 'selected' : ''}>Innovation</option></select></div>
      ${mode}</div>
      <div class="row" style="margin-top:10px">${chips(ctx)}<span style="margin-left:auto" class="row">${st.hist.length ? `<button class="btn sm ghost" data-a="p7undo" title="Kembali ke filter sebelumnya">${ui.icon('arrow', 14)} Kembali</button>` : ''}<button class="btn sm ghost" data-a="p7reset">Reset filter</button>${Q.acc.export ? `<button class="btn sm ghost" data-a="p7xlsx">${ui.icon('download', 14)} Excel .xlsx</button><button class="btn sm" data-a="p7pdf">${ui.icon('doc', 14)} PDF / Print</button>` : `<span class="tiny muted">Export tidak tersedia untuk peran ini</span>`}</span></div></div>`;
  }
  function chips(ctx) {
    const { s } = ctx;
    const f = ST().f;
    const per = (P7.PERIODS.find((x) => x[0] === (f.per || 'FY')) || [])[1];
    const c = [`<span class="p7-chip on">FY${f.fy} · ${esc(per)}</span>`];
    ['p', 'bu', 'loc', 'div', 'dept', 'sub', 'line', 'cls', 'stream'].forEach((k) => {
      if (!f[k]) return;
      const lbl = k === 'sub' ? f[k] : k === 'cls' ? P7.CLASS_LABEL[f[k]] : k === 'stream' ? f[k] : k === 'line' ? f[k] : P7.label(s, k, f[k]);
      c.push(`<button class="p7-chip" data-a="p7clr" data-k="${k}" title="Hapus filter">${esc(lbl)} ✕</button>`);
    });
    return `<span class="tiny muted">${ui.icon('filter', 13)} Filter aktif:</span> ${c.join(' ')} ${ui.demo('100% DEMO · bukan data HAWK')}`;
  }
  const kpiBtn = (inner, nv, qo, aria) => `<button class="kpi-btn" data-nav="${nv}" data-q='${q(qo)}' aria-label="${esc(aria)}">${inner}</button>`;
  const utilBar = (u) => (u === null ? '<span class="tiny muted">N/A</span>' : `<div class="p7-util">${ui.bar(Math.min(u, 1.2), u > 1 ? 'bad' : u >= 0.9 ? 'warn' : 'ok')}<span class="tiny num">${pct(u)}</span></div>`);
  const tip = (t) => `<span class="p7-tip" title="${esc(t)}" tabindex="0" aria-label="${esc(t)}">ⓘ</span>`;
  const DEF = {
    tr: 'Budget / Target Revenue % = budget kategori (periode & jenis dana sama) ÷ target pendapatan pada lingkup yang sama × 100. N/A bila lingkup tidak punya pendapatan langsung.',
    ar: 'Actual / Actual Revenue % = realisasi kategori ÷ pendapatan aktual pada lingkup yang sama × 100 (konsolidasi: setelah eliminasi antar-BU).',
    ut: 'Budget Utilization % = realisasi ÷ budget revised periode yang sama × 100.',
    av: 'Available = revised − actual − komitmen terbuka (MRF/PO yang belum diterima/dipakai; PO tertaut MRF tidak dihitung dua kali).',
    va: 'Variance = actual − revised (negatif = di bawah budget / favourable untuk biaya). Varians forecast dilacak terpisah.',
    fc: 'Forecast = aktual + maks(komitmen terbuka, run-rate × sisa bulan) — estimasi, bukan otorisasi budget.',
    pm: 'Profit Margin = laba aktual ÷ pendapatan eksternal aktual × 100 (konsolidasi setelah eliminasi antar-BU).',
  };

  /* ---------- export ---------- */
  function download(name, bytes, mime) {
    const blob = new Blob([bytes], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.dataset.p7download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1500);
  }
  function exportXlsx(ctx) {
    const st = ST();
    const r = HAWK.api.call('report.export7P', { filters: st.f, format: 'xlsx' }, ctx.user);
    if (!r.ok) return ui.toast(r.error.message, 'bad', 'report.export7P · ' + r.error.code);
    const x = P7.exportSheets(ctx.s, ctx.user, st.f);
    const bytes = P7.xlsx(x.sheets);
    HAWK.lastExport = { name: `HAWK_7P_FY${st.f.fy}_${st.f.per || 'FY'}_${ctx.s.meta.demoDate}.xlsx`, rows: x.q.rows.length, total: x.q.totals.budget, actual: x.q.totals.actual, bytes: bytes.length };
    download(HAWK.lastExport.name, bytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ui.toast(`Excel dibuat: ${x.q.rows.length} budget line`, 'ok', 'report.export7P · audit EXPORT_7P · DEMO');
  }
  function exportPdf(ctx) {
    const st = ST();
    const r = HAWK.api.call('report.export7P', { filters: st.f, format: 'pdf' }, ctx.user);
    if (!r.ok) return ui.toast(r.error.message, 'bad', 'report.export7P · ' + r.error.code);
    const x = P7.exportSheets(ctx.s, ctx.user, st.f);
    const [sum] = x.sheets;
    const meta = sum.rows.slice(0, 16).filter((rw) => rw.length);
    const tbl = sum.rows.slice(17).filter((rw) => rw.length);
    const fmt = (v) => (typeof v === 'number' ? U.rp(v) : esc(v));
    const html = `<div class="p7-print-doc"><div class="p7-print-head"><div><b>HAWK × JAENS</b> · 7P Master Financial Control</div><div class="tiny">Dicetak ${esc(new Date().toISOString().slice(0, 16).replace('T', ' '))} · as-of ${esc(ctx.s.meta.demoDate)} · <b>DEMO / SIMULASI</b></div></div>
      <h2>Laporan 7P — FY${esc(st.f.fy)}</h2><table class="p7-print-meta">${meta.map((rw) => `<tr><th>${esc(rw[0])}</th><td>${esc(rw[1] || '')}</td></tr>`).join('')}</table>
      <table class="p7-print-tbl"><thead><tr>${tbl[0].map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${tbl.slice(1).map((rw) => `<tr>${rw.map((v) => `<td>${fmt(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <p class="tiny">P7 Profit adalah hasil (outcome) dan tidak dijumlahkan ke belanja P1–P6. COA, dokumen sumber dan pajak berstatus TO VERIFY. Export produksi wajib dibuat server dengan otorisasi & log.</p></div>`;
    let box = document.getElementById('p7-print');
    if (!box) {
      box = document.createElement('div');
      box.id = 'p7-print';
      document.body.appendChild(box);
    }
    box.innerHTML = html;
    document.body.classList.add('p7-printing');
    HAWK.lastPrint = { rows: tbl.length - 1, filters: meta.map((rw) => rw.join(': ')) };
    const done = () => document.body.classList.remove('p7-printing');
    window.addEventListener('afterprint', done, { once: true });
    try {
      window.print();
    } catch (e) {
      /* print not available (embedded frame) */
    }
    setTimeout(done, 400);
  }

  /* ---------- shared actions ---------- */
  const ACT = {
    p7f(el, ctx) {
      const k = el.dataset.k;
      const patch = { [k]: k === 'fy' ? +el.value : el.value };
      // changing a parent dimension clears dependent ones that may no longer exist
      const dep = { bu: ['loc', 'div', 'dept', 'line'], loc: ['div', 'dept', 'line'], div: ['dept', 'line'], dept: ['line'], p: ['sub', 'line'], sub: ['line'], fy: ['line', 'loc', 'div', 'dept', 'sub'], view: ['p', 'line'] }[k] || [];
      dep.forEach((d) => (patch[d] = ''));
      setF(ctx, patch);
    },
    p7clr(el, ctx) {
      const k = el.dataset.k;
      const patch = { [k]: '' };
      ({ p: ['sub', 'line'], bu: ['loc', 'div', 'dept', 'line'], loc: ['div', 'dept', 'line'], div: ['dept', 'line'], dept: ['line'], sub: ['line'] }[k] || []).forEach((d) => (patch[d] = ''));
      setF(ctx, patch);
    },
    p7reset(el, ctx) {
      const st = ST();
      st.hist.push({ f: { ...st.f }, mode: st.mode });
      st.f = { fy: st.f.fy || 2026, per: 'FY', view: st.f.view };
      st.exp = {};
      st.search = '';
      ctx.rerender();
    },
    p7undo(el, ctx) {
      const st = ST();
      const h = st.hist.pop();
      if (h) {
        st.f = h.f;
        st.mode = h.mode;
      }
      ctx.rerender();
    },
    p7xlsx: (el, ctx) => exportXlsx(ctx),
    p7pdf: (el, ctx) => exportPdf(ctx),
  };

  /* =====================================================================================
     NV-57 — Owner 7P Executive Cockpit
     ===================================================================================== */
  function cockpit(ctx) {
    const { s } = ctx;
    const st = applyQ(ctx);
    const f = st.f;
    const Q = P7.query(s, ctx.user, f);
    if (!Q.acc.ok) return '';
    const rev = P7.revenue(s, f, ctx.user);
    const pr = P7.profit(s, f, ctx.user);
    const T = Q.totals;
    const byP = P7.group(s, Q, 'p');
    const gP = (k) => byP.find((g) => g.key === k);
    const per = (P7.PERIODS.find((x) => x[0] === (f.per || 'FY')) || [])[1];
    const basis = f.cls ? P7.CLASS_LABEL[f.cls] : 'Total Funding Budget (OPEX + CAPEX + Inventory)';
    const hero = `<div class="hero p7-hero"><div class="tiny" style="color:var(--champagne);letter-spacing:.12em;font-weight:700">HAWK EXECUTIVE INTELLIGENCE · 7P MANAGEMENT</div><h2>7P Master Budget & Financial Control Center</h2><p>${esc(Q.acc.label)} · FY${f.fy} · ${esc(per)} · per ${esc(Q.asOf)}. Klik kategori, BU atau kartu untuk turun sampai transaksi.</p>
      <div class="row" style="margin-top:10px"><span class="badge dark">${esc(basis)}</span><span class="badge demo">SIMULASI · bukan data produksi</span>${+f.fy === 2027 ? '<span class="badge warn">FY2027 rencana — belum disetujui</span>' : ''}<button class="btn sm" data-nav="16" data-q='${q(navQ(f, { mode: 'P7' }))}' style="margin-left:auto">Full drill-down ${ui.icon('arrow', 14)}</button></div></div>`;
    const kp = `<div class="grid p7-kpis">
      ${kpiBtn(ui.kpi('Target revenue ' + tip(DEF.ar), rev.na ? 'N/A' : short(rev.target), rev.na ? esc(rev.reason) : `Aktual ${short(rev.actual)} · ${pct(P7.ratio(rev.actual, rev.target))}${rev.elimination ? ' · eliminasi antar-BU ' + short(rev.elimination) : ''}`, 'g-dark', 'target'), 10, {}, 'Target revenue')}
      ${kpiBtn(ui.kpi('7P budget P1–P6', short(T.budget), `Original ${short(T.original)} · revised FY ${short(Q.rows.reduce((a, l) => a + l.revised, 0))}`, 'g-gold', 'budget'), 16, navQ(f, { mode: 'P7' }), '7P budget')}
      ${kpiBtn(ui.kpi('Realisasi ' + tip(DEF.ut), short(T.actual), `Utilisasi ${pct(T.utilization)} · ${esc(Q.commitNote)}`, 'g-teal', 'finance'), 23, navQ(f, { tab: 'lines' }), 'Realisasi')}
      ${kpiBtn(ui.kpi('Komitmen terbuka', short(T.commitment), 'MRF/PO belum diterima / dipakai', 'g-violet', 'mrf'), 23, navQ(f, { tab: 'lines' }), 'Komitmen')}
      ${kpiBtn(ui.kpi('Sisa tersedia ' + tip(DEF.av), short(T.available), 'revised − actual − komitmen', '', 'check'), 23, navQ(f, { tab: 'lines' }), 'Sisa tersedia')}
      ${kpiBtn(ui.kpi('Forecast ' + tip(DEF.fc), short(T.forecast), `Varians forecast ${T.fVariance > 0 ? '+' : ''}${short(T.fVariance)} · varians aktual ${short(T.variance)}`, 'g-blue', 'ai'), 23, navQ(f, { tab: 'lines' }), 'Forecast')}
      ${kpiBtn(ui.kpi('P7 Profit (outcome) ' + tip(DEF.pm), pr.na ? 'N/A' : short(pr.actual), pr.na ? esc(pr.reason) : `Target ${short(pr.target)} · margin ${pct(pr.margin)} (target ${pct(pr.targetMargin)})`, 'p7-profit', 'finance'), 16, navQ(f, { p: 'PROFIT' }), 'P7 Profit')}</div>`;
    const rows = byP.filter((g) => g.key !== 'PROFIT');
    const table = `<div class="card"><div class="card-head"><h3>7P Budget vs Realisasi</h3><span class="r tiny muted">Klik kategori untuk turun ke BU, divisi, item dan transaksi</span></div>${ui.table(
      [
        { h: '7P (klik)', f: (g) => `<button class="link p7-cat" data-nav="16" data-q='${q(navQ({ ...f, p: g.key }, { mode: 'P7' }))}'><i class="p-dot" style="background:${pc(g.key)}"></i>${esc(P7.label(s, 'p', g.key))}</button> ${tip('Steward: ' + ((P7.cat(s, g.key) || {}).stewardNote || ''))}` },
        { h: '% Target Rev ' + tip(DEF.tr), num: true, f: (g) => (rev.na ? 'N/A' : pct(P7.ratio(g.budget, rev.target))) },
        { h: '% Actual Rev ' + tip(DEF.ar), num: true, f: (g) => (rev.na ? 'N/A' : pct(P7.ratio(g.actual, rev.actual))) },
        { h: 'Budget', num: true, f: (g) => short(g.budget) },
        { h: 'Realisasi', num: true, f: (g) => short(g.actual) },
        { h: 'Utilisasi', f: (g) => utilBar(g.utilization) },
        { h: 'Komitmen', num: true, f: (g) => short(g.commitment) },
        { h: 'Sisa', num: true, f: (g) => `<b class="${g.available < 0 ? 'bad-t' : 'ok-t'}">${short(g.available)}</b>` },
        { h: 'Forecast', num: true, f: (g) => short(g.forecast) },
      ],
      rows,
      { empty: 'Tidak ada budget line untuk filter ini.', rowAttr: (g) => `data-p7row="${g.key}"`, foot: `<td><b>JUMLAH BELANJA P1–P6</b></td><td class="num">${rev.na ? 'N/A' : pct(P7.ratio(T.budget, rev.target))}</td><td class="num">${rev.na ? 'N/A' : pct(P7.ratio(T.actual, rev.actual))}</td><td class="num">${short(T.budget)}</td><td class="num">${short(T.actual)}</td><td>${utilBar(T.utilization)}</td><td class="num">${short(T.commitment)}</td><td class="num">${short(T.available)}</td><td class="num">${short(T.forecast)}</td>` }
    )}
      <div class="p7-outcome"><span class="p-dot" style="background:${pc('PROFIT')}"></span><b>P7 Profit — outcome, tidak dijumlahkan ke belanja.</b> ${pr.na ? esc(pr.reason) : `Target ${short(pr.target)} (${pct(pr.targetMargin)} dari target revenue) · aktual YTD ${short(pr.actual)} · margin ${pct(pr.margin)}${pr.elimination ? ' · eliminasi margin antar-BU ' + short(pr.elimination) : ''}.`} <span class="tiny muted">${esc(pr.note || '')}</span></div>
      <p class="tiny muted" style="margin:8px 0 0">Basis: <b>${esc(basis)}</b>. Ini analisis alokasi dana, bukan laporan laba-rugi: inventory & CAPEX tidak otomatis menjadi beban P&L saat dibeli. Pendapatan: ${esc(rev.na ? rev.reason : rev.basis)}.</p></div>`;
    const donut = `<div class="card"><h3>Komposisi budget 7P</h3><p class="tiny muted" style="margin-top:-4px">P1–P6 · ${esc(basis)}</p>${ui.donut({ items: rows.map((g) => ({ label: pn(g.key), color: pc(g.key), value: Math.max(0, g.budget) })), center: short(T.budget).replace('Rp ', ''), sub: 'P1–P6 · DEMO', size: 160 })}
      <div class="p7-tiles">${rows.map((g) => `<button class="p7-tile" style="--pc:${pc(g.key)}" data-nav="16" data-q='${q(navQ({ ...f, p: g.key }, { mode: 'P7' }))}'><b>${esc(pn(g.key))}</b><span>${short(g.budget)} · ${pct(g.share)}</span></button>`).join('')}</div></div>`;
    const byBu = P7.group(s, Q, 'bu');
    const mx = Math.max(1, ...byBu.map((g) => g.budget));
    const ben = P7.beneficiary(s, Q);
    const bu = `<div class="card"><h3>Distribusi per Business Unit</h3><p class="tiny muted" style="margin-top:-4px">Klik untuk membuka 7P khusus BU (organisasi → 7P)</p>${byBu.map((g) => `<button class="p7-bu" data-nav="16" data-q='${q(navQ({ ...f, bu: g.key }, { mode: 'ORG' }))}'><span class="row" style="justify-content:space-between;flex-wrap:nowrap"><span class="small"><b>${esc(g.label)}</b></span><span class="small num">${short(g.budget)} · ${pct(g.share)}</span></span>${ui.bar(g.budget / mx, 'ok')}<span class="tiny muted">realisasi ${short(g.actual)} · utilisasi ${pct(g.utilization)}</span></button>`).join('') || ui.empty('—')}
      ${Object.keys(ben).length ? `<div class="alert info" style="margin-top:8px">${ui.icon('alert', 16)}<span><b>Memo alokasi Shared Office</b> (tidak ditambahkan lagi): ${Object.entries(ben).map(([b, v]) => `${esc(S.orgName(s, b))} ${short(v)}`).join(' · ')} — basis pool NV-07.</span></div>` : ''}</div>`;
    const SEA = s.season;
    const cum = (arr) => arr.reduce((a, v, i) => (a.push((a[i - 1] || 0) + v), a), []);
    const mB = SEA.map((_, i) => U.sum(Q.rows, (l) => l.mBudget[i]));
    const mA = SEA.map((_, i) => U.sum(Q.rows, (l) => l.mActual[i]));
    const mF = SEA.map((_, i) => U.sum(Q.rows, (l) => l.mForecast[i]));
    const cm = +s.meta.demoDate.slice(5, 7);
    const cA = cum(mA).map((v, i) => (i < cm ? v / 1e6 : null));
    const trend = `<div class="card"><h3>Tren budget & realisasi (kumulatif)</h3>${ui.line({ labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], series: [{ name: 'Revised budget', color: '#c99a2e', values: cum(mB).map((v) => v / 1e6) }, { name: 'Realisasi', color: '#0f9d8a', values: cA }, { name: 'Forecast', color: '#2f6fde', values: cum(mF).map((v) => v / 1e6), dash: true }], h: 200, fmt: (v) => U.num(v) + ' jt' })}<p class="tiny muted">Seluruh angka DEMO; realisasi s.d. ${esc(s.meta.demoDate)}.</p></div>`;
    return `<div class="stack p7-cockpit" id="p7-cockpit">${hero}${filterBar(ctx, Q)}${kp}${table}<div class="grid g3 p7-3">${donut}${bu}${trend}</div>${insightPanel(ctx, f)}</div>`;
  }
  function insightPanel(ctx, f) {
    const list = P7.insights(ctx.s, ctx.user, f);
    const SEV = { HIGH: 'bad', MEDIUM: 'warn', LOW: 'info' };
    return `<div class="card p7-ins"><div class="card-head"><h3>${ui.icon('ai', 16)} HAWK AI · 7P insight</h3><span class="r"><span class="badge violet">AI SIMULATION · DEMO</span></span></div><div class="p7-insgrid">${
      list.map((i) => `<div class="p7-insight" data-ins7="${i.id}"><div class="row" style="gap:6px;flex-wrap:nowrap"><span class="sev ${i.sev}"></span><b class="small">${esc(i.title)}</b><span class="badge ${SEV[i.sev]}" style="margin-left:auto">${i.sev === 'HIGH' ? 'Tinggi' : i.sev === 'MEDIUM' ? 'Sedang' : 'Rendah'}</span></div>
        <div class="stmt"><span class="kind k-fact">Fakta terverifikasi (data DEMO)</span><span class="small">${esc(i.fact)}</span></div>
        <details class="p7-more"><summary>Dugaan penyebab, sumber, dampak & rekomendasi</summary><div class="stmt"><span class="kind k-hypo">Dugaan penyebab — perlu verifikasi</span><span class="small">${esc(i.hypo)}</span></div>
        <dl class="kv p7-kv"><dt>Sumber data</dt><dd>${esc(i.source)}</dd><dt>As-of</dt><dd>${esc(i.asOf)}</dd><dt>Dampak bisnis</dt><dd>${esc(i.impact)}</dd><dt>Rekomendasi</dt><dd>${esc(i.rec)}</dd><dt>Penanggung jawab</dt><dd>${esc(i.role)}</dd><dt>Persetujuan manusia</dt><dd>${esc(i.approval)}</dd></dl></details>
        <div class="row" style="gap:6px;margin-top:6px">${i.evidence.map((e) => (e.line ? `<button class="btn sm ghost" data-nav="23" data-q='${q(navQ({ ...f, line: e.line }, { tab: 'lines' }))}'>${esc(e.label)}</button>` : `<button class="btn sm ghost" data-nav="16" data-q='${q(navQ({ ...f, ...e.f }, { mode: 'P7' }))}'>${esc(e.label)}</button>`)).join('')}</div></div>`).join('') || ui.empty('Tidak ada insight untuk lingkup ini.')
    }<p class="tiny muted">AI menjelaskan & merekomendasikan; tidak mengubah budget, tidak memposting jurnal, tidak menyetujui pembayaran, dan tidak memutuskan perlakuan pajak.</p></div>`;
  }
  const old57 = V[57];
  V[57] = {
    ...old57,
    render(ctx) {
      const c = cockpit(ctx);
      return c ? `<div class="stack">${c}<div class="p7-sep"><span>Insight AI operasional (semua area)</span></div>${old57.render(ctx)}</div>` : old57.render(ctx);
    },
    actions: { ...old57.actions, ...ACT },
  };

  /* =====================================================================================
     NV-16 — 7P Master Budget Control & two-way drill-down
     ===================================================================================== */
  const levelsOf = (mode) => P7.LEVELS[mode === 'ORG' ? 'ORG' : 'P7'];
  function curLevel(st) {
    const lv = levelsOf(st.mode);
    return lv.find((k) => k !== 'line' && !st.f[k]) || 'line';
  }
  function crumbs(ctx, st) {
    const { s } = ctx;
    const lv = levelsOf(st.mode);
    const set = lv.filter((k) => st.f[k] && k !== 'line');
    return `<nav class="crumbs p7-crumbs" aria-label="Breadcrumb"><button class="link" data-a="p7crumb" data-i="-1">${ui.icon('home', 13)} ${st.mode === 'ORG' ? 'Semua BU' : 'Semua 7P'}</button>${set.map((k, i) => `<span>›</span><button class="link" data-a="p7crumb" data-i="${i}" title="${esc(P7.LEVEL_LABEL[k])}">${esc(k === 'sub' ? st.f[k] : P7.label(s, k, st.f[k]))}</button>`).join('')}<span>›</span><span class="tiny muted">${esc(P7.LEVEL_LABEL[curLevel(st)])}</span></nav>`;
  }
  const COLS = [['budget', 'Revised'], ['actual', 'Actual'], ['commitment', 'Committed'], ['available', 'Available'], ['forecast', 'Forecast'], ['utilization', 'Util.'], ['share', '% lingkup']];
  function treeRows(ctx, Q, st, f, levelIdx, depth, out) {
    const { s } = ctx;
    const lv = levelsOf(st.mode);
    const level = lv[levelIdx];
    const sub = { ...Q, rows: Q.rows.filter((l) => P7.match(l, f)) };
    const groups = P7.group(s, sub, level, { sort: st.sort, dir: st.dir });
    groups.forEach((g) => {
      const nf = level === 'line' ? f : { ...f, [level]: g.key };
      const path = lv.slice(0, levelIdx + 1).map((k) => (k === level ? g.key : nf[k] || '')).join('|') + '|' + st.mode;
      const open = !!st.exp[path];
      const isLine = level === 'line';
      const nextIdx = lv.findIndex((k, i) => i > levelIdx && !nf[k]);
      const label = isLine ? `<button class="link" data-a="p7line" data-id="${g.key}">${ui.icon('doc', 13)} ${esc(g.label)}</button> <span class="tiny muted mono">${g.key}</span>` : `${level === 'p' ? `<i class="p-dot" style="background:${pc(g.key)}"></i>` : ''}<button class="link p7-drill" data-a="p7drill" data-lv="${level}" data-k="${esc(g.key)}" title="Fokus ke ${esc(g.label)}">${esc(g.label)}</button> <span class="tiny muted">${esc(P7.LEVEL_LABEL[level])}</span>`;
      out.push(`<tr class="p7-tr d${Math.min(depth, 6)} ${open ? 'open' : ''}" data-level="${level}" data-key="${esc(g.key)}"><td style="padding-left:${10 + depth * 18}px">${isLine || nextIdx < 0 ? '<span class="p7-tg"></span>' : `<button class="p7-tg" data-a="p7exp" data-path="${esc(path)}" aria-expanded="${open}" aria-label="${open ? 'Tutup' : 'Buka'} ${esc(g.label)}">${open ? '▾' : '▸'}</button>`}${label}</td>
        <td class="num">${short(g.budget)}</td><td class="num">${short(g.actual)}</td><td class="num">${short(g.commitment)}</td><td class="num"><b class="${g.available < 0 ? 'bad-t' : 'ok-t'}">${short(g.available)}</b></td><td class="num">${short(g.forecast)}</td><td>${utilBar(g.utilization)}</td><td class="num">${pct(g.share)}</td></tr>`);
      if (open && !isLine && nextIdx >= 0) treeRows(ctx, Q, st, nf, nextIdx, depth + 1, out);
    });
  }
  function selection(ctx, Q, st) {
    const { s } = ctx;
    const f = st.f;
    const T = Q.totals;
    const rev = P7.revenue(s, f, ctx.user);
    const one = Q.rows[0];
    const sameP = one && Q.rows.every((l) => l.p === one.p);
    const sameLoc = one && Q.rows.every((l) => l.loc === one.loc);
    const stw = sameP && one ? P7.stewardOf(s, one) : null;
    const own = sameLoc && one && Q.rows.every((l) => l.div === one.div) ? P7.ownerOf(s, one) : null;
    // reconciliation proof: the other navigation order over the same filter set gives the same totals
    const other = P7.sumPeriod(Q.visible.filter((l) => P7.match(l, { ...f })), Q.mm);
    const ok = Math.round(other.budget) === Math.round(T.budget) && Math.round(other.actual) === Math.round(T.actual);
    const atSub = f.sub || f.line;
    return `<div class="card p7-sel" id="p7-sel"><div class="tiny" style="letter-spacing:.1em;color:var(--gold-dark);font-weight:700">RINCIAN SELEKSI</div><h3 style="margin:2px 0 8px">${esc(f.sub || (f.dept ? P7.label(s, 'dept', f.dept) : f.div ? P7.label(s, 'div', f.div) : f.loc ? P7.label(s, 'loc', f.loc) : f.bu ? P7.label(s, 'bu', f.bu) : f.p ? P7.label(s, 'p', f.p) : 'Seluruh lingkup'))}</h3>
      <div class="row" style="gap:6px;margin-bottom:6px">${f.p ? `<span class="badge" style="background:${pc(f.p)};color:#fff">${esc(P7.label(s, 'p', f.p))}</span>` : ''}<span class="badge">${Q.rows.length} budget line</span></div>
      <dl class="kv"><dt>Revised (periode)</dt><dd><b>${U.rp(T.budget)}</b></dd><dt>Original (FY)</dt><dd>${U.rp(T.original)}</dd><dt>Realisasi</dt><dd>${U.rp(T.actual)}</dd><dt>Komitmen terbuka</dt><dd>${U.rp(T.commitment)}</dd><dt>Sisa tersedia</dt><dd><b class="${T.available < 0 ? 'bad-t' : 'ok-t'}">${U.rp(T.available)}</b></dd><dt>Forecast</dt><dd>${U.rp(Math.round(T.forecast))}</dd><dt>Variance ${tip(DEF.va)}</dt><dd>${U.rp(T.variance)}</dd>
      <dt>% target revenue</dt><dd>${rev.na ? `N/A <span class="tiny muted">(${esc(rev.reason)})</span>` : pct(P7.ratio(T.budget, rev.target))}</dd></dl>
      ${stw ? `<div class="alert gold" style="margin-top:10px;background:#fbf2d9;color:#6b5112"><span><b>7P steward:</b> ${esc(stw.user ? stw.user.name + ' — ' + stw.user.title : S.orgName(s, stw.org))}<br><span class="tiny">${esc(stw.note || '')}</span>${own ? `<br><b>Pemilik budget (cost center):</b> ${esc(own.name)} — ${esc(own.title)}` : ''}<br><span class="tiny">Steward ≠ pemilik biaya: satu transaksi dicatat sekali.</span></span></div>` : ''}
      <div class="p7-recon ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} Rekonsiliasi: jalur 7P → organisasi dan organisasi → 7P pada filter ini sama-sama ${short(T.budget)} / ${short(T.actual)}</div>
      <div class="stack" style="gap:6px;margin-top:10px">${atSub || Q.rows.length <= 12 ? `<button class="btn" data-nav="23" data-q='${q(navQ(f, { tab: 'lines' }))}'>${ui.icon('doc', 15)} Lihat transaksi & evidence</button>` : `<button class="btn ghost" data-nav="23" data-q='${q(navQ(f, { tab: 'lines' }))}'>Daftar budget line (NV-23)</button>`}
        <div class="row" style="gap:6px"><button class="btn sm ghost" data-nav="15">NV-15 Perencanaan</button><button class="btn sm ghost" data-nav="20">NV-20 Periode</button><button class="btn sm ghost" data-nav="22">NV-22 Revisi</button>${f.p === 'PRODUCT' ? '<button class="btn sm ghost" data-nav="17">NV-17 BHP</button><button class="btn sm ghost" data-nav="61">NV-61 Flow</button>' : ''}</div></div></div>`;
  }
  function drill(ctx) {
    const { s } = ctx;
    const st = applyQ(ctx);
    const Q = P7.query(s, ctx.user, st.f);
    if (!Q.acc.ok) return `<div class="card">${ui.empty('<b>Tidak ada data budget 7P dalam lingkup akses Anda.</b>')}</div>`;
    const f = st.f;
    const lv = levelsOf(st.mode);
    const cur = curLevel(st);
    const curIdx = lv.indexOf(cur);
    const sr = (st.search || '').trim().toLowerCase();
    let body;
    if (sr) {
      const hits = Q.rows.filter((l) => `${l.name} ${l.sub} ${l.id} ${P7.label(s, 'dept', l.dept)} ${P7.locName(s, l.loc)}`.toLowerCase().includes(sr)).slice(0, 40);
      body = ui.table(
        [
          { h: 'Hasil pencarian', f: (l) => `<button class="link" data-a="p7line" data-id="${l.id}">${esc(l.name)}</button><div class="tiny muted">${esc([P7.label(s, 'p', l.p), P7.label(s, 'bu', l.bu), P7.locName(s, l.loc), P7.label(s, 'dept', l.dept), l.sub].join(' › '))}</div>` },
          { h: 'Revised', num: true, f: (l) => short(P7.sumPeriod([l], Q.mm).budget) },
          { h: 'Actual', num: true, f: (l) => short(P7.sumPeriod([l], Q.mm).actual) },
        ],
        hits,
        { empty: 'Tidak ada item yang cocok.' }
      );
    } else {
      const out = [];
      treeRows(ctx, Q, st, f, curIdx, 0, out);
      body = `<div class="tbl-wrap"><table class="tbl p7-tree"><thead><tr><th><button class="p7-sort" data-a="p7sort" data-k="label">Struktur · klik nama untuk fokus, ▸ untuk buka</button></th>${COLS.map(([k, l]) => `<th class="num"><button class="p7-sort" data-a="p7sort" data-k="${k}" aria-label="Urutkan ${l}">${l}${st.sort === k ? (st.dir === 'asc' ? ' ▲' : ' ▼') : ''}</button></th>`).join('')}</tr></thead><tbody>${out.join('') || `<tr><td colspan="8" class="empty">Tidak ada budget line untuk filter ini.</td></tr>`}</tbody>
        <tfoot><tr><td><b>Total lingkup</b></td><td class="num">${short(Q.totals.budget)}</td><td class="num">${short(Q.totals.actual)}</td><td class="num">${short(Q.totals.commitment)}</td><td class="num">${short(Q.totals.available)}</td><td class="num">${short(Q.totals.forecast)}</td><td>${utilBar(Q.totals.utilization)}</td><td class="num">100%</td></tr></tfoot></table></div>`;
    }
    const allP = st.mode === 'P7' && f.p && (f.bu || f.loc || f.div || f.dept) ? `<button class="btn sm ghost" data-a="p7allp" title="Tampilkan semua 7P untuk unit ini tanpa menggandakan budget">Lihat semua 7P unit ini</button>` : '';
    return `<div class="stack" id="p7-drill">${filterBar(ctx, Q)}
      <div class="card"><div class="card-head"><div><h3>7P Master Drill-Down</h3><div class="tiny muted">Dua jalur eksplorasi, satu sumber angka · ${esc(Q.acc.label)}${Q.mode && Q.acc.modes.length > 1 ? ' · ' + esc(Q.mode.label) : ''}</div></div>
        <span class="r row" style="gap:6px"><span class="seg" role="group" aria-label="Urutan hierarki"><button class="${st.mode !== 'ORG' ? 'on' : ''}" data-a="p7mode" data-m="P7">7P → Organisasi</button><button class="${st.mode === 'ORG' ? 'on' : ''}" data-a="p7mode" data-m="ORG">Organisasi → 7P</button></span>${allP}<button class="btn sm ghost" data-a="p7collapse">Tutup hierarki</button></span></div>
        ${crumbs(ctx, st)}<div class="row" style="margin:6px 0 10px"><input class="inp" style="max-width:320px" placeholder="Cari item, subkategori, departemen…" value="${esc(st.search || '')}" data-ch="p7search" aria-label="Cari dalam hierarki"><span class="tiny muted">Level berikut: <b>${esc(P7.LEVEL_LABEL[cur])}</b> · ${Q.rows.length} budget line · ${esc(Q.commitNote)}</span></div></div>
      <div class="grid p7-dgrid"><div class="card" style="padding:0;overflow:hidden">${body}<p class="tiny muted" style="padding:8px 12px;margin:0">Klik kategori → BU → lokasi → divisi → departemen → subkategori → item → transaksi. Total pada filter yang sama selalu sama di kedua jalur (satu baris budget dibaca sekali).</p></div>${selection(ctx, Q, st)}</div></div>`;
  }
  function lineDrawer(ctx, id) {
    const { s } = ctx;
    const st = ST();
    const l = P7.lines(s, +st.f.fy || 2026).find((x) => x.id === id);
    if (!l || !P7.access(s, ctx.user).pred(l)) return ui.toast('Budget line di luar lingkup akses Anda', 'bad');
    const mm = P7.periodMonths(st.f.per, s);
    const t = P7.sumPeriod([l], mm);
    ui.openDrawer(
      l.name,
      `<div class="crumbs">${esc([P7.label(s, 'p', l.p), P7.label(s, 'bu', l.bu), P7.locName(s, l.loc), S.orgName(s, l.div), P7.label(s, 'dept', l.dept), l.sub].join(' › '))}</div>
      <dl class="kv"><dt>Revised (periode)</dt><dd>${U.rp(t.budget)}</dd><dt>Realisasi</dt><dd>${U.rp(t.actual)}</dd><dt>Komitmen</dt><dd>${U.rp(l.commitment)}</dd><dt>Sisa</dt><dd>${U.rp(t.available)}</dd><dt>Forecast</dt><dd>${U.rp(Math.round(t.forecast))}</dd><dt>Jenis dana</dt><dd>${esc(P7.CLASS_LABEL[l.kind] || l.kind)} · ${esc(l.stream)}</dd><dt>COA</dt><dd>${esc(P7.coa(l).account)} <span class="badge warn">TO VERIFY</span></dd></dl>`,
      `<button class="btn" data-nav="23" data-q='${q(navQ({ ...st.f, line: l.id }, { tab: 'lines' }))}'>Buka detail, transaksi & evidence</button>`,
      l.id + ' · ' + l.status
    );
  }
  const DRILL_ACT = {
    ...ACT,
    p7mode(el, ctx) {
      const st = ST();
      st.hist.push({ f: { ...st.f }, mode: st.mode });
      st.mode = el.dataset.m;
      st.exp = {};
      ctx.rerender();
    },
    p7drill(el, ctx) {
      setF(ctx, { [el.dataset.lv]: el.dataset.k });
      ST().exp = {};
    },
    p7exp(el, ctx) {
      const st = ST();
      st.exp[el.dataset.path] = !st.exp[el.dataset.path];
      ctx.rerender();
    },
    p7collapse(el, ctx) {
      ST().exp = {};
      ctx.rerender();
    },
    p7crumb(el, ctx) {
      const st = ST();
      const lv = levelsOf(st.mode);
      const set = lv.filter((k) => st.f[k] && k !== 'line');
      const keep = +el.dataset.i;
      const patch = { line: '' };
      set.forEach((k, i) => i > keep && (patch[k] = ''));
      setF(ctx, patch);
    },
    p7allp(el, ctx) {
      const st = ST();
      st.hist.push({ f: { ...st.f }, mode: st.mode });
      st.mode = 'ORG';
      st.f = { ...st.f, p: undefined, sub: undefined, line: undefined };
      Object.keys(st.f).forEach((k) => st.f[k] === undefined && delete st.f[k]);
      st.exp = {};
      ctx.rerender();
    },
    p7sort(el, ctx) {
      const st = ST();
      st.dir = st.sort === el.dataset.k && st.dir === 'desc' ? 'asc' : 'desc';
      st.sort = el.dataset.k;
      ctx.rerender();
    },
    p7search(el, ctx) {
      ST().search = el.value;
      ctx.rerender();
    },
    p7line(el, ctx) {
      lineDrawer(ctx, el.dataset.id);
    },
  };
  const old16 = V[16];
  V[16] = {
    ...old16,
    render(ctx) {
      const tab = ctx.L.tab || 'drill';
      return `<div class="stack">${ui.tabs('tab', [['drill', '7P Master Drill-Down'], ['alloc', 'Alokasi per budget (FY & unit)']], tab)}${tab === 'alloc' ? old16.render(ctx) : drill(ctx)}</div>`;
    },
    actions: { ...old16.actions, ...DRILL_ACT },
  };

  /* =====================================================================================
     NV-23 — budget line detail, transactions & evidence
     ===================================================================================== */
  const STAGE = { ACTUAL: ['Realisasi', 'ok'], COMMIT: ['Komitmen', 'violet'], LINEAGE: ['Lineage (tidak dihitung)', ''] };
  const TYPE = { PAYROLL_AGG: 'Payroll agregat', AP_BILL: 'Tagihan supplier (AP)', ACCRUAL: 'Akrual (GL)', ASSET_CAP: 'Kapitalisasi aset', PO_OPEN: 'PO terbuka', LIVE_ACTUAL: 'Transaksi sesi (real)', LIVE_COMMIT: 'MRF disetujui (real)', PO_LINEAGE: 'Purchase Order' };
  function lineDetail(ctx, l, Q) {
    const { s } = ctx;
    const st = ST();
    const t = P7.sumPeriod([l], Q.mm);
    const b = s.budgets.find((x) => x.id === l.budget) || {};
    const own = P7.ownerOf(s, l);
    const stw = P7.stewardOf(s, l);
    const coa = P7.coa(l);
    const tx = P7.txns(s, l, ctx.user);
    const acc = Q.acc;
    const path = [['p', l.p], ['bu', l.bu], ['loc', l.loc], ['div', l.div], ['dept', l.dept], ['sub', l.sub]];
    const crumb = path.map(([k, v], i) => `<button class="link" data-nav="16" data-q='${q(navQ({ fy: l.fy, per: st.f.per, ...Object.fromEntries(path.slice(0, i + 1)) }, { mode: 'P7' }))}'>${esc(k === 'sub' ? v : P7.label(s, k, v))}</button>`).join('<span>›</span>');
    const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const cm = +s.meta.demoDate.slice(5, 7);
    const sumT = (stage) => U.sum(tx.filter((x) => x.stage === stage), (x) => x.amount);
    return `<div class="stack" id="p7-line" data-line="${l.id}">
      <div class="card"><nav class="crumbs p7-crumbs" aria-label="Jalur budget line">${ui.icon('home', 13)}${crumb}<span>›</span><b>${esc(l.name)}</b></nav>
        <div class="row" style="align-items:flex-start"><div><h3 style="margin:4px 0">${esc(l.name)}</h3><div class="tiny muted mono">${l.id} · ${esc(l.budget)} v${b.version || 1} · ${esc(l.status)}${l.draft ? ' · rencana belum disetujui' : ''}</div></div><span class="r" style="margin-left:auto">${ui.p7(l.p)} <span class="badge">${esc(P7.CLASS_LABEL[l.kind] || l.kind)}</span> <span class="badge ${l.stream === 'INNOVATION' ? 'violet' : 'info'}">${esc(l.stream === 'INNOVATION' ? 'Innovation' : 'Operational')}</span> ${ui.demo()}</span></div></div>
      <div class="grid p7-kpis">${ui.kpi('Original (FY)', short(l.original), 'baseline disetujui')}${ui.kpi('Revised (periode)', short(t.budget), 'revised FY ' + short(l.revised), 'g-gold')}${ui.kpi('Realisasi', short(t.actual), 'utilisasi ' + pct(t.utilization), 'g-teal')}${ui.kpi('Komitmen terbuka', short(l.commitment), 'MRF/PO belum diterima', 'g-violet')}${ui.kpi('Sisa tersedia', short(t.available), tip(DEF.av))}${ui.kpi('Forecast', short(t.forecast), 'varians forecast ' + short(t.fVariance), 'g-blue')}${ui.kpi('Variance', short(t.variance), t.variance <= 0 ? 'di bawah budget (favourable)' : 'di atas budget (unfavourable)', t.variance > 0 ? 'p7-bad' : '')}</div>
      <div class="grid g-2-1"><div class="card"><h3>Dimensi & tanggung jawab</h3><dl class="kv"><dt>Tahun / periode</dt><dd>FY${l.fy} · ${esc((P7.PERIODS.find((x) => x[0] === (st.f.per || 'FY')) || [])[1])}</dd><dt>Business Unit</dt><dd>${esc(P7.label(s, 'bu', l.bu))}</dd><dt>Outlet / Office</dt><dd>${esc(P7.locName(s, l.loc))}</dd><dt>Divisi</dt><dd>${esc(S.orgName(s, l.div))}</dd><dt>Departemen</dt><dd>${esc(P7.label(s, 'dept', l.dept))}</dd><dt>Cost center</dt><dd class="mono">${esc(P7.ccOf(s, l) || '—')}</dd><dt>7P / subkategori</dt><dd>${esc(P7.label(s, 'p', l.p))} · ${esc(l.sub)}</dd><dt>SKU / proyek</dt><dd>${l.sku ? ui.id(l.sku) : '—'} ${l.project ? ui.id(l.project) : ''}</dd>
        <dt>Pemilik budget (cost center)</dt><dd>${own ? esc(own.name + ' — ' + own.title) : '—'}</dd><dt>7P steward (strategis)</dt><dd>${stw.user ? esc(stw.user.name + ' — ' + stw.user.title) : esc(S.orgName(s, stw.org))}</dd><dt>Approver budget</dt><dd>${esc((s.users.find((u) => u.id === b.approvedBy) || {}).name || 'Belum disetujui')} (${esc(b.status || '—')})</dd><dt>Pemohon transaksi</dt><dd>per dokumen (lihat tabel)</dd></dl>
        <p class="tiny muted">Pemilik budget, steward, approver dan pemohon adalah dimensi berbeda. Satu transaksi dicatat sekali; tampilan 7P dan organisasi membaca baris yang sama.</p></div>
        <div class="card"><h3>Pemetaan COA & akuntansi</h3><dl class="kv"><dt>Akun</dt><dd>${esc(coa.account)}</dd><dt>Perlakuan</dt><dd>${esc(coa.treatment)}</dd><dt>Status</dt><dd><span class="badge warn">${coa.status}</span> finance.resolveExistingCOAMapping</dd></dl>
        <div class="alert warn" style="margin-top:8px">${ui.icon('alert', 16)}<span>Tidak ada COA baru dibuat. Nomor akun mengikuti akun DEMO jurnal simulasi dan wajib diverifikasi ke COA HAWK.</span></div>
        <h3 style="margin-top:12px">Profil bulanan</h3>${ui.bars({ labels: MN, series: [{ name: 'Revised', color: '#d6d0c2', values: l.mBudget.map((v) => Math.round(v / 1e5) / 10) }, { name: 'Realisasi', color: '#0f9d8a', values: l.mActual.map((v, i) => (i < cm ? Math.round(v / 1e5) / 10 : 0)) }], h: 150, fmt: (x) => U.num(x, 1) + ' jt' })}</div></div>
      <div class="card"><div class="card-head"><h3>Transaksi & evidence</h3><span class="r tiny muted">Realisasi ${short(sumT('ACTUAL'))} · komitmen ${short(sumT('COMMIT'))}${acc.tax ? ' · <b>mode Tax Administration</b>' : ''}</span></div>
      ${ui.table(
        [
          { h: 'Tanggal', f: (x) => U.date(x.date) },
          { h: 'Dokumen', f: (x) => (x.real ? ui.id(x.id) : `<button class="link mono" data-a="p7ev" data-l="${l.id}" data-t="${esc(x.id)}">${esc(x.id)}</button> <span class="badge demo">SIMULASI</span>`) },
          { h: 'Jenis', f: (x) => `${esc(TYPE[x.type] || x.type)}<div class="tiny"><span class="badge ${STAGE[x.stage][1]}">${STAGE[x.stage][0]}</span></div>` },
          { h: 'Keterangan', f: (x) => `${esc(x.label)}<div class="tiny muted">${esc(x.party)}${x.restricted ? ' · ' + esc(x.restricted) : ''}</div>` },
          { h: 'Nilai', num: true, f: (x) => (x.lineage ? `<span class="muted">${U.rp(x.amount)}</span>` : U.rp(x.amount)) },
          { h: 'Pajak (PPN / PPh / PBJT)', f: (x) => `<span class="tiny">${esc(x.tax.ppn)} · ${esc(x.tax.pph)}${x.tax.pbjt !== '—' ? ' · ' + esc(x.tax.pbjt) : ''}</span>` },
          { h: 'Faktur / review', f: (x) => `<span class="tiny">${esc(x.tax.invoice)}</span><div class="tiny ${/MENUNGGU/.test(x.tax.review) ? 'warn-t' : 'muted'}">${esc(x.tax.review)}</div>` },
        ],
        tx,
        { empty: 'Belum ada transaksi untuk budget line ini (FY2027 = rencana).', maxH: 420 }
      )}
      <div class="row" style="margin-top:8px;gap:6px"><span class="tiny muted">Modul terkait:</span><button class="btn sm ghost" data-nav="27">NV-27 MRF</button><button class="btn sm ghost" data-nav="32">NV-32 PO</button><button class="btn sm ghost" data-nav="42">NV-42 Penerimaan</button><button class="btn sm ghost" data-nav="50">NV-50 AP</button><button class="btn sm ghost" data-nav="51">NV-51 GL</button>${l.cls === 'CAPEX' ? '<button class="btn sm ghost" data-nav="56">NV-56 Aset & penyusutan</button>' : ''}<button class="btn sm ghost" data-nav="22">NV-22 Revisi</button>${l.sku ? '<button class="btn sm ghost" data-nav="62">NV-62 Order journey</button>' : ''}</div>
      <p class="tiny muted">MRF ≠ PO ≠ penerimaan ≠ pemakaian ≠ beban ≠ pembayaran. PO yang tertaut MRF ditampilkan sebagai lineage dan tidak menambah komitmen. Pajak: dimensi terpisah (PPN, PPh, PBJT, faktur, kredit PPN, deductibility) — SIMULASI, keputusan final oleh Tax Administration; layar ini tidak mengubah posting GL.</p></div></div>`;
  }
  function evModal(ctx, lid, tid) {
    const { s } = ctx;
    const st = ST();
    const l = P7.lines(s, +st.f.fy || 2026).find((x) => x.id === lid);
    if (!l || !P7.access(s, ctx.user).pred(l)) return ui.toast('Di luar lingkup akses', 'bad');
    const t = P7.txns(s, l, ctx.user).find((x) => x.id === tid);
    if (!t) return;
    ui.openModal(
      `Evidence ${esc(t.id)}`,
      `<div class="alert warn">${ui.icon('alert', 16)}<span><b>SIMULASI · SOURCE TO VERIFY.</b> Dokumen asli dibuka lewat <span class="mono">documents.openAuthorizedEvidence</span> di server (URL sementara, ber-otorisasi). Tidak ada URL publik.</span></div>
      <div class="p7-evcard"><div class="row"><b>${esc(TYPE[t.type] || t.type)}</b><span class="badge demo" style="margin-left:auto">SIMULASI</span></div><dl class="kv"><dt>Nomor</dt><dd class="mono">${esc(t.id)}</dd><dt>Tanggal</dt><dd>${U.date(t.date)}</dd><dt>Pihak</dt><dd>${esc(t.party)}</dd><dt>Nilai</dt><dd><b>${U.rp(t.amount)}</b></dd><dt>Budget line</dt><dd>${esc(l.id)} · ${esc(l.name)}</dd><dt>COA</dt><dd>${esc(t.coa.account)} <span class="badge warn">TO VERIFY</span></dd><dt>PPN</dt><dd>${esc(t.tax.ppn)}</dd><dt>PPh</dt><dd>${esc(t.tax.pph)}</dd><dt>PBJT</dt><dd>${esc(t.tax.pbjt)}</dd><dt>Faktur pajak</dt><dd>${esc(t.tax.invoice)}</dd><dt>Kredit PPN</dt><dd>${esc(t.tax.credit)}</dd><dt>Deductibility</dt><dd>${esc(t.tax.deductible)}</dd><dt>Review pajak</dt><dd>${esc(t.tax.review)}</dd></dl>
      ${t.restricted ? `<div class="alert info">${ui.icon('shield', 16)}<span>${esc(t.restricted)}. Rincian payroll per karyawan hanya untuk peran berwenang di server HAWK.</span></div>` : ''}</div>`,
      '<button class="btn" data-close-modal>Tutup</button>'
    );
  }
  function linesTab(ctx) {
    const { s } = ctx;
    const st = applyQ(ctx);
    const Q = P7.query(s, ctx.user, { ...st.f, line: undefined });
    if (!Q.acc.ok) return `<div class="card">${ui.empty('<b>Tidak ada data budget 7P dalam lingkup akses Anda.</b>')}</div>`;
    const sel = st.f.line && Q.all.find((l) => l.id === st.f.line);
    const detail = sel && Q.acc.pred(sel) ? lineDetail(ctx, sel, Q) : sel ? `<div class="card">${ui.empty('Budget line di luar lingkup akses Anda.')}</div>` : '';
    const rows = Q.rows.slice().sort((a, b) => b.revised - a.revised);
    const tbl = `<div class="card"><div class="card-head"><h3>Budget line dalam lingkup (${rows.length})</h3><span class="r tiny muted">klik item untuk detail & evidence</span></div>${ui.table(
      [
        { h: 'Budget item', f: (l) => `<button class="link" data-a="p7pick" data-id="${l.id}">${esc(l.name)}</button><div class="tiny muted">${esc([P7.locName(s, l.loc), P7.label(s, 'dept', l.dept), l.sub].join(' · '))}</div>` },
        { h: '7P', f: (l) => ui.p7(l.p) },
        { h: 'Revised', num: true, f: (l) => short(P7.sumPeriod([l], Q.mm).budget) },
        { h: 'Actual', num: true, f: (l) => short(P7.sumPeriod([l], Q.mm).actual) },
        { h: 'Komitmen', num: true, f: (l) => short(l.commitment) },
        { h: 'Utilisasi', f: (l) => utilBar(P7.sumPeriod([l], Q.mm).utilization) },
      ],
      rows,
      { maxH: 420, rowCls: (l) => (l.id === st.f.line ? 'sel' : ''), empty: 'Tidak ada budget line.' }
    )}</div>`;
    return `<div class="stack">${filterBar(ctx, Q)}${detail}${tbl}</div>`;
  }
  const old23 = V[23];
  V[23] = {
    ...old23,
    render(ctx) {
      if (ctx.q && ctx.q.tab && ctx.L._qtab !== JSON.stringify(ctx.q)) {
        ctx.L._qtab = JSON.stringify(ctx.q);
        ctx.L.tab = ctx.q.tab;
      }
      const tab = ctx.L.tab || 'register';
      return `<div class="stack">${ui.tabs('tab', [['register', 'Register 7P (per budget)'], ['lines', 'Per budget line, transaksi & evidence']], tab)}${tab === 'lines' ? linesTab(ctx) : old23.render(ctx)}</div>`;
    },
    actions: {
      ...old23.actions,
      ...ACT,
      p7pick(el, ctx) {
        setF(ctx, { line: el.dataset.id });
        setTimeout(() => {
          const d = document.getElementById('p7-line');
          if (d && d.scrollIntoView) d.scrollIntoView({ block: 'start' });
        }, 30);
      },
      p7ev(el, ctx) {
        evModal(ctx, el.dataset.l, el.dataset.t);
      },
    },
  };
  HAWK.p7ui = { ST, navQ };
})();
