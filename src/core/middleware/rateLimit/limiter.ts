import { NODE_ENV, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/config/env/enviroments';
import { rateLimit } from 'express-rate-limit';

// En test el limite se desactiva: una suite de integracion o e2e hace decenas de
// peticiones seguidas y el maximo global las cortaria con 429.
const isTestEnvironment = NODE_ENV === 'test';

/**
 * Limitador global de velocidad.
 *
 * La clave es `req.ip`, la de por defecto de express-rate-limit. Detras de un
 * proxy eso solo funciona si la app confia en los saltos correspondientes
 * (`TRUST_PROXY`, ver `config/env/enviroments.ts`); si no, toda la cuota de la
 * API pasa a ser una sola cuota compartida.
 *
 * El store es el `MemoryStore` de la libreria: la cuota no se comparte entre
 * instancias y se reinicia con el proceso. Con `nginx` delante y `api`
 * escalado, cada replica tiene la suya, asi que la cuota real es `N` veces la
 * configurada. Para cerrarlo hace falta un store compartido en Redis, que ya
 * esta en el stack pero no se usa para esto.
 */
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isTestEnvironment ? 0 : RATE_LIMIT_MAX, // 0 desactiva el limite en express-rate-limit
  message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.',
  standardHeaders: true, // Devuelve información de límite de velocidad en los encabezados `RateLimit-*`
  legacyHeaders: false, // Desactiva los encabezados `X-RateLimit-*`
  skip: () => isTestEnvironment,
});

export default limiter;
