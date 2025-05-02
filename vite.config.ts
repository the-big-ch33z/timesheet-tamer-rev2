import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    mode === 'development' && componentTagger(),
    mode === 'production' && visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  optimizeDeps: {
    include: [
      "@radix-ui/react-slot",
      "react",
      "react-dom",
      "react-router-dom",
      "date-fns",
    ],
  },
  build: {
    target: 'es2015',
    minify: mode === 'production' ? 'terser' : 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'router';
          }
          if (id.includes('src/components/ui')) {
            return 'ui';
          }
          if (id.includes('src/lib/utils') || id.includes('src/lib/date-utils')) {
            return 'utils';
          }
          if (id.includes('src/contexts')) {
            return 'contexts';
          }
          return null;
        },
      },
    },
    sourcemap: mode !== 'production',
  },
}));
