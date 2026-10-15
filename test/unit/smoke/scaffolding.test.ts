import { describe, expect, it } from 'vitest';

describe('andamiaje de pruebas unitarias', () => {
  it('corre sin base de datos ni servidor', () => {
    expect(1 + 1).toBe(2);
  });
});
