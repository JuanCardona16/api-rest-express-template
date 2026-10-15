# Architecture and toolchain remediation

Objective: make the template testable and self-consistent. Branch: `refactor/architecture-and-toolchain`. Delivery: work-unit commits, stacked only if the total exceeds ~400 authored changed lines. Test runner: Vitest + supertest.

## Specs

- **S1** — `pnpm` is the only dependency manager. No `npm`, no `npx`. Every install, script and lockfile operation goes through pnpm. Docker builds install with `pnpm install --frozen-lockfile`.
- **S2** — Tests live in a `test/` directory at the repository root, split by type into separate directories: `test/unit/`, `test/integration/`, `test/functional/`, `test/e2e/`, plus `test/shared/` for factories, mocks and helpers and `test/setup/` for global setup and teardown.
- **S3** — The architecture convention is technical layers (option B). Every feature is organized as `features/<feature>/{interfaces,schemas,services,controllers,routes}`, matching the layering already described in the README and already used by `features/user`.
- **S4** — The production build uses `tsup`. `esbuild.config.ts` is removed. Dependencies and peerDependencies stay external by tsup's default behavior, `shims: true` replaces the hand-written `createRequire` banner, and the `@/` alias resolves from tsconfig `paths` in every environment without a custom plugin.
- **S5** — Building the app and connecting services are separate. `createApp()` builds the Express app without touching MongoDB, sockets or the port; `src/core/index.ts` stays the only place that connects the database, initializes sockets and listens.
- **S6** — Rate limiting is configurable per environment. The current global `max: 10` per 15 minutes makes functional, integration and end-to-end tests fail with 429 after the fifth request.
- **S7** — Socket.IO CORS origin comes from configuration. The current `origin: '*'` combined with `credentials: true` is a CORS contradiction and breaks when Docker separates client and server origins.
- **S8** — `.env.example` exists and documents every environment variable the application reads, including the ones the README already lists.
- **S9** — Duplicated sources of truth are removed: one domain `User` model instead of `features/user/model/User.model.ts` plus `infrastructure/mongoDb/Schemas/user/UserModel.ts`, and one JWT helper instead of `core/security/security.ts` plus `lib/Jwt/JwtHelpers.ts`.
- **S10** — All imports use the `@/` alias. Relative imports that traverse five or more levels are removed.
- **S11** — `asyncHandler` honors an explicit status code from the controller, so `201 Created` and `204 No Content` become possible.
- **S12** — Zod errors are read through `error.issues`, not the deprecated `error.errors`.
- **S13** — Success and error responses share one typed response contract.
- **S14** — The runtime strategy for the built artifact is explicit: because dependencies stay external, `dist` requires a production `node_modules`, produced with `pnpm deploy --prod`. The current `copyProductionFiles` step is removed, including its glob bug and the `.env.production` copy into the artifact.
- **S15** — Docker support: `.dockerignore`, a multi-stage `Dockerfile` (deps, build, prod stages with a non-root user), and `compose.yaml` with `api`, `mongo` and `redis` services, healthchecks, and `depends_on: service_healthy`.
- **S16** — Business rules are covered by tests: `AuthenticationServices` and `UserServices` with a mocked `IUserRepository` in `test/unit/`, complete login and registration flows in `test/functional/`, and the same flows against the Dockerized stack in `test/e2e/`.

Authorization scope: refactor and tooling of the existing codebase. The behavior changes that require a decision and were not requested — changing a 404 to a 403, for example — are out of scope and must be captured by characterization tests, not silently fixed.

Acceptance criteria per task are the task's own command results. Test runner: `pnpm test:unit`, `pnpm test:integration`, `pnpm test:functional`, `pnpm test:e2e`, `pnpm test:all`. Before test infrastructure exists, the applicable check is `pnpm build` plus `pnpm lint`.

Assumption, not a requirement: moving `authentication` away from `modules/<case>/` may make a future `authentication` sub-route ambiguous. The user chose technical layers explicitly, so case-based splitting is resolved by convention inside `services/`, not by new directories.

## Tasks

- T0 — Create `createApp()` and split service connection out of app construction. S5, S6, S7, S8. Route: inline. Check: build + lint. **DONE** — commit `feat(core)`. Lint was unavailable (see T10), build and runtime smoke check used instead.
- T1 — Create the `test/` scaffolding, Vitest workspace, `tsconfig.test.json`, pnpm scripts. S1, S2. Route: inline. Check: the four suites run.
- T2 — Characterization tests for helpers, error middleware and one endpoint per route. S16 (partial). Route: inline. Check: unit + integration green.
- T3 — Migrate `features/authentication` to technical layers and remove duplicated models and JWT helpers. S3, S9, S10. Route: inline. Check: full suite green. **DONE** — 43 tests green before and after.
- T4 — Fix the error and response contract: status code support, Zod issues, one typed response. S11, S12, S13. Route: inline. Check: full suite green.
- T5 — Replace esbuild with tsup. S4, S14. Route: inline. Check: `pnpm build` produces a runnable artifact.
- T6 — Business rule tests for authentication and user services, and functional flows. S16. Route: inline. Check: unit + functional green.
- T7 — Docker: `.dockerignore`, multi-stage `Dockerfile`, `compose.yaml`, scripts. S1, S15. Route: inline. Check: stack up and e2e green.
- T8 — Documentation: README describing the real structure, contribution guide. Route: inline. Check: docs match code.
- T10 — Restore ESLint and establish project-wide lint conventions. **DONE** — commits `bfe2830`, `d26ca47`. `pnpm lint`: 0 errors, 15 warnings by convention.

## Log

- L1 — 2026-10-15. User request, verbatim: "Que podemos aprender de este repositorio?" followed by the remediation plan request: "Primero vamos a crear un plan a seguir para mejorar lo que ya esta y resolver los conflictos que existen actualemente." Constraints given verbatim: "Siempre utilizar pnpm para el manejo de dependencias." / "Para los test, crea un directorio en la raiz del proyecto y dividelos por tipos, es decir, test unitarios, test de integracion, test funcionales, y test de extremo a extremo. Organizalos cada uno en directorios separados, dentro del directorio test que vas a crear en la raiz del proyecto." / "Organiza las fases anteriores." / "Construye un plan par implementar docker en este proyecto."
- L2 — 2026-10-15. User corrections, verbatim: "Se me olvido decirte que para la compilacion del proyecto, te recomiendo utilizar tsup. Para el tema de la arquitectura la convencion que se va a seguir es la B (capas tecnicas)." Plan updated; both became S4 and S3.
- L3 — 2026-10-15. Plan approved verbatim: "Listo, tienes luz verde. Plan aprobado."
- L4 — 2026-10-15. Branch created `refactor/architecture-and-toolchain` from `main`. Work starts at T0.
- L5 — 2026-10-15. T0 complete. Three pre-existing failures found and confirmed against `main` before being worked around, not introduced by this work:
  - `pnpm lint` cannot run at all: the repo has `.eslintrc.js` with ESLint 9 installed, which requires `eslint.config.js`. Tracked as T10.
  - `tsc --noEmit` reports one error, `src/infrastructure/mongoDb/Schemas/user/User.schema.ts:58`, `ICustomError` is not assignable to `Error`. Present identically on `main`. Deferred to the error-contract task.
  - `jsonwebtoken` cannot be imported on Node 26: `jwa` depends on `buffer-equal-constant-time`, which reads `buffer.SlowBuffer`, removed from Node. The package declared no `engines` field, so nothing warned about it. Added `engines: ">=20 <26"`, `packageManager: "pnpm@12.11.2"`, `.nvmrc` and `.mise.toml`.
- L6 — 2026-10-15. `pnpm-workspace.yaml` used `onlyBuiltDependencies`, which pnpm 11 replaced with `allowBuilds` and now **ignores silently**. Under pnpm 12 bcrypt was never built. Replaced with `allowBuilds`. Not in the original plan; found while making the build verifiable, and it is exactly the setting the Docker stage depends on.
- L7 — 2026-10-15. Test runner is therefore `mise exec -- pnpm ...` on Node 20.20.2 until the environment is migrated. This is a property of the environment, not of the code.
- L8 — 2026-10-15. T10 complete. Baseline was 67 lint problems. Resolution: `eslint.config.js` flat config replacing `.eslintrc.js`, with the project's original intent preserved and extended — prettier as the single source of format truth, `any` explicit demoted to warning, `eqeqec`/`prefer-const`/`no-var`/`no-unused-expressions` as errors, and `test/**` relaxed for mocks. Added `typescript-eslint`, `@eslint/js@^9.25.0` and `globals` as dev dependencies. `.prettierrc` `trailingComma` corrected from `es5` to `all`, the value `.eslintrc.js` itself declared and the file contradicted.
- L9 — 2026-10-15. Lint surfaced a real defect, not a style problem: `auth.route.ts` imports `changePasswordController` and `AuthenticationGoogleController`, but **every route using them is commented out**. Change-password and Google login are fully implemented and completely unexposed. The unused imports were removed to satisfy lint; **the routes stay commented because enabling them is a behavior change outside the authorized scope.** Open decision for the user.
- L10 — 2026-10-15. `asyncHandler` typed `fn` as `Function`, which accepts any callable and hides the real signature. Replaced with `AsyncRequestHandler` returning `RequestHandler`. Re-enabling of 13 `catch (error)` bindings as bare `catch {}` was verified by `tsc`: exactly one site genuinely used `error` and was reverted.
- L11 — 2026-10-15. T3 complete. `features/authentication` moved from `modules/<case>/` to `interfaces, schemas, services, controllers, routes, config, helpers`; `modules/` removed entirely. `features/user/controller/` renamed to `controllers/`. Domain types moved from `features/user/model/User.model.ts` to `features/user/interfaces/user.types.ts`, with `IUserRepository` folded into `features/user/interfaces/index.ts`.
- L12 — 2026-10-15. JWT consolidated: `core/security/security.ts` deleted, the configured `jwtHelpers` singleton now lives beside the class in `lib/Jwt/index.ts`. There were never two implementations, only a class in one place and a factory in another, but two places to look for one thing. All four call sites updated.
- L13 — 2026-10-15. `lib/index.ts` re-exported `infrastructure/mongoDb/lib/MongoHelpers`, an inverted dependency from the shared library down to infrastructure. Nothing imported it through `lib`; the re-export was removed.
- L14 — 2026-10-15. **Known boundary violation, deliberately not fixed.** `authGoogle.service` and `changePassword.service` import the mongoose model directly instead of going through `IUserRepository`. The port exists and is bypassed. Not migrated because both services are behind commented-out routes and have zero test coverage: refactoring dead code without tests adds risk and no value. Marked in both files and resolved when those routes are enabled.
- L15 — 2026-10-15. Typing `asyncHandler` to satisfy Express 5's `Promise<void>` required dropping the `return` before `res.status().json()` inside `.then`; the chain itself is still returned, so `.catch(next)` still runs. Verified by the characterization test that asserts `next` receives the thrown error.