import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts")) return "recharts";
          if (id.includes("react-router")) return "react-router";
          if (id.includes("react")) return "react";
          if (id.includes("@tanstack")) return "tanstack";
          if (id.includes("@radix-ui")) return "radix";
        },
      },
    },
  },
  server: {
    port: 3001,
    proxy: {
      "/api": {
        target: process.env.ADMIN_BACKEND_URL || "http://localhost:8000",
        changeOrigin: true,
        secure: (process.env.ADMIN_BACKEND_URL || "http://localhost:8000").startsWith("https://"),
      },
    },
  },
  preview: {
    port: 3001,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: process.env.ADMIN_BACKEND_URL || "http://seenos-api:8000",
        changeOrigin: true,
        secure: (process.env.ADMIN_BACKEND_URL || "http://seenos-api:8000").startsWith("https://"),
      },
    },
  },
});
