import dotenv from 'dotenv';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 3000;
export const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY as string;
export const REFESCH_TOKEN_SECRET_KEY = process.env.REFESCH_TOKEN_SECRET_KEY as string;
export const DATABASE_URL = process.env.DATABASE_URL as string;

// Email enviroments
export const RESEND_KEY = process.env.RESEND_KEY as string;

// Google enviroments
export const CLIENT_GOOGLE_ID = process.env.CLIENT_GOOGLE_ID!;
export const CLIENT_GOOGLE_SECRET = process.env.CLIENT_GOOGLE_SECRET!;

// Socket.IO: lista de origenes permitidos separados por coma.
// Evita el origen unico '*' combinado con credentials, que es una contradiccion de CORS.
export const SOCKET_CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN || `http://localhost:${PORT}`;

// Limite de solicitudes. En test se desactiva para que las suites no choquen con 429.
//
// El limite es POR IP y la ventana es de 15 minutos. Medido: con el default
// anterior de 100 por ventana, el 95.02% de las peticiones de una prueba de
// carga con 996 VUs salio rechazado con 429. Un solo cliente, o una oficina
// entera detras de una NAT, quedaba con 100 peticiones cada 15 minutos.
export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 300);
export const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);

/**
 * Cuantos saltos de proxy hay delante de la API, para saber de quien fiarse al
 * leer la IP del cliente.
 *
 * Es la pieza que hace que el limite por IP signifique algo detras de Nginx:
 * sin esto, `req.ip` es la IP del proxy y toda la cuota de la API pasa a ser
 * una sola cuota compartida por todos los usuarios. Al reves, si se trusts a
 * toda la cadena, cualquiera puede mandar `X-Forwarded-For` y rotar su cuota.
 *
 * Se cuenta en saltos, no en booleanos: `1` significa "confio en el primer proxy
 * y en nadie mas". Con la API expuesta directo el valor correcto es 0.
 *
 * Cualquier valor que no sea un entero no negativo cae en 0 a proposito: un
 * `NaN` en `trust proxy` hace que Express confíe en toda la cadena, que es
 * exactamente el fallo que esta funcion existe para evitar.
 */
export const parseTrustProxy = (value: string | undefined): number => {
  if (value === undefined || value.trim() === '') {
    return 0;
  }

  const saltos = Number(value);

  return Number.isInteger(saltos) && saltos >= 0 ? saltos : 0;
};

export const TRUST_PROXY = parseTrustProxy(process.env.TRUST_PROXY);

// Cache de verificacion de contrasena.
// REDIS_ENABLED apaga el cache por completo. El cache nunca es una dependencia:
// si Redis no responde, el login sigue hasheando.
export const REDIS_ENABLED = process.env.REDIS_ENABLED
  ? process.env.REDIS_ENABLED !== 'false'
  : NODE_ENV !== 'test';
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// Ventana en la que una contrasena ya verificada no se vuelve a hashear.
// Es una ventana de riesgo para la revocacion: mientras vive, un cambio de
// contrasena no se refleja. Por defecto 30s.
export const PASSWORD_CACHE_TTL_SECONDS = Number(process.env.PASSWORD_CACHE_TTL_SECONDS || 30);

// OpenTelemetry.
//
// Apagado salvo que se pida explicitamente. La telemetria no puede ser una
// dependencia del arranque: si el collector no responde, la API tiene que
// seguir sirviendo igual. Solo el valor exacto 'true' la enciende, para que un
// '1', un 'yes' o un typo no activen la instrumentacion por accidente.
export const isTelemetryEnabled = (value: string | undefined): boolean => value === 'true';

export const OTEL_ENABLED = isTelemetryEnabled(process.env.OTEL_ENABLED);
export const OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'api-rest-express-template';
// Endpoint base de OTLP. Los exportadores de trazas y metricas le agregan sus
// propios sufijos (/v1/traces, /v1/metrics).
export const OTEL_EXPORTER_OTLP_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
// Cada cuanto seyen las metricas. El default del SDK (60s) es largo para un
// servicio que se quiere ver funcionando; 30s tampoco es una frecuencia que
// flood ee un backend.
export const OTEL_METRIC_EXPORT_INTERVAL_MS = Number(
  process.env.OTEL_METRIC_EXPORT_INTERVAL_MS || 30_000,
);
