#!/usr/bin/env python3
"""HAWK Operational: adapt the Owner prototype (v1.1) into hawk-live modules.

Usage: python3 tools/ops-from-prototype.py hawk-live/reference-ops/a02   (folder paket Owner: src/ + docs/)

Writes hawk-live/ops/*.js (prototype modules, unchanged behaviour, namespaced as window.OPX) and
hawk-live/ops/ops.css (prototype CSS scoped under .opx, shell rules dropped, HAWK tokens from hawk.css).
The hawk-live shell (sidebar, topbar, portal picker, ID/EN) stays the single shell; hawk-live/ops-shell.js
mounts the pages into it. Re-run after a new prototype version, then re-apply ops-shell.js if needed.
"""
import re, sys, json, pathlib

SRC = pathlib.Path(sys.argv[1])
root = pathlib.Path(__file__).resolve().parent.parent / 'hawk-live' / 'ops'
root.mkdir(parents=True, exist_ok=True)
for old in root.glob('ops-*.js'): old.unlink()

# A02+: input = folder paket (src/ + docs/feature-manifest.json); urutan file mengikuti build.py paket
JS_FILES = [('core.js', 'core'), ('operations.js', 'operations'), ('daily.js', 'daily'), ('tasks-communication.js', 'tasks'),
            ('ser-source-catalog.js', 'ser'), ('performance.js', 'performance'), ('governance.js', 'governance'), ('pos-existing.js', 'pos'),
            ('demo-experience.js', 'demo'), ('analytics-data.js', 'analytics-data'), ('analytics-interactions.js', 'analytics-interactions'),
            ('analytics.js', 'analytics')]
CSS_FILES = ['style.css', 'daily.css', 'tasks-communication.css', 'performance.css', 'governance.css', 'demo-experience.css', 'analytics.css', 'analytics-interactions.css']
MARK = '\n/*@@OPXMODULE {}@@*/\n'
js = ''.join(MARK.format(n) + (SRC / 'src' / f).read_text() for f, n in JS_FILES)
manifest = json.loads((SRC / 'docs' / 'feature-manifest.json').read_text())
js += MARK.format('manifest') + 'window.H.manifest=' + json.dumps(manifest, ensure_ascii=False).replace('</', '<\\/') + ';\n'
css = '\n'.join((SRC / 'src' / f).read_text() for f in CSS_FILES)
js = re.sub(r'window\.H\b', 'window.OPX', js)

def cut(text, start, end):
    i = text.index(start); j = text.index(end, i) + len(end)
    return text[:i], text[i:j], text[j:]

# render: hawk-live shell renders sidebar/topbar; OPX renders only the page into #opx-root
a, _, b = cut(js, 'H.render=()=>{', "H.demoAfterRender?.();};")
js = a + "H.render=()=>H.mountPage();" + b
# navigate: hash routes are owned by hawk-live (#op-<page>, demo = #ops-dx)
a, _, b = cut(js, 'H.navigate=(id)=>{', "window.scrollTo({top:0,behavior:'instant'});};")
js = a + "H.navigate=(id)=>H.goPage(id);" + b
js = js.replace("window.addEventListener('hashchange',()=>H.navigate(location.hash.slice(1)||'dashboard'));", '')
js = js.replace("window.OPX.navigate(location.hash.slice(1)||window.OPX.state.page||'dashboard');", '')
js = js.replace('href="#demo"', 'href="#ops-dx"')
# global delegation only reacts inside the Operational surface
js = js.replace("e.target.closest('[data-page]')", "e.target.closest('.opx [data-page]')")
js = js.replace("e.target.closest('[data-act]')", "e.target.closest('.opx [data-act]')")
js = js.replace("e.target.closest('form[data-form]')", "e.target.closest('.opx form[data-form]')")
# overlays (modal, toasts, Pandu Saya dock) live in one scoped host
js = js.replace("host=document.createElement('div');host.id='dx-tour-root';document.body.appendChild(host);",
                "host=document.createElement('div');host.id='dx-tour-root';H.overlay().appendChild(host);")

# people follow the HRD master (hrd-model.js NAMED, assets/js/core/seed.js U-SPV..U-SPV4); outlet names follow POS existing
# Owner 2026-11-19: semua user outlet boleh menerima barang (PIC penerimaan ditugaskan kemudian); verifikasi tetap Supervisor ke atas
js = js.replace("reception:['dashboard','pos','daily','tasks','rooms','communication','race']", "reception:['dashboard','pos','daily','tasks','rooms','inventory','communication','race']")
js = js.replace("therapist:['dashboard','tasks','therapist','rooms','communication','race']", "therapist:['dashboard','tasks','therapist','rooms','inventory','communication','race']")
js = js.replace("security:['dashboard','daily','tasks','communication','race']", "security:['dashboard','daily','tasks','inventory','communication','race']")
js = js.replace("const canReceive=()=>H.has('inventory')&&(['manager','assistant','supervisor','attendant'].includes(H.user().role)||H.user().role==='head'&&H.user().dept==='attendant');", "const canReceive=()=>H.has('inventory');")
js = js.replace("title:'Assistant Spa Manager'", "title:'Assistant Operational Manager'")
# Looker parity: period-over-period change badge on KPI cards (H.kpiChange defined in ops-shell.js)
_old = "format(card.value,card.unit))}</strong>"
assert _old in js
js = js.replace(_old, "format(card.value,card.unit))}</strong>${H.kpiChange?H.kpiChange(card):''}", 1)
js = js.replace("name:`Supervisor ${short}`,role:'supervisor',title:'Supervisor Outlet',dept:'management',outlet:o.id,initials:'S'+short[0]",
                "name:({CTR:'Mila',SHT:'Tina',TRL:'Dewik',BSM:'Wahyudi'})[o.id],role:'supervisor',title:`Supervisor Spa ${short}`,dept:'management',outlet:o.id,initials:({CTR:'MI',SHT:'TI',TRL:'DW',BSM:'WY'})[o.id]")

# A03 (F-OP07): satu penghitung case/issue. Command Center & Communication Hub memakai aturan visibilitas tunggal
# dari hawk-live/ops-cases.js (H.visibleIssues) bila tersedia; tanpa modul itu perilaku prototype tetap.
_old = "function visibleIssues(){if(!H.has('communication'))return [];"
assert _old in js
js = js.replace(_old, "function visibleIssues(){if(!H.has('communication'))return [];if(H.visibleIssues)return H.visibleIssues();", 1)
_old = "issues=H.scope(H.state.data.issues)"
assert js.count(_old) == 1
js = js.replace(_old, "issues=(H.visibleIssues?H.visibleIssues():H.scope(H.state.data.issues))", 1)

# NP-OP01 UI Navigation Amendment (Aji 2026-11-23): 14 dashboard menjadi submenu sidebar "Dashboard Library"
# (hawk-live/ops-shell.js). Panel navigasi krem di dalam halaman dihapus; area konten memakai lebar penuh.
_m = re.search(r'<aside class="an-report-nav".*?</aside>', js, re.S)
assert _m and js.count('<aside class="an-report-nav"') == 1
js = js[:_m.start()] + js[_m.end():]

head = '/* HAWK Operational · module "{n}" — diadaptasi dari paket Owner A02 v1.2 (tools/ops-from-prototype.py). DATA DEMO / SIMULASI. */\n'
for chunk in js.split('/*@@OPXMODULE ')[1:]:
    n, body = chunk.split('@@*/', 1)
    (root / f'ops-{n}.js').write_text(head.format(n=n) + body.strip() + '\n')

# ---------------------------------------------------------------- CSS
SHELL = re.compile(r'^(\.sidebar|\.topbar|\.brand|\.nav\b|\.nav-|\.mobile-|\.profile-btn|\.top-divider|\.portal-caption|'
                   r'\.demo-center-entry|\.app-mobile-nav|\.skip|\.main\b|\.footer|\.online-dot|\.demo-header-button|\.crumb\b|\.date-label)')
HAWK_TOKENS = {'black', 'charcoal', 'canvas', 'surface', 'ink', 'muted', 'line', 'gold', 'gold-dark', 'gold-grad', 'r', 'shadow', 'sidebar', 'topbar'}

def scope_sel(sel):
    sel = sel.strip()
    if not sel or SHELL.match(sel): return None
    if sel.startswith(':root') or sel == 'html': return None
    if sel.startswith('body'):
        rest = sel[4:]
        m = re.match(r'(\.[\w-]+)\s*(.*)', rest)
        if m and m.group(1) == '.dx-tour-active' and m.group(2) and not SHELL.match(m.group(2)):
            return f'body.dx-tour-active .opx {m.group(2)}'
        return None
    if sel.startswith('*'): return '.opx ' + sel
    return '.opx ' + sel

def walk(text):
    out, i = [], 0
    while i < len(text):
        j = text.find('{', i)
        if j < 0: break
        pre = text[i:j].strip()
        depth, k = 1, j + 1
        while depth: depth += {'{': 1, '}': -1}.get(text[k], 0); k += 1
        body = text[j + 1:k - 1]
        if pre.startswith('@media') or pre.startswith('@supports'):
            inner = walk(body)
            if inner.strip(): out.append(f'{pre}{{{inner}}}')
        elif pre.startswith('@keyframes'):
            out.append(f'{pre}{{{body}}}')
        elif pre.startswith(':root'):
            decl = ';'.join(d for d in body.split(';') if d.strip() and d.split(':')[0].strip()[2:] not in HAWK_TOKENS)
            out.append(f'.opx{{{decl}}}')
        else:
            sels = [s for s in (scope_sel(x) for x in pre.split(',')) if s]
            if sels: out.append(f"{','.join(sels)}{{{body}}}")
        i = k
    return '\n'.join(out)

scoped = walk(css)
# classes that also exist in hawk.css: reset hawk's rules inside .opx first, then the prototype rules below apply
CONFLICT = ['badge', 'between', 'btn', 'card', 'card-head', 'dot', 'dx-feed', 'dx-feed-row', 'dx-hero', 'dx-page', 'dx-screen', 'empty',
            'eyebrow', 'field', 'icon-btn', 'legend', 'modal', 'modal-body', 'modal-foot', 'modal-head', 'mono', 'muted', 'ring', 'row',
            'small', 'stack', 'tab', 'tabs', 'timeline', 'toast', 'wrap']
scoped = ','.join(f'.opx .{c}' for c in CONFLICT) + '{all:revert;font-family:inherit;box-sizing:border-box}\n' + scoped
(root / 'ops.css').write_text('/* HAWK Operational · CSS paket A02 di-scope ke .opx. Token warna/radius/shadow diambil dari assets/css/hawk.css. */\n'
                              '.opx{font-size:14px;line-height:1.5;color:var(--ink)}\n' + scoped + '\n'
                              + '\n/* ---- integrasi shell hawk-live (sumber: hawk-live/ops-shell.css) ---- */\n' + (root.parent / 'ops-shell.css').read_text())
print('ok', [p.name for p in sorted(root.iterdir())])
