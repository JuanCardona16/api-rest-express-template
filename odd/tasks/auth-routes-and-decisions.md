# Decisiones pendientes: cierre y ejecución

Cierra las 9 preguntas que dejó la remediación de arquitectura. Rama base: `main`. Work-unit commits. Test runner: Vitest.

## Specs

- **S19** — The license is MIT, matching the `LICENSE` file. `package.json` declares `IS C` and is corrected. A repository must not ship two different licenses.
- **S20** — No JWT is hardcoded in the repository. `client/client.html` takes the token from an input field instead. An expired token is still a secret-shaped artifact, and it models exactly the pattern the PR gates prohibit.
- **S21** — `ioredis` and `cookie-parser` are removed from `dependencies`. Neither is imported anywhere in the repository, and the README no longer advertises them as features.
- **S22** — Registering a duplicate email answers `409`, not `500`. A duplicate is client input, not a server fault. The repository maps Mongo's duplicate-key error explicitly instead of flattening every failure to 500.
- **S23** — Login does not disclose whether an account exists. The not-found and wrong-password paths answer identically, in status and message.
- **S24** — The change-password and Google login endpoints are exposed, with tests. They are fully implemented today with every route commented out, and both services bypass the `IUserRepository` port; activating them means routing them through the port first.
- **S25** — CI runs on Node 20 with pnpm: lint, typecheck, the three test suites that need no Docker, the build, and the container image build. The E2E suite runs only on `main`, with the stack up.
- **S26** — Branches are cut from `main` and merged into `main`.

Authorization scope: the six decisions the user confirmed on request. Anything else stays documented as debt.

Assumption, not a requirement: unifying the login responses changes a public API status code for a non-existent user, from 404 to 403. Approved explicitly as S23.

## Tasks

- W1 — Settle the license to MIT and record the `main` to `main` branch flow. S19, S26. Route: inline. **DONE** — commit `61cf5ab`.
- W2 — Remove the committed JWT from `client/client.html` and drop `ioredis` and `cookie-parser`. S20, S21. Route: inline. **DONE** — commit `61cf5ab`.
- W3 — Answer 409 for a duplicate email and unify the login responses. S22, S23. Route: inline. **DONE** — commit `b1f3ffb`. 3 unit, 2 integration and 1 functional test failed before implementing.
- W4 — Route the Google and change-password services through `IUserRepository` and expose their endpoints. S24. Route: inline. **DONE** — commit `16e3900`. 10 functional tests added.
- W5 — Add the CI workflow. S25. Route: inline. **DONE** — commit `534a49d`, plus E2E coverage for the new endpoints.

## Log

- L1 — 2026-10-15. Six open questions answered by the user: MIT for the license, remove the hardcoded JWT and fix the client, activate the change-password and Google routes with tests, apply all three behavior changes (409, unified login, drop unused deps), integrate work `main` to `main`, and authorize the full CI workflow.
- L2 — 2026-10-15. Finding that reordered the priority: `client/client.html` carries a hardcoded HS256 JWT with a real uuid, committed in `3446d11` when websockets landed. The token expired on 2025-07-02, so it is not exploitable, but it is a secret-shaped artifact in the tree and it models the exact pattern the PR gates forbid.
- L3 — 2026-10-15. `client/client.html` also points at port 3001 while the application defaults to 3000, and pulls socket.io 4.7.2 from a CDN while the project depends on 4.8.1. It is stale as well as unsafe.
- L4 — 2026-10-15. All five tasks done. Exposing the previously commented routes surfaced four defects the network could not see: `InMemoryCodeSecurityService` kept a single global `this.key`, so two simultaneous password resets overwrote each other's code; the controller repeated that race with `this.key = email`; the service was a module-level singleton that threw without `RESEND_KEY`, so importing the file broke the app; and `password` was `required` in the schema, which made Google signups impossible and had been worked around with a two-character placeholder.
- L5 — 2026-10-15. Two security decisions taken inside the new flow: `forgot-password` answers identically whether or not the email exists, and the token returned by `verify-code` carries the email, so a code cannot change someone else's password.
- L6 — 2026-10-15. The tests were reaching the real Resend network, because `TEST_ENV` supplied a fake key that the SDK accepted. Mail sending is now a no-op under `NODE_ENV=test`.
- L7 — 2026-10-15. Self-inflicted error caught by typecheck: writing the `MailSender` port overwrote `features/authentication/interfaces/index.ts` and deleted `LoginRequestData` and `RegisterRequestData`.
