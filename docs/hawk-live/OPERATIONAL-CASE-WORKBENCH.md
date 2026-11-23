# Operational · Hospitality Case Workbench dan DX A03

Status: frontend demo, **simulasi**. Fase F-OP07 (Communication & Issues) dan F-OP11 (Demo Experience Center). Tidak ada perubahan backend, schema, rumus produksi, merge atau deploy. Tidak ada WA/email yang dikirim.

## Yang dibangun

- **U-01 Hospitality Case Workbench** (`#op-cases`, `hawk-live/ops-cases.js`), menu tepat setelah Communication Hub.
  - KPI: case tamu terbuka, lewat SLA, menunggu verifikasi, aging tertua. Case terbuka tampil sebagai aging, bukan durasi 0.
  - Antrean **Feedback perlu tindak lanjut**: feedback rating ≤ 2 atau "Tidak puas" dari Dashboard Kinerja yang belum punya case. Pemicu ini draft v0 (Keputusan Owner #3).
  - Daftar case dengan filter Terbuka / Baru & triase / Ditangani / Selesai & diverifikasi / Semua.
- **M-09 drawer case**: status, prioritas, 7P, PIC, SLA respons dan SLA selesai terpisah, tautan feedback dan kunjungan, recovery, riwayat event, dan aksi sesuai peran.
- **Lifecycle**: baru → triase (Jro/Manager/Assistant menetapkan PIC) → ditangani (respons pertama) → menunggu tamu (opsional) → selesai (recovery oleh PIC) → diverifikasi (verifier ≠ PIC/pelaksana), plus reopen.
- **Satu penghitung (A03-R11)**: case tamu disimpan di store yang sama dengan issue fasilitas. Command Center dan Communication Hub memakai satu aturan visibilitas (`H.visibleIssues`, patch di `tools/ops-from-prototype.py`). Sebelumnya Jro Okta melihat 4 di Command Center dan 0 di Issue Center; sekarang angkanya sama untuk semua peran yang diuji.
- Issue Center membuka case tamu dengan drawer case; issue fasilitas tetap memakai detail existing.
- SLA: respons 2 jam, selesai 24 jam, **draft v0** sampai Owner mengesahkan (Keputusan Owner #4).

## Akses (demo)

| Peran | Workbench | Buka case | Triase | Respons / recovery | Verifikasi / reopen |
|---|---|---|---|---|---|
| Manager, Assistant, Hospitality (Jro Okta) | semua outlet dalam lingkup | ya | ya | — | ya (bukan PIC) |
| Supervisor | outlet sendiri | ya | — | ya (outlet sendiri / PIC) | — |
| Head departemen | case departemen / PIC | ya | — | ya bila PIC | — |
| Reception | case departemen / laporan sendiri | ya | — | — | — |
| Therapist, Attendant, Security | tidak | — | — | — | — |

## Demo Experience Center

| Dokumen A03 | Skenario | Status |
|---|---|---|
| DX-1 treatment → feedback → Hospitality | **DX-OP09** (baru, 6 langkah) | Dibangun |
| DX-2 cleaning → readiness → availability | DX-OP02 existing | Dipakai ulang |
| DX-3 receiving → verifikasi → Inventory | DX-OP04 existing | Dipakai ulang |
| DX-4 task/evidence → dashboard → RACE | DX-OP06 existing | Dipakai ulang; tab STRACON/X-score menyusul |
| DX-5 waste & stock opname | **DX-OP10** (baru, 5 langkah) | Dibangun; stok Gudang tidak berubah |
| DX-6 missing / N/A / koreksi | **DX-OP11** (baru, 5 langkah) | Dibangun: kembalikan → versi 2 → verifikasi, periode kosong tampil kosong |

Total Demo Center: 11 skenario, 55 langkah. Langkah state dibuktikan dari data demo, bukan dicentang.

## Kebutuhan backend (di luar mandat frontend)

- Tabel case + event lifecycle, tautan `spa_feedback_id` / appointment, PIC, SLA berversi, penegakan scope di server (Supervisor satu outlet, termasuk ekspor dan AI).
- Notifikasi ke PIC dan tamu hanya lewat kanal resmi yang disetujui Owner.

Uji: `tests/hawk-live/ops-cases.e2e.js` (masuk `run-all.sh`).
