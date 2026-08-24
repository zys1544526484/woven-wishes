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

export default defineConfig(({ command }) => ({
  base: "./",
  plugins: [react(), ...(command === "build" ? [strictOfflineCsp(), viteSingleFile()] : [])],
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
