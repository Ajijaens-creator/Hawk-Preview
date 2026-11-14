/* JAENS ERP · API direktori karyawan asli (wajib login). Vercel Function (Node).
   /api/hr?op=login|logout|me|password|summary|list|emp|history|audit|import|place|revert
   Penyimpanan: Vercel Blob PRIVAT (BLOB_READ_WRITE_TOKEN), isi terenkripsi AES-256-GCM (api/_lib/hr-core.js). */
'use strict';
const { put, get } = require('@vercel/blob');
const { handle, HttpError } = require('./_lib/hr-core');

const COOKIE = '__Host-jaens_hr';
const blobStore = {
  async read(path) {
    try {
      const r = await get(path, { access: 'private', useCache: false });
      if (!r || !r.stream) return null;
      return await new Response(r.stream).text();
    } catch (e) { if (/not.?found|404/i.test(String(e && (e.name + e.message)))) return null; throw e; }
  },
  async write(path, text) { await put(path, text, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/octet-stream', cacheControlMaxAge: 60 }); }
};
const cookieOf = (h) => (String(h || '').split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '=')) || '').slice(COOKIE.length + 1);

module.exports = async function hr(req, res) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const url = new URL(req.url, 'https://x');
  try {
    const out = await handle({ env: process.env, store: blobStore, now: () => Date.now() }, {
      op: url.searchParams.get('op') || '', method: req.method, query: Object.fromEntries(url.searchParams),
      body: req.body && typeof req.body === 'object' ? req.body : (() => { try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; } })(),
      cookie: cookieOf(req.headers.cookie), header: req.headers['x-jaens-hr'], origin: req.headers.origin, host: req.headers.host
    });
    if (out.setCookie !== undefined) res.setHeader('Set-Cookie', `${COOKIE}=${out.setCookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${out.maxAge}`);
    res.statusCode = 200; res.end(JSON.stringify(out.body));
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error('hr api error', e && e.name); // tanpa isi data
    res.statusCode = status; res.end(JSON.stringify({ error: status === 500 ? 'Terjadi kesalahan server.' : e.message }));
  }
};
