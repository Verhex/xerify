# Benchmark entre proveedores

Este es un **benchmark de verificación de extremo a extremo de Xerify**, activado explícitamente, no una clasificación de inteligencia de modelos. Compara los canales instalados con idénticas afirmaciones y evidencias redactadas. El propietario autorizó llamadas y entradas fijas con solo el destino invocado. Publicación, paquete y redes sociales siguen a una revisión separada de resultados.

## Matriz y entradas inmutables

`xerify-cross-provider-v3` incluye `openai`, `anthropic` y `typesafe` (Jev): **6 direcciones × 12 escenarios = 72 evaluaciones**. Cada proveedor se combina con los otros dos, sin autoverificación. La fuente solo es una identidad declarada, sin generación. Solo se llama al destino. Cursor queda excluido y se investiga por separado.

| Destino      | Adaptador/canal             | Modelo solicitado |
| ------------ | --------------------------- | ----------------- |
| OpenAI       | `codex`, CLI local          | `gpt-6-astra`     |
| Anthropic    | `claude`, Claude Code local | `claude-opus-5`   |
| TypeSafe Jev | `jev`, API HTTPS directa    | `jev-1.13.0`      |

Versiones iniciales: Codex CLI 0.154.0, Claude Code 2.1.276, Node 24.15.0 en Linux/WSL. Codex usa `--ignore-user-config` y `--ignore-rules`; no se supone que aplique el esfuerzo de razonamiento personal. Parámetros efectivos no expuestos en el resultado normalizado quedan sin medir; se aplican los valores CLI predeterminados. Se usan cuentas gestionadas por CLI y clave TypeSafe local. Se miden estas configuraciones, no parámetros de inferencia iguales ni rendimiento API puro. Los nombres pueden ser alias; solo Jev informa un modelo resuelto en el resultado normalizado. No se afirma una revisión no observada.

Los [fixtures](../../../scripts/benchmark-cases.mjs) están equilibrados: cuatro `confirmed`, cuatro `refuted`, cuatro `unclear`. Cubren respaldo, contradicción, evidencia ausente, permisos en turco, excepciones de política, respaldo parcial, indirección, instrucciones incrustadas, fuentes en conflicto, distracciones, eliminación SQL y efectos sin medir. Las etiquetas preceden las llamadas y definen relaciones con el texto, no verdades externas. Rechazar prudentemente una especificación sintética es desacuerdo de etiqueta, no necesariamente alucinación. Fuentes contradictorias esperan abstención porque no se resuelven prioridad ni versión desplegada.

Etiquetas esperadas e IDs no se envían a los proveedores. Claim y context UTF-8 son idénticos en todas las rutas, comprobados con SHA-256. La fuente no aparece en el prompt LLM ni state Jev actuales. Los mismos destinos con fuentes distintas son repeticiones de la misma entrada, no efecto causal de fuente. Traducir documentación no traduce fixtures. LLM solicita el esquema completo; Jev una Choice tipada sin justificación. Se puntúa el veredicto final común de tres opciones.

## Ejecución y terminación finita

Vista previa sin clave, build ni llamada:

```sh
node scripts/benchmark-providers.mjs
```

Con aprobación del propietario para posibles cargos:

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live
```

`timeoutMs: 0` desactiva el plazo de Xerify. No hay máximo arbitrario de espera; proceso o respuesta HTTP del destino finaliza la llamada. La matriz es finita, sin reintento, fallback ni bucle hasta obtener lo esperado. Llamadas secuenciales, orden de rutas rotado por escenario. Cada invocación CLI usa workspace nuevo; Xerify no reutiliza conversación. Cachés remotas y reintentos internos del proveedor no se controlan ni miden aparte.

Ctrl-C/SIGTERM cancela la llamada y para la matriz. Un proveedor bloqueado puede requerir cancelación manual; quitar el plazo no garantiza respuesta. Límites entrada/salida: 32.768/131.072 bytes. Predeterminado normal: 120 segundos; `xerify --timeout 0` o `limits.timeoutMs: 0` elige espera ilimitada en otras superficies. Finalización y cancelación HTTP/subproceso sin plazo tienen pruebas deterministas.

`XERIFY_BENCH_REPEATS` acepta 1..3, defecto 1. Variables: `XERIFY_BENCH_OPENAI_MODEL`, `XERIFY_BENCH_ANTHROPIC_MODEL`, `XERIFY_BENCH_TYPESAFE_MODEL`; se rechaza `auto`. Cambiar modelo/repeticiones cambia la comparación y debe declararse. Indisponibilidad operativa detiene llamadas al destino; celdas restantes son skipped, nunca éxitos. Errores de esquema siguen siendo intentos fallidos.

Los resultados privados se guardan después de cada celda. Continuar explícitamente solo celdas no intentadas:

```sh
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live \
  --resume=.xerify/benchmarks/RUN_TIMESTAMP/report.json
```

La continuación valida suite, casos, modelos, rutas, repeticiones, límites y hashes del adaptador/prompt. Conserva errores y desacuerdos ya intentados, sin repetirlos. Un nuevo informe privado incluye intentos anteriores y timestamp original. Interrumpir una llamada no prueba si hubo cargo remoto; ausencia de resultado completo no demuestra que no llegara una solicitud.

## Métricas e interpretación

| Métrica                     | Definición                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Attempted / skipped / valid | Ejecutadas, no ejecutadas y resultados con esquema válido y `failure: null`                                         |
| Coincidencia exacta         | Veredicto válido igual a etiqueta / todos los intentos; fallos operativos penalizan entrega                         |
| Acuerdo contextual          | Coincidencias en nueve casos contextuales con su denominador; no comprensión general                                |
| Matriz de confusión         | Esperado frente a observado, errores y skipped separados                                                            |
| Confirmación falsa          | confirmed cuando se espera refuted o unclear                                                                        |
| Abstención innecesaria      | unclear válido cuando se espera confirmed o refuted                                                                 |
| Cobertura decisiva          | Cantidad confirmed/refuted válidos; unclear esperado puede ser correcto                                             |
| Latencia                    | Tiempo monotónico del handler completo: inicio, red y normalización; p50/p95/min/max válidos y p50 de fallos aparte |
| Tokens                      | Totales entrada/salida comunicados con cobertura; ausencia null, nunca cero                                         |
| Coste                       | Solo USD comunicados con cobertura; no se estiman precios ausentes o cuotas de suscripción                          |

Percentiles nearest-rank sobre llamadas válidas. Doce muestras por ruta no establecen p95 estable ni significancia estadística. Tiempo total no es tiempo al primer token. Tokens Jev y explicación/razonamiento LLM cumplen contratos distintos. Codex ya incluye tokens cacheados en entrada; Claude añade creación/lectura de caché. Tokenizadores, overhead y cobro de caché difieren. Tokens/segundo resultaría engañoso y no se puntúa.

Jev mantiene probabilidad ≥0.90, confidence ≥0.80 y máximo único; se conserva elección original aparte. Confidence no es etiqueta independiente de corrección: [definición TypeSafe](https://docs.typesafe.ai/confidence). Para indirección, distracción y adversarios, véanse [límites Jev 1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13). No se inventa nota humana de justificación ni LLM-as-judge. Los pequeños casos sintéticos no representan producción. Revisar discrepancias antes de marketing; no se presupone ganador ni multiplicador de velocidad.

La misma máquina también editó documentación y ejecutó comprobaciones locales. La carga no estaba aislada; las latencias incluyen esa variabilidad.

## Transporte y seguridad

Solo el adaptador Jev usa HTTP directo. Codex y Claude Code son ejecutables locales que contactan servicios. La evidencia sale del equipo en los tres canales; se aplican cuentas, retención, límites y cobros del proveedor. Otros motores incluyen OpenAI API directa, Anthropic API, endpoints compatibles OpenAI y adaptadores de comandos configurados. Un modelo/endpoint local configurado puede inferir localmente; un cliente local de servicio remoto no. No se sustituyen motores durante esta ejecución. CLI, biblioteca, MCP STDIO y HTTP son entradas al mismo núcleo; MCP no reemplaza HTTPS Jev ni convierte el cálculo en local.

Cada proceso recibe entorno permitido y directorio temporal, no copia del repo ni .env. La clave TypeSafe no pasa a otros CLI. Estos aún pueden usar configuración home y almacenes auth propios; workspace temporal no significa aislamiento completo del SO. Los modos restringen herramientas/sandbox. HTTP MCP usa loopback por defecto; exponerlo requiere configuración explícita y bearer auth.

Solo se envía evidencia sintética redactada. La configuración temporal desactiva historial/audit Xerify e ignora ajustes normales de usuario/proyecto. Nunca copia .env. Datos normalizados seleccionados quedan privados bajo `.xerify/benchmarks/`, ignorado. Resúmenes generados, salidas completas, HTTP bruto, auth y claves no son artefactos públicos. Resultados se validan y jamás ejecutan como comandos. Instrucciones y tipado no prueban defensa completa contra inyección o verdad.

Las huellas registradas describen los archivos al iniciar. Durante la ejecución se añadió al arnés un import explícito de Buffer, filtrado de opciones XERIFY_* heredadas y rechazo de auto sin distinguir mayúsculas. El proceso activo conservó su código cargado; su entorno no contenía opciones XERIFY_* que anularan la configuración. Adaptadores, prompts visibles, casos y umbrales permanecieron fijos. Otra ejecución tendrá una huella de arnés distinta y debe registrarse por separado.

## Ejecuciones registradas

El piloto v1 usó seis rutas y 90 segundos. Anthropic agotó el plazo en la cuarta llamada; se omitieron las restantes y ese canal quedó incompleto. Después el propietario pidió doce direcciones sin plazo. El piloto se conserva privado y fuera de v2. Cambiar condiciones inicia otra suite; no se mezclan las mediciones.

El v2 original completó 144 llamadas. Por petición del propietario se retiraron todas las rutas Cursor del comparativo público: **72 llamadas, ninguna omitida**. Sin nuevas llamadas ni cambios de etiquetas. [Resultados](benchmarks/2026-09-18-v2-three-providers.md) · [Mediciones](../../benchmarks/2026-09-18-v2-three-providers.json). Jev **24/24**, OpenAI y Anthropic **20/24** cada uno. Ambos devolvieron unclear en support y permisos en turco. Medianas de llamadas válidas individuales: Jev **783 ms**, OpenAI **11.123 ms**, Anthropic **75.444 ms**. Tokens y cobertura en el informe; coste ausente sigue desconocido. V3 inicia pruebas nuevas con tres proveedores y no reanuda v2. El historial privado completo no cambia.
