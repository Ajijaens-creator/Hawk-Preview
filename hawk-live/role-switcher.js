/* HAWK 5 Portal · "Ganti role DEMO" dari tombol akun kanan atas (seperti app 60 NV Finance).
   Klik chip akun → daftar akun demo portal aktif → klik satu nama = langsung masuk sebagai akun itu (bukan login).
   - Operational: akun OPX (Manager, Assistant, Hospitality, lalu per outlet: Supervisor, Head, staf) → aksi account-select yang sudah ada.
   - Commercial / Sales: persona tim dari Demo Experience Center portal itu + Owner → role + persona demo.
   - HRD dan portal lain: opsi "Role demo" yang sudah ada di sidebar (HRD = akun bernama dari hrd-accounts.js).
   UI-ONLY SIMULATION: tanpa password, kredensial, SSO atau akun produksi. Mode embed (frame Demo Center) tidak diubah. */
(function () {
'use strict';
const H = window.HL;
if (!H || new URLSearchParams(location.search).get('embed') === '1') return;
const esc = H.esc;
const portal = () => document.body.dataset.portal || H.prefs.portal;
const ini = (n) => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const OWNER = { id: 'owner', name: 'Owner', role: 'owner', title: 'Owner / Eksekutif' };

/* ---------- penyedia daftar akun per portal ---------- */
function opsProvider() {
  const O = window.OPX; if (!O || !Array.isArray(O.accounts) || typeof O.user !== 'function') return null;
  const cur = O.user().id, row = (a) => ({ id: a.id, name: a.name, sub: a.title + ' · ' + (a.outlet ? O.outletName(a.outlet) : 'Semua outlet'), av: a.initials, cur: a.id === cur });
  const groups = [{ label: 'Manajemen Operational', items: O.accounts.filter(a => !a.outlet).map(row) }];
  (O.outlets || []).forEach(o => { const items = O.accounts.filter(a => a.outlet === o.id).map(row); if (items.length) groups.push({ label: O.outletName(o.id), items }); });
  return { groups, pick: (id) => O.actions['account-select']({ dataset: { id } }) };
}
const labOf = () => H.DXLAB && Object.values(H.DXLAB.LABS || {}).find(l => l.portal === portal());
function personaOf(lab) {
  const list = [OWNER, ...lab.team.map(lab.P).filter(Boolean)];
  const p = list.find(x => x.id === H.prefs.persona && x.role === H.prefs.role);
  return { list, cur: p || list.find(x => x.role === H.prefs.role) || null };
}
function teamProvider() {
  const lab = labOf(); if (!lab) return null;
  const { list, cur } = personaOf(lab);
  const row = (p) => ({ id: p.id, name: lab.name ? lab.name(p) : p.name, sub: p.title, av: ini(p.name), cur: !!cur && cur.id === p.id });
  return { groups: [{ label: 'Tim ' + portal(), items: list.filter(p => p !== OWNER).map(row) }, { label: 'Pimpinan', items: [row(OWNER)] }],
    pick: (id) => { const p = list.find(x => x.id === id); if (!p) return; H.prefs.role = p.role; H.prefs.persona = p.id; H.prefs.member = p.member || undefined; H.savePrefs(); H.render('Akun demo: ' + p.name); } };
}
function selectProvider() {
  const sel = document.getElementById('role'); if (!sel || !sel.options.length) return null;
  const row = (o) => { const [name, ...rest] = o.textContent.split(' · '); return { id: o.value, name, sub: rest.join(' · ') || 'Role demo', av: ini(name), cur: o.value === sel.value }; };
  const groups = [], loose = [...sel.children].filter(c => c.tagName === 'OPTION');
  if (loose.length) groups.push({ label: 'Role demo ' + (portal() || ''), items: loose.map(row) });
  sel.querySelectorAll('optgroup').forEach(g => groups.push({ label: g.label, items: [...g.querySelectorAll('option')].map(row) }));
  return { groups, pick: (v) => { sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true })); } };
}
const provider = () => (portal() === 'Operational' && opsProvider()) || (['Commercial', 'Sales'].includes(portal()) && teamProvider()) || selectProvider();

/* ---------- chip Commercial / Sales menampilkan persona aktif ---------- */
function paintChip() {
  if (!['Commercial', 'Sales'].includes(portal())) return;
  const lab = labOf(); if (!lab) return;
  const { cur } = personaOf(lab); if (!cur) return;
  const n = document.getElementById('role-name'), av = document.getElementById('role-av'), sm = n && n.parentElement.querySelector('small');
  if (n) n.textContent = cur.name; if (sm) sm.textContent = cur.title; if (av) av.textContent = ini(cur.name);
}
/* pilihan Role demo di sidebar = role generik → lepaskan persona lama sebelum app merender */
document.addEventListener('change', (e) => { if (e.target && e.target.id === 'role' && ['Commercial', 'Sales'].includes(portal())) { H.prefs.persona = null; H.prefs.member = undefined; } }, true);

/* ---------- popover ---------- */
let pop = null, chip = null;
const close = (focus) => { if (!pop || !pop.classList.contains('on')) return; pop.classList.remove('on'); if (chip) chip.setAttribute('aria-expanded', 'false'); if (focus && chip) chip.focus(); };
function open() {
  const pv = provider(); if (!pv) return;
  pop.innerHTML = `<div class="pop-head"><span aria-hidden="true">👥</span> Ganti role DEMO <span class="badge demo rs-pill">bukan login</span></div>`
    + pv.groups.filter(g => g.items.length).map(g => `<div class="rs-grp" role="presentation">${esc(g.label)}</div>` + g.items.map(it => `<div class="pop-item ${it.cur ? 'cur' : ''}" role="menuitemradio" aria-checked="${it.cur}" tabindex="-1" data-rs="${esc(it.id)}"><span class="av">${esc(it.av || ini(it.name))}</span><span><b>${esc(it.name)}</b><br><span class="tiny muted">${esc(it.sub)}</span></span></div>`).join('')).join('')
    + `<div class="pop-item tiny muted rs-note">Tidak ada password/kredensial. Ganti role hanya untuk demo; data tetap sandbox di browser ini.</div>`;
  pop._pick = pv.pick;
  pop.classList.add('on'); chip.setAttribute('aria-expanded', 'true');
  const r = chip.getBoundingClientRect(), w = Math.min(360, window.innerWidth - 20);
  pop.style.width = w + 'px'; pop.style.top = (r.bottom + 8) + 'px'; pop.style.left = Math.max(10, Math.min(window.innerWidth - w - 10, r.right - w)) + 'px';
  (pop.querySelector('.pop-item.cur') || pop.querySelector('[data-rs]'))?.focus();
  pop.querySelector('.pop-item.cur')?.scrollIntoView({ block: 'nearest' });
}
function choose(el) { const pick = pop._pick, id = el.dataset.rs; close(false); if (pick) pick(id); setTimeout(paintChip, 0); }

function mount() {
  chip = document.querySelector('.topbar .role-chip'); if (!chip || chip.dataset.rs) return;
  chip.dataset.rs = '1'; chip.setAttribute('role', 'button'); chip.tabIndex = 0;
  chip.setAttribute('aria-haspopup', 'menu'); chip.setAttribute('aria-expanded', 'false'); chip.title = 'Ganti role DEMO';
  chip.setAttribute('aria-label', 'Akun demo aktif. Klik untuk ganti role DEMO');
  pop = document.createElement('div'); pop.className = 'pop rs-pop'; pop.id = 'hl-role-pop'; pop.setAttribute('role', 'menu'); pop.setAttribute('aria-label', 'Ganti role DEMO');
  document.body.appendChild(pop);
  chip.addEventListener('click', (e) => { e.stopPropagation(); pop.classList.contains('on') ? close(false) : open(); });
  chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); open(); } });
  pop.addEventListener('click', (e) => { e.stopPropagation(); const it = e.target.closest('[data-rs]'); if (it) choose(it); });
  pop.addEventListener('keydown', (e) => {
    const items = [...pop.querySelectorAll('[data-rs]')], i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]; if (n) n.focus(); }
    else if ((e.key === 'Enter' || e.key === ' ') && i >= 0) { e.preventDefault(); choose(items[i]); }
  });
  document.addEventListener('click', () => close(false));
  window.addEventListener('resize', () => close(false));
  window.addEventListener('hashchange', () => close(false));
  const view = document.getElementById('view'); if (view) new MutationObserver(paintChip).observe(view, { childList: true });
  paintChip();
}
H.roleSwitcher = { open: () => { mount(); open(); }, close, provider };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
