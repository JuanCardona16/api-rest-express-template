import { initStackCheck } from '../shared/stack';

/**
 * Punto de entrada de las pruebas de extremo a extremo.
 *
 * Comprueba la disponibilidad del stack ANTES de que se recojan los tests, para
 * que puedan declararse omitidos de verdad. Si la comprobación se hiciera dentro
 * de cada test, la suite reportaría verde sin haber ejecutado nada.
 */
await initStackCheck();
