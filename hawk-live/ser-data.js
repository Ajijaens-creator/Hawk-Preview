/* HAWK ERP · SER fixture (DATA DEMO / SIMULASI)
   Synthetic, deterministic source data for the Commercial Executive Summary (F1-02) and its
   drill-down (F1-03). Every KPI, chart and table is aggregated from the rows generated here;
   nothing on the dashboard is typed in as a finished number.

   Source model (stable IDs, separate dimensions):
     outlet OUT-*, member MBR-*, campaign CMP-*, partner PTN-* / DRV-*, contract KTR-*,
     customer CUS-*, lead LEAD-*, booking BK-*, POS transaction POS-*, budget line BGL-*, MRF-*.
     Acquisition source, contact channel, confirmation path, sales method and referral code
     are stored as separate fields. Revenue = POS transactions with status "paid" (refunds excluded).
     Pipeline / contract value never enters revenue.

   Reconciliation targets (from visual/F1-02-spec.md, at Reset Demo):
     Aug 2026 all outlets: revenue Rp2.820 jt, target Rp3.190 jt, 3.195 customers, 3.260 orders.
     Aug 2026 Ubud: revenue Rp1.680 jt, 1.880 customers, marketing budget Rp120 jt, actual Rp63 jt.

   The sandbox model (model.js) is connected: its bookings become POS rows in Giant Spa Ubud,
   August 2026, and its Commercial Budget (CMP-001) is one line of Ubud's August marketing budget. */
const SER = (() => {
  const JT = 1000000;
  const OUTLETS = [
    { id: 'OUT-UBD', key: 'ubud', code: 'UBD', name: 'Giant Spa Ubud' },
    { id: 'OUT-SHT', key: 'shanti', code: 'SHT', name: 'Giant Spa Shanti' },
    { id: 'OUT-BSM', key: 'bisma', code: 'BSM', name: 'Giant Spa Bisma', note: 'Pembukaan September 2026 · belum ada transaksi POS' }
  ];
  const PERIODS = [
    { id: '2026-08', month: 8, label: 'Agustus 2026' },
    { id: '2026-07', month: 7, label: 'Juli 2026' }
  ];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  /* Monthly revenue history, Rp juta. 2025 = full year; 2026 = Jan–Aug. Jun–Aug 2026 are also
     generated as POS rows below and reconcile exactly to these values. */
  const HISTORY = {
    ubud: { y2026: [1080, 1110, 1240, 1210, 1300, 1410, 1520, 1680], y2025: [940, 1020, 1110, 1140, 1130, 1260, 1350, 1440, 1490, 1450, 1520, 1610] },
    shanti: { y2026: [760, 780, 840, 890, 940, 980, 1070, 1140], y2025: [620, 675, 690, 740, 810, 830, 870, 930, 970, 960, 990, 1050] },
    bisma: { y2026: [], y2025: [] }
  };
  /* Per outlet-month plan fixture: paid orders, unique customers, revenue target (jt),
     marketing budget (jt), marketing actual (jt). */
  const PLAN = {
    6: { ubud: [1650, 1640, 1710, 105, 51], shanti: [1190, 1170, 1270, 80, 40] },
    7: { ubud: [1760, 1740, 1800, 115, 56], shanti: [1260, 1240, 1290, 82, 45] },
    8: { ubud: [1920, 1880, 1850, 120, 63], shanti: [1340, 1315, 1340, 90, 48] }
  };
  const TREATMENTS = [
    { id: 'TRT-REF60', name: 'Reflexology', minutes: 60, price: 350000, w: 10 },
    { id: 'TRT-BAL60', name: 'Balinese Massage', minutes: 60, price: 450000, w: 18 },
    { id: 'TRT-WEL60', name: 'Wellness Massage', minutes: 60, price: 750000, w: 24 },
    { id: 'TRT-HOT90', name: 'Hot Stone Therapy', minutes: 90, price: 950000, w: 18 },
    { id: 'TRT-CPL120', name: 'Couple Package', minutes: 120, price: 1250000, w: 16 },
    { id: 'TRT-SIG150', name: 'Signature Ritual', minutes: 150, price: 1650000, w: 14 }
  ];
  const CAMPAIGNS = [
    { id: 'CMP-001', name: 'Wellness Escape', outlet: 'OUT-UBD', channel: 'Instagram', sandbox: true },
    { id: 'CMP-002', name: 'Sunset Ritual Shanti', outlet: 'OUT-SHT', channel: 'Instagram' },
    { id: 'CMP-003', name: 'Google Search Always-on', outlet: '', channel: 'Google Ads' },
    { id: 'CMP-004', name: 'Bali Wellness Week KOL', outlet: '', channel: 'KOL' }
  ];
  const PARTNERS = [
    { id: 'PTN-001', type: 'Hotel', name: 'Ubud Hotel Demo', outlet: 'OUT-UBD', contract: 'KTR-001', model: 'Guest Referral', rate: 0.15 },
    { id: 'PTN-002', type: 'Villa', name: 'Villa Sawah Demo', outlet: 'OUT-UBD', contract: 'KTR-002', model: 'Guest Referral', rate: 0.12 },
    { id: 'PTN-003', type: 'Hotel', name: 'Shanti Resort Demo', outlet: 'OUT-SHT', contract: 'KTR-003', model: 'Guest Referral', rate: 0.15 },
    { id: 'DRV-001', type: 'Driver', name: 'Driver Demo', outlet: '', contract: 'KTR-D01', model: 'Driver Referral', rate: 0.1 },
    { id: 'DRV-002', type: 'Driver', name: 'Driver Demo 2', outlet: '', contract: 'KTR-D02', model: 'Driver Referral', rate: 0.1 }
  ];
  const MEMBERS = [
    { id: 'MBR-C01', name: 'Rani', team: 'Commercial', group: 'Content' },
    { id: 'MBR-C02', name: 'Bayu', team: 'Commercial', group: 'Digital' },
    { id: 'MBR-S01', name: 'Dewa', team: 'Sales', group: 'Reservasi' },
    { id: 'MBR-S02', name: 'Sari', team: 'Sales', group: 'Reservasi' },
    { id: 'MBR-S03', name: 'Komang', team: 'Sales', group: 'B2B' }
  ];
  /* Acquisition source → channel group. Contact channel, confirmation path and sales method are
     separate dimensions. "Tidak diketahui" is kept when the source is empty. */
  const SOURCES = [
    { source: 'Meta Ads', group: 'Paid', p: 0.22 },
    { source: 'Google Ads', group: 'Paid', p: 0.14 },
    { source: 'Organic Social', group: 'Organic & Direct', p: 0.12 },
    { source: 'Website / SEO', group: 'Organic & Direct', p: 0.1 },
    { source: 'Walk-in', group: 'Organic & Direct', p: 0.09 },
    { source: 'Repeat / Direct', group: 'Organic & Direct', p: 0.08 },
    { source: 'Hotel Partner', group: 'Partner & Referral', p: 0.13 },
    { source: 'Driver Referral', group: 'Partner & Referral', p: 0.09 },
    { source: '', group: 'Tidak diketahui', p: 0.03 }
  ];
  const GROUPS = ['Paid', 'Organic & Direct', 'Partner & Referral', 'Tidak diketahui'];
  const COUNTRIES = [['Indonesia', 0.46], ['Australia', 0.26], ['Singapura', 0.06], ['Amerika Serikat', 0.05], ['Inggris', 0.04], ['Jepang', 0.04], ['Malaysia', 0.03], ['Lainnya', 0.03], ['Tidak diketahui', 0.03]];
  const CANCEL_REASONS = { Jadwal: 'Jadwal tamu berubah', Tamu: 'Tamu membatalkan' };
  const SANDBOX_DATE = '2026-08-31';

  /* Deterministic PRNG so every Reset Demo gives the same rows. */
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const pick = (r, list, weight) => { const total = list.reduce((s, x) => s + weight(x), 0); let v = r() * total; for (const x of list) { v -= weight(x); if (v <= 0) return x; } return list[list.length - 1]; };
  const pad = (n, w) => String(n).padStart(w, '0');
  const daysIn = (m) => new Date(2026, m, 0).getDate();

  function contactFor(group, source, r) {
    if (group === 'Paid') return [pick(r, [['WhatsApp', 6], ['Instagram DM', 3], ['Website', 2]], x => x[1])[0], r() < 0.55 ? 'Chatbot → staf' : 'Staf reservasi'];
    if (source === 'Organic Social') return [pick(r, [['Instagram DM', 5], ['WhatsApp', 4], ['Facebook', 1]], x => x[1])[0], r() < 0.5 ? 'Chatbot' : 'Staf reservasi'];
    if (source === 'Website / SEO') return ['Website', 'Booking online'];
    if (source === 'Walk-in') return ['Walk-in', 'Front desk'];
    if (source === 'Repeat / Direct') return [r() < 0.6 ? 'WhatsApp' : 'Telepon', 'Staf reservasi'];
    if (source === 'Hotel Partner') return ['Telepon', 'Konfirmasi partner'];
    if (source === 'Driver Referral') return [r() < 0.5 ? 'Telepon' : 'Portal driver', 'Konfirmasi partner'];
    return ['Tidak diketahui', 'Tidak diketahui'];
  }

  function generateBase() {
    const tx = [], customers = new Map(), leads = [], cancellations = [], budgetLines = [];
    for (const outlet of OUTLETS) {
      const pool = [];
      const r = rng(outlet.code.charCodeAt(0) * 7919 + outlet.code.charCodeAt(1) * 104729);
      const newCustomer = () => {
        const id = `CUS-${outlet.code}-${pad(pool.length + 1, 5)}`;
        const country = pick(r, COUNTRIES, x => x[1])[0];
        const c = { id, outlet: outlet.id, country, firstPeriod: null };
        pool.push(c); customers.set(id, c); return c;
      };
      for (const m of [6, 7, 8]) {
        const plan = PLAN[m][outlet.key];
        if (!plan) continue;
        const [orders, uniq, target, budget, spend] = plan;
        const period = `2026-${pad(m, 2)}`;
        const revenue = HISTORY[outlet.key].y2026[m - 1] * JT;
        /* customers of this month: ~38% returning from earlier months, rest new */
        const monthCustomers = [];
        const returning = Math.min(pool.length, Math.round(uniq * 0.38));
        const start = pool.length ? Math.floor(r() * Math.max(1, pool.length - returning)) : 0;
        for (let i = 0; i < returning; i++) monthCustomers.push(pool[start + i]);
        while (monthCustomers.length < uniq) monthCustomers.push(newCustomer());
        const rows = [];
        for (let i = 0; i < orders; i++) {
          const customer = i < uniq ? monthCustomers[i] : monthCustomers[Math.floor(r() * uniq)];
          const s = pick(r, SOURCES, x => x.p);
          const t = pick(r, TREATMENTS, x => x.w);
          const guests = t.id === 'TRT-CPL120' ? 1 : (r() < 0.14 ? 2 : 1);
          const [contact, confirm] = contactFor(s.group, s.source, r);
          let campaign = '', partner = '', code = '';
          if (s.source === 'Meta Ads') campaign = outlet.key === 'ubud' ? (r() < 0.7 ? 'CMP-001' : 'CMP-004') : (r() < 0.7 ? 'CMP-002' : 'CMP-004');
          else if (s.source === 'Google Ads') campaign = 'CMP-003';
          else if (s.source === 'Organic Social' && r() < 0.35) campaign = outlet.key === 'ubud' ? 'CMP-001' : 'CMP-002';
          if (s.source === 'Hotel Partner') { const ps = PARTNERS.filter(p => p.outlet === outlet.id); partner = ps[Math.floor(r() * ps.length)].id; }
          if (s.source === 'Driver Referral') { partner = r() < 0.6 ? 'DRV-001' : 'DRV-002'; code = partner === 'DRV-001' ? 'REF-DRV001' : 'REF-DRV002'; }
          const method = s.source === 'Hotel Partner' ? 'B2B' : s.source === 'Driver Referral' ? 'Referral' : 'B2C';
          const day = 1 + Math.floor(r() * daysIn(m));
          rows.push({
            id: `POS-${outlet.code}-${period.slice(2).replace('-', '')}-${pad(i + 1, 5)}`,
            booking: `BK-${outlet.code}-${period.slice(2).replace('-', '')}-${pad(i + 1, 5)}`,
            lead: method === 'B2C' && contact !== 'Walk-in' && contact !== 'Tidak diketahui' ? `LEAD-${outlet.code}-${period.slice(2).replace('-', '')}-${pad(i + 1, 5)}` : '',
            outlet: outlet.id, period, date: `${period}-${pad(day, 2)}`, customer: customer.id,
            treatment: t.id, treatmentName: t.name, guests, listPrice: t.price * guests, amount: t.price * guests,
            source: s.source, group: s.group, contact, confirm, method, campaign, partner, referralCode: code,
            therapist: `MBR-T${outlet.code}${pad(1 + Math.floor(r() * 14), 2)}`, status: 'paid', sandbox: false
          });
        }
        /* BK-001 (sandbox booking already paid at reset) is one of Ubud's August transactions. */
        if (outlet.key === 'ubud' && m === 8) Object.assign(rows[rows.length - 1], { id: 'POS-BK-001', booking: 'BK-001', lead: '', treatment: 'TRT-WEL60', treatmentName: 'Wellness Massage', guests: 1, listPrice: 750000, amount: 750000, source: 'Website / SEO', group: 'Organic & Direct', contact: 'Website', confirm: 'Booking online', method: 'B2C', campaign: '', partner: '', referralCode: '', date: '2026-08-02', sandboxLinked: true });
        /* Scale list prices to the monthly revenue fixture (add-ons and promo discounts), round to Rp1.000,
           then spread the rounding remainder so the month reconciles to the rupiah. */
        const fixed = rows.filter(x => x.sandboxLinked), free = rows.filter(x => !x.sandboxLinked);
        const goal = revenue - fixed.reduce((s, x) => s + x.amount, 0);
        const listTotal = free.reduce((s, x) => s + x.listPrice, 0);
        free.forEach(x => { x.amount = Math.round(x.listPrice * goal / listTotal / 1000) * 1000; });
        let diff = goal - free.reduce((s, x) => s + x.amount, 0);
        for (let i = 0; diff !== 0; i = (i + 1) % free.length) { const step = Math.sign(diff) * Math.min(Math.abs(diff), 1000); free[i].amount += step; diff -= step; }
        rows.forEach(x => {
          x.adjustment = x.amount - x.listPrice;
          x.directCost = Math.round(x.amount * 0.34 / 1000) * 1000;
          const p = PARTNERS.find(p => p.id === x.partner);
          x.commission = p ? Math.round(x.amount * p.rate) : 0;
          const c = customers.get(x.customer); if (!c.firstPeriod) c.firstPeriod = period;
        });
        /* Refunded transactions: kept in POS, excluded from revenue, orders and customers. */
        const refunds = Math.round(orders * 0.006);
        for (let i = 0; i < refunds; i++) {
          const src = rows[Math.floor(r() * rows.length)];
          rows.push({ ...src, id: `${src.id}-RF${i + 1}`, booking: `${src.booking}-R${i + 1}`, lead: '', customer: src.customer, status: 'refunded', refundReason: r() < 0.5 ? 'Keluhan layanan' : 'Pembayaran ganda' });
        }
        tx.push(...rows);
        /* Leads: converted (linked to a booking) plus open/lost leads without POS. */
        rows.filter(x => x.lead && x.status === 'paid').forEach(x => leads.push({ id: x.lead, outlet: outlet.id, period, source: x.source || 'Tidak diketahui', contact: x.contact, campaign: x.campaign, status: 'booked', booking: x.booking }));
        const open = Math.round(leads.filter(l => l.period === period && l.outlet === outlet.id).length * 0.45);
        for (let i = 0; i < open; i++) { const s = pick(r, SOURCES.filter(s => s.group === 'Paid' || s.source === 'Organic Social'), x => x.p); leads.push({ id: `LEAD-${outlet.code}-${period.slice(2).replace('-', '')}-N${pad(i + 1, 4)}`, outlet: outlet.id, period, source: s.source, contact: contactFor(s.group, s.source, r)[0], campaign: s.source === 'Google Ads' ? 'CMP-003' : (outlet.key === 'ubud' ? 'CMP-001' : 'CMP-002'), status: r() < 0.6 ? 'lost' : 'open', booking: '' }); }
        /* Cancellations by branch and reason (no POS row). */
        const sched = outlet.key === 'ubud' ? 11 + m : 7 + m, guest = outlet.key === 'ubud' ? 8 + m : 5 + m;
        [['Jadwal', sched], ['Tamu', guest]].forEach(([reason, n]) => { for (let i = 0; i < n; i++) cancellations.push({ id: `BK-${outlet.code}-${period.slice(2).replace('-', '')}-C${reason[0]}${pad(i + 1, 3)}`, outlet: outlet.id, period, date: `${period}-${pad(1 + Math.floor(r() * daysIn(m)), 2)}`, reason, reasonLabel: CANCEL_REASONS[reason], treatment: pick(r, TREATMENTS, x => x.w).name }); });
        /* Marketing budget lines (Rp). Ubud August contains the sandbox campaign CMP-001. */
        const lines = outlet.key === 'ubud' && m === 8
          ? [['BGL-UBD-2608-01', 'CMP-001 Wellness Escape (sandbox)', 'ads', 25, null, 'CMP-001'], ['BGL-UBD-2608-02', 'Meta Ads always-on', 'ads', 40, 29.5, 'CMP-004'], ['BGL-UBD-2608-03', 'Google Ads search', 'ads', 30, 18, 'CMP-003'], ['BGL-UBD-2608-04', 'KOL & media partner', 'kol', 15, 8, 'CMP-004'], ['BGL-UBD-2608-05', 'Brand & materi cetak', 'brand', 10, 4, '']]
          : [['01', 'Meta Ads', 'ads', 0.4, 0.45], ['02', 'Google Ads search', 'ads', 0.28, 0.3], ['03', 'KOL & media partner', 'kol', 0.17, 0.15], ['04', 'Brand & materi cetak', 'brand', 0.15, 0.1]].map(([n, name, type, bs, ss]) => [`BGL-${outlet.code}-${period.slice(2).replace('-', '')}-${n}`, name, type, budget * bs, spend * ss, type === 'ads' ? (outlet.key === 'ubud' ? 'CMP-001' : 'CMP-002') : '']);
        lines.forEach(([id, name, type, pagu, actual, campaign], i) => budgetLines.push({ id, outlet: outlet.id, period, name, type, campaign, pagu: Math.round(pagu * JT), actual: actual === null ? null : Math.round(actual * JT), committed: 0, mrf: actual === null ? 'sandbox' : `MRF-${outlet.code}-${period.slice(2).replace('-', '')}-${pad(i + 1, 2)}` }));
        /* round the generated line split so totals equal the plan exactly */
        const own = budgetLines.filter(b => b.outlet === outlet.id && b.period === period);
        if (!(outlet.key === 'ubud' && m === 8)) {
          own[own.length - 1].pagu += budget * JT - own.reduce((s, b) => s + b.pagu, 0);
          own[own.length - 1].actual += spend * JT - own.reduce((s, b) => s + b.actual, 0);
        }
        Object.assign(PLAN_INDEX[`${outlet.id}|${period}`] = {}, { target: target * JT, budget: budget * JT, spend: spend * JT });
      }
    }
    return { tx, customers, leads, cancellations, budgetLines };
  }
  const PLAN_INDEX = {};
  const BASE = generateBase();

  /* ---------- connect the sandbox (model.js state) ---------- */
  function sandboxView(state) {
    const t = state ? HAWK.totals(state) : { actual: 3500000, committed: 0 };
    const sbxTx = [], sbxCustomers = [];
    const bk1 = state && state.bookings.find(b => b.id === 'BK-001');
    if (state) state.bookings.filter(b => b.id !== 'BK-001').forEach((b, i) => {
      if (!['paid', 'refunded'].includes(b.status)) return;
      const partner = b.partner ? PARTNERS.find(p => p.id === b.partner) : null;
      const isLead = !!b.lead;
      const source = partner ? 'Driver Referral' : b.source === 'Instagram' ? 'Organic Social' : b.source === 'Direct' ? 'Repeat / Direct' : (b.source || '');
      const group = (SOURCES.find(s => s.source === source) || { group: 'Tidak diketahui' }).group;
      const cust = `CUS-SBX-${pad(i + 1, 3)}`;
      sbxCustomers.push({ id: cust, outlet: 'OUT-UBD', country: 'Tidak diketahui', firstPeriod: '2026-08' });
      sbxTx.push({ id: `POS-${b.id}`, booking: b.id, lead: b.lead || '', outlet: 'OUT-UBD', period: '2026-08', date: SANDBOX_DATE, customer: cust, treatment: 'TRT-WEL60', treatmentName: state.catalog.name, guests: 1, listPrice: b.amount, amount: b.amount, adjustment: 0, directCost: Math.round(b.amount * 0.34 / 1000) * 1000, commission: Math.round(b.amount * (b.commissionRate || 0)), source, group, contact: b.channel || 'Tidak diketahui', confirm: partner ? 'Konfirmasi partner' : isLead ? 'Staf reservasi' : 'Booking online', method: partner ? 'Referral' : 'B2C', campaign: b.campaign || '', partner: b.partner || '', referralCode: partner ? 'REF-DRV001' : '', therapist: 'MBR-TUBD01', status: b.status, sandbox: true, slot: b.slot });
    });
    return { t, sbxTx, sbxCustomers, bk1Status: bk1 ? bk1.status : 'paid' };
  }

  function dataset(state) {
    const sb = sandboxView(state);
    const tx = BASE.tx.map(x => x.sandboxLinked ? { ...x, status: sb.bk1Status === 'refunded' ? 'refunded' : 'paid', refundReason: sb.bk1Status === 'refunded' ? 'Refund dari sandbox' : undefined } : x).concat(sb.sbxTx);
    const customers = new Map(BASE.customers); sb.sbxCustomers.forEach(c => customers.set(c.id, c));
    const budgetLines = BASE.budgetLines.map(b => b.mrf === 'sandbox' ? { ...b, pagu: state ? state.budget : b.pagu, actual: sb.t.actual, committed: sb.t.committed, mrf: state ? state.requests.map(r => r.id).join(', ') : 'MRF-001' } : b);
    const leads = BASE.leads.concat(state ? state.leads.map(l => ({ id: l.id, outlet: 'OUT-UBD', period: '2026-08', source: l.source, contact: l.channel, campaign: l.campaign, status: l.status, booking: (state.bookings.find(b => b.lead === l.id) || {}).id || '', sandbox: true })) : []);
    return { tx, customers, budgetLines, leads, cancellations: BASE.cancellations };
  }

  /* ---------- aggregation ---------- */
  const sum = (rows, f) => rows.reduce((s, x) => s + f(x), 0);
  const div = (a, b) => (b ? a / b : null); /* zero denominator → null → shown as "—" */
  const outletIds = (outlet) => outlet === 'all' ? OUTLETS.map(o => o.id) : [OUTLETS.find(o => o.key === outlet || o.id === outlet)?.id].filter(Boolean);
  const prevPeriod = (p) => { const m = Number(p.slice(5)) - 1; return `2026-${pad(m, 2)}`; };

  function slice(ds, period, outlet) {
    const ids = outletIds(outlet);
    const inScope = x => ids.includes(x.outlet) && x.period === period;
    const tx = ds.tx.filter(inScope);
    const paid = tx.filter(x => x.status === 'paid');
    const refunded = tx.filter(x => x.status === 'refunded');
    const lines = ds.budgetLines.filter(inScope);
    const plans = ids.map(id => PLAN_INDEX[`${id}|${period}`]).filter(Boolean);
    const revenue = sum(paid, x => x.amount);
    const orders = paid.length;
    const customerIds = new Set(paid.map(x => x.customer));
    const target = sum(plans, p => p.target);
    const pagu = sum(lines, b => b.pagu), actual = sum(lines, b => b.actual), committed = sum(lines, b => b.committed);
    const attributed = paid.filter(x => x.campaign);
    const contribution = sum(attributed, x => x.amount - x.directCost - x.commission);
    const adSpend = sum(lines.filter(b => b.type === 'ads'), b => b.actual);
    const adRevenue = sum(paid.filter(x => x.group === 'Paid'), x => x.amount);
    const newCustomers = [...customerIds].filter(id => ds.customers.get(id)?.firstPeriod === period).length;
    return {
      period, outlet, ids, tx, paid, refunded, lines, hasData: tx.length > 0,
      revenue, orders, customers: customerIds.size, customerIds, target, newCustomers,
      etr: div(revenue, target), aov: div(revenue, orders),
      pagu, actual, committed, remaining: pagu - committed - actual, realization: div(actual, pagu),
      contribution, romi: div(contribution - actual, actual), roas: div(adRevenue, adSpend), adRevenue, adSpend,
      cac: div(actual, newCustomers),
      refundAmount: sum(refunded, x => x.amount)
    };
  }

  function byGroup(s) { return GROUPS.map(g => { const rows = s.paid.filter(x => x.group === g); return { key: g, revenue: sum(rows, x => x.amount), orders: rows.length }; }); }
  function byCountry(ds, s) {
    const counts = {};
    s.customerIds.forEach(id => { const c = ds.customers.get(id)?.country || 'Tidak diketahui'; counts[c] = (counts[c] || 0) + 1; });
    return COUNTRIES.map(([name]) => ({ key: name, customers: counts[name] || 0 })).filter(x => x.customers);
  }
  function cancellations(ds, period, outlet) {
    const ids = outletIds(outlet);
    return ids.map(id => { const rows = ds.cancellations.filter(c => c.outlet === id && c.period === period); return { outlet: id, name: OUTLETS.find(o => o.id === id).name, Jadwal: rows.filter(c => c.reason === 'Jadwal').length, Tamu: rows.filter(c => c.reason === 'Tamu').length, rows }; });
  }
  function annual(ds, period, outlet) {
    const ids = outletIds(outlet), month = Number(period.slice(5));
    const keys = OUTLETS.filter(o => ids.includes(o.id)).map(o => o.key);
    return MONTHS.map((label, i) => {
      const m = i + 1, p = `2026-${pad(m, 2)}`;
      const fromPos = m >= 6 && m <= 8;
      const y2026 = m > month ? null : fromPos ? sum(ds.tx.filter(x => ids.includes(x.outlet) && x.period === p && x.status === 'paid'), x => x.amount) : sum(keys, k => (HISTORY[k].y2026[i] || 0) * JT);
      const y2025 = sum(keys, k => (HISTORY[k].y2025[i] || 0) * JT);
      return { label, month: m, y2026, y2025, source2026: m > month ? '—' : fromPos ? 'Transaksi POS demo' : 'Agregat histori demo' };
    });
  }
  function summary(state, period, outlet) {
    const ds = dataset(state);
    const cur = slice(ds, period, outlet), prev = slice(ds, prevPeriod(period), outlet);
    const ly = annual(ds, period, outlet)[Number(period.slice(5)) - 1];
    return { ds, cur, prev, sameMonthLastYear: ly.y2025, groups: byGroup(cur), countries: byCountry(ds, cur), cancel: cancellations(ds, period, outlet), annual: annual(ds, period, outlet) };
  }

  const DEFINITIONS = {
    revenue: { title: 'Total Revenue', formula: 'Σ nilai transaksi POS berstatus dibayar pada periode dan outlet terpilih.', numerator: 'Nilai transaksi POS dibayar', denominator: '—', note: 'Refund dan pembatalan tidak dihitung. Nilai pipeline dan kontrak tidak masuk revenue.' },
    customers: { title: 'Total Customers', formula: 'Jumlah ID pelanggan unik yang punya ≥1 transaksi POS dibayar.', numerator: 'Pelanggan unik', denominator: '—', note: 'Pelanggan yang datang di dua outlet dihitung sekali per outlet (ID pelanggan per outlet pada fixture ini).' },
    etr: { title: 'Effective Target Rate', formula: 'Revenue aktual ÷ target revenue.', numerator: 'Revenue aktual (POS dibayar)', denominator: 'Target revenue periode × outlet', note: 'Definisi demo sesuai prompt. Rumus resmi menunggu konfirmasi pemilik data.' },
    aov: { title: 'Average Order Value', formula: 'Revenue ÷ jumlah order dibayar.', numerator: 'Revenue', denominator: 'Order POS dibayar (bukan jumlah pelanggan)', note: 'Satu order = satu transaksi POS; tamu ganda dalam satu order tetap satu order.' },
    annual: { title: 'Annual Revenue Comparison', formula: 'Revenue bulanan 2026 vs 2025.', numerator: 'Revenue per bulan', denominator: '—', note: 'Jun–Agu 2026 dihitung dari transaksi POS demo; bulan lain dari agregat histori demo.' },
    budget: { title: 'Budget Realization', formula: 'Realisasi ÷ pagu marketing. Sisa = pagu − komitmen − realisasi.', numerator: 'Realisasi (MRF diposting)', denominator: 'Pagu marketing (Budget 7P · Promotion)', note: 'Baris CMP-001 dibaca langsung dari sandbox Commercial Budget.' },
    romi: { title: 'Return on Marketing Investment', formula: '(Kontribusi teratribusi sebelum biaya marketing − biaya marketing) ÷ biaya marketing.', numerator: 'Kontribusi teratribusi − biaya marketing', denominator: 'Biaya marketing (realisasi)', note: 'Kontribusi = revenue transaksi ber-campaign − biaya langsung − komisi. Margin dan atribusi resmi belum difinalisasi.' },
    channel: { title: 'Tracking by Channel Group', formula: 'Revenue POS dibayar per grup sumber akuisisi.', numerator: 'Revenue grup', denominator: 'Total revenue', note: 'Sumber kosong ditampilkan sebagai "Tidak diketahui".' },
    country: { title: 'Tracking by Country', formula: 'Pelanggan unik per negara (bila diketahui).', numerator: 'Pelanggan unik negara', denominator: 'Total pelanggan unik', note: 'Negara anonim tingkat pelanggan; tanpa nama/kontak.' },
    cancel: { title: 'Cancellation Reason by Branch', formula: 'Jumlah booking batal per outlet dan alasan.', numerator: 'Booking batal', denominator: '—', note: 'Pembatalan tidak membuat transaksi POS.' }
  };

  return { JT, OUTLETS, PERIODS, MONTHS, MONTH_NAMES, CAMPAIGNS, PARTNERS, MEMBERS, TREATMENTS, GROUPS, DEFINITIONS, dataset, slice, summary, prevPeriod, outletIds, div };
})();
if (typeof module !== 'undefined') module.exports = SER;
