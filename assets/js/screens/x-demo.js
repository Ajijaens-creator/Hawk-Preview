/* DX-HAWK-01 Demo Experience Center (MP-HAWK-09) — route #/dx, not an NV number.
   Option 1 Scenario Test Lab: one real app frame + Smart Tutor (scenario, role login DEMO, highlight, run, back/next, PASS/FAIL/BLOCKED, JSON report).
   Option 2 Live Multi-Device Simulator: FIVE real app frames (index.html?embed=1&as=…) sharing ONE sandbox state via the store.
   Nothing here is a screenshot or a cloned screen: every frame is the HAWK prototype itself with the role's own permissions. */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const ui = HAWK.ui;
  const esc = U.esc;
  const DX = HAWK.dx;
  const $ = (q, r) => (r || document).querySelector(q);
  const $$ = (q, r) => [...(r || document).querySelectorAll(q)];

  const L = { mode: 'lab', sc: 'MRF', view: null, labDevice: null, labUser: null, cells: {}, max: null, msg: null, lastRun: null };
  try {
    Object.assign(L, JSON.parse(localStorage.getItem('hawk-dx-ui') || '{}'), { cells: {}, max: null, msg: null, lastRun: null });
  } catch (e) {}
  const saveUi = () => {
    try {
      localStorage.setItem('hawk-dx-ui', JSON.stringify({ mode: L.mode, sc: L.sc, labDevice: L.labDevice }));
    } catch (e) {}
  };
  const st = () => HAWK.store.state;
  const userName = (id) => (DX.userOf(st(), id) || {}).name || id;
  const roleOf = (id) => (DX.userOf(st(), id) || {}).role;
  const roleLabel = (id) => (DX.SUPPORT[id] ? DX.SUPPORT[id] : (DX.ROLE5.find((r) => r.user === id) || {}).label || HAWK.ROLE_LABEL[roleOf(id)] || id);
  const nvName = (nv) => {
    const s = HAWK.screen(nv);
    return s ? `${s.code} ${s.name}` : 'NV-' + nv;
  };
  const RES = { DONE: ['ok', 'Selesai'], REVIEWED: ['ok', 'Ditinjau'], BLOCKED: ['warn', 'BLOCKED'], FAILED: ['bad', 'Gagal'], PENDING: ['', 'Belum'] };

  /* ---------------- frames ---------------- */
  const frameSrc = (uid, nv, q) => {
    const qs = q && Object.keys(q).length ? '?' + Object.entries(q).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&') : '';
    return `index.html?embed=1&as=${encodeURIComponent(uid)}#/nv/${nv}${qs}`;
  };
  const frameWin = (f) => {
    try {
      const w = f.contentWindow;
      return w && w.HAWK && w.HAWK.render ? w : null;
    } catch (e) {
      return null; // file:// or cross-origin — Demo Center needs an http(s) origin
    }
  };
  function waitFrame(f, ms = 6000) {
    return new Promise((res) => {
      const t0 = Date.now();
      (function poll() {
        const w = frameWin(f);
        if (w && w.document.querySelector('#view') && w.document.querySelector('#view').children.length) return res(w);
        if (Date.now() - t0 > ms) return res(null);
        setTimeout(poll, 60);
      })();
    });
  }
  /* open uid on nv inside frame f (reload only when the DEMO user changes) */
  async function openIn(f, uid, nv, q) {
    const w = frameWin(f);
    if (w && f.dataset.uid === uid) {
      w.HAWK.go(nv, q && Object.keys(q).length ? q : undefined);
      w.HAWK.render();
    } else {
      f.dataset.uid = uid;
      f.src = frameSrc(uid, nv, q);
      await new Promise((r) => setTimeout(r, 30));
    }
    return waitFrame(f);
  }
  function fit(cell) {
    const f = $('iframe', cell);
    const box = $('.dx-screen', cell);
    if (!f || !box) return;
    const d = DX.DEVICES[cell.dataset.device] || DX.DEVICES.desktop;
    const avail = box.clientWidth || 300;
    const sc = Math.min(1, avail / d.w);
    f.style.width = d.w + 'px';
    f.style.height = d.h + 'px';
    f.style.transform = `scale(${sc})`;
    f.style.left = Math.max(0, Math.round((avail - d.w * sc) / 2)) + 'px';
    box.style.height = Math.round(d.h * sc) + 'px';
  }
  const fitAll = () => $$('.dx-cell').forEach(fit);

  /* ---------------- tutor helpers ---------------- */
  const cur = () => DX.current(st());
  const viewStep = () => {
    const c = cur();
    if (!c) return null;
    const i = L.view === null || L.view === undefined ? (c.done ? c.sc.steps.length - 1 : c.idx) : Math.max(0, Math.min(c.sc.steps.length - 1, L.view));
    return { c, i, step: c.sc.steps[i] };
  };
  const resultOf = (step) => {
    const r = st().dx && st().dx.steps[step.id];
    return r ? r.result : 'PENDING';
  };
  const progress = () => {
    const c = cur();
    if (!c) return { n: 0, N: 0 };
    const N = c.sc.steps.length;
    return { n: c.sc.steps.filter((x) => ['DONE', 'REVIEWED'].includes(resultOf(x))).length, N };
  };
  function cellFor(uid) {
    if (L.mode === 'lab') return $('.dx-cell[data-cell="lab"]');
    const r = DX.ROLE5.find((x) => x.user === uid);
    return r ? $(`.dx-cell[data-cell="${r.key}"]`) : $('.dx-cell[data-cell="support"]');
  }

  /* open the step's screen as the step's user and highlight the real control by its stable target ID */
  async function focusStep(step, quiet) {
    if (!step) return;
    const v = DX.varsFor(st(), step);
    const t = DX.target(step.tid, v);
    const cell = cellFor(step.as);
    if (!cell || !t) return;
    if (L.mode === 'lab') {
      L.labUser = step.as;
      cell.dataset.device = L.labDevice || (DX.ROLE5.find((r) => r.user === step.as) || {}).device || 'desktop';
      fit(cell);
    } else if (cell.dataset.cell === 'support') {
      cell.classList.remove('hide');
      $('.dx-cell-role', cell).textContent = roleLabel(step.as) + ' · ' + userName(step.as);
    }
    $$('.dx-cell').forEach((x) => x.classList.toggle('active', x === cell));
    const q = step.q ? step.q(v) : {};
    const w = await openIn($('iframe', cell), step.as, t.nv, q);
    let found = false;
    if (w) {
      await new Promise((r) => setTimeout(r, 120));
      found = !t.unresolved && w.HAWK.dxFocus(t.sel, `${step.n}. ${step.title}`, t.tid);
    }
    L.msg = !w
      ? { kind: 'bad', text: 'Layar tidak dapat diakses. Demo Center butuh alamat http(s) (Vercel / server lokal), bukan file://.' }
      : found
        ? { kind: 'ok', text: `Tombol ${t.tid} disorot di ${nvName(t.nv)} sebagai ${userName(step.as)}.` }
        : { kind: 'warn', text: `Kontrol ${t.tid} (${t.label}) tidak ditemukan di ${nvName(t.nv)} untuk kondisi data saat ini. Bila fitur memang belum ada, tandai BLOCKED — jangan dianggap lulus.` };
    if (!quiet) panels();
    if (L.mode === 'lab') labHead();
    return found;
  }

  /* ---------------- actions ---------------- */
  async function startScenario(id) {
    L.sc = id;
    L.view = null;
    saveUi();
    const r = DX.start(HAWK.store, HAWK.api, id);
    const bad = r.trail.filter((t) => !t.ok);
    L.msg = bad.length ? { kind: 'bad', text: 'Setup skenario gagal: ' + bad.map((b) => b.op + ' ' + b.error.message).join('; ') } : { kind: 'ok', text: `Skenario ${id} dimulai pada data demo yang baru di-reset (semua layar ikut berubah).` };
    await reloadAll();
    panels();
    focusStep(cur() && cur().step);
  }
  async function runCurrent() {
    const c = cur();
    if (!c || c.done) return;
    const step = c.step;
    const r = DX.runStep(HAWK.store, HAWK.api);
    L.lastRun = { step: step.id, ok: r.ok, trail: (r.trail || []).map((t) => `${t.op} (${userName(t.user)}) ${t.ok ? '✓' : '✕ ' + t.error.message}`) };
    L.msg = r.ok ? { kind: 'ok', text: `${step.n}. ${step.title} — selesai lewat operasi yang sama dengan tombol aslinya.` } : { kind: 'bad', text: `Langkah gagal: ${r.error.message}` };
    L.view = null;
    refreshFrames();
    panels();
    const n = cur();
    if (r.ok && n && !n.done) setTimeout(() => focusStep(n.step), 250);
  }
  function refreshFrames() {
    $$('.dx-cell iframe').forEach((f) => {
      const w = frameWin(f);
      if (w) {
        w.HAWK.store.sync();
        w.HAWK.dxClear();
        w.HAWK.render();
      }
    });
  }
  async function reloadAll() {
    const tasks = $$('.dx-cell').map((cell) => {
      const f = $('iframe', cell);
      if (!f || cell.classList.contains('hide')) return null;
      const uid = cell.dataset.cell === 'lab' ? L.labUser || 'U-STF' : f.dataset.uid;
      if (!uid) return null;
      const r = DX.ROLE5.find((x) => x.user === uid);
      f.dataset.uid = '';
      return openIn(f, uid, cell.dataset.cell === 'lab' ? (r ? r.home : 1) : r ? r.home : 1);
    });
    await Promise.all(tasks.filter(Boolean));
  }
  function exportReport() {
    const rep = DX.report(st());
    if (!rep) return ui.toast('Mulai skenario dulu', 'bad');
    const blob = new Blob([JSON.stringify(rep, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `HAWK_DX_${rep.scenario}_UAT.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 500);
    ui.toast('Laporan JSON diunduh (DEMO)', 'ok');
  }
  function verdict(v) {
    const note = ($('#dx-note') || {}).value || '';
    const r = HAWK.api.call('dx.verdict', { verdict: v, note }, HAWK.currentUser());
    if (!r.ok) return ui.toast(r.error.message, 'bad', 'dx.verdict');
    ui.toast('Hasil uji dicatat: ' + v, 'ok');
    panels();
  }

  /* ---------------- rendering ---------------- */
  function tutor() {
    const c = cur();
    const opts = DX.SCENARIOS.map((x) => `<option value="${x.id}" ${x.id === (c ? c.sc.id : L.sc) ? 'selected' : ''}>${esc(x.short)} (${x.steps.length})</option>`).join('');
    if (!c)
      return `<div class="dx-tutor-head"><div class="eyebrow">HAWK SMART TUTOR</div><h3>Demo Journey Center</h3><p>Pilih skenario lalu tekan Mulai. Data demo di-reset agar ceritanya utuh.</p></div>
      <div class="dx-tutor-body"><label class="tiny b">Pilih skenario</label><select class="inp" id="dx-sc">${opts}</select><button class="btn gold block" id="dx-start" data-dx="start" style="margin-top:10px">${ui.icon('play', 14)} Mulai skenario</button>${msgBox()}</div>`;
    const vs = viewStep();
    const step = vs.step;
    const p = progress();
    const v = DX.varsFor(st(), step);
    const t = DX.target(step.tid, v) || {};
    const res = resultOf(step);
    const isCur = !c.done && c.idx === vs.i;
    const rec = st().dx.steps[step.id];
    const ver = st().dx.verdict;
    return `<div class="dx-tutor-head"><div class="eyebrow">HAWK SMART TUTOR · ${esc(c.sc.id)}</div><h3>${esc(c.sc.name)}</h3><p>${esc(c.sc.story)}</p></div>
    <div class="dx-tutor-body">
      <div class="row between" style="gap:8px"><select class="inp" id="dx-sc" style="flex:1">${opts}</select><button class="btn sm" data-dx="start" title="Mulai ulang skenario terpilih">${ui.icon('reset', 14)} Mulai ulang</button></div>
      <div class="row between" style="margin-top:12px"><b class="small">Progres</b><span class="badge gold">${p.n}/${p.N} langkah</span></div>
      <div class="dx-prog"><i style="width:${p.N ? Math.round((p.n / p.N) * 100) : 0}%"></i></div>
      <div class="dx-step ${isCur ? 'cur' : ''}" id="dx-stepcard">
        <div class="eyebrow">LANGKAH ${step.n} DARI ${c.sc.steps.length} ${step.review ? '· TINJAUAN' : ''}</div>
        <h4>${esc(step.title)}</h4>
        <p class="small">${esc(step.what)}</p>
        <div class="dx-kv"><span>Peran</span><b>${esc(roleLabel(step.as))} — ${esc(userName(step.as))}${DX.SUPPORT[step.as] ? ' <span class="badge warn">pendukung</span>' : ''}</b>
          <span>Layar</span><b>${esc(nvName(t.nv))}</b>
          <span>Target ID</span><b class="mono">${esc(step.tid)}</b>
          <span>Status</span><b><span class="badge ${RES[res][0]}">${RES[res][1]}</span>${rec ? ` <span class="tiny muted">${esc(U.datetime(rec.at))} · ${esc(userName(rec.by))} · via ${esc(rec.via)}</span>` : ''}</b>
          ${rec && rec.evidence && rec.evidence.length ? `<span>Bukti</span><b>${rec.evidence.map((x) => `<a class="mono" data-dx="open" data-ref="${esc(x)}">${esc(x)}</a>`).join(', ')}</b>` : ''}
          ${rec && rec.note ? `<span>Catatan</span><b>${esc(rec.note)}</b>` : ''}</div>
        <div class="stack" style="gap:8px;margin-top:10px">
          <button class="btn ghost block" data-dx="focus">${ui.icon('search', 14)} Buka layar & sorot tombol</button>
          ${isCur ? (step.review ? `<button class="btn gold block" data-dx="review" id="dx-run">✓ Tandai sudah ditinjau</button>` : `<button class="btn gold block" data-dx="run" id="dx-run">✓ Jalankan Langkah Ini</button>`) : ''}
          ${isCur ? `<p class="tiny muted">Tombol ini menjalankan operasi yang sama dengan tombol yang disorot (cek role + audit). Anda juga dapat menekan tombol aslinya di layar — langkah terdeteksi selesai dari data.</p>` : ''}
          ${isCur ? `<button class="btn sm ghost" data-dx="block">Tandai BLOCKED (fitur/kontrol tidak ada)</button>` : ''}
        </div>
      </div>
      ${msgBox()}
      ${L.lastRun && L.lastRun.trail.length ? `<details class="dx-trail"><summary class="tiny">Operasi terakhir (${esc(L.lastRun.step)})</summary>${L.lastRun.trail.map((x) => `<div class="tiny mono">${esc(x)}</div>`).join('')}</details>` : ''}
      <div class="row" style="gap:8px;margin-top:10px"><button class="btn sm ghost" data-dx="back" ${vs.i === 0 ? 'disabled' : ''}>‹ Sebelumnya</button><button class="btn sm ghost" data-dx="next" ${vs.i >= c.sc.steps.length - 1 ? 'disabled' : ''}>Berikutnya ›</button><button class="btn sm ghost" data-dx="reset" style="margin-left:auto">${ui.icon('reset', 14)} Reset</button></div>
      <p class="tiny muted" style="margin-top:6px">Sebelumnya/Berikutnya hanya untuk melihat. Transaksi yang sudah dijalankan tidak di-rollback — gunakan Reset.</p>
      <div class="dx-steps">${c.sc.steps.map((x, i) => { const r = resultOf(x); return `<button class="dx-li ${i === vs.i ? 'on' : ''} r-${r}" data-dx="goto" data-i="${i}"><span class="dx-n">${['DONE', 'REVIEWED'].includes(r) ? '✓' : r === 'BLOCKED' ? '!' : r === 'FAILED' ? '✕' : x.n}</span><span><b>${esc(x.title)}</b><small>${esc(roleLabel(x.as))}</small></span></button>`; }).join('')}</div>
      <div class="dx-lab">
        <div class="eyebrow">TEST LAB · UAT REPORT</div>
        <div class="row" style="gap:6px"><button class="btn sm ${ver && ver.verdict === 'PASS' ? 'ok' : 'ghost'}" data-dx="verdict" data-v="PASS">PASS</button><button class="btn sm ${ver && ver.verdict === 'FAIL' ? 'bad' : 'ghost'}" data-dx="verdict" data-v="FAIL">FAIL</button><button class="btn sm ${ver && ver.verdict === 'BLOCKED' ? 'warn' : 'ghost'}" data-dx="verdict" data-v="BLOCKED">BLOCKED</button><button class="btn sm dark" data-dx="export" style="margin-left:auto">Ekspor JSON</button></div>
        <input class="inp" id="dx-note" placeholder="Catatan reviewer (wajib untuk FAIL / BLOCKED)" style="margin-top:6px">
        <p class="tiny">Status: <b>${ver ? esc(ver.verdict) + ' · ' + esc(userName(ver.by)) : 'BELUM DIREVIEW'}</b>${c.done ? ' · semua langkah selesai' : ''}</p>
      </div>
      <div class="dx-rules"><b>Aturan developer</b> Data sintetis. Login role = DEMO, bukan autentikasi. Sumber API HAWK: TO VERIFY. Tidak ada posting GL nyata, pembayaran nyata, atau OCR nyata. Reset tidak menyentuh HAWK produksi.</div>
    </div>`;
  }
  const msgBox = () => (L.msg ? `<div class="dx-msg ${L.msg.kind}" role="status">${esc(L.msg.text)}</div>` : '');

  function feed() {
    const s = st();
    const rows = s.audit.slice(0, 9);
    return `<div class="dx-feed"><div class="row between"><b class="small">${ui.icon('bell', 14)} Perubahan bersama (semua layar)</b><span class="tiny muted">audit sandbox</span></div>${rows.map((a) => `<div class="dx-feed-row"><span class="mono tiny">${esc(String(a.ts).slice(5, 16).replace('T', ' '))}</span><span><b>${esc(userName(a.user))}</b> · <span class="mono">${esc(a.op)}</span> ${a.ref ? `<span class="mono">${esc(a.ref)}</span>` : ''}<br><span class="tiny muted">${esc(String(a.detail || '').slice(0, 90))}</span></span></div>`).join('') || '<p class="tiny muted">Belum ada aktivitas.</p>'}</div>`;
  }
  function cellHtml(key, uid, label, device, extra) {
    return `<div class="dx-cell ${extra || ''}" data-cell="${key}" data-device="${device}">
      <div class="dx-cell-head"><span class="dx-cell-role">${esc(label)}</span>
        <select class="dx-dev" data-dx-dev="${key}" aria-label="Perangkat">${Object.entries(DX.DEVICES).map(([k, d]) => `<option value="${k}" ${k === device ? 'selected' : ''}>${d.label}</option>`).join('')}</select>
        <button class="dx-ib" data-dx="home" data-cell="${key}" title="Beranda role">${ui.icon('home', 14)}</button>
        <button class="dx-ib" data-dx="max" data-cell="${key}" title="Perbesar">⤢</button>
        <button class="dx-ib" data-dx="full" data-cell="${key}" title="Layar penuh">⛶</button></div>
      <div class="dx-screen"><iframe title="${esc(label)} — aplikasi HAWK (DEMO)" data-uid="${uid || ''}" loading="eager"></iframe></div></div>`;
  }
  function labHead() {
    const el = $('#dx-labhead');
    if (!el) return;
    const uid = L.labUser || 'U-STF';
    const all = DX.ROLE5.map((r) => r.user).concat(Object.keys(DX.SUPPORT));
    el.innerHTML = `<span class="tiny b">Login role (DEMO):</span>${all.map((u) => `<button class="chip ${u === uid ? 'on' : ''}" data-dx="as" data-u="${u}">${esc(roleLabel(u).replace(' (peran pendukung)', ''))}</button>`).join('')}
      <span class="dx-sep"></span>${Object.entries(DX.DEVICES).map(([k, d]) => `<button class="chip ${($('.dx-cell[data-cell="lab"]') || {}).dataset && $('.dx-cell[data-cell="lab"]').dataset.device === k ? 'on' : ''}" data-dx="labdev" data-d="${k}">${d.label}</button>`).join('')}`;
  }
  function panels() {
    const tp = $('#dx-tutor');
    if (tp) tp.innerHTML = tutor();
    const fd = $('#dx-feedbox');
    if (fd) fd.innerHTML = feed();
    const p = progress();
    const hb = $('#dx-hero-prog');
    if (hb) hb.textContent = cur() ? `${cur().sc.id} · ${p.n}/${p.N}` : 'Belum ada skenario';
    $$('.dx-tab').forEach((b) => b.classList.toggle('on', b.dataset.mode === L.mode));
  }

  function render() {
    return `<div data-dx-root class="dx">
      <div class="dx-hero"><div><div class="eyebrow">HAWK × JAENS · DX-HAWK-01 · GUIDED DEVELOPER DEMO</div><h1>Demo Experience Center</h1>
        <p>Belajar alur kerja lengkap dengan menekan tombol asli aplikasi HAWK. Lima role, tujuh skenario (termasuk 7P), satu data sandbox bersama. Tidak terhubung ke HAWK produksi.</p></div>
        <div class="dx-hero-r"><span class="badge demo">DEMO / NO LIVE API</span><span class="dx-pill">62 NV · 5 role · 7 skenario</span><span class="dx-pill" id="dx-hero-prog"></span></div></div>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="dx-tab" data-dx="mode" data-mode="lab">Option 1 · Scenario Test Lab</button><button class="dx-tab" data-dx="mode" data-mode="sim">Option 2 · Simulator 5 Layar</button>
        <span class="tiny muted" style="align-self:center">Setiap layar adalah aplikasi HAWK yang sebenarnya (bukan gambar) dengan hak akses role-nya.</span></div>
      <div class="dx-main">
        <div class="dx-stage">
          <div class="dx-lab-wrap ${L.mode === 'lab' ? '' : 'hide'}"><div class="dx-labhead row" id="dx-labhead"></div>${cellHtml('lab', '', 'Test Lab', L.labDevice || 'desktop', 'lab')}</div>
          <div class="dx-sim ${L.mode === 'sim' ? '' : 'hide'} ${L.max ? 'has-max' : ''}">${DX.ROLE5.map((r) => cellHtml(r.key, r.user, `${r.label} · ${userName(r.user)}`, r.device)).join('')}${cellHtml('support', '', 'Peran pendukung', 'desktop', 'hide')}</div>
          <div id="dx-feedbox"></div>
        </div>
        <aside class="dx-tutor" id="dx-tutor"></aside>
      </div>
    </div>`;
  }
  async function loadSim() {
    await Promise.all(DX.ROLE5.map((r) => {
      const cell = $(`.dx-cell[data-cell="${r.key}"]`);
      const f = $('iframe', cell);
      if (frameWin(f)) return null;
      f.dataset.uid = '';
      fit(cell);
      return openIn(f, r.user, r.home);
    }));
  }
  async function mount() {
    labHead();
    panels();
    fitAll();
    window.addEventListener('resize', fitAll);
    const root = $('[data-dx-root]');
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    if (L.mode === 'sim') await loadSim();
    const c = cur();
    if (c && !c.done) focusStep(c.step);
    else if (L.mode === 'lab') openIn($('.dx-cell[data-cell="lab"] iframe'), L.labUser || 'U-STF', 24).then(() => fit($('.dx-cell[data-cell="lab"]')));
  }
  function onChange(e) {
    const el = e.target;
    if (el.id === 'dx-sc') {
      L.sc = el.value;
      saveUi();
      if (!cur() || cur().sc.id !== el.value) startScenario(el.value);
    }
    if (el.dataset.dxDev) {
      const cell = $(`.dx-cell[data-cell="${el.dataset.dxDev}"]`);
      cell.dataset.device = el.value;
      if (el.dataset.dxDev === 'lab') (L.labDevice = el.value), saveUi();
      fit(cell);
    }
  }
  async function onClick(e) {
    const b = e.target.closest('[data-dx]');
    if (!b) return;
    const a = b.dataset.dx;
    const vs = viewStep();
    if (a === 'mode') {
      L.mode = b.dataset.mode;
      saveUi();
      $('.dx-lab-wrap').classList.toggle('hide', L.mode !== 'lab');
      $('.dx-sim').classList.toggle('hide', L.mode !== 'sim');
      panels();
      fitAll();
      if (L.mode === 'sim') await loadSim();
      fitAll();
      if (vs) focusStep(vs.step);
    } else if (a === 'start') startScenario(($('#dx-sc') || {}).value || L.sc);
    else if (a === 'run') runCurrent();
    else if (a === 'focus') vs && focusStep(vs.step);
    else if (a === 'review') {
      const r = DX.review(HAWK.store, HAWK.api);
      L.msg = r.ok ? { kind: 'ok', text: 'Langkah tinjauan ditandai.' } : { kind: 'bad', text: (r.error || {}).message || 'Gagal' };
      L.view = null;
      panels();
      refreshFrames();
      const n = cur();
      if (n && !n.done) setTimeout(() => focusStep(n.step), 200);
    } else if (a === 'block') {
      ui.openModal('Tandai langkah BLOCKED', `<p class="small">Gunakan bila kontrol/fitur yang dibutuhkan tidak ada atau tidak bisa dijalankan. Catatan wajib dan masuk laporan uji.</p><textarea class="inp" id="dx-block-note" rows="3" placeholder="Contoh: tombol Kunci periode belum ada di NV-07"></textarea>`, '<button class="btn ghost" data-close-modal>Batal</button><button class="btn warn" id="dx-block-ok">Tandai BLOCKED</button>');
      $('#dx-block-ok').onclick = () => {
        const r = DX.block(HAWK.store, HAWK.api, $('#dx-block-note').value);
        if (!r.ok) return ui.toast(r.error.message, 'bad');
        ui.closeModal();
        panels();
      };
    } else if (a === 'back' || a === 'next') {
      L.view = Math.max(0, (vs ? vs.i : 0) + (a === 'back' ? -1 : 1));
      panels();
      focusStep(viewStep().step);
    } else if (a === 'goto') {
      L.view = +b.dataset.i;
      panels();
      focusStep(viewStep().step);
    } else if (a === 'reset') {
      HAWK.store.reset();
      L.msg = { kind: 'ok', text: 'Data demo di-reset. Pilih skenario untuk mulai lagi.' };
      L.view = null;
      L.lastRun = null;
      refreshFrames();
      panels();
    } else if (a === 'verdict') verdict(b.dataset.v);
    else if (a === 'export') exportReport();
    else if (a === 'as') {
      L.labUser = b.dataset.u;
      const r = DX.ROLE5.find((x) => x.user === b.dataset.u);
      const cell = $('.dx-cell[data-cell="lab"]');
      if (!L.labDevice) cell.dataset.device = (r || {}).device || 'desktop';
      fit(cell);
      await openIn($('iframe', cell), b.dataset.u, r ? r.home : HAWK.ROLE_HOME[roleOf(b.dataset.u)] || 1);
      labHead();
    } else if (a === 'labdev') {
      const cell = $('.dx-cell[data-cell="lab"]');
      cell.dataset.device = b.dataset.d;
      L.labDevice = b.dataset.d;
      saveUi();
      $('select', cell).value = b.dataset.d;
      fit(cell);
      labHead();
    } else if (a === 'home') {
      const cell = $(`.dx-cell[data-cell="${b.dataset.cell}"]`);
      const f = $('iframe', cell);
      const uid = f.dataset.uid;
      if (uid) openIn(f, uid, HAWK.ROLE_HOME[roleOf(uid)] || 1);
    } else if (a === 'max') {
      const cell = $(`.dx-cell[data-cell="${b.dataset.cell}"]`);
      const on = !cell.classList.contains('max');
      $$('.dx-cell').forEach((x) => x.classList.remove('max'));
      cell.classList.toggle('max', on);
      $('.dx-sim').classList.toggle('has-max', on && cell.dataset.cell !== 'lab');
      L.max = on ? b.dataset.cell : null;
      setTimeout(fitAll, 30);
    } else if (a === 'full') {
      const cell = $(`.dx-cell[data-cell="${b.dataset.cell}"]`);
      if (document.fullscreenElement) document.exitFullscreen();
      else if (cell.requestFullscreen) cell.requestFullscreen().then(() => setTimeout(() => fit(cell), 80)).catch(() => ui.toast('Layar penuh tidak diizinkan browser', 'bad'));
    } else if (a === 'open') HAWK.openRecord && HAWK.openRecord(b.dataset.ref);
  }
  document.addEventListener('fullscreenchange', () => setTimeout(fitAll, 80));

  /* another window changed the shared sandbox (a frame user clicked a real button) */
  function onSync() {
    const before = cur() && cur().step && cur().step.id;
    const done = DX.detect(HAWK.store, HAWK.api);
    if (done) {
      L.msg = { kind: 'ok', text: `${done} terdeteksi selesai dari tombol asli di layar.` };
      L.view = null;
    }
    panels();
    if (done) refreshFrames();
    const n = cur();
    if (done && n && !n.done && n.step.id !== before) setTimeout(() => focusStep(n.step), 250);
  }

  HAWK.dxCenter = { render, mount, refresh: panels, onSync, focusStep, runCurrent, startScenario, L };
})();

/* Right-sized role workspaces (MP-HAWK-09 §4): one shortcut card on each role's home screen.
   Links only to screens the role may open (HAWK.canSee) — a shortcut never widens production permissions. */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const ui = HAWK.ui;
  const esc = HAWK.U.esc;
  const V = HAWK.views;
  const SC = {
    FINANCE: { title: 'Ruang kerja Finance — semua fitur', note: 'Akses lintas modul untuk referensi DEMO. Tidak memberi hak produksi; backend HAWK tetap menegakkan RBAC.', items: [[15, 'budget', 'Budget tahunan'], [16, 'budget', '7P overview'], [22, 'budget', 'Revisi & reforecast'], [23, 'budget', 'Budget vs actual'], [48, 'scan', 'AI capture & Spend Money'], [49, 'check', '3-way matching'], [50, 'finance', 'Hutang & pembayaran'], [51, 'doc', 'GL posting'], [52, 'org', 'Alokasi biaya'], [7, 'org', 'Shared Office'], [36, 'cart', 'Referensi PO'], [40, 'box', 'Referensi stok'], [53, 'asset', 'Referensi aset'], [56, 'asset', 'Kapitalisasi'], [61, 'clock', 'Control Tower']] },
    PURCHASING: { title: 'Ruang kerja Purchasing', note: 'MRF terkonsolidasi, sourcing, PO, supplier, SLA, overdue & pembelian darurat dalam satu tempat.', items: [[32, 'mrf', 'Konsolidasi MRF'], [34, 'search', 'Penawaran & harga'], [35, 'cart', 'Buat PO'], [36, 'doc', 'Register & approval PO'], [33, 'users', 'Supplier'], [61, 'clock', 'SLA & overdue'], [62, 'truck', 'Lacak pesanan'], [37, 'alert', 'Pembelian darurat'], [41, 'truck', 'Barang masuk']] },
    BU_MANAGER: { title: 'Ruang kerja BU Manager', note: 'Target, budget 7P, Operational vs Innovation, isu strategis, kesehatan alur & produktivitas.', items: [[10, 'target', 'Target tahunan'], [16, 'budget', 'Budget 7P'], [12, 'target', 'Operational vs Innovation'], [22, 'budget', 'Reforecast'], [23, 'budget', 'Budget vs actual'], [61, 'clock', 'Flow Health'], [59, 'ai', 'Produktivitas 7P'], [57, 'ai', 'AI insight BU'], [50, 'finance', 'Approval tagihan'], [7, 'org', 'Review alokasi']] },
    SUPERVISOR: { title: 'Kontrol harian outlet', note: 'Ramah sentuh: approval, risiko stok, kiriman hari ini, penerimaan, put-away & fasilitas.', items: [[29, 'check', 'Approval'], [38, 'box', 'Risiko stok'], [41, 'truck', 'Kiriman hari ini'], [44, 'truck', 'Transfer'], [45, 'box', 'Serah terima'], [55, 'wrench', 'Fasilitas'], [48, 'scan', 'Nota & pengeluaran'], [61, 'clock', 'Isu SLA unit']] },
    STAFF: { title: 'Aksi cepat', note: '', items: [[24, 'cart', 'Minta barang'], [48, 'camera', 'Foto nota'], [27, 'inbox', 'Status permintaan'], [55, 'wrench', 'Lapor kerusakan']] },
  };
  function card(ctx) {
    const c = SC[ctx.role];
    if (!c) return '';
    const items = c.items.filter(([nv]) => HAWK.canSee(ctx.role, nv) && nv !== ctx.nv);
    if (!items.length) return '';
    return `<div class="card rs-card ${ctx.role === 'STAFF' ? 'rs-staff' : ''}" data-role-shortcuts="${ctx.role}"><div class="row between" style="gap:8px"><h3 style="margin:0">${esc(c.title)}</h3><a class="small" href="#/dx">${ui.icon('play', 14)} Demo Center</a></div>${c.note ? `<p class="tiny muted" style="margin:4px 0 10px">${esc(c.note)}</p>` : ''}
      <div class="rs-grid">${items.map(([nv, ic, t]) => `<button class="rs-item" data-nav="${nv}"><span class="rs-ic">${ui.icon(ic, 20)}</span><span>${esc(t)}<small>NV-${String(nv).padStart(2, '0')}</small></span></button>`).join('')}</div></div>`;
  }
  const wrap = (nv, pred) => {
    const v = V[nv];
    if (!v) return;
    const orig = v.render;
    v.render = (ctx) => {
      const body = orig(ctx);
      if (pred && !pred(ctx)) return body;
      const w = card(ctx);
      return w ? `<div class="stack">${w}${body}</div>` : body;
    };
  };
  wrap(47, (c) => c.role === 'FINANCE');
  wrap(31, (c) => c.role === 'PURCHASING');
  wrap(1, (c) => c.role === 'BU_MANAGER');
  wrap(29, (c) => c.role === 'SUPERVISOR');
  wrap(24, (c) => c.role === 'STAFF');
  HAWK.roleShortcuts = SC;
})();
