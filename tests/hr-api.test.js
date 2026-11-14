/* Uji kontrak API direktori karyawan online (api/_lib/hr-core.js) — hanya karyawan FIKTIF, penyimpanan memori.
   node tests/hr-api.test.js */
'use strict';
const crypto = require('crypto');
const { handle, hashPassword, DOCS } = require('../api/_lib/hr-core');
let pass = 0, fail = 0;
const ok = (n, c, i = '') => { c ? pass++ : fail++; console.log(`${c ? '✓' : '✗'} ${n}${i ? ' · ' + i : ''}`); };
const mem = {}; const store = { async read(p) { return mem[p] || null; }, async write(p, t) { mem[p] = t; } };
let clock = Date.parse('2026-11-14T15:00:00Z');
const env = { HR_DATA_KEY: crypto.randomBytes(32).toString('base64'), HR_SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
  HR_BOOTSTRAP_USERS: JSON.stringify([{ email: 'owner@fiktif.test', name: 'Owner Fiktif', role: 'owner', hash: hashPassword('Awal-Fiktif-1') }, { email: 'admin@fiktif.test', name: 'Admin Fiktif', role: 'admin-hrd', hash: hashPassword('Awal-Fiktif-2') }]) };
const ctx = { env, store, now: () => clock };
const call = async (op, { method = 'GET', body = {}, query = {}, cookie = '', header = '1' } = {}) => {
  try { return { status: 200, ...(await handle(ctx, { op, method, body, query: { op, ...query }, cookie, header, origin: 'https://site.test', host: 'site.test' })) }; }
  catch (e) { return { status: e.status || 500, error: e.message }; }
};
const emp = (id, name, job, fn) => ({ id, name, job, fn, tabs: { pribadi: [{ k: 'Nama lengkap', v: name, s: false }, { k: 'NIK', v: '5104' + id.padStart(12, '0'), s: true }, { k: 'Golongan darah', v: '', s: false }], kontak: [{ k: 'Email', v: `${id}@fiktif.test`, s: false }, { k: 'Alamat domisili', v: 'Jl. Fiktif No. ' + id, s: true }], kepegawaian: [{ k: 'Jabatan', v: job, s: false }], ess: [{ k: 'Username', v: `${id}@fiktif.test`, s: false }] }, sources: { pribadi: { file: `${id}.pdf`, sha256: 'ab'.repeat(32), importedAt: '2026-11-14T10:00:00Z' } }, placement: null });
const exportFile = { format: 'jaens-hr-export', version: 1, exportedAt: '2026-11-14T15:00:00Z', source: { pdfCount: 12, employees: 3 }, employees: [emp('001', 'Satu Fiktif', 'Therapist', 'Spa Operations'), emp('002', 'Dua Fiktif', 'Receptionist', 'Spa Operations'), emp('010', 'Tiga Fiktif', 'Finance Staff', 'Finance & Accounting')] };

(async () => {
  ok('Tanpa login: list ditolak 401', (await call('list')).status === 401);
  ok('Tanpa login: emp ditolak 401', (await call('emp', { query: { id: '001' } })).status === 401);
  const bad = await call('login', { method: 'POST', body: { email: 'owner@fiktif.test', password: 'salah' } });
  ok('Password salah ditolak tanpa membocorkan apakah email ada', bad.status === 401 && /Email atau password salah/.test(bad.error));
  ok('Login wajib POST + header', (await call('login', { body: { email: 'owner@fiktif.test', password: 'Awal-Fiktif-1' } })).status === 405 && (await call('login', { method: 'POST', header: '', body: {} })).status === 403);
  let r = await call('login', { method: 'POST', body: { email: 'OWNER@fiktif.test', password: 'Awal-Fiktif-1' } });
  ok('Login pertama berhasil dan wajib ganti password', r.status === 200 && r.body.user.mustChange === true && r.maxAge === 15 * 60);
  let ck = r.setCookie;
  ok('Sebelum ganti password: data ditolak di server (403)', (await call('list', { cookie: ck })).status === 403);
  ok('Password baru 123456 / terlalu pendek ditolak', (await call('password', { method: 'POST', cookie: ck, body: { current: 'Awal-Fiktif-1', next: '123456' } })).status === 422);
  r = await call('password', { method: 'POST', cookie: ck, body: { current: 'Awal-Fiktif-1', next: 'Baru-Fiktif-Kuat-1' } });
  ok('Ganti password berhasil, sesi baru 8 jam', r.status === 200 && r.body.user.mustChange === false && r.maxAge === 8 * 3600);
  const oldCk = ck; ck = r.setCookie;
  clock += 5;
  ok('Sesi lama (sebelum ganti password) tidak berlaku lagi', (await call('me', { cookie: oldCk })).status === 401);
  r = await call('import', { method: 'POST', cookie: ck, body: { ...exportFile, employees: [...exportFile.employees, { ...emp('001', 'X', 'Y', 'Z') }] } });
  ok('Impor dengan ID ganda dibatalkan seluruhnya', r.status === 422 && /ID ganda/.test(r.error));
  r = await call('import', { method: 'POST', cookie: ck, body: { ...exportFile, employees: [{ ...emp('020', 'H', 'J', 'F'), tabs: { ess: [{ k: 'x', v: 'y', s: false }] }, hash: 'abc' }] } });
  ok('Impor yang membawa hash/password ditolak', r.status === 422 && /kredensial/.test(r.error));
  r = await call('import', { method: 'POST', cookie: ck, body: exportFile });
  ok('Impor 3 karyawan fiktif', r.status === 200 && r.body.added === 3 && r.body.total === 3);
  ok('Ringkasan: Therapist 1, Receptionist 1, menunggu penetapan 3', r.body.summary.therapist === 1 && r.body.summary.reception === 1 && r.body.summary.pending === 3);
  ok('ID berawalan nol tetap utuh', JSON.stringify((await call('list', { cookie: ck })).body.employees.map(e => e.id)) === '["001","002","010"]');
  ok('Data tersimpan terenkripsi (tidak ada nama/NIK dalam teks tersimpan)', !/Satu Fiktif|5104/.test(mem[DOCS.data]) && /"iv"/.test(mem[DOCS.data]));
  r = await call('import', { method: 'POST', cookie: ck, body: exportFile });
  ok('Impor ulang idempotent: 0 baru, 3 sama', r.body.added === 0 && r.body.unchanged === 3 && r.body.total === 3);
  r = await call('place', { method: 'POST', cookie: ck, body: { ids: ['001', '999'], location: 'Spa Ubud', division: 'Operational', basis: 'SK uji' } });
  ok('Penempatan massal dengan 1 ID salah dibatalkan seluruhnya', r.status === 422 && (await call('list', { cookie: ck })).body.employees.every(e => !e.placement));
  ok('Penempatan tanpa dasar ditolak', (await call('place', { method: 'POST', cookie: ck, body: { ids: ['001'], location: 'Spa Ubud', division: 'Operational', basis: ' ' } })).status === 422);
  ok('Lokasi lama/salah eja ditolak (Spa Santi)', (await call('place', { method: 'POST', cookie: ck, body: { ids: ['001'], location: 'Spa Santi', division: 'Operational', basis: 'x' } })).status === 422);
  r = await call('place', { method: 'POST', cookie: ck, body: { ids: ['001', '002'], location: 'Spa Shanti', division: 'Operational', basis: 'SK uji 01' } });
  ok('Penempatan massal 2 karyawan + histori', r.status === 200 && r.body.count === 2 && r.body.summary.pending === 1);
  const batch = r.body.batch;
  r = await call('import', { method: 'POST', cookie: ck, body: exportFile });
  ok('Impor ulang tidak menghapus penempatan', r.body.summary.pending === 1);
  r = await call('revert', { method: 'POST', cookie: ck, body: { batch } });
  ok('Batch bisa dibatalkan, penempatan kembali kosong', r.status === 200 && r.body.summary.pending === 3);
  r = await call('emp', { cookie: ck, query: { id: '001' } });
  const nik = r.body.employee.tabs.pribadi.find(f => f.k === 'NIK');
  ok('Detail: data sensitif tersamar secara default', nik.v.startsWith('****') && nik.masked);
  ok('Detail: nilai kosong tetap kosong (UI menulis "Belum tersedia pada sumber")', r.body.employee.tabs.pribadi.find(f => f.k === 'Golongan darah').v === '');
  r = await call('emp', { cookie: ck, query: { id: '001', reveal: '1' } });
  ok('Owner dapat membuka data sensitif, tercatat di audit', r.body.employee.tabs.pribadi.find(f => f.k === 'NIK').v === '5104000000000001' && (await call('audit', { cookie: ck })).body.items.some(a => a.action === 'buka data sensitif' && a.target === '001'));
  // Admin HRD: tidak bisa membuka data sensitif / impor / audit
  r = await call('login', { method: 'POST', body: { email: 'admin@fiktif.test', password: 'Awal-Fiktif-2' } });
  let ad = r.setCookie; r = await call('password', { method: 'POST', cookie: ad, body: { current: 'Awal-Fiktif-2', next: 'Admin-Baru-Kuat-2' } }); ad = r.setCookie;
  ok('Admin HRD: data sensitif tetap tersamar (403 saat reveal)', (await call('emp', { cookie: ad, query: { id: '001', reveal: '1' } })).status === 403);
  ok('Admin HRD: impor dan audit ditolak', (await call('import', { method: 'POST', cookie: ad, body: exportFile })).status === 403 && (await call('audit', { cookie: ad })).status === 403);
  // brute force
  for (let i = 0; i < 5; i++) await call('login', { method: 'POST', body: { email: 'admin@fiktif.test', password: 'salah' + i } });
  ok('5x salah: akun terkunci sementara (429), bahkan dengan password benar', (await call('login', { method: 'POST', body: { email: 'admin@fiktif.test', password: 'Admin-Baru-Kuat-2' } })).status === 429);
  clock += 16 * 60000;
  ok('Setelah 15 menit kunci terbuka', (await call('login', { method: 'POST', body: { email: 'admin@fiktif.test', password: 'Admin-Baru-Kuat-2' } })).status === 200);
  clock += 9 * 3600000;
  ok('Sesi kedaluwarsa setelah 8 jam', (await call('list', { cookie: ck })).status === 401);
  ok('Cookie palsu ditolak', (await call('list', { cookie: 'eyJlIjoib3duZXJAZmlrdGlmLnRlc3QifQ.xxx' })).status === 401);
  ok('Tidak ada hash password di respons API', !JSON.stringify(await call('me', { cookie: ad })).includes('scrypt$'));
  console.log(`\n${pass} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
})();
