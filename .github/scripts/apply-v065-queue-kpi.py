#!/usr/bin/env python3
"""Apply v0.6.5 Queue persistence, Done controls, shortcuts and compact layout to the seeded package."""
from pathlib import Path
import json, re, sys
root = Path(sys.argv[1] if len(sys.argv) > 1 else "build/package")
def replace_once(text, old, new, label):
    n=text.count(old)
    if n!=1: raise SystemExit(label+": expected one match, found "+str(n))
    return text.replace(old,new,1)
def replace_regex(text, pattern, replacement, label):
    out,n=re.subn(pattern,lambda _m:replacement,text,count=1,flags=re.S|re.M)
    if n!=1: raise SystemExit(label+": expected one match, found "+str(n))
    return out
manifest=json.loads((root/"manifest.json").read_text(encoding="utf-8"))
if manifest.get("version")!="0.6.5": raise SystemExit("v0.6.5 queue patch refuses unexpected manifest version")
sidepath=root/"sidepanel.js"; s=sidepath.read_text(encoding="utf-8")
s=replace_once(s,"const STORE_KEYS = ['msRoster', 'msSelectedLeadId', 'msCallLog', 'msDailyTarget', 'geminiApiKey', 'geminiModel', 'msProjectContext', 'msCalculatorState'];","const STORE_KEYS = ['msRoster', 'msSelectedLeadId', 'msCallLog', 'msDailyTarget', 'geminiApiKey', 'geminiModel', 'msProjectContext', 'msCalculatorState', 'msDoneLeads', 'msUiState'];","persistent queue storage keys")
s=replace_once(s,"let activeView = 'desk';","let activeView = 'desk';\nlet doneLeadIds = new Set();\nlet queueMode = 'active';\nlet uiSaveTimer = null;\nlet uiState = { view: 'desk', search: '', quality: 'all', follow: 'all', queueMode: 'active', queueScroll: 0, pageScroll: 0 };","persistent Queue state")
new_card=r"""function createLeadCard(lead, withSelect = false) {
  const isDone = doneLeadIds.has(lead.id);
  const card = elem('div', 'lead-card' + (selectedLeadId === lead.id ? ' selected' : '') + (isDone ? ' lead-done' : ''));
  card.tabIndex = 0; card.setAttribute('role', 'group');
  const head = elem('div', 'cardhead'), main = elem('div', 'grow');
  main.append(elem('div', 'name', (lead.name || 'Unnamed lead') + ' · ' + lead.id));
  main.append(elem('div', 'meta', (lead.quality || 'Quality unknown') + ' · ' + (lead.status || 'Status unknown') + ' · ' + (lead.phone || 'No phone in imported data')));
  const score = elem('span', 'score', isDone ? 'DONE' : String(lead.score));
  if (withSelect) {
    const doneLabel = elem('label', 'lead-done-toggle'), checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; checkbox.checked = isDone;
    checkbox.setAttribute('aria-label', (isDone ? 'Move back to active: ' : 'Mark done: ') + (lead.name || lead.id));
    checkbox.dataset.doneId = lead.id;
    checkbox.addEventListener('click', event => event.stopPropagation());
    checkbox.addEventListener('change', async event => { event.stopPropagation(); await setLeadDone(lead.id, checkbox.checked); });
    doneLabel.append(checkbox, elem('span', '', 'Done')); head.append(doneLabel, main, score);
  } else head.append(main, score);
  card.append(head); card.append(elem('div', 'reason', lead.reasons.slice(0, 2).join(' · ')));
  if (lead.followDateRaw) card.append(elem('div', 'meta', 'Follow-up date in snapshot: ' + lead.followDateRaw));
  if (withSelect) {
    const controls = elem('div', 'lead-card-controls');
    const button = elem('button', 'btn btn-light full', selectedLeadId === lead.id ? 'Selected' : 'Select lead');
    button.type = 'button'; button.addEventListener('click', event => { event.stopPropagation(); selectLead(lead.id); });
    controls.append(button); card.append(controls); card.addEventListener('click', () => selectLead(lead.id));
    card.addEventListener('keydown', event => { if (event.target === card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selectLead(lead.id); } });
  } else { const button=elem('button','textbtn','Open in CRM →'); button.type='button'; button.addEventListener('click',()=>openLeadInCRM(lead.id)); card.append(button); }
  return card;
}"""
s=replace_regex(s,r"function createLeadCard\(lead, withSelect = false\) \{[\s\S]*?\n\}",new_card,"Queue card Done control")
new_queue=r"""function renderQueue() {
  const list=$('queueList'), scroll=$('queue-scroll'); if(!list||!scroll)return;
  const previousScroll=scroll.scrollTop; clearElement(list);
  const ranked=rankRoster().filter(l=>!isClosed(l)), active=ranked.filter(l=>!doneLeadIds.has(l.id)), done=ranked.filter(l=>doneLeadIds.has(l.id));
  const query=normalize($('queueSearch')?.value||''), qf=$('qualityFilter')?.value||'all', ff=$('followFilter')?.value||'all';
  const source=queueMode==='done'?done:queueMode==='all'?ranked:active;
  filteredQueue=source.filter(l=>{if(query&&![l.id,l.name,l.phone].some(v=>normalize(v).includes(query)))return false;if(qf!=='all'&&normalize(l.quality)!==normalize(qf))return false;if(ff!=='all'&&l.bucket!==ff)return false;return true;});
  $('queueCount').textContent=(queueMode==='done'?'Done':queueMode==='all'?'All leads':'Active queue')+' · '+filteredQueue.length;
  $('queueActiveCount').textContent=String(active.length); $('queueDoneCount').textContent=String(done.length); $('queueAllCount').textContent=String(ranked.length);
  $('queueRemaining').textContent=active.length+' active lead'+(active.length===1?'':'s')+' remaining · '+done.length+' marked done';
  document.querySelectorAll('[data-qmode]').forEach(button=>{const current=button.dataset.qmode===queueMode;button.classList.toggle('active',current);button.setAttribute('aria-pressed',String(current));});
  const hasSelection=!!selectedLeadId&&roster.some(l=>l.id===selectedLeadId);$('openSelected').disabled=!hasSelection;$('briefSelected').disabled=!hasSelection;
  if(!roster.length)list.append(elem('div','empty','Import a CSV exported from the approved Google Sheet.'));
  else if(!filteredQueue.length)list.append(elem('div','empty',queueMode==='done'?'No leads marked Done yet. Check a lead to move it here.':'No leads match these filters.'));
  else {filteredQueue.slice(0,200).forEach(l=>list.append(createLeadCard(l,true)));if(filteredQueue.length>200)list.append(elem('div','hint','Showing the first 200 of '+filteredQueue.length+'. Narrow with search or filters.'));}
  scroll.scrollTop=Math.min(previousScroll,Math.max(0,scroll.scrollHeight-scroll.clientHeight));saveUiStateSoon();
}
function selectLead(id){selectedLeadId=id;chrome.storage.local.set({msSelectedLeadId:id}).catch(()=>{});renderQueue();}
async function setLeadDone(id,isDone){
  if(!roster.some(lead=>lead.id===id))return;const lead=roster.find(item=>item.id===id);
  if(isDone&&!window.confirm('Mark '+(lead.name||id)+' as Done in this local queue? This does not update the CRM.')){renderQueue();return;}
  if(isDone)doneLeadIds.add(id);else doneLeadIds.delete(id);
  await chrome.storage.local.set({msDoneLeads:[...doneLeadIds]});renderQueue();
}
async function persistUiStateNow(){
  const scroll=$('queue-scroll');
  uiState={...uiState,view:activeView,search:$('queueSearch')?.value||'',quality:$('qualityFilter')?.value||'all',follow:$('followFilter')?.value||'all',queueMode,queueScroll:scroll?.scrollTop||0,pageScroll:window.scrollY||0};
  await chrome.storage.local.set({msUiState:uiState});
}
function saveUiStateSoon(){if(uiSaveTimer)clearTimeout(uiSaveTimer);uiSaveTimer=setTimeout(()=>{persistUiStateNow().catch(()=>{});},140);}
function isTypingTarget(target){if(!target||!(target instanceof Element))return false;return !!target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],dialog');}
function showShortcuts(){const dialog=$('shortcutsDialog'),template=$('shortcutsTpl'),content=$('shortcutsContent');if(!dialog||!template||!content)return;content.replaceChildren(template.content.cloneNode(true));if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
function markSelectedDoneFromShortcut(){if(!selectedLeadId||!roster.some(l=>l.id===selectedLeadId))return;setLeadDone(selectedLeadId,!doneLeadIds.has(selectedLeadId));}"""
s=replace_regex(s,r"function renderQueue\(\) \{[\s\S]*?\n\}\nfunction selectLead\(id\) \{[\s\S]*?\n\}",new_queue,"Active/Done/All Queue modes")
s=replace_once(s,"  selectedLeadId = saved.msSelectedLeadId || '';\n  if (typeof saved.msProjectContext","  selectedLeadId = saved.msSelectedLeadId || '';\n  doneLeadIds = new Set(Array.isArray(saved.msDoneLeads) ? saved.msDoneLeads.filter(id => typeof id === 'string') : []);\n  uiState = { ...uiState, ...(saved.msUiState && typeof saved.msUiState === 'object' ? saved.msUiState : {}) };\n  activeView = ['desk','queue','calculator','brief','update','notes','guide'].includes(uiState.view) ? uiState.view : 'desk';\n  queueMode = ['active','done','all'].includes(uiState.queueMode) ? uiState.queueMode : 'active';\n  if (typeof saved.msProjectContext","restore Queue state")
s=replace_once(s,"  if (selectedLeadId && !roster.some(l => l.id === selectedLeadId)) selectedLeadId = '';","  if (selectedLeadId && !roster.some(l => l.id === selectedLeadId)) selectedLeadId = '';\n  if ($('queueSearch')) $('queueSearch').value = String(uiState.search || '');\n  if ($('qualityFilter')) $('qualityFilter').value = ['all','Favorite','very Hot','Hot','Average','Cold'].includes(uiState.quality) ? uiState.quality : 'all';\n  if ($('followFilter')) $('followFilter').value = ['all','overdue','today','future','no-date'].includes(uiState.follow) ? uiState.follow : 'all';","restore search and filters")
s=replace_once(s,"  renderDesk(); renderQueue();\n}\nasync function importCsv","  goToView(activeView);\n  renderDesk(); renderQueue();\n  requestAnimationFrame(() => { const q = $('queue-scroll'); if (q) q.scrollTop = Math.max(0, Number(uiState.queueScroll) || 0); window.scrollTo(0, Math.max(0, Number(uiState.pageScroll) || 0)); });\n}\nasync function importCsv","restore saved view and scroll")
s=replace_once(s,"  activeView = view;\n  document.querySelectorAll('.navbtn')","  activeView = view;\n  saveUiStateSoon();\n  document.querySelectorAll('.navbtn')","persist active view")
s=replace_once(s,"async function openLeadInCRM(id) {\n  if (!/^CRM-LEAD-\\d{4}-\\d+$/i.test(id)) { setMessage('importStatus', 'Invalid lead ID; no navigation performed.', 'bad'); return; }\n  const url = ","async function openLeadInCRM(id) {\n  if (!/^CRM-LEAD-\\d{4}-\\d+$/i.test(id)) { setMessage('importStatus', 'Invalid lead ID; no navigation performed.', 'bad'); return; }\n  try { await persistUiStateNow(); } catch (_) { /* navigation remains safe if state persistence fails */ }\n  const url = ","persist Queue before opening CRM")
new_call="""      if (mode === 'call') {
        const logged = await window.MakkaanKpi.recordVerifiedCall({ eventId: 'call:' + currentLead.id + ':' + Date.now() + ':' + Math.random().toString(36).slice(2,8), leadId: currentLead.id, outcome: status, mode: mode, verified: true, at: new Date().toISOString() });
        callLog = Array.isArray(logged?.callLog) ? logged.callLog : callLog;
      }
"""
s=replace_regex(s,r"      if \(mode === 'call'\) \{\n        callLog\.push\(\{ at: new Date\(\)\.toISOString\(\), day: localDay\(\), leadId: currentLead\.id, mode, outcome: status, verified: true \}\);\n        await chrome\.storage\.local\.set\(\{ msCallLog: callLog \}\);\n      \}\n",new_call,"single verified KPI writer")
new_listener="""chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  let deskDirty = false, queueDirty = false;
  if (changes.msRoster) { roster = Array.isArray(changes.msRoster.newValue) ? changes.msRoster.newValue : []; deskDirty = true; queueDirty = true; }
  if (changes.msCallLog) { callLog = Array.isArray(changes.msCallLog.newValue) ? changes.msCallLog.newValue : []; deskDirty = true; }
  if (changes.msDailyTarget) { dailyTarget = Number(changes.msDailyTarget.newValue || 40); deskDirty = true; }
  if (changes.msSelectedLeadId) { selectedLeadId = String(changes.msSelectedLeadId.newValue || ''); queueDirty = true; }
  if (changes.msDoneLeads) { doneLeadIds = new Set(Array.isArray(changes.msDoneLeads.newValue) ? changes.msDoneLeads.newValue : []); deskDirty = true; queueDirty = true; }
  if (deskDirty) renderDesk();
  if (queueDirty) renderQueue();
});"""
s=replace_regex(s,r"chrome\.storage\.onChanged\.addListener\(\(changes, area\) => \{[\s\S]*?\n\}\);",new_listener,"ignore unrelated storage writes")
s=replace_once(s,"$('queueSearch').addEventListener('input', renderQueue);\n$('qualityFilter').addEventListener('change', renderQueue);\n$('followFilter').addEventListener('change', renderQueue);","""$('queueSearch').addEventListener('input', () => { renderQueue(); saveUiStateSoon(); });
$('qualityFilter').addEventListener('change', () => { renderQueue(); saveUiStateSoon(); });
$('followFilter').addEventListener('change', () => { renderQueue(); saveUiStateSoon(); });
document.querySelectorAll('[data-qmode]').forEach(button => button.addEventListener('click', () => { queueMode = button.dataset.qmode; renderQueue(); saveUiStateSoon(); }));
$('queue-scroll').addEventListener('scroll', saveUiStateSoon, { passive: true });
window.addEventListener('scroll', saveUiStateSoon, { passive: true });
$('shortcutsBtn').addEventListener('click', showShortcuts);
$('shortcutsQueueBtn').addEventListener('click', showShortcuts);
$('closeShortcuts').addEventListener('click', () => $('shortcutsDialog').close());
$('shortcutsDialog').addEventListener('click', event => { if (event.target === $('shortcutsDialog')) $('shortcutsDialog').close(); });
document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || isTypingTarget(event.target)) return;
  if (event.key === '?' && !$('shortcutsDialog').open) { event.preventDefault(); showShortcuts(); return; }
  if (event.key === 'Escape' && $('shortcutsDialog').open) { $('shortcutsDialog').close(); return; }
  if (event.shiftKey && key.toLowerCase() === 'd') { event.preventDefault(); markSelectedDoneFromShortcut(); return; }
  if (event.shiftKey) return;
  const views = { '1':'desk','2':'queue','3':'calculator','4':'brief','5':'update','6':'notes','7':'guide', q:'queue' };
  if (views[key]) { event.preventDefault(); goToView(views[key]); }
  else if (key === 'o' && selectedLeadId) { event.preventDefault(); openLeadInCRM(selectedLeadId); }
});""","safe keyboard shortcuts")
s=replace_once(s,"await chrome.storage.local.remove(['msRoster', 'msRosterImportedAt', 'msRosterImportName', 'msSelectedLeadId']);","doneLeadIds.clear();\n  await chrome.storage.local.remove(['msRoster', 'msRosterImportedAt', 'msRosterImportName', 'msSelectedLeadId', 'msDoneLeads']);","clear local Done state")
s=replace_regex(s,r"loadStoredState\(\)\.then\(refreshActiveLead\)\.catch\(e => setMessage\('leadMessage', \x60Initialization issue: \$\{e\.message \|\| e\}\x60, 'bad'\)\);","loadStoredState().then(() => { if (['desk','brief','update'].includes(activeView)) refreshActiveLead(); }).catch(e => setMessage('leadMessage', 'Initialization issue: ' + (e.message || e), 'bad'));","preserve saved view after startup")
sidepath.write_text(s,encoding="utf-8")

csspath=root/"sidepanel.css"; css=csspath.read_text(encoding="utf-8")
if "v0.6.5 compact shell, independently scrolling persistent queue" not in css:
    css += r"""

/* v0.6.5 compact shell, independently scrolling persistent queue and visible Done controls */
.head-actions{display:flex;gap:6px;align-items:center;flex:0 0 auto}
.queue-heading-actions{display:flex;gap:8px;align-items:center}
.queue-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:8px 0 4px}
.queue-mode{border:1px solid #cbdcd1;border-radius:9px;background:#fff;color:#244b3a;padding:8px 5px;font-size:11px;font-weight:850;cursor:pointer}
.queue-mode span{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 4px;margin-left:2px;border-radius:20px;background:#eef3ef;color:#234d3b}
.queue-mode.active{background:#075b3b;border-color:#075b3b;color:#fff}
.queue-mode.active span{background:#fff;color:#075b3b}
.queue-remaining{margin:4px 1px 7px;color:#314f40;font-size:11px;font-weight:800}
.queue-scroll{max-height:min(52vh,620px);min-height:145px;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;border:1px solid #dfe8e2;border-radius:10px;padding:7px;background:#f8fbf9;scroll-behavior:auto}
.queue-scroll:focus-visible{outline:2px solid #65a197;outline-offset:1px}
.queue-scroll .lead-list{gap:7px}
.queue-scroll .lead-card{padding:9px}
.queue-scroll .lead-card .name{font-size:12px}
.queue-scroll .lead-card .meta{font-size:10px;color:#53665c}
.queue-scroll .lead-card .reason{font-size:10px;color:#285e4b}
.lead-card-controls{display:grid;grid-template-columns:minmax(0,1fr);gap:7px;align-items:center;margin-top:8px}
.lead-done-toggle{display:flex;align-items:center;gap:4px;margin:0!important;padding:5px 5px;border:1px solid #cbdcd1;border-radius:8px;background:#f5faf6;color:#1e4935!important;font-size:11px!important;font-weight:850!important;white-space:nowrap}
.lead-done-toggle input{margin:0;accent-color:#16734e;width:16px;height:16px;flex:0 0 auto}
.lead-done-toggle span{font-size:10px}
.queue-scroll .cardhead{gap:6px}
.queue-scroll .cardhead .grow{min-width:0}
.queue-scroll .cardhead .score{padding:3px 5px}
.queue-scroll .lead-card.lead-done{background:#edf5ef;border-color:#b5cfbd}
.queue-scroll .lead-card.lead-done .name{text-decoration:line-through;text-decoration-color:#769984}
.queue-scroll .lead-card .score{font-size:10px}
#shortcutsDialog{width:min(420px,calc(100vw - 34px));max-width:calc(100vw - 34px);border:1px solid #cbdcd1;border-radius:14px;padding:14px;color:#193b30;box-shadow:0 15px 60px #102b1e44}
#shortcutsDialog::backdrop{background:#10251b88}
.shortcuts-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.shortcuts-dialog-head h2{font-size:16px}
#shortcutsContent{font-size:12px;line-height:1.5;color:#40584b}
.shortcut-list{margin:10px 0 0;padding:0}
.shortcut-list>div{display:grid;grid-template-columns:82px minmax(0,1fr);gap:8px;padding:8px 0;border-top:1px solid #e5eee8}
.shortcut-list dt{font-weight:900;color:#075b3b}
.shortcut-list dd{margin:0}
@media(max-height:620px){.queue-scroll{max-height:44vh}}
@media(max-width:330px){.queue-mode{font-size:10px;padding:7px 2px}.queue-scroll .lead-done-toggle span{display:none}.queue-scroll .lead-done-toggle{padding:5px}.lead-card-controls{grid-template-columns:1fr}}
"""
    csspath.write_text(css,encoding="utf-8")
print("PASS — v0.6.5 Queue persistence, Done tabs, shortcuts and compact layout applied.")
