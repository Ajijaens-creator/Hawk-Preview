# HAWK four-portal · Kunci desain (HAWK Brand & UI)

Ditetapkan Owner 11 Nov 2026: preview empat portal harus **sama persis** dengan HAWK ERP live di https://preview.hawk.jaens.id/ (NV-01).

## Sumber tunggal

- Satu-satunya sumber desain: `assets/css/hawk.css` (design system "Premium Black & Deep Gold Intelligence" yang dipakai aplikasi 62-NV).
- `hawk-live/*.html` memuat `../assets/css/hawk.css` **lebih dulu**, lalu `style.css`.
- `hawk-live/style.css` hanya berisi komponen tambahan (filter, gauge, ring, bar, dialog pemilih portal). Isinya **tidak boleh** mendefinisikan `:root` atau token warna sendiri. Semua warna diambil dari variabel hawk.css.
- Palet di `reference/HAWK-BRAND-GUIDELINES.md` (#191919 / #F3DB9D → #AD7D36) **tidak dipakai lagi** untuk preview ini.

## Token (dari hawk.css)

| Token | Nilai | Pemakaian |
|---|---|---|
| `--black` | #0B0B0B | Sidebar, header tabel |
| `--charcoal` | #1A1A1A | Topbar |
| `--gold` | #C99A2E | Fokus, aksen |
| `--gold-dark` | #A67C1F | Link |
| `--bronze` | #8B6914 | Teks status emas |
| `--champagne` | #E5C66A | Teks emas di latar gelap |
| `--canvas` | #F7F7F5 | Latar halaman |
| `--surface` | #FFFFFF | Kartu |
| `--gold-grad` | #E5C66A → #C99A2E → #A67C1F | Tombol utama, modul aktif, tag kode layar |

KPI memakai gradien HAWK: `g-teal`, `g-violet`, `g-blue`, `g-gold`.

## Pola layar (wajib sama dengan NV-01)

- Shell: `.app` → `.sidebar` (brand H + modul berhuruf F/O/C/S/P, `.nav-items` dengan kode layar) → `.topbar` (charcoal, role chip) → `.main` (`.demo-banner`).
- Kepala halaman: `.crumbs` lalu `.page-head` dengan `.nv-tag` berisi kode layar (F1-02 dst.).
- `.hero` gelap-emas dengan ilustrasi garis, `.grid .g4.keep2` KPI, `.card`, `.tbl` (header hitam), `.tabs .tab.on`, `.btn`/`.btn.ghost`/`.btn.sm`, `.badge.demo`.
- Mobile ≤960 px: sidebar geser (`.sidebar.on` + `.scrim.on`), tombol `☰` di topbar.

## Penjaga

`node tests/hawk-live/design-lock.test.js` gagal bila urutan CSS berubah, bila `style.css` menambah `:root`/token, atau bila kelas shell HAWK hilang dari halaman.
