/* JAENS ERP · Direktori karyawan asli online (wajib login) — logika server.
   - Data karyawan, akun dan audit disimpan terenkripsi AES-256-GCM (kunci HR_DATA_KEY di env Vercel), di Vercel Blob privat.
   - Sesi: cookie HttpOnly + Secure + SameSite=Strict, ditandatangani HMAC (HR_SESSION_SECRET), 8 jam; sesi wajib-ganti-password 15 menit.
   - Akun awal dari HR_BOOTSTRAP_USERS (JSON, hash scrypt, wajib ganti password saat login pertama).
   - Tidak ada data karyawan asli di repo, build statis atau log. File ini hanya logika; penyimpanan disuntikkan (store). */
'use strict';
const crypto = require('crypto');

const ROLES = {
  owner: { label: 'Owner', reveal: true, admin: true, place: true },
  'manager-hrd': { label: 'Manager HRD', reveal: true, admin: true, place: true },
  'admin-hrd': { label: 'Admin HRD', reveal: false, admin: false, place: true },
  viewer: { label: 'Lihat saja', reveal: false, admin: false, place: false }
};
const LOCATIONS = ['Spa Ubud', 'Spa Shanti', 'Spa Triloka', 'Spa Bisma', 'Office', 'Lokasi proyek', 'Lokasi lain'];
const TABS = ['pribadi', 'kontak', 'kepegawaian', 'ess'];
const SESSION_H = 8, CHANGE_MIN = 15, MAX_FAIL = 5, LOCK_MIN = 15, MIN_PW = 10;
const DOCS = { data: 'hr-secure/data.enc', users: 'hr-secure/users.enc', audit: 'hr-secure/audit.enc' };

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const fail = (status, msg) => { throw new HttpError(status, msg); };

/* ---------- kripto ---------- */
function keyFrom(env) {
  const k = Buffer.from(String(env.HR_DATA_KEY || ''), 'base64');
  if (k.length !== 32) fail(503, 'Server belum dikonfigurasi (HR_DATA_KEY).');
  return k;
}
function seal(env, obj) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', keyFrom(env), iv);
  const body = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: body.toString('base64') });
}
function open(env, text) {
  const o = JSON.parse(text), d = crypto.createDecipheriv('aes-256-gcm', keyFrom(env), Buffer.from(o.iv, 'base64'));
  d.setAuthTag(Buffer.from(o.tag, 'base64'));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(o.data, 'base64')), d.final()]).toString('utf8'));
}
function hashPassword(pw, salt = crypto.randomBytes(16)) {
  const h = crypto.scryptSync(String(pw), salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${h.toString('base64')}`;
}
function checkPassword(pw, stored) {
  const [alg, s, h] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !s || !h) { hashPassword(pw); return false; }
  const got = crypto.scryptSync(String(pw), Buffer.from(s, 'base64'), 32, { N: 16384, r: 8, p: 1 });
  const want = Buffer.from(h, 'base64');
  return want.length === got.length && crypto.timingSafeEqual(got, want);
}
const b64u = (b) => Buffer.from(b).toString('base64url');
function signSession(env, payload) {
  const sec = String(env.HR_SESSION_SECRET || ''); if (sec.length < 32) fail(503, 'Server belum dikonfigurasi (HR_SESSION_SECRET).');
  const body = b64u(JSON.stringify(payload));
  return body + '.' + b64u(crypto.createHmac('sha256', sec).update(body).digest());
}
function readSession(env, token, now) {
  const sec = String(env.HR_SESSION_SECRET || ''); if (!token || sec.length < 32) return null;
  const [body, mac] = String(token).split('.'); if (!body || !mac) return null;
  const want = b64u(crypto.createHmac('sha256', sec).update(body).digest());
  if (want.length !== mac.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(mac))) return null;
  let p; try { p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch (e) { return null; }
  return p && p.exp > now ? p : null;
}
const mask = (v) => { const s = String(v || ''); if (!s) return ''; return s.length <= 4 ? '****' : '****' + s.slice(-4); };
const norm = (e) => String(e || '').trim().toLowerCase();

/* ---------- penyimpanan ---------- */
async function load(ctx, name, fallback) { const t = await ctx.store.read(DOCS[name]); return t ? open(ctx.env, t) : fallback; }
async function save(ctx, name, obj) { await ctx.store.write(DOCS[name], seal(ctx.env, obj)); }
async function users(ctx) {
  const doc = await load(ctx, 'users', null);
  if (doc) return doc;
  let boot = []; try { boot = JSON.parse(ctx.env.HR_BOOTSTRAP_USERS || '[]'); } catch (e) { fail(503, 'HR_BOOTSTRAP_USERS tidak valid.'); }
  return { users: boot.filter(u => u && u.email && u.hash && ROLES[u.role]).map(u => ({ email: norm(u.email), name: String(u.name || u.email), role: u.role, hash: u.hash, mustChange: u.mustChange !== false, failed: 0, lockedUntil: 0, created: ctx.now() })) };
}
async function audit(ctx, by, action, target, note = '') {
  const a = await load(ctx, 'audit', { items: [] });
  a.items.unshift({ at: new Date(ctx.now()).toISOString(), by, action, target, note });
  a.items = a.items.slice(0, 5000);
  await save(ctx, 'audit', a);
}
const emptyData = () => ({ employees: [], placements: {}, history: [], imports: [] });

/* ---------- validasi impor ---------- */
function validateExport(x) {
  if (!x || x.format !== 'jaens-hr-export' || x.version !== 1) fail(422, 'Format file bukan jaens-hr-export v1.');
  if (!Array.isArray(x.employees) || !x.employees.length) fail(422, 'File tidak berisi karyawan.');
  const bad = JSON.stringify(x).match(/"(password|passwordHash|hash|salt|pw_hash)"\s*:/i);
  if (bad) fail(422, 'File berisi field kredensial (' + bad[1] + '). Ekspor ulang tanpa hash/password.');
  const seen = new Set(), problems = [];
  x.employees.forEach((e, i) => {
    const id = e && typeof e.id === 'string' ? e.id.trim() : '';
    if (!id) problems.push(`baris ${i + 1}: ID kosong atau bukan teks`);
    else if (seen.has(id)) problems.push(`ID ganda: ${id}`);
    seen.add(id);
    if (!e.name) problems.push(`baris ${i + 1}: nama kosong`);
    for (const t of TABS) if (e.tabs && e.tabs[t] && !Array.isArray(e.tabs[t])) problems.push(`baris ${i + 1}: tab ${t} bukan daftar`);
  });
  if (problems.length) fail(422, 'Impor dibatalkan seluruhnya: ' + problems.slice(0, 10).join('; '));
}
const cleanEmp = (e) => ({
  id: e.id.trim(), name: String(e.name), job: String(e.job || ''), fn: String(e.fn || ''),
  tabs: Object.fromEntries(TABS.map(t => [t, (e.tabs && e.tabs[t] || []).map(f => ({ k: String(f.k || ''), v: f.v == null ? '' : String(f.v), s: !!f.s }))])),
  sources: Object.fromEntries(TABS.map(t => [t, e.sources && e.sources[t] ? { file: String(e.sources[t].file || ''), sha256: String(e.sources[t].sha256 || ''), importedAt: String(e.sources[t].importedAt || '') } : null]))
});

/* ---------- ringkasan ---------- */
function summary(data) {
  const es = data.employees, jobIs = (re) => es.filter(e => re.test(e.job)).length;
  const groups = {}; es.forEach(e => { const g = e.fn || 'Belum ada usulan'; groups[g] = (groups[g] || 0) + 1; });
  return { total: es.length, therapist: jobIs(/therap/i), reception: jobIs(/recept/i), pending: es.filter(e => !data.placements[e.id]).length, groups: Object.entries(groups).sort((a, b) => b[1] - a[1]), importedAt: data.imports[0]?.at || null };
}

/* ---------- handler ---------- */
async function handle(ctx, req) {
  const op = req.op, now = ctx.now();
  const sess = readSession(ctx.env, req.cookie, now);
  const needPost = ['login', 'logout', 'password', 'import', 'place', 'revert'];
  if (needPost.includes(op)) {
    if (req.method !== 'POST') fail(405, 'Gunakan POST.');
    if (req.header !== '1') fail(403, 'Permintaan ditolak (header).');
    if (req.origin && req.host && new URL(req.origin).host !== req.host) fail(403, 'Permintaan lintas situs ditolak.');
  }
  if (op === 'login') {
    const u = await users(ctx), email = norm(req.body.email), me = u.users.find(x => x.email === email);
    if (me && me.lockedUntil > now) { hashPassword('x'); fail(429, `Terlalu banyak percobaan. Coba lagi setelah ${Math.ceil((me.lockedUntil - now) / 60000)} menit.`); }
    if (!me || !checkPassword(req.body.password, me.hash)) {
      if (me) { me.failed = (me.failed || 0) + 1; if (me.failed >= MAX_FAIL) { me.lockedUntil = now + LOCK_MIN * 60000; me.failed = 0; } await save(ctx, 'users', u); }
      fail(401, 'Email atau password salah.');
    }
    me.failed = 0; me.lockedUntil = 0; me.lastLogin = new Date(now).toISOString(); await save(ctx, 'users', u);
    await audit(ctx, me.email, 'login', '-');
    const exp = now + (me.mustChange ? CHANGE_MIN * 60000 : SESSION_H * 3600000);
    return { setCookie: signSession(ctx.env, { e: me.email, mc: !!me.mustChange, iat: now, exp }), maxAge: Math.floor((exp - now) / 1000), body: { user: { email: me.email, name: me.name, role: me.role, roleLabel: ROLES[me.role].label, mustChange: !!me.mustChange } } };
  }
  if (op === 'logout') return { setCookie: '', maxAge: 0, body: { ok: true } };
  if (!sess) fail(401, 'Silakan login.');
  const u = await users(ctx), me = u.users.find(x => x.email === sess.e);
  if (!me) fail(401, 'Akun tidak aktif.');
  if (me.changedAt && sess.iat <= Date.parse(me.changedAt) && op !== 'logout') fail(401, 'Sesi berakhir, silakan login ulang.');
  const r = ROLES[me.role], user = { email: me.email, name: me.name, role: me.role, roleLabel: r.label, mustChange: !!me.mustChange, reveal: r.reveal, admin: r.admin, place: r.place };
  if (op === 'me') return { body: { user } };
  if (op === 'password') {
    const { current, next } = req.body;
    if (!checkPassword(current, me.hash)) fail(401, 'Password saat ini salah.');
    if (String(next || '').length < MIN_PW) fail(422, `Password baru minimal ${MIN_PW} karakter.`);
    if (String(next) === String(current) || String(next) === '123456') fail(422, 'Password baru harus berbeda dan tidak boleh password awal.');
    me.hash = hashPassword(next); me.mustChange = false; me.changedAt = new Date(now).toISOString(); await save(ctx, 'users', u);
    await audit(ctx, me.email, 'ganti password', '-');
    const exp = now + SESSION_H * 3600000;
    return { setCookie: signSession(ctx.env, { e: me.email, mc: false, iat: now + 1, exp }), maxAge: SESSION_H * 3600, body: { user: { ...user, mustChange: false } } };
  }
  if (me.mustChange) fail(403, 'Ganti password awal terlebih dahulu.');
  const data = await load(ctx, 'data', emptyData());
  if (op === 'summary') return { body: summary(data) };
  if (op === 'list') return { body: { summary: summary(data), locations: LOCATIONS, employees: data.employees.map(e => ({ id: e.id, name: e.name, job: e.job, fn: e.fn, placement: data.placements[e.id] || null })) } };
  if (op === 'emp') {
    const e = data.employees.find(x => x.id === req.query.id); if (!e) fail(404, 'Karyawan tidak ditemukan.');
    const reveal = req.query.reveal === '1';
    if (reveal && !r.reveal) fail(403, 'Data sensitif hanya untuk Manager HRD dan Owner.');
    if (reveal) await audit(ctx, me.email, 'buka data sensitif', e.id);
    const tabs = Object.fromEntries(TABS.map(t => [t, e.tabs[t].map(f => ({ k: f.k, v: f.s && !reveal ? mask(f.v) : f.v, s: f.s, masked: f.s && !reveal && !!f.v }))]));
    return { body: { employee: { id: e.id, name: e.name, job: e.job, fn: e.fn, tabs, sources: e.sources, placement: data.placements[e.id] || null }, revealed: reveal, history: data.history.filter(b => b.changes.some(c => c.id === e.id)).slice(0, 20) } };
  }
  if (op === 'history') return { body: { history: data.history.slice(0, 100) } };
  if (op === 'audit') { if (!r.admin) fail(403, 'Khusus Manager HRD dan Owner.'); return { body: await load(ctx, 'audit', { items: [] }) }; }
  if (op === 'import') {
    if (!r.admin) fail(403, 'Impor khusus Manager HRD dan Owner.');
    validateExport(req.body);
    const before = new Map(data.employees.map(e => [e.id, JSON.stringify(e)]));
    const incoming = req.body.employees.map(cleanEmp), ids = new Set(incoming.map(e => e.id));
    let added = 0, updated = 0, unchanged = 0;
    incoming.forEach(e => { const b = before.get(e.id); if (!b) added++; else if (b === JSON.stringify(e)) unchanged++; else updated++; });
    const kept = data.employees.filter(e => !ids.has(e.id));
    for (const e of incoming) { const p = req.body.employees.find(x => x.id.trim() === e.id).placement; if (p && !data.placements[e.id] && LOCATIONS.includes(p.location)) data.placements[e.id] = { location: p.location, division: String(p.division || ''), basis: String(p.basis || 'Dari portal lokal'), by: String(p.by || 'impor'), at: String(p.at || '') }; }
    data.employees = [...kept, ...incoming].sort((a, b) => a.id.localeCompare(b.id));
    data.imports.unshift({ at: new Date(now).toISOString(), by: me.email, count: incoming.length, added, updated, unchanged });
    await save(ctx, 'data', data); await audit(ctx, me.email, 'impor', `${incoming.length} karyawan`, `baru ${added}, berubah ${updated}, sama ${unchanged}`);
    return { body: { added, updated, unchanged, total: data.employees.length, summary: summary(data) } };
  }
  if (op === 'place') {
    if (!r.place) fail(403, 'Tidak punya izin penempatan.');
    const { ids, location, division, basis, detail } = req.body;
    const list = Array.isArray(ids) ? [...new Set(ids.map(String))] : [];
    if (!list.length) fail(422, 'Pilih minimal satu karyawan.');
    if (!LOCATIONS.includes(location)) fail(422, 'Lokasi tidak dikenal.');
    if (/^Lokasi (proyek|lain)$/.test(location) && !String(detail || '').trim()) fail(422, 'Isi rincian untuk lokasi proyek/lain.');
    if (!String(division || '').trim()) fail(422, 'Divisi wajib diisi.');
    if (!String(basis || '').trim()) fail(422, 'Dasar penetapan wajib diisi.');
    const missing = list.filter(id => !data.employees.some(e => e.id === id));
    if (missing.length) fail(422, `Batch dibatalkan seluruhnya: ID tidak dikenal (${missing.slice(0, 5).join(', ')}).`);
    const at = new Date(now).toISOString(), batch = 'PLC-' + now.toString(36).toUpperCase();
    const val = { location, detail: String(detail || '').trim(), division: String(division).trim(), basis: String(basis).trim(), by: me.email, at, batch };
    const changes = list.map(id => ({ id, before: data.placements[id] || null, after: val }));
    list.forEach(id => { data.placements[id] = val; });
    data.history.unshift({ batch, at, by: me.email, basis: val.basis, count: list.length, changes, reverted: null });
    await save(ctx, 'data', data); await audit(ctx, me.email, 'penempatan', batch, `${list.length} karyawan → ${location}`);
    return { body: { batch, count: list.length, summary: summary(data) } };
  }
  if (op === 'revert') {
    if (!r.place) fail(403, 'Tidak punya izin penempatan.');
    const b = data.history.find(x => x.batch === req.body.batch); if (!b) fail(404, 'Batch tidak ditemukan.');
    if (b.reverted) fail(409, 'Batch sudah dibatalkan.');
    const conflict = b.changes.filter(c => (data.placements[c.id] || {}).batch !== b.batch);
    if (conflict.length) fail(409, `Tidak bisa dibatalkan: ${conflict.length} karyawan sudah diubah oleh batch lain.`);
    b.changes.forEach(c => { if (c.before) data.placements[c.id] = c.before; else delete data.placements[c.id]; });
    b.reverted = { at: new Date(now).toISOString(), by: me.email };
    await save(ctx, 'data', data); await audit(ctx, me.email, 'batalkan penempatan', b.batch);
    return { body: { ok: true, summary: summary(data) } };
  }
  fail(404, 'Operasi tidak dikenal.');
}

module.exports = { handle, HttpError, hashPassword, checkPassword, seal, open, mask, ROLES, LOCATIONS, DOCS };
