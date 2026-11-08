/* Vercel Routing Middleware — access control for the HAWK × JAENS preview.
   HTTP Basic Auth on every path. Credentials come ONLY from Vercel environment variables:
     PREVIEW_CREDENTIALS = "aji:<password>,devhawk:<password>"   (comma-separated user:password pairs)
   Fails CLOSED: if the variable is missing, every request gets 503 instead of an open site.
   Owner switch: PREVIEW_PUBLIC = "true" (exactly) opens the DEMO preview without login (still noindex).
   Remove the variable (or set anything else) and redeploy to lock it again.
   Docs: https://vercel.com/docs/routing-middleware  (next() from @vercel/functions continues the request) */
import { next } from '@vercel/functions';

export const config = { matcher: '/:path*', runtime: 'nodejs' };

const REALM = 'HAWK x JAENS Preview (DEMO)';

function safeEqual(a, b) {
  // constant-time comparison (no early exit on first mismatch)
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function parseCredentials(raw) {
  return String(raw || '')
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.includes(':'))
    .map((p) => [p.slice(0, p.indexOf(':')), p.slice(p.indexOf(':') + 1)])
    .filter(([u, pw]) => u && pw.length >= 12);
}

export function checkAuth(header, creds) {
  if (!header || !header.startsWith('Basic ')) return false;
  let decoded = '';
  try {
    decoded = atob(header.slice(6).trim());
  } catch (e) {
    return false;
  }
  const i = decoded.indexOf(':');
  if (i < 0) return false;
  const u = decoded.slice(0, i);
  const pw = decoded.slice(i + 1);
  let ok = false;
  for (const [cu, cp] of creds) ok = (safeEqual(u, cu) & safeEqual(pw, cp)) === 1 || ok;
  return ok;
}

const deny = (status, msg) =>
  new Response(msg, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      ...(status === 401 ? { 'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"` } : {}),
    },
  });

const passOn = (request) => {
  const isAsset = new URL(request.url).pathname.startsWith('/assets/');
  return next({ headers: { 'Cache-Control': isAsset ? 'private, max-age=31536000, immutable' : 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
};

export default function middleware(request) {
  if (process.env.PREVIEW_PUBLIC === 'true') return passOn(request);
  const creds = parseCredentials(process.env.PREVIEW_CREDENTIALS);
  if (!creds.length) return deny(503, 'Preview belum dikonfigurasi: set PREVIEW_CREDENTIALS (user:password, min. 12 karakter) di Vercel.');
  if (!checkAuth(request.headers.get('authorization'), creds)) return deny(401, 'Login diperlukan untuk preview HAWK × JAENS (DEMO).');
  return passOn(request);
}
