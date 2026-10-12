# Makkaan Smart Caller Portable v0.6.0

The v0.5.5 portable base archive is retained in this repository. The `feat/smart-caller-v0.6.0-daily-kpi-coach` branch adds maintained source overrides for the Daily KPI Coach and a GitHub Actions build workflow that overlays the changes, checks the extension entry points and JavaScript syntax, and publishes a portable ZIP artifact.

**New build:** `Makkaan-Smart-Caller-Complete-Portable-v0.6.0.zip` (available from the branch's Actions workflow artifact after the workflow passes).

Install by extracting the generated ZIP and loading its folder via `brave://extensions` or `chrome://extensions` with Developer mode enabled. Do not move the folder after loading it.

The daily KPI coach tracks verified CRM call outcomes and manual follow-up/meeting/lead/opportunity events. The monthly target amount is editable and must use the same basis as your manager's KPI definition. CRM writes remain supervised; no auto-dialing or unsupervised CRM writes are added.

The workflow's automated checks do not prove live Chrome/Brave rendering or real CRM save behavior. Complete `MANUAL-TEST-CHECKLIST.txt` before production use.
