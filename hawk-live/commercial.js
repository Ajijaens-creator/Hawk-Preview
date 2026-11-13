/* HAWK ERP · Commercial workspace screens, Fase 2A (DATA DEMO / SIMULASI)
   F2-09 Commercial Budget · F2-02 Campaign Planner · F2-03 Campaign Detail · F2-04 Content Studio ·
   F2-01 Brand & Communications. Reads SER (POS/lead/budget fixture), HAWK sandbox (MRF) and CX
   (commercial records). Every number comes from those sources; nothing is typed in as a result. */
(() => {
const H = window.HL;
const { esc, num, rp, jt, pct, link, table, card, metrics, qs } = H;
const st = () => H.state;
const cx = () => CX.ensure(H.state);
const who = (id) => esc(CX.personName(id));
const chip = (text, tone = '') => `<span class="status-chip ${tone}">${esc(text)}</span>`;
const sel = (name, label, options, value, extra = '') => `<label>${label} <select name="${name}" ${extra}>${options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value ?? '') ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select></label>`;
const hidden = (obj) => Object.entries(obj).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `<input type="hidden" name="${k}" value="${esc(v)}">`).join('');
const toolbar = (fields, keep = {}, label = 'Filter') => `<form id="filters" class="filters" aria-label="${label}">${hidden(keep)}${fields.join('')}<button type="button" class="btn ghost" data-action="filter-reset">Reset filter</button></form>`;
const viewTabs = (route, views, current, keep) => `<nav class="tabs" aria-label="Tampilan">${views.map(([k, l, n]) => `<a class="tab${k === current ? ' on' : ''}" href="#${route}${qs({ ...keep, view: k })}" ${k === current ? 'aria-current="page"' : ''}>${l}${n !== undefined ? ` <span class="c">${n}</span>` : ''}</a>`).join('')}</nav>`;
const outlets = () => SER.OUTLETS.map(o => [o.id, o.name]);
const shortOutlet = (id) => esc((SER.OUTLETS.find(o => o.id === id)?.name || id).replace('Jaens Spa ', ''));
const dayDiff = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5);
const TODAY = CX.TODAY;
const register = (id, fn, title) => { H.REGISTRY[id] = fn; if (title) fn.title = title; };

/* ================= F2-09 Commercial Budget ================= */
register('commercial-budget', (params) => {
  const f = H.filtersOf(params), view = params.view || 'overview';
  const S = SER.summary(st(), f.period, f.outlet), c = S.cur;
  const keep = { period: f.period, outlet: f.outlet };
  const reqs = st().requests;
  const pending = reqs.filter(r => r.status === 'submitted').reduce((s, r) => s + r.amount, 0);
  const lines = c.lines.map(b => ({ ...b, sisa: b.pagu - b.committed - b.actual, cmp: cx().campaigns.find(x => x.id === b.campaign) }));
  const head = `<div class="heading-row">${H.filterBar(f, params, hidden({ view }))}</div>${H.activeFilters(f)}`;
  const tabs = viewTabs('commercial-budget', [['overview', 'Overview'], ['campaign', 'Campaign Budget'], ['requests', 'Pengajuan', reqs.filter(r => r.status === 'submitted').length], ['timeline', 'Approval Timeline'], ['recon', 'Rekonsiliasi']], view, keep);
  const kpis = metrics([['Pagu', jt(c.pagu), `${num(lines.length)} baris budget · Budget 7P Promotion`], ['Komitmen terbuka', jt(c.committed), 'MRF disetujui, belum diposting'], ['Aktual', jt(c.actual), `${pct(c.realization)} dari pagu`], ['Sisa tersedia', jt(c.remaining), `pagu − komitmen − aktual · ${rp(pending)} menunggu approval`]]);
  if (!c.lines.length) return head + tabs + kpis + `<div class="card empty-state" role="status"><h2>Belum ada baris budget</h2><p>${esc(S.periodInfo?.note || 'Finance belum menerbitkan pagu untuk filter ini.')}</p></div>`;
  let body = '';
  if (view === 'overview') {
    const types = [['ads', 'Promotion · Iklan digital'], ['kol', 'Promotion · KOL & media partner'], ['brand', 'Promotion · Brand & materi cetak']];
    body = `<div class="grid g2">${card('Per pos 7P', table(['Pos 7P', 'Pagu', 'Komitmen', 'Aktual', 'Sisa', 'Realisasi'], types.map(([t, l]) => { const r = lines.filter(b => b.type === t); const pg = r.reduce((s, b) => s + b.pagu, 0), cm = r.reduce((s, b) => s + b.committed, 0), ac = r.reduce((s, b) => s + b.actual, 0); return [l, jt(pg), jt(cm), jt(ac), jt(pg - cm - ac), pct(SER.div(ac, pg))]; })))}
    ${card('Sisa per outlet', table(['Outlet', 'Pagu', 'Aktual', 'Sisa tersedia', 'Sisa historis SER'], c.ids.map(id => { const s = SER.slice(S.ds, f.period, id); return [esc(H.outletName(id)), jt(s.pagu), jt(s.actual), jt(s.remaining), jt(s.pagu - s.actual)]; })) + '<p class="muted small">Sisa historis SER = pagu − aktual. HAWK memakai sisa tersedia yang juga mengurangi komitmen terbuka.</p>')}</div>` +
      card('Per campaign', table(['Campaign', 'Baris budget', 'Pagu', 'Komitmen', 'Aktual', 'Sisa', 'Status campaign'], lines.map(b => [b.campaign ? `<a href="#campaign-detail${qs({ id: b.campaign })}">${esc(H.campaignName(b.campaign))}</a>` : '<span class="muted">Tanpa campaign</span>', `${b.id}<br><small>${esc(b.name)}</small>`, rp(b.pagu), rp(b.committed), rp(b.actual), rp(b.sisa), b.cmp ? chip(b.cmp.status) : '—'])));
  } else if (view === 'campaign') {
    body = card('Rencana campaign vs baris budget Finance', table(['Campaign', 'Status', 'Rencana biaya', 'Baris budget', 'Pagu baris', 'Aktual', 'Selisih rencana'], cx().campaigns.map(cp => { const ls = S.ds.budgetLines.filter(b => b.campaign === cp.id && b.period === f.period && (f.outlet === 'all' || c.ids.includes(b.outlet))); const pg = ls.reduce((s, b) => s + b.pagu, 0), ac = ls.reduce((s, b) => s + (b.actual || 0), 0); return [`<a href="#campaign-detail${qs({ id: cp.id })}">${cp.id} · ${esc(cp.name)}</a>`, chip(cp.status), rp(cp.budgetPlan), ls.length ? ls.map(b => b.id).join('<br>') : '<span class="muted">Belum ada baris</span>', ls.length ? rp(pg) : '—', ls.length ? rp(ac) : '—', ls.length ? rp(pg - cp.budgetPlan) : '—']; })) + '<p class="muted small">Baris budget, MRF, dan posting berasal dari Finance. Commercial membaca status tanpa menyalin ledger.</p>');
  } else if (view === 'requests') {
    const t = HAWK.totals(st());
    body = `<div class="grid g2">${card('Buat pengajuan dari campaign', `<form class="workflow-form" data-submit="request">
      ${sel('campaign', 'Campaign', [['CMP-001', 'CMP-001 · Wellness Escape (BGL-UBD-2608-01)']], 'CMP-001')}
      ${sel('pos', 'Pos 7P', [['Promotion', 'Promotion · iklan digital'], ['Promotion · KOL', 'Promotion · KOL'], ['Promotion · Brand', 'Promotion · materi cetak']], 'Promotion')}
      <label>Nominal (Rp)<input name="amount" type="number" min="1" step="1" required value="2000000"></label>
      <label>Bukti / catatan<input name="note" maxlength="120" placeholder="mis. invoice Meta Ads Agustus"></label>
      <button class="btn">Kirim ke Finance</button></form>
      <p class="muted small">Sisa tersedia baris CMP-001: <b>${rp(t.remaining)}</b>. Finance memeriksa pagu saat approval; pengajuan melebihi sisa akan ditolak sistem. Baris campaign lain dikelola Finance (baca saja di demo ini).</p>`)}
      ${card('Status pengajuan', H.table(['MRF', 'Campaign', 'Pos', 'Nominal', 'Status', 'Catatan'], reqs.slice().reverse().map(r => [r.id, r.campaign, esc(r.pos || 'Promotion'), rp(r.amount), chip(({ submitted: 'Menunggu Finance', approved: 'Disetujui · komitmen', posted: 'Diposting', rejected: 'Ditolak' })[r.status], r.status === 'rejected' ? 'bad' : r.status === 'posted' ? 'ready' : 'sandbox'), esc(r.reason || r.note || '—')])) + `<p class="small">${link('mrf', 'Buka antrean approval di Finance ›')}</p>`)}</div>`;
  } else if (view === 'timeline') {
    body = card('Approval timeline', reqs.slice().reverse().map(r => `<div class="timeline"><b>${r.id} · ${rp(r.amount)} · ${esc(r.campaign)}</b><ol>${(r.history || [{ status: r.status, at: '—' }]).map(x => `<li><span class="status-chip ${x.status === 'rejected' ? 'bad' : x.status === 'posted' ? 'ready' : 'sandbox'}">${({ submitted: 'Diajukan', approved: 'Disetujui Finance', posted: 'Diposting', rejected: 'Ditolak' })[x.status] || x.status}</span> ${x.at}${x.ref ? ` · posting ${x.ref}` : ''}${x.reason ? ` · ${esc(x.reason)}` : ''}</li>`).join('')}</ol></div>`).join(''));
  } else {
    body = card('Rekonsiliasi baris budget ↔ MRF ↔ posting', table(['Baris budget', 'Referensi MRF', 'Komitmen', 'Aktual ledger', 'Spend platform (demo)', 'Selisih', 'Status'], lines.map(b => { const plat = b.type === 'ads' ? Math.round((b.actual || 0) * (b.id.endsWith('02') ? 1.012 : 1)) : null; const diff = plat === null ? null : plat - b.actual; return [`${b.id}<br><small>${esc(b.name)}</small>`, esc(b.mrf), rp(b.committed), rp(b.actual), plat === null ? '—' : rp(plat), diff === null ? '—' : rp(diff), diff ? chip('Perlu cek invoice', 'sandbox') : chip('Cocok', 'ready')]; })) + '<p class="muted small">Posting memindahkan komitmen ke aktual dalam satu operasi; MRF yang sama tidak bisa diposting dua kali. Selisih spend platform vs ledger (kurs, pajak, invoice) menjadi tugas Finance.</p>');
  }
  return head + tabs + kpis + body;
}, () => 'Commercial Budget');

/* ================= campaign helpers ================= */
function campaignActuals(id, period = '2026-08') {
  const ds = SER.dataset(st());
  const paid = ds.tx.filter(x => x.campaign === id && x.period === period && x.status === 'paid');
  const leads = ds.leads.filter(l => l.campaign === id && l.period === period);
  const booked = leads.filter(l => l.status === 'booked');
  return { leads: leads.length, booked: booked.length, paid: paid.length, revenue: paid.reduce((s, x) => s + x.amount, 0), refunds: ds.tx.filter(x => x.campaign === id && x.period === period && x.status === 'refunded').length };
}
const CMP_ACTIONS = { Draft: [['cmp-approve', 'Setujui']], Approved: [['cmp-schedule', 'Jadwalkan']], Scheduled: [['cmp-run', 'Jalankan']], Running: [['cmp-pause', 'Pause'], ['cmp-close', 'Tutup']], Paused: [['cmp-resume', 'Lanjutkan'], ['cmp-close', 'Tutup']], Closed: [] };
const cmpTone = (s) => ({ Running: 'ready', Draft: 'sandbox', Paused: 'bad', Closed: 'planned' })[s] || '';
function cmpActions(cp) {
  return CMP_ACTIONS[cp.status].map(([a, l]) => ['cmp-pause', 'cmp-close'].includes(a)
    ? `<form class="inline-form" data-submit="cx:${a}">${hidden({ id: cp.id })}<label class="sr" for="${a}-${cp.id}">${a === 'cmp-pause' ? 'Alasan pause' : 'Retrospektif'}</label><input id="${a}-${cp.id}" name="note" required minlength="5" placeholder="${a === 'cmp-pause' ? 'Alasan pause' : 'Retrospektif singkat'}"><button class="btn ghost sm">${l}</button></form>`
    : `<button type="button" class="btn sm" data-action="cx:${a}" data-id="${cp.id}">${l}</button>`).join(' ');
}
function campaignFilter(params) {
  return cx().campaigns.filter(c => (!params.outlet || c.outlets.includes(params.outlet)) && (!params.channel || c.channels.includes(params.channel)) && (!params.pic || c.pic === params.pic) && (!params.status || c.status === params.status));
}
const contentOf = (id) => cx().content.filter(c => c.campaign === id);

/* ================= F2-02 Campaign Planner ================= */
register('campaign', (params) => {
  const view = params.view || 'overview';
  const list = campaignFilter(params);
  const keep = { outlet: params.outlet, channel: params.channel, pic: params.pic, status: params.status };
  const channels = [...new Set(cx().campaigns.flatMap(c => c.channels))];
  const bar = toolbar([sel('outlet', 'Outlet', [['', 'Semua outlet'], ...outlets()], params.outlet), sel('channel', 'Channel', [['', 'Semua channel'], ...channels], params.channel), sel('pic', 'PIC', [['', 'Semua PIC'], ...CX.PEOPLE.filter(p => p.id.startsWith('MBR-C')).map(p => [p.id, p.name])], params.pic), sel('status', 'Status', [['', 'Semua status'], ...CX.CAMPAIGN_FLOW], params.status)], { view });
  const tabs = viewTabs('campaign', [['overview', 'Overview'], ['board', 'Board'], ['calendar', 'Calendar'], ['list', 'List', list.length], ['templates', 'Templates']], view, keep);
  const k = metrics([['Running', num(list.filter(c => c.status === 'Running').length), 'campaign aktif'], ['Menunggu approval', num(list.filter(c => c.status === 'Draft').length), 'status Draft'], ['Paused', num(list.filter(c => c.status === 'Paused').length), 'dengan alasan tercatat'], ['Rencana biaya', jt(list.reduce((s, c) => s + c.budgetPlan, 0)), 'Σ rencana campaign terfilter']]);
  const cardOf = (cp) => { const a = campaignActuals(cp.id); const cn = contentOf(cp.id); const pub = cn.filter(x => ['Published', 'Analysed'].includes(x.stage)).length; return `<article class="card cmp-card"><div class="card-head"><h3><a href="#campaign-detail${qs({ id: cp.id })}">${cp.id} · ${esc(cp.name)}</a></h3>${chip(cp.status, cmpTone(cp.status))}</div><p class="small">${esc(cp.objective)}</p><dl class="def compact"><dt>Periode</dt><dd>${cp.start} – ${cp.end}</dd><dt>Outlet</dt><dd>${cp.outlets.map(shortOutlet).join(', ')}</dd><dt>Budget</dt><dd>${rp(cp.budgetPlan)}</dd><dt>Booking Agu</dt><dd>${num(a.paid)} / target ${num(cp.target.bookings)}</dd><dt>Konten</dt><dd>${pub}/${cn.length} terbit</dd><dt>PIC</dt><dd>${who(cp.pic)}</dd></dl><div class="meter" aria-hidden="true"><span style="width:${Math.min(100, cp.target.bookings ? a.paid / cp.target.bookings * 100 : 0)}%"></span></div><div class="actions">${cmpActions(cp)}</div></article>`; };
  let body = '';
  if (!list.length) body = `<div class="card empty-state" role="status"><h2>Tidak ada campaign untuk filter ini</h2><p>Ubah filter atau buat campaign dari Templates.</p></div>`;
  else if (view === 'overview') body = `<div class="grid g3 cmp-grid">${list.map(cardOf).join('')}</div>`;
  else if (view === 'board') body = `<div class="board" role="list">${CX.CAMPAIGN_FLOW.map(s => { const col = list.filter(c => c.status === s); return `<section class="board-col" role="listitem" aria-label="${s}, ${col.length} campaign"><h3>${s} <span class="c">${col.length}</span></h3>${col.map(cp => `<article class="board-card"><a href="#campaign-detail${qs({ id: cp.id })}"><b>${cp.id}</b> ${esc(cp.name)}</a><small>${cp.start} – ${cp.end} · ${who(cp.pic)}</small><small>${esc(cp.channels.join(', '))}</small><div class="actions">${cmpActions(cp)}</div></article>`).join('') || '<p class="muted small">Kosong</p>'}</section>`; }).join('')}</div>`;
  else if (view === 'calendar') {
    const start = new Date('2026-07-01'), end = new Date('2026-09-30'), span = (end - start) / 864e5;
    const pos = (d) => Math.max(0, Math.min(100, (new Date(d) - start) / 864e5 / span * 100));
    body = card('Kalender campaign · Jul–Sep 2026', `<div class="gantt"><div class="gantt-head"><span></span><div class="gantt-scale"><span>Juli</span><span>Agustus</span><span>September</span></div></div>${list.map(cp => `<div class="gantt-row"><a href="#campaign-detail${qs({ id: cp.id })}">${cp.id} · ${esc(cp.name)}</a><div class="gantt-track"><span class="gantt-bar ${cmpTone(cp.status)}" style="left:${pos(cp.start)}%;width:${Math.max(1.5, pos(cp.end) - pos(cp.start))}%" title="${cp.start} – ${cp.end}">${esc(cp.status)}</span><i class="gantt-today" style="left:${pos(TODAY)}%" title="Hari ini (demo) ${TODAY}"></i></div></div>`).join('')}</div><p class="muted small">Garis tipis = hari ini (demo ${TODAY}). Campaign always-on dipotong ke rentang kalender.</p>`);
  } else if (view === 'list') body = card('Daftar campaign', table(['ID', 'Campaign', 'Outlet', 'Channel', 'PIC', 'Status', 'Periode', 'Rencana biaya', 'Booking Agu / target', 'UTM'], list.map(cp => { const a = campaignActuals(cp.id); return [`<a href="#campaign-detail${qs({ id: cp.id })}">${cp.id}</a>`, esc(cp.name), cp.outlets.map(shortOutlet).join(', '), esc(cp.channels.join(', ')), who(cp.pic), chip(cp.status, cmpTone(cp.status)), `${cp.start} – ${cp.end}`, rp(cp.budgetPlan), `${num(a.paid)} / ${num(cp.target.bookings)}`, `<code>${esc(cp.utm)}</code>`]; })));
  else body = `<div class="grid g2">${card('Template campaign', table(['Template', 'Tujuan', 'Channel', 'Durasi', 'Window atribusi'], CX.TEMPLATES.map(t => [`<b>${t.id}</b> ${esc(t.name)}`, esc(t.objective), esc(t.channels.join(', ')), `${t.days} hari`, `${t.window} hari`])))}
    ${card('Buat campaign dari brief', `<form class="workflow-form stack-form" data-submit="cx:cmp-create" data-after="campaign-detail?id={id}">
      ${sel('template', 'Template', CX.TEMPLATES.map(t => [t.id, t.name]), 'TPL-01')}
      <label>Nama campaign<input name="name" required minlength="4" placeholder="mis. Shanti Morning Ritual"></label>
      <label>Tujuan<input name="objective" placeholder="Kosongkan untuk memakai tujuan template"></label>
      ${sel('outlet', 'Outlet', outlets(), 'OUT-SHT')}
      <label>Mulai<input name="start" type="date" value="2026-09-01"></label><label>Selesai<input name="end" type="date" value="2026-09-30"></label>
      <label>Kode UTM<input name="utm" required placeholder="cmp_shanti_morning"></label>
      <label>Rencana biaya (Rp)<input name="budget" type="number" min="0" value="10000000"></label>
      <label>Target booking<input name="bookings" type="number" min="0" value="30"></label>
      ${sel('pic', 'PIC', CX.PEOPLE.filter(p => p.id.startsWith('MBR-C')).map(p => [p.id, p.name]), 'MBR-C02')}
      <button class="btn">Buat draft campaign</button></form><p class="muted small">Satu kode UTM tidak boleh dipakai dua campaign aktif di outlet yang sama.</p>`)}</div>`;
  return `<div class="heading-row">${bar}</div>` + tabs + k + body;
}, () => 'Campaign Planner');

/* ================= F2-03 Campaign Detail ================= */
register('campaign-detail', (params) => {
  const cp = cx().campaigns.find(c => c.id === params.id) || cx().campaigns[0];
  const a = campaignActuals(cp.id), cn = contentOf(cp.id);
  const reqs = st().requests.filter(r => r.campaign === cp.id);
  const lines = SER.dataset(st()).budgetLines.filter(b => b.campaign === cp.id && b.period === '2026-08');
  const tasks = cx().tasks.filter(t => t.object === cp.id || cn.some(c => c.id === t.object));
  const conv = (n, d) => d ? pct(n / d) : '—';
  return `<a class="back" href="#campaign">‹ Kembali ke Campaign Planner</a>
  <section class="card cmp-head"><div class="card-head"><h2>${cp.id} · ${esc(cp.name)}</h2>${chip(cp.status, cmpTone(cp.status))}<div class="r">${cmpActions(cp)}</div></div>
    <div class="grid g2"><dl class="def"><dt>Tujuan</dt><dd>${esc(cp.objective)}</dd><dt>Audiens</dt><dd>${esc(cp.audience)}</dd><dt>Penawaran</dt><dd>${esc(cp.offer)}</dd><dt>Outlet</dt><dd>${cp.outlets.map(id => esc(H.outletName(id))).join(', ')}</dd></dl>
    <dl class="def"><dt>Periode</dt><dd>${cp.start} – ${cp.end}</dd><dt>Channel</dt><dd>${esc(cp.channels.join(', '))}</dd><dt>PIC</dt><dd>${who(cp.pic)}</dd><dt>Tracking</dt><dd><code>utm_campaign=${esc(cp.utm)}</code> · window ${cp.window} hari<br><small class="muted">Link demo: https://jaensspa.example/book?utm_source=instagram&amp;utm_medium=social&amp;utm_campaign=${esc(cp.utm)}</small></dd><dt>Baseline</dt><dd>${esc(cp.baseline)}</dd></dl></div></section>
  ${metrics([['Lead (Agu)', num(a.leads), `target ${num(cp.target.leads)}`], ['Booking dibayar', num(a.paid), `target ${num(cp.target.bookings)} · ${num(a.refunds)} refund`], ['Revenue POS', jt(a.revenue), `target ${jt(cp.target.revenue)}`], ['Biaya (rencana)', rp(cp.budgetPlan), lines.length ? `aktual ${rp(lines.reduce((s, b) => s + (b.actual || 0), 0))}` : 'belum ada baris budget']])}
  <div class="grid g2">
    ${card('Funnel campaign (Agustus 2026)', H.bar('Lead masuk', num(a.leads), 1) + H.bar('Lead → booking', `${num(a.booked)} · ${conv(a.booked, a.leads)}`, a.leads ? a.booked / a.leads : 0) + H.bar('Booking → dibayar (POS)', `${num(a.paid)}`, a.leads ? a.paid / a.leads : 0) + `<p class="muted small">Revenue dihitung sekali per transaksi POS. ${link('attribution', 'Buka jejak atribusi ›')}</p>`)}
    ${card('Creative & konten', table(['Konten', 'Format', 'Tahap', 'PIC tahap', 'Tenggat'], cn.map(c => [`<a href="#studio${qs({ view: 'board', content: c.id })}">${c.id} · ${esc(c.title)}</a>`, c.format, chip(c.stage), who(CX.stagePic(c)), c.due])) + `<form class="workflow-form" data-submit="cx:cnt-create" data-after="studio?view=board&content={id}">${hidden({ campaign: cp.id })}<label>Konten baru dari brief<input name="title" required minlength="4" placeholder="mis. Reels testimoni tamu"></label>${sel('format', 'Format', ['Reels', 'Carousel', 'Static', 'Story'], 'Reels')}<button class="btn sm">Buat konten</button></form>`)}
  </div>
  <div class="grid g2">
    ${card('Budget & pengajuan', (lines.length ? table(['Baris budget', 'Pagu', 'Komitmen', 'Aktual', 'Sisa'], lines.map(b => [`${b.id}<br><small>${esc(b.name)}</small>`, rp(b.pagu), rp(b.committed), rp(b.actual), rp(b.pagu - b.committed - b.actual)])) : '<p class="muted">Belum ada baris budget Finance untuk campaign ini.</p>') + (reqs.length ? table(['MRF', 'Nominal', 'Status'], reqs.map(r => [r.id, rp(r.amount), chip(r.status)])) : '') + `<p>${cp.id === 'CMP-001' ? link('commercial-budget?view=requests', 'Ajukan biaya ›') : '<span class="muted small">Pengajuan demo tersedia untuk CMP-001 (baris sandbox).</span>'}</p>`)}
    ${card('Tugas terkait (Daily Race)', tasks.length ? table(['Tugas', 'PIC', 'Tenggat', 'Status'], tasks.map(t => [`${t.id} · ${esc(t.action)}`, who(t.pic), t.due, chip(t.status === 'done' ? 'Selesai' : 'Direncanakan', t.status === 'done' ? 'ready' : '')])) : '<p class="muted">Belum ada tugas.</p>')}
  </div>
  <div class="grid g2">
    ${card('Histori status', `<ol class="history">${cp.history.map(x => `<li><b>${x.status}</b> · ${x.at} · ${esc(CX.person(x.by)?.name || x.by)}${x.note ? ` — ${esc(x.note)}` : ''}</li>`).join('')}</ol>`)}
    ${card('Retrospektif', cp.retro ? `<p>${esc(cp.retro)}</p>` : `<p class="muted">Diisi saat campaign ditutup (wajib). Campaign yang dipause tetap menyimpan histori.</p>`)}
  </div>`;
}, (params) => { const cp = CX.ensure(H.state).campaigns.find(c => c.id === params.id); return cp ? `Campaign Detail · ${cp.id}` : 'Campaign Detail'; });

/* ================= F2-04 Content Studio ================= */
const PRIORITY = ['Tinggi', 'Sedang', 'Rendah'];
function dueBucket(c) {
  if (['Published', 'Analysed'].includes(c.stage)) return 'done';
  const d = dayDiff(c.due, TODAY);
  return d < 0 ? 'overdue' : d === 0 ? 'today' : 'upcoming';
}
function studioFilter(params, includeArchived = false) {
  const q = (params.q || '').toLowerCase();
  return cx().content.filter(c => (includeArchived || params.archived === '1' || !c.archived) && (!q || (c.id + ' ' + c.title).toLowerCase().includes(q)) && (!params.pillar || c.pillar === params.pillar) && (!params.pic || Object.values(c.pics).includes(params.pic)) && (!params.priority || c.priority === params.priority) && (!params.campaign || c.campaign === params.campaign) && (!params.platform || c.channels.includes(params.platform)) && (!params.due || dueBucket(c) === params.due) && (!params.stage || c.stage === params.stage));
}
const contentCard = (c, keep) => { const b = dueBucket(c); return `<article class="board-card${keep.content === c.id ? ' sel' : ''}"><a href="#studio${qs({ ...keep, content: c.id })}"><b>${c.id}</b> ${esc(c.title)}</a><small>${c.campaign ? esc(c.campaign) + ' · ' : ''}${esc(c.pillar)} · ${c.format}</small><small>${esc(c.channels.join(', '))}</small><small>PIC tahap: <b>${CX.stagePic(c) ? who(CX.stagePic(c)) : '<span class="bad-t">belum ada</span>'}</b></small><small>${c.priority} · <span class="${b === 'overdue' ? 'bad-t' : b === 'today' ? 'warn-t' : ''}">tenggat ${c.due}${b === 'overdue' ? ' · overdue' : b === 'today' ? ' · hari ini' : ''}</span></small>${c.reviews.length && c.reviews[c.reviews.length - 1].decision === 'revise' && c.stage === 'Editing' ? '<small class="warn-t">Perlu revisi</small>' : ''}</article>`; };
function stageMover(c) {
  const opts = CX.STAGES.filter(s => s !== c.stage && !['Approved', 'Published'].includes(s));
  return `<form class="inline-form" data-submit="cx:cnt-stage">${hidden({ id: c.id })}<label>Ubah tahap <select name="to">${opts.map(s => `<option>${s}</option>`).join('')}</select></label><button class="btn ghost sm">Pindah</button></form>`;
}
function contentPanel(c, keep) {
  const tab = keep.ctab || 'brief';
  const pubs = cx().publications.filter(p => p.content === c.id);
  const assets = c.assets.map(id => cx().assets.find(a => a.id === id)).filter(Boolean);
  const k = { ...keep, content: c.id };
  const tabs = [['brief', 'Brief'], ['checklist', 'Checklist'], ['assets', 'Aset & Versi'], ['review', 'Review'], ['publish', 'Publikasi'], ['analytics', 'Analytics'], ['log', 'Activity Log']];
  let body = '';
  if (tab === 'brief') body = `<dl class="def"><dt>Campaign</dt><dd>${c.campaign ? `<a href="#campaign-detail${qs({ id: c.campaign })}">${esc(H.campaignName(c.campaign))}</a>` : '—'}</dd><dt>Pilar · format</dt><dd>${esc(c.pillar)} · ${c.format}</dd><dt>Channel</dt><dd>${esc(c.channels.join(', '))}</dd><dt>Prioritas · tenggat</dt><dd>${c.priority} · ${c.due}</dd><dt>PIC per tahap</dt><dd>${['planner', 'creator', 'editor', 'reviewer', 'publisher', 'analyst'].map(r => `${r}: <b>${c.pics[r] ? who(c.pics[r]) : '—'}</b>`).join(' · ')}</dd></dl>
    <form class="inline-form" data-submit="cx:cnt-assign">${hidden({ id: c.id })}${sel('role', 'Peran', ['planner', 'creator', 'editor', 'reviewer', 'publisher', 'analyst'], CX.STAGE_ROLE[c.stage])}${sel('pic', 'PIC', CX.PEOPLE.map(p => [p.id, p.name]), CX.stagePic(c) || 'MBR-C02')}<button class="btn ghost sm">Tetapkan PIC</button></form>`;
  else if (tab === 'checklist') body = c.checklist.length ? `<ul class="checklist">${c.checklist.map(([t, d], i) => `<li><button type="button" class="check${d ? ' on' : ''}" data-action="cx:cnt-check" data-id="${c.id}" data-index="${i}" aria-pressed="${d}">${d ? '✓' : ''}</button>${esc(t)}</li>`).join('')}</ul>` : '<p class="muted">Belum ada checklist tahap.</p>';
  else if (tab === 'assets') body = (assets.length ? table(['Aset', 'Format', 'Versi', 'Status'], assets.map(a => [`${a.id} · ${esc(a.title)}`, a.format, 'v' + a.version, chip(a.status, a.status === 'approved' ? 'ready' : 'sandbox')])) : '<p class="muted">Belum ada aset.</p>') + `<div class="actions"><button type="button" class="btn ghost sm" data-action="cx:cnt-asset" data-id="${c.id}">${assets.length ? 'Unggah versi baru (demo)' : 'Tambah aset v1 (demo)'}</button></div><p class="muted small">Perubahan aset setelah persetujuan mengembalikan konten ke Review dan membatalkan jadwal yang belum terbit.</p>`;
  else if (tab === 'review') body = (c.reviews.length ? `<ol class="history">${c.reviews.map(r => `<li><b>${r.decision === 'approve' ? 'Approve' : 'Minta revisi'}</b> v${r.version} · ${r.at} · ${who(r.by)} — ${esc(r.note)}</li>`).join('')}</ol>` : '<p class="muted">Belum ada review.</p>') +
    (c.stage === 'Review' ? `<form class="workflow-form" data-submit="cx:cnt-approve">${hidden({ id: c.id })}<label>Catatan approve<input name="note" placeholder="opsional"></label><button class="btn sm">Approve</button></form><form class="workflow-form" data-submit="cx:cnt-revise">${hidden({ id: c.id })}<label>Catatan revisi<input name="note" required minlength="5" placeholder="Wajib diisi"></label><button class="btn ghost sm">Minta revisi</button></form>`
      : ['Production', 'Editing'].includes(c.stage) ? `<button type="button" class="btn sm" data-action="cx:cnt-submit" data-id="${c.id}">Ajukan review</button>` : '');
  else if (tab === 'publish') body = (pubs.length ? table(['Publikasi', 'Platform', 'Akun', 'Jadwal', 'Status', 'Post ID / URL', 'Aksi'], pubs.map(p => [p.id, p.platform, esc(p.account), p.scheduledAt, chip(p.status, p.status === 'published' ? 'ready' : p.status === 'draft' ? 'bad' : 'sandbox'), p.postId ? `${p.postId}<br><small>${esc(p.url)}</small>` : '—', p.status === 'scheduled' ? `<button type="button" class="btn sm" data-action="cx:pub-publish" data-id="${p.id}">Tandai terbit (simulasi)</button>` : '—'])) : '<p class="muted">Belum ada publikasi.</p>') +
    (c.approvedAt ? `<form class="workflow-form" data-submit="cx:cnt-schedule">${hidden({ id: c.id })}${sel('platform', 'Platform', c.channels, c.channels.find(ch => !pubs.some(p => p.platform === ch && p.status !== 'draft')) || c.channels[0])}<label>Waktu (WITA)<input name="at" type="datetime-local" required value="2026-08-26T18:00"></label><button class="btn sm">Jadwalkan / ubah jadwal</button></form><p class="muted small">Ubah jadwal publikasi tidak menggeser tenggat produksi. Akun dan jam yang sama ditolak sebagai bentrok.</p>` : `<p class="warn-t small">Konten belum disetujui, belum bisa dijadwalkan.</p>`);
  else if (tab === 'analytics') { const r = c.results; body = r ? metrics([['Views', num(r.views)], ['Klik', num(r.clicks)], ['Lead tertaut', num(r.leads)], ['Booking dibayar', `${num(r.bookings)} · ${jt(r.revenue)}`]]) + `<p class="muted small">Lead dan booking dihitung dari ID yang tertaut ke publikasi (UTM/kode). ${c.id === 'CNT-005' ? `Lead sandbox LEAD-001 (Instagram → WhatsApp) berasal dari publikasi ini: ${link('attribution', 'buka jejak')}.` : ''} ${c.stage === 'Published' ? `<button type="button" class="btn ghost sm" data-action="cx:cnt-analyse" data-id="${c.id}">Tandai Analysed</button>` : ''}</p>` : '<p class="muted">Belum terbit. Data tidak tersedia (bukan nol).</p>'; }
  else body = `<ol class="history">${c.log.slice().reverse().map(l => `<li>${l.at} · ${who(l.by)} — ${esc(l.text)}</li>`).join('')}</ol>`;
  return `<aside class="card panel" aria-label="Detail ${c.id}"><div class="card-head"><h2>${c.id} · ${esc(c.title)}</h2>${chip(c.stage)}<a class="r" href="#studio${qs({ ...keep, content: '', ctab: '' })}" aria-label="Tutup detail">✕</a></div>
    <nav class="tabs" aria-label="Detail konten">${tabs.map(([t, l]) => `<a class="tab${t === tab ? ' on' : ''}" href="#studio${qs({ ...k, ctab: t })}">${l}</a>`).join('')}</nav>${body}<div class="panel-foot">${stageMover(c)}</div></aside>`;
}
register('studio', (params) => {
  const view = params.view || 'board';
  const keep = { view, q: params.q, pillar: params.pillar, pic: params.pic, priority: params.priority, campaign: params.campaign, platform: params.platform, due: params.due, stage: params.stage, archived: params.archived, member: params.member, cal: params.cal, ctab: params.ctab, content: params.content };
  const filterKeep = { view, content: params.content, member: params.member, cal: params.cal };
  const list = studioFilter(params);
  const all = cx().content.filter(c => !c.archived);
  const counts = { overdue: all.filter(c => dueBucket(c) === 'overdue').length, today: all.filter(c => dueBucket(c) === 'today').length, upcoming: all.filter(c => dueBucket(c) === 'upcoming').length };
  const bar = toolbar([`<label>Cari<input name="q" value="${esc(params.q || '')}" placeholder="ID atau judul"></label>`, sel('pillar', 'Pilar', [['', 'Semua'], ...CX.PILLARS], params.pillar), sel('pic', 'PIC', [['', 'Semua'], ...CX.PEOPLE.map(p => [p.id, p.name])], params.pic), sel('priority', 'Prioritas', [['', 'Semua'], ...PRIORITY], params.priority), sel('campaign', 'Campaign', [['', 'Semua'], ...cx().campaigns.map(c => [c.id, c.id + ' · ' + c.name])], params.campaign), sel('platform', 'Platform', [['', 'Semua'], ...CX.PLATFORMS], params.platform), sel('stage', 'Tahap', [['', 'Semua tahap'], ...CX.STAGES], params.stage)], filterKeep);
  const chips = `<div class="chips" role="group" aria-label="Tenggat">${[['overdue', 'Overdue', 'bad'], ['today', 'Due today', 'sandbox'], ['upcoming', 'Upcoming', '']].map(([k, l, t]) => `<a class="status-chip ${t}${params.due === k ? ' on' : ''}" href="#studio${qs({ ...keep, due: params.due === k ? '' : k })}">${l} · ${counts[k]}</a>`).join('')}${params.archived === '1' ? `<a class="status-chip on" href="#studio${qs({ ...keep, archived: '' })}">Termasuk arsip ✕</a>` : `<a class="status-chip" href="#studio${qs({ ...keep, archived: '1' })}">Tampilkan arsip</a>`}</div>`;
  const actions = `<div class="studio-actions"><details class="new-content"><summary class="btn sm">+ New Content</summary><form class="workflow-form" data-submit="cx:cnt-create" data-after="studio?view=${view}&content={id}"><label>Judul<input name="title" required minlength="4"></label>${sel('from', 'Sumber', [['blank', 'Dari nol'], ['reference', 'Dari reference'], ['campaign', 'Dari campaign']], 'campaign')}${sel('campaign', 'Campaign', [['', '—'], ...cx().campaigns.map(c => [c.id, c.id + ' · ' + c.name])], 'CMP-001')}${sel('format', 'Format', ['Reels', 'Carousel', 'Static', 'Story'], 'Reels')}${sel('pillar', 'Pilar', CX.PILLARS, CX.PILLARS[0])}${sel('channel', 'Channel', CX.PLATFORMS, 'Instagram')}${sel('pic', 'PIC planner', [['', 'Belum ditentukan'], ...CX.PEOPLE.map(p => [p.id, p.name])], 'MBR-C02')}<label>Tenggat<input type="date" name="due" value="2026-08-31"></label><button class="btn sm">Simpan</button></form></details><button type="button" class="btn ghost sm" data-action="cx:cnt-archive-done">Archive Done</button></div>`;
  /* analytics strip (NB: produktivitas, ketepatan waktu, revisi) */
  const pubs = cx().publications, published = pubs.filter(p => p.status === 'published');
  const onTime = published.filter(p => p.publishedAt && p.publishedAt.slice(0, 16) <= p.scheduledAt.slice(0, 16).replace(/(\d\d):(\d\d)$/, (m, h, mm) => `${h}:${String(Math.min(59, Number(mm) + 15)).padStart(2, '0')}`));
  const k = metrics([['Aset approved unik', num(cx().assets.filter(a => a.status === 'approved').length), 'satu aset bisa dipakai di banyak publikasi'], ['Publikasi terbit', num(published.length), CX.PLATFORMS.map(p => `${p} ${published.filter(x => x.platform === p).length}`).filter(x => !x.endsWith(' 0')).join(' · ') || 'belum ada'], ['On-time rate', pct(SER.div(onTime.length, published.length)), 'terbit ≤15 menit dari jadwal ÷ terbit berjadwal'], ['Revisi', num(cx().content.reduce((s, c) => s + c.reviews.filter(r => r.decision === 'revise').length, 0)), `${num(counts.overdue)} konten overdue`]]);
  const tabs = viewTabs('studio', [['board', 'Board'], ['calendar', 'Calendar'], ['list', 'List', list.length], ['library', 'Library'], ['tasks', 'My Tasks']], view, { ...keep, content: params.content, ctab: params.ctab });
  const open = params.content ? cx().content.find(c => c.id === params.content) : null;
  let body = '';
  if (view === 'board') body = `<div class="board studio-board" role="list">${CX.STAGES.filter(s => !params.stage || s === params.stage).map(s => { const col = list.filter(c => c.stage === s); return `<section class="board-col" role="listitem" aria-label="${s}, ${col.length} konten"><h3>${s} <span class="c">${col.length}</span></h3>${col.map(c => contentCard(c, keep)).join('') || '<p class="muted small">Kosong</p>'}</section>`; }).join('')}</div><p class="muted small">Pindah tahap lewat menu “Ubah tahap” di panel detail (bisa dengan keyboard). Desktop: board digulir horizontal; mobile: pilih tahap di filter.</p>`;
  else if (view === 'calendar') {
    const mode = params.cal === 'publish' ? 'publish' : 'deadline';
    const days = 31, first = new Date('2026-08-01').getDay();
    const items = (d) => { const date = `2026-08-${String(d).padStart(2, '0')}`; return mode === 'deadline' ? list.filter(c => c.due === date).map(c => `<a href="#studio${qs({ ...keep, content: c.id })}" class="cal-item ${dueBucket(c)}">${c.id} · ${esc(c.title)}<small>${who(CX.stagePic(c))} · ${c.stage}</small></a>`) : pubs.filter(p => p.scheduledAt.startsWith(date) && list.some(c => c.id === p.content)).map(p => `<a href="#studio${qs({ ...keep, content: p.content, ctab: 'publish' })}" class="cal-item ${p.status}">${p.platform} ${p.scheduledAt.slice(11)} · ${p.content}<small>${esc(p.account)} · ${p.status}</small></a>`); };
    body = card(`Kalender Agustus 2026 · ${mode === 'deadline' ? 'tenggat tahap' : 'jadwal publikasi'}`, `<div class="row"><a class="tab${mode === 'deadline' ? ' on' : ''}" href="#studio${qs({ ...keep, cal: 'deadline' })}">Tenggat tahap</a><a class="tab${mode === 'publish' ? ' on' : ''}" href="#studio${qs({ ...keep, cal: 'publish' })}">Jadwal publikasi</a></div>
      <div class="cal" role="grid" aria-label="Kalender Agustus 2026">${['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => `<div class="cal-h" role="columnheader">${d}</div>`).join('')}${'<div class="cal-d empty"></div>'.repeat(first)}${Array.from({ length: days }, (_, i) => { const it = items(i + 1); return `<div class="cal-d${`2026-08-${String(i + 1).padStart(2, '0')}` === TODAY ? ' today' : ''}" role="gridcell"><span class="cal-n">${i + 1}</span>${it.join('')}</div>`; }).join('')}</div><p class="muted small">Zona waktu WITA. Ubah jadwal di tab Publikasi pada detail konten.</p>`);
  } else if (view === 'list') {
    const sort = params.sort || 'due';
    const sorted = list.slice().sort((a, b) => sort === 'stage' ? CX.STAGES.indexOf(a.stage) - CX.STAGES.indexOf(b.stage) : sort === 'priority' ? PRIORITY.indexOf(a.priority) - PRIORITY.indexOf(b.priority) : a.due.localeCompare(b.due));
    body = card('Daftar konten', `<p class="small">Urutkan: ${[['due', 'Tenggat'], ['stage', 'Tahap'], ['priority', 'Prioritas']].map(([s, l]) => s === sort ? `<b>${l}</b>` : `<a href="#studio${qs({ ...keep, sort: s })}">${l}</a>`).join(' · ')}</p>` + table(['ID', 'Judul', 'Campaign', 'Pilar', 'Format', 'Tahap', 'PIC tahap', 'Tenggat', 'Prioritas', 'Channel'], sorted.map(c => [`<a href="#studio${qs({ ...keep, content: c.id })}">${c.id}</a>`, esc(c.title) + (c.archived ? ' <span class="badge">arsip</span>' : ''), c.campaign || '—', esc(c.pillar), c.format, c.stage, CX.stagePic(c) ? who(CX.stagePic(c)) : '<span class="bad-t">—</span>', `<span class="${dueBucket(c) === 'overdue' ? 'bad-t' : ''}">${c.due}</span>`, c.priority, esc(c.channels.join(', '))])));
  } else if (view === 'library') {
    const assets = cx().assets;
    const targets = cx().content.filter(c => !c.archived && !['Published', 'Analysed'].includes(c.stage));
    body = `<div class="library">${assets.map(a => { const used = cx().content.filter(c => c.assets.includes(a.id)); return `<article class="card asset"><div class="thumb ${a.format.toLowerCase()}" aria-hidden="true"><span>${a.format}</span><small>DEMO</small></div><h3>${a.id}</h3><p class="small">${esc(a.title)}</p><p class="small">${esc(cx().brands.find(b => b.id === a.brand)?.name || a.brand)} · v${a.version} · ${chip(a.status, a.status === 'approved' ? 'ready' : 'sandbox')}</p><p class="muted small">Dipakai di: ${used.map(c => `<a href="#studio${qs({ ...keep, view: 'board', content: c.id })}">${c.id}</a>`).join(', ') || '—'}</p>${a.status === 'approved' ? `<form class="inline-form" data-submit="cx:cnt-reuse">${hidden({ asset: a.id })}<label class="sr" for="reuse-${a.id}">Pakai ${a.id} di konten</label><select id="reuse-${a.id}" name="id">${targets.filter(c => !c.assets.includes(a.id)).map(c => `<option value="${c.id}">${c.id}</option>`).join('')}</select><button class="btn ghost sm">Pakai</button></form>` : ''}</article>`; }).join('')}</div><p class="muted small">Thumbnail adalah placeholder berlabel DEMO. Pakai ulang aset approved lewat referensi ID; jumlah aset unik tidak bertambah.</p>`;
  } else {
    const me = params.member || H.prefs.member || 'MBR-C04';
    const mine = cx().content.filter(c => !c.archived && CX.stagePic(c) === me && !['Published', 'Analysed'].includes(c.stage));
    const unassigned = cx().content.filter(c => !c.archived && !CX.stagePic(c) && !['Published', 'Analysed'].includes(c.stage));
    const tasks = cx().tasks.filter(t => t.pic === me);
    const group = (title, rows) => card(`${title} (${rows.length})`, rows.length ? table(['Konten', 'Tahap', 'Tenggat', 'Campaign'], rows.map(c => [`<a href="#studio${qs({ ...keep, view: 'tasks', member: me, content: c.id })}">${c.id} · ${esc(c.title)}</a>`, c.stage, c.due, c.campaign || '—'])) : '<p class="muted">Tidak ada.</p>');
    body = `<form id="filters" class="filters">${hidden({ view: 'tasks' })}${sel('member', 'Anggota', CX.PEOPLE.map(p => [p.id, `${p.name} · ${p.role}`]), me)}</form>
      <div class="grid g2">${group('Overdue', mine.filter(c => dueBucket(c) === 'overdue'))}${group('Due today', mine.filter(c => dueBucket(c) === 'today'))}${group('Upcoming', mine.filter(c => dueBucket(c) === 'upcoming'))}${group('Review ditugaskan', mine.filter(c => c.stage === 'Review'))}</div>
      ${card('Terblokir: tahap tanpa PIC', unassigned.length ? table(['Konten', 'Tahap', 'Tenggat'], unassigned.map(c => [`<a href="#studio${qs({ ...keep, view: 'tasks', content: c.id })}">${c.id} · ${esc(c.title)}</a>`, c.stage, c.due])) : '<p class="muted">Tidak ada.</p>')}
      ${card('Tugas Daily Race saya', tasks.length ? table(['Tugas', 'Sumber', 'Tenggat', 'Status'], tasks.map(t => [`${t.id} · ${esc(t.action)}`, esc(t.source), t.due, chip(t.status === 'done' ? 'Selesai' : 'Direncanakan', t.status === 'done' ? 'ready' : '')])) + `<p class="small">${link('commercial-team', 'Buka Daily Race ›')}</p>` : '<p class="muted">Tidak ada tugas Daily Race.</p>')}
      <p class="muted small">My Tasks dibaca dari PIC tahap pada record konten yang sama, jadi tidak ada tugas ganda. Perpindahan PIC langsung terlihat di sini.</p>`;
  }
  return `<div class="heading-row">${bar}</div>${chips}${actions}${tabs}${k}<div class="studio-wrap${open ? ' has-panel' : ''}"><div class="studio-main">${list.length || view === 'library' || view === 'tasks' ? body : `<div class="card empty-state" role="status"><h2>Tidak ada konten untuk filter ini</h2><p>Ubah filter atau buat konten baru.</p></div>`}</div>${open ? contentPanel(open, keep) : ''}</div>`;
}, () => 'Content Studio');

/* ================= F2-01 Brand & Communications ================= */
register('brand', (params) => {
  const view = params.view || 'foundation';
  const brands = cx().brands.filter(b => !params.brand || b.id === params.brand);
  const keep = { brand: params.brand };
  const bar = toolbar([sel('brand', 'Brand', [['', 'Semua brand'], ...cx().brands.map(b => [b.id, b.name])], params.brand)], { view });
  const tabs = viewTabs('brand', [['foundation', 'Brand Foundation'], ['visibility', 'Brand Visibility'], ['assets', 'Aset'], ['calendar', 'Kalender komunikasi'], ['messages', 'Message Library']], view, keep);
  let body = '';
  if (view === 'foundation') {
    const prog = brands.map(b => ({ b, p: CX.brandProgress(b) }));
    const avg = prog.length ? prog.reduce((s, x) => s + x.p.ratio, 0) / prog.length : null;
    const sel1 = params.open ? cx().brands.find(b => b.id === params.open) : null;
    body = `<div class="grid g4 keep2">${prog.map(({ b, p }) => `<a class="kpi-btn" href="#brand${qs({ ...keep, view, open: b.id })}"><div class="kpi${sel1 && sel1.id === b.id ? ' g-gold' : ''}"><div class="lbl">${esc(b.name)}</div><div class="val">${pct(p.ratio, 0)}</div><div class="sub">${p.done}/${p.total} bobot approved${p.pending.length ? ' · belum: ' + esc(p.pending.join(', ')) : ''}</div></div></a>`).join('')}</div>
      ${card('Narasi progres', `<p>Rata-rata progres ${prog.length} brand <b>${pct(avg, 0)}</b>, dihitung dari bobot milestone yang sudah approved (${CX.BRAND_ELEMENTS.map(e => `${e[1]} ${e[2]}`).join(', ')}). Kartu dan narasi memakai perhitungan yang sama.</p>`)}
      ${sel1 ? card(`Checklist ${esc(sel1.name)}`, table(['Elemen', 'Bobot', 'Status', 'Versi', 'Aksi'], CX.BRAND_ELEMENTS.map(([k, l, w]) => { const [s, v] = sel1.els[k]; const act = s === 'draft' ? ['brand-submit', 'Ajukan review'] : s === 'review' ? ['brand-approve', 'Approve'] : s === 'approved' ? ['brand-revise', 'Revisi (versi baru)'] : null; return [l, w, s === 'none' ? '<span class="muted">tidak berlaku</span>' : chip(s, s === 'approved' ? 'ready' : 'sandbox'), s === 'none' ? '—' : 'v' + v, act ? `<button type="button" class="btn ${act[0] === 'brand-approve' ? '' : 'ghost '}sm" data-action="cx:${act[0]}" data-id="${sel1.id}" data-el="${k}">${act[1]}</button>` : '—']; })) + '<p class="muted small">Revisi membuat versi baru dan mengembalikan elemen ke draft sehingga progres turun sampai di-approve lagi.</p>') : '<p class="muted small">Pilih kartu brand untuk membuka checklist aset.</p>'}`;
  } else if (view === 'visibility') {
    const reqs = cx().offline;
    const approved = reqs.filter(r => r.status !== 'Produksi'), dist = reqs.filter(r => r.status === 'Terdistribusi'), onTime = approved.filter(r => r.done && r.done <= r.due);
    body = metrics([['Desain offline', `${num(approved.length)} / 30`, 'disetujui ÷ target'], ['Terdistribusi', num(dist.length), `${num(dist.reduce((s, r) => s + r.placements, 0))} penempatan (desain unik tidak digandakan)`], ['Tepat waktu', pct(SER.div(onTime.length, approved.length)), 'selesai ≤ tenggat ÷ selesai'], ['Rework', num(reqs.reduce((s, r) => s + r.rework, 0)), 'revisi setelah review']]) +
      card('Permintaan desain offline', table(['Request', 'Peminta', 'Tipe', 'PIC', 'Tenggat', 'Selesai', 'Status', 'Penempatan'], reqs.map(r => [r.id, r.dept, r.type, who(r.pic), r.due, r.done || '—', chip(r.status, r.status === 'Terdistribusi' ? 'ready' : 'sandbox'), num(r.placements)])));
  } else if (view === 'assets') {
    const as = cx().assets.filter(a => !params.brand || a.brand === params.brand);
    body = card('Aset brand berversi', table(['Aset', 'Brand', 'Format', 'Versi', 'Status', 'Dipakai di'], as.map(a => [`${a.id} · ${esc(a.title)}`, esc(cx().brands.find(b => b.id === a.brand)?.name || a.brand), a.format, 'v' + a.version, chip(a.status, a.status === 'approved' ? 'ready' : 'sandbox'), cx().content.filter(c => c.assets.includes(a.id)).map(c => `<a href="#studio${qs({ view: 'library', content: c.id })}">${c.id}</a>`).join(', ') || '—'])) + `<p class="small">${link('studio?view=library', 'Buka Library di Content Studio ›')}</p>`);
  } else if (view === 'calendar') {
    body = card('Kalender komunikasi', table(['Tanggal', 'Komunikasi', 'Audiens', 'Channel', 'Tipe', 'Campaign', 'Lokasi distribusi', 'Status', 'Aksi'], cx().comms.map(m => [m.date, esc(m.title), esc(m.audience), m.channel, m.type, m.campaign ? `<a href="#campaign-detail${qs({ id: m.campaign })}">${m.campaign}</a>` : '—', esc(m.locations.join(', ') || '—'), chip(m.status, m.status === 'Terdistribusi' ? 'ready' : 'sandbox'), m.status !== 'Terdistribusi' ? `<button type="button" class="btn ghost sm" data-action="cx:com-advance" data-id="${m.id}">${({ Draft: 'Ajukan', 'Menunggu approval': 'Setujui', Disetujui: 'Catat distribusi' })[m.status]}</button>` : '—'])));
  } else {
    const ms = cx().messages.filter(m => !params.brand || m.brand === params.brand);
    body = card('Message Library', table(['Pesan', 'Brand', 'Isi', 'Versi', 'Status', 'Aksi'], ms.map(m => [`${m.id} · ${esc(m.title)}`, esc(cx().brands.find(b => b.id === m.brand)?.name), esc(m.text), 'v' + m.version, chip(m.status, m.status === 'approved' ? 'ready' : 'sandbox'), m.status === 'review' ? `<button type="button" class="btn sm" data-action="cx:msg-version" data-id="${m.id}">Approve</button>` : `<form class="inline-form" data-submit="cx:msg-version">${hidden({ id: m.id })}<label class="sr" for="mv-${m.id}">Versi baru ${m.id}</label><input id="mv-${m.id}" name="text" minlength="10" required placeholder="Teks versi baru"><button class="btn ghost sm">Versi baru</button></form>`])));
  }
  return `<div class="heading-row">${bar}</div>` + tabs + body;
}, () => 'Brand & Communications');
})();
