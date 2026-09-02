import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
    },
    proxy: {
      "/api": {
        target: "http://13.203.104.98",
        changeOrigin: true,
        headers: {
          Host: "education.local",
        },
        configure: (proxy) => {
          proxy.on("error", (err, req, res) => {
            console.warn("[Vite Proxy Error]", err.message);
          });
        },
      },
    },
  },
});
