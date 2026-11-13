const groups = {
  Finance:[['budget','Budget 7P'],['mrf','Purchasing & MRF'],['commission','Komisi & Rekonsiliasi']],
  Operational:[['pos','Operational & POS'],['inventory','Inventory']],
  Commercial:[['commercial','Executive Summary'],['campaign','Campaign Planner'],['studio','Content Studio'],['brand','Brand & Communications'],['digital','Digital Marketing'],['social','Social Media'],['kol','Media Partner & KOL'],['attribution','Audience & Attribution'],['commercial-budget','Commercial Budget'],['mentor','AI Marketing Mentor'],['commercial-team','Kinerja Tim']],
  Sales:[['sales','Sales Manager'],['owner','Owner Eagle Eye'],['reservation','B2C & Reservasi'],['b2b','Sales B2B'],['driver','Driver & Referral'],['client','Client Portal'],['sales-team','Kinerja Tim']]
};
const key='hawk-integrated-demo-v1';
let state=HAWK.fresh();
try { const saved=localStorage.getItem(key); if(saved)state=JSON.parse(saved); } catch {}
const view=document.querySelector('#view');
const picker=document.querySelector('#picker');
const nav=document.querySelector('#nav');
const rp=n=>'Rp '+n.toLocaleString('id-ID');
const dec=n=>n.toLocaleString('id-ID',{maximumFractionDigits:2});
const link=(id,title)=>`<a href="#${id}">${title}</a>`;
const button=(action,title,id='')=>`<button type="button" class="btn" data-action="${action}" data-id="${id}">${title}</button>`;
const table=(headers,rows)=>`<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const card=(title,body)=>`<section class="card"><h2>${title}</h2>${body}</section>`;
const metrics=(entries)=>`<section class="kpis">${entries.map(([label,value])=>`<div class="card kpi"><span>${label}</span><strong>${value}</strong></div>`).join('')}</section>`;
const bar=(label,value,ratio)=>`<div class="metric-row"><span>${label}</span><b>${value}</b></div><div class="meter" aria-hidden="true"><span style="width:${Math.min(100,ratio*100)}%"></span></div>`;
const requests=()=>table(['ID','Campaign','Nominal','Status','Aksi'],state.requests.map(r=>[r.id,r.campaign,rp(r.amount),r.status,r.status==='submitted'?button('approve','Setujui',r.id):r.status==='approved'?button('post','Catat realisasi',r.id):'—']));
const bookingRows=(rows,actions=false)=>table(['Booking','Lead','Slot','Nilai','Status',...(actions?['Aksi']:[])],rows.map(b=>[b.id,b.lead||'—',b.slot,rp(b.amount),b.status,...(actions?[
  ({confirmed:()=>button('checkin','Check-in',b.id)+' '+button('cancel','Batalkan',b.id),'checked-in':()=>button('complete','Selesaikan',b.id),completed:()=>button('pay','Bayar',b.id),paid:()=>b.payout?'Perlu penyesuaian Finance':button('refund','Refund',b.id)})[b.status]?.()||'—'
]:[])]));
const budget=()=>{const t=HAWK.totals(state);return metrics([['Pagu 7P',rp(state.budget)],['Komitmen',rp(t.committed)],['Realisasi',rp(t.actual)],['Sisa',rp(t.remaining)]])+card('Realisasi dan komitmen',bar('Realisasi',rp(t.actual),t.actual/state.budget)+bar('Komitmen',rp(t.committed),t.committed/state.budget));};
const requestForm=()=>`<form class="workflow-form" data-submit="request"><label>Nominal pengajuan (Rp)<input name="amount" type="number" min="1" step="1" required value="2000000"></label><button class="btn">Ajukan MRF</button></form>`;
const bookingForm=(mode='client')=>{
  const slots=state.slots.filter(slot=>!state.bookings.some(b=>b.slot===slot&&b.status!=='cancelled'));
  if(!slots.length)return '<p>Semua slot demo terisi.</p>';
  const leadOptions=state.leads.filter(l=>l.status!=='booked').map(l=>`<option value="${l.id}">${l.id} · ${l.channel}</option>`).join('');
  return `<form class="workflow-form" data-submit="book">
  ${mode==='reservation'?`<label>Lead<select name="id"><option value="">Booking langsung</option>${leadOptions}</select></label>`:''}
  ${mode==='driver'?'<input type="hidden" name="referral" value="yes">':''}
  <label>Slot HAWK<select name="slot">${slots.map(s=>`<option>${s}</option>`).join('')}</select></label>
  <button class="btn">Konfirmasi booking</button></form>`;
};
const pipeline=()=>card('Ubud Hotel Demo',`<p>Tahap saat ini <b>${state.b2b.stage}</b></p><p>Guest Referral · On-site Treatment · Spa Partnership</p>${state.b2b.stage==='Booking pertama'?'':button('pipeline','Lanjutkan tahap')}`);
const teams=scope=>{
  const tasks=state.tasks.filter(t=>t.team===scope);
  return metrics([['Pekerjaan',tasks.length],['Terverifikasi selesai',tasks.filter(t=>t.status==='done').length]])+
    card('Ambidex & XRace · Daily Race',table(['Tim','Grup','PIC','Pekerjaan','Status','Aksi'],tasks.map(t=>[t.team,t.group,t.person,t.label,t.status,t.status==='planned'?button('task','Verifikasi selesai',t.id):'—'])))+
    '<div class="grid">'+card('Kinerja & KPI',`<p>Completion demo <b>${dec(100*tasks.filter(t=>t.status==='done').length/tasks.length)}%</b></p><p>XScore dan kontrak KPI masuk tahap pengembangan lanjutan.</p>`)+card('Status Tim','<p>Status sesi demo · Tidak diketahui</p><p>Jadwal demo · Dalam shift</p>')+'</div>';
};
function bridge(){
  return '<div class="flow">'+Object.entries(groups).map(([group,items])=>`<a class="card" href="#${items[0][0]}"><h2>${group}</h2><small>${items.length} ruang demo</small></a>`).join('')+'</div>'+
    card('Skenario uji lintas portal','<ol><li>Ajukan MRF di Commercial Budget. Setujui dan catat realisasi di Finance.</li><li>Buka lead Instagram/WhatsApp di Sales. Alihkan ke staf atau langsung booking.</li><li>Check-in, selesaikan, lalu bayar di Operational & POS. Cek revenue dan atribusi.</li><li>Aktifkan driver setelah perjanjian. Buat booking driver, selesaikan di POS, lalu catat komisi di Finance.</li></ol><div class="actions">'+link('screens','Buka peta semua layar')+button('reset','Reset demo')+'</div>');
}
function screen(id){
  const t=HAWK.totals(state);
  switch(id){
    case 'bridge': return bridge();
    case 'screens': return card('Ruang dalam preview',table(['Portal','Layar'],Object.entries(groups).flatMap(([group,items])=>items.map(([route,title])=>[group,link(route,title)]))));
    case 'budget': return budget()+card('Daftar pengajuan',requests());
    case 'commercial-budget': return budget()+card('Pengajuan campaign Wellness Escape',requestForm()+link('mrf','Lihat status di Finance'));
    case 'mrf': return card('Pengajuan, approval dan realisasi',requests());
    case 'inventory': return card('Stok demo',table(['Item','Tersedia','Rujukan'],[['Minyak massage',state.stock+' botol',link('mrf','Purchasing / MRF')]]));
    case 'pos': return card('Booking → treatment → transaksi',bookingRows(state.bookings,true));
    case 'commission': return metrics([['Revenue dibayar',rp(t.revenue)],['Komisi valid',rp(t.commission)]])+card('Komisi per booking',table(['Booking','Partner','Komisi','Status'],state.bookings.filter(b=>b.partner).map(b=>[b.id,b.partner,b.status==='paid'?rp(Math.round(b.amount*b.commissionRate)):'—',b.payout?'Dibayar (demo)':b.status==='paid'?button('payout','Catat pembayaran',b.id):'Menunggu transaksi valid'])));
    case 'commercial': return metrics([['Total revenue',rp(t.revenue)],['Revenue campaign',rp(t.attributed)],['Booking dibayar',state.bookings.filter(b=>b.status==='paid').length],['ROAS demo',t.roas===null?'—':dec(t.roas)+'×']])+
      '<div class="grid">'+card('Campaign Wellness Escape',bar('Lead campaign',state.leads.filter(l=>l.campaign).length,1)+bar('Booking dibayar',state.bookings.filter(b=>b.campaign&&b.status==='paid').length,state.leads.length?state.bookings.filter(b=>b.campaign&&b.status==='paid').length/state.leads.length:0)+link('attribution','Telusuri booking'))+card('Budget Realization',bar('Realisasi',rp(t.actual),t.actual/state.budget)+link('commercial-budget','Lihat budget'))+'</div>'+card('Acuan visual SER','<p><a href="../visual/F1-02-commercial-summary.html">Buka Executive Summary F1‑02 dengan filter periode dan outlet</a></p>');
    case 'campaign': return card('CMP-001 · Wellness Escape','<p>Instagram → WhatsApp → reservasi Giant Spa</p><div class="actions">'+link('studio','Content Studio')+link('attribution','Lihat atribusi')+link('commercial-budget','Ajukan biaya')+'</div>');
    case 'studio': return teams('Commercial');
    case 'brand': return card('Brand & Communications','<p>Pesan demo · Wellness Escape di Giant Spa</p>'+link('campaign','Lihat brief campaign'));
    case 'digital': return metrics([['Biaya campaign',rp(t.actual)],['Revenue teratribusi',rp(t.attributed)],['ROAS demo',t.roas===null?'—':dec(t.roas)+'×']])+card('Channel campaign',link('attribution','Buka jejak channel'));
    case 'social': return card('Instagram → WhatsApp',link('reservation','Buka inbox Sales B2C'));
    case 'kol': return card('Media Partner & KOL','<p>Deliverable demo · Reels Wellness Escape</p>'+link('campaign','Buka campaign terkait'));
    case 'mentor': return card('AI Marketing Mentor · Simulasi',`<p>${t.attributed?'Bandingkan biaya campaign dengan revenue booking yang telah dibayar.':'Uji CTA WhatsApp dan tinjau apakah lead berubah menjadi booking dibayar.'}</p>`+link('attribution','Lihat angka pendukung'));
    case 'attribution': return card('Jejak booking',table(['Booking','Lead','Sumber','Kanal','Campaign','Revenue'],state.bookings.map(b=>[b.id,b.lead||'—',b.source,b.channel,b.campaign||'—',b.status==='paid'?rp(b.amount):'—'])));
    case 'sales': case 'owner': return metrics([['Revenue dibayar',rp(t.revenue)],['Lead terbuka',state.leads.filter(l=>l.status!=='booked').length],['Komisi valid',rp(t.commission)]])+card('Jejak hasil Sales',bookingRows(state.bookings))+pipeline();
    case 'reservation': return card('Inbox reservasi',`<form class="workflow-form" data-submit="lead"><label>Kanal<select name="channel"><option>WhatsApp</option><option>Telepon</option><option>Website</option><option>Sosial media</option><option>Email</option></select></label><button class="btn">Tambah lead demo</button></form>`+table(['Lead','Sumber','Kanal','Status','Aksi'],state.leads.map(l=>[l.id,l.source,l.channel,l.status,l.status==='new'?button('handoff','Alihkan ke staf',l.id):'—'])))+card('Booking Desk',bookingForm('reservation'));
    case 'b2b': return pipeline();
    case 'client': return card('Katalog & booking',`<p>${state.catalog.name} · ${state.catalog.duration} menit · ${rp(state.catalog.price)}</p>`+bookingForm())+card('Riwayat demo',bookingRows(state.bookings.filter(b=>!b.lead&&!b.partner)));
    case 'driver': return card('Driver Demo · DRV-001',`<p>${state.partner.active?'Aktif':state.partner.agreement?'Menunggu aktivasi':'Perjanjian belum disetujui'} · komisi 10%</p>`+(state.partner.active?bookingForm('driver'):state.partner.agreement?button('activate','Aktifkan partner'):button('agreement','Setujui perjanjian demo')))+card('Booking referral',bookingRows(state.bookings.filter(b=>b.partner)));
    case 'commercial-team': return teams('Commercial');
    case 'sales-team': return teams('Sales');
    default: return bridge();
  }
}
function render(message='',error=false){
  const id=location.hash.slice(1)||'bridge';
  const group=Object.entries(groups).find(([,items])=>items.some(([route])=>route===id));
  const title=group?.[1].find(([route])=>route===id)?.[1]||(id==='screens'?'Peta layar':'Alur lintas portal');
  nav.innerHTML=(group?.[1]||Object.entries(groups).map(([name,items])=>[items[0][0],name])).map(([route,name])=>`<a href="#${route}" ${route===id?'aria-current="page"':''}>${name}</a>`).join('');
  view.innerHTML=`<header class="page-heading"><div class="breadcrumb">HAWK ERP › ${group?.[0]||'Demo integrasi'}</div><h1 tabindex="-1">${title}</h1></header><p class="status" role="${error?'alert':'status'}"></p>`+screen(id);
  view.querySelector('.status').textContent=message;
}
function apply(action,input){
  try{
    if(action==='reset'){if(!confirm('Kembalikan semua data demo ke kondisi awal?'))return;state=HAWK.fresh();}
    else HAWK.update(state,action,input);
    try{localStorage.setItem(key,JSON.stringify(state));}catch{render('Perubahan berlaku selama halaman ini terbuka. Penyimpanan browser tidak tersedia.');return;}
    render('Perubahan demo tersimpan.');
  }catch(error){render(error.message,true);}
}
document.querySelector('#portal').onclick=()=>picker.showModal();
document.querySelector('#options').innerHTML=Object.entries(groups).map(([name,items])=>`<button data-route="${items[0][0]}">${name}<span aria-hidden="true">→</span></button>`).join('');
picker.addEventListener('click',event=>{
  const route=event.target.closest('[data-route]')?.dataset.route;
  if(route){picker.close();location.hash=route;}
});
view.addEventListener('submit',event=>{
  const form=event.target;
  if(!form.dataset.submit)return;
  event.preventDefault();
  apply(form.dataset.submit,Object.fromEntries(new FormData(form)));
});
view.addEventListener('click',event=>{
  const control=event.target.closest('[data-action]');
  if(control)apply(control.dataset.action,{id:control.dataset.id});
});
window.addEventListener('hashchange',()=>{render();view.querySelector('h1').focus();});
render();
