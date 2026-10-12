# Makkaan Smart Caller Complete Portable v0.6.2

A portable Chromium extension combining the Makkaan Sales Sidecar, Investor Mode, local lead queue, calculator, pre-call briefs, guided CRM updates and a daily execution coach.

## What's new in 0.6.2
- Investor Mode payment schedule defaults to 30 months (2.5 years) for retail and office models; previously saved 36-month defaults are migrated to 30 months. Editable month counts remain available.
- Top navigation tabs use enforced high-contrast text and active/hover/focus states for reliable readability in Brave's side panel.
- Fresh-note workflow: the CRM Comments field is replaced with only the newly typed/refined note. The extension never appends the old field value or adds a timestamp; earlier saved Lead Update entries remain in the activity timeline. Save verification uses stable field read-back and a new activity snapshot when available.
- Follow-up command center with date, channel, priority, exact next action, current lead auto-reference, one-click open of the referenced CRM record, overdue/due/upcoming sorting, and mark-complete/remove actions. Completing a planner reminder automatically increments the daily follow-up KPI. Reminders are local and do not create CRM tasks.
- Update form remains human-confirmed and Qualification Status remains out of scope.

## What's new in 0.6.0
- Daily KPI coach for verified CRM call outcomes, follow-ups, meetings booked, leads added and qualified opportunities.
- Editable daily targets (40 call outcomes and 5 follow-ups by default), monthly meeting target (12 by default), and monthly personal target amount (PKR 850,000 by default).
- KPI data stays in browser-local extension storage. Daily and monthly views roll over automatically by local date; historical counters remain local.
- Existing CRM writes remain supervised; call outcomes count only after the extension confirms the CRM save.
- Investor Mode, calculator and existing sidecar workflows are preserved from v0.5.5.

## Install
1. Extract the release ZIP to a permanent folder.
2. Open `brave://extensions` or `chrome://extensions`.
3. Enable Developer mode and choose **Load unpacked**.
4. Select the extracted folder containing `manifest.json`.
5. Keep the folder in place while the extension is installed.

## Daily routine
1. Import your approved lead CSV into Queue.
2. Work the lead list and record the real call outcome in the CRM through the guided update flow. Put only the fresh note in the Comments box; the prior history is already in CRM activities.
3. After every meaningful conversation, add a follow-up reminder with a date, channel, priority and concrete next action. Mark it completed only after the action is done.
4. Mark planner reminders complete to count follow-ups automatically. Use the manual KPI action only for completed follow-ups tracked outside the planner; log meetings, CRM additions and qualified opportunities only after they actually happen.
5. Keep the monthly target measure consistent with the KPI definition used by your manager.
6. Use Investor Mode for client presentations, but verify current approved unit rates, availability, payment terms, rental evidence and assumptions before quoting.

## Privacy and safety
- No auto-dialing or unsupervised CRM writes.
- The daily coach does not read or send client details to an AI service.
- Call outcome counts require a verified CRM save; other KPI counters are manual and can be inaccurate if entered inaccurately.
- AI Notes may send text to Google only when the user configures and explicitly uses that feature. Review copied content before pasting it into any third-party service.
- Financial/rent/growth calculations are scenarios, not guaranteed returns. Verify current facts before client use.

## Testing
The release workflow runs JSON and JavaScript syntax checks and packages a ZIP artifact. Live Chrome/Brave UI behavior and real CRM writes still require the manual checklist and an authorized test lead.
