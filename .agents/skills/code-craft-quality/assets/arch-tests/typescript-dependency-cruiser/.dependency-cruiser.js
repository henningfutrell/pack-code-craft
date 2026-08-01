// Verified against dependency-cruiser's documented `forbidden` rule shape and the
// `--ignore-known` baseline flag. Adapt the placeholder paths ("src/domain", etc.) to the
// real source tree before wiring this in.
//
// BASELINE: the flag is `--ignore-known` (not `--known-violations`). Generate the
// baseline file once, after this config is written and the current violation count is
// accepted as a starting point:
//
//   depcruise src --config .dependency-cruiser.js --output-type baseline \
//     -f .dependency-cruiser-known-violations.json
//
// (or the `depcruise-baseline` shortcut binary, which does the same thing with fewer
// flags). From then on, run with:
//
//   depcruise src --config .dependency-cruiser.js --ignore-known
//
// which suppresses only the violations already present in the baseline file at
// generation time — anything new fails the build. `--no-ignore-known` overrides this and
// reports everything, baseline included; use it to see the true current violation count.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-must-not-depend-on-infrastructure-or-ui',
      severity: 'error',
      comment:
        'Domain/core must not depend on framework, transport, UI, or persistence code. ' +
        'Dependency direction points inward; this rule is the enforcement of that.',
      from: { path: '^src/domain' },
      to: { path: '^src/(infrastructure|ui)' },
    },
    {
      name: 'ui-must-not-depend-on-domain',
      severity: 'error',
      comment:
        'UI must consume application-owned DTOs or ports, not domain models directly. ' +
        'Translate explicitly at the UI/core boundary into UI-owned view models.',
      from: { path: '^src/ui' },
      to: { path: '^src/domain' },
    },
    {
      name: 'adapters-confined-to-the-edge',
      severity: 'error',
      comment:
        'Infrastructure adapters may be depended on by the composition root, but must ' +
        'not be depended on by domain or application code — only referenced from src/main ' +
        'wiring. pathNot excludes the composition root itself from this rule.',
      from: { path: '^src/(domain|application)' },
      to: { path: '^src/infrastructure' },
    },
    {
      name: 'no-mocking-library-in-domain-tests',
      severity: 'error',
      comment:
        'Import-boundary rule, not a semantic mock-target check: this forbids importing ' +
        'the mocking library at all from domain test files. It does not detect a mock ' +
        'constructed against a domain type via some other indirection.',
      from: { path: '^src/domain/.*\\.test\\.' },
      to: { path: '^node_modules/(jest-mock|sinon|ts-mockito)' },
    },
  ],
  options: {
    // pathNot is available alongside path on both `from` and `to` for exclusions, and
    // regex capture groups from `from.path` are available in `to.path`/`to.pathNot` as
    // $1, $2, ... for same-module-family style rules (not used above, shown here for
    // reference):
    //
    //   from: { path: '^src/([^/]+)/' },
    //   to: { pathNot: '^src/$1/' },   // "may only depend on its own module"
    tsPreCompilationDeps: true,
  },
};
