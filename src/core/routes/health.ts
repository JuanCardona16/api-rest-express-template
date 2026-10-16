import { RequestHandler } from 'express';
import mongoose from 'mongoose';

/**
 * Estado de la conexion de mongoose como texto, indexado por `readyState`.
 *
 * Se traduce el numero crudo porque `readyState` es un detalle de la libreria
 * y las sondas son un contrato con el orquestador: si mongoose renumera, este
 * archivo deja de servir un estado inventado en vez de empezar a mentir.
 */
type EstadoBase = 'disconnected' | 'connected' | 'connecting' | 'disconnecting';

const ESTADOS_BASE: Record<number, EstadoBase> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Sondas de salud. Tres rutas con tres significados distintos.
 *
 * - `/health`       proceso vivo. 200 siempre. Lo consulta el job `build` de
 *                   CI con una DATABASE_URL invalida a proposito.
 * - `/health/live`  proceso vivo, con nombre explicito para orquestadores.
 * - `/health/ready` el proceso puede ATENDER. 503 cuando Mongo no esta
 *                   conectado. Esta es la ruta que saca de rotacion una
 *                   instancia inservible.
 *
 * Las tres van montadas ANTES del limitador de velocidad. Si compartieran cuota
 * con el trafico real, el propio healthcheck del contenedor consumiria el cupo
 * cada 10 segundos y la API se auto-limitaria a 429 sin que nadie lo pidiera.
 */
export const HealthRoute = {
  PATH: '/health',
  LIVE: '/health/live',
  READY: '/health/ready',
} as const;

/**
 * Envoltura de una sonda.
 *
 * NO es `ApiSuccessResponse` ni `ApiErrorResponse`, y es a proposito. El
 * envelope de dominio tiene `success: true` como discriminante fijo, asi que
 * un 503 de readiness no entra: mandarlo con `success: true` es mentirle a
 * cualquier cliente que lea el cuerpo, y mandarlo con `ApiErrorResponse`
 * descarta `uptime` y `database` justo cuando hacen falta, que es
 * precisamente cuando la sonda falla.
 *
 * Una sonda no es un recurso de dominio: la consume el orquestador, no un
 * cliente de la API. Por eso tiene su propia forma y no se fuerza a la otra.
 */
interface ProbeResponse {
  success: boolean;
  data: {
    status: string;
    uptime: number;
    database: EstadoBase;
  };
  status: number;
  timestamp: string;
}

const probe = (
  status: string,
  httpStatus: number,
  base: EstadoBase,
): { cuerpo: ProbeResponse; httpStatus: number } => ({
  cuerpo: {
    success: httpStatus < 400,
    data: {
      status,
      uptime: Math.round(process.uptime()),
      database: base,
    },
    status: httpStatus,
    timestamp: new Date().toISOString(),
  },
  httpStatus,
});

const estadoBaseActual = (): EstadoBase =>
  ESTADOS_BASE[mongoose.connection.readyState] ?? 'disconnected';

/** El proceso responde. No dice nada sobre si puede atender. */
const live: RequestHandler = (_req, res) => {
  const { cuerpo } = probe('alive', 200, estadoBaseActual());

  res.status(200).json(cuerpo);
};

/**
 * El proceso puede atender tráfico real.
 *
 * 503 mientras la conexion no este establecida. Solo `connected` (1) cuenta:
 * `connecting` (2) significa que todavia no, y dar 200 ahi reintroduce
 * exactamente la ventana de aceptacion de trafico no servible que esta ruta
 * existe para cerrar.
 */
const ready: RequestHandler = (_req, res) => {
  const base = estadoBaseActual();
  const puedeAtender = mongoose.connection.readyState === 1;
  const { cuerpo, httpStatus } = probe(
    puedeAtender ? 'ready' : 'not_ready',
    puedeAtender ? 200 : 503,
    base,
  );

  res.status(httpStatus).json(cuerpo);
};

/**
 * Sonda de salud del proceso, en `/health`.
 *
 * Responde 200 mientras el proceso responda. El estado de la base se informa
 * como dato, no como veredicto: un healthcheck que muere cuando la base cae
 * provoca reinicios en cascada en lugar de una degradacion visible. Quien
 * necesite decidir si sacar de rotacion una instancia usa `/health/ready`.
 */
const health: RequestHandler = (_req, res) => {
  const base = estadoBaseActual();
  const conectado = mongoose.connection.readyState === 1;
  const { cuerpo } = probe(conectado ? 'ok' : 'degraded', 200, base);

  res.status(200).json(cuerpo);
};

export default health;
export { health, live, ready };
