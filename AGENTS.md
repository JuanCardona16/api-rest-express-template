# AGENTS.md

API REST con Node, Express y TypeScript.

## Entorno

- **pnpm es el único gestor de dependencias.** No uses `npm` ni `npx`, ni los
  propongas en documentación.
- **Node `>=20 <26`.** El repo fija Node 20 en `.mise.toml` y `.nvmrc`. Si los
  shims de mise no están activos en tu shell, prefixá: `mise exec -- pnpm test`.
- `allowBuilds` en `pnpm-workspace.yaml` es obligatorio. pnpm 11+ ignora
  silenciosamente `onlyBuiltDependencies`; sin `bcrypt: true` no compila.

## Verificación obligatoria antes de reportar completada una tarea

```bash
mise exec -- pnpm lint        # 0 errores. Los warnings de `any` son convención, no un fallo.
mise exec -- pnpm typecheck
mise exec -- pnpm test:all
mise exec -- pnpm build
```

Con cambios en Docker o en contratos de API, sumá:

```bash
mise exec -- pnpm docker:test
```

Ese script levanta el stack y corre E2E. Necesita `RATE_LIMIT_MAX` alto en tu
`.env` local sin versionar (por ejemplo `1000`): con el valor por defecto la
suite se corta con 429 a mitad de camino.

Si un comando de Docker devuelve `permission denied ... docker.sock`, el shell
no tiene el grupo `docker`. Es eso, no un comando roto: reabrió la sesión o
envolvelo en `newgrp docker -c "..."`.

## SIEMPRE HACES

- **Escribí la prueba antes** de cambiar comportamiento existente, y mirá cómo
  falla antes de implementar.
- **Elegí el directorio según el tipo**: regla pura → `test/unit/`; cableado HTTP
  o mongoose → `test/integration/`; flujo completo → `test/functional/`; sistema
  desplegado → `test/e2e/`.
- **Probá los servicios contra el puerto.** `IUserRepository` se inyecta por
  constructor y se dobla con `test/shared/userRepositoryMock.ts`.
- **Los controladores devuelven la respuesta; `asyncHandler` decide el status.**
- **Los errores de negocio se lanzan con `CustomError(status, message, code)`**,
  nunca se responde a mano.
- **Una regla de validación tiene una sola definición.** La de contraseña está en
  `PasswordHelpers.validateCharacters`, y la consultan tanto Zod como el hook de
  Mongoose. Si agregás una regla, agregala ahí y en ningún otro lado.

## PREGUNTA ANTES DE

- Habilitar las rutas comentadas de cambio de contraseña y login de Google en
  `features/authentication/routes/auth.route.ts`.
- Cambiar un código HTTP existente o la forma del JSON de respuesta.
- Tocar `LICENSE`: dice MIT y `package.json` dice ISC. La decisión es del dueño.
- Modificar el schema de la colección `users`.
- Agregar una dependencia.
- Cambiar el rango de Node.

## NUNCA HACES

- **No edites a mano** `swagger.json`: es un artefacto generado.
- **No pongas lógica de negocio en** `features/user/repository/mongoUserRepositories.ts`.
  Ese archivo traduce; la lógica vive en `services/`.
- **No devuelvas `password`**, hasheado o no, en ninguna respuesta ni listado.
- **No montes `GET /api/v1/health` después de `app.use(limiter)`** en
  `src/core/app.ts`. Comparte cuota con el tráfico real y el contenedor se
  auto-limita.
- **No montes un handler suelto con `app.use(prefijo, handler)`.** Responde a todo
  lo que empiece por ese prefijo y se traga el ruteo.
- **No cambies `uuid`, `email` ni `username`** en `User.schema.ts`: tienen
  unicidad y validators.
- **No borres ni reescribas** `odd/tasks/*.md`. Son la especificación de la
  remediación en curso, con historial.

## Git Workflow

### Branch naming

- Formato: `tipo/short-description` (ej: `feat/auth-oauth`, `fix/n1-user-list`)
- Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `build`, `chore`, `style`

### Commit format

- Conventional Commits: `tipo(escopo): descripción`
- Descripción en imperativo, sin punto final

### PR rules

- Un PR = una tarea de la spec (máx 200 líneas de diff, excluyendo generated)
- No mezclar refactoring con feature (el refactor va en un PR previo)
- No mezclar spec con implementación (la spec se mergea primero)

### Risk lanes (obligatorio en cada PR)

- **Green**: UI, docs, tests, refactors internos → 1 aprobador
- **Yellow**: business logic, integraciones, jobs → 1 aprobador + failure paths
- **Red**: auth, payments, PII, migrations, public APIs → 2 aprobadores + senior

### PR template (usarlo siempre)

Cada PR incluye:

- **Tarea**: spec enlazada + tarea específica
- **Risk lane**: Green / Yellow / Red
- **Evidencia**: tests pasan, lint pasa, criterios de aceptación verificados
- **Notas para el reviewer**: decisiones tomadas, edge cases cubiertos, y lo que
  **no** se hizo y por qué

### Gates (el PR se devuelve sin review si falta alguno)

- Spec enlazada
- Tests que cubren criterios de aceptación, no solo "los tests pasan"
- Sin weakening de CI: nada de `skip`, `--force` ni silenciar lints
- Sin secrets en código, fixtures ni logs
- APIs reales: cada import, método y flag existe en la versión del repo
- Respeta module boundaries y naming existentes

### Prohibiciones

- No abrir PRs WIP con código a medio hacer
- No mezclar "el fix del bug que encontré en el camino" en el PR de la feature
- No usar el PR como chat: las decisiones van a la spec o a Engram
- No mergear sin leer el diff

## Reporte de completitud

```text
## Qué hice
<qué cambió y por qué>

## Verificación
- <comando>: <resultado observado>

## Falló, omití o quedó pendiente
- <prueba o chequeo> — <motivo>

## Riesgo
<item de riesgo o "ninguno">
```

Si una verificación obligatoria falla, va en el reporte. No la saltees ni la
reportes como completada.
