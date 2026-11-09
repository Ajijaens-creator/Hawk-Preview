/* 7P Master Financial Control — performance cube, scoping, revenue/profit, lineage, export (MP-HAWK-11 / MP-HAWK-12).
   NOT a second ledger and NOT a new COA:
   - Amounts come from the existing 7P budgets (s.budgets) and the existing transaction engine (stock issue ledger, work orders, MRF).
     Each FY2026 budget aggregate (BU × 7P × class) is split into budget lines by stored weights, with exact integer remainders,
     so Σ lines = the aggregate shown in NV-15..23 (reconciles by construction).
   - Organisation is read from s.org + s.departments (data, effective-dated) — nothing about branches is hard-coded here.
   - P7 Profit is an outcome (target / actual / margin), never added to P1–P6 spend.
   - Synthetic evidence (payroll aggregates, supplier bills) is generated deterministically and labelled SIMULASI / SOURCE TO VERIFY.
   Every operation is exposed through HAWK.P7.adapter so the HAWK dev team can swap DEMO fixtures for verified APIs. */
(function (root) {
  'use strict';
  const HAWK = (root.HAWK = root.HAWK || {});
  const U = HAWK.U;
  const S = HAWK.selectors;
  const P7 = (HAWK.P7 = HAWK.P7 || {});

  const ORDER = ['PEOPLE', 'PRODUCT', 'PROMOTION', 'PROCESS', 'PLACE', 'FACILITY', 'PROFIT'];
  const CODE = { PEOPLE: 'P1', PRODUCT: 'P2', PROMOTION: 'P3', PROCESS: 'P4', PLACE: 'P5', FACILITY: 'P6', PROFIT: 'P7' };
  P7.ORDER = ORDER;
  P7.CODE = CODE;
  P7.SPEND = ORDER.slice(0, 6);
  P7.LEVELS = {
    P7: ['p', 'bu', 'loc', 'div', 'dept', 'sub', 'line'],
    ORG: ['bu', 'loc', 'div', 'dept', 'p', 'sub', 'line'],
  };
  P7.LEVEL_LABEL = { p: '7P', bu: 'Business Unit', loc: 'Outlet / Office', div: 'Divisi', dept: 'Departemen', sub: 'Subkategori', line: 'Budget item' };
  P7.CLASS_LABEL = { OPEX: 'OPEX', CAPEX: 'CAPEX', INVENTORY: 'Inventory', DEPOSIT: 'Deposit', WORKING_CAPITAL: 'Working capital', FIN_INVESTMENT: 'Investasi keuangan' };
  P7.PERIODS = [['FY', 'Setahun penuh'], ['YTD', 'Year-to-date'], ['Q1', 'Kuartal 1'], ['Q2', 'Kuartal 2'], ['Q3', 'Kuartal 3'], ['Q4', 'Kuartal 4']].concat(
    ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((m, i) => ['M' + String(i + 1).padStart(2, '0'), m])
  );

  /* deterministic hash (FNV-1a) — synthetic evidence must be stable between renders and windows */
  const hash = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  /* split an integer amount by weights; Σ parts === total exactly (largest remainder) */
  const split = (total, weights) => {
    const W = U.sum(weights) || 1;
    const raw = weights.map((w) => (total * w) / W);
    const out = raw.map((x) => Math.floor(x));
    let rest = Math.round(total - U.sum(out));
    raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => {
      if (rest > 0) {
        out[i] += 1;
        rest -= 1;
      }
    });
    return out;
  };
  P7.split = split;
  P7.hash = hash;

  /* ======================= seed extension (data, not code constants) ======================= */
  // Subcategory registry per 7P + strategic steward (an org unit, effective-dated). Editable data in state.
  const TAXONOMY = {
    version: 1,
    effectiveFrom: '2026-01-01',
    categories: [
      { p: 'PEOPLE', code: 'P1', steward: 'DV-HRD', stewardNote: 'HRD — tata kelola People lintas unit', subs: ['Gaji & tunjangan', 'Insentif & komisi', 'Pelatihan & sertifikasi', 'BPJS & benefit'] },
      { p: 'PRODUCT', code: 'P2', steward: null, stewardNote: 'Manajemen operasional BU — kualitas & biaya produk', subs: ['BHP treatment', 'Amenities tamu', 'Bahan baku produksi', 'Kemasan'] },
      { p: 'PROMOTION', code: 'P3', steward: 'DV-KOM', stewardNote: 'Komersil — tata kelola Promotion lintas unit', subs: ['Digital marketing', 'Event & aktivasi', 'Materi promosi', 'Brand & PR'] },
      { p: 'PROCESS', code: 'P4', steward: null, stewardNote: 'Manajemen operasional — sistem, SOP, produktivitas proses', subs: ['Operational Software', 'Administrasi & SOP', 'Konsultan & audit', 'Riset & uji'] },
      { p: 'PLACE', code: 'P5', steward: null, stewardNote: 'Manajemen operasional — tempat & kebersihan', subs: ['Sewa', 'Utilitas', 'Kebersihan & laundry'] },
      { p: 'FACILITY', code: 'P6', steward: null, stewardNote: 'Manajemen operasional + Inventory & Aset — fasilitas', subs: ['Pemeliharaan peralatan', 'Perbaikan gedung', 'Peralatan & aset baru'] },
      { p: 'PROFIT', code: 'P7', steward: 'DV-FIN', stewardNote: 'Finance — hasil (outcome), bukan belanja', subs: [] },
    ],
  };

  function seedExt(s) {
    s.p7Taxonomy = JSON.parse(JSON.stringify(TAXONOMY));
    const users = s.users;
    const tax = users.find((u) => u.id === 'U-TAX');
    if (tax) tax.position = 'TAX_ADMIN';

    /* Departments: a dimension below division / outlet. Generated from the org tree (any Spa outlet gets the outlet departments). */
    const deps = [];
    const dep = (id, name, loc, div, from = '2026-01-01') => deps.push({ id, name, loc, div, status: 'ACTIVE', effectiveFrom: from });
    const spaOps = s.org.find((o) => o.id === 'DV-SPA-OPS');
    s.org.filter((o) => o.type === 'BRANCH' && o.status === 'ACTIVE' && spaOps && S.ancestors(s, o.id).includes(spaOps.id)).forEach((br) => {
      const c = br.code;
      dep(`DP-${c}-TRT`, 'Treatment (Spa Therapist)', br.id, spaOps.id);
      dep(`DP-${c}-FO`, 'Front Office (Receptionist)', br.id, spaOps.id);
      dep(`DP-${c}-ATD`, 'Attendant & Housekeeping', br.id, spaOps.id);
      dep(`DP-${c}-SEC`, 'Security', br.id, spaOps.id);
      dep(`DP-${c}-MGT`, 'Manajemen Outlet', br.id, spaOps.id);
    });
    dep('DP-SPA-MGT', 'Manajemen Operasional Spa', 'BU-SPA', 'DV-SPA-OPS');
    dep('DP-FIN-ACC', 'Accounting & Reporting', 'BU-OFC', 'DV-FIN');
    dep('DP-FIN-TAX', 'Tax Administration', 'BU-OFC', 'DV-FIN');
    dep('DP-KOM-MKT', 'Marketing & Brand', 'BU-OFC', 'DV-KOM');
    dep('DP-KOM-SLS', 'Sales Korporat', 'BU-OFC', 'DV-KOM');
    dep('DP-HRD-HR', 'HR Operations & Payroll', 'BU-OFC', 'DV-HRD');
    dep('DP-HRD-LND', 'Learning & Development', 'BU-OFC', 'DV-HRD');
    dep('DP-HRD-GA', 'General Affairs', 'BU-OFC', 'DV-HRD');
    dep('DP-PUR-PRC', 'Procurement', 'BU-OFC', 'DV-PUR');
    dep('DP-ESS-FRM', 'Formulasi & QC', 'BU-ESS', 'DV-ESS-PRD');
    dep('DP-ESS-PRD', 'Produksi & Kemasan', 'BU-ESS', 'DV-ESS-PRD');
    dep('DP-ESS-RTL', 'Penjualan Retail & Online', 'BU-ESS', 'DV-ESS-SLS');
    dep('DP-ESS-DST', 'Distribusi', 'BU-ESS', 'DV-ESS-SLS');
    s.departments = deps;

    /* Office / HQ FY2026 budget (shared cost centre). Lives in the same budget engine as Spa / Essence. */
    const mk = (p, cls, original, actualPct, commitPct) => ({ p, cls, original, revised: original, baseActual: Math.round(original * actualPct), baseCommit: Math.round(original * commitPct) });
    if (!s.budgets.some((b) => b.id === 'BGT-2026-OFC'))
      s.budgets.splice(2, 0, {
        id: 'BGT-2026-OFC', fy: 2026, bu: 'BU-OFC', status: 'LOCKED', version: 1, approvedBy: 'U-OWN', shared: true,
        lines: [mk('PEOPLE', 'OPEX', 1380000000, 0.82, 0), mk('PROMOTION', 'OPEX', 300000000, 0.74, 0.06), mk('PROCESS', 'OPEX', 240000000, 0.69, 0.08), mk('PLACE', 'OPEX', 180000000, 0.83, 0), mk('FACILITY', 'OPEX', 60000000, 0.58, 0.05)],
      });

    s.intercompany = [
      { id: 'IC-2026-01', from: 'BU-ESS', to: 'BU-SPA', desc: 'Penjualan produk Essence ke outlet JAENS Spa (YTD)', revenueYtd: 312000000, unrealizedMargin: 18000000, status: 'DEMO' },
    ];

    /* FY2026 budget lines: weights per (budget, 7P, class). w = budget share, a / c = actual / commitment pace (relative). */
    const lines = [];
    let n = 0;
    const L = (budget, p, cls, loc, div, dept, sub, name, w, extra = {}) => {
      n += 1;
      lines.push({ id: 'BL26-' + String(n).padStart(3, '0'), fy: 2026, budget, p, cls, kind: extra.kind || cls, loc, div, dept, sub, name, w, a: extra.a || 1, c: extra.c || 1, sku: extra.sku || null, stream: extra.stream || 'OPERATIONAL', project: extra.project || null, asset: extra.asset || null, catchAll: !!extra.catchAll });
    };
    const branches = Object.entries(s.branchShare || {}).filter(([id]) => S.org(s, id));
    const d = (br, k) => `DP-${S.org(s, br).code}-${k}`;
    const SPA = 'BGT-2026-SPA';
    const ESS = 'BGT-2026-ESS';
    const OFC = 'BGT-2026-OFC';
    const pace = (br, i) => 0.86 + ((hash(br + i) % 30) / 100); // 0.86 .. 1.15 — makes utilisation differ per line
    branches.forEach(([br, sh]) => {
      L(SPA, 'PEOPLE', 'OPEX', br, 'DV-SPA-OPS', d(br, 'TRT'), 'Gaji & tunjangan', 'Gaji & tunjangan therapist', sh * 0.5, { a: pace(br, 1) });
      L(SPA, 'PEOPLE', 'OPEX', br, 'DV-SPA-OPS', d(br, 'TRT'), 'Insentif & komisi', 'Komisi & insentif treatment', sh * 0.12, { a: pace(br, 2) });
      L(SPA, 'PEOPLE', 'OPEX', br, 'DV-SPA-OPS', d(br, 'FO'), 'Gaji & tunjangan', 'Gaji receptionist', sh * 0.08, { catchAll: true });
      L(SPA, 'PEOPLE', 'OPEX', br, 'DV-SPA-OPS', d(br, 'ATD'), 'Gaji & tunjangan', 'Gaji attendant', sh * 0.07);
      L(SPA, 'PEOPLE', 'OPEX', br, 'DV-SPA-OPS', d(br, 'SEC'), 'Gaji & tunjangan', 'Gaji security', sh * 0.05);
      L(SPA, 'PEOPLE', 'OPEX', br, 'DV-SPA-OPS', d(br, 'MGT'), 'Gaji & tunjangan', 'Gaji supervisor outlet', sh * 0.06);
      L(SPA, 'PEOPLE', 'OPEX', br, 'DV-SPA-OPS', d(br, 'MGT'), 'BPJS & benefit', 'BPJS & benefit karyawan outlet', sh * 0.07, { a: pace(br, 3) });
      L(SPA, 'PRODUCT', 'OPEX', br, 'DV-SPA-OPS', d(br, 'TRT'), 'BHP treatment', 'Minyak Pijat Lavender 1L', sh * 0.3, { sku: 'BHP-001', kind: 'INVENTORY', a: pace(br, 4), c: 1.6 });
      L(SPA, 'PRODUCT', 'OPEX', br, 'DV-SPA-OPS', d(br, 'TRT'), 'BHP treatment', 'Body Scrub Kopi Bali 500g', sh * 0.18, { sku: 'BHP-002', kind: 'INVENTORY', a: pace(br, 5) });
      L(SPA, 'PRODUCT', 'OPEX', br, 'DV-SPA-OPS', d(br, 'TRT'), 'BHP treatment', 'BHP treatment lainnya', sh * 0.34, { kind: 'INVENTORY', catchAll: true, a: pace(br, 6) });
      L(SPA, 'PRODUCT', 'OPEX', br, 'DV-SPA-OPS', d(br, 'ATD'), 'Amenities tamu', 'Amenities & linen sekali pakai', sh * 0.18, { kind: 'INVENTORY', a: pace(br, 7) });
      L(SPA, 'PROMOTION', 'OPEX', br, 'DV-SPA-OPS', d(br, 'FO'), 'Event & aktivasi', 'Promosi lokal & event outlet', sh * 0.55, { catchAll: true, a: pace(br, 8) });
      L(SPA, 'PROMOTION', 'OPEX', br, 'DV-SPA-OPS', d(br, 'FO'), 'Materi promosi', 'Brosur, voucher & materi in-store', sh * 0.15, { a: pace(br, 9) });
      L(SPA, 'PROCESS', 'OPEX', br, 'DV-SPA-OPS', d(br, 'TRT'), 'Operational Software', 'Software appointment & integrasi', sh * 0.45, { a: pace(br, 10), c: 1.4 });
      L(SPA, 'PROCESS', 'OPEX', br, 'DV-SPA-OPS', d(br, 'FO'), 'Operational Software', 'Lisensi POS & kasir', sh * 0.25, { catchAll: true });
      L(SPA, 'PROCESS', 'OPEX', br, 'DV-SPA-OPS', d(br, 'MGT'), 'Administrasi & SOP', 'Audit SOP & quality outlet', sh * 0.3, { a: pace(br, 11) });
      L(SPA, 'PLACE', 'OPEX', br, 'DV-SPA-OPS', d(br, 'MGT'), 'Sewa', 'Sewa outlet', sh * 0.55, { a: 1 });
      L(SPA, 'PLACE', 'OPEX', br, 'DV-SPA-OPS', d(br, 'MGT'), 'Utilitas', 'Listrik & air', sh * 0.25, { a: pace(br, 12) });
      L(SPA, 'PLACE', 'OPEX', br, 'DV-SPA-OPS', d(br, 'ATD'), 'Kebersihan & laundry', 'Laundry & bahan kebersihan', sh * 0.2, { catchAll: true, a: pace(br, 13) });
      L(SPA, 'FACILITY', 'OPEX', br, 'DV-SPA-OPS', d(br, 'MGT'), 'Pemeliharaan peralatan', 'Pemeliharaan AC & peralatan', sh * 0.55, { catchAll: true, a: pace(br, 14) });
      L(SPA, 'FACILITY', 'OPEX', br, 'DV-SPA-OPS', d(br, 'TRT'), 'Pemeliharaan peralatan', 'Perbaikan bed & peralatan treatment', sh * 0.25, { a: pace(br, 15) });
      L(SPA, 'FACILITY', 'OPEX', br, 'DV-SPA-OPS', d(br, 'ATD'), 'Pemeliharaan peralatan', 'Linen & handuk pengganti', sh * 0.2, { kind: 'INVENTORY', a: pace(br, 16) });
      L(SPA, 'FACILITY', 'CAPEX', br, 'DV-SPA-OPS', d(br, 'TRT'), 'Peralatan & aset baru', 'Peralatan treatment baru', sh * 0.5, { a: pace(br, 17) });
    });
    // Spa BU-level (lintas outlet) lines — cost centre BU Spa, steward differs (Komersil / HRD)
    L(SPA, 'PEOPLE', 'OPEX', 'BU-SPA', 'DV-SPA-OPS', 'DP-SPA-MGT', 'Pelatihan & sertifikasi', 'Pelatihan & sertifikasi therapist', 0.0, { a: 0.7 });
    L(SPA, 'PROMOTION', 'OPEX', 'BU-SPA', 'DV-SPA-OPS', 'DP-SPA-MGT', 'Digital marketing', 'Kampanye digital JAENS Spa', 0.3, { a: 1.1 });
    L(SPA, 'FACILITY', 'CAPEX', 'BR-UBD', 'DV-SPA-OPS', 'DP-UBD-MGT', 'Peralatan & aset baru', 'Penggantian AC hemat energi', 0.25, { project: 'PRJ-2026-03', asset: 'AST-UBD-0001', a: 1.5 });
    L(SPA, 'FACILITY', 'CAPEX', 'BU-SPA', 'DV-SPA-OPS', 'DP-SPA-MGT', 'Peralatan & aset baru', 'Perangkat sistem booking online', 0.25, { stream: 'INNOVATION', project: 'PRJ-2026-05', a: 0.6, c: 2 });
    // People BU-level weight: give training a real share
    lines.find((l) => l.name === 'Pelatihan & sertifikasi therapist').w = 0.04;

    // Essence
    const E = (p, cls, div, dept, sub, name, w, x) => L(ESS, p, cls, 'BU-ESS', div, dept, sub, name, w, x);
    E('PEOPLE', 'OPEX', 'DV-ESS-PRD', 'DP-ESS-PRD', 'Gaji & tunjangan', 'Gaji tim produksi', 0.5, { catchAll: true });
    E('PEOPLE', 'OPEX', 'DV-ESS-PRD', 'DP-ESS-FRM', 'Gaji & tunjangan', 'Gaji formulator & QC', 0.15);
    E('PEOPLE', 'OPEX', 'DV-ESS-SLS', 'DP-ESS-RTL', 'Insentif & komisi', 'Gaji & insentif tim penjualan', 0.3, { a: 1.08 });
    E('PEOPLE', 'OPEX', 'DV-ESS-SLS', 'DP-ESS-DST', 'Pelatihan & sertifikasi', 'Pelatihan product knowledge', 0.05, { a: 0.6 });
    E('PRODUCT', 'OPEX', 'DV-ESS-PRD', 'DP-ESS-PRD', 'Bahan baku produksi', 'Minyak Kelapa Murni 20L', 0.45, { sku: 'ESS-RM-01', kind: 'INVENTORY', a: 1.05, c: 1.4 });
    E('PRODUCT', 'OPEX', 'DV-ESS-PRD', 'DP-ESS-FRM', 'Bahan baku produksi', 'Essential oil & bahan aktif', 0.3, { kind: 'INVENTORY', catchAll: true });
    E('PRODUCT', 'OPEX', 'DV-ESS-PRD', 'DP-ESS-PRD', 'Kemasan', 'Botol & label kemasan', 0.25, { kind: 'INVENTORY', a: 0.92 });
    E('PROMOTION', 'OPEX', 'DV-ESS-SLS', 'DP-ESS-RTL', 'Digital marketing', 'Iklan & kampanye digital Essence', 0.6, { catchAll: true, a: 1.06 });
    E('PROMOTION', 'OPEX', 'DV-ESS-SLS', 'DP-ESS-DST', 'Event & aktivasi', 'Pameran & sampling', 0.4, { a: 0.9 });
    E('PROCESS', 'OPEX', 'DV-ESS-PRD', 'DP-ESS-FRM', 'Riset & uji', 'Uji laboratorium & registrasi BPOM', 0.5, { a: 0.8 });
    E('PROCESS', 'OPEX', 'DV-ESS-SLS', 'DP-ESS-RTL', 'Operational Software', 'Software e-commerce & distribusi', 0.5, { catchAll: true, a: 1.2 });
    E('PLACE', 'OPEX', 'DV-ESS-PRD', 'DP-ESS-PRD', 'Sewa', 'Sewa & utilitas ruang produksi', 0.7, { catchAll: true });
    E('PLACE', 'OPEX', 'DV-ESS-SLS', 'DP-ESS-DST', 'Sewa', 'Sewa gudang distribusi', 0.3);
    E('FACILITY', 'OPEX', 'DV-ESS-PRD', 'DP-ESS-PRD', 'Pemeliharaan peralatan', 'Pemeliharaan mesin produksi', 1, { catchAll: true });
    E('FACILITY', 'CAPEX', 'DV-ESS-PRD', 'DP-ESS-PRD', 'Peralatan & aset baru', 'Mesin pengisi botol', 1, { stream: 'INNOVATION', project: 'PRJ-2027-02' });

    // Office / HQ — HRD's own spend is not only People; Komersil's payroll stays People (steward HRD, owner Komersil)
    const O = (p, div, dept, sub, name, w, x) => L(OFC, p, 'OPEX', 'BU-OFC', div, dept, sub, name, w, x);
    O('PEOPLE', 'DV-FIN', 'DP-FIN-ACC', 'Gaji & tunjangan', 'Gaji tim Finance & Accounting', 0.27, { catchAll: true });
    O('PEOPLE', 'DV-FIN', 'DP-FIN-TAX', 'Gaji & tunjangan', 'Gaji tim Tax Administration', 0.05);
    O('PEOPLE', 'DV-KOM', 'DP-KOM-MKT', 'Gaji & tunjangan', 'Gaji tim Komersil', 0.22);
    O('PEOPLE', 'DV-KOM', 'DP-KOM-SLS', 'Insentif & komisi', 'Insentif sales korporat', 0.04, { a: 1.2 });
    O('PEOPLE', 'DV-HRD', 'DP-HRD-HR', 'Gaji & tunjangan', 'Gaji tim HRD', 0.14);
    O('PEOPLE', 'DV-HRD', 'DP-HRD-LND', 'Pelatihan & sertifikasi', 'Program pelatihan lintas unit', 0.12, { a: 0.75 });
    O('PEOPLE', 'DV-PUR', 'DP-PUR-PRC', 'Gaji & tunjangan', 'Gaji tim Purchasing', 0.16);
    O('PROMOTION', 'DV-KOM', 'DP-KOM-MKT', 'Brand & PR', 'Brand campaign grup JAENS', 0.7, { catchAll: true, a: 1.05 });
    O('PROMOTION', 'DV-KOM', 'DP-KOM-MKT', 'Materi promosi', 'Fotografi & materi promosi', 0.3, { a: 0.85 });
    O('PROCESS', 'DV-FIN', 'DP-FIN-ACC', 'Operational Software', 'Lisensi software akuntansi', 0.4, { catchAll: true });
    O('PROCESS', 'DV-HRD', 'DP-HRD-HR', 'Operational Software', 'Software HRIS & payroll', 0.3, { a: 1.1 });
    O('PROCESS', 'DV-FIN', 'DP-FIN-TAX', 'Konsultan & audit', 'Konsultan pajak & audit eksternal', 0.3, { a: 0.7, c: 2 });
    O('PLACE', 'DV-HRD', 'DP-HRD-GA', 'Sewa', 'Sewa kantor pusat', 0.75, { catchAll: true });
    O('PLACE', 'DV-HRD', 'DP-HRD-GA', 'Utilitas', 'Listrik, air & internet kantor', 0.25);
    O('FACILITY', 'DV-HRD', 'DP-HRD-GA', 'Perbaikan gedung', 'Perbaikan kantor & peralatan', 1, { catchAll: true });
    s.p7lines = lines;
  }
  P7.seedExt = seedExt;

  /* ======================= dimension helpers ======================= */
  P7.cat = (s, p) => (s.p7Taxonomy || TAXONOMY).categories.find((c) => c.p === p);
  P7.dept = (s, id) => (s.departments || []).find((d) => d.id === id);
  P7.locName = (s, id) => {
    const o = S.org(s, id);
    if (!o) return id || '—';
    if (o.type === 'OFFICE') return 'Kantor Pusat (HQ)';
    if (o.type === 'BU') return o.id === 'BU-ESS' ? 'Essence — pusat produksi & penjualan' : 'Manajemen BU (lintas outlet)';
    return o.name;
  };
  P7.label = (s, level, key) => {
    if (level === 'p') return `${CODE[key] || ''} ${(HAWK.SEVEN_P.find((x) => x.key === key) || {}).name || key}`;
    if (level === 'bu') return key === 'BU-OFC' ? 'Shared Office / HQ' : S.orgName(s, key);
    if (level === 'loc') return P7.locName(s, key);
    if (level === 'div') return S.orgName(s, key);
    if (level === 'dept') return (P7.dept(s, key) || {}).name || key;
    return key;
  };
  const userIn = (s, role, org) => s.users.find((u) => u.role === role && u.scope.includes(org));
  /* budget owner = the accountable manager of the cost centre (derived from the org assignment, never typed) */
  P7.ownerOf = (s, l) => {
    const o = S.org(s, l.loc);
    if (o && o.type === 'BRANCH') return userIn(s, 'SUPERVISOR', l.loc);
    if (l.bu === 'BU-OFC') return l.div === 'DV-FIN' ? s.users.find((u) => u.id === 'U-FIN') : l.div === 'DV-PUR' ? s.users.find((u) => u.role === 'PURCHASING') : userIn(s, 'HEAD_DIV', l.div);
    return userIn(s, 'BU_MANAGER', l.bu);
  };
  /* strategic steward (governance of the category) ≠ owner. HRD → People, Komersil → Promotion, Finance → Profit, else BU management. */
  P7.stewardOf = (s, l) => {
    const c = P7.cat(s, l.p) || {};
    if (c.steward) {
      const head = c.steward === 'DV-FIN' ? s.users.find((u) => u.id === 'U-FIN') : userIn(s, 'HEAD_DIV', c.steward);
      return { org: c.steward, user: head, note: c.stewardNote };
    }
    const bm = l.bu === 'BU-OFC' ? s.users.find((u) => u.id === 'U-FIN') : userIn(s, 'BU_MANAGER', l.bu);
    return { org: l.bu, user: bm, note: c.stewardNote };
  };
  P7.ccOf = (s, l) => {
    const o = S.org(s, l.loc);
    const c = (s.costCenters || []).find((x) => x.org === (o && o.type === 'BRANCH' ? l.loc : l.div));
    return c ? c.id : null;
  };

  /* ======================= lines with amounts ======================= */
  const months = (s) => S.monthsElapsed(s);
  const curMonth = (s) => +s.meta.demoDate.slice(5, 7); // 1..12
  const season = (s) => s.season || s.meta.season || Array(12).fill(1 / 12);

  // live (session) transactions → exactly one line each (same BU × 7P × OPEX as S.dynamicActual / S.dynamicCommit)
  function liveFacts(s) {
    const facts = [];
    s.ledger.forEach((g) => {
      if (g.type !== 'ISSUE' || g.note === 'Seed history') return;
      const cc = s.costCenters.find((c) => c.id === g.cc);
      const it = S.item(s, g.item);
      if (!cc || !it) return;
      facts.push({ kind: 'ACTUAL', bu: S.buOf(s, cc.org), org: cc.org, p: it.p, sku: g.item, amount: -g.qty * it.price, id: g.id, ref: g.ref, ts: g.ts, label: `Pemakaian ${it.name} × ${-g.qty}`, source: 'Inventory issue (ledger)' });
    });
    s.workOrders.forEach((w) => {
      const a = S.asset(s, w.asset);
      if (w.status === 'COMPLETED' && w.completedAt >= '2026-11-08' && a) facts.push({ kind: 'ACTUAL', bu: S.buOf(s, a.org), org: a.org, p: 'FACILITY', amount: w.cost || 0, id: w.id, ref: w.id, ts: w.completedAt, label: `Work order ${a.name}`, source: 'Asset maintenance (work order)' });
    });
    s.mrfs.forEach((m) => {
      if (!['APPROVED', 'IN_FULFILLMENT'].includes(m.status)) return;
      m.lines.forEach((l) => {
        const it = S.item(s, l.item);
        if (!it) return;
        const open = l.qty - U.sum(l.alloc || [], (a) => a.issuedQty);
        if (open > 0) facts.push({ kind: 'COMMIT', bu: S.buOf(s, m.branch), org: m.branch, p: it.p, sku: l.item, amount: open * it.price, id: m.id, ref: m.id, ts: m.date, label: `MRF ${it.name} — ${open} belum diserahkan`, source: 'MRF disetujui (komitmen)' });
      });
    });
    return facts;
  }

  // FY2027 lines: derived on the fly from the editable plan (NV-15) so they never go stale
  const P_DEPT = { PEOPLE: 'TRT', PRODUCT: 'TRT', PROMOTION: 'FO', PROCESS: 'TRT', PLACE: 'MGT', FACILITY: 'MGT', PROFIT: 'MGT' };
  const P_SUB = { PEOPLE: 'Gaji & tunjangan', PRODUCT: 'BHP treatment', PROMOTION: 'Event & aktivasi', PROCESS: 'Operational Software', PLACE: 'Sewa', FACILITY: 'Pemeliharaan peralatan' };
  function planLines(s, fy) {
    const out = [];
    s.budgets.filter((b) => b.fy === fy && b.plan).forEach((b) => {
      b.plan.forEach((pl) => {
        if (pl.p === 'PROFIT') return;
        const o = S.org(s, pl.unit) || {};
        let loc = pl.unit;
        let div = o.type === 'DIVISION' ? o.id : 'DV-SPA-OPS';
        let dept = null;
        if (o.type === 'BRANCH') dept = `DP-${o.code}-${P_DEPT[pl.p]}`;
        else if (o.type === 'DIVISION') {
          loc = b.bu;
          dept = ((s.departments || []).find((x) => x.div === o.id) || {}).id || null;
        } else {
          loc = b.bu;
          div = b.bu === 'BU-SPA' ? 'DV-SPA-OPS' : ((s.org.find((x) => x.parent === b.bu && x.type === 'DIVISION') || {}).id || b.bu);
          dept = b.bu === 'BU-SPA' ? 'DP-SPA-MGT' : ((s.departments || []).find((x) => x.div === div) || {}).id || null;
        }
        const sub = /pelatihan/i.test(pl.name) ? 'Pelatihan & sertifikasi' : /kemasan|botol/i.test(pl.name) ? 'Kemasan' : /bahan|kelapa/i.test(pl.name) ? 'Bahan baku produksi' : /renovasi|mesin|upgrade/i.test(pl.name) ? 'Peralatan & aset baru' : /laboratorium|uji/i.test(pl.name) ? 'Riset & uji' : /deposit/i.test(pl.name) ? 'Sewa' : P_SUB[pl.p];
        out.push({ id: pl.id, fy, budget: b.id, p: pl.p, cls: pl.kind === 'CAPEX' ? 'CAPEX' : ['OPEX', 'INVENTORY'].includes(pl.kind) ? 'OPEX' : 'OTHER', kind: pl.kind, loc, div, dept, sub, name: pl.name, sku: pl.item, stream: pl.stream, project: pl.project, asset: null, original: pl.original, revised: pl.revised, baseActual: 0, baseCommit: 0, draft: b.status !== 'LOCKED', status: S.budgetStage(s, b), w: 1 });
      });
    });
    return out;
  }

  /* All budget lines of a fiscal year with Original / Revised / Actual / Commitment / Forecast and monthly profiles. */
  P7.lines = (s, fy = 2026) => {
    const me = months(s);
    const cm = curMonth(s);
    const SEA = season(s);
    let base;
    if (fy === 2026) {
      base = [];
      const groups = {};
      (s.p7lines || []).forEach((l) => (groups[l.budget + '|' + l.p + '|' + l.cls] = groups[l.budget + '|' + l.p + '|' + l.cls] || []).push(l));
      Object.entries(groups).forEach(([k, ls]) => {
        const [bid, p, cls] = k.split('|');
        const b = s.budgets.find((x) => x.id === bid);
        const ag = b && b.lines.find((x) => x.p === p && x.cls === cls);
        if (!ag) return;
        const ori = split(ag.original, ls.map((l) => l.w));
        const rev = split(ag.revised, ls.map((l) => l.w));
        const act = split(ag.baseActual, ls.map((l) => l.w * l.a));
        const com = split(ag.baseCommit, ls.map((l) => l.w * l.c));
        ls.forEach((l, i) => base.push({ ...l, original: ori[i], revised: rev[i], baseActual: act[i], baseCommit: com[i], status: S.budgetStage(s, b) }));
      });
      base.sort((a, b) => (a.id < b.id ? -1 : 1));
    } else base = planLines(s, fy);
    const facts = fy === 2026 ? liveFacts(s) : [];
    const out = base.map((l) => ({ ...l, bu: S.buOf(s, l.loc) || l.loc, dynActual: 0, dynCommit: 0, facts: [] }));
    // attribute each live fact to exactly one line: same BU × 7P × OPEX, prefer same outlet + SKU, then outlet catch-all, then BU catch-all
    facts.forEach((f) => {
      const pool = out.filter((l) => l.bu === f.bu && l.p === f.p && l.cls === 'OPEX');
      if (!pool.length) return;
      const tgt = pool.find((l) => l.loc === f.org && f.sku && l.sku === f.sku) || pool.find((l) => l.loc === f.org && l.catchAll) || pool.find((l) => l.loc === f.org) || pool.find((l) => l.catchAll) || pool[0];
      if (f.kind === 'ACTUAL') tgt.dynActual += f.amount;
      else tgt.dynCommit += f.amount;
      tgt.facts.push(f);
    });
    const elapsedW = U.sum(SEA.slice(0, Math.floor(me)));
    const futureIdx = SEA.map((_, i) => i).filter((i) => i + 1 >= cm); // current month onward
    const futW = U.sum(futureIdx, (i) => SEA[i]) || 1;
    return out.map((l) => {
      const actual = l.baseActual + l.dynActual;
      const commitment = l.baseCommit + l.dynCommit;
      const runRate = me && fy === 2026 ? l.baseActual / me : 0;
      const forecast = fy === 2026 ? Math.max(actual + commitment, actual + runRate * (12 - me)) : l.revised;
      const mBudget = SEA.map((w) => l.revised * w);
      const mActual = SEA.map((w, i) => (fy === 2026 && i < Math.floor(me) ? (l.baseActual * w) / (elapsedW || 1) : 0));
      l.facts.filter((f) => f.kind === 'ACTUAL').forEach((f) => (mActual[Math.max(0, Math.min(11, +String(f.ts).slice(5, 7) - 1))] += f.amount));
      const fut = forecast - actual;
      const mForecast = mActual.map((a, i) => a + (futureIdx.includes(i) ? (fut * SEA[i]) / futW : 0));
      return { ...l, actual, commitment, forecast, mBudget, mActual, mForecast };
    });
  };

  /* ======================= filters & access ======================= */
  P7.periodMonths = (per, s) => {
    if (!per || per === 'FY') return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    if (per === 'YTD') return Array.from({ length: curMonth(s) }, (_, i) => i + 1);
    if (/^Q[1-4]$/.test(per)) {
      const q = +per[1];
      return [q * 3 - 2, q * 3 - 1, q * 3];
    }
    if (/^M\d\d$/.test(per)) return [+per.slice(1)];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };
  const DIMS = ['p', 'bu', 'loc', 'div', 'dept', 'sub', 'line'];
  P7.DIMS = DIMS;
  P7.match = (l, f) =>
    (!f.p || l.p === f.p) && (!f.bu || l.bu === f.bu) && (!f.loc || l.loc === f.loc) && (!f.div || l.div === f.div) && (!f.dept || l.dept === f.dept) && (!f.sub || l.sub === f.sub) && (!f.line || l.id === f.line) &&
    (!f.cls || (f.cls === 'INVENTORY' ? l.kind === 'INVENTORY' : f.cls === 'OPEX' ? l.cls === 'OPEX' && l.kind !== 'INVENTORY' : l.cls === f.cls)) && (!f.stream || l.stream === f.stream);

  /* What may this account see? DEMO only — production must enforce on the server. */
  P7.access = (s, u) => {
    const none = { ok: false, label: 'Tidak ada akses data budget', pred: () => false, export: false, modes: [] };
    if (!u) return none;
    const all = () => true;
    if (u.role === 'OWNER') return { ok: true, label: 'Konsolidasi Spa · Essence · Office (Owner)', pred: all, export: true, modes: [{ key: 'own', label: 'Semua unit', pred: all }] };
    if (u.role === 'FINANCE') {
      const tax = u.position === 'TAX_ADMIN';
      return { ok: true, tax, label: tax ? 'Seluruh unit — dimensi pajak (Tax Administration)' : 'Seluruh unit — kontrol keuangan & rekonsiliasi', pred: all, export: true, modes: [{ key: 'own', label: tax ? 'Review pajak lintas unit' : 'Semua unit', pred: all }] };
    }
    const inScope = (org) => u.scope.includes(org) || S.ancestors(s, org).some((a) => u.scope.includes(a));
    if (u.role === 'BU_MANAGER') {
      const pred = (l) => u.scope.includes(l.bu);
      return { ok: true, label: 'BU sendiri: ' + u.scope.map((x) => S.orgName(s, x)).join(', '), pred, export: true, modes: [{ key: 'own', label: 'Budget BU saya', pred }] };
    }
    if (u.role === 'HEAD_DIV') {
      const own = (l) => inScope(l.div) || inScope(l.loc);
      const modes = [{ key: 'own', label: 'Budget divisi saya (pemilik biaya)', pred: own }];
      const cats = ((s.p7Taxonomy || TAXONOMY).categories || []).filter((c) => c.steward && u.scope.includes(c.steward) && c.p !== 'PROFIT');
      cats.forEach((c) => modes.push({ key: 'steward', p: c.p, label: `Stewardship ${(HAWK.SEVEN_P.find((x) => x.key === c.p) || {}).name} lintas unit`, pred: (l) => l.p === c.p }));
      return { ok: true, label: modes.map((m) => m.label).join(' · '), pred: (l) => modes.some((m) => m.pred(l)), export: true, modes, steward: cats.map((c) => c.p) };
    }
    if (u.role === 'SUPERVISOR') {
      const pred = (l) => u.scope.includes(l.loc);
      return { ok: true, label: 'Outlet sendiri: ' + u.scope.map((x) => S.orgName(s, x)).join(', '), pred, export: false, modes: [{ key: 'own', label: 'Budget outlet saya', pred }] };
    }
    return none;
  };

  /* ======================= aggregation ======================= */
  P7.sumPeriod = (rows, mm) => {
    const idx = mm.map((m) => m - 1);
    const t = { original: 0, revised: 0, budget: 0, actual: 0, commitment: 0, forecast: 0, n: rows.length };
    rows.forEach((l) => {
      t.original += l.original;
      t.revised += l.revised;
      t.budget += U.sum(idx, (i) => l.mBudget[i]);
      t.actual += U.sum(idx, (i) => l.mActual[i]);
      t.forecast += U.sum(idx, (i) => l.mForecast[i]);
      t.commitment += l.commitment;
    });
    t.available = t.budget - t.actual - t.commitment;
    t.variance = t.actual - t.budget;
    t.fVariance = t.forecast - t.budget;
    t.utilization = t.budget ? t.actual / t.budget : null;
    return t;
  };
  /* When the period is a sub-period ending before today, open commitments (as of today) do not belong to it. */
  const commitApplies = (s, mm) => Math.max(...mm) >= curMonth(s);

  P7.query = (s, u, f = {}) => {
    const fy = +(f.fy || 2026);
    const acc = P7.access(s, u);
    const mode = acc.modes.find((m) => m.key === f.view) || acc.modes[0];
    const all = P7.lines(s, fy);
    const visible = acc.ok ? all.filter((l) => (mode ? mode.pred(l) : acc.pred(l))) : [];
    const rows = visible.filter((l) => P7.match(l, f));
    const mm = P7.periodMonths(f.per, s);
    const totals = P7.sumPeriod(rows, mm);
    if (!commitApplies(s, mm)) {
      totals.commitment = 0;
      totals.available = totals.budget - totals.actual;
    }
    return { fy, f, acc, mode, all, visible, rows, mm, totals, asOf: s.meta.demoDate, commitNote: commitApplies(s, mm) ? 'posisi per ' + s.meta.demoDate : 'periode sudah lewat — komitmen terbuka tidak dibebankan' };
  };

  P7.group = (s, q, level, opts = {}) => {
    const map = new Map();
    q.rows.forEach((l) => {
      const k = level === 'line' ? l.id : l[level];
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(l);
    });
    const ca = commitApplies(s, q.mm);
    const out = [...map.entries()].map(([key, rows]) => {
      const t = P7.sumPeriod(rows, q.mm);
      if (!ca) {
        t.commitment = 0;
        t.available = t.budget - t.actual;
      }
      return { key, label: level === 'line' ? rows[0].name : P7.label(s, level, key), rows, ...t, share: q.totals.budget ? t.budget / q.totals.budget : 0 };
    });
    const sk = opts.sort || (level === 'p' ? 'order' : 'budget');
    const dir = opts.dir === 'asc' ? 1 : -1;
    out.sort((a, b) => {
      if (sk === 'order') return ORDER.indexOf(a.key) - ORDER.indexOf(b.key);
      if (sk === 'label') return dir * String(a.label).localeCompare(String(b.label));
      const av = a[sk] === null || a[sk] === undefined ? -Infinity : a[sk];
      const bv = b[sk] === null || b[sk] === undefined ? -Infinity : b[sk];
      return dir === 1 ? av - bv : bv - av;
    });
    return out;
  };

  /* ======================= revenue, profit, ratios ======================= */
  // Denominators exist only for whole BUs / whole outlets. Division, department and Office scopes → N/A (no direct revenue).
  P7.revenue = (s, f = {}, u) => {
    const fy = +(f.fy || 2026);
    const SEA = season(s);
    const mm = P7.periodMonths(f.per, s);
    const tw = U.sum(mm, (m) => SEA[m - 1]);
    const me = Math.floor(months(s));
    const aw = U.sum(SEA.slice(0, me)) || 1;
    const actW = U.sum(mm.filter((m) => m <= me), (m) => SEA[m - 1]) / aw;
    const na = (reason) => ({ na: true, reason, target: null, actual: null });
    if (f.div || f.dept || f.sub || f.line) return na('Divisi / departemen / item tidak memiliki pendapatan langsung — rasio tidak dihitung');
    const bus = f.bu ? [f.bu] : ['BU-SPA', 'BU-ESS'];
    if (f.bu === 'BU-OFC') return na('Shared Office tidak memiliki pendapatan langsung — gunakan basis BU penerima manfaat yang disetujui');
    if (u && u.role !== 'OWNER' && u.role !== 'FINANCE') {
      const acc = P7.access(s, u);
      if (!acc.ok) return na('Di luar lingkup akses');
      if (u.role === 'BU_MANAGER' && bus.some((b) => !u.scope.includes(b))) return na('Pendapatan konsolidasi hanya untuk Owner / Finance');
      if (u.role === 'HEAD_DIV' || u.role === 'SUPERVISOR') {
        if (!(u.role === 'SUPERVISOR' && f.loc && u.scope.includes(f.loc))) return na('Pendapatan BU di luar lingkup peran ini — rasio tidak ditampilkan');
      }
    }
    const tgt = (bu) => (s.targets.find((t) => t.fy === fy && t.bu === bu) || {});
    if (f.loc) {
      const o = S.org(s, f.loc);
      if (!o || o.type !== 'BRANCH') return na('Lokasi tingkat BU/kantor tidak memiliki pendapatan langsung');
      const bu = S.buOf(s, f.loc);
      const br = s.branchRevenue || {};
      const tot = U.sum(Object.keys(br).filter((k) => S.buOf(s, k) === bu), (k) => br[k]) || 1;
      const share = (br[f.loc] || 0) / tot;
      const t = tgt(bu);
      return { na: false, basis: `Outlet ${o.name} — target dialokasikan dari target BU menurut porsi pendapatan (DEMO)`, target: Math.round((t.revenue || 0) * share * tw), actual: fy === 2026 ? Math.round((br[f.loc] || 0) * actW) : 0, status: t.status, elimination: 0 };
    }
    const target = Math.round(U.sum(bus, (b) => (tgt(b).revenue || 0)) * tw);
    let actual = fy === 2026 ? Math.round(U.sum(bus, (b) => (s.actualRevenue || {})[b] || 0) * actW) : 0;
    let elimination = 0;
    if (bus.length > 1 && fy === 2026) {
      elimination = Math.round(U.sum((s.intercompany || []).filter((x) => bus.includes(x.from) && bus.includes(x.to)), (x) => x.revenueYtd) * actW);
      actual -= elimination;
    }
    return { na: false, basis: bus.length > 1 ? 'Konsolidasi Spa + Essence, eliminasi penjualan antar-BU' : S.orgName(s, bus[0]), target, actual, elimination, status: bus.map((b) => tgt(b).status).join('/') };
  };
  P7.profit = (s, f = {}, u) => {
    const fy = +(f.fy || 2026);
    const rev = P7.revenue(s, { fy, bu: f.bu, per: 'FY' }, u);
    if (f.loc || f.div || f.dept || f.bu === 'BU-OFC' || rev.na) return { na: true, reason: f.bu === 'BU-OFC' ? 'Shared Office adalah pusat biaya — biayanya dialokasikan ke BU' : 'Laba (P7) dilaporkan per BU / konsolidasi — tidak dipecah ke outlet/divisi di data DEMO' };
    const bus = f.bu ? [f.bu] : ['BU-SPA', 'BU-ESS'];
    let target = 0;
    let actual = 0;
    bus.forEach((bu) => {
      const b = s.budgets.find((x) => x.fy === fy && x.bu === bu);
      const pl = b && b.lines.find((x) => x.p === 'PROFIT');
      if (pl) {
        target += pl.revised;
        actual += fy === 2026 ? pl.baseActual : 0;
      }
    });
    let elim = 0;
    if (bus.length > 1 && fy === 2026) elim = U.sum((s.intercompany || []).filter((x) => bus.includes(x.from) && bus.includes(x.to)), (x) => x.unrealizedMargin);
    actual -= elim;
    const revFull = P7.revenue(s, { fy, bu: f.bu, per: 'YTD' }, u);
    return { na: false, target, actual, elimination: elim, margin: revFull.actual ? actual / revFull.actual : null, targetMargin: rev.target ? target / rev.target : null, note: 'Laba BU setelah alokasi biaya kantor pusat; konsolidasi mengeliminasi margin antar-BU yang belum terealisasi (DEMO)' };
  };
  P7.ratio = (num, den) => (den && isFinite(den) && den > 0 ? num / den : null);

  /* Office cost by beneficiary BU (memo — never added on top of BU totals) */
  P7.beneficiary = (s, q) => {
    const out = {};
    q.rows.filter((l) => l.bu === 'BU-OFC').forEach((l) => {
      const cc = P7.ccOf(s, l);
      const pool = (s.sharedAllocations || []).find((a) => a.pool === cc);
      const t = P7.sumPeriod([l], q.mm).actual;
      Object.entries(pool ? pool.splits : { 'BU-SPA': 0.5, 'BU-ESS': 0.5 }).forEach(([bu, r]) => (out[bu] = (out[bu] || 0) + t * r));
    });
    return out;
  };

  /* ======================= lineage, COA, tax ======================= */
  const TAXP = {
    PAYROLL: { ppn: 'Tidak relevan', pph: 'PPh 21 — dihitung payroll (agregat)', pbjt: '—', invoice: '—' },
    GOODS: { ppn: 'PPN masukan 11%', pph: '— (pembelian barang)', pbjt: '—' },
    SERVICE: { ppn: 'PPN masukan 11%', pph: 'PPh 23 — 2% jasa', pbjt: '—' },
    RENT: { ppn: 'PPN atas sewa (bila PKP)', pph: 'PPh 4(2) — sewa bangunan 10%', pbjt: '—' },
    EVENT: { ppn: 'PPN masukan 11%', pph: 'PPh 23 — jasa event', pbjt: 'PBJT bila venue hotel / restoran' },
    UTIL: { ppn: 'PPN (tagihan utilitas)', pph: '—', pbjt: '—' },
  };
  const taxKind = (l) => (l.p === 'PEOPLE' && l.sub !== 'Pelatihan & sertifikasi' ? 'PAYROLL' : l.p === 'PRODUCT' || l.kind === 'INVENTORY' || l.cls === 'CAPEX' ? 'GOODS' : l.sub === 'Sewa' ? 'RENT' : l.sub === 'Utilitas' ? 'UTIL' : l.sub === 'Event & aktivasi' ? 'EVENT' : 'SERVICE');
  P7.tax = (l, t) => {
    const k = taxKind(l);
    const base = TAXP[k];
    const h = hash((t && t.id) || l.id);
    const invoice = k === 'PAYROLL' ? '—' : ['Faktur pajak ada', 'Faktur pajak ada', 'Faktur belum diterima', 'Supplier non-PKP (tanpa faktur)'][h % 4];
    return {
      kind: k, ...base, invoice,
      credit: k === 'PAYROLL' ? '—' : invoice === 'Faktur pajak ada' ? 'Dapat dikreditkan — TO VERIFY status PKP & faktur' : 'Tidak dapat dikreditkan (belum ada faktur valid)',
      deductible: 'Perlu review fiskal — tanpa faktur PPN tidak otomatis non-deductible',
      review: h % 3 === 0 ? 'MENUNGGU REVIEW' : 'DIREVIEW (simulasi)',
      status: 'SIMULASI — keputusan pajak final oleh Tax Administration + konsultan',
    };
  };
  P7.coa = (l) => {
    const acc = (HAWK.SPEND && HAWK.SPEND.EXP_ACC) || {};
    if (l.cls === 'CAPEX') return { status: 'TO VERIFY', treatment: 'Kapitalisasi aset tetap → penyusutan (bukan beban saat beli)', account: 'Akun aset tetap HAWK — TO VERIFY', demo: null };
    if (l.kind === 'INVENTORY') return { status: 'TO VERIFY', treatment: 'Persediaan saat diterima → beban saat dipakai (stock issue)', account: 'Persediaan → ' + (acc[l.p] || 'akun beban') + ' (akun DEMO jurnal simulasi)', demo: acc[l.p] || null };
    return { status: 'TO VERIFY', treatment: 'Beban operasional diakui saat tagihan / akrual diverifikasi', account: (acc[l.p] || 'Akun beban HAWK') + ' (akun DEMO jurnal simulasi)', demo: acc[l.p] || null };
  };

  /* Transactions behind a line. Synthetic baseline rows (SIMULASI) + live session rows (real IDs, clickable). */
  P7.txns = (s, l, u) => {
    const out = [];
    const sup = s.suppliers || [];
    const h = hash(l.id);
    const me = Math.floor(months(s));
    const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    if (l.fy === 2026 && l.baseActual > 0) {
      if (taxKind(l) === 'PAYROLL') {
        const parts = split(l.baseActual, (s.season || []).slice(0, me));
        parts.forEach((amt, i) => out.push({ id: `SIM-PY-2026${String(i + 1).padStart(2, '0')}-${l.id.slice(-3)}`, date: `2026-${String(i + 1).padStart(2, '0')}-25`, type: 'PAYROLL_AGG', stage: 'ACTUAL', label: `Payroll agregat ${MN[i]} 2026 — ${l.name}`, party: 'Payroll engine HAWK (TO VERIFY)', amount: amt, synthetic: true, restricted: 'Rincian per karyawan dibatasi — hanya agregat' }));
      } else if (l.cls === 'CAPEX') {
        const real = l.asset && S.asset(s, l.asset);
        out.push({ id: real ? real.id : `SIM-AST-${l.id.slice(-3)}`, date: real ? real.acquired : '2026-06-30', type: 'ASSET_CAP', stage: 'ACTUAL', label: real ? `Kapitalisasi ${real.name}` : `Kapitalisasi ${l.name}`, party: 'Asset register', amount: l.baseActual, synthetic: !real, real: !!real, project: l.project });
      } else {
        const k = 3 + (h % 3);
        const parts = split(l.baseActual, Array.from({ length: k }, (_, i) => 1 + ((h >> (i * 3)) % 5)));
        parts.forEach((amt, i) => {
          const m = 1 + Math.floor(((i + 0.5) * me) / k);
          const sp = sup[(h + i) % (sup.length || 1)] || {};
          out.push({ id: `SIM-INV-${l.id.slice(-3)}${i + 1}`, date: `2026-${String(m).padStart(2, '0')}-${String(5 + ((h >> i) % 20)).padStart(2, '0')}`, type: l.sub === 'Sewa' ? 'ACCRUAL' : 'AP_BILL', stage: 'ACTUAL', label: l.sub === 'Sewa' ? `Akrual sewa ${MN[m - 1]} — ${l.name}` : `Tagihan ${l.name}`, party: l.sub === 'Sewa' ? 'Pemilik properti (DEMO)' : sp.name || 'Supplier (DEMO)', amount: amt, synthetic: true });
        });
      }
    }
    if (l.fy === 2026 && l.baseCommit > 0) out.push({ id: `SIM-PO-${l.id.slice(-3)}`, date: '2026-10-28', type: 'PO_OPEN', stage: 'COMMIT', label: `PO terbuka (belum diterima) — ${l.name}`, party: (sup[h % (sup.length || 1)] || {}).name || 'Supplier (DEMO)', amount: l.baseCommit, synthetic: true });
    (l.facts || []).forEach((f) => out.push({ id: f.id, ref: f.ref, date: String(f.ts).slice(0, 10), type: f.kind === 'ACTUAL' ? 'LIVE_ACTUAL' : 'LIVE_COMMIT', stage: f.kind === 'ACTUAL' ? 'ACTUAL' : 'COMMIT', label: f.label, party: f.source, amount: f.amount, synthetic: false, real: true }));
    // related procurement lineage (not counted again): POs / GRNs of the same SKU delivered to this outlet's warehouse
    if (l.sku) {
      const wh = (s.warehouses || []).find((w) => w.org === l.loc);
      (s.pos || []).filter((p) => wh && p.deliverTo === wh.id && (p.lines || []).some((x) => x.item === l.sku)).slice(0, 4).forEach((p) => out.push({ id: p.id, date: String(p.date).slice(0, 10), type: 'PO_LINEAGE', stage: 'LINEAGE', label: `PO ${p.status} — pengadaan persediaan (bukan beban sampai dipakai)`, party: (sup.find((x) => x.id === p.supplier) || {}).name || p.supplier, amount: U.sum((p.lines || []).filter((x) => x.item === l.sku), (x) => (x.qty || 0) * (x.price || 0)), synthetic: false, real: true, lineage: true }));
    }
    return out.map((t) => ({ ...t, tax: P7.tax(l, t), coa: P7.coa(l) }));
  };

  /* ======================= deterministic 7P insights (SIMULASI) ======================= */
  P7.insights = (s, u, f = {}) => {
    const q = P7.query(s, u, { ...f, p: undefined, sub: undefined, line: undefined });
    if (!q.acc.ok || !q.rows.length) return [];
    const rev = P7.revenue(s, f, u);
    const asOf = s.meta.demoDate;
    const byP = P7.group(s, q, 'p');
    const out = [];
    const nm = (p) => (HAWK.SEVEN_P.find((x) => x.key === p) || {}).name;
    const top = byP.filter((g) => g.utilization !== null).sort((a, b) => b.utilization - a.utilization)[0];
    if (top) {
      const lines = P7.group(s, { ...q, rows: top.rows }, 'line').sort((a, b) => (b.utilization || 0) - (a.utilization || 0)).slice(0, 3);
      out.push({ id: 'P7I-UTIL', p: top.key, sev: top.utilization > 1 ? 'HIGH' : top.utilization > 0.9 ? 'MEDIUM' : 'LOW', title: `${nm(top.key)}: penyerapan budget tertinggi (${U.pct(top.utilization)})`, fact: `Realisasi ${U.rp(top.actual, { short: true })} dari budget periode ${U.rp(top.budget, { short: true })} — sisa ${U.rp(top.available, { short: true })} setelah komitmen.`, hypo: 'Dapat dipicu volume transaksi, kenaikan harga, atau pembebanan yang dipercepat — perlu konfirmasi pemilik budget.', source: 'Budget 7P (NV-15/22) + realisasi transaksi (ledger, AP) — cube DEMO', asOf, evidence: lines.map((g) => ({ label: `${g.label} — ${U.pct(g.utilization)}`, line: g.key })), impact: `Risiko melampaui budget ${nm(top.key)} sebelum akhir periode.`, rec: 'Tinjau 3 baris terbesar; bila perlu ajukan realokasi lewat NV-22 (Owner memutuskan).', role: P7.stewardOf(s, top.rows[0]).user ? P7.stewardOf(s, top.rows[0]).user.name + ' (steward) + pemilik budget' : 'Pemilik budget', approval: 'Ya — realokasi butuh persetujuan Owner' });
    }
    ['PEOPLE', 'PROMOTION'].forEach((p) => {
      const g = byP.find((x) => x.key === p);
      if (!g) return;
      const rb = rev.na ? null : P7.ratio(g.budget, rev.target);
      const ra = rev.na ? null : P7.ratio(g.actual, rev.actual);
      out.push({ id: 'P7I-' + p, p, sev: rb !== null && ra !== null && ra > rb * 1.05 ? 'MEDIUM' : 'LOW', title: `Rasio ${nm(p)} / pendapatan`, fact: rev.na ? `Rasio tidak dihitung: ${rev.reason}.` : `Budget ${nm(p)} = ${U.pct(rb, 1)} dari target pendapatan; realisasi = ${U.pct(ra, 1)} dari pendapatan aktual (${rev.basis}).`, hypo: rev.na ? 'Gunakan basis BU penerima manfaat bila Owner menyetujuinya.' : ra > rb ? 'Pendapatan aktual di bawah target membuat rasio naik walau belanja sesuai rencana — bedakan efek pendapatan dan efek biaya.' : 'Rasio aktual masih di bawah rasio budget.', source: 'Finance revenue (DEMO) + budget 7P', asOf, evidence: P7.group(s, { ...q, rows: g.rows }, 'bu').map((x) => ({ label: `${x.label}: ${U.rp(x.actual, { short: true })}`, f: { p, bu: x.key } })), impact: p === 'PEOPLE' ? 'Produktivitas SDM (pendapatan per biaya People).' : 'Efektivitas promosi terhadap pendapatan.', rec: p === 'PEOPLE' ? 'HRD (steward People) meninjau bersama pemilik biaya unit; tidak ada perubahan budget otomatis.' : 'Komersil (steward Promotion) mengevaluasi kampanye dengan ROI terendah.', role: p === 'PEOPLE' ? 'Manager Divisi HRD' : 'Manager Divisi Komersil', approval: 'Ya — keputusan manusia' });
    });
    const lines = P7.group(s, q, 'line');
    const over = lines.filter((g) => g.forecast > g.budget * 1.0001).sort((a, b) => b.forecast - b.budget - (a.forecast - a.budget))[0];
    if (over) out.push({ id: 'P7I-FCST', p: over.rows[0].p, sev: 'HIGH', title: `Forecast melampaui budget: ${over.label}`, fact: `Forecast ${U.rp(over.forecast, { short: true })} vs budget ${U.rp(over.budget, { short: true })} (selisih ${U.rp(over.forecast - over.budget, { short: true })}).`, hypo: 'Laju realisasi + komitmen terbuka di atas rencana; bisa karena pembayaran dipercepat atau volume lebih tinggi.', source: 'Forecast = aktual + maks(komitmen, run-rate) — estimasi, bukan otorisasi budget', asOf, evidence: [{ label: over.label, line: over.key }], impact: 'Butuh realokasi atau penghematan sebelum Desember.', rec: 'Pemilik budget menyiapkan revisi (NV-22); reforecast bukan otorisasi budget.', role: (P7.ownerOf(s, over.rows[0]) || {}).name || 'Pemilik budget', approval: 'Ya — Owner' });
    const anomaly = lines.filter((g) => g.utilization !== null && g.utilization > 1.12).sort((a, b) => b.utilization - a.utilization)[0];
    if (anomaly && (!over || anomaly.key !== over.key)) out.push({ id: 'P7I-ANOM', p: anomaly.rows[0].p, sev: 'MEDIUM', title: `Belanja tidak biasa: ${anomaly.label}`, fact: `Realisasi ${U.pct(anomaly.utilization)} dari budget periode yang sama.`, hypo: 'Kemungkinan pembebanan ganda, salah klasifikasi 7P, atau pembayaran di muka — perlu dicek ke dokumen sumber.', source: 'Cube 7P DEMO', asOf, evidence: [{ label: anomaly.label, line: anomaly.key }], impact: 'Akurasi laporan 7P & kontrol budget.', rec: 'Finance memeriksa dokumen sumber dan klasifikasi; koreksi lewat jurnal HAWK, bukan dari layar 7P.', role: 'Finance Manager', approval: 'Ya — koreksi oleh Finance' });
    return out;
  };

  /* ======================= XLSX writer (stored ZIP + SpreadsheetML; no dependencies) ======================= */
  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  const crc32 = (b) => {
    let c = 0xffffffff;
    for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const enc = (str) => (typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(str) : Uint8Array.from(Buffer.from(str, 'utf8')));
  function zip(files) {
    const chunks = [];
    const central = [];
    let off = 0;
    const u16 = (v) => [v & 255, (v >> 8) & 255];
    const u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
    files.forEach(({ name, data }) => {
      const nb = enc(name);
      const d = typeof data === 'string' ? enc(data) : data;
      const crc = crc32(d);
      const head = [...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(d.length), ...u32(d.length), ...u16(nb.length), ...u16(0)];
      chunks.push(Uint8Array.from(head), nb, d);
      central.push([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(d.length), ...u32(d.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)], nb);
      off += head.length + nb.length + d.length;
    });
    let cdSize = 0;
    const cd = [];
    for (let i = 0; i < central.length; i += 2) {
      const a = Uint8Array.from(central[i]);
      cd.push(a, central[i + 1]);
      cdSize += a.length + central[i + 1].length;
    }
    const end = Uint8Array.from([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(off), ...u16(0)]);
    const all = [...chunks, ...cd, end];
    const out = new Uint8Array(U.sum(all, (x) => x.length));
    let p = 0;
    all.forEach((x) => {
      out.set(x, p);
      p += x.length;
    });
    return out;
  }
  const xesc = (v) => String(v).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  const colName = (i) => {
    let s = '';
    i += 1;
    while (i > 0) {
      const m = (i - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      i = Math.floor((i - 1) / 26);
    }
    return s;
  };
  const sheetXml = (rows) =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows
      .map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => {
        const ref = colName(ci) + (ri + 1);
        if (v === null || v === undefined || v === '') return '';
        if (typeof v === 'number' && isFinite(v)) return `<c r="${ref}"${ri === 0 ? ' s="1"' : ''}><v>${Math.round(v * 100) / 100}</v></c>`;
        return `<c r="${ref}" t="inlineStr"${ri === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xesc(v)}</t></is></c>`;
      }).join('')}</row>`)
      .join('')}</sheetData></worksheet>`;
  /* sheets: [{ name, rows: [[...], ...] }] → Uint8Array (.xlsx) */
  P7.xlsx = (sheets) => {
    const files = [
      { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sh, i) => `<sheet name="${xesc(sh.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
      { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' },
      ...sheets.map((sh, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(sh.rows) })),
    ];
    return zip(files);
  };
  P7.zip = zip;

  /* Export rows for the authorized, filtered scope (summary + detail). People lines are aggregates only. */
  P7.exportSheets = (s, u, f) => {
    const q = P7.query(s, u, f);
    const per = (P7.PERIODS.find((x) => x[0] === (f.per || 'FY')) || ['FY', 'Setahun'])[1];
    const flt = (k) => (f[k] ? P7.label(s, k, f[k]) : 'Semua');
    const rev = P7.revenue(s, f, u);
    const meta = [
      ['HAWK × JAENS — Laporan 7P Master Financial Control'],
      ['DEMO / SIMULASI — bukan data keuangan produksi; COA & sumber TO VERIFY'],
      ['Dibuat oleh', `${u.name} (${HAWK.ROLE_LABEL ? HAWK.ROLE_LABEL[u.role] : u.role})`],
      ['Lingkup akses', q.acc.label + (q.mode ? ' · ' + q.mode.label : '')],
      ['Per tanggal (as-of)', s.meta.demoDate],
      ['Tahun fiskal', 'FY' + q.fy],
      ['Periode', per],
      ['BU', flt('bu')], ['Outlet / Office', flt('loc')], ['Divisi', flt('div')], ['Departemen', flt('dept')], ['7P', flt('p')], ['Subkategori', f.sub || 'Semua'],
      ['Jenis dana', f.cls ? P7.CLASS_LABEL[f.cls] || f.cls : 'Semua (OPEX + CAPEX + Inventory)'], ['Management stream', f.stream || 'Operational + Innovation'],
      ['Komitmen', q.commitNote],
      [],
      ['Kode 7P', 'Kategori', 'Revised (periode)', 'Original (FY)', 'Actual', 'Committed', 'Available', 'Forecast', 'Variance (actual − revised)', 'Utilisasi %', '% Target Revenue', 'Catatan sumber'],
    ];
    P7.group(s, q, 'p').forEach((g) => meta.push([CODE[g.key], P7.label(s, 'p', g.key).replace(/^P\d /, ''), g.budget, g.original, g.actual, g.commitment, g.available, g.forecast, g.variance, g.utilization === null ? 'N/A' : Math.round(g.utilization * 1000) / 10, rev.na ? 'N/A' : Math.round((g.budget / (rev.target || 1)) * 1000) / 10, 'Budget engine + transaksi HAWK (DEMO)']));
    meta.push(['TOTAL P1–P6', '', q.totals.budget, q.totals.original, q.totals.actual, q.totals.commitment, q.totals.available, q.totals.forecast, q.totals.variance, q.totals.utilization === null ? 'N/A' : Math.round(q.totals.utilization * 1000) / 10, rev.na ? 'N/A' : Math.round((q.totals.budget / (rev.target || 1)) * 1000) / 10, 'P7 Profit tidak dijumlahkan']);
    const pr = P7.profit(s, f, u);
    meta.push([]);
    meta.push(['P7 Profit (outcome)', pr.na ? 'N/A — ' + pr.reason : 'Target', pr.na ? '' : pr.target, pr.na ? '' : 'Aktual YTD', pr.na ? '' : pr.actual, pr.na ? '' : 'Margin %', pr.na || pr.margin === null ? '' : Math.round(pr.margin * 1000) / 10]);
    const detail = [['Periode', 'FY', 'Budget line ID', 'BU', 'Outlet / Office', 'Divisi', 'Departemen', 'Cost center', 'Kode 7P', 'Subkategori', 'Budget item', 'Jenis dana', 'Stream', 'Revised (periode)', 'Original (FY)', 'Actual', 'Committed', 'Available', 'Forecast', 'Variance', 'COA (status)', 'Catatan sumber']];
    q.rows.forEach((l) => {
      const t = P7.sumPeriod([l], q.mm);
      const ca = commitApplies(s, q.mm);
      detail.push([per, q.fy, l.id, P7.label(s, 'bu', l.bu), P7.locName(s, l.loc), S.orgName(s, l.div), (P7.dept(s, l.dept) || {}).name || '', P7.ccOf(s, l) || '', CODE[l.p], l.sub, l.p === 'PEOPLE' ? l.name + ' (agregat)' : l.name, P7.CLASS_LABEL[l.kind] || l.kind, l.stream, t.budget, l.original, t.actual, ca ? t.commitment : 0, ca ? t.available : t.budget - t.actual, t.forecast, t.variance, 'TO VERIFY', l.fy === 2026 ? 'Cube DEMO dari budget terkunci + transaksi sesi' : 'Rencana ' + l.status + ' (belum disetujui)']);
    });
    return { q, sheets: [{ name: 'Ringkasan 7P', rows: meta }, { name: 'Detail budget line', rows: detail }] };
  };

  /* ======================= adapter boundary ======================= */
  // DEMO mode = deterministic fixtures above; HAWK_API mode = NOT_CONNECTED until the HAWK team verifies each operation.
  const notConnected = (op) => ({ ok: false, error: { code: 'NOT_CONNECTED', message: `${op}: belum terhubung ke HAWK engine (TO VERIFY)` } });
  P7.adapter = {
    mode: 'DEMO',
    call(op, s, u, args) {
      if (this.mode !== 'DEMO') return notConnected(op);
      const f = args || {};
      const fn = {
        'org.getAuthorizedTree': () => ({ org: s.org.filter((o) => o.status === 'ACTIVE'), departments: s.departments, access: P7.access(s, u).label }),
        'budget.get7PTaxonomy': () => s.p7Taxonomy,
        'budget.getPerformanceCube': () => {
          const q = P7.query(s, u, f);
          return { asOf: q.asOf, totals: q.totals, rows: q.rows.length };
        },
        'budget.getBudgetLineLineage': () => {
          const l = P7.lines(s, +(f.fy || 2026)).find((x) => x.id === f.id);
          return l && P7.access(s, u).pred(l) ? { line: l, txns: P7.txns(s, l, u) } : null;
        },
        'finance.getAuthorizedRevenueProfit': () => ({ revenue: P7.revenue(s, f, u), profit: P7.profit(s, f, u) }),
        'finance.resolveExistingCOAMapping': () => ({ status: 'TO VERIFY' }),
        'tax.getReviewStatus': () => ({ status: 'SIMULASI' }),
        'documents.openAuthorizedEvidence': () => ({ status: 'SIMULASI — SOURCE TO VERIFY' }),
      }[op];
      if (!fn) return { ok: false, error: { code: 'NO_OPERATION', message: op } };
      return { ok: true, data: fn(), mode: 'DEMO' };
    },
  };
  P7.OPS = [
    ['org.getAuthorizedTree', 'Organization', 'TO VERIFY', '{ asOf? }', 'OrgUnit[] + Department[] dalam lingkup akses'],
    ['budget.get7PTaxonomy', 'Budget / 7P registry', 'NEW INTEGRATION REQUIRED', '{ asOf? }', 'Category { p, code, subs[], steward, effectiveFrom }[]'],
    ['budget.getPerformanceCube', 'Budget + Finance + Procurement', 'NEW INTEGRATION REQUIRED', '{ fy, per, bu?, loc?, div?, dept?, p?, sub?, cls?, stream?, page? }', '{ asOf, totals, rows[] (original, revised, actual, commitment, forecast per baris) }'],
    ['budget.getBudgetLineLineage', 'Budget + MRF/PO/GRN/AP/GL/Payroll/Asset', 'NEW INTEGRATION REQUIRED', '{ id }', '{ line, txns[] (stage ACTUAL|COMMIT|LINEAGE, sumber, dokumen) }'],
    ['finance.getAuthorizedRevenueProfit', 'Finance / GL', 'TO VERIFY', '{ fy, per, bu?, loc? }', '{ revenue{target,actual,elimination}, profit{target,actual,margin} } atau N/A + alasan'],
    ['finance.resolveExistingCOAMapping', 'Finance / GL (COA existing)', 'TO VERIFY', '{ transactionLineId }', '{ coaAccountId, treatment, effectiveDate } — tidak membuat COA baru'],
    ['tax.getReviewStatus', 'Tax Administration', 'NEW INTEGRATION REQUIRED', '{ transactionLineId }', '{ ppn, pph, pbjt, invoiceStatus, creditable, deductible, reviewStatus }'],
    ['documents.openAuthorizedEvidence', 'Document service', 'NEW INTEGRATION REQUIRED', '{ documentId }', 'URL bertanda tangan sementara (server) — tidak ada URL publik'],
    ['report.export7P', 'Reporting (server)', 'NEW INTEGRATION REQUIRED', '{ filters, format xlsx|pdf }', 'File + audit EXPORT_7P'],
  ];

  /* export = a write op so it is audited (production: server-side, with logging) */
  const H = HAWK.handlers;
  if (H && HAWK.engine) {
    H['report.export7P'] = (s, p, ctx) => {
      const f = p.filters || {};
      const acc = P7.access(s, ctx.user.id ? s.users.find((x) => x.id === ctx.user.id) || ctx.user : ctx.user);
      HAWK.engine.need(acc.ok && acc.export, 'FORBIDDEN', 'Akun ini tidak berwenang mengekspor laporan 7P');
      HAWK.engine.need(['xlsx', 'pdf'].includes(p.format), 'VALIDATION', 'Format harus xlsx atau pdf');
      const q = P7.query(s, s.users.find((x) => x.id === ctx.user.id) || ctx.user, f);
      const keys = Object.keys(f).filter((k) => f[k]).map((k) => `${k}=${f[k]}`).join(', ') || 'tanpa filter';
      HAWK.engine.log(s, ctx, 'report.export7P', p.format.toUpperCase(), `EXPORT_7P ${p.format} · ${q.rows.length} baris · ${keys} · ${acc.label}`);
      return { rows: q.rows.length, total: q.totals.budget, actual: q.totals.actual, format: p.format, scope: acc.label };
    };
  }

  /* seed wrap — schema bump resets stored demo state */
  const baseSeed = HAWK.seed;
  if (baseSeed && !baseSeed.__p7) {
    HAWK.seed = function () {
      const s = baseSeed();
      s.meta.schema = 13; // 13: Niken Super Admin = akses penuh setara Owner (9 Nov 2026)
      seedExt(s);
      return s;
    };
    HAWK.seed.__p7 = true;
  }
})(typeof window !== 'undefined' ? window : globalThis);
