
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
    // Split vendor chunks for better caching
    splitVendorChunkPlugin(),
    // Only use the tagger in development mode
    mode === 'development' && componentTagger(),
    // Visualize bundle size in stats.html
    mode === 'production' && visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build output
    target: 'es2015',
    minify: 'terser',
    cssMinify: true,
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@/components/ui'],
          utils: ['@/lib/utils', '@/lib/date-utils'],
          contexts: ['@/contexts'],
        },
      },
    },
    // Generate source maps for debugging
    sourcemap: mode !== 'production',
  },
  // Optimize deps for faster development server
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'date-fns'],
  },
}));
