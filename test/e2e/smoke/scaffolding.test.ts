import { E2E_BASE_URL, isStackAvailable } from '../../shared/stack';
import { describe, expect, it } from 'vitest';

/**
 * Andamiaje E2E: comprueba que la suite sabe si hay stack, y que la decisión
 * se toma ANTES de correr los tests.
 */
describe('andamiaje de pruebas de extremo a extremo', () => {
  it('expone la URL base del stack', () => {
    expect(E2E_BASE_URL).toMatch(/^https?:\/\//);
  });

  it('resuelve la disponibilidad del stack antes de recoger los tests', () => {
    // Contra el stack arriba debe ser true; sin stack, los describes de arriba se
    // declaran omitidos y no se reportan como aprobados.
    expect(typeof isStackAvailable).toBe('boolean');
  });
});
