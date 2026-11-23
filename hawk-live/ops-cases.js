/* HAWK Operational · Hospitality Case Workbench (A03 U-01 + drawer M-09, F-OP07). DATA DEMO / SIMULASI.
   Satu sumber case: guest case dan issue fasilitas berada di store yang sama (H.state.data.issues), sehingga
   Command Center, Communication Hub, Workbench dan DX membaca penghitung yang sama (A03-R11).
   Case tamu tertaut ke feedback/kunjungan; lifecycle: baru → triase → ditangani → (menunggu tamu) → selesai →
   diverifikasi, dengan reopen. SLA respons dan SLA selesai terpisah; kasus terbuka tampil sebagai aging.
   Backend: entitas case belum ada di hawk-backend-erp (peta A03 #11, status X). Tidak ada WA/email yang dikirim. */
(function () {
'use strict';
const H = window.OPX; if (!H) return;
const e = H.escape;
const NOW = () => new Date().toISOString();
/* SLA draft v0 (Keputusan Owner #4 di dokumen A03 masih terbuka) */
const SLA = { respondH: 2, resolveH: 24, version: 'draft v0 · menunggu pengesahan Owner' };
const P7 = ['People', 'Product', 'Process', 'Place', 'Facility', 'Promotion', 'Price'];
const SOURCES = ['Feedback kunjungan', 'Keluhan langsung di outlet', 'Google', 'Tripadvisor', 'WhatsApp'];
const STATES = {
  baru: ['Baru', 'gold'], triase: ['Triase', 'blue'], ditangani: ['Ditangani', 'blue'], menunggu_tamu: ['Menunggu tamu', 'gray'],
  selesai: ['Selesai · menunggu verifikasi', 'green'], diverifikasi: ['Diverifikasi', 'green'], reopen: ['Dibuka ulang', 'red'],
};
const CLOSED = ['selesai', 'diverifikasi'];
const LEAD = ['manager', 'assistant', 'hospitality'];
const ROLES = ['manager', 'assistant', 'hospitality', 'supervisor', 'head', 'reception'];

/* ---------- akses & penghitung tunggal ---------- */
H.defaultPermissions && ROLES.forEach(r => { const g = H.defaultPermissions[r]; if (g && !g.includes('cases')) g.push('cases'); });
const u = () => H.user();
const isLead = () => LEAD.includes(u().role);
/* satu aturan visibilitas untuk semua layar: manajemen & Hospitality = semua outlet dalam lingkup;
   Supervisor = outlet sendiri; Head/staf = departemen sendiri, laporan sendiri, atau PIC */
const visible = () => H.scope(H.state.data.issues).filter(i => isLead() || u().role === 'supervisor' || i.dept === u().dept || i.reporter === u().id || i.pic === u().id);
const isOpen = (i) => i.status !== 'resolved' && !['closed', 'done'].includes(i.status);
H.cases = { SLA, P7, STATES, visible, open: () => visible().filter(isOpen), guest: () => visible().filter(i => i.kind === 'guest') };
H.visibleIssues = visible; /* dipakai Command Center & Communication Hub (patch generator) */

const hours = (a, b) => (new Date(b || NOW()) - new Date(a)) / 36e5;
const ago = (h) => h < 1 ? Math.max(0, Math.round(h * 60)) + ' mnt' : h < 48 ? Math.round(h) + ' jam' : Math.round(h / 24) + ' hari';
const tLabel = (at) => at ? new Date(at).toLocaleString('id-ID', { timeZone: 'Asia/Makassar', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WITA' : '—';
function sla(c) {
  if (c.kind !== 'guest') return null;
  const rDue = new Date(c.createdAt).getTime() + SLA.respondH * 36e5, fDue = new Date(c.createdAt).getTime() + SLA.resolveH * 36e5;
  const resp = c.respondedAt ? (new Date(c.respondedAt) <= rDue ? 'met' : 'late') : (Date.now() > rDue ? 'overdue' : 'running');
  const doneAt = c.resolvedAt && CLOSED.includes(c.caseState) ? c.resolvedAt : null;
  const fin = doneAt ? (new Date(doneAt) <= fDue ? 'met' : 'late') : (Date.now() > fDue ? 'overdue' : 'running');
  return { resp, fin, rDue: new Date(rDue).toISOString(), fDue: new Date(fDue).toISOString() };
}
const SLA_L = { met: ['Tepat SLA', 'green'], late: ['Lewat SLA', 'red'], overdue: ['Lewat SLA · berjalan', 'red'], running: ['Berjalan', 'gray'] };

/* ---------- seed (tanpa nama tamu asli; outlet Ubud dibiarkan kosong untuk DX) ---------- */
function ensure() {
  const d = H.state.data; if (!Array.isArray(d.issues)) d.issues = [];
  if (d.casesSeed === 'a03-v1') return;
  const base = Date.now();
  const at = (h) => new Date(base - h * 36e5).toISOString();
  const mk = (o, n, x) => ({ id: `CASE-${o}-${n}`, kind: 'guest', outlet: o, dept: 'reception', priority: 'Normal', status: 'open', owner: `spv-${o}`, reporter: `reception-${o}`, events: [], ...x });
  const seed = [
    mk('SHT', '001', { title: 'Tamu menunggu 25 menit melewati jadwal', note: 'Feedback kunjungan: rating 2, alasan waktu tunggu. (demo)', category7P: 'Process', source: 'Feedback kunjungan', visitRef: 'VIS-SHT-DEMO-31', createdAt: at(5), caseState: 'ditangani', pic: 'spv-SHT', respondedAt: at(4.2) }),
    mk('TRL', '001', { title: 'Handuk ruang couple kurang bersih', note: 'Keluhan langsung di resepsionis setelah treatment. (demo)', category7P: 'Facility', source: 'Keluhan langsung di outlet', visitRef: 'VIS-TRL-DEMO-12', priority: 'Kritis', createdAt: at(3.5), caseState: 'baru' }),
    mk('BSM', '001', { title: 'Tekanan pijat tidak sesuai permintaan', note: 'Ulasan Google bintang 2. (demo)', category7P: 'People', source: 'Google', createdAt: at(30), caseState: 'diverifikasi', status: 'resolved', pic: 'spv-BSM', respondedAt: at(29.5), resolvedAt: at(20), resolvedBy: 'spv-BSM', recovery: 'Tamu dihubungi, ditawarkan sesi koreksi 30 menit; Head Therapist briefing ulang terapis. (demo)', verifiedAt: at(18), verifiedBy: 'hosp-jro-okta' }),
  ];
  seed.forEach(c => { c.events = [{ at: c.createdAt, actor: c.reporter, state: 'baru', note: 'Case dibuka (seed demo).' }]; if (!d.issues.some(x => x.id === c.id)) d.issues.push(c); });
  d.casesSeed = 'a03-v1';
}

/* ---------- aksi ---------- */
const reject = (m) => { H.toast(m || 'Aksi ini tidak termasuk kewenangan akun demo Anda.'); return false; };
const find = (id) => visible().find(i => i.id === id);
const canAct = (c, what) => {
  if (!c || c.kind !== 'guest' || !H.has('cases')) return false;
  const me = u(), mine = c.pic === me.id || (me.role === 'supervisor' && me.outlet === c.outlet);
  switch (what) {
    case 'triage': return isLead() && ['baru', 'reopen'].includes(c.caseState);
    case 'respond': return mine && ['triase', 'reopen'].includes(c.caseState);
    case 'wait': return mine && c.caseState === 'ditangani';
    case 'resolve': return mine && ['ditangani', 'menunggu_tamu'].includes(c.caseState);
    case 'verify': return isLead() && c.caseState === 'selesai' && c.resolvedBy !== me.id && c.pic !== me.id;
    case 'reopen': return isLead() && CLOSED.includes(c.caseState);
    default: return false;
  }
};
function move(c, state, note, patch = {}) {
  Object.assign(c, patch, { caseState: state, status: CLOSED.includes(state) ? 'resolved' : 'open', updatedAt: NOW() });
  c.events = c.events || []; c.events.push({ at: NOW(), actor: u().id, state, note: String(note || '').slice(0, 500) });
  H.log('CASE_' + state.toUpperCase(), c.id, `Case ${c.id} → ${STATES[state][0]}. Demo lokal, tidak ada pesan ke tamu.`, c.outlet);
  H.save(); H.render();
}
const picOptions = (o) => [[`spv-${o}`, 'Supervisor'], [`head-reception-${o}`, 'Head Reception'], [`head-therapist-${o}`, 'Head Therapist'], [`head-attendant-${o}`, 'Head Attendant']]
  .filter(([id]) => H.accounts.some(a => a.id === id)).map(([id, t]) => `<option value="${id}">${e(H.accountName(id))} · ${t}</option>`).join('');

/* feedback rendah dari Dashboard Kinerja yang belum punya case (antrean untuk Hospitality) */
function feedbackQueue() {
  if (!H.analytics || !H.has('analytics')) return [];
  const linked = new Set(H.state.data.issues.filter(i => i.feedbackRef).map(i => i.feedbackRef));
  return H.scope(H.analytics.ensure().records).filter(r => r.group === 'feedback' && ['submitted', 'verified'].includes(r.status) && !linked.has(r.id) &&
    (Number(r.values.rating) <= 2 || r.values.satisfaction === 'Tidak puas')).sort((a, b) => String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date))).slice(0, 8);
}

function createModal(pre = {}) {
  if (!H.has('cases')) return reject();
  const fixed = !H.isManager() ? u().outlet : (H.state.outletId !== 'all' ? H.state.outletId : '');
  const outlet = pre.outlet || fixed;
  H.modal('Buka case Hospitality', `<form data-form="caseCreate">${pre.feedbackRef ? `<input type="hidden" name="feedbackRef" value="${e(pre.feedbackRef)}">` : ''}
    <div class="notice small">Satu case per kejadian tamu. Case dari feedback menautkan record feedback yang sama, sehingga tidak ada form kasus kedua. <b>Simulasi</b>: tidak ada pesan ke tamu.</div>
    <label class="field">Outlet<select name="outlet" required ${pre.outlet || !H.isManager() ? 'disabled' : ''}>${!outlet ? '<option value="">Pilih outlet</option>' : ''}${H.outlets.filter(o => H.isManager() || o.id === u().outlet).map(o => `<option value="${o.id}" ${o.id === outlet ? 'selected' : ''}>${e(o.name)}</option>`).join('')}</select></label>
    ${pre.outlet || !H.isManager() ? `<input type="hidden" name="outlet" value="${e(outlet)}">` : ''}
    <label class="field">Ringkasan keluhan<input name="title" required minlength="6" maxlength="120" value="${e(pre.title || '')}" placeholder="Contoh: Tamu menunggu lama sebelum treatment"></label>
    <div class="grid-2"><label class="field">Sumber<select name="source">${SOURCES.map(s => `<option ${s === (pre.source || SOURCES[1]) ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
    <label class="field">Kategori 7P<select name="category7P" required><option value="">Pilih</option>${P7.map(p => `<option>${p}</option>`).join('')}</select></label></div>
    <div class="grid-2"><label class="field">Referensi kunjungan (demo)<input name="visitRef" maxlength="40" value="${e(pre.visitRef || '')}" placeholder="VIS-…"></label>
    <label class="field">Prioritas<select name="priority"><option>Normal</option><option>Kritis</option></select></label></div>
    <label class="field">Catatan<textarea name="note" required minlength="5" maxlength="1000">${e(pre.note || '')}</textarea></label>
    <p class="small muted">Outlet, pelapor dan waktu terisi otomatis dari akun. SLA respons ${SLA.respondH} jam, selesai ${SLA.resolveH} jam (${SLA.version}).</p>
    <button class="btn btn-primary" type="submit">Buka case</button></form>`);
}
H.actions['case-create'] = () => createModal();
H.actions['case-from-feedback'] = (el) => {
  const r = H.analytics && H.analytics.ensure().records.find(x => x.id === el.dataset.id && H.scope([x]).length);
  if (!r) return reject('Record feedback tidak ditemukan dalam lingkup akun.');
  createModal({ outlet: r.outlet, feedbackRef: r.id, visitRef: r.values.visitRef || '', source: 'Feedback kunjungan', title: `Feedback rating ${r.values.rating || '—'}: tindak lanjut tamu`, note: r.values.comment || `${r.values.platform || ''} · ${r.values.satisfaction || ''}`.trim() });
};
H.forms.caseCreate = (fd) => {
  if (!H.has('cases')) return reject();
  const outlet = String(fd.get('outlet') || ''), title = String(fd.get('title') || '').trim(), note = String(fd.get('note') || '').trim(), cat = String(fd.get('category7P') || '');
  if (!H.outlets.some(o => o.id === outlet) || (!H.isManager() && outlet !== u().outlet)) return reject('Outlet di luar lingkup akun.');
  if (title.length < 6 || note.length < 5 || !P7.includes(cat)) return H.toast('Lengkapi ringkasan, kategori 7P dan catatan.');
  const fb = String(fd.get('feedbackRef') || '');
  if (fb && H.state.data.issues.some(i => i.feedbackRef === fb)) return H.toast('Feedback ini sudah punya case. Buka case yang ada.');
  const n = H.state.data.issues.filter(i => i.kind === 'guest' && i.outlet === outlet).length + 1;
  let id = `CASE-${outlet}-${String(n).padStart(3, '0')}`; while (H.state.data.issues.some(i => i.id === id)) id += 'b';
  const c = { id, kind: 'guest', outlet, dept: 'reception', title: title.slice(0, 120), note: note.slice(0, 1000), category7P: cat, source: SOURCES.includes(fd.get('source')) ? fd.get('source') : SOURCES[1],
    visitRef: String(fd.get('visitRef') || '').slice(0, 40) || null, feedbackRef: fb || null, priority: fd.get('priority') === 'Kritis' ? 'Kritis' : 'Normal',
    owner: `spv-${outlet}`, reporter: u().id, createdAt: NOW(), caseState: 'baru', status: 'open', events: [{ at: NOW(), actor: u().id, state: 'baru', note: fb ? 'Dibuka dari feedback ' + fb : 'Case dibuka.' }] };
  H.state.data.issues.push(c); H.log('CASE_OPENED', c.id, 'Case Hospitality dibuka; satu penghitung dengan Issue Center.', outlet);
  H.closeModal(); H.save(); H.render(); openCase(c.id); H.toast('Case ' + c.id + ' dibuka (simulasi).');
};
const stepForm = (c, what, label, field = '') => `<form data-form="caseStep" class="stack case-step"><input type="hidden" name="id" value="${e(c.id)}"><input type="hidden" name="what" value="${what}">${field}<label class="field">Catatan<textarea name="note" required minlength="${what === 'resolve' ? 10 : 3}" maxlength="500" placeholder="${what === 'resolve' ? 'Tindakan recovery dan hasil ke tamu…' : 'Catatan singkat…'}"></textarea></label><button class="btn btn-primary btn-sm" type="submit">${label}</button></form>`;
H.forms.caseStep = (fd) => {
  const c = find(String(fd.get('id'))), what = String(fd.get('what')), note = String(fd.get('note') || '').trim();
  if (!canAct(c, what)) return reject();
  if (note.length < (what === 'resolve' ? 10 : 3)) return H.toast(what === 'resolve' ? 'Tuliskan tindakan recovery minimal 10 karakter.' : 'Isi catatan singkat.');
  if (what === 'triage') { const pic = String(fd.get('pic') || ''); if (!pic.endsWith('-' + c.outlet)) return reject('PIC harus dari outlet case.'); move(c, 'triase', note, { pic, priority: fd.get('priority') === 'Kritis' ? 'Kritis' : c.priority, triagedBy: u().id }); }
  else if (what === 'respond') move(c, 'ditangani', note, { respondedAt: c.respondedAt || NOW() });
  else if (what === 'wait') move(c, 'menunggu_tamu', note);
  else if (what === 'resolve') move(c, 'selesai', note, { recovery: note.slice(0, 500), resolvedAt: NOW(), resolvedBy: u().id });
  else if (what === 'verify') move(c, 'diverifikasi', note, { verifiedAt: NOW(), verifiedBy: u().id });
  else if (what === 'reopen') move(c, 'reopen', note, { resolvedAt: null, verifiedAt: null, verifiedBy: null, reopened: (c.reopened || 0) + 1 });
  openCase(c.id);
};

/* ---------- drawer case (M-09) ---------- */
function openCase(id) {
  const c = find(id); if (!c) return reject('Case tidak ditemukan dalam lingkup akun.');
  if (c.kind !== 'guest') return H.actions['issue-open-base'] ? H.actions['issue-open-base']({ dataset: { id } }) : null;
  const s = sla(c), st = STATES[c.caseState] || [c.caseState, 'gray'];
  const fb = c.feedbackRef && H.analytics ? H.analytics.ensure().records.find(r => r.id === c.feedbackRef) : null;
  const steps = [
    canAct(c, 'triage') && stepForm(c, 'triage', 'Simpan triase & tetapkan PIC', `<div class="grid-2"><label class="field">PIC<select name="pic">${picOptions(c.outlet)}</select></label><label class="field">Prioritas<select name="priority"><option ${c.priority !== 'Kritis' ? 'selected' : ''}>Normal</option><option ${c.priority === 'Kritis' ? 'selected' : ''}>Kritis</option></select></label></div>`),
    canAct(c, 'respond') && stepForm(c, 'respond', 'Catat respons pertama ke tamu'),
    canAct(c, 'wait') && stepForm(c, 'wait', 'Tandai menunggu tamu'),
    canAct(c, 'resolve') && stepForm(c, 'resolve', 'Catat recovery & selesaikan'),
    canAct(c, 'verify') && stepForm(c, 'verify', 'Verifikasi hasil recovery'),
    canAct(c, 'reopen') && stepForm(c, 'reopen', 'Buka ulang case'),
  ].filter(Boolean);
  H.modal(c.title, `<div class="stack case-drawer">
    <div class="row wrap">${H.badge(st[0], st[1])}${H.badge(c.priority, c.priority === 'Kritis' ? 'red' : 'gold')}${H.badge('7P · ' + (c.category7P || '—'), 'gray')}${H.badge('Simulasi', 'gold')}</div>
    <p class="small muted">${e(c.id)} · ${e(H.outletName(c.outlet))} · ${e(c.source || '')} · dibuka ${tLabel(c.createdAt)} oleh ${e(H.accountName(c.reporter))}</p>
    <div class="note-box">${e(c.note)}</div>
    <div class="case-facts"><div><small>PIC</small><b>${c.pic ? e(H.accountName(c.pic)) : 'Belum ditetapkan'}</b></div>
      <div><small>SLA respons (${SLA.respondH} jam)</small>${H.badge(SLA_L[s.resp][0], SLA_L[s.resp][1])}<span class="small">${c.respondedAt ? 'dijawab ' + tLabel(c.respondedAt) : 'batas ' + tLabel(s.rDue)}</span></div>
      <div><small>SLA selesai (${SLA.resolveH} jam)</small>${H.badge(SLA_L[s.fin][0], SLA_L[s.fin][1])}<span class="small">${CLOSED.includes(c.caseState) ? 'selesai ' + tLabel(c.resolvedAt) : 'aging ' + ago(hours(c.createdAt))}</span></div></div>
    <div class="case-links"><small>Tertaut ke</small>${fb ? `<span>Feedback <b class="mono">${e(fb.id)}</b> · rating ${e(fb.values.rating)} · ${e(fb.status)}</span>` : '<span class="muted">Tidak dari feedback</span>'}${c.visitRef ? `<span>Kunjungan <b class="mono">${e(c.visitRef)}</b> (POS existing, belum terhubung)</span>` : ''}${c.taskId ? `<span>Tugas <b class="mono">${e(c.taskId)}</b></span>` : ''}</div>
    ${c.recovery ? `<div class="notice"><b>Recovery</b><br>${e(c.recovery)}<br><span class="small">${e(H.accountName(c.resolvedBy))} · ${tLabel(c.resolvedAt)}${c.verifiedBy ? ` · diverifikasi ${e(H.accountName(c.verifiedBy))}` : ''}</span></div>` : ''}
    <section><h3 class="eyebrow">RIWAYAT</h3><ol class="case-timeline">${(c.events || []).map(v => `<li><b>${e((STATES[v.state] || [v.state])[0])}</b> · ${e(H.accountName(v.actor))} · ${tLabel(v.at)}${v.note ? `<br><span class="small muted">${e(v.note)}</span>` : ''}</li>`).join('')}</ol></section>
    ${steps.length ? steps.join('') : `<p class="small muted">${CLOSED.includes(c.caseState) ? 'Case tertutup.' : 'Tidak ada aksi untuk akun ini pada status sekarang.'} Pelaksana tidak memverifikasi recovery miliknya sendiri.</p>`}
  </div>`);
}
H.actions['case-open'] = (el) => openCase(el.dataset.id);
/* Issue Center: guest case dibuka dengan drawer case; issue fasilitas tetap memakai detail existing */
if (H.actions['issue-open'] && !H.actions['issue-open-base']) {
  H.actions['issue-open-base'] = H.actions['issue-open'];
  H.actions['issue-open'] = (el) => { const c = find(el.dataset.id); return c && c.kind === 'guest' ? openCase(c.id) : H.actions['issue-open-base'](el); };
}
H.actions['case-filter'] = (el) => { H.ui.caseFilter = el.dataset.id; H.render(); };

/* ---------- halaman Workbench (U-01) ---------- */
const FILTERS = [['open', 'Terbuka'], ['triage', 'Baru & triase'], ['handling', 'Ditangani'], ['closed', 'Selesai & diverifikasi'], ['all', 'Semua']];
const match = (f, c) => f === 'all' || (f === 'open' ? !CLOSED.includes(c.caseState) : f === 'triage' ? ['baru', 'reopen', 'triase'].includes(c.caseState) : f === 'handling' ? ['ditangani', 'menunggu_tamu'].includes(c.caseState) : CLOSED.includes(c.caseState));
H.pages.cases = {
  title: 'Hospitality Case Workbench', phase: 'F-OP07',
  subtitle: 'Tamu mana yang harus dipulihkan sekarang: triase, PIC, recovery, verifikasi dan reopen dalam satu case.',
  contract: 'Case tunggal tertaut feedback/appointment (A03-R11). Entitas case belum ada di backend HAWK (peta A03 #11, X); butuh tabel case + event lifecycle, tautan spa_feedback_id dan appointment, serta penegakan scope server. SLA draft v0. Tidak ada pengiriman WA/email.',
  actions: () => H.has('cases') ? `<button class="btn btn-primary btn-sm" data-act="case-create">${H.icon('plus', 14)} Buka case</button>` : '',
  render() {
    ensure();
    const all = H.cases.guest(), f = H.ui.caseFilter || 'open', list = all.filter(c => match(f, c)).sort((a, b) => (CLOSED.includes(a.caseState) - CLOSED.includes(b.caseState)) || String(a.createdAt).localeCompare(String(b.createdAt)));
    const open = all.filter(c => !CLOSED.includes(c.caseState)), q = feedbackQueue();
    const overdue = open.filter(c => ['overdue'].includes(sla(c).resp) || sla(c).fin === 'overdue').length;
    const awaitV = all.filter(c => c.caseState === 'selesai').length;
    const oldest = open.length ? ago(Math.max(...open.map(c => hours(c.createdAt)))) : '—';
    const stat = (l, v, n) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div><div class="stat-note">${n}</div></div>`;
    return `<div class="notice mb"><b>Case Hospitality · DATA DEMO.</b> Satu case per kejadian tamu, dihitung bersama issue di Command Center dan Communication Hub. SLA ${SLA.respondH} jam respons / ${SLA.resolveH} jam selesai adalah ${e(SLA.version)}.</div>
    <div class="kpi-grid">${stat('Case tamu terbuka', open.length, 'termasuk dibuka ulang')}${stat('Lewat SLA', overdue, 'respons atau selesai')}${stat('Menunggu verifikasi', awaitV, 'verifier ≠ PIC')}${stat('Aging tertua', oldest, 'case terbuka, bukan durasi 0')}</div>
    ${q.length ? `<section class="card mt"><div class="card-head"><div><h2 class="card-title">Feedback perlu tindak lanjut</h2><p class="small muted">Rating ≤ 2 atau "Tidak puas" dari Dashboard Kinerja yang belum punya case. Aturan pemicu draft v0 (Keputusan Owner #3).</p></div>${H.badge(q.length + ' feedback', 'gold')}</div>
      <div class="table-wrap"><table><thead><tr><th>Record</th><th>Outlet</th><th>Rating</th><th>Catatan</th><th>Status</th><th></th></tr></thead><tbody>${q.map(r => `<tr><td class="mono small">${e(r.id)}</td><td>${e(H.outletName(r.outlet))}</td><td>${e(r.values.rating)}</td><td>${e(r.values.comment || r.values.satisfaction || '')}</td><td>${H.badge(r.status === 'verified' ? 'Terverifikasi' : 'Diajukan', r.status === 'verified' ? 'green' : 'gold')}</td><td>${H.has('cases') ? `<button class="btn btn-sm" data-act="case-from-feedback" data-id="${e(r.id)}">Buka case</button>` : ''}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
    <section class="card mt"><div class="card-head"><div><h2 class="card-title">Daftar case</h2><p class="small muted">Klik baris untuk drawer case: timeline, SLA, tautan feedback/kunjungan dan aksi sesuai peran.</p></div></div>
      <div class="tabs">${FILTERS.map(([id, l]) => `<button class="tab ${f === id ? 'active' : ''}" data-act="case-filter" data-id="${id}" aria-pressed="${f === id}">${l} <span>${all.filter(c => match(id, c)).length}</span></button>`).join('')}</div>
      ${list.length ? `<div class="table-wrap"><table class="case-table"><thead><tr><th>Case</th><th>Outlet</th><th>7P</th><th>Status</th><th>PIC</th><th>SLA respons</th><th>SLA selesai</th><th>Aging</th></tr></thead><tbody>${list.map(c => { const s = sla(c), st = STATES[c.caseState] || [c.caseState, 'gray']; return `<tr data-act="case-open" data-id="${e(c.id)}" tabindex="0" class="case-row"><td><b>${e(c.title)}</b><small class="mono">${e(c.id)}${c.feedbackRef ? ' · dari feedback' : ''}</small></td><td>${e(H.outletName(c.outlet))}</td><td>${e(c.category7P || '—')}</td><td>${H.badge(st[0], st[1])}</td><td>${c.pic ? e(H.accountName(c.pic)) : '<span class="muted">—</span>'}</td><td>${H.badge(SLA_L[s.resp][0], SLA_L[s.resp][1])}</td><td>${H.badge(SLA_L[s.fin][0], SLA_L[s.fin][1])}</td><td>${CLOSED.includes(c.caseState) ? '<span class="muted">tertutup</span>' : ago(hours(c.createdAt))}</td></tr>`; }).join('')}</tbody></table></div>` : `<div class="empty">Belum ada case pada filter ini dalam lingkup akun.</div>`}
    </section>
    <div class="notice mt small">Menyelesaikan case tidak mengubah pembayaran, poin atau jadwal tamu. Kompensasi, refund dan pengecualian harga tetap melalui POS/Sales dengan izin khusus.</div>`;
  },
};
/* menu: tepat setelah Communication Hub (grup Pelaksanaan) */
const at = H.navItems.findIndex(n => n[0] === 'communication');
if (!H.navItems.some(n => n[0] === 'cases')) H.navItems.splice(at + 1, 0, ['cases', 'Hospitality Case', 'chat', '07', '']);
/* seed saat state siap (setelah load/reset) */
const baseRefresh = H.refreshReadModel;
H.refreshReadModel = () => { ensure(); return baseRefresh ? baseRefresh() : undefined; };
H.casesEnsure = ensure;

/* ---------- Demo Experience Center: perjalanan A03 (dokumen NB A03 bagian 6) ----------
   DX-1 → DX-OP09 (baru) · DX-2 → DX-OP02 existing · DX-3 → DX-OP04 existing · DX-4 → DX-OP06 existing ·
   DX-5 → DX-OP10 (baru) · DX-6 → DX-OP11 (baru). Langkah state dibuktikan dari data demo, bukan dicentang. */
/* DX memeriksa izin halaman dari grants; Gudang & Stok BHP mengikuti izin Inventory (ops-warehouse.js) */
H.defaultPermissions && Object.values(H.defaultPermissions).forEach(g => { if (g.includes('inventory') && !g.includes('warehouse')) g.push('warehouse'); });
if (H.demo && Array.isArray(H.demo.scenarios) && !H.demo.scenarios.some(s => s.id === 'guest-case')) {
  const acct = (role, o) => role === 'hospitality' ? 'hosp-jro-okta' : role === 'manager' ? 'mgr-eni' : `${role === 'supervisor' ? 'spv' : role}-${o}`;
  const M = (title, role, page, instruction, expected, check, extra = {}) => ({ title, role, page, instruction, expected, check, kind: 'state', ...extra });
  const R = (title, role, page, instruction, expected, extra = {}) => ({ title, role, page, instruction, expected, kind: 'manual', ...extra });
  const recs = () => (H.analytics ? H.analytics.ensure().records : []);
  const mine = (r, group, role, f = () => true) => recs().filter(x => x.group === group && x.outlet === r.outlet && x.authorId === acct(role, r.outlet) && String(x.createdAt) >= r.startedAt && f(x));
  const lowFb = (r) => mine(r, 'feedback', 'reception', x => Number(x.values.rating) <= 2 && ['submitted', 'verified'].includes(x.status));
  const runCase = (r) => { const ids = lowFb(r).map(x => x.id); return H.state.data.issues.find(i => i.kind === 'guest' && i.outlet === r.outlet && ids.includes(i.feedbackRef) && String(i.createdAt) >= r.startedAt); };
  const waste = (r, kind) => mine(r, 'waste', 'attendant', x => !kind || x.values.kind === kind);
  H.demo.scenarios.push(
    { id: 'guest-case', code: 'DX-OP09', icon: 'chat', title: 'Treatment → feedback → Hospitality case', minutes: '6–8 menit', people: 'Reception → Jro Okta → Supervisor → Jro Okta → Manager',
      summary: 'Feedback rendah dari satu kunjungan menjadi satu case dengan PIC, SLA, recovery dan verifikasi.', outcome: 'Satu case tertaut feedback; Command Center dan Communication Hub menghitung case yang sama.', steps: [
      M('Catat feedback rendah', 'reception', 'analytics', 'Buka Input data operasional pada Review & feedback. Isi Visit ID baru, rating 1 atau 2, pernyataan "Tidak puas" dan catatan singkat, lalu kirim.', 'Record feedback tersimpan dengan rating ≤ 2.', r => lowFb(r).length > 0, { ui: { analyticsId: 'reviews', analyticsTab: 'entry' }, action: 'analytics-entry', actionData: () => ({ id: 'reviews' }) }),
      M('Buka case dari feedback', 'hospitality', 'cases', 'Di "Feedback perlu tindak lanjut", tekan Buka case pada feedback baru. Pilih kategori 7P lalu simpan.', 'Case baru menautkan record feedback yang sama; tidak ada form kasus kedua.', r => !!runCase(r)),
      M('Triase & tetapkan PIC', 'hospitality', 'cases', 'Buka case tersebut, pilih PIC Supervisor outlet dan tulis catatan triase.', 'Status Triase dengan PIC Supervisor; SLA respons berjalan.', r => { const c = runCase(r); return !!c && c.pic === acct('supervisor', r.outlet) && c.caseState !== 'baru'; }),
      M('Respons & recovery oleh PIC', 'supervisor', 'cases', 'Catat respons pertama ke tamu, lalu catat tindakan recovery dan selesaikan case.', 'Case Selesai menunggu verifikasi; waktu respons dan selesai tercatat terpisah.', r => { const c = runCase(r); return !!c && !!c.respondedAt && ['selesai', 'diverifikasi'].includes(c.caseState) && c.resolvedBy === acct('supervisor', r.outlet); }),
      M('Verifikasi hasil recovery', 'hospitality', 'cases', 'Buka case yang selesai dan verifikasi hasil recovery.', 'Case Diverifikasi oleh Jro Okta; pelaksana tidak memverifikasi miliknya sendiri.', r => { const c = runCase(r); return !!c && c.caseState === 'diverifikasi' && c.verifiedBy === 'hosp-jro-okta'; }),
      R('Cocokkan penghitung', 'manager', 'communication', 'Buka Issue Center, lalu Command Center. Bandingkan jumlah issue terbuka untuk outlet yang sama.', 'Angka sama karena case dan issue berasal dari satu store.', { ui: { commTab: 'issues' } }),
    ] },
    { id: 'waste-opname', code: 'DX-OP10', icon: 'box', title: 'Waste & stock opname', minutes: '5–7 menit', people: 'Attendant → Supervisor → Manager',
      summary: 'Catat waste dan hasil hitung fisik sekali per kejadian, lalu verifikasi tanpa mengubah stok.', outcome: 'Dua catatan terverifikasi mengisi dashboard Waste; penyesuaian stok tetap milik Inventory.', steps: [
      M('Catat waste BHP', 'attendant', 'analytics', 'Pada Waste & pemeriksaan stok pilih Jenis "Waste", isi item, jumlah, nilai referensi dan alasan, lalu kirim.', 'Catatan waste tersimpan; nilai Rp dihitung dari jumlah × nilai satuan.', r => waste(r, 'Waste').length > 0, { ui: { analyticsId: 'waste', analyticsTab: 'entry' }, action: 'analytics-entry', actionData: () => ({ id: 'waste' }) }),
      M('Catat hasil stock opname', 'attendant', 'analytics', 'Tambah catatan baru dengan Jenis "Stock opname": isi jumlah menurut stok dan jumlah fisik item yang dihitung.', 'Selisih sistem vs fisik tercatat per item.', r => waste(r, 'Stock opname').length > 0, { ui: { analyticsId: 'waste', analyticsTab: 'entry' }, action: 'analytics-entry', actionData: () => ({ id: 'waste' }) }),
      M('Verifikasi kedua catatan', 'supervisor', 'analytics', 'Di Data & verifikasi, periksa bukti dan verifikasi catatan waste dan opname.', 'Keduanya Verified oleh Supervisor; pembuat dan verifier berbeda.', r => ['Waste', 'Stock opname'].every(k => waste(r, k).some(x => x.status === 'verified' && x.verifiedBy === acct('supervisor', r.outlet))), { ui: { analyticsId: 'waste', analyticsTab: 'entry' } }),
      R('Pastikan stok tidak berubah', 'supervisor', 'warehouse', 'Buka Gudang & Stok BHP. Saldo tidak berubah oleh catatan waste/opname; penyesuaian resmi dilakukan Inventory (count & adjustment existing).', 'Operational mencatat fakta; Inventory memposting.'),
      R('Baca dashboard Waste', 'manager', 'analytics', 'Buka dashboard Waste. Akurasi opname dihitung dari baris hitung, bukan diketik sebagai persen.', 'Rumus dan sumber terlihat; standar yang belum disahkan berlabel pending.', { ui: { analyticsId: 'waste', analyticsTab: 'dashboard' } }),
    ] },
    { id: 'correction', code: 'DX-OP11', icon: 'shield', title: 'Koreksi data & data kosong', minutes: '5–7 menit', people: 'Attendant → Supervisor → Manager',
      summary: 'Data yang salah dikembalikan dan diperbaiki sebagai versi baru; periode tanpa data tidak dibaca sebagai nol.', outcome: 'Catatan v2 terverifikasi dengan riwayat versi lama; data kosong tampil kosong.', steps: [
      M('Kirim catatan waste', 'attendant', 'analytics', 'Catat satu waste dengan jumlah yang sengaja keliru, lalu kirim untuk verifikasi.', 'Catatan berstatus Submitted.', r => waste(r).length > 0, { ui: { analyticsId: 'waste', analyticsTab: 'entry' }, action: 'analytics-entry', actionData: () => ({ id: 'waste' }) }),
      M('Kembalikan untuk diperbaiki', 'supervisor', 'analytics', 'Buka catatan baru di Data & verifikasi dan pilih Kembalikan dengan alasan.', 'Status Dikembalikan; angka tidak masuk dashboard.', r => waste(r).some(x => (x.status === 'rejected' && x.reviewedBy === acct('supervisor', r.outlet)) || (x.revisions || []).some(v => v.status === 'rejected')), { ui: { analyticsId: 'waste', analyticsTab: 'entry' } }),
      M('Perbaiki sebagai versi baru', 'attendant', 'analytics', 'Buka catatan yang dikembalikan, perbaiki jumlahnya dan kirim ulang.', 'Catatan yang sama naik ke versi 2; versi lama tersimpan di riwayat.', r => waste(r).some(x => (x.version || 1) >= 2 && Array.isArray(x.revisions) && x.revisions.length > 0 && ['submitted', 'verified'].includes(x.status)), { ui: { analyticsId: 'waste', analyticsTab: 'entry' } }),
      M('Verifikasi versi perbaikan', 'supervisor', 'analytics', 'Verifikasi catatan versi 2.', 'Hanya versi terverifikasi yang dihitung dashboard.', r => waste(r).some(x => (x.version || 1) >= 2 && x.status === 'verified'), { ui: { analyticsId: 'waste', analyticsTab: 'entry' } }),
      R('Periode tanpa data', 'manager', 'analytics', 'Pada dashboard Waste ubah periode ke November 2026. Kartu tanpa data tampil "—" dan tabel "Belum ada data", bukan 0%.', 'Missing dibedakan dari nol; tidak ada persentase palsu.', { ui: { analyticsId: 'waste', analyticsTab: 'dashboard', analyticsFrom: '2026-11-01', analyticsTo: '2026-11-30' } }),
    ] },
  );
}
})();
