/* HAWK ERP · Demo Experience Center template for hawk-live portals (model: Finance DX-HAWK-01, assets/js/screens/x-demo.js).
   DATA DEMO / SIMULASI. One portal = one lab, focused on that team only (Aji 2026-11-14):
   - Option 1 Scenario Test Lab: one REAL app frame (<portal>.html?embed=1&role=…&persona=…#route), login-role pills for the
     portal's own team, Desktop / iPad / Mobile, Smart Tutor (scenario, progress, run/open step, back/next, restart).
   - Option 2 Simulator: several real frames (team members, each on its own device) sharing ONE sandbox (localStorage).
   Steps owned by another division run automatically as context ("otomatis") – they never get a login pill.
   Usage:  HL.DXLAB.define({ portal, route, page, title, eyebrow, intro, personas, team, scenarios, sim, update, extra })
   step = { who, title, what?, route(ctx) → hash route, run(U, ctx, state) → string|id }  (U = (action, input) => update(...)) */
(() => {
'use strict';
const H = window.HL;
if (!H) return;
const KEY = 'hawk-integrated-demo-v1', PREF = 'hawk-live-prefs-v1', UIKEY = 'hawk-live-dxlab-ui';
const Q = new URLSearchParams(location.search);
const EMBED = Q.get('embed') === '1';
const DEVICES = { desktop: { w: 1280, h: 860, label: 'Desktop' }, ipad: { w: 834, h: 1112, label: 'iPad' }, mobile: { w: 390, h: 844, label: 'Mobile' } };
const { esc } = H;
/* HAWK Mobile (NV dasar HRD, hawk-live/mobile.html): aplikasi karyawan, dibuka di tab Demo Center setiap portal dengan peran yang relevan */
const MOBILE = { therapist: 'Spa Therapist', reception: 'Spa Reception', supervisor: 'Spa Supervisor', office: 'Staf Marketing' };
const mobileRoles = (lab) => (lab.mobile || Object.keys(MOBILE)).filter(k => MOBILE[k]);
const mobileSrc = (role) => `mobile.html?embed=1&role=${encodeURIComponent(role)}`;
const $ = (q, r) => (r || document).querySelector(q);
const $$ = (q, r) => [...(r || document).querySelectorAll(q)];

/* ---------- embed mode: the frame logs in as its own role and never writes the shared demo prefs ---------- */
if (EMBED) {
  document.documentElement.classList.add('dx-embed');
  const orig = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { if (k === PREF) return undefined; return orig.call(this, k, v); };
  if (Q.get('role')) { H.prefs.role = Q.get('role'); if (Q.get('portal')) H.prefs.portal = Q.get('portal'); }
  H.prefs.persona = Q.get('persona') || null;
}

const LABS = {};
/* embed: the frame's role chip shows the logged-in persona (name + title), like the Finance Demo Center */
function personaChip() {
  const id = H.prefs.persona; if (!id) return;
  const lab = Object.values(LABS).find(l => l.portal === H.prefs.portal) || Object.values(LABS)[0]; const p = lab && lab.P(id);
  if (!p || p.role !== H.prefs.role) return;
  const n = document.getElementById('role-name'), av = document.getElementById('role-av'), sm = n && n.parentElement.querySelector('small');
  const name = lab.name(p); if (n) n.textContent = name; if (sm) sm.textContent = p.title; if (av) av.textContent = name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
let ui = { tab: 'lab', device: {}, as: {}, sc: {}, mrole: {} };
try { Object.assign(ui, JSON.parse(localStorage.getItem(UIKEY) || '{}')); } catch (e) { /* ignore */ }
const saveUi = () => { try { localStorage.setItem(UIKEY, JSON.stringify(ui)); } catch (e) { /* ignore */ } };

function define(cfg) {
  const lab = { ...cfg, msg: null, view: null };
  lab.P = (id) => cfg.personas.find(p => p.id === id);
  lab.isTeam = (id) => cfg.team.includes(id);
  lab.name = (p) => (cfg.nameOf ? cfg.nameOf(p) : p.name) || p.id;
  lab.actor = (p) => `${lab.name(p)} (${p.title})`;
  LABS[cfg.route] = lab;
  H.REGISTRY[cfg.route] = (params) => placeholder(lab, params);
  H.REGISTRY[cfg.route].title = () => cfg.title;
  H.REGISTRY[cfg.route].purpose = () => cfg.purpose || '';
  return lab;
}

/* ---------- run state: state.dxlab[portal] = { runs: { scId: { ctx, done:[i], log:[] } } } ---------- */
const store = (lab) => { const s = H.state; s.dxlab = s.dxlab || {}; s.dxlab[lab.portal] = s.dxlab[lab.portal] || { runs: {} }; return s.dxlab[lab.portal]; };
const runOf = (lab, id) => { const d = store(lab); d.runs[id] = d.runs[id] || { ctx: {}, done: [], log: [] }; return d.runs[id]; };
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(H.state)); } catch (e) { /* in-memory */ } };
const scOf = (lab) => lab.scenarios.find(s => s.id === ui.sc[lab.portal]) || lab.scenarios[0];
const nextIdx = (sc, r) => { for (let i = 0; i < sc.steps.length; i++) if (!r.done.includes(i)) return i; return sc.steps.length - 1; };
const now = () => `${(window.HR && HR.TODAY) || ''} ${new Date().toTimeString().slice(0, 5)}`.trim();
const routeTitle = (route) => { const id = String(route).split('?')[0]; const it = Object.values(H.PORTALS).flatMap(p => p.items || []).find(i => i[0] === id); const t = H.REGISTRY[id]?.title; return (it && `${it[2] ? it[2] + ' · ' : ''}${it[1]}`) || (typeof t === 'function' ? id : t) || id; };

function runStep(lab, sc, i) {
  const r = runOf(lab, sc.id), st = sc.steps[i], p = lab.P(st.who);
  if (r.done.includes(i)) return { kind: 'ok', text: `Langkah ${i + 1} sudah selesai.` };
  if (i > 0 && !r.done.includes(i - 1)) return { kind: 'warn', text: 'Jalankan langkah sebelumnya terlebih dahulu.' };
  const by = lab.actor(p), role = p.role === 'public' ? (lab.publicRole || p.role) : p.role;
  const U = (a, input) => lab.update(H.state, a, { by, role, ...input });
  try {
    const out = st.run(U, r.ctx, lab.stateOf ? lab.stateOf(H.state) : H.state);
    r.done.push(i); r.log.push({ i, at: now(), by, result: typeof out === 'string' ? out : '' }); persist();
    return { kind: 'ok', text: `Langkah ${i + 1} selesai oleh ${by}${typeof out === 'string' && out ? ' · ' + out : ''}` };
  } catch (e) { persist(); return { kind: 'bad', text: `Langkah ${i + 1} gagal: ${e.message}` }; }
}
/* other divisions' steps that come before the next team step run by themselves, as context */
function autoContext(lab, sc) {
  const r = runOf(lab, sc.id), out = [];
  for (let i = nextIdx(sc, r); i < sc.steps.length && !r.done.includes(i) && !lab.isTeam(sc.steps[i].who); i = nextIdx(sc, r)) {
    const m = runStep(lab, sc, i); out.push(m); if (m.kind !== 'ok') break;
  }
  return out;
}
function restart(lab, sc) {
  const fresh = HAWK.fresh(), s = H.state;
  Object.keys(s).forEach(k => delete s[k]); Object.assign(s, fresh);
  runOf(lab, sc.id); persist();
}

/* ---------- frames ---------- */
const frameSrc = (lab, p, route) => `${location.pathname}?embed=1&portal=${encodeURIComponent(lab.portal)}&role=${encodeURIComponent(p.role === 'public' ? (lab.publicRole || 'hrd') : p.role)}${p.role === 'public' ? '' : '&persona=' + encodeURIComponent(p.id)}#${route}`;
function openIn(lab, cell, p, route) {
  const f = $('iframe', cell);
  if (!f) return;
  if (f.dataset.who === p.id && f.contentWindow && f.contentWindow.HL) { try { f.contentWindow.location.hash = route; return; } catch (e) { /* reload */ } }
  f.dataset.who = p.id; f.src = frameSrc(lab, p, route);
  const head = $('.dx-cell-role', cell); if (head) head.textContent = `${lab.name(p)} · ${p.title}`;
}
function fit(cell) {
  const f = $('iframe', cell), box = $('.dx-screen', cell);
  if (!f || !box) return;
  const d = DEVICES[cell.dataset.device] || DEVICES.desktop, avail = box.clientWidth || 300, sc = Math.min(1, avail / d.w);
  Object.assign(f.style, { width: d.w + 'px', height: d.h + 'px', transform: `scale(${sc})`, left: Math.max(0, Math.round((avail - d.w * sc) / 2)) + 'px' });
  box.style.height = Math.round(d.h * sc) + 'px';
}
const fitAll = () => $$('#dxlab-stage .dx-cell').forEach(fit);
const cellHtml = (key, label, device) => `<div class="dx-cell" data-cell="${key}" data-device="${device}"><div class="dx-cell-head"><span class="dx-cell-role">${esc(label)}</span>
  <select class="dx-dev" data-dxl-dev="${key}" aria-label="Perangkat">${Object.entries(DEVICES).map(([k, d]) => `<option value="${k}" ${k === device ? 'selected' : ''}>${d.label}</option>`).join('')}</select>
  <button type="button" class="dx-ib" data-dxl="home" data-cell="${key}" title="Beranda role" aria-label="Beranda role">⌂</button>
  <button type="button" class="dx-ib" data-dxl="full" data-cell="${key}" title="Layar penuh" aria-label="Layar penuh">⛶</button></div>
  <div class="dx-screen"><iframe title="${esc(label)} — aplikasi HAWK (DEMO)" loading="eager"></iframe></div></div>`;

/* ---------- page ---------- */
function placeholder(lab) {
  return `<div data-dxlab-anchor="${esc(lab.route)}"></div>`;
}
function mount(lab) {
  let stage = $('#dxlab-stage');
  if (stage && stage.dataset.route === lab.route) { stage.hidden = false; paint(lab); return; }
  if (stage) stage.remove();
  stage = document.createElement('section');
  stage.id = 'dxlab-stage'; stage.dataset.route = lab.route; stage.className = 'dxlab';
  const team = lab.team.map(lab.P), sim = lab.sim || team.map(p => ({ who: p.id, device: p.device || 'desktop' }));
  const counts = `${lab.scenarios.length} skenario · ${team.length} role tim`;
  stage.innerHTML = `<div class="dx-hero"><div><div class="eyebrow">${esc(lab.eyebrow || 'HAWK × JAENS · GUIDED DEMO')}</div><h1>${esc(lab.title)}</h1><p>${esc(lab.intro || '')}</p></div>
    <div class="dx-hero-r"><span class="dx-pill">DEMO / NO LIVE API</span><span class="dx-pill">${esc(counts)}</span><span class="dx-pill" id="dxl-hero-prog"></span></div></div>
    <div class="row dxl-tabs"><button type="button" class="dx-tab" data-dxl="tab" data-tab="lab">Option 1 · Scenario Test Lab</button><button type="button" class="dx-tab" data-dxl="tab" data-tab="sim">Option 2 · Simulator ${sim.length} Layar</button><button type="button" class="dx-tab" data-dxl="tab" data-tab="mobile">HAWK Mobile</button>${lab.extra ? `<button type="button" class="dx-tab" data-dxl="tab" data-tab="extra">${esc(lab.extra.label)}</button>` : ''}
      <span class="muted small">Setiap layar adalah aplikasi HAWK yang sebenarnya (bukan gambar) dengan hak akses role-nya.</span></div>
    <div class="dx-main"><div class="dx-stage">
      <div class="dxl-pane" data-pane="lab"><div class="dx-labhead row" id="dxl-labhead"></div>${cellHtml('lab', 'Test Lab', ui.device[lab.portal] || 'desktop')}</div>
      <div class="dxl-pane dx-sim" data-pane="sim">${sim.map(s => { const p = lab.P(s.who); return cellHtml('sim-' + p.id, `${lab.name(p)} · ${p.title}`, s.device); }).join('')}</div>
      <div class="dxl-pane" data-pane="mobile"><div class="dx-labhead row" id="dxl-mobilehead"></div><div class="dx-cell" data-cell="mobile" data-device="mobile"><div class="dx-cell-head"><span class="dx-cell-role" id="dxl-mobilerole">HAWK Mobile</span>
        <a class="dx-ib" href="mobile.html" target="_blank" rel="noopener" title="Buka HAWK Mobile di tab baru" aria-label="Buka HAWK Mobile di tab baru">↗</a></div>
        <div class="dx-screen"><iframe title="HAWK Mobile — aplikasi karyawan (DEMO)" loading="eager"></iframe></div></div>
        <p class="muted small">Aplikasi karyawan HAWK Mobile (NV dasar HRD): beranda, pekerjaan, presensi, inbox dan profil. Kamera dan GPS disimulasikan; data presensi, chat dan pengajuan hanya tersimpan di browser ini.</p></div>
      <div class="dxl-pane" data-pane="extra"><div id="dxl-extra"></div></div>
    </div><aside class="dx-tutor" id="dxl-tutor" aria-label="Smart Tutor"></aside></div>`;
  const anchor = $(`[data-dxlab-anchor]`);
  (anchor ? anchor.closest('main') || document.body : document.body).appendChild(stage);
  lab.loaded = {};
  paint(lab); showTab(lab, ui.tab, true);
}
function showTab(lab, tab, first) {
  ui.tab = tab; saveUi();
  $$('#dxlab-stage .dxl-pane').forEach(el => { el.hidden = el.dataset.pane !== tab; });
  $$('#dxlab-stage .dx-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  if (tab === 'lab' && !lab.loaded.lab) { lab.loaded.lab = 1; const p = lab.P(ui.as[lab.portal]) || lab.P(lab.team[0]); openIn(lab, $('.dx-cell[data-cell="lab"]'), p, p.home); }
  if (tab === 'sim' && !lab.loaded.sim) { lab.loaded.sim = 1; $$('#dxlab-stage .dx-sim .dx-cell').forEach(c => { const p = lab.P(c.dataset.cell.slice(4)); openIn(lab, c, p, p.home); }); }
  if (tab === 'extra') paint(lab);
  if (tab === 'mobile') openMobile(lab, ui.mrole?.[lab.portal]);
  requestAnimationFrame(fitAll);
}
function openMobile(lab, role) {
  const roles = mobileRoles(lab), cur = roles.includes(role) ? role : roles[0], cell = $('.dx-cell[data-cell="mobile"]'), f = cell && $('iframe', cell);
  if (!f) return;
  ui.mrole = ui.mrole || {}; ui.mrole[lab.portal] = cur; saveUi();
  if (f.dataset.role !== cur) { f.dataset.role = cur; f.src = mobileSrc(cur); }
  const r = $('#dxl-mobilerole'); if (r) r.textContent = `HAWK Mobile · ${MOBILE[cur]}`;
  const h = $('#dxl-mobilehead'); if (h) h.innerHTML = `<span class="tiny b">Lihat sebagai (DEMO):</span>${roles.map(k => `<button type="button" class="chip ${k === cur ? 'on' : ''}" data-dxl="mrole" data-r="${k}">${esc(MOBILE[k])}</button>`).join('')}`;
}
function labHead(lab) {
  const el = $('#dxl-labhead'); if (!el) return;
  const cur = ui.as[lab.portal] || lab.team[0], dev = ($('.dx-cell[data-cell="lab"]') || {}).dataset?.device;
  el.innerHTML = `<span class="tiny b">Login role (DEMO):</span>${lab.team.map(lab.P).map(p => `<button type="button" class="chip ${p.id === cur ? 'on' : ''}" data-dxl="as" data-p="${p.id}">${esc(lab.name(p))} · ${esc(p.title)}</button>`).join('')}
    <span class="dx-sep"></span>${Object.entries(DEVICES).map(([k, d]) => `<button type="button" class="chip ${k === dev ? 'on' : ''}" data-dxl="dev" data-d="${k}">${d.label}</button>`).join('')}`;
}
function tutor(lab) {
  const sc = scOf(lab), r = runOf(lab, sc.id), N = sc.steps.length, n = r.done.length;
  const nxt = nextIdx(sc, r), i = lab.view === null || lab.view === undefined ? nxt : Math.max(0, Math.min(N - 1, lab.view));
  const st = sc.steps[i], p = lab.P(st.who), done = r.done.includes(i), isCur = !done && i === nxt, team = lab.isTeam(st.who);
  const lg = r.log.find(l => l.i === i);
  const opts = lab.scenarios.map(s => `<option value="${s.id}" ${s.id === sc.id ? 'selected' : ''}>${esc(s.name)} (${s.steps.length})</option>`).join('');
  return `<div class="dx-tutor-head"><div class="eyebrow">HAWK SMART TUTOR · ${esc(lab.portal)}</div><h3>${esc(sc.name)}</h3><p>${esc(sc.why || '')}</p></div>
  <div class="dx-tutor-body">
    <div class="row between" style="gap:8px"><select class="inp" id="dxl-sc" aria-label="Pilih skenario" style="flex:1;min-width:0">${opts}</select><button type="button" class="btn sm" data-dxl="restart" title="Reset data demo dan mulai skenario dari awal">↺ Mulai ulang</button></div>
    <div class="row between" style="margin-top:12px"><b class="small">Progres</b><span class="badge gold">${n}/${N} langkah</span></div>
    <div class="dx-prog"><i style="width:${Math.round((n / N) * 100)}%"></i></div>
    <div class="dx-step ${isCur ? 'cur' : ''}" id="dxl-stepcard">
      <div class="eyebrow">LANGKAH ${i + 1} DARI ${N}${team ? '' : ' · KONTEKS DIVISI LAIN'}</div>
      <h4>${esc(st.title)}</h4>${st.what ? `<p class="small">${esc(st.what)}</p>` : ''}
      <div class="dx-kv"><span>Peran</span><b>${esc(p.title)} — ${esc(lab.name(p))}${team ? '' : ' <span class="badge warn">otomatis</span>'}</b>
        <span>Layar</span><b>${esc(routeTitle(st.route(r.ctx)))}</b>
        <span>Status</span><b>${done ? `<span class="badge ok">Selesai</span> <span class="tiny muted">${esc(lg ? lg.at : '')}${lg && lg.result ? ' · ' + esc(lg.result) : ''}</span>` : isCur ? '<span class="badge gold">Giliran ini</span>' : '<span class="badge">Menunggu</span>'}</b></div>
      <div class="stack" style="gap:8px;margin-top:10px">
        <button type="button" class="btn ghost block" data-dxl="open" data-i="${i}">Buka layar sebagai ${esc(lab.name(p).split(' ')[0])}</button>
        ${isCur ? `<button type="button" class="btn gold block" data-dxl="run" data-i="${i}">✓ ${team ? 'Jalankan langkah ini' : 'Lanjutkan (langkah otomatis)'}</button>` : ''}
        ${isCur && team ? '<p class="tiny muted">Tombol ini menjalankan operasi yang sama dengan tombol asli di layar (cek role + audit atas nama persona).</p>' : ''}
      </div>
    </div>
    ${lab.msg ? `<div class="dx-msg ${lab.msg.kind}" role="status">${esc(lab.msg.text)}</div>` : ''}
    <div class="row" style="gap:8px;margin-top:10px"><button type="button" class="btn sm ghost" data-dxl="back" ${i === 0 ? 'disabled' : ''}>‹ Sebelumnya</button><button type="button" class="btn sm ghost" data-dxl="next" ${i >= N - 1 ? 'disabled' : ''}>Berikutnya ›</button></div>
    <div class="dx-steps">${sc.steps.map((x, k) => { const d = r.done.includes(k), tp = lab.P(x.who); return `<button type="button" class="dx-li ${k === i ? 'on' : ''} ${d ? 'r-DONE' : ''}" data-dxl="goto" data-i="${k}"><span class="dx-n">${d ? '✓' : k + 1}</span><span><b>${esc(x.title)}</b><small>${esc(lab.name(tp))} · ${esc(tp.title)}${lab.isTeam(x.who) ? '' : ' · otomatis'}</small></span></button>`; }).join('')}</div>
    <div class="dx-rules"><b>Aturan demo</b> Data sintetis. Login role = DEMO, bukan autentikasi. Lab ini hanya untuk tim ${esc(lab.portal)}; langkah divisi lain berjalan otomatis bila memang bagian alurnya. Mulai ulang mengembalikan data demo di browser ini, tidak menyentuh HAWK produksi.</div>
  </div>`;
}
function paint(lab) {
  const t = $('#dxl-tutor'); if (t) t.innerHTML = tutor(lab);
  labHead(lab);
  const sc = scOf(lab), r = runOf(lab, sc.id), hp = $('#dxl-hero-prog'); if (hp) hp.textContent = `${sc.id} · ${r.done.length}/${sc.steps.length}`;
  const ex = $('#dxl-extra'); if (ex && lab.extra && ui.tab === 'extra') ex.innerHTML = lab.extra.html();
}
function targetCell(lab, who) {
  if (ui.tab === 'sim') return $(`#dxlab-stage .dx-cell[data-cell="sim-${who}"]`) || null;
  return $('#dxlab-stage .dx-cell[data-cell="lab"]');
}
function openStep(lab, i) {
  const sc = scOf(lab), st = sc.steps[i], p = lab.P(st.who), cell = targetCell(lab, st.who) || (showTab(lab, 'lab'), $('#dxlab-stage .dx-cell[data-cell="lab"]'));
  if (cell.dataset.cell === 'lab' && lab.isTeam(p.id)) ui.as[lab.portal] = p.id;
  openIn(lab, cell, p, st.route(runOf(lab, sc.id).ctx)); saveUi();
}

/* ---------- events ---------- */
const active = () => { const id = H.parseHash().id; return LABS[id] || null; };
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-dxl]'); if (!b || !b.closest('#dxlab-stage')) return;
  const lab = LABS[$('#dxlab-stage').dataset.route]; if (!lab) return;
  const sc = scOf(lab), a = b.dataset.dxl, i = Number(b.dataset.i);
  if (a === 'tab') return showTab(lab, b.dataset.tab);
  if (a === 'mrole') { openMobile(lab, b.dataset.r); return requestAnimationFrame(fitAll); }
  if (a === 'as') { const p = lab.P(b.dataset.p); ui.as[lab.portal] = p.id; saveUi(); openIn(lab, $('.dx-cell[data-cell="lab"]'), p, p.home); return paint(lab); }
  if (a === 'dev') { const c = $('.dx-cell[data-cell="lab"]'); c.dataset.device = b.dataset.d; const sel = $('.dx-dev', c); if (sel) sel.value = b.dataset.d; ui.device[lab.portal] = b.dataset.d; saveUi(); fit(c); return paint(lab); }
  if (a === 'home') { const c = $(`.dx-cell[data-cell="${b.dataset.cell}"]`), p = lab.P($('iframe', c).dataset.who); if (p) openIn(lab, c, p, p.home); return; }
  if (a === 'full') { const c = $(`.dx-cell[data-cell="${b.dataset.cell}"]`); if (document.fullscreenElement) document.exitFullscreen(); else c.requestFullscreen?.().catch(() => {}); return; }
  if (a === 'back' || a === 'next' || a === 'goto') { const r = runOf(lab, sc.id), base = lab.view ?? nextIdx(sc, r); lab.view = a === 'goto' ? i : base + (a === 'next' ? 1 : -1); lab.msg = null; return paint(lab); }
  if (a === 'open') { openStep(lab, i); return; }
  if (a === 'restart') { restart(lab, sc); lab.view = null; lab.msg = { kind: 'ok', text: 'Data demo dikembalikan ke awal. Skenario dimulai dari langkah 1.' }; const ctx = autoContext(lab, sc); if (ctx.length) lab.msg = ctx[ctx.length - 1]; openStep(lab, nextIdx(sc, runOf(lab, sc.id))); return paint(lab); }
  if (a === 'run') {
    lab.msg = runStep(lab, sc, i); lab.view = null;
    if (lab.msg.kind === 'ok') { openStep(lab, i); const ctx = autoContext(lab, sc); if (ctx.length) lab.msg = { kind: ctx[ctx.length - 1].kind, text: lab.msg.text + ' · ' + ctx.map(c => c.text).join(' · ') }; }
    return paint(lab);
  }
});
document.addEventListener('change', (e) => {
  const t = e.target; if (!t.closest || !t.closest('#dxlab-stage')) return;
  const lab = LABS[$('#dxlab-stage').dataset.route]; if (!lab) return;
  if (t.id === 'dxl-sc') { ui.sc[lab.portal] = t.value; saveUi(); lab.view = null; lab.msg = null; const sc = scOf(lab); const r = runOf(lab, sc.id); if (!r.done.length) { const ctx = autoContext(lab, sc); if (ctx.length) lab.msg = ctx[ctx.length - 1]; } openStep(lab, nextIdx(sc, runOf(lab, sc.id))); paint(lab); }
  if (t.dataset.dxlDev) { const c = t.closest('.dx-cell'); c.dataset.device = t.value; if (c.dataset.cell === 'lab') { ui.device[lab.portal] = t.value; saveUi(); labHead(lab); } fit(c); }
});
/* the app re-renders #view on every change (also storage events from frames); the stage lives outside #view so frames survive */
function sync() {
  if (EMBED) return;
  const lab = active(), stage = $('#dxlab-stage');
  if (lab && $('[data-dxlab-anchor]')) mount(lab); else if (stage) stage.hidden = true;
}
if (EMBED) document.addEventListener('DOMContentLoaded', () => { const view = $('#view'); if (view) new MutationObserver(personaChip).observe(view, { childList: true }); personaChip(); });
if (!EMBED) {
  document.addEventListener('DOMContentLoaded', () => {
    const view = $('#view'); if (view) new MutationObserver(sync).observe(view, { childList: true });
    sync();
  });
  window.addEventListener('resize', () => requestAnimationFrame(fitAll));
  document.addEventListener('fullscreenchange', () => setTimeout(fitAll, 50));
}
H.DXLAB = { define, DEVICES, EMBED, LABS, runStep: (route, scId, i) => { const lab = LABS[route]; const sc = lab.scenarios.find(s => s.id === scId); const m = runStep(lab, sc, i); if (m.kind === 'ok') autoContext(lab, sc); if ($('#dxlab-stage')) paint(lab); return m; } };
})();
