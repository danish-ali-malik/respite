import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "./package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "Respite — Eye Care for Developers",
  short_name: "Respite",
  version: packageJson.version,
  description:
    "A calm 20-20-20 eye-break companion. Gentle reminders, idle awareness, local-only stats. Not a medical device.",
  action: {
    default_popup: "src/popup/index.html",
    default_title: "Respite",
    default_icon: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
  },
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
  options_ui: {
    page: "src/options/index.html",
    open_in_tab: true,
  },
  icons: {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
  permissions: ["alarms", "idle", "notifications", "storage", "tabs"],
  host_permissions: [],
});
