/* HAWK Mobile · preview M1 (NB Addendum 14 Nov 2026) — VISUAL HTML + SIMULASI R&D, bukan aplikasi Android/iOS terpasang.
   Lima menu: Beranda, Pekerjaan, Presensi, Inbox (Chat · Notifikasi · Approval), Saya. Isi mengikuti peran akun.
   Presensi: pemberitahuan → lokasi → kamera (liveness + 1:1) → hasil, dengan state Terverifikasi / Menunggu sinkronisasi /
   Perlu pemeriksaan, jalur "Ajukan presensi dengan pemeriksaan", offline + sinkronisasi, dan idempotensi per sesi.
   Kondisi kamera/lokasi/jaringan/jam HP diatur di panel Simulator R&D. Model: hrd-mobile-model.js (HRM). */
(() => {
const H = window.HL;
const { esc, qs } = H;
const KEY = 'hawk-integrated-demo-v1', UIKEY = 'hawk-mobile-ui-v1';
const hr = () => { const h = HR.ensure(H.state); HR.EXT.ensure?.(h); return h; };
const chip = (t, tone = '') => `<span class="status-chip ${tone}">${esc(t)}</span>`;
const TONE = { Terverifikasi: 'ready', 'Menunggu sinkronisasi': 'sandbox', 'Perlu pemeriksaan': 'warn', Ditolak: 'bad', Bekerja: 'ready', Istirahat: 'sandbox', 'Selesai kerja': 'ready', 'Belum masuk': '', Hadir: 'ready', Terlambat: 'warn', 'Perlu Pemeriksaan': 'warn', Disetujui: 'ready', 'Menunggu Persetujuan': 'sandbox' };
const tone = (s) => TONE[s] || '';
const ini = (n) => String(n).split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const nameOf = (emp) => (hr().people.find(p => p.id === emp) || {}).name || emp;
let ui = { face: 'ok', loc: 'ok', net: 'online', clock: 'ok', flow: null, inbox: 'chat', conv: null, msg: null, err: null, ok: null };
try { Object.assign(ui, JSON.parse(localStorage.getItem(UIKEY) || '{}'), { flow: null, err: null, ok: null }); } catch (e) { /* abaikan */ }
const saveUi = () => { try { const { flow, err, ok, ...keep } = ui; localStorage.setItem(UIKEY, JSON.stringify(keep)); } catch (e) { /* abaikan */ } };
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(H.state)); } catch (e) { /* abaikan */ } };
const cur = (params) => HRM.acc(params.as) || HRM.ACCOUNTS[0];
const go = (patch) => { const { id, params } = H.parseHash(); H.go(id, { ...params, ...patch }); };

function act(a, action, input = {}) {
  try {
    const r = HR.update(H.state, action, { role: a.role, account: a.id, by: `${nameOf(a.emp)} (${a.job})`, ...input });
    persist(); ui.err = null; ui.ok = typeof r === 'string' ? r : 'Tersimpan'; return r;
  } catch (e) { ui.err = e.message; ui.ok = null; return null; }
}

/* ---------- bagian layar ---------- */
const TABS = [['home', 'Beranda', 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z'], ['work', 'Pekerjaan', 'M4 7h16v13H4zM9 7V4h6v3'], ['att', 'Presensi', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5v5l3 3'], ['inbox', 'Inbox', 'M4 5h16v11H8l-4 4z'], ['me', 'Saya', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0']];
const icon = (d) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const btn = (label, data, cls = '') => `<button type="button" class="mob-btn ${cls}" ${Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${label}</button>`;
const sect = (title, body, extra = '') => `<section class="mob-card">${title ? `<h3>${title}${extra}</h3>` : ''}${body}</section>`;
const msgBar = () => (ui.err ? `<p class="mob-alert bad" role="alert">${esc(ui.err)}</p>` : '') + (ui.ok ? `<p class="mob-alert ok" role="status">${esc(ui.ok)}</p>` : '');

function header(a) {
  const h = hr(), pl = HR.placementOn(h, a.emp), loc = pl ? HR.locName(pl.location) : '—';
  return `<header class="mob-head"><span class="mob-av" aria-hidden="true">${ini(nameOf(a.emp))}</span><span><b>${esc(nameOf(a.emp))}</b><small>${esc(a.job)} · ${esc(loc)}</small></span><span class="mob-clock" title="Jam demo (WITA)">${esc(h.mob.clock)} WITA</span></header>`;
}
function attCard(a, big = true) {
  const h = hr(), p = HRM.phase(h, a.emp), site = HRM.siteOf(h, a.emp), nx = HRM.NEXT[p.phase] || [];
  const ps = HRM.punchesOf(h, a.emp), pend = ps.filter(x => HRM.pStatus(h, x) === 'Menunggu sinkronisasi').length;
  return `<section class="mob-card mob-att${big ? ' big' : ''}"><div class="mob-att-top"><span><small>Shift hari ini · Jumat 13 Nov</small><b>${esc(p.shift)}${p.hours ? ` · ${p.hours.join('–')}` : ''}</b><small>${esc(site.name)}</small></span>${chip(p.phase + (p.pending && !['Belum masuk'].includes(p.phase) ? ' · belum final' : ''), p.pending ? 'warn' : tone(p.phase))}</div>
    ${p.att.in ? `<p class="mob-times"><span>Masuk <b>${esc(p.att.in)}</b></span><span>Keluar <b>${esc(p.att.out || '—')}</b></span><span>Istirahat <b>${p.att.breakMin || 0} mnt</b></span></p>` : ''}
    ${pend ? `<p class="mob-alert warn">${pend} kejadian menunggu sinkronisasi · belum diverifikasi ${btn('Sinkronkan', { m: 'sync' }, 'sm ghost')}</p>` : ''}
    <div class="mob-actions">${nx.map((k, i) => btn(HRM.KIND[k], { m: 'flow', kind: k }, i ? 'ghost' : 'primary')).join('')}${!nx.length ? `<p class="muted small">Tidak ada aksi presensi untuk status ini.</p>` : ''}</div>
    ${nx.length ? `<p class="small">${btn('Ajukan presensi dengan pemeriksaan', { m: 'flow', kind: nx[0], manual: 1 }, 'link')}</p>` : ''}</section>`;
}

function home(a) {
  const h = hr(), my = HR3.visible(h, a.role).filter(t => t.pic === a.emp && t.stage !== 'Selesai'), focus = HR3.focusOf(h, a.emp);
  const ann = h.mob.msgs.filter(m => m.conv === 'ANN').slice(-1)[0];
  const mine = h.queue.filter(q => q.emp === a.emp).slice(0, 3);
  const appr = h.queue.filter(q => HR2.canDecide(h, a.role, q));
  return attCard(a) +
    sect('My Day', (focus.length ? focus : my).slice(0, 3).map(t => `<a class="mob-row" href="#hrd-mobile${qs({ as: a.id, tab: 'work', task: t.id })}"><span><b>${esc(t.title)}</b><small>${t.id} · ${esc(t.stage)}${t.due ? ' · tenggat ' + t.due.slice(5) : ''}</small></span>›</a>`).join('') || '<p class="muted small">Belum ada tugas hari ini.</p>') +
    (appr.length ? sect('Perlu keputusan Anda', `<a class="mob-row" href="#hrd-mobile${qs({ as: a.id, tab: 'inbox', sub: 'approval' })}"><span><b>${appr.length} pengajuan</b><small>${esc(appr[0].type)} · ${esc(nameOf(appr[0].emp))}</small></span>›</a>`) : '') +
    (ann ? sect('Pengumuman', `<p class="small">${esc(ann.text)}</p><p class="tiny muted">${esc(nameOf(ann.from))} · ${esc(ann.at)}</p>`) : '') +
    sect('Pengajuan saya', mine.length ? mine.map(q => `<div class="mob-row"><span><b>${esc(q.type)}</b><small>${q.id} · ${esc(q.note || '')}</small></span>${chip(q.status, tone(q.status))}</div>`).join('') : '<p class="muted small">Tidak ada pengajuan.</p>') +
    `<nav class="mob-quick" aria-label="Pintasan">${[['Kalender', 'work'], ['Timeline', 'inbox'], ['Direktori tim', 'me'], ['Perusahaan', 'me']].map(([l, t]) => `<a href="#hrd-mobile${qs({ as: a.id, tab: t })}">${l}</a>`).join('')}</nav>`;
}

/* ---------- Pekerjaan ---------- */
const BOOK = [['BK-1113-014', '10:00', 'Balinese Massage 90 mnt', 'R3', 'EMP-0008', 'Tamu VIP (nama samaran)'], ['BK-1113-019', '13:30', 'Hot Stone 60 mnt', 'R1', 'EMP-0008', 'Tamu walk-in'], ['BK-1113-022', '15:00', 'Four Hands 90 mnt', 'R4', 'EMP-0010', 'Tamu hotel partner']];
function spaOps(a) {
  const h = hr(), o = h.mob.ops;
  if (a.kind === 'therapist') return sect('Treatment saya · Spa Ubud', BOOK.filter(b => b[4] === a.emp).map(([id, t, svc, room, , g]) => { const s = o.svc[id] || {}; return `<div class="mob-row col"><span><b>${t} · ${esc(svc)}</b><small>${id} · Ruang ${room.slice(1)} · ${esc(g)}</small></span><span class="mob-inline">${s.done ? chip(`Selesai ${s.done}`, 'ready') : s.start ? chip(`Berjalan sejak ${s.start}`, 'sandbox') : chip('Belum mulai')}${!s.start ? btn('Mulai treatment', { m: 'ops', op: 'svc-start', ref: id }, 'sm') : !s.done ? btn('Selesai treatment', { m: 'ops', op: 'svc-done', ref: id }, 'sm') : ''}</span></div>`; }).join('') + '<p class="tiny muted">Mulai treatment ≠ check-in kerja ≠ check-in tamu. Penyelesaian treatment bukan bukti pembayaran; status bayar dari POS. UI-ONLY SIMULATION.</p>');
  if (a.kind === 'reception') return sect('Reservasi hari ini · Spa Ubud', BOOK.map(([id, t, svc, room, th, g]) => { const gs = o.guests[id] || {}, s = o.svc[id] || {}; return `<div class="mob-row col"><span><b>${t} · ${esc(g)}</b><small>${id} · ${esc(svc)} · Ruang ${room.slice(1)} · ${esc(nameOf(th))}</small></span><span class="mob-inline">${gs.in ? chip(`Tamu tiba ${gs.in}`, 'ready') : btn('Check-in tamu', { m: 'ops', op: 'guest-in', ref: id }, 'sm')}${gs.paid ? chip('POS ditutup', 'ready') : gs.in ? btn('Tutup transaksi POS', { m: 'ops', op: 'pos-close', ref: id }, 'sm ghost') : ''}${s.done ? '' : gs.in ? chip('Treatment belum selesai') : ''}</span></div>`; }).join('') + '<p class="tiny muted">Refund, diskon dan perubahan transaksi mengikuti izin & approval POS yang berlaku. Semua pembayaran simulasi.</p>');
  if (a.kind === 'attendant') return sect('Kesiapan ruangan', Object.entries(o.rooms).map(([r, st]) => `<div class="mob-row"><span><b>Ruang ${r.slice(1)}</b><small>${esc(st)}</small></span><span class="mob-inline">${['Siap', 'Dibersihkan', 'Perlu linen'].filter(x => x !== st).map(x => btn(x, { m: 'ops', op: 'room', ref: r, to: x }, 'sm ghost')).join('')}</span></div>`).join('') + (a.label ? `<p class="tiny muted">${esc(a.label)}</p>` : ''));
  if (a.kind === 'supervisor') {
    const team = h.people.filter(p => (HR.placementOn(h, p.id) || {}).location === 'OUT-UBD').map(p => ({ p, at: HR2.attendance(h, p.id, HR.TODAY) }));
    const c = (f) => team.filter(f).length;
    return sect('Kontrol shift · Spa Ubud', `<div class="mob-kpi"><span><b>${c(x => ['Hadir', 'Terlambat'].includes(x.at.status))}</b>hadir</span><span><b>${c(x => x.at.status === 'Terlambat')}</b>terlambat</span><span><b>${c(x => x.at.status === 'Perlu Pemeriksaan')}</b>perlu periksa</span><span><b>${c(x => x.at.status === 'Belum Ada Status')}</b>belum masuk</span></div>` +
      team.filter(x => x.at.status !== 'Libur').slice(0, 8).map(x => `<div class="mob-row"><span><b>${esc(x.p.name)}</b><small>${esc(HR.pos(HR.placementOn(h, x.p.id).position).name)} · ${esc(x.at.shift)}${x.at.in ? ' · masuk ' + x.at.in : ''}</small></span>${chip(x.at.status, tone(x.at.status))}</div>`).join('') + `<p class="tiny muted">Dari catatan presensi F2 yang sama dengan HRD. ${team.length} orang Spa Ubud.</p>`) +
      sect('Ruangan', Object.entries(o.rooms).map(([r, st]) => `<span class="mob-pill">${r.slice(1)}: ${esc(st)}</span>`).join(' '));
  }
  const q = h.queue.filter(x => x.status === 'Menunggu Persetujuan');
  return sect('Antrean layanan HRD', `<p class="small">${q.length} pengajuan menunggu · ${HR3.visible(h, a.role).filter(t => t.stage === 'Review').length} kartu di Review</p><p class="tiny muted">Penyusunan kompleks, olah data, konfigurasi dan laporan mendalam tetap di portal desktop HRD.</p>`);
}
function taskDetail(a, id) {
  const h = hr(), t = HR3.visible(h, a.role).find(x => x.id === id) || (HR3.ensure(h).tasks.find(x => x.id === id && [x.pic, ...x.contributors].includes(a.emp)));
  if (!t) return sect('Kartu tidak tersedia', '<p class="small">Kartu di luar cakupan akun ini.</p>');
  const own = [t.pic, ...t.contributors].includes(a.emp) || ['hrd', 'hrd-ops', 'outlet-spv'].includes(a.role);
  return `<p><a class="mob-back" href="#hrd-mobile${qs({ as: a.id, tab: 'work' })}">‹ Pekerjaan</a></p>` + sect(esc(t.title), `<p class="small">${t.id} · ${esc((HR3.WS[t.ws] || {}).name || t.ws)} · PIC ${esc(t.pic ? nameOf(t.pic) : '—')}${t.due ? ' · tenggat ' + t.due : ''}</p><p>${chip(t.stage, t.stage === 'Selesai' ? 'ready' : 'sandbox')}</p>
    ${t.source ? `<p class="tiny muted">Sumber: ${esc(t.source.label)}</p>` : ''}
    ${t.checklist.length ? `<h4>Tasks & Checklist</h4>${t.checklist.map(c => `<label class="mob-check"><input type="checkbox" data-m="check" data-id="${t.id}" data-item="${c.id}" ${c.done ? 'checked' : ''} ${own ? '' : 'disabled'}> ${esc(c.text)}</label>`).join('')}` : ''}
    ${own ? `<form class="mob-form" data-mform="move"><input type="hidden" name="id" value="${t.id}"><label>Pindahkan ke<select name="to">${HR3.STAGES.filter(s => s !== t.stage).map(s => `<option>${s}</option>`).join('')}</select></label><button class="mob-btn primary">Pindahkan</button></form>` : '<p class="tiny muted">Hanya PIC/kontributor yang memindahkan kartu ini.</p>'}
    <h4>Activity & History</h4>${(HR3.ensure(h).events || []).filter(e => e.task === t.id).slice(-4).reverse().map(e => `<p class="tiny">${esc(e.at)} · ${esc(e.by)} · ${esc(e.kind)}${e.after ? ' → ' + esc(e.after) : ''}</p>`).join('') || '<p class="tiny muted">Belum ada aktivitas.</p>'}`);
}
function work(a, params) {
  if (params.task) return taskDetail(a, params.task);
  const h = hr(), mine = HR3.visible(h, a.role).filter(t => t.pic === a.emp || t.contributors.includes(a.emp)), list = mine.length ? mine : [];
  const extra = HR3.ensure(h).tasks.filter(t => [t.pic, ...t.contributors].includes(a.emp) && !list.includes(t));
  const all = [...list, ...extra];
  return spaOps(a) + sect('My Tasks', all.length ? all.map(t => `<a class="mob-row" href="#hrd-mobile${qs({ as: a.id, tab: 'work', task: t.id })}"><span><b>${esc(t.title)}</b><small>${t.id} · ${esc(t.stage)}${t.checklist.length ? ` · ${t.checklist.filter(c => c.done).length}/${t.checklist.length}` : ''}</small></span>›</a>`).join('') : '<p class="muted small">Tidak ada tugas.</p>') +
    sect('Kalender kerja', HR3.agenda(h, a.role).concat(all.filter(t => t.sessionAt).map(t => ({ date: t.sessionAt.slice(0, 10), time: t.sessionAt.slice(11), title: t.title, kind: 'Sesi' }))).filter((x, i, arr) => arr.findIndex(y => y.title === x.title && y.date === x.date) === i).sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time)).slice(0, 4).map(e => `<p class="small">${e.date.slice(5)} ${e.time} · ${esc(e.kind)} · ${esc(e.title)}</p>`).join('') || '<p class="muted small">Tidak ada agenda.</p>') +
    sect('SOP', '<p class="small">SOP kebersihan ruang treatment v3 · SOP hot stone v2 (baca saja)</p>');
}

/* ---------- Presensi ---------- */
function attTab(a) {
  const h = hr(), ps = HRM.punchesOf(h, a.emp).slice().reverse();
  const hist = HR2.DAYS.slice().reverse().map(d => ({ d, r: HR2.attendance(h, a.emp, d) }));
  return attCard(a, false) +
    sect('Bukti presensi hari ini', ps.length ? ps.map(p => { const st = HRM.pStatus(h, p); return `<div class="mob-proof"><div class="mob-row"><span><b>${esc(HRM.KIND[p.kind])} · ${esc(p.serverAt || p.deviceAt)} ${p.zone}</b><small>${p.id} · ${esc(HR.locName(p.site) || p.site)} · shift ${esc(p.shift)}</small></span>${chip(st, tone(st))}</div>${p.reasons && p.reasons.length ? `<ul class="tiny">${p.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}<p class="tiny muted">Waktu server ${esc(p.serverAt || '—')} · waktu ambil ${esc(p.captureAt)} · waktu HP ${esc(p.deviceAt)}${p.receivedAt ? ' · diterima ' + esc(p.receivedAt) : ''}${p.reqId ? ' · ' + p.reqId : ''}</p></div>`; }).join('') : '<p class="muted small">Belum ada kejadian presensi dari HAWK Mobile hari ini.</p>') +
    sect('Histori 7 hari', hist.map(({ d, r }) => `<div class="mob-row"><span><b>${HR2.DOW[HR2.dow(d)]} ${d.slice(8)}/${d.slice(5, 7)}</b><small>${esc(r.shift)}${r.in ? ` · ${r.in}–${r.out || '…'}` : ''}${r.corrected ? ' · dikoreksi' : ''}</small></span><span class="mob-inline">${chip(r.status, tone(r.status))}${d < HR.TODAY && r.status !== 'Libur' ? btn('Koreksi', { m: 'correct', date: d }, 'sm link') : ''}</span></div>`).join('') +
      (ui.correct ? `<form class="mob-form" data-mform="correct"><input type="hidden" name="date" value="${esc(ui.correct)}"><p class="small"><b>Ajukan koreksi ${esc(ui.correct)}</b></p><label>Jam masuk<input name="in" placeholder="09:00" required></label><label>Jam keluar<input name="out" placeholder="17:00"></label><label>Alasan<input name="reason" required minlength="5"></label><button class="mob-btn primary">Kirim koreksi</button></form>` : '')) +
    `<p class="tiny muted">Aturan ${esc(HRM.RULES.version)}: radius ${HRM.RULES.radius} m, umur lokasi ≤ ${HRM.RULES.maxAgeMin} menit, akurasi ≤ ${HRM.RULES.maxAccuracyM} m. Tidak ada keputusan absen, sanksi atau potongan otomatis dari pemeriksaan teknis.</p>`;
}

/* ---------- alur presensi (lembar) ---------- */
function flowSheet(a) {
  const f = ui.flow; if (!f) return '';
  const h = hr(), site = HRM.siteOf(h, a.emp), ph = HRM.phase(h, a.emp), consent = h.mob.consent[a.emp];
  let body = '';
  if (f.step === 'result') {
    const p = h.mob.punches.find(x => x.id === f.result), st = p ? HRM.pStatus(h, p) : null;
    body = p ? `<h3>${esc(HRM.KIND[p.kind])}</h3><p class="mob-result ${tone(st)}">${chip(st, tone(st))}</p><dl class="mob-dl"><dt>Tanggal/jam</dt><dd>Jumat 13 Nov 2026 · ${esc(p.serverAt || p.deviceAt)} WITA${p.serverAt ? '' : ' (waktu HP, belum dipercaya)'}</dd><dt>Outlet</dt><dd>${esc(site.name)}</dd><dt>Shift</dt><dd>${esc(p.shift)}</dd><dt>ID presensi</dt><dd>${p.id}</dd>${p.check ? `<dt>Wajah</dt><dd>${esc(p.check.liveness)} · ${esc(p.check.match)}</dd><dt>Lokasi</dt><dd>${esc(p.check.location)}</dd>` : ''}${p.reqId ? `<dt>Pemeriksaan</dt><dd>${p.reqId} → Supervisor</dd>` : ''}</dl>${p.reasons && p.reasons.length ? `<ul class="small">${p.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}<p class="tiny muted">Simulasi R&D: tidak ada kamera, GPS atau pencocokan wajah nyata.</p>` + btn('Selesai', { m: 'flow-close' }, 'primary') : '';
  } else if (!consent && !f.manual) {
    body = `<h3>Sebelum presensi pertama</h3><ul class="small"><li><b>Kamera depan</b> mengambil wajah langsung untuk liveness dan pencocokan 1:1 dengan profil Employee ID Anda. Foto galeri tidak dipakai.</li><li><b>Lokasi</b> diambil hanya saat Anda menekan aksi presensi, bukan sepanjang hari.</li><li>Bukti disimpan terbatas untuk pemeriksa yang berwenang sesuai masa simpan yang ditetapkan HRD.</li><li>Bila kamera/lokasi tidak bisa dipakai, ada jalur <b>Ajukan presensi dengan pemeriksaan</b>.</li></ul><p class="tiny muted">R&D: pendaftaran wajah & hasil pemeriksaan adalah simulasi berlabel.</p>` + btn('Saya mengerti, lanjutkan', { m: 'consent' }, 'primary') + btn('Pakai jalur pemeriksaan', { m: 'flow-manual' }, 'ghost');
  } else if (f.manual) {
    body = `<h3>Ajukan presensi dengan pemeriksaan</h3><p class="small">${esc(HRM.KIND[f.kind])} · ${esc(site.name)} · shift ${esc(ph.shift)} · ${esc(h.mob.clock)} WITA</p><form class="mob-form" data-mform="exception"><input type="hidden" name="kind" value="${f.kind}"><label>Alasan<select name="why"><option>GPS tidak akurat</option><option>Izin lokasi ditolak</option><option>Kamera rusak</option><option>Wajah tidak terbaca</option><option>Kebutuhan aksesibilitas</option></select></label><label>Keterangan<input name="reason" required minlength="5" placeholder="mis. kamera HP retak"></label><button class="mob-btn primary">Kirim untuk diperiksa Supervisor</button></form><p class="tiny muted">Status akan "Perlu pemeriksaan", bukan hadir terverifikasi, sampai Supervisor/HRD memutuskan.</p>` + btn('Batal', { m: 'flow-close' }, 'ghost');
  } else if (f.step === 'loc') {
    const ev = HRM.evaluate({ face: 'ok', loc: ui.loc });
    body = `<h3>1 · Lokasi saat ini</h3><p class="small">Mencocokkan dengan titik kerja <b>${esc(site.name)}</b> (radius ${HRM.RULES.radius} m).</p><p class="mob-alert ${ui.loc === 'ok' ? 'ok' : 'warn'}">${esc(HRM.SIM.loc[ui.loc])}<br><span class="tiny">${esc(ev.check.location)}</span></p>${ui.loc === 'denied' ? '<p class="small">Izin lokasi ditolak. Anda tetap bisa lanjut (akan diperiksa) atau pakai jalur pemeriksaan.</p>' : ''}` + btn('Lanjut: kamera', { m: 'flow-step', step: 'cam' }, 'primary') + btn('Ajukan dengan pemeriksaan', { m: 'flow-manual' }, 'ghost');
  } else if (f.step === 'cam') {
    body = `<h3>2 · Verifikasi wajah</h3><div class="mob-cam" aria-label="Pratinjau kamera depan (simulasi)"><span class="mob-face"></span><small>Kamera depan (simulasi) · kedipkan mata lalu tahan</small></div><p class="small">Kondisi simulasi: <b>${esc(HRM.SIM.face[ui.face])}</b> · jaringan ${esc(HRM.SIM.net[ui.net])} · ${esc(HRM.SIM.clock[ui.clock])}</p>` + btn(`Ambil wajah & kirim ${HRM.KIND[f.kind].toLowerCase()}`, { m: 'punch' }, 'primary') + btn('Ajukan dengan pemeriksaan', { m: 'flow-manual' }, 'ghost');
  }
  return `<div class="mob-sheet" role="dialog" aria-modal="true" aria-label="Presensi"><div class="mob-sheet-in">${msgBar()}${body}</div></div>`;
}

/* ---------- Inbox ---------- */
function inbox(a, params) {
  const h = hr(), sub = params.sub || 'chat';
  const tabs = `<nav class="mob-seg" aria-label="Inbox">${[['chat', 'Chat'], ['notif', 'Notifikasi'], ['approval', 'Approval']].map(([k, l]) => `<a href="#hrd-mobile${qs({ as: a.id, tab: 'inbox', sub: k })}" class="${k === sub ? 'on' : ''}" ${k === sub ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
  let body = '';
  if (sub === 'chat') {
    const cs = HRM.chatsOf(h, a.emp);
    if (params.conv) {
      const c = cs.find(x => x.id === params.conv);
      if (!c) body = sect('', '<p class="small">Percakapan tidak tersedia.</p>');
      else {
        const can = ['hrd', 'hrd-ops', 'outlet-spv', 'hg-lead', 'ops-manager'].includes(a.role);
        const title = c.name || nameOf(c.members.find(x => x !== a.emp));
        body = `<p><a class="mob-back" href="#hrd-mobile${qs({ as: a.id, tab: 'inbox' })}">‹ Chat</a></p>` + sect(esc(title), h.mob.msgs.filter(m => m.conv === c.id).map(m => `<div class="mob-msg ${m.from === a.emp ? 'me' : ''}"><small>${esc(nameOf(m.from))} · ${esc(m.at.slice(11))}</small><p>${esc(m.text)}</p><small>${m.status === 'Mengantre' ? chip('Mengantre', 'sandbox') : m.from === a.emp ? 'Terkirim' : ''}${m.task ? ` · <a href="#hrd-mobile${qs({ as: a.id, tab: 'work', task: m.task })}">${m.task}</a>` : can && m.from !== a.emp ? ' ' + btn('Jadikan tugas', { m: 'chat-task', msg: m.id }, 'sm link') : ''}</small></div>`).join('') +
          (c.post && !c.post.includes(a.emp) ? '<p class="tiny muted">Kanal pengumuman: hanya admin yang mengirim.</p>' : `<form class="mob-form row" data-mform="send"><input type="hidden" name="conv" value="${c.id}"><label class="sr" for="mtxt">Pesan</label><input id="mtxt" name="text" placeholder="Tulis pesan…" required><button class="mob-btn primary">Kirim</button></form>`) + '<p class="tiny muted">Persetujuan resmi lewat tab Approval, bukan balasan "setuju" di chat.</p>');
      }
    } else body = sect('', cs.map(c => { const last = h.mob.msgs.filter(m => m.conv === c.id).slice(-1)[0]; return `<a class="mob-row" href="#hrd-mobile${qs({ as: a.id, tab: 'inbox', conv: c.id })}"><span><b>${esc(c.name || nameOf(c.members.find(x => x !== a.emp)))}</b><small>${esc(c.kind)}${last ? ' · ' + esc(last.text.slice(0, 40)) : ''}</small></span>›</a>`; }).join(''));
  } else if (sub === 'notif') {
    const items = [];
    h.queue.filter(q => q.emp === a.emp && q.status !== 'Menunggu Persetujuan').slice(0, 4).forEach(q => items.push([`${q.type}: ${q.status}`, q.id, { tab: 'att' }]));
    HRM.punchesOf(h, a.emp).filter(p => HRM.pStatus(h, p) !== 'Terverifikasi').forEach(p => items.push([`Presensi ${HRM.pStatus(h, p).toLowerCase()}`, p.id, { tab: 'att' }]));
    h.queue.filter(q => HR2.canDecide(h, a.role, q)).slice(0, 4).forEach(q => items.push([`Pengajuan baru perlu keputusan`, q.id, { tab: 'inbox', sub: 'approval' }]));
    HR3.ensure(h).tasks.filter(t => t.pic === a.emp && t.stage !== 'Selesai').slice(0, 3).forEach(t => items.push(['Tugas ditugaskan ke Anda', t.id, { tab: 'work', task: t.id }]));
    body = sect('', items.length ? items.map(([t, ref, to]) => `<a class="mob-row" href="#hrd-mobile${qs({ as: a.id, ...to })}"><span><b>${esc(t)}</b><small>${esc(ref)}</small></span>›</a>`).join('') : '<p class="muted small">Tidak ada notifikasi.</p>') + '<p class="tiny muted">Di layar terkunci notifikasi sensitif tampil netral ("Ada pembaruan HAWK"). Push nyata: belum (butuh aplikasi terpasang).</p>';
  } else {
    const mine = h.queue.filter(q => HR2.canDecide(h, a.role, q));
    const own = h.queue.filter(q => q.emp === a.emp).slice(0, 5);
    body = (mine.length ? sect(`Perlu keputusan · ${mine.length}`, mine.map(q => `<div class="mob-proof"><div class="mob-row"><span><b>${esc(q.type)} · ${esc(nameOf(q.emp))}</b><small>${q.id} · ${esc(q.note || '')}</small></span>${chip(q.stages[q.stage].label, 'sandbox')}</div>${q.payload && q.payload.reasons ? `<ul class="tiny">${q.payload.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}<form class="mob-form row" data-mform="decide"><input type="hidden" name="id" value="${q.id}"><label class="sr" for="rs-${q.id}">Alasan</label><input id="rs-${q.id}" name="reason" placeholder="Alasan (wajib bila tolak)"><button class="mob-btn primary" name="decision" value="approve">Setujui</button><button class="mob-btn ghost" name="decision" value="reject">Tolak</button></form></div>`).join('')) : '') +
      sect('Status pengajuan saya', own.length ? own.map(q => `<div class="mob-row"><span><b>${esc(q.type)}</b><small>${q.id}${q.stages && q.stages[q.stage] ? ' · ' + esc(q.stages[q.stage].label) : ''}</small></span>${chip(q.status, tone(q.status))}</div>`).join('') : '<p class="muted small">Tidak ada.</p>');
  }
  return tabs + body;
}

/* ---------- Saya ---------- */
function me(a) {
  const h = hr(), p = h.people.find(x => x.id === a.emp), pl = HR.placementOn(h, a.emp), bal = HR2.balance(h, a.emp);
  return sect('Profil', `<dl class="mob-dl"><dt>Nama</dt><dd>${esc(p.name)} (nama samaran)</dd><dt>Employee ID</dt><dd>${a.emp}</dd><dt>Jabatan</dt><dd>${esc(a.job)}</dd><dt>Penempatan</dt><dd>${esc(HR.locName(pl.location))} · sejak ${pl.from}</dd><dt>Kanal kerja</dt><dd>Chat HAWK</dd></dl>${a.label ? `<p class="tiny muted">${esc(a.label)}</p>` : ''}`) +
    sect('Saldo cuti & izin', bal.filter(b => b.quota !== null).map(b => `<div class="mob-row"><span><b>${esc(b.name)}</b><small>terpakai ${b.used} · menunggu ${b.pending}</small></span><b>${b.left} hari</b></div>`).join('') +
      `<form class="mob-form" data-mform="leave"><label>Jenis<select name="cat">${bal.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></label><label>Tanggal<input type="date" name="from" value="2026-11-20" required></label><label>Alasan<input name="reason" placeholder="opsional"></label><button class="mob-btn primary">Ajukan</button></form>`) +
    sect('Gaji & slip', a.role === 'hrd' ? `<p class="small">Payroll, slip dan nominal hanya di portal desktop untuk Manager HRD. <a href="#hrd-payroll">Buka Payroll (desktop)</a></p>` : '<p class="small">Tidak tersedia di akun ini. Payroll, slip dan nominal gaji khusus Manager HRD.</p><p class="tiny muted">Therapist melihat jumlah layanan, jam treatment dan hasil kerja pribadi di Pekerjaan.</p>') +
    sect('Lainnya', ['Dokumen yang diizinkan (kontrak, SK penempatan)', 'Pelatihan & coaching', 'Direktori tim (nama, jabatan, outlet)', 'Bantuan & FAQ', 'Pengaturan perangkat: kamera, lokasi, notifikasi, sesi', 'Face ID/biometrik perangkat: hanya membuka sesi aplikasi, bukan bukti presensi'].map(x => `<p class="small">• ${esc(x)}</p>`).join(''));
}

/* ---------- halaman ---------- */
function sim(a) {
  const h = hr(), sel = (k, map) => `<label>${{ face: 'Wajah', loc: 'Lokasi', net: 'Jaringan', clock: 'Jam HP' }[k]}<select data-msim="${k}">${Object.entries(map).map(([v, l]) => `<option value="${v}" ${ui[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  return `<aside class="card mob-sim" aria-label="Simulator R&D"><p class="eyebrow">Simulator R&D · bukan bagian aplikasi</p>
    <label>Akun HAWK Mobile<select data-mas>${HRM.ACCOUNTS.map(x => `<option value="${x.id}" ${x.id === a.id ? 'selected' : ''}>${esc(nameOf(x.emp))} · ${esc(x.job)}</option>`).join('')}</select></label>
    <div class="mob-sim-grid">${sel('face', HRM.SIM.face)}${sel('loc', HRM.SIM.loc)}${sel('net', HRM.SIM.net)}${sel('clock', HRM.SIM.clock)}</div>
    <form class="mob-form row" data-mform="clock"><label>Jam demo (WITA)<input name="time" value="${esc(h.mob.clock)}" pattern="\\d{2}:\\d{2}"></label><button class="btn ghost sm">Set</button></form>
    <p class="row">${btn('Reset data HAWK Mobile', { m: 'reset' }, 'ghost sm')} <a class="btn ghost sm" href="#hrd-presence">Lihat di Presensi F2</a> <a class="btn ghost sm" href="#hrd-tracking">Peta lokasi</a></p>
    <h3>Status implementasi</h3><table class="mob-status"><tbody>${HRM.STATUS.map(([f, s]) => `<tr><td>${esc(f)}</td><td>${esc(s)}</td></tr>`).join('')}</tbody></table>
    <p class="tiny muted">Rekomendasi klien: Flutter (Android/iOS) + layanan server HAWK bersama. Distribusi: Google Play internal/closed testing, TestFlight, lalu jalur tetap. Lihat docs/hawk-live/HAWK-MOBILE-M1.md.</p></aside>`;
}
function page(params) {
  const a = cur(params), tab = params.tab || 'home';
  hr();
  const screen = tab === 'work' ? work(a, params) : tab === 'att' ? attTab(a) : tab === 'inbox' ? inbox(a, params) : tab === 'me' ? me(a) : home(a);
  const nav = `<nav class="mob-nav" aria-label="Menu utama">${TABS.map(([k, l, d]) => `<a href="#hrd-mobile${qs({ as: a.id, tab: k })}" class="${k === tab ? 'on' : ''}${k === 'att' ? ' att' : ''}" ${k === tab ? 'aria-current="page"' : ''}>${icon(d)}<span>${l}</span></a>`).join('')}</nav>`;
  const out = `<section class="mob-wrap"><div class="mob-phone" data-account="${a.id}"><div class="mob-screen">${header(a)}<main class="mob-main">${ui.flow ? '' : msgBar()}${screen}</main>${nav}${flowSheet(a)}</div></div>${sim(a)}</section>`;
  if (!ui.flow) { ui.err = null; ui.ok = null; }
  return `<p class="eyebrow">HAWK Mobile · M1 alur mobile R&D · visual HTML + simulasi</p><h1>HAWK Mobile (preview)</h1><p class="muted">Satu aplikasi untuk semua peran: Beranda, Pekerjaan, Presensi, Inbox, Saya. Data, identitas dan aturan sama dengan desktop. Bukan aplikasi Android/iOS terpasang.</p>` + out;
}
const fn = (params) => page(params);
H.REGISTRY['hrd-mobile'] = fn; fn.title = () => 'HAWK Mobile';
const items = H.PORTALS.HRD.items, it = items.findIndex(i => i[0] === 'hrd-tracking');
if (!items.some(i => i[0] === 'hrd-mobile')) items.splice(it + 1, 0, ['hrd-mobile', 'HAWK Mobile', 'M1', 'ready']);
H.SCREENS.push(['M1', 'HRD · HAWK Mobile (Beranda, Pekerjaan, Presensi, Inbox, Saya)', 'HRD M1', 'hrd-mobile', 'ready', 'Semua peran (simulasi)']);
H.PURPOSE['hrd-mobile'] = 'Preview HAWK Mobile M1: lima menu sesuai peran, presensi wajah/lokasi/jam simulasi dengan pengecualian, tugas F3, chat dan approval.';

/* ---------- interaksi ---------- */
const rerender = () => { saveUi(); H.render(); };
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-m]'); if (!b || !b.closest('.mob-wrap')) return;
  const { params } = H.parseHash(), a = cur(params), d = b.dataset;
  if (d.m === 'check') return; /* ditangani change */
  e.preventDefault();
  const reqId = () => `MSES-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  switch (d.m) {
    case 'flow': ui.flow = { kind: d.kind, step: 'loc', manual: !!d.manual, req: reqId() }; ui.err = null; break;
    case 'flow-step': ui.flow.step = d.step; ui.err = null; break;
    case 'flow-manual': ui.flow.manual = true; ui.err = null; break;
    case 'flow-close': ui.flow = null; break;
    case 'consent': act(a, 'm-consent'); ui.ok = null; break;
    case 'punch': { const r = act(a, 'm-punch', { kind: ui.flow.kind, req: ui.flow.req, face: ui.face, loc: ui.loc, net: ui.net, clock: ui.clock }); if (r) { ui.flow.step = 'result'; ui.flow.result = r; ui.ok = null; } break; }
    case 'sync': act(a, 'm-sync', { net: ui.net }); act(a, 'm-chat-flush'); break;
    case 'ops': act(a, 'm-ops', { op: d.op, ref: d.ref, to: d.to }); break;
    case 'chat-task': { const r = act(a, 'm-chat-task', { msg: d.msg }); if (r) ui.ok = `Tugas ${r} dibuat dari pesan`; break; }
    case 'correct': ui.correct = d.date; break;
    case 'reset': HR.update(H.state, 'm-reset', { role: a.role, account: a.id, any: true }); persist(); ui.flow = null; ui.ok = 'Data HAWK Mobile dikembalikan ke awal'; break;
  }
  rerender();
});
document.addEventListener('change', (e) => {
  const t = e.target; if (!t.closest || !t.closest('.mob-wrap')) return;
  const { id, params } = H.parseHash();
  if (t.matches('[data-mas]')) { ui.flow = null; ui.correct = null; saveUi(); H.go(id, { as: t.value, tab: params.tab || 'home' }); return; }
  if (t.matches('[data-msim]')) { ui[t.dataset.msim] = t.value; rerender(); return; }
  if (t.matches('[data-m="check"]')) { act(cur(params), 'm-task-check', { id: t.dataset.id, item: t.dataset.item }); rerender(); }
});
document.addEventListener('submit', (e) => {
  const f = e.target; if (!f.matches('[data-mform]') || !f.closest('.mob-wrap')) return;
  e.preventDefault(); e.stopPropagation();
  const { params } = H.parseHash(), a = cur(params), v = Object.fromEntries(new FormData(f)), sub = e.submitter;
  switch (f.dataset.mform) {
    case 'move': act(a, 'm-task-move', v); break;
    case 'send': act(a, 'm-chat-send', { conv: v.conv, text: v.text, net: ui.net }); break;
    case 'decide': act(a, 'm-decide', { id: v.id, decision: sub ? sub.value : 'approve', reason: v.reason }); break;
    case 'leave': act(a, 'm-leave', { cat: v.cat, from: v.from, to: v.from, reason: v.reason }); break;
    case 'correct': if (act(a, 'm-correct', v)) ui.correct = null; break;
    case 'clock': act(HRM.ACCOUNTS[4], 'm-clock', { time: v.time }); break;
    case 'exception': { const r = act(a, 'm-exception', { kind: v.kind, reason: `${v.why}: ${v.reason}`, req: ui.flow && ui.flow.req }); if (r) { ui.flow = { ...ui.flow, manual: false, step: 'result', result: r }; ui.ok = null; } break; }
  }
  rerender();
}, true);
})();
