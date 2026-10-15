import { createApp } from '@/core/app';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const app = createApp();

describe('enrutado de la API', () => {
  it('responde 404 con el contrato de error cuando la ruta no existe', async () => {
    const response = await request(app).get('/api/v1/esta-ruta-no-existe');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Route Not Found');
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
  });

  /**
   * COMPORTAMIENTO ACTUAL, NO EL DESEADO.
   *
   * Swagger UI se monta unicamente cuando NODE_ENV es 'development', en `/api-docs`.
   * El README anuncia `/api/v1/docs`, que no existe. Y `/swagger.json` se expone
   * en todos los entornos, incluido produccion, donde describe la API completa.
   */
  it('no sirve Swagger UI cuando NODE_ENV no es development', async () => {
    const response = await request(app).get('/api-docs/');

    expect(response.status).toBe(404);
  });

  it('no existe la ruta /api/v1/docs que anuncia el README', async () => {
    const response = await request(app).get('/api/v1/docs/');

    expect(response.status).toBe(404);
  });

  it('expone la especificacion OpenAPI en /swagger.json en cualquier entorno', async () => {
    const response = await request(app).get('/swagger.json');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('openapi');
    expect(response.body.openapi).toBe('3.0.0');
  });

  it('no expone la cabecera x-powered-by', async () => {
    const response = await request(app).get('/api/v1/esta-ruta-no-existe');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
