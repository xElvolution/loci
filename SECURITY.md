# Security policy

loci handles recovery plans, check-ins and messages between care teams and patients, so we treat security reports as a priority.

## Supported versions

| Part | Supported |
| --- | --- |
| `webapp/` (main branch, deployed at app.locicare.xyz) | Yes |
| `landing/` (main branch, deployed at locicare.xyz) | Yes |
| `docs/` (main branch, deployed at docs.locicare.xyz) | Yes |
| `mobile/` latest release (`mobile-v1.0.0`, Android test build) | Yes |
| Older commits and builds | No |

## Reporting a vulnerability

Please do not open a public issue, discussion or pull request for a security problem.

Report it privately through GitHub instead:

1. Go to the repository's **Security** tab.
2. Choose **Report a vulnerability** (direct link: https://github.com/xElvolution/loci/security/advisories/new).
3. Describe the issue, the affected part and URL or file, steps to reproduce and the impact you expect.

Only the maintainers can see the report. We aim to acknowledge it within 3 business days and to share a remediation plan within 10 business days. We will credit you in the advisory unless you ask us not to.

## Scope

In scope: authentication and sessions, the `/api/v1` bearer-token API, access control between clinicians, patients and care-circle members, invite and plan codes, data export and deletion, the research export (k-anonymity suppression), and anything that exposes personal or health information.

Out of scope: denial of service through volume, reports from automated scanners without a working proof of concept, missing best-practice headers with no demonstrated impact, and social engineering.

## Safe harbor

Good-faith research that respects these rules will not be pursued. Please:

- use only the demo ("Try the demo") or accounts you created yourself,
- never access, change or keep another person's data,
- stop and report as soon as you reach personal information,
- give us reasonable time to fix the issue before any disclosure.

## How we handle secrets

No credentials, API keys or server details are kept in this repository. Each deployment reads its configuration from environment variables (see each part's `.env.example`). If you ever find a secret in the repository or its history, report it through the private route above.
