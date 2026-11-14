/* JAENS ERP · Portal HRD · F8 AmbideX, Reporting & Reflection — DATA DEMO / SIMULASI.
   NV01 Race Vegen (hrd-race) · NV02 Race Beacon & Success Factors (hrd-race-beacon) · NV03 Daily Race (hrd-race-daily) ·
   NV04 Weekly Race (hrd-race-weekly) · NV05 Monthly Reflection (hrd-race-reflection) · NV06 STRACON (hrd-race-stracon) ·
   NV07 e-Deck Reflection HRD (hrd-race-deck) · NV08 Pusat Laporan & Jejak Bukti (hrd-report-center). */
(() => {
const H = window.HL;
const { esc, table, card, qs, link, rp } = H;
const hr = () => { const h = HR.ensure(H.state); HR.EXT.ensure?.(h); return h; };
const f8 = () => HR8.ensure(hr());
const role = () => H.prefs.role;
const def = () => HR.roleDef(role());
const chip = (t, tone = '') => `<span class="status-chip ${tone}">${esc(t)}</span>`;
const empName = (id) => id ? (hr().people.find(p => p.id === id)?.name || id) : '—';
const tlink = (id) => id ? link('hrd-task' + qs({ id }), id) : '—';
const tabs = (route, cur, list, params = {}, key = 'tab') => `<nav class="tabs" aria-label="Bagian">${list.map(([k, l]) => `<a class="tab${k === cur ? ' on' : ''}" href="#${route}${qs({ ...params, [key]: k })}" ${k === cur ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
const denied = (why) => `<section class="card hr-denied" role="alert"><h2>Akses ditolak</h2><p>${why}</p><div class="actions"><button type="button" class="btn" data-hr-role="hrd">Ganti ke Manager HRD</button></div></section>`;
const register = (id, fn, title) => { H.REGISTRY[id] = fn; fn.title = title; };
const KC = ['g-teal', 'g-violet', 'g-blue', 'g-gold'];
const kpiLinks = (es) => `<section class="grid g4 keep2 kpis">${es.map(([l, v, h, sub], i) => `<a class="kpi ${KC[i % 4]}" href="${h}"><div class="lbl">${l}</div><div class="val">${v}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</a>`).join('')}</section>`;
const MGR = () => role() === 'hrd';
const LEAD = () => ['hrd', 'hg-lead', 'owner'].includes(role());
const guard = (fn) => (p) => HR8.canSee(role()) ? fn(p) : denied(`Role demo <b>${esc(def().label)}</b> tidak membuka AmbideX, Race dan Reflection. Karyawan melihat kartu dan XScore sendiri di ${link('hrd-myday', 'My Day')} dan ${link('hrd-kpi', 'Kinerja')}.`);
const demo = (extra = '') => `<p class="active-filters">${chip('DATA DEMO · R&D', 'sandbox')} Workbook Race, skor & laporan sintetis · rumus XScore resmi dan Absenteeism belum dikunci${extra}</p>`;
const SPV = () => role() === 'outlet-spv';
const fmtV = (v, unit) => v === null || v === undefined ? chip('Belum tersedia', 'sandbox') : unit === 'Rp' ? rp(v) : typeof v === 'number' ? `${unit === '%' ? String(v) : v.toLocaleString('id-ID')}${unit === '%' ? '%' : unit ? ' ' + esc(unit) : ''}` : esc(v);
const achC = (a) => a === null ? chip('Gap data', 'sandbox') : chip(`${Math.round(a * 100)}%`, a >= 1 ? 'ready' : a >= 0.8 ? 'planned' : 'bad');
const staff = () => ['EMP-0142', 'EMP-0143', 'EMP-0144', 'EMP-0145', 'EMP-0153'];
const picSel = (name = 'pic', cur = '') => `<select name="${name}" required><option value="">Pilih PIC</option>${staff().map(e => `<option value="${e}" ${cur === e ? 'selected' : ''}>${esc(empName(e))}</option>`).join('')}</select>`;

/* ---------- NV01 Race Vegen ---------- */
function race(params) {
  const h = hr(), { race: R, ver, draft } = HR8.activeRace(h), rs = HR8.raceScore(h, ver, role());
  const ind = params.ind && rs.pillars.find(p => p.id === params.ind);
  const bcn = f8().beacon.items;
  const out = demo() + kpiLinks([
    ['Skor Race (terukur)', rs.score === null ? '—' : rs.score.toFixed(1), '#hrd-report-center?id=RPT-RACE-HG', `bobot terukur ${rs.coverage}% · ${rs.pillars.some(p => p.s.gaps) ? 'provisional' : 'lengkap'}`],
    ['Versi aktif', `v${ver.v}`, '#hrd-race?tab=ver', `${R.versions.length} versi · ${draft ? 'draf v' + draft.v + ' terbuka' : 'tanpa draf'}`],
    ['Indikator', ver.indicators.length, '#hrd-race', `total bobot ${rs.total}%`],
    ['Race Beacon', bcn.length, '#hrd-race-beacon', `kontrak ${f8().beacon.id} v${f8().beacon.version}`]]) +
    card(`${esc(R.name)} · ${esc(R.scope)}`, `<p><b>Objective:</b> ${esc(R.objective)}</p><p class="muted small">Race ID ${R.id} · periode November 2026 · versi kontrak v${ver.v} aktif sejak ${esc(ver.activatedAt || ver.at)} oleh ${esc(ver.by)}</p>` +
      table(['ID', 'Indikator Vegen', 'Race Goal', 'Bobot', 'Capaian', 'Key metrics', 'Beacon'], rs.pillars.map(p => [link('hrd-race' + qs({ ind: p.id }), p.id), esc(p.name), esc(p.goal), `${p.weight}%`, achC(p.s.ach), `${p.s.visible.length}/${p.s.metrics.length}${p.s.gaps ? ` · ${p.s.gaps} gap` : ''}${p.s.restricted ? ' · 1 terbatas' : ''}`, bcn.filter(b => b.parent === p.id).map(b => link('hrd-race-beacon' + qs({ id: b.id }), b.id)).join(', ') || '—'])) +
      `<p class="muted small">Skor = Σ bobot × capaian indikator terukur ÷ bobot terukur. Capaian dibatasi 100% (cap); arah "max" (mis. Turnover) memakai target ÷ aktual. Data belum tersedia ditandai gap dan tidak dihitung nol.</p>`);
  const det = ind ? card(`${ind.id} · ${esc(ind.name)}`, table(['Key metric', 'Satuan', 'Target', 'Aktual', 'Arah', 'Capaian', 'Metric version', 'Bukti', 'Sumber'], ind.s.metrics.map(m => m.restricted && !MGR() ? [esc(m.key), '—', '—', chip('Terbatas · Manager HRD', 'sandbox'), '—', '—', esc(m.metric || ''), '—', 'Agregat biaya F7'] : [esc(m.key), esc(m.unit), fmtV(m.target, m.unit === 'Rp' ? 'Rp' : ''), fmtV(m.actual, m.unit === 'Rp' ? 'Rp' : ''), m.dir === 'max' ? 'lebih kecil lebih baik' : 'lebih besar lebih baik', achC(HR8.achOf(m)), esc(m.metric || '—'), m.ev ? link('hrd-report-center' + qs({ ev: m.ev }), esc(m.ev)) : chip('Bukti kosong', 'bad'), m.route ? link(m.route, esc(m.source)) : esc(m.source)])) + `<p>${link('hrd-race', '‹ Semua indikator')}</p>`) : '';
  let ed = '';
  if (params.tab === 'ver' || draft) {
    const d = draft, sum = d ? d.indicators.reduce((s, i) => s + Number(i.weight), 0) : 0;
    ed = card('Versi kontrak Race', table(['Versi', 'Status', 'Indikator', 'Total bobot', 'Waktu', 'Oleh'], R.versions.map(v => [`v${v.v}`, chip(v.status, v.status === 'Aktif' ? 'ready' : v.status === 'Draf' ? 'planned' : ''), v.indicators.length, `${v.indicators.reduce((s, i) => s + Number(i.weight), 0)}%`, esc(v.activatedAt || v.at), esc(v.by)])) + '<p class="muted small">Laporan historis dan snapshot e-Deck menyimpan versi Race yang dipakai.</p>' +
      (d && LEAD() ? `<h3>Draf v${d.v}</h3>` + table(['ID', 'Indikator', 'Bobot', 'Ubah'], d.indicators.map(i => [i.id, esc(i.name), `${i.weight}%`, `<form class="inline-form" data-submit="hr:race-edit" data-after="hrd-race?tab=ver"><input type="hidden" name="id" value="${i.id}"><label class="sr" for="w-${i.id}">Bobot ${esc(i.name)}</label><input id="w-${i.id}" name="weight" type="number" min="0" max="100" step="1" value="${i.weight}" style="width:5em"><button class="btn sm">Simpan</button></form>`])) +
        `<p>Total bobot draf: <b data-test="race-sum">${sum}%</b> ${Math.abs(sum - 100) < 1e-9 ? chip('Tepat 100% · siap diaktifkan', 'ready') : chip(`${sum}% · tetap draf`, 'bad')}</p>` +
        `<form class="workflow-form" data-submit="hr:race-edit" data-after="hrd-race?tab=ver"><input type="hidden" name="add" value="1"><label>Indikator baru<input name="name" minlength="3" required placeholder="mis. Employer Branding"></label><label>Bobot<input name="weight" type="number" min="0" max="100" value="0"></label><label>Key metrics (pisahkan |)<input name="keys" placeholder="Share Loker|Employee Loyalty"></label><button class="btn ghost">Tambah ke draf</button></form>` +
        `<div class="actions"><button type="button" class="btn" data-action="hr:race-activate" data-after="hrd-race?tab=ver">Aktifkan v${d.v}</button></div>` : LEAD() ? `<div class="actions"><button type="button" class="btn" data-action="hr:race-draft" data-after="hrd-race?tab=ver">Buat draf versi baru</button></div>` : '<p class="muted">Perubahan versi oleh Manager HRD / Lead HG.</p>'));
  } else if (LEAD()) ed = `<div class="actions">${link('hrd-race?tab=ver', 'Kelola versi & bobot')}</div>`;
  return out + det + ed;
}

/* ---------- NV02 Race Beacon & Success Factors ---------- */
function beacon(params) {
  const h = hr(), B = f8().beacon, tab = params.tab === 'sf' ? 'sf' : 'bcn', b = params.id && B.items.find(x => x.id === params.id);
  const sum = B.items.reduce((s, x) => s + x.weight, 0);
  const pill = (id) => HR8.PILLARS.find(p => p.id === id);
  const head = demo() + tabs('hrd-race-beacon', tab, [['bcn', 'Race Beacon'], ['sf', 'Success Factors']]);
  if (tab === 'sf') {
    const all = B.items.flatMap(x => x.reviews.map(r => ({ ...r, b: x })));
    return head + card('Rubric Success Factors · RF v1', table(['#', 'Kriteria', 'Skala'], HR8.RUBRIC.map((r, i) => [i + 1, esc(r), '1 Belum · 2 Berkembang · 3 Baik · 4 Sangat baik']))) +
      card('Riwayat review', all.length ? table(['Review ID', 'Beacon', 'Rata-rata', 'Alasan', 'Bukti', 'Penilai', 'Waktu'], all.map(r => [r.id, link('hrd-race-beacon' + qs({ id: r.b.id }), r.b.id), r.avg, esc(r.reason), r.evidence.startsWith('TSK') ? tlink(r.evidence) : esc(r.evidence), esc(r.by), esc(r.at)])) : '<p class="empty">Belum ada review. Pilih Beacon lalu isi rubric.</p>');
  }
  return head + card(`Kontrak Beacon ${B.id} v${B.version}`, table(['Beacon', 'Sasaran unit', 'Bobot', 'Indikator induk', 'Inisiatif', 'Tahap', 'PIC', 'Tenggat', 'Task ID', 'Review'], B.items.map(x => [link('hrd-race-beacon' + qs({ id: x.id }), x.id), esc(x.name), `${x.weight}%`, link('hrd-race' + qs({ ind: x.parent }), `${x.parent} · ${esc(pill(x.parent)?.name || '')}`), esc(x.initiative), chip(x.stage, x.stage === 'Review' ? 'planned' : ''), esc(empName(x.pic)), x.due, tlink(x.task), x.reviews.length ? `${x.reviews.length} · ${x.reviews[x.reviews.length - 1].avg}` : chip('Belum', 'sandbox')])) +
    `<p>Total bobot Beacon ${sum}% ${sum === 100 ? chip('Kontrak valid', 'ready') : chip('Tidak 100%', 'bad')} · kontrak terpisah dari bobot Race Vegen (v${HR8.activeRace(h).ver.v}).</p>`) +
    (b ? card(`${b.id} · ${esc(b.name)}`, `<p>Induk ${link('hrd-race' + qs({ ind: b.parent }), b.parent)} · kartu ${tlink(b.task)} (${esc(h.f3.tasks.find(t => t.id === b.task)?.stage || '—')}) · PIC ${esc(empName(b.pic))} · tenggat ${b.due}</p>` +
      (LEAD() ? `<form class="workflow-form" data-submit="hr:beacon-review" data-after="hrd-race-beacon?id=${b.id}"><input type="hidden" name="id" value="${b.id}">${HR8.RUBRIC.map((r, i) => `<label>${esc(r)}<select name="r${i}" required><option value="">—</option>${[1, 2, 3, 4].map(n => `<option>${n}</option>`).join('')}</select></label>`).join('')}<label>Alasan<input name="reason" minlength="10" required placeholder="mis. formasi berjalan, satu kandidat praktik"></label><label>Bukti (Task/Evidence ID)<input name="evidence" value="${esc(b.task)}"></label><button class="btn">Simpan review</button></form>` : '<p class="muted">Review oleh Manager HRD / Lead HG.</p>') +
      (b.reviews.length ? table(['Review', 'Skor per kriteria', 'Rata-rata', 'Alasan', 'Bukti', 'Penilai', 'Waktu'], b.reviews.map(r => [r.id, r.scores.join(' · '), r.avg, esc(r.reason), esc(r.evidence), esc(r.by), esc(r.at)])) : '')) : '');
}

/* ---------- NV03 Daily Race ---------- */
function dailyPage(params) {
  const h = hr(), emp = params.emp || h.roleEmp[role()] || 'EMP-0142', d = HR8.daily(h, emp);
  const evs = (t) => (h.f3.events || []).filter(e => e.task === t.id);
  const doneAt = (t) => evs(t).find(e => e.after === 'Selesai')?.at || '—', verAt = (t) => { const e = evs(t).find(x => x.kind === 'Review diterima'); return e ? esc(e.at) : t.requireReview ? chip('Menunggu verifikasi', 'sandbox') : 'tidak perlu review'; };
  const row = (t) => [tlink(t.id), esc(t.title), chip(t.stage), esc(empName(t.pic)), t.due || '—', t.blocker ? chip('Blocker: ' + t.blocker.reason, 'bad') : '—'];
  const sec = (title, ls, empty) => card(`${title} · ${ls.length}`, ls.length ? table(['Task ID', 'Kartu', 'Tahap', 'PIC', 'Tenggat', 'Blocker'], ls.map(row)) : `<p class="empty">${empty}</p>`);
  const pl = h.placements.find(p => p.emp === emp && !p.to);
  return demo() + `<form id="filters" class="filters" aria-label="Pilih orang"><label>Orang<select name="emp">${staff().map(e => `<option value="${e}" ${e === emp ? 'selected' : ''}>${esc(empName(e))}</option>`).join('')}</select></label></form>` +
    `<p class="active-filters">Konteks hari ${HR.TODAY} WITA · ${esc(empName(emp))} · ${esc(HR.locName(pl?.location || HR.HQ.id))} · cakupan role ${esc(def().label)} · ${link('hrd-schedule' + qs({ emp }), 'jadwal shift F2')}</p>` +
    kpiLinks([['Komitmen My Day', d.focus.length, '#hrd-myday', 'kartu sama dengan F3'], ['Selesai hari ini', d.done.length, '#hrd-race-daily' + qs({ emp }), `${d.verified.length} terverifikasi`], ['Terlambat', d.late.length, '#hrd-list?late=1', 'tenggat lewat'], ['Terblokir', d.blocked.length, '#hrd-list?blocked=1', 'butuh eskalasi']]) +
    sec('Komitmen (My Day)', d.focus, `Belum ada komitmen. Tambahkan kartu dari ${link('hrd-myday', 'My Day')}.`) +
    card(`Selesai hari ini · ${d.done.length}`, d.done.length ? table(['Task ID', 'Kartu', 'Waktu selesai', 'Waktu verifikasi'], d.done.map(t => [tlink(t.id), esc(t.title), esc(doneAt(t)), verAt(t)])) : '<p class="empty">Belum ada kartu selesai hari ini. Waktu selesai dan waktu verifikasi dicatat terpisah.</p>') +
    sec('Terlambat', d.late, 'Tidak ada kartu terlambat.') + sec('Terblokir', d.blocked, 'Tidak ada blocker aktif.') + sec('Pekerjaan tambahan (dibuat hari ini)', d.extra, 'Tidak ada pekerjaan tambahan.') +
    (d.focus.length ? card('Catat blocker / eskalasi', `<form class="workflow-form" data-submit="hr:task-blocker" data-after="hrd-race-daily?emp=${emp}"><label>Kartu<select name="id" style="max-width:100%">${d.focus.map(t => `<option value="${t.id}">${t.id} · ${esc(t.title.length > 28 ? t.title.slice(0, 27) + '…' : t.title)}</option>`).join('')}</select></label><label>Hambatan<input name="reason" minlength="5" required placeholder="mis. data POS Ubud belum lengkap"></label><label>Menunggu<input name="waiting" placeholder="mis. Supervisor Ubud"></label><button class="btn ghost">Catat blocker</button></form>` +
      `<div class="actions"><button type="button" class="btn" data-action="hr:race-session" data-kind="Daily" data-commits="${d.focus.map(t => t.id).join(',')}" data-scope="${esc(empName(emp))}" data-after="hrd-race-daily?emp=${emp}">Simpan sesi Daily</button></div>`) : '') +
    sessions('Daily');
}
function sessions(kind) {
  const ss = f8().sessions.filter(s => s.kind === kind), ts = hr().f3.tasks;
  return card(`Sesi ${kind}`, ss.length ? table(['Session ID', 'Waktu WITA', 'Scope', 'Komitmen', 'Status saat review → sekarang', 'Catatan'], ss.map(s => [s.id, esc(s.at), esc(s.scope), s.commits.map(tlink).join(', '), s.commits.map(c => `${c}: ${esc(s.status[c])} → ${esc(ts.find(t => t.id === c)?.stage || '—')}`).join('<br>'), esc(s.notes)])) : '<p class="empty">Belum ada sesi tersimpan.</p>');
}

/* ---------- NV04 Weekly Race ---------- */
function weeklyPage(params) {
  const h = hr(), ws = params.ws === 'HG' ? 'HG' : 'HRD', w = HR8.weekly(h, ws);
  const row = (t) => [tlink(t.id), esc(t.title), chip(t.stage), esc(empName(t.pic)), t.due || '—'];
  return demo() + tabs('hrd-race-weekly', ws, [['HRD', 'HRD Operations'], ['HG', 'Human Growth']], {}, 'ws') +
    `<p class="active-filters">Minggu 46 · ${HR8.WEEK[0]} s.d. ${HR8.WEEK[1]} WITA</p>` +
    kpiLinks([['Komitmen minggu ini', w.commit.length, `#hrd-board?ws=${ws}`, 'tenggat dalam minggu'], ['Terbawa', w.carried.length, '#hrd-list?late=1', 'Task ID tetap'], ['Selesai', w.done.length, `#hrd-list?stage=Selesai`, 'sejak awal minggu'], ['Hambatan', w.blocked.length, '#hrd-list?blocked=1', 'lintas divisi']]) +
    card('Komitmen mingguan', w.commit.length ? table(['Task ID', 'Kartu', 'Tahap', 'PIC', 'Tenggat'], w.commit.map(row)) : '<p class="empty">Tidak ada komitmen bertenggat minggu ini.</p>') +
    card('Pekerjaan terbawa', w.carried.length ? table(['Task ID', 'Kartu', 'Tenggat asal', 'Tenggat sekarang', 'Tahap'], w.carried.map(({ t, originalDue }) => [tlink(t.id), esc(t.title), originalDue, t.due, chip(t.stage)])) : '<p class="empty">Tidak ada pekerjaan terbawa dari minggu lalu.</p>') +
    card('Hambatan', w.blocked.length ? table(['Task ID', 'Kartu', 'Hambatan', 'Menunggu'], w.blocked.map(t => [tlink(t.id), esc(t.title), esc(t.blocker.reason), esc(t.blocker.waiting || '—')])) : '<p class="empty">Tidak ada hambatan.</p>') +
    card('Kapasitas PIC (kartu terbuka)', w.cap.length ? table(['PIC', 'Kartu terbuka', 'Beban'], w.cap.map(c => [esc(empName(c.emp)), c.open, c.open > 4 ? chip('Tinggi', 'bad') : chip('Wajar', 'ready')])) : '<p class="empty">Belum ada PIC.</p>') +
    card('Tindakan berikutnya', `<form class="workflow-form" data-submit="hr:weekly-action" data-after="hrd-task?id={id}"><input type="hidden" name="ws" value="${ws}"><label>Tindakan<input name="title" minlength="5" required placeholder="mis. Jadwalkan praktik kandidat Ubud"></label><label>PIC${picSel()}</label><label>Tenggat<input type="date" name="due" required></label><label>Sumber (Task/Finding ID)<input name="sourceId" placeholder="opsional, mis. TSK-0004"></label><button class="btn">Buat Workplan</button></form>` +
      `<div class="actions"><button type="button" class="btn ghost" data-action="hr:race-session" data-kind="Weekly" data-scope="${ws}" data-commits="${w.commit.map(t => t.id).join(',')}" data-after="hrd-race-weekly?ws=${ws}">Simpan review Weekly</button></div>`) + sessions('Weekly');
}

/* ---------- NV05 Monthly Reflection ---------- */
const sidOf = (r, period) => r.key.startsWith('UTIL-') ? `UTIL-${r.key.slice(5)}-2611` : `RFL-${period}-${r.key}`;
function reflectionPage(params) {
  const h = hr(), P = params.period === '2610' ? '2610' : '2611';
  let rows = HR8.reflection(h, P, role());
  if (SPV()) rows = rows.filter(r => !r.key.startsWith('UTIL-') || r.key === 'UTIL-OUT-UBD');
  if (params.sec) rows = rows.filter(r => r.sec === params.sec);
  const taskFor = (r) => h.f3.tasks.find(t => t.source?.id === sidOf(r, P));
  const decFor = (r) => f8().decisions.filter(d => d.criteria?.key === r.key);
  const notes = f8().notes.filter(n => n.period === P);
  const secs = ['Kapasitas', 'KPI', 'Talenta', 'SER', 'Biaya'];
  return demo(P === '2611' ? ' · November provisional' : ' · Oktober ditutup') + `<p class="active-filters">Periode: ${['2610', '2611'].map(k => k === P ? `<b>${HR8.PERIODS[k]}</b>` : link('hrd-race-reflection' + qs({ period: k }), HR8.PERIODS[k])).join(' · ')}</p>` +
    `<form id="filters" class="filters" aria-label="Filter reflection"><input type="hidden" name="period" value="${P}"><label>Bagian<select name="sec"><option value="">Semua</option>${secs.map(s => `<option ${params.sec === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    card(`Target & hasil · ${HR8.PERIODS[P]}${SPV() ? ' · cakupan Spa Ubud' : ''}`, rows.length ? table(['Bagian', 'Metrik', 'Target', 'Hasil', 'Selisih', 'Sumber', 'Tindak lanjut'], rows.map(r => r.hidden ? [r.sec, esc(r.label), '—', chip('Terbatas · Manager HRD', 'sandbox'), '—', 'F7 (agregat berizin)', '—'] : [r.sec, link(r.route, esc(r.label)), fmtV(r.target, r.unit === 'Rp' ? 'Rp' : r.unit), fmtV(r.actual, r.unit === 'Rp' ? 'Rp' : r.unit), esc(HR8.gapOf(r)), esc(r.source),
      (() => { const t = taskFor(r), ds = decFor(r); return '<span class="hr-acts">' + (t ? `${tlink(t.id)} ${chip(t.stage)}` : ['Ide', 'Issue', 'Workplan'].map(s => `<button type="button" class="btn ghost sm" data-action="hr:rfl-mark" data-key="${r.key}" data-period="${P}" data-stage="${s}" data-after="hrd-task?id={id}">${s}</button>`).join(' ')) + (ds.length ? ' · ' + ds.map(d => link('hrd-race-stracon' + qs({ id: d.id }), d.id)).join(', ') : LEAD() && t ? ' · ' + link('hrd-race-stracon' + qs({ new: 1, ckey: r.key, task: t.id, finding: t.finding || '', cperiod: '2612' }), 'Catat keputusan') : '') + '</span>'; })()])) : '<p class="empty">Tidak ada metrik untuk filter ini.</p>' +
      `<p class="muted small">Utility = F5 (Oktober = Beranda F1), XScore & pelatihan = F6, biaya = batch F7 periode yang sama. Penandaan ulang membuka kartu F3 yang sama.</p>`) +
    card('Catatan reflection', (notes.length ? table(['ID', 'Bagian', 'Jenis', 'Catatan', 'Bukti', 'Oleh', 'Waktu'], notes.map(n => [n.id, esc(n.sec), esc(n.kind), esc(n.text), esc(n.evidence), esc(n.by), esc(n.at)])) : '<p class="empty">Belum ada catatan untuk periode ini.</p>') +
      `<form class="workflow-form" data-submit="hr:rfl-note" data-after="hrd-race-reflection?period=${P}"><input type="hidden" name="period" value="${P}"><label>Bagian<select name="sec">${secs.map(s => `<option>${s}</option>`).join('')}</select></label><label>Jenis<select name="kind"><option>Penyebab selisih</option><option>Pembelajaran</option><option>Tindakan</option><option>Evaluasi berikutnya</option></select></label><label>Catatan<input name="text" minlength="5" required></label><label>Bukti<input name="evidence" placeholder="mis. UTIL-OUT-UBD-2611"></label><button class="btn ghost">Simpan catatan</button></form>`);
}

/* ---------- NV06 STRACON ---------- */
function stracon(params) {
  const h = hr(), ds = f8().decisions, d = params.id && ds.find(x => x.id === params.id);
  const keys = HR8.reflection(h, '2611', 'hrd').filter(r => !r.restricted);
  let body = card('Keputusan strategis', table(['Decision ID', 'Keputusan', 'Temuan', 'Pemilik', 'Tenggat', 'Kriteria', 'Workplan', 'Status'], ds.map(x => [link('hrd-race-stracon' + qs({ id: x.id }), x.id), esc(x.title), esc(x.finding || '—'), esc(empName(x.owner)), x.due, x.criteria ? `${x.criteria.key} ${x.criteria.op} ${x.criteria.value} (${x.criteria.period})` : '—', tlink(x.workplan || x.task), chip(x.status, x.status === 'Dievaluasi' ? 'ready' : 'planned')])));
  if (d) {
    const e = d.evaluation, now = HR8.evaluate(h, d);
    body = card(`${d.id} · ${esc(d.title)}`, table(['Field', 'Nilai'], [['Temuan', esc(d.finding || '—')], ['Kartu sumber', tlink(d.task)], ['Alternatif', d.alternatives.map(esc).join(' · ') || '—'], ['Dipilih', esc(d.chosen || '—')], ['Alasan', esc(d.reason)], ['Pemilik / tenggat', `${esc(empName(d.owner))} · ${d.due}`], ['Kriteria evaluasi (dicatat saat keputusan)', d.criteria ? `${esc(d.criteria.key)} ${d.criteria.op} ${d.criteria.value} pada ${HR8.PERIODS[d.criteria.period] || d.criteria.period}` : '—'], ['Hasil saat ini', now ? (now.actual === null ? chip('Data periode belum tersedia', 'sandbox') : `${esc(now.label)} ${now.actual} → ${now.met ? chip('Kriteria tercapai', 'ready') : chip('Belum tercapai', 'bad')}`) : '—'], ['Evaluasi tersimpan', e ? `${e.actual ?? '—'} · ${e.met === null ? 'data belum tersedia' : e.met ? 'tercapai' : 'belum tercapai'} · ${esc(e.by)} ${esc(e.at)}` : '—'], ['Workplan', d.workplan ? tlink(d.workplan) : '—'], ['Dicatat', `${esc(d.at)} · ${esc(d.by || 'seed')}`]])) +
      (LEAD() ? `<div class="actions">${d.workplan ? '' : `<button type="button" class="btn" data-action="hr:dec-workplan" data-id="${d.id}" data-after="hrd-task?id={id}">Buat Workplan</button>`}<button type="button" class="btn ghost" data-action="hr:dec-evaluate" data-id="${d.id}" data-after="hrd-race-stracon?id=${d.id}">Evaluasi terhadap kriteria</button></div>` : '') + `<p>${link('hrd-race-stracon', '‹ Semua keputusan')} · ${link('hrd-race-reflection', 'Monthly Reflection')}</p>` + body;
  }
  if (params.new && LEAD()) body = card('Keputusan baru', `<form class="workflow-form" data-submit="hr:dec-create" data-after="hrd-race-stracon?id={id}"><label>Keputusan<input name="title" minlength="5" required placeholder="mis. Tambah 2 therapist Spa Ubud"></label><label>Finding ID<input name="finding" value="${esc(params.finding || '')}"></label><label>Kartu sumber<input name="task" value="${esc(params.task || '')}"></label><label>Alternatif (pisahkan |)<input name="alternatives" placeholder="Lembur terjadwal|Bantuan Shanti|Rekrut 2 therapist"></label><label>Dipilih<input name="chosen"></label><label>Alasan<input name="reason" minlength="10" required></label><label>Pemilik${picSel('owner', 'EMP-0142')}</label><label>Tenggat<input type="date" name="due" required></label><label>Kriteria metrik<select name="ckey">${keys.map(r => `<option value="${r.key}" ${params.ckey === r.key ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}</select></label><label>Operator<select name="cop"><option value="<=">≤</option><option value=">=">≥</option></select></label><label>Nilai<input name="cvalue" type="number" step="0.1" value="100"></label><label>Periode evaluasi<select name="cperiod"><option value="2612">Desember 2026</option><option value="2611" ${params.cperiod === '2611' ? 'selected' : ''}>November 2026</option></select></label><button class="btn">Simpan keputusan</button></form>`) + body;
  return demo() + (LEAD() && !params.new ? `<div class="actions"><a class="btn" href="#hrd-race-stracon?new=1">Keputusan baru</a></div>` : '') + body;
}

/* ---------- NV07 e-Deck ---------- */
function deck(params) {
  const h = hr(), P = params.period === '2610' ? '2610' : '2611', scope = SPV() ? 'OUT-UBD' : (params.scope || 'all'), pg = Math.max(0, Math.min(7, Number(params.page || 0)));
  const snap = params.snap && f8().snapshots.find(s => s.id === params.snap);
  if (snap && snap.sensitive && !MGR() && params.export) return demo() + denied(`Snapshot ${esc(snap.id)} memuat agregat biaya. Ekspor hanya untuk Manager HRD; hak diperiksa ulang saat dibuka atau diekspor.`);
  const vals = snap ? snap.pages[pg].values : HR8.deckPage(h, pg, P, scope, role());
  const hidden = (v) => v.restricted && !MGR();
  const base = { period: snap ? snap.period : P, scope: snap ? snap.scope : scope, snap: snap?.id };
  const nav = `<nav class="tabs" aria-label="Halaman e-Deck">${HR8.PAGES.map((n, i) => `<a class="tab${i === pg ? ' on' : ''}" href="#hrd-race-deck${qs({ ...base, page: i })}" ${i === pg ? 'aria-current="page"' : ''}>${i + 1}. ${esc(n)}</a>`).join('')}</nav>`;
  const others = snap ? f8().snapshots.filter(s => s.base === snap.base) : [];
  return demo() + (snap ? `<p class="active-filters">${chip(`Snapshot ${snap.id}`, 'ready')} beku ${esc(snap.at)} · ${HR8.PERIODS[snap.period]} · scope ${esc(snap.scope === 'all' ? 'Semua outlet' : HR.locName(snap.scope))} · ${Object.entries(snap.versions).map(([k, v]) => `${k} ${v}`).join(' · ')} · ${esc(snap.completeness)} · ${link('hrd-race-deck' + qs({ period: snap.period }), 'Mode data terkini')}</p>` :
    `<form id="filters" class="filters" aria-label="Filter e-Deck"><input type="hidden" name="page" value="${pg}"><label>Periode<select name="period">${['2610', '2611'].map(k => `<option value="${k}" ${k === P ? 'selected' : ''}>${HR8.PERIODS[k]}</option>`).join('')}</select></label>${SPV() ? '<p>Scope: Spa Ubud (cakupan Supervisor)</p>' : `<label>Scope<select name="scope"><option value="all">Semua outlet</option>${HR.OUTLETS.map(o => `<option value="${o.id}" ${scope === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label>`}</form><p class="active-filters">Mode data terkini · sumber diperbarui 2026-11-13 07:00–08:00 WITA</p>`) + nav +
    card(`${pg + 1}/8 · ${esc(HR8.PAGES[pg])}`, vals.length ? table(['Metrik', 'Nilai', 'Sumber', 'Bukti'], vals.map(v => hidden(v) ? [esc(v.label), chip('Terbatas · Manager HRD', 'sandbox'), 'Agregat biaya F7', '—'] : [v.route ? link(v.route, esc(v.label)) : esc(v.label), fmtV(v.value, v.unit) + (v.corrected ? ` ${chip(`dikoreksi dari ${v.before}`, 'planned')}` : ''), esc(v.src), v.ev ? link('hrd-report-center' + qs({ ev: v.ev }), esc(v.ev)) : chip('Belum ada bukti', 'sandbox')])) : '<p class="empty">Tidak ada data untuk scope ini.</p>') +
    `<div class="actions">${pg > 0 ? `<a class="btn ghost" href="#hrd-race-deck${qs({ ...base, page: pg - 1 })}">‹ Sebelumnya</a>` : ''}${pg < 7 ? `<a class="btn ghost" href="#hrd-race-deck${qs({ ...base, page: pg + 1 })}">Berikutnya ›</a>` : ''}${snap ? `<a class="btn ghost" href="#hrd-race-deck${qs({ ...base, page: pg, export: 1 })}">Ekspor PDF (simulasi)</a>` : `<button type="button" class="btn" data-action="hr:deck-snapshot" data-period="${P}" data-scope="${scope}" data-after="hrd-race-deck?snap={id}&page=${pg}">Simpan snapshot sesi</button>`}</div>` +
    (snap && params.export ? card('Ekspor', `<p role="status">Ekspor ${esc(snap.id)} disiapkan (simulasi, tanpa file). Hak akses diperiksa: ${esc(def().label)}.</p>`) : '') +
    (snap ? card('Versi snapshot', table(['Snapshot', 'Versi', 'Merujuk', 'Waktu', 'Oleh'], others.map(s => [s.id === snap.id ? `<b>${s.id}</b>` : link('hrd-race-deck' + qs({ snap: s.id, page: pg }), s.id), `v${s.v}`, s.prev || '—', esc(s.at), esc(s.by)])) +
      (HR8.canSee(role()) && !['ops-manager'].includes(role()) ? `<form class="workflow-form" data-submit="hr:deck-snapshot" data-after="hrd-race-deck?snap={id}&page=${pg}"><input type="hidden" name="prev" value="${others[others.length - 1].id}"><input type="hidden" name="period" value="${snap.period}"><input type="hidden" name="scope" value="${snap.scope}"><input type="hidden" name="page" value="${pg}"><label>Field<select name="field">${vals.filter(v => !hidden(v)).map(v => `<option>${esc(v.label)}</option>`).join('')}</select></label><label>Nilai koreksi<input name="value" required></label><label>Alasan<input name="reason" minlength="10" required></label><button class="btn ghost">Simpan koreksi (versi baru)</button></form>` : '')) :
      card('Snapshot tersimpan', f8().snapshots.length ? table(['Snapshot', 'Periode', 'Scope', 'Waktu'], f8().snapshots.map(s => [link('hrd-race-deck' + qs({ snap: s.id }), s.id), HR8.PERIODS[s.period], esc(s.scope), esc(s.at)])) : '<p class="empty">Belum ada snapshot. Simpan snapshot saat review sesi.</p>'));
}

/* ---------- NV08 Pusat Laporan & Jejak Bukti ---------- */
function reportCenter(params) {
  const h = hr(); let L = HR8.catalog(h, role());
  if (SPV()) L = L.filter(r => r.outlet === 'OUT-UBD' || r.outlet === 'all' && !r.restricted);
  const r = params.id && L.find(x => x.id === params.id);
  if (params.ev) { const hit = L.filter(x => (x.evidence || '').includes(params.ev.replace('*', '')) || x.id.includes(params.ev)); if (hit.length === 1 && !params.id) return reportCenter({ ...params, id: hit[0].id, ev: '' }); }
  if (params.period) L = L.filter(x => x.period === params.period);
  if (params.unit) L = L.filter(x => x.unit === params.unit);
  if (params.outlet) L = L.filter(x => x.outlet === params.outlet);
  const stTone = { Lengkap: 'ready', Provisional: 'planned', 'Bukti kosong': 'bad', Kedaluwarsa: 'bad', Dikoreksi: 'planned', Snapshot: 'ready' };
  const st = (x) => x.denied ? chip('Akses ditolak', 'bad') : chip(x.status, stTone[x.status] || '');
  const res = (x) => x.denied ? '—' : fmtV(x.result, x.resultUnit || (typeof x.result === 'number' && x.id.startsWith('RPT-UTIL') ? '%' : ''));
  const units = [...new Set(HR8.catalog(h, role()).map(x => x.unit))];
  const trail = r ? card(`Jejak bukti · ${esc(r.id)}`, r.denied ? denied(`${esc(r.name)} memuat nominal payroll. Hanya Manager HRD yang membuka hasil dan bukti.`) : `<ol class="trail"><li><b>Laporan</b> ${esc(r.name)} · periode ${HR8.PERIODS[r.period] || r.period}</li><li><b>Metrik & versi formula</b> ${esc(r.version)}</li><li><b>Perhitungan</b> ${esc(r.formula)} = ${res(r)}</li><li><b>Bukti</b> ${r.evidence ? esc(r.evidence) : chip('Bukti kosong', 'bad')}</li><li><b>Sumber</b> ${link(r.route, 'Buka layar sumber')}</li><li><b>Diperbarui</b> ${esc(r.refreshed || '—')}${r.status === 'Kedaluwarsa' ? ' ' + chip('Lebih dari 30 hari', 'bad') : ''}${r.refreshCount ? ` · refresh ${r.refreshCount}× (${esc(r.refreshStatus)})` : ''}</li><li><b>Tindak lanjut</b> ${(() => { const ts = h.f3.tasks.filter(t => r.id.startsWith('RPT-UTIL') && t.source?.id === `UTIL-${r.outlet}-2611`); return ts.length ? ts.map(t => tlink(t.id)).join(', ') : r.id === 'RPT-RACE-HG' ? link('hrd-race-stracon', `${f8().decisions.length} keputusan STRACON`) : 'belum ada'; })()}</li></ol>` +
    `<div class="actions"><button type="button" class="btn ghost" data-action="hr:report-refresh" data-id="${r.id}" data-after="hrd-report-center?id=${r.id}">Perbarui laporan</button><button type="button" class="btn ghost" data-action="hr:report-refresh" data-id="${r.id}" data-fail="1" data-after="hrd-report-center?id=${r.id}">Simulasi sumber gagal</button></div><p class="muted small">Refresh ulang tidak menambah baris laporan maupun kartu tindak lanjut.</p>`) : '';
  return demo() + trail + `<form id="filters" class="filters" aria-label="Filter laporan"><label>Periode<select name="period"><option value="">Semua</option>${['2610', '2611'].map(k => `<option value="${k}" ${params.period === k ? 'selected' : ''}>${HR8.PERIODS[k]}</option>`).join('')}</select></label><label>Unit<select name="unit"><option value="">Semua</option>${units.map(u => `<option ${params.unit === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></label><label>Outlet<select name="outlet"><option value="">Semua</option><option value="all" ${params.outlet === 'all' ? 'selected' : ''}>Grup (semua outlet)</option>${HR.OUTLETS.map(o => `<option value="${o.id}" ${params.outlet === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    card(`Laporan & metrik · ${L.length}`, L.length ? table(['Report ID', 'Laporan', 'Periode', 'Versi formula', 'Hasil', 'Bukti', 'Diperbarui', 'Status'], L.map(x => [link('hrd-report-center' + qs({ id: x.id }), x.id), esc(x.name), HR8.PERIODS[x.period] || x.period, esc(x.version), res(x), x.denied ? '—' : esc(x.evidence || '—'), esc(x.refreshed || '—'), st(x)])) : '<div class="empty"><p>Tidak ada laporan untuk filter ini.</p><button type="button" class="btn ghost" data-action="filter-reset">Reset filter</button></div>');
}

/* ---------- sidebar & registrasi ---------- */
const items = H.PORTALS.HRD.items;
const it = items.find(i => i[0] === 'hrd-race'); if (it) { it[1] = 'AmbideX & Race'; it[2] = 'F8-NV01'; it[3] = 'ready'; it[4] = ''; }
const ir = items.findIndex(i => i[0] === 'hrd-race');
items.splice(ir + 1, 0, ['hrd-race-beacon', 'Race Beacon', 'F8-NV02', 'ready', '', 'sub'], ['hrd-race-daily', 'Daily Race', 'F8-NV03', 'ready', '', 'sub'], ['hrd-race-weekly', 'Weekly Race', 'F8-NV04', 'ready', '', 'sub'], ['hrd-race-reflection', 'Monthly Reflection', 'F8-NV05', 'ready', '', 'sub'], ['hrd-race-stracon', 'STRACON', 'F8-NV06', 'ready', '', 'sub'], ['hrd-race-deck', 'e-Deck Reflection', 'F8-NV07', 'ready', '', 'sub'], ['hrd-report-center', 'Pusat Laporan & Bukti', 'F8-NV08', 'ready', '', 'sub']);
Object.assign(H.PURPOSE, {
  'hrd-race': 'Objective, enam indikator Vegen, Race Goal, key metrics, target, aktual, bukti, bobot dan versi kontrak.',
  'hrd-race-beacon': 'Beacon unit dengan induk Vegen, inisiatif, PIC, tenggat, Task ID dan review Success Factors.',
  'hrd-race-daily': 'Komitmen My Day, selesai vs terverifikasi, terlambat, terblokir dan pekerjaan tambahan.',
  'hrd-race-weekly': 'Komitmen mingguan, kapasitas PIC, pekerjaan terbawa, hambatan dan tindakan berikutnya.',
  'hrd-race-reflection': 'Target/hasil SER, KPI, kapasitas, talenta dan biaya berizin; temuan menjadi kartu F3.',
  'hrd-race-stracon': 'Keputusan strategis, alternatif, alasan, pemilik, kriteria evaluasi, Workplan dan hasil.',
  'hrd-race-deck': 'Delapan halaman e-Deck dengan filter periode/scope, drill-down, snapshot berversi dan ekspor berizin.',
  'hrd-report-center': 'Laporan & metrik sampai versi formula, perhitungan, bukti, pembaruan dan tindak lanjut.'
});
H.SCREENS.push(...[['F8-NV01', 'Race Vegen', 'hrd-race'], ['F8-NV02', 'Race Beacon & Success Factors', 'hrd-race-beacon'], ['F8-NV03', 'Daily Race', 'hrd-race-daily'], ['F8-NV04', 'Weekly Race', 'hrd-race-weekly'], ['F8-NV05', 'Monthly Reflection', 'hrd-race-reflection'], ['F8-NV06', 'STRACON', 'hrd-race-stracon'], ['F8-NV07', 'e-Deck Reflection HRD', 'hrd-race-deck'], ['F8-NV08', 'Pusat Laporan & Jejak Bukti', 'hrd-report-center']].map(([c, t, r]) => [c, 'HRD · ' + t, 'HRD 8', r, 'ready', 'Manager HRD, Lead HG, Staf HRD, Owner (agregat), Supervisor (outlet)']));
register('hrd-race', guard(race), (p) => p.ind || 'Race Vegen');
register('hrd-race-beacon', guard(beacon), (p) => p.id || 'Race Beacon & Success Factors');
register('hrd-race-daily', guard(dailyPage), () => 'Daily Race');
register('hrd-race-weekly', guard(weeklyPage), () => 'Weekly Race');
register('hrd-race-reflection', guard(reflectionPage), () => 'Monthly Reflection');
register('hrd-race-stracon', guard(stracon), (p) => p.id || 'STRACON');
register('hrd-race-deck', guard(deck), (p) => p.snap || 'e-Deck Reflection HRD');
register('hrd-report-center', guard(reportCenter), (p) => p.id || 'Pusat Laporan & Jejak Bukti');
})();
