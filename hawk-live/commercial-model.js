/* HAWK ERP · Commercial workspace model (Fase 2) — DATA DEMO / SIMULASI
   Campaign Planner (F2-02/F2-03), Content Studio (F2-04), Brand & Communications (F2-01),
   Media Partner & KOL (F2-07), Social (F2-06) records, and the work items (tasks) that the
   insight panels and Daily Race read. One record per object with stable IDs:
     CMP-* campaign · CNT-* content · AST-* asset (versioned) · PUB-* publication per platform
     BR-* brand · MSG-* message · COM-* communication · REQ-OFF-* offline design request
     KOL-* partner · DLV-* deliverable · TASK-* work item.
   Budget requests (MRF) stay in model.js so Finance and Commercial read the same record.
   State lives in state.cx (created on first use) so Reset Demo restores this seed. */
const CX = (() => {
  const TODAY = '2026-08-22';
  const STAGES = ['Reference', 'Idea', 'Approved Idea', 'Planned', 'Pre-production', 'Production', 'Editing', 'Review', 'Approved', 'Scheduled', 'Published', 'Analysed'];
  /* Which PIC slot owns each stage. */
  const STAGE_ROLE = { Reference: 'planner', Idea: 'planner', 'Approved Idea': 'planner', Planned: 'planner', 'Pre-production': 'creator', Production: 'creator', Editing: 'editor', Review: 'reviewer', Approved: 'publisher', Scheduled: 'publisher', Published: 'analyst', Analysed: 'analyst' };
  const PEOPLE = [
    { id: 'MBR-C01', name: 'Rani', role: 'Content Lead · reviewer' },
    { id: 'MBR-C02', name: 'Bayu', role: 'Digital Marketing' },
    { id: 'MBR-C03', name: 'Dita', role: 'Creator / videografer' },
    { id: 'MBR-C04', name: 'Arya', role: 'Editor' },
    { id: 'MBR-C05', name: 'Wulan', role: 'Social Media Admin' },
    { id: 'MBR-C06', name: 'Made', role: 'Brand Designer' },
    { id: 'MBR-S01', name: 'Dewa', role: 'Reservasi B2C' }
  ];
  const PILLARS = ['Wellness ritual', 'Treatment showcase', 'Promo & offer', 'Behind the scene', 'Brand story'];
  const PLATFORMS = ['Instagram', 'TikTok', 'Facebook', 'Google Ads', 'Website'];
  const CAMPAIGN_FLOW = ['Draft', 'Approved', 'Scheduled', 'Running', 'Paused', 'Closed'];
  const BRAND_ELEMENTS = [['logo', 'Logo', 15], ['palette', 'Palet warna', 10], ['font', 'Font', 10], ['grid', 'Layout grid', 10], ['tone', 'Tone of voice', 15], ['tagline', 'Tagline', 10], ['brandbook', 'Brandbook', 15], ['template', 'Template', 5], ['thumbnail', 'Thumbnail', 5], ['merch', 'Merchandise', 5]];
  const TEMPLATES = [
    { id: 'TPL-01', name: 'Promo treatment musiman', objective: 'Booking treatment unggulan dari social → WhatsApp', channels: ['Instagram', 'Meta Ads'], days: 30, window: 14 },
    { id: 'TPL-02', name: 'Grand opening outlet', objective: 'Awareness dan booking pertama outlet baru', channels: ['TikTok', 'Instagram', 'KOL'], days: 21, window: 21 },
    { id: 'TPL-03', name: 'Kolaborasi KOL', objective: 'Reach audiens baru lewat kreator dengan kode tracking', channels: ['KOL', 'Instagram'], days: 14, window: 30 },
    { id: 'TPL-04', name: 'Search always-on', objective: 'Tangkap intent pencarian spa di Ubud', channels: ['Google Ads', 'Website'], days: 30, window: 7 }
  ];

  const h = (status, at, by, note) => ({ status, at, by, note: note || '' });
  const SEED = {
    seq: { CMP: 7, CNT: 8, AST: 8, PUB: 3, TASK: 3, COM: 6, MSG: 4 },
    campaigns: [
      { id: 'CMP-001', name: 'Wellness Escape', template: 'TPL-01', objective: 'Booking Wellness Massage dari Instagram → WhatsApp', audience: 'Wisatawan domestik & Australia 25–45 tahun', offer: 'Wellness Massage 60 menit + welcome drink', outlets: ['OUT-UBD'], start: '2026-08-01', end: '2026-08-31', channels: ['Instagram', 'Meta Ads', 'WhatsApp'], pic: 'MBR-C02', status: 'Running', budgetLine: 'BGL-UBD-2608-01', budgetPlan: 25000000, target: { leads: 820, bookings: 400, revenue: 350000000 }, baseline: 'Juli 2026 · 375 booking teratribusi (Instagram/Meta)', utm: 'cmp001_wellness_escape', window: 14, sandbox: true, history: [h('Draft', '2026-07-20', 'MBR-C02'), h('Approved', '2026-07-24', 'Commercial Manager'), h('Scheduled', '2026-07-28', 'MBR-C02'), h('Running', '2026-08-01', 'MBR-C02')], retro: '' },
      { id: 'CMP-002', name: 'Sunset Ritual Shanti', template: 'TPL-01', objective: 'Isi slot sore Shanti dengan paket sunset', audience: 'Pasangan wisatawan 25–40', offer: 'Couple Package sore hari', outlets: ['OUT-SHT'], start: '2026-08-05', end: '2026-09-05', channels: ['Instagram', 'TikTok'], pic: 'MBR-C05', status: 'Running', budgetLine: 'BGL-SHT-2608-01', budgetPlan: 36000000, target: { leads: 560, bookings: 270, revenue: 225000000 }, baseline: 'Juli 2026 · 240 booking teratribusi', utm: 'cmp002_sunset_ritual', window: 14, history: [h('Draft', '2026-07-25', 'MBR-C05'), h('Approved', '2026-07-29', 'Commercial Manager'), h('Running', '2026-08-05', 'MBR-C05')], retro: '' },
      { id: 'CMP-003', name: 'Google Search Always-on', template: 'TPL-04', objective: 'Tangkap pencarian “spa ubud”', audience: 'Pencari spa di Ubud', offer: 'Booking online tanpa antre', outlets: ['OUT-UBD', 'OUT-SHT', 'OUT-TRL', 'OUT-BSM'], start: '2026-01-01', end: '2026-12-31', channels: ['Google Ads', 'Website'], pic: 'MBR-C02', status: 'Running', budgetLine: 'BGL-UBD-2608-03', budgetPlan: 30000000, target: { leads: 1200, bookings: 700, revenue: 600000000 }, baseline: 'Rata-rata Q2 2026', utm: 'cmp003_search_always_on', window: 7, history: [h('Running', '2026-01-01', 'MBR-C02')], retro: '' },
      { id: 'CMP-004', name: 'Bali Wellness Week KOL', template: 'TPL-03', objective: 'Reach audiens Australia lewat dua kreator', audience: 'Wisatawan Australia', offer: 'Kode KOL diskon 10%', outlets: ['OUT-UBD', 'OUT-SHT'], start: '2026-08-10', end: '2026-08-31', channels: ['KOL', 'Instagram'], pic: 'MBR-C01', status: 'Running', budgetLine: 'BGL-UBD-2608-04', budgetPlan: 15000000, target: { leads: 380, bookings: 380, revenue: 320000000 }, baseline: 'Belum ada baseline KOL', utm: 'cmp004_wellness_week_kol', window: 30, history: [h('Draft', '2026-07-30', 'MBR-C01'), h('Approved', '2026-08-03', 'Commercial Manager'), h('Running', '2026-08-10', 'MBR-C01')], retro: '' },
      { id: 'CMP-005', name: 'Triloka Couple Retreat', template: 'TPL-01', objective: 'Naikkan booking Couple Package di Triloka', audience: 'Pasangan honeymoon', offer: 'Couple Package + bunga', outlets: ['OUT-TRL'], start: '2026-09-01', end: '2026-09-30', channels: ['Meta Ads', 'Instagram'], pic: 'MBR-C02', status: 'Draft', budgetLine: '', budgetPlan: 15000000, target: { leads: 90, bookings: 45, revenue: 40000000 }, baseline: 'Belum ada · mulai September', utm: 'cmp005_couple_retreat', window: 14, history: [h('Draft', '2026-08-18', 'MBR-C02')], retro: '' },
      { id: 'CMP-006', name: 'Bisma Grand Opening', template: 'TPL-02', objective: 'Booking pertama dan awareness Bisma', audience: 'Warga lokal & ekspat Ubud', offer: 'Diskon pembukaan 15%', outlets: ['OUT-BSM'], start: '2026-07-01', end: '2026-08-31', channels: ['TikTok', 'Instagram'], pic: 'MBR-C05', status: 'Paused', budgetLine: 'BGL-BSM-2608-01', budgetPlan: 20000000, target: { leads: 320, bookings: 160, revenue: 110000000 }, baseline: 'Outlet baru · tanpa baseline', utm: 'cmp006_bisma_opening', window: 21, history: [h('Draft', '2026-06-10', 'MBR-C05'), h('Approved', '2026-06-15', 'Commercial Manager'), h('Running', '2026-07-01', 'MBR-C05'), h('Paused', '2026-08-15', 'Commercial Manager', 'Kapasitas terapis Bisma belum cukup untuk slot sore')], retro: '' },
      { id: 'CMP-007', name: 'Triloka Always-on Meta', template: 'TPL-04', objective: 'Jaga arus booking Triloka dari Meta Ads', audience: 'Wisatawan di Ubud 25–45', offer: 'Booking WhatsApp tanpa antre', outlets: ['OUT-TRL'], start: '2026-07-01', end: '2026-12-31', channels: ['Meta Ads', 'Instagram'], pic: 'MBR-C02', status: 'Running', budgetLine: 'BGL-TRL-2608-01', budgetPlan: 18000000, target: { leads: 420, bookings: 210, revenue: 160000000 }, baseline: 'Juli 2026 · 187 booking teratribusi', utm: 'cmp007_triloka_meta', window: 14, history: [h('Draft', '2026-06-20', 'MBR-C02'), h('Approved', '2026-06-24', 'MBR-C01'), h('Scheduled', '2026-06-26', 'MBR-C02'), h('Running', '2026-07-01', 'MBR-C02')], retro: '' }
    ],
    assets: [
      { id: 'AST-001', title: 'Reels teaser Wellness Escape', format: 'Reels', brand: 'BR-SPA', version: 2, status: 'approved', content: 'CNT-005' },
      { id: 'AST-002', title: 'Carousel 5 manfaat wellness', format: 'Carousel', brand: 'BR-SPA', version: 1, status: 'review', content: 'CNT-003' },
      { id: 'AST-003', title: 'Reels Wellness Escape 60 detik', format: 'Reels', brand: 'BR-SPA', version: 1, status: 'draft', content: 'CNT-002' },
      { id: 'AST-004', title: 'Reels Sunset Ritual', format: 'Reels', brand: 'BR-SPA', version: 3, status: 'approved', content: 'CNT-004' },
      { id: 'AST-005', title: 'Logo Jaens Spa (master)', format: 'Logo', brand: 'BR-SPA', version: 4, status: 'approved', content: '' },
      { id: 'AST-006', title: 'Template carousel promo', format: 'Template', brand: 'BR-SPA', version: 2, status: 'approved', content: '' },
      { id: 'AST-007', title: 'Video Couple Retreat', format: 'Reels', brand: 'BR-SPA', version: 2, status: 'draft', content: 'CNT-008' },
      { id: 'AST-008', title: 'Banner Essence katalog', format: 'Static', brand: 'BR-ESS', version: 1, status: 'approved', content: 'CNT-007' }
    ],
    content: [
      { id: 'CNT-001', title: 'Ide: ritual pagi di Triloka', campaign: 'CMP-005', pillar: 'Wellness ritual', format: 'Reels', channels: ['Instagram'], brand: 'BR-SPA', stage: 'Idea', priority: 'Sedang', due: '2026-08-28', pics: {}, assets: [], checklist: [], reviews: [], log: [{ at: '2026-08-19', by: 'MBR-C02', text: 'Ide dibuat dari brief CMP-005' }], archived: false, source: 'campaign' },
      { id: 'CNT-002', title: 'Reels Wellness Escape 60 detik', campaign: 'CMP-001', pillar: 'Treatment showcase', format: 'Reels', channels: ['Instagram', 'TikTok'], brand: 'BR-SPA', stage: 'Editing', priority: 'Tinggi', due: '2026-08-20', pics: { planner: 'MBR-C02', creator: 'MBR-C03', editor: 'MBR-C04', reviewer: 'MBR-C01', publisher: 'MBR-C05', analyst: 'MBR-C02' }, assets: ['AST-003'], checklist: [['Script disetujui', true], ['Shooting selesai', true], ['Subtitle', false], ['CTA WhatsApp + kode', false]], reviews: [], log: [{ at: '2026-08-12', by: 'MBR-C03', text: 'Shooting selesai di Center' }, { at: '2026-08-15', by: 'MBR-C04', text: 'Masuk Editing' }], archived: false, source: 'campaign' },
      { id: 'CNT-003', title: 'Carousel 5 manfaat wellness', campaign: 'CMP-001', pillar: 'Brand story', format: 'Carousel', channels: ['Instagram', 'Facebook'], brand: 'BR-SPA', stage: 'Review', priority: 'Sedang', due: '2026-08-23', pics: { planner: 'MBR-C02', creator: 'MBR-C06', editor: 'MBR-C06', reviewer: 'MBR-C01', publisher: 'MBR-C05', analyst: 'MBR-C02' }, assets: ['AST-002'], checklist: [['Copy final', true], ['Desain 5 slide', true], ['Cek brand guideline', true]], reviews: [], log: [{ at: '2026-08-20', by: 'MBR-C06', text: 'Diajukan ke review' }], archived: false, source: 'campaign' },
      { id: 'CNT-004', title: 'Reels Sunset Ritual', campaign: 'CMP-002', pillar: 'Treatment showcase', format: 'Reels', channels: ['Instagram', 'TikTok'], brand: 'BR-SPA', stage: 'Scheduled', priority: 'Tinggi', due: '2026-08-24', pics: { planner: 'MBR-C05', creator: 'MBR-C03', editor: 'MBR-C04', reviewer: 'MBR-C01', publisher: 'MBR-C05', analyst: 'MBR-C02' }, assets: ['AST-004'], checklist: [['Disetujui', true]], reviews: [{ at: '2026-08-19', by: 'MBR-C01', decision: 'approve', note: 'Siap tayang', version: 3 }], approvedAt: '2026-08-19', log: [{ at: '2026-08-19', by: 'MBR-C01', text: 'Approved v3' }, { at: '2026-08-20', by: 'MBR-C05', text: 'Dijadwalkan Instagram + TikTok' }], archived: false, source: 'campaign' },
      { id: 'CNT-005', title: 'Reels teaser Wellness Escape', campaign: 'CMP-001', pillar: 'Promo & offer', format: 'Reels', channels: ['Instagram'], brand: 'BR-SPA', stage: 'Published', priority: 'Tinggi', due: '2026-08-05', pics: { planner: 'MBR-C02', creator: 'MBR-C03', editor: 'MBR-C04', reviewer: 'MBR-C01', publisher: 'MBR-C05', analyst: 'MBR-C02' }, assets: ['AST-001'], checklist: [['Disetujui', true], ['Terbit', true]], reviews: [{ at: '2026-08-03', by: 'MBR-C01', decision: 'revise', note: 'Tambahkan kode campaign di caption', version: 1 }, { at: '2026-08-04', by: 'MBR-C01', decision: 'approve', note: 'OK', version: 2 }], approvedAt: '2026-08-04', results: { views: 48200, clicks: 1240, leads: 46, bookings: 19, revenue: 14250000 }, log: [{ at: '2026-08-05', by: 'MBR-C05', text: 'Terbit di Instagram' }], archived: false, source: 'campaign' },
      { id: 'CNT-006', title: 'Countdown Bisma Grand Opening', campaign: 'CMP-006', pillar: 'Promo & offer', format: 'Carousel', channels: ['TikTok', 'Instagram'], brand: 'BR-SPA', stage: 'Approved Idea', priority: 'Rendah', due: '2026-09-02', pics: { planner: 'MBR-C05' }, assets: [], checklist: [], reviews: [], log: [{ at: '2026-08-14', by: 'MBR-C05', text: 'Ide disetujui' }], archived: false, source: 'campaign' },
      { id: 'CNT-007', title: 'Banner katalog Jaens Essence', campaign: '', pillar: 'Brand story', format: 'Static', channels: ['Website'], brand: 'BR-ESS', stage: 'Analysed', priority: 'Rendah', due: '2026-07-20', pics: { planner: 'MBR-C06', creator: 'MBR-C06', reviewer: 'MBR-C01', publisher: 'MBR-C05', analyst: 'MBR-C02' }, assets: ['AST-008'], checklist: [], reviews: [{ at: '2026-07-18', by: 'MBR-C01', decision: 'approve', note: 'OK', version: 1 }], approvedAt: '2026-07-18', results: { views: 3100, clicks: 210, leads: 0, bookings: 0, revenue: 0 }, log: [{ at: '2026-07-31', by: 'MBR-C02', text: 'Analisis selesai' }], archived: true, source: 'brand' },
      { id: 'CNT-008', title: 'Video Couple Retreat (revisi)', campaign: 'CMP-005', pillar: 'Treatment showcase', format: 'Reels', channels: ['Instagram'], brand: 'BR-SPA', stage: 'Editing', priority: 'Sedang', due: '2026-08-27', pics: { planner: 'MBR-C02', creator: 'MBR-C03', editor: 'MBR-C04', reviewer: 'MBR-C01', publisher: 'MBR-C05', analyst: 'MBR-C02' }, assets: ['AST-007'], checklist: [['CTA WhatsApp', false]], reviews: [{ at: '2026-08-21', by: 'MBR-C01', decision: 'revise', note: 'CTA WhatsApp belum ada dan durasi terlalu panjang', version: 1 }], log: [{ at: '2026-08-21', by: 'MBR-C01', text: 'Minta revisi → kembali ke Editing (v2)' }], archived: false, source: 'campaign' }
    ],
    publications: [
      { id: 'PUB-001', content: 'CNT-005', platform: 'Instagram', account: '@jaensspa', scheduledAt: '2026-08-05 18:00', status: 'published', postId: 'IG-DEMO-1001', url: 'https://example.invalid/IG-DEMO-1001', utm: 'cmp001_wellness_escape&utm_content=reels_teaser', publishedAt: '2026-08-05 18:02' },
      { id: 'PUB-002', content: 'CNT-004', platform: 'Instagram', account: '@jaensspa.shanti', scheduledAt: '2026-08-24 18:00', status: 'scheduled', postId: '', url: '', utm: 'cmp002_sunset_ritual&utm_content=reels' },
      { id: 'PUB-003', content: 'CNT-004', platform: 'TikTok', account: '@jaensspa', scheduledAt: '2026-08-24 19:00', status: 'scheduled', postId: '', url: '', utm: 'cmp002_sunset_ritual&utm_content=tiktok' }
    ],
    brands: [
      { id: 'BR-SPA', name: 'Jaens Spa', unit: 'Spa', els: { logo: ['approved', 4], palette: ['approved', 3], font: ['approved', 2], grid: ['approved', 2], tone: ['review', 2], tagline: ['approved', 1], brandbook: ['approved', 3], template: ['approved', 2], thumbnail: ['approved', 1], merch: ['draft', 1] } },
      { id: 'BR-ESS', name: 'Jaens Essence', unit: 'Essence', els: { logo: ['approved', 2], palette: ['approved', 2], font: ['approved', 1], grid: ['approved', 1], tone: ['draft', 1], tagline: ['approved', 1], brandbook: ['approved', 1], template: ['approved', 1], thumbnail: ['approved', 1], merch: ['approved', 1] } },
      { id: 'BR-ACD', name: 'Jaens Academy', unit: 'Academy', els: { logo: ['approved', 1], palette: ['approved', 1], font: ['approved', 1], grid: ['review', 1], tone: ['draft', 1], tagline: ['review', 1], brandbook: ['draft', 1], template: ['approved', 1], thumbnail: ['approved', 1], merch: ['none', 0] } },
      { id: 'BR-CARE', name: 'Care Estate', unit: 'Care', els: { logo: ['approved', 1], palette: ['approved', 1], font: ['review', 1], grid: ['draft', 1], tone: ['draft', 1], tagline: ['approved', 1], brandbook: ['draft', 1], template: ['review', 1], thumbnail: ['none', 0], merch: ['none', 0] } }
    ],
    messages: [
      { id: 'MSG-001', brand: 'BR-SPA', title: 'Ritual penyembuhan khas Ubud', text: 'Tenang dulu, baru pulang. Ritual Bali yang dikerjakan terapis bersertifikat.', version: 3, status: 'approved', owner: 'MBR-C01' },
      { id: 'MSG-002', brand: 'BR-SPA', title: 'CTA reservasi', text: 'Pesan slot lewat WhatsApp dengan kode campaign agar promo tercatat.', version: 2, status: 'approved', owner: 'MBR-C02' },
      { id: 'MSG-003', brand: 'BR-ESS', title: 'Bahan alami', text: 'Minyak esensial racikan sendiri, dari kebun ke botol.', version: 1, status: 'review', owner: 'MBR-C06' },
      { id: 'MSG-004', brand: 'BR-ACD', title: 'Karier terapis', text: 'Belajar dari terapis senior Jaens, praktik langsung di spa.', version: 1, status: 'draft', owner: 'MBR-C06' }
    ],
    comms: [
      { id: 'COM-001', date: '2026-08-05', title: 'Peluncuran Wellness Escape', audience: 'Followers Instagram', channel: 'Instagram', type: 'Digital', status: 'Terdistribusi', campaign: 'CMP-001', locations: [] },
      { id: 'COM-002', date: '2026-08-12', title: 'Brosur Sunset Ritual di lobby hotel partner', audience: 'Tamu hotel', channel: 'Brosur', type: 'Offline', status: 'Terdistribusi', campaign: 'CMP-002', locations: ['Shanti Resort Demo', 'Ubud Hotel Demo'] },
      { id: 'COM-003', date: '2026-08-20', title: 'Email member: menu Agustus', audience: 'Member aktif', channel: 'Email', type: 'Digital', status: 'Disetujui', campaign: '', locations: [] },
      { id: 'COM-004', date: '2026-08-25', title: 'Standing banner Bisma', audience: 'Pejalan kaki Jl. Bisma', channel: 'Banner', type: 'Offline', status: 'Menunggu approval', campaign: 'CMP-006', locations: ['Jaens Spa Bisma'] },
      { id: 'COM-005', date: '2026-08-28', title: 'Poster Couple Retreat', audience: 'Tamu Triloka', channel: 'Poster', type: 'Offline', status: 'Draft', campaign: 'CMP-005', locations: ['Jaens Spa Triloka'] },
      { id: 'COM-006', date: '2026-09-01', title: 'Siaran WhatsApp member', audience: 'Member opt-in', channel: 'WhatsApp', type: 'Digital', status: 'Draft', campaign: '', locations: [] }
    ],
    offline: Array.from({ length: 30 }, (_, i) => {
      const n = i + 1, types = ['Brosur', 'Poster', 'Standing banner', 'Menu board', 'Voucher', 'Signage'], depts = ['Operational', 'Sales B2B', 'Commercial', 'Academy'];
      const status = n <= 26 ? 'Terdistribusi' : n <= 28 ? 'Disetujui' : 'Produksi';
      return { id: `REQ-OFF-${String(n).padStart(2, '0')}`, type: types[i % types.length], dept: depts[i % depts.length], pic: n % 2 ? 'MBR-C06' : 'MBR-C03', due: `2026-08-${String(Math.min(28, 2 + i)).padStart(2, '0')}`, done: status === 'Produksi' ? '' : `2026-08-${String(Math.min(28, 2 + i + (n % 7 === 0 ? 2 : 0))).padStart(2, '0')}`, status, rework: n % 9 === 0 ? 1 : 0, placements: status === 'Terdistribusi' ? 1 + (n % 3) : 0 };
    }),
    tasks: [
      { id: 'TASK-C01', key: 'content:CNT-003:review', object: 'CNT-003', type: 'content', action: 'Review konten Carousel 5 manfaat', pic: 'MBR-C01', due: '2026-08-23', status: 'planned', source: 'Content Studio' },
      { id: 'TASK-C02', key: 'lead:LEAD-001:followup', object: 'LEAD-001', type: 'lead', action: 'Follow-up lead Instagram → WhatsApp', pic: 'MBR-S01', due: '2026-08-22', status: 'planned', source: 'Sales B2C' },
      { id: 'TASK-C03', key: 'experiment:CTA-WA', object: 'CMP-001', type: 'campaign', action: 'Evaluasi uji CTA WhatsApp 7 hari', pic: 'MBR-C02', due: '2026-08-29', status: 'planned', source: 'AI Mentor (simulasi)' }
    ]
  };

  const fresh = () => JSON.parse(JSON.stringify(SEED));
  const ensure = (state) => { if (!state.cx) state.cx = fresh(); return state.cx; };
  const need = (cond, msg) => { if (!cond) throw Error(msg); };
  const next = (cx, prefix) => { cx.seq[prefix] = (cx.seq[prefix] || 0) + 1; return `${prefix}-${String(cx.seq[prefix]).padStart(3, '0')}`; };
  const person = (id) => PEOPLE.find(p => p.id === id);
  const personName = (id) => person(id)?.name || 'Belum ditentukan';
  const stagePic = (c) => c.pics[STAGE_ROLE[c.stage]] || '';
  const campaign = (cx, id) => cx.campaigns.find(c => c.id === id);
  const content = (cx, id) => cx.content.find(c => c.id === id);

  /* Brand progress = Σ weight of approved elements ÷ Σ weight of applicable elements ("none" = not applicable). */
  function brandProgress(b) {
    const applicable = BRAND_ELEMENTS.filter(([k]) => b.els[k][0] !== 'none');
    const total = applicable.reduce((s, e) => s + e[2], 0), done = applicable.filter(([k]) => b.els[k][0] === 'approved').reduce((s, e) => s + e[2], 0);
    return { done, total, ratio: total ? done / total : null, pending: applicable.filter(([k]) => b.els[k][0] !== 'approved').map(e => e[1]) };
  }

  /* Content can be scheduled only after Approved; asset change after approval sends it back to Review. */
  function moveStage(cx, c, to, by) {
    need(STAGES.includes(to), 'Tahap tidak dikenal.');
    const from = STAGES.indexOf(c.stage), dest = STAGES.indexOf(to);
    need(c.stage !== to, 'Konten sudah di tahap ini.');
    if (dest > from) {
      if (dest >= STAGES.indexOf('Planned')) need(!!c.pics.planner, 'Tetapkan PIC sebelum merencanakan konten.');
      if (dest >= STAGES.indexOf('Scheduled')) need(!!c.approvedAt, 'Konten belum disetujui reviewer, belum bisa dijadwalkan.');
      if (to === 'Approved') need(false, 'Gunakan tombol Approve di panel Review.');
      if (to === 'Published') need(false, 'Status Published mengikuti publikasi per platform.');
    }
    c.log.push({ at: TODAY, by, text: `Tahap ${c.stage} → ${to}` });
    c.stage = to;
  }

  function update(state, action, input = {}) {
    const cx = ensure(state);
    const by = input.by || 'MBR-C01';
    switch (action) {
      /* ----- campaign ----- */
      case 'cmp-create': {
        const tpl = TEMPLATES.find(t => t.id === input.template) || TEMPLATES[0];
        const name = String(input.name || '').trim();
        need(name.length >= 4, 'Nama campaign minimal 4 karakter.');
        const utm = String(input.utm || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        need(utm.length >= 4, 'Isi kode UTM campaign.');
        const outlets = [input.outlet || 'OUT-UBD'];
        const clash = cx.campaigns.find(c => c.utm === utm && c.status !== 'Closed' && c.outlets.some(o => outlets.includes(o)));
        need(!clash, `UTM “${utm}” sudah dipakai ${clash?.id} pada outlet yang sama.`);
        const id = next(cx, 'CMP');
        cx.campaigns.push({ id, name, template: tpl.id, objective: input.objective || tpl.objective, audience: input.audience || 'Belum diisi', offer: input.offer || 'Belum diisi', outlets, start: input.start || '2026-09-01', end: input.end || '2026-09-30', channels: tpl.channels.slice(), pic: input.pic || 'MBR-C02', status: 'Draft', budgetLine: '', budgetPlan: Number(input.budget) || 0, target: { leads: Number(input.leads) || 0, bookings: Number(input.bookings) || 0, revenue: Number(input.revenue) || 0 }, baseline: 'Belum dipilih', utm, window: tpl.window, history: [h('Draft', TODAY, by)], retro: '' });
        return id;
      }
      case 'cmp-approve': case 'cmp-schedule': case 'cmp-run': case 'cmp-pause': case 'cmp-resume': case 'cmp-close': {
        const c = campaign(cx, input.id); need(c, 'Campaign tidak ditemukan.');
        const t = { 'cmp-approve': [['Draft'], 'Approved'], 'cmp-schedule': [['Approved'], 'Scheduled'], 'cmp-run': [['Scheduled'], 'Running'], 'cmp-pause': [['Running'], 'Paused'], 'cmp-resume': [['Paused'], 'Running'], 'cmp-close': [['Running', 'Paused'], 'Closed'] }[action];
        need(t[0].includes(c.status), `Status campaign sudah ${c.status}.`);
        const note = String(input.note || '').trim();
        if (action === 'cmp-pause') need(note.length >= 5, 'Tulis alasan pause.');
        if (action === 'cmp-close') { need(note.length >= 5, 'Isi retrospektif singkat sebelum menutup campaign.'); c.retro = note; }
        c.status = t[1]; c.history.push(h(t[1], TODAY, by, note));
        return c.id;
      }
      /* ----- content ----- */
      case 'cnt-create': {
        const title = String(input.title || '').trim();
        need(title.length >= 4, 'Judul konten minimal 4 karakter.');
        const cmp = input.campaign ? campaign(cx, input.campaign) : null;
        const id = next(cx, 'CNT');
        const pics = input.pic ? { planner: input.pic } : {};
        cx.content.push({ id, title, campaign: cmp ? cmp.id : '', pillar: input.pillar || PILLARS[0], format: input.format || 'Reels', channels: [input.channel || 'Instagram'], brand: 'BR-SPA', stage: input.from === 'reference' ? 'Reference' : 'Idea', priority: input.priority || 'Sedang', due: input.due || '2026-08-31', pics, assets: [], checklist: [], reviews: [], log: [{ at: TODAY, by, text: `Dibuat dari ${input.from === 'reference' ? 'reference' : cmp ? 'brief ' + cmp.id : 'nol'}` }], archived: false, source: cmp ? 'campaign' : 'manual' });
        return id;
      }
      case 'cnt-stage': {
        const c = content(cx, input.id); need(c, 'Konten tidak ditemukan.');
        moveStage(cx, c, input.to, by);
        return c.id;
      }
      case 'cnt-assign': {
        const c = content(cx, input.id); need(c, 'Konten tidak ditemukan.');
        need(PEOPLE.some(p => p.id === input.pic), 'PIC tidak valid.');
        const role = input.role || STAGE_ROLE[c.stage];
        const old = c.pics[role];
        c.pics[role] = input.pic;
        c.log.push({ at: TODAY, by, text: `PIC ${role}: ${personName(old)} → ${personName(input.pic)}` });
        return c.id;
      }
      case 'cnt-submit': {
        const c = content(cx, input.id); need(c, 'Konten tidak ditemukan.');
        need(['Production', 'Editing'].includes(c.stage), 'Hanya konten di Production/Editing yang bisa diajukan review.');
        need(c.assets.length, 'Tambahkan aset sebelum review.');
        moveStage(cx, c, 'Review', by);
        c.assets.forEach(a => { const as = cx.assets.find(x => x.id === a); if (as && as.status === 'draft') as.status = 'review'; });
        return c.id;
      }
      case 'cnt-approve': case 'cnt-revise': {
        const c = content(cx, input.id); need(c, 'Konten tidak ditemukan.');
        need(c.stage === 'Review', 'Konten tidak sedang di Review.');
        const note = String(input.note || '').trim();
        const asset = cx.assets.find(a => a.id === c.assets[0]);
        if (action === 'cnt-revise') {
          need(note.length >= 5, 'Tulis catatan revisi.');
          c.reviews.push({ at: TODAY, by, decision: 'revise', note, version: asset?.version || 1 });
          if (asset) { asset.status = 'draft'; asset.version += 1; }
          c.log.push({ at: TODAY, by, text: `Minta revisi → Editing (aset v${asset?.version || 1})` });
          c.stage = 'Editing'; c.approvedAt = '';
        } else {
          c.reviews.push({ at: TODAY, by, decision: 'approve', note: note || 'Disetujui', version: asset?.version || 1 });
          if (asset) asset.status = 'approved';
          c.approvedAt = TODAY; c.stage = 'Approved';
          c.log.push({ at: TODAY, by, text: `Approved v${asset?.version || 1}` });
        }
        return c.id;
      }
      case 'cnt-asset': {
        /* new asset version: after approval it must be reviewed again */
        const c = content(cx, input.id); need(c, 'Konten tidak ditemukan.');
        let asset = cx.assets.find(a => a.id === c.assets[0]);
        if (!asset) { asset = { id: next(cx, 'AST'), title: c.title, format: c.format, brand: c.brand, version: 1, status: 'draft', content: c.id }; cx.assets.push(asset); c.assets.push(asset.id); c.log.push({ at: TODAY, by, text: `Aset ${asset.id} v1 ditambahkan` }); return c.id; }
        asset.version += 1; asset.status = 'draft';
        const wasApproved = !!c.approvedAt;
        if (wasApproved) { c.approvedAt = ''; if (STAGES.indexOf(c.stage) >= STAGES.indexOf('Approved') && c.stage !== 'Published' && c.stage !== 'Analysed') { c.stage = 'Review'; cx.publications.filter(p => p.content === c.id && p.status === 'scheduled').forEach(p => { p.status = 'draft'; }); } }
        c.log.push({ at: TODAY, by, text: `Aset ${asset.id} v${asset.version}${wasApproved ? ' · perlu review ulang' : ''}` });
        return c.id;
      }
      case 'cnt-reuse': {
        const c = content(cx, input.id), asset = cx.assets.find(a => a.id === input.asset);
        need(c && asset, 'Konten atau aset tidak ditemukan.');
        need(asset.status === 'approved', 'Hanya aset yang disetujui yang bisa dipakai ulang.');
        need(!c.assets.includes(asset.id), 'Aset sudah dipakai di konten ini.');
        c.assets.push(asset.id); c.log.push({ at: TODAY, by, text: `Memakai aset ${asset.id} v${asset.version} (referensi)` });
        return c.id;
      }
      case 'cnt-schedule': {
        const c = content(cx, input.id); need(c, 'Konten tidak ditemukan.');
        need(c.approvedAt, 'Konten belum disetujui, belum bisa dijadwalkan.');
        const platform = input.platform || c.channels[0];
        need(c.channels.includes(platform), 'Platform tidak ada di daftar channel konten.');
        const at = String(input.at || '').replace('T', ' ');
        need(/^2026-\d\d-\d\d \d\d:\d\d$/.test(at), 'Isi tanggal dan jam publikasi.');
        const account = input.account || (platform === 'TikTok' ? '@jaensspa' : '@jaensspa');
        const clash = cx.publications.find(p => p.account === account && p.platform === platform && p.scheduledAt === at && p.status !== 'draft' && p.content !== c.id);
        need(!clash, `Bentrok: ${clash?.id} sudah terjadwal di ${account} ${platform} pada ${at}.`);
        let pub = cx.publications.find(p => p.content === c.id && p.platform === platform && p.status !== 'published');
        if (!pub) { pub = { id: next(cx, 'PUB'), content: c.id, platform, account, scheduledAt: at, status: 'scheduled', postId: '', url: '', utm: (campaign(cx, c.campaign)?.utm || 'organic') + '&utm_content=' + c.id.toLowerCase() }; cx.publications.push(pub); }
        else Object.assign(pub, { scheduledAt: at, status: 'scheduled', account });
        if (STAGES.indexOf(c.stage) < STAGES.indexOf('Scheduled')) c.stage = 'Scheduled';
        c.log.push({ at: TODAY, by, text: `Jadwal ${platform} ${at}` });
        return pub.id;
      }
      case 'pub-publish': {
        const p = cx.publications.find(x => x.id === input.id); need(p && p.status === 'scheduled', 'Publikasi tidak sedang terjadwal.');
        const c = content(cx, p.content);
        p.status = 'published'; p.publishedAt = p.scheduledAt; p.postId = `${p.platform.slice(0, 2).toUpperCase()}-DEMO-${1000 + cx.publications.indexOf(p) + 1}`; p.url = `https://example.invalid/${p.postId}`;
        c.log.push({ at: TODAY, by, text: `Terbit di ${p.platform} · ${p.postId}` });
        const done = c.channels.every(ch => cx.publications.some(x => x.content === c.id && x.platform === ch && x.status === 'published'));
        if (done) { c.stage = 'Published'; if (!c.results) c.results = { views: 0, clicks: 0, leads: 0, bookings: 0, revenue: 0 }; }
        return p.id;
      }
      case 'cnt-analyse': {
        const c = content(cx, input.id); need(c && c.stage === 'Published', 'Konten belum Published.');
        c.stage = 'Analysed'; c.log.push({ at: TODAY, by, text: 'Analisis hasil dicatat' });
        return c.id;
      }
      case 'cnt-archive-done': {
        const done = cx.content.filter(c => c.stage === 'Analysed' && !c.archived);
        done.forEach(c => { c.archived = true; c.log.push({ at: TODAY, by, text: 'Diarsipkan' }); });
        return done.length;
      }
      case 'cnt-check': {
        const c = content(cx, input.id); need(c, 'Konten tidak ditemukan.');
        const i = Number(input.index); need(c.checklist[i], 'Checklist tidak ditemukan.');
        c.checklist[i][1] = !c.checklist[i][1];
        return c.id;
      }
      /* ----- brand ----- */
      case 'brand-submit': case 'brand-approve': case 'brand-revise': {
        const b = cx.brands.find(x => x.id === input.id); need(b && b.els[input.el], 'Elemen brand tidak ditemukan.');
        const el = b.els[input.el];
        const t = { 'brand-submit': ['draft', 'review'], 'brand-approve': ['review', 'approved'], 'brand-revise': ['approved', 'draft'] }[action];
        need(el[0] === t[0], `Status elemen sudah ${el[0]}.`);
        el[0] = t[1]; if (action === 'brand-revise') el[1] += 1;
        return b.id;
      }
      case 'msg-version': {
        const m = cx.messages.find(x => x.id === input.id); need(m, 'Pesan tidak ditemukan.');
        if (m.status === 'review') { m.status = 'approved'; return m.id; }
        need(String(input.text || '').trim().length >= 10, 'Tulis versi pesan baru (min. 10 karakter).');
        m.text = String(input.text).trim().slice(0, 200); m.version += 1; m.status = 'review';
        return m.id;
      }
      case 'com-advance': {
        const m = cx.comms.find(x => x.id === input.id); need(m, 'Komunikasi tidak ditemukan.');
        const flow = ['Draft', 'Menunggu approval', 'Disetujui', 'Terdistribusi'];
        const i = flow.indexOf(m.status); need(i < flow.length - 1, 'Sudah terdistribusi.');
        m.status = flow[i + 1];
        return m.id;
      }
      /* ----- work items (Daily Race link). Same key → same task (retry-safe). ----- */
      case 'task-create': {
        const key = String(input.key || ''); need(key, 'Kunci tindakan kosong.');
        const existing = cx.tasks.find(t => t.key === key);
        if (existing) return existing.id;
        const id = `TASK-C${String(cx.seq.TASK = (cx.seq.TASK || 0) + 1).padStart(2, '0')}`;
        cx.tasks.push({ id, key, object: input.object || '', type: input.type || 'insight', action: String(input.action || '').slice(0, 160), pic: input.pic || 'MBR-C02', due: input.due || '2026-08-29', status: 'planned', source: input.source || 'Executive Insight', metric: input.metric || '' });
        return id;
      }
      case 'task-done': {
        const t = cx.tasks.find(x => x.id === input.id); need(t && t.status === 'planned', 'Tugas sudah diproses.');
        t.status = 'done'; t.doneAt = TODAY; return t.id;
      }
      default: throw Error('Aksi Commercial tidak tersedia.');
    }
  }

  return { TODAY, STAGES, STAGE_ROLE, PEOPLE, PILLARS, PLATFORMS, CAMPAIGN_FLOW, BRAND_ELEMENTS, TEMPLATES, fresh, ensure, update, person, personName, stagePic, brandProgress };
})();
if (typeof module !== 'undefined') module.exports = CX;
