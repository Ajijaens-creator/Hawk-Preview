const menus = [
  ['Beranda','⌂'], ['Karyawan','♙'],
  ['Kehadiran','◷',['Approval Presensi','Jadwal Kerja','Presensi','Izin & Cuti','Kunjungan Klien']],
  ['Pelacakan Lokasi','⌖'], ['Rekrutmen','◇',['Profil','Manajemen Rekrutmen','Lowongan Pekerjaan','Kandidat']],
  ['Payroll','▣'], ['Keuangan','▤',['Kasbon','Reimburse']], ['Approval','✓'], ['Timeline','≋'],
  ['Klien','▧'], ['Laporan','▥'], ['Tugas','☷'], ['Pengaturan','⚙'], ['FAQ','?'], ['Kinerja & KPI','▥'], ['AmbideX & Race','◇'], ['Manpower Planning','◷'], ['9-Box Talent','◇'], ['People Budgeting','▤']
];

const settings = {
  'Perusahaan':['Perusahaan','Billing','Alur Bisnis','Approval','Penomoran Otomatis','Audit','Kalender'],
  'Payroll':['Payroll','Pemetaan Akun COA','Kasbon','Reimburse'],
  'Kehadiran':['Jadwal Kerja','Lembur','Validasi Aplikasi Presensi','Lokasi Kantor','Pelacakan Lokasi'],
  'Cuti':['Cuti Tahunan','Cuti Khusus','Sakit'],
  'Akun & Pengguna':['Pengguna','Peran','Grup Akses Data','Hak Akses Time Tracker','Profilku','Notifikasi'],
  'Layout & Template':['Template Notifikasi','Pengaturan Layout','Template Keterangan Cuti','Template Export'],
  'Integrasi':['Integrasi ERP'],
  'Tugas':['Pengaturan Task']
};

const reports = {
  'Payroll':['Ringkasan Gaji','Ringkasan Gaji per Organisasi','Ringkasan Gaji per Komponen','Ringkasan Gaji per Karyawan','Pembayaran Gaji','Payroll Tahun Berjalan (YTD)'],
  'PPH 21/26':['Referensi Data Pajak Pegawai Tetap','Bukti Potong Pajak Pegawai Tetap Tahunan','Bukti Potong Pajak Pegawai Lepas Tahunan','Pajak Bulanan Pegawai Tetap','Rekap Bukti Potong Bulanan','Rekap Bukti Potong Tahunan'],
  'BPJS':['BPJS Ketenagakerjaan','BPJS Kesehatan'],
  'Coretax':['Bukti Pemotongan Bulanan Pegawai Tetap (BPMP)','Bukti Pemotongan Final dan Tidak Final Selain Pegawai Tetap (BP21)','Bukti Pemotongan PPh Pasal 26 (BP26)','Bukti Pemotongan A1 (BPA1)','Bukti Pemotongan A2 (BPA2)']
};
