/* HAWK ERP · Portal HRD · model F5 Manpower Planning & POS — DATA DEMO / SIMULASI.
   Periode Okt 2026 (bulan tertutup, sama dengan Beranda F1) dan Minggu 46 (7–13 Nov, provisional, rincian POS per baris layanan).
   Utility = jam treatment selesai ÷ jam kapasitas reguler (jam). Agregasi = total pembilang ÷ total penyebut.
   Baris layanan POS dibangkitkan deterministik (tidak disimpan); yang disimpan hanya batch ingest, refund, koreksi, skenario dan handoff.
   Memperluas HR.EXT. Tanpa jaringan. */
const HR5 = (() => {
  const H = (typeof HR !== 'undefined') ? HR : require('./hrd-model.js');
  const TODAY = H.TODAY;
  const now = () => `${TODAY} ${new Date().toTimeString().slice(0, 5)}`;
  const WEEK = ['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'];
  const PERIODS = { 'W46': { label: 'Minggu 46 · 7–13 Nov 2026 (provisional)', closed: false, updated: '2026-11-13 21:00' }, '2610': { label: 'Oktober 2026 (ditutup)', closed: true, updated: '2026-11-01 06:00' } };
  /* kapasitas reguler (jam bookable setelah istirahat, cuti & jam tidak tersedia) dan jam treatment selesai per outlet × shift */
  const WEEKLY = {
    'OUT-UBD': { Pagi: [200, 216], Sore: [190, 198], fails: 23, cancel: 3, ot: 10, help: 6 },
    'OUT-SHT': { Pagi: [200, 140], Sore: [190, 118], fails: 0, cancel: 14, ot: 0, help: 0 },
    'OUT-TRL': { Pagi: [200, 172], Sore: [190, 156], fails: 2, cancel: 4, ot: 0, help: 0 },
    'OUT-BSM': { Pagi: [200, 158], Sore: [190, 146], fails: 1, cancel: 5, ot: 0, help: 0 }
  };
  /* Oktober = Beranda F1: therapist × 8 jam × 26 hari; treatment selesai dari UTILITY F1 */
  const MONTH_DONE = { 'OUT-UBD': 5512, 'OUT-SHT': 3432, 'OUT-TRL': 4368, 'OUT-BSM': 4056 };
  const status = (u) => u === null || u === undefined || Number.isNaN(u) ? ['Belum tersedia', ''] : u > 1.0000001 ? ['Di atas kapasitas', 'bad'] : u < 0.6999999 ? ['Di bawah 70%', 'sandbox'] : (u < 0.75 || u > 0.95) ? ['Pantau', 'planned'] : ['Sehat', 'ready'];
  const SVC = [['Balinese Massage', 90], ['Hot Stone', 120], ['Reflexology', 60], ['Body Scrub', 60], ['Four Hands', 90]];
  const OUTCODE = { 'OUT-UBD': 'UBD', 'OUT-SHT': 'SHT', 'OUT-TRL': 'TRL', 'OUT-BSM': 'BSM' };

  /* ---------- baris layanan POS Minggu 46 (deterministik) ---------- */
  const cache = new WeakMap();
  function lines(hr) {
    if (cache.has(hr) && cache.get(hr).v === (hr.f5?.ver || 0)) return cache.get(hr).rows;
    const rows = [], f5 = ensure(hr);
    const thr = (o) => hr.placements.filter(p => p.location === o && p.position === 'POS-THR' && p.from <= WEEK[6] && (!p.to || p.to >= WEEK[0])).map(p => p.emp);
    const shiftOf = (emp) => (hr.f2?.schedules || []).find(s => s.emp === emp && s.kind === 'tetap' && s.from <= WEEK[0] && (!s.to || s.to >= WEEK[0]))?.shift || 'Pagi';
    for (const o of Object.keys(WEEKLY)) {
      const W = WEEKLY[o], team = thr(o), helpers = o === 'OUT-UBD' ? thr('OUT-SHT').slice(0, 2) : [];
      for (const sh of ['Pagi', 'Sore']) {
        const crew = team.filter(e => shiftOf(e) === sh); const pool = crew.length ? crew : team;
        let target = W[sh][1] * 60, n = 0;
        const special = o === 'OUT-UBD' && sh === 'Pagi' ? [...Array(W.help / 1.5).fill(0).map((_, i) => ({ emp: helpers[i % helpers.length], dur: 90, help: true })), ...Array(W.ot / 2).fill(0).map((_, i) => ({ emp: pool[i % pool.length], dur: 120, ot: true }))] : [];
        const push = (emp, dur, extra = {}) => {
          const d = WEEK[n % 7], k = ++n, svc = extra.four ? SVC[4] : SVC[(k + emp.length) % 4];
          const startH = extra.ot ? 17 + (k % 2) : (sh === 'Pagi' ? 9 : 13) + (k % 6);
          const tx = `TRX-${OUTCODE[o]}-${d.slice(2).replace(/-/g, '')}-${String(k).padStart(4, '0')}${sh[0]}`;
          rows.push({ tx, line: `${tx}-L1`, outlet: o, shift: sh, emp, home: hr.placements.find(p => p.emp === emp && p.from <= d && (!p.to || p.to >= d))?.location || o, date: d, start: `${String(startH).padStart(2, '0')}:00`, dur, svc: svc[0], status: 'Selesai', pay: 'Dibayar', ot: !!extra.ot, help: !!extra.help, alloc: extra.alloc || null });
        };
        special.forEach(s => { push(s.emp, s.dur, s); target -= s.dur; });
        /* satu layanan Four Hands (dua therapist, alokasi durasi masing-masing) per outlet-shift */
        if (pool.length > 1) { push(pool[0], 90, { four: true, alloc: [pool[0], pool[1]] }); push(pool[1], 90, { four: true, alloc: [pool[0], pool[1]] }); rows[rows.length - 1].tx = rows[rows.length - 2].tx; rows[rows.length - 1].line = rows[rows.length - 2].tx + '-L2'; target -= 180; }
        let i = 0; while (target > 0) { const dur = target >= 90 ? (i % 3 === 2 ? 60 : 90) : target; push(pool[i % pool.length], dur); target -= dur; i++; }
      }
      for (let c = 0; c < W.cancel; c++) rows.push({ tx: `TRX-${OUTCODE[o]}-C${String(c + 1).padStart(3, '0')}`, line: `TRX-${OUTCODE[o]}-C${String(c + 1).padStart(3, '0')}-L1`, outlet: o, shift: c % 2 ? 'Sore' : 'Pagi', emp: team[c % team.length], home: o, date: WEEK[c % 7], start: '15:00', dur: 0, planned: 90, svc: 'Balinese Massage', status: 'Batal', pay: 'Tidak ditagih', ot: false, help: false });
    }
    /* refund & koreksi tersimpan diterapkan ke baris asal */
    for (const r of f5.refunds) { const l = rows.find(x => x.line === r.line); if (l) { l.pay = 'Refund'; l.refund = r.id; } }
    for (const c of f5.corrections) { const l = rows.find(x => x.line === c.line); if (l) { l.dur = c.after; l.corrected = c.id; } }
    cache.set(hr, { v: hr.f5?.ver || 0, rows });
    return rows;
  }
  const done = (rs) => rs.filter(r => r.status === 'Selesai').reduce((s, r) => s + r.dur, 0) / 60;

  /* ---------- agregat ---------- */
  function outletUtil(hr, o, period = 'W46', shift) {
    if (period === '2610') { const thr = 25, cap = thr * 8 * 26, d = MONTH_DONE[o]; const sh = shift ? (shift === 'Pagi' ? 0.52 : 0.48) : 1; return { cap: cap * sh, done: d * sh, u: d / cap, shiftNote: shift ? 'Pembagian shift Oktober diestimasi 52/48 (perlu verifikasi)' : null }; }
    const rs = lines(hr).filter(r => r.outlet === o && (!shift || r.shift === shift));
    const cap = shift ? WEEKLY[o][shift][0] : WEEKLY[o].Pagi[0] + WEEKLY[o].Sore[0];
    const d = done(rs); return { cap, done: d, u: cap ? d / cap : null, ot: done(rs.filter(r => r.ot)), help: done(rs.filter(r => r.help)), cancel: rs.filter(r => r.status === 'Batal').length, refund: rs.filter(r => r.pay === 'Refund').length, fails: shift ? null : WEEKLY[o].fails };
  }
  function shiftMembers(hr, o, sh) {
    const rs = lines(hr).filter(r => r.outlet === o && r.shift === sh && r.status === 'Selesai');
    const by = {}; rs.forEach(r => { by[r.emp] = by[r.emp] || { emp: r.emp, home: r.home, hours: 0, ot: 0, lines: 0 }; by[r.emp].hours += r.dur / 60; by[r.emp].lines++; if (r.ot) by[r.emp].ot += r.dur / 60; });
    return Object.values(by).sort((a, b) => b.hours - a.hours);
  }
  /* Reception: reservasi, check-in, tunggu rata-rata, coverage per blok jam */
  const RECEPTION = {
    'OUT-UBD': { Pagi: { res: 168, checkin: 160, wait: 12, staff: 3, peak: [['09–11', 2, 38], ['11–13', 3, 30]] }, Sore: { res: 150, checkin: 144, wait: 14, staff: 2, peak: [['13–17', 2, 52], ['17–21', 1, 41]] } },
    'OUT-SHT': { Pagi: { res: 96, checkin: 82, wait: 4, staff: 3, peak: [['09–11', 2, 18], ['11–13', 3, 16]] }, Sore: { res: 88, checkin: 76, wait: 5, staff: 2, peak: [['13–17', 2, 22], ['17–21', 2, 20]] } },
    'OUT-TRL': { Pagi: { res: 120, checkin: 114, wait: 7, staff: 3, peak: [['09–11', 2, 26], ['11–13', 3, 24]] }, Sore: { res: 110, checkin: 104, wait: 8, staff: 2, peak: [['13–17', 2, 30], ['17–21', 2, 28]] } },
    'OUT-BSM': { Pagi: { res: 110, checkin: 106, wait: 6, staff: 3, peak: [['09–11', 2, 24], ['11–13', 3, 22]] }, Sore: { res: 104, checkin: 100, wait: 9, staff: 2, peak: [['13–17', 2, 26], ['17–21', 1, 34]] } }
  };
  const REC_TARGET = { perHour: 6, wait: 10 };
  const recStatus = (checkins, staff, hours, wait) => { const load = staff ? checkins / (staff * hours) : null; return load === null ? ['Belum tersedia', ''] : load > REC_TARGET.perHour || wait > REC_TARGET.wait ? ['Kurang coverage', 'bad'] : load > REC_TARGET.perHour * 0.85 ? ['Pantau', 'planned'] : ['Cukup', 'ready']; };
  const DIVISIONS = [
    { id: 'DIV-FA', name: 'Finance & Accounting', metric: 'Rekonsiliasi bank & POS', unit: 'dokumen', load: 412, output: 365, backlog: 47, sla: '2 hari kerja', slaMet: 0.88, source: 'HAWK Finance (TO VERIFY)', updated: '2026-11-13 18:00', complete: true },
    { id: 'DIV-MKT', name: 'Marketing', metric: 'Campaign & konten terbit', unit: 'konten', load: 64, output: 58, backlog: 6, sla: 'Sesuai kalender konten', slaMet: 0.91, source: 'Planner Marketing (simulasi)', updated: '2026-11-12 17:00', complete: true },
    { id: 'DIV-HRD', name: 'HRD & Human Growth', metric: 'Permintaan HRD (cuti, koreksi, rekrutmen)', unit: 'permintaan', load: null, output: null, backlog: null, sla: '1–3 hari', slaMet: null, source: 'Approval F2 + Rekrutmen F4 (live demo)', updated: null, complete: true, live: true },
    { id: 'DIV-PRD', name: 'Production', metric: 'Batch produk Essence', unit: 'batch', load: 30, output: 26, backlog: 4, sla: 'Rencana mingguan', slaMet: 0.87, source: 'Produksi Essence (TO VERIFY)', updated: '2026-11-10 16:00', complete: false },
    { id: 'DIV-OPS', name: 'Office Operations', metric: 'Cakupan dukungan outlet', unit: 'kunjungan', load: 24, output: 21, backlog: 3, sla: 'Tiap outlet ≥ 1×/minggu', slaMet: 0.88, source: 'Jadwal OM/AOM (simulasi)', updated: '2026-11-13 12:00', complete: true }
  ];

  function seed() {
    const batches = WEEK.map((d, i) => ({ id: `POS-BATCH-${d.replace(/-/g, '')}`, date: d, received: `${d} 23:10`, status: d === TODAY ? 'Sebagian (shift Sore belum ditutup)' : 'Lengkap', replays: 0, demo: true }));
    return { seeded: true, ver: 0, batches, refunds: [], corrections: [], scenarios: [], seq: { sim: 0, ref: 0, cor: 0 } };
  }
  function ensure(hr) { if (hr.f2 && hr.f2.f5) { hr.f5 = hr.f2.f5; delete hr.f2.f5; } if (!hr.f5 || !hr.f5.seeded) { const k = hr.f5; hr.f5 = seed(); if (k) hr.f5.scenarios.push(...(k.scenarios || [])); } return hr.f5; }
  /* posisi terbuka = formasi permintaan − penempatan aktif dari permintaan itu */
  function reqProgress(hr, reqId) {
    const r = hr.f4?.reqs.find(x => x.id === reqId); if (!r) return null;
    const v = r.vacancy && hr.vacancies.find(x => x.id === r.vacancy);
    const apps = v ? hr.f4.apps.filter(a => a.vac === v.id) : [];
    const placed = apps.filter(a => a.stage === 'Penempatan Aktif').length;
    return { req: r, vac: v, apps: apps.length, placed, open: Math.max(0, r.count - placed) };
  }

  function simulate(hr, o, option, p) {
    const base = outletUtil(hr, o, 'W46'), gap0 = base.done - base.cap;
    let dCap = 0, why = '', assume = [];
    if (option === 'bantuan') { const h = Number(p.hours || 16); dCap = h; why = `Bantuan ${h} jam/minggu dari ${H.locName(p.from || 'OUT-SHT')} (utility rendah)`; assume = [`Therapist ${H.locName(p.from || 'OUT-SHT')} tersedia ${h} jam di luar jadwal outlet induk`, 'Transport antaroutlet ditanggung outlet penerima']; }
    else if (option === 'shift') { const h = Number(p.hours || 12); dCap = h; why = `Geser ${h} jam kapasitas Sore → Pagi`; assume = ['Total jam therapist tetap', 'Permintaan Sore turun sebanding (perlu verifikasi)']; }
    else { const n = Number(p.count || 2); dCap = n * 7 * 6 * 0.8; why = `Tambah ${n} Therapist (7 jam bookable × 6 hari, ramp-up 80%)`; assume = [`Mulai efektif ${p.start || '2026-12-01'}`, 'Onboarding 2 minggu sebelum full booking', 'Biaya per orang dihitung di F7'] }
    const cap1 = base.cap + dCap, u1 = (base.done + (option === 'formasi' ? WEEKLY[o].fails * 1.5 : 0)) / cap1;
    return { base: { cap: base.cap, done: base.done, gap: gap0, u: base.u }, after: { cap: cap1, done: base.done + (option === 'formasi' ? WEEKLY[o].fails * 1.5 : 0), gap: base.done - cap1, u: u1 }, why, assume, evidence: [`Booking gagal karena kapasitas: ${WEEKLY[o].fails}`, `Lembur: ${base.ot} jam`, `Bantuan antaroutlet: ${base.help} jam`] };
  }

  function update(state, hr, action, input, ctx) {
    const f5 = ensure(hr), { audit, by, role } = ctx;
    const hrdOnly = () => { if (!['owner', 'hrd', 'hrd-ops'].includes(role)) throw new Error(`Akses ditolak: ${H.roleDef(role).label} tidak mengelola Manpower.`); };
    switch (action) {
      case 'pos-ingest': {
        hrdOnly(); const b = f5.batches.find(x => x.id === input.id); if (!b) throw new Error('Batch tidak dikenal.');
        b.replays++; const n = lines(hr).filter(r => r.date === b.date).length;
        audit(hr, by, 'Replay batch POS', `${b.id}: ${n} baris diterima ulang, 0 baris baru (duplikat diabaikan berdasarkan Service Line ID)`, { object: 'POS', ref: b.id });
        return `${b.id}: 0 baris baru, ${n} duplikat diabaikan`;
      }
      case 'pos-refund': {
        hrdOnly(); const l = lines(hr).find(r => r.line === input.line); if (!l) throw new Error('Baris layanan tidak ditemukan.');
        if (l.status !== 'Selesai') throw new Error('Refund hanya untuk layanan selesai.');
        if (f5.refunds.some(r => r.line === l.line)) return f5.refunds.find(r => r.line === l.line).id;
        const id = `RFD-2611-${String(++f5.seq.ref).padStart(3, '0')}`; f5.refunds.push({ id, line: l.line, tx: l.tx, at: now(), by, reason: input.reason || 'Keluhan tamu', demo: true }); f5.ver++;
        audit(hr, by, 'Refund POS', `${id} → ${l.line} (layanan tetap selesai; komisi dikoreksi di F7)`, { object: 'POS', ref: l.tx });
        return id;
      }
      case 'pos-correct': {
        hrdOnly(); const l = lines(hr).find(r => r.line === input.line); if (!l) throw new Error('Baris layanan tidak ditemukan.');
        const after = Number(input.dur); if (!(after >= 15 && after <= 240)) throw new Error('Durasi 15–240 menit.');
        if (String(input.reason || '').trim().length < 5) throw new Error('Alasan koreksi minimal 5 karakter.');
        const id = `COR-2611-${String(++f5.seq.cor).padStart(3, '0')}`; f5.corrections.push({ id, line: l.line, tx: l.tx, before: l.dur, after, at: now(), by, reason: input.reason, demo: true }); f5.ver++;
        audit(hr, by, 'Koreksi POS', `${id} ${l.line}: ${l.dur} → ${after} menit`, { object: 'POS', ref: l.tx, before: `${l.dur} mnt`, after: `${after} mnt` });
        return id;
      }
      case 'sim-save': {
        hrdOnly(); const o = input.outlet; if (!WEEKLY[o]) throw new Error('Outlet tidak dikenal.');
        const opt = ['bantuan', 'shift', 'formasi'].includes(input.option) ? input.option : 'formasi';
        const r = simulate(hr, o, opt, input);
        const id = `SIM-2611-${String(++f5.seq.sim).padStart(3, '0')}`;
        f5.scenarios.push({ id, outlet: o, option: opt, params: { hours: input.hours, count: input.count, start: input.start, from: input.from }, result: r, finding: `FND-UTIL-${OUTCODE[o]}-2611`, status: 'Draf', at: now(), by, approver: null, task: null, req: null, demo: true });
        return id;
      }
      case 'sim-mark': {
        hrdOnly(); const s = f5.scenarios.find(x => x.id === input.id); if (!s) throw new Error('Skenario tidak ditemukan.');
        const u = outletUtil(hr, s.outlet), stage = ['Ide', 'Issue', 'Workplan'].includes(input.stage) ? input.stage : 'Issue';
        const t = H.EXT.update(state, hr, 'task-create', { ws: 'HRD', stage, title: `Utility ${H.locName(s.outlet)} ${Math.round(u.u * 100)}%: ${u.u > 1 ? 'kapasitas therapist kurang' : 'di bawah ambang 70%'}`, scope: s.outlet, sourceId: `UTIL-${s.outlet}-2611`, sourceType: 'Utility', sourceLabel: `Utility ${H.locName(s.outlet)} · ${Math.round(u.u * 100)}%`, sourceRoute: `hrd-mp-utility?outlet=${s.outlet}`, finding: s.finding, pic: stage === 'Workplan' ? 'EMP-0142' : undefined, due: stage === 'Workplan' ? '2026-11-27' : undefined }, ctx);
        s.task = t; return t;
      }
      case 'sim-approve': {
        if (!['owner', 'hrd'].includes(role)) throw new Error('Akses ditolak: persetujuan skenario oleh Manager HRD.');
        const s = f5.scenarios.find(x => x.id === input.id); if (!s) throw new Error('Skenario tidak ditemukan.');
        if (s.status !== 'Draf') return s.id;
        if (input.decision === 'reject') { s.status = 'Ditolak'; s.approver = by; return s.id; }
        s.status = 'Disetujui'; s.approver = by; s.approvedAt = now();
        audit(hr, by, 'Setujui skenario manpower', `${s.id} · ${H.locName(s.outlet)} · ${s.option}`, { object: 'Manpower', ref: s.id });
        return s.id;
      }
      case 'mp-handoff': {
        hrdOnly(); const s = f5.scenarios.find(x => x.id === input.id); if (!s) throw new Error('Skenario tidak ditemukan.');
        if (s.status !== 'Disetujui') throw new Error('Handoff butuh persetujuan manusia (Manager HRD) atas skenario.');
        if (s.option !== 'formasi') throw new Error('Handoff ke Rekrutmen hanya untuk skenario tambah formasi.');
        if (s.req) return s.req;
        const req = H.EXT.update(state, hr, 'req-create', { position: 'POS-THR', outlet: s.outlet, count: String(s.params.count || 2), shift: input.shift || 'Pagi/Sore', skills: input.skills || 'Balinese, hot stone', source: `Manpower ${s.id} (${s.finding})`, task: s.task || '' }, { ...ctx, role: role === 'hrd-ops' ? 'hrd-ops' : 'hrd' });
        const r = hr.f4.reqs.find(x => x.id === req); if (r) { r.needBy = s.params.start || '2026-12-01'; r.scenario = s.id; }
        s.req = req; audit(hr, by, 'Handoff permintaan tenaga', `${s.id} → ${req}`, { object: 'Manpower', ref: s.id, after: req });
        return req;
      }
      default: return undefined;
    }
  }
  const prev = { ...H.EXT };
  H.EXT.update = (state, hr, action, input, ctx) => { const r = update(state, hr, action, input, ctx); return r !== undefined ? r : prev.update(state, hr, action, input, ctx); };
  H.EXT.purge = (hr) => { prev.purge?.(hr); if (hr.f5) { hr.f5.scenarios = hr.f5.scenarios.filter(s => !s.demo); hr.f5.refunds = []; hr.f5.corrections = []; hr.f5.ver++; } };
  H.EXT.keep = (hr) => { const k = prev.keep?.(hr) || {}; if (hr.f5) k.f5 = { seeded: false, scenarios: hr.f5.scenarios.filter(s => !s.demo) }; return k; };
  H.EXT.ensure = (hr) => { if (hr.f2 && hr.f2.f5) { hr.f5 = hr.f2.f5; delete hr.f2.f5; } prev.ensure?.(hr); ensure(hr); };
  H.EXT.utility = (hr, o) => outletUtil(hr, o, '2610');
  return { WEEK, PERIODS, WEEKLY, RECEPTION, REC_TARGET, DIVISIONS, OUTCODE, status, recStatus, ensure, lines, outletUtil, shiftMembers, simulate, reqProgress };
})();
if (typeof module !== 'undefined') module.exports = HR5;
