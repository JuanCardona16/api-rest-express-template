import { skipUnlessStackIsRunning } from '../shared/stack';

/**
 * Punto de entrada de las pruebas de extremo a extremo.
 *
 * No hay nada que preparar aqui todavia: el estado vive en el contenedor, no en
 * este proceso. La verificacion de disponibilidad si ocurre, y delega en
 * `skipUnlessStackIsRunning` para no fingir cobertura cuando el stack no esta.
 */
export { skipUnlessStackIsRunning };
