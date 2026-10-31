# loci mobile: the patient app

The loci patient and family app, built with Expo (SDK 58), React Native, TypeScript and Expo Router. It is a standalone package in the monorepo: its own `package.json`, tests and build. It talks only to the webapp's bearer-token API, `/api/v1`, described in [`../mobile-api.md`](../mobile-api.md).

Same visual language as the web app: dusk navy and purple, amber and coral, Bricolage Grotesque with Instrument Serif italic accents, and the lowercase **loci** wordmark (ported from `webapp/src/components/brand/Wordmark.tsx`): the route ring draws itself, its four stops pop in, and the map-pin dot of the "i" drops in. Tap it to replay. Reduced motion is respected.

## Screens

| Route | Screen |
| --- | --- |
| `/welcome` | Welcome, sign in, create account, "I have a code from my care team", try the demo |
| `/redeem` | Enter and check the 8-character care-team code, choose to share check-ins, join the plan |
| `/` (Today tab) | Greeting, day of the journey, progress ring, streak, next appointment, "your team updated your plan" banner with Got it, open flags with call buttons, check-in prompt, and the step-by-step plan: each step ticks off and opens for **what**, **why your team asked** and **how** |
| `/plan` | The full plan in the care team's words, with general instructions and warning signs |
| `/checkin` | Daily check-in (mood faces, pain 0 to 10, sleep, appetite, energy, warning signs, note). The **When to call** panel lists the team's warning signs (emergency vs call the team) with one-tap `tel:` buttons. After saving, an escalation shows prominently with call buttons |
| `/journey` | The road home: day of the horizon, streak, 7-day plan adherence, milestones as a road, appointments, 30-day trends |
| `/comfort` | Qloo picks (soundtrack, screen, reading, meals, outings, cuisines) and today's good-day plan, which keeps the team's plan lines at their times and arranges comfort around them |
| `/ask` | Ask my care team: the message thread, question or note, with "for anything urgent, call" next to the composer |
| `/circle` | Care circle: you, the plans you are part of and your role, the care team and whether they see your check-ins; invites open the web app |
| `/settings` | Reminder preferences, sharing status, export, delete account, sign out, privacy and safe-use links |

loci never gives medical advice. Every clinical word on screen comes from the care team's plan through the API. Flags are rule-based on the team's thresholds and ticked warning signs; the app adds no scoring.

## What is real and what is not yet

- All of the screens above run against the live API (`https://app.locicare.xyz/api/v1`), including sign in, sign up, demo, code check and redeem, ticks, plan-seen, check-ins with escalation, journey, comfort and messages.
- **Reminder preferences** are saved on the phone only. This build does not schedule phone notifications, and the v1 API has no reminder endpoint. SMS and WhatsApp reminders are set up in the web app.
- **Export my data**, **delete account** and **circle invites** are not in the v1 mobile API, so they open the web app (`/app/settings`, `/app/circle`). There the person signs in and confirms. Nothing is deleted from the phone first.
- `streak` is documented as a number. `/today` and `/journey` currently send `{ current, best, doneToday }`, so the client accepts both (`streakOf`).

## Security

- The bearer token is kept in `expo-secure-store` (Keychain or Keystore) on a phone. In the web preview it is kept in `sessionStorage`, so it goes away when the tab closes. It is held outside React state and is never logged.
- A 401 response signs the person out on the device.
- Sign out calls `POST /auth/signout`, which revokes the token. For a demo account, that also deletes it.

## Run it

```bash
cd mobile
npm ci
npm run web            # Expo web (react-native-web) in a browser
npm start              # Expo dev server; open a development build on a phone
```

The API origin defaults to `https://app.locicare.xyz` (`API_ORIGIN` in `src/lib/api/client.ts`). Override it at build time with `EXPO_PUBLIC_API_ORIGIN`, for example `EXPO_PUBLIC_API_ORIGIN=http://localhost:3751 npm run web`. See `.env.example`.

## Checks

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint (eslint-config-expo, React Compiler rules)
npm test               # jest-expo: API client, formatting, check-in draft, good-day plan, journey, prefs, wordmark render
```

### Screenshot sweep (phone size, live API, demo account)

```bash
npx expo export --platform web
node scripts/serve.mjs 8099 &
node scripts/shots.mjs http://localhost:8099 shots
node scripts/sheet.mjs shots shots/sheet.png   # optional contact sheet
```

`shots.mjs` drives the app at 390 x 844 (2x) with Playwright. It starts the demo, opens a step, ticks it, reads the plan, completes a check-in that matches a warning sign (escalation with call buttons), and visits journey, comfort, ask (sends a question), circle, settings and redeem (with an invalid code). It fails on console errors, failed API calls, horizontal overflow, and text boxes that overlap on screen. It reuses one demo session for 23 hours, kept in `/tmp/loci-shot-session.json` with mode 600, so reruns don't use up the demo rate limit. Set `FRESH=1` to start a new one.

## Android

```bash
npx expo prebuild --platform android      # generates android/ (gitignored, never edited by hand)
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64
# APK: android/app/build/outputs/apk/release/app-release.apk
```

This needs JDK 17 and the Android SDK (platform 36, build-tools 36, NDK 27.1). The release APK is signed with the template's debug keystore, so you can sideload it to test. It is not a Play Store build. Publishing to the Play Store needs a real upload key and an `eas build` or Gradle signing config.

## iOS

The project structure, bundle id (`io.loci.care`) and config are ready, and `npx expo prebuild --platform ios` generates the Xcode project on a Mac. **TestFlight: not available.** No iOS build has been made or signed, and no App Store Connect app exists yet.

## Layout

```
src/app/            Expo Router routes (welcome, redeem, (tabs)/index|checkin|journey|comfort|ask, plan, circle, settings)
src/components/     Wordmark, Icon, ui primitives, StepCard, WhenToCall, Road, Header
src/lib/api/        typed client and types for /api/v1
src/lib/            auth (secure token), useApi, format, checkin, goodday, journey, prefs, storage
src/theme/          colors and fonts shared with the web app
scripts/            icons.mjs (app icons from the wordmark), serve.mjs, shots.mjs, sheet.mjs
```

MIT licensed, like the rest of the repository.
