const pillars = [
  ['Financial Efficiency & Value Creation',20,'Executive Financial Performance','Rasio biaya tenaga kerja|Revenue per Employee|Therapist Utility'],
  ['Collaboration Group',10,'Collaboration Group','Development HAWK|Strategic Partnership HWC × Jaens Wellness'],
  ['Stability & Risk Governance',20,'Risk Control & Compliance Assurance','Turnover|Absenteeism|Exit Interview|BPJS Compliance|Uniform Request & Fulfillment'],
  ['Talent Flow, Talent Engine, Pipeline',20,'Talent Management & Workforce Readiness','Recruitment Jaens Spa|Recruitment Care Estate|Recruitment HWC|Share Loker|Talent Readiness|Staff Database Update|Employee Loyalty'],
  ['Growth, Learning and Capability',20,'Learning & Capability Development','Training & Learning Program|Pelatihan therapist reguler|Pelatihan therapist baru|Progress Training|Onboarding'],
  ['Implementasi Ambidex',10,'Implementasi Ambidex','Bisnis Proses|Looker Studio|XRace|HR Activity Calendar']
].map(([name,weight,goal,keys])=>({name,weight,goal,objective:goal,keys:keys.split('|')}));
const expectationGroups = {
  'Executive Summary':[
    ['Ratio Salary Jaens Enterprises','%',25,23.5,'Finance · biaya tenaga kerja / revenue',true],
    ['Ratio Revenue per Employee','Rp',23000000,21000000,'Finance + HG · revenue / headcount'],
    ['Ratio Turnover Jaens Enterprises','%',2,1.2,'HG · karyawan keluar / rata-rata headcount']
  ],
  'Collaboration Group':[
    ['Development HAWK','%',100,75,'HG + tim HAWK · milestone'],
    ['Development LMS','%',100,60,'HG + Learning · milestone'],
    ['Opening Holywings','%',100,null,'HG + Operations · kesiapan pembukaan']
  ],
  'Human Growth Expectations':[
    ['Recruitment & Selection','%',100,80,'HG · pemenuhan permintaan SDM'],
    ['Therapist Productivity','%',100,90,'Spa Operations · tamu aktual / target tamu'],
    ['People Development & Talent Pipeline Program','%',100,72,'HG · program dan pipeline'],
    ['Talent Readiness','%',85,79,'HG + pimpinan divisi · asesmen'],
    ['Governance & Compliance SDM','Dok',1,1,'HG · bukti tata kelola'],
    ['Absenteeism','%',100,null,'Presensi · definisi denominator perlu dikonfirmasi'],
    ['Training & Learning Program','%',100,88,'HG + Learning · pelatihan'],
    ['Bisnis Proses','Dok',3,2,'HG · dokumen SOP'],
    ['Looker HG','Dok',1,1,'HG · laporan reflection']
  ]
};
const reflectionPages = ['Dashboard HR Performance','Therapist Utility','Therapist Productivity','Manpower Dashboard','Recruitment Dashboard','Absen','Therapist Training','Tata Kelola'];
const raceStages = ['Daily Race','Weekly Race','Monthly Reflection','STRACON'];
const raceWork = [
  {name:'Validasi jam treatment',owner:'Dara Angkasa',due:'13 Nov',track:'Operasional',stage:0,status:'Terblokir',evidence:'Rekonsiliasi shift dan POS demo menunggu verifikasi.'},
  {name:'Uji distribusi booking',owner:'Tara Pelangi',due:'20 Nov',track:'Eksperimen',stage:1,status:'Direncanakan',evidence:'Bandingkan beban therapist per shift menggunakan booking dummy.'},
  {name:'Tinjau utilisasi dan produktivitas',owner:'Manager HRD',due:'30 Nov',track:'Operasional',stage:2,status:'Direncanakan',evidence:'Buka e-Deck dan telaah gap target.'},
  {name:'Putuskan perluasan eksperimen booking',owner:'Manager HRD',due:'02 Des',track:'Eksperimen',stage:3,status:'Direncanakan',evidence:'Keputusan dan tindak lanjut simulasi.'}
];
function therapistRows() {
  return employees.filter(e=>e.job==='Spa Therapist').map(e=>{
    const i=Number(e.id.slice(5))-101;
    const base=capacityRates[outlets.indexOf(e.team)]||80;
    return {name:e.name,outlet:e.team,hours:Math.round(80*(base+(i%5-2)*2)/100*10)/10,available:80,
      guests:58+i%25,target:80,training:6+i%5,employee:e};
  });
}
let deckPage = 0;
let focusOutlet = '';
const num = n => new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n);
const display = (n,unit) => n == null ? 'Belum terverifikasi' : unit==='Rp' ? rupiah(n) : num(n)+(unit==='%'?'%':' '+unit);
const isRestrictedMetric = key => /salary|biaya tenaga kerja/i.test(key);
const visibleMetrics = rows => rows.filter(([key])=>manager() || !isRestrictedMetric(key));
const weightTotal = () => pillars.reduce((sum,p)=>sum+Math.round(p.weight*100),0)/100;

function expectationView() {
  return Object.entries(expectationGroups).map(([name,rows])=>table(name,['Ekspektasi','Satuan','Target','Realisasi','Sumber demo'],
    visibleMetrics(rows).map(([key,unit,target,actual,source])=>({
      cells:[key,unit,display(target,unit),display(actual,unit),source],
      open:()=>modal(key,fields({'Satuan':unit,'Target':display(target,unit),'Realisasi':display(actual,unit),'Sumber demo':source,'Cakupan':'Human Growth · Oktober 2026'}))
    })))).join('');
}

function raceEditor(index) {
  const p = pillars[index] || {name:'',goal:'',objective:'',keys:[],weight:0};
  const controls = [
    ['name','Indikator',p.name],['goal','Race Goal',p.goal],['objective','Objective',p.objective],
    ['keys','Key Metrics (pisahkan dengan |)',p.keys.join(' | ')],['weight','Bobot (%)',p.weight]
  ];
  modal(index===undefined?'Tambah indikator':'Edit indikator', '<form id="race-editor" class="editor">' +
    controls.map(([id,label,value])=>'<label>'+esc(label)+'<input required name="'+id+'" value="'+esc(value)+'" '+(id==='weight'?'type="number" min="0" max="100" step="0.01"':'')+'></label>').join('')+
    '<button class="action primary">Simpan draf</button></form>');
  get('race-editor').addEventListener('submit',event=>{
    event.preventDefault();
    if(!manager()) return;
    const values = Object.fromEntries(new FormData(event.target));
    const keys = values.keys.split('|').map(key=>key.trim()).filter(Boolean);
    if(!keys.length || !values.name.trim() || !values.goal.trim() || !values.objective.trim()) return;
    const next = {name:values.name.trim(),goal:values.goal.trim(),objective:values.objective.trim(),keys,weight:Number(values.weight)};
    if(index===undefined) pillars.push(next);
    else pillars[index]=next;
    detail.close();
    render();
  });
}

const demoMetrics = {
  'Rasio biaya tenaga kerja':['%',25,23.5,'Finance demo','maksimum'],
  'Revenue per Employee':['Rp',23000000,21000000,'Finance dan HG demo'],
  'Therapist Utility':['%',85,143/180*100,'Jam treatment / jam tersedia'],
  'Development HAWK':['%',100,75,'Milestone HAWK demo'],
  'Strategic Partnership HWC × Jaens Wellness':['%',100,90,'Milestone kemitraan demo'],
  'Turnover':['%',2,1.2,'Pergerakan karyawan demo','maksimum'],
  'Absenteeism':['%',85,null,'Definisi denominator perlu dikonfirmasi'],
  'Exit Interview':['%',100,90,'Log exit interview demo'],
  'BPJS Compliance':['Dok',1,1,'Dokumen kepatuhan demo'],
  'Uniform Request & Fulfillment':['Hari',7,6,'Permintaan seragam demo','maksimum'],
  'Recruitment Jaens Spa':['%',100,80,'Permintaan SDM Spa demo'],
  'Recruitment Care Estate':['%',100,70,'Permintaan SDM Care Estate demo'],
  'Recruitment HWC':['%',100,60,'Permintaan SDM HWC demo'],
  'Share Loker':['Dok',6,5,'Log publikasi demo'],
  'Talent Readiness':['%',85,79,'Asesmen kesiapan demo'],
  'Staff Database Update':['Dok',1,1,'Audit direktori demo'],
  'Employee Loyalty':['Dok',1,1,'Survei demo'],
  'Training & Learning Program':['Dok',1,1,'Program pelatihan demo'],
  'Pelatihan therapist reguler':['Jam',138,145,'Log pelatihan Spa demo'],
  'Pelatihan therapist baru':['Jam',240,190,'Log onboarding Spa demo'],
  'Progress Training':['%',100,82,'Learning demo'],
  'Onboarding':['Dok',1,1,'Checklist onboarding demo'],
  'Bisnis Proses':['Dok',3,2,'SOP demo'],
  'Looker Studio':['Dok',1,1,'Laporan demo'],
  'XRace':['Dok',1,1,'Review XRace demo'],
  'HR Activity Calendar':['Dok',1,1,'Kalender demo']
};
function pillarScore(p) {
  const metrics = p.keys.map(key=>demoMetrics[key]).filter(metric=>metric && metric[1]>0 && metric[2]!=null);
  if(!metrics.length) return null;
  return 100*metrics.reduce((sum,[,target,actual,,direction])=>
    sum+Math.min(1,direction==='maksimum'?(actual===0?1:target/actual):actual/target),0)/metrics.length;
}

function raceVegen() {
  const total = weightTotal();
  return '<section class="hero"><small>HUMAN GROWTH · OKTOBER 2026</small><h2>Race Vegen</h2><p>Perkuat stabilitas, kepatuhan, efisiensi, dan kesiapan talenta.</p><p aria-live="polite">Total bobot <b>'+num(total)+'%</b> · '+(total===100?'Valid':'Draf — perlu tepat 100%')+'</p></section>'+
    table('Indikator dan Race Goals',['Indikator','Race Goal','Key Metrics','Bobot','Capaian provisional'],pillars.map((p,index)=>({
      cells:[p.name,p.goal,visibleMetrics(p.keys.map(k=>[k])).length,num(p.weight)+'%',p.keys.some(isRestrictedMetric) && !manager()?'Akses terbatas':display(pillarScore(p),'%')],
      open:()=>modal(p.name,fields({'Race Goal':p.goal,'Objective':p.objective,'Bobot':num(p.weight)+'%'}) +
        '<div class="list">'+visibleMetrics(p.keys.map(key=>[key])).map(([key])=>button(key+' →',()=>metricDetail(key))).join('')+'</div>'+
        (manager()?'<p>'+button('Edit indikator',()=>raceEditor(index),'action primary')+'</p>':''))
    })),manager()?button('+ Tambah indikator',()=>raceEditor(),'action primary'):'');
}
function metricDetail(key) {
  if(isRestrictedMetric(key) && !manager()) return;
  const [unit,target,actual,source,direction='minimum'] = demoMetrics[key] || ['—',null,null,'Belum dipetakan'];
  modal(key,fields({'Satuan':unit,'Target':display(target,unit),'Realisasi':display(actual,unit),'Arah target':direction,'Sumber':source})+markActions(isRestrictedMetric(key)?'Tinjau metrik terbatas':'Tinjau '+key,workplaces[1],isRestrictedMetric(key)?'KPI Library · Akses Manager HRD':'KPI Library · '+key,'metric-'+key));
}

function therapistView(score) {
  const rows = therapistRows().filter(t=>!focusOutlet || t.outlet===focusOutlet);
  const switches = '<div class="tools">'+['',...outlets].map(outlet=>button(outlet||'Semua outlet',()=>{
    focusOutlet=outlet;
    render();
  },'action'+(focusOutlet===outlet?' primary':''))).join('')+'</div>';
  return switches + table(score?'XScore personal · provisional':'Spa Therapist · Oktober 2026',
    ['Therapist','Outlet','Utility','Produktivitas','XScore demo'],rows.map(t=>{
      const utility=t.hours/t.available*100;
      const productivity=t.guests/t.target*100;
      const xscore=50*Math.min(1,utility/85)+30*Math.min(1,productivity/100)+20*Math.min(1,t.training/10);
      return {cells:[t.name,t.outlet,num(utility)+'%',num(productivity)+'%',num(xscore)+'/100'],
        open:()=>modal(t.name,fields({'Outlet':t.outlet,'Jam treatment / tersedia':t.hours+' / '+t.available+' jam',
          'Target Utility':'85%','Tamu aktual / target':t.guests+' / '+t.target,'Pelatihan aktual / target':t.training+' / 10 jam',
          'Bobot Utility / Produktivitas / Learning':'50% / 30% / 20%','XScore provisional':num(xscore)+'/100',
          'Bukti':'Log treatment, shift, dan pelatihan dummy'})+button('Buka profil',()=>employeeDetail(t.employee,'Kepegawaian')))};
    }));
}
function deck() {
  const title=reflectionPages[deckPage];
  const switches='<section class="hero"><small>MONTHLY REFLECTION · OKTOBER 2026</small><h2>'+esc(title)+'</h2><p>Slide '+(deckPage+1)+' dari '+reflectionPages.length+'</p></section>'+
    '<div class="tools">'+reflectionPages.map((page,index)=>button(page,()=>{deckPage=index;render();},'action'+(index===deckPage?' primary':''))).join('')+'</div>';
  if(deckPage===0) return switches+'<div class="tools">'+button('Manpower Planning',()=>go('Manpower Planning'))+button('9-Box Talent',()=>go('9-Box Talent'))+(manager()?button('People Budgeting',()=>go('People Budgeting')):'')+'</div>'+expectationView();
  if(deckPage===1 || deckPage===2) {
    const rows=therapistRows().filter(t=>!focusOutlet || t.outlet===focusOutlet);
    const utility=deckPage===1;
    const numerator=rows.reduce((n,t)=>n+(utility?t.hours:t.guests),0);
    const denominator=rows.reduce((n,t)=>n+(utility?t.available:t.target),0);
    return switches+'<section class="panel"><h2>'+esc(title)+'</h2>'+
      fields({'Cakupan':focusOutlet||'Semua outlet','Realisasi agregat':display(denominator?100*numerator/denominator:null,'%'),
        'Pembilang / penyebut':numerator+' / '+denominator+(utility?' jam':' tamu'),'Target':utility?'85%':'100%'})+
      '</section>'+therapistView(false);
  }
  const keys=[[],[],[],['Turnover','Talent Readiness','Staff Database Update'],['Recruitment Jaens Spa','Recruitment Care Estate','Recruitment HWC'],
    ['Absenteeism'],['Pelatihan therapist reguler','Pelatihan therapist baru','Progress Training'],['BPJS Compliance','Bisnis Proses','XRace']][deckPage];
  return switches+table(title,['Metrik','Satuan','Target','Realisasi'],keys.map(key=>{
    const [unit,target,actual]=demoMetrics[key];
    return {cells:[key,unit,display(target,unit),display(actual,unit)],open:()=>metricDetail(key)};
  }));
}
function performanceView(group) {
  if(group==='Kinerja & KPI') {
    const strip=tabs(['Stakeholder Expectations','XScore','KPI Library','People Performance']);
    if(tab==='Stakeholder Expectations') return strip+expectationView();
    if(tab==='KPI Library') return strip+table('KPI Library',['Metrik','Satuan','Target','Sumber'],
      visibleMetrics(Object.entries(demoMetrics)).map(([key,[unit,target,,source]])=>({
        cells:[key,unit,display(target,unit),source],open:()=>metricDetail(key)
      })));
    return strip+(tab==='People Performance'?button('Buka 9-Box Talent',()=>go('9-Box Talent'),'action primary'):'')+therapistView(tab==='XScore');
  }
  const strip=tabs(['Race Vegen',...raceStages,'e-Deck Reflection']);
  if(tab==='Race Vegen') return strip+raceVegen();
  if(tab==='e-Deck Reflection') return strip+deck();
  const rows=raceWork.filter(work=>raceStages[work.stage]===tab);
  const linked=cards.filter(c=>tab==='Daily Race'?c.today:tab==='Weekly Race'?Boolean(c.due):tab==='Monthly Reflection'?c.stage==='Review'||c.stage==='Selesai':c.source.includes('STRACON'));
  return strip+table(tab,['Komitmen','PIC','Tenggat','Jalur kerja','Status'],rows.map(work=>({
    cells:[work.name,work.owner,work.due,work.track,work.status],status:work.status,
    open:()=>modal(work.name,fields({'PIC':work.owner,'Tenggat':work.due,'Jalur':work.track,'Status':work.status,'Bukti / tindak lanjut':work.evidence})+
      button(work.status==='Terverifikasi'?'Buka kembali':'Verifikasi demo',()=>{
        work.status=work.status==='Terverifikasi'?'Direncanakan':'Terverifikasi';
        detail.close();render();
      },'action primary'))
  })),tab==='Monthly Reflection'?button('Buka e-Deck',()=>{tab='e-Deck Reflection';render();},'action primary'):'')+
  table('Kartu Planner tertaut',['Tugas','PIC','Tenggat','Status'],linked.map(c=>({cells:[c.name,c.pic,c.due||'—',c.stage],open:()=>cardDetail(c)})),
    tab==='STRACON'?button('Buat Workplan tindak lanjut',()=>createCard('Tindak lanjut keputusan STRACON','Workplan',workplaces[1],'STRACON · November 2026','stracon-november-2026')):'');
}
