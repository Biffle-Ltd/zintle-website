import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZNW_BOOT_FILE = path.join(__dirname, "znw-boot.js");
const ZNW_BOOT_PLACEHOLDER = "/*__ZNW_BOOT_JS__*/";

function inlineWebviewBoot(): Plugin {
  const readBoot = () => {
    const source = fs.readFileSync(ZNW_BOOT_FILE, "utf8");
    if (source.includes("</script")) {
      throw new Error("znw-boot.js must not contain </script");
    }
    return source;
  };

  return {
    name: "inline-webview-boot",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        if (!html.includes(ZNW_BOOT_PLACEHOLDER)) {
          throw new Error(`index.html missing ${ZNW_BOOT_PLACEHOLDER}`);
        }
        return html.replace(ZNW_BOOT_PLACEHOLDER, () => readBoot());
      },
    },
    configureServer(server) {
      server.watcher.add(ZNW_BOOT_FILE);
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith("znw-boot.js")) {
        server.ws.send({ type: "full-reload", path: "*" });
        return [];
      }
    },
  };
}

export default defineConfig({
  plugins: [inlineWebviewBoot(), react()],
  server: {
    port: 3000,
    host: "127.0.0.1",
  },
  preview: {
    port: 3000,
    host: "127.0.0.1",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
