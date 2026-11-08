/* Module I — Asset & Facility (NV-53..56). Maps to HAWK Asset Management & Work Order (TO VERIFY). */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const esc = U.esc;
  const V = HAWK.views;
  const q = (o) => esc(JSON.stringify(o));
  const short = (v) => U.rp(v, { short: true });
  const nextDue = (a) => new Date(Date.parse(a.lastService) + a.serviceIntervalDays * 864e5).toISOString().slice(0, 10);
  const assetsFor = (ctx) => ctx.s.assets.filter((a) => ctx.inScope(a.org));
  const condB = (c) => `<span class="badge ${c === 'Baik' || c === 'Baru' ? 'ok' : c === 'Rusak' || c === 'Perlu perbaikan' ? 'bad' : 'warn'}">${esc(c)}</span>`;
  const reportForm = (ctx, assets, sel) => `<div class="stack"><div class="field"><label>Aset</label><select class="inp" id="mt-asset">${assets.filter((a) => a.status === 'ACTIVE').map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.name)} — ${esc(S.orgName(ctx.s, a.org))}</option>`).join('')}</select></div>
    <div class="field"><label>Uraian masalah *</label><textarea class="inp" id="mt-issue" rows="2" placeholder="Contoh: AC menetes & kurang dingin"></textarea></div><div class="field"><label>Prioritas</label><select class="inp" id="mt-prio"><option value="HIGH">Tinggi — mengganggu tamu</option><option value="MEDIUM" selected>Sedang</option><option value="LOW">Rendah</option></select></div>
    <button class="btn block" data-a="report">Laporkan kerusakan</button></div>`;
  const report = (el, ctx) => ctx.act('mt.create', { asset: ctx.val('mt-asset'), issue: ctx.val('mt-issue'), priority: ctx.val('mt-prio') }, (m) => `${m.id} dilaporkan — menunggu tinjauan supervisor`);

  /* ---------- NV-53 Asset Register ---------- */
  V[53] = {
    render(ctx) {
      const { s, L } = ctx;
      const all = assetsFor(ctx);
      const cat = L.cat || '';
      const list = all.filter((a) => !cat || a.cat === cat);
      const dep = (a) => S.depreciation(s, a);
      const due = all.filter((a) => a.status === 'ACTIVE' && nextDue(a) <= s.meta.demoDate);
      return `<div class="stack"><div class="grid g4 keep2">${ui.kpi('Aset terdaftar', all.length, all.filter((a) => a.status === 'ACTIVE').length + ' aktif', 'g-gold', 'asset')}${ui.kpi('Nilai perolehan', short(U.sum(all, (a) => a.cost)), 'DEMO', '', 'finance')}${ui.kpi('Nilai buku', short(U.sum(all.filter((a) => a.status !== 'DISPOSED'), (a) => dep(a).book)), 'garis lurus', 'g-blue', 'budget')}${ui.kpi('Servis jatuh tempo', due.length, 'preventif', due.length ? 'g-violet' : '', 'wrench')}</div>
        <div class="card"><div class="row" style="margin-bottom:10px"><select class="inp" style="max-width:220px" data-ch="cat" aria-label="Kategori"><option value="">Semua kategori</option>${U.uniq(all.map((a) => a.cat)).map((c) => `<option ${c === cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select><span class="small muted">Sumber: Asset Management HAWK ${ui.intBadge('TO VERIFY')}</span></div>${ui.table(
          [
            { h: 'Aset', f: (a) => `<button class="link" data-nav="54" data-q='${q({ id: a.id })}'><b>${esc(a.name)}</b></button><div class="tiny muted mono">${a.id}</div>` },
            { h: 'Kategori', f: (a) => esc(a.cat) },
            { h: 'Lokasi', f: (a) => `<span class="small">${esc(a.location)}</span>` },
            { h: 'Perolehan', num: true, f: (a) => U.rp(a.cost) + `<div class="tiny muted">${U.date(a.acquired)}</div>` },
            { h: 'Nilai buku', num: true, f: (a) => U.rp(dep(a).book) },
            { h: 'Umur pakai', f: (a) => `<div style="min-width:90px">${ui.bar(dep(a).ageRatio, dep(a).ageRatio > 0.85 ? 'bad' : dep(a).ageRatio > 0.6 ? 'warn' : 'ok')}<span class="tiny">${U.pct(dep(a).ageRatio)}</span></div>` },
            { h: 'Kondisi', f: (a) => condB(a.condition) },
            { h: 'Servis berikut', f: (a) => `<span class="${nextDue(a) <= s.meta.demoDate ? 'bad-t' : ''}">${U.date(nextDue(a))}</span>` },
            { h: 'Status', f: (a) => ui.status(a.status) },
          ],
          list
        )}</div></div>`;
    },
    actions: {
      cat(el, ctx) {
        ctx.L.cat = el.value;
        ctx.rerender();
      },
    },
  };

  /* ---------- NV-54 Asset Detail ---------- */
  V[54] = {
    render(ctx) {
      const { s, L, q: qq } = ctx;
      const all = assetsFor(ctx);
      const a = all.find((x) => x.id === (L.id || qq.id)) || all[0];
      if (!a) return ui.empty('Tidak ada aset dalam scope.');
      const d = S.depreciation(s, a);
      const pts = Array.from({ length: 6 }, (_, i) => Math.round((a.life / 5) * i));
      const mts = s.maintenance.filter((m) => m.asset === a.id);
      const wos = s.workOrders.filter((w) => w.asset === a.id);
      return `<div class="stack"><div class="card"><div class="row"><select class="inp" style="max-width:360px" data-ch="sel" aria-label="Aset">${all.map((x) => `<option value="${x.id}" ${x.id === a.id ? 'selected' : ''}>${esc(x.name)} · ${x.id}</option>`).join('')}</select>${ui.status(a.status)} ${condB(a.condition)}</div></div>
        <div class="grid g-2-1"><div class="card"><h3>${esc(a.name)}</h3><div class="grid g2"><dl class="kv"><dt>ID</dt><dd class="mono">${a.id}</dd><dt>Kategori</dt><dd>${esc(a.cat)}</dd><dt>Lokasi</dt><dd>${esc(a.location)}</dd><dt>Unit</dt><dd>${esc(S.orgName(s, a.org))}</dd><dt>Sumber</dt><dd>${a.source ? ui.id(a.source) : '—'}</dd></dl>
          <dl class="kv"><dt>Perolehan</dt><dd>${U.rp(a.cost)} · ${U.date(a.acquired)}</dd><dt>Metode</dt><dd>${esc(a.method)}, ${a.life} bln</dd><dt>Penyusutan / bln</dt><dd>${U.rp(d.monthly)}</dd><dt>Akumulasi</dt><dd>${U.rp(d.accumulated)}</dd><dt>Nilai buku</dt><dd><b>${U.rp(d.book)}</b></dd><dt>Servis terakhir / berikut</dt><dd>${U.date(a.lastService)} / <span class="${nextDue(a) <= s.meta.demoDate ? 'bad-t' : ''}">${U.date(nextDue(a))}</span></dd></dl></div>
          <h3 style="margin-top:12px">Kurva nilai buku</h3>${ui.line({ labels: pts.map((m) => 'bln ' + m), series: [{ name: 'Nilai buku', color: '#64748b', values: pts.map((m) => Math.round((a.cost - Math.min(a.cost, (a.cost / a.life) * m)) / 1e5) / 10) }], h: 140, fmt: (v) => U.num(v, 1) + ' jt' })}</div>
        <div class="stack"><div class="card"><h3>${ui.icon('wrench', 16)} Laporkan kerusakan</h3>${ctx.can('mt.create') ? reportForm(ctx, [a], a.id) : '<p class="small muted">Role ini tidak dapat melapor.</p>'}</div>
          <div class="card"><h3>Riwayat aset</h3>${a.history.length ? `<ul class="tl">${a.history.map((h) => `<li><b>${esc(h.event)}</b>${h.ref ? ' ' + ui.id(h.ref) : ''}<div class="t">${U.datetime(h.ts)} · ${esc(S.userName(s, h.by))}</div></li>`).join('')}</ul>` : '<p class="small muted">—</p>'}</div></div></div>
        <div class="card"><h3>Permintaan perbaikan & work order</h3>${ui.table([{ h: 'Dokumen', f: (x) => ui.id(x.id) }, { h: 'Uraian', f: (x) => esc(x.issue || x.notes || x.assignee) }, { h: 'Status', f: (x) => ui.status(x.status) }], mts.concat(wos), { empty: 'Belum ada.' })}</div></div>`;
    },
    actions: {
      sel(el, ctx) {
        ctx.L.id = el.value;
        ctx.rerender();
      },
      report,
    },
  };

  /* ---------- NV-55 Maintenance Request & Work Order ---------- */
  V[55] = {
    render(ctx) {
      const { s, L } = ctx;
      const assets = assetsFor(ctx);
      const ids = assets.map((a) => a.id);
      const mts = s.maintenance.filter((m) => ids.includes(m.asset));
      const wos = s.workOrders.filter((w) => ids.includes(w.asset));
      const cur = L.t || 'REQ';
      const parts = s.items.filter((i) => i.cat === 'Suku Cadang');
      const reqT = ui.table(
        [
          { h: 'Request', f: (m) => ui.id(m.id) + `<div class="tiny muted">${U.datetime(m.date)}</div>` },
          { h: 'Aset', f: (m) => `<button class="link" data-nav="54" data-q='${q({ id: m.asset })}'>${esc((S.asset(s, m.asset) || {}).name)}</button>` },
          { h: 'Masalah', f: (m) => esc(m.issue) },
          { h: 'Prioritas', f: (m) => `<span class="badge ${m.priority === 'HIGH' ? 'bad' : m.priority === 'MEDIUM' ? 'warn' : ''}">${m.priority}</span>` },
          { h: 'Pelapor', f: (m) => esc(S.userName(s, m.reporter)) },
          { h: 'Status', f: (m) => ui.status(m.status) },
          { h: '', f: (m) => (m.status === 'SUBMITTED' && ctx.can('mt.review') ? `<button class="btn sm bad" data-a="mtNo" data-p="${m.id}">Tolak</button> <button class="btn sm ok" data-a="mtOk" data-p="${m.id}">Setujui</button>` : m.status === 'APPROVED' && ctx.can('wo.create') ? `<button class="btn sm" data-a="wo" data-p="${m.id}">Buat WO</button>` : m.wo ? ui.id(m.wo) : '') },
        ],
        mts,
        { empty: 'Tidak ada permintaan.' }
      );
      const woT = wos.length
        ? wos.map((w) => `<div class="card"><div class="card-head"><h3>${ui.id(w.id)} · ${esc((S.asset(s, w.asset) || {}).name)}</h3><span class="r">${ui.status(w.status)}</span></div><dl class="kv"><dt>Request</dt><dd>${ui.id(w.mt)}</dd><dt>Pelaksana</dt><dd>${esc(w.assignee)}</dd><dt>Biaya</dt><dd>${U.rp(w.cost || 0)}</dd><dt>Suku cadang</dt><dd>${w.parts.map((p) => `${esc(S.itemName(s, p.item))} × ${p.qty} → ${ui.id(p.mrf)} ${ui.status((s.mrfs.find((m) => m.id === p.mrf) || {}).status)}`).join('<br>') || '—'}</dd>${w.notes ? `<dt>Catatan</dt><dd>${esc(w.notes)}</dd>` : ''}</dl>
          ${['OPEN', 'WAITING_PARTS'].includes(w.status) && ctx.can('wo.requestPart') ? `<div class="hr"></div><div class="row"><select class="inp" style="max-width:240px" id="wp-item-${w.id}">${parts.map((i) => `<option value="${i.id}">${esc(i.name)}</option>`).join('')}</select><input class="qty" type="number" id="wp-qty-${w.id}" value="1" min="1" aria-label="Qty"><button class="btn sm ghost" data-a="part" data-p="${w.id}">Minta suku cadang (buat MRF)</button></div>
          <div class="row" style="margin-top:8px"><input class="inp" id="wc-notes-${w.id}" placeholder="Catatan penyelesaian *" style="max-width:320px"><input class="inp" type="number" id="wc-cost-${w.id}" placeholder="Biaya tambahan (Rp)" style="max-width:180px"><button class="btn sm ok" data-a="done" data-p="${w.id}">Selesaikan WO</button></div>` : ''}</div>`).join('')
        : `<div class="card">${ui.empty('Belum ada work order.')}</div>`;
      return `<div class="stack"><div class="grid g4 keep2">${ui.kpi('Permintaan baru', mts.filter((m) => m.status === 'SUBMITTED').length, 'menunggu tinjauan', 'g-gold', 'wrench')}${ui.kpi('WO berjalan', wos.filter((w) => ['OPEN', 'WAITING_PARTS'].includes(w.status)).length, wos.filter((w) => w.status === 'WAITING_PARTS').length + ' menunggu suku cadang', '', 'check')}${ui.kpi('WO selesai', wos.filter((w) => w.status === 'COMPLETED').length, 'riwayat aset diperbarui', '', 'asset')}${ui.kpi('Biaya pemeliharaan', short(U.sum(wos, (w) => w.cost || 0)), 'beban Facility (7P)', 'g-blue', 'finance')}</div>
        <div class="grid g-2-1"><div>${ui.tabs('t', [['REQ', 'Permintaan', mts.length], ['WO', 'Work order', wos.length]], cur)}<div style="margin-top:10px">${cur === 'REQ' ? `<div class="card">${reqT}</div>` : `<div class="stack">${woT}</div>`}</div></div>
        <div class="card" style="align-self:start"><h3>${ui.icon('wrench', 16)} Lapor kerusakan</h3>${ctx.can('mt.create') ? reportForm(ctx, assets) : '<p class="small muted">Role ini tidak dapat melapor.</p>'}<p class="tiny muted">Alur: Staff lapor → Supervisor tinjau → Asset PIC buat WO → suku cadang via MRF (rantai approval normal) → selesai → biaya ke beban Facility & riwayat aset. Pembelian darurat lewat NV-37.</p></div></div></div>`;
    },
    actions: {
      report,
      mtOk(el, ctx) {
        ctx.act('mt.review', { id: el.dataset.p, decision: 'APPROVE' }, 'Permintaan disetujui — Asset PIC dapat membuat WO');
      },
      mtNo(el, ctx) {
        ui.ask('Tolak ' + el.dataset.p, 'Alasan', (note) => ctx.act('mt.review', { id: el.dataset.p, decision: 'REJECT', note }, 'Permintaan ditolak'), { danger: true });
      },
      wo(el, ctx) {
        ui.openModal('Buat work order', `<div class="field"><label>Pelaksana</label><select class="inp" id="wo-as"><option>Teknisi internal</option><option>Vendor servis AC (DEMO)</option><option>Vendor servis umum (DEMO)</option></select></div><div class="field" style="margin-top:8px"><label>Estimasi biaya jasa (Rp)</label><input class="inp" type="number" id="wo-lab" value="250000"></div>`, `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" data-a="woGo" data-p="${el.dataset.p}">Buat WO</button>`);
      },
      woGo(el, ctx) {
        const r = ctx.act('wo.create', { mt: el.dataset.p, assignee: ctx.val('wo-as'), labor: +ctx.val('wo-lab') }, (w) => `${w.id} dibuat`);
        if (r.ok) {
          ui.closeModal();
          ctx.L.t = 'WO';
          ctx.rerender();
        }
      },
      part(el, ctx) {
        const id = el.dataset.p;
        ctx.act('wo.requestPart', { id, item: ctx.val('wp-item-' + id), qty: +ctx.val('wp-qty-' + id) }, (r) => `${r.mrf.id} (MRF non-rutin) dibuat untuk ${r.wo.id} — mengikuti approval normal`);
      },
      done(el, ctx) {
        const id = el.dataset.p;
        ctx.act('wo.complete', { id, notes: ctx.val('wc-notes-' + id), cost: +ctx.val('wc-cost-' + id) || 0 }, (w) => `${w.id} selesai — riwayat aset & beban Facility diperbarui`);
      },
    },
  };

  /* ---------- NV-56 Capitalization, Depreciation & Disposal ---------- */
  V[56] = {
    render(ctx) {
      const { s } = ctx;
      const all = assetsFor(ctx);
      const orgs = s.org.filter((o) => o.status === 'ACTIVE' && o.scope === 'IN' && ['BRANCH', 'BU', 'DIVISION'].includes(o.type));
      const projs = s.projects.filter((p) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status));
      const dep = (a) => S.depreciation(s, a);
      const act = all.filter((a) => a.status !== 'DISPOSED');
      return `<div class="stack"><div class="grid g-1-2"><div class="card"><h3>${ui.icon('plus', 16)} Kapitalisasi aset</h3>${ctx.can('asset.capitalize') ? `<div class="stack"><div class="field"><label>Nama aset *</label><input class="inp" id="ac-name" placeholder="Bed pijat elektrik"></div><div class="grid g2"><div class="field"><label>Kategori</label><input class="inp" id="ac-cat" value="Peralatan Treatment"></div><div class="field"><label>Lokasi</label><select class="inp" id="ac-org">${orgs.map((o) => `<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select></div></div>
          <div class="grid g2"><div class="field"><label>Nilai perolehan (Rp) *</label><input class="inp" type="number" id="ac-cost" value="18500000"></div><div class="field"><label>Umur (bulan) *</label><input class="inp" type="number" id="ac-life" value="96"></div></div><div class="field"><label>Sumber proyek / PO</label><select class="inp" id="ac-src"><option value="">—</option>${projs.map((p) => `<option value="${p.id}">${p.id} · ${esc(p.name)}</option>`).join('')}</select></div>
          <button class="btn block" data-a="cap">Kapitalisasi</button><p class="tiny muted">Jurnal Dr Aset Tetap / Cr Aset Dalam Penyelesaian (PENDING_REVIEW). CAPEX tidak menjadi beban saat dibeli.</p></div>` : '<p class="small muted">Kapitalisasi oleh Finance / Asset PIC.</p>'}</div>
        <div class="card"><h3>Jadwal penyusutan (garis lurus)</h3>${ui.table([{ h: 'Aset', f: (a) => `${ui.id(a.id)} <span class="small">${esc(a.name)}</span>` }, { h: 'Perolehan', num: true, f: (a) => U.rp(a.cost) }, { h: '/ bulan', num: true, f: (a) => U.rp(dep(a).monthly) }, { h: 'Akumulasi', num: true, f: (a) => U.rp(dep(a).accumulated) }, { h: 'Nilai buku', num: true, f: (a) => `<b>${U.rp(dep(a).book)}</b>` }, { h: 'Status', f: (a) => ui.status(a.status) }, { h: '', f: (a) => (a.status === 'ACTIVE' && ctx.can('asset.dispose') ? `<button class="btn sm ghost" data-a="req" data-p="${a.id}">Usul disposal</button>` : a.status === 'PENDING_DISPOSAL' && ['FINANCE', 'OWNER'].includes(ctx.role) ? `<button class="btn sm bad" data-a="appr" data-p="${a.id}">Setujui disposal</button>` : a.status === 'PENDING_DISPOSAL' ? '<span class="badge warn">Menunggu Finance/Owner</span>' : '') }], act, { foot: `<td><b>Total</b></td><td class="num"><b>${U.rp(U.sum(act, (a) => a.cost))}</b></td><td class="num">${U.rp(U.sum(act, (a) => dep(a).monthly))}</td><td class="num">${U.rp(U.sum(act, (a) => dep(a).accumulated))}</td><td class="num"><b>${U.rp(U.sum(act, (a) => dep(a).book))}</b></td><td></td><td></td>` })}
          <p class="tiny muted" style="margin:8px 0 0">Disposal: usulan (Asset PIC) → persetujuan Finance/Owner → jurnal pelepasan (akumulasi, rugi pelepasan). Kebijakan kapitalisasi & metode final ditentukan engine HAWK ${ui.intBadge('TO VERIFY')}.</p></div></div></div>`;
    },
    actions: {
      cap(el, ctx) {
        ctx.act('asset.capitalize', { name: ctx.val('ac-name').trim(), cat: ctx.val('ac-cat'), org: ctx.val('ac-org'), cost: +ctx.val('ac-cost'), life: +ctx.val('ac-life'), source: ctx.val('ac-src') || null }, (a) => `${a.id} dikapitalisasi — jurnal menunggu review`);
      },
      req(el, ctx) {
        ui.ask('Usul disposal ' + el.dataset.p, 'Alasan disposal', (reason) => ctx.act('asset.dispose', { id: el.dataset.p, step: 'REQUEST', reason }, 'Usulan disposal dicatat'), { ok: 'Usulkan' });
      },
      appr(el, ctx) {
        ctx.act('asset.dispose', { id: el.dataset.p, step: 'APPROVE' }, 'Disposal disetujui — jurnal pelepasan dibuat');
      },
    },
  };
})();
