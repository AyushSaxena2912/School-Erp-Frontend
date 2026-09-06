import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// The SPA and the API must share an origin so the HttpOnly session cookie works
// without CORS. In dev this proxy provides that; in production vercel.json
// rewrites /api to the same target.
//
// Point at a local bench by setting VITE_PROXY_TARGET, either in `.env.local`
// or on the command line:
//   VITE_PROXY_TARGET=http://127.0.0.1:8002 npm run dev
//
// `loadEnv` is required: Vite does not put .env values on `process.env`, so
// reading process.env here would silently ignore .env.local and fall through to
// the production default below.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const API_TARGET =
    env.VITE_PROXY_TARGET || process.env.VITE_PROXY_TARGET || "http://13.203.104.98";

  // The proxy decides which backend every request reaches, so say so out loud
  // rather than letting a stale .env quietly point dev traffic at production.
  console.log(`[vite] proxying /api and /files -> ${API_TARGET}`);

  const proxyEntry = {
    target: API_TARGET,
    changeOrigin: true,
    headers: { Host: "education.local" },
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      watch: {
        ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
      },
      proxy: {
        "/api": {
          ...proxyEntry,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.warn("[Vite Proxy Error]", err.message);
            });
          },
        },
        "/files": proxyEntry,
      },
    },
  };
});
