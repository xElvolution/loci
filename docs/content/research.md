# Research layer

**Status: live in the webapp** (migration `006_research.sql`, `src/lib/care/research.ts`, `src/lib/server/research.ts`). Covered by `tests/unit/research.test.ts` and `tests/e2e/research.spec.ts`. What ships today is a team-level aggregate view and CSV export. There is no access for outside researchers yet.

## What it is for

Recovery after hospital is poorly measured once people go home. The research layer lets a care team see patterns across many recoveries: how people feel week by week, how often check-ins raise a flag, how outcome measures change, and how many people return to hospital.

## Plain-language promise

- **It is opt-in.** Nobody is included unless the person or their main caregiver switches on the separate research consent in Settings. Sharing with the care team does not switch it on.
- **You can switch it off at any time.** You leave the numbers straight away. Stopping sharing with the care team also stops research.
- **It never contains who you are.** No names, emails, phone numbers, invite codes, dates, free-text notes, messages, custom measures or addresses.
- **It only shows groups.** Results are counts and averages across groups of people. A group with fewer than 10 people is not shown at all.

## How it works

- **Consent:** `journeys.research_consent` with the time it was granted, separate from `consent_org`. It can only be switched on while the journey shares with its care team. Every change is written to `consent_log` with scope `research`, and turning off team sharing also turns research off (logged).
- **Who is included:** journeys in the team's organization with both team sharing and research consent on.
- **Fields used:** specialty, week of recovery (days since discharge divided into weeks, weeks after 12 pooled as "13+", never calendar dates), check-in mood, pain, sleep and energy, whether a check-in raised a flag, values of standard outcome instruments (custom measures are excluded because their names are free text), and whether there was any readmission.
- **Minimum group size (k = 10):** every cell must contain at least 10 distinct people, counted by person, not by record. Smaller cells are suppressed, not rounded or merged. The cohort size itself is shown only as "fewer than 10" below the threshold. `RESEARCH_K` can raise k; values below 5 are ignored.
- **Aggregate only:** journey ids are used inside the server only to count distinct people and are dropped before anything is shown or exported. The view and the CSV contain grouped rows, never one row per patient.
- **Access:** only team admins can open `/clinic/research` or download `/api/research/export`. Each view and export is written to `research_access_log` with who, when, and how many cells were shown and hidden. The log is visible on the page.
- **No taste data:** comfort favorites and Qloo picks are never part of the research layer, because loci never links taste to health.

## Not built yet

- Access for approved researchers outside the care team, and pooling across organizations.
- Formal statistical disclosure control beyond minimum cell size (for example differencing protection across repeated queries).

## What it is not

It is not a clinical trial platform, it does not make loci a medical device, and it does not replace an ethics review. Any study that uses the data needs its own approvals.
