/* HAWK Operational · Peta "satu sumber entri" untuk 14 Dashboard Kinerja (Looker "Operational Report New").
   Hasil penelusuran read-only atas spreadsheet sumber Looker (folder Drive Operational, file 01–21) dan SER/Vegen.
   Hanya STRUKTUR (kolom, rumus, cara isi). Tidak ada angka, nama karyawan, atau nama tamu asli yang disalin.
   Tujuan: setiap angka dashboard punya SATU titik entri di HAWK OS (atau integrasi otomatis), tanpa spreadsheet.
   Juga melengkapi field form entri yang masih kurang (maintenance, komplain) — semua opsional, DATA DEMO / SIMULASI. */
(function () {
  'use strict';
  const H = window.OPX;
  if (!H || !H.analytics || H.analytics.__single) return;
  const A = H.analytics, E = (s) => H.escape(String(s == null ? '' : s));

  /* mode: auto = dihitung dari sistem lain (tanpa entri) · event = dicatat sekali per kejadian oleh tim · master = data induk sekali set
     status: done = sudah ada di build ini · build = field/rumus ditambahkan di build ini · backend = butuh integrasi backend · owner = butuh keputusan Owner */
  const MAP = {
    revenue: {
      sheets: ['01 Revenue (tab per outlet, harian)'],
      today: 'Supervisor/admin mengetik rekap harian dari laporan POS: revenue room, foot chair, salon, retail, jumlah invoice, tamu baru/lama. Target bulanan diketik di tab datahelper.',
      formula: 'Revenue Service = room + foot chair + salon · Avg sales = revenue ÷ jumlah invoice · % pencapaian = revenue ÷ target bulanan',
      target: 'Target per outlet per bulan (Budget)',
      rows: [
        ['Transaksi service & retail', 'POS existing (invoice lunas)', 'auto', 'done', 'Receptionist hanya memproses transaksi di POS; tidak ada rekap ulang.'],
        ['Target bulanan per outlet', 'Budget 7P / Finance (NV-15, NV-16)', 'master', 'backend', 'Target dibaca dari budget yang dikunci, bukan diketik di Operational.']
      ],
      gap: 'Integrasi baca invoice POS → Operational (endpoint POS belum tersedia; paritas POS masih menunggu login Owner).'
    },
    pnl: {
      sheets: ['02 PNL (GabunganPNL, PNLalloutlet, Eficiencyutility)'],
      today: 'Disalin bulanan dari laporan keuangan Finance per akun (income, HPP, laundry, payroll, listrik, iklan, maintenance, dst).',
      formula: 'Laba bersih = gross sales − total expenses · Efisiensi = expense ÷ revenue (status target 10%)',
      target: 'Target profit per outlet (Budget)',
      rows: [
        ['Pendapatan, biaya per akun, laba', 'Finance NV-47..52 (jurnal & laporan)', 'auto', 'backend', 'Operational hanya membaca; tidak ada entri angka keuangan.'],
        ['Komponen People', 'HRD payroll', 'auto', 'done', 'Ditampilkan sebagai % saja; nominal hanya untuk Manager HRD.']
      ],
      gap: 'Mapping akun GL → kategori 7P dashboard perlu kontrak data Finance.'
    },
    capacity: {
      sheets: ['05 Room Utility', '0.55 Room Utility', '08 Utility Terapis', '03 Absensi'],
      today: 'Tiga sheet terpisah diketik: revenue room harian vs kapasitas, rata-rata utility terapis harian, jumlah sakit/ijin harian.',
      formula: 'Utilitas room = revenue room ÷ kapasitas revenue room harian outlet (target 70%) · Utility terapis = treatment ÷ terapis hadir per hari (target 130/bulan) · Absensi = (sakit + ijin) ÷ hari-orang terjadwal (maks 3%)',
      target: 'Ope-Ope-Room 70% · Ope-Pro-Serv 130 · Ope-Pro-Abse ≤3%',
      rows: [
        ['Revenue per kategori room', 'POS (roomType pada invoice)', 'auto', 'done', 'Kategori: Single, Couple, Foot Massage, Salon, Beauty Room.'],
        ['Kapasitas room per outlet', 'Master ruang Operational (#op-rooms)', 'master', 'build', 'Ditetapkan sekali per outlet (jumlah room × slot × tarif) dan dipakai sebagai pembagi.'],
        ['Treatment per terapis', 'POS (terapis yang ditugaskan) + HRD presensi', 'auto', 'build', 'Kartu "Treatment / terapis / hari" ditambahkan; demo memakai estimasi 60 menit per treatment.'],
        ['Sakit / ijin', 'HRD presensi & jadwal (F2)', 'auto', 'done', 'Tidak ada lagi entri jumlah absen; dihitung dari jadwal + presensi.']
      ],
      gap: 'Looker memakai rasio Rp untuk room dan treatment/terapis, HAWK lama memakai menit. Sekarang keduanya ditampilkan; definisi resmi dikonfirmasi Owner.'
    },
    waste: {
      sheets: ['14 Waste', '15 Akurasi SO'],
      today: 'Total Rp waste BHP dan retail diketik per bulan; akurasi SO diketik sebagai persen dari file stock opname Inventory.',
      formula: '% Waste BHP = waste BHP ÷ revenue service · % Waste retail = waste retail ÷ revenue retail (batas 1%) · Akurasi SO = item cocok ÷ item dihitung (target 100%)',
      target: 'Waste ≤1% · Akurasi SO 100%',
      rows: [
        ['Waste per item', 'Form waste Operational (Attendant/Reception → Supervisor)', 'event', 'done', 'Dicatat sekali per kejadian: item, qty, alasan. Total Rp dihitung otomatis.'],
        ['Nilai satuan item', 'Harga rata-rata Gudang (NV-38..46)', 'auto', 'backend', 'Tidak lagi diketik; diambil dari master item Gudang.'],
        ['Stock opname', 'Form SO Gudang outlet (#op-warehouse / NV-44)', 'event', 'done', 'Qty sistem vs fisik per item; akurasi dihitung otomatis.'],
        ['Pembagi revenue', 'POS', 'auto', 'done', 'Sama dengan dashboard Revenue.']
      ],
      gap: 'Keputusan Owner: akurasi SO berbasis jumlah item cocok atau nilai Rp selisih.'
    },
    reviews: {
      sheets: ['06 Offline Feedback', '07 Online Review'],
      today: 'Offline: hitungan kartu feedback 5–1 bintang per hari diketik. Online: setiap review Google/Tripadvisor disalin manual satu per baris.',
      formula: 'Rata-rata bintang · % bintang 5 · jumlah feedback · feedback ÷ total tamu',
      target: null,
      rows: [
        ['Feedback offline', 'Form rating per kunjungan (tablet/QR saat checkout POS)', 'event', 'done', 'Tamu mengisi sendiri; terhubung ke visitRef. Tidak ada rekap harian.'],
        ['Review online', 'Google Business Profile API / impor Tripadvisor', 'auto', 'backend', 'Nama tamu tidak disimpan; sebutan nama terapis bisa ditautkan ke employeeRef.'],
        ['Total tamu', 'POS', 'auto', 'done', 'Untuk rasio feedback per tamu.']
      ],
      gap: 'Integrasi API review perlu persetujuan akun Google/Tripadvisor milik Owner.'
    },
    satisfaction: {
      sheets: ['12 Konversi Offline vs Online'],
      today: 'Disusun ulang manual setiap bulan dari sheet 06 dan 07. Pivot KPI menjumlahkan persen antar outlet (hasil >100%, keliru).',
      formula: '% Kepuasan = (bintang 5 + 4) ÷ total review · % Keluhan = (bintang 3 + 2 + 1) ÷ total review',
      target: null,
      rows: [
        ['Semua angka', 'Turunan dari feedback offline + review online', 'auto', 'done', 'Tidak ada entri. Rata-rata antar outlet dihitung tertimbang jumlah review.']
      ],
      gap: 'Tidak ada; perbaikan rumus pivot sudah otomatis di HAWK.'
    },
    retention: {
      sheets: ['11 Rebooking', '16 Guest 10 Years'],
      today: 'Jumlah tamu, tamu baru dan repeater diketik ulang harian (duplikat sheet 01); histori sejak 2015 diketik bulanan.',
      formula: '% Repeater = repeater ÷ total tamu (target 25%) · YoY per bulan',
      target: 'Repeater 25%',
      rows: [
        ['Tamu baru / repeater', 'POS + CRM (customerRef unik: no HP/email)', 'auto', 'done', 'Segment ditentukan sistem dari kunjungan pertama.'],
        ['Histori 2015–2025', 'Impor sekali (migrasi saldo awal)', 'master', 'backend', 'Setelah impor, perbandingan YoY otomatis.']
      ],
      gap: 'Deduplikasi customer di POS lama perlu dicek saat migrasi.'
    },
    complaints: {
      sheets: ['10 Keluhan 7P', '13 Komplin Minor'],
      today: 'Keluhan dicatat per baris dengan tipe 7P dan karyawan terkait; rekap bulanan <24 jam / >24 jam dan satu angka "waktu handle" diketik terpisah.',
      formula: 'Jumlah keluhan per 7P per outlet · % ditangani <24 jam · rata-rata jam penanganan',
      target: 'SLA offline <24 jam',
      rows: [
        ['Kasus komplain', 'Form komplain Operational (Reception/Hospitality → Supervisor)', 'event', 'done', 'Waktu diterima, respons dan selesai per kasus; % SLA dan jam penanganan dihitung otomatis.'],
        ['Kategori 7P', 'Field "Kategori 7P" pada form komplain', 'event', 'build', 'People, Product, Process, Place, Facility, Promotion, Price.'],
        ['Karyawan terkait & kunjungan', 'Field employeeRef (master HRD) + visitRef (POS)', 'event', 'build', 'Keluhan otomatis masuk ke catatan kinerja karyawan terkait.']
      ],
      gap: 'Keputusan Owner: SLA untuk keluhan online (Google/Tripadvisor/WhatsApp).'
    },
    tripadvisor: {
      sheets: ['09 Tripadvisor'],
      today: 'Snapshot mingguan (tanggal 7/14/21/28) peringkat dan rating per outlet diketik.',
      formula: 'KPI = rata-rata rating per bulan per outlet · peringkat terakhir',
      target: null,
      rows: [
        ['Snapshot rank & rating', 'Tugas mingguan Hospitality (#op-tasks) atau pengambilan otomatis', 'event', 'done', 'Schema HAWK sudah memuat rank, rating, jumlah review dan URL bukti.']
      ],
      gap: 'Opsional: ambil otomatis bila Tripadvisor menyediakan akses resmi.'
    },
    maintenance: {
      sheets: ['04 Maintenance (2025 & 2026)'],
      today: 'Satu baris per pekerjaan: tanggal & jam lapor, jam respon, urgensi, kategori, outlet, status, dikerjakan oleh.',
      formula: 'Response time = rata-rata (waktu respon − waktu lapor) · jumlah per kategori · % selesai',
      target: null,
      rows: [
        ['Tiket maintenance', 'Form maintenance Operational (Attendant/Security → Supervisor)', 'event', 'done', 'Waktu lapor, respons, selesai per tiket.'],
        ['Urgensi, dikerjakan oleh, mulai dikerjakan', 'Field baru pada form maintenance', 'event', 'build', 'Sama dengan kolom RESPON NEEDED, Dikerjakan oleh, Tgl Pengerjaan di sheet.'],
        ['Kategori lengkap', 'Pilihan kategori disamakan dengan sheet 2026', 'event', 'build', 'Ditambah Infrastruktur/Civil, Plumbing, Preventive.'],
        ['Aset terkait', 'Register Aset NV-53..56', 'master', 'backend', 'Ticket/asset reference menautkan ke aset.']
      ],
      gap: 'Tidak ada untuk entri; tautan aset menunggu backend.'
    },
    grading: {
      sheets: ['20 Grading FO'],
      today: 'Tracker 32 tahapan program (modul, SOP, evaluasi 3/6/12 bulan) dengan bobot, PIC dan status selesai/proses.',
      formula: 'Progress = bobot jika selesai, ½ bobot jika proses · total = Σ progress ÷ Σ bobot',
      target: '100% program',
      rows: [
        ['Tahapan program', 'Form grading (Hospitality Manager)', 'event', 'done', 'Update status tahapan; progress dihitung otomatis.'],
        ['Hasil grade per FO', 'Assessment kompetensi + HRD', 'event', 'backend', 'Grade C/B per karyawan disimpan di HRD sebagai riwayat.']
      ],
      gap: 'Aturan "proses = ½ bobot" perlu dikonfirmasi Owner.'
    },
    competency: {
      sheets: ['19 Kesiapan SDM (per outlet)'],
      today: 'Matrix 0/1 per karyawan: ±24 skill treatment terapis, 15 item system knowledge FO, 2 item basic attendant.',
      formula: 'Skor = item tercapai ÷ item dinilai per karyawan · kesiapan outlet = rata-rata skor per departemen',
      target: null,
      rows: [
        ['Assessment per karyawan', 'Form assessment (Assessor/Head/Hospitality)', 'event', 'done', 'achieved ÷ possible per instrumen.'],
        ['Daftar item per departemen', 'Master instrumen kompetensi', 'master', 'backend', 'Item treatment/FO/attendant disimpan sekali sebagai versi instrumen.'],
        ['Data karyawan', 'Master karyawan HRD', 'auto', 'done', 'Tidak ada ketik ulang nama/jabatan.']
      ],
      gap: 'Master item per departemen perlu disusun dari matrix yang ada.'
    },
    grooming: {
      sheets: ['18 Grooming', '17 Daily Ceklist 5S'],
      today: 'Per outlet per hari hanya 1/0 "sudah dicek / checklist terisi". Pola 0/1 kedua sheet identik (indikasi disalin).',
      formula: '% kepatuhan = hari dengan cek tersubmit ÷ hari operasional',
      target: '100% kepatuhan',
      rows: [
        ['Grooming per karyawan', 'Form grooming (Head/Supervisor saat briefing)', 'event', 'done', 'Hasil Sesuai / Perlu perbaikan per employeeRef; lebih rinci dari 1/0.'],
        ['Checklist 5S harian', 'Daily Operations checklist (#op-daily)', 'auto', 'done', 'Kepatuhan dihitung dari checklist yang ditandatangani Supervisor.']
      ],
      gap: 'Kartu kepatuhan 5S di dashboard dibaca dari checklist harian (rumus sama).'
    },
    process: {
      sheets: ['21 Bisnis Proses'],
      today: 'Register 44 bisnis proses/SOP: tahun, approved 100%/0%, status tercapai, prioritas per peran FO/Therapist/Attendant/SPV.',
      formula: '% bisnis proses approved = SOP approved ÷ total SOP',
      target: '100% approved',
      rows: [
        ['Dokumen bisnis proses', 'Register SOP + alur persetujuan', 'event', 'done', 'Status draft → review → approved; persentase otomatis.'],
        ['Peran terkait', 'Field departemen pemilik', 'event', 'done', 'SOP tampil di checklist / tugas peran terkait.']
      ],
      gap: 'Tidak ada.'
    }
  };
  A.singleEntry = MAP;

  const MODE = { auto: ['Otomatis', 'green'], event: ['Entri sekali per kejadian', 'blue'], master: ['Data induk', 'gray'] };
  const STAT = { done: ['Sudah ada', 'green'], build: ['Ditambah di build ini', 'gold'], backend: ['Butuh backend', 'gray'], owner: ['Keputusan Owner', 'red'] };
  const defOf = (id) => (A.definitions || []).find((d) => d.id === id);
  const block = (id) => {
    const m = MAP[id], d = defOf(id); if (!m) return '';
    return `<section class="se-block" data-se="${E(id)}"><h3>${E(d ? d.navLabel : id)}</h3>
      <div class="se-facts"><div><small>Spreadsheet sumber Looker</small><strong>${E(m.sheets.join(' · '))}</strong></div>
      <div><small>Cara isi sekarang</small><p>${E(m.today)}</p></div>
      <div><small>Rumus Looker</small><p>${E(m.formula)}</p></div>${m.target ? `<div><small>Target / kode ekspektasi</small><strong>${E(m.target)}</strong></div>` : ''}</div>
      <div class="table-wrap"><table class="se-table"><thead><tr><th>Data</th><th>Satu titik entri di HAWK OS</th><th>Cara</th><th>Status</th></tr></thead><tbody>${m.rows.map((r) => `<tr><td>${E(r[0])}</td><td>${E(r[1])}<small>${E(r[4])}</small></td><td>${H.badge(MODE[r[2]][0], MODE[r[2]][1])}</td><td>${H.badge(STAT[r[3]][0], STAT[r[3]][1])}</td></tr>`).join('')}</tbody></table></div>
      <p class="small"><strong>Sisa gap:</strong> ${E(m.gap)}</p></section>`;
  };
  const summary = () => {
    const ids = Object.keys(MAP), rows = ids.map((id) => MAP[id].rows).flat();
    const n = (k) => rows.filter((r) => r[2] === k).length;
    return `<div class="row wrap se-summary">${H.badge(ids.length + ' dashboard', 'gold')}${H.badge(n('auto') + ' data otomatis', 'green')}${H.badge(n('event') + ' entri per kejadian', 'blue')}${H.badge(n('master') + ' data induk', 'gray')}${H.badge('0 spreadsheet', 'green')}</div>`;
  };
  H.actions['analytics-single-entry'] = (el) => {
    const id = el.dataset.id || H.ui.analyticsId || 'revenue', all = el.dataset.all === '1';
    const ids = all ? Object.keys(MAP) : [id];
    H.modal(all ? 'Satu sumber entri · 14 dashboard' : 'Satu sumber entri · ' + (defOf(id)?.navLabel || id),
      `<div class="stack se-modal">${H.badge('Simulasi · struktur saja, tanpa data asli', 'gold')}<p class="small">Ditelusuri dari spreadsheet sumber Looker "Operational Report New" (hanya baca). Setiap angka dashboard berasal dari satu titik entri di HAWK OS atau integrasi otomatis; tidak ada spreadsheet terpisah.</p>${all ? summary() : ''}${ids.map(block).join('')}</div>`,
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
    addAfter('capacity', 'roomMinutes', { key: 'roomRevenueCapacity', label: 'Kapasitas revenue room harian (master)', type: 'number', required: false, min: 0, step: 'any', unit: 'currency' });
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
    m.cards.push({ key: 'treatments-per-therapist', label: 'Treatment / terapis / hari', value: val, unit: 'number', direction: 'higher', target: null, standardStatus: 'pending', note: 'Rumus Looker "Utility Terapis": treatment POS ÷ terapis hadir (HRD). Demo: bila jumlah treatment belum ada, estimasi 60 menit per treatment.' });
    return m;
  };
  A.__single = true;
})();
