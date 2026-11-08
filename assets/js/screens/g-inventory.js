/* Module G — Warehouse & Inventory (NV-38..46). Inventory/transfer = existing HAWK engine (TO VERIFY); bin/put-away = NEW. */
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
  const LT = { RECEIPT: ['Penerimaan', 'ok'], ISSUE: ['Pemakaian', 'info'], TRANSFER_OUT: ['Transfer keluar', 'warn'], TRANSFER_IN: ['Transfer masuk', 'ok'], ADJUST: ['Penyesuaian', 'violet'], RETURN: ['Retur', 'gold'] };
  const ltype = (t) => `<span class="badge ${(LT[t] || ['', ''])[1]}">${(LT[t] || [t])[0]}</span>`;
  const whsFor = (ctx) => ctx.s.warehouses.filter((w) => ctx.inScope(w.org));
  const stockFor = (ctx) => {
    const ids = whsFor(ctx).map((w) => w.id);
    return ctx.s.stock.filter((x) => ids.includes(x.wh));
  };
  const health = (x) => (x.onHand <= 0 ? ['Habis', 'bad'] : x.onHand < x.min ? ['Di bawah minimum', 'bad'] : x.onHand > x.max ? ['Di atas maksimum', 'warn'] : ['Normal', 'ok']);
  const whSel = (ctx, id, cur, all) => `<select class="inp" style="max-width:260px" data-ch="${id}" aria-label="Gudang">${all ? `<option value="">Semua gudang</option>` : ''}${whsFor(ctx).map((w) => `<option value="${w.id}" ${w.id === cur ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}</select>`;
  const suggestBin = (s, whId, item) => {
    const r = S.stock(s, whId, item);
    const wh = S.wh(s, whId);
    return (r && r.bin) || wh.bins[0];
  };

  /* ---------- NV-38 Inventory Control Dashboard ---------- */
  V[38] = {
    render(ctx) {
      const { s, user } = ctx;
      const st = stockFor(ctx);
      const val = U.sum(st, (x) => x.onHand * S.avgCost(s, x.item));
      const low = st.filter((x) => x.onHand < x.min);
      const incomingPo = s.pos.filter((p) => ['SENT', 'PARTIAL'].includes(p.status) && ctx.inScope(S.wh(s, p.deliverTo).org));
      const transit = s.transfers.filter((t) => ['REQUESTED', 'IN_TRANSIT'].includes(t.status));
      const putaway = s.grns.filter((g) => g.status === 'POSTED');
      const byWh = whsFor(ctx).map((w) => ({ w, v: U.sum(s.stock.filter((x) => x.wh === w.id), (x) => x.onHand * S.avgCost(s, x.item)) }));
      const moves = s.ledger.filter((l) => whsFor(ctx).some((w) => w.id === l.wh)).slice(0, 8);
      return `<div class="stack"><div class="grid g4 keep2">${ui.kpi('Nilai persediaan', U.rp(val, { short: true }), st.length + ' baris item-lokasi · harga standar', 'g-blue', 'box')}${ui.kpi('Di bawah minimum', low.length, 'perlu MRF / transfer', low.length ? 'g-gold' : '', 'alert')}${ui.kpi('Barang masuk', incomingPo.length + transit.length, incomingPo.length + ' PO · ' + transit.length + ' transfer', '', 'truck')}${ui.kpi('Menunggu put-away', putaway.length, 'GRN terposting, belum di rak', '', 'rack')}</div>
        <div class="grid g-2-1"><div class="card"><div class="card-head"><h3>Stok kritis</h3><span class="r"><button class="btn sm ghost" data-nav="40">Semua saldo</button></span></div>${ui.table(
          [
            { h: 'Gudang', f: (x) => esc(S.whName(s, x.wh).replace('Gudang ', '')) },
            { h: 'Item', f: (x) => `<button class="link" data-nav="40" data-q='${q({ q: x.item })}'>${esc(S.itemName(s, x.item))}</button>` },
            { h: 'On hand', num: true, f: (x) => x.onHand },
            { h: 'Reservasi', num: true, f: (x) => x.reserved },
            { h: 'Min', num: true, f: (x) => x.min },
            { h: 'Status', f: (x) => { const h = health(x); return `<span class="badge ${h[1]}">${h[0]}</span>`; } },
          ],
          low,
          { empty: 'Semua stok di atas minimum.' }
        )}</div>
        <div class="card"><h3>Meja kerja Gudang</h3>${vh.taskList(ctx, HAWK.tasks(s, user).slice(0, 6))}</div></div>
        <div class="grid g2"><div class="card"><h3>Nilai stok per gudang (Rp jt)</h3>${ui.bars({ labels: byWh.map((x) => x.w.name.replace('Gudang ', '')), series: [{ name: 'Nilai', color: '#2f6fde', values: byWh.map((x) => Math.round(x.v / 1e5) / 10) }], h: 170 })}</div>
        <div class="card"><div class="card-head"><h3>Pergerakan terbaru</h3><span class="r"><button class="btn sm ghost" data-nav="40" data-q='${q({ t: 'ledger' })}'>Ledger</button></span></div>${moves.length ? ui.table([{ h: 'Waktu', f: (l) => U.datetime(l.ts) }, { h: 'Jenis', f: (l) => ltype(l.type) }, { h: 'Item', f: (l) => esc(S.itemName(s, l.item)) }, { h: 'Qty', num: true, f: (l) => (l.qty > 0 ? '+' : '') + l.qty }, { h: 'Ref', f: (l) => ui.id(l.ref) }], moves) : ui.empty('Belum ada pergerakan baru sejak data demo dimuat.')}</div></div></div>`;
    },
  };

  /* ---------- NV-39 Warehouse, Rack & Bin ---------- */
  V[39] = {
    render(ctx) {
      const { s, L } = ctx;
      const whs = whsFor(ctx);
      const wh = S.wh(s, L.wh || ctx.q.wh) || whs[0];
      const rows = s.stock.filter((x) => x.wh === wh.id);
      const canAdd = ctx.can('bin.add');
      return `<div class="stack"><div class="card"><div class="row">${whSel(ctx, 'wh', wh.id)}<span class="small muted">${wh.racks.length} rak · ${wh.bins.length} bin · lokasi: ${esc(S.orgName(s, wh.org))}</span></div></div>
        <div class="grid g-2-1"><div class="card"><h3>Peta rak & bin — ${esc(wh.name)}</h3>${wh.racks.map((r) => `<div style="margin-bottom:12px"><div class="small" style="font-weight:700;margin-bottom:6px">Rak ${esc(r)}</div><div class="grid g3">${wh.bins.filter((b) => b.split('-')[1] === r).map((b) => {
          const items = rows.filter((x) => x.bin === b);
          return `<div class="p7" style="--pc:${items.length ? '#c99a2e' : '#ddd'}"><div class="nm">${ui.icon('rack', 14)} <span class="mono">${esc(b)}</span></div>${items.map((x) => `<div class="tiny">${esc(S.itemName(s, x.item))} · <b>${x.onHand}</b></div>`).join('') || '<div class="tiny muted">kosong</div>'}</div>`;
        }).join('')}</div></div>`).join('')}<p class="tiny muted">QR bin = kode bin (format <span class="mono">KOD-R-NN</span>). Data rak/bin tidak terlihat di HAWK v2.11.6 → ${ui.intBadge('NEW INTEGRATION REQUIRED')}.</p></div>
        <div class="card" style="align-self:start"><h3>${ui.icon('plus', 16)} Tambah bin</h3>${canAdd ? `<div class="field"><label>Kode bin</label><input class="inp" id="bin-code" placeholder="${esc(wh.bins[0].split('-')[0])}-C-01"></div><button class="btn block" style="margin-top:10px" data-a="add">Tambah ke ${esc(wh.name)}</button><p class="tiny muted">Validasi: format kode & tidak duplikat. Rak baru otomatis dibuat.</p>` : '<p class="small muted">Hanya Gudang / Admin yang dapat menambah bin.</p>'}</div></div></div>`;
    },
    actions: {
      wh(el, ctx) {
        ctx.L.wh = el.value;
        ctx.rerender();
      },
      add(el, ctx) {
        const wh = ctx.L.wh || whsFor(ctx)[0].id;
        ctx.act('bin.add', { wh, bin: ctx.val('bin-code').trim().toUpperCase() }, 'Bin ditambahkan');
      },
    },
  };

  /* ---------- NV-40 Stock Balance, Item Details & Ledger ---------- */
  V[40] = {
    render(ctx) {
      const { s, L } = ctx;
      const cur = L.t || ctx.q.t || 'bal';
      const item = L.item !== undefined ? L.item : ctx.q.q && S.item(s, ctx.q.q) ? ctx.q.q : '';
      const wh = L.wh || '';
      const st = stockFor(ctx).filter((x) => (!wh || x.wh === wh) && (!item || x.item === item));
      const led = s.ledger.filter((l) => whsFor(ctx).some((w) => w.id === l.wh) && (!wh || l.wh === wh) && (!item || l.item === item));
      const it = item && S.item(s, item);
      const filters = `<div class="card"><div class="row">${whSel(ctx, 'wh', wh, true)}<select class="inp" style="max-width:300px" data-ch="item" aria-label="Item"><option value="">Semua item</option>${s.items.map((i) => `<option value="${i.id}" ${i.id === item ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select><span class="small muted">Sumber: <span class="mono">stock.query</span> ${ui.intBadge('TO VERIFY')} (kolom SOURCE/REQUEST SOH di PR HAWK)</span></div></div>`;
      const itemCard = it
        ? `<div class="card"><div class="row" style="align-items:flex-start"><div style="font-size:36px">${vh.thumb(it)}</div><div style="flex:1"><h3 style="margin:0">${esc(it.name)} ${ui.p7(it.p)}</h3><div class="small muted">${it.id} · barcode ${it.barcode} · ${esc(it.unit)} · ${esc(it.cat)} · ${it.routine ? 'rutin' : 'non-rutin'}</div><div class="small">Harga standar ${U.rp(it.price)} · supplier utama ${ui.id(it.supplier)}</div></div><div style="text-align:right"><div class="tiny muted">Total on hand semua gudang</div><b style="font-size:22px">${S.totalStock(s, it.id)}</b> ${esc(it.unit)}</div></div></div>`
        : '';
      const bal = ui.table(
        [
          { h: 'Gudang', f: (x) => esc(S.whName(s, x.wh)) },
          { h: 'Item', f: (x) => `<button class="link" data-a="pick" data-p="${x.item}">${esc(S.itemName(s, x.item))}</button>` },
          { h: 'Bin', f: (x) => `<span class="mono small">${esc(x.bin || '—')}</span>` },
          { h: 'On hand', num: true, f: (x) => x.onHand },
          { h: 'Reservasi', num: true, f: (x) => x.reserved },
          { h: 'Tersedia', num: true, f: (x) => `<b>${x.onHand - x.reserved}</b>` },
          { h: 'Min / Maks', num: true, f: (x) => `${x.min} / ${x.max}` },
          { h: 'Nilai', num: true, f: (x) => U.rp(x.onHand * S.avgCost(s, x.item)) },
          { h: 'Status', f: (x) => { const h = health(x); return `<span class="badge ${h[1]}">${h[0]}</span>`; } },
        ],
        st,
        { foot: `<td colspan="3"><b>Total</b></td><td class="num"><b>${U.sum(st, (x) => x.onHand)}</b></td><td class="num">${U.sum(st, (x) => x.reserved)}</td><td class="num">${U.sum(st, (x) => x.onHand - x.reserved)}</td><td></td><td class="num"><b>${U.rp(U.sum(st, (x) => x.onHand * S.avgCost(s, x.item)))}</b></td><td></td>` }
      );
      const ledg = ui.table(
        [
          { h: 'ID', f: (l) => `<span class="mono tiny">${l.id}</span>` },
          { h: 'Waktu', f: (l) => U.datetime(l.ts) },
          { h: 'Jenis', f: (l) => ltype(l.type) },
          { h: 'Gudang', f: (l) => esc(S.whName(s, l.wh).replace('Gudang ', '')) },
          { h: 'Item', f: (l) => esc(S.itemName(s, l.item)) },
          { h: 'Qty', num: true, f: (l) => `<b class="${l.qty < 0 ? 'bad-t' : 'ok-t'}">${l.qty > 0 ? '+' : ''}${l.qty}</b>` },
          { h: 'Referensi', f: (l) => ui.id(l.ref) },
          { h: 'Cost center', f: (l) => `<span class="mono tiny">${esc(l.cc || '—')}</span>` },
          { h: 'Oleh', f: (l) => esc(S.userName(s, l.by)) },
          { h: 'Catatan', f: (l) => `<span class="tiny">${esc(l.note || '')}</span>` },
        ],
        led,
        { empty: 'Belum ada pergerakan untuk filter ini.', maxH: 520 }
      );
      return `<div class="stack">${filters}${itemCard}${ui.tabs('t', [['bal', 'Saldo stok', st.length], ['ledger', 'Ledger pergerakan', led.length]], cur)}<div class="card">${cur === 'bal' ? bal : ledg}</div>
        <p class="tiny muted">Tersedia = on hand − reservasi MRF. Reservasi dibuat saat MRF disetujui dan dilepas saat diserahkan. Ledger adalah sumber tunggal pergerakan — tidak ada buku stok kedua.</p></div>`;
    },
    actions: {
      wh(el, ctx) {
        ctx.L.wh = el.value;
        ctx.rerender();
      },
      item(el, ctx) {
        ctx.L.item = el.value;
        ctx.rerender();
      },
      pick(el, ctx) {
        ctx.L.item = el.dataset.p;
        ctx.rerender();
      },
    },
  };

  /* ---------- NV-41 Incoming Deliveries / Receiving Queue ---------- */
  V[41] = {
    render(ctx) {
      const { s } = ctx;
      const pos = s.pos.filter((p) => ['SENT', 'PARTIAL'].includes(p.status) && ctx.inScope(S.wh(s, p.deliverTo).org));
      const tr = s.transfers.filter((t) => ['REQUESTED', 'IN_TRANSIT'].includes(t.status));
      const grnR = s.grns.filter((g) => g.status === 'RECEIVED');
      const grnP = s.grns.filter((g) => g.status === 'POSTED');
      const late = (p) => p.promised < s.meta.demoDate;
      return `<div class="stack"><div class="grid g4 keep2">${ui.kpi('PO menunggu diterima', pos.length, pos.filter(late).length + ' lewat janji', 'g-gold', 'truck')}${ui.kpi('Transfer masuk', tr.length, tr.filter((t) => t.status === 'IN_TRANSIT').length + ' dalam perjalanan', '', 'arrow')}${ui.kpi('Fisik diterima, belum posting', grnR.length, 'GRN RECEIVED', '', 'check')}${ui.kpi('Menunggu put-away', grnP.length, 'GRN POSTED', '', 'rack')}</div>
        <div class="card"><h3>${ui.icon('truck', 16)} Purchase Order masuk</h3>${ui.table(
          [
            { h: 'PO', f: (p) => ui.id(p.id) + (p.emergency ? ' <span class="badge bad">DARURAT</span>' : '') },
            { h: 'Supplier', f: (p) => esc(S.supplierName(s, p.supplier)) },
            { h: 'Deliver to', f: (p) => esc(S.whName(s, p.deliverTo)) },
            { h: 'Janji kirim', f: (p) => U.date(p.promised) + (late(p) ? ' <span class="badge bad">terlambat</span>' : '') },
            { h: 'Item', f: (p) => p.lines.map((l) => `${esc(S.itemName(s, l.item))} ${l.qty - l.received}`).join('<br>') },
            { h: 'MRF', f: (p) => U.uniq(p.lines.flatMap((l) => (l.mrfRefs || []).map((m) => m.mrf))).map(ui.id).join(' ') || '<span class="tiny muted">replenishment</span>' },
            { h: 'Status', f: (p) => ui.status(p.status) },
            { h: '', f: (p) => (ctx.can('grn.receive') ? `<button class="btn sm" data-nav="42" data-q='${q({ po: p.id })}'>Terima (checklist)</button>` : '') },
          ],
          pos,
          { empty: 'Tidak ada PO yang menunggu penerimaan.' }
        )}</div>
        <div class="grid g2"><div class="card"><h3>${ui.icon('arrow', 16)} Transfer antar cabang</h3>${ui.table(
          [
            { h: 'Transfer', f: (t) => ui.id(t.id) },
            { h: 'Rute', f: (t) => `${esc(S.whName(s, t.from).replace('Gudang ', ''))} → ${esc(S.whName(s, t.to).replace('Gudang ', ''))}` },
            { h: 'Item', f: (t) => t.lines.map((l) => `${esc(S.itemName(s, l.item))} × ${l.qty}`).join(', ') },
            { h: 'MRF', f: (t) => ui.id(t.mrf) },
            { h: 'Status', f: (t) => ui.status(t.status) },
            { h: '', f: (t) => (t.status === 'IN_TRANSIT' && ctx.can('transfer.receive') ? `<button class="btn sm ok" data-a="recv" data-p="${t.id}">Terima</button>` : t.status === 'REQUESTED' ? `<button class="btn sm ghost" data-nav="44">Kirim (NV-44)</button>` : '') },
          ],
          tr,
          { empty: 'Tidak ada transfer masuk.' }
        )}</div>
        <div class="card"><h3>${ui.icon('check', 16)} GRN dalam proses</h3>${ui.table(
          [
            { h: 'GRN', f: (g) => ui.id(g.id) },
            { h: 'PO', f: (g) => ui.id(g.po) },
            { h: 'Gudang', f: (g) => esc(S.whName(s, g.wh).replace('Gudang ', '')) },
            { h: 'Status', f: (g) => ui.status(g.status) },
            { h: '', f: (g) => (g.status === 'RECEIVED' ? `<button class="btn sm" data-nav="42" data-q='${q({ po: g.po })}'>Posting</button>` : `<button class="btn sm" data-nav="43" data-q='${q({ id: g.id })}'>Put-away</button>`) },
          ],
          grnR.concat(grnP),
          { empty: 'Tidak ada GRN yang tertunda.' }
        )}</div></div></div>`;
    },
    actions: {
      recv(el, ctx) {
        ctx.act('transfer.receive', { id: el.dataset.p }, (t) => `${t.id} diterima di ${S.whName(ctx.s, t.to)}${t.mrf ? ' — siap diserahkan ke ' + t.mrf : ''}`);
      },
    },
  };

  /* ---------- NV-42 PO Receiving, Item Checklist & Document Scan ---------- */
  V[42] = {
    render(ctx) {
      const { s, q: qq, L } = ctx;
      const open = s.pos.filter((p) => ['SENT', 'PARTIAL'].includes(p.status) && ctx.inScope(S.wh(s, p.deliverTo).org));
      const pending = s.grns.find((g) => g.status === 'RECEIVED' && (!qq.po || g.po === qq.po));
      const po = s.pos.find((p) => p.id === (L.po || qq.po)) || (pending && S.findRecord(s, pending.po).rec) || open[0];
      const grnRecv = po && s.grns.find((g) => g.po === po.id && g.status === 'RECEIVED');
      const lastPosted = po && s.grns.find((g) => g.po === po.id && g.status === 'POSTED');
      const steps = ui.stepper(['Pilih PO', 'Checklist fisik', 'Posting inventory', 'Put-away (NV-43)'], grnRecv ? 2 : lastPosted ? 3 : po ? 1 : 0);
      const pick = `<div class="card"><div class="row"><label class="small" for="rc-po"><b>PO</b></label><select class="inp" id="rc-po" style="max-width:420px" data-ch="po">${open.map((p) => `<option value="${p.id}" ${po && p.id === po.id ? 'selected' : ''}>${p.id} · ${esc(S.supplierName(s, p.supplier))} → ${esc(S.whName(s, p.deliverTo).replace('Gudang ', ''))}</option>`).join('') || '<option>—</option>'}</select>${po ? ui.status(po.status) : ''}</div></div>`;
      if (!po) return `<div class="stack">${steps}<div class="card">${ui.empty('Tidak ada PO yang menunggu penerimaan. PO harus berstatus "Dikirim ke vendor".')}<div style="text-align:center"><button class="btn ghost" data-nav="36">Ke PO Register</button></div></div></div>`;
      const mrfs = U.uniq(po.lines.flatMap((l) => (l.mrfRefs || []).map((m) => m.mrf)));
      const head = `<div class="card"><dl class="kv"><dt>Supplier</dt><dd>${ui.id(po.supplier)} ${esc(S.supplierName(s, po.supplier))}</dd><dt>Deliver to</dt><dd>${esc(S.whName(s, po.deliverTo))}</dd><dt>Janji kirim</dt><dd>${U.date(po.promised)}</dd><dt>MRF asal</dt><dd>${mrfs.map(ui.id).join(' ') || '— (replenishment)'}</dd></dl></div>`;
      if (grnRecv) {
        return `<div class="stack">${steps}${head}<div class="card"><div class="card-head"><h3>${ui.id(grnRecv.id)} ${ui.status(grnRecv.status)}</h3></div>
          <div class="alert warn">${ui.icon('alert', 16)}<span>Penerimaan <b>fisik</b> sudah dicatat, tetapi <b>stok belum bertambah</b>. Posting memindahkan qty diterima-baik ke bin staging & membuat jurnal <i>Dr Persediaan / Cr GRNI</i> (PENDING_REVIEW di Finance).</span></div>
          ${ui.table([{ h: 'Item', f: (l) => esc(S.itemName(s, l.item)) }, { h: 'Sisa PO', num: true, f: (l) => l.expected }, { h: 'Diterima', num: true, f: (l) => l.received }, { h: 'Rusak / ditolak', num: true, f: (l) => (l.damaged ? `<b class="bad-t">${l.damaged}</b>` : 0) }, { h: 'Diterima baik', num: true, f: (l) => `<b>${l.accepted}</b>` }, { h: 'Backorder', num: true, f: (l) => l.expected - l.received }, { h: 'Catatan', f: (l) => esc(l.note) }], grnRecv.lines)}
          <div class="small" style="margin-top:8px">Dokumen: ${grnRecv.docs.map((d) => `<span class="badge">${esc(d)}</span>`).join(' ')}</div>
          <div class="row" style="justify-content:flex-end;margin-top:12px">${ctx.can('grn.post') ? `<button class="btn" data-a="post" data-p="${grnRecv.id}">Posting ke inventory →</button>` : '<span class="badge warn">Menunggu Gudang/Finance memposting</span>'}</div></div></div>`;
      }
      L.chk = L.chk || {};
      const rows = po.lines.map((l, i) => ({ l, i, out: l.qty - l.received })).filter((r) => r.out > 0);
      return `<div class="stack">${steps}${pick}${head}
        ${lastPosted ? `<div class="alert ok">${ui.icon('check', 16)}<span>${lastPosted.id} terposting. Lanjutkan penyimpanan rak: <button class="link" data-nav="43" data-q='${q({ id: lastPosted.id })}'>Put-away ${lastPosted.id}</button>${po.status === 'PARTIAL' ? ' · sisa backorder dapat diterima di bawah.' : ''}</span></div>` : ''}
        <div class="grid g-2-1"><div class="card"><h3>Checklist item (cocokkan dengan barang fisik)</h3>${ui.table(
          [
            { h: '✓', f: (r) => `<input type="checkbox" data-ch="chk" data-k="${r.i}" ${L.chk[r.i] ? 'checked' : ''} aria-label="Sudah dicek">` },
            { h: 'Item', f: (r) => `<b>${esc(S.itemName(s, r.l.item))}</b><div class="tiny muted mono">${S.item(s, r.l.item).barcode}</div>` },
            { h: 'Order', num: true, f: (r) => r.l.qty },
            { h: 'Sudah diterima', num: true, f: (r) => r.l.received },
            { h: 'Sisa', num: true, f: (r) => `<b>${r.out}</b>` },
            { h: 'Qty datang', num: true, f: (r) => `<input class="qty" type="number" min="0" max="${r.out}" id="rc-q-${r.i}" value="${r.out}" aria-label="Qty datang">` },
            { h: 'Rusak', num: true, f: (r) => `<input class="qty" type="number" min="0" id="rc-d-${r.i}" value="0" aria-label="Qty rusak">` },
            { h: 'Catatan', f: (r) => `<input class="inp" id="rc-n-${r.i}" placeholder="opsional" style="min-width:120px">` },
          ],
          rows,
          { empty: 'Semua baris sudah diterima penuh.' }
        )}<p class="tiny muted" style="margin:8px 0 0">Qty datang &lt; sisa → PO menjadi <b>Diterima sebagian</b> (backorder tetap terbuka). Qty rusak dicatat sebagai <i>received rejected</i> (tab HAWK) dan tidak masuk stok.</p></div>
        <div class="card" style="align-self:start"><h3>${ui.icon('camera', 16)} Scan dokumen</h3><div class="scanbox" style="position:relative">${L.scanned ? `<div style="text-align:center"><div style="font-size:34px">📄</div><b class="small">surat_jalan_${esc(po.id)}.jpg</b><div class="tiny muted">tersimpan (simulasi)</div></div>` : `<div class="laser"></div><span class="small muted">Arahkan kamera ke surat jalan</span>`}</div>
          <button class="btn ghost block" style="margin-top:8px" data-a="scan">${L.scanned ? 'Scan ulang' : 'Ambil foto surat jalan (simulasi)'}</button>
          <p class="tiny muted">Tidak ada kamera/OCR nyata. File hanya dicatat sebagai lampiran GRN.</p>
          ${ctx.can('grn.receive') ? `<button class="btn block" style="margin-top:10px" data-a="receive" ${rows.length ? '' : 'disabled'}>Konfirmasi penerimaan fisik</button>` : '<p class="small muted">Hanya Gudang yang mengonfirmasi penerimaan.</p>'}</div></div></div>`;
    },
    actions: {
      po(el, ctx) {
        ctx.L.po = el.value;
        ctx.L.chk = {};
        ctx.L.scanned = false;
        ctx.rerender();
      },
      chk(el, ctx) {
        ctx.L.chk[el.dataset.k] = el.checked;
      },
      scan(el, ctx) {
        ctx.L.scanned = true;
        ctx.rerender();
      },
      receive(el, ctx) {
        const s = ctx.s;
        const open = s.pos.filter((p) => ['SENT', 'PARTIAL'].includes(p.status));
        const po = s.pos.find((p) => p.id === (ctx.L.po || ctx.q.po)) || open[0];
        const lines = po.lines.map((l, i) => {
          if (l.qty - l.received <= 0) return { received: 0 };
          return { received: +ctx.val('rc-q-' + i), damaged: +ctx.val('rc-d-' + i) || 0, note: ctx.val('rc-n-' + i) };
        });
        const docs = ctx.L.scanned ? [`surat_jalan_${po.id}.jpg (scan simulasi)`] : ['Surat jalan (belum difoto)'];
        const r = ctx.act('grn.receive', { po: po.id, lines, docs }, (g) => `${g.id}: penerimaan fisik dicatat — lanjut posting`);
        if (r.ok) {
          ctx.L.po = po.id;
          ctx.L.scanned = false;
        }
      },
      post(el, ctx) {
        const r = ctx.act('grn.post', { id: el.dataset.p }, (g) => `${g.id} terposting — stok +, jurnal GRNI ${g.journal || ''} menunggu review`);
        if (r.ok) HAWK.go(43, { id: r.data.id });
      },
    },
  };

  /* ---------- NV-43 Put-Away / QR Storage Confirmation ---------- */
  V[43] = {
    render(ctx) {
      const { s, q: qq, L } = ctx;
      const list = s.grns.filter((g) => g.status === 'POSTED');
      const g = s.grns.find((x) => x.id === (L.id || qq.id) && x.status === 'POSTED') || list[0];
      const done = s.grns.filter((x) => x.status === 'STORED').slice(0, 5);
      L.bins = L.bins || {};
      if (!g)
        return `<div class="stack"><div class="card">${ui.empty('Tidak ada barang yang menunggu disimpan di rak.')}</div><div class="card"><h3>Put-away terakhir</h3>${ui.table([{ h: 'GRN', f: (x) => ui.id(x.id) }, { h: 'PO', f: (x) => ui.id(x.po) }, { h: 'Diterima oleh', f: (x) => (x.receivedBy ? `${esc(x.receivedBy.name)}<div class="tiny muted">${esc(x.receivedBy.title)} · ${esc(x.receivedBy.branchName)}</div>` : esc(S.userName(s, x.receiver))) }, { h: 'Bin', f: (x) => x.lines.map((l) => `${esc(S.itemName(s, l.item))} → <span class="mono">${esc(l.bin || '—')}</span>`).join('<br>') }], done)}</div></div>`;
      const wh = S.wh(s, g.wh);
      const po = S.findRecord(s, g.po).rec;
      const release = g.lines.flatMap((gl) => ((po.lines.find((l) => l.item === gl.item) || {}).mrfRefs || []).map((r) => ({ ...r, item: gl.item })));
      return `<div class="stack">${list.length > 1 ? `<div class="row small">Antrean: ${list.map((x) => `<button class="link" data-a="sel" data-p="${x.id}">${x.id}</button>`).join(' ')}</div>` : ''}
        <div class="grid g-2-1"><div class="card"><div class="card-head"><h3>${ui.id(g.id)} → ${esc(wh.name)}</h3><span class="r">${ui.status(g.status)}</span></div>${g.receivedBy ? `<p class="tiny muted" style="margin:0 0 8px">Diterima oleh ${esc(S.assignmentText(g.receivedBy))}</p>` : ''}
        ${g.lines.map((l, i) => {
          const sug = suggestBin(s, g.wh, l.item);
          const v = L.bins[i] || '';
          return `<div class="itemcard" style="margin-bottom:10px"><div style="font-size:28px">${vh.thumb(S.item(s, l.item))}</div><div style="flex:1"><b>${esc(S.itemName(s, l.item))}</b><div class="small">${l.accepted} ${esc(S.item(s, l.item).unit)} diterima baik${l.damaged ? ` · <span class="bad-t">${l.damaged} rusak (tidak disimpan)</span>` : ''}</div><div class="tiny muted">Saran AI/aturan: bin item yang sama <span class="mono">${esc(sug)}</span></div></div>
            <div style="min-width:190px"><div class="row" style="flex-wrap:nowrap;gap:6px"><input class="inp mono" id="pa-${i}" value="${esc(v)}" placeholder="${esc(sug)}" data-in="bin" data-k="${i}" list="bins-${g.wh}" aria-label="Kode bin"><button class="btn sm ghost" data-a="scan" data-k="${i}" data-v="${esc(sug)}" title="Scan QR bin (simulasi)">${ui.icon('scan', 14)}</button></div>${v ? (wh.bins.includes(v) ? '<span class="badge ok">Bin valid</span>' : '<span class="badge bad">Bin tidak dikenal</span>') : ''}</div></div>`;
        }).join('')}
        <datalist id="bins-${g.wh}">${wh.bins.map((b) => `<option value="${b}">`).join('')}</datalist>
        <div class="row" style="justify-content:flex-end"><button class="btn" data-a="confirm" data-p="${g.id}">${ui.icon('check')} Konfirmasi simpan</button></div></div>
        <div class="card" style="align-self:start"><h3>Dampak konfirmasi</h3><ul class="small" style="padding-left:18px;margin:0"><li>Lokasi bin dicatat per item (audit).</li><li>Qty dilepas ke MRF yang menunggu PO ini (FIFO) dan <b>direservasi</b> untuk pemohon.</li><li>Stok on hand tidak berubah lagi (sudah bertambah saat posting).</li></ul>
          <div class="hr"></div><div class="small"><b>MRF yang akan dilepas</b></div>${release.length ? release.map((r) => `<div class="row small" style="margin-top:6px">${ui.id(r.mrf)} <span class="muted">${esc(S.itemName(s, r.item))}</span></div>`).join('') : '<p class="tiny muted">Tidak ada — replenishment stok.</p>'}
          <p class="tiny muted" style="margin-top:10px"><span class="mono">grn.putaway</span> ${ui.intBadge('NEW INTEGRATION REQUIRED')}</p></div></div></div>`;
    },
    actions: {
      sel(el, ctx) {
        ctx.L.id = el.dataset.p;
        ctx.L.bins = {};
        ctx.rerender();
      },
      bin(el, ctx) {
        ctx.L.bins[el.dataset.k] = el.value.trim().toUpperCase();
      },
      scan(el, ctx) {
        ctx.L.bins[el.dataset.k] = el.dataset.v;
        ui.toast('QR bin terbaca: ' + el.dataset.v, 'ok', 'Scan simulasi — tidak ada kamera');
        ctx.rerender();
      },
      confirm(el, ctx) {
        const g = ctx.s.grns.find((x) => x.id === el.dataset.p);
        const bins = {};
        g.lines.forEach((l, i) => (bins[i] = (ctx.val('pa-' + i) || ctx.L.bins[i] || '').trim().toUpperCase()));
        const r = ctx.act('grn.putaway', { id: g.id, bins }, (x) => `${x.id} tersimpan di rak — MRF terkait siap diserahkan (NV-45)`);
        if (r.ok) ctx.L.bins = {};
      },
    },
  };

  /* ---------- NV-44 Inter-Branch Stock Transfer ---------- */
  V[44] = {
    render(ctx) {
      const { s, L } = ctx;
      const cur = L.t || 'OPEN';
      const all = s.transfers.filter((t) => ctx.inScope(S.wh(s, t.from).org) || ctx.inScope(S.wh(s, t.to).org));
      const list = all.filter((t) => (cur === 'OPEN' ? ['REQUESTED', 'IN_TRANSIT'].includes(t.status) : t.status === 'RECEIVED'));
      const whs = whsFor(ctx);
      const from = L.from || whs[0].id;
      const avail = s.stock.filter((x) => x.wh === from && x.onHand - x.reserved > 0);
      return `<div class="stack"><div class="alert info">${ui.icon('arrow', 16)}<span>Transfer otomatis dibuat dari rencana fulfillment MRF (surplus donor = on hand − reservasi − minimum). Transfer manual untuk penyeimbangan stok. Setara tombol <b>TRANSFER</b> di register PO Request HAWK ${ui.intBadge('TO VERIFY')}.</span></div>
        <div class="grid g-2-1"><div><div style="margin-bottom:10px">${ui.tabs('t', [['OPEN', 'Berjalan', all.filter((t) => t.status !== 'RECEIVED').length], ['DONE', 'Selesai', all.filter((t) => t.status === 'RECEIVED').length]], cur)}</div><div class="card">${ui.table(
          [
            { h: 'Transfer', f: (t) => ui.id(t.id) },
            { h: 'Tanggal', f: (t) => U.date(t.date) },
            { h: 'Dari → Ke', f: (t) => `${esc(S.whName(s, t.from).replace('Gudang ', ''))} → <b>${esc(S.whName(s, t.to).replace('Gudang ', ''))}</b>` },
            { h: 'Item', f: (t) => t.lines.map((l) => `${esc(S.itemName(s, l.item))} × ${l.qty}`).join('<br>') },
            { h: 'MRF', f: (t) => (t.mrf ? ui.id(t.mrf) : '<span class="tiny muted">manual</span>') },
            { h: 'Status', f: (t) => ui.status(t.status) },
            { h: '', f: (t) => (t.status === 'REQUESTED' && ctx.can('transfer.dispatch') ? `<button class="btn sm" data-a="disp" data-p="${t.id}">Kirim</button>` : t.status === 'IN_TRANSIT' && ctx.can('transfer.receive') ? `<button class="btn sm ok" data-a="recv" data-p="${t.id}">Terima</button>` : '') },
          ],
          list,
          { empty: 'Tidak ada transfer.' }
        )}</div></div>
        <div class="card" style="align-self:start"><h3>${ui.icon('plus', 16)} Transfer manual</h3>${ctx.can('transfer.create') ? `<div class="stack"><div class="field"><label>Dari gudang</label>${whSel(ctx, 'from', from)}</div>
          <div class="field"><label>Ke gudang</label><select class="inp" id="tr-to">${s.warehouses.filter((w) => w.id !== from).map((w) => `<option value="${w.id}">${esc(w.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Item (tersedia)</label><select class="inp" id="tr-item">${avail.map((x) => `<option value="${x.item}">${esc(S.itemName(s, x.item))} — tersedia ${x.onHand - x.reserved}</option>`).join('') || '<option value="">Tidak ada stok tersedia</option>'}</select></div>
          <div class="field"><label>Qty</label><input class="inp" type="number" id="tr-qty" value="1" min="1"></div><div class="field"><label>Memo</label><input class="inp" id="tr-memo" value="Penyeimbangan stok"></div>
          <button class="btn block" data-a="create">Ajukan transfer</button></div>` : '<p class="small muted">Role ini tidak dapat membuat transfer.</p>'}</div></div></div>`;
    },
    actions: {
      from(el, ctx) {
        ctx.L.from = el.value;
        ctx.rerender();
      },
      create(el, ctx) {
        const from = ctx.L.from || whsFor(ctx)[0].id;
        ctx.act('transfer.create', { from, to: ctx.val('tr-to'), memo: ctx.val('tr-memo'), lines: [{ item: ctx.val('tr-item'), qty: +ctx.val('tr-qty') }] }, (t) => `${t.id} diajukan — stok asal direservasi`);
      },
      disp(el, ctx) {
        ctx.act('transfer.dispatch', { id: el.dataset.p }, (t) => `${t.id} dikirim — stok asal berkurang`);
      },
      recv(el, ctx) {
        ctx.act('transfer.receive', { id: el.dataset.p }, (t) => `${t.id} diterima${t.mrf ? ' — siap diserahkan ke ' + t.mrf : ''}`);
      },
    },
  };

  /* ---------- NV-45 Stock Issue, Usage & Return ---------- */
  V[45] = {
    render(ctx) {
      const { s, L } = ctx;
      const cur = L.t || 'MRF';
      const ready = s.mrfs.filter((m) => m.status === 'IN_FULFILLMENT' && ctx.inScope(m.branch)).map((m) => ({ m, f: S.mrfFulfillment(s, m) }));
      const whs = whsFor(ctx);
      const wh = L.wh || whs[0].id;
      const st = s.stock.filter((x) => x.wh === wh);
      let body = '';
      if (cur === 'MRF')
        body = `<div class="card">${ui.table(
          [
            { h: 'MRF', f: (r) => ui.id(r.m.id) },
            { h: 'Pemohon', f: (r) => esc(S.userName(s, r.m.requester)) + `<div class="tiny muted">${esc(S.orgName(s, r.m.branch))}</div>` },
            { h: 'Item', f: (r) => vh.mrfItems(s, r.m) },
            { h: 'Pemenuhan', f: (r) => vh.fulfillBar(s, r.m) },
            { h: 'Siap diserahkan', num: true, f: (r) => `<b>${r.f.ready - r.f.issued}</b>` },
            { h: 'Diserahkan', num: true, f: (r) => `${r.f.issued} / ${r.f.requested}` },
            { h: '', f: (r) => (r.f.ready - r.f.issued > 0 && ctx.can('mrf.issue') ? `<button class="btn sm" data-a="issue" data-p="${r.m.id}">Serahkan ${r.f.ready - r.f.issued}</button>` : `<span class="tiny muted">${r.f.ready - r.f.issued > 0 ? '' : 'menunggu transfer/pembelian'}</span>`) },
          ],
          ready,
          { empty: 'Tidak ada MRF dalam pemenuhan.' }
        )}<p class="tiny muted" style="margin:8px 0 0">Serah terima = <i>stock issue</i>: on hand & reservasi berkurang, ledger ISSUE ke cost center MRF, jurnal pemakaian <i>Dr Beban BHP (akun 7P) / Cr Persediaan</i>. Inilah saat biaya diakui — bukan saat PO atau penerimaan.</p></div>`;
      else
        body = `<div class="grid g-2-1"><div class="card"><h3>Stok ${esc(S.whName(s, wh))}</h3>${ui.table([{ h: 'Item', f: (x) => esc(S.itemName(s, x.item)) }, { h: 'On hand', num: true, f: (x) => x.onHand }, { h: 'Reservasi', num: true, f: (x) => x.reserved }, { h: 'Tersedia', num: true, f: (x) => `<b>${x.onHand - x.reserved}</b>` }], st)}</div>
          <div class="card" style="align-self:start"><h3>${cur === 'USE' ? 'Pemakaian langsung' : 'Retur ke gudang'}</h3><div class="stack"><div class="field"><label>Gudang</label>${whSel(ctx, 'wh', wh)}</div>
          <div class="field"><label>Item</label><select class="inp" id="iu-item">${(cur === 'USE' ? st.filter((x) => x.onHand - x.reserved > 0) : st).map((x) => `<option value="${x.item}">${esc(S.itemName(s, x.item))}</option>`).join('')}</select></div>
          <div class="field"><label>Qty</label><input class="inp" type="number" id="iu-qty" value="1" min="1"></div><div class="field"><label>Keterangan</label><input class="inp" id="iu-note" value="${cur === 'USE' ? 'Pemakaian harian treatment' : 'Sisa tidak terpakai dikembalikan'}"></div>
          <button class="btn block" data-a="${cur === 'USE' ? 'use' : 'ret'}" ${ctx.can(cur === 'USE' ? 'stock.issueDirect' : 'stock.return') ? '' : 'disabled'}>${cur === 'USE' ? 'Catat pemakaian' : 'Catat retur'}</button>
          <p class="tiny muted">${cur === 'USE' ? 'Pemakaian tanpa MRF hanya dari stok tersedia (tidak memakai reservasi MRF lain).' : 'Retur menambah stok & membalik beban 7P.'}</p></div></div></div>`;
      return `<div class="stack">${ui.tabs('t', [['MRF', 'Serah terima MRF', ready.filter((r) => r.f.ready > r.f.issued).length], ['USE', 'Pemakaian langsung'], ['RET', 'Retur']], cur)}${body}</div>`;
    },
    actions: {
      wh(el, ctx) {
        ctx.L.wh = el.value;
        ctx.rerender();
      },
      issue(el, ctx) {
        ctx.act('mrf.issue', { id: el.dataset.p }, (m) => { const f = S.mrfFulfillment(ctx.s, m); return `${m.id}: ${f.issued}/${f.requested} diserahkan${m.status === 'FULFILLED' ? ' — MRF terpenuhi' : ''}`; });
      },
      use(el, ctx) {
        ctx.act('stock.issueDirect', { wh: ctx.L.wh || whsFor(ctx)[0].id, item: ctx.val('iu-item'), qty: +ctx.val('iu-qty'), note: ctx.val('iu-note') }, 'Pemakaian dicatat — beban 7P bertambah');
      },
      ret(el, ctx) {
        ctx.act('stock.return', { wh: ctx.L.wh || whsFor(ctx)[0].id, item: ctx.val('iu-item'), qty: +ctx.val('iu-qty'), note: ctx.val('iu-note') }, 'Retur dicatat');
      },
    },
  };

  /* ---------- NV-46 Stock Opname, Adjustment & Discrepancy ---------- */
  V[46] = {
    render(ctx) {
      const { s, L } = ctx;
      const ops = (s.opnames || []).filter((o) => ctx.inScope(S.wh(s, o.wh).org));
      const counting = ops.find((o) => o.status === 'COUNTING');
      const submitted = ops.filter((o) => o.status === 'SUBMITTED');
      const whs = whsFor(ctx);
      const startCard = `<div class="card"><h3>Mulai opname</h3>${ctx.can('opname.start') ? `<div class="row"><select class="inp" id="op-wh" style="max-width:260px">${whs.map((w) => `<option value="${w.id}">${esc(w.name)}</option>`).join('')}</select><button class="btn" data-a="start">Mulai hitung</button></div><p class="tiny muted">Sistem mengambil snapshot saldo saat mulai. Penghitung tidak melihat qty sistem (blind count) — ditampilkan setelah diajukan.</p>` : '<p class="small muted">Opname dimulai oleh Gudang.</p>'}</div>`;
      const countCard = counting
        ? `<div class="card"><div class="card-head"><h3>${esc(counting.id)} · ${esc(S.whName(s, counting.wh))}</h3><span class="r">${ui.status(counting.status)}</span></div>${ui.table(
            [
              { h: 'Item', f: (l) => esc(S.itemName(s, l.item)) },
              { h: 'Bin', f: (l) => `<span class="mono tiny">${esc((S.stock(s, counting.wh, l.item) || {}).bin || '')}</span>` },
              { h: 'Qty fisik', num: true, f: (l, i) => `<input class="qty" type="number" min="0" id="op-c-${i}" value="${L['c' + i] !== undefined ? L['c' + i] : ''}" data-in="cnt" data-k="${i}" aria-label="Qty fisik">` },
            ],
            counting.lines
          )}<div class="field" style="margin-top:10px"><label>Penjelasan selisih (wajib bila ada selisih)</label><input class="inp" id="op-note" value="${esc(L.note || '')}" data-in="note"></div>
          <div class="row" style="justify-content:space-between;margin-top:10px"><button class="btn ghost sm" data-a="fill">Isi = qty sistem (demo)</button>${ctx.can('opname.submit') ? `<button class="btn" data-a="submit" data-p="${counting.id}">Ajukan hasil hitung</button>` : ''}</div></div>`
        : '';
      const review = submitted.map((o) => `<div class="card"><div class="card-head"><h3>${esc(o.id)} · ${esc(S.whName(s, o.wh))}</h3><span class="r">${ui.status(o.status)}</span></div>${ui.table(
        [
          { h: 'Item', f: (l) => esc(S.itemName(s, l.item)) },
          { h: 'Sistem', num: true, f: (l) => l.system },
          { h: 'Fisik', num: true, f: (l) => l.counted },
          { h: 'Selisih', num: true, f: (l) => { const d = l.counted - l.system; return d ? `<b class="${d < 0 ? 'bad-t' : 'ok-t'}">${d > 0 ? '+' : ''}${d}</b>` : '0'; } },
          { h: 'Nilai', num: true, f: (l) => U.rp((l.counted - l.system) * S.avgCost(s, l.item)) },
        ],
        o.lines,
        { rowCls: (l) => (l.counted !== l.system ? 'sel' : '') }
      )}<p class="small">Penjelasan: ${esc(o.note || '—')}</p><div class="row" style="justify-content:flex-end">${ctx.can('opname.approve') ? `<button class="btn ok" data-a="approve" data-p="${o.id}">Setujui penyesuaian</button>` : '<span class="badge warn">Menunggu Finance / BU Manager</span>'}</div></div>`).join('');
      const hist = ops.filter((o) => o.status === 'APPROVED');
      return `<div class="stack"><div class="alert warn">${ui.icon('alert', 16)}<span>Penyesuaian stok <b>wajib disetujui</b> Finance atau BU Manager (pemisahan tugas dari penghitung). Setelah disetujui: ledger ADJUST + jurnal selisih persediaan (menunggu review di NV-51).</span></div>
        <div class="grid g2">${counting ? countCard : startCard}<div class="card"><h3>Riwayat opname</h3>${ui.table([{ h: 'Opname', f: (o) => `<span class="mono small">${esc(o.id)}</span>` }, { h: 'Gudang', f: (o) => esc(S.whName(s, o.wh)) }, { h: 'Tanggal', f: (o) => U.date(o.date) }, { h: 'Selisih', num: true, f: (o) => o.lines.filter((l) => l.counted !== l.system).length }, { h: 'Status', f: (o) => ui.status(o.status) }], ops, { empty: 'Belum ada opname dalam sesi demo ini.' })}${hist.length ? '' : ''}</div></div>${review}</div>`;
    },
    actions: {
      start(el, ctx) {
        ctx.L.note = '';
        Object.keys(ctx.L).forEach((k) => /^c\d+$/.test(k) && delete ctx.L[k]);
        ctx.act('opname.start', { wh: ctx.val('op-wh') }, (o) => `${o.id} dimulai — hitung fisik setiap item`);
      },
      cnt(el, ctx) {
        ctx.L['c' + el.dataset.k] = el.value;
      },
      note(el, ctx) {
        ctx.L.note = el.value;
      },
      fill(el, ctx) {
        const o = (ctx.s.opnames || []).find((x) => x.status === 'COUNTING');
        o.lines.forEach((l, i) => (ctx.L['c' + i] = l.system));
        ctx.rerender();
      },
      submit(el, ctx) {
        const o = ctx.s.opnames.find((x) => x.id === el.dataset.p);
        const counts = o.lines.map((l, i) => ctx.val('op-c-' + i));
        ctx.act('opname.submit', { id: o.id, counts, note: ctx.val('op-note') }, (x) => `${x.id} diajukan untuk persetujuan`);
      },
      approve(el, ctx) {
        ctx.act('opname.approve', { id: el.dataset.p }, 'Penyesuaian diposting — jurnal selisih menunggu review');
      },
    },
  };
})();
