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
  preview: {
    port: 4173,
    open: true,
    fs: {
      strict: false, // 👈 Important for fallback routing
    },
  },
  plugins: [
    react({
      plugins: [],
      jsxImportSource: undefined,
      devTarget: 'es2020',
    }),
    splitVendorChunkPlugin(),
    mode === 'development' && componentTagger(),
    mode === 'production' &&
      visualizer({
        filename: 'stats.html',
        open: false,
        gzipSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
      "react-is": path.resolve(__dirname, "node_modules/react-is"),
      "prop-types": path.resolve(__dirname, "node_modules/prop-types"),
      "eventemitter3": path.resolve(__dirname, "node_modules/eventemitter3"),
      "@radix-ui": path.resolve(__dirname, "node_modules/@radix-ui"),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
    mainFields: ['module', 'jsnext:main', 'jsnext', 'browser', 'main'],
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
      target: 'es2020',
      jsx: 'automatic',
      platform: 'browser',
    },
  },
  build: {
    target: 'es2015',
    minify: mode === 'production' ? 'terser' : 'esbuild',
    cssMinify: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [
        /node_modules\/react\//,
        /node_modules\/@radix-ui\//,
        /node_modules\/react-dom\//,
        /node_modules\/react-is\//,
        /node_modules\/prop-types\//,
        /node_modules\/recharts\//,
        /node_modules\/lodash\//,
        /node_modules\/react-smooth\//,
        /node_modules\/eventemitter3\//,
      ],
      requireReturnsDefault: 'auto',
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-is')) {
            return 'react';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'router';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/lodash') ||
              id.includes('node_modules/prop-types') || id.includes('node_modules/react-smooth') ||
              id.includes('node_modules/eventemitter3')) {
            return 'charts';
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
  esbuild: {
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
}));
