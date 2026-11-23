/* JAENS ERP · Portal HRD & Human Growth · model F1 (Fondasi dan Beranda) — DATA DEMO / SIMULASI.
   Satu sumber untuk organisasi, 158 profil dummy, penempatan efektif, peran & cakupan, pengaturan,
   audit dan penghapusan dummy. Deterministik (tanpa Math.random). Tanpa jaringan, akun, atau API. */
const HR = (() => {
  const TODAY = '2026-11-13';
  const EXT = {}; /* kait fase berikutnya (F2: attStatus, update) */
  const SCHEMA = 4;

  /* ---------- organisasi (dinamis: semua layar membaca daftar ini, tidak ada cabang yang di-hardcode di UI) ---------- */
  const COMPANY = { id: 'CO-JAENS', name: 'JAENS Enterprises' };
  /* unit bisnis di bawah perusahaan (unit usaha tambahan menunggu keputusan F1) */
  const ENTITIES = [
    { id: 'ENT-SPA', name: 'JAENS Spa', kind: 'Unit bisnis spa · 4 outlet' },
    { id: 'ENT-HQ', name: 'Office / HQ', kind: 'Kantor pusat · divisi pendukung' }
  ];
  /* id outlet sama dengan SER (ser-data.js) supaya POS, jadwal dan KPI memakai outlet yang sama */
  const OUTLETS = [
    { id: 'OUT-UBD', entity: 'ENT-SPA', name: 'Spa Ubud', ser: 'Jaens Spa Center', code: 'UBD' },
    { id: 'OUT-SHT', entity: 'ENT-SPA', name: 'Spa Shanti', ser: 'Jaens Spa Shanti', code: 'SHT' },
    { id: 'OUT-TRL', entity: 'ENT-SPA', name: 'Spa Triloka', ser: 'Jaens Spa Triloka', code: 'TRL' },
    { id: 'OUT-BSM', entity: 'ENT-SPA', name: 'Spa Bisma', ser: 'Jaens Spa Bisma', code: 'BSM' }
  ];
  const HQ = { id: 'LOC-HQ', entity: 'ENT-HQ', name: 'Office Ubud', code: 'HQ' };
  const DIVISIONS = [
    { id: 'DIV-OPS', name: 'Operations', note: 'Semua outlet spa berada di bawah Divisi Operational' },
    { id: 'DIV-FA', name: 'Finance & Accounting' },
    { id: 'DIV-MKT', name: 'Marketing' },
    { id: 'DIV-HRD', name: 'HRD & Human Growth' },
    { id: 'DIV-PRD', name: 'Production' },
    { id: 'DIV-PC', name: 'PC', note: 'Tercatat tanpa tambahan headcount · cakupan menunggu keputusan F1/F7' },
    { id: 'DIV-COM', name: 'Commercial', note: 'Tercatat tanpa tambahan headcount' }
  ];
  /* level: staff | supervisor | manager · thp = take-home pay contoh (bukan biaya tenaga kerja) */
  const POSITIONS = [
    ['POS-THR', 'Therapist', 'DIV-OPS', 'staff', 3000000], ['POS-RCP', 'Receptionist', 'DIV-OPS', 'staff', 3200000],
    ['POS-SPV', 'Supervisor Outlet', 'DIV-OPS', 'supervisor', 5200000], ['POS-OM', 'Operational Manager', 'DIV-OPS', 'manager', 7200000],
    ['POS-AOM', 'Assistant Operational Manager', 'DIV-OPS', 'manager', 6400000], ['POS-OPS', 'Staf Operations', 'DIV-OPS', 'staff', 3600000],
    ['POS-FM', 'Finance Manager', 'DIV-FA', 'manager', 7000000], ['POS-ACC', 'Staf Accounting', 'DIV-FA', 'staff', 3800000], ['POS-FIN', 'Staf Finance', 'DIV-FA', 'staff', 3600000],
    ['POS-MM', 'Marketing Manager', 'DIV-MKT', 'manager', 7000000], ['POS-CRT', 'Content Creator', 'DIV-MKT', 'staff', 3600000], ['POS-SOC', 'Social Media Admin', 'DIV-MKT', 'staff', 3400000], ['POS-FV', 'Foto & Video', 'DIV-MKT', 'staff', 3600000],
    ['POS-HRM', 'Manager HRD', 'DIV-HRD', 'manager', 7100000], ['POS-HRO', 'Admin HRD', 'DIV-HRD', 'staff', 3800000], ['POS-HGL', 'Human Growth Lead', 'DIV-HRD', 'supervisor', 5400000], ['POS-REC', 'Koordinator Rekrutmen', 'DIV-HRD', 'staff', 3700000],
    ['POS-PDM', 'Production Lead', 'DIV-PRD', 'supervisor', 5000000], ['POS-PDS', 'Staf Production', 'DIV-PRD', 'staff', 3200000]
  ].map(([id, name, division, level, thp]) => ({ id, name, division, level, thp }));
  const pos = (id) => POSITIONS.find(p => p.id === id);

  /* ---------- nama sintetis (deterministik) ---------- */
  const FIRST = ['Putu', 'Kadek', 'Komang', 'Ketut', 'Wayan', 'Made', 'Nyoman', 'Gede', 'Luh', 'Ayu'];
  const GIVEN = ['Ari', 'Sari', 'Dewi', 'Wulan', 'Indra', 'Yasa', 'Mahendra', 'Ratna', 'Sinta', 'Lestari', 'Dian', 'Rai', 'Suastini', 'Adnyani', 'Pradnya', 'Widya', 'Purnami', 'Juliani', 'Astiti', 'Arsana', 'Budiasa', 'Candra', 'Darmayanti', 'Eka'];
  /* akun demo yang sudah dipakai di HAWK (lihat memori project) dipertahankan namanya */
  const NAMED = {
    'POS-OM': ['Eni Restini'], 'POS-AOM': ['Tika'], 'POS-SPV': ['Mila', 'Tina', 'Dewik', 'Wahyudi'], 'POS-FM': ['Asri'], 'POS-HRM': ['Made Gunarsa'], 'POS-HRO': ['Ayu'], 'POS-REC': ['Harja']
  };

  /* roster: 4 spa × (25 Therapist + 5 Receptionist) + Office 12 F&A, 9 Marketing, 4 HRD, 5 Production, 8 Operations = 158 */
  const OFFICE = [
    ['DIV-FA', [['POS-FM', 1], ['POS-ACC', 6], ['POS-FIN', 5]]],
    ['DIV-MKT', [['POS-MM', 1], ['POS-CRT', 3], ['POS-SOC', 3], ['POS-FV', 2]]],
    ['DIV-HRD', [['POS-HRM', 1], ['POS-HRO', 1], ['POS-HGL', 1], ['POS-REC', 1]]],
    ['DIV-PRD', [['POS-PDM', 1], ['POS-PDS', 4]]],
    ['DIV-OPS', [['POS-OM', 1], ['POS-AOM', 1], ['POS-SPV', 4], ['POS-OPS', 2]]]
  ];
  const EXPECTED = { total: 158, perOutlet: { Therapist: 25, Receptionist: 5 }, office: { 'DIV-FA': 12, 'DIV-MKT': 9, 'DIV-HRD': 4, 'DIV-PRD': 5, 'DIV-OPS': 8, 'DIV-PC': 0, 'DIV-COM': 0 } };

  function roster() {
    const people = [], placements = [];
    let n = 0, nameIx = 0;
    const used = new Set();
    const nextName = () => {
      for (;;) {
        const f = FIRST[nameIx % FIRST.length], g = GIVEN[Math.floor(nameIx / FIRST.length) % GIVEN.length], g2 = Math.floor(nameIx / (FIRST.length * GIVEN.length));
        nameIx += 7; /* lompat agar urutan tidak monoton */
        const name = `${f} ${g}${g2 ? ' ' + 'ABCDEFG'[g2 - 1] : ''}`;
        if (!used.has(name)) { used.add(name); return name; }
      }
    };
    const add = (position, division, location, named) => {
      n++;
      const id = 'EMP-' + String(n).padStart(4, '0');
      const p = pos(position);
      const year = 2019 + (n * 5) % 7, month = 1 + (n * 3) % 12;
      const joined = `${year}-${String(month).padStart(2, '0')}-${String(1 + (n * 11) % 27).padStart(2, '0')}`;
      const contract = year >= 2026 ? 'Probation' : n % 4 === 0 ? 'PKWT' : 'PKWTT';
      const thp = p.thp + ((n * 37) % 9) * 50000;
      const name = named || nextName();
      const outletStaff = location.startsWith('OUT-');
      const RELIGION = ['Hindu', 'Hindu', 'Hindu', 'Hindu', 'Islam', 'Kristen', 'Hindu', 'Katolik', 'Hindu', 'Buddha'];
      const EDU = ['SMA/SMK', 'SMA/SMK', 'D3', 'S1', 'SMA/SMK', 'D1 Spa', 'S1', 'SMA/SMK'];
      const birth = 1984 + (n * 13) % 20;
      people.push({ id, birth, religion: RELIGION[n % 10], education: p.level === 'manager' ? 'S1' : EDU[n % 8], marital: (n * 7) % 3 === 0 ? 'Belum kawin' : 'Kawin', shift: outletStaff ? (n % 2 ? 'Sore' : 'Pagi') : 'Kantor', name, gender: /Wahyudi|Gede|Wayan|Mahendra|Indra|Yasa|Arsana|Budiasa|Made Gunarsa/.test(name) && !/Luh|Ayu|Dewi|Sari/.test(name) ? 'L' : 'P', position, division, level: p.level, joined, contract, status: 'Aktif', thp, phone: '08' + String(1200000000 + n * 7919).slice(0, 10), demo: true, account: true });
      placements.push({ id: 'PLC-' + String(n).padStart(4, '0'), emp: id, entity: outletStaff ? 'ENT-SPA' : 'ENT-HQ', division, location, position, from: joined, to: null, demo: true });
      return id;
    };
    for (const o of OUTLETS) {
      for (let i = 0; i < 25; i++) add('POS-THR', 'DIV-OPS', o.id);
      for (let i = 0; i < 5; i++) add('POS-RCP', 'DIV-OPS', o.id);
    }
    for (const [division, list] of OFFICE) {
      for (const [position, count] of list) {
        for (let i = 0; i < count; i++) {
          const named = NAMED[position]?.[i];
          /* supervisor outlet dihitung di headcount Operations (Office); outlet yang dipimpin dicatat di 'leads' */
          const id = add(position, division, HQ.id, named);
          if (position === 'POS-SPV') placements.find(x => x.emp === id).leads = OUTLETS[i].id;
        }
      }
    }
    /* contoh histori penempatan: dua therapist bertukar outlet efektif 1 Okt 2026 (jumlah per outlet tetap 25) */
    const swap = (a, b) => {
      const pa = placements.find(p => p.emp === a && !p.to), pb = placements.find(p => p.emp === b && !p.to);
      const [la, lb] = [pa.location, pb.location];
      for (const [cur, own, other] of [[pa, la, lb], [pb, lb, la]]) {
        placements.push({ ...cur, id: cur.id + '-A', location: own, to: '2026-09-30' });
        cur.location = other; cur.from = '2026-10-01'; cur.reason = 'Mutasi outlet (penyeimbangan kapasitas)';
      }
    };
    const ubudThr = placements.find(p => p.location === 'OUT-UBD' && p.position === 'POS-THR' && p.emp === 'EMP-0007');
    const santiThr = placements.find(p => p.location === 'OUT-SHT' && p.position === 'POS-THR' && p.emp === 'EMP-0037');
    swap(ubudThr.emp, santiThr.emp);
    /* akun yang dipakai role demo */
    const findEmp = (positionId, location) => placements.find(p => p.position === positionId && !p.to && (!location || p.location === location)).emp;
    return { people, placements, roleEmp: {
      hrd: findEmp('POS-HRM'), 'hrd-ops': findEmp('POS-HRO'), 'hg-lead': findEmp('POS-HGL'), 'ops-manager': findEmp('POS-OM'),
      'outlet-spv': placements.find(p => p.position === 'POS-SPV' && p.leads === 'OUT-UBD').emp, therapist: findEmp('POS-THR', 'OUT-UBD'), 'finance-manager': findEmp('POS-FM')
    } };
  }

  /* ---------- peran, izin dan cakupan ---------- */
  /* scope: all | division:<id> | outlet:<id> | self · payroll: detail | aggregate | none */
  const ROLE_DEFS = {
    owner: { label: 'Owner', scope: 'all', payroll: 'aggregate', perms: ['dashboard', 'org', 'people', 'settings.view', 'access.view', 'audit.view', 'dummy.view', 'payroll.view', 'report.view'] },
    hrd: { label: 'Manager HRD', scope: 'all', payroll: 'detail', perms: ['dashboard', 'org', 'people', 'settings.view', 'settings.edit', 'settings.payroll', 'access.view', 'access.edit', 'audit.view', 'dummy.view', 'dummy.delete', 'payroll.view', 'report.view'] },
    'hrd-ops': { label: 'Staf HRD', scope: 'all', payroll: 'none', perms: ['dashboard', 'org', 'people', 'settings.view', 'access.view', 'audit.view', 'dummy.view'] },
    'hg-lead': { label: 'Human Growth Lead', scope: 'all', payroll: 'none', perms: ['dashboard', 'org', 'people', 'settings.view'] },
    'ops-manager': { label: 'Operational Manager', scope: 'division:DIV-OPS', payroll: 'none', perms: ['dashboard', 'org', 'people'] },
    'outlet-spv': { label: 'Supervisor Spa Ubud', scope: 'outlet:OUT-UBD', payroll: 'none', perms: ['dashboard', 'people'] },
    therapist: { label: 'Therapist · ESS', scope: 'self', payroll: 'none', perms: ['ess'] },
    'finance-manager': { label: 'Finance Manager', scope: 'none', payroll: 'aggregate', perms: [] }
  };
  const PERM_LABEL = {
    dashboard: 'Beranda HRD', org: 'Organisasi & penempatan', people: 'Data orang sesuai cakupan', 'settings.view': 'Lihat pengaturan', 'settings.edit': 'Ubah pengaturan',
    'settings.payroll': 'Pengaturan payroll, layout slip & template export', 'payroll.view': 'Payroll', 'report.view': 'Laporan payroll/PPH/BPJS/Coretax',
    'access.view': 'Lihat peran & akses', 'access.edit': 'Ubah peran akun', 'audit.view': 'Audit log', 'dummy.view': 'Rekonsiliasi dummy', 'dummy.delete': 'Hapus dataset dummy', ess: 'Self service (ESS) data sendiri'
  };
  const roleDef = (role) => ROLE_DEFS[role] || { label: role, scope: 'none', payroll: 'none', perms: [] };
  const can = (role, perm) => roleDef(role).perms.includes(perm);

  /* ---------- pengaturan F1 ---------- */
  const SETTINGS = () => ({
    company: { legalName: 'JAENS Enterprises (nama legal menunggu data resmi)', npwp: 'Menunggu data resmi', address: 'Ubud, Gianyar, Bali', workweek: '6 hari kerja · shift outlet 2 sesi', fiscalStart: 'Januari', timezone: 'Asia/Makassar (WITA)' },
    calendar: [
      { date: '2026-12-24', name: 'Cuti bersama Natal', type: 'Cuti bersama' }, { date: '2026-12-25', name: 'Hari Raya Natal', type: 'Libur nasional' },
      { date: '2027-01-01', name: 'Tahun Baru Masehi', type: 'Libur nasional' }, { date: '2027-03-08', name: 'Hari Suci Nyepi (contoh)', type: 'Libur nasional' }
    ].map(x => ({ ...x, demo: true })),
    approval: [
      { id: 'APR-LEAVE', name: 'Izin & Cuti', chain: ['Supervisor Outlet / atasan langsung', 'Manager HRD'], sla: 2 },
      { id: 'APR-ATT', name: 'Koreksi presensi', chain: ['Supervisor Outlet / atasan langsung'], sla: 1 },
      { id: 'APR-SHIFT', name: 'Perubahan shift', chain: ['Supervisor Outlet', 'Assistant Operational Manager'], sla: 1 },
      { id: 'APR-HIRE', name: 'Permintaan tenaga kerja', chain: ['Operational Manager / Manager divisi', 'Manager HRD', 'Owner'], sla: 3 },
      { id: 'APR-PLACE', name: 'Penempatan & mutasi', chain: ['Manager divisi', 'Manager HRD'], sla: 2 }
    ],
    numbering: [
      { id: 'NUM-EMP', name: 'Employee ID', pattern: 'EMP-{0000}', next: 159 },
      { id: 'NUM-VAC', name: 'Lowongan', pattern: 'VAC-{YY}{MM}-{000}', next: 3 },
      { id: 'NUM-LEAVE', name: 'Pengajuan cuti', pattern: 'LV-{OUT}-{YY}{MM}-{000}', next: 1 },
      { id: 'NUM-TASK', name: 'Task Planner', pattern: 'TASK-HR-{0000}', next: 1 }
    ],
    groups: [
      { id: 'GRP-OUT', name: 'Per outlet', rule: 'Data orang, jadwal dan POS mengikuti outlet penempatan efektif' },
      { id: 'GRP-DIV', name: 'Per divisi', rule: 'Manager divisi melihat orang di divisinya' },
      { id: 'GRP-PAY', name: 'Payroll detail', rule: 'Hanya Manager HRD. Finance dan Owner menerima agregat' },
      { id: 'GRP-HG', name: 'Asesmen & pengembangan', rule: 'Human Growth dan atasan langsung; hasil kepribadian sesuai izin' }
    ],
    notifications: [
      { id: 'NTF-APPROVAL', name: 'Antrean approval menunggu > SLA', on: true }, { id: 'NTF-CONTRACT', name: 'Kontrak berakhir dalam 30 hari', on: true },
      { id: 'NTF-PROBATION', name: 'Masa probation selesai', on: true }, { id: 'NTF-UTILITY', name: 'Utility outlet > 100% atau < 70%', on: true }
    ],
    templates: [
      ['TPL-PKWT', 'Kontrak PKWT', 'F4'], ['TPL-OFFER', 'Surat penawaran kerja', 'F4'], ['TPL-SP', 'Surat peringatan', 'F2'], ['TPL-ONB', 'Checklist onboarding HRD/HG', 'F4'], ['TPL-REF', 'Surat keterangan kerja', 'F2']
    ],
    integrations: [
      ['JAENS ERP Org & akun (Module B · NV-05–09)', 'TO VERIFY', 'Sumber struktur organisasi dan akun. Preview memakai fixture yang sama strukturnya.'],
      ['JAENS ERP POS / transaksi outlet', 'TO VERIFY', 'ID transaksi, outlet aktual, therapist dan refund untuk F5–F7.'],
      ['JAENS ERP Finance (jurnal & batch)', 'TO VERIFY', 'Finance menerima agregat payroll dan jurnal yang disetujui (F7).'],
      ['GajiHub (referensi menu & payroll)', 'TO VERIFY', 'Inventaris menu dari referensi. Jalur data belum ditentukan.'],
      ['Google Calendar / Meet', 'NEW INTEGRATION REQUIRED', 'Jadwal interview F4. Preview memakai simulasi.'],
      ['Penyimpanan dokumen & tanda tangan', 'NEW INTEGRATION REQUIRED', 'Kontrak dan dokumen pribadi F2/F4.'],
      ['BPJS / PPh / Coretax', 'NEW INTEGRATION REQUIRED', 'Laporan F7.'],
      ['Task Planner HRD', 'UI-ONLY SIMULATION', 'Kartu lintas modul F3.']
    ],
    faq: [
      ['Kenapa saya hanya melihat sebagian karyawan?', 'Data mengikuti cakupan penempatan efektif akun Anda: outlet, divisi, atau data sendiri.'],
      ['Siapa yang melihat nominal gaji?', 'Detail payroll khusus Manager HRD. Finance dan Owner melihat agregat yang disetujui.'],
      ['Apa beda take-home pay dan biaya tenaga kerja?', 'Take-home pay adalah yang diterima karyawan. Biaya tenaga kerja menambah iuran dan komponen perusahaan, dipakai di anggaran (F7).']
    ],
    taskRules: [
      ['Alur kolom', 'Ide → Issue → Workplan → Priority → Dikerjakan → Review → Selesai'],
      ['Kunci sumber', 'Satu temuan (modul + ID asal) hanya membuat satu kartu'],
      ['PIC dan pelaku', 'PIC bertanggung jawab; pelaku tercatat per aksi di histori'],
      ['Review', 'Kartu masuk Selesai hanya setelah bukti diperiksa reviewer']
    ]
  });

  /* ---------- ringkasan dashboard (fixture deterministik, label simulasi) ---------- */
  /* utility Okt 2026 = jam treatment selesai / jam kapasitas reguler (therapist × 8 jam × 26 hari) */
  const UTILITY = { 'OUT-UBD': 5512, 'OUT-SHT': 3432, 'OUT-TRL': 4368, 'OUT-BSM': 4056 };
  const VACANCIES = () => [
    { id: 'VAC-2611-001', title: 'Therapist', location: 'OUT-UBD', count: 3, status: 'Draf dari kapasitas', source: 'Utility Spa Ubud > 100%', demo: true },
    { id: 'VAC-2611-002', title: 'Receptionist', location: 'OUT-BSM', count: 1, status: 'Dibuka', source: 'Pengganti resign', demo: true }
  ];

  const SEED_AUDIT = (r) => [
    { id: 'AUD-0004', at: '2026-11-10 09:12', by: 'Made Gunarsa (Manager HRD)', object: 'Payroll', ref: 'SLIP-GRP-SPA', action: 'Komponen payroll', detail: 'Tunjangan transport grup slip Spa diperbarui', before: 'Rp 300.000', after: 'Rp 350.000', effective: '2026-11-26', sensitive: true, demo: true },
    { id: 'AUD-0003', at: '2026-11-12 16:40', by: 'Made Gunarsa (Manager HRD)', object: 'Akses', ref: 'EMP-0143', action: 'Perubahan akses', detail: 'Peran akun EMP-0143 diubah', before: 'Karyawan (ESS)', after: 'Staf HRD', demo: true },
    { id: 'AUD-0002', at: '2026-10-01 08:00', by: 'Made Gunarsa (Manager HRD)', object: 'Penempatan', ref: 'EMP-0037', action: 'Penempatan efektif', detail: 'Mutasi therapist Spa Shanti → Spa Ubud', before: 'Spa Shanti · Therapist', after: 'Spa Ubud · Therapist · efektif 2026-10-01', demo: true },
    { id: 'AUD-0001', at: '2026-10-01 08:00', by: 'Made Gunarsa (Manager HRD)', object: 'Penempatan', ref: 'EMP-0007', action: 'Penempatan efektif', detail: 'Mutasi therapist Spa Ubud → Spa Shanti', before: 'Spa Ubud · Therapist', after: 'Spa Shanti · Therapist · efektif 2026-10-01', demo: true }
  ];
  function fresh() {
    const r = roster();
    /* akun: semua karyawan punya login ESS; role demo ditautkan ke akun tertentu */
    const accounts = r.people.map(p => ({ emp: p.id, role: Object.entries(r.roleEmp).find(([, e]) => e === p.id)?.[0] || 'ess', demo: true }));
    const queue = [
      { id: 'APV-2611-001', emp: 'EMP-0012', type: 'Koreksi presensi', date: '2026-11-13', note: 'Jam masuk 09.15 → 09.00', status: 'Menunggu Persetujuan', demo: true },
      { id: 'APV-2611-002', emp: 'EMP-0041', type: 'Cuti Tahunan', date: '2026-11-13', note: 'Satu hari, 20 Nov 2026', status: 'Menunggu Persetujuan', demo: true },
      { id: 'APV-2611-003', emp: 'EMP-0098', type: 'Tukar shift', date: '2026-11-12', note: 'Pagi → Sore, 15 Nov 2026', status: 'Menunggu Persetujuan', demo: true },
      { id: 'APV-2611-004', emp: 'EMP-0066', type: 'Lembur', date: '2026-11-12', note: 'Dua jam, penutupan jadwal', status: 'Disetujui', demo: true }
    ];
    return { schema: SCHEMA, people: r.people, placements: r.placements, roleEmp: r.roleEmp, accounts, queue, settings: SETTINGS(), vacancies: VACANCIES(), audit: SEED_AUDIT(r), seq: 5, purged: false };
  }
  /* atasan langsung dari penempatan efektif (garis Spa: Therapist/Receptionist → Supervisor → AOM → OM) */
  function supervisorOf(hr, emp, date = TODAY) {
    const pl = placementOn(hr, emp, date) || upcomingOf(hr, emp, date); if (!pl) return null;
    const find = (fn) => hr.placements.find(x => x.from <= date && (!x.to || x.to >= date) && fn(x))?.emp || null;
    if (['POS-THR', 'POS-RCP'].includes(pl.position)) return find(x => x.position === 'POS-SPV' && x.leads === pl.location);
    if (pl.position === 'POS-SPV' || pl.position === 'POS-OPS') return find(x => x.position === 'POS-AOM');
    if (pl.position === 'POS-AOM') return find(x => x.position === 'POS-OM');
    if (pos(pl.position).level === 'manager') return null; /* melapor ke Owner */
    return find(x => x.division === pl.division && pos(x.position).level === 'manager') || find(x => x.division === pl.division && pos(x.position).level === 'supervisor');
  }
  const ensure = (state) => { if (!state.hr || state.hr.schema !== SCHEMA) state.hr = fresh(); return state.hr; };

  /* ---------- penempatan efektif & cakupan ---------- */
  const placementOn = (hr, emp, date = TODAY) => hr.placements.find(p => p.emp === emp && p.from <= date && (!p.to || p.to >= date));
  const locName = (id) => OUTLETS.find(o => o.id === id)?.name || (id === HQ.id ? HQ.name : id);
  /* penempatan pertama yang belum efektif (karyawan akan bergabung) */
  function upcomingOf(hr, emp, date = TODAY) { return hr.placements.filter(x => x.emp === emp && x.from > date).sort((a, b) => a.from.localeCompare(b.from))[0] || null; }
  function joiners(hr, role, date = TODAY) { return hr.people.filter(p => !placementOn(hr, p.id, date) && upcomingOf(hr, p.id, date) && inScope(hr, role, p.id, date)).map(p => ({ ...p, placement: upcomingOf(hr, p.id, date) })); }
  function inScope(hr, role, emp, date = TODAY) {
    const d = roleDef(role), pl = placementOn(hr, emp, date) || upcomingOf(hr, emp, date);
    if (!pl) return false;
    if (d.scope === 'all') return true;
    if (d.scope === 'self') return hr.roleEmp[role] === emp;
    const [kind, id] = d.scope.split(':');
    if (kind === 'division') return pl.division === id;
    if (kind === 'outlet') return pl.location === id || hr.roleEmp[role] === emp;
    return false;
  }
  /* filter pemilih cakupan + izin peran */
  function people(hr, role, f = {}, date = TODAY) {
    return hr.people.filter(p => {
      const pl = placementOn(hr, p.id, date);
      if (!pl || !inScope(hr, role, p.id, date)) return false;
      if (f.entity && f.entity !== 'all' && pl.entity !== f.entity) return false;
      if (f.division && f.division !== 'all' && pl.division !== f.division) return false;
      if (f.outlet && f.outlet !== 'all' && pl.location !== f.outlet) return false;
      return true;
    }).map(p => ({ ...p, placement: placementOn(hr, p.id, date) }));
  }
  /* rekonsiliasi terhadap roster brief (selalu seluruh dataset, bukan cakupan) */
  function reconcile(hr) {
    const active = hr.people.filter(p => placementOn(hr, p.id));
    const checks = [];
    checks.push(['Total profil aktif', EXPECTED.total, active.length]);
    for (const o of OUTLETS) {
      for (const [posName, want] of Object.entries(EXPECTED.perOutlet)) {
        const got = active.filter(p => placementOn(hr, p.id).location === o.id && pos(p.position).name === posName).length;
        checks.push([`${o.name} · ${posName}`, want, got]);
      }
    }
    for (const [div, want] of Object.entries(EXPECTED.office)) {
      const got = active.filter(p => { const pl = placementOn(hr, p.id); return pl.division === div && !['POS-THR', 'POS-RCP'].includes(pl.position); }).length;
      checks.push([`Office · ${DIVISIONS.find(d => d.id === div).name}`, want, got]);
    }
    const ids = new Set(active.map(p => p.id));
    checks.push(['Employee ID unik', active.length, ids.size]);
    checks.push(['Setiap profil punya tepat satu penempatan efektif hari ini', active.length, active.filter(p => hr.placements.filter(pl => pl.emp === p.id && pl.from <= TODAY && (!pl.to || pl.to >= TODAY)).length === 1).length]);
    return checks.map(([label, want, got]) => ({ label, want, got, ok: want === got }));
  }

  function summary(hr, role, f = {}) {
    const list = people(hr, role, f);
    const ids = new Set(list.map(p => p.id));
    /* presensi hari ini (simulasi deterministik per employee ID) */
    const att = { hadir: 0, terlambat: 0, cuti: 0, sakit: 0, libur: 0, belum: 0 };
    /* F2 (hrd-f2-model.js) mengganti simulasi ini dengan presensi yang sama seperti layar Presensi */
    const BUCKET = { Hadir: 'hadir', Terlambat: 'terlambat', Cuti: 'cuti', Izin: 'cuti', Sakit: 'sakit', Libur: 'libur', 'Belum Ada Status': 'belum' };
    list.forEach(p => { if (EXT.attStatus) { att[BUCKET[EXT.attStatus(hr, p.id, TODAY)] || 'belum']++; return; } const k = Number(p.id.slice(4)) % 20; att[k < 13 ? 'hadir' : k < 15 ? 'terlambat' : k === 15 ? 'cuti' : k === 16 ? 'sakit' : k < 19 ? 'libur' : 'belum']++; });
    const outlets = OUTLETS.filter(o => list.some(p => p.placement.location === o.id)).map(o => {
      const thr = hr.people.filter(p => placementOn(hr, p.id)?.location === o.id && p.position === 'POS-THR').length;
      const cap = thr * 8 * 26, done = UTILITY[o.id];
      return { ...o, therapists: thr, cap, done, utility: cap ? done / cap : null };
    });
    const vac = hr.vacancies.filter(v => role && (roleDef(role).scope === 'all' || list.some(p => p.placement.location === v.location)));
    const contractsEnding = list.filter(p => p.contract !== 'PKWTT').length;
    return { count: list.length, att, outlets, vac, contractsEnding, list, ids };
  }

  /* ---------- aksi ---------- */
  const audit = (hr, by, action, detail, extra = {}) => { hr.audit.unshift({ id: 'AUD-' + String(hr.seq++).padStart(4, '0'), at: TODAY + ' ' + new Date().toTimeString().slice(0, 5), by, object: extra.object || 'Pengaturan', action, detail, ...extra }); };
  function update(state, action, input = {}) {
    const hr = ensure(state), by = input.by || 'Demo', role = input.role;
    const need = (perm) => { if (!can(role, perm)) throw new Error(`Akses ditolak: role ${roleDef(role).label} tidak punya izin "${PERM_LABEL[perm]}".`); };
    switch (action) {
      case 'approval-add-level': {
        need('settings.edit');
        const r = hr.settings.approval.find(x => x.id === input.id); if (!r) throw new Error('Kebijakan approval tidak ditemukan.');
        const lvl = String(input.level || '').trim(); if (lvl.length < 3) throw new Error('Nama level approval minimal 3 huruf.');
        if (r.chain.includes(lvl)) throw new Error(`Level "${lvl}" sudah ada di ${r.name}.`);
        r.chain.push(lvl); audit(hr, by, 'Approval policy', `${r.name}: tambah level ${lvl}`, { object: 'Pengaturan', ref: r.id, before: r.chain.slice(0, -1).join(' → '), after: r.chain.join(' → ') }); return r.id;
      }
      case 'approval-remove-level': {
        need('settings.edit');
        const r = hr.settings.approval.find(x => x.id === input.id); const i = Number(input.index);
        if (!r || !(i >= 0 && i < r.chain.length)) throw new Error('Level tidak ditemukan.');
        if (r.chain.length === 1) throw new Error('Setiap kebijakan butuh minimal satu approver.');
        const prev = r.chain.join(' → '); const [gone] = r.chain.splice(i, 1); audit(hr, by, 'Approval policy', `${r.name}: hapus level ${gone}`, { object: 'Pengaturan', ref: r.id, before: prev, after: r.chain.join(' → ') }); return r.id;
      }
      case 'numbering-set': {
        need('settings.edit');
        const r = hr.settings.numbering.find(x => x.id === input.id); if (!r) throw new Error('Penomoran tidak ditemukan.');
        const pat = String(input.pattern || '').trim(); if (!/\{0+\}/.test(pat)) throw new Error('Pola wajib memuat nomor urut, mis. {000}.');
        const old = r.pattern; r.pattern = pat; audit(hr, by, 'Penomoran', `${r.name}: pola diubah`, { object: 'Pengaturan', ref: r.id, before: old, after: pat }); return r.id;
      }
      case 'holiday-add': {
        need('settings.edit');
        const date = String(input.date || ''), name = String(input.name || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || name.length < 3) throw new Error('Isi tanggal dan nama libur.');
        if (hr.settings.calendar.some(c => c.date === date)) throw new Error(`Tanggal ${date} sudah ada di kalender.`);
        hr.settings.calendar.push({ date, name, type: input.type || 'Libur perusahaan', demo: true }); hr.settings.calendar.sort((a, b) => a.date.localeCompare(b.date));
        audit(hr, by, 'Kalender', `Tambah ${date} · ${name}`, { object: 'Pengaturan', ref: date, before: '—', after: name }); return date;
      }
      case 'company-set': {
        need('settings.edit');
        const key = input.field, val = String(input.value || '').trim();
        if (!(key in hr.settings.company)) throw new Error('Field tidak dikenal.');
        if (val.length < 2) throw new Error('Nilai minimal 2 karakter.');
        const before = hr.settings.company[key]; if (before === val) throw new Error('Tidak ada perubahan untuk disimpan.');
        hr.settings.company[key] = val; audit(hr, by, 'Identitas perusahaan', `Field ${key} diubah`, { object: 'Pengaturan', ref: 'company.' + key, before, after: val });
        return key;
      }
      case 'integration-test': {
        need('settings.view');
        const it = hr.settings.integrations.find(x => x[0] === input.id); if (!it) throw new Error('Integrasi tidak ditemukan.');
        /* tidak ada koneksi produksi: hasil ditentukan dari status integrasi */
        const result = it[1] === 'UI-ONLY SIMULATION' ? 'Simulasi aktif' : it[1] === 'NEW INTEGRATION REQUIRED' ? 'Belum dikonfigurasi' : /POS/.test(it[0]) ? 'Gagal (simulasi): endpoint belum ditetapkan' : 'Belum dikonfigurasi';
        hr.settings.lastTest = { ...(hr.settings.lastTest || {}), [it[0]]: result };
        audit(hr, by, 'Uji koneksi (simulasi)', `${it[0]}: ${result}`, { object: 'Integrasi', ref: it[0], before: '—', after: result });
        return result;
      }
      case 'notif-toggle': {
        need('settings.edit');
        const r = hr.settings.notifications.find(x => x.id === input.id); if (!r) throw new Error('Notifikasi tidak ditemukan.');
        r.on = !r.on; audit(hr, by, 'Notifikasi', `${r.name}: ${r.on ? 'aktif' : 'nonaktif'}`, { object: 'Pengaturan', ref: r.id, before: r.on ? 'Nonaktif' : 'Aktif', after: r.on ? 'Aktif' : 'Nonaktif' }); return r.id;
      }
      case 'account-role': {
        need('access.edit');
        const a = hr.accounts.find(x => x.emp === input.emp); if (!a) throw new Error('Akun tidak ditemukan.');
        const next = input.newrole;
        if (!['ess', 'hrd-ops', 'hg-lead'].includes(next)) throw new Error('Peran ini tidak dapat diberikan dari layar demo.');
        if (a.role === next) throw new Error('Peran akun tidak berubah.');
        if (Object.values(hr.roleEmp).includes(a.emp)) throw new Error('Akun role demo utama tidak diubah dari layar ini.');
        const before = a.role; a.role = next;
        const lbl = (r) => r === 'ess' ? 'Karyawan (ESS)' : roleDef(r).label;
        audit(hr, by, 'Perubahan akses', `Peran akun ${a.emp} diubah`, { object: 'Akses', ref: a.emp, before: lbl(before), after: lbl(next) });
        return a.emp;
      }
      case 'test-add-real': {
        need('dummy.delete');
        if (hr.people.some(p => p.id === 'EMP-REAL-001')) throw new Error('Record uji non-demo sudah ada.');
        hr.people.push({ id: 'EMP-REAL-001', name: 'Record uji non-demo', position: 'POS-HRO', division: 'DIV-HRD', level: 'staff', joined: '2026-11-13', contract: 'PKWT', status: 'Aktif', thp: 0, shift: 'Kantor', demo: false, account: true });
        hr.placements.push({ id: 'PLC-REAL-001', emp: 'EMP-REAL-001', entity: 'ENT-HQ', division: 'DIV-HRD', location: HQ.id, position: 'POS-HRO', from: '2026-11-13', to: null, demo: false });
        audit(hr, by, 'Tambah record non-demo (uji)', 'EMP-REAL-001 ditambahkan tanpa label demo untuk menguji penghapusan dummy', { object: 'Dataset', ref: 'EMP-REAL-001' });
        return 'EMP-REAL-001';
      }
      case 'dummy-delete': {
        need('dummy.delete');
        if (String(input.confirm || '').trim() !== 'HAPUS DUMMY') throw new Error('Ketik HAPUS DUMMY untuk mengonfirmasi.');
        const before = { people: hr.people.length, placements: hr.placements.length };
        /* hanya record berlabel demo; record non-demo (data asli) tetap utuh */
        hr.people = hr.people.filter(p => !p.demo);
        hr.placements = hr.placements.filter(p => !p.demo);
        hr.vacancies = hr.vacancies.filter(v => !v.demo);
        hr.settings.calendar = hr.settings.calendar.filter(c => !c.demo);
        hr.accounts = hr.accounts.filter(a => !a.demo);
        hr.queue = hr.queue.filter(q => !q.demo);
        EXT.purge?.(hr);
        hr.purged = true;
        const removed = before.people - hr.people.length;
        audit(hr, by, 'Hapus dataset dummy', `${removed} profil dan ${before.placements - hr.placements.length} penempatan demo dihapus · ${hr.people.length} profil non-demo tetap`, { object: 'Dataset', before: `${before.people} profil`, after: `${hr.people.length} profil` });
        return removed;
      }
      case 'dummy-load': {
        need('dummy.delete');
        const keep = hr.people.filter(p => !p.demo), keepPl = hr.placements.filter(p => !p.demo), log = hr.audit;
        const f = fresh();
        const keepF2 = EXT.keep?.(hr);
        state.hr = { ...f, ...(keepF2 ? { f2: keepF2 } : {}), people: [...f.people, ...keep], placements: [...f.placements, ...keepPl], accounts: [...f.accounts, ...hr.accounts.filter(a => !a.demo)], audit: log, seq: hr.seq };
        EXT.ensure?.(state.hr);
        audit(state.hr, by, 'Muat dataset dummy', `${f.people.length} profil demo dimuat`, { object: 'Dataset' });
        return f.people.length;
      }
      default:
        if (EXT.update) return EXT.update(state, hr, action, input, { need, audit, by, role });
        throw new Error('Aksi HRD tidak dikenal: ' + action);
    }
  }

  return { EXT, audit: (hr, ...a) => audit(hr, ...a), TODAY, COMPANY, supervisorOf, ENTITIES, OUTLETS, HQ, DIVISIONS, POSITIONS, EXPECTED, ROLE_DEFS, PERM_LABEL, pos, roleDef, can, fresh, ensure, placementOn, upcomingOf, joiners, locName, inScope, people, reconcile, summary, update };
})();
if (typeof module !== 'undefined') module.exports = HR;
