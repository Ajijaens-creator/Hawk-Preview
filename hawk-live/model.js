const HAWK = (() => {
  const SEED = {
    budget: 25000000,
    requests: [{id:'MRF-001',campaign:'CMP-001',line:'BGL-UBD-2608-01',pos:'Promotion',amount:3500000,status:'posted',note:'Boost Reels teaser',history:[{status:'submitted',at:'2026-08-03'},{status:'approved',at:'2026-08-04'},{status:'posted',at:'2026-08-05',ref:'PST-2608-0001'}]}],
    leads: [{id:'LEAD-001',name:'Tamu Demo',source:'Instagram',channel:'WhatsApp',campaign:'CMP-001',status:'new'}],
    bookings: [{id:'BK-001',lead:'LEAD-HISTORY',source:'Organic',channel:'Website',campaign:'',partner:'',slot:'10.00',amount:750000,status:'paid',commissionRate:0,payout:false}],
    tasks: [{id:'TASK-01',team:'Commercial',person:'Rani',group:'Content',label:'Review materi Wellness Escape',status:'planned'},{id:'TASK-02',team:'Sales',person:'Dewa',group:'Reservasi',label:'Tindak lanjut lead WhatsApp',status:'planned'}],
    catalog:{name:'Wellness Massage',price:750000,duration:60},
    partner:{id:'DRV-001',name:'Driver Demo',rate:.1,active:false,agreement:false},
    b2b:{name:'Ubud Hotel Demo',stage:'Prospek'},
    slots:['11.00','13.00','15.00'],
    stock:12
  };
  const fresh = () => JSON.parse(JSON.stringify(SEED));
  const nextId = (prefix, rows) => prefix + '-' + String(rows.length + 1).padStart(3,'0');
  function totals(state){
    const actual = state.requests.filter(r=>r.status==='posted').reduce((sum,r)=>sum+r.amount,0);
    const committed = state.requests.filter(r=>r.status==='approved').reduce((sum,r)=>sum+r.amount,0);
    const paid = state.bookings.filter(b=>b.status==='paid');
    const revenue = paid.reduce((sum,b)=>sum+b.amount,0);
    const commission = paid.reduce((sum,b)=>sum+Math.round(b.amount*b.commissionRate),0);
    const attributed = paid.filter(b=>b.campaign==='CMP-001').reduce((sum,b)=>sum+b.amount,0);
    return {actual,committed,remaining:state.budget-actual-committed,revenue,commission,attributed,roas:actual?attributed/actual:null};
  }
  function requireState(condition,message){if(!condition)throw Error(message)}
  function update(state,action,input={}){
    const row = (rows) => rows.find(r=>r.id===input.id);
    switch(action){
      case 'request': {
        const amount=Number(input.amount);
        requireState(Number.isSafeInteger(amount)&&amount>0,'Masukkan nominal rupiah yang valid.');
        const id=nextId('MRF',state.requests);
        state.requests.push({id,campaign:input.campaign||'CMP-001',line:'BGL-UBD-2608-01',pos:input.pos||'Promotion',amount,status:'submitted',note:String(input.note||'').slice(0,120),history:[{status:'submitted',at:'2026-08-22'}]});
        break;
      }
      case 'approve': {
        const request=row(state.requests);
        requireState(request?.status==='submitted','Pengajuan sudah diproses.');
        requireState(request.amount<=totals(state).remaining,'Sisa pagu tidak mencukupi.');
        request.status='approved';
        (request.history=request.history||[]).push({status:'approved',at:'2026-08-22'});
        break;
      }
      case 'post': {
        const request=row(state.requests);
        requireState(request?.status==='approved','Setujui pengajuan sebelum realisasi.');
        request.status='posted';
        (request.history=request.history||[]).push({status:'posted',at:'2026-08-22',ref:'PST-2608-'+request.id.slice(4).padStart(4,'0')});
        break;
      }
      case 'reject': {
        const request=row(state.requests);
        requireState(request?.status==='submitted','Pengajuan sudah diproses.');
        const reason=String(input.reason||'').trim();
        requireState(reason.length>=5,'Tulis alasan penolakan (min. 5 karakter).');
        request.status='rejected'; request.reason=reason.slice(0,160);
        (request.history=request.history||[]).push({status:'rejected',at:'2026-08-22',reason:request.reason});
        break;
      }
      case 'lead': {
        requireState(['WhatsApp','Telepon','Website','Sosial media','Email'].includes(input.channel),'Kanal tidak valid.');
        state.leads.push({id:nextId('LEAD',state.leads),name:'Tamu Demo',source:input.channel==='WhatsApp'?'Instagram':'Tidak diketahui',channel:input.channel,campaign:input.channel==='WhatsApp'?'CMP-001':'',status:'new'});
        break;
      }
      case 'handoff': {
        const lead=row(state.leads);
        requireState(lead?.status==='new','Lead sudah ditindaklanjuti.');
        lead.status='staff';
        break;
      }
      case 'book': {
        const lead=row(state.leads);
        const partner=input.referral==='yes';
        requireState(!partner||state.partner.active,'Partner referral belum aktif.');
        requireState(state.slots.includes(input.slot)&&!state.bookings.some(b=>b.slot===input.slot&&b.status!=='cancelled'),'Slot sudah tidak tersedia.');
        requireState(!lead||lead.status!=='booked','Lead sudah memiliki booking.');
        state.bookings.push({id:nextId('BK',state.bookings),lead:lead?.id||'',source:lead?.source||(partner?'Referral':'Direct'),channel:lead?.channel||'Website',campaign:lead?.campaign||'',partner:partner?state.partner.id:'',slot:input.slot,amount:state.catalog.price,status:'confirmed',commissionRate:partner?state.partner.rate:0,payout:false});
        if(lead)lead.status='booked';
        break;
      }
      case 'checkin': case 'complete': case 'pay': case 'cancel': case 'refund': {
        const booking=row(state.bookings);
        const transitions={checkin:['confirmed','checked-in'],complete:['checked-in','completed'],pay:['completed','paid'],cancel:['confirmed','cancelled'],refund:['paid','refunded']};
        const [from,to]=transitions[action];
        requireState(booking?.status===from,'Status booking sudah berubah.');
        requireState(action!=='refund'||!booking.payout,'Komisi sudah dibayar. Perlu penyesuaian Finance.');
        booking.status=to;
        if(action==='cancel'){
          const lead=state.leads.find(l=>l.id===booking.lead);
          if(lead)lead.status='staff';
        }
        break;
      }
      case 'agreement': state.partner.agreement=true; break;
      case 'activate':
        requireState(state.partner.agreement,'Perjanjian belum disetujui.');
        state.partner.active=true;
        break;
      case 'payout': {
        const booking=row(state.bookings);
        requireState(booking?.status==='paid'&&booking.commissionRate>0&&!booking.payout,'Komisi belum dapat dibayar.');
        booking.payout=true;
        break;
      }
      case 'pipeline': {
        const stages=['Prospek','Kualifikasi','Proposal','Negosiasi','Kontrak menang','Aktif','Booking pertama'];
        const index=stages.indexOf(state.b2b.stage);
        requireState(index<stages.length-1,'Pipeline telah mencapai tahap akhir.');
        state.b2b.stage=stages[index+1];
        break;
      }
      case 'task': {
        const task=row(state.tasks);
        requireState(task?.status==='planned','Tugas sudah selesai.');
        task.status='done';
        break;
      }
      default: throw Error('Aksi tidak tersedia.');
    }
  }
  return {fresh,totals,update};
})();
if (typeof module !== 'undefined') module.exports = HAWK;
