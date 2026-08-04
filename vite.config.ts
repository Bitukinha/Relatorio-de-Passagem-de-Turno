import path from "node:path";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
    ignoreOutdatedRequests: true,
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      server: { entry: "server" },
    }),
    // nitro builds the Vercel output; only needed for `vite build`.
    ...(command === "build" ? [nitro({ preset: "vercel" })] : []),
    viteReact(),
  ],
}));
