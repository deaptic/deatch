import { defineConfig, lazyPlugins } from "vite-plus";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

const ignored = ["extension/**", "src-tauri/**", "src/lib/bindings.ts"];

export default defineConfig({
  plugins: lazyPlugins(() => [tailwindcss(), solid()]),

  lint: {
    jsPlugins: ["@shadcn/lint"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    ignorePatterns: ignored,
    settings: {
      shadcn: {
        ui: "src/components/ui",
        theme: "src/App.css",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { ignoreRestSiblings: true }],
      "shadcn/no-raw-colors": "error",
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-restyle": ["error", { allow: ["layout"] }],
      "shadcn/no-inline-styles": "error",
      "shadcn/require-static-classes": "error",
    },
    overrides: [
      {
        // Solid assigns `let` refs through JSX `ref={...}`, which the rule
        // cannot see.
        files: ["**/*.tsx"],
        rules: { "no-unassigned-vars": "off" },
      },
    ],
  },

  test: {
    // vite-plugin-solid defaults to jsdom; the tests cover pure logic.
    environment: "node",
  },

  fmt: {
    printWidth: 80,
    ignorePatterns: ignored,
  },

  // Keep cargo's output visible in the terminal tauri dev shares.
  clearScreen: false,
  build: {
    // WebView2 is evergreen Chromium, and the app already relies on Temporal.
    target: "esnext",
    sourcemap: true,
  },
  server: {
    // devUrl in tauri.conf.json points here.
    port: 1420,
    strictPort: true,
    watch: {
      // Rust changes rebuild through cargo; a page reload would only add noise.
      ignored: ["**/src-tauri/**"],
    },
  },
});
