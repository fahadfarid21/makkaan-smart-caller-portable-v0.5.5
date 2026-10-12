(function () {
  'use strict';
  if (document.getElementById('makk-chatgpt-bridge')) return;

  const promptIntro = [
    'You are the senior writing partner for Fahad Farid, a Makkaan real-estate investment consultant in Pakistan. Produce specific, client-ready work from the active Sidecar tab, not generic advice.',
    'First identify the active Sidecar view from the supplied context and follow the matching task: Brief = lead-specific pre-call plan; Update or AI Notes = one concise factual fresh CRM note or client follow-up; Queue or Desk = prioritized next-action plan; Calc or Investor Mode = clear client-ready explanation of the displayed numbers and assumptions; Guide = improve the selected script or workflow.',
    'Use the lead’s actual recorded requirement, latest dated activity, previous response, open tasks, objection, promised action and follow-up timing when present. Do not ask the client to repeat facts already recorded. If the context does not support a detail, say exactly what must be checked instead of filling space.',
    'Write in a polished, warm, consultative Pakistani sales voice: natural Roman Urdu and simple English where useful, respectful and persuasive without pressure. Make the main draft ready to use, not an outline. Avoid buzzwords, filler, fake familiarity and generic openers.',
    'Never invent a call or meeting, client intent, budget, funds, urgency, price, availability, approvals, discounts, possession date, rental yield, capital appreciation or guaranteed return. Treat unknown facts as VERIFY IN CRM/OFFICIAL MATERIAL. Do not claim to have checked live data.',
    'If the recorded need is residential housing or otherwise not a fit for Avenue 18 commercial property, state the mismatch and suggest a respectful discovery question rather than forcing a commercial pitch. Do not pitch The Square or another project unless Fahad explicitly asks.',
    'Do not send messages, change the CRM, or take actions. Draft only. For a CRM note, do not add a timestamp; preserve only facts supplied by the user. For WhatsApp, make it concise and personalize it to the actual next step.',
    '',
    'ACTIVE SIDECAR CONTEXT (review for accuracy before using):',
    '{{PASTE OR REVIEW THE COPIED VISIBLE SECTION BELOW}}',
    '',
    'Return the best artifact for the active view first. Then add only what is useful: one next action, one key risk/unknown to verify, and a shorter alternative if it would genuinely help. Do not force every section into every task.'
  ].join('\n');

  const css = `
    #makk-chatgpt-bridge { margin: 10px 0 14px; padding: 13px 14px; border: 1px solid #dce8e2; border-radius: 14px; background: #fff; box-shadow: 0 8px 24px rgba(24,45,59,.045); color: #182d3b; }
    #makk-chatgpt-bridge .mcb-top { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
    #makk-chatgpt-bridge .mcb-kicker { color:#236553; font-size:11px; font-weight:850; letter-spacing:.12em; text-transform:uppercase; }
    #makk-chatgpt-bridge .mcb-title { margin-top:4px; font-size:15px; font-weight:800; letter-spacing:-.015em; }
    #makk-chatgpt-bridge .mcb-chip { border:1px solid #e4ebe7; background:#f8faf9; color:#64747d; border-radius:999px; padding:5px 8px; font-size:10px; white-space:nowrap; }
    #makk-chatgpt-bridge .mcb-copy { margin:6px 0 10px; color:#64747d; font-size:12.5px; line-height:1.55; }
    #makk-chatgpt-bridge .mcb-actions { display:flex; gap:8px; flex-wrap:wrap; }
    #makk-chatgpt-bridge button { min-height:36px; border:1px solid #dce8e2; border-radius:9px; padding:8px 11px; font-size:12px; line-height:1.35; font-weight:800; cursor:pointer; }
    #makk-chatgpt-bridge .mcb-primary { color:#fff; background:#236553; border-color:#236553; }
    #makk-chatgpt-bridge .mcb-secondary { color:#236553; background:#fff; }
    #makk-chatgpt-bridge button:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(24,45,59,.09); }
    #makk-chatgpt-bridge .mcb-note { margin-top:10px; color:#64747d; font-size:11px; line-height:1.5; }
    #makk-chatgpt-bridge .mcb-note strong { color:#354e59; }
    #makk-chatgpt-bridge button:focus-visible { outline:3px solid rgba(35,101,83,.24); outline-offset:2px; }
    @media (max-width: 360px) { #makk-chatgpt-bridge .mcb-actions button { font-size:11.5px; } #makk-chatgpt-bridge .mcb-chip { white-space:normal; } }
  `;

  function redactObviousIdentifiers(value) {
    return String(value || '')
      .replace(/\bCRM-LEAD-[A-Z0-9-]+\b/gi, '[CRM LEAD ID]')
      .replace(/\b\d{5}-\d{7}-\d\b/g, '[CNIC]')
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
      .replace(/(?:\+?92|0092|0)[\s().-]*(?:3\d{2}|[1-9]\d{1,2})[\s().-]*\d{3,4}[\s().-]*\d{3,4}\b/g, '[PHONE]')
      .replace(/\b(?:\d[ -]*?){15,19}\b/g, '[LONG ID]');
  }

  function getAnchor() {
    const investor = document.getElementById('investor-mode-shortcut');
    if (investor) return { element: investor, position: 'afterend' };
    const nav = Array.from(document.querySelectorAll('nav')).find(n => n.querySelector('.navbtn'));
    if (nav) return { element: nav, position: 'afterend' };
    const firstView = document.querySelector('[id^="view-"], [data-panel], .view-panel');
    if (firstView) return { element: firstView, position: 'beforebegin' };
    return null;
  }

  function makeCard() {
    const style = document.createElement('style');
    style.id = 'makk-chatgpt-bridge-style';
    style.textContent = css;
    document.head.appendChild(style);

    const card = document.createElement('section');
    card.id = 'makk-chatgpt-bridge';
    card.setAttribute('aria-label', 'ChatGPT sales assistant bridge');
    card.innerHTML = `
      <div class="mcb-top">
        <div><div class="mcb-kicker">ChatGPT Assist</div><div class="mcb-title">Your sales copilot, no API key</div></div>
        <span class="mcb-chip">Manual · User-controlled</span>
      </div>
      <p class="mcb-copy">Open ChatGPT in a separate tab, then paste a prepared prompt. Nothing is sent automatically.</p>
      <div class="mcb-actions">
        <button type="button" class="mcb-primary" id="mcb-open">Open ChatGPT ↗</button>
        <button type="button" class="mcb-secondary" id="mcb-copy-context">Copy visible section + prompt</button>
        <button type="button" class="mcb-secondary" id="mcb-copy-prompt">Copy starter prompt</button>
      </div>
      <div class="mcb-note"><strong>Privacy:</strong> Copying is explicit. Common phone, email, CNIC and CRM lead-ID patterns are masked before copying; names, addresses and distinctive facts may remain. Review clipboard content before pasting. ChatGPT plan limits still apply; this bridge makes no API calls.</div>`;

    const anchor = getAnchor();
    if (!anchor) return;
    anchor.element.insertAdjacentElement(anchor.position, card);

    card.querySelector('#mcb-open').addEventListener('click', openChatGPT);
    card.querySelector('#mcb-copy-prompt').addEventListener('click', () => copyText(promptIntro, 'Starter prompt copied. Open ChatGPT and paste it.'));
    card.querySelector('#mcb-copy-context').addEventListener('click', async () => {
      const ok = window.confirm('This will copy a redacted version of the visible Sidecar section and a sales-assistant prompt. Obvious phone numbers, emails, CNICs and CRM lead IDs are masked where recognized, but names, addresses and distinctive details may remain. Nothing is sent automatically. Review the clipboard before pasting. Continue?');
      if (!ok) return;
      const rawContext = extractVisiblePanel();
      const context = redactObviousIdentifiers(rawContext);
      const pack = promptIntro.replace('{{PASTE OR REVIEW THE COPIED VISIBLE SECTION BELOW}}', context || '[No active view text found. Paste only the details you want to share.]');
      await copyText(pack, 'Prepared prompt copied. Review it, then paste into ChatGPT.');
    });
  }

  function openChatGPT() {
    // Use a user-gesture anchor so popup blockers treat this as an intentional tab open.
    const link = document.createElement('a');
    link.href = 'https://chatgpt.com/';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('ChatGPT requested in a separate tab. Copy a prompt here, then paste it there.');
  }

  async function copyText(text, message) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const box = document.createElement('textarea');
        box.value = text;
        box.setAttribute('readonly', 'readonly');
        box.style.position = 'fixed'; box.style.opacity = '0'; box.style.left = '-9999px';
        document.body.appendChild(box); box.select();
        const ok = document.execCommand('copy');
        box.remove();
        if (!ok) throw new Error('Clipboard write was blocked by Chrome.');
      }
      showToast(message);
    } catch (error) {
      showToast('Could not copy automatically. Try selecting the prompt button again or copy text manually.');
      console.warn('[Makkaan ChatGPT Bridge]', error);
    }
  }

  function extractVisiblePanel() {
    const candidates = Array.from(document.querySelectorAll('[id^="view-"], [data-panel], .view-panel'));
    const visible = candidates.filter(el => {
      const cs = getComputedStyle(el);
      return !el.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0;
    });
    const panel = visible.find(el => el.classList.contains('active')) || visible.sort((a,b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length)[0];
    if (!panel) return '';

    const clone = panel.cloneNode(true);
    clone.querySelectorAll('button,script,style,nav,#investor-mode-shortcut,#makk-chatgpt-bridge,[aria-hidden="true"]').forEach(el => el.remove());
    const viewId = panel.id || panel.getAttribute('data-panel') || 'unknown-view';
    const viewTitle = (panel.querySelector('h1,h2,h3')?.innerText || panel.getAttribute('aria-label') || viewId).replace(/\s+/g, ' ').trim();
    let content = 'ACTIVE SIDECAR VIEW: ' + viewId + '\nSECTION TITLE: ' + viewTitle + '\n\n' + (clone.innerText || clone.textContent || '').replace(/\n{3,}/g, '\n\n').trim();

    // Include useful form values, while skipping contact identifiers and secret-like fields by default.
    const values = [];
    for (const field of Array.from(panel.querySelectorAll('input,textarea,select'))) {
      if (field.disabled || field.type === 'password' || field.type === 'hidden') continue;
      const meta = [field.name, field.id, field.getAttribute('aria-label'), field.placeholder, field.closest('label')?.innerText].filter(Boolean).join(' ');
      if (/phone|mobile|whatsapp|email|e-mail|cnic|passport|password|token|secret|api.?key|account.?number/i.test(meta)) continue;
      if (field.type === 'checkbox' || field.type === 'radio') continue;
      const value = String(field.value || '').trim();
      if (!value) continue;
      const labelEl = field.labels && field.labels.length ? field.labels[0].innerText : (field.getAttribute('aria-label') || field.placeholder || field.name || field.id || 'Field');
      values.push(labelEl.replace(/\s+/g,' ').trim() + ': ' + value.slice(0, 500));
    }
    if (values.length) content += '\n\nVisible editable values (contact identifiers skipped where identifiable):\n' + values.join('\n');
    return content.slice(0, 9000) || '[The active section did not contain readable text. Paste only the relevant, approved details.]';
  }

  function showToast(message) {
    const old = document.getElementById('mcb-toast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.id = 'mcb-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    Object.assign(toast.style, {
      position:'fixed', zIndex:'2147483647', bottom:'14px', left:'14px', right:'14px',
      padding:'12px 14px', border:'1px solid #dce8e2', borderRadius:'11px',
      background:'#fff', color:'#182d3b', boxShadow:'0 12px 30px rgba(24,45,59,.14)',
      font:'13px/1.5 Inter, Segoe UI, Arial, sans-serif'
    });
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3500);
  }

  function init() {
    if (!document.body || document.getElementById('makk-chatgpt-bridge')) return;
    makeCard();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
