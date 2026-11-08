/* Module E — MRF & Supervisor Approval (NV-24..30). MRF = existing HAWK Purchase Request engine (TO VERIFY). */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const vh = HAWK.vh;
  const esc = U.esc;
  const V = HAWK.views;
  ui.local._cart = ui.local._cart || [];
  const cart = () => ui.local._cart;
  const addToCart = (item, qty = 1) => {
    const c = cart();
    const ex = c.find((x) => x.item === item);
    if (ex) ex.qty += qty;
    else c.push({ item, qty, reason: '' });
  };
  const defaultBranch = (ctx) => (ctx.scope.branch && ctx.scope.branch !== 'ALL' ? ctx.scope.branch : ctx.user.scope.find((x) => (S.org(ctx.s, x) || {}).type === 'BRANCH') || 'BR-SHN');

  function budgetCell(s, branch, item, qty, type) {
    const it = S.item(s, item);
    if (!it.routine || type === 'NON_ROUTINE') return `<span class="badge violet">Non-rutin · dilacak terpisah</span>`;
    const b = S.itemBudget(s, branch, item);
    if (!b) return '<span class="badge bad">Tidak ada budget item</span>';
    const proj = b.actualQty + b.commitQty + qty;
    const r = proj / b.qty;
    return `<div style="min-width:150px">${ui.bar(r)}<div class="tiny muted" style="margin-top:3px">${proj}/${b.qty} ${esc(it.unit)} · ${U.pct(r)}</div></div>`;
  }

  /* ---------- NV-24 Staff MRF Home ---------- */
  V[24] = {
    render(ctx) {
      const { s } = ctx;
      const mine = vh.mrfsForCtx(ctx);
      const cnt = (st) => mine.filter((m) => st.includes(m.status)).length;
      const cats = {};
      mine.forEach((m) => m.lines.forEach((l) => (cats[S.item(s, l.item).p] = (cats[S.item(s, l.item).p] || 0) + 1)));
      return `<div class="stack">
        <div class="grid g2">
          <button class="btn lg block" data-nav="26">${ui.icon('plus', 22)} Buat Material Request</button>
          <button class="btn lg block dark" data-nav="25">${ui.icon('scan', 22)} Scan barcode / cari item</button>
        </div>
        <div class="grid g4 keep2">${ui.kpi('Draft', cnt(['DRAFT']), '', '', 'doc')}${ui.kpi('Menunggu approval', cnt(['SUBMITTED', 'ESCALATED', 'REVISION']), '', '', 'inbox')}${ui.kpi('Dalam pemenuhan', cnt(['IN_FULFILLMENT', 'APPROVED']), '', '', 'truck')}${ui.kpi('Terpenuhi', cnt(['FULFILLED']), '', '', 'check')}</div>
        <div class="grid g-2-1">
          <div class="card"><div class="card-head"><h3>Permintaan terbaru</h3><span class="r"><button class="link small" data-nav="27">Semua →</button></span></div>
            ${mine.slice(0, 6).map((m) => `<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line-2);flex-wrap:nowrap"><div style="flex:1;min-width:0">${ui.id(m.id)} ${ui.status(m.status)}<div class="small" style="margin-top:4px">${vh.mrfItems(s, m)}</div><div class="tiny muted">${U.datetime(m.date)} · ${esc(S.orgName(s, m.branch))}</div></div><div style="width:120px">${vh.fulfillBar(s, m)}</div></div>`).join('') || ui.empty('Belum ada permintaan')}
          </div>
          <div class="card"><h3>Kategori 7P permintaan</h3>${Object.keys(cats).length ? ui.donut({ items: Object.entries(cats).map(([k, v]) => ({ label: s.sevenP.find((p) => p.key === k).name, color: ui.pColor(k), value: v })), center: mine.length, sub: 'MRF', size: 140 }) : ui.empty('—')}
            <div class="alert info" style="margin-top:12px">${ui.icon('alert', 16)}<span>Alur cepat: <b>cari/scan item → isi jumlah → kirim</b>. Unit, gudang, cost center & budget terisi otomatis.</span></div></div>
        </div></div>`;
    },
  };

  /* ---------- NV-25 Item Catalog / Search / Barcode Scan ---------- */
  V[25] = {
    render(ctx) {
      const { s, L } = ctx;
      const branch = defaultBranch(ctx);
      const wh = S.whOfOrg(s, branch);
      const cat = L.cat || 'ALL';
      const cats = [...new Set(s.items.map((i) => i.cat))];
      const items = s.items.filter((i) => cat === 'ALL' || i.cat === cat);
      return `<div class="grid g-2-1"><div class="stack"><div class="card"><div class="row" style="flex-wrap:nowrap"><input class="inp" id="cq" placeholder="Cari nama, kode, atau barcode…" data-in="filter" aria-label="Cari item"><button class="btn dark" data-a="scan">${ui.icon('scan')} Scan</button></div>
        <div style="margin-top:10px">${ui.tabs('cat', [['ALL', 'Semua'], ...cats.map((c) => [c, c])], cat)}</div></div>
        <div class="grid g3" id="cat-grid">${items
          .map((i) => {
            const av = wh ? S.available(s, wh.id, i.id) : 0;
            return `<div class="itemcard" data-name="${esc((i.name + ' ' + i.id + ' ' + i.barcode).toLowerCase())}"><div class="thumb">${vh.thumb(i)}</div><div class="nm">${esc(i.name)}</div><div class="tiny muted mono">${i.id} · ${i.barcode}</div><div class="row" style="gap:6px">${ui.p7(i.p)}<span class="badge ${i.routine ? 'gold' : 'violet'}">${i.routine ? 'BHP rutin' : 'Non-rutin'}</span></div><div class="small">Stok ${esc(wh ? wh.name.replace('Gudang ', '') : '—')}: <b class="${av > 0 ? 'ok-t' : 'bad-t'}">${av} ${esc(i.unit)}</b></div><button class="btn sm" data-a="add" data-item="${i.id}">+ Tambah ke MRF</button></div>`;
          })
          .join('')}</div></div>
        <div class="card" style="position:sticky;top:76px;align-self:start"><h3>${ui.icon('mrf', 16)} Keranjang MRF <span class="sub">${esc(S.orgName(s, branch))}</span></h3>
          ${cart().length ? cart().map((c) => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line-2);flex-wrap:nowrap"><span class="small" style="flex:1">${esc(S.itemName(s, c.item))}</span><b>${c.qty}</b><button class="btn sm ghost" data-a="rm" data-item="${c.item}" aria-label="Hapus">✕</button></div>`).join('') : '<p class="small muted">Belum ada item.</p>'}
          <button class="btn block" style="margin-top:12px" data-nav="26" ${cart().length ? '' : 'disabled'}>Lanjut buat MRF →</button>
          <p class="tiny muted" style="margin:8px 0 0">Integrasi ${ui.intBadge('TO VERIFY')} <span class="mono">item.search</span> — kolom BARCODE/ITEM/REQUEST SOH ada di PR entry HAWK.</p></div></div>`;
    },
    actions: {
      filter(el) {
        const q = el.value.toLowerCase();
        document.querySelectorAll('#cat-grid .itemcard').forEach((c) => (c.style.display = c.dataset.name.includes(q) ? '' : 'none'));
      },
      add(el, ctx) {
        addToCart(el.dataset.item, 1);
        ui.toast(S.itemName(ctx.s, el.dataset.item) + ' ditambahkan', 'ok');
        ctx.rerender();
      },
      rm(el, ctx) {
        ui.local._cart = cart().filter((c) => c.item !== el.dataset.item);
        ctx.rerender();
      },
      scan(el, ctx) {
        const s = ctx.s;
        ui.openModal(
          'Scan barcode (simulasi kamera)',
          `<div class="scanbox"><div class="laser"></div><div class="small muted">Arahkan kamera ke barcode…</div></div><p class="tiny muted">Prototipe tidak mengakses kamera. Pilih barcode contoh atau ketik manual:</p><div class="row">${s.items.slice(0, 6).map((i) => `<button class="btn sm ghost" data-a="scanPick" data-code="${i.barcode}">${i.barcode.slice(-4)} ${vh.thumb(i)}</button>`).join('')}</div><div class="row" style="margin-top:10px;flex-wrap:nowrap"><input class="inp" id="scan-code" placeholder="13 digit barcode"><button class="btn" data-a="scanPick">OK</button></div>`
        );
      },
      scanPick(el, ctx) {
        const code = el.dataset.code || ctx.val('scan-code').trim();
        const it = ctx.s.items.find((i) => i.barcode === code);
        if (!it) return ui.toast('Barcode tidak dikenal: ' + (code || '(kosong)'), 'bad');
        addToCart(it.id, 1);
        ui.closeModal();
        ui.toast('Terdeteksi: ' + it.name, 'ok', 'Ditambahkan ke keranjang MRF');
        ctx.rerender();
      },
    },
  };

  /* ---------- NV-26 Create Material Request (3-step wizard) ---------- */
  V[26] = {
    render(ctx) {
      const { s, L, user } = ctx;
      L.step = L.step || 0;
      L.form = L.form || { branch: defaultBranch(ctx), type: 'ROUTINE', purpose: 'Operasional harian', memo: '' };
      const f = L.form;
      if (L.done) {
        const m = s.mrfs.find((x) => x.id === L.done);
        return `<div class="card" style="max-width:640px;margin:auto;text-align:center"><div style="font-size:42px">✅</div><h2>MRF terkirim</h2><p>${ui.id(m.id)} · ${ui.status(m.status)}</p><p class="small">Diteruskan ke: ${vh.chain(s, m.chain, m.approvals, m.status)}</p><div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-nav="28" data-q='${esc(JSON.stringify({ id: m.id }))}'>Lacak status</button><button class="btn ghost" data-a="newMrf">Buat MRF lain</button></div></div>`;
      }
      const branches = s.org.filter((o) => ['BRANCH', 'DIVISION'].includes(o.type) && o.status === 'ACTIVE' && (['STAFF', 'SUPERVISOR'].includes(user.role) ? user.scope.includes(o.id) : true));
      const wh = S.whOfOrg(s, f.branch) || S.wh(s, 'WH-PST');
      const cc = S.ccOfOrg(s, f.branch) || {};
      const buMgr = s.users.find((u) => u.role === 'BU_MANAGER');
      const auto = `<div class="auto"><b class="small">Informasi otomatis</b><dl style="margin-top:6px"><dt>Pemohon</dt><dd>${esc(user.name)}</dd><dt>Jabatan</dt><dd>${esc(user.title)}</dd><dt>Unit</dt><dd>${esc(S.orgName(s, f.branch))}</dd><dt>Departemen</dt><dd>${esc(S.assignment(s, user).dept)}</dd><dt>Divisi</dt><dd>${esc(S.assignment(s, user).division)}</dd><dt>BU</dt><dd>${esc(S.orgName(s, S.buOf(s, f.branch)) || '—')}</dd><dt>Gudang</dt><dd>${esc(wh.name)}</dd><dt>Cost center</dt><dd class="mono">${esc(cc.id || '—')}</dd><dt>Budget owner</dt><dd>${esc(buMgr ? buMgr.name : '—')} (BU Manager)</dd><dt>Periode budget</dt><dd>November 2026</dd></dl></div>`;
      const steps = ui.stepper(['Detail permintaan', 'Rincian item & cek stok/budget', 'Ringkasan & kirim'], L.step);
      if (L.step === 0) {
        return `<div class="card" style="max-width:980px">${steps}<div class="grid g-2-1"><div class="stack">
          <div class="field"><label>Unit / lokasi *</label><select class="inp" id="f-branch" ${branches.length === 1 ? 'disabled' : ''}>${branches.map((b) => `<option value="${b.id}" ${b.id === f.branch ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select><span class="hint">Mengikuti scope pengguna; cabang dibaca dinamis dari NV-06.</span></div>
          <div class="field"><label>Jenis permintaan *</label><div class="radio-cards"><label><input type="radio" name="f-type" value="ROUTINE" ${f.type === 'ROUTINE' ? 'checked' : ''}><span>Rutin (BHP)</span></label><label><input type="radio" name="f-type" value="NON_ROUTINE" ${f.type === 'NON_ROUTINE' ? 'checked' : ''}><span>Non-rutin</span></label></div><span class="hint">Non-rutin dilacak terpisah dan memakai rantai pengecualian (AR-05).</span></div>
          <div class="field"><label>Kebutuhan untuk *</label><select class="inp" id="f-purpose">${['Operasional harian', 'Event / promo', 'Maintenance', 'Stok cadangan'].map((p) => `<option ${p === f.purpose ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
          <div class="field"><label>Keterangan</label><textarea class="inp" id="f-memo" rows="2" maxlength="200" placeholder="Contoh: Minyak pijat untuk weekend">${esc(f.memo)}</textarea></div>
          </div>${auto}</div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn ghost" data-nav="24">Batal</button><button class="btn" data-a="next0">Lanjutkan →</button></div></div>`;
      }
      if (L.step === 1) {
        const c = cart();
        const tot = U.sum(c, (x) => x.qty * S.item(s, x.item).price);
        const bcs = c.map((x) => {
          const it = S.item(s, x.item);
          if (!it.routine || f.type === 'NON_ROUTINE') return 'EXCEPTION';
          const b = S.itemBudget(s, f.branch, x.item);
          if (!b) return 'OVER';
          const r = (b.actualQty + b.commitQty + x.qty) / b.qty;
          return r > 1 ? 'OVER' : r >= 0.9 ? 'WARN' : 'OK';
        });
        const worst = bcs.includes('OVER') ? 'OVER' : bcs.includes('EXCEPTION') ? 'EXCEPTION' : bcs.includes('WARN') ? 'WARN' : 'OK';
        const msg = { OK: ['ok', 'Budget mencukupi untuk semua item.'], WARN: ['warn', 'Mendekati batas budget item bulanan (≥ 90%). Supervisor akan melihat peringatan ini.'], OVER: ['bad', 'Melebihi budget item bulanan → BU Manager otomatis ditambahkan ke rantai approval.'], EXCEPTION: ['violet', 'Item non-rutin → dilacak di budget non-rutin & rantai pengecualian.'] }[worst];
        return `<div class="card" style="max-width:1100px">${steps}
          <div class="row" style="flex-wrap:nowrap"><select class="inp" id="add-item" aria-label="Pilih item">${s.items.map((i) => `<option value="${i.id}">${esc(i.name)} (${i.id})</option>`).join('')}</select><input class="inp" id="add-qty" type="number" min="1" value="1" style="width:90px" aria-label="Qty"><button class="btn" data-a="addLine">+ Tambah item</button><button class="btn ghost" data-nav="25">${ui.icon('scan')} Katalog / scan</button></div>
          <div style="margin-top:12px">${ui.table(
            [
              { h: 'Item', f: (x) => `${vh.thumb(S.item(s, x.item))} ${esc(S.itemName(s, x.item))}<div class="tiny muted">${x.item} · ${ui.p7(S.item(s, x.item).p)}</div>` },
              { h: 'Request SOH', num: true, f: (x) => S.available(s, wh.id, x.item) + ' ' + esc(S.item(s, x.item).unit) },
              { h: 'Source SOH (gudang lain)', num: true, f: (x) => U.sum(s.stock.filter((r) => r.item === x.item && r.wh !== wh.id), (r) => r.onHand - r.reserved) },
              { h: 'Qty diminta', num: true, f: (x, i) => `<input class="qty" type="number" min="1" max="9999" value="${x.qty}" data-ch="qty" data-i="${i}" aria-label="Qty">` },
              { h: 'Estimasi', num: true, f: (x) => U.rp(x.qty * S.item(s, x.item).price) },
              { h: 'Budget item Nov (proyeksi)', f: (x) => budgetCell(s, f.branch, x.item, x.qty, f.type) },
              { h: '', f: (x, i) => `<button class="btn sm ghost" data-a="rmLine" data-i="${i}" aria-label="Hapus">✕</button>` },
            ],
            c,
            { empty: 'Belum ada item — pilih item di atas atau dari katalog/scan.', foot: c.length ? `<td colspan="4">Total estimasi</td><td class="num">${U.rp(tot)}</td><td colspan="2"></td>` : '' }
          )}</div>
          ${c.length ? `<div class="alert ${msg[0]}" style="margin-top:12px">${ui.icon('alert', 16)}<span>${msg[1]}</span></div>` : ''}
          <div class="row" style="justify-content:space-between;margin-top:14px"><button class="btn ghost" data-a="back">← Kembali</button><button class="btn" data-a="next1" ${c.length ? '' : 'disabled'}>Lanjutkan →</button></div></div>`;
      }
      // step 2 summary
      const c = cart();
      const draft = { branch: f.branch, type: f.type, lines: c.map((x) => ({ item: x.item, qty: x.qty, alloc: [] })), status: 'DRAFT', date: s.meta.demoDate + 'T09:00:00' };
      const ch = S.mrfChain(s, draft);
      const tot = U.sum(c, (x) => x.qty * S.item(s, x.item).price);
      return `<div class="card" style="max-width:1100px">${steps}<div class="grid g2"><div class="card"><h3>Informasi permintaan</h3><dl class="kv"><dt>Nomor</dt><dd><span class="muted">Otomatis (format HAWK PR${'2026'}11xxxxx)</span></dd><dt>Unit</dt><dd>${esc(S.orgName(s, f.branch))}</dd><dt>Jenis</dt><dd>${f.type === 'ROUTINE' ? 'Rutin (BHP)' : 'Non-rutin'}</dd><dt>Kebutuhan</dt><dd>${esc(f.purpose)}</dd><dt>Keterangan</dt><dd>${esc(f.memo || '—')}</dd><dt>Rantai approval</dt><dd>${vh.chain(s, ch.chain, [], 'SUBMITTED')}<div class="tiny muted" style="margin-top:4px">Aturan ${ch.rule}${ch.exception ? ' + AR-05 (pengecualian budget)' : ''} — dari matriks NV-09</div></dd></dl></div>
        <div class="card"><h3>Rincian item (${c.length})</h3>${c.map((x) => `<div class="row" style="padding:7px 0;border-bottom:1px solid var(--line-2);flex-wrap:nowrap"><span>${vh.thumb(S.item(s, x.item))}</span><span class="small" style="flex:1">${esc(S.itemName(s, x.item))}</span><b>${x.qty} ${esc(S.item(s, x.item).unit)}</b><span class="num small" style="width:110px">${U.rp(x.qty * S.item(s, x.item).price)}</span></div>`).join('')}<div class="row between" style="margin-top:10px"><b>Total estimasi</b><b style="font-size:18px;color:var(--gold-dark)">${U.rp(tot)}</b></div></div></div>
        <div class="alert info" style="margin-top:12px">${ui.icon('alert', 16)}Setelah dikirim, permintaan diteruskan ke ${esc(HAWK.ROLE_LABEL[ch.chain[0]])} untuk ditinjau. Transaksi dicatat sebagai Purchase Request di engine HAWK (${ui.intBadge('TO VERIFY')}).</div>
        <div class="row" style="justify-content:space-between;margin-top:14px"><button class="btn ghost" data-a="back">← Kembali</button><div class="row"><button class="btn ghost" data-a="submit" data-draft="1">Simpan draft</button><button class="btn" data-a="submit">Kirim permintaan ✈</button></div></div></div>`;
    },
    actions: {
      next0(el, ctx) {
        const f = ctx.L.form;
        const b = document.getElementById('f-branch');
        f.branch = b ? b.value : f.branch;
        f.type = (document.querySelector('input[name=f-type]:checked') || {}).value || 'ROUTINE';
        f.purpose = ctx.val('f-purpose');
        f.memo = ctx.val('f-memo');
        ctx.L.step = 1;
        ctx.rerender();
      },
      next1(el, ctx) {
        if (cart().some((x) => !(x.qty >= 1 && x.qty <= 9999 && Number.isInteger(+x.qty)))) return ui.toast('Qty harus bilangan bulat 1–9999', 'bad');
        ctx.L.step = 2;
        ctx.rerender();
      },
      back(el, ctx) {
        ctx.L.step = Math.max(0, ctx.L.step - 1);
        ctx.rerender();
      },
      addLine(el, ctx) {
        const q = parseInt(ctx.val('add-qty'), 10);
        if (!(q >= 1)) return ui.toast('Qty minimal 1', 'bad');
        addToCart(ctx.val('add-item'), q);
        ctx.rerender();
      },
      rmLine(el, ctx) {
        cart().splice(+el.dataset.i, 1);
        ctx.rerender();
      },
      qty(el, ctx) {
        const v = parseInt(el.value, 10);
        cart()[+el.dataset.i].qty = isNaN(v) ? 0 : v;
        ctx.rerender();
      },
      submit(el, ctx) {
        const f = ctx.L.form;
        const r = ctx.act('mrf.create', { branch: f.branch, type: f.type, purpose: f.purpose, memo: f.memo, draft: !!el.dataset.draft, lines: cart().map((x) => ({ item: x.item, qty: x.qty, reason: f.purpose })) }, (m) => `${m.id} ${el.dataset.draft ? 'disimpan sebagai draft' : 'terkirim ke ' + HAWK.ROLE_LABEL[m.chain[0]]}`);
        if (r.ok) {
          ui.local._cart = [];
          ctx.L.done = r.data.id;
          ctx.L.step = 0;
          ctx.rerender();
        }
      },
      newMrf(el, ctx) {
        delete ctx.L.done;
        ctx.L.form = null;
        ctx.L.step = 0;
        ctx.rerender();
      },
    },
  };

  /* ---------- NV-27 My Requests & Status Tracking ---------- */
  V[27] = {
    render(ctx) {
      const { s, L } = ctx;
      const mine = vh.mrfsForCtx(ctx);
      const cur = L.t || 'ALL';
      const groups = { ALL: null, OPEN: ['DRAFT', 'SUBMITTED', 'ESCALATED', 'REVISION'], PROC: ['APPROVED', 'IN_FULFILLMENT'], DONE: ['FULFILLED'], NO: ['REJECTED', 'CANCELLED'] };
      const list = groups[cur] ? mine.filter((m) => groups[cur].includes(m.status)) : mine;
      return `<div class="card">${ui.tabs('t', [['ALL', 'Semua', mine.length], ['OPEN', 'Menunggu', mine.filter((m) => groups.OPEN.includes(m.status)).length], ['PROC', 'Diproses', mine.filter((m) => groups.PROC.includes(m.status)).length], ['DONE', 'Terpenuhi', mine.filter((m) => groups.DONE.includes(m.status)).length], ['NO', 'Ditolak/batal', mine.filter((m) => groups.NO.includes(m.status)).length]], cur)}
        ${ui.table(
          [
            { h: 'Nomor', f: (m) => ui.id(m.id) },
            { h: 'Tanggal', f: (m) => U.datetime(m.date) },
            { h: 'Unit', f: (m) => esc(S.orgName(s, m.branch)) },
            { h: 'Item', f: (m) => vh.mrfItems(s, m) },
            { h: 'Nilai', num: true, f: (m) => U.rp(S.mrfValue(s, m)) },
            { h: 'Status', f: (m) => ui.status(m.status) + (S.mrfNextApprover(s, m) ? `<div class="tiny muted">menunggu ${esc(HAWK.ROLE_LABEL[S.mrfNextApprover(s, m)])}</div>` : '') },
            { h: 'Pemenuhan', f: (m) => vh.fulfillBar(s, m) },
            {
              h: 'Aksi',
              f: (m) =>
                `<div class="row" style="flex-wrap:nowrap"><button class="btn sm ghost" data-nav="28" data-q='${esc(JSON.stringify({ id: m.id }))}'>Detail</button>${['DRAFT', 'SUBMITTED', 'REVISION'].includes(m.status) && m.requester === ctx.user.id ? `<button class="btn sm bad" data-a="cancel" data-id2="${m.id}">Batal</button>` : ''}${['REVISION', 'DRAFT'].includes(m.status) && m.requester === ctx.user.id ? `<button class="btn sm" data-a="resubmit" data-id2="${m.id}">Kirim ulang</button>` : ''}</div>`,
            },
          ],
          list,
          { empty: 'Tidak ada permintaan di kategori ini.' }
        )}</div>`;
    },
    actions: {
      cancel(el, ctx) {
        ui.ask('Batalkan ' + el.dataset.id2, 'Alasan pembatalan', (note) => ctx.act('mrf.cancel', { id: el.dataset.id2, note }, 'MRF dibatalkan'), { danger: true, ok: 'Batalkan' });
      },
      resubmit(el, ctx) {
        const m = ctx.s.mrfs.find((x) => x.id === el.dataset.id2);
        ui.openModal(
          'Revisi & kirim ulang ' + m.id,
          `${m.history.filter((h) => h.action === 'REVISION').slice(-1).map((h) => `<div class="alert warn">Catatan supervisor: ${esc(h.note)}</div>`).join('')}${m.lines.map((l, i) => `<div class="field" style="margin-top:10px"><label>${esc(S.itemName(ctx.s, l.item))}</label><input class="inp" type="number" min="1" id="rq-${i}" value="${l.qty}"></div>`).join('')}`,
          `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" id="rq-ok">Kirim ulang</button>`
        );
        document.getElementById('rq-ok').onclick = () => {
          const lines = m.lines.map((l, i) => ({ item: l.item, qty: parseInt(document.getElementById('rq-' + i).value, 10), reason: l.reason }));
          ui.closeModal();
          ctx.act('mrf.submitDraft', { id: m.id, lines }, 'MRF dikirim ulang');
        };
      },
    },
  };

  /* ---------- NV-28 MRF Detail & Fulfillment Tracking ---------- */
  V[28] = {
    render(ctx) {
      const { s, q, L } = ctx;
      const pool = vh.mrfsForCtx(ctx).length ? vh.mrfsForCtx(ctx) : s.mrfs;
      const id = q.id || L.id || (pool[0] || {}).id;
      const m = s.mrfs.find((x) => x.id === id);
      if (!m) return ui.empty('MRF tidak ditemukan');
      const f = S.mrfFulfillment(s, m);
      const bc = S.mrfBudgetCheck(s, m);
      const life = ['SUBMITTED', 'APPROVED', 'IN_FULFILLMENT', 'FULFILLED'];
      const li = m.status === 'FULFILLED' ? 4 : m.status === 'IN_FULFILLMENT' ? 2 : ['APPROVED'].includes(m.status) ? 1 : 0;
      const canIssue = ctx.can('mrf.issue') && m.status === 'IN_FULFILLMENT' && f.ready > f.issued;
      const pathCard = (key, cls, title, icon, desc) => {
        const a = f[key];
        const allocs = m.lines.flatMap((l) => (l.alloc || []).filter((x) => x.path === key).map((x) => ({ ...x, item: l.item })));
        return `<div class="path ${cls}"><div class="ttl">${ui.icon(icon, 18)} ${title}</div><div class="big">${a.qty}<span class="small muted"> unit</span></div><div class="tiny muted">${desc}</div>
          <div style="margin-top:8px">${ui.bar(a.qty ? a.issued / a.qty : 0, 'ok')}<div class="tiny muted" style="margin-top:3px">siap ${a.ready} · diserahkan ${a.issued}</div></div>
          ${allocs.map((x) => `<div class="small" style="margin-top:8px">${x.fromWh ? esc(S.whName(s, x.fromWh)) : ''} ${x.ref ? ui.id(x.ref) + ' ' + refStatus(s, x.ref) : key === 'PURCHASE' ? '<span class="badge warn">Menunggu PO</span>' : ''}</div>${refAction(ctx, x)}`).join('')}</div>`;
      };
      return `<div class="stack">
        <div class="card"><div class="row" style="flex-wrap:wrap"><select class="inp" style="max-width:360px" data-ch="pick" aria-label="Pilih MRF">${pool.map((x) => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${x.id} · ${esc(S.orgName(s, x.branch))} · ${esc(ui.statusLabel(x.status))}</option>`).join('')}</select>${ui.status(m.status)} ${ui.status(bc.status)}<span class="tiny muted">Dibuat ${U.datetime(m.date)} oleh ${esc(S.userName(s, m.requester))}</span></div>
          <div style="margin-top:12px">${ui.stepper(['Diajukan', 'Disetujui', 'Dalam pemenuhan', 'Terpenuhi'], m.status === 'FULFILLED' ? 4 : li)}</div>
          <div class="grid g3"><div><div class="tiny muted">Unit / gudang</div><b>${esc(S.orgName(s, m.branch))}</b> · ${esc(S.whName(s, m.wh))}</div><div><div class="tiny muted">Rantai approval</div>${vh.chain(s, m.chain || S.mrfChain(s, m).chain, m.approvals, m.status)}</div><div><div class="tiny muted">Terpenuhi</div><b style="font-size:20px">${f.issued} / ${f.requested}</b> <span class="small muted">tanpa double-count (Σ alokasi = ${f.allocated})</span></div></div></div>
        ${f.allocated ? `<div class="card"><div class="card-head"><h3>Jalur fulfillment otomatis</h3><span class="r">${canIssue ? `<button class="btn" data-a="issue">${ui.icon('check')} Serahkan ${f.ready - f.issued} unit siap ke pemohon</button>` : ''}</span></div>
          <div class="paths">${pathCard('LOCAL', 'local', 'Stok lokal', 'box', 'Direservasi dari gudang peminta')}${pathCard('TRANSFER', 'transfer', 'Gudang lain (transfer)', 'truck', 'Surplus di atas stok minimum gudang lain')}${pathCard('PURCHASE', 'purchase', 'Pembelian supplier', 'cart', 'Sisa kebutuhan → konsolidasi Purchasing')}</div>
          <div class="segbar" style="margin-top:14px;height:16px"><i style="width:${(f.LOCAL.issued / f.requested) * 100}%;background:var(--p-people)"></i><i style="width:${(f.TRANSFER.issued / f.requested) * 100}%;background:var(--p-process)"></i><i style="width:${(f.PURCHASE.issued / f.requested) * 100}%;background:var(--p-promotion)"></i></div>
          <div class="tiny muted" style="margin-top:4px">Bar = unit yang sudah diserahkan per jalur. Satu MRF dapat dipenuhi dari beberapa jalur.</div></div>`
          : `<div class="card"><h3>Jalur fulfillment</h3><p class="small muted">Rencana fulfillment dibuat otomatis saat MRF disetujui penuh.</p></div>`}
        <div class="grid g2"><div class="card"><h3>Item & cek budget</h3>${ui.table([{ h: 'Item', f: (l) => esc(S.itemName(s, l.item)) }, { h: 'Qty', num: true, f: (l) => l.qty }, { h: 'Nilai', num: true, f: (l) => U.rp(S.lineValue(s, l)) }, { h: 'Budget', f: (l, i) => ui.status(bc.lines[i].status) }], m.lines)}
          <button class="link small" style="margin-top:8px" data-nav="30" data-q='${esc(JSON.stringify({ id: m.id }))}'>Lihat dampak budget →</button></div>
          <div class="card"><h3>Riwayat</h3><ul class="tl">${(m.history || []).slice().reverse().map((h) => `<li><b>${esc(h.action)}</b> ${h.note ? '— ' + esc(h.note) : ''}<div class="t">${U.datetime(h.ts)} · ${esc(S.userName(s, h.by))}</div></li>`).join('')}</ul></div></div>
        <div class="card"><h3>${ui.icon('link', 16)} Jejak dokumen terkait</h3><div class="row">${S.trace(s, m.id).map((x, i) => `${i ? '→' : ''} ${ui.id(x)}`).join(' ')}</div></div></div>`;
    },
    actions: {
      pick(el, ctx) {
        ctx.L.id = el.value;
        HAWK.go(28, { id: el.value });
      },
      issue(el, ctx) {
        const id = ctx.q.id || ctx.L.id || vh.mrfsForCtx(ctx)[0].id;
        ctx.act('mrf.issue', { id }, (m) => `Diserahkan — ${S.mrfFulfillment(ctx.s, m).issued}/${S.mrfFulfillment(ctx.s, m).requested}`);
      },
      dispatch(el, ctx) {
        ctx.act('transfer.dispatch', { id: el.dataset.ref }, 'Transfer dikirim (stok asal berkurang)');
      },
      receiveTr(el, ctx) {
        ctx.act('transfer.receive', { id: el.dataset.ref }, 'Transfer diterima — siap diserahkan');
      },
    },
  };
  function refStatus(s, ref) {
    const f = S.findRecord(s, ref);
    return f ? ui.status(f.rec.status) : '';
  }
  function refAction(ctx, x) {
    const s = ctx.s;
    if (x.path === 'TRANSFER' && x.ref) {
      const t = s.transfers.find((y) => y.id === x.ref);
      if (t.status === 'REQUESTED' && ctx.can('transfer.dispatch')) return `<button class="btn sm" style="margin-top:6px" data-a="dispatch" data-ref="${t.id}">Kirim transfer</button>`;
      if (t.status === 'IN_TRANSIT' && ctx.can('transfer.receive')) return `<button class="btn sm" style="margin-top:6px" data-a="receiveTr" data-ref="${t.id}">Terima transfer</button>`;
    }
    if (x.path === 'PURCHASE' && !x.ref && ctx.can('po.createFromMrf')) return `<button class="btn sm" style="margin-top:6px" data-nav="32">Konsolidasi & buat PO</button>`;
    if (x.path === 'PURCHASE' && x.ref) {
      const po = s.pos.find((p) => p.id === x.ref);
      const g = s.grns.find((g) => g.po === po.id);
      if (['SENT', 'PARTIAL'].includes(po.status) && ctx.can('grn.receive')) return `<button class="btn sm" style="margin-top:6px" data-nav="42" data-q='${esc(JSON.stringify({ po: po.id }))}'>Terima barang</button>`;
      if (g && g.status === 'POSTED' && ctx.can('grn.putaway')) return `<button class="btn sm" style="margin-top:6px" data-nav="43">Put-away</button>`;
      if (['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(po.status)) return `<button class="btn sm ghost" style="margin-top:6px" data-nav="36" data-q='${esc(JSON.stringify({ id: po.id }))}'>Lihat PO</button>`;
    }
    return '';
  }

  /* ---------- decision helper shared by NV-29 / NV-30 ---------- */
  function decisionButtons(ctx, m) {
    const step = S.mrfNextApprover(ctx.s, m);
    const mine = S.canApproveStep(ctx.s, ctx.user, step, m) && !(m.approvals || []).some((a) => a.by === ctx.user.id);
    if (!step) return `<p class="small muted">Tidak menunggu keputusan (${ui.statusLabel(m.status)}).</p>`;
    if (!mine) return `<div class="alert info">Menunggu ${esc(HAWK.ROLE_LABEL[step])}. Ganti role untuk memutuskan.</div>`;
    return `<div class="row"><button class="btn ghost" data-a="decide" data-d="REVISION" data-m="${m.id}">Minta revisi</button><button class="btn ghost" data-a="decide" data-d="ESCALATE" data-m="${m.id}">Eskalasi</button><button class="btn bad" data-a="decide" data-d="REJECT" data-m="${m.id}">Tolak</button><button class="btn ok" data-a="decide" data-d="APPROVE" data-m="${m.id}">${ui.icon('check')} Setujui</button></div>`;
  }
  const decideAction = (el, ctx) => {
    const d = el.dataset.d;
    const id = el.dataset.m;
    const label = { APPROVE: 'Setujui', REJECT: 'Tolak', REVISION: 'Minta revisi', ESCALATE: 'Eskalasi' }[d];
    const run = (note) =>
      ctx.act('mrf.decide', { id, decision: d, note }, (m) => {
        if (m.status === 'IN_FULFILLMENT') {
          const f = S.mrfFulfillment(ctx.s, m);
          return `${m.id} disetujui — fulfillment: lokal ${f.LOCAL.qty}, transfer ${f.TRANSFER.qty}, beli ${f.PURCHASE.qty}`;
        }
        return `${m.id}: ${ui.statusLabel(m.status)}`;
      });
    if (d === 'APPROVE') run('');
    else ui.ask(`${label} ${id}`, 'Catatan (wajib)', run, { danger: d === 'REJECT', ok: label });
  };

  /* ---------- NV-29 Supervisor Approval Queue ---------- */
  V[29] = {
    render(ctx) {
      const { s, L } = ctx;
      const scope = s.mrfs.filter((m) => ctx.inScope(m.branch));
      const cur = L.t || 'WAIT';
      const sets = { WAIT: scope.filter((m) => ['SUBMITTED', 'ESCALATED'].includes(m.status)), OK: scope.filter((m) => ['APPROVED', 'IN_FULFILLMENT', 'FULFILLED'].includes(m.status)), NO: scope.filter((m) => ['REJECTED', 'REVISION', 'CANCELLED'].includes(m.status)), ALL: scope };
      const list = sets[cur];
      const sel = list.find((m) => m.id === (L.sel || ctx.q.id)) || list[0];
      const detail = sel
        ? (() => {
            const bc = S.mrfBudgetCheck(s, sel);
            return `<div class="card"><div class="card-head"><h3>${ui.id(sel.id)} ${ui.status(sel.status)}</h3><span class="r">${ui.status(bc.status)}</span></div>
            <dl class="kv"><dt>Pemohon</dt><dd>${esc(S.userName(s, sel.requester))}</dd><dt>Unit</dt><dd>${esc(S.orgName(s, sel.branch))}</dd><dt>Jenis</dt><dd>${sel.type === 'ROUTINE' ? 'Rutin (BHP)' : 'Non-rutin'} · ${esc(sel.purpose || '')}</dd><dt>Memo</dt><dd>${esc(sel.memo)}</dd><dt>Rantai</dt><dd>${vh.chain(s, sel.chain || S.mrfChain(s, sel).chain, sel.approvals, sel.status)}</dd></dl>
            <div style="margin-top:12px">${ui.table(
              [
                { h: 'Item', f: (l) => esc(S.itemName(s, l.item)) },
                { h: 'Qty', num: true, f: (l) => l.qty },
                { h: 'Stok lokal', num: true, f: (l) => S.available(s, sel.wh, l.item) },
                { h: 'Gudang lain', num: true, f: (l) => U.sum(s.stock.filter((r) => r.item === l.item && r.wh !== sel.wh), (r) => Math.max(0, r.onHand - r.reserved - r.min)) },
                { h: 'Estimasi', num: true, f: (l) => U.rp(S.lineValue(s, l)) },
                { h: 'Dampak budget', f: (l, i) => (bc.lines[i].budget ? `${ui.bar(bc.lines[i].ratio)}<div class="tiny muted">${bc.lines[i].projectedQty}/${bc.lines[i].budget.qty} · ${U.pct(bc.lines[i].ratio)}</div>` : ui.status(bc.lines[i].status)) },
              ],
              sel.lines,
              { foot: `<td colspan="4">Total</td><td class="num">${U.rp(S.mrfValue(s, sel))}</td><td></td>` }
            )}</div>
            ${bc.status !== 'OK' ? `<div class="alert ${bc.status === 'WARN' ? 'warn' : 'bad'}" style="margin-top:10px">${ui.icon('alert', 16)}<span>${bc.status === 'WARN' ? 'Proyeksi ≥ 90% budget item bulanan.' : 'Melebihi budget / non-rutin — BU Manager wajib menyetujui setelah Anda.'} <button class="link" data-nav="30" data-q='${esc(JSON.stringify({ id: sel.id }))}'>Analisis dampak →</button></span></div>` : ''}
            <div class="hr"></div>${decisionButtons(ctx, sel)}</div>`;
          })()
        : ui.empty('Tidak ada MRF.');
      return `${ui.tabs('t', [['WAIT', 'Menunggu', sets.WAIT.length], ['OK', 'Disetujui', sets.OK.length], ['NO', 'Ditolak / revisi', sets.NO.length], ['ALL', 'Semua', sets.ALL.length]], cur)}
        <div class="grid g-1-2"><div class="card pad0">${list.map((m) => `<div class="row" style="padding:12px 14px;border-bottom:1px solid var(--line-2);cursor:pointer;flex-wrap:nowrap;${sel && sel.id === m.id ? 'background:#fbf3dd' : ''}" data-a="sel" data-m="${m.id}"><div style="flex:1;min-width:0"><b class="mono small">${m.id}</b> <span class="tiny muted">${esc(S.orgName(s, m.branch))}</span><div class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${vh.mrfItems(s, m)}</div><div class="tiny muted">${esc(S.userName(s, m.requester))} · ${U.datetime(m.date)}</div></div><div style="text-align:right"><b class="small">${U.rp(S.mrfValue(s, m))}</b><div>${ui.status(S.mrfBudgetCheck(s, m).status)}</div></div></div>`).join('') || ui.empty('Antrean kosong')}</div>${detail}</div>`;
    },
    actions: {
      sel(el, ctx) {
        ctx.L.sel = el.dataset.m;
        ctx.rerender();
      },
      decide: decideAction,
    },
  };

  /* ---------- NV-30 MRF Budget Impact & Exception Review ---------- */
  V[30] = {
    render(ctx) {
      const { s, q, L } = ctx;
      const scope = s.mrfs.filter((m) => ctx.inScope(m.branch) && m.status !== 'CANCELLED');
      const pending = scope.filter((m) => ['SUBMITTED', 'ESCALATED'].includes(m.status));
      const m = s.mrfs.find((x) => x.id === (q.id || L.id)) || pending[0] || scope[0];
      if (!m) return ui.empty('Tidak ada MRF di scope ini');
      const bc = S.mrfBudgetCheck(s, m);
      const main = bc.lines.find((x) => x.budget) || bc.lines[0];
      const it = S.item(s, main.item);
      const exc = scope.filter((x) => ['OVER', 'EXCEPTION'].includes(S.mrfBudgetCheck(s, x).status) && ['SUBMITTED', 'ESCALATED'].includes(x.status));
      const b = main.budget;
      const hist = b ? [Math.round(b.qty * 0.82), Math.round(b.qty * 0.93), b.actualQty] : [0, 0, 0];
      const avg = Math.round((hist[0] + hist[1]) / 2);
      return `<div class="stack"><div class="card"><div class="row"><select class="inp" style="max-width:420px" data-ch="pick" aria-label="Pilih MRF">${scope.map((x) => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${x.id} · ${esc(S.orgName(s, x.branch))} · ${esc(vh.mrfItems(s, x).replace(/<[^>]+>/g, ''))}</option>`).join('')}</select>${ui.status(m.status)} ${ui.status(bc.status)}</div></div>
        <div class="grid g3"><div class="card"><h3>Analisis budget item — ${esc(it.name)}</h3>${b ? `${ui.gauge(main.ratio, 'proyeksi vs budget Nov')}<dl class="kv" style="margin-top:8px"><dt>Budget qty</dt><dd>${b.qty} ${esc(it.unit)}</dd><dt>Budget nilai</dt><dd>${U.rp(b.value)}</dd><dt>Aktual terpakai</dt><dd>${b.actualQty} ${esc(it.unit)} · ${U.rp(b.actualValue)}</dd><dt>Komitmen</dt><dd>${b.commitQty} ${esc(it.unit)} (MRF disetujui belum diserahkan)</dd><dt>Permintaan ini</dt><dd>${['APPROVED', 'IN_FULFILLMENT', 'FULFILLED'].includes(m.status) ? 'sudah termasuk aktual/komitmen' : main.qty + ' ' + esc(it.unit)}</dd><dt>Proyeksi</dt><dd><b>${main.projectedQty} ${esc(it.unit)} · ${U.pct(main.ratio)}</b></dd><dt>Sisa setelah ini</dt><dd>${b.qty - main.projectedQty} ${esc(it.unit)} · ${U.rp((b.qty - main.projectedQty) * b.price)}</dd>${main.otherPendingQty ? `<dt>MRF lain menunggu</dt><dd>${main.otherPendingQty} ${esc(it.unit)}</dd>` : ''}</dl>` : `<div class="alert violet">${main.kind === 'NON_ROUTINE' ? 'Item non-rutin — tidak divalidasi terhadap budget BHP bulanan; dilacak di budget non-rutin (NV-18) dan butuh approval pengecualian.' : 'Tidak ada budget item — pengecualian.'}</div>`}</div>
          <div class="card"><h3>Riwayat pemakaian (3 bulan)</h3>${ui.bars({ labels: ['Sep', 'Okt', 'Nov (berjalan)'], series: [{ name: it.name, color: '#c99a2e', values: hist }], h: 170 })}<div class="row between small"><span class="muted">Rata-rata/bulan</span><b>${avg} ${esc(it.unit)}</b></div><div class="tiny muted">Sep–Okt: data historis DEMO.</div></div>
          <div class="card ai"><h3>${ui.icon('ai', 16)} AI Assist <span class="ai-tag">SIMULASI</span></h3>${aiAssist(s, m, main, avg)}</div></div>
        <div class="card"><h3>Semua item dalam MRF</h3>${ui.table([{ h: 'Item', f: (x) => esc(S.itemName(s, x.item)) }, { h: 'Jenis', f: (x) => (x.kind === 'ROUTINE' ? 'BHP rutin' : 'Non-rutin') }, { h: 'Qty', num: true, f: (x) => x.qty }, { h: 'Nilai', num: true, f: (x) => U.rp(x.value) }, { h: 'Budget qty', num: true, f: (x) => (x.budget ? x.budget.qty : '—') }, { h: 'Aktual', num: true, f: (x) => (x.budget ? x.budget.actualQty : '—') }, { h: 'Komitmen', num: true, f: (x) => (x.budget ? x.budget.commitQty : '—') }, { h: 'Proyeksi', num: true, f: (x) => (x.budget ? x.projectedQty + ' (' + U.pct(x.ratio) + ')' : '—') }, { h: 'Status', f: (x) => ui.status(x.status) }], bc.lines)}
          <div class="hr"></div>${decisionButtons(ctx, m)}</div>
        <div class="card"><h3>Antrean pengecualian (melebihi budget / non-rutin)</h3>${ui.table([{ h: 'MRF', f: (x) => ui.id(x.id) }, { h: 'Unit', f: (x) => esc(S.orgName(s, x.branch)) }, { h: 'Item', f: (x) => vh.mrfItems(s, x) }, { h: 'Status budget', f: (x) => ui.status(S.mrfBudgetCheck(s, x).status) }, { h: 'Menunggu', f: (x) => esc(HAWK.ROLE_LABEL[S.mrfNextApprover(s, x)] || '—') }, { h: '', f: (x) => `<button class="btn sm ghost" data-a="pickId" data-m="${x.id}">Analisis</button>` }], exc, { empty: 'Tidak ada pengecualian terbuka.' })}</div></div>`;
    },
    actions: {
      pick(el, ctx) {
        ctx.L.id = el.value;
        HAWK.go(30, { id: el.value });
      },
      pickId(el, ctx) {
        HAWK.go(30, { id: el.dataset.m });
      },
      decide: decideAction,
    },
  };
  function aiAssist(s, m, main, avg) {
    const out = [];
    if (main.budget) {
      out.push(['METRIC', `Proyeksi ${U.pct(main.ratio)} dari budget item ${U.BULAN[10]}.`]);
      out.push([main.ratio > 1 ? 'RECOMMENDATION' : 'FACT', main.ratio > 1 ? `Melebihi ${main.projectedQty - main.budget.qty} ${S.item(s, main.item).unit}: setujui sebagian (${Math.max(0, main.budget.qty - main.budget.actualQty - main.budget.commitQty)}) atau ajukan revisi budget (NV-22).` : 'Budget mencukupi untuk permintaan ini.']);
      out.push(['HYPOTHESIS', main.qty > avg * 0.5 ? `Qty permintaan (${main.qty}) besar dibanding rata-rata bulanan (${avg}); cek apakah terkait event/paket promo.` : 'Pola permintaan sesuai rata-rata bulanan.']);
    } else out.push(['FACT', 'Non-rutin: dilacak terpisah; keputusan butuh BU Manager.']);
    const dup = s.mrfs.filter((x) => x.id !== m.id && x.branch === m.branch && ['SUBMITTED', 'APPROVED', 'IN_FULFILLMENT'].includes(x.status) && x.lines.some((l) => l.item === main.item));
    out.push(['FACT', dup.length ? `Ada ${dup.length} MRF lain untuk item sama di unit ini: ${dup.map((d) => d.id).join(', ')}.` : 'Tidak ada permintaan duplikat serupa dalam periode ini.']);
    return out.map(([k, t]) => `<div class="stmt"><span class="kind ${HAWK.AI.KIND[k].cls}">${HAWK.AI.KIND[k].label}</span><span>${esc(t)}</span></div>`).join('') + '<p class="tiny muted" style="margin:8px 0 0">AI tidak menyetujui atau menolak — keputusan tetap di approver.</p>';
  }
})();
