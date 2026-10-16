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

| ID  | Spec   | Ruta   | Commit | Estado    |
| --- | ------ | ------ | ------ | --------- |
| T1  | S1     | inline | —      | pendiente |
| T2  | S2     | inline | —      | pendiente |
| T3  | S3, S6 | inline | —      | pendiente |
| T4  | S4     | inline | —      | pendiente |
| T5  | S5     | inline | —      | pendiente |

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
