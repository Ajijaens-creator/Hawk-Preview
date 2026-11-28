/* HAWK Operational · module "analytics-data" — diadaptasi dari paket Owner A02 v1.2 (tools/ops-from-prototype.py). DATA DEMO / SIMULASI. */
(function () {
  'use strict';
  const H = window.OPX;
  const A = H.analytics = H.analytics || {};
  const colors = ['#065b2b','#dfa24d','#b64445','#afc45e','#2aa6b0','#8664aa'];
  const management = ['manager','assistant','hospitality','supervisor'];
  const qualityGroups = ['feedback','complaints','tripadvisor','grading','competency','grooming','process'];
  const criticalGroups = ['waste','complaints','maintenance','process'];
  const n = x => Number.isFinite(Number(x)) ? Number(x) : 0;
  const sum = (rows, fn) => rows.reduce((s,r) => s + n(fn(r)), 0);
  const avg = (rows, fn) => rows.length ? sum(rows,fn) / rows.length : null;
  const pct = (num, den) => den > 0 ? num / den * 100 : null;
  const round = x => Number.isFinite(x) ? Math.round(x * 100) / 100 : null;
  const short = id => H.outlets.find(o=>o.id===id)?.short || id;
  const safeDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v)) && !Number.isNaN(Date.parse(v+'T00:00:00Z')) && new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
  const mins = (a,b) => { const x=Date.parse(a),y=Date.parse(b); return Number.isFinite(x)&&Number.isFinite(y)&&y>=x?(y-x)/60000:null; };
  A.definitions = [
    ['revenue','Revenue Overview','Revenue Overview','revenue','POS','integrated','Pendapatan service dan retail, tren harian, kontribusi outlet, serta target periode.'],
    ['pnl','Profit & Loss','Profit & Loss','finance','Finance / Accounting','integrated','Revenue, biaya, laba bersih dan selisih terhadap rencana dari pembukuan Finance.'],
    ['capacity','Capacity & Productivity','Capacity & Productivity','capacity','POS + HRD','integrated','Pemanfaatan ruang, produktivitas terapis dan presensi dengan satuan yang eksplisit.'],
    ['waste','Waste & Accuracy','Waste & Accuracy','waste','Operational → Inventory','manual','Catatan waste dan pemeriksaan fisik stok; posting persediaan tetap di Inventory.'],
    ['reviews','Customer Review & Satisfaction','Customer Review','feedback','Operational / Hospitality','manual','Review online dan offline dari catatan feedback yang sama.'],
    ['satisfaction','Customer Satisfaction & Complaints','Customer Satisfaction','feedback','Operational / Hospitality','manual','Kepuasan, distribusi bintang dan feedback tidak puas; kasus komplain ditangani terpisah.'],
    ['retention','Rebooking & Customer Retention','Rebooking Customer','customer','POS + Sales / CRM','integrated','Tamu unik baru dan kembali. Repeat customer dibedakan dari booking kunjungan berikutnya.'],
    ['complaints','Complain Handling Performance','Handling Complain','complaints','Operational / Hospitality','manual','Kasus, waktu respons, resolusi dan status penanganan komplain.'],
    ['tripadvisor','Tripadvisor Performance','Tripadvisor Performance','tripadvisor','Hospitality / Commercial','manual','Snapshot rank dan rating per outlet, dengan tanggal serta bukti sumber.'],
    ['maintenance','Maintenance Performance','Maintenance Performance','maintenance','Operational / Maintenance','manual','Insiden fasilitas, respons, kategori dan status penyelesaian.'],
    ['grading','Grading Front Office Project','Grading FO','grading','Hospitality + HRD','manual','Tahapan program grading, bobot, progress dan bukti hasil.'],
    ['competency','Team Competency & Readiness','Team Competency','competency','HRD + Operational','manual','Penilaian kompetensi terapis, reception dan attendant sesuai instrumen.'],
    ['grooming','Employee Grooming Compliance','Grooming Karyawan','grooming','Operational / Hospitality','manual','Pelaksanaan pemeriksaan grooming dan hasil kepatuhan per outlet.'],
    ['process','Business Process Document','Bisnis Proses','process','Operational / Hospitality','manual','Dokumen bisnis proses, status persetujuan, versi dan pemilik proses.']
  ].map(([id,title,navLabel,group,sourceOwner,sourceMode,description])=>({id,title,navLabel,group,sourceOwner,sourceMode,description}));
  const text = (key,label,extra={})=>({key,label,type:'text',required:true,...extra});
  const number = (key,label,extra={})=>({key,label,type:'number',required:true,min:0,step:'any',...extra});
  const select = (key,label,options,extra={})=>({key,label,type:'select',required:true,options,...extra});
  const when = (key,label,extra={})=>({key,label,type:'datetime-local',required:true,...extra});
  const teamRoles=['manager','assistant','supervisor','head'];
  A.schemas = {
    revenue:{label:'Transaksi service & retail',owner:'POS existing',mode:'integrated',roles:[],departments:[],fields:[text('invoiceRef','Invoice ID'),select('category','Jenis penjualan',['Service','Retail']),number('amount','Revenue net demo',{unit:'currency'}),text('roomType','Kategori ruang')]},
    finance:{label:'Rekap pembukuan outlet',owner:'Finance / Accounting',mode:'integrated',roles:[],departments:[],fields:[text('ledgerRef','Referensi ledger'),number('revenue','Revenue',{unit:'currency'}),number('expense','Total expense',{unit:'currency'}),number('profitTarget','Target profit demo',{unit:'currency'}),number('advertising','Advertising & promotion',{unit:'currency'}),number('cleaning','Kebersihan',{unit:'currency'}),number('electricity','Listrik',{unit:'currency'}),number('maintenance','Repair & maintenance',{unit:'currency'}),number('peopleUsagePercent','People budget usage (persen saja)',{unit:'percent'})]},
    capacity:{label:'Kapasitas & presensi',owner:'POS / HRD',mode:'integrated',roles:[],departments:[],fields:[number('roomMinutes','Menit ruang terpakai'),number('availableRoomMinutes','Menit ruang tersedia'),number('therapistMinutes','Menit layanan terapis'),number('therapistCount','Terapis terjadwal',{step:1}),number('absenceCount','Kejadian tidak hadir',{step:1})]},
    waste:{label:'Waste & pemeriksaan stok',owner:'Attendant / Reception → Supervisor → Inventory',mode:'manual',roles:[...teamRoles,'attendant','reception'],departments:['attendant','reception'],fields:[select('kind','Jenis catatan',['Waste','Stock opname']),select('category','Kelompok',['BHP','Retail']),text('item','Nama item'),number('quantity','Jumlah waste',{required:false,default:0}),number('unitCost','Nilai satuan referensi',{unit:'currency',required:false,default:0}),number('systemQty','Jumlah menurut stok',{required:false,default:0}),number('countedQty','Jumlah fisik',{required:false,default:0}),text('unit','Satuan',{default:'pcs'}),text('reason','Alasan / catatan pemeriksaan')]},
    feedback:{label:'Review & feedback tamu',owner:'Reception / Hospitality',mode:'manual',roles:[...teamRoles,'hospitality','reception'],departments:['reception'],fields:[text('visitRef','Referensi kunjungan (demo)'),select('channel','Channel',['Online','Offline']),select('platform','Sumber',['Google','Tripadvisor','Form outlet']),number('rating','Rating 1–5',{min:1,max:5,step:1}),select('satisfaction','Pernyataan tamu',['Puas','Tidak puas']),text('comment','Catatan feedback',{type:'textarea',required:false})]},
    customer:{label:'Riwayat kunjungan tamu',owner:'POS / Sales CRM',mode:'integrated',roles:[],departments:[],fields:[text('customerRef','Customer ID'),text('visitRef','Visit ID'),select('segment','Segmen',['New','Repeat']),text('firstVisitDate','Tanggal kunjungan pertama')]},
    complaints:{label:'Kasus komplain & service recovery',owner:'Reception / Hospitality → Supervisor',mode:'manual',roles:[...teamRoles,'hospitality','reception'],departments:['reception'],fields:[text('caseRef','Referensi kasus'),select('platform','Sumber',['Offline','Google','Tripadvisor','WhatsApp']),select('category','Kategori',['Service','Waiting time','Cleanliness','Billing','Other']),when('openedAt','Waktu diterima'),when('respondedAt','Waktu respons pertama',{required:false}),select('state','Status kasus',['Open','In progress','Resolved']),when('resolvedAt','Waktu selesai',{required:false}),text('resolution','Tindakan / hasil',{type:'textarea'})]},
    tripadvisor:{label:'Snapshot Tripadvisor',owner:'Hospitality / Commercial',mode:'manual',roles:[...teamRoles,'hospitality','reception'],departments:['reception'],fields:[number('rank','Peringkat',{min:1,step:1}),number('rating','Rating 1–5',{min:1,max:5,step:0.1}),number('reviewCount','Jumlah review saat snapshot',{step:1}),text('sourceRef','URL / referensi halaman outlet')]},
    maintenance:{label:'Insiden & pekerjaan maintenance',owner:'Attendant / Maintenance → Supervisor',mode:'manual',roles:[...teamRoles,'attendant','security'],departments:['attendant','security'],fields:[text('ticketRef','Ticket / asset reference'),select('category','Kategori',['Cleanliness / Hygiene','Electrical','Equipment / Tools','Furniture','HVAC','Building']),when('openedAt','Waktu dilaporkan'),when('respondedAt','Respons pertama',{required:false}),select('state','Status',['Open','In progress','Reschedule','Done']),when('resolvedAt','Waktu selesai',{required:false}),text('description','Temuan / tindakan',{type:'textarea'})]},
    grading:{label:'Tahapan program grading FO',owner:'Hospitality / HRD',mode:'manual',roles:[...teamRoles,'hospitality','reception'],departments:['reception'],fields:[text('programRef','Program ID'),text('milestone','Tahapan kerja'),select('grade','Grade fokus',['Grade A','Grade B','Grade C']),select('phase','Tahap',['Penyusunan materi','Pelatihan','Evaluasi','Validasi']),number('weight','Bobot relatif',{min:0.01,max:100}),number('progress','Progress',{unit:'percent',max:100}),text('pic','PIC (nama demo)')]},
    competency:{label:'Assessment kompetensi',owner:'Assessor HRD / Head / Hospitality',mode:'manual',roles:[...teamRoles,'hospitality'],departments:['reception','therapist','attendant'],fields:[text('employeeRef','Employee ID (demo)'),select('department','Departemen',['reception','therapist','attendant']),text('instrument','Instrumen / versi'),number('achieved','Poin diperoleh'),number('possible','Poin maksimum',{min:1}),text('note','Catatan assessor',{type:'textarea',required:false})]},
    grooming:{label:'Pemeriksaan grooming',owner:'Head departemen / Supervisor',mode:'manual',roles:[...teamRoles,'hospitality','reception','therapist','attendant','security'],departments:['reception','therapist','attendant','security'],fields:[text('employeeRef','Employee ID (demo)'),select('department','Departemen',['reception','therapist','attendant','security']),select('checkStatus','Hasil pemeriksaan',['Sesuai','Perlu perbaikan','Belum diperiksa']),text('checklistVersion','Versi checklist',{default:'GROOM-DEMO-01'}),text('note','Catatan perbaikan',{type:'textarea',required:false})]},
    process:{label:'Dokumen bisnis proses',owner:'Process owner → Supervisor / Manager',mode:'manual',roles:[...teamRoles,'hospitality'],departments:['reception','therapist','attendant','security'],fields:[text('documentRef','Document ID'),text('title','Judul bisnis proses'),number('year','Tahun berlaku',{min:2000,max:2100,step:1,default:2026}),text('version','Versi'),select('department','Pemilik proses',['reception','therapist','attendant','security','management']),select('state','Status dokumen',['Processed','Approved']),text('note','Ringkasan perubahan',{type:'textarea',required:false})]}
  };
  A.format=(value,unit='number')=>{
    if(value===null||value===undefined||!Number.isFinite(Number(value)))return '—';
    const v=Number(value);
    if(unit==='currency')return H.compact(v);
    if(unit==='percent')return v.toLocaleString('id-ID',{maximumFractionDigits:1})+'%';
    if(unit==='rating')return v.toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:2})+' / 5';
    if(unit==='hours')return v.toLocaleString('id-ID',{maximumFractionDigits:2})+' jam';
    return v.toLocaleString('id-ID',{maximumFractionDigits:2});
  };
  const makeSeed=()=>{
    const records=[];let seq=0;
    const add=(group,outlet,date,values,extra={})=>records.push({id:'SRC-DEMO-'+String(++seq).padStart(5,'0'),group,outlet,date,status:'verified',authorId:'seed-demo',values,evidence:'Fixture sintetis untuk pengujian interface; bukan data JAENS.',verifiedBy:'seed-reviewer',createdAt:date+'T09:00:00+08:00',...extra});
    H.outlets.forEach((o,oi)=>{
      let monthRevenue=0;
      for(let day=1;day<=31;day++){
        const date='2026-10-'+String(day).padStart(2,'0');
        const service=2400000+oi*360000+((day*7+oi*3)%11)*110000;
        const retail=150000+((day+oi)%6)*45000;
        monthRevenue+=service+retail;
        add('revenue',o.id,date,{invoiceRef:'INV-DEMO-'+o.id+'-'+day+'-S',category:'Service',amount:service,roomType:['Couple Room','Single Room','Foot Massage Room','Salon Room','Beauty Room'][(day+oi)%5]});
        add('revenue',o.id,date,{invoiceRef:'INV-DEMO-'+o.id+'-'+day+'-R',category:'Retail',amount:retail,roomType:'Retail'});
        add('capacity',o.id,date,{roomMinutes:650+((day*17+oi*63)%700),availableRoomMinutes:6*8*60,therapistMinutes:870+((day*13+oi*57)%650),therapistCount:6+oi,absenceCount:(day+oi)%13===0?1:0});
      }
      const expense=Math.round(monthRevenue*(0.63+oi*.015));
      add('finance',o.id,'2026-10-31',{ledgerRef:'GL-DEMO-'+o.id+'-202610',revenue:monthRevenue,expense,profitTarget:Math.round(monthRevenue*.35),advertising:Math.round(expense*.08),cleaning:Math.round(expense*.055),electricity:Math.round(expense*.095),maintenance:Math.round(expense*.065),peopleUsagePercent:88+oi*3,revenueTarget:Math.round(monthRevenue*(1.08-oi*.045)),note:'Ringkasan demo Finance; payroll individual tidak disertakan. People menunjukkan pemakaian budget pada snapshot terakhir.'});
      [4,11,18,25].forEach((day,di)=>{
        const date='2026-10-'+String(day).padStart(2,'0');
        add('waste',o.id,date,{kind:'Waste',category:'BHP',item:'Massage oil (demo)',quantity:1+(oi+di)%4,unitCost:45000,systemQty:0,countedQty:0,unit:'botol',reason:'Catatan fisik kerusakan kemasan demo'});
        if(di%2===0)add('waste',o.id,date,{kind:'Waste',category:'Retail',item:'Retail sample (demo)',quantity:oi===2?0:1,unitCost:75000,systemQty:0,countedQty:0,unit:'pcs',reason:'Produk rusak demo'});
        add('waste',o.id,date,{kind:'Stock opname',category:'BHP',item:'Hand towel (demo)',quantity:0,unitCost:0,systemQty:50,countedQty:((oi+di)%4===0)?49:50,unit:'pcs',reason:'Pemeriksaan fisik; menunggu aturan posting Inventory'});
        for(let j=0;j<8;j++){
          const dissatisfied=(oi+di+j)%13===0;
          add('feedback',o.id,date,{visitRef:'VIS-DEMO-'+o.id+'-'+day+'-'+j,channel:j%3===0?'Online':'Offline',platform:j%3===0?(j%2?'Tripadvisor':'Google'):'Form outlet',rating:dissatisfied?2:(j%4?5:4),satisfaction:dissatisfied?'Tidak puas':'Puas',comment:'Feedback sintetis '+(j+1)});
        }
        add('tripadvisor',o.id,date,{rank:35-oi*6-di*2,rating:4.5+((oi+di)%4)*.1,reviewCount:180+oi*70+di*15,sourceRef:'Referensi snapshot demo (tidak diambil dari Tripadvisor)'});
        const opened=date+'T10:00:00+08:00';
        add('maintenance',o.id,date,{ticketRef:'MT-DEMO-'+o.id+'-'+day,category:['Electrical','HVAC','Furniture','Equipment / Tools'][di],openedAt:opened,respondedAt:date+'T10:'+String(10+oi*4+di*2).padStart(2,'0')+':00+08:00',state:di===3?'Reschedule':'Done',resolvedAt:di===3?'':date+'T12:30:00+08:00',description:'Perawatan fasilitas demo'});
        ['reception','therapist','attendant','security'].forEach((department,pi)=>add('grooming',o.id,date,{employeeRef:'EMP-DEMO-'+o.id+'-'+department,department,checkStatus:(oi+di+pi)%17===0?'Belum diperiksa':(oi+di+pi)%11===0?'Perlu perbaikan':'Sesuai',checklistVersion:'GROOM-DEMO-01',note:'Pemeriksaan demo'}));
      });
      for(let j=0;j<20;j++){
        const date='2026-10-'+String(2+j).padStart(2,'0');
        add('customer',o.id,date,{customerRef:'CUS-DEMO-'+o.id+'-'+j,visitRef:'VIS-DEMO-'+o.id+'-'+j,segment:j%(5-oi)===0?'Repeat':'New',firstVisitDate:j%(5-oi)===0?'2026-08-10':date});
      }
      for(let j=0;j<3+oi;j++){
        const day=5+j*3,date='2026-10-'+String(day).padStart(2,'0');
        const next='2026-10-'+String(day+1).padStart(2,'0');
        add('complaints',o.id,date,{caseRef:'CASE-DEMO-'+o.id+'-'+j,platform:['Offline','Google','WhatsApp','Tripadvisor'][j%4],category:['Service','Waiting time','Cleanliness'][j%3],openedAt:date+'T09:00:00+08:00',respondedAt:date+'T09:15:00+08:00',state:j===2?'Open':'Resolved',resolvedAt:j===2?'':(j%3===0?next+'T13:00:00+08:00':date+'T12:00:00+08:00'),resolution:'Tindak lanjut sintetis untuk demo alur'});
      }
      ['Modul service excellence','Pelatihan handling complaint','Evaluasi payment handling','Validasi FO system knowledge'].forEach((milestone,j)=>add('grading',o.id,'2026-10-'+String(7+j*6).padStart(2,'0'),{programRef:'FO-DEMO-'+o.id,milestone,grade:j%2?'Grade B':'Grade C',phase:['Penyusunan materi','Pelatihan','Evaluasi','Validasi'][j],weight:25,progress:j<2?100:Math.max(20,85-oi*7-j*5),pic:'PIC demo '+o.short}));
      ['therapist','reception','attendant'].forEach((department,j)=>{for(let k=1;k<=3;k++)add('competency',o.id,'2026-10-20',{employeeRef:'EMP-DEMO-'+o.id+'-'+department+'-'+k,department,instrument:'COMP-DEMO-v1',achieved:65+((oi*8+j*6+k*7)%31),possible:100,note:'Assessment sintetis; bukan hasil penilaian karyawan'});});
      ['Penerimaan pelanggan','Monitoring grooming','Pengelolaan linen','Handling complaint','Persiapan beverage','Pemeriksaan keamanan'].forEach((title,j)=>add('process',o.id,'2026-10-'+String(3+j*4).padStart(2,'0'),{documentRef:'DOC-DEMO-'+o.id+'-'+j,title,year:2026,version:'1.'+j,department:['reception','management','attendant','reception','attendant','security'][j],state:j===4&&oi%2===0?'Processed':'Approved',note:'Dokumen contoh'}));
    });
    // Historical fixtures are source events, never independently fabricated chart points.
    // October remains unchanged; previous months use documented synthetic seasonality.
    const october=records.slice();
    const seasonality=[.73,.81,.76,.86,.89,.93,1.04,.98,.94];
    for(let month=1;month<=9;month++){
      const ym='2026-'+String(month).padStart(2,'0');
      const daysInMonth=new Date(Date.UTC(2026,month,0)).getUTCDate();
      const factor=seasonality[month-1];
      october.filter(r=>['revenue','capacity','waste','maintenance','grooming'].includes(r.group)).forEach(original=>{
        const day=Number(original.date.slice(8));if(day>daysInMonth)return;
        const date=ym+'-'+String(day).padStart(2,'0'),values={...original.values};
        const seedNumber=Number(original.id.slice(-5));
        if(original.group==='revenue'){
          values.amount=Math.round(values.amount*factor);
          values.invoiceRef=values.invoiceRef+'-'+ym;
        }else if(original.group==='capacity'){
          values.roomMinutes=Math.round(values.roomMinutes*factor);
          values.therapistMinutes=Math.round(values.therapistMinutes*factor);
          values.absenceCount=(day+month+seedNumber)%19===0?1:0;
        }else if(original.group==='waste'){
          if(values.kind==='Waste')values.unitCost=Math.round(values.unitCost*(.87+month*.012));
          else values.countedQty=values.systemQty-((seedNumber+month)%7===0?1:0);
        }else if(original.group==='maintenance'){
          ['openedAt','respondedAt','resolvedAt'].forEach(key=>{if(values[key])values[key]=values[key].replace('2026-10',ym);});
          values.ticketRef=values.ticketRef+'-'+ym;
          if(values.state==='Reschedule'&&month<8){values.state='Done';values.resolvedAt=date+'T16:00:00+08:00';}
        }else if(original.group==='grooming'){
          values.checkStatus=(seedNumber+month)%23===0?'Belum diperiksa':(seedNumber+month)%11===0?'Perlu perbaikan':'Sesuai';
        }
        add(original.group,original.outlet,date,values);
      });
      H.outlets.forEach((o,oi)=>{
        const rr=records.filter(r=>r.group==='revenue'&&r.outlet===o.id&&r.date.startsWith(ym));
        const revenue=sum(rr,r=>r.values.amount),expense=Math.round(revenue*(.63+oi*.015));
        add('finance',o.id,ym+'-'+String(daysInMonth).padStart(2,'0'),{ledgerRef:'GL-DEMO-'+o.id+'-'+ym.replace('-',''),revenue,expense,profitTarget:Math.round(revenue*.35),advertising:Math.round(expense*.08),cleaning:Math.round(expense*.055),electricity:Math.round(expense*.095),maintenance:Math.round(expense*.065),peopleUsagePercent:82+oi*3+month*.6,revenueTarget:Math.round(revenue*(1.08-oi*.045)),note:'Rekap Finance sintetis direkonsiliasi dengan transaksi demo pada bulan yang sama. People hanya snapshot persentase pemakaian budget.'});
      });
    }
    return {schemaVersion:'analytics-demo-v2',records,standards:{},sourceAudit:{workbook:'10. Oktober 2026.xlsx',verifiedTabs:4,vegenIndicators:23,beaconCycleRows:[19,19,19,20],rsfDimensions:17,rsfItems:209,officialFormulaPending:true},fixtureCoverage:{revenue:'2026-01-01 / 2026-10-31',finance:'2026-01-01 / 2026-10-31',capacity:'2026-01-01 / 2026-10-31',waste:'2026-01-01 / 2026-10-31',maintenance:'2026-01-01 / 2026-10-31',grooming:'2026-01-01 / 2026-10-31',feedback:'2026-10-01 / 2026-10-31',customer:'2026-10-01 / 2026-10-31',complaints:'2026-10-01 / 2026-10-31',tripadvisor:'2026-10-01 / 2026-10-31',grading:'2026-10-01 / 2026-10-31',competency:'2026-10-01 / 2026-10-31',process:'2026-10-01 / 2026-10-31'}};
  };
  A.ensure=()=>{
    if(!H.state.data.analytics||H.state.data.analytics.schemaVersion!=='analytics-demo-v2')H.state.data.analytics=makeSeed();
    return H.state.data.analytics;
  };
  A.canViewDashboard=id=>{
    const d=A.definitions.find(x=>x.id===id);if(!d)return false;
    if(management.includes(H.user().role))return true;
    const s=A.schemas[d.group];
    return s.roles.includes(H.user().role) && (H.user().role!=='head'||s.departments.includes(H.user().dept));
  };
  A.visibleDefinitions=()=>A.definitions.filter(d=>A.canViewDashboard(d.id));
  /* NP-HAWK-OP-DASHBOARD-002 (Aji 28 Nov 2026): dashboard yang disembunyikan dari SEMUA navigasi Operational (sidebar,
     penghitung, shortcut). Hanya visibilitas menu: definisi, rute, data, entry/verifikasi, RBAC dan akses URL langsung tetap.
     Reaktivasi: kosongkan daftar ini ([]) → dashboard kembali ke posisi semula. */
  A.NAV_HIDDEN=['tripadvisor','maintenance'];
  A.isNavHidden=id=>A.NAV_HIDDEN.includes(id);
  A.navDefinitions=()=>A.visibleDefinitions().filter(d=>!A.isNavHidden(d.id));
  A.records=(group,approvedOnly=true)=>{
    const state=A.ensure(),from=H.ui.analyticsFrom||'2026-10-01',to=H.ui.analyticsTo||'2026-10-31',u=H.user();
    if(!A.schemas[group]||(!management.includes(u.role)&&!A.definitions.some(d=>d.group===group&&A.canViewDashboard(d.id))))return [];
    return H.scope(state.records).filter(r=>r.group===group&&r.date>=from&&r.date<=to&&(!approvedOnly||r.status==='verified')).filter(r=>{
      if(management.includes(u.role))return true;
      if(u.role==='head')return A.schemas[group]?.departments.includes(u.dept) && (!r.values.department||r.values.department===u.dept);
      return r.authorId===u.id || r.values.employeeRef===u.id;
    });
  };
  A.canEnter=group=>{
    const s=A.schemas[group],u=H.user();
    return !!s&&s.mode!=='integrated'&&s.roles.includes(u.role)&&(u.role!=='head'||s.departments.includes(u.dept));
  };
  const visibleRecord=id=>{
    const r=A.ensure().records.find(x=>x.id===id);
    return r&&H.scope([r]).length?r:null;
  };
  A.canReview=r=>{
    if(!r||r.status!=='submitted'||r.authorId===H.user().id||!H.scope([r]).length||A.schemas[r.group]?.mode==='integrated')return false;
    const u=H.user();
    if(['manager','assistant','supervisor'].includes(u.role))return true;
    if(u.role==='hospitality')return qualityGroups.includes(r.group)&&r.headReviewedBy!==u.id;
    if(u.role==='head')return A.schemas[r.group]?.departments.includes(u.dept)&&(!r.values.department||r.values.department===u.dept)&&r.headReviewedBy!==u.id;
    return false;
  };
  function normalize(group,values,strict){
    const schema=A.schemas[group],out={};
    if(!schema)throw Error('Jenis sumber tidak ditemukan.');
    schema.fields.forEach(f=>{
      let value=values?.[f.key];
      if(value===undefined||value===null||value===''){
        if(strict&&f.required)throw Error('Lengkapi '+f.label+'.');
        if(f.default!==undefined)value=f.default;else{out[f.key]='';return;}
      }
      if(f.type==='number'){
        value=Number(value);if(!Number.isFinite(value))throw Error(f.label+' harus berupa angka.');
        if(f.min!==undefined&&value<f.min||f.max!==undefined&&value>f.max)throw Error(f.label+' di luar rentang yang diizinkan.');
        if(f.step===1&&!Number.isInteger(value))throw Error(f.label+' harus bilangan bulat.');
      }else{
        value=String(value).trim().slice(0,2000);
        if(f.type==='select'&&!f.options.includes(value))throw Error('Pilih nilai '+f.label+' yang tersedia.');
        if(f.type==='datetime-local'&&!Number.isFinite(Date.parse(value)))throw Error('Waktu '+f.label+' tidak valid.');
        if(f.type==='datetime-local'&&!/([+-]\d\d:\d\d|Z)$/.test(value))value+=(/T\d\d:\d\d$/.test(value)?':00':'')+'+08:00';
      }
      out[f.key]=value;
    });
    if(strict&&group==='competency'&&n(out.achieved)>n(out.possible))throw Error('Poin diperoleh tidak boleh melebihi poin maksimum.');
    if(strict&&['complaints','maintenance'].includes(group)){
      if(['Resolved','Done'].includes(out.state)&&!out.resolvedAt)throw Error('Waktu selesai diperlukan untuk status selesai.');
      ['respondedAt','resolvedAt'].forEach(k=>{if(out[k]&&mins(out.openedAt,out[k])===null)throw Error('Urutan waktu diterima, respons dan selesai harus valid.');});
    }
    return out;
  }
  function validateInput(input,strict){
    if(!A.canEnter(input.group))throw Error('Sumber ini mengikuti kewenangan portal pemiliknya; tidak dapat diedit oleh akun ini.');
    if(!H.outlets.some(o=>o.id===input.outlet)||!H.scope([{outlet:input.outlet}]).length)throw Error('Outlet berada di luar lingkup akun.');
    if(!safeDate(input.date))throw Error('Tanggal pencatatan tidak valid.');
    const evidence=String(input.evidence||'').trim().slice(0,3000);
    if(strict&&!evidence)throw Error('Catatan bukti / referensi sumber wajib diisi sebelum dikirim.');
    const values=normalize(input.group,input.values,strict);
    if(input.group==='grooming'&&!management.includes(H.user().role)&&H.user().role!=='head'){
      if(values.employeeRef&&values.employeeRef!==H.user().id)throw Error('Staff hanya dapat mencatat pemeriksaan dirinya sendiri.');
      if(values.department&&values.department!==H.user().dept)throw Error('Departemen tidak sesuai penugasan akun.');
      values.employeeRef=H.user().id;values.department=H.user().dept;
    }
    return {values,evidence};
  }
  const sourceKey=(group,values)=>{
    const fields={feedback:['visitRef','platform','channel'],complaints:['caseRef'],maintenance:['ticketRef'],grading:['programRef','milestone'],competency:['employeeRef','instrument'],grooming:['employeeRef'],process:['documentRef','version']}[group];
    return fields&&fields.every(k=>values[k]!==undefined&&values[k]!=='')?fields.map(k=>String(values[k])).join('|'):null;
  };
  function rejectDuplicate(input,values,exceptId){
    const key=sourceKey(input.group,values);
    if(key&&A.ensure().records.some(r=>r.id!==exceptId&&r.group===input.group&&r.outlet===input.outlet&&r.date===input.date&&sourceKey(r.group,r.values)===key&&r.status!=='rejected'))throw Error('Referensi sumber pada tanggal ini sudah tercatat. Buka catatan existing untuk menghindari input ganda.');
  }
  A.addRecord=input=>{
    const status=input.status==='draft'?'draft':'submitted';
    const cleaned=validateInput(input,status==='submitted');
    if(status==='submitted')rejectDuplicate(input,cleaned.values);
    const r={id:'ENTRY-DEMO-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),group:input.group,outlet:input.outlet,date:input.date,status,authorId:H.user().id,values:cleaned.values,evidence:cleaned.evidence,verifiedBy:null,createdAt:new Date().toISOString(),version:1};
    A.ensure().records.push(r);H.log('ANALYTICS_ENTRY_'+status.toUpperCase(),r.id,'Pencatatan sumber '+r.group+'; belum menjadi actual terverifikasi.',r.outlet);H.save();return r;
  };
  A.updateRecord=(id,input)=>{
    const r=visibleRecord(id);if(!r||r.authorId!==H.user().id||!['draft','rejected'].includes(r.status))throw Error('Hanya pembuat dapat memperbaiki draft atau catatan yang dikembalikan.');
    const status=input.status==='submitted'?'submitted':'draft';
    const cleaned=validateInput({...input,group:r.group,outlet:r.outlet},status==='submitted');
    if(status==='submitted')rejectDuplicate({...input,group:r.group,outlet:r.outlet},cleaned.values,r.id);
    r.revisions=r.revisions||[];r.revisions.push({version:r.version||1,date:r.date,values:{...r.values},evidence:r.evidence,status:r.status});
    Object.assign(r,{date:input.date,values:cleaned.values,evidence:cleaned.evidence,status,version:(r.version||1)+1,headReviewedBy:null,reviewedBy:null,updatedAt:new Date().toISOString()});
    H.log('ANALYTICS_ENTRY_UPDATED',r.id,'Revisi catatan sumber; versi '+r.version+'.',r.outlet);H.save();return r;
  };
  A.submitRecord=id=>{
    const r=visibleRecord(id);if(!r||r.authorId!==H.user().id||r.status!=='draft')throw Error('Hanya pembuat dapat mengirim draft miliknya.');
    const clean=validateInput(r,true);rejectDuplicate(r,clean.values,r.id);r.values=clean.values;r.evidence=clean.evidence;r.status='submitted';r.submittedAt=new Date().toISOString();H.log('ANALYTICS_ENTRY_SUBMITTED',r.id,'Dikirim untuk verifikasi.',r.outlet);H.save();return r;
  };
  A.reviewRecord=(id,decision)=>{
    const r=visibleRecord(id);if(!A.canReview(r))throw Error('Tidak berwenang memverifikasi catatan ini atau catatan dibuat oleh akun sendiri.');
    if(!['verified','rejected'].includes(decision))throw Error('Keputusan review tidak valid.');
    const u=H.user();let final=true,message='Catatan terverifikasi; dashboard menggunakan sumber yang sama.';
    if(decision==='rejected'){r.status='rejected';r.reviewedBy=u.id;message='Dikembalikan kepada pembuat untuk diperbaiki.';}
    else if(criticalGroups.includes(r.group)&&!['manager','assistant','supervisor'].includes(u.role)){
      r.headReviewedBy=u.id;r.headReviewedAt=new Date().toISOString();final=false;message='Review awal tersimpan. Verifikasi akhir menunggu Supervisor / Manager.';
    }else{r.status='verified';r.verifiedBy=u.id;r.verifiedAt=new Date().toISOString();}
    H.log(final?'ANALYTICS_'+decision.toUpperCase():'ANALYTICS_PRELIMINARY_REVIEW',r.id,message,r.outlet);H.save();return {record:r,final,message};
  };
  const card=(key,label,value,unit='number',direction='neutral',note='')=>({key,label,value:round(value),unit,direction,target:null,standardStatus:'pending',note});
  const chart=(id,title,type,unit,categories,series,extra={})=>({id,title,type,unit,categories,series:series.map((s,i)=>({...s,color:s.color||colors[i%colors.length],values:s.values.map(v=>v===null||v===undefined?null:round(v))})),direction:'neutral',width:'half',...extra});
  const col=(key,label,unit)=>({key,label,...(unit?{unit}:{})});
  function outletSeries(rows,fn){return H.outlets.filter(o=>H.scope([{outlet:o.id}]).length).map(o=>({id:o.id,label:o.short,value:fn(rows.filter(r=>r.outlet===o.id))}));}
  const makeOutletChart=(id,title,type,unit,rows,fn,extra={})=>{const os=outletSeries(rows,fn);return chart(id,title,type,unit,os.map(x=>x.label),[{name:title,values:os.map(x=>x.value)}],extra);};
  function grouped(rows,key,fn){const keys=[...new Set(rows.map(key))].sort();return {keys,values:keys.map(k=>fn(rows.filter(r=>key(r)===k)))};}
  const latestByOutlet=rows=>H.outlets.map(o=>rows.filter(r=>r.outlet===o.id).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt))[0]).filter(Boolean);
  const table=(columns,rows)=>({columns,rows});
  /* NP-HAWK-OP-REVENUE-001 · Diagram 02 Revenue Category (khusus widget revenue-composition).
     Pakai values.revenueCategory bila sumber sudah memetakannya; selain itu Retail→Product (D2) dan record Service
     dibagi deterministik ke Service/Package/Gift Card/Member sebagai SIMULASI. Total = Total revenue (tanpa transaksi tambahan). */
  const REVENUE_CATEGORIES=[['Service','#095B32'],['Package','#E5A34B'],['Product','#B53F3E'],['Gift Card','#AEC363'],['Member','#65839E']];
  const hashRef=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))>>>0;return h;};
  A.revenueCategory=row=>{
    const given=row?.values?.revenueCategory;
    if(REVENUE_CATEGORIES.some(c=>c[0]===given))return {category:given,simulated:false};
    if(row?.values?.category==='Retail')return {category:'Product',simulated:false};
    const b=hashRef(row?.values?.invoiceRef||row?.id)%20;
    return {category:b<12?'Service':b<16?'Package':b<19?'Gift Card':'Member',simulated:true};
  };
  function revenueCategoryChart(rows){
    const amt=x=>n(x.values.amount),tagged=rows.map(x=>({row:x,...A.revenueCategory(x)}));
    const names=REVENUE_CATEGORIES.map(c=>c[0]);
    const values=names.map(cat=>rows.length?tagged.filter(t=>t.category===cat).reduce((a,t)=>a+amt(t.row),0):null);
    const counts=names.map(cat=>tagged.filter(t=>t.category===cat).length);
    return chart('revenue-composition','Revenue Category','donut','currency',names,[{name:'Revenue category',values}],{variant:'category',colors:REVENUE_CATEGORIES.map(c=>c[1]),centerLabel:'Total Revenue',counts,simulated:tagged.some(t=>t.simulated)});
  }
  A.model=id=>{
    const d=A.definitions.find(x=>x.id===id);if(!d)return {cards:[],charts:[],table:table([],[]),sourceCount:0,verifiedCount:0};
    if(!A.canViewDashboard(id))return {id,title:d.title,cards:[],charts:[],table:table([],[]),sourceCount:0,verifiedCount:0,accessDenied:true};
    const all=A.records(d.group,false),r=A.records(d.group,true),m={id,title:d.title,cards:[],charts:[],table:table([],[]),sourceCount:all.length,verifiedCount:r.length,sourceOwner:d.sourceOwner,sourceMode:d.sourceMode,definitionNote:'Rumus demo untuk uji alur. Kontrak metrik dan standar resmi belum ditetapkan.'};
    const v=(row,k)=>n(row.values[k]);
    const total=k=>sum(r,x=>v(x,k));
    if(id==='revenue'){
      const service=r.filter(x=>x.values.category==='Service'),retail=r.filter(x=>x.values.category==='Retail'),dates=new Set(r.map(x=>x.date)).size;
      m.cards=[card('total','Total revenue',r.length?total('amount'):null,'currency','higher'),card('service','Revenue service',r.length?sum(service,x=>v(x,'amount')):null,'currency','higher'),card('retail','Revenue retail',r.length?sum(retail,x=>v(x,'amount')):null,'currency','higher'),card('daily','Avg/day service',dates?sum(service,x=>v(x,'amount'))/dates:null,'currency','higher','Rerata hari dengan data demo; definisi hari operasional perlu kontrak.')];
      const trend=grouped(service,x=>x.date,rr=>sum(rr,x=>v(x,'amount')));
      m.charts=[chart('service-trend','Revenue service trend','line','currency',trend.keys,[{name:'Revenue service',values:trend.values}],{width:'full',direction:'higher',metricKey:'service'}),revenueCategoryChart(r),chart('revenue-outlet','Revenue by outlet','stacked','currency',outletSeries(r,()=>0).map(x=>x.label),['Service','Retail'].map(cat=>({name:cat,values:outletSeries(r,rr=>sum(rr.filter(x=>x.values.category===cat),x=>v(x,'amount'))).map(x=>x.value)})),{orientation:'horizontal',metricKey:'total',direction:'higher'})];
      const finance=A.records('finance');m.table=table([col('outlet','Outlet'),col('service','Service','currency'),col('retail','Retail','currency'),col('total','Total','currency'),col('target','Target demo','currency'),col('achievement','Pencapaian demo','percent')],outletSeries(r,rr=>rr).map(o=>{const amount=sum(o.value,x=>v(x,'amount')),target=sum(finance.filter(x=>x.outlet===o.id),x=>v(x,'revenueTarget'));return {outlet:o.label,service:sum(o.value.filter(x=>x.values.category==='Service'),x=>v(x,'amount')),retail:sum(o.value.filter(x=>x.values.category==='Retail'),x=>v(x,'amount')),total:amount,target:target||null,achievement:pct(amount,target)};}));
      m.outletCards=m.table.rows.map(row=>({outlet:row.outlet,label:row.outlet,actual:row.total,target:row.target,unit:'currency',achievement:row.achievement}));
    }else if(id==='pnl'){
      const rev=total('revenue'),expense=total('expense'),profit=rev-expense,target=total('profitTarget');
      m.cards=[card('revenue','Total revenue',r.length?rev:null,'currency','higher'),card('expense','Total expense',r.length?expense:null,'currency','range','Biaya lebih rendah tidak selalu lebih baik; bandingkan budget dan mutu layanan.'),card('profit','Net profit',r.length?profit:null,'currency','higher'),card('variance','Variance to target',r.length?profit-target:null,'currency','higher','Selisih laba aktual demo terhadap target laba demo.')];
      const os=outletSeries(r,rr=>sum(rr,x=>v(x,'revenue')-v(x,'expense'))),trend=grouped(r,x=>x.date.slice(0,7),rr=>sum(rr,x=>v(x,'revenue')-v(x,'expense')));
      m.charts=[chart('profit-contribution','Profit contribution','donut','currency',os.map(x=>x.label),[{name:'Net profit',values:os.map(x=>Math.max(0,x.value))}],{note:'Laba negatif tidak direpresentasikan sebagai luas donut; lihat tabel.'}),chart('profit-outlet','Profit by outlet','bar','currency',os.map(x=>x.label),['revenue','expense','profit'].map(k=>({name:{revenue:'Revenue',expense:'Expense',profit:'Net profit'}[k],values:outletSeries(r,rr=>sum(rr,x=>k==='profit'?v(x,'revenue')-v(x,'expense'):v(x,k))).map(x=>x.value)})),{metricKey:'profit',direction:'higher'}),chart('profit-trend','Net profit trend','line','currency',trend.keys,[{name:'Net profit',values:trend.values}],{width:'full',metricKey:'profit',direction:'higher'}),makeOutletChart('expense-outlet','Expense by outlet','donut','currency',r,rr=>sum(rr,x=>v(x,'expense')))];
      m.table=table([col('outlet','Outlet'),col('revenue','Revenue','currency'),col('expense','Total expense','currency'),col('profit','Net profit','currency'),col('advertising','Advertising & promotion','currency'),col('cleaning','Kebersihan','currency'),col('electricity','Listrik','currency'),col('people','People usage · snapshot terakhir','percent'),col('maintenance','Maintenance','currency')],outletSeries(r,rr=>rr).map(o=>({outlet:o.label,revenue:sum(o.value,x=>v(x,'revenue')),expense:sum(o.value,x=>v(x,'expense')),profit:sum(o.value,x=>v(x,'revenue')-v(x,'expense')),advertising:sum(o.value,x=>v(x,'advertising')),cleaning:sum(o.value,x=>v(x,'cleaning')),electricity:sum(o.value,x=>v(x,'electricity')),people:o.value.length?v(o.value.slice().sort((a,b)=>b.date.localeCompare(a.date))[0],'peopleUsagePercent'):null,maintenance:sum(o.value,x=>v(x,'maintenance'))})));
    }else if(id==='capacity'){
      const revenue=A.records('revenue').filter(x=>x.values.category==='Service'),days=new Set(r.map(x=>x.date)).size;
      m.cards=[card('room-revenue','Room revenue',r.length?sum(revenue,x=>v(x,'amount')):null,'currency','higher'),card('daily-utility','Avg utility/day',days?total('therapistMinutes')/60/days:null,'hours','range','Total jam layanan per hari dengan data; bukan persentase okupansi.'),card('person-utility','Avg utility/person',total('therapistCount')?total('therapistMinutes')/60/total('therapistCount'):null,'hours','range','Jam layanan per therapist-shift.'),card('absence','Absensi karyawan',r.length?total('absenceCount'):null,'number','lower','Kejadian tidak hadir demo; definisi izin/sakit/cuti menunggu kontrak HRD.')];
      const categories=grouped(revenue,x=>x.values.roomType,rr=>sum(rr,x=>v(x,'amount')));
      m.charts=[chart('room-category','Room revenue by category','bar','currency',categories.keys,[{name:'Revenue',values:categories.values}],{orientation:'horizontal'}),makeOutletChart('utility-composition','Utility composition','donut','hours',r,rr=>sum(rr,x=>v(x,'therapistMinutes'))/60),makeOutletChart('absence-composition','Absensi composition','donut','number',r,rr=>sum(rr,x=>v(x,'absenceCount'))),makeOutletChart('room-outlet','Room revenue by outlet','bar','currency',revenue,rr=>sum(rr,x=>v(x,'amount')),{direction:'higher'})];
      m.table=table([col('outlet','Outlet'),col('hours','Jam layanan','hours'),col('utilization','Utilisasi ruang','percent'),col('absence','Tidak hadir','number')],outletSeries(r,rr=>rr).map(o=>({outlet:o.label,hours:sum(o.value,x=>v(x,'therapistMinutes'))/60,utilization:pct(sum(o.value,x=>v(x,'roomMinutes')),sum(o.value,x=>v(x,'availableRoomMinutes'))),absence:sum(o.value,x=>v(x,'absenceCount'))})));
    }else if(id==='waste'){
      const waste=r.filter(x=>x.values.kind==='Waste'),stock=r.filter(x=>x.values.kind==='Stock opname'),value=rr=>sum(rr,x=>v(x,'quantity')*v(x,'unitCost')),accuracy=pct(stock.filter(x=>v(x,'systemQty')===v(x,'countedQty')).length,stock.length);
      m.cards=[card('total-waste','Total waste',r.length?value(waste):null,'currency','lower'),card('bhp','Waste BHP',r.length?value(waste.filter(x=>x.values.category==='BHP')):null,'currency','lower'),card('retail','Waste retail',r.length?value(waste.filter(x=>x.values.category==='Retail')):null,'currency','lower'),card('accuracy','Stock accuracy',accuracy,'percent','higher','Proporsi baris stock opname yang tepat. Rumus resmi harus disepakati Inventory.')];
      const months=[...new Set(waste.map(x=>x.date.slice(0,7)))].sort(),byMonth=months.length>1;
      const dates=[...new Set(waste.map(x=>byMonth?x.date.slice(0,7):x.date))].sort();
      m.charts=[chart('waste-trend','Waste trend','bar','currency',dates,['BHP','Retail'].map(cat=>({name:'Waste '+cat,values:dates.map(date=>value(waste.filter(x=>(byMonth?x.date.slice(0,7):x.date)===date&&x.values.category===cat)))})),{direction:'lower',metricKey:'total-waste'}),chart('waste-ytd','Waste percentage · selected months','donut','currency',months,[{name:'Waste',values:months.map(month=>value(waste.filter(x=>x.date.startsWith(month))))}],{note:'Distribusi nilai waste per bulan pada periode terpilih; YTD jika filter dimulai 1 Januari.'}),makeOutletChart('accuracy-outlet','Stock accuracy by outlet','bar','percent',stock,rr=>pct(rr.filter(x=>v(x,'systemQty')===v(x,'countedQty')).length,rr.length),{direction:'higher',metricKey:'accuracy'})];
      m.table=table([col('date','Tanggal'),col('outlet','Outlet'),col('kind','Jenis'),col('item','Item'),col('waste','Nilai waste','currency'),col('system','Qty sistem','number'),col('physical','Qty fisik','number'),col('reference','Source ID')],r.map(x=>({date:x.date,outlet:short(x.outlet),kind:x.values.kind,item:x.values.item,waste:x.values.kind==='Waste'?v(x,'quantity')*v(x,'unitCost'):null,system:x.values.kind==='Stock opname'?v(x,'systemQty'):null,physical:x.values.kind==='Stock opname'?v(x,'countedQty'):null,reference:x.id})));
      const sales=A.records('revenue'),stockMonths=[...new Set(stock.map(x=>x.date.slice(0,7)))].sort();
      m.tables=[{title:'Tracking waste table',...table([col('month','Bulan'),col('service','Revenue service','currency'),col('bhp','Waste BHP','currency'),col('retail','Revenue retail','currency'),col('retailWaste','Waste retail','currency')],months.map(month=>({month,service:sales.length?sum(sales.filter(x=>x.date.startsWith(month)&&x.values.category==='Service'),x=>v(x,'amount')):null,bhp:value(waste.filter(x=>x.date.startsWith(month)&&x.values.category==='BHP')),retail:sales.length?sum(sales.filter(x=>x.date.startsWith(month)&&x.values.category==='Retail'),x=>v(x,'amount')):null,retailWaste:value(waste.filter(x=>x.date.startsWith(month)&&x.values.category==='Retail'))})))},{title:'Accuracy stock opname table',...table([col('month','Bulan'),col('target','Target resmi','percent'),col('accuracy','Actual accuracy demo','percent'),col('matched','Baris sesuai','number'),col('checked','Baris diperiksa','number')],stockMonths.map(month=>{const rr=stock.filter(x=>x.date.startsWith(month)),matched=rr.filter(x=>v(x,'systemQty')===v(x,'countedQty')).length;return {month,target:null,accuracy:pct(matched,rr.length),matched,checked:rr.length};}))}];
    }else if(id==='reviews'||id==='satisfaction'){
      const online=r.filter(x=>x.values.channel==='Online'),offline=r.filter(x=>x.values.channel==='Offline'),happy=r.filter(x=>x.values.satisfaction==='Puas'),unhappy=r.filter(x=>x.values.satisfaction==='Tidak puas');
      if(id==='reviews'){
        m.cards=[card('online','Online review',r.length?online.length:null,'number','higher'),card('offline','Offline review',r.length?offline.length:null,'number','higher'),card('offline-satisfaction','Offline satisfaction',pct(offline.filter(x=>x.values.satisfaction==='Puas').length,offline.length),'percent','higher',offline.filter(x=>x.values.satisfaction==='Puas').length+' dari '+offline.length+' feedback offline menyatakan puas.'),card('offline-complaint','Offline dissatisfied feedback',r.length?offline.filter(x=>x.values.satisfaction==='Tidak puas').length:null,'number','lower','Feedback tidak puas belum tentu kasus komplain; kasus memiliki ID sendiri.')];
        const trend=grouped(r,x=>x.date,rr=>rr.length),sources=grouped(online,x=>x.values.platform,rr=>rr.length);
        m.charts=[chart('feedback-trend','Feedback received trend','line','number',trend.keys,[{name:'Feedback',values:trend.values}],{width:'full'}),makeOutletChart('online-outlet','Percentage feedback online','donut','number',online,rr=>rr.length),chart('rating-distribution','Rating (all reviews)','bar','number',['5 star','4 star','3 star','2 star','1 star'],[{name:'Reviews',values:[5,4,3,2,1].map(star=>r.filter(x=>v(x,'rating')===star).length)}]),makeOutletChart('offline-outlet','Percentage feedback offline','donut','number',offline,rr=>rr.length),chart('review-source','Source of review','donut','number',sources.keys,[{name:'Reviews',values:sources.values}])];
      }else{
        m.cards=[card('satisfaction','Customer satisfaction',pct(happy.length,r.length),'percent','higher'),card('complaint','Percentage complaint',pct(unhappy.length,r.length),'percent','lower','Demo: feedback Tidak puas / seluruh feedback. Berbeda dengan rate kasus komplain; '+unhappy.length+' feedback tidak puas.'),card('rating','Satisfaction rate',avg(r,x=>v(x,'rating')),'rating','higher','Demo: rata-rata bintang dari feedback; skala 1–5.'),card('complaint-rate','Complaint rate',null,'number','lower','Blok sumber dipertahankan. Rumus dan satuan field Complaint rate pada Looker belum terverifikasi; tidak disamakan dengan hitungan kasus atau selisih bintang.')];
        const os=outletSeries(r,rr=>rr);
        m.charts=[chart('stars-outlet','Star achievement by outlet','bar','number',os.map(x=>x.label),[5,4,3,2,1].map(star=>({name:star+' star',values:os.map(o=>o.value.filter(x=>v(x,'rating')===star).length)})),{width:'full'}),chart('satisfy-complain','Satisfy vs dissatisfied feedback','bar','percent',os.map(x=>x.label),['Puas','Tidak puas'].map(s=>({name:s,values:os.map(o=>pct(o.value.filter(x=>x.values.satisfaction===s).length,o.value.length))})),{direction:'higher',metricKey:'satisfaction'}),makeOutletChart('satisfaction-contribution','Outlet contribution','donut','number',r,rr=>rr.length)];
      }
      m.table=table([col('date','Tanggal'),col('outlet','Outlet'),col('channel','Channel'),col('source','Sumber'),col('rating','Rating','rating'),col('satisfaction','Hasil'),col('reference','Source ID')],r.map(x=>({date:x.date,outlet:short(x.outlet),channel:x.values.channel,source:x.values.platform,rating:v(x,'rating'),satisfaction:x.values.satisfaction,reference:x.id})));
    }else if(id==='retention'){
      const ids=[...new Set(r.map(x=>x.values.customerRef))],repeats=new Set(r.filter(x=>x.values.segment==='Repeat').map(x=>x.values.customerRef)),totalCustomers=ids.length;
      m.cards=[card('total','Total customer',r.length?totalCustomers:null),card('new','New customer',r.length?ids.filter(x=>!repeats.has(x)).length:null),card('repeat','Repeat customer',r.length?repeats.size:null,'number','higher'),card('rate','Customer repeat rate',pct(repeats.size,totalCustomers),'percent','higher','Repeat customer / unique customer. Tidak sama dengan rebooking conversion.')];
      m.charts=[makeOutletChart('customer-outlet','Customer count by outlet','bar','number',r,rr=>new Set(rr.map(x=>x.values.customerRef)).size),makeOutletChart('repeat-contribution','Contribution repeat customer','donut','number',r,rr=>new Set(rr.filter(x=>x.values.segment==='Repeat').map(x=>x.values.customerRef)).size)];
      m.table=table([col('outlet','Outlet'),col('month','Periode'),col('guests','Guest count','number'),col('new','New guest','number'),col('repeat','Repeater','number'),col('rate','Repeat rate','percent')],outletSeries(r,rr=>rr).map(o=>{const ids=new Set(o.value.map(x=>x.values.customerRef)),repeat=new Set(o.value.filter(x=>x.values.segment==='Repeat').map(x=>x.values.customerRef));return {outlet:o.label,month:(H.ui.analyticsFrom||'2026-10-01').slice(0,7),guests:ids.size,new:ids.size-repeat.size,repeat:repeat.size,rate:pct(repeat.size,ids.size)};}));
    }else if(id==='complaints'){
      const resolved=r.filter(x=>x.values.state==='Resolved'&&mins(x.values.openedAt,x.values.resolvedAt)!==null),fast=resolved.filter(x=>mins(x.values.openedAt,x.values.resolvedAt)<=1440),late=resolved.filter(x=>mins(x.values.openedAt,x.values.resolvedAt)>1440);
      m.cards=[card('total','Total complaints',r.length?r.length:null,'number','lower'),card('within','Resolved ≤24 hours',r.length?fast.length:null,'number','higher','Batas demo menggunakan ≤24; sumber menulis <24. Kontrak batas perlu konfirmasi.'),card('over','Resolved >24 hours',r.length?late.length:null,'number','lower'),card('time','Avg resolved time',avg(resolved,x=>mins(x.values.openedAt,x.values.resolvedAt)/60),'hours','lower','Kasus terbuka dikecualikan dari rerata resolusi dan tetap terlihat di tabel.')];
      const os=outletSeries(r,rr=>rr),sources=grouped(r,x=>x.values.platform,rr=>rr.length);
      m.charts=[chart('handling-outlet','Complaint handling by outlet','stacked','number',os.map(x=>x.label),[{name:'Resolved ≤24 h',values:os.map(o=>o.value.filter(x=>fast.includes(x)).length)},{name:'Resolved >24 h',values:os.map(o=>o.value.filter(x=>late.includes(x)).length)},{name:'Open / in progress',values:os.map(o=>o.value.filter(x=>!resolved.includes(x)).length)}],{orientation:'horizontal'}),makeOutletChart('complaint-contribution','Complaint contribution','donut','number',r,rr=>rr.length),chart('complaint-source','Complaint by source','donut','number',sources.keys,[{name:'Cases',values:sources.values}])];
      m.table=table([col('case','Case ID'),col('outlet','Outlet'),col('platform','Sumber'),col('state','Status'),col('hours','Waktu resolusi','hours'),col('result','SLA demo')],r.map(x=>{const h=mins(x.values.openedAt,x.values.resolvedAt);return {case:x.values.caseRef,outlet:short(x.outlet),platform:x.values.platform,state:x.values.state,hours:h===null?null:h/60,result:x.values.state!=='Resolved'?'Belum selesai':h<=1440?'≤24 jam':'>24 jam'};}));
    }else if(id==='tripadvisor'){
      const latest=latestByOutlet(r);m.cards=[card('rank','Avg Tripadvisor rank',avg(latest,x=>v(x,'rank')),'number','lower','Peringkat lebih kecil lebih baik; snapshot terakhir tiap outlet dalam periode.'),card('rating','Average rating',avg(latest,x=>v(x,'rating')),'rating','higher','Rerata rating outlet pada snapshot terakhir; bukan rerata semua review individual.')];
      m.charts=[makeOutletChart('review-contribution','Review count contribution','donut','number',latest,rr=>sum(rr,x=>v(x,'reviewCount'))),chart('rank-outlet','Tripadvisor rank by outlet','bar','number',latest.map(x=>short(x.outlet)),[{name:'Rank (lower is better)',values:latest.map(x=>v(x,'rank'))}],{orientation:'horizontal',width:'full',direction:'lower',metricKey:'rank'}),chart('rating-outlet','Tripadvisor rating by outlet','bar','rating',latest.map(x=>short(x.outlet)),[{name:'Rating',values:latest.map(x=>v(x,'rating'))}],{direction:'higher',metricKey:'rating'})];
      m.table=table([col('outlet','Outlet'),col('date','Snapshot'),col('rank','Peringkat','number'),col('rating','Star rate','rating'),col('reviews','Jumlah review','number')],latest.map(x=>({outlet:short(x.outlet),date:x.date,rank:v(x,'rank'),rating:v(x,'rating'),reviews:v(x,'reviewCount')})));
    }else if(id==='maintenance'){
      const responded=r.filter(x=>mins(x.values.openedAt,x.values.respondedAt)!==null),states=grouped(r,x=>x.values.state,rr=>rr.length),categories=grouped(r,x=>x.values.category,rr=>rr.length),months=[...new Set(r.map(x=>x.date.slice(0,7)))].sort();
      m.cards=[card('total','Total maintenance',r.length?r.length:null),card('response','Response time',avg(responded,x=>mins(x.values.openedAt,x.values.respondedAt)/60),'hours','lower','Waktu laporan ke respons pertama. Bukan waktu penyelesaian.'),card('open','Open / reschedule',r.length?r.filter(x=>x.values.state!=='Done').length:null,'number','lower'),card('completed','Completion rate',pct(r.filter(x=>x.values.state==='Done').length,r.length),'percent','higher')];
      m.charts=[chart('maintenance-status','Report status contribution','donut','number',states.keys,[{name:'Tickets',values:states.values}]),makeOutletChart('maintenance-outlet','Report contribution by outlet','donut','number',r,rr=>rr.length),chart('maintenance-category','Maintenance issue by category and month','bar','number',months,categories.keys.map(category=>({name:category,values:months.map(month=>r.filter(x=>x.date.startsWith(month)&&x.values.category===category).length)})),{width:'full'})];
      m.table=table([col('ticket','Ticket ID'),col('outlet','Outlet'),col('category','Kategori'),col('state','Status'),col('response','Response time','hours')],r.map(x=>({ticket:x.values.ticketRef,outlet:short(x.outlet),category:x.values.category,state:x.values.state,response:mins(x.values.openedAt,x.values.respondedAt)===null?null:mins(x.values.openedAt,x.values.respondedAt)/60})));
    }else if(id==='grading'){
      const weighted=total('weight')?sum(r,x=>v(x,'progress')*v(x,'weight'))/total('weight'):null,phases=grouped(r,x=>x.values.phase,rr=>sum(rr,x=>v(x,'progress')*v(x,'weight'))/sum(rr,x=>v(x,'weight')));
      m.cards=[card('progress','Progress program',weighted,'percent','higher','Rerata progress berbobot dari tahapan terverifikasi.'),card('done','Tahapan selesai',r.length?r.filter(x=>v(x,'progress')===100).length:null),card('ongoing','Tahapan berjalan',r.length?r.filter(x=>v(x,'progress')<100).length:null)];
      m.charts=[chart('grading-status','Status program','donut','number',['Selesai','Proses'],[{name:'Tahapan',values:[r.filter(x=>v(x,'progress')===100).length,r.filter(x=>v(x,'progress')<100).length]}]),chart('grading-phase','Progress per tahapan','bar','percent',phases.keys,[{name:'Progress',values:phases.values}],{orientation:'horizontal',direction:'higher',metricKey:'progress'})];
      m.table=table([col('milestone','Tahapan kerja'),col('outlet','Outlet'),col('grade','Grade fokus'),col('pic','PIC'),col('weight','Bobot relatif','number'),col('progress','Progress','percent'),col('phase','Tahap')],r.map(x=>({milestone:x.values.milestone,outlet:short(x.outlet),grade:x.values.grade,pic:x.values.pic,weight:v(x,'weight'),progress:v(x,'progress'),phase:x.values.phase})));
    }else if(id==='competency'){
      const latest=[...new Map(r.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(x=>[x.values.employeeRef+'|'+x.values.instrument,x])).values()];
      const score=rr=>pct(sum(rr,x=>v(x,'achieved')),sum(rr,x=>v(x,'possible')));
      m.cards=[card('employees','Total karyawan dinilai',latest.length?new Set(latest.map(x=>x.values.employeeRef)).size:null),card('capability','Indeks kapabilitas',score(latest),'percent','higher'),...['therapist','reception','attendant'].map(dept=>card('score-'+dept,'Score '+{therapist:'therapist',reception:'front office',attendant:'attendant'}[dept],score(latest.filter(x=>x.values.department===dept)),'percent','higher'))];
      m.charts=[makeOutletChart('competency-outlet','Indeks kapabilitas by outlet','bar','percent',latest,score,{direction:'higher',metricKey:'capability'}),chart('competency-team','Competency by department','bar','percent',['Therapist','Front Office','Attendant'],[{name:'Score',values:['therapist','reception','attendant'].map(dept=>score(latest.filter(x=>x.values.department===dept)))}],{direction:'higher',metricKey:'capability'})];
      m.table=table([col('employee','Employee ID demo'),col('outlet','Outlet'),col('dept','Departemen'),col('instrument','Instrumen'),col('score','Score','percent')],latest.map(x=>({employee:x.values.employeeRef,outlet:short(x.outlet),dept:x.values.department,instrument:x.values.instrument,score:pct(v(x,'achieved'),v(x,'possible'))})));
    }else if(id==='grooming'){
      const checked=r.filter(x=>x.values.checkStatus!=='Belum diperiksa'),passed=r.filter(x=>x.values.checkStatus==='Sesuai');
      m.cards=[card('checked','Grooming check',r.length?checked.length:null),card('not-executed','Not executed',r.length?r.length-checked.length:null,'number','lower'),card('compliance','Grooming compliance',pct(passed.length,checked.length),'percent','higher','Lulus / pemeriksaan terlaksana. Pemeriksaan belum dilakukan ditampilkan terpisah.'),card('coverage','Check coverage',pct(checked.length,r.length),'percent','higher')];
      const dates=[...new Set(r.map(x=>x.date))].sort(),os=outletSeries(r,rr=>rr);
      m.charts=[chart('grooming-trend','Daily grooming compliance trend','line','number',dates,[{name:'Terlaksana',values:dates.map(date=>checked.filter(x=>x.date===date).length)},{name:'Belum diperiksa',values:dates.map(date=>r.filter(x=>x.date===date&&x.values.checkStatus==='Belum diperiksa').length)}],{width:'full'}),chart('grooming-outlet','Grooming compliance by outlet','bar','number',os.map(x=>x.label),['Sesuai','Perlu perbaikan','Belum diperiksa'].map(state=>({name:state,values:os.map(o=>o.value.filter(x=>x.values.checkStatus===state).length)}))),makeOutletChart('grooming-contribution','Compliant checks contribution by outlet','donut','number',passed,rr=>rr.length,{note:'Donut menunjukkan kontribusi jumlah pemeriksaan lulus, bukan perbandingan tingkat kepatuhan.'})];
      m.table=table([col('date','Tanggal'),col('outlet','Outlet'),col('employee','Employee ID demo'),col('dept','Departemen'),col('status','Hasil'),col('reference','Source ID')],r.map(x=>({date:x.date,outlet:short(x.outlet),employee:x.values.employeeRef,dept:x.values.department,status:x.values.checkStatus,reference:x.id})));
    }else if(id==='process'){
      const latest=[...new Map(r.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(x=>[x.values.documentRef,x])).values()],approved=latest.filter(x=>x.values.state==='Approved');
      m.cards=[card('documents','Total document',latest.length?latest.length:null),card('approved','Approved rate',pct(approved.length,latest.length),'percent','higher',approved.length+' dokumen approved dari '+latest.length+' dokumen terverifikasi.'),card('processed','Processed',latest.length?latest.length-approved.length:null,'number','lower')];
      const docs=grouped(latest,x=>x.values.title,rr=>rr.length),deps=['reception','therapist','attendant','security','management'];
      m.charts=[chart('document-contribution','Document contribution','donut','number',docs.keys,[{name:'Dokumen',values:docs.values}]),chart('process-role','Business process completion by role','bar','number',deps.map(d=>({reception:'Front Office',therapist:'Therapist',attendant:'Attendant',security:'Security',management:'Management'}[d])),['Approved','Processed'].map(state=>({name:state,values:deps.map(dep=>latest.filter(x=>x.values.department===dep&&x.values.state===state).length)})))];
      m.table=table([col('document','Document ID'),col('title','Bisnis proses'),col('outlet','Outlet'),col('state','Status'),col('year','Tahun'),col('version','Versi'),col('department','Pemilik')],latest.map(x=>({document:x.values.documentRef,title:x.values.title,outlet:short(x.outlet),state:x.values.state,year:x.values.year,version:x.values.version,department:x.values.department})));
    }
    if(!r.length){m.cards=m.cards.map(c=>({...c,value:null}));m.charts=m.charts.map(c=>({...c,categories:[],series:c.series.map(s=>({...s,values:[]}))}));m.table.rows=[];if(m.tables)m.tables.forEach(t=>t.rows=[]);if(m.outletCards)m.outletCards=[];}
    return m;
  };
  A.ensure();
})();
