// Contact sheet of the screenshots: node scripts/sheet.mjs shots shots/sheet.png
import { chromium } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";

const dir = process.argv[2] || "shots";
const out = process.argv[3] || `${dir}/sheet.png`;
const only = process.argv[4] ? new RegExp(process.argv[4]) : null;
const files = readdirSync(dir).filter((f) => f.endsWith(".png") && !f.startsWith("sheet") && (!only || only.test(f))).sort();
const cells = files.map((f) => `<figure><img src="data:image/png;base64,${readFileSync(`${dir}/${f}`).toString("base64")}"><figcaption>${f}</figcaption></figure>`).join("");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.setContent(`<style>body{margin:0;background:#222;display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:8px;font:12px monospace;color:#ddd}img{width:100%;display:block}figure{margin:0}</style>${cells}`);
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log(out, files.length);
