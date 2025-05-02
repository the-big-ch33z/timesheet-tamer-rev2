
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
    react({
      // Use correct options for react-swc plugin
      swcReact: {
        development: mode === 'development',
        refresh: mode === 'development',
      },
    }),
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
      // More comprehensive React aliasing to ensure proper resolution
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
      "@radix-ui": path.resolve(__dirname, "node_modules/@radix-ui"),
    },
    // Ensure proper module extension resolution
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
    mainFields: ['module', 'jsnext:main', 'jsnext', 'browser', 'main'],
  },
  optimizeDeps: {
    // Force these packages to be pre-bundled properly
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "date-fns",
      "@radix-ui/react-slot",
      "@radix-ui/react-primitive",
      "clsx",
      "class-variance-authority",
    ],
    // Ensure proper ESM/CJS interop
    esbuildOptions: {
      target: 'es2020',
      jsx: 'automatic',
      platform: 'browser',
    },
  },
  build: {
    target: 'es2015',
    minify: mode === 'production' ? 'terser' : 'esbuild',
    cssMinify: true,
    // Ensure proper module handling
    commonjsOptions: {
      // Handle named exports from CommonJS modules
      transformMixedEsModules: true,
      // Include React and Radix in the transformation process
      include: [
        /node_modules\/react\//,
        /node_modules\/@radix-ui\//,
        /node_modules\/react-dom\//,
      ],
    },
    rollupOptions: {
      output: {
        // Ensure React is included in its own chunk
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'router';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix';
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
  // Ensure React is properly handled but don't use jsxInject since we're importing React explicitly
  esbuild: {
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
}));
