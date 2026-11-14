/* Peta menu sidebar hawk-live → kode NV → fase → rute (untuk developer; kode NV tidak tampil di sidebar akun demo).
   Usage: python3 -m http.server 8811 (root repo) lalu node tools/gen-nv-map.js  → docs/hawk-live/NV-MAP.md */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8811/hawk-live/';
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto(BASE + 'hrd.html#bridge'); await p.waitForTimeout(800);
  const data = await p.evaluate(() => ({ portals: Object.entries(HL.PORTALS).map(([n, v]) => [n, v.items]), screens: HL.SCREENS, status: HL.STATUS_LABEL }));
  await b.close();
  const phaseOf = (code, soon) => { const s = data.screens.find(x => x[0] === code); return (s && s[2]) || (soon || '').replace(/^HRD /, '') || '—'; };
  let md = `# Peta menu HAWK 5 Portal → kode NV → fase\n\nDATA DEMO / SIMULASI. Dibuat otomatis oleh \`node tools/gen-nv-map.js\` dari \`HL.PORTALS\` dan \`HL.SCREENS\` (hawk-live). Kode NV **tidak tampil** di sidebar akun demo (Aji, 14 Nov 2026); kode tetap tersimpan di data portal dan atribut \`data-nv\` pada tiap tautan sidebar. Pakai tabel ini untuk menelusuri permintaan perubahan: nama menu → kode NV → fase → rute/berkas.\n\n`;
  for (const [portal, items] of data.portals) {
    md += `## ${portal}\n\n| Seksi / induk | Menu | Kode NV | Fase | Status | Rute |\n|---|---|---|---|---|---|\n`;
    let sec = '', parent = '';
    for (const [route, name, code, st, soon, sub] of items) {
      if (route === '-') { sec = name; continue; }
      if (!sub) parent = name;
      md += `| ${[sec, sub ? parent : ''].filter(Boolean).join(' › ') || '—'} | ${sub ? '↳ ' : ''}${name} | ${code || '—'} | ${route[0] === '/' ? 'App 60 NV' : phaseOf(code, soon)} | ${data.status[st] || st} | \`${route[0] === '/' ? route : '#' + route}\` |\n`;
    }
    md += '\n';
  }
  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'hawk-live', 'NV-MAP.md'), md);
  console.log('docs/hawk-live/NV-MAP.md', md.split('\n').length, 'baris');
})();
