import { afterEach, describe, expect, it, vi } from "vitest";

const load = async () => {
  vi.resetModules();
  return import("@/lib/urls");
};

describe("cross-site URLs", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to the production domains", async () => {
    for (const k of ["APP_URL", "DOCS_URL", "SIGNIN_URL"]) vi.stubEnv(k, "");
    const u = await load();
    expect(u.APP_URL).toBe("https://app.locicare.xyz");
    expect(u.DOCS_URL).toBe("https://docs.locicare.xyz");
    expect(u.SIGNIN_URL).toBe("https://app.locicare.xyz/app/signin");
  });

  it("reads every URL from the environment and trims a trailing slash", async () => {
    vi.stubEnv("APP_URL", "https://app.test.example/");
    vi.stubEnv("DOCS_URL", "https://docs.test.example");
    vi.stubEnv("SIGNIN_URL", "");
    const u = await load();
    expect(u.app("/clinic/signup")).toBe("https://app.test.example/clinic/signup");
    expect(u.SIGNIN_URL).toBe("https://app.test.example/app/signin");
    vi.stubEnv("SIGNIN_URL", "https://app.test.example/signin");
    expect((await load()).SIGNIN_URL).toBe("https://app.test.example/signin");
  });
});

describe("calls to action", () => {
  it("link only to the sign-in page, never to the demo", async () => {
    const { readFileSync, readdirSync, statSync } = await import("node:fs");
    const path = await import("node:path");
    const root = path.resolve(import.meta.dirname, "../../src");
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));
    for (const f of walk(root).filter((x) => x.endsWith(".tsx"))) {
      const s = readFileSync(f, "utf8");
      expect(s, f).not.toContain('app("/app/demo")');
      expect(s, f).not.toContain('app("/app/signin")');
      expect(s, f).not.toMatch(/try the demo|medical device|DEMO_URL/i);
    }
  });
});
