/* UI kit: icons, badges, tables, charts (inline SVG), drawer, modal, toast. String templates + event delegation. */
(function (root) {
  'use strict';
  const HAWK = root.HAWK;
  const U = HAWK.U;
  const esc = U.esc;
  const ui = (HAWK.ui = HAWK.ui || {});

  /* ---------- icons (stroke, 24 grid) ---------- */
  const P = {
    home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
    org: 'M12 3v5M5 13v-2h14v2M5 13v3M19 13v3M12 8v8M3 16h4v5H3zM10 16h4v5h-4zM17 16h4v5h-4zM9 3h6v5H9z',
    target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
    budget: 'M4 7h16v12H4zM4 7l2-3h12l2 3M9 12h6M12 10v4',
    mrf: 'M9 3h6l1 2h3v16H5V5h3zM9 11h6M9 15h4',
    cart: 'M3 4h2l2.4 11h11L21 7H6.2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    box: 'M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10',
    finance: 'M4 20V10M9 20V4M14 20v-7M19 20v-11M3 20h18',
    asset: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z',
    ai: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4',
    inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 2h6l1-2h5',
    scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10',
    check: 'M5 12l5 5 9-10',
    x: 'M6 6l12 12M18 6L6 18',
    chev: 'M9 6l6 6-6 6',
    menu: 'M4 7h16M4 12h16M4 17h16',
    reset: 'M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0 0 12 3M19 9A7 7 0 0 0 7 6',
    code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14',
    play: 'M7 5l12 7-12 7z',
    truck: 'M3 6h11v9H3zM14 9h4l3 3v3h-7M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    plus: 'M12 5v14M5 12h14',
    doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
    users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7M22 21v-1a6 6 0 0 0-4-5.6',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
    clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v5l3 2',
    rack: 'M4 3v18M20 3v18M4 8h16M4 14h16M4 20h16',
    wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z',
  };
  ui.icon = (n, s = 18, cls = '') => `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n] || P.doc}"/></svg>`;

  /* ---------- status vocabulary (Bahasa Indonesia) ---------- */
  const ST = {
    DRAFT: ['Draft', ''], SUBMITTED: ['Menunggu approval', 'warn'], ESCALATED: ['Dieskalasi', 'violet'], REVISION: ['Perlu revisi', 'warn'], APPROVED: ['Disetujui', 'ok'], REJECTED: ['Ditolak', 'bad'],
    IN_FULFILLMENT: ['Dalam pemenuhan', 'info'], FULFILLED: ['Terpenuhi', 'ok'], CANCELLED: ['Dibatalkan', ''], PENDING_APPROVAL: ['Menunggu approval', 'warn'], SENT: ['Dikirim ke vendor', 'info'],
    PARTIAL: ['Diterima sebagian', 'warn'], RECEIVED: ['Diterima', 'ok'], CLOSED: ['Selesai', ''], REQUESTED: ['Diminta', 'warn'], IN_TRANSIT: ['Dalam perjalanan', 'info'],
    POSTED: ['Diposting', 'ok'], STORED: ['Tersimpan di rak', 'ok'], EXTRACTED: ['Diekstrak AI', 'violet'], MATCHED: ['Cocok', 'ok'], MISMATCH: ['Ada selisih', 'bad'], VERIFIED: ['Diverifikasi', 'ok'],
    PAID: ['Dibayar', 'ok'], PENDING_REVIEW: ['Menunggu review', 'warn'], LOCKED: ['Terkunci', 'dark'], ACTIVE: ['Aktif', 'ok'], ARCHIVED: ['Diarsipkan', ''], PENDING_DISPOSAL: ['Usul disposal', 'warn'],
    DISPOSED: ['Dilepas', ''], OPEN: ['Terbuka', 'info'], WAITING_PARTS: ['Menunggu suku cadang', 'warn'], COMPLETED: ['Selesai', 'ok'], IN_PROGRESS: ['Berjalan', 'info'], PROPOSED: ['Diusulkan', 'warn'],
    COUNTING: ['Sedang dihitung', 'info'], ON_TRACK: ['On track', 'ok'], AT_RISK: ['Berisiko', 'bad'], DONE: ['Selesai', 'ok'], NOT_STARTED: ['Belum mulai', ''], ACKNOWLEDGE: ['Diakui', 'info'], ASSIGN: ['Ditugaskan', 'violet'], DISMISS: ['Diabaikan', ''],
    RETURNED: ['Dikembalikan', 'warn'], GOODS_CONFIRMED: ['Barang dikonfirmasi', 'info'], SETTLED: ['Lunas / direkonsiliasi', 'ok'], IN_MATCHING: ['Dalam matching PO', 'violet'], IN_AP: ['Di AP', 'info'],
    OK: ['Dalam budget', 'ok'], WARN: ['Mendekati batas', 'warn'], OVER: ['Melebihi budget', 'bad'], EXCEPTION: ['Pengecualian', 'violet'], EXCEPTION_TRACK: ['Non-rutin (dilacak)', 'violet'], NO_BUDGET: ['Tanpa budget', 'bad'],
  };
  ui.status = (s) => {
    const [l, c] = ST[s] || [s, ''];
    return `<span class="badge ${c}">${esc(l)}</span>`;
  };
  ui.statusLabel = (s) => (ST[s] || [s])[0];
  ui.intBadge = (status) => {
    const m = { 'CONFIRMED EXISTING': 'ce', 'TO VERIFY': 'tv', 'NEW INTEGRATION REQUIRED': 'new', 'UI-ONLY SIMULATION': 'sim' };
    return `<span class="int ${m[status] || 'tv'}" title="Status integrasi HAWK">${esc(status)}</span>`;
  };
  ui.demo = (t = 'DEMO / SIMULASI') => `<span class="badge demo">${t}</span>`;
  ui.id = (id) => (id ? `<span class="idlink" data-id="${esc(id)}" role="button" tabindex="0">${esc(id)}</span>` : '—');
  ui.p7 = (key) => {
    const p = HAWK.SEVEN_P.find((x) => x.key === key);
    return p ? `<span class="row" style="gap:6px;display:inline-flex"><i class="p-dot" style="background:${p.color}"></i>${esc(p.name)}</span>` : esc(key || '—');
  };
  ui.pColor = (key) => (HAWK.SEVEN_P.find((x) => x.key === key) || {}).color || '#999';

  ui.kpi = (label, val, sub = '', cls = '', icon = '') => `<div class="kpi ${cls}">${icon ? `<span class="ico">${ui.icon(icon, 40)}</span>` : ''}<div class="lbl">${label}</div><div class="val" title="${esc(String(val).replace(/<[^>]+>/g, ''))}">${val}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
  ui.bar = (ratio, cls) => {
    const r = Math.max(0, ratio || 0);
    const c = cls || (r > 1 ? 'bad' : r >= 0.9 ? 'warn' : 'ok');
    return `<div class="bar ${c}" title="${U.pct(r)}"><i style="width:${Math.min(100, r * 100)}%"></i></div>`;
  };
  ui.table = (cols, rows, opts = {}) => {
    const head = cols.map((c) => `<th class="${c.num ? 'num' : ''}">${c.h}</th>`).join('');
    const body = rows.length
      ? rows.map((r, i) => `<tr class="${opts.rowCls ? opts.rowCls(r, i) : ''}" ${opts.rowAttr ? opts.rowAttr(r, i) : ''}>${cols.map((c) => `<td class="${c.num ? 'num' : ''}">${c.f(r, i)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${cols.length}" class="empty">${opts.empty || 'Tidak ada data'}</td></tr>`;
    const foot = opts.foot ? `<tfoot><tr>${opts.foot}</tr></tfoot>` : '';
    return `<div class="tbl-wrap" ${opts.maxH ? `style="max-height:${opts.maxH}px"` : ''}><table class="tbl"><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${foot}</table></div>`;
  };
  ui.tabs = (key, items, cur) => `<div class="tabs" role="tablist">${items.map(([v, l, c]) => `<button class="tab ${v === cur ? 'on' : ''}" role="tab" aria-selected="${v === cur}" data-tab="${esc(key)}" data-v="${esc(v)}">${l}${c !== undefined ? `<span class="c">(${c})</span>` : ''}</button>`).join('')}</div>`;
  ui.stepper = (steps, cur) =>
    `<div class="stepper">${steps.map((s, i) => `${i ? `<div class="step-line ${i <= cur ? 'done' : ''}"></div>` : ''}<div class="step ${i < cur ? 'done' : i === cur ? 'cur' : ''}"><span class="n">${i < cur ? '✓' : i + 1}</span>${esc(s)}</div>`).join('')}</div>`;
  ui.empty = (t) => `<div class="empty">${t}</div>`;
  ui.legend = (items) => `<div class="legend">${items.map((i) => `<span><i class="p-dot" style="background:${i.color}"></i>${esc(i.label)}</span>`).join('')}</div>`;

  /* ---------- charts ---------- */
  ui.line = ({ labels, series, h = 180, fmt = (v) => U.num(v), area = true }) => {
    const W = 560, H = h, L = 46, B = 22, T = 10, R = 10;
    const all = series.flatMap((s) => s.values).filter((v) => v !== null);
    const max = Math.max(...all, 1) * 1.1;
    const x = (i) => L + (i * (W - L - R)) / Math.max(1, labels.length - 1);
    const y = (v) => T + (H - T - B) * (1 - v / max);
    const grid = [0, 0.25, 0.5, 0.75, 1].map((g) => `<line x1="${L}" x2="${W - R}" y1="${y(max * g)}" y2="${y(max * g)}" stroke="#eee"/><text x="${L - 6}" y="${y(max * g) + 4}" font-size="10" text-anchor="end" fill="#999">${fmt(max * g)}</text>`).join('');
    const xl = labels.map((l, i) => `<text x="${x(i)}" y="${H - 6}" font-size="10" text-anchor="middle" fill="#888">${esc(l)}</text>`).join('');
    const paths = series
      .map((s, si) => {
        const pts = s.values.map((v, i) => (v === null ? null : [x(i), y(v)])).filter(Boolean);
        const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
        const a = area && si === 0 ? `<path d="${d} L${pts[pts.length - 1][0]} ${y(0)} L${pts[0][0]} ${y(0)} Z" fill="${s.color}" opacity="0.14"/>` : '';
        return `${a}<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.4" ${s.dash ? 'stroke-dasharray="5 4"' : ''}/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="#fff" stroke="${s.color}" stroke-width="1.6"/>`).join('')}`;
      })
      .join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${grid}${xl}${paths}</svg>${ui.legend(series.map((s) => ({ label: s.name, color: s.color })))}`;
  };
  ui.bars = ({ labels, series, h = 190, fmt = (v) => U.num(v), stacked = false }) => {
    const W = 560, H = h, L = 50, B = 24, T = 10, R = 8;
    const totals = labels.map((_, i) => (stacked ? U.sum(series, (s) => s.values[i] || 0) : Math.max(...series.map((s) => s.values[i] || 0))));
    const max = Math.max(...totals, 1) * 1.1;
    const bw = (W - L - R) / labels.length;
    const y = (v) => T + (H - T - B) * (1 - v / max);
    const grid = [0, 0.5, 1].map((g) => `<line x1="${L}" x2="${W - R}" y1="${y(max * g)}" y2="${y(max * g)}" stroke="#eee"/><text x="${L - 6}" y="${y(max * g) + 4}" font-size="10" text-anchor="end" fill="#999">${fmt(max * g)}</text>`).join('');
    let rects = '';
    labels.forEach((l, i) => {
      let acc = 0;
      series.forEach((s, si) => {
        const v = s.values[i] || 0;
        const w = stacked ? bw * 0.62 : (bw * 0.7) / series.length;
        const xx = L + i * bw + (stacked ? bw * 0.19 : bw * 0.15 + si * w);
        const top = stacked ? y(acc + v) : y(v);
        const hh = stacked ? y(acc) - y(acc + v) : y(0) - y(v);
        rects += `<rect x="${xx}" y="${top}" width="${w}" height="${Math.max(0, hh)}" rx="3" fill="${s.color}"><title>${esc(s.name)} ${esc(l)}: ${fmt(v)}</title></rect>`;
        acc += v;
      });
      rects += `<text x="${L + i * bw + bw / 2}" y="${H - 7}" font-size="10" text-anchor="middle" fill="#888">${esc(l)}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${grid}${rects}</svg>${series.length > 1 ? ui.legend(series.map((s) => ({ label: s.name, color: s.color }))) : ''}`;
  };
  ui.donut = ({ items, center = '', sub = '', size = 170 }) => {
    const tot = U.sum(items, (i) => i.value) || 1;
    const r = 60, C = 2 * Math.PI * r;
    let off = 0;
    const arcs = items
      .map((i) => {
        const len = (i.value / tot) * C;
        const s = `<circle r="${r}" cx="80" cy="80" fill="none" stroke="${i.color}" stroke-width="22" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)"><title>${esc(i.label)}: ${U.pct(i.value / tot, 1)}</title></circle>`;
        off += len;
        return s;
      })
      .join('');
    return `<div class="row" style="gap:14px;flex-wrap:nowrap;align-items:center"><svg viewBox="0 0 160 160" width="${size}" height="${size}" style="flex:none">${arcs}<text x="80" y="78" text-anchor="middle" font-size="17" font-weight="800" fill="#17140f">${esc(center)}</text><text x="80" y="96" text-anchor="middle" font-size="10" fill="#888">${esc(sub)}</text></svg><div class="legend" style="flex-direction:column;gap:5px">${items.map((i) => `<span><i class="p-dot" style="background:${i.color}"></i>${esc(i.label)} <b style="margin-left:auto;padding-left:8px">${U.pct(i.value / tot, 0)}</b></span>`).join('')}</div></div>`;
  };
  ui.gauge = (ratio, label = '', size = 150) => {
    const r = 54, C = Math.PI * r;
    const v = Math.max(0, Math.min(1.2, ratio));
    const col = ratio > 1 ? '#c53030' : ratio >= 0.9 ? '#e0a526' : '#1f9d55';
    return `<svg viewBox="0 0 140 84" width="${size}" style="display:block;margin:auto"><path d="M16 72 A54 54 0 0 1 124 72" fill="none" stroke="#eee" stroke-width="13" stroke-linecap="round"/><path d="M16 72 A54 54 0 0 1 124 72" fill="none" stroke="${col}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${(Math.min(1, v) * C).toFixed(1)} ${C}"/><text x="70" y="62" text-anchor="middle" font-size="20" font-weight="800">${U.pct(ratio)}</text><text x="70" y="80" text-anchor="middle" font-size="9" fill="#888">${esc(label)}</text></svg>`;
  };
  ui.spark = (vals, color = '#c99a2e', w = 90, h = 24) => {
    const max = Math.max(...vals), min = Math.min(...vals);
    const pts = vals.map((v, i) => `${(i * w) / (vals.length - 1)},${h - 2 - ((v - min) / (max - min || 1)) * (h - 4)}`).join(' ');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
  };

  /* ---------- overlays ---------- */
  const $ = (sel) => document.querySelector(sel);
  ui.toast = (msg, kind = '', sub = '') => {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.setAttribute('role', 'status');
    t.innerHTML = esc(msg) + (sub ? `<small>${esc(sub)}</small>` : '');
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), kind === 'bad' ? 6000 : 3800);
  };
  ui.openDrawer = (title, body, foot = '', sub = '') => {
    $('#drawer-title').innerHTML = title + (sub ? ` <span class="badge dark" style="margin-left:6px">${sub}</span>` : '');
    $('#drawer-body').innerHTML = body;
    $('#drawer-foot').innerHTML = foot;
    $('#drawer-foot').style.display = foot ? '' : 'none';
    $('#drawer').classList.add('on');
    $('#scrim').classList.add('on');
    $('#drawer').setAttribute('aria-hidden', 'false');
  };
  ui.closeDrawer = () => {
    $('#drawer').classList.remove('on');
    $('#drawer').setAttribute('aria-hidden', 'true');
    if (!$('#modal').classList.contains('on')) $('#scrim').classList.remove('on');
  };
  ui.openModal = (title, body, foot) => {
    $('#modal-title').innerHTML = title;
    $('#modal-body').innerHTML = body;
    $('#modal-foot').innerHTML = foot || '<button class="btn ghost" data-close-modal>Tutup</button>';
    $('#modal').classList.add('on');
    $('#scrim').classList.add('on');
    setTimeout(() => {
      const f = $('#modal-body input, #modal-body select, #modal-body textarea');
      if (f) f.focus();
    }, 50);
  };
  ui.closeModal = () => {
    $('#modal').classList.remove('on');
    if (!$('#drawer').classList.contains('on')) $('#scrim').classList.remove('on');
  };
  /* Prompt for a required note (replaces window.prompt which would block automation) */
  ui.ask = (title, label, cb, opts = {}) => {
    ui.openModal(
      title,
      `<div class="field"><label>${esc(label)}</label><textarea class="inp" id="ask-note" rows="3" placeholder="${esc(opts.placeholder || '')}">${esc(opts.value || '')}</textarea>${opts.hint ? `<span class="hint">${opts.hint}</span>` : ''}</div>`,
      `<button class="btn ghost" data-close-modal>Batal</button><button class="btn ${opts.danger ? 'bad' : ''}" id="ask-ok">${esc(opts.ok || 'Kirim')}</button>`
    );
    $('#ask-ok').onclick = () => {
      const v = $('#ask-note').value.trim();
      ui.closeModal();
      cb(v);
    };
  };
})(window);
