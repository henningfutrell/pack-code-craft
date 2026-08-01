// Snippet for eslint.config.js (flat config). Two independent mechanisms shown:
// eslint-plugin-boundaries for layer/element rules, and core no-restricted-imports for a
// single banned-import rule. Both are plain ESLint rules, so both are covered by ESLint's
// own suppression baseline (see the bottom comment) — dependency-cruiser's baseline
// (.dependency-cruiser.js, sibling file) is a separate, unrelated mechanism.

const boundaries = require('eslint-plugin-boundaries');

module.exports = [
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      // Unchanged across the v6.0.0 rename below: element type + glob pattern.
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/domain/*' },
        { type: 'application', pattern: 'src/application/*' },
        { type: 'infrastructure', pattern: 'src/infrastructure/*' },
        { type: 'ui', pattern: 'src/ui/*' },
      ],
    },
    rules: {
      // As of eslint-plugin-boundaries v6.0.0: the rule is `boundaries/dependencies`
      // (renamed from `boundaries/element-types`), and its options key is `policies`
      // (renamed from `rules`). Pre-6.0.0 configs using the old names will not error —
      // they will silently not apply, which is exactly the canary-rule failure mode
      // (enforcement.md) to check for at wiring time.
      'boundaries/dependencies': [
        'error',
        {
          policies: [
            {
              // Domain must not depend on infrastructure or ui.
              from: 'domain',
              disallow: ['infrastructure', 'ui'],
              message: 'domain must not depend on ${dependency.type}',
            },
            {
              // UI segregated from the core API boundary: it may call application, but
              // not reach into domain directly.
              from: 'ui',
              disallow: ['domain'],
              message: 'ui must not depend on ${dependency.type} directly; go through application',
            },
          ],
        },
      ],
    },
  },
  {
    // Scoped via flat-config `files` to domain test files only.
    files: ['src/domain/**/*.test.ts'],
    rules: {
      // Core ESLint rule, no plugin required: forbid importing the mocking library at
      // all from this file set. Import-boundary rule, not a semantic mock-target check —
      // it catches `import { mock } from 'jest-mock'` in a domain test file, not "this
      // mock targets a domain type" wherever it is constructed.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['jest-mock', 'sinon', 'ts-mockito'],
              message: 'Domain tests must not use a mocking library. Exercise real domain logic.',
              // Other object-form options available here: importNames (ban specific
              // named exports only), allowImportNames (allowlist within a banned group),
              // allowTypeImports (permit `import type` even when the value import is
              // banned).
            },
          ],
        },
      ],
    },
  },
];

// ESLint's own suppression baseline (eslint-suppressions.json, v9.24.0+) can front both
// rules above, since both are plain ESLint rules:
//
//   eslint --suppress-all                 # snapshot all current violations as baseline
//   eslint --suppress-rule boundaries/dependencies   # snapshot just one rule
//   eslint --prune-suppressions           # drop stale entries for violations now fixed
//
// Constraint that matters when deciding whether to rely on this: only rules configured
// as "error" are eligible for suppression. A rule left at "warn" cannot be baselined this
// way — promote it to "error" first, or it will not appear in eslint-suppressions.json at
// all and will keep reporting every occurrence, baseline or not.
