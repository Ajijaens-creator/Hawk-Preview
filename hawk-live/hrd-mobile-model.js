/* HAWK Mobile · model M1 (NB Addendum 14 Nov 2026: HAWK Mobile, POS Spa & Presensi) — DATA DEMO / SIMULASI R&D.
   Satu aplikasi untuk semua peran: Beranda, Pekerjaan, Presensi, Inbox, Saya. Presensi memakai catatan resmi F2 yang sama
   (H.EXT.mobileAtt), tugas memakai Task ID F3 yang sama, approval memakai hr.queue + aksi 'decide' F2.
   Wajah (liveness + 1:1), lokasi, jaringan dan jam HP adalah SIMULASI berlabel: tidak ada kamera, GPS, biometrik
   atau server nyata. Status jujur per fitur ada di STATUS. Deterministik, tanpa jaringan. */
const HRM = (() => {
  const H = (typeof HR !== 'undefined') ? HR : require('./hrd-model.js');
  const H2 = (typeof HR2 !== 'undefined') ? HR2 : require('./hrd-f2-model.js');
  const H3 = (typeof HR3 !== 'undefined') ? HR3 : require('./hrd-f3-model.js');
  const TODAY = H.TODAY;
  /* akun demo mobile (Employee ID dari fixture 158; tidak menambah headcount) */
  const ACCOUNTS = [
    { id: 'ayu-indra', emp: 'EMP-0008', role: 'therapist', job: 'Spa Therapist', kind: 'therapist' },
    { id: 'ayu-astiti', emp: 'EMP-0028', role: 'therapist', job: 'Spa Reception', kind: 'reception' },
    { id: 'gede-ari', emp: 'EMP-0002', role: 'therapist', job: 'Spa Attendant', kind: 'attendant', label: 'Skenario peran berlabel: fixture mencatat Therapist, formasi Attendant belum disetujui' },
    { id: 'mila', emp: 'EMP-0153', role: 'outlet-spv', job: 'Spa Supervisor', kind: 'supervisor' },
    { id: 'made', emp: 'EMP-0142', role: 'hrd', job: 'Manager HRD', kind: 'hrd' },
    { id: 'ayu', emp: 'EMP-0143', role: 'hrd-ops', job: 'Admin HRD', kind: 'hrd' }
  ];
  const acc = (id) => ACCOUNTS.find(a => a.id === id);
  const accOfEmp = (emp) => ACCOUNTS.find(a => a.emp === emp);
  /* aturan berversi (asumsi R&D, dikalibrasi di lokasi nyata sebelum pilot) */
  const RULES = { version: 'PRS-RUL v1 (asumsi R&D)', radius: H2.RADIUS, maxAgeMin: 2, maxAccuracyM: 100, skewMin: 5, lateGraceMin: 0 };
  const SIM = {
    face: { ok: 'Wajah cocok', mismatch: 'Wajah tidak cocok', photo: 'Foto/layar (liveness gagal)', old: 'Bukti sesi lama', none: 'Wajah tidak terbaca' },
    loc: { ok: 'Di outlet (±25 m)', outside: 'Di luar radius (420 m)', stale: 'Lokasi lama (9 menit)', approx: 'Lokasi approximate (±900 m)', denied: 'Izin lokasi ditolak' },
    net: { online: 'Online', offline: 'Offline' },
    clock: { ok: 'Jam HP sesuai', skew: 'Jam HP maju 17 menit' }
  };
  const STATUS = [
    ['Lima menu, peran, Beranda, Pekerjaan, Inbox, Saya', 'Visual HTML + simulasi data dummy'],
    ['Presensi wajah/lokasi/jam & pengecualian', 'Simulasi berlabel (tanpa kamera, GPS, liveness atau face matching nyata)'],
    ['Catatan presensi → F2, Supervisor, HRD', 'Simulasi: satu catatan di penyimpanan browser (bukan layanan server)'],
    ['Aplikasi Android/iPhone terpasang', 'Belum: butuh build native (rekomendasi Flutter), signing & distribusi'],
    ['Verifikasi wajah 1:1 + liveness', 'Belum: butuh SDK/penyedia teruji, tata kelola biometrik'],
    ['Notifikasi push, penyimpanan aman, sinkronisasi server', 'Belum: butuh layanan server HAWK'],
    ['Uji perangkat nyata', 'Belum dilakukan']
  ];
  const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const hhmm = (m) => `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;

  /* ---------- seed ---------- */
  const T = (o) => ({ demo: true, contributors: [], checklist: [], discussion: [], assets: [], blocker: null, parent: null, reviewer: null, requireReview: false, sessionAt: null, version: 1, finding: null, prio: 'Sedang', scope: 'OUT-UBD', ws: 'OPS', ...o });
  function seedTasks(hr) {
    const f3 = H3.ensure(hr);
    if (f3.tasks.some(t => t.id === 'TSK-0201')) return;
    f3.tasks.push(
      T({ id: 'TSK-0201', title: 'Siapkan Ruang 3 untuk tamu 10:00 (hot stone)', stage: 'Dikerjakan', pic: 'EMP-0002', due: TODAY, prio: 'Tinggi', source: { type: 'Booking', id: 'BK-1113-014', label: 'Booking BK-1113-014 · 10:00 · Ruang 3', route: 'hrd-mobile' }, checklist: [{ id: 'C1', text: 'Linen bersih & handuk hangat', done: true }, { id: 'C2', text: 'Batu hot stone 50–55°C', done: false }, { id: 'C3', text: 'Aromaterapi & suhu ruang 26°C', done: false }] }),
      T({ id: 'TSK-0202', title: 'Persiapan treatment Balinese 90 menit · BK-1113-014', stage: 'Priority', pic: 'EMP-0008', due: TODAY, source: { type: 'Booking', id: 'BK-1113-014', label: 'Booking BK-1113-014', route: 'hrd-mobile' }, checklist: [{ id: 'C1', text: 'Baca catatan layanan tamu (alergi: tidak ada)', done: false }, { id: 'C2', text: 'Cek minyak pijat & aromaterapi', done: false }] }),
      T({ id: 'TSK-0203', title: 'Serah terima shift Pagi → Sore (reception)', stage: 'Workplan', pic: 'EMP-0028', due: TODAY, checklist: [{ id: 'C1', text: 'Rekap reservasi sore', done: false }, { id: 'C2', text: 'Kas kecil & struk POS (simulasi)', done: false }] }),
      T({ id: 'TSK-0204', title: 'AC Ruang 2 meneteskan air', stage: 'Issue', pic: 'EMP-0002', due: null, prio: 'Tinggi' }),
      T({ id: 'TSK-0205', title: 'Coaching teknik hot stone · Ayu Indra', stage: 'Workplan', ws: 'HG', pic: 'EMP-0008', contributors: ['EMP-0153'], due: '2026-11-18', sessionAt: '2026-11-18 14:00' })
    );
    f3.focus.push({ emp: 'EMP-0008', task: 'TSK-0202', date: TODAY }, { emp: 'EMP-0002', task: 'TSK-0201', date: TODAY }, { emp: 'EMP-0028', task: 'TSK-0203', date: TODAY }, { emp: 'EMP-0153', task: 'TSK-0201', date: TODAY });
  }
  function seed(hr) {
    const ubud = hr.people.filter(p => (H.placementOn(hr, p.id) || {}).location === 'OUT-UBD').map(p => p.id);
    const hrd = ['EMP-0142', 'EMP-0143', 'EMP-0144', 'EMP-0145'];
    return {
      seeded: true, clock: '08:52', punches: [], consent: {}, ops: { svc: {}, guests: {}, rooms: { R1: 'Siap', R2: 'Perlu perbaikan', R3: 'Dibersihkan', R4: 'Siap', R5: 'Perlu linen' } }, seq: { prs: 1, msg: 100, req: 1 },
      chats: [
        { id: 'ANN', name: 'Pengumuman JAENS', kind: 'Pengumuman', members: 'all', post: ['EMP-0142', 'EMP-0143'] },
        { id: 'GRP-UBD', name: 'Tim Spa Ubud', kind: 'Grup outlet', members: [...ubud, 'EMP-0153', 'EMP-0151'] },
        { id: 'GRP-HRD', name: 'Tim HRD', kind: 'Grup divisi', members: hrd },
        { id: 'DM-0008-0153', name: null, kind: 'Pribadi', members: ['EMP-0008', 'EMP-0153'] }
      ],
      msgs: [
        { id: 'MSG-001', conv: 'ANN', from: 'EMP-0142', at: '2026-11-12 16:00', text: 'Mulai Senin presensi memakai HAWK Mobile (uji R&D). Bila kamera/GPS bermasalah, pakai tombol "Ajukan presensi dengan pemeriksaan".', status: 'Terkirim' },
        { id: 'MSG-002', conv: 'GRP-UBD', from: 'EMP-0153', at: `${TODAY} 07:45`, text: 'Pagi tim. Tamu VIP 10:00 di Ruang 3 (hot stone). @Gede Ari tolong cek suhu batu.', status: 'Terkirim' },
        { id: 'MSG-003', conv: 'GRP-UBD', from: 'EMP-0002', at: `${TODAY} 07:52`, text: 'Siap Bu. AC Ruang 2 netes lagi, mohon dicek teknisi.', status: 'Terkirim' },
        { id: 'MSG-004', conv: 'DM-0008-0153', from: 'EMP-0153', at: `${TODAY} 07:30`, text: 'Ayu, hari ini kamu pegang tamu BK-1113-014 jam 10:00 ya.', status: 'Terkirim' },
        { id: 'MSG-005', conv: 'GRP-HRD', from: 'EMP-0145', at: `${TODAY} 08:10`, text: '3 kandidat therapist Ubud konfirmasi interview Senin 10:00.', status: 'Terkirim' }
      ]
    };
  }
  function ensure(hr) {
    if (!hr.mob || !hr.mob.seeded) hr.mob = seed(hr);
    seedTasks(hr);
    if (H3.WS && !H3.WS.OPS) H3.WS.OPS = { id: 'OPS', name: 'Operasional Spa', lead: 'EMP-0153' };
    return hr.mob;
  }

  /* ---------- presensi ---------- */
  const reqOf = (hr, p) => p.reqId ? hr.queue.find(q => q.id === p.reqId) : null;
  /* status tampil: Terverifikasi | Menunggu sinkronisasi | Perlu pemeriksaan | Ditolak (dari keputusan reviewer) */
  function pStatus(hr, p) {
    if (p.status === 'Menunggu sinkronisasi') return 'Menunggu sinkronisasi';
    const q = reqOf(hr, p);
    if (q && q.status === 'Disetujui') return 'Terverifikasi';
    if (q && q.status === 'Ditolak') return 'Ditolak';
    return p.status;
  }
  const punchesOf = (hr, emp, date = TODAY) => ensure(hr).punches.filter(p => p.emp === emp && p.date === date);
  const timeOf = (p) => p.serverAt || p.deviceAt;
  /* digabung ke catatan F2 (satu catatan untuk karyawan, Supervisor dan HRD) */
  function mobileAtt(hr, emp, date, rec, s1) {
    if (!hr.mob) return rec;
    const ps = hr.mob.punches.filter(p => p.emp === emp && p.date === date && pStatus(hr, p) !== 'Ditolak');
    if (!ps.length) return rec;
    const r = { ...rec }, pin = ps.find(p => p.kind === 'in'), pout = [...ps].reverse().find(p => p.kind === 'out');
    const ok = (p) => pStatus(hr, p) === 'Terverifikasi';
    if (pin) { r.in = timeOf(pin); r.late = Math.max(0, mins(r.in) - s1 - RULES.lateGraceMin); r.evidence = `HAWK Mobile · ${pin.id} · wajah 1:1 + lokasi (simulasi)`; r.status = ok(pin) ? (r.late ? 'Terlambat' : 'Hadir') : 'Perlu Pemeriksaan'; }
    if (pout) r.out = timeOf(pout);
    let br = 0, open = null; ps.forEach(p => { if (p.kind === 'break') open = mins(timeOf(p)); if (p.kind === 'resume' && open !== null) { br += mins(timeOf(p)) - open; open = null; } });
    if (br) r.breakMin = br;
    r.provisional = r.provisional || ps.some(p => !ok(p));
    r.mobile = ps.map(p => ({ id: p.id, kind: p.kind, status: pStatus(hr, p) }));
    return r;
  }
  /* siklus kerja: Belum masuk → Bekerja ↔ Istirahat → Selesai kerja */
  function phase(hr, emp) {
    const a = H2.attendance(hr, emp, TODAY), ps = punchesOf(hr, emp).filter(p => pStatus(hr, p) !== 'Ditolak');
    const last = ps[ps.length - 1], pending = ps.some(p => pStatus(hr, p) !== 'Terverifikasi');
    let ph = 'Belum masuk';
    if (a.out) ph = 'Selesai kerja'; else if (a.in) ph = last && last.kind === 'break' ? 'Istirahat' : 'Bekerja';
    if (['Libur', 'Cuti', 'Sakit'].includes(a.status)) ph = a.status;
    return { phase: ph, pending, att: a, shift: a.shift, hours: H2.SHIFTS[a.shift] || null };
  }
  const NEXT = { 'Belum masuk': ['in'], Bekerja: ['break', 'out'], Istirahat: ['resume'], 'Selesai kerja': [] };
  const KIND = { in: 'Check-in kerja', out: 'Check-out kerja', break: 'Mulai istirahat', resume: 'Selesai istirahat' };
  function siteOf(hr, emp) { const pl = H.placementOn(hr, emp); const id = pl && H2.SITES[pl.location] ? pl.location : 'LOC-HQ'; return { id, ...H2.SITES[id] }; }
  /* hasil pemeriksaan simulasi: alasan dicatat, tidak ada kesimpulan kecurangan dari satu sinyal, tidak ada penolakan otomatis */
  function evaluate(sim) {
    const reasons = [], face = sim.face || 'ok', loc = sim.loc || 'ok';
    const check = { liveness: 'Lolos (simulasi)', match: 'Cocok 1:1 (simulasi)', location: null, accuracy: 18, ageMin: 0, dist: 25 };
    if (face === 'mismatch') { check.match = 'Tidak cocok (simulasi)'; reasons.push('Wajah tidak cocok dengan profil Employee ID ini'); }
    if (face === 'photo') { check.liveness = 'Gagal: indikasi foto/layar (simulasi)'; check.match = 'Tidak dinilai'; reasons.push('Liveness gagal: kemungkinan foto atau layar'); }
    if (face === 'old') { check.liveness = 'Ditolak: bukti dari sesi lama'; check.match = 'Tidak dinilai'; reasons.push('Bukti wajah bukan dari sesi presensi ini'); }
    if (face === 'none') { check.liveness = 'Wajah tidak terbaca'; check.match = 'Tidak dinilai'; reasons.push('Wajah tidak terbaca kamera'); }
    if (loc === 'outside') { check.dist = 420; reasons.push(`Di luar radius ${RULES.radius} m (420 m dari titik kerja)`); }
    if (loc === 'stale') { check.ageMin = 9; reasons.push(`Titik lokasi berumur 9 menit (maks ${RULES.maxAgeMin} menit)`); }
    if (loc === 'approx') { check.accuracy = 900; check.dist = null; reasons.push(`Akurasi lokasi ±900 m (batas ${RULES.maxAccuracyM} m); radius tidak diperbesar otomatis`); }
    if (loc === 'denied') { check.accuracy = null; check.dist = null; check.ageMin = null; reasons.push('Izin lokasi ditolak di perangkat'); }
    if (sim.clock === 'skew') reasons.push('Jam HP berbeda 17 menit dari waktu server; waktu server yang dipakai');
    check.location = check.dist === null ? 'Tidak tersedia' : `${check.dist} m dari titik kerja · akurasi ±${check.accuracy} m · umur ${check.ageMin} mnt`;
    return { reasons, check };
  }

  /* ---------- aksi ---------- */
  function update(state, hr, action, input, ctx) {
    if (!/^m-/.test(action)) return undefined;
    const m = ensure(hr), { audit } = ctx;
    const a = acc(input.account); if (!a) throw new Error('Akun HAWK Mobile tidak dikenal.');
    if (a.role !== ctx.role) throw new Error('Akses ditolak: sesi tidak cocok dengan role akun.');
    const me = a.emp, name = (hr.people.find(p => p.id === me) || {}).name || me, by = `${name} (${a.job})`;
    /* aksi F2/F3 yang ada dijalankan sebagai akun ini (identitas = Employee ID akun) */
    const asMe = (act, inp) => { const keep = hr.roleEmp[a.role]; hr.roleEmp[a.role] = me; try { return H.EXT.update(state, hr, act, inp, { ...ctx, by }); } finally { hr.roleEmp[a.role] = keep; } };
    const newReq = (type, payload, note) => {
      const pol = hr.settings.approval.find(x => x.id === 'APR-ATT');
      const q = { id: 'REQ-M' + String(m.seq.req++).padStart(3, '0'), emp: me, type, date: TODAY, note, status: 'Menunggu Persetujuan', policy: pol.id, created: `${TODAY} ${m.clock}`, stage: 0, stages: pol.chain.map(label => ({ label, decision: null, by: null, at: null, reason: null })), payload, demo: true, via: 'HAWK Mobile' };
      hr.queue.unshift(q); audit(hr, by, 'Pengajuan dibuat', `${q.id} · ${type} · ${me} (HAWK Mobile)`, { object: 'Pengajuan', ref: q.id, before: '—', after: 'Menunggu Persetujuan' });
      return q;
    };
    switch (action) {
      case 'm-clock': {
        if (!/^\d{2}:\d{2}$/.test(input.time || '')) throw new Error('Jam demo HH:MM.');
        m.clock = input.time; return m.clock;
      }
      case 'm-consent': { m.consent[me] = `${TODAY} ${m.clock}`; return 'Pemberitahuan kamera & lokasi diterima'; }
      case 'm-punch': {
        const kind = input.kind; if (!KIND[kind]) throw new Error('Jenis aksi presensi tidak dikenal.');
        const req = String(input.req || ''); if (!req) throw new Error('Permintaan tanpa ID sesi.');
        const dup = m.punches.find(p => p.req === req); if (dup) return dup.id; /* tombol ganda / ulang setelah putus = satu kejadian */
        const ph = phase(hr, me);
        if (!NEXT[ph.phase] || !NEXT[ph.phase].includes(kind)) {
          if (kind === 'out' && ph.phase === 'Belum masuk') throw new Error('Check-out tanpa check-in: ajukan koreksi presensi.');
          throw new Error(`${KIND[kind]} tidak tersedia saat status "${ph.phase}".`);
        }
        if (!m.consent[me]) throw new Error('Baca dan setujui pemberitahuan kamera & lokasi dulu, atau pakai jalur pemeriksaan.');
        const site = siteOf(hr, me), id = `PRS-${TODAY.replace(/-/g, '')}-${me.slice(4)}-${String(m.seq.prs++).padStart(2, '0')}`;
        const deviceAt = input.clock === 'skew' ? hhmm(mins(m.clock) + 17) : m.clock;
        const base = { id, req, emp: me, att: H2.attId(me, TODAY), date: TODAY, kind, site: site.id, shift: ph.shift, deviceAt, captureAt: m.clock, zone: 'WITA', rules: RULES.version, sim: { face: input.face || 'ok', loc: input.loc || 'ok', net: input.net || 'online', clock: input.clock || 'ok' } };
        if (input.net === 'offline') {
          Object.assign(base, { serverAt: null, status: 'Menunggu sinkronisasi', reasons: ['Disimpan aman di perangkat saat offline; liveness belum dijalankan (belum diverifikasi)'], check: null });
          m.punches.push(base); return id;
        }
        const ev = evaluate(input);
        Object.assign(base, { serverAt: m.clock, status: ev.reasons.length ? 'Perlu pemeriksaan' : 'Terverifikasi', reasons: ev.reasons, check: ev.check });
        m.punches.push(base);
        if (ev.reasons.length) base.reqId = newReq('Pemeriksaan presensi', { att: base.att, punch: id, kind, time: base.serverAt, reasons: ev.reasons }, `${KIND[kind]} ${base.serverAt} · ${ev.reasons[0]}`).id;
        audit(hr, by, KIND[kind], `${id} · ${base.status} · ${H.locName(site.id) || site.name}`, { object: 'Presensi', ref: base.att, before: ph.phase, after: base.status });
        return id;
      }
      case 'm-sync': {
        const pend = m.punches.filter(p => p.emp === me && p.status === 'Menunggu sinkronisasi');
        if (input.net === 'offline') throw new Error('Masih offline. Pengajuan tetap tersimpan di antrean perangkat.');
        pend.forEach(p => {
          p.status = 'Perlu pemeriksaan'; p.serverAt = null; p.receivedAt = m.clock; p.synced = true;
          p.reasons = ['Dikirim saat offline: waktu kejadian dari HP belum dapat dipercaya (waktu unggah bukan waktu kedatangan)', 'Liveness tidak dijalankan saat offline'];
          p.reqId = newReq('Pemeriksaan presensi', { att: p.att, punch: p.id, kind: p.kind, time: p.deviceAt, reasons: p.reasons }, `${KIND[p.kind]} ${p.deviceAt} (offline) · perlu pemeriksaan`).id;
        });
        return pend.length ? `${pend.length} kejadian tersinkron, menunggu pemeriksaan` : 'Tidak ada antrean';
      }
      case 'm-exception': {
        const kind = input.kind || 'in';
        if (String(input.reason || '').trim().length < 5) throw new Error('Tulis alasan minimal 5 karakter.');
        const ph = phase(hr, me);
        if (!NEXT[ph.phase] || !NEXT[ph.phase].includes(kind)) throw new Error(`${KIND[kind]} tidak tersedia saat status "${ph.phase}".`);
        const req = String(input.req || ''); const dup = req && m.punches.find(p => p.req === req); if (dup) return dup.id;
        const id = `PRS-${TODAY.replace(/-/g, '')}-${me.slice(4)}-${String(m.seq.prs++).padStart(2, '0')}`;
        const p = { id, req: req || id, emp: me, att: H2.attId(me, TODAY), date: TODAY, kind, site: siteOf(hr, me).id, shift: ph.shift, deviceAt: m.clock, captureAt: m.clock, serverAt: m.clock, zone: 'WITA', rules: RULES.version, status: 'Perlu pemeriksaan', reasons: [`Diajukan dengan pemeriksaan: ${String(input.reason).trim()}`], check: null, manual: true };
        m.punches.push(p);
        p.reqId = newReq('Pemeriksaan presensi', { att: p.att, punch: id, kind, time: m.clock, reasons: p.reasons }, `${KIND[kind]} ${m.clock} · ${String(input.reason).trim()}`).id;
        return id;
      }
      case 'm-decide': return asMe('decide', { id: input.id, decision: input.decision, reason: input.reason });
      case 'm-leave': return asMe('leave-request', { emp: me, cat: input.cat, from: input.from, to: input.to, reason: input.reason });
      case 'm-correct': return asMe('att-correct', { emp: me, date: input.date, in: input.in, out: input.out, reason: input.reason });
      case 'm-task-move': return asMe('task-move', { id: input.id, to: input.to, via: 'HAWK Mobile' });
      case 'm-task-check': return asMe('task-check', { id: input.id, item: input.item });
      case 'm-chat-send': {
        const c = m.chats.find(x => x.id === input.conv); if (!c || !canSee(c, me)) throw new Error('Percakapan tidak tersedia untuk akun ini.');
        if (c.post && !c.post.includes(me)) throw new Error('Hanya admin pengumuman yang dapat mengirim di kanal ini.');
        const text = String(input.text || '').trim(); if (!text) throw new Error('Pesan kosong.');
        const msg = { id: 'MSG-' + m.seq.msg++, conv: c.id, from: me, at: `${TODAY} ${m.clock}`, text, status: input.net === 'offline' ? 'Mengantre' : 'Terkirim' };
        m.msgs.push(msg); return msg.id;
      }
      case 'm-chat-flush': { const q = m.msgs.filter(x => x.from === me && x.status === 'Mengantre'); q.forEach(x => { x.status = 'Terkirim'; }); return `${q.length} pesan terkirim`; }
      case 'm-chat-task': {
        const msg = m.msgs.find(x => x.id === input.msg); if (!msg) throw new Error('Pesan tidak ditemukan.');
        const c = m.chats.find(x => x.id === msg.conv); if (!canSee(c, me)) throw new Error('Akses ditolak.');
        const id = asMe('task-create', { ws: c.id === 'GRP-HRD' ? 'HRD' : 'OPS', stage: 'Issue', title: msg.text.slice(0, 70), scope: c.id === 'GRP-UBD' ? 'OUT-UBD' : 'LOC-HQ', sourceId: msg.id, sourceType: 'Chat', sourceLabel: `Chat ${c.name || 'pribadi'} · ${msg.id}` });
        msg.task = id; return id;
      }
      case 'm-ops': {
        const ph = phase(hr, me);
        if (input.op === 'svc-start' || input.op === 'svc-done') {
          if (a.kind !== 'therapist') throw new Error('Hanya therapist yang ditugaskan.');
          if (ph.phase !== 'Bekerja') throw new Error('Mulai treatment hanya saat status Bekerja (sudah check-in kerja).');
          const s = m.ops.svc[input.ref] || {}; if (input.op === 'svc-start') { if (s.start) return input.ref; s.start = m.clock; } else { if (!s.start) throw new Error('Mulai treatment dulu.'); s.done = s.done || m.clock; }
          m.ops.svc[input.ref] = s; return `SVC-${input.ref.slice(3)} ${input.op === 'svc-start' ? 'mulai' : 'selesai'} ${m.clock}`;
        }
        if (input.op === 'guest-in' || input.op === 'pos-close') {
          if (a.kind !== 'reception') throw new Error('Aksi reception: akun ini tidak punya izin.');
          const g = m.ops.guests[input.ref] || {};
          if (input.op === 'guest-in') g.in = g.in || m.clock; else { if (!(m.ops.svc[input.ref] || {}).done) throw new Error('Treatment belum selesai di catatan therapist.'); g.paid = g.paid || `${m.clock} · POS simulasi`; }
          m.ops.guests[input.ref] = g; return input.op === 'guest-in' ? `Check-in tamu ${input.ref}` : `Transaksi POS ${input.ref} ditutup (simulasi)`;
        }
        if (input.op === 'room') {
          if (!['attendant', 'supervisor'].includes(a.kind)) throw new Error('Kesiapan ruangan: akun ini tidak punya izin.');
          if (!m.ops.rooms[input.ref]) throw new Error('Ruangan tidak dikenal.');
          m.ops.rooms[input.ref] = input.to; return `${input.ref}: ${input.to}`;
        }
        throw new Error('Aksi operasional tidak dikenal.');
      }
      case 'm-reset': {
        if (!['hrd', 'hrd-ops', 'outlet-spv'].includes(a.role) && !input.any) throw new Error('Reset data mobile hanya dari simulator.');
        hr.queue = hr.queue.filter(q => q.via !== 'HAWK Mobile');
        const f3 = H3.ensure(hr); f3.tasks = f3.tasks.filter(t => !/^TSK-02\d\d$/.test(t.id) && !(t.source && /^MSG-/.test(t.source.id || ''))); f3.focus = f3.focus.filter(f => !/^TSK-02\d\d$/.test(f.task));
        delete hr.mob; ensure(hr); return 'Data HAWK Mobile dikembalikan';
      }
    }
    return undefined;
  }
  const canSee = (c, me) => c.members === 'all' || c.members.includes(me);
  const chatsOf = (hr, me) => ensure(hr).chats.filter(c => canSee(c, me));

  const prev = { update: H.EXT.update, ensure: H.EXT.ensure };
  H.EXT.update = (state, hr, action, input, ctx) => { const r = update(state, hr, action, input, ctx); return r !== undefined ? r : prev.update ? prev.update(state, hr, action, input, ctx) : undefined; };
  H.EXT.ensure = (hr) => { prev.ensure?.(hr); ensure(hr); };
  H.EXT.mobileAtt = mobileAtt;
  return { ACCOUNTS, acc, accOfEmp, RULES, SIM, STATUS, KIND, NEXT, ensure, phase, punchesOf, pStatus, siteOf, evaluate, chatsOf, canSee };
})();
if (typeof module !== 'undefined') module.exports = HRM;
