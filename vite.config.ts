import { defineConfig, lazyPlugins } from "vite-plus";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

const ignored = ["extension/**", "src-tauri/**", "src/platform/bindings.ts"];

export default defineConfig({
  plugins: lazyPlugins(() => [
    tailwindcss(),
    solid({ hot: !process.env.VITEST }),
  ]),

  lint: {
    jsPlugins: ["@shadcn/lint"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    ignorePatterns: ignored,
    settings: {
      shadcn: {
        ui: "src/kit",
        theme: "src/App.css",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { ignoreRestSiblings: true }],
      "typescript/no-unnecessary-condition": "warn",
      "shadcn/no-raw-colors": "error",
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-restyle": ["error", { allow: ["layout"] }],
      "shadcn/no-inline-styles": "error",
      "shadcn/require-static-classes": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@tauri-apps/",
              message: "Only src/platform imports Tauri.",
            },
            {
              group: ["**/features/*/**", "!**/features/*/index.ts"],
              message: "Import a feature through its index.ts.",
            },
          ],
        },
      ],
    },
    overrides: [
      {
        files: ["src/platform/**"],
        rules: { "no-restricted-imports": "off" },
      },
      {
        files: ["src/kit/**", "src/shared/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  regex:
                    "^(../)+(lib|components|features|platform|app)/|^@tauri-apps/",
                  message: "kit and shared import only kit and shared.",
                  allowTypeImports: true,
                },
              ],
            },
          ],
        },
      },
      {
        // Solid assigns `let` refs through JSX `ref={...}`, which the rule
        // cannot see.
        files: ["**/*.tsx"],
        rules: { "no-unassigned-vars": "off" },
      },
    ],
  },

  test: {
    // Pure logic runs in node; component tests opt into happy-dom per file.
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
    rollupOptions: {
      input: { app: "index.html", widget: "widget.html" },
    },
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
