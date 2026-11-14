/* JAENS ERP HRD · F2-NV09 Pelacakan Lokasi · peta interaktif (DATA DEMO / SIMULASI).
   Peta seperti Google Maps (zoom in/out, geser, Peta / Satelit) memakai Leaflet (vendor/leaflet, BSD-2) + ubin CARTO Voyager
   (© OpenStreetMap contributors, © CARTO) dan Esri World Imagery. Tanpa API key berbayar.
   Titik kerja = koordinat dari tautan Google Maps Owner (HR2.SITES). Titik karyawan = presensi F2 (HR2.attendance) di sekitar titik kerja;
   enam contoh di luar radius 150 m (HR2.OUTSIDE) masuk Laporan di luar radius. Integrasi GPS perangkat: NEW INTEGRATION REQUIRED. */
(() => {
const H = window.HL;
const { esc, table, card, qs, link } = H;
const hr = () => { const h = HR.ensure(H.state); HR.EXT.ensure?.(h); return h; };
const chip = (t, tone = '') => `<span class="status-chip ${tone}">${esc(t)}</span>`;
const DATES = [['2026-11-12', 'Kamis 12 Nov · masuk & keluar lengkap'], ['2026-11-13', 'Jumat 13 Nov · hari ini (belum check-out)']];
const SHORT = { 'OUT-UBD': 'Spa Center Ubud', 'OUT-SHT': 'Spa Shanti', 'OUT-TRL': 'Spa Triloka', 'OUT-BSM': 'Spa Bisma', 'LOC-HQ': 'Head Office' };
const ini = (n) => n.split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const m = (v) => v >= 1000 ? `${(v / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} km` : `${v} m`;
const view = { center: null, zoom: null, layer: 'Peta' };
let map = null;

/* ---------- Leaflet dimuat sekali dari folder vendor (CSP script-src 'self') ---------- */
let loading = null;
function leaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (loading) return loading;
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'vendor/leaflet/leaflet.css'; document.head.appendChild(css);
  loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/leaflet/leaflet.js'; s.onload = () => res(window.L); s.onerror = rej; document.head.appendChild(s); });
  return loading;
}

function rows(params) {
  const h = hr(), role = H.prefs.role, date = params.date || DATES[0][0];
  return HR2.geo(h, date).filter(r => HR.inScope(h, role, r.emp, date));
}
function report(params) {
  const h = hr(), role = H.prefs.role;
  return DATES.flatMap(([d]) => HR2.geo(h, d).filter(r => r.outside && HR.inScope(h, role, r.emp, d)));
}
const tone = (r) => r.outside ? 'outside' : r.out ? 'outd' : r.late ? 'late' : 'in';

function page(params) {
  const date = params.date || DATES[0][0], site = params.site || '', list = rows(params), shown = site ? list.filter(r => r.site === site) : list;
  const rep = report(params), today = list.filter(r => !r.out).length;
  const sites = Object.entries(HR2.SITES);
  const nav = (p) => '#hrd-tracking' + qs({ date, site, ...p });
  const kpi = H.metrics([['Check-in', list.length, DATES.find(d => d[0] === date)[1]], ['Masih di lokasi', today, 'belum check-out'], ['Sudah check-out', list.length - today, 'jam keluar tercatat'], ['Di luar radius 150 m', list.filter(r => r.outside).length, `${rep.length} kejadian 12–13 Nov`]]);
  const filt = `<div class="geo-filter"><label>Tanggal <select data-geo-date>${DATES.map(([d, l]) => `<option value="${d}" ${d === date ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
    <div class="geo-chips"><a class="chip ${site ? '' : 'on'}" href="${nav({ site: '' })}">Semua lokasi</a>${sites.map(([id]) => `<a class="chip ${site === id ? 'on' : ''}" href="${nav({ site: id })}">${esc(SHORT[id])} · ${list.filter(r => r.site === id).length}</a>`).join('')}</div></div>`;
  const side = `<aside class="geo-side" aria-label="Daftar check-in"><div class="geo-side-head"><b>${shown.length} orang</b><span class="muted small">${site ? esc(HR2.SITES[site].name) : 'semua lokasi'} · klik nama untuk melihat di peta</span></div>
    <ol class="geo-list">${shown.sort((a, b) => (b.outside ? 1 : 0) - (a.outside ? 1 : 0) || a.in.localeCompare(b.in)).map(r => `<li><button type="button" class="geo-row t-${tone(r)}" data-geo-emp="${r.emp}"><span class="geo-av">${esc(ini(r.name))}</span><span class="geo-who"><b>${esc(r.name)}</b><small>${esc(r.pos)} · ${esc(SHORT[r.site])}</small></span><span class="geo-time"><small>Masuk</small>${r.in}<small>Keluar</small>${r.out || '—'}</span></button></li>`).join('')}</ol></aside>`;
  const legend = `<div class="geo-legend"><span><i class="t-in"></i>Check-in, masih di lokasi</span><span><i class="t-outd"></i>Sudah check-out</span><span><i class="t-late"></i>Terlambat</span><span><i class="t-outside"></i>Di luar radius 150 m</span><span><i class="ring"></i>Radius titik kerja</span></div>`;
  const mapCard = card(`Peta lokasi presensi · ${esc(DATES.find(d => d[0] === date)[1])}`, filt + `<div class="geo-wrap"><div class="geo-map" id="geo-map" role="application" aria-label="Peta Bali: titik kerja dan karyawan yang check-in/check-out"><p class="muted small geo-loading">Memuat peta…</p></div>${side}</div>` + legend +
    `<p class="muted small">Peta: Leaflet, © OpenStreetMap contributors, © CARTO, citra satelit © Esri. Gulir atau tombol +/− untuk zoom; di zoom dekat setiap karyawan tampil sebagai titik dengan nama dan jam. Koordinat titik kerja dari tautan Google Maps Owner. Head Office: tautan menunjuk tempat bernama "Samyama Eatery", perlu dikonfirmasi (TO VERIFY). GPS perangkat: NEW INTEGRATION REQUIRED.</p>`);
  const repCard = card(`Laporan di luar radius · ${rep.length} kejadian (12–13 Nov)`, `<p class="muted small">Presensi dianggap valid bila titik GPS berada dalam radius ${HR2.RADIUS} m dari titik kerja. Kejadian di luar radius masuk laporan ini untuk diverifikasi Supervisor/HRD.</p>` +
    table(['Tanggal', 'Karyawan', 'Lokasi kerja', 'Kejadian', 'Jam', 'Titik tercatat', 'Jarak dari titik kerja', 'Melebihi radius', 'Keterangan', 'Tindak lanjut', ''], rep.map(r => [r.date.slice(8) + ' Nov', `<b>${esc(r.name)}</b><br><small class="muted">${esc(r.pos)}</small>`, esc(SHORT[r.site]), r.outside.ev, r.outside.at, esc(r.outside.place), `<b>${m(r.outside.d)}</b>`, chip(`+${m(r.outside.over)}`, 'bad'), esc(r.outside.reason), chip(r.outside.follow, /Disetujui/.test(r.outside.follow) ? 'ready' : /Ditolak/.test(r.outside.follow) ? 'bad' : 'planned'), `<a href="${'#hrd-tracking' + qs({ date: r.date, site: r.site, focus: r.emp })}">Lihat di peta</a>`])) +
    `<p class="muted small">Ringkasan: ${rep.filter(r => /Perlu/.test(r.outside.follow)).length} perlu verifikasi/klarifikasi, ${rep.filter(r => /Disetujui/.test(r.outside.follow)).length} disetujui (dinas luar/kunjungan klien), ${rep.filter(r => /Ditolak/.test(r.outside.follow)).length} ditolak dan perlu koreksi presensi.</p>`);
  setTimeout(() => draw(params, list), 0);
  return kpi + mapCard + repCard;
}

function draw(params, list) {
  const el = document.getElementById('geo-map'); if (!el) return;
  leaflet().then((L) => {
    if (!document.body.contains(el)) return;
    if (map) { try { map.remove(); } catch (e) { /* old */ } map = null; }
    el.innerHTML = '';
    const site = params.site || '', S = HR2.SITES;
    map = L.map(el, { zoomControl: true, scrollWheelZoom: true, attributionControl: true });
    const base = {
      Peta: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20, subdomains: 'abcd', attribution: '© OpenStreetMap contributors © CARTO' }),
      Satelit: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles © Esri' })
    };
    (base[view.layer] || base.Peta).addTo(map);
    L.control.layers(base, null, { position: 'topright', collapsed: false }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    map.on('baselayerchange', (e) => { view.layer = e.name; });
    const people = L.layerGroup(), markers = {};
    Object.entries(S).forEach(([id, s]) => {
      const here = list.filter(r => r.site === id), out = here.filter(r => r.outside).length;
      L.circle([s.lat, s.lng], { radius: HR2.RADIUS, color: '#C99A2E', weight: 1.5, fillColor: '#E5C66A', fillOpacity: 0.12 }).addTo(map);
      L.marker([s.lat, s.lng], { icon: L.divIcon({ className: 'geo-site', html: `<span class="geo-pin"></span><span class="geo-site-lbl"><b>${esc(s.name)}</b><small>${here.length} check-in${out ? ` · <em>${out} di luar radius</em>` : ''}</small></span>`, iconSize: [26, 36], iconAnchor: [13, 34] }), zIndexOffset: 1000, title: s.name })
        .bindPopup(`<b>${esc(s.name)}</b><br>${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}<br>${here.length} check-in · ${here.filter(r => !r.out).length} masih di lokasi · ${here.filter(r => r.out).length} sudah keluar<br>Radius presensi ${HR2.RADIUS} m${s.note ? `<br><small>${esc(s.note)}</small>` : ''}<br><a href="${s.gmaps}" target="_blank" rel="noopener">Buka di Google Maps ↗</a>`).addTo(map);
    });
    list.forEach(r => {
      const t = tone(r), s = S[r.site];
      const pos = r.outside && r.outside.ev === 'Check-out' ? [r.outLat, r.outLng] : [r.lat, r.lng];
      const pop = `<div class="geo-pop"><b>${esc(r.name)}</b><small>${esc(r.pos)} · ${esc(s.name)}</small><table><tr><td>Check-in</td><td><b>${r.in}</b> · ${m(r.dIn)} dari titik</td></tr><tr><td>Check-out</td><td>${r.out ? `<b>${r.out}</b> · ${m(r.dOut)} dari titik` : 'belum, masih di lokasi'}</td></tr><tr><td>Status</td><td>${esc(r.status)}${r.late ? ` (${r.late} menit)` : ''}</td></tr></table>${r.outside ? `<p class="geo-warn">${r.outside.ev} di luar radius: ${m(r.outside.d)} dari titik kerja (+${m(r.outside.over)}) · ${esc(r.outside.place)}<br>${esc(r.outside.follow)}</p>` : '<p class="geo-ok">Dalam radius 150 m</p>'}</div>`;
      const mk = L.marker(pos, { icon: L.divIcon({ className: 'geo-emp t-' + t, html: `<span class="geo-av">${esc(ini(r.name))}</span><span class="geo-emp-lbl">${esc(r.name.split(' ').slice(0, 2).join(' '))} · ${r.in}${r.out ? '–' + r.out : ''}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] }), title: `${r.name} · masuk ${r.in}${r.out ? ' · keluar ' + r.out : ''}` }).bindPopup(pop);
      markers[r.emp] = mk;
      if (r.outside) { mk.addTo(map); L.polyline([pos, [s.lat, s.lng]], { color: '#C0392B', weight: 2, dashArray: '6 6' }).addTo(map); }
      else people.addLayer(mk);
    });
    const sync = () => { if (map.getZoom() >= 17) people.addTo(map); else people.remove(); el.classList.toggle('geo-near', map.getZoom() >= 19); };
    map.on('zoomend', () => { sync(); view.zoom = map.getZoom(); view.center = map.getCenter(); });
    map.on('moveend', () => { view.center = map.getCenter(); });
    const focus = params.focus && list.find(r => r.emp === params.focus);
    if (focus) { const mk = markers[focus.emp]; const ll = mk.getLatLng(); map.setView(focus.outside ? L.latLngBounds([ll, [S[focus.site].lat, S[focus.site].lng]]).getCenter() : ll, focus.outside ? 15 : 18); sync(); mk.openPopup(); }
    else if (site) map.setView([S[site].lat, S[site].lng], 18);
    else if (view.center && view.zoom) map.setView(view.center, view.zoom);
    else map.fitBounds(L.latLngBounds(Object.values(S).map(s => [s.lat, s.lng])).pad(0.25));
    sync();
    el.dataset.ready = '1';
    el._geo = { map, markers };
  }).catch(() => { el.innerHTML = '<p class="muted small">Peta tidak dapat dimuat di tampilan ini (file vendor/leaflet tidak tersedia). Buka pratinjau Vercel untuk peta interaktif.</p>'; });
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-geo-emp]'); if (!b) return;
  const el = document.getElementById('geo-map'), g = el && el._geo; if (!g) return;
  const mk = g.markers[b.dataset.geoEmp]; if (!mk) return;
  g.map.once('moveend', () => setTimeout(() => mk.openPopup(), 50)); g.map.setView(mk.getLatLng(), Math.max(g.map.getZoom(), 18));
  document.querySelectorAll('.geo-row.on').forEach(x => x.classList.remove('on')); b.classList.add('on');
});
document.addEventListener('change', (e) => {
  if (!e.target.matches('[data-geo-date]')) return;
  const { params } = H.parseHash(); H.go('hrd-tracking', { ...params, date: e.target.value, focus: '' });
});

/* bungkus layar F2-NV09: peta + laporan di atas riwayat titik lokasi yang sudah ada */
const prev = H.REGISTRY['hrd-tracking'];
const wrapped = (params) => { const old = prev(params); if (params.id || /hr-denied/.test(old)) return old; return page(params) + old; };
wrapped.title = prev.title; wrapped.purpose = () => 'Peta lokasi presensi seperti Google Maps: titik kerja 4 Spa + Head Office dengan radius 150 m, karyawan yang check-in/check-out lengkap dengan jam, dan laporan karyawan di luar radius. Data demo.';
H.REGISTRY['hrd-tracking'] = wrapped;
H.HRGEO = { page, report };
})();
