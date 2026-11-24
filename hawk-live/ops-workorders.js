/* HAWK Operational · Issue fasilitas → dashboard Maintenance tanpa entry ulang (A03 kontrak #13 work order, F-OP06/F-OP10).
   DATA DEMO / SIMULASI. Issue fasilitas yang sudah ada (Communication Hub / Room & Facility) dipakai sebagai work order:
   lapor → tugas penanganan (respons pertama) → penyelesaian → satu catatan Maintenance "submitted" dibuat otomatis
   dari issue yang sama → verifikasi oleh lead lain → dashboard Maintenance Performance.
   Tidak ada form total laporan kedua: kategori dipilih sekali saat penyelesaian, waktu diambil dari issue/tugas.
   Readiness ruang tetap dikelola di Room & Facility (tidak otomatis Ready). Backend: entitas work order belum ada (BUILD). */
(function () {
'use strict';
const H = window.OPX;
if (!H || !H.analytics) return;
const A = H.analytics, e = H.escape;
const CATS = ['Cleanliness / Hygiene', 'Electrical', 'Equipment / Tools', 'Furniture', 'HVAC', 'Building'];
const isFacility = (i) => i && i.kind !== 'guest';
/* datetime-local WITA (UTC+8) untuk field "when" pada skema maintenance */
const wita = (iso) => { const d = new Date(new Date(iso).getTime() + 8 * 36e5); return d.toISOString().slice(0, 16); };
const issue = (id) => H.state.data.issues.find(i => i.id === id);
H.workOrders = { CATS, recordOf: (i) => i && i.maintenanceRecordId ? (A.ensure().records || []).find(r => r.id === i.maintenanceRecordId) : null };

/* respons pertama = tugas penanganan dibuat */
const baseTask = H.actions['issue-task'];
if (baseTask) H.actions['issue-task'] = (el) => { const i = issue(el.dataset.id); const had = i && i.taskId; baseTask(el); if (i && !had && i.taskId && !i.respondedAt) { i.respondedAt = new Date().toISOString(); H.save(); } };

/* kategori dipilih sekali pada konfirmasi penyelesaian */
const baseResolveAct = H.actions['issue-resolve'];
if (baseResolveAct) H.actions['issue-resolve'] = (el) => {
  baseResolveAct(el);
  const i = issue(el.dataset.id), f = document.querySelector('#modal-root form[data-form="issueResolve"]');
  if (!isFacility(i) || !f || f.querySelector('[name="mtCategory"]')) return;
  const guess = /listrik|lampu|electr/i.test(i.title + i.note) ? 'Electrical' : /ac\b|hvac|udara/i.test(i.title + i.note) ? 'HVAC' : /bersih|kotor|hygiene/i.test(i.title + i.note) ? 'Cleanliness / Hygiene' : 'Equipment / Tools';
  const lab = document.createElement('label'); lab.className = 'field';
  lab.innerHTML = `Kategori maintenance<select name="mtCategory">${CATS.map(c => `<option ${c === guess ? 'selected' : ''}>${e(c)}</option>`).join('')}</select><small class="muted">Penyelesaian otomatis membuat satu catatan Maintenance (status menunggu verifikasi) dari issue ini. Tidak perlu input ulang di Dashboard Kinerja.</small>`;
  f.insertBefore(lab, f.querySelector('button[type="submit"]'));
};
const baseResolve = H.forms.issueResolve;
if (baseResolve) H.forms.issueResolve = (fd) => {
  const i = issue(String(fd.get('issueId'))), was = i && i.status;
  baseResolve(fd);
  if (!isFacility(i) || was === 'resolved' || i.status !== 'resolved' || i.maintenanceRecordId) return;
  try {
    const cat = CATS.includes(String(fd.get('mtCategory'))) ? String(fd.get('mtCategory')) : 'Equipment / Tools';
    const r = A.addRecord({ group: 'maintenance', outlet: i.outlet, date: wita(i.resolvedAt).slice(0, 10), status: 'submitted',
      values: { ticketRef: i.id + (i.roomId ? ' · ' + i.roomId : ''), category: cat, openedAt: wita(i.createdAt || i.resolvedAt), respondedAt: wita(i.respondedAt || i.resolvedAt), state: 'Done', resolvedAt: wita(i.resolvedAt), description: String(i.resolution || '').slice(0, 500) },
      evidence: `Issue ${i.id}${i.taskId ? ' · tugas ' + i.taskId : ''} · ${String(i.resolution || '').slice(0, 200)}` });
    i.maintenanceRecordId = r.id; i.maintenanceCategory = cat;
    H.log('WORKORDER_TO_MAINTENANCE', i.id, 'Catatan Maintenance ' + r.id + ' dibuat dari issue yang sama; menunggu verifikasi.', i.outlet);
    H.save(); H.render();
    H.toast(`${r.id}: catatan Maintenance dibuat dari ${i.id}, menunggu verifikasi lead lain.`);
  } catch (er) { H.toast('Issue selesai. Catatan Maintenance belum dibuat: ' + er.message); }
};

/* drawer issue menampilkan catatan Maintenance yang tertaut */
const baseOpen = H.actions['issue-open'];
if (baseOpen) H.actions['issue-open'] = (el) => {
  baseOpen(el);
  const i = issue(el.dataset.id), r = H.workOrders.recordOf(i), box = document.querySelector('#modal-root .stack');
  if (!isFacility(i) || !box || box.querySelector('.wo-link')) return;
  const st = { submitted: ['Menunggu verifikasi', 'gold'], verified: ['Terverifikasi · masuk dashboard', 'green'], rejected: ['Dikembalikan', 'red'], draft: ['Draft', 'gray'] };
  const div = document.createElement('div'); div.className = 'notice wo-link';
  div.innerHTML = r ? `<div><strong>Catatan Maintenance ${e(r.id)}</strong><p>${H.badge((st[r.status] || [r.status])[0], (st[r.status] || [0, 'gray'])[1])} ${e(r.values.category)} · respons ${e(r.values.respondedAt.replace('T', ' '))} · selesai ${e(r.values.resolvedAt.replace('T', ' '))} WITA</p>${A.canViewDashboard && A.canViewDashboard('maintenance') ? '<a class="btn btn-sm" href="#op-analytics-maintenance">Buka Maintenance Performance</a>' : ''}</div>`
    : `<div><strong>Alur work order</strong><p>Lapor → tugas penanganan (respons pertama) → catat penyelesaian → catatan Maintenance otomatis → verifikasi → dashboard.${i.respondedAt ? ' Respons pertama: ' + e(wita(i.respondedAt).replace('T', ' ')) + ' WITA.' : ''}</p></div>`;
  box.appendChild(div);
};

/* ---------- Demo Experience Center: DX-OP12 ---------- */
if (H.demo && Array.isArray(H.demo.scenarios) && !H.demo.scenarios.some(s => s.id === 'work-order')) {
  const acct = (role, o) => role === 'manager' ? 'mgr-eni' : `${role === 'supervisor' ? 'spv' : role}-${o}`;
  const M = (title, role, page, instruction, expected, check) => ({ title, role, page, instruction, expected, check, kind: 'state' });
  const R = (title, role, page, instruction, expected) => ({ title, role, page, instruction, expected, kind: 'manual' });
  const wo = (r) => H.state.data.issues.filter(i => isFacility(i) && i.outlet === r.outlet && i.reporter === acct('attendant', r.outlet) && String(i.createdAt) >= r.startedAt).slice(-1)[0];
  H.demo.scenarios.push({ id: 'work-order', code: 'DX-OP12', icon: 'bed', title: 'Issue fasilitas → work order → Maintenance', minutes: '5–7 menit', people: 'Attendant → Supervisor → Manager',
    summary: 'Kerusakan ruang dilaporkan sekali, ditangani lewat tugas, lalu menjadi satu catatan Maintenance yang diverifikasi tanpa input ulang.',
    outcome: 'Dashboard Maintenance membaca issue yang sama: waktu lapor, respons pertama dan selesai berasal dari record pekerjaan.', steps: [
      M('Laporkan kerusakan ruang', 'attendant', 'communication', 'Di Communication Hub buat issue baru untuk departemen Attendant, pilih ruang yang rusak dan jelaskan temuan.', 'Issue fasilitas baru masuk antrean Supervisor outlet.', r => Boolean(wo(r))),
      M('Buat tugas penanganan', 'supervisor', 'communication', 'Buka issue tersebut lalu tekan "Buat tugas penanganan".', 'Tugas tertaut dibuat; waktu respons pertama tercatat pada issue.', r => Boolean(wo(r)?.taskId && wo(r)?.respondedAt)),
      M('Catat penyelesaian', 'supervisor', 'communication', 'Setelah perbaikan, buka issue dan tekan "Catat penyelesaian". Pilih kategori maintenance dan tulis hasil pengecekan.', 'Issue selesai dan satu catatan Maintenance menunggu verifikasi dibuat otomatis.', r => Boolean(wo(r)?.status === 'resolved' && H.workOrders.recordOf(wo(r)))),
      M('Verifikasi catatan Maintenance', 'manager', 'analytics', 'Buka Maintenance Performance → Data & verifikasi (atur periode ke tanggal hari ini) lalu verifikasi catatan dari issue tersebut.', 'Catatan terverifikasi oleh lead yang berbeda dari pencatat.', r => H.workOrders.recordOf(wo(r))?.status === 'verified'),
      R('Baca dashboard Maintenance', 'manager', 'analytics', 'Pada Maintenance Performance, cek total maintenance, response time dan completion rate untuk periode yang sama.', 'Angka bertambah dari catatan yang sama; tidak ada pengetikan ulang total.'),
    ] });
}
})();
