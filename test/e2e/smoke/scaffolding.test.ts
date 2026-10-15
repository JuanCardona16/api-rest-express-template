import { describe, expect, it } from 'vitest';
import { E2E_BASE_URL, skipUnlessStackIsRunning } from '../../shared/stack';

describe('andamiaje de pruebas de extremo a extremo', () => {
  it('se omite cuando el stack de Docker no esta arriba', async () => {
    const running = await skipUnlessStackIsRunning();
    expect(typeof running).toBe('boolean');
    expect(E2E_BASE_URL).toMatch(/^https?:\/\//);
  });
});
