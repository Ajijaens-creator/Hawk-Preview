# DEPLOY KE VERCEL — tanpa GitHub, tanpa database

**Paket:** `HAWK_JAENS_60NV_VERCEL_READY.zip` · **Target:** `https://preview.hawk.jaens.id` · **Data:** DEMO di browser, Mock adapter, tanpa database, tanpa API HAWK.

> ⚠️ **Domain belum aktif.** Belum ada deployment, record DNS, atau sertifikat SSL. Jangan bagikan domain sebelum semua cek di langkah 5 lulus.
>

## Isi paket

```
public/          aplikasi siap pakai (index.html + assets/, aset ber-hash, noindex). Tidak perlu build.
middleware.js    login (HTTP Basic Auth) untuk SEMUA path, termasuk assets/. Menolak akses (503) bila password belum diisi.
package.json     hanya @vercel/functions 3.10.2 (dibutuhkan middleware). Tidak ada script build.
vercel.json      output = public, header keamanan (CSP ketat, HSTS, X-Frame-Options DENY, noindex)
```

Tidak ada kredensial, API key, atau data JAENS asli di paket. Password hanya disimpan sebagai environment variable di Vercel.

## 1. Siapkan password (environment variable)

| Nama | Isi | Contoh |
|---|---|---|
| `PREVIEW_CREDENTIALS` | `user:password`, pisahkan dengan koma untuk beberapa user. Password minimal 12 karakter. | `aji:<password-acak>,devhawk:<password-acak>` |

Buat password acak, misalnya dengan `openssl rand -base64 18`. Bagikan lewat kanal pribadi, bukan grup.

## 2. Deploy — Vercel CLI dari folder (disarankan, tanpa GitHub)

Butuh Node.js 18+ di komputer.

```bash
unzip HAWK_JAENS_60NV_VERCEL_READY.zip
cd HAWK_JAENS_60NV_VERCEL_READY
npx vercel login                                   # login akun Vercel (email)
npx vercel link                                     # buat project baru, mis. "hawk-jaens-preview"; framework: Other
npx vercel env add PREVIEW_CREDENTIALS production   # tempel nilai dari langkah 1; tandai Sensitive bila ditanya
npx vercel --prod                                   # upload folder ini & deploy production
```

Vercel meng-upload folder langsung dari komputer (tanpa repo Git), memasang `@vercel/functions`, lalu menyajikan `public/`. Tidak ada langkah build.

Setelah deploy: Project › Settings › **Deployment Protection** › aktifkan *Standard Protection* untuk URL `*.vercel.app`.

## 3. Bila memakai upload drag-and-drop ("Vercel Drop")

Saya belum dapat memastikan dari dokumentasi Vercel bahwa upload drag-and-drop menjalankan `middleware.js`. Karena itu:

1. Upload **seluruh isi folder** (bukan hanya `public/`), lalu isi `PREVIEW_CREDENTIALS` di Settings › Environment Variables dan deploy ulang.
2. Buka URL deployment di jendela private. **Harus muncul dialog login.**
3. Bila halaman langsung terbuka tanpa login, **jangan bagikan URL itu**. Pilih salah satu: deploy ulang lewat CLI (langkah 2), atau aktifkan Settings › Deployment Protection › **Password Protection** (fitur berbayar Vercel) untuk semua deployment termasuk custom domain.

## 4. Hubungkan domain `preview.hawk.jaens.id`

1. Project › Settings › **Domains** › Add › `preview.hawk.jaens.id`.
2. Di pengelola DNS `jaens.id`, buat record **persis seperti yang ditampilkan Vercel** di halaman Domains. Umumnya:

   | Type | Name / Host | Value | TTL |
   |---|---|---|---|
   | CNAME | `preview.hawk` | `cname.vercel-dns.com` (atau nilai khusus proyek dari Vercel) | 300 |

   - Bila DNS `jaens.id` di Cloudflare: set record ini **DNS only** (awan abu-abu).
   - Jangan ada record A/AAAA lain untuk nama yang sama.
   - Bila `jaens.id` punya CAA record, tambahkan `0 issue "letsencrypt.org"`.
3. SSL diterbitkan otomatis oleh Vercel setelah DNS valid (biasanya beberapa menit, maksimal 24–48 jam). Status di halaman Domains harus **Valid Configuration**.

## 5. Verifikasi sebelum domain diumumkan

```bash
dig +short CNAME preview.hawk.jaens.id                       # → cname.vercel-dns.com. (atau nilai Vercel)
echo | openssl s_client -connect preview.hawk.jaens.id:443 -servername preview.hawk.jaens.id 2>/dev/null | openssl x509 -noout -subject -dates
curl -sI https://preview.hawk.jaens.id/ | grep -iE '^HTTP|www-authenticate'           # → 401 + WWW-Authenticate
curl -sI -u 'aji:<password>' https://preview.hawk.jaens.id/ | grep -iE '^HTTP|content-security'   # → 200 + CSP
curl -sI https://preview.hawk.jaens.id/assets/js/core/seed.js | head -1                # → 401 (aset juga terkunci)
```

Di browser (desktop, iPad, HP): login → Beranda NV-01 → buka `…/#/nv/23` lalu tekan **Refresh** (layar yang sama harus tampil) → Walkthrough Owner berjalan → tidak ada error di console.

| Cek | Hasil | Tanggal / oleh |
|---|---|---|
| Deploy production sukses | ☐ | |
| Tanpa login = 401, dengan login = 200 | ☐ | |
| DNS CNAME benar | ☐ | |
| SSL Valid Configuration | ☐ | |
| Desktop / iPad / HP OK, refresh di `#/nv/23` OK | ☐ | |
| **Domain boleh diumumkan** | ☐ | |

## 6. Update, rollback, menutup

- **Update:** ganti isi `public/` dengan build baru (`node tools/build-vercel.js` di paket FULL SOURCE), lalu `npx vercel --prod`.
- **Rollback:** Vercel › Deployments › pilih versi lama › *Promote to Production*.
- **Menutup preview:** hapus domain di Settings › Domains dan record CNAME-nya. Menghapus `PREVIEW_CREDENTIALS` lalu deploy ulang juga langsung menutup akses (503).

## Uji lokal (opsional, dari paket FULL SOURCE)

```bash
node tools/build.js
PREVIEW_CREDENTIALS="demo:ganti-password-ini" node tools/serve-local.js 8788   # http://localhost:8788
node tests/deploy.test.js
```

## Saklar akses publik (opsional, keputusan Owner)

- `PREVIEW_PUBLIC = true` (persis "true") di Vercel › Settings › Environment Variables (Production) → preview terbuka tanpa login. Header `noindex` tetap aktif. Isi hanya data DEMO.
- Untuk mengunci lagi: hapus variabel itu lalu **Redeploy**. Login `PREVIEW_CREDENTIALS` kembali berlaku.
