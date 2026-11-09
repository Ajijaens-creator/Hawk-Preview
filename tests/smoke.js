global.localStorage=undefined;
['util','seed','contracts','store','adapter','ai'].forEach(f=>require('../assets/js/core/'+f+'.js'));
const H=globalThis.HAWK; const st=H.createStore({storage:null}); const api=H.createApi(st);
const u=r=>st.state.users.find(x=>x.role===r);
let r=api.call('mrf.create',{branch:'BR-UBD',lines:[{item:'BHP-001',qty:10}]},u('STAFF')); console.log(r.ok, r.data&&r.data.id, r.error);
const m=r.data; console.log(H.selectors.mrfBudgetCheck(st.state,m).lines[0].status, H.selectors.mrfBudgetCheck(st.state,m).lines[0].ratio, m.chain);
r=api.call('mrf.decide',{id:m.id,decision:'APPROVE'},u('SUPERVISOR')); console.log(r.ok,r.error, JSON.stringify(r.data.lines[0].alloc));
console.log(H.AI.insights(st.state).map(i=>i.id+' '+i.title).join('\n'));
