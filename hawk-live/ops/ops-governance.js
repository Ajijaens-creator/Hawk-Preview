/* HAWK Operational · module "governance" — diadaptasi dari paket Owner A02 v1.2 (tools/ops-from-prototype.py). DATA DEMO / SIMULASI. */
/* HAWK Operational — governance, roadmap, reporting and acceptance UI.
 * Standalone demo only. Visibility controls are not backend authorization.
 */
(function () {
  'use strict';
  const H = window.OPX;
  const e = value => H.escape(value == null ? '' : String(value));
  const isLead = () => ['manager', 'assistant'].includes(H.user().role);
  const canConfigure = () => isLead() && H.has('settings') && H.has('settings.manage');
  const isOutletLead = () => ['manager', 'assistant', 'supervisor'].includes(H.user().role);
  const roleNames = {manager:'Manager Operational', assistant:'Assistant Spa Manager', hospitality:'Hospitality Manager', supervisor:'Supervisor Outlet', head:'Head Departemen', reception:'Receptionist', therapist:'Therapist', attendant:'Attendant', security:'Security'};
  const delegatedRoles = ['head', 'reception', 'therapist', 'attendant', 'security'];
  const menuCaps = [
    {id:'dashboard', name:'Command Center', allowed:delegatedRoles},
    {id:'analytics', name:'Dashboard & input kinerja', allowed:delegatedRoles},
    {id:'pos', name:'POS & Receptionist', allowed:['reception']},
    {id:'daily', name:'Daily Operations', allowed:['head','reception','therapist','attendant','security']},
    {id:'tasks', name:'Team & Tasks', allowed:delegatedRoles},
    {id:'therapist', name:'Therapist Workspace', allowed:['head','therapist']},
    {id:'rooms', name:'Room & Facility', allowed:['head','reception','therapist','attendant','security']},
    {id:'inventory', name:'Inventory Coordination', allowed:['head','attendant']},
    {id:'communication', name:'Communication Hub', allowed:delegatedRoles},
    {id:'race', name:'Ambidex & RACE', allowed:delegatedRoles},
    {id:'budget', name:'Budget & Performance', allowed:[]},
    {id:'reports', name:'Reports & Analytics', allowed:['head']},
    {id:'settings', name:'Settings & Access', allowed:[]}
  ];
  const phases = [
    ['F-OP00','Foundation & mapping','roadmap','Audit referensi dan petakan interface terhadap layanan ERP.','INTEGRATE','Brand NV-47, route existing, daftar bukti dan kontrak tiap layar.','Pastikan demo, reference UI dan backend terverifikasi dibedakan.'],
    ['F-OP01','Organization & access','settings','Akun personal, outlet scope, Head Departemen dan delegasi.','EXTEND','Master karyawan HRD, role, izin tindakan dan relasi pelaporan.','Uji Supervisor satu outlet pada API, ekspor dan ID objek.'],
    ['F-OP02','Operational dashboards','dashboard','Command Center + 14 dashboard familiar untuk Manager, Assistant, Hospitality Manager dan Supervisor.','INTEGRATE','Booking, presensi, target dan stock alert existing.','KPI belum sah ditandai gap; mock tidak dilabel live.'],
    ['F-OP03','POS & Receptionist','pos','Buka POS existing; dashboard dan Appointment Book dipertahankan utuh.','REUSE','Appointment, allocation, invoice dan payment engine existing.','Validasi ketersediaan ulang, izin refund dan pembatalan sesuai kebijakan.'],
    ['F-OP04','Daily operations','daily','Opening, briefing, handover, closing dan EOD sign-off.','BUILD','Checklist berversi, tugas, bukti dan status layanan dari POS.','Closing tidak menyembunyikan pekerjaan dan insiden yang masih terbuka.'],
    ['F-OP05','Workforce & task verification','tasks','My Tasks, Head review, Supervisor assurance dan mobile Therapist.','EXTEND','Shift/presensi HRD dan treatment POS; task baru additive.','Selesai bekerja dan terverifikasi memiliki waktu yang berbeda.'],
    ['F-OP06','Rooms, facility & receiving','rooms','Readiness, cleaning, maintenance dan penerimaan fisik outlet.','BUILD','Master ruang dan stock ledger existing; readiness baru.','Attendant mencatat; Supervisor verifikasi; Inventory yang posting.'],
    ['F-OP07','Communication & issues','communication','Percakapan terkait tugas, issue, prioritas dan eskalasi.','BUILD','Satu task/issue ID yang dibaca berbagai workspace.','Pesan tidak menggantikan approval; akses lampiran mengikuti scope.'],
    ['F-OP08','Ambidex, RACE & X-Score','race','SER, Vegen, Beacon, Daily, Weekly/R2Re, Reflection, STRACON.','BUILD','Kontrak indikator dari workbook; bukti berasal dari proses operasional.','X-Score resmi ditahan sampai formula, bobot dan agregasi divalidasi.'],
    ['F-OP09','Finance budget integration','budget','Budget aktivitas Process, Place, Facility dan Product per outlet.','INTEGRATE','Finance mengatur alokasi, komitmen dan actual. People hanya persentase.','P7 Profit adalah hasil. Tidak menjumlahkannya sebagai biaya.'],
    ['F-OP10','Reports & analytics','reports','14 laporan Looker, detail sumber, entry & verifikasi, insight per diagram serta EOD.','INTEGRATE','Data bersama dari POS, HRD, Inventory dan Operational.','Satu peristiwa tidak dihitung sebagai beberapa transaksi.'],
    ['F-OP11','Validation & handoff','validation','UAT frontend, kontrak backend, regresi dan kesiapan integrasi.','VALIDATE','NB, NV, NP, manifest, kontrak data dan paket prototype.','Lulus prototype tidak berarti lulus produksi atau izin deploy.']
  ];
  const checklist = [
    ['brand','Tampilan mengikuti NV-47','Sidebar hitam, header charcoal, canvas ivory, kartu putih dan aksen emas.'],
    ['navigation','Navigasi tetap di portal Operational','Portal lain hanya melalui popup logo HAWK; sidebar mengikuti role.'],
    ['outlet','Supervisor terkunci pada satu outlet','Coba akun Ubud, Shanti, Triloka dan Bisma. Uji backend wajib di fase integrasi.'],
    ['personal','Workspace staff sesuai tugas sendiri','Therapist/Attendant/Security tidak memperoleh tampilan data tim lain.'],
    ['task','Delegasi Head dan final assurance','Tugas kritis tidak selesai hanya dengan review Head. Supervisor menjadi tahap akhir.'],
    ['workflow','Opening sampai closing dapat disimulasikan','Checklist, handover dan issue mengacu pada outlet yang sama.'],
    ['rooms','Treatment dan readiness tidak bertentangan','Ruangan setelah treatment menuju turnover; tidak otomatis Clean & Ready.'],
    ['receiving','Penerimaan bukan posting stok','Catatan fisik → verifikasi Supervisor → Inventory; tidak menambah ledger lokal.'],
    ['people','Budget People tetap persentase','Tidak ada nominal payroll pada halaman atau ekspor Operational.'],
    ['race','Skor resmi tidak direkayasa','Rumus X-Score berstatus belum final; bukti dan data kosong dibedakan.'],
    ['persistence','Perubahan demo dan reset bekerja','Perubahan tersimpan lokal. Reset hanya membersihkan data prototype ini.'],
    ['handoff','Backend dan preview existing belum diubah','Paket memuat batas implementasi, pemetaan layanan dan tahap persetujuan.']
  ];

  function stat(label, value, note, type) {
    return `<article class="stat ${type || ''}"><span class="stat-label">${e(label)}</span><strong class="stat-value">${e(value)}</strong><span class="stat-note">${e(note)}</span></article>`;
  }
  function taskRows() {
    if (H.scopedTasks) return H.scopedTasks();
    const u = H.user();
    const rows = H.scope(H.state.data.tasks || []);
    if (isOutletLead()) return rows;
    if (u.role === 'head') return rows.filter(t => t.dept === u.dept);
    return rows.filter(t => t.assignee === u.id);
  }
  function outletName(id) { return (H.outlets.find(o => o.id === id) || {}).short || id || '—'; }
  function canViewAll() { return isOutletLead(); }
  function auditRows() {
    const rows = H.state.data.audit || [];
    const u = H.user();
    if (isLead() && H.state.outletId === 'all') return rows;
    const ids = new Set(taskRows().map(t => t.id));
    return rows.filter(a => {
      if (a.outlet) return H.scope([a]).length && (isOutletLead() || ids.has(a.entityId || a.id));
      return ids.has(a.entityId || '') || (!isOutletLead() && (a.actorId === u.id || a.userId === u.id));
    });
  }
  function allowed(cap, role) { return cap.allowed.includes(role) && (!H.defaultPermissions || (H.defaultPermissions[role] || []).includes(cap.id)); }
  function configured(cap, role) {
    if (!allowed(cap, role)) return false;
    const saved = H.state.permissions && H.state.permissions[role];
    return saved && typeof saved[cap.id] === 'boolean' ? saved[cap.id] : true;
  }

  H.pages.settings = {
    title:'Team, roles & permissions',
    subtitle:'Satu aturan akses bersama. Delegasi tetap dalam kewenangan portal dan scope outlet.',
    phase:'F-OP01',
    render() {
      const editable = canConfigure();
      const accounts = (H.accounts || []).filter(a => isLead() || H.user().role==='hospitality' || a.outlet === H.user().outlet);
      const routine = (H.state.policies || {}).routine || 'head';
      const tab = H.ui.govTab || 'roles';
      let body = '';
      if (tab === 'roles') {
        body = `<div class="notice">${H.icon('shield')} <div><strong>Menu sederhana, izin tetap terkontrol.</strong><br><span class="small">Checkbox mengatur akses menu demo dalam batas role. Refund, harga khusus, payroll, posting jurnal dan akses lintas outlet tidak dapat diberikan dari sini.</span></div></div>
        <form data-form="govPermissions" class="card gov-matrix"><div class="card-head"><div><h2 class="card-title">Matriks akses tim</h2><p class="muted small">${editable ? 'Eni Restini dan Tika dapat mengonfigurasi delegasi demo.' : 'Mode baca. Konfigurasi dikelola Manager atau Assistant yang mendapat delegasi.'}</p></div>${H.badge('Scope tetap 1 outlet','gold')}</div>
        <div class="table-wrap"><table><thead><tr><th>Menu Operational</th>${delegatedRoles.map(r=>`<th>${e(roleNames[r])}</th>`).join('')}</tr></thead><tbody>${menuCaps.map(c=>`<tr><td><strong>${e(c.name)}</strong></td>${delegatedRoles.map(r=>`<td class="gov-check">${allowed(c,r)?`<input type="checkbox" name="${r}:${c.id}" aria-label="${e(c.name)} untuk ${e(roleNames[r])}" ${configured(c,r)?'checked':''} ${editable?'':'disabled'}>`:'<span class="muted" aria-label="Di luar kewenangan">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="gov-form-footer"><p class="muted small">Tanda — = di luar batas role. Penyimpanan hanya memengaruhi prototype ini.</p>${editable?'<button class="btn btn-primary" type="submit">Simpan matriks demo</button>':''}</div></form>
        <div class="grid-2"><article class="card"><div class="card-head"><h2 class="card-title">Batas yang selalu berlaku</h2>${H.badge('D1–D6 · ADR-11','gray')}</div><ul class="gov-clean-list"><li>Supervisor: tepat satu outlet aktif.</li><li>Head: departemen dan outlet yang ditugaskan.</li><li>Staff: data pribadi dan pekerjaan yang relevan.</li><li>Data People: persentase; nominal tidak disertakan.</li><li>Perubahan HRD tidak menghapus histori outlet sebelumnya.</li></ul></article>
        <article class="card"><div class="card-head"><h2 class="card-title">Pembagian pengelola</h2></div><div class="list-row"><strong>HRD</strong><span class="muted">Identitas, struktur, penugasan dan status kerja</span></div><div class="list-row"><strong>IAM / administrator</strong><span class="muted">Kebijakan dan batas izin perusahaan</span></div><div class="list-row"><strong>Manager portal</strong><span class="muted">Akses tim yang didelegasikan di portalnya</span></div><div class="list-row"><strong>Backend</strong><span class="muted">Memvalidasi izin pada setiap request dan objek</span></div></article></div>`;
      } else if (tab === 'workflow') {
        body = `<div class="grid-2"><form data-form="govPolicies" class="card"><div class="card-head"><div><h2 class="card-title">Hybrid verification</h2><p class="muted small">OP-ADR-10 · kebijakan operasional demo</p></div>${H.badge('Manager / Assistant','gold')}</div>
          <label class="field">Tugas rutin<select name="routine" ${editable?'':'disabled'}><option value="head" ${routine==='head'?'selected':''}>Head Departemen memverifikasi</option><option value="self" ${routine==='self'?'selected':''}>PIC selesai dengan checklist / bukti</option></select></label>
          <label class="field">Tugas kritis & exception<input value="Head review → Supervisor final assurance" readonly></label>
          <label class="field">Opening / closing dan penerimaan barang<input value="Tetap membutuhkan verifikasi Supervisor" readonly></label>
          <div class="notice small">Kebijakan berlaku untuk transisi berikutnya. Histori keputusan sebelumnya tetap tersimpan.</div>
          ${editable?'<button class="btn btn-primary" type="submit">Simpan kebijakan demo</button>':'<p class="muted small">Hubungi Manager atau Assistant untuk mengubah kebijakan.</p>'}
        </form><article class="card"><div class="card-head"><h2 class="card-title">Siapa melakukan apa?</h2></div><div class="gov-steps"><div><b>01</b><span><strong>PIC</strong><small>Kerjakan, catat hasil dan lampirkan bukti.</small></span></div><div><b>02</b><span><strong>Head Departemen</strong><small>Review kualitas. Kembalikan untuk perbaikan bila perlu.</small></span></div><div><b>03</b><span><strong>Supervisor Outlet</strong><small>Verifikasi akhir untuk kritis / exception; sampling tugas rutin.</small></span></div><div><b>04</b><span><strong>Manager / Assistant</strong><small>Atur kebijakan, coaching dan eskalasi antar-fungsi.</small></span></div></div></article></div>`;
      } else {
        body = `<article class="card"><div class="card-head"><div><h2 class="card-title">Akun & penugasan demo</h2><p class="muted small">Identitas akun nyata nantinya merujuk master karyawan HRD.</p></div>${H.badge('Demo, bukan akun produksi','gold')}</div><div class="table-wrap"><table><thead><tr><th>Nama akun</th><th>Role</th><th>Lingkup</th><th>Departemen</th></tr></thead><tbody>${accounts.map(a=>`<tr><td><strong>${e(a.name)}</strong></td><td>${e(a.title || roleNames[a.role])}</td><td>${['manager','assistant','hospitality'].includes(a.role)?'Seluruh outlet JAENS Spa':e(outletName(a.outlet))}</td><td>${e(a.dept || 'Manajemen')}</td></tr>`).join('')}</tbody></table></div></article><div class="notice">Mutasi outlet mengganti penugasan aktif dan mencabut akses lama. Supervisor tidak dapat memperoleh dua outlet aktif melalui konfigurasi ini.</div>`;
      }
      return `<div class="tabs" role="tablist">${[['roles','Roles & permissions'],['workflow','Aturan verifikasi'],['team','Tim & organisasi']].map(([id,label])=>`<button class="tab ${tab===id?'active':''}" role="tab" aria-selected="${tab===id}" data-act="gov-tab" data-id="${id}">${label}</button>`).join('')}</div>${body}`;
    }
  };

  H.actions['gov-tab'] = el => { if(!H.has('settings')) return H.toast('Menu Settings tidak termasuk akses akun ini.'); H.ui.govTab = el.dataset.id; H.render(); };
  H.forms.govPermissions = fd => {
    if (!canConfigure()) return H.toast('Hanya Manager / Assistant dengan izin konfigurasi aktif yang dapat menyimpan.');
    H.state.permissions = H.state.permissions || {};
    delegatedRoles.forEach(role => {
      H.state.permissions[role] = H.state.permissions[role] || {};
      menuCaps.forEach(c => { H.state.permissions[role][c.id] = allowed(c,role) && fd.get(`${role}:${c.id}`) === 'on'; });
    });
    H.log('ACCESS_POLICY_DEMO','OP-ADR-11','Matriks menu diperbarui dalam batas delegasi. Scope outlet tidak berubah.');
    H.save(); H.render(); H.toast('Matriks demo tersimpan. Ganti akun untuk melihat akses efektif.');
  };
  H.forms.govPolicies = fd => {
    if (!canConfigure()) return H.toast('Perubahan kebijakan memerlukan izin konfigurasi Manager / Assistant yang aktif.');
    const routine = fd.get('routine');
    if (!['self','head'].includes(routine)) return H.toast('Pilih kebijakan tugas rutin.');
    H.state.policies = Object.assign({},H.state.policies,{routine,critical:'supervisor',headReview:true});
    H.log('TASK_POLICY_DEMO','OP-ADR-10',`Rutin: ${routine}; kritis tetap Supervisor final assurance.`);
    H.save(); H.render(); H.toast('Kebijakan demo tersimpan. Histori tugas tetap utuh.');
  };

  H.pages.roadmap = {
    title:'Peta pengembangan Operational',
    subtitle:'12 fase interface, satu model data bersama, integrasi bertahap dengan engine HAWK existing.',
    phase:'F-OP00',
    render() {
      return `<article class="card gov-hero"><div><span class="eyebrow">HAWK × JAENS · OPERATIONAL</span><h2>Satu interface yang menyatukan<br>kesiapan outlet dan pelayanan.</h2><p>POS tetap menjadi workspace di Operational. Setiap fase menyertakan keputusan bisnis, referensi visual, sumber data dan kebutuhan backend yang harus dibuktikan.</p></div><div class="gov-hero-stat"><strong>12</strong><span>fase interface</span><small>F-OP00 — F-OP11</small></div></article>
        <div class="grid-4">${stat('Dashboard sumber','14','Looker + screenshot Owner + workbook SER')}${stat('Supervisor capabilities','17','Cakupan Report 05, bukan seluruh ERP')}${stat('Dilaporkan sudah tersedia','1 + 3','1 tersedia; 3 perlu integrasi')}${stat('Dilaporkan parsial / baru','4 / 9','Audit PARTIAL; belum uji production')}</div>
        <article class="card"><div class="card-head"><div><h2 class="card-title">Infrastruktur bersama, workspace sesuai tanggung jawab</h2><p class="muted small">Peta target desain. Tidak menyatakan integrasi live telah tersedia.</p></div>${H.badge('One data entry','gold')}</div>
          <div class="gov-architecture"><div class="gov-portal"><span class="eyebrow">SALES</span><h3>CRM & Reservation</h3><p>Lead, komunikasi, booking dan atribusi penjualan</p></div><div class="gov-portal current"><span class="eyebrow">OPERATIONAL</span><h3>Outlet & POS</h3><p>Booking resmi, pelayanan, task, readiness, quality</p></div><div class="gov-portal"><span class="eyebrow">FINANCE</span><h3>Budget & ledger</h3><p>Accounting, Inventory, Purchasing dan actual</p></div><div class="gov-portal"><span class="eyebrow">HRD</span><h3>People & performance</h3><p>Identitas, shift, presensi dan laporan kinerja</p></div><div class="gov-portal"><span class="eyebrow">COMMERCIAL</span><h3>Marketing</h3><p>Campaign, promosi dan kontribusi hasil</p></div></div>
          <div class="gov-service"><strong>API / services HAWK existing + resource Operational additive</strong><span>Identitas bersama · RBAC server · ID transaksi yang sama · audit trail · rekonsiliasi</span></div>
          <div class="gov-truth"><span>Booking → POS</span><span>Karyawan → HRD</span><span>Stok / actual → Finance</span><span>Kesiapan & tugas → Operational</span><span>Lead → Sales</span></div>
        </article><div class="gov-phase-grid">${phases.map((p,i)=>`<article class="card gov-phase"><div class="row between"><span class="eyebrow">${p[0]}</span>${H.badge(p[4],p[4]==='BUILD'?'gold':p[4]==='REUSE'?'green':'blue')}</div><h3>${e(p[1])}</h3><p>${e(p[3])}</p><div class="gov-phase-detail"><span>Sumber & dependensi</span><p>${e(p[5])}</p></div><button class="btn btn-sm" data-act="gov-phase" data-id="${i}">Lihat scope fase ${H.icon('arrow-right')}</button></article>`).join('')}</div>
        <div class="notice"><strong>Urutan kerja:</strong> Cocokkan bukti → NB → NV → prototype → review → implementasi per fase yang diotorisasi → regresi → release. Izin membuat prototype ini tidak mengizinkan perubahan production.</div>`;
    }
  };
  H.actions['gov-phase'] = el => {
    const p = phases[Number(el.dataset.id)];
    if (!p) return;
    H.modal(`${p[0]} · ${p[1]}`,`<div class="stack">${H.badge(p[4],'gold')}<p>${e(p[3])}</p><div class="notice"><strong>Data dan dependensi</strong><br>${e(p[5])}</div><h3>Gate sebelum integrasi</h3><p>${e(p[6])}</p><p class="muted small">Klasifikasi berdasarkan scope desain dan laporan audit. Kontrak endpoint nyata harus dikonfirmasi developer dalam fase ini.</p></div>`,`<button class="btn btn-primary" data-act="gov-open-phase" data-id="${e(p[2])}">Buka layar prototype</button>`);
  };
  H.actions['gov-open-phase'] = el => { H.closeModal(); H.navigate(el.dataset.id); };

  function reportData() {
    const tasks = taskRows();
    const broad = canViewAll();
    return {
      version:'HAWK-OP-PROTOTYPE-1.0', mode:'DEMO_ONLY', generatedAt:new Date().toISOString(),
      actor:H.user().name, role:H.user().role, outletScope:H.state.outletId,
      note:'Data sintetis prototype. Tidak ada payroll, X-Score resmi atau jurnal produksi.',
      tasks:tasks.map(({id,outlet,dept,title,status,critical,completedAt,verifiedAt,completionMode})=>({id,outlet,dept,title,status,critical,completedAt:completedAt||null,verifiedAt:verifiedAt||null,completionMode:completionMode||null,reviewVerified:status==='done'&&Boolean(verifiedAt)})),
      bookings:broad?H.scope(H.state.data.bookings||[]).map(({id,outlet,treatment,time,status,channel,sourceId})=>({id,outlet,treatment,time,status,channel,sourceId})):[],
      issues:broad?H.scope(H.state.data.issues||[]).map(({id,outlet,title,status,priority})=>({id,outlet,title,status,priority})):[],
      receipts:broad?H.scope(H.state.data.receipts||[]).map(({id,outlet,reference,item,status})=>({id,outlet,reference,item,status})):[]
    };
  }
  H.pages.reports = {
    title:'Reports & evidence',
    subtitle:'Ringkasan operasional dari data yang sama, dengan periode dan lingkup akses yang jelas.',
    phase:'F-OP10',
    render() {
      const tasks = taskRows();
      const done = tasks.filter(t=>t.status==='done');
      const reviewed = done.filter(t=>Boolean(t.verifiedAt));
      const waiting = tasks.filter(t=>['head_review','supervisor_review'].includes(t.status));
      const blocked = tasks.filter(t=>t.status==='blocked');
      const bookings = canViewAll()?H.scope(H.state.data.bookings||[]):[];
      const issues = canViewAll()?H.scope(H.state.data.issues||[]):[];
      const receipts = canViewAll()?H.scope(H.state.data.receipts||[]):[];
      const audits = auditRows().slice(0,8);
      const tab = H.ui.reportTab || 'overview';
      let content = '';
      if (tab === 'overview') {
        content = `<div class="grid-4">${stat('Tugas dalam lingkup',tasks.length,'Dari Team & Tasks')}${stat('Tuntas sesuai kebijakan',done.length,'Self-complete atau review yang diwajibkan')}${stat('Menunggu review',waiting.length,'Head / Supervisor')}${stat('Terblokir',blocked.length,'Butuh bantuan / eskalasi')}</div>
        <div class="grid-2"><article class="card"><div class="card-head"><h2 class="card-title">End-of-day summary</h2>${H.badge('Draft demo','gold')}</div><div class="gov-report-lines"><div><span>Appointment dalam lingkup</span><b>${canViewAll()?bookings.length:'Tidak ditampilkan'}</b></div><div><span>Treatment selesai / dibayar</span><b>${canViewAll()?bookings.filter(b=>['completed','complete','paid','closed'].includes(b.status)).length:'—'}</b></div><div><span>Issue belum ditutup</span><b>${canViewAll()?issues.filter(i=>!['resolved','closed','done'].includes(i.status)).length:'—'}</b></div><div><span>Penerimaan menunggu verifikasi</span><b>${canViewAll()?receipts.filter(r=>!['verified','posted'].includes(r.status)).length:'—'}</b></div><div><span>Persentase tugas tuntas</span><b>${tasks.length?Math.round(done.length/tasks.length*100)+'%':'Belum ada data'}</b></div><div><span>Tugas dengan verifikasi reviewer</span><b>${reviewed.length}</b></div><div><span>Tuntas tanpa verifikasi reviewer</span><b>${done.length-reviewed.length} · self-completion</b></div></div><p class="muted small">Jumlah appointment bukan unique guest. Persentase tugas bukan X-Score. Self-completion bukan verifikasi reviewer. Laporan finansial mengikuti Finance existing.</p></article>
        <article class="card"><div class="card-head"><h2 class="card-title">Tindak lanjut prioritas</h2><button class="btn btn-sm" data-act="gov-open-tasks">Buka tasks</button></div>${tasks.filter(t=>t.status!=='done').slice(0,5).map(t=>`<div class="list-row"><div><strong>${e(t.title)}</strong><small class="muted">${e(t.id)} · ${e(outletName(t.outlet))}</small></div>${H.badge(t.critical?'Kritis':t.status==='head_review'?'Head review':t.status==='supervisor_review'?'Supervisor review':'Berjalan',t.critical?'red':'gold')}</div>`).join('')||'<div class="empty">Tidak ada tindak lanjut dalam lingkup akun ini.</div>'}</article></div>`;
      } else if (tab === 'evidence') {
        content = `<article class="card"><div class="card-head"><div><h2 class="card-title">Jejak task → hasil → review</h2><p class="muted small">Hanya tugas dalam lingkup akun. Waktu kerja selesai dan verifikasi dicatat terpisah.</p></div></div><div class="table-wrap"><table><thead><tr><th>Task / sumber</th><th>Status</th><th>Bukti</th><th>Selesai</th><th>Terverifikasi</th></tr></thead><tbody>${tasks.map(t=>`<tr><td><strong>${e(t.id)}</strong><small class="muted">${e(t.title)}</small></td><td>${H.badge(t.status,t.status==='done'?'green':'gold')}</td><td>${t.evidence?'Catatan demo tersedia':'Belum ada'}</td><td>${t.completedAt?e(new Date(t.completedAt).toLocaleTimeString('id-ID',{timeZone:'Asia/Makassar',hour:'2-digit',minute:'2-digit'})):'—'}</td><td>${t.verifiedAt?e(new Date(t.verifiedAt).toLocaleTimeString('id-ID',{timeZone:'Asia/Makassar',hour:'2-digit',minute:'2-digit'})):'—'}</td></tr>`).join('')||'<tr><td colspan="5">Belum ada tugas.</td></tr>'}</tbody></table></div></article>`;
      } else {
        content = `<article class="card"><div class="card-head"><div><h2 class="card-title">Operational log</h2><p class="muted small">Riwayat aksi lokal. Ini belum merupakan audit log server.</p></div>${H.badge('Demo lokal','gray')}</div>${audits.map(a=>`<div class="list-row"><div><strong>${e(a.action || a.type || 'Aktivitas')}</strong><small class="muted">${e(a.detail || a.description || a.entityId || '')}</small></div><span class="small muted">${e(a.actor || a.actorName || a.user || '')}</span></div>`).join('')||'<div class="empty">Belum ada riwayat lokal yang sesuai dengan lingkup ini.</div>'}</article>`;
      }
      return `<div class="row between gov-report-toolbar"><div class="tabs" role="tablist">${[['overview','Ringkasan'],['evidence','Bukti & review'],['log','Operational log']].map(([id,name])=>`<button class="tab ${tab===id?'active':''}" data-act="gov-report-tab" data-id="${id}" role="tab" aria-selected="${tab===id}">${name}</button>`).join('')}</div>${H.has('export')?'<button class="btn" data-act="gov-export">Ekspor ringkasan demo</button>':''}</div>${content}`;
    }
  };
  H.actions['gov-report-tab'] = el => { if(!H.has('reports'))return H.toast('Menu Reports tidak termasuk akses akun ini.'); H.ui.reportTab=el.dataset.id; H.render(); };
  H.actions['gov-open-tasks'] = () => H.navigate('tasks');
  H.actions['gov-export'] = () => {
    if (!H.has('reports') || !H.has('export')) return H.toast('Izin laporan dan ekspor tidak tersedia untuk akun ini.');
    H.download('HAWK-Operational-Report-demo.json',reportData());
    H.log('EXPORT_DEMO','REPORT-OP','Ringkasan sesuai scope tanpa People nominal atau data payroll.');
    H.save(); H.toast('Ringkasan demo siap diunduh.');
  };

  H.pages.validation = {
    title:'Acceptance & developer handoff',
    subtitle:'Checklist review prototype, bukti uji dan batas kesiapan integrasi.',
    phase:'F-OP11',
    render() {
      const checks = H.state.validationChecks || {};
      const checked = checklist.filter(c=>checks[c[0]]).length;
      const editable = isLead();
      return `<div class="grid-3">${stat('Review manual dicatat',`${checked} / ${checklist.length}`,'Diisi reviewer, bukan hasil automated test')}${stat('Koneksi production','Tidak ada','HTML menggunakan data sintetis lokal')}${stat('Kesiapan backend','Belum diverifikasi','Diperiksa developer sebelum integrasi')}</div>
        <div class="notice"><strong>Prototype adalah spesifikasi interaksi.</strong> Checklist ini tidak memberi persetujuan migration, merge, akses production atau deployment. Hasil pengujian teknis paket dicatat terpisah pada QA-checklist.md.</div>
        <form class="card" data-form="govValidation"><div class="card-head"><div><h2 class="card-title">Review bersama tim lapangan</h2><p class="muted small">Centang hanya setelah dicoba. Uji keamanan backend tetap menjadi pekerjaan fase integrasi.</p></div>${H.badge('Review Owner / PIC','gold')}</div><div class="gov-uat-grid">${checklist.map(([id,title,desc])=>`<label class="gov-uat"><input type="checkbox" name="${id}" ${checks[id]?'checked':''} ${editable?'':'disabled'}><span><strong>${e(title)}</strong><small>${e(desc)}</small></span></label>`).join('')}</div>${editable?'<div class="gov-form-footer"><span class="muted small">Checklist tersimpan di browser ini.</span><button class="btn btn-primary" type="submit">Simpan hasil review manual</button></div>':''}</form>
        <div class="grid-2"><article class="card"><div class="card-head"><h2 class="card-title">Paket untuk Claude Developer</h2></div><div class="gov-report-lines"><div><span>HAWK-Operational-Prototype.html</span><b>Prototype interaktif</b></div><div><span>NB-OP01.md</span><b>Bisnis & workflow</b></div><div><span>NV-OP01.md</span><b>Visual & perilaku UI</b></div><div><span>NP-OP01.md</span><b>Instruksi per fase</b></div><div><span>feature-manifest.json</span><b>Scope / status fitur</b></div><div><span>data-contracts.json</span><b>Kontrak usulan</b></div><div><span>QA-checklist.md</span><b>Bukti & gate pengujian</b></div></div></article>
        <article class="card"><div class="card-head"><h2 class="card-title">Cara tim developer melanjutkan</h2></div><div class="gov-steps"><div><b>01</b><span><strong>Petakan dahulu</strong><small>Cocokkan route, komponen, API dan sumber data existing per fitur.</small></span></div><div><b>02</b><span><strong>Integrasikan per fase</strong><small>Pakai engine existing; fitur baru additive sesuai scope yang disetujui.</small></span></div><div><b>03</b><span><strong>Buktikan kesesuaian</strong><small>UAT lapangan, regresi formula, isolasi outlet dan retry tanpa duplikasi.</small></span></div><div><b>04</b><span><strong>Review hasil</strong><small>Serahkan bukti perubahan dan batasan sebelum izin rilis.</small></span></div></div></article></div>`;
    }
  };
  H.forms.govValidation = fd => {
    if (!isLead()) return H.toast('Checklist review dikonfirmasi Manager / Assistant.');
    H.state.validationChecks = {};
    checklist.forEach(([id]) => { H.state.validationChecks[id] = fd.get(id)==='on'; });
    H.log('MANUAL_UAT_REVIEW','F-OP11','Checklist review manual tersimpan; bukan hasil pengujian backend.');
    H.save(); H.render(); H.toast('Catatan review manual tersimpan.');
  };
})();
