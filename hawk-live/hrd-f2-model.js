/* JAENS ERP · Portal HRD · model F2 Operasi HRD & Direktori — DATA DEMO / SIMULASI.
   Jadwal & shift efektif, presensi (log + koreksi), pengajuan bertingkat (satu Request ID dibaca modul asal
   dan inbox Approval), saldo cuti (ledger), klien, kunjungan, pelacakan lokasi, timeline dan impor karyawan.
   Memperluas HR (hrd-model.js) lewat HR.EXT. Deterministik, tanpa jaringan. */
const HR2 = (() => {
  const H = (typeof HR !== 'undefined') ? HR : require('./hrd-model.js');
  const TODAY = H.TODAY;
  const SHIFTS = { Pagi: ['09:00', '17:00'], Sore: ['13:00', '21:00'], Malam: ['17:00', '22:00'], Kantor: ['08:30', '16:30'] };
  const DAYS = ['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'];
  const DOW = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const LEAVE = [
    { id: 'LV-ANN', name: 'Cuti Tahunan', quota: 12, doc: false }, { id: 'LV-SPC', name: 'Cuti Khusus', quota: 3, doc: true },
    { id: 'LV-SCK', name: 'Sakit', quota: null, doc: true }, { id: 'LV-PRM', name: 'Izin', quota: 2, doc: false },
    { id: 'LV-UNP', name: 'Cuti Tidak Dibayar', quota: null, doc: false }, { id: 'LV-HOL', name: 'Cuti Libur Nasional', quota: null, doc: false, auto: true }
  ];
  const leaveCat = (id) => LEAVE.find(l => l.id === id || l.name === id);

  /* ---------- tanggal ---------- */
  const d2n = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 864e5;
  const n2d = (n) => new Date(n * 864e5).toISOString().slice(0, 10);
  const addDays = (d, k) => n2d(d2n(d) + k);
  const dow = (d) => new Date(d2n(d) * 864e5).getUTCDay();
  const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const num = (id) => Number(String(id).replace(/\D/g, '')) || 0;


  /* ---------- Pelacakan lokasi: titik kerja nyata (koordinat dari tautan Google Maps Owner, 14 Nov 2026) ---------- */
  const SITES = {
    'OUT-UBD': { name: 'Jaens Spa Center Ubud', lat: -8.5215997, lng: 115.2628912, gmaps: 'https://maps.app.goo.gl/6nWA4gUCmCq6rvE5A' },
    'OUT-SHT': { name: 'Jaens Spa Shanti Ubud', lat: -8.5347371, lng: 115.2661551, gmaps: 'https://maps.app.goo.gl/6oErN4vFYbpC68m66' },
    'OUT-TRL': { name: 'Jaens Spa Triloka Ubud', lat: -8.5197366, lng: 115.263036, gmaps: 'https://maps.app.goo.gl/TxExX4i89xKiNW2j7' },
    'OUT-BSM': { name: 'Jaens Spa Bisma Ubud', lat: -8.5134803, lng: 115.2583193, gmaps: 'https://maps.app.goo.gl/U5ynLF9WSDQN4C9U7' },
    'LOC-HQ': { name: 'Head Office JAENS', lat: -8.5348308, lng: 115.2657347, gmaps: 'https://maps.app.goo.gl/L8dsTP3WHGYsPse76', note: 'Tautan Google Maps menunjuk tempat bernama "Samyama Eatery"; koordinat dipakai apa adanya — TO VERIFY' }
  };
  const RADIUS = 150; /* meter, aturan presensi */
  const dist = (a, b, c, d) => { const R = 6371000, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return Math.round(2 * R * Math.asin(Math.sqrt(h))); };
  const move = (lat, lng, m, deg) => [lat + (m * Math.cos(deg * Math.PI / 180)) / 111320, lng + (m * Math.sin(deg * Math.PI / 180)) / (111320 * Math.cos(lat * Math.PI / 180))];
  /* contoh di luar radius (data demo): jarak & arah dari titik kerja, kejadian (masuk/keluar), keterangan, status tindak lanjut */
  const OUTSIDE = [
    { emp: 'EMP-0003', ev: 'in', m: 420, deg: 30, place: 'Jl. Raya Ubud (warung kopi)', reason: 'Check-in sebelum tiba di outlet', follow: 'Perlu verifikasi Supervisor' },
    { emp: 'EMP-0033', ev: 'in', m: 1850, deg: 200, place: 'Rumah karyawan · Peliatan', reason: 'Absen dari rumah, tidak ada izin dinas luar', follow: 'Perlu klarifikasi' },
    { emp: 'EMP-0064', ev: 'out', m: 650, deg: 300, place: 'Monkey Forest Rd', reason: 'Check-out setelah meninggalkan outlet', follow: 'Perlu verifikasi Supervisor' },
    { emp: 'EMP-0095', ev: 'in', m: 2900, deg: 340, place: 'Villa tamu · Penestanan', reason: 'On-site treatment villa (dinas luar)', follow: 'Disetujui · dinas luar' },
    { emp: 'EMP-0122', ev: 'in', m: 3600, deg: 10, place: 'Hotel Tegallalang Demo', reason: 'Kunjungan klien sebelum ke kantor', follow: 'Disetujui · kunjungan klien' },
    { emp: 'EMP-0012', ev: 'out', m: 280, deg: 120, place: 'Parkiran Jl. Hanoman', reason: 'GPS tercatat di luar radius saat check-out', follow: 'Ditolak · perlu koreksi presensi' }
  ];
  /* satu baris per karyawan aktif yang punya catatan presensi pada tanggal itu */
  function geo(hr, date = TODAY) {
    ensure(hr);
    return hr.people.map(p => {
      const pl = H.placementOn(hr, p.id, date); if (!pl) return null;
      const siteId = SITES[pl.location] ? pl.location : 'LOC-HQ', site = SITES[siteId];
      const a = attendance(hr, p.id, date); if (!a.in) return null;
      const n = num(p.id), jm = 12 + (n * 37) % 60, jd = (n * 53) % 360;
      let [lat, lng] = move(site.lat, site.lng, jm, jd), outLat = lat, outLng = lng;
      const ox = OUTSIDE.find(o => o.emp === p.id);
      if (ox) { const q = move(site.lat, site.lng, ox.m, ox.deg); if (ox.ev === 'in') [lat, lng] = q; else if (a.out) [outLat, outLng] = q; }
      const dIn = dist(site.lat, site.lng, lat, lng), dOut = a.out ? dist(site.lat, site.lng, outLat, outLng) : null;
      const outside = ox && (ox.ev === 'in' || a.out) ? { ev: ox.ev === 'in' ? 'Check-in' : 'Check-out', at: ox.ev === 'in' ? a.in : a.out, d: ox.ev === 'in' ? dIn : dOut, over: (ox.ev === 'in' ? dIn : dOut) - RADIUS, place: ox.place, reason: ox.reason, follow: ox.follow } : null;
      return { emp: p.id, name: p.name, pos: H.pos(pl.position)?.name || pl.position, site: siteId, siteName: site.name, date, in: a.in, out: a.out, status: a.status, late: a.late, lat, lng, outLat, outLng, dIn, dOut, outside };
    }).filter(Boolean);
  }

  /* ---------- seed ---------- */
  function seed(hr) {
    const f2 = { seeded: true, schedules: [], overrides: {}, ledger: [], clients: [], visits: [], tracks: [], posts: [], imports: [], docs: [], seq: { req: 10, shf: 1, vis: 20, trk: 40, emp: 159, tl: 10 } };
    hr.people.filter(p => p.demo).forEach(p => {
      const off = num(p.id) % 7;
      f2.schedules.push({ id: 'SHF-' + p.id.slice(4), emp: p.id, shift: p.shift, off, from: '2026-01-01', to: null, kind: 'tetap', demo: true });
      f2.ledger.push({ id: 'LDG-' + p.id.slice(4) + '-A', emp: p.id, cat: 'LV-ANN', days: (num(p.id) * 3) % 6, ref: 'Saldo awal 2026 (terpakai s/d Okt)', at: '2026-10-31', demo: true });
    });
    /* contoh: shift EMP-0012 berubah 2026-11-01 (histori) */
    const s12 = f2.schedules.find(s => s.emp === 'EMP-0012');
    if (s12) { f2.schedules.push({ ...s12, id: s12.id + '-A', shift: s12.shift === 'Pagi' ? 'Sore' : 'Pagi', to: '2026-10-31' }); s12.from = '2026-11-01'; }
    f2.clients = [
      ['CLI-001', 'Villa Sawah Ubud', 'Ubud', 'Aktif'], ['CLI-002', 'Hotel Tegallalang Demo', 'Tegallalang', 'Aktif'], ['CLI-003', 'Resort Payangan Demo', 'Payangan', 'Aktif'],
      ['CLI-004', 'Studio Yoga Penestanan', 'Ubud', 'Aktif'], ['CLI-005', 'Villa Keliki Demo', 'Keliki', 'Prospek']
    ].map(([id, name, area, status]) => ({ id, name, area, status, contact: `pic-${id.toLowerCase()}@example.invalid`, phone: '0361-' + id.slice(-3) + '000', demo: true }));
    const vis = [['VIS-001', 'EMP-0122', 'CLI-001', '2026-11-11', '10:05', '10:42'], ['VIS-002', 'EMP-0131', 'CLI-002', '2026-11-12', '14:10', '15:05'], ['VIS-003', 'EMP-0122', 'CLI-003', '2026-11-12', '09:30', '10:15'], ['VIS-004', 'EMP-0001', 'CLI-001', '2026-11-13', '11:00', '12:30'], ['VIS-005', 'EMP-0132', 'CLI-004', '2026-11-10', '16:00', '16:40']];
    const COORD = { 'CLI-001': [-8.5069, 115.2625], 'CLI-002': [-8.4321, 115.2789], 'CLI-003': [-8.4510, 115.2420], 'CLI-004': [-8.5050, 115.2510], 'CLI-005': [-8.4890, 115.2650] };
    vis.forEach(([id, emp, client, date, tin, tout], i) => {
      const trk = 'TRK-V' + String(i + 1).padStart(2, '0');
      f2.visits.push({ id, emp, client, date, in: tin, out: tout, evidence: `Foto bukti kunjungan (sintetis) · ${id}`, note: client === 'CLI-001' && emp === 'EMP-0001' ? 'On-site treatment villa (simulasi)' : 'Kunjungan kemitraan', track: trk, demo: true });
      f2.tracks.push({ id: trk, emp, at: `${date} ${tin}`, lat: COORD[client][0], lng: COORD[client][1], context: { type: 'Kunjungan', ref: id }, validation: i === 2 ? 'Di luar radius 150 m' : 'Valid', demo: true });
    });
    /* titik presensi outlet (contoh) + satu GPS tidak tersedia */
    const OUTC = Object.fromEntries(Object.entries(SITES).map(([k, v]) => [k, [v.lat, v.lng]]));
    ['EMP-0001', 'EMP-0002', 'EMP-0031', 'EMP-0061', 'EMP-0091'].forEach((emp, i) => {
      const pl = H.placementOn(hr, emp); const c = OUTC[pl.location];
      f2.tracks.push({ id: 'TRK-P' + String(i + 1).padStart(2, '0'), emp, at: `${TODAY} ${i === 4 ? '09:12' : '08:5' + i}`, lat: i === 4 ? null : c[0] + i * 0.0002, lng: i === 4 ? null : c[1], context: { type: 'Presensi', ref: `ATT-${TODAY.replace(/-/g, '')}-${emp}` }, validation: i === 4 ? 'GPS tidak tersedia' : 'Valid', demo: true });
    });
    f2.posts = [
      { id: 'TL-001', kind: 'Pengumuman', title: 'Orientasi therapist baru Spa Ubud', at: '2026-11-13 08:00', scope: 'OUT-UBD', ref: null, demo: true },
      { id: 'TL-002', kind: 'Agenda', title: 'Briefing SOP kebersihan ruang treatment (semua outlet)', at: '2026-11-18 14:00', scope: 'all', ref: null, demo: true },
      { id: 'TL-003', kind: 'Pengumuman', title: 'Libur nasional Natal & cuti bersama', at: '2026-11-12 09:00', scope: 'all', ref: '#hrd-company?tab=calendar', demo: true }
    ];
    f2.docs = []; /* dokumen dummy dibangkitkan per profil saat dibaca */
    return f2;
  }
  /* pengajuan F1 (hr.queue) ditingkatkan menjadi Request bertingkat; satu array dipakai Beranda, modul asal dan Approval */
  const POLICY_OF = { 'Koreksi presensi': 'APR-ATT', 'Tukar shift': 'APR-SHIFT', Lembur: 'APR-ATT' };
  const policyFor = (type) => POLICY_OF[type] || (leaveCat(type) ? 'APR-LEAVE' : 'APR-ATT');
  function upgradeQueue(hr) {
    hr.queue.forEach(q => {
      if (q.stages) return;
      const pol = hr.settings.approval.find(a => a.id === policyFor(q.type));
      q.policy = pol.id; q.created = q.created || `${q.date} 08:00`;
      q.stages = pol.chain.map(label => ({ label, decision: null, by: null, at: null, reason: null }));
      if (q.status === 'Disetujui') q.stages.forEach(s => { s.decision = 'Disetujui'; s.by = 'Fixture'; s.at = `${q.date} 18:00`; });
      q.stage = q.status === 'Disetujui' ? q.stages.length : 0;
      if (q.type === 'Koreksi presensi') { q.payload = { att: `ATT-${q.date.replace(/-/g, '')}-${q.emp}`, before: null, after: { in: '09:00' }, reason: q.note, evidence: 'Foto absen manual (sintetis)' }; }
      if (q.type === 'Cuti Tahunan') { q.payload = { cat: 'LV-ANN', from: '2026-11-20', to: '2026-11-20', days: 1, reason: q.note }; }
      if (q.type === 'Tukar shift') { q.payload = { date: '2026-11-15', to: 'Sore', reason: q.note }; }
      if (q.type === 'Lembur') { q.payload = { date: q.date, minutes: 120, reason: q.note }; }
    });
  }
  function ensure(hr) {
    if (!hr.f2 || !hr.f2.seeded) { const keep = hr.f2; hr.f2 = seed(hr); if (keep) for (const k of ['schedules', 'ledger', 'clients', 'visits', 'tracks', 'posts', 'imports']) hr.f2[k].push(...(keep[k] || [])); }
    upgradeQueue(hr);
    return hr.f2;
  }

  /* ---------- jadwal ---------- */
  const scheduleOn = (hr, emp, date) => ensure(hr).schedules.find(s => s.emp === emp && s.kind === 'tetap' && s.from <= date && (!s.to || s.to >= date));
  const extrasOn = (hr, emp, date) => ensure(hr).schedules.filter(s => s.emp === emp && s.kind === 'tambahan' && s.from === date);
  const overlap = (a, b) => { const [a1, a2] = SHIFTS[a].map(mins), [b1, b2] = SHIFTS[b].map(mins); return a1 < b2 && b1 < a2; };

  /* ---------- presensi ---------- */
  const attId = (emp, date) => `ATT-${date.replace(/-/g, '')}-${emp}`;
  function leaveOn(hr, emp, date) { return hr.queue.find(q => q.emp === emp && q.payload?.cat && q.status === 'Disetujui' && q.payload.from <= date && q.payload.to >= date); }
  function attendance(hr, emp, date) {
    const f2 = ensure(hr), sch = scheduleOn(hr, emp, date);
    const id = attId(emp, date);
    const base = { id, emp, date, shift: sch?.shift || '—', in: null, out: null, breakMin: 0, otMin: 0, late: 0, status: 'Belum Ada Status', evidence: null, corrected: null, provisional: false };
    if (!sch || date > TODAY) return base;
    const lv = leaveOn(hr, emp, date);
    if (lv) return { ...base, status: leaveCat(lv.payload.cat).name === 'Sakit' ? 'Sakit' : 'Cuti', ref: lv.id };
    if (dow(date) === sch.off) return { ...base, status: 'Libur' };
    const n = num(emp), k = (n * 31 + d2n(date) * 7) % 20;
    if (k === 16) return { ...base, status: 'Sakit', evidence: 'Surat dokter (sintetis)' };
    const [s1, s2] = SHIFTS[sch.shift].map(mins);
    /* JAENS Mobile (addendum 14 Nov 2026): kejadian presensi dari aplikasi digabung ke catatan resmi yang sama */
    const mob = (r) => H.EXT.mobileAtt ? H.EXT.mobileAtt(hr, emp, date, r, s1) : r;
    if (date === TODAY && k >= 18) return mob(base); /* belum absen */
    const late = k === 14 || k === 15 ? 5 + (n * 3 + k) % 25 : 0;
    let rec = { ...base, in: hhmm(s1 - 5 + late + (late ? 5 : 0)), out: date === TODAY ? null : hhmm(s2 + (k % 6 === 0 ? 60 : 0)), breakMin: 60, otMin: date !== TODAY && k % 6 === 0 ? 60 : 0, late, status: late ? 'Terlambat' : 'Hadir', evidence: `Selfie + lokasi outlet (sintetis)` };
    const ov = f2.overrides[id];
    if (ov) { rec = { ...rec, ...ov.after, corrected: ov }; const lt = Math.max(0, mins(rec.in) - s1); rec.late = lt; rec.status = lt ? 'Terlambat' : 'Hadir'; }
    rec.provisional = !ov && hr.queue.some(q => q.type === 'Koreksi presensi' && q.payload?.att === id && q.status === 'Menunggu Persetujuan');
    return mob(rec);
  }
  const attStatus = (hr, emp, date) => attendance(hr, emp, date).status;
  function summary(hr, emps, days = DAYS) {
    return emps.map(emp => {
      const rows = days.map(d => attendance(hr, emp, d));
      const worked = rows.filter(r => r.in && r.out).reduce((a, r) => a + mins(r.out) - mins(r.in) - r.breakMin, 0);
      return { emp, hadir: rows.filter(r => ['Hadir', 'Terlambat'].includes(r.status)).length, terlambat: rows.filter(r => r.status === 'Terlambat').length, lateMin: rows.reduce((a, r) => a + r.late, 0), cuti: rows.filter(r => r.status === 'Cuti').length, sakit: rows.filter(r => r.status === 'Sakit').length, libur: rows.filter(r => r.status === 'Libur').length, belum: rows.filter(r => r.status === 'Belum Ada Status').length, hours: worked / 60, otMin: rows.reduce((a, r) => a + r.otMin, 0), corrected: rows.filter(r => r.corrected).length };
    });
  }

  /* ---------- saldo cuti ---------- */
  function balance(hr, emp) {
    const f2 = ensure(hr);
    return LEAVE.filter(c => !c.auto).map(c => {
      const used = f2.ledger.filter(l => l.emp === emp && l.cat === c.id).reduce((a, l) => a + l.days, 0);
      const pending = hr.queue.filter(q => q.emp === emp && q.payload?.cat === c.id && q.status === 'Menunggu Persetujuan').reduce((a, q) => a + q.payload.days, 0);
      return { ...c, used, pending, left: c.quota === null ? null : c.quota - used };
    });
  }
  const daysBetween = (a, b) => { let n = 0; for (let d = a; d <= b; d = addDays(d, 1)) n++; return n; };

  /* ---------- otorisasi tahap approval ---------- */
  function canDecide(hr, role, q) {
    if (!q || q.status !== 'Menunggu Persetujuan') return false;
    const label = q.stages[q.stage].label;
    if (/Manager HRD/.test(label)) return role === 'hrd';
    if (/Owner/.test(label)) return role === 'owner';
    if (/Assistant Operational Manager/.test(label)) return role === 'ops-manager';
    if (/Operational Manager|Manager divisi/.test(label)) return role === 'ops-manager' || role === 'hrd';
    if (/Supervisor|atasan/.test(label)) { const sup = H.supervisorOf(hr, q.emp); return (sup && hr.roleEmp[role] === sup) || role === 'ops-manager'; }
    return false;
  }

  /* ---------- aksi ---------- */
  function update(state, hr, action, input, ctx) {
    const f2 = ensure(hr), { need, audit, by, role } = ctx;
    const empOk = (emp) => { if (!hr.people.some(p => p.id === emp)) throw new Error(`Employee ID ${emp} tidak ditemukan.`); if (!H.inScope(hr, role, emp)) throw new Error(`Akses ditolak: ${emp} di luar cakupan role ini.`); };
    const nextReq = () => 'REQ-2611-' + String(f2.seq.req++).padStart(3, '0');
    const newRequest = (type, emp, payload, note) => {
      const pol = hr.settings.approval.find(a => a.id === policyFor(type));
      const q = { id: nextReq(), emp, type, date: TODAY, note, status: 'Menunggu Persetujuan', policy: pol.id, created: `${TODAY} ${new Date().toTimeString().slice(0, 5)}`, stage: 0, stages: pol.chain.map(label => ({ label, decision: null, by: null, at: null, reason: null })), payload, demo: true };
      hr.queue.unshift(q); audit(hr, by, 'Pengajuan dibuat', `${q.id} · ${type} · ${emp}`, { object: 'Pengajuan', ref: q.id, before: '—', after: 'Menunggu Persetujuan' });
      return q.id;
    };
    switch (action) {
      case 'shift-change': {
        need('people'); empOk(input.emp);
        if (!SHIFTS[input.shift] || input.shift === 'Malam') throw new Error('Pilih shift tetap: Pagi, Sore atau Kantor.');
        const from = input.from; if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '')) throw new Error('Isi tanggal efektif.');
        if (from <= TODAY) throw new Error('Tanggal efektif minimal besok; jadwal tanggal yang sudah berjalan dipertahankan.');
        const cur = f2.schedules.find(s => s.emp === input.emp && s.kind === 'tetap' && !s.to);
        if (cur.shift === input.shift) throw new Error(`Shift ${input.emp} sudah ${input.shift}.`);
        if (cur.from >= from) throw new Error('Sudah ada perubahan jadwal mulai tanggal itu atau sesudahnya.');
        cur.to = addDays(from, -1);
        const id = `SHF-${input.emp.slice(4)}-${String(f2.seq.shf++).padStart(2, '0')}`;
        f2.schedules.push({ id, emp: input.emp, shift: input.shift, off: cur.off, from, to: null, kind: 'tetap', demo: true });
        audit(hr, by, 'Perubahan shift', `${input.emp}: ${cur.shift} → ${input.shift} efektif ${from}`, { object: 'Jadwal', ref: input.emp, before: `${cur.shift} s/d ${cur.to}`, after: `${input.shift} mulai ${from}`, effective: from });
        return id;
      }
      case 'shift-assign': {
        need('people'); empOk(input.emp);
        const date = input.date, shift = input.shift, out = input.outlet;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !SHIFTS[shift]) throw new Error('Isi tanggal dan shift penugasan.');
        const base = scheduleOn(hr, input.emp, date);
        const clash = [base, ...extrasOn(hr, input.emp, date)].filter(Boolean).find(s => (s.kind === 'tambahan' || dow(date) !== s.off) && overlap(s.shift, shift));
        if (clash) throw new Error(`Konflik: ${input.emp} sudah terjadwal ${clash.shift} (${SHIFTS[clash.shift].join('–')}) pada ${date}. Penugasan tumpang tindih ditolak.`);
        const id = `SHF-${input.emp.slice(4)}-X${String(f2.seq.shf++).padStart(2, '0')}`;
        f2.schedules.push({ id, emp: input.emp, shift, from: date, to: date, kind: 'tambahan', outlet: out, demo: true });
        audit(hr, by, 'Penugasan tambahan', `${input.emp} ${shift} di ${H.locName(out)} pada ${date}`, { object: 'Jadwal', ref: input.emp, before: '—', after: `${shift} · ${H.locName(out)}`, effective: date });
        return id;
      }
      case 'att-correct': {
        if (!H.can(role, "people") && !H.can(role, "ess")) need("people"); empOk(input.emp);
        const rec = attendance(hr, input.emp, input.date);
        if (!/^\d{2}:\d{2}$/.test(input.in || '')) throw new Error('Isi jam masuk yang benar (HH:MM).');
        if (input.out && !/^\d{2}:\d{2}$/.test(input.out)) throw new Error('Format jam keluar HH:MM.');
        if (String(input.reason || '').trim().length < 5) throw new Error('Alasan koreksi minimal 5 karakter.');
        if (hr.queue.some(q => q.payload?.att === rec.id && q.status === 'Menunggu Persetujuan')) throw new Error(`Koreksi untuk ${rec.id} sudah menunggu review.`);
        return newRequest('Koreksi presensi', input.emp, { att: rec.id, date: input.date, before: { in: rec.in, out: rec.out }, after: { in: input.in, ...(input.out ? { out: input.out } : {}) }, reason: input.reason, evidence: 'Lampiran bukti (sintetis)' }, `${rec.in || '—'} → ${input.in}`);
      }
      case 'leave-request': {
        if (!H.can(role, "people") && !H.can(role, "ess")) need("people"); empOk(input.emp);
        const cat = leaveCat(input.cat); if (!cat || cat.auto) throw new Error('Pilih kategori cuti/izin.');
        const from = input.from, to = input.to || input.from;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || to < from) throw new Error('Periode cuti tidak valid.');
        const days = daysBetween(from, to);
        const clash = hr.queue.find(q => q.emp === input.emp && q.payload?.cat && ['Menunggu Persetujuan', 'Disetujui'].includes(q.status) && q.payload.from <= to && q.payload.to >= from);
        if (clash) throw new Error(`Bertabrakan dengan ${clash.id} (${clash.payload.from} s/d ${clash.payload.to}).`);
        const bal = balance(hr, input.emp).find(b => b.id === cat.id);
        if (bal.left !== null && bal.left - bal.pending < days) throw new Error(`Saldo ${cat.name} tidak cukup: sisa ${bal.left - bal.pending} hari.`);
        return newRequest(cat.name, input.emp, { cat: cat.id, from, to, days, reason: input.reason || '' }, `${days} hari · ${from}${to !== from ? ' s/d ' + to : ''}`);
      }
      case 'decide': {
        const q = hr.queue.find(x => x.id === input.id); if (!q) throw new Error('Pengajuan tidak ditemukan.');
        if (q.status !== 'Menunggu Persetujuan') throw new Error(`${q.id} sudah final (${q.status}). Keputusan tidak diulang.`);
        if (!canDecide(hr, role, q)) throw new Error(`Akses ditolak: tahap "${q.stages[q.stage].label}" bukan wewenang role ini.`);
        const st = q.stages[q.stage], ok = input.decision === 'approve';
        if (!ok && String(input.reason || '').trim().length < 5) throw new Error('Alasan penolakan minimal 5 karakter.');
        Object.assign(st, { decision: ok ? 'Disetujui' : 'Ditolak', by, at: `${TODAY} ${new Date().toTimeString().slice(0, 5)}`, reason: input.reason || null });
        if (!ok) { q.status = 'Ditolak'; }
        else if (q.stage < q.stages.length - 1) { q.stage++; }
        else {
          q.status = 'Disetujui'; q.stage = q.stages.length;
          if (q.type === 'Koreksi presensi' && !f2.overrides[q.payload.att]) f2.overrides[q.payload.att] = { after: q.payload.after, req: q.id, by, at: st.at };
          if (q.payload?.cat && !f2.ledger.some(l => l.ref === q.id)) f2.ledger.push({ id: 'LDG-' + q.id, emp: q.emp, cat: q.payload.cat, days: q.payload.days, ref: q.id, at: TODAY, demo: true });
        }
        audit(hr, by, 'Keputusan approval', `${q.id} · ${st.label}: ${st.decision}${q.status !== 'Menunggu Persetujuan' ? ' · final' : ' · lanjut ke ' + q.stages[q.stage].label}`, { object: 'Pengajuan', ref: q.id, before: q.type === 'Koreksi presensi' ? JSON.stringify(q.payload.before) : 'Menunggu', after: q.type === 'Koreksi presensi' && q.status === 'Disetujui' ? JSON.stringify(q.payload.after) : q.status });
        return q.status === 'Menunggu Persetujuan' ? `${q.id} lanjut ke ${q.stages[q.stage].label}` : `${q.id} ${q.status}`;
      }
      case 'placement-change': {
        need('settings.view'); empOk(input.emp);
        if (!['hrd', 'hrd-ops'].includes(role)) throw new Error('Akses ditolak: perubahan penempatan oleh HRD.');
        const from = input.from; if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || from <= TODAY) throw new Error('Tanggal efektif minimal besok.');
        const cur = hr.placements.find(p => p.emp === input.emp && !p.to);
        const loc = input.location, posId = input.position || cur.position;
        if (![...H.OUTLETS.map(o => o.id), H.HQ.id].includes(loc)) throw new Error('Lokasi tidak dikenal.');
        if (loc === cur.location && posId === cur.position) throw new Error('Penempatan tidak berubah.');
        if (cur.from >= from) throw new Error('Sudah ada penempatan mulai tanggal itu atau sesudahnya.');
        cur.to = addDays(from, -1);
        const id = `PLC-${input.emp.slice(4)}-${from.replace(/-/g, '').slice(2)}`;
        hr.placements.push({ ...cur, id, location: loc, entity: loc === H.HQ.id ? 'ENT-HQ' : 'ENT-SPA', position: posId, division: H.pos(posId).division, from, to: null, reason: input.reason || 'Perubahan penempatan', demo: cur.demo });
        audit(hr, by, 'Penempatan efektif', `${input.emp}: ${H.locName(cur.location)} → ${H.locName(loc)} efektif ${from}`, { object: 'Penempatan', ref: input.emp, before: `${H.locName(cur.location)} · ${H.pos(cur.position).name}`, after: `${H.locName(loc)} · ${H.pos(posId).name} · efektif ${from}`, effective: from });
        return id;
      }
      case 'employee-add': {
        need('people'); if (!['hrd', 'hrd-ops'].includes(role)) throw new Error('Akses ditolak: tambah karyawan oleh HRD.');
        const name = String(input.name || '').trim(); if (name.length < 3) throw new Error('Nama minimal 3 karakter.');
        const loc = input.location, ps = H.pos(input.position);
        if (!ps) throw new Error('Pilih posisi.');
        if (![...H.OUTLETS.map(o => o.id), H.HQ.id].includes(loc)) throw new Error('Lokasi tidak dikenal.');
        if (hr.people.some(p => p.name.toLowerCase() === name.toLowerCase())) throw new Error(`Nama "${name}" sudah ada. Periksa duplikat sebelum menambah.`);
        return addEmployee(hr, f2, { name, position: ps.id, location: loc, shift: input.shift || (loc === H.HQ.id ? 'Kantor' : 'Pagi'), joined: input.from || addDays(TODAY, 1), phone: input.phone || '' }, by, audit, 'Tambah karyawan');
      }
      case 'import-commit': {
        need('people'); if (!['hrd', 'hrd-ops'].includes(role)) throw new Error('Akses ditolak: impor oleh HRD.');
        const batch = input.batch; const rows = JSON.parse(input.rows || '[]');
        if (f2.imports.some(b => b.id === batch)) {
          const prev = f2.imports.find(b => b.id === batch);
          const res = { id: batch + '-R' + (prev.retries = (prev.retries || 0) + 1), batch, at: `${TODAY}`, rows: rows.map(r => ({ ...r, result: 'Dilewati', reason: `Batch ${batch} sudah diimpor (${prev.at})` })), demo: true };
          audit(hr, by, 'Impor ulang', `${batch}: semua baris dilewati, tidak ada profil ganda`, { object: 'Impor', ref: batch });
          f2.lastImport = res; return 'ulang';
        }
        const out = rows.map(r => {
          const v = validateRow(hr, r, rows);
          if (v.length) return { ...r, result: v[0].startsWith('Duplikat') ? 'Dilewati' : 'Gagal', reason: v.join('; ') };
          const id = addEmployee(hr, f2, { name: r.nama, position: posByName(r.posisi).id, location: locByName(r.outlet).id, shift: r.shift || 'Pagi', joined: r.mulai || addDays(TODAY, 1), phone: r.telepon || '', batch }, by, audit, 'Impor karyawan');
          return { ...r, result: 'Berhasil', reason: id };
        });
        f2.imports.push({ id: batch, at: `${TODAY} ${new Date().toTimeString().slice(0, 5)}`, by, rows: out, demo: true });
        f2.lastImport = { id: batch, batch, rows: out };
        audit(hr, by, 'Impor karyawan', `${batch}: ${out.filter(r => r.result === 'Berhasil').length} berhasil, ${out.filter(r => r.result === 'Dilewati').length} dilewati, ${out.filter(r => r.result === 'Gagal').length} gagal`, { object: 'Impor', ref: batch });
        return batch;
      }
      default: throw new Error('Aksi HRD tidak dikenal: ' + action);
    }
  }
  function addEmployee(hr, f2, d, by, audit, label) {
    const id = 'EMP-' + String(f2.seq.emp++).padStart(4, '0');
    const ps = H.pos(d.position);
    hr.people.push({ id, name: d.name, birth: 2000, religion: '—', education: '—', marital: '—', shift: d.shift, gender: 'P', position: ps.id, division: ps.division, level: ps.level, joined: d.joined, contract: 'Probation', status: 'Aktif', thp: ps.thp, phone: d.phone, demo: true, account: true, batch: d.batch || null });
    hr.placements.push({ id: 'PLC-' + id.slice(4), emp: id, entity: d.location === H.HQ.id ? 'ENT-HQ' : 'ENT-SPA', division: ps.division, location: d.location, position: ps.id, from: d.joined, to: null, demo: true });
    hr.accounts.push({ emp: id, role: 'ess', demo: true });
    f2.schedules.push({ id: 'SHF-' + id.slice(4), emp: id, shift: d.shift, off: num(id) % 7, from: d.joined, to: null, kind: 'tetap', demo: true });
    audit(hr, by, label, `${id} · ${d.name} · ${ps.name} · ${H.locName(d.location)} mulai ${d.joined}`, { object: 'Karyawan', ref: id, before: '—', after: `${ps.name} · ${H.locName(d.location)}`, effective: d.joined });
    return id;
  }

  /* ---------- impor ---------- */
  const posByName = (n) => H.POSITIONS.find(p => p.name.toLowerCase() === String(n || '').trim().toLowerCase());
  const locByName = (n) => [...H.OUTLETS, H.HQ].find(o => o.name.toLowerCase() === String(n || '').trim().toLowerCase() || o.id === n);
  const SAMPLE_FILES = {
    'karyawan-baru-nov.csv': 'nama,posisi,outlet,shift,mulai,telepon\nKadek Ayu Lestari,Therapist,Spa Ubud,Pagi,2026-11-20,081200000001\nKomang Sri Wahyuni,Receptionist,Spa Bisma,Sore,2026-11-20,081200000002\nPutu Ari,Therapist,Spa Shanti,Pagi,2026-11-20,081200000003\nGede Surya,Therapist,Spa Sanur,Pagi,2026-11-20,081200000004\nKadek Ayu Lestari,Therapist,Spa Ubud,Pagi,2026-11-20,081200000001',
    'kolom-berbeda.csv': 'Nama Lengkap;Jabatan;Lokasi;Shift;Tgl Mulai;HP\nNyoman Budi Santika;Staf Accounting;Office Ubud;Kantor;2026-11-24;081200000005'
  };
  const FIELDS = [['nama', 'Nama'], ['posisi', 'Posisi'], ['outlet', 'Outlet / lokasi'], ['shift', 'Shift'], ['mulai', 'Tanggal mulai'], ['telepon', 'Telepon']];
  function parseFile(name) {
    const text = SAMPLE_FILES[name]; if (!text) return null;
    const sep = text.split('\n')[0].includes(';') ? ';' : ',';
    const [head, ...lines] = text.split('\n').map(l => l.split(sep));
    return { name, head, rows: lines };
  }
  function validateRow(hr, r, all) {
    const errs = [];
    if (!r.nama || r.nama.trim().length < 3) errs.push('Nama kosong');
    if (!posByName(r.posisi)) errs.push(`Posisi "${r.posisi || ''}" tidak dikenal`);
    if (!locByName(r.outlet)) errs.push(`Outlet "${r.outlet || ''}" tidak dikenal di organisasi`);
    if (r.shift && !SHIFTS[r.shift]) errs.push(`Shift "${r.shift}" tidak dikenal`);
    if (hr.people.some(p => p.name.toLowerCase() === String(r.nama).toLowerCase())) errs.unshift('Duplikat: nama sudah ada di roster');
    else if (all.findIndex(x => x.nama === r.nama && x.telepon === r.telepon) !== all.indexOf(r)) errs.unshift('Duplikat: baris ganda dalam file');
    return errs;
  }

  const purge = (hr) => { if (!hr.f2) return; for (const k of ['schedules', 'ledger', 'clients', 'visits', 'tracks', 'posts', 'imports']) hr.f2[k] = hr.f2[k].filter(x => !x.demo); hr.f2.overrides = {}; hr.f2.lastImport = null; };
  const keep = (hr) => { if (!hr.f2) return null; const k = { seeded: false, overrides: {} }; for (const key of ['schedules', 'ledger', 'clients', 'visits', 'tracks', 'posts', 'imports']) k[key] = hr.f2[key].filter(x => !x.demo); return k; };

  H.EXT.attStatus = attStatus;
  H.EXT.update = (state, hr, action, input, ctx) => update(state, hr, action, input, ctx);
  H.EXT.purge = purge; H.EXT.keep = keep; H.EXT.ensure = ensure;
  return { SITES, RADIUS, OUTSIDE, geo, dist, SHIFTS, DAYS, DOW, LEAVE, FIELDS, SAMPLE_FILES, dow, addDays, ensure, scheduleOn, extrasOn, attendance, attStatus, summary, balance, canDecide, parseFile, validateRow, posByName, locByName, attId };
})();
if (typeof module !== 'undefined') module.exports = HR2;
