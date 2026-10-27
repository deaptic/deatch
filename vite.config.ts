import { defineConfig, lazyPlugins } from "vite-plus";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
  plugins: lazyPlugins(() => [tailwindcss(), solid()]),

  lint: {
    jsPlugins: ["@shadcn/lint"],
    ignorePatterns: [
      "dist/**",
      "docs/**",
      "extension/**",
      "src-tauri/**",
      "src/lib/bindings.ts",
    ],
    settings: {
      shadcn: {
        ui: "src/components/ui",
        theme: "src/App.css",
      },
    },
    rules: {
      // Solid assigns refs through JSX and tracks signals by bare reads.
      "no-unassigned-vars": "off",
      "no-unused-expressions": "off",
      "no-unused-vars": ["warn", { ignoreRestSiblings: true }],
      "unicorn/no-new-array": "off",
      "shadcn/no-raw-colors": "error",
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-restyle": ["error", { allow: ["layout"] }],
      "shadcn/no-inline-styles": "error",
      "shadcn/require-static-classes": "error",
    },
  },

  fmt: {
    printWidth: 80,
    ignorePatterns: [
      ".claude/**",
      "extension/**",
      "src-tauri/**",
      "src/lib/bindings.ts",
    ],
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  build: {
    sourcemap: true,
  },
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
});
