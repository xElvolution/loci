# Mobile app

Mobile app: `mobile/` is the Expo patient app (today's step-by-step plan, daily check-in with when-to-call, journey, comfort, ask the care team, care circle, settings). It uses only `/api/v1` with bearer tokens in secure storage.

- **Android APK:** [Releases, mobile-v1.0.0](https://github.com/xElvolution/loci/releases/tag/mobile-v1.0.0) (sideload test build, not yet verified on a device).
- **iOS:** TestFlight not available.
- Export, account deletion and circle invites open the web app until the API has endpoints for them. The API now has `GET /me/export`, `DELETE /me` and the research consent endpoints; circle invites still need the web app.

## How it talks to loci

The app holds no medical content of its own. Everything it shows comes from the care team's plan through the [mobile API](/api), whose full contract is [`mobile-api.md`](https://github.com/xElvolution/loci/blob/main/mobile-api.md). Check-ins and ticks from the app go through the same service functions as the web patient app, so flags and escalation follow the same rules and appear live in the clinician workspace.
