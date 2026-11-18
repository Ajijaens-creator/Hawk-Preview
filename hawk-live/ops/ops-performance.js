/* HAWK Operational · module "performance" — diadaptasi dari prototype Owner v1.1 (tools/ops-from-prototype.py). DATA DEMO / SIMULASI. */
(function () {
  'use strict';
  const H = window.OPX;
  if (!H) throw new Error('HAWK shell must load before performance module.');
  H.ui = H.ui || {};
  H.actions = H.actions || {};
  H.forms = H.forms || {};
  H.pages = H.pages || {};
  const e = v => H.escape(v == null ? '' : String(v));
  const money = n => H.money(n);
  const badge = (t, c) => H.badge(t, c || 'gray');
  const btn = (label, action, id, primary) => `<button type="button" class="btn ${primary ? 'btn-primary' : ''}" data-act="${action}"${id == null ? '' : ` data-id="${e(id)}"`}>${e(label)}</button>`;
  const empty = msg => `<div class="empty"><strong>Belum ada catatan</strong><p>${e(msg)}</p></div>`;
  const state = () => {
    H.state.data.raceSessions = H.state.data.raceSessions || [];
    H.state.data.budgetRequests = H.state.data.budgetRequests || [];
    return H.state.data;
  };
  const scopedOutlet = () => H.user().outlet || (H.state.outletId === 'all' ? null : H.state.outletId);
  const isLeadership = () => ['manager','assistant','supervisor'].includes(H.user().role);
  const canRace = () => H.has('race');
  const canBudget = () => isLeadership() && H.has('budget');
  const allowedOutlet = outlet => H.outlets.some(o=>o.id===outlet) && (H.user().outlet ? H.user().outlet===outlet : H.state.outletId==='all'||H.state.outletId===outlet);
  const localDate = () => H.state.date || '2026-11-18';
  const nowLabel = () => new Date().toLocaleString('id-ID', {timeZone:'Asia/Makassar',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
  const modalClose = () => { if (H.closeModal) H.closeModal(); else document.querySelector('[data-act="close-modal"]')?.click(); };
  const outletOptions = () => {
    const list = H.outlets.filter(o=>allowedOutlet(o.id));
    return list.map(o=>`<option value="${e(o.id)}"${scopedOutlet()===o.id?' selected':''}>${e(o.name)}</option>`).join('');
  };
  function myTasks() {
    const u=H.user();
    let rows=H.scope(state().tasks || []);
    if(u.role==='head') rows=rows.filter(t=>t.dept===u.dept);
    else if(!isLeadership()) rows=rows.filter(t=>t.assignee===u.id || t.assignee===u.name);
    return rows;
  }
  function mySessions() {
    const u=H.user();
    let rows=H.scope(state().raceSessions);
    if(u.role==='head') rows=rows.filter(r=>r.department===u.dept);
    else if(!isLeadership()) rows=rows.filter(r=>r.authorId===u.id);
    return rows;
  }
  const INDICATORS = [
    {id:'KPI-DEMO-01',name:'Revenue Service',area:'Financial Sustainability',unit:'Rupiah',target:'Sesuai kontrak outlet',source:'POS → invoice layanan',kind:'POS',direction:'Lebih tinggi',route:'pos'},
    {id:'KPI-DEMO-02',name:'Revenue Product',area:'Financial Sustainability',unit:'Rupiah',target:'Sesuai kontrak outlet',source:'POS Retail → invoice',kind:'POS',direction:'Lebih tinggi',route:'pos'},
    {id:'KPI-DEMO-03',name:'Kepuasan pelanggan',area:'Customer Value & Experience',unit:'Rating',target:'Menunggu verifikasi',source:'Feedback 7P / review',kind:'QUALITY',direction:'Lebih tinggi',route:'communication'},
    {id:'KPI-DEMO-04',name:'Penanganan komplain minor',area:'Customer Value & Experience',unit:'Jam',target:'Menunggu SLA resmi',source:'Issue → waktu resolusi',kind:'NEW',direction:'Lebih rendah',route:'communication'},
    {id:'KPI-DEMO-05',name:'Rebooking pelanggan',area:'Customer Value & Experience',unit:'Persentase',target:'Menunggu kontrak',source:'CRM + booking ID yang sama',kind:'INTEGRATE',direction:'Lebih tinggi',route:'pos'},
    {id:'KPI-DEMO-06',name:'Room Utility',area:'Service Delivery Excellence',unit:'Persentase',target:'Rumus menunggu final',source:'Appointment + jam ruang',kind:'POS',direction:'Lebih tinggi',route:'rooms'},
    {id:'KPI-DEMO-07',name:'Grooming karyawan',area:'Service Delivery Excellence',unit:'Persentase',target:'Menunggu kontrak',source:'Checklist → hasil verifikasi',kind:'NEW',direction:'Lebih tinggi',route:'daily'},
    {id:'KPI-DEMO-08',name:'Waste BHP dan retail',area:'Asset Integrity & Risk Control',unit:'Persentase',target:'Menunggu kontrak',source:'Inventory → mutasi berizin',kind:'INTEGRATE',direction:'Lebih rendah',route:'inventory'},
    {id:'KPI-DEMO-09',name:'Akurasi stock opname',area:'Asset Integrity & Risk Control',unit:'Persentase',target:'Menunggu kontrak',source:'Inventory → opname',kind:'INTEGRATE',direction:'Lebih tinggi',route:'inventory'},
    {id:'KPI-DEMO-10',name:'Respons maintenance',area:'Infrastructure Health',unit:'Menit',target:'Menunggu kontrak',source:'Issue → first response',kind:'NEW',direction:'Lebih rendah',route:'communication'}
  ];
  const raceTabs = [['vegen','Vegen & kontrak'],['beacon','Beacons'],['daily','Daily RACE'],['weekly','Weekly / R2Re'],['monthly','Monthly Reflection'],['stracon','STRACON'],['score','X-Score']];
  function taskRows(rows) {
    const statuses={todo:'Belum mulai',doing:'Dikerjakan',head_review:'Review Head',supervisor_review:'Review Supervisor',done:'Selesai'};
    return rows.map(t=>`<tr><td><span class="mono">${e(t.id)}</span><div class="small muted">${e(t.dept)}</div></td><td><strong>${e(t.title)}</strong></td><td>${badge(t.status==='done'?(t.verifiedAt?'Terverifikasi':'Selesai · sesuai kebijakan'):(statuses[t.status]||t.status),t.status==='done'?'green':t.status==='doing'?'blue':'gold')}</td><td>${t.evidence?badge('Ada bukti','green'):badge('Bukti belum lengkap','gray')}</td><td>${btn('Buka tugas','perf-task',t.id)}</td></tr>`).join('');
  }
  function sessionsCard(type) {
    const rows=mySessions().filter(r=>r.type===type).slice().reverse();
    return `<section class="card"><div class="card-head"><div><div class="eyebrow">HISTORI DEMO</div><h3 class="card-title">Sesi tersimpan</h3></div>${badge(`${rows.length} draf`,'gray')}</div>${rows.length?rows.map(r=>`<div class="perf-session"><div class="row between"><strong>${e(r.title)}</strong>${badge('Draf lokal','gold')}</div><p>${e(r.summary)}</p><div class="small muted">${e(r.date)} · ${e(r.author)} · ${e(r.id)}</div>${r.blocker?`<div class="perf-blocker">Hambatan: ${e(r.blocker)}</div>`:''}${r.commitment?`<div class="small">Komitmen: ${e(r.commitment)}</div>`:''}</div>`).join(''):empty('Catatan sesi akan memakai referensi tugas yang sama; tidak menyalin transaksi.')}</section>`;
  }
  function vegenView() {
    const rows=INDICATORS.map(x=>`<tr><td><span class="mono small">${x.id}</span><div><strong>${e(x.name)}</strong></div><div class="small muted">${e(x.area)}</div></td><td>${e(x.unit)}<div class="small muted">${e(x.direction)}</div></td><td>${e(x.target)}</td><td><span class="small">${e(x.source)}</span></td><td>${badge('Belum dikunci','gold')}</td><td>${btn('Kontrak','perf-indicator',x.id)}</td></tr>`).join('');
    return `<div class="grid-2 perf-lead"><section class="card"><div class="eyebrow">SER → RACE VEGEN</div><h3 class="card-title">Satu kontrak, satu jejak hasil.</h3><p class="muted">Target, satuan, bobot, PIC, rumus dan evidence memiliki versi. Tujuan outlet diteruskan ke departemen serta individu sesuai kontrak masing-masing.</p><div class="perf-steps"><span>SER</span><span>Goal</span><span>Beacon</span><span>Evidence</span></div></section><section class="card"><div class="eyebrow">STATUS SUMBER</div><h3 class="card-title">Indikator mengikuti workbook.</h3><p class="muted">Nama di bawah adalah contoh rancangan pemetaan untuk dicocokkan dengan workbook SER. Inventaris, target dan formula resmi perlu diverifikasi developer pada F-OP08.</p>${badge('10 contoh pemetaan · bukan daftar lengkap','gold')}</section></div><section class="card"><div class="card-head"><div><h3 class="card-title">Register indikator Operational</h3><p class="small muted">Nilai target, bobot, aktual, dan X-Score resmi tidak diisi dengan angka rekaan.</p></div>${badge('Draft kontrak','gold')}</div><div class="table-wrap"><table><thead><tr><th>Indikator</th><th>Pengukuran</th><th>Target</th><th>Sumber utama</th><th>Versi rumus</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }
  function beaconView() {
    const tasks=myTasks();
    const group=[{title:'Service readiness',detail:'Kesiapan ruangan sebelum tamu datang',dept:'attendant',source:'Room + cleaning',route:'rooms'},{title:'Guest experience',detail:'Tindak lanjut komplain dan keterlambatan',dept:'reception',source:'Issue + appointment',route:'communication'},{title:'Service discipline',detail:'Ketertiban SOP dan kesiapan therapist',dept:'therapist',source:'HRD + tugas',route:'tasks'}];
    return `<div class="notice"><strong>Beacon menjadi penghubung pekerjaan dan tujuan.</strong> Relasi di bawah adalah contoh rancangan; belum merupakan kontrak KPI yang disahkan.</div><div class="grid-3">${group.map((b,i)=>`<section class="card perf-beacon"><div class="row between"><span class="eyebrow">BCN-DEMO-0${i+1}</span>${badge('Rancangan','gold')}</div><h3>${b.title}</h3><p class="muted">${b.detail}</p><div class="perf-beacon-number">${tasks.filter(t=>(t.dept||'').toLowerCase().includes(b.dept)).length}<span>tugas terkait</span></div><div class="small muted">Sumber: ${b.source}</div>${btn('Lihat aktivitas','perf-route',b.route)}</section>`).join('')}</div><section class="card"><h3 class="card-title">Aturan pengukuran yang harus dikunci</h3><div class="grid-3 perf-rule-grid"><div><strong>Target & bobot</strong><p class="muted small">Ditentukan per kontrak dan periode; perubahan tidak menimpa histori.</p></div><div><strong>Evidence yang sama</strong><p class="muted small">Task ID, booking ID dan issue ID direferensikan, tidak disalin ulang.</p></div><div><strong>Review berjenjang</strong><p class="muted small">Head departemen meninjau; Supervisor memberi assurance sesuai kebijakan.</p></div></div></section>`;
  }
  function dailyView() {
    const tasks=myTasks();
    const submitted=tasks.filter(t=>['head_review','supervisor_review'].includes(t.status)).length;
    const verified=tasks.filter(t=>t.status==='done'&&t.verifiedAt).length;
    const selfCompleted=tasks.filter(t=>t.status==='done'&&!t.verifiedAt).length;
    return `<div class="kpi-grid"><div class="stat"><div class="stat-label">Komitmen hari ini</div><div class="stat-value">${tasks.length}</div><div class="stat-note">Task ID dari Team & Tasks</div></div><div class="stat"><div class="stat-label">Menunggu review</div><div class="stat-value">${submitted}</div><div class="stat-note">Pekerjaan diserahkan PIC</div></div><div class="stat"><div class="stat-label">Terverifikasi</div><div class="stat-value">${verified}</div><div class="stat-note">${selfCompleted} selesai sesuai kebijakan · belum diverifikasi</div></div><div class="stat"><div class="stat-label">Sesi Daily</div><div class="stat-value">${mySessions().filter(r=>r.type==='daily').length}</div><div class="stat-note">Draf tersimpan lokal</div></div></div><section class="card"><div class="card-head"><div><h3 class="card-title">Komitmen dari tugas operasional</h3><p class="small muted">Daftar ini berubah ketika tugas yang sama diperbarui di Team & Tasks.</p></div>${btn('Catat Daily RACE','perf-session','daily',true)}</div>${tasks.length?`<div class="table-wrap"><table><thead><tr><th>Task ID</th><th>Komitmen</th><th>Status</th><th>Evidence</th><th></th></tr></thead><tbody>${taskRows(tasks)}</tbody></table></div>`:empty('Belum ada tugas dalam cakupan akun ini.')}</section>${sessionsCard('daily')}`;
  }
  function rhythmView(type) {
    const map={weekly:{over:'WEEKLY RACE / R2Re',title:'Review hasil. Tetapkan komitmen berikutnya.',desc:'Ringkas hasil tugas, gap indikator, hambatan dan tindak lanjut minggu depan. Data harian dirujuk kembali; persentase mingguan tidak dijumlah menjadi skor bulanan.',cards:[['Hasil','Apa yang selesai dan sudah diverifikasi?'],['Gap','Apa yang tertunda dan mengapa?'],['Komitmen','Siapa melakukan apa pada minggu berikutnya?']]},monthly:{over:'MONTHLY REFLECTION',title:'Hasil sebulan, pembelajaran untuk langkah berikutnya.',desc:'Review pencapaian, kualitas layanan, penggunaan budget dan perkembangan tim. Periode yang sudah ditutup mempertahankan versi kontrak serta bukti aslinya.',cards:[['Pencapaian','Baca hasil dari POS, tugas dan laporan sumber.'],['Pembelajaran','Tinjau sebab, pola, dan tindakan perbaikan.'],['Pengembangan','Hubungkan kebutuhan coaching ke workspace HRD.']]},stracon:{over:'STRACON',title:'Usulkan perubahan strategi secara tercatat.',desc:'STRACON menampung alasan perubahan, keputusan yang dibutuhkan dan tanggal efektif. Menyimpan draf tidak mengubah target, bobot, formula atau budget yang berlaku.',cards:[['Konteks','Apa perubahan yang membutuhkan keputusan?'],['Usulan','Target, prioritas atau sumber daya apa yang diusulkan?'],['Efektivitas','Versi dan tanggal efektif menunggu otorisasi.']]}};
    const m=map[type];
    return `<section class="card perf-rhythm"><div class="eyebrow">${m.over}</div><h2>${m.title}</h2><p class="muted">${m.desc}</p><div class="grid-3 perf-rule-grid">${m.cards.map((c,i)=>`<div><span class="perf-step-no">0${i+1}</span><strong>${c[0]}</strong><p class="small muted">${c[1]}</p></div>`).join('')}</div><div class="row between"><span class="small muted">Struktur form ini adalah rancangan prototype, bukan bukti workflow production.</span>${btn(type==='stracon'?'Buat usulan STRACON':'Buat catatan review','perf-session',type,true)}</div></section>${sessionsCard(type)}`;
  }
  function scoreView() {
    const levels=[['Individu','Kontrak personal + hasil pekerjaan','HRD Performance'],['Departemen','Reception · Therapist · Attendant · Security','Head departemen'],['Outlet','Pencapaian satu outlet sesuai kontrak','Supervisor outlet'],['Operational','Konsolidasi seluruh outlet','Eni Restini · Race Leader']];
    const u=H.user();
    const visible=isLeadership()?levels:u.role==='head'?levels.slice(0,2):levels.slice(0,1);
    return `<div class="notice"><strong>X-Score resmi belum dapat dihitung.</strong> Rumus, bobot, arah indikator, penanganan data kosong dan cara konsolidasi harus disahkan dari kontrak sumber. Prototype tidak mengubah indikator tugas menjadi skor karyawan otomatis.</div><div class="grid-${visible.length>=3?'4':visible.length===2?'2':'1'}">${visible.map((l,i)=>`<section class="card perf-score"><div class="eyebrow">LEVEL 0${i+1}</div><h3>${l[0]}</h3><div class="perf-score-value">—</div>${badge('Menunggu kontrak','gold')}<p class="small muted">${l[1]}</p><div class="perf-score-owner">${l[2]}</div></section>`).join('')}</div><section class="card"><div class="card-head"><h3 class="card-title">Syarat perhitungan dan rekonsiliasi</h3>${badge('F-OP08','gray')}</div><div class="grid-2 perf-rule-grid"><div><strong>Data & rumus</strong><p class="small muted">Satu definisi numerator/denominator, periode, satuan, arah better/worse, dan pembulatan. Missing data tetap unknown, tidak disamakan dengan nol.</p></div><div><strong>Roll-up antarlevel</strong><p class="small muted">Agregasi memakai aturan kontrak; tidak merata-ratakan semua persentase tanpa denominator dan tidak menggandakan revenue yang sama.</p></div><div><strong>Riwayat & evidence</strong><p class="small muted">Target dan bobot berversi. Setiap actual memiliki referensi sumber dan status verifikasi.</p></div><div><strong>Hak akses HRD</strong><p class="small muted">Karyawan melihat hasil sendiri. HRD membaca hasil yang sama sesuai izin; perubahan upah/komisi memerlukan kebijakan tersendiri.</p></div></div></section>`;
  }
  H.pages.race={title:'Ambidex & RACE',subtitle:'Kontrak KPI, ritme tim, dan kinerja yang bisa ditelusuri.',phase:'F-OP08',render(){
    if(!canRace())return '<section class="card"><h3>Akses RACE dibatasi</h3><p class="muted">Role ini belum memiliki izin modul RACE.</p></section>';
    const tab=H.ui.raceTab||'vegen';state();
    return `<div class="perf-page"><div class="perf-context"><span>${badge('EXPLOITATION / EXPLORATION','gold')}</span><span class="small muted">Periode demo: November 2026 · kontrak resmi menunggu verifikasi</span></div><div class="tabs perf-tabs">${raceTabs.map(([id,label])=>`<button type="button" class="tab ${tab===id?'active':''}" data-act="perf-race-tab" data-id="${id}" aria-pressed="${tab===id}">${label}</button>`).join('')}</div>${tab==='vegen'?vegenView():tab==='beacon'?beaconView():tab==='daily'?dailyView():tab==='score'?scoreView():rhythmView(tab)}</div>`;
  }};
  H.actions['perf-race-tab']=el=>{if(!canRace())return;H.ui.raceTab=el.dataset.id;H.render();};
  H.actions['perf-route']=el=>H.navigate(el.dataset.id);
  H.actions['perf-task']=el=>{H.ui.taskFocus=el.dataset.id;H.navigate('tasks');};
  H.actions['perf-indicator']=el=>{
    if(!canRace())return;
    const x=INDICATORS.find(x=>x.id===el.dataset.id);if(!x)return;
    H.modal('Kontrak indikator — '+x.name,`<div class="notice">Pemetaan rancangan • Belum menjadi kontrak produksi.</div><dl class="perf-dl"><dt>Referensi prototype</dt><dd>${x.id}</dd><dt>Area tujuan</dt><dd>${e(x.area)}</dd><dt>Satuan & arah</dt><dd>${e(x.unit)} · ${e(x.direction)}</dd><dt>Sumber actual</dt><dd>${e(x.source)}</dd><dt>Target</dt><dd>${e(x.target)}</dd><dt>Bobot, rumus, versi</dt><dd>Menunggu audit workbook dan persetujuan Owner.</dd><dt>Prinsip integrasi</dt><dd>Actual dibaca dari sumber utama. Koreksi mengikuti source record dan audit trail.</dd></dl><p class="small muted">Label indikator adalah contoh rancangan pemetaan. Seluruh workbook dan rumus resmi harus diperiksa sebelum menjadi kontrak KPI.</p>`);
  };
  H.actions['perf-session']=el=>{
    if(!canRace()){H.toast('Izin RACE dibatasi.');return;}
    const type=el.dataset.id||'daily'; const labels={daily:'Daily RACE',weekly:'Weekly RACE / R2Re',monthly:'Monthly Reflection',stracon:'Usulan STRACON'};
    H.modal(labels[type],`<form data-form="perf-session"><input type="hidden" name="type" value="${type}"><div class="notice">Simpan sebagai draf demo lokal. Target, skor, budget dan transaksi tidak berubah.</div><div class="grid-2"><div class="field"><label for="race-outlet">Outlet</label><select id="race-outlet" name="outlet">${outletOptions()}</select></div><div class="field"><label for="race-date">${type==='stracon'?'Tanggal efektif yang diusulkan':'Tanggal sesi'}</label><input id="race-date" name="date" type="date" value="${e(localDate())}" required></div></div><div class="field"><label for="race-title">Judul</label><input id="race-title" name="title" maxlength="140" placeholder="${type==='stracon'?'Usulan penyesuaian prioritas outlet':'Review kesiapan dan layanan outlet'}" required></div><div class="field"><label for="race-summary">${type==='stracon'?'Usulan dan alasan':'Hasil / pembelajaran'}</label><textarea id="race-summary" name="summary" rows="3" maxlength="1500" required></textarea></div><div class="field"><label for="race-blocker">Hambatan atau keputusan yang dibutuhkan</label><textarea id="race-blocker" name="blocker" rows="2" maxlength="800"></textarea></div><div class="field"><label for="race-commitment">Komitmen berikutnya</label><input id="race-commitment" name="commitment" maxlength="250" placeholder="Tindakan, PIC, dan tenggat"></div><div class="perf-modal-actions"><button class="btn btn-primary" type="submit">Simpan draf demo</button></div></form>`);
  };
  H.forms['perf-session']=(fd)=>{
    if(!canRace()){H.toast('Izin RACE dibatasi.');return;}
    const u=H.user(),outlet=String(fd.get('outlet')||'');
    if(!allowedOutlet(outlet)){H.toast('Outlet di luar cakupan akun.');return;}
    const type=String(fd.get('type')||'daily'),title=String(fd.get('title')||'').trim(),summary=String(fd.get('summary')||'').trim();
    if(!['daily','weekly','monthly','stracon'].includes(type)||!title||!summary){H.toast('Lengkapi judul dan catatan.');return;}
    const item={id:'RACE-DEMO-'+Date.now().toString(36).toUpperCase(),type,outlet,date:String(fd.get('date')||localDate()),title:title.slice(0,140),summary:summary.slice(0,1500),blocker:String(fd.get('blocker')||'').slice(0,800),commitment:String(fd.get('commitment')||'').slice(0,250),author:u.name,authorId:u.id,department:u.dept||'management',status:'draft',sourceTaskIds:myTasks().filter(t=>t.outlet===outlet).map(t=>t.id),recordedAt:nowLabel()};
    state().raceSessions.push(item);H.log('RACE_DRAFT_SAVED',item.id,`${type} · ${outlet}`,outlet);H.save();modalClose();H.ui.raceTab=type;H.render();H.toast('Draf RACE tersimpan; kontrak KPI tetap.');
  };

  // Finance owns every approved allocation. This module is a scoped read model and proposal UI.
  const BUDGETS=[
    {p:'P2',label:'Product',name:'BHP & amenities',base:144000000,actual:.59,committed:.13,color:'#2f6fde'},
    {p:'P4',label:'Process',name:'Pelaksanaan & SOP',base:72000000,actual:.62,committed:.08,color:'#0891b2'},
    {p:'P5',label:'Place',name:'Bangunan & utilitas',base:96000000,actual:.66,committed:.09,color:'#d97706'},
    {p:'P6',label:'Facility',name:'Peralatan & maintenance',base:120000000,actual:.48,committed:.18,color:'#64748b'}
  ];
  const WEIGHTS=[7,6,7,8,8,9,10,10,8,8,8,11];
  const MONTHS=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const FACTORS=[1,.85,1.15,.9];
  function budgetContext(){
    const mode=H.ui.budgetPeriod||'month',month=Number(H.ui.budgetMonth??10),quarter=Math.floor(month/3),week=Number(H.ui.budgetWeek||1);
    const allowed=H.user().outlet?H.outlets.filter(o=>o.id===H.user().outlet):H.state.outletId&&H.state.outletId!=='all'?H.outlets.filter(o=>o.id===H.state.outletId):H.outlets;
    const factor=allowed.reduce((n,o)=>n+(FACTORS[Math.max(0,H.outlets.findIndex(x=>x.id===o.id))]||1),0);
    const weights=mode==='year'?100:mode==='quarter'?WEIGHTS.slice(quarter*3,quarter*3+3).reduce((a,b)=>a+b,0):mode==='week'?WEIGHTS[month]*([.23,.24,.25,.28][week-1]||.25):WEIGHTS[month];
    const label=mode==='year'?'FY2026':mode==='quarter'?`Q${quarter+1} 2026`:mode==='week'?`Minggu ${week} · ${MONTHS[month]} 2026`:`${MONTHS[month]} 2026`;
    const rows=BUDGETS.map(b=>{const revised=Math.round(b.base*factor*weights/100),actual=Math.round(revised*b.actual),committed=Math.round(revised*b.committed);return {...b,revised,actual,committed,available:revised-actual-committed,forecast:Math.round(revised*.94)};});
    return {mode,month,quarter,week,allowed,factor,weights,label,rows};
  }
  function budgetTable(ctx){
    return `<div class="table-wrap"><table><thead><tr><th>Kategori</th><th>Disetujui</th><th>Aktual</th><th>Komitmen terbuka</th><th>Tersedia</th><th></th></tr></thead><tbody>${ctx.rows.map(r=>`<tr><td><strong><span class="perf-p-dot" style="background:${r.color}"></span>${r.p} ${r.label}</strong><div class="small muted">${r.name}</div></td><td class="mono">${money(r.revised)}</td><td class="mono">${money(r.actual)}</td><td class="mono">${money(r.committed)}</td><td class="mono"><strong>${money(r.available)}</strong></td><td>${btn('Rincian','perf-budget-detail',r.p)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function budgetRequests(){
    const rows=H.scope(state().budgetRequests).slice().reverse();
    return `<section class="card"><div class="card-head"><div><h3 class="card-title">Usulan aktivitas outlet</h3><p class="small muted">Usulan tidak mengurangi saldo. Komitmen baru diakui melalui transaksi Finance/PO sesuai engine.</p></div>${badge(`${rows.length} draf`,'gray')}</div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>Referensi</th><th>Aktivitas</th><th>Kategori</th><th>Estimasi</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="mono small">${e(r.id)}</td><td><strong>${e(r.title)}</strong><div class="small muted">${e(r.author)} · ${e(r.date)}</div></td><td>${e(r.p)} · ${e(r.stream)}</td><td>${money(r.amount)}</td><td>${badge('Usulan lokal','gold')}</td></tr>`).join('')}</tbody></table></div>`:empty('Buat usulan kebutuhan; Finance tetap pemilik alokasi resmi.')}</section>`;
  }
  H.pages.budget={title:'Budget & Performance',subtitle:'Kendali pengeluaran outlet dari satu alokasi Finance.',phase:'F-OP09',render(){
    if(!canBudget())return `<section class="card"><h3>Akses anggaran dibatasi</h3><p class="muted">Gunakan permintaan kebutuhan melalui tugas atau Inventory. Nilai anggaran hanya tersedia bagi role berizin.</p></section>`;
    const c=budgetContext(),s=c.rows.reduce((o,r)=>({revised:o.revised+r.revised,actual:o.actual+r.actual,committed:o.committed+r.committed,available:o.available+r.available}),{revised:0,actual:0,committed:0,available:0});
    return `<div class="perf-page"><div class="perf-budget-tools"><div class="tabs">${[['year','Tahunan'],['quarter','Triwulan'],['month','Bulanan'],['week','Mingguan']].map(([id,label])=>`<button class="tab ${c.mode===id?'active':''}" data-act="perf-budget-period" data-id="${id}" aria-pressed="${c.mode===id}">${label}</button>`).join('')}</div><div class="row"><span class="small muted">${c.label}</span>${btn('Usulkan kebutuhan','perf-budget-request',null,true)}</div></div><div class="perf-month-strip">${MONTHS.map((m,i)=>`<button class="perf-month ${i===c.month?'active':''}" data-act="perf-budget-month" data-id="${i}" aria-pressed="${i===c.month}">${m}</button>`).join('')}</div>${c.mode==='week'?`<div class="tabs">${[1,2,3,4].map(w=>`<button class="tab ${c.week===w?'active':''}" data-act="perf-budget-week" data-id="${w}">Minggu ${w}</button>`).join('')}</div>`:''}<div class="notice"><strong>SIMULASI BUDGET · ${c.label}.</strong> Alokasi tahunan memakai bobot musiman contoh. Angka hanya P2, P4, P5, P6 dalam cakupan aktif; bukan total seluruh 7P. P1 People hanya persentase.</div><div class="kpi-grid"><div class="stat perf-stat-gold"><div class="stat-label">Alokasi terpilih</div><div class="stat-value perf-money">${money(s.revised)}</div><div class="stat-note">P2 + P4 + P5 + P6 · contoh</div></div><div class="stat"><div class="stat-label">Realisasi</div><div class="stat-value perf-money">${money(s.actual)}</div><div class="stat-note">Dari ledger Finance · simulasi</div></div><div class="stat"><div class="stat-label">Komitmen terbuka</div><div class="stat-value perf-money">${money(s.committed)}</div><div class="stat-note">Bagian belum menjadi actual</div></div><div class="stat"><div class="stat-label">Sisa tersedia</div><div class="stat-value perf-money">${money(s.available)}</div><div class="stat-note">Alokasi − aktual − komitmen</div></div></div><div class="perf-budget-layout"><section class="card"><div class="card-head"><div><h3 class="card-title">Ruang anggaran operasional</h3><p class="small muted">${c.allowed.length} outlet · periode ${c.label}</p></div>${badge('Read model Finance','blue')}</div>${budgetTable(c)}</section><section class="card perf-people"><div class="eyebrow">P1 · PEOPLE</div><h3 class="card-title">Kendali persentase</h3><div class="perf-percent">79<span>%</span></div><div class="progress"><span style="width:79%"></span></div><p class="small muted">Utilisasi contoh. Nominal dan rincian payroll tidak disediakan pada prototype Operational.</p>${badge('Akses HRD / Finance','gray')}<hr><div class="eyebrow">P7 · PROFIT</div><p class="small muted">Hasil usaha dari Finance. Tidak dijumlahkan sebagai pos belanja.</p><div class="eyebrow">P3 · PROMOTION</div><p class="small muted">Alokasi Marketing / Commercial di luar subtotal halaman ini.</p></section></div><section class="card"><div class="card-head"><div><h3 class="card-title">Distribusi tahunan → periode</h3><p class="small muted">Bobot contoh berjumlah 100%; Finance menentukan pola final dan revisinya.</p></div>${btn('Lihat distribusi','perf-budget-distribution')}</div><div class="perf-season">${WEIGHTS.map((v,i)=>`<button class="perf-season-col ${i===c.month?'selected':''}" data-act="perf-budget-month" data-id="${i}" aria-label="${MONTHS[i]}: ${v} persen"><span>${v}%</span><i style="height:${v*5}px"></i><small>${MONTHS[i]}</small></button>`).join('')}</div><div class="perf-steps"><span>Finance mengalokasi</span><span>Outlet mengusulkan</span><span>PO / Inventory / GL</span><span>Actual & variance</span></div></section>${budgetRequests()}</div>`;
  }};
  H.actions['perf-budget-period']=el=>{if(!canBudget())return;H.ui.budgetPeriod=el.dataset.id;H.render();};
  H.actions['perf-budget-month']=el=>{if(!canBudget())return;H.ui.budgetMonth=Number(el.dataset.id);H.render();};
  H.actions['perf-budget-week']=el=>{if(!canBudget())return;H.ui.budgetWeek=Number(el.dataset.id);H.render();};
  H.actions['perf-budget-detail']=el=>{
    if(!canBudget())return;const c=budgetContext(),r=c.rows.find(r=>r.p===el.dataset.id);if(!r)return;
    H.modal(`${r.p} ${r.label} — ${c.label}`,`<div class="notice">Data contoh. Alokasi resmi dibaca dari Finance; halaman Operational mengirim usulan.</div><dl class="perf-dl"><dt>Aktivitas</dt><dd>${r.name}</dd><dt>Budget periode</dt><dd>${money(r.revised)}</dd><dt>Actual</dt><dd>${money(r.actual)}</dd><dt>Komitmen terbuka</dt><dd>${money(r.committed)}</dd><dt>Tersedia</dt><dd>${money(r.available)}</dd><dt>Forecast contoh</dt><dd>${money(r.forecast)}</dd><dt>Jejak sumber</dt><dd>budget_line_id → request_id → PO / receiving → journal_ref</dd></dl><p class="small muted">Komitmen dan actual harus direkonsiliasi agar tidak mengakui pengeluaran dua kali. Endpoint agregasi Finance masih memerlukan verifikasi / integrasi.</p>`);
  };
  H.actions['perf-budget-distribution']=()=>{
    if(!canBudget())return;const c=budgetContext(),annual=BUDGETS.reduce((n,r)=>n+r.base*c.factor,0);
    H.modal('Distribusi Finance — simulasi',`<div class="notice">Bobot adalah contoh untuk interaksi; bukan formula budget yang disetujui.</div><div class="table-wrap"><table><thead><tr><th>Bulan</th><th>Bobot</th><th>P2/P4/P5/P6</th></tr></thead><tbody>${WEIGHTS.map((w,i)=>`<tr><td>${MONTHS[i]}</td><td>${w}%</td><td>${money(Math.round(annual*w/100))}</td></tr>`).join('')}</tbody><tfoot><tr><th>Total</th><th>100%</th><th>${money(annual)}</th></tr></tfoot></table></div><p class="small muted">Distribusi mingguan contoh memakai 23% / 24% / 25% / 28% dari bulan terpilih. Kalender bisnis resmi dan revisi alokasi ditetapkan Finance.</p>`);
  };
  H.actions['perf-budget-request']=()=>{
    if(!canBudget()){H.toast('Izin pengajuan budget dibatasi.');return;}
    H.modal('Usulkan aktivitas operasional',`<form data-form="perf-budget-request"><div class="notice">Draf lokal diteruskan sebagai spesifikasi integrasi. Tidak membuat PO, jurnal atau komitmen Finance.</div><div class="grid-2"><div class="field"><label for="budget-outlet">Outlet</label><select id="budget-outlet" name="outlet">${outletOptions()}</select></div><div class="field"><label for="budget-category">Kategori</label><select id="budget-category" name="p">${BUDGETS.map(b=>`<option value="${b.p}">${b.p} ${b.label}</option>`).join('')}</select></div></div><div class="field"><label for="budget-title">Aktivitas / kebutuhan</label><input id="budget-title" name="title" required maxlength="160" placeholder="Contoh: pemeliharaan AC ruang treatment"></div><div class="grid-2"><div class="field"><label for="budget-amount">Estimasi biaya (Rp)</label><input id="budget-amount" type="number" name="amount" min="1" step="1" required></div><div class="field"><label for="budget-date">Tanggal kebutuhan</label><input id="budget-date" type="date" name="date" value="${e(localDate())}" required></div></div><div class="grid-2"><div class="field"><label for="budget-stream">Management stream</label><select id="budget-stream" name="stream"><option>Operational</option><option>Innovation</option></select></div><div class="field"><label for="budget-type">Jenis dana</label><select id="budget-type" name="fund"><option>OPEX</option><option>CAPEX</option><option>Inventory</option></select></div></div><div class="field"><label for="budget-reason">Alasan & manfaat</label><textarea id="budget-reason" name="reason" rows="3" maxlength="1000" required></textarea></div><div class="perf-modal-actions"><button class="btn btn-primary" type="submit">Simpan usulan demo</button></div></form>`);
  };
  H.forms['perf-budget-request']=(fd)=>{
    if(!canBudget())return;const u=H.user(),outlet=String(fd.get('outlet')||''),amount=Number(fd.get('amount')),p=String(fd.get('p'));
    if(!allowedOutlet(outlet)){H.toast('Outlet di luar cakupan akun.');return;}
    if(!Number.isFinite(amount)||amount<=0||!BUDGETS.some(b=>b.p===p)||!String(fd.get('title')||'').trim()){H.toast('Lengkapi aktivitas dan nilai estimasi yang valid.');return;}
    const r={id:'BPR-DEMO-'+Date.now().toString(36).toUpperCase(),outlet,p,amount:Math.round(amount),title:String(fd.get('title')).trim().slice(0,160),date:String(fd.get('date')||localDate()),stream:String(fd.get('stream')||'Operational'),fund:String(fd.get('fund')||'OPEX'),reason:String(fd.get('reason')||'').slice(0,1000),author:u.name,authorId:u.id,status:'draft',committed:false};
    state().budgetRequests.push(r);H.log('BUDGET_PROPOSAL_DRAFT',r.id,`${r.p} · ${r.title}`,outlet);H.save();modalClose();H.render();H.toast('Usulan tersimpan. Saldo Finance tidak berubah.');
  };
})();
