// Renders the app icon, adaptive icon layers, splash and favicon from the loci wordmark.
// Usage: node scripts/icons.mjs
import { chromium } from "@playwright/test";

const mark = (fg, opts = {}) => `
<defs>
  <linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${opts.mono ? fg : "#FFC15E"}"/><stop offset="0.55" stop-color="${opts.mono ? fg : "#FF6B5A"}"/><stop offset="1" stop-color="${opts.mono ? fg : "#B48CFF"}"/></linearGradient>
  <radialGradient id="p" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="${opts.mono ? fg : "#FFE3A3"}"/><stop offset="1" stop-color="${opts.mono ? fg : "#FF6B5A"}"/></radialGradient>
</defs>
<g fill="none" stroke="${fg}" stroke-width="11" stroke-linecap="round"><path d="M12 8 V62"/><path d="M121.5 34.5 A17.5 17.5 0 1 0 121.5 59.5"/><path d="M150 37 V62"/></g>
<circle cx="53" cy="47" r="17.5" fill="none" stroke="url(#r)" stroke-width="11"/>
${opts.mono ? "" : [0, 90, 180, 270].map((d) => { const a = ((d - 90) * Math.PI) / 180; return `<circle cx="${53 + Math.cos(a) * 17.5}" cy="${47 + Math.sin(a) * 17.5}" r="2.4" fill="#0B0A1F"/>`; }).join("")}
<path d="M150 26 C143 18.5 139.5 14 139.5 9.5 A10.5 10.5 0 0 1 160.5 9.5 C160.5 14 157 18.5 150 26 Z" fill="url(#p)"/>
<circle cx="150" cy="9.6" r="3.6" fill="${opts.mono ? "transparent" : "#0B0A1F"}"/>`;

const bg = `<defs><radialGradient id="bg" cx="0.75" cy="0.15" r="1"><stop offset="0" stop-color="#3B2F86"/><stop offset="0.55" stop-color="#140F33"/><stop offset="1" stop-color="#0B0A1F"/></radialGradient></defs><rect width="1024" height="1024" fill="url(#bg)"/>`;
const place = (size, scale, inner) => {
  const w = 176 * scale, h = 76 * scale;
  return `<g transform="translate(${(size - w) / 2} ${(size - h) / 2 + 6 * scale}) scale(${scale})">${inner}</g>`;
};
const svg = (size, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`;

const out = {
  "icon.png": [1024, svg(1024, bg + place(1024, 4.4, mark("#ECE8FF")))],
  "android-icon-background.png": [1024, svg(1024, bg)],
  "android-icon-foreground.png": [1024, svg(1024, place(1024, 3.4, mark("#ECE8FF")))],
  "android-icon-monochrome.png": [1024, svg(1024, place(1024, 3.4, mark("#FFFFFF", { mono: true })))],
  "splash-icon.png": [1024, svg(1024, place(1024, 5.2, mark("#ECE8FF")))],
  "favicon.png": [96, svg(96, `<rect width="96" height="96" rx="22" fill="#140F33"/>` + place(96, 0.48, mark("#ECE8FF")))],
};

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, [size, s]] of Object.entries(out)) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
  await page.locator("svg").screenshot({ path: `assets/images/${name}`, omitBackground: true });
  console.log("wrote", name);
}
await browser.close();
