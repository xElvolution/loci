import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NAV, allDocs, renderDoc } from "@/lib/docs";

const dir = path.resolve(import.meta.dirname, "../../content");
const files = readdirSync(dir).filter((f) => f.endsWith(".md"));

describe("docs site", () => {
  it("lists every Markdown file exactly once in the sidebar", () => {
    const listed = NAV.flatMap((g) => g.items.map(([, f]) => f)).sort();
    expect(listed).toEqual([...files].sort());
    expect(new Set(NAV.flatMap((g) => g.items.map(([s]) => s))).size).toBe(listed.length);
  });
  it("includes the four Loci-Qloo documents, the API and the research layer", () => {
    for (const f of ["Loci-Qloo-Problem.md", "Loci-Qloo-Solution.md", "Loci-Qloo-Architecture.md", "Loci-Qloo-UI.md", "api.md", "research.md", "privacy.md", "safe-use.md"]) expect(files).toContain(f);
  });
  it("renders every page with a title and rewrites links between docs", () => {
    for (const d of allDocs()) {
      const r = renderDoc(d.slug)!;
      expect(r.meta.title.length).toBeGreaterThan(2);
      expect(r.html).not.toMatch(/href="(?!https?:)[^"]*\.md/);
    }
  });
  it("never says Lagos, uses no em dashes, and never includes a key", () => {
    for (const f of files) {
      const s = readFileSync(path.join(dir, f), "utf8");
      expect(s, f).not.toMatch(/Lagos/);
      expect(s, f).not.toContain("\u2014");
      expect(s, f).not.toMatch(/QLOO_API_KEY\s*=\s*\S{8,}/);
    }
  });
});
