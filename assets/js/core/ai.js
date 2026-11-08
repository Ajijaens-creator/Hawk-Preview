/* HAWK AI Intelligence — DETERMINISTIC SIMULATION.
   No AI model, OCR service or live data connection is active in this prototype.
   Every insight is computed by fixed rules from the shared DEMO state so that it reacts logically to user actions.
   Statement kinds distinguish: FACT (verified record), METRIC (calculated), FORECAST (estimate),
   HYPOTHESIS (AI interpretation), RECOMMENDATION (requires human approval — AI never executes). */
(function (root) {
  'use strict';
  const HAWK = (root.HAWK = root.HAWK || {});
  const U = HAWK.U;

  const KIND = {
    FACT: { label: 'Fakta terverifikasi', cls: 'k-fact' },
    METRIC: { label: 'Metrik terhitung', cls: 'k-metric' },
    FORECAST: { label: 'Estimasi / forecast', cls: 'k-forecast' },
    HYPOTHESIS: { label: 'Hipotesis AI', cls: 'k-hypo' },
    RECOMMENDATION: { label: 'Rekomendasi — perlu persetujuan manusia', cls: 'k-rec' },
  };

  function insights(s) {
    const S = HAWK.selectors;
    const out = [];
    const asOf = s.meta.demoDate;
    const add = (o) => out.push({ asOf, ...o, state: s.insightState[o.id] || { status: 'OPEN' } });

    /* 1. Item budget utilization (Workflow 03 → AI) */
    s.itemBudgets.forEach((b) => {
      const v = S.itemBudget(s, b.branch, b.item);
      const ratio = (v.actualQty + v.commitQty) / v.qty;
      const projected = (v.actualQty + v.commitQty + v.pendingQty) / v.qty;
      if (ratio < 0.85 && projected <= 1) return;
      const it = S.item(s, b.item);
      const mrfs = s.mrfs.filter((m) => m.branch === b.branch && m.lines.some((l) => l.item === b.item) && m.date.slice(0, 7) === s.meta.period);
      const latest = mrfs[0];
      const trace = latest ? S.trace(s, latest.id) : [];
      const daysLeft = 30 - +asOf.slice(8, 10);
      const runRate = v.actualQty / +asOf.slice(8, 10);
      const eom = Math.round(v.actualQty + v.commitQty + runRate * daysLeft * 0.6);
      add({
        id: `AI-BGT-${b.branch}-${b.item}`, area: 'Budget 7P', p: it.p, severity: projected > 1 ? 'HIGH' : 'MEDIUM', module: 'D',
        title: `${it.name} ${S.orgName(s, b.branch)} mencapai ${U.pct(ratio)} budget ${U.BULAN[10]}`,
        finding: `Pemakaian + komitmen ${it.name} di ${S.orgName(s, b.branch)} = ${v.actualQty + v.commitQty} dari ${v.qty} ${it.unit} budget bulan ini${v.pendingQty ? `; ${v.pendingQty} ${it.unit} lagi menunggu approval` : ''}.`,
        statements: [
          { kind: 'FACT', text: `Budget item ${U.BULAN[10]} 2026: ${v.qty} ${it.unit} (${U.rp(v.value)}), sudah terpakai ${v.actualQty} ${it.unit}.` },
          { kind: 'METRIC', text: `Utilisasi (aktual + komitmen) = ${U.pct(ratio)}; sisa ${Math.max(0, v.qty - v.actualQty - v.commitQty)} ${it.unit}.` },
          { kind: 'FORECAST', text: `Estimasi akhir bulan ±${eom} ${it.unit} (${U.pct(eom / v.qty)}) bila laju pemakaian berlanjut.` },
          { kind: 'HYPOTHESIS', text: it.id === 'BHP-001' ? 'Kenaikan kemungkinan terkait volume treatment pijat akhir pekan & paket promo November — perlu konfirmasi supervisor.' : 'Lonjakan kemungkinan terkait event/paket khusus — perlu konfirmasi supervisor.' },
          { kind: 'RECOMMENDATION', text: eom > v.qty ? `Ajukan revisi budget item (+${eom - v.qty} ${it.unit}) atau tunda permintaan non-mendesak.` : 'Pantau pemakaian harian; tidak perlu revisi budget saat ini.' },
        ],
        evidence: [
          { label: 'Budget item bulanan', value: `${v.qty} ${it.unit} · ${U.rp(v.value)}`, nav: { nv: 30, q: b.branch } },
          { label: 'Aktual terpakai', value: `${v.actualQty} ${it.unit}`, nav: { nv: 40, q: b.item } },
          { label: 'Komitmen MRF disetujui', value: `${v.commitQty} ${it.unit}` },
          ...mrfs.slice(0, 3).map((m) => ({ label: 'MRF', value: `${m.id} · ${m.status}`, ref: m.id })),
          ...trace.filter((x) => /^(PO|GR|BL)/.test(x)).map((x) => ({ label: 'Jejak transaksi', value: x, ref: x })),
        ],
        source: 'Budget item bulanan (NV-17), Stock ledger (NV-40), MRF (NV-27)', impact: `Potensi kelebihan ${U.rp(Math.max(0, eom - v.qty) * it.price)}`,
        owner: 'SUPERVISOR', workflow: 'Supervisor tinjau → (opsional) ajukan revisi budget NV-22 → BU Manager setujui',
      });
    });

    /* 2. Low stock prediction */
    s.stock.forEach((r) => {
      const avail = r.onHand - r.reserved;
      if (r.min <= 0 || avail >= r.min) return;
      const it = S.item(s, r.item);
      const daily = Math.max(0.5, r.min / 10);
      const days = Math.max(0, Math.floor(avail / daily));
      add({
        id: `AI-STK-${r.wh}-${r.item}`, area: 'Inventory', p: it.p, severity: avail <= 0 ? 'HIGH' : 'MEDIUM', module: 'G',
        title: `Stok ${it.name} di ${S.whName(s, r.wh)} di bawah minimum`,
        finding: `Tersedia ${avail} ${it.unit} (fisik ${r.onHand}, reservasi ${r.reserved}) vs minimum ${r.min}.`,
        statements: [
          { kind: 'FACT', text: `Saldo fisik ${r.onHand} ${it.unit}, direservasi ${r.reserved} ${it.unit}.` },
          { kind: 'FORECAST', text: `Perkiraan habis dalam ±${days} hari (asumsi pemakaian ${U.num(daily, 1)} ${it.unit}/hari).` },
          { kind: 'RECOMMENDATION', text: `Ajukan replenishment ${r.max - avail} ${it.unit} (sampai stok maksimum) melalui MRF / transfer antar gudang.` },
        ],
        evidence: [{ label: 'Saldo stok', value: `${r.onHand}/${r.min}/${r.max} (fisik/min/max)`, nav: { nv: 40, q: r.item } }, { label: 'Lokasi bin', value: r.bin || '—' }],
        source: 'Stock balance (NV-40)', impact: avail <= 0 ? 'Risiko layanan terhenti' : 'Risiko kekurangan stok', owner: 'WAREHOUSE', workflow: 'Gudang tinjau → buat transfer (NV-44) atau MRF replenishment',
      });
    });

    /* 3. Duplicate invoice warning */
    s.docs.forEach((d) => {
      const dup = d.match && d.match.checks.find((c) => c.key === 'dup' && !c.ok);
      if (!dup) return;
      add({
        id: `AI-DUP-${d.id}`, area: 'Finance', severity: 'HIGH', module: 'H', title: `Peringatan faktur duplikat: ${d.fields.invoiceNo}`,
        finding: dup.detail,
        statements: [
          { kind: 'FACT', text: `Nomor faktur ${d.fields.invoiceNo} sudah tercatat. ${dup.detail}.` },
          { kind: 'RECOMMENDATION', text: 'Tolak dokumen dan konfirmasi ke supplier. AI tidak menyetujui atau menolak otomatis.' },
        ],
        evidence: [{ label: 'Dokumen tangkapan', value: d.id, ref: d.id }],
        source: 'AI Invoice Capture (NV-48) + AP (NV-50)', impact: U.rp(d.fields.total) + ' potensi pembayaran ganda', owner: 'FINANCE', workflow: 'Finance verifikasi → tolak dokumen di NV-49',
      });
    });

    /* 4. Supplier price fluctuation */
    s.priceHistory.forEach((h) => {
      const first = h.points[0][1];
      const last = h.points[h.points.length - 1][1];
      const chg = (last - first) / first;
      if (chg < 0.05) return;
      const it = S.item(s, h.item);
      const alt = s.quotations.filter((q) => q.item === h.item && q.supplier !== h.supplier).sort((a, b) => a.price - b.price)[0];
      add({
        id: `AI-PRC-${h.item}`, area: 'Purchasing', p: it.p, severity: 'MEDIUM', module: 'F', title: `Harga ${it.name} naik ${U.pct(chg, 1)} dalam 6 bulan`,
        finding: `${S.supplierName(s, h.supplier)}: ${U.rp(first)} → ${U.rp(last)}.`,
        statements: [
          { kind: 'FACT', text: `Riwayat harga PO ${h.points.map((p) => `${p[0].slice(5)}: ${U.num(p[1] / 1000)}rb`).join(' · ')}.` },
          { kind: 'METRIC', text: `Kenaikan ${U.pct(chg, 1)}.` },
          alt ? { kind: 'RECOMMENDATION', text: `Pertimbangkan penawaran ${S.supplierName(s, alt.supplier)} ${U.rp(alt.price)} (lead time ${alt.leadDays} hari, MOQ ${alt.moq}). Keputusan tetap di Purchasing.` } : null,
        ].filter(Boolean),
        evidence: [{ label: 'Perbandingan penawaran', value: 'NV-34', nav: { nv: 34, q: h.item } }],
        source: 'Riwayat harga PO & quotation (NV-34)', impact: `±${U.rp((last - first) * 40 * 4)} / bulan (4 cabang, asumsi 40 unit)`, owner: 'PURCHASING', workflow: 'Purchasing negosiasi / RFQ → BU Manager setujui supplier baru',
      });
    });

    /* 5. Purchasing consolidation suggestion */
    const pend = S.pendingPurchase(s);
    const bySup = {};
    pend.forEach((p) => (bySup[p.supplier] = bySup[p.supplier] || []).push(p));
    Object.entries(bySup).forEach(([sup, rows]) => {
      if (U.uniq(rows.map((r) => r.mrf)).length < 2) return;
      add({
        id: `AI-CON-${sup}`, area: 'Purchasing', severity: 'LOW', module: 'F', title: `${rows.length} kebutuhan dari ${U.uniq(rows.map((r) => r.mrf)).length} MRF bisa dikonsolidasi ke ${S.supplierName(s, sup)}`,
        finding: rows.map((r) => `${r.mrf}: ${r.qty} ${S.item(s, r.item).unit} ${S.itemName(s, r.item)} → ${S.whName(s, r.wh)}`).join('; '),
        statements: [
          { kind: 'FACT', text: `Semua kebutuhan sudah disetujui dan belum memiliki PO.` },
          { kind: 'RECOMMENDATION', text: 'Gabungkan per lokasi kirim untuk menekan ongkos kirim; buat PO melalui NV-32.' },
        ],
        evidence: rows.map((r) => ({ label: 'MRF', value: r.mrf, ref: r.mrf })),
        source: 'Konsolidasi MRF (NV-32)', impact: 'Hemat ongkos kirim & waktu proses', owner: 'PURCHASING', workflow: 'Purchasing buat PO → approval sesuai matriks',
      });
    });

    /* 6. Preventive maintenance */
    s.assets.forEach((a) => {
      if (a.status !== 'ACTIVE') return;
      const due = new Date(Date.parse(a.lastService) + a.serviceIntervalDays * 864e5).toISOString().slice(0, 10);
      if (due > '2026-11-30') return;
      add({
        id: `AI-AST-${a.id}`, area: 'Asset', p: 'FACILITY', severity: due < asOf ? 'MEDIUM' : 'LOW', module: 'I', title: `Servis preventif ${a.name} ${due < asOf ? 'terlambat' : 'jatuh tempo'} (${U.date(due)})`,
        finding: `Servis terakhir ${U.date(a.lastService)}, interval ${a.serviceIntervalDays} hari. Kondisi: ${a.condition}.`,
        statements: [
          { kind: 'FACT', text: `Servis terakhir ${U.date(a.lastService)}.` },
          { kind: 'HYPOTHESIS', text: a.condition !== 'Baik' ? 'Kondisi menurun dapat terkait servis tertunda.' : 'Servis tepat waktu menurunkan risiko kerusakan mendadak.' },
          { kind: 'RECOMMENDATION', text: 'Jadwalkan work order preventif.' },
        ],
        evidence: [{ label: 'Aset', value: a.id, ref: a.id }],
        source: 'Asset register (NV-53/54)', impact: 'Mengurangi downtime ruang treatment', owner: 'ASSET', workflow: 'Asset PIC buat MR/WO (NV-55)',
      });
    });

    /* 7. Finance exceptions: GRNI not invoiced, mismatched docs */
    s.grns.filter((g) => g.status !== 'RECEIVED' && !s.bills.some((b) => b.po === g.po)).forEach((g) => {
      const po = s.pos.find((p) => p.id === g.po);
      const v = U.sum(g.lines, (l) => l.accepted * (po.lines.find((x) => x.item === l.item) || {}).price);
      add({
        id: `AI-GRNI-${g.id}`, area: 'Finance', severity: 'LOW', module: 'H', title: `Barang diterima belum ditagih: ${g.id}`,
        finding: `${po.id} (${S.supplierName(s, po.supplier)}) senilai ${U.rp(v)} tercatat di GRNI.`,
        statements: [
          { kind: 'FACT', text: `GRN ${g.id} diposting ${U.datetime(g.date)}; belum ada faktur yang diverifikasi.` },
          { kind: 'RECOMMENDATION', text: 'Minta faktur ke supplier atau tangkap dokumen di NV-48.' },
        ],
        evidence: [{ label: 'GRN', value: g.id, ref: g.id }, { label: 'PO', value: po.id, ref: po.id }],
        source: 'Goods receipt (NV-42) & AP (NV-50)', impact: 'Akrual utang belum lengkap', owner: 'FINANCE', workflow: 'Finance follow-up supplier',
      });
    });
    s.docs.filter((d) => d.status === 'MISMATCH').forEach((d) => {
      const bad = d.match.checks.filter((c) => !c.ok && c.key !== 'dup');
      if (!bad.length) return;
      add({
        id: `AI-MIS-${d.id}`, area: 'Finance', severity: 'MEDIUM', module: 'H', title: `Selisih three-way match ${d.fields.invoiceNo}`,
        finding: bad.map((c) => `${c.label}: ${c.detail}`).join(' · '),
        statements: [
          { kind: 'FACT', text: bad.map((c) => c.detail).join('; ') },
          { kind: 'HYPOTHESIS', text: 'Selisih harga dapat berasal dari price list supplier yang belum diperbarui di PO.' },
          { kind: 'RECOMMENDATION', text: 'Konfirmasi ke supplier; verifikator wajib menulis penjelasan sebelum AP draft.' },
        ],
        evidence: [{ label: 'Dokumen', value: d.id, ref: d.id }],
        source: 'Three-way matching (NV-49)', impact: U.rp(d.fields.total), owner: 'FINANCE', workflow: 'Finance verifikasi manual',
      });
    });

    /* 8. 7P budget variance */
    ['BGT-2026-SPA', 'BGT-2026-ESS'].forEach((bid) => {
      const b = S.budgetView(s, bid);
      const me = S.monthsElapsed(s);
      b.lines.filter((l) => l.cls === 'OPEX').forEach((l) => {
        const expected = me / 12;
        const ratio = l.actual / l.revised;
        if (ratio - expected < 0.03) return;
        const p = s.sevenP.find((x) => x.key === l.p);
        add({
          id: `AI-VAR-${bid}-${l.p}`, area: 'Budget 7P', p: l.p, severity: l.forecast > l.revised ? 'HIGH' : 'MEDIUM', module: 'D',
          title: `${p.name} ${S.orgName(s, b.bu)}: realisasi ${U.pct(ratio)} vs waktu berjalan ${U.pct(expected)}`,
          finding: `Aktual ${U.rp(l.actual, { short: true })}, komitmen ${U.rp(l.commitment, { short: true })}, forecast ${U.rp(l.forecast, { short: true })} vs revised ${U.rp(l.revised, { short: true })}.`,
          statements: [
            { kind: 'METRIC', text: `Realisasi ${U.pct(ratio)} saat ${U.pct(expected)} tahun berjalan.` },
            { kind: 'FORECAST', text: `Forecast akhir tahun ${U.rp(l.forecast, { short: true })} (${l.forecast > l.revised ? 'melebihi' : 'di bawah'} budget revised).` },
            { kind: 'RECOMMENDATION', text: l.forecast > l.revised ? 'Siapkan reforecast Q4 / realokasi antar-P (NV-22).' : 'Tidak perlu tindakan; pantau.' },
          ],
          evidence: [{ label: 'Budget vs Actual', value: bid, nav: { nv: 23, q: bid } }],
          source: 'Budget 7P (NV-23)', impact: U.rp(Math.max(0, l.forecast - l.revised), { short: true }) + ' potensi overrun', owner: 'BU_MANAGER', workflow: 'BU Manager → Owner (revisi)',
        });
      });
    });

    /* 9. 7P productivity (revenue per spend) */
    const spa = S.budgetView(s, 'BGT-2026-SPA');
    const rev = s.actualRevenue['BU-SPA'];
    const prod = spa.lines.find((l) => l.p === 'PRODUCT' && l.cls === 'OPEX');
    add({
      id: 'AI-PRD-SPA', area: '7P Analytics', p: 'PRODUCT', severity: 'LOW', module: 'J', title: 'Produktivitas biaya Product JAENS Spa',
      finding: `Setiap Rp 1 belanja Product menghasilkan Rp ${U.num(rev / prod.actual, 1)} revenue YTD; driver biaya BHP/treatment ${U.rp(22400)} vs target ${U.rp(21000)}.`,
      statements: [
        { kind: 'METRIC', text: `Revenue YTD ${U.rp(rev, { short: true })} ÷ aktual Product ${U.rp(prod.actual, { short: true })} = ${U.num(rev / prod.actual, 1)}x.` },
        { kind: 'HYPOTHESIS', text: 'Biaya BHP per treatment di atas target kemungkinan dipicu kenaikan harga minyak pijat (+9%).' },
        { kind: 'RECOMMENDATION', text: 'Standarkan takaran minyak per treatment & negosiasi harga tahunan.' },
      ],
      evidence: [{ label: '7P Analytics', value: 'NV-59', nav: { nv: 59 } }, { label: 'Harga supplier', value: 'NV-34', nav: { nv: 34, q: 'BHP-001' } }],
      source: 'Budget 7P + driver KPI (NV-11) — revenue DEMO', impact: 'Efisiensi margin', owner: 'BU_MANAGER', workflow: 'BU Manager tetapkan SOP',
    });

    const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
  }

  /* Scenario forecast — NV-60. Pure arithmetic on DEMO run-rate. ESTIMATE ONLY. */
  function scenario(s, d) {
    const months = ['Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov'];
    const season = [0.1, 0.07, 0.065, 0.075, 0.08, 0.08, 0.085, 0.1, 0.1, 0.085, 0.08, 0.08];
    const S = HAWK.selectors;
    const baseRev = (s.actualRevenue['BU-SPA'] + s.actualRevenue['BU-ESS']) / 10 * 12;
    const b1 = S.budgetView(s, 'BGT-2026-SPA');
    const b2 = S.budgetView(s, 'BGT-2026-ESS');
    const costRatio = (b1.totals.forecast + b2.totals.forecast) / (s.targets[0].revenue + s.targets[1].revenue);
    const growth = 1 + (d.guests || 0) / 100;
    const price = 1 + (d.price || 0) / 100;
    const cost = 1 + (d.cost || 0) / 100;
    const branches = d.branches || 0;
    let cumR = 0;
    let cumP = 0;
    const rows = months.map((m, i) => {
      const ramp = branches ? Math.min(1, Math.max(0, (i - 3) / 6)) : 0;
      const r = baseRev * season[i] * growth * price * (1 + branches * 0.18 * ramp);
      const c = r * costRatio * cost / price + (branches ? branches * 35000000 : 0);
      cumR += r;
      cumP += r - c;
      return { m, revenue: r, cost: c, profit: r - c };
    });
    return { rows, revenue: cumR, profit: cumP, margin: cumP / cumR, capex: branches * 2500000000 };
  }

  HAWK.AI = { insights, scenario, KIND };
})(typeof window !== 'undefined' ? window : globalThis);
