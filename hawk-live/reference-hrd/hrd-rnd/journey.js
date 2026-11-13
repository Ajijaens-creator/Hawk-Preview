const stages=['Ide','Issue','Workplan','Priority','Dikerjakan','Review','Selesai'];
const demoPeople=['Ayu Pradipta','Made Pradipta','Komang Pradipta'];
const workplaces=['HRD Operations','Human Growth'];
let workplace=workplaces[0], actor=demoPeople[0], dayOnly=false;
const cards=[
  {id:'HR-001',name:'Validasi kebutuhan therapist Ubud',stage:'Issue',team:workplaces[0],pic:demoPeople[0],due:'2026-11-18',source:'Manpower Planning · Ubud',key:'capacity-Spa Ubud-Spa Therapist'},
  {id:'HR-002',name:'Siapkan jadwal interview receptionist',stage:'Workplan',team:workplaces[0],pic:demoPeople[2],due:'2026-11-19',source:'Rekrutmen'},
  {id:'HR-003',name:'Uji mentoring therapist baru',stage:'Ide',team:workplaces[1],pic:demoPeople[1],due:'2026-11-23',source:'People Performance'}
];
const now=()=>new Intl.DateTimeFormat('id-ID',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Makassar'}).format(new Date())+' WITA';
function log(c,message){(c.history??=[]).unshift(actor+' · '+now()+' · '+message);}
function move(c,stage){
  if(!c || c.stage===stage)return;
  if(stage==='Selesai' && (!c.checked || c.stage!=='Review')){
    modal('Perlu review', '<p>Lengkapi checklist dan pindahkan kartu ke Review sebelum menutup tugas.</p>');return;
  }
  log(c,c.stage+' → '+stage);c.stage=stage;render();
}
function createCard(name,stage,team,source,key){
  let c=key && cards.find(item=>item.key===key);
  if(!c){
    c={id:'HR-'+String(cards.length+1).padStart(3,'0'),name,stage,team,source,key,pic:'Belum ditugaskan',due:''};
    cards.push(c);log(c,'Kartu dibuat di '+stage);
  }
  if(detail.open)detail.close();
  workplace=c.team;go('Tugas');cardDetail(c);
}
function markActions(name,team,source,key){
  return '<div class="tools">'+stages.slice(0,3).map(s=>button('Tandai '+s,()=>createCard(name,s,team,source,key))).join('')+'</div>';
}
function cardDetail(c,view='Preview'){
  let body='<div class="tools">'+['Preview','Files & Assets','Discussion','Tasks & Checklist','Activity & History'].map(v=>button(v,()=>cardDetail(c,v),'action'+(v===view?' primary':''))).join('')+'</div>';
  if(view==='Preview')body+=fields({'ID':c.id,'Workplace':c.team,'Sumber':c.source,'PIC':c.pic,'Tenggat':c.due||'Belum dijadwalkan','Status':c.stage})+
    '<form id="card-edit" class="editor"><label>PIC<select name="pic">'+['Belum ditugaskan',...demoPeople].map(p=>'<option'+(c.pic===p?' selected':'')+'>'+esc(p)+'</option>').join('')+'</select></label><label>Tenggat<input type="date" name="due" value="'+esc(c.due)+'"></label><label>Pindahkan ke<select name="stage">'+stages.map(s=>'<option'+(s===c.stage?' selected':'')+'>'+s+'</option>').join('')+'</select></label><button class="action primary">Simpan perubahan</button></form>';
  if(view==='Discussion')body+=(c.messages||[]).map(m=>'<p>'+esc(m)+'</p>').join('')+'<form id="card-chat" class="editor"><label>Pesan demo<input name="message" required maxlength="300"></label><button class="action primary">Kirim</button></form>';
  if(view==='Tasks & Checklist')body+=fields({'Bukti hasil':c.checked?'Terlampir dalam simulasi':'Perlu diperiksa'})+
    button(c.checked?'Batalkan cek bukti':'Tandai bukti lengkap',()=>{c.checked=!c.checked;log(c,'Checklist bukti diperbarui');cardDetail(c,view);});
  if(view==='Files & Assets')body+=fields({'Lampiran demo':c.checked?'Bukti hasil simulasi':'Belum ada bukti','Referensi':c.source});
  if(view==='Activity & History')body+=(c.history||[]).map(h=>'<p>'+esc(h)+'</p>').join('')||'<p>Belum ada perubahan.</p>';
  modal(c.name,body);
  get('card-edit')?.addEventListener('submit',e=>{
    e.preventDefault();const data=new FormData(e.target);
    const pic=data.get('pic'), due=data.get('due'), stage=data.get('stage');
    if(c.pic!==pic)log(c,'PIC '+c.pic+' → '+pic);
    if(c.due!==due)log(c,'Tenggat → '+(due||'dikosongkan'));
    c.pic=pic;c.due=due;detail.close();render();move(c,stage);
  });
  get('card-chat')?.addEventListener('submit',e=>{
    e.preventDefault();const m=new FormData(e.target).get('message').trim();
    if(!m)return;(c.messages??=[]).push(actor+' · '+now()+' · '+m);log(c,'Menambahkan pesan');cardDetail(c,view);
  });
}
function planner(){
  const strip=tabs(['Board','Calendar','List','Library','My Tasks']);
  const filters='<div class="tools">'+workplaces.map(w=>button(w,()=>{workplace=w;render();},'action'+(w===workplace?' primary':''))).join('')+
    '<label>Pengguna demo <select id="planner-actor">'+demoPeople.map(p=>'<option'+(actor===p?' selected':'')+'>'+p+'</option>').join('')+'</select></label></div>';
  const items=cards.filter(c=>tab==='My Tasks'?c.pic===actor&&(!dayOnly||c.today):c.team===workplace);
  const top=strip+filters+button('+ Kartu demo',()=>{modal('Kartu baru','<form id="new-card" class="editor"><label>Judul<input name="name" required maxlength="120"></label><label>Kolom<select name="stage">'+stages.slice(0,3).map(s=>'<option>'+s+'</option>').join('')+'</select></label><button class="action primary">Buat kartu</button></form>');
    get('new-card').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.target),name=d.get('name').trim();if(name)createCard(name,d.get('stage'),workplace,'Planner');});},'action primary');
  if(tab==='Board')return top+'<div class="kanban">'+stages.map(s=>'<section class="lane" data-lane="'+s+'"><h2>'+s+' <span>'+items.filter(c=>c.stage===s).length+'</span></h2>'+
    items.filter(c=>c.stage===s).map(c=>'<article draggable="true" data-card="'+c.id+'"><small>'+c.id+'</small>'+button(c.name,()=>cardDetail(c),'record')+
    '<p>'+esc(c.pic)+' · '+esc(c.due||'Tanpa tenggat')+'</p>'+(c.history?.[0]?'<small>'+esc(c.history[0])+'</small>':'')+'</article>').join('')+'</section>').join('')+'</div>';
  if(tab==='Library')return top+catalogue({'Template HRD':['Screening lamaran','Onboarding administratif'],'Template Human Growth':['Coaching therapist','Verifikasi kompetensi']},(g,i)=>createCard(i,'Workplan',g==='Template HRD'?workplaces[0]:workplaces[1],'Library · '+i));
  if(tab==='Calendar')return top+'<section class="panel"><h2>November 2026 · WITA</h2><div class="calendar-grid">'+
    ['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d=>'<strong>'+d+'</strong>').join('')+
    '<span></span>'.repeat(6)+Array.from({length:30},(_,i)=>{
      const day=i+1, date='2026-11-'+String(day).padStart(2,'0');
      return '<div class="calendar-day"><small>'+day+'</small>'+items.filter(c=>c.due===date).map(c=>button(c.name,()=>cardDetail(c),'record')).join('')+'</div>';
    }).join('')+'</div></section>'+
    table('Agenda dan tenggat',['Tugas','PIC','Tanggal'],items.filter(c=>c.due).map(c=>({cells:[c.name,c.pic,c.due],open:()=>cardDetail(c)})));
  const rows=items;
  return top+(tab==='My Tasks'?'<div class="tools">'+button(dayOnly?'Semua tugas saya':'My Day',()=>{dayOnly=!dayOnly;render();})+'</div>':'')+
    table(tab==='Calendar'?'Agenda dan tenggat':tab,['Tugas','PIC','Tenggat','Status'],rows.map(c=>({cells:[c.name,c.pic,c.due||'—',c.stage],status:c.stage,open:()=>tab==='My Tasks'?
      modal(c.name,fields({'My Day':c.today?'Dalam fokus hari ini':'Di luar fokus'})+button(c.today?'Keluarkan dari My Day':'Masukkan My Day',()=>{c.today=!c.today;detail.close();render();})+button('Buka kartu',()=>cardDetail(c))):cardDetail(c)})));
}
function wireJourney(){
  get('planner-actor')?.addEventListener('change',e=>{actor=e.target.value;render();});
  for(const node of main.querySelectorAll('[data-card]'))node.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',node.dataset.card));
  for(const lane of main.querySelectorAll('[data-lane]')){
    lane.addEventListener('dragover',e=>e.preventDefault());
    lane.addEventListener('drop',e=>{e.preventDefault();move(cards.find(c=>c.id===e.dataTransfer.getData('text/plain')&&c.team===workplace),lane.dataset.lane);});
  }
}
const openings={'Spa Operations':['Spa Therapist','Spa Receptionist','Spa Manager','Spa Supervisor','Spa Attendant','Housekeeping','Security'],
'Marketing':['Content Creator','Admin Marketing','Fotografer','Videografer','Social Media Admin'],'Sales':['Sales'],'Finance & Accounting':['Admin General Accounting','Finance']};
const technical={
'Spa Therapist':'Teknik treatment, sesi per shift, dan cara merespons tekanan yang membuat tamu tidak nyaman',
'Spa Receptionist':'Sistem reservasi/POS, bahasa layanan, dan tindakan saat dua tamu memesan slot yang sama',
'Spa Manager':'Contoh mengelola kapasitas, biaya, dan kualitas outlet',
'Spa Supervisor':'Contoh audit layanan dan coaching shift',
'Spa Attendant':'Cara menyiapkan ruang dan perlengkapan treatment',
'Housekeeping':'Cara memeriksa kebersihan dan kesiapan ruang',
'Security':'Cara menangani insiden dan mencatat eskalasi',
'Content Creator':'Contoh karya, kontribusi, dan hasil',
'Admin Marketing':'Cara menjaga akurasi jadwal dan data campaign',
'Fotografer':'Portofolio foto dan peran Anda',
'Videografer':'Portofolio video, pengambilan gambar, dan editing',
'Social Media Admin':'Cara menangani komentar dan eskalasi keluhan',
'Sales':'Contoh tindak lanjut lead sampai konversi',
'Admin General Accounting':'Contoh rekonsiliasi dan penanganan selisih',
'Finance':'Contoh forecast dan pengendalian kas'};
const pipeline=['Screening','Klarifikasi','Shortlist','Interview','Uji Praktik','Keputusan','Penawaran & Kontrak','Onboarding','Penempatan Aktif'];
const candidates=[
 {name:'Kandidat Demo 01',job:'Spa Therapist',outlet:'Spa Ubud',experience:3,shift:'Sore',stage:'Screening',motivation:'Mengembangkan keterampilan treatment.',answer:'Deep tissue dan aromatherapy',channel:'QR poster'},
 {name:'Kandidat Demo 02',job:'Spa Receptionist',outlet:'Spa Bhisma',experience:1,shift:'Pagi',stage:'Screening',motivation:'Mendalami layanan tamu.',answer:'Reservasi dan POS',channel:'Website'}
];
function vacancyLink(job,outlet){
  const url=new URL(location.href);url.hash='lamar/'+encodeURIComponent(job)+'/'+encodeURIComponent(outlet);return url.href;
}
function career(job,outlet='Spa Ubud'){
  const share=vacancyLink(job,outlet);
  modal('Lamar · '+job,fields({'Outlet':outlet,'Lingkungan':'Simulasi. Gunakan jawaban dan identitas fiktif.'})+
    '<div class="tools">'+button('Salin tautan demo',async()=>{
      try{await navigator.clipboard.writeText(share);if(get('share-state'))get('share-state').textContent='Tautan disalin.';}
      catch{if(get('share-state'))get('share-state').textContent=share;}
    })+button('Lihat tautan & QR',()=>modal('Bagikan lowongan',fields({'Tautan lokal':share,'QR publik':'Pratinjau tujuan. QR shareable menggunakan URL website setelah deployment.'})+
      '<a href="'+esc(share)+'">Buka tautan formulir</a>'))+'</div><p id="share-state" class="notice" aria-live="polite"></p>'+
    '<form id="apply-demo" class="editor"><h3>1. Minat dan sumber</h3>'+
    '<label>Sumber lowongan<select name="channel"><option>Website</option><option>Media sosial</option><option>QR poster</option><option>Referral</option></select></label>'+
    '<label>Alasan memilih perusahaan dan posisi<textarea name="motivation" required></textarea></label>'+
    '<h3>2. Pengalaman dan keterampilan</h3><label>Lama pengalaman (tahun)<input name="experience" required type="number" min="0" max="60"></label>'+
    '<label>'+esc(technical[job])+'<textarea name="answer" required></textarea></label>'+
    '<label>Cara bekerja atau menerima feedback<textarea name="learning"></textarea></label>'+
    '<h3>3. Kesiapan</h3><label>Shift<select name="shift"><option>Pagi</option><option>Sore</option><option>Fleksibel</option></select></label>'+
    '<label>Ekspektasi gaji dummy (Rp)<input name="salary" type="number" min="0"></label>'+
    '<label>Siap mulai<input name="start" type="date"></label><label>Waktu interview WITA<input name="interview" type="datetime-local"></label>'+
    '<h3>4. Dokumen</h3><label>Tautan portofolio atau sosial profesional demo<input name="portfolio" type="url"></label>'+
    '<label>Simulasi kelengkapan<select name="docs"><option>CV dummy</option><option>CV + sertifikat dummy</option><option>CV + jawaban tulis tangan dummy</option></select></label>'+
    '<p class="notice">Nama kandidat dibuat otomatis. KTP, foto, dan kontrak dicontohkan di tahap verifikasi.</p><button class="action primary">Kirim lamaran dummy</button></form>');
  get('apply-demo').addEventListener('submit',e=>{
    e.preventDefault();const data=Object.fromEntries(new FormData(e.target));
    candidates.push({...data,name:'Kandidat Demo '+String(candidates.length+1).padStart(2,'0'),job,outlet,stage:'Screening'});
    detail.close();if(publicMode){render();modal('Lamaran demo diterima','<p>Lamaran tersimpan dalam sesi simulasi ini.</p>');}else go('Rekrutmen','Kandidat');
  });
}
function candidate(c){
  const related=cards.find(t=>t.key==='candidate-'+c.name);
  const skill=c.job==='Spa Therapist'?/deep tissue|aromatherapy|treatment/i:c.job==='Spa Receptionist'?/reservasi|booking|pos/i:/\S/;
  modal(c.name,fields({'Posisi':c.job,'Outlet':c.outlet,'Tahap':c.stage,'Sumber':c.channel,'Pengalaman':c.experience+' tahun','Shift':c.shift,
    'Motivasi':c.motivation,'Bukti jawaban':c.answer,'Dokumen':c.docs||'CV dummy','Siap mulai':c.start||'Perlu klarifikasi','Interview WITA':c.interview||'Belum dijadwalkan',
    'AI screening simulasi · pengalaman':Number(c.experience)>=1?'Terpenuhi':'Perlu klarifikasi',
    'AI screening simulasi · pengalaman teknis':skill.test(c.answer)?'Ada bukti untuk direview':'Perlu klarifikasi',
    'AI screening simulasi · shift sore Ubud':c.outlet!=='Spa Ubud'?'Di luar kriteria contoh':c.shift==='Pagi'?'Perlu klarifikasi':'Terpenuhi'})+
    '<div class="tools">'+button(related?'Buka kartu review':'Buat kartu klarifikasi',()=>createCard('Review '+c.name,'Workplan',workplaces[0],'Rekrutmen · '+c.job,'candidate-'+c.name))+
    button('Interview · Google Meet demo',()=>modal('Jadwal interview dummy',fields({'Kandidat':c.name,'Waktu WITA':c.interview||'19 Nov 2026 · 10.00','Acara Calendar':'Simulasi pembuatan acara','Meet':'Tautan belum dibuat pada demo'})))+'</div>'+
    '<form id="candidate-stage" class="editor"><label>Keputusan reviewer<select name="stage">'+pipeline.map(s=>'<option'+(s===c.stage?' selected':'')+'>'+s+'</option>').join('')+
    '</select></label><label>Alasan keputusan<input name="reason" required></label><button class="action primary">Simpan keputusan demo</button></form>'+
    (c.stage==='Penempatan Aktif'?fields({'Kontrak':'Dokumen dummy','Akun & role':'Draf akses · '+c.job,'Penempatan':c.outlet}):'')+
    (c.history||[]).map(h=>'<p>'+esc(h)+'</p>').join(''));
  get('candidate-stage').addEventListener('submit',e=>{
    e.preventDefault();const d=new FormData(e.target);
    (c.history??=[]).unshift(now()+' · '+role.value+' · '+c.stage+' → '+d.get('stage')+' · '+d.get('reason'));
    c.stage=d.get('stage');detail.close();render();candidate(c);
  });
}
function recruitment(section){
  if(section==='Kandidat')return table('Lamaran masuk dan screening',['Kandidat','Posisi','Outlet','Tahap'],candidates.map(c=>({cells:[c.name,c.job,c.outlet,c.stage],status:c.stage,open:()=>candidate(c)})));
  if(section==='Manajemen Rekrutmen')return table('Pipeline rekrutmen',['Tahap','Lamaran'],pipeline.map(s=>({cells:[s,candidates.filter(c=>c.stage===s).length],open:()=>go('Rekrutmen','Kandidat')})));
  return '<section class="hero"><small>KARIER & LAMARAN · R&D</small><h2>Temukan posisi di Jaens Enterprises</h2><p>Pilih posisi untuk membuka formulir kandidat dengan pertanyaan sesuai pekerjaan.</p></section>'+
    catalogue(openings,(_,job)=>modal(job,fields({'Posisi':job,'Outlet demo':outlets.join(', '),'Proses':'Screening → Interview → Uji Praktik → Onboarding'})+
      '<div class="tools">'+outlets.map(outlet=>button('Lamar · '+outlet,()=>career(job,outlet),'action primary')).join('')+'</div>'));
}
const outlets=['Spa Ubud','Spa Santi','Spa Triloka','Spa Bhisma'];
const offices={'Finance & Accounting':12,Marketing:9,HRD:4,Production:5,'Office Operations':8};
const firstNames=['Ayu','Made','Komang','Kadek','Putu','Nyoman','Dewa','Luh','Wayan','Ketut','Rani','Bima','Sinta','Arif','Bagus','Intan','Ratih','Wira','Dian','Sari','Raka'];
const lastNames=['Pradipta','Mahardika','Prameswari','Wijaksana','Purnami','Adinata','Wardhani','Kusuma'];
function seedRoster(){
  const people=[];
  function add(team,division,job,count){
    for(let n=0;n<count;n++){
      const i=people.length, id='DEMO-'+(101+i);
      const lead=job.endsWith('Manager');
      people.push({id,name:firstNames[i%21]+' '+lastNames[Math.floor(i/21)],team,division,job,
        contract:n%4===0?'Tetap':'PKWT',attendance:n%13===0?'Terlambat':n%17===0?'Cuti':'Hadir',
        email:id.toLowerCase()+'@example.invalid',pay:lead?7000000+n*50000:3000000+(i%14)*175000,
        shift:n%2?'Sore':'Pagi',level:lead?'Manajer':n%5===0?'Senior':'Staf',performance:i%3,potential:Math.floor(i/3)%3});
    }
  }
  for(const outlet of outlets){add(outlet,'Spa Operations','Spa Therapist',25);add(outlet,'Spa Operations','Spa Receptionist',5);}
  for(const [division,count] of Object.entries(offices)){add('Office',division,division+' Manager',1);add('Office',division,division+' Staff',count-1);}
  return people;
}
let scope='', year=2026, talentScope='', erased=false, publicMode=false;
const capacityRates=[108,65,88,96];
function capacity(){
  const rows=outlets.flatMap((outlet,i)=>['Spa Therapist','Spa Receptionist'].map((job,j)=>{
    const people=employees.filter(e=>e.team===outlet&&e.job===job);
    const available=people.length*(j?96:80), rate=j?[91,69,85,103][i]:capacityRates[i];
    const actual=j?Math.round(available*rate/100):therapistRows().filter(t=>t.outlet===outlet).reduce((n,t)=>n+t.hours,0);
    return {outlet,job,people,available,actual,rate:available?100*actual/available:null};
  }));
  return '<section class="hero"><small>MANPOWER PLANNING · DATA DUMMY</small><h2>Temukan gap kapasitas per outlet dan posisi</h2><p>Therapist memakai jam treatment. Reception memakai estimasi jam beban front desk.</p></section>'+
    table('Kapasitas Spa · November 2026',['Outlet','Posisi','Orang','Jam tersedia','Jam aktual','Utility','Status'],rows.map(r=>{
      const status=r.rate===null?'Belum ada data':r.rate>100?'Tambah kapasitas':r.rate<70?'Investigasi utilisasi':'Pantau';
      return {cells:[r.outlet,r.job,r.people.length,r.available,num(r.actual),r.rate===null?'—':num(r.rate)+'%',status],status,open:()=>capacityDetail(r,status)};
    }))+
    table('Kapasitas divisi Office',['Divisi','Orang','Indikator','Status'],[...Object.keys(offices),'PC','Commercial'].map((d,i)=>{
      const count=employees.filter(e=>e.division===d).length;
      const work=['Rekonsiliasi','Campaign','Permintaan SDM','Output produksi','Cakupan operasi','Belum dipetakan','Belum dipetakan'][i];
      const state=count?['Pantau','Tinjau kapasitas tersedia','Tinjau backlog','Pantau','Pantau'][i]:'Headcount belum ditetapkan';
      return {cells:[d,count||'—',work,state],status:state,open:()=>modal(d,fields({'Headcount dummy':count,'Indikator beban':work,'Status':state})+
        (count?markActions('Tinjau beban '+d,workplaces[0],'Manpower Planning · Office','office-'+d):''))};
    }));
}
function capacityDetail(r,status){
  const surplus=r.actual-r.available;
  const recommendation=r.rate===null?'Tambahkan data jadwal.':r.rate>100?'Bandingkan bantuan outlet, shift ekstra, dan lowongan sebelum menambah formasi.':r.rate<70?'Periksa permintaan, pembatalan, dan jadwal sebelum redistribusi.':'Pantau cakupan tiap shift.';
  modal(r.outlet+' · '+r.job,fields({'Status':status,'Pembilang / penyebut':num(r.actual)+' / '+r.available+' jam',
    'Sumber pembilang':r.job==='Spa Therapist'?'POS dummy · treatment selesai':'Front desk dummy · reservasi dan check-in',
    'Sumber penyebut':'Jadwal shift reguler dummy','Gap':num(surplus)+' jam','Rekomendasi AI simulasi':recommendation})+
    '<div class="tools">'+['Pagi','Sore'].map(shift=>button('Shift '+shift,()=>{
      const people=r.people.filter(e=>e.shift===shift), avail=r.available*(r.people.length?people.length/r.people.length:0);
      const morning=r.available*(r.people.length?r.people.filter(e=>e.shift==='Pagi').length/r.people.length:0);
      const first=Math.round(r.actual*(r.available?morning/r.available:0)*(r.rate>100?.94:1));
      modal(r.outlet+' · '+shift,fields({'Posisi':r.job,'Jam tersedia':avail,'Jam aktual':shift==='Pagi'?first:r.actual-first})+
        '<div class="list">'+people.map(e=>button(e.name,()=>employeeDetail(e,'Kepegawaian'))).join('')+'</div>');
    })).join('')+'</div>'+
    markActions('Tinjau kapasitas '+r.outlet+' · '+r.job,workplaces[0],'Manpower Planning · '+r.outlet,'capacity-'+r.outlet+'-'+r.job)+
    button('Buka formulir lowongan demo',()=>career(r.job,r.outlet),'action primary')+
    (manager()&&r.job==='Spa Therapist'?button('Rekonsiliasi komisi POS demo',()=>commissionView(r)) : ''));
}
const boxNames=[['Perlu Review Mendalam','Stabil di Peran Saat Ini','Spesialis Berkinerja Tinggi'],
['Perlu Dukungan Kinerja','Core Players','High Performers'],['Potensi Belum Tergali','High Potentials','★ Stars']];
function talent(){
  const people=employees.filter(e=>!talentScope||e.team===talentScope);
  return '<section class="hero"><small>PEOPLE PERFORMANCE · DATA DUMMY</small><h2>9-Box Talent</h2><p>Potensi pengembangan ↑ · Performa →</p></section>'+
    '<div class="tools">'+['',...outlets,'Office'].map(s=>button(s||'Semua lokasi',()=>{talentScope=s;render();},'action'+(talentScope===s?' primary':''))).join('')+'</div>'+
    '<div class="matrix">'+[2,1,0].flatMap(y=>boxNames[y].map((name,x)=>{
      const list=people.filter(e=>e.performance===x&&e.potential===y);
      return button(name+' · '+list.length,()=>modal(name,'<div class="list">'+list.map(e=>button(e.name+' · '+e.team,()=>talentDetail(e))).join('')+'</div>'+(list.length?'':'<p>Belum ada anggota pada cakupan ini.</p>')),'action box box-'+(x+y));
    })).join('')+'</div><p class="notice">Penempatan pada matriks adalah contoh review Human Growth dengan bukti dummy.</p>';
}
function talentDetail(e){
  const levels=['Rendah','Sedang','Tinggi'];
  modal(e.name,fields({'Posisi':e.job,'Outlet / tim':e.team,'Performa':levels[e.performance],'Potensi':levels[e.potential],
    'Alasan performa':['Target belum tercapai dalam dua review demo','Target inti terpenuhi secara konsisten','Hasil di atas target dan kualitas terverifikasi'][e.performance],
    'Alasan potensi':['Fokus penguatan peran saat ini','Praktik baru diterapkan dengan pendampingan','Menerapkan coaching dan siap menguji tanggung jawab baru'][e.potential],
    'Riwayat':'Review dummy · November 2026 · Supervisor dan HG'})+
    button('Buka profil',()=>employeeDetail(e,'Kepegawaian'))+markActions('Tindak lanjut pengembangan · '+e.name,workplaces[1],'People Performance · 9-Box','talent-'+e.id));
}
const months=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function budget(){
  if(!manager())return '<section class="panel"><h2>Akses khusus Manager HRD</h2></section>';
  const people=employees.filter(e=>!scope||e.team===scope||e.division===scope);
  const monthly=people.reduce((sum,e)=>sum+(e.pay||0),0);
  const revenueScope=!scope||outlets.includes(scope);
  const data=months.map((month,i)=>{
    const revenue=revenueScope?Math.round(monthly*([.85,.9,.96,1,1.04,1.08,1.12,1.06,1.02,1.08,1.15,1.22][i])/(year===2026?.27:.29)):0;
    const actual=Math.round(monthly*(.94+i*.012+(i%3)*.018));
    return {month,revenue,actual,plan:revenueScope?Math.round(revenue*.25):monthly,limit:revenueScope?Math.round(revenue*.30):null};
  });
  const closed=year===2026?10:12;
  const sum=(key,rows=data)=>rows.reduce((n,row)=>n+(row[key]||0),0);
  const ratio=(cost,revenue)=>revenue?num(100*cost/revenue)+'%':'—';
  const totalForecast=sum('actual',data.slice(0,closed))+sum('plan',data.slice(closed));
  const controls='<div class="tools"><label>Tahun <select id="budget-year">'+[2025,2026].map(v=>'<option'+(year===v?' selected':'')+'>'+v+'</option>').join('')+'</select></label>'+
    '<label>Cakupan <select id="budget-scope">'+['',...outlets,'Office',...Object.keys(offices),'PC','Commercial'].map(v=>'<option value="'+esc(v)+'"'+(scope===v?' selected':'')+'>'+esc(v||'Semua unit')+'</option>').join('')+'</select></label></div>';
  let plan=0,actual=0,forecast=0;
  const curves=data.map((r,i)=>({plan:plan+=r.plan,actual:i<closed?(actual+=r.actual):null,forecast:forecast+=(i<closed?r.actual:r.plan)}));
  return '<section class="hero"><small>PEOPLE BUDGETING · MANAGER HRD · DATA DUMMY</small><h2>'+esc(scope||'Jaens Enterprises')+' · '+year+'</h2><p>Koridor usulan 25–30% dari revenue bersih untuk cakupan penghasil revenue.</p></section>'+controls+
    '<section class="panel"><h2>Ringkasan tahunan</h2>'+fields({'Headcount dummy':people.length,'Revenue rencana':revenueScope?rupiah(sum('revenue')):'Pagu divisi tanpa revenue langsung',
      'Anggaran':rupiah(sum('plan')),'Forecast':rupiah(totalForecast),'Forecast ratio':ratio(totalForecast,sum('revenue')),
      'Ruang sampai batas atas':revenueScope?rupiah(sum('limit')-totalForecast):'—',
      'Revenue per Employee rencana':revenueScope&&people.length?rupiah(Math.round(sum('revenue')/people.length)):'—',
      'Salary per Employee bulanan':people.length?rupiah(Math.round(monthly/people.length)):'—'})+'</section>'+
    '<div class="catalogue">'+chart('Rasio bulanan · %',data.map((r,i)=>({plan:r.revenue?25:null,actual:r.revenue&&i<closed?100*r.actual/r.revenue:null,forecast:r.revenue?(i<closed?100*r.actual/r.revenue:25):null})),true,(i)=>monthDetail(data[i],i,closed))+
    chart('Kurva S · biaya kumulatif',curves,false,(i)=>monthDetail(data[i],i,closed))+'</div>'+
    table('Kuartal dan bulanan',['Periode','Revenue rencana','Anggaran','Aktual tercatat','Forecast','Rasio forecast'],[
      ...[0,1,2,3].map(q=>({label:'Q'+(q+1),rows:data.slice(q*3,q*3+3),start:q*3})),
      ...data.map((r,i)=>({label:r.month,rows:[r],start:i}))
    ].map(({label,rows,start})=>{
      const booked=sum('actual',rows.slice(0,Math.max(0,closed-start))), projected=booked+sum('plan',rows.slice(Math.max(0,closed-start)));
      return {cells:[label,revenueScope?rupiah(sum('revenue',rows)):'—',rupiah(sum('plan',rows)),start<closed?rupiah(booked):'—',rupiah(projected),ratio(projected,sum('revenue',rows))],
        open:()=>rows.length===1?monthDetail(rows[0],start,closed):modal(label,fields({'Anggaran':rupiah(sum('plan',rows)),'Forecast':rupiah(projected),'Rasio forecast':ratio(projected,sum('revenue',rows))}))};
    }));
}
function chart(title,values,percent,open){
  const max=Math.max(percent?35:1,...values.flatMap(Object.values).filter(v=>v!=null))*1.05;
  const x=i=>32+i*30, y=v=>158-v/max*140;
  const colors={plan:'#997221',actual:'#287053',forecast:'#495fa1'};
  return '<section class="panel"><h2>'+title+'</h2><svg viewBox="0 0 380 180" role="img" aria-label="'+title+'">'+
    '<path d="M32 14 V158 H365" fill="none" stroke="#b7ac96"/>'+
    (percent?'<rect x="32" width="330" y="'+y(30)+'" height="'+(y(25)-y(30))+'" fill="#f2e4c7"/>':'')+
    Object.entries(colors).map(([key,color])=>'<polyline points="'+values.map((v,i)=>v[key]==null?'':x(i)+','+y(v[key])).filter(Boolean).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2.5" '+(key==='forecast'?'stroke-dasharray="5 3"':'')+'/>').join('')+
    '</svg><p class="notice">Emas · Rencana | Hijau · Aktual | Biru putus · Forecast</p><div class="tools">'+months.map((m,i)=>button(m,()=>open(i))).join('')+'</div></section>';
}
function monthDetail(r,i,closed){
  modal(r.month+' '+year,fields({'Cakupan':scope||'Semua unit','Revenue rencana':r.revenue?rupiah(r.revenue):'—','Anggaran':rupiah(r.plan),
    'Biaya aktual demo':i<closed?rupiah(r.actual):'Belum ditutup','Batas 30%':r.limit===null?'—':rupiah(r.limit)})+
    markActions('Tinjau anggaran tenaga kerja · '+r.month,workplaces[0],'People Budgeting · rincian khusus Manager HRD','budget-'+year+'-'+scope+'-'+i));
}
function eraseDemo(){
  modal('Hapus data demo sesi ini','<p>Direktori, lamaran, tugas, pengajuan, catatan race, dan perubahan demo akan dikosongkan. Muat ulang halaman untuk memulai lagi dari data contoh.</p>'+
    button('Hapus data dummy',()=>{
      for(const list of [employees,candidates,cards,requests,raceWork,events])list.length=0;
      payStatus.clear();changes.clear();erased=true;detail.close();go('Beranda');
    },'action primary'));
}
function bootCareer(){
  const match=location.hash.match(/^#lamar\/([^/]+)\/([^/]+)$/);
  if(!match)return;
  try{
    const [,job,outlet]=match.map(decodeURIComponent);
    if(Object.values(openings).flat().includes(job)&&outlets.includes(outlet)){publicMode=true;document.body.classList.add('career-mode');go('Rekrutmen','Lowongan Pekerjaan');career(job,outlet);}
  }catch{}
}

function commissionView(r){
  if(!manager())return;
  const rate=25000;
  const people=therapistRows().filter(t=>t.outlet===r.outlet);
  const total=people.reduce((sum,t)=>sum+t.guests*rate,0);
  modal('Komisi POS dummy · '+r.outlet,fields({'Periode':'November 2026','Aturan contoh':rupiah(rate)+' per layanan selesai','Total komisi dummy':rupiah(total),'Handoff Finance':'Ringkasan biaya outlet untuk rekonsiliasi demo'})+
    '<div class="list">'+people.map(t=>button(t.name+' · '+rupiah(t.guests*rate),()=>{
      if(!manager())return;
      modal(t.name,fields({'Sumber':'Batch POS-DUMMY-'+t.employee.id,'Layanan selesai':t.guests,'Komisi demo':rupiah(t.guests*rate),'Outlet':r.outlet}));
    })).join('')+'</div>');
}
