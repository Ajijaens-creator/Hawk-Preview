const modules = [
  ['dashboard','◫','Command Center'],
  ['studio','✦','Content Studio','Brief|Produksi|Review|Terjadwal','Ritual pagi Ubud|Reels therapist|Foto treatment|Carousel wellness'],
  ['digital','↗','Digital Marketing','Google Search|Meta Ads|Retargeting','Search intent Ubud|Bali Reset|Abandoned booking'],
  ['social','◎','Social Media Admin','Kalender|Inbox|Komentar','Reels Jumat|4 DM demo|2 balasan demo'],
  ['partners','◇','Media Partner / KOL','Shortlist|Deliverables|Review','Wellness Bali|2 reels + 1 story|Validasi kode KOL'],
  ['sales','▤','Sales Manager','Prospek|Penawaran|Negosiasi|Menang','24 peluang|12 proposal|8 akun|6 kontrak'],
  ['b2b','▦','Sales B2B','Hotel|Villa|Travel agent|Corporate','Ubud Hotel|Villa Wellness|Bali Travel|Corporate Retreat'],
  ['referral','↪','Driver & Referral','Partner|Kode|Booking|Komisi','Driver Ubud|HAWK-DEMO|42 booking|Menunggu validasi'],
  ['customers','◉','Customer Intelligence','Pelanggan baru|Repeat 90 hari|Segmen utama','600 pelanggan|34%|Wellness travelers'],
  ['budget','◧','Commercial Budget','Shared 7P Budgeting|Purchasing / MRF|Inventory|Approval','Baca pagu dan realisasi|Ajukan kebutuhan dari campaign|Cek stok dan alokasi|Pantau keputusan Finance']
];
const nav = document.querySelector('#nav');
const view = document.querySelector('#view');
const picker = document.querySelector('#picker');
const periods = {
  'Oktober 2026': { factor: 1, revenue:[62,80,96,102,128,132], target:[66,78,90,105,117,132] },
  'September 2026': { factor: .85, revenue:[57,62,78,88,107,118], target:[60,69,80,92,104,115] }
};
const channels = [
  ['Google Search',236,18,210,'#a37430'],
  ['Meta Ads',194,24,230,'#387968'],
  ['Organic & direct',110,10,100,'#79718f'],
  ['Partners & referral',60,6,60,'#ba735c']
];
const campaigns = [
  ['Ubud Wellness Escape','Google Search',165,12,163],
  ['Bali Reset','Meta Ads',132,18,148],
  ['Concierge Network','Partners & referral',48,5,48]
];
let period = 'Oktober 2026';
let topic = 'Marketing';
let campaignFilter = 'Semua channel';
const num = (n, digits=0) => n.toLocaleString('id-ID',{maximumFractionDigits:digits,minimumFractionDigits:digits});
const money = (n, digits=0) => 'Rp '+num(n,digits)+' jt';
const sum = values => values.reduce((a,b)=>a+b,0);
const route = () => modules.find(m=>m[0]===location.hash.slice(1)) || modules[0];
const hero = (title, description, action='') => `<section class="hero"><div><span class="eyebrow">JAENS SPA & WELLNESS GROUP</span><h2>${title}</h2><p>${description}</p></div>${action}</section>`;
const pageHeader = (title, description) => `<header class="page-heading"><div class="breadcrumb"><a href="#dashboard">Commercial</a><span aria-hidden="true">›</span><span>${title}</span></div><h1 tabindex="-1">${title}</h1><p>${description}</p></header>`;
const table = (headers, rows) => `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const meter = (label,value,percent,color='') => `<div class="metric-row"><span>${label}</span><b>${value}</b></div><div class="meter" aria-hidden="true"><span style="width:${percent}%;${color?'background:'+color:''}"></span></div>`;
function trend(data){
  const x=i=>60+i*86;
  const y=value=>169-value;
  const points=values=>values.map((v,i)=>x(i)+','+y(v)).join(' ');
  return `<svg class="chart" viewBox="0 0 530 208" role="img" aria-label="Grafik pendapatan dan target dalam juta rupiah. Nilai tersedia di tabel di bawah."><defs><linearGradient id="area" x2="0%" y2="100%"><stop stop-color="#d8ae60" stop-opacity=".53"/><stop offset="100%" stop-color="#d8ae60" stop-opacity=".05"/></linearGradient></defs>
  ${[0,40,80,120].map(v=>`<path d="M60 ${y(v)}H490" stroke="#e8dfce"/><text x="17" y="${y(v)+4}">${v}</text>`).join('')}
  <polygon points="60,169 ${points(data.revenue)} 490,169" fill="url(#area)"/><polyline points="${points(data.target)}" fill="none" stroke="#477361" stroke-width="2" stroke-dasharray="5 5"/><polyline points="${points(data.revenue)}" fill="none" stroke="#a37430" stroke-width="3"/>
  ${data.revenue.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="#a37430"><title>Periode ${i+1}, ${money(v)}</title></circle><text x="${x(i)-15}" y="192">${1+i*5}–${i===5?(period.startsWith('Oktober')?31:30):5+i*5}</text>`).join('')}</svg>`;
}
function mentor(data){
  const [name,channel,revenue,spend] = campaigns[0];
  const advice = {
    Komunikasi: ['Uji pesan yang berorientasi pada niat booking','Google Search mencatat '+num(Math.round(210*data.factor))+' pelanggan baru. Uji CTA “Cek jadwal treatment” pada landing page dan ukur rasio booking.'],
    Branding: ['Uji konsistensi pesan wellness di konten organik','Organic & direct menghasilkan '+money(110*data.factor,1)+'. Bandingkan dua narasi merek pada konten dan ukur booking berbantuan.'],
    Marketing: ['Prioritaskan evaluasi '+name,'Campaign '+channel+' ini mencatat ROAS '+num(revenue/spend,1)+'×. Uji tambahan anggaran bertahap setelah pagu 7P disetujui, lalu ukur ROAS marginal.'],
    Sales: ['Tindak lanjuti konversi dari jaringan concierge','Concierge Network mencatat '+money(48*data.factor,1)+' dengan ROAS 9,6×. Uji tindak lanjut prospek dan cocokkan kode referral dengan booking selesai.']
  };
  return `<section class="card mentor"><span class="badge">SIMULASI · ATURAN DEMO</span><h2 style="margin-top:10px">AI Marketing Mentor</h2><p>Commercial Advisor · rekomendasi berbasis angka demo</p><div class="tabs">${Object.keys(advice).map(key=>`<button class="btn" data-topic="${key}" aria-pressed="${key===topic}">${key}</button>`).join('')}</div><div class="advice" aria-live="polite"><b>${advice[topic][0]}</b><p>${advice[topic][1]}</p></div><small>Simulasi frontend. Layanan AI belum terhubung.</small></section>`;
}
function dashboard(){
  const data=periods[period];
  const f=data.factor;
  const revenue=sum(data.revenue);
  const target=sum(data.target);
  const customers=sum(channels.map(c=>Math.round(c[3]*f)));
  const spend=58*f;
  const planned=75*f;
  const paidRevenue=(236+194)*f;
  const paidSpend=42*f;
  const kpis=[
    ['Revenue',money(revenue),num(revenue/target*100,1)+'% dari target'],
    ['Pelanggan baru',num(customers),'Booking pertama selesai'],
    ['CAC','Rp '+num(spend*1000000/customers),'Spend ÷ pelanggan baru'],
    ['ROAS iklan',num(paidRevenue/paidSpend,1)+'×','Google Search + Meta Ads'],
    ['Budget terpakai',num(spend/planned*100,1)+'%',money(spend,1)+' dari '+money(planned,1)]
  ];
  return pageHeader('Commercial Command Center','Kinerja pemasaran, penjualan, dan pelanggan dalam satu tampilan.') + hero('Ringkasan Marketing Manager','Pantau performa campaign, akuisisi pelanggan, dan pemakaian anggaran.',`<label>Periode laporan<select id="period">${Object.keys(periods).map(p=>`<option ${p===period?'selected':''}>${p}</option>`).join('')}</select></label>`)
  + `<section class="kpis" aria-label="KPI pemasaran">${kpis.map(([label,value,note])=>`<div class="card kpi"><span class="muted">${label}</span><strong>${value}</strong><span class="positive">${note}</span></div>`).join('')}</section>
  <div class="grid"><section class="card"><h2>Revenue vs target</h2><p>Pendapatan per blok tanggal · Rp juta</p>${trend(data)}<div class="legend"><b>● Realisasi</b><span>┄ Target</span></div><details><summary>Lihat data grafik</summary>${table(['Tanggal mulai','Revenue','Target'],data.revenue.map((r,i)=>[1+i*5,money(r),money(data.target[i])]))}</details></section>
  <section class="card"><h2>Channel attribution</h2><p>Pangsa revenue · atribusi last touch demo</p>${channels.map(([name,r,,,color])=>meter(name,money(r*f,1)+' · '+num(r/6,1)+'%',r/6,color)).join('')}</section></div>
  <div class="grid"><section class="card"><h2>Campaign effectiveness</h2><p>Campaign terpilih · ROAS tertinggi di atas</p><label>Channel <select id="campaign-filter">${['Semua channel',...channels.map(c=>c[0])].map(c=>`<option ${c===campaignFilter?'selected':''}>${c}</option>`).join('')}</select></label>
  ${table(['Campaign','Revenue','Spend','ROAS','Booking'],campaigns.filter(c=>campaignFilter==='Semua channel'||campaignFilter===c[1]).sort((a,b)=>b[2]/b[3]-a[2]/a[3]).map(([name,,r,s,b])=>[name,money(r*f,1),money(s*f,1),num(r/s,1)+'×',num(Math.round(b*f))]))}
  ${campaigns.some(c=>campaignFilter==='Semua channel'||campaignFilter===c[1])?'':'<p>Belum ada campaign dalam sampel channel ini.</p>'}</section><div id="mentor">${mentor(data)}</div></div>
  <div class="grid"><section class="card"><h2>Funnel akuisisi</h2><p>Sesi → inquiry → pelanggan baru</p>${[['Sesi',12000],['Inquiry',1800],['Pelanggan baru',customers/f]].map(([label,n])=>meter(label,num(Math.round(n*f)),n/120)).join('')}<b>${num(customers/Math.round(12000*f)*100,1)}% sesi menjadi pelanggan baru</b></section>
  <div class="stack"><section class="card"><h2>Customer insights</h2><p>Repeat dalam 90 hari · cohort demo matang</p>${meter('Kunjungan ulang',period.startsWith('Oktober')?'34%':'31%',period.startsWith('Oktober')?34:31,'#387968')}<a href="#customers">Buka Customer Intelligence →</a></section>
  <section class="card"><h2>Budget vs actual</h2><p>Realisasi ${money(spend,1)} · pagu ${money(planned,1)}</p>${meter('Pagu terpakai',num(spend/planned*100,1)+'%',spend/planned*100)}<a href="#budget">Lihat alur Finance →</a></section></div></div>`;
}
function render(focus=''){
  const [id, , title, stages, items] = route();
  nav.innerHTML=modules.map(([key,icon,label],i)=>`${i===1?'<div class="nav-label">WORKSPACES</div>':''}<a href="#${key}" ${key===id?'aria-current="page"':''}><span aria-hidden="true">${icon}</span>${label}</a>`).join('');
  view.innerHTML=id==='dashboard'?dashboard():pageHeader(title,id==='budget'?'Alur integrasi konseptual dengan Finance sebagai sumber data bersama.':'Workspace demo · contoh pekerjaan dan status tim.')
    + `<div class="board">${stages.split('|').map((stage,i)=>`<article class="card"><h2>${stage}</h2><p>${items.split('|')[i]}</p></article>`).join('')}</div>`
    + (id==='budget'?'<section class="card" style="margin-top:15px"><h2>Alur transaksi bersama</h2><p>Campaign + cost center + kode 7P → validasi pagu Finance → MRF / permintaan stok → approval → realisasi tercatat di Finance → ringkasan budget Commercial.</p><small>Integrasi konseptual · semua status menggunakan data demo.</small></section>':'');
  if(focus) document.querySelector(focus)?.focus();
}
document.querySelector('#portal').onclick=()=>{
  picker.showModal();
};
document.querySelector('#close').onclick=()=>picker.close();
picker.addEventListener('click',event=>{
  const portal=event.target.closest('[data-portal]')?.dataset.portal;
  if(portal==='Commercial'){
    picker.close();
    location.hash='dashboard';
  }
});
view.addEventListener('change',event=>{
  if(event.target.id==='period') period=event.target.value;
  else if(event.target.id==='campaign-filter') campaignFilter=event.target.value;
  else return;
  render('#'+event.target.id);
});
view.addEventListener('click',event=>{
  if(!event.target.dataset.topic) return;
  topic=event.target.dataset.topic;
  document.querySelector('#mentor').innerHTML=mentor(periods[period]);
  document.querySelector('[data-topic="'+topic+'"]').focus();
});
window.addEventListener('hashchange',()=>render('h1'));
render();
