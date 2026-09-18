# Browser baseline tests

These tests are the behavior and visual baseline for the current application. API requests are intercepted with deterministic fixtures so the tests do not depend on live meal data or external image services.

Run the functional and visual tests with:

```bash
pnpm test:e2e
```

Create or intentionally update visual baselines only with:

```bash
pnpm test:e2e:update
```

Snapshot updates must be reviewed manually. Refactoring pull requests should pass against the existing snapshots rather than updating them.
