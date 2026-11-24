# Operational · Dashboard Strategis di Dashboard Library (A03 Bab 07)

Owner (Aji, 23 Nov 2026) meminta dashboard tambahan bergabung di Dashboard Library. Isinya diambil dari enam opsi prioritas
di paket A03 Bab 07 (Opsi dashboard strategis).

Sifat tampilan ini:
- **Hanya frontend demo dengan data sintetis.** Setiap tampilan menyusun ulang sumber yang sudah ada dan tidak menambah engine skor, rumus resmi atau API baru.
- **Bukan enam modul baru.** Jumlah dan nama tampilan masih bahan diskusi Owner.

## Navigasi
- **Lokasi.** Sidebar → Dashboard Library → (14 Dashboard Kinerja) → **Dashboard Strategis**. Dashboard Strategis berisi ikhtisar `#op-strategic` dan enam submenu `#op-strategic-<id>`.
- **Submenu aktif.** Ditandai highlight gold. Filter periode mengikuti filter Dashboard Kinerja, dan filter outlet mengikuti pemilih outlet di header.

## Enam tampilan
| # | Tampilan | Pertanyaan | Isi yang aktif | Yang sengaja belum ditampilkan |
|---|---|---|---|---|
| 1 | Ringkasan Strategis Owner | Outlet mana perlu perhatian? | Per outlet: revenue, margin P&L, kepuasan, akurasi stok, maintenance terbuka, readiness checklist, case tamu, tugas lewat tenggat, data menunggu verifikasi. Setiap alasan perhatian menautkan ke workspace sumber. | Skor gabungan. Ambang (kepuasan &lt; 95%, akurasi &lt; 90%, maintenance &gt; 2) adalah demo, bukan target. |
| 2 | X-score Performa Tim | Siapa butuh dukungan? | Jalur penelusuran outlet → departemen → individu → indikator → record, plus coverage bukti (kompetensi, grooming terverifikasi) per outlet × departemen. | Skor dan bobot. Keduanya menunggu kontrak STRACON. N/A tidak diisi nol. |
| 3 | Kapasitas & Perencanaan Terapis | Perlu terapis, skill, shift atau ruang? | Ruang, terapis bertugas, booking, utility (jam) dan register **permintaan tidak terpenuhi** (form demo; satu request lintas outlet tetap satu request). Tabel skenario tindakan. | Rekomendasi jumlah rekrutmen. |
| 4 | Customer Focus & Hospitality | Tamu/masalah mana sekarang? | Antrean case tamu: kritis dulu, lalu yang lewat SLA. SLA respons dan SLA selesai ditampilkan terpisah. Recovery yang menunggu verifikasi, booking mendatang, returning share. | Rebooking conversion dan cohort retention, karena butuh identitas kunjungan dari POS/CRM. |
| 5 | HPP & Profitabilitas Treatment | Treatment mana berkontribusi? | Empat lapisan biaya (standar, aktual, alokasi outlet, alokasi pusat), volume, revenue dan durasi per treatment, serta alur drilldown. | Angka HPP. Recipe, pemakaian per treatment dan kebijakan costing Finance (HPP-001) belum ada. |
| 6 | Kesehatan Keuangan & Budget Outlet | Outlet sehat dan ruang belanja? | Per outlet: revenue, expense, net profit, margin, biaya ÷ revenue, waste ÷ revenue, selisih ke target. Tautan ke Budget 7P. | Skor tunggal. Forecast, gap BEP dan likuiditas hanya tampil di konsolidasi perusahaan. |

## Akses (RBAC demo)
| Peran | Tampilan |
|---|---|
| Operational Manager, Assistant | 1–6 |
| Supervisor (satu outlet) | 1, 2, 3, 4 |
| Hospitality Manager | 1, 2, 4 |
| Head departemen | 2 (departemennya saja) |
| Reception, Therapist, Attendant, Security | — |

Rute di luar akses menampilkan "Tidak berwenang".

## Implementasi & uji
- **Modul.** `hawk-live/ops-strategic.js` dimuat setelah `ops-cases.js`. Shell sidebar, rute dan RBAC diatur di `hawk-live/ops-shell.js`. Gaya diatur di `hawk-live/ops-shell.css`.
- **SLA case.** `H.cases.sla` dibuka untuk dipakai Customer Focus, sehingga penghitung case sama dengan Hospitality Case.
- **Uji.** `tests/hawk-live/ops-strategic.e2e.js` berisi 22 pemeriksaan:
  - struktur menu, sekali klik per tampilan dan isi yang jujur (tanpa skor atau HPP);
  - penghitung case;
  - form permintaan;
  - RBAC lima peran;
  - mobile 390 px.

## Kebutuhan backend (belum dibangun)
- **Permintaan tidak terpenuhi.** Event di Reservation/POS: request ID, slot, durasi, treatment, pax, skill, fleksibilitas, alasan, alternatif dan hasil.
- **X-score.** Kontrak STRACON (indikator, arah, bobot, target, sumber), lalu engine roll-up per kontrak.
- **HPP.** Recipe standar, consumption per service line, valuasi Inventory, basis labor dan alokasi Finance.
- **Retensi.** Visit/customer identity POS/CRM untuk rebooking conversion dan cohort retention.
- **Keuangan.** P&L per outlet yang direkonsiliasi (bridge net profit), forecast dan basis BEP.
