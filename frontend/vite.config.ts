import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import compression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";
import { Plugin as importToCDN } from "vite-plugin-cdn-import";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isBuild = command === "build";

  return {
    base: isBuild ? "/assets/" : "/",
    plugins: [
      react(),
      tsconfigPaths(),
      tailwindcss(),
      ...(isBuild
        ? [
            importToCDN({
              modules: [
                {
                  name: "react",
                  var: "React",
                  path: "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
                },
                {
                  name: "react-dom",
                  var: "ReactDOM",
                  path: "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
                },
                {
                  name: "axios",
                  var: "axios",
                  path: "https://unpkg.com/axios@1.12.2/dist/axios.min.js",
                },
              ],
            }),
          ]
        : []),
    compression({
      algorithm: "gzip",
      ext: ".gz",
    }),
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
    }),
    visualizer({
      open: false,
      filename: "stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,
    assetsDir: "",
    rollupOptions: {
      ...(isBuild
        ? {
            external: ["react", "react-dom"],
            output: {
              globals: {
                react: "React",
                "react-dom": "ReactDOM",
              },
              manualChunks: {
                "heroui-vendor": [
                  "@heroui/react",
                  "@heroui/theme",
                  "@heroui/system",
                ],
                "framer-vendor": ["framer-motion"],
                "recharts-vendor": ["recharts"],
                "icons-vendor": ["react-icons"],
              },
            },
          }
        : {
            output: {
              manualChunks: {
                "heroui-vendor": [
                  "@heroui/react",
                  "@heroui/theme",
                  "@heroui/system",
                ],
                "framer-vendor": ["framer-motion"],
                "recharts-vendor": ["recharts"],
                "icons-vendor": ["react-icons"],
              },
            },
          }),
    },
    chunkSizeWarningLimit: 1000,
  },
  };
});
