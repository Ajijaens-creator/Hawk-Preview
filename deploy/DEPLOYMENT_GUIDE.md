# Panduan Deployment & Custom Domain — HAWK × JAENS Preview

**Target:** `https://preview-furchasing.jaens.id` · **Isi:** prototipe 60 NV (modul A–J), data DEMO, Mock Adapter · **Untuk:** developer JAENS / HAWK

> ⚠️ **Status domain saat paket ini dibuat: BELUM AKTIF.** Belum ada deployment, record DNS, atau sertifikat SSL yang dibuat. Domain baru boleh diumumkan setelah semua cek di §6 lulus.
>
> ⚠️ **Periksa ejaan subdomain.** Permintaan tertulis `preview-furchasing` ("f"). Bila yang dimaksud `preview-purchasing`, gunakan nama itu secara konsisten di DNS, di dashboard hosting, dan di `PREVIEW_DOMAIN` saat build (`PREVIEW_DOMAIN=preview-purchasing.jaens.id node tools/build.js`). Selain itu tidak ada yang perlu diubah.

---

## 1. Isi paket

| Path | Fungsi |
|---|---|
| `index.html`, `assets/` | Source aplikasi (vanilla JS, tanpa framework, tanpa dependensi runtime) |
| `dist/` | **Production build siap deploy** (dibuat `node tools/build.js`): aset ber-hash `?v=…`, boot script terpisah untuk CSP ketat, `noindex`, `_headers`, `_redirects`, `robots.txt`, `build-manifest.json` |
| `functions/_middleware.js` | Cloudflare Pages: login (HTTP Basic Auth) untuk semua path, termasuk aset |
| `middleware.js` | Vercel Routing Middleware: login yang sama (memakai `@vercel/functions`, versi dipin 3.10.2) |
| `vercel.json` | Build command, output `dist`, header keamanan (CSP, HSTS, X-Frame-Options, noindex) |
| `wrangler.toml` | Konfigurasi project Cloudflare Pages (`pages_build_output_dir = "dist"`) |
| `package.json` | Script `build`, `preview`, `test`, `test:browser` |
| `tools/serve-local.js` | Server lokal yang meniru produksi (login + header) untuk uji sebelum deploy |
| `tests/deploy.test.js` | Uji build, login kedua platform, CSP, dan aplikasi di desktop/iPad/mobile |

**Routing.** Aplikasi memakai hash route (`/#/nv/23`). Server cukup menyajikan `index.html`, tanpa rewrite SPA. Semua 60 NV dapat dibuka langsung lewat URL hash.

**Data.** Hanya data DEMO di `localStorage` browser masing-masing pengguna. Tidak ada database, API HAWK, atau variabel produksi. Adapter HAWK API sengaja mengembalikan `NOT_CONNECTED`.

## 2. Kontrol akses (wajib)

Preview dilindungi login. Kredensial **hanya** disimpan sebagai secret/environment variable di platform, tidak pernah di repo atau ZIP.

| Variabel | Format | Contoh pembuatan |
|---|---|---|
| `PREVIEW_CREDENTIALS` | `user:password` dipisah koma; password minimal 12 karakter | `aji:$(openssl rand -base64 18),devhawk:$(openssl rand -base64 18)` |

- **Fail closed:** bila variabel kosong atau salah format, situs menjawab **503**, bukan terbuka.
- Semua path dilindungi, termasuk `/assets/*` dan `robots.txt`.
- Respons berisi `Cache-Control: private` dan `X-Robots-Tag: noindex`.
- Bagikan password lewat kanal aman (bukan email/WA grup). Ganti secara berkala; setelah mengganti, lakukan redeploy.

**Lapisan tambahan yang direkomendasikan:**
- Cloudflare: **Cloudflare Access** (Zero Trust) dengan login email OTP untuk alamat yang diizinkan.
- Vercel: **Deployment Protection** untuk URL `*.vercel.app`.

Basic Auth tetap aktif sebagai lapisan kedua.

## 3. Opsi A — Cloudflare Pages (disarankan bila DNS `jaens.id` dikelola Cloudflare)

### 3a. Deploy
```bash
npm install                      # hanya untuk tooling; aplikasi tidak butuh dependensi
npm test                         # engine + deploy tests
node tools/build.js              # → dist/
npx wrangler login
npx wrangler pages project create hawk-jaens-preview --production-branch main
npx wrangler pages secret put PREVIEW_CREDENTIALS --project-name hawk-jaens-preview
npx wrangler pages deploy dist --project-name hawk-jaens-preview --branch main
```
Jalankan dari root folder paket, supaya folder `functions/` ikut ter-deploy.

**Alternatif via Git.** Dashboard › Workers & Pages › Create › Pages › Connect to Git. Isi:
- Build command: `node tools/build.js`
- Build output: `dist`
- Root directory: kosong
- Variables and Secrets: tambah `PREVIEW_CREDENTIALS` (Encrypt) untuk Production **dan** Preview.

### 3b. Custom domain
1. Pages › `hawk-jaens-preview` › **Custom domains** › *Set up a custom domain* › `preview-furchasing.jaens.id`. Tambahkan di sini **dulu** sebelum membuat CNAME, karena CNAME tanpa langkah ini menghasilkan error 522.
2. DNS:
   - **Zona `jaens.id` di Cloudflare:** record dibuat otomatis (CNAME proxied).
   - **DNS di provider lain:** buat record berikut.

     | Type | Name / Host | Target / Value | TTL |
     |---|---|---|---|
     | CNAME | `preview-furchasing` | `hawk-jaens-preview.pages.dev` | 300 / Auto |

3. SSL diterbitkan otomatis oleh Cloudflare setelah validasi, biasanya beberapa menit (maksimal 24 jam). Status harus menjadi **Active** di halaman Custom domains.

### 3c. Cloudflare Access (opsional, kuat)
Zero Trust › Access › Applications › Add › **Self-hosted**:
- Domain: `preview-furchasing.jaens.id`
- Policy: *Allow* untuk *Emails* yang ditentukan (atau *Emails ending in* `@jaens.id`)
- Login method: One-time PIN

Ini hanya bekerja bila hostname diproksi Cloudflare (zona di Cloudflare). Aktifkan juga *Access policy* untuk preview deployments `*.pages.dev` di Settings proyek Pages.

## 4. Opsi B — Vercel

### 4a. Deploy
1. Vercel › Add New › Project › import repo (atau `npx vercel` dari folder paket). Framework preset: **Other**. Build/output sudah diatur di `vercel.json` (`node tools/build.js` → `dist`).
2. Settings › Environment Variables › `PREVIEW_CREDENTIALS`. Centang Production + Preview dan tandai *Sensitive*.
3. Deploy (`npx vercel --prod`). `middleware.js` di root otomatis menjadi Routing Middleware.
4. Settings › Deployment Protection › **Standard Protection** (melindungi URL `*.vercel.app`).

### 4b. Custom domain
1. Settings › **Domains** › Add › `preview-furchasing.jaens.id`.
2. Buat CNAME di DNS `jaens.id` **persis seperti nilai yang ditampilkan Vercel** di halaman Domains. Umumnya:

   | Type | Name / Host | Target / Value | TTL |
   |---|---|---|---|
   | CNAME | `preview-furchasing` | `cname.vercel-dns.com` (atau nilai khusus proyek yang ditampilkan Vercel) | 300 |

3. Bila `jaens.id` dikelola Cloudflare, set record ini **DNS only** (awan abu-abu) supaya Vercel dapat menerbitkan sertifikat.
4. SSL (Let's Encrypt) diterbitkan otomatis setelah DNS valid. Status domain harus **Valid Configuration** tanpa peringatan.

## 5. Catatan DNS & SSL umum
- **CAA record:** bila `jaens.id` punya CAA, izinkan CA platform yang dipakai:
  - Vercel: `0 issue "letsencrypt.org"`
  - Cloudflare: `letsencrypt.org`, `pki.goog`, `ssl.com`
- Jangan membuat record A/AAAA lain untuk subdomain yang sama; CNAME harus satu-satunya record pada nama itu.
- Propagasi DNS biasanya < 1 jam (TTL 300), tetapi bisa sampai 24–48 jam pada resolver lama.
- HSTS dikirim `max-age=31536000` **tanpa** `includeSubDomains`/`preload`, agar tidak memengaruhi subdomain JAENS lain.

## 6. Verifikasi sebelum menyatakan domain aktif

Jalankan semua cek di bawah dan simpan hasilnya.

```bash
# 1. DNS mengarah ke platform
dig +short CNAME preview-furchasing.jaens.id
#    → hawk-jaens-preview.pages.dev.   atau   cname.vercel-dns.com. / nilai Vercel
#    (zona Cloudflare yang di-proxy: dig A menampilkan IP Cloudflare — itu normal)

# 2. Sertifikat valid untuk hostname ini dan belum kedaluwarsa
echo | openssl s_client -connect preview-furchasing.jaens.id:443 -servername preview-furchasing.jaens.id 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName

# 3. Tanpa login ditolak (BUKAN 200, BUKAN 503)
curl -sI https://preview-furchasing.jaens.id/ | grep -iE '^HTTP|www-authenticate'
#    → HTTP/2 401  +  www-authenticate: Basic realm="HAWK x JAENS Preview (DEMO)"

# 4. Dengan login: 200 + header keamanan
curl -sI -u 'aji:<password>' https://preview-furchasing.jaens.id/ | grep -iE '^HTTP|content-security-policy|strict-transport|x-robots'

# 5. HTTP diarahkan ke HTTPS (Cloudflare: aktifkan SSL/TLS › Edge Certificates › Always Use HTTPS; Vercel: otomatis)
curl -sI http://preview-furchasing.jaens.id/ | grep -iE '^HTTP|location'
```

Cek manual di browser:
- Desktop (Chrome/Edge), iPad (Safari), dan HP (Safari/Chrome): login → Beranda NV-01 tampil → buka `#/nv/23` → Walkthrough Owner berjalan → tidak ada error di console.

| Cek | Hasil | Tanggal / oleh |
|---|---|---|
| Deploy production sukses | ☐ | |
| DNS CNAME benar | ☐ | |
| SSL Active / Valid Configuration | ☐ | |
| 401 tanpa login, 200 dengan login | ☐ | |
| Desktop / iPad / mobile OK | ☐ | |
| **Domain boleh diumumkan** | ☐ | |

## 7. Uji lokal sebelum deploy
```bash
node tools/build.js
PREVIEW_CREDENTIALS="demo:ganti-password-ini" node tools/serve-local.js 8788
# buka http://localhost:8788 → dialog login → user demo / ganti-password-ini
node tests/deploy.test.js     # 23 cek: build, login CF & Vercel, CSP, desktop/iPad/mobile
```

## 8. Update & rollback
- **Update:** ubah source → `node tools/build.js` → deploy ulang. Hash aset berubah otomatis, jadi pengguna tidak tertahan cache lama.
- **Rollback:** Cloudflare › Deployments › *Rollback*; Vercel › Deployments › *Promote to Production* pada versi sebelumnya.
- **Menutup preview:** hapus custom domain di platform, lalu hapus CNAME. Mengosongkan `PREVIEW_CREDENTIALS` juga langsung menutup akses (503).
