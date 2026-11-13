/* HAWK ERP · Portal HRD · F7 Payroll & People Budgeting — DATA DEMO / SIMULASI.
   NV01 Dashboard Payroll (hrd-payroll) · NV02 Komponen & Aturan (hrd-pay-rules) · NV03 Rekonsiliasi Komisi POS (hrd-pay-commission) ·
   NV04 Proses Payroll (hrd-pay-process) · NV05 Slip & Status Bayar (hrd-pay-slip) · NV06 Kasbon & Reimburse (hrd-finance / hrd-cash / hrd-reimburse) ·
   NV07 Laporan Payroll, Pajak & BPJS (hrd-reports) · NV08 Handoff Finance (hrd-pay-handoff) · NV09 Dashboard People Budgeting (hrd-budget) ·
   NV10 Rencana Anggaran (hrd-bud-plan) · NV11 Simulasi Rekrutmen & Outlet Baru (hrd-bud-sim) · NV12 Tren Bulanan & Kurva S (hrd-bud-trend). */
(() => {
const H = window.HL;
const { esc, table, card, qs, link, rp } = H;
const hr = () => { const h = HR.ensure(H.state); HR.EXT.ensure?.(h); return h; };
const f7 = () => hr().f7;
const role = () => H.prefs.role;
const def = () => HR.roleDef(role());
const chip = (t, tone = '') => `<span class="status-chip ${tone}">${esc(t)}</span>`;
const empName = (id) => id ? (hr().people.find(p => p.id === id)?.name || id) : '—';
const pct = (u, d = 1) => u === null || u === undefined || Number.isNaN(u) ? '—' : `${(u * 100).toFixed(d).replace(/\.0$/, '')}%`;
const jt = (x) => x === null || x === undefined ? '—' : `Rp${(x / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
const tabs = (route, cur, list, params = {}, key = 'tab') => `<nav class="tabs" aria-label="Bagian">${list.map(([k, l]) => `<a class="tab${k === cur ? ' on' : ''}" href="#${route}${qs({ ...params, [key]: k })}" ${k === cur ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
const denied = (why) => `<section class="card hr-denied" role="alert"><h2>Akses ditolak</h2><p>${why}</p><div class="actions"><button type="button" class="btn" data-hr-role="hrd">Ganti ke Manager HRD</button></div></section>`;
const register = (id, fn, title) => { H.REGISTRY[id] = fn; fn.title = title; };
const KC = ['g-teal', 'g-violet', 'g-blue', 'g-gold'];
const kpiLinks = (es) => `<section class="grid g4 keep2 kpis">${es.map(([l, v, h, sub], i) => `<a class="kpi ${KC[i % 4]}" href="${h}"><div class="lbl">${l}</div><div class="val">${v}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</a>`).join('')}</section>`;
const MGR = () => role() === 'hrd';
const AGG = () => ['hrd', 'owner', 'finance-manager'].includes(role());
const only = (fn, who = 'mgr') => (p) => (who === 'mgr' ? MGR() : who === 'fin' ? ['hrd', 'finance-manager', 'owner'].includes(role()) : AGG()) ? fn(p) : denied(`Role demo <b>${esc(def().label)}</b> tidak membuka ${who === 'mgr' ? 'payroll, slip dan nominal personal (khusus Manager HRD)' : 'agregat biaya tenaga kerja'}. Tidak ada nominal yang dimuat.`);
const period = (p) => p.period === '2610' ? '2610' : '2611';
const demo = (extra = '') => `<p class="active-filters">${chip('DATA DEMO · R&D', 'sandbox')} Nominal, slip, jurnal & laporan sintetis · tarif pajak/BPJS versi aturan simulasi${extra}</p>`;
const perBar = (route, params) => `<p class="active-filters">Periode: ${['2610', '2611'].map(k => k === period(params) ? `<b>${HR7.PERIODS[k].label}</b>` : link(route + qs({ ...params, period: k }), HR7.PERIODS[k].label)).join(' · ')}</p>`;
const scopeSel = (params, all = true) => `<label>Cakupan<select name="scope">${all ? '<option value="">Semua</option>' : ''}${HR.OUTLETS.map(o => `<option value="${o.id}" ${params.scope === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}<option value="${HR.HQ.id}" ${params.scope === HR.HQ.id ? 'selected' : ''}>${esc(HR.HQ.name)}</option></select></label>`;
const inScope = (l, s) => !s || l.loc === s;
const bstat = (b) => !b ? chip('Belum dibuat', 'sandbox') : chip(`${b.status} · v${b.version}`, b.status === 'Dikunci' ? 'ready' : b.status === 'Direview' ? 'planned' : 'sandbox');

/* ---------- NV01 Dashboard Payroll ---------- */
function dashboard(params) {
  const P = period(params), h = hr(), b = HR7.batchOf(h, P);
  if (role() === 'finance-manager' && (!b || b.status !== 'Dikunci')) return demo() + perBar('hrd-payroll', params) + card('Belum ada agregat disetujui', `<p>Finance melihat agregat batch yang sudah dikunci Manager HRD. ${HR7.PERIODS[P].label}: ${b ? esc(b.status) : 'belum dibuat'}.</p><p>${link('hrd-payroll' + qs({ period: '2610' }), 'Buka Oktober 2026 (dikunci)')}</p>`);
  const ls = HR7.batchLines(h, P).filter(l => inScope(l, params.scope)), t = HR7.totals(ls);
  const exc = HR7.excluded(h, P), src = HR7.sources(h, P);
  const pays = b?.payments || {}, paid = ls.filter(l => pays[l.emp]?.status === 'Sudah Bayar').length, fail = ls.filter(l => ['Gagal', 'Sebagian'].includes(pays[l.emp]?.status)).length;
  const sp = { period: P, scope: params.scope || '' };
  const rows = [...HR.OUTLETS, HR.HQ].map(o => { const x = HR7.totals(ls.filter(l => l.loc === o.id)); return [MGR() ? link('hrd-pay-slip' + qs({ period: P, scope: o.id }), o.name) : esc(o.name), x.n, rp(x.gross), rp(x.ded), rp(x.thp), rp(x.employer), rp(x.cost)]; }).filter(r => r[1]);
  return demo() + perBar('hrd-payroll', params) + `<form id="filters" class="filters" aria-label="Filter payroll"><input type="hidden" name="period" value="${P}">${scopeSel(params)}<label>Grup slip<select name="group"><option>Slip Gaji Karyawan</option></select></label><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    kpiLinks([['Karyawan dalam batch', t.n, MGR() ? '#hrd-pay-slip' + qs(sp) : '#hrd-payroll' + qs(sp), `${exc.length} di luar periode (mulai kemudian)`], ['Total take-home pay', jt(t.thp), MGR() ? '#hrd-pay-process' + qs(sp) : '#hrd-pay-handoff' + qs(sp), `bruto ${jt(t.gross)} − potongan ${jt(t.ded)}`], ['Biaya perusahaan', jt(t.cost), '#hrd-budget', `+ BPJS perusahaan ${jt(t.employer)}`], ['Status proses', b ? b.status : 'Belum dibuat', MGR() ? '#hrd-pay-process' + qs({ period: P }) : '#hrd-pay-handoff' + qs({ period: P }), b?.status === 'Dikunci' ? `Sudah Bayar ${paid} · Gagal/Sebagian ${fail} · Siap Bayar ${t.n - paid - fail}` : 'belum siap bayar']]) +
    card('Kelengkapan sumber', table(['Sumber', 'Status'], src.map(([n, s, tone]) => [esc(n), chip(s, tone)]))) +
    card(`Per outlet / Office · ${HR7.PERIODS[P].label}`, table(['Cakupan', 'Orang', 'Bruto', 'Potongan', 'Take-home pay', 'BPJS perusahaan', 'Biaya'], rows) + `<p class="muted small">Total dashboard = jumlah slip pada batch ${b?.id || HR7.batchId(P)} dengan filter yang sama. Take-home pay ≠ biaya tenaga kerja.</p>`) +
    (exc.length && MGR() ? card('Di luar periode', table(['Karyawan', 'Keterangan'], exc.map(e => [esc(empName(e.emp)) + ' · ' + e.emp, esc(e.excluded)]))) : '');
}

/* ---------- NV02 Komponen & Aturan ---------- */
function rules(params) {
  const h = hr(), r = params.id && f7().rules.find(x => x.id === params.id);
  const ex = HR7.slip(h, 'EMP-0001', '2610');
  return demo() + (r ? card(`${r.id} · ${esc(r.name)}`, table(['Versi', 'Efektif', 'Rumus', 'Nilai', 'Oleh', 'Alasan'], r.versions.map(v => [`v${v.v}`, HR7.PERIODS[v.from]?.label || v.from, esc(v.formula), v.value ?? '—', esc(v.by), esc(v.note)])) +
    `<p>Periode Oktober (dikunci) merujuk v${f7().batches.find(b => b.period === '2610').snapshot.versions[r.id] || 1}. November memakai v${HR7.ruleAt(f7(), r.id, '2611').v}. COA: ${esc(r.coa)}</p>` +
    `<form class="workflow-form" data-submit="hr:rule-version" data-after="hrd-pay-rules?id=${r.id}"><input type="hidden" name="id" value="${r.id}"><label>Nilai baru<input name="value" value="${esc(r.versions[r.versions.length - 1].value ?? '')}"></label><label>Efektif periode<select name="from"><option value="2611">November 2026</option><option value="2612">Desember 2026</option><option value="2610">Oktober 2026 (dikunci)</option></select></label><label>Alasan<input name="note" placeholder="mis. kenaikan komisi hot stone"></label><button class="btn">Simpan versi aturan</button></form>`) : '') +
    card('Komponen & aturan', table(['Rule ID', 'Komponen', 'Jenis', 'Rumus (versi terakhir)', 'Versi', 'COA'], f7().rules.map(x => [link('hrd-pay-rules' + qs({ id: x.id }), x.id), esc(x.name), x.kind, esc(x.versions[x.versions.length - 1].formula), `v${x.versions[x.versions.length - 1].v}`, esc(x.coa)]))) +
    card(`Contoh perhitungan · ${esc(ex.name)} · Oktober 2026`, table(['Komponen', 'Nominal', 'Aturan', 'Keterangan'], [...ex.earnings.map(([n, v, r2, k]) => [esc(n), rp(v), r2, esc(k)]), ['<b>Bruto</b>', `<b>${rp(ex.gross)}</b>`, '', ''], ...ex.ded.map(([n, v, r2, k]) => [esc(n), '−' + rp(v), r2, esc(k)]), ['<b>Take-home pay</b>', `<b>${rp(ex.thp)}</b>`, '', 'sama dengan THP roster F1']]) + '<p class="muted small">Template slip: TPL-LAYOUT (Pengaturan › Layout & Template). Gaji pokok dummy adalah hasil kalibrasi THP, bukan acuan UMK.</p>');
}

/* ---------- NV03 Rekonsiliasi Komisi POS ---------- */
function commission(params) {
  const h = hr(), all = HR7.commissionLines(h, '2611');
  const o = params.outlet || 'OUT-UBD', emp = params.emp;
  let ls = all.filter(c => c.outlet === o && (!emp || c.emp === emp));
  const tot = ls.reduce((s, c) => s + c.amount, 0);
  const by = {}; ls.forEach(c => { by[c.emp] = by[c.emp] || { emp: c.emp, home: c.home, n: 0, hours: 0, amount: 0, rev: 0 }; by[c.emp].n++; if (c.amount > 0) by[c.emp].hours += c.dur / 60; by[c.emp].amount += c.amount; if (c.refund) by[c.emp].rev++; });
  const four = ls.filter(c => c.four), fourTx = [...new Set(four.map(c => c.tx))];
  const adj = HR7.adjustments(h);
  return demo(' · komisi November provisional dari POS F5 Minggu 46') + `<form id="filters" class="filters" aria-label="Filter komisi"><label>Outlet<select name="outlet">${HR.OUTLETS.map(x => `<option value="${x.id}" ${x.id === o ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>${emp ? `<input type="hidden" name="emp" value="${emp}">` : ''}<button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    kpiLinks([['Total komisi outlet', rp(tot), '#hrd-mp-pos' + qs({ outlet: o }), `${ls.length} baris layanan · aturan ${HR7.ruleAt(f7(), 'RUL-KOM', '2611').v === 1 ? 'RUL-KOM v1' : 'RUL-KOM v' + HR7.ruleAt(f7(), 'RUL-KOM', '2611').v}`], ['Four Hands', `${fourTx.length} transaksi`, '#hrd-pay-commission' + qs({ outlet: o, view: 'four' }), 'dibagi per alokasi durasi'], ['Refund dibalik', ls.filter(c => c.refund).length, '#hrd-mp-pos' + qs({ outlet: o, status: 'Refund' }), 'komisi 0 · layanan tetap selesai'], ['Penyesuaian setelah kunci', adj.length, '#hrd-pay-commission' + qs({ outlet: o, view: 'adj' }), 'masuk periode berikut']]) +
    (params.view === 'four' ? card('Pembagian Four Hands', table(['Transaction ID', 'Service Line ID', 'Therapist', 'Durasi', 'Komisi'], four.map(c => [c.tx, link('hrd-mp-pos' + qs({ line: c.line }), c.line), esc(empName(c.emp)), `${c.dur} mnt`, rp(c.amount)])) + `<p>Total ${fourTx.length} transaksi = ${rp(four.reduce((s, c) => s + c.amount, 0))} (jumlah semua bagian).</p>`) : '') +
    (params.view === 'adj' ? card('Penyesuaian (koreksi terlambat)', adj.length ? table(['Adjustment ID', 'Karyawan', 'Baris asal', 'Nilai', 'Dari → ke', 'Alasan', 'Aturan'], adj.map(a => [a.id, esc(empName(a.emp)), link('hrd-mp-pos' + qs({ line: a.ref }), a.ref), rp(a.amount), `${a.fromPeriod} → ${a.toPeriod}`, esc(a.reason), a.rule])) : '<p>Belum ada refund setelah penguncian.</p>') : '') +
    card(`Per therapist · ${esc(HR.locName(o))}`, table(['Therapist', 'Outlet induk', 'Baris', 'Jam berkomisi', 'Refund', 'Komisi', 'Rincian'], Object.values(by).sort((a, b) => b.amount - a.amount).map(x => [esc(empName(x.emp)) + ' · ' + x.emp, x.home === o ? esc(HR.locName(x.home)) : `${chip('Bantuan', 'planned')} ${esc(HR.locName(x.home))}`, x.n, `${Math.round(x.hours * 10) / 10} jam`, x.rev, rp(x.amount), link('hrd-pay-commission' + qs({ outlet: o, emp: x.emp }), 'baris')])) + `<p class="muted small">Komisi dihitung di outlet aktual layanan (bantuan dari outlet lain tetap dibayar ke therapist). Replay batch POS tidak menambah komisi karena kunci = Service Line ID. Komisi Oktober (ditutup) memakai ringkasan bulanan.</p>`) +
    (emp ? card(`Baris komisi ${esc(empName(emp))}`, table(['Commission Line ID', 'Service Line ID', 'Tanggal', 'Layanan', 'Durasi', 'Status', 'Komisi'], ls.map(c => [c.id, link('hrd-mp-pos' + qs({ line: c.line }), c.line), c.date, esc(c.svc), `${c.dur} mnt`, esc(c.status), rp(c.amount)]))) : '');
}

/* ---------- NV04 Proses Payroll ---------- */
function processPage(params) {
  const P = period(params), h = hr(), b = HR7.batchOf(h, P), ls = HR7.batchLines(h, P), t = HR7.totals(ls), an = HR7.anomalies(h, P);
  const ver = b ? `<input type="hidden" name="version" value="${b.version}">` : '';
  const steps = ['Generate draf', 'Tarik sumber', 'Validasi anomali', 'Review', 'Persetujuan & kunci'];
  const at = !b ? 0 : b.status === 'Draf' ? 3 : b.status === 'Direview' ? 4 : 5;
  const diff = b?.preview ? t.thp - b.preview.thp : null;
  return demo() + perBar('hrd-pay-process', params) + `<ol class="hr-steps hr-flow">${steps.map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'on' : ''}">${s}</li>`).join('')}</ol>` +
    card(`Batch ${b?.id || HR7.batchId(P)} · ${HR7.PERIODS[P].label}`, `<p>${bstat(b)} ${b?.reviewer ? `· reviewer ${esc(b.reviewer)}` : ''} ${b?.snapshot ? `· snapshot ${esc(b.snapshot.at)}` : ''}</p>` + table(['Ringkasan', 'Nilai'], [['Orang', t.n], ['Bruto', rp(t.gross)], ['Potongan', rp(t.ded)], ['Take-home pay', rp(t.thp)], ['Pratinjau perubahan sejak generate', diff === null ? '—' : diff === 0 ? 'tidak ada perubahan' : `${diff > 0 ? '+' : ''}${rp(diff)} (sumber berubah, regenerasi untuk memperbarui)`]]) +
      `<div class="actions">${b?.status === 'Dikunci' ? `${chip('Periode terkunci', 'ready')} Koreksi berikutnya dicatat sebagai penyesuaian (${link('hrd-pay-commission' + qs({ view: 'adj' }), 'lihat')}).` : `<form class="inline-form" data-submit="hr:pay-generate" data-after="hrd-pay-process?period=${P}"><input type="hidden" name="period" value="${P}">${ver}<button class="btn">${b ? 'Regenerasi draf (batch sama)' : 'Generate draf'}</button></form>${b ? `<form class="inline-form" data-submit="hr:pay-reset" data-after="hrd-pay-process?period=${P}"><input type="hidden" name="period" value="${P}"><button class="btn ghost">Reset draf</button></form>` : ''}${b?.status === 'Draf' ? `<form class="inline-form" data-submit="hr:pay-review" data-after="hrd-pay-process?period=${P}"><input type="hidden" name="period" value="${P}">${ver}<button class="btn">Tandai sudah direview</button></form>` : ''}${b?.status === 'Direview' ? `<form class="inline-form" data-submit="hr:pay-lock" data-after="hrd-pay-process?period=${P}"><input type="hidden" name="period" value="${P}">${ver}<button class="btn">Setujui & kunci</button></form>` : ''}`}</div>`) +
    card('Sumber', table(['Sumber', 'Status'], HR7.sources(h, P).map(([n, s, tone]) => [esc(n), chip(s, tone)]))) +
    card(`Anomali · ${an.length}`, an.length ? table(['Karyawan', 'Jenis', 'Detail'], an.slice(0, 30).map(a => [link('hrd-pay-slip' + qs({ emp: a.emp, period: P }), esc(empName(a.emp))), esc(a.kind), esc(a.detail)])) + (an.length > 30 ? `<p class="muted small">+${an.length - 30} lainnya (THP November provisional: komisi baru 1 minggu).</p>` : '') : '<p>Tidak ada anomali.</p>') +
    card('Impor (pratinjau)', `<p>Impor lembur/insentif dari CSV menampilkan pratinjau perubahan sebelum diterapkan. Preview: simulasi, tidak membaca file.</p>`) +
    (b ? card('Riwayat batch', table(['Waktu', 'Peristiwa'], b.history.map(([a, c]) => [a, esc(c)]))) : '');
}

/* ---------- NV05 Slip & Status Pembayaran ---------- */
function slips(params) {
  const P = period(params), h = hr(), b = HR7.batchOf(h, P);
  if (params.emp) {
    const s = b?.snapshot ? b.snapshot.lines.find(l => l.emp === params.emp) : HR7.slip(h, params.emp, P);
    if (!s || s.excluded) return card('Tidak ada slip', `<p>${esc(s?.excluded || 'Karyawan tidak ada di periode ini.')}</p>`);
    const pay = b?.payments?.[s.emp], ready = b?.status === 'Dikunci';
    return demo() + perBar('hrd-pay-slip', params) + card(`Slip ${esc(s.name)} · ${s.emp} · ${HR7.PERIODS[P].label}`, `<p>${esc(HR.locName(s.loc))} · ${esc(HR.pos(s.pos).name)} · batch ${b?.id || '—'} ${bstat(b)} · pembayaran ${pay ? chip(pay.status, pay.status === 'Sudah Bayar' ? 'ready' : 'bad') + ` ref ${esc(pay.ref)}${pay.note ? ' · ' + esc(pay.note) : ''}` : ready ? chip('Siap Bayar', 'planned') : chip('Belum siap', 'sandbox')}</p>` +
      `<div class="grid g2">${card('Pendapatan', table(['Komponen', 'Nominal', 'Bukti'], [...s.earnings.map(([n, v, r, k]) => [esc(n), rp(v), r === 'RUL-KOM' && P === '2611' ? link('hrd-pay-commission' + qs({ outlet: s.loc, emp: s.emp }), esc(k)) : esc(k || r)]), ['<b>Bruto</b>', `<b>${rp(s.gross)}</b>`, '']]))}${card('Potongan', table(['Komponen', 'Nominal', 'Bukti'], [...s.ded.map(([n, v, r, k]) => [esc(n), rp(v), r === 'RUL-KSB' ? link('hrd-finance' + qs({ emp: s.emp }), esc(k)) : esc(k || r)]), ['<b>Total potongan</b>', `<b>${rp(s.dedT)}</b>`, '']]))}</div>` +
      `<p class="kpi-big">Take-home pay <b>${rp(s.thp)}</b> = ${rp(s.gross)} − ${rp(s.dedT)} ${s.gross - s.dedT === s.thp ? chip('Rekonsiliasi ✓', 'ready') : chip('Selisih', 'bad')}</p><p class="muted small">Versi aturan: ${Object.entries(s.versions).map(([k, v]) => `${k} v${v}`).join(', ')}. Biaya perusahaan (BPJS perusahaan ${rp(s.employer)}) tidak tampil di slip karyawan.</p>` +
      (ready && pay?.status !== 'Sudah Bayar' ? `<form class="workflow-form" data-submit="hr:pay-mark" data-after="hrd-pay-slip?emp=${s.emp}&period=${P}"><input type="hidden" name="period" value="${P}"><input type="hidden" name="emp" value="${s.emp}"><label>Status<select name="status"><option value="paid">Sudah Bayar</option><option value="partial">Sebagian</option><option value="failed">Gagal</option></select></label><label>Referensi bukti bank<input name="ref" placeholder="BANK-…"></label><label>Catatan<input name="note"></label><button class="btn">Catat status pembayaran</button></form>` : ''));
  }
  const ls = HR7.batchLines(h, P).filter(l => inScope(l, params.scope) && (!params.pay || (b?.payments?.[l.emp]?.status || (b?.status === 'Dikunci' ? 'Siap Bayar' : 'Belum siap')) === params.pay));
  const st = (l) => b?.payments?.[l.emp]?.status || (b?.status === 'Dikunci' ? 'Siap Bayar' : 'Belum siap');
  return demo() + perBar('hrd-pay-slip', params) + `<form id="filters" class="filters" aria-label="Filter slip"><input type="hidden" name="period" value="${P}">${scopeSel(params)}<label>Status bayar<select name="pay"><option value="">Semua</option>${['Siap Bayar', 'Sudah Bayar', 'Sebagian', 'Gagal', 'Belum siap'].map(s => `<option ${params.pay === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    (ls.length ? card(`Slip · ${ls.length} orang · total THP ${rp(HR7.totals(ls).thp)}`, `<p><button type="button" class="btn ghost sm" data-action="hr:noop-download" disabled title="Simulasi">Unduh massal slip (simulasi, Manager HRD)</button> · Slip tidak tetap: ${chip('Insentif pelatih Hot Stone · SLP-NT-2611-01', 'planned')}</p>` + table(['Karyawan', 'Outlet', 'Bruto', 'Potongan', 'Take-home pay', 'Status bayar'], ls.slice(0, 60).map(l => [link('hrd-pay-slip' + qs({ emp: l.emp, period: P }), `${esc(l.name)} · ${l.emp}`), esc(HR.locName(l.loc)), rp(l.gross), rp(l.dedT), rp(l.thp), chip(st(l), st(l) === 'Sudah Bayar' ? 'ready' : ['Gagal', 'Sebagian'].includes(st(l)) ? 'bad' : 'planned')])) + (ls.length > 60 ? `<p class="muted small">Menampilkan 60 dari ${ls.length}; filter cakupan untuk mempersempit.</p>` : '') + '<p class="muted small">Siap Bayar tidak otomatis menjadi Sudah Bayar; status bayar butuh referensi bukti bank.</p>') : `<section class="card hr-empty"><h2>Tidak ada slip</h2><p>Tidak ada slip untuk filter ini.</p><button type="button" class="btn" data-action="filter-reset">Reset filter</button></section>`);
}

/* ---------- NV06 Kasbon & Reimburse ---------- */
function finance(params) {
  const tab = params.tab === 'rmb' ? 'rmb' : params.tab === 'ledger' ? 'ledger' : 'ksb', h = hr();
  const top = tabs(H.parseHash().id, tab, [['ksb', 'Kasbon'], ['rmb', 'Reimburse'], ['ledger', 'Ledger saldo']], params.emp ? { emp: params.emp } : {});
  if (tab === 'ksb') return demo() + top + card('Kasbon', table(['Request ID', 'Karyawan', 'Nominal', 'Alasan', 'Status', 'Cicilan (periode · nominal · dipakai di)', 'Aksi'], f7().advances.filter(a => !params.emp || a.emp === params.emp).map(a => [a.id, esc(empName(a.emp)), rp(a.amount), esc(a.reason), chip(a.status, a.status === 'Dicairkan' ? 'ready' : 'sandbox'), a.schedule.map(s => { const bb = HR7.batchOf(h, s.period); const used = bb?.snapshot?.lines.some(l => l.emp === a.emp && l.ded.some(d => d[3] === s.id)); return `${s.id} · ${s.period} · ${rp(s.amount)} · ${used ? bb.id : bb ? `draf ${bb.id}` : 'belum'}`; }).join('<br>'), a.status === 'Diajukan' ? `<button type="button" class="btn sm" data-action="hr:adv-approve" data-id="${a.id}">Setujui</button>` : a.status === 'Disetujui' ? `<button type="button" class="btn sm" data-action="hr:adv-disburse" data-id="${a.id}">Cairkan</button>` : '—'])) +
    `<form class="workflow-form" data-submit="hr:adv-request"><label>Karyawan<input name="emp" value="EMP-0010"></label><label>Nominal (Rp)<input type="number" name="amount" value="900000"></label><label>Cicilan (bulan)<input type="number" name="months" value="3" min="1" max="6"></label><label>Alasan<input name="reason" value="Perbaikan motor"></label><button class="btn ghost">Ajukan kasbon</button></form><p class="muted small">Cicilan dipotong tepat sekali pada periode terkait (kunci = ID cicilan).</p>`);
  if (tab === 'rmb') return demo() + top + card('Reimburse', table(['Request ID', 'Karyawan', 'Jenis', 'Nominal', 'Bukti', 'Status', 'Penyelesaian', 'Aksi'], f7().reimburse.filter(r => !params.emp || r.emp === params.emp).map(r => [r.id, esc(empName(r.emp)), esc(r.kind), rp(r.amount), esc(r.proof), chip(r.status, r.status === 'Disetujui' ? 'ready' : r.status === 'Ditolak' ? 'bad' : 'sandbox'), r.settledOther ? `Kanal lain: ${esc(r.settledOther)} (tidak masuk payroll)` : r.status === 'Disetujui' ? `Payroll ${r.period}` : '—', r.status === 'Diajukan' ? `<button type="button" class="btn sm" data-action="hr:rmb-decide" data-id="${r.id}">Setujui (via payroll)</button> <button type="button" class="btn ghost sm" data-action="hr:rmb-decide" data-id="${r.id}" data-decision="other" data-ref="Kas kecil outlet">Selesai di kas kecil</button> <button type="button" class="btn ghost sm" data-action="hr:rmb-decide" data-id="${r.id}" data-decision="reject">Tolak</button>` : '—'])) +
    `<form class="workflow-form" data-submit="hr:rmb-request"><label>Karyawan<input name="emp" value="EMP-0012"></label><label>Jenis<input name="kind" value="Transport"></label><label>Nominal (Rp)<input type="number" name="amount" value="150000"></label><label>Bukti<input name="proof" value="struk.jpg"></label><button class="btn ghost">Ajukan reimburse</button></form>`);
  const lg = HR7.ledger(h, params.emp);
  return demo() + top + card('Ledger kasbon', lg.length ? table(['Ref', 'Karyawan', 'Tanggal', 'Jenis', 'Debit', 'Kredit', 'Saldo'], lg.map(r => [r.ref, esc(empName(r.emp)), r.date, esc(r.kind), r.debit ? rp(r.debit) : '—', r.credit ? rp(r.credit) : '—', rp(r.balance)])) : '<p>Belum ada mutasi.</p>');
}

/* ---------- NV07 Laporan ---------- */
function reports(params) {
  const h = hr(), P = period(params), g = params.group, it = params.item;
  const ls = HR7.batchLines(h, P), t = HR7.totals(ls), b = HR7.batchOf(h, P), mgr = MGR();
  if (!g) return demo() + perBar('hrd-reports', params) + Object.entries(HR7.REPORTS).map(([grp, list]) => card(`${grp} · ${list.length}`, table(['Laporan', 'Status', 'Ekspor'], list.map(n => [link('hrd-reports' + qs({ group: grp, item: n, period: P }), n), grp === 'Coretax' ? chip('Template perlu verifikasi', 'sandbox') : b?.status === 'Dikunci' ? chip('Lengkap', 'ready') : chip('Provisional', 'sandbox'), mgr ? 'CSV/PDF (simulasi)' : 'Khusus Manager HRD'])))).join('') + `<p class="muted small">${Object.values(HR7.REPORTS).flat().length} entri katalog GajiHub.</p>`;
  let body = '';
  if (it === 'Ringkasan Gaji') body = table(['Ukuran', 'Nilai'], [['Orang', t.n], ['Bruto', rp(t.gross)], ['Potongan', rp(t.ded)], ['Take-home pay', rp(t.thp)], ['Batch', `${b?.id || '—'} · ${b?.status || 'belum'}`]]) + `<p>${chip('Rekonsiliasi batch ✓', 'ready')} total = jumlah slip ${b?.id || ''}.</p>`;
  else if (it === 'Ringkasan Gaji per Organisasi') body = table(['Cakupan', 'Orang', 'Bruto', 'THP'], [...HR.OUTLETS, HR.HQ].map(o => { const x = HR7.totals(ls.filter(l => l.loc === o.id)); return [esc(o.name), x.n, rp(x.gross), rp(x.thp)]; }));
  else if (it === 'Ringkasan Gaji per Komponen') body = table(['Komponen', 'Nominal'], [['Gaji pokok', t.base], ['Tunjangan', t.allow], ['Komisi', t.comm], ['Lembur', t.ot], ['Reimburse', t.rmb], ['BPJS karyawan', -t.bpjs], ['PPh 21', -t.pph], ['Cicilan kasbon', -t.ksb]].map(([n, v]) => [n, rp(v)]));
  else if (it === 'Ringkasan Gaji per Karyawan' || it === 'Pembayaran Gaji') body = mgr ? table(['Karyawan', 'Bruto', 'THP', 'Status bayar'], ls.slice(0, 40).map(l => [esc(l.name), rp(l.gross), rp(l.thp), b?.payments?.[l.emp]?.status || (b?.status === 'Dikunci' ? 'Siap Bayar' : '—')])) : '<p>Rincian per karyawan khusus Manager HRD.</p>';
  else if (it === 'Payroll Tahun Berjalan (YTD)') { const rows = HR7.budgetYear(h).filter(r => r.cost !== null); body = table(['Bulan', 'Biaya (aktual)'], rows.map(r => [r.name, rp(r.cost)])) + `<p>YTD ${rp(rows.reduce((s, r) => s + r.cost, 0))}</p>`; }
  else if (g === 'PPH 21/26') body = table(['Ukuran', 'Nilai'], [['Pegawai tetap dipotong', ls.filter(l => l.ded.some(d => d[2] === 'RUL-PPH' && d[1] > 0)).length], ['Total PPh 21', rp(t.pph)], ['Versi aturan', `RUL-PPH v${HR7.ruleAt(f7(), 'RUL-PPH', P).v} (TER simulasi)`], ['PPh 26', '0 · tidak ada pegawai asing di dataset demo']]);
  else if (g === 'BPJS') body = table(['Ukuran', 'Nilai'], [['Peserta', t.n], ['Iuran karyawan', rp(t.bpjs)], ['Iuran perusahaan', rp(t.employer)], ['Versi aturan', `RUL-BPJS v${HR7.ruleAt(f7(), 'RUL-BPJS', P).v} (simulasi)`]]);
  else body = `<p>${chip('Template Coretax perlu verifikasi', 'sandbox')} Format bukti pemotongan resmi belum dipetakan. Data sumber: PPh 21 ${rp(t.pph)} dari ${b?.id || '—'}.</p>`;
  return demo() + perBar('hrd-reports', { group: g, item: it }) + card(`${esc(g)} · ${esc(it)}`, body + `<p>${link('hrd-reports' + qs({ period: P }), '‹ Katalog laporan')}</p>`);
}

/* ---------- NV08 Handoff Finance & Accounting ---------- */
function handoff(params) {
  const P = period(params), h = hr(), b = HR7.batchOf(h, P);
  if (!b || b.status !== 'Dikunci') return demo() + perBar('hrd-pay-handoff', params) + card('Belum ada snapshot terkunci', `<p>Handoff dibuat dari batch yang dikunci Manager HRD. Status ${HR7.PERIODS[P].label}: ${b ? esc(b.status) : 'belum dibuat'}.</p>`);
  const j = HR7.journal(h, P), t = HR7.totals(b.snapshot.lines), ho = b.handoff;
  return demo() + perBar('hrd-pay-handoff', params) + kpiLinks([['Total biaya (debit)', jt(j.debit), '#hrd-pay-handoff' + qs({ period: P }), 'bruto + BPJS perusahaan'], ['Kredit', jt(j.credit), '#hrd-pay-handoff' + qs({ period: P }), j.balanced ? 'jurnal seimbang' : 'TIDAK seimbang'], ['Snapshot HRD', jt(t.cost), MGR() ? '#hrd-pay-process' + qs({ period: P }) : '#hrd-payroll' + qs({ period: P }), b.id], ['Status penerimaan', ho ? ho.status : 'Belum dikirim', '#hrd-pay-handoff' + qs({ period: P }), ho ? `percobaan ${ho.attempts}` : '']]) +
    card(`Jurnal ${j.id} · ${j.balanced ? chip('Seimbang', 'ready') : chip('Tidak seimbang', 'bad')}`, table(['Cost center', '6101 Gaji', '6102 Tunjangan', '6103 Komisi', '6104 Lembur', '6105 BPJS perusahaan', '6106 Reimburse'], j.centers.map(c => [esc(c.cc.startsWith('HQ-') ? 'Office · ' + (HR.DIVISIONS.find(d => d.id === c.cc.slice(3))?.name || c.cc) : HR.locName(c.cc)), rp(c['6101'] + (c.round || 0)), rp(c['6102']), rp(c['6103']), rp(c['6104']), rp(c['6105']), rp(c['6106'])])) +
      table(['COA kredit', 'Akun', 'Nominal'], j.lines.map(([c, n, v]) => [c, esc(n), rp(v)])) + `<p>Debit ${rp(j.debit)} = Kredit ${rp(j.credit)} · total = snapshot HRD ${rp(t.cost)} ${Math.abs(j.debit - t.cost) < 1 ? chip('Rekonsiliasi ✓', 'ready') : chip('Selisih', 'bad')}</p>`) +
    card('Pengiriman & penerimaan', table(['Field', 'Nilai'], [['Journal Batch ID (kunci retry)', ho?.id || j.id], ['Status', ho ? chip(ho.status, ho.status === 'Diterima Finance' ? 'ready' : ho.status === 'Gagal kirim' ? 'bad' : 'planned') : '—'], ['Dikirim', ho?.sent || '—'], ['Percobaan', ho?.attempts || 0], ['Diterima', ho?.ack || '—'], ['Selisih', ho?.variance === null || ho?.variance === undefined ? '—' : rp(ho.variance)], ['Galat', esc(ho?.error || '—')]]) +
      `<div class="actions">${MGR() && (!ho || ho.status === 'Gagal kirim') ? `<button type="button" class="btn" data-action="hr:fin-handoff" data-period="${P}">${ho ? 'Kirim ulang (kunci sama)' : 'Kirim ke Finance'}</button> <button type="button" class="btn ghost" data-action="hr:fin-handoff" data-period="${P}" data-fail="1">Simulasikan gagal</button>` : ''}${role() === 'finance-manager' && ho?.status === 'Terkirim' ? `<form class="inline-form" data-submit="hr:fin-ack" data-after="hrd-pay-handoff?period=${P}"><input type="hidden" name="period" value="${P}"><label>Selisih (Rp)<input type="number" name="variance" value="0"></label><label>Catatan<input name="note"></label><button class="btn">Terima jurnal</button></form>` : ''}</div><p class="muted small">Endpoint Finance: NEW INTEGRATION REQUIRED (simulasi). Finance melihat agregat per cost center, bukan slip individu.</p>`) +
    card('Pemetaan COA', table(['COA', 'Akun', 'Sisi'], HR7.COA.map(([c, n, s]) => [c, esc(n), s === 'D' ? 'Debit' : 'Kredit'])));
}

/* ---------- NV09–NV12 People Budgeting ---------- */
const budScope = (p) => HR.OUTLETS.some(o => o.id === p.scope) ? p.scope : 'all';
const budBar = (route, p) => `<form id="filters" class="filters" aria-label="Filter anggaran"><label>Tahun<select name="year"><option value="2026">2026</option><option value="2025" ${p.year === '2025' ? 'selected' : ''}>2025</option></select></label><label>Cakupan<select name="scope"><option value="">Grup Spa (konsolidasi)</option>${HR.OUTLETS.map(o => `<option value="${o.id}" ${p.scope === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>`;
function budget(params) {
  const h = hr(), s = budScope(params), yr = Number(params.year || 2026), rows = HR7.budgetYear(h, s, yr);
  const hc = s === 'all' ? h.people.filter(p => HR.placementOn(h, p.id)).length : HR.people(h, 'hrd', { outlet: s }).length;
  const r = HR7.ratios(rows, hc), oct = rows[9];
  const t10 = HR7.totals(HR7.batchLines(h, '2610').filter(l => s === 'all' || l.loc === s));
  const salR = oct.rev ? (t10.gross) / oct.rev : null;
  const sp = { scope: params.scope || '', year: params.year || '' };
  return demo(` · koridor demo 25–30% (25% rencana SER, 30% batas review) · ${f7().budget.id}`) + budBar('hrd-budget', params) +
    kpiLinks([['Salary Ratio · Okt', pct(salR), '#hrd-bud-trend' + qs(sp), `bruto ${jt(t10.gross)} ÷ revenue ${jt(oct.rev)}${s === 'all' ? '' : ' (outlet, tanpa alokasi Office)'}`], ['Total People Cost Ratio · tahun', pct(r.ratio), '#hrd-bud-trend' + qs(sp), `biaya ${jt(r.cost)} ÷ revenue ${jt(r.rev)} (aktual + forecast)`], ['Revenue per Employee / bulan', jt(r.revPerEmp), '#hrd-bud-plan' + qs(sp), `rata-rata ${hc} orang (headcount akhir periode)`], ['Ruang anggaran tahun', jt(r.room), '#hrd-bud-plan' + qs(sp), `pagu ${jt(r.budget)} − forecast ${jt(r.cost)}`]]) +
    kpiLinks([['Salary per Employee · Okt', jt(hc ? t10.gross / hc : null), MGR() ? '#hrd-payroll' + qs({ period: '2610', scope: s === 'all' ? '' : s }) : '#hrd-budget', 'bruto ÷ headcount aktif'], ['Status rasio', r.ratio === null ? 'Belum tersedia' : r.ratio > 0.30 ? 'Di atas batas 30%' : r.ratio >= 0.25 ? 'Dalam koridor' : 'Di bawah 25%', '#hrd-bud-trend' + qs(sp), r.ratio !== null && r.ratio < 0.25 ? 'baca bersama coverage shift & kualitas layanan (F5)' : ''], ['Skenario disetujui', f7().scenarios.filter(x => x.status === 'Disetujui').length, '#hrd-bud-sim', 'masuk forecast'], ['Data terakhir', 'Okt ditutup · Nov provisional', '#hrd-bud-trend' + qs(sp), HR.TODAY]]) +
    card('Definisi', table(['Metrik', 'Pembilang', 'Penyebut', 'Cakupan'], [['Salary Ratio', 'Bruto gaji diakui periode (gaji, tunjangan, komisi, lembur)', 'Revenue bersih periode', 'Entitas/outlet & periode sama'], ['Total People Cost Ratio', 'Bruto + BPJS perusahaan + alokasi Office', 'Revenue bersih', 'Kuartal/tahun = total ÷ total'], ['Salary per Employee', 'Bruto periode', 'Headcount aktif akhir periode (metode demo)', 'Sama'], ['Revenue per Employee', 'Revenue bersih', 'Headcount aktif', 'FTE = 173 jam/bulan (kebijakan demo)']]) + '<p class="muted small">Revenue per outlet: simulasi (Finance TO VERIFY). Revenue nol atau belum tersedia menampilkan rasio "Belum tersedia".</p>');
}
function plan(params) {
  const h = hr(), s = budScope(params), yr = Number(params.year || 2026), rows = HR7.budgetYear(h, s, yr);
  const q = [0, 1, 2, 3].map(k => rows.slice(k * 3, k * 3 + 3)), sum = (a, kk) => a.reduce((x, r) => x + (r[kk] || 0), 0);
  const revAll = Object.values({ 'OUT-UBD': 850e6, 'OUT-SHT': 480e6, 'OUT-TRL': 650e6, 'OUT-BSM': 570e6 }), tot = revAll.reduce((a, b) => a + b, 0);
  const office = HR7.totals(HR7.batchLines(h, '2610').filter(l => l.loc === HR.HQ.id)).cost;
  return demo(` · ${f7().budget.id}`) + budBar('hrd-bud-plan', params) +
    card(`Anggaran ${yr} per bulan · ${s === 'all' ? 'Grup Spa' : esc(HR.locName(s))}`, table(['Bulan', 'Revenue rencana', 'Pagu (25%)', 'Biaya aktual/forecast', 'Status', 'Ruang'], [...rows.map(r => [r.name, rp(r.revPlan), rp(r.budget), rp(r.forecast), esc(r.status), rp(r.budget - r.forecast)]), ['<b>Tahun</b>', `<b>${rp(sum(rows, 'revPlan'))}</b>`, `<b>${rp(sum(rows, 'budget'))}</b>`, `<b>${rp(sum(rows, 'forecast'))}</b>`, '', `<b>${rp(sum(rows, 'budget') - sum(rows, 'forecast'))}</b>`]]) + `<p>Jumlah 12 bulan = total tahun ${chip('✓', 'ready')} · pola musiman: ${HR7.SEASON.map((x, i) => `${HR7.MONTHS[i]} ${x}`).join(' · ')}</p>`) +
    card('Per kuartal', table(['Kuartal', 'Revenue', 'Pagu', 'Forecast', 'Rasio (total ÷ total)'], q.map((a, k) => [`Q${k + 1}`, rp(sum(a, 'revForecast')), rp(sum(a, 'budget')), rp(sum(a, 'forecast')), pct(sum(a, 'forecast') / sum(a, 'revForecast'))]))) +
    card('Alokasi biaya Office (divisi pendukung) ke outlet', table(['Outlet penerima', 'Dasar alokasi (revenue Okt)', 'Porsi', 'Biaya Office dialokasikan / bulan'], HR.OUTLETS.map((o, k) => [esc(o.name), rp(revAll[k]), pct(revAll[k] / tot), rp(office * revAll[k] / tot)])) + `<p>Total porsi 100% · biaya Office ${rp(office)} / bulan dihitung sekali pada konsolidasi (entitas sumber: Office Ubud).</p>`);
}
function sim(params) {
  const h = hr(), scs = f7().scenarios;
  const reqs = (h.f4?.reqs || []).filter(r => r.position === 'POS-THR');
  const s = params.id && scs.find(x => x.id === params.id);
  const base = HR7.ratios(HR7.budgetYear(h, s?.outlet || 'all'), 1);
  return demo(' · skenario memengaruhi forecast setelah disetujui') + (s ? card(`${s.id} · ${s.kind === 'bantuan' ? 'Bantuan outlet' : `Tambah ${s.n} Therapist`} · ${esc(HR.locName(s.outlet))}`, table(['Ukuran', 'Nilai'], [['Mulai', s.start], ['Biaya tahun berjalan (2026)', rp(s.ytd)], ['Biaya setahun penuh', rp(s.fullYear)], ['Forecast biaya baseline', rp(base.cost)], ['Forecast + skenario', rp(base.cost + (s.status === 'Disetujui' ? 0 : s.ytd))], ['Requisition ID F4', s.req ? link('hrd-rec-manage', s.req) : chip('Belum tertaut', 'sandbox')], ['Status', chip(s.status, s.status === 'Disetujui' ? 'ready' : 'sandbox')]]) + `<p>Asumsi:</p><ul>${s.assume.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` + table(['Bulan', ...HR7.MONTHS], [['Tambahan', ...s.monthly.map(v => v ? jt(v) : '—')]]) + (s.status === 'Draf' && MGR() ? `<button type="button" class="btn" data-action="hr:bud-sim-approve" data-id="${s.id}">Setujui masuk forecast</button>` : '')) : '') +
    (MGR() ? card('Simulasi baru', `<form class="workflow-form" data-submit="hr:bud-sim" data-after="hrd-bud-sim?id={id}"><label>Jenis<select name="kind"><option value="tambah">Tambah Therapist</option><option value="bantuan">Bantuan outlet</option></select></label><label>Outlet<select name="outlet">${HR.OUTLETS.map(o => `<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select></label><label>Jumlah<input type="number" name="count" value="2" min="1" max="10"></label><label>Mulai<input type="date" name="start" value="2026-12-01"></label><label>Requisition ID F4<select name="req"><option value="">—</option>${reqs.map(r => `<option value="${r.id}">${r.id} · ${esc(HR.locName(r.outlet))} · ${r.count}</option>`).join('')}</select></label><button class="btn">Hitung skenario</button></form><p class="muted small">Outlet baru: pra-pembukaan memakai biaya rupiah dengan revenue 0 sehingga rasio "Belum tersedia" (contoh: Spa Canggu rencana, pagu pra-pembukaan Rp180 jt, simulasi).</p>`) : '') +
    card(`Skenario · ${scs.length}`, scs.length ? table(['Scenario ID', 'Jenis', 'Outlet', 'Orang', 'Mulai', 'Tahun berjalan', 'Setahun penuh', 'Requisition', 'Status'], scs.map(x => [link('hrd-bud-sim' + qs({ id: x.id }), x.id), x.kind, esc(HR.locName(x.outlet)), x.n, x.start, rp(x.ytd), rp(x.fullYear), x.req || '—', x.status])) : '<p>Belum ada skenario.</p>') +
    card('Outlet baru (rencana)', table(['Outlet', 'Revenue', 'Biaya pra-pembukaan', 'Rasio'], [['Spa Canggu (rencana, simulasi)', rp(0), rp(180e6), chip('Belum tersedia (revenue 0)', 'sandbox')]]));
}
function chart(rows, key, lines, fmt = (v) => pct(v, 0)) {
  const W = 640, Hh = 220, pad = 48, xs = (i) => pad + i * (W - pad * 2) / 11, max = Math.max(...lines.flatMap(l => rows.map(r => l.get(r) ?? 0))) * 1.1 || 1, ys = (v) => Hh - pad - v / max * (Hh - pad * 2);
  const path = (l) => { let d = '', on = false; rows.forEach((r, i) => { const v = l.get(r); if (v === null || v === undefined) { on = false; return; } d += `${on ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(v).toFixed(1)} `; on = true; }); return d; };
  return `<figure class="hr-chart"><svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(key)}">${[0, 0.5, 1].map(k => `<line x1="${pad}" y1="${ys(max / 1.1 * k)}" x2="${W - pad}" y2="${ys(max / 1.1 * k)}" stroke="currentColor" opacity="${k ? 0.1 : 0.3}"/><text x="${pad - 4}" y="${ys(max / 1.1 * k) + 3}" font-size="10" text-anchor="end" fill="currentColor" opacity=".7">${fmt(max / 1.1 * k)}</text>`).join('')}${rows.map((r, i) => `<text x="${xs(i)}" y="${Hh - pad + 16}" font-size="10" text-anchor="middle" fill="currentColor" opacity=".7">${r.name}</text>`).join('')}${lines.map(l => `<path d="${path(l)}" fill="none" stroke="${l.color}" stroke-width="2.5" ${l.dash ? 'stroke-dasharray="5 4"' : ''}/>`).join('')}</svg><figcaption class="hr-legend">${lines.map(l => `<span><i style="background:${l.color}"></i>${esc(l.name)}</span>`).join('')}</figcaption></figure>`;
}
function trend(params) {
  const h = hr(), s = budScope(params), rows = HR7.budgetYear(h, s, 2026), prev = HR7.budgetYear(h, s, 2025);
  let cum = 0, cumP = 0; const cumRows = rows.map(r => ({ ...r, cum: (cum += r.forecast), cumBud: (cumP += r.budget) }));
  const ratio = (r) => r.rev ? (r.cost ?? r.costProv) / r.rev : null;
  const C = { a: '#C99A2E', f: '#8B6914', p: '#2E7D6B', y: '#6B7280', u: '#B42318' };
  const total = rows.reduce((a, r) => a + r.forecast, 0);
  return demo(' · aktual berhenti pada Oktober (ditutup); November provisional; Desember forecast') + budBar('hrd-bud-trend', params) +
    card('Rasio biaya tenaga kerja bulanan', chart(rows, 'Rasio bulanan', [{ name: 'Aktual', color: C.a, get: (r) => r.m <= 9 ? ratio(r) : null }, { name: 'Forecast', color: C.f, dash: true, get: (r) => r.m >= 9 ? r.forecast / r.revForecast : null }, { name: 'Rencana 25%', color: C.p, get: () => 0.25 }, { name: 'Batas 30%', color: C.u, dash: true, get: () => 0.30 }, { name: '2025', color: C.y, dash: true, get: (r) => prev[r.m].cost / prev[r.m].rev }]) +
      table(['Bulan', 'Revenue', 'Biaya', 'Rasio', '2025', 'Status', 'Rincian'], rows.map(r => [r.name, rp(r.rev ?? r.revForecast), rp(r.cost ?? r.costProv ?? r.forecast), pct(r.rev ? (r.cost ?? r.costProv) / r.rev : r.forecast / r.revForecast), pct(prev[r.m].cost / prev[r.m].rev), esc(r.status), r.m === 9 && MGR() ? link('hrd-payroll' + qs({ period: '2610' }), 'komponen Okt') : r.m === 9 ? link('hrd-bud-plan', 'outlet/divisi') : '—']))) +
    card('Kurva S biaya kumulatif', chart(cumRows, 'Kurva S', [{ name: 'Kumulatif aktual', color: C.a, get: (r) => r.m <= 9 ? r.cum : null }, { name: 'Kumulatif forecast', color: C.f, dash: true, get: (r) => r.m >= 9 ? r.cum : null }, { name: 'Kumulatif pagu', color: C.p, get: (r) => r.cumBud }], (v) => `${(v / 1e9).toFixed(1)} M`) + table(['Bulan', 'Kumulatif biaya', 'Kumulatif pagu'], cumRows.map(r => [r.name, rp(r.cum), rp(r.cumBud)])) + `<p>Titik akhir ${rp(cumRows[11].cum)} = total tahun ${rp(total)} ${Math.abs(cumRows[11].cum - total) < 1 ? chip('Rekonsiliasi ✓', 'ready') : chip('Selisih', 'bad')}</p>`);
}

/* ---------- sidebar & registrasi ---------- */
const items = H.PORTALS.HRD.items;
const set = (route, code, title) => { const it = items.find(i => i[0] === route); if (it) { it[2] = code; it[3] = 'ready'; it[4] = ''; if (title) it[1] = title; } };
set('hrd-payroll', 'F7-NV01'); set('hrd-finance', 'F7-NV06'); set('hrd-cash', 'F7-NV06'); set('hrd-reimburse', 'F7-NV06'); set('hrd-reports', 'F7-NV07'); set('hrd-budget', 'F7-NV09');
const ip = items.findIndex(i => i[0] === 'hrd-payroll');
items.splice(ip + 1, 0, ['hrd-pay-rules', 'Komponen & Aturan', 'F7-NV02', 'ready', '', 'sub'], ['hrd-pay-commission', 'Komisi POS', 'F7-NV03', 'ready', '', 'sub'], ['hrd-pay-process', 'Proses Payroll', 'F7-NV04', 'ready', '', 'sub'], ['hrd-pay-slip', 'Slip & Pembayaran', 'F7-NV05', 'ready', '', 'sub'], ['hrd-pay-handoff', 'Handoff Finance', 'F7-NV08', 'ready', '', 'sub']);
const ib = items.findIndex(i => i[0] === 'hrd-budget');
items.splice(ib + 1, 0, ['hrd-bud-plan', 'Rencana Anggaran', 'F7-NV10', 'ready', '', 'sub'], ['hrd-bud-sim', 'Simulasi Rekrutmen', 'F7-NV11', 'ready', '', 'sub'], ['hrd-bud-trend', 'Tren & Kurva S', 'F7-NV12', 'ready', '', 'sub']);
Object.assign(H.PURPOSE, {
  'hrd-payroll': 'Periode, grup slip, cakupan, jumlah karyawan, total komponen, kelengkapan sumber dan status proses.',
  'hrd-pay-rules': 'Komponen & aturan berversi dengan periode efektif, contoh perhitungan dan template slip.',
  'hrd-pay-commission': 'Komisi dari baris layanan POS: outlet aktual, pembagian Four Hands, refund, penyesuaian.',
  'hrd-pay-process': 'Generate draf, sumber, anomali, review, persetujuan & kunci dengan snapshot dan riwayat.',
  'hrd-pay-slip': 'Pendapatan, potongan, take-home pay, bukti, Siap Bayar vs Sudah Bayar dengan referensi bank.',
  'hrd-finance': 'Kasbon & reimburse: pengajuan, persetujuan, pencairan, cicilan, ledger saldo.',
  'hrd-cash': 'Kasbon: pengajuan, pencairan, cicilan per periode dan saldo.', 'hrd-reimburse': 'Reimburse: bukti, persetujuan, penyelesaian lewat payroll atau kanal lain.',
  'hrd-reports': 'Katalog 19 laporan Payroll, PPh 21/26, BPJS dan Coretax yang merekonsiliasi batch.',
  'hrd-pay-handoff': 'Pemetaan COA, jurnal agregat per cost center, Batch ID stabil, status penerimaan Finance.',
  'hrd-budget': 'Salary Ratio, Total People Cost Ratio, Revenue/Salary per Employee, pagu, forecast dan ruang anggaran.',
  'hrd-bud-plan': 'Anggaran tahunan → kuartal → bulan dengan musim bisnis dan alokasi Office ke outlet (100%).',
  'hrd-bud-sim': 'Simulasi tambah orang/bantuan/outlet baru: asumsi, tahun berjalan vs setahun penuh, Requisition ID F4.',
  'hrd-bud-trend': 'Rasio bulanan, rencana, forecast, tahun lalu dan kurva S biaya kumulatif.'
});
H.SCREENS.push(...[['F7-NV01', 'Dashboard Payroll', 'hrd-payroll'], ['F7-NV02', 'Komponen & Aturan Payroll', 'hrd-pay-rules'], ['F7-NV03', 'Rekonsiliasi Komisi POS', 'hrd-pay-commission'], ['F7-NV04', 'Proses Payroll Periode', 'hrd-pay-process'], ['F7-NV05', 'Slip Gaji & Status Pembayaran', 'hrd-pay-slip?period=2610'], ['F7-NV06', 'Kasbon & Reimburse', 'hrd-finance'], ['F7-NV07', 'Laporan Payroll, Pajak & BPJS', 'hrd-reports'], ['F7-NV08', 'Handoff Finance & Accounting', 'hrd-pay-handoff?period=2610'], ['F7-NV09', 'Dashboard People Budgeting', 'hrd-budget'], ['F7-NV10', 'Rencana Anggaran & Alokasi', 'hrd-bud-plan'], ['F7-NV11', 'Simulasi Rekrutmen & Outlet Baru', 'hrd-bud-sim'], ['F7-NV12', 'Tren Bulanan & Kurva S', 'hrd-bud-trend']].map(([c, t, r]) => [c, 'HRD · ' + t, 'HRD 7', r, 'ready', 'Manager HRD; Finance & Owner agregat']));
register('hrd-payroll', only(dashboard, 'agg'), () => 'Dashboard Payroll');
register('hrd-pay-rules', only(rules), (p) => p.id || 'Komponen & Aturan Payroll');
register('hrd-pay-commission', only(commission), () => 'Rekonsiliasi Komisi POS');
register('hrd-pay-process', only(processPage), () => 'Proses Payroll Periode');
register('hrd-pay-slip', only(slips), (p) => p.emp ? 'Slip Gaji' : 'Slip Gaji & Status Pembayaran');
register('hrd-finance', only(finance), () => 'Kasbon & Reimburse');
register('hrd-cash', only((p) => finance({ ...p, tab: p.tab || 'ksb' })), () => 'Kasbon');
register('hrd-reimburse', only((p) => finance({ ...p, tab: p.tab || 'rmb' })), () => 'Reimburse');
register('hrd-reports', only(reports, 'agg'), (p) => p.item || 'Laporan Payroll, Pajak & BPJS');
register('hrd-pay-handoff', only(handoff, 'fin'), () => 'Handoff Finance & Accounting');
register('hrd-budget', only(budget, 'agg'), () => 'Dashboard People Budgeting');
register('hrd-bud-plan', only(plan, 'agg'), () => 'Rencana Anggaran & Alokasi Divisi');
register('hrd-bud-sim', only(sim, 'agg'), (p) => p.id || 'Simulasi Rekrutmen & Outlet Baru');
register('hrd-bud-trend', only(trend, 'agg'), () => 'Tren Bulanan & Kurva S');
})();
