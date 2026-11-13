/* HAWK ERP · Portal HRD · model F3 Planner & Workplace — DATA DEMO / SIMULASI.
   Satu objek kartu (Task ID) dibaca Workplace, Board, Calendar, List, My Tasks, My Day dan Detail Kartu.
   Setiap perubahan menyimpan event (aktor, waktu WITA, sebelum/sesudah). Versi kartu untuk deteksi konflik.
   Memperluas HR.EXT (dirantai setelah F2). Deterministik, tanpa jaringan. */
const HR3 = (() => {
  const H = (typeof HR !== 'undefined') ? HR : require('./hrd-model.js');
  const TODAY = H.TODAY;
  const STAGES = ['Ide', 'Issue', 'Workplan', 'Priority', 'Dikerjakan', 'Review', 'Selesai'];
  const PRIOS = ['Tinggi', 'Sedang', 'Rendah'];
  const WS = { HRD: { id: 'HRD', name: 'HRD Operations', lead: 'EMP-0142' }, HG: { id: 'HG', name: 'Human Growth', lead: 'EMP-0144' } };
  /* peran PIC untuk template → Employee ID default */
  const ROLE_PIC = { 'Staf HRD': 'EMP-0143', 'Manager HRD': 'EMP-0142', 'Human Growth Lead': 'EMP-0144', 'Rekruter HRD': 'EMP-0145', 'Supervisor Outlet': null };
  const addDays = (d, n) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  const now = () => `${TODAY} ${new Date().toTimeString().slice(0, 5)}`;

  const TEMPLATES = () => [
    { id: 'TPL-ONB', name: 'Onboarding administratif therapist', kind: 'Checklist', ws: 'HRD', version: 2, active: true, review: true, history: [{ v: 1, at: '2026-08-01', note: 'Versi awal' }, { v: 2, at: '2026-10-15', note: 'Tambah akun POS & ESS sebelum hari pertama' }],
      steps: [['Kontrak & dokumen identitas lengkap', 'Staf HRD', -3, 'HRD'], ['Akun HAWK, ESS & POS dibuat', 'Staf HRD', -1, 'HRD'], ['Orientasi SOP & keselamatan', 'Human Growth Lead', 0, 'HG'], ['Pendampingan treatment hari 1–3', 'Supervisor Outlet', 3, 'HG'], ['Verifikasi praktik oleh Supervisor', 'Supervisor Outlet', 7, 'HG'], ['Review akhir onboarding', 'Manager HRD', 10, 'HRD']] },
    { id: 'TPL-KOMP', name: 'Verifikasi kompetensi therapist', kind: 'Rubric', ws: 'HG', version: 1, active: true, review: true, history: [{ v: 1, at: '2026-09-01', note: 'Rubric 5 treatment inti' }],
      steps: [['Jadwalkan observasi praktik', 'Human Growth Lead', 0, 'HG'], ['Observasi Balinese massage & hot stone', 'Supervisor Outlet', 2, 'HG'], ['Isi rubric & bukti video (sintetis)', 'Human Growth Lead', 3, 'HG'], ['Rencana coaching bila skor < 3', 'Human Growth Lead', 5, 'HG']] },
    { id: 'SOP-HYG', name: 'SOP kebersihan ruang treatment', kind: 'SOP', ws: 'HG', version: 3, active: true, review: false, history: [{ v: 3, at: '2026-07-10', note: 'Revisi linen' }], steps: [] },
    { id: 'TPL-UTIL', name: 'Respons utility outlet', kind: 'Checklist', ws: 'HRD', version: 1, active: true, review: true, history: [{ v: 1, at: '2026-10-01', note: 'Ambang 100%/70%' }],
      steps: [['Validasi data jam treatment POS', 'Staf HRD', 1, 'HRD'], ['Diskusi kapasitas dengan Supervisor', 'Supervisor Outlet', 2, 'HRD'], ['Usulan tambah formasi / bantuan antaroutlet', 'Manager HRD', 5, 'HRD']] }
  ];

  function seed() {
    const T = (o) => ({ demo: true, contributors: [], checklist: [], discussion: [], assets: [], blocker: null, parent: null, reviewer: null, requireReview: false, sessionAt: null, version: 1, finding: null, ...o });
    const tasks = [
      T({ id: 'TSK-0001', ws: 'HRD', title: 'Validasi jam treatment POS Spa Ubud Okt–Nov', stage: 'Workplan', prio: 'Tinggi', pic: 'EMP-0142', reviewer: null, due: '2026-11-18', scope: 'OUT-UBD', source: { type: 'POS', id: 'POS-HRS-UBD-2611', label: 'Jam treatment POS Spa Ubud (F5)', route: 'hrd-home?outlet=OUT-UBD' }, checklist: [{ id: 'C1', text: 'Validasi jam treatment POS', done: true }, { id: 'C2', text: 'Usulan formasi ke OM', done: false }] }),
      T({ id: 'TSK-0002', ws: 'HRD', title: 'Utility Spa Santi 66%: di bawah ambang 70%', stage: 'Ide', prio: 'Sedang', pic: null, due: null, scope: 'OUT-SHT', source: { type: 'Utility', id: 'UTIL-OUT-SHT-2611', label: 'Utility Spa Santi Nov 2026 · 66%', route: 'hrd-home?outlet=OUT-SHT' }, finding: 'FND-UTIL-SHT-2611' }),
      T({ id: 'TSK-0003', ws: 'HRD', title: 'Perpanjang kontrak PKWT 3 receptionist', stage: 'Workplan', prio: 'Sedang', pic: 'EMP-0143', due: '2026-11-25', scope: 'ENT-SPA', source: { type: 'Kontrak', id: 'CTR-2611', label: 'Kontrak berakhir ≤ 30 hari', route: 'hrd-roster?contract=PKWT' }, checklist: [{ id: 'C1', text: 'Daftar karyawan', done: true }, { id: 'C2', text: 'Draf kontrak', done: false }, { id: 'C3', text: 'Tanda tangan', done: false }], requireReview: true, reviewer: 'EMP-0142' }),
      T({ id: 'TSK-0004', ws: 'HRD', title: 'Interview kandidat therapist Ubud (3 orang)', stage: 'Priority', prio: 'Tinggi', pic: 'EMP-0145', due: '2026-11-17', sessionAt: '2026-11-16 10:00', scope: 'OUT-UBD', source: { type: 'Rekrutmen', id: 'VAC-2611-001', label: 'Lowongan Therapist Spa Ubud', route: 'hrd-recruit' }, contributors: ['EMP-0153'] }),
      T({ id: 'TSK-0005', ws: 'HRD', title: 'Rekap koreksi presensi minggu 7–13 Nov', stage: 'Dikerjakan', prio: 'Rendah', pic: 'EMP-0143', due: '2026-11-14', scope: 'ENT-SPA', source: { type: 'Presensi', id: 'ATT-W46', label: 'Approval Presensi', route: 'hrd-att-approval' }, blocker: { reason: 'Menunggu keputusan Supervisor Santi', waiting: 'EMP-0154', next: 'Ingatkan via Approval', at: '2026-11-13 09:10' } }),
      T({ id: 'TSK-0006', ws: 'HRD', title: 'Laporan BPJS Oktober siap dikirim', stage: 'Review', prio: 'Sedang', pic: 'EMP-0143', reviewer: 'EMP-0142', requireReview: true, due: '2026-11-13', scope: 'ENT-HQ', source: { type: 'Laporan', id: 'RPT-BPJS-2610', label: 'BPJS Oktober (F7)', route: 'hrd-reports' }, checklist: [{ id: 'C1', text: 'Rekonsiliasi peserta', done: true }, { id: 'C2', text: 'Unggah dokumen (sintetis)', done: true }] }),
      T({ id: 'TSK-0007', ws: 'HRD', title: 'Arsip slip Oktober', stage: 'Selesai', prio: 'Rendah', pic: 'EMP-0142', due: '2026-11-05', scope: 'ENT-HQ', source: { type: 'Payroll', id: 'PAY-2610', label: 'Payroll Oktober', route: 'hrd-payroll', sensitive: true } }),
      T({ id: 'TSK-0008', ws: 'HRD', title: 'Update data kontak darurat Office', stage: 'Workplan', prio: 'Rendah', pic: 'EMP-0143', due: '2026-11-10', scope: 'ENT-HQ', source: { type: 'Direktori', id: 'DIR-HQ', label: 'Direktori Office', route: 'hrd-roster?outlet=LOC-HQ' } }),
      T({ id: 'TSK-0101', ws: 'HG', title: 'Coaching hot stone untuk 4 therapist Triloka', stage: 'Priority', prio: 'Tinggi', pic: 'EMP-0144', due: '2026-11-20', sessionAt: '2026-11-19 14:00', scope: 'OUT-TRL', source: { type: 'KPI', id: 'KPI-QA-TRL', label: 'Skor kualitas treatment Triloka (F6)', route: 'hrd-kpi' }, contributors: ['EMP-0155'] }),
      T({ id: 'TSK-0102', ws: 'HG', title: 'Training SOP kebersihan v3 (semua outlet)', stage: 'Workplan', prio: 'Sedang', pic: 'EMP-0144', due: '2026-11-22', sessionAt: '2026-11-18 14:00', scope: 'ENT-SPA', source: { type: 'Library', id: 'SOP-HYG', label: 'SOP kebersihan v3', route: 'hrd-library?id=SOP-HYG' } }),
      T({ id: 'TSK-0103', ws: 'HG', title: 'Ide: buddy system therapist baru', stage: 'Ide', prio: 'Rendah', pic: null, due: null, scope: 'ENT-SPA', source: { type: 'Reflection', id: 'RFL-2610', label: 'Monthly Reflection Okt (F8)', route: 'hrd-race' } }),
      T({ id: 'TSK-0104', ws: 'HG', title: 'Verifikasi kompetensi therapist Ubud batch Okt', stage: 'Review', prio: 'Sedang', pic: 'EMP-0144', reviewer: 'EMP-0142', requireReview: true, due: '2026-11-15', scope: 'OUT-UBD', source: { type: 'Template', id: 'TPL-KOMP', label: 'Verifikasi kompetensi v1', route: 'hrd-library?id=TPL-KOMP' }, checklist: [{ id: 'C1', text: 'Observasi 5 therapist', done: true }, { id: 'C2', text: 'Rubric terisi', done: false }] }),
      T({ id: 'TSK-0105', ws: 'HG', title: 'Rencana karier receptionist → supervisor', stage: 'Issue', prio: 'Sedang', pic: 'EMP-0144', due: '2026-11-28', scope: 'ENT-SPA', source: { type: 'Talent', id: '9BOX-2611', label: '9-Box Talent (F6)', route: 'hrd-ninebox' } })
    ];
    const events = tasks.map((t, i) => ({ id: `EVT-${String(i + 1).padStart(4, '0')}`, task: t.id, by: 'Seed fixture', at: '2026-11-10 08:00', kind: 'Dibuat', before: null, after: t.stage, demo: true }));
    events.push({ id: 'EVT-0100', task: 'TSK-0001', by: 'Made Gunarsa (Manager HRD)', at: '2026-11-12 09:00', kind: 'Pindah tahap', before: 'Issue', after: 'Workplan', demo: true });
    tasks[0].discussion.push({ id: 'MSG-0001', by: 'Mila (Supervisor Outlet)', at: '2026-11-12 10:15', text: 'Sabtu–Minggu antrean > 2 jam. Butuh 2–3 therapist tambahan.', demo: true });
    tasks[0].assets.push({ id: 'AST-0001', name: 'utility-ubud-nov.csv (sintetis)', by: 'Made Gunarsa (Manager HRD)', at: '2026-11-12 09:05', demo: true });
    return { seeded: true, tasks, events, templates: TEMPLATES(), focus: [{ emp: 'EMP-0142', task: 'TSK-0001', date: TODAY }, { emp: 'EMP-0143', task: 'TSK-0005', date: TODAY }], seq: { task: 1000, evt: 1000, msg: 100, ast: 100 } };
  }
  function ensure(hr) {
    if (!hr.f3 || !hr.f3.seeded) { const keep = hr.f3; hr.f3 = seed(); if (keep) for (const k of ['tasks', 'events', 'focus']) hr.f3[k].push(...(keep[k] || [])); }
    return hr.f3;
  }
  const scopeOk = (hr, role, t) => {
    const d = H.roleDef(role), me = hr.roleEmp[role];
    if (d.scope === 'none') return false;
    if (t.source?.sensitive && d.payroll !== 'detail' && t.pic !== me) return false;
    if (['owner', 'hrd'].includes(role)) return true;
    if (role === 'hrd-ops') return t.ws === 'HRD' || [t.pic, t.reviewer, ...t.contributors].includes(me);
    if (role === 'hg-lead') return t.ws === 'HG' || [t.pic, t.reviewer, ...t.contributors].includes(me);
    if ([t.pic, t.reviewer, ...t.contributors].includes(me)) return true;
    if (role === 'outlet-spv') return t.scope === 'OUT-UBD';
    if (role === 'ops-manager') return /^OUT-|ENT-SPA/.test(t.scope || '');
    return false;
  };
  const visible = (hr, role) => ensure(hr).tasks.filter(t => scopeOk(hr, role, t));
  const wsVisible = (role) => ({ owner: ['HRD', 'HG'], hrd: ['HRD', 'HG'], 'hrd-ops': ['HRD'], 'hg-lead': ['HG'], 'outlet-spv': ['HRD', 'HG'], 'ops-manager': ['HRD', 'HG'] }[role] || []);
  const overdue = (t) => t.due && t.due < TODAY && t.stage !== 'Selesai';
  const agenda = (hr, role) => visible(hr, role).flatMap(t => [
    ...(t.sessionAt ? [{ kind: 'Sesi', date: t.sessionAt.slice(0, 10), time: t.sessionAt.slice(11), task: t.id, title: t.title, ws: t.ws }] : []),
    ...(t.due && t.stage !== 'Selesai' ? [{ kind: 'Tenggat', date: t.due, time: '23:59', task: t.id, title: t.title, ws: t.ws }] : [])]);
  const myTasks = (hr, role) => { const me = hr.roleEmp[role]; return visible(hr, role).filter(t => t.pic === me || t.checklist.some(c => c.pic === me)); };
  const reviewQueue = (hr, role) => { const me = hr.roleEmp[role]; return visible(hr, role).filter(t => t.stage === 'Review' && t.reviewer === me); };
  const focusOf = (hr, emp, date = TODAY) => ensure(hr).focus.filter(f => f.emp === emp && f.date === date).map(f => ensure(hr).tasks.find(t => t.id === f.task)).filter(Boolean);

  function update(state, hr, action, input, ctx) {
    const f3 = ensure(hr), { need, audit, by, role } = ctx;
    const me = hr.roleEmp[role];
    const ev = (t, kind, before, after, reason) => { f3.events.push({ id: `EVT-${++f3.seq.evt}`, task: t.id, by, at: now(), kind, before, after, reason: reason || null, demo: t.demo }); t.version++; };
    const get = (id) => { const t = f3.tasks.find(x => x.id === id); if (!t) throw new Error('Kartu tidak ditemukan.'); if (!scopeOk(hr, role, t)) throw new Error(`Akses ditolak: kartu ${id} di luar cakupan ${H.roleDef(role).label}.`); return t; };
    const writer = () => { if (!['owner', 'hrd', 'hrd-ops', 'hg-lead', 'outlet-spv', 'ops-manager'].includes(role)) throw new Error(`Akses ditolak: ${H.roleDef(role).label} hanya membaca kartu.`); };
    const ver = (t) => { if (input.version !== undefined && input.version !== '' && Number(input.version) !== t.version) throw new Error(`Konflik: kartu ${t.id} sudah diubah orang lain (versi ${t.version}). Status terbaru dimuat; ulangi perubahan Anda.`); };
    switch (action) {
      case 'task-create': {
        writer();
        const stage = input.stage || 'Ide'; if (!['Ide', 'Issue', 'Workplan'].includes(stage)) throw new Error('Temuan masuk sebagai Ide, Issue atau Workplan.');
        if (input.sourceId) {
          const dup = f3.tasks.find(t => t.source?.id === input.sourceId && (t.finding || '') === (input.finding || ''));
          if (dup) { return dup.id; }
        }
        const title = String(input.title || '').trim(); if (title.length < 5) throw new Error('Judul minimal 5 karakter.');
        if (stage === 'Workplan' && (!input.pic || !input.due)) throw new Error('Workplan membutuhkan PIC dan tenggat.');
        const ws = input.ws || (role === 'hg-lead' ? 'HG' : 'HRD');
        const t = { id: `TSK-${++f3.seq.task}`, ws, title, stage, prio: input.prio || 'Sedang', pic: input.pic || null, reviewer: input.reviewer || null, contributors: [], due: input.due || null, sessionAt: input.sessionAt || null, scope: input.scope || 'ENT-SPA', source: input.sourceId ? { type: input.sourceType || 'Temuan', id: input.sourceId, label: input.sourceLabel || input.sourceId, route: input.sourceRoute || '' } : null, finding: input.finding || null, checklist: [], discussion: [], assets: [], blocker: null, parent: input.parent || null, requireReview: !!input.requireReview, version: 1, demo: true };
        f3.tasks.push(t); ev(t, 'Dibuat', null, stage); t.version = 1;
        audit(hr, by, 'Buat kartu', `${t.id} · ${title} (${stage})`, { object: 'Tugas', ref: t.id });
        return t.id;
      }
      case 'task-move': {
        writer(); const t = get(input.id); ver(t);
        const to = input.to; if (!STAGES.includes(to)) throw new Error('Tahap tidak dikenal.');
        if (to === t.stage) return t.id;
        if (['Workplan', 'Priority', 'Dikerjakan', 'Review'].includes(to) && (!t.pic || !t.due)) throw new Error(`Tetapkan PIC dan tenggat sebelum memindahkan ${t.id} ke ${to}.`);
        if (to === 'Selesai') {
          const open = t.checklist.filter(c => !c.done).length;
          if (open) throw new Error(`Belum bisa Selesai: ${open} butir checklist belum lengkap.`);
          if (t.requireReview && !(t.stage === 'Review' && t.reviewer === me)) throw new Error(`Kartu ini wajib direview. Pindahkan ke Review; hanya reviewer ${t.reviewer || '(belum ditetapkan)'} yang menyelesaikan.`);
        }
        if (to === 'Review' && t.requireReview && !t.reviewer) throw new Error('Tetapkan reviewer sebelum Review.');
        const from = t.stage; t.stage = to; if (to === 'Selesai') t.blocker = null;
        ev(t, 'Pindah tahap', from, to, input.via ? `via ${input.via}` : null);
        return t.id;
      }
      case 'task-assign': {
        writer(); const t = get(input.id); ver(t);
        const field = input.field || 'pic'; if (!['pic', 'reviewer'].includes(field)) throw new Error('Field tidak dikenal.');
        const emp = input.emp || null; if (emp && !hr.people.some(p => p.id === emp)) throw new Error('Karyawan tidak ditemukan.');
        const before = t[field]; if (before === emp) return t.id;
        t[field] = emp; ev(t, field === 'pic' ? 'Ganti PIC' : 'Ganti reviewer', before, emp);
        if (field === 'pic' && before) f3.focus = f3.focus.filter(f => !(f.task === t.id && f.emp === before));
        return t.id;
      }
      case 'task-edit': {
        writer(); const t = get(input.id); ver(t);
        const ch = [];
        if (input.due !== undefined && input.due !== (t.due || '')) { ch.push(['Tenggat', t.due, input.due || null]); t.due = input.due || null; }
        if (input.prio && input.prio !== t.prio) { ch.push(['Prioritas', t.prio, input.prio]); t.prio = input.prio; }
        if (input.sessionAt !== undefined && (input.sessionAt || null) !== t.sessionAt) { ch.push(['Jadwal sesi', t.sessionAt, input.sessionAt || null]); t.sessionAt = input.sessionAt || null; }
        if (!ch.length) throw new Error('Tidak ada perubahan.');
        ch.forEach(([k, b, a]) => ev(t, 'Ubah ' + k, b, a));
        return t.id;
      }
      case 'task-comment': {
        const t = get(input.id); const text = String(input.text || '').trim(); if (text.length < 2) throw new Error('Tulis pesan diskusi.');
        t.discussion.push({ id: `MSG-${++f3.seq.msg}`, by, at: now(), text, demo: t.demo }); ev(t, 'Diskusi', null, text.slice(0, 40));
        return t.id;
      }
      case 'task-asset': {
        writer(); const t = get(input.id); const name = String(input.name || '').trim(); if (!name) throw new Error('Nama file bukti wajib.');
        if (/\.(exe|js|bat|sh)$/i.test(name)) throw new Error('Jenis file tidak diizinkan.');
        t.assets.push({ id: `AST-${++f3.seq.ast}`, name: name + ' (sintetis)', by, at: now(), demo: t.demo }); ev(t, 'Bukti ditambah', null, name);
        return t.id;
      }
      case 'task-check': {
        writer(); const t = get(input.id);
        if (input.text) { const c = { id: 'C' + (t.checklist.length + 1), text: String(input.text).trim(), done: false, pic: input.pic || null }; t.checklist.push(c); ev(t, 'Checklist ditambah', null, c.text); return t.id; }
        const c = t.checklist.find(x => x.id === input.item); if (!c) throw new Error('Butir checklist tidak ditemukan.');
        c.done = !c.done; ev(t, c.done ? 'Checklist selesai' : 'Checklist dibuka', c.text, c.done ? 'selesai' : 'terbuka');
        return t.id;
      }
      case 'task-blocker': {
        writer(); const t = get(input.id);
        if (input.clear) { if (!t.blocker) return t.id; const b = t.blocker.reason; t.blocker = null; ev(t, 'Blocker dilepas', b, null); return t.id; }
        if (t.stage === 'Selesai') throw new Error('Kartu selesai tidak bisa diberi blocker.');
        const reason = String(input.reason || '').trim(); if (reason.length < 5) throw new Error('Alasan blocker minimal 5 karakter.');
        t.blocker = { reason, waiting: input.waiting || null, next: input.next || '', at: now() }; ev(t, 'Blocker dicatat', null, reason);
        return t.id;
      }
      case 'task-review': {
        const t = get(input.id); ver(t);
        if (t.stage !== 'Review') throw new Error(`${t.id} tidak sedang di Review.`);
        if (t.reviewer !== me) throw new Error('Akses ditolak: hanya reviewer yang memutuskan review.');
        if (input.decision === 'return') {
          const note = String(input.note || '').trim(); if (note.length < 5) throw new Error('Catatan revisi minimal 5 karakter.');
          t.stage = 'Dikerjakan'; t.discussion.push({ id: `MSG-${++f3.seq.msg}`, by, at: now(), text: 'Revisi: ' + note, demo: t.demo }); ev(t, 'Dikembalikan dari review', 'Review', 'Dikerjakan', note); return t.id;
        }
        const open = t.checklist.filter(c => !c.done).length; if (open) throw new Error(`Belum bisa Selesai: ${open} butir checklist belum lengkap.`);
        t.stage = 'Selesai'; t.blocker = null; ev(t, 'Review diterima', 'Review', 'Selesai');
        return t.id;
      }
      case 'template-apply': {
        writer(); const tp = f3.templates.find(x => x.id === input.template); if (!tp || !tp.steps.length) throw new Error('Template tidak punya langkah.');
        const start = input.start || addDays(TODAY, 3); if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('Tanggal mulai tidak valid.');
        const emp = input.emp ? hr.people.find(p => p.id === input.emp) : null;
        const loc = emp ? (H.placementOn(hr, emp.id) || H.upcomingOf(hr, emp.id))?.location : (input.scope || 'OUT-UBD');
        const spv = hr.placements.find(x => x.position === 'POS-SPV' && x.leads === loc && !x.to)?.emp || 'EMP-0153';
        const key = `${tp.id}:${emp ? emp.id : loc}:${start}`;
        const dup = f3.tasks.find(t => t.source?.id === key); if (dup) return dup.id;
        const parentId = `TSK-${++f3.seq.task}`;
        const parent = { id: parentId, ws: tp.ws, title: `${tp.name}${emp ? ' · ' + emp.name : ''}`, stage: 'Workplan', prio: 'Tinggi', pic: tp.ws === 'HG' ? 'EMP-0144' : 'EMP-0143', reviewer: tp.review ? 'EMP-0142' : null, requireReview: tp.review, contributors: [], due: addDays(start, Math.max(...tp.steps.map(s => s[2]))), sessionAt: null, scope: loc, source: { type: 'Template', id: key, label: `${tp.id} v${tp.version}`, route: `hrd-library?id=${tp.id}`, template: tp.id, templateVersion: tp.version }, finding: null, checklist: [], discussion: [], assets: [], blocker: null, parent: null, version: 1, demo: true };
        f3.tasks.push(parent); ev(parent, 'Dibuat dari template', null, `${tp.id} v${tp.version}`); parent.version = 1;
        tp.steps.forEach(([text, picRole, rel, ws], i) => {
          const pic = picRole === 'Supervisor Outlet' ? spv : ROLE_PIC[picRole];
          const sid = `TSK-${++f3.seq.task}`;
          const sub = { id: sid, ws, title: text + (emp ? ' · ' + emp.name : ''), stage: 'Workplan', prio: 'Sedang', pic, reviewer: null, requireReview: false, contributors: [], due: addDays(start, rel), sessionAt: /Orientasi|Observasi/.test(text) ? `${addDays(start, rel)} 10:00` : null, scope: loc, source: { type: 'Template', id: `${key}#${i + 1}`, label: `${tp.id} v${tp.version} · langkah ${i + 1}`, route: `hrd-library?id=${tp.id}` }, finding: null, checklist: [], discussion: [], assets: [], blocker: null, parent: parentId, version: 1, demo: true };
          f3.tasks.push(sub); ev(sub, 'Dibuat dari template', null, `${tp.id} langkah ${i + 1}`); sub.version = 1;
          parent.checklist.push({ id: 'C' + (i + 1), text, done: false, pic, sub: sid });
        });
        audit(hr, by, 'Terapkan template', `${tp.id} v${tp.version} → ${parentId} (${tp.steps.length} subtugas)`, { object: 'Tugas', ref: parentId });
        return parentId;
      }
      case 'template-version': {
        if (!['owner', 'hrd', 'hg-lead'].includes(role)) throw new Error('Akses ditolak: versi template oleh Manager HRD / HG Lead.');
        const tp = f3.templates.find(x => x.id === input.template); if (!tp) throw new Error('Template tidak ditemukan.');
        const note = String(input.note || '').trim(); if (note.length < 5) throw new Error('Catatan versi minimal 5 karakter.');
        if (input.step) tp.steps.push([String(input.step), input.picRole || 'Staf HRD', Number(input.rel || 0), tp.ws]);
        tp.version++; tp.history.push({ v: tp.version, at: TODAY, note });
        audit(hr, by, 'Versi template', `${tp.id} → v${tp.version}: ${note}`, { object: 'Template', ref: tp.id, before: `v${tp.version - 1}`, after: `v${tp.version}` });
        return `${tp.id} v${tp.version}`;
      }
      case 'focus-toggle': {
        const t = get(input.id), date = input.date || TODAY; if (!me) throw new Error('Role ini tidak punya My Day.');
        const i = f3.focus.findIndex(f => f.emp === me && f.task === t.id && f.date === date);
        if (i >= 0) { f3.focus.splice(i, 1); return 'dilepas dari My Day'; }
        f3.focus.push({ emp: me, task: t.id, date }); return 'ditambahkan ke My Day';
      }
      default: return undefined;
    }
  }
  const purge = (hr) => { if (!hr.f3) return; hr.f3.tasks = hr.f3.tasks.filter(t => !t.demo); hr.f3.events = hr.f3.events.filter(e => !e.demo); hr.f3.focus = hr.f3.focus.filter(f => hr.f3.tasks.some(t => t.id === f.task)); };
  const keep = (hr) => hr.f3 ? { seeded: false, tasks: hr.f3.tasks.filter(t => !t.demo), events: hr.f3.events.filter(e => !e.demo), focus: [] } : null;

  /* rantai HR.EXT: F3 menangani aksinya sendiri, sisanya diteruskan ke ekstensi sebelumnya */
  const prev = { ...H.EXT };
  H.EXT.update = (state, hr, action, input, ctx) => { const r = update(state, hr, action, input, ctx); return r !== undefined ? r : prev.update ? prev.update(state, hr, action, input, ctx) : (() => { throw new Error('Aksi tidak dikenal: ' + action); })(); };
  H.EXT.purge = (hr) => { prev.purge?.(hr); purge(hr); };
  H.EXT.keep = (hr) => { const k = prev.keep?.(hr); const k3 = keep(hr); if (k && k3) k.f3 = k3; return k || (k3 ? { f3: k3 } : null); };
  H.EXT.ensure = (hr) => { prev.ensure?.(hr); if (hr.f2 && hr.f2.f3) { hr.f3 = hr.f2.f3; delete hr.f2.f3; } ensure(hr); };
  return { STAGES, PRIOS, WS, ROLE_PIC, TEMPLATES, addDays, ensure, scopeOk, visible, wsVisible, overdue, agenda, myTasks, reviewQueue, focusOf };
})();
if (typeof module !== 'undefined') module.exports = HR3;
