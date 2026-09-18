# Campaña Xerify 0.3.0

Texto de lanzamiento de Xerify 0.3.0. Los mensajes sociales aún no se han enviado. Las pruebas en vivo no demuestran precisión general ni confidence calibrada.

[Jev](jev.md) · [Tests](jev-testing.md) · [Benchmark](benchmark.md)

## Mensaje central

**Verifica antes de confiar.**

**Revisión LLM o decisión Jev. Un contrato de verificación.**

Xerify recibe una afirmación IA existente, evidencia acotada y otro proveedor de invocación. CLI, biblioteca y MCP devuelven confirmed, refuted o unclear. Nació como capa nativa de Deckent y también funciona de forma independiente.

## Anuncio

Debemos comprobar las salidas IA antes de que el software actúe. Xerify 0.3.0 incorpora Jev de TypeSafe junto a verificadores LLM. Misma evidencia acotada, misma separación de proveedores, tres resultados. JSON conserva distribución de probabilidades y confidence. Bajo los umbrales, Xerify devuelve unclear. La aplicación decide el siguiente paso; no hay llamada de respaldo oculta.

```sh
git diff --cached | xerify --json verify \
  --from openai:AUTHOR_MODEL --to jev \
  --claim "This migration preserves nullable email values"
```

Configurar TYPESAFE_API_KEY en el entorno y instalar xverify-cli@0.3.0. Si el diff no basta, aportar esquema y evidencia pertinente. Xerify funciona como CLI independiente, biblioteca TypeScript y servidor MCP. Código abierto, licencia MIT, desarrollado por Verhex.

<https://github.com/Verhex/xerify>

## Publicación breve

> Verifica antes de confiar. Xerify 0.3.0 incorpora Jev y verificadores LLM. Evidencia acotada → otro proveedor → confirmed / refuted / unclear. CLI · biblioteca · MCP. Nacido en Deckent. Código abierto.
> https://github.com/Verhex/xerify

## Medios y leyenda

- [GIF](../../../assets/readme/xerify-verification-flow.gif): 960 × 540; 16 s.
- [Jev](../../../assets/readme/xerify-verification-flow-poster.png): 1200 × 675.
- [Social](../../../assets/readme/xerify-verification-flow-social.png): 1920 × 1080.
- [LLM](../../../assets/readme/xerify-verification-flow-llm.png): 1200 × 675.

Revisión LLM o decisión Jev. Un destino por ejecución. Valores ilustrativos.

La animación muestra dos ejecuciones separadas, no una cascada. Probabilidad 0.78 y confidence 0.62 no superan 0.90 / 0.80: resultado unclear. No son cifras en vivo. Se conservan la geometría X aprobada y el diseño de papel/tinta/esmeralda.

## Descripciones del repositorio

GitHub About describe Xerify 0.3.0. Paquete y MCP describen el mismo contrato.

GitHub About:

> Verify before you trust. Cross-provider verification with bounded evidence and typed verdicts. CLI, library & MCP. LLM and Jev verification in 0.3.0.

npm:

> Verify before you trust. Cross-provider verification with LLMs and Jev. CLI, library, MCP.

MCP:

> Verify before you trust. Bounded cross-provider checks with LLMs and Jev over MCP.

## Límites de publicación

Afirmar disponibilidad solo tras publicar la versión correspondiente. Jev no genera razones ni citas; confidence no garantiza corrección. La primera comprobación valida una afirmación campaña/código, no toda la versión. El nuevo benchmark se evalúa aparte. Excluir .env, respuestas brutas y registros locales de Git/npm/sitio, medios y redes sociales.
