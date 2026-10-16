/**
 * Punto de entrada del SDK de OpenTelemetry.
 *
 * Es un entrypoint APARTE, no un import dentro de `core/index.ts`, y la razon
 * es el orden de evaluacion de los modulos en ESM.
 *
 * `tsup` empaqueta la aplicacion en un solo archivo con `splitting: false`. Los
 * imports de paquetes externos quedan al principio del bundle y esos modulos se
 * resuelven ANTES de que corra el cuerpo de cualquier modulo inlined. Un
 * `import './telemetry'` en `index.ts` se ejecutaria cuando `express` ya esta
 * cargado, y los hooks de `require-in-the-middle` que usa la instrumentacion
 * automatica solo se installment sobre modulos que se cargan despues. El
 * resultado seria un SDK encendido que no instrumenta nada: falso, silencioso,
 * y peor que no tenerlo.
 *
 * La via que si respeta el orden es cargar este archivo antes del entrypoint:
 *
 *     node --import ./dist/telemetry.js dist/index.js
 *
 * Cuando esta apagado, los `import()` dinamicos de abajo no se ejecutan y no se
 * carga ni un paquete del SDK. El costo de tener la telemetria desactivada es
 * cero, no "cargar el SDK y no usarlo".
 */

import {
  OTEL_ENABLED,
  OTEL_EXPORTER_OTLP_ENDPOINT,
  OTEL_METRIC_EXPORT_INTERVAL_MS,
  OTEL_SERVICE_NAME,
} from '@/config/env/enviroments';

if (OTEL_ENABLED) {
  const [
    { NodeSDK },
    { getNodeAutoInstrumentations },
    { OTLPTraceExporter },
    { OTLPMetricExporter },
    { PeriodicExportingMetricReader },
  ] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/auto-instrumentations-node'),
    import('@opentelemetry/exporter-trace-otlp-http'),
    import('@opentelemetry/exporter-metrics-otlp-http'),
    import('@opentelemetry/sdk-metrics'),
  ]);

  const sdk = new NodeSDK({
    serviceName: OTEL_SERVICE_NAME,

    traceExporter: new OTLPTraceExporter({ url: `${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces` }),

    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: `${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics` }),
      exportIntervalMillis: OTEL_METRIC_EXPORT_INTERVAL_MS,
    }),

    /**
     * Solo lo que pesa: http (el servidor entero), express (las rutas),
     * mongoose y mongodb (las consultas), ioredis (el cache de contrasenas) y
     * runtime-node (metricas del proceso, que es lo que hacia falta para saber
     * por que se dispara el limite de CPU).
     *
     * fs, dns y net quedan apagadas: generan un span por archivo y por lookup y
     * revientan el costo sin decir nada del comportamiento de la API. La
     * instrumentacion de socket.io tambien esta apagada por defecto: envuelve
     * el constructor del server y todavia no se pudo comprobar que no rompa las
     * conexiones en este proyecto. Se enciende con OTEL_SOCKETIO=true cuando
     * haga falta.
     */
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
        '@opentelemetry/instrumentation-socket.io': {
          enabled: process.env.OTEL_SOCKETIO === 'true',
        },
      }),
    ],
  });

  sdk.start();

  /**
   * Sin esto, un `docker compose down` corta el proceso antes de que el SDK
   * vacie la cola y los ultimos spans y metricas se pierden: justo los del
   * momento en que algo se rompio, que son los que se quieren ver.
   *
   * Registrar un handler de SIGTERM cambia el comportamiento por defecto de
   * Node, asi que el `process.exit` explicito es obligatorio: sin el, el
   * contenedor ignora la senal y hay que matarlo con SIGKILL.
   */
  const apagar = (codigo: number): void => {
    void sdk
      .shutdown()
      .catch(() => undefined)
      .finally(() => {
        process.exit(codigo);
      });
  };

  process.once('SIGTERM', () => apagar(0));
  process.once('SIGINT', () => apagar(0));
  process.once('beforeExit', () => {
    void sdk.shutdown().catch(() => undefined);
  });
}
