# Mobile app

Mobile app: `mobile/` is the Expo patient app (today's step-by-step plan, daily check-in with when-to-call, journey, comfort, ask the care team, care circle, settings). It uses only `/api/v1` with bearer tokens in secure storage.

- **Android APK:** download from [locicare.xyz/download](https://locicare.xyz/download) or [release mobile-v1.0.0](https://github.com/xElvolution/loci/releases/tag/mobile-v1.0.0). It is a test build signed with a debug key, so Android asks you to allow "Install unknown apps". SHA-256: `810bf3e2abcaae82f3ae2dabd33c49099716cc31c7d660b96153c88d2f911c08`.
- **API origin:** the app talks to `https://app.locicare.xyz/api/v1`. Builds can point elsewhere with `EXPO_PUBLIC_API_ORIGIN`.
- **iOS:** TestFlight soon. No iOS build is available yet.
- Export, account deletion and circle invites open the web app until the API has endpoints for them. The API now has `GET /me/export`, `DELETE /me` and the research consent endpoints; circle invites still need the web app.

## How it talks to loci

The app holds no medical content of its own. Everything it shows comes from the care team's plan through the [mobile API](/api), whose full contract is [`mobile-api.md`](https://github.com/xElvolution/loci/blob/main/mobile-api.md). Check-ins and ticks from the app go through the same service functions as the web patient app, so flags and escalation follow the same rules and appear live in the clinician workspace.
