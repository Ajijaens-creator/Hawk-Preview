/* HAWK Mobile · Local R&D preview. No camera, GPS, network or real employee data. */
(() => {
  'use strict';
  const paths = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    work:'<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M9 5V3h6v2M8 10l1 1 2-2M8 16l1 1 2-2M14 10h3M14 16h3"/>',
    scan:'<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"/><circle cx="12" cy="10" r="3"/><path d="M7 18c0-5 10-5 10 0"/>',
    chat:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z"/><path d="M7 10h10M7 14h6"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2"/>',
    leaf:'<path d="M20 3C8 2 2 8 5 16c8 5 16 0 15-13Z"/><path d="M3 21 15 9M9 15v-5M9 15h5"/>',
    help:'<path d="M4 13V9a8 8 0 0 1 16 0v4M20 15v3a3 3 0 0 1-3 3h-4"/><rect x="2" y="11" width="4" height="7" rx="2"/><rect x="18" y="11" width="4" height="7" rx="2"/>',
    arrow:'<path d="m9 5 7 7-7 7"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    shield:'<path d="m12 2 8 3v6c0 5-8 11-8 11S4 16 4 11V5Z"/><path d="m8 11 3 3 5-6"/>',
    book:'<path d="M12 5C9 2 4 3 2 4v15c3-2 7-2 10 0 3-2 7-2 10 0V4c-2-1-7-2-10 1v14"/>',
    refresh:'<path d="M20 7a8 8 0 0 0-14-2L3 8M3 3v5h5M4 17a8 8 0 0 0 14 2l3-3M16 16h5v5"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    coffee:'<path d="M4 8h13v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM17 9h2a3 3 0 0 1 0 6h-2M7 3v2M11 2v3M15 3v2"/>',
    history:'<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6M12 7v5l4 2"/>',
    edit:'<path d="m15 4 5 5M3 21l5-1L21 7a2 2 0 0 0-5-4L3 16v5ZM12 21h9"/>',
    file:'<path d="M14 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9ZM14 2v7h7M8 14h8M8 18h5"/>',
    send:'<path d="m22 2-7 20-4-9-9-4ZM22 2 11 13"/>',
    search:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>',
    people:'<circle cx="9" cy="8" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 4 5v2"/>',
    logout:'<path d="M9 3H4v18h5M9 12h12m-5-5 5 5-5 5"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="3" fill="currentColor" stroke="none"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    room:'<path d="M4 21V4l12-2v19M2 21h20M16 5h4v16M12 12h.01"/>',
    play:'<path d="m8 4 12 8-12 8Z"/>',
    plus:'<path d="M12 4v16M4 12h16"/>',
    checkcircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    wallet:'<path d="M20 8V4H5a3 3 0 0 0 0 6h17v10H5a3 3 0 0 1-3-3V7M22 13h-6v4h6"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/>'
  };
  const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.work}</svg>`;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const roles = {
    therapist:{name:'Ni Kadek Ayu Lestari',short:'Ayu',initials:'AL',role:'Spa Therapist',outlet:'Spa Ubud',id:'DEMO-TH-001',scope:'Layanan yang ditugaskan, checklist, dan perkembangan pribadi.',shift:'08.00 – 17.00',group:'Tim Spa Ubud',jobs:4,workTitle:'Treatment berikutnya'},
    reception:{name:'Putu Sari Pramesti',short:'Sari',initials:'SP',role:'Spa Reception',outlet:'Spa Ubud',id:'DEMO-RC-001',scope:'Reservasi, kedatangan tamu, ketersediaan ruang, dan koordinasi shift.',shift:'08.00 – 17.00',group:'Tim Spa Ubud',jobs:8,workTitle:'Reservasi berikutnya'},
    supervisor:{name:'Made Arya Wicaksana',short:'Arya',initials:'AW',role:'Spa Supervisor',outlet:'Spa Ubud',id:'DEMO-OP-001',scope:'Kesiapan outlet, pekerjaan tim, dan approval dalam cakupan Spa Ubud.',shift:'08.00 – 17.00',group:'Tim Spa Ubud',jobs:3,workTitle:'Prioritas shift'},
    office:{name:'Raka Adi Pradana',short:'Raka',initials:'RP',role:'Staf Marketing',outlet:'Office · Marketing',id:'DEMO-MK-001',scope:'My Tasks, agenda, review ringan, dan chat. Pekerjaan kompleks di desktop.',shift:'09.00 – 18.00',group:'Tim Marketing',jobs:3,workTitle:'Prioritas hari ini'}
  };
  const pages = [
    ['home','Beranda','Hari kerja dalam satu pandangan','home'],
    ['work','Pekerjaan','Yang perlu dikerjakan hari ini','work'],
    ['attendance','Presensi','Hadir dengan mudah dan jelas','scan'],
    ['inbox','Inbox','Chat, kabar, dan persetujuan','chat'],
    ['profile','Saya','Layanan dan perkembangan diri','user']
  ];
  const stages=['Ide','Issue','Workplan','Priority','Dikerjakan','Review','Selesai'];
  const taskSeeds = {
    therapist:[['t1','Persiapan treatment pertama','Operasional','08.45','Periksa kebutuhan layanan sebelum menerima tamu pertama.',['Baca brief layanan Tamu Demo 01','Cek kebersihan dan kelengkapan alat','Konfirmasi Ruang Cendana siap']],['t2','Lengkapi catatan layanan','Administrasi','16.30','Catat hasil layanan yang telah diselesaikan hari ini.',['Cek daftar layanan selesai','Lengkapi catatan yang diperlukan']],['t3','Pelajari SOP sambutan tamu','Human Growth','15.00','Materi singkat untuk pengalaman tamu yang lebih hangat.',['Baca materi sambutan tamu','Tulis satu hal yang ingin dipraktikkan']]],
    reception:[['r1','Persiapan front desk','Operasional','08.30','Pastikan reservasi dan informasi shift siap digunakan.',['Cek reservasi hari ini','Cocokkan therapist dan ruangan','Konfirmasi catatan handover']],['r2','Konfirmasi reservasi sore','Reservasi','11.00','Tinjau tiga reservasi yang masih menunggu konfirmasi.',['Periksa daftar tamu demo','Perbarui status konfirmasi']],['r3','Serah terima shift','Administrasi','16.30','Siapkan ringkasan untuk shift berikutnya.',['Periksa transaksi POS demo','Catat reservasi dan tindak lanjut']]],
    supervisor:[['s1','Review kesiapan outlet','Operasional','08.30','Periksa kesiapan tim, ruangan dan perlengkapan sebelum outlet melayani tamu.',['Tinjau roster shift','Verifikasi ruangan siap','Sampaikan briefing pagi']],['s2','Coaching pelayanan tim','Human Growth','14.00','Sesi coaching singkat berdasarkan catatan layanan demo.',['Tinjau catatan layanan','Catat tindak lanjut coaching']],['s3','Review handover shift','Administrasi','16.30','Pastikan tindak lanjut tercatat dan memiliki PIC.',['Baca ringkasan handover','Tentukan PIC tindak lanjut']]],
    office:[['m1','Review brief kampanye spa','Marketing','10.00','Berikan masukan pada brief kampanye Spa Ubud. Pengerjaan detail dilanjutkan di desktop.',['Baca tujuan dan audiens','Catat masukan utama','Kirim catatan untuk reviewer']],['m2','Lengkapi update pekerjaan','Administrasi','16.00','Perbarui hasil kerja untuk daily reflection.',['Catat hasil kerja hari ini','Tautkan bukti demo']],['m3','Pelajari brand guideline','Human Growth','15.00','Pelajari materi komunikasi HAWK.',['Baca panduan nada komunikasi','Selesaikan checklist pembelajaran']]]
  };
  const STORAGE='hawk-mobile-rnd-v1';
  function fresh(){
    const data={version:1,role:'therapist',people:{},messages:{},requests:[],approvals:[{id:'ap1',name:'Komang Dita · Therapist',type:'Koreksi presensi',detail:'13 November · GPS kurang akurat saat check-out. Waktu yang diajukan 17.02 WITA.',status:'Menunggu'},{id:'ap2',name:'Putu Sari · Reception',type:'Izin pribadi',detail:'18 November · Satu hari. Pengajuan demo menunggu persetujuan supervisor.',status:'Menunggu'}]};
    for(const key of Object.keys(roles)) data.people[key]={attendance:'not-in',inTime:null,outTime:null,breaks:[],tasks:taskSeeds[key].map((t,i)=>({id:t[0],title:t[1],category:t[2],due:t[3],description:t[4],checks:t[5].map(text=>({text,done:false})),stage:i===2?'Workplan':'Priority',asset:false,comments:[{name:'Made Arya',time:'07.40',text:'Silakan mulai sesuai prioritas. Kabari di sini jika ada kendala.'}],history:[{text:'Tugas dibuat dan ditugaskan.',actor:'Sistem demo',time:'07.30'}]}))};
    return data;
  }
  let data=fresh();
  try{const saved=JSON.parse(localStorage.getItem(STORAGE));if(saved?.version===1&&roles[saved.role]&&Object.keys(roles).every(k=>Array.isArray(saved.people?.[k]?.tasks))&&Array.isArray(saved.requests)&&Array.isArray(saved.approvals))data=saved;}catch{}
  try{const q=new URLSearchParams(location.search).get('role');if(q&&roles[q]&&data.role!==q){data.role=q;try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch{}}}catch{}
  let page=pages.some(p=>p[0]===location.hash.slice(1))?location.hash.slice(1):'home';
  let workTab='tasks',inboxTab='chat',taskTab='detail',activeTask=null,activeChat=null,flowAction='in',sheetKind='',toastTimer;
  const $=s=>document.querySelector(s);
  const person=()=>roles[data.role], state=()=>data.people[data.role];
  const save=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch{}};
  const learningTitle=()=>data.role==='office'?'Panduan komunikasi brand':'SOP sambutan tamu';
  const displayDate=value=>new Date(value+'T12:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  const stageColor=s=>s==='Selesai'?'green':s==='Review'?'violet':s==='Dikerjakan'?'blue':s==='Issue'?'orange':'gold';
  const pill=(s,color='gold')=>`<span class="pill ${color}">${esc(s)}</span>`;
  const avatar=(text,cls='')=>`<span class="avatar ${cls}">${esc(text)}</span>`;
  const row=(ic,title,sub,attrs='',tint='gold',extra='')=>`<button class="list-row" ${attrs}><span class="row-icon tint-${tint}">${icon(ic)}</span><span class="row-content"><b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span>${extra||icon('arrow')}</button>`;
  function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200);}
  function setPage(next){if(!pages.some(p=>p[0]===next))return;closeSheet();page=next;try{history.replaceState(null,'','#'+page);}catch{}render();$('#app-scroll').scrollTop=0;}
  function render(){
    $('#screen-index').innerHTML=pages.map((p,i)=>`<button class="screen-link" data-page="${p[0]}" ${page===p[0]?'aria-current="page"':''}><span>0${i+1}</span><span><b>${p[1]}</b><small>${p[2]}</small></span><span class="screen-arrow">↗</span></button>`).join('');
    $('#bottom-nav').innerHTML=pages.map(p=>`<button class="nav-item" data-page="${p[0]}" ${page===p[0]?'aria-current="page"':''}><span class="nav-icon">${icon(p[3])}</span><span>${p[1]}</span></button>`).join('');
    $('#view').innerHTML=({home:homeView,work:workView,attendance:attendanceView,inbox:inboxView,profile:profileView}[page])();
    $('#role-select').value=data.role;$('#role-description').textContent=person().scope;
    document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});
  }
  function heading(title,subtitle,extra=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${extra}</div>`;}
  function hero(){
    const s=state(),active=s.attendance==='working'||s.attendance==='break',done=s.attendance==='out';
    const label=done?'Shift selesai':s.attendance==='break'?'Sedang istirahat':active?'Sudah check-in':'Belum check-in';
    return `<section class="attendance-hero"><div class="hero-top"><span class="inline-icon">${icon('sun')} SHIFT HARI INI</span><span class="hero-badge ${active||done?'verified':''}"><i></i>${label}</span></div><div class="shift-clock">${person().shift}<em>WITA</em></div><p class="hero-caption">${active?`Masuk ${s.inTime} · ${person().outlet}`:done?`Masuk ${s.inTime} · Keluar ${s.outTime}`:`Sabtu, 14 November · ${person().outlet}`}</p><button class="primary-button" data-action="${done?'receipt':s.attendance==='break'?'break-end':'attendance'}">${icon(done?'checkcircle':s.attendance==='break'?'play':active?'logout':'scan')}${done?'Lihat bukti presensi':s.attendance==='break'?'Selesai istirahat':active?'Check-out kerja':'Check-in kerja'}</button><div class="hero-bottom">${icon('shield')} ${done?'Tersimpan sebagai presensi demo':active?'Selamat bekerja. Semoga harimu menyenangkan.':'Verifikasi wajah & lokasi · Simulasi'}</div></section>`;
  }
  function homeView(){
    const p=person(),task=state().tasks.find(t=>t.stage!=='Selesai')||state().tasks[0];
    const spa=data.role==='therapist'||data.role==='reception';
    return `<div class="date-label">Sabtu, 14 November 2026</div><div class="greeting"><div><h1>Selamat pagi, ${p.short}<span style="color:var(--gold)">.</span></h1><p>${icon('pin')}${p.outlet}<span>·</span>${p.role}</p></div><button class="avatar" data-page="profile" aria-label="Profil ${esc(p.short)}">${p.initials}</button></div>${hero()}<div class="quick-grid"><button class="quick-item" data-action="schedule"><span class="tint-blue">${icon('calendar')}</span>Jadwal saya</button><button class="quick-item" data-action="leave"><span class="tint-violet">${icon('leaf')}</span>Izin & cuti</button><button class="quick-item" data-action="help"><span class="tint-green">${icon('help')}</span>Bantuan HRD</button></div><div class="section-heading"><h2>${p.workTitle}</h2><button data-page="work">Lihat semua →</button></div><button class="m-card next-card" ${spa?'data-action="service"':`data-task="${task.id}"`}><div class="time-block"><b>${spa?'09.00':task.due}</b><small>${spa?'60 MENIT':'WITA'}</small></div><div class="next-main"><p class="overline">${spa?'RESERVASI · DEMO-014':'PRIORITAS HARI INI'}</p><h3>${spa?'Balinese Massage':task.title}</h3><p>${spa?'Tamu Demo 01 · Ruang Cendana':task.category+' · '+p.outlet}</p>${pill(spa?'Terjadwal':task.stage,spa?'green':stageColor(task.stage))}</div>${icon('arrow')}</button><button class="learning-card" data-action="learning">${icon('book')}<div><b>${state().learningRead?'Materi sudah dibaca':'Sedikit belajar, setiap hari'}</b><p>${learningTitle()} · ${state().learningRead?'Buka kembali':'5 menit'}</p></div><span>→</span></button>`;
  }
  function workView(){
    const ts=state().tasks,done=ts.filter(t=>t.stage==='Selesai').length;
    let html=heading('Pekerjaan',data.role==='office'?'Yang penting, selangkah demi selangkah.':'Siap memberikan pelayanan terbaik.');
    html+=`<div class="m-tabs" role="tablist" aria-label="Tampilan pekerjaan"><button role="tab" data-work-tab="tasks" aria-selected="${workTab==='tasks'}">Tugas saya · ${ts.length}</button><button role="tab" data-work-tab="schedule" aria-selected="${workTab==='schedule'}">${data.role==='office'?'Agenda':'Jadwal layanan'}</button></div>`;
    if(workTab==='schedule')return html+scheduleContent();
    html+=`<div class="m-card" style="margin-bottom:18px;padding:13px 15px"><div class="section-heading no-bottom-margin"><span style="font-size:11px;font-weight:650">Langkah kecil hari ini</span><span style="font-size:10px;color:#86906f">${done} dari ${ts.length} selesai</span></div><div class="progress-line"><span style="width:${done/ts.length*100}%"></span></div></div>`;
    return html+ts.map(t=>`<button class="task-card" data-task="${t.id}"><div class="task-topline">${pill(t.category,t.category==='Human Growth'?'green':'gray')}${pill(t.stage,stageColor(t.stage))}</div><h3>${esc(t.title)}</h3><div class="task-bottom"><span class="inline-icon">${icon('clock')}${t.due} WITA</span><span class="inline-icon">${icon('checkcircle')}${t.checks.filter(c=>c.done).length}/${t.checks.length}</span><span class="tiny-avatar">${person().initials}</span></div></button>`).join('')+`<div class="info-banner">${icon('info')}Tugas dan diskusi terhubung dengan workplace tim.</div>`;
  }
  function scheduleContent(){
    const office=data.role==='office';
    const rows=office?[['09.00','Daily briefing','Tim Marketing · 15 menit'],['10.00','Review brief kampanye','My Tasks · 30 menit'],['14.00','Diskusi konsep visual','Tim kreatif · 45 menit']]:[['09.00','Balinese Massage','Tamu Demo 01 · Cendana · 60 menit'],['10.30','Aromatherapy Massage','Tamu Demo 02 · Melati · 90 menit'],['13.00','Foot Reflexology','Tamu Demo 03 · Kenanga · 60 menit'],['15.00','Balinese Massage','Tamu Demo 04 · Cendana · 60 menit']];
    return `<div class="section-heading"><h2>Sabtu, 14 November</h2>${pill(person().outlet,'gray')}</div><div class="m-card"><div class="timeline">${rows.map((r,i)=>`<div class="timeline-item"><span class="timeline-dot">${icon(office?'calendar':'leaf')}</span><div class="timeline-copy"><b>${r[1]}</b><small>${r[2]}</small><button class="text-button" ${office?`data-task="${state().tasks[Math.min(i,2)].id}"`:`data-service="${i}"`}>Lihat detail →</button></div><span class="timeline-time">${r[0]}</span></div>`).join('')}</div></div>`;
  }
  function attendanceView(){
    const s=state();
    return heading('Presensi','Hadir tepat waktu. Mulai dengan tenang.')+hero()+`<div class="stats-row"><div class="stat"><b>${11+(s.inTime?1:0)}</b><span>Hari hadir · Nov</span></div><div class="stat"><b>0</b><span>Terlambat</span></div><div class="stat"><b>8</b><span>Sisa cuti · hari</span></div></div><div class="section-heading"><h2>Aktivitas hari ini</h2><button data-action="history">Riwayat →</button></div><div class="m-card"><div class="timeline"><div class="timeline-item"><span class="timeline-dot ${s.inTime?'done':''}">${icon(s.inTime?'check':'scan')}</span><div class="timeline-copy"><b>Check-in kerja</b><small>${s.inTime?'Wajah & lokasi terverifikasi · Demo':'Belum ada presensi masuk'}</small></div><span class="timeline-time">${s.inTime||'—'}</span></div>${s.breaks.map(b=>`<div class="timeline-item"><span class="timeline-dot done">${icon('coffee')}</span><div class="timeline-copy"><b>${b.action}</b><small>Istirahat shift</small></div><span class="timeline-time">${b.time}</span></div>`).join('')}<div class="timeline-item"><span class="timeline-dot ${s.outTime?'done':''}">${icon(s.outTime?'check':'logout')}</span><div class="timeline-copy"><b>Check-out kerja</b><small>${s.outTime?'Shift selesai · Demo':'Setelah pekerjaan dan handover selesai'}</small></div><span class="timeline-time">${s.outTime||'—'}</span></div></div></div><div class="row-list gap-top">${row('coffee',s.attendance==='break'?'Selesai istirahat':'Mulai istirahat','Catat jeda selama shift',`data-action="${s.attendance==='break'?'break-end':'break-start'}"`,'blue')}${row('edit','Koreksi presensi','Ajukan untuk pemeriksaan HRD','data-action="correction"','violet')}${row('calendar','Jadwal kerja saya',person().shift+' WITA','data-action="schedule"','green')}</div>`;
  }
  function chatInfo(key){return key==='team'?{title:person().group,initials:data.role==='office'?'MK':'UB',sub:'Grup kerja · data demo',color:'gold'}:key==='hrd'?{title:'HRD Care',initials:'HR',sub:'Layanan untuk seluruh tim',color:'violet'}:{title:'Made Arya',initials:'MA',sub:'Spa Supervisor · Ubud',color:'blue'};}
  function chatKey(key){return key==='team'?(data.role==='office'?'marketing-team':'ubud-team'):key==='hrd'?`${data.role}-hrd`:`${data.role}-supervisor`;}
  function messages(key){const k=chatKey(key);if(!data.messages[k])data.messages[k]=key==='team'?[{name:data.role==='office'?'Dina · Koordinator':'Made Arya · Supervisor',text:data.role==='office'?'Pagi, tim. Brief hari ini sudah ada di My Tasks. Kita bahas masukan di thread tugas, ya.':'Selamat pagi, tim Ubud. Mari cek kesiapan ruangan dan jadwal layanan hari ini.',time:'07.30',mine:false},{name:data.role==='office'?'Raka · Marketing':'Sari · Reception',text:data.role==='office'?'Siap, briefnya sudah saya terima.':'Reservasi pertama pukul 09.00. Ruang Cendana sudah dikonfirmasi.',time:'07.42',mine:false}]:key==='hrd'?[{name:'Dina · HRD Care',text:'Halo! Ada yang bisa kami bantu? Pengajuan izin dan koreksi presensi bisa dibuat dari menu Saya atau Presensi.',time:'07.25',mine:false}]:[{name:'Made Arya',text:'Pagi. Silakan cek pekerjaan hari ini. Kalau ada kendala, kabari saya di sini.',time:'07.35',mine:false}];return data.messages[k];}
  function inboxView(){
    let html=heading('Inbox','Tetap terhubung dengan tim.');
    html+=`<div class="m-tabs" role="tablist" aria-label="Jenis inbox">${[['chat','Chat'],['notifications','Notifikasi'],['approval',data.role==='supervisor'?'Approval':'Pengajuan']].map(([id,l])=>`<button role="tab" data-inbox-tab="${id}" aria-selected="${inboxTab===id}">${l}</button>`).join('')}</div>`;
    if(inboxTab==='notifications')return html+`<div class="row-list">${row('calendar','Jadwal minggu depan tersedia','HRD · 07.30','data-action="schedule"','blue')}${row('book','Materi pembelajaran baru','SOP sambutan tamu · 5 menit','data-action="learning"','green')}${row('work','Tugas hari ini sudah dibagikan',person().jobs+' agenda sesuai peran Anda','data-page="work"')}</div>`;
    if(inboxTab==='approval')return html+requestsContent();
    return html+`<label class="search-box">${icon('search')}<input id="chat-search" type="search" placeholder="Cari percakapan" aria-label="Cari percakapan"></label><div id="chat-list">${['team','supervisor','hrd'].map(key=>{const c=chatInfo(key),last=messages(key).at(-1);return `<button class="chat-row" data-chat="${key}" data-search="${esc(c.title.toLowerCase())}">${avatar(c.initials,c.color)}<span class="chat-main"><b>${c.title}</b><p>${esc(last.mine?'Anda: '+last.text:last.text)}</p></span><span class="chat-side"><span>${last.time}</span>${key==='team'?'<span class="unread">2</span>':''}</span></button>`;}).join('')}</div><div class="info-banner">${icon('shield')}Chat demo hanya tersimpan di browser ini.</div>`;
  }
  function requestsContent(){
    if(data.role==='supervisor')return `<p class="small-copy" style="margin-bottom:12px">Persetujuan untuk tim Spa Ubud.</p><div class="row-list">${data.approvals.map(a=>row('file',a.type,a.name,`data-approval="${a.id}"`,'gold',pill(a.status,a.status==='Disetujui'?'green':a.status==='Ditolak'?'orange':'gold'))).join('')}</div>`;
    const reqs=data.requests.filter(r=>r.role===data.role);
    return reqs.length?`<div class="row-list">${reqs.map(r=>row('file',r.type,displayDate(r.date),`data-request="${r.id}"`,'blue',pill('Menunggu','gold'))).join('')}</div>`:`<div class="m-card empty-state">${icon('checkcircle')}<b>Belum ada pengajuan</b><p>Pengajuan izin dan koreksi presensi Anda akan terlihat di sini.</p><button class="text-button" data-action="leave">Ajukan izin atau cuti →</button></div>`;
  }
  function profileView(){
    const p=person();return heading('Saya','Ruang pribadi untuk kebutuhan kerja.')+`<div class="m-card profile-card">${avatar(p.initials)}<h2>${p.name}</h2><p>${p.role} · ${p.id}</p><div class="profile-meta">${pill(p.outlet,'gold')}${pill('Profil dummy','green')}</div><div class="profile-stats"><div><b>8 hari</b><small>SISA CUTI</small></div><div><b>${11+(state().inTime?1:0)} hari</b><small>HADIR BULAN INI</small></div><div><b>2 modul</b><small>PEMBELAJARAN</small></div></div></div><h2 class="subheading">Layanan untuk Anda</h2><div class="row-list">${row('leaf','Izin & cuti','Saldo dan pengajuan','data-action="leave"','violet')}${row('file','Pengajuan saya','Lihat status dan tindak lanjut','data-action="requests"','blue')}${row('book','Belajar & berkembang','SOP, coaching, dan pelatihan','data-action="learning"','green')}${row('file','Dokumen saya','Dokumen dan penempatan demo','data-action="documents"')}${row('help','Bantuan HRD','Hubungi HRD Care','data-action="help"','green')}</div><h2 class="subheading">Pengaturan preview</h2><div class="row-list">${row('people','Ganti peran demo',p.role,'data-action="roles"')}${row('refresh','Ulangi demo','Kembalikan seluruh data contoh','data-action="reset"','blue')}</div>`;
  }
  function placeSheet(){
    const r=$('#device').getBoundingClientRect(),b=innerWidth>740?7:0;
    Object.assign($('#sheet').style,{position:'fixed',left:`${r.left+b}px`,bottom:`${Math.max(0,innerHeight-r.bottom+b)}px`,width:`${r.width-b*2}px`,maxHeight:`${Math.min(r.height-46,innerHeight-20)}px`,borderRadius:innerWidth>740?'26px 26px 40px 40px':'26px 26px 0 0'});
  }
  function showSheet(title,content,kind='',extraClass=''){
    sheetKind=kind;const d=$('#sheet');d.className=extraClass;
    d.innerHTML=`<div class="sheet-handle" aria-hidden="true"></div><div class="sheet-header"><h2 id="sheet-title">${title}</h2><button class="icon-button" data-action="close" aria-label="Tutup">${icon('close')}</button></div><div class="sheet-content">${content}</div>`;
    placeSheet();if(!d.open)d.showModal();d.scrollTop=0;
  }
  function closeSheet(){if($('#sheet').open)$('#sheet').close();sheetKind='';}
  function flowSteps(step){return `<div class="steps">${['Lokasi','Wajah','Selesai'].map((name,i)=>`${i?'<i></i>':''}<span class="${i<=step?'active':''}"><b>${i<step?'✓':i+1}</b>${name}</span>`).join('')}</div>`;}
  function startAttendance(){
    const s=state();
    if(s.attendance==='out'){receipt();return;}
    if(s.attendance==='break'){showSheet('Selesaikan istirahat','<p class="sheet-subtitle">Catat selesai istirahat sebelum melanjutkan check-out.</p><button class="primary-button" data-action="break-end">Selesai istirahat</button>');return;}
    flowAction=s.attendance==='working'?'out':'in';attendanceLocation();
  }
  function attendanceLocation(){
    showSheet(flowAction==='in'?'Check-in kerja':'Check-out kerja',flowSteps(0)+`<p class="sheet-subtitle">Pastikan Anda berada di lokasi kerja yang ditugaskan.</p><div class="map-illustration" aria-label="Ilustrasi lokasi demo, bukan peta GPS nyata"><svg viewBox="0 0 350 165" aria-hidden="true"><rect width="350" height="165" fill="#e7e8dc"/><path d="M-10 34 360 118M85-20 155 190M275-15 215 180" stroke="#f9f8f0" stroke-width="18"/><path d="M-10 34 360 118M85-20 155 190" stroke="#d8d5c4" stroke-width="1"/><rect x="20" y="88" width="65" height="43" rx="8" fill="#cbd6bd" transform="rotate(13 20 88)"/><rect x="263" y="18" width="70" height="42" rx="8" fill="#d5dcc8"/><circle cx="175" cy="76" r="48" fill="#779a6820" stroke="#79916a" stroke-width="1" stroke-dasharray="4 4"/><circle cx="175" cy="76" r="30" fill="#779a6810"/></svg><span class="map-pin">${icon('pin')}</span><span class="location-label">${person().outlet} · lokasi demo</span></div><div class="validation-row"><span>${icon('check')}</span><div><b>Dalam area kerja</b><p>Jarak 12 m · akurasi ±5 m · simulasi</p></div></div><div class="receipt"><div class="receipt-row"><span>Jadwal hari ini</span><b>${person().shift} WITA</b></div><div class="receipt-row"><span>Lokasi penugasan</span><b>${person().outlet}</b></div></div><div class="sheet-actions"><button class="primary-button" data-action="face">Lanjut ke verifikasi wajah ${icon('arrow')}</button><button class="text-button" data-action="exception">Lokasi atau perangkat bermasalah?</button></div>`, 'attendance-location');
  }
  function faceView(){
    showSheet('Verifikasi wajah',flowSteps(1)+`<div class="face-frame" aria-hidden="true"><svg viewBox="0 0 150 180"><path d="M20 180v-26c0-34 110-34 110 0v26" fill="#87977d"/><path d="M58 118v17c9 11 25 11 34 0v-17" fill="#c9b390"/><ellipse cx="75" cy="80" rx="39" ry="49" fill="#d6c1a2"/><path d="M35 74c-9-53 71-70 79-9-20-1-34-9-43-23-3 15-17 27-36 32Z" fill="#4e5549"/><path d="M48 77h10M89 77h10" stroke="#626154" stroke-width="2" stroke-linecap="round"/><path d="M74 83v16h5M64 110q11 7 22-1" stroke="#ae9475" stroke-width="2" fill="none" stroke-linecap="round"/></svg><span class="scan-line"></span></div><p class="face-caption">Posisikan wajah di dalam bingkai</p><p class="face-helper">Pastikan wajah terlihat jelas dan pencahayaan cukup.</p><div class="demo-info">Ini ilustrasi demo. Kamera tidak diaktifkan<br>dan tidak ada data wajah yang direkam.</div><div class="sheet-actions"><button class="primary-button" data-action="verify">${icon('scan')}Simulasikan & ${flowAction==='in'?'check-in':'check-out'}</button><button class="text-button" data-action="exception">Saya membutuhkan bantuan</button></div>`,'attendance-face');
  }
  function verify(){
    const s=state();if((flowAction==='in'&&s.attendance!=='not-in')||(flowAction==='out'&&s.attendance!=='working')){receipt();return;}
    if(flowAction==='in'){s.attendance='working';s.inTime=data.role==='office'?'08.55':'07.55';}else{s.attendance='out';s.outTime=data.role==='office'?'18.03':'17.03';}
    save();render();receipt(true);
  }
  function receipt(justCompleted=false){
    const s=state(),out=s.attendance==='out';
    showSheet('Bukti presensi',`${justCompleted?flowSteps(2):''}<div class="success-seal">${icon('check')}</div><h3 class="success-title">${out?'Terima kasih untuk hari ini.':'Selamat bekerja, '+person().short+'.'}</h3><p class="face-helper">${out?'Check-out':'Check-in'} berhasil dicatat dalam demo.</p><div class="receipt"><div class="receipt-row"><span>${out?'Waktu keluar':'Waktu masuk'}</span><b>${out?s.outTime:s.inTime} WITA</b></div><div class="receipt-row"><span>Tanggal kerja</span><b>14 November 2026</b></div><div class="receipt-row"><span>Lokasi</span><b>${person().outlet}</b></div><div class="receipt-row"><span>Verifikasi</span><b style="color:var(--green)">Wajah & lokasi · Demo</b></div><div class="receipt-id">ATT-DEMO-${data.role.toUpperCase()}-1411-${out?'OUT':'IN'}</div></div><div class="sheet-actions"><button class="primary-button" data-action="close">${out?'Selesai':'Lanjutkan hari saya'} ${icon('arrow')}</button></div><p class="modal-note">Bukti simulasi, bukan catatan kehadiran resmi.</p>`,'receipt');
  }
  function takeBreak(end=false){
    const s=state();
    if(end&&s.attendance==='break'){s.attendance='working';s.breaks.push({action:'Selesai istirahat',time:'13.00'});}
    else if(!end&&s.attendance==='working'){s.attendance='break';s.breaks.push({action:'Mulai istirahat',time:'12.00'});}
    else{showSheet('Check-in terlebih dahulu','<p class="sheet-subtitle">Istirahat dicatat selama shift aktif. Mulai dengan check-in kerja.</p><button class="primary-button" data-action="attendance">Buka presensi</button>');return;}
    save();closeSheet();render();toast(end?'Selesai istirahat dicatat · 13.00 WITA, demo.':'Mulai istirahat dicatat · 12.00 WITA, demo.');
  }
  function requestForm(type){
    const leave=type==='leave',exception=type==='exception';
    showSheet(leave?'Izin & cuti':exception?'Bantuan presensi':'Koreksi presensi',`<p class="sheet-subtitle">${leave?'Ajukan kebutuhan Anda. Status persetujuan dapat dipantau di Inbox.':'Sampaikan kendala. Supervisor/HRD akan memeriksa pengajuan sebelum catatan diperbarui.'}</p>${leave?'<div class="info-banner green">'+icon('leaf')+'Sisa cuti tahunan: <b>8 hari</b></div>':''}<form id="request-form" data-type="${type}"><label class="form-field">${leave?'Jenis pengajuan':'Kendala'}<select name="kind">${(leave?['Cuti tahunan','Izin pribadi','Sakit']:exception?['GPS kurang akurat','Kamera tidak tersedia','Verifikasi wajah belum berhasil','Koneksi internet bermasalah']:['Lupa check-in','Lupa check-out','Waktu presensi perlu koreksi']).map(o=>`<option>${o}</option>`).join('')}</select></label><div class="form-grid"><label class="form-field">Tanggal<input name="date" type="date" value="2026-11-${leave?'18':'14'}" required></label><label class="form-field">${leave?'Durasi (hari)':'Waktu kejadian'}<input name="value" ${leave?'type="number" min="1" max="8" value="1"':'type="time" value="08:00"'} required></label></div><label class="form-field">Alasan singkat<textarea name="reason" maxlength="500" placeholder="Gunakan contoh alasan untuk demo ini…" required></textarea></label><button class="primary-button" type="submit">${icon('send')}Kirim pengajuan demo</button><p class="modal-note">Pengajuan tersimpan lokal dan belum menjadi persetujuan.</p></form>`,'request');
  }
  function showTask(id,tab='detail'){
    const t=state().tasks.find(t=>t.id===id);if(!t)return;activeTask=id;taskTab=tab;
    const complete=t.checks.every(c=>c.done);
    let body=pill(t.category,'gray')+`<h3 class="task-detail-title">${esc(t.title)}</h3><div class="detail-meta"><span>${icon('user')}${person().short} · PIC</span><span>${icon('clock')}Hari ini, ${t.due}</span></div><div class="m-tabs" role="tablist" aria-label="Detail tugas">${[['detail','Rincian'],['discussion','Diskusi'],['history','Riwayat']].map(([key,l])=>`<button role="tab" data-task-tab="${key}" aria-selected="${tab===key}">${l}</button>`).join('')}</div>`;
    if(tab==='detail')body+=`<p class="small-copy">${esc(t.description)}</p><h4 class="subheading">Checklist <span style="font-size:10px;font-weight:400;color:var(--muted)">${t.checks.filter(c=>c.done).length}/${t.checks.length}</span></h4><div class="checklist">${t.checks.map((c,i)=>`<label class="check-item"><input type="checkbox" data-check="${i}" ${c.done?'checked':''} ${t.stage==='Selesai'||t.stage==='Review'?'disabled':''}><span>${esc(c.text)}</span></label>`).join('')}</div><label class="form-field gap-top">Status tugas<select id="task-stage" aria-label="Status tugas">${stages.map(s=>`<option ${t.stage===s?'selected':''}>${s}</option>`).join('')}</select></label><button class="attachment" data-action="asset">${icon(t.asset?'file':'plus')}${t.asset?'Bukti-checklist-demo.pdf · lihat':'Tambahkan bukti demo'}</button><div class="sheet-actions">${t.stage==='Review'?`<div class="info-banner violet">${icon('clock')}Menunggu pemeriksaan reviewer.</div>${data.role==='supervisor'?'<button class="primary-button" data-action="task-finish">Setujui penyelesaian</button>':''}`:t.stage==='Selesai'?'<div class="info-banner green">'+icon('checkcircle')+'Tugas selesai dan tersimpan dalam demo.</div>':`<button class="primary-button" data-action="task-primary">${icon(t.stage==='Dikerjakan'?'checkcircle':'play')}${t.stage==='Dikerjakan'?'Kirim untuk review':'Mulai tugas'}</button>${t.stage==='Dikerjakan'&&!complete?'<p class="modal-note">Lengkapi checklist sebelum mengirim review.</p>':''}`}</div>`;
    else if(tab==='discussion')body+=t.comments.map(c=>`<div class="comment">${avatar(c.name.split(' ').map(v=>v[0]).slice(0,2).join(''),'gold')}<div><b>${esc(c.name)}</b><small>${c.time}</small><p>${esc(c.text)}</p></div></div>`).join('')+`<form id="comment-form" class="comment-form"><input name="message" required maxlength="500" placeholder="Tulis diskusi tugas…" aria-label="Pesan diskusi tugas"><button class="send-button" type="submit" aria-label="Kirim diskusi">${icon('send')}</button></form>`;
    else body+=t.history.slice().reverse().map(h=>`<div class="history-line">${esc(h.text)}<small>${esc(h.actor)} · ${h.time} WITA · Demo</small></div>`).join('');
    showSheet('Detail pekerjaan',body,'task');
  }
  function taskChange(next){
    const t=state().tasks.find(t=>t.id===activeTask);if(!t||!stages.includes(next)||t.stage===next)return;
    if(['Review','Selesai'].includes(next)&&!t.checks.every(c=>c.done)){showTask(t.id);taskInlineNotice('Lengkapi seluruh checklist sebelum review.');return;}
    if(next==='Selesai'&&(data.role!=='supervisor'||t.stage!=='Review')){showTask(t.id);taskInlineNotice('Penyelesaian perlu disetujui reviewer. Pilih Review terlebih dahulu.');return;}
    const old=t.stage;t.stage=next;t.history.push({text:`Status ${old} → ${next}. PIC tetap ${person().short}.`,actor:person().name,time:'08.05'});save();render();showTask(t.id);
  }
  function taskInlineNotice(text){const p=document.createElement('p');p.className='info-banner';p.setAttribute('role','status');p.textContent=text;$('#sheet .sheet-content').prepend(p);$('#sheet').scrollTop=0;}
  function openChat(key){
    activeChat=key;const c=chatInfo(key);
    showSheet(c.title,`<p class="small-copy">${c.sub}</p><div class="chat-messages" id="chat-messages"><div class="chat-day">HARI INI · 14 NOVEMBER · DEMO</div>${messages(key).map(m=>`<div class="bubble ${m.mine?'mine':''}">${!m.mine?`<b>${esc(m.name)}</b>`:''}${esc(m.text)}<small>${m.time}${m.mine?' · Terkirim':''}</small></div>`).join('')}</div><form id="chat-form" class="composer"><input name="message" autocomplete="off" maxlength="1000" placeholder="Tulis pesan demo…" aria-label="Tulis pesan demo" required><button class="send-button" type="submit" aria-label="Kirim pesan">${icon('send')}</button></form>`,'chat','chat-sheet');
    $('#chat-messages').scrollTop=$('#chat-messages').scrollHeight;
  }
  function serviceDetail(index=0){
    const services=['Balinese Massage','Aromatherapy Massage','Foot Reflexology','Balinese Massage'],times=['09.00 – 10.00','10.30 – 12.00','13.00 – 14.00','15.00 – 16.00'];
    showSheet(data.role==='reception'?'Detail reservasi':'Detail layanan',pill('Terjadwal','green')+`<h3 class="task-detail-title">${services[index]}</h3><p class="sheet-subtitle">Tamu Demo 0${index+1} · DEMO-01${index+4}</p><div class="receipt"><div class="receipt-row"><span>Jadwal</span><b>${times[index]} WITA</b></div><div class="receipt-row"><span>Ruangan</span><b>${['Cendana','Melati','Kenanga','Cendana'][index]}</b></div><div class="receipt-row"><span>Therapist</span><b>Ayu · profil dummy</b></div><div class="receipt-row"><span>Outlet</span><b>Spa Ubud</b></div></div><div class="info-banner">${icon('info')}Konfirmasikan kebutuhan layanan sesuai SOP sebelum memulai.</div><div class="sheet-actions"><button class="primary-button" data-task="${state().tasks[0].id}">${icon('work')}Buka checklist persiapan</button><button class="secondary-button" data-chat="team">${icon('chat')}Koordinasi dengan tim</button></div><p class="modal-note">Alur pembayaran POS tidak diaktifkan pada NV dasar ini.</p>`,'service');
  }
  function showApproval(id){const a=data.approvals.find(a=>a.id===id);if(!a||data.role!=='supervisor')return;showSheet(a.type,pill(a.status,a.status==='Disetujui'?'green':'gold')+`<h3 class="task-detail-title">${a.name}</h3><p class="sheet-subtitle">${a.detail}</p><div class="info-banner">${icon('shield')}Cakupan reviewer: Spa Ubud. Semua bukti adalah contoh.</div>${a.status==='Menunggu'?`<label class="form-field">Catatan keputusan<textarea id="approval-note" maxlength="300" placeholder="Tuliskan alasan pemeriksaan…"></textarea></label><div class="decision-grid"><button class="secondary-button" data-decision="Ditolak" data-id="${a.id}">Tolak</button><button class="primary-button" data-decision="Disetujui" data-id="${a.id}">Setujui</button></div>`:`<p class="small-copy">${esc(a.note||'Diperiksa dalam simulasi oleh Made Arya.')}<br>Keputusan demo tersimpan.</p>`}`,'approval');}
  function switchRole(key){if(!roles[key])return;data.role=key;save();workTab='tasks';inboxTab='chat';setPage('home');toast(`Tampilan ${person().role} · ${person().outlet}`);}
  const actions={
    close:closeSheet,attendance:startAttendance,face:faceView,verify,receipt:()=>receipt(),
    'break-start':()=>takeBreak(false),'break-end':()=>takeBreak(true),
    leave:()=>requestForm('leave'),correction:()=>requestForm('correction'),exception:()=>requestForm('exception'),
    service:()=>serviceDetail(),
    schedule:()=>showSheet('Jadwal saya',`<p class="sheet-subtitle">${person().outlet} · ${person().shift} WITA</p>${scheduleContent()}`,'schedule'),
    history:()=>showSheet('Riwayat presensi',`<p class="sheet-subtitle">November 2026 · ${person().short}</p><div class="row-list">${[['14 Nov',state().inTime||'Belum masuk',state().outTime||'Belum keluar'],['13 Nov','08.01','17.02'],['12 Nov','07.58','17.01'],['11 Nov','07.55','17.00']].map((r,i)=>row('checkcircle',r[0]+' · '+(i===0?'Hari ini':'Hadir'),r[1]+' — '+r[2],`data-history-day="${i}"`,'green')).join('')}</div><p class="modal-note">Contoh histori, bukan jam kerja aktual.</p>`,'history'),
    notifications:()=>{inboxTab='notifications';setPage('inbox');},
    requests:()=>{inboxTab='approval';setPage('inbox');},
    help:()=>openChat('hrd'),
    learning:()=>showSheet('Belajar & berkembang',`<p class="sheet-subtitle">Langkah kecil untuk pelayanan yang lebih baik.</p><div class="row-list">${row('book',learningTitle(),state().learningRead?'Sudah dibaca · buka kembali':'Materi singkat · 5 menit','data-action="lesson"','green')}${row('people','Coaching pelayanan','18 November · bersama supervisor','data-action="coaching"','violet')}</div><div class="info-banner green">${icon('leaf')}Pembelajaran terhubung dengan rencana pengembangan Anda.</div>`,'learning'),
    lesson:()=>showSheet(learningTitle(),`<p class="sheet-subtitle">Materi demo · estimasi 5 menit</p><div class="m-card"><div class="timeline">${(data.role==='office'?[['Mulai dari kebutuhan audiens','Pastikan pesan membantu audiens memahami manfaat layanan.'],['Gunakan bahasa yang jelas','Tulis pesan yang singkat, hangat dan sesuai identitas brand.'],['Tinjau sebelum dibagikan','Periksa akurasi informasi dan minta review sesuai alur.']]:[['Sambut dengan hangat','Sapa tamu dan perkenalkan diri.'],['Konfirmasi kebutuhan','Pastikan reservasi dan kebutuhan layanan sesuai.'],['Jelaskan langkah berikutnya','Arahkan tamu dengan jelas dan beri kesempatan bertanya.']]).map((r,i)=>`<div class="timeline-item"><span class="timeline-dot">${i+1}</span><div class="timeline-copy"><b>${r[0]}</b><small>${r[1]}</small></div></div>`).join('')}</div></div><div class="sheet-actions"><button class="primary-button" data-action="learning-done">${icon('checkcircle')}Tandai sudah dibaca</button></div>`,'lesson'),
    'learning-done':()=>{state().learningRead=true;save();closeSheet();render();toast('Materi demo sudah dibaca. Selamat mempraktikkan!');},
    coaching:()=>showSheet('Agenda coaching','<p class="sheet-subtitle">18 November 2026 · 14.00 WITA · Ruang briefing Spa Ubud</p><div class="m-card small-copy">Topik: komunikasi kebutuhan tamu.<br>Persiapkan satu contoh layanan dan satu hal yang ingin dikembangkan.</div><div class="sheet-actions"><button class="primary-button" data-chat="supervisor">Hubungi supervisor</button></div>'),
    documents:()=>showSheet('Dokumen saya',`<p class="sheet-subtitle">Dokumen contoh untuk profil ${person().short}.</p><div class="row-list">${row('file','Ringkasan penempatan','Outlet, jabatan, dan jadwal','data-action="assignment"','blue')}${row('file','Panduan karyawan','Contoh dokumen · belum ada file asli','data-action="handbook"')}</div>`),
    assignment:()=>showSheet('Penempatan saya',`<div class="receipt"><div class="receipt-row"><span>Karyawan</span><b>${person().name}</b></div><div class="receipt-row"><span>Peran</span><b>${person().role}</b></div><div class="receipt-row"><span>Lokasi</span><b>${person().outlet}</b></div><div class="receipt-row"><span>Shift</span><b>${person().shift}</b></div></div><p class="modal-note">Penempatan dan identitas adalah data dummy.</p>`),
    handbook:()=>showSheet('Panduan karyawan','<p class="sheet-subtitle">Ringkasan contoh untuk preview.</p><div class="row-list">'+row('scan','Presensi','Masuk dan keluar sesuai shift yang ditugaskan.','data-page="attendance"','green')+row('leaf','Izin & cuti','Ajukan kebutuhan dan pantau persetujuannya.','data-action="leave"','violet')+row('help','Bantuan','Hubungi HRD Care jika membutuhkan dukungan.','data-action="help"','blue')+'</div>'),
    roles:()=>showSheet('Pilih peran demo',`<p class="sheet-subtitle">Lihat perbedaan pekerjaan dengan data samaran. Pilihan ini hanya tersedia pada preview.</p><div class="row-list">${Object.entries(roles).map(([key,r])=>row('user',r.role,r.short+' · '+r.outlet,`data-role="${key}"`,'gold',key===data.role?icon('check'):icon('arrow'))).join('')}</div>`),
    reset:()=>showSheet('Ulangi dari awal?',`<p class="sheet-subtitle">Presensi, checklist, chat dan pengajuan demo di browser ini akan kembali ke contoh awal.</p><div class="sheet-actions"><button class="primary-button" data-action="confirm-reset">Ya, ulangi demo</button><button class="secondary-button" data-action="close">Kembali</button></div>`),
    'confirm-reset':()=>{data=fresh();save();setPage('home');toast('Demo kembali ke kondisi awal.');},
    'task-primary':()=>{const t=state().tasks.find(t=>t.id===activeTask);if(t)taskChange(t.stage==='Dikerjakan'?'Review':'Dikerjakan');},
    'task-finish':()=>taskChange('Selesai'),
    asset:()=>{const t=state().tasks.find(t=>t.id===activeTask);if(!t)return;if(!t.asset){t.asset=true;t.history.push({text:'Bukti checklist demo ditambahkan.',actor:person().name,time:'08.04'});save();showTask(t.id);}else{showSheet('Bukti checklist demo',`<div class="m-card small-copy">${icon('file')}<br><b>Bukti-checklist-demo.pdf</b><br>Contoh lampiran pekerjaan ${esc(t.title)}.<br>File asli tidak diunggah atau direkam.</div><div class="sheet-actions"><button class="primary-button" data-task="${t.id}">Kembali ke pekerjaan</button></div>`);}},
    portals:()=>showSheet('Portal HAWK',`<p class="sheet-subtitle">Pilih ruang kerja Anda.</p><a class="portal-option" href="../#/nv/1" target="_top"><span>Finance & ERP<small>Portal desktop</small></span>↗</a><a class="portal-option" href="../#/m" target="_top"><span>Operational Therapist<small>Portal operasional</small></span>↗</a><a class="portal-option" href="commercial.html" target="_top"><span>Commercial OS<small>Portal desktop</small></span>↗</a><a class="portal-option" href="hrd.html" target="_top"><span>HRD & Human Growth<small>Portal HRD</small></span>↗</a><button class="portal-option" style="width:100%" data-action="close"><span>HAWK Mobile<small>Preview aktif · dummy</small></span>✓</button>`)
  };
  document.addEventListener('click',e=>{
    const el=e.target.closest('button,a');if(!el)return;
    if(el.dataset.page){setPage(el.dataset.page);return;}
    if(el.dataset.action){actions[el.dataset.action]?.();return;}
    if(el.dataset.task){showTask(el.dataset.task);return;}
    if(el.dataset.taskTab){showTask(activeTask,el.dataset.taskTab);return;}
    if(el.dataset.workTab){workTab=el.dataset.workTab;render();return;}
    if(el.dataset.inboxTab){inboxTab=el.dataset.inboxTab;render();return;}
    if(el.dataset.chat){openChat(el.dataset.chat);return;}
    if(el.dataset.role){switchRole(el.dataset.role);return;}
    if(el.dataset.service!==undefined){serviceDetail(Number(el.dataset.service));return;}
    if(el.dataset.approval){showApproval(el.dataset.approval);return;}
    if(el.dataset.decision){const a=data.approvals.find(a=>a.id===el.dataset.id);const note=$('#approval-note')?.value.trim();if(a&&data.role==='supervisor'&&a.status==='Menunggu'){if(!note){$('#approval-note').focus();$('#approval-note').setCustomValidity('Tuliskan alasan keputusan terlebih dahulu.');$('#approval-note').reportValidity();return;}a.status=el.dataset.decision;a.note=note;save();render();showApproval(a.id);}return;}
    if(el.dataset.request){const r=data.requests.find(r=>r.id===el.dataset.request&&r.role===data.role);if(r)showSheet('Detail pengajuan',pill('Menunggu pemeriksaan','gold')+`<h3 class="task-detail-title">${esc(r.type)}</h3><div class="receipt"><div class="receipt-row"><span>Tanggal</span><b>${esc(displayDate(r.date))}</b></div><div class="receipt-row"><span>${r.formType==='leave'?'Durasi':'Waktu'}</span><b>${esc(r.value)}${r.formType==='leave'?' hari':' WITA'}</b></div></div><p class="small-copy gap-top">${esc(r.reason)}</p><p class="modal-note">ID ${r.id} · tersimpan lokal sebagai demo.</p>`);return;}
    if(el.dataset.historyDay!==undefined){const d=Number(el.dataset.historyDay);if(d===0&&state().inTime)receipt();else showSheet('Detail presensi',`<div class="receipt"><div class="receipt-row"><span>Tanggal</span><b>${14-d} November 2026</b></div><div class="receipt-row"><span>Status</span><b>${d===0?'Belum check-in':'Hadir · Demo'}</b></div><div class="receipt-row"><span>Outlet</span><b>${person().outlet}</b></div></div><div class="sheet-actions"><button class="secondary-button" data-action="correction">Ajukan koreksi</button></div>`);}
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='role-select'){switchRole(e.target.value);return;}
    if(e.target.dataset.check!==undefined){const t=state().tasks.find(t=>t.id===activeTask),i=Number(e.target.dataset.check);if(!t||!t.checks[i]||['Review','Selesai'].includes(t.stage))return;t.checks[i].done=e.target.checked;t.history.push({text:`Checklist ${e.target.checked?'selesai':'dibuka kembali'}: ${t.checks[i].text}.`,actor:person().name,time:'08.03'});save();render();const scroll=$('#sheet').scrollTop;showTask(t.id);$('#sheet').scrollTop=scroll;return;}
    if(e.target.id==='task-stage')taskChange(e.target.value);
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='chat-search'){const q=e.target.value.toLowerCase();document.querySelectorAll('.chat-row').forEach(el=>el.hidden=!el.dataset.search.includes(q));}
    if(e.target.id==='approval-note')e.target.setCustomValidity('');
  });
  document.addEventListener('submit',e=>{
    const f=e.target;if(!['chat-form','comment-form','request-form'].includes(f.id))return;e.preventDefault();const form=new FormData(f);
    if(f.id==='chat-form'){const text=String(form.get('message')).trim();if(!text)return;messages(activeChat).push({name:person().short,text,time:'08.06',mine:true});save();render();openChat(activeChat);$('#chat-form input').focus();}
    if(f.id==='comment-form'){const text=String(form.get('message')).trim(),t=state().tasks.find(t=>t.id===activeTask);if(!text||!t)return;t.comments.push({name:person().name,time:'08.05',text});t.history.push({text:'Diskusi ditambahkan pada tugas.',actor:person().name,time:'08.05'});save();showTask(t.id,'discussion');}
    if(f.id==='request-form'){const reason=String(form.get('reason')).trim();if(!reason)return;const r={id:'REQ-DEMO-'+String(data.requests.length+1).padStart(3,'0'),role:data.role,formType:f.dataset.type,type:String(form.get('kind')),date:String(form.get('date')),value:String(form.get('value')),reason};data.requests.push(r);save();render();showSheet('Pengajuan terkirim',`<div class="success-seal">${icon('check')}</div><h3 class="success-title">Sudah kami catat.</h3><p class="face-helper">${esc(r.type)} menunggu pemeriksaan.<br>Status dapat dilihat di Inbox → Pengajuan.</p><div class="sheet-actions"><button class="primary-button" data-action="requests">Lihat pengajuan saya</button></div><p class="modal-note">${r.id} · simulasi lokal, tidak mengirim ke HRD nyata.</p>`);}
  });
  $('#sheet').addEventListener('click',e=>{if(e.target===$('#sheet')){const r=$('#sheet').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSheet();}});
  addEventListener('resize',()=>{if($('#sheet').open)placeSheet();});
  addEventListener('scroll',()=>{if($('#sheet').open)placeSheet();},{passive:true});
  addEventListener('hashchange',()=>{const n=location.hash.slice(1);if(pages.some(p=>p[0]===n)&&n!==page)setPage(n);});
  render();
})();
