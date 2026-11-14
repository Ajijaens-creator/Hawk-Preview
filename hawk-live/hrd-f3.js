/* JAENS ERP · Portal HRD · F3 Planner & Workspace — DATA DEMO / SIMULASI.
   F3-NV01 Workspace (hrd-tasks) · NV02 Board (hrd-board) · NV03 Calendar (hrd-calendar) · NV04 List (hrd-list) ·
   NV05 Library (hrd-library) · NV06 My Tasks (hrd-mytasks) · NV07 My Day (hrd-myday) · NV08 Detail Kartu (hrd-task?id=).
   Model: hrd-f3-model.js (HR3). Satu Task ID dipakai di semua tampilan. */
(() => {
const H = window.HL;
const { esc, num, table, card, metrics, qs, link } = H;
const hr = () => { const h = HR.ensure(H.state); if (typeof HR2 !== 'undefined') HR2.ensure(h); HR3.ensure(h); return h; };
const f3 = () => hr().f3;
const role = () => H.prefs.role;
const def = () => HR.roleDef(role());
const me = () => hr().roleEmp[role()];
const chip = (t, tone = '') => `<span class="status-chip ${tone}">${esc(t)}</span>`;
const person = (id) => hr().people.find(p => p.id === id);
const empName = (id) => id ? (person(id)?.name || id) : '—';
const tabs = (route, cur, list, params = {}, key = 'tab') => `<nav class="tabs" aria-label="Bagian">${list.map(([k, l]) => `<a class="tab${k === cur ? ' on' : ''}" href="#${route}${qs({ ...params, [key]: k })}" ${k === cur ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
const denied = (why) => `<section class="card hr-denied" role="alert"><h2>Akses ditolak</h2><p>${why}</p><div class="actions"><button type="button" class="btn" data-hr-role="hrd">Ganti ke Manager HRD</button><button type="button" class="btn ghost" data-hr-role="hg-lead">Ganti ke Human Growth Lead</button></div></section>`;
const register = (id, fn, title, code) => { H.REGISTRY[id] = fn; fn.title = title; if (code) fn.code = code; };
const empty = (title, body, reset = true) => `<section class="card hr-empty"><h2>${title}</h2><p>${body}</p>${reset ? '<button type="button" class="btn" data-action="filter-reset">Reset filter</button>' : ''}</section>`;
const STAGE_TONE = { Ide: '', Issue: 'bad', Workplan: 'planned', Priority: 'sandbox', Dikerjakan: 'sandbox', Review: 'planned', Selesai: 'ready' };
const PRIO_TONE = { Tinggi: 'bad', Sedang: 'sandbox', Rendah: '' };
const scopeName = (s) => s === 'ENT-SPA' ? 'Semua outlet Spa' : s === 'ENT-HQ' ? 'Office' : HR.locName(s);
const guarded = (fn) => (p) => HR3.wsVisible(role()).length || hr().roleEmp[role()] && HR3.visible(hr(), role()).length ? fn(p) : denied(`Role demo <b>${esc(def().label)}</b> tidak punya workplace HRD atau Human Growth. Tidak ada kartu yang dimuat.`);
const KC = ['g-teal', 'g-violet', 'g-blue', 'g-gold'];
const kpiLinks = (es) => `<section class="grid g4 keep2 kpis">${es.map(([l, v, h, sub], i) => `<a class="kpi ${KC[i % 4]}" href="${h}"><div class="lbl">${l}</div><div class="val">${v}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</a>`).join('')}</section>`;
const taskLink = (t) => `<a href="#hrd-task${qs({ id: t.id })}">${t.id}</a>`;
const picOpts = (cur) => `<option value="">— tanpa PIC —</option>` + ['EMP-0142', 'EMP-0143', 'EMP-0144', 'EMP-0145', 'EMP-0151', 'EMP-0152', 'EMP-0153', 'EMP-0154', 'EMP-0155', 'EMP-0156'].map(id => `<option value="${id}" ${id === cur ? 'selected' : ''}>${esc(empName(id))} · ${esc(HR.pos((HR.placementOn(hr(), id) || {}).position)?.name || '')}</option>`).join('');

/* filter bersama Board / List: tetap terbawa saat membuka kartu */
function filterTasks(params) {
  const q = (params.q || '').toLowerCase();
  /* kartu Operasional Spa (JAENS Mobile) tidak memenuhi papan HRD/HG; tampil bila difilter ws=OPS atau untuk Supervisor/OM */
  return HR3.visible(hr(), role()).filter(t => (!params.ws ? (t.ws !== 'OPS' || ['outlet-spv', 'ops-manager'].includes(role())) : t.ws === params.ws) && (!params.outlet || t.scope === params.outlet) && (!params.pic || (params.pic === 'none' ? !t.pic : t.pic === params.pic)) && (!params.prio || t.prio === params.prio) && (!params.stage || t.stage === params.stage) &&
    (!params.only || (params.only === 'nopic' && !t.pic) || (params.only === 'overdue' && HR3.overdue(t)) || (params.only === 'review' && t.stage === 'Review') || (params.only === 'blocked' && t.blocker)) && (!q || `${t.id} ${t.title}`.toLowerCase().includes(q)));
}
function filterForm(params, route, extra = '') {
  const vis = HR3.visible(hr(), role());
  const pics = [...new Set(vis.map(t => t.pic).filter(Boolean))];
  const outs = [...new Set(vis.map(t => t.scope))];
  const sel = (name, opts, cur, all) => `<label>${all.split(' ')[1] ? all.replace('Semua ', '').replace(/^./, c => c.toUpperCase()) : all}<select name="${name}"><option value="">${all}</option>${opts.map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  return `<form id="filters" class="filters" aria-label="Filter tugas"><label>Cari<input name="q" value="${esc(params.q || '')}" placeholder="Task ID / judul"></label>
    ${sel('ws', HR3.wsVisible(role()).map(w => [w, HR3.WS[w].name]), params.ws, 'Semua workplace')}
    ${sel('outlet', outs.map(o => [o, scopeName(o)]), params.outlet, 'Semua cakupan')}
    ${sel('pic', [['none', 'Tanpa PIC'], ...pics.map(p => [p, empName(p)])], params.pic, 'Semua PIC')}
    ${sel('prio', HR3.PRIOS.map(p => [p, p]), params.prio, 'Semua prioritas')}${extra}
    ${params.only ? `<input type="hidden" name="only" value="${esc(params.only)}">` : ''}<button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>`;
}
const keepParams = (params) => { const k = { ...params }; delete k.id; delete k.tab; return k; };

/* ---------- NV01 Workspace ---------- */
function workplace(params) {
  const wsList = HR3.wsVisible(role()); const ws = wsList.includes(params.ws) ? params.ws : wsList[0];
  if (!ws) return denied('Tidak ada workplace dalam cakupan Anda.');
  const all = HR3.visible(hr(), role()).filter(t => t.ws === ws), open = all.filter(t => t.stage !== 'Selesai');
  const byPic = {}; open.forEach(t => { if (t.pic) byPic[t.pic] = (byPic[t.pic] || 0) + 1; });
  const handoff = open.filter(t => t.checklist.some(c => c.sub && f3().tasks.find(x => x.id === c.sub)?.ws !== t.ws));
  const L = (only, n) => `#hrd-list${qs({ ws, only })}`;
  const util = [['OUT-UBD', 106, 'Issue'], ['OUT-SHT', 66, 'Ide']].map(([o, u, stg]) => {
    const t = f3().tasks.find(x => x.source?.id === `UTIL-${o}-2611`);
    return [esc(HR.locName(o)), `${u}%`, u > 100 ? chip('Di atas 100%', 'bad') : chip('Di bawah 70%', 'sandbox'), t && HR3.scopeOk(hr(), role(), t) ? `${taskLink(t)} · ${chip(t.stage, STAGE_TONE[t.stage])}` : `<button type="button" class="btn sm" data-action="hr:task-create" data-ws="HRD" data-stage="${stg}" data-title="Utility ${esc(HR.locName(o))} ${u}%: ${u > 100 ? 'kapasitas therapist kurang' : 'di bawah ambang 70%'}" data-scope="${o}" data-source-id="UTIL-${o}-2611" data-source-type="Utility" data-source-label="Utility ${esc(HR.locName(o))} Nov 2026 · ${u}%" data-source-route="hrd-home?outlet=${o}" data-finding="FND-UTIL-${o.slice(4)}-2611" data-after="hrd-task?id={id}">Tandai sebagai ${stg}</button>`];
  });
  return tabs('hrd-tasks', ws, wsList.map(w => [w, HR3.WS[w].name]), {}, 'ws') +
    kpiLinks([['Kartu aktif', open.length, `#hrd-board${qs({ ws })}`], ['Tanpa PIC', open.filter(t => !t.pic).length, L('nopic')], ['Lewat tenggat', open.filter(HR3.overdue).length, L('overdue')], ['Terblokir', open.filter(t => t.blocker).length, L('blocked')], ['Menunggu review', open.filter(t => t.stage === 'Review').length, L('review')]]) +
    `<div class="grid g2">${card('Beban per PIC', Object.keys(byPic).length ? table(['PIC', 'Kartu aktif', ''], Object.entries(byPic).sort((a, b) => b[1] - a[1]).map(([p, n]) => [esc(empName(p)), n, `<a href="#hrd-list${qs({ ws, pic: p })}">Lihat</a>`])) : '<p>Belum ada kartu ber-PIC.</p>')}
    ${card('Temuan kapasitas (F5, sintetis)', table(['Outlet', 'Utility', 'Status', 'Kartu'], util) + '<p class="muted small">Penandaan ulang untuk sumber dan temuan yang sama membuka kartu yang sudah ada.</p>')}</div>` +
    card('Handoff lintas tim', handoff.length ? table(['Kartu', 'Judul', 'Subtugas tim lain'], handoff.map(t => [taskLink(t), esc(t.title), t.checklist.filter(c => c.sub).map(c => { const s = f3().tasks.find(x => x.id === c.sub); return s && s.ws !== t.ws ? `${link('hrd-task' + qs({ id: s.id }), s.id)} (${s.ws})` : ''; }).filter(Boolean).join(', ')])) : `<p>Belum ada handoff. Terapkan template onboarding di ${link('hrd-library', 'Library')} untuk membuat subtugas HRD dan HG.</p>`) +
    `<div class="actions">${link('hrd-board' + qs({ ws }), 'Board')} ${link('hrd-calendar', 'Calendar')} ${link('hrd-list' + qs({ ws }), 'List')} ${link('hrd-mytasks', 'My Tasks')} ${link('hrd-myday', 'My Day')}</div>`;
}

/* ---------- NV02 Board ---------- */
function board(params) {
  const list = filterTasks(params), kp = keepParams(params);
  const cardHtml = (t) => `<article class="hr-kcard${t.blocker ? ' blocked' : ''}" draggable="true" data-task="${t.id}" data-version="${t.version}" tabindex="0" aria-label="${esc(t.id)} ${esc(t.title)}">
    <a href="#hrd-task${qs({ ...kp, id: t.id })}" class="hr-kt"><b>${t.id}</b> ${esc(t.title)}</a>
    <div class="hr-kmeta">${chip(t.prio, PRIO_TONE[t.prio])} ${t.pic ? esc(empName(t.pic)) : chip('Tanpa PIC', 'bad')} ${t.due ? `<span class="${HR3.overdue(t) ? 'bad-text' : ''}">⏱ ${t.due}</span>` : ''} ${t.blocker ? chip('Blocker', 'bad') : ''} ${t.checklist.length ? `☑ ${t.checklist.filter(c => c.done).length}/${t.checklist.length}` : ''}</div>
    <form class="hr-move" data-submit="hr:task-move"><input type="hidden" name="id" value="${t.id}"><input type="hidden" name="version" value="${t.version}"><input type="hidden" name="via" value="menu"><label class="sr" for="mv-${t.id}">Pindahkan ${t.id} ke</label><select id="mv-${t.id}" name="to">${HR3.STAGES.map(s => `<option ${s === t.stage ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="btn ghost sm">Pindahkan</button></form></article>`;
  return filterForm(params, 'hrd-board') + `<p class="active-filters" role="status"><b>${list.length} kartu</b> · seret kartu ke kolom lain, atau pakai menu <i>Pindahkan</i> (keyboard/ponsel). Validasi sama untuk keduanya.</p>` +
    (list.length ? `<div class="hr-board" role="list">${HR3.STAGES.map(s => { const col = list.filter(t => t.stage === s); return `<section class="hr-col" data-stage="${s}" role="listitem" aria-label="Kolom ${s}"><h3>${s} <span class="muted">${col.length}</span></h3>${col.map(cardHtml).join('') || '<p class="muted small">Kosong</p>'}</section>`; }).join('')}</div>` : empty('Tidak ada kartu', 'Filter ini tidak menemukan kartu dalam cakupan Anda.'));
}
/* drag-and-drop memakai aksi yang sama dengan menu */
document.addEventListener('dragstart', (e) => { const c = e.target.closest?.('.hr-kcard'); if (!c) return; e.dataTransfer.setData('text/plain', JSON.stringify({ id: c.dataset.task, version: c.dataset.version })); c.classList.add('dragging'); });
document.addEventListener('dragend', (e) => { e.target.closest?.('.hr-kcard')?.classList.remove('dragging'); });
document.addEventListener('dragover', (e) => { const col = e.target.closest?.('.hr-col'); if (col) { e.preventDefault(); col.classList.add('over'); } });
document.addEventListener('dragleave', (e) => { e.target.closest?.('.hr-col')?.classList.remove('over'); });
document.addEventListener('drop', (e) => { const col = e.target.closest?.('.hr-col'); if (!col) return; e.preventDefault(); col.classList.remove('over'); try { const d = JSON.parse(e.dataTransfer.getData('text/plain')); H.apply('hr:task-move', { id: d.id, version: d.version, to: col.dataset.stage, via: 'drag' }); } catch (err) { /* abaikan */ } });

/* ---------- NV03 Calendar ---------- */
function calendar(params) {
  const ag = HR3.agenda(hr(), role()).filter(a => !params.kind || a.kind === params.kind);
  const days = []; for (let d = '2026-11-01'; d <= '2026-11-30'; d = HR3.addDays(d, 1)) days.push(d);
  const noDue = HR3.visible(hr(), role()).filter(t => !t.due && t.stage !== 'Selesai');
  return `<form id="filters" class="filters" aria-label="Filter kalender"><label>Jenis<select name="kind"><option value="">Sesi & tenggat</option><option ${params.kind === 'Sesi' ? 'selected' : ''}>Sesi</option><option ${params.kind === 'Tenggat' ? 'selected' : ''}>Tenggat</option></select></label><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    card('November 2026 · WITA', `<div class="hr-cal">${days.map(d => `<div class="hr-cal-d${d === HR.TODAY ? ' today' : ''}"><b>${+d.slice(8)}</b>${ag.filter(a => a.date === d).map(a => `<a href="#hrd-task${qs({ id: a.task })}" class="small hr-ag ${a.kind === 'Sesi' ? 'sesi' : 'due'}" title="${esc(a.title)}">${a.kind === 'Sesi' ? '● ' + a.time : '⏱'} ${a.task}</a>`).join('')}</div>`).join('')}</div><p class="muted small">● waktu sesi (interview, coaching, training) · ⏱ batas penyelesaian. Klik untuk membuka kartu.</p>`) +
    card('Agenda berurutan', ag.length ? table(['Tanggal', 'Waktu', 'Jenis', 'Kartu', 'Judul', 'Workspace'], ag.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(a => [a.date, a.time, a.kind === 'Sesi' ? chip('Sesi', 'planned') : chip('Tenggat', 'sandbox'), link('hrd-task' + qs({ id: a.task }), a.task), esc(a.title), a.ws])) : '<p>Tidak ada agenda.</p>') +
    (noDue.length ? `<p class="muted small">${noDue.length} kartu tanpa tenggat tetap tersedia di ${link('hrd-list' + qs({ only: '' }), 'List')} (${noDue.map(t => t.id).join(', ')}).</p>` : '');
}

/* ---------- NV04 List ---------- */
function list(params) {
  const rows = filterTasks(params), kp = keepParams(params);
  const only = (k, l) => `<a class="tab${params.only === k ? ' on' : ''}" href="#hrd-list${qs({ ...kp, only: params.only === k ? '' : k })}">${l}</a>`;
  return filterForm(params, 'hrd-list', `<label>Tahap<select name="stage"><option value="">Semua tahap</option>${HR3.STAGES.map(s => `<option ${s === params.stage ? 'selected' : ''}>${s}</option>`).join('')}</select></label>`) +
    `<nav class="tabs" aria-label="Filter cepat">${only('nopic', 'Tanpa PIC')}${only('overdue', 'Terlambat')}${only('review', 'Menunggu review')}${only('blocked', 'Terblokir')}</nav>` +
    `<p class="active-filters" role="status"><b>${rows.length} kartu</b> di cakupan ${esc(def().label)}.</p>` +
    (rows.length ? card('Daftar tugas', table(['Task ID', 'Judul', 'Cakupan', 'Jenis sumber', 'PIC', 'Prioritas', 'Tahap', 'Tenggat', 'Blocker'], rows.map(t => [`<a href="#hrd-task${qs({ ...kp, id: t.id })}">${t.id}</a>`, esc(t.title) + (t.parent ? ` <span class="muted small">↳ ${t.parent}</span>` : ''), esc(scopeName(t.scope)), esc(t.source?.type || '—'), t.pic ? esc(empName(t.pic)) : chip('Tanpa PIC', 'bad'), chip(t.prio, PRIO_TONE[t.prio]), chip(t.stage, STAGE_TONE[t.stage]), t.due ? (HR3.overdue(t) ? chip(t.due + ' · terlambat', 'bad') : t.due) : '—', t.blocker ? esc(t.blocker.reason) : '—']))) : empty('Tidak ada kartu', 'Kombinasi filter ini kosong.'));
}

/* ---------- NV05 Library ---------- */
function library(params) {
  const tps = f3().templates;
  if (params.id) {
    const tp = tps.find(t => t.id === params.id); if (!tp) return empty('Template tidak ditemukan', link('hrd-library', '‹ Library'), false);
    const used = f3().tasks.filter(t => t.source?.template === tp.id);
    const canWrite = ['owner', 'hrd', 'hrd-ops', 'hg-lead'].includes(role());
    const cand = [...HR.joiners(hr(), role()), ...HR.people(hr(), role()).filter(p => p.placement.position === 'POS-THR')].slice(0, 40);
    return card(`${tp.id} · ${esc(tp.name)} · v${tp.version}`, `<p>${chip(tp.kind, 'planned')} ${chip(HR3.WS[tp.ws].name)} ${tp.review ? chip('Wajib review', 'sandbox') : ''}</p>` +
      (tp.steps.length ? table(['#', 'Langkah', 'PIC (peran)', 'Tenggat relatif', 'Tim'], tp.steps.map((s, i) => [i + 1, esc(s[0]), esc(s[1]), (s[2] >= 0 ? 'H+' : 'H') + s[2], s[3]])) : '<p>Dokumen SOP (tanpa langkah). Pratinjau isi: dummy.</p>') +
      `<h3>Riwayat versi</h3>${table(['Versi', 'Tanggal', 'Catatan'], tp.history.map(h => ['v' + h.v, h.at, esc(h.note)]))}`) +
      (tp.steps.length && canWrite ? card('Terapkan sebagai Workplan', `<form class="workflow-form" data-submit="hr:template-apply" data-after="hrd-task?id={id}"><input type="hidden" name="template" value="${tp.id}"><label>Karyawan<select name="emp">${cand.map(p => `<option value="${p.id}">${p.id} · ${esc(p.name)}${p.placement.from > HR.TODAY ? ' (mulai ' + p.placement.from + ')' : ''}</option>`).join('')}</select></label><label>Hari H (mulai kerja)<input type="date" name="start" value="${HR3.addDays(HR.TODAY, 7)}" required></label><button class="btn">Buat kartu & subtugas</button></form><p class="muted small">Membuat 1 kartu induk dan ${tp.steps.length} subtugas dengan PIC berbasis peran dan tenggat relatif. Menerapkan lagi untuk orang dan tanggal yang sama membuka kartu yang sudah ada.</p>`) : '') +
      (['owner', 'hrd', 'hg-lead'].includes(role()) ? card('Terbitkan versi baru', `<form class="workflow-form" data-submit="hr:template-version"><input type="hidden" name="template" value="${tp.id}"><label>Langkah tambahan (opsional)<input name="step" placeholder="mis. Foto seragam & ID card"></label><label>Peran PIC<select name="picRole">${Object.keys(HR3.ROLE_PIC).map(r => `<option>${r}</option>`).join('')}</select></label><label>Tenggat relatif (hari)<input type="number" name="rel" value="0"></label><label>Catatan versi<input name="note" required minlength="5"></label><button class="btn">Terbitkan v${tp.version + 1}</button></form><p class="muted small">Versi baru berlaku pada penerapan berikutnya; kartu lama tetap merujuk versi saat dibuat.</p>`) : '') +
      card('Dipakai oleh', used.length ? table(['Kartu', 'Judul', 'Versi', 'Tahap'], used.map(t => [taskLink(t), esc(t.title), 'v' + t.source.templateVersion, chip(t.stage, STAGE_TONE[t.stage])])) : '<p>Belum pernah diterapkan.</p>') + link('hrd-library', '‹ Library');
  }
  return card('Library · versi aktif', table(['ID', 'Nama', 'Jenis', 'Workspace', 'Versi', 'Langkah', ''], tps.map(t => [t.id, esc(t.name), chip(t.kind, 'planned'), HR3.WS[t.ws].name, 'v' + t.version, t.steps.length || '—', link('hrd-library' + qs({ id: t.id }), 'Pratinjau')])));
}

/* ---------- NV06 My Tasks · NV07 My Day ---------- */
const focusBtn = (t) => { const on = HR3.focusOf(hr(), me()).some(x => x.id === t.id); return `<button type="button" class="btn ${on ? 'ghost ' : ''}sm" data-action="hr:focus-toggle" data-id="${t.id}">${on ? 'Lepas dari My Day' : '+ My Day'}</button>`; };
function myTasks() {
  if (!me()) return denied('Role ini tidak punya daftar tugas pribadi.');
  const mine = HR3.myTasks(hr(), role()), rev = HR3.reviewQueue(hr(), role());
  const subs = HR3.visible(hr(), role()).filter(t => t.checklist.some(c => c.pic === me() && !c.done) && t.pic !== me());
  return `<p class="active-filters"><b>${esc(empName(me()))}</b> · ${esc(def().label)}</p>` +
    card(`Tugas saya · ${mine.length}`, mine.length ? table(['Task ID', 'Judul', 'Tahap', 'Tenggat', 'Induk', 'My Day'], mine.map(t => [taskLink(t), esc(t.title), chip(t.stage, STAGE_TONE[t.stage]), t.due ? (HR3.overdue(t) ? chip(t.due, 'bad') : t.due) : '—', t.parent ? link('hrd-task' + qs({ id: t.parent }), t.parent) : '—', t.stage === 'Selesai' ? '—' : focusBtn(t)])) : '<p>Tidak ada tugas atas nama Anda.</p>') +
    card(`Antrean review · ${rev.length}`, rev.length ? table(['Task ID', 'Judul', 'PIC', 'Checklist'], rev.map(t => [taskLink(t), esc(t.title), esc(empName(t.pic)), `${t.checklist.filter(c => c.done).length}/${t.checklist.length}`])) : '<p>Tidak ada kartu menunggu review Anda.</p>') +
    (subs.length ? card('Butir checklist atas nama saya', table(['Kartu', 'Butir'], subs.flatMap(t => t.checklist.filter(c => c.pic === me() && !c.done).map(c => [taskLink(t), esc(c.text)])))) : '');
}
function myDay() {
  if (!me()) return denied('Role ini tidak punya My Day.');
  const foc = HR3.focusOf(hr(), me()), mine = HR3.myTasks(hr(), role());
  const ag = HR3.agenda(hr(), role()).filter(a => a.date === HR.TODAY || a.date === HR3.addDays(HR.TODAY, 1));
  const carried = mine.filter(t => HR3.overdue(t)), blocked = mine.filter(t => t.blocker);
  return `<p class="active-filters"><b>My Day · ${HR.TODAY} (Jumat) WITA</b> · ${esc(empName(me()))}. Fokus tidak mengubah tenggat, PIC atau status.</p>` +
    card(`Fokus hari ini · ${foc.length}`, foc.length ? table(['Task ID', 'Judul', 'Tahap', 'Tenggat', 'PIC', ''], foc.map(t => [taskLink(t), esc(t.title), chip(t.stage, STAGE_TONE[t.stage]), t.due || '—', esc(empName(t.pic)), focusBtn(t)])) : `<p>Belum ada fokus. Tambahkan dari ${link('hrd-mytasks', 'My Tasks')}.</p>`) +
    `<div class="grid g2">${card('Agenda hari ini & besok', ag.length ? table(['Tanggal', 'Waktu', 'Jenis', 'Kartu'], ag.map(a => [a.date, a.time, a.kind, link('hrd-task' + qs({ id: a.task }), a.task)])) : '<p>Tidak ada agenda.</p>')}${card('Hambatan', blocked.length ? table(['Kartu', 'Blocker', 'Menunggu'], blocked.map(t => [taskLink(t), esc(t.blocker.reason), esc(empName(t.blocker.waiting))])) : '<p>Tidak ada blocker.</p>')}</div>` +
    card('Pekerjaan terbawa (lewat tenggat)', carried.length ? table(['Kartu', 'Judul', 'Tenggat asal', 'My Day'], carried.map(t => [taskLink(t), esc(t.title), chip(t.due, 'bad'), focusBtn(t)])) : '<p>Tidak ada pekerjaan terbawa.</p>');
}

/* ---------- NV08 Detail Kartu ---------- */
function detail(params) {
  const t = f3().tasks.find(x => x.id === params.id);
  if (!t) return empty('Kartu tidak ditemukan', link('hrd-list', '‹ List'), false);
  if (!HR3.scopeOk(hr(), role(), t)) return denied(`Kartu ${esc(t.id)} di luar cakupan ${esc(def().label)}${t.source?.sensitive ? ' (sumber payroll khusus Manager HRD)' : ''}.`);
  const tab = ['preview', 'files', 'discussion', 'checklist', 'history'].includes(params.tab) ? params.tab : 'preview';
  const kp = keepParams(params), back = params.from === 'board' || params.ws || params.only ? '' : '';
  const ro = !['owner', 'hrd', 'hrd-ops', 'hg-lead', 'outlet-spv', 'ops-manager'].includes(role());
  const V = `<input type="hidden" name="id" value="${t.id}"><input type="hidden" name="version" value="${t.version}">`;
  const src = t.source ? (t.source.sensitive && def().payroll !== 'detail' ? `${esc(t.source.type)} · <i>tautan khusus Manager HRD</i>` : `${esc(t.source.type)} · ${t.source.route ? `<a href="#${t.source.route}">${esc(t.source.label)}</a>` : esc(t.source.label)} <span class="muted small">(${esc(t.source.id)})</span>`) : '—';
  const subs = f3().tasks.filter(x => x.parent === t.id);
  let body = '';
  if (tab === 'preview') body = table(['Field', 'Nilai'], [['Task ID', t.id + ` · versi ${t.version}`], ['Workspace', HR3.WS[t.ws].name], ['Sumber', src], ['Finding ID', esc(t.finding || '—')], ['Cakupan', esc(scopeName(t.scope))], ['Tahap', chip(t.stage, STAGE_TONE[t.stage])], ['Prioritas', chip(t.prio, PRIO_TONE[t.prio])], ['PIC', t.pic ? esc(empName(t.pic)) : chip('Tanpa PIC', 'bad')], ['Reviewer', esc(empName(t.reviewer)) + (t.requireReview ? ' · wajib review' : '')], ['Kontributor', t.contributors.map(empName).map(esc).join(', ') || '—'], ['Tenggat', t.due || '—'], ['Jadwal sesi', t.sessionAt ? t.sessionAt + ' WITA' : '—'], ['Induk', t.parent ? link('hrd-task' + qs({ id: t.parent }), t.parent) : '—'], ['Blocker', t.blocker ? `${esc(t.blocker.reason)} · menunggu ${esc(empName(t.blocker.waiting))} · berikutnya: ${esc(t.blocker.next || '—')}` : '—']]) +
    (ro ? '' : `<div class="grid g2"><form class="workflow-form" data-submit="hr:task-move">${V}<input type="hidden" name="via" value="detail"><label>Pindahkan ke<select name="to">${HR3.STAGES.map(s => `<option ${s === t.stage ? 'selected' : ''}>${s}</option>`).join('')}</select></label><button class="btn">Pindahkan</button></form>
      <form class="workflow-form" data-submit="hr:task-assign">${V}<input type="hidden" name="field" value="pic"><label>PIC<select name="emp">${picOpts(t.pic)}</select></label><button class="btn ghost">Tetapkan PIC</button></form>
      <form class="workflow-form" data-submit="hr:task-assign">${V}<input type="hidden" name="field" value="reviewer"><label>Reviewer<select name="emp">${picOpts(t.reviewer)}</select></label><button class="btn ghost">Tetapkan reviewer</button></form>
      <form class="workflow-form" data-submit="hr:task-edit">${V}<label>Tenggat<input type="date" name="due" value="${t.due || ''}"></label><label>Prioritas<select name="prio">${HR3.PRIOS.map(p => `<option ${p === t.prio ? 'selected' : ''}>${p}</option>`).join('')}</select></label><label>Jadwal sesi<input name="sessionAt" value="${t.sessionAt || ''}" placeholder="2026-11-20 10:00"></label><button class="btn ghost">Simpan</button></form>
      ${t.blocker ? `<div><button type="button" class="btn ghost" data-action="hr:task-blocker" data-id="${t.id}" data-clear="1">Lepas blocker</button></div>` : `<form class="workflow-form" data-submit="hr:task-blocker">${V}<label>Blocker<input name="reason" placeholder="alasan"></label><label>Menunggu<select name="waiting">${picOpts('')}</select></label><label>Tindakan berikutnya<input name="next"></label><button class="btn ghost">Catat blocker</button></form>`}</div>`) +
    (t.stage === 'Review' && t.reviewer === me() ? `<div class="card hr-review"><h3>Keputusan review</h3><div class="actions"><button type="button" class="btn" data-action="hr:task-review" data-id="${t.id}" data-version="${t.version}" data-decision="accept">Terima → Selesai</button><form class="inline-form" data-submit="hr:task-review">${V}<input type="hidden" name="decision" value="return"><label class="sr" for="rv-${t.id}">Catatan revisi</label><input id="rv-${t.id}" name="note" placeholder="Catatan revisi" required minlength="5"><button class="btn ghost sm">Kembalikan</button></form></div></div>` : '') +
    (me() && t.stage !== 'Selesai' ? `<p>${focusBtn(t)}</p>` : '');
  else if (tab === 'files') body = (t.assets.length ? table(['Asset ID', 'File', 'Oleh', 'Waktu (WITA)'], t.assets.map(a => [a.id, esc(a.name), esc(a.by), a.at])) : '<p>Belum ada bukti.</p>') + (ro ? '' : `<form class="inline-form" data-submit="hr:task-asset">${V}<label class="sr" for="as-${t.id}">Nama file</label><input id="as-${t.id}" name="name" placeholder="bukti.pdf" required><button class="btn sm">Tambah bukti (sintetis)</button></form>`) + '<p class="muted small">Penyimpanan file: NEW INTEGRATION REQUIRED. Preview hanya mencatat nama file.</p>';
  else if (tab === 'discussion') body = (t.discussion.length ? `<ol class="hr-chat">${t.discussion.map(m => `<li><b>${esc(m.by)}</b> <span class="muted small">${m.at} WITA · ${m.id}</span><p>${esc(m.text)}</p></li>`).join('')}</ol>` : '<p>Belum ada diskusi.</p>') + `<form class="workflow-form" data-submit="hr:task-comment">${V}<label>Pesan<textarea name="text" rows="2" required></textarea></label><button class="btn">Kirim</button></form>`;
  else if (tab === 'checklist') body = (t.checklist.length ? `<ul class="hr-check">${t.checklist.map(c => `<li><button type="button" class="btn ${c.done ? '' : 'ghost '}sm" data-action="hr:task-check" data-id="${t.id}" data-item="${c.id}" ${ro ? 'disabled' : ''} aria-pressed="${c.done}">${c.done ? '☑' : '☐'}</button> ${esc(c.text)}${c.pic ? ` · <span class="muted">${esc(empName(c.pic))}</span>` : ''}${c.sub ? ` · ${link('hrd-task' + qs({ id: c.sub }), c.sub)}` : ''}</li>`).join('')}</ul>` : '<p>Belum ada checklist.</p>') +
    (ro ? '' : `<form class="inline-form" data-submit="hr:task-check">${V}<label class="sr" for="ck-${t.id}">Butir baru</label><input id="ck-${t.id}" name="text" placeholder="Butir checklist baru" required><button class="btn sm">Tambah</button></form>`) +
    (subs.length ? `<h3>Subtugas · ${subs.length}</h3>` + table(['Task ID', 'Judul', 'PIC', 'Tahap', 'Tenggat'], subs.map(s => [taskLink(s), esc(s.title), esc(empName(s.pic)), chip(s.stage, STAGE_TONE[s.stage]), s.due])) : '');
  else body = table(['Event ID', 'Waktu (WITA)', 'Aktor', 'Perubahan', 'Sebelum', 'Sesudah', 'Alasan'], f3().events.filter(e => e.task === t.id).slice().reverse().map(e => [e.id, e.at, esc(e.by), esc(e.kind), esc(e.before ?? '—'), esc(e.after ?? '—'), esc(e.reason || '—')]));
  return `<p class="active-filters">${link('hrd-board' + qs(kp), '‹ Board')} · ${link('hrd-list' + qs(kp), 'List')} · filter tetap terbawa</p>` +
    card(`${t.id} · ${esc(t.title)}`, tabs('hrd-task', tab, [['preview', 'Preview'], ['files', `Files & Assets (${t.assets.length})`], ['discussion', `Discussion (${t.discussion.length})`], ['checklist', `Tasks & Checklist (${t.checklist.length})`], ['history', 'Activity & History']], { ...kp, id: t.id }) + body);
}

/* ---------- sidebar & registrasi ---------- */
const items = H.PORTALS.HRD.items;
const ti = items.find(i => i[0] === 'hrd-tasks'); if (ti) { ti[2] = 'F3-NV01'; ti[3] = 'ready'; ti[4] = ''; }
const ix = items.findIndex(i => i[0] === 'hrd-tasks');
items.splice(ix + 1, 0, ['hrd-board', 'Board', 'F3-NV02', 'ready', '', 'sub'], ['hrd-calendar', 'Calendar', 'F3-NV03', 'ready', '', 'sub'], ['hrd-list', 'List', 'F3-NV04', 'ready', '', 'sub'], ['hrd-library', 'Library', 'F3-NV05', 'ready', '', 'sub'], ['hrd-mytasks', 'My Tasks', 'F3-NV06', 'ready', '', 'sub'], ['hrd-myday', 'My Day', 'F3-NV07', 'ready', '', 'sub'], ['hrd-task', 'Detail Kartu', 'F3-NV08', 'hidden']);
Object.assign(H.PURPOSE, {
  'hrd-tasks': 'Workspace HRD Operations atau Human Growth: beban per PIC, kartu tanpa PIC, lewat tenggat, blocker, review dan handoff lintas tim.',
  'hrd-board': 'Tujuh kolom Ide → Selesai. Seret kartu atau pakai menu Pindahkan ke; validasi dan histori sama.',
  'hrd-calendar': 'Agenda interview, coaching, training dan tenggat. Waktu sesi dibedakan dari batas penyelesaian.',
  'hrd-list': 'Tabel tugas dengan filter tanpa PIC, terlambat, menunggu review dan terblokir.',
  'hrd-library': 'SOP, rubric, checklist dan template versi aktif. Terapkan template menjadi kartu dan subtugas tertaut.',
  'hrd-mytasks': 'Tugas milik Anda, antrean review dan butir checklist atas nama Anda.',
  'hrd-myday': 'Fokus pribadi hari ini, agenda, hambatan dan pekerjaan terbawa.',
  'hrd-task': 'Preview, Files & Assets, Discussion, Tasks & Checklist serta Activity & History satu kartu.'
});
H.SCREENS.push(...[['F3-NV01', 'Workspace', 'hrd-tasks'], ['F3-NV02', 'Board', 'hrd-board'], ['F3-NV03', 'Calendar', 'hrd-calendar'], ['F3-NV04', 'List', 'hrd-list'], ['F3-NV05', 'Library', 'hrd-library'], ['F3-NV06', 'My Tasks', 'hrd-mytasks'], ['F3-NV07', 'My Day', 'hrd-myday'], ['F3-NV08', 'Detail Kartu', 'hrd-task?id=TSK-0001']].map(([c, t, r]) => [c, 'HRD · ' + t, 'HRD 3', r, 'ready', 'HRD, Human Growth, Supervisor']));
register('hrd-tasks', guarded(workplace), () => 'Workspace');
register('hrd-board', guarded(board), () => 'Board');
register('hrd-calendar', guarded(calendar), () => 'Calendar');
register('hrd-list', guarded(list), () => 'List');
register('hrd-library', guarded(library), () => 'Library');
register('hrd-mytasks', guarded(myTasks), () => 'My Tasks');
register('hrd-myday', guarded(myDay), () => 'My Day');
register('hrd-task', guarded(detail), (p) => p.id ? `Detail Kartu ${p.id}` : 'Detail Kartu');
})();
