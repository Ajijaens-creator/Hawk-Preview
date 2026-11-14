/* HAWK HRD · pemilih akun bernama di portal HRD.
   Pilihan "Role demo" di portal HRD berisi akun tim HRD sesuai nama terdaftar (Made Gunarsa, Harja, Ayu, Putu Dewi D) dan
   peserta alur (Owner, OM, Supervisor, Therapist, Finance Manager). Memilih akun = masuk otomatis dengan role & izin akun itu
   (HR.ROLE_DEFS); audit tercatat atas nama orangnya. Payroll, slip & nominal gaji hanya role Manager HRD (payroll: 'detail').
   UI-ONLY SIMULATION: akun demo, belum terhubung SSO/akun produksi. */
(function () {
'use strict';
const H = window.HL; if (!H || typeof HR === 'undefined') return;
const EMBED = new URLSearchParams(location.search).get('embed') === '1';
/* akun tim HRD (emp dari fixture F1) + peserta alur */
const TEAM = [
  { id: 'made', emp: 'EMP-0142', role: 'hrd', title: 'Manager HRD' },
  { id: 'harja', emp: 'EMP-0145', role: 'hrd-ops', title: 'Koordinator Rekrutmen' },
  { id: 'ayu', emp: 'EMP-0143', role: 'hrd-ops', title: 'Admin HRD' },
  { id: 'hg', emp: 'EMP-0144', role: 'hg-lead', title: 'Lead Human Growth' }
];
const FLOW = [
  { id: 'owner', name: 'Owner', role: 'owner', title: 'Owner' },
  { id: 'eni', emp: 'EMP-0151', role: 'ops-manager', title: 'Operational Manager' },
  { id: 'mila', emp: 'EMP-0153', role: 'outlet-spv', title: 'Supervisor Spa Ubud' },
  { id: 'ari', emp: 'EMP-0001', role: 'therapist', title: 'Therapist Spa Ubud (ESS)' },
  { id: 'asri', emp: 'EMP-0121', role: 'finance-manager', title: 'Finance Manager' }
];
const ALL = [...TEAM, ...FLOW];
const hr = () => H.state.hr;
const nameOf = (a) => a.name || (hr() && (hr().people.find(p => p.id === a.emp) || {}).name) || a.title;
const acct = (id) => ALL.find(a => a.id === id);
const isHrd = () => (document.body.dataset.portal || H.prefs.portal) === 'HRD';
/* akun aktif: persona yang cocok dengan role, atau akun pertama dengan role tersebut */
const current = () => { const a = acct(H.prefs.persona); return a && a.role === H.prefs.role ? a : ALL.find(x => x.role === H.prefs.role) || null; };
const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

let ours = false;
function fill(sel) {
  const cur = current();
  const opt = (a) => `<option value="acct:${a.id}" ${cur && cur.id === a.id ? 'selected' : ''}>${H.esc(nameOf(a))} · ${H.esc(a.title)}</option>`;
  sel.innerHTML = `<optgroup label="Tim HRD">${TEAM.map(opt).join('')}</optgroup><optgroup label="Peserta alur HRD">${FLOW.map(opt).join('')}</optgroup>`;
  const lab = sel.closest('label'); if (lab && lab.firstChild && lab.firstChild.nodeType === 3) lab.firstChild.textContent = 'Akun demo';
  ours = true;
}
function restore(sel) {
  sel.innerHTML = H.ROLES.map(([k, l]) => `<option value="${k}" ${k === H.prefs.role ? 'selected' : ''}>${H.esc(l)}</option>`).join('');
  const lab = sel.closest('label'); if (lab && lab.firstChild && lab.firstChild.nodeType === 3) lab.firstChild.textContent = 'Role demo';
  ours = false;
}
/* sinkronkan pilihan + chip profil setelah setiap render */
function sync() {
  const sel = document.getElementById('role'); if (!sel) return;
  if (!isHrd()) { if (ours) restore(sel); return; }
  if (EMBED && !acct(H.prefs.persona)) return;
  if (!EMBED) { const a = current(); if (a && H.prefs.persona !== a.id) { H.prefs.persona = a.id; H.savePrefs(); } }
  if (!ours) fill(sel);
  const a = current();
  if (a && sel.value !== 'acct:' + a.id) sel.value = 'acct:' + a.id;
  if (!a) return;
  const n = document.getElementById('role-name'), av = document.getElementById('role-av'), sm = n && n.parentElement.querySelector('small');
  const nm = nameOf(a);
  if (n && n.textContent !== nm) n.textContent = nm;
  if (sm && sm.textContent !== a.title) sm.textContent = a.title;
  if (av && av.textContent !== initials(nm)) av.textContent = initials(nm);
}
function choose(id) {
  const a = acct(id); if (!a) return;
  H.prefs.role = a.role; H.prefs.persona = a.id; H.savePrefs();
  H.render(`Masuk sebagai ${nameOf(a)} (${a.title})`);
  sync();
}
document.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('role'); if (!sel) return;
  /* capture di target berjalan sebelum listener app.js: nilai acct:* ditangani di sini */
  sel.addEventListener('change', (e) => { if (!sel.value.startsWith('acct:')) return; e.stopImmediatePropagation(); choose(sel.value.slice(5)); }, true);
  const view = document.getElementById('view'); if (view) new MutationObserver(sync).observe(view, { childList: true });
  window.addEventListener('hashchange', () => setTimeout(sync, 0));
  sync();
});
H.HRD_ACCOUNTS = { TEAM, FLOW, current, choose, nameOf };
})();
