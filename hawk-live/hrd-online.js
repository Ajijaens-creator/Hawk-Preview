/* JAENS ERP · Portal HRD · Direktori karyawan ASLI online (wajib login) — tampilan.
   Data tidak ada di file ini maupun di build statis: diambil saat runtime dari /api/hr setelah login (cookie HttpOnly).
   Tanpa login / tanpa server (file://, http.server lokal) layar tetap menampilkan ringkasan angka saja. */
(() => {
const H = window.HL;
const { esc, num, table, card, qs } = H;
const API = '/api/hr';
const O = { status: 'unknown', user: null, list: null, emp: {}, tab: 'pribadi', q: '', fn: '', st: '', page: 1, sel: new Set(), history: null, msg: '', err: '', busy: false, revealed: {} };
const PER = 25;
const chip = (t, tone = '') => `<span class="status-chip ${tone}">${esc(t)}</span>`;
const EMPTY = '<span class="muted">Belum tersedia pada sumber</span>';

async function api(op, { method = 'GET', body, query = {} } = {}) {
  const r = await fetch(`${API}?${new URLSearchParams({ op, ...query })}`, { method, credentials: 'same-origin', headers: method === 'POST' ? { 'Content-Type': 'application/json', 'X-JAENS-HR': '1' } : {}, body: body ? JSON.stringify(body) : undefined });
  const type = r.headers.get('content-type') || '';
  if (!type.includes('application/json')) { const e = new Error('offline'); e.offline = true; throw e; }
  const j = await r.json(); if (!r.ok) { const e = new Error(j.error || 'Gagal'); e.status = r.status; throw e; } return j;
}
const rerender = () => { if (/^#hrd-roster/.test(location.hash) || location.hash === '') H.render(); };
async function boot() {
  if (O.status !== 'unknown') return; O.status = 'loading';
  // Tanpa server API (file://, server statis lokal untuk uji/pratinjau): ringkasan angka saja, tanpa permintaan jaringan.
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname); let force = false; try { force = localStorage.getItem('jaens-hr-api') === '1'; } catch (e) {}
  if (location.protocol === 'file:' || (local && !force)) { O.status = 'offline'; return; }
  try { const j = await api('me'); O.user = j.user; O.status = 'in'; if (!O.user.mustChange) await loadList(); }
  catch (e) { O.status = e.offline ? 'offline' : 'out'; }
  rerender();
}
async function loadList() { const [l, h] = await Promise.all([api('list'), api('history')]); O.list = l; O.history = h.history; }
async function run(fn) { if (O.busy) return; O.busy = true; O.err = ''; O.msg = ''; try { await fn(); } catch (e) { O.err = e.message; if (e.status === 401) { O.status = 'out'; O.user = null; O.list = null; } } O.busy = false; rerender(); }

/* ---------- potongan tampilan ---------- */
const userBar = () => `<div class="hro-user"><span>Masuk sebagai <b>${esc(O.user.name)}</b> · ${esc(O.user.roleLabel)}</span><span class="row"><button type="button" class="btn ghost sm" data-hro-act="pw">Ganti password</button> <button type="button" class="btn ghost sm" data-hro-act="logout">Keluar</button></span></div>`;
const alerts = () => (O.err ? `<p class="hro-alert bad" role="alert">${esc(O.err)}</p>` : '') + (O.msg ? `<p class="hro-alert ok" role="status">${esc(O.msg)}</p>` : '');
const loginForm = () => card('Login HRD · daftar karyawan asli', `<p class="muted small">Daftar 214 karyawan asli hanya tampil setelah login. Akun dibuat oleh Owner; password awal wajib diganti saat masuk pertama.</p>${alerts()}
  <form class="workflow-form hro-form" data-hro="login" autocomplete="on"><label>Email<input name="email" type="email" required autocomplete="username"></label><label>Password<input name="password" type="password" required autocomplete="current-password"></label><button class="btn primary" type="submit">Masuk</button></form>`);
const pwForm = (forced) => card(forced ? 'Ganti password awal' : 'Ganti password', `${forced ? '<p class="small">Demi keamanan, password awal harus diganti sebelum data karyawan dapat dibuka.</p>' : ''}${alerts()}
  <form class="workflow-form hro-form" data-hro="password"><label>Password saat ini<input name="current" type="password" required autocomplete="current-password"></label><label>Password baru (min. 10 karakter)<input name="next" type="password" minlength="10" required autocomplete="new-password"></label><label>Ulangi password baru<input name="again" type="password" minlength="10" required autocomplete="new-password"></label><button class="btn primary" type="submit">Simpan password</button>${forced ? '' : ' <button type="button" class="btn ghost" data-hro-act="pw-cancel">Batal</button>'}</form>`);

function cards(s) {
  const c = [['Karyawan asli', s.total, `${s.total} ID unik${s.importedAt ? ' · impor ' + esc(s.importedAt.slice(0, 10)) : ''}`, 'g-teal'], ['Therapist', s.therapist, 'jabatan pada sumber', 'g-violet'], ['Receptionist', s.reception, 'jabatan pada sumber', 'g-blue'], ['Menunggu penetapan', s.pending, 'lokasi/divisi belum dikonfirmasi', 'g-gold']];
  return `<section class="grid g4 keep2 kpis">${c.map(([l, v, sub, k]) => `<div class="kpi ${k}"><div class="lbl">${l}</div><div class="val">${num(v)}</div><div class="sub">${sub}</div></div>`).join('')}</section>`;
}
const placeText = (p) => p ? `${esc(p.location)}${p.detail ? ' · ' + esc(p.detail) : ''}` : '<span class="muted">Belum ditetapkan</span>';
const locOpts = () => (O.list.locations || []).map(l => `<option>${esc(l)}</option>`).join('');
const placeForm = (ids, label) => `<form class="workflow-form hro-place" data-hro="place">${ids ? `<input type="hidden" name="ids" value="${esc(ids)}">` : ''}
  <label>Lokasi<select name="location" required><option value="">Pilih lokasi</option>${locOpts()}</select></label><label>Rincian (wajib untuk proyek/lain)<input name="detail"></label>
  <label>Divisi<input name="division" required placeholder="mis. Operational"></label><label>Dasar penetapan<input name="basis" required placeholder="mis. SK Direksi 12/2026"></label>
  <button class="btn primary" type="submit">${label}</button></form>`;

function filtered() {
  const q = O.q.toLowerCase();
  return O.list.employees.filter(e => (!q || e.id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.job.toLowerCase().includes(q)) && (!O.fn || e.fn === O.fn) && (!O.st || (O.st === 'ok' ? !!e.placement : !e.placement)));
}
function directory(open, fallback) {
  boot();
  if (O.status === 'offline' || O.status === 'unknown' || O.status === 'loading') return fallback() + (O.status === 'offline' ? '<p class="muted small hro-note">Login HRD untuk daftar karyawan asli tersedia di website JAENS online.</p>' : '');
  if (O.status === 'out') return fallback() + loginForm();
  if (O.user.mustChange || O.pw) return `<section class="hr-real">${userBar()}${pwForm(O.user.mustChange)}</section>`;
  if (!O.list) return `<section class="hr-real">${userBar()}<p class="muted">Memuat data karyawan…</p></section>`;
  const s = O.list.summary, rows = filtered(), pages = Math.max(1, Math.ceil(rows.length / PER)); O.page = Math.min(O.page, pages);
  const shown = rows.slice((O.page - 1) * PER, O.page * PER), fns = [...new Set(O.list.employees.map(e => e.fn).filter(Boolean))].sort();
  const allSel = shown.length && shown.every(e => O.sel.has(e.id));
  return `<section class="hr-real" data-real-online>${userBar()}<p class="demo-banner"><b>DATA KARYAWAN ASLI · WAJIB LOGIN.</b> Data dibaca dari server terenkripsi setelah login. Data sensitif tersamar; ${O.user.reveal ? 'Anda dapat membukanya per karyawan (tercatat di log).' : 'hanya Manager HRD dan Owner yang dapat membukanya.'}</p>${alerts()}
    ${cards(s)}
    ${card('Daftar karyawan asli', `<form class="hro-filters" data-hro="filter"><label>Cari nama / ID / jabatan<input name="q" value="${esc(O.q)}"></label><label>Usulan fungsi<select name="fn"><option value="">Semua fungsi</option>${fns.map(f => `<option ${f === O.fn ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label><label>Penetapan<select name="st"><option value="">Semua</option><option value="pending" ${O.st === 'pending' ? 'selected' : ''}>Menunggu penetapan</option><option value="ok" ${O.st === 'ok' ? 'selected' : ''}>Sudah ditetapkan</option></select></label><button class="btn" type="submit">Terapkan</button></form>
      <p class="small"><b>${num(rows.length)} orang</b> dari ${num(s.total)} · dipilih ${num(O.sel.size)}${O.sel.size ? ' · <button type="button" class="btn link sm" data-hro-act="sel-none">kosongkan pilihan</button>' : ''}</p>
      <div class="table-wrap">${table([`<input type="checkbox" aria-label="Pilih semua di halaman ini" data-hro-all ${allSel ? 'checked' : ''}>`, 'Employee ID', 'Nama', 'Jabatan (sumber)', 'Usulan fungsi', 'Lokasi', 'Divisi', 'Status penetapan'],
        shown.map(e => [`<input type="checkbox" aria-label="Pilih ${esc(e.name)}" data-hro-sel="${esc(e.id)}" ${O.sel.has(e.id) ? 'checked' : ''}>`, esc(e.id), `<a href="#hrd-roster${qs({ real: e.id })}">${esc(e.name)}</a>`, esc(e.job) || EMPTY, esc(e.fn) || '—', placeText(e.placement), e.placement ? esc(e.placement.division) : '<span class="muted">Belum ditetapkan</span>', e.placement ? chip('Ditetapkan', 'ready') : chip('Menunggu penetapan', 'sandbox')]))}</div>
      <p class="row hro-pager">${O.page > 1 ? '<button type="button" class="btn ghost sm" data-hro-act="prev">‹ Sebelumnya</button>' : ''} <span class="small">Halaman ${O.page} dari ${pages}</span> ${O.page < pages ? '<button type="button" class="btn ghost sm" data-hro-act="next">Berikutnya ›</button>' : ''}</p>`)}
    ${O.user.place ? card(`Penempatan massal · ${num(O.sel.size)} dipilih`, O.sel.size ? placeForm(null, `Tetapkan untuk ${num(O.sel.size)} karyawan`) + '<p class="muted small">Satu ID tidak valid membatalkan seluruh batch. Setiap batch tercatat dan dapat dibatalkan.</p>' : '<p class="muted small">Centang karyawan di tabel untuk menetapkan lokasi dan divisi sekaligus.</p>') : ''}
    ${card('Riwayat penempatan', (O.history || []).length ? table(['Batch', 'Waktu', 'Oleh', 'Jumlah', 'Lokasi', 'Dasar', 'Status'], O.history.slice(0, 15).map(b => [esc(b.batch), esc(b.at.slice(0, 16).replace('T', ' ')), esc(b.by), num(b.count), esc(b.changes[0]?.after?.location || ''), esc(b.basis), b.reverted ? chip('Dibatalkan', '') : (O.user.place ? `<button type="button" class="btn ghost sm" data-hro-act="revert" data-batch="${esc(b.batch)}">Batalkan batch</button>` : chip('Aktif', 'ready'))])) : '<p class="muted small">Belum ada penempatan.</p>')}
    ${O.user.admin ? card('Impor dari portal lokal', `<p class="small">Unggah file <b>jaens-hr-export-….json</b> dari tombol "Ekspor untuk JAENS online" di portal lokal Mac. Impor bersifat idempotent: ID yang sama diperbarui, penempatan yang sudah ditetapkan tidak terhapus. Hapus file dari Downloads setelah diunggah.</p><form class="workflow-form" data-hro="import"><label>File ekspor<input type="file" name="file" accept="application/json,.json" required></label><button class="btn" type="submit">Unggah & impor</button></form>`) : ''}
    ${open ? '' : '<p class="actions"><a class="btn ghost" href="#hrd-roster?arsip=1" data-arsip-show>Tampilkan arsip demo</a></p>'}${open ? '<p class="actions"><a class="btn ghost" href="#hrd-roster?arsip=0" data-arsip-hide>Sembunyikan arsip · kembali ke data asli</a></p>' : ''}</section>`;
}
function detail(params) {
  boot();
  const back = '<p><a href="#hrd-roster">‹ Kembali ke Direktori</a></p>';
  if (O.status !== 'in' || O.user.mustChange) return back + directory(false, () => '');
  const id = params.real, d = O.emp[id];
  if (!d) { if (!O.emp['loading:' + id]) { O.emp['loading:' + id] = true; run(async () => { O.emp[id] = await api('emp', { query: { id } }); delete O.emp['loading:' + id]; }); } return back + '<p class="muted">Memuat…</p>'; }
  const e = d.employee, tabs = [['pribadi', 'Informasi Pribadi'], ['kontak', 'Kontak'], ['kepegawaian', 'Kepegawaian'], ['ess', 'Login ESS']];
  const t = tabs.some(x => x[0] === O.tab) ? O.tab : 'pribadi', src = e.sources && e.sources[t];
  const rows = (e.tabs[t] || []).map(f => [esc(f.k), f.v ? `${esc(f.v)}${f.masked ? ' ' + chip('tersamar', '') : ''}` : EMPTY]);
  return back + `<section class="hr-real" data-real-detail>${userBar()}${alerts()}
    ${card(`${esc(e.name)} · ${esc(e.id)}`, `<p>${esc(e.job) || EMPTY} · usulan fungsi ${esc(e.fn) || '—'} · ${e.placement ? chip('Ditetapkan: ' + e.placement.location, 'ready') : chip('Menunggu penetapan', 'sandbox')}</p>
      <nav class="tabs" aria-label="Bagian">${tabs.map(([k, l]) => `<button type="button" class="tab${k === t ? ' on' : ''}" data-hro-act="tab" data-tab="${k}">${l}</button>`).join('')}</nav>
      ${rows.length ? table(['Field', 'Nilai'], rows) : `<p>${EMPTY}</p>`}
      <p class="muted small">Sumber: ${src ? `${esc(src.file) || '—'} · SHA-256 ${esc((src.sha256 || '').slice(0, 12))}… · impor ${esc((src.importedAt || '').slice(0, 16).replace('T', ' '))}` : 'Belum tersedia pada sumber'}</p>
      ${O.user.reveal && !d.revealed ? `<button type="button" class="btn ghost sm" data-hro-act="reveal" data-id="${esc(e.id)}">Tampilkan data sensitif (tercatat di log)</button>` : ''}${d.revealed ? '<p class="small">Data sensitif ditampilkan · tercatat di log audit.</p>' : ''}`)}
    ${O.user.place ? card('Penempatan', `<p>Saat ini: ${placeText(e.placement)}${e.placement ? ` · divisi ${esc(e.placement.division)} · dasar ${esc(e.placement.basis)}` : ''}</p>${placeForm(e.id, 'Simpan penempatan')}`) : ''}
    ${d.history && d.history.length ? card('Riwayat penempatan', table(['Batch', 'Waktu', 'Oleh', 'Lokasi', 'Status'], d.history.map(b => [esc(b.batch), esc(b.at.slice(0, 16).replace('T', ' ')), esc(b.by), esc(b.changes.find(c => c.id === e.id)?.after?.location || ''), b.reverted ? 'Dibatalkan' : 'Aktif']))) : ''}</section>`;
}
H.HOOKS.realRoster = directory;
H.HOOKS.realDetail = detail;

/* ---------- interaksi ---------- */
document.addEventListener('submit', (ev) => {
  const f = ev.target.closest('form[data-hro]'); if (!f) return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  const kind = f.dataset.hro, v = Object.fromEntries(new FormData(f));
  if (kind === 'filter') { O.q = v.q || ''; O.fn = v.fn || ''; O.st = v.st || ''; O.page = 1; rerender(); return; }
  if (kind === 'login') return run(async () => { const j = await api('login', { method: 'POST', body: { email: v.email, password: v.password } }); O.user = j.user; O.status = 'in'; if (!O.user.mustChange) await loadList(); });
  if (kind === 'password') return run(async () => { if (v.next !== v.again) throw new Error('Ulangi password baru tidak sama.'); const j = await api('password', { method: 'POST', body: { current: v.current, next: v.next } }); O.user = j.user; O.pw = false; O.msg = 'Password berhasil diganti.'; await loadList(); });
  if (kind === 'place') return run(async () => { const ids = v.ids ? [v.ids] : [...O.sel]; const j = await api('place', { method: 'POST', body: { ids, location: v.location, detail: v.detail, division: v.division, basis: v.basis } }); O.msg = `Batch ${j.batch}: ${j.count} karyawan ditetapkan.`; if (!v.ids) O.sel.clear(); O.emp = {}; await loadList(); });
  if (kind === 'import') return run(async () => { const file = f.querySelector('input[type=file]').files[0]; if (!file) throw new Error('Pilih file ekspor.'); let data; try { data = JSON.parse(await file.text()); } catch (e) { throw new Error('File bukan JSON yang valid.'); } const j = await api('import', { method: 'POST', body: data }); O.msg = `Impor selesai: ${j.added} baru, ${j.updated} diperbarui, ${j.unchanged} sama · total ${j.total}.`; O.emp = {}; await loadList(); });
}, true);
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-hro-act]'); if (!b) return;
  const a = b.dataset.hroAct;
  if (a === 'logout') return run(async () => { await api('logout', { method: 'POST' }); O.status = 'out'; O.user = null; O.list = null; O.emp = {}; O.sel.clear(); });
  if (a === 'pw') { O.pw = true; rerender(); return; }
  if (a === 'pw-cancel') { O.pw = false; rerender(); return; }
  if (a === 'prev') { O.page--; rerender(); return; }
  if (a === 'next') { O.page++; rerender(); return; }
  if (a === 'sel-none') { O.sel.clear(); rerender(); return; }
  if (a === 'tab') { O.tab = b.dataset.tab; rerender(); return; }
  if (a === 'reveal') return run(async () => { O.emp[b.dataset.id] = await api('emp', { query: { id: b.dataset.id, reveal: '1' } }); });
  if (a === 'revert') return run(async () => { await api('revert', { method: 'POST', body: { batch: b.dataset.batch } }); O.msg = `Batch ${b.dataset.batch} dibatalkan.`; O.emp = {}; await loadList(); });
});
document.addEventListener('change', (ev) => {
  const c = ev.target;
  if (c.matches('[data-hro-sel]')) { c.checked ? O.sel.add(c.dataset.hroSel) : O.sel.delete(c.dataset.hroSel); rerender(); }
  else if (c.matches('[data-hro-all]')) { const rows = filtered().slice((O.page - 1) * PER, O.page * PER); rows.forEach(e => c.checked ? O.sel.add(e.id) : O.sel.delete(e.id)); rerender(); }
});
})();
