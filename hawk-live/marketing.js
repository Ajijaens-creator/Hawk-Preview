/* HAWK ERP · Commercial workspace screens, Fase 2B (DATA DEMO / SIMULASI)
   F2-05 Digital Marketing · F2-06 Social Media · F2-07 Media Partner & KOL · F2-08 Audience & Attribution
   (juga F7-02 Jejak Booking) · F2-10 AI Marketing Mentor.
   Revenue terverifikasi selalu dari transaksi POS (SER dataset); angka platform hanya snapshot demo berlabel. */
(() => {
const H = window.HL;
const { esc, num, rp, jt, pct, dec, link, table, card, metrics, qs } = H;
const st = () => H.state;
const cx = () => CX.ensure(H.state);
const mk = () => cx().mk;
const TODAY = CX.TODAY;
const who = (id) => esc(CX.personName(id));
const chip = (text, tone = '') => `<span class="status-chip ${tone}">${esc(text)}</span>`;
const sel = (name, label, options, value, extra = '') => `<label>${label} <select name="${name}" ${extra}>${options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value ?? '') ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select></label>`;
const hidden = (obj) => Object.entries(obj).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `<input type="hidden" name="${k}" value="${esc(v)}">`).join('');
const viewTabs = (route, views, current, keep) => `<nav class="tabs" aria-label="Tampilan">${views.map(([k, l, n]) => `<a class="tab${k === current ? ' on' : ''}" href="#${route}${qs({ ...keep, view: k })}" ${k === current ? 'aria-current="page"' : ''}>${l}${n !== undefined ? ` <span class="c">${n}</span>` : ''}</a>`).join('')}</nav>`;
const register = (id, fn, title) => { H.REGISTRY[id] = fn; if (title) fn.title = title; };
const cmpName = (id) => id ? esc(cx().campaigns.find(c => c.id === id)?.name || id) : '<span class="warn-t">Tanpa campaign</span>';
const cmpLink = (id) => id ? `<a href="#campaign-detail${qs({ id })}">${id}</a> · ${cmpName(id)}` : cmpName('');
const x = (v) => v === null || v === undefined ? '—' : dec(v) + '×';
const sim = '<span class="badge demo">SIMULASI</span>';
const note = (t) => `<p class="muted small">${t}</p>`;
const scope = (params) => { const f = H.filtersOf(params); const ds = SER.dataset(st()); const ids = SER.outletIds(f.outlet); return { f, ds, ids, inScope: (r) => ids.includes(r.outlet) && r.period === f.period }; };

/* ================= F2-05 Digital Marketing ================= */
function dailyChart(rows, period) {
  /* spend snapshot dibagi rata per hari hingga cut-off (estimasi demo) vs booking dibayar POS per tanggal transaksi */
  const days = 31, spend = rows.reduce((s, r) => s + r.spend, 0);
  const camps = rows.map(r => r.campaign).filter(Boolean);
  const paid = SER.dataset(st()).tx.filter(t => t.period === period && t.status === 'paid' && camps.includes(t.campaign));
  const per = Array.from({ length: days }, (_, i) => paid.filter(t => Number(t.date.slice(8)) === i + 1).length);
  const max = Math.max(1, ...per), w = 600, h = 140, bw = w / days;
  return `<svg viewBox="0 0 ${w} ${h + 20}" role="img" aria-label="Booking dibayar per hari, ${period}. Spend per hari ${rp(spend / days)} (estimasi rata)." style="width:100%;height:auto">
    ${per.map((v, i) => `<rect x="${i * bw + 2}" y="${h - v / max * h}" width="${bw - 4}" height="${v / max * h}" rx="2" fill="#C99A2E"><title>${i + 1}: ${v} booking dibayar</title></rect>`).join('')}
    <line x1="0" x2="${w}" y1="${h - (spend / days) / (spend / days * 1.6 || 1) * h}" y2="${h - (spend / days) / (spend / days * 1.6 || 1) * h}" stroke="#0B0B0B" stroke-dasharray="4 4"/>
    ${[1, Math.ceil(days / 2), days].map(d => `<text x="${(d - 0.5) * bw}" y="${h + 14}" font-size="10" text-anchor="middle" fill="#777">${d}</text>`).join('')}</svg>
    <p class="legend"><span><i class="dot" style="background:#C99A2E"></i>Booking dibayar (POS) per hari · maks ${num(max)}</span><span>- - Spend rata ${rp(spend / days)}/hari (estimasi rata dari snapshot)</span></p>`;
}
register('digital', (params) => {
  const view = params.view || 'funnel';
  const { f } = scope(params);
  const platform = MK.PLATFORMS.includes(params.platform) ? params.platform : '';
  const all = MK.adsView(SER.dataset(st()), f.period).filter(r => !platform || r.platform === platform).filter(r => !params.campaign || r.campaign === params.campaign);
  const keep = { period: f.period, outlet: f.outlet, platform, campaign: params.campaign };
  const tot = all.reduce((s, r) => ({ impressions: s.impressions + r.impressions, clicks: s.clicks + r.clicks, spend: s.spend + r.spend, platformConv: s.platformConv + r.platformConv, leads: s.leads + r.leads, waLeads: s.waLeads + r.waLeads, bookings: s.bookings + r.bookings, revenue: s.revenue + r.revenue }), { impressions: 0, clicks: 0, spend: 0, platformConv: 0, leads: 0, waLeads: 0, bookings: 0, revenue: 0 });
  const bar = H.filterBar(f, params, sel('platform', 'Platform', [['', 'Semua platform'], ...MK.PLATFORMS], platform) + sel('campaign', 'Campaign', [['', 'Semua campaign'], ...cx().campaigns.map(c => [c.id, `${c.id} · ${c.name}`])], params.campaign) + hidden({ view }));
  const head = metrics([
    ['Spend iklan (snapshot)', rp(tot.spend), `${MK.ADS.length} creative · ${mk().imports.filter(i => i.period === '2026-08').length}/3 platform diimpor`],
    ['CTR', pct(MK.div(tot.clicks, tot.impressions), 2), `acuan audit Agu ${pct(MK.BENCH.ctr, 2)} (definisi lama)`],
    ['CPL', rp(tot.leads ? tot.spend / tot.leads : null), `${num(tot.leads)} lead tercatat · CPC ${rp(MK.div(tot.spend, tot.clicks))}`],
    ['ROAS terverifikasi (POS)', x(MK.div(tot.revenue, tot.spend)), `ROAS legacy audit ${x(MK.BENCH.roasLegacy)} · beda definisi`]
  ]);
  const tabs = viewTabs('digital', [['funnel', 'Funnel'], ['ads', 'Paid Ads'], ['seo', 'SEO'], ['experiments', 'Experiment Board', mk().experiments.filter(e => e.status === 'Running').length], ['quality', 'Data Quality']], view, keep);
  let body = '';
  if (view === 'funnel') {
    const steps = [['Impressions (platform)', tot.impressions], ['Klik (platform)', tot.clicks], ['Lead tercatat HAWK', tot.leads], ['Booking dibayar (POS)', tot.bookings]];
    body = `<div class="grid g2">${card('Funnel paid · ' + (platform || 'semua platform'), steps.map(([l, v], i) => H.bar(l, `${num(v)}${i ? ' · ' + pct(MK.div(v, steps[i - 1][1]), 1) + ' dari tahap sebelumnya' : ''}`, MK.div(v, steps[0][1]) ? Math.max(0.02, Math.sqrt(v / steps[0][1])) : 0)).join('') + note('Lebar batang memakai skala akar agar tahap kecil tetap terlihat. Tiga hasil dipisah: konversi platform ' + num(tot.platformConv) + ' (laporan platform), lead WhatsApp ' + num(tot.waLeads) + ' (proxy), booking dibayar ' + num(tot.bookings) + ' (POS, terverifikasi).'))}
      ${card('Spend dan hasil per hari', dailyChart(all, f.period) + `<div class="actions">${link('digital' + qs({ ...keep, view: 'ads' }), 'Buka per creative ›')}</div>`)}</div>`;
  } else if (view === 'ads') {
    const rows = [];
    MK.PLATFORMS.filter(p => !platform || p === platform).forEach(p => {
      const cs = all.filter(r => r.platform === p); if (!cs.length) return;
      const s = cs.reduce((a, r) => ({ i: a.i + r.impressions, c: a.c + r.clicks, sp: a.sp + r.spend, pc: a.pc + r.platformConv, l: a.l + r.leads, b: a.b + r.bookings, rv: a.rv + r.revenue }), { i: 0, c: 0, sp: 0, pc: 0, l: 0, b: 0, rv: 0 });
      rows.push([`<b>${p}</b>`, num(s.i), num(s.c), pct(MK.div(s.c, s.i), 2), rp(MK.div(s.sp, s.c)), rp(s.i ? s.sp / s.i * 1000 : null), rp(s.sp), num(s.pc), num(s.l), num(s.b), jt(s.rv), rp(s.l ? s.sp / s.l : null), x(MK.div(s.rv, s.sp))]);
      cs.forEach(r => {
        rows.push([`<span style="padding-left:14px">${cmpLink(r.campaign)}</span>`, num(r.impressions), num(r.clicks), pct(r.ctr, 2), rp(r.cpc), rp(r.cpm), rp(r.spend), num(r.platformConv), `${num(r.leads)}<br><small class="muted">${num(r.waLeads)} via WA</small>`, num(r.bookings), jt(r.revenue), r.spend && !r.leads ? '<span class="warn-t">spend tanpa lead</span>' : rp(r.cpl), x(r.roas)]);
        r.creatives.forEach(c => rows.push([`<span style="padding-left:28px">${c.id} · ${esc(c.name)}</span>`, num(c.impressions), num(c.clicks), pct(MK.div(c.clicks, c.impressions), 2), rp(MK.div(c.spend, c.clicks)), rp(c.impressions ? c.spend / c.impressions * 1000 : null), rp(c.spend), num(c.platformConv), '—', '—', '—', '—', '—']));
      });
    });
    body = card('Platform → campaign → creative', table(['Baris', 'Impr.', 'Klik', 'CTR', 'CPC', 'CPM', 'Spend', 'Konv. platform', 'Lead', 'Booking dibayar', 'Revenue POS', 'CPL', 'ROAS POS'], rows) +
      note('CTR = klik ÷ impressions · CPC = spend ÷ klik · CPM = spend ÷ impressions × 1.000 · CPL = spend ÷ lead · ROAS = revenue POS dibayar ÷ spend. Denominator nol tampil “—”. Hasil POS dihitung di level campaign (UTM), bukan per creative. Klik campaign untuk biaya dan lead.'));
  } else if (view === 'seo') {
    const t = MK.SEO.reduce((s, q) => ({ c: s.c + q.clicks, i: s.i + q.impressions, e: s.e + q.engaged }), { c: 0, i: 0, e: 0 });
    body = metrics([['Klik organik', num(t.c), 'snapshot GSC demo'], ['Impressions', num(t.i), ''], ['CTR organik', pct(t.c / t.i, 2), ''], ['Engaged sessions', num(t.e), 'snapshot GA4 demo']]) +
      `<div class="grid g2">${card('Query → URL', table(['Query', 'URL', 'Posisi', 'Klik', 'Impr.', 'CTR', 'Engaged'], MK.SEO.map(q => [esc(q.query), `<code>${q.url}</code>`, num(q.rank, 1), num(q.clicks), num(q.impressions), pct(q.clicks / q.impressions, 1), num(q.engaged)])))}
      ${card('SEO backlog', `<ol class="history"><li><b>Halaman Hot Stone</b> · posisi 14,3 → tambah FAQ dan harga · PIC ${who('MBR-C02')}</li><li><b>Couple package</b> · CTR ${pct(410 / 15800, 1)} rendah → perbaiki judul &amp; deskripsi</li><li><b>Wellness massage</b> · tautkan dari campaign CMP-001</li><li><b>Data</b> · revenue organik hanya dihitung bila booking membawa sumber “Website / SEO” di POS</li></ol>`)}</div>`;
  } else if (view === 'experiments') {
    const ex = mk().experiments;
    body = card('Experiment Board', table(['Eksperimen', 'Campaign', 'Metrik', 'Baseline', 'Varian', 'Window', 'PIC', 'Status', 'Hasil / keputusan'], ex.map(e => [`${e.id} · ${esc(e.title)}`, cmpLink(e.campaign), esc(e.metric), pct(e.baseline, 1), esc(e.variant), esc(e.window), who(e.pic), chip(e.status, e.status === 'Running' ? 'sandbox' : 'ready'),
      e.status === 'Running' ? `<form class="inline-form" data-submit="cx:exp-result">${hidden({ id: e.id })}<label>Hasil (rasio)<input name="result" type="number" step="0.001" min="0" required placeholder="0,45"></label>${sel('decision', 'Keputusan', ['Lanjut', 'Ubah', 'Henti'], 'Lanjut')}<button class="btn ghost sm">Catat</button></form>` : `${pct(e.result, 1)} vs ${pct(e.baseline, 1)} → <b>${esc(e.decision)}</b>${e.note ? `<br><small class="muted">${esc(e.note)}</small>` : ''}`])) +
      `<details class="new-content"><summary class="btn sm">+ Eksperimen CTA</summary><form class="workflow-form stack-form" data-submit="cx:exp-create">${hidden({ source: 'Digital Marketing' })}
      <label>Judul<input name="title" required minlength="5" placeholder="mis. CTA WhatsApp di Story"></label>${sel('campaign', 'Campaign', cx().campaigns.map(c => [c.id, `${c.id} · ${c.name}`]), 'CMP-001')}
      <label>Metrik<input name="metric" value="Lead → booking dibayar"></label><label>Baseline (rasio)<input name="baseline" type="number" step="0.001" min="0" required value="0.42"></label>
      <label>Varian<input name="variant" required placeholder="Tombol Chat &amp; Book"></label><label>Window<input name="window" value="2026-08-24 – 2026-09-07"></label>${sel('pic', 'PIC', CX.PEOPLE.map(p => [p.id, p.name]), 'MBR-C02')}
      <button class="btn">Simpan eksperimen</button></form></details>` + note('Eksperimen dari AI Mentor memakai kunci insight sehingga menekan ulang tidak membuat eksperimen ganda.'));
  } else {
    const ds = SER.dataset(st());
    const unknown = ds.tx.filter(t => t.period === f.period && t.status === 'paid' && t.group === 'Tidak diketahui');
    const checks = [
      ['Tanggal parsial', mk().imports.some(s => s.period === f.period && s.partial) ? mk().imports.filter(s => s.period === f.period && s.partial).map(s => `${s.platform} hanya s.d. ${s.through}`).join('; ') + ' · ROAS platform itu belum final.' : `TikTok Ads belum diimpor untuk ${f.period}; spend TikTok di tabel memakai estimasi creative.`, mk().imports.some(s => s.period === f.period && s.partial) ? 'sandbox' : 'ready'],
      ['UTM belum ter-mapping', `${mk().utm.filter(u => u.status === 'unmapped').length} UTM · biaya masuk “Tanpa campaign”.`, mk().utm.some(u => u.status === 'unmapped') ? 'bad' : 'ready'],
      ['Spend tanpa lead', MK.ADS.filter(a => a.spend && !a.platformConv).map(a => a.id).join(', ') || 'Tidak ada', 'sandbox'],
      ['Denominator nol', MK.ADS.filter(a => !a.impressions).map(a => `${a.id} (0 impressions → CTR/CPM “—”)`).join(', ') || 'Tidak ada', ''],
      ['Unknown attribution (POS)', `${num(unknown.length)} transaksi · ${jt(unknown.reduce((s, t) => s + t.amount, 0))} tetap masuk total revenue.`, 'sandbox']
    ];
    body = `<div class="grid g2">${card('Pemeriksaan data', table(['Cek', 'Temuan', 'Status'], checks.map(([a, b, t]) => [a, b, chip(t === 'bad' ? 'Perlu tindakan' : t === 'ready' ? 'OK' : 'Perhatikan', t)])) + `<div class="actions">${link('attribution?view=exceptions', 'Antrean perbaikan atribusi ›')}</div>`)}
      ${card('Impor snapshot platform ' + sim, table(['Snapshot', 'Platform', 'Periode', 'Data s.d.', 'Baris', 'Diimpor'], mk().imports.map(s => [s.id, s.platform, s.period, `${s.through}${s.partial ? ' <span class="warn-t">parsial</span>' : ''}`, num(s.rows), `${s.at}${s.reimported ? `<br><small class="muted">impor ulang ×${s.reimported} · tidak menambah baris</small>` : ''}`])) +
        `<form class="inline-form" data-submit="cx:snap-import">${sel('platform', 'Platform', MK.PLATFORMS, 'Meta Ads')}<button class="btn sm">Impor snapshot</button></form>` + note('Impor ulang dengan cut-off sama memakai ID snapshot yang sama, jadi tidak menggandakan biaya.'))}</div>
      ${card('Mapping UTM → campaign', table(['UTM', 'Campaign', 'Status', 'Aksi'], mk().utm.map(u => [`<code>${esc(u.utm)}</code>`, cmpLink(u.campaign), chip(u.status === 'mapped' ? 'Ter-mapping' : 'Belum', u.status === 'mapped' ? 'ready' : 'bad'), u.status === 'unmapped' ? `<form class="inline-form" data-submit="cx:utm-map">${hidden({ utm: u.utm })}${sel('campaign', 'Ke campaign', cx().campaigns.filter(c => c.status !== 'Closed').map(c => [c.id, `${c.id} · ${c.name}`]), 'CMP-001')}<button class="btn ghost sm">Simpan mapping</button></form>` : (u.mappedAt ? `dipetakan ${u.mappedAt}` : '—')])))}`;
  }
  return `<div class="heading-row">${bar}</div>${head}${tabs}${body}`;
}, () => 'Digital Marketing');

/* ================= F2-06 Social Media ================= */
const acc = (id) => mk().accounts.find(a => a.id === id);
register('social', (params) => {
  const view = params.view || 'calendar';
  const period = ['2026-07', '2026-08'].includes(params.period) ? params.period : '2026-08';
  const platform = params.platform || '';
  const keep = { period, platform };
  const bar = `<form id="filters" class="filters" aria-label="Filter">${hidden({ view })}${sel('period', 'Periode', [['2026-08', 'Agustus 2026'], ['2026-07', 'Juli 2026']], period)}${sel('platform', 'Platform', [['', 'Semua platform'], 'Instagram', 'TikTok', 'Facebook'], platform)}<button type="button" class="btn ghost" data-action="filter-reset">Reset filter</button></form>`;
  const convs = mk().convs;
  const tabs = viewTabs('social', [['calendar', 'Publishing Calendar'], ['inbox', 'Inbox & Moderation', convs.filter(c => c.status === 'open').length], ['analytics', 'Analytics'], ['units', 'Unit Business Growth']], view, keep);
  let body = '';
  if (view === 'calendar') {
    const pubs = cx().publications.filter(p => !platform || p.platform === platform).slice().sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    body = card('Jadwal per akun', table(['Waktu (WITA)', 'Akun', 'Platform', 'Konten', 'Status', 'Post ID'], pubs.map(p => { const c = cx().content.find(k => k.id === p.content); return [p.scheduledAt, esc(p.account), p.platform, `<a href="#studio${qs({ content: p.content, ctab: 'publish' })}">${p.content} · ${esc(c?.title || '')}</a>`, chip(p.status, p.status === 'published' ? 'ready' : p.status === 'draft' ? 'bad' : 'sandbox'), p.postId || '—']; })) +
      note(`Satu konten bisa punya beberapa publikasi: ${num(pubs.length)} publikasi dari ${num(new Set(pubs.map(p => p.content)).size)} konten. Jadwal dan post ID dicatat di Content Studio (tab Publikasi); tidak ada akun sosial yang terhubung.`));
  } else if (view === 'inbox') {
    body = card('Antrean komentar & DM ' + sim, table(['Masuk', 'Kanal', 'Dari', 'Pesan', 'Asal', 'Kategori', 'Status / aksi'], convs.filter(c => !platform || c.channel.includes(platform)).map(c => [c.at, `${esc(c.channel)}<br><small class="muted">${esc(acc(c.account)?.handle || '')}</small>`, esc(c.from), `<span class="wrap">${esc(c.text)}</span>`, c.campaign ? `${cmpLink(c.campaign)}${c.publication ? `<br><small>${c.publication}</small>` : ''}` : '—',
      `<form class="inline-form" data-submit="cx:conv-tag">${hidden({ id: c.id })}${sel('category', `<span class="sr">Kategori ${c.id}</span>`, [['', '—'], ...MK.CONV_CATS], c.category)}<button class="btn ghost sm">Simpan</button></form>`,
      c.lead ? `${chip('Dialihkan ke Sales', 'ready')}<br><a href="#reservation">${c.lead}</a>` : c.status === 'hidden' ? chip('Disembunyikan', '') : c.category === 'Reservasi' ? `<button type="button" class="btn sm" data-action="cx:conv-handoff" data-id="${c.id}">Alihkan ke Sales</button>` : chip('Terbuka', 'sandbox')])) +
      note('Alihkan ke Sales membuat lead di Sales B2C dengan ringkasan pesan dan asal campaign. Menekan ulang memakai lead yang sama. Balasan tidak dikirim dari preview.'));
  } else if (view === 'analytics') {
    const rows = mk().social.filter(s => s.period === period && (!platform || acc(s.account).platform === platform));
    const byPf = {};
    rows.forEach(s => { const p = acc(s.account).platform; const r = byPf[p] || (byPf[p] = { reach: 0, interactions: 0, followers: 0, net: 0, visits: 0, accounts: 0 }); r.reach += s.reach; r.interactions += s.interactions; r.followers += s.followers; r.net += s.netFollowers; r.visits += s.visits; r.accounts++; });
    const pubs = cx().publications.filter(p => p.status === 'published');
    const top = cx().content.filter(c => c.results).sort((a, b) => (b.results.bookings || 0) - (a.results.bookings || 0)).slice(0, 5);
    body = `<section class="grid g3">${Object.entries(byPf).map(([p, r]) => `<section class="card"><h2>${p}</h2><dl class="def compact"><dt>Reach</dt><dd>${num(r.reach)}</dd><dt>Interactions</dt><dd>${num(r.interactions)}</dd><dt>ER periode</dt><dd>${pct(r.interactions / r.reach, 2)}</dd><dt>Followers</dt><dd>${num(r.followers)} (net ${r.net >= 0 ? '+' : ''}${num(r.net)})</dd><dt>Kunjungan profil</dt><dd>${num(r.visits)}</dd><dt>Akun</dt><dd>${r.accounts}</dd></dl></section>`).join('')}</section>
      ${note('ER = interactions ÷ reach pada periode yang sama (tidak menjumlahkan ER harian). Reach dijumlah per platform dan tidak dianggap unik lintas platform.')}
      <div class="grid g2">${card('Top content', table(['Konten', 'Format', 'Views', 'Klik', 'Lead', 'Booking'], top.map(c => [`<a href="#studio${qs({ content: c.id, ctab: 'analytics' })}">${c.id} · ${esc(c.title)}</a>`, c.format, num(c.results.views), num(c.results.clicks), num(c.results.leads), num(c.results.bookings)])))}
      ${card('Publish vs aset', `<dl class="def compact"><dt>Publikasi terbit</dt><dd>${num(pubs.length)}</dd><dt>Aset unik di publikasi</dt><dd>${num(new Set(pubs.flatMap(p => cx().content.find(c => c.id === p.content)?.assets || [])).size)}</dd><dt>Konten unik</dt><dd>${num(new Set(pubs.map(p => p.content)).size)}</dd></dl>` + note('Konten yang terbit di beberapa platform dihitung per publish dan per aset, tidak digandakan sebagai konten.'))}</div>`;
  } else {
    const units = [...new Set(mk().accounts.map(a => a.unit))];
    body = card('Pertumbuhan per unit bisnis', table(['Unit', 'Akun', 'Followers', 'Baru', 'Net', 'Reach', 'Interactions', 'ER', 'vs bulan lalu (net)'], units.map(u => { const ids = mk().accounts.filter(a => a.unit === u).map(a => a.id); const agg = (p) => mk().social.filter(s => s.period === p && ids.includes(s.account)).reduce((a, s) => ({ f: a.f + s.followers, n: a.n + s.newFollowers, net: a.net + s.netFollowers, r: a.r + s.reach, i: a.i + s.interactions }), { f: 0, n: 0, net: 0, r: 0, i: 0 }); const c = agg(period), pv = agg(period === '2026-08' ? '2026-07' : '2026-06'); return [esc(u), ids.length, num(c.f), num(c.n), num(c.net), num(c.r), num(c.i), pct(MK.div(c.i, c.r), 2), pv.net ? pct((c.net - pv.net) / pv.net, 1) : '—']; })) + note('Unit Jaens Essence memakai akun sendiri. Data Juni tidak tersedia, sehingga pembanding Juli tampil “—”.'));
  }
  return `<div class="heading-row">${bar}</div>${tabs}${body}`;
}, () => 'Social Media');

/* ================= F2-07 Media Partner & KOL ================= */
const kolPerf = (id, period = '2026-08') => { const tx = SER.dataset(st()).tx.filter(t => t.period === period && MK.kolOf(t) === id); const paid = tx.filter(t => t.status === 'paid'); return { bookings: paid.length, revenue: paid.reduce((s, t) => s + t.amount, 0), refunds: tx.length - paid.length, sandbox: paid.filter(t => t.sandbox).length }; };
const codeStatus = (p) => !p.code ? chip('Belum ada kode', '') : p.codeValid < TODAY ? chip(`${p.code} · kedaluwarsa ${p.codeValid}`, 'bad') : chip(`${p.code} · berlaku s.d. ${p.codeValid}`, 'ready');
register('kol', (params) => {
  const view = params.id ? 'profile' : (params.view || 'directory');
  const ps = mk().partners.filter(p => (!params.type || p.type === params.type) && (!params.stage || p.stage === params.stage) && (!params.pic || p.pic === params.pic));
  const keep = { type: params.type, stage: params.stage, pic: params.pic };
  const bar = `<form id="filters" class="filters" aria-label="Filter">${hidden({ view: params.view })}${sel('type', 'Kanal', [['', 'Semua'], 'KOL', 'Media partner'], params.type)}${sel('stage', 'Status', [['', 'Semua'], ...MK.KOL_STAGES], params.stage)}${sel('pic', 'PIC', [['', 'Semua'], ...CX.PEOPLE.map(p => [p.id, p.name])], params.pic)}<button type="button" class="btn ghost" data-action="filter-reset">Reset filter</button></form>`;
  const tabs = viewTabs('kol', [['directory', 'Direktori', ps.length], ['pipeline', 'Pipeline Kolaborasi'], ['deliverables', 'Kalender Deliverables'], ['performance', 'Performance']], view === 'profile' ? '' : view, keep);
  const prof = (p) => `<a href="#kol${qs({ id: p.id })}">${p.id} · ${esc(p.name)}</a>`;
  let body = '';
  if (view === 'directory') body = card('Direktori partner', table(['Partner', 'Kanal', 'Unit', 'Audiens', 'Followers', 'Tahap', 'Fee', 'Kode', 'PIC'], ps.map(p => [prof(p), `${p.type} · ${p.channel}`, esc(p.unit), esc(p.audience), p.followers ? num(p.followers) : '—', chip(p.stage), rp(p.fee), codeStatus(p), who(p.pic)])));
  else if (view === 'pipeline') body = `<div class="board" role="list">${MK.KOL_STAGES.map(s => { const col = ps.filter(p => p.stage === s); return `<section class="board-col" role="listitem" aria-label="${s}, ${col.length}"><h3>${s} <span>${col.length}</span></h3>${col.map(p => `<article class="board-card">${prof(p)}<small>${p.type} · ${rp(p.fee)} · ${who(p.pic)}</small>${s !== 'Review' ? `<button type="button" class="btn ghost sm" data-action="cx:kol-advance" data-id="${p.id}">Lanjut ke ${MK.KOL_STAGES[MK.KOL_STAGES.indexOf(s) + 1]}</button>` : ''}</article>`).join('') || '<p class="muted small">Kosong</p>'}</section>`; }).join('')}</div>` + note('Shortlist → Brief → Proposal → Approval → Produksi → Publikasi → Review. Approval butuh fee dan term; komitmen biaya diajukan lewat MRF di Finance.');
  else if (view === 'deliverables') body = card('Deliverables', table(['Tenggat', 'Deliverable', 'Partner', 'Status', 'Post ID', 'Impr.', 'Klik', 'Aksi'], mk().deliverables.filter(d => ps.some(p => p.id === d.partner)).slice().sort((a, b) => a.due.localeCompare(b.due)).map(d => { const p = mk().partners.find(q => q.id === d.partner); return [`<span class="${d.due < TODAY && !['Terbit', 'Disetujui'].includes(d.status) ? 'bad-t' : ''}">${d.due}</span>`, `${d.id} · ${esc(d.type)}`, prof(p), chip(d.status, d.status === 'Terbit' || d.status === 'Disetujui' ? 'ready' : d.status === 'Draft' ? '' : 'sandbox'), d.postId || '—', d.impressions ? num(d.impressions) : '—', d.clicks ? num(d.clicks) : '—', d.status === 'Menunggu approval' ? `<button type="button" class="btn sm" data-action="cx:dlv-approve" data-id="${d.id}">Approve deliverable</button>` : '—']; })));
  else if (view === 'performance') {
    body = card('Performance per partner (Agustus 2026)', table(['Partner', 'Kode', 'Impr. platform', 'Klik platform', 'Booking dibayar (POS)', 'Revenue POS', 'Fee', 'Revenue ÷ fee'], mk().partners.filter(p => p.campaign).map(p => { const ds = mk().deliverables.filter(d => d.partner === p.id); const k = kolPerf(p.id); return [prof(p), codeStatus(p), num(ds.reduce((s, d) => s + d.impressions, 0)), num(ds.reduce((s, d) => s + d.clicks, 0)), `${num(k.bookings)}${k.sandbox ? ` <small class="muted">(${k.sandbox} dari sandbox)</small>` : ''}`, jt(k.revenue), rp(p.fee), x(MK.div(k.revenue, p.fee))]; })) +
      note('Impressions/klik dari platform dipisah dari booking dan revenue POS. Booking dengan kode KOL di Sales B2C (Reservasi) dan dibayar di POS hanya menambah partner pemilik kode. Kode kedaluwarsa atau tidak dikenal ditolak saat booking.'));
  } else {
    const p = mk().partners.find(q => q.id === params.id);
    if (!p) return `<a class="back" href="#kol">‹ Kembali</a><div class="card empty-state"><h2>Partner tidak ditemukan</h2></div>`;
    const k = kolPerf(p.id), ds = mk().deliverables.filter(d => d.partner === p.id);
    body = `<a class="back" href="#kol">‹ Kembali ke Direktori</a><section class="card"><div class="card-head"><h2>${p.id} · ${esc(p.name)}</h2>${chip(p.stage)}</div><div class="grid g2">
      <dl class="def"><dt>Kanal</dt><dd>${p.type} · ${esc(p.channel)}</dd><dt>Unit</dt><dd>${esc(p.unit)}</dd><dt>Audiens</dt><dd>${esc(p.audience)}</dd><dt>Brief</dt><dd>${esc(p.brief || '—')}</dd><dt>Term</dt><dd>${esc(p.term || '—')}</dd></dl>
      <dl class="def"><dt>Perjanjian</dt><dd>${esc(p.agreement || '—')}</dd><dt>Fee</dt><dd>${rp(p.fee)} · komitmen via ${link('mrf', 'MRF Finance')} (simulasi)</dd><dt>Kode tracking</dt><dd>${codeStatus(p)}</dd><dt>Campaign</dt><dd>${cmpLink(p.campaign)}</dd><dt>PIC</dt><dd>${who(p.pic)}</dd></dl></div></section>
      ${metrics([['Booking dibayar (Agu)', num(k.bookings), 'POS · kode/UTM partner'], ['Revenue POS', jt(k.revenue), `${num(k.refunds)} refund dikecualikan`], ['Deliverables', `${ds.filter(d => d.status === 'Terbit').length}/${ds.length}`, 'terbit'], ['Revenue ÷ fee', x(MK.div(k.revenue, p.fee)), 'bukan ROAS platform']])}
      <div class="grid g2">${card('Deliverables', table(['ID', 'Tipe', 'Tenggat', 'Status', 'Aset'], ds.map(d => [d.id, esc(d.type), d.due, chip(d.status), d.asset ? `<a href="#studio${qs({ view: 'library' })}">${d.asset}</a>` : '—'])))}
      ${card('Histori', `<ol class="history">${p.history.map(([s, at]) => `<li><b>${s}</b> · ${at}</li>`).join('')}</ol>`)}</div>`;
  }
  return `${view === 'profile' ? '' : `<div class="heading-row">${bar}</div>${tabs}`}${body}`;
}, () => 'Media Partner & KOL');

/* ================= F2-08 Audience & Attribution (+ F7-02 Jejak Booking) ================= */
function trace(ds, id) {
  const s = st(); const q = String(id || '').trim().toUpperCase();
  const b = s.bookings.find(k => k.id === q || k.lead === q);
  const lead = s.leads.find(l => l.id === q || (b && l.id === b.lead));
  const tx = ds.tx.find(t => t.booking === (b ? b.id : q) || t.id === q || (q && t.lead === q));
  const conv = mk().convs.find(c => c.lead && lead && c.lead === lead.id);
  const steps = [];
  const cmp = (b && b.campaign) || lead?.campaign || tx?.campaign;
  if (cmp) steps.push(['Campaign', `${cmpLink(cmp)}`]);
  if (conv) steps.push(['Percakapan', `${conv.id} · ${esc(conv.channel)} → dialihkan ke Sales`]);
  if (lead) steps.push(['Lead', `${lead.id} · sumber ${esc(lead.source)} · kontak ${esc(lead.channel)} · status ${esc(lead.status)}`]);
  if (b) steps.push(['Booking', `${b.id} · slot ${b.slot} · ${esc(b.status)}${b.kolCode ? ` · kode ${b.kolCode}` : ''}${b.partner ? ' · referral driver' : ''}`]);
  if (tx) steps.push(['Treatment', `${esc(tx.treatmentName)} · ${esc(SER.OUTLETS.find(o => o.id === tx.outlet)?.name || '')}`], ['POS', `${tx.id} · ${rp(tx.amount)} · ${tx.status === 'paid' ? 'dibayar' : 'refund (keluar dari revenue)'} · ${tx.date}`], ['Finance', tx.status === 'paid' ? `Revenue dihitung 1× · sumber ${esc(tx.source || 'Tidak diketahui')} → grup ${esc(tx.group)}${tx.commission ? ` · komisi ${rp(tx.commission)}` : ''}` : 'Refund mengikuti aturan Finance; komisi dibatalkan bila belum dibayar']);
  else if (b && b.status !== 'paid') steps.push(['POS', 'Belum dibayar · belum ada revenue']);
  return steps;
}
register('attribution', (params) => {
  const view = params.view || 'journey';
  const { f, ds, inScope } = scope(params);
  const paid = ds.tx.filter(t => inScope(t) && t.status === 'paid'), leads = ds.leads.filter(inScope);
  const rev = paid.reduce((s, t) => s + t.amount, 0);
  const unknown = paid.filter(t => t.group === 'Tidak diketahui'), unkRev = unknown.reduce((s, t) => s + t.amount, 0);
  const campRev = paid.filter(t => t.campaign).reduce((s, t) => s + t.amount, 0);
  const keep = { period: f.period, outlet: f.outlet };
  const head = metrics([['Coverage atribusi', pct(MK.div(rev - unkRev, rev), 1), 'revenue bersumber ÷ total revenue'], ['Unknown', jt(unkRev), `${num(unknown.length)} transaksi · tetap di total`], ['Revenue teratribusi campaign', jt(campRev), pct(MK.div(campRev, rev), 1) + ' dari total'], ['Model atribusi', 'v1', 'last non-direct touch · berversi']]);
  const tabs = viewTabs('attribution', [['journey', 'Channel Journey'], ['audience', 'Audience'], ['cohort', 'Conversion Cohort'], ['coverage', 'Attribution Coverage'], ['exceptions', 'Exceptions', unknown.filter(t => !mk().fixes[t.id] || mk().fixes[t.id].status === 'queued').length]], view, keep);
  let body = '';
  if (!paid.length) body = `<div class="card empty-state" role="status"><h2>Belum ada transaksi POS untuk periode ini</h2><p>${esc(SER.PERIODS.find(p => p.id === f.period)?.note || 'Pilih periode lain.')}</p></div>`;
  else if (view === 'journey') {
    const booked = leads.filter(l => l.status === 'booked');
    const steps = [['Lead (tanggal lead)', leads.length], ['Booking', booked.length], ['Treatment selesai', paid.filter(t => t.lead).length], ['Dibayar (tanggal bayar)', paid.filter(t => t.lead).length]];
    const bySrc = {}; paid.forEach(t => { const k = `${t.source || 'Tidak diketahui'}|${t.contact}|${t.confirm}`; const r = bySrc[k] || (bySrc[k] = { n: 0, rev: 0 }); r.n++; r.rev += t.amount; });
    const q = params.q || 'LEAD-001';
    const tr = trace(ds, q);
    const examples = [['LEAD-001', 'Instagram → WhatsApp → booking (sandbox)'], [ds.tx.find(t => t.method === 'B2B' && t.period === '2026-08')?.booking, 'B2B · hotel partner'], [ds.tx.find(t => t.method === 'Referral' && t.period === '2026-08')?.booking, 'Referral driver'], [ds.tx.find(t => t.status === 'refunded' && t.period === '2026-08')?.booking, 'Refund']].filter(e => e[0]);
    body = `<div class="grid g2">${card('Funnel lead → paid', steps.map(([l, v], i) => H.bar(l, `${num(v)}${i ? ' · ' + pct(MK.div(v, steps[0][1]), 1) : ''}`, MK.div(v, steps[0][1]))).join('') + note('Lead dihitung menurut tanggal lead; dibayar menurut tanggal pembayaran POS. Walk-in dan partner tanpa lead tidak masuk funnel ini.'))}
      ${card('Jejak booking (F7-02)', `<form class="inline-form" data-search="attribution">${hidden({ view: 'journey', period: f.period, outlet: f.outlet })}<label>ID lead / booking / POS<input name="q" value="${esc(q)}"></label><button class="btn sm">Telusuri</button></form>
        <p class="small">${examples.map(([id, l]) => `<a href="#attribution${qs({ ...keep, view: 'journey', q: id })}">${esc(l)}</a>`).join(' · ')}</p>
        ${tr.length ? `<ol class="history">${tr.map(([k, v]) => `<li><b>${k}</b> · ${v}</li>`).join('')}</ol>` : '<p class="muted">ID tidak ditemukan di data demo.</p>'}${note('Instagram → WhatsApp → booking web tetap satu transaksi POS dan satu revenue; touchpoint lain hanya konteks.')}`)}</div>
      ${card('Source → contact → konfirmasi → POS', table(['Sumber akuisisi', 'Kanal kontak', 'Jalur konfirmasi', 'Transaksi', 'Revenue POS', 'Porsi'], Object.entries(bySrc).sort((a, b) => b[1].rev - a[1].rev).map(([k, r]) => { const [s, c, cf] = k.split('|'); return [esc(s), esc(c), esc(cf), num(r.n), jt(r.rev), pct(r.rev / rev, 1)]; }).concat([[`<b>Total transaksi unik</b>`, '', '', `<b>${num(paid.length)}</b>`, `<b>${jt(rev)}</b>`, '100%']])))}`;
  } else if (view === 'audience') {
    const countries = {}; paid.forEach(t => { const c = ds.customers.get(t.customer)?.country || 'Tidak diketahui'; const r = countries[c] || (countries[c] = { cust: new Set(), rev: 0, byOutlet: {} }); r.cust.add(t.customer); r.rev += t.amount; r.byOutlet[t.outlet] = (r.byOutlet[t.outlet] || 0) + 1; });
    const outs = SER.OUTLETS.filter(o => paid.some(t => t.outlet === o.id));
    body = card('Segmentasi negara × outlet', table(['Negara', 'Pelanggan unik', 'Revenue POS', ...outs.map(o => esc(o.name.replace('Jaens Spa ', '')) + ' (order)')], Object.entries(countries).sort((a, b) => b[1].rev - a[1].rev).map(([c, r]) => [esc(c), num(r.cust.size), jt(r.rev), ...outs.map(o => num(r.byOutlet[o.id] || 0))]))) + note('Pelanggan unik dihitung per ID pelanggan di periode terpilih; “Tidak diketahui” tetap ditampilkan.');
  } else if (view === 'cohort') {
    const rows = ['2026-07', '2026-08'].map(p => { const ls = ds.leads.filter(l => l.period === p && SER.outletIds(f.outlet).includes(l.outlet)); const bk = ls.filter(l => l.status === 'booked'); const pd = ds.tx.filter(t => t.status === 'paid' && bk.some(l => l.booking === t.booking)); return [p, num(ls.length), num(bk.length), pct(MK.div(bk.length, ls.length), 1), num(pd.length), jt(pd.reduce((s, t) => s + t.amount, 0)), [...new Set(pd.map(t => t.period))].join(', ') || '—']; });
    body = card('Cohort menurut bulan lead', table(['Cohort (tanggal lead)', 'Lead', 'Booking', 'Lead → booking', 'Dibayar', 'Revenue POS', 'Bulan pembayaran'], rows)) + note('Mode cohort mengikuti tanggal lead. Mode aktivitas periode (Executive Summary) mengikuti tanggal pembayaran, sehingga angkanya bisa berbeda.');
  } else if (view === 'coverage') {
    body = card('Coverage per grup kanal', table(['Grup', 'Transaksi', 'Revenue POS', 'Porsi', 'Ber-campaign'], SER.GROUPS.map(g => { const r = paid.filter(t => t.group === g); const v = r.reduce((s, t) => s + t.amount, 0); return [esc(g), num(r.length), jt(v), pct(MK.div(v, rev), 1), num(r.filter(t => t.campaign).length)]; }).concat([['<b>Total</b>', `<b>${num(paid.length)}</b>`, `<b>${jt(rev)}</b>`, '100%', '']]))) + note('Unknown tetap ada di total. Koreksi di antrean Exceptions dicatat terpisah dan baru mengubah laporan setelah review Finance.');
  } else {
    const fx = mk().fixes;
    body = card('Transaksi tanpa sumber', table(['POS', 'Tanggal', 'Outlet', 'Revenue', 'Kontak', 'Status', 'Aksi'], unknown.slice(0, 25).map(t => { const s = fx[t.id]; return [t.id, t.date, esc(SER.OUTLETS.find(o => o.id === t.outlet)?.name.replace('Jaens Spa ', '') || ''), rp(t.amount), esc(t.contact), s ? chip(s.status === 'queued' ? 'Antrean perbaikan' : `Dikoreksi → ${s.source}`, s.status === 'queued' ? 'sandbox' : 'ready') : chip('Belum ditinjau', 'bad'),
      !s ? `<button type="button" class="btn ghost sm" data-action="cx:exc-queue" data-id="${t.id}">Masukkan antrean</button>` : s.status === 'queued' ? `<form class="inline-form" data-submit="cx:exc-correct">${hidden({ id: t.id })}${sel('source', '<span class="sr">Sumber</span>', ['Walk-in', 'Repeat / Direct', 'Website / SEO', 'Organic Social'], 'Walk-in')}<label class="sr" for="ev-${t.id}">Bukti</label><input id="ev-${t.id}" name="evidence" required minlength="5" placeholder="Bukti (mis. catatan front desk)"><button class="btn ghost sm">Koreksi</button></form>` : `<small>${esc(s.evidence)}</small>`]; })) + note(`Menampilkan ${Math.min(25, unknown.length)} dari ${num(unknown.length)} transaksi. Setiap koreksi menyimpan bukti dan histori; total revenue tidak berubah.`));
  }
  return `<div class="heading-row">${H.filterBar(f, params, hidden({ view }))}</div>${head}${tabs}${body}`;
}, () => 'Audience & Attribution');

/* ================= F2-10 AI Marketing Mentor (aturan deterministik, berlabel simulasi) ================= */
function mentorInsights() {
  const ds = SER.dataset(st());
  const ads = MK.adsView(ds, '2026-08');
  const out = [];
  const paidRev = ds.tx.filter(t => t.period === '2026-08' && t.status === 'paid' && t.group === 'Paid');
  const paidCov = MK.div(paidRev.filter(t => t.campaign).reduce((s, t) => s + t.amount, 0), paidRev.reduce((s, t) => s + t.amount, 0));
  const unm = mk().utm.filter(u => u.status === 'unmapped');
  if (unm.length || (paidCov !== null && paidCov < 0.9)) out.push({ id: 'INS-MKT-01', domain: 'Marketing', finding: unm.length ? `${unm.length} UTM belum ter-mapping; spend ${rp(ads.filter(r => !r.campaign).reduce((a, r) => a + r.spend, 0))} belum masuk campaign mana pun.` : `${pct(1 - (paidCov || 0), 1)} revenue Paid tanpa campaign.`, scope: 'Semua outlet', period: 'Agu 2026', evidence: ['digital?view=quality', 'Data Quality'], quality: 'Snapshot Meta & Google lengkap; TikTok belum diimpor', hypo: 'Iklan boost tanpa UTM membuat atribusi paid rendah.', action: 'Verifikasi mapping UTM sebelum menilai ROAS per campaign.', metric: 'Coverage campaign pada revenue Paid', review: '2026-08-29', pic: 'MBR-C02', type: 'task' });
  const noLead = ads.filter(r => r.spend > 0 && !r.platformConv && r.campaign);
  noLead.forEach(r => out.push({ id: 'INS-MKT-02-' + r.campaign.slice(4), domain: 'Marketing', finding: `${r.campaign} spend ${rp(r.spend)} tanpa konversi platform.`, scope: cx().campaigns.find(k => k.id === r.campaign)?.name || r.campaign, period: 'Agu 2026', evidence: ['digital?view=ads&campaign=' + r.campaign, 'Paid Ads'], quality: 'Konversi platform belum terpasang', hypo: 'Pixel/event TikTok belum terpasang atau creative tidak relevan.', action: 'Uji CTA WhatsApp di creative TikTok dan cek event konversi.', metric: 'Lead per Rp1 jt spend', review: '2026-09-05', pic: 'MBR-C05', type: 'experiment', baseline: 0, variant: 'CTA WhatsApp di caption + pin komentar' }));
  const kolExp = mk().partners.filter(p => p.code && p.codeValid < CX.TODAY);
  kolExp.forEach(p => out.push({ id: 'INS-MKT-03-' + p.id.slice(4), domain: 'Marketing', finding: `Kode ${p.code} kedaluwarsa ${p.codeValid}; booking dengan kode ini ditolak.`, scope: p.name, period: 'Agu 2026', evidence: ['kol?id=' + p.id, 'Profil partner'], quality: 'Lengkap', hypo: 'Audiens masih memakai kode lama dari konten yang terbit.', action: 'Putuskan perpanjangan kode atau tambahkan pesan kode baru di bio kreator.', metric: 'Booking dibayar per partner', review: '2026-08-27', pic: 'MBR-C05', type: 'task' }));
  const er = (acc) => { const s = mk().social.find(x => x.period === '2026-08' && x.account === acc), p = mk().social.find(x => x.period === '2026-07' && x.account === acc); return [s.interactions / s.reach, p.interactions / p.reach]; };
  const [e8, e7] = er('ACC-01');
  out.push({ id: 'INS-KOM-01', domain: 'Komunikasi', finding: `ER @jaensspa ${pct(e8, 2)} (Juli ${pct(e7, 2)}).`, scope: 'Instagram @jaensspa', period: 'Agu vs Jul 2026', evidence: ['social?view=analytics', 'Social Analytics'], quality: 'Snapshot demo', hypo: e8 >= e7 ? 'Reels treatment showcase menaikkan interaksi.' : 'Frekuensi posting turun.', action: 'Pertahankan 2 Reels treatment per minggu; ukur ulang ER akhir bulan.', metric: 'ER periode (interactions ÷ reach)', review: '2026-08-31', pic: 'MBR-C01', type: 'task' });
  const brands = cx().brands.map(b => ({ b, p: CX.brandProgress(b) })).filter(x => x.p.ratio !== null && x.p.ratio < 0.8);
  brands.forEach(({ b, p }) => out.push({ id: 'INS-BRD-' + b.id.slice(3), domain: 'Branding', finding: `${b.name} brand foundation ${pct(p.ratio, 0)}; belum: ${p.pending.slice(0, 3).join(', ')}.`, scope: b.name, period: 'Per 22 Agu 2026', evidence: ['brand?open=' + b.id, 'Checklist brand'], quality: 'Lengkap', hypo: 'Elemen yang belum disetujui memperlambat produksi konten.', action: `Jadwalkan review ${p.pending[0] || 'elemen'} dengan Brand Designer.`, metric: 'Progress brand foundation', review: '2026-09-02', pic: 'MBR-C01', type: 'task' }));
  const handoff = mk().convs.filter(cv => cv.category === 'Reservasi' && !cv.lead);
  out.push({ id: 'INS-SLS-01', domain: 'Sales Handoff', finding: handoff.length ? `${handoff.length} DM reservasi belum dialihkan ke Sales.` : 'Semua DM reservasi sudah dialihkan ke Sales.', scope: 'Inbox sosial', period: 'Hari ini (demo)', evidence: ['social?view=inbox', 'Inbox'], quality: 'Lengkap', hypo: 'DM tertahan di tim konten tanpa SLA.', action: 'Tetapkan SLA 15 menit untuk alih DM reservasi ke Sales.', metric: 'Waktu alih DM → lead', review: '2026-08-29', pic: 'MBR-S01', type: 'task' });
  if (!out.some(i => i.domain === 'Marketing')) out.push({ id: 'INS-GAP', domain: 'Marketing', finding: 'Bukti belum cukup untuk usulan marketing.', scope: '—', period: '—', evidence: ['digital', 'Digital Marketing'], quality: 'Gap', hypo: '—', action: 'Lengkapi snapshot dan mapping.', metric: '—', review: '—', pic: 'MBR-C02', type: 'task' });
  return out;
}
const ASK = {
  'romi': () => { const c = SER.summary(st(), '2026-08', 'all').cur; return `ROMI kontribusi Agustus ${x(c.romi)}; ROMI warisan SER (revenue ÷ biaya) ${x(c.romiLegacy)}. Sumber: Executive Summary, definisi “romi”.`; },
  'coverage': () => { const c = SER.summary(st(), '2026-08', 'all').cur; return `Coverage atribusi Agustus ${pct(c.coverage, 1)} (revenue bersumber ÷ total revenue). Unknown tetap dihitung di total.`; },
  'cpl': () => { const a = MK.adsView(SER.dataset(st()), '2026-08'); const sp = a.reduce((s, r) => s + r.spend, 0), l = a.reduce((s, r) => s + r.leads, 0); return `CPL paid Agustus ${rp(l ? sp / l : null)} dari spend snapshot ${rp(sp)} dan ${num(l)} lead.`; },
  'target': () => { const c = SER.summary(st(), '2026-08', 'all').cur; return `Revenue Target Attainment Agustus ${pct(c.etr, 1)}: ${jt(c.revenue)} dari target ${jt(c.target)}.`; }
};
const ASK_LABEL = { romi: 'Berapa ROMI Agustus?', coverage: 'Berapa coverage atribusi?', cpl: 'Berapa CPL iklan Agustus?', target: 'Apakah target revenue tercapai?' };
register('mentor', (params) => {
  const view = params.view || 'brief', domain = params.domain || '';
  const ins = mentorInsights().filter(i => !domain || i.domain === domain);
  const dec2 = mk().mentor;
  const keep = { domain };
  const tabs = viewTabs('mentor', [['brief', 'Brief Harian', ins.length], ['ask', 'Tanyakan Data'], ['experiments', 'Usulan Eksperimen'], ['followup', 'Follow-up']], view, keep);
  const dtabs = `<nav class="tabs" aria-label="Domain">${[['', 'Semua'], ['Komunikasi', 'Komunikasi'], ['Branding', 'Branding'], ['Marketing', 'Marketing'], ['Sales Handoff', 'Sales Handoff']].map(([k, l]) => `<a class="tab${k === domain ? ' on' : ''}" href="#mentor${qs({ view, domain: k })}">${l}</a>`).join('')}</nav>`;
  const banner = `<p class="phase-banner">${sim} Aturan deterministik atas metric registry demo, bukan model AI. Mentor tidak mengubah budget, tidak menyetujui pembayaran dan tidak memposting transaksi.</p>`;
  const insCard = (i) => { const d = dec2[i.id] || {}; const act = d.action || i.action; return `<article class="card"><div class="card-head"><h3>${i.id} · ${esc(i.domain)}</h3>${d.status ? chip({ accepted: 'Diterima → ' + d.task, rejected: 'Ditolak', edited: 'Diubah v' + d.version }[d.status], d.status === 'accepted' ? 'ready' : d.status === 'rejected' ? 'bad' : 'sandbox') : chip('Usulan', 'sandbox')}</div>
    <p><b>${esc(i.finding)}</b></p><dl class="def compact"><dt>Scope</dt><dd>${esc(i.scope)}</dd><dt>Periode</dt><dd>${esc(i.period)}</dd><dt>Bukti</dt><dd><a href="#${i.evidence[0]}">${esc(i.evidence[1])} ›</a></dd><dt>Kualitas data</dt><dd>${esc(i.quality)}</dd><dt>Hipotesis</dt><dd><i>${esc(i.hypo)}</i></dd><dt>Tindakan</dt><dd>${esc(act)}</dd><dt>Metrik evaluasi</dt><dd>${esc(i.metric)}</dd><dt>Review</dt><dd>${i.review} · PIC ${who(i.pic)}</dd>${d.reason ? `<dt>Alasan tolak</dt><dd>${esc(d.reason)}</dd>` : ''}</dl>
    ${d.status === 'accepted' ? '' : `<div class="actions"><button type="button" class="btn sm" data-action="cx:mentor-accept" data-id="${i.id}" data-text="${esc(act)}" data-pic="${i.pic}" data-due="${i.review}" data-metric="${esc(i.metric)}">Terima → buat tugas</button></div>
    <details><summary class="small">Ubah atau tolak</summary><form class="inline-form" data-submit="cx:mentor-edit">${hidden({ id: i.id })}<label>Usulan baru<input name="action" required minlength="5" value="${esc(act)}"></label><button class="btn ghost sm">Simpan versi</button></form><form class="inline-form" data-submit="cx:mentor-reject">${hidden({ id: i.id })}<label>Alasan tolak<input name="reason" required minlength="5"></label><button class="btn ghost sm">Tolak</button></form></details>`}</article>`; };
  let body = '';
  if (view === 'brief') body = dtabs + `<div class="grid g2">${ins.map(insCard).join('') || '<div class="card empty-state"><h2>Tidak ada usulan untuk domain ini</h2></div>'}</div>`;
  else if (view === 'ask') {
    const q = params.q || '';
    const ans = ASK[q] ? ASK[q]() : q ? null : '';
    body = card('Tanyakan Data ' + sim, `<form class="inline-form" data-search="mentor">${hidden({ view: 'ask' })}${sel('q', 'Pertanyaan', [['', 'Pilih pertanyaan…'], ...Object.entries(ASK_LABEL)], q)}<button class="btn sm">Tanya</button></form>` +
      (ans ? `<p><b>${esc(ASK_LABEL[q])}</b><br>${ans}</p>` : ans === null ? '<p class="warn-t">Gap: pertanyaan di luar metric registry demo. Tidak ada jawaban yang dikarang.</p>' : note('Jawaban dihitung dari metric registry yang sama dengan Executive Summary dan Digital Marketing.')));
  } else if (view === 'experiments') {
    const ex = ins.filter(i => i.type === 'experiment');
    body = card('Usulan eksperimen', ex.length ? table(['Insight', 'Hipotesis', 'Varian', 'Metrik', 'Aksi'], ex.map(i => { const made = mk().experiments.find(e => e.key === 'mentor-' + i.id); return [`${i.id} · ${esc(i.scope)}`, `<i>${esc(i.hypo)}</i>`, esc(i.variant), esc(i.metric), made ? `<a href="#digital${qs({ view: 'experiments' })}">${made.id}</a>` : `<form class="inline-form" data-submit="cx:exp-create">${hidden({ key: 'mentor-' + i.id, title: i.action.slice(0, 60), campaign: (i.evidence[0].match(/CMP-\d+/) || [''])[0], metric: i.metric, baseline: i.baseline, variant: i.variant, window: '14 hari', pic: i.pic, source: 'AI Mentor' })}<button class="btn sm">Buat eksperimen</button></form>`]; })) : '<p class="muted">Belum ada usulan eksperimen dari data saat ini.</p>');
  } else {
    body = card('Follow-up eksperimen', table(['Eksperimen', 'Baseline', 'Hasil', 'Selisih', 'Keputusan'], mk().experiments.map(e => [`${e.id} · ${esc(e.title)}`, pct(e.baseline, 1), e.result === null ? '<span class="muted">berjalan</span>' : pct(e.result, 1), e.result === null ? '—' : `${e.result >= e.baseline ? '+' : ''}${num((e.result - e.baseline) * 100, 1)} poin`, e.decision ? chip(e.decision, e.decision === 'Henti' ? 'bad' : 'ready') : `<a href="#digital${qs({ view: 'experiments' })}">Catat hasil ›</a>`])) +
      `<h3>Tugas dari Mentor</h3>` + table(['Tugas', 'Tindakan', 'PIC', 'Tenggat', 'Status'], cx().tasks.filter(t => t.type === 'mentor').map(t => [t.id, esc(t.action), who(t.pic), t.due, chip(t.status === 'done' ? 'Selesai' : 'Direncanakan', t.status === 'done' ? 'ready' : 'sandbox')])));
  }
  return banner + tabs + body;
}, () => 'AI Marketing Mentor');
})();
