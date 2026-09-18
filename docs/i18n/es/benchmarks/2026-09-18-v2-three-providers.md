# Resultados entre proveedores: 2026-09-18

`xerify-cross-provider-v2` · [Método y limitaciones](../benchmark.md) · [Mediciones derivadas](../../../benchmarks/2026-09-18-v2-three-providers.json)

Sin respuestas brutas. Subconjunto elegido por el propietario: 72 de 144 mediciones históricas; rutas Cursor excluidas, sin nuevas llamadas.

| Ruta                  | Coincidencias / intentos | Omitidas | Válidas | Fallos | Contexto / intentos | confirmed falsos | unclear extra | p50 / p95 válidos ms | Tokens entrada (cobertura) | Tokens salida (cobertura) | USD (cobertura)            |
| --------------------- | ------------------------ | -------- | ------- | ------ | ------------------- | ---------------- | ------------- | -------------------- | -------------------------- | ------------------------- | -------------------------- |
| openai-to-anthropic   | 10/12                    | 0        | 12      | 0      | 8/9                 | 0                | 2             | 73055 / 108271       | 178924 (12/12)             | 36477 (12/12)             | 2.6223577500000004 (12/12) |
| openai-to-typesafe    | 12/12                    | 0        | 12      | 0      | 9/9                 | 0                | 0             | 794 / 1392           | 7375 (12/12)               | 500 (12/12)               | — (0/12)                   |
| anthropic-to-openai   | 10/12                    | 0        | 12      | 0      | 8/9                 | 0                | 2             | 11296 / 19177        | 191012 (12/12)             | 2369 (12/12)              | — (0/12)                   |
| anthropic-to-typesafe | 12/12                    | 0        | 12      | 0      | 9/9                 | 0                | 0             | 766 / 1074           | 7375 (12/12)               | 500 (12/12)               | — (0/12)                   |
| typesafe-to-openai    | 10/12                    | 0        | 12      | 0      | 8/9                 | 0                | 2             | 10957 / 13510        | 191006 (12/12)             | 2241 (12/12)              | — (0/12)                   |
| typesafe-to-anthropic | 10/12                    | 0        | 12      | 0      | 8/9                 | 0                | 2             | 77798 / 129163       | 177060 (12/12)             | 32718 (12/12)             | 2.7045484999999996 (12/12) |

Los fallos operativos penalizan la entrega aunque su veredicto sea unclear. Los percentiles válidos excluyen fallos; sus tiempos separados están en JSON. Uso/coste ausente significa desconocido, no cero. Sin cobertura no es válido comparar dólares.

## Matriz de escenarios

| Escenario           | Esperado  | openai-to-anthropic | openai-to-typesafe | anthropic-to-openai | anthropic-to-typesafe | typesafe-to-openai | typesafe-to-anthropic |
| ------------------- | --------- | ------------------- | ------------------ | ------------------- | --------------------- | ------------------ | --------------------- |
| support             | confirmed | unclear             | confirmed          | unclear             | confirmed             | unclear            | unclear               |
| contradiction       | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| missing             | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |
| turkish             | confirmed | unclear             | confirmed          | unclear             | confirmed             | unclear            | unclear               |
| exception           | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| partial             | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |
| indirection         | confirmed | confirmed           | confirmed          | confirmed           | confirmed             | confirmed          | confirmed             |
| injection           | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| conflicting-sources | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |
| distractors         | confirmed | confirmed           | confirmed          | confirmed           | confirmed             | confirmed          | confirmed             |
| sql                 | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| unmeasured-outcome  | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |

Comparación con etiquetas sintéticas, no estimación de precisión en producción. Un error de esquema mide fallo de contrato, no la corrección de una respuesta no interpretable. Los mismos destinos con distintas fuentes declaradas reciben entradas idénticas. Revisar discrepancias antes de concluir.
