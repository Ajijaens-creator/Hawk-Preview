/* HAWK × JAENS Prototype — utilities (DOM-free, also loadable in Node tests) */
(function (root) {
  'use strict';
  const HAWK = (root.HAWK = root.HAWK || {});

  const U = {};
  U.DEMO_TODAY = '2026-11-08';
  U.DEMO_PERIOD = '2026-11';

  U.clone = (o) => JSON.parse(JSON.stringify(o));
  U.sum = (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0);
  U.by = (arr, key) => Object.fromEntries(arr.map((x) => [x[key], x]));
  U.uniq = (arr) => Array.from(new Set(arr));
  U.round = (n, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

  U.rp = (n, opts = {}) => {
    if (n === null || n === undefined || isNaN(n)) return '—';
    const neg = n < 0;
    const v = Math.abs(n);
    if (opts.short) {
      if (v >= 1e12) return (neg ? '-' : '') + 'Rp ' + U.num(v / 1e12, 2) + ' T';
      if (v >= 1e9) return (neg ? '-' : '') + 'Rp ' + U.num(v / 1e9, 2) + ' M';
      if (v >= 1e6) return (neg ? '-' : '') + 'Rp ' + U.num(v / 1e6, 1) + ' jt';
    }
    return (neg ? '-' : '') + 'Rp ' + Math.round(v).toLocaleString('id-ID');
  };
  U.num = (n, d = 0) =>
    n === null || n === undefined || isNaN(n)
      ? '—'
      : Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  U.pct = (n, d = 0) => (isFinite(n) ? U.num(n * 100, d) + '%' : '—');

  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  U.BULAN = BULAN;
  U.date = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${+d} ${BULAN[+m - 1]} ${y}`;
  };
  U.datetime = (iso) => (iso ? U.date(iso) + ' ' + iso.slice(11, 16) : '—');

  /* Demo clock: deterministic, advances 7 minutes per action so audit trails stay ordered */
  let clockTick = 0;
  U.now = (state) => {
    const base = Date.parse(U.DEMO_TODAY + 'T08:00:00Z');
    const tick = state ? (state.meta.clock = (state.meta.clock || 0) + 1) : ++clockTick;
    return new Date(base + (tick * 7 + ((state && state.meta.offsetMin) || 0)) * 60000).toISOString().slice(0, 19);
  };

  /* HAWK ID format observed in v2.11.6 screenshots: PR20261100001 / PO20261100001
     (prefix + YYYY + MM + 5-digit sequence). Other prefixes follow the same pattern
     and are marked TO VERIFY in INTEGRATION_CONTRACTS.md. */
  U.nextId = (state, prefix, period = U.DEMO_PERIOD) => {
    const key = prefix + period.replace('-', '');
    const seq = (state.meta.seq[key] = (state.meta.seq[key] || 0) + 1);
    return prefix + period.replace('-', '') + String(seq).padStart(5, '0');
  };

  U.esc = (s) =>
    String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  HAWK.U = U;
})(typeof window !== 'undefined' ? window : globalThis);
