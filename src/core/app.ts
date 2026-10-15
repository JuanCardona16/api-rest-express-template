import { setupSwagger } from '@/config/swagger/config';
import { ApiPrefix } from '@/constants';
import express, { Express } from 'express';
import helmet from 'helmet';
import { CorsConfig, setHeaders } from '@/config';
import { GlobalHandleError } from './errors';
import limiter from './middleware/rateLimit/limiter';
import health, { HealthRoute } from '@/core/routes/health';
import { handleNotFound } from './routes';
import routerApplication from './routes/router';

/**
 * Construye la instancia de Express sin conectar ningun servicio externo.
 *
 * Conectar MongoDB, inicializar sockets y abrir el puerto es responsabilidad de
 * `core/index.ts`. Esta separacion permite montar la app en tests sin base de datos.
 */
export const createApp = (): Express => {
  const app = express();

  // Configuracion
  app.use(helmet());
  app.use(setHeaders);
  app.use(CorsConfig());

  app.use(express.json());
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  // Sonda de salud ANTES del limitador: si compartiera cuota con el tráfico
  // real, el healthcheck del contenedor consumiría el cupo y la API se
  // auto-limitaría a 429 sin que nadie lo pidiera.
  // Ruta exacta, no `app.use(ApiPrefix, ...)`: montado así el handler respondería
  // 200 a todo lo que empiece por /api/v1 y se tragaría el resto de las rutas.
  app.get(`${ApiPrefix}${HealthRoute.PATH}`, health);

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
