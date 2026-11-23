"""Assemble the offline HAWK demo. Python standard library only."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'
CSS = ['style.css', 'daily.css', 'tasks-communication.css', 'performance.css', 'governance.css', 'demo-experience.css', 'analytics.css', 'analytics-interactions.css']
JS = ['core.js', 'operations.js', 'daily.js', 'tasks-communication.js', 'ser-source-catalog.js', 'performance.js', 'governance.js', 'pos-existing.js', 'demo-experience.js', 'analytics-data.js', 'analytics-interactions.js', 'analytics.js']

def build():
    style = '\n'.join((SRC / file).read_text() for file in CSS)
    script = '\n'.join((SRC / file).read_text() for file in JS)
    manifest = json.loads((ROOT / 'docs/feature-manifest.json').read_text())
    script += '\nwindow.H.manifest=' + json.dumps(manifest, ensure_ascii=False).replace('</', '<\\/') + ';\n'
    script += "window.H.navigate(location.hash.slice(1)||'analytics');\n"
    html = (SRC / 'shell.html').read_text().replace('/*__STYLE__*/', style).replace('/*__SCRIPT__*/', script)
    (ROOT / 'dist').mkdir(exist_ok=True)
    (ROOT / 'dist/index.html').write_text(html)
    output = ROOT / 'HAWK-Operational-14-Dashboards-Demo.html'
    output.write_text(html)
    print(json.dumps({'output': str(output), 'bytes': output.stat().st_size, 'self_contained': True}))

if __name__ == '__main__':
    build()
