/* HAWK × JAENS — Smart Spend Money & AI Receipt Capture (MP-HAWK-05 / MP-HAWK-06).
   Extends the SAME state engine (store.js): same audit log, same journal rules (PENDING_REVIEW, posted by HAWK
   Finance via gl.post), same rollback. No second ledger, no new accounting engine.

   Four document flows:
     PAID      Spend Money — already paid by the branch (petty cash / transfer / QRIS). Payment is NOT recorded when the
               user picks a payment method; Finance records/reconciles it in a separate step (spend.settle).
     UNPAID    Supplier bill without PO — becomes a payable after Finance verification; paid later (spend.settle).
     REIMBURSE Employee paid personally — reimbursement liability after verification; one reimbursement per receipt.
     PO        PO-backed supplier invoice — handed to the existing PO–GRN–Invoice three-way match (doc.* → bill.*).
   Separate controls: user confirms data ≠ approver approves ≠ receiving PIC confirms goods ≠ Finance verifies
   classification ≠ Finance records payment.

   AI extraction in this preview is a deterministic AI SIMULATION over bundled DEMO receipt images.
   Nothing is sent to an OCR/AI service and there are no API keys in the client. */
(function (root) {
  'use strict';
  const HAWK = root.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const H = HAWK.handlers;
  const { log, hist, need, get, stockRow, ledger, journal } = HAWK.engine;

  /* ---------------- Masters & constants ---------------- */
  const SPEND_P = ['PEOPLE', 'PRODUCT', 'PROMOTION', 'PROCESS', 'PLACE', 'FACILITY']; // Profit (P7) is an outcome, never a spend category
  const CLS = { OPEX: 'Beban operasional (OPEX)', CAPEX: 'Belanja modal (CAPEX)', INVENTORY: 'Persediaan (stok)', OTHER: 'Lainnya (Finance menentukan)' };
  const FLOW = { PAID: 'Sudah dibayar (Spend Money)', UNPAID: 'Tagihan supplier belum dibayar', REIMBURSE: 'Reimburse karyawan', PO: 'Faktur dengan PO' };
  const PAY = {
    CASH: { label: 'Tunai — kas kecil cabang', flow: 'PAID' },
    TRANSFER: { label: 'Transfer bank perusahaan', flow: 'PAID' },
    QRIS: { label: 'QRIS / kartu perusahaan', flow: 'PAID' },
    EMPLOYEE: { label: 'Dibayar pribadi karyawan (reimburse)', flow: 'REIMBURSE' },
    UNPAID: { label: 'Belum dibayar (tagihan supplier)', flow: 'UNPAID' },
    PO: { label: 'Ditagihkan atas PO (bayar via AP)', flow: 'PO' },
  };
  const EXP_ACC = { PEOPLE: '6140 Beban SDM', PRODUCT: '6100 Beban BHP — Product', PROMOTION: '6130 Beban Promosi', PROCESS: '6150 Beban Proses & Sistem', PLACE: '6120 Beban Kebersihan — Place', FACILITY: '6210 Beban Pemeliharaan — Facility' };
  const CR_ACC = { PAID: '2155 Kas Kecil — Menunggu Rekonsiliasi', UNPAID: '2110 Utang Usaha', REIMBURSE: '2140 Utang Reimburse Karyawan' };
  const SETTLE_ACC = { PAID: '1120 Kas Kecil Cabang (DEMO)', UNPAID: '1110 Bank (DEMO)', REIMBURSE: '1110 Bank (DEMO)' };
  HAWK.SPEND = { SPEND_P, CLS, FLOW, PAY, EXP_ACC };

  /* Deterministic DEMO receipts. `read` = what the simulated AI reads from the image, with a confidence per field.
     A null value means the AI could not read it — it is never filled in by guessing. */
  const L = (desc, qty, uom, price, conf, extra) => ({ desc, qty, uom, price, disc: 0, conf: conf || 0.96, ...(extra || {}) });
  const SCENARIOS = [
    { key: 'PRINTED', icon: '🧾', title: 'Struk tercetak jelas', tag: 'Bersih', img: 'assets/img/receipts/printed.svg', fp: 'fp-msd-77120', kind: 'PRINTED',
      note: 'Semua field terbaca dengan keyakinan tinggi.',
      read: { supplier: ['Minimarket Sinar Dewata', 0.98], date: ['2026-11-08', 0.97], receiptNo: ['STR-77120', 0.96], currency: ['IDR', 0.99], pay: ['CASH', 0.93], tax: [0, 0.9], disc: [0, 0.95], total: [163000, 0.97] },
      lines: [L('Kantong sampah 60×100', 2, 'pak', 18500), L('Pengharum ruangan refill', 3, 'pcs', 42000)],
      suggest: { p: 'PLACE', cls: 'OPEX', routine: true, why: 'Item kebersihan & pengharum ruangan → Place (kebersihan outlet), dipakai langsung → OPEX.' } },
    { key: 'HANDWRITTEN', icon: '✍️', title: 'Nota tulisan tangan', tag: 'Tulisan tangan', img: 'assets/img/receipts/handwritten.svg', fp: 'fp-sj-00345', kind: 'HANDWRITTEN',
      note: 'Harga Pasir dan Total ditulis tangan & kurang jelas — perlu konfirmasi.',
      read: { supplier: ['Toko Bangunan Sumber Jaya', 0.91], date: ['2026-11-07', 0.9], receiptNo: ['00345', 0.88], currency: ['IDR', 0.97], pay: [null, 0], tax: [0, 0.8], disc: [0, 0.85], total: [1250000, 0.62] },
      lines: [L('Semen 40 kg', 10, 'zak', 60000, 0.9), L('Pasir', 1, 'truk', 35000, 0.55, { raw: '35_.000', hint: 'Angka harga tertutup noda; jumlah baris di nota terbaca 350.000' }), L('Batu kali', 1, 'truk', 300000, 0.88)],
      suggest: { p: 'FACILITY', cls: 'OPEX', routine: false, why: 'Bahan bangunan untuk perbaikan fasilitas outlet → Facility. Perbaikan kecil = OPEX; bila menambah nilai/umur aset, Finance dapat mengubah ke CAPEX.' } },
    { key: 'BLURRY', icon: '🌫️', title: 'Foto buram / tidak terbaca', tag: 'Kualitas rendah', img: 'assets/img/receipts/blurry.svg', fp: 'fp-blur-0001', kind: 'BLURRY',
      note: 'AI tidak dapat membaca total & rincian. Disarankan foto ulang, atau isi manual.',
      read: { supplier: [null, 0], date: [null, 0], receiptNo: [null, 0], currency: ['IDR', 0.6], pay: [null, 0], tax: [null, 0], disc: [null, 0], total: [null, 0] },
      lines: [],
      suggest: { p: null, cls: 'OPEX', routine: true, why: 'Tidak ada cukup data untuk merekomendasikan kategori.' } },
    { key: 'PO_PRICE', icon: '📦', title: 'Faktur PO — harga melebihi PO', tag: 'Selisih harga', img: 'assets/img/receipts/po-invoice.svg', fp: 'fp-man-1189', kind: 'PRINTED',
      note: 'Faktur atas PO20261000016; harga satuan faktur lebih tinggi dari PO.',
      read: { supplier: ['PT Minyak Atsiri Nusa', 0.97], date: ['2026-11-06', 0.96], receiptNo: ['MAN/INV/XI/1189', 0.95], currency: ['IDR', 0.99], pay: ['PO', 0.9], tax: [115500, 0.94], disc: [0, 0.95], total: [1165500, 0.96], po: ['PO20261000016', 0.95] },
      lines: [L('Essential Oil Aromaterapi 10ml', 20, 'btl', 52500, 0.95, { sku: 'BHP-005' })],
      suggest: { p: 'PRODUCT', cls: 'INVENTORY', routine: true, why: 'Item stok (SKU BHP-005) atas PO → persediaan; diproses lewat matching PO–penerimaan–faktur.' } },
    { key: 'DUPLICATE', icon: '♻️', title: 'Nota yang sudah pernah diajukan', tag: 'Duplikat', img: 'assets/img/receipts/duplicate.svg', fp: 'fp-tsb-2211', kind: 'PRINTED',
      note: 'Nota ini sudah tercatat sebagai SM20261100001 (5 Nov).',
      read: { supplier: ['Toko Sinar Bali', 0.97], date: ['2026-11-05', 0.97], receiptNo: ['TSB-2211', 0.96], currency: ['IDR', 0.99], pay: ['CASH', 0.92], tax: [0, 0.9], disc: [0, 0.95], total: [186000, 0.97] },
      lines: [L('Lilin aromaterapi', 6, 'pcs', 31000)],
      suggest: { p: 'PLACE', cls: 'OPEX', routine: true, why: 'Lilin suasana ruang treatment → Place.' } },
    { key: 'EMERGENCY', icon: '🚨', title: 'Pembelian darurat tanpa PO', tag: 'Darurat', img: 'assets/img/receipts/emergency.svg', fp: 'fp-tdb-5531', kind: 'PRINTED', emergency: true,
      note: 'AC ruang treatment mati saat ada tamu — suku cadang dibeli langsung. Butuh approval susulan BU Manager.',
      read: { supplier: ['CV Teknik Dingin Bali', 0.96], date: ['2026-11-08', 0.96], receiptNo: ['TDB-5531', 0.93], currency: ['IDR', 0.99], pay: ['CASH', 0.9], tax: [0, 0.88], disc: [0, 0.95], total: [520000, 0.96] },
      lines: [L('Kapasitor AC 35µF', 2, 'pcs', 95000, 0.94, { sku: 'SP-001' }), L('Freon R32 isi ulang', 1, 'tabung', 180000, 0.93, { sku: 'SP-002' }), L('Jasa pasang', 1, 'jasa', 150000, 0.9)],
      suggest: { p: 'FACILITY', cls: 'OPEX', routine: false, why: 'Suku cadang langsung dipasang untuk perbaikan (tidak masuk stok) → Facility OPEX.' } },
    { key: 'UNPAID', icon: '📨', title: 'Tagihan supplier belum dibayar', tag: 'Tagihan', img: 'assets/img/receipts/unpaid.svg', fp: 'fp-bhb-1108', kind: 'PRINTED',
      note: 'Invoice jasa pest control, jatuh tempo 22 Nov. Supplier belum ada di master.',
      read: { supplier: ['PT Bali Hama Bersih', 0.95], date: ['2026-11-08', 0.95], receiptNo: ['INV/PC/1108', 0.95], currency: ['IDR', 0.99], pay: ['UNPAID', 0.88], tax: [220000, 0.95], disc: [0, 0.95], total: [2220000, 0.96], due: ['2026-11-22', 0.9] },
      lines: [L('Jasa pest control bulanan', 1, 'paket', 2000000, 0.95)],
      suggest: { p: 'PLACE', cls: 'OPEX', routine: true, why: 'Jasa kebersihan/pengendalian hama area outlet → Place.' } },
    { key: 'REIMBURSE', icon: '👛', title: 'Reimburse karyawan', tag: 'Reimburse', img: 'assets/img/receipts/reimburse.svg', fp: 'fp-tub-4410', kind: 'PRINTED',
      note: 'Karyawan membeli minyak pijat dengan uang pribadi. Item stok → wajib dikonfirmasi gudang.',
      read: { supplier: ['Toko Usaha Bali Wangi', 0.94], date: ['2026-11-07', 0.95], receiptNo: ['UBW-4410', 0.92], currency: ['IDR', 0.99], pay: ['EMPLOYEE', 0.7], tax: [0, 0.88], disc: [0, 0.95], total: [276000, 0.95] },
      lines: [L('Minyak Pijat Lavender 1L', 3, 'btl', 92000, 0.94, { sku: 'BHP-001' })],
      suggest: { p: 'PRODUCT', cls: 'INVENTORY', routine: true, why: 'SKU BHP-001 (Minyak Pijat Lavender) cocok → persediaan; diterima gudang dulu, beban diakui saat dipakai.' } },
    { key: 'OVERBUDGET', icon: '📊', title: 'Pengeluaran melewati budget', tag: 'Over budget', img: 'assets/img/receipts/overbudget.svg', fp: 'fp-pkd-3021', kind: 'PRINTED',
      note: 'Cetak spanduk & brosur event; budget Promotion Shanti bulan ini hampir habis.',
      read: { supplier: ['Percetakan Kilat Denpasar', 0.96], date: ['2026-11-08', 0.96], receiptNo: ['PKD-3021', 0.94], currency: ['IDR', 0.99], pay: ['TRANSFER', 0.85], tax: [0, 0.9], disc: [200000, 0.9], total: [4800000, 0.96] },
      lines: [L('Spanduk event 3×1 m', 4, 'lbr', 450000), L('Brosur A5 full color', 2000, 'lbr', 1600)],
      suggest: { p: 'PROMOTION', cls: 'OPEX', routine: false, why: 'Materi promosi event → Promotion, non-rutin.' } },
  ];
  HAWK.SPEND.SCENARIOS = SCENARIOS;

  /* ---------------- Seed additions (DEMO) ---------------- */
  const baseSeed = HAWK.seed;
  HAWK.seed = function () {
    const s = baseSeed();
    s.meta.schema = 5;
    s.meta.seq.SM202611 = 1;
    s.meta.seq.EV202611 = 1;
    s.meta.seq.JV202611 = (s.meta.seq.JV202611 || 0) + 1;
    // Month-to-date actual per branch × 7P before today's demo activity (DEMO numbers, Rp) — used for the monthly budget check
    s.spendMonthBase = {
      'BR-SHN|FACILITY': 13200000, 'BR-SHN|PROMOTION': 11400000, 'BR-SHN|PLACE': 6100000, 'BR-SHN|PRODUCT': 9800000, 'BR-SHN|PROCESS': 1900000, 'BR-SHN|PEOPLE': 0,
      'BR-UBD|FACILITY': 15400000, 'BR-UBD|PROMOTION': 9200000, 'BR-UBD|PLACE': 8800000, 'BR-UBD|PRODUCT': 14100000,
    };
    // A received, unbilled PO for the PO-backed invoice scenario (seed history: GRN posted & stored)
    s.pos.push({ id: 'PO20261000016', date: '2026-10-29T09:00:00', supplier: 'SUP-007', deliverTo: 'WH-SHN', status: 'RECEIVED', emergency: false, memo: 'Restock essential oil Spa Shanti', promised: '2026-11-04', term: 'Net 30', createdBy: 'U-PUR', approvedBy: 'U-BUM', freight: 0, taxRate: 0.11,
      lines: [{ item: 'BHP-005', qty: 20, received: 20, price: 48000, disc: 0, mrfRefs: [] }], history: [{ ts: '2026-10-29T09:00:00', by: 'U-PUR', action: 'CREATE' }, { ts: '2026-10-29T13:00:00', by: 'U-BUM', action: 'APPROVE' }, { ts: '2026-11-04T10:00:00', by: 'U-WHS', action: 'FULLY_RECEIVED' }] });
    s.grns.push({ id: 'GR20261000012', po: 'PO20261000016', wh: 'WH-SHN', date: '2026-11-04T10:00:00', status: 'STORED', lines: [{ item: 'BHP-005', expected: 20, received: 20, damaged: 0, bin: 'SHN-A-02' }], docs: ['Surat Jalan MAN-SJ-1189 (scan simulasi)'], receiver: 'U-WHS', journal: 'JV20261000041', history: [] });
    s.journals.push({ id: 'JV20261000041', ts: '2026-11-04T10:05:00', source: 'GR20261000012', kind: 'GOODS_RECEIPT', status: 'POSTED', memo: 'Penerimaan PO20261000016', lines: [{ acc: '1140 Persediaan BHP', cc: 'CC-OFC-PUR', dr: 960000, cr: 0 }, { acc: '2120 Barang Diterima Belum Ditagih (GRNI)', cc: 'CC-OFC-PUR', dr: 0, cr: 960000 }] });
    // One already-processed Smart Spend transaction (target of the duplicate scenario)
    const jv = 'JV202611' + String(s.meta.seq.JV202611).padStart(5, '0');
    s.evidence = [{ id: 'EV20261100001', spend: 'SM20261100001', file: 'nota_TokoSinarBali_TSB-2211.jpg', image: 'assets/img/receipts/duplicate.svg', mime: 'image/svg+xml', pages: 1, fingerprint: 'fp-tsb-2211', uploadedBy: 'U-STF', ts: '2026-11-05T16:10:00', storage: 'LOCAL_DEMO', derived: [] }];
    s.spends = [{
      id: 'SM20261100001', ts: '2026-11-05T16:10:00', createdBy: 'U-STF', branch: 'BR-SHN', cc: 'CC-SHN-OPS', status: 'SETTLED', flow: 'PAID', scenario: 'DUPLICATE', evidence: 'EV20261100001', source: 'SIMULATED_AI_EXTRACTION',
      ai: { supplier: 'Toko Sinar Bali', date: '2026-11-05', receiptNo: 'TSB-2211', total: 186000 },
      fields: { supplier: 'Toko Sinar Bali', supplierId: null, date: '2026-11-05', receiptNo: 'TSB-2211', currency: 'IDR', pay: 'CASH', payDate: '2026-11-05', tax: 0, disc: 0, total: 186000, payer: null, due: null, po: null },
      lines: [{ desc: 'Lilin aromaterapi', qty: 6, uom: 'pcs', price: 31000, disc: 0, sku: null }],
      cls: { p: 'PLACE', type: 'OPEX', routine: true, asset: null, project: null },
      corrections: [], confirmed: ['total'], emergency: null,
      steps: [{ key: 'CONFIRM', role: 'STAFF', label: 'Data nota dikonfirmasi pengaju', status: 'DONE', by: 'U-STF', ts: '2026-11-05T16:12:00' }, { key: 'APPROVE', role: 'SUPERVISOR', label: 'Persetujuan Supervisor', status: 'DONE', by: 'U-SPV', ts: '2026-11-05T17:00:00' }, { key: 'VERIFY', role: 'FINANCE', label: 'Verifikasi Finance', status: 'DONE', by: 'U-FIN', ts: '2026-11-06T09:00:00' }, { key: 'SETTLE', role: 'FINANCE', label: 'Rekonsiliasi kas kecil', status: 'DONE', by: 'U-FIN', ts: '2026-11-06T09:30:00' }],
      journal: jv, settleJournal: null, budgetAtSubmit: null,
      history: [{ ts: '2026-11-05T16:10:00', by: 'U-STF', action: 'CAPTURE', note: 'AI SIMULATION' }, { ts: '2026-11-05T16:12:00', by: 'U-STF', action: 'SUBMIT' }, { ts: '2026-11-05T17:00:00', by: 'U-SPV', action: 'APPROVE' }, { ts: '2026-11-06T09:00:00', by: 'U-FIN', action: 'VERIFY', note: jv }, { ts: '2026-11-06T09:30:00', by: 'U-FIN', action: 'SETTLE' }],
    }];
    s.journals.push({ id: jv, ts: '2026-11-06T09:00:00', source: 'SM20261100001', kind: 'SPEND_MONEY', status: 'POSTED', memo: 'Spend Money Toko Sinar Bali TSB-2211 (kas kecil, sudah direkonsiliasi)', lines: [{ acc: EXP_ACC.PLACE, cc: 'CC-SHN-OPS', dr: 186000, cr: 0 }, { acc: SETTLE_ACC.PAID, cc: 'CC-SHN-OPS', dr: 0, cr: 186000 }] });
    return s;
  };

  /* ---------------- Selectors ---------------- */
  S.scenario = (key) => SCENARIOS.find((x) => x.key === key);
  S.spend = (s, id) => (s.spends || []).find((x) => x.id === id);
  S.evidence = (s, id) => (s.evidence || []).find((x) => x.id === id);
  const r0 = (v) => Math.round(+v || 0);
  /* Arithmetic: Σ(qty × price − line disc) − doc discount + tax = total (tolerance Rp1) */
  S.spendMath = (sp) => {
    const f = sp.fields;
    const lineSum = U.sum(sp.lines, (l) => r0(l.qty * l.price) - r0(l.disc));
    const expected = lineSum - r0(f.disc) + r0(f.tax);
    const hasTotal = f.total !== null && f.total !== undefined && f.total !== '';
    const lineErr = sp.lines.map((l) => !(l.qty > 0) || !(l.price >= 0));
    return { lineSum, expected, total: hasTotal ? r0(f.total) : null, diff: hasTotal ? r0(f.total) - expected : null, ok: hasTotal && sp.lines.length > 0 && Math.abs(r0(f.total) - expected) <= 1 && !lineErr.some(Boolean), lineErr, net: hasTotal ? r0(f.total) - r0(f.tax) : null };
  };
  /* Field state for the review UI: OK (green) | CONFIRM (amber) | BAD (red) | NONE (neutral) */
  S.spendFieldState = (sp, key) => {
    const conf = (sp.conf || {})[key];
    const v = sp.fields[key];
    const confirmed = (sp.confirmed || []).includes(key) || (sp.corrections || []).some((c) => c.field === key);
    if (key === 'total') {
      const m = S.spendMath(sp);
      if (m.total === null) return 'BAD';
      if (!m.ok && sp.lines.length) return 'BAD';
    }
    if (v === null || v === undefined || v === '') return ['supplier', 'date', 'total'].includes(key) ? 'BAD' : 'NONE';
    if (conf !== undefined && conf < 0.85 && !confirmed) return 'CONFIRM';
    return 'OK';
  };
  S.spendLineState = (sp, i) => {
    const l = sp.lines[i];
    if (!(l.qty > 0) || !(l.price >= 0) || !l.desc) return 'BAD';
    if (l.conf !== undefined && l.conf < 0.85 && !(sp.confirmed || []).includes('line:' + i) && !(sp.corrections || []).some((c) => c.field === 'line:' + i)) return 'CONFIRM';
    return 'OK';
  };
  S.spendOpenIssues = (sp) => {
    const out = [];
    ['supplier', 'date', 'total'].forEach((k) => S.spendFieldState(sp, k) === 'BAD' && out.push(k));
    ['supplier', 'date', 'receiptNo', 'total', 'pay'].forEach((k) => S.spendFieldState(sp, k) === 'CONFIRM' && out.push(k));
    sp.lines.forEach((l, i) => S.spendLineState(sp, i) !== 'OK' && out.push('line:' + i));
    if (!sp.lines.length) out.push('lines');
    if (!S.spendMath(sp).ok) out.push('math');
    if (!sp.fields.pay) out.push('pay');
    return [...new Set(out)];
  };
  S.supplierMatch = (s, text) => {
    if (!text) return null;
    const t = String(text).toLowerCase().replace(/\b(pt|cv|ud|toko)\b\.?/g, '').trim();
    return s.suppliers.find((x) => x.name.toLowerCase().replace(/\(demo\)/, '').replace(/\b(pt|cv|ud|toko)\b\.?/g, '').trim().startsWith(t.slice(0, 10))) || null;
  };
  S.skuMatch = (s, desc) => {
    if (!desc) return null;
    const d = desc.toLowerCase();
    return s.items.find((i) => d.includes(i.name.toLowerCase().slice(0, 14))) || null;
  };
  S.spendDuplicates = (s, sp) => {
    const f = sp.fields;
    const ev = S.evidence(s, sp.evidence);
    const hits = [];
    (s.spends || []).forEach((o) => {
      if (o.id === sp.id || ['REJECTED', 'CANCELLED'].includes(o.status)) return;
      const oe = S.evidence(s, o.evidence);
      const reasons = [];
      if (ev && oe && ev.fingerprint && ev.fingerprint === oe.fingerprint) reasons.push('sidik jari gambar sama');
      if (f.receiptNo && o.fields.receiptNo && f.receiptNo === o.fields.receiptNo && (f.supplier || '').toLowerCase() === (o.fields.supplier || '').toLowerCase()) reasons.push('no. nota & supplier sama');
      if (f.total && r0(f.total) === r0(o.fields.total) && f.date === o.fields.date && (f.supplier || '').toLowerCase() === (o.fields.supplier || '').toLowerCase()) reasons.push('supplier, tanggal & jumlah sama');
      if (reasons.length) hits.push({ id: o.id, status: o.status, reasons });
    });
    s.bills.forEach((b) => {
      if (f.receiptNo && b.invoiceNo === f.receiptNo && b.status !== 'VOID') hits.push({ id: b.id, status: b.status, reasons: ['no. faktur sudah ada di AP'] });
    });
    return hits;
  };
  S.priceAlerts = (s, sp) =>
    sp.lines
      .map((l, i) => {
        const it = l.sku && S.item(s, l.sku);
        if (!it || !(l.price > 0)) return null;
        const d = (l.price - it.price) / it.price;
        return Math.abs(d) >= 0.05 ? { i, item: it.id, name: it.name, std: it.price, price: l.price, diff: d } : null;
      })
      .filter(Boolean);
  S.spendNet = (sp) => {
    const m = S.spendMath(sp);
    return m.total === null ? 0 : m.total - r0(sp.fields.tax);
  };
  /* Monthly budget check — branch share of the BU annual 7P line (DEMO allocation: revised × branch share ÷ 12) */
  S.spendBudget = (s, sp, opt = {}) => {
    const p = sp.cls && sp.cls.p;
    const type = sp.cls && sp.cls.type;
    const bu = S.buOf(s, sp.branch);
    const out = { p, type, bu, applies: type === 'OPEX' && !!p, period: s.meta.period };
    if (!out.applies) {
      out.note = type === 'INVENTORY' ? 'Persediaan tidak membebani budget saat dibeli — beban 7P diakui saat barang dipakai (issue).' : type === 'CAPEX' ? 'CAPEX dicatat ke anggaran belanja modal (Facility CAPEX), bukan OPEX bulanan.' : 'Pilih kategori 7P & jenis pengeluaran untuk melihat dampak budget.';
      return out;
    }
    const b = s.budgets.find((x) => x.bu === bu && x.fy === 2026);
    const line = b && b.lines.find((l) => l.p === p && l.cls === 'OPEX');
    const share = (s.branchShare || {})[sp.branch];
    const monthly = line ? Math.round((line.revised * (share || 1)) / 12) : 0;
    const base = (s.spendMonthBase || {})[sp.branch + '|' + p] || 0;
    const cc = (S.ccOfOrg(s, sp.branch) || {}).id;
    const issued = U.sum(s.ledger.filter((l) => l.type === 'ISSUE' && l.cc === cc && l.note !== 'Seed history' && (l.ts || '').slice(0, 7) === s.meta.period), (l) => {
      const it = S.item(s, l.item);
      return it && it.p === p ? -l.qty * it.price : 0;
    });
    const others = (s.spends || []).filter((o) => o.id !== sp.id && o.branch === sp.branch && o.cls && o.cls.p === p && o.cls.type === 'OPEX' && (o.fields.date || '').slice(0, 7) === s.meta.period);
    const verified = U.sum(others.filter((o) => ['VERIFIED', 'SETTLED'].includes(o.status) && o.ts >= '2026-11-08'), (o) => S.spendNet(o));
    const commit = U.sum(others.filter((o) => ['SUBMITTED', 'APPROVED', 'GOODS_CONFIRMED'].includes(o.status)), (o) => S.spendNet(o));
    const self = ['VERIFIED', 'SETTLED'].includes(sp.status) && sp.ts >= '2026-11-08';
    const actual = base + issued + verified + (self ? S.spendNet(sp) : 0);
    const thisAmt = self ? 0 : S.spendNet(sp);
    const after = actual + commit + thisAmt;
    Object.assign(out, { monthly, actual, commit, thisAmt, after, remainingAfter: monthly - after, ratioBefore: monthly ? (actual + commit) / monthly : 0, ratio: monthly ? after / monthly : 0, share, line: !!line });
    out.status = !monthly ? 'NO_BUDGET' : out.ratio > 1 ? 'OVER' : out.ratio >= 0.9 ? 'WARN' : 'OK';
    return out;
  };
  /* Approval route — derived from rules, shown to the user before submission */
  S.spendRoute = (s, sp) => {
    const steps = [{ key: 'CONFIRM', role: sp.createdByRole || 'STAFF', label: 'Data nota dikonfirmasi pengaju' }];
    if (sp.flow === 'PO') {
      steps.push({ key: 'MATCH', role: 'FINANCE', label: 'Three-way match PO–GRN–faktur (NV-49)' }, { key: 'AP', role: 'FINANCE', label: 'Tagihan AP & approval (NV-50)' });
      return steps;
    }
    const bud = S.spendBudget(s, sp);
    if (sp.emergency) steps.push({ key: 'APPROVE', role: 'BU_MANAGER', label: 'Approval susulan pembelian darurat (BU Manager)', post: true });
    else {
      const isOffice = (S.org(s, sp.branch) || {}).type !== 'BRANCH';
      steps.push({ key: 'APPROVE', role: isOffice ? 'HEAD_DIV' : 'SUPERVISOR', label: isOffice ? 'Persetujuan Head of Division' : 'Persetujuan Supervisor outlet' });
      if (bud.status === 'OVER') steps.push({ key: 'APPROVE2', role: 'BU_MANAGER', label: 'Persetujuan tambahan BU Manager (melewati budget)' });
    }
    if (sp.cls && sp.cls.type === 'INVENTORY') steps.push({ key: 'GOODS', role: 'WAREHOUSE', label: 'Konfirmasi barang fisik oleh PIC gudang' });
    steps.push({ key: 'VERIFY', role: 'FINANCE', label: 'Verifikasi Finance: klasifikasi & perlakuan akuntansi' });
    steps.push({ key: 'SETTLE', role: 'FINANCE', label: sp.flow === 'PAID' ? 'Finance: rekonsiliasi kas kecil / pembayaran' : sp.flow === 'REIMBURSE' ? 'Finance: bayar reimburse ke karyawan' : 'Finance: pembayaran tagihan supplier' });
    return steps;
  };
  S.spendNextStep = (sp) => (sp.steps || []).find((x) => x.status === 'PENDING');
  S.canActSpend = (s, sp, u) => {
    const st = S.spendNextStep(sp);
    if (!st || !['SUBMITTED', 'APPROVED', 'GOODS_CONFIRMED', 'VERIFIED'].includes(sp.status)) return null;
    if (st.role !== u.role) return null;
    if (u.id === sp.createdBy) return null; // SoD: never act on your own expense
    if (st.role === 'SUPERVISOR' && !u.scope.includes(sp.branch)) return null;
    if (['BU_MANAGER', 'HEAD_DIV'].includes(st.role) && !u.scope.some((x) => x === S.buOf(s, sp.branch) || x === sp.branch)) return null;
    if (st.key === 'SETTLE' && sp.steps.some((x) => x.key === 'VERIFY' && x.by === u.id) && s.users.filter((x) => x.role === 'FINANCE').length > 1) return null;
    return st;
  };
  /* Who may open the original receipt (UI simulation; the HAWK backend must enforce the same rule) */
  S.canSeeEvidence = (s, u, sp) => {
    if (!sp) return false;
    if (['OWNER', 'FINANCE'].includes(u.role)) return true;
    if (sp.createdBy === u.id) return true;
    if (['SUPERVISOR', 'HEAD_DIV', 'BU_MANAGER'].includes(u.role)) return u.scope.some((x) => x === sp.branch || x === S.buOf(s, sp.branch));
    if (u.role === 'WAREHOUSE') return !!(sp.cls && sp.cls.type === 'INVENTORY') || sp.flow === 'PO';
    if (u.role === 'PURCHASING') return sp.flow === 'PO' || !!sp.emergency || !sp.fields.supplierId;
    return false;
  };
  S.spendsFor = (s, u) =>
    (s.spends || []).filter((sp) => {
      if (['OWNER', 'FINANCE'].includes(u.role)) return true;
      if (sp.createdBy === u.id) return true;
      if (['SUPERVISOR', 'HEAD_DIV', 'BU_MANAGER'].includes(u.role)) return sp.status !== 'DRAFT' && u.scope.some((x) => x === sp.branch || x === S.buOf(s, sp.branch));
      if (u.role === 'WAREHOUSE') return sp.status !== 'DRAFT' && ((sp.cls && sp.cls.type === 'INVENTORY') || sp.flow === 'PO');
      if (u.role === 'PURCHASING') return sp.status !== 'DRAFT' && (sp.flow === 'PO' || !!sp.emergency || !sp.fields.supplierId);
      return false;
    });
  /* Accounting status — a journal reference is shown only when one was actually generated */
  S.spendAccounting = (s, sp) => {
    if (sp.flow === 'PO') {
      const d = s.docs.find((x) => x.id === sp.doc);
      const b = d && d.bill && s.bills.find((x) => x.id === d.bill);
      const jv = b && b.journal && s.journals.find((j) => j.id === b.journal);
      return { stage: b ? `Tagihan ${b.id} ${b.status}` : d ? `Dokumen ${d.id} ${d.status}` : 'Belum masuk matching', journal: jv || null, doc: d || null, bill: b || null };
    }
    const jv = sp.journal && s.journals.find((j) => j.id === sp.journal);
    const js = sp.settleJournal && s.journals.find((j) => j.id === sp.settleJournal);
    return { stage: js ? 'Pembayaran tercatat' : jv ? (jv.status === 'POSTED' ? 'Jurnal diposting' : 'Jurnal menunggu review GL') : 'Belum ada jurnal — menunggu verifikasi Finance', journal: jv || null, settle: js || null };
  };

  /* Budget engine hooks: verified OPEX spend = actual; submitted/approved = commitment (no double counting with MRF/PO/issue) */
  const baseActual = S.dynamicActual;
  S.dynamicActual = (s, bu, p) =>
    baseActual(s, bu, p) + U.sum((s.spends || []).filter((sp) => ['VERIFIED', 'SETTLED'].includes(sp.status) && sp.ts >= '2026-11-08' && sp.cls && sp.cls.type === 'OPEX' && sp.cls.p === p && S.buOf(s, sp.branch) === bu), (sp) => S.spendNet(sp));
  const baseCommit = S.dynamicCommit;
  S.dynamicCommit = (s, bu, p) =>
    baseCommit(s, bu, p) + U.sum((s.spends || []).filter((sp) => ['SUBMITTED', 'APPROVED', 'GOODS_CONFIRMED'].includes(sp.status) && sp.cls && sp.cls.type === 'OPEX' && sp.cls.p === p && S.buOf(s, sp.branch) === bu), (sp) => S.spendNet(sp));
  const baseFind = S.findRecord;
  S.findRecord = (s, id) => baseFind(s, id) || ((s.spends || []).find((x) => x.id === id) ? { type: 'SPEND', rec: S.spend(s, id) } : (s.evidence || []).find((x) => x.id === id) ? { type: 'EVIDENCE', rec: S.evidence(s, id) } : null);

  /* ---------------- Handlers ---------------- */
  const fieldKeys = ['supplier', 'date', 'receiptNo', 'currency', 'pay', 'tax', 'disc', 'total', 'due', 'po'];
  const fnv = (str) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
    return 'fp-up-' + h.toString(16);
  };
  const editable = (sp) => ['DRAFT', 'RETURNED'].includes(sp.status);
  const ownerOnly = (sp, ctx) => need(sp.createdBy === ctx.user.id, 'FORBIDDEN', 'Hanya pengaju yang dapat mengubah pengeluaran ini');

  H['spend.capture'] = (s, p, ctx) => {
    s.spends = s.spends || [];
    s.evidence = s.evidence || [];
    const u = ctx.user;
    const branch = p.branch || (u.scope.find((x) => (S.org(s, x) || {}).type === 'BRANCH') || u.scope[0]);
    need(S.org(s, branch), 'VALIDATION', 'Outlet / divisi wajib');
    need(u.role === 'OWNER' || ['FINANCE', 'PURCHASING', 'WAREHOUSE'].includes(u.role) || u.scope.some((x) => x === branch || x === S.buOf(s, branch)), 'FORBIDDEN', 'Outlet di luar cakupan Anda');
    const sc = p.scenario && S.scenario(p.scenario);
    need(sc || p.upload || p.manual, 'VALIDATION', 'Pilih nota contoh, unggah foto, atau isi manual');
    const eid = U.nextId(s, 'EV');
    const id = U.nextId(s, 'SM');
    const ev = {
      id: eid, spend: id, file: sc ? `nota_${sc.key.toLowerCase()}_${id}.jpg` : p.upload ? p.upload.name || 'foto_nota.jpg' : 'tanpa_foto', image: sc ? sc.img : p.upload ? p.upload.dataUrl : null, mime: sc ? 'image/svg+xml' : p.upload ? 'image/jpeg' : null,
      pages: Math.max(1, +p.pages || 1), fingerprint: sc ? sc.fp : p.upload ? fnv(p.upload.dataUrl || '') : null, uploadedBy: u.id, ts: ctx.now, storage: 'LOCAL_DEMO', derived: [],
    };
    if (p.rotation) ev.derived.push({ kind: 'ROTATE', deg: +p.rotation, note: 'Versi tampilan — file asli tidak diubah' });
    if (ev.image) s.evidence.unshift(ev);
    const rd = sc ? sc.read : {};
    const val = (k) => (rd[k] ? rd[k][0] : null);
    const conf = {};
    fieldKeys.forEach((k) => rd[k] && (conf[k] = rd[k][1]));
    const sup = S.supplierMatch(s, val('supplier'));
    const lines = sc ? sc.lines.map((l) => ({ ...l, sku: l.sku || ((S.skuMatch(s, l.desc) || {}).id || null) })) : [];
    const pay = val('pay');
    const sp = {
      id, ts: ctx.now, createdBy: u.id, createdByRole: u.role, branch, cc: (S.ccOfOrg(s, branch) || {}).id || null, status: 'DRAFT', scenario: sc ? sc.key : null,
      evidence: ev.image ? eid : null, source: sc ? 'SIMULATED_AI_EXTRACTION' : p.upload ? 'MANUAL_ENTRY_WITH_PHOTO' : 'MANUAL_ENTRY',
      ai: sc ? { ...Object.fromEntries(fieldKeys.map((k) => [k, val(k)])), lines: sc.lines.map((l) => ({ desc: l.desc, qty: l.qty, uom: l.uom, price: l.price })) } : null,
      conf,
      fields: { supplier: val('supplier'), supplierId: sup ? sup.id : null, date: val('date'), receiptNo: val('receiptNo'), currency: val('currency') || 'IDR', pay, payDate: pay && PAY[pay] && PAY[pay].flow === 'PAID' ? val('date') : null, tax: val('tax'), disc: val('disc'), total: val('total'), payer: pay === 'EMPLOYEE' ? u.id : null, due: val('due'), po: val('po') },
      lines, flow: pay && PAY[pay] ? PAY[pay].flow : null,
      cls: sc && sc.suggest.p ? { p: sc.suggest.p, type: sc.suggest.cls, routine: sc.suggest.routine, asset: null, project: null, suggested: { ...sc.suggest } } : { p: null, type: 'OPEX', routine: true, asset: null, project: null, suggested: sc ? { ...sc.suggest } : null },
      corrections: [], confirmed: [], emergency: sc && sc.emergency ? { reason: '' } : null, steps: [], journal: null, settleJournal: null, history: [],
    };
    hist(sp, ctx, 'CAPTURE', sc ? `AI SIMULATION — contoh "${sc.title}" (tidak ada OCR nyata)` : p.upload ? 'Foto diunggah; isi manual (AI SIMULATION tidak membaca foto pengguna)' : 'Isi manual tanpa foto');
    s.spends.unshift(sp);
    log(s, ctx, 'spend.capture', id, sc ? sc.key : 'MANUAL');
    return sp;
  };

  H['spend.update'] = (s, p, ctx) => {
    const sp = get(s.spends || [], p.id, 'Pengeluaran');
    need(editable(sp), 'STATE', 'Pengeluaran sudah diajukan — tidak dapat diubah');
    ownerOnly(sp, ctx);
    const num = (v) => (v === '' || v === null || v === undefined ? null : Math.round(+String(v).replace(/[^\d.-]/g, '')));
    if (p.fields) {
      Object.keys(p.fields).forEach((k) => {
        if (!['supplier', 'date', 'receiptNo', 'currency', 'pay', 'payDate', 'tax', 'disc', 'total', 'payer', 'due', 'po'].includes(k)) return;
        let v = p.fields[k];
        if (['tax', 'disc', 'total'].includes(k)) v = num(v);
        if (v === '') v = null;
        if (v !== sp.fields[k]) {
          if (sp.ai && Object.prototype.hasOwnProperty.call(sp.ai, k)) sp.corrections.push({ field: k, ai: sp.ai[k], value: v, by: ctx.user.id, ts: ctx.now });
          sp.fields[k] = v;
        }
      });
      if (p.fields.supplier !== undefined) sp.fields.supplierId = (S.supplierMatch(s, sp.fields.supplier) || {}).id || null;
      if (sp.fields.pay && PAY[sp.fields.pay]) sp.flow = PAY[sp.fields.pay].flow;
      if (sp.fields.pay === 'EMPLOYEE' && !sp.fields.payer) sp.fields.payer = sp.createdBy;
    }
    if (p.lines) {
      need(Array.isArray(p.lines), 'VALIDATION', 'Rincian item tidak valid');
      p.lines.forEach((nl, i) => {
        const old = sp.lines[i];
        const clean = { desc: String(nl.desc || '').trim(), qty: +nl.qty || 0, uom: nl.uom || (old && old.uom) || 'pcs', price: num(nl.price) || 0, disc: num(nl.disc) || 0 };
        if (old) {
          ['desc', 'qty', 'price', 'disc', 'uom'].forEach((k) => {
            if (clean[k] !== old[k]) sp.corrections.push({ field: 'line:' + i, attr: k, ai: old[k], value: clean[k], by: ctx.user.id, ts: ctx.now });
          });
          Object.assign(old, clean);
          old.sku = (S.skuMatch(s, old.desc) || {}).id || old.sku || null;
        } else sp.lines.push({ ...clean, sku: (S.skuMatch(s, clean.desc) || {}).id || null, conf: 1 });
      });
      if (p.lines.length < sp.lines.length) sp.lines = sp.lines.slice(0, p.lines.length);
    }
    if (p.confirm) (Array.isArray(p.confirm) ? p.confirm : [p.confirm]).forEach((k) => !sp.confirmed.includes(k) && sp.confirmed.push(k));
    if (p.cls) {
      const c = p.cls;
      if (c.p !== undefined) need(c.p === null || SPEND_P.includes(c.p), 'VALIDATION', 'Kategori 7P tidak valid (Profit adalah hasil, bukan kategori belanja)');
      if (c.type !== undefined) need(Object.keys(CLS).includes(c.type), 'VALIDATION', 'Jenis pengeluaran tidak valid');
      if (c.branch) {
        need(S.org(s, c.branch) && ctx.user.scope.some((x) => x === c.branch || x === S.buOf(s, c.branch)) || ctx.user.role === 'OWNER', 'FORBIDDEN', 'Outlet di luar cakupan Anda');
        sp.branch = c.branch;
        sp.cc = (S.ccOfOrg(s, c.branch) || {}).id || null;
      }
      ['p', 'type', 'routine', 'asset', 'project'].forEach((k) => c[k] !== undefined && (sp.cls[k] = c[k]));
    }
    if (p.emergency !== undefined) sp.emergency = p.emergency ? { reason: String(p.emergency.reason || '') } : null;
    if (p.note !== undefined) sp.note = p.note;
    hist(sp, ctx, p.draft ? 'SAVE_DRAFT' : 'EDIT', p.draft ? 'Disimpan sebagai draft' : null);
    log(s, ctx, 'spend.update', sp.id, p.draft ? 'Draft' : 'Ubah data');
    return sp;
  };

  H['spend.submit'] = (s, p, ctx) => {
    const sp = get(s.spends || [], p.id, 'Pengeluaran');
    need(editable(sp), 'STATE', 'Pengeluaran sudah diajukan');
    ownerOnly(sp, ctx);
    const f = sp.fields;
    need(f.supplier && f.date, 'VALIDATION', 'Supplier dan tanggal wajib diisi');
    const m = S.spendMath(sp);
    need(m.total !== null && m.total > 0, 'VALIDATION', 'Total wajib diisi sesuai nota — AI tidak mengisi angka yang tidak terbaca');
    need(sp.lines.length > 0, 'VALIDATION', 'Minimal satu baris item');
    need(m.ok, 'ARITHMETIC', `Total ${U.rp(m.total)} ≠ rincian ${U.rp(m.expected)} (selisih ${U.rp(m.diff)}). Periksa qty, harga, diskon & pajak.`);
    const open = S.spendOpenIssues(sp).filter((x) => x !== 'math');
    need(!open.length, 'CONFIRM_REQUIRED', 'Masih ada data yang perlu dikonfirmasi: ' + open.join(', '));
    need(f.pay && PAY[f.pay], 'VALIDATION', 'Status pembayaran wajib dipilih');
    sp.flow = PAY[f.pay].flow;
    const dup = S.spendDuplicates(s, sp);
    need(!dup.length, 'DUPLICATE', `Kemungkinan duplikat: ${dup.map((d) => `${d.id} (${d.reasons.join(', ')})`).join('; ')}`);
    need(sp.cls && (sp.flow === 'PO' || sp.cls.p), 'VALIDATION', 'Kategori 7P wajib (rekomendasi AI dapat dipakai)');
    if (sp.flow === 'PAID') need(f.payDate, 'VALIDATION', 'Tanggal bayar wajib untuk pengeluaran yang sudah dibayar');
    if (sp.flow === 'UNPAID') need(f.due, 'VALIDATION', 'Tanggal jatuh tempo tagihan wajib');
    if (sp.flow === 'REIMBURSE') need(f.payer, 'VALIDATION', 'Karyawan yang membayar wajib');
    if (sp.cls.type === 'INVENTORY') need(sp.lines.every((l) => l.sku) || sp.flow === 'PO', 'VALIDATION', 'Pembelian persediaan wajib memakai SKU master untuk setiap baris');
    if (sp.emergency) {
      need(sp.emergency.reason && sp.emergency.reason.length >= 10, 'VALIDATION', 'Alasan darurat minimal 10 karakter');
      const rule = s.approvalRules.find((r) => r.doc === 'EMERGENCY_PO');
      need(m.total <= rule.max, 'LIMIT', `Melebihi batas pembelian darurat ${U.rp(rule.max)} (${rule.id}, DEMO) — gunakan PO standar`);
      sp.emergency.rule = rule.id;
    }
    if (sp.flow === 'PO') {
      const po = s.pos.find((x) => x.id === f.po);
      need(po, 'VALIDATION', 'Nomor PO wajib & harus ada untuk faktur ber-PO');
      // hand over to the existing three-way-match pipeline (no second invoice engine)
      const did = U.nextId(s, 'DC');
      const sub = U.sum(sp.lines, (l) => l.qty * l.price - (l.disc || 0)) - r0(f.disc);
      const d = { id: did, ts: ctx.now, file: (S.evidence(s, sp.evidence) || {}).file || 'tanpa_foto', title: 'Smart Spend ' + sp.id, status: 'EXTRACTED', source: sp.source, spend: sp.id, evidence: sp.evidence,
        fields: { supplierText: String(f.supplier).toUpperCase(), invoiceNo: f.receiptNo, invoiceDate: f.date, poText: po.id, subtotal: sub, tax: r0(f.tax), total: m.total },
        lines: sp.lines.map((l) => ({ desc: l.desc, item: l.sku, qty: l.qty, price: l.price })), confidence: { supplierText: 1, invoiceNo: 1, invoiceDate: 1, poText: 1, total: 1 }, history: [] };
      hist(d, ctx, 'FROM_SMART_SPEND', `Data dikonfirmasi pengaju di ${sp.id}`);
      s.docs.unshift(d);
      sp.doc = did;
    }
    sp.steps = S.spendRoute(s, sp).map((x, i) => ({ ...x, status: i === 0 ? 'DONE' : 'PENDING', by: i === 0 ? ctx.user.id : null, ts: i === 0 ? ctx.now : null }));
    sp.budgetAtSubmit = S.spendBudget(s, sp);
    sp.status = sp.flow === 'PO' ? 'IN_MATCHING' : 'SUBMITTED';
    sp.submittedAt = ctx.now;
    hist(sp, ctx, 'SUBMIT', 'Pengaju mengonfirmasi data nota (bukan persetujuan, bukan pembayaran, bukan posting)' + (sp.emergency ? ' · DARURAT: ' + sp.emergency.reason : ''));
    log(s, ctx, 'spend.submit', sp.id, `${FLOW[sp.flow]} · ${U.rp(m.total)}${sp.doc ? ' → ' + sp.doc : ''}`);
    return sp;
  };

  const stepFor = (s, sp, ctx, keys) => {
    const st = S.spendNextStep(sp);
    need(st && keys.includes(st.key), 'STATE', 'Bukan tahap ini — tahap berikutnya: ' + (st ? st.label : 'tidak ada'));
    need(st.role === ctx.user.role, 'FORBIDDEN', `Tahap "${st.label}" hanya untuk ${st.role}`);
    need(ctx.user.id !== sp.createdBy, 'SOD', 'Pemisahan tugas: pengaju tidak boleh memproses pengeluarannya sendiri');
    if (st.role === 'SUPERVISOR') need(ctx.user.scope.includes(sp.branch), 'FORBIDDEN', 'Supervisor hanya untuk outletnya sendiri');
    if (['BU_MANAGER', 'HEAD_DIV'].includes(st.role)) need(ctx.user.scope.some((x) => x === S.buOf(s, sp.branch) || x === sp.branch), 'FORBIDDEN', 'Di luar cakupan unit Anda');
    return st;
  };
  const done = (st, ctx, note) => Object.assign(st, { status: 'DONE', by: ctx.user.id, ts: ctx.now, note: note || null });

  H['spend.approve'] = (s, p, ctx) => {
    const sp = get(s.spends || [], p.id, 'Pengeluaran');
    need(sp.status === 'SUBMITTED', 'STATE', 'Pengeluaran tidak menunggu persetujuan');
    const st = stepFor(s, sp, ctx, ['APPROVE', 'APPROVE2']);
    const d = p.decision || 'APPROVE';
    if (d !== 'APPROVE') need(p.note && p.note.trim().length >= 5, 'VALIDATION', 'Alasan wajib (min. 5 karakter)');
    if (d === 'REJECT') {
      sp.status = 'REJECTED';
      Object.assign(st, { status: 'REJECTED', by: ctx.user.id, ts: ctx.now, note: p.note });
    } else if (d === 'RETURN') {
      sp.status = 'RETURNED';
      sp.steps = [];
      sp.confirmed = sp.confirmed.filter((k) => k !== 'submitted');
    } else {
      done(st, ctx, p.note);
      const next = S.spendNextStep(sp);
      if (!next || !['APPROVE', 'APPROVE2'].includes(next.key)) sp.status = 'APPROVED';
    }
    hist(sp, ctx, d === 'APPROVE' ? (st.post ? 'POST_APPROVE' : 'APPROVE') : d, p.note || null);
    log(s, ctx, 'spend.approve', sp.id, d + (p.note ? ' — ' + p.note : ''));
    return sp;
  };

  H['spend.receive'] = (s, p, ctx) => {
    const sp = get(s.spends || [], p.id, 'Pengeluaran');
    need(sp.status === 'APPROVED', 'STATE', 'Barang dikonfirmasi setelah pengeluaran disetujui');
    const st = stepFor(s, sp, ctx, ['GOODS']);
    const wh = S.whOfOrg(s, sp.branch);
    need(wh, 'VALIDATION', 'Outlet tidak punya gudang');
    const qty = p.qty || sp.lines.map((l) => l.qty);
    sp.lines.forEach((l, i) => need(+qty[i] === l.qty, 'MISMATCH', `Qty fisik ${l.desc} (${qty[i]}) ≠ nota (${l.qty}) — kembalikan ke pengaju atau koreksi lewat Finance`));
    sp.lines.forEach((l) => {
      stockRow(s, wh.id, l.sku).onHand += l.qty;
      ledger(s, ctx, { type: 'RECEIPT', wh: wh.id, item: l.sku, qty: l.qty, ref: sp.id, cc: sp.cc, note: 'Penerimaan Smart Spend (tanpa PO)' });
    });
    done(st, ctx, p.note || `Diterima di ${wh.name}`);
    sp.status = 'GOODS_CONFIRMED';
    sp.goodsWh = wh.id;
    hist(sp, ctx, 'GOODS_CONFIRMED', `${U.sum(sp.lines, (l) => l.qty)} unit masuk ${wh.name}`);
    log(s, ctx, 'spend.receive', sp.id, wh.id);
    return sp;
  };

  H['spend.verify'] = (s, p, ctx) => {
    const sp = get(s.spends || [], p.id, 'Pengeluaran');
    need(['APPROVED', 'GOODS_CONFIRMED'].includes(sp.status), 'STATE', 'Belum siap diverifikasi Finance');
    const st = stepFor(s, sp, ctx, ['VERIFY']);
    if (p.decision === 'REJECT' || p.decision === 'RETURN') {
      need(p.note && p.note.length >= 5, 'VALIDATION', 'Alasan wajib');
      need(sp.status !== 'GOODS_CONFIRMED' || p.decision === 'REJECT', 'STATE', 'Barang sudah masuk gudang — tolak lewat retur, bukan kembalikan');
      sp.status = p.decision === 'REJECT' ? 'REJECTED' : 'RETURNED';
      if (p.decision === 'RETURN') sp.steps = [];
      else Object.assign(st, { status: 'REJECTED', by: ctx.user.id, ts: ctx.now, note: p.note });
      hist(sp, ctx, 'FINANCE_' + p.decision, p.note);
      log(s, ctx, 'spend.verify', sp.id, p.decision);
      return sp;
    }
    if (p.cls) {
      const c = p.cls;
      if (c.p) need(SPEND_P.includes(c.p), 'VALIDATION', 'Kategori 7P tidak valid');
      if (c.type) {
        need(Object.keys(CLS).includes(c.type) && c.type !== 'OTHER', 'VALIDATION', 'Jenis tidak valid');
        need(!(c.type === 'INVENTORY' && sp.cls.type !== 'INVENTORY'), 'STATE', 'Ubah ke persediaan butuh konfirmasi gudang — kembalikan ke pengaju');
        need(!(sp.cls.type === 'INVENTORY' && c.type !== 'INVENTORY'), 'STATE', 'Barang sudah masuk stok — tidak dapat diubah menjadi beban');
      }
      ['p', 'type'].forEach((k) => c[k] && c[k] !== sp.cls[k] && (sp.corrections.push({ field: 'cls.' + k, ai: sp.cls[k], value: c[k], by: ctx.user.id, ts: ctx.now, finance: true }), (sp.cls[k] = c[k])));
    }
    need(sp.cls.type !== 'OTHER', 'VALIDATION', 'Finance wajib menetapkan perlakuan akuntansi (OPEX / CAPEX / Persediaan)');
    const m = S.spendMath(sp);
    const net = m.total - r0(sp.fields.tax);
    const dr = sp.cls.type === 'INVENTORY' ? '1140 Persediaan BHP' : sp.cls.type === 'CAPEX' ? '1590 Aset Dalam Penyelesaian' : EXP_ACC[sp.cls.p];
    const lines = [{ acc: dr, cc: sp.cc, dr: net, cr: 0 }];
    if (r0(sp.fields.tax)) lines.push({ acc: '1150 PPN Masukan', cc: sp.cc, dr: r0(sp.fields.tax), cr: 0 });
    lines.push({ acc: CR_ACC[sp.flow], cc: sp.cc, dr: 0, cr: m.total });
    sp.journal = journal(s, ctx, sp.id, sp.flow === 'PAID' ? 'SPEND_MONEY' : sp.flow === 'REIMBURSE' ? 'REIMBURSEMENT' : 'SUPPLIER_BILL', lines, `${FLOW[sp.flow]} ${sp.fields.supplier} ${sp.fields.receiptNo || ''}`.trim());
    done(st, ctx, p.note || 'Klasifikasi & perlakuan akuntansi sesuai');
    sp.status = 'VERIFIED';
    sp.verifiedAt = ctx.now;
    hist(sp, ctx, 'FINANCE_VERIFY', `${CLS[sp.cls.type]} · ${sp.cls.p} · jurnal ${sp.journal} (PENDING_REVIEW)`);
    log(s, ctx, 'spend.verify', sp.id, sp.journal);
    return sp;
  };

  H['spend.settle'] = (s, p, ctx) => {
    const sp = get(s.spends || [], p.id, 'Pengeluaran');
    need(sp.status === 'VERIFIED', 'STATE', 'Pembayaran dicatat setelah verifikasi Finance');
    const st = stepFor(s, sp, ctx, ['SETTLE']);
    need(p.confirm === true, 'CONFIRM', 'Pencatatan pembayaran butuh konfirmasi eksplisit');
    const ev = S.evidence(s, sp.evidence);
    const paidTwin = (s.spends || []).find((o) => o.id !== sp.id && o.status === 'SETTLED' && ((ev && o.evidence && (S.evidence(s, o.evidence) || {}).fingerprint === ev.fingerprint) || (o.fields.receiptNo && o.fields.receiptNo === sp.fields.receiptNo && o.fields.supplier === sp.fields.supplier)));
    need(!paidTwin, 'DUPLICATE', 'Nota ini sudah dibayar/direimburse lewat ' + (paidTwin && paidTwin.id));
    const amt = S.spendMath(sp).total;
    sp.settleJournal = journal(s, ctx, sp.id, 'PAYMENT', [{ acc: CR_ACC[sp.flow], cc: sp.cc, dr: amt, cr: 0 }, { acc: SETTLE_ACC[sp.flow], cc: sp.cc, dr: 0, cr: amt }], (sp.flow === 'PAID' ? 'Rekonsiliasi kas kecil ' : sp.flow === 'REIMBURSE' ? 'Reimburse ke ' + S.userName(s, sp.fields.payer) + ' ' : 'Bayar tagihan ') + sp.id);
    const pid = 'PY-2611-' + String(s.payments.length + 1).padStart(4, '0');
    s.payments.unshift({ id: pid, spend: sp.id, amount: amt, date: s.meta.demoDate, method: (sp.flow === 'PAID' ? 'Rekonsiliasi kas kecil' : 'Transfer bank') + ' (SIMULASI — tidak ada dana keluar)', status: 'PAID', by: ctx.user.id });
    done(st, ctx, pid);
    sp.status = 'SETTLED';
    sp.payment = pid;
    hist(sp, ctx, 'SETTLE', pid + ' · jurnal ' + sp.settleJournal);
    log(s, ctx, 'spend.settle', sp.id, pid);
    return sp;
  };

  H['spend.cancel'] = (s, p, ctx) => {
    const sp = get(s.spends || [], p.id, 'Pengeluaran');
    need(editable(sp), 'STATE', 'Hanya draft / dikembalikan yang dapat dibatalkan');
    ownerOnly(sp, ctx);
    sp.status = 'CANCELLED';
    hist(sp, ctx, 'CANCEL', p.note || null);
    log(s, ctx, 'spend.cancel', sp.id, 'Batal');
    return sp;
  };

  /* PO flow: spend status follows the existing doc/bill pipeline */
  S.spendStatus = (s, sp) => {
    if (sp.flow !== 'PO' || !sp.doc) return sp.status;
    const a = S.spendAccounting(s, sp);
    if (a.bill) return a.bill.status === 'PAID' ? 'SETTLED' : a.bill.status === 'APPROVED' ? 'VERIFIED' : 'IN_AP';
    if (a.doc) return a.doc.status === 'REJECTED' ? 'REJECTED' : a.doc.status === 'MISMATCH' ? 'MISMATCH' : 'IN_MATCHING';
    return sp.status;
  };
})(typeof window !== 'undefined' ? window : globalThis);
