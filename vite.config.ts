import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// Common build target for consistency
const TARGET = "es2020";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: false, // Allow fallback to another port
    allowedHosts: ["localhost", ".lovableproject.com"], // Allow all Lovable project domains
    proxy: {
      // Forward requests to lovableproject.com to avoid CORS issues
      "/.lovableproject.com": {
        target: "https://lovableproject.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/.lovableproject\.com/, '')
      }
    },
    cors: {
      origin: ["http://localhost:8080", "https://*.lovableproject.com"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    }, // Improved CORS configuration
  },
  preview: {
    port: 4173,
    open: true,
    fs: {
      strict: false, // Important for fallback routing
    },
  },
  plugins: [
    react({
      jsxImportSource: 'react', // Explicitly use React for JSX
      devTarget: TARGET,
      plugins: [],
      tsDecorators: false,
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
      // Ensure React resolution is consistent
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-is": path.resolve(__dirname, "node_modules/react-is"),
      "prop-types": path.resolve(__dirname, "node_modules/prop-types"),
      // Fix lodash imports for Recharts compatibility
      "lodash/isString": path.resolve(__dirname, "node_modules/lodash/isString.js"),
      "lodash/isNaN": path.resolve(__dirname, "node_modules/lodash/isNaN.js"),
      "lodash/get": path.resolve(__dirname, "node_modules/lodash/get.js"),
    },
    // Ensure proper extension resolution
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    dedupe: ['react', 'react-dom', 'react-is', 'prop-types', 'lodash', 'eventemitter3']
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
      "recharts",
      "lodash",
      "react-smooth", // Add react-smooth to optimization
    ],
    exclude: [], // Ensure React is not excluded
    esbuildOptions: {
      target: TARGET,
      jsx: "automatic", // Use automatic JSX transform
      jsxFactory: "React.createElement",
      jsxFragment: "React.Fragment",
      platform: "browser",
    },
  },
  build: {
    target: TARGET, // Consistent target
    minify: mode === "production" ? "terser" : false, // Only minify in production
    cssMinify: mode === "production", // Only minify CSS in production
    commonjsOptions: {
      transformMixedEsModules: true, // Important for handling mixed module types
      include: [
        /node_modules\/react\//, 
        /node_modules\/react-dom\//, 
        /node_modules\/react-is\//, 
        /node_modules\/lodash\//,
        /node_modules\/recharts\//,
        /node_modules\/react-smooth\//,
        /node_modules\/prop-types\//,
        /node_modules\/eventemitter3\//
      ], // Force proper handling of React, lodash, prop-types, and eventemitter3 packages
      requireReturnsDefault: "auto",
      defaultIsModuleExports: true, // Handle prop-types and eventemitter3 default export
    },
    sourcemap: mode !== "production",
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-is")) {
            return "react"; // Bundle all React-related dependencies together
          }
          if (id.includes("node_modules/react-router-dom")) {
            return "router";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "radix";
          }
          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/lodash") ||
            id.includes("node_modules/prop-types") ||
            id.includes("node_modules/react-smooth") ||
            id.includes("node_modules/eventemitter3")
          ) {
            return "charts";
          }
          if (id.includes("src/components/ui")) {
            return "ui";
          }
          if (id.includes("src/lib/utils") || id.includes("src/lib/date-utils")) {
            return "utils";
          }
          if (id.includes("src/contexts")) {
            return "contexts";
          }
          return null;
        },
        entryFileNames: mode === "production" ? "assets/[name].[hash].js" : "assets/[name].js",
        chunkFileNames: mode === "production" ? "assets/[name].[hash].js" : "assets/[name].js",
        assetFileNames: mode === "production" ? "assets/[name].[hash].[ext]" : "assets/[name].[ext]",
      }
    },
    assetsInlineLimit: 4096, // Only inline assets smaller than 4KB
    emptyOutDir: true, // Clean the output directory before each build
  },
  esbuild: {
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    jsx: "automatic", // Ensure consistent JSX handling
    legalComments: "none", // Remove legal comments in production
  },
  define: {
    // Environment variables
    'process.env': {
      NODE_ENV: JSON.stringify(mode),
    },
    // Ensure React.createElement and React.Fragment are available
    'React.createElement': ['react', 'createElement'],
    'React.Fragment': ['react', 'Fragment'],
  },
}));
