/* HAWK four-portal · Fase 2B Commercial sandbox model (Digital, Social, Media & KOL, Attribution, AI Mentor).
   DATA DEMO / SIMULASI: tidak ada koneksi akun iklan, Meta, Google, TikTok atau AI sungguhan.
   Snapshot platform adalah angka sintetis; revenue terverifikasi selalu dibaca dari transaksi POS (SER dataset).
   Extends CX (commercial-model.js) via CX.extend: state lives in state.cx.mk. */
const MK = (() => {
  const C = (typeof CX !== 'undefined') ? CX : require('./commercial-model.js');
  const TODAY = C.TODAY, need = C.need;
  const JT = 1e6;

  const PLATFORMS = ['Meta Ads', 'Google Ads', 'TikTok Ads'];
  /* Creative-level platform snapshot Agustus (Meta & Google penuh; TikTok belum diimpor → parsial saat diimpor). Platform conversions = laporan platform, bukan revenue. */
  const ADS = [
    ['Meta Ads', 'CMP-001', 'CRV-01', 'Reels Wellness Escape 60 dtk', 412000, 36100, 15.9 * JT, 410],
    ['Meta Ads', 'CMP-001', 'CRV-02', 'Carousel 5 manfaat', 268000, 19800, 9.4 * JT, 220],
    ['Meta Ads', 'CMP-002', 'CRV-03', 'Reels Sunset Ritual', 301000, 25200, 12.0 * JT, 260],
    ['Meta Ads', 'CMP-007', 'CRV-04', 'Always-on Triloka', 222000, 17400, 9.0 * JT, 190],
    ['Meta Ads', 'CMP-004', 'CRV-05', 'Boost Reels KOL Anya', 158000, 14100, 5.5 * JT, 120],
    ['Google Ads', 'CMP-003', 'CRV-06', 'Search “spa ubud”', 96000, 9300, 20.2 * JT, 540],
    ['Google Ads', 'CMP-003', 'CRV-07', 'Search “couple spa bali”', 41000, 2900, 7.1 * JT, 150],
    ['TikTok Ads', 'CMP-006', 'CRV-08', 'Countdown Bisma', 188000, 7300, 6.0 * JT, 0],
    ['TikTok Ads', 'CMP-006', 'CRV-09', 'Story Bisma (dijeda)', 0, 0, 0, 0],
    ['Meta Ads', '', 'CRV-10', 'Boost tanpa UTM (ig_story_aug)', 64000, 3100, 2.1 * JT, 30]
  ].map(([platform, campaign, id, name, impressions, clicks, spend, platformConv]) => ({ platform, campaign, id, name, impressions, clicks, spend, platformConv }));
  /* Audit Agustus (definisi lama SER) — ditampilkan sebagai acuan berlabel, bukan target. */
  const BENCH = { ctr: 0.0846, roasLegacy: 17.05 };
  const SEO = [
    ['spa ubud', '/ubud', 3.2, 2140, 38100, 1520], ['balinese massage ubud', '/ubud/balinese-massage', 4.8, 980, 21400, 690],
    ['couple spa bali', '/paket/couple', 7.5, 410, 15800, 270], ['wellness massage bali', '/treatment/wellness', 9.1, 260, 12100, 170],
    ['spa near me ubud', '/ubud', 5.6, 620, 16900, 410], ['jaens spa', '/', 1.1, 1830, 4300, 1490],
    ['spa shanti', '/shanti', 2.4, 350, 2900, 260], ['hot stone therapy bali', '/treatment/hot-stone', 14.3, 40, 6200, 25]
  ].map(([query, url, rank, clicks, impressions, engaged]) => ({ query, url, rank, clicks, impressions, engaged }));
  const KOL_STAGES = ['Shortlist', 'Brief', 'Proposal', 'Approval', 'Produksi', 'Publikasi', 'Review'];
  const CONV_CATS = ['Reservasi', 'Pertanyaan harga', 'Keluhan', 'Pujian', 'Spam'];

  const SEED = () => ({
    imports: [
      { id: 'SNAP-2607-META', platform: 'Meta Ads', period: '2026-07', through: '2026-07-31', rows: 9, at: '2026-08-01 07:00', partial: false },
      { id: 'SNAP-2608-META', platform: 'Meta Ads', period: '2026-08', through: '2026-08-31', rows: 6, at: '2026-09-01 07:00', partial: false },
      { id: 'SNAP-2608-GADS', platform: 'Google Ads', period: '2026-08', through: '2026-08-31', rows: 2, at: '2026-09-01 07:05', partial: false }
    ],
    utm: [
      { utm: 'cmp001_wellness_escape', campaign: 'CMP-001', status: 'mapped' }, { utm: 'cmp002_sunset_ritual', campaign: 'CMP-002', status: 'mapped' },
      { utm: 'cmp003_search', campaign: 'CMP-003', status: 'mapped' }, { utm: 'cmp004_kol_week', campaign: 'CMP-004', status: 'mapped' },
      { utm: 'cmp006_bisma_open', campaign: 'CMP-006', status: 'mapped' }, { utm: 'cmp007_triloka_meta', campaign: 'CMP-007', status: 'mapped' },
      { utm: 'ig_story_aug', campaign: '', status: 'unmapped', creative: 'CRV-10' }
    ],
    experiments: [
      { id: 'EXP-001', key: 'seed-exp-1', title: 'CTA “Chat & Book” vs “Pesan sekarang”', campaign: 'CMP-001', metric: 'Lead → booking dibayar', baseline: 0.42, variant: 'Tombol “Chat & Book” ke WhatsApp', window: '2026-08-10 – 2026-08-24', pic: 'MBR-C02', status: 'Running', result: null, decision: '', note: '' },
      { id: 'EXP-002', key: 'seed-exp-2', title: 'Thumbnail wajah vs suasana (Reels)', campaign: 'CMP-002', metric: 'CTR iklan', baseline: 0.071, variant: 'Thumbnail suasana sunset', window: '2026-07-15 – 2026-07-29', pic: 'MBR-C05', status: 'Selesai', result: 0.083, decision: 'Lanjut', note: 'Varian dipakai untuk Agustus' }
    ],
    accounts: [
      { id: 'ACC-01', platform: 'Instagram', handle: '@jaensspa', unit: 'Jaens Spa' }, { id: 'ACC-02', platform: 'Instagram', handle: '@jaensspa.shanti', unit: 'Jaens Spa' },
      { id: 'ACC-03', platform: 'TikTok', handle: '@jaensspa', unit: 'Jaens Spa' }, { id: 'ACC-04', platform: 'Facebook', handle: 'Jaens Spa', unit: 'Jaens Spa' },
      { id: 'ACC-05', platform: 'Instagram', handle: '@jaensessence', unit: 'Jaens Essence' }
    ],
    /* period-level social metrics (bukan jumlah harian). reach per platform tidak unik lintas platform. */
    social: [
      ['2026-08', 'ACC-01', 182000, 14600, 24800, 1320, 1110, 3900], ['2026-08', 'ACC-02', 64000, 5300, 8700, 410, 350, 1200],
      ['2026-08', 'ACC-03', 241000, 19800, 12300, 1880, 1610, 2100], ['2026-08', 'ACC-04', 38000, 1500, 15200, 90, 40, 600],
      ['2026-08', 'ACC-05', 52000, 3900, 9600, 260, 210, 800],
      ['2026-07', 'ACC-01', 168000, 12900, 23690, 1190, 1010, 3600], ['2026-07', 'ACC-02', 59000, 4700, 8350, 380, 330, 1100],
      ['2026-07', 'ACC-03', 196000, 15200, 10690, 1520, 1300, 1700], ['2026-07', 'ACC-04', 36500, 1400, 15160, 70, 30, 560],
      ['2026-07', 'ACC-05', 47000, 3300, 9390, 240, 190, 700]
    ].map(([period, account, reach, interactions, followers, newFollowers, netFollowers, visits]) => ({ period, account, reach, interactions, followers, newFollowers, netFollowers, visits })),
    convs: [
      { id: 'CONV-001', channel: 'Instagram DM', account: 'ACC-01', from: 'Tamu IG demo A', text: 'Halo, masih ada slot Wellness Massage besok jam 11?', campaign: 'CMP-001', publication: 'PUB-001', category: 'Reservasi', status: 'open', lead: '', at: '2026-08-22 09:12' },
      { id: 'CONV-002', channel: 'Komentar Instagram', account: 'ACC-01', from: 'Akun demo B', text: 'Harga couple package berapa ya?', campaign: 'CMP-001', publication: 'PUB-001', category: '', status: 'open', lead: '', at: '2026-08-22 08:40' },
      { id: 'CONV-003', channel: 'TikTok komentar', account: 'ACC-03', from: 'Akun demo C', text: 'Kapan Bisma buka sore lagi?', campaign: 'CMP-006', publication: '', category: '', status: 'open', lead: '', at: '2026-08-21 19:05' },
      { id: 'CONV-004', channel: 'Facebook Messenger', account: 'ACC-04', from: 'Tamu FB demo D', text: 'Kemarin terapis datang terlambat 20 menit.', campaign: '', publication: '', category: 'Keluhan', status: 'open', lead: '', at: '2026-08-21 16:30' },
      { id: 'CONV-005', channel: 'Komentar Instagram', account: 'ACC-02', from: 'Akun demo E', text: 'Promo follower murah klik link', campaign: '', publication: '', category: 'Spam', status: 'hidden', lead: '', at: '2026-08-21 11:02' }
    ],
    partners: [
      { id: 'KOL-001', name: 'Anya (kreator demo)', type: 'KOL', channel: 'Instagram', unit: 'Jaens Spa', pic: 'MBR-C02', audience: 'Australia 62% · usia 25–44', followers: 84000, stage: 'Publikasi', agreement: 'v2', fee: 6500000, code: 'KOL-ANYA10', codeValid: '2026-09-15', campaign: 'CMP-004', brief: 'Pengalaman Wellness Massage, sebut kode diskon 10%', term: '2 Reels + 3 Story · hak pakai konten 3 bulan', history: [['Shortlist', '2026-07-10'], ['Brief', '2026-07-14'], ['Proposal', '2026-07-18'], ['Approval', '2026-07-22'], ['Produksi', '2026-07-28'], ['Publikasi', '2026-08-12']] },
      { id: 'KOL-002', name: 'Raka (kreator demo)', type: 'KOL', channel: 'TikTok', unit: 'Jaens Spa', pic: 'MBR-C05', audience: 'Domestik 71% · usia 20–34', followers: 126000, stage: 'Review', agreement: 'v1', fee: 4500000, code: 'KOL-RAKA10', codeValid: '2026-08-15', campaign: 'CMP-004', brief: 'Day-in-Ubud dengan Balinese Massage', term: '1 Reels + 2 Story', history: [['Shortlist', '2026-07-01'], ['Brief', '2026-07-03'], ['Proposal', '2026-07-06'], ['Approval', '2026-07-08'], ['Produksi', '2026-07-20'], ['Publikasi', '2026-08-05'], ['Review', '2026-08-18']] },
      { id: 'MED-001', name: 'Majalah wellness Bali (media demo)', type: 'Media partner', channel: 'Media online', unit: 'Jaens Spa', pic: 'MBR-C01', audience: 'Ekspat & wisatawan', followers: 0, stage: 'Proposal', agreement: 'draft', fee: 3000000, code: '', codeValid: '', campaign: '', brief: 'Advertorial Signature Ritual', term: '1 artikel + 1 newsletter', history: [['Shortlist', '2026-08-05'], ['Brief', '2026-08-10'], ['Proposal', '2026-08-19']] },
      { id: 'KOL-003', name: 'Sinta (kreator demo)', type: 'KOL', channel: 'Instagram', unit: 'Jaens Essence', pic: 'MBR-C03', audience: 'Domestik 80% · wanita 25–40', followers: 41000, stage: 'Shortlist', agreement: '', fee: 2500000, code: '', codeValid: '', campaign: '', brief: '', term: '', history: [['Shortlist', '2026-08-20']] }
    ],
    deliverables: [
      { id: 'DLV-001', partner: 'KOL-001', type: 'Reels', due: '2026-08-12', status: 'Terbit', postId: 'IG-DEMO-2001', impressions: 52000, clicks: 1900, asset: 'AST-006' },
      { id: 'DLV-002', partner: 'KOL-001', type: 'Story ×3', due: '2026-08-25', status: 'Menunggu approval', postId: '', impressions: 0, clicks: 0, asset: '' },
      { id: 'DLV-003', partner: 'KOL-002', type: 'Reels', due: '2026-08-05', status: 'Terbit', postId: 'TT-DEMO-3001', impressions: 88000, clicks: 2400, asset: '' },
      { id: 'DLV-004', partner: 'KOL-002', type: 'Story ×2', due: '2026-08-07', status: 'Terbit', postId: 'TT-DEMO-3002', impressions: 21000, clicks: 300, asset: '' },
      { id: 'DLV-005', partner: 'MED-001', type: 'Artikel', due: '2026-09-05', status: 'Draft', postId: '', impressions: 0, clicks: 0, asset: '' }
    ],
    fixes: {},
    mentor: {},
    seq: { EXP: 2, DLV: 5 }
  });

  const exp = (mk, id) => mk.experiments.find(e => e.id === id);
  const actions = {
    /* Re-import of the same platform snapshot (same cut-off) returns the existing snapshot: no double rows. */
    'snap-import': (cx, input, by) => {
      const mk = cx.mk; const platform = input.platform || 'Meta Ads';
      need(PLATFORMS.includes(platform), 'Platform tidak dikenal.');
      const code = { 'Meta Ads': 'META', 'Google Ads': 'GADS', 'TikTok Ads': 'TTAD' }[platform];
      const id = `SNAP-2608-${code}`;
      const ex = mk.imports.find(s => s.id === id);
      if (ex) { ex.reimported = (ex.reimported || 0) + 1; return id; }
      mk.imports.push({ id, platform, period: '2026-08', through: '2026-08-21', rows: ADS.filter(a => a.platform === platform).length, at: `${TODAY} 10:00`, partial: true, by });
      return id;
    },
    'utm-map': (cx, input) => {
      const u = cx.mk.utm.find(x => x.utm === input.utm); need(u, 'UTM tidak ditemukan.');
      need(cx.campaigns.some(c => c.id === input.campaign), 'Pilih campaign tujuan.');
      u.campaign = input.campaign; u.status = 'mapped'; u.mappedAt = TODAY; return u.utm;
    },
    'exp-create': (cx, input, by) => {
      const mk = cx.mk; const key = String(input.key || input.title || '').trim();
      need(String(input.title || '').trim().length >= 5, 'Judul eksperimen minimal 5 karakter.');
      const dup = mk.experiments.find(e => e.key === key); if (dup) return dup.id;
      const baseline = Number(input.baseline); need(baseline >= 0, 'Isi baseline.');
      need(String(input.variant || '').trim().length >= 3, 'Isi varian.');
      const id = `EXP-${String(mk.seq.EXP = mk.seq.EXP + 1).padStart(3, '0')}`;
      mk.experiments.push({ id, key, title: String(input.title).trim(), campaign: input.campaign || '', metric: input.metric || 'Lead → booking dibayar', baseline, variant: String(input.variant).trim(), window: input.window || '14 hari', pic: input.pic || by, status: 'Running', result: null, decision: '', note: '', source: input.source || 'Manual' });
      return id;
    },
    'exp-result': (cx, input) => {
      const e = exp(cx.mk, input.id); need(e && e.status === 'Running', 'Eksperimen tidak sedang berjalan.');
      const result = Number(input.result); need(input.result !== '' && result >= 0, 'Isi hasil.');
      need(['Lanjut', 'Ubah', 'Henti'].includes(input.decision), 'Pilih keputusan: Lanjut, Ubah atau Henti.');
      Object.assign(e, { result, decision: input.decision, note: String(input.note || ''), status: 'Selesai', closedAt: TODAY });
      return e.id;
    },
    'conv-tag': (cx, input) => {
      const c = cx.mk.convs.find(x => x.id === input.id); need(c, 'Percakapan tidak ditemukan.');
      need(CONV_CATS.includes(input.category), 'Kategori tidak dikenal.');
      c.category = input.category; if (input.category === 'Spam') c.status = 'hidden'; return c.id;
    },
    /* DM reservasi → lead Sales B2C dengan ringkasan dan asal campaign. Retry memakai lead yang sama. */
    'conv-handoff': (cx, input, by, state) => {
      const c = cx.mk.convs.find(x => x.id === input.id); need(c, 'Percakapan tidak ditemukan.');
      if (c.lead) return c.lead;
      need(c.category === 'Reservasi', 'Kategorikan sebagai Reservasi sebelum dialihkan ke Sales.');
      const id = 'LEAD-' + String(state.leads.length + 1).padStart(3, '0');
      state.leads.push({ id, name: c.from, source: 'Instagram', channel: c.channel.includes('DM') ? 'Instagram DM' : c.channel, campaign: c.campaign, status: 'new', summary: c.text, conversation: c.id });
      c.lead = id; c.status = 'handed-off'; return id;
    },
    'kol-advance': (cx, input) => {
      const p = cx.mk.partners.find(x => x.id === input.id); need(p, 'Partner tidak ditemukan.');
      const i = KOL_STAGES.indexOf(p.stage); need(i < KOL_STAGES.length - 1, 'Kolaborasi sudah di tahap Review.');
      if (KOL_STAGES[i + 1] === 'Approval') need(p.fee > 0 && p.term, 'Lengkapi fee dan term sebelum approval.');
      p.stage = KOL_STAGES[i + 1]; p.history.push([p.stage, TODAY]); return p.id;
    },
    'dlv-approve': (cx, input) => {
      const d = cx.mk.deliverables.find(x => x.id === input.id); need(d && d.status === 'Menunggu approval', 'Deliverable tidak menunggu approval.');
      d.status = 'Disetujui'; d.approvedAt = TODAY; return d.id;
    },
    'exc-queue': (cx, input, by) => {
      const f = cx.mk.fixes; need(input.id, 'Transaksi kosong.');
      if (!f[input.id]) f[input.id] = { status: 'queued', at: TODAY, by, history: [['Masuk antrean', TODAY, by]] };
      return input.id;
    },
    'exc-correct': (cx, input, by) => {
      const f = cx.mk.fixes[input.id]; need(f && f.status === 'queued', 'Masukkan ke antrean perbaikan dulu.');
      need(input.source, 'Pilih sumber koreksi.'); need(String(input.evidence || '').trim().length >= 5, 'Isi bukti koreksi (min. 5 karakter).');
      Object.assign(f, { status: 'corrected', source: input.source, evidence: String(input.evidence).trim() }); f.history.push([`Dikoreksi → ${input.source}`, TODAY, by]);
      return input.id;
    },
    /* AI Mentor: terima → satu tugas (kunci insight), tolak wajib alasan, ubah → versi naik. Tidak pernah mengubah budget. */
    'mentor-accept': (cx, input, by, state) => {
      need(input.id, 'Insight kosong.');
      const d = cx.mk.mentor[input.id] || (cx.mk.mentor[input.id] = { version: 1 });
      const task = C.update(state, 'task-create', { key: 'mentor-' + input.id, object: input.object || '', type: 'mentor', action: d.action || input.action, pic: input.pic, due: input.due, source: 'AI Marketing Mentor (simulasi)', metric: input.metric, by });
      Object.assign(d, { status: 'accepted', task, at: TODAY, by }); return task;
    },
    'mentor-reject': (cx, input, by) => {
      need(String(input.reason || '').trim().length >= 5, 'Tulis alasan penolakan (min. 5 karakter).');
      const d = cx.mk.mentor[input.id] || (cx.mk.mentor[input.id] = { version: 1 });
      need(d.status !== 'accepted', 'Usulan sudah diterima menjadi tugas.');
      Object.assign(d, { status: 'rejected', reason: String(input.reason).trim(), at: TODAY, by }); return input.id;
    },
    'mentor-edit': (cx, input, by) => {
      need(String(input.action || '').trim().length >= 5, 'Tulis usulan tindakan.');
      const d = cx.mk.mentor[input.id] || (cx.mk.mentor[input.id] = { version: 1 });
      need(d.status !== 'accepted', 'Usulan sudah diterima menjadi tugas.');
      Object.assign(d, { action: String(input.action).trim().slice(0, 200), version: d.version + 1, status: 'edited', at: TODAY, by }); return input.id;
    }
  };
  C.extend({ seed: { key: 'mk', make: SEED }, actions });

  /* ---------- deterministic read helpers ---------- */
  const div = (a, b) => (b ? a / b : null);
  /* KOL attribution: sandbox bookings carry the KOL partner; fixture CMP-004 rows are split deterministically by POS id. */
  const kolOf = (x) => x.campaign !== 'CMP-004' ? '' : (String(x.partner || '').startsWith('KOL-') ? x.partner : (Number(x.id.replace(/\D/g, '').slice(-1)) % 2 ? 'KOL-002' : 'KOL-001'));
  function adsView(ds, period = '2026-08') {
    const paid = ds.tx.filter(x => x.period === period && x.status === 'paid');
    const leads = ds.leads.filter(l => l.period === period);
    const byCampaign = {};
    ADS.forEach(a => {
      const k = a.campaign || '(tanpa UTM)';
      const r = byCampaign[k] || (byCampaign[k] = { campaign: a.campaign, platform: a.platform, impressions: 0, clicks: 0, spend: 0, platformConv: 0, creatives: [] });
      r.impressions += a.impressions; r.clicks += a.clicks; r.spend += a.spend; r.platformConv += a.platformConv; r.creatives.push(a);
    });
    Object.values(byCampaign).forEach(r => {
      const tx = r.campaign ? paid.filter(x => x.campaign === r.campaign) : [];
      const ld = r.campaign ? leads.filter(l => l.campaign === r.campaign) : [];
      Object.assign(r, { leads: ld.length, waLeads: ld.filter(l => l.contact === 'WhatsApp').length, bookings: tx.length, revenue: tx.reduce((s, x) => s + x.amount, 0) });
      Object.assign(r, { ctr: div(r.clicks, r.impressions), cpc: div(r.spend, r.clicks), cpm: r.impressions ? r.spend / r.impressions * 1000 : null, cpl: r.leads ? r.spend / r.leads : null, roas: div(r.revenue, r.spend) });
    });
    return Object.values(byCampaign);
  }
  return { PLATFORMS, ADS, BENCH, SEO, KOL_STAGES, CONV_CATS, adsView, kolOf, div };
})();
if (typeof module !== 'undefined') module.exports = MK;
