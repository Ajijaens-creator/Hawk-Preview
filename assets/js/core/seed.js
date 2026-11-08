/* HAWK × JAENS Prototype — DEMO seed data.
   ALL NUMBERS ARE DEMO / SIMULATION. No real JAENS financial data, no real people, no credentials. */
(function (root) {
  'use strict';
  const HAWK = (root.HAWK = root.HAWK || {});

  const SEVEN_P = [
    { key: 'PEOPLE', name: 'People', label: 'People (SDM)', color: '#0F9D8A' },
    { key: 'PRODUCT', name: 'Product', label: 'Product (Produk & BHP)', color: '#2F6FDE' },
    { key: 'PROMOTION', name: 'Promotion', label: 'Promotion (Promosi)', color: '#8B5CF6' },
    { key: 'PROCESS', name: 'Process', label: 'Process (Proses & Sistem)', color: '#06B6D4' },
    { key: 'PLACE', name: 'Place', label: 'Place (Tempat & Kebersihan)', color: '#F08A24' },
    { key: 'FACILITY', name: 'Facility', label: 'Facility (Fasilitas & Aset)', color: '#64748B' },
    { key: 'PROFIT', name: 'Profit', label: 'Profit (Hasil — bukan belanja)', color: '#22A355', outcome: true },
  ];

  // Seasonality weights for monthly distribution (sum = 1.0) — DEMO assumption
  const SEASON = [0.07, 0.065, 0.075, 0.08, 0.08, 0.085, 0.1, 0.1, 0.085, 0.08, 0.08, 0.1];

  // Fund type → aggregated budget class. Inventory is OPEX-type use of funds (expensed at consumption), Profit is OUTCOME.
  const KIND_CLS = { OPEX: 'OPEX', INVENTORY: 'OPEX', CAPEX: 'CAPEX', WORKING_CAPITAL: 'OTHER', DEPOSIT: 'OTHER', FIN_INVESTMENT: 'OTHER', PERFORMANCE: 'OUTCOME' };
  function planToLines(plan) {
    const order = ['PEOPLE', 'PRODUCT', 'PROMOTION', 'PROCESS', 'PLACE', 'FACILITY', 'PROFIT'];
    const map = {};
    plan.forEach((l) => {
      const cls = KIND_CLS[l.kind] || 'OPEX';
      const k = l.p + '|' + cls;
      map[k] = map[k] || { p: l.p, cls, original: 0, revised: 0, baseActual: 0, baseCommit: 0 };
      map[k].original += l.original;
      map[k].revised += l.revised;
    });
    return Object.values(map).sort((a, b) => order.indexOf(a.p) - order.indexOf(b.p) || a.cls.localeCompare(b.cls));
  }

  function seed() {
    const s = {
      meta: { version: '0.9.0-demo', schema: 4, seq: {}, clock: 0, demoDate: '2026-11-08', period: '2026-11' },
      sevenP: SEVEN_P,
      season: SEASON,
    };

    /* ---------------- Organization (dynamic, editable in NV-05/06) ---------------- */
    s.org = [
      { id: 'GRP', type: 'GROUP', name: 'JAENS Enterprises (Grup)', parent: null, status: 'ACTIVE', scope: 'OUT', note: 'Target grup & valuasi di luar lingkup operasional Spa–Essence' },
      { id: 'BU-SPA', type: 'BU', code: 'SPA', name: 'JAENS Spa', parent: 'GRP', status: 'ACTIVE', scope: 'IN' },
      { id: 'BR-UBD', type: 'BRANCH', code: 'UBD', name: 'Spa Ubud', parent: 'BU-SPA', status: 'ACTIVE', scope: 'IN' },
      { id: 'BR-SHN', type: 'BRANCH', code: 'SHN', name: 'Spa Shanti', parent: 'BU-SPA', status: 'ACTIVE', scope: 'IN' },
      { id: 'BR-TRK', type: 'BRANCH', code: 'TRK', name: 'Spa Triloka', parent: 'BU-SPA', status: 'ACTIVE', scope: 'IN' },
      { id: 'BR-BSM', type: 'BRANCH', code: 'BSM', name: 'Spa Bisma', parent: 'BU-SPA', status: 'ACTIVE', scope: 'IN' },
      { id: 'BU-ESS', type: 'BU', code: 'ESS', name: 'JAENS Essence', parent: 'GRP', status: 'ACTIVE', scope: 'IN', note: 'Engine produksi/manufaktur independen bila ada' },
      { id: 'DV-ESS-PRD', type: 'DIVISION', code: 'PRD', name: 'Produksi Essence', parent: 'BU-ESS', status: 'ACTIVE', scope: 'IN' },
      { id: 'DV-ESS-SLS', type: 'DIVISION', code: 'SLS', name: 'Penjualan Essence', parent: 'BU-ESS', status: 'ACTIVE', scope: 'IN' },
      { id: 'BU-OFC', type: 'OFFICE', code: 'OFC', name: 'JAENS Office / HQ', parent: 'GRP', status: 'ACTIVE', scope: 'IN' },
      { id: 'DV-FIN', type: 'DIVISION', code: 'FIN', name: 'Finance & Accounting', parent: 'BU-OFC', status: 'ACTIVE', scope: 'IN' },
      { id: 'DV-KOM', type: 'DIVISION', code: 'KOM', name: 'Komersil', parent: 'BU-OFC', status: 'ACTIVE', scope: 'IN' },
      { id: 'DV-HRD', type: 'DIVISION', code: 'HRD', name: 'HG / HRD', parent: 'BU-OFC', status: 'ACTIVE', scope: 'IN' },
      { id: 'DV-PUR', type: 'DIVISION', code: 'PUR', name: 'Purchasing', parent: 'BU-OFC', status: 'ACTIVE', scope: 'IN' },
      { id: 'BU-OTH', type: 'BU', code: 'OTH', name: 'BU JAENS lainnya', parent: 'GRP', status: 'ACTIVE', scope: 'OUT', independent: true, note: 'Sistem operasional independen — hanya integrasi/konsolidasi yang diotorisasi' },
    ];

    s.costCenters = [
      { id: 'CC-UBD-OPS', name: 'Operasional Spa Ubud', org: 'BR-UBD' },
      { id: 'CC-SHN-OPS', name: 'Operasional Spa Shanti', org: 'BR-SHN' },
      { id: 'CC-TRK-OPS', name: 'Operasional Spa Triloka', org: 'BR-TRK' },
      { id: 'CC-BSM-OPS', name: 'Operasional Spa Bisma', org: 'BR-BSM' },
      { id: 'CC-ESS-PRD', name: 'Produksi Essence', org: 'DV-ESS-PRD' },
      { id: 'CC-ESS-SLS', name: 'Penjualan Essence', org: 'DV-ESS-SLS' },
      { id: 'CC-OFC-FIN', name: 'Finance HQ', org: 'DV-FIN', shared: true },
      { id: 'CC-OFC-KOM', name: 'Komersil HQ', org: 'DV-KOM', shared: true },
      { id: 'CC-OFC-HRD', name: 'HG / HRD HQ', org: 'DV-HRD', shared: true },
      { id: 'CC-OFC-PUR', name: 'Purchasing HQ', org: 'DV-PUR', shared: true },
    ];
    s.sharedAllocations = [
      { pool: 'CC-OFC-FIN', basis: 'Proporsi pendapatan', splits: { 'BU-SPA': 0.75, 'BU-ESS': 0.25 }, monthlyCost: 62000000 },
      { pool: 'CC-OFC-KOM', basis: 'Proporsi pendapatan', splits: { 'BU-SPA': 0.75, 'BU-ESS': 0.25 }, monthlyCost: 48000000 },
      { pool: 'CC-OFC-HRD', basis: 'Jumlah karyawan', splits: { 'BU-SPA': 0.82, 'BU-ESS': 0.18 }, monthlyCost: 41000000 },
      { pool: 'CC-OFC-PUR', basis: 'Jumlah PO', splits: { 'BU-SPA': 0.68, 'BU-ESS': 0.32 }, monthlyCost: 29000000 },
    ];

    /* ---------------- Roles & users (fictional) ---------------- */
    s.users = [
      { id: 'U-OWN', name: 'Gede Pratama', role: 'OWNER', title: 'Owner / Eksekutif', scope: ['BU-SPA', 'BU-ESS', 'BU-OFC'] },
      { id: 'U-BUM', name: 'Ayu Lestari', role: 'BU_MANAGER', title: 'BU Manager JAENS Spa', scope: ['BU-SPA'] },
      { id: 'U-HOD', name: 'Wayan Ardana', role: 'HEAD_DIV', title: 'Head of Division — Operasional Spa', scope: ['BU-SPA', 'DV-KOM'] },
      { id: 'U-SPV', name: 'Putu Sukma', role: 'SUPERVISOR', title: 'Supervisor Spa Shanti', scope: ['BR-SHN'] },
      { id: 'U-STF', name: 'Nyoman Dewi', role: 'STAFF', title: 'Therapist Spa Shanti', scope: ['BR-SHN'] },
      { id: 'U-PUR', name: 'Kadek Surya', role: 'PURCHASING', title: 'Purchasing HQ', scope: ['BU-SPA', 'BU-ESS', 'BU-OFC'] },
      { id: 'U-WHS', name: 'Made Arta', role: 'WAREHOUSE', title: 'Gudang & Receiving', scope: ['BU-SPA', 'BU-ESS', 'BU-OFC'] },
      { id: 'U-FIN', name: 'Luh Ratna', role: 'FINANCE', title: 'Finance & Accounting', scope: ['BU-SPA', 'BU-ESS', 'BU-OFC'] },
      { id: 'U-AST', name: 'Ketut Bagus', role: 'ASSET', title: 'Asset & Facility PIC', scope: ['BU-SPA', 'BU-ESS', 'BU-OFC'] },
      { id: 'U-ADM', name: 'Admin Sistem', role: 'ADMIN', title: 'System Administrator', scope: ['BU-SPA', 'BU-ESS', 'BU-OFC'] },
      { id: 'U-STF2', name: 'Komang Ayu', role: 'STAFF', title: 'Housekeeping Spa Ubud', scope: ['BR-UBD'] },
      { id: 'U-SPV2', name: 'Ni Luh Sari', role: 'SUPERVISOR', title: 'Supervisor Spa Ubud', scope: ['BR-UBD'] },
    ];

    /* ---------------- Approval matrix (configurable, NV-09) ---------------- */
    s.approvalRules = [
      // MRF tiers adopted from Visual Board B (NV-09 Matriks Approval — Material Request)
      { id: 'AR-01', doc: 'MRF', name: 'MRF ≤ Rp 1 jt', condition: 'Nilai estimasi ≤ Rp 1.000.000', min: 0, max: 1000000, chain: ['SUPERVISOR'], escalateTo: 'HEAD_DIV', slaHours: 24, active: true },
      { id: 'AR-02', doc: 'MRF', name: 'MRF Rp 1–5 jt', condition: 'Rp 1.000.001 – Rp 5.000.000', min: 1000000, max: 5000000, chain: ['SUPERVISOR', 'HEAD_DIV'], escalateTo: 'BU_MANAGER', slaHours: 24, active: true },
      { id: 'AR-03', doc: 'MRF', name: 'MRF Rp 5–25 jt', condition: 'Rp 5.000.001 – Rp 25.000.000', min: 5000000, max: 25000000, chain: ['SUPERVISOR', 'HEAD_DIV', 'BU_MANAGER'], escalateTo: 'OWNER', slaHours: 48, active: true },
      { id: 'AR-04', doc: 'MRF', name: 'MRF > Rp 25 jt', condition: '> Rp 25.000.000', min: 25000000, max: null, chain: ['SUPERVISOR', 'HEAD_DIV', 'BU_MANAGER', 'OWNER'], escalateTo: null, slaHours: 72, active: true },
      { id: 'AR-05', doc: 'MRF_EXCEPTION', name: 'MRF melebihi budget item / non-rutin', condition: 'Proyeksi > 100% budget item bulanan ATAU non-rutin → tambah BU Manager', min: 0, max: null, chain: ['BU_MANAGER'], escalateTo: 'OWNER', slaHours: 48, active: true },
      { id: 'AR-06', doc: 'PO', name: 'PO standar', condition: 'Total ≤ Rp 10 jt', min: 0, max: 10000000, chain: ['PURCHASING'], escalateTo: 'BU_MANAGER', slaHours: 24, active: true },
      { id: 'AR-07', doc: 'PO', name: 'PO besar', condition: 'Total > Rp 10 jt', min: 10000000, max: null, chain: ['PURCHASING', 'BU_MANAGER'], escalateTo: 'OWNER', slaHours: 48, active: true },
      { id: 'AR-08', doc: 'EMERGENCY_PO', name: 'Pembelian darurat', condition: 'Maks Rp 3 jt; approval susulan BU Manager ≤ 24 jam', min: 0, max: 3000000, chain: ['SUPERVISOR'], postApproval: 'BU_MANAGER', escalateTo: 'BU_MANAGER', slaHours: 24, active: true, policy: 'Batas DEMO. Referensi Modul B mengusulkan Rp1 jt/transaksi dan Rp3 jt/minggu per outlet — belum disetujui Owner (lihat DESIGN_CONFLICTS).' },
      { id: 'AR-09', doc: 'BUDGET', name: 'Budget tahunan BU', condition: 'Draft → Head Review (Head of Division / BU Manager) → Finance Review → Owner Review → Locked (Modul D)', min: 0, max: null, chain: ['HEAD_DIV', 'FINANCE', 'OWNER'], escalateTo: null, slaHours: 120, active: true },
      { id: 'AR-10', doc: 'BILL', name: 'Verifikasi tagihan (AP)', condition: 'Three-way match lolos / selisih dijelaskan', min: 0, max: null, chain: ['FINANCE'], escalateTo: 'BU_MANAGER', slaHours: 48, active: true },
      { id: 'AR-11', doc: 'PAYMENT', name: 'Otorisasi pembayaran', condition: 'Semua pembayaran — AI tidak pernah menyetujui', min: 0, max: null, chain: ['FINANCE'], escalateTo: 'OWNER', slaHours: 48, active: true },
      { id: 'AR-12', doc: 'INVESTMENT', name: 'Investasi / proyek strategis', condition: 'Semua proposal investasi', min: 0, max: null, chain: ['BU_MANAGER', 'OWNER'], escalateTo: null, slaHours: 168, active: true },
    ];

    /* ---------------- Targets (Module C) ---------------- */
    s.targets = [
      { id: 'TGT-2026-SPA', fy: 2026, bu: 'BU-SPA', revenue: 18000000000, profit: 3600000000, status: 'APPROVED', version: 1 },
      { id: 'TGT-2026-ESS', fy: 2026, bu: 'BU-ESS', revenue: 6000000000, profit: 900000000, status: 'APPROVED', version: 1 },
      { id: 'TGT-2027-SPA', fy: 2027, bu: 'BU-SPA', revenue: 20500000000, profit: 4300000000, status: 'DRAFT', version: 1 },
      { id: 'TGT-2027-ESS', fy: 2027, bu: 'BU-ESS', revenue: 7200000000, profit: 1150000000, status: 'DRAFT', version: 1 },
    ];
    s.actualRevenue = { 'BU-SPA': 14760000000, 'BU-ESS': 4620000000 }; // YTD Jan–Okt 2026 DEMO
    s.branchRevenue = { 'BR-UBD': 5310000000, 'BR-SHN': 3690000000, 'BR-TRK': 3240000000, 'BR-BSM': 2520000000 };
    s.drivers = [
      { bu: 'BU-SPA', id: 'D1', name: 'Jumlah tamu / bulan', unit: 'tamu', target: 6200, actual: 5870 },
      { bu: 'BU-SPA', id: 'D2', name: 'Rata-rata nilai transaksi', unit: 'Rp', target: 245000, actual: 251500 },
      { bu: 'BU-SPA', id: 'D3', name: 'Okupansi ruang treatment', unit: '%', target: 0.72, actual: 0.68 },
      { bu: 'BU-SPA', id: 'D4', name: 'Biaya BHP per treatment', unit: 'Rp', target: 21000, actual: 22400, lowerBetter: true },
      { bu: 'BU-SPA', id: 'D5', name: 'Produktivitas therapist (treatment/hari)', unit: 'x', target: 4.2, actual: 3.9 },
      { bu: 'BU-ESS', id: 'D6', name: 'Unit terjual / bulan', unit: 'unit', target: 9500, actual: 8800 },
      { bu: 'BU-ESS', id: 'D7', name: 'Margin kotor', unit: '%', target: 0.46, actual: 0.44 },
      { bu: 'BU-ESS', id: 'D8', name: 'Biaya bahan baku per unit', unit: 'Rp', target: 18500, actual: 19200, lowerBetter: true },
    ];
    s.projects = [
      { id: 'PRJ-2027-01', name: 'Renovasi 2 ruang couple treatment Spa Ubud', bu: 'BU-SPA', type: 'OPERATIONAL', capex: 850000000, opex: 40000000, status: 'PROPOSED', owner: 'U-BUM', payback: 26, irr: 0.21, milestones: [] },
      { id: 'PRJ-2027-02', name: 'Lini produk Essence: travel kit aromaterapi', bu: 'BU-ESS', type: 'INNOVATION', capex: 320000000, opex: 180000000, status: 'APPROVED', owner: 'U-OWN', payback: 18, irr: 0.28,
        milestones: [
          { name: 'Formulasi & uji stabilitas', due: '2026-12-15', progress: 0.6, status: 'ON_TRACK' },
          { name: 'Desain kemasan', due: '2027-01-31', progress: 0.25, status: 'ON_TRACK' },
          { name: 'Produksi batch perdana', due: '2027-03-15', progress: 0, status: 'NOT_STARTED' },
        ] },
      { id: 'PRJ-2026-05', name: 'Sistem booking online terintegrasi', bu: 'BU-SPA', type: 'INNOVATION', capex: 210000000, opex: 60000000, status: 'IN_PROGRESS', owner: 'U-BUM', payback: 14, irr: 0.34,
        milestones: [
          { name: 'Pemilihan vendor', due: '2026-08-30', progress: 1, status: 'DONE' },
          { name: 'Integrasi & uji', due: '2026-11-30', progress: 0.7, status: 'AT_RISK' },
          { name: 'Go-live 4 cabang', due: '2026-12-20', progress: 0, status: 'NOT_STARTED' },
        ] },
      { id: 'PRJ-2026-03', name: 'Penggantian AC hemat energi Spa Shanti', bu: 'BU-SPA', type: 'OPERATIONAL', capex: 145000000, opex: 0, status: 'COMPLETED', owner: 'U-AST', payback: 30, irr: 0.15,
        milestones: [{ name: 'Instalasi', due: '2026-06-30', progress: 1, status: 'DONE' }] },
    ];

    /* ---------------- 7P annual budgets (Module D) ---------------- */
    const mk = (p, cls, original, actualPct, commitPct) => ({ p, cls, original, revised: original, baseActual: Math.round(original * actualPct), baseCommit: Math.round(original * commitPct) });
    s.budgets = [
      { id: 'BGT-2026-SPA', fy: 2026, bu: 'BU-SPA', status: 'LOCKED', version: 2, approvedBy: 'U-OWN', lines: [
        mk('PEOPLE', 'OPEX', 5400000000, 0.79, 0.0),
        mk('PRODUCT', 'OPEX', 1620000000, 0.76, 0.03),
        mk('PROMOTION', 'OPEX', 720000000, 0.88, 0.05),
        mk('PROCESS', 'OPEX', 360000000, 0.62, 0.08),
        mk('PLACE', 'OPEX', 1080000000, 0.81, 0.02),
        mk('FACILITY', 'OPEX', 900000000, 0.74, 0.04),
        mk('FACILITY', 'CAPEX', 600000000, 0.52, 0.18),
        { p: 'PROFIT', cls: 'OUTCOME', original: 3600000000, revised: 3600000000, baseActual: 2890000000, baseCommit: 0 },
      ] },
      { id: 'BGT-2026-ESS', fy: 2026, bu: 'BU-ESS', status: 'LOCKED', version: 1, approvedBy: 'U-OWN', lines: [
        mk('PEOPLE', 'OPEX', 1200000000, 0.8, 0),
        mk('PRODUCT', 'OPEX', 2100000000, 0.78, 0.06),
        mk('PROMOTION', 'OPEX', 480000000, 0.91, 0.04),
        mk('PROCESS', 'OPEX', 240000000, 0.55, 0.05),
        mk('PLACE', 'OPEX', 300000000, 0.8, 0.01),
        mk('FACILITY', 'OPEX', 360000000, 0.7, 0.02),
        mk('FACILITY', 'CAPEX', 320000000, 0.2, 0.3),
        { p: 'PROFIT', cls: 'OUTCOME', original: 900000000, revised: 900000000, baseActual: 690000000, baseCommit: 0 },
      ] },
      { id: 'BGT-2027-SPA', fy: 2027, bu: 'BU-SPA', status: 'DRAFT', version: 1, lines: [
        mk('PEOPLE', 'OPEX', 5950000000, 0, 0), mk('PRODUCT', 'OPEX', 1780000000, 0, 0), mk('PROMOTION', 'OPEX', 820000000, 0, 0),
        mk('PROCESS', 'OPEX', 410000000, 0, 0), mk('PLACE', 'OPEX', 1150000000, 0, 0), mk('FACILITY', 'OPEX', 960000000, 0, 0),
        mk('FACILITY', 'CAPEX', 850000000, 0, 0), { p: 'PROFIT', cls: 'OUTCOME', original: 4300000000, revised: 4300000000, baseActual: 0, baseCommit: 0 },
      ] },
    ];
    // branch allocation of Spa budget (share of spending lines)
    s.branchShare = { 'BR-UBD': 0.34, 'BR-SHN': 0.25, 'BR-TRK': 0.23, 'BR-BSM': 0.18 };

    /* FY2027 line-level planning (Module D developer handoff, 2026-11-08): unit × 7P × item, qty × price,
       separate dimensions 7P / stream (Operational|Innovation) / fund type. Aggregated 7P lines are derived. */
    const W = SEASON.map((x) => Math.round(x * 1000) / 10); // monthly weights (%) — sum 100
    let pl = 0;
    const plan = (unit, p, name, qty, price, kind, opts = {}) => {
      pl += 1;
      const amt = Math.round(qty * price);
      return { id: 'BL27-' + String(pl).padStart(3, '0'), unit, p, name, item: opts.item || null, qty, price, kind, stream: opts.stream || 'OPERATIONAL', routine: opts.routine !== undefined ? opts.routine : kind === 'INVENTORY', kpi: opts.kpi || '', original: amt, revised: amt, weights: W.slice(), project: opts.project || null };
    };
    const spaPlan = [];
    Object.entries(s.branchShare).forEach(([br, sh]) => {
      const r = (v) => Math.round(v * sh / 12 / 1000) * 1000;
      spaPlan.push(
        plan(br, 'PEOPLE', 'Gaji & tunjangan therapist', 12, r(5950000000 * 0.92), 'OPEX', { kpi: 'Produktivitas therapist' }),
        plan(br, 'PEOPLE', 'Pelatihan & sertifikasi', 12, r(5950000000 * 0.08), 'OPEX', { kpi: 'Jam pelatihan / therapist' }),
        plan(br, 'PRODUCT', 'Minyak Pijat Lavender 1L', Math.round(40 * 12 * sh / 0.25), 88000, 'INVENTORY', { item: 'BHP-001', kpi: 'Biaya BHP per treatment' }),
        plan(br, 'PRODUCT', 'Body Scrub Kopi Bali 500g', Math.round(20 * 12 * sh / 0.25), 64000, 'INVENTORY', { item: 'BHP-002', kpi: 'Biaya BHP per treatment' }),
        plan(br, 'PRODUCT', 'BHP treatment lainnya', 12, r(1780000000 * 0.72), 'INVENTORY', { kpi: 'Biaya BHP per treatment' }),
        plan(br, 'PROMOTION', 'Kampanye pemasaran lokal', 12, r(820000000), 'OPEX', { kpi: 'Kontribusi inkremental' }),
        plan(br, 'PROCESS', 'Software & administrasi operasional', 12, r(410000000), 'OPEX', { kpi: 'Efektivitas proses' }),
        plan(br, 'PLACE', 'Sewa, kebersihan & premis', 12, r(1150000000), 'OPEX', { kpi: 'Biaya per m²' }),
        plan(br, 'FACILITY', 'Pemeliharaan peralatan', 12, r(960000000), 'OPEX', { kpi: 'Ketersediaan aset' }),
        plan(br, 'PROFIT', 'Target laba bersih cabang', 1, Math.round(4300000000 * sh), 'PERFORMANCE', { kpi: 'Net profit margin' })
      );
    });
    spaPlan.push(plan('BR-UBD', 'FACILITY', 'Renovasi 2 ruang couple treatment', 1, 850000000, 'CAPEX', { project: 'PRJ-2027-01', kpi: 'Okupansi ruang' }));
    spaPlan.push(plan('BU-SPA', 'PROCESS', 'Integrasi booking online fase 2', 1, 95000000, 'OPEX', { stream: 'INNOVATION', kpi: 'Konversi booking online' }));
    pl = 100;
    const essPlan = [
      plan('DV-ESS-PRD', 'PEOPLE', 'Gaji tim produksi', 12, 88000000, 'OPEX'),
      plan('DV-ESS-SLS', 'PEOPLE', 'Gaji & insentif tim penjualan', 12, 30000000, 'OPEX'),
      plan('DV-ESS-PRD', 'PRODUCT', 'Minyak Kelapa Murni 20L', 300, 715000, 'INVENTORY', { item: 'ESS-RM-01', kpi: 'Biaya bahan baku per unit' }),
      plan('DV-ESS-PRD', 'PRODUCT', 'Botol & label kemasan', 20000, 12500, 'INVENTORY', { kpi: 'Biaya kemasan per unit' }),
      plan('DV-ESS-SLS', 'PROMOTION', 'Iklan & kampanye digital', 12, 42000000, 'OPEX', { kpi: 'ROAS' }),
      plan('DV-ESS-PRD', 'PROCESS', 'Uji laboratorium formula baru', 1, 90000000, 'OPEX', { stream: 'INNOVATION', project: 'PRJ-2027-02', kpi: 'Formula lolos uji' }),
      plan('DV-ESS-PRD', 'PLACE', 'Sewa & utilitas ruang produksi', 12, 26000000, 'OPEX'),
      plan('DV-ESS-PRD', 'FACILITY', 'Upgrade mesin pengisi botol', 1, 240000000, 'CAPEX', { stream: 'INNOVATION', project: 'PRJ-2027-02', kpi: 'Kapasitas produksi' }),
      plan('DV-ESS-SLS', 'FACILITY', 'Deposit sewa gudang distribusi', 1, 60000000, 'DEPOSIT', { kpi: '—' }),
      plan('BU-ESS', 'PROFIT', 'Target laba Essence', 1, 1150000000, 'PERFORMANCE', { kpi: 'Net profit margin' }),
    ];
    const b27 = s.budgets.find((b) => b.id === 'BGT-2027-SPA');
    b27.plan = spaPlan;
    b27.lines = planToLines(spaPlan);
    s.budgets.push({ id: 'BGT-2027-ESS', fy: 2027, bu: 'BU-ESS', status: 'SUBMITTED', version: 1, approvals: [{ by: 'U-HOD', role: 'HEAD_DIV', ts: '2026-11-06T10:00:00' }], plan: essPlan, lines: planToLines(essPlan) });

    s.budgetRevisions = [
      { id: 'REV-2026-SPA-01', budget: 'BGT-2026-SPA', quarter: 'Q2', reason: 'Realokasi Promotion → Product (kenaikan harga minyak pijat)', changes: [{ p: 'PROMOTION', delta: -40000000 }, { p: 'PRODUCT', delta: 40000000 }], status: 'APPROVED', by: 'U-OWN' },
    ];
    s.nonRoutine = [
      { id: 'NRB-2026-01', name: 'Event Hari Spa Nasional (Promosi)', bu: 'BU-SPA', unit: 'BU-SPA', p: 'PROMOTION', kind: 'OPEX', amount: 45000000, used: 31500000, status: 'APPROVED', reason: 'Event tahunan nasional', by: 'U-HOD', decidedBy: 'U-OWN' },
      { id: 'NRB-2026-02', name: 'Pelatihan sertifikasi therapist', bu: 'BU-SPA', unit: 'BU-SPA', p: 'PEOPLE', kind: 'OPEX', amount: 60000000, used: 12000000, status: 'APPROVED', reason: 'Wajib sertifikasi baru', by: 'U-BUM', decidedBy: 'U-OWN' },
      { id: 'NRB-2026-03', name: 'Perbaikan darurat atap Spa Bisma', bu: 'BU-SPA', unit: 'BR-BSM', p: 'FACILITY', kind: 'OPEX', amount: 25000000, used: 0, status: 'SUBMITTED', reason: 'Bocor saat musim hujan, ruang refleksi tidak bisa dipakai', by: 'U-HOD' },
      { id: 'NRB-2026-04', name: 'Sampel formula Essence untuk buyer', bu: 'BU-ESS', unit: 'DV-ESS-PRD', p: 'PRODUCT', kind: 'OPEX', amount: 18000000, used: 0, status: 'SUBMITTED', reason: 'Permintaan buyer hotel — riset produk baru', by: 'U-FIN' },
    ];

    /* ---------------- Items (SKU master) ---------------- */
    s.items = [
      { id: 'BHP-001', barcode: '8991001000011', name: 'Minyak Pijat Lavender 1L', unit: 'botol', p: 'PRODUCT', routine: true, price: 85000, supplier: 'SUP-001', cat: 'BHP Treatment' },
      { id: 'BHP-002', barcode: '8991001000028', name: 'Body Scrub Kopi Bali 500g', unit: 'pak', p: 'PRODUCT', routine: true, price: 62000, supplier: 'SUP-001', cat: 'BHP Treatment' },
      { id: 'BHP-003', barcode: '8991001000035', name: 'Handuk Kecil Putih', unit: 'pcs', p: 'FACILITY', routine: true, price: 38000, supplier: 'SUP-002', cat: 'Linen' },
      { id: 'BHP-004', barcode: '8991001000042', name: 'Sabun Cair Antiseptik 5L', unit: 'jerigen', p: 'PLACE', routine: true, price: 145000, supplier: 'SUP-003', cat: 'Kebersihan' },
      { id: 'BHP-005', barcode: '8991001000059', name: 'Essential Oil Aromaterapi 10ml', unit: 'botol', p: 'PRODUCT', routine: true, price: 48000, supplier: 'SUP-001', cat: 'BHP Treatment' },
      { id: 'BHP-006', barcode: '8991001000066', name: 'Tisu Wajah 250 lembar', unit: 'kotak', p: 'PLACE', routine: true, price: 21000, supplier: 'SUP-005', cat: 'Kebersihan' },
      { id: 'BHP-007', barcode: '8991001000073', name: 'Sandal Spa Disposable', unit: 'pasang', p: 'FACILITY', routine: true, price: 6500, supplier: 'SUP-002', cat: 'Linen' },
      { id: 'BHP-008', barcode: '8991001000080', name: 'Lulur Tradisional Bali 1kg', unit: 'pak', p: 'PRODUCT', routine: true, price: 74000, supplier: 'SUP-001', cat: 'BHP Treatment' },
      { id: 'NR-001', barcode: '8991001000097', name: 'Brosur Promo A5 (500 lbr)', unit: 'pak', p: 'PROMOTION', routine: false, price: 375000, supplier: 'SUP-005', cat: 'Promosi' },
      { id: 'SP-001', barcode: '8991001000103', name: 'Kapasitor AC 35µF', unit: 'pcs', p: 'FACILITY', routine: false, price: 95000, supplier: 'SUP-004', cat: 'Suku Cadang' },
      { id: 'SP-002', barcode: '8991001000110', name: 'Freon R32 (isi ulang)', unit: 'kg', p: 'FACILITY', routine: false, price: 180000, supplier: 'SUP-004', cat: 'Suku Cadang' },
      { id: 'ESS-RM-01', barcode: '8991001000127', name: 'Minyak Kelapa Murni 20L', unit: 'jerigen', p: 'PRODUCT', routine: true, price: 690000, supplier: 'SUP-006', cat: 'Bahan Baku Essence' },
    ];

    /* ---------------- Suppliers (fictional) ---------------- */
    s.suppliers = [
      { id: 'SUP-001', name: 'PT Aroma Bali Lestari (DEMO)', cat: 'BHP Treatment', term: 'Net 30', leadDays: 3, rating: 4.6, onTime: 0.94, status: 'ACTIVE', npwp: 'DEMO-01', city: 'Denpasar' },
      { id: 'SUP-002', name: 'CV Tirta Linen (DEMO)', cat: 'Linen', term: 'Net 14', leadDays: 5, rating: 4.2, onTime: 0.88, status: 'ACTIVE', npwp: 'DEMO-02', city: 'Gianyar' },
      { id: 'SUP-003', name: 'UD Sumber Bersih (DEMO)', cat: 'Kebersihan', term: 'Net 30', leadDays: 2, rating: 4.0, onTime: 0.9, status: 'ACTIVE', npwp: 'DEMO-03', city: 'Denpasar' },
      { id: 'SUP-004', name: 'CV Teknik Dingin Bali (DEMO)', cat: 'Suku Cadang AC', term: 'COD', leadDays: 1, rating: 4.4, onTime: 0.96, status: 'ACTIVE', npwp: 'DEMO-04', city: 'Badung' },
      { id: 'SUP-005', name: 'PT Kertas Indah Grafika (DEMO)', cat: 'Cetak & Kertas', term: 'Net 30', leadDays: 4, rating: 3.9, onTime: 0.82, status: 'ACTIVE', npwp: 'DEMO-05', city: 'Denpasar' },
      { id: 'SUP-006', name: 'CV Nusa Kelapa (DEMO)', cat: 'Bahan Baku', term: 'Net 30', leadDays: 6, rating: 4.1, onTime: 0.86, status: 'ACTIVE', npwp: 'DEMO-06', city: 'Tabanan' },
      { id: 'SUP-007', name: 'PT Minyak Atsiri Nusa (DEMO)', cat: 'BHP Treatment', term: 'Net 45', leadDays: 7, rating: 4.3, onTime: 0.8, status: 'ACTIVE', npwp: 'DEMO-07', city: 'Surabaya' },
    ];
    s.quotations = [
      { id: 'QT-2611-01', item: 'BHP-001', supplier: 'SUP-001', price: 85000, leadDays: 3, validUntil: '2026-12-31', moq: 1 },
      { id: 'QT-2611-02', item: 'BHP-001', supplier: 'SUP-007', price: 81500, leadDays: 7, validUntil: '2026-12-15', moq: 24 },
      { id: 'QT-2611-03', item: 'BHP-002', supplier: 'SUP-001', price: 62000, leadDays: 3, validUntil: '2026-12-31', moq: 1 },
      { id: 'QT-2611-04', item: 'BHP-002', supplier: 'SUP-007', price: 64500, leadDays: 7, validUntil: '2026-12-15', moq: 12 },
      { id: 'QT-2611-05', item: 'BHP-004', supplier: 'SUP-003', price: 145000, leadDays: 2, validUntil: '2026-12-31', moq: 1 },
      { id: 'QT-2611-06', item: 'BHP-005', supplier: 'SUP-001', price: 48000, leadDays: 3, validUntil: '2026-12-31', moq: 1 },
      { id: 'QT-2611-07', item: 'BHP-005', supplier: 'SUP-007', price: 44000, leadDays: 7, validUntil: '2026-12-15', moq: 50 },
    ];
    s.priceHistory = [
      { item: 'BHP-001', supplier: 'SUP-001', points: [[ '2026-06', 78000 ], [ '2026-07', 78000 ], [ '2026-08', 80000 ], [ '2026-09', 82000 ], [ '2026-10', 85000 ], [ '2026-11', 85000 ]] },
      { item: 'BHP-004', supplier: 'SUP-003', points: [[ '2026-06', 145000 ], [ '2026-07', 145000 ], [ '2026-08', 145000 ], [ '2026-09', 145000 ], [ '2026-10', 145000 ], [ '2026-11', 145000 ]] },
      { item: 'BHP-005', supplier: 'SUP-001', points: [[ '2026-06', 46000 ], [ '2026-07', 46000 ], [ '2026-08', 47000 ], [ '2026-09', 47000 ], [ '2026-10', 48000 ], [ '2026-11', 48000 ]] },
    ];

    /* ---------------- Warehouses, racks & bins ---------------- */
    const bins = (code, racks) => racks.flatMap((r) => [1, 2, 3].map((n) => `${code}-${r}-0${n}`));
    s.warehouses = [
      { id: 'WH-UBD', name: 'Gudang Spa Ubud', org: 'BR-UBD', racks: ['A', 'B'], bins: bins('UBD', ['A', 'B']) },
      { id: 'WH-SHN', name: 'Gudang Spa Shanti', org: 'BR-SHN', racks: ['A', 'B'], bins: bins('SHN', ['A', 'B']) },
      { id: 'WH-TRK', name: 'Gudang Spa Triloka', org: 'BR-TRK', racks: ['A'], bins: bins('TRK', ['A']) },
      { id: 'WH-BSM', name: 'Gudang Spa Bisma', org: 'BR-BSM', racks: ['A'], bins: bins('BSM', ['A']) },
      { id: 'WH-ESS', name: 'Gudang Essence', org: 'BU-ESS', racks: ['A', 'B', 'C'], bins: bins('ESS', ['A', 'B', 'C']) },
      { id: 'WH-PST', name: 'Gudang Pusat HQ', org: 'BU-OFC', racks: ['A', 'B'], bins: bins('PST', ['A', 'B']) },
    ];
    const st = (wh, item, onHand, min, max, bin) => ({ wh, item, onHand, reserved: 0, min, max, bin });
    s.stock = [
      st('WH-SHN', 'BHP-001', 4, 6, 30, 'SHN-A-01'), st('WH-SHN', 'BHP-002', 3, 4, 20, 'SHN-A-02'), st('WH-SHN', 'BHP-003', 40, 30, 120, 'SHN-B-01'),
      st('WH-SHN', 'BHP-004', 3, 2, 8, 'SHN-B-02'), st('WH-SHN', 'BHP-005', 12, 15, 60, 'SHN-A-03'), st('WH-SHN', 'BHP-006', 18, 10, 40, 'SHN-B-03'),
      st('WH-SHN', 'BHP-007', 160, 100, 400, 'SHN-B-03'), st('WH-SHN', 'BHP-008', 6, 4, 20, 'SHN-A-02'),
      st('WH-UBD', 'BHP-001', 9, 6, 30, 'UBD-A-01'), st('WH-UBD', 'BHP-002', 10, 4, 20, 'UBD-A-02'), st('WH-UBD', 'BHP-003', 95, 30, 150, 'UBD-B-01'),
      st('WH-UBD', 'BHP-004', 5, 2, 8, 'UBD-B-02'), st('WH-UBD', 'BHP-005', 35, 15, 60, 'UBD-A-03'), st('WH-UBD', 'BHP-008', 9, 4, 20, 'UBD-A-02'),
      st('WH-TRK', 'BHP-001', 5, 5, 25, 'TRK-A-01'), st('WH-TRK', 'BHP-002', 1, 4, 20, 'TRK-A-02'), st('WH-TRK', 'BHP-003', 42, 30, 120, 'TRK-A-03'),
      st('WH-BSM', 'BHP-001', 2, 4, 20, 'BSM-A-01'), st('WH-BSM', 'BHP-003', 25, 20, 80, 'BSM-A-02'), st('WH-BSM', 'BHP-004', 1, 2, 6, 'BSM-A-03'),
      st('WH-ESS', 'ESS-RM-01', 14, 10, 40, 'ESS-A-01'),
      st('WH-PST', 'BHP-006', 60, 20, 120, 'PST-A-01'), st('WH-PST', 'NR-001', 4, 2, 10, 'PST-B-01'), st('WH-PST', 'SP-001', 2, 2, 6, 'PST-B-02'), st('WH-PST', 'BHP-003', 0, 0, 200, 'PST-A-02'),
    ];
    s.ledger = [];

    /* Monthly BHP item budgets (qty & value) — Nov 2026 */
    const ib = (branch, item, qty, baseActualQty) => {
      const it = s.items.find((i) => i.id === item);
      return { period: '2026-11', branch, item, qty, value: qty * it.price, baseActualQty };
    };
    s.itemBudgets = [
      ib('BR-SHN', 'BHP-001', 40, 26), ib('BR-SHN', 'BHP-002', 20, 9), ib('BR-SHN', 'BHP-003', 60, 22), ib('BR-SHN', 'BHP-004', 6, 2),
      ib('BR-SHN', 'BHP-005', 40, 31), ib('BR-SHN', 'BHP-006', 25, 8), ib('BR-SHN', 'BHP-007', 300, 120), ib('BR-SHN', 'BHP-008', 16, 7),
      ib('BR-UBD', 'BHP-001', 50, 21), ib('BR-UBD', 'BHP-002', 24, 10), ib('BR-UBD', 'BHP-003', 80, 30), ib('BR-UBD', 'BHP-004', 8, 3),
      ib('BR-UBD', 'BHP-005', 50, 18), ib('BR-TRK', 'BHP-001', 35, 15), ib('BR-TRK', 'BHP-002', 18, 8), ib('BR-TRK', 'BHP-003', 60, 25),
      ib('BR-BSM', 'BHP-001', 28, 14), ib('BR-BSM', 'BHP-003', 45, 20), ib('BR-BSM', 'BHP-004', 5, 2),
    ];

    /* ---------------- Transactions (seed history) ---------------- */
    s.meta.seq = { PR202611: 5, PO202611: 2, TR202611: 1, GR202611: 1, BL202611: 1, JV202611: 3, MT202611: 2, WO202611: 1, DC202611: 1 };

    s.mrfs = [
      { id: 'PR20261100001', date: '2026-11-02T09:10:00', requester: 'U-STF2', branch: 'BR-UBD', wh: 'WH-UBD', cc: 'CC-UBD-OPS', type: 'ROUTINE', status: 'FULFILLED', memo: 'Stok handuk untuk akhir pekan',
        lines: [{ item: 'BHP-003', qty: 20, reason: 'Pemakaian rutin', alloc: [{ path: 'LOCAL', qty: 20, fromWh: 'WH-UBD', ref: null, readyQty: 20, issuedQty: 20 }] }],
        history: [{ ts: '2026-11-02T09:10:00', by: 'U-STF2', action: 'SUBMIT' }, { ts: '2026-11-02T10:02:00', by: 'U-SPV2', action: 'APPROVE', note: 'OK' }, { ts: '2026-11-02T13:30:00', by: 'U-WHS', action: 'ISSUE', note: '20 pcs diserahkan' }] },
      { id: 'PR20261100002', date: '2026-11-04T11:00:00', requester: 'U-STF', branch: 'BR-SHN', wh: 'WH-SHN', cc: 'CC-SHN-OPS', type: 'ROUTINE', status: 'IN_FULFILLMENT', memo: 'Body scrub untuk paket promo November',
        lines: [{ item: 'BHP-002', qty: 5, reason: 'Paket promo', alloc: [{ path: 'LOCAL', qty: 2, fromWh: 'WH-SHN', ref: null, readyQty: 2, issuedQty: 2 }, { path: 'PURCHASE', qty: 3, fromWh: null, ref: null, readyQty: 0, issuedQty: 0 }] }],
        history: [{ ts: '2026-11-04T11:00:00', by: 'U-STF', action: 'SUBMIT' }, { ts: '2026-11-04T11:40:00', by: 'U-SPV', action: 'APPROVE', note: 'Disetujui, sesuai budget' }, { ts: '2026-11-04T14:00:00', by: 'U-WHS', action: 'ISSUE', note: '2 pak dari stok lokal' }] },
      { id: 'PR20261100003', date: '2026-11-05T08:45:00', requester: 'U-STF2', branch: 'BR-BSM', wh: 'WH-BSM', cc: 'CC-BSM-OPS', type: 'ROUTINE', status: 'IN_FULFILLMENT', memo: 'Minyak pijat Bisma',
        lines: [{ item: 'BHP-001', qty: 6, reason: 'Pemakaian rutin', alloc: [{ path: 'PURCHASE', qty: 6, fromWh: null, ref: null, readyQty: 0, issuedQty: 0 }] }],
        history: [{ ts: '2026-11-05T08:45:00', by: 'U-STF2', action: 'SUBMIT' }, { ts: '2026-11-05T09:30:00', by: 'U-BUM', action: 'APPROVE', note: 'Disetujui' }] },
      { id: 'PR20261100004', date: '2026-11-07T15:20:00', requester: 'U-STF', branch: 'BR-SHN', wh: 'WH-SHN', cc: 'CC-SHN-OPS', type: 'ROUTINE', status: 'SUBMITTED', memo: 'Aromaterapi untuk event wellness weekend',
        lines: [{ item: 'BHP-005', qty: 14, reason: 'Event wellness weekend', alloc: [] }],
        history: [{ ts: '2026-11-07T15:20:00', by: 'U-STF', action: 'SUBMIT' }] },
      { id: 'PR20261100005', date: '2026-11-03T10:00:00', requester: 'U-STF2', branch: 'BR-UBD', wh: 'WH-UBD', cc: 'CC-UBD-OPS', type: 'ROUTINE', status: 'REJECTED', memo: 'Sabun cair',
        lines: [{ item: 'BHP-004', qty: 4, reason: 'Stok cadangan', alloc: [] }],
        history: [{ ts: '2026-11-03T10:00:00', by: 'U-STF2', action: 'SUBMIT' }, { ts: '2026-11-03T11:15:00', by: 'U-SPV2', action: 'REJECT', note: 'Stok gudang masih cukup 5 jerigen' }] },
    ];
    // reflect seeded local issues in ledger
    s.ledger.push(
      { id: 'LG-0001', ts: '2026-11-02T13:30:00', type: 'ISSUE', wh: 'WH-UBD', item: 'BHP-003', qty: -20, ref: 'PR20261100001', cc: 'CC-UBD-OPS', by: 'U-WHS', note: 'Seed history' },
      { id: 'LG-0002', ts: '2026-11-04T14:00:00', type: 'ISSUE', wh: 'WH-SHN', item: 'BHP-002', qty: -2, ref: 'PR20261100002', cc: 'CC-SHN-OPS', by: 'U-WHS', note: 'Seed history' }
    );

    s.transfers = [
      { id: 'TR20261100001', date: '2026-11-01T09:00:00', from: 'WH-UBD', to: 'WH-TRK', status: 'RECEIVED', mrf: null, lines: [{ item: 'BHP-003', qty: 15 }], history: [{ ts: '2026-11-01T09:00:00', by: 'U-WHS', action: 'DISPATCH' }, { ts: '2026-11-01T15:00:00', by: 'U-WHS', action: 'RECEIVE' }] },
    ];

    s.pos = [
      { id: 'PO20261100001', date: '2026-11-03T10:00:00', supplier: 'SUP-002', deliverTo: 'WH-PST', status: 'SENT', emergency: false, memo: 'Restock linen Gudang Pusat', promised: '2026-11-08', term: 'Net 14', createdBy: 'U-PUR', approvedBy: 'U-PUR', freight: 0, taxRate: 0.11,
        lines: [{ item: 'BHP-003', qty: 120, received: 0, price: 38000, disc: 0, mrfRefs: [] }, { item: 'BHP-007', qty: 400, received: 0, price: 6500, disc: 0, mrfRefs: [] }],
        history: [{ ts: '2026-11-03T10:00:00', by: 'U-PUR', action: 'CREATE' }, { ts: '2026-11-03T10:30:00', by: 'U-PUR', action: 'APPROVE' }, { ts: '2026-11-03T11:00:00', by: 'U-PUR', action: 'SEND' }] },
      { id: 'PO20261100002', date: '2026-11-06T13:00:00', supplier: 'SUP-003', deliverTo: 'WH-BSM', status: 'PENDING_APPROVAL', emergency: false, memo: 'Sabun cair Bisma', promised: '2026-11-10', term: 'Net 30', createdBy: 'U-PUR', approvedBy: null, freight: 25000, taxRate: 0.11,
        lines: [{ item: 'BHP-004', qty: 6, received: 0, price: 145000, disc: 0, mrfRefs: [] }],
        history: [{ ts: '2026-11-06T13:00:00', by: 'U-PUR', action: 'CREATE' }, { ts: '2026-11-06T13:05:00', by: 'U-PUR', action: 'SUBMIT' }] },
    ];
    s.grns = [];
    s.docs = []; // captured invoice documents (AI capture)
    s.bills = [
      { id: 'BL20261100001', supplier: 'SUP-003', invoiceNo: 'USB/2026/10/0981', invoiceDate: '2026-10-28', po: 'PO20261000014', grn: 'GR20261000009', subtotal: 870000, tax: 95700, total: 965700, status: 'PAID', due: '2026-11-27', paidAt: '2026-11-05T10:00:00', matchStatus: 'MATCHED', history: [{ ts: '2026-11-01T09:00:00', by: 'U-FIN', action: 'VERIFY' }, { ts: '2026-11-05T10:00:00', by: 'U-FIN', action: 'PAY' }] },
    ];
    s.payments = [{ id: 'PY-2611-0001', bill: 'BL20261100001', amount: 965700, date: '2026-11-05', method: 'Transfer bank (DEMO)', status: 'PAID', by: 'U-FIN' }];
    s.journals = [
      { id: 'JV20261100001', ts: '2026-11-02T13:30:00', source: 'PR20261100001', kind: 'CONSUMPTION', status: 'POSTED', lines: [{ acc: '6110 Beban BHP — Facility', cc: 'CC-UBD-OPS', dr: 760000, cr: 0 }, { acc: '1140 Persediaan BHP', cc: 'CC-UBD-OPS', dr: 0, cr: 760000 }] },
      { id: 'JV20261100002', ts: '2026-11-04T14:00:00', source: 'PR20261100002', kind: 'CONSUMPTION', status: 'POSTED', lines: [{ acc: '6100 Beban BHP — Product', cc: 'CC-SHN-OPS', dr: 124000, cr: 0 }, { acc: '1140 Persediaan BHP', cc: 'CC-SHN-OPS', dr: 0, cr: 124000 }] },
      { id: 'JV20261100003', ts: '2026-11-05T10:00:00', source: 'BL20261100001', kind: 'PAYMENT', status: 'POSTED', lines: [{ acc: '2110 Utang Usaha', cc: 'CC-OFC-FIN', dr: 965700, cr: 0 }, { acc: '1110 Bank (DEMO)', cc: 'CC-OFC-FIN', dr: 0, cr: 965700 }] },
    ];

    /* ---------------- Assets & maintenance ---------------- */
    s.assets = [
      { id: 'AST-SHN-0001', name: 'AC Split 1,5 PK — Ruang Treatment 3', cat: 'HVAC', org: 'BR-SHN', location: 'Spa Shanti › Lantai 1 › Ruang Treatment 3', acquired: '2026-06-28', cost: 9800000, life: 60, method: 'Garis lurus', status: 'ACTIVE', condition: 'Perlu perbaikan', lastService: '2026-06-28', serviceIntervalDays: 90, source: 'PRJ-2026-03',
        history: [{ ts: '2026-06-28T10:00:00', event: 'Kapitalisasi dari PRJ-2026-03', by: 'U-FIN' }] },
      { id: 'AST-SHN-0002', name: 'Bed Pijat Elektrik', cat: 'Peralatan Treatment', org: 'BR-SHN', location: 'Spa Shanti › Lantai 1 › Ruang Treatment 1', acquired: '2024-03-12', cost: 18500000, life: 96, method: 'Garis lurus', status: 'ACTIVE', condition: 'Baik', lastService: '2026-09-01', serviceIntervalDays: 180, history: [] },
      { id: 'AST-UBD-0001', name: 'Water Heater 80L', cat: 'Utilitas', org: 'BR-UBD', location: 'Spa Ubud › Area Shower', acquired: '2021-08-02', cost: 6200000, life: 60, method: 'Garis lurus', status: 'ACTIVE', condition: 'Menurun', lastService: '2026-04-11', serviceIntervalDays: 120, history: [] },
      { id: 'AST-UBD-0002', name: 'Sauna Room Heater', cat: 'Peralatan Treatment', org: 'BR-UBD', location: 'Spa Ubud › Sauna', acquired: '2023-01-20', cost: 42000000, life: 96, method: 'Garis lurus', status: 'ACTIVE', condition: 'Baik', lastService: '2026-08-15', serviceIntervalDays: 180, history: [] },
      { id: 'AST-TRK-0001', name: 'Mesin Cuci Komersial 12kg', cat: 'Laundry', org: 'BR-TRK', location: 'Spa Triloka › Laundry', acquired: '2022-05-05', cost: 28500000, life: 84, method: 'Garis lurus', status: 'ACTIVE', condition: 'Baik', lastService: '2026-07-20', serviceIntervalDays: 120, history: [] },
      { id: 'AST-ESS-0001', name: 'Mesin Pengisi Botol Semi-otomatis', cat: 'Produksi', org: 'BU-ESS', location: 'Essence › Ruang Produksi', acquired: '2025-02-14', cost: 64000000, life: 96, method: 'Garis lurus', status: 'ACTIVE', condition: 'Baik', lastService: '2026-10-02', serviceIntervalDays: 90, history: [] },
      { id: 'AST-BSM-0001', name: 'Kursi Refleksi (set 4)', cat: 'Furnitur', org: 'BR-BSM', location: 'Spa Bisma › Ruang Refleksi', acquired: '2019-02-01', cost: 14000000, life: 60, method: 'Garis lurus', status: 'PENDING_DISPOSAL', condition: 'Rusak', lastService: '2025-12-01', serviceIntervalDays: 180, history: [] },
    ];
    s.maintenance = [
      { id: 'MT20261100001', date: '2026-11-06T16:00:00', asset: 'AST-SHN-0001', reporter: 'U-STF', branch: 'BR-SHN', issue: 'AC bocor dan kurang dingin, tamu komplain', priority: 'HIGH', status: 'SUBMITTED', wo: null, history: [{ ts: '2026-11-06T16:00:00', by: 'U-STF', action: 'SUBMIT' }] },
      { id: 'MT20261100002', date: '2026-10-20T09:00:00', asset: 'AST-TRK-0001', reporter: 'U-STF2', branch: 'BR-TRK', issue: 'Bunyi kasar saat spin', priority: 'MEDIUM', status: 'COMPLETED', wo: 'WO20261100001', history: [] },
    ];
    s.workOrders = [
      { id: 'WO20261100001', mt: 'MT20261100002', asset: 'AST-TRK-0001', assignee: 'Vendor servis (DEMO)', status: 'COMPLETED', parts: [], cost: 350000, completedAt: '2026-10-22T15:00:00', notes: 'Ganti bearing', history: [] },
    ];

    s.audit = [];
    s.insightState = {}; // id -> {status, by, ts, note}
    s.notificationsRead = {};
    s.tour = { step: 0 };
    return s;
  }

  HAWK.seed = seed;
  HAWK.planToLines = planToLines;
  HAWK.KIND_CLS = KIND_CLS;
  HAWK.SEVEN_P = SEVEN_P;
})(typeof window !== 'undefined' ? window : globalThis);
