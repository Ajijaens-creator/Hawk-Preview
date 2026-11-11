/* HAWK four-portal · NB 03 Master Marketing Budget 2027 (DATA DEMO / SIMULASI).
   Target revenue dan pagu 2027 resmi belum diberikan: Rp40 miliar × 6% adalah skenario simulasi.
   Angka workbook 2025 hanya preset/referensi berversi, tidak pernah dijadikan aktual 2027.
   Hierarki: tahun → unit/outlet → pos 7P → kategori → subkategori → child → detail budget line.
   Extends CX (commercial-model.js) via CX.extend: state lives in state.cx.b27. */
const B27 = (() => {
  const C = (typeof CX !== 'undefined') ? CX : require('./commercial-model.js');
  const need = C.need, TODAY = C.TODAY;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  /* canonical category_id, parent (pos 7P), tim pemilik, cost center & GL demo */
  const CATS = [
    { id: 'CAT-PPL', name: 'People', pillar: 'People', team: 'HRD', gl: '6101', cc: 'CC-COM-PPL', restricted: true },
    { id: 'CAT-PRC', name: 'Process', pillar: 'Process', team: 'Commercial Operations', gl: '6201', cc: 'CC-COM-PRC' },
    { id: 'CAT-DGT', name: 'Digital Marketing', pillar: 'Promotion', team: 'Digital Marketing', gl: '6301', cc: 'CC-COM-DGT' },
    { id: 'CAT-TLS', name: 'Online Tools', pillar: 'Promotion', team: 'Content Studio', gl: '6302', cc: 'CC-COM-TLS' },
    { id: 'CAT-OUT', name: 'Outsourcing', pillar: 'Promotion', team: 'Media & KOL', gl: '6303', cc: 'CC-COM-OUT' },
    { id: 'CAT-OFF', name: 'Offline Marketing', pillar: 'Promotion', team: 'Brand & Communications', gl: '6304', cc: 'CC-COM-OFF' },
    { id: 'CAT-OTH', name: 'Others', pillar: 'Promotion', team: 'Commercial Operations', gl: '6305', cc: 'CC-COM-OTH' },
    { id: 'CAT-BRD', name: 'Branding', pillar: 'Promotion', team: 'Brand & Communications', gl: '6306', cc: 'CC-COM-BRD' },
    { id: 'CAT-WEB', name: 'Website Redesign', pillar: 'Promotion', team: 'Digital Marketing', gl: '6307', cc: 'CC-COM-WEB' }
  ];
  /* Workbook 2025 presets (versioned references). Apply to the non-People share. */
  const PRESETS = {
    'master-2025': { label: 'Master 2025 (B7:B11)', w: { 'CAT-DGT': 60, 'CAT-TLS': 5, 'CAT-OUT': 25, 'CAT-OFF': 8, 'CAT-OTH': 2 } },
    'notes-2025': { label: 'Catatan 2025 (baris 34–56)', w: { 'CAT-DGT': 50, 'CAT-TLS': 10, 'CAT-OUT': 10, 'CAT-OFF': 25, 'CAT-OTH': 5 } }
  };
  const DIGITAL_PRESETS = [['Master 2025 (B7/B11/B16/B19/B21)', [55, 25, 5, 0, 15]], ['Catatan 2025', [55, 25, 15, 0, 5]]];
  const DIGITAL_CH = ['Google', 'Meta', 'TikTok', 'YouTube', 'Instagram Paid Promote'];
  const UNITS = [['OUT-UBD', 'Center (Ubud)'], ['OUT-SHT', 'Shanti'], ['OUT-TRL', 'Triloka'], ['OUT-BSM', 'Bisma'], ['HQ', 'Pusat / lintas outlet']];
  const STATUS = { draft: 'Draft', submitted: 'Menunggu Finance', returned: 'Dikembalikan', rejected: 'Ditolak', approved: 'Disetujui · komitmen', posted: 'Diposting · aktual' };

  const L = (id, unit, cat, sub, child, detail, work, month, qty, unit_cost, request, status, extra = {}) => ({ id, year: 2027, unit, cat, sub, child, detail, work, month, qty, unitCost: unit_cost, currency: 'IDR', fx: 1, recurring: false, owner: 'MBR-C02', outcome: '', evidence: '', request, status, mrf: status === 'draft' ? '' : 'MRF27-' + id.slice(-3), postId: status === 'posted' ? 'PST27-' + id.slice(-3) : '', actual: status === 'posted' ? request : 0, history: [{ status: 'draft', at: '2026-11-02', by: 'MBR-C02' }].concat(status === 'draft' ? [] : [{ status: 'submitted', at: '2026-11-04', by: 'MBR-C02' }]).concat(['approved', 'posted'].includes(status) ? [{ status: 'approved', at: '2026-11-05', by: 'Finance Manager' }] : []).concat(status === 'posted' ? [{ status: 'posted', at: '2026-11-06', by: 'Finance Manager' }] : []), ...extra });
  const SEED = () => ({
    version: 1,
    plan: { revenue: 40e9, ratio: 6, status: 'Draft simulasi', history: [{ v: 1, revenue: 40e9, ratio: 6, at: '2026-11-02', by: 'Commercial Manager', note: 'Skenario awal (target resmi belum ada)' }] },
    weights: { 'CAT-PPL': 15, 'CAT-PRC': 5, 'CAT-DGT': 40, 'CAT-TLS': 6, 'CAT-OUT': 10, 'CAT-OFF': 9, 'CAT-OTH': 3, 'CAT-BRD': 8, 'CAT-WEB': 4 },
    weightHistory: [],
    lines: [
      L('BL27-001', 'OUT-UBD', 'CAT-DGT', 'Paid Ads', 'Google Ads', 'Search treatment Januari · Center', 'CMP-001', 1, 1, 40000000, 35000000, 'posted', { outcome: 'Booking dibayar & revenue POS tertaut', recurring: true }),
      L('BL27-002', 'HQ', 'CAT-TLS', 'Design', 'Canva', 'Lisensi tim konten (5 kursi)', 'CNT-002', 1, 5, 500000, 2500000, 'approved', { outcome: 'Biaya per aset disetujui', recurring: true }),
      L('BL27-003', 'OUT-SHT', 'CAT-OUT', 'Production', 'Video', 'Produksi video vendor Sunset Ritual', 'CMP-002', 2, 1, 15000000, 12000000, 'submitted', { outcome: 'Biaya per deliverable accepted' }),
      L('BL27-004', 'OUT-TRL', 'CAT-OFF', 'Print', 'QR collateral', 'Flyer outlet dan kode QR', 'CMP-007', 3, 2000, 5000, 7000000, 'draft', { outcome: 'Tracked QR / lead' }),
      L('BL27-005', 'HQ', 'CAT-OTH', 'Courses', 'Workshop', 'Pelatihan evaluasi campaign', 'TASK-C01', 4, 1, 2500000, 2000000, 'draft', { outcome: 'Output terverifikasi' }),
      L('BL27-006', 'HQ', 'CAT-BRD', 'Brand identity', 'Tone of voice', 'Review dan implementasi panduan merek Jaens Academy', 'BR-ACD', 2, 1, 10000000, 6000000, 'posted', { outcome: 'Milestone brand & distribusi' }),
      L('BL27-007', 'HQ', 'CAT-WEB', 'Content & Design', 'Landing page', 'Perbaikan halaman booking', 'WEB-001', 4, 1, 8000000, 5000000, 'draft', { outcome: 'Milestone accepted + konversi organik' }),
      L('BL27-008', 'HQ', 'CAT-PRC', 'Operations', 'Workflow review', 'Review proses handoff DM → Sales', 'TASK-C03', 3, 1, 3500000, 2500000, 'draft', { outcome: 'SLA handoff' }),
      L('BL27-009', 'HQ', 'CAT-TLS', 'Design', 'Figma', 'Lisensi Figma (USD, bulanan)', 'CNT-003', 2, 2, 15, 480000, 'draft', { currency: 'USD', fx: 16000, outcome: 'Biaya per aset disetujui', recurring: true }),
      L('BL27-010', 'HQ', 'CAT-OUT', 'Agency', 'KOL', 'Fee KOL Anya · 2 Reels + 3 Story', 'KOL-001', 1, 1, 6500000, 6500000, 'approved', { outcome: 'Deliverable accepted & booking kode KOL' })
    ],
    /* People Cost: HRD-owned aggregate batches per cost center (no personal payroll detail in this preview). */
    peopleBatches: [
      { id: 'PB27-01', period: '2027-01', cc: 'CC-COM-PPL', unit: 'Commercial', allocation: 'ALLOC-2027-v1', amount: 0, status: 'Rencana', note: 'Belum ada payroll 2027 (simulasi)' }
    ],
    seq: { BL: 10, PB: 1 }
  });

  /* ---------- calculations ---------- */
  const lineAmt = (l) => Math.round(l.qty * l.unitCost * (l.fx || 1));
  const envelope = (b) => Math.round(b.plan.revenue * b.plan.ratio / 100);
  const allocation = (b, cat) => Math.round(envelope(b) * (b.weights[cat] || 0) / 100);
  const commit = (l) => l.status === 'approved' ? l.request : 0;
  const inPeriod = (l, period) => !period || period === 'year' || (period[0] === 'Q' ? Math.ceil(l.month / 3) === Number(period[1]) : l.month === Number(period));
  function totals(b, rows) {
    const budget = rows.reduce((s, l) => s + lineAmt(l), 0), committed = rows.reduce((s, l) => s + commit(l), 0), actual = rows.reduce((s, l) => s + l.actual, 0);
    const pending = rows.filter(l => l.status === 'submitted').reduce((s, l) => s + l.request, 0);
    const unrequested = rows.filter(l => ['draft', 'returned'].includes(l.status)).reduce((s, l) => s + lineAmt(l), 0) + rows.filter(l => ['submitted', 'approved', 'posted'].includes(l.status)).reduce((s, l) => s + Math.max(0, lineAmt(l) - l.request), 0);
    return { budget, committed, actual, pending, left: budget - committed - actual, leftHistoric: budget - actual, forecast: actual + committed + pending + unrequested };
  }
  /* Scope filter for Commercial (Marketing Manager): People category is never in rows or totals. */
  const visibleCats = (role) => CATS.filter(c => !c.restricted || ['hrd', 'owner'].includes(role));
  const planned = (b, cat, exceptId) => b.lines.filter(l => l.cat === cat && l.id !== exceptId && l.status !== 'rejected').reduce((s, l) => s + lineAmt(l), 0);

  const ROLE_FIN = ['finance-manager', 'owner'];
  const actions = {
    'b27-assume': (cx, input, by) => {
      const b = cx.b27; const revenue = Number(input.revenue), ratio = Number(input.ratio);
      need(Number.isSafeInteger(revenue) && revenue > 0, 'Target revenue tidak valid.');
      need(ratio > 0 && ratio <= 100, 'Rasio harus di antara 0 dan 100%.');
      const env = Math.round(revenue * ratio / 100);
      const over = CATS.find(c => planned(b, c.id) > Math.round(env * (b.weights[c.id] || 0) / 100));
      need(!over, `Asumsi baru membuat rencana ${over && over.name} melewati alokasi.`);
      b.plan.revenue = revenue; b.plan.ratio = ratio;
      b.plan.history.push({ v: b.plan.history.length + 1, revenue, ratio, at: TODAY, by, note: String(input.note || '') });
      return 'v' + b.plan.history.length;
    },
    'b27-weights': (cx, input, by) => {
      const b = cx.b27; const role = input.role || 'commercial-manager';
      const w = { ...b.weights };
      CATS.forEach(c => { if (input['w_' + c.id] !== undefined && input['w_' + c.id] !== '') w[c.id] = Number(input['w_' + c.id]); });
      need(CATS.every(c => Number.isFinite(w[c.id]) && w[c.id] >= 0), 'Persentase tidak valid.');
      need(w['CAT-PPL'] === b.weights['CAT-PPL'] || ['hrd', 'finance-manager', 'owner'].includes(role), 'Porsi People ditetapkan HRD dan Finance.');
      const sum = CATS.reduce((s, c) => s + w[c.id], 0);
      need(Math.abs(sum - 100) < 1e-6, `Jumlah persentase harus 100% (sekarang ${Math.round(sum * 100) / 100}%).`);
      const over = CATS.find(c => planned(b, c.id) > Math.round(envelope(b) * w[c.id] / 100));
      need(!over, `Alokasi ${over && over.name} di bawah rencana barisnya.`);
      b.weightHistory.push({ at: TODAY, by, from: { ...b.weights }, to: w, preset: input.preset || '' });
      b.weights = w; return 'ok';
    },
    'b27-line-save': (cx, input, by) => {
      const b = cx.b27; const cat = CATS.find(c => c.id === input.cat);
      need(cat && !cat.restricted, 'Pilih kategori yang dikelola Commercial.');
      const ex = input.id ? b.lines.find(l => l.id === input.id) : null;
      if (input.id) need(ex, 'Baris tidak ditemukan.');
      if (ex) need(['draft', 'returned'].includes(ex.status), 'Baris yang sudah diajukan/disetujui berubah lewat revisi atau transfer.');
      const month = Number(input.month), qty = Number(input.qty), unitCost = Number(input.unitCost), fx = input.currency === 'USD' ? Number(input.fx || 16000) : 1;
      need(month >= 1 && month <= 12, 'Pilih bulan.');
      need(qty > 0 && unitCost > 0, 'Isi qty dan biaya satuan.');
      need(String(input.detail || '').trim().length >= 4, 'Isi detail pengeluaran.');
      const amount = Math.round(qty * unitCost * fx), request = Number(input.request || amount);
      need(Number.isSafeInteger(request) && request > 0 && request <= amount, 'Pengajuan MRF tidak boleh melebihi rencana baris.');
      const room = allocation(b, cat.id) - planned(b, cat.id, ex && ex.id);
      need(amount <= room, `Rencana melewati alokasi ${cat.name} (sisa alokasi Rp ${Math.max(0, room).toLocaleString('id-ID')}).`);
      const data = { unit: input.unit || 'HQ', cat: cat.id, sub: String(input.sub || '').trim() || '—', child: String(input.child || '').trim(), detail: String(input.detail).trim(), work: String(input.work || '').trim(), month, qty, unitCost, currency: input.currency === 'USD' ? 'USD' : 'IDR', fx, recurring: input.recurring === 'yes', owner: input.owner || by, outcome: String(input.outcome || ''), request };
      if (ex) { Object.assign(ex, data); ex.history.push({ status: ex.status === 'returned' ? 'returned · diedit' : 'draft · diedit', at: TODAY, by }); return ex.id; }
      const id = 'BL27-' + String(b.seq.BL = b.seq.BL + 1).padStart(3, '0');
      b.lines.push({ id, year: 2027, ...data, evidence: '', status: 'draft', mrf: '', postId: '', actual: 0, history: [{ status: 'draft', at: TODAY, by }] });
      return id;
    },
    'b27-submit': (cx, input, by) => {
      const l = cx.b27.lines.find(x => x.id === input.id); need(l && ['draft', 'returned'].includes(l.status), 'Hanya draft/dikembalikan yang bisa diajukan.');
      l.status = 'submitted'; l.mrf = l.mrf || 'MRF27-' + l.id.slice(-3); l.history.push({ status: 'submitted', at: TODAY, by }); return l.mrf;
    },
    /* Finance decision. Approval checks the line pagu inside the same transaction; a second approval is rejected. */
    'b27-approve': (cx, input, by) => {
      const b = cx.b27, l = b.lines.find(x => x.id === input.id);
      need(l && l.status === 'submitted', 'MRF tidak menunggu approval (mungkin sudah diproses).');
      need(ROLE_FIN.includes(input.role || 'finance-manager'), 'Hanya Finance yang menyetujui MRF.');
      const roomLine = lineAmt(l) - l.actual; need(l.request <= roomLine, 'Pagu baris tidak mencukupi.');
      const cat = b.lines.filter(x => x.cat === l.cat && x.id !== l.id).reduce((s, x) => s + commit(x) + x.actual, 0);
      need(cat + l.request <= allocation(b, l.cat), 'Alokasi kategori tidak mencukupi.');
      l.status = 'approved'; l.history.push({ status: 'approved', at: TODAY, by: input.byName || 'Finance Manager' }); return l.mrf;
    },
    'b27-return': (cx, input, by) => {
      const l = cx.b27.lines.find(x => x.id === input.id); need(l && l.status === 'submitted', 'MRF tidak menunggu approval.');
      need(String(input.reason || '').trim().length >= 5, 'Tulis alasan (min. 5 karakter).');
      l.status = input.decision === 'reject' ? 'rejected' : 'returned'; l.reason = String(input.reason).trim();
      l.history.push({ status: l.status, at: TODAY, by: 'Finance Manager', note: l.reason }); return l.mrf;
    },
    'b27-post': (cx, input, by) => {
      const l = cx.b27.lines.find(x => x.id === input.id); need(l && l.status === 'approved', 'Hanya MRF disetujui yang bisa diposting (posting sama tidak dihitung dua kali).');
      l.actual = l.request; l.status = 'posted'; l.postId = 'PST27-' + l.id.slice(-3); l.history.push({ status: 'posted', at: TODAY, by: 'Finance Manager', note: l.postId }); return l.postId;
    },
    /* HRD → Finance batch. Same batch_id refresh never duplicates cost. */
    'b27-people-batch': (cx, input, by) => {
      const b = cx.b27; need(['hrd', 'owner'].includes(input.role), 'Batch People hanya dikirim oleh HRD.');
      const period = input.period || '2027-01'; const id = 'PB27-' + period.slice(5);
      const amount = Number(input.amount); need(Number.isSafeInteger(amount) && amount >= 0, 'Isi nilai agregat batch.');
      const ex = b.peopleBatches.find(x => x.id === id);
      if (ex) { need(ex.status !== 'Diposting', 'Batch sudah diposting; koreksi memakai reversal/adjustment.'); Object.assign(ex, { amount, status: 'Dikirim ke Finance', refreshed: (ex.refreshed || 0) + (ex.status === 'Dikirim ke Finance' ? 1 : 0) }); return id; }
      b.peopleBatches.push({ id, period, cc: 'CC-COM-PPL', unit: 'Commercial', allocation: 'ALLOC-2027-v1', amount, status: 'Dikirim ke Finance', note: '' }); return id;
    },
    'b27-people-post': (cx, input) => {
      const pb = cx.b27.peopleBatches.find(x => x.id === input.id); need(pb && pb.status === 'Dikirim ke Finance', 'Batch belum dikirim atau sudah diposting.');
      need(ROLE_FIN.includes(input.role), 'Hanya Finance yang merekonsiliasi dan memposting batch.');
      pb.status = 'Diposting'; pb.postId = 'PST27-' + pb.id; return pb.postId;
    }
  };
  C.extend({ seed: { key: 'b27', make: SEED }, actions });
  return { MONTHS, CATS, PRESETS, DIGITAL_PRESETS, DIGITAL_CH, UNITS, STATUS, lineAmt, envelope, allocation, commit, inPeriod, totals, visibleCats, planned };
})();
if (typeof module !== 'undefined') module.exports = B27;
