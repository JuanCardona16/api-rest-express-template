import { REFESCH_TOKEN_SECRET_KEY, TOKEN_SECRET_KEY } from '@/config/env/enviroments';
import { JwtHelpers } from './JwtHelpers';

export * from './JwtHelpers';
export * from './types/TokenPayload';

/**
 * Instancia unica de JwtHelpers, ya configurada con los secretos del entorno.
 *
 * Antes vivia en core/security/security.ts mientras la clase vivia en lib/Jwt:
 * dos lugares para una sola cosa. Ahora el helper y su configuracion estan juntos
 * y solo queda una forma de obtenerlos.
 */
export const jwtHelpers = new JwtHelpers(TOKEN_SECRET_KEY, REFESCH_TOKEN_SECRET_KEY);
