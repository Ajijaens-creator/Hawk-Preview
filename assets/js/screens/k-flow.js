/* Module K — Flow Intelligence & Management Control Tower (MP-HAWK-08)
   NV-61 Procurement Flow Control Tower · NV-62 Order Journey & Delay Investigation · role widgets on existing screens.
   Reads events derived from existing HAWK documents (MRF/PO/Transfer/GRN/Bill/Payment) — no second ledger.
   PFHI is PROVISIONAL (configurable weights), never a validated score. AI here = deterministic SIMULATION. */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const F = HAWK.flow;
  const ui = HAWK.ui;
  const esc = U.esc;
  const V = HAWK.views;
  const RL = (r) => HAWK.ROLE_LABEL[r] || r || '—';
  const MGR = ['OWNER', 'BU_MANAGER', 'HEAD_DIV'];

  /* ---------- small helpers ---------- */
  const shortTs = (iso) => U.date(iso).replace(/ \d{4}$/, '') + ' ' + String(iso).slice(11, 16);
  const hh = (h) => (h === null || h === undefined || isNaN(h) ? '—' : h >= 48 ? `${U.num(h / 24, 1)} hari` : `${U.num(h, 1)} jam`);
  const SLA_TXT = { OK: 'Dalam SLA', RISK: 'Berisiko', BREACH: 'Lewat SLA', ONTIME: 'Tepat waktu', LATE: 'Terlambat', NA: '—', DONE: 'Selesai', ACTIVE: 'Berjalan', PENDING: 'Belum', SKIP: 'Tidak dipakai', PARTIAL: 'Sebagian', STOP: 'Berhenti' };
  const SLA_CLS = { OK: 'ok', ONTIME: 'ok', DONE: 'ok', RISK: 'warn', PARTIAL: 'warn', ACTIVE: 'info', BREACH: 'bad', LATE: 'bad', STOP: 'bad', PENDING: '', SKIP: '', NA: '' };
  const slaBadge = (k) => `<span class="badge ${SLA_CLS[k] || ''}">${SLA_TXT[k] || esc(k || '—')}</span>`;
  const PRI_CLS = { P0: 'bad', P1: 'warn', P2: 'info', P3: '' };
  const PRI_TXT = { P0: 'P0 Kritis', P1: 'P1 Tinggi', P2: 'P2 Sedang', P3: 'P3 Rendah' };
  const priBadge = (p) => (p ? `<span class="badge ${PRI_CLS[p]}">${PRI_TXT[p] || p}</span>` : '');
  const IS_TXT = { OPEN: 'Baru', IN_PROGRESS: 'Ditangani', MONITORING: 'Dipantau (ETA revisi)', ESCALATED: 'Dieskalasi', RESOLVED: 'Selesai' };
  const isBadge = (st) => `<span class="badge ${st === 'RESOLVED' ? 'ok' : st === 'ESCALATED' ? 'bad' : st === 'MONITORING' ? 'info' : 'warn'}">${IS_TXT[st] || st}</span>`;
  const srcLine = (s, extra = '') =>
    `<div class="ft-src">${ui.icon('clock', 14)} <span><b>Sumber:</b> riwayat dokumen MRF / PO / Transfer / Penerimaan / Finance (Mock Adapter) · <b>As-of:</b> ${U.datetime(F.now(s))} (jam demo) · ${ui.demo('DEMO / SIMULASI')} ${extra}</span></div>`;
  const inScopeRows = (ctx) => F.rows(ctx.s).filter((r) => ctx.inScope(r.branch) && (ctx.role !== 'STAFF' || r.m.requester === ctx.user.id || ctx.user.scope.includes(r.branch)));
  const scopedIssues = (ctx) => (ctx.s.flowIssues || []).filter((i) => !i.branch || ctx.inScope(i.branch));
  const firstItem = (s, m) => m.lines.map((l) => `${esc(S.itemName(s, l.item))} × ${l.qty}`).join(', ');
  const journeyBtn = (id, label = 'Lihat perjalanan') => `<button class="btn sm ghost" data-nav="62" data-q='${esc(JSON.stringify({ mrf: id }))}'>${esc(label)} ›</button>`;

  /* ---------- issue actions (shared by NV-61, NV-62 and widgets) ---------- */
  function issueButtons(ctx, i, compact) {
    if (i.status === 'RESOLVED') return '';
    const b = [];
    const can = (op) => ctx.can(op);
    const isPo = /^PO/.test(i.ref || '');
    if (can('flow.review')) b.push(['isReview', 'Tinjau']);
    if (can('flow.assign') && (MGR.includes(ctx.role) || ctx.role === i.pic)) b.push(['isAssign', 'Tugaskan']);
    if (can('flow.requestUpdate')) b.push(['isUpdate', 'Minta update']);
    if (can('flow.escalate')) b.push(['isEsc', 'Eskalasi']);
    if (can('flow.recordReason')) b.push(['isReason', i.reasonRequired ? 'Catat alasan *' : 'Catat alasan']);
    if (isPo && can('flow.changeEta')) b.push(['isEta', 'Ubah ETA']);
    if (can('flow.resolve')) b.push(['isResolve', 'Selesaikan']);
    const shown = compact ? b.filter((x) => ['isReason', 'isEta', 'isEsc', 'isResolve'].includes(x[0])) : b;
    return `<div class="row ft-acts">${shown.map(([a, l]) => `<button class="btn sm ${a === 'isResolve' ? '' : 'ghost'}" data-a="${a}" data-is="${esc(i.id)}">${esc(l)}</button>`).join('')}</div>`;
  }
  function issueCard(ctx, i, opts = {}) {
    const s = ctx.s;
    const m = s.mrfs.find((x) => x.id === i.mrf);
    const po = /^PO/.test(i.ref) ? s.pos.find((p) => p.id === i.ref) : null;
    return `<div class="ft-issue p-${i.priority} ${i.status === 'RESOLVED' ? 'done' : ''}">
      <div class="row between" style="gap:6px;align-items:flex-start"><div><div class="row" style="gap:6px">${priBadge(i.priority)} ${isBadge(i.status)} <span class="mono tiny">${esc(i.id)}</span></div>
        <b class="small" style="display:block;margin-top:4px">${esc(F.STAGE_LABEL[i.stage] || i.stage)} — ${i.sla === 'BREACH' ? 'lewat SLA' : 'mendekati SLA'}${i.breachH ? ` ${hh(i.breachH)}` : ''}</b></div>
        <div class="tiny muted" style="text-align:right">Ref ${ui.id(i.ref)}<br>${m ? ui.id(m.id) : ''}</div></div>
      <div class="ft-kv">
        <span>Dampak</span><b>${esc(i.impact)}</b>
        <span>PIC</span><b>${esc(RL(i.pic))}${i.picUser ? ' · ' + esc(S.userName(s, i.picUser)) : ''}${i.escalatedTo ? ` · eskalasi ke ${esc(RL(i.escalatedTo))}` : ''}</b>
        <span>Tenggat SLA asli</span><b>${U.datetime(i.dueOriginal)}${po && po.eta && po.eta !== po.promised ? ` · ETA revisi <span class="badge info">${U.date(po.eta)}</span>` : ''}</b>
        <span>Alasan</span><b>${i.reasonCode ? esc((F.REASONS.find((r) => r[0] === i.reasonCode) || [])[1] || i.reasonCode) + (i.reason ? ' — ' + esc(i.reason) : '') + (i.reasonAuto ? ' <span class="tiny muted">(otomatis dari data)</span>' : '') : '<span class="badge warn">Wajib dicatat PIC</span>'}</b>
        <span>Bukti</span><b>${(i.evidence || []).map((e) => ui.id(e)).join(' ')}</b>
        <span>Rekomendasi</span><b>${esc(i.recommendation)} <span class="badge ai">AI SIMULATION</span></b>
        ${i.status === 'RESOLVED' ? `<span>Selesai</span><b>${U.datetime(i.resolvedAt)} · ${esc(S.userName(s, i.resolvedBy))} · ${hh(i.resolutionH)} — ${esc(i.resolution)}</b>` : ''}
      </div>
      ${opts.history ? `<details class="tiny" style="margin-top:6px"><summary>Jejak audit (${i.history.length})</summary>${i.history.map((h) => `<div>${U.datetime(h.ts)} · ${esc(S.userName(s, h.by))} · <b>${esc(h.action)}</b> — ${esc(h.note || '')}</div>`).join('')}</details>` : ''}
      ${issueButtons(ctx, i, opts.compact)}
      ${opts.journey !== false && m ? `<div style="margin-top:6px">${journeyBtn(m.id)}</div>` : ''}
    </div>`;
  }
  const issueActions = {
    isReview(el, ctx) {
      ctx.act('flow.review', { id: el.dataset.is }, 'Isu ditandai sudah ditinjau');
    },
    isAssign(el, ctx) {
      const s = ctx.s;
      const i = s.flowIssues.find((x) => x.id === el.dataset.is);
      const users = s.users.filter((u) => u.role !== 'STAFF' && (u.role === i.pic || MGR.includes(u.role) || u.role === 'SUPERVISOR'));
      ui.openModal(
        'Tugaskan isu ' + i.id,
        `<div class="field"><label for="fa-u">Penanggung jawab</label><select class="inp" id="fa-u">${users.map((u) => `<option value="${u.id}" ${u.role === i.pic ? 'selected' : ''}>${esc(u.name)} — ${esc(RL(u.role))}</option>`).join('')}</select></div><p class="tiny muted">Penugasan adalah tanggung jawab tahap, bukan penilaian kinerja individu.</p>`,
        `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" id="fa-ok">Tugaskan</button>`
      );
      document.getElementById('fa-ok').onclick = () => {
        const u = document.getElementById('fa-u').value;
        ui.closeModal();
        ctx.act('flow.assign', { id: i.id, user: u }, 'Isu ditugaskan');
      };
    },
    isUpdate(el, ctx) {
      ui.ask('Minta update', 'Pesan untuk PIC', (note) => ctx.act('flow.requestUpdate', { id: el.dataset.is, note }, 'Permintaan update terkirim (simulasi notifikasi)'), { placeholder: 'Contoh: mohon konfirmasi sisa 1 botol ke supplier hari ini', ok: 'Kirim' });
    },
    isEsc(el, ctx) {
      ui.ask('Eskalasi isu', 'Alasan eskalasi (wajib)', (note) => ctx.act('flow.escalate', { id: el.dataset.is, note }, 'Isu dieskalasi'), { placeholder: 'Contoh: lewat SLA > 1 hari, outlet butuh untuk weekend', ok: 'Eskalasi', danger: true });
    },
    isReason(el, ctx) {
      const i = ctx.s.flowIssues.find((x) => x.id === el.dataset.is);
      ui.openModal(
        'Catat alasan keterlambatan',
        `<div class="field"><label for="fr-c">Kategori</label><select class="inp" id="fr-c">${F.REASONS.map(([k, l]) => `<option value="${k}" ${k === i.reasonCode ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
         <div class="field"><label for="fr-n">Penjelasan *</label><textarea class="inp" id="fr-n" rows="3" placeholder="Fakta yang diketahui — bukan menyalahkan orang">${esc(i.reasonAuto ? '' : i.reason || '')}</textarea></div>
         <div class="field"><label for="fr-e">Referensi bukti (opsional)</label><input class="inp" id="fr-e" placeholder="Contoh: chat supplier 8 Nov / no. surat jalan"></div>`,
        `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" id="fr-ok">Simpan alasan</button>`
      );
      document.getElementById('fr-ok').onclick = () => {
        const p = { id: i.id, code: document.getElementById('fr-c').value, note: document.getElementById('fr-n').value, evidence: document.getElementById('fr-e').value.trim() || undefined };
        ui.closeModal();
        ctx.act('flow.recordReason', p, 'Alasan keterlambatan tercatat');
      };
    },
    isEta(el, ctx) {
      const s = ctx.s;
      const i = s.flowIssues.find((x) => x.id === el.dataset.is);
      const po = s.pos.find((p) => p.id === i.ref);
      const min = F.now(s).slice(0, 10);
      ui.openModal(
        'Ubah perkiraan tiba — ' + po.id,
        `<p class="small">Tanggal janji supplier asli <b>${U.date(po.promised)}</b> tetap tersimpan sebagai jatuh tempo SLA. ETA baru hanya menambah riwayat.</p>
         <div class="field"><label for="fe-d">ETA baru *</label><input class="inp" type="date" id="fe-d" min="${min}" value="${min}"></div>
         <div class="field"><label for="fe-c">Kategori alasan</label><select class="inp" id="fe-c">${F.REASONS.map(([k, l]) => `<option value="${k}" ${k === (i.reasonCode || 'SUPPLIER_LATE') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
         <div class="field"><label for="fe-r">Alasan / konfirmasi supplier *</label><textarea class="inp" id="fe-r" rows="2" placeholder="Contoh: supplier konfirmasi sisa 1 botol dikirim Selasa"></textarea></div>
         ${(po.etaHistory || []).length ? `<div class="tiny muted">Riwayat: ${po.etaHistory.map((h) => `${U.date(h.from)} → ${U.date(h.to)} (${esc(h.reason)})`).join(' · ')}</div>` : ''}`,
        `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" id="fe-ok">Simpan ETA</button>`
      );
      document.getElementById('fe-ok').onclick = () => {
        const p = { po: po.id, eta: document.getElementById('fe-d').value, code: document.getElementById('fe-c').value, reason: document.getElementById('fe-r').value };
        ui.closeModal();
        ctx.act('flow.changeEta', p, 'ETA revisi tersimpan — jatuh tempo asli tetap');
      };
    },
    isResolve(el, ctx) {
      ui.ask('Selesaikan isu', 'Catatan penyelesaian (wajib)', (note) => ctx.act('flow.resolve', { id: el.dataset.is, note }, 'Isu diselesaikan'), { placeholder: 'Contoh: barang sudah diterima & diserahkan', ok: 'Selesaikan' });
    },
    demoClock(el, ctx) {
      ctx.act('demo.advanceClock', { hours: +el.dataset.h || 24 }, (d) => 'Jam demo maju → ' + U.datetime(d.now));
    },
  };

  /* ---------- NV-61 Procurement Flow Control Tower ---------- */
  const FILTERS = [
    ['period', 'Periode', (s) => [['ALL', 'Semua'], ['7', '7 hari'], ['30', '30 hari'], ['90', '90 hari']]],
    ['bu', 'BU', (s) => [['ALL', 'Semua BU'], ...s.org.filter((o) => o.type === 'BU' && o.status === 'ACTIVE').map((o) => [o.id, o.name])]],
    ['branch', 'Cabang/Divisi', (s) => [['ALL', 'Semua unit'], ...s.org.filter((o) => ['BRANCH', 'DIVISION'].includes(o.type) && o.status === 'ACTIVE').map((o) => [o.id, o.name])]],
    ['supplier', 'Supplier', (s) => [['ALL', 'Semua supplier'], ...s.suppliers.map((x) => [x.id, x.name])]],
    ['cat', 'Kategori', (s) => [['ALL', 'Semua kategori'], ...U.uniq(s.items.map((i) => i.cat)).map((c) => [c, c])]],
    ['pic', 'PIC', () => [['ALL', 'Semua PIC'], ...['SUPERVISOR', 'PURCHASING', 'WAREHOUSE', 'FINANCE', 'BU_MANAGER'].map((r) => [r, RL(r)])]],
    ['priority', 'Prioritas', () => [['ALL', 'Semua'], ['P0', 'P0 Kritis'], ['P1', 'P1 Tinggi'], ['P2', 'P2 Sedang']]],
    ['status', 'Status', () => [['ALL', 'Semua'], ['OPEN', 'Masih berjalan'], ['LATE', 'Terlambat / lewat SLA'], ['DONE', 'Selesai']]],
  ];
  function drillSet(L, title, ids) {
    L.drill = { title, ids };
  }

  V[61] = {
    render(ctx) {
      const { s, L } = ctx;
      L.f = L.f || {};
      const f = L.f;
      const scoped = inScopeRows(ctx);
      const rows = F.filter(s, scoped, f);
      const k = F.kpis(s, f);
      const kRows = k.rows.filter((r) => scoped.includes(r) || scoped.some((x) => x.id === r.id));
      const hist = k.hist;
      const stages = F.stageStats(s, rows, hist);
      const heat = F.heatmap(s, rows);
      const sup = F.supplierStats(s, f).slice(0, 6);
      const reasons = F.reasons(s, rows, hist).slice(0, 6);
      const trend = F.trend(s, f);
      const issues = scopedIssues(ctx).filter((i) => rows.some((r) => r.id === i.mrf));
      const open = issues.filter((i) => i.status !== 'RESOLVED').sort((a, b) => (a.priority < b.priority ? -1 : a.priority > b.priority ? 1 : (b.breachH || 0) - (a.breachH || 0)));
      const resolved = issues.filter((i) => i.status === 'RESOLVED').slice(0, 4);
      const overdue = rows.filter((r) => r.open && (r.sla === 'BREACH' || (r.overall && r.overall.sla === 'BREACH') || r.j.active.some((a) => a.sla === 'BREACH')));
      const risk = rows.filter((r) => r.open && !overdue.includes(r) && (r.sla === 'RISK' || r.j.active.some((a) => a.sla === 'RISK')));
      const crit = open.filter((i) => i.priority === 'P0');
      const pf = k.pfhi;
      const pfCls = pf === null ? '' : pf >= 85 ? 'ok' : pf >= 70 ? 'warn' : 'bad';
      const maxAvg = Math.max(1, ...stages.map((x) => x.avg));
      const worstStage = stages.slice().sort((a, b) => b.breach - a.breach || b.avg - a.avg)[0];
      const topSup = sup.filter((x) => x.otd !== null).sort((a, b) => a.otd - b.otd)[0];
      const kpi = (cls, lbl, val, sub, drill) => `<button class="ft-kpi ${cls}" ${drill ? `data-a="drill" data-d="${drill}"` : 'data-a="drill" data-d="all"'}><span class="lbl">${lbl}</span><span class="val">${val}</span><span class="sub">${sub}</span></button>`;
      const drillRows = L.drill ? rows.filter((r) => L.drill.ids.includes(r.id)) : rows.filter((r) => r.open).concat(rows.filter((r) => !r.open)).slice(0, 25);

      return `<div class="stack ft">
        <div class="hero ft-hero"><div class="row between" style="gap:12px;align-items:flex-start;position:relative"><div><div class="tiny" style="letter-spacing:.12em;color:#e5c66a">NV-61 · FLOW INTELLIGENCE</div><h2 style="margin:4px 0 0">Procurement Flow Control Tower</h2>
          <p>Di mana pesanan tertahan, siapa yang perlu bertindak, dan apa dampaknya — dari MRF sampai barang diserahkan. Fakta dari dokumen; insight AI ditandai simulasi.</p></div>
          <div class="ft-clock"><div class="tiny">Jam demo</div><b>${U.datetime(F.now(s))}</b><div class="row" style="gap:6px;margin-top:6px"><button class="btn sm gold" data-a="demoClock" data-h="24">⏩ Simulasi +24 jam</button><button class="btn sm ghost-l" data-a="demoClock" data-h="72">+3 hari</button></div><div class="tiny" style="opacity:.75;margin-top:4px">DEMO — menguji SLA tanpa menunggu</div></div></div></div>
        ${srcLine(s)}
        <div class="card ft-filters">${FILTERS.map(([key, lbl, opts]) => `<label><span class="tiny muted">${lbl}</span><select class="inp sm" data-ch="flt" data-k="${key}">${opts(s).map(([v, l]) => `<option value="${esc(v)}" ${(f[key] || 'ALL') === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`).join('')}
          <button class="btn sm ghost" data-a="fltReset" style="align-self:flex-end">Reset</button></div>

        <div class="ft-kpis">
          ${kpi('k-gold', 'PFHI <span class="badge demo" style="font-size:9px">PROVISIONAL</span>', pf === null ? '—' : pf, 'Indeks kesehatan alur · bukan skor tervalidasi', 'all')}
          ${kpi('k-green', 'Selesai tepat waktu', k.onTime === null ? '—' : U.pct(k.onTime), `${k.doneAll.filter((x) => x.onTime).length}/${k.doneAll.length} pesanan · target ≤ ${k.target} jam`, 'done')}
          ${kpi('k-blue', 'P90 waktu siklus', k.p90 === null ? '—' : hh(k.p90), '90% pesanan selesai dalam waktu ini', 'done')}
          ${kpi('k-red', 'Lewat SLA (overdue)', overdue.length, `${U.sum(overdue, (r) => r.j.fulfil.requested - r.j.fulfil.issued)} unit belum diserahkan`, 'overdue')}
          ${kpi('k-crit', 'Kritis P0', crit.length, 'Ditampilkan terpisah dari PFHI', 'crit')}
          ${kpi('k-amber', 'Berisiko (≥80% SLA)', risk.length, 'Perlu perhatian sebelum terlambat', 'risk')}
          ${kpi('k-violet', 'Pesanan aktif', rows.filter((r) => r.open).length, `${rows.length} pesanan dalam filter`, 'open')}
        </div>

        <div class="grid g-2-1">
          <div class="card"><div class="card-head"><h3>Rata-rata waktu per tahap <span class="sub">jam kalender · live + riwayat DEMO</span></h3></div>
            <div class="ft-stages">${stages.map((x) => `<button class="ft-stage" data-a="drillStage" data-st="${x.key}"><span class="nm">${esc(x.label)}</span><span class="track"><i class="${x.breach ? 'bad' : x.risk ? 'warn' : 'ok'}" style="width:${Math.max(3, (x.avg / maxAvg) * 100)}%"></i></span><span class="v">${hh(x.avg)}</span><span class="c">${x.active ? `${x.active} aktif${x.breach ? ` · <b class="t-bad">${x.breach} lewat</b>` : ''}` : '<span class="muted">—</span>'}</span></button>`).join('')}</div>
            <p class="tiny muted" style="margin:8px 0 0">Bottleneck utama: <b>${esc(worstStage.label)}</b> (${worstStage.breach} lewat SLA, rata-rata ${hh(worstStage.avg)}). Klik baris untuk melihat pesanannya.</p></div>
          <div class="card ft-pfhi"><div class="card-head"><h3>PFHI — komponen <span class="sub">v${s.flowConfig.version}</span></h3>${ctx.can('flow.setWeights') ? '<button class="btn sm ghost" data-a="weights">Ubah bobot</button>' : ''}</div>
            <div class="ft-score ${pfCls}"><b>${pf === null ? '—' : pf}</b><span>/100</span></div>
            ${k.comp.map((c) => `<div class="ft-comp"><div class="row between"><span class="small">${esc(c.label)}</span><span class="tiny muted">bobot ${Math.round(c.weight * 100)}%</span></div>${ui.bar(c.score === null ? 0 : c.score, c.score === null ? '' : c.score >= 0.85 ? 'ok' : c.score >= 0.7 ? 'warn' : 'bad')}<div class="tiny muted">${c.score === null ? 'tidak dihitung' : 'skor ' + Math.round(c.score * 100)} · ${esc(c.detail)}</div></div>`).join('')}
            <div class="alert warn tiny" style="margin-top:8px">${ui.icon('alert', 14)}<span>Provisional: bobot awal 40/25/20/15 perlu disahkan Owner. Pesanan kritis (P0) tidak "tertutup" oleh skor — selalu tampil terpisah.</span></div></div>
        </div>

        <div class="grid g-2-1">
          <div class="card"><div class="card-head"><h3>🚨 Action & Escalation Center <span class="sub">${open.length} isu terbuka · satu isu per masalah</span></h3></div>
            ${open.length ? open.slice(0, L.allIssues ? 50 : 4).map((i) => issueCard(ctx, i)).join('') : ui.empty('Tidak ada isu SLA terbuka. 🎉')}
            ${open.length > 4 ? `<button class="link small" data-a="allIssues">${L.allIssues ? 'Tampilkan lebih sedikit' : `Tampilkan semua (${open.length})`}</button>` : ''}
            ${resolved.length ? `<details class="small" style="margin-top:8px"><summary>Baru diselesaikan (${resolved.length})</summary>${resolved.map((i) => issueCard(ctx, i, { history: true })).join('')}</details>` : ''}</div>
          <div class="ft-ai"><div class="row between"><b>✦ AI Flow Insight</b><span class="badge ai">AI SIMULATION</span></div>
            <div class="ft-ai-sec">FAKTA (dari data)</div>
            <ul>${[
              `${overdue.length} pesanan lewat SLA, ${risk.length} berisiko, ${crit.length} kritis.`,
              `Tahap paling lambat: ${worstStage.label} — rata-rata ${hh(worstStage.avg)}.`,
              topSup ? `Supplier dengan ketepatan terendah: ${topSup.name} ${U.pct(topSup.otd)} (${topSup.n} kiriman).` : null,
              reasons[0] ? `Alasan terbanyak: ${reasons[0].label} (${reasons[0].n}×).` : null,
            ].filter(Boolean).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
            <div class="ft-ai-sec">HIPOTESIS (perlu dicek manusia)</div>
            <ul>${[
              topSup && topSup.otd < 0.85 ? `Kiriman sebagian dari ${topSup.name} kemungkinan karena stok pemasok terbatas — pertimbangkan pemasok cadangan.` : 'Pola keterlambatan belum signifikan.',
              worstStage.key === 'APPROVAL' ? 'Persetujuan sore hari cenderung tertunda ke esok hari kerja.' : `Antrean di ${worstStage.label} kemungkinan dipengaruhi jam kerja (08–17, Senin–Sabtu).`,
            ].map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
            <div class="ft-ai-sec">REKOMENDASI</div>
            <ul>${(open[0] ? [open[0].recommendation] : ['Pertahankan; tinjau supplier tiap minggu.']).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
            <div class="tiny" style="opacity:.8">AI tidak mengubah budget, membuat PO, menyetujui pembayaran, atau menyalahkan karyawan. Semua aksi dilakukan manusia.</div></div>
        </div>

        <div class="grid g2">
          <div class="card"><div class="card-head"><h3>Heatmap aging × tahap <span class="sub">pesanan aktif</span></h3></div>
            <div class="tbl-wrap"><table class="tbl ft-heat"><thead><tr><th>Tahap</th>${F.agingBuckets.map((b) => `<th class="num">${b[0]}</th>`).join('')}</tr></thead><tbody>${heat
              .map((r) => `<tr><td>${esc(r.label)}</td>${r.cells.map((c) => `<td class="num"><button class="ft-cell h-${c.worst || 'none'}" ${c.n ? `data-a="drillCell" data-ids="${c.ids.join(',')}" data-t="${esc(r.label + ' · ' + c.label)}"` : 'disabled'}>${c.n || '·'}</button></td>`).join('')}</tr>`)
              .join('')}</tbody></table></div>
            <div class="legend tiny"><span><i class="p-dot" style="background:#1f9d55"></i>Dalam SLA</span><span><i class="p-dot" style="background:#e0a526"></i>Berisiko</span><span><i class="p-dot" style="background:#c53030"></i>Lewat SLA</span></div></div>
          <div class="card"><div class="card-head"><h3>Tren tepat waktu <span class="sub">Agt–Okt = riwayat DEMO · Nov = live</span></h3></div>
            ${ui.line({ labels: trend.map((t) => t.month.slice(5) + '/' + t.month.slice(2, 4)), series: [{ name: '% selesai tepat waktu', color: '#1f9d55', values: trend.map((t) => (t.rate === null ? null : Math.round(t.rate * 100))) }], fmt: (v) => Math.round(v) + '%', h: 170 })}</div>
        </div>

        <div class="grid g2">
          <div class="card"><div class="card-head"><h3>Performa supplier</h3></div>${ui.table(
            [
              { h: 'Supplier', f: (x) => `<b>${esc(x.name)}</b>` },
              { h: 'Tepat janji', num: true, f: (x) => (x.otd === null ? '—' : `<span class="t-${x.otd >= 0.9 ? 'ok' : x.otd >= 0.75 ? 'warn' : 'bad'}">${U.pct(x.otd)}</span>`) },
              { h: 'Lead time', num: true, f: (x) => (x.lead === null ? '—' : `${U.num(x.lead, 1)} / ${x.promisedLead} hr`) },
              { h: 'PO terbuka', num: true, f: (x) => x.openPos },
              { h: 'Backorder', num: true, f: (x) => (x.outstanding ? `<b class="t-bad">${x.outstanding}</b>` : 0) },
              { h: 'Skor*', num: true, f: (x) => (x.score === null ? '—' : x.score) },
            ],
            sup,
            { rowAttr: (x) => `data-a="drillSup" data-sup="${x.id}" style="cursor:pointer"` }
          )}<p class="tiny muted">*Skor = 70% tepat janji + 20% lead time + 10% kelengkapan kiriman (DEMO, perlu disahkan).</p></div>
          <div class="card"><div class="card-head"><h3>Alasan keterlambatan</h3></div>
            ${reasons.length ? reasons.map((r) => `<div class="ft-reason"><span class="small">${esc(r.label)}</span>${ui.bar(r.n / reasons[0].n, 'warn')}<b class="small">${r.n}</b></div>`).join('') : ui.empty('Belum ada alasan tercatat')}
            <p class="tiny muted">Dihitung dari isu (live) + riwayat DEMO. Kategori menjelaskan proses, bukan kesalahan individu.</p></div>
        </div>

        <div class="card" id="ft-drill"><div class="card-head"><h3>${L.drill ? esc(L.drill.title) : 'Pesanan dalam filter'} <span class="sub">${drillRows.length} pesanan</span></h3>${L.drill ? '<button class="btn sm ghost" data-a="drillClear">Tampilkan semua</button>' : ''}</div>
          ${ui.table(
            [
              { h: 'MRF', f: (r) => ui.id(r.id) },
              { h: 'Unit', f: (r) => esc(S.orgName(s, r.branch)) },
              { h: 'Barang', f: (r) => firstItem(s, r.m) },
              { h: 'Terpenuhi', num: true, f: (r) => `${r.j.fulfil.issued}/${r.j.fulfil.requested}` },
              { h: 'Tahap aktif', f: (r) => (r.stage ? esc(F.STAGE_LABEL[r.stage]) : r.done ? 'Selesai' : esc(ui.statusLabel(r.status))) },
              { h: 'SLA', f: (r) => slaBadge(r.done ? r.overall && r.overall.sla : r.sla) },
              { h: 'Umur', num: true, f: (r) => hh(r.ageH) },
              { h: 'PIC', f: (r) => esc(RL(r.pic)) },
              { h: '', f: (r) => `${priBadge(r.priority)} ${journeyBtn(r.id, 'Perjalanan')}` },
            ],
            drillRows,
            { empty: 'Tidak ada pesanan untuk filter ini' }
          )}</div>

        ${slaCard(ctx)}
      </div>`;
    },
    actions: Object.assign({}, issueActions, {
      flt(el, ctx) {
        ctx.L.f[el.dataset.k] = el.value;
        ctx.L.drill = null;
        ctx.rerender();
      },
      fltReset(el, ctx) {
        ctx.L.f = {};
        ctx.L.drill = null;
        ctx.rerender();
      },
      drill(el, ctx) {
        const rows = F.filter(ctx.s, inScopeRows(ctx), ctx.L.f || {});
        const d = el.dataset.d;
        const pick = {
          all: ['Semua pesanan', rows],
          done: ['Pesanan selesai', rows.filter((r) => r.done)],
          overdue: ['Pesanan lewat SLA', rows.filter((r) => r.open && (r.sla === 'BREACH' || r.j.active.some((a) => a.sla === 'BREACH') || (r.overall && r.overall.sla === 'BREACH')))],
          crit: ['Pesanan dengan isu kritis P0', rows.filter((r) => r.priority === 'P0')],
          risk: ['Pesanan berisiko', rows.filter((r) => r.open && r.j.active.some((a) => a.sla === 'RISK'))],
          open: ['Pesanan aktif', rows.filter((r) => r.open)],
        }[d] || ['Semua pesanan', rows];
        drillSet(ctx.L, pick[0], pick[1].map((r) => r.id));
        ctx.rerender();
        setTimeout(() => (document.getElementById('ft-drill') || {}).scrollIntoView && document.getElementById('ft-drill').scrollIntoView({ behavior: 'smooth' }), 30);
      },
      drillStage(el, ctx) {
        const st = el.dataset.st;
        const rows = F.filter(ctx.s, inScopeRows(ctx), ctx.L.f || {}).filter((r) => r.j.tracks.some((t) => t.stages.some((x) => x.stage === st)));
        drillSet(ctx.L, 'Pesanan melewati tahap ' + F.STAGE_LABEL[st], rows.map((r) => r.id));
        ctx.rerender();
      },
      drillCell(el, ctx) {
        drillSet(ctx.L, 'Heatmap: ' + el.dataset.t, el.dataset.ids.split(','));
        ctx.rerender();
      },
      drillSup(el, ctx) {
        const id = el.dataset.sup;
        const rows = F.filter(ctx.s, inScopeRows(ctx), ctx.L.f || {}).filter((r) => r.suppliers.includes(id));
        drillSet(ctx.L, 'Pesanan dengan supplier ' + S.supplierName(ctx.s, id), rows.map((r) => r.id));
        ctx.rerender();
      },
      drillClear(el, ctx) {
        ctx.L.drill = null;
        ctx.rerender();
      },
      allIssues(el, ctx) {
        ctx.L.allIssues = !ctx.L.allIssues;
        ctx.rerender();
      },
      weights(el, ctx) {
        const w = ctx.s.flowConfig.weights;
        const rows = [['onTime', 'Selesai tepat waktu'], ['activeSla', 'Pesanan aktif dalam SLA'], ['p90', 'Kinerja waktu siklus P90'], ['data', 'Kelengkapan data event']];
        ui.openModal(
          'Bobot PFHI (provisional)',
          `${rows.map(([k, l]) => `<div class="field"><label for="pw-${k}">${l} (%)</label><input class="inp" type="number" min="0" max="100" id="pw-${k}" value="${Math.round(w[k] * 100)}"></div>`).join('')}<div class="field"><label for="pw-n">Alasan perubahan *</label><input class="inp" id="pw-n" placeholder="Contoh: keputusan rapat Owner"></div><p class="tiny muted">Total harus 100%. Setiap perubahan disimpan sebagai versi baru dengan before/after.</p>`,
          `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" id="pw-ok">Simpan</button>`
        );
        document.getElementById('pw-ok').onclick = () => {
          const weights = Object.fromEntries(rows.map(([k]) => [k, (+document.getElementById('pw-' + k).value || 0) / 100]));
          const note = document.getElementById('pw-n').value;
          ui.closeModal();
          ctx.act('flow.setWeights', { weights, note }, 'Bobot PFHI disimpan (versi baru)');
        };
      },
      slaEdit(el, ctx) {
        const p = ctx.s.slaPolicies.find((x) => x.id === el.dataset.id);
        ui.openModal(
          `Kebijakan ${p.id} — ${F.STAGE_LABEL[p.stage]}`,
          `${p.basis === 'PROMISED' ? '<p class="small">Jatuh tempo = tanggal janji supplier di PO (tidak diubah oleh revisi ETA).</p>' : `<div class="field"><label for="sl-h">Target (${p.basis === 'WORK' ? 'jam kerja' : 'jam kalender'})</label><input class="inp" type="number" min="1" max="720" id="sl-h" value="${p.hours}"></div>`}
           <div class="field"><label for="sl-w">Ambang "berisiko" (% dari target)</label><input class="inp" type="number" min="1" max="99" id="sl-w" value="${Math.round(p.warn * 100)}"></div>
           <div class="field"><label for="sl-n">Alasan perubahan *</label><input class="inp" id="sl-n"></div>
           <p class="tiny muted">Versi baru berlaku untuk evaluasi berikutnya. Jatuh tempo asli pada isu yang sudah ada tidak ditimpa.</p>`,
          `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" id="sl-ok">Simpan versi baru</button>`
        );
        document.getElementById('sl-ok').onclick = () => {
          const h = document.getElementById('sl-h');
          const pl = { id: p.id, warn: (+document.getElementById('sl-w').value || 0) / 100, note: document.getElementById('sl-n').value };
          if (h) pl.hours = +h.value;
          ui.closeModal();
          ctx.act('flow.updateSla', pl, 'Kebijakan SLA disimpan (versi baru)');
        };
      },
    }),
  };

  function slaCard(ctx) {
    const s = ctx.s;
    const cal = s.workCalendar;
    const can = ctx.can('flow.updateSla');
    return `<div class="card"><div class="card-head"><h3>Kebijakan SLA <span class="sub">berversi · jam kerja ${cal.start}:00–${cal.end}:00, ${cal.days.length} hari/minggu, ${cal.holidays.length} hari libur (DEMO)</span></h3>${ui.intBadge('NEW INTEGRATION REQUIRED')}</div>
      ${ui.table(
        [
          { h: 'ID', f: (p) => `<span class="mono">${p.id}</span>` },
          { h: 'Tahap', f: (p) => esc(F.STAGE_LABEL[p.stage]) },
          { h: 'Target', f: (p) => (p.basis === 'PROMISED' ? 'Tanggal janji supplier' : `${p.hours} ${p.basis === 'WORK' ? 'jam kerja' : 'jam kalender'}`) },
          { h: 'Berisiko ≥', num: true, f: (p) => Math.round(p.warn * 100) + '%' },
          { h: 'PIC tahap', f: (p) => esc(RL(p.owner)) },
          { h: 'Eskalasi', f: (p) => p.escalate.map(RL).join(' → ') },
          { h: 'Versi', num: true, f: (p) => `v${p.version}${p.changes.length ? ` <span class="tiny muted" title="${esc(p.changes.map((c) => `${c.ts} ${c.by}: ${JSON.stringify(c.before)} → ${JSON.stringify(c.after)} (${c.note})`).join('\n'))}">riwayat ${p.changes.length}</span>` : ''}` },
          { h: '', f: (p) => (can ? `<button class="btn sm ghost" data-a="slaEdit" data-id="${p.id}">Ubah</button>` : '') },
        ],
        s.slaPolicies
      )}</div>`;
  }

  /* ---------- NV-62 Order Journey & Delay Investigation ---------- */
  V[62] = {
    render(ctx) {
      const { s, L, q } = ctx;
      const rows = inScopeRows(ctx);
      if (!rows.length) return `<div class="card">${ui.empty('Belum ada pesanan dalam cakupan Anda.')}</div>`;
      const qKey = (q.mrf || '') + '|' + (q.tab || '');
      if (q.mrf && L.mrfQ !== qKey) {
        L.mrfQ = qKey;
        L.mrf = q.mrf;
        if (q.tab) L.tab = q.tab;
      }
      const pick = rows.find((r) => r.id === (L.mrf || q.mrf)) || rows.filter((r) => r.open).sort((a, b) => (a.priority || 'P9').localeCompare(b.priority || 'P9') || b.ageH - a.ageH)[0] || rows[0];
      const r = pick;
      const j = r.j;
      const m = r.m;
      const f = j.fulfil;
      const ai = F.ai(s, j);
      const iss = (s.flowIssues || []).filter((i) => i.mrf === m.id);
      const openIss = iss.filter((i) => i.status !== 'RESOLVED');
      const tab = ['detail', 'delay', 'evid', 'fin'].includes(L.tab) ? L.tab : 'detail';
      const step = L.step && L.step.mrf === m.id ? L.step.key : null;
      const w = j.worst;
      const next = w ? `${RL(w.owner)}: ${F.STAGE_LABEL[w.stage]}` : m.status === 'FULFILLED' ? 'Tidak ada — selesai' : m.status === 'IN_FULFILLMENT' ? 'Gudang: serahkan barang yang siap' : m.status === 'SUBMITTED' ? 'Atasan: persetujuan' : '—';
      const staff = ctx.role === 'STAFF';
      const sel = `<select class="inp" data-ch="pickMrf" aria-label="Pilih pesanan" style="max-width:100%">${rows
        .slice()
        .sort((a, b) => (b.date > a.date ? 1 : -1))
        .map((x) => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${x.id} · ${esc(S.orgName(s, x.branch))} · ${esc(m === x.m ? firstItem(s, x.m) : x.m.lines.map((l) => S.itemName(s, l.item) + ' × ' + l.qty).join(', '))}${x.priority ? ' · ' + x.priority : ''}</option>`)
        .join('')}</select>`;

      const tl = `<div class="ft-tl" role="list">${j.timeline
        .map((t) => `<button class="ft-step s-${t.status} ${step === t.key ? 'on' : ''}" data-a="step" data-k="${t.key}" role="listitem" aria-label="${esc(t.label)}: ${esc(SLA_TXT[t.status] || t.status)}"><span class="n">${t.status === 'DONE' ? '✓' : t.status === 'BREACH' || t.status === 'LATE' ? '!' : t.n}</span><span class="l">${esc(t.label)}</span><span class="d">${t.ts ? shortTs(t.ts) : SLA_TXT[t.status] || ''}</span></button>`)
        .join('')}</div>`;
      const stepEv = step ? j.events.filter((e) => e.stage === step || (step === 'SOURCING' && ['TRANSFER', 'ALLOCATION'].includes(e.stage)) || (step === 'SUPPLIER' && (e.type === 'PO_SEND' || e.type === 'PO_ETA_REVISED')) || (step === 'ARRIVAL' && e.stage === 'ARRIVAL')) : [];
      const stepBox = step
        ? `<div class="card ft-stepbox"><div class="card-head"><h3>${esc(F.TIMELINE_LABEL[F.TIMELINE.indexOf(step)])} <span class="sub">${stepEv.length} event</span></h3><button class="btn sm ghost" data-a="step" data-k="${step}">Tutup</button></div>${stepEv.length ? stepEv.map((e) => `<div class="ft-ev"><span class="mono tiny">${U.datetime(e.ts)}</span><b class="small">${esc(e.type)}</b><span class="small">${esc(S.userName(s, e.actor))}</span><span class="tiny muted">${esc(e.note || '')} ${(e.related || []).map((x) => ui.id(x)).join(' ')}</span></div>`).join('') : '<p class="small muted">Belum ada event pada tahap ini.</p>'}</div>`
        : '';

      const trackCard = (t) => {
        const rank = { BREACH: 5, RISK: 4, LATE: 3, OK: 2, ONTIME: 1 };
        const stLast = t.stages.slice().sort((a, b) => (rank[b.sla] || 0) - (rank[a.sla] || 0))[0];
        const sup = t.stages.find((x) => x.stage === 'SUPPLIER');
        return `<div class="ft-track k-${t.kind}"><div class="row between"><b class="small">${{ LOCAL: '🏠 Stok lokal', TRANSFER: '🚚 Transfer', PURCHASE: '🛒 Pembelian (PO)', MRF: '✅ Persetujuan', ISSUE: '🤝 Serah terima' }[t.kind]}</b>${t.qty ? `<b>${t.issued || 0}/${t.qty}</b>` : ''}</div>
          <div class="tiny muted">${esc(t.label)} ${t.ref ? ui.id(t.ref) : ''}</div>
          ${t.qty ? `<div class="ft-qty"><i class="iss" style="width:${((t.issued || 0) / t.qty) * 100}%"></i><i class="rdy" style="width:${(((t.ready || 0) - (t.issued || 0)) / t.qty) * 100}%"></i></div><div class="tiny">${t.issued || 0} diserahkan · ${(t.ready || 0) - (t.issued || 0)} siap · ${t.qty - (t.ready || 0)} ditunggu</div>` : ''}
          ${sup ? `<div class="tiny" style="margin-top:4px">Janji supplier <b>${U.date(sup.etaOriginal)}</b>${sup.etaCurrent !== sup.etaOriginal ? ` · ETA revisi <b>${U.date(sup.etaCurrent)}</b>` : ''} · diterima ${sup.received}${sup.outstanding ? ` · <b class="t-bad">backorder ${sup.outstanding}</b>` : ''}</div>` : ''}
          ${stLast ? `<div style="margin-top:4px">${slaBadge(stLast.sla)} <span class="tiny muted">${esc(F.STAGE_LABEL[stLast.stage])}</span></div>` : ''}</div>`;
      };

      const stageRows = j.tracks.flatMap((t) => t.stages.map((x) => ({ ...x, track: t })));
      const detail = `<div class="card"><div class="card-head"><h3>Waktu & SLA per tahap</h3><span class="tiny muted">kalender vs jam kerja (${s.workCalendar.start}–${s.workCalendar.end}, libur dihitung)</span></div>${ui.table(
        [
          { h: 'Jalur', f: (x) => esc({ MRF: 'MRF', TRANSFER: 'Transfer', PURCHASE: 'Pembelian', ISSUE: 'Serah', LOCAL: 'Lokal' }[x.track.kind]) + (x.ref || x.track.ref ? ' ' + ui.id(x.ref || x.track.ref) : '') },
          { h: 'Tahap', f: (x) => esc(F.STAGE_LABEL[x.stage]) },
          { h: 'Mulai', f: (x) => U.datetime(x.start) },
          { h: 'Selesai', f: (x) => (x.end ? U.datetime(x.end) : '<span class="badge info">berjalan</span>') },
          { h: 'Tunggu (kal / kerja)', num: true, f: (x) => `${hh(x.calH)} / ${hh(x.workH)}` },
          { h: 'Jatuh tempo', f: (x) => (x.due ? U.datetime(x.due) : '—') },
          { h: 'SLA', f: (x) => slaBadge(x.sla) + (x.breachH ? ` <span class="tiny t-bad">+${hh(x.breachH)}</span>` : '') },
          { h: 'PIC', f: (x) => esc(RL(x.owner)) },
        ],
        stageRows
      )}${j.overall ? `<p class="small" style="margin:8px 0 0">Total siklus: <b>${hh(j.overall.calH)}</b> kalender / ${hh(j.overall.workH)} kerja · target ${(F.policy(s, "DONE") || { hours: 96 }).hours} jam · ${slaBadge(j.overall.sla)}</p>` : ''}</div>`;

      const delay = `<div class="grid g-2-1"><div class="card"><div class="card-head"><h3>Isu keterlambatan <span class="sub">${openIss.length} terbuka · ${iss.length - openIss.length} selesai</span></h3></div>${iss.length ? iss.map((i) => issueCard(ctx, i, { history: true, journey: false })).join('') : ui.empty('Tidak ada isu SLA untuk pesanan ini.')}
          ${j.related.pos.filter((p) => (p.etaHistory || []).length).map((p) => `<div class="small" style="margin-top:8px"><b>Riwayat ETA ${p.id}</b> (janji asli ${U.date(p.promised)}, tidak diubah)${p.etaHistory.map((h) => `<div class="tiny">${U.datetime(h.ts)} · ${esc(S.userName(s, h.by))}: ${U.date(h.from)} → <b>${U.date(h.to)}</b> — ${esc(h.reason)}</div>`).join('')}</div>`).join('')}</div>
        ${aiCard(ai)}</div>`;

      const docs = j.related;
      const docList = [
        ['MRF', [m]],
        ['Transfer', docs.trs],
        ['PO', docs.pos],
        ['Penerimaan', docs.grns],
        ['Dokumen faktur', docs.docs],
        ['Tagihan', docs.bills],
        ['Pembayaran', docs.pays],
        ['Jurnal', docs.journals],
      ].filter(([, a]) => a && a.length);
      const evid = `<div class="card"><div class="card-head"><h3>Dokumen terkait</h3><span class="tiny muted">klik untuk membuka (sesuai hak akses)</span></div><div class="ft-docs">${docList.map(([k, a]) => `<div><span class="tiny muted">${k}</span><div>${a.map((d) => ui.id(d.id)).join(' ')}</div></div>`).join('')}</div></div>
        <div class="card"><div class="card-head"><h3>Process Event Log <span class="sub">${j.events.length} event · kelengkapan ${U.pct(j.completeness)}</span></h3>${ui.intBadge('TO VERIFY')}</div>${ui.table(
          [
            { h: 'Event ID', f: (e) => `<span class="mono tiny">${esc(e.id)}</span>` },
            { h: 'Waktu', f: (e) => U.datetime(e.ts) },
            { h: 'Tahap', f: (e) => esc(F.STAGE_LABEL[e.stage] || e.stage) },
            { h: 'Event', f: (e) => `<span class="mono tiny">${esc(e.type)}</span>` },
            { h: 'Pelaku', f: (e) => esc(S.userName(s, e.actor)) },
            { h: 'Dokumen', f: (e) => [e.evidence, ...(e.related || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map((x) => ui.id(x)).join(' ') },
            { h: 'Sumber', f: (e) => `<span class="tiny">${esc(e.source)}</span>` },
          ],
          j.events,
          { maxH: 360 }
        )}<p class="tiny muted">Event diturunkan dari riwayat dokumen yang sudah ada (bukan ledger kedua). Field minimum adapter: lihat docs/PROCESS_EVENT_ADAPTER.md.</p></div>`;

      const bills = docs.bills;
      const recog = bills.map((b) => ({ b, n: s.journals.filter((x) => x.source === b.id && x.kind === 'INVOICE_RECOGNITION').length }));
      const fin = `<div class="card"><div class="card-head"><h3>Perjalanan keuangan <span class="sub">terpisah tapi terhubung</span></h3></div>
        <div class="ft-fin">${[
          ['Komitmen budget', m.status !== 'SUBMITTED' && m.status !== 'DRAFT' ? 'DONE' : 'PENDING', 'Saat MRF disetujui'],
          ['Penerimaan (GRNI)', docs.grns.some((g) => g.status !== 'DRAFT') ? 'DONE' : docs.pos.length ? 'PENDING' : 'SKIP', 'Dr Persediaan / Cr GRNI'],
          ['Faktur & three-way match', docs.docs.length || bills.length ? 'DONE' : docs.pos.length ? 'PENDING' : 'SKIP', 'NV-49'],
          ['Pengakuan hutang (AP)', bills.some((b) => ['APPROVED', 'PAID', 'PARTIAL_PAID'].includes(b.status)) ? 'DONE' : bills.length ? 'ACTIVE' : docs.pos.length ? 'PENDING' : 'SKIP', 'Sekali per tagihan'],
          ['Pembayaran', docs.pays.length ? 'DONE' : docs.pos.length ? 'PENDING' : 'SKIP', docs.pays.some((p) => p.kind === 'ADVANCE') ? 'Uang muka (bayar sebelum barang)' : 'Bayar setelah barang/faktur'],
        ]
          .map(([l, st, d]) => `<div class="ft-fstep s-${st}"><b class="small">${l}</b><span class="tiny muted">${d}</span>${slaBadge(st)}</div>`)
          .join('')}</div>
        ${recog.length ? `<p class="small">${recog.map((x) => `${ui.id(x.b.id)}: ${x.n} jurnal pengakuan ${x.n <= 1 ? '<span class="badge ok">tidak dobel</span>' : '<span class="badge bad">DUPLIKAT</span>'}`).join(' · ')}</p>` : '<p class="small muted">Belum ada tagihan untuk PO terkait. Pemenuhan dari stok/transfer tidak menimbulkan tagihan baru.</p>'}
        ${j.finStages.map((x) => `<div class="tiny">${ui.id(x.ref)} SLA Finance: ${hh(x.workH)} kerja ${slaBadge(x.sla)}</div>`).join('')}
        ${j.fin.length ? ui.table([{ h: 'Waktu', f: (e) => U.datetime(e.ts) }, { h: 'Event', f: (e) => `<span class="mono tiny">${esc(e.type)}</span>` }, { h: 'Ref', f: (e) => ui.id(e.ref) }, { h: 'Pelaku', f: (e) => esc(S.userName(s, e.actor)) }, { h: 'Catatan', f: (e) => esc(e.note || '') }], j.fin) : ''}
        <p class="tiny muted">Ketergantungan pembayaran: ${docs.pays.some((p) => p.kind === 'ADVANCE') ? 'pembayaran di muka sudah dicatat sebagai uang muka (1160) dan dikompensasi saat tagihan dibuat.' : 'barang tidak menunggu pembayaran (term kredit supplier).'} AI tidak pernah menyetujui atau membayar.</p></div>`;

      return `<div class="stack ft">
        <div class="card ft-head"><div class="row between" style="gap:10px;align-items:flex-start"><div style="min-width:0;flex:1"><div class="tiny muted">NV-62 · Order Journey</div>${sel}</div>
          <div class="ft-prog"><b>${f.issued}/${f.requested}</b><span class="tiny">diserahkan</span></div></div>
          <div class="ft-kv" style="margin-top:8px">
            <span>Pemohon</span><b>${esc(S.userName(s, m.requester))} · ${esc(S.orgName(s, m.branch))}</b>
            <span>Barang</span><b>${firstItem(s, m)}</b>
            <span>Status</span><b>${ui.status(m.status)} ${slaBadge(j.sla)} ${openIss.map((i) => priBadge(i.priority)).join(' ')}</b>
            <span>Langkah berikut</span><b>${esc(next)}</b>
            <span>Pemenuhan</span><b>${['LOCAL', 'TRANSFER', 'PURCHASE'].filter((k) => f[k].qty).map((k) => `${{ LOCAL: 'lokal', TRANSFER: 'transfer', PURCHASE: 'PO' }[k]} ${f[k].issued}/${f[k].qty}`).join(' · ')}</b>
          </div>
          ${staff && openIss.length ? `<div class="alert warn" style="margin-top:8px">${ui.icon('clock', 16)}<span>Sebagian barang terlambat. ${esc(openIss[0].impact)} Tim Purchasing sudah mendapat tugas — Anda tidak perlu melakukan apa-apa.</span></div>` : ''}
        </div>
        ${srcLine(s)}
        <div class="card"><div class="card-head"><h3>Timeline 12 tahap</h3><span class="tiny muted">klik tahap untuk melihat event</span></div>${tl}</div>
        ${stepBox}
        <div class="ft-tracks">${j.tracks.filter((t) => t.kind !== 'MRF').map(trackCard).join('')}</div>
        ${staff ? staffCard(s, j) : `${ui.tabs('tab', [['detail', 'Detail'], ['delay', 'Analisis keterlambatan', openIss.length], ['evid', 'Dokumen & bukti'], ['fin', 'Keuangan']], tab)}
        ${{ detail, delay, evid, fin }[tab] || detail}`}
      </div>`;
    },
    actions: Object.assign({}, issueActions, {
      pickMrf(el, ctx) {
        ctx.L.mrf = el.value;
        ctx.L.step = null;
        ctx.rerender();
      },
      step(el, ctx) {
        const sel = ctx.L.step;
        const mrf = (document.querySelector('[data-ch="pickMrf"]') || {}).value;
        ctx.L.step = sel && sel.key === el.dataset.k && sel.mrf === mrf ? null : { key: el.dataset.k, mrf };
        ctx.rerender();
      },
    }),
  };

  function staffCard(s, j) {
    const sup = j.tracks.flatMap((t) => t.stages).find((x) => x.stage === 'SUPPLIER' && x.state === 'ACTIVE');
    const f = j.fulfil;
    const done = f.issued >= f.requested;
    return `<div class="card ft-widget"><h3 style="margin:0 0 6px">${done ? '✅ Semua barang sudah diterima' : '📦 Kapan sisa barang datang?'}</h3>
      <p class="small" style="margin:0">${done ? 'Pesanan selesai. Terima kasih!' : `${f.requested - f.issued} lagi sedang ditunggu.${sup ? ` Perkiraan tiba <b>${U.date(sup.etaCurrent)}</b>.` : ''} Bila barang datang, gudang akan menyerahkan ke unit Anda.`}</p>
      <p class="tiny muted" style="margin:6px 0 0">Perkiraan berdasarkan informasi supplier & Purchasing (DEMO).</p></div>`;
  }
  function aiCard(ai) {
    return `<div class="ft-ai"><div class="row between"><b>✦ Analisis akar masalah</b><span class="badge ai">AI SIMULATION</span></div>
      <div class="ft-ai-sec">FAKTA (dari dokumen)</div><ul>${ai.facts.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <div class="ft-ai-sec">HIPOTESIS (belum terbukti)</div><ul>${ai.hyp.length ? ai.hyp.map((h) => `<li>${esc(h.text)} <span class="tiny">· keyakinan ${esc(h.conf)}</span></li>`).join('') : '<li>Tidak ada hipotesis — alur dalam SLA.</li>'}</ul>
      <div class="ft-ai-sec">REKOMENDASI</div><ul>${ai.recs.length ? ai.recs.map((t) => `<li>${esc(t)}</li>`).join('') : '<li>Tidak ada tindakan diperlukan.</li>'}</ul>
      <div class="tiny" style="opacity:.8">${esc(ai.label)}</div></div>`;
  }

  /* ---------- role widgets on existing screens ---------- */
  function widget(ctx, kind) {
    const s = ctx.s;
    const rows = inScopeRows(ctx);
    const open = scopedIssues(ctx).filter((i) => i.status !== 'RESOLVED').sort((a, b) => a.priority.localeCompare(b.priority) || String(b.createdAt).localeCompare(String(a.createdAt)));
    const k = F.kpis(s, {});
    const late = rows.filter((r) => r.open && r.j.active.some((a) => a.sla === 'BREACH'));
    const head = (t, sub) => `<div class="card-head"><h3>⏱ ${t} <span class="sub">${sub}</span></h3><span class="r">${ui.demo('DEMO')} <button class="btn sm ghost" data-nav="61">Control Tower ›</button></span></div>`;
    const mini = (lbl, v, cls) => `<div class="ft-mini ${cls || ''}"><span class="tiny">${lbl}</span><b>${v}</b></div>`;
    const list = (arr, n = 3) => (arr.length ? arr.slice(0, n).map((i) => issueCard(ctx, i, { compact: true })).join('') : '<p class="small muted" style="margin:6px 0 0">Tidak ada isu terbuka untuk Anda. 🎉</p>');
    if (kind === 'exec')
      return `<div class="card ft-widget">${head('Flow Intelligence', 'CEO / BU')}<div class="ft-minis">${mini('PFHI (provisional)', k.pfhi === null ? '—' : k.pfhi, 'gold')}${mini('Tepat waktu', k.onTime === null ? '—' : U.pct(k.onTime), 'ok')}${mini('P90 siklus', hh(k.p90))}${mini('Lewat SLA', late.length, late.length ? 'bad' : '')}${mini('Kritis P0', open.filter((i) => i.priority === 'P0').length, open.some((i) => i.priority === 'P0') ? 'bad' : '')}</div>${list(open.filter((i) => ['P0', 'P1'].includes(i.priority)), 2)}</div>`;
    if (kind === 'cfo') {
      const pend = s.pos.filter((p) => ['SENT', 'PARTIAL'].includes(p.status));
      const val = U.sum(pend, (p) => S.poTotals(s, p).total);
      const lateVal = U.sum(pend.filter((p) => F.T(p.promised) < F.T(F.now(s))), (p) => S.poTotals(s, p).total);
      return `<div class="card ft-widget">${head('Dampak keuangan keterlambatan', 'CFO')}<div class="ft-minis">${mini('PO menunggu barang', pend.length)}${mini('Nilai komitmen', U.rp(val))}${mini('Nilai PO lewat janji', U.rp(lateVal), lateVal ? 'bad' : '')}${mini('Isu Finance', open.filter((i) => i.pic === 'FINANCE').length)}</div><p class="tiny muted" style="margin:6px 0 0">Barang belum diterima = belum ada GRNI/AP; tidak ada pengakuan biaya dobel.</p></div>`;
    }
    if (kind === 'pur') {
      const mine = open.filter((i) => i.pic === 'PURCHASING');
      return `<div class="card ft-widget">${head('Tindakan keterlambatan untuk Purchasing', `${mine.length} isu`)}${list(mine)}</div>`;
    }
    if (kind === 'spv') {
      const mine = open.filter((i) => ctx.inScope(i.branch)).sort((a, b) => a.priority.localeCompare(b.priority) || String(b.createdAt).localeCompare(String(a.createdAt)));
      const act = rows.filter((r) => r.open);
      return `<div class="card ft-widget">${head('Pesanan unit saya', `${act.length} berjalan`)}<div class="ft-minis">${mini('Berjalan', act.length)}${mini('Lewat SLA', late.length, late.length ? 'bad' : '')}${mini('Berisiko', rows.filter((r) => r.open && r.j.active.some((a) => a.sla === 'RISK')).length, 'warn')}</div>${mine.length ? `<div class="ft-ilist">${mine.slice(0, 6).map((i) => `<div class="ft-irow">${priBadge(i.priority)}<span class="mono tiny">${esc(i.id)}</span><span class="small"><b>${esc(F.STAGE_LABEL[i.stage])}</b> · ${esc(i.impact)}</span><span class="tiny muted">PIC ${esc(RL(i.pic))}</span>${journeyBtn(i.mrf, 'Buka')}</div>`).join('')}</div>` : '<p class="small muted" style="margin:6px 0 0">Tidak ada isu terbuka di unit Anda. 🎉</p>'}${mine.filter((i) => i.pic === 'SUPERVISOR').slice(0, 1).map((i) => issueCard(ctx, i, { compact: true })).join('')}</div>`;
    }
    if (kind === 'hod') {
      const st = F.stageStats(s, rows, []).filter((x) => x.active).sort((a, b) => b.breach - a.breach || b.active - a.active)[0];
      return `<div class="card ft-widget">${head('Alur divisi', 'Head of Division')}<div class="ft-minis">${mini('Pesanan berjalan', rows.filter((r) => r.open).length)}${mini('Lewat SLA', late.length, late.length ? 'bad' : '')}${mini('Bottleneck', st ? esc(st.label) : '—')}</div>${list(open, 2)}</div>`;
    }
    if (kind === 'whs') {
      const mine = open.filter((i) => i.pic === 'WAREHOUSE');
      const back = s.pos.filter((p) => p.status === 'PARTIAL');
      return `<div class="card ft-widget">${head('SLA gudang', `${mine.length} isu`)}<div class="ft-minis">${mini('Isu gudang', mine.length, mine.length ? 'warn' : '')}${mini('PO sebagian (backorder)', back.length, back.length ? 'warn' : '')}${mini('Siap diserahkan', U.sum(rows, (r) => r.j.fulfil.ready - r.j.fulfil.issued))}</div>${back.map((p) => `<div class="tiny">${ui.id(p.id)} · ${esc(S.supplierName(s, p.supplier))} · sisa ${U.sum(p.lines, (l) => l.qty - l.received)} · ETA ${U.date(p.eta || p.promised)}</div>`).join('')}${list(mine, 2)}</div>`;
    }
    if (kind === 'staff') {
      const mine = rows.filter((r) => r.open);
      if (!mine.length) return '';
      return `<div class="card ft-widget">${head('Pesanan saya — kapan datang?', `${mine.length} berjalan`)}${mine
        .slice(0, 4)
        .map((r) => {
          const sup = r.j.tracks.flatMap((t) => t.stages).find((x) => x.stage === 'SUPPLIER' && x.state === 'ACTIVE');
          const lateNow = r.j.active.some((a) => a.sla === 'BREACH');
          return `<div class="ft-staff ${lateNow ? 'bad' : ''}"><div><b class="small">${firstItem(s, r.m)}</b><div class="tiny muted">${r.id} · ${r.j.fulfil.issued}/${r.j.fulfil.requested} sudah diterima</div></div><div style="text-align:right"><b class="small">${lateNow ? 'Terlambat' : 'Sesuai jadwal'}</b><div class="tiny">${sup ? 'Perkiraan ' + U.date(sup.etaCurrent) : ''}</div>${journeyBtn(r.id, 'Detail')}</div></div>`;
        })
        .join('')}</div>`;
    }
    return '';
  }
  HAWK.flowWidget = widget;

  const wrapTop = (nv, fn, pred) => {
    const v = V[nv];
    if (!v) return;
    const orig = v.render;
    v.render = (ctx) => {
      const body = orig(ctx);
      if (pred && !pred(ctx)) return body;
      const w = fn(ctx);
      return w ? `<div class="stack">${w}${body}</div>` : body;
    };
    v.actions = Object.assign(v.actions || {}, issueActions);
  };
  wrapTop(57, (c) => widget(c, 'exec'));
  wrapTop(47, (c) => widget(c, 'cfo'));
  wrapTop(31, (c) => widget(c, 'pur'));
  wrapTop(58, (c) => widget(c, c.role === 'SUPERVISOR' ? 'spv' : c.role === 'HEAD_DIV' ? 'hod' : c.role === 'PURCHASING' ? 'pur' : c.role === 'WAREHOUSE' ? 'whs' : 'exec'));
  wrapTop(1, (c) => widget(c, 'spv'), (c) => c.role === 'SUPERVISOR');
  wrapTop(38, (c) => widget(c, 'whs'));
  wrapTop(41, (c) => widget(c, 'whs'));
  wrapTop(27, (c) => widget(c, c.role === 'STAFF' ? 'staff' : 'spv'));
})();
