import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // GitHub Pages는 /vivoir-promo-builder/ 하위 경로로 서빙 → 빌드 때만 base 지정
  base: command === "build" ? "/vivoir-promo-builder/" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
}));
