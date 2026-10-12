(() => {
  'use strict';
  if (window.__makkaanFollowUpWorkflowV061) return;
  window.__makkaanFollowUpWorkflowV061 = true;
  const $ = id => document.getElementById(id);
  const KEY = 'msFollowUpPlannerV061';
  const today = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let items = [];
  const dueLabel = d => d < today() ? 'OVERDUE' : d === today() ? 'DUE TODAY' : 'UPCOMING';
  function addStyles() {
    if ($('ms-follow-style')) return;
    const s = document.createElement('style'); s.id = 'ms-follow-style';
    s.textContent = `
      #ms-follow-panel{margin:12px 0;padding:14px;border:1px solid #d5e5dc;border-radius:14px;background:#fff;color:#193b30;box-shadow:0 4px 16px rgba(20,45,35,.05)}
      #ms-follow-panel *{box-sizing:border-box} #ms-follow-panel h2{font-size:16px;margin:0 0 4px}
      #ms-follow-panel .mf-sub{font-size:11px;line-height:1.45;color:#65796f;margin:0 0 12px}
      #ms-follow-panel .mf-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      #ms-follow-panel label{font-size:10px;font-weight:800;color:#536c60;display:block}
      #ms-follow-panel input,#ms-follow-panel select,#ms-follow-panel textarea{display:block;width:100%;min-width:0;margin-top:4px;padding:8px;border:1px solid #d7e3dc;border-radius:8px;background:#fff;color:#18382e;font:inherit;font-size:12px}
      #ms-follow-panel .mf-wide{grid-column:1/-1}
      #ms-follow-panel .mf-add{width:100%;margin-top:9px;padding:10px;border:0;border-radius:9px;background:#086644;color:#fff;font-weight:850;cursor:pointer}
      #ms-follow-panel .mf-list{display:grid;gap:7px;margin-top:12px}
      #ms-follow-panel .mf-item{border:1px solid #e0e9e4;border-radius:10px;padding:10px;background:#fbfdfb}
      #ms-follow-panel .mf-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
      #ms-follow-panel .mf-title{font-size:12px;font-weight:850;overflow-wrap:anywhere}
      #ms-follow-panel .mf-badge{font-size:9px;font-weight:900;padding:4px 6px;border-radius:20px;background:#eaf4ed;color:#276144;white-space:nowrap}
      #ms-follow-panel .mf-badge.overdue{background:#fff0e8;color:#9b3d1a}
      #ms-follow-panel .mf-meta{font-size:10px;color:#63766c;margin-top:5px;line-height:1.4}
      #ms-follow-panel .mf-actions{display:flex;gap:6px;margin-top:8px}
      #ms-follow-panel .mf-actions button{flex:1;border:1px solid #d4e1d9;background:#fff;border-radius:7px;padding:7px;color:#244b3a;font-size:10px;font-weight:800;cursor:pointer}
      #ms-follow-panel .mf-empty{padding:12px;border:1px dashed #d4e1d9;border-radius:9px;color:#718078;font-size:11px}
      #commentFreshNote{margin:5px 0 8px;padding:8px 9px;border-radius:8px;background:#edf6f0;color:#285642;font-size:10px;line-height:1.45}
      @media(max-width:350px){#ms-follow-panel{padding:10px}#ms-follow-panel .mf-grid{gap:6px}}
    `;
    document.head.append(s);
  }
  async function persist() {
    try { await chrome.storage.local.set({[KEY]: items}); } catch (_) {}
    render();
  }
  async function openCrmLead(leadId) {
    if (!/^CRM-LEAD-\d{4}-\d+$/i.test(String(leadId || ''))) return;
    const url = 'https://prop-360.com/app/lead/' + leadId;
    const [active] = await chrome.tabs.query({active:true,lastFocusedWindow:true});
    let tabs = [];
    try { tabs = await chrome.tabs.query({url:'https://prop-360.com/app/lead/*',windowId:active?.windowId}); } catch (_) {}
    const target = tabs.find(t => t.url && /^https:\/\/prop-360\.com\/app\/lead\/CRM-LEAD-\d{4}-\d+/.test(t.url));
    if (target?.id != null) await chrome.tabs.update(target.id,{url,active:true});
    else await chrome.tabs.create({url,active:true,windowId:active?.windowId});
  }
  function render() {
    const host = $('ms-follow-list'); if (!host) return;
    const priorityRank = {High:0, Normal:1, Low:2};
    const open = items.filter(x => !x.done).sort((a,b) => a.date.localeCompare(b.date) || (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1));
    const done = items.filter(x => x.done).slice(-3).reverse();
    const shown = [...open, ...done];
    host.innerHTML = shown.length ? shown.map(x => {
      const label = x.done ? 'COMPLETED' : dueLabel(x.date);
      const cls = !x.done && x.date < today() ? 'mf-badge overdue' : 'mf-badge';
      const canOpenLead = /^CRM-LEAD-\d{4}-\d+$/i.test(String(x.lead || ''));
      return `<article class="mf-item"><div class="mf-top"><div class="mf-title">${esc(x.title || 'Follow-up')}</div><span class="${cls}">${label}</span></div><div class="mf-meta">${esc(x.date)} · ${esc(x.channel)} · ${esc(x.priority)} priority<br>${esc(x.action)}${x.lead ? '<br>Lead reference: '+esc(x.lead) : ''}</div><div class="mf-actions">${x.done ? '' : '<button type="button" data-follow-done="'+esc(x.id)+'">Mark completed</button>'}${canOpenLead ? '<button type="button" data-follow-open="'+esc(x.id)+'">Open CRM lead</button>' : ''}<button type="button" data-follow-delete="${esc(x.id)}">Remove</button></div></article>`;
    }).join('') : '<div class="mf-empty">No follow-ups planned yet. Add the next promised action after each real conversation.</div>';
    const due = open.filter(x => x.date <= today()).length;
    const count = $('ms-follow-count'); if (count) count.textContent = due ? due + ' due / overdue' : open.length + ' upcoming';
  }
  function ensurePanel() {
    if ($('ms-follow-panel')) return;
    const desk = $('view-desk'); if (!desk) return;
    const panel = document.createElement('section'); panel.id='ms-follow-panel'; panel.setAttribute('aria-label','Follow-up planner');
    panel.innerHTML = `
      <div class="mf-top"><div><h2>Follow-up command center</h2><p class="mf-sub">Every conversation ends with a clear next step, date and channel. Reminders stay in this browser; this does not create CRM tasks automatically.</p></div><span id="ms-follow-count" class="mf-badge">0 upcoming</span></div>
      <form id="ms-follow-form"><div class="mf-grid">
        <div class="mf-wide"><label for="ms-follow-title">Lead / short label (optional)</label><input id="ms-follow-title" maxlength="100" placeholder="e.g. Client — Avenue 18 Zoom"></div>
        <div><label for="ms-follow-date">Follow-up date</label><input id="ms-follow-date" type="date" required value="${today()}"></div>
        <div><label for="ms-follow-channel">Channel</label><select id="ms-follow-channel"><option>Call</option><option>WhatsApp</option><option>Zoom / Meeting</option><option>Email</option><option>Internal task</option></select></div>
        <div><label for="ms-follow-priority">Priority</label><select id="ms-follow-priority"><option>High</option><option selected>Normal</option><option>Low</option></select></div>
        <div><label for="ms-follow-lead">CRM lead ID (optional)</label><input id="ms-follow-lead" maxlength="80" placeholder="Reference only"></div>
        <div class="mf-wide"><label for="ms-follow-action">Exact next action / promise</label><textarea id="ms-follow-action" rows="2" maxlength="500" required placeholder="What will you send, ask, confirm or schedule?"></textarea></div>
      </div><button class="mf-add" type="submit">+ Save follow-up reminder</button></form>
      <div id="ms-follow-list" class="mf-list"></div>
    `;
    const deskKpi = desk.querySelector('#ms-kpi-coach');
    if (deskKpi) deskKpi.insertAdjacentElement('afterend', panel); else desk.prepend(panel);
    panel.addEventListener('submit', async e => {
      if (e.target.id !== 'ms-follow-form') return;
      e.preventDefault();
      const action = $('ms-follow-action').value.trim(); if (!action) return;
      syncLeadReference();
      items.push({id: 'fu-'+Date.now()+'-'+Math.random().toString(36).slice(2,7), title:$('ms-follow-title').value.trim(), date:$('ms-follow-date').value || today(), channel:$('ms-follow-channel').value, priority:$('ms-follow-priority').value, lead:$('ms-follow-lead').value.trim(), action, done:false, createdAt:new Date().toISOString()});
      $('ms-follow-action').value=''; $('ms-follow-title').value=''; $('ms-follow-lead').value='';
      await persist();
    });
    panel.addEventListener('click', async e => {
      const done = e.target.closest('[data-follow-done]'); const del = e.target.closest('[data-follow-delete]'); const open = e.target.closest('[data-follow-open]');
      if (open) { const item=items.find(x=>x.id===open.dataset.followOpen); if(item && /^CRM-LEAD-\d{4}-\d+$/i.test(String(item.lead || ''))) { try { await openCrmLead(item.lead); } catch (_) {} } }
      if (done) { const item=items.find(x=>x.id===done.dataset.followDone); if(item && !item.done){item.done=true;item.completedAt=new Date().toISOString();await incrementCompletedFollowUpKpi();await persist();} }
      if (del) { items=items.filter(x=>x.id!==del.dataset.followDelete); await persist(); }
    });
  }
  function setupFreshComment() {
    const field = $('comment');
    if (!field || field.dataset.freshNoteReady) return;
    field.dataset.freshNoteReady = '1';
    const tip = document.createElement('div');
    tip.id = 'commentFreshNote';
    tip.textContent = 'Fresh note only. The CRM Comments field is replaced with this text when you confirm the update. Earlier saved entries remain in the activity timeline. No timestamp is added. Your typed draft is never cleared just because you focus the box.';
    field.insertAdjacentElement('afterend', tip);
  }
  async function incrementCompletedFollowUpKpi() {
    try {
      const d = new Date();
      const key = [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
      const data = await chrome.storage.local.get(['msKpiDaily']);
      const daily = data.msKpiDaily && typeof data.msKpiDaily === 'object' ? data.msKpiDaily : {};
      const todayData = daily[key] && typeof daily[key] === 'object' ? daily[key] : {};
      todayData.followUps = Math.max(0, Number(todayData.followUps) || 0) + 1;
      daily[key] = todayData;
      await chrome.storage.local.set({msKpiDaily: daily});
    } catch (_) {}
  }
  function syncLeadReference() {
    const title = $('ms-follow-title'), lead = $('ms-follow-lead');
    const leadId = ($('updateLeadId')?.textContent || $('activeLeadId')?.textContent || '').trim();
    const leadTitle = ($('updateLeadTitle')?.textContent || $('activeLeadTitle')?.textContent || '').trim();
    if (lead && /^CRM-LEAD-\d{4}-\d+$/i.test(leadId) && (!lead.value || lead.value === lead.dataset.lastAutoValue)) {
      lead.value = leadId; lead.dataset.autoValue = leadId; lead.dataset.lastAutoValue = leadId;
    }
    if (title && leadTitle && !/^No existing lead detected|^Checking active tab|^Could not inspect/i.test(leadTitle) && (!title.value || title.value === title.dataset.lastAutoValue)) {
      title.value = leadTitle; title.dataset.autoValue = leadTitle; title.dataset.lastAutoValue = leadTitle;
    }
  }
  async function init() {
    if (!chrome?.storage?.local) return;
    addStyles(); ensurePanel(); setupFreshComment(); syncLeadReference();
    const data = await chrome.storage.local.get([KEY]);
    items = Array.isArray(data[KEY]) ? data[KEY] : [];
    render();
    chrome.storage.onChanged.addListener((changes, area) => { if (area==='local' && changes[KEY]) { items=Array.isArray(changes[KEY].newValue)?changes[KEY].newValue:[];render(); }});
    const observer = new MutationObserver(() => { ensurePanel(); setupFreshComment(); syncLeadReference(); });
    observer.observe(document.body, {childList:true,subtree:true});
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>init().catch(()=>{}),{once:true}); else init().catch(()=>{});
})();
