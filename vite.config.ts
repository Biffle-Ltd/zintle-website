import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Minimal config for production builds (`vite build`). */
export default defineConfig({
  plugins: [react()],
});
