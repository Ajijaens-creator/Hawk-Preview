/* Order Sederhana — simple mobile ordering for non-technical staff (inside NV-24; no new NV numbers).
   Humans act at three points only: Pesan (staff) · Barang diterima (staff) · Sudah dibayar (Finance).
   Everything in between runs on rule AR-13 (configurable by Finance / Super Admin / Owner) — rules, NOT AI. */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const esc = U.esc;
  const V = HAWK.views;
  const thumb = (it) => HAWK.vh.thumb(it);
  const homeBranch = (ctx) => (ctx.scope.branch && ctx.scope.branch !== 'ALL' && (S.org(ctx.s, ctx.scope.branch) || {}).type === 'BRANCH' ? ctx.scope.branch : ctx.user.scope.find((x) => (S.org(ctx.s, x) || {}).type === 'BRANCH') || 'BR-SHN');
  const myOrders = (ctx) => ctx.s.mrfs.filter((m) => m.simple && (ctx.role === 'STAFF' ? m.requester === ctx.user.id || ctx.user.scope.includes(m.branch) : ctx.inScope(m.branch)));
  const canReceive = (ctx, m) => ctx.can('order.receive') && (ctx.role !== 'STAFF' || m.requester === ctx.user.id || ctx.user.scope.includes(m.branch));
  const left = (s, branch, item) => {
    const b = S.itemBudget(s, branch, item);
    return b ? Math.max(0, b.qty - b.actualQty - b.commitQty) : null;
  };

  /* expected now, per item: stock reserved locally + in-transit transfers + outstanding supplier delivery */
  const expected = (s, m) =>
    m.lines.map((l) => {
      const nonPo = U.sum(l.alloc.filter((a) => a.path !== 'PURCHASE'), (a) => a.qty - a.issuedQty);
      const po = U.sum(l.alloc.filter((a) => a.path === 'PURCHASE' && a.ref), (a) => {
        const p = s.pos.find((x) => x.id === a.ref);
        const pl = p && p.lines.find((x) => x.item === l.item);
        return pl ? Math.max(0, pl.qty - pl.received) : 0;
      });
      return { item: l.item, qty: nonPo + po };
    }).filter((x) => x.qty > 0);

  function steps(stage) {
    const names = ['Dipesan', 'Disetujui & dikirim', 'Diterima'];
    const at = stage.key === 'DONE' ? 3 : stage.key === 'ARRIVE' ? 2 : stage.key === 'PROC' ? 1 : stage.key === 'WAIT' ? 0 : -1;
    return `<div class="so-steps">${names.map((n, i) => `<span class="${i < at || (i === 0 && at >= 0) ? 'on' : ''} ${i === at && at < 3 && i > 0 ? 'cur' : ''}"><i>${i < at || (at === 3) || (i === 0 && at >= 0) ? '✓' : i + 1}</i>${n}</span>`).join('')}</div>`;
  }

  function orderCard(ctx, m) {
    const s = ctx.s;
    const st = S.simpleStage(s, m);
    const tone = { WAIT: 'warn', ARRIVE: 'info', DONE: 'ok', STOP: 'bad', PROC: 'info' }[st.key];
    const pos = S.simplePOs(s, m);
    const pay = pos.length ? (pos.every((p) => S.poPayState(s, p).status === 'PAID') ? 'Lunas' : 'Belum dibayar') : 'Dari stok — tanpa pembayaran';
    return `<div class="so-card" data-order="${m.id}">
      <div class="row between" style="flex-wrap:nowrap;gap:8px"><b class="small">${m.lines.map((l) => `${thumb(S.item(s, l.item))} ${esc(S.itemName(s, l.item))} × ${l.qty}`).join('<br>')}</b><span class="mono tiny muted" style="white-space:nowrap">${ui.id(m.id)}</span></div>
      ${steps(st)}
      <div class="so-msg ${tone}">${esc(st.label)}</div>
      ${m.autoCheck && !m.autoCheck.ok && st.key === 'WAIT' ? `<div class="tiny muted" style="margin-top:4px">Kenapa perlu persetujuan: ${esc(m.autoCheck.why.join('; '))}</div>` : ''}
      <div class="tiny muted" style="margin-top:6px">${U.rp(S.mrfValue(s, m))} · ${U.datetime(m.date)} · Pembayaran: ${pay}</div>
      ${st.key === 'ARRIVE' && canReceive(ctx, m) ? `<button class="btn lg block so-big ok" data-a="recv" data-id2="${m.id}">✅ Barang sudah diterima</button><button class="link small" data-a="recvPart" data-id2="${m.id}">Ada yang kurang atau rusak?</button>` : ''}
    </div>`;
  }

  /* ---------- NV-24 → Order Sederhana ---------- */
  const old24 = V[24];
  V[24] = {
    render(ctx) {
      const { s, L } = ctx;
      L.cart = L.cart || {};
      const branch = L.branch || homeBranch(ctx);
      const branches = s.org.filter((o) => o.type === 'BRANCH' && o.status === 'ACTIVE' && (['STAFF', 'SUPERVISOR'].includes(ctx.role) ? ctx.user.scope.includes(o.id) : ctx.inScope(o.id)));
      const items = s.items.filter((i) => i.routine && i.supplier && (S.itemBudget(s, branch, i.id) || L.all));
      const lines = Object.entries(L.cart).filter(([, q]) => q > 0).map(([item, qty]) => ({ item, qty, alloc: [] }));
      const draft = { branch, type: 'ROUTINE', lines, status: 'DRAFT', date: s.meta.demoDate + 'T09:00:00' };
      const chk = lines.length ? S.autoOrderCheck(s, draft) : null;
      const total = U.sum(lines, (l) => l.qty * S.item(s, l.item).price);
      const rule = S.autoRule(s);
      const last = L.last && s.mrfs.find((m) => m.id === L.last);
      const orders = myOrders(ctx);
      const waiting = orders.filter((m) => S.simpleStage(s, m).key === 'ARRIVE');
      const rest = orders.filter((m) => !waiting.includes(m));
      const canOrder = ctx.can('order.quick');
      return `<div class="so-wrap">
        ${last ? `<div class="so-done ${last.autoCheck && last.autoCheck.ok ? 'ok' : 'warn'}"><div style="font-size:30px">${last.autoCheck && last.autoCheck.ok ? '✅' : '⏳'}</div><div><b>${last.autoCheck && last.autoCheck.ok ? 'Pesanan diproses otomatis' : 'Pesanan dikirim ke atasan'}</b><div class="small">${last.autoCheck && last.autoCheck.ok ? 'Tidak perlu menunggu persetujuan. Saat barang datang, tekan <b>Barang sudah diterima</b>.' : esc('Perlu persetujuan karena: ' + last.autoCheck.why.join('; '))}</div><div class="tiny muted">${ui.id(last.id)}</div></div><button class="btn sm ghost" data-a="hideLast" aria-label="Tutup">✕</button></div>` : ''}
        ${waiting.length ? `<div class="card so-pad"><h3 style="margin:0">📦 Barang sedang dikirim (${waiting.length})</h3><p class="small muted" style="margin:4px 0 0">Saat barang sampai, cek jumlahnya lalu tekan tombol hijau.</p>${waiting.map((m) => orderCard(ctx, m)).join('')}</div>` : ''}
        ${canOrder ? `<div class="card so-pad"><div class="row between" style="gap:8px"><h2 style="margin:0">🛒 Pesan barang</h2>${branches.length > 1 ? `<select class="inp" style="max-width:190px" data-ch="branch" aria-label="Untuk unit">${branches.map((b) => `<option value="${b.id}" ${b.id === branch ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>` : `<span class="small muted">${esc(S.orgName(s, branch))}</span>`}</div>
          <p class="small muted" style="margin:6px 0 10px">Pilih barang, tekan <b>+</b>, lalu <b>Pesan sekarang</b>. Budget dicek otomatis.</p>
          <input class="inp" type="search" placeholder="🔍 Cari barang…" data-in="find" aria-label="Cari barang" style="margin-bottom:8px">
          <div class="so-list">${items.map((it) => {
            const q = L.cart[it.id] || 0;
            const lf = left(s, branch, it.id);
            return `<div class="so-item ${q ? 'sel' : ''}" data-name="${esc(it.name.toLowerCase())}"><span class="so-emo">${thumb(it)}</span><div class="so-nm"><b>${esc(it.name)}</b><div class="tiny muted">${U.rp(it.price)} / ${esc(it.unit)}${lf !== null ? ` · sisa budget ${lf} ${esc(it.unit)}` : ''}</div></div>
              <div class="so-qty"><button class="so-b" data-a="inc" data-it="${it.id}" data-d="-1" aria-label="Kurangi ${esc(it.name)}" ${q ? '' : 'disabled'}>−</button><input type="number" inputmode="numeric" min="0" max="9999" value="${q}" data-ch="setq" data-it="${it.id}" aria-label="Jumlah ${esc(it.name)}"><button class="so-b plus" data-a="inc" data-it="${it.id}" data-d="1" aria-label="Tambah ${esc(it.name)}">+</button></div></div>`;
          }).join('') || ui.empty('Belum ada barang rutin ber-budget untuk unit ini.')}</div>
          ${L.all ? '' : '<button class="link small" data-a="showAll" style="margin-top:6px">Tampilkan juga barang tanpa budget</button>'}
          </div>
          <div class="so-bar ${lines.length ? '' : 'empty'}">
            ${lines.length ? `<div class="so-sum"><b>${lines.length} barang · ${U.rp(total)}</b><span class="so-pill ${chk.ok ? 'ok' : 'warn'}">${chk.ok ? '✅ Dalam budget — langsung diproses' : '⚠️ Perlu persetujuan atasan'}</span>${chk.ok ? '' : `<span class="tiny">${esc(chk.why.join('; '))}</span>`}</div><button class="btn lg block so-big" data-a="order">Pesan sekarang</button>` : '<span class="small muted">Belum ada barang dipilih</span>'}
          </div>` : ''}
        <div class="card so-pad"><div class="row between"><h3 style="margin:0">Pesanan saya</h3><button class="link small" data-nav="27">Semua permintaan →</button></div>
          ${rest.length ? rest.slice(0, L.more ? 50 : 6).map((m) => orderCard(ctx, m)).join('') : `<p class="small muted">${waiting.length ? 'Pesanan lain belum ada.' : 'Belum ada pesanan.'}</p>`}
          ${rest.length > 6 && !L.more ? '<button class="link small" data-a="more">Lihat lebih banyak</button>' : ''}</div>
        <div class="so-foot"><button class="btn ghost" data-nav="26">Form lengkap (non-rutin / catatan)</button><button class="btn ghost" data-nav="48">📷 Scan nota pengeluaran</button></div>
        <p class="tiny muted" style="text-align:center">Otomatis bila: barang rutin, dalam budget 7P, dan ≤ ${rule.max === null ? 'tanpa batas' : U.rp(rule.max)} (aturan ${esc(rule.id)}${rule.active ? '' : ' — <b>sedang nonaktif</b>'}). Ini aturan tetap, <b>bukan AI</b>. ${ui.intBadge('NEW INTEGRATION REQUIRED')}</p>
      </div>`;
    },
    actions: {
      inc(el, ctx) {
        const c = ctx.L.cart;
        c[el.dataset.it] = Math.max(0, Math.min(9999, (c[el.dataset.it] || 0) + +el.dataset.d));
        ctx.rerender();
      },
      setq(el, ctx) {
        const v = parseInt(el.value, 10);
        ctx.L.cart[el.dataset.it] = isNaN(v) ? 0 : Math.max(0, Math.min(9999, v));
        ctx.rerender();
      },
      find(el) {
        const q = el.value.trim().toLowerCase();
        document.querySelectorAll('.so-item').forEach((r) => (r.style.display = !q || r.dataset.name.includes(q) ? '' : 'none'));
      },
      branch(el, ctx) {
        ctx.L.branch = el.value;
        ctx.L.cart = {};
        ctx.rerender();
      },
      showAll(el, ctx) {
        ctx.L.all = true;
        ctx.rerender();
      },
      more(el, ctx) {
        ctx.L.more = true;
        ctx.rerender();
      },
      hideLast(el, ctx) {
        delete ctx.L.last;
        ctx.rerender();
      },
      order(el, ctx) {
        const L = ctx.L;
        const lines = Object.entries(L.cart).filter(([, q]) => q > 0).map(([item, qty]) => ({ item, qty }));
        const r = ctx.act('order.quick', { branch: L.branch || homeBranch(ctx), lines }, (m) => (m.autoCheck.ok ? `${m.id} diproses otomatis` : `${m.id} dikirim ke ${HAWK.ROLE_LABEL[m.chain[0]]}`));
        if (r.ok) {
          L.cart = {};
          L.last = r.data.id;
          ctx.rerender();
          window.scrollTo && window.scrollTo(0, 0);
        }
      },
      recv(el, ctx) {
        ctx.act('order.receive', { id: el.dataset.id2 }, (m) => (m.status === 'FULFILLED' ? 'Terima kasih — pesanan selesai' : 'Tercatat. Sisa barang masih dikirim'));
      },
      recvPart(el, ctx) {
        const s = ctx.s;
        const m = s.mrfs.find((x) => x.id === el.dataset.id2);
        const ex = expected(s, m);
        ui.openModal(
          'Barang yang datang',
          `<p class="small">Isi jumlah yang <b>benar-benar datang</b>. Barang rusak ditulis di kolom Rusak — tidak ikut dibayar.</p>${ex
            .map((x, i) => `<div class="so-item" style="margin-top:8px"><span class="so-emo">${thumb(S.item(s, x.item))}</span><div class="so-nm"><b>${esc(S.itemName(s, x.item))}</b><div class="tiny muted">Ditunggu ${x.qty} ${esc(S.item(s, x.item).unit)}</div></div><div class="stack" style="gap:4px;width:110px"><label class="tiny">Datang<input class="inp" type="number" inputmode="numeric" min="0" max="${x.qty}" id="rp-r-${i}" value="${x.qty}"></label><label class="tiny">Rusak<input class="inp" type="number" inputmode="numeric" min="0" id="rp-d-${i}" value="0"></label></div></div>`)
            .join('')}<div class="field" style="margin-top:8px"><label for="rp-note">Catatan (opsional)</label><input class="inp" id="rp-note" maxlength="120" placeholder="Contoh: 2 botol bocor"></div>`,
          `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" id="rp-ok">Simpan penerimaan</button>`
        );
        document.getElementById('rp-ok').onclick = () => {
          const lines = ex.map((x, i) => ({ item: x.item, received: parseInt(document.getElementById('rp-r-' + i).value, 10) || 0, damaged: parseInt(document.getElementById('rp-d-' + i).value, 10) || 0 }));
          if (lines.some((l, i) => l.received > ex[i].qty)) return ui.toast('Jumlah datang tidak boleh melebihi yang ditunggu', 'bad');
          const note = document.getElementById('rp-note').value.trim();
          ui.closeModal();
          ctx.act('order.receive', { id: m.id, lines, note }, 'Penerimaan tercatat — kekurangan tetap ditunggu');
        };
      },
    },
  };
  V[24].legacy = old24;

  /* ---------- Finance: "Sudah dibayar" (top of NV-50) + AR-13 settings ---------- */
  HAWK.payQueue = (s) => s.pos.filter((p) => p.auto && ['SENT', 'PARTIAL', 'RECEIVED'].includes(p.status) && S.poPayState(s, p).rest > 0);
  function payPanel(ctx) {
    const s = ctx.s;
    const q = HAWK.payQueue(s);
    const can = ctx.can('order.pay');
    return `<div class="card so-pad" id="so-pay"><div class="card-head"><h3>💵 Konfirmasi pembayaran — Order Sederhana <span class="sub">${q.length} menunggu</span></h3><span class="r">${ui.intBadge('TO VERIFY')}</span></div>
      <p class="small muted" style="margin:0 0 8px">PO dibuat & dikirim otomatis (AR-13). Setelah transfer ke supplier dilakukan di bank, cukup tekan <b>Sudah dibayar</b>. Bila barang belum datang, dicatat sebagai uang muka dan dikompensasi otomatis saat barang diterima.</p>
      ${q.length ? q.map((p) => {
        const st = S.poPayState(s, p);
        const recv = p.status === 'RECEIVED' ? '<span class="badge ok">Barang sudah diterima</span>' : p.status === 'PARTIAL' ? '<span class="badge warn">Sebagian diterima</span>' : '<span class="badge">Barang belum datang</span>';
        return `<div class="so-card"><div class="row between" style="gap:8px;flex-wrap:wrap"><div><b>${esc(S.supplierName(s, p.supplier))}</b> ${recv}<div class="tiny muted">${ui.id(p.id)} · ${p.lines.map((l) => `${esc(S.itemName(s, l.item))} × ${l.qty}`).join(', ')}</div></div><div style="text-align:right"><b style="font-size:18px">${U.rp(st.rest)}</b><div class="tiny muted">termasuk PPN 11%${st.paid ? ` · sudah dibayar ${U.rp(st.paid)}` : ''}</div></div></div>
          ${can ? `<button class="btn lg block so-big" data-a="soPay" data-po="${p.id}">✅ Sudah dibayar</button>` : ''}</div>`;
      }).join('') : '<p class="small muted">Tidak ada yang menunggu pembayaran. 🎉</p>'}</div>`;
  }
  const payActions = {
    soPay(el, ctx) {
      const s = ctx.s;
      const p = s.pos.find((x) => x.id === el.dataset.po);
      const st = S.poPayState(s, p);
      ui.openModal(
        'Konfirmasi sudah dibayar',
        `<p>Anda menyatakan <b>${U.rp(st.rest)}</b> sudah ditransfer ke <b>${esc(S.supplierName(s, p.supplier))}</b> untuk ${ui.id(p.id)}.</p><div class="alert warn">${ui.icon('alert', 16)}<span>SIMULASI — tidak ada dana keluar dari prototipe ini. Konfirmasi hanya dilakukan manusia (AR-11); sistem & AI tidak pernah membayar.</span></div>`,
        `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" id="sp-ok">Ya, sudah dibayar</button>`
      );
      document.getElementById('sp-ok').onclick = () => {
        ui.closeModal();
        ctx.act('order.pay', { po: p.id, confirm: true }, 'Pembayaran tercatat');
      };
    },
  };

  HAWK.autoSettingsCard = (ctx) => {
    const s = ctx.s;
    const r = S.autoRule(s);
    const can = ctx.can('autoOrder.update');
    const ch = (r.changes || []).slice(0, 4);
    return `<div class="card so-pad" id="so-settings"><div class="card-head"><h3>⚙️ Pengaturan Order Otomatis (${esc(r.id)}) <span class="sub">v${r.version || 1}</span></h3><span class="r">${ui.intBadge('NEW INTEGRATION REQUIRED')}</span></div>
      <p class="small" style="margin:0 0 8px">Pesanan rutin yang <b>dalam budget 7P</b> dan nilainya <b>≤ batas</b> langsung disetujui, dibuatkan PO, dan dikirim ke supplier default — tanpa approval manusia. Selain itu otomatis lewat rantai approval biasa. Hanya <b>Finance, Super Admin, dan Owner</b> yang dapat mengubah. Berlaku untuk pesanan baru.</p>
      ${can ? `<div class="row" style="gap:10px;align-items:flex-end;flex-wrap:wrap">
        <label class="field" style="margin:0"><span class="small">Status</span><select class="inp" id="ao-act"><option value="1" ${r.active ? 'selected' : ''}>Aktif</option><option value="0" ${r.active ? '' : 'selected'}>Nonaktif (semua lewat atasan)</option></select></label>
        <label class="field" style="margin:0"><span class="small">Batas nilai per pesanan (Rp)</span><input class="inp" id="ao-max" type="number" inputmode="numeric" min="0" max="25000000" step="100000" value="${r.max === null ? '' : r.max}" style="width:170px"></label>
        <label class="field" style="margin:0;flex:1;min-width:180px"><span class="small">Alasan perubahan *</span><input class="inp" id="ao-note" maxlength="140" placeholder="Contoh: keputusan rapat Owner"></label>
        <button class="btn" data-a="aoSave">Simpan</button></div>` : `<p class="small"><b>${r.active ? 'Aktif' : 'Nonaktif'}</b> · batas ${r.max === null ? '∞' : U.rp(r.max)}</p>`}
      ${ch.length ? `<div class="tiny muted" style="margin-top:8px">${ch.map((c) => `${U.datetime(c.ts)} · ${esc(S.userName(s, c.by))} (${esc(HAWK.ROLE_LABEL[c.role] || c.role)}): ${c.before.active ? 'aktif' : 'nonaktif'} ${U.rp(c.before.max)} → <b>${c.after.active ? 'aktif' : 'nonaktif'} ${U.rp(c.after.max)}</b> — ${esc(c.note)}`).join('<br>')}</div>` : '<div class="tiny muted" style="margin-top:8px">Belum pernah diubah — nilai awal: keputusan Owner 8 Nov 2026 (DEMO).</div>'}
    </div>`;
  };
  const settingsActions = {
    aoSave(el, ctx) {
      const v = ctx.val('ao-max');
      ctx.act('autoOrder.update', { active: ctx.val('ao-act') === '1', max: v === '' ? undefined : +v, note: ctx.val('ao-note') }, 'Pengaturan order otomatis disimpan');
    },
  };

  const wrap = (nv, top, actions) => {
    const v = V[nv];
    if (!v) return;
    const orig = v.render;
    v.render = (ctx) => {
      const head = top(ctx);
      const body = orig(ctx);
      return head ? `<div class="stack">${head}${body}</div>` : body;
    };
    v.actions = Object.assign(v.actions || {}, actions);
  };
  wrap(50, (ctx) => payPanel(ctx) + (ctx.can('autoOrder.update') ? HAWK.autoSettingsCard(ctx) : ''), Object.assign({}, payActions, settingsActions));
  wrap(9, (ctx) => HAWK.autoSettingsCard(ctx), settingsActions);
})();
