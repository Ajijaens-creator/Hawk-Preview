/* Cloudflare Pages Functions middleware — access control for the HAWK × JAENS preview.
   HTTP Basic Auth on every path (static assets included). Credentials come ONLY from the Pages
   environment variable / secret:  PREVIEW_CREDENTIALS = "aji:<password>,devhawk:<password>"
   Fails CLOSED (503) when not configured. Recommended stronger option on Cloudflare: put the
   custom domain behind Cloudflare Access (Zero Trust, email OTP) — see deploy/DEPLOYMENT_GUIDE.md.
   Docs: https://developers.cloudflare.com/pages/functions/middleware/ */
const REALM = 'HAWK x JAENS Preview (DEMO)';

function safeEqual(a, b) {
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

export async function onRequest(context) {
  const creds = parseCredentials(context.env.PREVIEW_CREDENTIALS);
  if (!creds.length) return deny(503, 'Preview belum dikonfigurasi: set PREVIEW_CREDENTIALS (user:password, min. 12 karakter) di Cloudflare Pages.');
  if (!checkAuth(context.request.headers.get('authorization'), creds)) return deny(401, 'Login diperlukan untuk preview HAWK × JAENS (DEMO).');
  const res = await context.next();
  const out = new Response(res.body, res);
  const isAsset = new URL(context.request.url).pathname.startsWith('/assets/');
  out.headers.set('Cache-Control', isAsset ? 'private, max-age=31536000, immutable' : 'private, no-store');
  out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return out;
}
