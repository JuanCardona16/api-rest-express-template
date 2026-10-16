import { setupSwagger } from '@/config/swagger/config';
import { ApiPrefix } from '@/constants';
import express, { Express } from 'express';
import helmet from 'helmet';
import { CorsConfig, setHeaders } from '@/config';
import { TRUST_PROXY } from '@/config/env/enviroments';
import { GlobalHandleError } from './errors';
import limiter from './middleware/rateLimit/limiter';
import health, { live, ready, HealthRoute } from '@/core/routes/health';
import { handleNotFound } from './routes';
import routerApplication from './routes/router';

/** Ajustes de construccion de la app, inyectables para las pruebas. */
export interface AppOptions {
  /**
   * Saltos de proxy en los que confiar, sobre el valor de `TRUST_PROXY`.
   *
   * Tiene que fijarse ANTES del limitador de velocidad, porque el limite agrupa
   * por `req.ip`: sin confianza en el proxy, toda la cuota de la API es una sola
   * cuota compartida.
   */
  trustProxy?: number;
}

/**
 * Construye la instancia de Express sin conectar ningun servicio externo.
 *
 * Conectar MongoDB, inicializar sockets y abrir el puerto es responsabilidad de
 * `core/index.ts`. Esta separacion permite montar la app en tests sin base de datos.
 */
export const createApp = ({ trustProxy = TRUST_PROXY }: AppOptions = {}): Express => {
  const app = express();

  // Antes de cualquier middleware que mire `req.ip`.
  app.set('trust proxy', trustProxy);

  // Configuracion
  app.use(helmet());
  app.use(setHeaders);
  app.use(CorsConfig());

  app.use(express.json());
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  // Sondas de salud ANTES del limitador: si compartieran cuota con el tráfico
  // real, el healthcheck del contenedor consumiría el cupo y la API se
  // auto-limitaría a 429 sin que nadie lo pidiera.
  // Rutas exactas, no `app.use(ApiPrefix, ...)`: montado así el handler respondería
  // 200 a todo lo que empiece por /api/v1 y se tragaría el resto de las rutas.
  //
  // `/health` y `/health/live` son liveness: 200 siempre. `/health/ready` es
  // readiness: 503 mientras Mongo no esté conectado, que es lo que permite
  // sacar de rotación una instancia que no puede atender.
  app.get(`${ApiPrefix}${HealthRoute.PATH}`, health);
  app.get(`${ApiPrefix}${HealthRoute.LIVE}`, live);
  app.get(`${ApiPrefix}${HealthRoute.READY}`, ready);

  app.use(limiter); // Aplicar el limitador de velocidad a todas las solicitudes

  // Configura Swagger entre los primeros middlewares
  setupSwagger(app);

  // Rutas
  app.use(ApiPrefix, routerApplication);

  // Route not found
  app.use('*', handleNotFound);

  // Middleware global para el manejo de errores
  app.use(GlobalHandleError);

  // Configuración
  app.disable('x-powered-by');

  return app;
};

export default createApp;
