/**
 * Serves store-ready preview pages for screenshots (1280x800).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const port = 3850;

function read(p) {
  return fs.readFileSync(p, "utf8");
}

const chromeMock = `
<script>
  (() => {
    const now = Date.now();
    const state = {
      settings: {
        workMinutes: 20,
        breakSeconds: 20,
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
        status: "running",
        workEndsAt: now + 12 * 60 * 1000 + 34 * 1000,
        breakEndsAt: null,
        pausedRemainingMs: null,
        updatedAt: now,
      },
      stats: {
        today: { date: new Date().toISOString().slice(0,10), completed: 6, skipped: 1, snoozed: 1 },
        streak: 4,
        lastActiveDate: new Date().toISOString().slice(0,10),
        history: [
          { date: "2026-11-08", completed: 5, skipped: 2, snoozed: 0 },
          { date: "2026-11-09", completed: 7, skipped: 1, snoozed: 1 },
          { date: "2026-11-10", completed: 4, skipped: 0, snoozed: 0 },
          { date: "2026-11-11", completed: 8, skipped: 2, snoozed: 0 },
          { date: "2026-11-12", completed: 6, skipped: 1, snoozed: 1 },
          { date: "2026-11-13", completed: 5, skipped: 1, snoozed: 0 },
          { date: "2026-11-14", completed: 6, skipped: 1, snoozed: 1 },
        ],
      },
    };
    globalThis.chrome = {
      runtime: {
        sendMessage: async (msg) => {
          if (msg?.type === "GET_STATE") return { type: "STATE", payload: state };
          if (msg?.type === "SETTINGS_UPDATED") {
            state.settings = msg.settings;
            return { type: "STATE", payload: state };
          }
          return { type: "STATE", payload: state };
        },
        getURL: (p) => p,
        openOptionsPage: async () => {},
      },
    };
  })();
</script>
`;

function injectShim(html) {
  return html.replace("<head>", `<head>${chromeMock}`);
}

function framePage({ title, inner, width = 360 }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  html, body { margin:0; height:100%; }
  body {
    width: 1280px; height: 800px; overflow: hidden;
    background:
      radial-gradient(circle at 18% 20%, rgba(61,126,166,0.18), transparent 40%),
      radial-gradient(circle at 82% 78%, rgba(47,111,94,0.16), transparent 42%),
      linear-gradient(160deg, #e8f0ef 0%, #f4f8f7 45%, #e7eef3 100%);
    font-family: Outfit, "Segoe UI", system-ui, sans-serif;
    color: #1a2b28;
  }
  .stage {
    width: 1280px; height: 800px;
    display: grid; place-items: center;
    position: relative;
  }
  .caption {
    position: absolute; left: 64px; top: 56px; max-width: 420px;
  }
  .caption h1 {
    margin: 0; font-family: Fraunces, Georgia, serif;
    font-size: 42px; letter-spacing: -0.02em;
  }
  .caption p { margin: 12px 0 0; color: #3d524c; font-size: 18px; line-height: 1.45; }
  .frame {
    width: ${width}px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(26,43,40,0.18), 0 2px 0 rgba(255,255,255,0.5) inset;
    border: 1px solid rgba(26,43,40,0.08);
    background: white;
  }
  iframe { border: 0; width: 100%; height: 540px; display: block; background: transparent; }
</style>
</head>
<body>
  <div class="stage">
    <div class="caption">
      <h1>${title}</h1>
      <p>${inner}</p>
    </div>
    <div class="frame">
      <iframe id="app" src="/raw/popup"></iframe>
    </div>
  </div>
</body>
</html>`;
}

const popupHtml = injectShim(read(path.join(dist, "src/popup/index.html")));
const optionsHtml = injectShim(read(path.join(dist, "src/options/index.html")));
const breakHtml = injectShim(read(path.join(dist, "src/break/index.html"))).replace(
  'status: "running"',
  'status: "break"',
).replace(
  "workEndsAt: now + 12 * 60 * 1000 + 34 * 1000",
  "workEndsAt: null",
).replace(
  "breakEndsAt: null",
  "breakEndsAt: now + 20 * 1000",
);

// Fix break state more carefully by rewriting the shim for break
const breakShimState = chromeMock
  .replace('status: "running"', 'status: "break"')
  .replace("workEndsAt: now + 12 * 60 * 1000 + 34 * 1000", "workEndsAt: null")
  .replace("breakEndsAt: null", "breakEndsAt: now + 18 * 1000")
  .replace("soundEnabled: false", "soundEnabled: false");

const breakPage = read(path.join(dist, "src/break/index.html")).replace(
  "<head>",
  `<head>${breakShimState}`,
);

const popupShot = framePage({
  title: "Quiet reminders while you work",
  inner: "See the next break at a glance. Pause, snooze, or take a break now — without leaving your flow.",
  width: 340,
}).replace("/raw/popup", "/raw/popup-tall");

const optionsShot = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><title>Settings</title>
<style>html,body{margin:0;width:1280px;height:800px;overflow:hidden}iframe{border:0;width:1280px;height:800px}</style>
</head><body><iframe src="/raw/options"></iframe></body></html>`;

const breakShot = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><title>Break</title>
<style>html,body{margin:0;width:1280px;height:800px;overflow:hidden}iframe{border:0;width:1280px;height:800px}</style>
</head><body><iframe src="/raw/break"></iframe></body></html>`;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  const routes = {
    "/shot/popup": popupShot,
    "/shot/options": optionsShot,
    "/shot/break": breakShot,
    "/raw/popup": popupHtml,
    "/raw/popup-tall": popupHtml,
    "/raw/options": optionsHtml,
    "/raw/break": breakPage,
  };
  if (routes[url.pathname]) {
    let html = routes[url.pathname];
    if (url.pathname === "/raw/popup-tall") {
      // ensure iframe shows full popup
      html = html.replace(
        "</head>",
        "<style>html,body,#root{min-height:520px}</style></head>",
      );
    }
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
  res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Store previews on http://127.0.0.1:${port}/shot/{popup,options,break}`);
});
