import { createApp } from '@/core/app';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const app = createApp();

/**
 * Sonda de salud: tres rutas con tres significados distintos.
 *
 * - `/health`     proceso vivo. 200 siempre. Es lo que consulta el job `build`
 *                 de CI con una DATABASE_URL invalida a proposito.
 * - `/health/live` proceso vivo. Igual a `/health`, con nombre explicito.
 * - `/health/ready` el proceso puede ATENDER. 503 cuando Mongo no esta
 *                 conectado, que es lo que permite sacar de rotacion una
 *                 instancia que no puede trabajar.
 */
describe('sonda de salud', () => {
  /**
   * El valor se captura en `beforeEach`, no al declarar el bloque: el cuerpo de
   * `describe` se evalua en tiempo de coleccion, antes del `beforeAll` del setup
   * que abre la conexion con Mongo. Leyendolo ahi se guardaba `disconnected` y
   * la restauracion dejaba la base caida para el resto de la suite.
   */
  let readyStateOriginal = 0;

  beforeEach(() => {
    readyStateOriginal = mongoose.connection.readyState;
  });

  afterEach(() => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: readyStateOriginal,
      configurable: true,
      writable: true,
    });
  });

  const simularBaseDesconectada = (): void => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 0,
      configurable: true,
      writable: true,
    });
  };

  describe('/api/v1/health', () => {
    it('responde 200 mientras el proceso responda, con la base caida o no', async () => {
      const conBase = await request(app).get('/api/v1/health');
      simularBaseDesconectada();
      const sinBase = await request(app).get('/api/v1/health');

      expect(conBase.status).toBe(200);
      // Esta ruta NO se convierte en readiness: el gate de build de CI la consulta
      // con una URL de base invalida y espera 200.
      expect(sinBase.status).toBe(200);
      expect(sinBase.body.data.status).toBe('degraded');
      expect(sinBase.body.data.database).toBe('disconnected');
    });
  });

  describe('/api/v1/health/live', () => {
    it('responde 200 mientras el proceso responda', async () => {
      const respuesta = await request(app).get('/api/v1/health/live');

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.success).toBe(true);
      expect(respuesta.body.data.status).toBe('alive');
    });

    it('responde 200 aunque la base de datos este caida', async () => {
      simularBaseDesconectada();

      const respuesta = await request(app).get('/api/v1/health/live');

      expect(respuesta.status).toBe(200);
    });

    it('queda fuera del limitador de velocidad', async () => {
      const respuestas = await Promise.all(
        Array.from({ length: 40 }, () => request(app).get('/api/v1/health/live')),
      );

      expect(respuestas.every((r) => r.status === 200)).toBe(true);
    });
  });

  describe('/api/v1/health/ready', () => {
    it('responde 200 cuando puede atender', async () => {
      const respuesta = await request(app).get('/api/v1/health/ready');

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.success).toBe(true);
      expect(respuesta.body.data.status).toBe('ready');
      expect(respuesta.body.data.database).toBe('connected');
    });

    it('responde 503 cuando la base de datos no esta conectada', async () => {
      simularBaseDesconectada();

      const respuesta = await request(app).get('/api/v1/health/ready');

      // 503 es el punto de todo S1: sin esto el orquestador sigue mandandole
      // trafico a una instancia que no puede atenderlo.
      expect(respuesta.status).toBe(503);
      expect(respuesta.body.success).toBe(false);
      expect(respuesta.body.data.status).toBe('not_ready');
      expect(respuesta.body.data.database).toBe('disconnected');
    });

    it('responde 503 mientras la conexion sigue estableciendose', async () => {
      // readyState 2 es 'connecting'. Arrancar y ser considerado sano es distinto
      // a terminar de arrancar: la ventana entre ambos no puede dar 200.
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 2,
        configurable: true,
        writable: true,
      });

      const respuesta = await request(app).get('/api/v1/health/ready');

      expect(respuesta.status).toBe(503);
      expect(respuesta.body.data.database).toBe('connecting');
    });

    it('queda fuera del limitador de velocidad', async () => {
      const respuestas = await Promise.all(
        Array.from({ length: 40 }, () => request(app).get('/api/v1/health/ready')),
      );

      expect(respuestas.every((r) => r.status === 200)).toBe(true);
    });
  });
});
