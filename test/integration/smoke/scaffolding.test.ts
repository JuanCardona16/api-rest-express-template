import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';

describe('andamiaje de pruebas de integracion', () => {
  it('conecta contra un mongod real en memoria', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
});
