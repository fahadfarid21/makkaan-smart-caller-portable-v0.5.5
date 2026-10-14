#!/usr/bin/env python3
"""Static release invariants for the Makkaan Sales Sidecar portable extension."""
import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else "build/package").resolve()
errors = []

def require(condition, message):
    if not condition:
        errors.append(message)

def read(rel):
    p = root / rel
    if not p.is_file():
        errors.append(f"Missing required file: {rel}")
        return ""
    try:
        return p.read_text(encoding="utf-8-sig")
    except Exception as exc:
        errors.append(f"Cannot read {rel}: {exc}")
        return ""

manifest_text = read("manifest.json")
try:
    manifest = json.loads(manifest_text)
except Exception as exc:
    manifest = {}
    errors.append(f"manifest.json is invalid JSON: {exc}")

require(manifest.get("manifest_version") == 3, "manifest_version must be 3")
require(manifest.get("name") == "Makkaan Sales Sidecar", "unexpected extension name")
require(manifest.get("version") == "0.6.4", "manifest version must be 0.6.4")

# Required source and documentation files.
for rel in [
    "background.js", "content.js", "sidepanel.html", "sidepanel.js",
    "sidepanel.css", "options.html", "options.js", "options.css",
    "investor-mode.html", "investor-mode.js", "calculator.js",
    "follow-up-workflow.js", "daily-kpi-coach.js", "chatgpt-bridge.js",
    "MANUAL-TEST-CHECKLIST.txt", "PERFORMED-TESTS.txt",
    "INSTALL.txt", "RELEASE-REPORT.txt", "PERMISSIONS-AND-PRIVACY.txt",
]:
    require((root / rel).is_file(), f"required package file missing: {rel}")

# Every manifest entry point must resolve within the package.
paths = []
bg = manifest.get("background") or {}
if bg.get("service_worker"): paths.append(bg["service_worker"])
if manifest.get("options_page"): paths.append(manifest["options_page"])
if (manifest.get("side_panel") or {}).get("default_path"): paths.append(manifest["side_panel"]["default_path"])
for entry in manifest.get("content_scripts") or []:
    paths.extend(entry.get("js") or [])
    paths.extend(entry.get("css") or [])
paths.extend((manifest.get("icons") or {}).values())
paths.extend(((manifest.get("action") or {}).get("default_icon") or {}).values())
for rel in paths:
    require((root / rel).is_file(), f"manifest path does not exist: {rel}")

# Local JS/CSS/HTML references in HTML must exist. Remote URLs are intentionally ignored.
for html in root.glob("*.html"):
    source = html.read_text(encoding="utf-8-sig", errors="replace")
    for rel in re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', source, flags=re.I):
        if not re.match(r"^(?:[a-z]+:|//|#)", rel, flags=re.I):
            require((html.parent / rel).resolve().is_file(), f"{html.name} references missing script {rel}")
    for rel in re.findall(r'<link[^>]+href=["\']([^"\']+)["\']', source, flags=re.I):
        if not re.match(r"^(?:[a-z]+:|//|#)", rel, flags=re.I):
            if rel.endswith((".css", ".js", ".png", ".svg", ".woff", ".woff2")):
                require((html.parent / rel).resolve().is_file(), f"{html.name} references missing local asset {rel}")

sidepanel = read("sidepanel.html")
content = read("content.js")
sidepanel_js = read("sidepanel.js")
follow = read("follow-up-workflow.js")
kpi = read("daily-kpi-coach.js")
investor = read("investor-mode.js")
readme = read("README.md")
install = read("INSTALL.txt")
report = read("RELEASE-REPORT.txt")
manual = read("MANUAL-TEST-CHECKLIST.txt")
performed = read("PERFORMED-TESTS.txt")

require('title="Installed extension version">0.6.4</span>' in sidepanel, "visible side panel version badge must show 0.6.4")
require("const newComment = note || null;" in content, "fresh-note replacement invariant missing")
require("oldComment" not in content and "appended note" not in content.lower(), "old Comments must never be copied/appended")
require("Comments are a fresh-note field" in content, "fresh-note safety comment missing")
require("!['Connected', 'Not Connected'].includes(payload.status)" in content, "call outcome must be restricted to Connected/Not Connected")
require("if (payload.activityType !== 'Call')" in content, "Activity Type must be restricted to Call")
apply = content[content.find("async function applyAndSave(payload)"):]
require("qualification_status" not in apply.lower() and "qualification status" not in apply.lower(), "CRM write path must not include Qualification Status")
require("owner" not in apply.lower() and "contact details" not in apply.lower(), "CRM write path unexpectedly references owner/contact details")
require("post-save state could not be independently verified" in content, "uncertain-save warning missing")
require("no automatic resubmission" in content.lower() or "do not retry automatically" in content.lower(), "uncertain saves must not auto-resubmit")
require("LEAD SNAPSHOT" in sidepanel_js and "READY-TO-SEND WHATSAPP" in sidepanel_js, "lead-specific Gemini brief sections missing")
require("Do not invent" in sidepanel_js or "Never invent" in sidepanel_js, "anti-hallucination brief guidance missing")
require("incrementCompletedFollowUpKpi" in follow and "completedAt" in follow, "follow-up completion/KPI integration missing")
require("chrome.runtime.sendMessage = function" not in follow, "global runtime message interception is forbidden")
require("does not create CRM tasks automatically" in follow, "local-only reminder notice missing")
require("msKpiDaily" in kpi and "chrome.storage.local" in kpi, "daily KPI must use browser-local storage")
require("quickInvestorCalc" in investor and "mountQuickInvestorCalculator" in investor, "Quick Investor Calculator missing")
require("layout.insertAdjacentElement('beforebegin',quick)" in investor, "Quick Investor Calculator full-width placement invariant missing")
require("0.6.4" in readme and "0.6.4" in install and "0.6.4" in report and "0.6.4" in manual and "0.6.4" in performed, "current version missing in package docs")
require("live Chrome/Brave" in performed and "not" in performed.lower(), "test report must state live-browser verification limits")
require("QUALIFICATION" in read("PERMISSIONS-AND-PRIVACY.txt").upper(), "privacy note must discuss protected Qualification Status")
require(not list(root.glob("*.csv")), "package must not include imported lead CSVs")

if errors:
    print("FAIL — release verification found issues:")
    for item in errors:
        print(" - " + item)
    sys.exit(1)
print("PASS — v0.6.4 manifest, entry points, HTML assets, CRM guardrails, fresh-note logic, AI brief, follow-up/KPI, calculator placement and release docs verified.")
