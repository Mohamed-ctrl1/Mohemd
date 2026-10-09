/**
 * خادم ثابت بسيط يحاكي GitHub Pages محليًا (مجلد الموقع تحت /<repo>/).
 * للاختبار فقط: node scripts/serve-static.mjs [port] [basePath] [dir]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.argv[2] || 4300);
const base = process.argv[3] ?? "/Mohemd";
const root = process.argv[4] ?? "out";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let p = decodeURIComponent(url.pathname);
  if (base && !p.startsWith(base)) {
    res.writeHead(404).end("outside base path");
    return;
  }
  p = p.slice(base.length) || "/";
  let file = normalize(join(root, p)).replace(/^(\.\.[/\\])+/, "");
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, "index.html");
  } catch {
    if (!extname(file)) file += ".html";
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    try {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(await readFile(join(root, "404.html")));
    } catch {
      res.writeHead(404).end("not found");
    }
  }
}).listen(port, () => console.log(`static server: http://localhost:${port}${base}/`));
