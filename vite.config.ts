import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    port: 4173,
    open: true,
    fs: {
      strict: false,
    },
  },
  plugins: [
    react({
      jsxImportSource: undefined,
      devTarget: "es2020",
    }),
    splitVendorChunkPlugin(),
    mode === "development" && componentTagger(),
    mode === "production" &&
      visualizer({
        filename: "stats.html",
        open: false,
        gzipSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "react-is",
      "prop-types",
      "eventemitter3",
      "date-fns",
      "@radix-ui/react-slot",
      "@radix-ui/react-primitive",
      "clsx",
      "class-variance-authority",
    ],
    esbuildOptions: {
      target: "es2020",
      jsx: "automatic",
      platform: "browser",
    },
  },
  build: {
    target: "es2015",
    minify: mode === "production" ? "terser" : "esbuild",
    cssMinify: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      requireReturnsDefault: "auto",
    },
    sourcemap: mode !== "production",
  },
}));
