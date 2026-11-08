/* NV-48 — AI Invoice & Receipt Capture, extended with Smart Spend Money (MP-HAWK-05/06).
   Six mobile subviews live INSIDE NV-48 (they are not new NV numbers):
     NV-M1 Beranda & aksi cepat   → tab "Scan Nota" (beranda)
     NV-M2 Ambil foto nota        → tab "Scan Nota" (kamera)
     NV-M3 Periksa hasil AI       → tab "Review Hasil AI" langkah 1
     NV-M4 Klasifikasi & budget   → tab "Review Hasil AI" langkah 2   (budget: NV-23)
     NV-M5 Konfirmasi & approval  → tab "Review Hasil AI" langkah 3   (darurat: NV-37, faktur PO: NV-49)
     NV-M6 Detail & bukti         → tab "Riwayat & Bukti"             (GRN NV-42, AP NV-50, GL NV-51)
   All writes go through HAWK.api.call (spend.* contracts). AI extraction = deterministic AI SIMULATION. */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const esc = U.esc;
  const V = HAWK.views;
  const SP = HAWK.SPEND;
  const PO48 = HAWK.poCapture48;
  const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const num = (v) => (v === '' || v === null || v === undefined ? null : Math.round(+String(v).replace(/[^\d-]/g, '')));
  const fmt = (v) => (v === null || v === undefined || v === '' ? '' : U.num(v));
  const P_NAME = { PEOPLE: 'People', PRODUCT: 'Product', PROMOTION: 'Promotion', PROCESS: 'Process', PLACE: 'Place', FACILITY: 'Facility' };
  const P_HINT = { PEOPLE: 'SDM, pelatihan, seragam', PRODUCT: 'Bahan treatment & produk', PROMOTION: 'Promosi, cetak, event', PROCESS: 'Sistem, SOP, administrasi', PLACE: 'Kebersihan & suasana outlet', FACILITY: 'Perbaikan & pemeliharaan fasilitas' };
  const STATE_LBL = { OK: ['Sesuai', 'ok'], CONFIRM: ['Perlu konfirmasi', 'warn'], BAD: ['Tidak valid / kosong', 'bad'], NONE: ['Tidak ada di nota', ''] };
  const firstName = (n) => String(n || '').split(' ')[0];

  /* overlay local edits on the stored spend (edits are saved only when the user continues) */
  function virt(sp, L) {
    const e = (L.edit && L.edit[sp.id]) || {};
    const v = JSON.parse(JSON.stringify(sp));
    Object.assign(v.fields, e.fields || {});
    ['tax', 'disc', 'total'].forEach((k) => (v.fields[k] = num(v.fields[k])));
    if (e.lines) v.lines = e.lines.map((l, i) => ({ ...(sp.lines[i] || { conf: 1 }), ...l, qty: +l.qty || 0, price: num(l.price) || 0, disc: num(l.disc) || 0 }));
    (e.confirm || []).forEach((k) => !v.confirmed.includes(k) && v.confirmed.push(k));
    // a corrected value counts as user-confirmed
    if (e.fields) Object.keys(e.fields).forEach((k) => String(e.fields[k]) !== String(sp.fields[k] === null ? '' : sp.fields[k]) && v.corrections.push({ field: k }));
    if (e.lines) e.lines.forEach((l, i) => { const o = sp.lines[i]; if (!o || +l.qty !== o.qty || num(l.price) !== o.price || l.desc !== o.desc) v.corrections.push({ field: 'line:' + i }); });
    if (v.fields.pay && SP.PAY[v.fields.pay]) v.flow = SP.PAY[v.fields.pay].flow;
    return v;
  }
  const edit = (L, id) => ((L.edit = L.edit || {}), (L.edit[id] = L.edit[id] || {}));
  const chip = (st) => `<span class="ss-chip ${STATE_LBL[st][1]}">${st === 'OK' ? '✓' : st === 'CONFIRM' ? '!' : st === 'BAD' ? '✕' : '–'} ${STATE_LBL[st][0]}</span>`;
  const conf = (c) => (c === undefined ? '' : `<span class="ss-conf">AI ${Math.round(c * 100)}%</span>`);

  /* ---------- shared pieces ---------- */
  const simBadge = `<span class="ss-sim">${ui.icon('ai', 13)} AI SIMULATION</span>`;
  const head = (title, back) => `<div class="ss-top">${back ? `<button class="ss-ib" data-a="${back}" aria-label="Kembali">${ui.icon('arrow', 18, 'flip')}</button>` : '<span style="width:44px"></span>'}<b>${esc(title)}</b><span class="ss-top-r">${simBadge}</span></div>`;
  const bottomNav = (ctx, cur) => {
    const pend = myQueue(ctx).length;
    const it = [['home', 'home', 'Beranda'], ['history', 'list', 'Riwayat'], ['scan', 'camera', 'Scan'], ['approvals', 'check', 'Approval'], ['budget', 'budget', 'Budget']];
    return `<nav class="ss-nav" aria-label="Navigasi Smart Spend">${it.map(([k, ic, l]) => `<button class="${k === 'scan' ? 'ss-nav-scan' : ''} ${cur === k ? 'on' : ''}" data-a="ss_nav" data-v="${k}" aria-label="${l}">${k === 'scan' ? `<span class="ss-fab">${ui.icon('camera', 24)}</span>` : ui.icon(ic === 'list' ? 'doc' : ic, 20)}<small>${l}</small>${k === 'approvals' && pend ? `<i class="ss-dot">${pend}</i>` : ''}</button>`).join('')}</nav>`;
  };
  const myQueue = (ctx) => (ctx.s.spends || []).filter((sp) => S.canActSpend(ctx.s, sp, ctx.user));
  const statusOf = (s, sp) => S.spendStatus(s, sp);
  const card = (inner, cls = '') => `<div class="ss-card ${cls}">${inner}</div>`;
  const money = (v) => (v === null || v === undefined ? '—' : U.rp(v));

  /* ---------- NV-M1 Beranda ---------- */
  function home(ctx) {
    const { s, user } = ctx;
    const unit = user.scope.map((x) => S.orgName(s, x)).join(', ');
    const mine = (s.spends || []).filter((x) => x.createdBy === user.id && x.status !== 'CANCELLED');
    const q = myQueue(ctx);
    const tile = (a, ic, l, sub, cls = '', badge = '') => `<button class="ss-tile ${cls}" data-a="${a}">${badge}<span class="ss-tile-ic">${ui.icon(ic, 30)}</span><b>${l}</b><small>${sub}</small></button>`;
    return `<div class="ss-screen" data-m="M1">
      <div class="ss-top"><span class="ss-logo">H</span><b>HAWK ERP</b><span class="ss-top-r">${simBadge}</span></div>
      <div class="ss-body">
        <div class="ss-hello"><h2>Halo, ${esc(firstName(user.name))}! 👋</h2><p>${esc(user.title || HAWK.ROLE_LABEL[user.role])} · ${esc(unit)}</p></div>
        <div class="ss-hero glass"><div><b>Smart Spend Money</b><p>Foto nota, AI membantu membaca, Anda memeriksa, lalu kirim ke approval.</p></div><span class="ss-hero-ic">🧾</span></div>
        <div class="ss-grid">
          ${tile('ss_scan', 'camera', 'Scan Nota', 'Foto / unggah nota', 'gold')}
          ${tile('ss_manual', 'plus', 'Pengeluaran Baru', 'Isi tanpa foto')}
          ${tile('ss_hist', 'doc', 'Riwayat', mine.length + ' pengeluaran saya')}
          ${tile('ss_appr', 'check', 'Persetujuan', q.length ? q.length + ' menunggu Anda' : 'Tidak ada antrean', '', q.length ? `<i class="ss-badge">${q.length}</i>` : '')}
          ${tile('ss_budget', 'budget', 'Cek Budget', 'Sisa budget bulan ini', 'wide')}
        </div>
        ${mine.length ? `<h4 class="ss-h4">Terakhir</h4>${mine.slice(0, 3).map((x) => rowItem(ctx, x)).join('')}` : ''}
      </div>${bottomNav(ctx, 'home')}</div>`;
  }
  function rowItem(ctx, sp) {
    const st = statusOf(ctx.s, sp);
    return `<button class="ss-row" data-a="ss_open" data-p="${sp.id}"><span class="ss-row-ic">${sp.emergency ? '🚨' : sp.flow === 'REIMBURSE' ? '👛' : sp.flow === 'UNPAID' ? '📨' : sp.flow === 'PO' ? '📦' : '🧾'}</span><span class="ss-row-m"><b>${esc(sp.fields.supplier || 'Tanpa supplier')}</b><small>${sp.id} · ${sp.fields.date ? U.date(sp.fields.date) : '—'}</small></span><span class="ss-row-r"><b>${money(sp.fields.total)}</b>${ui.status(st)}</span></button>`;
  }

  /* ---------- NV-M2 Ambil foto ---------- */
  function capture(ctx) {
    const { L } = ctx;
    const sc = L.scn && S.scenario(L.scn);
    const img = sc ? sc.img : L.upload ? L.upload.dataUrl : null;
    const scanning = L.scanning;
    const steps = ['Mendeteksi tepi nota', 'Membaca teks (simulasi)', 'Mencocokkan supplier & SKU', 'Memeriksa aritmetika'];
    return `<div class="ss-screen dark" data-m="M2">${head('Scan Nota', 'ss_home')}
      <div class="ss-body">
        <div class="ss-cam ${L.crop ? 'crop' : ''}">
          ${img ? `<img src="${esc(img)}" alt="Pratinjau nota" style="transform:rotate(${L.rot || 0}deg)">` : `<div class="ss-cam-empty">${ui.icon('camera', 40)}<p>Arahkan kamera ke nota / struk.<br>Pastikan tulisan terbaca jelas.</p></div>`}
          <i class="cb tl"></i><i class="cb tr"></i><i class="cb bl"></i><i class="cb br"></i>
          ${L.crop && img ? '<div class="ss-edge">Tepi nota terdeteksi (panduan visual)</div>' : ''}
          ${scanning ? `<div class="ss-scan glass"><div class="ss-scanline"></div><div class="ss-scan-box"><b>${ui.icon('ai', 16)} AI SIMULATION membaca nota…</b>${steps.map((x, i) => `<div class="ss-scan-step ${i < L.scanStep ? 'done' : i === L.scanStep ? 'cur' : ''}">${i < L.scanStep ? '✓' : i === L.scanStep ? '•' : '○'} ${x}</div>`).join('')}<div class="ss-prog"><i style="width:${Math.min(100, ((L.scanStep || 0) / steps.length) * 100)}%"></i></div></div></div>` : ''}
        </div>
        ${img ? `<div class="ss-tools"><button class="ss-pill" data-a="ss_rot">${ui.icon('reset', 15)} Putar</button><button class="ss-pill ${L.crop ? 'on' : ''}" data-a="ss_crop">${ui.icon('scan', 15)} Potong / tepi</button><button class="ss-pill" data-a="ss_page">${ui.icon('plus', 15)} Halaman (${L.pages || 1})</button></div>` : ''}
        ${L.upload && !sc ? `<div class="ss-note warn">${ui.icon('alert', 15)} <span>Foto Anda tersimpan sebagai bukti, tetapi <b>AI SIMULATION tidak membaca foto nyata</b>. Lanjutkan untuk mengisi data secara manual, atau pilih nota contoh di bawah.</span></div>` : ''}
        <div class="ss-shutter">
          <label class="ss-sbtn" for="ss-gal">${ui.icon('doc', 20)}<small>Galeri</small></label>
          <label class="ss-shoot" for="ss-cam" aria-label="Ambil foto"><span></span></label>
          <button class="ss-sbtn" data-a="ss_retake">${ui.icon('reset', 20)}<small>Ulangi</small></button>
          <input type="file" id="ss-cam" accept="image/*" capture="environment" data-ch="ss_file" class="sr">
          <input type="file" id="ss-gal" accept="image/*,application/pdf" data-ch="ss_file" class="sr">
        </div>
        <button class="ss-cta" data-a="ss_read" ${img || L.manual ? '' : 'disabled'}>${ui.icon('ai', 18)} ${sc ? 'Baca dengan AI (simulasi)' : L.upload ? 'Lanjut isi manual' : 'Pilih atau foto nota dulu'}</button>
        <h4 class="ss-h4">Nota contoh (DEMO) — pilih untuk mencoba</h4>
        <div class="ss-samples">${SP.SCENARIOS.map((x) => `<button class="ss-sample ${L.scn === x.key ? 'on' : ''}" data-a="ss_pick" data-k="${x.key}"><span>${x.icon}</span><b>${esc(x.title)}</b><small>${esc(x.tag)}</small></button>`).join('')}</div>
        <p class="ss-fine">Kamera dibuka hanya saat Anda menekan tombol kamera. Gambar nota contoh adalah gambar sintetis DEMO.</p>
      </div></div>`;
  }

  /* ---------- NV-M3 Periksa hasil AI ---------- */
  function review(ctx, sp) {
    const { s, L } = ctx;
    const v = virt(sp, L);
    const ev = S.evidence(s, sp.evidence);
    const m = S.spendMath(v);
    const dup = S.spendDuplicates(s, v);
    const alerts = S.priceAlerts(s, v);
    const sup = S.supplierMatch(s, v.fields.supplier);
    const sc = sp.scenario && S.scenario(sp.scenario);
    const fld = (k, label, type = 'text', opts) => {
      const st = S.spendFieldState(v, k);
      const val = v.fields[k];
      const inp = opts
        ? `<select class="ss-inp" data-in="ss_f" data-k="${k}" data-ch="ss_fch"><option value="">— pilih —</option>${opts.map(([o, l]) => `<option value="${o}" ${val === o ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`
        : `<input class="ss-inp ${['tax', 'disc', 'total'].includes(k) ? 'num' : ''}" type="${type}" ${['tax', 'disc', 'total'].includes(k) ? 'inputmode="numeric"' : ''} value="${esc(['tax', 'disc', 'total'].includes(k) ? fmt(val) : val || '')}" data-in="ss_f" data-ch="ss_fch" data-k="${k}" placeholder="${st === 'BAD' ? 'Tidak terbaca — isi sesuai nota' : ''}" aria-label="${esc(label)}">`;
      return `<div class="ss-field st-${st}"><div class="ss-lbl"><span>${esc(label)}${['supplier', 'date', 'total', 'pay'].includes(k) ? ' *' : ''}</span>${conf(sp.conf[k])}</div>${inp}<div class="ss-fs">${chip(st)}${st === 'CONFIRM' ? `<button class="ss-ok" data-a="ss_conf" data-k="${k}">✓ Sudah sesuai nota</button>` : ''}</div></div>`;
    };
    const linesHtml = v.lines.map((l, i) => {
      const st = S.spendLineState(v, i);
      const it = l.sku && S.item(s, l.sku);
      return `<div class="ss-line st-${st}"><div class="ss-line-top"><input class="ss-inp" value="${esc(l.desc)}" data-in="ss_l" data-ch="ss_fch" data-i="${i}" data-k="desc" aria-label="Deskripsi item ${i + 1}"><button class="ss-ib sm" data-a="ss_ldel" data-i="${i}" aria-label="Hapus baris">${ui.icon('x', 14)}</button></div>
        <div class="ss-line-g"><label>Qty<input class="ss-inp num" inputmode="numeric" value="${esc(l.qty)}" data-in="ss_l" data-ch="ss_fch" data-i="${i}" data-k="qty"></label><label>Satuan<input class="ss-inp" value="${esc(l.uom || '')}" data-in="ss_l" data-ch="ss_fch" data-i="${i}" data-k="uom"></label><label>Harga<input class="ss-inp num" inputmode="numeric" value="${esc(fmt(l.price))}" data-in="ss_l" data-ch="ss_fch" data-i="${i}" data-k="price"></label><label>Diskon<input class="ss-inp num" inputmode="numeric" value="${esc(fmt(l.disc))}" data-in="ss_l" data-ch="ss_fch" data-i="${i}" data-k="disc"></label></div>
        <div class="ss-fs">${chip(st)}${conf(l.conf)} ${it ? `<span class="ss-chip info">SKU ${it.id}</span>` : '<span class="ss-chip">Tanpa SKU</span>'}<span class="ss-lt">= ${U.rp(l.qty * l.price - (l.disc || 0))}</span>${st === 'CONFIRM' ? `<button class="ss-ok" data-a="ss_conf" data-k="line:${i}">✓ Sudah sesuai</button>` : ''}</div>
        ${l.hint && st !== 'OK' ? `<div class="ss-hint">${ui.icon('ai', 13)} ${esc(l.hint)}</div>` : ''}</div>`;
    }).join('');
    const pay = v.fields.pay;
    const flowFields = pay === 'EMPLOYEE'
      ? `<div class="ss-field"><div class="ss-lbl"><span>Karyawan yang membayar *</span></div><select class="ss-inp" data-in="ss_f" data-ch="ss_fch" data-k="payer">${s.users.filter((u) => u.scope.some((x) => x === sp.branch || x === S.buOf(s, sp.branch))).map((u) => `<option value="${u.id}" ${v.fields.payer === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div>`
      : pay === 'UNPAID' ? `<div class="ss-field"><div class="ss-lbl"><span>Jatuh tempo *</span>${conf(sp.conf.due)}</div><input class="ss-inp" type="date" value="${esc(v.fields.due || '')}" data-in="ss_f" data-ch="ss_fch" data-k="due"></div>`
      : pay === 'PO' ? `<div class="ss-field"><div class="ss-lbl"><span>No. PO *</span>${conf(sp.conf.po)}</div><input class="ss-inp" value="${esc(v.fields.po || '')}" data-in="ss_f" data-ch="ss_fch" data-k="po"></div>`
      : pay ? `<div class="ss-field"><div class="ss-lbl"><span>Tanggal bayar *</span></div><input class="ss-inp" type="date" value="${esc(v.fields.payDate || '')}" data-in="ss_f" data-ch="ss_fch" data-k="payDate"></div>` : '';
    const issues = S.spendOpenIssues(v);
    return `<div class="ss-screen" data-m="M3">${head('Periksa Hasil AI', 'ss_back1')}
      <div class="ss-body">
        ${stepper(1)}
        <div class="ss-ai glass"><span class="ss-ai-ic">AI</span><div><b>${sp.source === 'SIMULATED_AI_EXTRACTION' ? 'AI Simulation' : 'Isi manual'}</b><p>${sp.source === 'SIMULATED_AI_EXTRACTION' ? 'Hasil baca nota contoh (deterministik, bukan OCR nyata). Periksa & koreksi data di bawah. Angka yang tidak terbaca dibiarkan kosong.' : 'AI SIMULATION tidak membaca foto pengguna. Isi data sesuai nota.'}</p></div></div>
        ${ev ? `<button class="ss-thumb" data-ev="${ev.id}"><img src="${esc(ev.image)}" alt="Nota asli"><span>${ui.icon('search', 14)} Lihat nota asli · ${ev.id}</span></button>` : ''}
        ${sc ? `<div class="ss-note">${sc.icon} ${esc(sc.note)}</div>` : ''}
        ${dup.length ? `<div class="ss-note bad">${ui.icon('alert', 15)} <span><b>Kemungkinan duplikat</b> dengan ${dup.map((d) => `${ui.id(d.id)} (${esc(d.reasons.join(', '))})`).join('; ')}. Nota duplikat tidak dapat diajukan.</span></div>` : ''}
        ${fld('supplier', 'Supplier / toko')}
        <div class="ss-match">${sup ? `<span class="ss-chip ok">✓ Cocok master: ${esc(sup.name)}</span>` : v.fields.supplier ? '<span class="ss-chip warn">Supplier belum ada di master — Purchasing/Finance akan meninjau</span>' : ''}</div>
        <div class="ss-2">${fld('date', 'Tanggal', 'date')}${fld('receiptNo', 'No. nota')}</div>
        <div class="ss-2">${fld('currency', 'Mata uang', 'text', [['IDR', 'IDR — Rupiah']])}${fld('pay', 'Status / metode bayar', 'text', Object.entries(SP.PAY).map(([k, x]) => [k, x.label]))}</div>
        ${flowFields}
        <div class="ss-sec"><b>Rincian item (${v.lines.length})</b><button class="ss-link" data-a="ss_ladd">${ui.icon('plus', 14)} Tambah baris</button></div>
        ${linesHtml || '<div class="ss-note">Belum ada rincian terbaca. Tambahkan baris sesuai nota.</div>'}
        ${alerts.map((a) => `<div class="ss-note warn">${ui.icon('alert', 15)} <span>Harga ${esc(a.name)} ${U.rp(a.price)} vs harga standar ${U.rp(a.std)} (${a.diff > 0 ? '+' : ''}${U.pct(a.diff)}). Periksa kembali — Finance akan melihat catatan ini.</span></div>`).join('')}
        <div class="ss-2">${fld('disc', 'Diskon nota')}${fld('tax', 'Pajak (PPN)')}</div>
        ${fld('total', 'Total di nota')}
        <div id="ss-arith" class="ss-arith ${m.ok ? 'ok' : m.total === null ? '' : 'bad'}">${arith(m)}</div>
        ${issues.length ? `<p class="ss-fine">Belum lengkap: ${issues.map(issueLabel).join(', ')}.</p>` : ''}
        <div class="ss-actions"><button class="ss-btn2" data-a="ss_cancel">Batal</button><button class="ss-cta" data-a="ss_next1">Periksa &amp; Lanjutkan</button></div>
      </div></div>`;
  }
  const issueLabel = (k) => ({ supplier: 'supplier', date: 'tanggal', total: 'total', receiptNo: 'no. nota', pay: 'metode bayar', math: 'aritmetika', lines: 'rincian item' }[k] || (k.startsWith('line:') ? 'baris ' + (+k.slice(5) + 1) : k));
  function arith(m) {
    if (m.total === null) return `${ui.icon('alert', 15)} <span>Total belum diisi. Rincian dihitung <b>${U.rp(m.expected)}</b> — AI tidak mengisi total yang tidak terbaca; ketik sesuai nota.</span>`;
    if (m.ok) return `${ui.icon('check', 15)} <span>Rincian ${U.rp(m.lineSum)}${m.expected !== m.lineSum ? ' → setelah diskon & pajak ' + U.rp(m.expected) : ''} = total ${U.rp(m.total)}. Aritmetika cocok.</span>`;
    return `${ui.icon('alert', 15)} <span><b>Tidak cocok:</b> rincian ${U.rp(m.expected)} vs total ${U.rp(m.total)} (selisih ${U.rp(m.diff)}). Mohon periksa angka yang ragu — aplikasi tidak memilih angka sendiri.</span>`;
  }
  const stepper = (cur) => `<div class="ss-steps">${['Periksa data', 'Klasifikasi & budget', 'Konfirmasi'].map((x, i) => `<span class="${i + 1 < cur ? 'done' : i + 1 === cur ? 'cur' : ''}"><i>${i + 1 < cur ? '✓' : i + 1}</i>${x}</span>`).join('')}</div>`;

  /* ---------- NV-M4 Klasifikasi & budget ---------- */
  function budgetCard(ctx, sp) {
    const b = S.spendBudget(ctx.s, sp);
    if (!b.applies) return card(`<div class="ss-sec"><b>Dampak ke budget</b></div><p class="ss-p">${esc(b.note)}</p>`);
    const pct = Math.min(1.2, b.ratio);
    const before = Math.min(1.2, b.ratioBefore);
    return card(`<div class="ss-sec"><b>Dampak ke budget (${P_NAME[b.p]} · OPEX)</b><button class="ss-link" data-nav="23">NV-23 →</button></div>
      <div class="ss-bud"><div><small>Budget ${esc(S.orgName(ctx.s, sp.branch))} · Nov 2026</small><b>${U.rp(b.monthly)}</b></div><div><small>Sisa setelah pengeluaran ini</small><b class="${b.remainingAfter < 0 ? 'neg' : ''}">${U.rp(b.remainingAfter)}</b></div></div>
      <div class="ss-bar"><i class="a" style="width:${(Math.min(1, before) * 100).toFixed(1)}%"></i><i class="t ${b.status === 'OVER' ? 'over' : ''}" style="left:${(Math.min(1, before) * 100).toFixed(1)}%;width:${(Math.max(0, Math.min(1, pct) - Math.min(1, before)) * 100).toFixed(1)}%"></i></div>
      <dl class="ss-dl"><dt>Realisasi bulan ini</dt><dd>${U.rp(b.actual)}</dd><dt>Komitmen berjalan</dt><dd>${U.rp(b.commit)}</dd><dt>Pengeluaran ini</dt><dd>${U.rp(b.thisAmt)}</dd><dt>Terpakai setelahnya</dt><dd><b>${U.pct(b.ratio)}</b></dd></dl>
      <div class="ss-note ${b.status === 'OVER' ? 'bad' : b.status === 'WARN' ? 'warn' : 'ok'}">${b.status === 'OVER' ? 'Pengeluaran ini melewati budget dan membutuhkan persetujuan tambahan BU Manager.' : b.status === 'WARN' ? 'Pengeluaran ini masih dalam budget, tetapi budget hampir habis (≥ 90%).' : 'Pengeluaran ini masih dalam budget.'}</div>
      <p class="ss-fine">Budget bulanan cabang = budget tahunan BU × porsi cabang ÷ 12 (alokasi DEMO). Realisasi awal bulan = data DEMO.</p>`, b.status === 'OVER' ? 'over' : '');
  }
  function classify(ctx, sp) {
    const { s, user } = ctx;
    const c = sp.cls;
    const sug = c.suggested;
    const branches = s.org.filter((o) => o.status === 'ACTIVE' && ['BRANCH', 'DIVISION'].includes(o.type) && (user.role === 'OWNER' || user.scope.some((x) => x === o.id || x === S.buOf(s, o.id))));
    const assets = s.assets.filter((a) => a.org === sp.branch && a.status === 'ACTIVE');
    const typeBtn = (k, l) => `<button class="ss-seg ${c.type === k ? 'on' : ''}" data-a="ss_cls" data-k="type" data-v="${k}">${l}</button>`;
    return `<div class="ss-screen" data-m="M4">${head('Klasifikasi & Budget', 'ss_back2')}
      <div class="ss-body">${stepper(2)}
        <div class="ss-ai glass"><span class="ss-ai-ic">AI</span><div><b>Rekomendasi AI (7P)</b><p>${sug ? esc(sug.why) : 'Pilih kategori sesuai isi nota.'} <i>Rekomendasi — divalidasi Finance.</i></p></div></div>
        <div class="ss-field"><div class="ss-lbl"><span>Kategori 7P *</span>${sug && sug.p ? `<span class="ss-conf">AI: ${P_NAME[sug.p]}</span>` : ''}</div>
          <div class="ss-p7">${SP.SPEND_P.map((p) => `<button class="ss-p7b ${c.p === p ? 'on' : ''}" style="--pc:var(--p-${p.toLowerCase()})" data-a="ss_cls" data-k="p" data-v="${p}"><b>${P_NAME[p]}</b><small>${P_HINT[p]}</small></button>`).join('')}</div>
          <p class="ss-fine">Profit (P7) adalah hasil kinerja, bukan kategori belanja. Tidak ada kategori "Procurement" dalam 7P JAENS.</p></div>
        <div class="ss-field"><div class="ss-lbl"><span>Outlet / Divisi *</span></div><select class="ss-inp" data-ch="ss_branch">${branches.map((o) => `<option value="${o.id}" ${sp.branch === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></div>
        <div class="ss-field"><div class="ss-lbl"><span>Cost center</span><span class="ss-conf">otomatis</span></div><div class="ss-ro">${esc(sp.cc || '—')} — ${esc((s.costCenters.find((x) => x.id === sp.cc) || {}).name || 'tidak ada')}</div></div>
        <div class="ss-field"><div class="ss-lbl"><span>Jenis pengeluaran *</span></div><div class="ss-segs">${typeBtn('OPEX', 'OPEX')}${typeBtn('CAPEX', 'CAPEX')}${typeBtn('INVENTORY', 'Persediaan')}${typeBtn('OTHER', 'Lainnya')}</div>
          <p class="ss-fine">${c.type === 'INVENTORY' ? 'Barang stok: gudang wajib mengonfirmasi barang fisik; beban diakui saat barang dipakai.' : c.type === 'CAPEX' ? 'Belanja modal: Finance akan mengarahkan ke kapitalisasi aset (NV-56).' : c.type === 'OTHER' ? 'Finance akan menentukan perlakuan akuntansi.' : 'Dipakai/habis langsung → beban operasional.'}</p></div>
        <div class="ss-2"><div class="ss-field"><div class="ss-lbl"><span>Rutin?</span></div><div class="ss-segs"><button class="ss-seg ${c.routine ? 'on' : ''}" data-a="ss_cls" data-k="routine" data-v="1">Rutin</button><button class="ss-seg ${!c.routine ? 'on' : ''}" data-a="ss_cls" data-k="routine" data-v="0">Non-rutin</button></div></div>
          <div class="ss-field"><div class="ss-lbl"><span>Aset terkait</span></div><select class="ss-inp" data-ch="ss_asset"><option value="">— tidak ada —</option>${assets.map((a) => `<option value="${a.id}" ${c.asset === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div></div>
        ${budgetCard(ctx, sp)}
        <div class="ss-actions"><button class="ss-btn2" data-a="ss_back2">Kembali</button><button class="ss-cta" data-a="ss_next2" ${c.p || sp.flow === 'PO' ? '' : 'disabled'}>Konfirmasi &amp; Lanjutkan</button></div>
      </div></div>`;
  }

  /* ---------- NV-M5 Konfirmasi & approval ---------- */
  function routeHtml(s, steps, cur) {
    return `<div class="ss-route">${steps.map((x, i) => `${i ? '<span class="ss-arr">→</span>' : ''}<span class="ss-rs ${x.status === 'DONE' ? 'done' : x.status === 'REJECTED' ? 'rej' : x === cur ? 'cur' : ''}"><small>${esc(HAWK.ROLE_LABEL[x.role] || x.role)}</small><b>${esc(x.label)}</b>${x.status === 'DONE' ? `<i>✓ ${esc(S.userName(s, x.by))}</i>` : x.status === 'REJECTED' ? '<i>✕ ditolak</i>' : x.post ? '<i>approval susulan</i>' : ''}</span>`).join('')}</div>`;
  }
  function confirmView(ctx, sp) {
    const { s } = ctx;
    const ev = S.evidence(s, sp.evidence);
    const route = S.spendRoute(s, sp).map((x, i) => ({ ...x, status: i === 0 ? 'NEXT' : 'PENDING' }));
    const m = S.spendMath(sp);
    const rule = s.approvalRules.find((r) => r.doc === 'EMERGENCY_PO');
    return `<div class="ss-screen" data-m="M5">${head('Konfirmasi Pengajuan', 'ss_back3')}
      <div class="ss-body">${stepper(3)}
        <div class="ss-sum glass"><span class="ss-sum-ic">🧾</span><div><b>${esc(SP.FLOW[sp.flow] || 'Pilih status pembayaran')}</b><span class="ss-tag">Siap diajukan</span></div></div>
        ${card(`<dl class="ss-dl big"><dt>Supplier</dt><dd>${esc(sp.fields.supplier)}</dd><dt>Tanggal</dt><dd>${U.date(sp.fields.date)}</dd><dt>Total</dt><dd><b>${money(m.total)}</b></dd><dt>Item</dt><dd>${sp.lines.map((l) => `${esc(l.desc)} × ${l.qty}`).join(', ')}</dd><dt>Kategori 7P</dt><dd>${sp.cls.p ? ui.p7(sp.cls.p) : '—'}</dd><dt>Jenis</dt><dd>${esc(SP.CLS[sp.cls.type])}</dd><dt>Cost center</dt><dd>${esc(sp.cc)}</dd><dt>Outlet / divisi</dt><dd>${esc(S.orgName(s, sp.branch))}</dd><dt>Pembayaran</dt><dd>${esc((SP.PAY[sp.fields.pay] || {}).label || '—')}</dd></dl>`)}
        ${ev ? `<div class="ss-sec"><b>Bukti nota</b></div><button class="ss-file" data-ev="${ev.id}"><img src="${esc(ev.image)}" alt=""><span><b>${esc(ev.file)}</b><small>${ev.id} · asli, tidak diubah</small></span>${ui.icon('search', 18)}</button>` : '<div class="ss-note warn">Tanpa foto nota — approver & Finance akan melihat ini sebagai pengecualian.</div>'}
        ${sp.flow !== 'PO' ? `<div class="ss-field ss-emg"><label class="ss-check"><input type="checkbox" data-ch="ss_emg" ${sp.emergency ? 'checked' : ''}> <b>Pembelian darurat tanpa PO</b> (aturan ${rule.id}: maks ${U.rp(rule.max)}, approval susulan BU Manager)</label>
          ${sp.emergency ? `<textarea class="ss-inp" rows="2" data-ch="ss_emgr" placeholder="Alasan darurat (min. 10 karakter)">${esc(sp.emergency.reason || '')}</textarea><a class="ss-link" data-nav="37">Kebijakan pembelian darurat (NV-37) →</a>` : ''}</div>` : `<div class="ss-note">Faktur ber-PO diteruskan ke <b>three-way match</b> PO–penerimaan–faktur (NV-49). Tidak ada approval pengeluaran baru karena PO sudah disetujui.</div>`}
        <div class="ss-sec"><b>Alur approval</b></div>${routeHtml(s, route, route[1])}
        <div class="ss-note">${ui.icon('shield', 15)} <span>Dengan mengajukan, Anda hanya <b>mengonfirmasi data nota sudah diperiksa</b>. Ini <b>bukan</b> persetujuan pengeluaran, pembayaran, verifikasi faktur, posting persediaan, atau jurnal.</span></div>
        <div class="ss-actions col"><button class="ss-cta" data-a="ss_submit">${ui.icon('arrow', 18)} Ajukan untuk Persetujuan</button><button class="ss-btn2" data-a="ss_draft">Simpan sebagai Draft</button></div>
      </div></div>`;
  }

  /* ---------- NV-M6 Riwayat & detail ---------- */
  function history(ctx) {
    const { s, L, user } = ctx;
    const list = S.spendsFor(s, user).filter((x) => x.status !== 'CANCELLED' || x.createdBy === user.id);
    const f = L.hf || (myQueue(ctx).length ? 'todo' : 'all');
    const shown = list.filter((x) => (f === 'todo' ? S.canActSpend(s, x, user) : f === 'mine' ? x.createdBy === user.id : f === 'open' ? !['SETTLED', 'REJECTED', 'CANCELLED'].includes(statusOf(s, x)) : true));
    const pill = (k, l, c) => `<button class="ss-pill ${f === k ? 'on' : ''}" data-a="ss_hf" data-v="${k}">${l}${c !== undefined ? ` (${c})` : ''}</button>`;
    return `<div class="ss-screen" data-m="M6">${head('Riwayat & Bukti', null)}
      <div class="ss-body"><div class="ss-tools">${pill('todo', 'Perlu tindakan saya', myQueue(ctx).length)}${pill('mine', 'Milik saya')}${pill('open', 'Berjalan')}${pill('all', 'Semua', list.length)}</div>
        ${shown.length ? shown.map((x) => rowItem(ctx, x)).join('') : '<div class="ss-note">Tidak ada transaksi di filter ini.</div>'}
        <p class="ss-fine">Daftar mengikuti hak akses: pengaju melihat miliknya, Supervisor/BU Manager melihat unitnya, Finance & Owner melihat semua.</p>
      </div>${bottomNav(ctx, L.hf === 'todo' ? 'approvals' : 'history')}</div>`;
  }
  function detail(ctx, sp) {
    const { s, L, user } = ctx;
    const st = statusOf(s, sp);
    const ev = S.evidence(s, sp.evidence);
    const acc = S.spendAccounting(s, sp);
    const canEv = S.canSeeEvidence(s, user, sp);
    const tab = L.dtab || 'detail';
    const act = S.canActSpend(s, sp, user);
    const m = S.spendMath(sp);
    const refs = [];
    if (sp.doc) refs.push(['Dokumen matching', sp.doc]);
    if (acc.bill) refs.push(['Tagihan AP', acc.bill.id]);
    if (sp.flow === 'PO' && sp.fields.po) refs.push(['Purchase Order', sp.fields.po]);
    const grn = sp.flow === 'PO' && s.grns.find((g) => g.po === sp.fields.po);
    if (grn) refs.push(['Penerimaan barang', grn.id]);
    if (acc.journal) refs.push(['Jurnal', acc.journal.id]);
    if (acc.settle) refs.push(['Jurnal pembayaran', acc.settle.id]);
    if (sp.payment) refs.push(['Pembayaran', sp.payment]);
    if (sp.cls.asset) refs.push(['Aset', sp.cls.asset]);
    const steps = sp.steps.length ? sp.steps : S.spendRoute(s, sp).map((x) => ({ ...x, status: 'PENDING' }));
    const det = `${card(`<dl class="ss-dl"><dt>Kategori 7P</dt><dd>${sp.cls.p ? ui.p7(sp.cls.p) : '—'}</dd><dt>Cost center</dt><dd>${esc(sp.cc || '—')}</dd><dt>Jenis</dt><dd>${esc(SP.CLS[sp.cls.type])}</dd><dt>Outlet / divisi</dt><dd>${esc(S.orgName(s, sp.branch))}</dd><dt>Alur</dt><dd>${esc(SP.FLOW[sp.flow] || '—')}</dd><dt>Pembayaran</dt><dd>${esc((SP.PAY[sp.fields.pay] || {}).label || '—')}${sp.flow === 'REIMBURSE' ? ' · ' + esc(S.userName(s, sp.fields.payer)) : ''}${sp.flow === 'UNPAID' && sp.fields.due ? ' · jatuh tempo ' + U.date(sp.fields.due) : ''}</dd><dt>Status bayar</dt><dd>${sp.payment ? ui.status('PAID') + ' ' + sp.payment : sp.flow === 'PAID' ? 'Dibayar di lapangan — menunggu rekonsiliasi Finance' : 'Belum dibayar'}</dd>${sp.emergency ? `<dt>Darurat</dt><dd>${esc(sp.emergency.reason)} (${esc(sp.emergency.rule || 'AR-08')})</dd>` : ''}</dl>`)}
      <div class="ss-sec"><b>Timeline approval</b></div><div class="ss-tl">${steps.map((x) => `<div class="ss-tl-i ${x.status === 'DONE' ? 'done' : x.status === 'REJECTED' ? 'rej' : x === S.spendNextStep(sp) ? 'cur' : ''}"><i></i><div><b>${esc(x.label)}</b><small>${esc(HAWK.ROLE_LABEL[x.role] || x.role)}${x.by ? ' · ' + esc(S.userName(s, x.by)) + ' · ' + U.datetime(x.ts) : x.status === 'REJECTED' ? ' · ditolak' : ' · menunggu'}${x.note ? ' — ' + esc(x.note) : ''}</small></div></div>`).join('')}</div>
      ${card(`<div class="ss-sec"><b>Status akuntansi</b></div><p class="ss-p">${acc.journal ? `${ui.status(acc.journal.status)} ${esc(acc.stage)} — ${ui.id(acc.journal.id)}` : esc(acc.stage)}</p>${sp.flow !== 'PO' && !acc.journal ? '<p class="ss-fine">Nomor jurnal hanya tampil setelah jurnal benar-benar dibuat (verifikasi Finance).</p>' : ''}`)}
      ${refs.length ? `<div class="ss-sec"><b>Referensi terkait</b></div>${refs.map(([l, id]) => `<div class="ss-ref"><span>${esc(l)}</span>${ui.id(id)}</div>`).join('')}` : ''}
      ${sp.budgetAtSubmit && sp.budgetAtSubmit.applies ? card(`<div class="ss-sec"><b>Budget saat diajukan</b><button class="ss-link" data-nav="23">NV-23 →</button></div><p class="ss-p">${U.pct(sp.budgetAtSubmit.ratio)} dari budget ${P_NAME[sp.budgetAtSubmit.p]} bulan ini ${ui.status(sp.budgetAtSubmit.status)}</p>`) : ''}`;
    const evTab = !ev ? '<div class="ss-note warn">Transaksi ini tidak memiliki foto nota.</div>' : !canEv ? '<div class="ss-note bad">Anda tidak memiliki akses ke bukti nota transaksi ini.</div>'
      : `<button class="ss-evimg" data-ev="${ev.id}"><img src="${esc(ev.image)}" alt="Nota asli ${ev.id}"><span>${ui.icon('search', 14)} Buka bukti asli</span></button>${card(evMeta(s, ev, sp))}`;
    const audit = `${card(`<div class="ss-sec"><b>Hasil AI vs koreksi manusia</b></div>${sp.corrections.length ? `<table class="ss-tbl"><tr><th>Field</th><th>AI</th><th>Nilai akhir</th><th>Oleh</th></tr>${sp.corrections.map((c) => `<tr><td>${esc(c.field + (c.attr ? '.' + c.attr : ''))}</td><td>${esc(c.ai === null || c.ai === undefined ? '(tidak terbaca)' : typeof c.ai === 'number' ? U.num(c.ai) : c.ai)}</td><td><b>${esc(c.value === null ? '—' : typeof c.value === 'number' ? U.num(c.value) : c.value)}</b></td><td>${esc(S.userName(s, c.by))}${c.finance ? ' (Finance)' : ''}</td></tr>`).join('')}</table>` : '<p class="ss-p">Tidak ada koreksi.</p>'}<p class="ss-fine">Hasil AI asli disimpan terpisah dari data yang dikoreksi.</p>`)}
      <div class="ss-tl">${sp.history.map((h) => `<div class="ss-tl-i done"><i></i><div><b>${esc(h.action)}</b><small>${esc(S.userName(s, h.by))} · ${U.datetime(h.ts)}${h.note ? ' — ' + esc(h.note) : ''}</small></div></div>`).join('')}${s.audit.filter((a) => a.ref === sp.id).length ? `<p class="ss-fine">${s.audit.filter((a) => a.ref === sp.id).length} entri log audit sistem untuk ${sp.id}.</p>` : ''}</div>`;
    return `<div class="ss-screen" data-m="M6">${head('Detail Transaksi', 'ss_hist')}
      <div class="ss-body">
        <div class="ss-dh glass"><div class="ss-dh-t">${ui.status(st)}<span class="ss-id">${sp.id}</span></div><b>${esc(SP.FLOW[sp.flow] || 'Draft pengeluaran')}</b><h2>${money(m.total)}</h2><small>${sp.fields.date ? U.date(sp.fields.date) : '—'} · ${esc(sp.fields.supplier || '—')}</small></div>
        ${actionPanel(ctx, sp, act)}
        <div class="ss-tabs">${[['detail', 'Detail'], ['ev', 'Bukti Nota'], ['audit', 'Audit Trail']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-a="ss_dtab" data-v="${k}">${l}</button>`).join('')}</div>
        ${tab === 'detail' ? det : tab === 'ev' ? evTab : audit}
      </div>${bottomNav(ctx, ctx.L.hf === 'todo' ? 'approvals' : 'history')}</div>`;
  }
  function evMeta(s, ev, sp) {
    return `<dl class="ss-dl"><dt>Document ID</dt><dd class="mono">${ev.id}</dd><dt>Transaction ID</dt><dd class="mono">${sp.id}</dd><dt>File asli</dt><dd>${esc(ev.file)} · ${ev.pages} hlm</dd><dt>Diunggah oleh</dt><dd>${esc(S.userName(s, ev.uploadedBy))}</dd><dt>Waktu unggah</dt><dd>${U.datetime(ev.ts)}</dd><dt>Sidik jari</dt><dd class="mono">${esc(ev.fingerprint || '—')}</dd><dt>Versi turunan</dt><dd>${ev.derived.length ? ev.derived.map((d) => esc(d.kind + ' ' + (d.deg || '') + '° — ' + d.note)).join('<br>') : 'Tidak ada'}</dd><dt>Penyimpanan</dt><dd><span class="ss-chip warn">LOKAL DEMO</span> browser ini saja — bukan penyimpanan dokumen permanen/aman</dd></dl>`;
  }
  function actionPanel(ctx, sp, st) {
    const { s, user } = ctx;
    const next = S.spendNextStep(sp);
    if (['DRAFT', 'RETURNED'].includes(sp.status) && sp.createdBy === user.id)
      return `<div class="ss-actbox glass"><b>${sp.status === 'RETURNED' ? 'Dikembalikan — perbaiki data' : 'Draft belum diajukan'}</b><div class="ss-actions"><button class="ss-btn2" data-a="ss_void" data-p="${sp.id}">Batalkan</button><button class="ss-cta" data-a="ss_resume" data-p="${sp.id}">Lanjutkan</button></div></div>`;
    if (!st) return next && !['REJECTED', 'CANCELLED'].includes(sp.status) ? `<div class="ss-actbox"><small>Menunggu: <b>${esc(next.label)}</b> (${esc(HAWK.ROLE_LABEL[next.role] || next.role)})${sp.createdBy === user.id && next.role === user.role ? ' — Anda pengaju, tidak boleh memproses sendiri' : ''}</small></div>` : sp.flow === 'PO' && sp.doc && ['FINANCE'].includes(user.role) ? `<div class="ss-actbox"><button class="ss-cta" data-nav="49" data-q='${esc(JSON.stringify({ id: sp.doc }))}'>Buka three-way match (NV-49)</button></div>` : '';
    if (st.key === 'APPROVE' || st.key === 'APPROVE2')
      return `<div class="ss-actbox glass"><b>${esc(st.label)}</b><small>Periksa nota, budget & alasan sebelum memutuskan.</small><div class="ss-actions"><button class="ss-btn2" data-a="ss_dec" data-v="RETURN" data-p="${sp.id}">Kembalikan</button><button class="ss-btn2 bad" data-a="ss_dec" data-v="REJECT" data-p="${sp.id}">Tolak</button><button class="ss-cta" data-a="ss_dec" data-v="APPROVE" data-p="${sp.id}">Setujui</button></div></div>`;
    if (st.key === 'GOODS')
      return `<div class="ss-actbox glass"><b>Konfirmasi barang fisik</b><small>${sp.lines.map((l) => `${esc(l.desc)} × ${l.qty} (${l.sku})`).join(', ')} → ${esc(S.whName(s, (S.whOfOrg(s, sp.branch) || {}).id))}</small><div class="ss-actions"><button class="ss-cta" data-a="ss_goods" data-p="${sp.id}">Barang diterima sesuai nota</button></div></div>`;
    if (st.key === 'VERIFY')
      return `<div class="ss-actbox glass"><b>Verifikasi Finance</b><small>Tetapkan klasifikasi & perlakuan akuntansi. Jurnal dibuat PENDING_REVIEW dan diposting lewat GL (NV-51).</small>
        <div class="ss-2"><select class="ss-inp" id="ss-vp">${SP.SPEND_P.map((p) => `<option value="${p}" ${sp.cls.p === p ? 'selected' : ''}>${P_NAME[p]}</option>`).join('')}</select><select class="ss-inp" id="ss-vt">${['OPEX', 'CAPEX', 'INVENTORY'].map((t) => `<option value="${t}" ${sp.cls.type === t ? 'selected' : ''}>${SP.CLS[t]}</option>`).join('')}</select></div>
        <div class="ss-actions"><button class="ss-btn2" data-a="ss_fin" data-v="RETURN" data-p="${sp.id}">Kembalikan</button><button class="ss-btn2 bad" data-a="ss_fin" data-v="REJECT" data-p="${sp.id}">Tolak</button><button class="ss-cta" data-a="ss_fin" data-v="VERIFY" data-p="${sp.id}">Verifikasi</button></div></div>`;
    if (st.key === 'SETTLE')
      return `<div class="ss-actbox glass"><b>${esc(st.label)}</b><small>${U.rp(S.spendMath(sp).total)} · ${sp.flow === 'REIMBURSE' ? 'ke ' + esc(S.userName(s, sp.fields.payer)) : esc(sp.fields.supplier)}. Simulasi — tidak ada dana keluar.</small><div class="ss-actions"><button class="ss-cta" data-a="ss_settle" data-p="${sp.id}">Catat pembayaran</button></div></div>`;
    return '';
  }

  /* ---------- evidence modal (used from every module) ---------- */
  HAWK.openEvidence = function (evId) {
    const s = HAWK.store.state;
    const u = HAWK.currentUser();
    const ev = S.evidence(s, evId);
    if (!ev) return ui.toast('Bukti tidak ditemukan', 'bad');
    const sp = S.spend(s, ev.spend);
    if (!S.canSeeEvidence(s, u, sp)) return ui.openModal('Bukti nota ' + ev.id, '<div class="alert bad">Anda tidak memiliki akses ke bukti nota ini. (Simulasi UI — backend HAWK wajib menegakkan aturan yang sama.)</div>');
    ui.openModal(`Bukti nota asli · ${ev.id}`, `<div class="ss-modal"><div class="ss-modal-img"><img src="${esc(ev.image)}" alt="Nota asli ${ev.id}"></div><div>${evMeta(s, ev, sp)}<p class="tiny muted">Gambar asli tidak diubah. Koreksi data disimpan terpisah di ${sp.id}.</p></div></div>`, `<button class="btn ghost" data-close-modal>Tutup</button><button class="btn" data-nav="48" data-q='${esc(JSON.stringify({ tab: 'history', sel: sp.id }))}'>Buka transaksi ${sp.id}</button>`);
  };

  /* ---------- side panel (desktop/tablet) ---------- */
  const MVIEWS = { M1: 'NV-M1 Beranda & aksi cepat', M2: 'NV-M2 Ambil foto nota', M3: 'NV-M3 Periksa hasil AI', M4: 'NV-M4 Klasifikasi & budget', M5: 'NV-M5 Konfirmasi & approval', M6: 'NV-M6 Detail & bukti' };
  function side(ctx, mv) {
    const { s } = ctx;
    const pending = (s.spends || []).filter((x) => ['SUBMITTED', 'APPROVED', 'GOODS_CONFIRMED', 'VERIFIED', 'IN_MATCHING'].includes(statusOf(s, x)));
    return `<div class="stack ss-side">
      <div class="card"><div class="card-head"><h3>${ui.icon('ai', 16)} Smart Spend Money</h3><span class="r">${ui.intBadge('TO VERIFY')}</span></div>
        <p class="small" style="margin:0 0 8px"><b>Photo first · AI assisted · Human confirmed · Budget controlled · Finance verified · Fully traceable.</b></p>
        <div class="small muted">Tampilan aktif: <b>${MVIEWS[mv]}</b> (subview mobile di NV-48, bukan nomor NV baru).</div>
        ${ui.stepper(['Foto', 'Baca AI', 'Periksa', 'Klasifikasi', 'Budget', 'Konfirmasi', 'Approval', 'Finance', 'Bukti'], { M1: 0, M2: 0, M3: 2, M4: 3, M5: 5, M6: 7 }[mv])}</div>
      <div class="card"><h3>Kontrol terpisah</h3><ol class="small" style="margin:6px 0 0;padding-left:18px;line-height:1.7"><li>Pengaju mengonfirmasi data nota</li><li>Supervisor / Head of Division menyetujui pengeluaran (+ BU Manager bila over budget / darurat)</li><li>PIC gudang mengonfirmasi barang fisik (khusus persediaan)</li><li>Finance memverifikasi klasifikasi & perlakuan akuntansi</li><li>Finance mencatat pembayaran / rekonsiliasi</li></ol><p class="tiny muted">Pengaju tidak dapat memproses pengeluarannya sendiri. Permission di sini simulasi — wajib ditegakkan backend HAWK.</p></div>
      <div class="card"><h3>Empat alur dokumen</h3><dl class="kv"><dt>Spend Money</dt><dd>Sudah dibayar; pembayaran dicatat Finance terpisah</dd><dt>Tagihan</dt><dd>Belum dibayar → utang setelah verifikasi</dd><dt>Reimburse</dt><dd>Dibayar karyawan → sekali reimburse per nota</dd><dt>Faktur PO</dt><dd>Three-way match NV-49 → AP NV-50</dd></dl></div>
      <div class="card"><h3>Sedang berjalan (${pending.length})</h3>${pending.length ? ui.table([{ h: 'ID', f: (x) => `<button class="link" data-a="ss_open" data-p="${x.id}">${x.id}</button>` }, { h: 'Supplier', f: (x) => esc(x.fields.supplier) }, { h: 'Total', num: true, f: (x) => U.rp(x.fields.total) }, { h: 'Status', f: (x) => ui.status(statusOf(s, x)) }], pending.slice(0, 8)) : '<p class="small muted">Belum ada.</p>'}</div>
      ${ctx.can('doc.capture') && PO48 ? `<details class="card" ${ctx.role === 'FINANCE' ? 'open' : ''}><summary><b>Faktur supplier ber-PO — antrean Finance (alur lama NV-48)</b></summary><div style="margin-top:10px">${PO48.render(ctx)}</div></details>` : ''}
    </div>`;
  }

  /* ---------- main view ---------- */
  V[48] = {
    render(ctx) {
      const { s, L, q, user } = ctx;
      if (q.id && /^SM/.test(q.id) && L._qid !== q.id) Object.assign(L, { tab: 'history', sel: q.id, _qid: q.id, dtab: 'detail' });
      if (q.sel && L._qsel !== q.sel) Object.assign(L, { tab: 'history', sel: q.sel, _qsel: q.sel, dtab: 'detail' });
      if (q.cur && L._qcur !== q.cur) Object.assign(L, { tab: 'review', cur: q.cur, step: 1, _qcur: q.cur });
      L.tab = L.tab || 'scan';
      const cur = L.cur && S.spend(s, L.cur);
      const drafts = (s.spends || []).filter((x) => x.createdBy === user.id && ['DRAFT', 'RETURNED'].includes(x.status));
      let body;
      let mv;
      if (L.tab === 'scan') {
        mv = L.m === 'cap' ? 'M2' : 'M1';
        body = L.m === 'cap' ? capture(ctx) : home(ctx);
      } else if (L.tab === 'review') {
        const sp = cur && ['DRAFT', 'RETURNED'].includes(cur.status) && cur.createdBy === user.id ? cur : drafts[0];
        if (!sp) {
          mv = 'M3';
          body = `<div class="ss-screen" data-m="M3">${head('Review Hasil AI', null)}<div class="ss-body"><div class="ss-empty">${ui.icon('doc', 40)}<p>Belum ada nota untuk diperiksa.</p><button class="ss-cta" data-a="ss_scan">${ui.icon('camera', 18)} Scan Nota</button></div></div></div>`;
        } else {
          L.cur = sp.id;
          const step = L.step || 1;
          mv = ['M3', 'M4', 'M5'][step - 1];
          body = step === 1 ? review(ctx, sp) : step === 2 ? classify(ctx, sp) : confirmView(ctx, sp);
        }
      } else {
        const sel = L.sel && S.spend(s, L.sel);
        mv = 'M6';
        body = sel && S.spendsFor(s, user).some((x) => x.id === sel.id) ? detail(ctx, sel) : history(ctx);
      }
      return `<div class="stack">
        <div class="alert violet">${ui.icon('ai', 16)}<div><b>AI SIMULATION.</b> Ekstraksi nota di pratinjau ini deterministik dari nota contoh DEMO — tidak ada OCR/AI nyata, tidak ada API key di browser, dan foto Anda tidak dikirim ke mana pun. OCR sungguhan butuh integrasi backend yang terverifikasi.</div></div>
        ${ui.tabs('tab', [['scan', `${ui.icon('camera', 15)} Scan Nota`], ['review', `${ui.icon('ai', 15)} Review Hasil AI`, drafts.length || undefined], ['history', `${ui.icon('doc', 15)} Riwayat &amp; Bukti`, myQueue(ctx).length || undefined]], L.tab)}
        <div class="ss-wrap"><div class="ss-phone" data-mview="${mv}">${body}</div>${side(ctx, mv)}</div></div>`;
    },
    actions: {
      ...(PO48 ? PO48.actions : {}),
      ss_nav(el, ctx) {
        const v = el.dataset.v;
        const L = ctx.L;
        if (v === 'home') Object.assign(L, { tab: 'scan', m: 'home' });
        if (v === 'scan') Object.assign(L, { tab: 'scan', m: 'cap' });
        if (v === 'history') Object.assign(L, { tab: 'history', sel: null, hf: 'all' });
        if (v === 'approvals') Object.assign(L, { tab: 'history', sel: null, hf: 'todo' });
        if (v === 'budget') return HAWK.go(23);
        ctx.rerender();
      },
      ss_home: (el, ctx) => (Object.assign(ctx.L, { tab: 'scan', m: 'home', scanning: false }), ctx.rerender()),
      ss_scan: (el, ctx) => (Object.assign(ctx.L, { tab: 'scan', m: 'cap', manual: false }), ctx.rerender()),
      ss_hist: (el, ctx) => (Object.assign(ctx.L, { tab: 'history', sel: null, hf: ctx.L.hf === 'todo' ? 'all' : ctx.L.hf }), ctx.rerender()),
      ss_appr: (el, ctx) => (Object.assign(ctx.L, { tab: 'history', sel: null, hf: 'todo' }), ctx.rerender()),
      ss_budget: () => HAWK.go(23),
      ss_manual(el, ctx) {
        const r = ctx.act('spend.capture', { manual: true }, (d) => `${d.id} dibuat — isi data sesuai nota`);
        if (r.ok) Object.assign(ctx.L, { tab: 'review', cur: r.data.id, step: 1 }) && ctx.rerender();
      },
      ss_pick: (el, ctx) => (Object.assign(ctx.L, { scn: el.dataset.k, upload: null, rot: 0, crop: true, pages: 1 }), ctx.rerender()),
      ss_retake: (el, ctx) => (Object.assign(ctx.L, { scn: null, upload: null, rot: 0, crop: false, pages: 1 }), ctx.rerender()),
      ss_rot: (el, ctx) => ((ctx.L.rot = ((ctx.L.rot || 0) + 90) % 360), ctx.rerender()),
      ss_crop: (el, ctx) => ((ctx.L.crop = !ctx.L.crop), ctx.rerender()),
      ss_page: (el, ctx) => ((ctx.L.pages = Math.min(3, (ctx.L.pages || 1) + 1)), ui.toast(`Halaman ${ctx.L.pages} ditambahkan (simulasi: gambar yang sama)`, 'ok'), ctx.rerender()),
      ss_file(el, ctx) {
        const f = el.files && el.files[0];
        if (!f) return;
        const L = ctx.L;
        const done = (dataUrl) => (Object.assign(L, { upload: { name: f.name, dataUrl }, scn: null, rot: 0, crop: true, pages: 1 }), ctx.rerender());
        if (!/^image\//.test(f.type)) return ui.toast('PDF diterima sebagai lampiran di versi produksi; pratinjau ini hanya menampilkan gambar.', 'warn');
        const rd = new FileReader();
        rd.onload = () => {
          const img = new Image();
          img.onload = () => {
            try {
              const k = Math.min(1, 900 / Math.max(img.width, img.height));
              const c = document.createElement('canvas');
              c.width = Math.round(img.width * k);
              c.height = Math.round(img.height * k);
              c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
              done(c.toDataURL('image/jpeg', 0.8));
            } catch (e) {
              done(rd.result);
            }
          };
          img.onerror = () => ui.toast('Gambar tidak dapat dibaca', 'bad');
          img.src = rd.result;
        };
        rd.readAsDataURL(f);
      },
      ss_read(el, ctx) {
        const L = ctx.L;
        const sc = L.scn;
        const payload = sc ? { scenario: sc, pages: L.pages, rotation: L.rot } : L.upload ? { upload: L.upload, pages: L.pages, rotation: L.rot } : { manual: true };
        const finish = () => {
          L.scanning = false;
          const r = ctx.act('spend.capture', payload, (d) => (sc ? `${d.id}: hasil AI SIMULATION siap diperiksa` : `${d.id}: foto tersimpan — isi data manual`));
          if (r.ok) Object.assign(L, { tab: 'review', cur: r.data.id, step: 1, scn: null, upload: null, m: 'home' });
          ctx.rerender();
        };
        if (!sc) return finish();
        L.scanning = true;
        L.scanStep = 0;
        ctx.rerender();
        const dt = reduced() ? 60 : 420;
        const tick = () => {
          if (!L.scanning) return;
          L.scanStep++;
          if (L.scanStep >= 4) return finish();
          ctx.rerender();
          setTimeout(tick, dt);
        };
        setTimeout(tick, dt);
      },
      /* M3 inputs — kept locally until the user continues */
      ss_f(el, ctx) {
        const e = edit(ctx.L, ctx.L.cur);
        e.fields = e.fields || {};
        e.fields[el.dataset.k] = el.value;
        const sp = S.spend(ctx.s, ctx.L.cur);
        const box = document.getElementById('ss-arith');
        if (sp && box) {
          const m = S.spendMath(virt(sp, ctx.L));
          box.className = 'ss-arith ' + (m.ok ? 'ok' : m.total === null ? '' : 'bad');
          box.innerHTML = arith(m);
        }
      },
      ss_l(el, ctx) {
        const sp = S.spend(ctx.s, ctx.L.cur);
        const e = edit(ctx.L, ctx.L.cur);
        e.lines = e.lines || sp.lines.map((l) => ({ desc: l.desc, qty: l.qty, uom: l.uom, price: l.price, disc: l.disc }));
        e.lines[+el.dataset.i][el.dataset.k] = el.value;
        const box = document.getElementById('ss-arith');
        if (box) {
          const m = S.spendMath(virt(sp, ctx.L));
          box.className = 'ss-arith ' + (m.ok ? 'ok' : m.total === null ? '' : 'bad');
          box.innerHTML = arith(m);
        }
      },
      ss_fch: (el, ctx) => ctx.rerender(),
      ss_ladd(el, ctx) {
        const sp = S.spend(ctx.s, ctx.L.cur);
        const e = edit(ctx.L, ctx.L.cur);
        e.lines = e.lines || sp.lines.map((l) => ({ desc: l.desc, qty: l.qty, uom: l.uom, price: l.price, disc: l.disc }));
        e.lines.push({ desc: '', qty: 1, uom: 'pcs', price: '', disc: 0 });
        ctx.rerender();
      },
      ss_ldel(el, ctx) {
        const sp = S.spend(ctx.s, ctx.L.cur);
        const e = edit(ctx.L, ctx.L.cur);
        e.lines = e.lines || sp.lines.map((l) => ({ desc: l.desc, qty: l.qty, uom: l.uom, price: l.price, disc: l.disc }));
        e.lines.splice(+el.dataset.i, 1);
        ctx.rerender();
      },
      ss_conf(el, ctx) {
        const e = edit(ctx.L, ctx.L.cur);
        e.confirm = [...new Set([...(e.confirm || []), el.dataset.k])];
        ctx.rerender();
      },
      ss_cancel(el, ctx) {
        const id = ctx.L.cur;
        const r = ctx.act('spend.cancel', { id, note: 'Dibatalkan saat review' }, `${id} dibatalkan`);
        if (r.ok) Object.assign(ctx.L, { tab: 'scan', m: 'home', cur: null, step: 1 }) && ctx.rerender();
      },
      ss_back1: (el, ctx) => (Object.assign(ctx.L, { tab: 'scan', m: 'cap' }), ctx.rerender()),
      ss_next1(el, ctx) {
        const L = ctx.L;
        const sp = S.spend(ctx.s, L.cur);
        const e = (L.edit || {})[sp.id] || {};
        const v = virt(sp, L);
        const issues = S.spendOpenIssues(v);
        if (issues.length) {
          ui.toast('Periksa dulu: ' + issues.map(issueLabel).join(', '), 'bad', 'Field merah/kuning wajib diisi atau dikonfirmasi');
          return ctx.rerender();
        }
        const payload = { id: sp.id, confirm: e.confirm || [] };
        if (e.fields) payload.fields = e.fields;
        if (e.lines) payload.lines = e.lines;
        const r = ctx.act('spend.update', payload, null);
        if (r.ok) {
          delete L.edit[sp.id];
          L.step = 2;
          ctx.rerender();
        }
      },
      ss_cls(el, ctx) {
        const k = el.dataset.k;
        const v = k === 'routine' ? el.dataset.v === '1' : el.dataset.v;
        ctx.act('spend.update', { id: ctx.L.cur, cls: { [k]: v } }, null);
      },
      ss_branch: (el, ctx) => ctx.act('spend.update', { id: ctx.L.cur, cls: { branch: el.value } }, (d) => `Outlet: ${S.orgName(ctx.s, d.branch)} · CC ${d.cc}`),
      ss_asset: (el, ctx) => ctx.act('spend.update', { id: ctx.L.cur, cls: { asset: el.value || null } }, null),
      ss_back2: (el, ctx) => ((ctx.L.step = 1), ctx.rerender()),
      ss_next2: (el, ctx) => ((ctx.L.step = 3), ctx.rerender()),
      ss_back3: (el, ctx) => ((ctx.L.step = 2), ctx.rerender()),
      ss_emg: (el, ctx) => ctx.act('spend.update', { id: ctx.L.cur, emergency: el.checked ? { reason: '' } : false }, null),
      ss_emgr: (el, ctx) => ctx.act('spend.update', { id: ctx.L.cur, emergency: { reason: el.value } }, null),
      ss_draft(el, ctx) {
        const r = ctx.act('spend.update', { id: ctx.L.cur, draft: true }, (d) => `${d.id} disimpan sebagai draft`);
        if (r.ok) Object.assign(ctx.L, { tab: 'history', sel: r.data.id, dtab: 'detail' }) && ctx.rerender();
      },
      ss_submit(el, ctx) {
        const r = ctx.act('spend.submit', { id: ctx.L.cur }, (d) => (d.flow === 'PO' ? `${d.id} diteruskan ke three-way match (${d.doc})` : `${d.id} diajukan — menunggu ${S.spendNextStep(d).label}`));
        if (r.ok) Object.assign(ctx.L, { tab: 'history', sel: r.data.id, dtab: 'detail', step: 1, cur: null }) && ctx.rerender();
      },
      ss_open: (el, ctx) => (Object.assign(ctx.L, { tab: 'history', sel: el.dataset.p, dtab: 'detail' }), ctx.rerender()),
      ss_hf: (el, ctx) => ((ctx.L.hf = el.dataset.v), ctx.rerender()),
      ss_dtab: (el, ctx) => ((ctx.L.dtab = el.dataset.v), ctx.rerender()),
      ss_resume: (el, ctx) => (Object.assign(ctx.L, { tab: 'review', cur: el.dataset.p, step: 1 }), ctx.rerender()),
      ss_void(el, ctx) {
        ctx.act('spend.cancel', { id: el.dataset.p }, (d) => `${d.id} dibatalkan`);
      },
      ss_dec(el, ctx) {
        const d = el.dataset.v;
        const run = (note) => ctx.act('spend.approve', { id: el.dataset.p, decision: d, note }, (x) => `${x.id}: ${d === 'APPROVE' ? (x.status === 'APPROVED' ? 'disetujui' : 'disetujui — lanjut ' + S.spendNextStep(x).label) : d === 'RETURN' ? 'dikembalikan ke pengaju' : 'ditolak'}`);
        if (d === 'APPROVE') run('');
        else ui.ask(d === 'RETURN' ? 'Kembalikan ke pengaju' : 'Tolak pengeluaran', 'Alasan (wajib)', run, { danger: d === 'REJECT', ok: d === 'RETURN' ? 'Kembalikan' : 'Tolak' });
      },
      ss_goods: (el, ctx) => ctx.act('spend.receive', { id: el.dataset.p }, (x) => `${x.id}: barang masuk ${S.whName(ctx.s, x.goodsWh)}`),
      ss_fin(el, ctx) {
        const d = el.dataset.v;
        if (d === 'VERIFY') return ctx.act('spend.verify', { id: el.dataset.p, cls: { p: ctx.val('ss-vp'), type: ctx.val('ss-vt') } }, (x) => `${x.id} diverifikasi · jurnal ${x.journal} menunggu review GL`);
        ui.ask(d === 'RETURN' ? 'Kembalikan ke pengaju' : 'Tolak pengeluaran', 'Alasan (wajib)', (note) => ctx.act('spend.verify', { id: el.dataset.p, decision: d, note }, (x) => `${x.id}: ${ui.statusLabel(x.status)}`), { danger: d === 'REJECT' });
      },
      ss_settle(el, ctx) {
        const sp = S.spend(ctx.s, el.dataset.p);
        ui.openModal('Catat pembayaran?', `<p>${esc(sp.id)} · <b>${U.rp(S.spendMath(sp).total)}</b> · ${esc(SP.FLOW[sp.flow])}</p><p class="small muted">SIMULASI — tidak ada dana keluar. Satu nota hanya dapat dibayar/direimburse sekali.</p>`, `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" id="ss-pay-ok">Ya, catat pembayaran</button>`);
        document.getElementById('ss-pay-ok').onclick = () => {
          ui.closeModal();
          ctx.act('spend.settle', { id: sp.id, confirm: true }, (x) => `${x.id} lunas · ${x.payment}`);
        };
      },
    },
  };
  /* ---------- Smart Spend evidence on related screens (NV-23, 27, 37, 42, 49, 50, 51) ----------
     Read-only panels: each row links to the transaction in NV-48 and opens the original receipt (permission-checked). */
  const thumb = (s, sp) => {
    const ev = S.evidence(s, sp.evidence);
    return ev ? `<button class="ss-mini" data-ev="${ev.id}" title="Buka bukti nota asli ${ev.id}"><img src="${esc(ev.image)}" alt="Nota ${ev.id}"></button>` : '<span class="tiny muted">—</span>';
  };
  HAWK.spendPanel = function (ctx, list, title, note, extraCol) {
    const { s } = ctx;
    if (!list.length) return '';
    const cols = [
      { h: 'Bukti', f: (sp) => thumb(s, sp) },
      { h: 'Transaksi', f: (sp) => `<button class="link" data-nav="48" data-q='${esc(JSON.stringify({ sel: sp.id }))}'>${sp.id}</button><br><span class="tiny muted">${esc(sp.fields.supplier || '—')}</span>` },
      { h: 'Unit · 7P', f: (sp) => `${esc(S.orgName(s, sp.branch))}<br><span class="tiny">${sp.cls && sp.cls.p ? ui.p7(sp.cls.p) : '—'}</span>` },
      { h: 'Total', num: true, f: (sp) => U.rp(S.spendNet(sp)) },
      { h: 'Status', f: (sp) => ui.status(statusOf(s, sp)) + (sp.emergency ? ' <span class="badge bad">DARURAT</span>' : '') },
    ];
    if (extraCol) cols.push(extraCol);
    return `<div class="card ss-xref"><div class="card-head"><h3>${ui.icon('camera', 16)} ${title}</h3><span class="r">${ui.intBadge('TO VERIFY')}</span></div>
      ${note ? `<p class="small muted" style="margin:0 0 8px">${note}</p>` : ''}${ui.table(cols, list.slice(0, 10))}
      ${list.length > 10 ? `<p class="tiny muted">+${list.length - 10} lainnya di NV-48 › Riwayat &amp; Bukti</p>` : ''}</div>`;
  };
  const vis = (ctx) => S.spendsFor(ctx.s, ctx.user).filter((x) => !['DRAFT', 'CANCELLED'].includes(x.status));
  const XREF = {
    23: (ctx) => HAWK.spendPanel(ctx, vis(ctx).filter((x) => x.cls && x.cls.type === 'OPEX' && x.ts >= '2026-11-08'), 'Smart Spend dalam angka budget', 'Pengajuan yang belum diverifikasi Finance dihitung sebagai <b>komitmen</b>; setelah diverifikasi menjadi <b>realisasi</b>. Tidak dihitung dua kali dengan MRF/PO.', { h: 'Dihitung sebagai', f: (sp) => (['VERIFIED', 'SETTLED'].includes(sp.status) ? 'Realisasi' : ['REJECTED'].includes(sp.status) ? '—' : 'Komitmen') }),
    27: (ctx) => HAWK.spendPanel(ctx, (ctx.s.spends || []).filter((x) => x.createdBy === ctx.user.id && x.status !== 'CANCELLED'), 'Pengeluaran Smart Spend saya', 'Nota yang Anda foto/ajukan lewat NV-48, dengan bukti asli.'),
    37: (ctx) => HAWK.spendPanel(ctx, vis(ctx).filter((x) => x.emergency), 'Pengeluaran darurat tanpa PO (Smart Spend)', 'Dibeli dulu di lapangan, disetujui susulan BU Manager (aturan AR-08). Tidak otomatis dibayar.'),
    42: (ctx) => HAWK.spendPanel(ctx, vis(ctx).filter((x) => x.cls && x.cls.type === 'INVENTORY' && x.flow !== 'PO'), 'Barang persediaan dari Smart Spend', 'Barang yang dibeli langsung (tanpa PO) harus dikonfirmasi PIC gudang sebelum Finance memverifikasi.', { h: 'Gudang', f: (sp) => (sp.goodsWh ? `✓ ${esc(S.whName(ctx.s, sp.goodsWh))}` : '<span class="badge warn">Menunggu konfirmasi</span>') }),
    49: (ctx) => HAWK.spendPanel(ctx, vis(ctx).filter((x) => x.flow === 'PO'), 'Faktur PO dari Smart Spend', 'Faktur ber-PO yang difoto lewat NV-48 diteruskan ke three-way matching di layar ini.', { h: 'Dokumen', f: (sp) => (sp.doc ? ui.id(sp.doc) : '—') }),
    50: (ctx) => HAWK.spendPanel(ctx, vis(ctx).filter((x) => ['UNPAID', 'REIMBURSE'].includes(x.flow)), 'Utang dari Smart Spend (tagihan & reimburse)', 'Utang diakui setelah verifikasi Finance. Satu nota hanya dapat dibayar/direimburse sekali.', { h: 'Jatuh tempo / penerima', f: (sp) => (sp.flow === 'UNPAID' ? (sp.fields.due ? U.date(sp.fields.due) : '—') : esc(S.userName(ctx.s, sp.fields.payer))) }),
    51: (ctx) => HAWK.spendPanel(ctx, vis(ctx).filter((x) => S.spendAccounting(ctx.s, x).journal), 'Jurnal bersumber Smart Spend', 'Setiap jurnal tertaut ke bukti nota asli. Nomor jurnal hanya tampil bila jurnal benar-benar sudah dibuat.', { h: 'Jurnal', f: (sp) => { const a = S.spendAccounting(ctx.s, sp); return [a.journal, a.settle].filter(Boolean).map((j) => `${ui.id(j.id)} ${ui.status(j.status)}`).join('<br>'); } }),
  };
  Object.keys(XREF).forEach((nv) => {
    const view = V[nv];
    if (!view || typeof view.render !== 'function') return;
    const base = view.render;
    view.render = function (ctx) {
      const out = base.call(this, ctx);
      let extra = '';
      try { extra = XREF[nv](ctx); } catch (e) { extra = ''; }
      return typeof out === 'string' ? out + extra : out;
    };
  });

  /* drawer for SM… / EV… references (global search, task inbox, audit links) */
  HAWK.spendDrawer = function (sp) {
    const s = HAWK.store.state;
    const u = HAWK.currentUser();
    if (!S.spendsFor(s, u).some((x) => x.id === sp.id)) return ui.toast('Anda tidak memiliki akses ke ' + sp.id, 'bad');
    const a = S.spendAccounting(s, sp);
    const next = S.spendNextStep(sp);
    const kv = (pairs) => `<dl class="kv">${pairs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
    ui.openDrawer('Smart Spend ' + sp.id, `<div class="card">${kv([['Status', ui.status(statusOf(s, sp))], ['Alur', esc(SP.FLOW[sp.flow] || '—')], ['Supplier', esc(sp.fields.supplier || '—')], ['Tanggal nota', sp.fields.date ? U.date(sp.fields.date) : '—'], ['Total', U.rp(S.spendNet(sp))], ['Unit', esc(S.orgName(s, sp.branch))], ['7P', sp.cls && sp.cls.p ? ui.p7(sp.cls.p) : '—'], ['Jenis', esc((sp.cls && sp.cls.type) || '—')], ['Pengaju', esc(S.userName(s, sp.createdBy))], ['Langkah berikut', next ? esc(next.label) : '—'], ['Akuntansi', esc(a.stage) + (a.journal ? ' · ' + ui.id(a.journal.id) : '')]])}</div>
      <div class="card" style="margin-top:12px"><h3>Bukti nota</h3>${thumb(s, sp)} <span class="tiny muted">Asli, tidak diubah. Koreksi tersimpan terpisah (${sp.corrections.length}).</span></div>`, `<button class="btn" data-nav="48" data-q='${esc(JSON.stringify({ sel: sp.id }))}'>Buka di NV-48</button>`, 'TO VERIFY');
  };
})();
