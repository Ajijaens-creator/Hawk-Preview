/* HAWK Operational · Peta "satu sumber entri" untuk 14 Dashboard Kinerja (Looker "Operational Report New").
   Hasil penelusuran read-only atas spreadsheet sumber Looker (folder Drive Operational, file 01–21) dan SER/Vegen.
   Hanya STRUKTUR (kolom, rumus, cara isi). Tidak ada angka, nama karyawan, atau nama tamu asli yang disalin.
   Tujuan: setiap angka dashboard punya SATU titik entri di HAWK OS (atau integrasi otomatis), tanpa spreadsheet.
   Label di sini adalah RENCANA + tingkat bukti kode, bukan integrasi live. Belum ada integrasi teruji (T).
   Juga melengkapi field form entri yang masih kurang (maintenance, komplain) — semua opsional, DATA DEMO / SIMULASI. */
(function () {
  'use strict';
  const H = window.OPX;
  if (!H || !H.analytics || H.analytics.__single) return;
  const A = H.analytics, E = (s) => H.escape(String(s == null ? '' : s));

  /* mode: auto = dihitung dari sistem lain (tanpa entri) · event = dicatat sekali per kejadian oleh tim · master = data induk sekali set
     plan (rencana, BUKAN status integrasi): reuse = pakai engine existing · integrate = adapter baca ke engine existing ·
       extend = tambah field/alur pada engine existing · build = entitas baru (additive) · owner = menunggu keputusan Owner
     bukti: K = kode backend hawk-backend-erp terbaca (belum dijalankan) · P = route UI POS/ERP existing · D = demo hawk-live (fixture) ·
       T = integrasi teruji (belum ada) · X = tidak ditemukan di kode
     Kolom baris: [data, titik entri HAWK, mode, plan, catatan, bukti, endpoint/route existing]. Lihat docs/hawk-live/OPERATIONAL-A03-EXISTING-MAP.md. */
  const MAP = {
    revenue: {
      sheets: ['01 Revenue (tab per outlet, harian)'],
      today: 'Supervisor/admin mengetik rekap harian dari laporan POS: revenue room, foot chair, salon, retail, jumlah invoice, tamu baru/lama. Target bulanan diketik di tab datahelper.',
      formula: 'Revenue Service = room + foot chair + salon · Avg sales = revenue ÷ jumlah invoice · % pencapaian = revenue ÷ target bulanan',
      target: 'Target per outlet per bulan (Budget)',
      rows: [
        ['Transaksi service & retail', 'POS existing (invoice)', 'auto', 'integrate', 'Receptionist hanya memproses transaksi di POS. Definisi booked / billed / received dan refund/void disepakati dengan Finance.', 'K,P', '/spa-appointment/progress/invoice/* · /spa-home/dashboard/revenue-real-time · /average-bill · /spa-finance/daily-report'],
        ['Target bulanan per outlet', 'Target setting Finance', 'master', 'reuse', 'Target dibaca dari Finance, bukan diketik di Operational. Distribusi musiman belum dicek.', 'K', '/spa-finance/target-setting · /spa-finance/parameter-target']
      ],
      gap: 'Adapter baca invoice POS → Operational belum dibuat dan belum diuji (T). Paritas isi POS masih menunggu login Owner.'
    },
    pnl: {
      sheets: ['02 PNL (GabunganPNL, PNLalloutlet, Eficiencyutility)'],
      today: 'Disalin bulanan dari laporan keuangan Finance per akun (income, HPP, laundry, payroll, listrik, iklan, maintenance, dst).',
      formula: 'Laba bersih = gross sales − total expenses · Efisiensi = expense ÷ revenue (status target 10%)',
      target: 'Target profit per outlet (Budget)',
      rows: [
        ['Pendapatan, biaya per akun, laba', 'P&L per lokasi Finance', 'auto', 'integrate', 'Operational hanya membaca; tidak ada entri angka keuangan.', 'K,P', '/api/profitandlost/by-location · /api/budgetmanager/get_budget_variance'],
        ['Komponen People', 'Payroll HRD', 'auto', 'reuse', 'Di bawah top management hanya %; berlaku juga untuk ekspor dan AI. Penegakan di API belum diuji.', 'K', 'payroll_* · /spa-commission-detail']
      ],
      gap: 'Mapping akun GL → kategori 7P berversi dan bridge ke laba workbook 02 perlu kontrak data Finance.'
    },
    capacity: {
      sheets: ['05 Room Utility', '0.55 Room Utility', '08 Utility Terapis', '03 Absensi'],
      today: 'Tiga sheet terpisah diketik: revenue room harian vs kapasitas, rata-rata utility terapis harian, jumlah sakit/ijin harian.',
      formula: 'Sheet 05 = revenue room ÷ target revenue room harian (target 70%) · Utility terapis = treatment ÷ terapis hadir per hari (target 130/bulan) · Absensi = (sakit + ijin) ÷ hari-orang terjadwal (maks 3%)',
      target: 'Ope-Ope-Room 70% · Ope-Pro-Serv 130 · Ope-Pro-Abse ≤3%',
      rows: [
        ['Occupancy ruang (waktu)', 'Engine dashboard backend', 'auto', 'reuse', 'Jam ruang terpakai ÷ (hari × ruang × jam kerja × 0,75). Faktor 0,75 perlu disahkan. Berbeda dari sheet 05.', 'K', '/spa-home/dashboard/occupancy · /spa-room · /spa-work-hour · /spa-blocktime-room'],
        ['Room revenue vs target (sheet 05)', 'POS invoice per kategori ruang + target Finance', 'auto', 'owner', 'Metrik terpisah dari occupancy dan diberi nama sendiri. Field kapasitas di form ini hanya demo; editor master belum ada.', 'K,D', '/spa-home/dashboard/revenue-real-time'],
        ['Utilisasi terapis', 'Engine dashboard backend', 'auto', 'reuse', 'Menit treatment status 5/6/7 ÷ (terapis aktif × target jam). Kartu treatment/terapis di demo memakai estimasi 60 menit: DEMO SAJA, bukan KPI live.', 'K', '/spa-home/dashboard/therapist-util · /spa-target-hour'],
        ['Sakit / ijin', 'Jadwal + presensi HRD', 'auto', 'reuse', 'Dihitung dari jadwal + presensi. Pemetaan alasan sakit/ijin perlu dicek.', 'K,P,D', '/api/employee/data_schedule · /api/employee/data_attendance · /spa-reason']
      ],
      gap: 'Dua definisi berbeda (waktu vs Rp) harus tampil dengan nama berbeda. Belum ada adapter teruji.'
    },
    waste: {
      sheets: ['14 Waste', '15 Akurasi SO'],
      today: 'Total Rp waste BHP dan retail diketik per bulan; akurasi SO diketik sebagai persen dari file stock opname Inventory.',
      formula: '% Waste BHP = waste BHP ÷ revenue service · % Waste retail = waste retail ÷ revenue retail (batas 1%) · Akurasi SO = item cocok ÷ item dihitung (target 100%)',
      target: 'Waste ≤1% · Akurasi SO 100%',
      rows: [
        ['Waste / pemakaian BHP', 'Inventory consumption + adjustment', 'event', 'extend', 'Dicatat sekali per kejadian: item, qty, alasan. Klasifikasi normal / berlebih / rusak perlu ditambah. Nilai Rp dari valuasi Inventory.', 'K', '/api/inventory-consumption/* · /spa-appointment/progress/invoice/{id}/ingredients · /api/invadjustment/*'],
        ['Stock opname', 'Inventory count existing', 'event', 'reuse', 'Akurasi dihitung dari baris hitung (sistem vs fisik), bukan rata-rata persen bulanan.', 'K,P', '/api/invcount/* · /api/invadjustment/approve/{id}'],
        ['Pembagi revenue', 'POS invoice', 'auto', 'integrate', 'Sama dengan dashboard Revenue.', 'K', '/spa-home/dashboard/revenue-real-time']
      ],
      gap: 'Keputusan Owner: akurasi SO berbasis item cocok, nilai Rp selisih, atau keduanya.'
    },
    reviews: {
      sheets: ['06 Offline Feedback', '07 Online Review'],
      today: 'Offline: hitungan kartu feedback 5–1 bintang per hari diketik. Online: setiap review Google/Tripadvisor disalin manual satu per baris.',
      formula: 'Rata-rata bintang · % bintang 5 · jumlah feedback · feedback ÷ total tamu',
      target: null,
      rows: [
        ['Feedback per kunjungan', 'Feedback appointment existing (diisi staf dari gantt)', 'event', 'extend', 'Satu baris aktif per appointment + tamu, 13 skor. Kanal tamu (QR / tautan) belum ada dan perlu ditambah.', 'K,P', '/spa-feedback/{spa_appointment_id} · /spa-feedback/guest-review-summary'],
        ['Review online', 'Snapshot review atau konektor resmi', 'event', 'build', 'Belum ada entitas di backend. Nama tamu tidak disimpan.', 'X', '—'],
        ['Total tamu', 'POS', 'auto', 'integrate', 'Untuk rasio feedback per tamu.', 'K', '/spa-home/dashboard/total-guest']
      ],
      gap: 'Kanal feedback tamu dan entitas review online belum ada. Konektor resmi perlu akun Owner.'
    },
    satisfaction: {
      sheets: ['12 Konversi Offline vs Online'],
      today: 'Disusun ulang manual setiap bulan dari sheet 06 dan 07. Pivot KPI menjumlahkan persen antar outlet (hasil >100%, keliru).',
      formula: '% Kepuasan = (bintang 5 + 4) ÷ total review · % Keluhan = (bintang 3 + 2 + 1) ÷ total review',
      target: null,
      rows: [
        ['Semua angka', 'Turunan dari feedback per kunjungan + review online', 'auto', 'build', 'Tanpa entri. Rata-rata antar outlet harus tertimbang jumlah review, bukan dijumlah.', 'D', '—']
      ],
      gap: 'Bergantung pada review online (belum ada) dan kanal feedback tamu. Pemetaan skor 13 item ke bintang 1–5 perlu disepakati.'
    },
    retention: {
      sheets: ['11 Rebooking', '16 Guest 10 Years'],
      today: 'Jumlah tamu, tamu baru dan repeater diketik ulang harian (duplikat sheet 01); histori sejak 2015 diketik bulanan.',
      formula: '% Repeater = repeater ÷ total tamu (target 25%) · YoY per bulan',
      target: 'Repeater 25%',
      rows: [
        ['Tamu baru / repeater', 'Customer summary POS', 'auto', 'integrate', 'Returning share, rebooking conversion dan retention dibedakan. Rebooking conversion belum punya definisi window.', 'K,P', '/spa-customer/customer-summary · /spa-customer/{id}/treatment-history'],
        ['Histori 2015–2025', 'Impor sekali (legacy aggregate)', 'master', 'owner', 'Ditandai legacy aggregate, tidak dicampur dengan data live.', 'X', '—']
      ],
      gap: 'Deduplikasi customer di POS lama perlu dicek saat migrasi.'
    },
    complaints: {
      sheets: ['10 Keluhan 7P', '13 Komplin Minor'],
      today: 'Keluhan dicatat per baris dengan tipe 7P dan karyawan terkait; rekap bulanan <24 jam / >24 jam dan satu angka "waktu handle" diketik terpisah.',
      formula: 'Jumlah keluhan per 7P per outlet · % ditangani <24 jam · rata-rata jam penanganan',
      target: 'SLA offline <24 jam',
      rows: [
        ['Case Hospitality', 'Case tunggal tertaut feedback/appointment', 'event', 'build', 'Belum ada di backend. Demo punya dua penghitung (form komplain dan Issue Center) yang harus disatukan.', 'X,D', '/spa-reason (master alasan saja)'],
        ['Kategori 7P', 'Field pada case', 'event', 'build', 'People, Product, Process, Place, Facility, Promotion, Price. Field sudah ada di form demo.', 'D', '—'],
        ['Karyawan terkait & kunjungan', 'employeeRef (master HRD) + appointment', 'event', 'build', 'Field sudah ada di form demo; belum tertaut ke record asli.', 'D', '/api/employee · /spa-appointment']
      ],
      gap: 'Keputusan Owner: pemicu case dan SLA (offline dan online).'
    },
    tripadvisor: {
      sheets: ['09 Tripadvisor'],
      today: 'Snapshot mingguan (tanggal 7/14/21/28) peringkat dan rating per outlet diketik.',
      formula: 'KPI = rata-rata rating per bulan per outlet · peringkat terakhir',
      target: null,
      rows: [
        ['Snapshot rank & rating', 'Tugas mingguan Hospitality atau pengambilan otomatis', 'event', 'build', 'Schema demo memuat rank, rating, jumlah review dan URL bukti; backend belum punya entitasnya.', 'X,D', '—']
      ],
      gap: 'Entitas snapshot perlu dibangun. Pengambilan otomatis hanya bila Tripadvisor menyediakan akses resmi.'
    },
    maintenance: {
      sheets: ['04 Maintenance (2025 & 2026)'],
      today: 'Satu baris per pekerjaan: tanggal & jam lapor, jam respon, urgensi, kategori, outlet, status, dikerjakan oleh.',
      formula: 'Response time = rata-rata (waktu respon − waktu lapor) · jumlah per kategori · % selesai',
      target: null,
      rows: [
        ['Work order maintenance', 'Work order bertimestamp (lapor → respons → mulai → selesai → verifikasi)', 'event', 'build', 'Backend hanya punya update maintenance aset; lifecycle tiket belum ada.', 'K,D', '/api/assetdepre/update_asset_maintenance'],
        ['Urgensi, dikerjakan oleh, mulai dikerjakan', 'Field form demo', 'event', 'build', 'Ditambahkan di form demo, sama dengan kolom sheet.', 'D', '—'],
        ['Kategori lengkap', 'Pilihan kategori disamakan dengan sheet 2026', 'event', 'build', 'Infrastruktur/Civil, Plumbing, Preventive ditambahkan di demo.', 'D', '—'],
        ['Aset & downtime ruang', 'Register aset + blocktime ruang', 'master', 'integrate', 'Tiket menaut ke aset dan blocktime, bukan tiket analytics kedua.', 'K', '/api/groupasset/* · /spa-blocktime-room']
      ],
      gap: 'Lifecycle work order perlu dibangun di backend.'
    },
    grading: {
      sheets: ['20 Grading FO'],
      today: 'Tracker 32 tahapan program (modul, SOP, evaluasi 3/6/12 bulan) dengan bobot, PIC dan status selesai/proses.',
      formula: 'Progress = bobot jika selesai, ½ bobot jika proses · total = Σ progress ÷ Σ bobot',
      target: '100% program',
      rows: [
        ['Tahapan program', 'Modul project existing atau template program', 'event', 'owner', 'Form demo saat ini menerima persen bebas per tahap; aturan "proses = ½ bobot" belum diterapkan dan belum disahkan.', 'K,D', '/api/project/* (perlu evaluasi)'],
        ['Hasil grade per FO', 'Assessment kompetensi + HRD', 'event', 'build', 'Grade per karyawan disimpan di HRD sebagai riwayat.', 'K', '/spa-grade/*']
      ],
      gap: 'Progress proyek FO dibedakan dari kompetensi individu. Bobot tahap perlu kontrak.'
    },
    competency: {
      sheets: ['19 Kesiapan SDM (per outlet)'],
      today: 'Matrix 0/1 per karyawan: ±24 skill treatment terapis, 15 item system knowledge FO, 2 item basic attendant.',
      formula: 'Skor = item tercapai ÷ item dinilai per karyawan · kesiapan outlet = rata-rata skor per departemen',
      target: null,
      rows: [
        ['Assessment per karyawan', 'Instrumen assessment per peran', 'event', 'build', 'achieved ÷ possible per instrumen. Instrumen belum ada di backend.', 'D', '—'],
        ['Skill terapis ↔ treatment', 'Matrix existing', 'master', 'reuse', 'Matrix menentukan applicability, bukan hasil assessment.', 'K', '/spa-employee-treatment/matrix'],
        ['Data karyawan', 'Master karyawan HRD', 'auto', 'reuse', 'Tidak ada ketik ulang nama/jabatan.', 'K,D', '/api/employee/*']
      ],
      gap: 'Master item per departemen perlu disusun dari matrix yang ada.'
    },
    grooming: {
      sheets: ['18 Grooming', '17 Daily Ceklist 5S'],
      today: 'Per outlet per hari hanya 1/0 "sudah dicek / checklist terisi". Pola 0/1 kedua sheet identik (indikasi disalin).',
      formula: '% kepatuhan = hari dengan cek tersubmit ÷ hari operasional',
      target: '100% kepatuhan',
      rows: [
        ['Grooming per karyawan', 'Checklist grooming saat briefing', 'event', 'build', 'Hasil Sesuai / Perlu perbaikan per employeeRef.', 'D', '—'],
        ['Checklist 5S harian', 'Template checklist berversi (Daily Operations)', 'event', 'build', 'Coverage (checklist terkirim) dan pass rate (item lulus) dilaporkan terpisah.', 'X,D', '—']
      ],
      gap: 'Template checklist dan jadwal ekspektasi dari roster perlu dibangun di backend.'
    },
    process: {
      sheets: ['21 Bisnis Proses'],
      today: 'Register 44 bisnis proses/SOP: tahun, approved 100%/0%, status tercapai, prioritas per peran FO/Therapist/Attendant/SPV.',
      formula: '% bisnis proses approved = SOP approved ÷ total SOP',
      target: '100% approved',
      rows: [
        ['Dokumen bisnis proses', 'Register SOP + alur persetujuan', 'event', 'build', 'Backend hanya punya master jenis dokumen. Approval dokumen dibedakan dari kepatuhan eksekusi SOP.', 'K', '/api/documenttype/*'],
        ['Peran terkait', 'Field departemen pemilik', 'event', 'build', 'SOP tertaut ke checklist / tugas peran terkait.', 'D', '—']
      ],
      gap: 'Register SOP berversi perlu dibangun.'
    }
  };
  A.singleEntry = MAP;

  const MODE = { auto: ['Otomatis', 'green'], event: ['Entri sekali per kejadian', 'blue'], master: ['Data induk', 'gray'] };
  const PLAN = { reuse: ['REUSE', 'green'], integrate: ['INTEGRATE', 'blue'], extend: ['EXTEND', 'gold'], build: ['BUILD', 'gray'], owner: ['Keputusan Owner', 'red'] };
  const PROOF = { K: 'Kode backend', P: 'UI POS existing', D: 'Demo', T: 'Teruji', X: 'Tidak ditemukan' };
  const proof = (b) => String(b).split(',').map((k) => H.badge(k + ' · ' + PROOF[k], k === 'X' ? 'red' : k === 'D' ? 'gold' : 'gray')).join(' ');
  const defOf = (id) => (A.definitions || []).find((d) => d.id === id);
  const block = (id) => {
    const m = MAP[id], d = defOf(id); if (!m) return '';
    return `<section class="se-block" data-se="${E(id)}"><h3>${E(d ? d.navLabel : id)}</h3>
      <div class="se-facts"><div><small>Spreadsheet sumber Looker</small><strong>${E(m.sheets.join(' · '))}</strong></div>
      <div><small>Cara isi sekarang</small><p>${E(m.today)}</p></div>
      <div><small>Rumus Looker</small><p>${E(m.formula)}</p></div>${m.target ? `<div><small>Target / kode ekspektasi</small><strong>${E(m.target)}</strong></div>` : ''}</div>
      <div class="table-wrap"><table class="se-table"><thead><tr><th>Data</th><th>Satu titik entri di HAWK OS</th><th>Cara</th><th>Rencana</th><th>Bukti existing</th></tr></thead><tbody>${m.rows.map((r) => `<tr><td>${E(r[0])}</td><td>${E(r[1])}<small>${E(r[4])}</small></td><td>${H.badge(MODE[r[2]][0], MODE[r[2]][1])}</td><td>${H.badge(PLAN[r[3]][0], PLAN[r[3]][1])}</td><td>${proof(r[5])}<small class="se-ep">${E(r[6])}</small></td></tr>`).join('')}</tbody></table></div>
      <p class="small"><strong>Sisa gap:</strong> ${E(m.gap)}</p></section>`;
  };
  const summary = () => {
    const ids = Object.keys(MAP), rows = ids.map((id) => MAP[id].rows).flat();
    const n = (k) => rows.filter((r) => r[2] === k).length;
    return `<div class="row wrap se-summary">${H.badge(ids.length + ' dashboard', 'gold')}${H.badge(n('auto') + ' data otomatis', 'green')}${H.badge(n('event') + ' entri per kejadian', 'blue')}${H.badge(n('master') + ' data induk', 'gray')}${H.badge('0 integrasi teruji', 'red')}</div>`;
  };
  H.actions['analytics-single-entry'] = (el) => {
    const id = el.dataset.id || H.ui.analyticsId || 'revenue', all = el.dataset.all === '1';
    const ids = all ? Object.keys(MAP) : [id];
    H.modal(all ? 'Satu sumber entri · 14 dashboard' : 'Satu sumber entri · ' + (defOf(id)?.navLabel || id),
      `<div class="stack se-modal">${H.badge('Simulasi · struktur saja, tanpa data asli', 'gold')}<p class="small">Ditelusuri dari spreadsheet sumber Looker "Operational Report New" (hanya baca). Kolom Rencana dan Bukti menunjukkan engine mana yang sudah ada di kode (K/P), mana yang masih demo (D) atau belum ditemukan (X). Ini rencana, bukan integrasi live: angka dashboard di preview masih simulasi.</p>${all ? summary() : ''}${ids.map(block).join('')}</div>`,
      `${all ? '' : `<button class="btn" data-act="analytics-single-entry" data-all="1" data-id="${E(id)}">Lihat semua 14</button>`}<button class="btn btn-primary" data-act="close-modal">Tutup</button>`);
  };
  const page = H.pages && H.pages.analytics;
  if (page && typeof page.actions === 'function') {
    const base = page.actions;
    page.actions = () => base() + `<button class="btn btn-sm" data-act="analytics-single-entry" data-id="${E(H.ui.analyticsId || 'revenue')}">${H.icon('link', 14)} Satu sumber entri</button>`;
  }

  /* Lengkapi form entri sesuai kolom sheet sumber (opsional agar catatan lama tetap valid). */
  const S = A.schemas || {};
  const has = (g, k) => S[g] && S[g].fields.some((f) => f.key === k);
  const addAfter = (g, afterKey, field) => { if (!S[g] || has(g, field.key)) return; const i = S[g].fields.findIndex((f) => f.key === afterKey); S[g].fields.splice(i < 0 ? S[g].fields.length : i + 1, 0, field); };
  if (S.maintenance) {
    const cat = S.maintenance.fields.find((f) => f.key === 'category');
    if (cat) ['Infrastruktur / Civil', 'Plumbing', 'Preventive'].forEach((o) => { if (!cat.options.includes(o)) cat.options.push(o); });
    addAfter('maintenance', 'category', { key: 'urgency', label: 'Urgensi respons', type: 'select', required: false, options: ['Rendah', 'Sedang', 'Tinggi', 'Darurat'] });
    addAfter('maintenance', 'respondedAt', { key: 'workStartAt', label: 'Mulai dikerjakan', type: 'datetime-local', required: false });
    addAfter('maintenance', 'state', { key: 'workedBy', label: 'Dikerjakan oleh (internal / vendor)', type: 'text', required: false });
  }
  if (S.complaints) {
    addAfter('complaints', 'category', { key: 'category7P', label: 'Kategori 7P', type: 'select', required: false, options: ['People', 'Product', 'Process', 'Place', 'Facility', 'Promotion', 'Price'] });
    addAfter('complaints', 'category7P', { key: 'employeeRef', label: 'Karyawan terkait (Employee ID demo)', type: 'text', required: false });
    addAfter('complaints', 'employeeRef', { key: 'visitRef', label: 'Referensi kunjungan POS (demo)', type: 'text', required: false });
  }
  if (S.capacity) {
    addAfter('capacity', 'roomMinutes', { key: 'roomRevenueCapacity', label: 'Target revenue room harian (demo, definisi sheet 05)', type: 'number', required: false, min: 0, step: 'any', unit: 'currency' });
    addAfter('capacity', 'therapistCount', { key: 'treatmentCount', label: 'Jumlah treatment (POS)', type: 'number', required: false, min: 0, step: 1 });
  }

  /* Kartu paritas Looker pada Capacity: treatment/terapis/hari dan utilitas room berbasis Rp. */
  const baseModel = A.model;
  A.model = (id) => {
    const m = baseModel(id);
    if (id !== 'capacity' || !m || m.accessDenied || !m.cards || m.cards.some((c) => c.key === 'treatments-per-therapist')) return m;
    const cap = A.records ? A.records('capacity') : [];
    const num = (x) => Number.isFinite(Number(x)) ? Number(x) : 0;
    const treatments = cap.reduce((s, r) => s + (r.values.treatmentCount !== undefined && r.values.treatmentCount !== '' ? num(r.values.treatmentCount) : num(r.values.therapistMinutes) / 60), 0);
    const shifts = cap.reduce((s, r) => s + num(r.values.therapistCount), 0);
    const val = shifts ? Math.round(treatments / shifts * 100) / 100 : null;
    m.cards.push({ key: 'treatments-per-therapist', label: 'Treatment / terapis / hari', value: val, unit: 'number', direction: 'higher', target: null, standardStatus: 'pending', note: 'DEMO SAJA, bukan KPI live. Paritas rumus Looker "Utility Terapis": treatment ÷ terapis hadir. Bila jumlah treatment kosong, demo memakai estimasi 60 menit per treatment. Live memakai durasi appointment dari /spa-home/dashboard/therapist-util.' });
    return m;
  };
  A.__single = true;
})();
