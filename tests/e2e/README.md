# Browser end-to-end tests

These tests cover browser interactions against a built test app. API requests are intercepted with deterministic fixtures so the tests do not depend on live meal data or external image services. Playwright runs with four workers, avoiding Nuxt/Vite HMR contention.

Run the browser tests with:

```bash
pnpm test:e2e
```
