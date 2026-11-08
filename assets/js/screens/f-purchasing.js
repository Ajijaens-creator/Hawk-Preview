/* Module F — Purchasing & Supplier (NV-31..37). PO = existing HAWK Purchase Order engine (TO VERIFY). */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const vh = HAWK.vh;
  const esc = U.esc;
  const V = HAWK.views;
  const q = (o) => esc(JSON.stringify(o));

  /* ---------- NV-31 Purchasing Dashboard ---------- */
  V[31] = {
    render(ctx) {
      const { s, user } = ctx;
      const pend = S.pendingPurchase(s);
      const pos = s.pos;
      const nov = pos.filter((p) => p.date.slice(0, 7) === '2026-11');
      const val = U.sum(nov, (p) => S.poTotals(s, p).total);
      const byP = {};
      nov.forEach((p) => p.lines.forEach((l) => (byP[S.item(s, l.item).p] = (byP[S.item(s, l.item).p] || 0) + l.qty * l.price)));
      const st = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIAL', 'RECEIVED'];
      return `<div class="stack"><div class="grid g4 keep2">${ui.kpi('Kebutuhan MRF tanpa PO', pend.length, U.uniq(pend.map((p) => p.mrf)).length + ' MRF disetujui', 'g-gold', 'mrf')}${ui.kpi('PO bulan ini', nov.length, nov.filter((p) => p.status === 'PENDING_APPROVAL').length + ' menunggu approval', '', 'cart')}${ui.kpi('Nilai PO Nov 2026', U.rp(val, { short: true }), 'termasuk PPN · DEMO', '', 'finance')}${ui.kpi('PO darurat', pos.filter((p) => p.emergency).length, pos.filter((p) => p.emergency && p.postApproval === 'PENDING').length + ' menunggu approval susulan', '', 'alert')}</div>
        <div class="grid g-2-1"><div class="card"><div class="card-head"><h3>Meja kerja Purchasing</h3></div>${vh.taskList(ctx, HAWK.tasks(s, user))}</div>
        <div class="card"><h3>Komposisi pembelian Nov (7P)</h3>${Object.keys(byP).length ? ui.donut({ items: Object.entries(byP).map(([k, v]) => ({ label: s.sevenP.find((p) => p.key === k).name, color: ui.pColor(k), value: v })), center: U.rp(val, { short: true }).replace('Rp ', ''), sub: 'nilai PO', size: 140 }) : ui.empty('—')}</div></div>
        <div class="grid g2"><div class="card"><h3>PO per status</h3>${ui.bars({ labels: st.map((x) => ui.statusLabel(x).replace(' ke vendor', '')), series: [{ name: 'PO', color: '#c99a2e', values: st.map((x) => pos.filter((p) => p.status === x).length) }], h: 170 })}</div>
        <div class="card"><h3>Tren pembelian (Rp jt) ${ui.demo('DEMO')}</h3>${ui.line({ labels: ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov'], series: [{ name: 'Nilai PO', color: '#c99a2e', values: [412, 455, 468, 431, 497, 380 + val / 1e6] }], fmt: (v) => U.num(v) })}</div></div></div>`;
    },
  };

  /* ---------- NV-32 Consolidated MRF & Purchasing Planning ---------- */
  V[32] = {
    render(ctx) {
      const { s, L } = ctx;
      const pend = S.pendingPurchase(s).filter((p) => ctx.inScope(p.branch));
      L.sel = L.sel || {};
      const key = (p) => `${p.mrf}|${p.li}|${p.ai}`;
      const picked = pend.filter((p) => L.sel[key(p)]);
      const groups = {};
      pend.forEach((p) => {
        const g = `${p.supplier}|${p.wh}`;
        (groups[g] = groups[g] || []).push(p);
      });
      const items = U.uniq(picked.map((p) => p.item));
      const sup = L.sup || (picked[0] ? picked[0].supplier : pend[0] ? pend[0].supplier : 'SUP-001');
      const est = U.sum(picked, (p) => {
        const qt = s.quotations.find((x) => x.item === p.item && x.supplier === sup);
        return p.qty * (qt ? qt.price : S.item(s, p.item).price);
      });
      const whs = U.uniq(picked.map((p) => p.wh));
      return `<div class="stack"><div class="alert info">${ui.icon('alert', 16)}<span>Kebutuhan berasal dari MRF yang <b>sudah disetujui</b> dengan jalur <b>Pembelian</b>. Pilih baris dengan supplier & lokasi kirim yang sama → satu PO (field <i>Deliver To</i> HAWK hanya satu per PO). Setara tombol <b>PO</b> di register PO Request HAWK ${ui.intBadge('TO VERIFY')}.</span></div>
        <div class="grid g-2-1"><div class="card"><div class="card-head"><h3>Kebutuhan pembelian disetujui (${pend.length})</h3><span class="r"><button class="btn sm ghost" data-a="selGroup">Pilih grup saran AI</button></span></div>
        ${Object.entries(groups).map(([g, rows]) => {
          const [supId, wh] = g.split('|');
          return `<div style="margin-bottom:14px"><div class="row small" style="margin-bottom:6px"><b>${esc(S.supplierName(s, supId))}</b><span class="muted">→ ${esc(S.whName(s, wh))}</span>${U.uniq(rows.map((r) => r.mrf)).length > 1 ? '<span class="ai-tag">AI: konsolidasi</span>' : ''}</div>${ui.table(
            [
              { h: '', f: (p) => `<input type="checkbox" data-ch="tog" data-k="${key(p)}" ${L.sel[key(p)] ? 'checked' : ''} aria-label="Pilih">` },
              { h: 'MRF', f: (p) => ui.id(p.mrf) },
              { h: 'Unit', f: (p) => esc(S.orgName(s, p.branch)) },
              { h: 'Item', f: (p) => esc(S.itemName(s, p.item)) },
              { h: 'Qty', num: true, f: (p) => p.qty + ' ' + esc(S.item(s, p.item).unit) },
              { h: 'Tgl MRF', f: (p) => U.date(p.date) },
            ],
            rows,
            { rowCls: (p) => (L.sel[key(p)] ? 'sel' : '') }
          )}</div>`;
        }).join('') || ui.empty('Tidak ada kebutuhan pembelian. Semua MRF disetujui sudah ber-PO atau terpenuhi dari stok.')}</div>
        <div class="card" style="align-self:start;position:sticky;top:76px"><h3>${ui.icon('cart', 16)} PO baru</h3>
          <div class="field"><label>Supplier</label><select class="inp" data-ch="sup">${s.suppliers.map((x) => `<option value="${x.id}" ${x.id === sup ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
          <dl class="kv" style="margin-top:10px"><dt>Baris dipilih</dt><dd>${picked.length} dari ${U.uniq(picked.map((p) => p.mrf)).length} MRF</dd><dt>Item</dt><dd>${items.map((i) => esc(S.itemName(s, i))).join(', ') || '—'}</dd><dt>Deliver to</dt><dd>${whs.length === 1 ? esc(S.whName(s, whs[0])) : whs.length ? '<span class="bad-t">Lebih dari 1 lokasi</span>' : '—'}</dd><dt>Estimasi</dt><dd><b>${U.rp(est)}</b> + PPN 11%</dd><dt>Approval</dt><dd>${est * 1.11 > 10000000 ? 'Purchasing → BU Manager (AR-07)' : 'Purchasing (AR-06)'}</dd></dl>
          ${items.map((i) => { const qs = s.quotations.filter((x) => x.item === i); return qs.length ? `<div class="tiny muted" style="margin-top:6px">${esc(S.itemName(s, i))}: ${qs.map((x) => `${esc(S.supplierName(s, x.supplier).split(' (')[0])} ${U.rp(x.price)}`).join(' · ')} <button class="link" data-nav="34" data-q='${q({ item: i })}'>bandingkan</button></div>` : ''; }).join('')}
          <button class="btn block" style="margin-top:12px" data-a="create" ${picked.length && whs.length === 1 ? '' : 'disabled'}>Buat draft PO</button></div></div></div>`;
    },
    actions: {
      tog(el, ctx) {
        ctx.L.sel[el.dataset.k] = el.checked;
        ctx.rerender();
      },
      sup(el, ctx) {
        ctx.L.sup = el.value;
        ctx.rerender();
      },
      selGroup(el, ctx) {
        const pend = S.pendingPurchase(ctx.s).filter((p) => ctx.inScope(p.branch));
        const groups = {};
        pend.forEach((p) => (groups[p.supplier + '|' + p.wh] = groups[p.supplier + '|' + p.wh] || []).push(p));
        const best = Object.values(groups).sort((a, b) => U.uniq(b.map((x) => x.mrf)).length - U.uniq(a.map((x) => x.mrf)).length || b.length - a.length)[0] || [];
        ctx.L.sel = {};
        best.forEach((p) => (ctx.L.sel[`${p.mrf}|${p.li}|${p.ai}`] = true));
        if (best[0]) ctx.L.sup = best[0].supplier;
        ctx.rerender();
      },
      create(el, ctx) {
        const picks = Object.entries(ctx.L.sel).filter(([, v]) => v).map(([k]) => {
          const [mrf, li, ai] = k.split('|');
          return { mrf, li: +li, ai: +ai };
        });
        const sup = ctx.L.sup || S.pendingPurchase(ctx.s).find((p) => p.mrf === picks[0].mrf).supplier;
        const r = ctx.act('po.createFromMrf', { picks, supplier: sup }, (po) => `${po.id} dibuat (draft) — MRF kini menampilkan referensi PO`);
        if (r.ok) {
          ctx.L.sel = {};
          HAWK.go(35, { id: r.data.id });
        }
      },
    },
  };

  /* ---------- NV-33 Supplier Master ---------- */
  V[33] = {
    render(ctx) {
      const { s, L } = ctx;
      const cur = L.t || 'list';
      const list = s.suppliers;
      return `${ui.tabs('t', [['list', 'Daftar supplier', list.length], ['perf', 'Kinerja supplier']], cur)}
        ${cur === 'list' ? `<div class="card"><input class="inp" placeholder="Cari supplier / kategori…" data-in="flt" style="max-width:360px;margin-bottom:10px">${ui.table(
          [
            { h: 'Kode', f: (x) => ui.id(x.id) },
            { h: 'Nama', f: (x) => `<b>${esc(x.name)}</b><div class="tiny muted">${esc(x.city)}</div>` },
            { h: 'Kategori', f: (x) => esc(x.cat) },
            { h: 'Trading term', f: (x) => esc(x.term) },
            { h: 'Lead time', num: true, f: (x) => x.leadDays + ' hari' },
            { h: 'Rating', f: (x) => `${'★'.repeat(Math.round(x.rating))}<span class="muted">${'★'.repeat(5 - Math.round(x.rating))}</span> ${x.rating}` },
            { h: 'PO', num: true, f: (x) => s.pos.filter((p) => p.supplier === x.id).length },
            { h: 'Status', f: (x) => ui.status(x.status) },
          ],
          list,
          { rowAttr: (x) => `data-row="${esc((x.name + ' ' + x.cat).toLowerCase())}"` }
        )}<p class="tiny muted" style="margin:8px 0 0">Master supplier = <b>Cards</b> di HAWK (kolom CARD) ${ui.intBadge('TO VERIFY')}. Data supplier fiktif (DEMO).</p></div>`
        : `<div class="grid g-1-2"><div class="card" style="text-align:center"><h3>Rata-rata kinerja supplier</h3>${ui.gauge(U.sum(list, (x) => x.rating) / list.length / 5, 'skor / 5')}<b style="font-size:24px">${U.num(U.sum(list, (x) => x.rating) / list.length, 1)} / 5</b></div>
          <div class="card"><h3>On-time delivery & rating</h3>${list.map((x) => `<div class="row" style="padding:6px 0;flex-wrap:nowrap"><span class="small" style="width:220px">${esc(x.name)}</span><div style="flex:1">${ui.bar(x.onTime, x.onTime >= 0.9 ? 'ok' : 'warn')}</div><span class="small num" style="width:60px">${U.pct(x.onTime)}</span></div>`).join('')}</div></div>`}`;
    },
    actions: {
      flt(el) {
        const v = el.value.toLowerCase();
        document.querySelectorAll('tr[data-row]').forEach((r) => (r.style.display = r.dataset.row.includes(v) ? '' : 'none'));
      },
    },
  };

  /* ---------- NV-34 Quotation & Price Comparison ---------- */
  V[34] = {
    render(ctx) {
      const { s, L } = ctx;
      const withQ = U.uniq(s.quotations.map((x) => x.item));
      const item = L.item || ctx.q.item || ctx.q.q || withQ[0];
      const qs = s.quotations.filter((x) => x.item === item).sort((a, b) => a.price - b.price);
      const it = S.item(s, item);
      const h = s.priceHistory.find((x) => x.item === item);
      const best = qs[0];
      return `<div class="stack"><div class="card"><div class="row"><select class="inp" style="max-width:380px" data-ch="item" aria-label="Item">${withQ.map((i) => `<option value="${i}" ${i === item ? 'selected' : ''}>${esc(S.itemName(s, i))}</option>`).join('')}</select><span class="small muted">Satuan: ${esc(it.unit)} · Harga standar ${U.rp(it.price)}</span></div></div>
        <div class="grid g-2-1"><div class="card"><h3>Perbandingan penawaran</h3>${ui.table(
          [
            { h: 'Penawaran', f: (x) => `<span class="mono small">${x.id}</span>` },
            { h: 'Supplier', f: (x) => esc(S.supplierName(s, x.supplier)) + (x === best ? ' <span class="badge ok">Termurah</span>' : '') + (x.supplier === it.supplier ? ' <span class="badge gold">Utama</span>' : '') },
            { h: 'Harga', num: true, f: (x) => U.rp(x.price) },
            { h: 'Selisih', num: true, f: (x) => (x === best ? '—' : '+' + U.pct((x.price - best.price) / best.price, 1)) },
            { h: 'Lead time', num: true, f: (x) => x.leadDays + ' hari' },
            { h: 'MOQ', num: true, f: (x) => x.moq },
            { h: 'Berlaku s/d', f: (x) => U.date(x.validUntil) },
            { h: 'Rating', num: true, f: (x) => S.supplier(s, x.supplier).rating },
          ],
          qs
        )}<div class="alert warn" style="margin-top:10px">${ui.icon('alert', 16)}<span>Harga terendah <b>tidak otomatis</b> dipilih: pertimbangkan lead time, MOQ, dan kinerja. Keputusan supplier tetap di Purchasing (dan BU Manager untuk supplier baru).</span></div></div>
        <div class="card"><h3>Riwayat harga ${h ? '— ' + esc(S.supplierName(s, h.supplier).split(' (')[0]) : ''}</h3>${h ? ui.line({ labels: h.points.map((p) => U.BULAN[+p[0].slice(5) - 1]), series: [{ name: 'Harga PO', color: '#c99a2e', values: h.points.map((p) => p[1]) }], fmt: (v) => U.num(v / 1000) + 'rb', h: 160 }) : ui.empty('Belum ada riwayat')}
          ${h ? `<p class="small">Perubahan 6 bulan: <b class="${h.points[5][1] > h.points[0][1] ? 'bad-t' : 'ok-t'}">${U.pct((h.points[5][1] - h.points[0][1]) / h.points[0][1], 1)}</b></p>` : ''}<p class="tiny muted">Integrasi: <span class="mono">quotation.compare</span> ${ui.intBadge('NEW INTEGRATION REQUIRED')} — HAWK PO punya field PRICE LEVEL.</p></div></div></div>`;
    },
    actions: {
      item(el, ctx) {
        ctx.L.item = el.value;
        ctx.rerender();
      },
    },
  };

  /* ---------- NV-35 PO Creation & Editing (mirrors HAWK PO entry fields) ---------- */
  V[35] = {
    render(ctx) {
      const { s, L } = ctx;
      const qp = ctx.q;
      const drafts = s.pos.filter((p) => p.status === 'DRAFT');
      const po = s.pos.find((p) => p.id === (qp.id || L.id)) || drafts[0];
      if (!po) return `<div class="card" style="max-width:640px"><h3>Belum ada draft PO</h3><p class="small">PO dibuat dari kebutuhan MRF yang disetujui (konsolidasi) agar setiap PO selalu tertaut ke MRF asal.</p><button class="btn" data-nav="32">Ke konsolidasi MRF (NV-32)</button></div>`;
      const t = S.poTotals(s, po);
      const edit = po.status === 'DRAFT' && ctx.can('po.update');
      const sup = S.supplier(s, po.supplier);
      return `<div class="stack"><div class="card" style="background:var(--black);color:#fff;border-color:#000;padding:12px 16px"><div class="row between"><b style="letter-spacing:.04em">DATA ENTRY | PURCHASE ORDER</b><span class="mono" style="font-size:16px;color:var(--champagne)">${po.id}</span></div></div>
        ${drafts.length > 1 ? `<div class="row small">Draft lain: ${drafts.filter((d) => d.id !== po.id).map((d) => `<button class="link" data-nav="35" data-q='${q({ id: d.id })}'>${d.id}</button>`).join(' ')}</div>` : ''}
        <div class="card"><div class="grid g3"><div class="field"><label>SUPPLIER</label><input class="inp" readonly value="${esc(sup.name)}"></div><div><div class="tiny muted">TRADING TERM ›</div><b>${esc(po.term)}</b><div class="tiny muted" style="margin-top:6px">PRICE LEVEL ›</div><b>Penawaran ${esc((s.quotations.find((x) => x.supplier === po.supplier && x.item === po.lines[0].item) || {}).id || 'standar')}</b></div><div><label class="small"><input type="checkbox" disabled> CONSIGNMENT</label>${po.emergency ? '<div><span class="badge bad">PEMBELIAN DARURAT</span></div>' : ''}</div></div>
          <div class="grid g2" style="margin-top:12px"><div class="field"><label>DELIVER TO</label><input class="inp" readonly value="${esc(S.whName(s, po.deliverTo))}"></div><div class="field"><label>DATE</label><input class="inp" readonly value="${U.date(po.date)}"></div>
          <div class="field"><label>MEMO</label><input class="inp" id="po-memo" value="${esc(po.memo)}" ${edit ? '' : 'readonly'}></div><div class="field"><label>REFERENCE ID</label><input class="inp" readonly value="${po.id}"></div>
          <div class="field"><label>MRF ASAL</label><div class="row">${U.uniq(po.lines.flatMap((l) => (l.mrfRefs || []).map((m) => m.mrf))).map(ui.id).join(' ') || '—'}</div></div><div class="field"><label>PROMISED DATE</label><input class="inp" type="date" id="po-prom" value="${po.promised}" ${edit ? '' : 'readonly'}></div></div></div>
        <div class="card">${ui.table(
          [
            { h: '#', f: (l, i) => i + 1 },
            { h: 'ITEM CODE', f: (l) => `<span class="mono">${l.item}</span>` },
            { h: 'DESCRIPTION', f: (l) => esc(S.itemName(s, l.item)) },
            { h: 'ORDER', num: true, f: (l) => l.qty },
            { h: 'RECEIVED', num: true, f: (l) => l.received },
            { h: 'BACKORDER', num: true, f: (l) => l.qty - l.received },
            { h: 'UNIT', f: (l) => esc(S.item(s, l.item).unit) },
            { h: 'PRICE', num: true, f: (l, i) => (edit ? `<input class="qty" style="width:100px" type="number" id="po-price-${i}" value="${l.price}">` : U.rp(l.price)) },
            { h: 'DISC', num: true, f: (l) => U.pct(l.disc || 0) },
            { h: 'TOTAL', num: true, f: (l) => U.rp(l.qty * l.price * (1 - (l.disc || 0))) },
            { h: 'JOB', f: () => `<span class="mono tiny">${esc((S.ccOfOrg(s, S.wh(s, po.deliverTo).org) || {}).id || '')}</span>` },
            { h: 'TAX', f: () => 'PPN 11%' },
          ],
          po.lines
        )}
        <div class="grid g2" style="margin-top:12px"><dl class="kv"><dt>DELIVERY STATUS</dt><dd>${ui.status(po.status === 'RECEIVED' ? 'RECEIVED' : po.status === 'PARTIAL' ? 'PARTIAL' : 'OPEN')}</dd><dt>PO STATUS</dt><dd>${ui.status(po.status)}</dd><dt>APPROVED BY</dt><dd>${esc(S.userName(s, po.approvedBy))}</dd><dt>Rantai approval</dt><dd>${vh.chain(s, po.chain || S.poChain(s, po), po.approvals, po.status)}</dd></dl>
        <dl class="kv"><dt>SUBTOTAL</dt><dd class="num">${U.rp(t.subtotal)}</dd><dt>FREIGHT</dt><dd>${edit ? `<input class="inp" type="number" id="po-freight" value="${po.freight}" style="text-align:right">` : `<span class="num">${U.rp(t.freight)}</span>`}</dd><dt>TAX</dt><dd class="num">${U.rp(t.tax)}</dd><dt>TOTAL AMOUNT</dt><dd class="num" style="font-size:18px">${U.rp(t.total)}</dd></dl></div></div>
        <div class="row" style="justify-content:flex-end">${edit ? `<button class="btn ghost" data-a="save">Simpan</button><button class="btn" data-a="submit">Ajukan approval →</button>` : `<button class="btn ghost" data-nav="36" data-q='${q({ id: po.id })}'>Buka di PO Register</button>`}</div></div>`;
    },
    actions: {
      save(el, ctx, silent) {
        const po = ctx.s.pos.find((p) => p.id === (ctx.q.id || ctx.L.id)) || ctx.s.pos.find((p) => p.status === 'DRAFT');
        return ctx.act('po.update', { id: po.id, memo: ctx.val('po-memo'), promised: ctx.val('po-prom'), freight: +ctx.val('po-freight') || 0, lines: po.lines.map((l, i) => ({ price: +ctx.val('po-price-' + i) })) }, silent === true ? null : 'Draft PO disimpan');
      },
      submit(el, ctx) {
        const po = ctx.s.pos.find((p) => p.id === (ctx.q.id || ctx.L.id)) || ctx.s.pos.find((p) => p.status === 'DRAFT');
        const r = V[35].actions.save(el, ctx, true);
        if (!r.ok) return;
        const r2 = ctx.act('po.submit', { id: po.id }, (p) => `${p.id} diajukan → ${p.chain.map((c) => HAWK.ROLE_LABEL[c]).join(' → ')}`);
        if (r2.ok) HAWK.go(36, { id: po.id });
      },
    },
  };

  /* ---------- NV-36 PO Register, Detail & Approval ---------- */
  V[36] = {
    render(ctx) {
      const { s, L, q: qq } = ctx;
      const cur = L.t || 'ALL';
      const groups = { ALL: null, WAIT: ['DRAFT', 'PENDING_APPROVAL'], OPEN: ['APPROVED', 'SENT', 'PARTIAL'], DONE: ['RECEIVED', 'CLOSED'] };
      const list = s.pos.filter((p) => (!groups[cur] || groups[cur].includes(p.status)) && ctx.inScope(S.wh(s, p.deliverTo).org));
      const sel = s.pos.find((p) => p.id === (L.sel || qq.id)) || list[0];
      const detail = sel
        ? (() => {
            const t = S.poTotals(s, sel);
            const step = S.poNextApprover(s, sel);
            const mine = step === ctx.role;
            return `<div class="card"><div class="card-head"><h3>${ui.id(sel.id)} ${ui.status(sel.status)}</h3><span class="r">${sel.emergency ? '<span class="badge bad">DARURAT</span>' : ''}</span></div>
            <dl class="kv"><dt>Supplier</dt><dd>${ui.id(sel.supplier)} ${esc(S.supplierName(s, sel.supplier))}</dd><dt>Deliver to</dt><dd>${esc(S.whName(s, sel.deliverTo))}</dd><dt>Promised</dt><dd>${U.date(sel.promised)}</dd><dt>Total</dt><dd><b>${U.rp(t.total)}</b></dd><dt>Approval</dt><dd>${vh.chain(s, sel.chain || S.poChain(s, sel), sel.approvals, sel.status)}</dd><dt>MRF asal</dt><dd>${U.uniq(sel.lines.flatMap((l) => (l.mrfRefs || []).map((m) => m.mrf))).map(ui.id).join(' ') || '— (replenishment)'}</dd></dl>
            <div style="margin-top:10px">${ui.table([{ h: 'Item', f: (l) => esc(S.itemName(s, l.item)) }, { h: 'Order', num: true, f: (l) => l.qty }, { h: 'Received', num: true, f: (l) => l.received }, { h: 'Backorder', num: true, f: (l) => l.qty - l.received }, { h: 'Harga', num: true, f: (l) => U.rp(l.price) }], sel.lines)}</div>
            <div class="hr"></div><div class="row">${sel.status === 'DRAFT' && ctx.can('po.update') ? `<button class="btn ghost" data-nav="35" data-q='${q({ id: sel.id })}'>Edit draft</button>` : ''}
            ${step ? (mine ? `<button class="btn bad" data-a="reject" data-p="${sel.id}">Tolak</button><button class="btn ok" data-a="approve" data-p="${sel.id}">${ui.icon('check')} Setujui</button>` : `<span class="badge warn">Menunggu ${esc(HAWK.ROLE_LABEL[step])}</span>`) : ''}
            ${sel.status === 'APPROVED' && ctx.can('po.send') ? `<button class="btn" data-a="send" data-p="${sel.id}">${ui.icon('arrow')} Kirim ke vendor</button>` : ''}
            ${['SENT', 'PARTIAL'].includes(sel.status) && ctx.can('grn.receive') ? `<button class="btn" data-nav="42" data-q='${q({ po: sel.id })}'>Terima barang</button>` : ''}</div>
            <p class="tiny muted" style="margin:10px 0 0">PO = komitmen, bukan beban/tagihan. "Kirim ke vendor" disimulasikan — tidak ada email keluar.</p></div>`;
          })()
        : ui.empty('Tidak ada PO');
      return `${ui.tabs('t', [['ALL', 'Semua', s.pos.length], ['WAIT', 'Draft & approval'], ['OPEN', 'Berjalan'], ['DONE', 'Diterima']], cur)}
        <div class="grid g-2-1"><div class="card">${ui.table(
          [
            { h: 'No', f: (p, i) => i + 1 },
            { h: 'PO ID', f: (p) => ui.id(p.id) + (p.emergency ? ' <span class="badge bad">!</span>' : '') },
            { h: 'Supplier', f: (p) => esc(S.supplierName(s, p.supplier).replace(' (DEMO)', '')) },
            { h: 'Deliver to', f: (p) => esc(S.whName(s, p.deliverTo).replace('Gudang ', '')) },
            { h: 'Tanggal', f: (p) => U.date(p.date) },
            { h: 'Nilai', num: true, f: (p) => U.rp(S.poTotals(s, p).total) },
            { h: 'Status', f: (p) => ui.status(p.status) },
            { h: '', f: (p) => `<button class="btn sm ghost" data-a="sel" data-p="${p.id}">Detail</button>` },
          ],
          list,
          { rowCls: (p) => (sel && p.id === sel.id ? 'sel' : '') }
        )}</div>${detail}</div>`;
    },
    actions: {
      sel(el, ctx) {
        ctx.L.sel = el.dataset.p;
        ctx.rerender();
      },
      approve(el, ctx) {
        ctx.act('po.decide', { id: el.dataset.p, decision: 'APPROVE' }, (p) => `${p.id}: ${ui.statusLabel(p.status)}`);
      },
      reject(el, ctx) {
        ui.ask('Tolak ' + el.dataset.p, 'Alasan penolakan', (note) => ctx.act('po.decide', { id: el.dataset.p, decision: 'REJECT', note }, 'PO dikembalikan ke draft'), { danger: true, ok: 'Tolak' });
      },
      send(el, ctx) {
        ctx.act('po.send', { id: el.dataset.p }, (p) => `${p.id} dikirim ke vendor — muncul di antrean penerimaan gudang`);
      },
    },
  };

  /* ---------- NV-37 Emergency Purchase ---------- */
  V[37] = {
    render(ctx) {
      const { s } = ctx;
      const rule = s.approvalRules.find((r) => r.doc === 'EMERGENCY_PO');
      const list = s.pos.filter((p) => p.emergency);
      const whs = s.warehouses.filter((w) => ctx.inScope(w.org));
      return `<div class="stack"><div class="alert bad">${ui.icon('alert', 16)}<span><b>Pembelian darurat</b> hanya untuk kebutuhan operasional mendesak (mis. AC rusak saat tamu di ruang). Batas ${U.rp(rule.max)} termasuk PPN · dibuat oleh ${rule.chain.map((r) => HAWK.ROLE_LABEL[r]).join('/')}/Purchasing · <b>approval susulan ${HAWK.ROLE_LABEL[rule.postApproval]} ≤ ${rule.slaHours} jam</b> (AR-08, dapat diubah di NV-09).</span></div>
        <div class="grid g2"><div class="card"><h3>Buat PO darurat</h3>${ctx.can('po.emergency') ? `<div class="stack"><div class="field"><label>Item</label><select class="inp" id="em-item">${s.items.map((i) => `<option value="${i.id}" ${i.id === 'SP-001' ? 'selected' : ''}>${esc(i.name)} — ${U.rp(i.price)}</option>`).join('')}</select></div>
          <div class="grid g2"><div class="field"><label>Qty</label><input class="inp" id="em-qty" type="number" value="2" min="1"></div><div class="field"><label>Lokasi kirim</label><select class="inp" id="em-wh">${whs.map((w) => `<option value="${w.id}">${esc(w.name)}</option>`).join('')}</select></div></div>
          <div class="field"><label>Supplier</label><select class="inp" id="em-sup">${s.suppliers.map((x) => `<option value="${x.id}" ${x.id === 'SUP-004' ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Alasan darurat (min. 10 karakter)</label><textarea class="inp" id="em-reason" rows="2">AC Ruang Treatment 3 mati saat ada tamu</textarea></div>
          <button class="btn bad" data-a="create">Buat & kirim PO darurat</button></div>` : '<p class="small muted">Role ini tidak dapat membuat PO darurat.</p>'}</div>
        <div class="card"><h3>PO darurat</h3>${ui.table([{ h: 'PO', f: (p) => ui.id(p.id) }, { h: 'Alasan', f: (p) => esc(p.emergencyReason || p.memo) }, { h: 'Total', num: true, f: (p) => U.rp(S.poTotals(s, p).total) }, { h: 'Status', f: (p) => ui.status(p.status) }, { h: 'Approval susulan', f: (p) => (p.postApproval === 'PENDING' ? (ctx.can('po.postApprove') ? `<button class="btn sm ok" data-a="post" data-p="${p.id}">Setujui</button> <button class="btn sm bad" data-a="postNo" data-p="${p.id}">Tolak</button>` : '<span class="badge warn">Menunggu BU Manager</span>') : ui.status(p.postApproval)) }], list, { empty: 'Belum ada PO darurat.' })}</div></div></div>`;
    },
    actions: {
      create(el, ctx) {
        ctx.act('po.emergency', { item: ctx.val('em-item'), qty: +ctx.val('em-qty'), wh: ctx.val('em-wh'), supplier: ctx.val('em-sup'), reason: ctx.val('em-reason') }, (p) => `${p.id} darurat dikirim — approval susulan BU Manager`);
      },
      post(el, ctx) {
        ctx.act('po.postApprove', { id: el.dataset.p, decision: 'APPROVE' }, 'Approval susulan dicatat');
      },
      postNo(el, ctx) {
        ui.ask('Tolak approval susulan', 'Alasan', (note) => ctx.act('po.postApprove', { id: el.dataset.p, decision: 'REJECT', note }, 'Ditolak — eskalasi ke Owner'), { danger: true });
      },
    },
  };
})();
