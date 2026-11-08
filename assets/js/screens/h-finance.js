/* Module H — Finance & Accounting (NV-47..52).
   AI capture is UI-ONLY SIMULATION; matching/AP/GL map to HAWK Purchases › Bills / Journal (TO VERIFY).
   Journals are created PENDING_REVIEW and are posted by the HAWK finance engine — no second ledger. */
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
  const short = (v) => U.rp(v, { short: true });
  const days = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 864e5);
  const accBal = (s, prefix) => U.sum(s.journals.flatMap((j) => j.lines.filter((l) => l.acc.startsWith(prefix))), (l) => l.cr - l.dr);
  const bucket = (s, b) => {
    const d = days(s.meta.demoDate, b.due);
    return d <= 0 ? 'Belum jatuh tempo' : d <= 30 ? '1–30 hari' : d <= 60 ? '31–60 hari' : '> 60 hari';
  };
  const BUCKETS = ['Belum jatuh tempo', '1–30 hari', '31–60 hari', '> 60 hari'];
  const conf = (c) => `<span class="badge ${c >= 0.95 ? 'ok' : c >= 0.9 ? 'warn' : 'bad'}">${Math.round(c * 100)}%</span>`;
  const balanced = (j) => Math.round(U.sum(j.lines, (l) => l.dr)) === Math.round(U.sum(j.lines, (l) => l.cr));
  const KIND_LBL = { CONSUMPTION: 'Pemakaian BHP', GOODS_RECEIPT: 'Penerimaan barang (GRNI)', INVOICE_RECOGNITION: 'Pengakuan utang', PAYMENT: 'Pembayaran', STOCK_ADJUSTMENT: 'Penyesuaian opname', RETURN: 'Retur pemakaian', MAINTENANCE_EXPENSE: 'Beban pemeliharaan', CAPITALIZATION: 'Kapitalisasi aset', DISPOSAL: 'Disposal aset' };

  /* ---------- NV-47 Finance Control Dashboard ---------- */
  V[47] = {
    render(ctx) {
      const { s, user } = ctx;
      const open = s.bills.filter((b) => ['DRAFT', 'APPROVED'].includes(b.status));
      const ap = U.sum(open, (b) => b.total);
      const docs = s.docs.filter((d) => ['EXTRACTED', 'MATCHED', 'MISMATCH'].includes(d.status));
      const pend = s.journals.filter((j) => j.status === 'PENDING_REVIEW');
      const grni = accBal(s, '2120');
      const ag = BUCKETS.map((k) => U.sum(open.filter((b) => bucket(s, b) === k), (b) => b.total));
      const spa = S.budgetView(s, 'BGT-2026-SPA');
      return `<div class="stack"><div class="grid g4 keep2">${ui.kpi('Utang usaha terbuka', short(ap), open.length + ' tagihan (draft + disetujui)', 'g-gold', 'finance')}${ui.kpi('Dokumen menunggu', docs.length, 'ekstraksi AI → matching → verifikasi', '', 'doc')}${ui.kpi('Saldo GRNI', short(grni), 'barang diterima belum ditagih', 'g-blue', 'box')}${ui.kpi('Jurnal menunggu review', pend.length, 'diposting oleh engine HAWK', pend.length ? 'g-violet' : '', 'check')}</div>
        <div class="grid g-2-1"><div class="card"><div class="card-head"><h3>Meja kerja Finance</h3><span class="r"><button class="btn sm ghost" data-nav="49">Antrean matching</button></span></div>${vh.taskList(ctx, HAWK.tasks(s, user).slice(0, 8))}</div>
        <div class="card"><h3>Aging utang usaha</h3>${ui.bars({ labels: BUCKETS, series: [{ name: 'Rp', color: '#c99a2e', values: ag.map((x) => Math.round(x / 1000)) }], h: 160, fmt: (x) => U.num(x) + ' rb' })}<p class="tiny muted">Dihitung dari jatuh tempo tagihan vs tanggal demo.</p></div></div>
        <div class="grid g2"><div class="card"><h3>Arus dokumen bulan ini</h3>${ui.stepper(['Capture AI', 'Matching 3 arah', 'Verifikasi manusia', 'AP draft', 'Approval (SoD)', 'Pembayaran'], -1)}
          <dl class="kv"><dt>Dokumen diekstrak</dt><dd>${s.docs.length}</dd><dt>Cocok / selisih</dt><dd>${s.docs.filter((d) => d.match && d.status !== 'REJECTED' && d.match.checks.every((c) => c.ok)).length} / ${s.docs.filter((d) => d.status === 'MISMATCH').length}</dd><dt>Tagihan dibayar (simulasi)</dt><dd>${s.payments.length} · ${short(U.sum(s.payments, (p) => p.amount))}</dd></dl></div>
        <div class="card"><h3>Beban 7P JAENS Spa (YTD)</h3>${spa.lines.filter((l) => l.cls === 'OPEX').map((l) => `<div class="row" style="padding:4px 0;flex-wrap:nowrap"><span class="small" style="width:110px">${ui.p7(l.p)}</span><div style="flex:1">${ui.bar(l.actual / l.revised, l.actual / l.revised > 0.9 ? 'warn' : 'ok')}</div><span class="small num" style="width:80px">${short(l.actual)}</span></div>`).join('')}<button class="btn sm ghost" data-nav="23" style="margin-top:8px">Budget vs Actual (NV-23)</button></div></div></div>`;
    },
  };

  /* ---------- NV-48 AI Invoice & Receipt Capture ---------- */
  HAWK.poCapture48 = {
    render(ctx) {
      const { s, L } = ctx;
      const samples = S.sampleDocs(s);
      const cur = s.docs.find((d) => d.id === L.doc) || s.docs.find((d) => d.status === 'EXTRACTED');
      const fl = cur && cur.fields;
      return `<div class="stack"><div class="alert violet">${ui.icon('ai', 16)}<div><b>Ekstraksi AI = SIMULASI deterministik.</b> Tidak ada OCR atau model AI nyata dan tidak ada file yang diunggah ke mana pun. Pilih dokumen contoh di bawah — field & tingkat keyakinan dihasilkan dari data DEMO. <span class="mono">doc.capture</span> ${ui.intBadge('UI-ONLY SIMULATION')}</div></div>
        <div class="grid g-1-2"><div class="card"><h3>${ui.icon('camera', 16)} Unggah / foto faktur</h3><div class="scanbox" style="position:relative;margin-bottom:10px"><div style="text-align:center"><div style="font-size:30px">🧾</div><span class="small muted">Pilih dokumen contoh (simulasi)</span></div></div>
          ${samples.map((d) => `<div class="itemcard" style="margin-bottom:8px"><div style="font-size:24px">${d.file.endsWith('pdf') ? '📄' : '🖼️'}</div><div style="flex:1"><b class="small">${esc(d.title)}</b><div class="tiny muted mono">${esc(d.file)}</div></div><button class="btn sm" data-a="cap" data-k="${d.key}" ${ctx.can('doc.capture') ? '' : 'disabled'}>Ekstrak</button></div>`).join('')}
          ${samples.length < 4 ? '<p class="tiny muted">Faktur contoh A/B muncul setelah PO PT Aroma Bali Lestari diterima & diposting di gudang; D setelah PO linen diterima.</p>' : ''}</div>
        <div class="card">${cur ? `<div class="card-head"><h3>${ui.id(cur.id)} ${ui.status(cur.status)}</h3><span class="r tiny muted mono">${esc(cur.file)}</span></div>
          <div class="grid g2"><dl class="kv"><dt>Supplier (teks)</dt><dd>${esc(fl.supplierText)} ${conf(cur.confidence.supplierText)}</dd><dt>No. faktur</dt><dd class="mono">${esc(fl.invoiceNo)} ${conf(cur.confidence.invoiceNo)}</dd><dt>Tanggal</dt><dd>${U.date(fl.invoiceDate)} ${conf(cur.confidence.invoiceDate)}</dd><dt>Ref. PO</dt><dd class="mono">${esc(fl.poText)} ${conf(cur.confidence.poText)}</dd></dl>
          <dl class="kv"><dt>Subtotal</dt><dd class="num">${U.rp(fl.subtotal)}</dd><dt>PPN 11%</dt><dd class="num">${U.rp(fl.tax)}</dd><dt>Total</dt><dd class="num"><b>${U.rp(fl.total)}</b> ${conf(cur.confidence.total)}</dd></dl></div>
          <div style="margin-top:10px">${ui.table([{ h: 'Deskripsi', f: (l) => esc(l.desc) }, { h: 'Qty', num: true, f: (l) => l.qty }, { h: 'Harga', num: true, f: (l) => U.rp(l.price) }, { h: 'Jumlah', num: true, f: (l) => U.rp(l.qty * l.price) }], cur.lines)}</div>
          <div class="alert warn" style="margin-top:10px">${ui.icon('alert', 16)}<span>Hasil AI <b>bukan</b> fakta keuangan. Wajib dicocokkan dengan PO & penerimaan, lalu diverifikasi manusia sebelum menjadi tagihan.</span></div>
          <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" data-a="match" data-p="${cur.id}">Lanjut ke matching →</button></div>` : ui.empty('Belum ada dokumen yang diekstrak. Pilih dokumen contoh di kiri.')}
          ${s.docs.length ? `<div class="hr"></div><h3>Dokumen terekstrak</h3>${ui.table([{ h: 'Dokumen', f: (d) => `<button class="link" data-a="sel" data-p="${d.id}">${d.id}</button>` }, { h: 'File', f: (d) => `<span class="tiny mono">${esc(d.file)}</span>` }, { h: 'No. faktur', f: (d) => `<span class="mono tiny">${esc(d.fields.invoiceNo)}</span>` }, { h: 'Status', f: (d) => ui.status(d.status) }], s.docs)}` : ''}</div></div></div>`;
    },
    actions: {
      cap(el, ctx) {
        const r = ctx.act('doc.capture', { sample: el.dataset.k }, (d) => `${d.id} diekstrak (simulasi) — periksa field lalu lanjut matching`);
        if (r.ok) {
          ctx.L.doc = r.data.id;
          ctx.rerender();
        }
      },
      sel(el, ctx) {
        ctx.L.doc = el.dataset.p;
        ctx.rerender();
      },
      match(el, ctx) {
        const r = ctx.act('doc.match', { id: el.dataset.p }, (d) => `${d.id}: ${ui.statusLabel(d.status)}`);
        if (r.ok) HAWK.go(49, { id: r.data.id });
      },
    },
  };

  /* ---------- NV-49 Three-Way Matching ---------- */
  V[49] = {
    render(ctx) {
      const { s, L, q: qq } = ctx;
      const queue = s.docs.filter((d) => ['EXTRACTED', 'MATCHED', 'MISMATCH'].includes(d.status));
      const d = s.docs.find((x) => x.id === (L.id || qq.id)) || queue[0];
      const list = `<div class="card"><h3>Antrean (${queue.length})</h3>${ui.table([{ h: 'Dokumen', f: (x) => `<button class="link" data-a="sel" data-p="${x.id}">${x.id}</button>` }, { h: 'Supplier', f: (x) => esc(x.fields.supplierText) }, { h: 'Total', num: true, f: (x) => U.rp(x.fields.total) }, { h: 'Status', f: (x) => ui.status(x.status) }], queue, { empty: 'Tidak ada dokumen menunggu. Ekstrak faktur di NV-48.', rowCls: (x) => (d && x.id === d.id ? 'sel' : '') })}</div>`;
      if (!d) return `<div class="stack">${list}<div style="text-align:center"><button class="btn" data-nav="48">Ke AI capture (NV-48)</button></div></div>`;
      const m = d.match;
      const po = m && m.po && S.findRecord(s, m.po).rec;
      const detail = !m
        ? `<div class="card"><h3>${ui.id(d.id)} ${ui.status(d.status)}</h3><p class="small">Belum dicocokkan.</p><button class="btn" data-a="run" data-p="${d.id}">Jalankan matching 3 arah</button></div>`
        : `<div class="card"><div class="card-head"><h3>${ui.id(d.id)} ${ui.status(d.status)}</h3><span class="r">${m.po ? ui.id(m.po) : ''} ${m.grn ? ui.id(m.grn) : ''}</span></div>
          <div class="grid g3">${['PO (dipesan)', 'GRN (diterima)', 'Faktur (ditagih)'].map((h, i) => `<div class="p7" style="--pc:${['#2f6fde', '#0f9d8a', '#8b5cf6'][i]}"><div class="nm">${h}</div><div class="v" style="font-size:15px">${i === 0 ? (po ? U.rp(S.poTotals(s, po).subtotal) : '—') : i === 1 ? (po ? U.rp(U.sum(po.lines, (l) => l.received * l.price)) : '—') : U.rp(d.fields.subtotal)}</div><div class="tiny muted">${i === 0 ? 'subtotal PO' : i === 1 ? 'nilai diterima (harga PO)' : 'subtotal faktur'}</div></div>`).join('')}</div>
          <div style="margin-top:10px">${ui.table(
            [
              { h: 'Item', f: (l) => esc(l.desc) },
              { h: 'Qty PO', num: true, f: (l) => l.poQty },
              { h: 'Qty diterima', num: true, f: (l) => l.recvQty },
              { h: 'Qty faktur', num: true, f: (l) => `<b class="${l.qtyOk ? '' : 'bad-t'}">${l.invQty}</b>` },
              { h: 'Harga PO', num: true, f: (l) => (l.poPrice !== null ? U.rp(l.poPrice) : '—') },
              { h: 'Harga faktur', num: true, f: (l) => `<b class="${l.priceOk ? '' : 'bad-t'}">${U.rp(l.invPrice)}</b>` },
              { h: 'Hasil', f: (l) => (l.qtyOk && l.priceOk ? '<span class="badge ok">Cocok</span>' : '<span class="badge bad">Selisih</span>') },
            ],
            m.lines
          )}</div>
          <div style="margin-top:10px">${m.checks.map((c) => `<div class="row small" style="padding:4px 0;flex-wrap:nowrap"><span class="badge ${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '✕'}</span><b style="width:220px">${esc(c.label)}</b><span class="muted">${esc(c.detail)}</span></div>`).join('')}</div>
          ${['MATCHED', 'MISMATCH'].includes(d.status) && ctx.can('doc.verify') ? `<div class="hr"></div><div class="field"><label>Catatan verifikator ${d.status === 'MISMATCH' ? '(wajib ≥ 10 karakter — jelaskan selisih)' : '(opsional)'}</label><textarea class="inp" id="vf-note" rows="2"></textarea></div>
          <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn ghost sm" data-a="run" data-p="${d.id}">Jalankan ulang</button><button class="btn bad" data-a="rej" data-p="${d.id}">Tolak dokumen</button><button class="btn ok" data-a="ver" data-p="${d.id}">${ui.icon('check')} Verifikasi & buat AP draft</button></div>
          <p class="tiny muted">Faktur duplikat tidak bisa dibuatkan tagihan. Verifikator tercatat dan <b>tidak boleh</b> menyetujui tagihan yang sama (pemisahan tugas).</p>` : ''}</div>`;
      return `<div class="stack"><div class="grid g-1-2">${list}${detail}</div></div>`;
    },
    actions: {
      sel(el, ctx) {
        ctx.L.id = el.dataset.p;
        ctx.rerender();
      },
      run(el, ctx) {
        ctx.L.id = el.dataset.p;
        ctx.act('doc.match', { id: el.dataset.p }, (d) => `${d.id}: ${ui.statusLabel(d.status)}`);
      },
      ver(el, ctx) {
        const r = ctx.act('doc.verify', { id: el.dataset.p, decision: 'APPROVE', note: ctx.val('vf-note') }, (b) => `AP draft ${b.id} dibuat — menunggu approval (bukan oleh verifikator)`);
        if (r.ok) HAWK.go(50, { id: r.data.id });
      },
      rej(el, ctx) {
        const note = ctx.val('vf-note');
        if (note) return ctx.act('doc.verify', { id: el.dataset.p, decision: 'REJECT', note }, 'Dokumen ditolak');
        ui.ask('Tolak dokumen', 'Alasan penolakan', (n) => ctx.act('doc.verify', { id: el.dataset.p, decision: 'REJECT', note: n }, 'Dokumen ditolak'), { danger: true, ok: 'Tolak' });
      },
    },
  };

  /* ---------- NV-50 Accounts Payable & Payment Control ---------- */
  V[50] = {
    render(ctx) {
      const { s, L, q: qq } = ctx;
      const cur = L.t || 'OPEN';
      const list = s.bills.filter((b) => (cur === 'OPEN' ? ['DRAFT', 'APPROVED'].includes(b.status) : cur === 'PAID' ? b.status === 'PAID' : true));
      const b = s.bills.find((x) => x.id === (L.sel || qq.id)) || list[0];
      const open = s.bills.filter((x) => ['DRAFT', 'APPROVED'].includes(x.status));
      let detail = ui.empty('Tidak ada tagihan.');
      if (b) {
        const tr = S.trace(s, b.id);
        const mrfs = tr.filter((x) => /^PR/.test(x));
        const sod = b.verifiedBy === ctx.user.id;
        detail = `<div class="card"><div class="card-head"><h3>${ui.id(b.id)} ${ui.status(b.status)}</h3><span class="r">${b.matchStatus === 'MISMATCH' ? '<span class="badge bad">Selisih dijelaskan</span>' : '<span class="badge ok">3-way match</span>'}</span></div>
          <dl class="kv"><dt>Supplier</dt><dd>${esc(S.supplierName(s, b.supplier))}</dd><dt>No. faktur</dt><dd class="mono">${esc(b.invoiceNo)}</dd><dt>PO / GRN</dt><dd>${ui.id(b.po)} ${ui.id(b.grn)}</dd><dt>Subtotal + PPN</dt><dd>${U.rp(b.subtotal)} + ${U.rp(b.tax)}</dd><dt>Total</dt><dd><b>${U.rp(b.total)}</b></dd><dt>Jatuh tempo</dt><dd>${U.date(b.due)} · ${bucket(s, b)}</dd><dt>Diverifikasi</dt><dd>${esc(S.userName(s, b.verifiedBy))}</dd><dt>Disetujui</dt><dd>${esc(S.userName(s, b.approvedBy))}</dd>${b.exceptionNote ? `<dt>Catatan selisih</dt><dd>${esc(b.exceptionNote)}</dd>` : ''}</dl>
          <div class="hr"></div><h3>${ui.icon('link', 16)} Telusuri ke MRF asal</h3><div class="row">${tr.map((x, i) => `${i ? '<span class="muted">→</span>' : ''}${x === b.id ? `<b class="mono">${x}</b>` : ui.id(x)}`).join(' ')}</div>
          ${mrfs.length ? `<p class="small" style="margin:8px 0 0">MRF asal: ${mrfs.map(ui.id).join(' ')} — klik untuk membuka permintaan staf, approval supervisor & dampak budget.</p>` : '<p class="tiny muted">Tagihan ini dari PO replenishment (tanpa MRF).</p>'}
          <div class="hr"></div><div class="row" style="justify-content:flex-end">
          ${b.status === 'DRAFT' && ctx.can('bill.approve') ? (sod ? '<span class="badge warn">Anda verifikator tagihan ini — approval harus oleh orang lain (SoD). Ganti ke BU Manager.</span>' : `<button class="btn ok" data-a="appr" data-p="${b.id}">${ui.icon('check')} Setujui tagihan</button>`) : ''}
          ${b.status === 'APPROVED' && ctx.can('bill.pay') ? `<button class="btn" data-a="pay" data-p="${b.id}">Bayar (konfirmasi)…</button>` : ''}
          ${b.status === 'APPROVED' && !ctx.can('bill.pay') ? '<span class="badge warn">Pembayaran oleh Finance</span>' : ''}</div>
          <p class="tiny muted" style="margin:8px 0 0">Approval → jurnal Dr GRNI + PPN Masukan (+ selisih harga) / Cr Utang Usaha. Pembayaran disimulasikan — tidak ada dana keluar. AI tidak pernah menyetujui pembayaran.</p></div>`;
      }
      const ag = BUCKETS.map((k) => ({ k, rows: open.filter((x) => bucket(s, x) === k) }));
      return `<div class="stack"><div class="grid g4 keep2">${ui.kpi('Draft (perlu approval)', s.bills.filter((x) => x.status === 'DRAFT').length, short(U.sum(s.bills.filter((x) => x.status === 'DRAFT'), (x) => x.total)), 'g-gold', 'inbox')}${ui.kpi('Disetujui, belum dibayar', s.bills.filter((x) => x.status === 'APPROVED').length, short(U.sum(s.bills.filter((x) => x.status === 'APPROVED'), (x) => x.total)), '', 'finance')}${ui.kpi('Dibayar (simulasi)', s.payments.length, short(U.sum(s.payments, (p) => p.amount)), '', 'check')}${ui.kpi('Jatuh tempo ≤ 7 hari', open.filter((x) => days(x.due, s.meta.demoDate) <= 7).length, 'prioritas pembayaran', '', 'alert')}</div>
        ${ui.tabs('t', [['OPEN', 'Terbuka', open.length], ['PAID', 'Dibayar'], ['ALL', 'Semua', s.bills.length], ['AGING', 'Aging']], cur)}
        ${cur === 'AGING' ? `<div class="card">${ui.table([{ h: 'Bucket', f: (r) => `<b>${r.k}</b>` }, { h: 'Tagihan', f: (r) => r.rows.map((x) => ui.id(x.id)).join(' ') || '—' }, { h: 'Jumlah', num: true, f: (r) => U.rp(U.sum(r.rows, (x) => x.total)) }], ag)}<p class="tiny muted">Setara tab AGED PAYABLE di register Purchases HAWK ${ui.intBadge('TO VERIFY')}.</p></div>`
        : `<div class="grid g-1-2"><div class="card">${ui.table([{ h: 'Tagihan', f: (x) => `<button class="link" data-a="sel" data-p="${x.id}">${x.id}</button>` }, { h: 'Supplier', f: (x) => esc(S.supplierName(s, x.supplier).replace(' (DEMO)', '')) }, { h: 'Total', num: true, f: (x) => U.rp(x.total) }, { h: 'Status', f: (x) => ui.status(x.status) }], list, { empty: 'Tidak ada tagihan.', rowCls: (x) => (b && x.id === b.id ? 'sel' : '') })}</div>${detail}</div>`}</div>`;
    },
    actions: {
      sel(el, ctx) {
        ctx.L.sel = el.dataset.p;
        ctx.rerender();
      },
      appr(el, ctx) {
        ctx.L.sel = el.dataset.p;
        ctx.act('bill.approve', { id: el.dataset.p }, (b) => `${b.id} disetujui — jurnal ${b.journal} menunggu review`);
      },
      pay(el, ctx) {
        const b = ctx.s.bills.find((x) => x.id === el.dataset.p);
        ui.openModal(
          'Konfirmasi pembayaran ' + b.id,
          `<div class="alert warn">${ui.icon('alert', 16)}<span>SIMULASI — tidak ada transfer bank nyata. Pembayaran membutuhkan konfirmasi manusia eksplisit (aturan AR-11).</span></div>
          <dl class="kv" style="margin-top:10px"><dt>Supplier</dt><dd>${esc(S.supplierName(ctx.s, b.supplier))}</dd><dt>Faktur</dt><dd class="mono">${esc(b.invoiceNo)}</dd><dt>Jumlah</dt><dd><b>${U.rp(b.total)}</b></dd></dl>
          <label class="small" style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="pay-ok"> Saya telah memeriksa tagihan, PO, penerimaan & rekening tujuan.</label>`,
          `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" data-a="payGo" data-p="${b.id}">Bayar</button>`
        );
      },
      payGo(el, ctx) {
        const ok = document.getElementById('pay-ok').checked;
        const r = ctx.act('bill.pay', { id: el.dataset.p, confirm: ok }, (b) => `${b.id} dibayar (simulasi)`);
        if (r.ok) ui.closeModal();
      },
    },
  };

  /* ---------- NV-51 GL Posting & Exception Review ---------- */
  V[51] = {
    render(ctx) {
      const { s, L } = ctx;
      const cur = L.t || 'PENDING_REVIEW';
      const list = s.journals.filter((j) => j.status === cur);
      const exc = [];
      s.journals.forEach((j) => {
        if (!balanced(j)) exc.push({ j, t: 'Tidak seimbang' });
        if (j.lines.some((l) => l.acc.startsWith('5190'))) exc.push({ j, t: 'Selisih harga pembelian' });
        if (j.kind === 'STOCK_ADJUSTMENT') exc.push({ j, t: 'Penyesuaian stok (opname)' });
      });
      const grni = accBal(s, '2120');
      return `<div class="stack"><div class="alert info">${ui.icon('alert', 16)}<span>Jurnal dibuat otomatis oleh transaksi operasional dengan status <b>Menunggu review</b>. "Posting" meneruskannya ke engine keuangan HAWK (simulasi) — prototipe ini <b>tidak</b> memiliki buku besar kedua. <span class="mono">gl.post</span> ${ui.intBadge('TO VERIFY')}</span></div>
        <div class="grid g4 keep2">${ui.kpi('Menunggu review', s.journals.filter((j) => j.status === 'PENDING_REVIEW').length, 'jurnal', 'g-gold', 'check')}${ui.kpi('Diposting', s.journals.filter((j) => j.status === 'POSTED').length, 'jurnal', '', 'doc')}${ui.kpi('Eksepsi', exc.length, 'perlu perhatian', exc.length ? 'g-violet' : '', 'alert')}${ui.kpi('Saldo GRNI', short(grni), 'akun 2120', 'g-blue', 'box')}</div>
        ${ui.tabs('t', [['PENDING_REVIEW', 'Menunggu review', s.journals.filter((j) => j.status === 'PENDING_REVIEW').length], ['POSTED', 'Diposting']], cur)}
        <div class="grid g-2-1"><div class="stack">${list.length ? list.map((j) => `<div class="card"><div class="card-head"><h3><span class="mono">${j.id}</span> · ${esc(KIND_LBL[j.kind] || j.kind)}</h3><span class="r">${ui.status(j.status)} ${balanced(j) ? '<span class="badge ok">Seimbang</span>' : '<span class="badge bad">Tidak seimbang</span>'}</span></div>
          <div class="small" style="margin-bottom:6px">Sumber: ${ui.id(j.source)} · ${U.datetime(j.ts)}${j.memo ? ' · ' + esc(j.memo) : ''}</div>
          ${ui.table([{ h: 'Akun', f: (l) => esc(l.acc) }, { h: 'Cost center', f: (l) => `<span class="mono tiny">${esc(l.cc || '')}</span>` }, { h: 'Debit', num: true, f: (l) => (l.dr ? U.rp(l.dr) : '') }, { h: 'Kredit', num: true, f: (l) => (l.cr ? U.rp(l.cr) : '') }], j.lines, { foot: `<td colspan="2"><b>Total</b></td><td class="num"><b>${U.rp(U.sum(j.lines, (l) => l.dr))}</b></td><td class="num"><b>${U.rp(U.sum(j.lines, (l) => l.cr))}</b></td>` })}
          ${j.status === 'PENDING_REVIEW' && ctx.can('gl.post') ? `<div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn sm" data-a="post" data-p="${j.id}">Posting ke HAWK Finance</button></div>` : j.postedBy ? `<p class="tiny muted" style="margin:6px 0 0">Diposting ${esc(S.userName(s, j.postedBy))} · ${U.datetime(j.postedAt)}</p>` : ''}</div>`).join('') : `<div class="card">${ui.empty('Tidak ada jurnal di tab ini.')}</div>`}</div>
        <div class="card" style="align-self:start"><h3>Eksepsi</h3>${exc.length ? exc.map((x) => `<div class="row small" style="padding:4px 0"><span class="badge warn">${esc(x.t)}</span><span class="mono">${x.j.id}</span>${ui.id(x.j.source)}</div>`).join('') : '<p class="small muted">Tidak ada eksepsi.</p>'}
          ${list.length > 1 && cur === 'PENDING_REVIEW' && ctx.can('gl.post') ? `<div class="hr"></div><button class="btn block ghost" data-a="postAll">Posting semua yang seimbang (${list.filter(balanced).length})</button>` : ''}
          <div class="hr"></div><p class="tiny muted">Aturan: PO tidak menghasilkan jurnal. Penerimaan → Persediaan/GRNI. Pemakaian → Beban 7P. Tagihan → GRNI/Utang. Pembayaran → Utang/Bank.</p></div></div></div>`;
    },
    actions: {
      post(el, ctx) {
        ctx.act('gl.post', { id: el.dataset.p }, (j) => `${j.id} diteruskan ke HAWK Finance (simulasi)`);
      },
      postAll(el, ctx) {
        const ids = ctx.s.journals.filter((j) => j.status === 'PENDING_REVIEW' && balanced(j)).map((j) => j.id);
        let n = 0;
        ids.forEach((id) => {
          const r = HAWK.api.call('gl.post', { id }, ctx.user);
          if (r.ok) n++;
        });
        ui.toast(`${n} jurnal diposting (simulasi)`, 'ok', `gl.post × ${n} · TO VERIFY · mode ${HAWK.api.mode}`);
        ctx.rerender();
      },
    },
  };

  /* ---------- NV-52 Cost Allocation & Inter-BU Reconciliation ---------- */
  V[52] = {
    render(ctx) {
      const { s } = ctx;
      const bus = U.uniq(s.sharedAllocations.flatMap((a) => Object.keys(a.splits)));
      const tot = (bu) => U.sum(s.sharedAllocations, (a) => a.monthlyCost * (a.splits[bu] || 0));
      const inter = s.transfers.filter((t) => S.buOf(s, S.wh(s, t.from).org) !== S.buOf(s, S.wh(s, t.to).org) && t.status !== 'REQUESTED');
      const val = (t) => U.sum(t.lines, (l) => l.qty * S.avgCost(s, l.item));
      const grniRows = s.pos.filter((p) => p.lines.some((l) => l.received > 0)).map((p) => {
        const recv = U.sum(p.lines, (l) => l.received * l.price);
        const billed = U.sum(s.bills.filter((b) => b.po === p.id && ['APPROVED', 'PAID'].includes(b.status)), (b) => b.subtotal);
        return { p, recv, billed };
      });
      return `<div class="stack"><div class="grid g4 keep2">${bus.map((bu, i) => ui.kpi('Alokasi ke ' + S.orgName(s, bu), short(tot(bu)), 'per bulan dari biaya HQ', i ? 'g-violet' : 'g-teal', 'org')).join('')}${ui.kpi('Biaya HQ dialokasikan', short(U.sum(s.sharedAllocations, (a) => a.monthlyCost)), 'per bulan · DEMO', '', 'finance')}${ui.kpi('Transfer antar-BU', inter.length, short(U.sum(inter, val)), '', 'arrow')}</div>
        <div class="card"><div class="card-head"><h3>Alokasi biaya kantor bersama (shared office)</h3><span class="r"><button class="btn sm ghost" data-nav="7">Ubah formula (NV-07)</button></span></div>${ui.table(
          [
            { h: 'Pool biaya', f: (a) => `<b>${esc((s.costCenters.find((c) => c.id === a.pool) || {}).name || a.pool)}</b><div class="tiny muted mono">${a.pool}</div>` },
            { h: 'Dasar alokasi', f: (a) => esc(a.basis) },
            { h: 'Biaya / bulan', num: true, f: (a) => U.rp(a.monthlyCost) },
            ...bus.map((bu) => ({ h: S.orgName(s, bu), num: true, f: (a) => `${U.rp(a.monthlyCost * (a.splits[bu] || 0))}<div class="tiny muted">${U.pct(a.splits[bu] || 0)}</div>` })),
          ],
          s.sharedAllocations
        )}<p class="tiny muted" style="margin:8px 0 0">Alokasi adalah distribusi manajerial (bukan jurnal kedua). Hanya BU dalam lingkup Spa–Essence; BU JAENS lain tidak dialokasikan tanpa otorisasi.</p></div>
        <div class="grid g2"><div class="card"><h3>Rekonsiliasi transfer antar-BU</h3>${ui.table([{ h: 'Transfer', f: (t) => ui.id(t.id) }, { h: 'Dari → Ke', f: (t) => `${esc(S.orgName(s, S.buOf(s, S.wh(s, t.from).org)))} → ${esc(S.orgName(s, S.buOf(s, S.wh(s, t.to).org)))}` }, { h: 'Nilai', num: true, f: (t) => U.rp(val(t)) }, { h: 'Status', f: (t) => ui.status(t.status) }], inter, { empty: 'Tidak ada transfer antar-BU (transfer antar cabang dalam satu BU tidak perlu rekonsiliasi).' })}</div>
        <div class="card"><h3>Rekonsiliasi GRNI per PO</h3>${ui.table([{ h: 'PO', f: (r) => ui.id(r.p.id) }, { h: 'Diterima', num: true, f: (r) => U.rp(r.recv) }, { h: 'Ditagih', num: true, f: (r) => U.rp(r.billed) }, { h: 'Selisih', num: true, f: (r) => `<b class="${r.recv - r.billed > 0 ? 'bad-t' : 'ok-t'}">${U.rp(r.recv - r.billed)}</b>` }], grniRows, { empty: 'Belum ada penerimaan barang.' })}<p class="tiny muted" style="margin:8px 0 0">Selisih positif = barang sudah diterima tetapi tagihan belum disetujui (saldo GRNI).</p></div></div></div>`;
    },
  };
})();
