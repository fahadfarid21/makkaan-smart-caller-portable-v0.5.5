(() => {
  'use strict';
  if (window.__makkaanKpiCoachLoaded) return;
  window.__makkaanKpiCoachLoaded = true;
  const DAY_KEY = 'msKpiDaily';
  const MONTH_KEY = 'msKpiMonthly';
  const SETTINGS_KEY = 'msKpiSettings';
  const defaults = { callsTarget: 40, followUpsTarget: 5, meetingsTarget: 12, valueTarget: 850000 };
  const $ = (id) => document.getElementById(id);
  const dayKey = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
  const monthKey = () => dayKey().slice(0,7);
  const num = (v, fallback=0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const clamp = (v,min,max) => Math.max(min,Math.min(max,num(v,min)));
  const fmt = (v) => new Intl.NumberFormat('en-PK',{maximumFractionDigits:0}).format(Math.max(0,Math.round(num(v))));
  const blankDay = () => ({followUps:0, meetings:0, leadsAdded:0, opportunities:0});
  let daily = {}, monthly = {}, settings = {...defaults}, callLog = [];
  function style() {
    if ($('ms-kpi-style')) return;
    const s=document.createElement('style'); s.id='ms-kpi-style';
    s.textContent=`
      #ms-kpi-coach{margin:12px 0 14px;padding:15px;border:1px solid #d7e5de;border-radius:15px;background:linear-gradient(145deg,#fff 0%,#f6faf7 100%);box-shadow:0 5px 18px rgba(24,45,59,.045);color:#192e3b}
      #ms-kpi-coach *{box-sizing:border-box} #ms-kpi-coach .mk-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px}
      #ms-kpi-coach .mk-eyebrow{margin:0 0 3px;font-size:10px;letter-spacing:.13em;font-weight:900;color:#236553}
      #ms-kpi-coach h2{margin:0;font-size:16px;letter-spacing:-.02em} #ms-kpi-coach .mk-note{margin:4px 0 0;color:#667987;font-size:11px;line-height:1.45}
      #ms-kpi-coach .mk-date{white-space:nowrap;border:1px solid #dce7e1;background:#fff;border-radius:20px;padding:5px 8px;font-size:10px;color:#526c60;font-weight:800}
      #ms-kpi-coach .mk-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0}
      #ms-kpi-coach .mk-metric{min-width:0;padding:10px 9px;border:1px solid #e1e9e5;border-radius:11px;background:#fff}
      #ms-kpi-coach .mk-label{display:block;color:#667987;font-size:10px;line-height:1.35;min-height:26px}
      #ms-kpi-coach .mk-value{display:block;margin:3px 0;font-size:18px;font-weight:900;letter-spacing:-.04em;color:#1d3c32}
      #ms-kpi-coach .mk-sub{font-size:10px;color:#718179}
      #ms-kpi-coach .mk-track{height:5px;background:#e8efeb;border-radius:99px;overflow:hidden;margin-top:7px}
      #ms-kpi-coach .mk-track span{display:block;height:100%;background:#2e765e;border-radius:99px;transition:width .2s}
      #ms-kpi-coach .mk-focus{padding:10px 11px;border-radius:10px;background:#edf5f0;color:#245442;font-size:12px;font-weight:750;margin:10px 0}
      #ms-kpi-coach .mk-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
      #ms-kpi-coach button{font:inherit;cursor:pointer}
      #ms-kpi-coach .mk-action{border:1px solid #d4e2da;border-radius:9px;background:#fff;color:#244c3d;padding:9px 8px;font-size:11px;font-weight:800;text-align:left}
      #ms-kpi-coach .mk-action:hover{background:#eef6f1;border-color:#9fbfae}
      #ms-kpi-coach .mk-settings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px;padding-top:11px;border-top:1px solid #e1e9e5}
      #ms-kpi-coach label{display:block;font-size:10px;color:#667987;font-weight:750}
      #ms-kpi-coach input{width:100%;margin-top:4px;border:1px solid #d8e3dd;border-radius:8px;padding:7px 8px;background:#fff;color:#192e3b;font:inherit;font-size:12px;min-width:0}
      #ms-kpi-coach .mk-value-row{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:8px}
      #ms-kpi-coach .mk-foot{font-size:10px;color:#74847c;line-height:1.45;margin:9px 0 0}
      @media(max-width:360px){#ms-kpi-coach{padding:11px}#ms-kpi-coach .mk-grid{gap:5px}#ms-kpi-coach .mk-value{font-size:16px}#ms-kpi-coach .mk-label{font-size:9px}}
    `;
    document.head.append(s);
  }
  function ensurePanel() {
    if ($('ms-kpi-coach')) return;
    const desk=$('view-desk'); if(!desk) return;
    const panel=document.createElement('section'); panel.id='ms-kpi-coach'; panel.setAttribute('aria-label','Daily KPI coach');
    panel.innerHTML=`
      <div class="mk-head"><div><p class="mk-eyebrow">DAILY EXECUTION</p><h2>Keep the day moving</h2><p class="mk-note">Small, verified actions beat a busy-looking day.</p></div><span class="mk-date" id="mk-date"></span></div>
      <div class="mk-grid">
        <div class="mk-metric"><span class="mk-label">CRM call outcomes saved</span><strong class="mk-value" id="mk-calls">0 / 40</strong><div class="mk-track"><span id="mk-calls-bar"></span></div><span class="mk-sub" id="mk-calls-sub">Verified saves only</span></div>
        <div class="mk-metric"><span class="mk-label">Follow-ups completed</span><strong class="mk-value" id="mk-followups">0 / 5</strong><div class="mk-track"><span id="mk-followups-bar"></span></div><span class="mk-sub">Log after completion</span></div>
        <div class="mk-metric"><span class="mk-label">Meetings booked this month</span><strong class="mk-value" id="mk-meetings">0 / 12</strong><div class="mk-track"><span id="mk-meetings-bar"></span></div><span class="mk-sub" id="mk-meetings-sub">Monthly pace</span></div>
      </div>
      <div class="mk-focus" id="mk-focus" aria-live="polite">Next best action: complete your first verified call update.</div>
      <div class="mk-actions">
        <button type="button" class="mk-action" data-kpi="followUps">+ Log external follow-up</button>
        <button type="button" class="mk-action" data-kpi="meetings">+ Meeting booked</button>
        <button type="button" class="mk-action" data-kpi="leadsAdded">+ Lead added to CRM</button>
        <button type="button" class="mk-action" data-kpi="opportunities">+ Qualified opportunity</button>
      </div>
      <div class="mk-settings">
        <label>Daily call-outcome target<input id="mk-target-calls" type="number" min="1" max="300" step="1"></label>
        <label>Daily follow-up target<input id="mk-target-followups" type="number" min="1" max="100" step="1"></label>
        <label>Monthly meetings target<input id="mk-target-meetings" type="number" min="1" max="100" step="1"></label>
        <div class="mk-value-row"><label>Monthly personal target (PKR)<input id="mk-target-value" type="number" min="1" max="100000000000" step="1000"></label><label>Progress so far (PKR)<input id="mk-value-progress" type="number" min="0" max="100000000000" step="1000"></label></div>
      </div>
      <p class="mk-foot">Call outcomes count only after the CRM save is verified. Mark a reminder completed in Follow-up Command Center to count it automatically; use the manual follow-up button only for completed actions tracked outside the planner. Log meetings, CRM additions and opportunities only when actually completed. Keep the monthly target basis consistent with your manager’s KPI definition. Data stays in this browser profile.</p>`;
    const grid=desk.querySelector('.kpi-grid');
    if(grid&&grid.parentElement===desk) grid.insertAdjacentElement('afterend',panel); else desk.prepend(panel);
    panel.addEventListener('click',async e=>{const b=e.target.closest('[data-kpi]');if(!b)return;const key=b.dataset.kpi;const d=dayKey();daily[d]={...blankDay(),...(daily[d]||{})};daily[d][key]=Math.max(0,num(daily[d][key]))+1;await chrome.storage.local.set({[DAY_KEY]:daily});render();});
    [['mk-target-calls','callsTarget',1,300],['mk-target-followups','followUpsTarget',1,100],['mk-target-meetings','meetingsTarget',1,100],['mk-target-value','valueTarget',1,100000000000]].forEach(([id,key,min,max])=>$(id).addEventListener('change',async e=>{settings[key]=clamp(e.target.value,min,max);await chrome.storage.local.set({[SETTINGS_KEY]:settings});render();}));
    $('mk-value-progress').addEventListener('change',async e=>{const m=monthKey();monthly[m]={...(monthly[m]||{}),valueProgress:clamp(e.target.value,0,100000000000)};await chrome.storage.local.set({[MONTH_KEY]:monthly});render();});
  }
  function bar(id,value,target){const el=$(id);if(el)el.style.width=Math.min(100,Math.max(0,value/Math.max(1,target)*100))+'%';}
  function render(){
    if(!$('ms-kpi-coach')) return;
    const d=dayKey(),m=monthKey(),today=daily[d]||blankDay(),thisMonth=Object.entries(daily).filter(([k])=>k.startsWith(m)).reduce((sum,[,v])=>sum+num(v.meetings),0);
    const todayCalls=callLog.filter(c=>c&&c.day===d&&c.mode==='call'&&c.verified===true).length;
    const connected=callLog.filter(c=>c&&c.day===d&&c.mode==='call'&&c.verified===true&&c.outcome==='Connected').length;
    const fups=num(today.followUps),mt=num(settings.meetingsTarget,12),ct=num(settings.callsTarget,40),ft=num(settings.followUpsTarget,5),progress=num((monthly[m]||{}).valueProgress),vt=num(settings.valueTarget,850000);
    $('mk-date').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
    $('mk-calls').textContent=`${todayCalls} / ${ct}`; $('mk-calls-sub').textContent=`${connected} connected · ${Math.max(0,ct-todayCalls)} to target`;bar('mk-calls-bar',todayCalls,ct);
    $('mk-followups').textContent=`${fups} / ${ft}`;bar('mk-followups-bar',fups,ft);
    $('mk-meetings').textContent=`${thisMonth} / ${mt}`;bar('mk-meetings-bar',thisMonth,mt);$('mk-meetings-sub').textContent=thisMonth>=mt?'Monthly target reached':`${mt-thisMonth} more to monthly target`;
    $('mk-target-calls').value=ct;$('mk-target-followups').value=ft;$('mk-target-meetings').value=mt;$('mk-target-value').value=vt;$('mk-value-progress').value=progress;
    const focus=$('mk-focus');
    if(todayCalls<ct)focus.textContent=`Next best action: log the outcome of your next real call in CRM. ${ct-todayCalls} call outcomes remain today.`;
    else if(fups<ft)focus.textContent=`Call target reached. Clear ${ft-fups} follow-up(s) next, then review tomorrow's priority leads.`;
    else if(thisMonth<mt)focus.textContent=`Daily execution targets are on track. Book the next suitable client meeting; ${mt-thisMonth} remain this month.`;
    else focus.textContent='Targets reached. Review hot opportunities and set tomorrow’s first three priorities.';
    const valueLabel=$('mk-value-progress').parentElement; const existing=valueLabel.querySelector('.mk-value-summary');if(existing)existing.remove();
    const summary=document.createElement('span');summary.className='mk-value-summary';summary.style.cssText='display:block;font-size:10px;color:#667987;margin-top:4px';summary.textContent=`${fmt(progress)} / ${fmt(vt)} PKR · ${Math.round(Math.min(100,progress/Math.max(1,vt)*100))}%`;valueLabel.append(summary);
  }
  async function init(){
    if(!chrome?.storage?.local)return;
    style();ensurePanel();
    const data=await chrome.storage.local.get([DAY_KEY,MONTH_KEY,SETTINGS_KEY,'msCallLog']);
    daily=data[DAY_KEY]&&typeof data[DAY_KEY]==='object'?data[DAY_KEY]:{};
    monthly=data[MONTH_KEY]&&typeof data[MONTH_KEY]==='object'?data[MONTH_KEY]:{};
    settings={...defaults,...(data[SETTINGS_KEY]||{})};callLog=Array.isArray(data.msCallLog)?data.msCallLog:[];
    if(!daily[dayKey()])daily[dayKey()]=blankDay();
    await chrome.storage.local.set({[DAY_KEY]:daily,[MONTH_KEY]:monthly,[SETTINGS_KEY]:settings});
    render();
    chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;if(changes[DAY_KEY])daily=changes[DAY_KEY].newValue||{};if(changes[MONTH_KEY])monthly=changes[MONTH_KEY].newValue||{};if(changes[SETTINGS_KEY])settings={...defaults,...(changes[SETTINGS_KEY].newValue||{})};if(changes.msCallLog)callLog=Array.isArray(changes.msCallLog.newValue)?changes.msCallLog.newValue:[];render();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init().catch(()=>{}),{once:true});else init().catch(()=>{});
})();