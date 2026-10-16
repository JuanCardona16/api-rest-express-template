import { parseTrustProxy } from '@/config/env/enviroments';
import { describe, expect, it } from 'vitest';

/**
 * `trust proxy` decide de whom Express se fía para saber la IP real del cliente.
 *
 * Sin esa confianza, `req.ip` es la IP de quien abre el socket, que detrás de un
 * proxy es el proxy mismo. Y como el limitador de velocidad agrupa por `req.ip`,
 * el error no es un detalle de logging: toda la cuota de la API pasa a ser una
 * sola cuota compartida por todos los usuarios, o un atacante la agota por vos.
 *
 * El default es 0: si la API está expuesta directo, confiar en cabeceras que
 * cualquiera puede mandar es trusting the client.
 */
describe('parseTrustProxy', () => {
  it('no confia en nadie cuando la variable no esta definida', () => {
    expect(parseTrustProxy(undefined)).toBe(0);
  });

  it('no confia en nadie cuando la variable viene vacia', () => {
    expect(parseTrustProxy('')).toBe(0);
    expect(parseTrustProxy('   ')).toBe(0);
  });

  it('devuelve el numero de saltos de proxy tal cual', () => {
    expect(parseTrustProxy('0')).toBe(0);
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy('2')).toBe(2);
  });

  it('tolera espacios alrededor del numero', () => {
    expect(parseTrustProxy(' 2 ')).toBe(2);
  });

  it('cae en cero ante cualquier valor que no sea un entero valido', () => {
    // Un NaN acá termina en `app.set('trust proxy', NaN)`, y Express interpreta
    // cualquier valor distinto de `false` como "confio en toda la cadena".
    // Fallar hacia cero mantiene el default seguro.
    expect(parseTrustProxy('abc')).toBe(0);
    expect(parseTrustProxy('1.5')).toBe(0);
    expect(parseTrustProxy('-1')).toBe(0);
    expect(parseTrustProxy('true')).toBe(0);
    expect(parseTrustProxy('Infinity')).toBe(0);
    expect(Number.isNaN(parseTrustProxy('abc'))).toBe(false);
  });
});
