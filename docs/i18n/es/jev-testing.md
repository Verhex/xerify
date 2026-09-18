# Pruebas Jev y resultados en vivo

Esta página registra la cobertura y una ejecución autorizada del **2026-09-18**. Los diez casos sintéticos redactados son acotados, no un benchmark representativo de precisión, calibración o evaluación de seguridad.

## Cobertura sin conexión

`npm run check` utiliza respuestas HTTP sintéticas; no llama a TypeSafe ni carga `.env`.

|                    |                                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solicitud tipada   | State claim/context nombrado, Choice, modelo solicitado; sin clave en cuerpo                                                                                               |
| Decisiones         | `confirmed`, `refuted`, unclear nativo; elección original separada del veredicto                                                                                           |
| Umbrales           | Fronteras exactas estándar/personalizadas, justo debajo, probabilidades unitarias, empates incluso con umbrales cero                                                       |
| Validación         | Modelo/respuesta/confidence ausentes, tipo/elección inválidos, probabilidades negativas/texto, opciones faltantes/extra, suma incorrecta, elección no máxima, uso inválido |
| Uso                | Ausente/parcial/cero; sin totales o precios inventados                                                                                                                     |
| Identidad          | Mismo proveedor y procedencia desconocida rechazados antes de fetch; `ask`/request no admitidos                                                                            |
| Configuración/auth | Identidad typesafe fija, rangos, sintaxis endpoint/env, prioridad entorno, clave ausente, sondeo de presencia                                                              |
| Límites            | Entrada rechazada antes de fetch; salida excesiva unclear, código 6 y truncamiento                                                                                         |
| Transporte         | 401/403, 400/422; 408/409/429/500/503/529 reintentables; JSON vacío/inválido, red, cancelación previa/en curso, timeout; sin reintento automático                          |
| Privacidad         | Sin cuerpo HTTP bruto ni texto de excepción de red; sin clave en cuerpo; audit sin decision                                                                                |
| CLI/biblioteca     | Alias predeterminado/fijo, tres veredictos, abstención, salidas auth/límites, esquema de decisión                                                                          |
| MCP                | Banco STDIO conserva veredictos, abstención, metadatos y capacidades; HTTP local conserva decision al abstenerse                                                           |
| Ejecutor           | Vista previa sin clave/build; modo vivo rechaza falta de confirmación o clave                                                                                              |
| Distribución       | Protección dotenv en staging forzado, manifiestos npm y sitio; smoke valida CLI/MCP empaquetados                                                                           |

La regresión detectó un defecto real: el cuerpo HTTP excesivo que dejaba de ser JSON válido perdía `truncation.output` al construir el error. El núcleo conserva ahora esos metadatos tipados. El resultado sigue siendo `unclear` con `INVALID_PROVIDER_RESPONSE`.

## Escenarios en vivo

Inicio **2026-09-18 11:48:32 UTC** (14:48:32 Europe/Istanbul), mediante el manejador CLI compilado, adaptador Jev habitual y endpoint TypeSafe. Fuente declarada `openai:gpt-6`; destino `typesafe:jev-1.13.0`; modelo informado `jev-1.13.0`. Política: probabilidad **≥0.90**, confidence **≥0.80**, máximo único. Etiquetas redactadas antes de ejecutar; una llamada por caso, sin reintento, fallback, cambio de umbral o edición posterior del prompt. Solo se enviaron las diez parejas del [archivo de escenarios](../../../scripts/jev-scenarios.mjs). Orden de probabilidades: **confirmed / refuted / unclear**.

| Escenario                                    | Esperado  | Elección Jev → veredicto Xerify | Probabilidades  | Confidence | ms  | Salida |
| -------------------------------------------- | --------- | ------------------------------- | --------------- | ---------- | --- | ------ |
| Respaldo explícito                           | confirmed | confirmed → confirmed           | 1 / 0 / 0       | 1.00       | 942 | 0      |
| Contradicción explícita                      | refuted   | refuted → refuted               | 0 / 1 / 0       | 1.00       | 365 | 10     |
| Evidencia vacía                              | unclear   | unclear → unclear               | 0 / 0 / 1       | 1.00       | 317 | 11     |
| Evidencia no relacionada                     | unclear   | unclear → unclear               | 0 / 0 / 1       | 1.00       | 371 | 11     |
| Afirmación compuesta parcialmente respaldada | unclear   | unclear → unclear               | 0 / 0 / 1       | 0.99       | 336 | 11     |
| Contradicción material compuesta             | refuted   | refuted → refuted               | 0 / 1 / 0       | 1.00       | 351 | 10     |
| Respaldo en turco                            | confirmed | confirmed → confirmed           | 1 / 0 / 0       | 0.99       | 308 | 0      |
| Eliminación de columna SQL                   | refuted   | refuted → refuted               | 0 / 1 / 0       | 1.00       | 597 | 10     |
| Instrucción de veredicto incrustada          | refuted   | refuted → refuted               | 0 / 1 / 0       | 1.00       | 360 | 10     |
| Código del umbral de confidence              | confirmed | confirmed → confirmed           | 0.99 / 0.01 / 0 | 0.98       | 335 | 0      |

Los diez resultados coincidieron: **3 confirmed, 4 refuted, 3 unclear**. Todos con `failure: null` y sin truncamiento. Uso comunicado: **5.151 tokens de entrada y 417 de salida**. `totalTokens` y `costUsd` siguieron null en cada resultado; no se estimaron dólares. Tiempos **308–942 ms** en una sola ejecución, no benchmark de latencia ni promesa de servicio. Ningún caso activó abstención por umbral: los tres unclear eran elecciones nativas. Umbrales y empates se comprueban determinísticamente. Una instrucción incrustada se ignoró; resistencia general a inyección sin medir. Probabilidad 1 es salida de modelo, no prueba de certeza. La tabla es una síntesis redactada; claves, respuestas brutas y registros privados no se commitean. La [comprobación de campaña](jev.md) anterior fue aparte y no entra en estos totales.

## Reproducir deliberadamente

Ver toda la evidencia y etiquetas sin clave ni llamada:

```sh
node scripts/live-jev-scenarios.mjs
```

Con aprobación del propietario para posibles cargos, compilar y ejecutar desde fuentes:

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/live-jev-scenarios.mjs --live
```

Node 20.6+ admite env-file explícito. El ejecutor fija jev-1.13.0, realiza como máximo diez evaluaciones secuenciales y para al primer fallo técnico/auth. Usa configuración temporal con historial desactivado, ignora ajustes normales de usuario/proyecto y pasa solo la clave TypeSafe al entorno CLI. Nunca copia .env. Cada solicitud tiene timeout de 30 segundos. Metadatos normalizados seleccionados se guardan en un archivo privado fechado bajo `.xerify/live-jev-scenarios/`, ignorado, sin respuestas HTTP brutas ni evidencia. Salidas del ejecutor: 0 todas coinciden, 11 discrepancia semántica, 1 ejecución incompleta/fallida, 2 falta confirmación, 3 falta clave. Se conservan las salidas individuales de verificación. Una discrepancia exige análisis, no repetir hasta coincidir. El ejecutor no forma parte de checks normales, smoke de instalación ni release.

## Interpretar los fallos

|                                       | CLI exit |                                                                         |
| ------------------------------------- | -------- | ----------------------------------------------------------------------- |
| confirmed                             | 0        | Respaldado por la evidencia; revisar alcance                            |
| refuted                               | 10       | Contradicción elegida; revisar afirmación                               |
| unclear, `failure: null`              | 11       | Evidencia insuficiente/ambigua o abstención; revisar decision y ampliar |
| SAME_PROVIDER / PROVENANCE_UNPROVABLE | 2        | Corregir identidad; no se envía evaluación                              |
| AUTH_UNAVAILABLE / 401 / 403          | 3        | Error auth, no resultado de verificación; corregir credenciales         |
| TIMEOUT / CANCELLED                   | 4        | unclear operativo; sin reintento automático                             |
| PROVIDER_FAILURE                      | 5        | unclear operativo; reintentabilidad solo como metadato                  |
| INVALID_PROVIDER_RESPONSE             | 6        | unclear operativo; revisar límites/compatibilidad                       |

Distinguir error técnico y abstención con `failure`. Revisar `decision.choice`, probabilidad, confidence y política para interpretar umbrales. Ejemplos y MCP en la [guía Jev](jev.md).
