# Makkaan Sales Sidecar — v0.6.4

**Canonical maintained build: v0.6.4.** The repository default branch `main` is intended to point to this same source state. Do not install the internal build seed described below.

## Get the extension

Open the [Build Smart Caller portable ZIP workflow](https://github.com/fahadfarid21/makkaan-smart-caller-portable-v0.5.5/actions/workflows/build-portable.yml) and download the artifact named **`Makkaan-Smart-Caller-Complete-Portable-v0.6.4`** from the latest successful run. The Actions download is an outer artifact ZIP containing the extension ZIP and its SHA-256 file.

The standalone extension package is **`Makkaan-Smart-Caller-Complete-Portable-v0.6.4.zip`**. Check the SHA-256 in `SHA256SUMS.txt` before installation.

## What's included

- Local lead queue, pre-call brief, calculator, Investor Mode and editable investor assumptions.
- Fresh-note CRM updates with post-save verification and no automatic resubmission when verification is uncertain.
- Follow-up planner with dates, channel, priority, exact next action and KPI credit when a planner reminder is completed.
- Daily KPI coach for verified CRM call outcomes and manually recorded follow-up, meeting, lead and opportunity events.
- Lead-specific AI briefs, subject to explicit user configuration and review.

## Installation

1. Download and extract the GitHub Actions artifact ZIP.
2. Extract the inner `Makkaan-Smart-Caller-Complete-Portable-v0.6.4.zip` to a permanent folder.
3. Open `brave://extensions` or `chrome://extensions`, enable Developer mode, then select **Load unpacked** and choose the folder containing `manifest.json`.
4. Complete `MANUAL-TEST-CHECKLIST.txt` using an authorized test lead before production use.

Keep the installed folder in place. To update, load a new extracted folder and verify its version before removing the previous installation.

## Repository layout

- `.github/workflows/build-portable.yml`: reproducible build and verification workflow.
- `.github/scripts/apply-v062-patches.py`: applies deterministic CRM-save and AI-brief fixes to the seed package.
- `.github/scripts/verify-release.py`: checks manifest entry points and critical safety/feature invariants.
- `source-overrides/`: maintained v0.6.4 extension files and current installation/test documentation.
- `build-inputs/seed-extension.zip`: frozen bootstrap input for legacy components not yet maintained as standalone source files. This is a build input, **not a distributable release**. The only intended install package is v0.6.4.

The build workflow is triggered for the canonical `main` branch, the active working branch and manual runs. Older feature branches are historical and are not release channels.

## Verification boundary

The build checks Manifest V3 JSON, all manifest-referenced local paths, JavaScript syntax, required feature files, fresh-comment replacement, lead-specific AI brief sections, follow-up completion integration, calculator placement, and final ZIP integrity. The workflow produces the checksum of the actual extension ZIP.

These checks do **not** prove the extension's UI renders correctly in a live Chrome/Brave session, that a signed-in Prop 360 account accepts the CRM update, or that a configured Gemini key succeeds. Complete the manual checklist using an authorized test record. Do not test initial CRM writes on a real client's record.

## Safety and privacy

- No auto-dialing or unsupervised CRM writes.
- Qualification Status is read for context only and is not an update field.
- Call outcomes count only after the extension verifies the CRM save; other KPI actions are manually logged and may be inaccurate if recorded incorrectly.
- AI Notes can send selected text to Google only when configured and explicitly invoked. Review content before sending it to any third-party provider.
- Rental, growth and future-value figures are scenarios, not guaranteed returns. Confirm current official pricing, availability, approvals and terms before client use.
