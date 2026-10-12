(()=>{'use strict';
const $=id=>document.getElementById(id);
const defaults={unit:'lower',area:200,rate:60000,down:25,install:65,milestone:10,months:30,rentLow:150,rentBase:250,rentHigh:500,vacancy:10,costs:15,acq:5,growthRate:8,horizon:3,depositRate:10,inflationRate:10.3};
const ids=Object.keys(defaults);
const officeDefaults={officeUnits:1,officeArea:1000,officeRate:35000,officeDown:25,officeInstall:65,officeTransfer:10,officeMonths:30,officeRentLow:125,officeRentBase:145,officeRentHigh:180,officeVacancy:10,officeCosts:15,officeAcq:5,officeGrowthRate:8,officeHorizon:3};
const officeIds=Object.keys(officeDefaults);let presenting=false;
const sourceUrls={residential:'https://www.zameen.com/index/buy/residential_plots/islamabad/pakistan/dha-defence-phase-1-376/',commercial:'https://www.zameen.com/index/buy/commercial_plots/islamabad/pakistan/dha-defence-phase-1-376/',retail:'https://www.zameen.com/Rentals_Retail_Shops/Islamabad_DHA_Defence_Phase_1-376-1.html',office:'https://www.zameen.com/Rentals_Offices/Islamabad_DHA_Defence_Phase_1-376-1.html',avenue:'https://makkaan.com/avenue-18',pbs:'https://www.pbs.gov.pk/monthly-inflation-report-for-sep-2026/',savings:'https://savings.gov.pk/latest-profit-rates/'};
const n=id=>Number($(id).value);const range=(id,min,max)=>Number.isFinite(n(id))&&n(id)>=min&&n(id)<=max;
const fmt=x=>Number.isFinite(x)?new Intl.NumberFormat('en-PK',{maximumFractionDigits:0}).format(Math.round(x)):'—';
const money=x=>'PKR '+fmt(x);const percent=x=>(Number.isFinite(x)?x:0).toFixed(2)+'%';
function words(x){let v=Math.round(Math.abs(x)),a=[];if(!Number.isFinite(v))return'—';for(const [unit,size]of [['crore',1e7],['lakh',1e5],['thousand',1e3]]){const t=Math.floor(v/size);if(t){a.push(fmt(t)+' '+unit);v-=t*size}}if(v)a.push(fmt(v));return a.join(' ')}
function price(){return n('area')*n('rate')}
function milestoneName(){return $('unit').value==='office'?'DHA transfer':'possession'}
function rentRates(){return [{id:'low',label:'Conservative',rate:n('rentLow')},{id:'base',label:'Base case',rate:n('rentBase')},{id:'high',label:'Premium-positioning test',rate:n('rentHigh')}].map(x=>{const month=n('area')*x.rate,annual=month*12,net=annual*(1-n('vacancy')/100)*(1-n('costs')/100),p=price(),costBase=p*(1+n('acq')/100);return {...x,month,annual,net,grossYield:p?annual/p*100:0,netYield:costBase?net/costBase*100:0}})}
function future(rate,years){return price()*Math.pow(1+rate/100,years)}
function valid(){return range('area',1,1e7)&&range('rate',1,1e12)&&['rentLow','rentBase','rentHigh'].every(id=>range(id,0,1e7))&&['vacancy','costs','acq','down','install','milestone'].every(id=>range(id,0,100))&&range('growthRate',-99,100)&&range('depositRate',0,100)&&range('inflationRate',-50,100)&&Number.isInteger(n('months'))&&range('months',1,600)&&[1,3,5].includes(n('horizon'))}
function save(){try{const s={},o={};ids.forEach(id=>s[id]=$(id).value);officeIds.forEach(id=>o[id]=$(id).value);localStorage.setItem('makkaanInvestorMode',JSON.stringify(s));localStorage.setItem('makkaanOfficeInvestor',JSON.stringify(o))}catch(e){}}
function render(){if(!valid()){$('editStatus').textContent='Check inputs: area and rate must be positive; percentages must be within range; month count must be a whole number.';$('editStatus').classList.add('error');return}
$('editStatus').textContent='Values updated. Verify approved unit details and leasing evidence before quoting.';$('editStatus').classList.remove('error');
const p=price(),a=n('area'),r=n('rate'),d=n('down'),i=n('install'),mil=n('milestone'),m=n('months'),dp=p*d/100,pool=p*i/100,milAmt=p*mil/100,mon=pool/m,sum=d+i+mil,balanced=Math.abs(sum-100)<.001,rs=rentRates(),base=rs[1],years=n('horizon'),gr=n('growthRate'),fv=future(gr,years),delta=fv-p,netRent=base.net,costBase=p*(1+n('acq')/100);
$('heroUnit').textContent=$('unit').selectedOptions[0].textContent+' · '+fmt(a)+' sq ft';$('heroPrice').textContent=money(p);$('heroWords').textContent=words(p);$('heroRate').textContent=money(r)+' / sq ft';$('heroArea').textContent=fmt(a)+' square feet';
$('mDown').textContent=money(dp);$('mDownNote').textContent=d+'% of price';$('mMonthly').textContent=money(mon);$('mMonthlyNote').textContent=i+'% pool over '+m+' months';$('mRent').textContent=money(base.month);$('mRentNote').textContent='PKR '+fmt(n('rentBase'))+' / sq ft / month';$('mYield').textContent=percent(base.grossYield);
$('oPrice').textContent=money(p);$('oDown').textContent=money(dp);$('oPool').textContent=money(pool);$('oMonthly').textContent=money(mon);$('oMilestone').textContent=money(milAmt);$('milestoneLabel').textContent=(milestoneName()==='possession'?'Possession':'DHA transfer')+' amount';$('milestoneNote').textContent='Retail · possession milestone shown in this model.';if($('unit').value==='office')$('milestoneNote').textContent='Office · DHA transfer milestone shown in this model.';$('milestoneContext').textContent=$('unit').value==='office'?'For offices, this model uses a DHA transfer milestone. Makkaan will explain the applicable process, timeline and charges in the approved offer.':'For shops, this model uses a possession milestone. Makkaan will explain the possession terms and timing in the approved offer.';$('oAllocation').textContent=sum.toFixed(2)+'% · '+(balanced?'Balanced':'Review split');$('allocation').textContent='Current split: '+sum.toFixed(2)+'% · '+(balanced?'ready to review':'adjust to total 100%');$('allocation').style.color=balanced?'var(--green)':'var(--gold)';
for(const x of rs){$(x.id+'Month').textContent=money(x.month);$(x.id+'Annual').textContent=money(x.annual);$(x.id+'Gross').textContent=percent(x.grossYield);$(x.id+'Net').textContent=percent(x.netYield);$(x.id+'Rate').textContent='PKR '+fmt(x.rate)}
const vac=base.annual*n('vacancy')/100,collected=base.annual-vac,op=collected*n('costs')/100,net=collected-op;$('rPotential').textContent=money(base.annual);$('rVacancy').textContent='−'+money(vac);$('rCollected').textContent=money(collected);$('rCosts').textContent='−'+money(op);$('rNet').textContent=money(net);$('rCostBase').textContent=money(costBase);$('rNetYield').textContent=percent(costBase?net/costBase*100:0);
$('futureValue').textContent=money(fv);$('futureLabel').textContent='In '+years+' year'+(years===1?'':'s')+' at '+gr+'% p.a.';$('futureGain').textContent=(delta>=0?'+':'−')+money(Math.abs(delta));$('futureGainPct').textContent=(delta>=0?'+':'−')+percent(p?Math.abs(delta/p*100):0)+' over period';$('growthEntry').textContent=money(p);$('growthTag').textContent=(gr>0?'+':'')+gr+'% p.a.';
const real=(1+n('depositRate')/100)/(1+n('inflationRate')/100)-1;$('bankRateLabel').textContent=n('depositRate').toFixed(1)+'%';$('inflationLabel').textContent=n('inflationRate').toFixed(1)+'%';$('realRate').textContent=(real<0?'−':'+')+(Math.abs(real)*100).toFixed(2)+'%';$('cashPrincipal').textContent=money(p);$('cashRateText').textContent=n('depositRate').toFixed(1)+'% p.a.';$('inflationText').textContent=n('inflationRate').toFixed(1)+'% p.a.';$('propertyRateText').textContent=(gr>0?'+':'')+gr.toFixed(1)+'% p.a.';$('netRentText').textContent=money(netRent)+' / year';$('cashRows').innerHTML=[1,3,5].map(y=>{const cash=p*Math.pow(1+n('depositRate')/100,y),basket=p*Math.pow(1+n('inflationRate')/100,y),realCash=cash/Math.pow(1+n('inflationRate')/100,y),prop=future(gr,y),rentCumulative=netRent*y;return `<tr><td><strong>${y} year${y===1?'':'s'}</strong></td><td>${money(cash)}</td><td>${money(basket)}</td><td>${money(realCash)}</td><td>${money(prop)}</td><td>${money(prop+rentCumulative)}</td></tr>`}).join('');renderScenarios();renderOffice();save()}
function renderScenarios(){const p=price(),rates=[-5,0,5,8,12],vals=rates.map(r=>({r,v:p*Math.pow(1+r/100,3)})),max=Math.max(...vals.map(x=>x.v));$('bars').innerHTML=vals.map(x=>`<div class="bar-row"><div class="bar-name">${x.r>0?'+':''}${x.r}% p.a.</div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(1,x.v/max*100)}%"></div></div><div class="bar-value">${money(x.v)}</div></div>`).join('');$('scenarioRows').innerHTML=rates.map(r=>{const v1=p*Math.pow(1+r/100,1),v3=p*Math.pow(1+r/100,3),v5=p*Math.pow(1+r/100,5),delta=v3-p;return `<tr><td><strong>${r>0?'+':''}${r}% p.a.</strong></td><td>${money(v1)}</td><td>${money(v3)}</td><td>${money(v5)}</td><td>${delta<0?'−':'+'}${money(Math.abs(delta))}</td></tr>`}).join('')}
function syncRentNote(){if($('unit').value==='office')$('rentNote').textContent='Office rent bands reflect selected DHA Phase 1 asking listings; adjust for the exact office and lease.';else if(['lower','ground','first'].includes($('unit').value))$('rentNote').textContent='Retail rent bands are editable scenarios; fit the selected band to the unit, floor, frontage and tenant.';else $('rentNote').textContent='Set the rent bands to fit the exact unit and most relevant local comparisons.'}
function officeValid(){return Number.isInteger(n('officeUnits'))&&range('officeUnits',1,50)&&range('officeArea',1,1000000)&&range('officeRate',1,1e12)&&['officeDown','officeInstall','officeTransfer','officeVacancy','officeCosts','officeAcq'].every(id=>range(id,0,100))&&['officeRentLow','officeRentBase','officeRentHigh'].every(id=>range(id,0,1e7))&&range('officeGrowthRate',-99,100)&&Number.isInteger(n('officeMonths'))&&range('officeMonths',1,600)&&[1,3,5].includes(n('officeHorizon'))}
function officeMoney(){const units=n('officeUnits'),area=n('officeArea'),rate=n('officeRate'),total=units*area*rate;return{units,area,rate,total,totalArea:units*area,down:total*n('officeDown')/100,pool:total*n('officeInstall')/100,transfer:total*n('officeTransfer')/100,months:n('officeMonths')}}
function renderOffice(){if(!officeValid()){$('officeStatus').textContent='Please check the office inputs: positive area/rate, 1–50 offices, valid percentages and a whole-month installment period.';return}const o=officeMoney(),split=n('officeDown')+n('officeInstall')+n('officeTransfer'),balanced=Math.abs(split-100)<.001,monthly=o.pool/o.months,acqBase=o.total*(1+n('officeAcq')/100),years=n('officeHorizon'),growth=n('officeGrowthRate'),futureValue=o.total*Math.pow(1+growth/100,years),delta=futureValue-o.total;const rentData=[{key:'Low',rate:n('officeRentLow')},{key:'Base',rate:n('officeRentBase')},{key:'High',rate:n('officeRentHigh')}].map(x=>{const month=o.totalArea*x.rate,annual=month*12,net=annual*(1-n('officeVacancy')/100)*(1-n('officeCosts')/100);return{...x,month,annual,net,grossYield:o.total?annual/o.total*100:0,netYield:acqBase?net/acqBase*100:0}});const base=rentData[1];$('officePrice').textContent=money(o.total);$('officePriceWords').textContent=words(o.total);$('officeTotalArea').textContent=fmt(o.totalArea)+' sq ft';$('officeUnitCount').textContent=o.units+' office'+(o.units===1?'':'s')+' under consideration';$('offDownTotal').textContent=money(o.down);$('offDownNote').textContent=n('officeDown')+'% of portfolio value';$('offMonthlyTotal').textContent=money(monthly);$('offInstallNote').textContent=n('officeInstall')+'% pool across '+o.months+' months';$('offTransferTotal').textContent=money(o.transfer);$('offTransferNote').textContent=n('officeTransfer')+'% · DHA transfer milestone';$('offRentBaseMonth').textContent=money(base.month);$('offRentBaseNote').textContent='At PKR '+fmt(base.rate)+' / sq ft / month';$('offPricePerUnit').textContent=money(o.area*o.rate);$('offAreaTotalLine').textContent=fmt(o.totalArea)+' sq ft';$('offDownLine').textContent=money(o.down);$('offPoolLine').textContent=money(o.pool);$('offMonthlyLine').textContent=money(monthly);$('offTransferLine').textContent=money(o.transfer);$('offAllocation').textContent=split.toFixed(2)+'% · '+(balanced?'Balanced':'Review split');for(const x of rentData){const k=x.key==='Low'?'Low':x.key==='Base'?'Base':'High';$('office'+k+'Month').textContent=money(x.month);$('office'+k+'Annual').textContent=money(x.annual);$('office'+k+'Gross').textContent=percent(x.grossYield);$('office'+k+'Net').textContent=percent(x.netYield);$('office'+k+'Rate').textContent='PKR '+fmt(x.rate)}$('officeBaseAnnualTotal').textContent=money(base.annual);$('officeNetAnnual').textContent=money(base.net);$('officeNetAnnualNote').textContent='After '+n('officeVacancy')+'% downtime and '+n('officeCosts')+'% operating allowance';$('officeGrossYield').textContent=percent(base.grossYield);$('officeNetYield').textContent=percent(base.netYield);$('officeGrowthLabel').textContent=(growth>0?'+':'')+growth+'% per year';$('officeHorizonLabel').textContent=years+' year'+(years===1?'':'s');$('officeFutureValue').textContent=money(futureValue);$('officeFutureGain').textContent=(delta>=0?'+':'−')+money(Math.abs(delta));$('officeStatus').textContent='Updated live for '+o.units+' office'+(o.units===1?'':'s')+'. Enter the approved unit area, price and schedule before making an offer.'}
function summary(){const rs=rentRates(),p=price(),base=rs[1],d=n('down'),i=n('install'),mil=n('milestone'),m=n('months'),gr=n('growthRate'),y=n('horizon'),sum=d+i+mil,fv=future(gr,y),o=officeMoney(),officeRent=o.totalArea*n('officeRentBase'),officeAnnual=officeRent*12,officeNet=officeAnnual*(1-n('officeVacancy')/100)*(1-n('officeCosts')/100),officeFuture=o.total*Math.pow(1+n('officeGrowthRate')/100,n('officeHorizon'));return `MAKKAAN · AVENUE 18 — MEETING SUMMARY

SELECTED UNIT
${$('unit').selectedOptions[0].textContent} · ${fmt(n('area'))} sq ft
Indicative value: ${money(p)} (${words(p)})
Down payment: ${money(p*d/100)} (${d}%)
Installment estimate: ${money(p*i/100/m)} per month over ${m} months
${milestoneName()} milestone: ${money(p*mil/100)} (${mil}%)
Payment split: ${sum}% ${Math.abs(sum-100)<.001?'· balanced':'· please align with the approved offer'}

RETAIL RENT SCENARIOS
Market anchor: ${money(rs[0].month)}/month · ${percent(rs[0].grossYield)} gross yield
Planning case: ${money(base.month)}/month · ${percent(base.grossYield)} gross yield
Premium-positioning test: ${money(rs[2].month)}/month · ${percent(rs[2].grossYield)} gross yield
Modelled annual net rent in the planning case: ${money(base.net)} after selected allowances.

LONG-TERM VALUE SCENARIO
${gr}% annual price-change input over ${y} year(s) → modelled value ${money(fv)}. This is a what-if scenario, not a promised outcome.

OFFICE INVESTOR MODEL
${n('officeUnits')} office(s) · ${fmt(n('officeArea'))} sq ft each · combined area ${fmt(o.totalArea)} sq ft
Combined indicative value: ${money(o.total)}
Down payment: ${money(o.down)} · monthly installment: ${money(o.pool/o.months)} · DHA transfer milestone: ${money(o.transfer)}
Base rent scenario: ${money(officeRent)}/month · ${money(officeAnnual)} annual gross rent
Modelled annual net rent: ${money(officeNet)} · modelled future value at ${n('officeGrowthRate')}% for ${n('officeHorizon')} years: ${money(officeFuture)}

PROJECT & MARKET LINKS
Avenue 18: ${sourceUrls.avenue}
DHA residential plot index: ${sourceUrls.residential}
DHA commercial plot index: ${sourceUrls.commercial}
Retail rents: ${sourceUrls.retail}
Office rents: ${sourceUrls.office}

Use these scenarios to guide the conversation. Makkaan confirms the exact unit, approved rate, availability and written shop-possession / office-DHA-transfer terms before a booking.`}

function copy(text,id){const b=$(id),original=b.textContent,done=()=>{b.textContent='Copied';setTimeout(()=>b.textContent=original,1700)};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(done).catch(()=>fallback(text,b,original));else fallback(text,b,original)}function fallback(text,b,original){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');b.textContent='Copied';setTimeout(()=>b.textContent=original,1700)}catch(e){b.textContent='Copy blocked'}t.remove()}
function view(id){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.view===id));document.querySelectorAll('.page-view').forEach(v=>v.classList.toggle('active',v.id===id));if(presenting)window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.go)));
$('present').addEventListener('click',()=>{presenting=!presenting;document.body.classList.toggle('presenting',presenting);$('present').textContent=presenting?'↩ Back to editing':'◉ Present to client';$('footerStatus').textContent=presenting?'Client presentation view · assumptions remain editable':'Local scenario · no customer data';view('overview')});$('copyBrief').addEventListener('click',()=>copy(summary(),'copyBrief'));$('copyAssumptions').addEventListener('click',()=>copy(summary(),'copyAssumptions'));$('print').addEventListener('click',()=>window.print());$('reset').addEventListener('click',()=>{Object.entries(defaults).forEach(([k,v])=>$(k).value=v);Object.entries(officeDefaults).forEach(([k,v])=>$(k).value=v);syncRentNote();render();$('editStatus').textContent='Assumptions reset.'});
$('unit').addEventListener('change',()=>{const rates={lower:60000,ground:90000,first:65000,office:35000};if(rates[$('unit').value])$('rate').value=rates[$('unit').value];if($('unit').value==='office'){$('rentLow').value=125;$('rentBase').value=150;$('rentHigh').value=180;$('rentNote').textContent='Office scenario: 125 / 150 / 180 PKR per sq ft monthly, based on selected larger DHA Phase 1 office asking listings; verify the exact office and terms.'}else if(['lower','ground','first'].includes($('unit').value)){$('rentLow').value=150;$('rentBase').value=250;$('rentHigh').value=500;$('rentNote').textContent='Retail assumptions: 150 / 250 / 500 PKR per sq ft monthly. The 500 scenario is a stretch test informed by one small-unit asking advert—not verified Avenue 18 rent.'}syncRentNote();render()});
ids.filter(id=>id!=='unit').forEach(id=>$(id).addEventListener('input',render));officeIds.forEach(id=>$(id).addEventListener('input',()=>{renderOffice();save()}));try{const s=JSON.parse(localStorage.getItem('makkaanInvestorMode')||localStorage.getItem('makkaanInvestorMode054')||'{}');ids.forEach(id=>{if(s[id]!==undefined)$(id).value=s[id]});if((s.months===undefined||Number(s.months)===36)&&Number($('months').value)===36) $('months').value=30}catch(e){}try{const o=JSON.parse(localStorage.getItem('makkaanOfficeInvestor')||localStorage.getItem('makkaanOfficeInvestor055')||'{}');officeIds.forEach(id=>{if(o[id]!==undefined)$(id).value=o[id]});if((o.officeMonths===undefined||Number(o.officeMonths)===36)&&Number($('officeMonths').value)===36) $('officeMonths').value=30}catch(e){}
/* v0.6.3 — a compact live quote panel reduces manual investor calculations.
   The original detailed assumptions and presentation controls remain editable. */
function mountQuickInvestorCalculator(){
  if($('quickInvestorCalc')||!$('area')||!$('rate')||!$('months')||!$('heroPrice')||!$('officeArea')||!$('officeRate')||!$('officeMonths'))return;
  const nodeIds=['area','rate','months','heroPrice','mMonthly','officeArea','officeRate','officeMonths','officePrice'];
  const nodes=nodeIds.map(id=>$(id)).filter(Boolean);
  if(nodes.length!==nodeIds.length)return;
  let root=nodes[0].parentElement;
  while(root&&root!==document.body&&!nodes.every(node=>root.contains(node)))root=root.parentElement;
  if(!root||root===document.body||!nodes.every(node=>root.contains(node))){
    root=document.querySelector('#investorModal,#investor-mode,#investorMode,#investorOverlay,.investor-modal,.investor-shell,.investor-mode-root,[role="dialog"]');
  }
  if(!root||!nodes.every(node=>root.contains(node)))return;
  if(!$('quick-investor-calc-style')){
    const style=document.createElement('style');
    style.id='quick-investor-calc-style';
    style.textContent=[
      '#quickInvestorCalc{box-sizing:border-box;width:100%;margin:12px 0 18px;padding:16px;border:1px solid #c9dfd3;border-radius:16px;background:linear-gradient(145deg,#f4fbf7,#fff);color:#16382c;box-shadow:0 5px 18px rgba(9,70,45,.08)}',
      '#quickInvestorCalc *{box-sizing:border-box}',
      '#quickInvestorCalc .qi-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}',
      '#quickInvestorCalc .qi-eyebrow{font-size:10px;font-weight:900;letter-spacing:.12em;color:#14744d;text-transform:uppercase}',
      '#quickInvestorCalc h2{margin:4px 0;font-size:19px;line-height:1.25;color:#143b2b}',
      '#quickInvestorCalc .qi-sub{margin:0;color:#4e6a5e;font-size:12px;line-height:1.45}',
      '#quickInvestorCalc .qi-pill{display:inline-flex;align-items:center;border-radius:99px;background:#dff3e8;color:#15583b;padding:6px 10px;font-size:11px;font-weight:800;white-space:nowrap}',
      '#quickInvestorCalc .qi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}',
      '#quickInvestorCalc .qi-field{display:flex;flex-direction:column;gap:5px;min-width:0;font-size:11px;font-weight:800;color:#2f5142}',
      '#quickInvestorCalc input,#quickInvestorCalc select{width:100%;min-width:0;border:1px solid #bfd3c7;border-radius:9px;background:#fff;color:#173d2d;padding:9px 10px;font-family:inherit;font-size:13px;font-weight:600;min-height:38px}',
      '#quickInvestorCalc input:focus,#quickInvestorCalc select:focus{outline:2px solid #319b6d;outline-offset:1px}',
      '#quickInvestorCalc .qi-assumptions{font-size:11px;line-height:1.5;color:#3d5b4e;background:#eaf6ef;border-radius:9px;padding:9px 10px;margin:8px 0 12px}',
      '#quickInvestorCalc .qi-results{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}',
      '#quickInvestorCalc .qi-result{padding:11px;border-radius:11px;background:#fff;border:1px solid #dce9e1;min-width:0}',
      '#quickInvestorCalc .qi-result span{display:block;color:#60756b;font-size:10px;font-weight:800;margin-bottom:6px}',
      '#quickInvestorCalc .qi-result strong{display:block;color:#164a32;font-size:clamp(13px,1.8vw,19px);line-height:1.25;overflow-wrap:anywhere}',
      '#quickInvestorCalc .qi-result small{display:block;margin-top:5px;font-size:10px;line-height:1.35;color:#64776d}',
      '#quickInvestorCalc .qi-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px}',
      '#quickInvestorCalc .qi-copy{border:0;border-radius:9px;padding:10px 13px;background:#08754a;color:#fff;font-weight:800;cursor:pointer}',
      '#quickInvestorCalc .qi-status{font-size:11px;line-height:1.4;color:#296047}',
      '#quickInvestorCalc .qi-status.qi-warn{color:#8b5a12}',
      '#quickInvestorCalc .qi-foot{font-size:10px;line-height:1.45;color:#5b7065;margin:10px 0 0}',
      '@media(max-width:760px){#quickInvestorCalc .qi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#quickInvestorCalc .qi-results{grid-template-columns:repeat(2,minmax(0,1fr))}#quickInvestorCalc{padding:12px}}'
    ].join('');
    document.head.appendChild(style);
  }
  const quick=document.createElement('section');
  quick.id='quickInvestorCalc';
  quick.setAttribute('aria-label','Quick Investor Calculator');
  quick.innerHTML=[
    '<div class="qi-header"><div><div class="qi-eyebrow">Investor Mode · Quick Calculator</div><h2>Get the numbers in seconds</h2><p class="qi-sub">Enter the area and approved rate. The payment breakdown updates automatically.</p></div><span class="qi-pill" id="qiModeBadge">Retail / shop</span></div>',
    '<div class="qi-grid">',
    '<label class="qi-field" for="qiUnit">Unit type<select id="qiUnit"><option value="lower">Lower Ground shop</option><option value="ground">Ground Floor shop</option><option value="first">First Floor shop</option><option value="office">Office</option></select></label>',
    '<label class="qi-field" id="qiOfficeCountWrap" for="qiOfficeUnits" hidden>Number of offices<input id="qiOfficeUnits" type="number" min="1" max="50" step="1" value="1"></label>',
    '<label class="qi-field" for="qiArea"><span id="qiAreaLabel">Unit area (sq ft)</span><input id="qiArea" type="number" min="1" step="1" inputmode="decimal"></label>',
    '<label class="qi-field" for="qiRate"><span id="qiRateLabel">Approved rate (PKR / sq ft)</span><input id="qiRate" type="number" min="1" step="1000" inputmode="decimal"></label>',
    '<label class="qi-field" for="qiMonths">Payment duration (months)<input id="qiMonths" type="number" min="1" max="600" step="1" inputmode="numeric"></label>',
    '</div>',
    '<div class="qi-assumptions">Current split: <strong><span id="qiDownPct">25</span>% upfront · <span id="qiInstallPct">65</span>% installments · <span id="qiMilestonePct">10</span>% possession / transfer</strong>. These use the detailed model assumptions and remain editable.</div>',
    '<div class="qi-results" aria-live="polite">',
    '<div class="qi-result"><span>Total investment</span><strong id="qiTotal">—</strong><small id="qiTotalContext">Area × rate</small></div>',
    '<div class="qi-result"><span>Upfront payment</span><strong id="qiDown">—</strong><small id="qiDownContext">Down payment</small></div>',
    '<div class="qi-result"><span>Monthly installment</span><strong id="qiMonthly">—</strong><small id="qiMonthlyContext">Installment pool ÷ months</small></div>',
    '<div class="qi-result"><span>Final milestone</span><strong id="qiMilestone">—</strong><small id="qiMilestoneContext">Possession / transfer</small></div>',
    '</div>',
    '<div class="qi-actions"><button id="qiCopy" class="qi-copy" type="button">Copy investor summary</button><span id="qiStatus" class="qi-status" role="status">Live estimates · verify approved terms.</span></div>',
    '<p class="qi-foot">Presentation controls remain editable. These are arithmetic estimates only; confirm the exact unit, approved price, written payment terms and charges before quoting. Detailed rental and future-value scenarios remain available below.</p>'
  ].join('');
  /* Keep the compact calculator above the two-column editor/presentation layout.
     In this app, .layout is a CSS grid; inserting the card inside it would squeeze
     the calculator into the left column and push the presentation down. */
  const layout=document.querySelector('.layout');
  if(layout){layout.insertAdjacentElement('beforebegin',quick);}
  else {
    const header=root.querySelector(':scope > .investor-header,:scope > .modal-header,:scope > .im-header,:scope > header,:scope > .topbar');
    if(header)header.insertAdjacentElement('afterend',quick);else root.insertBefore(quick,root.firstElementChild);
  }

  function pushValue(source,mirror){const original=$(source),input=$(mirror);if(!original||!input)return;original.value=input.value;original.dispatchEvent(new Event('input',{bubbles:true}));}
  function quickSync(){
    const office=$('unit').value==='office';
    const areaId=office?'officeArea':'area',rateId=office?'officeRate':'rate',monthsId=office?'officeMonths':'months';
    const downId=office?'officeDown':'down',installId=office?'officeInstall':'install',milestoneId=office?'officeTransfer':'milestone';
    $('qiUnit').value=$('unit').value;
    $('qiOfficeCountWrap').hidden=!office;
    $('qiAreaLabel').textContent=office?'Area per office (sq ft)':'Unit area (sq ft)';
    $('qiModeBadge').textContent=office?'Office portfolio':'Retail / shop';
    $('qiArea').value=$(areaId).value;$('qiRate').value=$(rateId).value;$('qiMonths').value=$(monthsId).value;
    if(office)$('qiOfficeUnits').value=$('officeUnits').value;
    const area=Number($(areaId).value),rate=Number($(rateId).value),units=office?Number($('officeUnits').value):1,months=Number($(monthsId).value);
    const downPct=Number($(downId).value),installPct=Number($(installId).value),milestonePct=Number($(milestoneId).value);
    const total=area*rate*units,down=total*downPct/100,pool=total*installPct/100,milestone=total*milestonePct/100,monthly=pool/months;
    $('qiDownPct').textContent=fmt(downPct);$('qiInstallPct').textContent=fmt(installPct);$('qiMilestonePct').textContent=fmt(milestonePct);
    const sane=[area,rate,units,months,downPct,installPct,milestonePct,total,down,pool,milestone,monthly].every(Number.isFinite)&&area>0&&rate>0&&units>=1&&months>=1;
    $('qiTotal').textContent=sane?money(total):'Check inputs';$('qiDown').textContent=sane?money(down):'—';$('qiMonthly').textContent=sane?money(monthly):'—';$('qiMilestone').textContent=sane?money(milestone):'—';
    $('qiTotalContext').textContent=sane?(office?fmt(units)+' office(s) × '+fmt(area)+' sq ft × rate':fmt(area)+' sq ft × rate'):'Enter a positive area and rate';
    $('qiDownContext').textContent=fmt(downPct)+'% of total value';$('qiMonthlyContext').textContent=fmt(installPct)+'% pool over '+fmt(months)+' months';$('qiMilestoneContext').textContent=fmt(milestonePct)+'% · '+(office?'DHA transfer model':'possession model');
    const split=downPct+installPct+milestonePct,balanced=Math.abs(split-100)<.001;
    $('qiStatus').textContent=balanced?'Payment split totals 100% · live estimate.':'Payment split totals '+split.toFixed(2)+'% · review detailed settings.';
    $('qiStatus').classList.toggle('qi-warn',!balanced);
  }
  function copyQuickSummary(){
    const office=$('unit').value==='office',areaId=office?'officeArea':'area',rateId=office?'officeRate':'rate',monthsId=office?'officeMonths':'months';
    const downId=office?'officeDown':'down',installId=office?'officeInstall':'install',milestoneId=office?'officeTransfer':'milestone';
    const area=Number($(areaId).value),rate=Number($(rateId).value),units=office?Number($('officeUnits').value):1,total=area*rate*units;
    const downPct=Number($(downId).value),installPct=Number($(installId).value),milestonePct=Number($(milestoneId).value),months=Number($(monthsId).value);
    const line=office?fmt(units)+' office(s) · '+fmt(area)+' sq ft each · combined '+fmt(area*units)+' sq ft':fmt(area)+' sq ft '+$('unit').selectedOptions[0].textContent;
    copy('MAKKAAN · INVESTOR QUICK SUMMARY\n'+line+'\nApproved rate: '+money(rate)+' / sq ft\nIndicative total value: '+money(total)+'\nDown payment ('+downPct+'%): '+money(total*downPct/100)+'\nInstallment pool ('+installPct+'%): '+money(total*installPct/100)+'\nMonthly installment over '+months+' months: '+money(total*installPct/100/months)+'\n'+(office?'DHA transfer':'Possession')+' milestone ('+milestonePct+'%): '+money(total*milestonePct/100)+'\n\nIllustrative arithmetic only. Confirm approved unit details and written terms before quoting.','qiCopy');
  }
  $('qiUnit').addEventListener('change',()=>{$('unit').value=$('qiUnit').value;$('unit').dispatchEvent(new Event('change',{bubbles:true}));quickSync()});
  $('qiArea').addEventListener('input',()=>{const office=$('unit').value==='office';pushValue(office?'officeArea':'area','qiArea');quickSync()});
  $('qiRate').addEventListener('input',()=>{const office=$('unit').value==='office';pushValue(office?'officeRate':'rate','qiRate');quickSync()});
  $('qiMonths').addEventListener('input',()=>{const office=$('unit').value==='office';pushValue(office?'officeMonths':'months','qiMonths');quickSync()});
  $('qiOfficeUnits').addEventListener('input',()=>{pushValue('officeUnits','qiOfficeUnits');quickSync()});
  $('qiCopy').addEventListener('click',copyQuickSummary);
  [...ids,...officeIds].forEach(id=>{if($(id)){ $(id).addEventListener('input',quickSync);$(id).addEventListener('change',quickSync);}});
  if($('reset'))$('reset').addEventListener('click',()=>{if(window.requestAnimationFrame)requestAnimationFrame(quickSync);else quickSync()});
  quickSync();
}
mountQuickInvestorCalculator();

syncRentNote();render();
})();
