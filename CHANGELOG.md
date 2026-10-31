# Changelog

All notable changes to loci are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Download page at locicare.xyz/download with the web app, the Android test build with its SHA-256, and iOS status, linked from the main navigation and the footer.
- Repository health files: contributing guide, code of conduct, security policy, and issue and pull request templates.

### Changed
- Public URLs move to locicare.xyz (site), app.locicare.xyz (app) and docs.locicare.xyz (docs). Every cross-link is configurable per deployment through environment variables.
- The mobile API origin is set at build time with `EXPO_PUBLIC_API_ORIGIN` (default `https://app.locicare.xyz`).

## [1.0.0] - 2026-10-31

### Added
- **Clinician workspace** (`/clinic`): clinician sign-up, care teams, patient list with status, flags and open questions; plans from specialty templates with what, why and how for every item, warning signs and check-in thresholds; patient-view preview; send with an 8-character single-use code and link; live tracking with tick-offs, 7-day adherence, check-in trends, flag review, notes, messages and an inbox; plan edits after sending notify the patient.
- **Outcome tracking**: clinician-selected instruments (Barthel, TUG, NPRS, mRS, 6MWT, knee range, PHQ-9, GAD-7, EPDS, weight and custom), charts, adherence trend and readmission-free days.
- **Templates**: 12 specialty structure templates plus stroke rehab and orthopedic physiotherapy, a team template library and editor, save a plan as a template, and a "needs your words" check before sending.
- **Patient app** (`/app`): redeem a code, step-by-step plan in the team's words, today list, two-minute check-in with rule-based escalation and one-tap call buttons, journey road with milestones and trends, ask the care team, care circle with invites and shared errands, settings with export and delete.
- **Comfort by Qloo**: soundtrack, screen time, reading, meals, cuisines, gentle outings and a good-day plan around the care steps, with every Qloo call shown and no health data sent.
- **Research layer**: separate research consent, admin-only aggregate view and CSV export with k = 10 cell suppression, and an access log.
- **Reminders**: in-app reminder card and step times; SMS and WhatsApp preferences behind a Twilio provider that sends only when it is configured, with a delivery log of real results.
- **Mobile API v1**: bearer tokens, sign-in, sign-up, demo, redeem, today, ticks, plan, check-ins with escalation, journey, comfort, messages, reminders, export, delete and research consent.
- **Mobile app** (`mobile/`): Expo patient app with welcome, redeem, today, check-in, journey, comfort, ask, circle and settings; Android test build published as release `mobile-v1.0.0`.
- **Landing site** for both audiences with the plan, follow, track, adjust loop, two guided tours, specialties, safety and pricing.
- **Documentation site** with architecture, API, mobile, privacy, research, safe use, not-a-medical-device and deployment pages.
- Two-sided demo: one shared demo patient seen from the clinician and the patient side.

[Unreleased]: https://github.com/xElvolution/loci/compare/mobile-v1.0.0...main
[1.0.0]: https://github.com/xElvolution/loci/releases/tag/mobile-v1.0.0
