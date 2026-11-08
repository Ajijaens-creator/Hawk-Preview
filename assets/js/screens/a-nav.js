/* Module A — Navigation & Role Workspace (NV-01..04) + shared view helpers */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const esc = U.esc;
  const V = HAWK.views;

  /* ---------- shared view helpers ---------- */
  const vh = (HAWK.vh = {});
  vh.thumb = (it) => ({ 'BHP Treatment': '🧴', Linen: '🧺', Kebersihan: '🧼', Promosi: '📰', 'Suku Cadang': '🔧', 'Bahan Baku Essence': '🥥' }[it.cat] || '📦');
  vh.mrfItems = (s, m) => m.lines.map((l) => `${esc(S.itemName(s, l.item))} × ${l.qty}`).join(', ');
  vh.fulfillBar = (s, m) => {
    const f = S.mrfFulfillment(s, m);
    if (!f.allocated) return '<span class="tiny muted">—</span>';
    const w = (x) => (x / f.requested) * 100;
    return `<div title="Lokal ${f.LOCAL.issued}/${f.LOCAL.qty} · Transfer ${f.TRANSFER.issued}/${f.TRANSFER.qty} · Beli ${f.PURCHASE.issued}/${f.PURCHASE.qty}"><div class="segbar"><i style="width:${w(f.LOCAL.issued)}%;background:var(--p-people)"></i><i style="width:${w(f.TRANSFER.issued)}%;background:var(--p-process)"></i><i style="width:${w(f.PURCHASE.issued)}%;background:var(--p-promotion)"></i></div><div class="tiny muted" style="margin-top:3px">${f.issued}/${f.requested} diserahkan</div></div>`;
  };
  vh.chain = (s, chain, approvals, status) =>
    `<div class="row" style="gap:6px">${chain
      .map((r, i) => {
        const done = (approvals || [])[i];
        const cur = !done && i === (approvals || []).length && ['SUBMITTED', 'ESCALATED', 'PENDING_APPROVAL'].includes(status);
        return `${i ? '<span class="muted">→</span>' : ''}<span class="badge ${done ? 'ok' : cur ? 'warn' : ''}">${done ? '✓ ' : cur ? '● ' : ''}${esc(HAWK.ROLE_LABEL[r])}</span>`;
      })
      .join('')}</div>`;
  vh.mrfsForCtx = (ctx) => {
    const s = ctx.s;
    if (ctx.role === 'STAFF') return s.mrfs.filter((m) => m.requester === ctx.user.id);
    return s.mrfs.filter((m) => ctx.inScope(m.branch));
  };
  vh.aiMini = (list, n = 3) =>
    list.length
      ? list
          .slice(0, n)
          .map((i) => `<div class="ai-card" data-ins-open="${i.id}" role="button" tabindex="0" style="margin-bottom:8px"><div class="row" style="gap:6px"><span class="sev ${i.severity}"></span><span class="t">${esc(i.title)}</span></div><div class="tiny muted" style="margin-top:4px">${esc(i.area)} · ${U.date(i.asOf)} · pemilik: ${esc(HAWK.ROLE_LABEL[i.owner])}</div></div>`)
          .join('')
      : '<p class="small muted">Tidak ada insight untuk scope ini.</p>';
  vh.insightsFor = (ctx) => {
    const all = HAWK.AI.insights(ctx.s);
    if (['OWNER', 'BU_MANAGER'].includes(ctx.role)) return all;
    if (ctx.role === 'HEAD_DIV') return all.filter((i) => ['BU_MANAGER', 'SUPERVISOR'].includes(i.owner));
    return all.filter((i) => i.owner === ctx.role);
  };
  vh.months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  /* ---------- NV-01 Role-Based Dashboard ---------- */
  V[1] = {
    render(ctx) {
      const { s, user, role } = ctx;
      const tasks = HAWK.tasks(s, user);
      const ins = vh.insightsFor(ctx);
      const hour = 'Selamat pagi';
      const hero = `<div class="hero"><h2>${hour}, ${esc(user.name.split(' ')[0])}</h2><p>${esc(HAWK.ROLE_LABEL[role])}${user.title && user.title !== HAWK.ROLE_LABEL[role] ? " · " + esc(user.title) : ""} · ${tasks.length} tugas menunggu · ${ins.length} insight AI</p>
        <div class="row" style="margin-top:14px">${quick(role)}</div>
        <svg class="scene" viewBox="0 0 300 160" preserveAspectRatio="xMaxYMax meet"><g fill="none" stroke="#e5c66a" stroke-width="1.4" opacity=".9"><path d="M210 150V80l20-14 20 14v70M200 80h60M205 66h50M215 55h30M225 44h10M230 30v14"/><path d="M40 150c30-40 70-60 110-55s60 20 90 55"/><circle cx="70" cy="40" r="14"/></g></svg></div>`;
      let kpis = '';
      if (['OWNER', 'BU_MANAGER', 'HEAD_DIV', 'FINANCE'].includes(role)) {
        const spa = S.budgetView(s, 'BGT-2026-SPA');
        const ess = S.budgetView(s, 'BGT-2026-ESS');
        const rev = s.actualRevenue['BU-SPA'] + s.actualRevenue['BU-ESS'];
        const prof = spa.profit.actual + ess.profit.actual;
        const util = (spa.totals.actual + spa.totals.commitment + ess.totals.actual + ess.totals.commitment) / (spa.totals.revised + ess.totals.revised);
        kpis = `<div class="grid g4 keep2">${ui.kpi('Revenue YTD (Spa + Essence)', U.rp(rev, { short: true }), 'vs target ' + U.rp(s.targets[0].revenue + s.targets[1].revenue, { short: true }) + ' · DEMO', 'g-teal', 'finance')}${ui.kpi('Profit YTD', U.rp(prof, { short: true }), 'Profit = hasil, bukan belanja · DEMO', 'g-violet', 'target')}${ui.kpi('Utilisasi budget (aktual+komitmen)', U.pct(util, 1), 'OPEX & CAPEX FY2026', 'g-blue', 'budget')}${ui.kpi('Tugas menunggu Anda', tasks.length, 'Klik ikon kotak masuk', 'g-gold', 'inbox')}</div>`;
      } else {
        const mine = vh.mrfsForCtx(ctx);
        kpis = `<div class="grid g4 keep2">${ui.kpi('Tugas saya', tasks.length, 'NV-02', 'g-gold', 'inbox')}${ui.kpi('MRF menunggu', mine.filter((m) => ['SUBMITTED', 'ESCALATED'].includes(m.status)).length, 'Scope Anda', '', 'mrf')}${ui.kpi('MRF dalam pemenuhan', mine.filter((m) => m.status === 'IN_FULFILLMENT').length, 'Lokal / transfer / beli', '', 'truck')}${ui.kpi('Insight AI', ins.length, 'Sesuai role', '', 'ai')}</div>`;
      }
      const trend = ['OWNER', 'BU_MANAGER', 'HEAD_DIV', 'FINANCE'].includes(role)
        ? (() => {
            const spa = s.actualRevenue['BU-SPA'] / 10;
            const ess = s.actualRevenue['BU-ESS'] / 10;
            const seas = s.season.slice(0, 10).map((x) => x / 0.0825);
            return `<div class="card"><div class="card-head"><h3>Tren revenue 2026 (Spa & Essence) ${ui.demo('DEMO')}</h3></div>${ui.line({ labels: vh.months.slice(0, 10), series: [{ name: 'JAENS Spa', color: '#c99a2e', values: seas.map((x) => spa * x) }, { name: 'JAENS Essence', color: '#8b5cf6', values: seas.map((x) => ess * x * 0.97) }], fmt: (v) => U.num(v / 1e9, 1) + 'M' })}</div>`;
          })()
        : `<div class="card"><h3>Tugas terbaru</h3>${taskList(ctx, tasks.slice(0, 6))}</div>`;
      const p7 = (() => {
        const b = S.budgetView(s, 'BGT-2026-SPA');
        const items = s.sevenP.filter((p) => !p.outcome).map((p) => {
          const ls = b.lines.filter((l) => l.p === p.key && l.cls !== 'OUTCOME');
          return { label: p.name, color: p.color, value: U.sum(ls, (l) => l.actual), r: U.sum(ls, (l) => l.actual + l.commitment) / U.sum(ls, (l) => l.revised) };
        });
        const tot = (b.totals.actual + b.totals.commitment) / b.totals.revised;
        return `<div class="card"><div class="card-head"><h3>Realisasi 7P JAENS Spa</h3><span class="r"><button class="link small" data-nav="23">Detail →</button></span></div>${ui.donut({ items, center: U.pct(tot, 1), sub: 'realisasi' })}</div>`;
      })();
      const aiCard = `<div class="card ai"><div class="card-head"><h3>${ui.icon('ai', 16)} AI Insight <span class="sub">${ins.length} temuan</span></h3><span class="r"><span class="ai-tag">SIMULASI</span></span></div>${vh.aiMini(ins, 4)}<button class="link small" data-nav="${['OWNER', 'BU_MANAGER', 'FINANCE', 'HEAD_DIV'].includes(role) ? 57 : 58}">Lihat semua insight →</button></div>`;
      const units = ['OWNER', 'BU_MANAGER', 'HEAD_DIV'].includes(role)
        ? `<div class="card"><h3>Kinerja unit bisnis ${ui.demo('DEMO')}</h3><div class="grid g5 keep2">${S.branches(s)
            .map((b) => {
              const rev = s.branchRevenue[b.id] || 0;
              const tgt = s.targets[0].revenue * (s.branchShare[b.id] || 0.1) * (10 / 12);
              return `<div class="p7" style="--pc:#c99a2e"><div class="nm">${esc(b.name)}</div><div class="v">${U.rp(rev, { short: true })}</div><div class="tiny ${rev >= tgt ? 'ok-t' : 'warn-t'}">${U.pct(rev / (tgt || 1))} dari target YTD</div></div>`;
            })
            .join('')}<div class="p7" style="--pc:#8b5cf6"><div class="nm">JAENS Essence</div><div class="v">${U.rp(s.actualRevenue['BU-ESS'], { short: true })}</div><div class="tiny warn-t">${U.pct(s.actualRevenue['BU-ESS'] / (s.targets[1].revenue * 10 / 12))} dari target YTD</div></div></div><p class="tiny muted" style="margin:8px 0 0">Cabang dibaca dinamis dari struktur organisasi (NV-05) — cabang baru otomatis tampil.</p></div>`
        : '';
      return `<div class="stack">${hero}${kpis}<div class="grid g-2-1">${trend}${aiCard}</div><div class="grid g2">${p7}<div class="card"><h3>Tugas & approval</h3>${taskList(ctx, tasks.slice(0, 6))}</div></div>${units}</div>`;
    },
  };
  function quick(role) {
    const q = {
      STAFF: [[48, '📷 Scan Nota'], [26, 'Buat MRF'], [25, 'Scan barcode'], [27, 'Status permintaan']],
      SUPERVISOR: [[29, 'Antrean approval'], [48, '📷 Scan Nota & approval'], [30, 'Dampak budget'], [26, 'Buat MRF']],
      PURCHASING: [[32, 'Konsolidasi MRF'], [36, 'PO register'], [37, 'Pembelian darurat']],
      WAREHOUSE: [[41, 'Antrean penerimaan'], [43, 'Put-away'], [45, 'Serahkan stok']],
      FINANCE: [[48, 'Smart Spend & faktur AI'], [49, 'Three-way match'], [50, 'AP & pembayaran']],
      ASSET: [[55, 'Maintenance & WO'], [53, 'Register aset']],
      ADMIN: [[6, 'Kelola unit'], [8, 'Pengguna & role'], [9, 'Matriks approval']],
    }[role] || [[2, 'Tugas & approval'], [23, 'Budget vs Actual'], [57, 'AI Intelligence']];
    return q.map(([nv, l]) => `<button class="btn sm" data-nav="${nv}">${esc(l)}</button>`).join('');
  }
  function taskList(ctx, tasks) {
    if (!tasks.length) return '<p class="small muted">Tidak ada tugas. 🎉</p>';
    return tasks
      .map((t) => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line-2);flex-wrap:nowrap"><span class="badge gold">${esc(t.type)}</span><div style="min-width:0;flex:1"><div class="small" style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.title)}</div><div class="tiny muted">${t.ref.includes(',') ? esc(t.ref) : ui.id(t.ref)} · ${esc(t.unit)}</div></div><button class="btn sm ghost" data-nav="${t.nv}" ${t.ref && !t.ref.includes(',') ? `data-q='${esc(JSON.stringify({ id: t.ref }))}'` : ''}>Buka</button></div>`)
      .join('');
  }
  HAWK.vh.taskList = taskList;

  /* ---------- NV-02 My Tasks & Approval Inbox ---------- */
  V[2] = {
    render(ctx) {
      const { s, user, L } = ctx;
      const all = HAWK.tasks(s, user);
      const types = [...new Set(all.map((t) => t.type))];
      const cur = L.t || 'ALL';
      const list = cur === 'ALL' ? all : all.filter((t) => t.type === cur);
      const rows = list.map((t, i) => ({ ...t, i }));
      return `<div class="card">${ui.tabs('t', [['ALL', 'Semua', all.length], ...types.map((t) => [t, t, all.filter((x) => x.type === t).length])], cur)}
        ${ui.table(
          [
            { h: 'No', f: (r, i) => i + 1 },
            { h: 'Jenis', f: (r) => `<span class="badge gold">${esc(r.type)}</span>` },
            { h: 'Referensi', f: (r) => (r.ref.includes(',') ? r.ref.split(', ').map(ui.id).join(' ') : ui.id(r.ref)) },
            { h: 'Unit / lokasi', f: (r) => esc(r.unit) },
            { h: 'Permintaan / tugas', f: (r) => esc(r.title) + (r.budget && r.budget !== 'OK' ? ' ' + ui.status(r.budget) : '') },
            { h: 'Nilai', num: true, f: (r) => (r.value ? U.rp(r.value) : '—') },
            { h: 'Status', f: (r) => ui.status(r.status) },
            { h: 'Aksi', f: (r) => taskActions(r) },
          ],
          rows,
          { empty: 'Tidak ada tugas untuk role ini. Ganti role lewat tombol profil di kanan atas.' }
        )}
        <p class="tiny muted" style="margin:10px 0 0">Kotak masuk dihitung dari state bersama — dokumen yang Anda setujui di layar lain langsung hilang dari sini.</p></div>`;
    },
    actions: {
      approveMrf(el, ctx) {
        ctx.act('mrf.decide', { id: el.dataset.ref, decision: 'APPROVE', note: 'Disetujui dari inbox' }, (m) => `${m.id} disetujui → ${ui.statusLabel(m.status)}`);
      },
      rejectMrf(el, ctx) {
        ui.ask('Tolak ' + el.dataset.ref, 'Alasan penolakan (wajib)', (note) => ctx.act('mrf.decide', { id: el.dataset.ref, decision: 'REJECT', note }, 'MRF ditolak'), { danger: true, ok: 'Tolak' });
      },
      approvePo(el, ctx) {
        ctx.act('po.decide', { id: el.dataset.ref, decision: 'APPROVE' }, (p) => `${p.id} → ${ui.statusLabel(p.status)}`);
      },
    },
  };
  function taskActions(t) {
    const go = `<button class="btn sm ghost" data-nav="${t.nv}" ${!t.ref.includes(',') ? `data-q='${esc(JSON.stringify({ id: t.ref }))}'` : ''}>Buka</button>`;
    if (t.type === 'MRF' && t.kind === 'approval') return `<div class="row" style="flex-wrap:nowrap">${go}<button class="btn sm ok" data-a="approveMrf" data-ref="${t.ref}" title="Setujui">✓</button><button class="btn sm bad" data-a="rejectMrf" data-ref="${t.ref}" title="Tolak">✕</button></div>`;
    if (t.type === 'PO' && t.kind === 'approval') return `<div class="row" style="flex-wrap:nowrap">${go}<button class="btn sm ok" data-a="approvePo" data-ref="${t.ref}">✓</button></div>`;
    return go;
  }

  /* ---------- NV-03 Notifications & Activity ---------- */
  V[3] = {
    render(ctx) {
      const { s, user, L } = ctx;
      const ns = HAWK.notifications(s, user);
      const cur = L.c || 'all';
      const f = cur === 'all' ? ns : ns.filter((n) => n.cat === cur);
      const mine = s.audit.filter((a) => a.user === user.id).slice(0, 15);
      return `<div class="grid g-2-1"><div class="card">${ui.tabs('c', [['all', 'Semua', ns.length], ['approval', 'Approval', ns.filter((n) => n.cat === 'approval').length], ['transaksi', 'Transaksi', ns.filter((n) => n.cat === 'transaksi').length], ['sistem', 'Sistem', ns.filter((n) => n.cat === 'sistem').length], ['ai', 'AI Insight', ns.filter((n) => n.cat === 'ai').length]], cur)}
        ${f.length ? f.map((n) => `<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line-2);flex-wrap:nowrap;cursor:pointer" ${n.ins ? `data-ins-open="${n.ins}"` : n.ref ? `data-id="${esc(n.ref)}"` : ''}><span class="badge ${n.cat === 'ai' ? 'violet' : n.cat === 'approval' ? 'gold' : ''}">${n.cat.toUpperCase()}</span><div style="flex:1;min-width:0"><b class="small">${esc(n.title)}</b><div class="tiny muted">${esc(n.text)}</div></div>${s.notificationsRead[n.id + user.id] ? '' : '<span class="sev HIGH" title="Belum dibaca"></span>'}</div>`).join('') : ui.empty('Tidak ada notifikasi')}
        <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-a="readAll">Tandai semua dibaca</button></div></div>
        <div class="card"><h3>Aktivitas saya</h3>${mine.length ? `<ul class="tl">${mine.map((a) => `<li><b>${esc(a.op)}</b> ${ui.id(a.ref)}<div class="tiny muted">${esc(a.detail || '')}</div><div class="t">${U.datetime(a.ts)}</div></li>`).join('')}</ul>` : '<p class="small muted">Belum ada aktivitas di sesi demo ini.</p>'}</div></div>`;
    },
    actions: {
      readAll(el, ctx) {
        HAWK.notifications(ctx.s, ctx.user).forEach((n) => (ctx.s.notificationsRead[n.id + ctx.user.id] = true));
        HAWK.store.save();
        ctx.rerender();
      },
    },
  };

  /* ---------- NV-04 Global Search & Quick Actions ---------- */
  V[4] = {
    render(ctx) {
      const q = ctx.L.q !== undefined ? ctx.L.q : ctx.q.q || '';
      const hits = HAWK.search(q);
      const types = [...new Set(hits.map((h) => h.type))];
      const cur = ctx.L.t || 'ALL';
      const f = cur === 'ALL' ? hits : hits.filter((h) => h.type === cur);
      const qa = [
        [26, 'Buat MRF', 'mrf'], [32, 'Buat PO', 'cart'], [42, 'Terima barang', 'truck'], [40, 'Cek stok', 'box'], [22, 'Revisi budget', 'budget'], [48, 'Scan nota / faktur', 'camera'], [55, 'Lapor kerusakan', 'wrench'], [60, 'Skenario AI', 'ai'],
      ].filter(([nv]) => HAWK.canSee(ctx.role, nv));
      return `<div class="grid g-2-1"><div class="card"><div class="row" style="flex-wrap:nowrap"><input class="inp" id="q4" value="${esc(q)}" placeholder="Ketik ID (PR2026…), nama item, supplier, aset… lalu Enter" aria-label="Cari"><button class="btn" data-a="go">Cari</button></div>
        <div style="margin-top:12px">${q ? ui.tabs('t', [['ALL', 'Semua', hits.length], ...types.map((t) => [t, t, hits.filter((h) => h.type === t).length])], cur) : ''}</div>
        ${q ? (f.length ? f.map((h) => `<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line-2);cursor:pointer;flex-wrap:nowrap" data-id="${esc(h.id)}"><span class="badge gold">${esc(h.type)}</span><div style="flex:1;min-width:0"><b class="mono small">${esc(h.id)}</b><div class="tiny muted">${esc(h.title)}</div></div>${ui.status(h.status)}</div>`).join('') : ui.empty('Tidak ditemukan untuk "' + esc(q) + '"')) : '<p class="small muted">Contoh: <button class="link" data-a="ex" data-v="massage">minyak</button> · <button class="link" data-a="ex" data-v="PR2026">PR2026</button> · <button class="link" data-a="ex" data-v="Aroma">Aroma</button> · <button class="link" data-a="ex" data-v="AC">AC</button></p>'}
        <p class="tiny muted" style="margin:10px 0 0">Integrasi: <span class="mono">search.global</span> ${ui.intBadge('TO VERIFY')} — setara tab FIND di HAWK; hasil wajib difilter hak akses di server.</p></div>
        <div class="card"><h3>Aksi cepat</h3><div class="grid g2">${qa.map(([nv, l, ic]) => `<button class="btn ghost" style="flex-direction:column;height:84px" data-nav="${nv}">${ui.icon(ic, 22)}<span class="small">${l}</span></button>`).join('')}</div></div></div>`;
    },
    mount(ctx) {
      const el = document.getElementById('q4');
      el && el.addEventListener('keydown', (e) => e.key === 'Enter' && ((ctx.L.q = el.value), (ctx.L.t = 'ALL'), ctx.rerender()));
    },
    actions: {
      go(el, ctx) {
        ctx.L.q = ctx.val('q4');
        ctx.L.t = 'ALL';
        ctx.rerender();
      },
      ex(el, ctx) {
        ctx.L.q = el.dataset.v === 'massage' ? 'minyak' : el.dataset.v;
        ctx.rerender();
      },
    },
  };
})();
