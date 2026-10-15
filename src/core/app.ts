import { setupSwagger } from '@/config/swagger/config';
import { ApiPrefix } from '@/constants';
import express, { Express } from 'express';
import helmet from 'helmet';
import { CorsConfig, setHeaders } from '@/config';
import { GlobalHandleError } from './errors';
import limiter from './middleware/rateLimit/limiter';
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
