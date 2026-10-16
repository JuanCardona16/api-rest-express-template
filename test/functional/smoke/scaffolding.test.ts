import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';

describe('andamiaje de pruebas funcionales', () => {
  it('dispone de base de datos para correr flujos completos', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
});
