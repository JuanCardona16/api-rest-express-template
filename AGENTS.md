# AGENTS.md

API REST con Node + Express + TypeScript. Arquitectura hexagonal sobre capas
técnicas por feature.

## Entorno

- **pnpm es el único gestor de dependencias.** `packageManager` está fijado en
  `package.json`. No uses `npm` ni `npx`, ni propongas npm en documentación.
- **Node `>=20 <26`** (`engines`). El repo trae `.mise.toml` y `.nvmrc` con Node 20.
  Si los shims de mise no están activos en tu shell, prefixá los comandos:
  `mise exec -- pnpm test:all`.
- `allowBuilds` en `pnpm-workspace.yaml` es obligatorio: pnpm 11+ ignora
  silenciosamente `onlyBuiltDependencies`. Sin `bcrypt: true` no se compila.

## Verificación requerida antes de reportar una tarea completada

```bash
mise exec -- pnpm lint        # debe dar 0 errores; los warnings de `any` son intencionales
mise exec -- pnpm typecheck   # debe salir limpio
mise exec -- pnpm test:all    # unit + integration + functional + e2e
mise exec -- pnpm build
```

Si tocaste Docker o contracts de API, sumá:

```bash
mise exec -- pnpm docker:up && mise exec -- pnpm test:e2e
```

Para E2E subí `RATE_LIMIT_MAX` en `.env` (por ejemplo 1000): con el límite por
defecto la suite se corta a sí misma con 429.

## Arquitectura

```
features/<feature>/
├── interfaces/     # contratos y puertos
├── schemas/        # validación Zod
├── services/       # lógica de negocio
├── controllers/    # HTTP
└── routes/         # endpoints
```

Todo import usa el alias `@/`.

## SIEMPRE HACES

- **Escribí el test antes** cuando cambies comportamiento existente, y mirá cómo
  falla antes de implementar.
- **Ubicá la prueba según su tipo**: regla pura → `test/unit/`; cableado HTTP o
  mongoose → `test/integration/`; flujo completo → `test/functional/`; sistema
  desplegado → `test/e2e/`.
- **Validá el puerto en los servicios.** `IUserRepository` es un puerto:
  los servicios lo reciben por constructor y lo prueban con el doble de
  `test/shared/userRepositoryMock.ts`.
- **Los controladores devuelven la respuesta; `asyncHandler` decide el status.**
  Un controlador no llama `res.status()`.
- **Un error de negocio se lanza con `CustomError(status, message, code)`**,
  nunca se escribe una respuesta a mano.
- **Una regla de validación tiene una sola definición.** La de contraseña vive en
  `PasswordHelpers.validateCharacters`; la consultan Zod y el hook de Mongoose.
- **Commits**: Conventional Commits (`feat|fix|docs|test|refactor|build|chore|style(scope):`).
  Sin `Co-Authored-By` ni atribución de IA.

## PREGUNTA ANTES DE

- Habilitar las rutas comentadas de cambio de contraseña y login de Google
  (`features/authentication/routes/auth.route.ts`).
- Cambiar un código HTTP existente o la forma del JSON de respuesta.
- Tocar `LICENSE`: dice MIT y `package.json` dice ISC. La decisión es del dueño.
- Correr migrations o modificar el schema de la colección `users`.
- Agregar una dependencia.
- Cambiar el rango de Node.

## NUNCA HACES

- **Nunca edites** `.env`, `dist/`, `swagger.json` (se genera con
  `pnpm swagger:json`), `.atl/` ni `node_modules/`.
- **Nunca edites** `src/features/user/repository/mongoUserRepositories.ts` para
  cambiar lógica de negocio: ese archivo solo traduce. La lógica va en
  `services/`.
- **Nunca devuelvas `password` ni `password` hasheado** en una respuesta, ni
  siquiera en listados. Hay tests que lo verifican.
- **Nunca montes `GET /api/v1/health` después de `app.use(limiter)`** en
  `src/core/app.ts`: comparte cuota con el tráfico real y el contenedor se
  auto-limita.
- **Nunca montes un handler suelto con `app.use(prefijo, handler)`**: responde a
  todo lo que empiece por ese prefijo y se traga el ruteo.
- **Nunca toques la cadena `users`**: `uuid`, `email` y `username` tienen
  unicidad y validators en `User.schema.ts`.
- **Nunca borres ni reescribas** `odd/tasks/*.md` sin autorización: son la
  especificación de la remediación en curso, con historial.
- **Nunca commitees secretos.** `.env` está ignorado y las imágenes llevan
  `.dockerignore`.

## Reporte de completitud

```md
## Qué hice
<qué cambió y por qué>

## Verificación
- <comando>: <resultado observado>

## Falló, omití o quedó pendiente
- <prueba o chequeo> — <motivo>

## Riesgo
<item de riesgo o "ninguno">
```

Si una verificación requerida falla, decilo en el reporte. No la saltees ni
lo reportes como completada.