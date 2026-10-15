<!-- Plantilla de PR. Los cuatro bloques son obligatorios: sin todos, el PR se
     devuelve sin review. Las definiciones de risk lane, gates y prohibiciones
     viven en AGENTS.md, sección "Git Workflow". Este archivo no las duplica. -->

## Tarea

- Spec: `odd/tasks/<feature>.md`
- Tarea: `T<n>` — <!-- ej: T4 -->
- Specs cubiertas: `S<n>` — <!-- ej: S11, S12, S13 -->

## Risk lane

<!-- Green: UI, docs, tests, refactors internos.
     Yellow: business logic, integraciones, jobs.
     Red: auth, payments, PII, migrations, public APIs. -->

**Green** | **Yellow** | **Red**

Aprobadores requeridos: <!-- ej: 1 | 1 + failure paths | 2 + senior -->

## Evidencia

Comandos ejecutados y su resultado observado:

| Comando                 | Resultado                                                                |
| ----------------------- | ------------------------------------------------------------------------ |
| `pnpm lint`             | <!-- ej: 0 errores, 8 warnings -->                                       |
| `pnpm typecheck`        | <!-- ej: limpio -->                                                      |
| `pnpm test:unit`        | <!-- ej: 63 passed -->                                                   |
| `pnpm test:integration` | <!-- ej: 18 passed -->                                                   |
| `pnpm test:functional`  | <!-- ej: 14 passed -->                                                   |
| `pnpm test:e2e`         | <!-- ej: 7 passed. Si el stack no estaba arriba, se omite: indicarlo --> |
| `pnpm build`            | <!-- ej: success -->                                                     |

Criterios de aceptación verificados: <!-- cuáles, y qué prueba los cubre por nombre -->

## Gates

- [ ] Spec enlazada
- [ ] Tests que cubren los criterios de aceptación, no solo "los tests pasan"
- [ ] Sin weakening de CI: nada de `skip`, `--force` ni lints silenciados
- [ ] Sin secrets en código, fixtures ni logs
- [ ] APIs reales: cada import, método y flag existe en esta versión del repo
- [ ] Respeta module boundaries y naming existentes

## Notas para el reviewer

**Decisiones tomadas:** <!-- qué se eligió y qué alternativa se descartó, y por qué -->

**Edge cases cubiertos:** <!-- límites, nulls, errores y casos que rompen a propósito -->

**Lo que NO hice, y por qué:** <!-- alcance diferido, comportamiento que queda igual a
     propósito, deuda que se documenta en vez de corregir. Esto no es una falta: es
     información que el reviewer necesita para decidir. -->

## Tamaño y mezcla

- [ ] Diff de ≤200 líneas, excluyendo archivos generados
- [ ] No mezcla refactoring con feature
- [ ] No mezcla cambios de spec con implementación
- [ ] No incluye "el fix del bug que encontré en el camino" del PR de la feature

<!-- Si el PR es Red, agregar aquí el resultado de la verificación explícita de los
     failure paths: qué entradas producen error y qué respuesta devuelve cada una. -->
