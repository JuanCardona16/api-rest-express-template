import { describe, expect, it } from 'vitest';
import { isTelemetryEnabled } from '@/config/env/enviroments';

/**
 * La telemetria arranca apagada y solo se enciende con el valor exacto `true`.
 *
 * No es False que se compare con `== true`: el riesgo real es que un valor mal
 * copiado en el despliegue encienda la instrumentacion sin que nadie lo haya
 * pedido. Con una comparacion exacta, lo que no es `true` no enciende nada.
 *
 * Y cuando se enciende, la API tiene que seguir funcionando si el collector no
 * esta: la instrumentacion no puede ser una dependencia del arranque.
 */
describe('isTelemetryEnabled', () => {
  it('solo enciende con el valor exacto true', () => {
    expect(isTelemetryEnabled('true')).toBe(true);
  });

  it('no enciende con ningun otro valor', () => {
    expect(isTelemetryEnabled(undefined)).toBe(false);
    expect(isTelemetryEnabled('')).toBe(false);
    expect(isTelemetryEnabled('false')).toBe(false);
    expect(isTelemetryEnabled('1')).toBe(false);
    expect(isTelemetryEnabled('yes')).toBe(false);
    expect(isTelemetryEnabled('TRUE')).toBe(false);
    expect(isTelemetryEnabled('True')).toBe(false);
    expect(isTelemetryEnabled(' true')).toBe(false);
  });
});
