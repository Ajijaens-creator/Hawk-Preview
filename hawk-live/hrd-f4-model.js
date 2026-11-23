/* JAENS ERP · Portal HRD · model F4 Rekrutmen sampai Penempatan — DATA DEMO / SIMULASI.
   Permintaan tenaga → lowongan (publik) → lamaran → screening (simulasi AI, bukti per kriteria) → klarifikasi (kartu F3) →
   shortlist → interview (Event ID stabil) → uji praktik (rubric per posisi) → keputusan → penawaran → kontrak & dokumen →
   konversi profil (Employee ID F2, mulai efektif) → onboarding (template F3) → penempatan & akun (role F1).
   Memakai hr.vacancies F1 (ID sama). Memperluas HR.EXT. Deterministik, tanpa jaringan. */
const HR4 = (() => {
  const H = (typeof HR !== 'undefined') ? HR : require('./hrd-model.js');
  const TODAY = H.TODAY;
  const now = () => `${TODAY} ${new Date().toTimeString().slice(0, 5)}`;
  const addDays = (d, n) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  const STAGES = ['Lamaran Masuk', 'Screening', 'Klarifikasi', 'Shortlist', 'Interview', 'Uji Praktik', 'Keputusan', 'Penawaran & Kontrak', 'Onboarding', 'Penempatan Aktif'];
  const ENDS = ['Ditolak', 'Batal', 'Mengundurkan diri'];
  const CHANNELS = { WEB: 'Website karier', IG: 'Instagram', QR: 'QR di outlet', REF: 'Referensi karyawan', WA: 'WhatsApp' };
  /* template formulir & kriteria per posisi (versi kriteria disimpan pada lowongan) */
  const FORMS = {
    'POS-THR': { name: 'Spa Therapist', q: [['techniques', 'Teknik treatment yang dikuasai', 'text'], ['years', 'Pengalaman (tahun) untuk teknik utama', 'number'], ['cert', 'Sertifikasi terapis (nama/nomor)', 'text'], ['sessions', 'Kapasitas sesi per shift', 'number'], ['lang', 'Bahasa', 'text'], ['outletPref', 'Preferensi outlet', 'text'], ['situational', 'Apa yang Anda lakukan bila tekanan pijat membuat tamu tidak nyaman?', 'textarea']],
      criteria: [['C1', 'Pengalaman ≥ 1 tahun teknik utama', (a) => a.years === '' || a.years === undefined ? null : Number(a.years) >= 1], ['C2', 'Sertifikasi terapis', (a) => a.cert ? true : null], ['C3', 'Kapasitas ≥ 4 sesi per shift', (a) => a.sessions === '' || a.sessions === undefined ? null : Number(a.sessions) >= 4], ['C4', 'Bahasa Inggris dasar', (a) => a.lang ? /inggris|english/i.test(a.lang) : null], ['C5', 'Siap shift Pagi/Sore', (a) => a.shiftReady ? a.shiftReady !== 'Tidak' : null], ['C6', 'Respons situasional berorientasi tamu', (a) => !a.situational ? null : /tanya|hentikan|kurangi|sesuaikan|nyaman/i.test(a.situational)]],
      rubric: ['Demonstrasi teknik (Balinese / hot stone)', 'Kebersihan & persiapan ruang', 'Komunikasi dengan tamu', 'Ketepatan durasi'] },
    'POS-RCP': { name: 'Spa Receptionist', q: [['frontdesk', 'Pengalaman front desk (tahun)', 'number'], ['volume', 'Volume reservasi per hari yang pernah ditangani', 'number'], ['pos', 'Sistem booking/POS yang pernah dipakai', 'text'], ['lang', 'Bahasa', 'text'], ['situational', 'Dua tamu memesan slot yang sama. Apa langkah Anda?', 'textarea']],
      criteria: [['C1', 'Pengalaman front desk ≥ 1 tahun', (a) => a.frontdesk === '' || a.frontdesk === undefined ? null : Number(a.frontdesk) >= 1], ['C2', 'Pernah memakai booking/POS', (a) => a.pos ? true : null], ['C3', 'Bahasa Inggris', (a) => a.lang ? /inggris|english/i.test(a.lang) : null], ['C4', 'Siap shift Pagi/Sore', (a) => a.shiftReady ? a.shiftReady !== 'Tidak' : null], ['C5', 'Respons situasional (slot ganda)', (a) => !a.situational ? null : /tawarkan|alternatif|maaf|jadwal ulang|cek/i.test(a.situational)]],
      rubric: ['Simulasi reservasi', 'Penanganan tamu', 'Pencatatan transaksi POS', 'Bahasa & sikap'] },
    GEN: { name: 'Posisi lain', q: [['exp', 'Pengalaman relevan (tahun)', 'number'], ['portfolio', 'Tautan portofolio / contoh kerja', 'text'], ['situational', 'Ceritakan satu hasil kerja terbaik Anda', 'textarea']],
      criteria: [['C1', 'Pengalaman relevan ≥ 1 tahun', (a) => a.exp === '' || a.exp === undefined ? null : Number(a.exp) >= 1], ['C2', 'Bukti kerja / portofolio', (a) => a.portfolio ? true : null], ['C3', 'Siap mulai ≤ 30 hari', (a) => a.startReady ? a.startReady <= addDays(TODAY, 30) : null]],
      rubric: ['Kompetensi teknis', 'Contoh kerja', 'Komunikasi', 'Kecocokan tim'] }
  };
  const formOf = (position) => FORMS[position] || FORMS.GEN;
  const EXCLUDED = ['Foto', 'KTP', 'Ciri tulisan tangan', 'Asesmen kepribadian'];

  function seed(hr) {
    const vac = (o) => ({ demo: true, criteriaVersion: 1, channels: ['WEB', 'IG', 'QR'], shift: 'Pagi/Sore', ...o });
    /* vacancies F1 diperkaya, ID tetap */
    const v1 = hr.vacancies.find(v => v.id === 'VAC-2611-001'), v2 = hr.vacancies.find(v => v.id === 'VAC-2611-002');
    if (v1) Object.assign(v1, vac({ position: 'POS-THR', req: 'REQ-HR-2611-001', status: 'Dipublikasikan', published: '2026-11-08', resp: 'Melayani 4–6 treatment per shift sesuai SOP JAENS; menjaga kebersihan ruang; mencatat layanan di POS.' }));
    if (v2) Object.assign(v2, vac({ position: 'POS-RCP', req: 'REQ-HR-2611-002', status: 'Dipublikasikan', published: '2026-11-05', resp: 'Reservasi, check-in tamu, pembayaran di POS, koordinasi jadwal therapist.' }));
    if (!hr.vacancies.some(v => v.id === 'VAC-2610-009')) hr.vacancies.push(vac({ id: 'VAC-2610-009', title: 'Therapist', position: 'POS-THR', location: 'OUT-SHT', count: 1, status: 'Ditutup', source: 'Pengganti resign Okt', published: '2026-10-01', closed: '2026-10-25', resp: 'Lowongan Oktober (sudah ditutup).' }));
    if (!hr.vacancies.some(v => v.id === 'VAC-2611-003')) hr.vacancies.push(vac({ id: 'VAC-2611-003', title: 'Content Creator', position: 'POS-CRT', location: 'LOC-HQ', count: 1, status: 'Draf', req: 'REQ-HR-2611-003', source: 'Rencana konten 2027', channels: ['WEB'], shift: 'Kantor', resp: 'Produksi konten foto/video treatment.' }));
    const reqs = [
      { id: 'REQ-HR-2611-001', outlet: 'OUT-UBD', position: 'POS-THR', count: 3, shift: 'Pagi/Sore', skills: 'Balinese massage, hot stone', pic: 'EMP-0145', status: 'Disetujui', source: 'Utility Spa Ubud 106% (F5)', task: null, approvals: [{ stage: 'Operational Manager', by: 'Eni Restini (Operational Manager)', at: '2026-11-07 10:00' }, { stage: 'Manager HRD', by: 'Made Gunarsa (Manager HRD)', at: '2026-11-07 14:00' }], vacancy: 'VAC-2611-001', criteriaVersion: 1, demo: true },
      { id: 'REQ-HR-2611-002', outlet: 'OUT-BSM', position: 'POS-RCP', count: 1, shift: 'Sore', skills: 'Front desk, POS', pic: 'EMP-0145', status: 'Disetujui', source: 'Pengganti resign', task: null, approvals: [{ stage: 'Operational Manager', by: 'Eni Restini (Operational Manager)', at: '2026-11-04 09:00' }, { stage: 'Manager HRD', by: 'Made Gunarsa (Manager HRD)', at: '2026-11-04 11:00' }], vacancy: 'VAC-2611-002', criteriaVersion: 1, demo: true },
      { id: 'REQ-HR-2611-003', outlet: 'LOC-HQ', position: 'POS-CRT', count: 1, shift: 'Kantor', skills: 'Video, editing', pic: 'EMP-0145', status: 'Disetujui', source: 'Rencana konten 2027', task: null, approvals: [{ stage: 'Manager divisi', by: 'Gede Arsana C (Marketing Manager)', at: '2026-11-10 09:00' }, { stage: 'Manager HRD', by: 'Made Gunarsa (Manager HRD)', at: '2026-11-10 15:00' }], vacancy: 'VAC-2611-003', criteriaVersion: 1, demo: true }
    ];
    const C = (id, name, email, phone) => ({ id, name, email, phone, demo: true });
    const candidates = [C('CAN-0001', 'Ni Kadek Sekar Arum', 'sekar.arum@example.invalid', '0812-1000-0001'), C('CAN-0002', 'I Made Bayu Pramana', 'bayu.p@example.invalid', '0812-1000-0002'), C('CAN-0003', 'Ni Putu Ayu Kirana', 'ayu.kirana@example.invalid', '0812-1000-0003'), C('CAN-0004', 'Ni Wayan Melati Sari', 'melati@example.invalid', '0812-1000-0004'), C('CAN-0005', 'I Komang Dharma Yasa', 'dharma@example.invalid', '0812-1000-0005'), C('CAN-0006', 'Ni Luh Gita Pertiwi', 'gita@example.invalid', '0812-1000-0006')];
    const A = (id, cand, vac, stage, answers, extra = {}) => ({ id, cand, vac, channel: extra.channel || 'WEB', sourceAnswer: extra.sourceAnswer || 'Instagram JAENS', answers, docs: extra.docs || [{ id: `DOC-${id}-CV`, kind: 'CV', name: 'cv.pdf (sintetis)' }], submittedAt: extra.at || '2026-11-10 09:00', stage, history: [{ at: extra.at || '2026-11-10 09:00', by: 'Kandidat', from: null, to: 'Lamaran Masuk', reason: 'Dikirim dari formulir publik' }], screening: null, interview: null, rubric: null, decision: null, offer: null, contract: null, emp: null, onboarding: null, placement: null, clarify: [], submitKey: id, demo: true, ...(extra.more || {}) });
    const thrOk = { techniques: 'Balinese massage, hot stone, reflexology', years: '3', cert: 'LSP Spa Therapist 2023', sessions: '5', lang: 'Indonesia, Inggris', outletPref: 'Spa Ubud', shiftReady: 'Pagi/Sore', situational: 'Saya tanya kenyamanan tamu, kurangi tekanan dan sesuaikan teknik.', salary: '3000000', startReady: '2026-12-01', ivPref: '2026-11-17 10:00' };
    const apps = [
      A('APP-2611-0001', 'CAN-0001', 'VAC-2611-001', 'Shortlist', thrOk, { channel: 'IG', more: {} }),
      A('APP-2611-0002', 'CAN-0002', 'VAC-2611-001', 'Lamaran Masuk', { ...thrOk, years: '1', cert: '', sessions: '4', lang: 'Indonesia', situational: 'Lanjutkan saja sesuai SOP.' }, { channel: 'QR', sourceAnswer: 'Poster di outlet' }),
      A('APP-2611-0003', 'CAN-0003', 'VAC-2611-001', 'Interview', { ...thrOk, years: '2', sessions: '6' }, { channel: 'WEB' }),
      A('APP-2611-0004', 'CAN-0004', 'VAC-2611-002', 'Screening', { frontdesk: '2', volume: '40', pos: 'Moka POS', lang: 'Indonesia, Inggris', shiftReady: 'Sore', situational: 'Minta maaf, cek jadwal, tawarkan alternatif slot terdekat.', salary: '3200000', startReady: '2026-12-01' }, { channel: 'WEB' }),
      A('APP-2611-0005', 'CAN-0003', 'VAC-2611-002', 'Lamaran Masuk', { frontdesk: '', volume: '', pos: '', lang: 'Indonesia, Inggris', shiftReady: 'Pagi/Sore', situational: 'Cek jadwal lalu tawarkan alternatif.', startReady: '2026-12-01' }, { channel: 'WEB', at: '2026-11-11 08:00' }),
      A('APP-2611-0006', 'CAN-0005', 'VAC-2611-001', 'Ditolak', { ...thrOk, years: '0', cert: '', sessions: '2' }, { channel: 'WA' })
    ];
    apps[5].history.push({ at: '2026-11-11 10:00', by: 'Harja (Koordinator Rekrutmen)', from: 'Screening', to: 'Ditolak', reason: 'Belum memenuhi pengalaman minimum' });
    return { seeded: true, reqs, candidates, apps, seq: { req: 10, vac: 10, app: 100, cand: 100, iv: 100, offer: 100, ctr: 100, evt: 1000 } };
  }
  function ensure(hr) {
    if (hr.f2 && hr.f2.f4) { hr.f4 = hr.f2.f4; delete hr.f2.f4; }
    if (!hr.f4 || !hr.f4.seeded) {
      const keep = hr.f4; hr.f4 = seed(hr);
      hr.f4.apps.forEach(a => { if (['Shortlist', 'Interview', 'Screening'].includes(a.stage) || a.stage === 'Ditolak') runScreen(hr, a, 'Seed fixture'); });
      const a3 = hr.f4.apps.find(a => a.id === 'APP-2611-0003'); if (a3) a3.interview = { id: 'IV-2611-0001', eventId: 'GCAL-EVT-0001', slot: '2026-11-16 10:00', interviewers: ['EMP-0145', 'EMP-0153'], status: 'Dikonfirmasi', sync: 'OK', meet: 'https://meet.example.invalid/abc-defg-hij', history: [{ at: '2026-11-12 09:00', by: 'Harja (Koordinator Rekrutmen)', slot: '2026-11-16 10:00', note: 'Dijadwalkan' }] };
      hr.f4.apps.forEach(a => { if (!a.screening) a.screening = { status: 'Menunggu', version: 1, runs: 0 }; });
      if (keep) for (const k of ['reqs', 'candidates', 'apps']) hr.f4[k].push(...(keep[k] || []));
    }
    return hr.f4;
  }
  const vacOf = (hr, id) => hr.vacancies.find(v => v.id === id);
  const reqOf = (hr, id) => ensure(hr).reqs.find(r => r.id === id);
  const appOf = (hr, id) => ensure(hr).apps.find(a => a.id === id);
  const candOf = (hr, id) => ensure(hr).candidates.find(c => c.id === id);
  const publicVacancies = (hr) => hr.vacancies.filter(v => v.status === 'Dipublikasikan');
  function runScreen(hr, a, by, fail) {
    const v = vacOf(hr, a.vac), f = formOf(v.position);
    if (fail) { a.screening = { status: 'Gagal', version: v.criteriaVersion, at: now(), by, error: 'Layanan screening (simulasi) tidak merespons', runs: (a.screening?.runs || 0) + 1 }; return a.screening; }
    const items = f.criteria.map(([id, label, fn]) => { const r = fn(a.answers); return { id, label, status: r === null ? 'Perlu Klarifikasi' : r ? 'Terpenuhi' : 'Tidak Sesuai', evidence: evidenceFor(id, f, a) }; });
    a.screening = { status: 'Selesai', version: v.criteriaVersion, at: now(), by, items, excluded: EXCLUDED, runs: (a.screening?.runs || 0) + 1, summary: { ok: items.filter(i => i.status === 'Terpenuhi').length, clar: items.filter(i => i.status === 'Perlu Klarifikasi').length, no: items.filter(i => i.status === 'Tidak Sesuai').length } };
    return a.screening;
  }
  const EVID = { C1: ['years', 'frontdesk', 'exp'], C2: ['cert', 'pos', 'portfolio'], C3: ['sessions', 'lang', 'startReady'], C4: ['lang', 'shiftReady'], C5: ['shiftReady', 'situational'], C6: ['situational'] };
  function evidenceFor(id, f, a) { const keys = (EVID[id] || []).filter(k => f.q.some(q => q[0] === k) || k === 'shiftReady' || k === 'startReady'); const k = keys.find(x => a.answers[x] !== undefined) || keys[0]; return k ? { field: k, value: a.answers[k] || '' } : null; }
  const move = (a, to, by, reason) => { a.history.push({ at: now(), by, from: a.stage, to, reason: reason || null }); a.stage = to; };
  const scopeApps = (hr, role) => { const f4 = ensure(hr), d = H.roleDef(role); if (['owner', 'hrd', 'hrd-ops', 'hg-lead'].includes(role)) return f4.apps; if (role === 'outlet-spv') return f4.apps.filter(a => vacOf(hr, a.vac)?.location === 'OUT-UBD' && (a.interview?.interviewers || []).includes(hr.roleEmp[role]) || ['Onboarding', 'Penempatan Aktif'].includes(a.stage) && vacOf(hr, a.vac)?.location === 'OUT-UBD'); if (role === 'ops-manager') return f4.apps.filter(a => /^OUT-/.test(vacOf(hr, a.vac)?.location || '')); return []; };
  const canSeeDocs = (role) => ['owner', 'hrd', 'hrd-ops'].includes(role);

  function update(state, hr, action, input, ctx) {
    const f4 = ensure(hr), { audit, by, role } = ctx;
    const staff = () => { if (!['owner', 'hrd', 'hrd-ops'].includes(role)) throw new Error(`Akses ditolak: ${H.roleDef(role).label} tidak mengelola rekrutmen.`); };
    const getApp = (id) => { const a = appOf(hr, id); if (!a) throw new Error('Lamaran tidak ditemukan.'); if (action !== 'app-submit' && !scopeApps(hr, role).includes(a)) throw new Error(`Akses ditolak: lamaran ${id} di luar cakupan ${H.roleDef(role).label}.`); return a; };
    const open = (a) => { if (ENDS.includes(a.stage)) throw new Error(`${a.id} sudah berstatus ${a.stage}.`); };
    switch (action) {
      case 'req-create': {
        if (!['owner', 'hrd', 'hrd-ops', 'ops-manager', 'outlet-spv'].includes(role)) throw new Error('Akses ditolak: permintaan tenaga dari HRD, Operational Manager atau Supervisor.');
        const ps = H.pos(input.position); if (!ps) throw new Error('Pilih posisi.');
        const loc = input.outlet; if (![...H.OUTLETS.map(o => o.id), H.HQ.id].includes(loc)) throw new Error('Outlet/lokasi tidak dikenal.');
        if (role === 'outlet-spv' && loc !== 'OUT-UBD') throw new Error('Akses ditolak: Supervisor Ubud hanya untuk Spa Ubud.');
        const count = Number(input.count); if (!(count >= 1 && count <= 20)) throw new Error('Formasi 1–20 orang.');
        const r = { id: `REQ-HR-2611-${String(++f4.seq.req).padStart(3, '0')}`, outlet: loc, position: ps.id, count, shift: input.shift || 'Pagi/Sore', skills: input.skills || '', pic: 'EMP-0145', status: 'Menunggu Persetujuan', source: input.source || 'Manual (F4)', task: input.task || null, approvals: [], vacancy: null, criteriaVersion: 1, demo: true };
        f4.reqs.push(r); audit(hr, by, 'Permintaan tenaga', `${r.id} · ${count} ${ps.name} · ${H.locName(loc)}`, { object: 'Rekrutmen', ref: r.id });
        return r.id;
      }
      case 'req-approve': {
        const r = reqOf(hr, input.id); if (!r) throw new Error('Permintaan tidak ditemukan.');
        if (r.status !== 'Menunggu Persetujuan') throw new Error(`${r.id} sudah ${r.status}.`);
        const stage = r.approvals.length === 0 ? (H.pos(r.position).division === 'DIV-OPS' ? 'Operational Manager' : 'Manager divisi') : 'Manager HRD';
        const allowed = stage === 'Manager HRD' ? ['hrd', 'owner'] : ['ops-manager', 'owner', 'hrd'];
        if (stage === 'Operational Manager' && role === 'hrd') throw new Error('Tahap aktif: Operational Manager. Manager HRD menyetujui pada tahap berikutnya.');
        if (!allowed.includes(role)) throw new Error(`Akses ditolak: tahap "${stage}" bukan wewenang ${H.roleDef(role).label}.`);
        if (input.decision === 'reject') { if (String(input.reason || '').length < 5) throw new Error('Alasan penolakan minimal 5 karakter.'); r.status = 'Ditolak'; r.approvals.push({ stage, by, at: now(), decision: 'Ditolak', reason: input.reason }); return r.id; }
        r.approvals.push({ stage, by, at: now(), decision: 'Disetujui' });
        if (stage === 'Manager HRD') r.status = 'Disetujui';
        audit(hr, by, 'Persetujuan permintaan tenaga', `${r.id} · tahap ${stage}`, { object: 'Rekrutmen', ref: r.id, after: r.status });
        return r.id;
      }
      case 'vac-publish': {
        staff(); const r = reqOf(hr, input.req); if (!r) throw new Error('Permintaan tidak ditemukan.');
        if (r.status !== 'Disetujui') throw new Error(`Lowongan hanya dari permintaan yang disetujui (${r.id}: ${r.status}).`);
        const mode = input.mode === 'Internal' ? 'Internal' : 'Dipublikasikan';
        let v = r.vacancy && vacOf(hr, r.vacancy);
        if (!v) { v = { id: `VAC-2611-${String(++f4.seq.vac).padStart(3, '0')}`, title: H.pos(r.position).name, position: r.position, location: r.outlet, count: r.count, shift: r.shift, req: r.id, source: r.source, criteriaVersion: r.criteriaVersion, channels: ['WEB', 'IG', 'QR'], resp: input.resp || `Bergabung sebagai ${H.pos(r.position).name} di ${H.locName(r.outlet)}.`, demo: true }; hr.vacancies.push(v); r.vacancy = v.id; }
        const before = v.status || 'Draf'; v.status = mode; v.published = mode === 'Dipublikasikan' ? TODAY : v.published; v.closed = null;
        audit(hr, by, 'Publikasi lowongan', `${v.id} · ${v.title} · ${H.locName(v.location)} → ${mode}`, { object: 'Rekrutmen', ref: v.id, before, after: mode });
        return v.id;
      }
      case 'vac-close': { staff(); const v = vacOf(hr, input.id); if (!v) throw new Error('Lowongan tidak ditemukan.'); const b = v.status; v.status = 'Ditutup'; v.closed = TODAY; audit(hr, by, 'Tutup lowongan', v.id, { object: 'Rekrutmen', ref: v.id, before: b, after: 'Ditutup' }); return v.id; }
      case 'app-submit': {
        const v = vacOf(hr, input.vac); if (!v) throw new Error('Lowongan tidak ditemukan.');
        if (v.status !== 'Dipublikasikan') throw new Error(`Lowongan ${v.id} tidak menerima lamaran (${v.status}).`);
        const key = String(input.submitKey || ''); if (key) { const dup = f4.apps.find(a => a.submitKey === key); if (dup) return dup.id; }
        const name = String(input.name || '').trim(), email = String(input.email || '').trim().toLowerCase(), phone = String(input.phone || '').trim();
        if (name.length < 3) throw new Error('Isi nama lengkap.'); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Email tidak valid.');
        if (!input.consent) throw new Error('Centang persetujuan pemrosesan data.');
        const docs = String(input.docs || 'cv.pdf').split(',').map(s => s.trim()).filter(Boolean);
        const bad = docs.find(d => !/\.(pdf|jpg|jpeg|png)$/i.test(d)); if (bad) throw new Error(`Lampiran "${bad}" ditolak: hanya PDF/JPG/PNG maks 5 MB.`);
        if (!docs.some(d => /cv/i.test(d))) throw new Error('Lampirkan CV.');
        let c = f4.candidates.find(x => x.email === email || (phone && x.phone === phone));
        if (c && f4.apps.some(a => a.cand === c.id && a.vac === v.id && !ENDS.includes(a.stage))) throw new Error(`Anda sudah melamar ${v.id}. Status lamaran dapat dicek melalui email konfirmasi.`);
        if (!c) { c = { id: `CAN-${String(++f4.seq.cand).padStart(4, '0')}`, name, email, phone, demo: true }; f4.candidates.push(c); }
        const ans = {}; formOf(v.position).q.forEach(([k]) => { ans[k] = input[k] ?? ''; }); ['shiftReady', 'location', 'salary', 'startReady', 'ivPref'].forEach(k => { ans[k] = input[k] ?? ''; });
        const a = { id: `APP-2611-${String(++f4.seq.app).padStart(4, '0')}`, cand: c.id, vac: v.id, channel: CHANNELS[input.ch] ? input.ch : 'WEB', sourceAnswer: input.sourceAnswer || '', answers: ans, docs: docs.map((d, i) => ({ id: `DOC-${f4.seq.app}-${i + 1}`, kind: /cv/i.test(d) ? 'CV' : /sertif/i.test(d) ? 'Sertifikat' : 'Portofolio', name: d + ' (sintetis)' })), submittedAt: now(), stage: 'Lamaran Masuk', history: [{ at: now(), by: 'Kandidat', from: null, to: 'Lamaran Masuk', reason: `Formulir publik · kanal ${input.ch || 'WEB'}` }], screening: { status: 'Menunggu', version: v.criteriaVersion, runs: 0 }, interview: null, rubric: null, decision: null, offer: null, contract: null, emp: null, onboarding: null, placement: null, clarify: [], submitKey: key || null, demo: true };
        f4.apps.push(a);
        return a.id;
      }
      case 'screen-run': {
        staff(); const a = getApp(input.id); open(a);
        const s = runScreen(hr, a, by, input.fail === '1');
        if (s.status === 'Selesai' && a.stage === 'Lamaran Masuk') move(a, s.summary.clar ? 'Klarifikasi' : 'Screening', by, `Screening v${s.version}: ${s.summary.ok} terpenuhi, ${s.summary.clar} klarifikasi, ${s.summary.no} tidak sesuai`);
        return s.status === 'Gagal' ? 'screening gagal (simulasi), bisa dicoba lagi' : a.id;
      }
      case 'app-clarify': {
        staff(); const a = getApp(input.id); const item = a.screening?.items?.find(i => i.id === input.item); if (!item) throw new Error('Kriteria tidak ditemukan.');
        const tid = H.EXT.update(state, hr, 'task-create', { ws: 'HRD', stage: 'Issue', title: `Klarifikasi ${a.id}: ${item.label}`, scope: vacOf(hr, a.vac).location, sourceId: a.id, sourceType: 'Rekrutmen', sourceLabel: `Lamaran ${a.id} · ${candOf(hr, a.cand).name}`, sourceRoute: `hrd-rec-candidates?id=${a.id}`, finding: item.id, pic: 'EMP-0145' }, ctx);
        if (!a.clarify.includes(tid)) a.clarify.push(tid);
        if (a.stage === 'Lamaran Masuk' || a.stage === 'Screening') move(a, 'Klarifikasi', by, `Kartu ${tid}`);
        return tid;
      }
      case 'app-answer': {
        staff(); const a = getApp(input.id); open(a); const k = input.field; if (!k) throw new Error('Pilih jawaban.');
        const b = a.answers[k]; a.answers[k] = input.value || ''; a.history.push({ at: now(), by, from: a.stage, to: a.stage, reason: `Klarifikasi ${k}: "${b || '—'}" → "${a.answers[k]}"` });
        runScreen(hr, a, by); return a.id;
      }
      case 'app-stage': {
        const a = getApp(input.id); open(a);
        const to = input.to;
        if (to === 'Shortlist') { staff(); if (a.screening?.status !== 'Selesai') throw new Error('Selesaikan screening sebelum shortlist.'); const v = vacOf(hr, a.vac); const cap = v.count * 3; const n = f4.apps.filter(x => x.vac === v.id && ['Shortlist', 'Interview', 'Uji Praktik'].includes(x.stage)).length; if (n >= cap) throw new Error(`Kapasitas interview ${v.id} penuh (${cap} kandidat untuk ${v.count} formasi).`); }
        else if (['Ditolak', 'Batal', 'Mengundurkan diri'].includes(to)) { if (String(input.reason || '').trim().length < 5) throw new Error('Alasan wajib (minimal 5 karakter).'); if (to !== 'Mengundurkan diri') staff(); }
        else throw new Error('Transisi tidak dikenal.');
        move(a, to, by, input.reason || null);
        audit(hr, by, 'Tahap kandidat', `${a.id} → ${to}`, { object: 'Rekrutmen', ref: a.id, after: to });
        return a.id;
      }
      case 'iv-schedule': {
        if (!['owner', 'hrd', 'hrd-ops'].includes(role)) throw new Error('Akses ditolak: jadwal interview oleh HRD.');
        const a = getApp(input.id); open(a);
        if (!['Shortlist', 'Interview', 'Uji Praktik'].includes(a.stage)) throw new Error('Interview hanya untuk kandidat shortlist.');
        const slot = String(input.slot || ''); if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(slot)) throw new Error('Slot WITA format YYYY-MM-DD HH:MM.');
        if (slot.slice(0, 10) <= TODAY) throw new Error('Slot minimal besok.');
        const ivs = [input.iv1 || 'EMP-0145', input.iv2].filter(Boolean);
        const clash = f4.apps.find(x => x !== a && x.interview && x.interview.slot === slot && x.interview.interviewers.some(e => ivs.includes(e)));
        if (clash) throw new Error(`Bentrok: pewawancara sudah ada interview ${clash.interview.id} pada ${slot}.`);
        const fail = input.fail === '1';
        if (!a.interview) a.interview = { id: `IV-2611-${String(++f4.seq.iv).padStart(4, '0')}`, eventId: `GCAL-EVT-${String(f4.seq.iv).padStart(4, '0')}`, slot, interviewers: ivs, status: 'Menunggu konfirmasi', sync: fail ? 'Gagal' : 'OK', meet: `https://meet.example.invalid/${f4.seq.iv}`, history: [{ at: now(), by, slot, note: 'Dijadwalkan' }], invites: fail ? 0 : 1 };
        else { const old = a.interview.slot; Object.assign(a.interview, { slot, interviewers: ivs, status: 'Menunggu konfirmasi', sync: fail ? 'Gagal' : 'OK' }); a.interview.history.push({ at: now(), by, slot, note: `Dijadwalkan ulang dari ${old}` }); if (!fail) a.interview.invites = Math.max(1, a.interview.invites || 0); }
        if (a.stage === 'Shortlist') move(a, 'Interview', by, `${a.interview.id} · ${slot}`);
        return fail ? `Sinkron kalender gagal (simulasi) · ${a.interview.eventId}` : a.interview.eventId;
      }
      case 'iv-sync-retry': { staff(); const a = getApp(input.id); if (!a.interview) throw new Error('Belum ada interview.'); a.interview.sync = 'OK'; a.interview.invites = Math.max(1, a.interview.invites || 0); a.interview.history.push({ at: now(), by, slot: a.interview.slot, note: 'Sinkron ulang berhasil, Event ID sama' }); return a.interview.eventId; }
      case 'iv-confirm': { const a = getApp(input.id); if (!a.interview) throw new Error('Belum ada interview.'); a.interview.status = 'Dikonfirmasi'; a.interview.history.push({ at: now(), by, slot: a.interview.slot, note: 'Kandidat konfirmasi hadir' }); return a.id; }
      case 'iv-score': {
        const a = getApp(input.id); open(a);
        if (!a.interview) throw new Error('Jadwalkan interview sebelum menilai.');
        if (!['owner', 'hrd', 'hrd-ops', 'hg-lead', 'outlet-spv'].includes(role)) throw new Error('Akses ditolak: penilai interview.');
        const rb = formOf(vacOf(hr, a.vac).position).rubric;
        const scores = rb.map((_, i) => Number(input['s' + i])); if (scores.some(s => !(s >= 1 && s <= 5))) throw new Error('Isi semua skor 1–5.');
        if (String(input.note || '').trim().length < 5) throw new Error('Catatan penilai minimal 5 karakter.');
        a.rubric = { items: rb.map((l, i) => ({ label: l, score: scores[i] })), avg: Math.round(scores.reduce((s, x) => s + x, 0) / scores.length * 10) / 10, by, at: now(), note: input.note, evidence: input.evidence || 'Video praktik (sintetis)' };
        if (['Interview', 'Shortlist'].includes(a.stage)) move(a, 'Uji Praktik', by, 'Rubric interview & praktik terisi');
        move(a, 'Keputusan', by, `Rata-rata rubric ${a.rubric.avg}`);
        return a.id;
      }
      case 'rec-decide': {
        if (!['owner', 'hrd'].includes(role)) throw new Error('Akses ditolak: keputusan rekrutmen oleh Manager HRD.');
        const a = getApp(input.id); open(a);
        if (!a.rubric) throw new Error('Keputusan butuh bukti penilaian (rubric).');
        const value = input.value === 'Diterima' ? 'Diterima' : 'Ditolak'; const reason = String(input.reason || '').trim(); if (reason.length < 5) throw new Error('Alasan keputusan minimal 5 karakter.');
        const hist = a.decision?.history || []; if (a.decision) hist.push({ value: a.decision.value, reason: a.decision.reason, by: a.decision.by, at: a.decision.at });
        a.decision = { value, reason, by, at: now(), history: hist };
        if (value === 'Ditolak') move(a, 'Ditolak', by, reason);
        audit(hr, by, 'Keputusan rekrutmen', `${a.id} · ${value}`, { object: 'Rekrutmen', ref: a.id, before: hist.length ? hist[hist.length - 1].value : '—', after: value });
        return a.id;
      }
      case 'offer-send': {
        if (!['owner', 'hrd'].includes(role)) throw new Error('Akses ditolak: penawaran oleh Manager HRD.');
        const a = getApp(input.id); open(a); if (a.decision?.value !== 'Diterima') throw new Error('Penawaran hanya untuk keputusan Diterima.');
        const start = input.start; if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '') || start < TODAY) throw new Error('Tanggal mulai minimal hari ini.');
        a.offer = { id: a.offer?.id || `OFR-2611-${String(++f4.seq.offer).padStart(4, '0')}`, status: 'Terkirim', start, sent: now(), response: null, history: [...(a.offer?.history || []), { at: now(), by, note: `Penawaran dikirim, mulai ${start}` }] };
        return a.offer.id;
      }
      case 'offer-respond': {
        const a = getApp(input.id); if (!a.offer || a.offer.status !== 'Terkirim') throw new Error('Tidak ada penawaran terbuka.');
        if (input.answer === 'accept') { a.offer.status = 'Diterima kandidat'; a.offer.history.push({ at: now(), by: 'Kandidat (simulasi)', note: 'Menerima penawaran' }); move(a, 'Penawaran & Kontrak', by, `${a.offer.id} diterima`); a.contract = { id: `CTR-2611-${String(++f4.seq.ctr).padStart(4, '0')}`, version: 1, type: 'PKWT 12 bulan (Probation 3 bulan)', sign: 'Belum', docs: [{ kind: 'KTP', status: 'Belum diverifikasi' }, { kind: 'Foto', status: 'Belum diverifikasi' }], effective: a.offer.start, history: [{ at: now(), by, note: 'Draf kontrak v1 dibuat dari penawaran' }] }; return a.contract.id; }
        a.offer.status = 'Ditolak kandidat'; a.offer.history.push({ at: now(), by: 'Kandidat (simulasi)', note: input.reason || 'Menolak penawaran' }); move(a, 'Mengundurkan diri', by, 'Kandidat menolak penawaran'); return a.id;
      }
      case 'contract-revise': { staff(); const a = getApp(input.id); if (!a.contract || a.contract.sign === 'Ditandatangani') throw new Error('Kontrak tidak bisa direvisi.'); a.contract.version++; a.contract.history.push({ at: now(), by, note: `Revisi v${a.contract.version}: ${input.note || '—'}` }); return a.contract.id; }
      case 'doc-verify': { staff(); const a = getApp(input.id); const d = a.contract?.docs.find(x => x.kind === input.kind); if (!d) throw new Error('Dokumen tidak ditemukan.'); d.status = 'Terverifikasi'; d.by = by; d.at = now(); a.contract.history.push({ at: now(), by, note: `${d.kind} terverifikasi` }); return a.id; }
      case 'contract-sign': {
        staff(); const a = getApp(input.id); if (!a.contract) throw new Error('Belum ada kontrak.');
        if (a.contract.docs.some(d => d.status !== 'Terverifikasi')) throw new Error('Verifikasi KTP dan foto sebelum tanda tangan.');
        if (a.contract.sign === 'Ditandatangani') return a.emp;
        a.contract.sign = 'Ditandatangani'; a.contract.signedAt = now(); a.contract.history.push({ at: now(), by, note: `Ditandatangani v${a.contract.version} (e-sign simulasi)` });
        /* konversi profil → Employee ID F2 dengan penempatan efektif tanggal mulai */
        const c = candOf(hr, a.cand), v = vacOf(hr, a.vac);
        const emp = H.EXT.update(state, hr, 'employee-add', { name: c.name, position: v.position, location: v.location, shift: (v.shift || 'Pagi').split('/')[0], from: a.offer.start, phone: c.phone }, { ...ctx, role: 'hrd' });
        a.emp = emp; const p = hr.people.find(x => x.id === emp); if (p) { p.contract = 'PKWT'; p.source = a.id; }
        move(a, 'Onboarding', by, `Profil ${emp} dibuat dari ${a.id}`);
        audit(hr, by, 'Konversi kandidat', `${a.id} → ${emp} · kontrak ${a.contract.id} v${a.contract.version}`, { object: 'Karyawan', ref: emp, after: `${H.pos(v.position).name} · ${H.locName(v.location)} · mulai ${a.offer.start}` });
        return emp;
      }
      case 'onboard-create': {
        staff(); const a = getApp(input.id); if (!a.emp) throw new Error('Onboarding setelah kontrak ditandatangani dan profil dibuat.');
        const tpl = vacOf(hr, a.vac).position === 'POS-THR' ? 'TPL-ONB' : 'TPL-ONB';
        const t = H.EXT.update(state, hr, 'template-apply', { template: tpl, emp: a.emp, start: a.offer.start }, ctx);
        a.onboarding = t; return t;
      }
      case 'place-approve': {
        if (!['owner', 'hrd'].includes(role)) throw new Error('Akses ditolak: penempatan & akun disetujui Manager HRD.');
        const a = getApp(input.id); if (!a.emp) throw new Error('Belum ada profil karyawan.'); if (!a.onboarding) throw new Error('Buat paket onboarding terlebih dahulu.');
        const acc = hr.accounts.find(x => x.emp === a.emp); const reqRole = ['ess'].includes(input.accRole) ? input.accRole : 'ess';
        if (acc) acc.role = reqRole;
        a.placement = { status: a.offer.start <= TODAY ? 'Aktif' : 'Terjadwal', effective: a.offer.start, account: reqRole, workplace: 'ESS + POS outlet', approvedBy: by, at: now() };
        if (a.offer.start <= TODAY) move(a, 'Penempatan Aktif', by, `Penempatan ${a.emp} efektif ${a.offer.start}`);
        audit(hr, by, 'Penempatan & akun', `${a.emp} · ${H.locName(vacOf(hr, a.vac).location)} · akun ${reqRole} · efektif ${a.offer.start}`, { object: 'Akses', ref: a.emp, after: `ESS · ${a.placement.status}` });
        return a.emp;
      }
      default: return undefined;
    }
  }
  const purge = (hr) => { if (!hr.f4) return; hr.f4.reqs = hr.f4.reqs.filter(x => !x.demo); hr.f4.apps = hr.f4.apps.filter(x => !x.demo); hr.f4.candidates = hr.f4.candidates.filter(x => !x.demo); };
  const keep = (hr) => hr.f4 ? { seeded: false, reqs: hr.f4.reqs.filter(x => !x.demo), apps: hr.f4.apps.filter(x => !x.demo), candidates: hr.f4.candidates.filter(x => !x.demo) } : null;
  const prev = { ...H.EXT };
  H.EXT.update = (state, hr, action, input, ctx) => { const r = update(state, hr, action, input, ctx); return r !== undefined ? r : prev.update(state, hr, action, input, ctx); };
  H.EXT.purge = (hr) => { prev.purge?.(hr); purge(hr); };
  H.EXT.keep = (hr) => { const k = prev.keep?.(hr) || {}; const k4 = keep(hr); if (k4) k.f4 = k4; return k; };
  H.EXT.ensure = (hr) => { if (hr.f2 && hr.f2.f4) { hr.f4 = hr.f2.f4; delete hr.f2.f4; } prev.ensure?.(hr); ensure(hr); };
  return { STAGES, ENDS, CHANNELS, FORMS, EXCLUDED, formOf, ensure, vacOf, reqOf, appOf, candOf, publicVacancies, scopeApps, canSeeDocs, addDays };
})();
if (typeof module !== 'undefined') module.exports = HR4;
