import { NODE_ENV, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/config/env/enviroments';
import { rateLimit } from 'express-rate-limit';

// En test el limite se desactiva: una suite de integracion o e2e hace decenas de
// peticiones seguidas y el maximo global las cortaria con 429.
const isTestEnvironment = NODE_ENV === 'test';

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isTestEnvironment ? 0 : RATE_LIMIT_MAX, // 0 desactiva el limite en express-rate-limit
  message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.',
  standardHeaders: true, // Devuelve información de límite de velocidad en los encabezados `RateLimit-*`
  legacyHeaders: false, // Desactiva los encabezados `X-RateLimit-*`
  skip: () => isTestEnvironment,
});

export default limiter;
