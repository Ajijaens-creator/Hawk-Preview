/* JAENS ERP · Portal HRD · F6 Human Growth & Kinerja — DATA DEMO / SIMULASI.
   NV01 Dashboard HG (hrd-kpi) · NV02 SER (hrd-ser) · NV03 KPI Library (hrd-kpi-lib) · NV04 Kontrak KPI (hrd-kpi-contract) ·
   NV05 XScore (hrd-xscore) · NV06 People Performance & Kompetensi (hrd-people-perf) · NV07 9-Box (hrd-ninebox) ·
   NV08 Rencana Pengembangan & Coaching (hrd-dev) · NV09 Pelatihan, Kesiapan & Talent Pipeline (hrd-training). */
(() => {
const H = window.HL;
const { esc, table, card, qs, link } = H;
const hr = () => { const h = HR.ensure(H.state); HR.EXT.ensure?.(h); return h; };
const f6 = () => hr().f6;
const role = () => H.prefs.role;
const def = () => HR.roleDef(role());
const chip = (t, tone = '') => `<span class="status-chip ${tone}">${esc(t)}</span>`;
const empName = (id) => id ? (hr().people.find(p => p.id === id)?.name || id) : '—';
const pct = (u, d = 1) => u === null || u === undefined || Number.isNaN(u) ? '—' : `${(u * 100).toFixed(d).replace(/\.0$/, '')}%`;
const sc = (x) => x === null || x === undefined ? '—' : x.toFixed(1).replace(/\.0$/, '');
const tabs = (route, cur, list, params = {}, key = 'tab') => `<nav class="tabs" aria-label="Bagian">${list.map(([k, l]) => `<a class="tab${k === cur ? ' on' : ''}" href="#${route}${qs({ ...params, [key]: k })}" ${k === cur ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
const denied = (why) => `<section class="card hr-denied" role="alert"><h2>Akses ditolak</h2><p>${why}</p><div class="actions"><button type="button" class="btn" data-hr-role="hrd">Ganti ke Manager HRD</button><button type="button" class="btn ghost" data-hr-role="hg-lead">Ganti ke Human Growth Lead</button></div></section>`;
const register = (id, fn, title) => { H.REGISTRY[id] = fn; fn.title = title; };
const KC = ['g-teal', 'g-violet', 'g-blue', 'g-gold'];
const kpiLinks = (es) => `<section class="grid g4 keep2 kpis">${es.map(([l, v, h, sub], i) => `<a class="kpi ${KC[i % 4]}" href="${h}"><div class="lbl">${l}</div><div class="val">${v}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</a>`).join('')}</section>`;
const HG_ROLES = ['owner', 'hrd', 'hrd-ops', 'hg-lead', 'ops-manager', 'outlet-spv', 'therapist'];
const guard = (fn, roles = HG_ROLES) => (p) => roles.includes(role()) ? fn(p) : denied(`Role demo <b>${esc(def().label)}</b> tidak punya akses Human Growth & Kinerja. Tidak ada skor yang dimuat.`);
const self = () => role() === 'therapist' ? hr().roleEmp.therapist : null;
const outlets = () => role() === 'outlet-spv' ? HR.OUTLETS.filter(o => o.id === 'OUT-UBD') : HR.OUTLETS;
const period = (p) => p.p === '2611' ? '2611' : '2610';
const demo = (p) => `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} ${esc(HR6.PERIODS[period(p)])} · ${link(H.parseHash().id + qs({ ...p, p: period(p) === '2610' ? '2611' : '2610' }), period(p) === '2610' ? 'lihat November (provisional)' : 'lihat Oktober (ditutup)')} · formula XScore: simulasi (bobot demo 50/30/20, formula resmi AJi Creator OS belum terverifikasi)</p>`;
const xChip = (x) => !x ? '—' : chip(x.status, x.status === 'Final' ? 'ready' : x.status === 'Belum ada data' ? '' : 'sandbox');
const boxChip = (n) => chip(n.label, n.box === 'H-H' ? 'ready' : !n.box ? 'sandbox' : /L-L|L-M/.test(n.box) ? 'bad' : 'planned');
const scoped = (outlet) => HR6.therapists(hr(), outlet).filter(p => HR6.canSee(hr(), role(), p.id) && outlets().some(o => o.id === p.placement.location));
const filters = (params, extra = '') => `<form id="filters" class="filters" aria-label="Filter Human Growth"><input type="hidden" name="p" value="${period(params)}"><label>Outlet<select name="outlet">${role() === 'outlet-spv' ? '' : '<option value="">Semua outlet</option>'}${outlets().map(o => `<option value="${o.id}" ${o.id === params.outlet ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label><label>Posisi<select name="position"><option value="POS-THR">Therapist</option></select></label>${extra}<button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>`;

/* ---------- NV01 Dashboard Human Growth ---------- */
function dashboard(params) {
  if (self()) return xscorePage({ emp: self(), p: params.p });
  const P = period(params), h = hr(), o = role() === 'outlet-spv' ? 'OUT-UBD' : params.outlet || '';
  const list = scoped(o || undefined), avg = HR6.avgX(h, list, P);
  const team = (o ? [o] : outlets().map(x => x.id)).map(id => ({ id, ...HR6.teamScore(h, id, P) }));
  const tot = P === '2610' ? (() => { const m = { 'OUT-UBD': 5512, 'OUT-SHT': 3432, 'OUT-TRL': 4368, 'OUT-BSM': 4056 }; const ids = team.map(t => t.id); const d = ids.reduce((s, i) => s + m[i], 0), c = ids.length * 5200; return d / c; })() : (() => { const ids = team.map(t => t.id); const xs = ids.map(i => HR5.outletUtil(h, i)); return xs.reduce((s, x) => s + x.done, 0) / xs.reduce((s, x) => s + x.cap, 0); })();
  const te = HR6.trainingEff(h), rd = HR6.readiness(h), q = HR6.qoh(h);
  const sp = { p: P, outlet: o };
  const rows = team.map(t => { const ls = scoped(t.id), a = HR6.avgX(h, ls, P); return [link('hrd-people-perf' + qs({ outlet: t.id, p: P }), HR.locName(t.id)), pct(t.actual), '85%', pct(t.ach), HR6.personalOk(role()) ? link('hrd-xscore' + qs({ outlet: t.id, p: P }), sc(a.avg)) : '<i>khusus ringkasan</i>', `${a.full}/${a.of}`, link('hrd-ninebox' + qs({ outlet: t.id, p: P }), '9-Box')]; });
  return demo(params) + filters({ ...params, outlet: o }) +
    kpiLinks([['Skor tim vs target bersama', pct(Math.min(1, tot / 0.85)), '#hrd-people-perf' + qs(sp), `utility ${pct(tot)} terhadap 85% (total ÷ total)`], ['Rata-rata XScore personal', HR6.personalOk(role()) ? sc(avg.avg) : '—', '#hrd-xscore' + qs(sp), HR6.personalOk(role()) ? `${avg.n} dari ${avg.of} therapist punya skor` : 'Owner melihat hasil organisasi'], ['Cakupan bukti lengkap', pct(avg.of ? avg.full / avg.of : null, 0), '#hrd-xscore' + qs({ ...sp, cov: 'partial' }), `${avg.of - avg.full} scorecard bukti belum lengkap`], ['Efektivitas pelatihan', pct(te.rate, 0), '#hrd-training' + qs({ tab: 'eff' }), `cakupan verifikasi ${pct(te.coverage, 0)}`]]) +
    kpiLinks([['Talent readiness', pct(rd.rate, 0), '#hrd-training' + qs({ tab: 'pipe' }), `${rd.ready}/${rd.roles} peran kunci punya suksesor siap`], ['Quality of Hire', pct(q.rate, 0), '#hrd-training' + qs({ tab: 'qoh' }), `${q.reviewed} dinilai · ${q.pending} review tertunda`], ['Ekspektasi SER', '15', '#hrd-ser', 'Executive · Collaboration · HG'], ['Rencana pengembangan', f6().plans.length, '#hrd-dev', 'terhubung Workplan F3']]) +
    card('Performa tim per outlet', table(['Outlet', 'Utility tim', 'Target', 'Skor tim', 'Rata-rata XScore', 'Bukti lengkap', 'Talenta'], rows) + '<p class="muted small">Skor tim dihitung dari total pembilang ÷ total penyebut terhadap target bersama. Rata-rata XScore personal ditampilkan terpisah dan tidak dipakai sebagai skor tim.</p>');
}

/* ---------- NV02 SER ---------- */
function ser(params) {
  if (self()) return denied('Therapist melihat scorecard sendiri di XScore.');
  const mgr = role() === 'hrd';
  const groups = [...new Set(HR6.SER.map(s => s.group))];
  const val = (v, u) => v === null ? '<i>Belum terverifikasi</i>' : u === 'Rp' ? H.rp(v) : u === '%' ? `${v}%` : `${v} ${u}`;
  const sel = params.id && HR6.SER.find(s => s.id === params.id);
  const detail = sel ? (sel.restricted && !mgr ? denied('Rasio biaya tenaga kerja hanya untuk Manager HRD.') : card(`${sel.id} · ${esc(sel.name)}`, table(['Field', 'Nilai'], [['Kelompok', esc(sel.group)], ['Satuan', sel.unit], ['Target', val(sel.target, sel.unit)], ['Realisasi', val(sel.actual, sel.unit)], ['Arah target', sel.dir === 'max' ? 'Maksimum (lebih rendah lebih baik)' : sel.dir === 'tbc' ? chip('Perlu konfirmasi', 'sandbox') : 'Minimum'], ['Capaian', sel.actual === null ? chip('Belum terverifikasi', 'sandbox') : pct(HR6.ach(sel.actual, sel.target, sel.dir === 'max' ? 'max' : 'min'))], ['Sumber', esc(sel.source)], ['Periode', 'Oktober 2026'], ['Metrik KPI Library', link('hrd-kpi-lib' + qs({ id: sel.metric }), sel.metric)], ['Tindak lanjut', sel.actual === null ? 'Lengkapi sumber data / definisi' : HR6.ach(sel.actual, sel.target, sel.dir === 'max' ? 'max' : 'min') < 1 ? 'Gap terhadap target: buka Workplan' : 'Pertahankan']]) +
    (sel.actual !== null && HR6.ach(sel.actual, sel.target, sel.dir === 'max' ? 'max' : 'min') < 1 && ['hrd', 'hrd-ops', 'hg-lead'].includes(role()) ? `<button type="button" class="btn sm" data-action="hr:task-create" data-ws="HG" data-stage="Issue" data-title="Gap SER ${esc(sel.name)}" data-source-id="SER-${sel.id}" data-source-type="SER" data-source-label="${esc(sel.name)} · Okt 2026" data-source-route="hrd-ser?id=${sel.id}" data-finding="FND-${sel.id}" data-after="hrd-task?id={id}">Tandai gap sebagai Issue</button>` : ''))) : '';
  return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} Stakeholder Expectations (workbook 1.1. SER) · Oktober 2026 · realisasi simulasi</p>` + detail +
    groups.map(g => card(g, table(['ID', 'Ekspektasi', 'Satuan', 'Target', 'Realisasi', 'Capaian', 'Sumber'], HR6.SER.filter(s => s.group === g).map(s => s.restricted && !mgr ? [s.id, esc(s.name), s.unit, '<i>Akses Manager HRD</i>', '<i>Akses Manager HRD</i>', '—', esc(s.source)] : [link('hrd-ser' + qs({ id: s.id }), s.id), link('hrd-ser' + qs({ id: s.id }), s.name), s.unit, val(s.target, s.unit), val(s.actual, s.unit), s.actual === null ? chip('Belum terverifikasi', 'sandbox') : pct(HR6.ach(s.actual, s.target, s.dir === 'max' ? 'max' : 'min')), esc(s.source)])))).join('') +
    '<p class="muted small">Revenue per Employee memakai rupiah. Absenteeism: target SER dan Race Vegen berbeda; definisi, arah dan denominator perlu konfirmasi.</p>';
}

/* ---------- NV03 KPI Library ---------- */
function library(params) {
  if (self()) return denied('Therapist melihat definisi KPI dari scorecard sendiri.');
  const ms = f6().metrics, m = params.id && ms.find(x => x.id === params.id);
  const canEdit = ['hrd', 'hg-lead'].includes(role());
  const used = (id) => f6().contracts.filter(c => c.items.some(i => i.metric === id)).map(c => ({ c, v: c.items.find(i => i.metric === id).version }));
  const detail = m ? card(`${m.id} · ${esc(m.name)} · v${HR6.curVersion(m).v}`, table(['Field', 'Nilai'], [['Fungsi', esc(m.fn)], ['Satuan', m.unit], ['Arah target', m.dir === 'max' ? 'Maksimum' : m.dir === 'tbc' ? chip('Perlu konfirmasi', 'sandbox') : 'Minimum'], ['Rumus (versi berlaku)', esc(HR6.curVersion(m).formula)], ['Target acuan', HR6.curVersion(m).target ?? '—'], ['Frekuensi', m.freq], ['Sumber', esc(m.source)]]) +
    card('Riwayat versi', table(['Versi', 'Rumus', 'Target', 'Waktu', 'Oleh', 'Alasan'], m.versions.map(v => [`v${v.v}`, esc(v.formula), v.target ?? '—', v.at, esc(v.by), esc(v.note)]))) +
    card('Dipakai oleh kontrak', used(m.id).length ? table(['Kontrak', 'Status', 'Versi dirujuk'], used(m.id).map(({ c, v }) => [link('hrd-kpi-contract' + qs({ id: c.id }), c.id), c.status, `v${v}${v !== HR6.curVersion(m).v ? ' (versi awal tetap)' : ''}`])) : '<p>Belum dipakai kontrak.</p>') +
    (m.id === 'MET-UTIL' ? `<p>Contoh perhitungan: Spa Ubud Oktober 5512 jam ÷ 5200 jam = 106% → ${link('hrd-mp-utility' + qs({ outlet: 'OUT-UBD', p: '2610' }), 'bukti F5')}</p>` : '') +
    (canEdit ? `<form class="workflow-form" data-submit="hr:kpi-version" data-after="hrd-kpi-lib?id=${m.id}"><input type="hidden" name="id" value="${m.id}"><label>Rumus baru<input name="formula" value="${esc(HR6.curVersion(m).formula)}"></label><label>Target<input name="target" value="${esc(HR6.curVersion(m).target ?? '')}"></label><label>Alasan perubahan<input name="note" placeholder="mis. kapasitas memakai jam bookable"></label><button class="btn">Simpan sebagai versi baru</button></form><p class="muted small">Kontrak aktif dan snapshot lama tetap merujuk versi awal.</p>` : '')) : '';
  return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} ${ms.length} definisi KPI berversi</p>` + detail +
    card('KPI Library', table(['Metric ID', 'Nama', 'Fungsi', 'Satuan', 'Arah', 'Frekuensi', 'Sumber', 'Versi'], ms.map(x => [link('hrd-kpi-lib' + qs({ id: x.id }), x.id), esc(x.name), esc(x.fn), x.unit, x.dir === 'max' ? 'Maks' : x.dir === 'tbc' ? 'Konfirmasi' : 'Min', x.freq, esc(x.source), `v${HR6.curVersion(x).v}`])));
}

/* ---------- NV04 Kontrak KPI & Review Periode ---------- */
function contracts(params) {
  if (self()) return denied('Therapist melihat kontrak sendiri di XScore.');
  const cs = f6().contracts, c = params.id && cs.find(x => x.id === params.id), canEdit = ['owner', 'hrd', 'hg-lead'].includes(role());
  const ws = (x) => HR6.weightSum(x);
  let detail = '';
  if (c) {
    const sum = ws(c);
    const items = table(['Metrik', 'Versi', 'Target', 'Bobot'], c.items.map(i => [link('hrd-kpi-lib' + qs({ id: i.metric }), `${i.metric} · ${esc(HR6.metricOf(hr(), i.metric)?.name || '')}`), `v${i.version}`, esc(i.target), c.status === 'Draf' && canEdit ? `<form class="inline-form" data-submit="hr:ctr-weight" data-after="hrd-kpi-contract?id=${c.id}"><input type="hidden" name="id" value="${c.id}"><input type="hidden" name="metric" value="${i.metric}"><input type="number" name="weight" min="0" max="100" value="${i.weight}" aria-label="Bobot ${i.metric}" style="width:5em"> <button class="btn ghost sm">Simpan</button></form>` : `${i.weight}%`]));
    const corr = f6().corrections.filter(k => k.contract === c.id);
    detail = card(`${c.id} · ${esc(c.name)}`, `<p>${chip(c.status, c.status === 'Aktif' ? 'ready' : c.status === 'Ditutup' ? 'planned' : 'sandbox')} · ${c.kind} · cakupan ${esc(c.scope === 'POS-THR' ? 'Therapist semua outlet' : c.scope === 'POS-RCP' ? 'Receptionist' : HR.locName(c.scope))} · total bobot <b class="${sum === 100 ? '' : 'bad'}">${sum}%</b>${sum === 100 ? '' : ' · ' + chip('Draf — perlu tepat 100%', 'bad')}</p>` + items +
      (c.status === 'Draf' && canEdit ? `<form class="workflow-form" data-submit="hr:ctr-add" data-after="hrd-kpi-contract?id=${c.id}"><input type="hidden" name="id" value="${c.id}"><label>Tambah metrik<select name="metric">${f6().metrics.filter(m => !c.items.some(i => i.metric === m.id)).map(m => `<option value="${m.id}">${m.id} · ${esc(m.name)}</option>`).join('')}</select></label><label>Bobot<input type="number" name="weight" value="10" min="0" max="100"></label><button class="btn ghost">Tambah</button></form>` : '') +
      `<div class="actions">${c.status === 'Draf' && canEdit ? `<button type="button" class="btn" data-action="hr:ctr-submit" data-id="${c.id}">Ajukan persetujuan</button>` : ''}${c.status === 'Menunggu Persetujuan' && ['hrd', 'owner'].includes(role()) ? `<button type="button" class="btn" data-action="hr:ctr-activate" data-id="${c.id}">Setujui & aktifkan</button>` : ''}${c.status === 'Aktif' && ['hrd', 'owner'].includes(role()) ? `<form class="inline-form" data-submit="hr:ctr-close" data-after="hrd-kpi-contract?id=${c.id}"><input type="hidden" name="id" value="${c.id}"><label class="check"><input type="checkbox" name="ack" value="1"> Tutup dengan catatan bukti belum lengkap</label> <button class="btn">Tutup periode</button></form>` : ''}</div>` +
      (c.snapshot ? card('Snapshot penutupan', table(['Field', 'Nilai'], [['Waktu', `${c.snapshot.at} · ${esc(c.snapshot.by)}`], ['Versi metrik', Object.entries(c.snapshot.versions).map(([k, v]) => `${k} v${v}`).join(', ')], ['Cakupan', esc(c.snapshot.coverageNote)], ['Bukti', esc(c.snapshot.evidence)], ['Nilai tersimpan', c.snapshot.values ? `${Object.keys(c.snapshot.values).length} scorecard` : 'Snapshot seed (nilai dari XScore Oktober)']])) : '') +
      card(`Koreksi setelah penutupan · ${corr.length}`, corr.length ? table(['Koreksi', 'Karyawan', 'Metrik', 'Nilai', 'Alasan', 'Status', 'Aksi'], corr.map(k => [k.id, link('hrd-xscore' + qs({ emp: k.emp, p: k.period }), esc(empName(k.emp))), k.metric, k.value ?? '—', esc(k.reason), chip(k.status, k.status === 'Diterima' ? 'ready' : k.status === 'Ditolak' ? 'bad' : 'sandbox'), k.status === 'Menunggu Review' && ['hrd', 'hg-lead'].includes(role()) ? `<button type="button" class="btn sm" data-action="hr:ctr-correct-review" data-id="${k.id}">Terima</button> <button type="button" class="btn ghost sm" data-action="hr:ctr-correct-review" data-id="${k.id}" data-decision="reject">Tolak</button>` : '—'])) : '<p>Belum ada koreksi.</p>') +
      card('Riwayat', table(['Waktu', 'Peristiwa'], c.history.map(([a, b]) => [a, esc(b)]))));
  }
  return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} Kontrak: Draf → Menunggu Persetujuan → Aktif → Ditutup. Berbobot harus tepat 100% sebelum aktivasi.</p>` + detail +
    card('Kontrak KPI', table(['Contract ID', 'Nama', 'Jenis', 'Periode', 'Bobot', 'Status'], cs.map(x => [link('hrd-kpi-contract' + qs({ id: x.id }), x.id), esc(x.name), x.kind, x.period, ws(x) === 100 ? '100%' : chip(`${ws(x)}%`, 'bad'), chip(x.status, x.status === 'Aktif' ? 'ready' : x.status === 'Ditutup' ? 'planned' : 'sandbox')])));
}

/* ---------- NV05 XScore ---------- */
function xscorePage(params) {
  const P = period(params), h = hr();
  if (params.emp || self()) {
    const emp = self() || params.emp;
    if (!HR6.canSee(h, role(), emp)) return denied('Scorecard di luar cakupan tim atau penugasan Anda.');
    if (!HR6.personalOk(role())) return denied('Owner melihat hasil organisasi, bukan skor personal.');
    const x = HR6.xscore(h, emp, P); if (!x) return card('Belum ada scorecard', '<p>XScore demo tersedia untuk Therapist.</p>');
    const pl = HR.placementOn(h, emp) || HR.upcomingOf(h, emp);
    const ctr = x.contract ? f6().contracts.find(c => c.id === x.contract) : null;
    const closed = ctr?.status === 'Ditutup';
    return (self() ? tabs('hrd-xscore', P, [['2610', 'Oktober'], ['2611', 'November']], {}, 'p') : demo({ ...params, emp })) +
      card(`XScore · ${esc(empName(emp))} · ${emp}`, `<p>${esc(HR.locName(pl.location))} · ${esc(HR.pos(pl.position).name)} · ${xChip(x)} · kontrak ${x.contract ? link('hrd-kpi-contract' + qs({ id: x.contract }), x.contract) : '—'} · cakupan bobot terukur <b>${x.coverage}%</b></p><p class="kpi-big"><b>${x.score === null ? 'Belum ada data' : sc(x.score) + ' / 100'}</b>${x.coverage < 100 && x.score !== null ? ' <span class="muted small">(dari bobot terukur saja)</span>' : ''}</p>` +
        table(['Komponen', 'Target', 'Aktual', 'Status data', 'Capaian', 'Bobot', 'Kontribusi', 'Bukti'], x.comps.map(c => [esc(c.label), c.tgt, c.shown === null ? '<i>kosong</i>' : esc(c.shown), chip(c.status, c.status === 'Belum terverifikasi' ? 'sandbox' : c.status === 'Nol terverifikasi' ? 'planned' : 'ready'), c.ach === null ? '—' : pct(c.ach), `${c.weight}%`, c.contrib === null ? '—' : sc(c.contrib), c.actual === null ? '—' : c.metric === 'MET-UTIL' ? link('hrd-mp-pos' + qs({ emp, outlet: pl.location }), c.ev) : c.metric === 'MET-LEARN' ? link('hrd-training' + qs({ emp }), c.ev) : esc(c.ev)])) +
        `<p class="muted small">Capaian dibatasi 100%. Nol terverifikasi dihitung (capaian 0), nilai kosong tidak dihitung dan menurunkan cakupan. ${x.coverage < 100 ? 'Bukti belum lengkap: perlu review sebelum finalisasi.' : ''} Formula demo: simulasi.</p>`) +
      (x.corrections.length ? card('Koreksi', table(['Koreksi', 'Metrik', 'Status', 'Reviewer'], x.corrections.map(k => [k.id, k.metric, k.status, esc(k.reviewer || '—')]))) : '') +
      (closed && role() !== 'finance-manager' ? card('Ajukan koreksi bukti (setelah penutupan)', `<form class="workflow-form" data-submit="hr:ctr-correct" data-after="hrd-xscore?emp=${emp}&p=${P}"><input type="hidden" name="id" value="${x.contract}"><input type="hidden" name="emp" value="${emp}"><label>Metrik<select name="metric"><option value="MET-LEARN">Learning</option><option value="MET-PROD">Produktivitas</option></select></label><label>Nilai benar<input type="number" name="value" min="0" step="0.5"></label><label>Alasan<input name="reason" placeholder="mis. jam pelatihan 12 Okt belum tercatat"></label><button class="btn ghost">Ajukan koreksi</button></form>`) : '') +
      (self() ? '' : `<p>${link('hrd-people-perf' + qs({ emp }), 'Profil kompetensi')} · ${link('hrd-ninebox' + qs({ emp }), 'Posisi 9-Box')} · ${link('hrd-dev' + qs({ emp }), 'Rencana pengembangan')}</p>`);
  }
  if (!HR6.personalOk(role())) return denied('Owner melihat hasil organisasi di Dashboard Human Growth, bukan skor personal.');
  const o = role() === 'outlet-spv' ? 'OUT-UBD' : params.outlet || '';
  let list = scoped(o || undefined).map(p => ({ p, x: HR6.xscore(h, p.id, P) }));
  if (params.cov === 'partial') list = list.filter(r => r.x.coverage < 100);
  return demo(params) + filters({ ...params, outlet: o }, `<label>Cakupan<select name="cov"><option value="">Semua</option><option value="partial" ${params.cov === 'partial' ? 'selected' : ''}>Bukti belum lengkap</option></select></label>`) +
    card(`XScore personal · ${list.length} therapist`, list.length ? table(['Therapist', 'Outlet', 'Utility', 'Produktivitas', 'Learning', 'Cakupan', 'XScore', 'Status'], list.map(({ p, x }) => [link('hrd-xscore' + qs({ emp: p.id, p: P }), `${esc(p.name)} · ${p.id}`), esc(HR.locName(p.placement.location)), x.comps[0].shown || '<i>kosong</i>', x.comps[1].shown || '<i>kosong</i>', x.comps[2].shown === null ? '<i>kosong</i>' : x.comps[2].status === 'Nol terverifikasi' ? '0 jam (nol terverifikasi)' : x.comps[2].shown, `${x.coverage}%`, sc(x.score), xChip(x)])) : '<p>Tidak ada scorecard untuk filter ini.</p>');
}

/* ---------- NV06 People Performance & Profil Kompetensi ---------- */
function people(params) {
  if (self()) return profile(self(), params);
  if (params.emp) return HR6.canSee(hr(), role(), params.emp) ? profile(params.emp, params) : denied('Profil di luar cakupan tim atau penugasan Anda.');
  const P = period(params), h = hr();
  if (!params.outlet && role() !== 'outlet-spv') {
    const rows = HR.DIVISIONS.filter(d => HR.people(h, 'hrd', { division: d.id }).length).map(d => [esc(d.name), HR.people(h, 'hrd', { division: d.id }).length, d.id === 'DIV-OPS' ? outlets().map(o => link('hrd-people-perf' + qs({ outlet: o.id, p: P }), o.name)).join(' · ') : '<i>KPI fungsi: ' + esc({ 'DIV-FA': 'closing & rekonsiliasi', 'DIV-MKT': 'konversi & revenue teratribusi', 'DIV-HRD': 'turnover, QoH, efektivitas pelatihan', 'DIV-PRD': 'output diterima & ketepatan', 'DIV-PC': 'belum ditetapkan', 'DIV-COM': 'belum ditetapkan' }[d.id] || '—') + '</i>']);
    return demo(params) + card('Telusuri divisi → outlet → individu', table(['Divisi', 'Orang', 'Telusuri'], rows));
  }
  const o = role() === 'outlet-spv' ? 'OUT-UBD' : params.outlet;
  const list = scoped(o), t = HR6.teamScore(h, o, P), a = HR6.avgX(h, list, P);
  return demo(params) + filters({ ...params, outlet: o }) + card(`${esc(HR.locName(o))} · Therapist`, `<p>Skor tim: utility ${pct(t.actual)} vs 85% → <b>${pct(t.ach)}</b> · Rata-rata XScore ${HR6.personalOk(role()) ? sc(a.avg) : '—'} (${a.n}/${a.of}) · sumber: ${esc(t.source)}</p>` +
    table(['Therapist', 'Masuk', 'XScore', '9-Box', 'Kompetensi terendah'], list.map(p => { const x = HR6.xscore(h, p.id, P), n = HR6.nineOf(h, p.id), low = HR6.competencies(h, p.id).sort((a2, b) => a2.level - b.level)[0]; return [link('hrd-people-perf' + qs({ emp: p.id }), `${esc(p.name)} · ${p.id}`), p.joined, HR6.personalOk(role()) ? sc(x.score) : '—', boxChip(n), low ? `${esc(low.name)} · ${HR6.LEVELS[low.level]}` : '—']; })));
}
function profile(emp, params) {
  const h = hr(), p = h.people.find(x => x.id === emp); if (!p) return card('Tidak ditemukan', `<p>${esc(emp)} tidak ada.</p>`);
  const pl = HR.placementOn(h, emp) || HR.upcomingOf(h, emp), cs = HR6.competencies(h, emp), plans = f6().plans.filter(x => x.emp === emp);
  const hist = h.placements.filter(x => x.emp === emp).sort((a, b) => a.from.localeCompare(b.from));
  const coachOk = ['hrd', 'hg-lead'].includes(role()) || role() === 'outlet-spv';
  const x = HR6.xscore(h, emp);
  return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} Profil memakai Employee ID F2 · ${link('hrd-roster' + qs({ emp }), 'buka di Direktori')}</p>` +
    card(`${esc(p.name)} · ${emp}`, table(['Field', 'Nilai'], [['Posisi · outlet', `${esc(HR.pos(pl.position).name)} · ${esc(HR.locName(pl.location))}`], ['Masuk', p.joined], ['Pengalaman', `${2026 - Number(p.joined.slice(0, 4))} tahun di Jaens · pendidikan ${esc(p.education)}`], ['Aspirasi', ['Senior Therapist', 'Trainer teknik', 'Supervisor outlet', 'Spesialis hot stone'][Number(emp.slice(4)) % 4] + ' (dari sesi coaching, simulasi)'], ['Hasil kerja Okt', x && HR6.personalOk(role()) ? `${link('hrd-xscore' + qs({ emp }), `XScore ${sc(x.score)}`)} · ${x.status}` : '—'], ['9-Box', link('hrd-ninebox' + qs({ emp }), HR6.nineOf(h, emp).label)]])) +
    card('Kompetensi', cs.length ? table(['Kompetensi', 'Level', 'Riwayat (periode · level · outlet saat itu · bukti)', 'Aksi'], cs.map(c => [esc(c.name), `${c.level} · ${HR6.LEVELS[c.level]}`, c.history.map(e => `${e.period} · ${e.level} · ${esc(HR.locName(e.outlet))} · ${e.ev?.startsWith('EVD-PRC') ? link('hrd-training' + qs({ emp }), e.ev) : esc(e.ev)}`).join('<br>') || '<i>belum ada asesmen</i>', c.level < 3 && ['hrd', 'hrd-ops', 'hg-lead', 'outlet-spv'].includes(role()) ? `<button type="button" class="btn ghost sm" data-action="hr:plan-create" data-emp="${emp}" data-comp="${c.id}" data-from="profil" data-after="hrd-dev?id={id}">Buat Workplan coaching</button>` : '—'])) + '<p class="muted small">Perpindahan outlet tidak menghapus histori kompetensi; outlet saat asesmen tetap tercatat.</p>' : '<p>Kompetensi teknis belum dipetakan untuk posisi ini.</p>') +
    card('Coaching & rencana', plans.length ? table(['Plan ID', 'Kompetensi', 'Target', 'Mentor', 'Workplan', 'Bukti coaching'], plans.map(pp => [link('hrd-dev' + qs({ id: pp.id }), pp.id), esc(HR6.COMPS.find(c => c[0] === pp.comp)?.[1] || pp.comp), `${pp.from} → ${pp.target}`, esc(empName(pp.mentor)), link('hrd-task' + qs({ id: pp.task }), pp.task), coachOk ? pp.evidence.map(e => `${e.id}: ${esc(e.note)}`).join('<br>') || '—' : `${pp.evidence.length} catatan (akses terbatas)`])) : '<p>Belum ada rencana pengembangan.</p>') +
    card('Histori penempatan', table(['Dari', 'Sampai', 'Outlet', 'Posisi', 'Alasan'], hist.map(x2 => [x2.from, x2.to || 'sekarang', esc(HR.locName(x2.location)), esc(HR.pos(x2.position).name), esc(x2.reason || '—')])));
}

/* ---------- NV07 9-Box ---------- */
function ninebox(params) {
  if (self()) return denied('Therapist tidak melihat matriks 9-Box.');
  if (!HR6.personalOk(role()) && params.emp) return denied('Owner melihat distribusi organisasi, bukan posisi personal.');
  const P = '2610', h = hr(), o = role() === 'outlet-spv' ? 'OUT-UBD' : params.outlet || '';
  const list = scoped(o || undefined).map(p => ({ p, n: HR6.nineOf(h, p.id, P) }));
  if (params.emp) {
    const n = HR6.nineOf(h, params.emp, P); if (!HR6.canSee(h, role(), params.emp)) return denied('Di luar cakupan.');
    const canMove = ['hrd', 'hg-lead', 'outlet-spv'].includes(role());
    return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} 9-Box Oktober 2026 · ${link('hrd-ninebox' + qs({ outlet: o }), 'kembali ke matriks')}</p>` +
      card(`${esc(empName(params.emp))} · ${params.emp}`, table(['Field', 'Nilai'], [['Kotak', boxChip(n)], ['Alasan', esc(n.why)], ['XScore (performa)', `${sc(n.score)} · cakupan ${n.coverage}%`], ['Potensi', n.potential ? `${n.potential} (asesmen HG)` : chip('Belum diasesmen', 'sandbox')], ['Validasi', `Supervisor ${n.validated.spv ? '✓' : '—'} · Human Growth ${n.validated.hg ? '✓' : '—'} · ${n.final ? chip('Final', 'ready') : chip('Menunggu validasi', 'sandbox')}`]]) +
        (n.box && ['hg-lead', 'outlet-spv'].includes(role()) && !(role() === 'hg-lead' ? n.validated.hg : n.validated.spv) ? `<button type="button" class="btn" data-action="hr:nine-validate" data-emp="${params.emp}">Validasi sebagai ${esc(def().label)}</button>` : '') +
        (canMove ? `<form class="workflow-form" data-submit="hr:nine-move" data-after="hrd-ninebox?emp=${params.emp}"><input type="hidden" name="emp" value="${params.emp}"><label>Pindah ke<select name="box">${Object.entries(HR6.NINE).map(([k, v]) => `<option value="${k}" ${k === n.box ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label>Alasan<input name="reason" placeholder="bukti dan pertimbangan reviewer"></label><button class="btn ghost">Pindahkan</button></form>` : '') +
        (n.box && ['L-L', 'L-M', 'M-H', 'L-H'].includes(n.box) && ['hrd', 'hrd-ops', 'hg-lead', 'outlet-spv'].includes(role()) ? `<button type="button" class="btn ghost sm" data-action="hr:plan-create" data-emp="${params.emp}" data-comp="COMP-HOT" data-from="ninebox" data-after="hrd-dev?id={id}">Buat Workplan pengembangan</button>` : '')) +
      card('Histori perpindahan', n.moves.length ? table(['Waktu', 'Dari', 'Ke', 'Alasan', 'Reviewer'], n.moves.map(m => [m.at, esc(HR6.NINE[m.from] || 'Belum Dinilai'), esc(HR6.NINE[m.box]), esc(m.reason), esc(m.by)])) : '<p>Belum ada perpindahan manual.</p>') + `<p>${link('hrd-xscore' + qs({ emp: params.emp }), 'Bukti XScore')} · ${link('hrd-people-perf' + qs({ emp: params.emp }), 'Profil kompetensi')}</p>`;
  }
  const cell = (k) => { const ns = list.filter(r => r.n.box === k); return `<a class="nine-cell${params.box === k ? ' on' : ''}" href="#hrd-ninebox${qs({ outlet: o, box: k })}"><b>${HR6.NINE[k]}</b><span>${ns.length}</span></a>`; };
  const grid = `<div class="nine-grid" role="grid" aria-label="Matriks performa × potensi"><div class="nine-axis y">Potensi ↑</div>${['H', 'M', 'L'].map(pot => ['L', 'M', 'H'].map(perf => cell(`${perf}-${pot}`)).join('')).join('')}<div class="nine-axis x">Performa →</div></div>`;
  const un = list.filter(r => !r.n.box);
  const sel = params.box === 'none' ? un : params.box ? list.filter(r => r.n.box === params.box) : [];
  return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} 9-Box Oktober 2026 · performa dari XScore final, potensi dari asesmen HG · hasil akhir divalidasi Supervisor & HG</p>` + filters({ ...params, outlet: o }) +
    card(`Matriks · ${list.length} therapist`, grid + `<p><a class="btn ghost sm" href="#hrd-ninebox${qs({ outlet: o, box: 'none' })}">Belum Dinilai · ${un.length}</a></p>`) +
    (sel.length || params.box ? card(params.box === 'none' ? 'Belum Dinilai' : HR6.NINE[params.box], sel.length ? table(['Therapist', 'Outlet', 'XScore', 'Alasan', 'Validasi'], sel.map(({ p, n }) => [HR6.personalOk(role()) ? link('hrd-ninebox' + qs({ emp: p.id }), `${esc(p.name)} · ${p.id}`) : esc(p.id), esc(HR.locName(p.placement.location)), HR6.personalOk(role()) ? sc(n.score) : '—', esc(n.why), n.final ? chip('Final', 'ready') : chip('Menunggu', 'sandbox')])) : '<p>Kotak ini kosong.</p>') : '');
}

/* ---------- NV08 Rencana Pengembangan & Coaching ---------- */
function dev(params) {
  if (self()) return denied('Therapist melihat rencana sendiri dari profil.');
  const h = hr(), plans = f6().plans.filter(p => HR6.canSee(h, role(), p.emp) && (!params.emp || p.emp === params.emp));
  const pl = params.id && f6().plans.find(p => p.id === params.id);
  const canWrite = ['hrd', 'hg-lead', 'outlet-spv'].includes(role());
  const detail = pl ? (HR6.canSee(h, role(), pl.emp) ? card(`${pl.id} · ${esc(empName(pl.emp))}`, table(['Field', 'Nilai'], [['Gap kompetensi', `${esc(HR6.COMPS.find(c => c[0] === pl.comp)?.[1] || pl.comp)}: level ${pl.from} → ${pl.target}`], ['Aktivitas', esc(pl.activity)], ['Mentor / PIC', esc(empName(pl.mentor))], ['Tanggal review', pl.due], ['Workplan F3', link('hrd-task' + qs({ id: pl.task }), pl.task)], ['Sumber', pl.source === 'ninebox' ? '9-Box' : 'Profil kompetensi'], ['Status', pl.status]]) +
    card('Bukti coaching', (pl.evidence.length ? table(['Bukti', 'Catatan', 'Oleh', 'Waktu'], pl.evidence.map(e => [e.id, e.sensitive && !['hrd', 'hg-lead'].includes(role()) ? '<i>terbatas</i>' : esc(e.note), esc(e.by), e.at])) : '<p>Belum ada bukti.</p>') + (canWrite ? `<form class="workflow-form" data-submit="hr:plan-evidence" data-after="hrd-dev?id=${pl.id}"><input type="hidden" name="id" value="${pl.id}"><label>Catatan coaching<input name="note" placeholder="mis. praktik hot stone 60 menit, suhu batu sesuai SOP"></label><label class="check"><input type="checkbox" name="sensitive" value="1"> Catatan sensitif (HG saja)</label><button class="btn ghost">Simpan bukti</button></form>` : '')) + `<p>${link('hrd-people-perf' + qs({ emp: pl.emp }), 'Profil')} · ${link('hrd-ninebox' + qs({ emp: pl.emp }), '9-Box')}</p>`) : denied('Rencana di luar cakupan.')) : '';
  const gaps = scoped(role() === 'outlet-spv' ? 'OUT-UBD' : 'OUT-UBD').flatMap(p => HR6.competencies(h, p.id).filter(c => c.level < 2).map(c => ({ p, c }))).slice(0, 8);
  return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} Rencana menautkan gap kompetensi, mentor, aktivitas, bukti dan Workplan F3. Menandai ulang kebutuhan yang sama membuka rencana yang sudah ada.</p>` + detail +
    card(`Rencana pengembangan · ${plans.length}`, plans.length ? table(['Plan ID', 'Karyawan', 'Kompetensi', 'Target', 'Mentor', 'Review', 'Workplan', 'Bukti'], plans.map(p => [link('hrd-dev' + qs({ id: p.id }), p.id), esc(empName(p.emp)), esc(HR6.COMPS.find(c => c[0] === p.comp)?.[1] || p.comp), `${p.from} → ${p.target}`, esc(empName(p.mentor)), p.due, link('hrd-task' + qs({ id: p.task }), p.task), p.evidence.length])) : '<p>Belum ada rencana. Buat dari profil kompetensi atau 9-Box.</p>') +
    (['hrd', 'hrd-ops', 'hg-lead', 'outlet-spv'].includes(role()) ? card('Gap kompetensi Spa Ubud (level Dasar)', table(['Therapist', 'Kompetensi', 'Level', 'Aksi'], gaps.map(({ p, c }) => [link('hrd-people-perf' + qs({ emp: p.id }), esc(p.name)), esc(c.name), HR6.LEVELS[c.level], `<button type="button" class="btn ghost sm" data-action="hr:plan-create" data-emp="${p.id}" data-comp="${c.id}" data-after="hrd-dev?id={id}">Buat Workplan</button>`]))) : '');
}

/* ---------- NV09 Pelatihan, Kesiapan & Talent Pipeline ---------- */
function training(params) {
  if (self()) return denied('Therapist melihat jam pelatihan sendiri di XScore.');
  const tab = ['eff', 'qoh', 'pipe'].includes(params.tab) ? params.tab : 'prog', h = hr();
  const top = tabs('hrd-training', tab, [['prog', 'Program & verifikasi'], ['eff', 'Efektivitas'], ['qoh', 'Quality of Hire'], ['pipe', 'Talent pipeline']]);
  const canVerify = ['outlet-spv', 'hg-lead', 'hrd'].includes(role());
  if (tab === 'prog') {
    const ps = HR6.programs(h);
    return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} Kehadiran dan kelulusan praktik dicatat terpisah. Lulus praktik terverifikasi memperbarui kompetensi dan KPI Learning dengan bukti yang sama.</p>` + top +
      ps.map(pr => card(`${pr.id} · ${esc(pr.name)} · ${pr.date}`, `<p>${pr.kind} · kompetensi ${esc(HR6.COMPS.find(c => c[0] === pr.comp)?.[1])} → level ${pr.target} · ${pr.hours} jam · pelatih ${esc(pr.trainer)}</p>` + (pr.participants.filter(x => HR6.canSee(h, role(), x.emp)).length ? table(['Peserta', 'Outlet', 'Kehadiran', 'Praktik', 'Diverifikasi', 'Bukti', 'Aksi'], pr.participants.filter(x => HR6.canSee(h, role(), x.emp) && (!params.emp || x.emp === params.emp)).map(x => [link('hrd-people-perf' + qs({ emp: x.emp }), `${esc(empName(x.emp))} · ${x.emp}`), esc(HR.locName((HR.placementOn(h, x.emp) || HR.upcomingOf(h, x.emp))?.location)), chip(x.attend, x.attend === 'Hadir' ? 'ready' : x.attend === 'Terjadwal' ? 'planned' : 'bad'), chip(x.practice, x.practice === 'Lulus' ? 'ready' : x.practice === 'Belum lulus' ? 'bad' : 'sandbox'), esc(x.verifiedBy || '—'), esc(x.ev || '—'), canVerify && x.practice === 'Menunggu verifikasi' && x.attend === 'Hadir' ? `<button type="button" class="btn sm" data-action="hr:train-verify" data-id="${pr.id}" data-emp="${x.emp}">Lulus</button> <button type="button" class="btn ghost sm" data-action="hr:train-verify" data-id="${pr.id}" data-emp="${x.emp}" data-result="fail">Belum lulus</button>` : '—'])) : '<p>Belum ada peserta. Cohort onboarding terisi otomatis dari karyawan baru F4.</p>'))).join('');
  }
  if (tab === 'eff') { const e = HR6.trainingEff(h); return top + card('Efektivitas pelatihan', table(['Ukuran', 'Nilai'], [['Peserta hadir', e.attended], ['Praktik sudah diverifikasi', `${e.verified} (cakupan ${pct(e.coverage, 0)})`], ['Lulus praktik', e.passed], ['Efektivitas = lulus ÷ terverifikasi', pct(e.rate, 0)]]) + `<p class="muted small">Peserta hadir yang belum diverifikasi tidak dihitung lulus maupun gagal. Definisi: ${link('hrd-kpi-lib' + qs({ id: 'MET-TRAIN' }), 'MET-TRAIN')}.</p>`); }
  if (tab === 'qoh') { const q = HR6.qoh(h); return top + card(`Quality of Hire · cohort ${esc(q.cohort)}`, `<p>${q.good} baik dari ${q.reviewed} yang sudah dinilai = <b>${pct(q.rate, 0)}</b> · <b>${q.pending} review 90 hari tertunda</b></p>` + table(['Karyawan', 'Masuk', 'Review 90 hari'], q.rows.map(r => [link('hrd-people-perf' + qs({ emp: r.emp }), `${esc(empName(r.emp))} · ${r.emp}`), r.joined || '—', r.result ? chip(r.result, r.result === 'Baik' ? 'ready' : 'planned') : chip('Tertunda', 'sandbox')])) + (q.upcoming.length ? card('Cohort berikutnya (dari Rekrutmen F4)', table(['Karyawan', 'Review 90 hari jatuh tempo'], q.upcoming.map(u => [esc(empName(u.emp)) + ' · ' + u.emp, u.due || '—']))) : '')); }
  const pipe = HR6.pipeline(h).filter(r => outlets().some(o => o.id === r.outlet));
  return top + card('Talent pipeline · peran kunci', table(['Peran', 'Pemegang saat ini', 'Kandidat internal', 'Kesiapan'], pipe.map(r => [esc(r.role), esc(empName(r.incumbent)), r.candidates.map(c => link('hrd-ninebox' + qs({ emp: c.emp }), esc(empName(c.emp)))).join('<br>') || '<i>belum ada</i>', r.candidates.map(c => chip(c.ready, c.ready === 'Siap sekarang' ? 'ready' : 'planned')).join('<br>') || '—'])) + '<p class="muted small">Kandidat dari 9-Box Stars / Calon Bintang / Kinerja Tinggi. Kesiapan ditinjau HG dan pimpinan divisi.</p>');
}

/* ---------- sidebar & registrasi ---------- */
const items = H.PORTALS.HRD.items;
const set = (route, code, title) => { const it = items.find(i => i[0] === route); if (it) { it[2] = code; it[3] = 'ready'; it[4] = ''; if (title) it[1] = title; } };
set('hrd-kpi', 'F6-NV01'); set('hrd-ninebox', 'F6-NV07');
const ix = items.findIndex(i => i[0] === 'hrd-kpi');
items.splice(ix + 1, 0, ['hrd-ser', 'Stakeholder Expectations', 'F6-NV02', 'ready', '', 'sub'], ['hrd-kpi-lib', 'KPI Library', 'F6-NV03', 'ready', '', 'sub'], ['hrd-kpi-contract', 'Kontrak KPI', 'F6-NV04', 'ready', '', 'sub'], ['hrd-xscore', 'XScore', 'F6-NV05', 'ready', '', 'sub'], ['hrd-people-perf', 'People Performance', 'F6-NV06', 'ready', '', 'sub'], ['hrd-dev', 'Rencana Pengembangan', 'F6-NV08', 'ready', '', 'sub'], ['hrd-training', 'Pelatihan & Talent', 'F6-NV09', 'ready', '', 'sub']);
Object.assign(H.PURPOSE, {
  'hrd-kpi': 'Performa tim terhadap target bersama, rata-rata XScore, cakupan bukti, kesiapan dan efektivitas pelatihan.',
  'hrd-ser': '15 ekspektasi stakeholder (Executive Summary, Collaboration Group, Human Growth) dengan target, realisasi dan sumber.',
  'hrd-kpi-lib': 'Definisi KPI berversi: unit, arah, rumus, cakupan, frekuensi dan sumber. Perubahan membuat versi baru.',
  'hrd-kpi-contract': 'Kontrak tim & individu: bobot tepat 100%, persetujuan, aktivasi, penutupan dengan snapshot, koreksi tercatat.',
  'hrd-xscore': 'Scorecard personal: target, aktual, bobot, kontribusi, bukti, cakupan, provisional/final.',
  'hrd-people-perf': 'Telusuri divisi → outlet → individu: pengalaman, kompetensi, aspirasi, hasil kerja, coaching, histori penempatan.',
  'hrd-ninebox': 'Performa × potensi, termasuk Stars dan Belum Dinilai; alasan, bukti, reviewer dan histori.',
  'hrd-dev': 'Gap kompetensi, target, mentor, aktivitas, bukti dan Workplan F3.',
  'hrd-training': 'Onboarding keterampilan, pelatihan rutin, verifikasi praktik, Quality of Hire dan talent pipeline.'
});
H.SCREENS.push(...[['F6-NV01', 'Dashboard Human Growth', 'hrd-kpi'], ['F6-NV02', 'Stakeholder Expectations & SER', 'hrd-ser'], ['F6-NV03', 'KPI Library', 'hrd-kpi-lib?id=MET-UTIL'], ['F6-NV04', 'Kontrak KPI & Review Periode', 'hrd-kpi-contract?id=CTR-2611-THR'], ['F6-NV05', 'XScore', 'hrd-xscore'], ['F6-NV06', 'People Performance & Kompetensi', 'hrd-people-perf?outlet=OUT-UBD'], ['F6-NV07', '9-Box Talent', 'hrd-ninebox'], ['F6-NV08', 'Rencana Pengembangan & Coaching', 'hrd-dev'], ['F6-NV09', 'Pelatihan, Kesiapan & Talent Pipeline', 'hrd-training']].map(([c, t, r]) => [c, 'HRD · ' + t, 'HRD 6', r, 'ready', 'Manager HRD, HG Lead, Supervisor, Therapist (diri sendiri)']));
register('hrd-kpi', guard(dashboard), () => role() === 'therapist' ? 'XScore Saya' : 'Dashboard Human Growth');
register('hrd-ser', guard(ser), (p) => p.id ? `SER ${p.id}` : 'Stakeholder Expectations & SER');
register('hrd-kpi-lib', guard(library), (p) => p.id ? `KPI ${p.id}` : 'KPI Library');
register('hrd-kpi-contract', guard(contracts), (p) => p.id || 'Kontrak KPI & Review Periode');
register('hrd-xscore', guard(xscorePage), (p) => p.emp || role() === 'therapist' ? 'XScore Personal' : 'XScore');
register('hrd-people-perf', guard(people), (p) => p.emp || role() === 'therapist' ? 'Profil Kompetensi' : 'People Performance');
register('hrd-ninebox', guard(ninebox), () => '9-Box Talent');
register('hrd-dev', guard(dev), (p) => p.id || 'Rencana Pengembangan & Coaching');
register('hrd-training', guard(training), () => 'Pelatihan, Kesiapan & Talent Pipeline');
})();
