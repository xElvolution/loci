import { defineConfig, devices } from "@playwright/test";

const PORT = 3752;
const MOCK = 3798;
const TEST_DB = process.env.E2E_DATABASE_URL ?? "postgres://loci@127.0.0.1:5561/loci_care_test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
  webServer: [
    { command: `npx tsx tests/support/mock-qloo-server.ts`, port: MOCK, env: { MOCK_QLOO_PORT: String(MOCK) }, reuseExistingServer: false },
    {
      command: `npx tsx scripts/migrate.ts && npx next start -p ${PORT} -H 127.0.0.1`,
      port: PORT,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        DATABASE_URL: TEST_DB,
        QLOO_API_KEY: "e2e-fixture-key",
        QLOO_BASE_URL: `http://127.0.0.1:${MOCK}`,
        APP_ORIGIN: `http://127.0.0.1:${PORT}`,
        DEMO_RATE_PER_HOUR: "1000",
        LANDING_URL: "http://landing.example.test",
      },
    },
  ],
});
