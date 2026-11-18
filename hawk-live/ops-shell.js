/* HAWK ERP · Portal Operational (NP-OP01 + Addendum A01, prototype Owner v1.1) — DATA DEMO / SIMULASI.
   Satu shell: sidebar, topbar, pemilih portal (logo HAWK) dan ID/EN tetap milik hawk-live (app.js + hawk.css).
   Modul halaman berasal dari prototype Owner (hawk-live/ops/ops-*.js, namespace window.OPX) dan dirender ke dalam #view
   lewat route #op-<halaman>; Demo Experience Center = #ops-dx (kartu besar paling atas sidebar Operational).
   POS & Receptionist membuka POS existing https://preview.jaens.id/rnd-demo di tab baru (keputusan Owner, Addendum §3);
   #op-pos hanya gateway + register parity. POS sandbox lama (#pos) tetap ada sebagai route tersembunyi karena dipakai
   skenario lintas portal Sales/Commercial. Tidak ada API live, login POS, transaksi atau pesan eksternal. */
(() => {
'use strict';
const HL = window.HL, H = window.OPX;
if (!HL || !H) return;
const esc = HL.esc;
const OPEN = ['roadmap', 'validation', 'demo'];
const POS_URL = H.existingPosUrl;
const routeOf = (p) => p === 'demo' ? 'ops-dx' : 'op-' + p;
const pageOf = (r) => r === 'ops-dx' ? 'demo' : (r && r.startsWith('op-') ? r.slice(3) : null);
const allowed = (p) => OPEN.includes(p) || H.has(p);
const firstAllowed = () => H.navItems.find(v => v[0] !== 'pos' && H.has(v[0]))?.[0] || 'roadmap';
H.allowed = allowed;
H.routeOf = routeOf;

/* ---------- overlay: modal, toast dan dock Pandu Saya dalam satu host ber-scope .opx ---------- */
H.overlay = () => {
  let o = document.getElementById('opx-overlay');
  if (!o) { o = document.createElement('div'); o.id = 'opx-overlay'; o.className = 'opx opx-overlay'; o.innerHTML = '<div id="modal-root"></div><div id="toasts" aria-live="polite"></div>'; document.body.appendChild(o); }
  return o;
};
if (document.body) H.overlay(); else document.addEventListener('DOMContentLoaded', H.overlay);

/* ---------- navigasi: hash milik hawk-live ---------- */
H.goPage = (id) => {
  if (!H.pages[id]) id = 'dashboard';
  if (!allowed(id)) { H.toast('Menu ini tidak termasuk akses akun demo Anda.'); id = firstAllowed(); }
  H.state.page = id; H.ui.mobileOpen = false; H.save();
  const want = '#' + routeOf(id);
  if (location.hash.split('?')[0] !== want) location.hash = want; else H.mountPage();
};

const contextBar = (u, outlet) => `<div class="opx-context" role="region" aria-label="Akun demo dan lingkup outlet">
  <div class="opx-context-row">
    <button class="profile-chip" data-act="accounts" aria-label="Ganti akun demo"><span class="avatar">${esc(u.initials)}</span><span><b>${esc(u.name)}</b><small>${esc(u.title)}</small></span><span aria-hidden="true">⌄</span></button>
    <label class="opx-outlet">Lingkup outlet<select id="outlet-select" ${!H.isManager() ? 'disabled' : ''}>${H.isManager() ? `<option value="all" ${outlet === 'all' ? 'selected' : ''}>Semua outlet</option>` : ''}${H.outlets.filter(o => H.isManager() || o.id === u.outlet).map(o => `<option value="${o.id}" ${outlet === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label>
    <span class="opx-date">${esc(H.demoDate.split('-').reverse().join('/'))} · WITA · Mock adapter, offline</span>
    <button class="btn btn-sm" data-act="notifications">Notifikasi</button>
    <a class="btn btn-sm" href="#ops-dx">▶ Demo Center</a>
  </div></div>`;

const denied = (pid, u) => `<section class="card opx-denied" role="alert"><div class="card-head"><div><h2 class="card-title">Tidak berwenang</h2><p class="muted small">${esc(u.name)} · ${esc(u.title)} tidak memiliki menu “${esc(H.pages[pid]?.title || pid)}” pada matriks akses demo.</p></div>${H.badge('Ditolak', 'red')}</div><p class="small">Akses frontend ini hanya simulasi; pembatasan sebenarnya wajib ditegakkan server (NP-OP01 §4).</p><div class="row mt"><a class="btn btn-primary" href="#${routeOf(firstAllowed())}">Buka workspace saya</a><button class="btn" data-act="accounts">Ganti akun demo</button></div></section>`;

H.mountPage = () => {
  H.refreshReadModel();
  syncNav();
  const root = document.getElementById('opx-root');
  if (!root) { H.demoAfterRender?.(); return; }
  let pid = root.dataset.page || H.state.page;
  if (!H.pages[pid]) pid = 'dashboard';
  const u = H.user();
  const outlet = H.isManager() ? H.state.outletId : u.outlet;
  H.state.outletId = outlet;
  if (!allowed(pid)) { root.innerHTML = contextBar(u, outlet) + denied(pid, u); H.demoAfterRender?.(); return; }
  H.state.page = pid;
  const page = H.pages[pid];
  root.innerHTML = contextBar(u, outlet) + `<div class="page-top"><div><div class="eyebrow">${esc(page.phase)} / ${H.isManager() && outlet === 'all' ? 'SELURUH OUTLET' : esc(H.outletName(outlet)).toUpperCase()}</div></div><div class="page-actions row">${typeof page.actions === 'function' ? page.actions() : ''}<button class="btn btn-sm" data-act="guide">▶ Panduan demo</button></div></div><div id="opx-view">${page.render()}</div>${H.contract(page)}`;
  roleChip(u);
  H.demoAfterRender?.();
};

/* topbar role chip mengikuti akun demo Operational aktif (bukan role demo portal lain) */
function roleChip(u) {
  const n = document.getElementById('role-name'), av = document.getElementById('role-av');
  if (n) { n.textContent = u.name; const sm = n.parentElement.querySelector('small'); if (sm) sm.textContent = u.title; }
  if (av) av.textContent = u.initials;
}

/* ---------- sidebar Operational: hanya menu yang boleh untuk akun demo aktif ---------- */
function syncNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  nav.querySelectorAll('a[href^="#op-"]').forEach(a => { const p = pageOf(a.getAttribute('href').slice(1)); if (p && !OPEN.includes(p)) a.hidden = !H.has(p); });
  nav.querySelectorAll(`a[href="${POS_URL}"]`).forEach(a => { a.hidden = !H.has('pos'); });
  nav.querySelectorAll('.nav-sec').forEach(sec => { sec.hidden = ![...sec.querySelectorAll('.nav-grp-kids a')].some(a => !a.hidden); });
}
H.syncNav = syncNav;

/* dock Pandu Saya hanya tampil di halaman Operational */
const dockVisibility = () => {
  const inOps = !!pageOf(HL.parseHash().id);
  document.body.classList.toggle('opx-page', inOps);
  const host = document.getElementById('dx-tour-root');
  if (host) host.hidden = !inOps;
  if (!inOps) document.body.classList.remove('dx-tour-active');
};

/* ---------- F-OP03: register parity POS existing (Addendum A01 §3) ---------- */
const PARITY = { checked: '2026-11-18 16:21 UTC', link: 'Tautan tersedia', parity: 'BLOCKED', data: 'Belum terbukti' };
const parityCard = () => `<section class="card mt opx-parity" aria-labelledby="opx-parity-h"><div class="card-head"><div><h2 class="card-title" id="opx-parity-h">Register parity POS existing · POS-P01–P16</h2><p class="muted small">Tiga status dipisahkan. Membuka tautan tidak membuktikan kesamaan isi atau sinkronisasi data.</p></div>${H.badge('Frontend saja', 'gray')}</div>
  <div class="table-wrap"><table><thead><tr><th>Status</th><th>Hasil</th><th>Bukti</th></tr></thead><tbody>
  <tr><td><b>Tautan tersedia</b></td><td>${H.badge('YA', 'green')}</td><td class="small">${esc(POS_URL)} memuat halaman login POS existing (dicek ${PARITY.checked} lewat browser Owner). Menu sidebar membuka tab baru.</td></tr>
  <tr><td><b>Parity isi terverifikasi</b></td><td>${H.badge('BLOCKED', 'red')}</td><td class="small">Source POS tidak ada di repo hawk-preview; isi setelah login belum diperiksa; POS-Existing-Parity-Checklist.md belum diterima.</td></tr>
  <tr><td><b>Integrasi data terbukti</b></td><td>${H.badge('BELUM', 'gray')}</td><td class="small">Tidak ada endpoint POS yang ditemukan di source. Data Command Center tetap fixture demo; ID booking/room/therapist/invoice dipetakan setelah source tersedia.</td></tr>
  </tbody></table></div>
  <p class="help">Item POS-P01 sampai POS-P16 diisi dari checklist Owner beserta file/fungsi/commit dan screenshot setelah dua bukti di atas tersedia. Prototype tidak meneruskan akun demo dan tidak mengklaim single sign-on.</p></section>`;
if (H.pages.pos) { const base = H.pages.pos.render; H.pages.pos.render = () => base() + parityCard(); }

/* ---------- F-OP04: opening/closing mengikuti alur PIC → Head → Supervisor (NP-FE-OP01) ----------
   Item yang dicentang PIC staf pada departemen yang memiliki Head harus direview Head sebelum Supervisor sign-off.
   Item seed (belum pernah dicentang di sesi demo) dianggap sudah melalui review. Kebijakan dapat dimatikan via policies.headReview. */
const STAFF = ['reception', 'therapist', 'attendant', 'security'];
const pendingHead = (o, k) => {
  const b = H.state.data.checklists[o]; if (!b || H.state.policies?.headReview === false) return [];
  const heads = new Set(H.accounts.filter(a => a.outlet === o && a.role === 'head').map(a => a.dept));
  return (b[k] || []).filter(i => i.done && i.checkedRole && STAFF.includes(i.checkedRole) && heads.has(i.dept) && !i.reviewedBy);
};
const gate = (fn, get) => function (x) {
  const [o, k] = get(x); const wait = pendingHead(o, k);
  if (wait.length) { H.toast('Menunggu review Head: ' + [...new Set(wait.map(i => i.dept))].join(', ') + '. Sign-off Supervisor setelah review departemen.'); return; }
  return fn.apply(this, arguments);
};
if (H.actions['daily-check']) { const base = H.actions['daily-check']; H.actions['daily-check'] = (el) => { base(el); const i = H.state.data.checklists[el.dataset.outlet]?.[el.dataset.kind]?.find(x => x.id === el.dataset.id); if (i && i.checkedAt) { i.checkedRole = H.user().role; i.checkedById = H.user().id; if (['manager', 'assistant', 'supervisor', 'head'].includes(i.checkedRole) && i.done && i.checkedRole === 'head') { i.reviewedBy = H.user().name; i.reviewedAt = i.checkedAt; } H.save(); } }; }
if (H.actions['daily-signoff']) H.actions['daily-signoff'] = gate(H.actions['daily-signoff'], el => [el.dataset.outlet, el.dataset.kind]);
if (H.forms['daily-signoff']) H.forms['daily-signoff'] = gate(H.forms['daily-signoff'], fd => [String(fd.get('outlet')), String(fd.get('kind'))]);
H.pendingHeadReview = pendingHead;

/* ---------- registrasi route ke hawk-live ---------- */
const PHASE = (p) => H.pages[p]?.phase || '';
const register = (p) => {
  const fn = () => { queueMicrotask(H.mountPage); return `<div class="opx" id="opx-root" data-page="${p}"><p class="muted small">Memuat workspace Operational…</p></div>`; };
  fn.title = () => H.pages[p]?.title || p;
  fn.purpose = () => { const s = H.pages[p]?.subtitle; return esc(typeof s === 'function' ? s() : (s || '')); };
  fn.code = () => PHASE(p);
  HL.REGISTRY[routeOf(p)] = fn;
};
Object.keys(H.pages).forEach(register);

/* sidebar: urutan dan grup prototype v1.1; nomor fase tampil sebagai kode */
const items = [['ops-dx', 'Demo Experience Center', 'DX-OPS', 'ready']];
H.navItems.forEach(([id, title, , num, group]) => {
  if (group) items.push(['-', group.charAt(0) + group.slice(1).toLowerCase()]);
  if (id === 'pos') items.push([POS_URL, 'POS & Receptionist', 'F-OP03', 'ready']);
  else items.push([routeOf(id), title, PHASE(id), 'ready']);
});
items.push(['-', 'Developer handoff'], ['op-roadmap', 'Peta 12 Fase', PHASE('roadmap'), 'ready'], ['op-validation', 'Validation Lab', PHASE('validation'), 'ready']);
items.push(['op-pos', 'POS & Receptionist · gateway', 'F-OP03', 'hidden'], ['pos', 'Operational & POS (sandbox lintas portal)', 'F4-07', 'hidden'], ['inventory', 'Inventory (sandbox lama)', '', 'hidden']);
HL.PORTALS.Operational.desc = 'Kendali outlet, POS & Receptionist, Daily Operations, tugas, ruang, inventory, RACE dan budget';
HL.PORTALS.Operational.items = items;
HL.HOME.Operational = 'op-dashboard';
/* peta layar F7-01: Demo Center + 14 workspace Operational */
HL.SCREENS.push(['DX-OPS', 'Operational · Demo Experience Center', 'Operational DX', 'ops-dx', 'ready', 'Tim Operational']);
Object.keys(H.pages).filter(p => p !== 'demo').forEach(p => HL.SCREENS.push([PHASE(p), H.pages[p].title, 'Operational OP', routeOf(p), 'ready', 'Tim Operational']));
HL.DXINFO = HL.DXINFO || {};
HL.DXINFO['ops-dx'] = '7 skenario · 5 role · Pandu Saya';

window.addEventListener('hashchange', () => { dockVisibility(); if (pageOf(HL.parseHash().id)) return; syncNav(); });
document.addEventListener('DOMContentLoaded', () => setTimeout(() => { syncNav(); dockVisibility(); }, 0));
/* data demo dibagikan antar-tab hawk-live: perubahan di tab lain tampil setelah kembali ke halaman ini */
window.addEventListener('storage', (e) => { if (e.key !== H.storeKey) return; try { const s = JSON.parse(e.newValue); if (s && s.data) { H.state = s; if (document.getElementById('opx-root')) H.mountPage(); } } catch (er) { /* abaikan */ } });
})();
