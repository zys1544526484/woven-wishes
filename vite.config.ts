import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

function strictOfflineCsp(): Plugin {
  return {
    name: "strict-offline-csp",
    transformIndexHtml: {
      order: "pre",
      handler() {
        return [{
          tag: "meta",
          attrs: {
            "http-equiv": "Content-Security-Policy",
            content: "default-src 'self' data: blob: 'unsafe-inline'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'none'; font-src 'self' data:; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
          },
          injectTo: "head",
        }];
      },
    },
  };
}

function localPreviewSession(): Plugin {
  const sessionId = String(Date.now());

  return {
    name: "local-preview-session",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__woven-wishes-preview-session", (_request, response) => {
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.setHeader("Cache-Control", "no-store, max-age=0");
        response.end(sessionId);
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  base: "./",
  plugins: [react(), localPreviewSession(), ...(command === "build" ? [strictOfflineCsp(), viteSingleFile()] : [])],
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  },
  build: {
    outDir: "dist",
    modulePreload: false,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
}));
