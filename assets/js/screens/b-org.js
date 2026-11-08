/* Module B — Organization, Office & Access (NV-05..09). Org is DATA (dynamic) — never hardcoded in screens.
   Demo permission visibility is NOT security: the HAWK backend must enforce authorization independently. */
(function () {
  'use strict';
  const HAWK = window.HAWK;
  const U = HAWK.U;
  const S = HAWK.selectors;
  const ui = HAWK.ui;
  const esc = U.esc;
  const V = HAWK.views;
  const TYPE = { GROUP: 'Grup', BU: 'Business Unit', OFFICE: 'Kantor / HQ', BRANCH: 'Cabang', DIVISION: 'Divisi' };
  const ROLES = Object.keys(HAWK.ROLE_LABEL);

  function unitDrawer(s, id) {
    const o = S.org(s, id);
    const cc = s.costCenters.filter((c) => c.org === id);
    const wh = s.warehouses.filter((w) => w.org === id);
    const users = s.users.filter((u) => u.scope.includes(id));
    const kids = s.org.filter((x) => x.parent === id);
    const body = `<dl class="kv"><dt>ID / kode</dt><dd class="mono">${o.id} · ${esc(o.code || '—')}</dd><dt>Tipe</dt><dd>${TYPE[o.type]}</dd><dt>Induk</dt><dd>${esc(S.orgName(s, o.parent) || '—')}</dd><dt>Status</dt><dd>${ui.status(o.status)}</dd><dt>Lingkup</dt><dd>${o.scope === 'OUT' ? '<span class="badge">Di luar lingkup Spa–Essence</span>' : '<span class="badge ok">Dalam lingkup</span>'}</dd>${o.location ? `<dt>Lokasi</dt><dd>${esc(o.location)}</dd>` : ''}${o.note ? `<dt>Catatan</dt><dd>${esc(o.note)}</dd>` : ''}</dl>
      <div class="card" style="margin-top:12px"><h3>Cost center</h3>${cc.map((c) => `<div class="small mono">${c.id} · ${esc(c.name)}${c.shared ? ' <span class="badge gold">shared</span>' : ''}</div>`).join('') || '<p class="small muted">—</p>'}</div>
      <div class="card" style="margin-top:12px"><h3>Gudang</h3>${wh.map((w) => `<div class="small">${esc(w.name)} · ${w.bins.length} bin</div>`).join('') || '<p class="small muted">—</p>'}</div>
      <div class="card" style="margin-top:12px"><h3>Unit anak (${kids.length}) & pengguna (${users.length})</h3>${kids.map((k) => `<span class="badge">${esc(k.name)}</span>`).join(' ')}<div style="margin-top:6px">${users.map((u) => `<div class="small">${esc(u.name)} — ${esc(HAWK.ROLE_LABEL[u.role])}</div>`).join('')}</div></div>`;
    ui.openDrawer(o.name, body, `<button class="btn ghost sm" data-nav="6">Kelola unit (NV-06)</button>`, TYPE[o.type]);
  }

  /* ---------- NV-05 Organization & BU Tree ---------- */
  V[5] = {
    render(ctx) {
      const { s } = ctx;
      const node = (o) => {
        const kids = s.org.filter((x) => x.parent === o.id);
        const n = s.costCenters.filter((c) => c.org === o.id).length;
        return `<li><span class="node ${o.scope === 'OUT' ? 'out' : ''} ${o.status === 'ARCHIVED' ? 'arch' : ''}" role="button" tabindex="0" data-a="open" data-p="${o.id}"><b>${esc(o.name)}</b><span class="tiny muted">${TYPE[o.type]}</span>${o.scope === 'OUT' ? '<span class="badge">di luar lingkup</span>' : ''}${n ? `<span class="badge gold">${n} CC</span>` : ''}</span>${kids.length ? `<ul>${kids.map(node).join('')}</ul>` : ''}</li>`;
      };
      const root = s.org.find((o) => o.type === 'GROUP');
      const act = s.org.filter((o) => o.status === 'ACTIVE' && o.scope === 'IN');
      return `<div class="stack"><div class="grid g4 keep2">${ui.kpi('Business unit / kantor', act.filter((o) => ['BU', 'OFFICE'].includes(o.type)).length, 'dalam lingkup Spa–Essence', 'g-gold', 'org')}${ui.kpi('Cabang aktif', act.filter((o) => o.type === 'BRANCH').length, 'Spa · dinamis, bukan hardcode', '', 'home')}${ui.kpi('Divisi', act.filter((o) => o.type === 'DIVISION').length, 'Essence & Office', '', 'users')}${ui.kpi('Cost center', s.costCenters.length, s.costCenters.filter((c) => c.shared).length + ' shared (HQ)', '', 'finance')}</div>
        <div class="grid g-2-1"><div class="card"><div class="card-head"><h3>Struktur organisasi</h3><span class="r">${ctx.can('org.upsertUnit') ? '<button class="btn sm" data-nav="6">+ Tambah unit</button>' : ''}</span></div><div class="tree"><ul>${node(root)}</ul></div></div>
        <div class="card" style="align-self:start"><h3>Aturan</h3><ul class="small" style="padding-left:18px;margin:0"><li>Cabang, divisi & BU adalah <b>data</b> — dapat ditambah/diarsipkan tanpa ubah kode.</li><li>Cabang baru otomatis mendapat cost center & gudang.</li><li>BU JAENS lain bersistem independen — hanya integrasi/konsolidasi yang diotorisasi.</li><li>Target grup & valuasi (Rp125 M) <b>di luar</b> lingkup operasional Spa–Essence.</li><li>Unit dengan transaksi terbuka tidak dapat diarsipkan.</li></ul><p class="tiny muted">Sumber: Settings / Locations HAWK ${ui.intBadge('TO VERIFY')}</p></div></div></div>`;
    },
    actions: {
      open(el, ctx) {
        unitDrawer(ctx.s, el.dataset.p);
      },
    },
  };

  /* ---------- NV-06 Branch, Office & Division Management ---------- */
  V[6] = {
    render(ctx) {
      const { s, L } = ctx;
      const cur = L.t || 'ACTIVE';
      const list = s.org.filter((o) => o.type !== 'GROUP' && (cur === 'ALL' || o.status === cur));
      const parents = s.org.filter((o) => ['GROUP', 'BU', 'OFFICE'].includes(o.type) && o.status === 'ACTIVE' && (o.scope === 'IN' || o.type === 'GROUP'));
      const can = ctx.can('org.upsertUnit');
      return `<div class="stack">${ui.tabs('t', [['ACTIVE', 'Aktif'], ['ARCHIVED', 'Diarsipkan'], ['ALL', 'Semua']], cur)}<div class="grid g-2-1"><div class="card">${ui.table(
        [
          { h: 'Unit', f: (o) => `<button class="link" data-a="open" data-p="${o.id}"><b>${esc(o.name)}</b></button><div class="tiny muted mono">${o.id}</div>` },
          { h: 'Tipe', f: (o) => TYPE[o.type] },
          { h: 'Induk', f: (o) => esc(S.orgName(s, o.parent)) },
          { h: 'Lingkup', f: (o) => (o.scope === 'OUT' ? '<span class="badge">OUT</span>' : '<span class="badge ok">IN</span>') },
          { h: 'Status', f: (o) => ui.status(o.status) },
          { h: '', f: (o) => (can ? `<button class="btn sm ghost" data-a="edit" data-p="${o.id}">Ubah</button> ${o.status === 'ACTIVE' ? `<button class="btn sm ghost" data-a="arch" data-p="${o.id}">Arsipkan</button>` : `<button class="btn sm ok" data-a="act" data-p="${o.id}">Aktifkan</button>`}` : '') },
        ],
        list
      )}</div>
      <div class="card" style="align-self:start"><h3>${ui.icon('plus', 16)} Tambah unit</h3>${can ? `<div class="stack"><div class="field"><label>Tipe</label><select class="inp" id="ou-type"><option value="BRANCH">Cabang</option><option value="DIVISION">Divisi</option><option value="BU">Business Unit</option></select></div>
        <div class="field"><label>Nama *</label><input class="inp" id="ou-name" placeholder="Spa Canggu"></div><div class="grid g2"><div class="field"><label>Kode (3 huruf)</label><input class="inp" id="ou-code" maxlength="3" placeholder="CGU"></div><div class="field"><label>Induk</label><select class="inp" id="ou-parent">${parents.map((p) => `<option value="${p.id}" ${p.id === 'BU-SPA' ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div></div>
        <div class="field"><label>Lokasi</label><input class="inp" id="ou-loc" placeholder="Canggu, Badung"></div><label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="ou-wh" checked> Buat gudang cabang (rak A, 3 bin)</label>
        <button class="btn block" data-a="add">Tambah unit</button><p class="tiny muted">Unit baru langsung muncul di pilihan BU/cabang, MRF, budget & laporan.</p></div>` : '<p class="small muted">Hanya System Administrator yang dapat mengubah struktur (Owner melihat).</p>'}</div></div></div>`;
    },
    actions: {
      open(el, ctx) {
        unitDrawer(ctx.s, el.dataset.p);
      },
      add(el, ctx) {
        ctx.act('org.upsertUnit', { type: ctx.val('ou-type'), name: ctx.val('ou-name').trim(), code: ctx.val('ou-code').trim(), parent: ctx.val('ou-parent'), location: ctx.val('ou-loc'), createWarehouse: document.getElementById('ou-wh').checked }, (o) => `${o.name} ditambahkan — cost center${o.type === 'BRANCH' ? ' & gudang' : ''} dibuat`);
      },
      edit(el, ctx) {
        const o = S.org(ctx.s, el.dataset.p);
        ui.openModal('Ubah ' + esc(o.name), `<div class="field"><label>Nama</label><input class="inp" id="oe-name" value="${esc(o.name)}"></div><div class="field" style="margin-top:8px"><label>Lokasi</label><input class="inp" id="oe-loc" value="${esc(o.location || '')}"></div><div class="field" style="margin-top:8px"><label>Induk</label><select class="inp" id="oe-parent">${ctx.s.org.filter((p) => ['GROUP', 'BU', 'OFFICE'].includes(p.type) && p.id !== o.id).map((p) => `<option value="${p.id}" ${p.id === o.parent ? 'selected' : ''}>${esc(p.name)}${p.status !== 'ACTIVE' ? ' (arsip)' : ''}</option>`).join('')}</select></div><p class="tiny muted">Tipe & kode tidak diubah untuk menjaga histori transaksi. Pindah induk divalidasi: induk harus aktif dan tidak boleh melingkar; transaksi lama tetap tercatat di unit asal.</p>`, `<button class="btn ghost" data-close-modal>Batal</button><button class="btn" data-a="save" data-p="${o.id}">Simpan</button>`);
      },
      save(el, ctx) {
        const o = S.org(ctx.s, el.dataset.p);
        const r = ctx.act('org.upsertUnit', { id: o.id, type: o.type, parent: ctx.val('oe-parent') || o.parent, name: ctx.val('oe-name').trim(), location: ctx.val('oe-loc') }, 'Unit diperbarui');
        if (r.ok) ui.closeModal();
      },
      arch(el, ctx) {
        ctx.act('org.setStatus', { id: el.dataset.p, status: 'ARCHIVED' }, 'Unit diarsipkan — histori tetap tersimpan');
      },
      act(el, ctx) {
        ctx.act('org.setStatus', { id: el.dataset.p, status: 'ACTIVE' }, 'Unit diaktifkan kembali');
      },
    },
  };

  /* ---------- NV-07 Cost Center & Shared Office Allocation ---------- */
  V[7] = {
    render(ctx) {
      const { s, L } = ctx;
      const pool = s.sharedAllocations.find((a) => a.pool === (L.pool || ctx.q.pool)) || s.sharedAllocations[0];
      const bus = s.org.filter((o) => o.type === 'BU' && o.scope === 'IN' && o.status === 'ACTIVE');
      const can = ctx.can('cc.updateAllocation') && !pool.locked;
      const rv = pool.reviews || {};
      const splitBus = bus.filter((b) => (pool.splits[b.id] || 0) > 0);
      const canReview = (b) => ctx.can('cc.reviewAllocation') && !pool.locked && (ctx.role === 'OWNER' || ctx.user.scope.includes(b.id));
      const allOk = splitBus.length && splitBus.every((b) => rv[b.id] && rv[b.id].decision === 'AGREE');
      const flow = `<div class="card" style="align-self:start"><h3>Review BU & kunci periode ${ui.intBadge('NEW INTEGRATION REQUIRED')}</h3>
          <p class="tiny muted" style="margin:0 0 8px">Finance menetapkan porsi → tiap BU meninjau → Finance mengunci periode. Tidak ada jurnal yang diposting di sini; porsi dipakai laporan NV-52.</p>
          ${splitBus.map((b) => { const r = rv[b.id]; return `<div class="row between" style="padding:8px 0;border-top:1px solid var(--line-2);gap:8px"><span><b>${esc(b.name)}</b> · ${Math.round(pool.splits[b.id] * 1000) / 10}%<br><span class="tiny muted">${r ? `${r.decision === 'AGREE' ? 'Setuju' : 'Keberatan'} · ${esc(S.userName(s, r.by))} · ${esc(U.datetime(r.at))}${r.note ? ' — ' + esc(r.note) : ''}` : 'Belum direview'}</span></span>
            ${r ? `<span class="badge ${r.decision === 'AGREE' ? 'ok' : 'bad'}">${r.decision === 'AGREE' ? 'Setuju' : 'Keberatan'}</span>` : canReview(b) ? `<span class="row" style="gap:6px"><button class="btn sm ok" data-a="reviewAlloc" data-pool="${pool.pool}" data-bu="${b.id}">Setuju</button><button class="btn sm ghost" data-a="disputeAlloc" data-pool="${pool.pool}" data-bu="${b.id}">Keberatan</button></span>` : '<span class="badge">Menunggu</span>'}</div>`; }).join('')}
          ${pool.locked ? `<div class="dx-msg ok">Dikunci periode <b>${esc(pool.locked.period)}</b> oleh ${esc(S.userName(s, pool.locked.by))} · ${esc(U.datetime(pool.locked.at))}</div>` : ctx.can('cc.lockAllocation') ? `<button class="btn block dark" data-a="lockAlloc" data-pool="${pool.pool}" ${allOk ? '' : 'disabled title="Menunggu semua BU setuju"'} style="margin-top:8px">Kunci periode ${esc(s.meta.demoDate.slice(0, 7))}</button>` : ''}
          ${(pool.history || []).length ? `<details class="small" style="margin-top:8px"><summary>Riwayat (${pool.history.length})</summary>${pool.history.map((h) => `<div class="tiny">${esc(U.datetime(h.ts))} · ${esc(S.userName(s, h.by))} · ${esc(h.action)} ${esc(h.note || '')}</div>`).join('')}</details>` : ''}</div>`;
      return `<div class="stack"><div class="grid g-2-1"><div class="card"><h3>Cost center</h3>${ui.table([{ h: 'Kode', f: (c) => `<span class="mono">${c.id}</span>` }, { h: 'Nama', f: (c) => esc(c.name) }, { h: 'Unit', f: (c) => esc(S.orgName(s, c.org)) }, { h: 'BU', f: (c) => esc(S.orgName(s, S.buOf(s, c.org))) }, { h: 'Jenis', f: (c) => (c.shared ? '<span class="badge gold">Shared HQ</span>' : '<span class="badge">Langsung</span>') }], s.costCenters, { maxH: 420 })}<p class="tiny muted" style="margin:8px 0 0">Setara kolom JOB [+] di PR/PO HAWK ${ui.intBadge('TO VERIFY')}. Setiap MRF, ledger & jurnal membawa cost center.</p></div>
        <div class="card" style="align-self:start"><h3>Formula alokasi kantor bersama</h3><div class="field"><label>Pool biaya</label><select class="inp" data-ch="pool">${s.sharedAllocations.map((a) => `<option value="${a.pool}" ${a.pool === pool.pool ? 'selected' : ''}>${esc((s.costCenters.find((c) => c.id === a.pool) || {}).name || a.pool)}</option>`).join('')}</select></div>
          <div class="field" style="margin-top:8px"><label>Dasar alokasi</label><input class="inp" id="al-basis" value="${esc(pool.basis)}" ${can ? '' : 'readonly'}></div>
          ${bus.map((b) => `<div class="field" style="margin-top:8px"><label>${esc(b.name)} (%)</label><input class="inp" type="number" min="0" max="100" step="0.5" id="al-${b.id}" value="${Math.round((pool.splits[b.id] || 0) * 1000) / 10}" ${can ? '' : 'readonly'}></div>`).join('')}
          <p class="small">Biaya pool: <b>${U.rp(pool.monthlyCost)}</b> / bulan (DEMO)</p>
          ${can ? `<button class="btn block" data-a="save" data-pool="${pool.pool}">Simpan formula</button>` : `<p class="small muted">${pool.locked ? 'Periode sudah dikunci Finance.' : 'Hanya Admin / Finance yang dapat mengubah.'}</p>`}
          <p class="tiny muted">Validasi: total 100%. Board B menampilkan porsi "Proyek/Cadangan" — tidak diadopsi karena alokasi hanya antar-BU dalam lingkup (lihat DESIGN_CONFLICTS).</p></div></div>${flow}</div>`;
    },
    actions: {
      pool(el, ctx) {
        ctx.L.pool = el.value;
        ctx.rerender();
      },
      save(el, ctx) {
        const pool = ctx.s.sharedAllocations.find((a) => a.pool === ctx.L.pool) || ctx.s.sharedAllocations[0];
        const splits = {};
        ctx.s.org.filter((o) => o.type === 'BU' && o.scope === 'IN' && o.status === 'ACTIVE').forEach((b) => (splits[b.id] = (+ctx.val('al-' + b.id) || 0) / 100));
        ctx.act('cc.updateAllocation', { pool: pool.pool, basis: ctx.val('al-basis'), splits }, 'Formula alokasi disimpan — review BU dimulai ulang');
      },
      reviewAlloc(el, ctx) {
        ctx.act('cc.reviewAllocation', { pool: el.dataset.pool, bu: el.dataset.bu, decision: 'AGREE' }, 'Porsi BU disetujui');
      },
      disputeAlloc(el, ctx) {
        ui.openModal('Keberatan atas porsi alokasi', `<div class="field"><label>Alasan keberatan *</label><textarea class="inp" id="al-dispute" rows="3"></textarea></div>`, '<button class="btn ghost" data-close-modal>Batal</button><button class="btn" id="al-dispute-ok">Kirim keberatan</button>');
        document.getElementById('al-dispute-ok').onclick = () => {
          const r = ctx.act('cc.reviewAllocation', { pool: el.dataset.pool, bu: el.dataset.bu, decision: 'DISPUTE', note: ctx.val('al-dispute') }, 'Keberatan dicatat');
          if (r.ok) ui.closeModal();
        };
      },
      lockAlloc(el, ctx) {
        ctx.act('cc.lockAllocation', { pool: el.dataset.pool }, (a) => 'Alokasi dikunci periode ' + a.locked.period);
      },
    },
  };

  /* ---------- NV-08 User, Role & Access ---------- */
  V[8] = {
    render(ctx) {
      const { s, L } = ctx;
      const cur = L.t || 'users';
      const can = ctx.can('user.assignRole');
      const users = `<div class="card">${ui.table(
        [
          { h: 'Pengguna (fiktif)', f: (u) => `<b>${esc(u.name)}</b><div class="tiny muted">${u.id} · ${esc(u.title)}</div>` },
          { h: 'Role', f: (u) => (can && u.id !== ctx.user.id ? `<select class="inp" data-ch="role" data-u="${u.id}" style="max-width:220px">${ROLES.map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${esc(HAWK.ROLE_LABEL[r])}</option>`).join('')}</select>` : esc(HAWK.ROLE_LABEL[u.role])) },
          { h: 'Scope', f: (u) => u.scope.map((x) => `<span class="badge">${esc(S.orgName(s, x))}</span>`).join(' ') },
          { h: 'Beranda', f: (u) => `NV-${String(HAWK.ROLE_HOME[u.role]).padStart(2, '0')}` },
        ],
        s.users
      )}<p class="tiny muted" style="margin:8px 0 0">Tanpa password atau kredensial di prototipe. Admin tidak dapat mengubah role dirinya sendiri. Header HAWK menampilkan "PRIVILEGE" ${ui.intBadge('TO VERIFY')}.</p></div>`;
      const mods = Object.entries(HAWK.MODULES);
      const matrix = `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Layar</th>${ROLES.map((r) => `<th title="${esc(HAWK.ROLE_LABEL[r])}" style="font-size:10px">${r.replace('_', ' ')}</th>`).join('')}</tr></thead><tbody>${mods.map(([k, m]) => `<tr><td colspan="${ROLES.length + 1}" style="background:#f6f4ef"><b>Modul ${k} · ${esc(m.name)}</b></td></tr>${HAWK.SCREENS.filter((x) => x.mod === k).map((x) => `<tr><td class="small">${x.code} ${esc(x.name)}</td>${ROLES.map((r) => `<td style="text-align:center">${HAWK.canSee(r, x.nv) ? (x.roles.includes(r) ? '●' : '○') : ''}</td>`).join('')}</tr>`).join('')}`).join('')}</tbody></table></div><p class="tiny muted" style="margin:8px 0 0">● akses utama · ○ akses baca Owner. Hak <b>aksi</b> per operasi ada di kontrak (ROLE_PERMISSION_MATRIX.csv). Simulasi tampilan — bukan keamanan.</p></div>`;
      return `<div class="stack">${ui.tabs('t', [['users', 'Pengguna & role', s.users.length], ['matrix', 'Matriks akses layar']], cur)}${cur === 'users' ? users : matrix}</div>`;
    },
    actions: {
      role(el, ctx) {
        ctx.act('user.assignRole', { id: el.dataset.u, role: el.value }, (u) => `${u.name} → ${HAWK.ROLE_LABEL[u.role]}`);
      },
    },
  };

  /* ---------- NV-09 Approval Matrix & Rules ---------- */
  V[9] = {
    render(ctx) {
      const { s, L } = ctx;
      const docs = U.uniq(s.approvalRules.map((r) => r.doc));
      const cur = L.t || 'ALL';
      const list = s.approvalRules.filter((r) => cur === 'ALL' || r.doc === cur);
      const can = ctx.can('approval.updateRule');
      const canPub = ctx.can('approval.publishRule');
      const pend = s.approvalRules.filter((r) => r.pending);
      const chainB = (ch) => ch.map((c, i) => `${i ? '<span class="muted">→</span>' : ''}<span class="badge">${esc(HAWK.ROLE_LABEL[c] || c)}</span>`).join('');
      const fmtCh = (k, v) => (k === 'chain' ? v.map((c) => HAWK.ROLE_LABEL[c] || c).join(' → ') : k === 'active' ? (v ? 'aktif' : 'nonaktif') : v === null ? '∞' : k === 'slaHours' ? v + ' jam' : U.rp(v));
      const simDoc = L.sd || 'MRF';
      const simAmt = L.sa === undefined ? 3500000 : +L.sa;
      const sim = ctx.S.routeSim(s, simDoc, simAmt, !!L.so);
      const simDocs = U.uniq(s.approvalRules.filter((r) => !['MRF_EXCEPTION', 'AUTO_ORDER'].includes(r.doc)).map((r) => r.doc));
      return `<div class="stack">
        ${pend.length ? `<div class="card" style="border-color:var(--gold)"><div class="card-head"><h3>Draft revisi menunggu terbit (${pend.length})</h3><span class="r">${ui.intBadge('NEW INTEGRATION REQUIRED')}</span></div>
          ${pend.map((r) => `<div class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding:10px 0;gap:10px;flex-wrap:wrap"><div><b>${r.id} · ${esc(r.name)}</b>
            <div class="tiny">${Object.entries(r.pending.changes).map(([k, v]) => `${k}: <s class="muted">${esc(fmtCh(k, r[k]))}</s> → <b>${esc(fmtCh(k, v))}</b>`).join(' · ')}</div>
            <div class="tiny muted">Dibuat ${esc(ctx.S.userName(s, r.pending.by))} · ${U.datetime(r.pending.ts)} — versi aktif v${r.version || 1} tetap berlaku sampai diterbitkan</div></div>
            ${canPub ? `<div class="row" style="gap:6px"><button class="btn sm gold" data-a="publish" data-p="${r.id}">Terbitkan</button><button class="btn sm ghost" data-a="discard" data-p="${r.id}">Tolak draft</button></div>` : '<span class="badge warn">Menunggu Owner</span>'}</div>`).join('')}</div>` : ''}
        ${ui.tabs('t', [['ALL', 'Semua', s.approvalRules.length], ...docs.map((d) => [d, d.replace('_', ' ')])], cur)}<div class="card">${ui.table(
        [
          { h: 'Aturan', f: (r) => `<b>${esc(r.name)}</b> <span class="tiny muted">v${r.version || 1}</span>${r.pending ? ' <span class="badge warn">draft revisi</span>' : ''}<div class="tiny muted">${r.id} · ${esc(r.condition)}</div>${r.policy ? `<div class="tiny" style="color:var(--warn)">${esc(r.policy)}</div>` : ''}` },
          { h: 'Dokumen', f: (r) => `<span class="badge">${r.doc}</span>` },
          { h: 'Min (Rp)', num: true, f: (r) => (can && r.doc !== 'AUTO_ORDER' ? `<input class="qty" style="width:110px" type="number" id="ar-min-${r.id}" value="${r.min}">` : U.rp(r.min)) },
          { h: 'Maks (Rp)', num: true, f: (r) => (can && r.doc !== 'AUTO_ORDER' ? `<input class="qty" style="width:110px" type="number" id="ar-max-${r.id}" value="${r.max === null ? '' : r.max}" placeholder="∞">` : r.max === null ? '∞' : U.rp(r.max)) },
          { h: 'Rantai approval', f: (r) => `<div class="row" style="gap:4px">${chainB(r.chain)}${r.postApproval ? ` <span class="badge warn">susulan ${esc(HAWK.ROLE_LABEL[r.postApproval])}</span>` : ''}</div>` },
          { h: 'SLA', num: true, f: (r) => (can && r.doc !== 'AUTO_ORDER' ? `<input class="qty" style="width:60px" type="number" id="ar-sla-${r.id}" value="${r.slaHours}">` : r.slaHours) + ' jam' },
          { h: 'Eskalasi', f: (r) => esc(HAWK.ROLE_LABEL[r.escalateTo] || '—') },
          { h: 'Aktif', f: (r) => (can && r.doc !== 'AUTO_ORDER' ? `<input type="checkbox" id="ar-act-${r.id}" ${r.active ? 'checked' : ''}>` : r.active ? '✓' : '—') },
          { h: '', f: (r) => (r.doc === 'AUTO_ORDER' ? '<span class="tiny muted">Atur di kartu Order Otomatis ↑</span>' : can ? `<button class="btn sm" data-a="save" data-p="${r.id}">Simpan draft</button>` : '') },
        ],
        list
      )}<p class="tiny muted" style="margin:8px 0 0">Perubahan disimpan sebagai <b>draft revisi</b>; versi aktif tetap berlaku sampai Owner menerbitkan (maker ≠ checker, pola dari referensi Modul B). Dokumen yang sedang berjalan mempertahankan rantai saat diajukan. Tingkat nilai MRF dari Board B; rantai budget dari referensi Modul D. Field APPROVE STATUS / APPROVED BY ada di PR & PO HAWK ${ui.intBadge('TO VERIFY')}.</p></div>
        <div class="card"><div class="card-head"><h3>Simulasi rute approval</h3><span class="r">${ui.intBadge('UI-ONLY SIMULATION')}</span></div>
          <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end">
            <div class="field"><label for="sim-doc">Dokumen</label><select class="inp" id="sim-doc" data-ch="sim">${simDocs.map((d) => `<option ${d === simDoc ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
            <div class="field"><label for="sim-amt">Nilai (Rp)</label><input class="inp" type="number" id="sim-amt" value="${simAmt}" min="0" step="100000"></div>
            ${simDoc === 'MRF' ? `<label class="row tiny" style="gap:6px"><input type="checkbox" id="sim-over" data-ch="sim" ${L.so ? 'checked' : ''}> Melebihi budget item / non-rutin</label>` : ''}
            <button class="btn sm" data-a="sim">Hitung rute</button></div>
          <div style="margin-top:12px">${sim.ok ? `<div class="row" style="gap:6px;flex-wrap:wrap"><span class="badge ok">${sim.rule.id}</span>${chainB(sim.chain)}${sim.post ? ` <span class="badge warn">approval susulan ${esc(HAWK.ROLE_LABEL[sim.post])}</span>` : ''}</div><div class="tiny muted" style="margin-top:6px">${esc(sim.rule.condition)}${sim.exception ? ' · + rantai pengecualian AR-05' : ''} · SLA ${sim.rule.slaHours} jam</div>` : `<div class="empty"><b>Tidak ada rute</b><div class="tiny">${esc(sim.note)}</div></div>`}
          <p class="tiny muted">Evaluasi di browser, bukan oleh approval engine HAWK. Backend wajib mengevaluasi ulang.</p></div></div>
      </div>`;
    },
    actions: {
      save(el, ctx) {
        const id = el.dataset.p;
        const mx = ctx.val('ar-max-' + id);
        ctx.act('approval.updateRule', { id, min: +ctx.val('ar-min-' + id), max: mx === '' ? null : +mx, slaHours: +ctx.val('ar-sla-' + id), active: document.getElementById('ar-act-' + id).checked }, (r) => `Draft revisi ${r.id} tersimpan — menunggu terbit Owner`);
      },
      publish(el, ctx) {
        ctx.act('approval.publishRule', { id: el.dataset.p, decision: 'APPROVE' }, (r) => `${r.id} v${r.version} diterbitkan`);
      },
      discard(el, ctx) {
        ctx.act('approval.publishRule', { id: el.dataset.p, decision: 'REJECT' }, 'Draft revisi dibuang');
      },
      sim(el, ctx) {
        ctx.L.sd = ctx.val('sim-doc');
        ctx.L.sa = Math.max(0, +ctx.val('sim-amt') || 0);
        const o = document.getElementById('sim-over');
        ctx.L.so = !!(o && o.checked);
        ctx.rerender();
      },
    },
  };
})();
