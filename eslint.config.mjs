import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  // ── Global ignores ────────────────────────────────────────────────
  {
    ignores: [
      "node_modules/",
      "dist/",
      "playwright-report/",
      "test-results/",
      "tta-report/",
      "reports/",
      "logs/",
    ],
  },

  // ── Base JS recommended rules ─────────────────────────────────────
  eslint.configs.recommended,

  // ── TypeScript recommended rules ──────────────────────────────────
  ...tseslint.configs.recommended,

  // ── Project-specific overrides ────────────────────────────────────
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // ── Relaxed rules for test automation projects ──────────────
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "multi-line"],
      "no-duplicate-imports": "error",
    },
  },

  // ── Test file overrides ───────────────────────────────────────────
  {
    files: ["**/*.spec.ts", "**/*.test.ts"],
    rules: {
      // Tests often use `any` for dynamic API responses
      "@typescript-eslint/no-explicit-any": "off",
      // Console is acceptable in test debugging
      "no-console": "off",
    },
  }
);
