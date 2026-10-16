import { ApiSuccessResponse } from '@/config/responses/CustomResponses';
import mongoose from 'mongoose';
import { RequestHandler } from 'express';

export const HealthRoute = { PATH: '/health' } as const;

/**
 * Sonda de salud del proceso.
 *
 * Va montada ANTES del limitador de velocidad a propósito. Si compartiera
 * cuota con el tráfico real, el propio healthcheck consumiría el cupo del
 * contenedor cada 10 segundos y la API empezaría a contestar 429 sola.
 *
 * Responde 200 mientras el proceso responda. El estado de la base se informa
 * como dato, no como veredicto: un healthcheck que muere cuando la base cae
 * provoca reinicios en cascada en lugar de una degradación visible.
 */
const health: RequestHandler = (_req, res) => {
  const conexionMongoose = mongoose.connection.readyState;
  const conectado = conexionMongoose === 1;

  const respuesta: ApiSuccessResponse<Record<string, unknown>> = {
    success: true,
    data: {
      status: conectado ? 'ok' : 'degraded',
      uptime: Math.round(process.uptime()),
      database: ['disconnected', 'connected', 'connecting', 'disconnecting'][conexionMongoose],
    },
    status: 200,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(respuesta);
};

export default health;
