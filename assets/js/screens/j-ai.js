/* Module J — AI Intelligence & Reporting (NV-57..60). DETERMINISTIC SIMULATION — no AI model, no live data.
   Every statement is typed: FACT / METRIC / FORECAST / HYPOTHESIS / RECOMMENDATION. Humans act; AI never executes. */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const vh = HAWK.vh;
  const esc = U.esc;
  const V = HAWK.views;
  const short = (v) => U.rp(v, { short: true });
  const SEV = { HIGH: ['Tinggi', 'bad'], MEDIUM: ['Sedang', 'warn'], LOW: ['Rendah', 'info'] };
  const banner = () => `<div class="alert violet">${ui.icon('ai', 16)}<div><b>AI SIMULASI — deterministik dari data DEMO.</b> Tidak ada model AI, OCR, atau koneksi data produksi. Setiap pernyataan diberi label jenisnya; rekomendasi butuh persetujuan manusia dan tidak pernah dieksekusi otomatis. <span class="mono">ai.insights</span> ${ui.intBadge('NEW INTEGRATION REQUIRED')}</div></div>`;
  const legend = () => `<div class="row" style="gap:6px">${Object.values(HAWK.AI.KIND).map((k) => `<span class="kind ${k.cls}">${esc(k.label)}</span>`).join('')}</div>`;
  const card = (i, acts) => `<div class="ai-card" style="margin-bottom:10px"><div class="row" style="align-items:flex-start;flex-wrap:nowrap;gap:8px"><span class="sev ${i.severity}" style="margin-top:5px;flex:none"></span><div style="flex:1;min-width:0"><button class="link" data-ins-open="${i.id}" style="text-align:left"><b>${esc(i.title)}</b></button>
      <div class="tiny muted" style="margin-top:2px">${esc(i.area)} ${i.p ? ui.p7(i.p) : ''} · pemilik ${esc(HAWK.ROLE_LABEL[i.owner] || i.owner)} · per ${U.date(i.asOf)} · <span class="badge ${SEV[i.severity][1]}">${SEV[i.severity][0]}</span> ${i.state.status !== 'OPEN' ? ui.status(i.state.status) : ''}</div>
      <p class="small" style="margin:6px 0">${esc(i.finding)}</p><div class="tiny" style="margin:-2px 0 6px"><b>Dampak:</b> ${esc(i.impact)} <span class="muted">(estimasi)</span> · <b>Keputusan:</b> ${esc(HAWK.ROLE_LABEL[i.owner] || i.owner)}</div>
      ${i.statements.filter((x) => ['FORECAST', 'RECOMMENDATION'].includes(x.kind)).map((x) => `<div class="stmt"><span class="kind ${HAWK.AI.KIND[x.kind].cls}">${HAWK.AI.KIND[x.kind].label}</span><span class="small">${esc(x.text)}</span></div>`).join('')}
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-ins-open="${i.id}">Bukti (${i.evidence.length})</button>${acts && i.state.status !== 'DONE' && i.state.status !== 'DISMISS' ? `<button class="btn sm ghost" data-ins-act="ACKNOWLEDGE" data-ins="${i.id}">Akui</button><button class="btn sm ghost" data-ins-act="ASSIGN" data-ins="${i.id}">Tugaskan</button><button class="btn sm ghost" data-ins-act="DISMISS" data-ins="${i.id}">Abaikan…</button><button class="btn sm" data-ins-act="DONE" data-ins="${i.id}">Selesai</button>` : ''}</div></div></div></div>`;

  /* ---------- NV-57 Executive & BU AI Dashboard ---------- */
  V[57] = {
    render(ctx) {
      const { s, L } = ctx;
      const all = vh.insightsFor(ctx);
      const area = L.area || '';
      const sev = L.sev || '';
      const list = all.filter((i) => (!area || i.area === area) && (!sev || i.severity === sev) && (L.done || !['DONE', 'DISMISS'].includes(i.state.status)));
      const areas = U.uniq(all.map((i) => i.area));
      const spa = S.budgetView(s, 'BGT-2026-SPA');
      const ess = S.budgetView(s, 'BGT-2026-ESS');
      const rev = s.actualRevenue['BU-SPA'] + s.actualRevenue['BU-ESS'];
      const tgt = s.targets.filter((t) => t.fy === 2026).reduce((a, t) => a + t.revenue, 0);
      return `<div class="stack">${banner()}
        <div class="grid g4 keep2">${ui.kpi('Insight terbuka', all.filter((i) => i.state.status === 'OPEN').length, all.length + ' total untuk scope Anda', 'g-violet', 'ai')}${ui.kpi('Prioritas tinggi', all.filter((i) => i.severity === 'HIGH').length, 'butuh keputusan', 'g-gold', 'alert')}${ui.kpi('Revenue YTD vs target', U.pct(rev / tgt), short(rev) + ' / ' + short(tgt) + ' · DEMO', 'g-teal', 'finance')}${ui.kpi('Forecast belanja Spa+Essence', short(spa.totals.forecast + ess.totals.forecast), 'vs revised ' + short(spa.totals.revised + ess.totals.revised), 'g-blue', 'budget')}</div>
        <div class="card"><div class="row"><select class="inp" style="max-width:200px" data-ch="area" aria-label="Area"><option value="">Semua area</option>${areas.map((a) => `<option ${a === area ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select><select class="inp" style="max-width:160px" data-ch="sev" aria-label="Prioritas"><option value="">Semua prioritas</option>${Object.entries(SEV).map(([k, v]) => `<option value="${k}" ${k === sev ? 'selected' : ''}>${v[0]}</option>`).join('')}</select><label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-ch="done" ${L.done ? 'checked' : ''}> tampilkan yang selesai/diabaikan</label><span style="margin-left:auto">${legend()}</span></div></div>
        <div class="grid g-2-1"><div>${list.map((i) => card(i, ctx.can('insight.act'))).join('') || `<div class="card">${ui.empty('Tidak ada insight untuk filter ini.')}</div>`}</div>
        <div class="stack"><div class="card"><h3>Insight per area</h3>${ui.donut({ items: areas.map((a, k) => ({ label: a, color: ['#8b5cf6', '#2f6fde', '#0f9d8a', '#c99a2e', '#f08a24', '#64748b', '#06b6d4'][k % 7], value: all.filter((i) => i.area === a).length })), center: String(all.length), sub: 'insight', size: 140 })}</div>
          <div class="card"><h3>Tata kelola AI</h3><dl class="kv"><dt>Menyetujui pembayaran</dt><dd><span class="badge bad">Tidak pernah</span></dd><dt>Mengubah budget terkunci</dt><dd><span class="badge bad">Tidak pernah</span></dd><dt>Memposting transaksi</dt><dd><span class="badge bad">Tidak pernah</span></dd><dt>Tindak lanjut</dt><dd>Akui / tugaskan / selesai / abaikan (alasan wajib) — tercatat di audit</dd><dt>Lingkup</dt><dd>Spa–Essence; target grup Rp125 M di luar lingkup</dd></dl></div></div></div></div>`;
    },
    actions: {
      area(el, ctx) {
        ctx.L.area = el.value;
        ctx.rerender();
      },
      sev(el, ctx) {
        ctx.L.sev = el.value;
        ctx.rerender();
      },
      done(el, ctx) {
        ctx.L.done = el.checked;
        ctx.rerender();
      },
    },
  };

  /* ---------- NV-58 Division / Supervisor AI Insights ---------- */
  V[58] = {
    render(ctx) {
      const { s, L } = ctx;
      const mine = vh.insightsFor(ctx);
      const cur = L.t || 'OPEN';
      const list = mine.filter((i) => (cur === 'OPEN' ? ['OPEN', 'ACKNOWLEDGE', 'ASSIGN'].includes(i.state.status) : ['DONE', 'DISMISS'].includes(i.state.status)));
      const log = s.audit.filter((a) => a.op === 'insight.act').slice(0, 8);
      return `<div class="stack">${banner()}${ui.tabs('t', [['OPEN', 'Perlu tindakan', mine.filter((i) => ['OPEN', 'ACKNOWLEDGE', 'ASSIGN'].includes(i.state.status)).length], ['CLOSED', 'Selesai / diabaikan']], cur)}
        <div class="grid g-2-1"><div>${list.map((i) => card(i, ctx.can('insight.act'))).join('') || `<div class="card">${ui.empty(cur === 'OPEN' ? 'Tidak ada insight terbuka untuk role & scope Anda.' : 'Belum ada insight yang ditutup.')}</div>`}</div>
        <div class="stack"><div class="card"><h3>Alur kerja insight</h3>${ui.stepper(['Terbuka', 'Diakui', 'Ditugaskan', 'Selesai'], 0)}<p class="small">Insight dikirim ke pemilik sesuai area (Supervisor untuk budget item cabang, Purchasing untuk harga/konsolidasi, Gudang untuk stok, Finance untuk faktur, Asset untuk servis). Mengabaikan butuh alasan.</p></div>
          <div class="card"><h3>Riwayat tindakan</h3>${log.length ? log.map((a) => `<div class="small" style="padding:4px 0"><span class="mono tiny">${esc(a.ref)}</span> · ${esc(a.detail)}<div class="tiny muted">${esc(S.userName(s, a.user))} · ${U.datetime(a.ts)}</div></div>`).join('') : '<p class="small muted">Belum ada tindakan dalam sesi ini.</p>'}</div></div></div></div>`;
    },
  };

  /* ---------- NV-59 7P Productivity, Efficiency & Effectiveness ---------- */
  V[59] = {
    render(ctx) {
      const { s, L } = ctx;
      const bu = L.bu || (ctx.scope.bu && ctx.scope.bu !== 'ALL' && ['BU-SPA', 'BU-ESS'].includes(ctx.scope.bu) ? ctx.scope.bu : 'BU-SPA');
      const b = S.budgetView(s, bu === 'BU-SPA' ? 'BGT-2026-SPA' : 'BGT-2026-ESS');
      const rev = s.actualRevenue[bu];
      const drivers = s.drivers.filter((d) => d.bu === bu);
      const spend = b.lines.filter((l) => l.cls === 'OPEX');
      const fmtD = (d, v) => (d.unit === '%' ? U.pct(v) : d.unit === 'Rp' ? U.rp(v) : U.num(v, 1) + ' ' + d.unit);
      const ach = (d) => (d.lowerBetter ? d.target / d.actual : d.actual / d.target);
      const prod = (l) => (l.actual ? rev / l.actual : 0);
      const brs = bu === 'BU-SPA' ? Object.entries(s.branchRevenue).map(([id, r]) => ({ id, r, cost: b.totals.actual * s.branchShare[id] })) : [];
      const ins = HAWK.AI.insights(s).find((i) => i.id === 'AI-PRD-SPA');
      return `<div class="stack"><div class="card"><div class="row"><select class="inp" style="max-width:220px" data-ch="bu" aria-label="BU"><option value="BU-SPA" ${bu === 'BU-SPA' ? 'selected' : ''}>JAENS Spa</option><option value="BU-ESS" ${bu === 'BU-ESS' ? 'selected' : ''}>JAENS Essence</option></select><span class="small muted">Revenue YTD Jan–Okt ${short(rev)} · DEMO</span><span style="margin-left:auto">${legend()}</span></div></div>
        <div class="grid g7p">${spend.map((l) => `<div class="p7" style="--pc:${ui.pColor(l.p)}"><div class="nm">${esc(HAWK.SEVEN_P.find((p) => p.key === l.p).name)}</div><div class="v">${U.num(prod(l), 1)}×</div><div class="tiny muted">revenue / Rp biaya</div><div class="tiny">${U.pct(l.actual / rev)} dari revenue</div></div>`).join('')}<div class="p7" style="--pc:#22a355"><div class="nm">Profit (hasil)</div><div class="v">${U.pct(b.profit.actual / rev)}</div><div class="tiny muted">margin YTD</div><div class="tiny">${short(b.profit.actual)}</div></div></div>
        <div class="grid g2"><div class="card"><h3>Driver bisnis vs target</h3>${ui.table([{ h: 'Driver', f: (d) => esc(d.name) }, { h: 'Target', num: true, f: (d) => fmtD(d, d.target) }, { h: 'Aktual', num: true, f: (d) => `<b>${fmtD(d, d.actual)}</b>` }, { h: 'Capaian', f: (d) => `<div style="min-width:110px">${ui.bar(Math.min(1, ach(d)), ach(d) >= 1 ? 'ok' : ach(d) >= 0.95 ? 'warn' : 'bad')}<span class="tiny">${U.pct(ach(d))}${d.lowerBetter ? ' (lebih rendah lebih baik)' : ''}</span></div>` }], drivers)}<p class="tiny muted" style="margin:8px 0 0"><span class="kind k-fact">Fakta</span> nilai aktual dari data DEMO · <span class="kind k-metric">Metrik</span> capaian dihitung.</p></div>
        <div class="card"><h3>Efektivitas 7P (revenue per Rp biaya)</h3>${ui.bars({ labels: spend.map((l) => HAWK.SEVEN_P.find((p) => p.key === l.p).name), series: [{ name: 'Revenue / biaya', color: '#c99a2e', values: spend.map((l) => Math.round(prod(l) * 10) / 10) }], h: 190, fmt: (x) => U.num(x, 1) + '×' })}</div></div>
        ${brs.length ? `<div class="card"><h3>Produktivitas per cabang</h3>${ui.table([{ h: 'Cabang', f: (r) => esc(S.orgName(s, r.id)) }, { h: 'Revenue YTD', num: true, f: (r) => U.rp(r.r) }, { h: 'Biaya 7P (alokasi)', num: true, f: (r) => U.rp(r.cost) }, { h: 'Revenue / biaya', num: true, f: (r) => `<b>${U.num(r.r / r.cost, 2)}×</b>` }, { h: 'Kontribusi', f: (r) => `<div style="min-width:110px">${ui.bar(r.r / rev, 'ok')}<span class="tiny">${U.pct(r.r / rev)}</span></div>` }], brs)}<p class="tiny muted" style="margin:8px 0 0"><span class="kind k-metric">Metrik</span> biaya cabang = aktual BU × porsi alokasi cabang (DEMO), bukan biaya langsung terverifikasi.</p></div>` : ''}
        ${ins ? `<div class="card"><h3>${ui.icon('ai', 16)} ${esc(ins.title)}</h3>${ins.statements.map((x) => `<div class="stmt"><span class="kind ${HAWK.AI.KIND[x.kind].cls}">${HAWK.AI.KIND[x.kind].label}</span><span class="small">${esc(x.text)}</span></div>`).join('')}<button class="btn sm ghost" data-ins-open="${ins.id}" style="margin-top:6px">Bukti</button> <button class="btn sm ghost" data-nav="23">Budget vs Actual</button></div>` : ''}</div>`;
    },
    actions: {
      bu(el, ctx) {
        ctx.L.bu = el.value;
        ctx.rerender();
      },
    },
  };

  /* ---------- NV-60 AI Scenario Forecast & Evidence ---------- */
  V[60] = {
    render(ctx) {
      const { s, L } = ctx;
      const d = L.d || { guests: 0, price: 0, cost: 0, branches: 0 };
      L.d = d;
      const base = HAWK.AI.scenario(s, { guests: 0, price: 0, cost: 0, branches: 0 });
      const r = HAWK.AI.scenario(s, d);
      const slider = (k, label, min, max, unit) => `<div class="field"><label>${label}: <b id="sv-${k}">${d[k] > 0 && unit === '%' ? '+' : ''}${d[k]}${unit}</b></label><input type="range" min="${min}" max="${max}" step="1" value="${d[k]}" data-in="sl" data-k="${k}" aria-label="${label}"></div>`;
      return `<div class="stack">${banner()}
        <div class="grid g-1-2"><div class="card"><h3>Asumsi skenario (12 bulan ke depan)</h3>${slider('guests', 'Volume tamu / unit terjual', -20, 30, '%')}${slider('price', 'Harga rata-rata', -10, 20, '%')}${slider('cost', 'Biaya per unit', -10, 25, '%')}${slider('branches', 'Cabang Spa baru', 0, 3, '')}
          <div class="row" style="margin-top:10px"><button class="btn" data-a="calc">Hitung ulang</button><button class="btn ghost" data-a="reset">Reset ke baseline</button></div>
          <p class="tiny muted">Baseline = run-rate revenue YTD × pola musiman, rasio biaya dari forecast budget 7P FY2026. Cabang baru: ramp-up 6 bulan, biaya tetap Rp35 jt/bulan, capex Rp2,5 M/cabang (asumsi DEMO). <span class="mono">ai.scenario</span> ${ui.intBadge('UI-ONLY SIMULATION')}</p></div>
        <div class="stack"><div class="grid g4 keep2">${ui.kpi('Revenue 12 bln', short(r.revenue), 'baseline ' + short(base.revenue), 'g-teal', 'finance')}${ui.kpi('Profit 12 bln', short(r.profit), (r.profit >= base.profit ? '+' : '') + short(r.profit - base.profit) + ' vs baseline', 'g-gold', 'ai')}${ui.kpi('Margin', U.pct(r.margin), 'baseline ' + U.pct(base.margin), 'g-blue', 'budget')}${ui.kpi('Capex tambahan', short(r.capex), 'perlu proposal NV-13', 'g-violet', 'asset')}</div>
          <div class="card"><h3>Proyeksi bulanan (Rp jt) <span class="kind k-forecast">Estimasi / forecast</span></h3>${ui.line({ labels: r.rows.map((x) => x.m), series: [{ name: 'Revenue skenario', color: '#0f9d8a', values: r.rows.map((x) => Math.round(x.revenue / 1e6)) }, { name: 'Revenue baseline', color: '#bbb', values: base.rows.map((x) => Math.round(x.revenue / 1e6)) }, { name: 'Profit skenario', color: '#c99a2e', values: r.rows.map((x) => Math.round(x.profit / 1e6)) }], h: 220 })}</div></div></div>
        <div class="card"><h3>Pernyataan & bukti</h3>
          <div class="stmt"><span class="kind k-fact">Fakta terverifikasi</span><span class="small">Revenue YTD Jan–Okt 2026: Spa ${short(s.actualRevenue['BU-SPA'])}, Essence ${short(s.actualRevenue['BU-ESS'])} (DEMO).</span></div>
          <div class="stmt"><span class="kind k-metric">Metrik terhitung</span><span class="small">Rasio biaya terhadap revenue dari forecast budget 7P: ${U.pct((S.budgetView(s, 'BGT-2026-SPA').totals.forecast + S.budgetView(s, 'BGT-2026-ESS').totals.forecast) / (s.targets[0].revenue + s.targets[1].revenue))}.</span></div>
          <div class="stmt"><span class="kind k-forecast">Estimasi / forecast</span><span class="small">Dengan asumsi di atas, profit 12 bulan ±${short(r.profit)} (margin ${U.pct(r.margin)}). Bukan target dan bukan data JAENS aktual.</span></div>
          <div class="stmt"><span class="kind k-hypo">Hipotesis AI</span><span class="small">${d.cost > d.price ? 'Kenaikan biaya melebihi kenaikan harga menekan margin — cek harga supplier (NV-34).' : d.branches ? 'Cabang baru menambah revenue setelah ramp-up, tetapi menekan margin di 6 bulan pertama.' : 'Margin relatif stabil pada asumsi ini.'}</span></div>
          <div class="stmt"><span class="kind k-rec">Rekomendasi — perlu persetujuan manusia</span><span class="small">${d.branches ? 'Siapkan proposal investasi (NV-13) dan revisi target (NV-10) — keputusan di Owner.' : 'Gunakan skenario sebagai masukan revisi budget kuartalan (NV-22); tidak ada perubahan otomatis.'}</span></div>
          <p class="tiny muted" style="margin:8px 0 0">Bukti: <button class="link" data-nav="10">Target NV-10</button> · <button class="link" data-nav="23">BvA NV-23</button> · <button class="link" data-nav="59">Driver NV-59</button>. Target grup Rp125 M tidak dipakai (di luar lingkup Spa–Essence).</p></div></div>`;
    },
    actions: {
      sl(el, ctx) {
        ctx.L.d[el.dataset.k] = +el.value;
        const lab = document.getElementById('sv-' + el.dataset.k);
        if (lab) lab.textContent = (el.dataset.k !== 'branches' && +el.value > 0 ? '+' : '') + el.value + (el.dataset.k === 'branches' ? '' : '%');
      },
      calc(el, ctx) {
        ctx.rerender();
        ui.toast('Skenario dihitung ulang', 'ok', 'ai.scenario · UI-ONLY SIMULATION · tidak ada data disimpan');
      },
      reset(el, ctx) {
        ctx.L.d = { guests: 0, price: 0, cost: 0, branches: 0 };
        ctx.rerender();
      },
    },
  };
})();
