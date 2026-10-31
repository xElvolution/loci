/**
 * Local HTTP stand-in for the Qloo API, used ONLY by the Playwright suite
 * (QLOO_BASE_URL points here during e2e). Every name is prefixed "Fixture".
 */
import http from "node:http";
import { mockQloo } from "./mock-qloo";

const PORT = Number(process.env.MOCK_QLOO_PORT ?? 3798);
const SELF = `http://127.0.0.1:${PORT}`;
const { transport } = mockQloo({ imageBase: SELF });
const PALETTE = ["#ffc15e", "#ff6b5a", "#7cf5d3", "#b48cff", "#8fd3ff", "#ffd36b"];

function svg(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = PALETTE[h % PALETTE.length];
  const b = PALETTE[(h >> 3) % PALETTE.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="320" height="320" fill="url(#g)"/><text x="160" y="178" font-family="monospace" font-size="44" text-anchor="middle" fill="#1a1530">FX</text></svg>`;
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", SELF);
    if (url.pathname.startsWith("/img/")) {
      res.writeHead(200, { "content-type": "image/svg+xml" });
      res.end(svg(url.pathname));
      return;
    }
    let r;
    if (req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      r = await transport.post(url.pathname, JSON.parse(Buffer.concat(chunks).toString() || "{}"));
    } else {
      r = await transport.get(url.pathname, Object.fromEntries(url.searchParams));
    }
    res.writeHead(r.status || 500, { "content-type": "application/json" });
    res.end(JSON.stringify(r.body));
  })
  .listen(PORT, "127.0.0.1", () => console.log(`mock qloo on ${PORT}`));
