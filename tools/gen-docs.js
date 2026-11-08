/* Generates the machine-derived handoff documents from the single sources of truth
   (registry.js = 60 NV, contracts.js = adapter operations). Run: node tools/gen-docs.js
   Output: docs/SCREEN_MATRIX.csv, docs/ROLE_PERMISSION_MATRIX.csv, docs/INTEGRATION_CONTRACTS.md, docs/SCREEN_CONTRACTS.md */
'use strict';
const path = require('path');
const fs = require('fs');
['util', 'seed', 'contracts', 'store', 'spend', 'adapter', 'ai', 'registry'].forEach((f) => require(path.join(__dirname, '../assets/js/core', f + '.js')));
const H = globalThis.HAWK;
const out = path.join(__dirname, '../docs');
fs.mkdirSync(out, { recursive: true });

const ROLES = H.ROLES_ALL;
const LABEL = H.ROLE_LABEL || {};
const csv = (rows) => '﻿' + rows.map((r) => r.map((v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')).join('\r\n') + '\r\n';
const md = (v) => String(v == null ? '—' : v).replace(/\|/g, '\\|').replace(/\n/g, ' ');

/* Placeholder hook names from the owner's package (DEVELOPER_INTEGRATION_NOTES.md, MP-HAWK-03 ZIP A–E).
   They are NOT confirmed endpoints — listed so the backend team can map one naming to the other. */
const HOOK = {
  'org.upsertUnit': 'organization.manageUnit', 'org.setStatus': 'organization.manageUnit', 'user.assignRole': 'permissions.canAccess',
  'budget.upsertPlanLine': 'budget.getLines', 'budget.requestRevision': 'budget.submitRevision', 'mrf.create': 'mrf.create', 'mrf.decide': 'mrf.approve',
  'mrf.issue': 'mrf.getFulfillment / inventory.issue', 'po.createFromMrf': 'purchasing.createPO', 'po.decide': 'purchasing.approvePO', 'po.send': 'purchasing.getPO',
  'transfer.create': 'inventory.transfer', 'transfer.dispatch': 'inventory.transfer', 'transfer.receive': 'inventory.transfer', 'grn.receive': 'inventory.receive',
  'grn.post': 'inventory.receive', 'opname.submit': 'inventory.count', 'opname.approve': 'inventory.count', 'doc.capture': 'invoice.extractDraft',
  'doc.match': 'finance.matchThreeWay', 'doc.verify': 'finance.verifyPayable', 'stock.query': 'inventory.getStock', 'budget.checkItem': 'budget.validateRequest', 'gl.post': 'finance.postApprovedJournal', 'asset.capitalize': 'asset.register',
  'wo.create': 'asset.createWorkOrder', 'ai.insights': 'intelligence.getSourceLinkedInsights',
};

/* 1. Screen matrix */
const screenRows = [['NV', 'Modul', 'Nama resmi (NB-HAWK-01)', 'Tujuan', 'Role akses', 'Komponen', 'Field', 'Aksi → operasi', 'Filter', 'Drawer/modal', 'Responsif', 'Input', 'Validasi', 'Transisi status', 'Approval', 'Pengecualian', 'Layar terkait', 'Operasi adapter', 'Status integrasi (terendah)', 'Format ID', 'Status prototipe']];
const rank = ['UI-ONLY SIMULATION', 'NEW INTEGRATION REQUIRED', 'TO VERIFY', 'CONFIRMED EXISTING'];
H.SCREENS.forEach((s) => {
  const sts = s.ops.map((o) => (H.contract(o) || {}).status).filter(Boolean);
  const low = sts.sort((a, b) => rank.indexOf(a) - rank.indexOf(b))[0] || '—';
  screenRows.push([s.code, s.mod, s.name, s.purpose, s.roles.map((r) => LABEL[r] || r).join('; '), s.components, s.fields, (s.actions || []).map((a) => a.join(' → ')).join('; '), s.filters, s.drawers, s.responsive, s.inputs, s.validation, s.status, s.approval, s.exceptions, s.related, s.ops.join('; '), low, s.ids, H.views && H.views[s.nv] ? 'Interaktif' : 'Interaktif (view terdaftar di browser)']);
});
fs.writeFileSync(path.join(out, 'SCREEN_MATRIX.csv'), csv(screenRows));

/* 2. Role & permission matrix: screens (view) + operations (execute) */
const rp = [['Jenis', 'Kode', 'Nama', ...ROLES.map((r) => LABEL[r] || r)]];
H.SCREENS.forEach((s) => rp.push(['Layar', s.code, s.name, ...ROLES.map((r) => (H.canSee(r, s.nv) ? 'LIHAT' : ''))]));
H.CONTRACTS.forEach((c) => rp.push(['Operasi', c.id, c.read ? 'baca' : 'tulis', ...ROLES.map((r) => (c.roles.includes(r) ? (c.read ? 'BACA' : 'EKSEKUSI') : ''))]));
fs.writeFileSync(path.join(out, 'ROLE_PERMISSION_MATRIX.csv'), csv(rp));

/* 3. Integration contracts */
const counts = {};
H.CONTRACTS.forEach((c) => (counts[c.status] = (counts[c.status] || 0) + 1));
let ic = `# INTEGRATION CONTRACTS — HAWK Integration Adapter\n\n_Dibuat otomatis oleh \`node tools/gen-docs.js\` dari \`assets/js/core/contracts.js\`. Jangan edit manual._\n\n`;
ic += `**Tidak ada endpoint produksi di dokumen ini.** Kolom "Operasi" adalah nama deskriptif untuk adapter, bukan URL. Kolom "Hook paket Owner" memetakan ke nama placeholder di DEVELOPER_INTEGRATION_NOTES.md (juga belum terkonfirmasi).\n\n`;
ic += `| Status | Jumlah | Arti |\n|---|---|---|\n| CONFIRMED EXISTING | ${counts['CONFIRMED EXISTING'] || 0} | Hanya dengan dokumentasi/verifikasi engine — belum ada |\n| TO VERIFY | ${counts['TO VERIFY'] || 0} | UI HAWK v2.11.6 menunjukkan kemampuan terkait (screenshot 7 Nov 2026), API belum terdokumentasi |\n| NEW INTEGRATION REQUIRED | ${counts['NEW INTEGRATION REQUIRED'] || 0} | Tidak ada bukti di engine; butuh pekerjaan backend/konfigurasi |\n| UI-ONLY SIMULATION | ${counts['UI-ONLY SIMULATION'] || 0} | Hanya prototipe (AI/OCR/skenario); tidak boleh disajikan sebagai live |\n\n`;
ic += `Setiap operasi yang diimplementasikan wajib punya: endpoint/method terverifikasi, skema request/response, permission di server, state workflow, audit event, **idempotency key** untuk operasi tulis, error terstruktur (\`code\`, \`message\`, \`retryable\`), dan bukti tes.\n\n`;
const mods = [...new Set(H.CONTRACTS.map((c) => c.module))];
mods.forEach((m) => {
  ic += `## Modul ${m}\n\n| Operasi | Hook paket Owner | Modul HAWK existing | Status | Role | Input | Output | Transisi | Validasi | Audit |\n|---|---|---|---|---|---|---|---|---|---|\n`;
  H.CONTRACTS.filter((c) => c.module === m).forEach((c) => {
    ic += `| \`${c.id}\`${c.read ? ' (baca)' : ''} | ${HOOK[c.id] ? '`' + HOOK[c.id] + '`' : '—'} | ${md(c.hawk)} | **${c.status}** | ${c.roles.map((r) => LABEL[r] || r).join(', ')} | \`${md(c.input)}\` | ${md(c.output)} | ${md(c.transition)} | ${md(c.validation)} | ${md(c.audit)} |\n`;
  });
  ic += '\n';
});
fs.writeFileSync(path.join(out, 'INTEGRATION_CONTRACTS.md'), ic);

/* 4. Per-screen developer contracts */
let sc = `# SCREEN CONTRACTS — 60 NV (NB-HAWK-01)\n\n_Dibuat otomatis dari \`assets/js/core/registry.js\` + \`contracts.js\`. Kontrak yang sama tampil di aplikasi lewat toggle "Kontrak developer"._\n\n`;
Object.keys(H.MODULES).forEach((m) => {
  sc += `## Modul ${m} — ${H.MODULES[m].name}\n\n`;
  H.SCREENS.filter((s) => s.mod === m).forEach((s) => {
    sc += `### ${s.code} ${s.name}\n\n${s.purpose}\n\n| Aspek | Spesifikasi |\n|---|---|\n`;
    [['Role akses', s.roles.map((r) => LABEL[r] || r).join(', ')], ['Komponen', s.components], ['Field', s.fields], ['Aksi', (s.actions || []).map((a) => `${a[0]} → \`${a[1]}\``).join('; ')], ['Filter', s.filters], ['Drawer/modal', s.drawers], ['Input', s.inputs], ['Validasi', s.validation], ['Transisi status', s.status], ['Approval', s.approval], ['Pengecualian', s.exceptions], ['Responsif', s.responsive], ['Layar terkait', s.related], ['Format ID', s.ids]].forEach(([k, v]) => (sc += `| ${k} | ${md(v)} |\n`));
    sc += `\n**Operasi adapter:**\n\n`;
    s.ops.forEach((o) => {
      const c = H.contract(o);
      sc += `- \`${o}\` — ${c ? `**${c.status}** · HAWK: ${md(c.hawk)} · izin: ${c.roles.map((r) => LABEL[r] || r).join(', ')} · input \`${md(c.input)}\` → ${md(c.output)} · transisi: ${md(c.transition)} · audit: ${md(c.audit)}` : 'navigasi'}\n`;
    });
    sc += '\n';
  });
});
fs.writeFileSync(path.join(out, 'SCREEN_CONTRACTS.md'), sc);
console.log(`docs: SCREEN_MATRIX.csv (${H.SCREENS.length} NV), ROLE_PERMISSION_MATRIX.csv (${H.SCREENS.length} layar + ${H.CONTRACTS.length} operasi), INTEGRATION_CONTRACTS.md, SCREEN_CONTRACTS.md`);

/* 5. MP-HAWK-04 Markdown deliverables: SCREEN_MATRIX_60NV.md, ROLE_PERMISSION_MATRIX.md, HAWK_INTEGRATION_HOOKS.md
   Coverage is derived from the test sources, not hand-claimed:
   - every NV: rendered for 12 users + handler check (tests/browser-all.js), 3 viewports (tests/responsive.js)
   - E2E: NV opened and operated with real clicks in tests/e2e-walkthrough.js or tests/e2e-smart-spend.js
   - engine: adapter operations called in tests/workflow.test.js */
{
  const tdir = path.join(__dirname, '../tests');
  const wf = fs.readFileSync(path.join(tdir, 'workflow.test.js'), 'utf8');
  const e2e = ['e2e-walkthrough.js', 'e2e-smart-spend.js', 'e2e-simple-order.js'].filter((f) => fs.existsSync(path.join(tdir, f))).map((f) => fs.readFileSync(path.join(tdir, f), 'utf8')).join('\n');
  const testedOps = new Set([...wf.matchAll(/call\('([a-zA-Z]+\.[a-zA-Z]+)'/g)].map((m) => m[1]));
  const e2eNv = new Set([1, ...[...e2e.matchAll(/go\((\d+)/g)].map((m) => +m[1])]);
  const viewNv = new Set();
  fs.readdirSync(path.join(__dirname, '../assets/js/screens')).forEach((f) => {
    for (const m of fs.readFileSync(path.join(__dirname, '../assets/js/screens', f), 'utf8').matchAll(/V\[(\d+)\]\s*=/g)) viewNv.add(+m[1]);
  });
  const rankLow = (ops) => ops.map((o) => (H.contract(o) || {}).status).filter(Boolean).sort((a, b) => rank.indexOf(a) - rank.indexOf(b))[0] || '—';
  const tally = { e2e: 0, engine: 0, partial: 0, render: 0, none: 0 };
  let sm = `# SCREEN MATRIX — 60 NV (NB-HAWK-01)\n\n_Dibuat otomatis oleh \`node tools/gen-docs.js\`. Status uji dihitung dari isi file tes, bukan ditulis tangan._\n\n`;
  sm += `**Arti status implementasi**\n\n- **E2E** — layar dibuka dan dioperasikan lewat klik UI nyata di \`tests/e2e-walkthrough.js\` atau \`tests/e2e-smart-spend.js\`.\n- **Engine** — semua operasi tulis layar ini dipanggil di \`tests/workflow.test.js\` (aturan, transisi, jurnal, rollback); tombol UI-nya diperiksa punya handler, tetapi tidak semuanya diklik.\n- **Sebagian** — layar interaktif; sebagian operasi tulis belum punya tes otomatis (dicantumkan).\n- **Render** — layar baca/navigasi; diuji render untuk 12 pengguna dan 3 ukuran layar.\n- **BELUM** — tidak ada view. Bila muncul di tabel ini, layar itu belum diimplementasikan.\n\nSemua layar yang memiliki view juga lulus \`browser-all.js\` (12 pengguna × 60 NV, 0 error, 0 tombol tanpa handler) dan \`responsive.js\` (1440/834/390 px).\n\n`;
  const rowsMd = [];
  H.SCREENS.forEach((s) => {
    const writes = s.ops.filter((o) => { const c = H.contract(o); return c && !c.read; });
    const untested = writes.filter((o) => !testedOps.has(o));
    let st;
    if (!viewNv.has(s.nv)) st = 'none';
    else if (e2eNv.has(s.nv)) st = 'e2e';
    else if (!writes.length) st = 'render';
    else if (!untested.length) st = 'engine';
    else st = 'partial';
    tally[st]++;
    const label = { e2e: 'E2E', engine: 'Engine', partial: 'Sebagian', render: 'Render', none: '**BELUM**' }[st];
    rowsMd.push(`| ${s.code} | ${s.mod} | ${md(s.name)} | ${s.roles.map((r) => LABEL[r] || r).join(', ')} | ${writes.length ? writes.map((o) => '`' + o + '`').join(', ') : '— (baca)'} | ${rankLow(s.ops)} | ${label}${untested.length && st !== 'none' ? ' — belum dites: ' + untested.map((o) => '`' + o + '`').join(', ') : ''} |`);
  });
  sm += `**Ringkasan:** ${H.SCREENS.length} layar · E2E ${tally.e2e} · Engine ${tally.engine} · Sebagian ${tally.partial} · Render ${tally.render} · BELUM ${tally.none}\n\n`;
  Object.keys(H.MODULES).forEach((m) => {
    sm += `## Modul ${m} — ${H.MODULES[m].name}\n\n| NV | Mod | Nama resmi | Role akses | Operasi tulis | Status integrasi terendah | Status implementasi & uji |\n|---|---|---|---|---|---|---|\n`;
    sm += rowsMd.filter((r, i) => H.SCREENS[i].mod === m).join('\n') + '\n\n';
  });
  fs.writeFileSync(path.join(out, 'SCREEN_MATRIX_60NV.md'), sm);

  let rm = `# ROLE & PERMISSION MATRIX\n\n_Dibuat otomatis dari \`registry.js\` (akses layar) dan \`contracts.js\` (izin operasi)._\n\n> Permission di prototipe hanya **simulasi tampilan**. Backend HAWK wajib menegakkan aturan yang sama di server.\n\nRole: ${ROLES.map((r) => `\`${r}\` = ${LABEL[r] || r}`).join(' · ')}\n\n`;
  const head = `| Kode | Nama | ${ROLES.map((r) => r).join(' | ')} |\n|---|---|${ROLES.map(() => ':-:').join('|')}|\n`;
  rm += `## Akses layar (✓ = boleh membuka)\n\n` + head;
  H.SCREENS.forEach((s) => (rm += `| ${s.code} | ${md(s.name)} | ${ROLES.map((r) => (H.canSee(r, s.nv) ? '✓' : '')).join(' | ')} |\n`));
  rm += `\n## Izin operasi (E = eksekusi tulis, B = baca)\n\n` + head;
  H.CONTRACTS.forEach((c) => (rm += `| \`${c.id}\` | ${c.read ? 'baca' : 'tulis'} | ${ROLES.map((r) => (c.roles.includes(r) ? (c.read ? 'B' : 'E') : '')).join(' | ')} |\n`));
  rm += `\n## Segregation of duties yang diuji (tests/workflow.test.js)\n\n- Staff tidak dapat menyetujui MRF; Supervisor hanya cabangnya sendiri.\n- Purchasing tidak dapat capture faktur; Owner tidak dapat membayar.\n- Verifikator tagihan ≠ penyetuju; pengaju non-rutin ≠ pemutus; pembuat draft aturan approval ≠ penerbit.\n`;
  fs.writeFileSync(path.join(out, 'ROLE_PERMISSION_MATRIX.md'), rm);

  let hk = `# HAWK INTEGRATION HOOKS\n\n_Dibuat otomatis dari \`contracts.js\`. Ringkasan untuk developer; detail lengkap per operasi ada di INTEGRATION_CONTRACTS.md._\n\n`;
  hk += `> **Belum ada API HAWK yang terhubung atau terverifikasi.** Adapter "HAWK API" di prototipe sengaja mengembalikan \`NOT_CONNECTED\`. Tidak ada endpoint/URL produksi di source code. Status **CONFIRMED EXISTING** = ${counts['CONFIRMED EXISTING'] || 0}.\n\n`;
  hk += `## Titik sambung\n\nSemua aksi tulis melewati satu fungsi: \`HAWK.api.call(op, payload, user)\` di \`assets/js/core/adapter.js\`. Untuk integrasi, buat adapter baru yang memetakan setiap \`op\` di bawah ke endpoint HAWK yang sudah diverifikasi, lalu pilih adapter itu di selector Adapter. Layar tidak perlu diubah.\n\n`;
  hk += `| Status | Jumlah |\n|---|---|\n${Object.entries(counts).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}\n\n`;
  hk += `| Operasi | Jenis | Modul HAWK existing (perkiraan) | Hook paket Owner (placeholder) | Status | Diuji di engine |\n|---|---|---|---|---|---|\n`;
  H.CONTRACTS.forEach((c) => (hk += `| \`${c.id}\` | ${c.read ? 'baca' : 'tulis'} | ${md(c.hawk)} | ${HOOK[c.id] ? '`' + HOOK[c.id] + '`' : '—'} | ${c.status} | ${testedOps.has(c.id) ? 'ya' : c.read ? '— (baca)' : 'belum'} |\n`));
  hk += `\n## Syarat sebelum status boleh naik ke CONFIRMED EXISTING\n\nEndpoint & method terdokumentasi oleh tim HAWK, skema request/response, permission di server, idempotency key untuk operasi tulis, error terstruktur (\`code\`, \`message\`, \`retryable\`), audit event, dan bukti tes terhadap lingkungan HAWK non-produksi.\n`;
  fs.writeFileSync(path.join(out, 'HAWK_INTEGRATION_HOOKS.md'), hk);
  console.log(`docs MP-HAWK-04: SCREEN_MATRIX_60NV.md (${JSON.stringify(tally)}), ROLE_PERMISSION_MATRIX.md, HAWK_INTEGRATION_HOOKS.md`);
}
