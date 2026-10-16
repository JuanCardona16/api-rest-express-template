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
pnpm docker:up            # nginx + API + MongoDB + Redis + collector de telemetría
pnpm test:e2e             # pruebas contra el stack desplegado
pnpm docker:down          # parar
```

> **Para correr los E2E, subí `RATE_LIMIT_MAX` en tu `.env`** (por ejemplo `1000`). Con el límite por defecto la suite se corta a sí misma con `429` a mitad de camino, y el fallo parece un defecto de la API cuando es un límite. Configured correctamente.

### Escalar la API

La API no publica puertos: el único servicio que lo hace es nginx. Eso es lo
que permite correr varias réplicas:

```bash
docker compose up -d --scale api=3
```

Nginx resuelve `api` en el DNS interno de Docker **en cada petición**, así que
reparte entre las tres. Comprobado: 60 peticiones contra 3 réplicas quedaron
23 / 19 / 19.

Para verlo en vivo, el log de nginx incluye la réplica que atendió cada
petición:

```bash
docker compose logs -f nginx | grep -o 'upstream=[0-9.:]*' | sort | uniq -c
```

Si nginx quedara apuntando a una sola réplica, ese `uniq -c` muestra una sola
línea y ninguna más.

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

| Variable                     | Requerida | Descripción                                           |
| ---------------------------- | --------- | ----------------------------------------------------- |
| `PORT`                       | No        | Puerto del servidor. Por defecto `3000`.              |
| `NODE_ENV`                   | No        | `development`, `test` o `production`.                 |
| `DATABASE_URL`               | **Sí**    | Cadena de conexión a MongoDB.                         |
| `TOKEN_SECRET_KEY`           | **Sí**    | Secreto de los tokens de acceso.                      |
| `REFESCH_TOKEN_SECRET_KEY`   | **Sí**    | Secreto de los tokens de refresco.                    |
| `RESEND_KEY`                 | No        | Servicio de email.                                    |
| `CLIENT_GOOGLE_ID`           | No        | OAuth de Google.                                      |
| `CLIENT_GOOGLE_SECRET`       | No        | OAuth de Google.                                      |
| `SOCKET_CORS_ORIGIN`         | No        | Orígenes permitidos en WebSocket, separados por coma. |
| `RATE_LIMIT_MAX`             | No        | Máximo de solicitudes **por IP** por ventana. `300`.  |
| `RATE_LIMIT_WINDOW_MS`       | No        | Ventana del límite. Por defecto 15 minutos.           |
| `TRUST_PROXY`                | No        | Saltos de proxy en los que confiar. `0` por defecto.  |
| `REDIS_ENABLED`              | No        | Cache de verificación de contraseña. `true`.          |
| `PASSWORD_CACHE_TTL_SECONDS` | No        | Vida del resultado cacheado. `30`.                    |

En `NODE_ENV=test` el límite de solicitudes se desactiva, para que las suites no se corten con `429`.

### El límite es por IP, y eso tiene consecuencias

`RATE_LIMIT_MAX` cuenta **por IP**, no por usuario ni global. Medido con el
valor anterior de `100` sobre 996 usuarios virtuales: 523 878 peticiones, de las
cuales **497 788 salieron rechazadas con `429`**. Un cliente, o una oficina
entera detrás de una NAT, queda con 100 peticiones cada 15 minutos.

`TRUST_PROXY` es lo que hace que ese número signifique algo detrás de un proxy:

- Con `TRUST_PROXY=1` y un solo nginx delante, Express lee la IP real del cliente.
- Con `0` y la API detrás de nginx, `req.ip` es la IP de nginx y **toda la cuota
  de la API es una sola cuota compartida por todos los usuarios**.
- Confiar en toda la cadena es peor: cualquiera puede mandar `X-Forwarded-For` y
  rotar su propia cuota.

Con la API expuesta directamente a internet, el valor correcto es `0`. Cualquier
valor que no sea un entero no negativo cae a `0` a propósito: un `NaN` en
`trust proxy` hace que Express confíe en toda la cadena.

`compose.yaml` pone `TRUST_PROXY=1` porque ahí hay exactamente un nginx delante.

> **Nota**: `.env.example` no se pudo actualizar en este cambio porque el
> entorno de trabajo bloquea la escritura sobre archivos `.env*`. Las variables
> nuevas están documentadas acá y en `odd/tasks/prod-hardening.md`.

## 8. Sondas de salud

Hay tres sondas, con tres significados distintos. Confundirlas es la forma más
rápida de tener un orquestador que nunca saca de rotación una instancia rota.

| Ruta                       | Significado                  | Código        |
| -------------------------- | ---------------------------- | ------------- |
| `GET /api/v1/health`       | El proceso responde          | `200` siempre |
| `GET /api/v1/health/live`  | El proceso responde          | `200` siempre |
| `GET /api/v1/health/ready` | El proceso puede **atender** | `200` o `503` |

Las tres comparten la misma envoltura:

```json
{
  "success": true,
  "data": { "status": "ready", "uptime": 128, "database": "connected" },
  "status": 200,
  "timestamp": "..."
}
```

**Liveness** (`/health`, `/health/live`) responde `200` mientras el proceso atienda.
Cuando la base no está conectada la respuesta sigue siendo `200` con
`status: "degraded"`: un healthcheck que muere con la base provoca reinicios en
cascada, y una degradación visible es preferible.

**Readiness** (`/health/ready`) responde `503` mientras Mongo no esté conectado, y
solo `200` cuando `readyState` es `connected`. `connecting` **no** cuenta como
sano: durante esa ventana el proceso todavía no puede atender y por eso no debe
recibir tráfico.

Esta es la ruta que el orquestador tiene que usar para decidir. Con una sola
sonda que devuelve `200` siempre, una instancia sin base de datos sigue
"healthy" y el balanceador le sigue mandando tráfico.

Las tres van montadas **antes** del limitador de velocidad, a propósito: si
compartieran cuota con el tráfico real, el healthcheck del contenedor consumiría
el cupo cada 10 segundos y la API empezaría a contestar `429` sola.

`/health/ready` usa su propia envoltura y no `ApiSuccessResponse` ni
`ApiErrorResponse`. El envelope de dominio tiene `success: true` como
discriminante fijo, así que un `503` no entra: mandarlo con `success: true`
miente, y mandarlo con el envelope de error descarta `uptime` y `database`
justo cuando hacen falta. Una sonda la consume el orquestador, no un cliente.

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
- **Healthcheck de readiness**, no de liveness: verifica que el contenedor además de responder pueda leer de Mongo. Con una sonda de liveness, un contenedor sin base queda sano y sigue recibiendo tráfico.

tsup deja las dependencias fuera del bundle, así que el artefacto necesita un `node_modules` de producción al lado. La imagen lo resuelve con una etapa dedicada de `pnpm install --prod`.

### Límites de recursos

Sin topes, un contenedor runaway se come el nodo entero y el problema deja de ser
el contenedor.

| Servicio    | CPU | Memoria |
| ----------- | --- | ------- |
| `api`       | 2.0 | 768M    |
| `mongo`     | 1.5 | 2G      |
| `redis`     | 0.5 | 256M    |
| `nginx`     | 1.0 | 128M    |
| `telemetry` | 0.5 | 256M    |

Son topes **por contenedor**: con `--scale api=3` el presupuesto de la API es
el triple.

`mongod` calcula su caché de WiredTiger a partir de la RAM de la **máquina**, no
del límite del contenedor. Por eso el comando lleva
`--wiredTigerCacheSizeGB 1`: sin eso, un contenedor con tope de 2 GiB intenta
reservar gigas y muere por OOM en lugar de servir.

### Nginx como proxy inverso

`nginx/nginx.conf` se monta en `/etc/nginx/conf.d/`. La resolución de `api` es
**en tiempo de petición** (`resolver 127.0.0.11`), no al arrancar: es lo que hace
funcionar `--scale`. También propaga `X-Forwarded-For`, `X-Forwarded-Proto` y
`Host`, y mantiene los WebSockets de Socket.IO abiertos con un timeout de una
hora en `/socket.io/`.

## 11. Telemetría

OpenTelemetry con trazas y métricas exportadas por OTLP. Instrumentado: `http`,
`express`, `mongoose`, `mongodb`, `ioredis` y las métricas del runtime. `fs`,
`dns` y `net` están apagadas a propósito: generan un span por archivo y por
lookup y revientan el costo sin decir nada del comportamiento de la API.

```bash
docker compose logs -f telemetry   # spans y métricas en el log del collector
```

El collector del stack escribe con el exportador `debug`. Alcanza para **probar
que la instrumentación funciona**; para ver trazas en una interfaz hay que
cambiar el exportador del pipeline `traces` en `otel-collector-config.yaml` por
el backend real (Jaeger, Tempo, Grafana Cloud, Datadog). Eso es configuración,
no código.

### El SDK es un entrypoint aparte, y no es capricho

```bash
node --import ./dist/telemetry.js dist/index.js
```

tsup empaqueta la aplicación en **un solo archivo** ESM, y los imports de
paquetes externos quedan al principio del bundle: esos módulos se resuelven antes
de que corra el cuerpo de cualquier módulo. Un `import './telemetry'` dentro de
`index.ts` se ejecutaría cuando `express` ya está cargado, y los hooks de
`require-in-the-middle` que usa la instrumentación automática solo se instalan
sobre módulos que se cargan después.

El resultado de hacerlo mal no es un error: es un SDK encendido que no
instrumenta nada. Falso, silencioso, y peor que no tenerlo.

`OTEL_ENABLED` está apagado salvo que valga exactamente `true`. Apagado, los
`import()` dinámicos de `register.ts` no se ejecutan y no se carga ni un paquete
del SDK: el costo es cero, no "cargar el SDK y no usarlo". Y cuando está encendido
y el collector no responde, los exportadores reintentan y pierden datos, pero la
API sigue sirviendo: la telemetría nunca es una dependencia del arranque.

En desarrollo (`pnpm dev`) la telemetría **no** está montada: `tsx watch` no
carga el entrypoint con `--import`.

## 12. Convenciones de código

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
- **La conexión a Mongo no se espera.** `core/index.ts` empieza a escuchar antes de confirmar la base de datos. Hay una ventana en la que el puerto acepta tráfico que no se puede atender.
- **CORS loguea en producción.** `corsConfig.ts` tiene `console.log` en cada request y `console.error` por origen rechazado, con un comentario que dice "solo para desarrollo" pero sin la condición que lo haga cierto. La lista de orígenes además es fija en el código.
- **Socket.IO loguea con `console.log`.** Una línea por conexión, por mensaje y por desconexión, con `userId` en claro y sin nivel ni estructura. Es el último `console.log` de la ruta de producción que queda.
- **`cookie-parser`** sigue declarado y sin usar.
- **El límite de velocidad no se comparte entre réplicas.** Usa el `MemoryStore` de `express-rate-limit`: con `--scale api=3` la cuota real es el triple de la configurada, y cada reinicio la limpia. Para cerrarlo hace falta un store en Redis, que ya está en el stack pero no se usa para esto.
- **No hay `trust proxy` fuera de Docker.** `TRUST_PROXY` viene en `0` por defecto y `compose.yaml` lo pone en `1`. Un despliegue con balanceador propio tiene que fijarlo a mano.
- **La telemetría no corre en desarrollo.** `pnpm dev` no carga el entrypoint con `--import`.
- **La instrumentación de Socket.IO está apagada.** Se enciende con `OTEL_SOCKETIO=true`; no se verificó que no rompa conexiones.
- **`.env.example` quedó desactualizado.** No incluye `TRUST_PROXY`, `OTEL_*` ni los nuevos valores por defecto. El entorno de trabajo bloqueó la escritura sobre archivos `.env*` durante este cambio.

Resuelto y ya fuera de esta lista:

- **Login enumera usuarios.** `auth.service.ts` tira un único `401 INVALID_CREDENTIALS` tanto para email inexistente como para contraseña incorrecta, y hay un test que además verifica que los dos casos no se distinguen por tiempo.
- **`ioredis` sin usar.** Ahora es el store del cache de verificación de contraseña.
- **La sonda de salud siempre en `200`.** Separada en `/health/live` y `/health/ready`.

## 13. Licencia

MIT. Ver `LICENSE`.
