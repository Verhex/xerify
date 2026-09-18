# Jev con Xerify 0.3.0

Jev es el modelo de decisiones tipadas de TypeSafe. Xerify aporta la capa de verificación: evidencia acotada, separación de proveedores, veredictos estables e historial. Ambos se centran en decisiones utilizables por software, pero resuelven partes diferentes del problema.

Xerify 0.3.0 incluye soporte para Jev. El adaptador se prueba con respuestas HTTP sintéticas. Una comprobación de campaña autorizada y diez escenarios en vivo independientes finalizaron el 2026-09-18. Véanse [cobertura y resultados](jev-testing.md). La precisión del dominio y la calibración de umbrales siguen sin medirse.

## Configurar la clave

Desde las fuentes, ejecutar `npm ci` y `npm run build`. Copiar `.env.example` a `.env` y establecer `TYPESAFE_API_KEY` localmente. Git ignora `.env` y npm la excluye. Mantenerla privada; en POSIX usar `chmod 600 .env`. Nunca incluir claves en evidencia ni argumentos de comandos.

La `.env` real pertenece únicamente al directorio principal de trabajo del propietario: ninguna rama Git, tampoco `main`, otro worktree, paquete npm, archivo fuente, carga del sitio o contexto Docker. Las exclusiones npm cubren también archivos anidados en directorios permitidos. Docker excluye tanto archivos raíz como anidados. Los archivos fuente de Git excluyen rutas dotenv. Solo `.env.example` raíz con asignaciones vacías se admite en el índice Git.

`npm run secrets:check` comprueba el índice Git, árbol del sitio y manifiesto real de npm dry-run sin leer dotenv privados. Se ejecuta en `check` y `prepack`; el smoke de instalación también comprueba el manifiesto empaquetado. Pages verifica la salida antes de subirla. El hook pre-commit local bloquea incluso dotenv preparados con `git add -f`. Tras revisar hooks existentes, activarlo en un checkout nuevo con `git config --local core.hooksPath .githooks`; ya está activo en el del propietario. Los hooks pueden omitirse, por eso CI y exclusiones de paquete siguen siendo controles separados. No copiar credenciales a otros archivos ni entregar `.env` como evidencia.

Xerify lee el entorno del proceso; **no carga automáticamente** `.env`. Cargarla explícitamente con `--env-file` de Node 20.6+; se recomienda Node 24:

```sh
node --env-file=.env ./dist/cli/entry.js --json providers probe --provider jev
```

Solo informa de la presencia de la clave. No valida la clave ni llama a TypeSafe. Una variable de proceso existente tiene prioridad sobre el archivo.

El siguiente comando realiza una evaluación potencialmente facturable:

```sh
git diff --cached | node --env-file=.env ./dist/cli/entry.js --json verify \
  --from openai:AUTHOR_MODEL \
  --to jev \
  --claim "This migration preserves existing data"
```

Con la clave ya en el entorno, el comando instalado es `xerify --json verify --from openai:AUTHOR_MODEL --to jev --claim "…"`. Proporcionar evidencia suficiente; un diff vacío no demuestra corrección. Siguen aplicándose los ajustes existentes de captura del historial.

## Identidad y operaciones admitidas

El ID del adaptador y el tipo de configuración predeterminados son `jev`. El proveedor de invocación es `typesafe`, porque controla endpoint directo, autenticación y facturación. `--to jev` se expande a `typesafe:jev-latest`; `--to jev:jev-1.13.0` fija una versión. La normalización también se aplica a `--from`: los alias no eluden la prohibición del mismo proveedor. `typesafe:MODEL_ID` explícito también funciona.

Biblioteca y MCP usan `{ "provider": "typesafe", "model": "jev-latest" }` en `to`. El alias solicitado permanece en `to.model`; `decision.model` registra el modelo declarado en la respuesta. Jev solo admite `verify`. `ask` y `request` devuelven `UNSUPPORTED` antes de HTTP. Las capacidades exponen `operations: ["verify"]`; adaptadores sin este campo opcional mantienen su comportamiento. Proveedores distintos no prueban linajes independientes ni corrección.

## Política de decisión

Xerify envía `{model, state: {claim, context}, questions: {verdict: …}}` a `POST https://api.typesafe.ai/v1/systemone`. Una pregunta Choice intenta refutar la afirmación con la evidencia suministrada; sus criterios son `confirmed`, `refuted` y `unclear`.

La respuesta válida conserva su elección solo si la probabilidad seleccionada es al menos **0.90**, la confidence al menos **0.80**, y el máximo no está empatado. En caso contrario el veredicto es `unclear`. Una elección nativa `unclear` sigue igual. Bajo los umbrales, `failure: null` y salida 11. Son heurísticas configurables, no garantías de precisión calibradas independientemente. La confidence de TypeSafe resume la distribución y no equivale a la probabilidad de una opción.

Fragmento sintético ilustrativo:

```json
{
  "verdict": "refuted",
  "decision": {
    "kind": "choice",
    "model": "jev-1.13.0",
    "choice": "refuted",
    "probabilities": { "confirmed": 0.01, "refuted": 0.98, "unclear": 0.01 },
    "confidence": 0.95,
    "policy": { "minProbability": 0.9, "minConfidence": 0.8 }
  }
}
```

`decision` es una adición opcional al esquema versión 1. Las probabilidades describen la elección original aunque el resultado final se abstenga. Las tres son obligatorias, deben estar en [0,1], sumar uno con tolerancia 0.000001 y la elegida debe ser un máximo. Las restricciones entre campos se aplican en ejecución además del JSON Schema exportado. Respuestas inválidas y fallos de transporte conservan errores tipados y códigos existentes. No hay reintentos ni llamadas de respaldo automáticos.

Jev no genera explicaciones ni citas de evidencia. Xerify aporta un resumen de plantilla claramente identificado y limitaciones, con findings/evidence vacíos. El tipado no prueba la verdad. Los metadatos opcionales permanecen en el historial normalizado según la política de captura; audit JSONL no conserva el objeto decision. El uso se informa sin estimar costes.

## Configuración, biblioteca y MCP

El adaptador predeterminado no necesita configuración de proveedor. Para modificar la política en `.xerify/xverify-config.json`, integrar esta entrada con la configuración existente:

```json
{
  "providers": {
    "jev": {
      "kind": "jev",
      "apiKeyEnvironment": "TYPESAFE_API_KEY",
      "minProbability": 0.9,
      "minConfidence": 0.8
    }
  }
}
```

Las credenciales de entorno prevalecen sobre un `apiKey` literal opcional. El enmascaramiento diagnóstico y permisos exclusivos del propietario coinciden con los otros adaptadores API directos. Un `endpoint` opcional admite un proxy fiable o servidor de pruebas local; cambiarlo envía clave y evidencia a esa URL. Si cambia el servicio de invocación, declarar un adaptador gateway separado. Cuerpo y respuesta HTTP tienen límites de bytes; una entrada excesiva se rechaza antes de consumir una llamada pagada. Los límites de tokens del proveedor siguen siendo independientes.

```ts
import { executeVerify, JevAdapter, ProviderRegistry, VerifyRequestSchema } from 'xerify-cli';

const result = await executeVerify(
  VerifyRequestSchema.parse({
    from: { provider: 'openai', model: 'AUTHOR_MODEL', provenance: 'declared' },
    to: { provider: 'typesafe', model: 'jev-latest' },
    claim: 'The migration preserves nullable values',
    context: 'ALTER TABLE users ALTER name SET NOT NULL;'
  }),
  new ProviderRegistry([new JevAdapter()])
);
console.log(result.verdict, result.decision);
```

Para MCP, exponer `TYPESAFE_API_KEY` en el entorno del servidor y llamar `xerify_verify` con la misma solicitud estructurada. Desde fuentes, STDIO permite carga explícita: `node --env-file=.env ./dist/cli/entry.js mcp stdio`. No se requiere otra herramienta MCP.

## Skills de agentes

Instalar el skill oficial para Codex, Claude Code y Cursor con un único método:

```sh
npx skills add typesafe-ai/skills --skill typesafe-ai --agent codex claude-code cursor --yes
```

Es la selección de varios agentes del comando recomendado por TypeSafe para agentes distintos de Claude. Instala archivos, no integración de modelo ni credenciales API. No instalar además el plugin Claude marketplace para la misma configuración. Codex y Cursor usan `.agents/skills/typesafe-ai`; Claude Code usa `.claude/skills/typesafe-ai`, enlazado a la copia común. El instalador registra la fuente en `skills-lock.json`; `experimental_install` puede restaurar las versiones fijadas.

Este checkout incluye un complemento local `.agents/skills/xerify-jev`, enlazado a Claude Code. Describe identidad, política, esquema y validación sin editar el skill oficial. Ambas instalaciones y el enlace de `AGENTS.md` local son estado de desarrollo ignorado, fuera de npm. El complemento es local; restaurar el lockfile oficial no lo recrea. En Codex elegir `$typesafe-ai` para TypeSafe o `$xerify-jev` para esta integración. Los nuevos skills aparecen en el siguiente turno; otro agente activo puede necesitar recargar el proyecto.

## Revisión de documentación y alcance

El skill oficial y la documentación en vivo se revisaron el 2026-09-18: introducción, State, Choice, HTTP API, confidence, modelos, limitaciones y cookbook citation-check. El archivo descargado aportado coincidía byte por byte con GitHub oficial.

| Área           | Resultado                                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Protocolo      | Conservar HTTP directo, bearer auth, state nombrado y mapeo Choice; no se necesita envoltura chat-completions.                                                                      |
| Pregunta       | Nombrar `claim` y `context`, evaluar su relación; falta de respaldo no equivale a contradicción.                                                                                    |
| Política       | 0.90 / 0.80 configurables; no son requisitos TypeSafe ni precisión medida.                                                                                                          |
| Explicabilidad | Resumen del adaptador y evidence/findings vacíos; Jev no genera justificación.                                                                                                      |
| Validación     | HTTP sintético comprueba el contrato. Campaña y diez escenarios coincidieron con lo esperado; precisión de dominio, calibración y resistencia general a ataques siguen sin medirse. |

Una tarea útil para Jev es un juicio focalizado fuente-afirmación, como comprobar si una migración elimina `email`. «Esta versión es segura, rápida y retrocompatible» mezcla dimensiones: separar verificaciones con evidencia adecuada o elegir explícitamente un LLM para razonamiento amplio. Xerify 0.3.0 no divide afirmaciones ni agrupa verificaciones automáticamente.

Mantener aritmética exacta, comparaciones de fechas, conteos y búsquedas deterministas en código. Aportar fragmentos pertinentes, no todo el repositorio. TypeSafe documenta limitaciones de Jev 1.13 sobre precisión numérica, indirección, contexto distractor y contenido adversarial. No suponer que límites o afirmaciones de rendimiento se transfieren sin cambios a modelos futuros. Las fronteras del prompt reducen ambigüedad, pero no prueban defensa contra inyección.

`jev-latest` facilita empezar; fijar versión al evaluar umbrales para evitar cambios silenciosos de alias. Probar respaldo, contradicción, evidencia ausente/mixta y casos adversariales del dominio antes de usar confidence para enrutar. En este repositorio, las evaluaciones en vivo requieren aprobación del propietario.

## Dirección del producto y fuentes

La composición útil: Jev toma la decisión tipada, Xerify aporta el contrato de verificación. Escalado automático, evaluadores deterministas, revisión humana y conjuntos de proveedores son futuro posible, no funciones 0.3.0. Una aplicación puede pedir explícitamente un LLM aparte tras `unclear`; Xerify no gasta silenciosamente en otro proveedor.

Fuentes oficiales revisadas el 2026-09-18:

[Introduction](https://docs.typesafe.ai/introduction) · [Skill](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md) · [State](https://docs.typesafe.ai/concepts/state) · [Choice](https://docs.typesafe.ai/primitives/choice) · [Citation checks](https://docs.typesafe.ai/cookbooks/citation_check) · [Model limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13) · [HTTP API](https://docs.typesafe.ai/api) · [Confidence](https://docs.typesafe.ai/confidence) · [Models](https://docs.typesafe.ai/models)

Véanse [ADR 0003](../../decisions/0003-typed-decision-verifiers.md) y el [borrador de anuncio](launch-0.3.0.md).

## Primera comprobación de campaña en vivo

El 2026-09-18 el propietario autorizó una verificación CLI con `--to jev`. Autor declarado: `openai:gpt-6`; destino: `typesafe:jev-latest`; modelo devuelto: `jev-1.13.0`. Solo se suministraron un fragmento de código y frase de campaña de 490 bytes. La comprobación preguntó si la implementación respalda que bajar de cualquiera de los dos mínimos configurados produce `unclear`.

Resultado normalizado: `confirmed`, salida 0; `confirmed=0.91`, `refuted=0.06`, `unclear=0.03`, confidence `0.87`. Política `0.90` / `0.80`. Xerify informó 882 ms, 649 tokens de entrada, 41 de salida, sin truncamiento ni fallo. No se informó coste.

Esto registra una llamada correcta y un juicio semántico acotado. No valida toda la versión ni mide precisión, calibración, distribuciones de latencia o resistencia a inyección. No hubo segundo proveedor ni reintento. Las credenciales permanecieron en `.env` local; respuestas brutas y registros locales no son materiales de publicación. Las cifras son una síntesis redactada, no una respuesta bruta commitada.
