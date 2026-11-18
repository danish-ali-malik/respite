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

function makeShim(overrides = {}) {
  const now = Date.now();
  const timer = {
    status: "running",
    workEndsAt: now + 12 * 60 * 1000 + 34 * 1000,
    breakEndsAt: null,
    standUpEndsAt: now + 38 * 60 * 1000,
    standEndsAt: null,
    pausedRemainingMs: null,
    standPausedRemainingMs: null,
    updatedAt: now,
    ...overrides.timer,
  };
  return `
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
        standUpEnabled: true,
        standUpMinutes: 60,
        standUpSeconds: 45,
      },
      timer: ${JSON.stringify(timer).replace(/"__NOW_PLUS_(\d+)"/g, (_, ms) => String(now + Number(ms)))},
      stats: {
        today: { date: new Date().toISOString().slice(0,10), completed: 6, skipped: 1, snoozed: 1, stood: 3 },
        streak: 4,
        lastActiveDate: new Date().toISOString().slice(0,10),
        history: [
          { date: "2026-11-12", completed: 5, skipped: 2, snoozed: 0, stood: 2 },
          { date: "2026-11-13", completed: 7, skipped: 1, snoozed: 1, stood: 4 },
          { date: "2026-11-14", completed: 4, skipped: 0, snoozed: 0, stood: 2 },
          { date: "2026-11-15", completed: 8, skipped: 2, snoozed: 0, stood: 5 },
          { date: "2026-11-16", completed: 6, skipped: 1, snoozed: 1, stood: 3 },
          { date: "2026-11-17", completed: 5, skipped: 1, snoozed: 0, stood: 3 },
          { date: "2026-11-18", completed: 6, skipped: 1, snoozed: 1, stood: 3 },
        ],
      },
    };
    // Fix dynamic timestamps after JSON stringify for timer ends
    if (state.timer.status === "running") {
      state.timer.workEndsAt = now + 12 * 60 * 1000 + 34 * 1000;
      state.timer.standUpEndsAt = now + 38 * 60 * 1000;
    }
    if (state.timer.status === "break") {
      state.timer.breakEndsAt = now + 18 * 1000;
      state.timer.workEndsAt = null;
    }
    if (state.timer.status === "stand") {
      state.timer.standEndsAt = now + 32 * 1000;
      state.timer.workEndsAt = null;
    }
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
}

function inject(html, shim) {
  return html.replace("<head>", `<head>${shim}`);
}

function framePage({ title, body, iframeSrc, width = 360, iframeHeight = 560 }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<style>
  html, body { margin:0; height:100%; }
  body {
    width: 1280px; height: 800px; overflow: hidden;
    background:
      radial-gradient(circle at 18% 20%, rgba(61,126,166,0.18), transparent 40%),
      radial-gradient(circle at 82% 78%, rgba(47,111,94,0.16), transparent 42%),
      linear-gradient(160deg, #e8f0ef 0%, #f4f8f7 45%, #e7eef3 100%);
    font-family: "Segoe UI", system-ui, sans-serif;
    color: #1a2b28;
  }
  .stage {
    width: 1280px; height: 800px;
    display: grid; place-items: center;
    position: relative;
  }
  .caption {
    position: absolute; left: 64px; top: 56px; max-width: 440px;
  }
  .caption h1 {
    margin: 0; font-family: Georgia, "Times New Roman", serif;
    font-size: 42px; letter-spacing: -0.02em; color: #1f4d42;
  }
  .caption p { margin: 12px 0 0; color: #3d524c; font-size: 18px; line-height: 1.45; }
  .frame {
    width: ${width}px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(26,43,40,0.18);
    border: 1px solid rgba(26,43,40,0.08);
    background: white;
  }
  iframe { border: 0; width: 100%; height: ${iframeHeight}px; display: block; }
</style>
</head>
<body>
  <div class="stage">
    <div class="caption">
      <h1>${title}</h1>
      <p>${body}</p>
    </div>
    <div class="frame">
      <iframe src="${iframeSrc}"></iframe>
    </div>
  </div>
</body>
</html>`;
}

const popupHtml = inject(read(path.join(dist, "src/popup/index.html")), makeShim());
const optionsHtml = inject(read(path.join(dist, "src/options/index.html")), makeShim());
const breakHtml = inject(
  read(path.join(dist, "src/break/index.html")),
  makeShim({ timer: { status: "break", workEndsAt: null, breakEndsAt: 1 } }),
);
const standHtml = inject(
  read(path.join(dist, "src/stand/index.html")),
  makeShim({ timer: { status: "stand", workEndsAt: null, standEndsAt: 1 } }),
);

const popupShot = framePage({
  title: "Quiet reminders while you work",
  body: "Eye breaks and stand-up nudges — pause, snooze, or take one now without leaving your flow.",
  iframeSrc: "/raw/popup",
  width: 340,
  iframeHeight: 620,
});

const optionsShot = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><title>Settings</title>
<style>html,body{margin:0;width:1280px;height:800px;overflow:hidden}iframe{border:0;width:1280px;height:800px;transform:scale(0.82);transform-origin:top left;width:1561px;height:976px}</style>
</head><body><iframe src="/raw/options"></iframe></body></html>`;

const breakShot = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><title>Break</title>
<style>html,body{margin:0;width:1280px;height:800px;overflow:hidden}iframe{border:0;width:1280px;height:800px}</style>
</head><body><iframe src="/raw/break"></iframe></body></html>`;

const standShot = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><title>Stand</title>
<style>html,body{margin:0;width:1280px;height:800px;overflow:hidden}iframe{border:0;width:1280px;height:800px}</style>
</head><body><iframe src="/raw/stand"></iframe></body></html>`;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const routes = {
  "/shot/popup": popupShot,
  "/shot/options": optionsShot,
  "/shot/break": breakShot,
  "/shot/stand": standShot,
  "/raw/popup": popupHtml,
  "/raw/options": optionsHtml,
  "/raw/break": breakHtml,
  "/raw/stand": standHtml,
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  if (routes[url.pathname]) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(routes[url.pathname]);
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
  console.log(`Store previews: http://127.0.0.1:${port}/shot/{popup,break,stand,options}`);
});
