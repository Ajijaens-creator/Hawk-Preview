/* HAWK ERP · Portal HRD · F4 Rekrutmen sampai Penempatan — DATA DEMO / SIMULASI.
   NV01 Landing Karier (hrd-rec-profile, publik: karier.html) · NV02 Detail Lowongan (hrd-career-job) · NV03 Formulir (hrd-career-apply) ·
   NV04 Permintaan & Lowongan (hrd-rec-manage / hrd-rec-jobs) · NV05 Pipeline (hrd-rec-candidates) · NV06 Detail & AI Screening (hrd-rec-candidates?id=) ·
   NV07 Jadwal Interview · NV08 Interview & Praktik · NV09 Keputusan & Penawaran · NV10 Kontrak & Dokumen · NV11 Onboarding · NV12 Penempatan & Akun. */
(() => {
const H = window.HL;
const { esc, table, card, qs, link } = H;
const hr = () => { const h = HR.ensure(H.state); HR.EXT.ensure?.(h); return h; };
const f4 = () => hr().f4;
const role = () => H.prefs.role;
const def = () => HR.roleDef(role());
const chip = (t, tone = '') => `<span class="status-chip ${tone}">${esc(t)}</span>`;
const person = (id) => hr().people.find(p => p.id === id);
const empName = (id) => id ? (person(id)?.name || id) : '—';
const tabs = (route, cur, list, params = {}, key = 'tab') => `<nav class="tabs" aria-label="Bagian">${list.map(([k, l]) => `<a class="tab${k === cur ? ' on' : ''}" href="#${route}${qs({ ...params, [key]: k })}" ${k === cur ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
const denied = (why) => `<section class="card hr-denied" role="alert"><h2>Akses ditolak</h2><p>${why}</p><div class="actions"><button type="button" class="btn" data-hr-role="hrd">Ganti ke Manager HRD</button><button type="button" class="btn ghost" data-hr-role="hrd-ops">Ganti ke Staf HRD</button></div></section>`;
const register = (id, fn, title, code) => { H.REGISTRY[id] = fn; fn.title = title; if (code) fn.code = code; };
const empty = (title, body, reset = true) => `<section class="card hr-empty"><h2>${title}</h2><p>${body}</p>${reset ? '<button type="button" class="btn" data-action="filter-reset">Reset filter</button>' : ''}</section>`;
const KC = ['g-teal', 'g-violet', 'g-blue', 'g-gold'];
const kpiLinks = (es) => `<section class="grid g4 keep2 kpis">${es.map(([l, v, h, sub], i) => `<a class="kpi ${KC[i % 4]}" href="${h}"><div class="lbl">${l}</div><div class="val">${v}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</a>`).join('')}</section>`;
const REC_ROLES = ['owner', 'hrd', 'hrd-ops', 'hg-lead', 'ops-manager', 'outlet-spv'];
const staff = () => ['owner', 'hrd', 'hrd-ops'].includes(role());
const guard = (fn, roles = REC_ROLES) => (p) => roles.includes(role()) ? fn(p) : denied(`Role demo <b>${esc(def().label)}</b> tidak punya akses Rekrutmen. Tidak ada data kandidat yang dimuat.`);
const STAGE_TONE = (s) => HR4.ENDS.includes(s) ? 'bad' : s === 'Penempatan Aktif' ? 'ready' : ['Klarifikasi', 'Lamaran Masuk'].includes(s) ? 'sandbox' : 'planned';
const SCR_TONE = { Terpenuhi: 'ready', 'Perlu Klarifikasi': 'sandbox', 'Tidak Sesuai': 'bad' };
const vac = (id) => HR4.vacOf(hr(), id);
const cand = (id) => HR4.candOf(hr(), id);
const apps = () => HR4.scopeApps(hr(), role());
const appLink = (a, route = 'hrd-rec-candidates') => `<a href="#${route}${qs({ id: a.id })}">${a.id}</a>`;
const vacLabel = (v) => v ? `${esc(v.title)} · ${esc(HR.locName(v.location))}` : '—';
const flow = (a) => `<ol class="hr-steps hr-flow">${HR4.STAGES.map(s => `<li class="${s === a.stage ? 'on' : HR4.STAGES.indexOf(s) < HR4.STAGES.indexOf(a.stage) ? 'done' : ''}">${s}</li>`).join('')}${HR4.ENDS.includes(a.stage) ? `<li class="on bad">${a.stage}</li>` : ''}</ol>`;
const NAV = [['hrd-rec-candidates', 'Detail'], ['hrd-rec-schedule', 'Jadwal'], ['hrd-rec-interview', 'Interview'], ['hrd-rec-offer', 'Keputusan'], ['hrd-rec-contract', 'Kontrak'], ['hrd-rec-onboard', 'Onboarding'], ['hrd-rec-place', 'Penempatan']];
const appNav = (a, cur) => `<nav class="tabs" aria-label="Tahap lamaran">${NAV.map(([r, l]) => `<a class="tab${r === cur ? ' on' : ''}" href="#${r}${qs({ id: a.id })}">${l}</a>`).join('')}</nav>`;
const head = (a, cur) => { const c = cand(a.cand), v = vac(a.vac); return `<section class="card"><h2>${esc(c.name)} · ${a.id}</h2><p class="small">${esc(c.id)} · ${vacLabel(v)} · ${esc(v.id)} · kanal ${esc(a.channel)} · ${chip(a.stage, STAGE_TONE(a.stage))}</p>${flow(a)}${appNav(a, cur)}</section>`; };

/* ---------- NV01–NV03: pratinjau publik di dalam portal ---------- */
const R = { land: 'hrd-rec-profile', job: 'hrd-career-job', apply: 'hrd-career-apply', href: (r, p) => `#${r}${qs(p)}` };
const publicNote = `<p class="active-filters">Pratinjau halaman publik. Kandidat membuka <a href="karier.html" target="_blank" rel="noopener">karier.html</a> tanpa login internal. Lamaran masuk ke Pipeline yang sama.</p>`;
register('hrd-rec-profile', (p) => publicNote + HRCAREER.landing(hr(), p, R), () => 'Landing Karier');
register('hrd-career-job', (p) => publicNote + HRCAREER.job(hr(), p, R), (p) => p.id ? `Lowongan ${p.id}` : 'Detail Lowongan');
register('hrd-career-apply', (p) => publicNote + HRCAREER.apply(hr(), p, R, { after: 'hrd-career-apply?done={id}' }), () => 'Formulir Lamaran');

/* ---------- NV04 Permintaan Tenaga & Kelola Lowongan ---------- */
function manage(params) {
  const tab = params.tab === 'vac' ? 'vac' : 'req';
  const h = hr(), reqs = f4().reqs.filter(r => staff() || role() === 'ops-manager' ? true : role() === 'outlet-spv' ? r.outlet === 'OUT-UBD' : true);
  const canReq = ['owner', 'hrd', 'hrd-ops', 'ops-manager', 'outlet-spv'].includes(role());
  const top = tabs('hrd-rec-manage', tab, [['req', 'Permintaan tenaga'], ['vac', 'Lowongan']]);
  if (tab === 'req') {
    const nextStage = (r) => r.status !== 'Menunggu Persetujuan' ? '—' : r.approvals.length ? 'Manager HRD' : (HR.pos(r.position).division === 'DIV-OPS' ? 'Operational Manager' : 'Manager divisi');
    return top + (canReq ? card('Buat permintaan tenaga', `<form class="workflow-form" data-submit="hr:req-create"><label>Posisi<select name="position">${HR.POSITIONS.map(p => `<option value="${p.id}" ${p.id === (params.position || 'POS-THR') ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label><label>Outlet / lokasi<select name="outlet">${[...HR.OUTLETS, HR.HQ].map(o => `<option value="${o.id}" ${o.id === (params.outlet || 'OUT-UBD') ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label><label>Formasi<input type="number" name="count" min="1" max="20" value="${esc(params.count || 2)}"></label><label>Shift<select name="shift"><option>Pagi/Sore</option><option>Pagi</option><option>Sore</option><option>Kantor</option></select></label><label>Skill<input name="skills" placeholder="mis. hot stone"></label><label>Sumber kebutuhan<input name="source" value="${esc(params.source || 'Manual (F4)')}"></label><input type="hidden" name="task" value="${esc(params.task || '')}"><button class="btn">Ajukan</button></form><p class="muted small">Persetujuan: Operational Manager / Manager divisi → Manager HRD. Kebutuhan dari Manpower (F5) membawa sumber dan Task ID.</p>`) : '') +
      card(`Permintaan · ${reqs.length}`, table(['Requisition ID', 'Posisi', 'Outlet', 'Formasi', 'Sumber', 'Status', 'Tahap berikut', 'Lowongan', 'Aksi'], reqs.map(r => [r.id, esc(HR.pos(r.position).name), esc(HR.locName(r.outlet)), r.count, esc(r.source) + (r.task ? ` · ${link('hrd-task' + qs({ id: r.task }), r.task)}` : ''), chip(r.status, r.status === 'Disetujui' ? 'ready' : r.status === 'Ditolak' ? 'bad' : 'sandbox'), nextStage(r), r.vacancy ? `${link('hrd-career-job' + qs({ id: r.vacancy }), r.vacancy)} · ${esc(vac(r.vacancy)?.status || '')}` : '—',
        r.status === 'Menunggu Persetujuan' ? `<button type="button" class="btn sm" data-action="hr:req-approve" data-id="${r.id}">Setujui tahap</button>` : r.status === 'Disetujui' && !r.vacancy && staff() ? `<button type="button" class="btn sm" data-action="hr:vac-publish" data-req="${r.id}" data-after="hrd-rec-manage?tab=vac">Publikasikan</button> <button type="button" class="btn ghost sm" data-action="hr:vac-publish" data-req="${r.id}" data-mode="Internal">Internal</button>` : r.vacancy && vac(r.vacancy)?.status !== 'Dipublikasikan' && staff() ? `<button type="button" class="btn sm" data-action="hr:vac-publish" data-req="${r.id}">Publikasikan</button>` : '—'])));
  }
  const vs = h.vacancies.filter(v => staff() || /^OUT-/.test(v.location) && (role() !== 'outlet-spv' || v.location === 'OUT-UBD'));
  const cnt = (v) => f4().apps.filter(a => a.vac === v.id).length;
  return top + card(`Lowongan · ${vs.length}`, table(['Vacancy ID', 'Posisi', 'Outlet', 'Formasi', 'Status', 'Versi kriteria', 'Lamaran', 'Tautan & kanal', 'Aksi'], vs.map(v => [v.id, esc(v.title), esc(HR.locName(v.location)), v.count, chip(v.status, v.status === 'Dipublikasikan' ? 'ready' : v.status === 'Ditutup' ? 'bad' : 'sandbox'), 'v' + (v.criteriaVersion || 1), `<a href="#hrd-rec-candidates${qs({ vac: v.id })}">${cnt(v)}</a>`, v.status === 'Dipublikasikan' ? (v.channels || ['WEB']).map(c => link('hrd-career-job' + qs({ id: v.id, ch: c }), c)).join(' · ') : v.status === 'Ditutup' ? link('hrd-career-job' + qs({ id: v.id }), 'tautan lama') : '<i>tidak publik</i>', staff() && v.status === 'Dipublikasikan' ? `<button type="button" class="btn ghost sm" data-action="hr:vac-close" data-id="${v.id}">Tutup</button>` : '—']))) +
    '<p class="muted small">Draf dan lowongan internal tidak muncul di Landing Karier. Lowongan ditutup tetap terbuka dari tautan lama dengan status tidak menerima lamaran.</p>';
}

/* ---------- NV05 Pipeline ---------- */
function pipeline(params) {
  if (params.id) return detail(params);
  const list = apps().filter(a => (!params.vac || a.vac === params.vac) && (!params.position || vac(a.vac)?.position === params.position) && (!params.outlet || vac(a.vac)?.location === params.outlet) && (!params.ch || a.channel === params.ch) && (!params.stage || a.stage === params.stage) && (!params.clar || a.screening?.summary?.clar > 0 || a.stage === 'Klarifikasi'));
  const all = apps(), n = (fn) => all.filter(fn).length;
  const opts = (name, pairs, cur, label) => `<label>${label}<select name="${name}"><option value="">Semua</option>${pairs.map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const multi = {}; all.forEach(a => { multi[a.cand] = (multi[a.cand] || 0) + 1; });
  return kpiLinks([['Lamaran', all.length, '#hrd-rec-candidates', 'semua di cakupan'], ['Screening selesai', n(a => a.screening?.status === 'Selesai'), '#hrd-rec-candidates?stage=Screening'], ['Shortlist', n(a => a.stage === 'Shortlist'), '#hrd-rec-candidates?stage=Shortlist'], ['Undangan interview', n(a => a.interview), '#hrd-rec-schedule']]) +
    `<form id="filters" class="filters" aria-label="Filter kandidat">${opts('vac', [...new Set(all.map(a => a.vac))].map(v => [v, `${v} · ${vac(v)?.title}`]), params.vac, 'Lowongan')}${opts('outlet', [...new Set(all.map(a => vac(a.vac)?.location))].map(o => [o, HR.locName(o)]), params.outlet, 'Outlet')}${opts('ch', Object.entries(HR4.CHANNELS), params.ch, 'Kanal')}${opts('stage', [...HR4.STAGES, ...HR4.ENDS].map(s => [s, s]), params.stage, 'Tahap')}<label class="check"><input type="checkbox" name="clar" value="1" ${params.clar ? 'checked' : ''}> Perlu klarifikasi</label><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    (list.length ? card(`Pipeline · ${list.length}`, table(['Application ID', 'Kandidat', 'Lowongan', 'Kanal', 'Screening', 'Tahap', 'Dikirim'], list.map(a => [appLink(a), esc(cand(a.cand).name) + (multi[a.cand] > 1 ? ` <span class="status-chip planned" title="Satu profil, ${multi[a.cand]} lamaran">${multi[a.cand]} lamaran</span>` : ''), vacLabel(vac(a.vac)), esc(a.channel), a.screening?.status === 'Selesai' ? `${a.screening.summary.ok}✓ ${a.screening.summary.clar}? ${a.screening.summary.no}✗` : chip(a.screening?.status || 'Menunggu', a.screening?.status === 'Gagal' ? 'bad' : 'sandbox'), chip(a.stage, STAGE_TONE(a.stage)), a.submittedAt]))) : empty('Tidak ada kandidat', 'Filter ini tidak menemukan lamaran di cakupan Anda.'));
}

/* ---------- NV06 Detail Kandidat & AI Screening ---------- */
function detail(params) {
  const a = HR4.appOf(hr(), params.id); if (!a || !apps().includes(a)) return denied(`Lamaran ${esc(params.id)} di luar cakupan ${esc(def().label)} atau tidak ditemukan.`);
  const c = cand(a.cand), v = vac(a.vac), f = HR4.formOf(v.position), s = a.screening || {};
  const others = f4().apps.filter(x => x.cand === a.cand && x !== a);
  const ans = f.q.map(([k, l]) => [esc(l), `<span id="ans-${k}">${esc(a.answers[k] || '—')}</span>`]).concat([['Kesiapan shift', esc(a.answers.shiftReady || '—')], ['Siap mulai', esc(a.answers.startReady || '—')], ['Pilihan interview', esc(a.answers.ivPref || '—')], ['Ekspektasi gaji', def().payroll === 'detail' ? esc(a.answers.salary || '—') : '<i>Dibatasi · khusus Manager HRD</i>']]);
  const scr = s.status === 'Selesai' ? table(['Kriteria', 'Status', 'Bukti', 'Aksi'], s.items.map(i => [esc(i.label), chip(i.status, SCR_TONE[i.status]), i.evidence ? `<a href="#ans-${i.evidence.field}">${esc(i.evidence.field)}: ${esc(i.evidence.value || '(kosong)')}</a>` : '—', i.status === 'Perlu Klarifikasi' && staff() ? `<button type="button" class="btn sm" data-action="hr:app-clarify" data-id="${a.id}" data-item="${i.id}">Buat kartu klarifikasi</button>` : '—'])) + `<p class="small">Versi kriteria v${s.version} · dijalankan ${esc(s.at)} oleh ${esc(s.by)} · run ke-${s.runs}. Dikecualikan dari penilaian AI: ${HR4.EXCLUDED.join(', ')}.</p>`
    : s.status === 'Gagal' ? `<p class="hr-denied" role="alert">Screening gagal (simulasi): ${esc(s.error)}. Data lamaran tetap aman.</p>` : '<p>Screening menunggu antrean.</p>';
  return head(a, 'hrd-rec-candidates') + `<div class="grid g2">${card('Jawaban kandidat', table(['Pertanyaan', 'Jawaban'], ans) + `<p class="small">Sumber dijawab kandidat: ${esc(a.sourceAnswer || '—')} · kode kanal: ${esc(a.channel)}</p>` + (others.length ? `<p class="small">Profil yang sama juga melamar: ${others.map(o => appLink(o) + ' · ' + vacLabel(vac(o.vac))).join(', ')}</p>` : ''))}
    ${card('Dokumen', HR4.canSeeDocs(role()) ? table(['Dokumen', 'File'], a.docs.map(d => [esc(d.kind), esc(d.name)])) : '<p><i>Dokumen personal hanya untuk HRD.</i></p>')}</div>` +
    card(`AI Screening (simulasi) · ${esc(s.status || 'Menunggu')}`, scr + (staff() && !HR4.ENDS.includes(a.stage) ? `<div class="actions"><button type="button" class="btn" data-action="hr:screen-run" data-id="${a.id}">${s.status === 'Selesai' ? 'Jalankan ulang' : s.status === 'Gagal' ? 'Coba lagi' : 'Jalankan screening'}</button><button type="button" class="btn ghost sm" data-action="hr:screen-run" data-id="${a.id}" data-fail="1">Simulasikan gagal</button></div>` : '')) +
    (s.status === 'Selesai' && staff() && s.items.some(i => i.status === 'Perlu Klarifikasi') ? card('Catat jawaban klarifikasi', `<form class="workflow-form" data-submit="hr:app-answer"><input type="hidden" name="id" value="${a.id}"><label>Jawaban<select name="field">${f.q.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select></label><label>Nilai<input name="value" required></label><button class="btn ghost">Simpan & screening ulang</button></form>`) : '') +
    (a.clarify.length ? `<p>Kartu klarifikasi: ${a.clarify.map(t => link('hrd-task' + qs({ id: t }), t)).join(', ')}</p>` : '') +
    (staff() && !HR4.ENDS.includes(a.stage) && ['Screening', 'Klarifikasi', 'Lamaran Masuk'].includes(a.stage) ? card('Keputusan reviewer', `<div class="actions"><button type="button" class="btn" data-action="hr:app-stage" data-id="${a.id}" data-to="Shortlist">Shortlist</button><form class="inline-form" data-submit="hr:app-stage"><input type="hidden" name="id" value="${a.id}"><input type="hidden" name="to" value="Ditolak"><label class="sr" for="rj-${a.id}">Alasan</label><input id="rj-${a.id}" name="reason" placeholder="Alasan tidak lanjut" minlength="5" required><button class="btn ghost sm">Tidak lanjut</button></form></div><p class="muted small">Reviewer memutuskan shortlist sesuai kapasitas interview (3 kandidat per formasi). AI tidak memutuskan.</p>`) : '') +
    card('Histori tahap', table(['Waktu (WITA)', 'Oleh', 'Dari', 'Ke', 'Alasan'], a.history.slice().reverse().map(x => [x.at, esc(x.by), esc(x.from || '—'), esc(x.to), esc(x.reason || '—')])));
}

/* ---------- daftar per tahap untuk NV07–NV12 ---------- */
const stageList = (route, title, pred, cols, empMsg) => (params) => {
  if (params.id) return null;
  const list = apps().filter(pred);
  return list.length ? card(`${title} · ${list.length}`, table(['Application ID', 'Kandidat', 'Lowongan', ...cols.map(c => c[0])], list.map(a => [appLink(a, route), esc(cand(a.cand).name), vacLabel(vac(a.vac)), ...cols.map(c => c[1](a))]))) : empty('Belum ada data', empMsg, false);
};
const pick = (params, route) => { const a = HR4.appOf(hr(), params.id); if (!a || !apps().includes(a)) return [null, denied(`Lamaran ${esc(params.id)} di luar cakupan ${esc(def().label)} atau tidak ditemukan.`)]; return [a, head(a, route)]; };
const empOpt = (ids, cur) => ids.map(id => `<option value="${id}" ${id === cur ? 'selected' : ''}>${esc(empName(id))}</option>`).join('');

/* NV07 Jadwal Interview */
function schedule(params) {
  if (!params.id) return stageList('hrd-rec-schedule', 'Interview', a => a.interview || a.stage === 'Shortlist', [['Slot (WITA)', a => a.interview ? a.interview.slot : chip('Belum dijadwalkan', 'sandbox')], ['Event ID', a => a.interview?.eventId || '—'], ['Sinkron', a => a.interview ? chip(a.interview.sync === 'OK' ? 'Tersinkron' : 'Gagal', a.interview.sync === 'OK' ? 'ready' : 'bad') : '—'], ['Status', a => esc(a.interview?.status || '—')]], 'Belum ada kandidat shortlist.')(params);
  const [a, top] = pick(params, 'hrd-rec-schedule'); if (!a) return top; const iv = a.interview;
  return top + (iv ? card(`${iv.id} · Event ${iv.eventId}`, table(['Field', 'Nilai'], [['Slot', iv.slot + ' WITA'], ['Pewawancara', iv.interviewers.map(empName).map(esc).join(', ')], ['Konfirmasi kandidat', esc(iv.status)], ['Google Calendar', iv.sync === 'OK' ? chip('Tersinkron', 'ready') : chip('Gagal sinkron (simulasi)', 'bad')], ['Undangan terkirim', String(iv.invites ?? 1)], ['Meet', `<code>${esc(iv.meet)}</code>`]]) + (iv.sync !== 'OK' && staff() ? `<button type="button" class="btn" data-action="hr:iv-sync-retry" data-id="${a.id}">Coba sinkron lagi</button>` : '') + (iv.status !== 'Dikonfirmasi' ? ` <button type="button" class="btn ghost" data-action="hr:iv-confirm" data-id="${a.id}">Kandidat konfirmasi (simulasi)</button>` : '') + '<h3>Riwayat jadwal</h3>' + table(['Waktu', 'Oleh', 'Slot', 'Catatan'], iv.history.slice().reverse().map(x => [x.at, esc(x.by), x.slot, esc(x.note)]))) : '') +
    (staff() && ['Shortlist', 'Interview'].includes(a.stage) ? card(iv ? 'Jadwalkan ulang' : 'Jadwalkan interview', `<form class="workflow-form" data-submit="hr:iv-schedule"><input type="hidden" name="id" value="${a.id}"><label>Slot WITA<input name="slot" value="${esc(iv?.slot || a.answers.ivPref || '2026-11-17 10:00')}" required></label><label>Pewawancara 1<select name="iv1">${empOpt(['EMP-0145', 'EMP-0143', 'EMP-0142'], iv?.interviewers[0])}</select></label><label>Pewawancara 2<select name="iv2"><option value="">—</option>${empOpt(['EMP-0153', 'EMP-0154', 'EMP-0155', 'EMP-0156', 'EMP-0144'], iv?.interviewers[1])}</select></label><label class="check"><input type="checkbox" name="fail" value="1"> Simulasikan gagal sinkron</label><button class="btn">${iv ? 'Simpan jadwal ulang' : 'Jadwalkan'}</button></form><p class="muted small">Penjadwalan ulang memakai Event ID yang sama. Google Calendar/Meet: NEW INTEGRATION REQUIRED (simulasi).</p>`) : '');
}
/* NV08 Interview & Uji Praktik */
function interview(params) {
  if (!params.id) return stageList('hrd-rec-interview', 'Interview & praktik', a => a.interview, [['Rubric', a => a.rubric ? `rata-rata ${a.rubric.avg}` : chip('Belum dinilai', 'sandbox')], ['Tahap', a => chip(a.stage, STAGE_TONE(a.stage))]], 'Belum ada interview terjadwal.')(params);
  const [a, top] = pick(params, 'hrd-rec-interview'); if (!a) return top;
  const rb = HR4.formOf(vac(a.vac).position).rubric, isT = vac(a.vac).position === 'POS-THR';
  const canScore = ['owner', 'hrd', 'hrd-ops', 'hg-lead', 'outlet-spv'].includes(role());
  return top + card(`Rubric ${isT ? 'Therapist: demonstrasi treatment & kebersihan' : vac(a.vac).position === 'POS-RCP' ? 'Receptionist: simulasi reservasi, tamu & transaksi' : 'posisi'}`, a.rubric ? table(['Kompetensi', 'Skor'], a.rubric.items.map(i => [esc(i.label), `${i.score} / 5`])) + `<p class="small">Rata-rata ${a.rubric.avg} · ${esc(a.rubric.by)} · ${a.rubric.at} · bukti: ${esc(a.rubric.evidence)} · catatan: ${esc(a.rubric.note)}</p>` : (a.interview && canScore && !HR4.ENDS.includes(a.stage) ? `<form class="workflow-form" data-submit="hr:iv-score"><input type="hidden" name="id" value="${a.id}">${rb.map((l, i) => `<label>${esc(l)}<select name="s${i}"><option value="">—</option>${[1, 2, 3, 4, 5].map(n => `<option>${n}</option>`).join('')}</select></label>`).join('')}<label>Bukti<input name="evidence" value="Video praktik (sintetis)"></label><label class="wide">Catatan penilai<input name="note" required minlength="5"></label><button class="btn">Simpan penilaian</button></form>` : '<p>Belum dinilai.</p>'));
}
/* NV09 Keputusan & Penawaran */
function offer(params) {
  if (!params.id) return stageList('hrd-rec-offer', 'Keputusan & penawaran', a => a.rubric || a.decision, [['Rubric', a => a.rubric ? String(a.rubric.avg) : '—'], ['Keputusan', a => a.decision ? chip(a.decision.value, a.decision.value === 'Diterima' ? 'ready' : 'bad') : chip('Menunggu', 'sandbox')], ['Penawaran', a => esc(a.offer?.status || '—')]], 'Belum ada kandidat dengan penilaian.')(params);
  const [a, top] = pick(params, 'hrd-rec-offer'); if (!a) return top;
  const mgr = ['owner', 'hrd'].includes(role()), d = a.decision, o = a.offer;
  return top + card('Keputusan', (a.rubric ? `<p>Bukti penilaian: rubric rata-rata <b>${a.rubric.avg}</b> (${esc(a.rubric.by)}) · ${link('hrd-rec-interview' + qs({ id: a.id }), 'lihat rubric')}</p>` : '<p>Belum ada penilaian.</p>') + (d ? table(['Keputusan', 'Alasan', 'Oleh', 'Waktu'], [[chip(d.value, d.value === 'Diterima' ? 'ready' : 'bad'), esc(d.reason), esc(d.by), d.at], ...d.history.slice().reverse().map(x => [`<s>${esc(x.value)}</s>`, esc(x.reason), esc(x.by), x.at])]) : '') +
    (mgr && a.rubric && !HR4.ENDS.includes(a.stage) && (!o || o.status !== 'Diterima kandidat') ? `<form class="workflow-form" data-submit="hr:rec-decide"><input type="hidden" name="id" value="${a.id}"><label>Keputusan<select name="value"><option>Diterima</option><option>Ditolak</option></select></label><label class="wide">Alasan<input name="reason" required minlength="5"></label><button class="btn">${d ? 'Ubah keputusan' : 'Simpan keputusan'}</button></form>` : (!mgr ? '<p class="muted small">Keputusan oleh Manager HRD.</p>' : ''))) +
    (d?.value === 'Diterima' ? card('Penawaran', (o ? table(['Offer ID', 'Status', 'Mulai', 'Dikirim'], [[o.id, chip(o.status, o.status === 'Diterima kandidat' ? 'ready' : o.status === 'Ditolak kandidat' ? 'bad' : 'sandbox'), o.start, o.sent]]) + table(['Waktu', 'Oleh', 'Catatan'], o.history.slice().reverse().map(x => [x.at, esc(x.by), esc(x.note)])) : '') +
      (mgr && (!o || o.status === 'Terkirim') && !HR4.ENDS.includes(a.stage) ? `<form class="workflow-form" data-submit="hr:offer-send"><input type="hidden" name="id" value="${a.id}"><label>Tanggal mulai<input type="date" name="start" value="${o?.start || HR4.addDays(HR.TODAY, 14)}" required></label><button class="btn ghost">${o ? 'Kirim ulang' : 'Kirim penawaran'}</button></form>` : '') +
      (o?.status === 'Terkirim' ? `<div class="actions"><button type="button" class="btn" data-action="hr:offer-respond" data-id="${a.id}" data-answer="accept" data-after="hrd-rec-contract?id=${a.id}">Kandidat menerima (simulasi)</button><button type="button" class="btn ghost" data-action="hr:offer-respond" data-id="${a.id}" data-answer="decline">Kandidat menolak</button></div>` : '') + '<p class="muted small">Status akhir terpisah: Ditolak (keputusan), Batal (HRD), Mengundurkan diri (kandidat).</p>') : '') +
    (staff() && !HR4.ENDS.includes(a.stage) && !a.emp ? `<form class="inline-form" data-submit="hr:app-stage"><input type="hidden" name="id" value="${a.id}"><select name="to" aria-label="Status akhir"><option>Batal</option><option>Mengundurkan diri</option></select><input name="reason" placeholder="Alasan" required minlength="5" aria-label="Alasan"><button class="btn ghost sm">Catat</button></form>` : '');
}
/* NV10 Kontrak & Verifikasi Dokumen */
function contract(params) {
  if (!HR4.canSeeDocs(role())) return denied(`Kontrak dan dokumen identitas hanya untuk HRD. ${esc(def().label)} di luar cakupan.`);
  if (!params.id) return stageList('hrd-rec-contract', 'Kontrak', a => a.contract, [['Contract ID', a => `${a.contract.id} v${a.contract.version}`], ['Tanda tangan', a => chip(a.contract.sign, a.contract.sign === 'Ditandatangani' ? 'ready' : 'sandbox')], ['Employee ID', a => a.emp ? link('hrd-roster' + qs({ emp: a.emp }), a.emp) : '—']], 'Belum ada penawaran yang diterima.')(params);
  const [a, top] = pick(params, 'hrd-rec-contract'); if (!a) return top; const c = a.contract;
  if (!c) return top + empty('Belum ada kontrak', 'Kontrak dibuat setelah kandidat menerima penawaran.', false);
  return top + card(`${c.id} · v${c.version} · ${esc(c.type)}`, table(['Field', 'Nilai'], [['Tanggal efektif', c.effective], ['Tanda tangan', chip(c.sign, c.sign === 'Ditandatangani' ? 'ready' : 'sandbox') + (c.signedAt ? ' · ' + c.signedAt : '')], ['Employee ID', a.emp ? link('hrd-roster' + qs({ emp: a.emp }), a.emp) : 'Dibuat setelah tanda tangan']]) +
    '<h3>Verifikasi dokumen</h3>' + table(['Dokumen', 'Status', 'Oleh', 'Aksi'], c.docs.map(d => [d.kind + ' (sintetis)', chip(d.status, d.status === 'Terverifikasi' ? 'ready' : 'sandbox'), esc(d.by || '—'), d.status !== 'Terverifikasi' ? `<button type="button" class="btn sm" data-action="hr:doc-verify" data-id="${a.id}" data-kind="${d.kind}">Verifikasi</button>` : '—'])) +
    (c.sign !== 'Ditandatangani' ? `<div class="actions"><button type="button" class="btn" data-action="hr:contract-sign" data-id="${a.id}">Tanda tangan (simulasi e-sign)</button><form class="inline-form" data-submit="hr:contract-revise"><input type="hidden" name="id" value="${a.id}"><input name="note" placeholder="Catatan revisi" aria-label="Catatan revisi"><button class="btn ghost sm">Revisi versi</button></form></div>` : '') +
    '<h3>Jejak kontrak</h3>' + table(['Waktu', 'Oleh', 'Catatan'], c.history.slice().reverse().map(x => [x.at, esc(x.by), esc(x.note)])) + '<p class="muted small">Penyimpanan dokumen & tanda tangan elektronik: NEW INTEGRATION REQUIRED.</p>');
}
/* NV11 Onboarding */
function onboard(params) {
  if (!params.id) return stageList('hrd-rec-onboard', 'Onboarding', a => a.emp, [['Employee ID', a => link('hrd-roster' + qs({ emp: a.emp }), a.emp)], ['Paket', a => a.onboarding ? link('hrd-task' + qs({ id: a.onboarding }), a.onboarding) : chip('Belum dibuat', 'sandbox')], ['Mulai', a => a.offer?.start || '—']], 'Belum ada kandidat yang dikonversi menjadi karyawan.')(params);
  const [a, top] = pick(params, 'hrd-rec-onboard'); if (!a) return top;
  const t = a.onboarding && hr().f3?.tasks.find(x => x.id === a.onboarding);
  const subs = t ? hr().f3.tasks.filter(x => x.parent === t.id) : [];
  return top + card('Paket onboarding HRD & Human Growth', t ? `<p>Kartu induk ${link('hrd-task' + qs({ id: t.id }), t.id)} · ${esc(t.source.label)} · tahap ${esc(t.stage)}</p>` + table(['Subtugas', 'Tim', 'PIC', 'Tenggat', 'Tahap'], subs.map(s => [link('hrd-task' + qs({ id: s.id }), s.id) + ' ' + esc(s.title), s.ws, esc(empName(s.pic)), s.due, chip(s.stage, s.stage === 'Selesai' ? 'ready' : 'planned')])) + '<p class="muted small">Tugas HRD (administrasi), HG (kompetensi & mentor) dan verifikasi Supervisor tampil di Planner F3.</p>'
    : a.emp && staff() ? `<button type="button" class="btn" data-action="hr:onboard-create" data-id="${a.id}">Buat paket onboarding</button><p class="muted small">Membuat kartu dari template Onboarding versi aktif. Mengulang membuka tugas yang sama.</p>` : '<p>Onboarding dibuat setelah kontrak ditandatangani.</p>');
}
/* NV12 Penempatan, Akun & Role */
function place(params) {
  if (!params.id) return stageList('hrd-rec-place', 'Penempatan', a => a.emp, [['Employee ID', a => link('hrd-roster' + qs({ emp: a.emp }), a.emp)], ['Status', a => a.placement ? chip(a.placement.status, a.placement.status === 'Aktif' ? 'ready' : 'planned') : chip('Menunggu persetujuan', 'sandbox')], ['Efektif', a => a.offer?.start || '—']], 'Belum ada karyawan baru dari rekrutmen.')(params);
  const [a, top] = pick(params, 'hrd-rec-place'); if (!a) return top;
  if (!a.emp) return top + empty('Belum ada profil', 'Penempatan setelah kontrak ditandatangani.', false);
  const h = hr(), pl = HR.placementOn(h, a.emp) || HR.upcomingOf(h, a.emp), sup = HR.supervisorOf(h, a.emp), acc = h.accounts.find(x => x.emp === a.emp);
  return top + card(`Penempatan ${a.emp}`, table(['Field', 'Nilai'], [['Outlet', esc(HR.locName(pl.location))], ['Posisi', esc(HR.pos(pl.position).name)], ['Shift', esc(HR2.scheduleOn(h, a.emp, pl.from)?.shift || '—')], ['Atasan', esc(empName(sup))], ['Tanggal efektif', pl.from], ['Assignment ID (F2)', pl.id], ['Akun', `${esc(acc?.role === 'ess' ? 'Karyawan (ESS)' : acc?.role || '—')} · workplace ESS + POS outlet`], ['Status', a.placement ? chip(a.placement.status, a.placement.status === 'Aktif' ? 'ready' : 'planned') + ` · disetujui ${esc(a.placement.approvedBy)}` : chip('Menunggu persetujuan', 'sandbox')]]) +
    (!a.placement && ['owner', 'hrd'].includes(role()) ? `<form class="workflow-form" data-submit="hr:place-approve"><input type="hidden" name="id" value="${a.id}"><label>Role akun<select name="accRole"><option value="ess">Karyawan (ESS)</option></select></label><button class="btn">Setujui penempatan & akun</button></form>` : '') +
    `<p>${link('hrd-roster' + qs({ emp: a.emp }), 'Buka profil di Direktori')} · ${link('hrd-audit' + qs({ q: a.emp }), 'Audit')}</p><p class="muted small">Provisioning akun produksi: TO VERIFY (HAWK akun). Preview mengubah role demo saja.</p>`);
}

/* ---------- sidebar & registrasi ---------- */
const items = H.PORTALS.HRD.items;
const set = (route, code, title) => { const it = items.find(i => i[0] === route); if (it) { it[2] = code; it[3] = 'ready'; it[4] = ''; if (title) it[1] = title; } };
set('hrd-recruit', 'F4-NV05'); set('hrd-rec-profile', 'F4-NV01', 'Profil · Karier'); set('hrd-rec-manage', 'F4-NV04'); set('hrd-rec-jobs', 'F4-NV04'); set('hrd-rec-candidates', 'F4-NV05');
const ix = items.findIndex(i => i[0] === 'hrd-rec-candidates');
items.splice(ix + 1, 0, ['hrd-rec-schedule', 'Jadwal Interview', 'F4-NV07', 'ready', '', 'sub'], ['hrd-rec-interview', 'Interview & Praktik', 'F4-NV08', 'ready', '', 'sub'], ['hrd-rec-offer', 'Keputusan & Penawaran', 'F4-NV09', 'ready', '', 'sub'], ['hrd-rec-contract', 'Kontrak & Dokumen', 'F4-NV10', 'ready', '', 'sub'], ['hrd-rec-onboard', 'Onboarding', 'F4-NV11', 'ready', '', 'sub'], ['hrd-rec-place', 'Penempatan & Akun', 'F4-NV12', 'ready', '', 'sub'], ['hrd-career-job', 'Detail Lowongan', 'F4-NV02', 'hidden'], ['hrd-career-apply', 'Formulir Lamaran', 'F4-NV03', 'hidden']);
Object.assign(H.PURPOSE, {
  'hrd-rec-profile': 'Landing karier publik: lowongan aktif dengan filter divisi, posisi dan outlet. Halaman publik: karier.html.',
  'hrd-career-job': 'Tanggung jawab, kualifikasi, outlet, shift, tombol Lamar, tautan & kode kanal.',
  'hrd-career-apply': 'Formulir per posisi (Therapist/Receptionist berbeda), tinjau sebelum kirim, konfirmasi. Retry tidak membuat lamaran ganda.',
  'hrd-rec-manage': 'Permintaan tenaga per outlet/divisi dengan persetujuan, lalu publikasi lowongan dengan tautan dan kanal.',
  'hrd-rec-jobs': 'Daftar lowongan: status, versi kriteria, jumlah lamaran, tautan per kanal.',
  'hrd-recruit': 'Pipeline kandidat: lamaran, screening, shortlist dan undangan interview.',
  'hrd-rec-candidates': 'Pipeline kandidat dan detail AI screening dengan bukti per kriteria.',
  'hrd-rec-schedule': 'Slot WITA, pewawancara, konfirmasi, Event ID kalender dan riwayat jadwal.',
  'hrd-rec-interview': 'Rubric interview & uji praktik per posisi dengan bukti dan catatan.',
  'hrd-rec-offer': 'Keputusan berbukti, penawaran, respons kandidat dan tanggal mulai.',
  'hrd-rec-contract': 'Versi kontrak, verifikasi KTP/foto, tanda tangan dan konversi ke Employee ID.',
  'hrd-rec-onboard': 'Paket onboarding HRD & HG sebagai kartu Planner F3.',
  'hrd-rec-place': 'Outlet, posisi, shift, atasan, tanggal efektif dan akun yang disetujui.'
});
H.SCREENS.push(...[['F4-NV01', 'Landing Karier', 'hrd-rec-profile'], ['F4-NV02', 'Detail Lowongan', 'hrd-career-job?id=VAC-2611-001'], ['F4-NV03', 'Formulir Lamaran', 'hrd-career-apply?id=VAC-2611-001'], ['F4-NV04', 'Permintaan Tenaga & Lowongan', 'hrd-rec-manage'], ['F4-NV05', 'Pipeline Kandidat', 'hrd-rec-candidates'], ['F4-NV06', 'Detail Kandidat & AI Screening', 'hrd-rec-candidates?id=APP-2611-0001'], ['F4-NV07', 'Jadwal Interview', 'hrd-rec-schedule'], ['F4-NV08', 'Interview & Uji Praktik', 'hrd-rec-interview'], ['F4-NV09', 'Keputusan & Penawaran', 'hrd-rec-offer'], ['F4-NV10', 'Kontrak & Dokumen', 'hrd-rec-contract'], ['F4-NV11', 'Onboarding', 'hrd-rec-onboard'], ['F4-NV12', 'Penempatan & Akun', 'hrd-rec-place']].map(([c, t, r]) => [c, 'HRD · ' + t, 'HRD 4', r, 'ready', 'HRD, Recruiter, Supervisor, kandidat (publik)']));
const pipe = guard(pipeline);
register('hrd-recruit', pipe, () => 'Pipeline Kandidat');
register('hrd-rec-candidates', pipe, (p) => p.id ? 'Detail Kandidat & AI Screening' : 'Pipeline Kandidat'); H.REGISTRY['hrd-rec-candidates'].code = (p) => p.id ? 'F4-NV06' : 'F4-NV05';
register('hrd-rec-manage', guard(manage), () => 'Permintaan Tenaga & Kelola Lowongan');
register('hrd-rec-jobs', guard((p) => manage({ ...p, tab: 'vac' })), () => 'Lowongan Pekerjaan');
register('hrd-rec-schedule', guard(schedule), () => 'Jadwal Interview');
register('hrd-rec-interview', guard(interview), () => 'Interview & Uji Praktik');
register('hrd-rec-offer', guard(offer), () => 'Keputusan & Penawaran');
register('hrd-rec-contract', guard(contract), () => 'Kontrak & Verifikasi Dokumen');
register('hrd-rec-onboard', guard(onboard), () => 'Onboarding HRD & Human Growth');
register('hrd-rec-place', guard(place), () => 'Penempatan, Akun & Role');
})();
