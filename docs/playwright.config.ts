import { defineConfig, devices } from "@playwright/test";

const PORT = 3773;
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: `npx next start -p ${PORT} -H 127.0.0.1`,
    port: PORT,
    reuseExistingServer: false,
    env: { APP_URL: "http://app.example.test", LANDING_URL: "http://landing.example.test" },
  },
});
