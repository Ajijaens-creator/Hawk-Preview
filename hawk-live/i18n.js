/* HAWK i18n — tombol bahasa ID/EN di pojok kanan atas (standar terkunci, Aji 2026-11-14).
   Bahasa Indonesia = default. Pilihan disimpan di localStorage 'hawk.lang' (dipakai juga oleh iframe Demo Center).
   Cara kerja: layar tetap dirender dalam Bahasa Indonesia; saat EN aktif, lapisan ini menerjemahkan
   teks & atribut (aria-label, title, placeholder) yang ada di kamus EN di bawah, lalu memulihkan teks asli saat kembali ke ID.
   Menambah terjemahan = menambah baris di DICT (frasa persis) atau PATTERNS (pola). Teks yang belum ada di kamus tetap Indonesia.
   Elemen dengan atribut data-noi18n (dan semua isinya) tidak diterjemahkan. */
(function () {
  'use strict';
  const KEY = 'hawk.lang';
  const DICT = {
    /* shell */
    'Lewati ke konten': 'Skip to content', 'Navigasi portal': 'Portal navigation', 'HAWK ERP, pilih portal': 'HAWK ERP, choose portal',
    'v1.1 lima portal': 'v1.1 five portals', 'Role demo': 'Demo role', 'Akun demo': 'Demo account', '↺ Reset Demo Data': '↺ Reset Demo Data',
    'DATA DEMO / SIMULASI': 'DEMO DATA / SIMULATION', 'DEMO / SIMULASI': 'DEMO / SIMULATION', 'PROTOTIPE — DEMO / SIMULASI.': 'PROTOTYPE — DEMO / SIMULATION.',
    'Angka sintetis; tanpa akun, API, pesan, pembayaran, atau deployment sungguhan. Perubahan tersimpan di browser ini. Mode:': 'Synthetic figures; no real accounts, APIs, messages, payments or deployments. Changes are saved in this browser. Mode:',
    'Sandbox lokal': 'Local sandbox', 'Pilih portal HAWK': 'Choose a HAWK portal',
    'Setiap portal punya ruang kerja dan akses sesuai peran. Client Portal dan portal mobile Driver & Referral berada di dalam Sales.': 'Each portal has its own workspace and role-based access. Client Portal and the Driver & Referral mobile portal live inside Sales.',
    'Portal aktif': 'Active portal', 'Tutup': 'Close', 'Menu': 'Menu', 'Peta alur HAWK': 'HAWK flow map', 'Peta layar': 'Screen map', 'Peta layar F7-01': 'Screen map F7-01',
    'Demo integrasi': 'Integration demo', 'Bahasa': 'Language', 'Pilih bahasa': 'Choose language', 'DATA DEMO · R&D': 'DEMO DATA · R&D', 'DATA DEMO': 'DEMO DATA',
    'Modul resmi di HAWK ERP preview (rute terverifikasi):': 'Official module in HAWK ERP preview (verified route):', 'Peta Preview': 'Preview Map', 'untuk status semua layar.': 'for the status of every screen.',
    'Diarsipkan': 'Archived',
    /* portal picker */
    'Modul Finance lengkap HAWK: dashboard, AI capture, 3-way matching, hutang, GL, alokasi, budget 7P + Demo Center': 'Full HAWK Finance module: dashboard, AI capture, 3-way matching, payables, GL, allocation, 7P budget + Demo Center',
    'Operasional outlet, terapis, ruangan dan POS': 'Outlet operations, therapists, rooms and POS', 'Sales, reservasi dan kemitraan': 'Sales, reservations and partnerships',
    'HRD Operations, Human Growth, payroll dan kinerja orang': 'HRD Operations, Human Growth, payroll and people performance',
    /* sidebar: Finance */
    'Budget & referensi': 'Budget & references', 'Budget tahunan': 'Annual budget', 'Revisi & reforecast': 'Revision & reforecast', 'Referensi PO': 'PO reference',
    'Referensi stok': 'Stock reference', 'Referensi aset': 'Asset reference', 'Kapitalisasi': 'Capitalization', 'Budget 7P (arsip)': '7P Budget (archive)',
    'Purchasing & MRF (arsip)': 'Purchasing & MRF (archive)', 'Komisi & Rekonsiliasi (arsip)': 'Commission & Reconciliation (archive)', 'Arsip Finance': 'Finance archive',
    /* sidebar: Commercial / Sales */
    'Drill-down Executive Summary': 'Executive Summary drill-down', 'Kinerja Tim': 'Team Performance', 'Kinerja & KPI': 'Performance & KPI', 'Status Tim': 'Team Status',
    'Beranda Sales': 'Sales Home', 'Sales B2C & Reservasi': 'B2C Sales & Reservations',
    /* sidebar: HRD */
    'Beranda': 'Home', 'Karyawan': 'Employees', 'Impor Karyawan': 'Import Employees', 'Tambah Karyawan': 'Add Employee', 'Kehadiran': 'Attendance',
    'Approval Presensi': 'Attendance Approval', 'Jadwal Kerja': 'Work Schedule', 'Presensi': 'Check-in', 'Izin & Cuti': 'Leave & Permits',
    'Kunjungan Klien': 'Client Visits', 'Pelacakan Lokasi': 'Location Tracking', 'Rekrutmen': 'Recruitment', 'Profil · Karier': 'Profile · Career',
    'Manajemen Rekrutmen': 'Recruitment Management', 'Lowongan Pekerjaan': 'Job Openings', 'Kandidat': 'Candidates', 'Jadwal Interview': 'Interview Schedule',
    'Interview & Praktik': 'Interview & Practical', 'Keputusan & Penawaran': 'Decision & Offer', 'Kontrak & Dokumen': 'Contracts & Documents',
    'Penempatan & Akun': 'Placement & Account', 'Detail Lowongan': 'Opening Detail', 'Formulir Lamaran': 'Application Form', 'Komponen & Aturan': 'Components & Rules',
    'Komisi POS': 'POS Commission', 'Proses Payroll': 'Payroll Run', 'Slip & Pembayaran': 'Payslips & Payment', 'Keuangan': 'Finance', 'Kasbon': 'Cash Advance',
    'Reimburse': 'Reimbursement', 'Klien': 'Clients', 'Laporan': 'Reports', 'Tugas': 'Tasks', 'Detail Kartu': 'Card Detail', 'Pengaturan': 'Settings',
    'Struktur Organisasi': 'Organization Structure', 'Akun, Role & Akses': 'Accounts, Roles & Access', 'Pengaturan Perusahaan': 'Company Settings',
    'Pengaturan Sistem': 'System Settings', 'Audit Aktivitas': 'Activity Audit', 'Kelola Data Demo R&D': 'Manage R&D Demo Data', 'Kontrak KPI': 'KPI Contract',
    'Rencana Pengembangan': 'Development Plan', 'Pelatihan & Talent': 'Training & Talent', 'Pusat Laporan & Bukti': 'Reports & Evidence Center',
    'Kapasitas Outlet & Shift': 'Outlet & Shift Capacity', 'Beban Kerja Office': 'Office Workload', 'Data Layanan POS': 'POS Service Data',
    'Simulasi Kebutuhan': 'Demand Simulation', 'Handoff Rekrutmen': 'Recruitment Handoff', 'Rencana Anggaran': 'Budget Plan', 'Simulasi Rekrutmen': 'Recruitment Simulation',
    'Tren & Kurva S': 'Trends & S-Curve',
    /* Demo Experience Center / Test Lab */
    'Option 1 · Scenario Test Lab': 'Option 1 · Scenario Test Lab', 'Login role (DEMO):': 'Login role (DEMO):', '↺ Mulai ulang': '↺ Restart', 'Progres': 'Progress',
    'Peran': 'Role', 'Layar': 'Screen', 'Giliran ini': 'This turn', '‹ Sebelumnya': '‹ Previous', 'Berikutnya ›': 'Next ›', 'Aturan demo': 'Demo rules',
    'Perangkat': 'Device', 'Beranda role': 'Role home', 'Layar penuh': 'Full screen', 'Pilih skenario': 'Choose scenario',
    'Reset data demo dan mulai skenario dari awal': 'Reset demo data and start the scenario from the beginning', 'otomatis': 'automatic',
    '✓ Lanjutkan (langkah otomatis)': '✓ Continue (automatic step)', '✓ Jalankan langkah ini': '✓ Run this step', 'Persona & kinerja tim': 'Personas & team performance',
    'Persona tim': 'Team personas', 'Tabel data, dapat digulir': 'Data table, scrollable', 'KONTEKS DIVISI LAIN': 'OTHER DIVISION CONTEXT',
    /* label umum */
    'Status': 'Status', 'Aksi': 'Action', 'Tindakan': 'Action', 'Bagian': 'Section', 'Semua': 'All', 'Periode': 'Period', 'Periode:': 'Period:', 'Reset filter': 'Reset filter',
    'Jenis': 'Type', 'Tahap': 'Stage', 'Tahap saat ini': 'Current stage', 'Lanjutkan tahap': 'Advance stage', 'Semua outlet': 'All outlets', 'Sumber': 'Source',
    'Tanggal': 'Date', 'Tampilan': 'View', 'Tenggat': 'Due', 'Bukti': 'Evidence', 'Pagi': 'Morning', 'Sore': 'Afternoon', 'Malam': 'Night', 'Nama': 'Name',
    'Nilai': 'Value', 'Cakupan': 'Scope', 'Lowongan': 'Opening', 'Posisi': 'Position', 'Posisi terbuka': 'Open positions', 'Selesai': 'Done',
    'Filter laporan': 'Report filter', 'Cari': 'Search', 'Judul': 'Title', 'Lengkap': 'Complete', 'Belum dibuat': 'Not created', 'Divisi': 'Division',
    'Semua lokasi': 'All locations', 'Terlambat': 'Late', 'Kantor': 'Office', 'Lembur': 'Overtime', 'Aktif': 'Active', 'Nonaktif': 'Inactive', 'Komitmen': 'Commitment',
    'Keterangan': 'Notes', 'Catatan': 'Notes', 'Outlet / lokasi': 'Outlet / location', 'Disetujui': 'Approved', 'Ditolak': 'Rejected', 'Menunggu': 'Pending',
    'Kartu': 'Card', 'Di atas kapasitas': 'Over capacity', 'Realisasi': 'Actual', 'Sisa': 'Remaining', 'Pagu': 'Ceiling', 'Telepon': 'Phone', 'Metrik': 'Metric',
    'Tim': 'Team', 'Simpan': 'Save', 'Batal': 'Cancel', 'Masuk': 'In', 'Keluar': 'Out', 'Hadir': 'Present', 'Libur': 'Day off', 'Sakit': 'Sick',
    'Waktu (WITA)': 'Time (WITA)', 'Kanal': 'Channel', 'Prospek': 'Prospect', 'Lamaran': 'Application', 'Belum ada data': 'No data yet', 'Orang': 'People',
    'Bruto': 'Gross', 'Potongan': 'Deductions', 'Di bawah 70%': 'Below 70%', 'Ide': 'Idea', 'Tanpa PIC': 'No PIC', 'Terblokir': 'Blocked', 'Hambatan': 'Obstacle',
    'Hasil': 'Result', 'Bobot': 'Weight', 'Tahun': 'Year', 'Bulan': 'Month', 'Belum tersedia': 'Not available yet', 'Tidak diketahui': 'Unknown', 'Alasan': 'Reason',
    'SIMULASI': 'SIMULATION', 'Simulasi': 'Simulation', 'Grup': 'Group', 'Aktual': 'Actual', 'Rasio': 'Ratio', 'Semua PIC': 'All PICs', 'Konten': 'Content',
    'Prioritas': 'Priority', 'Tinggi': 'High', 'Sedang': 'Medium', 'Rendah': 'Low', 'Koreksi presensi': 'Attendance correction', 'Cuti Tahunan': 'Annual Leave',
    'Semua shift': 'All shifts', 'Perlu klarifikasi': 'Needs clarification', 'Keputusan': 'Decision', 'Formasi': 'Headcount slot', 'Biaya': 'Cost', 'Versi': 'Version',
    'Ledger saldo': 'Balance ledger', 'Nominal (Rp)': 'Amount (Rp)', 'Nominal': 'Amount', 'Arsip slip Oktober': 'October payslip archive', 'Target': 'Target',
    'Headcount aktif': 'Active headcount', 'Grup Spa (konsolidasi)': 'Spa Group (consolidated)', 'Kantor pusat': 'Head office', 'Pos 7P': '7P line',
    'Revenue dibayar': 'Paid revenue', 'Komisi valid': 'Valid commission', 'Komisi': 'Commission', 'Tidak ada data untuk filter ini.': 'No data for this filter.',
    'Filter aktif:': 'Active filter:', 'Filter Human Growth': 'Human Growth filter', 'Supervisor Outlet': 'Outlet Supervisor', 'Staf Accounting': 'Accounting Staff',
    'Staf Operations': 'Operations Staff', 'Staf Finance': 'Finance Staff', 'Staf Production': 'Production Staff', 'Koordinator Rekrutmen': 'Recruitment Coordinator',
    'Foto & Video': 'Photo & Video', 'Ya': 'Yes', 'Tidak': 'No', 'Kembali': 'Back', 'Lihat': 'View', 'Detail': 'Detail', 'Ubah': 'Edit', 'Hapus': 'Delete',
    'Tambah': 'Add', 'Kirim': 'Send', 'Setujui': 'Approve', 'Tolak': 'Reject', 'Ajukan': 'Submit', 'Unduh': 'Download', 'Cetak': 'Print', 'Buka': 'Open',
    'Terapkan': 'Apply', 'Pilih': 'Choose', 'Lainnya': 'Other', 'Total': 'Total', 'Jumlah': 'Count', 'Rata-rata': 'Average', 'Ringkasan': 'Summary',
    'Riwayat': 'History', 'Dokumen': 'Documents', 'Lokasi': 'Location', 'Jam': 'Time', 'Durasi': 'Duration', 'Pemilik': 'Owner', 'Diajukan': 'Submitted',
    'Diproses': 'Processing', 'Dibayar': 'Paid', 'Belum': 'Not yet', 'Sudah': 'Done', 'Terjadwal': 'Scheduled', 'Berjalan': 'Running', 'Ditutup': 'Closed',
    'Dibuka': 'Open', 'Baru': 'New', 'Tinjau': 'Review', 'Wajib': 'Required', 'Opsional': 'Optional', 'Hari ini': 'Today', 'Minggu ini': 'This week',
    'Bulan ini': 'This month', 'Kemarin': 'Yesterday', 'Karyawan baru': 'New employee', 'Kontrak': 'Contract', 'Jabatan': 'Job title', 'Departemen': 'Department',
    'Atasan': 'Manager', 'Gaji pokok': 'Base salary', 'Tunjangan': 'Allowance', 'Insentif': 'Incentive', 'Pendapatan': 'Revenue', 'Anggaran': 'Budget',
    'Pengeluaran': 'Spending', 'Kebutuhan': 'Need', 'Penempatan': 'Placement', 'Pelatihan': 'Training', 'Kinerja': 'Performance', 'Pengembangan': 'Development',
    /* bulan */
    'Mei': 'May', 'Agu': 'Aug', 'Okt': 'Oct', 'Des': 'Dec', 'Januari': 'January', 'Februari': 'February', 'Maret': 'March', 'Juni': 'June', 'Juli': 'July',
    'Agustus': 'August', 'Oktober': 'October', 'Desember': 'December'
  };
  Object.assign(DICT, window.HAWK_I18N_EN || {});
  const MONTHS = { Januari: 'January', Februari: 'February', Maret: 'March', April: 'April', Mei: 'May', Juni: 'June', Juli: 'July', Agustus: 'August', September: 'September', Oktober: 'October', November: 'November', Desember: 'December' };
  const tr = (s) => DICT[s] !== undefined ? DICT[s] : null;
  const PATTERNS = [
    [/^Buka\/tutup (.+)$/, (m, a) => `Expand/collapse ${tr(a) || a}`],
    [/^Test Lab · (\d+) role · (\d+) skenario$/, (m, a, b) => `Test Lab · ${a} roles · ${b} scenarios`],
    [/^(\d+) skenario · (\d+) role tim$/, (m, a, b) => `${a} scenarios · ${b} team roles`],
    [/^LANGKAH (\d+) DARI (\d+)( · KONTEKS DIVISI LAIN)?$/, (m, a, b, c) => `STEP ${a} OF ${b}${c ? ' · OTHER DIVISION CONTEXT' : ''}`],
    [/^(\d+)\/(\d+) langkah$/, (m, a, b) => `${a}/${b} steps`],
    [/^Demo Experience Center (.+)$/, (m, a) => `Demo Experience Center ${a}`],
    [/^Demo Experience (Finance|Operational|Commercial|Sales|HRD)$/, (m, a) => `${a} Demo Experience`],
    [/^Buka layar sebagai (.+)$/, (m, a) => `Open screen as ${a}`],
    [/^(.+) — aplikasi HAWK \(DEMO\)$/, (m, a) => `${a} — HAWK app (DEMO)`],
    [/^(.+) · otomatis$/, (m, a) => `${a} · automatic`],
    [/^Fase (\d+)$/, (m, a) => `Phase ${a}`],
    [/^Option 2 · Simulator (\d+) Layar$/, (m, a) => `Option 2 · ${a}-Screen Simulator`],
    [/^(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember) (\d{4})( \(ditutup\)| \(belum ditutup\)| \(provisional\))?$/, (m, a, b, c) => `${MONTHS[a]} ${b}${c === ' (ditutup)' ? ' (closed)' : c === ' (belum ditutup)' ? ' (not closed)' : c || ''}`],
    [/^(\d+) mnt$/, (m, a) => `${a} min`],
    [/^(\d+) jam$/, (m, a) => `${a} hrs`],
    [/^Minggu (\d+) · (.+)$/, (m, a, b) => `Week ${a} · ${b}`],
    [/^Pindahkan (\S+) ke$/, (m, a) => `Move ${a} to`],
    [/^Role baru (\S+)$/, (m, a) => `New role ${a}`],
    [/^Direktori · halaman (\d+) dari (\d+)$/, (m, a, b) => `Directory · page ${a} of ${b}`],
    [/^(.+) · halaman (\d+)\/(\d+)$/, (m, a, b, c) => `${tr(a) || a} · page ${b}/${c}`],
    [/^↑ (.+) vs bulan lalu$/, (m, a) => `↑ ${a} vs last month`],
    [/^↓ (.+) vs bulan lalu$/, (m, a) => `↓ ${a} vs last month`]
  ];
  /* gabungan "A · B · C": terjemahkan tiap bagian yang dikenal */
  const bySegments = (s) => {
    if (s.indexOf(' · ') < 0) return null;
    let hit = false;
    const out = s.split(' · ').map(seg => { const t = tr(seg) ?? patt(seg); if (t !== null && t !== seg) { hit = true; return t; } return seg; }).join(' · ');
    return hit ? out : null;
  };
  const patt = (s) => { for (const [re, fn] of PATTERNS) { const m = s.match(re); if (m) return fn(...m); } return null; };
  const translate = (raw) => {
    const s = raw.replace(/\s+/g, ' ').trim();
    if (!s) return null;
    let out = tr(s);
    if (out === null) out = patt(s);
    if (out === null) out = bySegments(s);
    if (out === null || out === s) return null;
    const lead = raw.match(/^\s*/)[0], tail = raw.match(/\s*$/)[0];
    return lead + out + tail;
  };

  let lang = 'id';
  try { lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'id'; } catch (e) { /* storage diblokir: default ID */ }
  const ATTRS = ['aria-label', 'title', 'placeholder'];
  const textMem = new WeakMap(); /* node -> {orig, en} */
  const attrMem = new WeakMap(); /* el -> {attr: {orig, en}} */
  const skip = (el) => !el || el.closest('script,style,textarea,[data-noi18n]');

  function doText(n) {
    const rec = textMem.get(n);
    if (rec && n.nodeValue === rec.en) return; /* sudah diterjemahkan */
    const orig = n.nodeValue, en = translate(orig);
    if (en === null) { textMem.delete(n); return; }
    textMem.set(n, { orig, en }); n.nodeValue = en;
  }
  function doAttrs(el) {
    let mem = attrMem.get(el);
    for (const a of ATTRS) {
      const v = el.getAttribute(a); if (v == null) continue;
      if (mem && mem[a] && mem[a].en === v) continue;
      const en = translate(v); if (en === null) continue;
      if (!mem) { mem = {}; attrMem.set(el, mem); }
      mem[a] = { orig: v, en }; el.setAttribute(a, en);
    }
  }
  function walk(root) {
    if (lang !== 'en' || !root) return;
    if (root.nodeType === 3) { if (!skip(root.parentElement)) doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (skip(root)) return; doAttrs(root); }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: (n) => n.nodeType === 1 && n.matches('script,style,textarea,[data-noi18n]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function restore(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n; while ((n = w.nextNode())) {
      if (n.nodeType === 3) { const r = textMem.get(n); if (r && n.nodeValue === r.en) n.nodeValue = r.orig; textMem.delete(n); }
      else { const m = attrMem.get(n); if (m) { for (const a in m) if (n.getAttribute(a) === m[a].en) n.setAttribute(a, m[a].orig); attrMem.delete(n); } }
    }
  }
  let obs = null, titleOrig = null;
  const observe = () => {
    if (obs) return;
    obs = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'childList') m.addedNodes.forEach(walk);
        else if (m.type === 'characterData') walk(m.target);
        else if (m.type === 'attributes') { if (!skip(m.target)) doAttrs(m.target); }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };
  function paintToggle() {
    document.querySelectorAll('[data-lang]').forEach(b => { const on = b.dataset.lang === lang; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  }
  function apply(next, persist) {
    lang = next === 'en' ? 'en' : 'id';
    if (persist) { try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ } }
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    if (lang === 'en') {
      if (titleOrig === null) titleOrig = document.title;
      document.title = translate(document.title) || document.title;
      walk(document.body); observe();
    } else {
      if (obs) { obs.disconnect(); obs = null; }
      restore(document.body);
      if (titleOrig !== null) { document.title = titleOrig; titleOrig = null; }
    }
    paintToggle();
    window.dispatchEvent(new CustomEvent('hawk:lang', { detail: { lang } }));
  }
  function mountToggle() {
    const bar = document.querySelector('.topbar'); if (!bar || bar.querySelector('.lang-tog')) return;
    const box = document.createElement('div');
    box.className = 'lang-tog'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Bahasa'); box.dataset.noi18n = '';
    box.innerHTML = '<button type="button" data-lang="id" title="Bahasa Indonesia">ID</button><button type="button" data-lang="en" title="English">EN</button>';
    box.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (b && b.dataset.lang !== lang) apply(b.dataset.lang, true); });
    const chip = bar.querySelector('.role-chip');
    bar.insertBefore(box, chip || null);
    paintToggle();
  }
  /* iframe Demo Center & tab lain ikut berganti */
  window.addEventListener('storage', (e) => { if (e.key === KEY) apply(e.newValue === 'en' ? 'en' : 'id', false); });
  const boot = () => { mountToggle(); apply(lang, false); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.HAWK_I18N = { get lang() { return lang; }, set: (l) => apply(l, true), translate, DICT, PATTERNS };
})();
