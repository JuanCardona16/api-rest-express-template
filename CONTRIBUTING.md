# Cómo contribuir

Este proyecto es una plantilla: los cambios se evalúan por lo que teachan, no solo por lo que hacen.

## Antes de escribir código

1. Leé `odd/tasks/architecture-and-toolchain.md` si el trabajo es parte de una remediación en curso.
2. Si el comportamiento ya existe y lo vas a cambiar, **escribí el test primero** y mirá cómo falla. Un test escrito después mide tu arreglo, no la regla.
3. Si la decisión es de producto y no de implementación, preguntá. No la tomes dentro del código.

## Arquitectura

**Capas técnicas por feature.** No hay carpetas por caso de uso dentro de una feature.

```
features/<feature>/
├── interfaces/     # contratos y puertos
├── schemas/        # validación Zod
├── services/       # lógica de negocio
├── controllers/    # HTTP
└── routes/         # endpoints
```

### La regla que no se negocia

**Las capas altas dependen de interfaces, nunca de implementaciones.**

- Un servicio importa `IUserRepository`, jamás el modelo de Mongoose.
- Las implementaciones se inyectan por constructor.
- Los modelos de Mongoose viven en `infrastructure/`.

Esto no es una preferencia de estilo: el doble de prueba `test/shared/userRepositoryMock.ts` implementa el puerto. Si un servicio importa mongoose directo, el doble deja de alcanzar y el test falla solo.

## Convenciones

| Qué | Cómo |
| --- | --- |
| Imports | Siempre el alias `@/`. Nada de rutas relativas de varios niveles. |
| Argumentos sin usar | Prefijo `_` |
| `any` explícito | Evitarlo. Si es inevitable, queda como warning de lint. |
| Formato | `pnpm lint:fix`. `.prettierrc` es la única fuente. |
| Tipos | `pnpm typecheck` debe salir limpio. |

## Verificación mínima antes de un PR

```bash
pnpm lint
pnpm typecheck
pnpm test:all
pnpm build
```

Si tocaste Docker, `pnpm docker:up && pnpm test:e2e`.

## Reglas de negocio

- Los errores de negocio se lanzan con `CustomError(status, message, code)` y llegan al manejador global. No se escriben respuestas a mano en el controlador.
- Los controladores **devuelven** la respuesta; `asyncHandler` decide el status. Un controlador no debería llamar a `res.status()`.
- Una regla de validación tiene **una sola definición**. Si el schema y la base de datos discrepan, hay dos fuentes de verdad y una va a fallar.
- Las credenciales no viajan de vuelta al cliente, ni en la respuesta ni en los listados. Hay un test que lo verifica.

## Commits

Un commit es una unidad de trabajo revisable: código, tests y documentación que van juntos. Nunca agregues atribución de IA ni `Co-Authored-By`.

## Lo que no se cambia sin avisar

- **El contrato de respuesta.** Success y error comparten forma y ambos llevan `status`. Cambiarlo rompe clientes.
- **Los códigos HTTP de endpoints existentes.** Si un status cambia, es una decisión de producto.
- **El alcance de Node.** El rango está acotado por una incompatibilidad conocida de `jsonwebtoken`; ver el README.