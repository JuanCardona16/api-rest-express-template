# API REST Express Template

Plantilla de API REST con Node.js, Express y TypeScript, organizada en capas técnicas sobre una frontera hexagonal: el dominio no depende de la infraestructura, la infraestructura se conecta a través de contratos.

- **Autenticación** por JWT (acceso y refresco), con registro en bcrypt y login local.
- **MongoDB** con Mongoose, detrás del puerto `IUserRepository`.
- **WebSockets** con Socket.IO, autenticados y con gestión de presencia.
- **Fronteras verificables**: los servicios se prueban contra los puertos, sin base de datos.
- **Suite de pruebas** en cuatro tipos, con Vitest.
- **Build** con tsup a un único artefacto ESM.
- **Docker** multi-etapa con `docker compose`.

---

## 1. Requisitos

| Herramienta | Versión    | Nota                                          |
| ----------- | ---------- | --------------------------------------------- |
| Node.js     | `>=20 <26` | Declarado en `engines`. Ver la nota de abajo. |
| pnpm        | 12.x       | **Único** gestor de dependencias soportado.   |
| Docker      | 24+        | Opcional, solo para el stack completo.        |

```bash
corepack enable   # activa pnpm desde el packageManager del package.json
pnpm install
```

> **Por qué el rango de Node está acotado.** `jsonwebtoken` depende de `jwa`, que a su vez usa `buffer-equal-constant-time`, y ese paquete lee `buffer.SlowBuffer`. Node 26 eliminó esa propiedad, así que en Node 26 el import falla en tiempo de ejecución sin ningún aviso. Si actualizás Node, actualizá también `jwa` y probá el arranque antes de desplegar.

## 2. Arranque rápido

### Desarrollo

```bash
cp .env.example .env      # completá los secretos
pnpm dev                  # recarga en caliente
```

### Con Docker

```bash
pnpm docker:up            # API + MongoDB + Redis
pnpm test:e2e             # pruebas contra el stack desplegado
pnpm docker:down          # parar
```

> **Para correr los E2E, subí `RATE_LIMIT_MAX` en tu `.env`** (por ejemplo `1000`). Con el límite por defecto la suite se corta a sí misma con `429` a mitad de camino, y el fallo parece un defecto de la API cuando es un límiteConfigured correctamente.

## 3. Arquitectura

El proyecto sigue una **arquitectura hexagonal**: el dominio define qué necesita, la infraestructura decide cómo se resuelve.

```
src/
├── core/                # Express, middlewares, manejo global de errores, rutas raíz
├── features/            # Módulos de negocio, uno por feature
├── infrastructure/      # Adaptadores: MongoDB, WebSockets
├── lib/                 # Utilidades compartidas: errores, JWT, contraseñas
├── config/              # Configuración: env, CORS, headers, Swagger, respuestas
└── constants/           # Prefijos y rutas
```

### Capas técnicas por feature

Toda feature sigue la misma estructura:

```
features/<feature>/
├── interfaces/     # #1 Contratos: tipos de dominio y puertos de datos
├── schemas/        # Esquemas de validación con Zod
├── services/       # #3 Lógica de negocio
├── controllers/    # #4 Manejo de HTTP
└── routes/         # Endpoints
```

**La regla que sostiene la arquitectura:** las capas altas dependen de interfaces, nunca de implementaciones. Un servicio importa `IUserRepository`, no el modelo de Mongoose. Las implementaciones viven en `infrastructure/` o en `repository/` y se inyectan por constructor.

Esa regla es verificable: el doble de prueba `test/shared/userRepositoryMock.ts` implementa el puerto. Si un servicio empieza a importar Mongoose directo, el doble deja de alcanzar y los tests lo delatan.

## 4. Contrato de respuestas

Un solo tipo gobierna el éxito y el error. Ambos incluyen el status, y `asyncHandler` lo usa para responder.

```jsonc
// Éxito
{ "success": true, "data": {}, "status": 200, "timestamp": "2026-01-01T00:00:00.000Z" }

// Error
{ "success": false, "error": { "message": "...", "code": "NOT_FOUND" },
  "status": 404, "timestamp": "2026-01-01T00:00:00.000Z" }
```

Los controladores **devuelven** la respuesta; el middleware decide el código HTTP. Para crear un recurso: `CustomApiResponses.success(data, 201)`. Para responder sin cuerpo: `CustomApiResponses.noContent()`.

## 5. Autenticación

Los tokens se devuelven **en el cuerpo de la respuesta JSON**, no en cookies. No hay cookies HTTP `HttpOnly` en esta implementación.

```http
POST /api/v1/auth/register
{ "username": "juan", "email": "juan@example.com", "password": "Password1!" }
```

Las rutas privadas exigen `Authorization: Bearer <token>`.

## 6. Pruebas

Cuatro tipos, cuatro directorios en `test/`. Cada tipo tiene su comando:

```bash
pnpm test:unit          # reglas puras, sin IO. El más rápido.
pnpm test:integration   # app real + mongod real en memoria.
pnpm test:functional    # flujos completos de punta a punta.
pnpm test:e2e           # contra el stack de Docker, por HTTP.
pnpm test:all
```

| Directorio          | Qué prueba                                 | Dependencias            |
| ------------------- | ------------------------------------------ | ----------------------- |
| `test/unit/`        | Reglas de negocio contra los puertos       | Ninguna                 |
| `test/integration/` | Cableado HTTP, middlewares, mongoose       | `mongodb-memory-server` |
| `test/functional/`  | Flujos completos de cada caso de uso       | `mongodb-memory-server` |
| `test/e2e/`         | El sistema desplegado, como un cliente más | Docker                  |
| `test/shared/`      | Dobles de prueba y configuración           | —                       |

`test/e2e` **se omite con un aviso** cuando no hay stack escuchando. No simula un éxito: un E2E verde sin haber probado nada es peor que uno ausente.

### Contrato de contraseñas

La regla de contraseña válida está definida en **un solo lugar**, `PasswordHelpers.validateCharacters`, y la consultan tanto el schema de Zod como el hook de Mongoose. El login no la aplica: una contraseña incorrecta responde `403`, no `400`.

## 7. Variables de entorno

| Variable                   | Requerida | Descripción                                           |
| -------------------------- | --------- | ----------------------------------------------------- |
| `PORT`                     | No        | Puerto del servidor. Por defecto `3000`.              |
| `NODE_ENV`                 | No        | `development`, `test` o `production`.                 |
| `DATABASE_URL`             | **Sí**    | Cadena de conexión a MongoDB.                         |
| `TOKEN_SECRET_KEY`         | **Sí**    | Secreto de los tokens de acceso.                      |
| `REFESCH_TOKEN_SECRET_KEY` | **Sí**    | Secreto de los tokens de refresco.                    |
| `RESEND_KEY`               | No        | Servicio de email.                                    |
| `CLIENT_GOOGLE_ID`         | No        | OAuth de Google.                                      |
| `CLIENT_GOOGLE_SECRET`     | No        | OAuth de Google.                                      |
| `SOCKET_CORS_ORIGIN`       | No        | Orígenes permitidos en WebSocket, separados por coma. |
| `RATE_LIMIT_MAX`           | No        | Máximo de solicitudes por ventana. Por defecto `10`.  |
| `RATE_LIMIT_WINDOW_MS`     | No        | Ventana del límite. Por defecto 15 minutos.           |

En `NODE_ENV=test` el límite de solicitudes se desactiva, para que las suites no se corten con `429`.

## 8. Sonda de salud

`GET /api/v1/health` responde el estado del proceso y de la conexión a la base de datos.

```json
{
  "success": true,
  "data": { "status": "ok", "uptime": 128, "database": "connected" },
  "status": 200,
  "timestamp": "..."
}
```

Está montada **antes** del limitador de velocidad, a propósito: si compartiera cuota con el tráfico real, el healthcheck del contenedor consumiría el cupo cada 10 segundos y la API empezaría a contestar `429` sola.

Cuando la base no está conectada la respuesta sigue siendo `200` con `status: "degraded"`. Un healthcheck que muere con la base provoca reinicios en cascada; una degradación visible es preferible a eso.

## 9. Documentación de la API

Swagger se documenta con anotaciones JSDoc en los archivos de rutas.

| Qué                    | Dónde           | Cuándo                           |
| ---------------------- | --------------- | -------------------------------- |
| Interfaz Swagger       | `/api-docs`     | Solo con `NODE_ENV=development`  |
| Especificación OpenAPI | `/swagger.json` | Siempre, **incluido producción** |

## 10. Docker

`Dockerfile` en cuatro etapas: dependencias, build con tsup, dependencias de producción y runtime.

- **`node:20-slim`, no alpine.** bcrypt solo distribuye binarios precompilados para glibc; en alpine hay que instalar un toolchain de C++ y compilar en cada build.
- **Usuario no root** en la imagen final.
- **Healthcheck** que consulta una ruta que responde `404` a propósito: verifica que Express acepta peticiones, no que la aplicación sea correcta.

tsup deja las dependencias fuera del bundle, así que el artefacto necesita un `node_modules` de producción al lado. La imagen lo resuelve con una etapa dedicada de `pnpm install --prod`.

## 11. Convenciones de código

ESLint 9 con configuración plana (`eslint.config.js`) y Prettier como regla de ESLint, de modo que `.prettierrc` es la única fuente de formato.

```bash
pnpm lint        # 0 errores
pnpm lint:fix
pnpm typecheck
```

Todo import usa el alias `@/`. Los argumentos sin usar se prefijan con `_`.

## 12. Deuda conocida

Documentada a propósito, no resuelta:

- **Rutas comentadas.** Los endpoints de cambio de contraseña y login de Google están implementados pero comentados en `features/authentication/routes/auth.route.ts`. Sus servicios acceden a Mongoose saltándose el repositorio.
- **Email duplicado responde `500`.** El índice único de Mongo lanza dentro del repositorio, que mapea todo error a 500. Debería ser `409`.
- **Login enumera usuarios.** Un email inexistente da `404` y uno existente con contraseña incorrecta da `403`, lo que confirma si una cuenta está registrada.
- **La conexión a Mongo no se espera.** `core/index.ts` empieza a escuchar antes de confirmar la base de datos.
- **CORS loguea en producción.** `corsConfig.ts` tiene `console.log` en cada request y `console.error` por origen rechazado, con un comentario que dice "solo para desarrollo" pero sin la condición que lo haga cierto. La lista de orígenes además es fija en el código y no incluye el puerto por defecto.
- **`ioredis` y `cookie-parser`** siguen declarados y sin usar.

## 13. Licencia

MIT. Ver `LICENSE`.
