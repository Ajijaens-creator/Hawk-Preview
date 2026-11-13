/* Builds standalone, offline HAWK five-portal previews (one HTML file each, CSS+JS inlined):
     hawk-live/preview.html (all portals) and hawk-live/preview-<portal>.html
   Usage: node tools/build-hawk-live.js   (no dependencies). Open the files directly from disk (file://).
   On the hosted site use hawk-live/index.html: the strict CSP there blocks inline scripts. */
'use strict';
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'hawk-live');
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const hawkCss = fs.readFileSync(path.join(dir, '..', 'assets', 'css', 'hawk.css'), 'utf8'), css = read('style.css'), js = ['model.js', 'ser-data.js', 'commercial-model.js', 'marketing-model.js', 'budget2027-model.js', 'hrd-model.js', 'hrd-f2-model.js', 'hrd-f3-model.js', 'app.js', 'hrd.js', 'hrd-f2.js', 'hrd-f3.js', 'commercial.js', 'marketing.js', 'budget2027.js'].map(read).join('\n;\n').replace(/<\/script/gi, '<\\/script');
const pages = [['index.html', 'preview.html'], ['finance.html', 'preview-finance.html'], ['operational.html', 'preview-operational.html'], ['commercial.html', 'preview-commercial.html'], ['sales.html', 'preview-sales.html'], ['hrd.html', 'preview-hrd.html']];
for (const [src, dst] of pages) {
  let html = read(src)
    .replace('<link rel="stylesheet" href="../assets/css/hawk.css">', () => `<style>\n${hawkCss}\n</style>`)
    .replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${css}\n</style>`)
    .replace(/<script src="[^"]+" defer><\/script>\n?/g, '')
    .replace('</body>', () => `<script>\n${js}\n</script>\n</body>`)
    .replace('<meta name="robots"', `<meta name="hawk-standalone" content="${new Date().toISOString()}">\n<meta name="robots"`);
  fs.writeFileSync(path.join(dir, dst), html);
  console.log(`${dst}: ${(html.length / 1024).toFixed(0)} KB`);
}
