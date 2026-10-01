/**
 * ESLint TS6 Shim
 *
 * typescript-eslint v8 does not support TypeScript 7.0 (Go-based rewrite).
 * This shim intercepts `require("typescript")` and redirects it to the
 * side-by-side TypeScript 6 installation (`typescript-6` package alias).
 *
 * Loaded via `--require ./eslint-ts6-shim.cjs` in the lint npm scripts.
 */
"use strict";

const Module = require("module");
const path = require("path");

// Packages that depend on the TypeScript JS API and need the TS 6 redirect
const TS_API_CONSUMERS = [
  "@typescript-eslint/",
  "typescript-eslint/",
  "ts-api-utils/",
];

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "typescript" && parent && parent.filename) {
    const normalized = parent.filename.split(path.sep).join("/");
    if (TS_API_CONSUMERS.some((pkg) => normalized.includes(pkg))) {
      return originalResolveFilename.call(
        this,
        "typescript-6",
        parent,
        isMain,
        options
      );
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
