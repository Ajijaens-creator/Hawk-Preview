/* HAWK Operational · Gudang & Stok BHP outlet (permintaan Owner 2026-11-19). DATA DEMO / SIMULASI.
   Semua user outlet melihat stok gudang outletnya, jumlah minimum dan berapa yang harus dipesan, lalu menekan Order.
   Order staf menunggu Supervisor; Supervisor ke atas langsung mengajukan. Order TIDAK mengubah stok: saldo, MRF, PO,
   penerimaan (GRN) dan ledger tetap milik engine HAWK existing (MRF NV-24..30, Purchasing NV-31..37, Gudang NV-38..46).
   Item memakai kode master HAWK (BHP-001…, SP-…) agar sama dengan Gudang 60-NV. */
(function () {
'use strict';
const H = window.OPX; if (!H) return;
const e = H.escape;
const rp = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
const NOW = () => new Date().toISOString();

/* master item = salinan katalog HAWK (assets/js/core/seed.js s.items) */
const ITEMS = [
  { id: 'BHP-001', name: 'Minyak Pijat Lavender 1L', unit: 'botol', cat: 'BHP Treatment', p: 'P2 Product', price: 85000, supplier: 'PT Aroma Bali Lestari (DEMO)', bhp: true },
  { id: 'BHP-002', name: 'Body Scrub Kopi Bali 500g', unit: 'pak', cat: 'BHP Treatment', p: 'P2 Product', price: 62000, supplier: 'PT Aroma Bali Lestari (DEMO)', bhp: true },
  { id: 'BHP-005', name: 'Essential Oil Aromaterapi 10ml', unit: 'botol', cat: 'BHP Treatment', p: 'P2 Product', price: 48000, supplier: 'PT Aroma Bali Lestari (DEMO)', bhp: true },
  { id: 'BHP-008', name: 'Lulur Tradisional Bali 1kg', unit: 'pak', cat: 'BHP Treatment', p: 'P2 Product', price: 74000, supplier: 'PT Aroma Bali Lestari (DEMO)', bhp: true },
  { id: 'BHP-003', name: 'Handuk Kecil Putih', unit: 'pcs', cat: 'Linen', p: 'P6 Facility', price: 38000, supplier: 'CV Tirta Linen (DEMO)', bhp: true },
  { id: 'BHP-007', name: 'Sandal Spa Disposable', unit: 'pasang', cat: 'Linen', p: 'P6 Facility', price: 6500, supplier: 'CV Tirta Linen (DEMO)', bhp: true },
  { id: 'BHP-004', name: 'Sabun Cair Antiseptik 5L', unit: 'jerigen', cat: 'Kebersihan', p: 'P5 Place', price: 145000, supplier: 'UD Sumber Bersih (DEMO)', bhp: true },
  { id: 'BHP-006', name: 'Tisu Wajah 250 lembar', unit: 'kotak', cat: 'Kebersihan', p: 'P5 Place', price: 21000, supplier: 'PT Kertas Indah Grafika (DEMO)', bhp: true },
  { id: 'SP-001', name: 'Kapasitor AC 35µF', unit: 'pcs', cat: 'Suku cadang', p: 'P6 Facility', price: 95000, supplier: 'CV Teknik Dingin Bali (DEMO)', bhp: false },
  { id: 'SP-002', name: 'Freon R32 (isi ulang)', unit: 'kg', cat: 'Suku cadang', p: 'P6 Facility', price: 180000, supplier: 'CV Teknik Dingin Bali (DEMO)', bhp: false },
];
/* saldo awal per outlet [qty, min, max] — deterministik, sebagian di bawah minimum agar alur order terlihat */
const SEED = {
  'BHP-001': [[3, 6, 20], [9, 6, 20], [5, 6, 18], [12, 6, 18]],
  'BHP-002': [[10, 8, 24], [4, 8, 24], [9, 6, 18], [2, 6, 18]],
  'BHP-005': [[0, 4, 12], [6, 4, 12], [5, 4, 12], [7, 4, 12]],
  'BHP-008': [[7, 5, 15], [5, 5, 15], [2, 4, 12], [6, 4, 12]],
  'BHP-003': [[32, 40, 100], [55, 40, 100], [41, 30, 80], [28, 30, 80]],
  'BHP-007': [[60, 50, 200], [120, 50, 200], [35, 40, 150], [90, 40, 150]],
  'BHP-004': [[2, 2, 6], [1, 2, 6], [3, 2, 6], [2, 2, 6]],
  'BHP-006': [[14, 10, 30], [8, 10, 30], [12, 8, 24], [5, 8, 24]],
  'SP-001': [[1, 1, 3], [2, 1, 3], [0, 1, 3], [1, 1, 3]],
  'SP-002': [[2, 2, 6], [4, 2, 6], [3, 2, 6], [1, 2, 6]],
};
const LEAD = ['manager', 'assistant', 'supervisor'];
/* akun demo Gudang HAWK (60-NV) yang setara dengan akun Operational aktif */
const NV_USER = { manager: 'U-BUM', assistant: 'U-AOM', supervisor: 'U-SPV', reception: 'U-RCP', security: 'U-SEC' };
const nvUser = (u) => NV_USER[u.role] || (u.dept === 'therapist' ? 'U-STF' : u.dept === 'reception' ? 'U-RCP' : 'U-ATD');

function wh() {
  const d = H.state.data;
  if (!d.warehouse || !Array.isArray(d.warehouse.stock)) {
    const stock = [];
    H.outlets.forEach((o, oi) => ITEMS.forEach(it => { const [qty, min, max] = (SEED[it.id] || [])[oi % 4] || [5, 3, 10]; stock.push({ id: `WHS-${o.id}-${it.id}`, outlet: o.id, item: it.id, qty, min, max }); }));
    d.warehouse = { stock, orders: [], source: 'Snapshot Gudang HAWK (NV-40) · demo' };
  }
  return d.warehouse;
}
const item = (id) => ITEMS.find(i => i.id === id) || { id, name: id, unit: '', cat: '', p: '', price: 0, supplier: '—' };
const OPEN = ['menunggu_supervisor', 'diajukan'];
const pending = (s) => wh().orders.filter(o => o.outlet === s.outlet && o.item === s.item && OPEN.includes(o.status)).reduce((n, o) => n + o.qty, 0);
const needOrder = (s) => s.qty <= s.min ? Math.max(0, s.max - s.qty - pending(s)) : 0;
const lowState = (s) => s.qty === 0 ? ['Habis', 'red'] : s.qty <= s.min ? ['Di bawah minimum', 'gold'] : ['Aman', 'green'];
const canUse = () => H.has('inventory');
const canApprove = () => LEAD.includes(H.user().role);
const myOutlet = (o) => H.isManager() || H.user().outlet === o;
const rows = () => H.scope(wh().stock);
const statusLabel = { menunggu_supervisor: ['Menunggu Supervisor', 'gold'], diajukan: ['Diajukan ke engine HAWK', 'blue'], ditolak: ['Ditolak Supervisor', 'red'] };

function orderModal(s, qty) {
  const it = item(s.item);
  H.modal('Order barang · ' + it.name, `<form data-form="wh-order"><input type="hidden" name="id" value="${e(s.id)}">
  <div class="notice">${e(H.outletName(s.outlet))} · sisa <b>${s.qty} ${e(it.unit)}</b> · minimum ${s.min} · maksimum ${s.max}${pending(s) ? ` · sudah dalam pesanan ${pending(s)}` : ''}</div>
  <div class="field"><label for="wh-qty">Jumlah order (${e(it.unit)})</label><input id="wh-qty" name="qty" type="number" min="1" max="9999" required value="${qty || Math.max(1, needOrder(s))}"></div>
  <div class="field"><label>Jalur permintaan</label>
    <label class="wh-route"><input type="radio" name="route" value="PO" ${it.bhp ? 'checked' : ''}> <span><b>PO · beli ke supplier</b><small>Order Sederhana HAWK (NV-24 → NV-35). Dalam budget 7P dan ≤ Rp5 jt disetujui otomatis aturan AR-13; di atas itu lewat approval. Supplier: ${e(it.supplier)}.</small></span></label>
    <label class="wh-route"><input type="radio" name="route" value="MRF" ${it.bhp ? '' : 'checked'}> <span><b>MRF · minta dari Gudang pusat</b><small>Material Request (NV-25..30), dipenuhi dengan transfer antar gudang (NV-44) bila stok pusat ada.</small></span></label></div>
  <div class="field"><label for="wh-note">Catatan (opsional)</label><input id="wh-note" name="note" maxlength="300" placeholder="Mis. untuk paket honeymoon akhir pekan"></div>
  <p class="small muted">Estimasi ${e(it.p)}: ${rp(it.price)} × jumlah. ${canApprove() ? 'Sebagai ' + e(H.user().title) + ', order langsung diajukan.' : 'Order Anda masuk ke Supervisor untuk disetujui.'} Stok tidak berubah sampai barang diterima dan diposting Gudang.</p>
  <div class="daily-modal-actions"><button type="submit" class="btn btn-primary">Order sekarang</button></div></form>`);
}

function createOrder(s, qty, route, note) {
  const it = item(s.item), u = H.user();
  const o = { id: (route === 'MRF' ? 'MRF-OPS-' : 'POR-OPS-') + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 90 + 10), route, outlet: s.outlet, item: s.item, itemName: it.name, unit: it.unit, qty, value: qty * it.price, p: it.p, note: (note || '').slice(0, 300), by: u.id, byName: u.name, at: NOW(), status: canApprove() ? 'diajukan' : 'menunggu_supervisor', approvedBy: canApprove() ? u.id : null, stockAtOrder: s.qty };
  wh().orders.push(o);
  H.log('WAREHOUSE_ORDER_DEMO', o.id, `${route} ${qty} ${it.unit} ${it.name} · ${o.status}`, s.outlet);
  return o;
}

H.forms['wh-order'] = (fd) => {
  const s = wh().stock.find(x => x.id === fd.get('id'));
  if (!s || !canUse() || !myOutlet(s.outlet)) return H.toast('Order hanya untuk stok outlet Anda sendiri.');
  const qty = Number(fd.get('qty')), route = String(fd.get('route') || '');
  if (!Number.isInteger(qty) || qty < 1 || qty > 9999 || !['PO', 'MRF'].includes(route)) return H.toast('Isi jumlah dan jalur permintaan yang valid.');
  const dup = wh().orders.find(o => o.outlet === s.outlet && o.item === s.item && o.status === 'menunggu_supervisor');
  if (dup) return H.toast(`Sudah ada order ${dup.id} yang menunggu Supervisor untuk item ini.`);
  const o = createOrder(s, qty, route, String(fd.get('note') || ''));
  H.save(); H.closeModal(); H.ui.whTab = 'orders'; H.render();
  H.toast(o.status === 'diajukan' ? `${o.id} diajukan. Stok tetap sampai barang diterima.` : `${o.id} terkirim ke Supervisor untuk disetujui.`);
};
H.actions['wh-order'] = (el) => { const s = wh().stock.find(x => x.id === el.dataset.id); if (!s || !canUse() || !myOutlet(s.outlet)) return H.toast('Order hanya untuk stok outlet Anda sendiri.'); orderModal(s); };
H.actions['wh-order-all'] = () => {
  if (!canUse()) return;
  const list = rows().filter(s => needOrder(s) > 0 && item(s.item).bhp && myOutlet(s.outlet));
  if (!list.length) return H.toast('Semua BHP masih di atas minimum atau sudah dipesan.');
  const total = list.reduce((n, s) => n + needOrder(s) * item(s.item).price, 0);
  H.modal('Order semua BHP di bawah minimum', `<div class="notice">${list.length} item · estimasi ${rp(total)} · jalur PO (Order Sederhana). Jumlah = maksimum − sisa − yang sudah dipesan.</div><div class="table-wrap"><table><thead><tr><th>Item</th><th>Outlet</th><th>Order</th></tr></thead><tbody>${list.map(s => `<tr><td>${e(item(s.item).name)}</td><td>${e(H.outletName(s.outlet))}</td><td>${needOrder(s)} ${e(item(s.item).unit)}</td></tr>`).join('')}</tbody></table></div>`, `<button class="btn" data-act="close-modal">Batal</button><button class="btn btn-primary" data-act="wh-order-all-confirm">Order ${list.length} item</button>`);
};
H.actions['wh-order-all-confirm'] = () => {
  const list = rows().filter(s => needOrder(s) > 0 && item(s.item).bhp && myOutlet(s.outlet) && !wh().orders.some(o => o.outlet === s.outlet && o.item === s.item && o.status === 'menunggu_supervisor'));
  list.forEach(s => createOrder(s, needOrder(s), 'PO', 'Order massal BHP di bawah minimum'));
  H.save(); H.closeModal(); H.ui.whTab = 'orders'; H.render(); H.toast(`${list.length} order BHP dibuat.`);
};
const decide = (ok) => (el) => {
  const o = wh().orders.find(x => x.id === el.dataset.id);
  if (!o || !canApprove() || !myOutlet(o.outlet) || o.status !== 'menunggu_supervisor') return H.toast('Hanya Supervisor outlet ini yang dapat memutuskan order.');
  o.status = ok ? 'diajukan' : 'ditolak'; o.approvedBy = H.user().id; o.decidedAt = NOW();
  H.log(ok ? 'WAREHOUSE_ORDER_APPROVED' : 'WAREHOUSE_ORDER_REJECTED', o.id, o.itemName, o.outlet); H.save(); H.render();
  H.toast(ok ? `${o.id} disetujui dan diajukan.` : `${o.id} ditolak.`);
};
H.actions['wh-approve'] = decide(true);
H.actions['wh-reject'] = decide(false);
H.actions['wh-tab'] = (el) => { H.ui.whTab = el.dataset.id; H.render(); };
H.actions['wh-filter'] = (el) => { H.ui.whFilter = el.dataset.id; H.render(); };

function stockView() {
  const f = H.ui.whFilter || 'bhp', all = H.isManager() && H.state.outletId === 'all';
  const list = rows().filter(s => f === 'all' || (f === 'low' ? s.qty <= s.min : item(s.item).bhp)).sort((a, b) => (a.qty / Math.max(1, a.min)) - (b.qty / Math.max(1, b.min)));
  const chips = [['bhp', 'BHP'], ['low', 'Perlu order'], ['all', 'Semua barang']].map(([id, l]) => `<button class="tab ${f === id ? 'active' : ''}" data-act="wh-filter" data-id="${id}" aria-pressed="${f === id}">${l}</button>`).join('');
  return `<section class="card"><div class="card-head"><div><h2 class="card-title">Stok gudang outlet</h2><p class="small muted">${e(wh().source)} · urut dari yang paling kritis</p></div><div class="row"><div class="tabs">${chips}</div><button class="btn btn-primary btn-sm" data-act="wh-order-all">Order semua BHP yang perlu</button></div></div>
  <div class="table-wrap"><table class="wh-table"><thead><tr><th>Barang</th>${all ? '<th>Outlet</th>' : ''}<th>Sisa</th><th>Minimum</th><th>Maks</th><th>Dalam pesanan</th><th>Harus order</th><th>Status</th><th></th></tr></thead><tbody>${list.map(s => { const it = item(s.item), [lbl, col] = lowState(s), need = needOrder(s); return `<tr data-sku="${e(s.item)}" data-outlet="${e(s.outlet)}"><td><b>${e(it.name)}</b><small>${e(it.id)} · ${e(it.cat)}${it.bhp ? ' · BHP' : ''}</small></td>${all ? `<td>${e(H.outletName(s.outlet))}</td>` : ''}<td class="mono wh-qty">${s.qty} ${e(it.unit)}</td><td class="mono">${s.min}</td><td class="mono">${s.max}</td><td class="mono">${pending(s) || '—'}</td><td class="mono wh-need"><b>${need ? need + ' ' + e(it.unit) : '—'}</b></td><td>${H.badge(lbl, col)}</td><td><button class="btn btn-sm ${need ? 'btn-primary' : ''}" data-act="wh-order" data-id="${e(s.id)}">Order</button></td></tr>`; }).join('')}</tbody></table></div>
  <p class="help small muted">Harus order = maksimum − sisa − jumlah yang sudah dipesan, muncul saat sisa ≤ minimum. Minimum/maksimum final mengikuti master item Gudang HAWK.</p></section>`;
}
function ordersView() {
  const list = H.scope(wh().orders).slice().reverse();
  return `<section class="card"><div class="card-head"><div><h2 class="card-title">Permintaan barang (MRF / PO)</h2><p class="small muted">Order staf menunggu Supervisor. Nomor PO/MRF resmi dibuat engine HAWK saat diproses.</p></div>${H.badge(list.filter(o => o.status === 'menunggu_supervisor').length + ' menunggu Supervisor', 'gold')}</div>
  ${list.length ? `<div class="table-wrap"><table><thead><tr><th>Referensi</th><th>Barang</th><th>Jumlah</th><th>Estimasi</th><th>Jalur</th><th>Pemesan</th><th>Status</th><th></th></tr></thead><tbody>${list.map(o => { const [l, c] = statusLabel[o.status] || [o.status, 'gray']; return `<tr><td class="mono small">${e(o.id)}</td><td><b>${e(o.itemName)}</b><small>${e(H.outletName(o.outlet))}${o.note ? ' · ' + e(o.note) : ''}</small></td><td>${o.qty} ${e(o.unit)}</td><td>${rp(o.value)}</td><td>${o.route === 'PO' ? 'PO supplier' : 'MRF gudang pusat'}</td><td>${e(o.byName)}</td><td>${H.badge(l, c)}</td><td>${o.status === 'menunggu_supervisor' && canApprove() ? `<div class="row"><button class="btn btn-sm btn-primary" data-act="wh-approve" data-id="${e(o.id)}">Setujui</button><button class="btn btn-sm" data-act="wh-reject" data-id="${e(o.id)}">Tolak</button></div>` : ''}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty"><h3>Belum ada order.</h3><p>Tekan Order pada barang yang perlu dipesan.</p></div>'}</section>`;
}

H.pages.warehouse = {
  title: 'Gudang & Stok BHP', phase: 'F-OP06',
  subtitle: 'Sisa stok, minimum, berapa harus order, dan order MRF/PO dari outlet.',
  contract: 'Stok, MRF, PO, penerimaan dan ledger milik engine HAWK existing (NV-24..46). Halaman ini membaca snapshot dan membuat permintaan; stok tidak berubah saat order.',
  render() {
    const list = rows(), u = H.user(), tab = H.ui.whTab || 'stock';
    const low = list.filter(s => s.qty <= s.min && item(s.item).bhp).length, empty = list.filter(s => s.qty === 0).length;
    const wait = H.scope(wh().orders).filter(o => o.status === 'menunggu_supervisor').length, sent = H.scope(wh().orders).filter(o => o.status === 'diajukan').length;
    const as = nvUser(u);
    return `<div class="notice mb"><b>Gudang outlet · DATA DEMO.</b> Semua tim outlet dapat melihat stok setelah menerima barang dan menekan Order. Supervisor menyetujui order staf. Stok baru bertambah setelah barang diterima dan diposting Gudang.</div>
    <div class="kpi-grid"><div class="stat"><div class="stat-label">BHP di bawah minimum</div><div class="stat-value">${low}</div><div class="stat-note">perlu order</div></div><div class="stat"><div class="stat-label">Barang habis</div><div class="stat-value">${empty}</div><div class="stat-note">sisa 0</div></div><div class="stat"><div class="stat-label">Menunggu Supervisor</div><div class="stat-value">${wait}</div><div class="stat-note">order staf</div></div><div class="stat"><div class="stat-label">Order diajukan</div><div class="stat-value">${sent}</div><div class="stat-note">ke engine HAWK</div></div></div>
    <div class="tabs mt">${[['stock', 'Stok & order'], ['orders', 'Permintaan MRF / PO']].map(([id, l]) => `<button class="tab ${tab === id ? 'active' : ''}" data-act="wh-tab" data-id="${id}" aria-pressed="${tab === id}">${l}</button>`).join('')}</div>
    ${tab === 'orders' ? ordersView() : stockView()}
    <section class="card mt"><div class="card-head"><div><h2 class="card-title">Gudang HAWK lengkap</h2><p class="small muted">Modul Gudang yang sama dengan Finance/Inventory, dibuka sebagai akun demo setara (${e(as)}).</p></div></div><div class="row wh-links">
      <a class="btn btn-sm" href="/?as=${as}#/nv/40" target="_blank" rel="noopener">Saldo stok & ledger (NV-40) ↗</a>
      <a class="btn btn-sm" href="/?as=${as}#/nv/24" target="_blank" rel="noopener">Pesan barang · Order Sederhana (NV-24) ↗</a>
      ${canApprove() ? `<a class="btn btn-sm" href="/?as=${as}#/nv/38" target="_blank" rel="noopener">Dashboard Inventory (NV-38) ↗</a><a class="btn btn-sm" href="/?as=${as}#/nv/44" target="_blank" rel="noopener">Transfer antar gudang (NV-44) ↗</a>` : ''}
    </div></section>`;
  },
};

/* akses: semua role yang memiliki Inventory (keputusan Owner 2026-11-19: semua user outlet) */
const baseHas = H.has;
H.has = (cap) => cap === 'warehouse' ? baseHas('inventory') : baseHas(cap);
/* menu: setelah Inventory Coordination */
const at = H.navItems.findIndex(n => n[0] === 'inventory');
if (!H.navItems.some(n => n[0] === 'warehouse')) H.navItems.splice(at + 1, 0, ['warehouse', 'Gudang & Stok BHP', 'box', '06', '']);
H.warehouse = { wh, needOrder, pending, ITEMS };
})();
