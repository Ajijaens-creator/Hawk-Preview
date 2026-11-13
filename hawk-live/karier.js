/* HAWK HRD · halaman karier publik (F4-NV01..NV03) — DATA DEMO / SIMULASI.
   Tanpa login internal. Menyimpan lamaran ke penyimpanan demo yang sama dengan portal HRD (browser ini). */
(() => {
  const KEY = 'hawk-integrated-demo-v1';
  let state = HAWK.fresh();
  try { const s = localStorage.getItem(KEY); if (s) state = JSON.parse(s); } catch (e) { /* in-memory */ }
  const hr = () => { const h = HR.ensure(state); HR.EXT.ensure?.(h); return h; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* abaikan */ } };
  const parse = () => { const sp = new URLSearchParams(location.hash.replace(/^#/, '').replace('?', '&')); const p = Object.fromEntries(sp); if (p.job) return { r: 'job', p: { ...p, id: p.job } }; if (p.apply) return { r: 'apply', p: { ...p, id: p.apply } }; if ('done' in p && p.done) return { r: 'apply', p }; return { r: 'land', p }; };
  const R = { land: 'land', job: 'job', apply: 'apply', href: (r, p) => { const { id, ...rest } = p || {}; const q = HRCAREER.qs(rest); return r === 'land' ? `#${q}` : `#${r}=${encodeURIComponent(id || '')}${q}`; } };
  const view = document.getElementById('view'), status = document.getElementById('status');
  function render(msg, err) {
    const { r, p } = parse();
    status.textContent = msg || ''; status.className = 'status' + (err ? ' bad-text' : ''); status.setAttribute('role', err ? 'alert' : 'status');
    view.innerHTML = r === 'job' ? HRCAREER.job(hr(), p, R) : r === 'apply' ? HRCAREER.apply(hr(), p, R, { after: 'done' }) : HRCAREER.landing(hr(), p, R);
    document.title = 'Karier JAENS · ' + (r === 'job' ? 'Detail lowongan' : r === 'apply' ? 'Lamar' : 'Lowongan');
  }
  window.addEventListener('hashchange', () => render());
  document.addEventListener('change', (e) => { const f = e.target.closest('form[data-career-filter]'); if (!f) return; const p = Object.fromEntries([...new FormData(f)].filter(([, v]) => v)); const ch = parse().p.ch; location.hash = R.href('land', { ...p, ch }); });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-action="filter-reset"]')) { location.hash = ''; render(); } });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-submit="hr:app-submit"]'); if (!f) return; e.preventDefault();
    try { const id = HR.update(state, 'app-submit', { by: 'Kandidat', role: 'public', ...Object.fromEntries(new FormData(f)) }); save(); location.hash = `done=${encodeURIComponent(id)}`; }
    catch (err) { render(err.message, true); }
  });
  render();
})();
