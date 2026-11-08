/* Module C — Strategic Target & Ambidex (NV-10..14). DEMO targets for JAENS Spa & Essence only.
   The Rp125 B group valuation target is OUT of the operational Spa–Essence scope and is never summed here. */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const esc = U.esc;
  const V = HAWK.views;
  const short = (v) => U.rp(v, { short: true });
  const scopeNote = () => `<div class="alert info">${ui.icon('alert', 16)}<span>Target grup & valuasi JAENS Enterprises (Rp125 M) berada <b>di luar</b> lingkup operasional Spa–Essence dan tidak dijumlahkan ke target, budget, atau AI di aplikasi ini. Semua angka target adalah DEMO.</span></div>`;

  /* ---------- NV-10 Annual Target Planning ---------- */
  V[10] = {
    render(ctx) {
      const { s, L } = ctx;
      const fy = +(L.fy || 2027);
      const list = s.targets.filter((t) => t.fy === fy);
      const prev = (bu) => s.targets.find((t) => t.fy === fy - 1 && t.bu === bu);
      const editable = (t) => ['DRAFT', 'REVISION'].includes(t.status) && ctx.can('target.save');
      return `<div class="stack">${scopeNote()}${ui.tabs('fy', [['2026', 'FY2026 (berjalan)'], ['2027', 'FY2027 (perencanaan)']], String(fy))}
        <div class="grid g2">${list.map((t) => {
          const pv = prev(t.bu);
          const act = s.actualRevenue[t.bu];
          return `<div class="card"><div class="card-head"><h3>${esc(S.orgName(s, t.bu))} · FY${t.fy}</h3><span class="r">${ui.status(t.status)}</span></div>
            <div class="grid g2"><div class="field"><label>Target revenue (Rp)</label>${editable(t) ? `<input class="inp" type="number" id="tg-r-${t.id}" value="${t.revenue}">` : `<b style="font-size:20px">${short(t.revenue)}</b>`}</div><div class="field"><label>Target profit (Rp)</label>${editable(t) ? `<input class="inp" type="number" id="tg-p-${t.id}" value="${t.profit}">` : `<b style="font-size:20px">${short(t.profit)}</b>`}</div></div>
            <dl class="kv" style="margin-top:10px"><dt>Margin target</dt><dd>${U.pct(t.profit / t.revenue)}</dd>${pv ? `<dt>Pertumbuhan vs FY${fy - 1}</dt><dd>${U.pct(t.revenue / pv.revenue - 1, 1)} revenue · ${U.pct(t.profit / pv.profit - 1, 1)} profit</dd>` : ''}${fy === 2026 && act ? `<dt>Realisasi YTD (Jan–Okt)</dt><dd>${short(act)} · ${U.pct(act / t.revenue)}</dd>` : ''}<dt>Budget terkait</dt><dd>${(s.budgets.filter((b) => b.fy === t.fy && b.bu === t.bu).map((b) => `<button class="link" data-nav="15" data-q='${esc(JSON.stringify({ b: b.id }))}'>${b.id}</button>`).join(' ')) || '—'}</dd></dl>
            ${fy === 2026 && act ? ui.bar(act / t.revenue, act / t.revenue >= 10 / 12 ? 'ok' : 'warn') : ''}
            <div class="row" style="justify-content:flex-end;margin-top:10px">${editable(t) ? `<button class="btn ghost sm" data-a="save" data-p="${t.id}">Simpan</button>` : ''}${t.status === 'DRAFT' && ctx.can('target.submit') ? `<button class="btn sm" data-a="submit" data-p="${t.id}">Ajukan ke Owner</button>` : ''}${t.status === 'SUBMITTED' && ctx.can('target.approve') ? `<button class="btn sm bad" data-a="rej" data-p="${t.id}">Kembalikan</button><button class="btn sm ok" data-a="ok" data-p="${t.id}">Setujui</button>` : ''}${t.status === 'SUBMITTED' && !ctx.can('target.approve') ? '<span class="badge warn">Menunggu Owner</span>' : ''}</div></div>`;
        }).join('')}</div>
        <div class="card"><h3>Ringkasan Spa + Essence FY${fy}</h3><div class="grid g3"><div class="p7" style="--pc:#0f9d8a"><div class="nm">Revenue</div><div class="v">${short(U.sum(list, (t) => t.revenue))}</div></div><div class="p7" style="--pc:#22a355"><div class="nm">Profit (P7 — hasil)</div><div class="v">${short(U.sum(list, (t) => t.profit))}</div></div><div class="p7" style="--pc:#c99a2e"><div class="nm">Margin</div><div class="v">${U.pct(U.sum(list, (t) => t.profit) / U.sum(list, (t) => t.revenue))}</div></div></div><p class="tiny muted" style="margin:8px 0 0">Target turun ke driver (NV-11) dan budget 7P (NV-15). Validasi: profit &lt; revenue; target yang disetujui hanya berubah lewat revisi. <span class="mono">target.*</span> ${ui.intBadge('NEW INTEGRATION REQUIRED')}</p></div></div>`;
    },
    actions: {
      save(el, ctx) {
        const id = el.dataset.p;
        ctx.act('target.save', { id, revenue: +ctx.val('tg-r-' + id), profit: +ctx.val('tg-p-' + id) }, 'Target disimpan');
      },
      submit(el, ctx) {
        const id = el.dataset.p;
        const t = ctx.s.targets.find((x) => x.id === id);
        if (document.getElementById('tg-r-' + id)) {
          const r = HAWK.api.call('target.save', { id, revenue: +ctx.val('tg-r-' + id), profit: +ctx.val('tg-p-' + id) }, ctx.user);
          if (!r.ok) return ui.toast(r.error.message, 'bad', 'target.save · ' + r.error.code);
        }
        ctx.act('target.submit', { id: t.id }, 'Target diajukan ke Owner');
      },
      ok(el, ctx) {
        ctx.act('target.approve', { id: el.dataset.p, decision: 'APPROVE' }, 'Target disetujui');
      },
      rej(el, ctx) {
        ctx.act('target.approve', { id: el.dataset.p, decision: 'REJECT' }, 'Target dikembalikan ke draft');
      },
    },
  };

  /* ---------- NV-11 BU Business Driver Tree & KPI ---------- */
  V[11] = {
    render(ctx) {
      const { s, L } = ctx;
      const bu = L.bu || 'BU-SPA';
      const t = s.targets.find((x) => x.fy === 2026 && x.bu === bu);
      const d = s.drivers.filter((x) => x.bu === bu);
      const fmt = (x, v) => (x.unit === '%' ? U.pct(v) : x.unit === 'Rp' ? U.rp(v) : U.num(v, 1) + ' ' + x.unit);
      const ach = (x) => (x.lowerBetter ? x.target / x.actual : x.actual / x.target);
      const box = (x) => `<div class="p7" style="--pc:${ach(x) >= 1 ? '#22a355' : ach(x) >= 0.95 ? '#f08a24' : '#d14343'}"><div class="nm">${esc(x.name)}</div><div class="v" style="font-size:15px">${fmt(x, x.actual)}</div><div class="tiny muted">target ${fmt(x, x.target)} · ${U.pct(ach(x))}</div></div>`;
      const tree = bu === 'BU-SPA'
        ? `<div class="tree"><ul><li><span class="node"><b>Revenue Spa</b> ${short(t.revenue)} target</span><ul><li><span class="node">× Jumlah tamu</span><ul><li>${box(d[0])}</li><li>${box(d[2])}</li><li>${box(d[4])}</li></ul></li><li><span class="node">× Rata-rata nilai transaksi</span><ul><li>${box(d[1])}</li></ul></li></ul></li><li><span class="node"><b>Biaya Product (7P)</b></span><ul><li>${box(d[3])}</li></ul></li></ul></div>`
        : `<div class="tree"><ul><li><span class="node"><b>Revenue Essence</b> ${short(t.revenue)} target</span><ul><li>${box(d[0])}</li><li>${box(d[1])}</li></ul></li><li><span class="node"><b>Biaya Product (7P)</b></span><ul><li>${box(d[2])}</li></ul></li></ul></div>`;
      return `<div class="stack"><div class="card"><div class="row"><select class="inp" style="max-width:220px" data-ch="bu" aria-label="BU"><option value="BU-SPA" ${bu === 'BU-SPA' ? 'selected' : ''}>JAENS Spa</option><option value="BU-ESS" ${bu === 'BU-ESS' ? 'selected' : ''}>JAENS Essence</option></select><span class="small muted">Driver bulanan rata-rata 2026 · DEMO</span><button class="btn sm ghost" style="margin-left:auto" data-nav="59">Analitik 7P (NV-59)</button></div></div>
        <div class="grid g-2-1"><div class="card"><h3>Pohon driver</h3>${tree}</div><div class="card"><h3>KPI target</h3>${ui.table([{ h: 'Driver', f: (x) => esc(x.name) }, { h: 'Target', num: true, f: (x) => fmt(x, x.target) }, { h: 'Aktual', num: true, f: (x) => fmt(x, x.actual) }, { h: '', f: (x) => `<span class="badge ${ach(x) >= 1 ? 'ok' : ach(x) >= 0.95 ? 'warn' : 'bad'}">${U.pct(ach(x))}</span>` }], d)}<p class="tiny muted" style="margin:8px 0 0">Driver menghubungkan target revenue/profit ke perilaku operasional yang dapat dipengaruhi supervisor & head of division.</p></div></div></div>`;
    },
    actions: {
      bu(el, ctx) {
        ctx.L.bu = el.value;
        ctx.rerender();
      },
    },
  };

  /* ---------- NV-12 Operational vs Innovation Portfolio ---------- */
  V[12] = {
    render(ctx) {
      const { s } = ctx;
      const pr = s.projects.filter((p) => p.status !== 'REJECTED');
      const tot = (type) => U.sum(pr.filter((p) => p.type === type), (p) => p.capex + p.opex);
      const all = tot('OPERATIONAL') + tot('INNOVATION') || 1;
      const col = (type) => `<div class="card"><div class="card-head"><h3>${type === 'OPERATIONAL' ? 'Operational — exploit' : 'Innovation — explore'}</h3><span class="r"><span class="badge ${type === 'OPERATIONAL' ? 'info' : 'violet'}">${U.pct(tot(type) / all)}</span></span></div>${pr.filter((p) => p.type === type).map((p) => `<div class="itemcard" style="margin-bottom:8px"><div style="flex:1">${ui.id(p.id)} <b class="small">${esc(p.name)}</b><div class="tiny muted">${esc(S.orgName(s, p.bu))} · capex ${short(p.capex)} · opex ${short(p.opex)}${p.irr ? ' · IRR ' + U.pct(p.irr) : ''}${p.payback ? ' · payback ' + p.payback + ' bln' : ''}</div></div>${ui.status(p.status)}</div>`).join('') || ui.empty('—')}</div>`;
      return `<div class="stack"><div class="grid g4 keep2">${ui.kpi('Portofolio aktif', pr.length, 'proyek', 'g-gold', 'target')}${ui.kpi('Operational', short(tot('OPERATIONAL')), 'capex + opex', 'g-blue', 'home')}${ui.kpi('Innovation', short(tot('INNOVATION')), 'capex + opex', 'g-violet', 'ai')}${ui.kpi('Rasio Innovation', U.pct(tot('INNOVATION') / all), 'acuan DEMO 20–35%', '', 'budget')}</div>
        <div class="grid g2">${col('OPERATIONAL')}${col('INNOVATION')}</div>
        <div class="card"><h3>Keseimbangan ambidextrous</h3><div class="segbar" style="height:14px"><i style="width:${(tot('OPERATIONAL') / all) * 100}%;background:#2f6fde"></i><i style="width:${(tot('INNOVATION') / all) * 100}%;background:#8b5cf6"></i></div><p class="tiny muted" style="margin:8px 0 0">Stream Operational/Innovation juga dicatat per baris budget (NV-19). Klik ID proyek untuk detail; usulan baru di NV-13, keputusan di NV-14.</p></div></div>`;
    },
  };

  /* ---------- NV-13 Strategic Project & Investment Proposal ---------- */
  V[13] = {
    render(ctx) {
      const { s } = ctx;
      const mine = s.projects.filter((p) => p.status === 'PROPOSED' || p.owner === ctx.user.id);
      return `<div class="grid g-1-2"><div class="card"><h3>${ui.icon('plus', 16)} Usulan proyek / investasi</h3>${ctx.can('project.propose') ? `<div class="stack"><div class="field"><label>Nama proyek *</label><input class="inp" id="pj-name" placeholder="Contoh: Spa Canggu — cabang baru"></div>
        <div class="grid g2"><div class="field"><label>BU</label><select class="inp" id="pj-bu">${S.bus(s).filter((b) => b.type === 'BU').map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></div><div class="field"><label>Tipe</label><select class="inp" id="pj-type"><option value="OPERATIONAL">Operational</option><option value="INNOVATION">Innovation</option></select></div></div>
        <div class="grid g2"><div class="field"><label>Capex (Rp) *</label><input class="inp" type="number" id="pj-capex" value="250000000"></div><div class="field"><label>Opex tahunan (Rp)</label><input class="inp" type="number" id="pj-opex" value="30000000"></div></div>
        <div class="grid g2"><div class="field"><label>Payback (bulan)</label><input class="inp" type="number" id="pj-pb" value="24"></div><div class="field"><label>IRR (mis. 0,2)</label><input class="inp" type="number" step="0.01" id="pj-irr" value="0.2"></div></div>
        <button class="btn block" data-a="propose">Ajukan ke Owner</button><p class="tiny muted">Rantai AR-12: BU Manager → Owner. Proyek disetujui → CAPEX masuk budget FY berikut & kapitalisasi di NV-56.</p></div>` : '<p class="small muted">Role ini tidak dapat mengajukan proyek.</p>'}</div>
        <div class="card"><h3>Usulan & proyek saya</h3>${ui.table([{ h: 'Proyek', f: (p) => `${ui.id(p.id)} <b class="small">${esc(p.name)}</b>` }, { h: 'Tipe', f: (p) => (p.type === 'INNOVATION' ? '<span class="badge violet">Innovation</span>' : '<span class="badge info">Operational</span>') }, { h: 'Capex', num: true, f: (p) => short(p.capex) }, { h: 'IRR', num: true, f: (p) => (p.irr ? U.pct(p.irr) : '—') }, { h: 'Status', f: (p) => ui.status(p.status) }], mine, { empty: 'Belum ada usulan.' })}<p class="tiny muted" style="margin:8px 0 0">IRR & payback adalah input pengusul (estimasi) — bukan hasil AI. <span class="mono">project.propose</span> ${ui.intBadge('NEW INTEGRATION REQUIRED')}</p></div></div>`;
    },
    actions: {
      propose(el, ctx) {
        ctx.act('project.propose', { name: ctx.val('pj-name').trim(), bu: ctx.val('pj-bu'), type: ctx.val('pj-type'), capex: +ctx.val('pj-capex'), opex: +ctx.val('pj-opex'), payback: +ctx.val('pj-pb'), irr: +ctx.val('pj-irr') }, (p) => `${p.id} diajukan — menunggu keputusan Owner (NV-14)`);
      },
    },
  };

  /* ---------- NV-14 Investment Approval, Milestone & Progress ---------- */
  V[14] = {
    render(ctx) {
      const { s, L } = ctx;
      const props = s.projects.filter((p) => p.status === 'PROPOSED');
      const run = s.projects.filter((p) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status));
      L.pg = L.pg || {};
      return `<div class="stack"><div class="card"><h3>Menunggu keputusan investasi (${props.length})</h3>${ui.table([{ h: 'Proyek', f: (p) => `${ui.id(p.id)} <b class="small">${esc(p.name)}</b><div class="tiny muted">${esc(S.orgName(s, p.bu))} · diajukan ${esc(S.userName(s, p.owner))}</div>` }, { h: 'Capex', num: true, f: (p) => U.rp(p.capex) }, { h: 'Opex / thn', num: true, f: (p) => U.rp(p.opex) }, { h: 'Payback', num: true, f: (p) => (p.payback ? p.payback + ' bln' : '—') }, { h: 'IRR', num: true, f: (p) => (p.irr ? U.pct(p.irr) : '—') }, { h: '', f: (p) => (ctx.can('project.decide') ? `<button class="btn sm bad" data-a="no" data-p="${p.id}">Tolak</button> <button class="btn sm ok" data-a="yes" data-p="${p.id}">Setujui</button>` : '<span class="badge warn">Menunggu Owner</span>') }], props, { empty: 'Tidak ada usulan menunggu.' })}</div>
        ${run.map((p) => `<div class="card"><div class="card-head"><h3>${ui.id(p.id)} ${esc(p.name)}</h3><span class="r">${ui.status(p.status)}</span></div>${ui.stepper(['Diusulkan', 'Disetujui', 'Berjalan', 'Selesai'], { APPROVED: 1, IN_PROGRESS: 2, COMPLETED: 4 }[p.status])}
          ${ui.table([{ h: 'Milestone', f: (m) => esc(m.name) }, { h: 'Due', f: (m) => U.date(m.due) }, { h: 'Progres', f: (m, i) => (ctx.can('project.milestone') && p.status !== 'COMPLETED' ? `<div class="row" style="flex-wrap:nowrap"><input type="range" min="0" max="100" step="5" value="${Math.round(m.progress * 100)}" data-in="pg" data-k="${p.id}|${i}" aria-label="Progres"><span class="small" id="pgv-${p.id}-${i}">${Math.round(m.progress * 100)}%</span></div>` : `<div style="min-width:120px">${ui.bar(m.progress, m.status === 'AT_RISK' ? 'bad' : 'ok')}</div>`) }, { h: 'Status', f: (m) => ui.status(m.status) }, { h: '', f: (m, i) => (ctx.can('project.milestone') && p.status !== 'COMPLETED' ? `<button class="btn sm ghost" data-a="ms" data-p="${p.id}" data-i="${i}">Simpan</button>` : '') }], p.milestones)}
          <p class="tiny muted" style="margin:8px 0 0">Capex ${U.rp(p.capex)} → saat selesai dikapitalisasi sebagai aset (NV-56)${p.status === 'COMPLETED' ? ' · ' + s.assets.filter((a) => a.source === p.id).map((a) => ui.id(a.id)).join(' ') : ''}.</p></div>`).join('')}</div>`;
    },
    actions: {
      yes(el, ctx) {
        ctx.act('project.decide', { id: el.dataset.p, decision: 'APPROVE' }, 'Investasi disetujui — milestone awal dibuat');
      },
      no(el, ctx) {
        ctx.act('project.decide', { id: el.dataset.p, decision: 'REJECT' }, 'Investasi ditolak');
      },
      pg(el, ctx) {
        ctx.L.pg[el.dataset.k] = +el.value;
        const [pid, i] = el.dataset.k.split('|');
        const lab = document.getElementById(`pgv-${pid}-${i}`);
        if (lab) lab.textContent = el.value + '%';
      },
      ms(el, ctx) {
        const k = el.dataset.p + '|' + el.dataset.i;
        const p = ctx.s.projects.find((x) => x.id === el.dataset.p);
        const v = ctx.L.pg[k] !== undefined ? ctx.L.pg[k] : p.milestones[+el.dataset.i].progress * 100;
        ctx.act('project.milestone', { id: el.dataset.p, index: +el.dataset.i, progress: v / 100 }, 'Progres milestone diperbarui');
      },
    },
  };
})();
