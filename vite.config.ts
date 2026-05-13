import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Same-origin proxy in dev so dash.js can load .mpd + segments without CDN CORS. */
const dashCfProxy = {
  "/__dash_cf_proxy": {
    target: "https://d3gao7f0o4i01l.cloudfront.net",
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/__dash_cf_proxy/, ""),
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: "127.0.0.1",
    proxy: dashCfProxy,
  },
  preview: {
    port: 3000,
    host: "127.0.0.1",
    proxy: dashCfProxy,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
