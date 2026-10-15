import CustomApiResponses from '@/config/responses/CustomResponses';
import { asyncHandler } from '@/core/errors/asyncHandlerError';
import { GlobalHandleError } from '@/core/errors/GlobalHandleError';
import { validateWithZod } from '@/core/middleware/validate/validateWithZod';
import {
  CustomError,
  DatabaseError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/lib';
import { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const crearRes = (): Response =>
  ({
    headersSent: false,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }) as unknown as Response;

const crearReq = (body: unknown = {}): Request => ({ body }) as Request;

describe('CustomError y sus factory functions', () => {
  it('arma un error con status, message y code', () => {
    const error = CustomError(418, 'Soy un teapot', 'TEAPOT');

    expect(error.status).toBe(418);
    expect(error.message).toBe('Soy un teapot');
    expect(error.code).toBe('TEAPOT');
  });

  it('los atajos usan el status y el code de cada caso', () => {
    expect(ValidationError('x')).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
    expect(NotFoundError('x')).toMatchObject({ status: 404, code: 'NOT_FOUND' });
    expect(UnauthorizedError('x')).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(DatabaseError('x')).toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
  });
});

describe('GlobalHandleError', () => {
  it('responde con el contrato de error: success false, code, status y timestamp', () => {
    const res = crearRes();

    GlobalHandleError(CustomError(404, 'User not found', 'NOT_FOUND'), {} as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);

    const cuerpo = vi.mocked(res.json).mock.calls[0][0];
    expect(cuerpo).toEqual({
      success: false,
      status: 404,
      timestamp: expect.any(String),
      error: { message: 'User not found', code: 'NOT_FOUND' },
    });
  });

  it('cae a 500 y INTERNAL_ERROR cuando el error no trae status ni code', () => {
    const res = crearRes();

    GlobalHandleError(new Error('algo fallo'), {} as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(vi.mocked(res.json).mock.calls[0][0]).toMatchObject({
      success: false,
      status: 500,
      error: { message: 'algo fallo', code: 'INTERNAL_ERROR' },
    });
  });
});

describe('asyncHandler', () => {
  it('responde 200 con el contrato cuando el controlador devuelve un ApiResponse', async () => {
    const res = crearRes();
    const next = vi.fn();

    await asyncHandler(async () => CustomApiResponses.success({ uuid: '1' }))(
      crearReq(),
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(vi.mocked(res.json).mock.calls[0][0]).toEqual({
      success: true,
      data: { uuid: '1' },
      status: 200,
      timestamp: expect.any(String),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 201 cuando el servicio pide creacion', async () => {
    const res = crearRes();

    await asyncHandler(async () => CustomApiResponses.success({ uuid: '1' }, 201))(
      crearReq(),
      res,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('responde 204 sin cuerpo cuando el servicio pide No Content', async () => {
    const res = crearRes();

    await asyncHandler(async () => CustomApiResponses.success(undefined, 204))(
      crearReq(),
      res,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).not.toHaveBeenCalled();
  });

  /**
   * COMPORTAMIENTO ACTUAL, NO EL DESEADO.
   *
   * asyncHandler fuerza 200 siempre. Un controlador no puede responder 201 ni
   * 204. Queda congelado aca; la correccion es S11.
   */
  it('no vuelve a responder cuando el controlador ya envio la respuesta', async () => {
    const res = crearRes();

    await asyncHandler(async (_req, resController) => {
      resController.status(201).json({ created: true });
      resController.headersSent = true;
    })(crearReq(), res, vi.fn());

    // Una sola llamada: la del controlador. asyncHandler respeta headersSent.
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ created: true });
  });

  it('envia al siguiente middleware cuando el controlador lanza', async () => {
    const next = vi.fn();
    const fallo = CustomError(500, 'exploto');

    await asyncHandler(async () => {
      throw fallo;
    })(crearReq(), crearRes(), next);

    expect(next).toHaveBeenCalledWith(fallo);
  });
});

describe('validateWithZod', () => {
  const schema = z.object({ email: z.string().email() });

  it('deja pasar la peticion cuando el body cumple el schema', () => {
    const next = vi.fn();

    validateWithZod(schema)(crearReq({ email: 'a@b.com' }), crearRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rechaza con 400 y el mensaje de Zod cuando el body no cumple', () => {
    const next = vi.fn();

    validateWithZod(schema)(crearReq({ email: 'no-es-un-email' }), crearRes(), next);

    const error = vi.mocked(next).mock.calls[0][0];
    expect(error.status).toBe(400);
    expect(error.message).toMatch(/email/i);
  });

  it('pasa errores que no son de Zod al siguiente middleware sin envolverlos', () => {
    const next = vi.fn();
    const schemaQueExplota = {
      parse: () => {
        throw new TypeError('no soy un ZodError');
      },
    };

    validateWithZod(schemaQueExplota as never)(crearReq({}), crearRes(), next);

    expect(vi.mocked(next).mock.calls[0][0]).toBeInstanceOf(TypeError);
  });
});
