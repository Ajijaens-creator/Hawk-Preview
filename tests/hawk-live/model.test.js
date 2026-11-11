/* HAWK four-portal sandbox · acceptance tests from HAWK-CLOUD-HANDOFF.md + SER reconciliation (F1-02 spec).
   Run: node tests/hawk-live/model.test.js */
'use strict';
const path = require('path');
global.HAWK = require(path.join(__dirname, '../../hawk-live/model.js'));
const SER = require(path.join(__dirname, '../../hawk-live/ser-data.js'));
let pass = 0, fail = 0; const results = [];
const ok = (name, cond, info = '') => { (cond ? pass++ : fail++); results.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ' · ' + info : ''}`); };
const throws = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
const JT = 1e6;

/* 1 Budget awal */
let s = HAWK.fresh(), t = HAWK.totals(s);
ok('Budget awal: pagu 25.000.000, aktual 3.500.000, komitmen 0, sisa 21.500.000', s.budget === 25e6 && t.actual === 3.5e6 && t.committed === 0 && t.remaining === 21.5e6);
/* 2 Pengajuan ke aktual */
HAWK.update(s, 'request', { amount: '2000000' }); HAWK.update(s, 'approve', { id: 'MRF-002' }); t = HAWK.totals(s);
ok('Setelah setuju: komitmen 2.000.000, sisa 19.500.000', t.committed === 2e6 && t.remaining === 19.5e6);
HAWK.update(s, 'post', { id: 'MRF-002' }); t = HAWK.totals(s);
ok('Setelah posting: komitmen 0, aktual 5.500.000, sisa 19.500.000', t.committed === 0 && t.actual === 5.5e6 && t.remaining === 19.5e6);
/* 3 Pagu tidak cukup */
s = HAWK.fresh(); HAWK.update(s, 'request', { amount: '25000000' }); const before = JSON.stringify(HAWK.totals(s));
ok('Pagu tidak cukup: approval Rp25.000.000 ditolak', /tidak mencukupi/.test(throws(() => HAWK.update(s, 'approve', { id: 'MRF-002' })) || ''));
ok('Pagu tidak cukup: komitmen, aktual, sisa tidak berubah', JSON.stringify(HAWK.totals(s)) === before);
/* 4 Campaign ke revenue */
s = HAWK.fresh(); HAWK.update(s, 'request', { amount: '2000000' }); HAWK.update(s, 'approve', { id: 'MRF-002' }); HAWK.update(s, 'post', { id: 'MRF-002' });
ok('Revenue awal Rp750.000', HAWK.totals(s).revenue === 750000);
HAWK.update(s, 'book', { id: 'LEAD-001', slot: '11.00' }); ['checkin', 'complete', 'pay'].forEach(a => HAWK.update(s, a, { id: 'BK-002' })); t = HAWK.totals(s);
ok('Campaign → revenue: total 1.500.000, campaign 750.000', t.revenue === 1.5e6 && t.attributed === 750000);
ok('ROAS ≈ 0,14× setelah Rp2.000.000 direalisasi', Math.abs(t.roas - 0.136) < 0.005, t.roas.toFixed(3));
/* 5 Bentrok / aksi ulang */
const rev = t.revenue, n = s.bookings.length;
ok('Slot sama ditolak', /Slot/.test(throws(() => HAWK.update(s, 'book', { slot: '11.00' })) || '') && s.bookings.length === n);
ok('Bayar ulang ditolak tanpa revenue tambahan', !!throws(() => HAWK.update(s, 'pay', { id: 'BK-002' })) && HAWK.totals(s).revenue === rev);
/* 6 Referral */
s = HAWK.fresh();
ok('Driver belum aktif tidak bisa booking referral', /belum aktif/.test(throws(() => HAWK.update(s, 'book', { slot: '11.00', referral: 'yes' })) || ''));
ok('Aktivasi tanpa perjanjian ditolak', !!throws(() => HAWK.update(s, 'activate')));
HAWK.update(s, 'agreement'); HAWK.update(s, 'activate'); HAWK.update(s, 'book', { slot: '13.00', referral: 'yes' }); ['checkin', 'complete', 'pay'].forEach(a => HAWK.update(s, a, { id: 'BK-002' }));
ok('Komisi Rp75.000 untuk booking Rp750.000 × 10%', HAWK.totals(s).commission === 75000);
HAWK.update(s, 'payout', { id: 'BK-002' });
ok('Pembayaran komisi kedua ditolak', !!throws(() => HAWK.update(s, 'payout', { id: 'BK-002' })));
/* 7 Refund */
ok('Refund booking yang komisinya sudah dibayar perlu penyesuaian Finance', /penyesuaian Finance/.test(throws(() => HAWK.update(s, 'refund', { id: 'BK-002' })) || ''));
s = HAWK.fresh(); HAWK.update(s, 'agreement'); HAWK.update(s, 'activate'); HAWK.update(s, 'book', { slot: '13.00', referral: 'yes' }); ['checkin', 'complete', 'pay'].forEach(a => HAWK.update(s, a, { id: 'BK-002' }));
HAWK.update(s, 'refund', { id: 'BK-002' }); t = HAWK.totals(s);
ok('Refund (komisi belum dibayar): booking keluar dari revenue dan komisi', t.revenue === 750000 && t.commission === 0);
/* 8 Kinerja tim */
s = HAWK.fresh(); HAWK.update(s, 'task', { id: 'TASK-02' });
ok('Verifikasi tugas Sales menambah jumlah selesai', s.tasks.filter(x => x.team === 'Sales' && x.status === 'done').length === 1);

/* SER reconciliation · fixture 4 outlet (Center/Ubud, Shanti, Triloka, Bisma) · NB Commercial + KPI audit */
s = HAWK.fresh();
let a = SER.summary(s, '2026-08', 'all').cur;
ok('SER Agu semua outlet: revenue Rp4.130 jt', a.revenue === 4130 * JT, String(a.revenue));
ok('SER Agu semua outlet: target Rp4.550 jt', a.target === 4550 * JT);
ok('SER Agu semua outlet: 4.885 pelanggan unik, 4.990 order, 5.574 tamu', a.customers === 4885 && a.orders === 4990 && a.guests === 5574);
let u = SER.summary(s, '2026-08', 'ubud').cur;
ok('SER Agu Ubud: revenue Rp1.680 jt, 1.880 pelanggan', u.revenue === 1680 * JT && u.customers === 1880);
ok('SER Agu Ubud: pagu Rp120 jt, realisasi Rp63 jt', u.pagu === 120 * JT && u.actual === 63 * JT);
ok('Revenue Target Attainment = revenue ÷ target', Math.abs(a.etr - 4130 / 4550) < 1e-12);
ok('Country Forecast Accuracy terpisah dari attainment (1 − WAPE, ada bias)', a.forecastAccuracy > 0 && a.forecastAccuracy <= 1 && a.forecastAccuracy !== a.etr && typeof a.forecastBias === 'number');
ok('AOV = revenue ÷ order (bukan pelanggan); revenue per guest terpisah', a.aov === a.revenue / a.orders && a.rpg === a.revenue / a.guests);
ok('ROMI warisan SER = revenue ÷ biaya marketing, dipisah dari ROMI kontribusi', Math.abs(a.romiLegacy - a.revenue / a.actual) < 1e-9 && a.romi !== a.romiLegacy);
ok('Coverage atribusi di antara 0 dan 1', a.coverage > 0 && a.coverage <= 1);
ok('Refund dikecualikan dari revenue dan order', a.refunded.length > 0 && a.paid.every(x => x.status === 'paid'));
const jul = SER.summary(s, '2026-07', 'all').cur;
ok('Filter Juli: Rp3.765 jt; Bisma tanpa target → attainment hanya atas outlet bertarget', jul.revenue === 3765 * JT && jul.missingTarget.join() === 'OUT-BSM' && Math.abs(jul.etr - ['ubud', 'shanti', 'triloka'].reduce((x, o) => x + SER.summary(s, '2026-07', o).cur.revenue, 0) / jul.target) < 1e-12);
const sep = SER.summary(s, '2026-09', 'all').cur;
ok('Periode belum ditutup (Sep): hasData=false, rasio = null ("—")', !sep.hasData && sep.etr === null && sep.aov === null && sep.romi === null && sep.revenue === 0);
const S = SER.summary(s, '2026-08', 'all');
ok('Channel group: jumlah grup = total revenue', S.groups.reduce((x, g) => x + g.revenue, 0) === a.revenue);
ok('Country: jumlah negara = total pelanggan unik', S.countries.reduce((x, c) => x + c.customers, 0) === a.customers);
ok('Annual chart 2023–2026; Agu 2026 = KPI revenue; bulan kosong = null', S.annual[7].y2026 === a.revenue && S.annual[7].y2023 > 0 && S.annual[8].y2026 === null);
ok('Semua outlet = Center + Shanti + Triloka + Bisma', a.revenue === ['ubud', 'shanti', 'triloka', 'bisma'].reduce((x, o) => x + SER.summary(s, '2026-08', o).cur.revenue, 0));
ok('Lost reason: inquiry lost dan booking batal dipisah', S.cancel.every(c => c.total === c.lost + c.cancelled));
ok('ID transaksi POS unik', new Set(S.ds.tx.map(x => x.id)).size === S.ds.tx.length);
/* Sandbox connection */
HAWK.update(s, 'request', { amount: '2000000' }); HAWK.update(s, 'approve', { id: 'MRF-002' });
u = SER.summary(s, '2026-08', 'ubud').cur;
ok('Sandbox → SER: komitmen CMP-001 Rp2 jt muncul di Budget Ubud, sisa turun', u.committed === 2 * JT && u.remaining === (120 - 63 - 2) * JT);
HAWK.update(s, 'post', { id: 'MRF-002' }); u = SER.summary(s, '2026-08', 'ubud').cur;
ok('Sandbox → SER: posting memindah ke realisasi Rp65 jt (sekali)', u.committed === 0 && u.actual === 65 * JT && !!throws(() => HAWK.update(s, 'post', { id: 'MRF-002' })));
HAWK.update(s, 'book', { id: 'LEAD-001', slot: '11.00' }); ['checkin', 'complete', 'pay'].forEach(x => HAWK.update(s, x, { id: 'BK-002' }));
a = SER.summary(s, '2026-08', 'all').cur;
ok('Sandbox → SER: booking LEAD-001 dibayar menambah Rp750.000 sekali', a.revenue === 4130 * JT + 750000 && a.paid.filter(x => x.booking === 'BK-002').length === 1);
HAWK.update(s, 'refund', { id: 'BK-002' }); a = SER.summary(s, '2026-08', 'all').cur;
ok('Sandbox → SER: refund mengeluarkan transaksi dari revenue', a.revenue === 4130 * JT && a.refunded.some(x => x.booking === 'BK-002'));
HAWK.update(s, 'refund', { id: 'BK-001' }); a = SER.summary(s, '2026-08', 'all').cur;
ok('Sandbox → SER: refund BK-001 (bagian fixture Agustus) ikut keluar dari revenue', a.revenue === 4130 * JT - 750000);

/* Commercial Budget: tolak pengajuan */
s = HAWK.fresh(); HAWK.update(s, 'request', { amount: '1500000', campaign: 'CMP-001', pos: 'Promotion', note: 'Boost Reels' });
ok('Tolak pengajuan butuh alasan ≥5 karakter', !!throws(() => HAWK.update(s, 'reject', { id: 'MRF-002', reason: 'x' })));
HAWK.update(s, 'reject', { id: 'MRF-002', reason: 'Belum ada brief kreatif' });
ok('Pengajuan ditolak: status rejected, histori tercatat, sisa tidak berubah', s.requests.find(r => r.id === 'MRF-002').status === 'rejected' && HAWK.totals(s).remaining === 21.5e6 && s.requests.find(r => r.id === 'MRF-002').history.length >= 2);

/* Fase 2A · Campaign, Content Studio, Brand (CX) */
global.CX = require(path.join(__dirname, '../../hawk-live/commercial-model.js'));
s = HAWK.fresh(); const cx = CX.ensure(s); const by = 'MBR-C01';
ok('Campaign baru dari brief → Draft', /^CMP-/.test(CX.update(s, 'cmp-create', { template: 'TPL-01', name: 'Uji Campaign', outlet: 'OUT-SHT', utm: 'uji_baru', by })));
ok('UTM bentrok pada outlet yang sama ditolak', /UTM|utm/.test(throws(() => CX.update(s, 'cmp-create', { template: 'TPL-01', name: 'Uji Dua', outlet: 'OUT-SHT', utm: 'uji_baru', by })) || ''));
ok('Pause campaign wajib alasan', !!throws(() => CX.update(s, 'cmp-pause', { id: 'CMP-001', note: '' })));
ok('Tutup campaign wajib retrospektif', !!throws(() => CX.update(s, 'cmp-close', { id: 'CMP-001', note: 'ok' })));
ok('Konten tanpa PIC tidak bisa ke Planned', /PIC/.test(throws(() => CX.update(s, 'cnt-stage', { id: 'CNT-001', to: 'Planned' })) || ''));
ok('Konten belum approve tidak bisa dijadwalkan', /belum disetujui/.test(throws(() => CX.update(s, 'cnt-schedule', { id: 'CNT-003', platform: 'Instagram', at: '2026-08-25 18:00' })) || ''));
CX.update(s, 'cnt-revise', { id: 'CNT-003', note: 'Ganti foto slide 2' });
const ast2 = cx.assets.find(x => x.id === 'AST-002');
ok('Minta revisi: kembali ke Editing, versi aset naik', cx.content.find(c => c.id === 'CNT-003').stage === 'Editing' && ast2.version >= 2);
CX.update(s, 'cnt-submit', { id: 'CNT-003' }); CX.update(s, 'cnt-approve', { id: 'CNT-003' });
const c3 = cx.content.find(c => c.id === 'CNT-003');
ok('Approve: tahap Approved, aset approved', c3.stage === 'Approved' && ast2.status === 'approved');
const p1 = CX.update(s, 'cnt-schedule', { id: 'CNT-003', platform: 'Instagram', at: '2026-08-25 18:00' });
const p2 = CX.update(s, 'cnt-schedule', { id: 'CNT-003', platform: 'Facebook', at: '2026-08-25 18:00' });
ok('Satu aset → dua publikasi (Instagram + Facebook)', p1 !== p2 && cx.publications.filter(p => p.content === 'CNT-003').length === 2);
{ const sc = HAWK.fresh(); CX.ensure(sc); CX.update(sc, 'cnt-submit', { id: 'CNT-002' }); CX.update(sc, 'cnt-approve', { id: 'CNT-002' });
  ok('Bentrok akun + platform + jam ditolak', /Bentrok/.test(throws(() => CX.update(sc, 'cnt-schedule', { id: 'CNT-002', platform: 'TikTok', account: '@jaensspa', at: '2026-08-24 19:00' })) || '')); }
CX.update(s, 'pub-publish', { id: p1 });
ok('Satu platform terbit → konten belum Published', c3.stage !== 'Published');
CX.update(s, 'pub-publish', { id: p2 });
ok('Semua platform terbit → Published', c3.stage === 'Published');
s = HAWK.fresh(); const cx2 = CX.ensure(s);
CX.update(s, 'cnt-asset', { id: 'CNT-004' });
ok('Aset baru setelah approve → kembali Review, jadwal dibatalkan', cx2.content.find(c => c.id === 'CNT-004').stage === 'Review' && cx2.publications.filter(p => p.content === 'CNT-004').every(p => p.status === 'draft'));
ok('Reuse hanya aset approved', !!throws(() => CX.update(s, 'cnt-reuse', { id: 'CNT-001', asset: 'AST-004' })));
const t1 = CX.update(s, 'task-create', { key: 'insight-x', action: 'Uji' }), t2 = CX.update(s, 'task-create', { key: 'insight-x', action: 'Uji' });
ok('Buat tindakan idempoten (kunci sama → satu tugas)', t1 === t2 && cx2.tasks.filter(t => t.key === 'insight-x').length === 1);
const br = cx2.brands[0]; const before2 = CX.brandProgress(br).done;
const el = CX.BRAND_ELEMENTS.find(([k]) => br.els[k][0] === 'review');
if (el) CX.update(s, 'brand-approve', { id: br.id, el: el[0] });
ok('Brand progress = bobot elemen approved (naik setelah approve)', !el || CX.brandProgress(br).done === before2 + el[2]);

/* Fase 2B · Digital, Social, KOL, Attribution, AI Mentor (MK) */
global.MK = require(path.join(__dirname, '../../hawk-live/marketing-model.js'));
s = HAWK.fresh(); let c2 = CX.ensure(s);
ok('MK seed tersedia di state.cx.mk', !!c2.mk && c2.mk.partners.length === 4);
const n0 = c2.mk.imports.length; CX.update(s, 'snap-import', { platform: 'TikTok Ads' }); CX.update(s, 'snap-import', { platform: 'TikTok Ads' });
ok('Impor ulang snapshot tidak menggandakan baris', c2.mk.imports.length === n0 + 1 && c2.mk.imports.find(x => x.platform === 'TikTok Ads').reimported === 1);
let ads = MK.adsView(SER.dataset(s), '2026-08');
const crv9 = ads.find(r => r.campaign === 'CMP-006').creatives.find(c => c.id === 'CRV-09');
ok('Denominator nol: creative 0 impressions → CTR/CPM null', crv9.impressions === 0 && MK.div(crv9.clicks, crv9.impressions) === null);
const noCamp = ads.find(r => !r.campaign);
ok('Spend tanpa UTM: CPL null (0 lead), ROAS 0 (spend ada, revenue tidak teratribusi)', noCamp.spend > 0 && noCamp.cpl === null && noCamp.roas === 0);
ok('ROAS campaign = revenue POS dibayar ÷ spend', ads.filter(r => r.campaign && r.spend).every(r => Math.abs(r.roas - r.revenue / r.spend) < 1e-9));
CX.update(s, 'utm-map', { utm: 'ig_story_aug', campaign: 'CMP-001' });
ok('Mapping UTM tersimpan', c2.mk.utm.find(u => u.utm === 'ig_story_aug').status === 'mapped');
const e1 = CX.update(s, 'exp-create', { key: 'k1', title: 'Uji CTA story', baseline: '0.4', variant: 'Chat & Book' }), e2 = CX.update(s, 'exp-create', { key: 'k1', title: 'Uji CTA story', baseline: '0.4', variant: 'Chat & Book' });
ok('Eksperimen idempoten per kunci', e1 === e2 && c2.mk.experiments.filter(e => e.key === 'k1').length === 1);
ok('Hasil eksperimen wajib keputusan Lanjut/Ubah/Henti', !!throws(() => CX.update(s, 'exp-result', { id: e1, result: '0.5', decision: 'Mungkin' })));
CX.update(s, 'exp-result', { id: e1, result: '0.5', decision: 'Lanjut' });
ok('Eksperimen selesai dengan hasil vs baseline', c2.mk.experiments.find(e => e.id === e1).status === 'Selesai');
ok('Alih DM ke Sales butuh kategori Reservasi', /Reservasi/.test(throws(() => CX.update(s, 'conv-handoff', { id: 'CONV-002' })) || ''));
const L1 = CX.update(s, 'conv-handoff', { id: 'CONV-001' }), L2 = CX.update(s, 'conv-handoff', { id: 'CONV-001' });
const lead = s.leads.find(l => l.id === L1);
ok('Alih DM membuat lead dengan ringkasan + asal campaign; retry memakai lead yang sama', L1 === L2 && s.leads.filter(l => l.conversation === 'CONV-001').length === 1 && lead.campaign === 'CMP-001' && !!lead.summary);
/* Instagram → WhatsApp → booking → POS: satu revenue */
let before3 = SER.summary(s, '2026-08', 'all').cur.revenue;
HAWK.update(s, 'book', { id: L1, slot: '11.00' }); const bk = s.bookings.find(b => b.lead === L1).id; ['checkin', 'complete', 'pay'].forEach(a => HAWK.update(s, a, { id: bk }));
let after3 = SER.summary(s, '2026-08', 'all');
ok('Jalur DM → lead → booking → POS menambah revenue satu kali (Rp750.000)', after3.cur.revenue === before3 + 750000 && after3.ds.tx.filter(t => t.booking === bk).length === 1);
/* KOL code */
ok('Kode KOL kedaluwarsa ditolak', /kedaluwarsa/.test(throws(() => HAWK.update(s, 'book', { slot: '13.00', code: 'KOL-RAKA10' })) || ''));
ok('Kode KOL tidak dikenal ditolak', /tidak valid/.test(throws(() => HAWK.update(s, 'book', { slot: '13.00', code: 'KOL-XXX' })) || ''));
const kp = (id) => SER.dataset(s).tx.filter(t => t.period === '2026-08' && t.status === 'paid' && MK.kolOf(t) === id).length;
const k1 = kp('KOL-001'), k2 = kp('KOL-002');
HAWK.update(s, 'book', { slot: '13.00', code: 'kol-anya10' }); const bk2 = s.bookings.slice(-1)[0].id; ['checkin', 'complete', 'pay'].forEach(a => HAWK.update(s, a, { id: bk2 }));
ok('Booking kode KOL-ANYA10 dibayar → hanya KOL-001 bertambah', kp('KOL-001') === k1 + 1 && kp('KOL-002') === k2);
/* Exceptions */
const unk = SER.dataset(s).tx.find(t => t.period === '2026-08' && t.status === 'paid' && t.group === 'Tidak diketahui');
ok('Koreksi atribusi harus lewat antrean', !!throws(() => CX.update(s, 'exc-correct', { id: unk.id, source: 'Walk-in', evidence: 'catatan front desk' })));
CX.update(s, 'exc-queue', { id: unk.id });
ok('Koreksi wajib bukti', !!throws(() => CX.update(s, 'exc-correct', { id: unk.id, source: 'Walk-in', evidence: '' })));
const rv = SER.summary(s, '2026-08', 'all').cur.revenue; CX.update(s, 'exc-correct', { id: unk.id, source: 'Walk-in', evidence: 'catatan front desk' });
ok('Koreksi tercatat dengan histori; total revenue tidak berubah', c2.mk.fixes[unk.id].status === 'corrected' && c2.mk.fixes[unk.id].history.length === 2 && SER.summary(s, '2026-08', 'all').cur.revenue === rv);
/* Mentor */
const pagu0 = s.budget;
const tA = CX.update(s, 'mentor-accept', { id: 'INS-X', action: 'Verifikasi mapping UTM', pic: 'MBR-C02' }), tB = CX.update(s, 'mentor-accept', { id: 'INS-X', action: 'Verifikasi mapping UTM' });
ok('Mentor: terima → satu tugas; retry tidak dobel; budget tidak berubah', tA === tB && c2.tasks.filter(t => t.key === 'mentor-INS-X').length === 1 && s.budget === pagu0);
ok('Mentor: tolak wajib alasan; usulan yang sudah diterima tidak bisa ditolak', !!throws(() => CX.update(s, 'mentor-reject', { id: 'INS-Y', reason: 'x' })) && !!throws(() => CX.update(s, 'mentor-reject', { id: 'INS-X', reason: 'tidak relevan' })));
CX.update(s, 'mentor-edit', { id: 'INS-Y', action: 'Uji CTA lain di TikTok' });
ok('Mentor: ubah usulan menaikkan versi', c2.mk.mentor['INS-Y'].version === 2);
ok('KOL: approval butuh fee & term; deliverable approve hanya dari Menunggu approval', !!throws(() => { const p = c2.mk.partners.find(x => x.id === 'KOL-003'); p.stage = 'Proposal'; CX.update(s, 'kol-advance', { id: 'KOL-003' }); }) && CX.update(s, 'dlv-approve', { id: 'DLV-002' }) === 'DLV-002' && !!throws(() => CX.update(s, 'dlv-approve', { id: 'DLV-002' })));

/* NB 03 · Master Marketing Budget 2027 (B27) */
global.B27 = require(path.join(__dirname, '../../hawk-live/budget2027-model.js'));
s = HAWK.fresh(); let bb = CX.ensure(s).b27;
ok('Acceptance 1: Rp40 miliar × 6% = Rp2,4 miliar', B27.envelope(bb) === 2.4e9);
ok('Acceptance 1: alokasi kategori tersimpan menutup envelope (100%)', B27.CATS.reduce((x, c) => x + B27.allocation(bb, c.id), 0) === 2.4e9);
const q1 = B27.totals(bb, bb.lines.filter(l => B27.inPeriod(l, 'Q1'))).budget, m123 = ['1', '2', '3'].reduce((x, m) => x + B27.totals(bb, bb.lines.filter(l => B27.inPeriod(l, m))).budget, 0);
ok('Acceptance 1: Q1 = Jan + Feb + Mar', q1 === m123 && q1 > 0, String(q1));
ok('Persentase harus 100%', /100%/.test(throws(() => CX.update(s, 'b27-weights', { 'w_CAT-DGT': '45', role: 'commercial-manager' })) || ''));
ok('Marketing Manager tidak bisa mengubah porsi People', /HRD/.test(throws(() => CX.update(s, 'b27-weights', { 'w_CAT-PPL': '10', 'w_CAT-DGT': '45', role: 'commercial-manager' })) || ''));
CX.update(s, 'b27-weights', { 'w_CAT-DGT': '39', 'w_CAT-TLS': '7', role: 'commercial-manager' });
ok('Ubah persentase kategori lain (jumlah tetap 100%) tersimpan dengan histori', bb.weights['CAT-DGT'] === 39 && bb.weightHistory.length === 1);
const left0 = B27.totals(bb, bb.lines).left;
const nid = CX.update(s, 'b27-line-save', { cat: 'CAT-DGT', unit: 'OUT-UBD', sub: 'Paid Ads', child: 'Meta', detail: 'Meta Ads Februari Center', month: '2', qty: '1', unitCost: '20000000', request: '18000000' });
ok('Acceptance 2: tambah draft; draft belum mengurangi sisa tersedia (budget naik, sisa naik sebesar rencana)', B27.totals(bb, bb.lines).left === left0 + 20000000);
CX.update(s, 'b27-line-save', { id: nid, cat: 'CAT-DGT', unit: 'OUT-UBD', sub: 'Paid Ads', child: 'Meta', detail: 'Meta Ads Februari Center (edit)', month: '2', qty: '1', unitCost: '20000000', request: '18000000' });
ok('Acceptance 2: edit draft', bb.lines.find(l => l.id === nid).detail.endsWith('(edit)'));
ok('Acceptance 2: rencana yang melewati alokasi kategori ditolak', /melewati alokasi/.test(throws(() => CX.update(s, 'b27-line-save', { cat: 'CAT-OTH', detail: 'Sponsorship besar', month: '5', qty: '1', unitCost: '90000000' })) || ''));
ok('MRF melebihi rencana baris ditolak', !!throws(() => CX.update(s, 'b27-line-save', { cat: 'CAT-DGT', detail: 'Uji MRF lebih', month: '5', qty: '1', unitCost: '1000000', request: '2000000' })));
CX.update(s, 'b27-submit', { id: nid });
ok('Commercial Manager tidak bisa approve MRF', !!throws(() => CX.update(s, 'b27-approve', { id: nid, role: 'commercial-manager' })));
const before27 = B27.totals(bb, bb.lines);
CX.update(s, 'b27-approve', { id: nid, role: 'finance-manager' });
let mid27 = B27.totals(bb, bb.lines);
ok('Approve → komitmen Rp18 jt, sisa turun Rp18 jt', mid27.committed === before27.committed + 18e6 && mid27.left === before27.left - 18e6);
ok('Approval kedua (simultan) ditolak', !!throws(() => CX.update(s, 'b27-approve', { id: nid, role: 'finance-manager' })));
CX.update(s, 'b27-post', { id: nid });
let post27 = B27.totals(bb, bb.lines);
ok('Acceptance 2: posting penuh memindah komitmen ke aktual; sisa tetap sama', post27.committed === mid27.committed - 18e6 && post27.actual === mid27.actual + 18e6 && post27.left === mid27.left);
ok('Acceptance 3: posting yang sama tidak dijumlahkan dua kali', !!throws(() => CX.update(s, 'b27-post', { id: nid })) && B27.totals(bb, bb.lines).actual === post27.actual);
CX.update(s, 'b27-return', { id: 'BL27-003', reason: 'Lampirkan penawaran vendor', decision: 'return' });
ok('Finance mengembalikan MRF dengan alasan; bisa diedit dan diajukan ulang', bb.lines.find(l => l.id === 'BL27-003').status === 'returned' && CX.update(s, 'b27-submit', { id: 'BL27-003' }) && bb.lines.find(l => l.id === 'BL27-003').status === 'submitted');
ok('FX: baris USD dihitung qty × biaya × kurs', B27.lineAmt(bb.lines.find(l => l.id === 'BL27-009')) === 2 * 15 * 16000);
ok('Perubahan target yang membuat rencana melewati alokasi ditolak', /melewati alokasi/.test(throws(() => CX.update(s, 'b27-assume', { revenue: '1000000000', ratio: '1' })) || ''));
CX.update(s, 'b27-assume', { revenue: '45000000000', ratio: '6' });
ok('Perubahan target tersimpan sebagai versi baru', bb.plan.history.length === 2 && B27.envelope(bb) === 2.7e9);
ok('Scope Marketing Manager: People tidak ada di kategori yang terlihat', !B27.visibleCats('commercial-manager').some(c => c.restricted) && B27.visibleCats('hrd').some(c => c.restricted));
ok('Batch People hanya dari HRD', !!throws(() => CX.update(s, 'b27-people-batch', { role: 'commercial-manager', amount: '1' })));
CX.update(s, 'b27-people-batch', { role: 'hrd', period: '2027-01', amount: '30000000' }); CX.update(s, 'b27-people-batch', { role: 'hrd', period: '2027-01', amount: '30000000' });
ok('Penyegaran ulang batch People tidak menggandakan biaya', bb.peopleBatches.filter(x => x.id === 'PB27-01').length === 1 && bb.peopleBatches.reduce((x, p) => x + p.amount, 0) === 30000000);
CX.update(s, 'b27-people-post', { id: 'PB27-01', role: 'finance-manager' });
ok('Finance memposting batch People; batch diposting tidak bisa ditimpa', bb.peopleBatches[0].status === 'Diposting' && !!throws(() => CX.update(s, 'b27-people-batch', { role: 'hrd', period: '2027-01', amount: '1' })));

console.log(`\n${pass} lulus, ${fail} gagal`);
require('fs').writeFileSync(path.join(__dirname, 'model-results.json'), JSON.stringify({ ranAt: new Date().toISOString(), pass, fail, results }, null, 1));
process.exit(fail ? 1 : 0);
