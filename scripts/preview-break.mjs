/**
 * Local preview of the break screen with mocked chrome.* APIs.
 * Serves built assets + a shim so we can screenshot without loading the extension.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const port = 3847;

const breakHtmlPath = path.join(dist, "src/break/index.html");
let html = fs.readFileSync(breakHtmlPath, "utf8");

const shim = `
<script>
  (() => {
    const now = Date.now();
    const breakSeconds = 20;
    const state = {
      settings: {
        workMinutes: 20,
        breakSeconds,
        snoozeMinutes: 5,
        idleThresholdMinutes: 3,
        soundEnabled: false,
        notificationsEnabled: true,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        autoStart: true,
      },
      timer: {
        status: "break",
        workEndsAt: null,
        breakEndsAt: now + breakSeconds * 1000,
        pausedRemainingMs: null,
        updatedAt: now,
      },
      stats: {
        today: { date: new Date().toISOString().slice(0,10), completed: 3, skipped: 1, snoozed: 0 },
        streak: 2,
        lastActiveDate: new Date().toISOString().slice(0,10),
        history: [],
      },
    };
    globalThis.chrome = {
      runtime: {
        sendMessage: async (msg) => {
          if (msg?.type === "GET_STATE") return { type: "STATE", payload: state };
          if (msg?.type === "COMPLETE_BREAK" || msg?.type === "SKIP_BREAK" || msg?.type === "SNOOZE") {
            state.timer.status = "running";
            return { type: "STATE", payload: state };
          }
          return { ok: true };
        },
        getURL: (p) => p,
        openOptionsPage: async () => {},
      },
    };
  })();
</script>
`;

html = html.replace("<head>", `<head>${shim}`);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/" || url.pathname === "/break") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }
  const filePath = path.join(dist, decodeURIComponent(url.pathname));
  if (!filePath.startsWith(dist) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Respite break preview: http://127.0.0.1:${port}/break`);
});
