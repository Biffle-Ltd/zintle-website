import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZNW_BOOT_FILE = path.join(__dirname, "znw-boot.js");
const ZNW_BOOT_PLACEHOLDER = "/*__ZNW_BOOT_JS__*/";

function inlineWebviewBoot(apiHost: string): Plugin {
  const readBoot = () => {
    const source = fs.readFileSync(ZNW_BOOT_FILE, "utf8");
    if (source.includes("</script")) {
      throw new Error("znw-boot.js must not contain </script");
    }
    const hostLine = /var HOST = "[^"]*";/;
    if (!hostLine.test(source)) {
      throw new Error('znw-boot.js missing `var HOST = "..."` to inject');
    }
    // Identity replace is success: znw-boot already has this host.
    return source.replace(hostLine, `var HOST = ${JSON.stringify(apiHost)};`);
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiHost =
    mode === "production"
      ? "https://prod.biffle.ai"
      : env.VITE_API_HOST?.trim() || "https://prod.biffle.ai";
  return {
    plugins: [inlineWebviewBoot(apiHost), tailwindcss(), react()],
    server: {
      port: 3000,
      host: true,
      strictPort: true,
      allowedHosts: true,
    },
    preview: {
      port: 3000,
      host: "localhost",
      strictPort: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
