/* MP-HAWK-14 — Smart Staff Mobile Experience (route #/m/NN, 12 mobile views MS-01…MS-12).
   MS codes are mobile UX views ON TOP of the existing NV screens and engine operations — no new module, no second ledger.
   Every write goes through HAWK.api.call (same contracts, same audit, same mock data as the desktop screens). */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const esc = U.esc;
  const VID = 100; // internal view id used by the shell's click/change delegation (not an NV number)

  /* ---------- registry: MS view → existing HAWK NV screen + engine operations ---------- */
  const SCREENS = [
    { code: '01', name: 'Smart Staff Home', board: 'A', nv: 24, title: 'Beranda', ops: [] },
    { code: '02', name: 'Smart Item Catalog', board: 'A', nv: 25, title: 'Minta Barang', ops: [] },
    { code: '03', name: 'Product Quick Detail', board: 'A', nv: 25, title: 'Detail Barang', ops: [] },
    { code: '04', name: 'My Request Basket', board: 'A', nv: 26, title: 'Permintaan Saya', ops: [] },
    { code: '05', name: 'Submit & Success', board: 'B', nv: 26, title: 'Konfirmasi Permintaan', ops: ['mrf.create'] },
    { code: '06', name: 'My Requests', board: 'B', nv: 27, title: 'Permintaan Saya', ops: ['mrf.cancel'] },
    { code: '07', name: 'Order Journey', board: 'B', nv: 28, title: 'Perjalanan Permintaan', ops: [] },
    { code: '08', name: 'Pickup & Receiving', board: 'B', nv: 28, title: 'Penerimaan Barang', ops: ['mrf.issue', 'mrf.confirmHandover'] },
    { code: '09', name: 'Smart Receipt Camera', board: 'C', nv: 48, title: 'Scan Nota / Bukti Belanja', ops: ['spend.capture'] },
    { code: '10', name: 'AI Receipt Review', board: 'C', nv: 48, title: 'Hasil Analisis AI', ops: ['spend.update', 'spend.submit'] },
    { code: '11', name: 'Facility & Incident Report', board: 'C', nv: 55, title: 'Lapor Fasilitas / Kerusakan', ops: ['mt.create'] },
    { code: '12', name: 'My Tasks & Notifications', board: 'C', nv: 3, title: 'Tugas & Notifikasi', ops: ['mrf.decide', 'mt.review', 'mrf.issue'] },
  ];
  const DEMO_ACCOUNTS = [['U-STF', 'Indah', 'Spa Therapist'], ['U-ATD', 'Dewa', 'Attendant'], ['U-SPV', 'Mila', 'Supervisor'], ['U-PUR', 'Etya', 'Purchasing'], ['U-WHS', 'Supri', 'Gudang'], ['U-FIN', 'Asri', 'Finance']];
  const MS = (HAWK.MS = { SCREENS, VID, DEMO_ACCOUNTS });

  /* ---------- small helpers ---------- */
  const st = () => (ui.local[VID] = ui.local[VID] || {});
  const go = (code, q) => {
    const qs = q ? '?' + Object.entries(q).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&') : '';
    const h = '#/m/' + code + qs;
    if (location.hash === h) HAWK.render();
    else location.hash = h;
    window.scrollTo(0, 0);
  };
  MS.go = go;
  const api = () => HAWK.api;
  const call = (ctx, op, payload) => api().call(op, payload, ctx.user);
  const isOutlet = (u) => ['STAFF', 'SUPERVISOR'].includes(u.role);
  const money = (ctx) => !['STAFF'].includes(ctx.role); // staff never see unit prices / values of stock requests
  const homeBranch = (ctx) => {
    const a = S.assignment(ctx.s, ctx.user);
    return (a && a.branch) || ctx.user.scope.find((x) => (S.org(ctx.s, x) || {}).type === 'BRANCH') || 'BR-UBD';
  };
  const first = (u) => String(u.name || '').split(' ')[0];
  const rel = (ts, s) => {
    if (!ts) return '';
    const now = new Date(s.meta.demoDate + 'T' + (new Date().toTimeString().slice(0, 5)) + ':00');
    const d = (now - new Date(ts)) / 60000;
    if (d < 1) return 'baru saja';
    if (d < 60) return Math.round(d) + ' menit lalu';
    if (d < 60 * 24) return Math.round(d / 60) + ' jam lalu';
    return U.date ? U.date(ts) : String(ts).slice(0, 10);
  };

  /* ---------- item art: inline SVG (no external images, works offline) ---------- */
  const ART = {
    bottle: (c) => `<rect x="19" y="6" width="10" height="7" rx="2" fill="#2b2b2b"/><rect x="14" y="12" width="20" height="30" rx="6" fill="${c || '#7a3f12'}"/><rect x="17" y="22" width="14" height="12" rx="2" fill="#f4ead2"/><circle cx="24" cy="28" r="3" fill="#8b5cf6"/>`,
    dropper: () => `<rect x="21" y="5" width="6" height="10" rx="2" fill="#1f1f1f"/><rect x="17" y="14" width="14" height="27" rx="4" fill="#5a2d0c"/><rect x="19" y="23" width="10" height="9" rx="1.5" fill="#f4ead2"/>`,
    jar: (c) => `<rect x="11" y="13" width="26" height="6" rx="2" fill="#2b2b2b"/><rect x="10" y="18" width="28" height="22" rx="6" fill="${c || '#4a2a14'}"/><rect x="14" y="24" width="20" height="9" rx="2" fill="#e5c66a"/>`,
    towel: () => `<rect x="8" y="28" width="32" height="9" rx="3" fill="#ffffff" stroke="#d9d4c7"/><rect x="10" y="20" width="28" height="9" rx="3" fill="#fbfaf6" stroke="#d9d4c7"/><rect x="12" y="12" width="24" height="9" rx="3" fill="#ffffff" stroke="#d9d4c7"/>`,
    can: () => `<rect x="14" y="8" width="8" height="5" rx="1" fill="#1f6f3a"/><path d="M12 13h24a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3z" fill="#7cc576"/><rect x="15" y="22" width="18" height="10" rx="2" fill="#ffffff"/>`,
    box: () => `<rect x="9" y="16" width="30" height="22" rx="3" fill="#e9e1cf" stroke="#c9b98f"/><path d="M18 16c2-6 10-6 12 0" fill="#ffffff" stroke="#c9b98f"/>`,
    sandal: () => `<ellipse cx="17" cy="26" rx="7" ry="13" fill="#c99a2e"/><ellipse cx="31" cy="26" rx="7" ry="13" fill="#c99a2e"/><path d="M12 22h10M26 22h10" stroke="#fff" stroke-width="3"/>`,
    gear: () => `<circle cx="24" cy="24" r="10" fill="none" stroke="#8a8478" stroke-width="5"/><circle cx="24" cy="24" r="3" fill="#8a8478"/>`,
  };
  const shapeOf = (it) => {
    const n = it.name.toLowerCase();
    if (/essential|10ml/.test(n)) return ['dropper'];
    if (/minyak|oil/.test(n)) return ['bottle', /kelapa/.test(n) ? '#d8c27a' : '#7a3f12'];
    if (/scrub|lulur/.test(n)) return ['jar', /lulur/.test(n) ? '#a1662f' : '#4a2a14'];
    if (/handuk|towel/.test(n)) return ['towel'];
    if (/sabun|5l|jerigen/.test(n)) return ['can'];
    if (/sandal/.test(n)) return ['sandal'];
    if (it.cat === 'Suku Cadang') return ['gear'];
    return ['box'];
  };
  const art = (it, size = 48) => {
    const [k, c] = shapeOf(it);
    return `<span class="ms-art" style="width:${size}px;height:${size}px" aria-hidden="true"><svg viewBox="0 0 48 48" width="${size * 0.82}" height="${size * 0.82}">${ART[k](c)}</svg></span>`;
  };
  MS.art = art;

  /* ---------- catalog data: stock availability ≠ request allowance ---------- */
  const CATS = [['ALL', 'Semua', '▦'], ['OIL', 'Minyak & Esens', '🫙'], ['SPA', 'Perawatan Spa', '🌿'], ['LINEN', 'Linen & Handuk', '🧺'], ['CLEAN', 'Kebersihan', '🧼']];
  const catOf = (it) => (/minyak|oil|essential/i.test(it.name) && it.cat === 'BHP Treatment' ? 'OIL' : it.cat === 'BHP Treatment' ? 'SPA' : it.cat === 'Linen' ? 'LINEN' : it.cat === 'Kebersihan' ? 'CLEAN' : 'OTHER');
  const ABOUT = {
    OIL: 'Minyak untuk pijat & aromaterapi. Simpan tertutup, jauh dari panas.',
    SPA: 'Bahan perawatan tubuh untuk treatment. Pakai sesuai SOP takaran.',
    LINEN: 'Linen bersih untuk tamu. Kembalikan yang kotor ke laundry.',
    CLEAN: 'Perlengkapan kebersihan ruang treatment & toilet.',
    OTHER: 'Barang operasional outlet.',
  };
  function catalog(ctx, branch) {
    const s = ctx.s;
    const wh = (S.whOfOrg(s, branch) || {}).id;
    const used = {};
    s.mrfs.filter((m) => m.branch === branch).forEach((m) => m.lines.forEach((l) => (used[l.item] = (used[l.item] || 0) + 1)));
    return s.items
      .filter((i) => i.routine && i.cat !== 'Bahan Baku Essence' && i.cat !== 'Suku Cadang' && i.cat !== 'Promosi')
      .map((it) => {
        const avail = wh ? S.available(s, wh, it.id) : 0;
        const row = wh ? S.stock(s, wh, it.id) : null;
        const b = S.itemBudget(s, branch, it.id);
        const stock = avail <= 0 ? { k: 'out', t: 'Kosong di outlet — akan dipesankan' } : row && avail < row.min ? { k: 'low', t: 'Stok terbatas' } : { k: 'ok', t: 'Tersedia' };
        return { it, cat: catOf(it), avail, stock, allowance: b ? b.availableQty : null, used: used[it.id] || 0 };
      })
      .sort((a, b) => b.used - a.used || a.it.name.localeCompare(b.it.name));
  }
  const cartLines = (L) => Object.entries(L.cart || {}).filter(([, q]) => q > 0).map(([item, qty]) => ({ item, qty }));
  const cartCount = (L) => U.sum(cartLines(L), (l) => l.qty);

  /* ---------- staff-friendly MRF status ---------- */
  function mrfState(s, m) {
    const f = S.mrfFulfillment(s, m);
    const pend = S.handoverPending(s, m);
    const toConfirm = U.sum(pend, (x) => x.qty);
    const confirmed = U.sum(pend, (x) => x.confirmed + x.short);
    const purchase = m.lines.some((l) => (l.alloc || []).some((a) => a.path === 'PURCHASE' && a.issuedQty < a.qty));
    const poSent = m.lines.some((l) => (l.alloc || []).some((a) => a.path === 'PURCHASE' && a.ref && ['SENT', 'PARTIAL', 'RECEIVED', 'CLOSED'].includes((s.pos.find((p) => p.id === a.ref) || {}).status)));
    const transit = s.transfers.some((t) => t.mrf === m.id && t.status === 'IN_TRANSIT');
    if (['REJECTED', 'CANCELLED'].includes(m.status)) return { k: 'stop', t: m.status === 'REJECTED' ? 'Ditolak' : 'Dibatalkan', tone: 'bad' };
    if (m.status === 'DRAFT') return { k: 'draft', t: 'Draft', tone: '' };
    if (m.status === 'REVISION') return { k: 'rev', t: 'Perlu diperbaiki', tone: 'warn' };
    if (['SUBMITTED', 'ESCALATED'].includes(m.status)) return { k: 'wait', t: 'Menunggu persetujuan', tone: 'info' };
    if (toConfirm > 0) return { k: 'ready', t: 'Siap diterima', tone: 'gold' };
    if (m.status === 'FULFILLED' && confirmed >= f.issued) return { k: 'done', t: 'Selesai', tone: 'ok' };
    if (m.status === 'FULFILLED') return { k: 'done', t: 'Selesai', tone: 'ok' };
    if (transit || poSent) return { k: 'ship', t: 'Dalam pengiriman', tone: 'info' };
    if (purchase) return { k: 'proc', t: 'Dalam pengadaan', tone: 'warn' };
    return { k: 'prep', t: 'Disiapkan gudang', tone: 'info' };
  }
  MS.mrfState = mrfState;
  const chip = (x) => `<span class="ms-chip ${x.tone}">${esc(x.t)}</span>`;
  const myMrfs = (ctx) => ctx.s.mrfs.filter((m) => (ctx.role === 'STAFF' ? m.requester === ctx.user.id : ctx.role === 'SUPERVISOR' ? ctx.user.scope.includes(m.branch) : ctx.inScope(m.branch)));
  const itemsText = (s, m) => `${m.lines.length} barang`;

  /* ---------- journey (MS-07) ---------- */
  function journey(s, m) {
    const h = (a) => (m.history || []).find((x) => x.action === a);
    const appr = (m.approvals || []).length;
    const chain = m.chain || (S.mrfChain(s, m) || {}).chain || ['SUPERVISOR'];
    const x = mrfState(s, m);
    const order = ['wait', 'prep', 'proc', 'ship', 'ready', 'done'];
    const at = x.k === 'stop' ? -1 : order.indexOf(x.k);
    const approvedAt = (m.approvals || []).slice(-1)[0];
    const stepsArr = [
      { t: 'Permintaan diajukan', d: U.datetime(m.date), done: true },
      { t: chain.length > 1 ? `Persetujuan atasan (${appr}/${chain.length})` : 'Persetujuan Supervisor', d: approvedAt ? `${U.datetime(approvedAt.ts)} · ${esc(S.userName(s, approvedAt.by))}` : x.k === 'stop' ? x.t : at > 0 ? 'Disetujui' : 'Menunggu ' + chain.slice(appr).map((r) => HAWK.ROLE_LABEL[r] || r).join(' → '), done: at > 0, cur: at === 0 },
      { t: x.k === 'proc' || m.lines.some((l) => (l.alloc || []).some((a) => a.path === 'PURCHASE')) ? 'Dalam pengadaan' : 'Disiapkan gudang', d: x.k === 'proc' ? 'Sedang disiapkan oleh Purchasing' : 'Diambil dari stok outlet / gudang', done: at > 2 || (at > 1 && x.k !== 'proc'), cur: at === 1 || at === 2 },
      { t: 'Dalam pengiriman', d: x.k === 'ship' ? 'Barang dalam perjalanan ke outlet' : 'Menunggu pengiriman ke outlet (bila perlu)', done: at > 3, cur: at === 3 },
      { t: 'Siap diterima', d: x.k === 'ready' ? 'Konfirmasi penerimaan barang' : 'Konfirmasi saat barang diserahkan', done: at > 4, cur: at === 4 },
    ];
    return { steps: stepsArr, state: x, h };
  }

  /* ---------- tasks & notifications (MS-12) ---------- */
  function feed(ctx) {
    const { s, user: u, role } = ctx;
    const out = [];
    const add = (o) => out.push(o);
    // outlet staff: my requests, receipts, facility reports
    s.mrfs.filter((m) => m.requester === u.id).forEach((m) => {
      const x = mrfState(s, m);
      if (x.k === 'ready') add({ kind: 'task', icon: '📦', title: 'Barang siap diterima', sub: `${m.id} · ${itemsText(s, m)}`, ts: ((m.history || []).filter((h) => h.action === 'ISSUE').slice(-1)[0] || {}).ts, go: ['08', { id: m.id }], dot: true, t: 'ready-' + m.id });
      (m.history || []).filter((h) => ['APPROVE', 'REJECT', 'REVISION'].includes(h.action) && h.by !== u.id).slice(-1).forEach((h) => add({ kind: 'note', icon: h.action === 'APPROVE' ? '✅' : '⚠️', title: h.action === 'APPROVE' ? 'Permintaan disetujui' : h.action === 'REJECT' ? 'Permintaan ditolak' : 'Permintaan perlu diperbaiki', sub: `${m.id} · oleh ${S.userName(s, h.by)}${h.note ? ' — ' + h.note : ''}`, ts: h.ts, go: ['07', { id: m.id }] }));
    });
    (s.spends || []).filter((sp) => sp.createdBy === u.id).forEach((sp) => {
      if (sp.status === 'DRAFT') add({ kind: 'task', icon: '🧾', title: 'Hasil scan nota siap dicek', sub: `${sp.fields.supplier || 'Nota'} · ${sp.lines.length} barang`, ts: sp.ts, go: ['10', { id: sp.id }], dot: true, t: 'sp-' + sp.id });
      else if (sp.status === 'RETURNED') add({ kind: 'task', icon: '↩️', title: 'Nota dikembalikan — perbaiki', sub: sp.id, ts: sp.ts, go: ['10', { id: sp.id }], dot: true });
      else add({ kind: 'note', icon: '🧾', title: 'Nota ' + (HAWK.ui.statusLabel ? HAWK.ui.statusLabel(sp.status) : sp.status), sub: `${sp.id} · ${sp.fields.supplier || ''}`, ts: sp.submittedAt || sp.ts, nv: [48, { tab: 'history', sel: sp.id }] });
    });
    s.maintenance.filter((m) => m.reporter === u.id).forEach((m) => add({ kind: 'note', icon: '🔧', title: 'Tindak lanjut laporan fasilitas', sub: `${m.id} · ${{ SUBMITTED: 'Menunggu Supervisor', APPROVED: 'Disetujui — menunggu teknisi', IN_PROGRESS: 'Sedang ditangani', REJECTED: 'Ditolak', DONE: 'Selesai', COMPLETED: 'Selesai' }[m.status] || m.status}`, ts: m.date, go: ['11', { id: m.id }] }));
    // supervisor: approvals, facility reviews, handover for outlets without warehouse staff
    if (['SUPERVISOR', 'HEAD_DIV', 'BU_MANAGER', 'OWNER'].includes(role))
      s.mrfs.forEach((m) => {
        const step = S.mrfNextApprover(s, m);
        if (step && S.canApproveStep(s, u, step, m) && !(m.approvals || []).some((a) => a.by === u.id)) add({ kind: 'task', icon: '📝', title: 'Persetujuan permintaan', sub: `${m.id} · ${S.userName(s, m.requester)} · ${itemsText(s, m)}`, ts: m.date, approve: m.id, dot: true, t: 'appr-' + m.id });
      });
    if (role === 'SUPERVISOR' || role === 'ASSET')
      s.maintenance.filter((m) => m.status === 'SUBMITTED' && (role === 'ASSET' || u.scope.includes(m.branch))).forEach((m) => add({ kind: 'task', icon: '🔧', title: 'Laporan fasilitas baru', sub: `${m.id} · ${m.area || (S.asset(s, m.asset) || {}).name || ''} · ${{ LOW: 'Rutin', MEDIUM: 'Segera', HIGH: 'Mendesak' }[m.priority]}`, ts: m.date, mt: m.id, dot: true, t: 'mt-' + m.id }));
    if (['SUPERVISOR', 'WAREHOUSE'].includes(role))
      s.mrfs.filter((m) => m.status === 'IN_FULFILLMENT' && (role === 'WAREHOUSE' || u.scope.includes(m.branch))).forEach((m) => {
        const ready = U.sum(m.lines, (l) => U.sum(l.alloc || [], (a) => a.readyQty - a.issuedQty));
        if (ready > 0) add({ kind: 'task', icon: '🤝', title: `Serahkan barang ke ${first(S.user(s, m.requester) || { name: 'pemohon' })}`, sub: `${m.id} · ${ready} unit siap · ${S.orgName(s, m.branch)}`, ts: m.date, issue: m.id, dot: true, t: 'iss-' + m.id });
      });
    if (role === 'PURCHASING') {
      const pk = S.pendingPurchase(s);
      if (pk.length) add({ kind: 'task', icon: '🛒', title: `${pk.length} kebutuhan menunggu PO`, sub: [...new Set(pk.map((x) => x.mrf))].slice(0, 3).join(', '), ts: s.meta.demoDate, nv: [32], dot: true, t: 'pur' });
    }
    // everything else the desktop inbox already knows (Finance, Purchasing, etc.)
    if (!['STAFF'].includes(role))
      HAWK.tasks(s, u).filter((t) => !['MRF'].includes(t.type) && !(t.type === 'MAINTENANCE' && role === 'SUPERVISOR')).forEach((t) => add({ kind: 'task', icon: '📌', title: t.title, sub: `${t.type} ${t.ref} · ${t.unit || ''}`, ts: s.meta.demoDate, nv: [t.nv, t.q || {}], t: 'tk-' + t.type + t.ref }));
    return out.sort((a, b) => (b.dot ? 1 : 0) - (a.dot ? 1 : 0) || String(b.ts || '').localeCompare(String(a.ts || '')));
  }
  MS.feed = feed;

  /* =====================================================================================
     Screens
     ===================================================================================== */
  const head = (ctx, title, back, right) => `<header class="ms-head"><div class="ms-head-row">${back ? `<button class="ms-ib" data-a="msgo" data-to="${back}" aria-label="Kembali">←</button>` : `<button class="ms-ib" data-a="msmenu" aria-label="Menu">☰</button>`}<h1>${esc(title)}</h1>${right || ''}</div></header>`;
  const tabbar = (ctx, cur) => {
    const n = feed(ctx).filter((x) => x.dot).length;
    const T = [['01', '⌂', 'Beranda'], ['02', '🛒', 'Barang'], ['06', '◷', 'Permintaan'], ['12', '☑', 'Tugas']];
    return `<nav class="ms-tabs" aria-label="Navigasi aplikasi">${T.map(([c, i, l]) => `<button class="${c === cur || (cur === '07' && c === '06') || (cur === '04' && c === '02') ? 'on' : ''}" data-a="msgo" data-to="${c}" data-ms-tab="${c}"><span class="ms-ti">${i}${c === '12' && n ? `<b class="ms-badge">${n}</b>` : ''}</span>${l}</button>`).join('')}</nav>`;
  };
  const meLine = (ctx) => {
    const a = S.assignment(ctx.s, ctx.user);
    return a ? `${esc(a.branchName || S.orgName(ctx.s, a.branch) || '')}` : '';
  };

  /* MS-01 Smart Staff Home */
  function home(ctx) {
    const { s, user: u } = ctx;
    const a = S.assignment(s, u) || {};
    const mine = myMrfs(ctx).filter((m) => m.requester === u.id || !isOutlet(u));
    const active = mine.filter((m) => !['stop', 'done'].includes(mrfState(s, m).k));
    const ready = mine.filter((m) => mrfState(s, m).k === 'ready');
    const tasks = feed(ctx).filter((x) => x.dot);
    const outlet = isOutlet(u);
    const tiles = [
      ['06', '📋', 'Permintaan Saya', active.length],
      ['08', '📦', 'Penerimaan Barang', ready.length],
      ['09', '📷', 'Scan Nota', 0],
      ['11', '🔧', 'Lapor Fasilitas', 0],
    ];
    if (u.role === 'SUPERVISOR') tiles.unshift(['12', '📝', 'Persetujuan', tasks.filter((x) => x.approve || x.mt).length]);
    return `<section class="ms-hero-bg"><div class="ms-hello"><div class="tiny">${esc(a.branchName || S.orgName(s, u.scope[0]) || '')}</div><h2>Halo, ${esc(first(u))} 👋</h2><div class="small">${esc(a.dept || u.title || HAWK.ROLE_LABEL[u.role])}</div></div></section>
      <div class="ms-body">
        ${outlet ? `<button class="ms-cta" data-a="msgo" data-to="02" data-ms-t="hero-request"><span class="ms-cta-ic">🛒</span><span><b>Minta Barang</b><span class="small">Ajukan kebutuhan operasional dengan cepat dan mudah</span></span><span class="ms-cta-go">→</span></button>
        <div class="ms-tiles">${tiles.map(([c, i, l, n]) => `<button class="ms-tile" data-a="msgo" data-to="${c}" data-ms-t="tile-${c}"><span class="ms-tile-ic">${i}${n ? `<b class="ms-badge">${n}</b>` : ''}</span>${esc(l)}</button>`).join('')}</div>` : `<div class="ms-card ms-glass"><b>Akun ${esc(HAWK.ROLE_LABEL[u.role])}</b><p class="small">Aplikasi staf ini menampilkan tugas Anda yang terkait dengan staf outlet. Pekerjaan lengkap (PO, gudang, keuangan) tetap di layar desktop HAWK.</p><button class="ms-btn" data-a="msgo" data-to="12">Lihat tugas saya (${tasks.length})</button></div>`}
        <div class="ms-sec"><h3>Status Permintaan Terbaru</h3><button class="ms-link" data-a="msgo" data-to="06">Lihat Semua ›</button></div>
        ${mine.slice(0, 3).map((m) => reqCard(ctx, m)).join('') || `<div class="ms-empty">Belum ada permintaan. Tekan <b>Minta Barang</b> untuk mulai.</div>`}
      </div>`;
  }
  const reqCard = (ctx, m) => {
    const x = mrfState(ctx.s, m);
    return `<button class="ms-row ms-req" data-a="msgo" data-to="07" data-id="" data-q='${JSON.stringify({ id: m.id })}' data-ms-req="${m.id}"><span class="ms-art sm">📦</span><span class="ms-grow"><b class="mono">${m.id}</b><span class="tiny muted">${itemsText(ctx.s, m)} · ${rel(m.date, ctx.s)}</span></span>${chip(x)}<span class="ms-chev">›</span></button>`;
  };

  /* MS-02 Smart Item Catalog (+ MS-03 sheet) */
  function catalogView(ctx) {
    const L = st();
    L.cart = L.cart || {};
    const branch = homeBranch(ctx);
    const rows = catalog(ctx, branch);
    const cat = L.cat || 'ALL';
    const q = (L.find || '').toLowerCase();
    const list = rows.filter((r) => (cat === 'ALL' || r.cat === cat) && (!q || r.it.name.toLowerCase().includes(q)));
    const n = cartLines(L).length;
    return `<div class="ms-body">
      <label class="ms-search"><span>🔍</span><input type="search" placeholder="Cari barang (mis. minyak, handuk, sabun)" value="${esc(L.find || '')}" data-ch="msfind" data-in="msfind" aria-label="Cari barang"></label>
      <div class="ms-cats" role="tablist">${CATS.map(([k, l, i]) => `<button class="${cat === k ? 'on' : ''}" data-a="mscat" data-k="${k}" role="tab" aria-selected="${cat === k}"><span>${i}</span>${l}</button>`).join('')}</div>
      <div class="ms-sec"><h3>🔥 Sering Diminta</h3><span class="tiny muted">${esc(S.orgName(ctx.s, branch))}</span></div>
      <div class="ms-list">${list.map((r) => itemRow(ctx, r)).join('') || '<div class="ms-empty">Barang tidak ditemukan. Coba kata lain.</div>'}</div>
      <p class="tiny muted ms-legend"><b>Stok</b> = barang yang ada di gudang outlet sekarang. <b>Jatah</b> = sisa kuota permintaan Anda bulan ini (dari budget). Keduanya berbeda.</p>
    </div>
    <div class="ms-basket ${n ? '' : 'empty'}" data-ms-t="basket"><span class="ms-basket-ic">🛒<b class="ms-badge">${cartCount(L)}</b></span><span class="ms-grow"><b>${n} barang dipilih</b><span class="tiny">${cartCount(L)} unit</span></span><button class="ms-btn" data-a="msgo" data-to="04" ${n ? '' : 'disabled'} data-ms-t="to-basket">Lanjut ke Permintaan →</button></div>
    ${L.sel ? sheet(ctx, rows.find((r) => r.it.id === L.sel)) : ''}`;
  }
  const stepper = (id, q, label) => `<span class="ms-step"><button class="ms-sb" data-a="msqty" data-it="${id}" data-d="-1" ${q ? '' : 'disabled'} aria-label="Kurangi ${esc(label)}">−</button><b aria-live="polite" data-ms-q="${id}">${q}</b><button class="ms-sb plus" data-a="msqty" data-it="${id}" data-d="1" data-ms-add="${id}" aria-label="Tambah ${esc(label)}">+</button></span>`;
  function itemRow(ctx, r) {
    const q = (st().cart || {})[r.it.id] || 0;
    return `<div class="ms-item ${q ? 'sel' : ''}" data-ms-item="${r.it.id}"><button class="ms-item-main" data-a="mssel" data-it="${r.it.id}" aria-label="Detail ${esc(r.it.name)}">${art(r.it)}<span class="ms-grow"><b>${esc(r.it.name)}</b><span class="tiny muted">${esc(r.it.unit)}${money(ctx) ? ' · ' + U.rp(r.it.price) : ''}</span><span class="ms-avail"><span class="ms-chip ${r.stock.k === 'ok' ? 'ok' : 'warn'}">${r.stock.t}</span>${r.allowance !== null ? `<span class="tiny">Jatah: <b>${r.allowance}</b> ${esc(r.it.unit)}</span>` : '<span class="tiny muted">Tanpa jatah — perlu persetujuan</span>'}</span></span></button>${stepper(r.it.id, q, r.it.name)}</div>`;
  }
  function sheet(ctx, r) {
    if (!r) return '';
    const q = (st().cart || {})[r.it.id] || 0;
    const fav = (st().fav || {})[r.it.id];
    return `<div class="ms-sheet-bg" data-a="msclose"></div><div class="ms-sheet" role="dialog" aria-label="Detail ${esc(r.it.name)}" data-ms-sheet="${r.it.id}"><span class="ms-grab"></span><button class="ms-ib ms-x" data-a="msclose" aria-label="Tutup">✕</button>
      <div class="ms-sheet-top">${art(r.it, 96)}<div><h2>${esc(r.it.name)}</h2><dl class="ms-kv"><dt>Kategori</dt><dd><span class="ms-chip gold">${esc((CATS.find((c) => c[0] === r.cat) || [0, r.it.cat])[1])}</span></dd><dt>Satuan</dt><dd>${esc(r.it.unit)}</dd><dt>Jatah pengajuan</dt><dd>${r.allowance !== null ? `${r.allowance} ${esc(r.it.unit)} / periode` : '—'}</dd><dt>Ketersediaan</dt><dd><span class="ms-chip ${r.stock.k === 'ok' ? 'ok' : 'warn'}">${r.stock.t}</span></dd></dl></div></div>
      <div class="ms-note">ℹ️ <span><b>Tentang barang</b><br>${esc(ABOUT[r.cat] || ABOUT.OTHER)}</span></div>
      <div class="ms-qrow"><b>Jumlah permintaan</b>${stepper(r.it.id, q, r.it.name)}</div>
      ${r.allowance !== null && q > r.allowance ? `<div class="ms-warn">Melebihi jatah ${r.allowance} — permintaan tetap bisa dikirim, tetapi perlu persetujuan tambahan.</div>` : ''}
      <div class="ms-row2"><button class="ms-btn lg" data-a="msadd" data-it="${r.it.id}" data-ms-t="sheet-add">🛒 ${q ? 'Simpan ke Permintaan' : 'Tambah ke Permintaan'}</button><button class="ms-ib ms-fav ${fav ? 'on' : ''}" data-a="msfav" data-it="${r.it.id}" aria-label="Favorit">${fav ? '♥' : '♡'}</button></div></div>`;
  }

  /* MS-04 My Request Basket */
  function basket(ctx) {
    const L = st();
    const { s } = ctx;
    const branch = homeBranch(ctx);
    const rows = catalog(ctx, branch);
    const lines = cartLines(L);
    const a = S.assignment(s, ctx.user) || {};
    return `<div class="ms-body">${progress(0)}
      <div class="ms-card"><div class="ms-sec" style="margin:0 0 6px"><h3>Daftar Barang (${lines.length})</h3>${lines.length ? '<button class="ms-link" data-a="msclear">Kosongkan</button>' : ''}</div>
        ${lines.map((l) => {
          const r = rows.find((x) => x.it.id === l.item) || { it: S.item(s, l.item), allowance: null };
          return `<div class="ms-item compact" data-ms-item="${l.item}">${art(r.it, 40)}<span class="ms-grow"><b>${esc(r.it.name)}</b><span class="tiny muted">${esc(r.it.unit)}${r.allowance !== null && l.qty > r.allowance ? ' · <span class="bad-t">melebihi jatah</span>' : ''}</span></span>${stepper(l.item, l.qty, r.it.name)}<button class="ms-ib sm" data-a="msrm" data-it="${l.item}" aria-label="Hapus ${esc(r.it.name)}">✕</button></div>`;
        }).join('') || `<div class="ms-empty">Keranjang masih kosong.<br><button class="ms-btn" data-a="msgo" data-to="02">Pilih barang</button></div>`}
        ${lines.length ? '<button class="ms-link" data-a="msgo" data-to="02">+ Tambah barang lain</button>' : ''}</div>
      <div class="ms-card"><h3>📋 Detail Permintaan</h3><dl class="ms-kv wide"><dt>🏠 Outlet</dt><dd>${esc(a.branchName || S.orgName(s, branch))}</dd><dt>🧩 Departemen</dt><dd>${esc(a.dept || '—')}</dd><dt>🗓 Kebutuhan</dt><dd><select class="ms-inp" data-ch="mstype" aria-label="Kebutuhan"><option value="ROUTINE" ${L.type !== 'NON_ROUTINE' ? 'selected' : ''}>Rutin operasional</option><option value="NON_ROUTINE" ${L.type === 'NON_ROUTINE' ? 'selected' : ''}>Tambahan / tidak rutin</option></select></dd></dl>
        <label class="ms-lab">Catatan (opsional)</label><textarea class="ms-inp" rows="2" maxlength="200" placeholder="Mis. untuk paket couple weekend" data-ch="msmemo" aria-label="Catatan">${esc(L.memo || '')}</textarea>
        <p class="tiny muted">Nama, outlet, departemen & divisi terisi otomatis dari akun Anda.</p></div>
    </div>
    <div class="ms-basket"><span class="ms-grow"><b>${lines.length} barang · ${U.sum(lines, (l) => l.qty)} unit</b><span class="tiny">Berikutnya: periksa & kirim</span></span><button class="ms-btn" data-a="msgo" data-to="05" ${lines.length ? '' : 'disabled'} data-ms-t="to-confirm">Lanjut →</button></div>`;
  }
  const progress = (i) => `<div class="ms-prog" aria-label="Langkah">${['Barang', 'Ringkasan', 'Konfirmasi'].map((l, k) => `<span class="${k < i ? 'done' : k === i ? 'cur' : ''}"><i>${k < i ? '✓' : k + 1}</i>${l}</span>`).join('<em></em>')}</div>`;

  /* MS-05 Submit & Success */
  function submitView(ctx) {
    const L = st();
    const { s } = ctx;
    const done = ctx.q.id && s.mrfs.find((m) => m.id === ctx.q.id);
    if (done) {
      const x = mrfState(s, done);
      const chain = done.chain || [];
      const who = chain.slice((done.approvals || []).length).map((r) => (r === 'SUPERVISOR' ? `${S.userName(s, (S.user(s, ctx.user.reportsTo) || {}).id) || 'Supervisor'} (Supervisor)` : HAWK.ROLE_LABEL[r] || r));
      return `<div class="ms-body">${progress(3)}<div class="ms-success" data-ms-t="success"><div class="ms-big">✅</div><h2>Permintaan terkirim</h2><p class="mono">${done.id}</p><p>${x.k === 'wait' ? `Menunggu persetujuan <b>${esc(who.join(' → ') || 'atasan')}</b>.` : esc(x.t)}</p>
        <div class="ms-note">ℹ️ <span>Terkirim <b>belum berarti disetujui</b> atau sudah dibelikan. Status akan berubah otomatis: persetujuan → disiapkan gudang / Purchasing → siap diterima.</span></div>
        <button class="ms-btn lg" data-a="msgo" data-to="07" data-q='${JSON.stringify({ id: done.id })}' data-ms-t="track">Lacak permintaan</button><button class="ms-btn ghost" data-a="msgo" data-to="01">Kembali ke beranda</button></div></div>`;
    }
    const lines = cartLines(L);
    const a = S.assignment(s, ctx.user) || {};
    const branch = homeBranch(ctx);
    const draft = { branch, type: L.type || 'ROUTINE', lines: lines.map((l) => ({ ...l, alloc: [] })), requester: ctx.user.id, status: 'DRAFT', date: s.meta.demoDate };
    let route = [];
    try {
      route = (S.mrfChain(s, draft) || {}).chain || [];
    } catch (e) {
      route = ['SUPERVISOR'];
    }
    const sup = S.user(s, ctx.user.reportsTo);
    return `<div class="ms-body">${progress(1)}
      <div class="ms-card ms-glass"><div class="ms-row"><span class="ms-art sm">✅</span><span class="ms-grow"><b>Periksa & Kirim</b><span class="tiny">Pastikan barang dan jumlah sudah sesuai.</span></span></div></div>
      <div class="ms-card"><div class="ms-sec" style="margin:0 0 6px"><h3>Ringkasan Permintaan</h3><span class="ms-link">${lines.length} Barang</span></div>
        ${lines.map((l) => `<div class="ms-item compact">${art(S.item(s, l.item), 40)}<span class="ms-grow"><b>${esc(S.itemName(s, l.item))}</b><span class="tiny muted">${esc(S.item(s, l.item).unit)}</span></span><b class="ms-qbox">${l.qty}</b></div>`).join('') || '<div class="ms-empty">Belum ada barang.</div>'}
        <dl class="ms-kv wide"><dt>🏠 Outlet</dt><dd>${esc(a.branchName || S.orgName(s, branch))}</dd><dt>🧩 Departemen</dt><dd>${esc(a.dept || '—')}</dd><dt>🗓 Kebutuhan</dt><dd>${L.type === 'NON_ROUTINE' ? 'Tambahan' : 'Rutin operasional'}</dd><dt>✍️ Disetujui oleh</dt><dd>${esc(route.map((r) => (r === 'SUPERVISOR' && sup ? sup.name + ' (Supervisor)' : HAWK.ROLE_LABEL[r] || r)).join(' → ') || 'Supervisor')}</dd></dl>
        ${L.memo ? `<p class="small">📝 ${esc(L.memo)}</p>` : ''}</div>
      <div id="ms-err" class="ms-warn" ${L.err ? '' : 'hidden'}>${esc(L.err || '')}</div>
    </div>
    <div class="ms-basket"><button class="ms-btn ghost" data-a="msgo" data-to="04">Ubah</button><button class="ms-btn lg ms-grow" data-a="mssubmit" ${lines.length ? '' : 'disabled'} data-ms-t="submit">✈ Kirim Permintaan</button></div>`;
  }

  /* MS-06 My Requests */
  function requests(ctx) {
    const L = st();
    const { s } = ctx;
    const mine = myMrfs(ctx);
    const proc = mine.filter((m) => !['done', 'stop'].includes(mrfState(s, m).k));
    const fin = mine.filter((m) => ['done', 'stop'].includes(mrfState(s, m).k));
    const tab = L.rtab || 'ALL';
    const list = tab === 'PROC' ? proc : tab === 'DONE' ? fin : mine;
    const appr = mine.filter((m) => m.requester === ctx.user.id && (m.approvals || []).length);
    const fast = appr.filter((m) => (new Date(m.approvals[0].ts) - new Date(m.date)) / 36e5 < 24).length;
    return `<div class="ms-body"><div class="ms-seg">${[['ALL', 'Semua', mine.length], ['PROC', 'Proses', proc.length], ['DONE', 'Selesai', fin.length]].map(([k, l, n]) => `<button class="${tab === k ? 'on' : ''}" data-a="msrtab" data-k="${k}">${l} (${n})</button>`).join('')}</div>
      ${list.map((m) => reqCard(ctx, m)).join('') || '<div class="ms-empty">Belum ada permintaan di sini.</div>'}
      ${appr.length ? `<div class="ms-card ms-ai"><div class="ms-row"><b>✨ Insight Saya</b><span class="ms-chip violet">AI SIMULASI</span></div><p class="small">${fast} dari ${appr.length} permintaan Anda disetujui dalam &lt; 24 jam. Isi catatan singkat bila butuh barang tambahan agar proses tetap cepat.</p><p class="tiny muted">Dihitung dari data demo (aturan sederhana), bukan model AI.</p></div>` : ''}</div>`;
  }

  /* MS-07 Order Journey */
  function journeyView(ctx) {
    const { s } = ctx;
    const m = s.mrfs.find((x) => x.id === ctx.q.id) || myMrfs(ctx)[0];
    if (!m) return `<div class="ms-body"><div class="ms-empty">Belum ada permintaan.</div></div>`;
    const j = journey(s, m);
    const paths = m.lines.map((l) => {
      const by = (p) => U.sum((l.alloc || []).filter((a) => a.path === p), (a) => a.qty);
      const parts = [[by('LOCAL'), 'dari stok outlet'], [by('TRANSFER'), 'dikirim dari gudang lain'], [by('PURCHASE'), 'dibelikan Purchasing']].filter(([q]) => q > 0).map(([q, t]) => `${q} ${t}`);
      return `<div class="ms-item compact">${art(S.item(s, l.item), 36)}<span class="ms-grow"><b>${esc(S.itemName(s, l.item))} × ${l.qty}</b><span class="tiny muted">${parts.join(' · ') || 'menunggu persetujuan'}</span></span></div>`;
    });
    const po = m.lines.flatMap((l) => (l.alloc || []).filter((a) => a.path === 'PURCHASE' && a.ref).map((a) => s.pos.find((p) => p.id === a.ref))).filter(Boolean)[0];
    const eta = j.state.k === 'ready' || j.state.k === 'done' ? 'Sudah tiba' : po ? `${U.date(po.eta || po.promised)} (janji supplier)` : j.state.k === 'prep' ? 'Hari ini' : j.state.k === 'wait' ? 'Setelah disetujui' : '—';
    const L = st();
    return `<div class="ms-body"><div class="ms-card"><div class="ms-row"><span class="ms-art sm">📦</span><span class="ms-grow"><b class="mono">${m.id}</b><span class="tiny muted">${itemsText(s, m)} · Diajukan ${U.datetime(m.date)}</span></span>${chip(j.state)}</div></div>
      <div class="ms-card"><h3>Status & Proses</h3><ol class="ms-tl">${j.steps.map((x) => `<li class="${x.done ? 'done' : x.cur ? 'cur' : ''}"><i>${x.done ? '✓' : x.cur ? '●' : ''}</i><span><b>${esc(x.t)}</b><span class="tiny">${x.d}</span></span></li>`).join('')}</ol></div>
      <div class="ms-card"><h3>Barang</h3>${paths.join('')}</div>
      <div class="ms-card ms-row"><span>📅</span><span class="ms-grow"><span class="tiny muted">Perkiraan diterima</span><b>${esc(eta)}</b></span></div>
      ${j.state.k === 'ready' ? `<button class="ms-btn lg" data-a="msgo" data-to="08" data-q='${JSON.stringify({ id: m.id })}' data-ms-t="to-receive">📦 Konfirmasi penerimaan</button>` : ''}
      <button class="ms-btn ghost" data-a="msnotif" data-ms-t="notif">🔔 ${(L.notif || {})[m.id] ? 'Notifikasi aktif ✓' : 'Aktifkan Notifikasi'}</button>
      ${['SUBMITTED', 'REVISION', 'DRAFT'].includes(m.status) && m.requester === ctx.user.id ? `<button class="ms-link bad-t" data-a="mscancel" data-id2="${m.id}">Batalkan permintaan</button>` : ''}
      <p class="tiny muted">Persetujuan, pemenuhan stok, dan pembelian ke supplier mengikuti alur HAWK (NV-28). ${ui.id ? ui.id(m.id) : ''}</p></div>`;
  }

  /* MS-08 Pickup & Receiving (internal handover — not a vendor GRN) */
  function receiving(ctx) {
    const { s } = ctx;
    const L = st();
    const pendingList = myMrfs(ctx).filter((m) => mrfState(s, m).k === 'ready');
    const m = (ctx.q.id && s.mrfs.find((x) => x.id === ctx.q.id)) || pendingList[0];
    const toIssue = (x) => U.sum(x.lines, (l) => U.sum(l.alloc || [], (a) => a.readyQty - a.issuedQty));
    if (!m) {
      const prep = myMrfs(ctx).filter((x) => x.status === 'IN_FULFILLMENT' && toIssue(x) > 0);
      return `<div class="ms-body"><div class="ms-empty">📦 Belum ada barang yang perlu dikonfirmasi.</div>${prep.length ? `<div class="ms-card"><h3>Sedang disiapkan</h3>${prep.map((x) => reqCard(ctx, x)).join('')}</div>` : ''}</div>`;
    }
    const pend = S.handoverPending(s, m);
    const ready = pend.filter((x) => x.qty > 0);
    const issuer = ((m.history || []).filter((h) => h.action === 'ISSUE').slice(-1)[0] || {}).by;
    const canIssue = toIssue(m) > 0 && ctx.can('mrf.issue') && (ctx.role === 'WAREHOUSE' || ctx.user.scope.includes(m.branch));
    L.ho = L.ho && L.ho.id === m.id ? L.ho : { id: m.id, q: Object.fromEntries(ready.map((x) => [x.item, x.qty])), cond: 'OK', note: '', photos: [] };
    const H = L.ho;
    const last = (m.handovers || []).slice(-1)[0];
    return `<div class="ms-body">
      ${ready.length ? `<div class="ms-card ms-glass"><div class="ms-row"><span class="ms-art sm">📦</span><span class="ms-grow"><b>Barang Sudah Tiba</b><span class="tiny">Periksa barang dan konfirmasi penerimaan. ${issuer ? 'Diserahkan oleh ' + esc(S.userName(s, issuer)) : ''}</span></span></div></div>` : ''}
      ${canIssue ? `<div class="ms-card"><b>🤝 ${toIssue(m)} unit siap diserahkan</b><p class="small">Serahkan barang ke ${esc(S.userName(s, m.requester))}, lalu ia mengonfirmasi penerimaannya.</p><button class="ms-btn" data-a="msissue" data-id2="${m.id}" data-ms-issue="${m.id}">Serahkan barang sekarang</button></div>` : ''}
      ${ready.length ? `<div class="ms-card"><div class="ms-sec" style="margin:0 0 6px"><h3>Daftar Barang Diterima</h3><span class="ms-link">${ready.length} Barang</span></div>
        ${ready.map((x) => `<div class="ms-item compact">${art(S.item(s, x.item), 40)}<span class="ms-grow"><b>${esc(S.itemName(s, x.item))}</b><span class="tiny muted">Diserahkan ${x.qty} ${esc(S.item(s, x.item).unit)}</span></span><span class="ms-step"><button class="ms-sb" data-a="mshq" data-it="${x.item}" data-d="-1" ${H.q[x.item] > 0 ? '' : 'disabled'} aria-label="Kurangi">−</button><b class="${H.q[x.item] === x.qty ? 'ok-t' : 'bad-t'}" data-ms-hq="${x.item}">${H.q[x.item]} / ${x.qty}</b><button class="ms-sb plus" data-a="mshq" data-it="${x.item}" data-d="1" ${H.q[x.item] < x.qty ? '' : 'disabled'} aria-label="Tambah">+</button></span></div>`).join('')}</div>
      <div class="ms-card"><h3>Kondisi Barang</h3><div class="ms-choice">${[['OK', '✅', 'Sesuai & Baik'], ['ISSUE', '⚠️', 'Ada Catatan (Kerusakan/Kurang)']].map(([k, i, l]) => `<button class="${H.cond === k ? 'on' : ''} ${k === 'OK' ? 'ok' : 'warn'}" data-a="mshcond" data-k="${k}" data-ms-t="cond-${k}"><span>${i}</span>${l}</button>`).join('')}</div>
        ${H.cond === 'ISSUE' || ready.some((x) => H.q[x.item] < x.qty) ? `<label class="ms-lab">Catatan (wajib)</label><textarea class="ms-inp" rows="2" data-ch="mshnote" data-in="mshnote" placeholder="Mis. 1 botol bocor, handuk kurang 1">${esc(H.note)}</textarea>` : ''}
        <h3 style="margin-top:12px">Foto Penerimaan <span class="tiny muted">(opsional)</span></h3>${photoPicker('ho', H.photos)}</div>
      <div id="ms-err" class="ms-warn" ${L.err ? '' : 'hidden'}>${esc(L.err || '')}</div>
      <p class="tiny muted">Ini serah terima <b>internal</b> dari gudang / PIC ke Anda — bukan penerimaan barang dari supplier (GRN). Tidak mengubah stok atau jurnal.</p>` : last ? `<div class="ms-success"><div class="ms-big">✅</div><h2>Penerimaan dikonfirmasi</h2><p class="small">${esc(last.by.name)} · ${U.datetime(last.at)} · ${last.condition === 'OK' ? 'Sesuai & baik' : 'Dengan catatan: ' + esc(last.note)}</p><button class="ms-btn" data-a="msgo" data-to="06">Permintaan saya</button></div>` : `<div class="ms-empty">Barang sedang disiapkan. Anda akan mendapat notifikasi saat siap diambil.</div>`}
    </div>
    ${ready.length ? `<div class="ms-basket"><button class="ms-btn lg ms-grow" data-a="mshsubmit" data-ms-t="confirm-receive">✓ Konfirmasi Penerimaan</button></div>` : ''}`;
  }

  /* photo picker shared by MS-08 / MS-11 (images are DEMO evidence kept in the browser sandbox) */
  const SAMPLE_PHOTO = {
    ho: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#d8c3a0"/><rect x="25" y="25" width="70" height="50" fill="#b78d55"/><path d="M25 40h70" stroke="#8b6914" stroke-width="3"/><text x="60" y="86" font-size="8" text-anchor="middle" fill="#5a4630">FOTO CONTOH (DEMO)</text></svg>'),
    fr: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#cfd6dc"/><rect x="20" y="55" width="80" height="20" rx="4" fill="#ffffff"/><path d="M60 20v18h14" stroke="#7d8790" stroke-width="6" fill="none"/><circle cx="74" cy="46" r="3" fill="#4da3ff"/><circle cx="74" cy="54" r="2.5" fill="#4da3ff"/><text x="60" y="86" font-size="8" text-anchor="middle" fill="#3b4650">FOTO CONTOH (DEMO)</text></svg>'),
  };
  const photoPicker = (key, photos) => `<div class="ms-photos">${photos.map((p, i) => `<span class="ms-ph"><img src="${p}" alt="Foto ${i + 1}"><button class="ms-ib sm" data-a="msphdel" data-k="${key}" data-i="${i}" aria-label="Hapus foto">✕</button></span>`).join('')}${photos.length < 3 ? `<label class="ms-ph add"><input type="file" accept="image/*" capture="environment" data-ch="msphoto" data-k="${key}" hidden>📷<span class="tiny">Tambah Foto</span></label><button class="ms-ph add" data-a="msphsample" data-k="${key}" data-ms-t="photo-sample-${key}">🖼<span class="tiny">Pakai foto contoh</span></button>` : ''}</div>`;
  function readPhoto(file, cb) {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 640 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => cb(null);
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  /* MS-09 Smart Receipt Camera */
  function camera(ctx) {
    const L = st();
    const sc = ((HAWK.SPEND && HAWK.SPEND.SCENARIOS) || []).filter((x) => ['PRINTED', 'HANDWRITTEN', 'BLURRY'].includes(x.key));
    const list = sc.length ? sc : [{ key: 'PRINTED', title: 'Struk tercetak', img: 'assets/img/receipts/printed.svg' }, { key: 'HANDWRITTEN', title: 'Nota tulisan tangan', img: 'assets/img/receipts/handwritten.svg' }];
    const cur = L.rsc || 'PRINTED';
    const sel = list.find((x) => x.key === cur) || list[0];
    return `<div class="ms-cam"><div class="ms-cam-view"><span class="ms-cam-c tl"></span><span class="ms-cam-c tr"></span><span class="ms-cam-c bl"></span><span class="ms-cam-c br"></span><img src="${sel.img}" alt="Pratinjau nota: ${esc(sel.title)}"><span class="ms-cam-tag">AI SIMULASI — OCR belum terhubung</span></div>
      <div class="ms-cam-src">${list.map((x) => `<button class="${x.key === cur ? 'on' : ''}" data-a="msrsc" data-k="${x.key}" data-ms-t="rsc-${x.key}">${esc(x.title)}</button>`).join('')}</div>
      <div class="ms-cam-bar"><label class="ms-cam-g" aria-label="Pilih dari galeri"><input type="file" accept="image/*" data-ch="msupload" hidden>🖼<span class="tiny">Galeri</span></label><button class="ms-shutter" data-a="mscapture" data-k="${cur}" aria-label="Ambil foto nota" data-ms-t="shutter"></button><button class="ms-cam-g" data-a="msgo" data-to="06" aria-label="Riwayat">🧾<span class="tiny">Riwayat</span></button></div>
      <p class="tiny" style="color:#cfc6b0;text-align:center;padding:0 16px">Pilih contoh nota lalu tekan tombol bulat. Foto asli disimpan tanpa diubah sebagai bukti DEMO; koreksi disimpan terpisah.</p></div>`;
  }

  /* MS-10 AI Receipt Review */
  function review(ctx) {
    const { s } = ctx;
    const L = st();
    const sp = S.spend(s, ctx.q.id) || (s.spends || []).find((x) => x.createdBy === ctx.user.id && x.status === 'DRAFT');
    if (!sp) return `<div class="ms-body"><div class="ms-empty">Belum ada nota. <button class="ms-btn" data-a="msgo" data-to="09">Scan nota</button></div></div>`;
    const SP = HAWK.SPEND;
    const f = sp.fields;
    const fs = (k) => S.spendFieldState(sp, k);
    const mth = S.spendMath(sp);
    const editable = ['DRAFT', 'RETURNED'].includes(sp.status);
    const ev = S.evidence(s, sp.evidence);
    const flag = (k) => (fs(k) === 'CONFIRM' ? `<span class="ms-chip warn" title="AI kurang yakin">⚠ periksa</span>` : fs(k) === 'BAD' ? `<span class="ms-chip bad">✗ belum benar</span>` : '');
    const a = S.assignment(s, ctx.user) || {};
    if (!editable)
      return `<div class="ms-body"><div class="ms-success" data-ms-t="sp-done"><div class="ms-big">📨</div><h2>Nota diajukan</h2><p class="mono">${sp.id}</p><p class="small">Status: <b>${esc(sp.status)}</b>. Berikutnya: persetujuan atasan, lalu verifikasi Finance. <b>Belum dibayar dan belum diposting</b> — AI tidak menyetujui atau memposting apa pun.</p><button class="ms-btn" data-nav="48" data-q='${JSON.stringify({ tab: 'history', sel: sp.id })}'>Lihat detail & bukti (NV-48)</button></div></div>`;
    return `<div class="ms-body">
      <div class="ms-card ms-glass"><div class="ms-row"><span>✨</span><span class="ms-grow"><b>${sp.source === 'SIMULATED_AI_EXTRACTION' ? 'Nota Berhasil Dianalisis' : 'Isi data nota'}</b><span class="tiny">${sp.source === 'SIMULATED_AI_EXTRACTION' ? 'AI SIMULASI — periksa dan pastikan data sudah benar.' : 'Foto tersimpan; OCR belum terhubung, isi data dari nota.'}</span></span>${ev && ev.image ? `<button class="ms-link" data-a="msev">${L.ev ? 'Tutup foto' : 'Foto asli'}</button>` : ''}</div>${L.ev && ev && ev.image ? `<img class="ms-ev" src="${ev.image}" alt="Foto nota asli">` : ''}</div>
      <div class="ms-card"><div class="ms-row"><span class="ms-art sm">🏬</span><span class="ms-grow"><input class="ms-inp b" value="${esc(f.supplier || '')}" placeholder="Nama toko" data-ch="msf" data-k="supplier" aria-label="Toko">${flag('supplier')}<span class="tiny muted">No. <input class="ms-inp in" value="${esc(f.receiptNo || '')}" data-ch="msf" data-k="receiptNo" aria-label="No struk"> ${flag('receiptNo')} · <input class="ms-inp in" type="date" value="${esc(f.date || '')}" data-ch="msf" data-k="date" aria-label="Tanggal"></span></span>
        <span class="ms-total ${fs('total') !== 'OK' ? 'warn' : ''}"><span class="tiny">Total</span><input class="ms-inp b r" inputmode="numeric" value="${f.total === null || f.total === undefined ? '' : f.total}" data-ch="msf" data-k="total" aria-label="Total" data-ms-t="sp-total">${flag('total')}</span></div>
        ${fs('total') === 'CONFIRM' && mth.ok ? `<button class="ms-btn sm ghost" data-a="msconfirm" data-k="total" data-ms-t="sp-confirm-total">✓ Total sudah sesuai nota</button>` : ''}</div>
      <div class="ms-card"><div class="ms-sec" style="margin:0 0 6px"><h3>Rincian Barang (${sp.lines.length})</h3><button class="ms-link" data-a="msedit">✏️ ${L.edit ? 'Selesai' : 'Ubah'}</button></div>
        ${sp.lines.map((l, i) => {
          const ls = S.spendLineState(sp, i);
          return `<div class="ms-item compact ${ls !== 'OK' ? 'warnrow' : ''}" data-ms-line="${i}"><span class="ms-art sm">🧾</span><span class="ms-grow">${L.edit || ls !== 'OK' ? `<input class="ms-inp" value="${esc(l.desc)}" data-ch="msl" data-i="${i}" data-k="desc" aria-label="Nama barang"><span class="tiny">Qty <input class="ms-inp in" inputmode="numeric" value="${l.qty}" data-ch="msl" data-i="${i}" data-k="qty" aria-label="Qty"> × Rp <input class="ms-inp in w" inputmode="numeric" value="${l.price}" data-ch="msl" data-i="${i}" data-k="price" aria-label="Harga" data-ms-price="${i}"></span>${l.hint && ls !== 'OK' ? `<span class="tiny bad-t">⚠ ${esc(l.hint)}</span>` : ''}` : `<b>${esc(l.desc)}</b><span class="tiny muted">Qty: ${l.qty} ${esc(l.uom || '')}</span>`}</span><b class="r">${U.rp(l.qty * l.price - (l.disc || 0))}</b>${ls === 'CONFIRM' ? `<button class="ms-ib sm" data-a="msconfirm" data-k="line:${i}" aria-label="Sudah sesuai">✓</button>` : ''}</div>`;
        }).join('') || '<div class="ms-empty">Tidak ada baris terbaca — tambah manual.</div>'}
        <button class="ms-link" data-a="msaddline">+ Tambah baris</button>
        <div class="ms-math ${mth.ok ? 'ok' : 'bad'}">${mth.ok ? '✓ Total cocok dengan rincian' : `✗ Total ${U.rp(mth.total || 0)} ≠ rincian ${U.rp(mth.expected || 0)} — periksa angka`}</div></div>
      <div class="ms-card"><dl class="ms-kv wide form">
        <dt>🏷 Kategori</dt><dd><select class="ms-inp" data-ch="mscls" data-k="type" aria-label="Kategori">${Object.entries(SP.CLS).map(([k, l]) => `<option value="${k}" ${sp.cls.type === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></dd>
        <dt>◈ 7P</dt><dd><select class="ms-inp" data-ch="mscls" data-k="p" aria-label="7P"><option value="">Pilih…</option>${SP.SPEND_P.map((p) => `<option value="${p}" ${sp.cls.p === p ? 'selected' : ''}>${esc((HAWK.SEVEN_P.find((x) => x.key === p) || {}).name || p)}</option>`).join('')}</select></dd>
        <dt>🧩 Departemen</dt><dd>${esc(a.dept || '—')} <span class="tiny muted">(dari akun)</span></dd>
        <dt>💳 Pembayaran</dt><dd><select class="ms-inp" data-ch="msf" data-k="pay" aria-label="Pembayaran" data-ms-t="sp-pay"><option value="">Pilih…</option>${['CASH', 'TRANSFER', 'QRIS', 'EMPLOYEE', 'UNPAID'].map((k) => `<option value="${k}" ${f.pay === k ? 'selected' : ''}>${esc(SP.PAY[k].label)}</option>`).join('')}</select></dd>
        ${SP.PAY[f.pay] && SP.PAY[f.pay].flow === 'PAID' ? `<dt>📅 Tanggal bayar</dt><dd><input class="ms-inp" type="date" value="${esc(f.payDate || f.date || '')}" data-ch="msf" data-k="payDate" aria-label="Tanggal bayar"></dd>` : ''}
        ${f.pay === 'UNPAID' ? `<dt>📅 Jatuh tempo</dt><dd><input class="ms-inp" type="date" value="${esc(f.due || '')}" data-ch="msf" data-k="due" aria-label="Jatuh tempo"></dd>` : ''}
      </dl>${sp.ai && sp.suggest ? '' : ''}<label class="ms-lab">Catatan (opsional)</label><textarea class="ms-inp" rows="2" data-ch="msnote" placeholder="Mis. pembelian tambahan untuk operasional…">${esc(sp.note || '')}</textarea></div>
      <div id="ms-err" class="ms-warn" ${L.err ? '' : 'hidden'}>${esc(L.err || '')}</div>
      <p class="tiny muted">Mengajukan = Anda mengonfirmasi data nota. Ini <b>bukan</b> persetujuan, <b>bukan</b> pembayaran, dan <b>tidak</b> memposting jurnal.</p></div>
    <div class="ms-basket"><button class="ms-btn lg ms-grow" data-a="msspsubmit" data-id2="${sp.id}" data-ms-t="sp-submit">✓ Simpan & Ajukan</button></div>`;
  }

  /* MS-11 Facility & Incident Report */
  const AREAS = ['Ruang Treatment 1', 'Ruang Treatment 2', 'Ruang Treatment 3', 'Lobby & Resepsionis', 'Toilet & Shower', 'Pantry', 'Laundry', 'Parkir & Halaman'];
  function facility(ctx) {
    const { s } = ctx;
    const L = st();
    const branch = homeBranch(ctx);
    L.fr = L.fr || { kind: '', photos: [], area: '', issue: '', priority: '' };
    const F = L.fr;
    const done = ctx.q.id && s.maintenance.find((m) => m.id === ctx.q.id);
    const mine = s.maintenance.filter((m) => m.reporter === ctx.user.id).slice(0, 5);
    const assets = s.assets.filter((a) => a.org === branch && a.status === 'ACTIVE');
    const ST = { SUBMITTED: 'Menunggu Supervisor', APPROVED: 'Disetujui — menunggu teknisi', IN_PROGRESS: 'Sedang ditangani', REJECTED: 'Ditolak', DONE: 'Selesai', COMPLETED: 'Selesai' };
    if (done)
      return `<div class="ms-body"><div class="ms-success" data-ms-t="fr-done"><div class="ms-big">📨</div><h2>Laporan terkirim</h2><p class="mono">${done.id}</p><p class="small">${esc(done.area)} · ${{ LOW: 'Rutin', MEDIUM: 'Segera', HIGH: 'Mendesak' }[done.priority]}<br>Status: <b>${ST[done.status] || done.status}</b>. Supervisor menerima notifikasi untuk meninjau.</p><button class="ms-btn" data-a="msfrnew">Buat laporan lain</button><button class="ms-btn ghost" data-a="msgo" data-to="12">Lihat tugas & notifikasi</button></div></div>`;
    return `<div class="ms-body">
      <div class="ms-kinds">${[['DAMAGE', '🔧', 'Kerusakan / Gangguan'], ['ROUTINE', '🗓', 'Perawatan Rutin'], ['FACILITY', '➕', 'Permintaan Fasilitas']].map(([k, i, l]) => `<button class="${F.kind === k ? 'on' : ''}" data-a="msfr" data-k="kind" data-v="${k}" data-ms-t="fr-kind-${k}"><span>${i}</span>${l}</button>`).join('')}</div>
      <div class="ms-card"><h3>Foto & Bukti <span class="tiny muted">(opsional)</span></h3>${photoPicker('fr', F.photos)}</div>
      <div class="ms-card"><dl class="ms-kv wide form"><dt>📍 Lokasi</dt><dd>${esc(S.orgName(s, branch))}</dd>
        <dt>🏷 Area / Fasilitas</dt><dd><select class="ms-inp" data-ch="msfrsel" data-k="area" aria-label="Area" data-ms-t="fr-area"><option value="">Pilih area…</option>${assets.map((a) => `<option value="A:${a.id}" ${F.area === 'A:' + a.id ? 'selected' : ''}>${esc(a.name)} (aset)</option>`).join('')}${AREAS.map((x) => `<option value="${esc(x)}" ${F.area === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></dd></dl>
        <label class="ms-lab">✏️ Uraian Masalah</label><textarea class="ms-inp" rows="3" maxlength="250" placeholder="Mis. kran wastafel bocor, air terus menetes." data-ch="msfrsel" data-in="msfrcount" data-k="issue" aria-label="Uraian masalah" data-ms-t="fr-issue">${esc(F.issue)}</textarea><div class="tiny muted r" id="ms-fr-count">${(F.issue || '').length} / 250</div>
        <label class="ms-lab">📶 Tingkat Prioritas</label><div class="ms-prio">${[['LOW', 'Rutin', 'ok'], ['MEDIUM', 'Segera', 'gold'], ['HIGH', 'Mendesak', 'bad']].map(([k, l, t]) => `<button class="${t} ${F.priority === k ? 'on' : ''}" data-a="msfr" data-k="priority" data-v="${k}" data-ms-t="fr-prio-${k}">${l}</button>`).join('')}</div></div>
      <div id="ms-err" class="ms-warn" ${L.err ? '' : 'hidden'}>${esc(L.err || '')}</div>
      ${mine.length ? `<div class="ms-card"><h3>Laporan saya</h3>${mine.map((m) => `<div class="ms-row small"><span class="mono">${m.id}</span><span class="ms-grow">${esc(m.area || (S.asset(s, m.asset) || {}).name || '')}</span><span class="ms-chip">${ST[m.status] || m.status}</span></div>`).join('')}</div>` : ''}
    </div>
    <div class="ms-basket"><button class="ms-btn lg ms-grow" data-a="msfrsend" data-ms-t="fr-send">✈ Kirim Laporan</button></div>`;
  }

  /* MS-12 My Tasks & Notifications */
  function tasks(ctx) {
    const L = st();
    const all = feed(ctx);
    const tsk = all.filter((x) => x.kind === 'task');
    const nt = all.filter((x) => x.kind !== 'task');
    const tab = L.ttab || 'ALL';
    const list = tab === 'TASK' ? tsk : tab === 'NOTE' ? nt : all;
    const pending = tsk.length;
    return `<div class="ms-body"><div class="ms-seg">${[['ALL', 'Semua', all.length], ['TASK', 'Tugas Saya', tsk.length], ['NOTE', 'Notifikasi', nt.length]].map(([k, l, n]) => `<button class="${tab === k ? 'on' : ''}" data-a="msttab" data-k="${k}">${l} (${n})</button>`).join('')}</div>
      ${list.map((x) => feedRow(ctx, x)).join('') || '<div class="ms-empty">Tidak ada tugas atau notifikasi.</div>'}
      <div class="ms-card ms-ai"><div class="ms-row"><b>✨ Insight Hari Ini</b><span class="ms-chip violet">AI SIMULASI</span></div><p class="small">${pending ? `Ada <b>${pending}</b> hal yang menunggu Anda. Mulai dari yang bertanda merah.` : 'Tidak ada permintaan yang tertunda. Operasional berjalan lancar 👍'}</p><p class="tiny muted">Ringkasan berbasis aturan dari data demo — AI tidak menyetujui atau mengubah data.</p></div></div>`;
  }
  function feedRow(ctx, x) {
    const act = x.approve ? `<span class="ms-acts"><button class="ms-btn sm ghost" data-a="msdecide" data-id2="${x.approve}" data-d="REJECT">Tolak</button><button class="ms-btn sm" data-a="msdecide" data-id2="${x.approve}" data-d="APPROVE" data-ms-approve="${x.approve}">Setujui</button></span>`
      : x.mt ? `<span class="ms-acts"><button class="ms-btn sm ghost" data-a="msmt" data-id2="${x.mt}" data-d="REJECT">Tolak</button><button class="ms-btn sm" data-a="msmt" data-id2="${x.mt}" data-d="APPROVE" data-ms-mt="${x.mt}">Setujui</button></span>`
      : x.issue ? `<span class="ms-acts"><button class="ms-btn sm" data-a="msissue" data-id2="${x.issue}" data-ms-issue="${x.issue}">Serahkan</button></span>` : '';
    const target = x.go ? `data-a="msgo" data-to="${x.go[0]}" data-q='${JSON.stringify(x.go[1] || {})}'` : x.nv ? `data-nav="${x.nv[0]}" data-q='${JSON.stringify(x.nv[1] || {})}'` : '';
    let extra = '';
    if (x.approve) {
      const m = ctx.s.mrfs.find((y) => y.id === x.approve);
      extra = `<span class="tiny ms-lines">${m.lines.map((l) => `${esc(S.itemName(ctx.s, l.item))} × ${l.qty}`).join(' · ')}${money(ctx) ? ' · ' + U.rp(S.mrfValue(ctx.s, m)) : ''} · budget: ${(() => { const b = m.budgetSnapshot || S.mrfBudgetCheck(ctx.s, m).status; return esc({ OK: 'aman', WARN: 'mendekati batas', OVER: 'melebihi', NONE: 'tanpa budget' }[b] || b); })()}</span>`;
    }
    return `<div class="ms-feed ${x.dot ? 'new' : ''}" data-ms-feed="${esc(x.t || '')}"><button class="ms-feed-main" ${target || 'disabled'}><span class="ms-art sm">${x.icon}</span><span class="ms-grow"><b>${esc(x.title)}</b><span class="tiny muted">${esc(x.sub)}</span>${extra}<span class="tiny muted">${rel(x.ts, ctx.s)}</span></span>${x.dot ? '<i class="ms-dot"></i>' : ''}${target ? '<span class="ms-chev">›</span>' : ''}</button>${act}</div>`;
  }

  /* =====================================================================================
     Guided demo — "Pandu Saya → Tunjukkan → Coba → Lanjut"
     ===================================================================================== */
  const T = () => (ui.local._msTutor = ui.local._msTutor || { sc: null, i: 0, v: {}, open: false, min: false });
  const newestMrf = (s, by, since) => s.mrfs.find((m) => m.requester === by && !since.includes(m.id));
  const asApi = (id, op, p) => HAWK.api.call(op, p, HAWK.store.state.users.find((u) => u.id === id));
  const SCEN = [
    { id: 'R1', icon: '🛒', title: 'Minta minyak pijat & handuk', who: 'Indah', goal: 'Mengajukan permintaan rutin dari HP.',
      setup: (s, v) => { v.since = s.mrfs.map((m) => m.id); st().cart = {}; },
      steps: [
        { as: 'U-STF', ms: '01', t: '[data-ms-t="hero-request"]', do: 'Tekan kartu “Minta Barang”.', expect: 'Katalog barang terbuka.', check: (c) => c.ms === '02' },
        { as: 'U-STF', ms: '02', t: '[data-ms-add="BHP-001"]', do: 'Tekan + pada Minyak Pijat Lavender sampai 2.', expect: 'Jumlah 2 dan keranjang menunjukkan 1 barang.', check: () => ((st().cart || {})['BHP-001'] || 0) >= 2 },
        { as: 'U-STF', ms: '02', t: '[data-ms-add="BHP-003"]', do: 'Tambah 4 Handuk Kecil Putih.', expect: 'Keranjang berisi 2 barang.', check: () => ((st().cart || {})['BHP-003'] || 0) >= 4 },
        { as: 'U-STF', ms: '02', t: '[data-ms-t="to-basket"]', do: 'Tekan “Lanjut ke Permintaan”.', expect: 'Keranjang terbuka — bisa ubah jumlah atau hapus.', check: (c) => c.ms === '04' },
        { as: 'U-STF', ms: '04', t: '[data-ms-t="to-confirm"]', do: 'Periksa keranjang, lalu tekan “Lanjut”.', expect: 'Ringkasan: outlet, departemen & penyetuju terisi otomatis.', check: (c) => c.ms === '05' },
        { as: 'U-STF', ms: '05', t: '[data-ms-t="submit"]', do: 'Tekan “Kirim Permintaan”.', expect: 'Permintaan terkirim ke Mila (Supervisor) — belum berarti disetujui.', check: (c, s, v) => { const m = newestMrf(s, 'U-STF', v.since); if (m) v.mrf = m.id; return !!m; } },
        { as: 'U-STF', ms: '06', t: (v) => `[data-ms-req="${v.mrf}"]`, do: 'Buka “Permintaan Saya” dan lihat statusnya.', expect: 'Status “Menunggu persetujuan”. Lanjutkan ke skenario 2 untuk melacaknya.', check: (c) => c.ms === '06' || c.ms === '07' },
      ] },
    { id: 'R2', icon: '🧭', title: 'Lacak MRF: Supervisor → Purchasing', who: 'Indah · Mila · Etya', goal: 'Melihat permintaan bergerak lewat persetujuan & pengadaan.',
      setup: (s, v) => { const r = asApi('U-STF', 'mrf.create', { lines: [{ item: 'BHP-001', qty: 10, reason: 'Pemakaian rutin minggu ini' }], memo: 'Persiapan akhir pekan' }); v.mrf = r.ok ? r.data.id : null; },
      steps: [
        { as: 'U-STF', ms: '06', t: (v) => `[data-ms-req="${v.mrf}"]`, do: 'Indah membuka permintaan 10 Minyak Pijat yang baru diajukan.', expect: 'Perjalanan: “Menunggu persetujuan Supervisor”.', check: (c, s, v) => c.ms === '07' && c.q.id === v.mrf },
        { as: 'U-SPV', ms: '12', t: (v) => `[data-ms-approve="${v.mrf}"]`, do: 'Masuk sebagai Mila. Di “Tugas”, tekan “Setujui”.', expect: 'Disetujui. Stok outlet hanya 4 → sisanya otomatis ke Purchasing.', check: (c, s, v) => ['IN_FULFILLMENT', 'APPROVED'].includes((s.mrfs.find((m) => m.id === v.mrf) || {}).status) },
        { as: 'U-PUR', ms: '12', t: '[data-ms-feed="pur"]', do: 'Etya (Purchasing) membuat & mengirim PO di layar desktop NV-32. Untuk demo, tekan “Lakukan untuk saya”.', expect: 'PO terkirim ke supplier — tetap lewat alur PO HAWK.', auto: (v) => { const s = HAWK.store.state; const pk = S.pendingPurchase(s).filter((x) => x.mrf === v.mrf); if (!pk.length) return; const sup = pk[0].supplier; const po = asApi('U-PUR', 'po.createFromMrf', { picks: pk.map((x) => ({ mrf: x.mrf, li: x.li, ai: x.ai })), supplier: sup }); if (!po.ok) return; asApi('U-PUR', 'po.submit', { id: po.data.id }); if (HAWK.store.state.pos.find((p) => p.id === po.data.id).status === 'PENDING_APPROVAL') asApi('U-PUR', 'po.decide', { id: po.data.id, decision: 'APPROVE' }); asApi('U-PUR', 'po.send', { id: po.data.id }); },
          check: (c, s, v) => { const m = s.mrfs.find((x) => x.id === v.mrf); return !!m && m.lines.some((l) => (l.alloc || []).some((a) => a.path === 'PURCHASE' && a.ref && ['SENT', 'PARTIAL', 'RECEIVED', 'CLOSED'].includes((s.pos.find((p) => p.id === a.ref) || {}).status))); } },
        { as: 'U-STF', ms: '07', t: '.ms-tl', do: 'Kembali sebagai Indah dan buka perjalanan permintaan.', expect: '“Dalam pengiriman” + perkiraan tiba dari janji supplier. 4 botol dari stok outlet siap diserahkan.', check: (c, s, v) => c.ms === '07' && c.q.id === v.mrf && c.role === 'STAFF' },
      ] },
    { id: 'R3', icon: '📦', title: 'Terima barang dari gudang', who: 'Supri · Indah', goal: 'Serah terima barang internal (bukan GRN supplier).',
      setup: (s, v) => { const r = asApi('U-STF', 'mrf.create', { lines: [{ item: 'BHP-001', qty: 2 }, { item: 'BHP-003', qty: 4 }], memo: 'Shift pagi' }); if (r.ok) { v.mrf = r.data.id; asApi('U-SPV', 'mrf.decide', { id: r.data.id, decision: 'APPROVE', note: 'OK' }); } },
      steps: [
        { as: 'U-WHS', ms: '12', t: (v) => `[data-ms-issue="${v.mrf}"]`, do: 'Masuk sebagai Supri (Gudang). Tekan “Serahkan” pada permintaan Indah.', expect: 'Barang keluar dari stok outlet & menunggu konfirmasi Indah.', check: (c, s, v) => S.handoverPending(s, s.mrfs.find((m) => m.id === v.mrf)).some((x) => x.qty > 0) },
        { as: 'U-STF', ms: '08', t: '[data-ms-t="cond-OK"]', do: 'Indah: cek jumlah (2/2, 4/4) dan pilih kondisi “Sesuai & Baik”.', expect: 'Jumlah hijau. Bila kurang, wajib isi catatan.', check: (c) => c.ms === '08' },
        { as: 'U-STF', ms: '08', t: '[data-ms-t="confirm-receive"]', do: 'Tekan “Konfirmasi Penerimaan”.', expect: 'Penerimaan tercatat atas nama Indah — stok & jurnal tidak berubah lagi.', check: (c, s, v) => ((s.mrfs.find((m) => m.id === v.mrf) || {}).handovers || []).length > 0 },
      ] },
    { id: 'R4', icon: '🧾', title: 'Scan nota tulisan tangan', who: 'Indah', goal: 'Foto nota, koreksi hasil AI SIMULASI, lalu ajukan.',
      setup: (s, v) => { v.since = (s.spends || []).map((x) => x.id); st().rsc = 'HANDWRITTEN'; },
      steps: [
        { as: 'U-STF', ms: '09', t: '[data-ms-t="shutter"]', do: 'Contoh “Nota tulisan tangan” sudah dipilih. Tekan tombol bulat.', expect: 'AI SIMULASI membaca nota; foto asli disimpan.', check: (c, s, v) => { const sp = (s.spends || []).find((x) => x.createdBy === 'U-STF' && !v.since.includes(x.id)); if (sp) v.sp = sp.id; return !!sp; } },
        { as: 'U-STF', ms: '10', t: '[data-ms-price="1"]', do: 'Harga “Pasir” kurang jelas. Ubah menjadi 350000.', expect: 'Total cocok dengan rincian (✓ hijau).', check: (c, s, v) => ((S.spend(s, v.sp) || { lines: [] }).lines[1] || {}).price === 350000 },
        { as: 'U-STF', ms: '10', t: '[data-ms-t="sp-pay"]', do: 'Tekan “Total sudah sesuai nota”, lalu pilih cara bayar (mis. Tunai).', expect: 'Tidak ada lagi tanda ⚠ periksa.', check: (c, s, v) => { const sp = S.spend(s, v.sp); return !!sp && !!sp.fields.pay && S.spendFieldState(sp, 'total') === 'OK'; } },
        { as: 'U-STF', ms: '10', t: '[data-ms-t="sp-submit"]', do: 'Tekan “Simpan & Ajukan”.', expect: 'Diajukan ke Supervisor lalu Finance (Asri). Belum dibayar & belum diposting.', check: (c, s, v) => !['DRAFT', 'RETURNED'].includes((S.spend(s, v.sp) || {}).status) },
      ] },
    { id: 'R5', icon: '🔧', title: 'Lapor fasilitas rusak', who: 'Dewa · Mila', goal: 'Lapor kerusakan dengan foto & prioritas.',
      setup: (s, v) => { v.since = s.maintenance.map((m) => m.id); st().fr = { kind: '', photos: [], area: '', issue: '', priority: '' }; },
      steps: [
        { as: 'U-ATD', ms: '11', t: '[data-ms-t="fr-kind-DAMAGE"]', do: 'Masuk sebagai Dewa (Attendant). Pilih “Kerusakan / Gangguan”.', expect: 'Jenis laporan terpilih.', check: () => (st().fr || {}).kind === 'DAMAGE' },
        { as: 'U-ATD', ms: '11', t: '[data-ms-t="photo-sample-fr"]', do: 'Tambah foto (pakai foto contoh untuk demo).', expect: 'Foto muncul sebagai bukti.', check: () => ((st().fr || {}).photos || []).length > 0 },
        { as: 'U-ATD', ms: '11', t: '[data-ms-t="fr-area"]', do: 'Pilih area “Ruang Treatment 2” dan tulis: “Kran wastafel bocor, air terus menetes.”', expect: 'Area & uraian terisi.', check: () => !!(st().fr || {}).area && ((st().fr || {}).issue || '').length >= 5 },
        { as: 'U-ATD', ms: '11', t: '[data-ms-t="fr-prio-HIGH"]', do: 'Pilih prioritas “Mendesak”, lalu tekan “Kirim Laporan”.', expect: 'Laporan terkirim ke Supervisor.', check: (c, s, v) => { const m = s.maintenance.find((x) => x.reporter === 'U-ATD' && !v.since.includes(x.id)); if (m) v.mt = m.id; return !!m; } },
        { as: 'U-SPV', ms: '12', t: (v) => `[data-ms-mt="${v.mt}"]`, do: 'Masuk sebagai Mila. Setujui laporan di “Tugas”.', expect: 'Disetujui → tim Aset membuat work order (NV-55).', check: (c, s, v) => (s.maintenance.find((x) => x.id === v.mt) || {}).status === 'APPROVED' },
      ] },
  ];
  MS.SCENARIOS = SCEN;
  const curCtx = (ctx) => ({ ms: ctx.q.ms || '', q: ctx.q, role: ctx.role, uid: ctx.user.id });
  function tutorCheck(ctx) {
    const t = T();
    if (!t.sc) return null;
    const sc = SCEN.find((x) => x.id === t.sc);
    const step = sc.steps[t.i];
    if (!step) return { sc, step: null, ok: true };
    let ok = false;
    try {
      ok = !!step.check(curCtx(ctx), ctx.s, t.v);
    } catch (e) {
      ok = false;
    }
    if (ok) t.done = Object.assign(t.done || {}, { [sc.id + t.i]: true });
    return { sc, step, ok: ok || !!(t.done || {})[sc.id + t.i] };
  }
  function tutorPanel(ctx) {
    const t = T();
    if (!t.open && !t.sc) return '';
    if (!t.sc)
      return `<div class="ms-guide list" role="dialog" aria-label="Pandu Saya"><div class="ms-row"><b>🧭 Pandu Saya</b><span class="ms-grow"></span><button class="ms-ib sm" data-a="mstut" data-k="close" aria-label="Tutup">✕</button></div><p class="tiny">Pilih skenario. Setiap langkah: <b>Tunjukkan</b> → <b>Coba</b> sendiri → <b>Lanjut</b>.</p>
        ${SCEN.map((x, i) => `<button class="ms-sc" data-a="mstut" data-k="start" data-v="${x.id}" data-ms-sc="${x.id}"><span class="ms-art sm">${x.icon}</span><span class="ms-grow"><b>${i + 1}. ${esc(x.title)}</b><span class="tiny muted">${esc(x.who)} · ${x.steps.length} langkah</span></span>›</button>`).join('')}
        <button class="ms-btn ghost sm" data-a="msreset" data-ms-t="reset">↺ Reset data demo</button></div>`;
    const r = tutorCheck(ctx);
    if (!r.step)
      return `<div class="ms-guide" role="status"><div class="ms-row"><b>🎉 Skenario selesai</b><span class="ms-grow"></span><button class="ms-ib sm" data-a="mstut" data-k="quit" aria-label="Tutup">✕</button></div><p class="small">${esc(r.sc.title)} — semua langkah berhasil memakai data HAWK yang sama.</p><div class="ms-row2"><button class="ms-btn sm" data-a="mstut" data-k="list">Skenario lain</button><button class="ms-btn ghost sm" data-a="msreset">↺ Reset demo</button></div></div>`;
    const who = S.user(ctx.s, r.step.as) || {};
    const here = ctx.user.id === r.step.as;
    const nextStep = r.sc.steps[t.i + 1];
    if (t.min) return `<button class="ms-guide-mini ${r.ok ? 'ok' : ''}" data-a="mstut" data-k="max" data-ms-t="guide-mini">${r.ok ? '✓ Berhasil — Lanjut' : `🧭 Langkah ${t.i + 1}/${r.sc.steps.length}: ${esc(r.step.do)}`}</button>`;
    return `<div class="ms-guide" role="dialog" aria-label="Langkah tutorial" data-ms-step="${r.sc.id}-${t.i}"><div class="ms-row"><b>${r.sc.icon} ${esc(r.sc.title)}</b><span class="ms-grow"></span><span class="tiny">${t.i + 1}/${r.sc.steps.length}</span><button class="ms-ib sm" data-a="mstut" data-k="quit" aria-label="Keluar tutorial">✕</button></div>
      <div class="ms-gprog">${r.sc.steps.map((x, i) => `<i class="${i < t.i ? 'd' : i === t.i ? 'c' : ''}"></i>`).join('')}</div>
      <dl class="ms-gkv"><dt>Peran</dt><dd>👤 <b>${esc(who.name || '')}</b> — ${esc(who.title || '')} ${here ? '<span class="ms-chip ok">aktif</span>' : `<button class="ms-btn sm" data-a="mstut" data-k="as" data-ms-t="guide-as">Masuk sebagai ${esc(first(who))}</button>`}</dd>
      <dt>Lakukan</dt><dd>${esc(r.step.do)}</dd><dt>Hasil</dt><dd>${esc(r.step.expect)}</dd><dt>Berikutnya</dt><dd>${nextStep ? esc(nextStep.do) : 'Skenario selesai.'}</dd></dl>
      ${r.ok ? '<div class="ms-ok">✓ Berhasil!</div>' : ''}
      <div class="ms-row2"><button class="ms-btn ghost sm" data-a="mstut" data-k="show" data-ms-t="guide-show">👁 Tunjukkan</button><button class="ms-btn ghost sm" data-a="mstut" data-k="try" data-ms-t="guide-try">✋ Coba</button>${r.step.auto && !r.ok ? '<button class="ms-btn ghost sm" data-a="mstut" data-k="auto" data-ms-t="guide-auto">⚡ Lakukan untuk saya</button>' : ''}<button class="ms-btn sm" data-a="mstut" data-k="next" ${r.ok ? '' : 'disabled'} data-ms-t="guide-next">Lanjut →</button></div></div>`;
  }
  function tutorShow(ctx) {
    const t = T();
    const sc = SCEN.find((x) => x.id === t.sc);
    const step = sc && sc.steps[t.i];
    if (!step) return;
    if (ctx.user.id !== step.as) HAWK.setUser(step.as, {});
    t.min = true; // collapse the guide to a pill so the highlighted control stays visible
    const sel = typeof step.t === 'function' ? step.t(t.v) : step.t;
    const q = step.ms === '07' || step.ms === '08' ? { id: t.v.mrf } : step.ms === '10' ? { id: t.v.sp } : null;
    const curMs = (location.hash.match(/^#\/m\/(\d\d)/) || [])[1];
    const needNav = curMs !== step.ms && !(step.ms === '02' && sel && /data-ms-t="hero-request"/.test(sel));
    if (needNav && !(t.i > 0 && sc.steps[t.i - 1].ms === step.ms && curMs === step.ms)) go(step.ms, q);
    else HAWK.render();
    setTimeout(() => HAWK.dxFocus && HAWK.dxFocus(sel, '👆 ' + step.do.split('.')[0], 'ms-' + sc.id + '-' + t.i), 120);
  }

  /* =====================================================================================
     View registration (internal id 100, route #/m/NN)
     ===================================================================================== */
  const RENDER = { '01': home, '02': catalogView, '03': catalogView, '04': basket, '05': submitView, '06': requests, '07': journeyView, '08': receiving, '09': camera, '10': review, '11': facility, '12': tasks };
  MS.render = function (ctx) {
    const code = RENDER[ctx.q.ms] ? ctx.q.ms : ctx.user.role === 'STAFF' || ctx.user.role === 'SUPERVISOR' ? '01' : '12';
    ctx.q.ms = code;
    const scr = SCREENS.find((x) => x.code === code);
    if (code === '03' && !st().sel) st().sel = ctx.q.it || 'BHP-001';
    const back = { '02': '01', '03': '01', '04': '02', '05': '04', '07': '06', '08': '01', '09': '01', '10': '09', '11': '01' }[code];
    const right = code === '12' || code === '01' ? `<button class="ms-ib" data-a="msgo" data-to="12" aria-label="Notifikasi">🔔${feed(ctx).filter((x) => x.dot).length ? `<b class="ms-badge">${feed(ctx).filter((x) => x.dot).length}</b>` : ''}</button>` : code === '10' ? '<span class="ms-chip violet">AI ✦</span>' : '<span></span>';
    let body;
    try {
      body = RENDER[code](ctx);
    } catch (e) {
      console.error(e);
      body = `<div class="ms-body"><div class="ms-warn">Gagal menampilkan ${esc(scr.name)}: ${esc(e.message)}</div></div>`;
    }
    const L = st();
    delete L.err;
    const acc = DEMO_ACCOUNTS.map(([id, n, r]) => `<button class="${ctx.user.id === id ? 'on' : ''}" data-a="msas" data-u="${id}">${n}<span>${r}</span></button>`).join('');
    return `<div class="ms-shell" data-ms="${code}"><div class="ms-meta"><span class="ms-chip gold">MS-${code}</span><span class="tiny">${esc(scr.name)} · terhubung ke <button class="ms-link" data-nav="${scr.nv}">NV-${String(scr.nv).padStart(2, '0')}</button></span><span class="ms-grow"></span><button class="ms-guide-fab" data-a="mstut" data-k="open" data-ms-t="guide">🧭 Pandu Saya</button><span class="badge demo">DEMO</span></div>
      <div class="ms-accts" aria-label="Akun demo">${acc}</div>
      <div class="ms-app ${code === '09' ? 'dark' : ''}">${code === '01' ? head(ctx, '', null, right).replace('<h1></h1>', '<h1 class="ms-logo">HAWK<span>×</span>JAENS</h1>') : head(ctx, scr.title, back, right)}${body}${['09', '05', '08', '10', '11'].includes(code) ? '' : tabbar(ctx, code)}${tutorPanel(ctx)}</div>
      <p class="tiny muted ms-foot">Smart Staff Mobile (MP-HAWK-14) · data demo bersama dengan semua layar HAWK · ${esc(meLine(ctx))}</p></div>`;
  };
  function errTo(ctx, r) {
    const L = st();
    L.err = r.error ? r.error.message : 'Gagal';
    const el = document.getElementById('ms-err');
    if (el) {
      el.textContent = L.err;
      el.hidden = false;
      el.scrollIntoView && el.scrollIntoView({ block: 'center' });
    }
    ui.toast(L.err, 'bad', r.error && r.error.code);
  }
  const rer = () => HAWK.render();
  const A = {
    msgo(el) {
      const q = el.dataset.q ? JSON.parse(el.dataset.q) : null;
      if (el.dataset.to === '02') delete st().sel;
      go(el.dataset.to, q && Object.keys(q).length ? q : null);
    },
    msmenu() {
      go('01');
    },
    msas(el) {
      HAWK.setUser(el.dataset.u, {});
      Object.assign(st(), { ho: null });
      rer();
    },
    mscat(el) {
      st().cat = el.dataset.k;
      rer();
    },
    msfind(el) {
      st().find = el.value;
      const q = el.value.toLowerCase();
      document.querySelectorAll('[data-ms-item]').forEach((r) => (r.style.display = !q || r.textContent.toLowerCase().includes(q) ? '' : 'none'));
    },
    msqty(el) {
      const L = st();
      L.cart = L.cart || {};
      L.cart[el.dataset.it] = Math.max(0, Math.min(999, (L.cart[el.dataset.it] || 0) + +el.dataset.d));
      rer();
    },
    mssel(el) {
      st().sel = el.dataset.it;
      rer();
    },
    msclose() {
      delete st().sel;
      rer();
    },
    msadd(el) {
      const L = st();
      L.cart = L.cart || {};
      if (!L.cart[el.dataset.it]) L.cart[el.dataset.it] = 1;
      delete L.sel;
      ui.toast('Ditambahkan ke permintaan', 'ok');
      rer();
    },
    msfav(el) {
      const L = st();
      L.fav = L.fav || {};
      L.fav[el.dataset.it] = !L.fav[el.dataset.it];
      rer();
    },
    msrm(el) {
      delete st().cart[el.dataset.it];
      rer();
    },
    msclear() {
      st().cart = {};
      rer();
    },
    mstype(el) {
      st().type = el.value;
    },
    msmemo(el) {
      st().memo = el.value;
    },
    mssubmit(el, ctx) {
      const L = st();
      const lines = cartLines(L).map((l) => ({ ...l, reason: L.type === 'NON_ROUTINE' ? L.memo || 'Kebutuhan tambahan' : 'Pemakaian rutin' }));
      const r = call(ctx, 'mrf.create', { type: L.type || 'ROUTINE', memo: L.memo || 'Permintaan dari aplikasi staf', purpose: 'Operasional harian', lines });
      if (!r.ok) return errTo(ctx, r);
      L.cart = {};
      L.memo = '';
      ui.toast('Permintaan terkirim — menunggu persetujuan', 'ok', 'mrf.create · ' + r.status);
      go('05', { id: r.data.id });
    },
    msrtab(el) {
      st().rtab = el.dataset.k;
      rer();
    },
    msttab(el) {
      st().ttab = el.dataset.k;
      rer();
    },
    msnotif(el, ctx) {
      const L = st();
      L.notif = L.notif || {};
      L.notif[ctx.q.id || 'x'] = true;
      ui.toast('Notifikasi aktif untuk permintaan ini (DEMO — push notification produksi: NEW INTEGRATION REQUIRED)', 'ok');
      rer();
    },
    mscancel(el, ctx) {
      ui.ask('Batalkan permintaan?', 'Alasan', (note) => {
        const r = call(ctx, 'mrf.cancel', { id: el.dataset.id2, note: note || 'Dibatalkan pemohon' });
        if (!r.ok) return errTo(ctx, r);
        ui.toast('Permintaan dibatalkan', 'ok');
        rer();
      });
    },
    msissue(el, ctx) {
      const r = call(ctx, 'mrf.issue', { id: el.dataset.id2 });
      if (!r.ok) return errTo(ctx, r);
      ui.toast('Barang diserahkan — menunggu konfirmasi pemohon', 'ok', 'mrf.issue');
      rer();
    },
    mshq(el) {
      const H = st().ho;
      H.q[el.dataset.it] = Math.max(0, (H.q[el.dataset.it] || 0) + +el.dataset.d);
      rer();
    },
    mshcond(el) {
      st().ho.cond = el.dataset.k;
      rer();
    },
    mshnote(el) {
      st().ho.note = el.value;
    },
    mshsubmit(el, ctx) {
      const H = st().ho;
      const r = call(ctx, 'mrf.confirmHandover', { id: H.id, lines: Object.entries(H.q).map(([item, qty]) => ({ item, qty })), condition: H.cond, note: H.note, photos: H.photos });
      if (!r.ok) return errTo(ctx, r);
      st().ho = null;
      ui.toast('Penerimaan dikonfirmasi', 'ok', 'mrf.confirmHandover');
      rer();
    },
    msphoto(el) {
      const f = el.files && el.files[0];
      if (!f) return;
      const key = el.dataset.k;
      readPhoto(f, (d) => {
        if (!d) return ui.toast('Foto tidak dapat dibaca', 'bad');
        (key === 'ho' ? st().ho : st().fr).photos.push(d);
        rer();
      });
    },
    msphsample(el) {
      const key = el.dataset.k;
      (key === 'ho' ? st().ho : st().fr).photos.push(SAMPLE_PHOTO[key]);
      rer();
    },
    msphdel(el) {
      (el.dataset.k === 'ho' ? st().ho : st().fr).photos.splice(+el.dataset.i, 1);
      rer();
    },
    msrsc(el) {
      st().rsc = el.dataset.k;
      rer();
    },
    mscapture(el, ctx) {
      const r = call(ctx, 'spend.capture', { scenario: el.dataset.k });
      if (!r.ok) return errTo(ctx, r);
      st().edit = false;
      go('10', { id: r.data.id });
    },
    msupload(el, ctx) {
      const f = el.files && el.files[0];
      if (!f) return;
      readPhoto(f, (d) => {
        if (!d) return ui.toast('Foto tidak dapat dibaca', 'bad');
        const r = call(ctx, 'spend.capture', { upload: { name: f.name, dataUrl: d } });
        if (!r.ok) return errTo(ctx, r);
        go('10', { id: r.data.id });
      });
    },
    msev() {
      st().ev = !st().ev;
      rer();
    },
    msedit() {
      st().edit = !st().edit;
      rer();
    },
    msf(el, ctx) {
      const sp = S.spend(ctx.s, ctx.q.id);
      const fields = { [el.dataset.k]: el.value };
      // a paid receipt needs a payment date: default it to the receipt date (staff can still change it)
      if (sp && el.dataset.k === 'pay' && HAWK.SPEND.PAY[el.value] && HAWK.SPEND.PAY[el.value].flow === 'PAID' && !sp.fields.payDate) fields.payDate = sp.fields.date || ctx.s.meta.demoDate;
      const r = call(ctx, 'spend.update', { id: ctx.q.id, fields });
      if (!r.ok) return errTo(ctx, r);
      rer();
    },
    msl(el, ctx) {
      const sp = S.spend(ctx.s, ctx.q.id);
      const lines = sp.lines.map((l, i) => (i === +el.dataset.i ? { ...l, [el.dataset.k]: el.dataset.k === 'desc' ? el.value : +String(el.value).replace(/[^\d]/g, '') } : l));
      const r = call(ctx, 'spend.update', { id: sp.id, lines });
      if (!r.ok) return errTo(ctx, r);
      rer();
    },
    msaddline(el, ctx) {
      const sp = S.spend(ctx.s, ctx.q.id);
      const r = call(ctx, 'spend.update', { id: sp.id, lines: sp.lines.concat([{ desc: 'Barang baru', qty: 1, price: 0, uom: 'pcs' }]) });
      if (!r.ok) return errTo(ctx, r);
      st().edit = true;
      rer();
    },
    msconfirm(el, ctx) {
      const r = call(ctx, 'spend.update', { id: ctx.q.id, confirm: [el.dataset.k] });
      if (!r.ok) return errTo(ctx, r);
      rer();
    },
    mscls(el, ctx) {
      const r = call(ctx, 'spend.update', { id: ctx.q.id, cls: { [el.dataset.k]: el.value || null } });
      if (!r.ok) return errTo(ctx, r);
      rer();
    },
    msnote(el, ctx) {
      call(ctx, 'spend.update', { id: ctx.q.id, note: el.value });
    },
    msspsubmit(el, ctx) {
      const r = call(ctx, 'spend.submit', { id: el.dataset.id2 });
      if (!r.ok) return errTo(ctx, r);
      ui.toast('Nota diajukan — menunggu persetujuan', 'ok', 'spend.submit');
      rer();
    },
    msfr(el) {
      st().fr[el.dataset.k] = el.dataset.v;
      rer();
    },
    msfrsel(el) {
      st().fr[el.dataset.k] = el.value;
      if (el.dataset.k === 'area') rer();
    },
    msfrcount(el) {
      st().fr.issue = el.value;
      const c = document.getElementById('ms-fr-count');
      if (c) c.textContent = el.value.length + ' / 250';
    },
    msfrnew() {
      st().fr = { kind: '', photos: [], area: '', issue: '', priority: '' };
      go('11');
    },
    msfrsend(el, ctx) {
      const F = st().fr;
      if (!F.kind) return errTo(ctx, { error: { message: 'Pilih jenis laporan', code: 'VALIDATION' } });
      if (!F.priority) return errTo(ctx, { error: { message: 'Pilih tingkat prioritas', code: 'VALIDATION' } });
      const isAsset = /^A:/.test(F.area || '');
      const asset = isAsset ? F.area.slice(2) : null;
      const r = call(ctx, 'mt.create', { asset, area: isAsset ? (S.asset(ctx.s, asset) || {}).location : F.area, kind: F.kind, issue: F.issue, priority: F.priority, photos: F.photos });
      if (!r.ok) return errTo(ctx, r);
      st().fr = { kind: '', photos: [], area: '', issue: '', priority: '' };
      ui.toast('Laporan terkirim ke Supervisor', 'ok', 'mt.create');
      go('11', { id: r.data.id });
    },
    msdecide(el, ctx) {
      const d = el.dataset.d;
      const run = (note) => {
        const r = call(ctx, 'mrf.decide', { id: el.dataset.id2, decision: d, note: note || 'Disetujui dari aplikasi staf' });
        if (!r.ok) return errTo(ctx, r);
        ui.toast(d === 'APPROVE' ? 'Permintaan disetujui' : 'Permintaan ditolak', 'ok', 'mrf.decide');
        rer();
      };
      if (d === 'APPROVE') run();
      else ui.ask('Tolak permintaan', 'Alasan (wajib)', run, { danger: true, ok: 'Tolak' });
    },
    msmt(el, ctx) {
      const r = call(ctx, 'mt.review', { id: el.dataset.id2, decision: el.dataset.d, note: el.dataset.d === 'APPROVE' ? 'OK' : 'Ditolak dari aplikasi' });
      if (!r.ok) return errTo(ctx, r);
      ui.toast(el.dataset.d === 'APPROVE' ? 'Laporan disetujui' : 'Laporan ditolak', 'ok', 'mt.review');
      rer();
    },
    msreset() {
      HAWK.resetDemo();
      const ok = document.getElementById('reset-ok');
      if (ok) ok.addEventListener('click', () => { ui.local._msTutor = { sc: null, i: 0, v: {}, open: true }; delete ui.local[VID]; });
    },
    mstut(el, ctx) {
      const t = T();
      const k = el.dataset.k;
      if (HAWK.dxClear) HAWK.dxClear();
      if (k === 'open' || k === 'list') Object.assign(t, { open: true, sc: null, min: false });
      else if (k === 'close') t.open = false;
      else if (k === 'quit') Object.assign(t, { sc: null, open: false, min: false });
      else if (k === 'start') {
        const sc = SCEN.find((x) => x.id === el.dataset.v);
        Object.assign(t, { sc: sc.id, i: 0, v: {}, done: {}, min: false });
        sc.setup && sc.setup(ctx.s, t.v);
        return tutorShow(ctx);
      } else if (k === 'as') {
        const sc = SCEN.find((x) => x.id === t.sc);
        HAWK.setUser(sc.steps[t.i].as, {});
        return tutorShow(Object.assign({}, ctx, { user: S.user(ctx.s, sc.steps[t.i].as) }));
      } else if (k === 'show') return tutorShow(ctx);
      else if (k === 'try') t.min = true;
      else if (k === 'max') t.min = false;
      else if (k === 'auto') {
        const sc = SCEN.find((x) => x.id === t.sc);
        sc.steps[t.i].auto(t.v);
      } else if (k === 'next') {
        t.i++;
        t.min = false;
        const sc = SCEN.find((x) => x.id === t.sc);
        if (sc.steps[t.i]) return tutorShow(ctx);
      }
      rer();
    },
  };
  HAWK.views[VID] = { render: MS.render, actions: A };
})();
