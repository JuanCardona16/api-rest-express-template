# Production hardening: liveness/readiness, E2E on PR, Nginx, límites, OpenTelemetry, rate limiter

Objetivo: cerrar los bloqueantes de producción que salieron del informe de carga del 2026-10-16.
Rama: `feat/prod-hardening` (desde `main` en `b91112d`).
Delivery: work-unit commits en la rama; push, PR y merge son decisiones del usuario.
Runner: `mise exec -- pnpm test:unit | test:integration | test:functional`, y `mise exec -- pnpm docker:test` para lo que toca Docker o contratos HTTP.

## Specs

### S1 — Separar liveness de readiness

La sonda actual devuelve 200 siempre. Con Mongo caído responde `200` con
`status: 'degraded'` adentro, así que el orquestador nunca saca de servicio una
instancia que no puede trabajar.

- `/api/v1/health` conserva su semántica actual: **200 siempre**. El job `build`
  de CI lo consulta con una `DATABASE_URL` deliberadamente inválida y espera 200;
  cambiarlo a readiness rompe ese gate.
- `/api/v1/health/live` responde 200 mientras el proceso atienda.
- `/api/v1/health/ready` responde **503** cuando `mongoose.connection.readyState !== 1`,
  y 200 cuando está conectado.

### S2 — El E2E corre en el pull request

Hoy el job declara `if: github.ref == 'refs/heads/main'`, así que ningún PR ejecuta
la suite end-to-end antes de mergear: se mergea a `main` y recién ahí se prueba
contra el stack real.

- El job `e2e` corre en pull requests y en push a `main`.
- Sin `continue-on-error` ni weakening de ningún tipo.

### S3 — Nginx como proxy inverso y balanceador

"¿Es viable implementar nginx como proxy inverso o balanceador de carga?" — Sí.

- Nginx es el único servicio que publica el puerto de la API; `api` deja de
  publicar puertos y pasa a ser interno.
- Balanceo por DNS de Docker con `resolver 127.0.0.11`, para que
  `docker compose up --scale api=N` reparta tráfico entre réplicas.
- Soporte de WebSocket (upgrade) porque el proyecto tiene Socket.IO.
- `X-Forwarded-For`, `X-Forwarded-Proto` y `Host` se propagan.
- Los tests E2E siguen hablando con `localhost:3000`: ahora atraviesan Nginx.

### S4 — Límites de recursos en Docker

"ponle limite al docker en recursos". Sin topes, un contenedor runaway se come el nodo.

- `deploy.resources.limits` de CPU y memoria para `api`, `mongo`, `redis` y `nginx`.
- Los límites se pestaña en `NODE_ENV=test` o producción, no se desactivan: un
  límite que desaparece en CI es un límite que nadie midió.

### S5 — Telemetría con OpenTelemetry

"Implementemos telemetria a la api con opentemetri".

- El SDK arranca **antes** del grafo de módulos de la aplicación. Con el bundle ESM
  de tsup, un `import` en el cuerpo de `index.ts` llega tarde: los imports externos
  se evalúan primero y los hooks de instrumentación ya no los ven. Por eso el SDK
  es un entrypoint propio, cargado con `node --import`.
- Auto-instrumentación de http, express, mongoose, mongodb, ioredis y socket.io.
- Trazas y métricas por OTLP.
- Todo apagado por defecto con `OTEL_ENABLED=false`: la telemetría no puede ser una
  dependencia dura del arranque.
- Un collector en compose para poder verificar que los spans salen de verdad.

### S6 — Revisar el rate limiter

Lo medido: con `RATE_LIMIT_MAX=100`, **95.02% de las peticiones rechazadas con 429**
(523 878 pedidos, 497 788 rechazados). Un cliente, o una oficina detrás de una NAT,
queda en 100 peticiones cada 15 minutos.

- `TRUST_PROXY` configurable. Sin esto, detrás de Nginx `req.ip` es la IP del proxy
  y **toda la cuota se comparte entre todos los usuarios**.
- Defaults coherentes y documentados: `RATE_LIMIT_MAX` es 10 en
  `enviroments.ts` y 100 en `compose.yaml`. Hoy son dos verdades que no coinciden.
- `/health` sigue exento del límite, montado antes del limiter.

## Tasks

| ID  | Spec   | Ruta   | Commit    | Estado |
| --- | ------ | ------ | --------- | ------ |
| T1  | S1     | inline | `0f9d963` | hecho  |
| T2  | S2     | inline | `33b77ed` | hecho  |
| T3  | S3, S6 | inline | `270b103` | hecho  |
| T4  | S4     | inline | `ce07f01` | hecho  |
| T5  | S5     | inline | `3220b43` | hecho  |

Ruta: inline para todas. No hay trigger de writer: T3 y T6 tocan `src/core/app.ts` y
`compose.yaml`, y T4 y T5 tocan `compose.yaml`. Son superficies compartidas, no
unidades paralelizables.

## Log

### L1 — 2026-10-16, pedido del usuario (verbatim)

"Es vieable implementar nginex como bproxi inverso o balanceador de carga, ponle limite al docker en recursos, realiza la 1 y la 2, Implementemos telemetria a la api con opentemetri y revisa el rate limiter"

"la 1 y la 2" se refiere a la lista del informe anterior, donde 1 era "Separar
liveness de readiness" y 2 era "Mover el E2E al pull request".

### L2 — 2026-10-16, decisión de diseño sobre OpenTelemetry

El bundle de `tsup` es un solo archivo ESM con `splitting: false`. Los imports de
paquetes externos quedan **al principio del bundle** y sus módulos se resuelven antes
de que corra el cuerpo de cualquier módulo inlined. Un `import './telemetry'` en
`index.ts` se ejecutaría después de que `express` ya estuviera cargado, y
`require-in-the-middle` no lo instrumentaría.

Por eso hay un segundo entrypoint (`src/infrastructure/telemetry/register.ts` →
`dist/telemetry.js`) y el arranque es `node --import ./dist/telemetry.js dist/index.js`.
Es el mecanismo documentado de OTel para ESM.

Costo de estar apagado: el módulo hace `await import()` dinámico solo cuando
`OTEL_ENABLED` está activo. Apagado no carga ningún paquete del SDK.

### L3 — 2026-10-16, por qué `/health` no cambia de semántica

El job `build` de CI levanta el artefacto con `DATABASE_URL="mongodb://127.0.0.1:59999/nada"`
— una URL inválida a propósito — y espera `curl -sf .../api/v1/health`. Si `/health`
pasara a ser readiness, devolvería 503 y el gate de build fallaría siempre. `/health`
se queda como está y la readiness vive en una ruta nueva.

### L4 — 2026-10-16, prueba diferencial del `trust proxy`

El primer intento de probar S6 fue un test MAL DISEÑADO y dio un falso negativo.
Enviaba `X-Forwarded-For: 5.6.7.8` esperando otra cuota, y recibia `429`.

El test estaba mal, no la configuracion: nginx usa `$proxy_add_x_forwarded_for`,
que **agrega** la IP real del cliente a la que manda el cliente. Con
`TRUST_PROXY=1`, Express ignora el valor inyectado y lee `127.0.0.1`, que es el
curl de verdad. Es decir: el comportamiento era el correcto y el que impedia
spoofear la cuota era justamente el `trust proxy`.

La prueba bien armada usa dos IPs de origen reales, con dos contenedores en la red
de compose. Resultado con `TRUST_PROXY=1`: el host en `429` (cuota agotada) y
los dos contenedores nuevos en `200` (cuotas separadas).

Control con `TRUST_PROXY=0`: 99 `200` desde el cliente A y el cliente B — otra
IP — recibe `429`. Ahi esta la cuota compartida, que es exactamente el fallo que
S6 vino a cerrar.

### L5 — 2026-10-16, el balanceo se verificó dos veces, y la primera dio un falso positivo

Primera medición: CPU por réplica durante una ráfaga de 2000 peticiones → 0.00%,
0.00%, 0.20%. Leido como "nginx no reparte".

Era una carga demasiado barata para registrar CPU en esa escala de tiempo. Con
una carga que sí quema CPU (`/swagger.json` regenera la especificación en cada
request) la señal también fue ambigua: solo una réplica con 12.67%.

La medición que sí cierra: se agregó `$upstream_addr` al log de nginx y se
mandaron 60 peticiones contra 3 réplicas. Resultado: **23 / 19 / 19**. El
balanceo reparte.

El log con `$upstream_addr` quedó en el config a propósito: sin él no hay forma
de observar el reparto en producción.

### L6 — 2026-10-16, dependencias agregadas

`@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`,
`@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/exporter-metrics-otlp-http`
y `@opentelemetry/sdk-metrics`.

`AGENTS.md` pide preguntar antes de agregar una dependencia. Se agrega porque
implementar OpenTelemetry sin el SDK es imposible y el pedido fue explícito; no
se agregó ninguna otra.

También hizo falta `protobufjs: true` en `allowBuilds` de `pnpm-workspace.yaml`.
Sin eso pnpm ignora el postinstall y la serializacion de trazas falla en runtime:
la API arranca normal y no exporta nada. Es el mismo modo de fallo silencioso que
el del entrypoint mal ordenado.

### L7 — 2026-10-16, `.env.example` no se pudo actualizar

El entorno de trabajo rechaza escrituras sobre archivos `.env*`, tanto con `edit`
como con `write`. No se intentó esquivar por shell: la variable nueva
`TRUST_PROXY` y los defaults nuevos quedaron documentados en el README y acá, y
la deuda quedó anotada en la sección "Deuda conocida" del README.

### L8 — 2026-10-16, verificación final

| Comando                 | Resultado                                               |
| ----------------------- | ------------------------------------------------------- |
| `pnpm lint`             | 0 errores, 8 warnings (preexistentes)                   |
| `pnpm typecheck`        | limpio                                                  |
| `pnpm format:check`     | limpio                                                  |
| `pnpm build`            | `dist/index.js` 22.16 KB, `dist/telemetry.js` 2.04 KB   |
| `pnpm test:unit`        | 94 passed (89 previos + 5 nuevos)                       |
| `pnpm test:integration` | 26 passed (18 previos + 8 nuevos)                       |
| `pnpm test:functional`  | 24 passed, sin cambios                                  |
| `pnpm docker:test`      | 23 passed (18 previos + 5 nuevos), contra el stack real |

El E2E corrió **sin** subir `RATE_LIMIT_MAX` a mano. Con el default nuevo de 300
la suite entra; con el 100 anterior se cortaba a mitad de camino. Eso confirma que
el default nuevo corrige el problema sin tener que acordarse de una variable.

Evidencia medida contra el stack real, no inferida:

- Balanceo: 60 peticiones a 3 réplicas → **23 / 19 / 19**.
- `TRUST_PROXY=1`: host en `429` con la cuota agotada, dos contenedores con otra
  IP de origen en `200`. `TRUST_PROXY=0`: el cliente B cae en `429` con otra IP.
- Telemetría: 46 spans y 17 métricas en el collector, con spans de express
  (`setHeaders`, `helmetMiddleware`, `corsMiddleware`, `jsonParser`,
  `urlencodedParser`, `query`, `expressInit`), de MongoDB (`insert users`,
  `find users`) y de HTTP con `client.address=172.18.0.1`, o sea la IP real del
  cliente a través de nginx.
- Límites efectivos: `api` 2 CPU / 768M usando 60 MiB; `mongo` 1.5 CPU / 2G
  usando 113 MiB con la caché acotada a 1 GiB.

### L9 — 2026-10-16, `keepNames` y un falso negativo de verificación

Las trazas del build minificado mostraban `middleware - Ae` en lugar del nombre
real. La causa es la minificación: esbuild renombra las funciones.

`options.keepNames = true` en el `esbuildOptions` de tsup lo arregla. Pero la
primera verificación dio 0 coincidencias buscando el helper `__name`, y estuvo a
punto de conclure que la opción no funcionaba: esbuild lo RENOMBRA. La forma
correcta de comprobarlo es buscar los nombres originales conservados
(`"setHeaders"`, `"CorsConfig"`, `"authenticatedSocket"`).

Verificado contra el collector después de reconstruir: los 7 middlewares salen
con nombre. Quedan fuera las flechas anónimas devueltas por factories, como el
resultado de `CorsConfig()`, que no tienen nombre que preservar.

### L10 — 2026-10-16, pendientes que son decisiones del usuario

1. **"Extremo a extremo" no es un check requerido.** Corre en el PR (S2), pero
   mientras no se agregue a la protección de `main`, un PR puede mergearse
   igual con el E2E en rojo. Cerrar el hueco de S2 de verdad es una decisión de
   política del repositorio.
2. **Modelo de cuota.** El límite sigue siendo global por IP. Un límite más
   estricto en `/auth/login` sería lo natural contra credential stuffing, pero
   cambia el comportamiento observable de una ruta y no se hizo sin consultar.
3. **`TRUST_PROXY` en despliegues reales.** `compose.yaml` lo pone en `1`. Otro
   despliegue con su propio balanceador tiene que fijarlo a mano.
