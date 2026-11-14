/* HAWK ERP · Portal HRD · F5 Manpower Planning & POS — DATA DEMO / SIMULASI.
   NV01 Dashboard Manpower (hrd-manpower) · NV02 Kapasitas Outlet & Shift (hrd-mp-capacity) · NV03 Therapist Utility (hrd-mp-utility) ·
   NV04 Coverage Reception (hrd-mp-reception) · NV05 Beban Kerja Divisi Office (hrd-mp-division) · NV06 Data Layanan POS (hrd-mp-pos) ·
   NV07 Simulasi Kebutuhan & Temuan (hrd-mp-sim) · NV08 Handoff Rekrutmen (hrd-mp-handoff). */
(() => {
const H = window.HL;
const { esc, table, card, qs, link } = H;
const hr = () => { const h = HR.ensure(H.state); HR.EXT.ensure?.(h); return h; };
const f5 = () => hr().f5;
const role = () => H.prefs.role;
const def = () => HR.roleDef(role());
const chip = (t, tone = '') => `<span class="status-chip ${tone}">${esc(t)}</span>`;
const empName = (id) => id ? (hr().people.find(p => p.id === id)?.name || id) : '—';
const pct = (u) => u === null || u === undefined ? '—' : `${(u * 100).toFixed(1).replace('.0', '')}%`;
const jam = (x) => `${Math.round(x * 10) / 10} jam`;
const tabs = (route, cur, list, params = {}, key = 'tab') => `<nav class="tabs" aria-label="Bagian">${list.map(([k, l]) => `<a class="tab${k === cur ? ' on' : ''}" href="#${route}${qs({ ...params, [key]: k })}" ${k === cur ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
const denied = (why) => `<section class="card hr-denied" role="alert"><h2>Akses ditolak</h2><p>${why}</p><div class="actions"><button type="button" class="btn" data-hr-role="hrd">Ganti ke Manager HRD</button><button type="button" class="btn ghost" data-hr-role="hrd-ops">Ganti ke Staf HRD</button></div></section>`;
const register = (id, fn, title, code) => { H.REGISTRY[id] = fn; fn.title = title; if (code) fn.code = code; };
const KC = ['g-teal', 'g-violet', 'g-blue', 'g-gold'];
const kpiLinks = (es) => `<section class="grid g4 keep2 kpis">${es.map(([l, v, h, sub], i) => `<a class="kpi ${KC[i % 4]}" href="${h}"><div class="lbl">${l}</div><div class="val">${v}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</a>`).join('')}</section>`;
const MP_ROLES = ['owner', 'hrd', 'hrd-ops', 'hg-lead', 'ops-manager', 'outlet-spv'];
const staff = () => ['owner', 'hrd', 'hrd-ops'].includes(role());
const guard = (fn) => (p) => MP_ROLES.includes(role()) ? fn(p) : denied(`Role demo <b>${esc(def().label)}</b> tidak punya akses Manpower Planning. Tidak ada data kapasitas yang dimuat.`);
const outlets = () => role() === 'outlet-spv' ? HR.OUTLETS.filter(o => o.id === 'OUT-UBD') : HR.OUTLETS;
const okOutlet = (o) => outlets().some(x => x.id === o);
const period = (p) => p.p === '2610' ? '2610' : 'W46';
const periodBar = (route, params) => `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} Periode: ${['W46', '2610'].map(k => k === period(params) ? `<b>${esc(HR5.PERIODS[k].label)}</b>` : link(route + qs({ ...params, p: k }), HR5.PERIODS[k].label)).join(' · ')} · diperbarui ${esc(HR5.PERIODS[period(params)].updated)} WITA · sumber POS: simulator (UI-ONLY SIMULATION)</p>`;
const st = (u) => { const [l, t] = HR5.status(u); return chip(l, t); };
const outSel = (cur, all = false) => `<label>Outlet<select name="outlet">${all ? '<option value="">Semua</option>' : ''}${outlets().map(o => `<option value="${o.id}" ${o.id === cur ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label>`;
const headcount = (o, posName) => HR.people(hr(), 'hrd', { outlet: o }).filter(p => HR.pos(p.placement.position).name === posName).length;
const openPositions = () => (hr().f4?.reqs || []).filter(r => r.status !== 'Ditolak').map(r => HR5.reqProgress(hr(), r.id)).reduce((s, x) => s + (x?.open || 0), 0);

/* ---------- NV01 Dashboard Manpower ---------- */
function dashboard(params) {
  const P = period(params), h = hr();
  const rows = outlets().map(o => { const u = HR5.outletUtil(h, o.id, P); return [link('hrd-mp-capacity' + qs({ outlet: o.id, p: P }), o.name), link('hrd-roster' + qs({ outlet: o.id, position: 'POS-THR' }), headcount(o.id, 'Therapist')), link('hrd-roster' + qs({ outlet: o.id, position: 'POS-RCP' }), headcount(o.id, 'Receptionist')), jam(u.cap), jam(u.done), link('hrd-mp-utility' + qs({ outlet: o.id, p: P }), pct(u.u)), st(u.u), P === 'W46' ? `${u.ot} jam · ${u.help} jam` : '—']; });
  const office = HR.DIVISIONS.filter(d => d.id !== 'DIV-SPA' && HR.EXPECTED.office[d.id] !== undefined).map(d => { const n = HR.people(h, 'hrd', { division: d.id }).filter(p => p.placement.location === HR.HQ.id).length; const want = HR.EXPECTED.office[d.id]; return [esc(d.name), want ? link('hrd-roster' + qs({ division: d.id }), n) : '<i>headcount belum ditetapkan</i>', want || '—', want ? (n === want ? chip('Sesuai', 'ready') : chip(`Selisih ${n - want}`, 'bad')) : chip('Belum ditetapkan', 'planned'), link('hrd-mp-division' + qs({ div: d.id }), 'Beban kerja')]; });
  const ubud = HR5.outletUtil(h, 'OUT-UBD', P), sht = HR5.outletUtil(h, 'OUT-SHT', P);
  const recGaps = outlets().flatMap(o => HR5.recGaps(o.id).map(g => `${o.name} ${g.shift} ${g.block} (${g.staff} staf, ${g.checkins} check-in, tunggu ${g.wait} mnt)`));
  const alerts = [ubud.u > 1 && okOutlet('OUT-UBD') ? `<li>${chip('Di atas kapasitas', 'bad')} Spa Ubud ${pct(ubud.u)}: ${link('hrd-mp-utility' + qs({ outlet: 'OUT-UBD', p: P }), 'lihat pembilang & penyebut')} · ${link('hrd-mp-sim' + qs({ outlet: 'OUT-UBD' }), 'simulasikan')}</li>` : '', sht.u < 0.7 && okOutlet('OUT-SHT') ? `<li>${chip('Di bawah 70%', 'sandbox')} Spa Shanti ${pct(sht.u)}: ${link('hrd-mp-utility' + qs({ outlet: 'OUT-SHT', p: P }), 'investigasi')} · ${link('hrd-mp-sim' + qs({ outlet: 'OUT-SHT' }), 'simulasikan')}</li>` : '', ...recGaps.map(g => `<li>${chip('Kurang coverage', 'bad')} Reception ${esc(g)}: ${link('hrd-mp-reception', 'lihat blok jam')}</li>`)].filter(Boolean);
  return periodBar('hrd-manpower', params) + kpiLinks([['Headcount aktif', h.people.filter(p => HR.placementOn(h, p.id)).length, '#hrd-roster', '4 outlet + Office'], ['Utility Spa Ubud', pct(ubud.u), '#hrd-mp-utility' + qs({ outlet: 'OUT-UBD', p: P }), HR5.status(ubud.u)[0]], ['Utility Spa Shanti', pct(sht.u), '#hrd-mp-utility' + qs({ outlet: 'OUT-SHT', p: P }), HR5.status(sht.u)[0]], ['Posisi terbuka', openPositions(), '#hrd-mp-handoff', 'dari permintaan tenaga F4']]) +
    (alerts.length ? card('Perlu perhatian', `<ul class="hr-alerts">${alerts.join('')}</ul>`) : '') +
    card('Outlet Spa · therapist & receptionist', table(['Outlet', 'Therapist', 'Receptionist', 'Kapasitas reguler', 'Treatment selesai', 'Utility', 'Status', 'Lembur · bantuan'], rows) + `<p class="muted small">Utility = jam treatment selesai ÷ jam kapasitas reguler. Total = jumlah pembilang ÷ jumlah penyebut (bukan rata-rata persentase). Ambang: &gt;100% di atas kapasitas, &lt;70% di bawah ambang, 70–75% dan 95–100% Pantau.</p>`) +
    (role() === 'outlet-spv' ? '' : card('Office · headcount per divisi', table(['Divisi', 'Aktif', 'Target roster', 'Status', 'Beban kerja'], office) + '<p class="muted small">PC dan Commercial tercatat sebagai divisi tanpa headcount sampai keputusan formasi ditetapkan.</p>'));
}

/* ---------- NV02 Kapasitas Outlet & Shift ---------- */
function capacity(params) {
  const P = period(params), o = okOutlet(params.outlet) ? params.outlet : outlets()[0].id, h = hr();
  const rows = ['Pagi', 'Sore'].map(sh => { const u = HR5.outletUtil(h, o, P, sh); return [P === 'W46' ? link('hrd-mp-capacity' + qs({ outlet: o, p: P, shift: sh }), sh) : sh, jam(u.cap), jam(u.done), pct(u.u), st(u.u), P === 'W46' ? `${u.ot} jam` : '—', P === 'W46' ? `${u.help} jam` : '—', P === 'W46' ? link('hrd-mp-pos' + qs({ outlet: o, shift: sh }), 'Baris POS') : '—']; });
  const tot = HR5.outletUtil(h, o, P);
  rows.push(['<b>Total</b>', `<b>${jam(tot.cap)}</b>`, `<b>${jam(tot.done)}</b>`, `<b>${pct(tot.u)}</b>`, st(tot.u), P === 'W46' ? `${tot.ot} jam` : '—', P === 'W46' ? `${tot.help} jam` : '—', '']);
  let members = '';
  if (params.shift && P === 'W46') {
    const ms = HR5.shiftMembers(h, o, params.shift);
    members = card(`Anggota shift ${esc(params.shift)} · ${esc(HR.locName(o))} · ${ms.length} therapist`, table(['Therapist', 'Outlet induk', 'Jam treatment', 'Lembur', 'Baris layanan'], ms.map(m => [link('hrd-roster' + qs({ emp: m.emp }), `${esc(empName(m.emp))} · ${m.emp}`), m.home === o ? esc(HR.locName(m.home)) : `${chip('Bantuan', 'planned')} ${esc(HR.locName(m.home))}`, jam(m.hours), m.ot ? jam(m.ot) : '—', link('hrd-mp-pos' + qs({ outlet: o, shift: params.shift, emp: m.emp }), m.lines)])));
  }
  return periodBar('hrd-mp-capacity', params) + `<form id="filters" class="filters" aria-label="Filter kapasitas">${outSel(o)}<input type="hidden" name="p" value="${P}"><label>Shift<select name="shift"><option value="">Pilih shift</option>${['Pagi', 'Sore'].map(s => `<option ${s === params.shift ? 'selected' : ''}>${s}</option>`).join('')}</select></label><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    card(`Kapasitas ${esc(HR.locName(o))}`, table(['Shift', 'Kapasitas reguler', 'Treatment selesai', 'Utility', 'Status', 'Lembur', 'Bantuan antaroutlet', 'Bukti'], rows) + `<p class="muted small">Kapasitas reguler = jam bookable terjadwal setelah istirahat, cuti dan jam tidak tersedia (sampel mingguan dummy). ${P === '2610' ? (tot.shiftNote || 'Pembagian shift Oktober diestimasi 52/48 (perlu verifikasi).') : 'Klik shift untuk melihat anggota, termasuk therapist bantuan dari outlet lain.'}</p>`) + members;
}

/* ---------- NV03 Therapist Utility ---------- */
function utility(params) {
  const P = period(params), o = okOutlet(params.outlet) ? params.outlet : outlets()[0].id, h = hr(), u = HR5.outletUtil(h, o, P);
  const shifts = ['Pagi', 'Sore'].map(sh => ({ sh, ...HR5.outletUtil(h, o, P, sh) }));
  const t = (h.f3?.tasks || []).find(x => x.source?.id === `UTIL-${o}-2611`);
  const flag = u.u > 1 || u.u < 0.7;
  const stg = u.u > 1 ? 'Issue' : 'Ide';
  const trace = P === 'W46' ? shifts.map(s => { const reg = s.done - s.ot - s.help; return `<li><b>${s.sh}</b>: ${jam(s.done)} selesai ÷ ${jam(s.cap)} reguler = <b>${pct(s.u)}</b>${s.u > 1 ? ` · kelebihan ${jam(s.done - s.cap)} = lembur ${jam(s.ot)} + bantuan ${jam(s.help)}${reg > s.cap ? ` + ${jam(reg - s.cap)} di jam reguler` : ''}` : ''}</li>`; }).join('') : '';
  const all = outlets().map(x => { const v = HR5.outletUtil(h, x.id, P); return [link('hrd-mp-utility' + qs({ outlet: x.id, p: P }), x.name), jam(v.done), jam(v.cap), pct(v.u), st(v.u)]; });
  const sum = outlets().reduce((a, x) => { const v = HR5.outletUtil(h, x.id, P); a.d += v.done; a.c += v.cap; return a; }, { d: 0, c: 0 });
  all.push(['<b>Gabungan</b>', `<b>${jam(sum.d)}</b>`, `<b>${jam(sum.c)}</b>`, `<b>${pct(sum.d / sum.c)}</b>`, st(sum.d / sum.c)]);
  const action = !flag ? '' : t && HR3.scopeOk(h, role(), t) ? `<p>Temuan sudah tercatat: ${link('hrd-task' + qs({ id: t.id }), t.id)} · ${chip(t.stage, 'planned')} (satu temuan, satu kartu)</p>` : staff() ? `<p><button type="button" class="btn" data-action="hr:task-create" data-ws="HRD" data-stage="${stg}" data-title="Utility ${esc(HR.locName(o))} ${Math.round(u.u * 100)}%: ${u.u > 1 ? 'kapasitas therapist kurang' : 'di bawah ambang 70%'}" data-scope="${o}" data-source-id="UTIL-${o}-2611" data-source-type="Utility" data-source-label="Utility ${esc(HR.locName(o))} · ${Math.round(u.u * 100)}%" data-source-route="hrd-mp-utility?outlet=${o}" data-finding="FND-UTIL-${HR5.OUTCODE[o]}-2611" data-after="hrd-task?id={id}">Tandai sebagai ${stg}</button> ${link('hrd-mp-sim' + qs({ outlet: o }), 'Simulasikan opsi')}</p>` : '';
  return periodBar('hrd-mp-utility', params) + `<form id="filters" class="filters" aria-label="Filter utility">${outSel(o)}<input type="hidden" name="p" value="${P}"><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    kpiLinks([['Utility', pct(u.u), '#hrd-mp-capacity' + qs({ outlet: o, p: P }), HR5.status(u.u)[0]], ['Pembilang · treatment selesai', jam(u.done), P === 'W46' ? '#hrd-mp-pos' + qs({ outlet: o }) : '#hrd-mp-utility' + qs({ outlet: o, p: P }), 'dari baris layanan POS'], ['Penyebut · kapasitas reguler', jam(u.cap), '#hrd-mp-capacity' + qs({ outlet: o, p: P }), 'jam bookable terjadwal'], ['Booking gagal (kapasitas)', P === 'W46' ? u.fails : '—', '#hrd-mp-pos' + qs({ outlet: o, status: 'Batal' }), P === 'W46' ? `${u.cancel} batal · ${u.refund} refund` : 'tidak tersedia']]) +
    card(`Jejak perhitungan · ${esc(HR.locName(o))}`, `${P === 'W46' ? `<ul>${trace}</ul>` : `<p>${jam(u.done)} ÷ (25 therapist × 8 jam × 26 hari = ${jam(u.cap)}) = <b>${pct(u.u)}</b>. Sumber: Beranda F1.</p>`}<p>${st(u.u)} ${HR5.status(u.u)[0] === 'Di atas kapasitas' ? 'Permintaan melebihi kapasitas reguler; ditutup dengan lembur dan bantuan antaroutlet.' : HR5.status(u.u)[0] === 'Di bawah 70%' ? 'Kapasitas tidak terpakai. Periksa pembatalan, jadwal dan permintaan sebelum mengurangi formasi.' : ''}</p>${action}<p class="muted small">Refund tidak mengurangi jam treatment (layanan tetap dilakukan) tetapi mengoreksi komisi di F7. Pembatalan tidak dihitung sebagai treatment selesai. Four Hands dihitung per therapist sesuai alokasi durasi.</p>`) +
    card('Perbandingan outlet', table(['Outlet', 'Selesai', 'Reguler', 'Utility', 'Status'], all));
}

/* ---------- NV04 Coverage Reception ---------- */
function reception(params) {
  const o = okOutlet(params.outlet) ? params.outlet : '';
  const list = outlets().filter(x => !o || x.id === o);
  const rows = list.flatMap(x => ['Pagi', 'Sore'].flatMap(sh => HR5.RECEPTION[x.id][sh].peak.map(([blk, staffN, chk, wait]) => { const hours = HR5.blockHours(blk); const [l, tone] = HR5.recStatus(chk, staffN, hours, wait); return [esc(x.name), sh, blk, staffN, chk, (chk / (staffN * hours)).toFixed(1), `${wait} mnt`, chip(l, tone), link('hrd-roster' + qs({ outlet: x.id, position: 'POS-RCP' }), 'Receptionist')]; })));
  const sum = list.map(x => { const bl = ['Pagi', 'Sore'].flatMap(sh => HR5.RECEPTION[x.id][sh].peak), res = HR5.RECEPTION[x.id].Pagi.res + HR5.RECEPTION[x.id].Sore.res, chk = bl.reduce((a, b) => a + b[2], 0); return [esc(x.name), headcount(x.id, 'Receptionist'), res, chk, `${Math.round(chk / res * 100)}%`, `${Math.round(bl.reduce((a, b) => a + b[2] * b[3], 0) / chk)} mnt`, HR5.recGaps(x.id).length ? chip(`${HR5.recGaps(x.id).length} blok kurang`, 'bad') : chip('Cukup', 'ready')]; });
  return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} Minggu 46 · reservasi & check-in dari simulator POS/reservasi · target ${HR5.REC_TARGET.perHour} check-in per receptionist per jam, tunggu ≤ ${HR5.REC_TARGET.wait} menit</p>` +
    `<form id="filters" class="filters" aria-label="Filter reception">${outSel(o, true)}<button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    card('Ringkasan per outlet · rata-rata per hari', table(['Outlet', 'Receptionist', 'Reservasi', 'Check-in', 'Rasio check-in', 'Tunggu rata-rata', 'Coverage'], sum)) +
    card('Coverage per blok jam', table(['Outlet', 'Shift', 'Blok', 'Staf', 'Check-in', 'Per staf/jam', 'Tunggu', 'Status', 'Roster'], rows) + '<p class="muted small">Kurang coverage bila beban &gt; target per jam atau tunggu rata-rata &gt; 10 menit. Usulan: geser 1 receptionist Pagi ke blok 17–21 atau tambah formasi lewat Simulasi.</p>');
}

/* ---------- NV05 Beban Kerja Divisi Office ---------- */
function division(params) {
  if (role() === 'outlet-spv') return denied('Supervisor outlet tidak melihat beban kerja Office.');
  const h = hr(), tasks = (h.f3?.tasks || []).filter(t => t.ws === 'HRD' || t.ws === 'HG');
  const live = { load: tasks.length + (h.f4?.reqs.length || 0), output: tasks.filter(t => t.stage === 'Selesai').length + (h.f4?.reqs.filter(r => r.status !== 'Menunggu Persetujuan').length || 0) };
  const rows = HR5.DIVISIONS.map(d => { const x = d.live ? { ...d, load: live.load, output: live.output, backlog: live.load - live.output, updated: 'langsung dari F3/F4', slaMet: null } : d; const n = HR.people(h, 'hrd', { division: d.id }).filter(p => p.placement.location === HR.HQ.id).length; return [d.id === params.div ? `<b>${esc(d.name)}</b>` : esc(d.name), link('hrd-roster' + qs({ division: d.id }), n), esc(d.metric), x.load ?? '—', x.output ?? '—', x.backlog ?? '—', esc(d.sla), x.slaMet === null ? '—' : pct(x.slaMet), x.load && n ? (x.load / n).toFixed(1) + ' / orang' : '—', d.complete ? chip('Lengkap', 'ready') : chip('Data belum lengkap', 'sandbox'), `${esc(d.source)} · ${esc(x.updated || '—')}`]; });
  rows.push(['PC', '—', '—', '—', '—', '—', '—', '—', '—', chip('Headcount belum ditetapkan', 'planned'), 'Menunggu keputusan formasi']);
  rows.push(['Commercial', '—', '—', '—', '—', '—', '—', '—', '—', chip('Headcount belum ditetapkan', 'planned'), 'Menunggu keputusan formasi']);
  return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} Beban kerja Office · Minggu 46 · tiap divisi memakai ukuran kerjanya sendiri</p>` +
    card('Beban kerja per divisi', table(['Divisi', 'Headcount', 'Ukuran kerja', 'Masuk', 'Selesai', 'Backlog', 'SLA', 'SLA tercapai', 'Beban', 'Kelengkapan', 'Sumber · update'], rows) + '<p class="muted small">Beban antardivisi tidak dibandingkan langsung karena satuannya berbeda. Divisi dengan data belum lengkap tidak dipakai untuk rekomendasi formasi.</p>');
}

/* ---------- NV06 Data Layanan POS ---------- */
function pos(params) {
  const h = hr(), all = HR5.lines(h).filter(r => okOutlet(r.outlet));
  let rs = all.filter(r => (!params.outlet || r.outlet === params.outlet) && (!params.shift || r.shift === params.shift) && (!params.emp || r.emp === params.emp) && (!params.status || r.status === params.status || r.pay === params.status) && (!params.date || r.date === params.date) && (!params.q || r.tx.includes(params.q.toUpperCase()) || r.line.includes(params.q.toUpperCase())));
  if (params.tx) rs = all.filter(r => r.tx === params.tx);
  const page = Math.max(1, Number(params.page || 1)), per = 40, pages = Math.max(1, Math.ceil(rs.length / per)), slice = rs.slice((page - 1) * per, page * per);
  const opts = (name, pairs, cur, label) => `<label>${label}<select name="${name}"><option value="">Semua</option>${pairs.map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const sel = params.line && all.find(r => r.line === params.line);
  const detail = sel ? card(`Baris layanan ${sel.line}`, table(['Field', 'Nilai'], [['Transaction ID', link('hrd-mp-pos' + qs({ tx: sel.tx }), sel.tx)], ['Service Line ID', sel.line], ['Outlet · shift', `${esc(HR.locName(sel.outlet))} · ${sel.shift}`], ['Therapist', `${link('hrd-roster' + qs({ emp: sel.emp }), esc(empName(sel.emp)))} · outlet induk ${esc(HR.locName(sel.home))}`], ['Tanggal · mulai', `${sel.date} ${sel.start} WITA`], ['Layanan', esc(sel.svc) + (sel.alloc ? ` · alokasi ${sel.alloc.map(e => esc(empName(e))).join(' + ')}` : '')], ['Durasi', `${sel.dur} menit${sel.corrected ? ` · dikoreksi ${sel.corrected}` : ''}`], ['Status · bayar', `${sel.status} · ${sel.pay}${sel.refund ? ` (${sel.refund})` : ''}`], ['Penanda', [sel.ot && 'Lembur', sel.help && 'Bantuan antaroutlet'].filter(Boolean).join(', ') || '—']]) +
    (staff() && sel.status === 'Selesai' ? `<div class="grid g2">${sel.refund ? '' : `<form class="workflow-form" data-submit="hr:pos-refund" data-after="hrd-mp-pos?line=${sel.line}"><input type="hidden" name="line" value="${sel.line}"><label>Alasan refund<input name="reason" value="Keluhan tamu"></label><button class="btn ghost">Catat refund (simulasi POS)</button></form>`}<form class="workflow-form" data-submit="hr:pos-correct" data-after="hrd-mp-pos?line=${sel.line}"><input type="hidden" name="line" value="${sel.line}"><label>Durasi benar (menit)<input type="number" name="dur" min="15" max="240" value="${sel.dur}"></label><label>Alasan koreksi<input name="reason" placeholder="mis. salah input durasi"></label><button class="btn ghost">Koreksi durasi</button></form></div>` : '') +
    `<p class="muted small">Refund tidak mengurangi jam treatment; koreksi durasi mengubah pembilang utility. Keduanya tercatat di ${link('hrd-audit' + qs({ q: sel.tx }), 'Audit')}.</p>`) : '';
  const batches = staff() ? card('Batch POS harian', table(['Batch ID', 'Tanggal', 'Diterima', 'Status', 'Replay', 'Aksi'], f5().batches.map(b => [b.id, b.date, b.received, chip(b.status, /Lengkap/.test(b.status) ? 'ready' : 'sandbox'), b.replays, `<button type="button" class="btn ghost sm" data-action="hr:pos-ingest" data-id="${b.id}">Replay batch</button>`])) + '<p class="muted small">Replay memakai Service Line ID sebagai kunci; baris yang sama tidak dihitung dua kali. Endpoint POS produksi: NEW INTEGRATION REQUIRED.</p>') : '';
  return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} Minggu 46 · ${all.length} baris layanan simulator POS · ${rs.length} sesuai filter</p>` +
    `<form id="filters" class="filters" aria-label="Filter POS">${opts('outlet', outlets().map(o => [o.id, o.name]), params.outlet, 'Outlet')}${opts('shift', [['Pagi', 'Pagi'], ['Sore', 'Sore']], params.shift, 'Shift')}${opts('date', HR5.WEEK.map(d => [d, d]), params.date, 'Tanggal')}${opts('status', [['Selesai', 'Selesai'], ['Batal', 'Batal'], ['Refund', 'Refund']], params.status, 'Status')}${params.emp ? `<input type="hidden" name="emp" value="${esc(params.emp)}">` : ''}<label>Cari<input name="q" value="${esc(params.q || '')}" placeholder="Transaction / Line ID"></label><button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` +
    (params.emp ? `<p class="active-filters">Therapist: ${esc(empName(params.emp))} · ${link('hrd-mp-pos' + qs({ ...params, emp: '' }), 'hapus filter')}</p>` : '') + detail +
    card(params.tx ? `Transaksi ${esc(params.tx)}` : `Baris layanan · halaman ${page}/${pages}`, slice.length ? table(['Service Line ID', 'Tanggal', 'Outlet · shift', 'Therapist', 'Layanan', 'Durasi', 'Status', 'Bayar'], slice.map(r => [link('hrd-mp-pos' + qs({ ...params, line: r.line }), r.line), `${r.date} ${r.start}`, `${esc(HR.locName(r.outlet))} · ${r.shift}`, esc(empName(r.emp)) + (r.help ? ` ${chip('Bantuan', 'planned')}` : '') + (r.ot ? ` ${chip('Lembur', 'sandbox')}` : ''), esc(r.svc), `${r.dur} mnt`, r.status, r.pay])) + (pages > 1 && !params.tx ? `<p>${page > 1 ? link('hrd-mp-pos' + qs({ ...params, page: page - 1, line: '' }), '← Sebelumnya') : ''} ${page < pages ? link('hrd-mp-pos' + qs({ ...params, page: page + 1, line: '' }), 'Berikutnya →') : ''}</p>` : '') : '<p>Tidak ada baris layanan untuk filter ini.</p>') + batches;
}

/* ---------- NV07 Simulasi Kebutuhan & Temuan ---------- */
function sim(params) {
  const h = hr(), o = okOutlet(params.outlet) ? params.outlet : 'OUT-UBD';
  const scs = f5().scenarios.filter(s => okOutlet(s.outlet));
  const s = params.id && scs.find(x => x.id === params.id);
  const u = HR5.outletUtil(h, o);
  const cmp = ['bantuan', 'shift', 'formasi'].map(opt => { const r = HR5.simulate(h, o, opt, { from: 'OUT-SHT' }); return [opt === 'bantuan' ? 'Bantuan antaroutlet' : opt === 'shift' ? 'Geser shift' : 'Tambah formasi', esc(r.why), pct(r.base.u), pct(r.after.u), jam(r.base.gap), jam(r.after.gap), st(r.after.u)]; });
  const form = staff() ? card('Simpan skenario', `<form class="workflow-form" data-submit="hr:sim-save" data-after="hrd-mp-sim?id={id}"><input type="hidden" name="outlet" value="${o}"><label>Opsi<select name="option"><option value="formasi">Tambah formasi therapist</option><option value="bantuan">Bantuan antaroutlet</option><option value="shift">Geser shift</option></select></label><label>Jumlah orang (formasi)<input type="number" name="count" min="1" max="10" value="2"></label><label>Jam (bantuan/geser)<input type="number" name="hours" min="1" max="80" value="16"></label><label>Bantuan dari<select name="from">${HR.OUTLETS.filter(x => x.id !== o).map(x => `<option value="${x.id}" ${x.id === 'OUT-SHT' ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label><label>Mulai efektif<input type="date" name="start" value="2026-12-01"></label><button class="btn">Simpan skenario</button></form><p class="muted small">Simulasi tidak mengubah jadwal atau formasi. Persetujuan oleh Manager HRD; AI tidak menyetujui.</p>`) : '';
  const detail = s ? card(`Skenario ${s.id} · ${esc(HR.locName(s.outlet))} · ${chip(s.status, s.status === 'Disetujui' ? 'ready' : s.status === 'Ditolak' ? 'bad' : 'sandbox')}`, table(['', 'Sebelum', 'Sesudah'], [['Kapasitas reguler', jam(s.result.base.cap), jam(s.result.after.cap)], ['Treatment (permintaan)', jam(s.result.base.done), jam(s.result.after.done)], ['Gap (permintaan − kapasitas)', jam(s.result.base.gap), jam(s.result.after.gap)], ['Utility', pct(s.result.base.u), pct(s.result.after.u)]]) +
    `<p><b>${esc(s.result.why)}</b></p><p>Asumsi:</p><ul>${s.result.assume.map(a => `<li>${esc(a)}</li>`).join('')}</ul><p>Bukti:</p><ul>${s.result.evidence.map(a => `<li>${esc(a)}</li>`).join('')}</ul><p>Finding ID: ${esc(s.finding)} · dibuat ${esc(s.at)} oleh ${esc(s.by)}${s.approver ? ` · ${s.status.toLowerCase()} oleh ${esc(s.approver)}` : ''}</p>` +
    `<div class="actions">${s.task ? `Kartu: ${link('hrd-task' + qs({ id: s.task }), s.task)}` : staff() ? ['Ide', 'Issue', 'Workplan'].map(g => `<button type="button" class="btn ghost sm" data-action="hr:sim-mark" data-id="${s.id}" data-stage="${g}" data-after="hrd-mp-sim?id=${s.id}">Tandai ${g}</button>`).join(' ') : ''} ${s.status === 'Draf' && ['owner', 'hrd'].includes(role()) ? `<button type="button" class="btn sm" data-action="hr:sim-approve" data-id="${s.id}">Setujui</button> <button type="button" class="btn ghost sm" data-action="hr:sim-approve" data-id="${s.id}" data-decision="reject">Tolak</button>` : ''} ${s.status === 'Disetujui' && s.option === 'formasi' ? link('hrd-mp-handoff' + qs({ id: s.id }), 'Lanjut ke Handoff Rekrutmen') : ''}</div>`) : '';
  return `<p class="active-filters">${chip('SIMULASI', 'sandbox')} Basis Minggu 46 · ${esc(HR.locName(o))} utility ${pct(u.u)} · ${link('hrd-mp-utility' + qs({ outlet: o }), 'bukti utility')}</p>` +
    `<form id="filters" class="filters" aria-label="Pilih outlet">${outSel(o)}<button type="button" class="btn ghost" data-action="filter-reset">Reset</button></form>` + detail +
    card(`Bandingkan opsi · ${esc(HR.locName(o))}`, table(['Opsi', 'Asumsi utama', 'Utility sebelum', 'Utility sesudah', 'Gap sebelum', 'Gap sesudah', 'Status sesudah'], cmp) + '<p class="muted small">Gap positif = permintaan melebihi kapasitas reguler. Formasi baru menambah permintaan yang sebelumnya gagal dipesan (1,5 jam per booking gagal).</p>') + form +
    card(`Skenario tersimpan · ${scs.length}`, scs.length ? table(['Scenario ID', 'Outlet', 'Opsi', 'Utility sesudah', 'Status', 'Kartu', 'Permintaan'], scs.map(x => [link('hrd-mp-sim' + qs({ id: x.id }), x.id), esc(HR.locName(x.outlet)), x.option, pct(x.result.after.u), x.status, x.task ? link('hrd-task' + qs({ id: x.task }), x.task) : '—', x.req ? link('hrd-rec-manage', x.req) : '—'])) : '<p>Belum ada skenario. Simpan dari formulir di atas.</p>');
}

/* ---------- NV08 Handoff Rekrutmen ---------- */
function handoff(params) {
  const h = hr(), scs = f5().scenarios.filter(s => okOutlet(s.outlet) && s.option === 'formasi' && s.status === 'Disetujui');
  const s = params.id && scs.find(x => x.id === params.id);
  const reqs = (h.f4?.reqs || []).filter(r => okOutlet(r.outlet) || staff()).map(r => HR5.reqProgress(h, r.id)).filter(Boolean);
  const form = s && !s.req && staff() ? card(`Kirim ${s.id} ke Rekrutmen`, `<form class="workflow-form" data-submit="hr:mp-handoff" data-after="hrd-mp-handoff?id=${s.id}"><input type="hidden" name="id" value="${s.id}"><p>${esc(HR.locName(s.outlet))} · Therapist × ${esc(s.params.count || 2)} · dibutuhkan ${esc(s.params.start || '2026-12-01')} · ${esc(s.finding)}${s.task ? ` · ${s.task}` : ''}</p><label>Shift<select name="shift"><option>Pagi/Sore</option><option>Pagi</option><option>Sore</option></select></label><label>Skill<input name="skills" value="Balinese, hot stone"></label><button class="btn">Kirim permintaan tenaga</button></form><p class="muted small">Mengirim ulang tidak membuat permintaan ganda. Permintaan tetap melewati persetujuan Operational Manager → Manager HRD di F4.</p>`) : '';
  return `<p class="active-filters">${chip('DATA DEMO', 'sandbox')} Kebutuhan disetujui → permintaan tenaga F4 → lowongan → penempatan. Posisi terbuka = formasi − penempatan aktif.</p>` + form +
    card(`Skenario disetujui · ${scs.length}`, scs.length ? table(['Scenario ID', 'Outlet', 'Formasi', 'Butuh', 'Disetujui', 'Permintaan', 'Aksi'], scs.map(x => [link('hrd-mp-sim' + qs({ id: x.id }), x.id), esc(HR.locName(x.outlet)), x.params.count || 2, x.params.start || '2026-12-01', esc(x.approver || '—'), x.req ? link('hrd-rec-manage', x.req) : '—', x.req ? '—' : staff() ? link('hrd-mp-handoff' + qs({ id: x.id }), 'Kirim') : '—'])) : `<p>Belum ada skenario formasi yang disetujui. Mulai dari ${link('hrd-mp-sim', 'Simulasi')}.</p>`) +
    card('Progres permintaan tenaga', reqs.length ? table(['Requisition ID', 'Outlet', 'Formasi', 'Sumber', 'Status', 'Lowongan', 'Lamaran', 'Penempatan aktif', 'Posisi terbuka'], reqs.map(x => [x.req.id, esc(HR.locName(x.req.outlet)), x.req.count, esc(x.req.source) + (x.req.scenario ? ` · ${link('hrd-mp-sim' + qs({ id: x.req.scenario }), x.req.scenario)}` : ''), chip(x.req.status, x.req.status === 'Disetujui' ? 'ready' : x.req.status === 'Ditolak' ? 'bad' : 'sandbox'), x.vac ? `${link('hrd-career-job' + qs({ id: x.vac.id }), x.vac.id)} · ${esc(x.vac.status)}` : '—', x.vac ? link('hrd-rec-candidates' + qs({ vac: x.vac.id }), x.apps) : 0, x.placed, `<b>${x.open}</b>`])) : '<p>Belum ada permintaan tenaga.</p>');
}

/* ---------- sidebar & registrasi ---------- */
const items = H.PORTALS.HRD.items;
const it = items.find(i => i[0] === 'hrd-manpower'); if (it) { it[2] = 'F5-NV01'; it[3] = 'ready'; it[4] = ''; }
const ix = items.findIndex(i => i[0] === 'hrd-manpower');
items.splice(ix + 1, 0, ['hrd-mp-capacity', 'Kapasitas Outlet & Shift', 'F5-NV02', 'ready', '', 'sub'], ['hrd-mp-utility', 'Therapist Utility', 'F5-NV03', 'ready', '', 'sub'], ['hrd-mp-reception', 'Coverage Reception', 'F5-NV04', 'ready', '', 'sub'], ['hrd-mp-division', 'Beban Kerja Office', 'F5-NV05', 'ready', '', 'sub'], ['hrd-mp-pos', 'Data Layanan POS', 'F5-NV06', 'ready', '', 'sub'], ['hrd-mp-sim', 'Simulasi Kebutuhan', 'F5-NV07', 'ready', '', 'sub'], ['hrd-mp-handoff', 'Handoff Rekrutmen', 'F5-NV08', 'ready', '', 'sub']);
Object.assign(H.PURPOSE, {
  'hrd-manpower': 'Headcount, kapasitas dan utility per outlet, headcount Office per divisi, dan peringatan yang bisa ditelusuri.',
  'hrd-mp-capacity': 'Kapasitas reguler dan treatment selesai per outlet × shift. Klik shift untuk anggota, termasuk bantuan outlet lain.',
  'hrd-mp-utility': 'Pembilang, penyebut dan transaksi di balik utility. Ambang 70% dan 100% dengan status Pantau.',
  'hrd-mp-reception': 'Reservasi, check-in, waktu tunggu dan coverage receptionist per blok jam.',
  'hrd-mp-division': 'Beban kerja Office per divisi dengan ukuran, SLA, sumber dan kelengkapan data.',
  'hrd-mp-pos': 'Baris layanan POS dengan Transaction ID & Service Line ID, refund, koreksi dan replay batch tanpa duplikat.',
  'hrd-mp-sim': 'Bandingkan opsi bantuan, geser shift dan tambah formasi; tandai temuan ke Planner; persetujuan Manager HRD.',
  'hrd-mp-handoff': 'Kirim kebutuhan disetujui ke Rekrutmen F4 dan pantau sampai penempatan; posisi terbuka turun saat penempatan aktif.'
});
H.SCREENS.push(...[['F5-NV01', 'Dashboard Manpower', 'hrd-manpower'], ['F5-NV02', 'Kapasitas Outlet & Shift', 'hrd-mp-capacity?outlet=OUT-UBD&shift=Pagi'], ['F5-NV03', 'Therapist Utility', 'hrd-mp-utility?outlet=OUT-UBD'], ['F5-NV04', 'Coverage Reception', 'hrd-mp-reception'], ['F5-NV05', 'Beban Kerja Divisi Office', 'hrd-mp-division'], ['F5-NV06', 'Data Layanan POS', 'hrd-mp-pos'], ['F5-NV07', 'Simulasi Kebutuhan & Temuan', 'hrd-mp-sim'], ['F5-NV08', 'Handoff Rekrutmen', 'hrd-mp-handoff']].map(([c, t, r]) => [c, 'HRD · ' + t, 'HRD 5', r, 'ready', 'Manager HRD, Staf HRD, OM, Supervisor (Ubud)']));
register('hrd-manpower', guard(dashboard), () => 'Dashboard Manpower');
register('hrd-mp-capacity', guard(capacity), () => 'Kapasitas Outlet & Shift');
register('hrd-mp-utility', guard(utility), () => 'Therapist Utility');
register('hrd-mp-reception', guard(reception), () => 'Coverage Reception');
register('hrd-mp-division', guard(division), () => 'Beban Kerja Divisi Office');
register('hrd-mp-pos', guard(pos), () => 'Data Layanan POS');
register('hrd-mp-sim', guard(sim), (p) => p.id ? `Skenario ${p.id}` : 'Simulasi Kebutuhan & Temuan');
register('hrd-mp-handoff', guard(handoff), () => 'Handoff Rekrutmen');
})();
