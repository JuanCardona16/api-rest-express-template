/**
 * Imprime la especificación OpenAPI por stdout para poder redirigirla a un archivo.
 *
 * Existe para que `pnpm swagger:json` funcione sin depender de un archivo de
 * configuración duplicado: la especificación se construye en un solo lugar y
 * este script solo la vuelca. Se ejecuta con tsx y no con ts-node porque el
 * proyecto es ESM.
 */
import { swaggerSpec } from './config';

process.stdout.write(`${JSON.stringify(swaggerSpec, null, 2)}\n`);
