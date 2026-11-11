/* Guards the four-portal design lock: hawk-live must render with the live HAWK design system (assets/css/hawk.css). */
'use strict';
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', '..', 'hawk-live');
let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? '✓' : '✗'} ${name}`); };
const css = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
ok('style.css tanpa :root sendiri', !/:root\s*\{/.test(css));
ok('style.css tanpa definisi token --x:', !/(^|[;{\s])--[a-z0-9-]+\s*:/i.test(css.replace(/\/\*[\s\S]*?\*\//g, '')));
for (const f of ['index.html', 'portal.html', 'finance.html', 'operational.html', 'commercial.html', 'sales.html']) {
  const html = fs.readFileSync(path.join(dir, f), 'utf8');
  const a = html.indexOf('href="../assets/css/hawk.css"'), b = html.indexOf('href="style.css"');
  ok(`${f}: hawk.css dimuat sebelum style.css`, a > -1 && b > a);
  ok(`${f}: shell HAWK (.app/.sidebar/.topbar/.main/.demo-banner)`, ['class="app"', 'class="sidebar"', 'class="topbar"', 'class="main"', 'class="demo-banner"', 'class="brand-mark"', 'class="role-chip"'].every(c => html.includes(c)));
}
const app = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');
ok('app.js memakai pola HAWK (nav-mod, page-head, nv-tag, hero, kpi g-*, tbl)', ['nav-mod', 'page-head', 'nv-tag', 'class="hero"', 'g-teal', 'class="tbl'].every(c => app.includes(c)));
console.log(`\n${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
