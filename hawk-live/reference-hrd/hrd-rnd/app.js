const get = id => document.getElementById(id);
const main = get('main');
const nav = get('nav');
const detail = get('detail');
const role = get('role');
const manager = () => role.value === 'Manager HRD';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));
const rupiah = value => 'Rp ' + new Intl.NumberFormat('id-ID').format(value);
const employees = seedRoster();
const pending = 'Menunggu Persetujuan';
const requests = [
  {name:'Ayu Pradipta', type:'Koreksi presensi', date:'13 Nov 2026', status:pending, note:'Simulasi koreksi jam masuk dari 09.15 ke 09.00.'},
  {name:'Made Pradipta', type:'Cuti Tahunan', date:'13 Nov 2026', status:pending, note:'Simulasi pengajuan cuti satu hari.'},
  {name:'Komang Pradipta', type:'Lembur', date:'12 Nov 2026', status:'Disetujui', note:'Simulasi penutupan jadwal dua jam.'}
];
const changes = new Map();
const payStatus = new Map();
const events = [];
const leaveTypes = ['Cuti Tahunan','Cuti Khusus','Sakit','Izin','Cuti Tidak Dibayar','Cuti Libur Nasional'];
const period = '26 Okt – 25 Nov 2026';
let path = ['Beranda'];
let expanded = '';
let tab = '';
let statusFilter = '';
let actions = [];

function restricted(parts) {
  return parts[0] === 'Payroll' || parts[0] === 'Laporan' ||
    (parts[0] === 'Pengaturan' && ['Payroll','Pengaturan Layout','Template Export'].some(item => parts.includes(item)));
}

function go(...parts) {
  path = parts;
  expanded = parts[0];
  tab = '';
  statusFilter = '';
  get('sidebar').classList.remove('open');
  render();
  window.scrollTo(0,0);
}

function button(label, action, classes = 'action', attrs = '') {
  return '<button class="' + classes + '" data-action="' + (actions.push(action)-1) + '" ' + attrs + '>' + esc(label) + '</button>';
}

function modal(title, body) {
  detail.innerHTML = '<form method="dialog"><button class="action close" aria-label="Tutup">×</button></form><small>DATA DUMMY</small><h2 id="dialog-title">' + esc(title) + '</h2>' + body;
  detail.setAttribute('aria-labelledby','dialog-title');
  if (!detail.open) detail.showModal();
}

function fields(data) {
  return '<dl>' + Object.entries(data).map(([label,value]) =>
    '<dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd>').join('') + '</dl>';
}

function tabs(items, initial = items[0]) {
  if (!items.includes(tab)) tab = initial;
  return '<div class="tools" aria-label="Tampilan">' + items.map(item =>
    button(item, () => { tab = item; statusFilter = ''; render(); }, 'action' + (tab === item ? ' primary' : ''), 'aria-pressed="' + (tab === item) + '"')).join('') + '</div>';
}

function table(title, columns, rows, tools = '') {
  const statuses = [...new Set(rows.map(row => row.status).filter(Boolean))];
  return '<section class="panel"><h2>' + esc(title) + '</h2><div class="tools"><input data-table-search type="search" aria-label="Cari data" placeholder="Cari data…">' +
    (statuses.length ? '<select data-table-filter aria-label="Filter status"><option value="">Semua status</option>' +
      statuses.map(s => '<option' + (s === statusFilter ? ' selected' : '') + '>' + esc(s) + '</option>').join('') + '</select>' : '') + tools +
    '</div><div class="table-wrap"><table><thead><tr>' + columns.map(c => '<th scope="col">' + esc(c) + '</th>').join('') +
    '</tr></thead><tbody>' + rows.map(row => '<tr data-status="' + esc(row.status) + '">' + row.cells.map((cell,i) =>
      '<td>' + (i === 0 ? button(cell,row.open,'record') : cell === row.status ? '<span class="status">' + esc(cell) + '</span>' : esc(cell)) + '</td>').join('') +
    '</tr>').join('') + '</tbody></table></div><p data-table-empty hidden>Data tidak ditemukan.</p></section>';
}

function employeeDetail(e, section) {
  if (section === 'Payroll' && !manager()) return;
  const sections = {
    'Informasi Pribadi': {'ID karyawan':e.id,'Identitas simulasi':'ID-' + e.id,'Unit':e.team,'Jabatan':e.job},
    'Kontak': {'Email':e.email,'Telepon':'DEMO-000','Domisili':'Alamat simulasi Bali','Kontak darurat':'Kontak simulasi'},
    'Kepegawaian': {'Unit':e.team,'Divisi':e.division||'—','Jabatan':e.job,'Shift':e.shift||'—','Level':e.level||'—','Status':e.contract,'Tanggal bergabung':'01 Mar 2025','Evaluasi kontrak':'01 Mar 2027'},
    'Payroll': {'Grup slip':'Slip Gaji Karyawan','Status pajak':'Demo TK/0','BPJS':'Registrasi dummy','Bank':'Bank Demo','Take-home pay dummy':rupiah(e.pay||3000000)},
    'Login ESS': {'Akun':e.email,'Peran':'Employee','Login terakhir':'13 Nov 2026 · 08.45 WITA'}
  };
  modal(e.name, '<div class="tools">' + Object.keys(sections).filter(s => s !== 'Payroll' || manager()).map(s =>
    button(s, () => employeeDetail(e,s),'action' + (section === s ? ' primary' : ''))).join('') + '</div>' + fields(sections[section]));
}

function employeesView() {
  const switches = tabs(['Informasi Pribadi','Kontak','Kepegawaian',...(manager()?['Payroll']:[]),'Login ESS']);
  const views = {
    'Informasi Pribadi':[['Nama','ID','Unit','Jabatan'],e=>[e.id,e.team,e.job]],
    'Kontak':[['Nama','Email','Domisili'],e=>[e.email,'Bali Demo']],
    'Kepegawaian':[['Nama','Unit','Jabatan','Status kontrak'],e=>[e.team,e.job,e.contract]],
    'Payroll':[['Nama','Grup slip','Status pajak','Bank'],()=>['Slip Gaji Karyawan','Demo TK/0','Bank Demo']],
    'Login ESS':[['Nama','Email login','Peran'],e=>[e.email,'Employee']]
  };
  const [columns, values] = views[tab];
  return switches + table('Direktori karyawan',columns,employees.map(e=>({
    cells:[e.name,...values(e)], open:()=>employeeDetail(e,tab)
  })),button('+ Tambah karyawan demo',addEmployee,'action primary'));
}

function addEmployee() {
  const name = 'Karyawan Demo ' + (employees.length+1);
  modal('Tambah karyawan demo',fields({'Nama':name,'Unit':'Kantor Demo','Jabatan':'Administrasi'}) +
    button('Simpan data dummy',()=>{
      const id = 'DEMO-' + (101+employees.length);
      employees.push({name,id,team:'Kantor Demo',job:'Administrasi',contract:'PKWT',attendance:'Belum Ada Status',email:id.toLowerCase()+'@example.invalid'});
      events.unshift('Karyawan dummy ditambahkan · ' + name);
      detail.close();
      render();
    },'action primary'));
}

function approvalView(presence = false) {
  const switches = tabs([pending,'Disetujui','Ditolak','Semua']);
  const rows = requests.filter(r => (!presence || r.type === 'Koreksi presensi') && (tab === 'Semua' || r.status === tab));
  return switches + table('Daftar pengajuan',['Nama','Tipe','Tanggal kegiatan','Status'],rows.map(r=>({
    cells:[r.name,r.type,r.date,r.status],status:r.status,open:()=>requestDetail(r)
  })));
}

function requestDetail(r) {
  modal(r.name,fields({'Tipe pengajuan':r.type,'Tanggal kegiatan':r.date,'Keterangan':r.note,'Progress persetujuan':r.status,'Jejak aktivitas':r.actor || 'Diajukan dalam simulasi'}) +
    (r.status === pending ? '<div class="tools">' + ['Disetujui','Ditolak'].map(status =>
      button(status === 'Disetujui' ? 'Setujui demo' : 'Tolak demo',()=>{
        r.status = status;
        r.actor = role.value;
        events.unshift(r.type + ' · ' + status + ' · ' + r.name);
        detail.close();
        render();
      },'action' + (status === 'Disetujui' ? ' primary' : ''))).join('') + '</div>' : ''));
}

function attendanceView(section) {
  const switches = section === 'Presensi' ? tabs(['Harian','Ringkasan']) :
    section === 'Jadwal Kerja' ? tabs(['Jadwal Tetap','Jadwal Shift']) : tabs(['Riwayat','Ringkasan']);
  const date = '<input type="date" id="attendance-date" aria-label="Tanggal kehadiran" value="2026-11-13">';
  return switches + table(section,['Nama','Unit','Jadwal','Status'],employees.map((e,i)=>({
    cells:[e.name,e.team,i%2 ? 'Shift Siang' : 'Shift Pagi',e.attendance],status:e.attendance,
    open:()=>modal(e.name,fields({
      'Tanggal':get('attendance-date').value,'ID karyawan':e.id,'Unit':e.team,'Jabatan':e.job,
      'Masuk':e.attendance==='Cuti'?'—':e.attendance==='Terlambat'?'09.17 WITA':'08.55 WITA',
      'Keluar':e.attendance==='Cuti'?'—':'17.00 WITA','Istirahat':'12.00–13.00 WITA','Lembur':'0 menit',
      'Validasi':'Lokasi simulasi','Keterlambatan':e.attendance==='Terlambat'?'17 menit':'0 menit'
    }) + button('Lihat pelacakan demo',()=>{detail.close();go('Pelacakan Lokasi');}))
  })),date);
}

function leaveView() {
  const switches = tabs(leaveTypes);
  return switches + table('Saldo dan pengajuan',['Nama','Hak cuti','Terpakai','Sisa'],employees.map((e,i)=>({
    cells:[e.name,'12 hari',i+' hari',(12-i)+' hari'],
    open:()=>modal(e.name,fields({'Kategori':tab,'Periode':'2026','Hak cuti':'12 hari','Sisa':(12-i)+' hari'}) +
      button('Buka antrean pengajuan',()=>{detail.close();go('Approval');}))
  })),button('+ Tambah pengajuan demo',()=>{
    const r = {name:employees[0].name,type:tab,date:'16 Nov 2026',status:pending,note:'Pengajuan dummy satu hari.'};
    modal('Tambah pengajuan',fields({'Karyawan':r.name,'Jenis':r.type,'Tanggal':r.date}) +
      button('Ajukan demo',()=>{requests.push(r);detail.close();go('Approval');},'action primary'));
  },'action primary'));
}

function payroll() {
  const types = ['Slip Gaji Karyawan','Slip Gaji'];
  return '<section class="hero"><small>AKSES MANAGER HRD</small><h2>Periode payroll demo</h2><p>' + period + '</p></section>' +
    table('Daftar slip',['Slip','Periode','Karyawan','Siap bayar'],types.map((type,i)=>{
      const people = employees.filter((_,n)=>n%2===i);
      return {cells:[type,period,people.length,people.filter(e=>payStatus.has(e.id)).length],
        open:()=>go('Payroll',type)};
    }),button('Generate payroll demo',()=>modal('Generate payroll demo',fields({'Periode':period,'Karyawan':employees.length})+
      button('Buat draf simulasi',()=>{events.unshift('Draf payroll demo dibuat');detail.close();go('Payroll',types[0]);},'action primary'))));
}

function slips(type) {
  return table(type,['Nama','Bank','Status pembayaran','Total demo'],employees.filter((_,i)=>i%2===(type==='Slip Gaji'?1:0)).map(e=>{
    const gross = (e.pay || 3000000) + 150000;
    const net = gross - 150000;
    const status = payStatus.get(e.id) || 'Belum Siap Bayar';
    return {cells:[e.name,'Bank Demo',status,rupiah(net)],status,open:()=>modal(e.name,
      fields({'Periode':period,'Slip':type,'Gaji pokok dummy':rupiah(gross-300000),'Tunjangan dummy':rupiah(300000),'Potongan dummy':rupiah(150000),'Gaji bersih dummy':rupiah(net),'Status':status})+
      (payStatus.has(e.id)?'':button('Tandai siap bayar (demo)',()=>{
        if (!manager()) return;
        payStatus.set(e.id,'Siap Bayar');
        detail.close();
        render();
      },'action primary')))};
  }));
}

function catalogue(groups, onOpen) {
  return '<div class="catalogue">' + Object.entries(groups).map(([group,items])=>
    '<section class="panel"><h2>' + esc(group) + '</h2><div class="list">' + items.map(item=>
      button(item+' →',()=>onOpen(group,item),'action')).join('') + '</div></section>').join('') + '</div>';
}

function reportView() {
  if (!path[1]) return catalogue(reports, (group,item)=>go('Laporan',group,item));
  return table(path[2],['Referensi','Periode','Status'],employees.map(e=>({
    cells:[e.name,period,'Simulasi'],status:'Simulasi',
    open:()=>modal(path[2],fields({'Karyawan':e.name,'ID':e.id,'Periode':period,'Kategori':path[1],'Sumber':'Dataset dummy R&D','Status':'Pratinjau laporan'}))
  })));
}

function settingsView() {
  const groups = Object.keys(settings).filter(group=>group!=='Payroll' || manager());
  const switches = tabs(groups);
  const items = settings[tab].filter(item=>manager() || !restricted(['Pengaturan',tab,item]));
  return switches + catalogue({[tab]:items},(group,item)=>{
    const key = group+'/'+item;
    const status = changes.get(key) || 'Draf';
    modal(item,fields({'Kategori':group,'Lingkungan':'HAWK HRD R&D','Status konfigurasi':status}) +
      button(status==='Draf'?'Aktifkan konfigurasi demo':'Kembalikan ke draf',()=>{
        changes.set(key,status==='Draf'?'Aktif dalam demo':'Draf');
        events.unshift('Konfigurasi simulasi diperbarui · ' + item);
        detail.close();
        render();
      },'action primary'));
  });
}

const sample = {
  'Pelacakan Lokasi':[['Sesi demo · Ubud','Selesai',{'Karyawan':'Ayu Pradipta','Titik awal':'Pos Demo A','Titik akhir':'Pos Demo B','Durasi':'32 menit','Validasi':'Simulasi tanpa GPS'}]],
  'Kunjungan Klien':[['Kunjungan Cakrawala','Selesai',{'Karyawan':'Ayu Pradipta','Klien':'Studio Cakrawala Demo','Lokasi':'Ubud Demo','Masuk':'10.05 WITA','Keluar':'10.42 WITA'}]],
  'Profil':[['Karier HAWK Demo','Draf',{'Judul':'Karier HAWK Demo','Halaman':'Profil perusahaan fiktif','Publikasi':'Internal R&D'}]],
  'Manajemen Rekrutmen':[['Rekrutmen Terapis Demo','Berjalan',{'Unit':'Ubud Demo','Tahap':'Wawancara','Kebutuhan':'2 orang'}]],
  'Lowongan Pekerjaan':[['Terapis Demo','Dibuka',{'Unit':'Ubud Demo','Kebutuhan':'2 orang','Batas pendaftaran':'30 Nov 2026'}]],
  'Kandidat':[['Awan Senja','Wawancara',{'Posisi':'Terapis Demo','Tahap':'Wawancara','Jadwal':'19 Nov 2026 · 10.00 WITA','Kontak':'kandidat-demo@example.invalid'}]],
  'Kasbon':[['KSB-DEMO-01',pending,{'Karyawan':'Bayu Arunika','Nominal dummy':'Rp 350.000','Cicilan dummy':'2 kali','Status':'Draf simulasi'}]],
  'Reimburse':[['RMB-DEMO-01',pending,{'Karyawan':'Nara Embun','Kategori':'Transportasi','Nominal dummy':'Rp 125.000','Bukti':'Lampiran simulasi'}]],
  'Timeline':[['Pengumuman orientasi','Diterbitkan',{'Tanggal':'13 Nov 2026','Kategori':'Pengumuman','Keterangan':'Orientasi fiktif untuk tim Ubud Demo.'}]],
  'Klien':[['Studio Cakrawala Demo','Aktif',{'Wilayah':'Ubud Demo','Kontak':'klien-demo@example.invalid','Kunjungan':'1 simulasi'}]],
  'Tugas':[['Tinjau jadwal orientasi','Berjalan',{'PIC':'Tara Pelangi','Tenggat':'18 Nov 2026','Checklist':'Jadwal, ruang, daftar peserta dummy'}]],
  'FAQ':[['Siapa yang dapat membuka Payroll?','Panduan',{'Jawaban':'Pilih Manager HRD pada peran demo untuk meninjau payroll fiktif.'}],
    ['Bagaimana mencoba persetujuan?','Panduan',{'Jawaban':'Buka Approval, pilih pengajuan, lalu pilih Setujui demo atau Tolak demo.'}]]
};

function sampleView(section) {
  let records = sample[section] || [];
  if (section==='Timeline') records = [...records,...events.filter(e=>!e.includes('payroll') && !e.startsWith('Konfigurasi')).map(e=>[e,'Simulasi',{'Aktivitas':e}])];
  return table(section,['Referensi','Status'],records.map(([label,status,data])=>({
    cells:[label,status],status,open:()=>modal(label,fields(data) +
      (section==='Klien'?button('Buka kunjungan',()=>{detail.close();go('Kehadiran','Kunjungan Klien');}):''))
  })));
}

function dashboard() {
  const metrics = [
    [employees.length,'Karyawan demo',['Karyawan']],
    [employees.filter(e=>e.attendance==='Hadir').length,'Hadir hari ini',['Kehadiran','Presensi']],
    [requests.filter(r=>r.status===pending).length,'Menunggu persetujuan',['Approval']],
    [1,'Lowongan terbuka',['Rekrutmen','Lowongan Pekerjaan']]
  ];
  const stats = {
    'Demografi':['Usia','Agama','Pendidikan','Jenis Kelamin','Status Perkawinan','Lama Kerja'],
    'Karyawan & kehadiran':['Jumlah Karyawan per Bulan','Jumlah Karyawan per Organisasi','Jumlah Karyawan Berdasarkan Status','Status Kehadiran Karyawan Hari Ini','Kehadiran Karyawan Hari Ini','Statistik Kehadiran Karyawan']
  };
  if(manager()) stats['Payroll']=['Total Gaji Karyawan','Gaji per Organisasi','Total Personalia Berdasarkan Gaji','Gaji per Komponen'];
  return '<div class="tools">'+['Tugas','Rekrutmen','Manpower Planning','9-Box Talent',...(manager()?['People Budgeting']:[])].map(name=>button(name+' →',()=>go(name))).join('')+button('Hapus data demo sesi',eraseDemo)+'</div><section class="hero"><small>JUMAT, 13 NOVEMBER 2026 · WITA</small><h2>Ruang kerja Human Resources</h2><p>' + esc(role.value) +
    ' · Pantau tim, presensi, dan pengajuan dari satu tempat.</p></section><section class="cards" aria-label="Ringkasan HRD">' +
    metrics.map(([value,label,parts])=>'<button class="metric" data-action="' + (actions.push(()=>go(...parts))-1) + '"><strong>'+value+'</strong>'+esc(label)+' ↗</button>').join('') +
    '</section><section class="panel"><h2>Pengajuan perlu ditinjau</h2><div class="list">' +
    requests.filter(r=>r.status===pending).map(r=>button(r.type+' · '+r.name+' →',()=>requestDetail(r))).join('') +
    button('Buka Approval →',()=>go('Approval')) + '</div></section>' +
    catalogue(stats,(group,item)=>{
      const payrollStat = group==='Payroll';
      const attendanceStat = /Kehadiran/.test(item);
      const data = payrollStat ? {'Periode':period,'Total fiktif':rupiah(29400000)} :
        attendanceStat ? Object.fromEntries([...new Set(employees.map(e=>e.attendance))].map(s=>[s,employees.filter(e=>e.attendance===s).length])) :
        {'Populasi demo':employees.length,'Unit demo':new Set(employees.map(e=>e.team)).size};
      modal(item,fields(data) + button('Lihat rincian',()=>{detail.close();go(...(payrollStat?['Payroll']:attendanceStat?['Kehadiran','Presensi']:['Karyawan']));}));
    });
}

function content() {
  const [group,section] = path;
  if(erased) return '<section class="panel"><h2>Data demo dikosongkan</h2><p>Muat ulang untuk memulai kembali dengan data contoh.</p></section>';
  if(group==='Tugas') return planner();
  if(group==='Rekrutmen' && (!section || section!=='Profil')) return recruitment(section);
  if(group==='Manpower Planning') return capacity();
  if(group==='People Budgeting') return budget();
  if(group==='9-Box Talent') return talent();
  if (restricted(path) && !manager()) return '<section class="panel"><h2>Akses khusus Manager HRD</h2><p>Gunakan peran Manager HRD untuk melihat simulasi payroll.</p></section>';
  if(group==='Beranda') return dashboard();
  if(group==='Kinerja & KPI' || group==='AmbideX & Race') return performanceView(group);
  if(group==='Karyawan') return employeesView();
  if(group==='Payroll') return section ? slips(section) : payroll();
  if(group==='Approval') return approvalView();
  if(group==='Laporan') return reportView();
  if(group==='Pengaturan') return settingsView();
  if(group==='Kehadiran'){
    if(section==='Approval Presensi') return approvalView(true);
    if(section==='Izin & Cuti') return leaveView();
    if(section==='Kunjungan Klien') return sampleView(section);
    return attendanceView(section || 'Presensi');
  }
  if(section || sample[group]) return sampleView(section || group);
  return catalogue({[group]:menus.find(([name])=>name===group)[2]},(_,item)=>go(group,item));
}

function filterRows(panel) {
  const query=panel.querySelector('[data-table-search]')?.value.trim().toLowerCase() || '';
  const status=panel.querySelector('[data-table-filter]')?.value || '';
  const rows=[...panel.querySelectorAll('tbody tr')];
  for(const row of rows)row.hidden=!row.textContent.toLowerCase().includes(query)||Boolean(status&&row.dataset.status!==status);
  const empty=panel.querySelector('[data-table-empty]');
  if(empty)empty.hidden=rows.some(row=>!row.hidden);
}

function render() {
  actions = [];
  nav.innerHTML = menus.map(([name,icon,children])=>{
    if(['Payroll','People Budgeting'].includes(name) && !manager()) return '';
    const current = path[0] === name;
    const open = children && expanded === name;
    const state = (current && !path[1] ? 'aria-current="page" ' : '') + (children?'aria-expanded="'+Boolean(open)+'"':'');
    return button(icon+'  '+name+(children?(open?'  ▾':'  ›'):''),()=>{
      if(open && current && !path[1]){expanded='';render();return;}
      go(name);
    },'parent',state) + (open?children.map(child=>button(child,()=>go(name,child),'child',
      path[1]===child?'aria-current="page"':'')).join(''):'');
  }).join('');
  const title = path.at(-1);
  main.innerHTML = '<div class="crumb">HAWK ERP / HRD / '+esc(path.join(' / '))+'</div><h1>'+esc(title)+'</h1>' + content();
  for(const search of main.querySelectorAll('[data-table-search]'))filterRows(search.closest('.panel'));
  wireJourney();
  get('budget-year')?.addEventListener('change',e=>{year=Number(e.target.value);render();});
  get('budget-scope')?.addEventListener('change',e=>{scope=e.target.value;render();});
}

document.addEventListener('click', event=>{
  const control = event.target.closest('[data-action]');
  if (control) actions[Number(control.dataset.action)]?.();
});
main.addEventListener('input',event=>{if(event.target.matches('[data-table-search]')) filterRows(event.target.closest('.panel'));});
main.addEventListener('change',event=>{if(event.target.matches('[data-table-filter]')) filterRows(event.target.closest('.panel'));});
role.addEventListener('change',()=>{
  if(detail.open) detail.close();
  if(restricted(path) && !manager()) go('Beranda');
  else render();
});
get('toggle').addEventListener('click',()=>get('sidebar').classList.toggle('open'));
get('brand').addEventListener('click',()=>modal('Portal HAWK ERP',fields({'Lingkungan':'R&D lokal'}) +
  button('Human Resources →',()=>{detail.close();go('Beranda');},'action primary')));
render();
bootCareer();
