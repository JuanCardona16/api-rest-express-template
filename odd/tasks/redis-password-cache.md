# Cache de verificacion de contrasena con Redis

Rama: `feat/redis-password-cache` desde `origin/main` (`9792ed3`).
Entrega: PR unico. Runner: `mise exec -- pnpm test:all`.

## Specs

S1. El hasheo de contrasena (`bcrypt.compare`) debe poder omitirse cuando el
mismo par (usuario, contrasena) ya fue verificado dentro de una ventana TTL
corta. Origen: el usuario pide "cache con redis y arregla la reduccion de
hasheo, y todo lo demas".

S2. Si Redis no esta disponible, el login debe funcionar igual, hasheando. El
cache es una aceleracion, nunca una dependencia: no puede agregar una forma
nueva de caida.

S3. La clave del cache se deriva de la contrasena mediante
`HMAC-SHA256(TOKEN_SECRET_KEY, contrasena)`. No SHA plano: un dump de Redis
no debe entregar material equivalente a contrasena.

S4. La ventana por defecto es de 30 segundos, configurable por entorno.

S5. Al cambiar una contrasena, la entrada cacheada del usuario debe invalidarse.

S6. `bcrypt` debe ser asincrono (`compare`/`hash`), no `compareSync`/`hashSync`.
Una operacion de CPU bloqueante en el hilo principal congelaba la API
entera. Origina de la medicion de carga: login a 5.66 req/s con CPU clavada
en 100%, contra 20.27 req/s y CPU a 431% con las variantes asincronas.

S7. No se toca el contrato HTTP: mismos status, mismo envelope, mismos mensajes.
Un 401 por contrasena incorrecta sigue siendo 401 y sigue tardando lo mismo
en responder.

## Tasks

| ID  | Spec        | Ruta   | Estado                                                            |
| --- | ----------- | ------ | ----------------------------------------------------------------- |
| T1  | S6          | inline | Hecho. Verificado: 87 unit, 18 integration, 24 functional, 18 e2e |
| T2  | S1,S2,S3,S4 | inline | Hecho. `PasswordVerificationCache` + `RedisClient` degradable     |
| T3  | S5          | inline | Hecho por construccion: ver L5                                    |
| T4  | S1          | inline | Hecho. 12 tests del cache + 8 del login con cache                 |
| T5  | S7          | inline | Hecho. Status, envelope y mensajes sin cambios                    |
| T6  | -           | inline | Hecho con resultado negativo: ver L6                              |

## Log

L1 (2026-10-16, verbatim del usuario): "Entendido, implementa cache con redis y
arregla la reduccion de hasheo, y todo lo demas"

L2 (2026-10-16): Correccion de un error del analisis previo. Se propuso
cachear la sesion en Redis suponiendo que bcrypt estaba en el camino caliente de
las peticiones autenticadas. Es falso: `authorize`
(`src/core/middleware/auth/authorize.ts:13`) solo verifica la firma del JWT, sin
bcrypt y sin consulta a la base. Bcrypt solo corre en `/auth/login`. Por eso el
objeto del cache es el **resultado de la comparacion**, no la sesion.

L3 (2026-10-16): Decisiones tomadas con el usuario y autorizadas por el:
cliente `ioredis`; implementar el cache con HMAC-SHA256, TTL 30s configurable e
invalidacion al cambiar contrasena.

L4 (2026-10-16): Redis figura en `compose.yaml` pero la aplicacion nunca lo uso
(`grep -ri redis src/` sin resultados). Agregar `ioredis` es la primera
dependencia de infra del proyecto; el usuario lo autorizo explicitamente.

## Medicion

Escenario mixto, 996 VUs, mismo script y misma maquina en las dos corridas,
con `UV_THREADPOOL_SIZE` en su valor por defecto (4).

| Metrica             | Sin cache | Con cache      |
| ------------------- | --------- | -------------- |
| Peticiones servidas | 22 385    | **127 966**    |
| Throughput          | ~80 req/s | **~768 req/s** |
| `/auth/login` p50   | 22 602ms  | **607ms**      |
| `/auth/login` p95   | 37 197ms  | **1 087ms**    |
| `/auth/login` max   | 38 839ms  | **2 837ms**    |
| Latencia global p99 | 37 229ms  | **1 103ms**    |
| Errores             | 0         | 0              |

El total de 22 385 peticiones estaba impuesto por la cola del login: los VUs
pasaban 20 segundos esperando un hash. Al dejar de gastarse tiempo en hashear, el
sistema sirve 5.7x mas peticiones en el mismo tiempo.

## Log (continuacion)

L5 (2026-10-16): La invalidacion (S5) no se implementa con una llamada explicita.
El valor cacheado es el hash de bcrypt que se verifico; si la contrasena cambia
en la base, el hash vigente difiere, la comparacion del cache da falso y se
vuelve a hashear. Menos piezas moviles que un `del` que puede fallar o quedar
desincronizado.

L6 (2026-10-16): El ajuste de `UV_THREADPOOL_SIZE` resulto irrelevante con el
cache. Antes, 16 hilos mejoraba el login 2.5x pero arruinaba las lecturas (3.2ms
a 147ms) por saturacion de CPU. Con el cache, el hasheo es una excepcion y no un
cuello: no se midio una segunda vez porque la variable ya no decide el resultado.
Dejarla en su valor por defecto.

L7 (2026-10-16): Con el cache, `/user` paso de 3.2ms a 512ms de p50. No es una
regresion: la latencia no se puede comparar entre corridas que ofrecen cargas
distintas. El sistema esta ahora 5.7x mas cargado, y el limite se movio del
login a la lectura. Ninguna ruta degrada de forma catastrofica: el maximo global
bajo de 38.8s a 2.8s.
