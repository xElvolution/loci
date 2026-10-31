import { readFileSync } from "node:fs";
import path from "node:path";
import { Marked } from "marked";

export type DocMeta = { slug: string; file: string; title: string; label: string; group: string };

/** Sidebar order. Every Markdown file in content/ must appear here (a unit test checks this). */
export const NAV: { group: string; items: [slug: string, file: string, label: string][] }[] = [
  { group: "Start here", items: [["overview", "Loci-Qloo-Solution.md", "The solution"], ["problem", "Loci-Qloo-Problem.md", "The problem"], ["repository", "monorepo.md", "Repository layout"]] },
  { group: "Build", items: [["architecture", "architecture.md", "Architecture"], ["system-design", "Loci-Qloo-Architecture.md", "System design and Qloo"], ["api", "api.md", "API"], ["mobile", "mobile.md", "Mobile app"], ["ui", "Loci-Qloo-UI.md", "UI and design"], ["deploy", "deploy.md", "Deploy"]] },
  { group: "Trust", items: [["safety", "safe-use.md", "Safe use"], ["privacy", "privacy.md", "Privacy and data"], ["research", "research.md", "Research layer"], ["not-a-medical-device", "non-medical-device.md", "Not a medical device"], ["qloo", "qloo.md", "How loci uses Qloo"]] },
];

export const CONTENT_DIR = path.join(process.cwd(), "content");
const bySlug = new Map<string, DocMeta>();
const byFile = new Map<string, string>();
for (const g of NAV) for (const [slug, file, label] of g.items) {
  const raw = readFileSync(path.join(CONTENT_DIR, file), "utf8");
  const title = (raw.match(/^#\s+(.+)$/m)?.[1] ?? slug).trim();
  bySlug.set(slug, { slug, file, title, label, group: g.group });
  byFile.set(file, slug);
}

export const allDocs = () => [...bySlug.values()];
export const docMeta = (slug: string) => bySlug.get(slug);

const marked = new Marked({ gfm: true });
marked.use({
  walkTokens(token) {
    if (token.type === "link") {
      const [file, hash] = token.href.split("#");
      const slug = byFile.get(file.replace(/^\.\//, ""));
      if (slug) token.href = `/${slug}${hash ? `#${hash}` : ""}`;
    }
  },
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const id = text.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
  },
});

/** Renders a doc. Content is our own committed Markdown, never user input. The leading H1 is dropped (the page renders it). */
export function renderDoc(slug: string): { meta: DocMeta; html: string; toc: { id: string; text: string }[] } | null {
  const meta = bySlug.get(slug);
  if (!meta) return null;
  const raw = readFileSync(path.join(CONTENT_DIR, meta.file), "utf8").replace(/^#\s+.+\n/, "");
  const html = marked.parse(raw, { async: false });
  const toc = [...html.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map((m) => ({ id: m[1], text: m[2].replace(/<[^>]+>/g, "") }));
  return { meta, html, toc };
}
