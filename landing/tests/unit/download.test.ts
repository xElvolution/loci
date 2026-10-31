import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ANDROID_RELEASE, formatMegabytes } from "@/lib/downloads";

const src = (p: string) => readFileSync(path.resolve(import.meta.dirname, "../../src", p), "utf8");
const page = src("app/download/page.tsx");

describe("download page", () => {
  it("points at the published Android release asset", () => {
    expect(ANDROID_RELEASE.url).toBe(`https://github.com/xElvolution/loci/releases/download/${ANDROID_RELEASE.tag}/${ANDROID_RELEASE.file}`);
    expect(ANDROID_RELEASE.releasePage).toBe(`https://github.com/xElvolution/loci/releases/tag/${ANDROID_RELEASE.tag}`);
    expect(ANDROID_RELEASE.file).toContain(ANDROID_RELEASE.version);
    expect(ANDROID_RELEASE.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(ANDROID_RELEASE.bytes).toBeGreaterThan(1_000_000);
  });

  it("formats sizes in megabytes", () => {
    expect(formatMegabytes(ANDROID_RELEASE.bytes)).toBe("62.6 MB");
    expect(formatMegabytes(1_250_000)).toBe("1.3 MB");
  });

  it("lists exactly the web app, Android and iPhone, and no desktop app", () => {
    const cards = [...page.matchAll(/data-testid="platform-([a-z]+)"/g)].map((m) => m[1]);
    expect(cards).toEqual(["web", "android", "ios"]);
    expect(page).not.toMatch(/platform-(desktop|mac|windows|linux)/);
  });

  it("is honest about what is live", () => {
    expect(page).toContain('status="available" testId="status-web"');
    expect(page).toContain('status="test-build" testId="status-android"');
    expect(page).toContain('status="soon" testId="status-ios"');
    expect(page).toContain("test build signed with a debug key");
    expect(page).toContain("Install unknown apps");
    expect(page).toContain("No iOS build is available yet");
  });

  it("is linked from the main navigation and the footer", () => {
    expect(src("components/site/SiteHeader.tsx")).toContain('href="/download"');
    expect(src("components/site/SiteFooter.tsx")).toContain('href="/download"');
    expect(src("app/page.tsx")).toContain("<SiteHeader />");
    expect(src("app/page.tsx")).toContain("<SiteFooter />");
  });
});
