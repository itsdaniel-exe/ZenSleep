import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    // src/ runs in the Workers runtime (see wrangler.jsonc), not Node - no
    // process/fs/etc, but does have fetch/crypto/Request/Response globally.
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.worker,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // test/ and scripts/ run under plain Node (`node --test`, `python`), not the Workers runtime.
    files: ["test/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["node_modules/", "data/", ".wrangler/"],
  },
];
